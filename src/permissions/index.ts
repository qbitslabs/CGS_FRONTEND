/* Maps doctor vs employee to the clinic-dashboard permission list.
 * Single source for what each staff role may view or change. */
import { Permission, Role, User } from '../types';

/**
 * Role-based permission mapping.
 * Centralized authorization rules for Doctor and Employee.
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  doctor: [
    'dashboard.view',
    'leads.view',
    'leads.create',
    'leads.edit',
    'leads.delete',
    'patients.view',
    'patients.create',
    'patients.edit',
    'conversations.view',
    'conversations.manage',
    'appointments.view',
    'appointments.create',
    'appointments.edit',
    'appointments.cancel',
    'notifications.view',
    'settings.view',
    'settings.edit',
    'billing.view',
    'billing.manage',
    'billing.crm_view',
    'billing.crm_manage',
    'billing.meta_ads_view',
  ],
  employee: [
    'dashboard.view',
    'leads.view',
    'leads.create',
    'leads.edit',
    'patients.view',
    'patients.create',
    'patients.edit',
    'conversations.view',
    'conversations.manage',
    'appointments.view',
    'appointments.create',
    'appointments.edit',
    'appointments.cancel',
    'notifications.view',
    'settings.view',
    'billing.view',
    'billing.manage',
  ],
};

/**
 * Check if a user has a specific permission.
 * Usage: can(user, 'leads.view')
 */
export function can(user: User | null | undefined, permission: Permission): boolean {
  if (!user || !user.role) return false;
  const permissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.includes(permission);
}

/**
 * Check if a user has any of the specified permissions.
 */
export function canAny(user: User | null | undefined, permissions: Permission[]): boolean {
  if (!user || !user.role) return false;
  return permissions.some((permission) => can(user, permission));
}

/**
 * Check if a user has all of the specified permissions.
 */
export function canAll(user: User | null | undefined, permissions: Permission[]): boolean {
  if (!user || !user.role) return false;
  return permissions.every((permission) => can(user, permission));
}

/**
 * Role check helper.
 */
export function hasRole(user: User | null | undefined, role: Role): boolean {
  return !!user && user.role === role;
}

/** Staff see every doctor in the clinic. Non-primary doctors see only their own. */
export function userSeesAllClinicData(user: User | null | undefined): boolean {
  if (!user) return false;
  if (user.role !== 'doctor') return true;
  if (user.isPrimaryDoctor) return true;
  return user.seesAllClinicData !== false;
}
