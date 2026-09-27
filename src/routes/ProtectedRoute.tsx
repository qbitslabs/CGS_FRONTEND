/* Gate for clinic staff routes: must be signed in and allowed the page.
 * Redirects anonymous users to login; blocks roles without the permission. */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Permission } from '../types';
import { PageFallback } from '../components/layout/PageFallback';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
}) => {
  const { isAuthenticated, isLoading, can } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredPermission && !can(requiredPermission)) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--status-error)' }}>
          Access Restricted
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
          Your current user role does not have permission to view this operational page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
