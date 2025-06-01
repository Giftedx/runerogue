output "secret_names" {
  description = "List of created secret names"
  value       = [for secret in google_secret_manager_secret.secrets : secret.secret_id]
}

output "secret_ids" {
  description = "Map of secret names to IDs"
  value       = { for k, secret in google_secret_manager_secret.secrets : k => secret.id }
}