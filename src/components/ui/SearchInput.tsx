/* Debounced search field with a clear control for list pages.
 * Used on leads, patients, conversations, and billing. */
import React, { forwardRef, InputHTMLAttributes } from 'react';
import { Search, X } from 'lucide-react';

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  containerStyle?: React.CSSProperties;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onChange, onClear, placeholder = 'Search...', containerStyle, style, className = '', ...props }, ref) => {
    return (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          maxWidth: '320px',
          ...containerStyle,
        }}
      >
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: '10px',
            color: 'var(--c-slate-400)',
            pointerEvents: 'none',
          }}
        />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            height: '36px',
            paddingLeft: '34px',
            paddingRight: value ? '32px' : '12px',
            fontSize: '13px',
            color: 'var(--text-primary)',
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            outline: 'none',
            transition: 'all 0.15s ease',
            ...style,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-focus)';
            e.currentTarget.style.boxShadow = '0 0 0 2px var(--c-primary-100)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-light)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          className={`search-input ${className}`}
          {...props}
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              onClear?.();
            }}
            style={{
              position: 'absolute',
              right: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              color: 'var(--c-slate-400)',
              padding: '2px',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
            }}
            title="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';
