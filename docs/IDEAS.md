# glassBox — Scenario & build ideas

> The pattern (thin co-drivable GUI + trust layer + BYO-tokens) is domain-agnostic. This file
> picks the **MVP scenario** and banks broader ideas for personal and work use.

## ✅ Chosen MVP scenario — ss.lv seller cockpit

Sell my unused stuff from VS Code: research price → draft listing + sales strategy → post to
**ss.lv** → monitor → reply to buyers, approving each irreversible step. The agent co-drives **two**
surfaces (my board *and* ss.lv, which has no API), so it's the sharpest test of the bridge thesis.
Full write-up: **[SCENARIO-ss-lv.md](SCENARIO-ss-lv.md)**. The shortlist below is parked for later.

## What makes a *good* glassBox scenario

The bridge shines when **all four** are true — use this as the filter:
1. **Visible state worth trusting** — money, content, commitments (not just a hidden data blob).
2. **An irreversible / approval-worthy action** — send, publish, delete, commit — so the
   approval-inbox + rollback layer earns its place.
3. **Real (ideally Baltic open) data** the agent fetches — aligns with the lab's "real data" principle.
4. **Genuinely useful to me** — so I actually drive it daily and feel the bridge.

A plain **expense log** scores only on (1). That's why it's a weak MVP — keep it as a fallback.

## MVP scenario shortlist

| Scenario | Visible+trust | Irreversible action | Real data | Why it's interesting |
|---|---|---|---|---|
| **Opportunity / property-hunt board** ⭐ | listings + price + my rating | "make enquiry / mark pursuing" | LV listing & open property data | Agent sources + de-dupes listings into a board; I star/reject; it drafts the enquiry I approve. High trust (money), very real. |
| **Tender / bid-decision radar** ⭐ (work-flavored) | new tenders + fit score + go/no-go | "mark as bidding" | Latvia open procurement / EU TED | Agent watches feeds, fills a board, scores fit, drafts a one-pager; I approve which to pursue. Mirrors real consulting bid calls. |
| **Publishing / content pipeline** | draft cards + status | **publish** (irreversible) | — (or memex-fed) | Agent drafts posts/guides; I approve publish. Cleanest demo of the approval inbox. |
| **Personal CRM / follow-ups** | people + last-touch + draft | **send email** | contacts | Agent surfaces overdue follow-ups, drafts messages; I approve sends. Strong irreversible-action demo. |
| Expense / budget log (fallback) | amounts | — | bank export | Baseline only — fails the "interesting" test. |

**Recommendation:** lead with one of the two ⭐ boards — a **board over a real feed where the agent
proposes and I approve**. Suggest building it generically as an **"opportunity board"** core
(items + score + status + draft-action) so the *same* app serves the personal (property) and
work (tender) framings by swapping the data source. That keeps the MVP one build while testing the
dual lens.

## Broader build ideas — personal

Each is the same glassBox pattern, different domain:

- **Travel itinerary planner** — agent fills flights/stays/places from real transport+tourism data; I approve bookings. Visible, trust on spend.
- **Home inventory & warranty tracker** — agent files receipts/manuals, flags expiring warranties; I approve disposals/claims.
- **Subscription / telecom review board** — agent lists my recurring services + cheaper alternatives; I approve switch/cancel (irreversible). Real provider data.
- **Reading & learning queue** (memex-fed) — agent triages saved links into read/skip/promote; I approve what graduates to the wiki. Direct tie to mindVault.
- **Family logistics board** — shared chores/appointments; agent proposes a schedule, humans approve. (familyVault flavor — kept separate, pattern shared.)

## Broader build ideas — work (D365 / consulting; generic pattern, specifics stay in aibsVault)

These are why glassBox matters at work — **the bridge makes a form agent-operable *before* it has an MCP server**:

- **D365 form co-pilot bridge** — the flagship generic case: a thin co-drivable surface over a
  D365/CE form that lacks a clean API. Agent fills/validates; consultant approves the save. The
  literal answer to "make this form agent-operable now."
- **Tender / bid-decision board** (also the work MVP above) — go/no-go cockpit over open procurement feeds.
- **Requirements / FDD triage board** — agent drafts requirement memos (ties to the rapid-* skills);
  analyst approves/edits before they become ADO work items. Approval inbox = the review gate.
- **Test-case execution cockpit** — agent walks test steps, proposes pass/fail with evidence;
  tester approves results. Visible + high-trust + auditable (perfect for the action log).
- **Data-migration reconciliation board** — agent proposes field/value mappings; consultant
  approves each. The highest-trust case — exactly where "see and approve + rollback" is non-negotiable.
- **Cutover / release checklist** — agent runs and ticks steps; lead approves go-live gates.

> Work specifics (customer names, methodology IP) live in **aibsVault**; only the generic glassBox
> pattern is captured here. The work value: a reusable answer to *"how do we make today's
> un-instrumented enterprise screens agent-ready without waiting for every vendor to ship MCP?"*

## Cross-cutting: "one core, two surfaces"

Whichever scenario wins, build it over a store that *also* gets a small MCP server, so the same
domain can be driven headless (rung 1) and co-driven (rung 2). That is the concrete a16z-vs-Shipper
experiment — see [ARCHITECTURE.md](ARCHITECTURE.md).

## Open decisions (to settle before MVP)

- Which scenario for MVP? (recommend: generic **opportunity board** → property + tender framings)
- Which real data source first?
- Event-sourced vs snapshot rollback?
- Which external agent besides Copilot to validate BYO-tokens (Claude Desktop? Codex?)
