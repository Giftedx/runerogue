# CDN module for RuneRogue
resource "google_compute_backend_bucket" "cdn_backend" {
  name        = var.backend_name
  bucket_name = var.bucket_name
  enable_cdn  = true
}

resource "google_compute_url_map" "cdn" {
  name            = "${var.backend_name}-url-map"
  default_service = google_compute_backend_bucket.cdn_backend.id
}

resource "google_compute_target_http_proxy" "cdn" {
  name    = "${var.backend_name}-http-proxy"
  url_map = google_compute_url_map.cdn.id
}

resource "google_compute_global_forwarding_rule" "cdn" {
  name       = "${var.backend_name}-forwarding-rule"
  target     = google_compute_target_http_proxy.cdn.id
  port_range = "80"
}