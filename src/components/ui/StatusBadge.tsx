/* Maps appointment, lead, and conversation states to a colored badge.
 * Keeps status wording consistent across the staff UI. */
import React from 'react';
import { Badge, BadgeVariant } from './Badge';
import { AppointmentStatus, ConversationState, LeadStatus, PatientStatus } from '../../types';
import { Bot, UserCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface StatusBadgeProps {
  status: LeadStatus | PatientStatus | AppointmentStatus | ConversationState | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  let variant: BadgeVariant = 'neutral';
  let icon: React.ReactNode = null;

  switch (status) {
    // Lead Statuses
    case 'New':
      variant = 'info';
      break;
    case 'Contacted':
      variant = 'default';
      break;
    case 'Qualified':
      variant = 'warning';
      break;
    case 'Appointment Requested':
      variant = 'ai';
      break;
    case 'Booked':
      variant = 'success';
      break;
    case 'Lost':
      variant = 'neutral';
      break;

    // Patient Statuses
    case 'Active':
      variant = 'success';
      break;
    case 'Pending Followup':
      variant = 'warning';
      break;
    case 'Inactive':
      variant = 'neutral';
      break;

    // Appointment Statuses
    case 'Confirmed':
      variant = 'success';
      icon = <CheckCircle2 size={12} />;
      break;
    case 'Scheduled':
      variant = 'info';
      break;
    case 'Completed':
      variant = 'neutral';
      break;
    case 'Cancelled':
      variant = 'error';
      break;
    case 'Rescheduled':
      variant = 'warning';
      break;
    case 'No Show':
      variant = 'error';
      break;
    case 'Not Completed':
      variant = 'warning';
      icon = <AlertCircle size={12} />;
      break;

    // Conversation States
    case 'AI Active':
      variant = 'ai';
      icon = <Bot size={12} />;
      break;
    case 'Human Active':
      variant = 'success';
      icon = <UserCheck size={12} />;
      break;
    case 'Handoff Pending':
    case 'Human Handoff Required':
      variant = 'warning';
      icon = <AlertCircle size={12} />;
      break;
    case 'Critical Situation':
      variant = 'error';
      icon = <AlertCircle size={12} />;
      break;
    case 'Closed':
      variant = 'neutral';
      break;

    // Payment / Billing Statuses
    case 'Paid':
      variant = 'success';
      icon = <CheckCircle2 size={12} />;
      break;
    case 'Pending':
      variant = 'warning';
      break;
    case 'Partially Paid':
      variant = 'info';
      break;
    case 'Refunded':
      variant = 'neutral';
      break;

    default:
      variant = 'neutral';
  }

  return (
    <Badge variant={variant} size={size} dot={!icon}>
      {icon}
      {status}
    </Badge>
  );
};
