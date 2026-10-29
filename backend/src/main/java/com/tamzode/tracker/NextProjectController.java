package com.tamzode.tracker;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

@RestController
@RequestMapping("/api")
public class NextProjectController {
    private static final List<String> PREFERRED_PROJECTS = List.of(
        "Tamzode Technology Website", "Payroll Management System", "Eythu", "BillFlow AI");
    private static final List<String> DEFAULT_PHASES = List.of(
        "Requirements and planning", "Design and technical preparation", "Implementation",
        "Testing and validation", "Review and delivery");
    private final JdbcTemplate db;

    public NextProjectController(JdbcTemplate db) { this.db = db; }

    record ReadinessInput(boolean scopeConfirmed, boolean deliverablesDefined, boolean tasksReviewed,
                          boolean estimatesEntered, boolean timelineConfirmed, boolean risksReviewed,
                          boolean acceptanceCriteriaDefined) {}
    record PhaseInput(@NotBlank @Size(max=140) String name, String description, String status,
                       @Min(0) Integer position, LocalDate dueDate, String dependencies, String deliverables,
                      String acceptanceCriteria) {}
    record ReorderInput(@NotNull List<Long> phaseIds) {}
    record PlanningItemInput(@NotBlank @Size(max=180) String title, String description,
                             String kind, String status, LocalDate dueDate) {}

    @GetMapping("/next-project/recommendation")
    Map<String, Object> recommendation() {
        List<Map<String, Object>> projects = db.queryForList("""
            SELECT p.id,p.name,p.description,p.status,p.priority,p.current_stage AS \"currentStage\",
              p.start_date AS \"startDate\",p.deadline,p.progress_mode AS \"progressMode\",
              count(t.id) FILTER (WHERE t.status='Done' AND NOT EXISTS
                (SELECT 1 FROM tasks c WHERE c.parent_task_id=t.id))::int AS \"completedTasks\",
              count(t.id) FILTER (WHERE t.status NOT IN ('Cancelled') AND NOT EXISTS
                (SELECT 1 FROM tasks c WHERE c.parent_task_id=t.id))::int AS \"taskCount\",
              (SELECT count(*)::int FROM milestones m WHERE m.project_id=p.id AND m.status<>'Completed') AS \"openMilestones\",
              (SELECT min(m.target_date) FROM milestones m WHERE m.project_id=p.id AND m.status<>'Completed' AND m.target_date>=CURRENT_DATE) AS \"nextMilestoneDate\",
              (SELECT m.name FROM milestones m WHERE m.project_id=p.id AND m.status<>'Completed' AND m.target_date>=CURRENT_DATE ORDER BY m.target_date LIMIT 1) AS \"nextMilestone\",
              (SELECT coalesce(sum(e.duration_seconds),0)::bigint FROM time_entries e WHERE e.project_id=p.id) AS \"actualSeconds\",
              (SELECT coalesce(sum(t2.estimated_minutes),0)::int FROM tasks t2 WHERE t2.project_id=p.id AND t2.status<>'Cancelled') AS \"estimatedMinutes\"
            FROM projects p LEFT JOIN tasks t ON t.project_id=p.id
            WHERE p.status<>'Archived' GROUP BY p.id
            """);
        projects.sort(Comparator.comparingInt((Map<String,Object> p) -> preferredRank((String)p.get("name")))
            .thenComparing(p -> ((Number)p.get("id")).longValue()));
        LocalDate today = LocalDate.now();
        List<Map<String, Object>> candidates = db.queryForList("""
            SELECT t.id,t.title,t.project_id AS \"projectId\",p.name AS \"projectName\",t.status,t.priority,
              t.due_date AS \"dueDate\",t.estimated_minutes AS \"estimatedMinutes\"
            FROM tasks t JOIN projects p ON p.id=t.project_id
            WHERE t.status NOT IN ('Done','Cancelled','Blocked') AND p.status<>'Archived'
              AND NOT EXISTS (SELECT 1 FROM tasks c WHERE c.parent_task_id=t.id)
              AND (t.parent_task_id IS NULL OR EXISTS (SELECT 1 FROM tasks parent WHERE parent.id=t.parent_task_id AND parent.status='Done'))
            """);
        candidates.sort(Comparator
            .comparingInt((Map<String,Object> t) -> urgency(t, today))
            .thenComparing(t -> t.get("dueDate") == null ? LocalDate.MAX : (LocalDate)t.get("dueDate"))
            .thenComparingInt(t -> priorityRank((String)t.get("priority"))));
        Map<String, Object> nextTask = candidates.isEmpty() ? null : candidates.getFirst();
        Map<String, Object> project = nextTask == null
            ? projects.stream().filter(p -> Set.of("Planned","In Progress","On Hold").contains(p.get("status"))).findFirst().orElse(null)
            : projects.stream().filter(p -> p.get("id").equals(nextTask.get("projectId"))).findFirst().orElse(null);
        String reason = nextTask == null ? "No ready tasks are recorded. Review the roadmap and add a first task."
            : urgency(nextTask,today)==0 ? "This task is overdue and still open."
            : urgency(nextTask,today)==1 ? "This task is due today."
            : List.of("High","Urgent","Critical").contains(nextTask.get("priority")) ? "This open task has elevated priority."
            : "This is the next open task by due date and priority.";
        return Map.of("roadmap",projects,"recommendedProject",project==null?Map.of():project,
            "recommendedTask",nextTask==null?Map.of():nextTask,"reason",reason,
            "recommendationRule","Overdue → due today → priority → due date; blocked and completed tasks are excluded.");
    }

