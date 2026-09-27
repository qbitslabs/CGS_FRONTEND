/* Labeled text input with optional left icon for clinic forms.
 * Forwards ref so parents can focus or read the field. */
import React, { forwardRef, InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: React.CSSProperties;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className = '',
      style,
      containerStyle,
      required,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', minWidth: 0, ...containerStyle }}>
        {label && (
          <label
            htmlFor={inputId}
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
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
          {leftIcon && (
            <div
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--c-slate-400)',
                pointerEvents: 'none',
                zIndex: 2,
                width: '18px',
                height: '18px',
              }}
            >
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            style={{
              boxSizing: 'border-box',
              width: '100%',
              height: '40px',
              paddingLeft: leftIcon ? '38px' : '12px',
              paddingRight: rightIcon ? '38px' : '12px',
              fontSize: '14px',
              color: 'var(--text-primary)',
              backgroundColor: '#ffffff',
              border: `1px solid ${error ? 'var(--status-error)' : 'var(--border-light)'}`,
              borderRadius: 'var(--radius-md)',
              outline: 'none',
              transition: 'border-color 0.15s, box-shadow 0.15s',
              ...style,
              ...(leftIcon ? { paddingLeft: '38px' } : {}),
              ...(rightIcon ? { paddingRight: '38px' } : {}),
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = error ? 'var(--status-error)' : 'var(--border-focus)';
              e.currentTarget.style.boxShadow = `0 0 0 2px ${error ? 'var(--status-error-bg)' : 'var(--c-primary-100)'}`;
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = error ? 'var(--status-error)' : 'var(--border-light)';
              e.currentTarget.style.boxShadow = 'none';
              props.onBlur?.(e);
            }}
            className={`input-field ${className}`}
            {...props}
          />
          {rightIcon && (
            <div
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--c-slate-400)',
                zIndex: 2,
                width: '18px',
                height: '18px',
              }}
            >
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <span style={{ fontSize: '12px', color: 'var(--status-error)' }}>{error}</span>
        ) : helperText ? (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
