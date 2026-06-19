import { PdfLayoutEngine, IPdfRenderer } from './pdf.service';
import type { Resume, ResumeSection } from '../../../core/types/resume';
import { rgb } from 'pdf-lib';

export class AtsPdfRenderer implements IPdfRenderer {
  async render(engine: PdfLayoutEngine, resume: Resume): Promise<void> {
    // 1. Title
    engine.drawText(resume.name, {
      font: engine.fontBold,
      size: 16,
      // center alignment needs x calculation, we'll approximate or just left align 
      // Actually let's center it:
    });
    
    // Quick center hack for ATS title
    const titleWidth = engine.fontBold.widthOfTextAtSize(engine.sanitize(resume.name), 16);
    const titleX = (engine.PAGE_WIDTH - titleWidth) / 2;
    // Overwrite previous draw
    engine.moveDown(-16 * 1.2); // move back up
    engine.drawText(resume.name, {
      font: engine.fontBold,
      size: 16,
      x: Math.max(engine.marginX, titleX),
    });

    engine.moveDown(10);

    // Sort sections
    const sorted = [...resume.sections].sort((a, b) => a.order - b.order);

    for (const section of sorted) {
      engine.checkOverflow(30); // Need space for title
      
      // Section Title
      engine.drawText(section.title.toUpperCase(), {
        font: engine.fontBold,
        size: 11,
      });
      
      // Line under title
      const lineY = engine.cursorY + 2;
      engine.page.drawLine({
        start: { x: engine.marginX, y: lineY },
        end: { x: engine.PAGE_WIDTH - engine.marginX, y: lineY },
        thickness: 1,
        color: rgb(0,0,0)
      });
      engine.moveDown(6);

      // Section Content
      this.renderSectionData(engine, section);
      engine.moveDown(10);
    }
  }

  private renderSectionData(engine: PdfLayoutEngine, s: ResumeSection) {
    const data = s.data as Record<string, any>;
    
    const str = (key: string) => (typeof data[key] === 'string' ? data[key] as string : '');
    const arr = (key: string) => (Array.isArray(data[key]) ? data[key] as string[] : []);

    switch (s.type) {
      case 'summary': {
        const text = str('text');
        if (text) {
          engine.drawText(text, { font: engine.fontRegular, size: 10, lineHeight: 14 });
        }
        break;
      }
      case 'experience': {
        const role = str('role');
        const company = str('company');
        const duration = str('duration');
        const bullets = arr('bullets');

        // Header: Role - Company (Left) | Duration (Right)
        const leftText = `${role}${company ? ` - ${company}` : ''}`;
        this.drawSplitLine(engine, leftText, duration, true);
        engine.moveDown(4);

        for (const bullet of bullets) {
          const bulletPrefix = '•  ';
          const indent = 15;
          const maxWidth = engine.PAGE_WIDTH - engine.marginX * 2 - indent;
          
          const lines = engine.wrapText(bullet, maxWidth, engine.fontRegular, 10);
          for (let i = 0; i < lines.length; i++) {
            engine.checkOverflow(12);
            const lineText = lines[i] || '';
            engine.drawText(i === 0 ? `${bulletPrefix}${lineText}` : lineText, {
              font: engine.fontRegular,
              size: 10,
              x: engine.marginX + (i === 0 ? 5 : indent + 5),
              lineHeight: 12
            });
          }
          engine.moveDown(2);
        }
        break;
      }
      case 'education': {
        const degree = str('degree');
        const uni = str('university');
        const year = str('year');
        const cgpa = str('cgpa');

        const leftText = `${degree}${uni ? ` - ${uni}` : ''}`;
        this.drawSplitLine(engine, leftText, year, true);
        if (cgpa) {
          engine.drawText(`GPA: ${cgpa}`, { font: engine.fontRegular, size: 10 });
        }
        break;
      }
      case 'project': {
        const title = str('title');
        const desc = str('description');
        const stack = arr('stack');
        
        engine.drawText(title, { font: engine.fontBold, size: 10 });
        if (desc) {
          engine.drawText(desc, { font: engine.fontRegular, size: 10, lineHeight: 14 });
        }
        if (stack.length) {
          engine.drawText(`Tech: ${stack.join(', ')}`, { font: engine.fontItalic, size: 9, color: { r: 0.3, g: 0.3, b: 0.3 } });
        }
        break;
      }
      case 'skills': {
        const items = arr('items');
        if (items.length) {
          engine.drawText(items.join(', '), { font: engine.fontRegular, size: 10, lineHeight: 14 });
        }
        break;
      }
      case 'custom': {
        const text = str('text');
        if (text) {
          engine.drawText(text, { font: engine.fontRegular, size: 10, lineHeight: 14 });
        }
        break;
      }
    }
  }

  private drawSplitLine(engine: PdfLayoutEngine, left: string, right: string, boldLeft: boolean = false) {
    engine.checkOverflow(12);
    const y = engine.cursorY - 10;
    
    if (left) {
      engine.page.drawText(engine.sanitize(left), {
        x: engine.marginX,
        y,
        size: 10,
        font: boldLeft ? engine.fontBold : engine.fontRegular
      });
    }
    
    if (right) {
      const rightWidth = engine.fontRegular.widthOfTextAtSize(engine.sanitize(right), 10);
      engine.page.drawText(engine.sanitize(right), {
        x: engine.PAGE_WIDTH - engine.marginX - rightWidth,
        y,
        size: 10,
        font: engine.fontRegular
      });
    }
    
    engine.moveDown(12);
  }
}
