/* Vertical activity feed for leads, patients, and the dashboard.
 * Renders timestamped events from CGS activity arrays. */
import React from 'react';
import { Clock, User, MessageSquare, Calendar, CheckCircle2, FileText } from 'lucide-react';

export interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  actor?: string;
}

export interface TimelineProps {
  events: TimelineEvent[];
}

export const Timeline: React.FC<TimelineProps> = ({ events }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'created':
        return <CheckCircle2 size={14} color="var(--status-success)" />;
      case 'status_change':
        return <Clock size={14} color="var(--status-warning)" />;
      case 'message':
      case 'conversation':
        return <MessageSquare size={14} color="var(--status-info)" />;
      case 'appointment':
        return <Calendar size={14} color="var(--c-primary-700)" />;
      case 'assignment':
        return <User size={14} color="var(--c-slate-600)" />;
      case 'note':
      case 'profile_update':
        return <FileText size={14} color="var(--c-slate-600)" />;
      default:
        return <Clock size={14} color="var(--c-slate-500)" />;
    }
  };

  return (
    <div style={{ position: 'relative', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Vertical line */}
      <div
        style={{
          position: 'absolute',
          left: '11px',
          top: '8px',
          bottom: '8px',
          width: '2px',
          backgroundColor: 'var(--border-light)',
        }}
      />

      {events.map((event) => (
        <div key={event.id} style={{ position: 'relative' }}>
          {/* Dot / Icon container */}
          <div
            style={{
              position: 'absolute',
              left: '-24px',
              top: '2px',
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              border: '2px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
            }}
          >
            {getIcon(event.type)}
          </div>

          <div style={{ paddingLeft: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {event.title}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {event.timestamp}
              </span>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {event.description}
            </p>

            {event.actor && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>By</span>
                <span style={{ fontWeight: 500, color: 'var(--c-slate-700)' }}>{event.actor}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
