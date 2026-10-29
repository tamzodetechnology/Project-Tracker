ALTER TABLE tasks ADD COLUMN milestone_id BIGINT REFERENCES milestones(id) ON DELETE SET NULL;
CREATE INDEX tasks_milestone_idx ON tasks(milestone_id);
CREATE INDEX activity_task_idx ON activity(entity_type, entity_id, created_at DESC);
