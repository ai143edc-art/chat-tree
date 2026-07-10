import * as P from './parser';
import type { Message, DateOrder } from './parser';
import { themeOf, sizeOf, defaultBookConfig, SERIF_STACK, SANS_STACK } from './bookThemes';
import type { BookConfig } from './bookThemes';

// The WhatsApp doodle wallpaper (same art the chat viewer uses) so book pages
// look as lively as the chat when no custom wallpaper is set.
const DOODLE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260' viewBox='0 0 260 260'><g fill='none' stroke='%23dccfbe' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'><path d='M34 46 q-9 -11 -17 -2 q-6 7 0 13 q5 6 17 15 q12 -9 17 -15 q6 -6 0 -13 q-8 -9 -17 2 z'/><path d='M100 30 h34 q6 0 6 6 v12 q0 6 -6 6 h-20 l-8 8 v-8 h-6 q-6 0 -6 -6 v-12 q0 -6 6 -6 z'/><circle cx='190' cy='36' r='2.2'/><circle cx='199' cy='36' r='2.2'/><circle cx='208' cy='36' r='2.2'/><path d='M16 108 q8 -11 16 0 q8 11 16 0'/><path d='M116 100 l4 9 l10 1 l-7 7 l2 10 l-9 -5 l-9 5 l2 -10 l-7 -7 l10 -1 z'/><rect x='182' y='100' width='30' height='22' rx='4'/><circle cx='197' cy='111' r='6'/><path d='M190 100 l3 -5 h8 l3 5'/><path d='M35 190 v-22 l16 -3 v22'/><circle cx='31' cy='190' r='4.5'/><circle cx='47' cy='187' r='4.5'/><path d='M104 178 h20 v10 q0 9 -10 9 q-10 0 -10 -9 z'/><path d='M124 180 q7 0 7 6 q0 6 -7 6'/><path d='M208 176 v14 M201 183 h14'/><circle cx='58' cy='232' r='7'/><path d='M120 240 q8 -9 16 0 q8 9 16 0'/><path d='M232 226 q-6 -7 -11 -1 q-4 4 0 8 q3 4 11 9 q8 -5 11 -9 q4 -4 0 -8 q-5 -6 -11 1 z'/><path d='M236 122 l8 8 l-8 8 l-8 -8 z'/><circle cx='72' cy='150' r='5'/><path d='M72 140 v-5 M72 160 v5 M62 150 h-5 M82 150 h5'/><path d='M150 62 q10 -6 20 0'/><circle cx='240' cy='196' r='3'/><path d='M18 62 q6 -8 12 0'/><path d='M160 150 h16 M168 142 v16'/></g></svg>";
const doodleBg = (base: string) => `background-color:${base};background-image:url("${DOODLE}");background-size:220px 220px;`;

/** Append a decorative page frame (per style) to a page element. */
function appendBorder(page: HTMLElement, key: string, color: string): void {
  const add = (css: string) => { const d = document.createElement('div'); d.style.cssText = 'position:absolute;pointer-events:none;' + css; page.appendChild(d); };
  if (key === 'hairline') add(`inset:18px;border:1px solid ${color};`);
  else if (key === 'rounded') add(`inset:16px;border:1.5px solid ${color};border-radius:16px;`);
  else if (key === 'dotted') add(`inset:18px;border:2px dotted ${color};`);
  else if (key === 'double') { add(`inset:16px;border:1.6px solid ${color};`); add(`inset:22px;border:0.8px solid ${color};opacity:.6;`); }
  else if (key === 'corners' || key === 'ornate') {
    if (key === 'ornate') { add(`inset:16px;border:1.5px solid ${color};`); add(`inset:22px;border:0.8px solid ${color};opacity:.55;`); }
    const s = 30;
    const corner = (pos: string) => add(`width:${s}px;height:${s}px;border:2px solid ${color};${pos}`);
    corner('top:13px;left:13px;border-right:none;border-bottom:none;');
    corner('top:13px;right:13px;border-left:none;border-bottom:none;');
    corner('bottom:13px;left:13px;border-right:none;border-top:none;');
    corner('bottom:13px;right:13px;border-left:none;border-top:none;');
  }
}

export interface BookMeta {
  title: string;
  meName: string | null;
  senders: string[];
  dateOrder: DateOrder;
  messages: Message[];
  mediaMap: Record<string, string>;
  msgCount: number;
  avatar?: string | null;
  wallpaper?: string;   // CSS background from the viewer ('' = default doodle)
}

