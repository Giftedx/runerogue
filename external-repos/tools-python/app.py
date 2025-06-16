"""
RuneRogue Main Application


Flask application with configuration, web scraping capabilities,
enhanced with performance monitoring, self-building capabilities, and an economy/trading system.
"""

import logging
import time
import threading

from flask import Flask, jsonify, request, send_from_directory
from config import config
from scraper import WebScraper

from metrics import metrics
from monitoring import PerformanceMiddleware, monitor_performance
from health import health_scorer
from code_analyzer import find_code_tags


# Configure logging
logging.basicConfig(
    level=getattr(logging, config.get("log_level", "INFO")),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configure Flask-SQLAlchemy
app.config["SQLALCHEMY_DATABASE_URI"] = config.get("SQLALCHEMY_DATABASE_URI")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize SQLAlchemy with the app
from models import db, ImprovementSuggestion # type: ignore
db.init_app(app)

# Initialize performance monitoring
monitoring = PerformanceMiddleware(app)

with app.app_context():
    db.create_all()



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
                "milestone": "M1",
                "status": "active"
            },
            "config": {
                "debug": config.get("debug", False),
                "dry_run": config.get("dry_run", False),
                "log_level": config.get("log_level", "INFO"),
            },
        }
    )

# Add the new /game route
@app.route("/game")
def game_page():
    # Serves the Phaser game's index.html.
    return send_from_directory('static', 'index.html')

@app.route("/config")
def get_config():
    """Get current configuration."""
    return jsonify(config.all())