    @GetMapping("/projects/{projectId}/activity")
    List<Map<String,Object>> projectActivity(@PathVariable long projectId) {
        requireProject(projectId);
        return db.queryForList("""
            SELECT a.id,a.action,a.entity_type AS "entityType",a.entity_name AS "entityName",a.details,a.created_at AS "createdAt"
            FROM activity a
            WHERE (a.entity_type='project' AND a.entity_id=?)
               OR (a.entity_type='task' AND EXISTS (SELECT 1 FROM tasks t WHERE t.id=a.entity_id AND t.project_id=?))
               OR (a.entity_type='milestone' AND EXISTS (SELECT 1 FROM milestones m WHERE m.id=a.entity_id AND m.project_id=?))
               OR (a.entity_type='time' AND (EXISTS (SELECT 1 FROM timer_sessions ts WHERE ts.id=a.entity_id AND ts.project_id=?)
                 OR EXISTS (SELECT 1 FROM time_entries te WHERE te.id=a.entity_id AND te.project_id=?)))
            ORDER BY a.created_at DESC LIMIT 30
            """,projectId,projectId,projectId,projectId,projectId);
    }

    @GetMapping("/projects/{projectId}/planning")
    Map<String, Object> planning(@PathVariable long projectId) {
        requireProject(projectId);
        ensureReadiness(projectId);
        var readiness = db.queryForMap("SELECT project_id AS \"projectId\",scope_confirmed AS \"scopeConfirmed\",deliverables_defined AS \"deliverablesDefined\",tasks_reviewed AS \"tasksReviewed\",estimates_entered AS \"estimatesEntered\",timeline_confirmed AS \"timelineConfirmed\",risks_reviewed AS \"risksReviewed\",acceptance_criteria_defined AS \"acceptanceCriteriaDefined\",updated_at AS \"updatedAt\" FROM project_readiness WHERE project_id=?", projectId);
        var phases = db.queryForList("""
            SELECT ph.id,ph.project_id AS \"projectId\",ph.name,ph.description,ph.status,ph.position,
              ph.due_date AS \"dueDate\",ph.dependencies,ph.deliverables,ph.acceptance_criteria AS \"acceptanceCriteria\",
              count(t.id) FILTER(WHERE t.status<>'Cancelled' AND NOT EXISTS (SELECT 1 FROM tasks child WHERE child.parent_task_id=t.id))::int AS \"taskCount\",
              count(t.id) FILTER(WHERE t.status='Done' AND NOT EXISTS (SELECT 1 FROM tasks child WHERE child.parent_task_id=t.id))::int AS \"completedTasks\",
              coalesce(sum(t.estimated_minutes) FILTER(WHERE t.status<>'Cancelled' AND NOT EXISTS (SELECT 1 FROM tasks child WHERE child.parent_task_id=t.id)),0)::int AS \"estimatedMinutes\",
              coalesce((SELECT sum(e.duration_seconds) FROM time_entries e JOIN tasks tx ON tx.id=e.task_id WHERE tx.project_phase_id=ph.id),0)::bigint AS \"actualSeconds\"
            FROM project_phases ph LEFT JOIN tasks t ON t.project_phase_id=ph.id
            WHERE ph.project_id=? GROUP BY ph.id ORDER BY ph.position,ph.id
            """, projectId);
        var tasks = db.queryForList("""
            SELECT t.id,t.title,t.description,t.project_id AS \"projectId\",t.project_phase_id AS \"phaseId\",
              t.parent_task_id AS \"parentTaskId\",t.status,t.priority,t.start_date AS \"startDate\",
              t.due_date AS \"dueDate\",t.estimated_minutes AS \"estimatedMinutes\",
              coalesce((SELECT sum(e.duration_seconds) FROM time_entries e WHERE e.task_id=t.id),0)::bigint AS \"actualSeconds\"
            FROM tasks t WHERE t.project_id=? ORDER BY t.due_date NULLS LAST,t.created_at
            """, projectId);
        var milestones = db.queryForList("SELECT id,name,description,target_date AS \"targetDate\",status FROM milestones WHERE project_id=? ORDER BY target_date NULLS LAST,id", projectId);
        var items = db.queryForList("SELECT id,kind,title,description,status,due_date AS \"dueDate\",created_at AS \"createdAt\",resolved_at AS \"resolvedAt\" FROM project_planning_items WHERE project_id=? ORDER BY status,created_at DESC", projectId);
        var totals = db.queryForMap("""
            SELECT (SELECT coalesce(sum(t.estimated_minutes),0)::int FROM tasks t WHERE t.project_id=? AND t.status<>'Cancelled' AND NOT EXISTS (SELECT 1 FROM tasks child WHERE child.parent_task_id=t.id)) AS "estimatedMinutes",
              (SELECT coalesce(sum(e.duration_seconds),0)::bigint FROM time_entries e WHERE e.project_id=?) AS "actualSeconds",
              (SELECT count(*)::int FROM tasks q WHERE q.project_id=? AND q.status NOT IN ('Done','Cancelled') AND q.due_date<CURRENT_DATE AND NOT EXISTS (SELECT 1 FROM tasks child WHERE child.parent_task_id=q.id)) AS "overdueTasks"
            """, projectId, projectId, projectId);
        return Map.of("readiness", readiness, "phases", phases, "tasks", tasks, "milestones", milestones,
            "items", items, "totals", totals);
    }

