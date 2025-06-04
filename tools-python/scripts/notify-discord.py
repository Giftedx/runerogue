#!/usr/bin/env python3
import os
import sys
import requests

# Usage: notify-discord.py "Your message here"
if len(sys.argv) < 2:
    print("Usage: notify-discord.py 'Your message here'")
    sys.exit(1)

message = sys.argv[1]

# Option 1: Use Discord webhook if available
DISCORD_WEBHOOK_URL = os.environ.get('DISCORD_WEBHOOK_URL')

if DISCORD_WEBHOOK_URL:
    resp = requests.post(DISCORD_WEBHOOK_URL, json={"content": message})
    if resp.status_code != 204:
        print(f"Failed to send Discord webhook: {resp.status_code} {resp.text}")
    else:
        print("Notification sent via webhook.")
    sys.exit(0)

# Option 2: Use local bot HTTP endpoint (e.g., http://localhost:4001/notify)
BOT_NOTIFY_URL = os.environ.get('DISCORD_BOT_NOTIFY_URL', 'http://localhost:4001/notify')
try:
    resp = requests.post(BOT_NOTIFY_URL, json={"message": message})
    if resp.status_code == 200:
        print("Notification sent via bot endpoint.")
    else:
        print(f"Failed to notify bot: {resp.status_code} {resp.text}")
except Exception as e:
    print(f"Failed to send notification: {e}")
    sys.exit(1)
