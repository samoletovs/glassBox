# glassBox — Scenario 1 (MVP): ss.lv seller cockpit

> **Status:** chosen MVP scenario · **Filed:** 2026-06-21
> **In one line:** From VS Code, I say "sell this" + a photo; glassBox researches the price, writes
> the description + sales strategy, posts to **ss.lv** on my behalf, monitors the listing, and later
> drafts replies to buyers — and I **approve** every irreversible step.

## Why this is the MVP

It's the purest possible test of the glassBox bridge thesis, because the agent co-drives **two**
surfaces and the app still ships **no LLM**:

- **My cockpit** — the glassBox board (thin, agent-legible, on Azure SWA).
- **ss.lv** — the dominant Latvian classifieds site, which has **no public API**, so the agent
  operates its real web form (rung 2, Playwright MCP) while logged in as me.

It passes all four scenario criteria: visible state worth trusting (listings, prices, money),
irreversible actions (publish, price-drop, reply-to-buyer), real Baltic market data (ss.lv
comparables), and I'll actually use it (I have a pile of stuff to sell and no time).

**Relationship to turgo:** turgo *builds* an agent-first marketplace; glassBox *operates the
existing* one. Complementary experiments — glassBox could later cross-post the same item to turgo.

## The workflow (driven from VS Code + Copilot)

1. **Capture** — "Sell my old drone" + drop a photo. → A board item appears (state: `captured`).
2. **Research price** — agent scrapes ss.lv comparables in the right category → suggests a price
   band with evidence. (Read-only, low risk.) State: `priced`.
3. **Draft** — agent writes a Latvian (+ optional RU/EN) description and a **sales strategy**
   (start price, when to drop, promote or not). State: `drafted`. **I approve/edit.**
4. **Publish to ss.lv** — agent co-drives the ss.lv posting form (Playwright MCP), fills category,
   price, text, photos. **I approve the final publish.** State: `listed` (+ ss.lv URL).
5. **Monitor** — agent tracks views/position/age; flags stale; **proposes** a price drop or a
   re-post. I approve adjustments. State stays `listed`, with a monitoring log.
6. **Respond** *(later phase)* — agent watches buyer messages/email, **drafts** replies; I approve
   sends. Never auto-commits to a price or a sale. State → `negotiating` → `sold` / `archived`.

## The board (glassBox app) — state model

Item: `id`, `title`, `photos[]`, `category`, `condition`, `priceBand`, `listPrice`, `description{lv,ru,en}`,
`strategy`, `status` (`captured → priced → drafted → listed → negotiating → sold/archived`),
`ssUrl`, `metrics{views,position,ageDays}`, `actions[]` (the audit log).

Trust layer (per glassBox [ARCHITECTURE.md](ARCHITECTURE.md)):
- **Approval inbox** — `publish`, `priceDrop`, `sendReply` are *require-approval*; `research`,
  `draft` can auto-apply.
- **Action log + rollback** — every change recorded; un-publish / revert-price where ss.lv allows.
- **Live co-presence (SSE)** — I watch the agent work the board in real time.

## ss.lv automation — approach & guardrails (the actual research)

ss.lv has no API and likely anti-bot friction (login, possible captcha, rate limits) and ToS that
may restrict automation. Because glassBox is **human-approved, personal, low-volume** semi-automation
(not a spam bot), this stays reasonable — and "how to co-operate an un-instrumented third-party site
safely" is exactly the question glassBox exists to answer.

- **Human approves every publish and every reply.** No unattended posting.
- **Drive the real logged-in browser**, human-like pacing, low volume, no mass-posting.
- **Captcha / unexpected page → agent pauses and hands the browser back to me.**
- **Buyer replies drafted, never auto-sent.** An agent must never commit to a price or a sale.
- Prefer **rung 2** (ss.lv accessibility tree / DOM via Playwright MCP); never blind pixel-clicking.
- Treat ss.lv posting as **best-effort + verify**: after posting, the agent re-reads the live
  listing to confirm it matches the approved draft.

> ⚠️ Open item: confirm ss.lv ToS stance on automation before Phase 2. If it forbids it, fall back
> to "agent prepares a perfect draft + opens the pre-filled form for me to submit by hand" — still
> a big time-saver, still on-thesis.

## Phases (each is ship-and-stop-able)

| Phase | Scope | Proves |
|---|---|---|
| **1 — Cockpit + brain** | Board + price research + description/strategy, from VS Code. Output: approved draft (manual paste to post). | The board + BYO-tokens; the agent's research/drafting quality. |
| **2 — Bridge to ss.lv** | Agent posts the approved listing by co-driving ss.lv (Playwright MCP); I approve publish. | The bridge on a real third-party site + the publish trust gate. |
| **3 — Monitor & adjust** | Track views/position/staleness; agent proposes price drops. | Long-running agent value + the adjust loop. |
| **4 — Inbox agent** | Watch buyer messages/email; draft replies; I approve sends. | The hardest trust case: negotiation with a human in the loop. |

## What we learn (scored against the VISION hypothesis)

- Can an agent co-operate an **un-instrumented third-party GUI** reliably from the accessibility tree?
- Is approve-before-publish / approve-before-send the right trust granularity, or too much friction?
- Does the cockpit beat just doing it by hand — and where does it still need me?
- Does BYO-tokens hold (the app ships zero model calls, all intelligence is my Copilot)?

## Open decisions before building Phase 1
- Photo handling: store in the board (Cosmos + blob) or just reference local files?
- Categories: hardcode the few I sell in, or scrape ss.lv's category tree?
- Price research: live scrape per request, or a small cached comparables snapshot?
- Which external agent (besides Copilot) to validate BYO-tokens in Phase 2 — Claude for Chrome?
