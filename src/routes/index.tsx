/* Staff route table: login plus lazy-loaded clinic workspace pages.
 * Each protected page is gated by role permission from AuthContext. */
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from '../components/layout/AppLayout';
import { LoginPage } from '../features/auth/LoginPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { LeadsPage } from '../features/leads/LeadsPage';
import { LeadDetailPage } from '../features/leads/LeadDetailPage';
import { PatientsPage } from '../features/patients/PatientsPage';
import { PatientDetailPage } from '../features/patients/PatientDetailPage';
import { ConversationsPage } from '../features/conversations/ConversationsPage';
import { AppointmentsPage } from '../features/appointments/AppointmentsPage';
import { AppointmentDetailPage } from '../features/appointments/AppointmentDetailPage';
import { NotificationsPage } from '../features/notifications/NotificationsPage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { BillingPage } from '../features/billing/BillingPage';
import { OutboundPage } from '../features/outbound/OutboundPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Dashboard App Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute requiredPermission="dashboard.view">
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="leads"
          element={
            <ProtectedRoute requiredPermission="leads.view">
              <LeadsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="leads/:id"
          element={
            <ProtectedRoute requiredPermission="leads.view">
              <LeadDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="patients"
          element={
            <ProtectedRoute requiredPermission="patients.view">
              <PatientsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="patients/:id"
          element={
            <ProtectedRoute requiredPermission="patients.view">
              <PatientDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="conversations"
          element={
            <ProtectedRoute requiredPermission="conversations.view">
              <ConversationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="conversations/:id"
          element={
            <ProtectedRoute requiredPermission="conversations.view">
              <ConversationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="appointments"
          element={
            <ProtectedRoute requiredPermission="appointments.view">
              <AppointmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="appointments/:id"
          element={
            <ProtectedRoute requiredPermission="appointments.view">
              <AppointmentDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="billing"
          element={
            <ProtectedRoute requiredPermission="billing.view">
              <BillingPage />
            </ProtectedRoute>
          }
        />
        <Route path="app/billing" element={<Navigate to="/billing" replace />} />
        <Route
          path="outbound"
          element={
            <ProtectedRoute requiredPermission="conversations.manage">
              <OutboundPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="notifications"
          element={
            <ProtectedRoute requiredPermission="notifications.view">
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings"
          element={
            <ProtectedRoute requiredPermission="settings.view">
              <SettingsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback Catch-all Route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
