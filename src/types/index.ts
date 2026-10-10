/* Shared TypeScript models for staff UI: leads, patients, billing, clinic catalog.
 * Mirrors CGS API shapes used by pages and service clients. */
export type Role = 'doctor' | 'employee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  avatar?: string;
  phone?: string;
  clinicId: string;
  clinicName?: string;
  doctorId?: string;
  isPrimaryDoctor?: boolean;
  seesAllClinicData?: boolean;
}

export type Permission =
  | 'dashboard.view'
  | 'leads.view'
  | 'leads.create'
  | 'leads.edit'
  | 'leads.delete'
  | 'patients.view'
  | 'patients.create'
  | 'patients.edit'
  | 'conversations.view'
  | 'conversations.manage'
  | 'appointments.view'
  | 'appointments.create'
  | 'appointments.edit'
  | 'appointments.cancel'
  | 'notifications.view'
  | 'settings.view'
  | 'settings.edit'
  | 'billing.view'
  | 'billing.manage'
  | 'billing.crm_view'
  | 'billing.crm_manage'
  | 'billing.meta_ads_view';

export type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'Qualified'
  | 'Appointment Requested'
  | 'Booked'
  | 'Lost';

export type LeadSource =
  | 'WhatsApp'
  | 'Website'
  | 'Google Ad'
  | 'Instagram'
  | 'Walk-in'
  | 'Referral';

export interface LeadActivity {
  id: string;
  type: 'created' | 'status_change' | 'message' | 'assignment' | 'appointment' | 'note';
  title: string;
  description: string;
  timestamp: string;
  actor: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source: LeadSource;
  status: LeadStatus;
  assignedTo: string; // User ID or Name
  assignedUser?: User;
  score: number; // 0 - 100
  interestedService: string;
  preferredDoctor?: string;
  howHeardAboutDoctor?: string;
  intent: 'High' | 'Medium' | 'Low';
  notes: string;
  createdDate: string;
  lastActivity: string;
  linkedConversationId?: string;
  linkedAppointmentId?: string;
  convertedPatientId?: string;
  activities: LeadActivity[];
}

export type PatientStatus = 'Active' | 'Inactive' | 'Pending Followup';

export interface PatientActivity {
  id: string;
  type: 'appointment' | 'note' | 'conversation' | 'profile_update';
  title: string;
  description: string;
  timestamp: string;
  actor: string;
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string;
  gender: 'Male' | 'Female' | 'Other' | null;
  age: number | null;
  dateOfBirth?: string;
  bloodGroup?: string;
  address?: string;
  medicalHistoryNotes: string;
  status: PatientStatus;
  lastAppointment?: string;
  nextAppointment?: string;
  lastActivity: string;
  createdDate: string;
  leadId?: string;
  allergies?: string[];
  activities: PatientActivity[];
  appointments?: Appointment[];
  conversations?: Conversation[];
}

export type ConversationState = 'AI Active' | 'Human Active' | 'Handoff Pending' | 'Closed';

export type MessageSender = 'patient' | 'ai' | 'human';

export interface Message {
  id: string;
  conversationId: string;
  sender: MessageSender;
  senderName: string;
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  isAiGenerated?: boolean;
  notes?: string;
}

export interface Conversation {
  id: string;
  patientId?: string;
  leadId?: string;
  participantName: string;
  participantPhone: string;
  state: ConversationState;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  assignedTo?: string;
  serviceInterested?: string;
  handoffReason?: string;
  isCritical?: boolean;
  needsHumanHandoff?: boolean;
  internalNotes?: string;
}

export type AppointmentStatus =
  | 'Scheduled'
  | 'Confirmed'
  | 'Completed'
  | 'Cancelled'
  | 'Rescheduled'
  | 'No Show'
  | 'Not Completed';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  service: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm format, e.g. "10:30 AM"
  durationMinutes: number;
  status: AppointmentStatus;
  isOverdue?: boolean;
  notes: string;
  createdBy: string;
  createdDate: string;
  leadId?: string;
}

export type NotificationType =
  | 'New Lead'
  | 'Appointment Reminder'
  | 'Appointment Change'
  | 'Invoice'
  | 'System Notification';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  link?: string;
  entityId?: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  email: string;
  phone: string;
  avatar?: string;
  availability: {
    days: string[];
    hours: string;
  };
  maxBookingsPerSlot?: number;
  isActive: boolean;
}

