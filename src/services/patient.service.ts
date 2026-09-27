/* Patient directory and chart reads/writes against CGS.
 * No mock patient names in the client. */
import { cgs_api } from '../api/client';
import { Patient, PatientStatus } from '../types';
import { PaginatedResult } from './lead.service';

export interface PatientFilterOptions {
  search?: string;
  status?: PatientStatus | 'All';
  sortBy?: 'name' | 'lastActivity' | 'createdDate' | 'age';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  doctorId?: string;
}

export class PatientService {
  static async getPatients(options: PatientFilterOptions = {}): Promise<PaginatedResult<Patient>> {
    const {
      search = '',
      status = 'All',
      page = 1,
      pageSize = 10,
      doctorId,
    } = options;

    const result = await cgs_api.get<any>('/patients', {
      page,
      limit: pageSize,
      search: search || undefined,
      status: status !== 'All' ? status : undefined,
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

  static async getPatientById(id: string): Promise<Patient> {
    const patient = await cgs_api.get<Patient>(`/patients/${id}`);
    if (!patient || !patient.id) {
      throw new Error(`Patient with ID ${id} not found.`);
    }
    return patient;
  }

  static async createPatient(
    data: Omit<Patient, 'id' | 'createdDate' | 'lastActivity' | 'activities' | 'age' | 'gender'> & {
      age?: number | null;
      gender?: 'Male' | 'Female' | 'Other' | null;
    }
  ): Promise<Patient> {
    const newPatient = await cgs_api.post<Patient>('/patients', {
      name: data.name,
      phone: data.phone,
      email: data.email || undefined,
      gender: data.gender ? data.gender.toUpperCase() : undefined,
      age: data.age ?? undefined,
      bloodGroup: data.bloodGroup,
      address: data.address,
      allergies: data.allergies || [],
      medicalHistoryNotes: data.medicalHistoryNotes,
      status: data.status.toUpperCase().replace(/\s+/g, '_'),
    });

    if (!newPatient || !newPatient.id) {
      throw new Error('Failed to create patient record.');
    }
    return newPatient;
  }

  static async updatePatient(id: string, data: Partial<Patient>): Promise<Patient> {
    const updated = await cgs_api.patch<Patient>(`/patients/${id}`, data);
    if (!updated || !updated.id) {
      throw new Error('Failed to update patient record.');
    }
    return updated;
  }

  static async addPatientNote(id: string, noteText: string): Promise<Patient> {
    const current = await this.getPatientById(id);
    const updatedNotes = current.medicalHistoryNotes
      ? `${current.medicalHistoryNotes}\n${noteText}`
      : noteText;

    return this.updatePatient(id, { medicalHistoryNotes: updatedNotes });
  }
}
