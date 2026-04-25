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

export function parseGlobalFont(css: string): string {
  if (!css) return '';
  const match = css.match(/font-family:\s*['"]?([^,'";\n}]+)/);
  if (!match) return '';
  return match[1].trim().replace(/['"]/g, '');
}
