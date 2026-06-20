# glassBox — Vision

> **One line:** A deliberately thin web app that a human and an external coding agent
> operate **together on the same live surface** — the agent brings its own tokens, the app
> ships **no embedded LLM**. glassBox is the "bridge" rung between today's click-by-click GUIs
> and a fully headless MCP future.
>
> **Status:** vision / pre-MVP · **First filed:** 2026-06-21 · **Type:** research experiment
> **Origin:** [mindVault → 02_areas/agents/agent-native-saas.md](https://github.com/samoletovs/mindVault)
> (Dan Shipper / Every on Lenny's Podcast, 2026) — the "browser-inside-the-agent, bring-your-own-tokens" idea.

---

## Why this exists

Two futures are being argued about right now:

- **a16z / MCP camp — "the end of software-as-UI."** Apps become typed tools + data an agent
  calls headlessly. No GUI, maybe no human in the loop. *(NauroLabs already probes this elsewhere
  — e.g. ERA's minimal-UI ERP, and an ERP-MCP connector into D365 F&O.)*
- **Operator camp (Dan Shipper / Every) — "SaaS and the GUI survive, relocated."** The app still
  has a thin screen, but it runs **inside** a coding agent's in-app browser. The human and the
  agent see and edit the **same** surface. Crucially, the agent runs on the **user's** AI
  subscription, so the SaaS vendor pays for **zero tokens** — which *saves* SaaS margins instead
  of killing them.

These can't both be the whole story. glassBox's bet: **they are two rungs of one ladder.** MCP is
the destination; the bridge is what "agent-ready" looks like *today*, for the overwhelming majority
of apps that will never expose a clean MCP server (most enterprise SaaS, internal tools, legacy
D365 forms). glassBox builds the bridge rung deliberately, end to end, to *feel* where it wins and
where it loses.

## The hypothesis (what we're trying to prove or disprove)

> A genuinely useful app can ship with **no embedded AI** and a **deliberately thin GUI**, be
> **fully co-operated** by an external coding agent (VS Code + Copilot via Playwright MCP, or
> Claude/Codex) on the **user's own tokens**, and this "thin GUI + my agent" shape will feel
> **better than headless MCP** exactly where a human needs to *see and trust* state
> (money, content, irreversible actions) — and **worse** for pure batch work.

Falsifiable predictions to score later:
1. With enough markup discipline (semantic HTML + ARIA + stable accessible names), an agent drives
   the **accessibility tree (rung 2)** reliably — no pixel/vision fallback needed.
2. An **approval inbox + action log + one-click rollback** is the minimum trust layer that makes
   unsupervised agent actions acceptable to the human.
3. For "show me / let me approve" domains, users prefer the bridge; for "just do it in bulk"
   domains, they prefer headless MCP.
4. BYO-tokens genuinely works: the app contains no model calls, yet the experience feels AI-native.

## What glassBox actually is (the four properties)

| Property | What it means in glassBox |
|---|---|
| **Thin GUI** | Minimal screens — no formatting toolbars or wizards. The screen exists so the human can *see state and approve*; the agent does the heavy lifting. |
| **Agent-legible** | Semantic HTML, ARIA roles, stable `data-testid` / accessible names on every actionable element. Optional `GET /state.json` so the agent reads cheaply instead of scraping. The research lives here. |
| **Co-presence** | Human and agent act on the same state. Live re-render (SSE/WebSocket) so each sees the other's changes instantly. |
| **BYO-tokens** | The agent authenticates *as the user* (scoped) and runs on the user's own AI subscription. The app ships **no** LLM and pays for **no** tokens. |

The differentiator vs. plain browser-automation is the **trust layer**: approval inbox, audit log,
rollback — the affordances Shipper says a co-driven app needs.

## How it aligns with the NauroLabs vision

glassBox is a clean instrument for the lab's [four core questions](https://github.com/samoletovs/nauroLabs-github/blob/master/VISION.md):

- **"Do we still need apps?"** — glassBox is the *middle answer*: yes, but the app shrinks to a
  thin, agent-legible surface. It sits between ERA's minimal-UI and a no-UI MCP service, making the
  spectrum concrete.
- **"Where's the AI–human boundary?"** — the whole point. The approval/rollback layer is a direct
  experiment in how much an agent may do before a human must see and confirm.
- **"What's worth selling?"** — tests the margin-flip thesis: if value is the *thin legible surface
  + trust layer* (not embedded intelligence), what does an "agent-ready SaaS" sell?

Against the lab's [design principles](https://github.com/samoletovs/nauroLabs-github/blob/master/VISION.md#design-principles):

- **Experiment, don't plan** — ship a tiny real domain in a weekend; the value is the *learning*,
  not a business.
- **AI-native, not AI-added** — inverted: AI-native by being *AI-absent in the app* and AI-present
  in the user's agent. A sharp test of the principle.
- **Real data over synthetic** — the chosen scenario should use a real Baltic open-data source
  (see [docs/IDEAS.md](docs/IDEAS.md)).
- **Multiple paradigms** — glassBox is explicitly the *bridge* paradigm, complementing ERA
  (minimal-UI), turgo (agent-first), and the ERP-MCP (headless) work.
- **Revenue awareness** — hypothesis: a co-drivable thin surface + trust layer is the sellable
  artifact for enterprises that can't wait for every vendor to ship MCP.

## Dual lens — personal + work

- **Personal (nauroLabs):** build it, drive it daily with my own Copilot, feel the bridge.
- **Work (kept in aibsVault, referenced not copied):** glassBox is the prototype answer to
  *"how do I make a D365 form that lacks an API agent-operable **now**?"* — the bridge is the
  pattern customers need before every screen has an MCP server. Strategic write-up stays in the
  work OS; only the generic pattern lives here.

## Scope guardrails (so the experiment stays an experiment)

- **In:** one tiny real domain · agent-legible markup · approval/log/rollback trust layer ·
  driven by Copilot (Playwright MCP) + at least one external agent (Claude/Codex) · BYO-tokens.
- **Out (v1):** multi-user, billing, the app embedding its own LLM, mobile, anything that isn't
  needed to test the four predictions.
- **Kill criteria:** if rung-2 control needs constant pixel fallbacks, or the trust layer can't be
  made to feel safe, the bridge thesis is weak — write that up and stop.

## The "one core, two surfaces" link to the MCP experiment

glassBox should sit over the **same data store** as a headless MCP server, so the *identical*
domain can be driven both ways — co-driven thin GUI (rung 2) **and** typed MCP tools (rung 1) —
making the a16z-vs-Shipper tension directly testable. See
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Roadmap (rough)

1. **Scenario chosen** ✓ — **ss.lv seller cockpit** (sell my unused stuff via VS Code: research price → draft listing + strategy → post to ss.lv → monitor → reply to buyers, approving each irreversible step). See [docs/SCENARIO-ss-lv.md](docs/SCENARIO-ss-lv.md). Other ideas parked in [docs/IDEAS.md](docs/IDEAS.md).
2. **MVP (Phase 1)**: thin board + price research + description/strategy, driven by Copilot locally; output an approved listing draft.
3. **Bridge (Phase 2)**: agent posts to ss.lv by co-driving its web form (Playwright MCP); I approve publish.
4. **Monitor (Phase 3)** + **Inbox agent (Phase 4)**: price-drop proposals; drafted buyer replies I approve.
5. **Trust layer** throughout: approval inbox + action log + rollback. **BYO-tokens** enforced (app ships no LLM).
6. **Deploy** — ✓ **Phase 1 live** (behind Entra login) at `purple-grass-01f8aa203.7.azurestaticapps.net`; custom domain `glassbox.naurolabs.com` pending DNS. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Next: score the hypothesis; iterate or kill.
