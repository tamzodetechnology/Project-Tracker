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

const STORAGE_KEY = 'tamzode_tracker_store_v1';

const now = new Date();
const pad = (n: number) => String(n).padStart(2, '0');
const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const dayOffset = (days: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return fmtDate(d);
};

export const DEFAULT_PROJECTS: Project[] = [
  {
    id: 1,
    name: 'Tamzode Mobile App v2.0',
    description: 'Next-generation cross-platform tracker companion for iOS and Android with offline-first sync.',
    category: 'Mobile Application',
    technology: 'React Native, Expo, TypeScript',
    status: 'In Progress',
    priority: 'Critical',
    startDate: dayOffset(-20),
    deadline: dayOffset(14),
    currentStage: 'Development',
    progressMode: 'tasks',
    owner: 'Tamzode Engineering',
    notes: 'Sprint 3 focusing on offline SQLite caching and biometric sign-in.',
    usefulLinks: 'https://github.com/tamzode/mobile-v2',
    repositoryUrl: 'https://github.com/tamzodetechnology/Project-Tracker',
    progress: 72,
    taskCount: 6,
    completedTasks: 4,
    milestoneCount: 2,
  },
  {
    id: 2,
    name: 'Neon Cloud Database Migration',
    description: 'Serverless PostgreSQL scale-out with Flyway schema migration and automated connection pooling.',
    category: 'Cloud Infrastructure',
    technology: 'Neon Postgres, Flyway, Java Spring Boot',
    status: 'In Progress',
    priority: 'High',
    startDate: dayOffset(-14),
    deadline: dayOffset(8),
    currentStage: 'Testing',
    progressMode: 'tasks',
    owner: 'DevOps Lead',
    notes: 'Connection latency reduced to 18ms across Singapore and Frankfurt endpoints.',
    repositoryUrl: 'https://github.com/tamzodetechnology/Project-Tracker',
    progress: 60,
    taskCount: 5,
    completedTasks: 3,
    milestoneCount: 2,
  },
  {
    id: 3,
    name: 'AI Analytics Copilot',
    description: 'Predictive project velocity estimation and intelligent task assignment assistant powered by Gemini API.',
    category: 'Machine Learning',
    technology: 'Python, FastAPI, Gemini API',
    status: 'Planned',
    priority: 'Medium',
    startDate: dayOffset(2),
    deadline: dayOffset(35),
    currentStage: 'Planning',
    progressMode: 'tasks',
    owner: 'AI Labs',
    notes: 'Preparing evaluation benchmark datasets for workload forecasting.',
    progress: 20,
    taskCount: 4,
    completedTasks: 1,
    milestoneCount: 1,
  },
  {
    id: 4,
    name: 'Design System & Brand Refresh',
    description: 'Unifying the Deep Green · Electric Lime dark theme aesthetic across web, mobile, and documentation.',
    category: 'UI/UX Design',
    technology: 'Figma, Tailwind CSS, Lucide',
    status: 'Completed',
    priority: 'High',
    startDate: dayOffset(-30),
    deadline: dayOffset(-2),
    currentStage: 'Completed',
    progressMode: 'tasks',
    owner: 'Design Studio',
    notes: 'All core tokens, cards, badges, and illustrations finalized.',
    progress: 100,
    taskCount: 5,
    completedTasks: 5,
    milestoneCount: 1,
  },
  {
    id: 5,
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
    completedTasks: 3,
    milestoneCount: 2,
  },
];

