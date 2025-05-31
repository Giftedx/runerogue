"""
RuneRogue Web Scraper Module

Implements multi-fallback pattern: requests → BeautifulSoup → Playwright
"""

import logging
from typing import Optional

import requests
from bs4 import BeautifulSoup

try:
    from playwright.sync_api import sync_playwright
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False
    sync_playwright = None

from config import config

logger = logging.getLogger(__name__)


class WebScraper:
    """Web scraper with multi-fallback support."""

    def __init__(self):
        self.session = requests.Session()
        self.timeout = config.get("timeout", 30)
        self.dry_run = config.get("dry_run", False)

    def update_status(self, message: str, progress: int = 0) -> None:
        """Update status with progress tracking."""
        if self.dry_run:
            print(f"[DRY RUN] Status: {message} (Progress: {progress}%)")
        else:
            print(f"Status: {message} (Progress: {progress}%)")

        # Log to file if configured
        if config.get("log_to_file", False):
            logger.info(f"Progress {progress}%: {message}")

    def fetch_with_requests(self, url: str, **kwargs) -> Optional[str]:
        """First fallback: Basic requests."""
        try:
            self.update_status(f"Attempting requests for {url}", 10)

            if self.dry_run:
                self.update_status("Dry run - skipping actual request", 100)
                return "<html><body>Dry run response</body></html>"

            response = self.session.get(url, timeout=self.timeout, **kwargs)
            response.raise_for_status()

            self.update_status("Successfully fetched with requests", 100)
            return response.text

        except Exception as e:
            self.update_status(f"Requests failed: {str(e)}", 0)
            logger.warning(f"Requests fallback failed for {url}: {e}")
            return None

    def fetch_with_beautifulsoup(self, url: str, **kwargs) -> Optional[str]:
        """Second fallback: BeautifulSoup with requests."""
        try:
            self.update_status(f"Attempting BeautifulSoup for {url}", 30)

            if self.dry_run:
                self.update_status("Dry run - skipping BeautifulSoup request", 100)
                return "<html><body>Dry run BeautifulSoup response</body></html>"

            headers = kwargs.get("headers", {})
            headers.update(
                {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                }
            )

            response = self.session.get(url, headers=headers, timeout=self.timeout)
            response.raise_for_status()

            # Parse with BeautifulSoup for better handling
            soup = BeautifulSoup(response.text, "html.parser")

            self.update_status("Successfully fetched with BeautifulSoup", 100)
            return str(soup)

        except Exception as e:
            self.update_status(f"BeautifulSoup failed: {str(e)}", 0)
            logger.warning(f"BeautifulSoup fallback failed for {url}: {e}")
            return None

    def fetch_with_playwright(self, url: str, **kwargs) -> Optional[str]:
        """Third fallback: Playwright for JavaScript-heavy sites."""
        if not PLAYWRIGHT_AVAILABLE:
            self.update_status("Playwright not available", 0)
            logger.warning("Playwright not installed, skipping fallback")
            return None

        try:
            self.update_status(f"Attempting Playwright for {url}", 60)

            if self.dry_run:
                self.update_status("Dry run - skipping Playwright request", 100)
                return "<html><body>Dry run Playwright response</body></html>"

            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()

                # Set timeout
                page.set_default_timeout(self.timeout * 1000)

                # Navigate to page
                page.goto(url)

                # Wait for page load
                page.wait_for_load_state("networkidle")

                # Get content
                content = page.content()

                browser.close()

                self.update_status("Successfully fetched with Playwright", 100)
                return content

        except Exception as e:
            self.update_status(f"Playwright failed: {str(e)}", 0)
            logger.error(f"Playwright fallback failed for {url}: {e}")
            return None

    def fetch(self, url: str, **kwargs) -> Optional[str]:
        """
        Fetch URL with multi-fallback pattern.

        Tries: requests → BeautifulSoup → Playwright
        """
        self.update_status(f"Starting fetch for {url}", 0)

        # Try requests first
        content = self.fetch_with_requests(url, **kwargs)
        if content:
            return content

        # Try BeautifulSoup
        content = self.fetch_with_beautifulsoup(url, **kwargs)
        if content:
            return content

        # Final fallback: Playwright
        content = self.fetch_with_playwright(url, **kwargs)
        if content:
            return content

        self.update_status(f"All fallbacks failed for {url}", 0)
        return None
