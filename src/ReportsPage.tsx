import { useState, useMemo } from 'react';
import {
  Download,
  FolderKanban,
  CheckCircle2,
  Clock3,
  AlertCircle,
  TrendingUp,
  BarChart2,
  PieChart,
} from 'lucide-react';
import type { WorkspaceMetrics, ChartDayItem, ChartProjectItem, ChartStatusItem, ChartTrendItem } from './types';
import './ReportsPage.css';

interface ReportsPageProps {
  metrics: WorkspaceMetrics;
  weeklyHours: ChartDayItem[];
  timeByProject: ChartProjectItem[];
  taskStatus: ChartStatusItem[];
  completedTrend: ChartTrendItem[];
  onExportCsv?: () => void;
}

export function ReportsPage({
  metrics,
  weeklyHours,
  timeByProject,
  taskStatus,
  completedTrend,
  onExportCsv,
}: ReportsPageProps) {
  const [filterPeriod, setFilterPeriod] = useState<'7d' | '30d' | 'all'>('7d');

  const fmtDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const totalTasks = (metrics.completed || 0) + (metrics.pending || 0);
  const completionRate = totalTasks > 0 ? Math.round(((metrics.completed || 0) / totalTasks) * 100) : 0;

  // Donut chart calculations
  const totalStatusTasks = taskStatus.reduce((acc, curr) => acc + curr.count, 0);
  const circ = 2 * Math.PI * 39;
  let accumulatedOffset = 0;

  const statusColors: Record<string, string> = {
    Done: '#72df00',
    'In Progress': '#26ba7b',
    'To Do': '#627b5d',
    'In Review': '#9873d2',
    Blocked: '#e19a5b',
  };

  // SVG Trend Chart calculations
  const trendPoints = completedTrend.map((d) => d.count);
  const maxTrend = Math.max(1, ...trendPoints);
  const width = 640;
  const height = 180;
  const polylineCoords = useMemo(() => {
    if (!trendPoints.length) return '';
    return trendPoints
      .map((val, idx) => {
        const x = trendPoints.length < 2 ? width / 2 : (idx / (trendPoints.length - 1)) * width;
        const y = height - 20 - (val / maxTrend) * (height - 40);
        return `${x},${y}`;
      })
      .join(' ');
  }, [trendPoints, maxTrend]);

  const maxWeekly = Math.max(1, ...weeklyHours.map((d) => d.seconds || 0));
  const maxProjectSeconds = Math.max(1, ...timeByProject.map((p) => p.seconds || 0));

  return (
    <div className="reports-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">EXECUTIVE ANALYTICS</div>
          <h1>Workspace Reports</h1>
          <p>Holistic view of project velocity, completion rates, and logged development hours.</p>
        </div>
        <div className="heading-actions">
          <div className="milestones-filters">
            {(['7d', '30d', 'all'] as const).map((p) => (
              <button
                key={p}
                className={`milestones-filter-pill ${filterPeriod === p ? 'active' : ''}`}
                onClick={() => setFilterPeriod(p)}
              >
                {p === '7d' ? 'Last 7 Days' : p === '30d' ? 'Last 30 Days' : 'All Time'}
              </button>
            ))}
          </div>

          <button className="button primary" onClick={onExportCsv}>
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="reports-kpi-grid">
        <div className="report-kpi-box">
          <span>
            Active Projects <FolderKanban size={15} color="#72df00" />
          </span>
          <b>{metrics.total}</b>
          <small>{metrics.active} currently moving forward</small>
        </div>

        <div className="report-kpi-box">
          <span>
            Task Completion Rate <CheckCircle2 size={15} color="#46d69a" />
          </span>
          <b style={{ color: '#8cff45' }}>{completionRate}%</b>
          <small>
            {metrics.completed} of {totalTasks} leaf tasks closed
          </small>
          <div className="report-kpi-progress">
            <i style={{ width: `${completionRate}%` }} />
          </div>
        </div>

        <div className="report-kpi-box">
          <span>
            Recorded Focus Hours <Clock3 size={15} color="#72df00" />
          </span>
          <b>{fmtDuration(metrics.totalTimeSeconds || 0)}</b>
          <small>Accumulated across all sessions</small>
        </div>

        <div className="report-kpi-box">
          <span>
            Overdue Attention <AlertCircle size={15} color="#ff9a8d" />
          </span>
          <b style={{ color: metrics.overdue > 0 ? '#ff9a8d' : '#8cff45' }}>{metrics.overdue}</b>
          <small>{metrics.overdue > 0 ? 'Requires immediate reschedule' : 'All deadlines on track'}</small>
        </div>
      </div>

      {/* Main Charts: Task Status & Completed Trend */}
      <div className="reports-grid-two">
        <section className="reports-card">
          <div className="reports-card-header">
            <div>
              <h2>Task Status Distribution</h2>
              <p>Active workload breakdown across all project phases</p>
            </div>
            <PieChart size={18} color="#72df00" />
          </div>

          <div className="donut-layout">
            <div className="donut-wrap">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="39" fill="none" stroke="#162414" strokeWidth="11" />
                {taskStatus
                  .filter((s) => s.count > 0)
                  .map((s) => {
                    const length = totalStatusTasks ? (circ * s.count) / totalStatusTasks : 0;
                    const offset = accumulatedOffset;
                    accumulatedOffset += length;
                    return (
                      <circle
                        key={s.status}
                        className="donut-segment"
                        cx="50"
                        cy="50"
                        r="39"
                        fill="none"
                        stroke={statusColors[s.status] || '#72df00'}
                        strokeWidth="11"
                        strokeDasharray={`${length} ${circ - length}`}
                        strokeDashoffset={-offset}
                        transform="rotate(-90 50 50)"
                      />
                    );
                  })}
              </svg>
              <div className="donut-center">
                <b>{totalStatusTasks}</b>
                <small>total tasks</small>
              </div>
            </div>

            <div className="chart-legend">
              {taskStatus.map((s) => (
                <div key={s.status} className="legend-item" style={{ cursor: 'default' }}>
                  <i style={{ background: statusColors[s.status] || '#72df00' }} />
                  <span>{s.status}</span>
                  <b>{s.count}</b>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="reports-card">
          <div className="reports-card-header">
            <div>
              <h2>Completion Velocity Trend</h2>
              <p>Tasks completed and delivered over time</p>
            </div>
            <TrendingUp size={18} color="#72df00" />
          </div>

          {polylineCoords ? (
            <div className="trend-chart">
              <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                <line x1="0" y1={height - 20} x2={width} y2={height - 20} stroke="#213a22" strokeWidth="1" />
                <polyline
                  points={polylineCoords}
                  fill="none"
                  stroke="#72df00"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="trend-labels">
                {completedTrend.map((d) => (
                  <small key={d.date}>
                    {new Date(`${d.date}T00:00:00`).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </small>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty" style={{ minHeight: 180 }}>
              <BarChart2 size={24} color="#72df00" />
              <b>No completion history yet</b>
              <p>Mark tasks as Done to track your completion curve over time.</p>
            </div>
          )}
        </section>
      </div>

      {/* Secondary Charts: Hours by Day & Distribution by Project */}
      <div className="reports-grid-two">
        <section className="reports-card">
          <div className="reports-card-header">
            <div>
              <h2>Tracked Hours by Day</h2>
              <p>Daily measured focus time (hours)</p>
            </div>
            <Clock3 size={18} color="#72df00" />
          </div>

          <div className="hours-chart">
            {weeklyHours.map((d) => {
              const dateObj = new Date(`${d.date}T00:00:00`);
              const hrs = d.seconds / 3600;
              const barHeight = maxWeekly > 0 ? (d.seconds / maxWeekly) * 100 : 0;
              return (
                <div
                  className="hours-day"
                  key={d.date}
                  title={`${dateObj.toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}: ${hrs.toFixed(1)} hrs`}
                >
                  <span className="hours-value">{hrs > 0 ? hrs.toFixed(1) : '0'}</span>
                  <div className="hours-track">
                    <i style={{ height: `${Math.max(5, barHeight)}%` }} />
                  </div>
                  <small>{dateObj.toLocaleDateString(undefined, { weekday: 'short' })}</small>
                </div>
              );
            })}
          </div>
        </section>

        <section className="reports-card">
          <div className="reports-card-header">
            <div>
              <h2>Time Distribution by Project</h2>
              <p>Proportion of total focus allocated per project</p>
            </div>
            <FolderKanban size={18} color="#72df00" />
          </div>

          <div className="project-time-chart">
            {timeByProject.map((p) => {
              const widthPct = maxProjectSeconds > 0 ? (p.seconds / maxProjectSeconds) * 100 : 0;
              return (
                <div className="project-time-row" key={p.projectId}>
                  <span title={p.projectName}>{p.projectName}</span>
                  <div className="project-time-track">
                    <i style={{ width: `${Math.max(5, widthPct)}%` }} />
                  </div>
                  <b>{fmtDuration(p.seconds)}</b>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
