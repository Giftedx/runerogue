# Authentication Service

A Node.js/TypeScript JWT-based authentication microservice for RuneRogue.

## Features

- User registration and login
- JWT-based authentication with refresh tokens
- Session validation
- PostgreSQL database integration
- Rate limiting and security middleware
- Comprehensive API validation

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your database and JWT configuration
```

3. Start the service:

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## API Endpoints

### Public Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login with email/password
- `GET /health` - Health check

### Protected Endpoints

- `GET /api/auth/validate` - Validate current session
- `GET /api/auth/profile` - Get user profile

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm run test:watch
```

## Environment Variables

See `.env.example` for required environment variables.

## Database Schema

The service automatically creates the following tables:

- `users` - User accounts
- `refresh_tokens` - JWT refresh tokens

## Security Features

- Password hashing with bcrypt
- JWT tokens with expiration
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation
