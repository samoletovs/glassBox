# glassBox — Agent Instructions

> Project-specific instructions for AI coding agents.

## Build / Test / Deploy
```bash
npm install
npm run dev      # local dev (Vite)
npm run build    # production build
npm run lint
npm test
```

## Project conventions
- Stack: React + TypeScript + Vite, Azure SWA (Free tier) + SWA-managed Functions (Node 20), Cosmos DB (serverless)
- Auth: **Microsoft Entra ID** via SWA built-in auth, single-user allowlist (gate every Function on `userDetails === OWNER_EMAIL`). Free tier ⇒ no custom roles.
- Secrets: SWA App Settings only (Free tier — no Managed Identity, no Key Vault refs)
- Infrastructure: `infrastructure/main.bicep` imports `../../.github/infrastructure/modules/{monitoring,swa}.bicep`; adds its own Cosmos (mirror atlas)
- Deploy workflow: copied from `.github/workflow-templates/swa-deploy.yml`

## Hard rule — BYO-tokens (this is the experiment)
- **The app ships NO embedded LLM.** No AI SDK, no model keys, no model calls anywhere in `src/` or `api/`.
- Intelligence comes from the *user's* coding agent (Copilot/Claude/Codex) driving the UI. A CI guard must fail the build if an AI SDK import appears.

## Design rules (see docs/ARCHITECTURE.md)
- **Drive by structure, not pixels.** Every interactive element needs a semantic tag, an accessible name, a stable `data-testid`, and ARIA state — so an agent operates it from the accessibility tree (rung 2), never screenshots.
- Ship the **trust layer**: approval inbox + action log + one-click rollback + live (SSE) co-presence.
- Expose `GET /state.json` so the agent can read state cheaply instead of scraping.

## Off-path deviations
_None — glassBox is on the golden path for all 7 platform decisions._

## Hypothesis
A useful app can ship with **no embedded AI** and a **thin GUI**, be **fully co-operated** by an
external coding agent on the **user's own tokens**, and feel **better than headless MCP** where a
human must *see and trust* state (money, content, irreversible actions). See [VISION.md](VISION.md).
