variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "instance_name" {
  description = "Cloud SQL instance name"
  type        = string
}

variable "database_name" {
  description = "Database name"
  type        = string
}

variable "network" {
  description = "VPC network ID for private IP"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}