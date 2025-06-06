# Deploying RuneRogue to Render

This guide provides step-by-step instructions for deploying the RuneRogue Discord game to Render's free tier.

## Prerequisites

- A GitHub account with your RuneRogue repository
- A Render account (sign up at [render.com](https://render.com))
- Your Discord application credentials (Client ID, Client Secret, Bot Token)

## Deployment Steps

### 1. Push Your Code to GitHub

Ensure your latest code is pushed to GitHub, including the `render.yaml` configuration file.

```bash
git add .
git commit -m "Prepare for Render deployment"
git push
```

### 2. Create a New Web Service on Render

1. Log in to your Render dashboard at [dashboard.render.com](https://dashboard.render.com)
2. Click on the "New +" button and select "Blueprint" from the dropdown menu
3. Connect your GitHub repository if you haven't already
4. Select the RuneRogue repository
5. Render will automatically detect the `render.yaml` file and configure your service

### 3. Configure Environment Variables

Some environment variables are marked as `sync: false` in the `render.yaml` file, which means you'll need to set them manually:

1. In your service dashboard, go to the "Environment" tab
2. Add the following environment variables:
   - `DISCORD_CLIENT_ID`: Your Discord application client ID
   - `DISCORD_CLIENT_SECRET`: Your Discord application client secret
   - `DISCORD_REDIRECT_URI`: Set to `https://your-render-app-name.onrender.com/auth/discord/callback`
   - `DISCORD_BOT_TOKEN`: Your Discord bot token

### 4. Deploy Your Service

1. Click on the "Manual Deploy" button and select "Deploy latest commit"
2. Render will start building and deploying your application
3. You can monitor the build progress in the "Logs" tab

## Important Notes

- **Free Tier Limitations**: On Render's free tier, your service will spin down after 15 minutes of inactivity. The first request after inactivity may take a few seconds to respond.
- **Database**: If your application requires a database, you can create a PostgreSQL database in Render and connect it to your service.
- **Environment Variables**: Sensitive information should always be stored as environment variables, never in your code.
- **Logs**: You can view your application logs in the Render dashboard to troubleshoot any issues.

## Updating Your Deployment

When you make changes to your code:

1. Push your changes to GitHub
2. Render will automatically deploy the latest changes (or you can trigger a manual deploy)

## Security Best Practices

- Rotate your API keys regularly (at least every 30 days)
- Use environment variables for all sensitive data
- Set the minimum required permissions for each service
- Monitor your application logs for unusual activity

## Troubleshooting

If you encounter issues with your deployment:

1. Check the application logs in the Render dashboard
2. Verify that all required environment variables are set correctly
3. Ensure your Discord bot has the necessary permissions
4. Check if your application is exceeding the free tier resource limits
