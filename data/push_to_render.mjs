import fs from 'node:fs';

const RENDER_BASE = 'https://project-tracker-7z3d.onrender.com/api';

async function api(path, options = {}) {
  const url = `${RENDER_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${options.method || 'GET'} ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function main() {
  console.log('🚀 Connecting to live Render API at:', RENDER_BASE);
  const health = await api('/health');
  console.log('✅ Health check passed:', health);

  // 1. Check existing projects on Render
  const existingProjects = await api('/projects');
  console.log(`📋 Found ${existingProjects.length} existing projects on Render`);

  let bezentProject = existingProjects.find((p) => p.name.includes('Bezent'));
  let trackerProject = existingProjects.find((p) => p.name.includes('Project Tracker'));

  if (!bezentProject) {
    console.log('Creating "Bezent Ecosystem (HRMS & PMS)" on Render...');
    bezentProject = await api('/projects', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Bezent Ecosystem (HRMS & PMS)',
        description: 'Enterprise multi-tenant HRMS & Project Management System (PMS) covering attendance, employee records, tenant administration, and workflow automations.',
        category: 'Enterprise SaaS',
        technology: 'Node.js, TypeScript, Drizzle ORM, MySQL 8.4, React',
        status: 'In Progress',
        priority: 'Critical',
        startDate: '2026-10-04',
        deadline: '2026-11-18',
        owner: 'Sureha DJ',
        notes: 'Local dev database configured on MySQL 8.4 (BEZENT-MySQL84). Developing HRMS modules and PMS roadmap.',
        usefulLinks: 'https://github.com/tamzodetechnology/bezent_ecosystem',
        repositoryUrl: 'https://github.com/tamzodetechnology/bezent_ecosystem',
        progressMode: 'tasks',
        currentStage: 'Development',
      }),
    });
    console.log(`✅ Created Bezent Project with ID: ${bezentProject.id}`);
  } else {
    console.log(`ℹ️ Bezent Project already exists with ID: ${bezentProject.id}`);
  }

  if (!trackerProject) {
    console.log('Creating "Project Tracker SaaS" on Render...');
    trackerProject = await api('/projects', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Project Tracker SaaS',
        description: 'Modern luxury deep-green project, task, and time telemetry suite with native MCP AI automation for Antigravity and Claude Code.',
        category: 'Developer Productivity Suite',
        technology: 'React 19, TypeScript, Vite, Spring Boot, Neon PostgreSQL, Node.js MCP',
        status: 'In Progress',
        priority: 'Critical',
        startDate: '2026-10-15',
        deadline: '2026-11-12',
        owner: 'Sureha DJ',
        notes: 'Luxury Deep Green · Electric Lime UI, native MCP server, resilient local storage, and Neon PostgreSQL schema.',
        usefulLinks: 'https://github.com/tamzodetechnology/Project-Tracker',
        repositoryUrl: 'https://github.com/tamzodetechnology/Project-Tracker',
        progressMode: 'tasks',
        currentStage: 'Testing',
      }),
    });
    console.log(`✅ Created Project Tracker with ID: ${trackerProject.id}`);
  } else {
    console.log(`ℹ️ Project Tracker already exists with ID: ${trackerProject.id}`);
  }

  const existingTasks = await api('/tasks');
  console.log(`📋 Found ${existingTasks.length} existing tasks on Render`);

  // Tasks definitions
  const tasksToCreate = [
    // Bezent tasks
    {
      title: 'MySQL 8.4 DB setup and Drizzle ORM migrations',
      description: 'Configure local mysqld datadir at C:/ProgramData/MySQL/bezent_dev_data and run drizzle migrations.',
      projectId: bezentProject.id,
      status: 'Done',
      priority: 'Critical',
      startDate: '2026-10-09',
      dueDate: '2026-10-14',
      estimatedMinutes: 240,
      assignee: 'Sureha DJ',
      tags: ['Database', 'Drizzle', 'MySQL'],
      notes: 'Configured local MySQL 8.4 datadir and ran drizzle migrations.',
    },
    {
      title: 'Attendance module location & security verification',
      description: 'Implement geofenced attendance capture, shift rules, and tamper verification.',
      projectId: bezentProject.id,
      status: 'In Progress',
      priority: 'High',
      startDate: '2026-10-24',
      dueDate: '2026-11-01',
      estimatedMinutes: 300,
      assignee: 'Sureha DJ',
      tags: ['Attendance', 'Security'],
      notes: 'Geofenced biometric validation rules.',
    },
    {
      title: 'Tenant Profile & Multi-company onboarding wizard',
      description: 'Complete Company Details, Tenant Profile, and Administration dashboard atlas.',
      projectId: bezentProject.id,
      status: 'In Progress',
      priority: 'High',
      startDate: '2026-10-27',
      dueDate: '2026-11-04',
      estimatedMinutes: 220,
      assignee: 'Sureha DJ',
      tags: ['Tenant', 'UI/UX'],
      notes: 'Multi-tenant registration and branding wizard.',
    },
    {
      title: 'BEZENT PMS workflow architecture benchmark',
      description: 'Structure Project Manager (PM) and Project Lead (PL) workflow specification maps.',
      projectId: bezentProject.id,
      status: 'Done',
      priority: 'Medium',
      startDate: '2026-10-19',
      dueDate: '2026-10-27',
      estimatedMinutes: 180,
      assignee: 'Sureha DJ',
      tags: ['PMS', 'Workflow'],
      notes: 'PM & PL workflows approved.',
    },
    {
      title: 'Employee records reference and changes audit',
      description: 'Build employee profile history tracking, document uploads, and HRMS verification.',
      projectId: bezentProject.id,
      status: 'To Do',
      priority: 'Medium',
      startDate: '2026-10-31',
      dueDate: '2026-11-10',
      estimatedMinutes: 260,
      assignee: 'Sureha DJ',
      tags: ['HRMS', 'Employee'],
      notes: 'Employee records and document storage module.',
    },

    // Tracker tasks
    {
      title: 'Luxury Electric Lime & Dark Forest UI Redesign',
      description: 'Elevated all core workspaces (Dashboard, Projects, My Tasks, Calendar) to a luxury executive dark theme with chartreuse highlights and blackened forest surfaces.',
      projectId: trackerProject.id,
      status: 'Done',
      priority: 'Critical',
      startDate: '2026-10-15',
      dueDate: '2026-10-24',
      estimatedMinutes: 300,
      assignee: 'Sureha DJ',
      tags: ['UI/UX', 'Design System', 'Frontend'],
      notes: 'Redesigned cards, metrics, typography, and contrast.',
    },
    {
      title: 'Spring Boot REST API & Neon PostgreSQL Entity Mappings',
      description: 'Implemented Spring Boot JPA repositories, REST controllers for Dashboard, Projects, Tasks, and Jackson array serializers for Neon Cloud PostgreSQL.',
      projectId: trackerProject.id,
      status: 'Done',
      priority: 'High',
      startDate: '2026-10-16',
      dueDate: '2026-10-20',
      estimatedMinutes: 240,
      assignee: 'Sureha DJ',
      tags: ['Backend', 'Spring Boot', 'PostgreSQL'],
      notes: 'JPA repositories and custom Jackson array mappings.',
    },
    {
      title: 'Flyway Database Migration Pipeline (V1-V4)',
      description: 'Automated database schema versioning with Flyway scripts covering projects, tasks, milestones, activities, and time logs.',
      projectId: trackerProject.id,
      status: 'Done',
      priority: 'High',
      startDate: '2026-10-18',
      dueDate: '2026-10-21',
      estimatedMinutes: 180,
      assignee: 'Sureha DJ',
      tags: ['Database', 'Flyway', 'Migrations'],
      notes: 'Migrations V1 through V4 verified with Neon PostgreSQL.',
    },
    {
      title: 'Full-Featured My Tasks & Interactive Kanban Workspace',
      description: 'Built dual-view task management: sortable structured table and 4-column drag/click Kanban board with priority filtering and status tracking.',
      projectId: trackerProject.id,
      status: 'Done',
      priority: 'High',
      startDate: '2026-10-20',
      dueDate: '2026-10-25',
      estimatedMinutes: 240,
      assignee: 'Sureha DJ',
      tags: ['Tasks', 'Kanban', 'Telemetry'],
      notes: 'Dual-mode task manager with inline editing.',
    },
    {
      title: 'Full-Width 7-Column Calendar & Sprint Deadline Hub',
      description: 'Engineered multi-view calendar (Month, Week, Agenda) with responsive 7-column flex/grid layouts, milestone checkpoint highlights, and day-agenda drawer.',
      projectId: trackerProject.id,
      status: 'Done',
      priority: 'High',
      startDate: '2026-10-22',
      dueDate: '2026-10-29',
      estimatedMinutes: 200,
      assignee: 'Sureha DJ',
      tags: ['Calendar', 'Deadlines', 'UI'],
      notes: 'Resolved grid collision; full-width responsive 7-column layout.',
    },
    {
      title: 'Offline-First Resilient Storage Engine & JSON Backup/Restore',
      description: 'Engineered browser LocalStorage engine with automatic fallback when offline, plus instant JSON snapshot export and restore.',
      projectId: trackerProject.id,
      status: 'Done',
      priority: 'Medium',
      startDate: '2026-10-24',
      dueDate: '2026-10-28',
      estimatedMinutes: 150,
      assignee: 'Sureha DJ',
      tags: ['Offline', 'Storage', 'Backups'],
      notes: 'Zero-data-loss browser caching and backup engine.',
    },
    {
      title: 'Native Stdio MCP Server for Antigravity & Claude Code Automation',
      description: 'Implemented autonomous Model Context Protocol (MCP) server (mcp-server/index.mjs) registered globally in ~/.gemini/config/mcp_config.json with 10 tools.',
      projectId: trackerProject.id,
      status: 'Done',
      priority: 'Critical',
      startDate: '2026-10-28',
      dueDate: '2026-10-29',
      estimatedMinutes: 180,
      assignee: 'Sureha DJ',
      tags: ['MCP', 'AI', 'Automation'],
      notes: 'Autonomous developer tracking for AI pair programming.',
    },
    {
      title: 'Workspace Purge & Real Projects Integration (Bezent + Tracker)',
      description: 'Cleaned legacy demo data, integrated Bezent Ecosystem HRMS & PMS as primary sibling project, and streamlined navigation/sidebar.',
      projectId: trackerProject.id,
      status: 'Done',
      priority: 'Medium',
      startDate: '2026-10-29',
      dueDate: '2026-10-29',
      estimatedMinutes: 120,
      assignee: 'Sureha DJ',
      tags: ['Refactoring', 'Cleanup', 'Bezent'],
      notes: 'Pruned all dummy mock records; active production workspace.',
    },
    {
      title: 'Automated Git Hook Telemetry & Work Session Logger',
      description: 'Background daemon logger that automatically captures git commit messages, file edits, and active coding sessions into the tracker.',
      projectId: trackerProject.id,
      status: 'In Progress',
      priority: 'High',
      startDate: '2026-10-29',
      dueDate: '2026-11-04',
      estimatedMinutes: 240,
      assignee: 'Sureha DJ',
      tags: ['Git', 'Automation', 'Telemetry'],
      notes: 'Background commit logger and work session telemetry.',
    },
    {
      title: 'Live Neon Cloud PostgreSQL Production Deployment',
      description: 'Deploy Spring Boot service to cloud hosting and establish live PostgreSQL sync bridge.',
      projectId: trackerProject.id,
      status: 'In Progress',
      priority: 'Medium',
      startDate: '2026-10-29',
      dueDate: '2026-11-12',
      estimatedMinutes: 180,
      assignee: 'Sureha DJ',
      tags: ['Deployment', 'Cloud', 'Neon'],
      notes: 'Live on Render at https://project-tracker-7z3d.onrender.com.',
    },
  ];

  const createdTasksMap = new Map();
  for (const t of tasksToCreate) {
    const existing = existingTasks.find(
      (et) => et.title === t.title && Number(et.projectId) === Number(t.projectId)
    );
    if (!existing) {
      console.log(`Creating task: "${t.title}"...`);
      const created = await api('/tasks', {
        method: 'POST',
        body: JSON.stringify(t),
      });
      createdTasksMap.set(t.title, created.id);
      console.log(`✅ Created task ID: ${created.id}`);
    } else {
      createdTasksMap.set(t.title, existing.id);
      console.log(`ℹ️ Task already exists: "${t.title}" (ID: ${existing.id})`);
    }
  }

  // Milestones
  const existingMilestones = await api('/milestones');
  console.log(`📋 Found ${existingMilestones.length} existing milestones on Render`);

  const milestonesToCreate = [
    {
      name: 'Phase 1: HRMS Core Architecture & MySQL Database',
      description: 'Multi-tenant database schema, Drizzle ORM baseline, and API tests established.',
      projectId: bezentProject.id,
      targetDate: '2026-10-24',
      status: 'Completed',
    },
    {
      name: 'Phase 2: Attendance Security & Multi-Company Wizard',
      description: 'Deploy geofenced biometric/location attendance rules and company onboarding flow.',
      projectId: bezentProject.id,
      targetDate: '2026-11-12',
      status: 'In Progress',
    },
    {
      name: 'Phase 1: Full-Stack Baseline (Spring Boot, Neon PostgreSQL & Full UI)',
      description: 'Initial architecture with Spring Boot REST API, Neon Cloud PostgreSQL migrations, and React UI.',
      projectId: trackerProject.id,
      targetDate: '2026-10-22',
      status: 'Completed',
    },
    {
      name: 'Phase 2: Luxury UI Redesign, 7-Column Calendar & Resilient Store',
      description: 'Executive Dark Forest & Electric Lime visual overhaul, full-width calendar, and LocalStorage sync.',
      projectId: trackerProject.id,
      targetDate: '2026-10-28',
      status: 'Completed',
    },
    {
      name: 'Phase 3: Autonomous AI MCP Server for Antigravity & Claude Code',
      description: 'Zero-touch stdio MCP server for agentic project telemetry, task automation, and work sessions.',
      projectId: trackerProject.id,
      targetDate: '2026-10-29',
      status: 'Completed',
    },
    {
      name: 'Phase 4: Git Hook Automation & Cloud Production Deployment',
      description: 'Background git telemetry auto-logger and cloud deployment for shared developer tracking.',
      projectId: trackerProject.id,
      targetDate: '2026-11-12',
      status: 'In Progress',
    },
  ];

  for (const m of milestonesToCreate) {
    const existing = existingMilestones.find(
      (em) => em.name === m.name && Number(em.projectId) === Number(m.projectId)
    );
    if (!existing) {
      console.log(`Creating milestone: "${m.name}"...`);
      const created = await api('/milestones', {
        method: 'POST',
        body: JSON.stringify(m),
      });
      console.log(`✅ Created milestone ID: ${created.id}`);
    } else {
      console.log(`ℹ️ Milestone already exists: "${m.name}" (ID: ${existing.id})`);
    }
  }

  // Time entries
  const existingEntries = await api('/time/entries');
  console.log(`📋 Found ${existingEntries.length} existing time entries on Render`);

  if (existingEntries.length === 0) {
    console.log('Logging sample completed work sessions to Render...');
    const trackerTaskId = createdTasksMap.get('Luxury Electric Lime & Dark Forest UI Redesign');
    if (trackerTaskId) {
      await api('/time/entries', {
        method: 'POST',
        body: JSON.stringify({
          projectId: trackerProject.id,
          taskId: trackerTaskId,
          startedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
          endedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
          notes: 'Full visual elevation across Dashboard, Projects, Tasks, Calendar.',
        }),
      });
      console.log('✅ Logged 4 hours UI overhaul work session');
    }

    const mcpTaskId = createdTasksMap.get('Native Stdio MCP Server for Antigravity & Claude Code Automation');
    if (mcpTaskId) {
      await api('/time/entries', {
        method: 'POST',
        body: JSON.stringify({
          projectId: trackerProject.id,
          taskId: mcpTaskId,
          startedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
          endedAt: new Date().toISOString(),
          notes: 'Built native stdio MCP server for autonomous AI pair programming.',
        }),
      });
      console.log('✅ Logged 3 hours MCP server work session');
    }
  }

  // Summary check
  const dashboard = await api('/dashboard');
  console.log('\n🎉 Render Live Database Successfully Synchronized!');
  console.log('Dashboard summary on Render:', JSON.stringify(dashboard, null, 2));
}

main().catch((err) => {
  console.error('❌ Sync failed:', err);
  process.exit(1);
});
