# glassBox — Architecture

> How a human and an external coding agent co-operate one thin surface, with the app shipping no LLM.

## The control ladder (where glassBox sits)

An agent can operate an app at three "rungs". Always climb to the highest available.

| Rung | Approach | How it controls | glassBox role |
|---|---|---|---|
| 1 | **API / MCP** | typed tool calls | The *destination* — a sibling MCP server over the same store (see below). Already done at work via ERP-MCP → D365. |
| 2 | **DOM / accessibility tree** | reads a structured snapshot, clicks element `[5]`, fills fields | **glassBox's home rung.** Driven by Playwright MCP / browser-use. The reliable sweet spot for today's web apps. |
| 3 | **Pixel / vision** | screenshot → guess coordinates | Explicitly avoided. Brittle (~15–22% success on OSWorld). If we ever need it, the markup failed. |

**Design rule: drive by structure, not pixels.** Every glassBox feature must be operable from the
accessibility tree alone. If an agent can only do it by screenshot, that's a bug in our markup.

## Components

```
┌─────────────────────────────────────────────────────────────┐
│  User's coding agent (BYO-tokens)                            │
│  VS Code + Copilot (Playwright MCP)  ·  Claude / Codex       │
│  — reads the a11y snapshot, clicks/fills, reads /state.json  │
└───────────────┬─────────────────────────────────────────────┘
                │  drives the SAME browser surface the human uses
                ▼
┌─────────────────────────────────────────────────────────────┐
│  glassBox thin GUI  (React + Vite, Azure SWA Free)          │
│  • semantic HTML + ARIA + stable data-testid everywhere     │
│  • live re-render (SSE) so human+agent see each other       │
│  • Agent Activity panel: log + pending-approval inbox       │
│  • one-click rollback                                        │
│  • NO embedded LLM — zero model calls                       │
└───────────────┬─────────────────────────────────────────────┘
                │  /api  (typed)
                ▼
┌─────────────────────────────────────────────────────────────┐
│  API  (SWA-managed Azure Functions, Node 20)               │
│  • CRUD + query over the domain                            │
│  • action log + rollback (event-sourced or snapshot)      │
│  • GET /state.json  (cheap read surface for the agent)    │
│  • emits SSE on every state change                        │
└───────────────┬─────────────────────────────────────────────┘
                ▼
┌─────────────────────────────────────────────────────────────┐
│  Azure Cosmos DB (serverless)  —  one core data store      │
└─────────────────────────────────────────────────────────────┘
                ▲
                │  rung 1 (the "destination")
┌─────────────────────────────────────────────────────────────┐
│  (optional) glassBox MCP server  — same store, typed tools  │
│  proves "one core, two surfaces" (a16z destination vs bridge)│
└─────────────────────────────────────────────────────────────┘
```

## The trust layer (what makes co-driving safe)

This is the part that distinguishes glassBox from plain browser automation — Shipper's required affordances:

- **Approval inbox** — agent-proposed mutations land as *pending*; the human approves/rejects. Config per action: auto-apply (safe, e.g. categorize) vs. require-approval (irreversible, e.g. delete, send).
- **Action log** — every change (human or agent) is recorded with actor, timestamp, before/after.
- **One-click rollback** — any logged action (or batch) can be reverted. Implies snapshots or event-sourcing in the store.
- **Live co-presence** — SSE pushes state changes so the human watches the agent work in real time.

## Agent-legibility checklist (the actual research surface)

Every interactive element must have:
- a semantic element (`<button>`, `<input>`, `<table>` — not `<div onclick>`),
- an accessible name (visible label, `aria-label`, or `aria-labelledby`),
- a stable `data-testid`,
- state exposed via ARIA (`aria-checked`, `aria-expanded`, `aria-busy`),
- list/table semantics (`role="row"`, headers) so the agent can target "the row for X".

Plus a machine read-path: `GET /state.json` returning the full current state as typed JSON, so an
agent can read without scraping.

## BYO-tokens, concretely

- The app makes **no** model calls. Verified by: no AI SDK in `package.json`, no model keys in app settings, a CI check that greps for forbidden imports.
- Intelligence comes from the user's agent (their Copilot/Claude/Codex subscription).
- The agent authenticates **as the user** through the normal SWA Entra ID session (it drives the
  already-logged-in browser), so it inherits exactly the user's permissions — no separate app-level
  AI auth needed for v1.

## "One core, two surfaces"

The API and Cosmos store are the single core. Two surfaces sit on top:
- **Bridge (rung 2):** the thin GUI the agent co-drives — glassBox's main thesis.
- **Destination (rung 1):** an optional MCP server exposing the same operations as typed tools.

Building both over one store lets us run the *same* scenario both ways and feel the trade-off
directly — the concrete form of the a16z-vs-Shipper tension.
