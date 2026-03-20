// Map of common sticker fonts to their closest Google Fonts equivalents
// This helps match detected fonts to renderable web fonts

export const FONT_MAP: Record<string, string> = {
  // Sans-serif heavy/impact
  'impact': 'Anton',
  'arial black': 'Archivo Black',
  'helvetica bold': 'Oswald',
  'futura bold': 'Montserrat',
  'gothic': 'Oswald',
  'block': 'Bebas Neue',
  'condensed': 'Oswald',
  'compressed': 'Bebas Neue',

  // Display/decorative
  'comic sans': 'Bangers',
  'brush': 'Permanent Marker',
  'handwritten': 'Shadows Into Light',
  'script': 'Pacifico',
  'cursive': 'Satisfy',
  'western': 'Special Elite',
  'retro': 'Righteous',
  'vintage': 'Playfair Display',
  'stencil': 'Black Ops One',
  'military': 'Black Ops One',

  // Serif
  'times': 'Playfair Display',
  'georgia': 'Playfair Display',
  'serif': 'Playfair Display',

  // Sans-serif regular
  'arial': 'Open Sans',
  'helvetica': 'Open Sans',
  'sans-serif': 'Poppins',
  'modern': 'Montserrat',
  'clean': 'Raleway',
  'rounded': 'Fredoka One',
};

// Curated list of fonts good for stickers
export const STICKER_FONTS = [
  'Anton',
  'Archivo Black',
  'Bebas Neue',
  'Oswald',
  'Montserrat',
  'Teko',
  'Russo One',
  'Black Ops One',
  'Bungee',
  'Bangers',
  'Fredoka One',
  'Luckiest Guy',
  'Permanent Marker',
  'Righteous',
  'Lobster',
  'Pacifico',
  'Satisfy',
  'Shadows Into Light',
  'Special Elite',
  'Playfair Display',
  'Poppins',
  'Open Sans',
  'Raleway',
];

// Google Fonts CSS URL for loading all sticker fonts
export const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Anton&family=Archivo+Black&family=Bebas+Neue&family=Oswald:wght@400;700&family=Montserrat:wght@400;700;900&family=Teko:wght@400;700&family=Russo+One&family=Black+Ops+One&family=Bungee&family=Bangers&family=Fredoka+One&family=Luckiest+Guy&family=Permanent+Marker&family=Righteous&family=Lobster&family=Pacifico&family=Satisfy&family=Shadows+Into+Light&family=Special+Elite&family=Playfair+Display:wght@400;700;900&family=Poppins:wght@400;600;700&family=Open+Sans:wght@400;700&family=Raleway:wght@400;700&display=swap';

/**
 * Find the best matching Google Font given a font description from Claude
 */
export function matchFont(description: string): string {
  const desc = description.toLowerCase().trim();

  // Direct match in our map
  for (const [key, value] of Object.entries(FONT_MAP)) {
    if (desc.includes(key)) return value;
  }

  // Check if it's already a known Google Font
  const knownFont = STICKER_FONTS.find(
    (f) => f.toLowerCase() === desc || desc.includes(f.toLowerCase())
  );
  if (knownFont) return knownFont;

  // Default fallback based on style keywords
  if (desc.includes('bold') || desc.includes('heavy') || desc.includes('thick')) return 'Anton';
  if (desc.includes('narrow') || desc.includes('tall')) return 'Bebas Neue';
  if (desc.includes('fun') || desc.includes('playful')) return 'Bangers';
  if (desc.includes('elegant') || desc.includes('fancy')) return 'Playfair Display';

  // Ultimate fallback
  return 'Anton';
}
