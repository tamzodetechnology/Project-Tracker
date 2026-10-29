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
} from './types';

// Updated storage key to immediately load enriched production tasks
const STORAGE_KEY = 'tamzode_tracker_store_v3';
const LEGACY_STORAGE_KEY_V2 = 'tamzode_tracker_store_v2';
const LEGACY_STORAGE_KEY_V1 = 'tamzode_tracker_store_v1';

const now = new Date();
const pad = (n: number) => String(n).padStart(2, '0');
const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const dayOffset = (days: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return fmtDate(d);
};

// ============================================================================
// CLEAN PRODUCTION DATA: ONLY REAL PROJECTS & TASKS
// ============================================================================

export const DEFAULT_PROJECTS: Project[] = [
  {
    id: 1,
    name: 'Bezent Ecosystem (HRMS & PMS)',
    description: 'Enterprise multi-tenant HRMS & Project Management System (PMS) covering attendance, employee records, tenant administration, and workflow automations.',
    category: 'Enterprise SaaS',
    technology: 'Node.js, TypeScript, Drizzle ORM, MySQL 8.4, React',
    status: 'In Progress',
    priority: 'Critical',
    startDate: dayOffset(-25),
    deadline: dayOffset(20),
    currentStage: 'Development',
    progressMode: 'tasks',
    owner: 'Sureha DJ',
    notes: 'Local dev database configured on MySQL 8.4 (BEZENT-MySQL84). Developing HRMS modules and PMS roadmap.',
    usefulLinks: 'https://github.com/tamzodetechnology/bezent_ecosystem',
    repositoryUrl: 'https://github.com/tamzodetechnology/bezent_ecosystem',
    progress: 60,
    taskCount: 5,
    completedTasks: 2,
    milestoneCount: 2,
  },
  {
    id: 2,
    name: 'Project Tracker SaaS',
    description: 'Modern luxury deep-green project, task, and time telemetry suite with native MCP AI automation for Antigravity and Claude Code.',
    category: 'Developer Productivity Suite',
    technology: 'React 19, TypeScript, Vite, Spring Boot, Neon PostgreSQL, Node.js MCP',
    status: 'In Progress',
    priority: 'Critical',
    startDate: dayOffset(-14),
    deadline: dayOffset(14),
    currentStage: 'Testing',
    progressMode: 'tasks',
    owner: 'Sureha DJ',
    notes: 'Luxury Deep Green · Electric Lime UI, native MCP server, resilient local storage, and Neon PostgreSQL schema.',
    usefulLinks: 'https://github.com/tamzodetechnology/Project-Tracker',
    repositoryUrl: 'https://github.com/tamzodetechnology/Project-Tracker',
    progress: 88,
    taskCount: 10,
    completedTasks: 8,
    milestoneCount: 4,
  },
];

