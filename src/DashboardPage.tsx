import React from 'react';
import {
  FolderKanban,
  CheckCircle2,
  ListTodo,
  Clock3,
  AlertCircle,
  Plus,
  ArrowRight,
  CalendarDays,
  Sparkles,
  TrendingUp,
  Circle,
  Check,
  FileText,
  Play,
} from 'lucide-react';
import dashboardHero from './assets/dashboard-hero.png';
import type { Project, Task, ActivityItem, WorkspaceMetrics, ChartDayItem, ChartProjectItem, ChartStatusItem, TaskStatus } from './types';
import './DashboardPage.css';

interface DashboardPageProps {
  projects: Project[];
  tasks: Task[];
  activities: ActivityItem[];
  metrics: WorkspaceMetrics;
  weeklyHours: ChartDayItem[];
  timeByProject: ChartProjectItem[];
  taskStatus: ChartStatusItem[];
  onTask: () => void;
  onProject: () => void;
  onUpdate: () => void;
  onPage: (p: string) => void;
  onTaskStatus: (status: string) => void;
  changeStatus: (t: Task, s: TaskStatus) => void;
}

export function DashboardPage({
  projects,
  tasks,
  activities,
  metrics,
  weeklyHours,
  timeByProject: _timeByProject,
  taskStatus,
  onTask,
  onProject,
  onUpdate,
  onPage,
  onTaskStatus,
  changeStatus,
}: DashboardPageProps) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const todayDateFormatted = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const featuredProject =
    projects.find((p) => p.status === 'In Progress') ||
    projects.find((p) => p.status === 'Planned') ||
    projects.find((p) => p.status === 'On Hold') ||
    projects[0];

  const todayStr = new Date().toISOString().slice(0, 10);
  const weekAhead = new Date();
  weekAhead.setDate(weekAhead.getDate() + 7);
  const weekAheadStr = weekAhead.toISOString().slice(0, 10);

  const dueSoon = tasks
    .filter((t) => !['Done', 'Cancelled'].includes(t.status) && t.dueDate && t.dueDate >= todayStr && t.dueDate <= weekAheadStr)
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
    .slice(0, 4);

  const highPriority = tasks
    .filter((t) => ['High', 'Urgent', 'Critical'].includes(t.priority) && !['Done', 'Cancelled'].includes(t.status))
    .slice(0, 4);

  const totalTasks = metrics.completed + metrics.pending;
  const completionRate = totalTasks > 0 ? Math.round((metrics.completed / totalTasks) * 100) : 0;

  const fmtDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  // Donut SVG calculations
  const totalStatusTasks = taskStatus.reduce((acc, curr) => acc + curr.count, 0);
  const circ = 2 * Math.PI * 39;
  let accumulatedOffset = 0;

  const statusColors: Record<string, string> = {
    Done: '#72df00',
    'In Progress': '#26ba7b',
    'To Do': '#627b5d',
    'In Review': '#9873d2',
    Blocked: '#e19a5b',
  };

  const maxWeeklyHours = Math.max(1, ...weeklyHours.map((d) => d.seconds || 0));

  return (
    <div className="dashboard-page">
      {/* Page Heading */}
      <div className="page-heading">
        <div>
          <div className="eyebrow">{todayDateFormatted.toUpperCase()}</div>
          <h1>{greeting}, Sureha</h1>
          <p>Your ideas in motion. Monitor project velocity, upcoming milestones, and focused deep work.</p>
        </div>
        <div className="heading-actions">
          <button className="button secondary" onClick={() => onPage('Time Tracking')}>
            <Play size={15} /> Start Focus Timer
          </button>
          <button className="button secondary" onClick={onTask}>
            <Plus size={15} /> Add Task
          </button>
          <button className="button primary" onClick={onProject}>
            <Plus size={15} /> New Project
          </button>
        </div>
      </div>

      {/* Hero Banner with Recolored Character Graphic */}
      <section className="dashboard-hero-banner">
        <div className="dashboard-hero-copy">
          <span className="dashboard-hero-eyebrow">
            <Sparkles size={13} /> Tamzode Personal Workspace
          </span>
          <h2 className="dashboard-hero-title">Your projects, designed for progress.</h2>
          <p className="dashboard-hero-desc">
            Keep every milestone clear and in view. Track focused hours, review delivery timelines, and maintain forward momentum.
          </p>

          <div className="dashboard-hero-actions">
            <button className="button primary" onClick={() => onPage('Projects')}>
              Explore Projects <ArrowRight size={15} />
            </button>
            <button className="button secondary" onClick={onUpdate}>
              Write Daily Note <FileText size={15} />
            </button>
          </div>
        </div>

        <img className="dashboard-hero-art" src={dashboardHero} alt="Developer working in project tracker workspace" />
      </section>

      {/* 4 Primary KPI Cards */}
      <div className="dashboard-kpi-grid">
        <div className="dashboard-kpi-card" onClick={() => onPage('Projects')} style={{ cursor: 'pointer' }}>
          <div className="dashboard-kpi-top">
            <span>Total Projects</span>
            <FolderKanban size={16} color="#72df00" />
          </div>
          <div className="dashboard-kpi-value">{metrics.total}</div>
          <div className="dashboard-kpi-hint">
            <span className="dot" style={{ background: '#72df00' }} />
            {metrics.active} active in progress
          </div>
        </div>

        <div className="dashboard-kpi-card" onClick={() => onPage('My Tasks')} style={{ cursor: 'pointer' }}>
          <div className="dashboard-kpi-top">
            <span>Task Completion</span>
            <CheckCircle2 size={16} color="#46d69a" />
          </div>
          <div className="dashboard-kpi-value" style={{ color: '#8cff45' }}>
            {completionRate}%
          </div>
          <div className="dashboard-kpi-hint">
            <span className="dot" style={{ background: '#46d69a' }} />
            {metrics.completed} of {totalTasks} leaf tasks done
          </div>
          <div className="dashboard-kpi-progress">
            <i style={{ width: `${completionRate}%` }} />
          </div>
        </div>

        <div className="dashboard-kpi-card" onClick={() => onPage('Time Tracking')} style={{ cursor: 'pointer' }}>
          <div className="dashboard-kpi-top">
            <span>Tracked Focus Time</span>
            <Clock3 size={16} color="#72df00" />
          </div>
          <div className="dashboard-kpi-value">{fmtDuration(metrics.totalTimeSeconds || 0)}</div>
          <div className="dashboard-kpi-hint">
            <span className="dot" style={{ background: '#72df00' }} />
            Across all focus sessions
          </div>
        </div>

        <div className="dashboard-kpi-card" onClick={() => onPage('Calendar')} style={{ cursor: 'pointer' }}>
          <div className="dashboard-kpi-top">
            <span>Overdue Work</span>
            <AlertCircle size={16} color={metrics.overdue > 0 ? '#ff8585' : '#72df00'} />
          </div>
          <div className="dashboard-kpi-value" style={{ color: metrics.overdue > 0 ? '#ff9185' : '#8cff45' }}>
            {metrics.overdue}
          </div>
          <div className="dashboard-kpi-hint">
            <span className="dot" style={{ background: metrics.overdue > 0 ? '#ff8585' : '#72df00' }} />
            {metrics.overdue > 0 ? 'Requires date adjustment' : 'All deadlines healthy'}
          </div>
        </div>
      </div>

      {/* Featured Focus Project */}
      {featuredProject && (
        <section className="dashboard-featured-card">
          <div className="dashboard-featured-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="eyebrow" style={{ color: '#72df00' }}>
                CURRENT FOCUS PROJECT
              </span>
              <span className={`status-badge ${featuredProject.status.toLowerCase().replace(' ', '-')}`}>
                <i />
                {featuredProject.status}
              </span>
            </div>
            <h2 className="dashboard-featured-title">{featuredProject.name}</h2>
            <p className="dashboard-featured-desc">{featuredProject.description || featuredProject.category}</p>

            <div className="dashboard-featured-meta">
              <span>
                <CalendarDays size={14} color="#72df00" />
                {featuredProject.deadline
                  ? `Target: ${new Date(`${featuredProject.deadline}T00:00:00`).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}`
                  : 'No deadline set'}
              </span>
              <span>•</span>
              <span>
                <ListTodo size={14} color="#72df00" />
                {featuredProject.completedTasks || 0} of {featuredProject.taskCount || 0} tasks completed
              </span>
            </div>

            <div style={{ marginTop: 16 }}>
              <button className="button primary" onClick={() => onPage('Projects')}>
                Open Project Workspace <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <div
            className="featured-progress-ring"
            style={{ '--progress': `${featuredProject.progress || 0}%` } as React.CSSProperties}
          >
            <div>
              <b>{featuredProject.progress || 0}%</b>
              <small>complete</small>
            </div>
          </div>
        </section>
      )}

      {/* Interactive Charts: Task Status & Weekly Hours */}
      <div className="dashboard-charts-grid">
        <section className="dashboard-chart-card">
          <div className="dashboard-chart-header">
            <div>
              <h2>Task Status Breakdown</h2>
              <p>Active workload distribution across all projects</p>
            </div>
            <button className="text-button" onClick={() => onPage('My Tasks')}>
              View all tasks <ArrowRight size={14} />
            </button>
          </div>

          <div className="donut-layout">
            <div className="donut-wrap">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="39" fill="none" stroke="#162414" strokeWidth="11" />
                {taskStatus
                  .filter((s) => s.count > 0)
                  .map((s) => {
                    const length = totalStatusTasks ? (circ * s.count) / totalStatusTasks : 0;
                    const offset = accumulatedOffset;
                    accumulatedOffset += length;
                    return (
                      <circle
                        key={s.status}
                        className="donut-segment"
                        cx="50"
                        cy="50"
                        r="39"
                        fill="none"
                        stroke={statusColors[s.status] || '#72df00'}
                        strokeWidth="11"
                        strokeDasharray={`${length} ${circ - length}`}
                        strokeDashoffset={-offset}
                        transform="rotate(-90 50 50)"
                        onClick={() => onTaskStatus(s.status)}
                      />
                    );
                  })}
              </svg>
              <div className="donut-center">
                <b>{totalStatusTasks}</b>
                <small>total tasks</small>
              </div>
            </div>

            <div className="chart-legend">
              {taskStatus.map((s) => (
                <button
                  key={s.status}
                  onClick={() => onTaskStatus(s.status)}
                  className="legend-item"
                  title={`Filter by ${s.status}`}
                >
                  <i style={{ background: statusColors[s.status] || '#72df00' }} />
                  <span>{s.status}</span>
                  <b>{s.count}</b>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="dashboard-chart-card">
          <div className="dashboard-chart-header">
            <div>
              <h2>Weekly Tracked Time</h2>
              <p>Daily focus hours recorded over the last 7 days</p>
            </div>
            <button className="text-button" onClick={() => onPage('Time Tracking')}>
              Open time log <ArrowRight size={14} />
            </button>
          </div>

          <div className="hours-chart">
            {weeklyHours.map((d) => {
              const dateObj = new Date(`${d.date}T00:00:00`);
              const hrs = d.seconds / 3600;
              const barHeight = maxWeeklyHours > 0 ? (d.seconds / maxWeeklyHours) * 100 : 0;
              return (
                <div
                  className="hours-day"
                  key={d.date}
                  title={`${dateObj.toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}: ${hrs.toFixed(1)} hrs`}
                >
                  <span className="hours-value">{hrs > 0 ? hrs.toFixed(1) : '0'}</span>
                  <div className="hours-track">
                    <i style={{ height: `${Math.max(5, barHeight)}%` }} />
                  </div>
                  <small>{dateObj.toLocaleDateString(undefined, { weekday: 'short' })}</small>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Two Column: Upcoming Deadlines & Priority Focus */}
      <div className="dashboard-two-col">
        {/* Deadlines */}
        <section className="dashboard-focus-panel">
          <div className="dashboard-chart-header">
            <div>
              <h2>Upcoming Deadlines</h2>
              <p>Checkpoints due in the next 7 days</p>
            </div>
            <button className="icon-button" onClick={() => onPage('Calendar')} title="Open Calendar">
              <CalendarDays size={17} color="#72df00" />
            </button>
          </div>

          {dueSoon.length === 0 ? (
            <div className="empty" style={{ minHeight: 140 }}>
              <CheckCircle2 size={24} color="#72df00" />
              <b>No deadlines approaching</b>
              <p>Your schedule is clear for the coming week.</p>
            </div>
          ) : (
            dueSoon.map((t) => (
              <div className="dashboard-item-row" key={t.id}>
                <button
                  className="task-check"
                  onClick={() => changeStatus(t, 'Done')}
                  title={`Mark "${t.title}" complete`}
                >
                  <Circle size={18} />
                </button>
                <div className="dashboard-item-copy">
                  <b>{t.title}</b>
                  <small>{t.projectName || 'Project'}</small>
                </div>
                <span className="date-pill">
                  <CalendarDays size={12} />
                  {new Date(`${t.dueDate}T00:00:00`).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            ))
          )}
        </section>

        {/* Priority Focus */}
        <section className="dashboard-focus-panel">
          <div className="dashboard-chart-header">
            <div>
              <h2>High Priority Focus</h2>
              <p>Tasks demanding immediate attention</p>
            </div>
            <span className="priority-count">{highPriority.length} open</span>
          </div>

          {highPriority.length === 0 ? (
            <div className="empty" style={{ minHeight: 140 }}>
              <TrendingUp size={24} color="#72df00" />
              <b>All high priority items clear</b>
              <p>Great job! No urgent or critical tasks pending.</p>
            </div>
          ) : (
            highPriority.map((t) => (
              <div className="dashboard-item-row" key={t.id}>
                <span className={`priority-dot ${t.priority.toLowerCase()}`} />
                <div className="dashboard-item-copy">
                  <b>{t.title}</b>
                  <small>
                    {t.projectName} · {t.status}
                  </small>
                </div>
                <span className={`priority-badge ${t.priority.toLowerCase()}`}>{t.priority}</span>
                <button
                  className="icon-button"
                  onClick={() => changeStatus(t, t.status === 'Done' ? 'To Do' : 'Done')}
                  title="Complete task"
                >
                  <Check size={14} />
                </button>
              </div>
            ))
          )}
        </section>
      </div>

      {/* Recent Activity Bar & Daily Note */}
      <div className="dashboard-two-col">
        <section className="dashboard-focus-panel">
          <div className="dashboard-chart-header">
            <div>
              <h2>Recent Activity</h2>
              <p>Latest changes across your workspace</p>
            </div>
            <button className="text-button" onClick={() => onPage('Activity History')}>
              View audit log <ArrowRight size={14} />
            </button>
          </div>

          {activities.slice(0, 4).map((a) => (
            <div className="dashboard-item-row" key={a.id}>
              <div className="time-entry-icon" style={{ width: 30, height: 30 }}>
                <CheckCircle2 size={15} color="#72df00" />
              </div>
              <div className="dashboard-item-copy">
                <b>
                  {a.action}: <span style={{ color: '#8cff45' }}>{a.entityName}</span>
                </b>
                {a.details && <small>{a.details}</small>}
              </div>
              <time style={{ fontSize: 10, color: '#7e9a86', whiteSpace: 'nowrap' }}>
                {new Date(a.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </time>
            </div>
          ))}
        </section>

        <section className="note-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="note-icon">
              <FileText size={18} />
            </div>
            <span className="eyebrow" style={{ color: '#72df00' }}>
              DAILY REFLECTION NOTE
            </span>
            <h3 style={{ fontSize: 17, margin: '8px 0 6px', color: '#f2fff4' }}>Capture Today’s Momentum</h3>
            <p style={{ fontSize: 12, color: '#9bb7a3', lineHeight: 1.6, maxWidth: 380 }}>
              Take 2 minutes to summarize what was delivered today, what blockers you faced, and your top priority for tomorrow.
            </p>
          </div>

          <div>
            <button className="button primary" onClick={onUpdate} style={{ marginTop: 14 }}>
              Write Daily Note <Plus size={15} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
