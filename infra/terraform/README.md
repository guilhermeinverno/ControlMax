# Infra as Code — ControlMax (ENT-06)

Terraform para **staging** do BFF no **Cloud Run** (GCP), com Artifact Registry e Secret Manager.

Frontend continua na **Vercel** (fora deste stack). Rules/indexes Firestore continuam via [`DEPLOY-FIRESTORE-GATE.md`](./DEPLOY-FIRESTORE-GATE.md) (`firebase deploy`).

## Layout

```
infra/terraform/
  main.tf / variables.tf / outputs.tf / providers.tf / versions.tf
  environments/staging/terraform.tfvars.example
  .gitignore
backend/Dockerfile          # imagem do BFF
```

## Pré-requisitos

- Terraform >= 1.5
- `gcloud` autenticado com permissão no projeto GCP/Firebase
- Projeto com billing (Cloud Run / Artifact Registry)

```bash
gcloud auth application-default login
gcloud config set project YOUR_GCP_STAGING_PROJECT_ID
```

## Bootstrap staging

### 1. Init + 1º apply (APIs, AR, SA, secrets vazios, Cloud Run)

```bash
cd infra/terraform
cp environments/staging/terraform.tfvars.example environments/staging/terraform.tfvars
# Edite project_id, frontend_origin, image

terraform init
terraform plan  -var-file=environments/staging/terraform.tfvars
terraform apply -var-file=environments/staging/terraform.tfvars
```

No 1º apply use uma imagem placeholder **ou** faça o push antes (passo 2) e aponte `image`.

### 2. Build & push da imagem

```bash
PROJECT=YOUR_GCP_STAGING_PROJECT_ID
REGION=us-central1
REPO=controlmax

gcloud auth configure-docker ${REGION}-docker.pkg.dev

docker build -t ${REGION}-docker.pkg.dev/${PROJECT}/${REPO}/api:staging ./backend
docker push ${REGION}-docker.pkg.dev/${PROJECT}/${REPO}/api:staging
```

Atualize `image` no tfvars e `terraform apply` de novo.

### 3. Popular secrets e anexar ao serviço

```bash
echo -n "$GEMINI_API_KEY" | gcloud secrets versions add controlmax-gemini-api-key --data-file=-

# JSON da service account em uma linha / arquivo
gcloud secrets versions add controlmax-firebase-sa-json --data-file=./service-account.json
```

No tfvars: `attach_secrets = true` → `terraform apply`.

### 4. Frontend

Em Vercel staging:

- `VITE_API_URL` = output `cloud_run_uri` (sem barra final)
- `FRONTEND_ORIGIN` no Cloud Run = URL do preview/prod Vercel (já no tfvars)

## Outputs úteis

| Output | Uso |
|--------|-----|
| `cloud_run_uri` | `VITE_API_URL` |
| `artifact_registry_url` | prefixo docker |
| `runtime_service_account` | auditoria IAM |
| `secret_ids` | checklist de secrets |

## Fora de escopo (por design)

- Provisionamento Vercel (UI / CLI Vercel)
- Deploy de `firestore.rules` / indexes (Firebase CLI)
- Redis para rate limit multi-instância (follow-up de ENT-03)
- Ambiente `prod` (copiar tfvars quando Gate estiver estável)

## Validação rápida

```bash
curl -sS -o /dev/null -w "%{http_code}" "$(terraform output -raw cloud_run_uri)/api/health" || true
# (se não houver /health, espere 401/404 autenticado — confirme URI HTTPS ativa)
```
