# Contributing to RuneRogue

Thank you for your interest in contributing to RuneRogue! This document provides guidelines and instructions for contributing to the project.

## Table of Contents
- [Development Environment Setup](#development-environment-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [GitHub Copilot Agents Workflow](#github-copilot-agents-workflow)
- [Environment Variables](#environment-variables)

## Development Environment Setup

### Prerequisites
- Python 3.9+
- Node.js 16+
- Docker and Docker Compose
- MongoDB
- Redis

### Setting Up Your Development Environment

1. **Clone the repository**
   ```bash
   git clone https://github.com/Giftedx/runerogue.git
   cd runerogue
   ```

2. **Set up Python environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Set up Node.js environment**
   ```bash
   cd client
   npm install
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Start the development servers**
   ```bash
   # Backend
   python app.py
   
   # Frontend
   cd client
   npm run dev
   ```

## Project Structure

- `agents/`: GitHub Copilot Agent system and related utilities
- `client/`: Frontend applications (React, Godot)
- `config/`: Configuration files and utilities
- `docs/`: Project documentation
- `economy/`: Economy and trading system
- `economy_models/`: Economic models and data parsers
- `infra/`: Infrastructure as code (Terraform, Kubernetes)
- `scripts/`: Utility scripts
- `services/`: Microservices
- `src/`: Core application code
- `static/`: Static assets
- `tests/`: Test suite

## Coding Standards

### Python
- Follow PEP 8 style guide
- Use type hints
- Write comprehensive docstrings in Google style format
- Maximum line length of 88 characters (Black formatter)

### JavaScript/TypeScript
- Follow ESLint configuration
- Use TypeScript for type safety
- Follow project's component structure

## Testing

- Write unit tests for all new code
- Ensure tests pass before submitting a PR
- Aim for at least 80% test coverage

To run tests:
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=.

# Run specific tests
pytest tests/test_specific_module.py
```

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes and add tests
3. Ensure all tests pass
4. Update documentation as needed
5. Submit a pull request to `main`
6. Address review comments

## GitHub Copilot Agents Workflow

RuneRogue uses GitHub Copilot Agents for automated task management. To interact with these agents:

1. **Creating Tasks for Agents**
   - Create a GitHub Issue with a clear title and description
   - Use appropriate labels for categorization
   - Assign the issue to `@github/copilot`

2. **Task Format**
   - Provide a clear description of the task
   - Include expected behavior/output
   - Reference relevant code files
   - Specify any dependencies or constraints

3. **Effective Usage Patterns**
   - Break down large tasks into smaller, focused issues
   - Be specific and detailed in your prompts
   - Include example inputs/outputs when relevant
   - Specify the programming language and frameworks

4. **Task Management**
   - Track progress through issue comments
   - Use GitHub Projects for organization
   - Close issues when complete

## Environment Variables

RuneRogue uses environment variables for configuration. Copy `.env.example` to `.env` and update the values as needed. Key environment variables include:

- `NODE_ENV`: Development environment (development, production)
- `PORT`: Server port
- `MCP_GITHUB_TOKEN`: GitHub personal access token for Copilot Agent
- `BRAVE_SEARCH_API_KEY`: API key for Brave Search
- `FIRECRAWL_API_KEY`: API key for Firecrawl
- `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_BOT_TOKEN`: Discord integration
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string

See `.env.example` for a complete list of environment variables.