export const DEFAULT_TASKS: Task[] = [
  // Bezent Ecosystem Tasks
  {
    id: 101,
    title: 'MySQL 8.4 DB setup and Drizzle ORM migrations',
    description: 'Configure local mysqld datadir at C:/ProgramData/MySQL/bezent_dev_data and run drizzle migrations.',
    projectId: 1,
    projectName: 'Bezent Ecosystem (HRMS & PMS)',
    status: 'Done',
    priority: 'Critical',
    startDate: dayOffset(-20),
    dueDate: dayOffset(-15),
    estimatedMinutes: 240,
    actualSeconds: 14400,
    assignee: 'Sureha DJ',
    tags: ['Database', 'Drizzle', 'MySQL'],
  },
  {
    id: 102,
    title: 'Attendance module location & security verification',
    description: 'Implement geofenced attendance capture, shift rules, and tamper verification.',
    projectId: 1,
    projectName: 'Bezent Ecosystem (HRMS & PMS)',
    status: 'In Progress',
    priority: 'High',
    startDate: dayOffset(-5),
    dueDate: dayOffset(3),
    estimatedMinutes: 300,
    actualSeconds: 7200,
    assignee: 'Sureha DJ',
    tags: ['Attendance', 'Security'],
  },
  {
    id: 103,
    title: 'Tenant Profile & Multi-company onboarding wizard',
    description: 'Complete Company Details, Tenant Profile, and Administration dashboard atlas.',
    projectId: 1,
    projectName: 'Bezent Ecosystem (HRMS & PMS)',
    status: 'In Progress',
    priority: 'High',
    startDate: dayOffset(-2),
    dueDate: dayOffset(6),
    estimatedMinutes: 220,
    actualSeconds: 3600,
    assignee: 'Sureha DJ',
    tags: ['Tenant', 'UI/UX'],
  },
  {
    id: 104,
    title: 'BEZENT PMS workflow architecture benchmark',
    description: 'Structure Project Manager (PM) and Project Lead (PL) workflow specification maps.',
    projectId: 1,
    projectName: 'Bezent Ecosystem (HRMS & PMS)',
    status: 'Done',
    priority: 'Medium',
    startDate: dayOffset(-10),
    dueDate: dayOffset(-2),
    estimatedMinutes: 180,
    actualSeconds: 10800,
    assignee: 'Sureha DJ',
    tags: ['PMS', 'Workflow'],
  },
  {
    id: 105,
    title: 'Employee records reference and changes audit',
    description: 'Build employee profile history tracking, document uploads, and HRMS verification.',
    projectId: 1,
    projectName: 'Bezent Ecosystem (HRMS & PMS)',
    status: 'To Do',
    priority: 'Medium',
    startDate: dayOffset(2),
    dueDate: dayOffset(12),
    estimatedMinutes: 260,
    actualSeconds: 0,
    assignee: 'Sureha DJ',
    tags: ['HRMS', 'Employee'],
  },

  // Project Tracker Tasks
  {
    id: 201,
    title: 'Luxury Electric Lime & Dark Forest UI Redesign',
    description: 'Elevated all core workspaces (Dashboard, Projects, My Tasks, Calendar) to a luxury executive dark theme with chartreuse highlights and blackened forest surfaces.',
    projectId: 2,
    projectName: 'Project Tracker SaaS',
    status: 'Done',
    priority: 'Critical',
    startDate: dayOffset(-14),
    dueDate: dayOffset(-5),
    estimatedMinutes: 300,
    actualSeconds: 18000,
    assignee: 'Sureha DJ',
    tags: ['UI/UX', 'Design System', 'Frontend'],
  },
  {
    id: 202,
    title: 'Spring Boot REST API & Neon PostgreSQL Entity Mappings',
    description: 'Implemented Spring Boot JPA repositories, REST controllers for Dashboard, Projects, Tasks, and Jackson array serializers for Neon Cloud PostgreSQL.',
    projectId: 2,
    projectName: 'Project Tracker SaaS',
    status: 'Done',
    priority: 'High',
    startDate: dayOffset(-13),
    dueDate: dayOffset(-9),
    estimatedMinutes: 240,
    actualSeconds: 14400,
    assignee: 'Sureha DJ',
    tags: ['Backend', 'Spring Boot', 'PostgreSQL'],
  },
  {
    id: 203,
    title: 'Flyway Database Migration Pipeline (V1-V4)',
    description: 'Automated database schema versioning with Flyway scripts covering projects, tasks, milestones, activities, and time logs.',
    projectId: 2,
    projectName: 'Project Tracker SaaS',
    status: 'Done',
    priority: 'High',
    startDate: dayOffset(-11),
    dueDate: dayOffset(-8),
    estimatedMinutes: 180,
    actualSeconds: 10800,
    assignee: 'Sureha DJ',
    tags: ['Database', 'Flyway', 'Migrations'],
  },
  {
    id: 204,
    title: 'Full-Featured My Tasks & Interactive Kanban Workspace',
    description: 'Built dual-view task management: sortable structured table and 4-column drag/click Kanban board with priority filtering and status tracking.',
    projectId: 2,
    projectName: 'Project Tracker SaaS',
    status: 'Done',
    priority: 'High',
    startDate: dayOffset(-9),
    dueDate: dayOffset(-4),
    estimatedMinutes: 240,
    actualSeconds: 14400,
    assignee: 'Sureha DJ',
    tags: ['Tasks', 'Kanban', 'Telemetry'],
  },
  {
    id: 205,
    title: 'Full-Width 7-Column Calendar & Sprint Deadline Hub',
    description: 'Engineered multi-view calendar (Month, Week, Agenda) with responsive 7-column flex/grid layouts, milestone checkpoint highlights, and day-agenda drawer.',
    projectId: 2,
    projectName: 'Project Tracker SaaS',
    status: 'Done',
    priority: 'High',
    startDate: dayOffset(-7),
    dueDate: dayOffset(0),
    estimatedMinutes: 200,
    actualSeconds: 12000,
    assignee: 'Sureha DJ',
    tags: ['Calendar', 'Deadlines', 'UI'],
  },
  {
    id: 206,
    title: 'Offline-First Resilient Storage Engine & JSON Backup/Restore',
    description: 'Engineered browser LocalStorage engine with automatic fallback when offline, plus instant JSON snapshot export and restore.',
    projectId: 2,
    projectName: 'Project Tracker SaaS',
    status: 'Done',
    priority: 'Medium',
    startDate: dayOffset(-5),
    dueDate: dayOffset(-1),
    estimatedMinutes: 150,
    actualSeconds: 9000,
    assignee: 'Sureha DJ',
    tags: ['Offline', 'Storage', 'Backups'],
  },
  {
    id: 207,
    title: 'Native Stdio MCP Server for Antigravity & Claude Code Automation',
    description: 'Implemented autonomous Model Context Protocol (MCP) server (mcp-server/index.mjs) registered globally in ~/.gemini/config/mcp_config.json with 10 tools.',
    projectId: 2,
    projectName: 'Project Tracker SaaS',
    status: 'Done',
    priority: 'Critical',
    startDate: dayOffset(-2),
    dueDate: dayOffset(0),
    estimatedMinutes: 180,
    actualSeconds: 10800,
    assignee: 'Sureha DJ',
    tags: ['MCP', 'AI', 'Automation'],
  },
  {
    id: 208,
    title: 'Workspace Purge & Real Projects Integration (Bezent + Tracker)',
    description: 'Cleaned legacy demo data, integrated Bezent Ecosystem HRMS & PMS as primary sibling project, and streamlined navigation/sidebar.',
    projectId: 2,
    projectName: 'Project Tracker SaaS',
    status: 'Done',
    priority: 'Medium',
    startDate: dayOffset(0),
    dueDate: dayOffset(0),
    estimatedMinutes: 120,
    actualSeconds: 7200,
    assignee: 'Sureha DJ',
    tags: ['Refactoring', 'Cleanup', 'Bezent'],
  },
  {
    id: 209,
    title: 'Automated Git Hook Telemetry & Work Session Logger',
    description: 'Background daemon logger that automatically captures git commit messages, file edits, and active coding sessions into the tracker.',
    projectId: 2,
    projectName: 'Project Tracker SaaS',
    status: 'In Progress',
    priority: 'High',
    startDate: dayOffset(0),
    dueDate: dayOffset(6),
    estimatedMinutes: 240,
    actualSeconds: 3600,
    assignee: 'Sureha DJ',
    tags: ['Git', 'Automation', 'Telemetry'],
  },
  {
    id: 210,
    title: 'Live Neon Cloud PostgreSQL Production Deployment',
    description: 'Deploy Spring Boot service to cloud hosting and establish live PostgreSQL sync bridge.',
    projectId: 2,
    projectName: 'Project Tracker SaaS',
    status: 'To Do',
    priority: 'Medium',
    startDate: dayOffset(6),
    dueDate: dayOffset(14),
    estimatedMinutes: 180,
    actualSeconds: 0,
    assignee: 'Sureha DJ',
    tags: ['Deployment', 'Cloud', 'Neon'],
  },
];

