variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "bucket_name" {
  description = "Storage bucket name for CDN backend"
  type        = string
}

variable "backend_name" {
  description = "CDN backend name"
  type        = string
}