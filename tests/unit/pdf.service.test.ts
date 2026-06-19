import { describe, it, expect } from 'vitest';
import { PdfLayoutEngine } from '../../src/features/resume/pdf/pdf.service';

describe('PdfLayoutEngine', () => {
  it('creates an engine with a single A4 page initially', async () => {
    const engine = await PdfLayoutEngine.create({ title: 'Test PDF' });
    expect(engine.doc.getPageCount()).toBe(1);
    expect(engine.PAGE_WIDTH).toBeCloseTo(595.28);
    expect(engine.PAGE_HEIGHT).toBeCloseTo(841.89);
  });

  it('adds a new page automatically when overflow occurs', async () => {
    const engine = await PdfLayoutEngine.create();
    
    // Fill the page until overflow
    for (let i = 0; i < 50; i++) {
      engine.drawText(`Line ${i}`, {
        font: engine.fontRegular,
        size: 20,
        lineHeight: 24
      });
    }

    expect(engine.doc.getPageCount()).toBeGreaterThan(1);
  });

  it('wraps text properly within bounds', async () => {
    const engine = await PdfLayoutEngine.create();
    
    const longText = 'This is a very long string that should be wrapped onto multiple lines because it exceeds the maximum width allowed for a single line on an A4 piece of paper.';
    const lines = engine.wrapText(longText, 200, engine.fontRegular, 12);
    
    expect(lines.length).toBeGreaterThan(1);
    expect(lines[0]!.includes('This is a very long')).toBe(true);
  });

  it('sanitizes text safely to avoid pdf-lib throwing', async () => {
    const engine = await PdfLayoutEngine.create();
    
    const nastyString = 'Smart “quotes” and ‘apostrophes’ – plus ellipses… and emoji 🚀';
    const safe = engine.sanitize(nastyString)!;
    
    expect(safe).not.toContain('“');
    expect(safe).toContain('"');
    expect(safe).not.toContain('‘');
    expect(safe).toContain("'");
    expect(safe).not.toContain('🚀');
  });

  it('generates a valid PDF Uint8Array', async () => {
    const engine = await PdfLayoutEngine.create();
    engine.drawText('Hello World', { font: engine.fontBold, size: 12 });
    
    const bytes = await engine.save();
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(100);
  });
});
