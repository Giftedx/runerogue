"""
RuneRogue Metrics Collection Module

Implements performance monitoring and metrics collection for self-building process.
"""

import time
import threading
from collections import defaultdict, deque
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
import logging

logger = logging.getLogger(__name__)


@dataclass
class MetricPoint:
    """A single metric measurement."""
    timestamp: float
    value: float
    labels: Dict[str, str] = field(default_factory=dict)


@dataclass
class PerformanceBaseline:
    """Performance baseline for comparison."""
    response_time_p50: float
    response_time_p95: float
    response_time_p99: float
    error_rate: float
    throughput: float
    timestamp: float


class MetricsCollector:
    """Collects and aggregates application metrics."""
    
    def __init__(self, max_history: int = 1000):
        self.max_history = max_history
        self.metrics: Dict[str, deque] = defaultdict(lambda: deque(maxlen=max_history))
        self.counters: Dict[str, float] = defaultdict(float)
        self.gauges: Dict[str, float] = defaultdict(float)
        self.histograms: Dict[str, List[float]] = defaultdict(list)
        self.baseline: Optional[PerformanceBaseline] = None
        self._lock = threading.Lock()
        
    def record_counter(self, name: str, value: float = 1.0, labels: Optional[Dict[str, str]] = None):
        """Record a counter metric."""
        with self._lock:
            key = self._make_key(name, labels)
            self.counters[key] += value
            self.metrics[key].append(MetricPoint(time.time(), self.counters[key], labels or {}))
            
    def record_gauge(self, name: str, value: float, labels: Optional[Dict[str, str]] = None):
        """Record a gauge metric."""
        with self._lock:
            key = self._make_key(name, labels)
            self.gauges[key] = value
            self.metrics[key].append(MetricPoint(time.time(), value, labels or {}))
            
    def record_histogram(self, name: str, value: float, labels: Optional[Dict[str, str]] = None):
        """Record a histogram metric."""
        with self._lock:
            key = self._make_key(name, labels)
            self.histograms[key].append(value)
            # Keep only recent values for histogram
            if len(self.histograms[key]) > self.max_history:
                self.histograms[key] = self.histograms[key][-self.max_history:]
            self.metrics[key].append(MetricPoint(time.time(), value, labels or {}))
            
    def record_response_time(self, endpoint: str, duration: float, status_code: int):
        """Record HTTP response time and status."""
        labels = {"endpoint": endpoint, "status": str(status_code)}
        self.record_histogram("http_request_duration_seconds", duration, labels)
        self.record_counter("http_requests_total", 1.0, labels)
        
        if status_code >= 400:
            self.record_counter("http_request_errors_total", 1.0, labels)
            
    def get_percentile(self, name: str, percentile: float, labels: Optional[Dict[str, str]] = None) -> Optional[float]:
        """Calculate percentile for histogram metric."""
        # If no labels provided, try to find any histogram with this name
        if labels is None:
            values = []
            for key, histogram_values in self.histograms.items():
                if name in key:
                    values.extend(histogram_values)
        else:
            key = self._make_key(name, labels)
            values = self.histograms.get(key, [])
            
        if not values:
            return None
            
        sorted_values = sorted(values)
        index = int(len(sorted_values) * percentile / 100)
        return sorted_values[min(index, len(sorted_values) - 1)]
        
    def get_error_rate(self, endpoint: Optional[str] = None, window_seconds: int = 300) -> float:
        """Calculate error rate over time window."""
        cutoff_time = time.time() - window_seconds
        
        total_requests = 0
        error_requests = 0
        
        # Get the latest counter values for total requests
        for key, value in self.counters.items():
            if "http_requests_total" in key:
                if endpoint and f"endpoint={endpoint}" not in key:
                    continue
                total_requests += value
                        
        # Get the latest counter values for error requests
        for key, value in self.counters.items():
            if "http_request_errors_total" in key:
                if endpoint and f"endpoint={endpoint}" not in key:
                    continue
                error_requests += value
                        
        return (error_requests / total_requests * 100) if total_requests > 0 else 0.0
        
    def establish_baseline(self) -> PerformanceBaseline:
        """Establish performance baseline from recent metrics."""
        p50 = self.get_percentile("http_request_duration_seconds", 50) or 0.0
        p95 = self.get_percentile("http_request_duration_seconds", 95) or 0.0
        p99 = self.get_percentile("http_request_duration_seconds", 99) or 0.0
        error_rate = self.get_error_rate()
        
        # Calculate throughput (requests per second over last 5 minutes)
        throughput = self._calculate_throughput(300)
        
        self.baseline = PerformanceBaseline(
            response_time_p50=p50,
            response_time_p95=p95,
            response_time_p99=p99,
            error_rate=error_rate,
            throughput=throughput,
            timestamp=time.time()
        )
        
        logger.info(f"Established performance baseline: {self.baseline}")
        return self.baseline
        
    def check_performance_regression(self, threshold_percent: float = 20.0) -> Dict[str, Any]:
        """Check for performance regression against baseline."""
        if not self.baseline:
            return {"status": "no_baseline", "message": "No baseline established"}
            
        current_p95 = self.get_percentile("http_request_duration_seconds", 95) or 0.0
        current_error_rate = self.get_error_rate()
        current_throughput = self._calculate_throughput(300)
        
        regressions = []
        
        # Check response time regression
        if self.baseline.response_time_p95 > 0:
            p95_increase = ((current_p95 - self.baseline.response_time_p95) / 
                           self.baseline.response_time_p95) * 100
            if p95_increase > threshold_percent:
                regressions.append({
                    "metric": "response_time_p95",
                    "baseline": self.baseline.response_time_p95,
                    "current": current_p95,
                    "increase_percent": p95_increase
                })
                
        # Check error rate regression
        error_rate_increase = current_error_rate - self.baseline.error_rate
        if error_rate_increase > threshold_percent / 10:  # More sensitive for error rates
            regressions.append({
                "metric": "error_rate",
                "baseline": self.baseline.error_rate,
                "current": current_error_rate,
                "increase_percent": error_rate_increase
            })
            
        # Check throughput regression
        if self.baseline.throughput > 0:
            throughput_decrease = ((self.baseline.throughput - current_throughput) / 
                                 self.baseline.throughput) * 100
            if throughput_decrease > threshold_percent:
                regressions.append({
                    "metric": "throughput",
                    "baseline": self.baseline.throughput,
                    "current": current_throughput,
                    "decrease_percent": throughput_decrease
                })
                
        return {
            "status": "regression_detected" if regressions else "performance_ok",
            "regressions": regressions,
            "baseline_age_hours": (time.time() - self.baseline.timestamp) / 3600
        }
        
    def get_prometheus_metrics(self) -> str:
        """Export metrics in Prometheus format."""
        lines = []
        
        # Export counters
        for key, value in self.counters.items():
            metric_name, labels = self._parse_key(key)
            label_str = self._format_labels(labels) if labels else ""
            lines.append(f"{metric_name}{label_str} {value}")
            
        # Export gauges
        for key, value in self.gauges.items():
            metric_name, labels = self._parse_key(key)
            label_str = self._format_labels(labels) if labels else ""
            lines.append(f"{metric_name}{label_str} {value}")
            
        # Export histogram percentiles
        for key, values in self.histograms.items():
            if values:
                metric_name, labels = self._parse_key(key)
                base_labels = labels.copy() if labels else {}
                
                for percentile in [50, 95, 99]:
                    p_value = self.get_percentile(metric_name, percentile, labels)
                    if p_value is not None:
                        p_labels = base_labels.copy()
                        p_labels["quantile"] = f"0.{percentile:02d}"
                        label_str = self._format_labels(p_labels)
                        lines.append(f"{metric_name}{label_str} {p_value}")
                        
        return "\n".join(lines)
        
    def _calculate_throughput(self, window_seconds: int) -> float:
        """Calculate requests per second over time window."""
        cutoff_time = time.time() - window_seconds
        total_requests = 0
        
        # Count individual request events in the time window
        for key, points in self.metrics.items():
            if "http_requests_total" in key:
                for point in points:
                    if point.timestamp >= cutoff_time:
                        total_requests += 1  # Count each request event
                        
        return total_requests / window_seconds if window_seconds > 0 else 0.0
        
    def _make_key(self, name: str, labels: Optional[Dict[str, str]]) -> str:
        """Create a unique key for metric with labels."""
        if not labels:
            return name
        label_parts = [f"{k}={v}" for k, v in sorted(labels.items())]
        return f"{name}{{{'|'.join(label_parts)}}}"
        
    def _parse_key(self, key: str) -> tuple:
        """Parse key back into name and labels."""
        if "{" not in key:
            return key, {}
        name, label_part = key.split("{", 1)
        label_part = label_part.rstrip("}")
        labels = {}
        if label_part:
            for part in label_part.split("|"):
                k, v = part.split("=", 1)
                labels[k] = v
        return name, labels
        
    def _format_labels(self, labels: Dict[str, str]) -> str:
        """Format labels for Prometheus output."""
        if not labels:
            return ""
        label_parts = [f'{k}="{v}"' for k, v in sorted(labels.items())]
        return "{" + ",".join(label_parts) + "}"


# Global metrics collector instance
metrics = MetricsCollector()