# Tamzode Project Tracker

**Every Project. Clear Progress.** A React + TypeScript workspace backed by a Spring Boot REST API and PostgreSQL.

## Requirements

- Node.js 20.19+ or 22.12+
- Java 21
- Maven 3.9+
- Docker Desktop (or a local PostgreSQL 16+ instance)

## Start locally

1. Copy `.env.example` to `.env` and set the database URL, username, and password for your local PostgreSQL server. Docker Compose reads the password from this file, and Spring Boot imports the file when you start it from `backend/`.
2. Start PostgreSQL:

   ```powershell
   docker compose up -d postgres
   ```

   For a manually managed PostgreSQL server, create a database named `tamzode_tracker` and a user with access to it, then put that user's credentials in `.env`. The default `tamzode` / `tamzode_local` credentials are intended for the Compose database; they will not automatically match a separately installed PostgreSQL service.

3. Start the API from a terminal with the project root as its working directory:

   ```powershell
   cd backend
   mvn spring-boot:run
   ```

   Flyway creates the schema and inserts the four initial projects plus their project-specific tasks on first start. The seed deliberately contains no fabricated completion history or due dates. Existing Payroll modules are described as reported in the project record; no completion status is inferred for them.

4. In a second terminal at the project root:

   ```powershell
   npm install
   npm run dev
   ```

   Open the Vite URL printed in the terminal (usually `http://localhost:5173`). The UI uses the API; it does not silently fall back to browser-only or mock storage when the API is unavailable.

## Deploy with Neon and Render

This repository is configured as a single Render Docker web service: the Spring Boot process serves both the built React frontend and `/api` from the same origin. Neon hosts PostgreSQL separately. This avoids frontend/API CORS and runtime frontend URL configuration.

**Access control is not implemented yet.** The API is currently unauthenticated, so anyone who finds the public Render URL can read and change tracker records. Treat the first deployment as a private preview and do not enter confidential company or client data until owner sign-in and endpoint protection are added.

1. Create a **new, empty** Neon project/database. In Neon’s Connect dialog, choose the Java/JDBC connection details and copy the JDBC URL. Keep the Neon password secret. Neon requires an encrypted connection; keep `sslmode=require` in the URL. Neon can also provide pooled endpoints (with `-pooler` in the hostname); this app uses HikariCP with a small pool, so start with the direct endpoint unless your Neon connection limits call for the pooler. See [Neon connection security](https://neon.com/blog/oops-proof-your-vibe-code-with-neon-because-mistakes-happen) and [Neon pooling](https://neon.com/blog/postgres-support-case-recap).
2. Push this repository to GitHub or another Git provider and connect it to Render. Keep the repository private until authentication and access controls are added; the seeded project descriptions are personal workspace data.
3. In Render, choose **New → Blueprint** and select this repository. Render reads [`render.yaml`](./render.yaml), builds the Dockerfile, and asks for `DATABASE_URL`, `DATABASE_USERNAME`, and `DATABASE_PASSWORD`. Use the JDBC URL from Neon for `DATABASE_URL`, and enter its matching role and password in the other fields. Do not put these values in `render.yaml` or commit them.
4. Deploy. Flyway creates the schema and initial project/task records when the Spring service starts. Do not point the first deployment at a database that already contains tables named `projects`, `tasks`, `milestones`, `activity`, or `daily_updates`.
5. Open the Render service URL. Check `/api/health` for `{"status":"ok"}` and `/api/projects` for the seeded projects. The Render health check is configured to `/api/health`.

Render’s [Docker web services](https://render.com/docs/docker) build from the repository Dockerfile; its [Blueprint](https://render.com/docs/blueprint-spec) keeps the service configuration in source control. Render supplies the service port at runtime, which the Spring configuration reads from `PORT`. For a production launch, consider a paid Render instance if you need it continuously available; Render’s free web services can spin down after inactivity ([Render deploy guide](https://render.com/docs/your-first-deploy)).

## Checks

```powershell
npm run build
cd backend
mvn test
```

## Features

- Dashboard counts, task status distribution, time charts, and project progress are derived from database records.
- Create, update, archive/reopen, and delete projects; change stages; create/update tasks with parent tasks and estimates; update task statuses; and create/edit/delete milestones.
- Start, pause, resume, and stop one persistent timer; add, edit, delete, and export manual or timer-based time entries.
- Use the project implementation workspace for preferred project roadmap order, task-based recommendations, persistent readiness checks, editable/reorderable execution phases, task-phase assignment, risks/blockers/decisions, effort summaries, and project-scoped activity history.
- View weekly time, project time distribution, completed task trends, and CSV time-entry reports.
- Search and filter projects and tasks; switch task list/Kanban views; navigate monthly task and milestone dates.
- View recent activity and connection status. API validation errors use consistent JSON responses. Local CORS is configurable.
- Single dark forest/green theme, responsive navigation, visible focus indicators, and accessible labels.

## API routes

- `GET/POST /api/projects`, `GET/PUT/DELETE /api/projects/{id}`
- `GET /api/next-project/recommendation`; `GET /api/projects/{id}/planning`, `/activity`; `POST /api/projects/{id}/plan`; `GET/PUT /api/projects/{id}/readiness`
- `POST /api/projects/{id}/phases`, `PUT/DELETE /api/project-phases/{id}`, `PUT /api/projects/{id}/phases/order`; tasks accept `projectPhaseId`
- `POST /api/projects/{id}/planning-items`, `PUT/DELETE /api/planning-items/{id}`
- `GET/POST /api/tasks`, `PUT/DELETE /api/tasks/{id}`, `PATCH /api/tasks/{id}/status`
- `GET/POST /api/milestones`, `PUT/DELETE /api/milestones/{id}`
- `GET/POST /api/daily-updates`
- `GET /api/activity`
- `GET /api/time/timer`, `POST /api/time/timer/{start|pause|resume|stop}`
- `GET/POST /api/time/entries`, `PUT/DELETE /api/time/entries/{id}`
- `GET /api/reports/weekly-hours`, `/time-by-project`, `/task-status`, `/completed-trend`, `/time-entries.csv`

List endpoints accept `offset` and bounded `limit` parameters; project and task list endpoints also accept status/project filters. Progress counts only non-cancelled leaf tasks, so a parent with subtasks is not double-counted. Dashboard pending tasks include `To Do` and `In Review`; in-progress and blocked counts are separate. Time is stored in integer seconds and timer transitions use PostgreSQL timestamps. Weekly reports use the database session date/timezone (configure PostgreSQL to the intended workspace timezone for local-day boundaries).

Planning checklist, execution phases, task-phase links, and planning items are persisted by Flyway migration V3. Readiness remains unchecked until the user confirms each item. The roadmap order is explicitly separated from the overdue/today/priority recommendation. Progress and logged effort come from stored leaf-task and time-entry data; missing targets and estimates are labeled as unset. PostgreSQL-backed migration and UI interaction verification remains necessary before production deployment.

Still incomplete compared with the full product brief: authentication and owner scoping, user preferences/backup, configurable date-range filters across reports, subtasks hierarchy controls, and broad frontend interaction tests. The API is unauthenticated; do not expose it publicly or deploy as a production service until access controls are implemented and tested.
