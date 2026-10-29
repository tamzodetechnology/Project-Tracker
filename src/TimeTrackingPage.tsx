import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock3,
  Play,
  Pause,
  Square,
  Plus,
  Trash2,
  Download,
  Calendar,
  FolderKanban,
  CheckCircle2,
  Search,
  Sparkles,
} from 'lucide-react';
import type { Project, Task, TimeEntry, TimerState } from './types';
import { exportTimeEntriesCsv } from './mockData';
import './TimeTrackingPage.css';

interface TimeTrackingPageProps {
  projects: Project[];
  tasks: Task[];
  entries: TimeEntry[];
  timer: TimerState;
  setTimer: (t: TimerState) => void;
  reload: () => Promise<void>;
  notify: (s: string) => void;
  onTimerAction?: (action: 'start' | 'pause' | 'resume' | 'stop', payload?: any) => Promise<void>;
  onSaveManualEntry?: (entry: any) => Promise<void>;
  onDeleteEntry?: (entry: TimeEntry) => Promise<void>;
}

export function TimeTrackingPage({
  projects,
  tasks,
  entries,
  timer,
  setTimer,
  reload,
  notify,
  onTimerAction,
  onSaveManualEntry,
  onDeleteEntry,
}: TimeTrackingPageProps) {
  const [projectId, setProjectId] = useState<string>('');
  const [taskId, setTaskId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterProject, setSelectedFilterProject] = useState('All');
  const [tick, setTick] = useState(0);

  // Manual entry modal / state
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualProjectId, setManualProjectId] = useState<string>('');
  const [manualTaskId, setManualTaskId] = useState<string>('');
  const [manualMinutes, setManualMinutes] = useState<number>(45);
  const [manualNotes, setManualNotes] = useState<string>('');
  const [manualDate, setManualDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (timer.projectId) {
      setProjectId(String(timer.projectId));
    } else if (projects.length && !projectId) {
      setProjectId(String(projects[0].id));
    }
    if (timer.taskId) setTaskId(String(timer.taskId));
    if (timer.notes) setNotes(timer.notes);
  }, [timer.id, projects]);

  useEffect(() => {
    if (timer.status !== 'Running') return;
    const interval = window.setInterval(() => setTick((v) => v + 1), 1000);
    return () => window.clearInterval(interval);
  }, [timer.status]);

  // Compute live elapsed time
  const elapsed = useMemo(() => {
    let base = timer.elapsedSeconds || 0;
    if (timer.status === 'Running') {
      const startRef = timer.currentStartedAt || timer.startedAt;
      if (startRef) {
        const delta = Math.floor((Date.now() - new Date(startRef).getTime()) / 1000);
        if (delta > 0) base += delta;
      } else {
        base += tick;
      }
    }
    return base;
  }, [timer, tick]);

  const activeProject = projects.find((p) => p.id === Number(projectId));
  const projectTasks = tasks.filter((t) => t.projectId === Number(projectId) && t.status !== 'Cancelled');

  const formatClock = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  const fmtDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const handleTimerControl = async (action: 'start' | 'pause' | 'resume' | 'stop') => {
    if (onTimerAction) {
      const payload = {
        projectId: Number(projectId),
        taskId: taskId ? Number(taskId) : null,
        notes: notes || null,
      };
      await onTimerAction(action, payload);
    } else {
      // Local reactive fallback
      if (action === 'start') {
        setTimer({
          status: 'Running',
          projectId: Number(projectId),
          taskId: taskId ? Number(taskId) : undefined,
          notes,
          elapsedSeconds: 0,
          currentStartedAt: new Date().toISOString(),
          startedAt: new Date().toISOString(),
        });
        notify('Timer started');
      } else if (action === 'pause') {
        setTimer({
          ...timer,
          status: 'Paused',
          elapsedSeconds: elapsed,
          currentStartedAt: undefined,
        });
        notify('Timer paused');
      } else if (action === 'resume') {
        setTimer({
          ...timer,
          status: 'Running',
          currentStartedAt: new Date().toISOString(),
        });
        notify('Timer resumed');
      } else if (action === 'stop') {
        const selectedProj = projects.find((p) => p.id === (timer.projectId || Number(projectId)));
        const selectedTsk = tasks.find((t) => t.id === timer.taskId);
        if (elapsed > 10 && onSaveManualEntry) {
          await onSaveManualEntry({
            projectId: timer.projectId || Number(projectId),
            projectName: selectedProj?.name,
            taskId: timer.taskId,
            taskTitle: selectedTsk?.title,
            durationSeconds: elapsed,
            startedAt: timer.startedAt || new Date().toISOString(),
            endedAt: new Date().toISOString(),
            notes: notes || 'Focused work session',
          });
        }
        setTimer({ status: 'Stopped', elapsedSeconds: 0 });
        notify('Work session saved to history');
      }
    }
  };

  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    const proj = projects.find((p) => p.id === Number(manualProjectId || projectId));
    const tsk = tasks.find((t) => t.id === Number(manualTaskId));
    const seconds = manualMinutes * 60;
    const entryDate = new Date(`${manualDate}T12:00:00`);

    if (onSaveManualEntry) {
      await onSaveManualEntry({
        projectId: proj?.id || projects[0]?.id || 1,
        projectName: proj?.name || 'Project',
        taskId: tsk?.id,
        taskTitle: tsk?.title,
        durationSeconds: seconds,
        startedAt: new Date(entryDate.getTime() - seconds * 1000).toISOString(),
        endedAt: entryDate.toISOString(),
        notes: manualNotes || 'Manual time record',
      });
      notify('Manual time entry recorded');
      setShowManualModal(false);
      setManualNotes('');
      await reload();
    }
  };

  const handleDelete = async (entry: TimeEntry) => {
    if (!window.confirm('Delete this recorded time entry?')) return;
    if (onDeleteEntry) {
      await onDeleteEntry(entry);
      notify('Time entry deleted');
      await reload();
    }
  };

  // Stats computation
  const todayStr = new Date().toISOString().slice(0, 10);
  const todaySeconds = entries
    .filter((e) => e.startedAt.slice(0, 10) === todayStr)
    .reduce((sum, e) => sum + (e.durationSeconds || 0), 0);
  const totalTrackedSeconds = entries.reduce((sum, e) => sum + (e.durationSeconds || 0), 0);

  // Filtered entries
  const filteredEntries = entries.filter((e) => {
    const matchesProj = selectedFilterProject === 'All' || String(e.projectId) === selectedFilterProject;
    const matchesQuery =
      !searchQuery ||
      `${e.projectName || ''} ${e.taskTitle || ''} ${e.notes || ''}`.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProj && matchesQuery;
  });

  return (
    <div className="time-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">TIME & FOCUS</div>
          <h1>Time Tracking</h1>
          <p>Measure deep work, record billable sessions, and review project time distribution.</p>
        </div>
        <div className="heading-actions">
          <button className="button secondary" onClick={() => exportTimeEntriesCsv(entries)}>
            <Download size={15} /> Export CSV
          </button>
          <button className="button primary" onClick={() => setShowManualModal(true)}>
            <Plus size={15} /> Log manual time
          </button>
        </div>
      </div>

      <div className="time-hero-grid">
        {/* Main Timer Display */}
        <section className="timer-main-card">
          <div className="timer-header">
            <span className={`timer-status-pill ${timer.status === 'Running' ? 'is-running' : ''}`}>
              <i />
              {timer.status === 'Running' ? 'Timer Active' : timer.status === 'Paused' ? 'Timer Paused' : 'Ready'}
            </span>
            <span style={{ fontSize: 11, color: '#8da995', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={14} color="#72df00" /> Focus Mode
            </span>
          </div>

          <div className="timer-digits-wrap">
            <div className="timer-digits">{formatClock(elapsed)}</div>
            <div className="timer-subtext">
              {timer.status === 'Running'
                ? `Recording on ${activeProject?.name || 'Selected project'}...`
                : 'Choose project and task, then start session'}
            </div>

            <div className="timer-quick-adds">
              <button
                className="quick-chip"
                onClick={() => setTimer({ ...timer, elapsedSeconds: (timer.elapsedSeconds || 0) + 900 })}
              >
                +15m
              </button>
              <button
                className="quick-chip"
                onClick={() => setTimer({ ...timer, elapsedSeconds: (timer.elapsedSeconds || 0) + 1800 })}
              >
                +30m
              </button>
              <button
                className="quick-chip"
                onClick={() => setTimer({ ...timer, elapsedSeconds: (timer.elapsedSeconds || 0) + 3600 })}
              >
                +1h
              </button>
            </div>
          </div>

          <div className="timer-config-grid">
            <label className="timer-field">
              <span>Project</span>
              <select
                disabled={timer.status === 'Running' || timer.status === 'Paused'}
                value={projectId}
                onChange={(e) => {
                  setProjectId(e.target.value);
                  setTaskId('');
                }}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="timer-field">
              <span>Task (optional)</span>
              <select
                disabled={timer.status === 'Running' || timer.status === 'Paused'}
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
              >
                <option value="">General Project Focus</option>
                {projectTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="timer-field" style={{ marginTop: 12 }}>
            <span>Session Notes</span>
            <input
              placeholder="What are you currently accomplishing?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={timer.status === 'Running' || timer.status === 'Paused'}
            />
          </label>

          <div className="timer-buttons-row">
            {timer.status === 'Stopped' ? (
              <button className="timer-btn-primary" onClick={() => handleTimerControl('start')}>
                <Play size={18} /> Start Session
              </button>
            ) : (
              <>
                {timer.status === 'Running' ? (
                  <button className="timer-btn-secondary" onClick={() => handleTimerControl('pause')}>
                    <Pause size={17} /> Pause
                  </button>
                ) : (
                  <button className="timer-btn-primary" onClick={() => handleTimerControl('resume')}>
                    <Play size={17} /> Resume
                  </button>
                )}
                <button className="timer-btn-secondary" onClick={() => handleTimerControl('stop')}>
                  <Square size={16} /> Stop & Record
                </button>
              </>
            )}
          </div>
        </section>

        {/* Sidebar Summary */}
        <aside className="time-stats-card">
          <div className="time-stat-box">
            <div className="time-stat-label">
              <span>Today's Tracked Time</span>
              <Clock3 size={15} color="#72df00" />
            </div>
            <div className="time-stat-value">{fmtDuration(todaySeconds)}</div>
            <div className="time-stat-hint">Calculated from recorded sessions today</div>
          </div>

          <div className="time-stat-box">
            <div className="time-stat-label">
              <span>Total Workspace Investment</span>
              <CheckCircle2 size={15} color="#72df00" />
            </div>
            <div className="time-stat-value">{fmtDuration(totalTrackedSeconds)}</div>
            <div className="time-stat-hint">{entries.length} total recorded entries</div>
          </div>

          <div className="time-stat-box">
            <div className="time-stat-label">
              <span>Active Projects Tracked</span>
              <FolderKanban size={15} color="#72df00" />
            </div>
            <div className="time-stat-value">{projects.length}</div>
            <div className="time-stat-hint">Available for immediate logging</div>
          </div>
        </aside>
      </div>

      {/* Time Entries Table / Log */}
      <section className="time-log-panel">
        <div className="time-log-toolbar">
          <div>
            <h2 style={{ margin: 0, fontSize: 16, color: '#f0fbf2', fontWeight: 700 }}>Recorded Sessions</h2>
            <p style={{ margin: '3px 0 0', fontSize: 11, color: '#8ca794' }}>
              Detailed breakdown of past tracked focus intervals
            </p>
          </div>

          <div className="time-log-actions">
            <div className="time-log-search">
              <Search size={15} />
              <input
                placeholder="Search notes or tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              style={{
                height: 38,
                background: '#09170f',
                border: '1px solid #1c3c26',
                borderRadius: 9,
                color: '#dceee0',
                padding: '0 12px',
                fontSize: 12,
              }}
              value={selectedFilterProject}
              onChange={(e) => setSelectedFilterProject(e.target.value)}
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

        {filteredEntries.length === 0 ? (
          <div className="empty" style={{ margin: '20px 0' }}>
            <Clock3 size={24} color="#72df00" />
            <b>No time entries found</b>
            <p>Start a timer session above or log manual hours to see your focus log.</p>
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div className="time-entry-card" key={entry.id}>
              <div className="time-entry-left">
                <div className="time-entry-icon">
                  <Clock3 size={17} />
                </div>
                <div className="time-entry-details">
                  <div className="time-entry-title">{entry.taskTitle || entry.projectName || 'Focus Session'}</div>
                  <div className="time-entry-meta">
                    <span>
                      <FolderKanban size={12} /> {entry.projectName}
                    </span>
                    <span>•</span>
                    <span>
                      <Calendar size={12} /> {new Date(entry.startedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    {entry.notes && (
                      <>
                        <span>•</span>
                        <span style={{ color: '#b5ccba' }}>{entry.notes}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="time-duration-chip">{fmtDuration(entry.durationSeconds)}</span>
                <button
                  className="delete-entry-btn"
                  title="Delete entry"
                  onClick={() => handleDelete(entry)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Manual Entry Modal */}
      {showManualModal && (
        <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && setShowManualModal(false)}>
          <div className="modal" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <div>
                <span className="eyebrow">MANUAL RECORD</span>
                <h2>Log Past Work</h2>
              </div>
              <button className="icon-button" onClick={() => setShowManualModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManual}>
              <label className="field">
                <span>Project</span>
                <select
                  required
                  value={manualProjectId || projectId}
                  onChange={(e) => {
                    setManualProjectId(e.target.value);
                    setManualTaskId('');
                  }}
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Task (optional)</span>
                <select value={manualTaskId} onChange={(e) => setManualTaskId(e.target.value)}>
                  <option value="">General Project Work</option>
                  {tasks
                    .filter((t) => t.projectId === Number(manualProjectId || projectId))
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                </select>
              </label>

              <div className="form-row">
                <label className="field">
                  <span>Date</span>
                  <input type="date" value={manualDate} onChange={(e) => setManualDate(e.target.value)} required />
                </label>
                <label className="field">
                  <span>Duration (Minutes)</span>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={manualMinutes}
                    onChange={(e) => setManualMinutes(Number(e.target.value))}
                    required
                  />
                </label>
              </div>

              <label className="field">
                <span>Session Summary</span>
                <textarea
                  placeholder="Key deliverables and milestones worked on..."
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                />
              </label>

              <div className="form-actions">
                <button type="button" className="button secondary" onClick={() => setShowManualModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="button primary">
                  Save Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
