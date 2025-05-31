"""
Tests for monitoring middleware functionality.
"""

import pytest
import time
from unittest.mock import patch, MagicMock, call
from flask import Flask
from monitoring import PerformanceMiddleware, monitor_performance
from metrics import metrics


class TestPerformanceMiddleware:
    """Test PerformanceMiddleware functionality."""
    
    def setup_method(self):
        """Setup for each test method."""
        self.app = Flask(__name__)
        self.middleware = PerformanceMiddleware()
        
        # Clear metrics before each test
        metrics.metrics.clear()
        metrics.counters.clear()
        metrics.gauges.clear()
        metrics.histograms.clear()
    
    def test_middleware_initialization(self):
        """Test middleware initialization."""
        app = Flask(__name__)
        middleware = PerformanceMiddleware(app)
        
        assert middleware.app == app
        assert middleware._system_metrics_thread is not None
        assert hasattr(middleware, '_stop_event')
    
    def test_request_monitoring(self):
        """Test HTTP request monitoring."""
        self.middleware.init_app(self.app)
        
        @self.app.route('/test')
        def test_endpoint():
            time.sleep(0.01)  # Small delay to test timing
            return 'test'
        
        with self.app.test_client() as client:
            response = client.get('/test')
            assert response.status_code == 200
        
        # Check that metrics were recorded
        found_request_metric = False
        found_duration_metric = False
        
        for key in metrics.counters.keys():
            if 'http_requests_total' in key and 'endpoint=test_endpoint' in key:
                found_request_metric = True
                
        for key in metrics.histograms.keys():
            if 'http_request_duration_seconds' in key:
                found_duration_metric = True
                
        assert found_request_metric, "HTTP request counter not found"
        assert found_duration_metric, "HTTP duration histogram not found"
    
    def test_error_monitoring(self):
        """Test error request monitoring."""
        self.middleware.init_app(self.app)
        
        @self.app.route('/error')
        def error_endpoint():
            return 'error', 500
        
        with self.app.test_client() as client:
            response = client.get('/error')
            assert response.status_code == 500
        
        # Check that error metrics were recorded
        found_error_metric = False
        
        for key in metrics.counters.keys():
            if 'http_request_errors_total' in key:
                found_error_metric = True
                break
                
        assert found_error_metric, "HTTP error counter not found"
    
    def test_exception_monitoring(self):
        """Test exception monitoring."""
        self.middleware.init_app(self.app)
        
        @self.app.route('/exception')
        def exception_endpoint():
            raise ValueError("Test exception")
        
        with self.app.test_client() as client:
            response = client.get('/exception')
            # Flask handles the exception and returns 500
            assert response.status_code == 500
        
        # Check that exception metrics were recorded
        found_exception_metric = False
        
        for key in metrics.counters.keys():
            if 'http_request_exceptions_total' in key and 'ValueError' in key:
                found_exception_metric = True
                break
                
        assert found_exception_metric, "HTTP exception counter not found"
    
    @patch('monitoring.psutil.cpu_percent')
    @patch('monitoring.psutil.virtual_memory')
    @patch('monitoring.psutil.disk_usage')
    def test_system_metrics_collection(self, mock_disk, mock_memory, mock_cpu):
        """Test system metrics collection."""
        # Mock system stats
        mock_cpu.return_value = 25.5
        mock_memory.return_value = MagicMock(
            used=1024*1024*1024,  # 1GB
            percent=50.0,
            available=1024*1024*1024  # 1GB
        )
        mock_disk.return_value = MagicMock(
            used=10*1024*1024*1024,  # 10GB
            total=20*1024*1024*1024,  # 20GB
            free=10*1024*1024*1024   # 10GB
        )
        
        middleware = PerformanceMiddleware()
        
        # Manually trigger system metrics collection
        middleware._collect_system_metrics()
        
        # Check that system metrics were recorded
        cpu_recorded = any('system_cpu_usage_percent' in key for key in metrics.gauges.keys())
        memory_recorded = any('system_memory_usage_bytes' in key for key in metrics.gauges.keys())
        disk_recorded = any('system_disk_usage_bytes' in key for key in metrics.gauges.keys())
        
        assert cpu_recorded, "CPU metrics not recorded"
        assert memory_recorded, "Memory metrics not recorded"
        assert disk_recorded, "Disk metrics not recorded"
    
    def test_middleware_cleanup(self):
        """Test middleware cleanup."""
        middleware = PerformanceMiddleware()
        middleware.start_system_metrics_collection()
        
        assert middleware._system_metrics_thread is not None
        assert middleware._system_metrics_thread.is_alive()
        
        middleware.stop_system_metrics_collection()
        
        # Thread should stop within timeout
        time.sleep(0.1)
        assert not middleware._system_metrics_thread.is_alive()


class TestMonitorPerformanceDecorator:
    """Test monitor_performance decorator."""
    
    def setup_method(self):
        """Setup for each test method."""
        # Clear metrics before each test
        metrics.metrics.clear()
        metrics.counters.clear()
        metrics.gauges.clear()
        metrics.histograms.clear()
    
    def test_successful_function_monitoring(self):
        """Test monitoring of successful function execution."""
        @monitor_performance
        def test_function(x, y):
            time.sleep(0.01)  # Small delay
            return x + y
        
        result = test_function(2, 3)
        assert result == 5
        
        # Check that metrics were recorded
        found_duration_metric = False
        
        for key in metrics.histograms.keys():
            if 'function_duration_seconds' in key and 'status=success' in key:
                found_duration_metric = True
                break
                
        assert found_duration_metric, "Function duration metric not recorded"
    
    def test_failed_function_monitoring(self):
        """Test monitoring of failed function execution."""
        @monitor_performance
        def failing_function():
            time.sleep(0.01)  # Small delay
            raise RuntimeError("Test error")
        
        with pytest.raises(RuntimeError):
            failing_function()
        
        # Check that error metrics were recorded
        found_error_metric = False
        found_duration_metric = False
        
        for key in metrics.counters.keys():
            if 'function_errors_total' in key and 'RuntimeError' in key:
                found_error_metric = True
                break
                
        for key in metrics.histograms.keys():
            if 'function_duration_seconds' in key and 'status=error' in key:
                found_duration_metric = True
                break
                
        assert found_error_metric, "Function error counter not recorded"
        assert found_duration_metric, "Function error duration not recorded"
    
    def test_function_name_recording(self):
        """Test that function names are recorded correctly."""
        @monitor_performance
        def specific_function_name():
            return "test"
        
        result = specific_function_name()
        assert result == "test"
        
        # Check that function name is included in metrics
        found_named_metric = False
        
        for key in metrics.histograms.keys():
            if 'function_duration_seconds' in key and 'specific_function_name' in key:
                found_named_metric = True
                break
                
        assert found_named_metric, "Function name not recorded in metrics"