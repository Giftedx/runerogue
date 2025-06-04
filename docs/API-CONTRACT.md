# RuneRogue API Contract Documentation

**NOTE:** The primary authentication mechanism for the RuneRogue TypeScript Game Server is currently Discord OAuth2. This document describes a more generic authentication service that may represent a future planned service or an outdated specification. Please refer to the TypeScript Game Server's `src/server/routes/auth.ts` for the current authentication implementation.



## Authentication Service API

Base URL: `https://auth.runerogue.com` (production) or `http://localhost:3001` (development)

### Authentication Flow

The authentication service uses JWT tokens with the following flow:

1. User registers or logs in
2. Service returns access token (expires in 7 days) and refresh token (expires in 30 days)
3. Client includes access token in `Authorization: Bearer <token>` header for protected requests
4. When access token expires, client can use refresh token to get new tokens

### Endpoints

#### Public Endpoints

##### POST /api/auth/register

Register a new user account.

**Request Body:**

```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "SecurePassword123"
}
```

**Validation Rules:**

- `email`: Valid email format, unique
- `username`: 3-50 characters, unique
- `password`: Minimum 8 characters, must contain uppercase, lowercase, and number

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username",
      "createdAt": "2024-01-01T00:00:00Z"
    },
    "tokens": {
      "accessToken": "jwt-token",
      "refreshToken": "refresh-token",
      "expiresIn": 604800
    }
  },
  "message": "User registered successfully"
}
```

**Error Response (400 Bad Request):**

```json
{
  "success": false,
  "error": "User with this email or username already exists"
}
```

##### POST /api/auth/login

Authenticate user with email and password.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username"
    },
    "tokens": {
      "accessToken": "jwt-token",
      "refreshToken": "refresh-token",
      "expiresIn": 604800
    }
  },
  "message": "Login successful"
}
```

**Error Response (401 Unauthorized):**

```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

#### Protected Endpoints

All protected endpoints require the `Authorization: Bearer <access-token>` header.

##### GET /api/auth/validate

Validate current session and return user information.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username"
    },
    "valid": true
  },
  "message": "Session is valid"
}
```

**Error Response (401/403):**

```json
{
  "success": false,
  "error": "Invalid or expired token"
}
```

##### GET /api/auth/profile

Get detailed user profile information.

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "createdAt": "2024-01-01T00:00:00Z",
    "isActive": true
  }
}
```

#### Health Check

##### GET /health

Service health check endpoint.

**Response (200 OK):**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "service": "auth-service"
}
```

### Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": "Error description",
  "data": {} // Optional additional error details
}
```

Common HTTP status codes:

- `200` - Success
- `201` - Created (registration)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (invalid token)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

### Rate Limiting

- 100 requests per 15 minutes per IP address
- Exceeded limits return HTTP 429 with retry information

### Security Headers

All responses include security headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (HTTPS only)

### CORS Policy

- Allowed origins configurable via `CORS_ORIGIN` environment variable
- Credentials allowed for authenticated requests
- Preflight requests supported for complex requests

## Integration Notes

### Meta UI Integration

The Meta UI client automatically:

1. Stores JWT tokens in secure HTTP-only cookies
2. Includes tokens in API requests via interceptors
3. Handles token expiration and redirects to login
4. Provides authentication context throughout the app

### HTTPS Requirements

- Production deployment must use HTTPS
- JWT tokens should only be transmitted over secure connections
- Cookies set with `Secure` flag in production

### Database Schema

The authentication service manages these PostgreSQL tables:

**users table:**

- `id` (UUID, primary key)
- `email` (varchar, unique)
- `username` (varchar, unique)
- `password_hash` (varchar)
- `created_at` (timestamp)
- `updated_at` (timestamp)
- `is_active` (boolean)

**refresh_tokens table:**

- `id` (UUID, primary key)
- `user_id` (UUID, foreign key to users)
- `token_hash` (varchar)
- `expires_at` (timestamp)
- `created_at` (timestamp)
- `is_revoked` (boolean)

### Environment Variables

Required environment variables for the auth service:

```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
CORS_ORIGIN=https://app.runerogue.com
```
