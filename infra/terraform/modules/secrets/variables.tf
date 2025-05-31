variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "secrets_list" {
  description = "List of secrets to create"
  type        = list(string)
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}