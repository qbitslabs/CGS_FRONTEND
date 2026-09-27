/* Page title, subtitle, breadcrumbs, and primary action slot.
 * Standard top of every clinic workspace screen. */
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  badge?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs,
  actions,
  badge,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        marginBottom: '20px',
      }}
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: 'var(--text-muted)',
          }}
        >
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {crumb.to ? (
                <Link
                  to={crumb.to}
                  style={{ color: 'var(--c-slate-500)', textDecoration: 'none' }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                >
                  {crumb.label}
                </Link>
              ) : (
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{crumb.label}</span>
              )}
              {idx < breadcrumbs.length - 1 && <ChevronRight size={12} color="var(--c-slate-400)" />}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </h1>
          {badge}
        </div>

        {actions && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {actions}
          </div>
        )}
      </div>

      {description && (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '-2px' }}>
          {description}
        </p>
      )}
    </div>
  );
};
