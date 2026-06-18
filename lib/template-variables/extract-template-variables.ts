/** Matches {{variable_name}} with optional internal whitespace */
export const TEMPLATE_VARIABLE_TOKEN_REGEX = /\{\{\s*([a-z][a-z0-9_]*)\s*\}\}/g;

export function formatVariableToken(key: string): string {
  return `{{${key}}}`;
}

function collectKeysFromText(text: string, keys: Set<string>): void {
  TEMPLATE_VARIABLE_TOKEN_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TEMPLATE_VARIABLE_TOKEN_REGEX.exec(text)) !== null) {
    keys.add(match[1]);
  }
}

function walkPlateNodes(nodes: unknown[], keys: Set<string>): void {
  for (const node of nodes) {
    if (!node || typeof node !== 'object') continue;
    const n = node as Record<string, unknown>;
    if (typeof n.text === 'string') {
      collectKeysFromText(n.text, keys);
    }
    if (Array.isArray(n.children)) {
      walkPlateNodes(n.children, keys);
    }
  }
}

export function extractVariableKeysFromText(text: string): string[] {
  const keys = new Set<string>();
  collectKeysFromText(text, keys);
  return [...keys].sort();
}

export function extractVariablesFromContent(contentJson: unknown, title?: string): string[] {
  const keys = new Set<string>();
  if (title) collectKeysFromText(title, keys);

  if (contentJson && typeof contentJson === 'object' && !Array.isArray(contentJson)) {
    const obj = contentJson as Record<string, unknown>;
    if (obj.format === 'plate' && Array.isArray(obj.value)) {
      walkPlateNodes(obj.value, keys);
    } else if (typeof obj.body === 'string') {
      collectKeysFromText(obj.body, keys);
    }
  }

  return [...keys].sort();
}
