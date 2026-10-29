# ⚡ Project Tracker MCP Server
**Autonomous Project & Time Tracking for Antigravity, Claude Code & AI Coding Agents**

This Model Context Protocol (MCP) server connects your AI assistants (Antigravity, Claude Code, Claude Desktop, Cursor) directly to your Project Tracker workspace.

Whenever your AI works on a project, it can automatically:
1. **Identify or create the project** on the fly.
2. **Start and stop live focus timers**.
3. **Log completed work hours** to your weekly tracker and dashboard.
4. **Create tasks and mark them "Done"** when coding finishes.
5. **Post updates to the live Activity feed**.

---

## 🛠️ Included MCP Tools (10 Tools)

| Tool Name | Purpose |
|---|---|
| `tracker_get_workspace_summary` | Returns total projects, active projects, tasks breakdown, and today's tracked focus hours. |
| `tracker_get_projects` | Lists all projects with their status, progress %, deadlines, and task counts. |
| `tracker_find_or_create_project` | Finds an existing project by name or auto-creates a new one. |
| `tracker_get_tasks` | Lists tasks filtered by project and/or status. |
| `tracker_create_task` | Adds a new task with priority, deadline, and description under a project. |
| `tracker_update_task_status` | Moves tasks between `To Do`, `In Progress`, `Done`, etc. and updates project % completion. |
| `tracker_start_timer` | Starts a live work timer on a project/task. |
| `tracker_stop_timer` | Stops the active timer, computes duration, and saves an official Time Entry. |
| `tracker_log_work_session` | Directly logs minutes worked (e.g., 45 minutes of bug fixing) to update the Weekly Hours chart. |
| `tracker_log_activity` | Posts a record to the live activity feed on Dashboard and Activity pages. |

---

## 🚀 Setup & Configuration

### 1. Claude Desktop Setup
Open `%APPDATA%\Claude\claude_desktop_config.json` (on Windows) or `~/Library/Application Support/Claude/claude_desktop_config.json` (on macOS) and add:

```json
{
  "mcpServers": {
    "project-tracker": {
      "command": "node",
      "args": [
        "c:/Users/Sureha DJ/OneDrive/Documents/ChatGPT/Project Tracker/mcp-server/index.mjs"
      ],
      "env": {
        "TRACKER_API_URL": "http://localhost:8080/api"
      }
    }
  }
}
```

### 2. Claude Code CLI Setup
In your terminal, simply run:
```bash
claude mcp add project-tracker node "c:/Users/Sureha DJ/OneDrive/Documents/ChatGPT/Project Tracker/mcp-server/index.mjs"
```

### 3. Antigravity Setup
Add this to your workspace `.gemini/settings.json` or MCP configuration:
```json
{
  "mcpServers": {
    "project-tracker": {
      "command": "node",
      "args": [
        "c:/Users/Sureha DJ/OneDrive/Documents/ChatGPT/Project Tracker/mcp-server/index.mjs"
      ]
    }
  }
}
```

---

## 💾 Dual Storage & Resilience
- **Online Mode**: When the Spring Boot backend (`http://localhost:8080/api`) is running, the server syncs directly with PostgreSQL / H2 database.
- **Offline / Autonomous Mode**: If the backend is stopped, all data is automatically saved to `data/workspace_store.json` on disk, guaranteeing zero data loss.

---

## 🧪 Testing the Server
You can test the server at any time by running:
```bash
npm run test
# or
node test-mcp.mjs
```
