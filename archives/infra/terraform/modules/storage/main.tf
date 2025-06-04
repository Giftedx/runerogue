# Cloud Storage module for RuneRogue
resource "google_storage_bucket" "storage" {
  name          = var.bucket_name
  location      = var.region
  force_destroy = true
  
  uniform_bucket_level_access = true
  
  versioning {
    enabled = true
  }
  
  lifecycle_rule {
    condition {
      age = 365
    }
    action {
      type = "Delete"
    }
  }
  
  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }
  
  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
  
  labels = {
    environment = var.environment
    component   = "storage"
  }
}

# IAM binding for public read access to specific objects
resource "google_storage_bucket_iam_member" "public_read" {
  bucket = google_storage_bucket.storage.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}