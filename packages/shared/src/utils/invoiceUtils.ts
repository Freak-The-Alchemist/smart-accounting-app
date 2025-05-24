import { firestore } from '../firebase/config';

export async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  
  // Get the last invoice number for the current month
  const lastInvoice = await firestore
    .collection('invoices')
    .where('number', '>=', `INV-${year}${month}`)
    .where('number', '<', `INV-${year}${month}Z`)
    .orderBy('number', 'desc')
    .limit(1)
    .get();

  let sequence = 1;
  if (!lastInvoice.empty) {
    const lastNumber = lastInvoice.docs[0].data().number;
    const lastSequence = parseInt(lastNumber.split('-')[2]);
    sequence = lastSequence + 1;
  }

  return `INV-${year}${month}-${String(sequence).padStart(4, '0')}`;
}

export function calculateInvoiceTotals(items: Array<{
  quantity: number;
  unitPrice: number;
  tax: number;
  discount?: number;
}>): {
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
} {
  const subtotal = items.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice);
  }, 0);

  const tax = items.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice * (item.tax / 100));
  }, 0);

  const discount = items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unitPrice;
    return sum + (itemTotal * ((item.discount || 0) / 100));
  }, 0);

  const total = subtotal + tax - discount;

  return {
    subtotal,
    tax,
    discount,
    total,
  };
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function isInvoiceOverdue(invoice: {
  dueDate: Date;
  status: string;
}): boolean {
  if (invoice.status === 'paid') {
    return false;
  }

  const today = new Date();
  const dueDate = new Date(invoice.dueDate);
  return today > dueDate;
}

export function getDaysUntilDue(dueDate: Date): number {
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function validateInvoiceData(invoice: {
  client: {
    name: string;
    email: string;
    address: {
      street: string;
      city: string;
      country: string;
    };
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  issueDate: Date;
  dueDate: Date;
}): string[] {
  const errors: string[] = [];

  // Validate client
  if (!invoice.client.name) {
    errors.push('Client name is required');
  }
  if (!invoice.client.email) {
    errors.push('Client email is required');
  }
  if (!invoice.client.address.street) {
    errors.push('Client street address is required');
  }
  if (!invoice.client.address.city) {
    errors.push('Client city is required');
  }
  if (!invoice.client.address.country) {
    errors.push('Client country is required');
  }

  // Validate items
  if (!invoice.items.length) {
    errors.push('At least one item is required');
  } else {
    invoice.items.forEach((item, index) => {
      if (!item.description) {
        errors.push(`Item ${index + 1}: Description is required`);
      }
      if (item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
      }
      if (item.unitPrice <= 0) {
        errors.push(`Item ${index + 1}: Unit price must be greater than 0`);
      }
    });
  }

  // Validate dates
  if (!invoice.issueDate) {
    errors.push('Issue date is required');
  }
  if (!invoice.dueDate) {
    errors.push('Due date is required');
  }
  if (invoice.issueDate && invoice.dueDate) {
    const issue = new Date(invoice.issueDate);
    const due = new Date(invoice.dueDate);
    if (due < issue) {
      errors.push('Due date must be after issue date');
    }
  }

  return errors;
} 