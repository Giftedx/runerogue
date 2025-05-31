#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Variables - Replace with your actual values
PROJECT_ID="YOUR_PROJECT_ID"
SERVICE_NAME="runescape-server"
REGION="YOUR_REGION" # e.g., us-central1
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME" # Or your Artifact Registry path

# Ensure gcloud is configured with the correct project
echo "Configuring gcloud project to $PROJECT_ID"
gcloud config set project $PROJECT_ID

echo "Deploying $SERVICE_NAME to Cloud Run in $REGION from image $IMAGE_NAME:latest"

# Deployment command
gcloud run deploy $SERVICE_NAME \
  --image "$IMAGE_NAME:latest" \
  --platform "managed" \
  --region "$REGION" \
  --allow-unauthenticated \
  --port "8080" \ # Ensure this matches what your server listens on (via PORT env var)
  --min-instances "0" \ # Crucial for free tier
  --max-instances "1" \ # Start with 1 for free tier, can be adjusted
  --session-affinity \  # Crucial for Colyseus
  --timeout "3600" \    # Max timeout for WebSockets (in seconds)
  --cpu "1" \
  --memory "512Mi" \
  # Add any necessary environment variables here using --update-env-vars or --set-env-vars
  # For example:
  # --set-env-vars="NODE_ENV=production,OTHER_VAR=value" \
  # Secrets should be managed via Secret Manager and referenced:
  # --set-secrets="DISCORD_CLIENT_SECRET=DISCORD_CLIENT_SECRET:latest" \
  --quiet

echo "Deployment of $SERVICE_NAME initiated."
echo "To see the URL of the deployed service, run: gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)'"
echo "To stream logs, run: gcloud beta run services logs tail $SERVICE_NAME --project $PROJECT_ID --region $REGION"
