/**
 * Book Studio configuration: themes, page borders, and the saved-template store.
 * Everything the export needs to render a personalised keepsake book.
 */

export interface BookTheme {
  key: string;
  name: string;
  coverBg: string;    // CSS background for cover / closing pages
  ink: string;        // text colour on the cover
  inkSoft: string;    // muted text on the cover
  accent: string;     // chapter dividers + footer accent on content pages
  paper: string;      // content-page background
  frame: string;      // decorative inner-frame line on cover
  chip: string;       // cover stat-chip background
  chipBorder: string; // cover stat-chip border
}

export const BOOK_THEMES: BookTheme[] = [
  { key: 'whatsapp', name: 'WhatsApp Green',
    coverBg: 'radial-gradient(120% 80% at 50% 0%,#128c7e 0%,#0b6b5f 45%,#053d36 100%)',
    ink: '#ffffff', inkSoft: 'rgba(255,255,255,.85)', accent: '#0b6b5f', paper: '#efeae2',
    frame: 'rgba(255,255,255,.28)', chip: 'rgba(255,255,255,.12)', chipBorder: 'rgba(255,255,255,.25)' },
  { key: 'rose', name: 'Rose (Love)',
    coverBg: 'radial-gradient(120% 80% at 50% 0%,#ff6f91 0%,#c9184a 48%,#7a1030 100%)',
    ink: '#ffffff', inkSoft: 'rgba(255,255,255,.85)', accent: '#c9184a', paper: '#fbeef0',
    frame: 'rgba(255,255,255,.32)', chip: 'rgba(255,255,255,.14)', chipBorder: 'rgba(255,255,255,.3)' },
  { key: 'midnight', name: 'Midnight',
    coverBg: 'radial-gradient(120% 80% at 50% 0%,#3b4a80 0%,#1f2a52 45%,#0a0f24 100%)',
    ink: '#ffffff', inkSoft: 'rgba(255,255,255,.8)', accent: '#5566a8', paper: '#eef0f6',
    frame: 'rgba(255,255,255,.24)', chip: 'rgba(255,255,255,.1)', chipBorder: 'rgba(255,255,255,.22)' },
  { key: 'sunset', name: 'Sunset',
    coverBg: 'radial-gradient(120% 80% at 50% 0%,#ff9a5a 0%,#e0592f 48%,#8f2d1c 100%)',
    ink: '#ffffff', inkSoft: 'rgba(255,255,255,.85)', accent: '#c14a24', paper: '#fbf0e8',
    frame: 'rgba(255,255,255,.3)', chip: 'rgba(255,255,255,.14)', chipBorder: 'rgba(255,255,255,.28)' },
  { key: 'ocean', name: 'Ocean',
    coverBg: 'radial-gradient(120% 80% at 50% 0%,#2aa8c4 0%,#1462a0 48%,#082a52 100%)',
    ink: '#ffffff', inkSoft: 'rgba(255,255,255,.85)', accent: '#1462a0', paper: '#e9f1f6',
    frame: 'rgba(255,255,255,.28)', chip: 'rgba(255,255,255,.12)', chipBorder: 'rgba(255,255,255,.26)' },
  { key: 'cream', name: 'Minimal Cream',
    coverBg: 'linear-gradient(160deg,#f7f0e2 0%,#efe4cd 100%)',
    ink: '#4a3b28', inkSoft: 'rgba(74,59,40,.72)', accent: '#a8842c', paper: '#faf5ea',
    frame: 'rgba(74,59,40,.28)', chip: 'rgba(74,59,40,.06)', chipBorder: 'rgba(74,59,40,.18)' },
];

