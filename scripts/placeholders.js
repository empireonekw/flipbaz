/**
 * Generates simple, original SVG placeholder images for seeded products and
 * categories, so the app has visuals without any third-party assets.
 * Each image is a soft gradient tile with a line-drawn product glyph.
 */

/** Line-drawn glyphs on a 400×400 canvas, centred at (200, 200). */
const GLYPHS = {
  jacket: `
    <path d="M150 90 L120 105 L80 160 L95 300 L130 300 L130 330 L270 330 L270 300 L305 300 L320 160 L280 105 L250 90 L225 120 L200 135 L175 120 Z"/>
    <path d="M200 135 L200 330"/><path d="M175 120 L185 190 M225 120 L215 190"/>
    <path d="M150 230 h28 M222 230 h28"/>`,
  wallet: `
    <rect x="95" y="130" width="210" height="150" rx="16"/>
    <path d="M95 175 H305"/><rect x="235" y="200" width="70" height="44" rx="10"/>
    <circle cx="258" cy="222" r="6"/>`,
  bag: `
    <path d="M90 160 H310 L295 310 H105 Z"/>
    <path d="M150 160 C150 100 250 100 250 160"/>
    <path d="M90 200 H310"/><rect x="180" y="192" width="40" height="26" rx="4"/>`,
  belt: `
    <rect x="60" y="175" width="280" height="50" rx="10"/>
    <rect x="100" y="160" width="60" height="80" rx="8"/>
    <path d="M130 175 V225"/>
    <circle cx="240" cy="200" r="5"/><circle cx="270" cy="200" r="5"/><circle cx="300" cy="200" r="5"/>`,
  tshirt: `
    <path d="M160 95 L110 115 L70 165 L110 195 L130 180 L130 315 H270 V180 L290 195 L330 165 L290 115 L240 95 C230 125 170 125 160 95 Z"/>
    <path d="M165 220 H235 M175 250 H225"/>`,
  shorts: `
    <path d="M120 120 H280 L300 290 H215 L200 195 L185 290 H100 Z"/>
    <path d="M120 145 H280"/><path d="M190 145 v20 M210 145 v20"/>`,
  hoodie: `
    <path d="M165 105 C165 70 235 70 235 105 L285 125 L320 170 L305 310 L270 310 V330 H130 V310 L95 310 L80 170 L115 125 Z"/>
    <path d="M165 105 C175 150 225 150 235 105"/>
    <path d="M150 250 H250 V300 H150 Z"/>`,
  glove: `
    <path d="M140 300 V185 C140 120 165 95 210 95 C260 95 280 125 280 175 V300 Z"/>
    <path d="M140 205 C110 200 100 175 110 155 C120 140 140 150 140 165"/>
    <rect x="135" y="300" width="150" height="40" rx="8"/>
    <path d="M160 320 H260"/>`,
  mitt: `
    <ellipse cx="200" cy="190" rx="105" ry="95"/>
    <ellipse cx="200" cy="190" rx="60" ry="52"/>
    <path d="M150 280 V320 H250 V280"/>`,
  headgear: `
    <path d="M110 230 C100 120 300 120 290 230 L280 300 H235 L230 250 H170 L165 300 H120 Z"/>
    <path d="M150 170 H250"/><ellipse cx="200" cy="215" rx="45" ry="30"/>`,
  wraps: `
    <circle cx="200" cy="200" r="95"/><circle cx="200" cy="200" r="38"/>
    <path d="M295 200 C320 230 330 280 300 320 L270 330"/>`,
  hand: `
    <path d="M150 320 V200 L135 150 C130 130 155 122 162 142 L172 185 V105 C172 85 198 85 198 105 V180 V92 C198 72 224 72 224 92 V180 V105 C224 85 250 85 250 105 V190 V135 C250 115 274 115 274 135 V240 C274 290 250 320 240 320 Z"/>
    <path d="M150 285 H245"/>`,
};

/**
 * Build an SVG image string.
 * @param {Object} opts
 * @param {keyof GLYPHS} opts.glyph       which drawing to use
 * @param {[string, string]} opts.colors  gradient start/end
 * @param {string} opts.label             caption at the bottom
 * @param {string} [opts.sublabel]
 * @returns {string}
 */
export function productSvg({ glyph, colors, label, sublabel = "Flip Baz sample" }) {
  const [c1, c2] = colors;
  const id = `g${Math.abs(hash(label + c1))}`;
  const safe = (s) => String(s).replace(/[<>&"]/g, "");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800" role="img" aria-label="${safe(label)}">
  <defs>
    <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="800" fill="url(#${id})"/>
  <circle cx="660" cy="130" r="190" fill="#ffffff" opacity="0.08"/>
  <circle cx="110" cy="700" r="160" fill="#000000" opacity="0.06"/>
  <g transform="translate(160 70) scale(1.2)" fill="none" stroke="#ffffff" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" opacity="0.95">
    ${GLYPHS[glyph] ?? GLYPHS.wallet}
  </g>
  <text x="400" y="640" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="40" font-weight="700" fill="#ffffff">${safe(label)}</text>
  <text x="400" y="690" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="24" fill="#ffffff" opacity="0.8">${safe(sublabel)}</text>
</svg>
`;
}

/** Tiny deterministic string hash for gradient ids. */
function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return h;
}
