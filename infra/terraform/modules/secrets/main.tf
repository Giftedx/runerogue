# Secret Manager module for RuneRogue
resource "google_secret_manager_secret" "secrets" {
  for_each = toset(var.secrets_list)
  
  secret_id = each.value
  
  replication {
    automatic = true
  }
  
  labels = {
    environment = var.environment
    component   = "secrets"
  }
}

# Placeholder secret versions (should be updated manually or via CI/CD)
resource "google_secret_manager_secret_version" "secrets" {
  for_each = toset(var.secrets_list)
  
  secret      = google_secret_manager_secret.secrets[each.key].id
  secret_data = "placeholder-${each.value}"
}