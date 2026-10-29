const BASE_URL = 'https://project-tracker-7z3d.onrender.com/api';

const results = [];

async function test(name, fn) {
  const start = performance.now();
  try {
    await fn();
    const duration = Math.round(performance.now() - start);
    results.push({ name, status: 'PASSED', duration });
    console.log(`✅ [PASS] ${name} (${duration}ms)`);
  } catch (err) {
    const duration = Math.round(performance.now() - start);
    results.push({ name, status: 'FAILED', duration, error: err.message });
    console.error(`❌ [FAIL] ${name} (${duration}ms): ${err.message}`);
  }
}

async function fetchJson(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} ${res.statusText} on ${path}: ${text}`);
  }
  return res.json();
}

async function runAll() {
  console.log(`\n======================================================`);
  console.log(`🧪 Running Full Project Health & Integration Test Suite`);
  console.log(`🌐 Target: ${BASE_URL}`);
  console.log(`======================================================\n`);

  // Test 1: Health check
  await test('1. Health check endpoint (/api/health)', async () => {
    const data = await fetchJson('/health');
    if (data.status !== 'ok') throw new Error(`Unexpected status: ${data.status}`);
  });

  // Test 2: Dashboard metrics
  await test('2. Dashboard live metrics (/api/dashboard)', async () => {
    const d = await fetchJson('/dashboard');
    if (typeof d.total !== 'number' || d.total <= 0) throw new Error(`Total projects invalid: ${d.total}`);
    if (typeof d.completed !== 'number') throw new Error(`Completed tasks count missing`);
    if (typeof d.totaltimeseconds !== 'number') throw new Error(`Total time missing`);
  });

  // Test 3: Projects retrieval & structure
  let trackerProjId = null;
  let bezentProjId = null;
  await test('3. Projects listing & data integrity (/api/projects)', async () => {
    const projects = await fetchJson('/projects');
    if (!Array.isArray(projects) || projects.length < 2) throw new Error(`Expected at least 2 projects, got ${projects.length}`);
    
    const tracker = projects.find((p) => p.name.includes('Project Tracker'));
    const bezent = projects.find((p) => p.name.includes('Bezent'));
    
    if (!tracker) throw new Error('Project Tracker SaaS missing in live database');
    if (!bezent) throw new Error('Bezent Ecosystem missing in live database');
    
    trackerProjId = tracker.id;
    bezentProjId = bezent.id;

    if (!tracker.currentStage) throw new Error('Project currentStage missing');
    if (typeof tracker.progress !== 'number') throw new Error('Project progress number missing');
  });

  // Test 4: Tasks retrieval & project filtering
  await test('4. Tasks listing & project filtering (/api/tasks)', async () => {
    const allTasks = await fetchJson('/tasks');
    if (!Array.isArray(allTasks) || allTasks.length < 10) throw new Error(`Expected >= 10 tasks, got ${allTasks.length}`);

    const trackerTasks = await fetchJson(`/tasks?projectId=${trackerProjId}`);
    if (!Array.isArray(trackerTasks) || trackerTasks.length === 0) throw new Error(`No tasks found for Project Tracker (ID: ${trackerProjId})`);

    const bezentTasks = await fetchJson(`/tasks?projectId=${bezentProjId}`);
    if (!Array.isArray(bezentTasks) || bezentTasks.length === 0) throw new Error(`No tasks found for Bezent (ID: ${bezentProjId})`);
  });

  // Test 5: Task lifecycle CRUD (Create -> Update status -> Delete)
  await test('5. Real-time Task CRUD Lifecycle (POST -> PATCH -> DELETE)', async () => {
    // 5a. Create temporary task
    const temp = await fetchJson('/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: '__TEST_AUTOMATION_PROBE__',
        description: 'Temporary end-to-end test verification task',
        projectId: trackerProjId,
        status: 'To Do',
        priority: 'Low',
        dueDate: new Date().toISOString().slice(0, 10),
      }),
    });
    if (!temp.id) throw new Error('Task creation did not return ID');
    const createdId = temp.id;

    // 5b. Update status to Done
    const patched = await fetchJson(`/tasks/${createdId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Done' }),
    });
    if (patched.status !== 'Done') throw new Error(`Expected status 'Done', got '${patched.status}'`);

    // 5c. Delete temporary task
    const deleted = await fetchJson(`/tasks/${createdId}`, { method: 'DELETE' });
    if (!deleted.message) throw new Error('Delete did not return confirmation message');
  });

  // Test 6: Milestones
  await test('6. Milestones listing (/api/milestones)', async () => {
    const ms = await fetchJson('/milestones');
    if (!Array.isArray(ms) || ms.length < 4) throw new Error(`Expected at least 4 milestones, got ${ms.length}`);
  });

  // Test 7: Time entries
  await test('7. Time Tracking entries (/api/time/entries)', async () => {
    const entries = await fetchJson('/time/entries');
    if (!Array.isArray(entries) || entries.length === 0) throw new Error(`Expected time entries, got ${entries.length}`);
    const totalDuration = entries.reduce((acc, e) => acc + (e.durationSeconds || 0), 0);
    if (totalDuration <= 0) throw new Error('Total recorded duration is 0');
  });

  // Test 8: Reports endpoints
  await test('8. Reports & Telemetry graphs (/api/reports/*)', async () => {
    const weekly = await fetchJson('/reports/weekly-hours');
    if (!Array.isArray(weekly)) throw new Error('weekly-hours not an array');

    const byProj = await fetchJson('/reports/time-by-project');
    if (!Array.isArray(byProj)) throw new Error('time-by-project not an array');

    const taskStat = await fetchJson('/reports/task-status');
    if (!Array.isArray(taskStat)) throw new Error('task-status not an array');

    const trend = await fetchJson('/reports/completed-trend');
    if (!Array.isArray(trend)) throw new Error('completed-trend not an array');
  });

  // Summary
  console.log(`\n======================================================`);
  const passed = results.filter((r) => r.status === 'PASSED').length;
  const failed = results.filter((r) => r.status === 'FAILED').length;
  console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed out of ${results.length} Tests`);
  console.log(`======================================================\n`);

  if (failed > 0) process.exit(1);
}

runAll().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
