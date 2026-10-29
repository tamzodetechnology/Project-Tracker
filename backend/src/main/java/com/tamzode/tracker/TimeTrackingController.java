package com.tamzode.tracker;

import java.time.Duration;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@RestController
@RequestMapping("/api")
public class TimeTrackingController {
    private final JdbcTemplate db;

    public TimeTrackingController(JdbcTemplate db) { this.db = db; }

    record TimerStart(@NotNull Long projectId, Long taskId, @Size(max = 1000) String notes) {}
    record ManualEntry(@NotNull Long projectId, Long taskId, @NotNull OffsetDateTime startedAt,
                       @NotNull OffsetDateTime endedAt, @Size(max = 1000) String notes) {}

    @GetMapping("/time/timer")
    Map<String, Object> timer() {
        return db.queryForList("""
            SELECT id, project_id AS \"projectId\", task_id AS \"taskId\", status,
              started_at AS \"startedAt\", current_started_at AS \"currentStartedAt\",
              elapsed_seconds + CASE WHEN status='Running' THEN floor(extract(epoch from (now()-current_started_at)))::bigint ELSE 0 END AS \"elapsedSeconds\",
              notes
            FROM timer_sessions WHERE status IN ('Running','Paused') ORDER BY id DESC LIMIT 1
            """).stream().findFirst().orElse(Map.of("status", "Stopped", "elapsedSeconds", 0L));
    }

    @PostMapping("/time/timer/start")
    @Transactional
    Map<String, Object> start(@Valid @RequestBody TimerStart input) {
        requireProject(input.projectId());
        requireTaskInProject(input.taskId(), input.projectId());
        if (db.queryForObject("SELECT count(*) FROM timer_sessions WHERE status IN ('Running','Paused')", Integer.class) > 0)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A timer is already active. Stop it before starting another.");
        db.update("INSERT INTO timer_sessions(project_id,task_id,status,current_started_at,notes) VALUES(?,?,'Running',now(),?)",
            input.projectId(), input.taskId(), input.notes());
        long id = db.queryForObject("SELECT currval(pg_get_serial_sequence('timer_sessions','id'))", Long.class);
        log("started", id, "Timer started");
        return timer();
    }

    @PostMapping("/time/timer/pause")
    @Transactional
    Map<String, Object> pause() {
        int changed = db.update("UPDATE timer_sessions SET elapsed_seconds=elapsed_seconds+floor(extract(epoch from(now()-current_started_at)))::bigint,status='Paused',current_started_at=NULL WHERE status='Running'");
        if (changed == 0) throw new ResponseStatusException(HttpStatus.CONFLICT, "There is no running timer to pause.");
        log("paused", currentSessionId(), "Timer paused");
        return timer();
    }

    @PostMapping("/time/timer/resume")
    @Transactional
    Map<String, Object> resume() {
        int changed = db.update("UPDATE timer_sessions SET status='Running',current_started_at=now() WHERE status='Paused'");
        if (changed == 0) throw new ResponseStatusException(HttpStatus.CONFLICT, "There is no paused timer to resume.");
        log("resumed", currentSessionId(), "Timer resumed");
        return timer();
    }

