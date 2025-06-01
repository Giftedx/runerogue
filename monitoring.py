"""
RuneRogue Performance Monitoring Middleware

Automatically collects performance metrics for Flask requests.
"""

import time
import psutil
import threading
from functools import wraps
from flask import Flask, request, g, Response
from metrics import metrics
import logging
from typing import Callable, TypeVar, ParamSpec

logger = logging.getLogger(__name__)


class PerformanceMiddleware:
    """Flask middleware for automatic performance monitoring."""
    app: Flask | None
    _system_metrics_thread: threading.Thread | None
    _stop_event: threading.Event

    def __init__(self, app: Flask | None = None):
        self.app = app
        self._system_metrics_thread = None
        self._stop_event = threading.Event()

        if app is not None:
            self.init_app(app)
            
    def init_app(self, app: Flask) -> None:
        """Initialize the middleware with Flask app."""
        _ = app.before_request(self.before_request)
        _ = app.after_request(self.after_request)
        _ = app.teardown_appcontext(self.teardown_request)
        
        # Start system metrics collection thread
        self.start_system_metrics_collection()
        
    def before_request(self):
        """Record request start time."""
        start_time: float = time.time()
        g.start_time = start_time  # type: ignore
        g.request_id = id(request)
        
        # Record request counter
        endpoint = request.endpoint or 'unknown'
        method = request.method
        metrics.record_counter('http_requests_started_total', 1.0, {
            'endpoint': endpoint,
            'method': method
        })
        
    def after_request(self, response: Response) -> Response:
        """Record request completion and metrics."""
        duration: float = time.time() - g.start_time  # type: ignore
        endpoint = request.endpoint or 'unknown'
        method = request.method
        status_code = response.status_code
        
        # Record comprehensive metrics
        metrics.record_response_time(endpoint, duration, status_code)
        
        # Record additional metrics
        metrics.record_histogram('http_request_size_bytes', len(request.get_data()), {
            'endpoint': endpoint,
            'method': method
        })
        
        if hasattr(response, 'content_length') and response.content_length:
            metrics.record_histogram('http_response_size_bytes', response.content_length, {
                'endpoint': endpoint,
                'method': method,
                'status': str(status_code)
            })
            
        # Log slow requests
        if duration > 1.0:  # Log requests taking more than 1 second
            logger.warning(f"Slow request: {method} {request.path} took {duration:.2f}s")
            
        return response
        
    def teardown_request(self, exception: BaseException | None = None) -> None:
        """Handle request teardown."""
        if exception:
            try:
                endpoint = request.endpoint or 'unknown'
                method = request.method
                metrics.record_counter('http_request_exceptions_total', 1.0, {
                    'endpoint': endpoint,
                    'method': method,
                    'exception_type': type(exception).__name__
                })
                logger.error(f"Request exception: {method} {request.path} - {exception}")
            except RuntimeError:
                # Request context may not be available during teardown
                metrics.record_counter('http_request_exceptions_total', 1.0, {
                    'endpoint': 'unknown',
                    'method': 'unknown',
                    'exception_type': type(exception).__name__
                })
                logger.error(f"Request exception (context unavailable): {exception}")
            
    def start_system_metrics_collection(self):
        """Start background thread for system metrics collection."""
        if self._system_metrics_thread and self._system_metrics_thread.is_alive():
            return
            
        self._stop_event.clear()
        self._system_metrics_thread = threading.Thread(
            target=self._collect_system_metrics,
            daemon=True
        )
        self._system_metrics_thread.start()
        logger.info("Started system metrics collection thread")
        
    def stop_system_metrics_collection(self):
        """Stop system metrics collection thread."""
        if self._system_metrics_thread:
            self._stop_event.set()
            self._system_metrics_thread.join(timeout=5)
            logger.info("Stopped system metrics collection thread")
            
    def _collect_system_metrics(self):
        """Collect system-level metrics in background thread."""
        while not self._stop_event.wait(30):  # Collect every 30 seconds
            try:
                # CPU metrics
                cpu_percent: float = psutil.cpu_percent(interval=1)
                metrics.record_gauge('system_cpu_usage_percent', cpu_percent)
                
                # Memory metrics
                memory = psutil.virtual_memory()
                metrics.record_gauge('system_memory_usage_bytes', float(memory.used))  # type: ignore[attr-defined]
                metrics.record_gauge('system_memory_usage_percent', float(memory.percent))  # type: ignore[attr-defined]
                metrics.record_gauge('system_memory_available_bytes', float(memory.available))  # type: ignore[attr-defined]
                
                # Disk metrics
                disk = psutil.disk_usage('/')
                metrics.record_gauge('system_disk_usage_bytes', disk.used)
                metrics.record_gauge('system_disk_usage_percent', (disk.used / disk.total) * 100)
                metrics.record_gauge('system_disk_available_bytes', disk.free)
                
                # Network metrics (if available)
                try:
                    net_io = psutil.net_io_counters()
                    metrics.record_counter('system_network_bytes_sent_total', net_io.bytes_sent)
                    metrics.record_counter('system_network_bytes_recv_total', net_io.bytes_recv)
                except Exception:
                    pass  # Network stats may not be available in all environments
                    
            except Exception as e:
                logger.error(f"Error collecting system metrics: {e}")


_P = ParamSpec('_P')
_R = TypeVar('_R')

def monitor_performance(func: Callable[_P, _R]) -> Callable[_P, _R]:
    """Decorator to monitor function performance."""
    @wraps(func)
    def wrapper(*args: _P.args, **kwargs: _P.kwargs) -> _R:
        start_time: float = time.time()
        function_name = f"{func.__module__}.{func.__name__}"
        
        try:
            result = func(*args, **kwargs)
            duration: float = time.time() - start_time
            
            metrics.record_histogram('function_duration_seconds', duration, {
                'function': function_name,
                'status': 'success'
            })
            
            return result
            
        except Exception as e:
            duration = time.time() - start_time
            
            metrics.record_histogram('function_duration_seconds', duration, {
                'function': function_name,
                'status': 'error'
            })
            
            metrics.record_counter('function_errors_total', 1.0, {
                'function': function_name,
                'exception_type': type(e).__name__
            })
            
            raise
            
    return wrapper