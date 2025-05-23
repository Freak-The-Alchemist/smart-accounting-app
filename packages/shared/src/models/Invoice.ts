import { Currency } from './Currency';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';
export type PaymentMethod = 'bank_transfer' | 'credit_card' | 'cash' | 'mobile_money' | 'other';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  tax: number;
  discount?: number;
  total: number;
}

export interface InvoiceClient {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  address: {
    street: string;
    city: string;
    state?: string;
    country: string;
    postalCode?: string;
  };
  taxId?: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  number: string;
  client: InvoiceClient;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount?: number;
  total: number;
  currency: Currency;
  issueDate: Date;
  dueDate: Date;
  status: InvoiceStatus;
  paymentTerms: string;
  notes?: string;
  attachments?: string[];
  paymentMethod?: PaymentMethod;
  paymentDate?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    [key: string]: any;
  };
}

export interface InvoiceSummary {
  totalInvoiced: number;
  totalPaid: number;
  totalOverdue: number;
  totalDraft: number;
  byStatus: {
    [status in InvoiceStatus]: number;
  };
  byCurrency: {
    [currency in Currency]: number;
  };
  byMonth: {
    [month: string]: {
      invoiced: number;
      paid: number;
    };
  };
} 