#!/usr/bin/env node

/**
 * ============================================================================
 * Project Tracker MCP Server
 * Autonomous Project & Time Tracking for Antigravity, Claude Code & AI Agents
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_FILE = path.join(ROOT_DIR, 'data', 'workspace_store.json');
const API_URL = process.env.TRACKER_API_URL || 'https://project-tracker-7z3d.onrender.com/api';

// Safe logger to stderr (stdio stdout is reserved exclusively for JSON-RPC)
function log(...args) {
  process.stderr.write(`[ProjectTracker MCP] ${args.join(' ')}\n`);
}

// Ensure data folder exists
if (!fs.existsSync(path.dirname(DATA_FILE))) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}

// ---------------------------------------------------------------------------
// Store & Fallback Management
// ---------------------------------------------------------------------------

function getInitialStore() {
  const today = new Date().toISOString().slice(0, 10);
  return {
    projects: [
      {
        id: 1,
        name: 'Project Tracker SaaS',
        description: 'Modern luxury deep-green project, task, and time telemetry suite.',
        category: 'Web Application',
        technology: 'React, Vite, TypeScript, Spring Boot',
        status: 'In Progress',
        priority: 'Critical',
        startDate: today,
        deadline: '',
        currentStage: 'Development',
        progress: 85,
        taskCount: 8,
        completedTasks: 6,
        milestoneCount: 2,
      },
    ],
    tasks: [
      {
        id: 1,
        title: 'MCP Server Automation',
        description: 'Implement native MCP server for Antigravity and Claude Code automation.',
        projectId: 1,
        projectName: 'Project Tracker SaaS',
        status: 'In Progress',
        priority: 'High',
        dueDate: today,
        actualSeconds: 1800,
      },
    ],
    milestones: [],
    activities: [
      {
        id: Date.now(),
        action: 'MCP Server Connected',
        entityType: 'System',
        entityName: 'Antigravity / Claude Automation',
        details: 'Project Tracker MCP Server initialized successfully.',
        createdAt: new Date().toISOString(),
      },
    ],
    timeEntries: [],
    timer: {
      status: 'Stopped',
      elapsedSeconds: 0,
      projectId: null,
      projectName: null,
      taskId: null,
      taskTitle: null,
      startedAt: null,
    },
  };
}

function loadStore() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    log('Error loading local store, creating new:', err.message);
  }
  const init = getInitialStore();
  saveStore(init);
  return init;
}

function saveStore(store) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (err) {
    log('Error saving local store:', err.message);
  }
}

// ---------------------------------------------------------------------------
// Backend API Helper (with graceful fallback to local store)
// ---------------------------------------------------------------------------

async function apiRequest(endpoint, method = 'GET', data = null) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    };
    if (data && ['POST', 'PUT'].includes(method)) {
      options.body = JSON.stringify(data);
    }
    const res = await fetch(`${API_URL}${endpoint}`, options);
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return null; // Backend offline -> fallback to local store
  }
}

// ---------------------------------------------------------------------------
// Tool Implementations
// ---------------------------------------------------------------------------

async function getWorkspaceSummary() {
  const store = loadStore();
  const total = store.projects.length;
  const inProgress = store.projects.filter((p) => p.status === 'In Progress').length;
  const completed = store.projects.filter((p) => p.status === 'Completed').length;

  const totalTasks = store.tasks.length;
  const doneTasks = store.tasks.filter((t) => t.status === 'Done').length;
  const activeTasks = store.tasks.filter((t) => !['Done', 'Cancelled'].includes(t.status)).length;

  const todayStr = new Date().toISOString().slice(0, 10);
  const todaySeconds = store.timeEntries
    .filter((e) => e.startedAt && e.startedAt.startsWith(todayStr))
    .reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0);

  const hours = Math.floor(todaySeconds / 3600);
  const mins = Math.floor((todaySeconds % 3600) / 60);

  return {
    status: 'success',
    metrics: {
      totalProjects: total,
      activeProjects: inProgress,
      completedProjects: completed,
      totalTasks,
      activeTasks,
      completedTasks: doneTasks,
      todayTrackedTime: `${hours}h ${mins}m (${todaySeconds} seconds)`,
      activeTimer: store.timer.status === 'Running' ? store.timer : 'None',
    },
    recentActivities: store.activities.slice(0, 5),
  };
}

async function getProjects({ status } = {}) {
  const store = loadStore();
  let projects = store.projects;
  if (status && status !== 'All') {
    projects = projects.filter((p) => p.status.toLowerCase() === status.toLowerCase());
  }
  return {
    count: projects.length,
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      priority: p.priority,
      currentStage: p.currentStage,
      progress: `${p.progress || 0}%`,
      deadline: p.deadline || 'No deadline',
      taskCount: p.taskCount || 0,
      completedTasks: p.completedTasks || 0,
    })),
  };
}

async function findOrCreateProject({ name, description = '', category = 'Development', technology = '' }) {
  const store = loadStore();
  const lowerName = name.trim().toLowerCase();

  let project = store.projects.find(
    (p) => p.name.toLowerCase() === lowerName || p.name.toLowerCase().includes(lowerName)
  );

  if (project) {
    return {
      status: 'existing',
      message: `Found existing project '${project.name}' (ID: ${project.id})`,
      project,
    };
  }

  // Create new project
  const newId = store.projects.length ? Math.max(...store.projects.map((p) => p.id)) + 1 : 1;
  project = {
    id: newId,
    name: name.trim(),
    description: description || `Automated project tracking for ${name.trim()}`,
    category: category || 'Software Engineering',
    technology: technology || '',
    status: 'In Progress',
    priority: 'High',
    startDate: new Date().toISOString().slice(0, 10),
    deadline: '',
    currentStage: 'Development',
    progress: 0,
    taskCount: 0,
    completedTasks: 0,
    milestoneCount: 0,
  };

  store.projects.push(project);
  store.activities.unshift({
    id: Date.now(),
    action: 'Created project (via AI)',
    entityType: 'Project',
    entityName: project.name,
    details: `Initiated via Antigravity/Claude MCP tool`,
    createdAt: new Date().toISOString(),
  });

  saveStore(store);

  // Sync to backend if available
  apiRequest('/projects', 'POST', project).catch(() => {});

  return {
    status: 'created',
    message: `Created new project '${project.name}' (ID: ${project.id})`,
    project,
  };
}

async function getTasks({ projectName, status } = {}) {
  const store = loadStore();
  let tasks = store.tasks;

  if (projectName) {
    const pLower = projectName.trim().toLowerCase();
    tasks = tasks.filter((t) => (t.projectName || '').toLowerCase().includes(pLower));
  }

  if (status && status !== 'All') {
    tasks = tasks.filter((t) => t.status.toLowerCase() === status.toLowerCase());
  }

  return {
    count: tasks.length,
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      projectName: t.projectName,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate || 'None',
      actualTime: t.actualSeconds ? `${Math.round(t.actualSeconds / 60)} mins` : '0m',
    })),
  };
}

async function createTask({ projectName, title, description = '', priority = 'Medium', dueDate = '' }) {
  const store = loadStore();
  const projRes = await findOrCreateProject({ name: projectName });
  const project = projRes.project;

  const newId = store.tasks.length ? Math.max(...store.tasks.map((t) => t.id)) + 1 : 1;
  const todayStr = new Date().toISOString().slice(0, 10);

  const newTask = {
    id: newId,
    title: title.trim(),
    description,
    projectId: project.id,
    projectName: project.name,
    status: 'To Do',
    priority: priority || 'Medium',
    dueDate: dueDate || todayStr,
    actualSeconds: 0,
    createdAt: new Date().toISOString(),
  };

  store.tasks.push(newTask);
  project.taskCount = (project.taskCount || 0) + 1;

  store.activities.unshift({
    id: Date.now(),
    action: 'Created task (via AI)',
    entityType: 'Task',
    entityName: newTask.title,
    details: `Project: ${project.name}`,
    createdAt: new Date().toISOString(),
  });

  saveStore(store);
  apiRequest('/tasks', 'POST', newTask).catch(() => {});

  return {
    status: 'success',
    message: `Created task '${newTask.title}' in project '${project.name}'`,
    task: newTask,
  };
}

async function updateTaskStatus({ taskId, taskTitle, projectName, status, notes = '' }) {
  const store = loadStore();
  let task = null;

  if (taskId) {
    task = store.tasks.find((t) => t.id === taskId);
  } else if (taskTitle) {
    const tLower = taskTitle.trim().toLowerCase();
    task = store.tasks.find((t) => t.title.toLowerCase().includes(tLower));
  }

  if (!task) {
    if (projectName && taskTitle) {
      // Auto-create and mark status
      const created = await createTask({ projectName, title: taskTitle });
      task = created.task;
    } else {
      throw new Error(`Task not found. Provide a valid taskId or taskTitle & projectName.`);
    }
  }

  const oldStatus = task.status;
  task.status = status;
  if (notes) task.notes = (task.notes ? `${task.notes}\n` : '') + notes;

  // Recalculate project completed task count and progress
  const project = store.projects.find((p) => p.id === task.projectId);
  if (project) {
    const projTasks = store.tasks.filter((t) => t.projectId === project.id && t.status !== 'Cancelled');
    const doneTasks = projTasks.filter((t) => t.status === 'Done').length;
    project.completedTasks = doneTasks;
    project.progress = projTasks.length > 0 ? Math.round((doneTasks / projTasks.length) * 100) : 0;
    if (project.progress === 100) project.status = 'Completed';
    else if (project.status === 'Planned') project.status = 'In Progress';
  }

  store.activities.unshift({
    id: Date.now(),
    action: `Updated task to ${status}`,
    entityType: 'Task',
    entityName: task.title,
    details: `${oldStatus} ➔ ${status} (${notes || 'Automated by AI'})`,
    createdAt: new Date().toISOString(),
  });

  saveStore(store);
  apiRequest(`/tasks/${task.id}`, 'PUT', task).catch(() => {});

  return {
    status: 'success',
    message: `Updated task '${task.title}' to '${status}'`,
    task,
    projectProgress: project ? `${project.progress}%` : undefined,
  };
}

async function startTimer({ projectName, taskTitle = '', notes = '' }) {
  const store = loadStore();
  const projRes = await findOrCreateProject({ name: projectName });
  const project = projRes.project;

  let task = null;
  if (taskTitle) {
    task = store.tasks.find(
      (t) => t.projectId === project.id && t.title.toLowerCase().includes(taskTitle.trim().toLowerCase())
    );
    if (!task) {
      const created = await createTask({ projectName: project.name, title: taskTitle });
      task = created.task;
    }
    task.status = 'In Progress';
  }

  const now = new Date();
  store.timer = {
    status: 'Running',
    projectId: project.id,
    projectName: project.name,
    taskId: task ? task.id : null,
    taskTitle: task ? task.title : null,
    startedAt: now.toISOString(),
    elapsedSeconds: 0,
    notes: notes || '',
  };

  store.activities.unshift({
    id: Date.now(),
    action: 'Started timer (via AI)',
    entityType: 'Timer',
    entityName: task ? `${task.title} (${project.name})` : project.name,
    details: `Focus work session started at ${now.toLocaleTimeString()}`,
    createdAt: now.toISOString(),
  });

  saveStore(store);
  apiRequest('/time/timer/start', 'POST', { projectId: project.id, taskId: task?.id }).catch(() => {});

  return {
    status: 'success',
    message: `Active timer started for '${project.name}'${task ? ` on task '${task.title}'` : ''}`,
    timer: store.timer,
  };
}

async function stopTimer({ notes = '' } = {}) {
  const store = loadStore();
  if (store.timer.status !== 'Running' || !store.timer.startedAt) {
    return {
      status: 'idle',
      message: 'No active timer was running.',
      currentTimer: store.timer,
    };
  }

  const started = new Date(store.timer.startedAt);
  const ended = new Date();
  const elapsedSecs = Math.max(10, Math.round((ended.getTime() - started.getTime()) / 1000));

  const newEntry = {
    id: Date.now(),
    projectId: store.timer.projectId,
    projectName: store.timer.projectName || 'Project',
    taskId: store.timer.taskId,
    taskTitle: store.timer.taskTitle || '',
    startedAt: started.toISOString(),
    endedAt: ended.toISOString(),
    durationSeconds: elapsedSecs,
    notes: notes || store.timer.notes || 'Recorded via Antigravity/Claude MCP',
  };

  store.timeEntries.unshift(newEntry);

  // Update task actual seconds if linked
  if (newEntry.taskId) {
    const task = store.tasks.find((t) => t.id === newEntry.taskId);
    if (task) {
      task.actualSeconds = (task.actualSeconds || 0) + elapsedSecs;
    }
  }

  // Reset timer
  const prevTimer = { ...store.timer };
  store.timer = {
    status: 'Stopped',
    elapsedSeconds: 0,
    projectId: null,
    projectName: null,
    taskId: null,
    taskTitle: null,
    startedAt: null,
    notes: '',
  };

  store.activities.unshift({
    id: Date.now(),
    action: 'Completed focus session',
    entityType: 'Time Log',
    entityName: `${Math.round(elapsedSecs / 60)}m on ${prevTimer.projectName}`,
    details: newEntry.notes,
    createdAt: ended.toISOString(),
  });

  saveStore(store);
  apiRequest('/time/entries', 'POST', newEntry).catch(() => {});
  apiRequest('/time/timer/stop', 'POST', {}).catch(() => {});

  const mins = Math.round(elapsedSecs / 60);
  return {
    status: 'success',
    message: `Timer stopped. Logged ${mins > 0 ? `${mins} minutes` : `${elapsedSecs} seconds`} to '${prevTimer.projectName}'`,
    timeEntry: newEntry,
  };
}

async function logWorkSession({ projectName, durationMinutes, taskTitle = '', notes = '', date = '' }) {
  const store = loadStore();
  const projRes = await findOrCreateProject({ name: projectName });
  const project = projRes.project;

  const durationSecs = Math.round(Number(durationMinutes) * 60);
  const now = new Date();
  const baseDate = date ? new Date(`${date}T12:00:00`) : now;
  const startedAt = new Date(baseDate.getTime() - durationSecs * 1000).toISOString();
  const endedAt = baseDate.toISOString();

  let task = null;
  if (taskTitle) {
    task = store.tasks.find(
      (t) => t.projectId === project.id && t.title.toLowerCase().includes(taskTitle.trim().toLowerCase())
    );
    if (!task) {
      const created = await createTask({ projectName: project.name, title: taskTitle });
      task = created.task;
    }
    task.actualSeconds = (task.actualSeconds || 0) + durationSecs;
  }

  const newEntry = {
    id: Date.now(),
    projectId: project.id,
    projectName: project.name,
    taskId: task ? task.id : undefined,
    taskTitle: task ? task.title : undefined,
    startedAt,
    endedAt,
    durationSeconds: durationSecs,
    notes: notes || 'Direct work session logged by AI agent',
  };

  store.timeEntries.unshift(newEntry);

  store.activities.unshift({
    id: Date.now(),
    action: `Logged ${durationMinutes}m work`,
    entityType: 'Time Entry',
    entityName: project.name,
    details: taskTitle ? `Task: ${taskTitle} · ${notes}` : notes,
    createdAt: now.toISOString(),
  });

  saveStore(store);
  apiRequest('/time/entries', 'POST', newEntry).catch(() => {});

  return {
    status: 'success',
    message: `Successfully logged ${durationMinutes} mins to '${project.name}'${taskTitle ? ` (${taskTitle})` : ''}`,
    timeEntry: newEntry,
  };
}

async function logActivity({ projectName, action, details = '' }) {
  const store = loadStore();
  const projRes = await findOrCreateProject({ name: projectName });
  const project = projRes.project;

  const activityItem = {
    id: Date.now(),
    action: action.trim(),
    entityType: 'Project',
    entityName: project.name,
    details: details.trim(),
    createdAt: new Date().toISOString(),
  };

  store.activities.unshift(activityItem);
  saveStore(store);

  return {
    status: 'success',
    message: `Logged activity '${action}' to project '${project.name}'`,
    activity: activityItem,
  };
}

// ---------------------------------------------------------------------------
// Tool Schemas (Model Context Protocol)
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    name: 'tracker_get_workspace_summary',
    description:
      'Get high-level workspace metrics: total projects, active projects, tasks counts (completed vs pending), today logged focus time, and recent activity feed.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'tracker_get_projects',
    description: 'List workspace projects filtered optionally by status (e.g. "In Progress", "Completed", "Planned").',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Filter by status: "All", "In Progress", "Planned", "Completed", "On Hold"',
        },
      },
    },
  },
  {
    name: 'tracker_find_or_create_project',
    description: 'Find an existing project by name (case-insensitive) or automatically create it if it does not exist.',
    inputSchema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', description: 'Name of the project (e.g. "Project Tracker", "E-Commerce App")' },
        description: { type: 'string', description: 'Brief description of the project' },
        category: { type: 'string', description: 'Category (e.g. "Web Application", "Mobile App", "DevOps")' },
        technology: { type: 'string', description: 'Tech stack (e.g. "React, Spring Boot, PostgreSQL")' },
      },
    },
  },
  {
    name: 'tracker_get_tasks',
    description: 'Get tasks from the workspace, filtered optionally by project name and status.',
    inputSchema: {
      type: 'object',
      properties: {
        projectName: { type: 'string', description: 'Filter tasks belonging to this project' },
        status: { type: 'string', description: 'Filter by status: "To Do", "In Progress", "Done", "Blocked"' },
      },
    },
  },
  {
    name: 'tracker_create_task',
    description: 'Create a new task under a project.',
    inputSchema: {
      type: 'object',
      required: ['projectName', 'title'],
      properties: {
        projectName: { type: 'string', description: 'Name of the project' },
        title: { type: 'string', description: 'Title of the task' },
        description: { type: 'string', description: 'Task description' },
        priority: {
          type: 'string',
          enum: ['Low', 'Medium', 'High', 'Urgent', 'Critical'],
          description: 'Task priority level',
        },
        dueDate: { type: 'string', description: 'Due date in YYYY-MM-DD format' },
      },
    },
  },
  {
    name: 'tracker_update_task_status',
    description:
      'Update the status of a task ("To Do", "In Progress", "In Review", "Done", "Blocked", "Cancelled"). Automatically updates project completion percentage.',
    inputSchema: {
      type: 'object',
      required: ['status'],
      properties: {
        taskId: { type: 'number', description: 'The numeric task ID if known' },
        taskTitle: { type: 'string', description: 'The task title if ID is not known' },
        projectName: { type: 'string', description: 'Project name if searching by taskTitle' },
        status: {
          type: 'string',
          enum: ['To Do', 'In Progress', 'In Review', 'Done', 'Blocked', 'Cancelled'],
          description: 'Target task status',
        },
        notes: { type: 'string', description: 'Optional work summary or notes on completion' },
      },
    },
  },
  {
    name: 'tracker_start_timer',
    description: 'Start live work timer on a project and optional task. Indicates focus work has begun.',
    inputSchema: {
      type: 'object',
      required: ['projectName'],
      properties: {
        projectName: { type: 'string', description: 'Name of the project currently being worked on' },
        taskTitle: { type: 'string', description: 'Optional specific task name' },
        notes: { type: 'string', description: 'Optional session intention or note' },
      },
    },
  },
  {
    name: 'tracker_stop_timer',
    description:
      'Stop the active work timer, calculate elapsed duration, and save it as an official Time Entry in the workspace.',
    inputSchema: {
      type: 'object',
      properties: {
        notes: { type: 'string', description: 'Optional note describing what was accomplished during this session' },
      },
    },
  },
  {
    name: 'tracker_log_work_session',
    description:
      'Directly log a completed work session with duration in minutes (e.g. 45 minutes of bug fixing). Automatically updates Weekly Tracked Time chart.',
    inputSchema: {
      type: 'object',
      required: ['projectName', 'durationMinutes'],
      properties: {
        projectName: { type: 'string', description: 'Name of the project' },
        durationMinutes: { type: 'number', description: 'Duration in minutes (e.g. 30, 45, 90)' },
        taskTitle: { type: 'string', description: 'Optional task worked on' },
        notes: { type: 'string', description: 'Notes or summary of the session' },
        date: { type: 'string', description: 'Date in YYYY-MM-DD (defaults to today)' },
      },
    },
  },
  {
    name: 'tracker_log_activity',
    description: 'Log an action or milestone to the project live activity feed on Dashboard and Activity page.',
    inputSchema: {
      type: 'object',
      required: ['projectName', 'action'],
      properties: {
        projectName: { type: 'string', description: 'Name of the project' },
        action: { type: 'string', description: 'Brief action title (e.g. "Refactored UI", "Fixed Auth Bug")' },
        details: { type: 'string', description: 'Detailed notes on what was completed' },
      },
    },
  },
];

// ---------------------------------------------------------------------------
// JSON-RPC 2.0 Dispatcher
// ---------------------------------------------------------------------------

async function handleRpc(request) {
  const { id, method, params } = request;

  switch (method) {
    case 'initialize':
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          serverInfo: {
            name: 'project-tracker-mcp',
            version: '1.0.0',
          },
          capabilities: {
            tools: {},
          },
        },
      };

    case 'notifications/initialized':
      return null; // No response needed

    case 'ping':
      return { jsonrpc: '2.0', id, result: {} };

    case 'tools/list':
      return {
        jsonrpc: '2.0',
        id,
        result: { tools: TOOLS },
      };

    case 'tools/call': {
      const toolName = params?.name;
      const args = params?.arguments || {};

      try {
        let result = null;
        switch (toolName) {
          case 'tracker_get_workspace_summary':
            result = await getWorkspaceSummary();
            break;
          case 'tracker_get_projects':
            result = await getProjects(args);
            break;
          case 'tracker_find_or_create_project':
            result = await findOrCreateProject(args);
            break;
          case 'tracker_get_tasks':
            result = await getTasks(args);
            break;
          case 'tracker_create_task':
            result = await createTask(args);
            break;
          case 'tracker_update_task_status':
            result = await updateTaskStatus(args);
            break;
          case 'tracker_start_timer':
            result = await startTimer(args);
            break;
          case 'tracker_stop_timer':
            result = await stopTimer(args);
            break;
          case 'tracker_log_work_session':
            result = await logWorkSession(args);
            break;
          case 'tracker_log_activity':
            result = await logActivity(args);
            break;
          default:
            throw new Error(`Unknown tool: ${toolName}`);
        }

        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          },
        };
      } catch (err) {
        log(`Error executing tool ${toolName}:`, err.message);
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32603,
            message: err.message,
          },
        };
      }
    }

    default:
      if (id !== undefined) {
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: `Method not found: ${method}`,
          },
        };
      }
      return null;
  }
}

// ---------------------------------------------------------------------------
// Standard I/O Loop
// ---------------------------------------------------------------------------

function startStdio() {
  log('Project Tracker MCP Server started on stdio');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  rl.on('line', async (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    try {
      const request = JSON.parse(trimmed);
      const response = await handleRpc(request);
      if (response) {
        process.stdout.write(JSON.stringify(response) + '\n');
      }
    } catch (err) {
      log('JSON Parse error:', err.message);
      process.stdout.write(
        JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32700,
            message: 'Parse error',
          },
        }) + '\n'
      );
    }
  });

  process.on('SIGINT', () => {
    log('Shutting down MCP Server');
    process.exit(0);
  });
}

startStdio();
