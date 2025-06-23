# Discord Activities Configuration Guide

## 🚨 Missing Activities Tab Issue

If you don't see the "Activities" tab in your Discord Developer Portal, you need to:

### Option 1: Enable Activities in General Settings

1. Go to **General Information** tab
2. Look for **"Embedded App SDK"** or **"Activities"** section
3. Enable/toggle **"Embedded App SDK"** if available
4. Save changes and refresh the page

### Option 2: Request Activities Access

Discord Activities may require approval for some applications:

1. Go to **General Information**
2. Look for **"Special Permissions"** or **"Features"** section
3. Request **"Embedded App SDK"** access if needed

### Option 3: Use Alternative Activity Setup

If Activities tab is not available, you can configure through the URL mapping:

#### Manual Activity Configuration

Add these settings to your Discord application:

**Application URL Mapping:**

- **Target URL**: `https://localhost:3000/`
- **Description**: "RuneRogue - Multiplayer OSRS-inspired survival game"
- **Proxy URL**: Not needed for localhost development

#### Required Scopes for Activities

Make sure these scopes are selected in OAuth2:

- ✅ `identify` (already selected)
- ✅ `guilds` (already selected)
- ✅ `applications.commands` (already selected)
- ⚠️ **ADD**: `rpc.activities.write` (THIS IS CRITICAL FOR ACTIVITIES)

## 🔧 Quick Fix: Add Activity Scope

1. Go back to **OAuth2 → Scopes**
2. **Add**: `rpc.activities.write`
3. **Add**: `activities.read` (if available)
4. **Save changes**
5. **Regenerate your OAuth URL** with the new scopes

## 🧪 Test Your Configuration

After making changes:

1. **Completely restart Discord**
2. **Clear Discord cache** (we did this already)
3. **Test the activity**: Join a voice channel and look for activity options
4. **Check console logs**: Visit https://localhost:3000/activity-test.html to debug

## 📋 Complete Checklist

### ✅ OAuth2 Configuration (You have this)

- [x] Client ID: 1386478818365018254
- [x] Redirect URLs: https://localhost:3000/auth/discord/callback
- [x] Scopes: identify, guilds, applications.commands

### ⚠️ Missing Activities Configuration

- [ ] Activities tab configured OR
- [ ] Embedded App SDK enabled OR
- [ ] rpc.activities.write scope added

### ✅ Technical Setup (You have this)

- [x] HTTPS server running on port 3000
- [x] Game server running on port 2567
- [x] SSL certificates configured
- [x] Discord cache cleared

## 🎮 Alternative: Use Discord's New Activities Beta

If the above doesn't work, Discord might have moved Activities to a new system:

1. **Check for "App Directory" or "Discovery"** tabs
2. **Look for "Embedded Apps" settings**
3. **Check Discord's Activities documentation** for recent changes

## 🚀 Next Steps

1. Add the missing `rpc.activities.write` scope
2. Look for Activities/Embedded Apps configuration
3. Test in a voice channel after changes
4. If still not working, try the OAuth2 invite URL approach
