/* CRUD and status changes for clinic appointments.
 * Complete-visit can create the paid invoice in one staff action. */
import { cgs_api } from '../api/client';
import { Appointment, AppointmentStatus } from '../types';

export interface AppointmentFilters {
  date?: string;
  doctorId?: string;
  status?: AppointmentStatus | 'All';
  service?: string;
  search?: string;
}

function parseDateTimeToIso(dateStr?: string, timeStr?: string): string {
  if (!dateStr) return new Date().toISOString();

  let hours = 10;
  let minutes = 0;

  if (timeStr) {
    const isPm = /pm/i.test(timeStr);
    const isAm = /am/i.test(timeStr);
    const cleanTime = timeStr.replace(/[^0-9:]/g, '').trim();
    const parts = cleanTime.split(':').map((p) => parseInt(p, 10));

    if (parts.length >= 1 && !isNaN(parts[0])) {
      hours = parts[0];
      if (isPm && hours < 12) hours += 12;
      if (isAm && hours === 12) hours = 0;
      if (parts.length >= 2 && !isNaN(parts[1])) {
        minutes = parts[1];
      }
    }
  }

  const dateParts = dateStr.split('T')[0].split('-').map((p) => parseInt(p, 10));
  if (dateParts.length === 3 && !isNaN(dateParts[0]) && !isNaN(dateParts[1]) && !isNaN(dateParts[2])) {
    const year = dateParts[0];
    const month = dateParts[1] - 1;
    const day = dateParts[2];
    const d = new Date(year, month, day, hours, minutes, 0);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
  }

  const fallback = new Date(`${dateStr} ${timeStr || ''}`.trim());
  if (!isNaN(fallback.getTime())) {
    return fallback.toISOString();
  }

  return new Date().toISOString();
}

export class AppointmentService {
  static async getAppointments(filters: AppointmentFilters = {}): Promise<Appointment[]> {
    const data = await cgs_api.get<Appointment[]>('/appointments', {
      date: filters.date,
      doctorId: filters.doctorId !== 'All' ? filters.doctorId : undefined,
      status: filters.status !== 'All' ? filters.status : undefined,
    });

    if (Array.isArray(data)) {
      let list = data;
      if (filters.service && filters.service !== 'All') {
        list = list.filter((a) => a.service === filters.service);
      }
      if (filters.search && filters.search.trim()) {
        const q = filters.search.toLowerCase();
        list = list.filter(
          (a) =>
            a.patientName?.toLowerCase().includes(q) ||
            a.patientPhone?.includes(q) ||
            a.doctorName?.toLowerCase().includes(q) ||
            a.service?.toLowerCase().includes(q)
        );
      }
      return list;
    }

    return [];
  }

  static async getAppointmentById(id: string): Promise<Appointment> {
    const apt = await cgs_api.get<Appointment>(`/appointments/${id}`);
    if (!apt || !apt.id) {
      throw new Error(`Appointment with ID ${id} not found.`);
    }
    return apt;
  }

  static async createAppointment(
    data: Omit<Appointment, 'id' | 'createdDate'>
  ): Promise<Appointment> {
    const startsAt = parseDateTimeToIso(data.date, data.time);
    const validDoctorId = data.doctorId && !data.doctorId.startsWith('doc-') ? data.doctorId : undefined;

    const created = await cgs_api.post<Appointment>('/appointments', {
      patientId: data.patientId,
      doctorId: validDoctorId,
      service: data.service,
      startsAt,
      durationMinutes: data.durationMinutes || 30,
      notes: data.notes,
    });

    if (!created || !created.id) {
      throw new Error('Failed to create appointment.');
    }
    return created;
  }

  static async updateStatus(id: string, status: AppointmentStatus): Promise<Appointment> {
    const updated = await cgs_api.patch<Appointment>(`/appointments/${id}/status`, {
      status: status.toUpperCase().replace(/\s+/g, '_'),
    });

    if (!updated || !updated.id) {
      throw new Error('Failed to update appointment status.');
    }
    return updated;
  }

  static async reschedule(
    id: string,
    newDate: string,
    newTime: string,
    reason?: string,
    newDoctorId?: string
  ): Promise<Appointment> {
    const startsAt = parseDateTimeToIso(newDate, newTime);
    const validDoctorId = newDoctorId && !newDoctorId.startsWith('doc-') ? newDoctorId : undefined;

    const updated = await cgs_api.patch<Appointment>(`/appointments/${id}`, {
      startsAt,
      doctorId: validDoctorId,
      notes: reason,
      status: 'RESCHEDULED',
    });

    if (!updated || !updated.id) {
      throw new Error('Failed to reschedule appointment.');
    }
    return updated;
  }

  static async cancelAppointment(id: string, _reason?: string): Promise<Appointment> {
    return this.updateStatus(id, 'Cancelled');
  }

  static async getDoctorAvailability(doctorId?: string, date?: string): Promise<{
    date: string;
    doctorId: string | null;
    doctorName?: string;
    isDoctorOnLeave: boolean;
    isDoctorOffDuty: boolean;
    leaveReason?: string;
    offDutyReason?: string;
    availableSlots: string[];
    bookedSlots: string[];
    bookedSlotsCount: number;
  }> {
    const params: Record<string, any> = {};
    if (doctorId) params.doctorId = doctorId;
    if (date) params.date = date;
    return cgs_api.get('/appointments/availability', params);
  }
}