    @PutMapping("/projects/{projectId}/readiness")
    @Transactional
    Map<String,Object> updateReadiness(@PathVariable long projectId, @Valid @RequestBody ReadinessInput input) {
        requireProject(projectId);
        ensureReadiness(projectId);
        db.update("""
            UPDATE project_readiness SET scope_confirmed=?,deliverables_defined=?,tasks_reviewed=?,estimates_entered=?,
              timeline_confirmed=?,risks_reviewed=?,acceptance_criteria_defined=?,updated_at=now() WHERE project_id=?
            """, input.scopeConfirmed(), input.deliverablesDefined(), input.tasksReviewed(), input.estimatesEntered(),
            input.timelineConfirmed(), input.risksReviewed(), input.acceptanceCriteriaDefined(), projectId);
        log(projectId,"readiness updated","Project readiness checklist updated");
        return db.queryForMap("SELECT scope_confirmed AS \"scopeConfirmed\",deliverables_defined AS \"deliverablesDefined\",tasks_reviewed AS \"tasksReviewed\",estimates_entered AS \"estimatesEntered\",timeline_confirmed AS \"timelineConfirmed\",risks_reviewed AS \"risksReviewed\",acceptance_criteria_defined AS \"acceptanceCriteriaDefined\",updated_at AS \"updatedAt\" FROM project_readiness WHERE project_id=?", projectId);
    }

    @PostMapping("/projects/{projectId}/plan")
    @Transactional
    List<Map<String,Object>> createPlan(@PathVariable long projectId) {
        requireProject(projectId);
        ensureReadiness(projectId);
        int existing = db.queryForObject("SELECT count(*) FROM project_phases WHERE project_id=?", Integer.class, projectId);
        if (existing == 0) {
            for (int i=0;i<DEFAULT_PHASES.size();i++) db.update(
                "INSERT INTO project_phases(project_id,name,description,position) VALUES(?,?,?,?)",
                projectId, DEFAULT_PHASES.get(i), "Suggested phase · add tasks, deliverables, and acceptance criteria as you plan.", i);
            log(projectId,"plan created","Suggested execution plan created; phases remain planned until updated.");
        }
        return phaseList(projectId);
    }

