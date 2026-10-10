/* Settings API: clinic profile, doctors, leaves, and catalog services.
 * Create/update/delete services with serviceType and doctorIds. */
import { cgs_api } from '../api/client';
import {
  AIReceptionistConfig,
  ClinicProfile,
  ClinicService,
  Doctor,
  DoctorLeave,
  WhatsAppConfig,
} from '../types';

const CLINIC_TTL_MS = 15_000;
let clinicCache: { data: any; at: number } | null = null;
let clinicInflight: Promise<any> | null = null;

const defaultAiConfig = (): AIReceptionistConfig => ({
  isEnabled: true,
  receptionistName: 'Asha',
  greetingMessage: 'Hello! Welcome to Clinic Growth.',
  tone: 'professional',
  conversationInstructions: '',
  clinicInformation: '',
  faqs: '',
});

function mapDoctors(clinic: any): Doctor[] {
  if (!clinic || !Array.isArray(clinic.doctors)) return [];
  return clinic.doctors.map((d: any) => ({
    id: d.id,
    name: d.name || `Dr. ${d.user?.firstName || ''} ${d.user?.lastName || ''}`.trim(),
    specialization: d.specialization || 'Consultant',
    fee: d.consultationFee ? Number(d.consultationFee) : 500,
    consultationFee: d.consultationFee ? Number(d.consultationFee) : 500,
    experienceYears: d.experienceYears || 5,
    qualification: d.qualification || 'MBBS',
    availability: {
      days: d.availabilityDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      hours: d.availabilityHours || '09:00 AM - 07:00 PM',
    },
    maxBookingsPerSlot: d.maxBookingsPerSlot || 1,
    status: d.isActive ? 'Available' : 'Off Duty',
    isActive: d.isActive,
  }));
}

function mapAiConfig(clinic: any): AIReceptionistConfig {
  const ai = clinic?.aiConfig;
  if (!ai) return defaultAiConfig();
  return {
    isEnabled: ai.isAiEnabled ?? true,
    receptionistName: ai.receptionistName || 'Asha',
    greetingMessage: ai.greetingMessage || 'Hello! Welcome to our clinic. How can I help you today?',
    tone: (ai.tone as AIReceptionistConfig['tone']) || 'professional',
    conversationInstructions: ai.conversationInstructions || '',
    clinicInformation: ai.clinicInformation || '',
    faqs: ai.faqs || '',
  };
}

function mapWhatsApp(clinic: any): WhatsAppConfig {
  const wa = clinic?.whatsapp || clinic?.whatsappAccounts?.[0];
  return {
    status: wa?.status === 'Connected' || wa?.status === 'CONNECTED' ? 'Connected' : 'Pending',
    phoneNumber: wa?.phoneNumber || '',
    businessName: clinic?.name || 'Clinic WhatsApp',
    qualityRating: 'High',
    lastSyncTime: 'Just now',
  };
}

export class ClinicServiceApi {
  static invalidateClinicCache() {
    clinicCache = null;
    clinicInflight = null;
  }

  static async fetchClinicCurrent(force = false): Promise<any> {
    if (!force && clinicCache && Date.now() - clinicCache.at < CLINIC_TTL_MS) {
      return clinicCache.data;
    }
    if (clinicInflight) return clinicInflight;
    clinicInflight = cgs_api
      .get<any>('/clinics/current')
      .then((data) => {
        clinicCache = { data, at: Date.now() };
        return data;
      })
      .finally(() => {
        clinicInflight = null;
      });
    return clinicInflight;
  }

  static async getClinicProfile(): Promise<ClinicProfile> {
    const data = await this.fetchClinicCurrent();
    if (!data || !data.name) {
      throw new Error('Failed to fetch clinic profile.');
    }
    return data;
  }

  static async updateClinicProfile(updates: Partial<ClinicProfile>): Promise<ClinicProfile> {
    const updated = await cgs_api.patch<ClinicProfile>('/clinics/current', updates);
    this.invalidateClinicCache();
    if (!updated || !updated.name) {
      throw new Error('Failed to update clinic profile.');
    }
    clinicCache = { data: updated, at: Date.now() };
    return updated;
  }

