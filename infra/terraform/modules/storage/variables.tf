variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "bucket_name" {
  description = "Storage bucket name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}