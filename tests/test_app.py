"""
Test Flask application functionality.
"""
import json
from unittest.mock import Mock, patch

import pytest

from app import app


@pytest.fixture
def client():
    """Create test client."""
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


class TestFlaskApp:
    """Test Flask application endpoints."""

    def test_home_endpoint(self, client):
        """Test home endpoint."""
        response = client.get("/")
        assert response.status_code == 200

        data = json.loads(response.data)
        assert data["message"] == "RuneRogue API"
        assert data["version"] == "1.0.0"
        assert "config" in data

    def test_config_endpoint(self, client):
        """Test config endpoint."""
        response = client.get("/config")
        assert response.status_code == 200

        data = json.loads(response.data)
        assert isinstance(data, dict)

    def test_health_endpoint(self, client):
        """Test health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200

        data = json.loads(response.data)
        assert data["status"] == "healthy"
        assert "timestamp" in data

    def test_scrape_endpoint_missing_url(self, client):
        """Test scrape endpoint with missing URL."""
        response = client.post(
            "/scrape", data=json.dumps({}), content_type="application/json"
        )
        assert response.status_code == 400

        data = json.loads(response.data)
        assert "error" in data
        assert "URL is required" in data["error"]

    @patch("app.WebScraper")
    def test_scrape_endpoint_success(self, mock_scraper_class, client):
        """Test successful scrape endpoint."""
        mock_scraper = Mock()
        mock_scraper.fetch.return_value = "<html><body>Test content</body></html>"
        mock_scraper_class.return_value = mock_scraper

        response = client.post(
            "/scrape",
            data=json.dumps({"url": "http://example.com"}),
            content_type="application/json",
        )
        assert response.status_code == 200

        data = json.loads(response.data)
        assert data["success"] is True
        assert data["url"] == "http://example.com"
        assert "content_length" in data

    @patch("app.WebScraper")
    def test_scrape_endpoint_failure(self, mock_scraper_class, client):
        """Test scrape endpoint failure."""
        mock_scraper = Mock()
        mock_scraper.fetch.return_value = None
        mock_scraper_class.return_value = mock_scraper

        response = client.post(
            "/scrape",
            data=json.dumps({"url": "http://example.com"}),
            content_type="application/json",
        )
        assert response.status_code == 500

        data = json.loads(response.data)
        assert data["success"] is False
        assert "error" in data

    @patch("app.WebScraper")
    def test_scrape_endpoint_exception(self, mock_scraper_class, client):
        """Test scrape endpoint with exception."""
        mock_scraper_class.side_effect = Exception("Test exception")

        response = client.post(
            "/scrape",
            data=json.dumps({"url": "http://example.com"}),
            content_type="application/json",
        )
        assert response.status_code == 500

        data = json.loads(response.data)
        assert data["success"] is False
        assert "error" in data
