declare module '@google-cloud/vision' {
  export class ImageAnnotatorClient {
    constructor(options?: { keyFilename?: string; credentials?: { client_email: string; private_key: string } });
    textDetection(image: { content?: string; source?: { imageUri?: string } }): Promise<[TextAnnotation]>;
    documentTextDetection(image: { content?: string; source?: { imageUri?: string } }): Promise<[DocumentTextAnnotation]>;
    labelDetection(image: { content?: string; source?: { imageUri?: string } }): Promise<[LabelAnnotation]>;
  }

  export interface TextAnnotation {
    text: string;
    pages: Page[];
    textAnnotations: TextAnnotation[];
  }

  export interface DocumentTextAnnotation {
    text: string;
    pages: Page[];
    textAnnotations: TextAnnotation[];
  }

  export interface LabelAnnotation {
    labelAnnotations: Label[];
  }

  export interface Page {
    width: number;
    height: number;
    blocks: Block[];
  }

  export interface Block {
    boundingBox: BoundingPoly;
    paragraphs: Paragraph[];
  }

  export interface Paragraph {
    boundingBox: BoundingPoly;
    words: Word[];
  }

  export interface Word {
    boundingBox: BoundingPoly;
    symbols: Symbol[];
  }

  export interface Symbol {
    boundingBox: BoundingPoly;
    text: string;
  }

  export interface BoundingPoly {
    vertices: Vertex[];
  }

  export interface Vertex {
    x: number;
    y: number;
  }

  export interface Label {
    description: string;
    score: number;
  }
} 