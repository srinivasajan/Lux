import { PdfLayoutEngine, IPdfRenderer } from './pdf.service';
import type { Resume, ResumeSection } from '../../../core/types/resume';
import { rgb } from 'pdf-lib';

export class ModernPdfRenderer implements IPdfRenderer {
  async render(engine: PdfLayoutEngine, resume: Resume): Promise<void> {
    const sidebarWidth = 180;
    const mainX = engine.marginX + sidebarWidth + 20;
    const mainWidth = engine.PAGE_WIDTH - mainX - engine.marginX;

    // We will paint a background for the sidebar
    // pdf-lib's drawRectangle starts from bottom-left
    // But we need it for the whole page (we assume 1 page for now for modern sidebar bg, or we can draw it dynamically).
    // Let's just draw it for the current page height
    engine.page.drawRectangle({
      x: 0,
      y: 0,
      width: engine.marginX + sidebarWidth,
      height: engine.PAGE_HEIGHT,
      color: rgb(30/255, 58/255, 138/255), // #1e3a8a
    });

    const startY = engine.cursorY;

    // ── Sidebar ────────────────────────────────────────────────────────────
    engine.cursorX = engine.marginX;
    
    // Name
    engine.drawText(resume.name, {
      font: engine.fontBold,
      size: 18,
      color: { r: 1, g: 1, b: 1 },
      maxWidth: sidebarWidth
    });
    engine.moveDown(20);

    const sidebarTypes = new Set(['skills', 'education', 'custom']);
    const sorted = [...resume.sections].sort((a, b) => a.order - b.order);
    const sidebarSections = sorted.filter(s => sidebarTypes.has(s.type));
    const mainSections = sorted.filter(s => !sidebarTypes.has(s.type));

    for (const section of sidebarSections) {
      this.renderSidebarSection(engine, section, sidebarWidth);
      engine.moveDown(15);
    }

    const sidebarBottomY = engine.cursorY;

    // ── Main Column ────────────────────────────────────────────────────────
    engine.cursorY = startY; // Reset to top
    engine.cursorX = mainX;

    for (const section of mainSections) {
      this.renderMainSection(engine, section, mainWidth);
      engine.moveDown(15);
    }

    const mainBottomY = engine.cursorY;

    // Restore cursor to lowest point
    engine.cursorY = Math.min(sidebarBottomY, mainBottomY);
    engine.cursorX = engine.marginX;
  }

  private renderSidebarSection(engine: PdfLayoutEngine, s: ResumeSection, maxWidth: number) {
    // Title
    engine.drawText(s.title.toUpperCase(), {
      font: engine.fontBold,
      size: 10,
      color: { r: 1, g: 1, b: 1 },
      maxWidth
    });
    
    // Separator
    const lineY = engine.cursorY + 4;
    engine.page.drawLine({
      start: { x: engine.cursorX, y: lineY },
      end: { x: engine.cursorX + maxWidth, y: lineY },
      thickness: 1,
      color: rgb(1, 1, 1),
      opacity: 0.3
    });
    engine.moveDown(8);

    const data = s.data as Record<string, any>;
    const str = (key: string) => (typeof data[key] === 'string' ? data[key] as string : '');
    const arr = (key: string) => (Array.isArray(data[key]) ? data[key] as string[] : []);
    const textColor = { r: 0.9, g: 0.9, b: 0.9 };

    if (s.type === 'skills') {
      const items = arr('items');
      for (const item of items) {
        engine.drawText(item, { font: engine.fontRegular, size: 9, color: textColor, maxWidth, lineHeight: 12 });
      }
    } else if (s.type === 'education') {
      const degree = str('degree');
      const uni = str('university');
      const year = str('year');
      
      if (degree) engine.drawText(degree, { font: engine.fontBold, size: 9, color: { r: 1, g: 1, b: 1 }, maxWidth, lineHeight: 12 });
      if (uni) engine.drawText(uni, { font: engine.fontRegular, size: 8, color: textColor, maxWidth, lineHeight: 10 });
      if (year) engine.drawText(year, { font: engine.fontItalic, size: 8, color: { r: 0.7, g: 0.7, b: 0.7 }, maxWidth, lineHeight: 10 });
    } else if (s.type === 'custom') {
      const text = str('text');
      if (text) {
        engine.drawText(text, { font: engine.fontRegular, size: 9, color: textColor, maxWidth, lineHeight: 12 });
      }
    }
  }

  private renderMainSection(engine: PdfLayoutEngine, s: ResumeSection, maxWidth: number) {
    // Title
    engine.drawText(s.title.toUpperCase(), {
      font: engine.fontBold,
      size: 11,
      color: { r: 30/255, g: 58/255, b: 138/255 }, // #1e3a8a
      maxWidth
    });
    
    const lineY = engine.cursorY + 4;
    engine.page.drawLine({
      start: { x: engine.cursorX, y: lineY },
      end: { x: engine.cursorX + maxWidth, y: lineY },
      thickness: 1.5,
      color: rgb(30/255, 58/255, 138/255)
    });
    engine.moveDown(8);

    const data = s.data as Record<string, any>;
    const str = (key: string) => (typeof data[key] === 'string' ? data[key] as string : '');
    const arr = (key: string) => (Array.isArray(data[key]) ? data[key] as string[] : []);

    if (s.type === 'summary') {
      const text = str('text');
      if (text) engine.drawText(text, { font: engine.fontRegular, size: 10, maxWidth, lineHeight: 14 });
    } else if (s.type === 'experience') {
      const role = str('role');
      const company = str('company');
      const duration = str('duration');
      const bullets = arr('bullets');

      // Top line
      engine.drawText(role, { font: engine.fontBold, size: 10, maxWidth });
      engine.cursorY += 12; // move back up
      const rightWidth = engine.fontRegular.widthOfTextAtSize(engine.sanitize(duration), 9);
      engine.drawText(duration, { font: engine.fontRegular, size: 9, x: engine.cursorX + maxWidth - rightWidth, color: { r: 0.4, g: 0.4, b: 0.4 }});
      
      if (company) {
        engine.drawText(company, { font: engine.fontItalic, size: 9, color: { r: 0.3, g: 0.3, b: 0.3 }, maxWidth });
      }
      engine.moveDown(4);

      for (const bullet of bullets) {
        const indent = 12;
        const lines = engine.wrapText(bullet, maxWidth - indent, engine.fontRegular, 9);
        for (let i = 0; i < lines.length; i++) {
          const lineText = lines[i] || '';
          engine.drawText(i === 0 ? `•  ${lineText}` : lineText, {
            font: engine.fontRegular,
            size: 9,
            x: engine.cursorX + (i === 0 ? 0 : indent),
            lineHeight: 12
          });
        }
      }
    } else if (s.type === 'project') {
      const title = str('title');
      const desc = str('description');
      const stack = arr('stack');
      
      engine.drawText(title, { font: engine.fontBold, size: 10, maxWidth });
      if (desc) engine.drawText(desc, { font: engine.fontRegular, size: 9, maxWidth, lineHeight: 13 });
      if (stack.length) engine.drawText(`Tech: ${stack.join(', ')}`, { font: engine.fontItalic, size: 8, color: { r: 0.4, g: 0.4, b: 0.4 }, maxWidth });
    } else if (s.type === 'skills' || s.type === 'custom') {
      // Fallback if they put skills in main somehow
      const text = str('text') || arr('items').join(', ');
      if (text) engine.drawText(text, { font: engine.fontRegular, size: 10, maxWidth, lineHeight: 14 });
    }
  }
}
