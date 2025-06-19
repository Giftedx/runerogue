# RuneRogue API Documentation

**NOTE:** This document provides an overview of some API endpoints, primarily those exposed by the Python Flask Legacy Backend. For the most comprehensive and up-to-date API documentation for all services (TypeScript Game Server, Python FastAPI Economy API, Python Flask Legacy Backend, and Python FastAPI MCP Server), please refer to the consolidated OpenAPI (Swagger) documentation available at `/api-docs` (served from the TypeScript Game Server) or directly in `src/server/docs/swagger.yaml`.

For an overall understanding of the system architecture and inter-service communication, please consult the [Architecture Document](ARCHITECTURE.md).

This document provides comprehensive documentation for the RuneRogue API endpoints.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Base URL](#base-url)
- [Endpoints](#endpoints)
  - [Home](#home)
  - [Game](#game)
  - [Configuration](#configuration)
  - [Web Scraping](#web-scraping)
  - [Health Checks](#health-checks)
  - [Performance Monitoring](#performance-monitoring)
  - [Improvement Suggestions](#improvement-suggestions)
  - [Metrics](#metrics)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Versioning](#versioning)

## Overview

The RuneRogue API provides access to various features of the RuneRogue game, including game state, configuration, web scraping, health monitoring, and performance metrics.

## Authentication

Some endpoints require authentication. Authentication is handled via JWT tokens, which should be included in the `Authorization` header of the request.

```
Authorization: Bearer <token>
```

## Base URL

The base URL for all API endpoints is:

- Development: `http://localhost:3000`
- Production: `https://api.runerogue.com`

## Endpoints

### Home

#### GET /

Returns basic information about the API.

**Response:**

```json
{
  "message": "RuneRogue API",
  "version": "1.0.0",
  "self_building": {
    "enabled": true,
    "milestone": "M1",
    "status": "active"
  },
  "config": {
    "debug": false,
    "dry_run": false,
    "log_level": "INFO"
  }
}
```

### Game

#### GET /game

Serves the Phaser game's index.html.

**Response:**

- HTML content of the game page

### Configuration

#### GET /config

Returns the current configuration of the application.

**Response:**

```json
{
  "debug": false,
  "dry_run": false,
  "log_level": "INFO",
  "timeout": 30
}
```

### Web Scraping

#### POST /scrape

Scrapes a URL using a multi-fallback pattern.

**Request Body:**

```json
{
  "url": "https://example.com"
}
```

**Response (Success):**

```json
{
  "success": true,
  "url": "https://example.com",
  "content_length": 12345,
  "dry_run": false
}
```

**Response (Error):**

```json
{
  "success": false,
  "url": "https://example.com",
  "error": "All fallback methods failed"
}
```

**Status Codes:**

- 200 OK: Successful scrape
- 400 Bad Request: Missing URL
- 500 Internal Server Error: Scraping failed

### Health Checks

#### GET /health

Basic health check endpoint.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": 1622548800
}
```

#### GET /health/detailed

Comprehensive health check with performance metrics and health scoring.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": 1622548800,
  "health_score": {
    "overall": 95.5,
    "components": {
      "api": {
        "score": 98.0,
        "status": "healthy",
        "message": "API is responding normally"
      },
      "database": {
        "score": 92.0,
        "status": "healthy",
        "message": "Database connections are stable"
      }
    },
    "trend": "stable",
    "alerts": []
  },
  "performance": {
    "baseline_status": "established",
    "current_response_time_p95": 120,
    "current_error_rate": 0.01,
    "regression_check": {
      "status": "no_regression",
      "details": "Performance is within expected parameters"
    }
  },
  "self_building": {
    "milestone": "M1",
    "enabled": true,
    "last_improvement": null,
    "health_monitoring": "active"
  }
}
```

### Performance Monitoring

#### GET /performance/baseline

Get the current performance baseline.

**Response:**

```json
{
  "status": "baseline_exists",
  "baseline": {
    "response_time_p50": 50,
    "response_time_p95": 120,
    "response_time_p99": 200,
    "error_rate": 0.01,
    "throughput": 100,
    "timestamp": 1622548800,
    "age_hours": 24
  }
}
```

#### POST /performance/baseline

Establish a new performance baseline.

**Response:**

```json
{
  "status": "baseline_established",
  "baseline": {
    "response_time_p50": 50,
    "response_time_p95": 120,
    "response_time_p99": 200,
    "error_rate": 0.01,
    "throughput": 100,
    "timestamp": 1622548800
  }
}
```

### Improvement Suggestions

#### GET /improvements/suggestions

Get current improvement suggestions.

**Query Parameters:**

- `status` (optional): Filter suggestions by status (e.g., "pending", "completed")

**Response:**

```json
[
  {
    "id": 1,
    "type": "performance",
    "priority": "high",
    "title": "Improve System Health Score",
    "description": "Current health score is 65.0. Check alerts for specific issues.",
    "action": "investigate_health_alerts",
    "risk_level": "medium",
    "milestone": "M1",
    "status": "pending",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
  }
]
```

### Metrics

#### GET /metrics

Prometheus-style metrics endpoint.

**Response:**

```
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
# HELP http_request_duration_seconds HTTP request duration
# TYPE http_request_duration_seconds histogram
# HELP system_cpu_usage_percent CPU usage percentage
# TYPE system_cpu_usage_percent gauge
# HELP system_memory_usage_bytes Memory usage in bytes
# TYPE system_memory_usage_bytes gauge

http_requests_total{method="GET",path="/health",status="200"} 1234
http_request_duration_seconds{method="GET",path="/health",quantile="0.5"} 0.05
http_request_duration_seconds{method="GET",path="/health",quantile="0.95"} 0.12
http_request_duration_seconds{method="GET",path="/health",quantile="0.99"} 0.2
system_cpu_usage_percent 25.5
system_memory_usage_bytes 1073741824
```

## Error Handling

The API uses standard HTTP status codes to indicate the success or failure of a request:

- 200 OK: The request was successful
- 400 Bad Request: The request was invalid or missing required parameters
- 401 Unauthorized: Authentication is required or failed
- 403 Forbidden: The authenticated user does not have permission to access the resource
- 404 Not Found: The requested resource was not found
- 500 Internal Server Error: An error occurred on the server

Error responses include a JSON object with an `error` field containing a human-readable error message.

## Rate Limiting

The API is rate-limited to prevent abuse. The default rate limit is 100 requests per minute per IP address. Rate limit information is included in the response headers:

- `X-RateLimit-Limit`: The maximum number of requests allowed per minute
- `X-RateLimit-Remaining`: The number of requests remaining in the current minute
- `X-RateLimit-Reset`: The time at which the rate limit will reset (Unix timestamp)

## Versioning

The API is versioned to ensure backward compatibility. The current version is v1. The version can be specified in the URL:

```
/api/v1/endpoint
```

If no version is specified, the latest version is used.
