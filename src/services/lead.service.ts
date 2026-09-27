/* Lead list, detail, create, update, and convert-to-patient.
 * Assigned staff is the signed-in user unless the API says otherwise. */
import { cgs_api } from '../api/client';
import { Lead, LeadSource, LeadStatus } from '../types';

export interface LeadFilterOptions {
  search?: string;
  status?: LeadStatus | 'All';
  source?: LeadSource | 'All';
  assignedTo?: string;
  sortBy?: 'name' | 'createdDate' | 'score' | 'lastActivity';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  doctorId?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export class LeadService {
  static async getLeads(options: LeadFilterOptions = {}): Promise<PaginatedResult<Lead>> {
    const {
      search = '',
      status = 'All',
      source = 'All',
      sortBy,
      sortOrder,
      page = 1,
      pageSize = 10,
      doctorId,
    } = options;

    const result = await cgs_api.get<any>('/leads', {
      page,
      limit: pageSize,
      search: search || undefined,
      status: status !== 'All' ? status : undefined,
      source: source !== 'All' ? source : undefined,
      sortBy,
      sortOrder,
      doctorId: doctorId && doctorId !== 'All' ? doctorId : undefined,
    });

    if (Array.isArray(result)) {
      return {
        data: result,
        total: result.length,
        page,
        pageSize,
        totalPages: Math.ceil(result.length / pageSize) || 1,
      };
    }

    if (result && Array.isArray(result.data)) {
      return {
        data: result.data,
        total: result.meta?.total || result.data.length,
        page: result.meta?.page || page,
        pageSize: result.meta?.limit || pageSize,
        totalPages: result.meta?.totalPages || Math.ceil((result.meta?.total || result.data.length) / pageSize) || 1,
      };
    }

    return {
      data: [],
      total: 0,
      page,
      pageSize,
      totalPages: 1,
    };
  }

  static async getLeadById(id: string): Promise<Lead> {
    const lead = await cgs_api.get<Lead>(`/leads/${id}`);
    if (!lead || !lead.id) {
      throw new Error(`Lead with ID ${id} not found.`);
    }
    return lead;
  }

  static async createLead(data: Omit<Lead, 'id' | 'createdDate' | 'lastActivity' | 'activities'>): Promise<Lead> {
    const newLead = await cgs_api.post<Lead>('/leads', {
      name: data.name,
      phone: data.phone,
      email: data.email || undefined,
      source: data.source.toUpperCase().replace(/\s+/g, '_'),
      interestedService: data.interestedService,
      intent: data.intent.toUpperCase(),
      notes: data.notes,
    });

    if (!newLead || !newLead.id) {
      throw new Error('Failed to create lead.');
    }
    return newLead;
  }

  static async updateLeadStatus(id: string, newStatus: LeadStatus): Promise<Lead> {
    const updated = await cgs_api.patch<Lead>(`/leads/${id}/status`, {
      status: newStatus.toUpperCase().replace(/\s+/g, '_'),
    });
    if (!updated || !updated.id) {
      throw new Error('Failed to update lead status.');
    }
    return updated;
  }

  static async assignLead(id: string, assignedTo: string): Promise<Lead> {
    const updated = await cgs_api.patch<Lead>(`/leads/${id}`, { assignedToUserId: assignedTo });
    if (!updated || !updated.id) {
      throw new Error('Failed to assign lead.');
    }
    return updated;
  }

  static async addNote(id: string, noteText: string): Promise<Lead> {
    const current = await this.getLeadById(id);
    const updatedNotes = current.notes ? `${current.notes}\n${noteText}` : noteText;
    const updated = await cgs_api.patch<Lead>(`/leads/${id}`, { notes: updatedNotes });
    return updated;
  }

  static async addLeadNote(id: string, noteText: string): Promise<Lead> {
    return this.addNote(id, noteText);
  }

  static async convertLeadToPatient(id: string): Promise<{ lead: Lead; patientId: string }> {
    return cgs_api.post<{ lead: Lead; patientId: string }>(`/leads/${id}/convert`);
  }

  static async deleteLead(id: string): Promise<void> {
    await cgs_api.delete(`/leads/${id}`);
  }
}
