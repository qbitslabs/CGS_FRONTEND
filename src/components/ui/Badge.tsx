/* Small status pill for counts and tags on clinic screens.
 * Color variants cover success, warning, AI, and neutral. */
import React from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'ai' | 'neutral' | 'outline';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  style,
  className = '',
}) => {
  const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
    default: {
      backgroundColor: 'var(--c-primary-50)',
      color: 'var(--c-primary-800)',
      borderColor: 'var(--c-primary-200)',
    },
    success: {
      backgroundColor: 'var(--status-success-bg)',
      color: 'var(--status-success)',
      borderColor: 'var(--status-success-border)',
    },
    warning: {
      backgroundColor: 'var(--status-warning-bg)',
      color: 'var(--status-warning)',
      borderColor: 'var(--status-warning-border)',
    },
    error: {
      backgroundColor: 'var(--status-error-bg)',
      color: 'var(--status-error)',
      borderColor: 'var(--status-error-border)',
    },
    info: {
      backgroundColor: 'var(--status-info-bg)',
      color: 'var(--status-info)',
      borderColor: 'var(--status-info-border)',
    },
    ai: {
      backgroundColor: 'var(--status-ai-bg)',
      color: 'var(--status-ai)',
      borderColor: 'var(--status-ai-border)',
    },
    neutral: {
      backgroundColor: 'var(--c-slate-100)',
      color: 'var(--c-slate-700)',
      borderColor: 'var(--c-slate-200)',
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--c-slate-600)',
      borderColor: 'var(--border-light)',
    },
  };

  const sizeStyles: Record<BadgeSize, React.CSSProperties> = {
    sm: { padding: '2px 6px', fontSize: '11px', height: '20px' },
    md: { padding: '3px 8px', fontSize: '12px', height: '24px' },
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        fontWeight: 500,
        borderRadius: 'var(--radius-full)',
        border: '1px solid',
        whiteSpace: 'nowrap',
        lineHeight: 1,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
      }}
      className={`badge badge-${variant} ${className}`}
    >
      {dot && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'currentColor',
          }}
        />
      )}
      {children}
    </span>
  );
};
