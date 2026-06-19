import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib';

export interface PdfOptions {
  title?: string;
  author?: string;
}

/**
 * A simple layout engine to handle text wrapping and multi-page overflow in pdf-lib.
 * Uses A4 standard sizing (595.28 x 841.89 points).
 */
export class PdfLayoutEngine {
  public readonly doc: PDFDocument;
  public page!: PDFPage;
  public fontRegular!: PDFFont;
  public fontBold!: PDFFont;
  public fontItalic!: PDFFont;

  // A4 dimensions
  public readonly PAGE_WIDTH = 595.28;
  public readonly PAGE_HEIGHT = 841.89;
  
  // Margins
  public marginX = 36; // 0.5 inch
  public marginY = 36;
  
  // Current cursor
  public cursorX = 36;
  public cursorY = 841.89 - 36;

  private constructor(doc: PDFDocument) {
    this.doc = doc;
  }

  static async create(options?: PdfOptions): Promise<PdfLayoutEngine> {
    const doc = await PDFDocument.create();
    if (options?.title) doc.setTitle(options.title);
    if (options?.author) doc.setAuthor(options.author);
    
    const engine = new PdfLayoutEngine(doc);
    
    engine.fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    engine.fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    engine.fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);
    
    engine.addPage();
    return engine;
  }

  addPage() {
    this.page = this.doc.addPage([this.PAGE_WIDTH, this.PAGE_HEIGHT]);
    this.cursorX = this.marginX;
    this.cursorY = this.PAGE_HEIGHT - this.marginY;
  }

  checkOverflow(requiredSpace: number) {
    if (this.cursorY - requiredSpace < this.marginY) {
      this.addPage();
    }
  }

  moveDown(points: number) {
    this.cursorY -= points;
  }

  /**
   * Cleans text to avoid pdf-lib throwing on un-encoded characters.
   * Since we are using standard fonts (WinAnsiEncoding), some chars will drop.
   */
  sanitize(text: string | undefined | null): string {
    if (!text) return '';
    // Basic sanitization replacing unsupported smart quotes, dashes, etc with ASCII
    return text
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/[\u2026]/g, '...')
      // Replace non-ascii to avoid font crash for now
      // eslint-disable-next-line no-control-regex
      .replace(/[^\x00-\x7F]/g, '');
  }

  /**
   * Splits a single string into multiple lines based on maxWidth and font size.
   */
  wrapText(text: string, maxWidth: number, font: PDFFont, size: number): string[] {
    const safeText = this.sanitize(text);
    const words = safeText.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, size);
      
      if (width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  }

  /**
   * Draws text, handling word-wrapping and multi-page overflow automatically.
   * Returns the new Y position.
   */
  drawText(text: string, options: {
    font: PDFFont;
    size: number;
    color?: { r: number, g: number, b: number };
    x?: number;
    maxWidth?: number;
    lineHeight?: number;
  }): number {
    const lines = this.wrapText(
      text, 
      options.maxWidth || (this.PAGE_WIDTH - this.marginX * 2), 
      options.font, 
      options.size
    );
    
    const color = options.color ? rgb(options.color.r, options.color.g, options.color.b) : rgb(0, 0, 0);
    const lineHeight = options.lineHeight || (options.size * 1.2);

    for (const line of lines) {
      this.checkOverflow(lineHeight);
      this.page.drawText(line, {
        x: options.x !== undefined ? options.x : this.cursorX,
        y: this.cursorY - options.size, // drawText y is baseline, so move down by font size
        size: options.size,
        font: options.font,
        color
      });
      this.moveDown(lineHeight);
    }

    return this.cursorY;
  }

  async save(): Promise<Uint8Array> {
    return this.doc.save();
  }
}

export interface IPdfRenderer {
  render(engine: PdfLayoutEngine, resume: any): Promise<void>;
}

export async function generatePdf(resume: any): Promise<Uint8Array> {
  const engine = await PdfLayoutEngine.create({ title: resume.name });
  
  let renderer: IPdfRenderer;
  if (resume.templateId === 'ats-classic') {
    const { AtsPdfRenderer } = await import('./ats.pdf-renderer');
    renderer = new AtsPdfRenderer();
  } else {
    const { ModernPdfRenderer } = await import('./modern.pdf-renderer');
    renderer = new ModernPdfRenderer();
  }

  await renderer.render(engine, resume);
  return engine.save();
}
