# Main Terraform configuration for RuneRogue infrastructure
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.20"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.10"
    }
  }

  backend "gcs" {
    bucket = "runerogue-terraform-state"
    prefix = "terraform/state"
  }
}

# Configure the Google Cloud Provider
provider "google" {
  project = var.project_id
  region  = var.region
  zone    = var.zone
}

# Configure Kubernetes provider
provider "kubernetes" {
  host                   = "https://${module.gke.endpoint}"
  token                  = data.google_client_config.default.access_token
  cluster_ca_certificate = base64decode(module.gke.ca_certificate)
}

# Configure Helm provider
provider "helm" {
  kubernetes {
    host                   = "https://${module.gke.endpoint}"
    token                  = data.google_client_config.default.access_token
    cluster_ca_certificate = base64decode(module.gke.ca_certificate)
  }
}

# Data source for Google client config
data "google_client_config" "default" {}

# VPC Module
module "vpc" {
  source = "./modules/vpc"
  
  project_id   = var.project_id
  region       = var.region
  network_name = "${var.project_name}-vpc"
}

# GKE Module
module "gke" {
  source = "./modules/gke"
  
  project_id     = var.project_id
  region         = var.region
  zone           = var.zone
  cluster_name   = "${var.project_name}-cluster"
  network        = module.vpc.network_name
  subnetwork     = module.vpc.subnetwork_name
  node_pool_name = "${var.project_name}-nodes"
}

# Cloud SQL Module
module "cloud_sql" {
  source = "./modules/cloud_sql"
  
  project_id      = var.project_id
  region          = var.region
  instance_name   = "${var.project_name}-db"
  database_name   = var.database_name
  network         = module.vpc.network_id
}

# Redis Module
module "redis" {
  source = "./modules/redis"
  
  project_id    = var.project_id
  region        = var.region
  instance_name = "${var.project_name}-redis"
  network       = module.vpc.network_id
}

# Cloud Storage Module
module "storage" {
  source = "./modules/storage"
  
  project_id    = var.project_id
  region        = var.region
  bucket_name   = "${var.project_name}-storage"
}

# CDN Module
module "cdn" {
  source = "./modules/cdn"
  
  project_id    = var.project_id
  bucket_name   = module.storage.bucket_name
  backend_name  = "${var.project_name}-backend"
}

# Secret Manager Module
module "secrets" {
  source = "./modules/secrets"
  
  project_id   = var.project_id
  secrets_list = var.secrets_list
}