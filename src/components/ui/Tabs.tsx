/* Horizontal tab strip with an active key and change callback.
 * Used on settings, billing, leads, appointments, and notifications. */
import React from 'react';

export interface TabItem {
  key: string;
  label: React.ReactNode;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  style?: React.CSSProperties;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeKey, onChange, style, className }) => {
  const handleTabClick = (key: string) => {
    onChange(key);
    const scrollContainer = document.querySelector('.main-scroll-container');
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  };

  return (
    <div
      className={`tabs-container ${className || ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid var(--border-light)',
        gap: '4px',
        overflowX: 'auto',
        overflowY: 'hidden',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        flexShrink: 0,
        ...style,
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleTabClick(tab.key)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              fontSize: '13px',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? 'var(--c-primary-700)' : 'var(--text-muted)',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: isActive ? '2px solid var(--c-primary-700)' : '2px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              marginBottom: '-1px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = 'var(--text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.color = 'var(--text-muted)';
              }
            }}
          >
            {tab.icon && <span style={{ display: 'flex', alignItems: 'center' }}>{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge && <span>{tab.badge}</span>}
          </button>
        );
      })}
    </div>
  );
};
