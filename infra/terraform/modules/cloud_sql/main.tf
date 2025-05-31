# Cloud SQL module for RuneRogue PostgreSQL database
resource "google_sql_database_instance" "postgres" {
  name             = var.instance_name
  database_version = "POSTGRES_15"
  region           = var.region
  
  settings {
    tier = "db-f1-micro"
    
    # Backup configuration
    backup_configuration {
      enabled                        = true
      start_time                     = "03:00"
      point_in_time_recovery_enabled = true
      backup_retention_settings {
        retained_backups = 7
      }
    }
    
    # IP configuration
    ip_configuration {
      ipv4_enabled                                  = false
      private_network                               = var.network
      enable_private_path_for_google_cloud_services = true
    }
    
    # Maintenance window
    maintenance_window {
      day          = 7  # Sunday
      hour         = 3  # 3 AM
      update_track = "stable"
    }
    
    # Database flags
    database_flags {
      name  = "log_checkpoints"
      value = "on"
    }
    
    database_flags {
      name  = "log_connections"
      value = "on"
    }
    
    database_flags {
      name  = "log_disconnections"
      value = "on"
    }
    
    database_flags {
      name  = "log_lock_waits"
      value = "on"
    }
    
    # Disk configuration
    disk_autoresize = true
    disk_size       = 20
    disk_type       = "PD_SSD"
    
    # Insights configuration
    insights_config {
      query_insights_enabled  = true
      query_string_length     = 1024
      record_application_tags = true
      record_client_address   = true
    }
    
    # User labels
    user_labels = {
      environment = var.environment
      component   = "database"
    }
  }
  
  deletion_protection = false
  
  depends_on = [google_service_networking_connection.private_vpc_connection]
}

# Private VPC connection for Cloud SQL
resource "google_compute_global_address" "private_ip_address" {
  name          = "${var.instance_name}-private-ip"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = var.network
}

resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = var.network
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_address.name]
}

# Database
resource "google_sql_database" "database" {
  name     = var.database_name
  instance = google_sql_database_instance.postgres.name
}

# Random password for database user
resource "random_password" "db_password" {
  length  = 16
  special = true
}

# Database user
resource "google_sql_user" "users" {
  name     = "runerogue"
  instance = google_sql_database_instance.postgres.name
  password = random_password.db_password.result
}

# Store password in Secret Manager
resource "google_secret_manager_secret" "db_password" {
  secret_id = "database-password"
  
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = random_password.db_password.result
}