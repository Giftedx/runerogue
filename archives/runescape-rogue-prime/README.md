# RuneScape Rogue Prime

## Project Overview

RuneScape Rogue Prime is a high-fidelity, high-replayability 2D roguelike that reimagines Old School RuneScape (OSRS) mechanics, aesthetics, and strategic depth within a procedurally emergent framework. This project is built on a state-of-the-art, cloud-native architectural substrate, intelligent AI-driven systems, and an immutable adherence to OSRS design principles. The target is a browser-native application with explicit provisions for future cross-platform expansion.

## Architecture

The project employs a robust, layered, and decoupled system architecture designed for production-grade performance, scalability, and security. All inter-service communication is secured via HTTPS, WSS, and mTLS for internal RPC.

### Layered System Overview

- **Presentation Layer:** Godot Engine (HTML5 Export) for in-game client, React/Next.js with TypeScript and Tailwind CSS for Meta-UI.
- **Application Layer:** Authoritative Game Server (Node.js/TypeScript), API Gateway (Node.js/TypeScript), Authentication Microservice (Node.js/TypeScript), AI Inference Engine (Python/FastAPI), Telemetry Aggregator (Node.js/TypeScript).
- **Service Layer:** Specialized microservices providing decoupled, scalable functionalities.
- **Infrastructure Layer:** Google Cloud Platform (GCP) with Kubernetes (GKE) for orchestration, PostgreSQL (Cloud SQL), Redis (Memorystore), and Google Cloud Storage.

### Deployment Topology (GCP Kubernetes)

All services are containerized with Docker and orchestrated via Kubernetes on Google Cloud Platform. Global Load Balancing, Cloud CDN, and robust security measures are integral to the deployment.

## Development Practices

Strict adherence to code standards, modular architecture, comprehensive testing (unit, integration, E2E), CI/CD via GitHub Actions and GCP Cloud Build, centralized monitoring, and robust security practices are mandated.

## Getting Started (Initial Infrastructure Setup)

This project leverages Google Cloud Platform (GCP). Ensure you have the `gcloud` CLI installed and authenticated.

### 1. GCP Project Setup

First, set your default GCP project. Replace `[YOUR_GCP_PROJECT_ID]` with your desired project ID.

```bash
gcloud projects create [YOUR_GCP_PROJECT_ID] --name="RuneScape Rogue Prime"
gcloud config set project [YOUR_GCP_PROJECT_ID]
```

### 2. Enable Required GCP APIs

Enable the necessary APIs for GKE, Cloud SQL, Memorystore, and other services.

```bash
gcloud services enable container.googleapis.com \
  sqladmin.googleapis.com \
  redis.googleapis.com \
  storage.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com \
  logging.googleapis.com \
  monitoring.googleapis.com
```

### 3. Kubernetes Cluster (GKE) Provisioning

Create a GKE cluster. This will be the foundation for deploying all microservices.

```bash
gcloud container clusters create runescape-rogue-prime-cluster \
  --zone=[YOUR_PREFERRED_GCP_ZONE] \
  --machine-type=e2-standard-4 \
  --num-nodes=3 \
  --enable-autoscaling --min-nodes=3 --max-nodes=10 \
  --enable-stackdriver-logging --enable-stackdriver-monitoring \
  --enable-ip-alias \
  --workload-pool=[YOUR_GCP_PROJECT_ID].svc.id.goog
```

### 4. Cloud SQL (PostgreSQL) Instance

Provision a PostgreSQL instance for persistent player data.

```bash
gcloud sql instances create runescape-rogue-prime-db \
  --database-version=POSTGRES_14 \
  --region=[YOUR_PREFERRED_GCP_REGION] \
  --cpu=2 --memory=7680MB \
  --database-flags=cloudsql.iam_authentication=On \
  --root-password=[YOUR_DB_ROOT_PASSWORD]
```

### 5. Memorystore (Redis) Instance

Set up a Redis instance for caching and real-time state.

```bash
gcloud redis instances create runescape-rogue-prime-redis \
  --region=[YOUR_PREFERRED_GCP_REGION] \
  --size=1 \
  --tier=STANDARD_HA
```

### 6. Google Cloud Storage Buckets

Create buckets for game assets and backups.

```bash
gsutil mb -l [YOUR_PREFERRED_GCP_REGION] gs://runescape-rogue-prime-assets
gsutil mb -l [YOUR_PREFERRED_GCP_REGION] gs://runescape-rogue-prime-backups
```

Replace placeholders like `[YOUR_GCP_PROJECT_ID]`, `[YOUR_PREFERRED_GCP_ZONE]`, `[YOUR_PREFERRED_GCP_REGION]`, and `[YOUR_DB_ROOT_PASSWORD]` with your actual values.

## Project Structure

```
runescape-rogue-prime/
├── godot-client/             # Godot game client project
├── meta-ui/                  # React/Next.js meta-UI project
├── backend/                  # Backend microservices
│   ├── game-server/          # Node.js/TypeScript authoritative game server
│   ├── api-gateway/          # Node.js/TypeScript API Gateway
│   ├── auth-service/         # Node.js/TypeScript authentication microservice
│   ├── ai-service/           # Python/FastAPI AI inference engine
│   └── telemetry-aggregator/ # Node.js/TypeScript telemetry aggregator
├── infra/                    # Kubernetes manifests, IaC (e.g., Terraform)
├── assets/                   # Raw game assets (images, audio, etc.)
├── docs/                     # Project documentation
└── .github/                  # GitHub Actions CI/CD workflows
```
