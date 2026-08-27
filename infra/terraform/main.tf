locals {
  apis = [
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "secretmanager.googleapis.com",
    "iam.googleapis.com",
    "cloudbuild.googleapis.com",
    "firestore.googleapis.com",
    "firebase.googleapis.com",
    "identitytoolkit.googleapis.com",
  ]

  secret_ids = var.create_secret_placeholders ? [
    "controlmax-gemini-api-key",
    "controlmax-firebase-sa-json",
  ] : []
}

resource "google_project_service" "apis" {
  for_each = toset(local.apis)

  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

resource "google_artifact_registry_repository" "backend" {
  location      = var.region
  repository_id = "controlmax"
  description   = "Imagens do BFF ControlMax (${var.environment})"
  format        = "DOCKER"

  depends_on = [google_project_service.apis]
}

resource "google_service_account" "cloud_run" {
  account_id   = "controlmax-run-${var.environment}"
  display_name = "ControlMax Cloud Run (${var.environment})"
  project      = var.project_id
}

# Leitura Firestore + Auth Admin via Application Default Credentials no runtime.
resource "google_project_iam_member" "run_datastore_user" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_project_iam_member" "run_firebase_admin" {
  project = var.project_id
  role    = "roles/firebase.admin"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_secret_manager_secret" "app" {
  for_each = toset(local.secret_ids)

  secret_id = each.value
  replication {
    auto {}
  }

  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_iam_member" "run_accessor" {
  for_each = google_secret_manager_secret.app

  secret_id = each.value.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_cloud_run_v2_service" "api" {
  name     = "${var.service_name}-${var.environment}"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.cloud_run.email

    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }

    containers {
      image = var.image

      resources {
        limits = {
          cpu    = var.cpu
          memory = var.memory
        }
      }

      env {
        name  = "CLOUD_RUN"
        value = "true"
      }

      env {
        name  = "FRONTEND_ORIGIN"
        value = var.frontend_origin
      }

      env {
        name  = "RATE_LIMIT_DISABLED"
        value = "false"
      }

      dynamic "env" {
        for_each = var.attach_secrets && var.create_secret_placeholders ? [1] : []
        content {
          name = "GEMINI_API_KEY"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.app["controlmax-gemini-api-key"].secret_id
              version = "latest"
            }
          }
        }
      }

      dynamic "env" {
        for_each = var.attach_secrets && var.create_secret_placeholders ? [1] : []
        content {
          name = "FIREBASE_SERVICE_ACCOUNT_KEY"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.app["controlmax-firebase-sa-json"].secret_id
              version = "latest"
            }
          }
        }
      }

      ports {
        container_port = 8080
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [
    google_project_service.apis,
    google_secret_manager_secret_iam_member.run_accessor,
  ]
}

resource "google_cloud_run_v2_service_iam_member" "public_invoker" {
  project  = var.project_id
  location = google_cloud_run_v2_service.api.location
  name     = google_cloud_run_v2_service.api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
