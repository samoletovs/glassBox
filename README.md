# glassBox

glassBox is a thin web interface that a human and an external coding agent operate
together. The app contains no LLM or AI SDK: the coding agent supplies the
intelligence using the user's own model access.

## Research question

glassBox tests the nauroLabs question **"Do we still need apps?"** from the
opposite direction: what should an app look like when an agent is a primary
reader, but a human still needs to inspect state, approve actions, and undo
mistakes?

The hypothesis is that a small, semantically structured GUI can be more useful
than a headless tool when trust and reversible actions matter. See
[VISION.md](VISION.md) for the full experiment.

## What it does

- Exposes an agent-legible board with semantic controls and stable test IDs.
- Gives the human an approval inbox, action log, and rollback controls.
- Exposes machine-readable state through the API.
- Keeps model calls and model credentials outside the application.

## Stack

- React 18, TypeScript, Vite
- Azure Static Web Apps and Node.js 20 managed Functions
- Azure Cosmos DB
- Bicep infrastructure

## Run locally

```bash
npm install
npm run dev
```

Before submitting a change:

```bash
npm run lint
npm test
npm run build
```

## Status

**Research prototype.** The current phase is deployed behind Microsoft Entra ID
at [glassbox.naurolabs.com](https://glassbox.naurolabs.com). The experiment is
still being evaluated; this is not a general-purpose collaboration product.

## Repository layout

- `src/` - frontend
- `api/` - managed Functions API
- `infrastructure/` - Azure resources
- `docs/` - architecture, deployment notes, and experiment ideas

## License

MIT
