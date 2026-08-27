variable "project_id" {
  description = "GCP / Firebase project ID (ex.: staging ControlMax)."
  type        = string
}

variable "region" {
  description = "Região primária (Cloud Run / Artifact Registry)."
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Nome do ambiente (staging | prod)."
  type        = string
  default     = "staging"
}

variable "service_name" {
  description = "Nome do serviço Cloud Run do BFF."
  type        = string
  default     = "controlmax-api"
}

variable "image" {
  description = "Imagem container já publicada no Artifact Registry (ou gcr). Ex.: REGION-docker.pkg.dev/PROJECT/controlmax/api:staging"
  type        = string
}

variable "frontend_origin" {
  description = "Origin CORS do SPA (Vercel preview/prod)."
  type        = string
}

variable "min_instances" {
  description = "Mínimo de instâncias Cloud Run (0 = scale-to-zero)."
  type        = number
  default     = 0
}

variable "max_instances" {
  description = "Máximo de instâncias Cloud Run."
  type        = number
  default     = 10
}

variable "cpu" {
  type    = string
  default = "1"
}

variable "memory" {
  type    = string
  default = "512Mi"
}

variable "create_secret_placeholders" {
  description = "Cria secrets vazios no Secret Manager (valores via gcloud secrets versions add)."
  type        = bool
  default     = true
}

variable "attach_secrets" {
  description = "Injeta GEMINI_API_KEY e FIREBASE_SERVICE_ACCOUNT_KEY no Cloud Run (exige versão 'latest' nos secrets)."
  type        = bool
  default     = false
}
