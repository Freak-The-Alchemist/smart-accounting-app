declare module 'pdf-lib' {
  export class PDFDocument {
    static load(pdfBytes: Uint8Array | ArrayBuffer): Promise<PDFDocument>;
    save(): Promise<Uint8Array>;
    embedFont(font: PDFFont): Promise<PDFFont>;
    embedStandardFont(font: StandardFonts): Promise<PDFFont>;
    embedPngImage(pngBytes: Uint8Array): Promise<PDFImage>;
    embedJpgImage(jpgBytes: Uint8Array): Promise<PDFImage>;
    addPage(width?: number, height?: number): PDFPage;
    getPages(): PDFPage[];
    getPage(pageIndex: number): PDFPage;
  }

  export class PDFPage {
    drawText(text: string, options?: TextOptions): void;
    drawRectangle(options: RectangleOptions): void;
    drawLine(options: LineOptions): void;
    drawImage(image: PDFImage, options: ImageOptions): void;
    setFont(font: PDFFont): void;
    setFontSize(size: number): void;
    setPosition(x: number, y: number): void;
    getWidth(): number;
    getHeight(): number;
  }

  export class PDFFont {
    embed(): Promise<PDFFont>;
  }

  export class PDFImage {
    width: number;
    height: number;
  }

  export enum StandardFonts {
    Helvetica = 'Helvetica',
    HelveticaBold = 'Helvetica-Bold',
    HelveticaOblique = 'Helvetica-Oblique',
    HelveticaBoldOblique = 'Helvetica-BoldOblique',
    Courier = 'Courier',
    CourierBold = 'Courier-Bold',
    CourierOblique = 'Courier-Oblique',
    CourierBoldOblique = 'Courier-BoldOblique',
    TimesRoman = 'Times-Roman',
    TimesBold = 'Times-Bold',
    TimesItalic = 'Times-Italic',
    TimesBoldItalic = 'Times-BoldItalic',
  }

  export interface TextOptions {
    x: number;
    y: number;
    size?: number;
    font?: PDFFont;
    color?: RGB;
    maxWidth?: number;
    lineHeight?: number;
  }

  export interface RectangleOptions {
    x: number;
    y: number;
    width: number;
    height: number;
    color?: RGB;
    borderColor?: RGB;
    borderWidth?: number;
  }

  export interface LineOptions {
    start: { x: number; y: number };
    end: { x: number; y: number };
    color?: RGB;
    thickness?: number;
  }

  export interface ImageOptions {
    x: number;
    y: number;
    width?: number;
    height?: number;
  }

  export type RGB = { r: number; g: number; b: number };

  export const rgb: (r: number, g: number, b: number) => RGB;
} 