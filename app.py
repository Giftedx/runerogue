"""
RuneRogue Main Application

Flask application with configuration, web scraping capabilities,
and economy/trading system.
"""

import logging
import time
from decimal import Decimal, InvalidOperation

from flask import Flask, jsonify, request

from config import config
from scraper import WebScraper
from models.economy import db_manager
from economy.trading import trading_system, TradingError
from economy.grand_exchange import grand_exchange, GrandExchangeError

# Configure logging
logging.basicConfig(
    level=getattr(logging, config.get("log_level", "INFO")),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)

app = Flask(__name__)


@app.route("/")
def home():
    """Home endpoint."""
    return jsonify(
        {
            "message": "RuneRogue API",
            "version": "1.0.0",
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
    """Health check endpoint."""
    return jsonify({"status": "healthy", "timestamp": int(time.time())})


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
