/* Click-outside menu used by the header user menu and row actions.
 * Items can be links or callbacks. */
import React, { useState, useRef, useEffect } from 'react';

export interface DropdownItem {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: (DropdownItem | 'divider')[];
  align?: 'left' | 'right';
}

export const Dropdown: React.FC<DropdownProps> = ({ trigger, items, align = 'right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <div onClick={() => setIsOpen(!isOpen)} style={{ cursor: 'pointer' }}>
        {trigger}
      </div>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            [align === 'right' ? 'right' : 'left']: 0,
            zIndex: 1000,
            minWidth: '180px',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-dropdown)',
            padding: '4px',
            animation: 'fadeIn 0.12s ease-out',
          }}
        >
          {items.map((item, idx) => {
            if (item === 'divider') {
              return (
                <div
                  key={`div-${idx}`}
                  style={{
                    height: '1px',
                    backgroundColor: 'var(--border-subtle)',
                    margin: '4px 0',
                  }}
                />
              );
            }

            return (
              <button
                key={item.key}
                type="button"
                disabled={item.disabled}
                onClick={() => {
                  if (!item.disabled) {
                    item.onClick?.();
                    setIsOpen(false);
                  }
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: item.danger ? 'var(--status-error)' : 'var(--c-slate-700)',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'left',
                  cursor: item.disabled ? 'not-allowed' : 'pointer',
                  opacity: item.disabled ? 0.5 : 1,
                  transition: 'background-color 0.12s',
                }}
                onMouseEnter={(e) => {
                  if (!item.disabled) {
                    e.currentTarget.style.backgroundColor = item.danger
                      ? 'var(--status-error-bg)'
                      : 'var(--c-slate-100)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {item.icon && <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>}
                <span style={{ flex: 1 }}>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
