output "bucket_name" {
  description = "Storage bucket name"
  value       = google_storage_bucket.storage.name
}

output "bucket_url" {
  description = "Storage bucket URL"
  value       = google_storage_bucket.storage.url
}

output "self_link" {
  description = "Storage bucket self link"
  value       = google_storage_bucket.storage.self_link
}