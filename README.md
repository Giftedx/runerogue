# RuneScape Discord Game

<<<<<<< HEAD
A multiplayer RuneScape-inspired game that runs directly in Discord using Colyseus for real-time multiplayer and Discord OAuth2 for authentication.
=======
A full-stack web scraping application with comprehensive multi-fallback patterns and browser-based game client.
>>>>>>> origin/copilot/fix-7

## Components

<<<<<<< HEAD
- **Real-time Multiplayer**: Built with Colyseus for seamless multiplayer experiences
- **Discord Integration**: Login with Discord and play with friends
- **Modern Tech Stack**: TypeScript, Node.js, and WebSockets
- **Scalable Architecture**: Designed for horizontal scaling
- **Comprehensive Testing**: Unit and integration tests
- **CI/CD Ready**: GitHub Actions for automated testing and deployment

## Prerequisites

- Node.js 18+
- npm or yarn
- Docker (for local development)
- Discord Developer Account
- Google Cloud Account (for deployment)
=======
### Backend (Python/Flask)
- **Multi-fallback scraping**: requests → BeautifulSoup → Playwright
- **Configuration management**: YAML config files with environment variable overrides
- **Progress tracking**: Built-in `update_status()` function with progress reporting
- **Dry run support**: Test functionality without making actual requests
- **Flask web API**: RESTful endpoints for scraping operations
- **Comprehensive testing**: Unit tests with mocking support
- **CI/CD Pipeline**: Automated testing, linting, and deployment
>>>>>>> origin/copilot/fix-7

### Client (Godot Engine 4.x)
- **Browser-ready**: HTML5/WebGL export for web deployment
- **Pixel-perfect rendering**: Optimized for crisp 2D graphics
- **Scene management**: Main menu, game scenes, and HUD system
- **Asset pipeline**: Git LFS integration for sprites, audio, fonts
- **CI integration**: Automated builds and exports

## Installation

<<<<<<< HEAD
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/runerogue.git
   cd runerogue
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the example environment file and update with your credentials:
   ```bash
   cp .env.example .env
   ```
=======
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

4. Start the development server:
   ```bash
   npm run dev
   ```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run linter
- `npm run format` - Format code

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

Configuration is done through environment variables. See `.env.example` for all available options.

### Required Environment Variables

```bash
# Server
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

## Project Structure

```
src/
├── client/                 # Frontend code
│   ├── components/         # Reusable UI components
│   ├── scenes/             # Game scenes
│   └── utils/              # Utility functions
├── server/
│   ├── auth/              # Authentication logic
│   ├── game/               # Game server code
│   ├── models/             # Database models
│   └── routes/             # API routes
└── shared/                 # Shared code between client and server
```

## API Endpoints

<<<<<<< HEAD
=======
### Backend Services
- `GET /` - Application info
- `GET /config` - Current configuration
>>>>>>> origin/copilot/fix-7
- `GET /health` - Health check
- `GET /auth/discord` - Start Discord OAuth2 flow
- `GET /auth/discord/callback` - Discord OAuth2 callback
- `GET /auth/me` - Get current user info
- `WS /` - WebSocket endpoint for game server

### Client Integration
- Client builds are served via CI/CD artifacts
- Web client deployable to static hosting
- Backend API provides data services for client

## Testing

Run the test suite:

```bash
npm test
```

## Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

For production deployment, it's recommended to use a process manager like PM2 and set up Nginx as a reverse proxy.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT
