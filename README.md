# RuneRogue

A RuneScape-inspired Discord game built with Colyseus and TypeScript.

## Features

- **Multiplayer Gameplay**: Real-time multiplayer using Colyseus
- **Discord Integration**: User authentication via Discord OAuth2
- **Modern Stack**: Built with TypeScript, Node.js, and Express
- **Scalable Architecture**: Microservices-based architecture for easy scaling

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Discord Application (for OAuth2)
- MongoDB (for persistent storage)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Giftedx/runerogue.git
   cd runerogue
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and update with your configuration:

   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your Discord OAuth2 credentials and other settings.

### Configuration

#### Required Environment Variables

```env
# Server Configuration
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

## Running the Application

1. Start the development server:

   ```bash
   npm run dev
   ```

2. The server will be available at `http://localhost:3000`

## Project Structure

- `src/` - Source code
  - `server/` - Server-side code
    - `game/` - Game room and game logic
    - `auth/` - Authentication routes and middleware
    - `models/` - Database models
    - `services/` - Business logic
  - `client/` - Client-side code (if applicable)

## Development

### Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application
- `npm start` - Start the production server
- `npm test` - Run tests
- `npm run lint` - Lint the codebase
- `npm run format` - Format the code

## Contributing

1. Fork the repository
2. Create a new branch for your feature (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.