    @PostMapping("/projects/{projectId}/phases")
    @Transactional
    Map<String,Object> addPhase(@PathVariable long projectId, @Valid @RequestBody PhaseInput input) {
        requireProject(projectId);
        int position = input.position()==null ? db.queryForObject("SELECT coalesce(max(position),-1)+1 FROM project_phases WHERE project_id=?",Integer.class,projectId) : input.position();
        db.update("INSERT INTO project_phases(project_id,name,description,status,position,due_date,dependencies,deliverables,acceptance_criteria) VALUES(?,?,?,?,?,?,?,?,?)",
            projectId,input.name(),input.description(),phaseStatus(input.status()),position,input.dueDate(),input.dependencies(),input.deliverables(),input.acceptanceCriteria());
        long id=db.queryForObject("SELECT currval(pg_get_serial_sequence('project_phases','id'))",Long.class);
        log(projectId,"phase added","Execution phase added: "+input.name());
        return db.queryForMap("SELECT id,project_id AS \"projectId\",name,description,status,position,due_date AS \"dueDate\",dependencies,deliverables,acceptance_criteria AS \"acceptanceCriteria\" FROM project_phases WHERE id=?",id);
    }

    @PutMapping("/project-phases/{id}")
    @Transactional
    Map<String,Object> updatePhase(@PathVariable long id, @Valid @RequestBody PhaseInput input) {
        var before = phase(id);
        int position=input.position()==null?((Number)before.get("position")).intValue():input.position();
        db.update("UPDATE project_phases SET name=?,description=?,status=?,position=?,due_date=?,dependencies=?,deliverables=?,acceptance_criteria=?,updated_at=now() WHERE id=?",
            input.name(),input.description(),phaseStatus(input.status()),position,input.dueDate(),input.dependencies(),input.deliverables(),input.acceptanceCriteria(),id);
        log(((Number)before.get("projectId")).longValue(),"phase updated","Execution phase updated: "+input.name());
        return phase(id);
    }

    @DeleteMapping("/project-phases/{id}")
    @Transactional
    Map<String,String> deletePhase(@PathVariable long id) {
        var before=phase(id);
        db.update("DELETE FROM project_phases WHERE id=?",id);
        log(((Number)before.get("projectId")).longValue(),"phase deleted","Execution phase deleted: "+before.get("name"));
        return Map.of("message","Phase deleted; its tasks remain in the project without a phase.");
    }

    @PutMapping("/projects/{projectId}/phases/order")
    @Transactional
    List<Map<String,Object>> reorder(@PathVariable long projectId,@Valid @RequestBody ReorderInput input) {
        requireProject(projectId);
        var current=db.queryForList("SELECT id FROM project_phases WHERE project_id=?",Long.class,projectId);
        if(input.phaseIds().size()!=current.size()||!Set.copyOf(input.phaseIds()).equals(Set.copyOf(current)))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Include each phase belonging to the project exactly once.");
        for(int i=0;i<input.phaseIds().size();i++)db.update("UPDATE project_phases SET position=? WHERE id=?",10000+i,input.phaseIds().get(i));
        for(int i=0;i<input.phaseIds().size();i++)db.update("UPDATE project_phases SET position=?,updated_at=now() WHERE id=?",i,input.phaseIds().get(i));
        log(projectId,"plan reordered","Execution plan phases reordered");
        return phaseList(projectId);
    }

    @PostMapping("/projects/{projectId}/planning-items")
    @Transactional
    Map<String,Object> addPlanningItem(@PathVariable long projectId,@Valid @RequestBody PlanningItemInput input) {
        requireProject(projectId);
        String kind=allowed(input.kind(),Set.of("Risk","Blocker","Decision","External dependency"));
        String status=allowed(input.status()==null?"Open":input.status(),Set.of("Open","Resolved"));
        db.update("INSERT INTO project_planning_items(project_id,kind,title,description,status,due_date,resolved_at) VALUES(?,?,?,?,?,?,CASE WHEN ?='Resolved' THEN now() ELSE NULL END)",
            projectId,kind,input.title(),input.description(),status,input.dueDate(),status);
        long id=db.queryForObject("SELECT currval(pg_get_serial_sequence('project_planning_items','id'))",Long.class);
        log(projectId,"planning item added",kind+": "+input.title());
        return planningItem(id);
    }

