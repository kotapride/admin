import React from 'react';
import { Files, Clock, CheckCircle2, XCircle } from 'lucide-react';

export default function StatsCard({ stats, currentStatus, onStatusChange }) {
  const items = [
    {
      key: 'ALL',
      type: 'total',
      label: 'Total Submissions',
      count: stats?.total ?? 0,
      icon: <Files size={24} />
    },
    {
      key: 'PENDING',
      type: 'pending',
      label: 'Pending Review',
      count: stats?.pending ?? 0,
      icon: <Clock size={24} />
    },
    {
      key: 'APPROVED',
      type: 'approved',
      label: 'Approved Submissions',
      count: stats?.approved ?? 0,
      icon: <CheckCircle2 size={24} />
    },
    {
      key: 'REJECTED',
      type: 'rejected',
      label: 'Rejected Submissions',
      count: stats?.rejected ?? 0,
      icon: <XCircle size={24} />
    }
  ];

  return (
    <div className="stats-grid">
      {items.map((item) => {
        const isSelected = currentStatus === item.key;
        return (
          <div
            key={item.key}
            className={`stat-card ${item.type}`}
            style={{
              cursor: 'pointer',
              outline: isSelected ? '2px solid var(--primary-light)' : 'none'
            }}
            onClick={() => onStatusChange(item.key)}
            title={`Filter by ${item.label}`}
          >
            <div>
              <div className="stat-title">{item.label}</div>
              <div className="stat-count">{item.count}</div>
            </div>
            <div className="stat-icon-wrapper">{item.icon}</div>
          </div>
        );
      })}
    </div>
  );
}
