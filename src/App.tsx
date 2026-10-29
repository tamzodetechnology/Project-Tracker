import { useEffect, useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  BarChart3,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  Command,
  FileText,
  Flag,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  Menu,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  X,
} from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import dashboardHero from './assets/dashboard-hero.png';
import { ProjectWorkspacePage } from './ProjectWorkspacePage';
import { TasksPage } from './TasksPage';
import { ProjectsPage } from './ProjectsPage';
import { CalendarPage } from './CalendarPage';
import { TimeTrackingPage } from './TimeTrackingPage';
import { MilestonesPage } from './MilestonesPage';
import { ReportsPage } from './ReportsPage';
import { ActivityPage } from './ActivityPage';
import { SettingsPage } from './SettingsPage';

import type {
  Project,
  Task,
  Milestone,
  ActivityItem,
  TimeEntry,
  TimerState,
  WorkspaceMetrics,
  ChartDayItem,
  ChartProjectItem,
  ChartStatusItem,
  ChartTrendItem,
  TaskStatus,
  Status,
} from './types';

import {
  loadWorkspaceData,
  saveWorkspaceData,
  calculateWorkspaceMetrics,
  resetWorkspaceData,
  exportTimeEntriesCsv,
} from './mockData';
import type { WorkspaceData } from './mockData';

import './ProjectsPage.css';
import './TasksPage.css';
import './CalendarPage.css';
import './TimeTrackingPage.css';
import './MilestonesPage.css';
import './ReportsPage.css';
import './ActivityPage.css';
import './SettingsPage.css';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  timeout: 4000,
});

const nav = [
  ['Dashboard', LayoutDashboard],
  ['Projects', FolderKanban],
  ['My Tasks', ListTodo],
  ['Time Tracking', Timer],
  ['Milestones', Flag],
  ['Calendar', CalendarDays],
  ['Activity History', Activity],
  ['Reports', BarChart3],
  ['Settings & Backup', Settings],
] as const;

const colors = ['#81df28', '#26ba7b', '#a2c75a', '#46d0a3'];

function fmtDate(date?: string) {
  if (!date) return 'No deadline';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(`${date}T00:00:00`));
}

function fmtDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function App() {
  const initial = useMemo(() => loadWorkspaceData(), []);

  const [page, setPage] = useState('Dashboard');
  const [projects, setProjects] = useState<Project[]>(initial.projects);
  const [tasks, setTasks] = useState<Task[]>(initial.tasks);
  const [milestones, setMilestones] = useState<Milestone[]>(initial.milestones);
  const [activities, setActivities] = useState<ActivityItem[]>(initial.activities);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(initial.timeEntries);
  const [timer, setTimer] = useState<TimerState>(initial.timer || { status: 'Stopped', elapsedSeconds: 0 });
  const [workspaceInfo, setWorkspaceInfo] = useState({
    workspaceName: initial.workspaceName || 'Tamzode Technology',
    companyName: initial.companyName || 'Tamzode Tech Lab',
    userDisplayName: initial.userDisplayName || 'Sureha DJ',
  });

  const [weeklyHours, setWeeklyHours] = useState<ChartDayItem[]>([]);
  const [timeByProject, setTimeByProject] = useState<ChartProjectItem[]>([]);
  const [taskStatus, setTaskStatus] = useState<ChartStatusItem[]>([]);
  const [completedTrend, setCompletedTrend] = useState<ChartTrendItem[]>([]);
  const [metrics, setMetrics] = useState<WorkspaceMetrics>({
    total: initial.projects.length,
    active: 0,
    completed: 0,
    pending: 0,
    upcoming: 0,
    overdue: 0,
  });

  const [isOffline, setIsOffline] = useState(false);
  const [toast, setToast] = useState('');
  const [modal, setModal] = useState<'project' | 'task' | 'update' | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskProjectId, setTaskProjectId] = useState<number | undefined>();
  const [taskPhaseId, setTaskPhaseId] = useState<number | undefined>();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState('');
  const [calendar, setCalendar] = useState(new Date());
  const [taskStatusFilter, setTaskStatusFilter] = useState('All statuses');

  // Compute live analytics whenever projects, tasks, or timeEntries change
  useEffect(() => {
    const computed = calculateWorkspaceMetrics(projects, tasks, milestones, timeEntries);
    setMetrics(computed.metrics);
    setWeeklyHours(computed.weeklyHours);
    setTimeByProject(computed.timeByProject);
    setTaskStatus(computed.taskStatus);
    setCompletedTrend(computed.completedTrend);

    // Save to local storage for offline resilience
    saveWorkspaceData({
      projects,
      tasks,
      milestones,
      timeEntries,
      activities,
      timer,
      ...workspaceInfo,
    });
  }, [projects, tasks, milestones, timeEntries, activities, timer, workspaceInfo]);

  // Sync with backend API if available
  const reload = async () => {
    try {
      const [p, t, m, a, s, e, tm, w, tp, ts, ct] = await Promise.all([
        api.get('/projects'),
        api.get('/tasks?limit=500'),
        api.get('/milestones'),
        api.get('/activity?limit=200'),
        api.get('/dashboard'),
        api.get('/time/entries'),
        api.get('/time/timer'),
        api.get('/reports/weekly-hours'),
        api.get('/reports/time-by-project'),
        api.get('/reports/task-status'),
        api.get('/reports/completed-trend'),
      ]);

      setProjects(p.data);
      setTasks(t.data);
      setMilestones(m.data);
      setActivities(a.data);
      setMetrics(s.data);
      setTimeEntries(e.data);
      setTimer(tm.data);
      setWeeklyHours(w.data);
      setTimeByProject(tp.data);
      setTaskStatus(ts.data);
      setCompletedTrend(ct.data);
      setIsOffline(false);
    } catch {
      // Graceful fallback: stay in local mode without blocking the app
      setIsOffline(true);
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  useEffect(() => {
    if (toast) {
      const t = window.setTimeout(() => setToast(''), 3200);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const today = new Date();
  const weekAhead = new Date();
  today.setHours(0, 0, 0, 0);
  weekAhead.setDate(weekAhead.getDate() + 7);
  const localDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const todayKey = localDate(today);
  const weekKey = localDate(weekAhead);

  const dueSoon = tasks
    .filter((t) => !['Done', 'Cancelled'].includes(t.status) && t.dueDate && t.dueDate >= todayKey && t.dueDate <= weekKey)
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
    .slice(0, 4);

  const high = tasks
    .filter((t) => ['High', 'Urgent', 'Critical'].includes(t.priority) && !['Done', 'Cancelled'].includes(t.status))
    .slice(0, 3);

  // Mutations with optimistic local updates + backend sync
  const mutate = async (kind: 'project' | 'task' | 'update', data: any, id?: number) => {
    const nowIso = new Date().toISOString();

    if (kind === 'project') {
      if (id) {
        setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
        setActivities((prev) => [
          {
            id: Date.now(),
            action: 'Updated project',
            entityType: 'Project',
            entityName: data.name || 'Project',
            details: `Stage: ${data.currentStage || 'Updated'}`,
            createdAt: nowIso,
          },
          ...prev,
        ]);
      } else {
        const newProj: Project = {
          ...data,
          id: Date.now(),
          progress: 0,
          taskCount: 0,
          completedTasks: 0,
          milestoneCount: 0,
        };
        setProjects((prev) => [newProj, ...prev]);
        setActivities((prev) => [
          {
            id: Date.now(),
            action: 'Created project',
            entityType: 'Project',
            entityName: newProj.name,
            details: `Category: ${newProj.category || 'Workspace'}`,
            createdAt: nowIso,
          },
          ...prev,
        ]);
      }
    } else if (kind === 'task') {
      const proj = projects.find((p) => p.id === Number(data.projectId));
      if (id) {
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...data, projectName: proj?.name || t.projectName } : t)));
        setActivities((prev) => [
          {
            id: Date.now(),
            action: 'Updated task',
            entityType: 'Task',
            entityName: data.title || 'Task',
            details: `Status: ${data.status}`,
            createdAt: nowIso,
          },
          ...prev,
        ]);
      } else {
        const newTask: Task = {
          ...data,
          id: Date.now(),
          projectName: proj?.name || 'Project',
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        setTasks((prev) => [newTask, ...prev]);
        setProjects((prev) =>
          prev.map((p) => (p.id === newTask.projectId ? { ...p, taskCount: (p.taskCount || 0) + 1 } : p))
        );
        setActivities((prev) => [
          {
            id: Date.now(),
            action: 'Created task',
            entityType: 'Task',
            entityName: newTask.title,
            details: `Assigned to ${newTask.projectName}`,
            createdAt: nowIso,
          },
          ...prev,
        ]);
      }
    } else if (kind === 'update') {
      setActivities((prev) => [
        {
          id: Date.now(),
          action: 'Daily note logged',
          entityType: 'DailyUpdate',
          entityName: data.workedOn?.slice(0, 30) || 'Work progress',
          details: data.nextSteps ? `Next: ${data.nextSteps}` : undefined,
          createdAt: nowIso,
        },
        ...prev,
      ]);
    }

    if (!isOffline) {
      try {
        const url = kind === 'update' ? '/daily-updates' : `/${kind === 'project' ? 'projects' : 'tasks'}${id ? `/${id}` : ''}`;
        if (id) await api.put(url, data);
        else await api.post(url, data);
      } catch {
        // Fall back gracefully
      }
    }

    setModal(null);
    setEditingProject(null);
    setEditingTask(null);
    setTaskProjectId(undefined);
    setTaskPhaseId(undefined);
    setToast(kind === 'update' ? 'Progress note saved' : `${kind === 'project' ? 'Project' : 'Task'} ${id ? 'updated' : 'saved'} successfully`);
  };

  const changeStatus = async (t: Task, status: TaskStatus) => {
    const isNowDone = status === 'Done';
    const wasDone = t.status === 'Done';

    setTasks((prev) => prev.map((item) => (item.id === t.id ? { ...item, status } : item)));

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== t.projectId) return p;
        let completed = p.completedTasks || 0;
        if (isNowDone && !wasDone) completed++;
        if (!isNowDone && wasDone) completed = Math.max(0, completed - 1);
        const total = p.taskCount || 1;
        const progress = Math.round((completed / total) * 100);
        return { ...p, completedTasks: completed, progress };
      })
    );

    setActivities((prev) => [
      {
        id: Date.now(),
        action: isNowDone ? 'Completed task' : 'Task status changed',
        entityType: 'Task',
        entityName: t.title,
        details: `Moved to ${status} in ${t.projectName}`,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);

    if (!isOffline) {
      try {
        await api.patch(`/tasks/${t.id}/status`, { status });
      } catch {
        // Continue locally
      }
    }
    setToast('Task status updated');
  };

  const removeProject = async (p: Project) => {
    if (!window.confirm(`Delete “${p.name}” and its tasks? This action cannot be undone.`)) return;
    setProjects((prev) => prev.filter((item) => item.id !== p.id));
    setTasks((prev) => prev.filter((item) => item.projectId !== p.id));
    setMilestones((prev) => prev.filter((item) => item.projectId !== p.id));

    if (!isOffline) {
      try {
        await api.delete(`/projects/${p.id}`);
      } catch {
        // Ignore
      }
    }
    setToast('Project deleted');
  };

  const removeTask = async (t: Task) => {
    if (!window.confirm(`Delete “${t.title}”?`)) return;
    setTasks((prev) => prev.filter((item) => item.id !== t.id));
    setProjects((prev) =>
      prev.map((p) =>
        p.id === t.projectId
          ? {
              ...p,
              taskCount: Math.max(0, (p.taskCount || 1) - 1),
              completedTasks: t.status === 'Done' ? Math.max(0, (p.completedTasks || 1) - 1) : p.completedTasks,
            }
          : p
      )
    );

    if (!isOffline) {
      try {
        await api.delete(`/tasks/${t.id}`);
      } catch {
        // Ignore
      }
    }
    setToast('Task deleted');
  };

  const updateProject = async (p: Project, changes: Partial<Project>) => {
    setProjects((prev) => prev.map((item) => (item.id === p.id ? { ...item, ...changes } : item)));
    if (!isOffline) {
      try {
        await api.put(`/projects/${p.id}`, { ...p, ...changes });
      } catch {
        // Ignore
      }
    }
    setToast('Project updated');
  };

  // Time tracking handlers
  const handleTimerAction = async (action: 'start' | 'pause' | 'resume' | 'stop', payload?: any) => {
    if (!isOffline) {
      try {
        const response = await api.post(`/time/timer/${action}`, payload);
        setTimer(action === 'stop' ? { status: 'Stopped', elapsedSeconds: 0 } : response.data);
        await reload();
        setToast(action === 'stop' ? 'Time saved to your entries' : `Timer ${action}ed`);
        return;
      } catch {
        // Fall back locally
      }
    }

    // Local execution
    if (action === 'start') {
      setTimer({
        status: 'Running',
        projectId: payload?.projectId,
        taskId: payload?.taskId,
        notes: payload?.notes,
        elapsedSeconds: 0,
        currentStartedAt: new Date().toISOString(),
        startedAt: new Date().toISOString(),
      });
      setToast('Timer started');
    } else if (action === 'pause') {
      setTimer((prev) => ({ ...prev, status: 'Paused', currentStartedAt: undefined }));
      setToast('Timer paused');
    } else if (action === 'resume') {
      setTimer((prev) => ({ ...prev, status: 'Running', currentStartedAt: new Date().toISOString() }));
      setToast('Timer resumed');
    } else if (action === 'stop') {
      setTimer({ status: 'Stopped', elapsedSeconds: 0 });
      setToast('Work session saved');
    }
  };

  const handleSaveManualTime = async (entry: Partial<TimeEntry>) => {
    const newEntry: TimeEntry = {
      id: Date.now(),
      projectId: entry.projectId || 1,
      projectName: entry.projectName || 'Project',
      taskId: entry.taskId,
      taskTitle: entry.taskTitle,
      startedAt: entry.startedAt || new Date().toISOString(),
      endedAt: entry.endedAt || new Date().toISOString(),
      durationSeconds: entry.durationSeconds || 1800,
      notes: entry.notes,
    };
    setTimeEntries((prev) => [newEntry, ...prev]);
    setActivities((prev) => [
      {
        id: Date.now(),
        action: 'Logged time',
        entityType: 'TimeEntry',
        entityName: `${fmtDuration(newEntry.durationSeconds)} on ${newEntry.projectName}`,
        details: newEntry.notes,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);

    if (!isOffline) {
      try {
        await api.post('/time/entries', entry);
      } catch {
        // Ignore
      }
    }
  };

  const handleDeleteTimeEntry = async (entry: TimeEntry) => {
    setTimeEntries((prev) => prev.filter((e) => e.id !== entry.id));
    if (!isOffline) {
      try {
        await api.delete(`/time/entries/${entry.id}`);
      } catch {
        // Ignore
      }
    }
  };

  // Milestone handlers
  const handleSaveMilestone = async (m: Partial<Milestone>, id?: number) => {
    if (id) {
      setMilestones((prev) => prev.map((item) => (item.id === id ? ({ ...item, ...m } as Milestone) : item)));
    } else {
      const newM: Milestone = {
        id: Date.now(),
        name: m.name || 'New Milestone',
        description: m.description,
        projectId: m.projectId || 1,
        projectName: m.projectName || 'Project',
        targetDate: m.targetDate,
        status: m.status || 'Planned',
      };
      setMilestones((prev) => [newM, ...prev]);
    }

    if (!isOffline) {
      try {
        if (id) await api.put(`/milestones/${id}`, m);
        else await api.post('/milestones', m);
      } catch {
        // Fallback
      }
    }
  };

  const handleDeleteMilestone = async (m: Milestone) => {
    setMilestones((prev) => prev.filter((item) => item.id !== m.id));
    if (!isOffline) {
      try {
        await api.delete(`/milestones/${m.id}`);
      } catch {
        // Fallback
      }
    }
  };

  // Settings handlers
  const handleUpdateWorkspaceInfo = (name: string, company: string, user: string) => {
    setWorkspaceInfo({ workspaceName: name, companyName: company, userDisplayName: user });
  };

  const handleRestoreBackup = (data: WorkspaceData) => {
    if (data.projects) setProjects(data.projects);
    if (data.tasks) setTasks(data.tasks);
    if (data.milestones) setMilestones(data.milestones);
    if (data.timeEntries) setTimeEntries(data.timeEntries);
    if (data.activities) setActivities(data.activities);
    if (data.workspaceName) {
      setWorkspaceInfo({
        workspaceName: data.workspaceName,
        companyName: data.companyName || 'Tamzode Tech Lab',
        userDisplayName: data.userDisplayName || 'Sureha DJ',
      });
    }
    saveWorkspaceData(data);
  };

  const handleResetData = () => {
    const clean = resetWorkspaceData();
    setProjects(clean.projects);
    setTasks(clean.tasks);
    setMilestones(clean.milestones);
    setTimeEntries(clean.timeEntries);
    setActivities(clean.activities);
    setTimer(clean.timer);
    setWorkspaceInfo({
      workspaceName: clean.workspaceName || 'Tamzode Technology',
      companyName: clean.companyName || 'Tamzode Tech Lab',
      userDisplayName: clean.userDisplayName || 'Sureha DJ',
    });
  };

  const handleTestConnection = async (): Promise<boolean> => {
    try {
      const res = await api.get('/dashboard');
      if (res.status === 200) {
        setIsOffline(false);
        return true;
      }
      return false;
    } catch {
      setIsOffline(true);
      return false;
    }
  };

  const currentWorkspaceData: WorkspaceData = {
    projects,
    tasks,
    milestones,
    timeEntries,
    activities,
    timer,
    ...workspaceInfo,
  };

  return (
    <div className="app dark">
      {/* Sidebar */}
      <aside className={`sidebar ${menu ? 'open' : ''}`}>
        <div className="brand">
          <div className="brandmark">
            <Command size={19} />
          </div>
          <div>
            <strong>tamzode</strong>
            <span>TECHNOLOGY</span>
          </div>
          <button className="mobile-close icon-button" onClick={() => setMenu(false)} aria-label="Close navigation">
            <X size={18} />
          </button>
        </div>

        <div className="nav-label">WORKSPACE</div>
        <nav>
          {nav.map(([name, Icon]) => (
            <button
              key={name}
              className={`nav-item ${page === name || (name === 'Projects' && page === 'Project Workspace') ? 'selected' : ''}`}
              onClick={() => {
                setPage(name);
                setMenu(false);
              }}
            >
              <Icon size={18} />
              <span>{name}</span>
              {name === 'My Tasks' && metrics.pending > 0 && <i>{metrics.pending}</i>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="upgrade">
            <div className="upgrade-icon">
              <Sparkles size={16} />
            </div>
            <b>Keep your momentum</b>
            <p>Your projects are ready for their next chapter.</p>
            <button onClick={() => setModal('update')}>
              Add a daily update <ArrowRight size={14} />
            </button>
          </div>

          <button className="profile">
            <div className="avatar">TZ</div>
            <span>
              <b>{workspaceInfo.workspaceName}</b>
              <small>{workspaceInfo.userDisplayName}</small>
            </span>
            <MoreHorizontal size={18} />
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="main">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMenu(true)} aria-label="Open navigation">
            <Menu size={20} />
          </button>

          <div className="breadcrumbs">
            Workspace <span>/</span> <b>{page}</b>
          </div>

          <div className="top-actions">
            {isOffline ? (
              <div className="offline-mode-pill" title="Running with local storage resilience">
                <span className="dot" />
                <span>Offline Demo Mode</span>
                <button onClick={reload} className="reconnect-pill-btn" title="Attempt connection to Spring Boot API">
                  <RefreshCw size={11} /> Connect
                </button>
              </div>
            ) : (
              <div className="online-mode-pill" title="Connected to PostgreSQL REST API">
                <span className="dot" />
                <span>Live API Connected</span>
              </div>
            )}

            <label className="search">
              <Search size={16} />
              <input placeholder="Search anything..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </label>

            <div className="avatar top-avatar">TZ</div>
          </div>
        </header>

        <div className="content">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              {page === 'Dashboard' ? (
                <Dashboard
                  projects={projects}
                  activities={activities}
                  metrics={metrics}
                  dueSoon={dueSoon}
                  high={high}
                  weeklyHours={weeklyHours}
                  timeByProject={timeByProject}
                  taskStatus={taskStatus}
                  onTask={() => setModal('task')}
                  onUpdate={() => setModal('update')}
                  onProject={() => setModal('project')}
                  onPage={setPage}
                  onTaskStatus={(status) => {
                    setTaskStatusFilter(status);
                    setPage('My Tasks');
                  }}
                  changeStatus={changeStatus}
                />
              ) : page === 'Project Workspace' ? (
                <ProjectWorkspacePage
                  initialProjectId={selectedProjectId || undefined}
                  projects={projects}
                  tasks={tasks}
                  milestones={milestones}
                  onPage={setPage}
                  onAddTask={(projectId, phaseId) => {
                    setEditingTask(null);
                    setTaskProjectId(projectId);
                    setTaskPhaseId(phaseId);
                    setModal('task');
                  }}
                  onComplete={async (t) => {
                    await changeStatus(t as any, 'Done');
                  }}
                  reload={reload}
                  notify={setToast}
                />
              ) : page === 'Projects' ? (
                <ProjectsPage
                  projects={projects}
                  tasks={tasks}
                  milestones={milestones}
                  onCreate={() => setModal('project')}
                  onOpen={(p) => {
                    setSelectedProjectId(p.id);
                    setPage('Project Workspace');
                  }}
                  onEdit={(p) => {
                    setEditingProject(p);
                    setModal('project');
                  }}
                  onStatus={(p, status) => updateProject(p, { status })}
                  onStage={(p, currentStage) => updateProject(p, { currentStage })}
                  onDelete={removeProject}
                />
              ) : page === 'My Tasks' ? (
                <TasksPage
                  tasks={tasks}
                  projects={projects}
                  milestones={milestones}
                  initialStatus={taskStatusFilter}
                  onCreate={() => setModal('task')}
                  onEdit={(t) => {
                    setEditingTask(t);
                    setModal('task');
                  }}
                  onDelete={removeTask}
                  changeStatus={changeStatus}
                  timer={timer}
                  reload={reload}
                  notify={setToast}
                />
              ) : page === 'Calendar' ? (
                <CalendarPage
                  tasks={tasks}
                  milestones={milestones}
                  projects={projects}
                  date={calendar}
                  setDate={setCalendar}
                  onCreateTask={() => setModal('task')}
                  onViewTasks={() => setPage('My Tasks')}
                />
              ) : page === 'Time Tracking' ? (
                <TimeTrackingPage
                  projects={projects}
                  tasks={tasks}
                  entries={timeEntries}
                  timer={timer}
                  setTimer={setTimer}
                  reload={reload}
                  notify={setToast}
                  onTimerAction={handleTimerAction}
                  onSaveManualEntry={handleSaveManualTime}
                  onDeleteEntry={handleDeleteTimeEntry}
                />
              ) : page === 'Milestones' ? (
                <MilestonesPage
                  projects={projects}
                  milestones={milestones}
                  reload={reload}
                  notify={setToast}
                  onSaveMilestone={handleSaveMilestone}
                  onDeleteMilestone={handleDeleteMilestone}
                />
              ) : page === 'Reports' ? (
                <ReportsPage
                  metrics={metrics}
                  weeklyHours={weeklyHours}
                  timeByProject={timeByProject}
                  taskStatus={taskStatus}
                  completedTrend={completedTrend}
                  onExportCsv={() => exportTimeEntriesCsv(timeEntries)}
                />
              ) : page === 'Activity History' ? (
                <ActivityPage items={activities} />
              ) : (
                <SettingsPage
                  isOffline={isOffline}
                  projectsCount={projects.length}
                  tasksCount={tasks.length}
                  milestonesCount={milestones.length}
                  timeEntriesCount={timeEntries.length}
                  workspaceData={currentWorkspaceData}
                  onUpdateWorkspaceInfo={handleUpdateWorkspaceInfo}
                  onRestoreBackup={handleRestoreBackup}
                  onResetData={handleResetData}
                  onTestConnection={handleTestConnection}
                  notify={setToast}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Scrim */}
      {menu && <button className="scrim" onClick={() => setMenu(false)} aria-label="Close navigation" />}

      {/* Modals */}
      {modal && (
        <Modal
          kind={modal}
          projects={projects}
          tasks={tasks}
          milestones={milestones}
          initialProject={editingProject}
          initialTask={editingTask}
          initialProjectId={taskProjectId}
          initialPhaseId={taskPhaseId}
          close={() => {
            setModal(null);
            setEditingProject(null);
            setEditingTask(null);
            setTaskProjectId(undefined);
            setTaskPhaseId(undefined);
          }}
          save={mutate}
        />
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="toast"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            <CheckCircle2 size={18} />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Header({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="heading-actions">{actions}</div>}
    </div>
  );
}

function Dashboard({
  projects,
  activities,
  metrics,
  dueSoon,
  high,
  weeklyHours,
  timeByProject,
  taskStatus,
  onTask,
  onUpdate,
  onProject,
  onPage,
  onTaskStatus,
  changeStatus,
}: {
  projects: Project[];
  activities: ActivityItem[];
  metrics: WorkspaceMetrics;
  dueSoon: Task[];
  high: Task[];
  weeklyHours: any[];
  timeByProject: any[];
  taskStatus: any[];
  onTask: () => void;
  onUpdate: () => void;
  onProject: () => void;
  onPage: (p: string) => void;
  onTaskStatus: (status: string) => void;
  changeStatus: (t: Task, s: TaskStatus) => void;
}) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const featuredProject =
    projects.find((p) => p.status === 'In Progress') ||
    projects.find((p) => p.status === 'Planned') ||
    projects.find((p) => p.status === 'On Hold') ||
    projects[0];
  const otherProjects = projects.filter((p) => p.id !== featuredProject?.id).slice(0, 3);
  const taskTotal = metrics.completed + metrics.pending;

  const metricCards: any[] = [
    [FolderKanban, 'Total projects', metrics.total, 'Across your workspace', 'teal', null],
    [
      TrendingUp,
      'In progress',
      metrics.active,
      'Moving forward now',
      'green',
      metrics.total ? (metrics.active / metrics.total) * 100 : null,
    ],
    [
      CheckCircle2,
      'Tasks completed',
      metrics.completed,
      'Leaf tasks marked done',
      'blue',
      taskTotal ? (metrics.completed / taskTotal) * 100 : null,
    ],
    [
      ListTodo,
      'Pending tasks',
      metrics.pending,
      'Still on your list',
      'purple',
      taskTotal ? (metrics.pending / taskTotal) * 100 : null,
    ],
    [Clock3, 'Time tracked', fmtDuration(metrics.totalTimeSeconds || 0), 'Recorded from time entries', 'green', null],
    [AlertCircle, 'Overdue tasks', metrics.overdue, 'Past due and unfinished', 'orange', null],
  ];

  return (
    <>
      <Header
        eyebrow={new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
          .format(new Date())
          .toUpperCase()}
        title={greeting}
        description="Your projects, tasks, and milestones at a glance."
        actions={
          <>
            <button className="button secondary" onClick={onTask}>
              <Plus size={16} /> Add task
            </button>
            <button className="button primary" onClick={onProject}>
              <Plus size={16} /> New project
            </button>
          </>
        }
      />

      <section className="personal-banner">
        <div className="personal-banner-copy">
          <span className="eyebrow">YOUR PERSONAL WORKSPACE</span>
          <h2>Your ideas, in motion.</h2>
          <p>Choose a clear next step and keep your projects moving forward.</p>
        </div>
        <img src={dashboardHero} alt="Developer working on project tracker workspace" />
      </section>

      <div className="metric-grid">
        {metricCards.map(([I, label, val, hint, color, ratio]: any) => (
          <div className={`metric-card ${ratio !== null ? 'has-progress' : ''}`} key={label}>
            <div className="metric-top">
              <span>{label}</span>
              <div className={`metric-icon ${color}`}>
                <I size={17} />
              </div>
            </div>
            <div className="metric-value">{val}</div>
            <div className="metric-hint">
              <span className={`dot ${color}`} />
              {hint}
            </div>
            {ratio !== null && (
              <div className="metric-progress" aria-label={`${Math.round(ratio)} percent`}>
                <span style={{ width: `${Math.max(0, Math.min(100, ratio))}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <section className="panel chart-panel">
          <div className="section-head">
            <div>
              <h2>Task status</h2>
              <p>Current active workload</p>
            </div>
            <button className="text-button" onClick={() => onPage('My Tasks')}>
              View tasks <ArrowRight size={14} />
            </button>
          </div>
          <TaskDoughnut data={taskStatus} onClick={(status) => onTaskStatus(status)} />
        </section>

        <section className="panel chart-panel">
          <div className="section-head">
            <div>
              <h2>This week</h2>
              <p>Tracked time by day · hours</p>
            </div>
            <button className="text-button" onClick={() => onPage('Time Tracking')}>
              Time report <ArrowRight size={14} />
            </button>
          </div>
          <HoursBarChart data={weeklyHours} />
        </section>
      </div>

      <section className="panel chart-panel project-time-panel">
        <div className="section-head">
          <div>
            <h2>Time by project</h2>
            <p>Actual time entries, current week</p>
          </div>
          <button className="text-button" onClick={() => onPage('Reports')}>
            Open reports <ArrowRight size={14} />
          </button>
        </div>
        <ProjectTimeChart data={timeByProject} />
      </section>

      <section className="section projects-section">
        {featuredProject ? (
          <>
            <FeaturedProject p={featuredProject} onBrowse={() => onPage('Projects')} />
            {otherProjects.length > 0 && (
              <>
                <div className="section-head more-projects-head">
                  <div>
                    <h2>More projects</h2>
                    <p>Your other work in progress</p>
                  </div>
                  <button className="text-button" onClick={() => onPage('Projects')}>
                    All projects <ArrowRight size={15} />
                  </button>
                </div>
                <div className="project-grid">
                  {otherProjects.map((p, i) => (
                    <ProjectCard key={p.id} p={p} color={colors[(i + 1) % 4]} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <Empty
            title="Your next project starts here"
            body="Create a project to give your ideas a clear plan and a place to grow."
            action="Create project"
            onClick={onProject}
          />
        )}
      </section>

      <div className="lower-grid">
        <section className="panel">
          <div className="section-head">
            <div>
              <h2>Upcoming deadlines</h2>
              <p>What’s coming up next</p>
            </div>
            <button className="icon-button" aria-label="View calendar" onClick={() => onPage('Calendar')}>
              <ArrowUpRight size={17} />
            </button>
          </div>
          {dueSoon.length ? (
            <div className="deadline-list">
              {dueSoon.map((t) => (
                <div className="deadline-row" key={t.id}>
                  <button className="task-check" onClick={() => changeStatus(t, 'Done')} aria-label={`Complete ${t.title}`}>
                    <Circle size={19} />
                  </button>
                  <div className="deadline-copy">
                    <b>{t.title}</b>
                    <small>{t.projectName || 'Project'}</small>
                  </div>
                  <span className="date-pill">
                    <CalendarDays size={13} />
                    {fmtDate(t.dueDate)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <Empty title="Nothing due soon" body="Tasks with a deadline will show up here." />
          )}
        </section>

        <section className="panel">
          <div className="section-head">
            <div>
              <h2>Priority focus</h2>
              <p>Tasks that need attention</p>
            </div>
            <span className="priority-count">
              {high.length} {high.length === 1 ? 'task' : 'tasks'}
            </span>
          </div>
          {high.length ? (
            <div className="focus-list">
              {high.map((t) => (
                <div className="focus-row" key={t.id}>
                  <span className={`priority-dot ${t.priority.toLowerCase()}`} />
                  <div>
                    <b>{t.title}</b>
                    <small>
                      {t.projectName || 'Personal task'} · {t.status}
                    </small>
                  </div>
                  <span className={`priority-badge ${t.priority.toLowerCase()}`}>{t.priority}</span>
                  <button
                    className="icon-button"
                    onClick={() => changeStatus(t, t.status === 'Done' ? 'To Do' : 'Done')}
                    aria-label="Complete task"
                  >
                    <Check size={15} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <Empty title="All clear" body="High and urgent priority tasks will appear here." />
          )}
        </section>

        <section className="panel activity-panel">
          <div className="section-head">
            <div>
              <h2>Recent activity</h2>
              <p>A little progress goes a long way</p>
            </div>
            <button className="text-button" onClick={() => onPage('Activity History')}>
              View all <ArrowRight size={15} />
            </button>
          </div>
          {activities.length ? (
            <div className="activity-list">
              {activities.slice(0, 4).map((a) => (
                <ActivityRow key={a.id} item={a} />
              ))}
            </div>
          ) : (
            <Empty title="Your story starts here" body="Project and task updates will appear as you work." />
          )}
        </section>

        <section className="note-card">
          <div className="note-icon">
            <FileText size={17} />
          </div>
          <span className="eyebrow">A MOMENT TO REFLECT</span>
          <h3>Capture today’s progress</h3>
          <p>Log what you worked on, what’s next, and anything in your way.</p>
          <button className="button note-button" onClick={onUpdate}>
            Write a daily note <Plus size={15} />
          </button>
        </section>
      </div>
    </>
  );
}

function TaskDoughnut({ data, onClick }: { data: any[]; onClick: (status: string) => void }) {
  const count = (statuses: string[]) =>
    data.filter((d) => statuses.includes(d.status)).reduce((sum, d) => sum + Number(d.count || 0), 0);
  const parts = [
    { label: 'Completed', filter: 'Done', value: count(['Done']), color: '#76dc18' },
    { label: 'In progress', filter: 'In Progress', value: count(['In Progress']), color: '#36b582' },
    { label: 'Pending', filter: 'Pending', value: count(['To Do', 'In Review']), color: '#627b5d' },
    { label: 'Blocked', filter: 'Blocked', value: count(['Blocked']), color: '#d69d38' },
  ];
  const total = parts.reduce((sum, p) => sum + p.value, 0);
  const circ = 2 * Math.PI * 39;
  let used = 0;
  return (
    <div className="donut-layout">
      <div className="donut-wrap">
        <svg viewBox="0 0 100 100" role="img" aria-label={`${total} active tasks by status`}>
          <circle cx="50" cy="50" r="39" fill="none" stroke="#162414" strokeWidth="11" />
          {parts
            .filter((p) => p.value > 0)
            .map((p) => {
              const length = total ? (circ * p.value) / total : 0;
              const offset = used;
              used += length;
              return (
                <circle
                  key={p.label}
                  className="donut-segment"
                  cx="50"
                  cy="50"
                  r="39"
                  fill="none"
                  stroke={p.color}
                  strokeWidth="11"
                  strokeDasharray={`${length} ${circ - length}`}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 50 50)"
                  onClick={() => onClick(p.filter)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${p.label}, ${p.value} tasks`}
                  onKeyDown={(e) => e.key === 'Enter' && onClick(p.filter)}
                />
              );
            })}
        </svg>
        <div className="donut-center">
          <b>{total}</b>
          <small>active tasks</small>
        </div>
      </div>
      <div className="chart-legend">
        {parts.map((p) => (
          <button key={p.label} onClick={() => onClick(p.filter)} className="legend-item">
            <i style={{ background: p.color }} />
            <span>{p.label}</span>
            <b>{p.value}</b>
          </button>
        ))}
      </div>
    </div>
  );
}

function HoursBarChart({ data }: { data: any[] }) {
  const max = Math.max(1, ...data.map((d) => Number(d.seconds || 0)));
  return (
    <div className="hours-chart">
      {data.map((d: any) => {
        const date = new Date(`${d.date}T00:00:00`);
        const hours = Number(d.seconds || 0) / 3600;
        return (
          <div
            className="hours-day"
            key={d.date}
            title={`${date.toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}: ${hours.toFixed(2)} hours`}
          >
            <span className="hours-value">{hours ? hours.toFixed(1) : '0'}</span>
            <div className="hours-track">
              <i style={{ height: `${Math.max(hours ? 5 : 0, (Number(d.seconds || 0) / max) * 100)}%` }} />
            </div>
            <small>{date.toLocaleDateString(undefined, { weekday: 'short' })}</small>
          </div>
        );
      })}
    </div>
  );
}

function ProjectTimeChart({ data }: { data: any[] }) {
  const max = Math.max(1, ...data.map((d) => Number(d.seconds || 0)));
  if (!data.length)
    return <Empty title="No tracked time yet" body="Start a timer or add a manual time entry to see project distribution." />;
  return (
    <div className="project-time-chart">
      {data.map((d: any) => (
        <div className="project-time-row" key={d.projectId}>
          <span title={d.projectName}>{d.projectName}</span>
          <div className="project-time-track">
            <i style={{ width: `${Math.max(Number(d.seconds) ? 2 : 0, (Number(d.seconds || 0) / max) * 100)}%` }} />
          </div>
          <b>{fmtDuration(Number(d.seconds || 0))}</b>
        </div>
      ))}
    </div>
  );
}

function FeaturedProject({ p, onBrowse }: { p: Project; onBrowse: () => void }) {
  const progress = Math.max(0, Math.min(100, p.progress || 0));
  return (
    <article className="featured-project">
      <div className="featured-project-copy">
        <div className="featured-project-meta">
          <span className="eyebrow">YOUR CURRENT FOCUS</span>
          <span className={`status-badge ${p.status.toLowerCase().replace(' ', '-')}`}>
            <i />
            {p.status}
          </span>
        </div>
        <h2>{p.name}</h2>
        <p>{p.description || p.category || 'Keep this project moving one step at a time.'}</p>
        <div className="featured-project-details">
          <span>
            <CalendarDays size={15} />
            {p.deadline ? `Due ${fmtDate(p.deadline)}` : 'No deadline set'}
          </span>
          <span>
            <ListTodo size={15} />
            {p.completedTasks || 0} of {p.taskCount || 0} tasks complete
          </span>
        </div>
        <button className="text-button" onClick={onBrowse}>
          View all projects <ArrowRight size={15} />
        </button>
      </div>
      <div
        className="featured-progress-ring"
        style={{ '--progress': `${progress}%` } as React.CSSProperties}
        role="img"
        aria-label={`${progress}% complete`}
      >
        <div>
          <b>{progress}%</b>
          <small>complete</small>
        </div>
      </div>
    </article>
  );
}

function ProjectCard({
  p,
  color,
  onDelete,
  onEdit,
  onStatus,
  onStage,
  onOpen,
  menuOpen = false,
  onMenuToggle = () => {},
  onMenuClose = () => {},
}: {
  p: Project;
  color: string;
  onDelete?: () => void;
  onEdit?: (p: Project) => void;
  onStatus?: (p: Project, status: Status) => void;
  onStage?: (p: Project, stage: NonNullable<Project['currentStage']>) => void;
  onOpen?: () => void;
  menuOpen?: boolean;
  onMenuToggle?: () => void;
  onMenuClose?: () => void;
}) {
  const stages = ['Planning', 'Design', 'Development', 'Testing', 'Deployment', 'Completed'];
  return (
    <article className={`project-card ${menuOpen ? 'menu-is-open' : ''}`}>
      <div className="project-card-top">
        <div className="project-symbol" style={{ '--project-color': color } as React.CSSProperties}>
          <FolderKanban size={18} />
        </div>
        <span className={`status-badge ${p.status.toLowerCase().replace(' ', '-')}`}>
          <i />
          {p.status}
        </span>
        {(onDelete || onEdit || onStatus) && (
          <div className="project-menu-wrap">
            <button
              className="icon-button tiny"
              aria-label={`Options for ${p.name}`}
              aria-expanded={menuOpen}
              onClick={onMenuToggle}
            >
              <MoreHorizontal size={17} />
            </button>
            {menuOpen && (
              <div className="project-dropdown-menu">
                {onEdit && (
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      onMenuClose();
                      onEdit(p);
                    }}
                  >
                    Edit project
                  </button>
                )}
                {onStatus && (
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      onMenuClose();
                      onStatus(p, p.status === 'Archived' ? 'Planned' : 'Archived');
                    }}
                  >
                    {p.status === 'Archived' ? 'Reopen project' : 'Archive project'}
                  </button>
                )}
                {onDelete && (
                  <button
                    className="dropdown-item danger"
                    onClick={() => {
                      onMenuClose();
                      onDelete();
                    }}
                  >
                    Delete project
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <h3>
        <button className="project-title-open" onClick={onOpen}>
          {p.name}
        </button>
      </h3>
      <p className="project-desc">{p.description || p.category}</p>
      <div className="project-stage-row">
        <label>
          Stage
          <select
            aria-label={`Stage for ${p.name}`}
            value={p.currentStage || 'Planning'}
            disabled={!onStage}
            onChange={(e) => onStage?.(p, e.target.value as NonNullable<Project['currentStage']>)}
          >
            {stages.map((stage) => (
              <option key={stage}>{stage}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="progress-label">
        <span>Progress</span>
        <b>{p.progress}%</b>
      </div>
      <div className="progress-track">
        <div style={{ width: `${p.progress}%`, background: color }} />
      </div>
      <div className="project-card-foot">
        <span>
          <ListTodo size={14} />
          {p.completedTasks || 0}/{p.taskCount || 0} tasks
        </span>
        <span className="priority-label">
          <i className={`priority-dot ${p.priority.toLowerCase()}`} />
          {p.priority} priority
        </span>
      </div>
    </article>
  );
}

function ActivityRow({ item, large = false }: { item: ActivityItem; large?: boolean }) {
  return (
    <div className={`activity-row ${large ? 'large' : ''}`}>
      <div className="activity-icon">
        <Activity size={15} />
      </div>
      <div className="activity-copy">
        <b>
          {item.action} <span>{item.entityName}</span>
        </b>
        {item.details && <small>{item.details}</small>}
        <time>{new Date(item.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</time>
      </div>
    </div>
  );
}

function Empty({
  title,
  body,
  action,
  onClick,
}: {
  title: string;
  body: string;
  action?: string;
  onClick?: () => void;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Target size={20} />
      </div>
      <b>{title}</b>
      <p>{body}</p>
      {action && onClick && (
        <button className="button secondary" onClick={onClick}>
          <Plus size={15} />
          {action}
        </button>
      )}
    </div>
  );
}

const taskSchema = z.object({
  title: z.string().trim().min(2, 'Give this task a name.'),
  description: z.string().optional(),
  projectId: z.number().positive('Choose a project.'),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent', 'Critical']),
  status: z.enum(['To Do', 'In Progress', 'In Review', 'Blocked', 'Done', 'Cancelled']),
  dueDate: z.string().optional(),
  startDate: z.string().optional(),
  estimatedMinutes: z.coerce.number().int().nonnegative().optional(),
  parentTaskId: z.number().positive().optional(),
  milestoneId: z.number().positive().optional(),
  assignee: z.string().optional(),
  notes: z.string().optional(),
});

const projectSchema = z.object({
  name: z.string().trim().min(2, 'Enter a project name.'),
  description: z.string().optional(),
  category: z.string().optional(),
  technology: z.string().optional(),
  status: z.enum(['Planned', 'In Progress', 'On Hold', 'Completed', 'Archived']),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent', 'Critical']),
  startDate: z.string().optional(),
  deadline: z.string().optional(),
  owner: z.string().optional(),
  currentStage: z.enum(['Planning', 'Design', 'Development', 'Testing', 'Deployment', 'Completed']),
  progressMode: z.enum(['tasks', 'milestones']),
  notes: z.string().optional(),
  usefulLinks: z.string().optional(),
  repositoryUrl: z.string().optional(),
});

function Modal({
  kind,
  projects,
  tasks,
  milestones,
  close,
  save,
  initialProject,
  initialTask,
  initialProjectId,
  initialPhaseId,
}: {
  kind: 'project' | 'task' | 'update';
  projects: Project[];
  tasks: Task[];
  milestones: Milestone[];
  close: () => void;
  save: (kind: 'project' | 'task' | 'update', data: unknown, id?: number) => Promise<void>;
  initialProject: Project | null;
  initialTask: Task | null;
  initialProjectId?: number;
  initialPhaseId?: number;
}) {
  const [saving, setSaving] = useState(false);
  const isTask = kind === 'task';
  const isProject = kind === 'project';

  const taskForm = useForm<any>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      ...initialTask,
      status: initialTask?.status ?? 'To Do',
      priority: initialTask?.priority ?? 'Medium',
      projectId: initialTask?.projectId ?? initialProjectId ?? projects[0]?.id,
      projectPhaseId: initialTask?.projectPhaseId ?? initialPhaseId,
    },
  });

  const projectForm = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      ...initialProject,
      status: initialProject?.status ?? 'Planned',
      priority: initialProject?.priority ?? 'Medium',
      currentStage: initialProject?.currentStage ?? 'Planning',
      progressMode: initialProject?.progressMode ?? 'tasks',
    },
  });

  const updateForm = useForm({
    defaultValues: {
      workedOn: '',
      completed: '',
      blockers: '',
      nextSteps: '',
    },
  });

  const submit = async (data: any) => {
    setSaving(true);
    try {
      await save(kind, data, isTask ? initialTask?.id : isProject ? initialProject?.id : undefined);
    } catch {
      alert('Could not save change. Please check your inputs.');
    } finally {
      setSaving(false);
    }
  };

  const title = isTask
    ? initialTask
      ? 'Edit task'
      : 'Add a task'
    : isProject
      ? initialProject
        ? 'Edit project'
        : 'Create a project'
      : 'Daily progress note';

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <motion.div className="modal" initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
        <div className="modal-header">
          <div>
            <span className="eyebrow">{isTask ? 'NEXT SMALL STEP' : isProject ? 'NEW BEGINNING' : 'DAILY REFLECTION'}</span>
            <h2>{title}</h2>
          </div>
          <button className="icon-button" onClick={close} aria-label="Close dialog">
            <X size={19} />
          </button>
        </div>

        {isTask ? (
          <form onSubmit={taskForm.handleSubmit(submit)}>
            <Field label="Task title" error={taskForm.formState.errors.title?.message as string | undefined}>
              <input autoFocus placeholder="e.g. Draft the homepage wireframe" {...taskForm.register('title')} />
            </Field>

            <Field label="Description">
              <textarea placeholder="Add a little context (optional)" {...taskForm.register('description')} />
            </Field>

            <div className="form-row">
              <Field label="Project" error={taskForm.formState.errors.projectId?.message as string | undefined}>
                <select {...taskForm.register('projectId', { valueAsNumber: true })}>
                  <option value="">Choose project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Priority">
                <select {...taskForm.register('priority')}>
                  {['Low', 'Medium', 'High', 'Urgent', 'Critical'].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="form-row">
              <Field label="Start date">
                <input type="date" {...taskForm.register('startDate')} />
              </Field>
              <Field label="Due date">
                <input type="date" {...taskForm.register('dueDate')} />
              </Field>
            </div>

            <div className="form-row">
              <Field label="Status">
                <select {...taskForm.register('status')}>
                  {['To Do', 'In Progress', 'In Review', 'Blocked', 'Done', 'Cancelled'].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Field>
              <Field label="Estimated minutes">
                <input
                  type="number"
                  min="0"
                  {...taskForm.register('estimatedMinutes', {
                    setValueAs: (v: string) => (v === '' ? undefined : Number(v)),
                  })}
                />
              </Field>
            </div>

            <div className="form-row">
              <Field label="Assignee">
                <input placeholder="Optional" {...taskForm.register('assignee')} />
              </Field>
              <Field label="Parent task">
                <select
                  {...taskForm.register('parentTaskId', {
                    setValueAs: (v: string) => (v === '' ? undefined : Number(v)),
                  })}
                >
                  <option value="">No parent</option>
                  {tasks
                    .filter((t) => t.projectId === taskForm.watch('projectId') && t.id !== initialTask?.id)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                </select>
              </Field>
            </div>

            <Field label="Milestone">
              <select
                {...taskForm.register('milestoneId', {
                  setValueAs: (v: string) => (v === '' ? undefined : Number(v)),
                })}
              >
                <option value="">No milestone</option>
                {milestones
                  .filter((m) => m.projectId === taskForm.watch('projectId'))
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
              </select>
            </Field>

            <Field label="Notes">
              <textarea {...taskForm.register('notes')} />
            </Field>

            {!projects.length && <div className="form-warning">Create a project before adding a task.</div>}
            <FormButtons close={close} saving={saving} disabled={!projects.length} />
          </form>
        ) : isProject ? (
          <form onSubmit={projectForm.handleSubmit(submit)}>
            <Field label="Project name" error={projectForm.formState.errors.name?.message as string | undefined}>
              <input autoFocus placeholder="What are you working on?" {...projectForm.register('name')} />
            </Field>

            <Field label="Description">
              <textarea placeholder="What does success look like?" {...projectForm.register('description')} />
            </Field>

            <div className="form-row">
              <Field label="Category">
                <input placeholder="e.g. Client project" {...projectForm.register('category')} />
              </Field>
              <Field label="Technology stack">
                <input placeholder="e.g. React, PostgreSQL" {...projectForm.register('technology')} />
              </Field>
            </div>

            <div className="form-row">
              <Field label="Status">
                <select {...projectForm.register('status')}>
                  {['Planned', 'In Progress', 'On Hold', 'Completed', 'Archived'].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Field>
              <Field label="Priority">
                <select {...projectForm.register('priority')}>
                  {['Low', 'Medium', 'High', 'Urgent', 'Critical'].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="form-row">
              <Field label="Start date">
                <input type="date" {...projectForm.register('startDate')} />
              </Field>
              <Field label="Deadline">
                <input type="date" {...projectForm.register('deadline')} />
              </Field>
            </div>

            <div className="form-row">
              <Field label="Current stage">
                <select {...projectForm.register('currentStage')}>
                  {['Planning', 'Design', 'Development', 'Testing', 'Deployment', 'Completed'].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Field>
              <Field label="Owner">
                <input placeholder="Optional" {...projectForm.register('owner')} />
              </Field>
            </div>

            <Field label="Repository URL">
              <input type="url" {...projectForm.register('repositoryUrl')} />
            </Field>

            <Field label="Useful links">
              <textarea {...projectForm.register('usefulLinks')} />
            </Field>

            <Field label="Project notes">
              <textarea {...projectForm.register('notes')} />
            </Field>

            <FormButtons close={close} saving={saving} />
          </form>
        ) : (
          <form onSubmit={updateForm.handleSubmit(submit)}>
            <p className="form-intro">A short note keeps the whole journey in view.</p>
            <Field label="What did you work on?">
              <textarea autoFocus placeholder="The focus of your day..." {...updateForm.register('workedOn', { required: true })} />
            </Field>
            <Field label="What did you complete?">
              <textarea placeholder="Small wins count too" {...updateForm.register('completed')} />
            </Field>
            <Field label="Blockers">
              <textarea placeholder="Anything slowing you down?" {...updateForm.register('blockers')} />
            </Field>
            <Field label="Next steps">
              <textarea placeholder="What comes next?" {...updateForm.register('nextSteps')} />
            </Field>
            <FormButtons close={close} saving={saving} />
          </form>
        )}
      </motion.div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}

function FormButtons({ close, saving, disabled = false }: { close: () => void; saving: boolean; disabled?: boolean }) {
  return (
    <div className="form-actions">
      <button type="button" className="button secondary" onClick={close}>
        Cancel
      </button>
      <button className="button primary" type="submit" disabled={saving || disabled}>
        {saving ? 'Saving...' : 'Save'}
      </button>
    </div>
  );
}

export default App;
