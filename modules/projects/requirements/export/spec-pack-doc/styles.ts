/** Print / Word-friendly styles embedded in the DOC HTML package. */

export function specPackDocStyles(): string {
  return `
    body {
      font-family: "Segoe UI", Calibri, Arial, sans-serif;
      color: #111827;
      font-size: 11pt;
      line-height: 1.45;
      margin: 24px;
    }
    h1 { font-size: 20pt; margin: 0 0 8px; }
    h2 {
      font-size: 14pt;
      margin: 28px 0 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #d1d5db;
    }
    h3 { font-size: 12pt; margin: 18px 0 6px; }
    h4 { font-size: 11pt; margin: 12px 0 4px; color: #374151; }
    p { margin: 0 0 8px; }
    .meta { color: #6b7280; font-size: 10pt; margin-bottom: 16px; }
    .note {
      background: #f9fafb;
      border-left: 3px solid #9ca3af;
      padding: 8px 12px;
      margin: 12px 0 20px;
    }
    .chip {
      display: inline-block;
      padding: 1px 8px;
      border: 1px solid #d1d5db;
      border-radius: 0;
      font-size: 9pt;
      color: #374151;
      margin-right: 6px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 6px 0 12px;
    }
    th, td {
      border: 1px solid #e5e7eb;
      padding: 6px 8px;
      text-align: left;
      vertical-align: top;
    }
    th { background: #f3f4f6; font-weight: 600; width: 28%; }
    ul, ol { margin: 4px 0 10px 18px; padding: 0; }
    li { margin: 2px 0; }
    .toc { margin: 0 0 16px; }
    .toc-group {
      font-weight: 600;
      margin: 10px 0 4px;
      color: #111827;
    }
    .toc-item {
      margin: 2px 0;
      color: #374151;
    }
    .toc-group ~ .toc-item { margin-left: 1rem; }
    .muted { color: #6b7280; }
    .error { color: #b91c1c; }
    .fn-block {
      border: 1px solid #e5e7eb;
      padding: 10px 12px;
      margin: 10px 0 14px;
    }
    .uc-block {
      border-top: 1px solid #e5e7eb;
      margin-top: 12px;
      padding-top: 10px;
    }
  `
}
