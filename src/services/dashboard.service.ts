/* Loads the slim clinic dashboard summary from CGS.
 * KPIs, today appointments, conversation count, and recent activity. */
import { cgs_api } from '../api/client';
import { Appointment, AppointmentStatus, Conversation, ConversationState } from '../types';

export interface DashboardFunnel {
  new: number;
  contacted: number;
  qualified: number;
  appointmentRequested: number;
  booked: number;
}

export interface DashboardActivity {
  id: string;
  type: 'appointment' | 'created' | 'message';
  title: string;
  description: string;
  timestamp: string;
  actor: string;
}

export interface DashboardSummary {
  newLeadsCount: number;
  activeLeadsCount: number;
  todayAppointmentsCount: number;
  todayConfirmedCount: number;
  activeConversationsCount: number;
  attentionConversationsCount: number;
  funnel: DashboardFunnel;
  todayAppointments: Appointment[];
  recentConversations: Conversation[];
  activities: DashboardActivity[];
}

export class DashboardService {
  static async getSummary(doctorId?: string): Promise<DashboardSummary> {
    const data = await cgs_api.get<DashboardSummary>('/dashboard/summary', {
      doctorId: doctorId && doctorId !== 'All' ? doctorId : undefined,
    });
    return {
      newLeadsCount: data?.newLeadsCount || 0,
      activeLeadsCount: data?.activeLeadsCount || 0,
      todayAppointmentsCount: data?.todayAppointmentsCount || 0,
      todayConfirmedCount: data?.todayConfirmedCount || 0,
      activeConversationsCount: data?.activeConversationsCount || 0,
      attentionConversationsCount: data?.attentionConversationsCount || 0,
      funnel: data?.funnel || {
        new: 0,
        contacted: 0,
        qualified: 0,
        appointmentRequested: 0,
        booked: 0,
      },
      todayAppointments: (data?.todayAppointments || []).map((apt) => ({
        ...apt,
        status: apt.status as AppointmentStatus,
      })),
      recentConversations: (data?.recentConversations || []).map((conv) => ({
        ...conv,
        state: conv.state as ConversationState,
        unreadCount: conv.unreadCount || 0,
        lastMessage: conv.lastMessage || '',
        lastMessageTime: conv.lastMessageTime || '',
        participantName: conv.participantName || 'Patient',
        participantPhone: conv.participantPhone || '',
      })),
      activities: data?.activities || [],
    };
  }
}
