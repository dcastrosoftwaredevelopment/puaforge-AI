import styleToObject from 'style-to-object';

/** Parse a CSS inline style string into a kebab-case keyed object. */
export function parseInlineStyle(style: string): Record<string, string> {
  const result: Record<string, string> = {};
  try {
    styleToObject(style, (prop, value) => { result[prop] = value; });
  } catch {
    // ignore malformed style strings
  }
  return result;
}

/** Serialize a kebab-case object back to an inline CSS string. */
export function toInlineCss(obj: Record<string, string>): string {
  return Object.entries(obj)
    .filter(([, v]) => v !== '')
    .map(([k, v]) => `${k}: ${v}`)
    .join('; ');
}

/** Convert a CSS inline string to a JSX-compatible object literal string. */
export function toJSXStyleObject(cssString: string): string {
  const obj = parseInlineStyle(cssString);
  const pairs = Object.entries(obj).map(([k, v]) => {
    const camel = k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    return `${camel}: '${v.replace(/'/g, "\\'")}'`;
  });
  return `{ ${pairs.join(', ')} }`;
}
