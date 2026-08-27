# ENT-06 — Terraform / IaC (staging)

Fonte canônica de apply: [`../infra/terraform/README.md`](../../infra/terraform/README.md).

## Resumo

| Recurso | Gerenciado por |
|---------|----------------|
| APIs GCP, Artifact Registry, SA, Cloud Run BFF, Secret Manager | **Terraform** (`infra/terraform`) |
| Firestore rules + indexes | Firebase CLI — [`DEPLOY-FIRESTORE-GATE.md`](./DEPLOY-FIRESTORE-GATE.md) |
| Frontend SPA | Vercel — [`vercel-config.md`](./vercel-config.md) |

**DoD:** staging do BFF aplicável via `terraform apply` + imagem Docker (`backend/Dockerfile`).
