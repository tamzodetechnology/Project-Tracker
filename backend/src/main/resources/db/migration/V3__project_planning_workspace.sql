CREATE TABLE project_readiness (
  project_id BIGINT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  scope_confirmed BOOLEAN NOT NULL DEFAULT false,
  deliverables_defined BOOLEAN NOT NULL DEFAULT false,
  tasks_reviewed BOOLEAN NOT NULL DEFAULT false,
  estimates_entered BOOLEAN NOT NULL DEFAULT false,
  timeline_confirmed BOOLEAN NOT NULL DEFAULT false,
  risks_reviewed BOOLEAN NOT NULL DEFAULT false,
  acceptance_criteria_defined BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE project_phases (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(140) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'Planned' CHECK(status IN ('Planned','In Progress','Blocked','Completed')),
  position INTEGER NOT NULL DEFAULT 0 CHECK(position >= 0),
  due_date DATE,
  dependencies TEXT,
  deliverables TEXT,
  acceptance_criteria TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, position)
);
CREATE INDEX project_phases_project_position_idx ON project_phases(project_id, position);

ALTER TABLE tasks ADD COLUMN project_phase_id BIGINT REFERENCES project_phases(id) ON DELETE SET NULL;
CREATE INDEX tasks_project_phase_idx ON tasks(project_phase_id);

CREATE TABLE project_planning_items (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  kind VARCHAR(24) NOT NULL CHECK(kind IN ('Risk','Blocker','Decision','External dependency')),
  title VARCHAR(180) NOT NULL,
  description TEXT,
  status VARCHAR(12) NOT NULL DEFAULT 'Open' CHECK(status IN ('Open','Resolved')),
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX project_planning_items_project_status_idx ON project_planning_items(project_id, status, created_at DESC);
