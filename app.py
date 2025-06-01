"""
RuneRogue Main Application


Flask application with configuration and web scraping capabilities.
Enhanced with performance monitoring and self-building capabilities.
=======
Flask application with configuration, web scraping capabilities,
and economy/trading system.
>>>>>>> origin/copilot/fix-21-2
"""

import logging
import time
import threading
from decimal import Decimal, InvalidOperation
from flask import Flask, jsonify, request, send_from_directory
from config import config
from scraper import WebScraper

from metrics import metrics
from monitoring import PerformanceMiddleware, monitor_performance
from health import health_scorer, HealthStatus
from code_analyzer import find_code_tags
=======
from models.economy import db_manager
from economy.trading import trading_system, TradingError
from economy.grand_exchange import grand_exchange, GrandExchangeError
>>>>>>> origin/copilot/fix-21-2

# Configure logging
logging.basicConfig(
    level=getattr(logging, config.get("log_level", "INFO")),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)

app = Flask(__name__)

# Initialize performance monitoring
monitoring = PerformanceMiddleware(app)

# Global in-memory store for improvement suggestions
improvement_log = []
next_suggestion_id = 1
log_lock = threading.Lock()


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
    global next_suggestion_id
    suggestions = []
    active_suggestions_output = [] # What this endpoint will return

    # Get current health assessment
    overall_health = health_scorer.calculate_overall_health()
    
    # Check if baseline should be established
    if not metrics.baseline:
        suggestions.append({
            "type": "infrastructure",
            "priority": "high",
            "title": "Establish Performance Baseline",
            "description": "No performance baseline found. Establishing a baseline is critical for detecting regressions.",
            "action": "POST /performance/baseline",
            "risk_level": "low",
            "milestone": "M0"
        })
    
    # Health-based suggestions (M1)
    if overall_health.score < 70:
        suggestions.append({
            "type": "performance",
            "priority": "high",
            "title": "Improve System Health Score",
            "description": f"Current health score is {overall_health.score:.1f}. Check alerts for specific issues.",
            "action": "investigate_health_alerts",
            "risk_level": "medium",
            "milestone": "M1"
        })
    
    # Component-specific suggestions
    for name, component in overall_health.components.items():
        if component.score < 60:
            suggestions.append({
                "type": "system",
                "priority": "critical" if component.score < 40 else "high",
                "title": f"Address {name.title()} Issues",
                "description": component.message,
                "action": f"optimize_{name}",
                "risk_level": "medium",
                "milestone": "M1"
            })
    
    # Performance regression suggestions
    regression_check = metrics.check_performance_regression()
    if regression_check["status"] == "regression_detected":
        for regression in regression_check["regressions"]:
            suggestions.append({
                "type": "performance",
                "priority": "critical",
                "title": f"Performance Regression in {regression['metric']}",
                "description": f"Detected {regression.get('increase_percent', regression.get('decrease_percent', 0)):.1f}% regression",
                "action": "investigate_and_fix",
                "risk_level": "high",
                "milestone": "M1"
            })
    
    # Trend-based suggestions (M1)
    if overall_health.trend == "degrading":
        suggestions.append({
            "type": "monitoring",
            "priority": "high",
            "title": "Health Trend Degrading",
            "description": "System health has been trending downward. Investigate recent changes.",
            "action": "analyze_health_trends",
            "risk_level": "medium",
            "milestone": "M1"
        })
    
    # Add M1-specific suggestions based on metrics availability
    system_metrics_available = any(
        "system_" in key for key in metrics.gauges.keys()
    )
    if not system_metrics_available:
        suggestions.append({
            "type": "monitoring",
            "priority": "medium",
            "title": "Enable System Resource Monitoring",
            "description": "System resource metrics are not being collected.",
            "action": "enable_system_monitoring",
            "risk_level": "low",
            "milestone": "M1"
        })

    # Scan for code tags (TODO, FIXME)
    code_tags_to_scan = ['TODO', 'FIXME']
    try:
        found_code_tags = find_code_tags('.', code_tags_to_scan)
        for tag_info in found_code_tags:
            suggestions.append({
                "type": "code_quality",
                "priority": "low",
                "title": f"Address {tag_info['tag']} in {tag_info['file_path']}:{tag_info['line_number']}",
                "description": tag_info['full_comment_line'], # Using full_comment_line for more context
                "action": "Review and address the code comment.",
                "risk_level": "low",
                "milestone": "M2",
                "details": { # Adding details for better traceability
                    "file_path": tag_info['file_path'],
                    "line_number": tag_info['line_number'],
                    "tag": tag_info['tag'],
                    "comment_text": tag_info['comment']
                }
            })
    except Exception as e:
        logger.error(f"Error scanning for code tags: {e}")
        # Optionally, add a suggestion about the error itself
        suggestions.append({
            "type": "system_error",
            "priority": "medium",
            "title": "Code tag scanning failed",
            "description": f"The automatic scanning for code tags (TODO, FIXME) encountered an error: {e}",
            "action": "Investigate `code_analyzer.py` or system permissions.",
            "risk_level": "medium",
            "milestone": "M2"
        })

    current_time = int(time.time())
    with log_lock:
        for sugg in suggestions:
            # Check if a similar pending/active suggestion already exists in the log
            exists_in_log_active = False # Initialize here
            for logged_sugg in improvement_log:
                # For code_quality, title might be too specific due to line number.
                # Let's make matching a bit more robust for code_quality types.
                is_similar_code_tag = False
                if sugg['type'] == 'code_quality' and logged_sugg['type'] == 'code_quality':
                    if (logged_sugg.get('details', {}).get('file_path') == sugg.get('details', {}).get('file_path') and
                        logged_sugg.get('details', {}).get('line_number') == sugg.get('details', {}).get('line_number') and
                        logged_sugg.get('details', {}).get('tag') == sugg.get('details', {}).get('tag')):
                        is_similar_code_tag = True

                if ( (logged_sugg['title'] == sugg['title'] and logged_sugg['type'] == sugg['type']) or is_similar_code_tag ) and \
                   logged_sugg['status'] in ['pending', 'active']:
                    # Found an existing similar suggestion that's still considered active.
                    # This suggestion (from `suggestions` list) should be presented with its existing ID and status.
                    active_suggestions_output.append({**sugg, 'id': logged_sugg['id'], 'status': logged_sugg['status'], 'timestamp': logged_sugg['timestamp']})
                    exists_in_log_active = True
                    break

            if not exists_in_log_active:
                # This is a new suggestion or a previously resolved one that has reappeared.
                # Log it as a new 'pending' entry.
                new_id = next_suggestion_id
                next_suggestion_id += 1
                log_entry = {**sugg, 'id': new_id, 'status': 'pending', 'timestamp': current_time}
                improvement_log.append(log_entry)
                active_suggestions_output.append(log_entry) # Also include it in the current response

    return jsonify({
        "suggestions": active_suggestions_output, # Return currently relevant suggestions with their IDs and status
        "last_updated": current_time,
        "milestone": "M1", # Or determine dynamically based on suggestions
        "health_score": round(overall_health.score, 1),
        "health_status": overall_health.status.value
    })


