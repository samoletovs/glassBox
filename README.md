# glassBox

A thin web GUI that a human and an external coding agent co-operate on the same live surface, BYO-tokens, no embedded LLM — the bridge between today's GUIs and headless MCP.

> Lab experiment under [NauroLabs](https://naurolabs.com).
> Hosted at: https://<not deployed yet>

## Quick start
```bash
npm install
npm run dev
```

## Structure
- `src/` — frontend code (thin, agent-legible UI)
- `api/` — Azure Functions API (created on first feature)
- `infrastructure/main.bicep` — Azure resources (SWA + monitoring + Cosmos)
- `docs/` — [VISION](VISION.md) · [ARCHITECTURE](docs/ARCHITECTURE.md) · [DEPLOYMENT](docs/DEPLOYMENT.md) · [IDEAS](docs/IDEAS.md)
- `.github/workflows/` — CI/CD via the shared SWA deploy template

## NauroLabs conventions
- Golden path: see [.github/PLATFORM.md](../.github/PLATFORM.md)
- Project lifecycle: hypothesis → MVP → measure → iterate or kill
- AI-native: here, **inverted** — AI-native by being AI-*absent* in the app and AI-present in the user's agent (BYO-tokens)

## Hypothesis
A useful app can ship with **no embedded AI** and a **thin GUI**, be **fully co-operated** by an
external coding agent on the **user's own tokens**, and feel better than headless MCP where a human
must see and trust state. Full vision → [VISION.md](VISION.md).