    @PutMapping("/planning-items/{id}")
    @Transactional
    Map<String,Object> updatePlanningItem(@PathVariable long id,@Valid @RequestBody PlanningItemInput input) {
        var before=planningItem(id);
        String kind=allowed(input.kind(),Set.of("Risk","Blocker","Decision","External dependency"));
        String status=allowed(input.status()==null?"Open":input.status(),Set.of("Open","Resolved"));
        db.update("UPDATE project_planning_items SET kind=?,title=?,description=?,status=?,due_date=?,resolved_at=CASE WHEN ?='Resolved' THEN coalesce(resolved_at,now()) ELSE NULL END,updated_at=now() WHERE id=?",
            kind,input.title(),input.description(),status,input.dueDate(),status,id);
        log(((Number)before.get("projectId")).longValue(),"planning item updated",kind+": "+input.title());
        return planningItem(id);
    }

    @DeleteMapping("/planning-items/{id}")
    @Transactional
    Map<String,String> deletePlanningItem(@PathVariable long id) {
        var item=planningItem(id);
        db.update("DELETE FROM project_planning_items WHERE id=?",id);
        log(((Number)item.get("projectId")).longValue(),"planning item deleted","Planning item removed: "+item.get("title"));
        return Map.of("message","Planning item deleted");
    }

    private List<Map<String,Object>> phaseList(long projectId) {
        return db.queryForList("SELECT id,project_id AS \"projectId\",name,description,status,position,due_date AS \"dueDate\",dependencies,deliverables,acceptance_criteria AS \"acceptanceCriteria\" FROM project_phases WHERE project_id=? ORDER BY position,id",projectId);
    }
    private Map<String,Object> phase(long id) {
        return db.queryForList("SELECT id,project_id AS \"projectId\",name,position FROM project_phases WHERE id=?",id).stream().findFirst()
            .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Project phase not found."));
    }
    private Map<String,Object> planningItem(long id) {
        return db.queryForList("SELECT id,project_id AS \"projectId\",kind,title,description,status,due_date AS \"dueDate\",created_at AS \"createdAt\",resolved_at AS \"resolvedAt\" FROM project_planning_items WHERE id=?",id).stream().findFirst()
            .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Planning item not found."));
    }
    private void ensureReadiness(long projectId) {
        db.update("INSERT INTO project_readiness(project_id) VALUES(?) ON CONFLICT(project_id) DO NOTHING",projectId);
    }
    private void requireProject(long id) {
        if(db.queryForObject("SELECT count(*) FROM projects WHERE id=?",Integer.class,id)==0)
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Project not found.");
    }
    private String phaseStatus(String status) { return allowed(status==null?"Planned":status,Set.of("Planned","In Progress","Blocked","Completed")); }
    private String allowed(String value,Set<String> values) {
        if(value==null||!values.contains(value))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid planning value.");
        return value;
    }
    private int preferredRank(String name) { int i=PREFERRED_PROJECTS.indexOf(name);return i<0?PREFERRED_PROJECTS.size():i; }
    private int priorityRank(String priority) { return switch(priority){case "Critical"->0;case "Urgent"->1;case "High"->2;case "Medium"->3;default->4;}; }
    private int urgency(Map<String,Object> task,LocalDate today) {
        Object due=task.get("dueDate");
        if(due instanceof LocalDate date&&date.isBefore(today))return 0;
        if(due instanceof LocalDate date&&date.isEqual(today))return 1;
        if(List.of("High","Urgent","Critical").contains(task.get("priority")))return 2;
        return 3;
    }
    private void log(long projectId,String action,String detail) {
        String name=db.queryForObject("SELECT name FROM projects WHERE id=?",String.class,projectId);
        db.update("INSERT INTO activity(action,entity_type,entity_id,entity_name,details) VALUES(?,?,?,?,?)",action,"project",projectId,name,detail);
    }
}