@app.route("/improvements/history")
@monitor_performance
def improvement_history():
    """Get history of all logged improvement suggestions."""
    with log_lock: # Ensure thread-safe access if we add update mechanisms later
        # Return a copy to prevent modification of the log by callers
        history_to_return = list(improvement_log)

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
=======
# Economy and Trading Endpoints

@app.route("/trading/initiate", methods=["POST"])
def initiate_trade():
    """Initiate a new trade between two players."""
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "Request body required"}), 400
        
    required_fields = ["initiator_id", "receiver_id"]
    missing_fields = [field for field in required_fields 
                     if field not in data]
    
    if missing_fields:
        return jsonify({
            "error": f"Missing required fields: {', '.join(missing_fields)}"
        }), 400
    
    try:
        result = trading_system.initiate_trade(
            initiator_id=data["initiator_id"],
            receiver_id=data["receiver_id"],
            notes=data.get("notes")
        )
        return jsonify(result), 201
        
    except TradingError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error initiating trade: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/trading/<int:trade_id>/add_item", methods=["POST"])
def add_item_to_trade(trade_id):
    """Add an item to a pending trade."""
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "Request body required"}), 400
        
    required_fields = ["player_id", "item_id", "quantity"]
    missing_fields = [field for field in required_fields 
                     if field not in data]
    
    if missing_fields:
        return jsonify({
            "error": f"Missing required fields: {', '.join(missing_fields)}"
        }), 400
    
    try:
        result = trading_system.add_item_to_trade(
            trade_id=trade_id,
            player_id=data["player_id"],
            item_id=data["item_id"],
            quantity=data["quantity"]
        )
        return jsonify(result)
        
    except TradingError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error adding item to trade: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/trading/<int:trade_id>/accept", methods=["POST"])
def accept_trade(trade_id):
    """Accept a pending trade."""
    data = request.get_json()
    
    if not data or "player_id" not in data:
        return jsonify({"error": "player_id required"}), 400
    
    try:
        result = trading_system.accept_trade(
            trade_id=trade_id,
            player_id=data["player_id"]
        )
        return jsonify(result)
        
    except TradingError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error accepting trade: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/trading/<int:trade_id>/decline", methods=["POST"])
def decline_trade(trade_id):
    """Decline a pending trade."""
    data = request.get_json()
    
    if not data or "player_id" not in data:
        return jsonify({"error": "player_id required"}), 400
    
    try:
        result = trading_system.decline_trade(
            trade_id=trade_id,
            player_id=data["player_id"]
        )
        return jsonify(result)
        
    except TradingError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error declining trade: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/trading/<int:trade_id>")
