/* Friendly empty list: icon, title, and optional action button.
 * Shown when a clinic table has no matching rows. */
import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <Inbox size={36} color="var(--c-slate-400)" />,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'var(--c-slate-100)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
        }}
      >
        {icon}
      </div>
      <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
        {title}
      </h4>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '360px', marginBottom: actionLabel ? '20px' : '0' }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} leftIcon={actionIcon}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
