# Note Taker AI  
_AI–powered Sales & Productivity Assistant with MCP-based back-end integrations and AG-UI real-time agent UX_

---

## 1 . What it does
Note Taker AI ingests raw meeting notes (typed or voice), cleans and structures them with an LLM, then:

* summarises the conversation  
* extracts action-items, owners & due dates  
* links the note to CRM objects  
* pushes tasks / activities back to SAP Sales Cloud (and other CRMs)  
* drafts follow-up e-mails or schedules meetings – all while streaming its reasoning to the UI in real time

---

## 2 . Feature Highlights

| Category | Highlights |
|----------|------------|
| ✨ AI pipeline | Gemini-Pro-powered clean-up, entity extraction & summarisation |
| 🔌 MCP (Model-Context-Protocol) | Uniform tool interface for **SAP Sales Cloud**, Salesforce, Google Drive … |
| 📡 AG-UI (Agent User Interaction) | 16 standard events (TEXT_MESSAGE_CONTENT, TOOL_CALL_START …) streamed via SSE/WebSocket |
| 🌐 SAP Sales Cloud V2 connector | >15 ready-to-use tools: search/create/update Opportunity, Account, Activity, Lead… |
| 🖥️ React 18 client | Rich chat-like stream viewer with cancel, approval dialogs & progress bars |
| 🗄️ MongoDB + Redis | Persistence and scalable event buffering |
| 🛠️ Dev-friendly | Hot-reload, TypeScript front-end, Jest tests, Docker recipes |

---

## 3 . High-Level Architecture

```
┌──────────────┐  AG-UI-SSE  ┌────────────────┐  MCP-REST  ┌─────────────────┐
│ React Client │◀──────────▶│   Express API   │◀──────────▶│ SAP Sales Cloud │
└──────────────┘            │  + Agent Engine │            └─────────────────┘
                             │  + MCP Manager │
                             └────────────────┘
```

1. **Agent Engine (`NoteProcessorAgent`)** streams AG-UI events while orchestrating MCP tools and LLM calls.  
2. **`MCPServerManager`** routes tool invocations to registered servers and provides fallback / health checks.  
3. **`SAPSalesCloudMCPServer`** converts high-level tool calls into authenticated OData V2 requests.  
4. **`AGUIStream`** buffers events and exposes Server-Sent Events to any number of browser clients.

---

## 4 . Project Structure (relevant parts)

```
.
├─ src/
│  ├─ server.js               # Express entry point
│  ├─ mcp/
│  │   ├─ MCPServerManager.js
│  │   └─ SAPSalesCloudMCPServer.js
│  ├─ ag-ui/                  # AG-UI stream impl
│  │   └─ AGUIStream.js
│  ├─ controllers/
│  │   └─ NoteProcessorAgent.js
│  └─ client/                 # React app
└─ README.md                  # ← you are here
```

---

## 5 . Quick Start

### 5.1 Prerequisites
* Node ≥ 16 & npm ≥ 9  
* MongoDB 6 (local or Atlas)  
* SAP Sales Cloud V2 tenant with an API user (Basic Auth)

### 5.2 Install & run (dev)

```bash
git clone https://github.com/smokeduncan/Note_Taker_AI.git
cd Note_Taker_AI

# install server deps
npm install

# install client deps
npm install --prefix src/client

# copy env template
cp src/.env.example .env   # fill SAP & Mongo creds

# start API (:5000) + React client (:3000)
npm run dev
```

Open http://localhost:3000 and select a note to begin processing.

---

## 6 . Usage Walk-Through

1. **Upload / create a note** in the UI.  
2. Click **Process** – the browser opens an SSE stream to `/api/stream/{threadId}`.  
3. The agent emits AG-UI events:  
   * `LIFECYCLE_START` → UI shows spinner  
   * `TOOL_CALL_START cleanup_note`  
   * `STATE_DELTA progress=10` …  
4. When a CRM change is about to happen the agent sends `USER_INPUT_REQUEST`; the UI shows an approval dialog.  
5. After `LIFECYCLE_END` the UI shows summary, action items and SAP activity/task IDs created.

---

## 7 . MCP & SAP Sales Cloud Details

### 7.1 Registering the server

```js
const sapMcp = new SAPSalesCloudMCPServer(
  process.env.SAP_TENANT_URL,
  process.env.SAP_API_USERNAME,
  process.env.SAP_API_PASSWORD
);
mcpManager.registerServer('sap_sales_cloud', sapMcp);
```

### 7.2 Available tools (`/api/mcp/servers/sap_sales_cloud/tools`)

```
search_accounts, create_account,
search_opportunities, create_opportunity, update_opportunity,
search_activities, create_activity, schedule_appointment, ...
```

### 7.3 Example: create a follow-up task

```js
await mcpManager.executeTool('sap_sales_cloud', 'create_activity', {
  type: 'Task',
  subject: 'Send proposal',
  priority: 'High',
  due_date: '2025-06-07',
  account_id: '10001234'
});
```

---

## 8 . AG-UI Event Reference

| Type | Purpose |
|------|---------|
| TEXT_MESSAGE_CONTENT | streaming LLM output |
| TOOL_CALL_START / END | bracket each MCP operation |
| STATE_DELTA | progress & state patches |
| USER_INPUT_REQUEST | human-in-the-loop prompts |
| LIFECYCLE_START / END | wrapper for the whole task |
| ERROR, CANCELLATION | … plus 9 more standard events |

React hook:

```jsx
const { stream, state, events, sendUserInput, cancel } =
  useAGUI({ endpoint: `/api/stream/${threadId}` });
```

---

## 9 . Extending the Platform

* **Add another CRM** – write `HubSpotMCPServer`, register with `mcpManager.registerServer('hubspot', …)`.  
* **New agent skill** – create a subclass of `NoteProcessorAgent` or a separate agent, use `AGUIStream` helpers.  
* **Voice pipeline** – plug Whisper MCP server and feed transcripts into the same agent.

---

## 10 . Troubleshooting

| Issue | Remedy |
|-------|--------|
| “401 Unauthorized” from SAP | verify API user has correct business role & IP whitelist |
| SSE disconnects through Nginx | `proxy_buffering off; proxy_read_timeout  1h;` |
| Mongo duplicate key | ensure external IDs (AccountID etc.) are unique before insert |

---

## 11 . License

MIT (c) 2025 – Smokeduncan & contributors  
