output "url" {
  description = "CDN URL"
  value       = "http://${google_compute_global_forwarding_rule.cdn.ip_address}"
}

output "ip_address" {
  description = "CDN IP address"
  value       = google_compute_global_forwarding_rule.cdn.ip_address
}