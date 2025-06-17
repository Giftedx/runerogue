# 🎮 RuneRogue Discord Activity Setup Guide

## Quick Start (5 minutes)

### Prerequisites ✅ COMPLETED

- [x] HTTPS certificates generated (`key.pem`, `cert.pem`)
- [x] Discord SDK installed and updated to v1.9.0
- [x] Discord integration code implemented
- [x] HTTPS server running on `https://localhost:5174/`

### 🎯 Next Steps: Discord Application Setup

### Step 1: Create Discord Application

1. **Go to Discord Developer Portal**:

   ```
   https://discord.com/developers/applications
   ```

2. **Create New Application**:

   - Click "New Application"
   - Name: `RuneRogue` (or your preferred name)
   - Accept terms and create

3. **Enable Activities**:

   - Go to "Activities" tab in your application
   - Click "Create New URL Mapping"
   - Target URL: `https://localhost:5174/`
   - Description: `RuneRogue Development`

4. **Copy Application ID**:
   - Go to "General Information" tab
   - Copy your "Application ID"

### Step 2: Configure Environment Variables

1. **Update Client Environment**:

   ```bash
   # Edit: client/.env
   VITE_DISCORD_CLIENT_ID=your_actual_application_id_here
   ```

2. **Update Server Environment** (if needed):
   ```bash
   # Edit: packages/server/.env (if it exists)
   DISCORD_CLIENT_ID=your_actual_application_id_here
   DISCORD_CLIENT_SECRET=your_client_secret_here
   ```

### Step 3: Test Discord Activity

1. **Restart the client** (to pick up new env vars):

   ```bash
   # Stop current server (Ctrl+C) then restart:
   cd client && npm run dev
   ```

2. **Open Discord and test**:
   - Open Discord desktop app
   - Go to any server/DM
   - Use the "+" button next to the message box
   - Look for "Activities" or "Browse Activities"
   - Your activity should appear for local testing

## 🎮 Current Status

### ✅ What's Working

- HTTPS development server on `https://localhost:5174/`
- Discord SDK integration in the client
- Real-time multiplayer game connection
- React UI with Discord user detection
- Automatic Discord presence updates

### 🔧 What's Configured

- Discord Activity manifest (`public/discord-activity.json`)
- Discord integration service (`src/discord/DiscordActivity.ts`)
- HTTPS certificates for local development
- Vite configuration with proper CSP headers

### 📋 Testing Checklist

#### Local Testing:

- [ ] Open `https://localhost:5174/` in browser (should work)
- [ ] Click "Connect" → "Join Room" (should show game)
- [ ] Open browser console (should show Discord detection logs)

#### Discord Testing:

- [ ] Set up Discord Application ID
- [ ] Test in Discord desktop app
- [ ] Verify Discord user authentication
- [ ] Check Discord presence updates

## 🚀 Production Deployment

### For Production (later):

1. Deploy client to HTTPS domain (e.g., Netlify, Vercel)
2. Update Discord Activity URL mapping to production URL
3. Configure production environment variables
4. Submit for Discord Activity store review (optional)

## 🎯 Discord Activity Features

### Current Implementation:

- **Authentication**: Discord OAuth2 user login
- **Presence**: Real-time activity status updates
- **User Info**: Display Discord username and avatar
- **Game State**: Updates Discord status based on game actions
- **Multiplayer**: Shows player count in Discord presence

### Example Discord Presence:

```
Playing RuneRogue
2 players in room
```

## 🔧 Troubleshooting

### Common Issues:

1. **"Discord not detected"**:

   - Running outside Discord iframe
   - Expected in development mode
   - Will work when properly configured

2. **HTTPS Certificate Issues**:

   - Already resolved ✅
   - Certificates generated and working

3. **Environment Variables**:
   - Make sure to restart client after changing .env
   - Check browser developer tools for env var values

### Debug Commands:

```bash
# Check if HTTPS server is running
curl -k https://localhost:5174/

# Check environment variables are loaded
# Open browser console and type: import.meta.env
```

## 🎉 Next Steps After Setup

Once Discord Application ID is configured:

1. **Test multiplayer** - Open multiple Discord windows with the activity
2. **Test presence** - Verify Discord status updates properly
3. **Test authentication** - Check Discord user info appears
4. **Test game features** - Move players, join/leave rooms
5. **Production deployment** - Deploy to public HTTPS domain

## 📚 Additional Resources

- [Discord Activities Documentation](https://discord.com/developers/docs/activities/overview)
- [Discord SDK Documentation](https://github.com/discord/embedded-app-sdk)
- [RuneRogue Architecture Docs](../docs/ARCHITECTURE.md)
