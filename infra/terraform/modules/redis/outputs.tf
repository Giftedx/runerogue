output "host" {
  description = "Redis instance host"
  value       = google_redis_instance.cache.host
}

output "port" {
  description = "Redis instance port"
  value       = google_redis_instance.cache.port
}

output "url" {
  description = "Redis connection URL"
  value       = "redis://${google_redis_instance.cache.host}:${google_redis_instance.cache.port}"
}