    @PostMapping("/time/timer/stop")
    @Transactional
    Map<String, Object> stop() {
        Map<String, Object> session = db.queryForList("SELECT * FROM timer_sessions WHERE status IN ('Running','Paused') ORDER BY id DESC LIMIT 1 FOR UPDATE")
            .stream().findFirst().orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "There is no active timer to stop."));
        long id = ((Number) session.get("id")).longValue();
        boolean running = "Running".equals(session.get("status"));
        long elapsed = ((Number) session.get("elapsed_seconds")).longValue();
        if (running) elapsed += db.queryForObject("SELECT floor(extract(epoch from(now()-current_started_at)))::bigint FROM timer_sessions WHERE id=?", Long.class, id);
        if (elapsed <= 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Track at least one second before stopping the timer.");
        db.update("UPDATE timer_sessions SET status='Stopped',stopped_at=now(),elapsed_seconds=?,current_started_at=NULL WHERE id=?", elapsed, id);
        db.update("INSERT INTO time_entries(project_id,task_id,started_at,ended_at,duration_seconds,notes,source_session_id) VALUES(?,?,?,now(),?,?,?)",
            session.get("project_id"), session.get("task_id"), session.get("started_at"), elapsed, session.get("notes"), id);
        log("stopped", id, "Timer stopped · " + elapsed + " seconds recorded");
        return db.queryForMap("SELECT id,project_id AS \"projectId\",task_id AS \"taskId\",started_at AS \"startedAt\",ended_at AS \"endedAt\",duration_seconds AS \"durationSeconds\",notes FROM time_entries WHERE source_session_id=?", id);
    }

    @GetMapping("/time/entries")
    List<Map<String, Object>> entries(@RequestParam(required=false) LocalDate from,
                                      @RequestParam(required=false) LocalDate to,
                                      @RequestParam(required=false) Long projectId) {
        LocalDate[] range = range(from, to);
        String filter = projectId == null ? "" : " AND e.project_id=?";
        Object[] args = projectId == null ? new Object[]{range[0], range[1]} : new Object[]{range[0], range[1], projectId};
        return db.queryForList("""
            SELECT e.id,e.project_id AS \"projectId\",p.name AS \"projectName\",e.task_id AS \"taskId\",t.title AS \"taskTitle\",
              e.started_at AS \"startedAt\",e.ended_at AS \"endedAt\",e.duration_seconds AS \"durationSeconds\",e.notes
            FROM time_entries e JOIN projects p ON p.id=e.project_id LEFT JOIN tasks t ON t.id=e.task_id
            WHERE e.started_at >= ? AND e.started_at < (?::date + interval '1 day')
            """ + filter + " ORDER BY e.started_at DESC LIMIT 500", args);
    }

    @PostMapping("/time/entries")
    @Transactional
    Map<String, Object> createEntry(@Valid @RequestBody ManualEntry input) {
        requireProject(input.projectId());
        requireTaskInProject(input.taskId(), input.projectId());
        long duration = durationSeconds(input.startedAt(), input.endedAt());
        db.update("INSERT INTO time_entries(project_id,task_id,started_at,ended_at,duration_seconds,notes) VALUES(?,?,?,?,?,?)",
            input.projectId(), input.taskId(), input.startedAt(), input.endedAt(), duration, input.notes());
        long id = db.queryForObject("SELECT currval(pg_get_serial_sequence('time_entries','id'))", Long.class);
        log("created", id, "Manual time entry · " + duration + " seconds");
        return db.queryForMap("SELECT id,project_id AS \"projectId\",task_id AS \"taskId\",started_at AS \"startedAt\",ended_at AS \"endedAt\",duration_seconds AS \"durationSeconds\",notes FROM time_entries WHERE id=?", id);
    }

    @PutMapping("/time/entries/{id}")
    @Transactional
    Map<String, Object> updateEntry(@PathVariable long id, @Valid @RequestBody ManualEntry input) {
        requireProject(input.projectId());
        requireTaskInProject(input.taskId(), input.projectId());
        long duration = durationSeconds(input.startedAt(), input.endedAt());
        if (db.update("UPDATE time_entries SET project_id=?,task_id=?,started_at=?,ended_at=?,duration_seconds=?,notes=?,updated_at=now() WHERE id=?",
            input.projectId(), input.taskId(), input.startedAt(), input.endedAt(), duration, input.notes(), id) == 0)
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Time entry not found.");
        log("updated", id, "Manual time entry updated");
        return db.queryForMap("SELECT id,project_id AS \"projectId\",task_id AS \"taskId\",started_at AS \"startedAt\",ended_at AS \"endedAt\",duration_seconds AS \"durationSeconds\",notes FROM time_entries WHERE id=?", id);
    }

    @DeleteMapping("/time/entries/{id}")
    @Transactional
    Map<String, String> deleteEntry(@PathVariable long id) {
        if (db.update("DELETE FROM time_entries WHERE id=?", id) == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Time entry not found.");
        log("deleted", id, "Time entry deleted");
        return Map.of("message", "Time entry deleted");
    }

    @GetMapping("/reports/weekly-hours")
    List<Map<String, Object>> weeklyHours(@RequestParam(required=false) LocalDate from,
                                          @RequestParam(required=false) LocalDate to,
                                          @RequestParam(required=false) Long projectId) {
        LocalDate[] range = range(from, to);
        String filter = projectId == null ? "" : " AND project_id=?";
        Object[] args = projectId == null ? new Object[]{range[0], range[1]} : new Object[]{range[0], range[1], projectId};
        return db.queryForList("""
            SELECT d.day::date AS \"date\",coalesce(sum(e.duration_seconds),0)::bigint AS \"seconds\"
            FROM generate_series(?::date,?::date,interval '1 day') d(day)
            LEFT JOIN time_entries e ON e.started_at::date=d.day::date
            """ + filter + " GROUP BY d.day ORDER BY d.day", args);
    }

    @GetMapping("/reports/time-by-project")
    List<Map<String, Object>> timeByProject(@RequestParam(required=false) LocalDate from,
                                             @RequestParam(required=false) LocalDate to) {
        LocalDate[] range = range(from, to);
        return db.queryForList("""
            SELECT p.id AS \"projectId\",p.name AS \"projectName\",coalesce(sum(e.duration_seconds),0)::bigint AS \"seconds\"
            FROM projects p LEFT JOIN time_entries e ON e.project_id=p.id AND e.started_at >= ? AND e.started_at < (?::date + interval '1 day')
            WHERE p.status <> 'Archived' GROUP BY p.id ORDER BY sum(e.duration_seconds) DESC NULLS LAST
            """, range[0], range[1]);
    }

    @GetMapping("/reports/task-status")
    List<Map<String, Object>> taskStatus() {
        return db.queryForList("""
            SELECT t.status,count(*)::int AS count FROM tasks t
            WHERE t.status <> 'Cancelled' AND NOT EXISTS (SELECT 1 FROM tasks child WHERE child.parent_task_id=t.id)
            GROUP BY t.status ORDER BY t.status
            """);
    }

    @GetMapping("/reports/completed-trend")
    List<Map<String, Object>> completedTrend(@RequestParam(required=false) LocalDate from,
                                              @RequestParam(required=false) LocalDate to) {
        LocalDate[] range = range(from, to);
        return db.queryForList("""
            SELECT d.day::date AS \"date\",count(t.id)::int AS count
            FROM generate_series(?::date,?::date,interval '1 day') d(day)
            LEFT JOIN tasks t ON t.completed_at::date=d.day::date AND t.status='Done'
            GROUP BY d.day ORDER BY d.day
            """, range[0], range[1]);
    }

    @GetMapping(value="/reports/time-entries.csv", produces="text/csv")
    ResponseEntity<String> exportEntries(@RequestParam(required=false) LocalDate from,
                                         @RequestParam(required=false) LocalDate to,
                                         @RequestParam(required=false) Long projectId) {
        var rows = entries(from, to, projectId);
        StringBuilder csv = new StringBuilder("Date,Project,Task,Duration seconds,Notes\r\n");
        for (var row : rows) csv.append(csv(row.get("startedAt"))).append(',').append(csv(row.get("projectName"))).append(',')
            .append(csv(row.get("taskTitle"))).append(',').append(csv(row.get("durationSeconds"))).append(',').append(csv(row.get("notes"))).append("\r\n");
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=project-time-report.csv")
            .contentType(MediaType.parseMediaType("text/csv; charset=utf-8")).body(csv.toString());
    }

    static long durationSeconds(OffsetDateTime start, OffsetDateTime end) {
        if (start == null || end == null || !end.isAfter(start)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End time must be after start time.");
        long value = Duration.between(start, end).getSeconds();
        if (value <= 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Time entry must be at least one second.");
        return value;
    }

    private LocalDate[] range(LocalDate from, LocalDate to) {
        LocalDate end = to == null ? LocalDate.now() : to;
        LocalDate start = from == null ? end.with(java.time.DayOfWeek.MONDAY) : from;
        if (end.isBefore(start)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End date must be on or after start date.");
        if (Duration.between(start.atStartOfDay(), end.plusDays(1).atStartOfDay()).toDays() > 366)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Date range cannot exceed 366 days.");
        return new LocalDate[]{start, end};
    }

    private void requireProject(long id) {
        if (db.queryForObject("SELECT count(*) FROM projects WHERE id=?", Integer.class, id) == 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose an existing project.");
    }

    private void requireTaskInProject(Long taskId, long projectId) {
        if (taskId != null && db.queryForObject("SELECT count(*) FROM tasks WHERE id=? AND project_id=?", Integer.class, taskId, projectId) == 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The selected task does not belong to this project.");
    }

    private long currentSessionId() { return db.queryForObject("SELECT id FROM timer_sessions WHERE status IN ('Running','Paused') ORDER BY id DESC LIMIT 1", Long.class); }
    private void log(String action, long id, String detail) {
        db.update("INSERT INTO activity(action,entity_type,entity_id,entity_name,details) VALUES(?,?,?,?,?)", action, "time", id, "Time tracking", detail);
    }
    private static String csv(Object value) {
        String text = value == null ? "" : value.toString();
        return "\"" + text.replace("\"", "\"\"") + "\"";
    }
}
