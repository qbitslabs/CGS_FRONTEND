/* Staff client for the global WhatsApp templates. */
import { cgs_api } from '../api/client';

export interface OutboundTemplate {
  key: string;
  purpose: string;
  metaName: string;
  languageCode: string;
  status: string;
  trySessionFirst: boolean;
  documentHeader: boolean;
  recipientKind: 'appointment' | 'patient' | 'lead' | 'invoice';
  parameters: Array<{ index: number; source: string; label: string }>;
}

export interface OutboundPreviewItem {
  recordId: string;
  phone: string;
  participantName: string;
  preview: string;
  parameters: string[];
}

type OutboundBody = {
  templateKey: string;
  appointmentIds?: string[];
  patientIds?: string[];
  leadIds?: string[];
  invoiceIds?: string[];
};

export class OutboundService {
  static listTemplates() {
    return cgs_api.get<OutboundTemplate[]>('/whatsapp/templates');
  }

  static preview(body: OutboundBody) {
    return cgs_api.post<{ template: OutboundTemplate; items: OutboundPreviewItem[] }>('/whatsapp/outbound/preview', body);
  }

  static send(body: OutboundBody) {
    return cgs_api.post<{
      queued: Array<{ jobId: string; phone: string; preview: string }>;
      skipped: Array<{ phone: string; reason: string }>;
    }>('/whatsapp/outbound', body);
  }
}
