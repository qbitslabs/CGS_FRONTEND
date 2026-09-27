/* Card shell plus header, title, description, content, and footer slots.
 * Standard surface for clinic dashboard sections. */
import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  bordered?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  padding = 'md',
  bordered = true,
  style,
  className = '',
  ...props
}) => {
  const paddingMap = {
    none: '0',
    sm: '12px',
    md: '20px',
    lg: '24px',
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: bordered ? '1px solid var(--border-light)' : 'none',
        boxShadow: 'var(--shadow-xs)',
        padding: paddingMap[padding],
        transition: 'border-color 0.15s, box-shadow 0.15s',
        ...style,
      }}
      className={`card ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  style,
  className = '',
  ...props
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '16px',
      gap: '12px',
      ...style,
    }}
    className={`card-header ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  style,
  className = '',
  ...props
}) => (
  <h3
    style={{
      fontSize: '16px',
      fontWeight: 600,
      color: 'var(--text-primary)',
      letterSpacing: '-0.01em',
      ...style,
    }}
    className={`card-title ${className}`}
    {...props}
  >
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  style,
  className = '',
  ...props
}) => (
  <p
    style={{
      fontSize: '13px',
      color: 'var(--text-muted)',
      marginTop: '2px',
      ...style,
    }}
    className={`card-desc ${className}`}
    {...props}
  >
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  style,
  className = '',
  ...props
}) => (
  <div style={{ ...style }} className={`card-content ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  style,
  className = '',
  ...props
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginTop: '16px',
      paddingTop: '16px',
      borderTop: '1px solid var(--border-subtle)',
      gap: '12px',
      ...style,
    }}
    className={`card-footer ${className}`}
    {...props}
  >
    {children}
  </div>
);
