# glassBox — Agent playbook (Phase 1)

> How you (the human) and your VS Code coding agent drive the seller cockpit. The **app ships no
> LLM** — *you* are the intelligence, via Copilot/Claude/Codex. The agent reads + writes the board
> through the API; you watch and **approve** in the GUI.

## Run it locally

```powershell
# 1. API (Azure Functions) — terminal 1
cd glassBox/api ; npm install ; npm start          # http://localhost:7071

# 2. Frontend (Vite) — terminal 2
cd glassBox ; npm install ; npm run dev             # http://localhost:5173 (proxies /api → 7071)
```

No Azure needed: state persists to `glassBox/api/.data/db.json` (git-ignored). Locally there is no
auth (`OWNER_EMAIL` unset ⇒ open); on Azure the Entra owner-gate kicks in.

## The API the agent uses

| Call | What it does |
|---|---|
| `GET /api/state.json` | The whole board in one read — start here. |
| `POST /api/items` `{title, photos?, category?, condition?}` | Capture a new item → status `captured`. |
| `PATCH /api/items/{id}` `{priceBand, listPrice, description, strategy, status, ...}` | Fill research/draft; advance status. |
| `POST /api/items/{id}/actions` `{type, payload}` | Propose `publish` / `priceDrop` / `sendReply` → **pending approval**. |
| `POST /api/actions/{id}/approve` · `/reject` | (Human) decide. Approving applies the effect. |

`description` is **merged** (send `{lv}` then `{en}` and both stick). Status values:
`captured → priced → drafted → listed → negotiating → sold/archived`.

## The "sell this" flow — what to tell your agent

> Paste this as a Copilot instruction, swapping the item + photo:

```
You are my ss.lv selling assistant for the glassBox cockpit at http://localhost:7071.
I want to sell: "DJI Mini 2 drone, used, with 3 batteries". Photo: ./photos/drone.jpg

Do this:
1. POST /api/items to capture it (title + the photo path).
2. Research a fair ss.lv price for this item in Latvia (browse comparable listings).
   PATCH the item with priceBand {low, high, currency:"EUR", evidence}, a listPrice,
   and set status to "priced".
3. Write a Latvian description (+ a short English one) and a sales strategy
   (start price, when to drop, promote or not). PATCH description{lv,en}, strategy,
   status "drafted".
4. Do NOT publish. Tell me it's ready; I'll review the draft in the board and approve.
```

The agent fills the board; you open `localhost:5173`, read the draft, and (Phase 1) copy it to
ss.lv yourself. When you ask the agent to "propose publishing", it calls
`POST /api/items/{id}/actions {type:"publish"}` — which shows up in the **approval inbox** for you
to approve. Approving (Phase 1) just records it as `listed`; **actually posting to ss.lv is Phase 2**
(the agent co-drives the ss.lv form via Playwright MCP). See
[SCENARIO-ss-lv.md](SCENARIO-ss-lv.md).

## Guardrails (already enforced)

- **Nothing irreversible happens without you.** `publish` / `priceDrop` / `sendReply` are always
  proposals until you approve.
- **BYO-tokens is enforced** — `npm run check:byo` fails the build if any AI SDK is imported into
  the app.

## Try it without an agent (smoke test)

```powershell
$base = 'http://localhost:7071/api'
$item = irm "$base/items" -Method Post -ContentType application/json -Body '{"title":"Old drone","photos":["drone.jpg"]}'
irm "$base/items/$($item.id)" -Method Patch -ContentType application/json -Body '{"listPrice":160,"priceBand":{"low":120,"high":180,"currency":"EUR"},"description":{"lv":"Labs drons"},"strategy":"Start 160, drop to 140 after 10 days","status":"drafted"}'
$act = irm "$base/items/$($item.id)/actions" -Method Post -ContentType application/json -Body '{"type":"publish","payload":{"ssUrl":"https://ss.lv/x"}}'
irm "$base/actions/$($act.id)/approve" -Method Post
irm "$base/state.json"
```
