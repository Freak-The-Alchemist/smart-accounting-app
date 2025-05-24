import { firestore } from '../firebase/config';
import { Invoice, InvoiceSummary, InvoiceStatus } from '../models/Invoice';
import { generateInvoiceNumber } from '../utils/invoiceUtils';

export class InvoiceService {
  private static instance: InvoiceService;
  private readonly collection = 'invoices';

  private constructor() {}

  static getInstance(): InvoiceService {
    if (!InvoiceService.instance) {
      InvoiceService.instance = new InvoiceService();
    }
    return InvoiceService.instance;
  }

  async createInvoice(invoice: Omit<Invoice, 'id' | 'number' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
    const invoiceNumber = await generateInvoiceNumber();
    const now = new Date();
    
    const newInvoice: Invoice = {
      ...invoice,
      id: firestore.collection(this.collection).doc().id,
      number: invoiceNumber,
      createdAt: now,
      updatedAt: now,
    };

    await firestore.collection(this.collection).doc(newInvoice.id).set(newInvoice);
    return newInvoice;
  }

  async getInvoice(id: string): Promise<Invoice | null> {
    const doc = await firestore.collection(this.collection).doc(id).get();
    return doc.exists ? (doc.data() as Invoice) : null;
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    const invoiceRef = firestore.collection(this.collection).doc(id);
    const doc = await invoiceRef.get();

    if (!doc.exists) {
      throw new Error('Invoice not found');
    }

    const updatedInvoice = {
      ...updates,
      updatedAt: new Date(),
    };

    await invoiceRef.update(updatedInvoice);
    return { ...doc.data() as Invoice, ...updatedInvoice };
  }

  async deleteInvoice(id: string): Promise<void> {
    await firestore.collection(this.collection).doc(id).delete();
  }

  async listInvoices(filters?: {
    status?: InvoiceStatus;
    startDate?: Date;
    endDate?: Date;
    clientId?: string;
  }): Promise<Invoice[]> {
    let query = firestore.collection(this.collection);

    if (filters?.status) {
      query = query.where('status', '==', filters.status);
    }

    if (filters?.startDate) {
      query = query.where('issueDate', '>=', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.where('issueDate', '<=', filters.endDate);
    }

    if (filters?.clientId) {
      query = query.where('client.id', '==', filters.clientId);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => doc.data() as Invoice);
  }

  async getInvoiceSummary(userId: string): Promise<InvoiceSummary> {
    const invoices = await this.listInvoices();
    const summary: InvoiceSummary = {
      totalInvoiced: 0,
      totalPaid: 0,
      totalOverdue: 0,
      totalDraft: 0,
      byStatus: {
        draft: 0,
        sent: 0,
        paid: 0,
        overdue: 0,
      },
      byCurrency: {},
      byMonth: {},
    };

    invoices.forEach(invoice => {
      // Update totals
      summary.totalInvoiced += invoice.total;
      if (invoice.status === 'paid') {
        summary.totalPaid += invoice.total;
      } else if (invoice.status === 'overdue') {
        summary.totalOverdue += invoice.total;
      } else if (invoice.status === 'draft') {
        summary.totalDraft += invoice.total;
      }

      // Update status breakdown
      summary.byStatus[invoice.status] += invoice.total;

      // Update currency breakdown
      if (!summary.byCurrency[invoice.currency]) {
        summary.byCurrency[invoice.currency] = 0;
      }
      summary.byCurrency[invoice.currency] += invoice.total;

      // Update monthly breakdown
      const month = invoice.issueDate.toISOString().slice(0, 7);
      if (!summary.byMonth[month]) {
        summary.byMonth[month] = { invoiced: 0, paid: 0 };
      }
      summary.byMonth[month].invoiced += invoice.total;
      if (invoice.status === 'paid') {
        summary.byMonth[month].paid += invoice.total;
      }
    });

    return summary;
  }

  async markAsPaid(id: string, paymentMethod: string, paymentDate: Date): Promise<Invoice> {
    return this.updateInvoice(id, {
      status: 'paid',
      paymentMethod,
      paymentDate,
    });
  }

  async sendInvoice(id: string): Promise<Invoice> {
    return this.updateInvoice(id, {
      status: 'sent',
    });
  }
} 