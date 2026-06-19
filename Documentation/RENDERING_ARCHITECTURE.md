# Rendering Architecture

## Overview

The Resume Rendering Engine (M4.2) is responsible for converting a `Resume`
data object (with structured sections) into a static, standalone HTML string
suitable for previewing in an iframe and later converting to PDF.

---

## Renderers

The architecture uses a factory pattern to select the correct renderer based
on the `templateId`.

### `RendererFactory`

A static factory (`src/features/resume/renderers/renderer.factory.ts`) that
takes a `TemplateId` and returns an object implementing `ResumeRenderer`.
It uses an exhaustive switch statement so TypeScript will throw a compile error
if a new template is added to `TemplateId` without a corresponding renderer.

### `ResumeRenderer` Interface

```typescript
export interface ResumeRenderer {
  render(resume: Resume): string;
}
```

### Implementations

1.  **`ModernRenderer`**: Renders a two-column layout. It categorizes sections
    into "sidebar" (Skills, Education, Custom) and "main" (Summary, Experience,
    Project) and renders them in their respective columns.
2.  **`ATSRenderer`**: Renders a single-column, plain, traditional layout. It
    simply iterates over all sections in order.

---

## Security & Reliability

-   **HTML Escaping**: All renderers use an internal `esc(string)` helper to
    safely escape HTML entities, preventing XSS attacks from malicious resume
    data. (Tested via `xssResume` in `renderer.test.ts`).
-   **Graceful Degradation**: Structured data fields are checked. If a field
    is missing or malformed (e.g., `items` is a string instead of an array), the
    renderer falls back gracefully (e.g., "No skills listed" instead of crashing).

---

## Preview Panel Integration

The options UI includes a Live Preview panel.

-   **Iframe Sandbox**: The rendered HTML is injected into an `<iframe sandbox="allow-same-origin">`
    via the `srcdoc` attribute. This isolates the preview CSS from the extension CSS.
-   **Live Updates**: Event listeners on the resume form (`input`, `change`) trigger
    a debounced/immediate re-render, providing instant visual feedback.

---

## Auto-Versioning

To ensure data integrity, the system automatically creates a snapshot (`ResumeVersion`)
whenever the user explicitly saves a resume update via the form. This is handled
in the `options.ts` save handler by calling `ResumeService.createVersion`.
