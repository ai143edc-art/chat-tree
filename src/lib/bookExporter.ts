import * as P from './parser';
import type { Message, DateOrder } from './parser';

export interface BookMeta {
  title: string;
  meName: string | null;
  senders: string[];
  dateOrder: DateOrder;
  messages: Message[];
  mediaMap: Record<string, string>;
  msgCount: number;
  avatar?: string | null;
}

// Match the live chat viewer exactly so the book reads identical to the app.
const PAPER = '#efeae2';        // WhatsApp chat background
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

/** A large book-style chapter header shown when the month changes. */
function chapterEl(monthYear: string): HTMLElement {
  const w = document.createElement('div');
  w.style.cssText = 'display:flex;flex-direction:column;align-items:center;margin:26px 0 18px;';
  w.innerHTML =
    `<div style="display:flex;align-items:center;gap:12px;color:#0b6b5f;">`
    + `<span style="width:34px;height:1.5px;background:linear-gradient(90deg,transparent,#0b6b5f);"></span>`
    + `<span style="font-size:11px;letter-spacing:3px;font-weight:700;text-transform:uppercase;">${escHtml(monthYear)}</span>`
    + `<span style="width:34px;height:1.5px;background:linear-gradient(90deg,#0b6b5f,transparent);"></span>`
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

/** Small translucent stat chip for the cover. */
function chip(value: string, label: string): string {
  return `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;`
    + `background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.25);`
    + `border-radius:12px;padding:11px 18px;min-width:74px;">`
    + `<span style="font-size:22px;font-weight:800;line-height:1;">${escHtml(value)}</span>`
    + `<span style="font-size:11px;letter-spacing:.6px;opacity:.85;text-transform:uppercase;">${escHtml(label)}</span>`
    + `</div>`;
}

/** Build a paginated, cover-fronted "keepsake book" PDF of the whole chat. */
export async function exportBook(meta: BookMeta): Promise<void> {
  const { title, meName, senders, dateOrder, messages, mediaMap, avatar } = meta;
  if (!messages.length) throw new Error('Open a chat first.');
  const isGroup = senders.length > 2;

  const PAGE_W = 794;                                   // px ≈ A4 width
  const PAGE_H = Math.round(PAGE_W * 297 / 210);        // px ≈ A4 height (~1123)

  // ---- derived stats for the cover ----
  const uniqDates = new Set(messages.filter((m) => m.date).map((m) => m.date));
  const days = uniqDates.size;
  let mediaCount = 0;
  for (const m of messages) if (!m.call && P.findAttachment(m.text)) mediaCount++;

  const book = document.createElement('div');
  book.style.cssText = `position:fixed;left:-10000px;top:0;width:${PAGE_W}px;background:${PAPER};`
    + "font-family:'Segoe UI',system-ui,-apple-system,'Noto Sans','Noto Sans Devanagari',sans-serif;color:" + INK + ';';

  // ---- Cover (exactly one page) ----
  const firstDate = messages.find((m) => m.date)?.date;
  const lastDate = [...messages].reverse().find((m) => m.date)?.date;
  const range = firstDate && lastDate ? `${P.formatDay(firstDate, dateOrder)}  —  ${P.formatDay(lastDate, dateOrder)}` : '';
  const others = senders.filter((s) => s !== meName);
  const between = isGroup ? senders.slice(0, 5).join(', ')
    : (meName && others[0] ? `${others[0]}  &  ${meName}` : title);

  const medallion = avatar
    ? `<img src="${escHtml(avatar)}" crossorigin="anonymous" style="width:118px;height:118px;border-radius:50%;`
      + `object-fit:cover;border:3px solid rgba(255,255,255,.7);box-shadow:0 6px 22px rgba(0,0,0,.28);"/>`
    : `<div style="width:118px;height:118px;border-radius:50%;display:flex;align-items:center;justify-content:center;`
      + `font-size:56px;background:rgba(255,255,255,.14);border:3px solid rgba(255,255,255,.6);`
      + `box-shadow:0 6px 22px rgba(0,0,0,.28);">💬</div>`;

  const cover = document.createElement('div');
  cover.style.cssText = `position:relative;height:${PAGE_H}px;box-sizing:border-box;display:flex;flex-direction:column;`
    + 'align-items:center;justify-content:center;text-align:center;padding:86px 64px;color:#fff;overflow:hidden;'
    + 'background:radial-gradient(120% 80% at 50% 0%,#128c7e 0%,#0b6b5f 45%,#053d36 100%);';
  cover.innerHTML =
    // decorative inner frame
    '<div style="position:absolute;inset:30px;border:1.5px solid rgba(255,255,255,.28);border-radius:16px;pointer-events:none;"></div>'
    // top wordmark
    + '<div style="position:absolute;top:56px;left:0;right:0;text-align:center;font-size:12px;letter-spacing:5px;'
    + 'font-weight:700;opacity:.8;">C H A T · T R E E</div>'
    + medallion
    + `<div style="font-size:44px;font-weight:800;line-height:1.15;margin:26px 0 6px;max-width:560px;">${escHtml(title)}</div>`
    + `<div style="width:56px;height:2px;background:rgba(255,255,255,.55);border-radius:2px;margin:14px 0 16px;"></div>`
    + `<div style="font-size:21px;font-weight:600;">${escHtml(between)}</div>`
    + (range ? `<div style="font-size:15px;opacity:.85;margin-top:8px;letter-spacing:.3px;">${escHtml(range)}</div>` : '')
    + `<div style="display:flex;gap:14px;margin-top:34px;">`
    + chip(meta.msgCount.toLocaleString(), 'Messages')
    + chip(days.toLocaleString(), days === 1 ? 'Day' : 'Days')
    + (mediaCount ? chip(mediaCount.toLocaleString(), 'Media') : '')
    + `</div>`
    // bottom tagline
    + '<div style="position:absolute;bottom:52px;left:0;right:0;text-align:center;">'
    + '<div style="font-size:15px;opacity:.9;font-style:italic;">A conversation keepsake</div>'
    + '<div style="font-size:12px;opacity:.7;margin-top:6px;letter-spacing:.5px;">Made with 💚 Chat Tree</div>'
    + '</div>';
  book.appendChild(cover);

  // ---- Content ----
  const content = document.createElement('div');
  content.style.cssText = 'padding:8px 40px 44px;';
  let lastD: string | null = null, prevSender: string | null = null, lastMonth: string | null = null;
  for (const m of messages) {
    if (m.date !== lastD) {
      const dl = P.formatDay(m.date, dateOrder);
      const mo = monthOf(dl);
      if (mo !== lastMonth) { content.appendChild(chapterEl(mo)); lastMonth = mo; }
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

    // Split messages into A4 pages at message boundaries (never mid-message).
    // Reserve vertical room for the per-page footer.
    const cTop = content.getBoundingClientRect().top;
    const PAGE_PAD_TOP = 44, PAGE_PAD_BOTTOM = 60;
    const contentPageH = PAGE_H - PAGE_PAD_TOP - PAGE_PAD_BOTTOM - 8;
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

    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });

    // Render one element to one PDF page — each canvas stays small, so any chat
    // length works (no single-giant-canvas browser size cap).
    const addPage = async (el: HTMLElement, first: boolean) => {
      const c = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: PAPER, logging: false });
      if (!first) pdf.addPage();
      const imgH = 210 * (c.height / c.width);
      pdf.addImage(c.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, 210, Math.min(imgH, 297));
    };

    await addPage(cover, true);                          // page 1: cover
    content.remove();                                    // measured already; free it

    const total = pageGroups.length;
    for (let i = 0; i < total; i++) {
      const page = document.createElement('div');
      page.style.cssText = `position:relative;width:${PAGE_W}px;height:${PAGE_H}px;box-sizing:border-box;`
        + `padding:${PAGE_PAD_TOP}px 44px ${PAGE_PAD_BOTTOM}px;background:${PAPER};overflow:hidden;`;
      for (const el of pageGroups[i]) page.appendChild(el);   // moves rows into this page
      // page footer: title (left) · brand + page number (right)
      const footer = document.createElement('div');
      footer.style.cssText = 'position:absolute;left:44px;right:44px;bottom:24px;display:flex;'
        + `justify-content:space-between;align-items:center;font-size:10.5px;color:${SUBTLE};`;
      footer.innerHTML =
        `<span style="max-width:60%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(title)}</span>`
        + `<span>💬 Chat Tree &nbsp;·&nbsp; ${i + 1} / ${total}</span>`;
      // hairline above footer
      const rule = document.createElement('div');
      rule.style.cssText = 'position:absolute;left:44px;right:44px;bottom:44px;height:1px;background:rgba(11,20,26,.08);';
      page.appendChild(rule);
      page.appendChild(footer);
      book.appendChild(page);
      await addPage(page, false);
      page.remove();
    }

    // ---- Closing page ----
    const end = document.createElement('div');
    end.style.cssText = `position:relative;height:${PAGE_H}px;box-sizing:border-box;display:flex;flex-direction:column;`
      + 'align-items:center;justify-content:center;text-align:center;padding:80px 64px;color:#fff;overflow:hidden;'
      + 'background:radial-gradient(120% 80% at 50% 100%,#128c7e 0%,#0b6b5f 45%,#053d36 100%);';
    end.innerHTML =
      '<div style="position:absolute;inset:30px;border:1.5px solid rgba(255,255,255,.28);border-radius:16px;"></div>'
      + '<div style="font-size:52px;margin-bottom:14px;">💚</div>'
      + '<div style="font-size:30px;font-weight:800;">The end… for now</div>'
      + `<div style="font-size:16px;opacity:.9;margin-top:14px;max-width:460px;line-height:1.5;">`
      + `${escHtml(meta.msgCount.toLocaleString())} messages across ${escHtml(days.toLocaleString())} ${days === 1 ? 'day' : 'days'}, `
      + `kept as a keepsake.</div>`
      + '<div style="position:absolute;bottom:52px;left:0;right:0;text-align:center;font-size:12px;opacity:.7;letter-spacing:.5px;">Made with 💚 Chat Tree</div>';
    book.appendChild(end);
    await addPage(end, false);
    end.remove();

    const safe = (title || 'chat').replace(/[^a-z0-9._-]+/gi, '_');
    pdf.save(`${safe}-book.pdf`);
  } finally {
    document.body.removeChild(book);
  }
}
