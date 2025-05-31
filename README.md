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
- **Social Features**: Multiplayer, party, and chat systems
- **Real-time Communication**: WebSocket support for instant messaging and presence
- **Database Persistence**: SQLAlchemy ORM with SQLite for data storage

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

### Social API Endpoints

- `POST /api/social/users` - Create user
- `PUT /api/social/users/{id}/status` - Update user status
- `GET /api/social/users/{id}/friends` - Get friends list
- `POST /api/social/users/{id}/friend-requests` - Send friend request
- `PUT /api/social/friend-requests/{id}/respond` - Accept/reject friend request
- `POST /api/social/parties` - Create party
- `POST /api/social/parties/{id}/invite` - Invite to party
- `POST /api/social/parties/{id}/leave` - Leave party
- `POST /api/social/chat/send` - Send chat message
- `GET /api/social/chat/messages` - Get chat messages

### WebSocket Events

- `user_login` - Authenticate and track presence
- `send_message` - Send real-time messages
- `update_status` - Update online status
- `join_party` / `leave_party` - Party room management

For detailed API documentation, see [docs/SOCIAL_API.md](docs/SOCIAL_API.md).

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