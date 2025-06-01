# RuneRogue

A RuneScape-inspired Discord game with a web-based client, powered by a Python backend that provides multi-fallback web scraping and other services.

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

### Documentation

- [GitHub Copilot Agents Guide](docs/COPILOT_AGENTS_GUIDE.md) - Comprehensive guide to using Copilot Agents with RuneRogue
- [GitHub Copilot Agents Integration](docs/GITHUB_COPILOT_AGENTS.md) - Technical details of the integration
- [Environment Variables](docs/ENVIRONMENT_VARIABLES.md) - Required environment variables for the integration

### Quick Start

1. Create a task: Create a GitHub Issue using the Copilot Agent Task template
2. Add labels: Add the `copilot` label to the issue
3. Assignment: The issue will be automatically assigned to GitHub Copilot
4. Execution: The self-hosted runner will process the task
5. Results: GitHub Copilot will comment on the issue with the results

### Example: Generate Documentation

```bash
# Using the workflow dispatch feature
git checkout main
git pull

# Or using the test script directly
node scripts/test_mcp_tools.js generate_docs --module_path=agents/osrs_agent_system.py --output_format=markdown
```

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