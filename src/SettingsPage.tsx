import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  RefreshCw,
  Server,
  User,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { downloadBackupJson } from './mockData';
import type { WorkspaceData } from './mockData';
import './SettingsPage.css';

interface SettingsPageProps {
  isOffline: boolean;
  projectsCount: number;
  tasksCount: number;
  milestonesCount: number;
  timeEntriesCount: number;
  workspaceData: WorkspaceData;
  onUpdateWorkspaceInfo: (name: string, company: string, user: string) => void;
  onRestoreBackup: (data: WorkspaceData) => void;
  onTestConnection: () => Promise<boolean>;
  notify: (s: string) => void;
}

export function SettingsPage({
  isOffline,
  projectsCount,
  tasksCount,
  milestonesCount,
  timeEntriesCount,
  workspaceData,
  onUpdateWorkspaceInfo,
  onRestoreBackup,
  onTestConnection,
  notify,
}: SettingsPageProps) {
  const [workspaceName, setWorkspaceName] = useState(workspaceData.workspaceName || 'Tamzode Technology');
  const [companyName, setCompanyName] = useState(workspaceData.companyName || 'Tamzode Tech Lab');
  const [userDisplayName, setUserDisplayName] = useState(workspaceData.userDisplayName || 'Sureha DJ');
  const [apiUrl, setApiUrl] = useState(import.meta.env.VITE_API_URL || 'https://project-tracker-7z3d.onrender.com/api');
  const [testing, setTesting] = useState(false);
  const [pingResult, setPingResult] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateWorkspaceInfo(workspaceName, companyName, userDisplayName);
    notify('Workspace preferences saved');
  };

  const handleTestPing = async () => {
    setTesting(true);
    setPingResult(null);
    try {
      const start = performance.now();
      const success = await onTestConnection();
      const latency = Math.round(performance.now() - start);
      if (success) {
        setPingResult(`Connected (${latency}ms round-trip)`);
        notify(`API Reachable (${latency}ms)`);
      } else {
        setPingResult('API unreachable (Local mode active)');
        notify('API server did not respond');
      }
    } catch {
      setPingResult('Connection timed out');
      notify('Connection failed');
    } finally {
      setTesting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.projects && parsed.tasks) {
          onRestoreBackup(parsed);
          notify('Workspace backup restored successfully');
        } else {
          notify('Invalid backup JSON format');
        }
      } catch {
        notify('Error parsing backup file');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="settings-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">PREFERENCES & DATA MANAGEMENT</div>
          <h1>Settings & Backup</h1>
          <p>Configure team branding, manage live PostgreSQL synchronization, and export JSON backups.</p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Workspace Profile Customization */}
        <section className="settings-section-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <User size={18} color="#72df00" />
            <h2 style={{ margin: 0 }}>Workspace & Team Identity</h2>
          </div>
          <p>Customize organization labels displayed across headers, reports, and generated documents.</p>

          <form onSubmit={handleSaveProfile}>
            <div className="settings-form-row">
              <div className="settings-input-group">
                <label>Workspace Name</label>
                <input
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="e.g. Tamzode Technology"
                  required
                />
              </div>

              <div className="settings-input-group">
                <label>Organization / Team</label>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Tamzode Tech Lab"
                  required
                />
              </div>
            </div>

            <div className="settings-form-row">
              <div className="settings-input-group">
                <label>User Display Name</label>
                <input
                  value={userDisplayName}
                  onChange={(e) => setUserDisplayName(e.target.value)}
                  placeholder="e.g. Sureha DJ"
                  required
                />
              </div>

              <div className="settings-input-group">
                <label>Theme Palette</label>
                <input value="Deep Green · Electric Lime (Default)" disabled style={{ opacity: 0.7 }} />
              </div>
            </div>

            <button type="submit" className="button primary">
              <Check size={14} /> Save Preferences
            </button>
          </form>
        </section>

        {/* Connection & Mode */}
        <section className="settings-section-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Server size={18} color="#72df00" />
            <h2 style={{ margin: 0 }}>Backend API & Database Connection</h2>
          </div>
          <p>
            Connects to Spring Boot REST backend with Neon Cloud PostgreSQL or runs autonomously with local storage sync.
          </p>

          <div className="connection-status-banner">
            <div className={`connection-indicator ${isOffline ? 'offline' : 'online'}`}>
              <i />
              <span>{isOffline ? 'Offline / Local Demo Mode' : 'Live Spring Boot API Connected'}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {pingResult && <span style={{ fontSize: 11, color: '#9ebd9f' }}>{pingResult}</span>}
              <button
                type="button"
                className="button secondary"
                onClick={handleTestPing}
                disabled={testing}
              >
                <RefreshCw size={13} className={testing ? 'spin' : ''} />
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
            </div>
          </div>

          <div className="settings-input-group" style={{ maxWidth: 480 }}>
            <label>API Endpoint URL</label>
            <input value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} placeholder="https://project-tracker-7z3d.onrender.com/api" />
          </div>
        </section>

        {/* Data Backup, Export & Restore */}
        <section className="settings-section-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <ShieldCheck size={18} color="#72df00" />
            <h2 style={{ margin: 0 }}>Data Backup & Portability</h2>
          </div>
          <p>
            Export complete snapshots of your projects, tasks, milestones, and time logs. Restore from file at any time.
          </p>

          <div className="backup-actions-grid">
            <button
              type="button"
              className="backup-card-btn"
              onClick={() => downloadBackupJson(workspaceData)}
            >
              <Download size={20} color="#72df00" />
              <div>
                <b>Export Backup JSON</b>
                <p>Download full snapshot of all projects, tasks, and time entries.</p>
              </div>
            </button>

            <button
              type="button"
              className="backup-card-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={20} color="#68f29d" />
              <div>
                <b>Restore from JSON</b>
                <p>Upload a previously exported backup file to restore workspace state.</p>
              </div>
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".json"
            onChange={handleFileChange}
          />
        </section>

        {/* Stored Records Summary */}
        <section className="settings-section-card">
          <h2 style={{ fontSize: 14 }}>Workspace Diagnostics</h2>
          <div
            style={{
              display: 'flex',
              gap: 24,
              flexWrap: 'wrap',
              marginTop: 12,
              fontSize: 12,
              color: '#9eb4a3',
            }}
          >
            <span>
              Projects: <strong style={{ color: '#f0fff2' }}>{projectsCount}</strong>
            </span>
            <span>
              Tasks: <strong style={{ color: '#f0fff2' }}>{tasksCount}</strong>
            </span>
            <span>
              Milestones: <strong style={{ color: '#f0fff2' }}>{milestonesCount}</strong>
            </span>
            <span>
              Time Entries: <strong style={{ color: '#f0fff2' }}>{timeEntriesCount}</strong>
            </span>
            <span>
              Storage Engine:{' '}
              <strong style={{ color: '#72df00' }}>
                {isOffline ? 'Browser LocalStorage (Resilient)' : 'PostgreSQL + Local Cache'}
              </strong>
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
