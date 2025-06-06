# Redis module for RuneRogue caching
resource "google_redis_instance" "cache" {
  name           = var.instance_name
  tier           = "BASIC"
  memory_size_gb = 1
  region         = var.region
  
  authorized_network = var.network
  connect_mode       = "PRIVATE_SERVICE_ACCESS"
  redis_version      = "REDIS_6_X"
  
  display_name = "RuneRogue Redis Cache"
  
  labels = {
    environment = var.environment
    component   = "cache"
  }
}

# Store Redis password in Secret Manager if auth is enabled
resource "google_secret_manager_secret" "redis_password" {
  secret_id = "redis-password"
  
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "redis_password" {
  secret      = google_secret_manager_secret.redis_password.id
  secret_data = google_redis_instance.cache.auth_string
}