// Match the live chat viewer exactly so the book reads identical to the app.
const INK = '#111b21';          // --wa-txt
const SUBTLE = '#667781';       // --wa-sub
const WA_OUT = '#d9fdd3';       // outgoing bubble
const WA_IN = '#ffffff';        // incoming bubble
const WA_TEAL = '#128c7e';
const WA_TICK = '#53bdeb';      // blue read tick
const OUT_ACCENT = '#06cf9c';   // reply accent on outgoing side

function escHtml(s: string): string {
  return (s || '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c]);
}

/** "25 July 2026" -> "July 2026" (used to detect month chapters). */
function monthOf(dayLabel: string): string {
  const parts = dayLabel.trim().split(/\s+/);
  return parts.length >= 3 ? parts.slice(1).join(' ') : dayLabel;
}

/** A book-style chapter header shown when the month changes. */
function chapterEl(monthYear: string, accent: string, serif: boolean): HTMLElement {
  const w = document.createElement('div');
  w.style.cssText = 'display:flex;flex-direction:column;align-items:center;margin:28px 0 18px;';
  const nameStyle = serif
    ? `font-family:${SERIF_STACK};font-size:19px;font-style:italic;letter-spacing:.3px;`
    : 'font-size:11px;letter-spacing:3px;font-weight:700;text-transform:uppercase;';
  w.innerHTML =
    `<div style="display:flex;align-items:center;gap:13px;color:${accent};">`
    + `<span style="width:30px;height:1px;background:${accent};opacity:.6;"></span>`
    + `<span style="${nameStyle}">${escHtml(monthYear)}</span>`
    + `<span style="width:30px;height:1px;background:${accent};opacity:.6;"></span>`
    + `</div>`;
  return w;
}

function dayEl(text: string): HTMLElement {
  const w = document.createElement('div');
  w.style.cssText = 'display:flex;justify-content:center;margin:14px 0 10px;';
  const p = document.createElement('span');
  p.textContent = text;
  p.style.cssText = 'background:#fff;color:#54656f;font-size:12px;font-weight:600;padding:5px 13px;'
    + 'border-radius:9px;box-shadow:0 1px 2px rgba(0,0,0,.12);';
  w.appendChild(p);
  return w;
}

function sysEl(text: string): HTMLElement {
  const w = document.createElement('div');
  w.style.cssText = 'display:flex;justify-content:center;margin:8px 0;';
  const p = document.createElement('span');
  p.innerHTML = P.formatText(P.stripMarks(text).trim());
  p.style.cssText = 'background:#fdf3d7;color:#7a6a3f;font-size:12px;padding:6px 13px;border-radius:9px;'
    + 'text-align:center;max-width:82%;line-height:1.45;box-shadow:0 1px 1px rgba(0,0,0,.06);';
  w.appendChild(p);
  return w;
}

/** Little triangle "tail" on the first bubble of a run (as in the app). */
function tailEl(out: boolean): HTMLElement {
  const t = document.createElement('div');
  t.style.cssText = 'position:absolute;top:0;width:0;height:0;'
    + (out
      ? `right:-8px;border-top:8px solid ${WA_OUT};border-right:8px solid transparent;`
      : `left:-8px;border-top:8px solid ${WA_IN};border-left:8px solid transparent;`);
  return t;
}

/** Read-receipt ticks, matching the viewer: 0 none · 1 ✓ · 2 ✓✓ grey · 3 ✓✓ blue. */
function tickMarkup(tick: number | undefined, onMedia: boolean): string {
  const tk = tick ?? 3;
  if (tk === 0) return '';
  const icon = tk === 1 ? '✓' : '✓✓';
  const color = onMedia ? (tk === 3 ? '#eafff2' : '#e0e0e0') : (tk === 3 ? WA_TICK : SUBTLE);
  return `<span style="color:${color};font-size:13px;">${icon}</span>`;
}

/** Render one message exactly like the chat viewer's MessageList bubble:
 *  group avatars, sender name, reply quote, forwarded tag, media, reactions,
 *  emoji-only styling, call rows, time + read ticks. */
function msgEl(m: Message, out: boolean, isGroup: boolean, grouped: boolean, mediaMap: Record<string, string>): HTMLElement {
  const row = document.createElement('div');
  row.style.cssText = `display:flex;align-items:flex-end;gap:5px;justify-content:${out ? 'flex-end' : 'flex-start'};`
    + `margin:${grouped ? '2px' : '8px'} 0;`;

  // Group chats show a coloured avatar (or a spacer under a run) beside incoming bubbles.
  if (isGroup && !out) {
    const av = document.createElement('div');
    if (grouped) {
      av.style.cssText = 'width:27px;height:27px;flex:0 0 auto;';
    } else {
      av.style.cssText = 'width:27px;height:27px;border-radius:50%;flex:0 0 auto;display:flex;'
        + `align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:600;`
        + `background:${P.avatarColor(m.sender || '')};`;
      av.textContent = P.initial(m.sender || '');
    }
    row.appendChild(av);
  }

  const att = m.call ? null : P.findAttachment(m.text);
  const emojiOnly = !m.call && !att && !P.PLACEHOLDERS.test(m.text) && !!P.emojiInfo(m.text);

  const bub = document.createElement('div');
  if (emojiOnly) {
    bub.style.cssText = 'position:relative;max-width:78%;background:transparent;padding:2px 4px;'
      + `color:${INK};line-height:1.4;`;
  } else {
    bub.style.cssText = `position:relative;max-width:78%;background:${out ? WA_OUT : WA_IN};border-radius:9px;`
      + `padding:6px 9px 8px;box-shadow:0 1px .6px rgba(0,0,0,.13);font-size:14.2px;line-height:1.4;`
      + `color:${INK};word-break:break-word;overflow-wrap:anywhere;`
      + (out ? 'margin-right:8px;' : 'margin-left:8px;');
    // First bubble of a run: square the corner on the tail side so the tail
    // attaches cleanly (grouped bubbles stay fully rounded, no tail) — as in the app.
    if (!grouped) {
      if (out) bub.style.borderTopRightRadius = '0';
      else bub.style.borderTopLeftRadius = '0';
      bub.appendChild(tailEl(out));
    }
  }

  if (m.forwarded) {
    const f = document.createElement('div');
    f.textContent = '↪ Forwarded';
    f.style.cssText = `font-size:12.5px;color:${SUBTLE};font-style:italic;margin-bottom:2px;`;
    bub.appendChild(f);
  }

  if (m.reply) {
    const rq = document.createElement('div');
    rq.style.cssText = `background:rgba(0,0,0,.05);border-left:3px solid ${out ? OUT_ACCENT : WA_TEAL};`
      + 'border-radius:5px;padding:4px 8px;margin-bottom:4px;overflow:hidden;';
    const nm = document.createElement('div');
    nm.textContent = m.reply.sender || '';
    nm.style.cssText = `font-size:12.5px;font-weight:600;color:${out ? OUT_ACCENT : WA_TEAL};`
      + 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
    const tx = document.createElement('div');
    tx.textContent = m.reply.text || '📎 media';
    tx.style.cssText = `font-size:13px;color:${SUBTLE};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`;
    rq.appendChild(nm); rq.appendChild(tx); bub.appendChild(rq);
  }

  if (isGroup && !out && !grouped && m.sender) {
    const w = document.createElement('div');
    w.textContent = m.sender;
    w.style.cssText = `font-size:12.5px;font-weight:600;margin-bottom:2px;color:${P.avatarColor(m.sender)};`;
    bub.appendChild(w);
  }

  let mediaOnly = false;
  if (m.call) {
    const cr = document.createElement('div');
    cr.style.cssText = 'display:flex;align-items:center;gap:11px;min-width:150px;';
    const ic = document.createElement('div');
    ic.textContent = m.call.media === 'video' ? '📹' : '📞';
    ic.style.cssText = 'width:38px;height:38px;border-radius:50%;background:rgba(0,0,0,.08);display:flex;'
      + 'align-items:center;justify-content:center;font-size:18px;' + (m.call.missed ? 'color:#e5484d;' : '');
    const tw = document.createElement('div');
    tw.innerHTML = `<div style="font-size:14.5px;font-weight:600;color:${INK};">${escHtml(m.call.title)}</div>`
      + `<div style="font-size:12.5px;color:${SUBTLE};">${escHtml(m.call.sub)}</div>`;
    cr.appendChild(ic); cr.appendChild(tw); bub.appendChild(cr);
  } else if (att) {
    const fkey = att.split('/').pop()!.toLowerCase();
    const url = mediaMap[fkey];
    const ext = (fkey.match(/\.([a-z0-9]+)$/) || [])[1] || '';
    const cap = P.extractCaption(m.text, att);
    if (url && /^(jpe?g|png|gif|webp|bmp|heic)$/.test(ext)) {
      const im = document.createElement('img');
      im.crossOrigin = 'anonymous';
      im.src = url;
      im.style.cssText = 'max-width:100%;max-height:360px;border-radius:7px;display:block;object-fit:cover;';
      bub.appendChild(im);
      if (!cap) mediaOnly = true;
    } else {
      const ph = document.createElement('div');
      ph.textContent = P.mediaLabel(ext);
      ph.style.cssText = `color:${SUBTLE};font-style:italic;`;
      bub.appendChild(ph);
    }
    if (cap) {
      const cp = document.createElement('span');
      cp.style.cssText = 'display:block;margin-top:4px;';
      cp.innerHTML = P.formatText(cap);
      bub.appendChild(cp);
    }
  } else if (P.PLACEHOLDERS.test(m.text)) {
    const ph = document.createElement('div');
    ph.textContent = P.placeholderLabel(m.text);
    ph.style.cssText = `color:${SUBTLE};font-style:italic;`;
    bub.appendChild(ph);
  } else if (emojiOnly) {
    const tx = document.createElement('div');
    tx.textContent = P.stripMarks(m.text);
    tx.style.cssText = 'font-size:2.7em;line-height:1.15;';
    bub.appendChild(tx);
  } else {
    const tx = document.createElement('span');
    tx.style.display = 'inline';
    tx.innerHTML = P.formatText(m.text);
    bub.appendChild(tx);
  }

  if (m.reactions && m.reactions.length) {
    bub.style.marginBottom = '11px';
    const rc = document.createElement('span');
    rc.textContent = m.reactions.join(' ');
    rc.style.cssText = `position:absolute;bottom:-11px;right:8px;background:${WA_IN};border-radius:12px;`
      + 'padding:1px 6px;font-size:12px;box-shadow:0 1px 2px rgba(0,0,0,.18);white-space:nowrap;';
    bub.appendChild(rc);
  }

  const meta = document.createElement('div');
  if (mediaOnly) {
    meta.style.cssText = 'position:absolute;right:12px;bottom:9px;display:flex;align-items:center;gap:3px;'
      + 'font-size:11px;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.45);z-index:2;';
  } else {
    meta.style.cssText = `font-size:11px;color:${SUBTLE};float:right;margin:2px 0 -2px 8px;`
      + 'display:flex;align-items:center;gap:3px;';
  }
  meta.innerHTML = `<span>${escHtml(P.shortTime(m.time))}</span>${out ? tickMarkup(m.tick, mediaOnly) : ''}`;
  bub.appendChild(meta);

  row.appendChild(bub);
  return row;
}

/** Small stat chip for the cover, coloured by the chosen theme. */
function chip(value: string, label: string, bg: string, border: string): string {
  return `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;`
    + `background:${bg};border:1px solid ${border};`
    + `border-radius:12px;padding:11px 18px;min-width:74px;">`
    + `<span style="font-size:22px;font-weight:800;line-height:1;">${escHtml(value)}</span>`
    + `<span style="font-size:11px;letter-spacing:.6px;opacity:.85;text-transform:uppercase;">${escHtml(label)}</span>`
    + `</div>`;
}

/** Build a paginated, cover-fronted "keepsake book" PDF, styled by `config`. */
export async function exportBook(meta: BookMeta, config?: BookConfig): Promise<void> {
  const { meName, senders, dateOrder, messages, mediaMap, avatar } = meta;
  if (!messages.length) throw new Error('Open a chat first.');
  const cfg = config || defaultBookConfig(meta.title);
  const th = themeOf(cfg.themeKey);
  const title = cfg.title || meta.title;
  const headFont = cfg.serif ? SERIF_STACK : SANS_STACK;   // book chrome typography
  const isGroup = senders.length > 2;

  // Fixed internal render width keeps layout/fonts consistent; the page height
  // follows the chosen size's aspect, and the PDF is emitted at real mm dimensions.
  const sz = sizeOf(cfg.sizeKey);
  const PAGE_W = 794;                                   // px render width
  const PAGE_H = Math.round(PAGE_W * sz.h / sz.w);      // px height for this size's aspect

  // ---- derived stats for the cover ----
  const uniqDates = new Set(messages.filter((m) => m.date).map((m) => m.date));
  const days = uniqDates.size;
  let mediaCount = 0;
  for (const m of messages) if (!m.call && P.findAttachment(m.text)) mediaCount++;

  const book = document.createElement('div');
  book.style.cssText = `position:fixed;left:-10000px;top:0;width:${PAGE_W}px;background:${th.paper};`
    + "font-family:'Segoe UI',system-ui,-apple-system,'Noto Sans','Noto Sans Devanagari',sans-serif;color:" + INK + ';';

  // ---- Cover ----
  const firstDate = messages.find((m) => m.date)?.date;
  const lastDate = [...messages].reverse().find((m) => m.date)?.date;
  const range = firstDate && lastDate ? `${P.formatDay(firstDate, dateOrder)}  —  ${P.formatDay(lastDate, dateOrder)}` : '';
  const others = senders.filter((s) => s !== meName);
  const between = isGroup ? senders.slice(0, 5).join(', ')
    : (meName && others[0] ? `${others[0]}  &  ${meName}` : title);

  const medallion = (cfg.showAvatar && avatar)
    ? `<img src="${escHtml(avatar)}" crossorigin="anonymous" style="width:118px;height:118px;border-radius:50%;`
      + `object-fit:cover;border:3px solid ${th.frame};box-shadow:0 6px 22px rgba(0,0,0,.28);"/>`
    : `<div style="width:118px;height:118px;border-radius:50%;display:flex;align-items:center;justify-content:center;`
      + `font-size:56px;background:${th.chip};border:3px solid ${th.frame};box-shadow:0 6px 22px rgba(0,0,0,.22);">💬</div>`;

  const cover = document.createElement('div');
  cover.style.cssText = `position:relative;height:${PAGE_H}px;box-sizing:border-box;display:flex;flex-direction:column;`
    + `align-items:center;justify-content:center;text-align:center;padding:86px 64px;color:${th.ink};overflow:hidden;`
    + `background:${th.coverBg};`;
  const ornament = `<div style="display:flex;align-items:center;justify-content:center;gap:10px;margin:16px 0;color:${th.inkSoft};">`
    + `<span style="width:44px;height:1px;background:currentColor;opacity:.7;"></span>`
    + `<span style="font-size:11px;">◆</span>`
    + `<span style="width:44px;height:1px;background:currentColor;opacity:.7;"></span></div>`;
  cover.innerHTML =
    `<div style="position:absolute;inset:30px;border:1.5px solid ${th.frame};border-radius:16px;pointer-events:none;"></div>`
    + `<div style="position:absolute;top:56px;left:0;right:0;text-align:center;font-size:12px;letter-spacing:5px;`
    + `font-weight:700;color:${th.inkSoft};">C H A T · T R E E</div>`
    + medallion
    + `<div style="font-family:${headFont};font-size:46px;font-weight:${cfg.serif ? 700 : 800};line-height:1.15;margin:26px 0 4px;max-width:560px;">${escHtml(title)}</div>`
    + ornament
    + `<div style="font-size:21px;font-weight:600;">${escHtml(between)}</div>`
    + (range ? `<div style="font-size:12.5px;color:${th.inkSoft};margin-top:10px;letter-spacing:2px;text-transform:uppercase;">${escHtml(range)}</div>` : '')
    + (cfg.showStats
      ? `<div style="display:flex;gap:14px;margin-top:32px;">`
        + chip(meta.msgCount.toLocaleString(), 'Messages', th.chip, th.chipBorder)
        + chip(days.toLocaleString(), days === 1 ? 'Day' : 'Days', th.chip, th.chipBorder)
        + (mediaCount ? chip(mediaCount.toLocaleString(), 'Media', th.chip, th.chipBorder) : '')
        + `</div>`
      : '')
    + '<div style="position:absolute;bottom:52px;left:0;right:0;text-align:center;">'
    + (cfg.subtitle ? `<div style="font-family:${headFont};font-size:16px;color:${th.ink};opacity:.9;font-style:italic;">${escHtml(cfg.subtitle)}</div>` : '')
    + `<div style="font-size:12px;color:${th.inkSoft};margin-top:6px;letter-spacing:.5px;">Made with 💚 Chat Tree</div>`
    + '</div>';
  if (cfg.showCover) book.appendChild(cover);

  // ---- Inner title page (paper, editorial) ----
  const titlePage = document.createElement('div');
  titlePage.style.cssText = `position:relative;height:${PAGE_H}px;box-sizing:border-box;display:flex;flex-direction:column;`
    + `align-items:center;justify-content:center;text-align:center;padding:120px 90px;background:${th.paper};color:${INK};`;
  titlePage.innerHTML =
    `<div style="font-size:24px;color:${th.accent};margin-bottom:26px;">❦</div>`
    + `<div style="font-family:${headFont};font-size:40px;font-weight:${cfg.serif ? 700 : 800};line-height:1.2;">${escHtml(title)}</div>`
    + `<div style="width:60px;height:1px;background:${th.accent};opacity:.5;margin:22px 0;"></div>`
    + `<div style="font-size:17px;color:#3a4a52;">${escHtml(between)}</div>`
    + (range ? `<div style="font-size:12px;color:${SUBTLE};margin-top:12px;letter-spacing:2px;text-transform:uppercase;">${escHtml(range)}</div>` : '')
    + (cfg.dedication
      ? `<div style="font-family:${headFont};font-style:italic;font-size:17px;color:#4a5a62;margin-top:64px;max-width:70%;line-height:1.6;">${escHtml(cfg.dedication)}</div>`
      : '')
    + `<div style="position:absolute;bottom:70px;left:0;right:0;font-size:11px;color:${SUBTLE};letter-spacing:1px;">Made with 💚 Chat Tree</div>`;

  // ---- Content ----
  const phone = cfg.phoneFrame;
  const twoCol = cfg.twoColumns && !phone;             // two chat columns per page
  const PHONE_W = 384, FRAME_PAD = 11, HEADER_H = 52;   // phone-frame geometry
  const COL_GAP = 28;
  const colW = Math.floor((PAGE_W - 88 - COL_GAP) / 2); // column width inside 44px page padding
  const measureW = phone ? PHONE_W : (twoCol ? colW : PAGE_W - 88);
  const content = document.createElement('div');
  content.style.cssText = `width:${measureW}px;box-sizing:border-box;padding:${phone ? '6px 8px 10px' : '2px 0'};`;
  let lastD: string | null = null, prevSender: string | null = null, lastMonth: string | null = null;
  for (const m of messages) {
    if (m.date !== lastD) {
      const dl = P.formatDay(m.date, dateOrder);
      const mo = monthOf(dl);
      if (cfg.showChapters && mo !== lastMonth) { content.appendChild(chapterEl(mo, th.accent, cfg.serif)); lastMonth = mo; }
      content.appendChild(dayEl(dl)); lastD = m.date; prevSender = null;
    }
    if (m.system || !m.sender) { content.appendChild(sysEl(m.text)); prevSender = null; continue; }
    const out = m.sender === meName;
    content.appendChild(msgEl(m, out, isGroup, prevSender === m.sender, mediaMap));
    prevSender = m.sender;
  }
  book.appendChild(content);
  document.body.appendChild(book);

  try {
    // Wait for media images so they're captured; cap the wait so a broken URL never hangs.
    const imgs = Array.from(book.querySelectorAll('img'));
    await Promise.all(imgs.map((img) => img.complete && img.naturalWidth
      ? Promise.resolve()
      : new Promise<void>((res) => {
          const done = () => res();
          img.addEventListener('load', done, { once: true });
          img.addEventListener('error', done, { once: true });
          setTimeout(done, 8000);
        })));

    // Split messages into pages at message boundaries (never mid-message).
    const cTop = content.getBoundingClientRect().top;
    const PAGE_PAD_TOP = 44;
    const PAGE_PAD_BOTTOM = cfg.showPageNumbers ? 60 : 40;
    // phone-frame geometry (used both to paginate and to build each phone)
    const phTopV = 26;
    const phFooter = cfg.showPageNumbers ? 46 : 26;
    const phOuterH = PAGE_H - phTopV - phFooter;
    const phScreenH = phOuterH - 2 * FRAME_PAD;
    const phBodyH = phScreenH - HEADER_H;
    const contentPageH = phone
      ? phBodyH - 20
      : PAGE_H - PAGE_PAD_TOP - PAGE_PAD_BOTTOM - 8;
    const rows = Array.from(content.children) as HTMLElement[];
    const pageGroups: HTMLElement[][] = [];
    let cur: HTMLElement[] = [];
    let pageTop = rows.length ? rows[0].getBoundingClientRect().top - cTop : 0;
    for (const r of rows) {
      const bottom = r.getBoundingClientRect().bottom - cTop;
      if (cur.length && bottom - pageTop > contentPageH) {
        pageGroups.push(cur); cur = []; pageTop = r.getBoundingClientRect().top - cTop;
      }
      cur.push(r);
    }
    if (cur.length) pageGroups.push(cur);

    // Columns → pages: two chat columns per page in two-column mode (fewer pages).
    const pages: HTMLElement[][][] = twoCol
      ? pageGroups.reduce<HTMLElement[][][]>((acc, g, idx) => {
          if (idx % 2 === 0) acc.push([g]); else acc[acc.length - 1].push(g);
          return acc;
        }, [])
      : pageGroups.map((g) => [g]);

    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ unit: 'mm', format: [sz.w, sz.h], orientation: sz.w > sz.h ? 'landscape' : 'portrait' });
    let pageAdded = false;

    const addPage = async (el: HTMLElement) => {
      const c = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: th.paper, logging: false });
      if (pageAdded) pdf.addPage([sz.w, sz.h], sz.w > sz.h ? 'landscape' : 'portrait');
      pageAdded = true;
      const imgH = sz.w * (c.height / c.width);
      pdf.addImage(c.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, sz.w, Math.min(imgH, sz.h));
    };

    if (cfg.showCover) await addPage(cover);
    if (cfg.showTitlePage) { book.appendChild(titlePage); await addPage(titlePage); titlePage.remove(); }
    content.remove();                                    // measured already; free it

    const total = pages.length;
    // page background: chat wallpaper (custom, or the WhatsApp doodle) or clean theme paper
    const pageBg = cfg.showWallpaper
      ? (meta.wallpaper ? `background:${meta.wallpaper};` : doodleBg('#efeae2'))
      : `background:${th.paper};`;
    for (let i = 0; i < total; i++) {
      const cols = pages[i];   // 1 or 2 columns of rows
      const page = document.createElement('div');
      if (phone) {
        // Clean page so the phone mockup stands out; chat sits inside the phone.
        page.style.cssText = `position:relative;width:${PAGE_W}px;height:${PAGE_H}px;box-sizing:border-box;overflow:hidden;background:${th.paper};`;
        const bodyBg = meta.wallpaper ? `background:${meta.wallpaper};` : doodleBg('#efeae2');
        const frame = document.createElement('div');
        frame.style.cssText = `position:absolute;left:50%;top:${phTopV}px;transform:translateX(-50%);`
          + `width:${PHONE_W + 2 * FRAME_PAD}px;height:${phOuterH}px;background:#0b1013;`
          + `border-radius:44px;padding:${FRAME_PAD}px;box-sizing:border-box;box-shadow:0 16px 36px rgba(0,0,0,.28);`;
        const screen = document.createElement('div');
        screen.style.cssText = `position:relative;width:${PHONE_W}px;height:${phScreenH}px;border-radius:34px;overflow:hidden;`
          + 'display:flex;flex-direction:column;background:#efeae2;';
        const notch = document.createElement('div');
        notch.style.cssText = 'position:absolute;top:7px;left:50%;transform:translateX(-50%);width:98px;height:15px;background:#0b1013;border-radius:11px;z-index:5;';
        const header = document.createElement('div');
        header.style.cssText = `height:${HEADER_H}px;flex:0 0 auto;display:flex;align-items:center;gap:9px;padding:0 12px;box-sizing:border-box;background:#075e54;color:#fff;`;
        const ava = (cfg.showAvatar && avatar)
          ? `<img src="${escHtml(avatar)}" crossorigin="anonymous" style="width:34px;height:34px;border-radius:50%;object-fit:cover;"/>`
          : `<span style="width:34px;height:34px;border-radius:50%;background:#ffffff33;display:inline-flex;align-items:center;justify-content:center;font-size:15px;font-weight:600;">${escHtml(P.initial(title))}</span>`;
        header.innerHTML = `<span style="font-size:22px;line-height:1;">‹</span>${ava}`
          + `<div style="flex:1;min-width:0;"><div style="font-size:15px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(title)}</div>`
          + '<div style="font-size:11px;opacity:.85;">online</div></div>'
          + '<span style="font-size:15px;opacity:.9;">📹</span><span style="font-size:15px;opacity:.9;">📞</span><span style="font-size:17px;opacity:.9;">⋮</span>';
        const body = document.createElement('div');
        body.style.cssText = 'flex:1;overflow:hidden;padding:9px 8px 10px;box-sizing:border-box;' + bodyBg;
        for (const el of cols[0]) body.appendChild(el);
        screen.appendChild(notch); screen.appendChild(header); screen.appendChild(body);
        frame.appendChild(screen);
        page.appendChild(frame);
      } else {
        page.style.cssText = `position:relative;width:${PAGE_W}px;height:${PAGE_H}px;box-sizing:border-box;`
          + `padding:${PAGE_PAD_TOP}px 44px ${PAGE_PAD_BOTTOM}px;overflow:hidden;` + pageBg;
        appendBorder(page, cfg.borderKey, th.accent);
        const colWrap = document.createElement('div');
        colWrap.style.cssText = `display:flex;gap:${COL_GAP}px;height:100%;align-items:flex-start;position:relative;`;
        if (twoCol && cols.length === 2) {
          const div = document.createElement('div');
          div.style.cssText = `position:absolute;left:50%;top:0;bottom:0;width:1px;transform:translateX(-50%);background:${th.accent};opacity:.22;`;
          colWrap.appendChild(div);
        }
        cols.forEach((colRows) => {
          const col = document.createElement('div');
          col.style.cssText = twoCol ? `width:${colW}px;flex:0 0 auto;` : 'flex:1;min-width:0;';
          for (const el of colRows) col.appendChild(el);
          colWrap.appendChild(col);
        });
        page.appendChild(colWrap);
      }
      if (cfg.showPageNumbers) {
        const footer = document.createElement('div');
        footer.style.cssText = 'position:absolute;left:44px;right:44px;bottom:24px;display:flex;'
          + `justify-content:space-between;align-items:center;font-size:10.5px;color:${SUBTLE};`;
        footer.innerHTML =
          `<span style="max-width:60%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(title)}</span>`
          + `<span>💬 Chat Tree &nbsp;·&nbsp; ${i + 1} / ${total}</span>`;
        page.appendChild(footer);
        if (!phone) {
          const rule = document.createElement('div');
          rule.style.cssText = 'position:absolute;left:44px;right:44px;bottom:44px;height:1px;background:rgba(11,20,26,.08);';
          page.appendChild(rule);
        }
      }
      book.appendChild(page);
      await addPage(page);
      page.remove();
    }

    // ---- Closing page ----
    if (cfg.showClosing) {
      const end = document.createElement('div');
      end.style.cssText = `position:relative;height:${PAGE_H}px;box-sizing:border-box;display:flex;flex-direction:column;`
        + `align-items:center;justify-content:center;text-align:center;padding:80px 64px;color:${th.ink};overflow:hidden;`
        + `background:${th.coverBg};`;
      end.innerHTML =
        `<div style="position:absolute;inset:30px;border:1.5px solid ${th.frame};border-radius:16px;"></div>`
        + '<div style="font-size:52px;margin-bottom:14px;">💚</div>'
        + `<div style="font-family:${headFont};font-size:32px;font-weight:${cfg.serif ? 700 : 800};">The end… for now</div>`
        + `<div style="font-size:16px;color:${th.ink};opacity:.9;margin-top:14px;max-width:460px;line-height:1.5;">`
        + `${escHtml(meta.msgCount.toLocaleString())} messages across ${escHtml(days.toLocaleString())} ${days === 1 ? 'day' : 'days'}, `
        + `kept as a keepsake.</div>`
        + `<div style="position:absolute;bottom:52px;left:0;right:0;text-align:center;font-size:12px;color:${th.inkSoft};letter-spacing:.5px;">Made with 💚 Chat Tree</div>`;
      book.appendChild(end);
      await addPage(end);
      end.remove();
    }

    const safe = (title || 'chat').replace(/[^a-z0-9._-]+/gi, '_');
    pdf.save(`${safe}-book.pdf`);
  } finally {
    document.body.removeChild(book);
  }
}
