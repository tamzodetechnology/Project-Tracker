export type Status = 'Planned' | 'In Progress' | 'On Hold' | 'Completed' | 'Archived';
export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent' | 'Critical';
export type TaskStatus = 'To Do' | 'In Progress' | 'In Review' | 'Done' | 'Blocked' | 'Cancelled';
export type Stage = 'Planning' | 'Design' | 'Development' | 'Testing' | 'Deployment' | 'Completed';

export interface Project {
  id: number;
  name: string;
  description: string;
  category: string;
  technology: string;
  status: Status;
  priority: Priority;
  startDate?: string;
  deadline?: string;
  currentStage?: Stage;
  progressMode?: 'tasks' | 'milestones';
  owner?: string;
  notes?: string;
  usefulLinks?: string;
  repositoryUrl?: string;
  progress: number;
  taskCount?: number;
  milestoneCount?: number;
  completedTasks?: number;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  projectId: number;
  projectName?: string;
  projectPhaseId?: number;
  milestoneId?: number;
  milestoneName?: string;
  parentTaskId?: number;
  status: TaskStatus;
  priority: Priority;
  startDate?: string;
  dueDate?: string;
  estimatedMinutes?: number;
  actualSeconds?: number;
  assignee?: string;
  tags?: string[];
  notes?: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface Milestone {
  id: number;
  name: string;
  description?: string;
  projectId: number;
  projectName?: string;
  targetDate?: string;
  status: 'Planned' | 'In Progress' | 'Completed';
}

export interface ActivityItem {
  id: number;
  action: string;
  entityType: string;
  entityName: string;
  details?: string;
  createdAt: string;
}

export interface WorkspaceMetrics {
  total: number;
  active: number;
  completed: number;
  pending: number;
  upcoming: number;
  overdue: number;
  inProgress?: number;
  blocked?: number;
  upcomingMilestones?: number;
  totalTimeSeconds?: number;
}

export interface TimeEntry {
  id: number;
  projectId: number;
  projectName?: string;
  taskId?: number;
  taskTitle?: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  notes?: string;
}

export interface TimerState {
  id?: number;
  projectId?: number;
  taskId?: number;
  status: 'Running' | 'Paused' | 'Stopped';
  elapsedSeconds: number;
  startedAt?: string;
  currentStartedAt?: string;
  notes?: string;
}

export interface ChartDayItem {
  date: string;
  seconds: number;
}

export interface ChartProjectItem {
  projectId: number;
  projectName: string;
  seconds: number;
}

export interface ChartStatusItem {
  status: string;
  count: number;
}

export interface ChartTrendItem {
  date: string;
  count: number;
}
