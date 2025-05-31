"""
Test web scraper functionality.
"""
from unittest.mock import Mock, patch

import requests

from scraper import WebScraper


class TestWebScraper:
    """Test WebScraper functionality."""

    def setup_method(self):
        """Setup for each test method."""
        self.scraper = WebScraper()

    def test_scraper_initialization(self):
        """Test scraper initialization."""
        assert self.scraper.session is not None
        assert isinstance(self.scraper.timeout, int)
        assert isinstance(self.scraper.dry_run, bool)

    def test_update_status_normal(self):
        """Test update_status in normal mode."""
        with patch("builtins.print") as mock_print:
            self.scraper.dry_run = False
            self.scraper.update_status("Test message", 50)
            mock_print.assert_called_with("Status: Test message (Progress: 50%)")

    def test_update_status_dry_run(self):
        """Test update_status in dry run mode."""
        with patch("builtins.print") as mock_print:
            self.scraper.dry_run = True
            self.scraper.update_status("Test message", 75)
            mock_print.assert_called_with(
                "[DRY RUN] Status: Test message (Progress: 75%)"
            )

    @patch("scraper.requests.Session.get")
    def test_fetch_with_requests_success(self, mock_get):
        """Test successful requests fallback."""
        mock_response = Mock()
        mock_response.text = "<html><body>Test content</body></html>"
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        self.scraper.dry_run = False
        result = self.scraper.fetch_with_requests("http://example.com")

        assert result == "<html><body>Test content</body></html>"
        mock_get.assert_called_once()

    @patch("scraper.requests.Session.get")
    def test_fetch_with_requests_failure(self, mock_get):
        """Test requests fallback failure."""
        mock_get.side_effect = requests.RequestException("Connection failed")

        result = self.scraper.fetch_with_requests("http://example.com")

        assert result is None
        mock_get.assert_called_once()

    def test_fetch_with_requests_dry_run(self):
        """Test requests fallback in dry run mode."""
        self.scraper.dry_run = True
        result = self.scraper.fetch_with_requests("http://example.com")

        assert result == "<html><body>Dry run response</body></html>"

    @patch("scraper.BeautifulSoup")
    @patch("scraper.requests.Session.get")
    def test_fetch_with_beautifulsoup_success(self, mock_get, mock_bs):
        """Test successful BeautifulSoup fallback."""
        mock_response = Mock()
        mock_response.text = "<html><body>Test content</body></html>"
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        mock_soup = Mock()
        mock_soup.__str__ = Mock(
            return_value="<html><body>Parsed content</body></html>"
        )
        mock_bs.return_value = mock_soup

        self.scraper.dry_run = False
        result = self.scraper.fetch_with_beautifulsoup("http://example.com")

        assert result == "<html><body>Parsed content</body></html>"
        mock_get.assert_called_once()
        mock_bs.assert_called_once()

    def test_fetch_with_beautifulsoup_dry_run(self):
        """Test BeautifulSoup fallback in dry run mode."""
        self.scraper.dry_run = True
        result = self.scraper.fetch_with_beautifulsoup("http://example.com")

        assert result == "<html><body>Dry run BeautifulSoup response</body></html>"

    @patch("scraper.PLAYWRIGHT_AVAILABLE", True)
    @patch("scraper.sync_playwright")
    def test_fetch_with_playwright_success(self, mock_playwright):
        """Test successful Playwright fallback."""
        # Mock the playwright context manager
        mock_browser = Mock()
        mock_page = Mock()
        mock_page.content.return_value = "<html><body>Playwright content</body></html>"
        mock_browser.new_page.return_value = mock_page

        mock_p = Mock()
        mock_p.chromium.launch.return_value = mock_browser
        mock_playwright.return_value.__enter__.return_value = mock_p
        mock_playwright.return_value.__exit__.return_value = None

        self.scraper.dry_run = False
        result = self.scraper.fetch_with_playwright("http://example.com")

        assert result == "<html><body>Playwright content</body></html>"

    @patch("scraper.PLAYWRIGHT_AVAILABLE", True)
    def test_fetch_with_playwright_dry_run(self):
        """Test Playwright fallback in dry run mode."""
        self.scraper.dry_run = True
        result = self.scraper.fetch_with_playwright("http://example.com")

        assert result == "<html><body>Dry run Playwright response</body></html>"

    @patch.object(WebScraper, "fetch_with_requests")
    def test_fetch_success_first_fallback(self, mock_requests):
        """Test fetch success with first fallback."""
        mock_requests.return_value = "<html>Content</html>"

        result = self.scraper.fetch("http://example.com")

        assert result == "<html>Content</html>"
        mock_requests.assert_called_once_with("http://example.com")

    @patch.object(WebScraper, "fetch_with_playwright")
    @patch.object(WebScraper, "fetch_with_beautifulsoup")
    @patch.object(WebScraper, "fetch_with_requests")
    def test_fetch_fallback_chain(self, mock_requests, mock_bs, mock_playwright):
        """Test complete fallback chain."""
        mock_requests.return_value = None
        mock_bs.return_value = None
        mock_playwright.return_value = "<html>Playwright content</html>"

        result = self.scraper.fetch("http://example.com")

        assert result == "<html>Playwright content</html>"
        mock_requests.assert_called_once()
        mock_bs.assert_called_once()
        mock_playwright.assert_called_once()

    @patch.object(WebScraper, "fetch_with_playwright")
    @patch.object(WebScraper, "fetch_with_beautifulsoup")
    @patch.object(WebScraper, "fetch_with_requests")
    def test_fetch_all_fallbacks_fail(self, mock_requests, mock_bs, mock_playwright):
        """Test when all fallbacks fail."""
        mock_requests.return_value = None
        mock_bs.return_value = None
        mock_playwright.return_value = None

        result = self.scraper.fetch("http://example.com")

        assert result is None
        mock_requests.assert_called_once()
        mock_bs.assert_called_once()
        mock_playwright.assert_called_once()
