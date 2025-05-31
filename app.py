"""
RuneRogue Main Application

Flask application with configuration and web scraping capabilities.
"""

import logging
import time

from flask import Flask, jsonify, request

from config import config
from scraper import WebScraper

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


if __name__ == "__main__":
    port = int(config.get("port", 5000))
    debug = config.get("debug", False)

    logger.info(f"Starting RuneRogue application on port {port}")
    logger.info(f"Configuration: {config.all()}")

    app.run(host="0.0.0.0", port=port, debug=debug)
