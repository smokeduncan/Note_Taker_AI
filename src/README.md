# Note Taker AI • MCP + AG-UI Edition  
_An AI-powered Sales & Productivity Assistant with standardized backend integrations (MCP) and real-time agent UX (AG-UI)._

---

## 1 . Project Overview
Note Taker AI turns unstructured notes (text or voice) into actionable CRM insights, tasks, summaries and communications.

Key technologies  
• **MCP (Model Context Protocol)** – Uniform backend/data-source interface (CRM, docs, calendar, …).  
• **AG-UI (Agent-User Interaction Protocol)** – 16-event real-time stream between agent and UI for “human-in-the-loop” experiences.  
• **SAP Sales Cloud V2 MCP Server** – First-class enterprise CRM connector used for demos.  
• **FastAPI/Express + React 18** – Back-end & front-end scaffolding.  
• **MongoDB + Redis** – Persistence & event buffering.  
• **Gemini Pro (simulated)** – LLM powering note clean-up, summarization & extraction (easily swappable).

---

## 2 . High-Level Architecture

```text
 ┌────────────┐       SSE/WebSocket        ┌──────────────────┐
 │ React AG-UI│  ◀───────────────▶──────── │  FastAPI/Express │
 │ Components │         AG-UI              │     Gateway      │
 └────────────┘                            └────────┬─────────┘
                                                    │ AG-UI ↕︎
                                         Agent Engine (NoteProcessorAgent)
                                                    │ MCP ↕︎
     ┌─────────────────────┐   REST/OData   ┌───────┴────────┐
     │ MCP Servers (CRM,   │◀──────────────▶│ SAP Sales Cloud│
     │ Docs, Calendar …)   │                └────────────────┘
```

* **Agent Engine** – Streams AG-UI events, orchestrates MCP tools, calls LLM.  
* **MCP Server Manager** – Registry, health-check & fallback across multiple MCP servers.  
* **SAPSalesCloudMCPServer** – Implements >15 tools (search/create/update Opportunity, Account, Activity, …).  
* **AGUIStream** – Node EventEmitter that buffers events and exposes Server-Sent Events for clients.

---

## 3 . Repository Layout

```
src/
 ├ ag-ui/               # AG-UI stream implementation
 ├ client/              # React app (components/pages)
 ├ controllers/         # HTTP & agent controllers
 ├ mcp/
 │   ├ MCPServerManager.js
 │   └ SAPSalesCloudMCPServer.js
 ├ server.js            # Express entry-point
 ├ README.md            # ← YOU ARE HERE
 └ .env.example         # Environment template
```

_Existing demo assets from the legacy ZIP are kept in `/extracted` for reference._

---

## 4 . Installation

### 4.1 Prerequisites
* Node ≥16  &  npm ≥9  
* MongoDB 6 (local or Atlas)  
* (Optional) Redis for SSE scaling  
* SAP Sales Cloud V2 tenant + API user

### 4.2 Clone & bootstrap

```bash
git clone https://github.com/your-org/note_taker_ai.git
cd note_taker_ai

# install server deps
npm install

# install client deps
npm install --prefix src/client
```

### 4.3 Environment

1. `cp src/.env.example .env`  
2. Fill:
   ```
   MONGO_URI=mongodb://localhost:27017/note_taker_ai
   SAP_TENANT_URL=your-tenant.crm.cloud.sap
   SAP_API_USERNAME=api_user
   SAP_API_PASSWORD=super_secret
   JWT_SECRET=change_me
   ```

### 4.4 Run (dev)

```bash
# concurrently: Express API at :5000  &  React client at :3000
npm run dev
```

Open http://localhost:3000 to launch the UI.

---

## 5 . Usage Walk-through

1. Create or import a note in UI → “Process”  
2. Browser opens SSE stream `/api/stream/<threadId>`  
3. **NoteProcessorAgent** emits AG-UI events:  
   * `LIFECYCLE_START` → UI shows spinner  
   * `TOOL_CALL_START` (cleanup)  
   * `STATE_DELTA` (progress 10 %)  
   * …  
4. When `USER_INPUT_REQUEST` arrives, UI renders a form (e.g., pick Opportunity).  
5. Upon completion `LIFECYCLE_END` includes summary, actionItems, SAP sync result.

---

## 6 . Key Components

