/* Primary clinic button with variants, sizes, and an optional spinner.
 * Used for submit, cancel, and destructive staff actions. */
import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = '',
      disabled,
      style,
      ...props
    },
    ref
  ) => {
    // Style configurations based on tokens
    const baseStyles: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      fontWeight: 500,
      borderRadius: 'var(--radius-md)',
      border: '1px solid transparent',
      transition: 'all 0.15s ease',
      cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
      opacity: disabled || isLoading ? 0.6 : 1,
      width: fullWidth ? '100%' : 'auto',
      outline: 'none',
      whiteSpace: 'nowrap',
      userSelect: 'none',
    };

    const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
      sm: { padding: '6px 12px', fontSize: '12px', height: '32px' },
      md: { padding: '8px 16px', fontSize: '14px', height: '38px' },
      lg: { padding: '10px 20px', fontSize: '15px', height: '44px' },
    };

    const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
      primary: {
        backgroundColor: 'var(--c-primary-700)',
        color: '#ffffff',
        borderColor: 'var(--c-primary-800)',
      },
      secondary: {
        backgroundColor: 'var(--c-slate-100)',
        color: 'var(--c-slate-800)',
        borderColor: 'var(--c-slate-200)',
      },
      outline: {
        backgroundColor: '#ffffff',
        color: 'var(--c-slate-700)',
        borderColor: 'var(--border-light)',
      },
      ghost: {
        backgroundColor: 'transparent',
        color: 'var(--c-slate-600)',
        borderColor: 'transparent',
      },
      danger: {
        backgroundColor: 'var(--status-error)',
        color: '#ffffff',
        borderColor: '#be123c',
      },
      success: {
        backgroundColor: 'var(--status-success)',
        color: '#ffffff',
        borderColor: '#047857',
      },
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        style={{
          ...baseStyles,
          ...sizeStyles[size],
          ...variantStyles[variant],
          ...style,
        }}
        className={`btn btn-${variant} btn-${size} ${className}`}
        {...props}
      >
        {isLoading ? <Loader2 size={16} className="animate-spin" /> : leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
