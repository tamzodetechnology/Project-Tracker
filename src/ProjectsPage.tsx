import { useMemo, useState } from 'react';
import {
  FolderKanban,
  CheckCircle2,
  CalendarDays,
  Plus,
  Search,
  Grid2X2,
  List,
  SquareKanban,
  ArrowRight,
  TrendingUp,
  Clock,
  Edit2,
  Trash2,
} from 'lucide-react';
import type { Project, Task, Milestone, Stage, Status } from './types';
import './ProjectsPage.css';

interface ProjectsPageProps {
  projects: Project[];
  tasks: Task[];
  milestones: Milestone[];
  onCreate: () => void;
  onOpen: (p: Project) => void;
  onEdit: (p: Project) => void;
  onDelete: (p: Project) => void;
  onStatus: (p: Project, s: Status) => void;
  onStage: (p: Project, s: Stage) => void;
}

export function ProjectsPage({
  projects,
  tasks,
  milestones,
  onCreate,
  onOpen,
  onEdit,
  onDelete,
  onStatus,
  onStage,
}: ProjectsPageProps) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [view, setView] = useState<'Grid' | 'List' | 'Board'>('Grid');

  const todayStr = new Date().toISOString().slice(0, 10);
  const weekAhead = new Date();
  weekAhead.setDate(weekAhead.getDate() + 7);
  const weekAheadStr = weekAhead.toISOString().slice(0, 10);

  const categories = useMemo(() => {
    return Array.from(new Set(projects.map((p) => p.category).filter(Boolean))).sort();
  }, [projects]);

  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) => p.status === 'In Progress').length;
    const dueSoon = projects.filter(
      (p) => p.deadline && p.deadline >= todayStr && p.deadline <= weekAheadStr && !['Completed', 'Archived'].includes(p.status)
    ).length;
    const completed = projects.filter((p) => p.status === 'Completed').length;
    return { total, active, dueSoon, completed };
  }, [projects, todayStr, weekAheadStr]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        `${p.name} ${p.description || ''} ${p.category || ''} ${p.technology || ''}`.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [projects, query, statusFilter, categoryFilter]);

  const getTaskSummary = (projectId: number) => {
    const projTasks = tasks.filter((t) => t.projectId === projectId && t.status !== 'Cancelled');
    const done = projTasks.filter((t) => t.status === 'Done').length;
    const projMilestones = milestones.filter((m) => m.projectId === projectId).length;
    return { done, total: projTasks.length, milestones: projMilestones };
  };

  return (
    <div className="projects-page">
      {/* Header */}
      <div className="projects-page-heading">
        <div>
          <div className="eyebrow">PORTFOLIO & WORKSPACE HUB</div>
          <h1>Projects</h1>
          <p>Strategic delivery initiatives, development roadmaps, and execution tracking.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="button primary" onClick={onCreate}>
            <Plus size={15} /> New Project
          </button>
        </div>
      </div>

      {/* 4 KPI Metrics */}
      <div className="projects-metrics">
        <div className="projects-metric-card" onClick={() => setStatusFilter('All')}>
          <div className="projects-metric-top">
            <span>Total Projects</span>
            <FolderKanban size={16} color="#72df00" />
          </div>
          <div className="projects-metric-value">{stats.total}</div>
          <div className="projects-metric-hint">
            <span className="dot" style={{ background: '#72df00' }} /> Across personal portfolio
          </div>
        </div>

        <div className="projects-metric-card" onClick={() => setStatusFilter('In Progress')}>
          <div className="projects-metric-top">
            <span>Active & In Progress</span>
            <TrendingUp size={16} color="#8cff45" />
          </div>
          <div className="projects-metric-value" style={{ color: '#8cff45' }}>
            {stats.active}
          </div>
          <div className="projects-metric-hint">
            <span className="dot" style={{ background: '#8cff45' }} /> Moving forward now
          </div>
        </div>

        <div className="projects-metric-card">
          <div className="projects-metric-top">
            <span>Due Next 7 Days</span>
            <Clock size={16} color="#e5c158" />
          </div>
          <div className="projects-metric-value" style={{ color: '#e5c158' }}>
            {stats.dueSoon}
          </div>
          <div className="projects-metric-hint">
            <span className="dot" style={{ background: '#e5c158' }} /> Approaching deadlines
          </div>
        </div>

        <div className="projects-metric-card" onClick={() => setStatusFilter('Completed')}>
          <div className="projects-metric-top">
            <span>Completed Projects</span>
            <CheckCircle2 size={16} color="#46d69a" />
          </div>
          <div className="projects-metric-value" style={{ color: '#46d69a' }}>
            {stats.completed}
          </div>
          <div className="projects-metric-hint">
            <span className="dot" style={{ background: '#46d69a' }} /> Successfully delivered
          </div>
        </div>
      </div>

      {/* Filter and View Switcher Toolbar */}
      <div className="projects-toolbar">
        <div className="projects-filter-pills">
          {['All', 'In Progress', 'Planned', 'Completed', 'On Hold'].map((s) => (
            <button
              key={s}
              className={`project-filter-chip ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="projects-toolbar-right">
          <div className="projects-search-input">
            <Search size={15} />
            <input
              placeholder="Search projects or tech..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {categories.length > 0 && (
            <select
              style={{
                height: 38,
                background: '#09170f',
                border: '1px solid #1c3c26',
                borderRadius: 9,
                color: '#dceee0',
                padding: '0 10px',
                fontSize: 11,
              }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          <div className="projects-view-toggle">
            <button className={view === 'Grid' ? 'active' : ''} onClick={() => setView('Grid')} title="Grid View">
              <Grid2X2 size={14} /> Grid
            </button>
            <button className={view === 'List' ? 'active' : ''} onClick={() => setView('List')} title="List View">
              <List size={14} /> List
            </button>
            <button className={view === 'Board' ? 'active' : ''} onClick={() => setView('Board')} title="Kanban Board">
              <SquareKanban size={14} /> Board
            </button>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {view === 'Grid' && (
        <div className="portfolio-grid">
          {filteredProjects.length === 0 ? (
            <div className="empty" style={{ gridColumn: '1 / -1', margin: '30px 0' }}>
              <FolderKanban size={26} color="#72df00" />
              <b>No projects found</b>
              <p>Try clearing your filters or create a new project to start tracking.</p>
              <button className="button primary" onClick={onCreate}>
                <Plus size={15} /> Create Project
              </button>
            </div>
          ) : (
            filteredProjects.map((p) => {
              const summary = getTaskSummary(p.id);
              const progressPct = Math.max(0, Math.min(100, p.progress || 0));

              return (
                <article className="portfolio-card-item" key={p.id}>
                  <div>
                    <div className="portfolio-card-head">
                      <div className="portfolio-symbol-wrap">
                        <FolderKanban size={18} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className={`status-badge ${p.status.toLowerCase().replace(' ', '-')}`}>
                          <i />
                          {p.status}
                        </span>
                        <button
                          className="icon-button"
                          style={{ width: 28, height: 28 }}
                          onClick={() => onEdit(p)}
                          title="Edit project"
                        >
                          <Edit2 size={13} />
                        </button>
                      </div>
                    </div>

                    <button className="portfolio-card-title" onClick={() => onOpen(p)}>
                      {p.name}
                    </button>
                    <p className="portfolio-card-desc">{p.description || p.category || 'Active initiative'}</p>

                    <div className="portfolio-card-tags">
                      {p.category && <span className="portfolio-tag">{p.category}</span>}
                      {p.technology && (
                        <span className="portfolio-tag" style={{ color: '#8cff45', borderColor: '#23522c' }}>
                          {p.technology.split(',')[0]}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    {/* Stage Selector */}
                    <div className="portfolio-stage-select-row">
                      <span>Stage</span>
                      <select
                        value={p.currentStage || 'Planning'}
                        onChange={(e) => onStage(p, e.target.value as Stage)}
                      >
                        {['Planning', 'Design', 'Development', 'Testing', 'Deployment', 'Completed'].map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Progress Bar */}
                    <div className="portfolio-progress-bar-wrap">
                      <div className="portfolio-progress-text">
                        <span>Progress</span>
                        <b>{progressPct}%</b>
                      </div>
                      <div className="portfolio-progress-track">
                        <div className="portfolio-progress-fill" style={{ width: `${progressPct}%` }} />
                      </div>
                    </div>

                    {/* Task and Deadline Foot */}
                    <div className="portfolio-card-foot">
                      <span>
                        <CheckCircle2 size={13} color="#72df00" /> {summary.done}/{summary.total} tasks
                      </span>
                      <span>
                        <CalendarDays size={13} />
                        {p.deadline
                          ? new Date(`${p.deadline}T00:00:00`).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'No deadline'}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="portfolio-card-actions">
                      <button className="portfolio-btn-open" onClick={() => onOpen(p)}>
                        Workspace <ArrowRight size={13} />
                      </button>
                      <button
                        className="portfolio-btn-secondary"
                        onClick={() => onStatus(p, p.status === 'Archived' ? 'Planned' : 'Archived')}
                      >
                        {p.status === 'Archived' ? 'Restore' : 'Archive'}
                      </button>
                      <button
                        className="portfolio-btn-secondary"
                        style={{ color: '#ff9090', maxWidth: 40 }}
                        onClick={() => onDelete(p)}
                        title="Delete project"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}

      {/* List View */}
      {view === 'List' && (
        <div style={{ display: 'grid', gap: 10 }}>
          {filteredProjects.map((p) => (
            <div
              key={p.id}
              className="time-entry-card"
              style={{ cursor: 'pointer' }}
              onClick={() => onOpen(p)}
            >
              <div className="time-entry-left">
                <div className="time-entry-icon">
                  <FolderKanban size={17} />
                </div>
                <div className="time-entry-details">
                  <div className="time-entry-title">{p.name}</div>
                  <div className="time-entry-meta">
                    <span>{p.category}</span>
                    <span>•</span>
                    <span>{p.currentStage || 'Planning'}</span>
                    <span>•</span>
                    <span>{p.progress || 0}% complete</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className={`status-badge ${p.status.toLowerCase().replace(' ', '-')}`}>
                  <i />
                  {p.status}
                </span>
                <button
                  className="button secondary"
                  style={{ height: 32, fontSize: 11 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpen(p);
                  }}
                >
                  Open <ArrowRight size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Kanban Board View */}
      {view === 'Board' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(220px, 1fr))', gap: 14, overflowX: 'auto' }}>
          {(['Planned', 'In Progress', 'On Hold', 'Completed'] as const).map((colStatus) => {
            const colProjects = filteredProjects.filter((p) => p.status === colStatus);
            return (
              <div
                key={colStatus}
                style={{
                  background: 'linear-gradient(145deg, #0d2117 0%, #07130e 100%)',
                  border: '1px solid #1f4229',
                  borderRadius: 14,
                  padding: 16,
                  minHeight: 350,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <b style={{ fontSize: 13, color: '#f0fff2' }}>{colStatus}</b>
                  <span className="priority-count">{colProjects.length}</span>
                </div>

                <div style={{ display: 'grid', gap: 10 }}>
                  {colProjects.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        background: '#09180f',
                        border: '1px solid #1c3c26',
                        borderRadius: 10,
                        padding: 14,
                        cursor: 'pointer',
                      }}
                      onClick={() => onOpen(p)}
                    >
                      <b style={{ fontSize: 13, color: '#edf6ee', display: 'block' }}>{p.name}</b>
                      <small style={{ color: '#8ca593', fontSize: 11, display: 'block', margin: '4px 0 10px' }}>
                        {p.category || 'Initiative'}
                      </small>
                      <div className="portfolio-progress-track">
                        <div className="portfolio-progress-fill" style={{ width: `${p.progress || 0}%` }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 10, color: '#8da995' }}>
                        <span>{p.currentStage || 'Stage'}</span>
                        <b>{p.progress || 0}%</b>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
