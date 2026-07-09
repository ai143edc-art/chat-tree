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

const PAPER = '#f3ece3';        // warm paper tone for book pages
const INK = '#111b21';
const SUBTLE = '#7a8288';

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

function msgEl(m: Message, out: boolean, isGroup: boolean, grouped: boolean, mediaMap: Record<string, string>): HTMLElement {
  const row = document.createElement('div');
  row.style.cssText = `display:flex;justify-content:${out ? 'flex-end' : 'flex-start'};margin:${grouped ? '2px' : '10px'} 0;`;
  const bub = document.createElement('div');
  // Asymmetric corner acts as a subtle "tail" on the first bubble of each run.
  const radius = grouped ? '10px' : (out ? '12px 12px 4px 12px' : '12px 12px 12px 4px');
  bub.style.cssText = `position:relative;max-width:73%;background:${out ? '#d9fdd3' : '#ffffff'};`
    + `border-radius:${radius};padding:7px 11px 5px;box-shadow:0 1px 1.5px rgba(11,20,26,.16);`
    + 'font-size:14.5px;line-height:1.5;word-break:break-word;overflow-wrap:anywhere;';

  if (isGroup && !out && !grouped && m.sender) {
    const nm = document.createElement('div');
    nm.style.cssText = `font-size:12.5px;font-weight:700;color:${P.avatarColor(m.sender)};margin-bottom:2px;`;
    nm.textContent = m.sender;
    bub.appendChild(nm);
  }

  const att = m.call ? null : P.findAttachment(m.text);
  if (m.call) {
    const c = document.createElement('div');
    c.textContent = `${m.call.media === 'video' ? '📹' : '📞'} ${m.call.title}${m.call.sub ? ' · ' + m.call.sub : ''}`;
    c.style.cssText = 'color:#54656f;';
    bub.appendChild(c);
  } else if (att) {
    const fkey = att.split('/').pop()!.toLowerCase();
    const url = mediaMap[fkey];
    const ext = (fkey.match(/\.([a-z0-9]+)$/) || [])[1] || '';
    if (url && /^(jpe?g|png|gif|webp|bmp|heic)$/.test(ext)) {
      const im = document.createElement('img');
      im.crossOrigin = 'anonymous';
      im.src = url;
      im.style.cssText = 'max-width:100%;max-height:360px;border-radius:8px;display:block;object-fit:cover;'
        + 'box-shadow:0 1px 2px rgba(0,0,0,.14);';
      bub.appendChild(im);
    } else {
      const ph = document.createElement('div');
      ph.textContent = P.mediaLabel(ext);
      ph.style.cssText = 'color:#54656f;font-style:italic;';
      bub.appendChild(ph);
    }
    const cap = P.extractCaption(m.text, att);
    if (cap) {
      const cp = document.createElement('div');
      cp.style.marginTop = '4px';
      cp.innerHTML = P.formatText(cap);
      bub.appendChild(cp);
    }
  } else if (P.PLACEHOLDERS.test(m.text)) {
    const ph = document.createElement('div');
    ph.textContent = P.placeholderLabel(m.text);
    ph.style.cssText = 'color:#54656f;font-style:italic;';
    bub.appendChild(ph);
  } else {
    const tx = document.createElement('div');
    tx.innerHTML = P.formatText(m.text);
    bub.appendChild(tx);
  }

  const tm = document.createElement('div');
  tm.textContent = P.shortTime(m.time);
  tm.style.cssText = 'font-size:10.5px;color:#8696a0;text-align:right;margin-top:3px;';
  bub.appendChild(tm);

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
