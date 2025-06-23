# Discord Developer Application Setup Instructions

## After creating your Discord Application, fill in these values:

### From General Information tab:

- Application ID: Copy this to VITE_DISCORD_CLIENT_ID and DISCORD_CLIENT_ID

### From OAuth2 tab:

- Client Secret: Copy this to DISCORD_CLIENT_SECRET

### Required OAuth2 Redirects:

Add these URLs in the OAuth2 tab:

- https://localhost:3000/auth/discord/callback
- https://localhost:3000/

### Required Activities URL Mapping:

In the Activities tab, add:

- Prefix: /
- Target: https://localhost:3000

### Generate JWT Secret:

Run this command to generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Update your .env files:

1. packages/phaser-client/.env - Update VITE_DISCORD_CLIENT_ID
2. packages/game-server/.env - Update DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, and JWT_SECRET
