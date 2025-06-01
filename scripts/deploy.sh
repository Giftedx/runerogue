#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default values
ENV="production"
TAG="latest"
FORCE=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -e|--env)
      ENV="$2"
      shift # past argument
      shift # past value
      ;;
    -t|--tag)
      TAG="$2"
      shift # past argument
      shift # past value
      ;;
    -f|--force)
      FORCE="--force"
      shift # past argument
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Validate environment
if [[ ! "$ENV" =~ ^(development|staging|production)$ ]]; then
  echo -e "${RED}Error: Invalid environment. Must be one of: development, staging, production${NC}"
  exit 1
fi

echo -e "${YELLOW}🚀 Starting deployment to ${ENV} environment with tag ${TAG}...${NC}"

# Load environment specific variables
if [ -f ".env.${ENV}" ]; then
  echo -e "${GREEN}✓ Loading .env.${ENV}...${NC}"
  export $(grep -v '^#' .env.${ENV} | xargs)
else
  echo -e "${YELLOW}⚠️  Warning: .env.${ENV} not found. Using environment variables from the system.${NC}"
fi

# Build the application
echo -e "${GREEN}🔨 Building the application...${NC}"
docker-compose -f docker-compose.yml build --build-arg NODE_ENV=${ENV} app

# Run database migrations if needed
if [ "$ENV" != "development" ]; then
  echo -e "${GREEN}🔄 Running database migrations...${NC}"
  # TODO: Add your migration commands here
  # Example: docker-compose run --rm app npx typeorm migration:run
fi

# Deploy the application
echo -e "${GREEN}🚀 Deploying the application...${NC}"
TARGET=${ENV} docker-compose -f docker-compose.yml up -d --no-deps ${FORCE} app

# Run health check
echo -e "${GREEN}🩺 Running health check...${NC}"
HEALTH_CHECK_URL="http://localhost:${PORT:-3000}/health"
MAX_RETRIES=10
RETRY_COUNT=0

until [ $RETRY_COUNT -ge $MAX_RETRIES ] || (curl -f $HEALTH_CHECK_URL > /dev/null 2>&1); do
  RETRY_COUNT=$((RETRY_COUNT+1))
  echo -e "${YELLOW}⚠️  Waiting for application to start... (Attempt $RETRY_COUNT/$MAX_RETRIES)${NC}"
  sleep 5
done

if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
  echo -e "${RED}❌ Application failed to start within the expected time.${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Deployment to ${ENV} environment completed successfully!${NC}"

# Display deployment information
echo -e "\n${YELLOW}📊 Deployment Summary:${NC}"
echo -e "Environment: ${GREEN}${ENV}${NC}"
echo -e "Version: ${GREEN}${TAG}${NC}"
echo -e "API URL: ${GREEN}http://localhost:${PORT:-3000}${NC}"
echo -e "WebSocket URL: ${GREEN}ws://localhost:${COLYSEUS_WS_PORT:-2567}${NC}"

if [ "$ENV" = "production" ]; then
  echo -e "${YELLOW}🚀 Production deployment complete!${NC}"
  # TODO: Add any post-deployment notifications (Slack, email, etc.)
fi