export const DEFAULT_MILESTONES: Milestone[] = [
  {
    id: 101,
    name: 'Phase 1: HRMS Core Architecture & MySQL Database',
    description: 'Multi-tenant database schema, Drizzle ORM baseline, and API tests established.',
    projectId: 1,
    projectName: 'Bezent Ecosystem (HRMS & PMS)',
    targetDate: dayOffset(-5),
    status: 'Completed',
  },
  {
    id: 102,
    name: 'Phase 2: Attendance Security & Multi-Company Wizard',
    description: 'Deploy geofenced biometric/location attendance rules and company onboarding flow.',
    projectId: 1,
    projectName: 'Bezent Ecosystem (HRMS & PMS)',
    targetDate: dayOffset(14),
    status: 'In Progress',
  },
  {
    id: 201,
    name: 'Phase 1: Full-Stack Baseline (Spring Boot, Neon PostgreSQL & Full UI)',
    description: 'Initial architecture with Spring Boot REST API, Neon Cloud PostgreSQL migrations, and React UI.',
    projectId: 2,
    projectName: 'Project Tracker SaaS',
    targetDate: dayOffset(-7),
    status: 'Completed',
  },
  {
    id: 202,
    name: 'Phase 2: Luxury UI Redesign, 7-Column Calendar & Resilient Store',
    description: 'Executive Dark Forest & Electric Lime visual overhaul, full-width calendar, and LocalStorage sync.',
    projectId: 2,
    projectName: 'Project Tracker SaaS',
    targetDate: dayOffset(-1),
    status: 'Completed',
  },
  {
    id: 203,
    name: 'Phase 3: Autonomous AI MCP Server for Antigravity & Claude Code',
    description: 'Zero-touch stdio MCP server for agentic project telemetry, task automation, and work sessions.',
    projectId: 2,
    projectName: 'Project Tracker SaaS',
    targetDate: dayOffset(0),
    status: 'Completed',
  },
  {
    id: 204,
    name: 'Phase 4: Git Hook Automation & Cloud Production Deployment',
    description: 'Background git telemetry auto-logger and cloud deployment for shared developer tracking.',
    projectId: 2,
    projectName: 'Project Tracker SaaS',
    targetDate: dayOffset(14),
    status: 'In Progress',
  },
];

