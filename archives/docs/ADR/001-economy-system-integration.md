# ADR 001: Economy System Integration Between TypeScript Game Server and Python Models

## Date

2025-06-03

## Status

Proposed

## Context

The RuneRogue codebase is a polyglot application with multiple components:

- TypeScript game server using Express, Colyseus, and TypeORM (MongoDB)
- Python MCP server for AI integration running on port 8000
- Legacy Flask application handling web scraping and health monitoring on port 5000
- Python economy models using SQLAlchemy (currently not integrated)

The economy models represent a comprehensive system including players, items, trades, and a Grand Exchange market system. These models are fully developed in Python using SQLAlchemy but currently lack integration with the TypeScript game server that serves as the primary application interface.

The economy system is a critical component for the game's functionality, but the integration approach is undefined in the current architecture.

## Decision Drivers

- Minimize code duplication
- Maintain separation of concerns
- Allow independent scaling of components
- Consider performance and latency requirements for real-time gameplay
- Leverage existing technology stack and expertise
- Facilitate future development and maintenance
- Ensure data consistency across systems

## Options Considered

### Option 1: REST API Integration

Create a dedicated FastAPI service for the economy system that provides endpoints for the TypeScript server to consume.

**Pros:**

- Clear separation of concerns
- Independent scaling and deployment
- Standard HTTP interface
- Leverages Python's strengths for data processing
- Simplest to implement conceptually

**Cons:**

- Potential latency issues for high-frequency operations
- Network overhead
- Requires API versioning strategy
- Need for careful error handling and retry logic

### Option 2: Shared Database Access

Configure both systems to access the same database, with TypeScript server using an ORM compatible with the SQLAlchemy schema.

**Pros:**

- No network overhead for queries
- Direct access to data
- No data duplication

**Cons:**

- Tight coupling between services
- Schema migration challenges
- Potential for database contention
- Violates service independence

### Option 3: Message Queue Integration

Implement a message broker (RabbitMQ/Redis) for communication between the TypeScript server and Python economy system.

**Pros:**

- Decoupled architecture
- Built-in retry and reliability
- Better for asynchronous operations
- Good for high-volume workloads

**Cons:**

- Increased complexity
- Another component to maintain
- Not ideal for synchronous operations
- Potential message format versioning challenges

## Decision

**Option 1: REST API Integration** is selected as the integration approach.

We will create a dedicated FastAPI service for the economy system that exposes a comprehensive REST API. The TypeScript game server will consume these endpoints to interact with the economy models.

## Implementation Details

### Economy API Service

- Develop a FastAPI application exposing economy model endpoints
- Run on port 8001 to avoid conflict with existing services
- Implement JWT authentication matching the game server
- Include Swagger/OpenAPI documentation
- Implement comprehensive request/response validation
- Add rate limiting and monitoring

### API Endpoints (Core)

- `/players` - CRUD operations for player economy data
- `/items` - Item catalog and properties
- `/inventory` - Player inventory management
- `/trades` - Direct player-to-player trading
- `/grand-exchange` - Market system for buy/sell orders
- `/price-history` - Historical price data

### TypeScript Client

- Create a TypeScript client library for the Economy API
- Implement retry and circuit-breaking for reliability
- Add caching for frequently accessed, relatively static data

### Deployment

- Deploy as a separate service alongside the existing Flask app
- Consider containerization for consistent deployment

### Migration Strategy

- Initially deploy in parallel with existing systems
- Gradually migrate functionality from Flask app if overlapping

## Consequences

### Positive

- Clear separation of concerns maintains the strengths of each language
- Independent scaling of economy system based on load
- API documentation provides clear integration contracts
- Easier to maintain and evolve independently
- Reduced risk of breaking changes

### Negative

- Network overhead for API calls
- Need for careful API versioning and backward compatibility
- Potential consistency issues if transactions span multiple API calls
- Increased operational complexity with multiple services

### Neutral

- Requires implementation of comprehensive integration tests
- API design will heavily influence performance and usability

## Alternatives Not Chosen

**Shared Database Access** was rejected due to the tight coupling it would create between services and the challenges of managing schema migrations across different language ecosystems.

**Message Queue Integration** was determined to be overly complex for the initial integration and better suited for specific high-volume, asynchronous use cases that may be implemented as enhancements later.

## Related Decisions

This decision will influence:

- Authentication and authorization approach across services
- Deployment and scaling strategy
- Monitoring and observability implementation

## Notes

- Consider implementing selective WebSocket endpoints for real-time price updates and trade notifications
- Review this decision after 3 months of production use to evaluate performance and integration efficiency
- Document specific rate limits and caching strategies as part of the implementation plan
