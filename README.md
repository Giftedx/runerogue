# RuneRogue Environment Configuration
# Copy this file to .env and update with your values

<<<<<<< HEAD
# Server Configuration
NODE_ENV=development
PORT=3000

# Discord OAuth2
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_REDIRECT_URI=http://localhost:3000/auth/discord/callback
DISCORD_BOT_TOKEN=your_discord_bot_token

# Session
SESSION_SECRET=your_session_secret

# Colyseus
COLYSEUS_WS_PORT=2567

# CORS
FRONTEND_URL=http://localhost:5173

# Application Configuration
=======
A full-stack web scraping application with comprehensive multi-fallback patterns and browser-based game client.

## Components

### Backend (Python/Flask)
- **Multi-fallback scraping**: requests → BeautifulSoup → Playwright
- **Configuration management**: YAML config files with environment variable overrides
- **Progress tracking**: Built-in `update_status()` function with progress reporting
- **Dry run support**: Test functionality without making actual requests
- **Flask web API**: RESTful endpoints for scraping operations
- **Comprehensive testing**: Unit tests with mocking support
- **CI/CD Pipeline**: Automated testing, linting, and deployment

### Client (Godot Engine 4.x)
- **Browser-ready**: HTML5/WebGL export for web deployment
- **Pixel-perfect rendering**: Optimized for crisp 2D graphics
- **Scene management**: Main menu, game scenes, and HUD system
- **Asset pipeline**: Git LFS integration for sprites, audio, fonts
- **CI integration**: Automated builds and exports

## Installation

### Backend Setup

```bash
pip install -r requirements.txt
```

### Client Setup

1. Install Godot Engine 4.3+ from [godotengine.org](https://godotengine.org/download)
2. Install Git LFS for asset management:
   ```bash
   git lfs install
   git lfs pull  # Download assets
   ```
3. Open `client/godot/` directory in Godot Engine

## Quick Start

### Backend API

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

### Client Development

1. Open the Godot project: `client/godot/`
2. Press F5 to run the project
3. For web builds:
   ```bash
   cd client/godot
   godot --headless --export-release "Web" builds/web/index.html
   ```

See [client/godot/README.md](client/godot/README.md) for detailed client documentation.

## Configuration

Configuration is loaded from:
1. `config/config.yml` (YAML file)
2. Environment variables (overrides YAML)

Example environment variables:
```bash
>>>>>>> origin/copilot/fix-7
DEBUG=false
DRY_RUN=false
LOG_LEVEL=INFO
TIMEOUT=30

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/runerogue
CLOUD_SQL_CONNECTION_NAME=project:region:instance

<<<<<<< HEAD
# Redis Configuration  
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# GCP Configuration
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
GCP_PROJECT_ID=your-project-id
GCP_REGION=us-central1
GCP_ZONE=us-central1-a
=======
### Backend Services
- `GET /` - Application info
- `GET /config` - Current configuration
- `GET /health` - Health check
- `POST /scrape` - Scrape URL with fallback patterns

### Client Integration
- Client builds are served via CI/CD artifacts
- Web client deployable to static hosting
- Backend API provides data services for client

## Testing
>>>>>>> origin/copilot/fix-7

# Storage Configuration
GCS_BUCKET_NAME=runerogue-storage
CDN_URL=https://cdn.example.com

# Kubernetes Configuration
KUBE_NAMESPACE=runerogue
KUBE_CONFIG_PATH=/home/user/.kube/config

# Monitoring & Logging
MONITORING_ENABLED=true
LOG_AGGREGATION_URL=

# Secret Management
SECRET_MANAGER_PROJECT_ID=your-project-id
ENCRYPTION_KEY=

# Email Configuration (SendGrid)
SENDGRID_API_KEY=
FROM_EMAIL=noreply@runerogue.com

# Security
JWT_SECRET_KEY=your-jwt-secret
API_RATE_LIMIT=100

# Development
FLASK_ENV=development
TESTING=false