export const DEFAULT_TIME_ENTRIES: TimeEntry[] = [
  {
    id: 101,
    projectId: 1,
    projectName: 'Bezent Ecosystem (HRMS & PMS)',
    taskId: 101,
    taskTitle: 'MySQL 8.4 DB setup and Drizzle ORM migrations',
    startedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    endedAt: new Date(Date.now() - 86400000 * 4 + 3600000 * 4).toISOString(),
    durationSeconds: 14400,
    notes: 'Configured local MySQL 8.4 datadir and ran drizzle migrations.',
  },
  {
    id: 102,
    projectId: 1,
    projectName: 'Bezent Ecosystem (HRMS & PMS)',
    taskId: 104,
    taskTitle: 'BEZENT PMS workflow architecture benchmark',
    startedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    endedAt: new Date(Date.now() - 86400000 * 3 + 3600000 * 3).toISOString(),
    durationSeconds: 10800,
    notes: 'PM and PL workflow maps established.',
  },
  {
    id: 201,
    projectId: 2,
    projectName: 'Project Tracker SaaS',
    taskId: 201,
    taskTitle: 'Luxury Electric Lime & Dark Forest UI Redesign',
    startedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    endedAt: new Date(Date.now() - 86400000 * 5 + 3600000 * 5).toISOString(),
    durationSeconds: 18000,
    notes: 'Full visual elevation across Dashboard, Projects, Tasks, Calendar.',
  },
  {
    id: 202,
    projectId: 2,
    projectName: 'Project Tracker SaaS',
    taskId: 202,
    taskTitle: 'Spring Boot REST API & Neon PostgreSQL Entity Mappings',
    startedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    endedAt: new Date(Date.now() - 86400000 * 4 + 3600000 * 4).toISOString(),
    durationSeconds: 14400,
    notes: 'Neon Cloud PostgreSQL JDBC drivers, Spring Data JPA repositories.',
  },
  {
    id: 203,
    projectId: 2,
    projectName: 'Project Tracker SaaS',
    taskId: 203,
    taskTitle: 'Flyway Database Migration Pipeline (V1-V4)',
    startedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    endedAt: new Date(Date.now() - 86400000 * 3 + 3600000 * 3).toISOString(),
    durationSeconds: 10800,
    notes: 'Flyway migrations V1 to V4 with auto table indexing.',
  },
  {
    id: 204,
    projectId: 2,
    projectName: 'Project Tracker SaaS',
    taskId: 204,
    taskTitle: 'Full-Featured My Tasks & Interactive Kanban Workspace',
    startedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    endedAt: new Date(Date.now() - 86400000 * 2 + 3600000 * 4).toISOString(),
    durationSeconds: 14400,
    notes: 'Kanban columns with priority tags and task update mutations.',
  },
  {
    id: 205,
    projectId: 2,
    projectName: 'Project Tracker SaaS',
    taskId: 205,
    taskTitle: 'Full-Width 7-Column Calendar & Sprint Deadline Hub',
    startedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    endedAt: new Date(Date.now() - 86400000 * 1 + 3600000 * 3.3).toISOString(),
    durationSeconds: 12000,
    notes: 'Month, Week, Agenda views with full-width 7-column layout.',
  },
  {
    id: 206,
    projectId: 2,
    projectName: 'Project Tracker SaaS',
    taskId: 206,
    taskTitle: 'Offline-First Resilient Storage Engine & JSON Backup/Restore',
    startedAt: new Date(Date.now() - 86400000 * 1 + 3600000 * 4).toISOString(),
    endedAt: new Date(Date.now() - 86400000 * 1 + 3600000 * 6.5).toISOString(),
    durationSeconds: 9000,
    notes: 'Resilient browser LocalStorage synchronization and backup export.',
  },
  {
    id: 207,
    projectId: 2,
    projectName: 'Project Tracker SaaS',
    taskId: 207,
    taskTitle: 'Native Stdio MCP Server for Antigravity & Claude Code Automation',
    startedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    endedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    durationSeconds: 10800,
    notes: '10 MCP tools registered globally in ~/.gemini/config/mcp_config.json.',
  },
  {
    id: 208,
    projectId: 2,
    projectName: 'Project Tracker SaaS',
    taskId: 208,
    taskTitle: 'Workspace Purge & Real Projects Integration (Bezent + Tracker)',
    startedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    endedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    durationSeconds: 7200,
    notes: 'Purged all dummy projects, integrated Bezent Ecosystem HRMS & PMS.',
  },
  {
    id: 209,
    projectId: 2,
    projectName: 'Project Tracker SaaS',
    taskId: 209,
    taskTitle: 'Automated Git Hook Telemetry & Work Session Logger',
    startedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    endedAt: new Date().toISOString(),
    durationSeconds: 3600,
    notes: 'Background session tracking and commit telemetry integration.',
  },
];

