/* Native select styled to match clinic forms, with optional label.
 * Used for single-value dropdowns such as status or one doctor. */
import React, { forwardRef, SelectHTMLAttributes } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  helperText?: string;
  containerStyle?: React.CSSProperties;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      options,
      helperText,
      className = '',
      style,
      containerStyle,
      required,
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', ...containerStyle }}>
        {label && (
          <label
            htmlFor={selectId}
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--c-slate-700)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {label}
            {required && <span style={{ color: 'var(--status-error)' }}>*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          style={{
            width: '100%',
            height: '38px',
            padding: '0 30px 0 12px',
            fontSize: '13px',
            color: 'var(--text-primary)',
            backgroundColor: '#ffffff',
            border: `1px solid ${error ? 'var(--status-error)' : 'var(--border-light)'}`,
            borderRadius: 'var(--radius-md)',
            outline: 'none',
            cursor: 'pointer',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: '38px',
            transition: 'border-color 0.15s',
            ...style,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-focus)';
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? 'var(--status-error)' : 'var(--border-light)';
            props.onBlur?.(e);
          }}
          className={`select-field ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error ? (
          <span style={{ fontSize: '12px', color: 'var(--status-error)' }}>{error}</span>
        ) : helperText ? (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
