import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { formatCurrency } from './format';
import { config } from '../config';

interface ReceiptData {
  id: string;
  date: string;
  fuelType: string;
  litersSold: number;
  pricePerLiter: number;
  totalAmount: number;
  paymentMethod: string;
  attendantName?: string;
  pumpId?: string;
}

export async function generateFuelSalePDF(sale: ReceiptData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([300, 400]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);

  // Add company logo or header
  page.drawText('Smart Accounting', {
    x: 20,
    y: 370,
    size: 16,
    font: boldFont,
    color: rgb(0, 0, 0)
  });

  // Add receipt details
  const lines = [
    { text: 'Fuel Sale Receipt', font: boldFont, size: 14 },
    { text: `Receipt #: ${sale.id}`, font, size: 10 },
    { text: `Date: ${sale.date}`, font, size: 10 },
    { text: `Fuel Type: ${sale.fuelType}`, font, size: 10 },
    { text: `Liters: ${sale.litersSold.toFixed(2)}L`, font, size: 10 },
    { text: `Price/Liter: ${formatCurrency(sale.pricePerLiter)}`, font, size: 10 },
    { text: `Total: ${formatCurrency(sale.totalAmount)}`, font: boldFont, size: 12 },
    { text: `Payment: ${sale.paymentMethod}`, font, size: 10 }
  ];

  if (sale.attendantName) {
    lines.push({ text: `Attendant: ${sale.attendantName}`, font, size: 10 });
  }

  if (sale.pumpId) {
    lines.push({ text: `Pump: ${sale.pumpId}`, font, size: 10 });
  }

  // Draw all lines
  lines.forEach((line, i) => {
    page.drawText(line.text, {
      x: 20,
      y: 340 - i * 20,
      size: line.size,
      font: line.font,
      color: rgb(0, 0, 0)
    });
  });

  // Add footer
  page.drawText('Thank you for your business!', {
    x: 20,
    y: 50,
    size: 10,
    font,
    color: rgb(0.5, 0.5, 0.5)
  });

  return pdf.save();
}

// Mobile-specific function for sharing the PDF
export async function shareFuelSalePDF(sale: ReceiptData): Promise<void> {
  if (typeof window === 'undefined') {
    // We're in a mobile environment
    const { FileSystem } = await import('expo-file-system');
    const { Sharing } = await import('expo-sharing');

    const pdfBytes = await generateFuelSalePDF(sale);
    const fileUri = FileSystem.documentDirectory + `receipt-${sale.id}.pdf`;
    
    await FileSystem.writeAsStringAsync(fileUri, pdfBytes.toString('base64'), {
      encoding: FileSystem.EncodingType.Base64
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri);
    }
  } else {
    // We're in a web environment
    const pdfBytes = await generateFuelSalePDF(sale);
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${sale.id}.pdf`;
    link.click();
    
    URL.revokeObjectURL(url);
  }
} 