export const DEFAULT_ACTIVITIES: ActivityItem[] = [
  {
    id: 1,
    action: 'MCP Server Connected',
    entityType: 'System',
    entityName: 'Antigravity / Claude Automation',
    details: 'Project Tracker MCP server registered globally.',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 2,
    action: 'Completed task',
    entityType: 'Task',
    entityName: 'Model Context Protocol (MCP) Server Setup',
    details: '10 autonomous agent tools published in Project Tracker SaaS',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 3,
    action: 'Completed task',
    entityType: 'Task',
    entityName: 'Luxury UI Overhaul (Dashboard, Projects, Tasks, Calendar)',
    details: 'Visual elevation completed across all core screens',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 4,
    action: 'Completed task',
    entityType: 'Task',
    entityName: 'MySQL 8.4 DB setup and Drizzle ORM migrations',
    details: 'Database baseline operational in Bezent Ecosystem',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

export interface WorkspaceData {
  projects: Project[];
  tasks: Task[];
  milestones: Milestone[];
  timeEntries: TimeEntry[];
  activities: ActivityItem[];
  timer: TimerState;
  workspaceName?: string;
  companyName?: string;
  userDisplayName?: string;
}

export function calculateWorkspaceMetrics(
  projects: Project[],
  tasks: Task[],
  milestones: Milestone[],
  timeEntries: TimeEntry[]
): {
  metrics: WorkspaceMetrics;
  weeklyHours: ChartDayItem[];
  timeByProject: ChartProjectItem[];
  taskStatus: ChartStatusItem[];
  completedTrend: ChartTrendItem[];
} {
  const todayStr = fmtDate(now);
  const weekAhead = new Date(now);
  weekAhead.setDate(weekAhead.getDate() + 7);
  const weekAheadStr = fmtDate(weekAhead);

  const nonCancelledTasks = tasks.filter((t) => t.status !== 'Cancelled');
  const activeProjects = projects.filter((p) => p.status === 'In Progress' || p.status === 'Planned');
  const completedTasks = nonCancelledTasks.filter((t) => t.status === 'Done');
  const pendingTasks = nonCancelledTasks.filter((t) => t.status !== 'Done');
  const overdueTasks = pendingTasks.filter((t) => t.dueDate && t.dueDate < todayStr);
  const upcomingTasks = pendingTasks.filter((t) => t.dueDate && t.dueDate >= todayStr && t.dueDate <= weekAheadStr);

  const totalTimeSeconds = timeEntries.reduce((acc, e) => acc + (e.durationSeconds || 0), 0);

  const metrics: WorkspaceMetrics = {
    total: projects.length,
    active: activeProjects.length,
    completed: completedTasks.length,
    pending: pendingTasks.length,
    upcoming: upcomingTasks.length,
    overdue: overdueTasks.length,
    inProgress: nonCancelledTasks.filter((t) => t.status === 'In Progress').length,
    blocked: nonCancelledTasks.filter((t) => t.status === 'Blocked').length,
    upcomingMilestones: milestones.filter((m) => m.status !== 'Completed').length,
    totalTimeSeconds,
  };

  // Weekly hours (last 7 days)
  const weeklyHours: ChartDayItem[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dStr = fmtDate(d);
    const daySeconds = timeEntries
      .filter((e) => e.startedAt.slice(0, 10) === dStr)
      .reduce((sum, e) => sum + (e.durationSeconds || 0), 0);
    weeklyHours.push({
      date: dStr,
      seconds: daySeconds,
    });
  }

  // Time by project
  const projectMap: Record<number, { name: string; seconds: number }> = {};
  projects.forEach((p) => {
    projectMap[p.id] = { name: p.name, seconds: 0 };
  });
  timeEntries.forEach((e) => {
    if (projectMap[e.projectId]) {
      projectMap[e.projectId].seconds += e.durationSeconds || 0;
    } else {
      projectMap[e.projectId] = { name: e.projectName || 'Project', seconds: e.durationSeconds || 0 };
    }
  });
  const timeByProject: ChartProjectItem[] = Object.entries(projectMap).map(([id, val]) => ({
    projectId: Number(id),
    projectName: val.name,
    seconds: val.seconds,
  }));

  // Status breakdown
  const statusCounts: Record<string, number> = {
    Done: 0,
    'In Progress': 0,
    'To Do': 0,
    'In Review': 0,
    Blocked: 0,
  };
  nonCancelledTasks.forEach((t) => {
    if (statusCounts[t.status] !== undefined) {
      statusCounts[t.status]++;
    }
  });
  const taskStatus: ChartStatusItem[] = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
  }));

  // Completed task trend (last 7 days)
  const completedTrend: ChartTrendItem[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dStr = fmtDate(d);
    const count = completedTasks.filter((t) => (t.updatedAt || t.dueDate || '').slice(0, 10) === dStr).length;
    completedTrend.push({
      date: dStr,
      count,
    });
  }

  return { metrics, weeklyHours, timeByProject, taskStatus, completedTrend };
}

