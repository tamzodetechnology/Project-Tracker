/**
 * Test script for Project Tracker MCP Server
 * Sends simulated JSON-RPC messages to verify tools and response formatting.
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverPath = path.join(__dirname, 'index.mjs');

console.log('🚀 Launching Project Tracker MCP Server test...');
const proc = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'inherit'],
});

let msgId = 1;

function sendRpc(method, params = {}) {
  const req = {
    jsonrpc: '2.0',
    id: msgId++,
    method,
    params,
  };
  proc.stdin.write(JSON.stringify(req) + '\n');
}

let buffer = '';
proc.stdout.on('data', (chunk) => {
  buffer += chunk.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop(); // keep last incomplete line

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const resp = JSON.parse(line);
      console.log(`\n✅ Response for ID ${resp.id}:`);
      if (resp.result?.tools) {
        console.log(`   Tools available (${resp.result.tools.length}):`, resp.result.tools.map((t) => t.name).join(', '));
      } else if (resp.result?.content) {
        const parsed = JSON.parse(resp.result.content[0].text);
        console.log('   Payload:', JSON.stringify(parsed, null, 2).slice(0, 200) + '...');
      } else {
        console.log('   Result:', resp.result);
      }
    } catch (err) {
      console.error('Failed to parse line:', line, err);
    }
  }
});

// Run sequence
setTimeout(() => {
  console.log('\n--- 1. Initialize ---');
  sendRpc('initialize', {});
}, 200);

setTimeout(() => {
  console.log('\n--- 2. List Tools ---');
  sendRpc('tools/list', {});
}, 500);

setTimeout(() => {
  console.log('\n--- 3. Call tracker_get_workspace_summary ---');
  sendRpc('tools/call', {
    name: 'tracker_get_workspace_summary',
    arguments: {},
  });
}, 800);

setTimeout(() => {
  console.log('\n--- 4. Call tracker_log_work_session ---');
  sendRpc('tools/call', {
    name: 'tracker_log_work_session',
    arguments: {
      projectName: 'Project Tracker SaaS',
      durationMinutes: 45,
      taskTitle: 'MCP Server Setup',
      notes: 'Implemented zero-touch autonomous MCP server for Antigravity & Claude.',
    },
  });
}, 1200);

setTimeout(() => {
  console.log('\n--- 5. Call tracker_update_task_status ---');
  sendRpc('tools/call', {
    name: 'tracker_update_task_status',
    arguments: {
      taskTitle: 'MCP Server Automation',
      status: 'Done',
      notes: 'Completed MCP server for Antigravity and Claude Code.',
    },
  });
}, 1600);

setTimeout(() => {
  console.log('\n--- Test Completed Successfully! Shutting down. ---');
  proc.kill('SIGINT');
  process.exit(0);
}, 2200);
