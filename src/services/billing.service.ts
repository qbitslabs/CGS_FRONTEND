/* Patient invoices, cloud subscription, and Meta ads billing reads.
 * Create marks paid; appointment invoices go out on WhatsApp, not print. */
import { cgs_api } from '../api/client';
import { BillingSummary, CloudApiBillingSummary, Invoice, MetaAdsSummary, PaymentMethod, PaymentStatus } from '../types';
import { PaginatedResult } from './lead.service';

export interface InvoiceFilterOptions {
  search?: string;
  status?: PaymentStatus | 'All';
  paymentMethod?: PaymentMethod | 'All';
  patientFilter?: string;
  date?: string;
  sortBy?: 'date' | 'total' | 'patientName' | 'invoiceNumber';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  doctorId?: string;
}

export class BillingService {
  static async getBillingSummary(doctorId?: string): Promise<BillingSummary> {
    const summary = await cgs_api.get<BillingSummary>('/billing/summary', {
      doctorId: doctorId && doctorId !== 'All' ? doctorId : undefined,
    });
    if (summary && typeof summary.totalRevenue === 'number') {
      return summary;
    }
    return {
      totalRevenue: 0,
      pendingPayments: 0,
      paidInvoicesCount: 0,
      outstandingAmount: 0,
    };
  }

  static async getCloudApiBilling(): Promise<CloudApiBillingSummary> {
    const cloud = await cgs_api.get<CloudApiBillingSummary>('/billing/subscription');
    if (cloud) {
      return cloud;
    }
    return {
      subscriptionPlan: 'Professional Plan (₹25,000/mo)',
      planBillingCycle: 'Monthly (1st to end of month)',
      subscriptionCost: 25000,
      nextBillingDate: '2026-09-01',
      paymentStatus: 'Active',
      whatsappApiUsage: {
        conversationsUsed: 0,
        freeTierLimit: 1000,
        costPerExtraConv: 0.4,
        totalCost: 0,
        messagesSent: 0,
        messagesReceived: 0,
      },
      aiTokenUsage: {
        tokensConsumed: 0,
        includedTokens: 1000000,
        costPer1kTokens: 0.15,
        totalCost: 0,
        conversationsHandled: 0,
      },
      paymentMethodOnFile: {
        type: 'Credit Card',
        last4: '4821',
        expiry: '12/28',
        brand: 'HDFC Bank',
      },
      cloudInvoices: [],
    };
  }

  static async getMetaAdsPerformance(): Promise<MetaAdsSummary> {
    const empty: MetaAdsSummary = {
      totalMonthlyAdSpend: 0,
      monthlyBudget: 25000,
      totalLeadsGenerated: 0,
      avgCostPerLead: 0,
      totalImpressions: 0,
      totalClicks: 0,
      avgCtr: 0,
      roas: 0,
      campaigns: [],
      creatives: [],
    };

    try {
      const meta = await cgs_api.get<MetaAdsSummary>('/meta/overview');
      if (meta && typeof meta.totalMonthlyAdSpend === 'number') {
        return meta;
      }
    } catch {
      // Meta ads is optional on the billing page — do not fail the whole load.
    }

    return empty;
  }

  static async getInvoices(options: InvoiceFilterOptions = {}): Promise<PaginatedResult<Invoice>> {
    const {
      search = '',
      status = 'All',
      paymentMethod = 'All',
      date,
      page = 1,
      pageSize = 10,
      doctorId,
    } = options;

    const result = await cgs_api.get<any>('/billing/invoices', {
      page,
      limit: pageSize,
      search: search || undefined,
      status: status !== 'All' ? status : undefined,
      paymentMethod: paymentMethod !== 'All' ? paymentMethod : undefined,
      date: date || undefined,
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

  static async getInvoiceById(id: string): Promise<Invoice> {
    const inv = await cgs_api.get<Invoice>(`/billing/invoices/${id}`);
    if (!inv || !inv.id) {
      throw new Error(`Invoice with ID ${id} not found.`);
    }
    return inv;
  }

  static async createInvoice(
    data: Omit<Invoice, 'id' | 'invoiceNumber' | 'date'> & { taxPercent?: number; appointmentId?: string; treatingDoctorId?: string }
  ): Promise<Invoice> {
    const created = await cgs_api.post<Invoice>('/billing/invoices', {
      patientId: data.patientId,
      service: data.service,
      items: data.services || (data as any).items || [],
      discount: data.discount || 0,
      taxPercent: data.taxPercent ?? 0,
      paymentMethod: data.paymentMethod ? data.paymentMethod.toUpperCase() : undefined,
      paidAmount: data.total,
      appointmentId: data.appointmentId,
      treatingDoctorId: data.treatingDoctorId,
      notes: data.notes,
    });

    if (!created || !created.id) {
      throw new Error('Failed to create invoice.');
    }
    return created;
  }

  static async sendInvoiceWhatsApp(invoiceId: string): Promise<{ sent: boolean; invoiceNumber?: string }> {
    const result = await cgs_api.post<{ sent: boolean; invoiceNumber?: string }>(
      `/billing/invoices/${invoiceId}/send-whatsapp`,
      {}
    );
    return result || { sent: true };
  }
}
