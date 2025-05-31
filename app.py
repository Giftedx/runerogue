"""
RuneRogue Main Application

Flask application with configuration and web scraping capabilities.
Enhanced with performance monitoring and self-building capabilities.
"""

import logging
import time

from flask import Flask, jsonify, request

from config import config
from scraper import WebScraper
from metrics import metrics
from monitoring import PerformanceMiddleware, monitor_performance

# Configure logging
logging.basicConfig(
    level=getattr(logging, config.get("log_level", "INFO")),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)

app = Flask(__name__)

# Initialize performance monitoring
monitoring = PerformanceMiddleware(app)


@app.route("/")
@monitor_performance
def home():
    """Home endpoint."""
    return jsonify(
        {
            "message": "RuneRogue API",
            "version": "1.0.0",
            "self_building": {
                "enabled": config.get("self_build_enabled", True),
                "milestone": "M0",
                "status": "active"
            },
            "config": {
                "debug": config.get("debug", False),
                "dry_run": config.get("dry_run", False),
                "log_level": config.get("log_level", "INFO"),
            },
        }
    )


@app.route("/config")
def get_config():
    """Get current configuration."""
    return jsonify(config.all())


@app.route("/scrape", methods=["POST"])
@monitor_performance
def scrape_url():
    """Scrape a URL using multi-fallback pattern."""
    data = request.get_json()

    if not data or "url" not in data:
        return jsonify({"error": "URL is required"}), 400

    url = data["url"]

    try:
        scraper = WebScraper()
        content = scraper.fetch(url)

        if content:
            return jsonify(
                {
                    "success": True,
                    "url": url,
                    "content_length": len(content),
                    "dry_run": config.get("dry_run", False),
                }
            )
        else:
            return (
                jsonify(
                    {
                        "success": False,
                        "url": url,
                        "error": "All fallback methods failed",
                    }
                ),
                500,
            )

    except Exception as e:
        logger.error(f"Error scraping {url}: {e}")
        return jsonify({"success": False, "url": url, "error": str(e)}), 500


@app.route("/health")
def health_check():
    """Basic health check endpoint."""
    return jsonify({"status": "healthy", "timestamp": int(time.time())})


@app.route("/health/detailed")
@monitor_performance  
def detailed_health_check():
    """Comprehensive health check with performance metrics."""
    # Check if baseline exists
    baseline_status = "established" if metrics.baseline else "not_established"
    
    # Get current performance metrics
    current_p95 = metrics.get_percentile("http_request_duration_seconds", 95)
    current_error_rate = metrics.get_error_rate()
    
    # Check for performance regressions
    regression_check = metrics.check_performance_regression()
    
    health_data = {
        "status": "healthy",
        "timestamp": int(time.time()),
        "performance": {
            "baseline_status": baseline_status,
            "current_response_time_p95": current_p95,
            "current_error_rate": current_error_rate,
            "regression_check": regression_check
        },
        "self_building": {
            "milestone": "M0",
            "enabled": config.get("self_build_enabled", True),
            "last_improvement": None  # Will be populated when improvements are made
        }
    }
    
    # Set overall health status based on regressions
    if regression_check["status"] == "regression_detected":
        health_data["status"] = "degraded"
    
    return jsonify(health_data)


@app.route("/metrics")
def prometheus_metrics():
    """Prometheus-style metrics endpoint."""
    metrics_data = metrics.get_prometheus_metrics()
    
    # Add custom metrics headers
    response_text = f"""# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
# HELP http_request_duration_seconds HTTP request duration
# TYPE http_request_duration_seconds histogram
# HELP system_cpu_usage_percent CPU usage percentage
# TYPE system_cpu_usage_percent gauge
# HELP system_memory_usage_bytes Memory usage in bytes
# TYPE system_memory_usage_bytes gauge

{metrics_data}
"""
    
    from flask import Response
    return Response(response_text, mimetype='text/plain')


@app.route("/performance/baseline", methods=["GET", "POST"])
@monitor_performance
def performance_baseline():
    """Manage performance baseline."""
    if request.method == "POST":
        # Establish new baseline
        baseline = metrics.establish_baseline()
        return jsonify({
            "status": "baseline_established",
            "baseline": {
                "response_time_p50": baseline.response_time_p50,
                "response_time_p95": baseline.response_time_p95,
                "response_time_p99": baseline.response_time_p99,
                "error_rate": baseline.error_rate,
                "throughput": baseline.throughput,
                "timestamp": baseline.timestamp
            }
        })
    else:
        # Get current baseline
        if metrics.baseline:
            return jsonify({
                "status": "baseline_exists",
                "baseline": {
                    "response_time_p50": metrics.baseline.response_time_p50,
                    "response_time_p95": metrics.baseline.response_time_p95,
                    "response_time_p99": metrics.baseline.response_time_p99,
                    "error_rate": metrics.baseline.error_rate,
                    "throughput": metrics.baseline.throughput,
                    "timestamp": metrics.baseline.timestamp,
                    "age_hours": (time.time() - metrics.baseline.timestamp) / 3600
                }
            })
        else:
            return jsonify({
                "status": "no_baseline",
                "message": "No baseline established. POST to this endpoint to create one."
            })


@app.route("/improvements/suggestions")
@monitor_performance
def improvement_suggestions():
    """Get current improvement suggestions."""
    # This is a placeholder for now - will be enhanced in later milestones
    suggestions = []
    
    # Check if baseline should be established
    if not metrics.baseline:
        suggestions.append({
            "type": "infrastructure",
            "priority": "high",
            "title": "Establish Performance Baseline",
            "description": "No performance baseline found. Establishing a baseline is critical for detecting regressions.",
            "action": "POST /performance/baseline",
            "risk_level": "low"
        })
    
    # Check for performance issues
    regression_check = metrics.check_performance_regression()
    if regression_check["status"] == "regression_detected":
        for regression in regression_check["regressions"]:
            suggestions.append({
                "type": "performance",
                "priority": "critical",
                "title": f"Performance Regression in {regression['metric']}",
                "description": f"Detected {regression.get('increase_percent', regression.get('decrease_percent', 0)):.1f}% regression",
                "action": "investigate_and_fix",
                "risk_level": "high"
            })
    
    return jsonify({
        "suggestions": suggestions,
        "last_updated": int(time.time()),
        "milestone": "M0"
    })


@app.route("/improvements/history")
@monitor_performance
def improvement_history():
    """Get history of past improvements."""
    # Placeholder for now - will be implemented in later milestones
    return jsonify({
        "improvements": [],
        "total_count": 0,
        "successful_count": 0,
        "failed_count": 0,
        "last_improvement": None
    })


if __name__ == "__main__":
    port = int(config.get("port", 5000))
    debug = config.get("debug", False)

    logger.info(f"Starting RuneRogue application on port {port}")
    logger.info(f"Configuration: {config.all()}")

    app.run(host="0.0.0.0", port=port, debug=debug)
