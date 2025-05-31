"""
Tests for metrics collection and monitoring functionality.
"""

import pytest
import time
from unittest.mock import patch, MagicMock
from metrics import MetricsCollector, PerformanceBaseline, MetricPoint


class TestMetricsCollector:
    """Test MetricsCollector functionality."""
    
    def setup_method(self):
        """Setup for each test method."""
        self.metrics = MetricsCollector(max_history=100)
    
    def test_metrics_initialization(self):
        """Test metrics collector initialization."""
        assert isinstance(self.metrics.metrics, dict)
        assert isinstance(self.metrics.counters, dict)
        assert isinstance(self.metrics.gauges, dict)
        assert isinstance(self.metrics.histograms, dict)
        assert self.metrics.baseline is None
        assert self.metrics.max_history == 100
    
    def test_record_counter(self):
        """Test counter metric recording."""
        self.metrics.record_counter("test_counter", 5.0, {"label": "value"})
        
        # Check counter value
        key = "test_counter{label=value}"
        assert self.metrics.counters[key] == 5.0
        
        # Check metric point recorded
        assert len(self.metrics.metrics[key]) == 1
        point = self.metrics.metrics[key][0]
        assert point.value == 5.0
        assert point.labels == {"label": "value"}
        
        # Test increment
        self.metrics.record_counter("test_counter", 3.0, {"label": "value"})
        assert self.metrics.counters[key] == 8.0
    
    def test_record_gauge(self):
        """Test gauge metric recording."""
        self.metrics.record_gauge("test_gauge", 42.0, {"type": "test"})
        
        key = "test_gauge{type=test}"
        assert self.metrics.gauges[key] == 42.0
        assert len(self.metrics.metrics[key]) == 1
        
        # Test overwrite
        self.metrics.record_gauge("test_gauge", 100.0, {"type": "test"})
        assert self.metrics.gauges[key] == 100.0
    
    def test_record_histogram(self):
        """Test histogram metric recording."""
        values = [1.0, 2.0, 3.0, 4.0, 5.0]
        for value in values:
            self.metrics.record_histogram("test_histogram", value)
        
        assert len(self.metrics.histograms["test_histogram"]) == 5
        assert self.metrics.histograms["test_histogram"] == values
    
    def test_record_response_time(self):
        """Test HTTP response time recording."""
        self.metrics.record_response_time("/test", 0.5, 200)
        
        # Check multiple metrics were recorded
        assert "http_request_duration_seconds" in str(self.metrics.histograms.keys())
        assert "http_requests_total" in str(self.metrics.counters.keys())
        
        # Test error recording
        self.metrics.record_response_time("/test", 1.0, 500)
        assert "http_request_errors_total" in str(self.metrics.counters.keys())
    
    def test_get_percentile(self):
        """Test percentile calculation."""
        values = [i * 0.1 for i in range(100)]  # 0.0 to 9.9
        for value in values:
            self.metrics.record_histogram("test_percentile", value)
        
        p50 = self.metrics.get_percentile("test_percentile", 50)
        p95 = self.metrics.get_percentile("test_percentile", 95)
        p99 = self.metrics.get_percentile("test_percentile", 99)
        
        assert p50 is not None
        assert p95 is not None
        assert p99 is not None
        assert p50 < p95 < p99
    
    def test_get_error_rate(self):
        """Test error rate calculation."""
        # Record some successful requests
        for i in range(10):
            self.metrics.record_response_time("/test", 0.1, 200)
        
        # Record some errors
        for i in range(2):
            self.metrics.record_response_time("/test", 0.1, 500)
        
        error_rate = self.metrics.get_error_rate()
        # Should be approximately 16.67% (2 errors out of 12 total)
        assert 15.0 <= error_rate <= 18.0
    
    def test_establish_baseline(self):
        """Test baseline establishment."""
        # Record some sample data
        for i in range(10):
            self.metrics.record_response_time("/test", 0.1 + i * 0.01, 200)
        
        baseline = self.metrics.establish_baseline()
        
        assert isinstance(baseline, PerformanceBaseline)
        assert baseline.response_time_p50 > 0
        assert baseline.response_time_p95 > 0
        assert baseline.response_time_p99 > 0
        assert baseline.error_rate >= 0
        assert baseline.throughput >= 0
        assert baseline.timestamp > 0
        assert self.metrics.baseline == baseline
    
    def test_check_performance_regression(self):
        """Test performance regression detection."""
        # First establish baseline with good performance
        for i in range(10):
            self.metrics.record_response_time("/test", 0.1, 200)
        
        baseline = self.metrics.establish_baseline()
        
        # Clear metrics and add slower responses
        self.metrics.histograms.clear()
        self.metrics.counters.clear()
        for i in range(10):
            self.metrics.record_response_time("/test", 0.5, 200)  # 5x slower
        
        regression_check = self.metrics.check_performance_regression(threshold_percent=20.0)
        
        assert regression_check["status"] == "regression_detected"
        assert len(regression_check["regressions"]) > 0
        
        # Check that regression details are included
        regression = regression_check["regressions"][0]
        assert "metric" in regression
        assert "baseline" in regression
        assert "current" in regression
    
    def test_prometheus_metrics_export(self):
        """Test Prometheus format metrics export."""
        self.metrics.record_counter("test_counter", 5.0)
        self.metrics.record_gauge("test_gauge", 42.0)
        self.metrics.record_histogram("test_histogram", 1.5)
        
        prometheus_output = self.metrics.get_prometheus_metrics()
        
        assert "test_counter" in prometheus_output
        assert "test_gauge" in prometheus_output
        assert "test_histogram" in prometheus_output
        assert "5" in prometheus_output
        assert "42" in prometheus_output
    
    def test_key_parsing(self):
        """Test metric key creation and parsing."""
        # Test key without labels
        key = self.metrics._make_key("test_metric", None)
        assert key == "test_metric"
        
        name, labels = self.metrics._parse_key(key)
        assert name == "test_metric"
        assert labels == {}
        
        # Test key with labels
        key = self.metrics._make_key("test_metric", {"label1": "value1", "label2": "value2"})
        assert "test_metric{" in key
        assert "label1=value1" in key
        assert "label2=value2" in key
        
        name, labels = self.metrics._parse_key(key)
        assert name == "test_metric"
        assert labels == {"label1": "value1", "label2": "value2"}


class TestPerformanceBaseline:
    """Test PerformanceBaseline functionality."""
    
    def test_baseline_creation(self):
        """Test baseline creation."""
        baseline = PerformanceBaseline(
            response_time_p50=0.1,
            response_time_p95=0.5,
            response_time_p99=1.0,
            error_rate=2.5,
            throughput=100.0,
            timestamp=time.time()
        )
        
        assert baseline.response_time_p50 == 0.1
        assert baseline.response_time_p95 == 0.5
        assert baseline.response_time_p99 == 1.0
        assert baseline.error_rate == 2.5
        assert baseline.throughput == 100.0
        assert baseline.timestamp > 0


class TestMetricPoint:
    """Test MetricPoint functionality."""
    
    def test_metric_point_creation(self):
        """Test metric point creation."""
        point = MetricPoint(
            timestamp=time.time(),
            value=42.0,
            labels={"test": "value"}
        )
        
        assert point.timestamp > 0
        assert point.value == 42.0
        assert point.labels == {"test": "value"}
        
        # Test default labels
        point_no_labels = MetricPoint(timestamp=time.time(), value=1.0)
        assert point_no_labels.labels == {}