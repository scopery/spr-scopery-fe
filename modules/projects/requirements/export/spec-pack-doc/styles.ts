/** Print / Word-friendly styles embedded in the DOC HTML package. */

/** Geometric gothic stack: Century Gothic when installed (Word/Windows), Montserrat web fallback for browser preview. */
export const SPEC_PACK_FONT_STACK =
  '"Century Gothic", CenturyGothic, Montserrat, "Tw Cen MT", Futura, "Trebuchet MS", Arial, sans-serif'

export function specPackDocStyles(): string {
  return `
    body {
      font-family: ${SPEC_PACK_FONT_STACK};
      font-weight: 400;
      color: #111827;
      font-size: 11pt;
      line-height: 1.45;
      margin: 24px;
      -webkit-font-smoothing: antialiased;
    }
    h1, h2, h3, h4, th, strong, b, .toc-group {
      font-family: ${SPEC_PACK_FONT_STACK};
      font-weight: 700;
      mso-bidi-font-weight: bold;
    }
    h1 {
      font-size: 20pt;
      font-weight: 700;
      margin: 0 0 8px;
    }
    h2 {
      font-size: 14pt;
      font-weight: 700;
      margin: 28px 0 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #d1d5db;
    }
    h3 {
      font-size: 12pt;
      font-weight: 700;
      margin: 18px 0 6px;
    }
    h4 {
      font-size: 11.5pt;
      font-weight: 700;
      margin: 14px 0 6px;
      color: #111827;
    }
    p { margin: 0 0 8px; font-weight: 400; }
    .meta {
      color: #6b7280;
      font-size: 10pt;
      font-weight: 400;
      margin-bottom: 16px;
    }
    .note {
      background: #f9fafb;
      border-left: 3px solid #9ca3af;
      padding: 8px 12px;
      margin: 12px 0 20px;
      font-weight: 400;
    }
    .chip {
      display: inline-block;
      padding: 1px 8px;
      border: 1px solid #d1d5db;
      border-radius: 0;
      font-size: 9pt;
      font-weight: 400;
      color: #374151;
      margin-right: 6px;
    }
    table.chip-row {
      width: auto;
      border-collapse: separate;
      border-spacing: 6px 0;
      margin: 0 0 10px;
    }
    table.chip-row td.chip-cell {
      border: 1px solid #d1d5db;
      background: #f9fafb;
      padding: 2px 10px;
      font-size: 9pt;
      font-weight: 400;
      color: #374151;
      white-space: nowrap;
      width: auto;
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
    th {
      background: #f3f4f6;
      font-weight: 700;
      width: 28%;
    }
    td { font-weight: 400; }
    table.rules-table th {
      width: auto;
    }
    table.rules-table th:nth-child(1),
    table.rules-table td:nth-child(1) { width: 34%; }
    table.rules-table th:nth-child(2),
    table.rules-table td:nth-child(2) { width: 16%; }
    table.rules-table th:nth-child(3),
    table.rules-table td:nth-child(3) { width: 50%; }
    ul, ol { margin: 4px 0 10px 18px; padding: 0; }
    li { margin: 2px 0; font-weight: 400; }
    .toc { margin: 0 0 16px; }
    .toc-group {
      font-weight: 700;
      margin: 10px 0 4px;
      color: #111827;
    }
    .toc-item {
      margin: 2px 0;
      font-weight: 400;
      color: #374151;
    }
    .toc-group ~ .toc-item { margin-left: 1rem; }
    .muted { color: #6b7280; font-weight: 400; }
    .code-muted {
      color: #6b7280;
      font-weight: 400;
      font-size: 10pt;
    }
    .error { color: #b91c1c; }
    /* Indent only — no outline box around functions */
    .fn-block {
      border: none;
      padding: 0 0 8px 18px;
      margin: 8px 0 16px;
    }
    .uc-block {
      border-top: none;
      margin-top: 10px;
      padding-top: 4px;
      padding-left: 12px;
    }
    .section-label {
      font-size: 10.5pt;
      font-weight: 700;
      color: #374151;
      margin: 12px 0 4px;
    }
  `
}
