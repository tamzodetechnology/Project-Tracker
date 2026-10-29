import { useEffect, useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  CalendarDays,
  BarChart3,
  CheckCircle2,
  Command,
  Flag,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  Menu,
  RefreshCw,
  Search,
  Settings,
  Timer,
  X,
} from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { DashboardPage } from './DashboardPage';
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
} from './types';

import {
  loadWorkspaceData,
  saveWorkspaceData,
  calculateWorkspaceMetrics,
  exportTimeEntriesCsv,
} from './mockData';
import type { WorkspaceData } from './mockData';

import './DashboardPage.css';
import './ProjectsPage.css';
import './TasksPage.css';
import './CalendarPage.css';
import './TimeTrackingPage.css';
import './MilestonesPage.css';
import './ReportsPage.css';
import './ActivityPage.css';
import './SettingsPage.css';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://project-tracker-7z3d.onrender.com/api',
  timeout: 8000,
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
                <DashboardPage
                  projects={projects}
                  tasks={tasks}
                  activities={activities}
                  metrics={metrics}
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
