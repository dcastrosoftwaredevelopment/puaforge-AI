export interface TextSegment {
  type: 'text';
  content: string;
}
export interface CodeSegment {
  type: 'code';
  language: string;
  filePath?: string;
  code: string;
}
export type Segment = TextSegment | CodeSegment;

const CODE_BLOCK_RE = /```(\w+)?(?:\s+file="([^"]+)")?\n([\s\S]*?)```/g;

export function parseSegments(content: string): Segment[] {
  const segments: Segment[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  CODE_BLOCK_RE.lastIndex = 0;
  while ((match = CODE_BLOCK_RE.exec(content)) !== null) {
    if (match.index > last) {
      const text = content.slice(last, match.index).trim();
      if (text) segments.push({ type: 'text', content: text });
    }
    segments.push({
      type: 'code',
      language: match[1] || 'text',
      filePath: match[2],
      code: match[3].replace(/\n$/, ''),
    });
    last = match.index + match[0].length;
  }

  const remaining = content.slice(last).trim();
  if (remaining) segments.push({ type: 'text', content: remaining });

  return segments;
}
