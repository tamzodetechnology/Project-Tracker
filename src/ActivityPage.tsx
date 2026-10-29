import { useState, useMemo } from 'react';
import {
  Activity,
  CheckCircle2,
  FolderKanban,
  Flag,
  Clock3,
  Search,
  ListTodo,
} from 'lucide-react';
import type { ActivityItem } from './types';
import './ActivityPage.css';

interface ActivityPageProps {
  items: ActivityItem[];
}

export function ActivityPage({ items }: ActivityPageProps) {
  const [filterType, setFilterType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesType = filterType === 'All' || item.entityType.toLowerCase() === filterType.toLowerCase();
      const matchesQuery =
        !searchQuery ||
        `${item.action} ${item.entityName} ${item.details || ''}`.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesQuery;
    });
  }, [items, filterType, searchQuery]);

  // Group items by day
  const groupedItems = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    const groups: { label: string; items: ActivityItem[] }[] = [
      { label: 'Today', items: [] },
      { label: 'Yesterday', items: [] },
      { label: 'Earlier this Week', items: [] },
      { label: 'Older History', items: [] },
    ];

    filteredItems.forEach((item) => {
      const d = item.createdAt.slice(0, 10);
      if (d === today) {
        groups[0].items.push(item);
      } else if (d === yesterday) {
        groups[1].items.push(item);
      } else {
        const diffDays = Math.round((Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 7) {
          groups[2].items.push(item);
        } else {
          groups[3].items.push(item);
        }
      }
    });

    return groups.filter((g) => g.items.length > 0);
  }, [filteredItems]);

  const getIcon = (entityType: string, action: string) => {
    const act = action.toLowerCase();
    const ent = entityType.toLowerCase();

    if (act.includes('complet') || act.includes('done')) {
      return <CheckCircle2 size={16} color="#72df00" />;
    }
    if (ent.includes('project')) {
      return <FolderKanban size={16} color="#68f29d" />;
    }
    if (ent.includes('milestone')) {
      return <Flag size={16} color="#90b8ff" />;
    }
    if (ent.includes('time')) {
      return <Clock3 size={16} color="#e5c158" />;
    }
    if (ent.includes('task')) {
      return <ListTodo size={16} color="#72df00" />;
    }
    return <Activity size={16} color="#72df00" />;
  };

  return (
    <div className="activity-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">AUDIT LOG & TIMELINE</div>
          <h1>Activity History</h1>
          <p>Every milestone reached, task completed, and focused hour recorded across your workspace.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="activity-filter-bar">
        <div className="milestones-filters">
          {['All', 'Task', 'Project', 'Milestone', 'TimeEntry'].map((type) => (
            <button
              key={type}
              className={`milestones-filter-pill ${filterType === type ? 'active' : ''}`}
              onClick={() => setFilterType(type)}
            >
              {type === 'TimeEntry' ? 'Time Logged' : type === 'All' ? 'All Activity' : `${type}s`}
            </button>
          ))}
        </div>

        <div className="time-log-search" style={{ width: 260 }}>
          <Search size={15} />
          <input
            placeholder="Search activity records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Grouped Activity Cards */}
      {groupedItems.length === 0 ? (
        <div className="empty" style={{ margin: '30px 0' }}>
          <Activity size={26} color="#72df00" />
          <b>No activity recorded</b>
          <p>Actions like completing tasks, updating projects, and tracking time will appear here automatically.</p>
        </div>
      ) : (
        groupedItems.map((group) => (
          <div key={group.label}>
            <div className="activity-group-title">
              <span>{group.label}</span>
              <i />
            </div>

            <div className="activity-cards-list">
              {group.items.map((item) => (
                <div className="activity-card-item" key={item.id}>
                  <div className="activity-icon-bubble">{getIcon(item.entityType, item.action)}</div>

                  <div className="activity-card-content">
                    <h3 className="activity-card-headline">
                      {item.action}: <span>{item.entityName}</span>
                    </h3>
                    {item.details && <p className="activity-card-details">{item.details}</p>}
                    <time className="activity-card-time">
                      {new Date(item.createdAt).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      •{' '}
                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </time>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