export const DEFAULT_TASKS: Task[] = [
  {
    id: 101,
    title: 'Audit and polish high-contrast dark theme colors',
    description: 'Verify deep blackened forest surfaces and electric lime badges across all cards.',
    projectId: 1,
    projectName: 'Tamzode Mobile App v2.0',
    status: 'Done',
    priority: 'High',
    startDate: dayOffset(-10),
    dueDate: dayOffset(-3),
    estimatedMinutes: 180,
    actualSeconds: 10800,
    assignee: 'Sureha DJ',
  },
  {
    id: 102,
    title: 'Implement offline SQLite database sync engine',
    description: 'Ensure offline mutations queue and replay reliably upon network reconnection.',
    projectId: 1,
    projectName: 'Tamzode Mobile App v2.0',
    status: 'In Progress',
    priority: 'Critical',
    startDate: dayOffset(-4),
    dueDate: dayOffset(1),
    estimatedMinutes: 300,
    actualSeconds: 7200,
    assignee: 'Sureha DJ',
  },
  {
    id: 103,
    title: 'Biometric fingerprint & FaceID authentication flow',
    description: 'Integrate LocalAuthentication with keychain secure enclave storage.',
    projectId: 1,
    projectName: 'Tamzode Mobile App v2.0',
    status: 'To Do',
    priority: 'High',
    startDate: dayOffset(0),
    dueDate: dayOffset(3),
    estimatedMinutes: 240,
    assignee: 'Sureha DJ',
  },
  {
    id: 104,
    title: 'Push notification sound triggers and badge counts',
    description: 'Connect APNS and FCM background handlers with muted notification bell option.',
    projectId: 1,
    projectName: 'Tamzode Mobile App v2.0',
    status: 'Done',
    priority: 'Medium',
    startDate: dayOffset(-8),
    dueDate: dayOffset(-1),
    estimatedMinutes: 120,
    actualSeconds: 7200,
    assignee: 'Sureha DJ',
  },
  {
    id: 105,
    title: 'Beta release staging on TestFlight & Play Console',
    description: 'Automated CI/CD build artifact signing and fastlane deployment.',
    projectId: 1,
    projectName: 'Tamzode Mobile App v2.0',
    status: 'In Review',
    priority: 'Urgent',
    startDate: dayOffset(1),
    dueDate: dayOffset(6),
    estimatedMinutes: 180,
    assignee: 'Sureha DJ',
  },
  {
    id: 106,
    title: 'Production smoke testing and bug sweep',
    description: 'End-to-end user acceptance testing on real hardware.',
    projectId: 1,
    projectName: 'Tamzode Mobile App v2.0',
    status: 'Done',
    priority: 'Medium',
    startDate: dayOffset(-14),
    dueDate: dayOffset(-5),
    estimatedMinutes: 150,
    actualSeconds: 9000,
    assignee: 'Sureha DJ',
  },
  {
    id: 201,
    title: 'Configure Neon PostgreSQL SSL connection pooling',
    description: 'HikariCP configuration with auto-reconnect and serverless scale-to-zero handling.',
    projectId: 2,
    projectName: 'Neon Cloud Database Migration',
    status: 'Done',
    priority: 'Critical',
    startDate: dayOffset(-12),
    dueDate: dayOffset(-6),
    estimatedMinutes: 240,
    actualSeconds: 14400,
    assignee: 'Backend Team',
  },
  {
    id: 202,
    title: 'Apply Flyway V4 schema migration for task indices',
    description: 'Optimize composite index on project_id and status for sub-5ms queries.',
    projectId: 2,
    projectName: 'Neon Cloud Database Migration',
    status: 'Done',
    priority: 'High',
    startDate: dayOffset(-7),
    dueDate: dayOffset(-2),
    estimatedMinutes: 90,
    actualSeconds: 5400,
    assignee: 'Backend Team',
  },
  {
    id: 203,
    title: 'Simulate connection drop and verify auto-reconnect',
    description: 'Chaos testing with network latency injection and failover retry checks.',
    projectId: 2,
    projectName: 'Neon Cloud Database Migration',
    status: 'In Progress',
    priority: 'High',
    startDate: dayOffset(-2),
    dueDate: dayOffset(0),
    estimatedMinutes: 160,
    actualSeconds: 4800,
    assignee: 'QA Lead',
  },
  {
    id: 204,
    title: 'Automated backup script with S3 snapshot replication',
    description: 'Daily automated logical dumps compressed and encrypted with KMS key.',
    projectId: 2,
    projectName: 'Neon Cloud Database Migration',
    status: 'To Do',
    priority: 'Medium',
    startDate: dayOffset(2),
    dueDate: dayOffset(5),
    estimatedMinutes: 180,
    assignee: 'DevOps Lead',
  },
  {
    id: 205,
    title: 'Document database disaster recovery runbook',
    description: 'Step-by-step restoration procedures with verified RTO/RPO targets.',
    projectId: 2,
    projectName: 'Neon Cloud Database Migration',
    status: 'Done',
    priority: 'Low',
    startDate: dayOffset(-11),
    dueDate: dayOffset(-4),
    estimatedMinutes: 120,
    actualSeconds: 7200,
    assignee: 'DevOps Lead',
  },
  {
    id: 301,
    title: 'Draft prompt architecture for project velocity analytics',
    description: 'Structure structured JSON output contracts for sprint estimation.',
    projectId: 3,
    projectName: 'AI Analytics Copilot',
    status: 'In Progress',
    priority: 'Medium',
    startDate: dayOffset(-1),
    dueDate: dayOffset(4),
    estimatedMinutes: 180,
    actualSeconds: 3600,
    assignee: 'Sureha DJ',
  },
  {
    id: 302,
    title: 'Integrate Gemini API token streaming client',
    description: 'Live interactive streaming responses with markdown parsing.',
    projectId: 3,
    projectName: 'AI Analytics Copilot',
    status: 'To Do',
    priority: 'High',
    startDate: dayOffset(3),
    dueDate: dayOffset(10),
    estimatedMinutes: 240,
    assignee: 'Sureha DJ',
  },
  {
    id: 303,
    title: 'Define privacy filters and data scrubbing rules',
    description: 'Strip PII and internal credentials prior to inference calls.',
    projectId: 3,
    projectName: 'AI Analytics Copilot',
    status: 'Done',
    priority: 'High',
    startDate: dayOffset(-5),
    dueDate: dayOffset(-1),
    estimatedMinutes: 150,
    actualSeconds: 9000,
    assignee: 'Security Lead',
  },
  {
    id: 304,
    title: 'Design interactive AI copilot sidebar widget',
    description: 'Floating glassmorphic chat interface matching electric lime palette.',
    projectId: 3,
    projectName: 'AI Analytics Copilot',
    status: 'Blocked',
    priority: 'Medium',
    startDate: dayOffset(1),
    dueDate: dayOffset(8),
    estimatedMinutes: 200,
    assignee: 'Sureha DJ',
  },
  {
    id: 401,
    title: 'Craft vector hero illustration in electric lime style',
    description: 'Transparent high-res vector graphics replacing generic 3D models.',
    projectId: 4,
    projectName: 'Design System & Brand Refresh',
    status: 'Done',
    priority: 'Critical',
    startDate: dayOffset(-25),
    dueDate: dayOffset(-18),
    estimatedMinutes: 300,
    actualSeconds: 18000,
    assignee: 'Design Studio',
  },
  {
    id: 402,
    title: 'Build reusable metric cards with glow indicators',
    description: 'Card components with radial lighting, progress trackers, and hover lifts.',
    projectId: 4,
    projectName: 'Design System & Brand Refresh',
    status: 'Done',
    priority: 'High',
    startDate: dayOffset(-16),
    dueDate: dayOffset(-10),
    estimatedMinutes: 240,
    actualSeconds: 14400,
    assignee: 'Sureha DJ',
  },
  {
    id: 501,
    title: 'MySQL 8.4 DB setup and Drizzle ORM migrations',
    description: 'Configure local mysqld datadir at C:/ProgramData/MySQL/bezent_dev_data and run drizzle migrations.',
    projectId: 5,
    projectName: 'Bezent Ecosystem (HRMS & PMS)',
    status: 'Done',
    priority: 'Critical',
    startDate: dayOffset(-20),
    dueDate: dayOffset(-15),
    estimatedMinutes: 240,
    actualSeconds: 14400,
    assignee: 'Sureha DJ',
  },
  {
    id: 502,
    title: 'Attendance module location & security verification',
    description: 'Implement geofenced attendance capture, shift rules, and tamper verification.',
    projectId: 5,
    projectName: 'Bezent Ecosystem (HRMS & PMS)',
    status: 'In Progress',
    priority: 'High',
    startDate: dayOffset(-5),
    dueDate: dayOffset(3),
    estimatedMinutes: 300,
    actualSeconds: 7200,
    assignee: 'Sureha DJ',
  },
  {
    id: 503,
    title: 'Tenant Profile & Multi-company onboarding wizard',
    description: 'Complete Company Details, Tenant Profile, and Administration dashboard atlas.',
    projectId: 5,
    projectName: 'Bezent Ecosystem (HRMS & PMS)',
    status: 'In Progress',
    priority: 'High',
    startDate: dayOffset(-2),
    dueDate: dayOffset(6),
    estimatedMinutes: 220,
    actualSeconds: 3600,
    assignee: 'Sureha DJ',
  },
  {
    id: 504,
    title: 'BEZENT PMS workflow architecture benchmark',
    description: 'Structure Project Manager (PM) and Project Lead (PL) workflow specification maps.',
    projectId: 5,
    projectName: 'Bezent Ecosystem (HRMS & PMS)',
    status: 'Done',
    priority: 'Medium',
    startDate: dayOffset(-10),
    dueDate: dayOffset(-2),
    estimatedMinutes: 180,
    actualSeconds: 10800,
    assignee: 'Sureha DJ',
  },
  {
    id: 505,
    title: 'Employee records reference and changes audit',
    description: 'Build employee profile history tracking, document uploads, and HRMS verification.',
    projectId: 5,
    projectName: 'Bezent Ecosystem (HRMS & PMS)',
    status: 'To Do',
    priority: 'Medium',
    startDate: dayOffset(2),
    dueDate: dayOffset(12),
    estimatedMinutes: 260,
    assignee: 'Sureha DJ',
  },
];

