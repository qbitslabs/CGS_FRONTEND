/* Placeholder blocks, table skeleton, and card skeleton while data loads.
 * Keeps clinic pages from jumping when the API returns. */
import React from 'react';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  style?: React.CSSProperties;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '16px',
  borderRadius = 'var(--radius-sm)',
  style,
  className = '',
}) => {
  return (
    <div
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius,
        backgroundColor: 'var(--c-slate-200)',
        animation: 'pulseGlow 1.5s infinite ease-in-out',
        ...style,
      }}
      className={`skeleton ${className}`}
    />
  );
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 5 }) => (
  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
    <div style={{ display: 'flex', gap: '12px' }}>
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={`th-${i}`} height={24} style={{ flex: 1 }} />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, r) => (
      <div key={`tr-${r}`} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        {Array.from({ length: cols }).map((_, c) => (
          <Skeleton key={`td-${r}-${c}`} height={20} style={{ flex: 1 }} />
        ))}
      </div>
    ))}
  </div>
);

export const CardSkeleton: React.FC = () => (
  <div
    style={{
      padding: '20px',
      backgroundColor: '#ffffff',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-light)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}
  >
    <Skeleton width="40%" height={14} />
    <Skeleton width="70%" height={28} />
    <Skeleton width="50%" height={12} />
  </div>
);
