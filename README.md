# RuneRogue

A RuneScape-inspired Discord game with a web-based client, powered by a Python backend that provides multi-fallback web scraping and other services.

## Components

### Backend (Python/Flask)
- **Multi-fallback scraping**: requests → BeautifulSoup → Playwright
- **Configuration management**: YAML config files with environment variable overrides
- **Progress tracking**: Built-in `update_status()` function with progress reporting
- **Dry run support**: Test functionality without making actual requests
- **Flask web API**: RESTful endpoints for scraping operations
- **Comprehensive testing**: Unit tests with mocking support
- **CI/CD Pipeline**: Automated testing, linting, and deployment

### Client (TypeScript/React - `client/meta-ui`)
- **RuneScape-inspired game client**: Web-based interactive game.
- **Modern Stack**: Built with TypeScript, React, and Vite.

### Discord Integration (Potentially Deprecated/Future Feature)
- **Discord Integration**: User authentication via Discord OAuth2
- **Multiplayer Gameplay**: Real-time multiplayer using Colyseus

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Python 3.9+
- pip
- Discord Application (for OAuth2) - *if Discord features are to be used*
- MongoDB (for persistent storage) - *if Discord/Colyseus features are to be used*

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Giftedx/runerogue.git
   cd runerogue
   ```

2. **Backend Setup (Python):**

   ```bash
   pip install -r requirements.txt
   ```

3. **Frontend Setup (TypeScript/React):**

   ```bash
   cd client/meta-ui
   npm install
   cd ../..
   ```

4. Copy `.env.example` to `.env` and update with your configuration:

   ```bash
   cp .env.example .env
   ```

5. Update the `.env` file with your Discord OAuth2 credentials and other settings. (e.g., `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `FRONTEND_URL`)

### Configuration

#### Required Environment Variables

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Discord OAuth2 (if applicable)
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_REDIRECT_URI=http://localhost:3000/auth/discord/callback
DISCORD_BOT_TOKEN=your_discord_bot_token

# Session (if applicable)
SESSION_SECRET=your_session_secret

# Colyseus (if applicable)
COLYSEUS_WS_PORT=2567

# CORS
FRONTEND_URL=http://localhost:5173
```

## Running the Application

### Backend API

```bash
flask run
```

### Frontend Client

```bash
cd client/meta-ui
npm run dev
```

### Quick Start (Backend API Example)

```python
from scraper import WebScraper
from config import config
```

## Project Structure

- `app.py`: Main Flask application entry point.
- `config.py`: Application configuration.
- `monitoring.py`: Performance monitoring middleware.
- `metrics.py`: Metrics collection utilities.
- `health.py`: Health check endpoints.
- `code_analyzer.py`: Code analysis utilities (e.g., finding TODOs).
- `scraper.py`: Web scraping logic.
- `models.py`: Database models.
- `realtime.py`: Real-time communication (e.g., WebSockets).
- `social.py`: Social features.
- `requirements.txt`: Python dependencies.
- `client/meta-ui/`: Frontend application built with TypeScript/React.
- `client/godot/`: Godot Engine project (potentially deprecated or alternative client).
- `tests/`: Unit and integration tests.
- `docs/`: Additional documentation.

## API Endpoints (Backend Services)
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

## Contributing

1. Fork the repository
2. Create a new branch for your feature (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.