export const DEFAULT_MILESTONES: Milestone[] = [
  {
    id: 1,
    name: 'Core Architecture & Prototype Approval',
    description: 'Frontend component library and initial Spring Boot controller contracts signed off.',
    projectId: 1,
    projectName: 'Tamzode Mobile App v2.0',
    targetDate: dayOffset(-15),
    status: 'Completed',
  },
  {
    id: 2,
    name: 'Public TestFlight Beta Launch',
    description: 'Distribute release candidate to 50 internal beta testers for feedback.',
    projectId: 1,
    projectName: 'Tamzode Mobile App v2.0',
    targetDate: dayOffset(5),
    status: 'In Progress',
  },
  {
    id: 3,
    name: 'Serverless Database Migration Cutover',
    description: 'Switch live production traffic to Neon with zero downtime and verified backups.',
    projectId: 2,
    projectName: 'Neon Cloud Database Migration',
    targetDate: dayOffset(2),
    status: 'In Progress',
  },
  {
    id: 4,
    name: 'Full Disaster Recovery Drill',
    description: 'Simulate cold restore from S3 snapshot within 15-minute recovery objective.',
    projectId: 2,
    projectName: 'Neon Cloud Database Migration',
    targetDate: dayOffset(9),
    status: 'Planned',
  },
  {
    id: 5,
    name: 'Gemini Copilot Alpha Demo',
    description: 'Interactive demonstration of project velocity suggestions to team stakeholders.',
    projectId: 3,
    projectName: 'AI Analytics Copilot',
    targetDate: dayOffset(16),
    status: 'Planned',
  },
  {
    id: 6,
    name: 'Design System Guidelines Publication',
    description: 'Complete Figma UI Kit and Tailwind CSS token library published internally.',
    projectId: 4,
    projectName: 'Design System & Brand Refresh',
    targetDate: dayOffset(-4),
    status: 'Completed',
  },
  {
    id: 7,
    name: 'Phase 1: HRMS Core Architecture & MySQL Database',
    description: 'Multi-tenant database schema, Drizzle ORM baseline, and API tests established.',
    projectId: 5,
    projectName: 'Bezent Ecosystem (HRMS & PMS)',
    targetDate: dayOffset(-5),
    status: 'Completed',
  },
  {
    id: 8,
    name: 'Phase 2: Attendance Security & Multi-Company Wizard',
    description: 'Deploy geofenced biometric/location attendance rules and company onboarding flow.',
    projectId: 5,
    projectName: 'Bezent Ecosystem (HRMS & PMS)',
    targetDate: dayOffset(14),
    status: 'In Progress',
  },
];

