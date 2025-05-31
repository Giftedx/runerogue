# RuneRogue

A Python web scraping application with comprehensive multi-fallback patterns and automated testing.

## Features

- **Multi-fallback scraping**: requests → BeautifulSoup → Playwright
- **Configuration management**: YAML config files with environment variable overrides
- **Progress tracking**: Built-in `update_status()` function with progress reporting
- **Dry run support**: Test functionality without making actual requests
- **Flask web API**: RESTful endpoints for scraping operations
- **Comprehensive testing**: Unit tests with mocking support
- **CI/CD Pipeline**: Automated testing, linting, and deployment

## Installation

```bash
pip install -r requirements.txt
```

## Quick Start

```python
from scraper import WebScraper
from config import config

# Configure dry run mode
config.set('dry_run', True)

# Create scraper instance
scraper = WebScraper()

# Fetch content with fallback pattern
content = scraper.fetch('http://example.com')
```

## Configuration

Configuration is loaded from:
1. `config/config.yml` (YAML file)
2. Environment variables (overrides YAML)

Example environment variables:
```bash
DEBUG=false
DRY_RUN=true
LOG_LEVEL=INFO
TIMEOUT=30
```

## API Endpoints

- `GET /` - Application info
- `GET /config` - Current configuration
- `GET /health` - Health check
- `POST /scrape` - Scrape URL with fallback patterns

## Testing

```bash
# Run all tests
pytest tests/

# Run with coverage
pytest tests/ --cov=. --cov-report=term-missing

# Run linting
flake8 .
```

## License

MIT License