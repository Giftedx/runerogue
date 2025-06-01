# GKE cluster module for RuneRogue
resource "google_container_cluster" "primary" {
  name     = var.cluster_name
  location = var.region
  
  # We can't create a cluster with no node pool defined, but we want to only use
  # separately managed node pools. So we create the smallest possible default
  # node pool and immediately delete it.
  remove_default_node_pool = true
  initial_node_count       = 1
  
  network    = var.network
  subnetwork = var.subnetwork
  
  # Enable network policy
  network_policy {
    enabled = true
  }
  
  # Enable Workload Identity
  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }
  
  # Enable IP aliasing
  ip_allocation_policy {
    cluster_secondary_range_name  = "gke-pods"
    services_secondary_range_name = "gke-services"
  }
  
  # Private cluster configuration
  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "172.16.0.0/28"
  }
  
  # Master authorized networks
  master_authorized_networks_config {
    cidr_blocks {
      cidr_block   = "0.0.0.0/0"
      display_name = "All networks"
    }
  }
  
  # Enable legacy ABAC
  enable_legacy_abac = false
  
  # Resource usage export config
  resource_usage_export_config {
    enable_network_egress_metering = true
    bigquery_destination {
      dataset_id = google_bigquery_dataset.gke_usage.dataset_id
    }
  }
  
  # Monitoring and logging
  logging_service    = "logging.googleapis.com/kubernetes"
  monitoring_service = "monitoring.googleapis.com/kubernetes"
  
  # Enable autoscaling
  cluster_autoscaling {
    enabled = true
    resource_limits {
      resource_type = "cpu"
      minimum       = 1
      maximum       = 10
    }
    resource_limits {
      resource_type = "memory"
      minimum       = 2
      maximum       = 32
    }
  }
  
  # Addons configuration
  addons_config {
    http_load_balancing {
      disabled = false
    }
    
    horizontal_pod_autoscaling {
      disabled = false
    }
    
    network_policy_config {
      disabled = false
    }
    
    dns_cache_config {
      enabled = true
    }
  }
  
  # Security configurations
  enable_shielded_nodes = true
  
  # Release channel
  release_channel {
    channel = "STABLE"
  }
  
  deletion_protection = false
}

# BigQuery dataset for GKE usage export
resource "google_bigquery_dataset" "gke_usage" {
  dataset_id  = "gke_usage_${replace(var.cluster_name, "-", "_")}"
  description = "Dataset for GKE cluster usage export"
  location    = var.region
}

# Node pool
resource "google_container_node_pool" "primary_nodes" {
  name       = var.node_pool_name
  location   = var.region
  cluster    = google_container_cluster.primary.name
  node_count = var.node_count
  
  # Enable autoscaling
  autoscaling {
    min_node_count = var.min_node_count
    max_node_count = var.max_node_count
  }
  
  # Node management
  management {
    auto_repair  = true
    auto_upgrade = true
  }
  
  # Node configuration
  node_config {
    preemptible  = false
    machine_type = var.machine_type
    disk_size_gb = var.disk_size_gb
    disk_type    = "pd-standard"
    image_type   = "COS_CONTAINERD"
    
    # OAuth scopes
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
    
    # Metadata
    metadata = {
      disable-legacy-endpoints = "true"
    }
    
    # Labels
    labels = {
      environment = var.environment
      component   = "runerogue"
    }
    
    # Tags
    tags = ["gke-node", "${var.cluster_name}-node"]
    
    # Shielded instance config
    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }
    
    # Workload metadata config
    workload_metadata_config {
      mode = "GKE_METADATA"
    }
  }
  
  # Upgrade settings
  upgrade_settings {
    max_surge       = 1
    max_unavailable = 0
  }
}