def get_trade_details(trade_id):
    """Get details of a specific trade."""
    try:
        result = trading_system.get_trade_details(trade_id)
        return jsonify(result)
        
    except TradingError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        logger.error(f"Error getting trade details: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/trading/player/<int:player_id>")
def get_player_trades(player_id):
    """Get all trades for a player."""
    status = request.args.get("status")
    
    try:
        result = trading_system.get_player_trades(
            player_id=player_id,
            status=status
        )
        return jsonify({"trades": result})
        
    except Exception as e:
        logger.error(f"Error getting player trades: {e}")
        return jsonify({"error": "Internal server error"}), 500


# Grand Exchange Endpoints

@app.route("/ge/buy", methods=["POST"])
def place_buy_offer():
    """Place a buy offer on the Grand Exchange."""
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "Request body required"}), 400
        
    required_fields = ["player_id", "item_id", "quantity", "price_per_item"]
    missing_fields = [field for field in required_fields 
                     if field not in data]
    
    if missing_fields:
        return jsonify({
            "error": f"Missing required fields: {', '.join(missing_fields)}"
        }), 400
    
    try:
        price_per_item = Decimal(str(data["price_per_item"]))
        result = grand_exchange.place_buy_offer(
            player_id=data["player_id"],
            item_id=data["item_id"],
            quantity=data["quantity"],
            price_per_item=price_per_item
        )
        return jsonify(result), 201
        
    except (InvalidOperation, ValueError):
        return jsonify({"error": "Invalid price format"}), 400
    except GrandExchangeError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error placing buy offer: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/ge/sell", methods=["POST"])
def place_sell_offer():
    """Place a sell offer on the Grand Exchange."""
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "Request body required"}), 400
        
    required_fields = ["player_id", "item_id", "quantity", "price_per_item"]
    missing_fields = [field for field in required_fields 
                     if field not in data]
    
    if missing_fields:
        return jsonify({
            "error": f"Missing required fields: {', '.join(missing_fields)}"
        }), 400
    
    try:
        price_per_item = Decimal(str(data["price_per_item"]))
        result = grand_exchange.place_sell_offer(
            player_id=data["player_id"],
            item_id=data["item_id"],
            quantity=data["quantity"],
            price_per_item=price_per_item
        )
        return jsonify(result), 201
        
    except (InvalidOperation, ValueError):
        return jsonify({"error": "Invalid price format"}), 400
    except GrandExchangeError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error placing sell offer: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/ge/offers/<int:offer_id>/cancel", methods=["POST"])
def cancel_ge_offer(offer_id):
    """Cancel a Grand Exchange offer."""
    data = request.get_json()
    
    if not data or "player_id" not in data:
        return jsonify({"error": "player_id required"}), 400
    
    try:
        result = grand_exchange.cancel_offer(
            offer_id=offer_id,
            player_id=data["player_id"]
        )
        return jsonify(result)
        
    except GrandExchangeError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error cancelling offer: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/ge/player/<int:player_id>/offers")
def get_player_offers(player_id):
    """Get all Grand Exchange offers for a player."""
    status = request.args.get("status")
    
    try:
        result = grand_exchange.get_player_offers(
            player_id=player_id,
            status=status
        )
        return jsonify({"offers": result})
        
    except Exception as e:
        logger.error(f"Error getting player offers: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/ge/items/<int:item_id>/market")
def get_item_market_data(item_id):
    """Get market data for an item."""
    try:
        result = grand_exchange.get_item_market_data(item_id)
        return jsonify(result)
        
    except GrandExchangeError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        logger.error(f"Error getting market data: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/ge/items/<int:item_id>/history")
def get_item_price_history(item_id):
    """Get price history for an item."""
    days = request.args.get("days", 30, type=int)
    
    try:
        result = grand_exchange.get_price_history(item_id, days)
        return jsonify({"price_history": result})
        
    except Exception as e:
        logger.error(f"Error getting price history: {e}")
        return jsonify({"error": "Internal server error"}), 500


# Database initialization endpoint

@app.route("/admin/init_db", methods=["POST"])
def initialize_database():
    """Initialize the database tables (admin only)."""
    try:
        db_manager.create_tables()
        return jsonify({"message": "Database initialized successfully"})
        
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        return jsonify({"error": "Failed to initialize database"}), 500
>>>>>>> origin/copilot/fix-21-2


if __name__ == "__main__":
    port = int(config.get("port", 5000))
    debug = config.get("debug", False)

    logger.info(f"Starting RuneRogue application on port {port}")
    logger.info(f"Configuration: {config.all()}")

    # Initialize database tables on startup
    try:
        db_manager.create_tables()
        logger.info("Database tables initialized")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")

    app.run(host="0.0.0.0", port=port, debug=debug)