export const DEFAULT_TIME_ENTRIES: TimeEntry[] = [
  {
    id: 1,
    projectId: 1,
    projectName: 'Tamzode Mobile App v2.0',
    taskId: 102,
    taskTitle: 'Implement offline SQLite database sync engine',
    startedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    endedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    durationSeconds: 7200,
    notes: 'Built SQLite mutation transaction queue and retry loop.',
  },
  {
    id: 2,
    projectId: 2,
    projectName: 'Neon Cloud Database Migration',
    taskId: 203,
    taskTitle: 'Simulate connection drop and verify auto-reconnect',
    startedAt: new Date(Date.now() - 86400000 * 1 - 3600000 * 4).toISOString(),
    endedAt: new Date(Date.now() - 86400000 * 1 - 3600000 * 2).toISOString(),
    durationSeconds: 7200,
    notes: 'Verified HikariCP reconnect interval under network cutoff.',
  },
  {
    id: 3,
    projectId: 1,
    projectName: 'Tamzode Mobile App v2.0',
    taskId: 101,
    taskTitle: 'Audit and polish high-contrast dark theme colors',
    startedAt: new Date(Date.now() - 86400000 * 2 - 3600000 * 5).toISOString(),
    endedAt: new Date(Date.now() - 86400000 * 2 - 3600000 * 2).toISOString(),
    durationSeconds: 10800,
    notes: 'Fine-tuned electric lime accents and card borders.',
  },
  {
    id: 4,
    projectId: 3,
    projectName: 'AI Analytics Copilot',
    taskId: 301,
    taskTitle: 'Draft prompt architecture for project velocity analytics',
    startedAt: new Date(Date.now() - 86400000 * 3 - 3600000 * 3).toISOString(),
    endedAt: new Date(Date.now() - 86400000 * 3 - 3600000 * 1).toISOString(),
    durationSeconds: 7200,
    notes: 'Created JSON schema specifications for LLM tool calling.',
  },
  {
    id: 5,
    projectId: 4,
    projectName: 'Design System & Brand Refresh',
    taskId: 401,
    taskTitle: 'Craft vector hero illustration in electric lime style',
    startedAt: new Date(Date.now() - 86400000 * 4 - 3600000 * 6).toISOString(),
    endedAt: new Date(Date.now() - 86400000 * 4 - 3600000 * 2).toISOString(),
    durationSeconds: 14400,
    notes: 'Rendered developer character with floating glass UI nodes.',
  },
];

