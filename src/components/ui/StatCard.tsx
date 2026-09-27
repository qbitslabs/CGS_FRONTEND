/* Compact KPI tile: label, value, optional icon — no fake trend rows.
 * Dashboard uses a short height so four cards sit on one row. */
import React from 'react';
import { Card } from './Card';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  subtitle?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  onClick?: () => void;
  compact?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeType = 'positive',
  subtitle,
  icon,
  iconBg = 'var(--c-primary-50)',
  iconColor = 'var(--c-primary-700)',
  onClick,
  compact = false,
}) => {
  return (
    <Card
      padding={compact ? 'sm' : 'md'}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s, border-color 0.15s, box-shadow 0.15s',
      }}
      className={onClick ? 'stat-card-clickable hover-lift' : ''}
      onClick={onClick}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
        <div>
          <span
            style={{
              fontSize: compact ? '11px' : '12px',
              fontWeight: 600,
              color: 'var(--text-muted)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: compact ? '2px' : '6px',
            }}
          >
            {title}
          </span>
          <div
            style={{
              fontSize: compact ? '22px' : '26px',
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              color: 'var(--text-primary)',
              marginTop: compact ? 0 : '4px',
              lineHeight: 1.1,
            }}
          >
            {value}
          </div>
        </div>

        {icon && (
          <div
            style={{
              width: compact ? '32px' : '42px',
              height: compact ? '32px' : '42px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: iconBg,
              color: iconColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        )}
      </div>

      {(change || subtitle) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '6px 10px',
            marginTop: '12px',
            paddingTop: '10px',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '12px',
            lineHeight: 1.4,
          }}
        >
          {change && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                fontWeight: 600,
                color:
                  changeType === 'positive'
                    ? 'var(--status-success)'
                    : changeType === 'negative'
                    ? 'var(--status-error)'
                    : 'var(--text-muted)',
              }}
            >
              {changeType === 'positive' ? (
                <TrendingUp size={13} />
              ) : changeType === 'negative' ? (
                <TrendingDown size={13} />
              ) : null}
              {change}
            </span>
          )}
          {subtitle && (
            <span style={{ color: 'var(--text-muted)' }}>{subtitle}</span>
          )}
        </div>
      )}
    </Card>
  );
};
