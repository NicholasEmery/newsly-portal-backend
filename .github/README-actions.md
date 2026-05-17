# GitHub Actions - backend

Este repositório já contém o workflow `.github/workflows/notify-orchestrator.yml` que envia um `repository_dispatch` para o orchestrator quando a `main` é atualizada.

Requisitos para funcionar corretamente:

- Secret `ORCHESTRATOR_PAT`: token com permissão para dispatch no repositório `newsly-portal-orchestrator`. Adicionar em Settings → Secrets → Actions como `ORCHESTRATOR_PAT`.
- Runner self-hosted no orchestrator com label `self-hosted` (o workflow do orchestrator está configurado para rodar em `self-hosted`).

Notas de segurança:

- Prefira usar um token de máquina (bot) com permissão mínima.