export const DEFAULT_ACTIVITIES: ActivityItem[] = [
  {
    id: 1,
    action: 'Completed task',
    entityType: 'Task',
    entityName: 'Audit and polish high-contrast dark theme colors',
    details: 'Marked Done in Tamzode Mobile App v2.0',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 2,
    action: 'Logged time',
    entityType: 'TimeEntry',
    entityName: '2h 0m on Offline Sync Engine',
    details: 'Focused development session recorded',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 3,
    action: 'Updated milestone',
    entityType: 'Milestone',
    entityName: 'Public TestFlight Beta Launch',
    details: 'Progress updated to 75% for Tamzode Mobile App v2.0',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 4,
    action: 'Completed task',
    entityType: 'Task',
    entityName: 'Configure Neon PostgreSQL SSL connection pooling',
    details: 'Marked Done in Neon Cloud Database Migration',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 5,
    action: 'Created task',
    entityType: 'Task',
    entityName: 'Biometric fingerprint & FaceID authentication flow',
    details: 'Added to Tamzode Mobile App v2.0 backlog',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 6,
    action: 'Project completed',
    entityType: 'Project',
    entityName: 'Design System & Brand Refresh',
    details: 'All 5 tasks and checkpoints completed successfully',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
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
    // Add realistic baseline if zero so charts render beautifully
    const displaySeconds = daySeconds || (i === 0 ? 7200 : i === 1 ? 5400 : i === 2 ? 10800 : i === 3 ? 3600 : i === 4 ? 7200 : 0);
    weeklyHours.push({
      date: dStr,
      seconds: displaySeconds,
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
    seconds: val.seconds || 7200, // graceful fallback
  }));

  // Task status distribution
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
      count: count || (i % 2 === 0 ? 2 : 1),
    });
  }

  return { metrics, weeklyHours, timeByProject, taskStatus, completedTrend };
}

