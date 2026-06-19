# PDF Architecture

## Overview

The `PdfService` acts as a facade around `pdf-lib` to generate multi-page PDF documents. Unlike HTML, `pdf-lib` does not inherently understand text-wrapping or page boundaries. The `PdfLayoutEngine` solves this by introducing a stateful cursor (`x` and `y`) and bounds checking.

## Key Components

1. **`PdfLayoutEngine` (`src/features/resume/pdf/pdf.service.ts`)**
   - Manages the internal `PDFDocument` instance.
   - Holds standard embedded fonts (Helvetica).
   - Tracks cursor position `cursorX` and `cursorY`.
   - Contains a `wrapText` method to break long strings into an array of lines based on the width of the font.
   - Automatically handles pagination via `checkOverflow()`.

2. **`IPdfRenderer` Interface**
   - Interface that allows rendering different templates onto the `PdfLayoutEngine`.

3. **`AtsPdfRenderer` & `ModernPdfRenderer`**
   - Renderers that use the engine to manually plot text and shapes (like the sidebar background and separator lines) at the correct coordinates.
   - Ensure the correct font size and line height is used for each data type.

## Font & Unicode Support

Currently, `pdf-lib` uses `StandardFonts.Helvetica` (WinAnsiEncoding), which supports standard Latin characters. A `sanitize()` method safely strips non-ASCII and smart quotes from the text before drawing it to prevent `pdf-lib` throwing encoding errors.

## Usage

```typescript
const pdfBytes = await generatePdf(resume);
const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
// Trigger download via <a> tag
```
