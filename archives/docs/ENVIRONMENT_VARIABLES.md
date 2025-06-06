# Environment Variables Documentation

This document provides a comprehensive guide to all environment variables used in the RuneRogue project.

## Table of Contents

- [Overview](#overview)
- [Server Configuration](#server-configuration)
- [MCP Configuration](#mcp-configuration)
- [API Keys](#api-keys)
- [Authentication](#authentication)
- [Database Configuration](#database-configuration)
- [Redis Configuration](#redis-configuration)
- [GCP Configuration](#gcp-configuration)
- [Storage Configuration](#storage-configuration)
- [Kubernetes Configuration](#kubernetes-configuration)
- [Monitoring & Logging](#monitoring--logging)
- [Secret Management](#secret-management)
- [Email Configuration](#email-configuration)
- [Security](#security)
- [Development](#development)

## Overview

Environment variables are used to configure various aspects of the RuneRogue application. The `.env.example` file provides a template for creating your own `.env` file.

## Server Configuration

| Variable   | Description                           | Default     | Required |
| ---------- | ------------------------------------- | ----------- | -------- |
| `NODE_ENV` | Environment (development, production) | development | Yes      |
| `PORT`     | Server port                           | 3000        | Yes      |

## MCP Configuration

| Variable           | Description                                    | Default | Required                      |
| ------------------ | ---------------------------------------------- | ------- | ----------------------------- |
| `MCP_GITHUB_TOKEN` | GitHub personal access token for Copilot Agent | -       | Yes for GitHub Copilot Agents |

## API Keys

| Variable               | Description                   | Default | Required                          |
| ---------------------- | ----------------------------- | ------- | --------------------------------- |
| `BRAVE_SEARCH_API_KEY` | API key for Brave Search      | -       | For search functionality          |
| `FIRECRAWL_API_KEY`    | API key for Firecrawl         | -       | For web crawling                  |
| `TAVILY_API_KEY`       | API key for Tavily web search | -       | For AI-powered web search via MCP |

## Authentication

| Variable                | Description                   | Default                                     | Required                |
| ----------------------- | ----------------------------- | ------------------------------------------- | ----------------------- |
| `DISCORD_CLIENT_ID`     | Discord OAuth2 client ID      | -                                           | For Discord integration |
| `DISCORD_CLIENT_SECRET` | Discord OAuth2 client secret  | -                                           | For Discord integration |
| `DISCORD_REDIRECT_URI`  | Discord OAuth2 redirect URI   | http://localhost:3000/auth/discord/callback | For Discord integration |
| `DISCORD_BOT_TOKEN`     | Discord bot token             | -                                           | For Discord bot         |
| `SESSION_SECRET`        | Secret for session management | -                                           | Yes                     |

## Database Configuration

| Variable                    | Description                   | Default                                             | Required           |
| --------------------------- | ----------------------------- | --------------------------------------------------- | ------------------ |
| `DATABASE_URL`              | PostgreSQL connection string  | postgresql://user:password@localhost:5432/runerogue | Yes                |
| `CLOUD_SQL_CONNECTION_NAME` | GCP Cloud SQL connection name | -                                                   | For GCP deployment |

## Redis Configuration

| Variable         | Description             | Default                | Required |
| ---------------- | ----------------------- | ---------------------- | -------- |
| `REDIS_URL`      | Redis connection string | redis://localhost:6379 | Yes      |
| `REDIS_PASSWORD` | Redis password          | -                      | Optional |

## GCP Configuration

| Variable                         | Description                      | Default       | Required         |
| -------------------------------- | -------------------------------- | ------------- | ---------------- |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to GCP service account JSON | -             | For GCP services |
| `GCP_PROJECT_ID`                 | GCP project ID                   | -             | For GCP services |
| `GCP_REGION`                     | GCP region                       | us-central1   | For GCP services |
| `GCP_ZONE`                       | GCP zone                         | us-central1-a | For GCP services |

## Storage Configuration

| Variable          | Description                      | Default                 | Required          |
| ----------------- | -------------------------------- | ----------------------- | ----------------- |
| `GCS_BUCKET_NAME` | Google Cloud Storage bucket name | runerogue-storage       | For cloud storage |
| `CDN_URL`         | Content Delivery Network URL     | https://cdn.example.com | For production    |

## Kubernetes Configuration

| Variable           | Description               | Default                 | Required           |
| ------------------ | ------------------------- | ----------------------- | ------------------ |
| `KUBE_NAMESPACE`   | Kubernetes namespace      | runerogue               | For K8s deployment |
| `KUBE_CONFIG_PATH` | Path to Kubernetes config | /home/user/.kube/config | For K8s deployment |

## Monitoring & Logging

| Variable              | Description                                 | Default | Required |
| --------------------- | ------------------------------------------- | ------- | -------- |
| `MONITORING_ENABLED`  | Enable monitoring                           | true    | Optional |
| `LOG_AGGREGATION_URL` | URL for log aggregation service             | -       | Optional |
| `LOG_LEVEL`           | Logging level (DEBUG, INFO, WARNING, ERROR) | INFO    | Optional |

## Secret Management

| Variable                    | Description                   | Default | Required               |
| --------------------------- | ----------------------------- | ------- | ---------------------- |
| `SECRET_MANAGER_PROJECT_ID` | GCP Secret Manager project ID | -       | For GCP Secret Manager |
| `ENCRYPTION_KEY`            | Key for encryption            | -       | For sensitive data     |

## Email Configuration

| Variable           | Description          | Default               | Required                |
| ------------------ | -------------------- | --------------------- | ----------------------- |
| `SENDGRID_API_KEY` | SendGrid API key     | -                     | For email functionality |
| `FROM_EMAIL`       | Email sender address | noreply@runerogue.com | For email functionality |

## Security

| Variable         | Description               | Default | Required               |
| ---------------- | ------------------------- | ------- | ---------------------- |
| `JWT_SECRET_KEY` | Secret for JWT tokens     | -       | For JWT authentication |
| `API_RATE_LIMIT` | API rate limit per minute | 100     | Optional               |

## Development

| Variable           | Description                | Default               | Required              |
| ------------------ | -------------------------- | --------------------- | --------------------- |
| `FLASK_ENV`        | Flask environment          | development           | For Flask development |
| `TESTING`          | Enable testing mode        | false                 | For testing           |
| `DEBUG`            | Enable debug mode          | false                 | Optional              |
| `DRY_RUN`          | Run without making changes | false                 | Optional              |
| `TIMEOUT`          | Request timeout in seconds | 30                    | Optional              |
| `FRONTEND_URL`     | URL for frontend (CORS)    | http://localhost:5173 | For development       |
| `COLYSEUS_WS_PORT` | Colyseus WebSocket port    | 2567                  | For multiplayer       |

## Usage

1. Copy the `.env.example` file to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file with your specific configuration values.

3. In your application code, use a library like `python-dotenv` to load these variables:

   ```python
   from dotenv import load_dotenv
   load_dotenv()
   ```

4. Access the variables in your code:
   ```python
   import os
   database_url = os.getenv("DATABASE_URL")
   ```

## Security Considerations

- Never commit your `.env` file to version control
- Use different values for development and production
- Regularly rotate sensitive credentials
- Consider using a secrets manager for production environments
