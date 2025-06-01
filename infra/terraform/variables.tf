# Variables for Terraform configuration
variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "project_name" {
  description = "The project name used for resource naming"
  type        = string
  default     = "runerogue"
}

variable "region" {
  description = "The GCP region"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "The GCP zone"
  type        = string
  default     = "us-central1-a"
}

variable "database_name" {
  description = "The name of the Cloud SQL database"
  type        = string
  default     = "runerogue"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "secrets_list" {
  description = "List of secrets to create in Secret Manager"
  type        = list(string)
  default = [
    "database-password",
    "redis-password",
    "sendgrid-api-key",
    "jwt-secret-key",
    "encryption-key"
  ]
}

variable "node_count" {
  description = "Number of nodes in the GKE cluster"
  type        = number
  default     = 2
}

variable "machine_type" {
  description = "Machine type for GKE nodes"
  type        = string
  default     = "e2-medium"
}

variable "disk_size_gb" {
  description = "Disk size for GKE nodes"
  type        = number
  default     = 20
}

variable "enable_autoscaling" {
  description = "Enable autoscaling for GKE cluster"
  type        = bool
  default     = true
}

variable "min_node_count" {
  description = "Minimum number of nodes for autoscaling"
  type        = number
  default     = 1
}

variable "max_node_count" {
  description = "Maximum number of nodes for autoscaling"
  type        = number
  default     = 5
}