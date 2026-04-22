/**
 * Each inserted block is wrapped with instance markers so it can be detected and removed:
 *   {/* forge-block-start:container-a1b2c *\/}
 *   <div>...</div>
 *   {/* forge-block-end:container-a1b2c *\/}
 *
 * The instance ID format is `blockId-randomSuffix`, allowing multiple instances
 * of the same block type to coexist independently.
 */

export function generateInstanceId(blockId: string): string {
  return `${blockId}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Injects data-forge-block-id into the first opening (non-self-closing) tag of a JSX snippet.
 * Used so the inspect bridge can identify which forge block a selected element belongs to.
 */
export function injectForgeBlockId(jsx: string, instanceId: string): string {
  let i = 0;
  while (i < jsx.length && jsx[i] !== '<') i++;
  if (i >= jsx.length || jsx[i + 1] === '/') return jsx;
  i++; // skip '<'
  let inQuote = false;
  let quoteChar = '';
  while (i < jsx.length) {
    const ch = jsx[i];
    if (inQuote) {
      if (ch === quoteChar) inQuote = false;
    } else if (ch === '"' || ch === "'") {
      inQuote = true;
      quoteChar = ch;
    } else if (ch === '>') {
      if (jsx[i - 1] === '/') return jsx; // self-closing, nothing to inject
      return jsx.slice(0, i) + ` data-forge-block-id="${instanceId}"` + jsx.slice(i);
    }
    i++;
  }
  return jsx;
}

export function insertBlockIntoApp(source: string, instanceId: string, blockJsx: string): string {
  const tagged = injectForgeBlockId(blockJsx, instanceId);
  const wrapped = `{/* forge-block-start:${instanceId} */}\n${tagged}\n{/* forge-block-end:${instanceId} */}`;

  const returnIdx = source.indexOf('return (');
  if (returnIdx === -1) return appendFallback(source, wrapped);

  let depth = 0;
  let i = returnIdx + 'return ('.length;
  let rootCloseStart = -1;

  while (i < source.length) {
    if (source[i] === '<') {
      if (source[i + 1] === '/') {
        if (depth === 1) rootCloseStart = i;
        depth--;
        const end = source.indexOf('>', i);
        if (end === -1) break;
        i = end + 1;
        if (depth === 0) break;
        continue;
      } else if (source[i + 1] === '!' || source[i + 1] === ' ') {
        i++;
        continue;
      } else {
        const tagEnd = source.indexOf('>', i);
        if (tagEnd === -1) break;
        const tagContent = source.slice(i, tagEnd + 1);
        if (!tagContent.endsWith('/>')) depth++;
        i = tagEnd + 1;
        continue;
      }
    }
    i++;
  }

  if (rootCloseStart !== -1) {
    const indent = getIndentAt(source, rootCloseStart);
    const indentedBlock = indentBlock(wrapped, indent);
    return source.slice(0, rootCloseStart) + indentedBlock + '\n' + source.slice(rootCloseStart);
  }

  return appendFallback(source, wrapped);
}

export function removeBlockInstance(source: string, instanceId: string): string {
  const startMarker = `{/* forge-block-start:${instanceId} */}`;
  const endMarker = `{/* forge-block-end:${instanceId} */}`;

  const startIdx = source.indexOf(startMarker);
  if (startIdx === -1) return source;

  const endIdx = source.indexOf(endMarker, startIdx);
  if (endIdx === -1) return source;

  const removeTo = endIdx + endMarker.length;
  const before = source.slice(0, startIdx).replace(/\n[ \t]*$/, '');
  const after = source.slice(removeTo).replace(/^[ \t]*\n/, '');

  return before + '\n' + after;
}

/** Returns all instance IDs present in the source, in document order. */
export function getBlockInstances(source: string): { blockId: string; instanceId: string }[] {
  const result: { blockId: string; instanceId: string }[] = [];
  const regex = /\{\/\* forge-block-start:([\w-]+) \*\/\}/g;
  let match;
  while ((match = regex.exec(source)) !== null) {
    const instanceId = match[1];
    // blockId is everything before the last dash-segment (the random suffix)
    const lastDash = instanceId.lastIndexOf('-');
    const blockId = lastDash !== -1 ? instanceId.slice(0, lastDash) : instanceId;
    result.push({ blockId, instanceId });
  }
  return result;
}

/** Count how many instances of a given blockId exist in the source. */
export function countBlockInstances(source: string, blockId: string): number {
  return getBlockInstances(source).filter((b) => b.blockId === blockId).length;
}

/**
 * Insert a child block inside the root JSX element of a specific parent block instance.
 * Falls back to root insertion if the parent marker is not found.
 */
export function insertBlockInsideParent(
  source: string,
  parentInstanceId: string,
  childInstanceId: string,
  childCode: string,
): string {
  const tagged = injectForgeBlockId(childCode, childInstanceId);
  const wrapped = `{/* forge-block-start:${childInstanceId} */}\n${tagged}\n{/* forge-block-end:${childInstanceId} */}`;

  const parentStartMarker = `{/* forge-block-start:${parentInstanceId} */}`;
  const markerIdx = source.indexOf(parentStartMarker);
  if (markerIdx === -1) return insertBlockIntoApp(source, childInstanceId, childCode);

  // Skip to first < after the marker (the parent's root JSX element)
  let i = markerIdx + parentStartMarker.length;
  while (i < source.length && source[i] !== '<') i++;
  if (i >= source.length) return insertBlockIntoApp(source, childInstanceId, childCode);

  // Depth-count to find the closing tag of the parent's root element
  let depth = 0;
  let rootCloseStart = -1;

  while (i < source.length) {
    if (source[i] === '<') {
      if (source[i + 1] === '/') {
        if (depth === 1) rootCloseStart = i;
        depth--;
        const end = source.indexOf('>', i);
        if (end === -1) break;
        i = end + 1;
        if (depth === 0) break;
        continue;
      } else if (source[i + 1] === '!' || source[i + 1] === ' ') {
        i++;
        continue;
      } else {
        const tagEnd = source.indexOf('>', i);
        if (tagEnd === -1) break;
        const tagContent = source.slice(i, tagEnd + 1);
        if (!tagContent.endsWith('/>')) depth++;
        i = tagEnd + 1;
        continue;
      }
    }
    i++;
  }

  if (rootCloseStart !== -1) {
    const outerIndent = getIndentAt(source, rootCloseStart);
    const childIndent = outerIndent + '  ';
    const indentedBlock = indentBlock(wrapped, childIndent);
    return source.slice(0, rootCloseStart) + indentedBlock + '\n' + source.slice(rootCloseStart);
  }

  return insertBlockIntoApp(source, childInstanceId, childCode);
}

/** Remove the last inserted instance of blockId (by document order). */
export function removeLastBlockInstance(source: string, blockId: string): string {
  const instances = getBlockInstances(source).filter((b) => b.blockId === blockId);
  if (instances.length === 0) return source;
  return removeBlockInstance(source, instances[instances.length - 1].instanceId);
}

function appendFallback(source: string, wrapped: string): string {
  const lastClose = source.lastIndexOf('</');
  if (lastClose === -1) return source + '\n' + wrapped;
  const indent = getIndentAt(source, lastClose);
  return source.slice(0, lastClose) + indentBlock(wrapped, indent) + '\n' + source.slice(lastClose);
}

function getIndentAt(source: string, pos: number): string {
  const lineStart = source.lastIndexOf('\n', pos - 1) + 1;
  const line = source.slice(lineStart, pos);
  const match = line.match(/^(\s*)/);
  return match ? match[1] : '';
}

function indentBlock(block: string, indent: string): string {
  return block
    .split('\n')
    .map((line) => (line.trim() === '' ? '' : indent + line))
    .join('\n');
}
