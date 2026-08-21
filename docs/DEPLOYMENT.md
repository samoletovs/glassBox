# glassBox — Azure deployment plan

> Golden path per [.github/PLATFORM.md](../../.github/PLATFORM.md). glassBox lands on the
> **default** for all 7 platform decisions → ~30 min from scaffold to `https://glassbox.naurolabs.com`.

## Deployment status (2026-06-21)

**Phase 1 is LIVE** (behind Entra login) at
**https://purple-grass-01f8aa203.7.azurestaticapps.net** — deployed via GitHub Actions from
`samoletovs/glassBox` (master). Resource group `glassbox-rg`.

- SWA Free `glassbox-swa` in **westeurope** (SWA isn't offered in northeurope).
- Cosmos serverless `glassbox-cosmos-...` in **northeurope** (westeurope was capacity-constrained for
  serverless on deploy day) — hence the separate `cosmosLocation` param in `main.bicep`.
- Monitoring (Log Analytics + App Insights) via the shared module.
- Cosmos creds live in SWA App Settings (`COSMOS_ENDPOINT/KEY/DB/CONTAINER`); CosmosStore verified
  against the real account; board reset to empty.
- Auth wall verified: `GET /` and `GET /api/state.json` both 302 → `/.auth/login/aad`.

**Two manual follow-ups (need the repository owner):**
1. **Lock to just me:** set `OWNER_EMAIL` app setting to my Microsoft account email
   (`az staticwebapp appsettings set -n glassbox-swa -g glassbox-rg --setting-names OWNER_EMAIL=<email>`).
   Until then, *any* Microsoft account that logs in can use the API. **Not auto-set on purpose** —
   guessing the wrong email would lock me out, so this one waits for me. (Tip: if unsure of the exact
   value, log in once and read `userDetails` from `https://glassbox.naurolabs.com/.auth/me`.)
2. **Custom domain `glassbox.naurolabs.com`:** ✅ **wired** — CNAME added in the `naurolabs` zone
   (gcloud project `era-erp`) → SWA hostname binding submitted. Status was `Validating` at hand-off;
   SWA issues the free cert and flips to `Ready` automatically within ~15 min–1 hr. Verify:
   `az staticwebapp hostname show -n glassbox-swa -g glassbox-rg --hostname glassbox.naurolabs.com --query status -o tsv`
   then open https://glassbox.naurolabs.com. Registered in the manifest + WORKSPACE DNS table.

---

## The 7 decisions

| # | Decision | glassBox choice | Notes |
|---|---|---|---|
| 1 | Hosting | **Azure SWA Free** + SWA-managed Functions | Thin UI + small API — the default web-app row. |
| 2 | Auth | **Microsoft Entra ID** via SWA built-in, single-user allowlist | Gate every Function on `userDetails === OWNER_EMAIL`. Free tier ⇒ no custom roles. |
| 3 | Secrets | **SWA App Settings** (Free) | `COSMOS_*`, `APPINSIGHTS_*`. No Key Vault/MI on Free. |
| 4 | Subdomain | **`glassbox.naurolabs.com`** | Google Cloud DNS CNAME + SWA custom domain. |
| 5 | Infra | **Bicep** `infrastructure/main.bicep` (resourceGroup scope) | Imports shared `monitoring.bicep` + `swa.bicep`; adds its own Cosmos. |
| 6 | Monitoring | **`monitoring.bicep`** → Log Analytics + App Insights (30d, 0.1 GB/day cap) | Already wired in scaffolded `main.bicep`. |
| 7 | CI/CD | **`.github/workflow-templates/swa-deploy.yml`** | quality gate → deploy → Telegram. |

## What we need (resources)

All in resource group **`glassbox-rg`** (`northeurope`):

- **Static Web App** (`glassbox-swa`, Free) — hosts the thin React/Vite UI + managed Functions API.
- **Azure Functions** (SWA-managed, Node 20) — CRUD + query, action log + rollback, `GET /state.json`, SSE stream.
- **Cosmos DB** (serverless, SQL API, AAD-only) — single core store. Containers:
  - `items` (the domain records, partitioned by owner/scenario key),
  - `actions` (append-only action log → powers rollback),
  - (optional) `snapshots` if we go snapshot-based rather than event-sourced.
  - Mirror atlas's serverless + RBAC pattern ([atlas/infrastructure/main.bicep](../../atlas/infrastructure/main.bicep)).
- **Log Analytics + App Insights** — via the shared monitoring module (already in `main.bicep`).
- **DNS:** CNAME `glassbox` → SWA default hostname (Google Cloud DNS, `naurolabs.com` zone).

> **Cost:** SWA Free €0 · Cosmos serverless ~€0–2/mo at experiment volume · App Insights capped
> 0.1 GB/day. Effectively free. Kill = `az group delete -n glassbox-rg`.

## What we do NOT need (BYO-tokens)

- **No Azure OpenAI / Foundry / model deployment.** The app ships no LLM. Intelligence is the
  user's own agent (Copilot/Claude/Codex). A CI check greps `package.json` + source for AI SDK
  imports and fails if any appear — BYO-tokens is enforced, not just intended.

## How we deploy

**0. One-time prerequisites**
- Confirm Azure sub (Visual Studio Enterprise) + `northeurope`.
- Add Cosmos to `infrastructure/main.bicep` (mirror atlas) — the scaffold currently has SWA + monitoring only.

**1. Provision infra**
```powershell
az group create -n glassbox-rg -l northeurope
az deployment group create -n glassbox-init -g glassbox-rg `
  --template-file glassBox/infrastructure/main.bicep `
  --parameters projectName=glassbox customDomain=glassbox.naurolabs.com
```

**2. App settings** (Free tier — App Settings, no Key Vault)
```powershell
az staticwebapp appsettings set -n glassbox-swa -g glassbox-rg --setting-names `
  OWNER_EMAIL=<my-ms-account> COSMOS_ENDPOINT=<uri> COSMOS_DB=glassbox
```
Cosmos via AAD/RBAC where possible (mirror atlas's data-contributor role assignment); fall back to
a connection string in App Settings only if RBAC-from-SWA-Functions proves painful on Free.

**3. CI/CD** — copy `.github/workflow-templates/swa-deploy.yml` into `glassBox/.github/workflows/`
(scaffold already placed a copy); set the `AZURE_STATIC_WEB_APPS_API_TOKEN` repo secret. Push to
`master` → quality gate (lint/build/test) → deploy → Telegram notify.

**4. Custom domain / DNS**
```powershell
# add CNAME glassbox -> <swa-default-hostname> in Google Cloud DNS (naurolabs.com zone)
az staticwebapp hostname set -n glassbox-swa -g glassbox-rg --hostname glassbox.naurolabs.com
```

## Deploy checklist

- [ ] Add Cosmos (serverless, AAD-only) + `actions` container to `main.bicep`.
- [ ] `az group create` + `az deployment group create`.
- [ ] App Settings: `OWNER_EMAIL`, `COSMOS_*`, App Insights connection string.
- [ ] Entra single-user allowlist gate in every Function.
- [ ] `staticwebapp.config.json`: Entra auth + security headers (PLATFORM.md §2/§8).
- [ ] CI secret `AZURE_STATIC_WEB_APPS_API_TOKEN`; workflow green.
- [ ] CNAME + `hostname set`; HTTPS live on `glassbox.naurolabs.com`.
- [ ] BYO-tokens CI guard passes (no AI SDK in the app).
- [ ] Register the domain in the DNS zone file.