export function loadWorkspaceData(): WorkspaceData {
  try {
    // Purge legacy storage keys if present
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(LEGACY_STORAGE_KEY_V1);
      localStorage.removeItem(LEGACY_STORAGE_KEY_V2);
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.projects && parsed.tasks) {
          // Ensure ONLY real projects exist
          const hasDummy = parsed.projects.some(
            (p: any) =>
              p.name.includes('Mobile App') ||
              p.name.includes('Neon Cloud') ||
              p.name.includes('AI Analytics') ||
              p.name.includes('Brand Refresh')
          );
          if (!hasDummy && parsed.projects.length > 0) {
            return parsed;
          }
        }
      }
    }
  } catch (e) {
    console.warn('Could not read from local storage, falling back to clean default seed', e);
  }

  const defaultData: WorkspaceData = {
    projects: DEFAULT_PROJECTS,
    tasks: DEFAULT_TASKS,
    milestones: DEFAULT_MILESTONES,
    timeEntries: DEFAULT_TIME_ENTRIES,
    activities: DEFAULT_ACTIVITIES,
    timer: { status: 'Stopped', elapsedSeconds: 0 },
    workspaceName: 'Tamzode Technology',
    companyName: 'Bezent Group',
    userDisplayName: 'Sureha DJ',
  };
  saveWorkspaceData(defaultData);
  return defaultData;
}

export function saveWorkspaceData(data: WorkspaceData): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch (e) {
    console.error('Failed to save to local storage', e);
  }
}

export function resetWorkspaceData(): WorkspaceData {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY_V1);
    localStorage.removeItem(LEGACY_STORAGE_KEY_V2);
  }
  return loadWorkspaceData();
}

export function purgeDummyData(): WorkspaceData {
  return resetWorkspaceData();
}

export function downloadBackupJson(data: WorkspaceData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tamzode-workspace-backup-${fmtDate(new Date())}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportTimeEntriesCsv(timeEntries: TimeEntry[]): void {
  const headers = ['ID', 'Project', 'Task', 'Started At', 'Ended At', 'Duration (Seconds)', 'Duration (Hours)', 'Notes'];
  const rows = timeEntries.map((e) => [
    e.id,
    `"${(e.projectName || '').replace(/"/g, '""')}"`,
    `"${(e.taskTitle || '').replace(/"/g, '""')}"`,
    e.startedAt,
    e.endedAt,
    e.durationSeconds,
    (e.durationSeconds / 3600).toFixed(2),
    `"${(e.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tamzode-time-entries-${fmtDate(new Date())}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