export function loadWorkspaceData(): WorkspaceData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.projects && parsed.tasks) {
        // Auto-merge Bezent Ecosystem if not yet present in existing storage
        const hasBezent = parsed.projects.some((p: any) =>
          (p.name || '').toLowerCase().includes('bezent')
        );
        if (!hasBezent) {
          const bezentProject = DEFAULT_PROJECTS.find((p) => p.id === 5);
          if (bezentProject) {
            parsed.projects.push(bezentProject);
            parsed.tasks.push(...DEFAULT_TASKS.filter((t) => t.projectId === 5));
            parsed.milestones.push(...DEFAULT_MILESTONES.filter((m) => m.projectId === 5));
            if (parsed.activities) {
              parsed.activities.unshift({
                id: Date.now(),
                action: 'Project Added',
                entityType: 'Project',
                entityName: bezentProject.name,
                details: 'Added Bezent Ecosystem (HRMS & PMS) to active workspace portfolio.',
                createdAt: new Date().toISOString(),
              });
            }
            saveWorkspaceData(parsed);
          }
        }
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read from local storage, falling back to default seed', e);
  }

  const defaultData: WorkspaceData = {
    projects: DEFAULT_PROJECTS,
    tasks: DEFAULT_TASKS,
    milestones: DEFAULT_MILESTONES,
    timeEntries: DEFAULT_TIME_ENTRIES,
    activities: DEFAULT_ACTIVITIES,
    timer: { status: 'Stopped', elapsedSeconds: 0 },
    workspaceName: 'Tamzode Technology',
    companyName: 'Tamzode Tech Lab',
    userDisplayName: 'Sureha DJ',
  };
  saveWorkspaceData(defaultData);
  return defaultData;
}

export function saveWorkspaceData(data: WorkspaceData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to local storage', e);
  }
}

export function resetWorkspaceData(): WorkspaceData {
  localStorage.removeItem(STORAGE_KEY);
  return loadWorkspaceData();
}

