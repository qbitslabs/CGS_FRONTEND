/* Checkbox list so a clinic service can be assigned to several doctors.
 * Rows are left-aligned name + check; no space-between name jump. */
import React, { useEffect, useRef, useState } from 'react';

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectProps {
  label?: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'flex-start',
  gap: '10px',
  width: '100%',
  boxSizing: 'border-box',
  padding: '8px 10px',
  margin: 0,
  fontSize: '13px',
  lineHeight: '18px',
  cursor: 'pointer',
  textAlign: 'left',
};

export const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select…',
  helperText,
  error,
  disabled,
}) => {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const selected = options.filter((o) => value.includes(o.value));
  const allSelected = options.length > 0 && options.every((o) => value.includes(o.value));

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const toggle = (id: string) => {
    if (value.includes(id)) onChange(value.filter((v) => v !== id));
    else onChange([...value, id]);
  };

  const summary = allSelected
    ? 'All doctors'
    : selected.length === 0
      ? placeholder
      : selected.length === 1
        ? selected[0].label
        : `${selected.length} doctors selected`;

  return (
    <div ref={boxRef} style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', position: 'relative' }}>
      {label && (
        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--c-slate-700)' }}>
          {label}
        </div>
      )}
      {helperText && !error && (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
          {helperText}
        </div>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          minHeight: '38px',
          padding: '8px 30px 8px 12px',
          fontSize: '13px',
          textAlign: 'left',
          color: selected.length ? 'var(--text-primary)' : 'var(--text-muted)',
          backgroundColor: '#ffffff',
          border: `1px solid ${error ? 'var(--status-error)' : 'var(--border-light)'}`,
          borderRadius: 'var(--radius-md)',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        {summary}
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            width: '100%',
            zIndex: 80,
            marginTop: '4px',
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-dropdown, 0 8px 24px rgba(15, 23, 42, 0.12))',
            padding: '4px 0',
            maxHeight: '220px',
            overflowY: 'auto',
            boxSizing: 'border-box',
          }}
        >
          {options.length > 1 && (
            <div
              role="button"
              tabIndex={0}
              onClick={() => onChange(allSelected ? [] : options.map((o) => o.value))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onChange(allSelected ? [] : options.map((o) => o.value));
                }
              }}
              style={{
                ...rowStyle,
                fontWeight: 600,
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <input
                type="checkbox"
                checked={allSelected}
                readOnly
                style={{ width: 16, height: 16, margin: 0, flex: '0 0 16px' }}
              />
              <span style={{ flex: '1 1 auto', whiteSpace: 'nowrap' }}>All doctors</span>
            </div>
          )}
          {options.map((opt) => (
            <div
              key={opt.value}
              role="button"
              tabIndex={0}
              onClick={() => toggle(opt.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggle(opt.value);
                }
              }}
              style={{
                ...rowStyle,
                backgroundColor: value.includes(opt.value) ? 'var(--c-primary-50)' : 'transparent',
              }}
            >
              <input
                type="checkbox"
                checked={value.includes(opt.value)}
                readOnly
                style={{ width: 16, height: 16, margin: 0, flex: '0 0 16px' }}
              />
              <span style={{ flex: '1 1 auto', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {opt.label}
              </span>
            </div>
          ))}
          {!options.length && (
            <div style={{ padding: '10px 12px', fontSize: '13px', color: 'var(--text-muted)' }}>
              No doctors in clinic
            </div>
          )}
        </div>
      )}
      {error && <span style={{ fontSize: '12px', color: 'var(--status-error)' }}>{error}</span>}
    </div>
  );
};