export interface BookSize { key: string; name: string; w: number; h: number }  // mm, portrait
export const BOOK_SIZES: BookSize[] = [
  { key: 'a4', name: 'A4', w: 210, h: 297 },
  { key: 'a5', name: 'A5 (book)', w: 148, h: 210 },
  { key: 'letter', name: 'Letter', w: 216, h: 279 },
  { key: 'sixnine', name: '6×9 in', w: 152, h: 229 },
  { key: 'square', name: 'Square', w: 210, h: 210 },
  { key: 'photo57', name: 'Photo 5×7', w: 127, h: 178 },
  { key: 'a6', name: 'A6 pocket', w: 105, h: 148 },
];
export function sizeOf(key: string): BookSize {
  return BOOK_SIZES.find((s) => s.key === key) || BOOK_SIZES[0];
}

export interface BookBorder { key: string; name: string }
export const BOOK_BORDERS: BookBorder[] = [
  { key: 'none', name: 'None' },
  { key: 'hairline', name: 'Hairline' },
  { key: 'double', name: 'Double rule' },
  { key: 'ornate', name: 'Ornate' },
  { key: 'rounded', name: 'Rounded' },
  { key: 'corners', name: 'Corner marks' },
  { key: 'dotted', name: 'Dotted' },
];

export interface BookConfig {
  title: string;
  subtitle: string;
  dedication: string;
  themeKey: string;
  borderKey: string;
  sizeKey: string;        // page size (A4, A5, Square, …)
  serif: boolean;         // elegant serif typography on the book chrome
  showWallpaper: boolean; // put the chat wallpaper behind the pages
  phoneFrame: boolean;    // render the chat inside a phone mockup
  twoColumns: boolean;    // two chat columns per page (fewer pages)
  showCover: boolean;
  showTitlePage: boolean; // inner title page after the cover
  showAvatar: boolean;
  showStats: boolean;
  showChapters: boolean;
  showPageNumbers: boolean;
  showClosing: boolean;
}

/** Serif = premium/print feel; sans = modern. Chat bubbles always stay sans. */
export const SERIF_STACK = "Georgia,'Times New Roman','Noto Serif',serif";
export const SANS_STACK = "'Segoe UI',system-ui,-apple-system,'Noto Sans','Noto Sans Devanagari',sans-serif";

export function defaultBookConfig(title: string): BookConfig {
  return {
    title, subtitle: 'A conversation keepsake', dedication: '',
    themeKey: 'whatsapp', borderKey: 'hairline', sizeKey: 'a4', serif: true, showWallpaper: true,
    phoneFrame: false, twoColumns: false,
    showCover: true, showTitlePage: true, showAvatar: true, showStats: true,
    showChapters: true, showPageNumbers: true, showClosing: true,
  };
}

export function themeOf(key: string): BookTheme {
  return BOOK_THEMES.find((t) => t.key === key) || BOOK_THEMES[0];
}

/** Inline CSS for a page frame element (absolute, inset), per border style + colour. */
export function borderCss(key: string, color: string): string {
  const base = 'position:absolute;inset:16px;pointer-events:none;';
  switch (key) {
    case 'hairline': return base + `border:1px solid ${color};`;
    case 'double':   return base + `border:3px double ${color};`;
    case 'rounded':  return base + `border:1.5px solid ${color};border-radius:14px;`;
    case 'dotted':   return base + `border:2px dotted ${color};`;
    case 'corners':  return '';   // rendered as four corner pieces instead
    default:         return '';   // none
  }
}

/* ---------------- Saved templates (localStorage) ---------------- */
const TPL_KEY = 'chattree_book_templates';
export interface BookTemplate { name: string; config: BookConfig }

export function loadTemplates(): BookTemplate[] {
  try {
    const raw = localStorage.getItem(TPL_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
export function saveTemplate(name: string, config: BookConfig): BookTemplate[] {
  const list = loadTemplates().filter((t) => t.name !== name);
  list.unshift({ name, config: { ...config } });
  const capped = list.slice(0, 20);
  try { localStorage.setItem(TPL_KEY, JSON.stringify(capped)); } catch { /* ignore quota */ }
  return capped;
}
export function deleteTemplate(name: string): BookTemplate[] {
  const list = loadTemplates().filter((t) => t.name !== name);
  try { localStorage.setItem(TPL_KEY, JSON.stringify(list)); } catch { /* ignore */ }
  return list;
}