  static async getServices(): Promise<ClinicService[]> {
    const clinic = await this.fetchClinicCurrent();
    return Array.isArray(clinic?.services) ? clinic.services : [];
  }

  static async addService(
    service: Omit<ClinicService, 'id'> & {
      serviceType?: 'consultation' | 'procedure';
      doctorId?: string | null;
      doctorIds?: string[];
    }
  ): Promise<ClinicService> {
    const created = await cgs_api.post<ClinicService>('/clinics/current/services', service);
    this.invalidateClinicCache();
    return created;
  }

  static async updateService(id: string, updates: Partial<ClinicService>): Promise<ClinicService> {
    const updated = await cgs_api.patch<ClinicService>(`/clinics/current/services/${id}`, updates);
    this.invalidateClinicCache();
    return updated;
  }

  static async deleteService(id: string): Promise<{ id: string; deleted: boolean; deactivated?: boolean }> {
    const result = await cgs_api.delete<{ id: string; deleted: boolean; deactivated?: boolean }>(
      `/clinics/current/services/${id}`
    );
    this.invalidateClinicCache();
    return result;
  }

  static async getDoctors(): Promise<Doctor[]> {
    const clinic = await this.fetchClinicCurrent();
    return mapDoctors(clinic);
  }

  static async updateDoctor(id: string, updates: any): Promise<Doctor> {
    this.invalidateClinicCache();
    return cgs_api.patch<Doctor>(`/users/${id}`, updates);
  }

  static async updateDoctorSchedule(
    id: string,
    updates: { availabilityDays?: string[]; availabilityHours?: string; maxBookingsPerSlot?: number }
  ): Promise<any> {
    this.invalidateClinicCache();
    return cgs_api.patch(`/users/${id}`, updates);
  }

  static async getDoctorLeaves(doctorId?: string): Promise<DoctorLeave[]> {
    const params = doctorId ? { doctorId } : undefined;
    const leaves = await cgs_api.get<DoctorLeave[]>('/users/leaves', params);
    return Array.isArray(leaves) ? leaves : [];
  }

  static async declareDoctorLeave(data: {
    doctorId?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
    fromDate?: string;
    toDate?: string;
    startTime?: string;
    endTime?: string;
    reason?: string;
  }): Promise<DoctorLeave> {
    return cgs_api.post<DoctorLeave>('/users/leaves', data);
  }

  static async deleteDoctorLeave(leaveId: string): Promise<any> {
    return cgs_api.delete(`/users/leaves/${leaveId}`);
  }

  static async getAIConfig(): Promise<AIReceptionistConfig> {
    const clinic = await this.fetchClinicCurrent();
    return mapAiConfig(clinic);
  }

  static async updateAIConfig(updates: Partial<AIReceptionistConfig>): Promise<AIReceptionistConfig> {
    await cgs_api.patch<any>('/clinics/current', {
      aiConfig: {
        isAiEnabled: updates.isEnabled,
        tone: updates.tone,
        receptionistName: updates.receptionistName,
        greetingMessage: updates.greetingMessage,
        conversationInstructions: updates.conversationInstructions,
        clinicInformation: updates.clinicInformation,
        faqs: updates.faqs,
      },
    });
    this.invalidateClinicCache();
    return this.getAIConfig();
  }

  static mapServicesFromProfile(clinic: any): ClinicService[] {
    return Array.isArray(clinic?.services) ? clinic.services : [];
  }

  static mapDoctorsFromProfile(clinic: any): Doctor[] {
    return mapDoctors(clinic);
  }

  static mapAiFromProfile(clinic: any): AIReceptionistConfig {
    return mapAiConfig(clinic);
  }

  static mapWhatsAppFromProfile(clinic: any): WhatsAppConfig {
    return mapWhatsApp(clinic);
  }
}
