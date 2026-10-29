import { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  Flag,
  List,
  ListTodo,
  Plus,
  Search,
  Sparkles,
} from 'lucide-react';
import type { Task, Milestone, Project } from './types';
import './CalendarPage.css';

interface CalendarPageProps {
  tasks: Task[];
  milestones: Milestone[];
  projects: Project[];
  date: Date;
  setDate: (d: Date) => void;
  onCreateTask: () => void;
  onViewTasks: () => void;
}

type CalendarView = 'Month' | 'Week' | 'Agenda';

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const todayKey = dayKey(new Date());

const dateLabel = (
  d: Date,
  options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
) => d.toLocaleDateString(undefined, options);

const asLocal = (s: string) => new Date(`${s.slice(0, 10)}T00:00:00`);

const monday = (d: Date) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const shift = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - shift);
  return x;
};

export function CalendarPage({
  tasks,
  milestones,
  projects,
  date,
  setDate,
  onCreateTask,
  onViewTasks,
}: CalendarPageProps) {
  const [view, setView] = useState<CalendarView>('Month');
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [projectFilter, setProjectFilter] = useState('All projects');
  const [query, setQuery] = useState('');

  const visibleTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          t.dueDate &&
          t.status !== 'Cancelled' &&
          (projectFilter === 'All projects' || String(t.projectId) === projectFilter) &&
          (!query ||
            `${t.title} ${t.description || ''} ${t.projectName || ''}`.toLowerCase().includes(query.toLowerCase()))
      ),
    [tasks, projectFilter, query]
  );

  const visibleMilestones = useMemo(
    () =>
      milestones.filter(
        (m) =>
          m.targetDate &&
          (projectFilter === 'All projects' || String(m.projectId) === projectFilter) &&
          (!query ||
            `${m.name} ${m.description || ''} ${m.projectName || ''}`.toLowerCase().includes(query.toLowerCase()))
      ),
    [milestones, projectFilter, query]
  );

  const getItems = (key: string) => [
    ...visibleTasks
      .filter((t) => t.dueDate === key)
      .map((t) => ({
        type: 'task' as const,
        id: t.id,
        title: t.title,
        projectName: t.projectName || 'Project',
        status: t.status,
        priority: t.priority,
        description: t.description || '',
      })),
    ...visibleMilestones
      .filter((m) => m.targetDate === key)
      .map((m) => ({
        type: 'milestone' as const,
        id: m.id,
        title: m.name,
        projectName: m.projectName || 'Project',
        status: m.status,
        priority: '',
        description: m.description || '',
      })),
  ];

  const selectedItems = getItems(selectedDate);
  const now = asLocal(todayKey);
  const plusWeek = new Date(now);
  plusWeek.setDate(plusWeek.getDate() + 7);

  const dueToday = visibleTasks.filter((t) => t.dueDate === todayKey && t.status !== 'Done').length;
  const overdue = visibleTasks.filter((t) => t.dueDate! < todayKey && t.status !== 'Done').length;
  const weekCount = visibleTasks.filter(
    (t) => t.dueDate! >= todayKey && t.dueDate! <= dayKey(plusWeek) && t.status !== 'Done'
  ).length;

  const monthPrefix = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const milestoneMonth = visibleMilestones.filter((m) => m.targetDate?.startsWith(monthPrefix)).length;

  const step = (delta: number) => {
    if (view === 'Week') {
      const next = new Date(date);
      next.setDate(next.getDate() + delta * 7);
      setDate(next);
      setSelectedDate(dayKey(next));
    } else {
      const next = new Date(date.getFullYear(), date.getMonth() + delta, 1);
      setDate(next);
      setSelectedDate(dayKey(next));
    }
  };

  const jumpToToday = () => {
    const d = new Date();
    setDate(d);
    setSelectedDate(todayKey);
  };

  const statusLabel = (s: string) => (s === 'Done' ? 'Complete' : s === 'To Do' ? 'Pending' : s);

  const monthDates = () => {
    const first = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const offset = (first.getDay() + 6) % 7;
    const total = Math.ceil((offset + lastDay) / 7) * 7;

    return Array.from({ length: total }, (_, i) => {
      const d = new Date(date.getFullYear(), date.getMonth(), i - offset + 1);
      return {
        date: d,
        key: dayKey(d),
        inMonth: d.getMonth() === date.getMonth(),
      };
    });
  };

  const weekDates = () =>
    Array.from({ length: 7 }, (_, i) => {
      const d = monday(date);
      d.setDate(d.getDate() + i);
      return {
        date: d,
        key: dayKey(d),
        inMonth: true,
      };
    });

  const gridDates = view === 'Week' ? weekDates() : monthDates();

  const agendaItems = useMemo(
    () =>
      [
        ...visibleTasks
          .filter((t) => t.dueDate)
          .map((t) => ({
            type: 'task' as const,
            id: t.id,
            title: t.title,
            projectName: t.projectName || 'Project',
            status: t.status,
            priority: t.priority,
            date: t.dueDate!,
            description: t.description || '',
          })),
        ...visibleMilestones
          .filter((m) => m.targetDate)
          .map((m) => ({
            type: 'milestone' as const,
            id: m.id,
            title: m.name,
            projectName: m.projectName || 'Project',
            status: m.status,
            priority: '',
            date: m.targetDate!,
            description: m.description || '',
          })),
      ]
        .filter((x) => x.date.startsWith(monthPrefix))
        .sort((a, b) => a.date.localeCompare(b.date) || (a.type === 'milestone' ? -1 : 1)),
    [visibleTasks, visibleMilestones, monthPrefix]
  );

  const upcomingItems = agendaItems.filter(
    (item) => item.date >= todayKey && !(item.type === 'task' && ['Done', 'Cancelled'].includes(item.status))
  );

  const openDay = (key: string) => {
    const next = asLocal(key);
    setDate(next);
    setSelectedDate(key);
  };

  return (
    <div className="calendar-page">
      {/* Page Header */}
      <div className="calendar-page-heading">
        <div>
          <div className="calendar-kicker">
            <Sparkles size={13} />
            <span>SCHEDULE & TIMELINE HUB</span>
          </div>
          <h1>Calendar</h1>
          <p>Task deadlines, sprint milestones, and project targets coordinated in one view.</p>
        </div>
        <div className="calendar-header-actions">
          <button className="button secondary" onClick={onViewTasks}>
            <ListTodo size={15} /> View Tasks
          </button>
          <button className="button primary" onClick={onCreateTask}>
            <Plus size={15} /> Add Task
          </button>
        </div>
      </div>

      {/* 4 KPI Metrics */}
      <div className="calendar-metrics">
        <div className="calendar-metric-card" onClick={jumpToToday}>
          <div className="calendar-metric-top">
            <span>Due Today</span>
            <ListTodo size={16} color="#72df00" />
          </div>
          <div className="calendar-metric-value">{dueToday}</div>
          <div className="calendar-metric-hint">
            <span className="dot" style={{ background: '#72df00' }} /> Urgent tasks for today
          </div>
        </div>

        <div className="calendar-metric-card">
          <div className="calendar-metric-top">
            <span>Overdue Checkpoints</span>
            <AlertCircle size={16} color="#f0886e" />
          </div>
          <div className="calendar-metric-value" style={{ color: '#f0886e' }}>
            {overdue}
          </div>
          <div className="calendar-metric-hint">
            <span className="dot" style={{ background: '#f0886e' }} /> Past target deadline
          </div>
        </div>

        <div className="calendar-metric-card">
          <div className="calendar-metric-top">
            <span>Next 7 Days Workload</span>
            <Clock3 size={16} color="#8cff45" />
          </div>
          <div className="calendar-metric-value" style={{ color: '#8cff45' }}>
            {weekCount}
          </div>
          <div className="calendar-metric-hint">
            <span className="dot" style={{ background: '#8cff45' }} /> Open tasks this week
          </div>
        </div>

        <div className="calendar-metric-card">
          <div className="calendar-metric-top">
            <span>Milestones This Month</span>
            <Flag size={16} color="#e5c158" />
          </div>
          <div className="calendar-metric-value" style={{ color: '#e5c158' }}>
            {milestoneMonth}
          </div>
          <div className="calendar-metric-hint">
            <span className="dot" style={{ background: '#e5c158' }} /> Major target checkpoints
          </div>
        </div>
      </div>

      {/* Focus Banner */}
      <section className="calendar-focus-banner">
        <div className="calendar-focus-copy">
          <div className="calendar-focus-eyebrow">
            <Sparkles size={13} />
            <span>YOUR NEXT KEY CHECKPOINT</span>
          </div>
          {upcomingItems.length ? (
            <>
              <h2>{upcomingItems[0].title}</h2>
              <p>
                <b>{upcomingItems[0].projectName}</b>
                <span className="sep-bullet">•</span>
                <span>
                  {upcomingItems[0].type === 'milestone'
                    ? 'Major Project Milestone'
                    : `${upcomingItems[0].priority} Priority Task`}
                </span>
                <span className="sep-bullet">•</span>
                <span className="focus-due-date">
                  Due {dateLabel(asLocal(upcomingItems[0].date), { month: 'short', day: 'numeric' })}
                </span>
              </p>
              <button className="calendar-focus-btn" onClick={() => openDay(upcomingItems[0].date)}>
                Jump to {dateLabel(asLocal(upcomingItems[0].date), { month: 'short', day: 'numeric' })}{' '}
                <ArrowRight size={14} />
              </button>
            </>
          ) : (
            <>
              <h2>Your schedule is clean and clear</h2>
              <p>No immediate upcoming deadlines. Add tasks or project milestones to plan ahead.</p>
              <button className="calendar-focus-btn" onClick={onCreateTask}>
                Schedule a Task <Plus size={14} />
              </button>
            </>
          )}
        </div>

        <div className="calendar-focus-side">
          <span className="focus-side-month">
            {date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </span>
          <b className="focus-side-number">{upcomingItems.length}</b>
          <small className="focus-side-sub">Upcoming Checkpoints</small>
          <div className="calendar-focus-dots">
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
          <span className="focus-side-caption">One sprint at a time</span>
        </div>
      </section>

      {/* Search and Project Filter Toolbar */}
      <div className="calendar-toolbar-row">
        <div className="calendar-search-box">
          <Search size={15} />
          <input
            aria-label="Search calendar events"
            placeholder="Search tasks, milestones, or projects..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <select
          aria-label="Filter calendar by project"
          className="calendar-project-select"
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
        >
          <option>All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Workspace Grid and Day Agenda Sidebar */}
      <div className="calendar-workspace">
        <div className="calendar-main-panel">
          {/* Calendar Controls */}
          <div className="calendar-controls">
            <div className="calendar-nav-group">
              <button
                className="calendar-nav-arrow"
                onClick={() => step(-1)}
                aria-label={view === 'Week' ? 'Previous week' : 'Previous month'}
              >
                <ChevronLeft size={18} />
              </button>

              <div className="calendar-current-label">
                <span className="calendar-view-eyebrow">{view === 'Week' ? 'CURRENT WEEK' : 'MONTH VIEW'}</span>
                <h2>
                  {view === 'Week'
                    ? `${dateLabel(monday(date), { month: 'short', day: 'numeric' })} – ${dateLabel(
                        new Date(
                          monday(date).getFullYear(),
                          monday(date).getMonth(),
                          monday(date).getDate() + 6
                        ),
                        { month: 'short', day: 'numeric', year: 'numeric' }
                      )}`
                    : date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </h2>
              </div>

              <button
                className="calendar-nav-arrow"
                onClick={() => step(1)}
                aria-label={view === 'Week' ? 'Next week' : 'Next month'}
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="calendar-view-actions">
              <button className="calendar-today-pill" onClick={jumpToToday}>
                Today
              </button>

              <div className="calendar-view-toggle">
                {(['Month', 'Week', 'Agenda'] as const).map((v) => (
                  <button
                    key={v}
                    className={`calendar-view-chip ${view === v ? 'active' : ''}`}
                    onClick={() => setView(v)}
                  >
                    {v === 'Month' && <CalendarDays size={13} />}
                    {v === 'Week' && <Clock3 size={13} />}
                    {v === 'Agenda' && <List size={13} />}
                    <span>{v}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Agenda View */}
          {view === 'Agenda' ? (
            <div className="calendar-agenda-view">
              {agendaItems.length ? (
                agendaItems.map((item) => {
                  const itemDate = asLocal(item.date);
                  return (
                    <button
                      className="calendar-agenda-row"
                      key={`${item.type}-${item.id}`}
                      onClick={() => setSelectedDate(item.date)}
                    >
                      <div className="calendar-agenda-date">
                        <b>{itemDate.getDate()}</b>
                        <small>{itemDate.toLocaleDateString(undefined, { month: 'short', weekday: 'short' })}</small>
                      </div>

                      <div className={`calendar-agenda-icon ${item.type === 'milestone' ? 'milestone' : ''}`}>
                        {item.type === 'task' ? <ListTodo size={15} /> : <Flag size={15} />}
                      </div>

                      <div className="calendar-agenda-copy">
                        <div className="agenda-title-line">
                          <b>{item.title}</b>
                          {item.type === 'milestone' ? (
                            <span className="agenda-badge milestone-badge">Milestone</span>
                          ) : (
                            <span className={`agenda-badge priority-badge ${item.priority.toLowerCase()}`}>
                              {item.priority}
                            </span>
                          )}
                        </div>
                        <span className="agenda-project-line">
                          {item.projectName} • {item.type === 'task' ? statusLabel(item.status) : item.status}
                        </span>
                        {item.description && <p className="calendar-agenda-desc">{item.description}</p>}
                      </div>

                      <ArrowRight size={14} className="agenda-arrow" />
                    </button>
                  );
                })
              ) : (
                <div className="calendar-empty">
                  <CalendarDays size={28} color="#72df00" />
                  <b>No scheduled checkpoints this month</b>
                  <span>Add due dates to tasks or project milestones to plan ahead.</span>
                  <button className="button primary" onClick={onCreateTask} style={{ marginTop: 10 }}>
                    <Plus size={14} /> Add a Task
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Month / Week Grid View */
            <div className={`calendar-view-container ${view === 'Week' ? 'calendar-week-grid' : 'calendar-month-grid'}`}>
              <div className="calendar-weekdays-row">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                  <div className="calendar-weekday-col" key={d}>
                    <span>{d}</span>
                  </div>
                ))}
              </div>

              <div className="calendar-cells-matrix">
                {gridDates.map(({ date: d, key, inMonth }) => {
                  const items = getItems(key);
                  const isToday = key === todayKey;
                  const isSelected = key === selectedDate;

                  return (
                    <div
                      role="button"
                      tabIndex={0}
                      key={key}
                      className={`calendar-day-cell ${inMonth ? '' : 'outside-month'} ${
                        isToday ? 'is-today' : ''
                      } ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => setSelectedDate(key)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedDate(key);
                        }
                      }}
                      aria-label={`${dateLabel(d)}${items.length ? `, ${items.length} events` : ''}`}
                    >
                      <div className="calendar-cell-header">
                        <span className="calendar-cell-date-num">{d.getDate()}</span>
                        {items.length > 0 && (
                          <span className="calendar-cell-count-pill">{items.length}</span>
                        )}
                      </div>

                      <div className="calendar-cell-chips">
                        {items.slice(0, view === 'Week' ? 5 : 2).map((item) => (
                          <div
                            key={`${item.type}-${item.id}`}
                            className={`calendar-chip ${item.type === 'milestone' ? 'milestone' : ''} ${
                              item.status === 'Done' ? 'done' : ''
                            } priority-${item.priority.toLowerCase()}`}
                            title={`${item.title} • ${item.projectName}`}
                          >
                            <span className="chip-indicator" />
                            <span className="chip-title">{item.title}</span>
                          </div>
                        ))}

                        {items.length > (view === 'Week' ? 5 : 2) && (
                          <div className="calendar-more-pill">
                            +{items.length - (view === 'Week' ? 5 : 2)} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="calendar-legend">
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#72df00' }} />
              <span>Task Deadline</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#e5c158' }} />
              <span>Milestone</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot" style={{ background: '#4a6552' }} />
              <span>Completed</span>
            </div>
            <div className="legend-note">Click any day to inspect its details</div>
          </div>
        </div>

        {/* Day Agenda Sidebar */}
        <aside className="calendar-day-agenda">
          <div className="day-agenda-header">
            <span className="day-agenda-eyebrow">DAY AGENDA</span>
            <h2>{dateLabel(asLocal(selectedDate), { weekday: 'long', month: 'short', day: 'numeric' })}</h2>
            <p>
              {selectedDate === todayKey
                ? 'Your priority commitments for today'
                : selectedDate < todayKey
                ? 'Past activity archive'
                : 'Upcoming scheduled checkpoints'}
            </p>
          </div>

          {/* Daily Progress */}
          <div className="day-agenda-progress-block">
            <div className="day-agenda-progress-meta">
              <span>Day Completion</span>
              <b>
                {selectedItems.filter((x) => x.type === 'task' && x.status === 'Done').length} /{' '}
                {selectedItems.filter((x) => x.type === 'task').length} Tasks
              </b>
            </div>
            <div className="day-agenda-progress-track">
              <div
                className="day-agenda-progress-fill"
                style={{
                  width: `${
                    selectedItems.filter((x) => x.type === 'task').length
                      ? (selectedItems.filter((x) => x.type === 'task' && x.status === 'Done').length /
                          selectedItems.filter((x) => x.type === 'task').length) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          {/* Counts */}
          <div className="day-agenda-summary-chips">
            <span className="day-summary-chip">
              <b>{selectedItems.filter((x) => x.type === 'task').length}</b> Tasks
            </span>
            <span className="day-summary-chip">
              <b>{selectedItems.filter((x) => x.type === 'milestone').length}</b> Milestones
            </span>
          </div>

          {/* Item List */}
          <div className="day-agenda-items-list">
            {selectedItems.length ? (
              selectedItems.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className={`day-agenda-card ${item.type === 'milestone' ? 'milestone-card' : ''} ${
                    item.status === 'Done' ? 'done-card' : ''
                  }`}
                >
                  <div className="day-agenda-card-icon">
                    {item.type === 'task' ? <ListTodo size={15} /> : <Flag size={15} />}
                  </div>

                  <div className="day-agenda-card-body">
                    <b>{item.title}</b>
                    <small className="day-agenda-card-project">{item.projectName}</small>
                    {item.description && (
                      <p className="day-agenda-card-desc">{item.description}</p>
                    )}
                    <div className="day-agenda-card-meta">
                      {item.type === 'task' ? (
                        <>
                          <span className={`status-tag status-${item.status.toLowerCase().replace(/\s+/g, '-')}`}>
                            {statusLabel(item.status)}
                          </span>
                          {item.priority && (
                            <span className={`priority-tag priority-${item.priority.toLowerCase()}`}>
                              {item.priority}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="milestone-tag">Milestone • {item.status}</span>
                      )}
                    </div>
                  </div>

                  {item.type === 'task' && item.status === 'Done' && (
                    <CheckCircle2 size={16} color="#72df00" className="done-check" />
                  )}
                </div>
              ))
            ) : (
              <div className="day-agenda-empty">
                <Circle size={24} color="#355240" />
                <b>No items scheduled</b>
                <span>This day has no deadlines attached. You can assign a task or target milestone.</span>
                <button className="button secondary" onClick={onCreateTask} style={{ marginTop: 8 }}>
                  <Plus size={14} /> Schedule Task
                </button>
              </div>
            )}
          </div>

          <button className="day-agenda-full-link" onClick={onViewTasks}>
            <span>Explore all workspace tasks</span>
            <ArrowRight size={14} />
          </button>
        </aside>
      </div>
    </div>
  );
}
