/* Initials or image avatar for staff and patients in headers and lists.
 * Falls back to letters when no photo is stored. */
import React from 'react';

export interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  role?: 'doctor' | 'employee';
  style?: React.CSSProperties;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  role,
  style,
  className = '',
}) => {
  const getInitials = (n: string) => {
    const parts = n.replace(/^Dr\.\s*/, '').trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const sizeMap: Record<string, { size: number; font: string }> = {
    sm: { size: 28, font: '11px' },
    md: { size: 36, font: '13px' },
    lg: { size: 48, font: '16px' },
    xl: { size: 64, font: '20px' },
  };

  const dim = sizeMap[size] || sizeMap.md;

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${dim.size}px`,
        height: `${dim.size}px`,
        borderRadius: 'var(--radius-full)',
        backgroundColor: 'var(--c-primary-100)',
        color: 'var(--c-primary-900)',
        fontWeight: 600,
        fontSize: dim.font,
        flexShrink: 0,
        overflow: 'visible',
        ...style,
      }}
      className={`avatar ${className}`}
      title={name}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            objectFit: 'cover',
          }}
          onError={(e) => {
            // fallback to initials on broken image
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}

      {role && (
        <span
          style={{
            position: 'absolute',
            bottom: '-2px',
            right: '-2px',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: role === 'doctor' ? 'var(--c-primary-600)' : 'var(--status-warning)',
            border: '2px solid #ffffff',
          }}
          title={role === 'doctor' ? 'Doctor' : 'Employee'}
        />
      )}
    </div>
  );
};
