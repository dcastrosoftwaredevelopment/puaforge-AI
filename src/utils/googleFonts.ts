export type GoogleFontCategory = 'sans-serif' | 'serif' | 'display';

export type GoogleFont = {
  family: string;
  weights: number[];
  category: GoogleFontCategory;
};

export const POPULAR_GOOGLE_FONTS: GoogleFont[] = [
  // Sans-serif
  { family: 'Inter', weights: [300, 400, 500, 600, 700], category: 'sans-serif' },
  { family: 'Roboto', weights: [300, 400, 500, 700], category: 'sans-serif' },
  { family: 'Open Sans', weights: [300, 400, 500, 600, 700], category: 'sans-serif' },
  { family: 'Poppins', weights: [300, 400, 500, 600, 700, 800], category: 'sans-serif' },
  { family: 'Lato', weights: [300, 400, 700], category: 'sans-serif' },
  { family: 'Montserrat', weights: [300, 400, 500, 600, 700, 800], category: 'sans-serif' },
  { family: 'Nunito', weights: [300, 400, 500, 600, 700, 800], category: 'sans-serif' },
  { family: 'DM Sans', weights: [300, 400, 500, 600, 700], category: 'sans-serif' },
  { family: 'Work Sans', weights: [300, 400, 500, 600, 700], category: 'sans-serif' },
  { family: 'Mulish', weights: [300, 400, 500, 600, 700, 800], category: 'sans-serif' },
  { family: 'Figtree', weights: [300, 400, 500, 600, 700, 800], category: 'sans-serif' },
  { family: 'Plus Jakarta Sans', weights: [300, 400, 500, 600, 700, 800], category: 'sans-serif' },
  { family: 'Outfit', weights: [300, 400, 500, 600, 700], category: 'sans-serif' },
  // Serif
  { family: 'Lora', weights: [400, 500, 600, 700], category: 'serif' },
  { family: 'Merriweather', weights: [300, 400, 700], category: 'serif' },
  { family: 'Playfair Display', weights: [400, 500, 600, 700, 800], category: 'serif' },
  // Display / slab
  { family: 'Oswald', weights: [300, 400, 500, 600, 700], category: 'display' },
  { family: 'Raleway', weights: [300, 400, 500, 600, 700], category: 'display' },
  { family: 'Ubuntu', weights: [300, 400, 500, 700], category: 'display' },
];

export function buildGoogleFontsUrl(families: string[]): string {
  if (families.length === 0) return '';
  const params = families
    .map((f) => `family=${encodeURIComponent(f)}:wght@300;400;500;600;700;800`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

export function buildAllCuratedFontsUrl(): string {
  return buildGoogleFontsUrl(POPULAR_GOOGLE_FONTS.map((f) => f.family));
}

export function buildGlobalCss(fontFamily: string): string {
  if (!fontFamily) return '';
  const url = buildGoogleFontsUrl([fontFamily]);
  return `@import url('${url}');\nbody, body * { font-family: '${fontFamily}', sans-serif; }`;
}

/** CSS class name for a specific font (e.g. "DM Sans" → "forge-font-dm-sans"). */
export function buildFontClassName(fontFamily: string): string {
  return 'forge-font-' + fontFamily.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

/**
 * Ensures the font @import and CSS class rule for `fontFamily` are present in the
 * global CSS string. Returns the updated CSS (unchanged if already present).
 */
export function ensureFontClassInGlobalCss(existingCss: string, fontFamily: string): string {
  if (!fontFamily) return existingCss;
  const cls = buildFontClassName(fontFamily);
  if (existingCss.includes(`.${cls}`)) return existingCss;
  const alreadyImported = existingCss.includes(encodeURIComponent(fontFamily));
  const importLine = alreadyImported ? '' : `@import url('${buildGoogleFontsUrl([fontFamily])}');\n`;
  const rule = `.${cls} { font-family: '${fontFamily}', sans-serif; }`;
  return `${importLine}${existingCss}\n${rule}`;
}

/**
 * Reads the font family name from the first `forge-font-*` class in a className string.
 * Matches against the curated list for correct casing; falls back to title-case.
 */
export function parseFontClassFromClassName(className: string): string {
  const match = className.match(/\bforge-font-([a-z0-9-]+)\b/);
  if (!match) return '';
  const slug = match[1];
  const known = POPULAR_GOOGLE_FONTS.find((f) => buildFontClassName(f.family) === `forge-font-${slug}`);
  if (known) return known.family;
  return slug.replace(/-([a-z])/g, (_, c: string) => ' ' + c.toUpperCase()).replace(/^./, (c) => c.toUpperCase());
}

export function parseGlobalFont(css: string): string {
  if (!css) return '';
  const match = css.match(/font-family:\s*['"]?([^,'";\n}]+)/);
  if (!match) return '';
  return match[1].trim().replace(/['"]/g, '');
}
