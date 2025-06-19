# RuneRogue

<<<<<<< HEAD
A RuneScape-inspired game project featuring a polyglot architecture with a TypeScript game server, Python FastAPI economy API, Python Flask legacy backend, and a Python FastAPI MCP server. It includes a web-based client and integrates AI-assisted development.

For a comprehensive overview of the system architecture, refer to the [Architecture Document](docs/ARCHITECTURE.md).

## AI-Assisted Development

### MCP Configuration

This project uses Model Control Protocol (MCP) for AI-assisted development. To set up MCP:

1. Copy `.env.example` to `.env` and fill in your API keys:

   ```bash
   cp .env.example .env
   ```

2. Required API keys:

   - `GITHUB_TOKEN`: GitHub Personal Access Token with appropriate permissions
   - `BRAVE_SEARCH_API_KEY`: API key for Brave Search
   - `FIRECRAWL_API_KEY`: API key for Firecrawl

3. The MCP configuration is in `.github/copilot/mcp_config.json`. This file should not contain any secrets directly - they should be provided via environment variables.

4. For development, you can use the example configuration:

   ```bash
   cp .github/copilot/mcp_config.example.json .github/copilot/mcp_config.json
   ```

### GitHub Copilot Agents Integration

RuneRogue integrates GitHub Copilot Agents with custom MCP tools to automate development tasks including testing, linting, and documentation generation.

### Key Features

- **Automated Task Assignment**: Issues labeled with `copilot` or `ai-task` are automatically assigned to GitHub Copilot
- **Self-hosted Runner Execution**: Tasks are processed on a self-hosted Windows runner
- **Custom MCP Tools**: Extended capabilities for RuneRogue-specific tasks
- **Workflow Automation**: Create and assign tasks programmatically
- **Defensive Colyseus Schema Patterns**: All schema fields (e.g., inventory, loot, trade items) are now strictly enforced as `ArraySchema` and schema instances, with runtime checks and defensive test setup.
- **Comprehensive Test Coverage**: All core systems (combat, procedural generation, loot, inventory, trade) have robust unit and integration tests. Test suite is run after every patch.
- **Agentic Maintenance**: All new features and bug fixes are maintained by GitHub Copilot Agents, with minimal manual intervention.

### Documentation

- [GitHub Copilot Agents Guide](docs/COPILOT_AGENTS_GUIDE.md) - Comprehensive guide to using Copilot Agents with RuneRogue
- [GitHub Copilot Agents Integration](docs/GITHUB_COPILOT_AGENTS.md) - Technical details of the integration
- [AI-Managed Issue Creation](docs/AI_MANAGED_ISSUES.md) - System for AI agents to create and manage issues
- [Environment Variables](docs/ENVIRONMENT_VARIABLES.md) - Required environment variables for the integration

### Quick Start

1. Create a task: Create a GitHub Issue using the Copilot Agent Task template
2. Add labels: Add the `copilot` label to the issue
3. Assignment: The issue will be automatically assigned to GitHub Copilot
4. Execution: The self-hosted runner will process the task
5. Results: GitHub Copilot will comment on the issue with the results

### Progress Update (June 2025)

- **CombatSystem**: Refactored for OSRS-authentic logic; all tests now pass.
- **ProceduralGenerator**: Fully tested and robust; all procedural generation tests pass.
- **GameRoom & Multiplayer**: Persistent Colyseus schema serialization errors remain in trade/loot and player join/movement tests, but all direct schema field assignments are now using `ArraySchema` and schema instances. Defensive runtime checks and forced re-wrapping of arrays/objects as schema types have been added throughout the codebase and tests.
- **Next Steps**: Continue auditing for any remaining schema field mutations with plain arrays/objects. Patch and re-test until all Colyseus serialization errors are resolved and all GameRoom tests pass. Update documentation to reflect the new defensive patterns and schema usage requirements.

### Example: Generate Documentation

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

> > > > > > > origin/copilot/fix-7

### Backend Setup

```bash
# Using the workflow dispatch feature
git checkout main
git pull

# Or using the test script directly
node scripts/test_mcp_tools.js generate_docs --module_path=agents/osrs_agent_system.py --output_format=markdown
```

<<<<<<< HEAD

## Usage

### Usage Instructions

1. Create an issue using the Copilot Agent task template
2. Add the `copilot` or `ai-task` label
3. The issue will be automatically assigned to GitHub Copilot
4. The self-hosted runner will process the task
5. Results will be posted as comments on the issue

For detailed information, see the following documentation:

- [GitHub Copilot Agents Guide](docs/GITHUB_COPILOT_AGENTS.md)
- [GitHub Actions and Runners](docs/GITHUB_ACTIONS_RUNNERS.md)
- [Environment Variables](docs/ENVIRONMENT_VARIABLES.md)

## Components

### Core Components

- **TypeScript Game Server**: Manages game state, real-time multiplayer (Colyseus), Discord OAuth2, and integrates with other backend services.
- **Python FastAPI Economy API**: Handles all game economy operations, including players, items, trades, and Grand Exchange.
- **Python Flask Legacy Backend**: Provides web scraping, health monitoring, and other legacy functionalities.
- **Python FastAPI MCP Server**: Facilitates AI agent interactions, tool execution, and research capabilities.
- **Clients**: Godot Game Client and Web Meta UI (TypeScript/React) for interactive gameplay.

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Python 3.9+
- pip
- Discord Application (for OAuth2) - _if Discord features are to be used_
- MongoDB (for persistent storage) - _if Discord/Colyseus features are to be used_

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Giftedx/runerogue.git
   cd runerogue
   ```

2. **Backend Setup (Python):**

   ```bash
   cd tools-python
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cd ..
   ```

3. **Frontend Setup (TypeScript/React):**

   ```bash
   cd server-ts
   npm install
   cd ..

   cd server-ts/client
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

=======

### Client Setup

1. Install Godot Engine 4.3+ from [godotengine.org](https://godotengine.org/download)
2. Install Git LFS for asset management:
   ```bash
   git lfs install
   git lfs pull  # Download assets
   ```
3. Open `client/godot/` directory in Godot Engine

## Quick Start

> > > > > > > origin/copilot/fix-7

### Backend API

```python
from scraper import WebScraper
from config import config
```

<<<<<<< HEAD

## Project Structure

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

> > > > > > > origin/copilot/fix-7

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

## Contributing

1. Fork the repository
2. Create a new branch for your feature (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