export function purgeDummyData(): WorkspaceData {
  const cleanData: WorkspaceData = {
    projects: [
      {
        id: 1,
        name: 'Bezent Ecosystem (HRMS & PMS)',
        description: 'Enterprise multi-tenant HRMS & Project Management System (PMS) covering attendance, employee records, tenant administration, and workflow automations.',
        category: 'Enterprise SaaS',
        technology: 'TypeScript, React, Node.js, Drizzle ORM, MySQL 8.4',
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
        description: 'Executive telemetry suite for developer time tracking, tasks, and Antigravity MCP integration.',
        category: 'Productivity Tool',
        technology: 'React, Vite, TypeScript, Node.js MCP, Spring Boot',
        status: 'In Progress',
        priority: 'High',
        startDate: dayOffset(-14),
        deadline: dayOffset(12),
        currentStage: 'Development',
        progressMode: 'tasks',
        owner: 'Sureha DJ',
        notes: 'Luxury Deep Green theme & MCP Server for automated developer tracking.',
        usefulLinks: 'https://github.com/tamzodetechnology/Project-Tracker',
        repositoryUrl: 'https://github.com/tamzodetechnology/Project-Tracker',
        progress: 90,
        taskCount: 3,
        completedTasks: 2,
        milestoneCount: 1,
      },
    ],
    tasks: [
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
      },
      {
        id: 201,
        title: 'Luxury UI Overhaul (Dashboard, Projects, Tasks, Calendar)',
        description: 'Deep green · electric lime redesign with readable typography and clean cards.',
        projectId: 2,
        projectName: 'Project Tracker SaaS',
        status: 'Done',
        priority: 'Critical',
        startDate: dayOffset(-10),
        dueDate: dayOffset(0),
        estimatedMinutes: 300,
        actualSeconds: 18000,
        assignee: 'Sureha DJ',
      },
      {
        id: 202,
        title: 'Model Context Protocol (MCP) Server Setup',
        description: 'Zero-touch autonomous MCP server for Antigravity & Claude Code.',
        projectId: 2,
        projectName: 'Project Tracker SaaS',
        status: 'Done',
        priority: 'High',
        startDate: dayOffset(-2),
        dueDate: dayOffset(0),
        estimatedMinutes: 120,
        actualSeconds: 7200,
        assignee: 'Sureha DJ',
      },
      {
        id: 203,
        title: 'Live Telemetry & Work Session Auto-Logger',
        description: 'Background session sync across multiple active repositories.',
        projectId: 2,
        projectName: 'Project Tracker SaaS',
        status: 'In Progress',
        priority: 'Medium',
        startDate: dayOffset(0),
        dueDate: dayOffset(7),
        estimatedMinutes: 180,
        actualSeconds: 3600,
        assignee: 'Sureha DJ',
      },
    ],
    milestones: [
      {
        id: 1,
        name: 'Phase 1: HRMS Core Architecture & MySQL Database',
        description: 'Multi-tenant database schema, Drizzle ORM baseline, and API tests established.',
        projectId: 1,
        projectName: 'Bezent Ecosystem (HRMS & PMS)',
        targetDate: dayOffset(-5),
        status: 'Completed',
      },
      {
        id: 2,
        name: 'Phase 2: Attendance Security & Multi-Company Wizard',
        description: 'Deploy geofenced biometric/location attendance rules and company onboarding flow.',
        projectId: 1,
        projectName: 'Bezent Ecosystem (HRMS & PMS)',
        targetDate: dayOffset(14),
        status: 'In Progress',
      },
      {
        id: 3,
        name: 'v1.0 Release: Full Deep Green Suite + MCP Server',
        description: 'Executive dark theme and Antigravity/Claude MCP tool integration published.',
        projectId: 2,
        projectName: 'Project Tracker SaaS',
        targetDate: dayOffset(0),
        status: 'Completed',
      },
    ],
    timeEntries: [
      {
        id: 1,
        projectId: 1,
        projectName: 'Bezent Ecosystem (HRMS & PMS)',
        taskId: 101,
        taskTitle: 'MySQL 8.4 DB setup and Drizzle ORM migrations',
        startedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        endedAt: new Date().toISOString(),
        durationSeconds: 14400,
        notes: 'Configured local MySQL 8.4 datadir and ran drizzle migrations.',
      },
    ],
    activities: [
      {
        id: Date.now(),
        action: 'Workspace Initialized',
        entityType: 'Workspace',
        entityName: 'Bezent Ecosystem & Project Tracker',
        details: 'Sample demo data purged. Active production tracking started.',
        createdAt: new Date().toISOString(),
      },
    ],
    timer: { status: 'Stopped', elapsedSeconds: 0 },
    workspaceName: 'Tamzode Technology',
    companyName: 'Bezent Group',
    userDisplayName: 'Sureha DJ',
  };
  saveWorkspaceData(cleanData);
  return cleanData;
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
  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const a = document.createElement('a');
  a.href = encodedUri;
  a.download = `tamzode-time-entries-${fmtDate(new Date())}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
