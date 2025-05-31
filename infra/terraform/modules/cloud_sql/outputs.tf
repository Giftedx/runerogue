output "instance_name" {
  description = "Cloud SQL instance name"
  value       = google_sql_database_instance.postgres.name
}

output "connection_name" {
  description = "Cloud SQL connection name"
  value       = google_sql_database_instance.postgres.connection_name
}

output "private_ip_address" {
  description = "Private IP address"
  value       = google_sql_database_instance.postgres.private_ip_address
}

output "database_name" {
  description = "Database name"
  value       = google_sql_database.database.name
}

output "database_user" {
  description = "Database user"
  value       = google_sql_user.users.name
}

output "database_url" {
  description = "Database connection URL"
  value       = "postgresql://${google_sql_user.users.name}:${random_password.db_password.result}@${google_sql_database_instance.postgres.private_ip_address}:5432/${google_sql_database.database.name}"
  sensitive   = true
}