@app.route("/scrape", methods=["POST"])
@monitor_performance
def scrape_url():
    """Scrape a URL using a multi-fallback pattern.

    This endpoint accepts a URL via a POST request and attempts to scrape its content
    using a `WebScraper` instance, which employs multiple fallback methods if the
    initial request fails.

    Request Body:
        - `url` (str): The URL to be scraped. (Required)

    Returns:
        - JSON response indicating success, URL, content length, and dry run status (200 OK).
        - JSON response indicating failure and error message if URL is missing or scraping fails (400 Bad Request or 500 Internal Server Error).

    Raises:
        - 400 Bad Request: If 'url' is not provided in the request body.
        - 500 Internal Server Error: If all scraping fallback methods fail or an unexpected error occurs.
    """
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
    """Comprehensive health check with performance metrics and health scoring."""
    # Calculate comprehensive health score
    overall_health = health_scorer.calculate_overall_health()
    
    # Check if baseline exists
    baseline_status = "established" if metrics.baseline else "not_established"
    
    # Get current performance metrics
    current_p95 = metrics.get_percentile("http_request_duration_seconds", 95)
    current_error_rate = metrics.get_error_rate()
    
    # Check for performance regressions
    regression_check = metrics.check_performance_regression()
    
    health_data = {
        "status": overall_health.status.value,
        "timestamp": int(time.time()),
        "health_score": {
            "overall": round(overall_health.score, 1),
            "components": {
                name: {
                    "score": round(component.score, 1),
                    "status": component.status.value,
                    "message": component.message
                }
                for name, component in overall_health.components.items()
            },
            "trend": overall_health.trend,
            "alerts": overall_health.alerts
        },
        "performance": {
            "baseline_status": baseline_status,
            "current_response_time_p95": current_p95,
            "current_error_rate": current_error_rate,
            "regression_check": regression_check
        },
        "self_building": {
            "milestone": "M1",
            "enabled": config.get("self_build_enabled", True),
            "last_improvement": None,
            "health_monitoring": "active"
        }
    }
    
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
    suggestions_data = []

    # Get current health assessment
    overall_health = health_scorer.calculate_overall_health()

    # Check if baseline should be established
    if not metrics.baseline:
        suggestions_data.append({
            "type": "infrastructure",
            "priority": "high",
            "title": "Establish Performance Baseline",
            "description": "No performance baseline found. Establishing a baseline is critical for detecting regressions.",
            "action": "POST /performance/baseline",
            "risk_level": "low",
            "milestone": "M0",
            "status": "pending"
        })

    # Health-based suggestions (M1)
    if overall_health.score < 70:
        suggestions_data.append({
            "type": "performance",
            "priority": "high",
            "title": "Improve System Health Score",
            "description": f"Current health score is {overall_health.score:.1f}. Check alerts for specific issues.",
            "action": "investigate_health_alerts",
            "risk_level": "medium",
            "milestone": "M1",
            "status": "pending"
        })

    # Component-specific suggestions
    for name, component in overall_health.components.items():
        if component.score < 60:
            suggestions_data.append({
                "type": "system",
                "priority": "critical" if component.score < 40 else "high",
                "title": f"Address {name.title()} Issues",
                "description": component.message,
                "action": f"optimize_{name}",
                "risk_level": "medium",
                "milestone": "M1",
                "status": "pending"
            })

    # Performance regression suggestions
    regression_check = metrics.check_performance_regression() # type: ignore
    if regression_check["status"] == "regression_detected":
        for regression in regression_check["regressions"]: # type: ignore
            suggestions_data.append({ # type: ignore
                "type": "performance",
                "priority": "critical",
                "title": f"Performance Regression in {regression['metric']}",
                "description": f"Detected {regression.get('increase_percent', regression.get('decrease_percent', 0)):.1f}% regression",
                "action": "investigate_and_fix",
                "risk_level": "high",
                "milestone": "M1",
                "status": "pending"
            })

    # Trend-based suggestions (M1)
    if overall_health.trend == "degrading":
        suggestions_data.append({
            "type": "monitoring",
            "priority": "high",
            "title": "Health Trend Degrading",
            "description": "System health has been trending downward. Investigate recent changes.",
            "action": "analyze_health_trends",
            "risk_level": "medium",
            "milestone": "M1",
            "status": "pending"
        })

    # Add M1-specific suggestions based on metrics availability
    system_metrics_available = any(
        "system_" in key for key in metrics.gauges.keys()
    )
    if not system_metrics_available:
        suggestions_data.append({
            "type": "monitoring",
            "priority": "medium",
            "title": "Enable System Resource Monitoring",
            "description": "System resource metrics are not being collected.",
            "action": "enable_system_monitoring",
            "risk_level": "low",
            "milestone": "M1",
            "status": "pending"
        })

    # Scan for code tags (TODO, FIXME)
    code_tags_to_scan = ['TODO', 'FIXME']
    try:
        found_code_tags = find_code_tags('.', code_tags_to_scan)
        for tag_info in found_code_tags:
            suggestions_data.append({ # type: ignore
                "type": "code_quality",
                "priority": "low",
                "title": f"Address {tag_info['tag']} in {tag_info['file_path']}:{tag_info['line_number']}",
                "description": f"Found {tag_info['tag']} at {tag_info['file_path']}:{tag_info['line_number']}. Content: {tag_info['content']}",
                "action": "Refactor or complete the tagged code.",
                "risk_level": "low",
                "milestone": "M3",
                "status": "pending"
            })
    except Exception as e:
        logger.error(f"Error scanning for code tags: {e}")

    # Persist new suggestions to the database
    for sugg_data in suggestions_data:
        # Check if a similar suggestion already exists to avoid duplicates
        existing_suggestion = ImprovementSuggestion.query.filter_by( # type: ignore
            title=sugg_data['title'],
            description=sugg_data['description']
        ).first() # type: ignore

        if not existing_suggestion:
            new_suggestion = ImprovementSuggestion( # type: ignore
                type=sugg_data['type'], # type: ignore
                priority=sugg_data['priority'], # type: ignore
                title=sugg_data['title'], # type: ignore
                description=sugg_data['description'], # type: ignore
                action=sugg_data['action'], # type: ignore
                risk_level=sugg_data['risk_level'], # type: ignore
                milestone=sugg_data['milestone'], # type: ignore
                status=sugg_data['status'] # type: ignore
            )
            db.session.add(new_suggestion) # type: ignore
    db.session.commit() # type: ignore

    # Retrieve all suggestions from the database
    all_suggestions = ImprovementSuggestion.query.all() # type: ignore
    suggestions_list = [s.to_dict() for s in all_suggestions] # type: ignore

    # Filter suggestions based on status query parameter
    status_filter = request.args.get('status')
    if status_filter:
        filtered_suggestions = [s for s in suggestions_list if s.get('status') == status_filter] # type: ignore
        return jsonify(filtered_suggestions)

    return jsonify(suggestions_list)