export interface DoctorLeave {
  id: string;
  doctorId: string;
  doctorName?: string;
  date: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  isAvailable: boolean;
  reason?: string;
  createdAt?: string;
}


export interface ClinicService {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  category: string;
  price?: number;
  isActive: boolean;
  serviceType?: 'consultation' | 'procedure';
  doctorId?: string;
  doctorIds?: string[];
  doctorName?: string;
  doctorNames?: string[];
}

export interface ClinicProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  workingHours: string;
  timezone: string;
}

export interface AIReceptionistConfig {
  isEnabled: boolean;
  receptionistName: string;
  greetingMessage: string;
  tone: 'professional' | 'warm' | 'concise';
  conversationInstructions: string;
  clinicInformation: string;
  faqs: string;
}

export type WhatsAppStatus = 'Connected' | 'Disconnected' | 'Pending';

export interface WhatsAppConfig {
  status: WhatsAppStatus;
  phoneNumber: string;
  businessName: string;
  qualityRating: 'High' | 'Medium' | 'Low';
  lastSyncTime: string;
}

export type PaymentStatus =
  | 'Paid'
  | 'Pending'
  | 'Partially Paid'
  | 'Cancelled'
  | 'Refunded';

export type PaymentMethod =
  | 'Cash'
  | 'UPI'
  | 'Card'
  | 'Bank Transfer'
  | 'Other';

export interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  service: string;
  services: InvoiceItem[];
  clinicName?: string;
  clinicAddress?: string;
  clinicPhone?: string;
  clinicEmail?: string;
  clinicGstin?: string;
  appointmentId?: string;
  treatingDoctorId?: string;
  treatingDoctorName?: string;
  subtotal: number;
  discount: number;
  tax: number;
  taxPercent?: number;
  total: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  date: string;
  dueDate?: string;
  notes?: string;
  createdDate: string;
}

export interface BillingSummary {
  totalRevenue: number;
  pendingPayments: number;
  paidInvoicesCount: number;
  outstandingAmount: number;
}

export interface CloudInvoice {
  id: string;
  invoiceNumber: string;
  billingPeriod: string;
  planAmount: number;
  whatsappUsageAmount: number;
  aiUsageAmount: number;
  totalAmount: number;
  status: 'Paid' | 'Pending' | 'Failed';
  date: string;
}

export interface CloudApiBillingSummary {
  subscriptionPlan: string;
  planBillingCycle: string;
  subscriptionCost: number;
  nextBillingDate: string;
  paymentStatus: 'Active' | 'Past Due' | 'Trial';
  whatsappApiUsage: {
    conversationsUsed: number;
    freeTierLimit: number;
    costPerExtraConv: number;
    totalCost: number;
    messagesSent: number;
    messagesReceived: number;
  };
  aiTokenUsage: {
    tokensConsumed: number;
    includedTokens: number;
    costPer1kTokens: number;
    totalCost: number;
    conversationsHandled: number;
  };
  paymentMethodOnFile: {
    type: string;
    last4: string;
    expiry: string;
    brand: string;
  };
  cloudInvoices: CloudInvoice[];
}

export interface MetaAdCampaign {
  id: string;
  name: string;
  objective: string;
  platform: 'Instagram & Facebook' | 'Instagram Reels' | 'Facebook Feed' | 'WhatsApp Click-to-Chat';
  status: 'Active' | 'Paused' | 'Completed';
  dailyBudget: number;
  spentAmount: number;
  impressions: number;
  clicks: number;
  ctr: number;
  leadsGenerated: number;
  costPerLead: number;
  startDate: string;
}

export interface MetaAdCreative {
  id: string;
  campaignId: string;
  title: string;
  targetProcedure: string;
  headline: string;
  primaryText: string;
  format: 'Video Reel' | 'Carousel 3D' | 'Single Image' | 'Story';
  thumbnailColor: string;
  impressions: number;
  clicks: number;
  ctr: number;
  leadsGenerated: number;
  costPerLead: number;
  status: 'Active' | 'Paused';
}

export interface MetaAdsSummary {
  totalMonthlyAdSpend: number;
  monthlyBudget: number;
  totalLeadsGenerated: number;
  avgCostPerLead: number;
  totalImpressions: number;
  totalClicks: number;
  avgCtr: number;
  roas: number;
  campaigns: MetaAdCampaign[];
  creatives: MetaAdCreative[];
}
