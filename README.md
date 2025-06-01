# RuneRogue

<<<<<<< HEAD
A RuneScape-inspired Discord game built with Colyseus and TypeScript.
=======
A full-stack web scraping application with comprehensive multi-fallback patterns and browser-based game client.
>>>>>>> origin/copilot/fix-7

## Components

<<<<<<< HEAD
- **Multiplayer Gameplay**: Real-time multiplayer using Colyseus
- **Discord Integration**: User authentication via Discord OAuth2
- **Modern Stack**: Built with TypeScript, Node.js, and Express
- **Scalable Architecture**: Microservices-based architecture for easy scaling

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Discord Application (for OAuth2)
- MongoDB (for persistent storage)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Giftedx/runerogue.git
   cd runerogue
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and update with your configuration:

   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your Discord OAuth2 credentials and other settings.

### Configuration

#### Required Environment Variables

```env
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
```

## Running the Application

1. Start the development server:
=======
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
>>>>>>> origin/copilot/fix-7

   ```bash
   npm run dev
   ```

2. The server will be available at `http://localhost:3000`

## Project Structure

<<<<<<< HEAD
- `src/` - Source code
  - `server/` - Server-side code
    - `game/` - Game room and game logic
    - `auth/` - Authentication routes and middleware
    - `models/` - Database models
    - `services/` - Business logic
  - `client/` - Client-side code (if applicable)
=======
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
>>>>>>> origin/copilot/fix-7

## Development

### Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application
- `npm start` - Start the production server
- `npm test` - Run tests
- `npm run lint` - Lint the codebase
- `npm run format` - Format the code

<<<<<<< HEAD
## Contributing

1. Fork the repository
2. Create a new branch for your feature (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
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

```bash
# Run all tests
pytest tests/

# Run with coverage
pytest tests/ --cov=. --cov-report=term-missing

# Run linting
flake8 .
```
>>>>>>> origin/copilot/fix-7

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.