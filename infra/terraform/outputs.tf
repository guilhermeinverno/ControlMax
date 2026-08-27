output "artifact_registry_repo" {
  description = "ID do repositório Artifact Registry."
  value       = google_artifact_registry_repository.backend.id
}

output "artifact_registry_url" {
  description = "Prefixo para docker push."
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.backend.repository_id}"
}

output "cloud_run_service_name" {
  value = google_cloud_run_v2_service.api.name
}

output "cloud_run_uri" {
  description = "URL HTTPS do BFF (usar em VITE_API_URL)."
  value       = google_cloud_run_v2_service.api.uri
}

output "runtime_service_account" {
  value = google_service_account.cloud_run.email
}

output "secret_ids" {
  description = "Secrets a popular com gcloud (se create_secret_placeholders=true)."
  value       = [for s in google_secret_manager_secret.app : s.secret_id]
}