### 6.1 `AGUIStream`
* Buffers up to 1 000 events, handles multi-client SSE, supports cancel/complete.  
* Helper methods: `startToolCall`, `sendText`, `updateProgress`, `requestUserInput`.

### 6.2 `MCPServerManager`
* Registers servers, provides `executeTool(server, tool, params)`, automatic fallback & metrics.  
* Exposes `/api/mcp/*` endpoints for inspection/testing.

### 6.3 `SAPSalesCloudMCPServer`
* Auth – Basic (username/password) or Certificate (future).  
* Tools implemented (`listTools()`):
  ```
  search_accounts, create_account, search_opportunities,
  create_opportunity, update_opportunity, search_activities,
  create_activity, schedule_appointment, ...
  ```
* `_makeRequest()` includes retry + exponential back-off.

### 6.4 `NoteProcessorAgent`
Pipeline:  
1. Clean-up note → `_cleanupNoteContent`  
2. Extract entities (people, dates, money, products)  
3. Summarize  
4. Derive action items (regex + heuristics)  
5. Sync with SAP (optional & interactive)  
6. Produce email draft / meeting proposal on demand.

---

## 7 . API Cheat-Sheet

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/notes/process` | Full AI processing |
| POST | `/api/notes/email-draft` | Draft email |
| POST | `/api/notes/schedule-meeting` | Meeting assistant |
| POST | `/api/notes/sync-sap` | Force SAP sync |
| GET  | `/api/stream/:threadId` | SSE event stream |
| POST | `/api/stream/input` | Answer `USER_INPUT_REQUEST` |
| POST | `/api/stream/cancel` | Cancel a running thread |
| GET  | `/api/mcp/servers` | List registered MCP servers |
| GET  | `/api/mcp/servers/:name/tools` | Tools in server |
| POST | `/api/mcp/execute` | Direct tool invocation (dev) |

---

## 8 . Frontend Integration (React)

```jsx
import { useAGUI } from '@ag-ui/react';

const { stream, state, events, sendUserInput, cancel } =
  useAGUI({ endpoint: `/api/stream/${threadId}` });
```

Use `state.status` for progress, filter `events` for rendering messages.

Component `src/client/components/AGUIStreamComponent.jsx` shows a fully-featured reference (auto-scroll, validation dialog, cancel button).

---

## 9 . Extending with New MCP Servers

```js
const GitHubServer = require('./mcp/GitHubMCPServer');
mcpManager.registerServer('github', new GitHubServer(token), {
  fallbackServers: ['sap_sales_cloud']
});
```

The Agent can now call `executeTool('github','create_issue', …)` and UI will visualize.

---

## 10 . Testing

```bash
# backend tests
npm test

# frontend React tests
npm test --prefix src/client
```

Mock SAP responses via `nock` or environment var `SAP_MOCK=1`.

---

## 11 . Deployment Notes

* **Production build** – `npm run build && NODE_ENV=production node src/server.js`.  
* **Scaling SSE** – sticky sessions or move to WebSocket mode; Redis pub/sub for multi-instance.  
* **Secrets** – Store in Kubernetes secrets or HashiCorp Vault, not in `.env`.

---

## 12 . Roadmap (extracted from PRD)

| Phase | Focus | ETA |
|-------|-------|-----|
| 1 | Core MCP + AG-UI skeleton (done) | ✅ |
| 2 | Multi-CRM MCP servers (Salesforce, HubSpot) | _TBD_ |
| 3 | Voice pipeline ‑ Whisper + diarization | _TBD_ |
| 4 | Security, GDPR, penetration tests | _TBD_ |

---

## 13 . Troubleshooting

| Symptom | Fix |
|---------|-----|
| `SSE connection drops` | Check NGINX `proxy_buffering off;` & keep-alive. |
| `SAP 401 Unauthorized` | Verify API user Basic Auth & IP allow-list. |
| `stream.status = error` | Inspect `/logs/*.log`, consult `tool:error` events. |
| Mongo “E11000 duplicate key” | Ensure unique index fields match upstream IDs. |

---

## 14 . Contributing

1. Fork -> Feature branch -> PR  
2. Follow ESLint (`npm run lint`) & Prettier.  
3. Add/extend Jest tests.  
4. Describe AG-UI impact in PR body (new events, UI changes).  

Happy building! 🎉
