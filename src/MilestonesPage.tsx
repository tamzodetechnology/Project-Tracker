import React, { useState, useMemo } from 'react';
import {
  Flag,
  Plus,
  CheckCircle2,
  Clock,
  Calendar,
  FolderKanban,
  Edit2,
  Trash2,
  Search,
  Sparkles,
} from 'lucide-react';
import type { Milestone, Project } from './types';
import './MilestonesPage.css';

interface MilestonesPageProps {
  projects: Project[];
  milestones: Milestone[];
  reload: () => Promise<void>;
  notify: (s: string) => void;
  onSaveMilestone?: (milestone: Partial<Milestone>, id?: number) => Promise<void>;
  onDeleteMilestone?: (milestone: Milestone) => Promise<void>;
}

export function MilestonesPage({
  projects,
  milestones,
  reload,
  notify,
  onSaveMilestone,
  onDeleteMilestone,
}: MilestonesPageProps) {
  const [statusFilter, setStatusFilter] = useState<'All' | 'Planned' | 'In Progress' | 'Completed'>('All');
  const [projectFilter, setProjectFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [targetDate, setTargetDate] = useState('');
  const [status, setStatus] = useState<'Planned' | 'In Progress' | 'Completed'>('Planned');
  const [saving, setSaving] = useState(false);

  const openCreateModal = () => {
    setEditingMilestone(null);
    setName('');
    setDescription('');
    setProjectId(projects[0] ? String(projects[0].id) : '');
    setTargetDate('');
    setStatus('Planned');
    setModalOpen(true);
  };

  const openEditModal = (m: Milestone) => {
    setEditingMilestone(m);
    setName(m.name);
    setDescription(m.description || '');
    setProjectId(String(m.projectId));
    setTargetDate(m.targetDate || '');
    setStatus(m.status as any);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const proj = projects.find((p) => p.id === Number(projectId));
      const payload: Partial<Milestone> = {
        name,
        description,
        projectId: Number(projectId),
        projectName: proj?.name,
        targetDate: targetDate || undefined,
        status,
      };

      if (onSaveMilestone) {
        await onSaveMilestone(payload, editingMilestone ? editingMilestone.id : undefined);
      }
      notify(editingMilestone ? 'Milestone updated' : 'Milestone created');
      setModalOpen(false);
      await reload();
    } catch {
      notify('Failed to save milestone. Check connection.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (m: Milestone) => {
    if (!window.confirm(`Delete milestone "${m.name}"?`)) return;
    if (onDeleteMilestone) {
      await onDeleteMilestone(m);
      notify('Milestone deleted');
      await reload();
    }
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  const stats = useMemo(() => {
    const total = milestones.length;
    const completed = milestones.filter((m) => m.status === 'Completed').length;
    const inProgress = milestones.filter((m) => m.status === 'In Progress').length;
    const upcoming = milestones.filter((m) => m.status === 'Planned').length;
    return { total, completed, inProgress, upcoming };
  }, [milestones]);

  const filteredMilestones = useMemo(() => {
    return milestones.filter((m) => {
      const matchesStatus = statusFilter === 'All' || m.status === statusFilter;
      const matchesProj = projectFilter === 'All' || String(m.projectId) === projectFilter;
      const matchesQuery =
        !searchQuery ||
        `${m.name} ${m.description || ''} ${m.projectName || ''}`.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesProj && matchesQuery;
    });
  }, [milestones, statusFilter, projectFilter, searchQuery]);

  const getCountdownLabel = (dateStr?: string, statusVal?: string) => {
    if (statusVal === 'Completed') return { text: 'Achieved', overdue: false };
    if (!dateStr) return { text: 'No Target Date', overdue: false };

    const target = new Date(`${dateStr}T00:00:00`);
    const today = new Date(`${todayStr}T00:00:00`);
    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { text: 'Due Today', overdue: false };
    if (diffDays === 1) return { text: 'Due Tomorrow', overdue: false };
    if (diffDays > 1) return { text: `In ${diffDays} days`, overdue: false };
    return { text: `${Math.abs(diffDays)}d Overdue`, overdue: true };
  };

  return (
    <div className="milestones-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">STRATEGIC GOALS & RELEASES</div>
          <h1>Milestones</h1>
          <p>Track critical delivery checkpoints, version releases, and project completions.</p>
        </div>
        <div className="heading-actions">
          <button className="button primary" onClick={openCreateModal}>
            <Plus size={15} /> Add Milestone
          </button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="milestones-stats-row">
        <div className="milestone-stat-card">
          <span>
            Total Checkpoints <Flag size={15} color="#72df00" />
          </span>
          <b>{stats.total}</b>
        </div>
        <div className="milestone-stat-card">
          <span>
            Achieved & Delivered <CheckCircle2 size={15} color="#46d69a" />
          </span>
          <b style={{ color: '#68f29d' }}>{stats.completed}</b>
        </div>
        <div className="milestone-stat-card">
          <span>
            Active In Flight <Clock size={15} color="#72df00" />
          </span>
          <b style={{ color: '#8cff45' }}>{stats.inProgress}</b>
        </div>
        <div className="milestone-stat-card">
          <span>
            Upcoming Planned <Sparkles size={15} color="#90b8ff" />
          </span>
          <b style={{ color: '#90b8ff' }}>{stats.upcoming}</b>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="milestones-toolbar">
        <div className="milestones-filters">
          {(['All', 'In Progress', 'Planned', 'Completed'] as const).map((s) => (
            <button
              key={s}
              className={`milestones-filter-pill ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="time-log-search" style={{ width: 220 }}>
            <Search size={14} />
            <input
              placeholder="Search milestone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
              fontSize: 12,
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
        </div>
      </div>

      {/* Milestone Cards Timeline */}
      <div className="milestone-timeline-container">
        {filteredMilestones.length === 0 ? (
          <div className="empty" style={{ margin: '20px 0' }}>
            <Flag size={26} color="#72df00" />
            <b>No milestones found</b>
            <p>Create a checkpoint to mark significant project stages or release dates.</p>
          </div>
        ) : (
          filteredMilestones.map((m) => {
            const countdown = getCountdownLabel(m.targetDate, m.status);
            return (
              <div className="milestone-card-item" key={m.id}>
                <div className={`milestone-flag-wrap ${m.status === 'Completed' ? 'is-completed' : ''}`}>
                  {m.status === 'Completed' ? <CheckCircle2 size={20} /> : <Flag size={20} />}
                </div>

                <div className="milestone-main-info">
                  <div className="milestone-header-line">
                    <h3 className="milestone-title-text">{m.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`milestone-countdown ${countdown.overdue ? 'overdue' : ''}`}>
                        {countdown.text}
                      </span>
                      <span className={`status-badge ${m.status.toLowerCase().replace(' ', '-')}`}>
                        <i />
                        {m.status}
                      </span>
                    </div>
                  </div>

                  <div className="milestone-meta-row">
                    <span>
                      <FolderKanban size={13} color="#72df00" /> {m.projectName || 'Project'}
                    </span>
                    <span>•</span>
                    <span>
                      <Calendar size={13} /> Target:{' '}
                      {m.targetDate
                        ? new Date(`${m.targetDate}T00:00:00`).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'None'}
                    </span>
                  </div>

                  {m.description && <p className="milestone-desc-text">{m.description}</p>}
                </div>

                <div className="milestone-actions-col">
                  <button className="icon-button" title="Edit milestone" onClick={() => openEditModal(m)}>
                    <Edit2 size={15} />
                  </button>
                  <button className="icon-button" title="Delete milestone" onClick={() => handleDelete(m)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Milestone Modal */}
      {modalOpen && (
        <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div>
                <span className="eyebrow">{editingMilestone ? 'EDIT CHECKPOINT' : 'NEW MILESTONE'}</span>
                <h2>{editingMilestone ? 'Update Milestone' : 'Create Milestone'}</h2>
              </div>
              <button className="icon-button" onClick={() => setModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label className="field">
                <span>Milestone Name</span>
                <input
                  required
                  placeholder="e.g. Beta Release v1.0 or Cloud Cutover"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </label>

              <label className="field">
                <span>Linked Project</span>
                <select required value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="form-row">
                <label className="field">
                  <span>Target Date</span>
                  <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
                </label>
                <label className="field">
                  <span>Status</span>
                  <select value={status} onChange={(e) => setStatus(e.target.value as any)}>
                    <option value="Planned">Planned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </label>
              </div>

              <label className="field">
                <span>Key Deliverables / Description</span>
                <textarea
                  placeholder="Outline criteria required to consider this milestone complete..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>

              <div className="form-actions">
                <button type="button" className="button secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="button primary" disabled={saving}>
                  {saving ? 'Saving...' : editingMilestone ? 'Save Changes' : 'Create Milestone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
