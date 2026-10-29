ALTER TABLE projects
  ADD COLUMN current_stage VARCHAR(24) NOT NULL DEFAULT 'Planning',
  ADD CONSTRAINT projects_current_stage_check CHECK (current_stage IN ('Planning','Design','Development','Testing','Deployment','Completed'));

ALTER TABLE projects DROP CONSTRAINT projects_status_check;
ALTER TABLE projects ADD CONSTRAINT projects_status_check CHECK(status IN ('Planned','In Progress','On Hold','Completed','Archived'));
ALTER TABLE projects DROP CONSTRAINT projects_priority_check;
ALTER TABLE projects ADD CONSTRAINT projects_priority_check CHECK(priority IN ('Low','Medium','High','Urgent','Critical'));

ALTER TABLE tasks
  ADD COLUMN parent_task_id BIGINT REFERENCES tasks(id) ON DELETE CASCADE,
  ADD COLUMN start_date DATE,
  ADD COLUMN estimated_minutes INTEGER CHECK (estimated_minutes IS NULL OR estimated_minutes >= 0),
  ADD COLUMN completed_at TIMESTAMPTZ;
ALTER TABLE tasks DROP CONSTRAINT tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check CHECK(status IN ('To Do','In Progress','In Review','Done','Blocked','Cancelled'));
ALTER TABLE tasks DROP CONSTRAINT tasks_priority_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_priority_check CHECK(priority IN ('Low','Medium','High','Urgent','Critical'));
CREATE INDEX tasks_parent_task_idx ON tasks(parent_task_id);
CREATE INDEX tasks_completed_idx ON tasks(completed_at DESC) WHERE completed_at IS NOT NULL;

CREATE TABLE timer_sessions (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id BIGINT REFERENCES tasks(id) ON DELETE SET NULL,
  status VARCHAR(12) NOT NULL CHECK(status IN ('Running','Paused','Stopped')),
  current_started_at TIMESTAMPTZ,
  elapsed_seconds BIGINT NOT NULL DEFAULT 0 CHECK(elapsed_seconds >= 0),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  stopped_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((status = 'Running' AND current_started_at IS NOT NULL) OR status <> 'Running')
);
CREATE UNIQUE INDEX timer_one_open_session_idx ON timer_sessions((1)) WHERE status IN ('Running','Paused');
CREATE INDEX timer_sessions_project_idx ON timer_sessions(project_id, started_at DESC);

CREATE TABLE time_entries (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id BIGINT REFERENCES tasks(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  duration_seconds BIGINT NOT NULL CHECK(duration_seconds > 0),
  notes TEXT,
  source_session_id BIGINT UNIQUE REFERENCES timer_sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK(ended_at > started_at)
);
CREATE INDEX time_entries_project_date_idx ON time_entries(project_id, started_at DESC);
CREATE INDEX time_entries_task_idx ON time_entries(task_id);
CREATE UNIQUE INDEX time_entries_manual_retry_idx
  ON time_entries(project_id, COALESCE(task_id,0),started_at,ended_at)
  WHERE source_session_id IS NULL;
