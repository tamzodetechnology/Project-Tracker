import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Plus,
  Search,
  Grid2X2,
  List,
  CalendarDays,
  Edit2,
  Trash2,
  FolderKanban,
  Clock,
  AlertCircle,
  X,
  Sparkles,
} from 'lucide-react';
import type { Task, Project, Milestone, TaskStatus, Priority } from './types';
import './TasksPage.css';

interface TasksPageProps {
  tasks: Task[];
  projects: Project[];
  milestones: Milestone[];
  initialStatus: string;
  onCreate: () => void;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  changeStatus: (t: Task, s: TaskStatus) => void;
  timer: { status: string; taskId?: number; projectId?: number };
  reload: () => Promise<void>;
  notify: (s: string) => void;
}

export function TasksPage({
  tasks,
  projects,
  milestones: _milestones,
  initialStatus,
  onCreate,
  onEdit,
  onDelete,
  changeStatus,
  timer: _timer,
  reload: _reload,
  notify: _notify,
}: TasksPageProps) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus || 'All');
  const [projectFilter, setProjectFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [view, setView] = useState<'List' | 'Board'>('List');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);

  const stats = useMemo(() => {
    const nonCancelled = tasks.filter((t) => t.status !== 'Cancelled');
    const active = nonCancelled.filter((t) => t.status !== 'Done').length;
    const dueToday = nonCancelled.filter((t) => t.dueDate === todayStr && t.status !== 'Done').length;
    const overdue = nonCancelled.filter((t) => t.dueDate && t.dueDate < todayStr && t.status !== 'Done').length;
    const completed = nonCancelled.filter((t) => t.status === 'Done').length;
    return { active, dueToday, overdue, completed };
  }, [tasks, todayStr]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const q = query.trim().toLowerCase();
      const matchesQuery = !q || `${t.title} ${t.description || ''} ${t.projectName || ''}`.toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === 'All'
          ? true
          : statusFilter === 'Pending'
            ? ['To Do', 'In Review'].includes(t.status)
            : statusFilter === 'Due Today'
              ? t.dueDate === todayStr && t.status !== 'Done'
              : statusFilter === 'Overdue'
                ? t.dueDate && t.dueDate < todayStr && t.status !== 'Done'
                : t.status === statusFilter;
      const matchesProj = projectFilter === 'All' || String(t.projectId) === projectFilter;
      const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;

      return matchesQuery && matchesStatus && matchesProj && matchesPriority;
    });
  }, [tasks, query, statusFilter, projectFilter, priorityFilter, todayStr]);

  const getDueCountdown = (dueDate?: string, status?: string) => {
    if (status === 'Done') return { text: 'Done', overdue: false };
    if (!dueDate) return { text: 'No due date', overdue: false };

    const target = new Date(`${dueDate}T00:00:00`);
    const today = new Date(`${todayStr}T00:00:00`);
    const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === 0) return { text: 'Due Today', overdue: false };
    if (diff === 1) return { text: 'Due Tomorrow', overdue: false };
    if (diff > 1) return { text: `In ${diff} days`, overdue: false };
    return { text: `${Math.abs(diff)}d Overdue`, overdue: true };
  };

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case 'Critical':
      case 'Urgent':
        return '#f08656';
      case 'High':
        return '#e3b340';
      case 'Medium':
        return '#8cff45';
      case 'Low':
        return '#5dc886';
    }
  };

  return (
    <div className="mytasks-page">
      {/* Page Heading */}
      <div className="page-heading">
        <div>
          <div className="eyebrow">TASK MANAGEMENT & FOCUS LIST</div>
          <h1>My Tasks</h1>
          <p>Prioritize your day, track granular deliverables, and mark progress across all projects.</p>
        </div>
        <div className="heading-actions">
          <button className="button primary" onClick={onCreate}>
            <Plus size={15} /> Add Task
          </button>
        </div>
      </div>

      {/* 4 KPI Metrics */}
      <div className="mytasks-metrics-grid">
        <div className="mytasks-metric-card" onClick={() => setStatusFilter('All')}>
          <div className="mytasks-metric-top">
            <span>Total Active Tasks</span>
            <Sparkles size={16} color="#72df00" />
          </div>
          <div className="mytasks-metric-value">{stats.active}</div>
          <div className="mytasks-metric-hint">
            <span className="dot" style={{ background: '#72df00' }} /> Open across projects
          </div>
        </div>

        <div className="mytasks-metric-card" onClick={() => setStatusFilter('Due Today')}>
          <div className="mytasks-metric-top">
            <span>Due Today</span>
            <Clock size={16} color="#8cff45" />
          </div>
          <div className="mytasks-metric-value" style={{ color: '#8cff45' }}>
            {stats.dueToday}
          </div>
          <div className="mytasks-metric-hint">
            <span className="dot" style={{ background: '#8cff45' }} /> High priority today
          </div>
        </div>

        <div className="mytasks-metric-card" onClick={() => setStatusFilter('Overdue')}>
          <div className="mytasks-metric-top">
            <span>Overdue Tasks</span>
            <AlertCircle size={16} color={stats.overdue > 0 ? '#ff8585' : '#72df00'} />
          </div>
          <div className="mytasks-metric-value" style={{ color: stats.overdue > 0 ? '#ff9185' : '#8cff45' }}>
            {stats.overdue}
          </div>
          <div className="mytasks-metric-hint">
            <span className="dot" style={{ background: stats.overdue > 0 ? '#ff8585' : '#72df00' }} /> Needs date adjustment
          </div>
        </div>

        <div className="mytasks-metric-card" onClick={() => setStatusFilter('Done')}>
          <div className="mytasks-metric-top">
            <span>Delivered & Done</span>
            <CheckCircle2 size={16} color="#46d69a" />
          </div>
          <div className="mytasks-metric-value" style={{ color: '#46d69a' }}>
            {stats.completed}
          </div>
          <div className="mytasks-metric-hint">
            <span className="dot" style={{ background: '#46d69a' }} /> Marked completed
          </div>
        </div>
      </div>

      {/* Filter and View Switcher Toolbar */}
      <div className="mytasks-toolbar">
        <div className="mytasks-filter-pills">
          {['All', 'In Progress', 'To Do', 'In Review', 'Blocked', 'Done'].map((s) => (
            <button
              key={s}
              className={`task-filter-chip ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="mytasks-toolbar-right">
          <div className="time-log-search" style={{ width: 220 }}>
            <Search size={15} />
            <input
              placeholder="Search tasks..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <select
            style={{
              height: 38,
              background: '#09170f',
              border: '1px solid #1c3c26',
              borderRadius: 8,
              color: '#dceee0',
              padding: '0 10px',
              fontSize: 11,
            }}
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="All">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            style={{
              height: 38,
              background: '#09170f',
              border: '1px solid #1c3c26',
              borderRadius: 8,
              color: '#dceee0',
              padding: '0 10px',
              fontSize: 11,
            }}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="All">All Priorities</option>
            {['Critical', 'Urgent', 'High', 'Medium', 'Low'].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <div className="projects-view-toggle">
            <button className={view === 'List' ? 'active' : ''} onClick={() => setView('List')}>
              <List size={14} /> List
            </button>
            <button className={view === 'Board' ? 'active' : ''} onClick={() => setView('Board')}>
              <Grid2X2 size={14} /> Board
            </button>
          </div>
        </div>
      </div>

      {/* Task List View */}
      {view === 'List' && (
        <div className="mytasks-list-container">
          {filteredTasks.length === 0 ? (
            <div className="empty" style={{ margin: '30px 0' }}>
              <CheckCircle2 size={26} color="#72df00" />
              <b>No tasks match current filters</b>
              <p>Create a task to build momentum or clear your search filters.</p>
              <button className="button primary" onClick={onCreate}>
                <Plus size={15} /> Add Task
              </button>
            </div>
          ) : (
            filteredTasks.map((t) => {
              const countdown = getDueCountdown(t.dueDate, t.status);
              const isDone = t.status === 'Done';

              return (
                <div className="task-card-item" key={t.id}>
                  <div className="task-card-left">
                    <button
                      className={`task-check-circle ${isDone ? 'is-done' : ''}`}
                      onClick={() => changeStatus(t, isDone ? 'To Do' : 'Done')}
                      title={isDone ? 'Reopen task' : 'Mark complete'}
                    >
                      {isDone ? <CheckCircle2 size={20} color="#72df00" /> : <Circle size={20} />}
                    </button>

                    <div className="task-info-block">
                      <button
                        className={`task-headline-title ${isDone ? 'is-done' : ''}`}
                        onClick={() => setSelectedTask(t)}
                      >
                        {t.title}
                      </button>

                      <div className="task-sub-meta">
                        <span>
                          <FolderKanban size={13} color="#72df00" /> {t.projectName || 'Project'}
                        </span>
                        <span>•</span>
                        {t.assignee && (
                          <>
                            <span>{t.assignee}</span>
                            <span>•</span>
                          </>
                        )}
                        <span style={{ color: getPriorityColor(t.priority), fontWeight: 700 }}>
                          {t.priority} Priority
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="task-card-right">
                    <span className={`task-due-badge ${countdown.overdue ? 'overdue' : ''}`}>
                      <CalendarDays size={13} />
                      {countdown.text}
                    </span>

                    <span className={`status-badge ${t.status.toLowerCase().replace(' ', '-')}`}>
                      <i />
                      {t.status}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button
                        className="icon-button"
                        style={{ width: 30, height: 30 }}
                        title="Edit task"
                        onClick={() => onEdit(t)}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="icon-button"
                        style={{ width: 30, height: 30, color: '#ff8a8a' }}
                        title="Delete task"
                        onClick={() => onDelete(t)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Kanban Board View */}
      {view === 'Board' && (
        <div className="task-kanban-board">
          {(['To Do', 'In Progress', 'In Review', 'Done'] as const).map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col);
            return (
              <div className="task-kanban-col" key={col}>
                <div className="task-kanban-col-head">
                  <b>{col}</b>
                  <span className="priority-count">{colTasks.length}</span>
                </div>

                <div style={{ display: 'grid', gap: 10 }}>
                  {colTasks.map((t) => (
                    <div
                      className="task-kanban-card"
                      key={t.id}
                      onClick={() => setSelectedTask(t)}
                    >
                      <b style={{ fontSize: 13, color: '#f0fff2' }}>{t.title}</b>
                      <small style={{ color: '#8ea795', fontSize: 11 }}>{t.projectName}</small>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                        <span className={`priority-badge ${t.priority.toLowerCase()}`}>{t.priority}</span>
                        <select
                          style={{
                            height: 26,
                            background: '#0a160e',
                            border: '1px solid #1c3c26',
                            borderRadius: 6,
                            color: '#dceee0',
                            fontSize: 10,
                            padding: '0 4px',
                          }}
                          value={t.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => changeStatus(t, e.target.value as TaskStatus)}
                        >
                          {['To Do', 'In Progress', 'In Review', 'Blocked', 'Done'].map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Slide-out Task Detail Drawer */}
      {selectedTask && (
        <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && setSelectedTask(null)}>
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div>
                <span className="eyebrow">{selectedTask.projectName?.toUpperCase() || 'TASK DETAILS'}</span>
                <h2>{selectedTask.title}</h2>
              </div>
              <button className="icon-button" onClick={() => setSelectedTask(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: 14 }}>
              <p style={{ margin: 0, color: '#9bb5a3', fontSize: 13, lineHeight: 1.6 }}>
                {selectedTask.description || 'No description provided for this task.'}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="time-stat-box">
                  <span style={{ fontSize: 11, color: '#8da995' }}>Status</span>
                  <b style={{ fontSize: 14, color: '#8cff45', display: 'block', marginTop: 4 }}>
                    {selectedTask.status}
                  </b>
                </div>
                <div className="time-stat-box">
                  <span style={{ fontSize: 11, color: '#8da995' }}>Priority</span>
                  <b style={{ fontSize: 14, color: '#f0fff2', display: 'block', marginTop: 4 }}>
                    {selectedTask.priority}
                  </b>
                </div>
                <div className="time-stat-box">
                  <span style={{ fontSize: 11, color: '#8da995' }}>Due Date</span>
                  <b style={{ fontSize: 14, color: '#f0fff2', display: 'block', marginTop: 4 }}>
                    {selectedTask.dueDate
                      ? new Date(`${selectedTask.dueDate}T00:00:00`).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'None'}
                  </b>
                </div>
                <div className="time-stat-box">
                  <span style={{ fontSize: 11, color: '#8da995' }}>Assignee</span>
                  <b style={{ fontSize: 14, color: '#f0fff2', display: 'block', marginTop: 4 }}>
                    {selectedTask.assignee || 'Unassigned'}
                  </b>
                </div>
              </div>

              <div className="form-actions" style={{ marginTop: 12 }}>
                <button
                  className="button secondary"
                  onClick={() => {
                    const t = selectedTask;
                    setSelectedTask(null);
                    onEdit(t);
                  }}
                >
                  <Edit2 size={14} /> Edit Task
                </button>
                <button
                  className="button primary"
                  onClick={() => {
                    changeStatus(selectedTask, selectedTask.status === 'Done' ? 'To Do' : 'Done');
                    setSelectedTask(null);
                  }}
                >
                  {selectedTask.status === 'Done' ? 'Reopen Task' : 'Mark Done'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