@app.route("/improvements/history")
@monitor_performance
def improvement_history():
    """Get history of all logged improvement suggestions."""
    all_suggestions = ImprovementSuggestion.query.all() # type: ignore
    history_to_return = [s.to_dict() for s in all_suggestions] # type: ignore

    # Calculate summary counts
    total_count = len(history_to_return)
    # These counts would be more meaningful once status updates are implemented
    # For now, most will be 'pending'
    status_counts = {}
    for item in history_to_return:
        status_counts[item['status']] = status_counts.get(item['status'], 0) + 1

    return jsonify({
        "improvements_log": history_to_return,
        "total_count": total_count,
        "status_counts": status_counts,
        "last_updated": int(time.time())
    })


@app.route("/health/trends")
@monitor_performance
def health_trends():
    """Get health trends over time (Milestone M1)."""
    hours = request.args.get('hours', 24, type=int)
    hours = min(hours, 168)  # Limit to 1 week
    
    trends = health_scorer.get_health_trends(hours)
    
    return jsonify({
        "trends": trends,
        "milestone": "M1",
        "last_updated": int(time.time())
    })


@app.route("/health/score")
@monitor_performance
def current_health_score():
    """Get current health score (Milestone M1)."""
    overall_health = health_scorer.calculate_overall_health()
    
    return jsonify({
        "overall_score": round(overall_health.score, 1),
        "status": overall_health.status.value,
        "trend": overall_health.trend,
        "components": {
            name: {
                "score": round(component.score, 1),
                "status": component.status.value,
                "message": component.message
            }
            for name, component in overall_health.components.items()
        },
        "alerts": overall_health.alerts,
        "last_updated": int(overall_health.last_updated),
        "milestone": "M1"
    })


@app.route("/monitoring/alerts")
@monitor_performance
def monitoring_alerts():
    """Get current monitoring alerts (Milestone M1)."""
    overall_health = health_scorer.calculate_overall_health()
    
    # Get performance alerts
    alerts = []
    
    # Add health-based alerts
    for alert in overall_health.alerts:
        alerts.append({
            "type": "health",
            "severity": "warning" if "warning" in alert.lower() else "critical",
            "message": alert,
            "timestamp": int(time.time()),
            "component": alert.split(":")[0].lower()
        })
    
    # Add regression alerts
    regression_check = metrics.check_performance_regression()
    if regression_check["status"] == "regression_detected":
        for regression in regression_check["regressions"]:
            alerts.append({
                "type": "regression",
                "severity": "critical",
                "message": f"Performance regression in {regression['metric']}",
                "timestamp": int(time.time()),
                "component": "performance",
                "details": regression
            })
    
    # Add baseline alerts
    if not metrics.baseline:
        alerts.append({
            "type": "configuration",
            "severity": "warning",
            "message": "No performance baseline established",
            "timestamp": int(time.time()),
            "component": "monitoring"
        })
    
    return jsonify({
        "alerts": alerts,
        "total_count": len(alerts),
        "critical_count": len([a for a in alerts if a["severity"] == "critical"]),
        "warning_count": len([a for a in alerts if a["severity"] == "warning"]),
        "last_updated": int(time.time()),
        "milestone": "M1"
    })


if __name__ == "__main__":
    port = int(config.get("port", 5000))
    debug = config.get("debug", False)

    logger.info(f"Starting RuneRogue application on port {port}")
    logger.info(f"Configuration: {config.all()}")



    app.run(host="0.0.0.0", port=port, debug=debug)
