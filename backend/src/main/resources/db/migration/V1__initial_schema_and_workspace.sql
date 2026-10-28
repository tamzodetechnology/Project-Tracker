CREATE TABLE projects (
 id BIGSERIAL PRIMARY KEY, name VARCHAR(140) NOT NULL, description TEXT, category VARCHAR(100), technology VARCHAR(300),
 status VARCHAR(20) NOT NULL DEFAULT 'Planned' CHECK(status IN ('Planned','In Progress','On Hold','Completed')),
 priority VARCHAR(20) NOT NULL DEFAULT 'Medium' CHECK(priority IN ('Low','Medium','High','Urgent')),
 start_date DATE, deadline DATE, owner VARCHAR(120), notes TEXT, useful_links TEXT, repository_url VARCHAR(500),
 progress_mode VARCHAR(20) NOT NULL DEFAULT 'tasks' CHECK(progress_mode IN ('tasks','milestones')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE tasks (
 id BIGSERIAL PRIMARY KEY, title VARCHAR(180) NOT NULL, description TEXT, project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
 status VARCHAR(20) NOT NULL DEFAULT 'To Do' CHECK(status IN ('To Do','In Progress','In Review','Done')),
 priority VARCHAR(20) NOT NULL DEFAULT 'Medium' CHECK(priority IN ('Low','Medium','High','Urgent')),
 due_date DATE, assignee VARCHAR(120), tags TEXT[] NOT NULL DEFAULT '{}', notes TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX tasks_project_idx ON tasks(project_id); CREATE INDEX tasks_due_idx ON tasks(due_date); CREATE INDEX tasks_status_idx ON tasks(status);
CREATE TABLE milestones (
 id BIGSERIAL PRIMARY KEY, name VARCHAR(160) NOT NULL, description TEXT, project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
 target_date DATE, status VARCHAR(20) NOT NULL DEFAULT 'Planned' CHECK(status IN ('Planned','In Progress','Completed')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE activity (
 id BIGSERIAL PRIMARY KEY, action VARCHAR(80) NOT NULL, entity_type VARCHAR(30) NOT NULL, entity_id BIGINT,
 entity_name VARCHAR(180) NOT NULL, details TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX activity_created_idx ON activity(created_at DESC);
CREATE TABLE daily_updates (
 id BIGSERIAL PRIMARY KEY, worked_on TEXT NOT NULL, completed TEXT, blockers TEXT, next_steps TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now());

INSERT INTO projects(name,description,category,technology,status,priority) VALUES
('Tamzode Technology Website','Build and launch the official company website.','Company website','', 'In Progress','High'),
('Payroll Management System','Client project. Reported existing modules: employee management, attendance, and leave management. Remaining or unconfirmed: salary calculations, payslips, reports, roles and permissions, applicable tax or deductions.','Client project','Java, Spring Boot, React, PostgreSQL','In Progress','High'),
('Eythu','Help users turn goals into actionable tasks with AI-assisted planning and progress tracking.','AI-powered productivity application','', 'Planned','Medium'),
('BillFlow AI','Extract invoice information, organise documents, flag potential duplicates, and track payment status.','AI-powered invoice management software','', 'Planned','Medium');

INSERT INTO tasks(title,project_id,status,priority) VALUES
('Design',1,'To Do','High'),('Homepage',1,'To Do','High'),('Services page',1,'To Do','Medium'),('Portfolio page',1,'To Do','Medium'),
('Contact form',1,'To Do','Medium'),('Responsive testing',1,'To Do','High'),('SEO',1,'To Do','Medium'),('Deployment',1,'To Do','High'),
('Salary calculations',2,'To Do','High'),('Payslips',2,'To Do','High'),('Reports',2,'To Do','Medium'),('Roles and permissions',2,'To Do','High'),('Applicable tax or deductions',2,'To Do','High');
