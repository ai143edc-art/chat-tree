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
}

const WA_BG = '#efe7de';

function escHtml(s: string): string {
  return (s || '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c]);
}

function dayEl(text: string): HTMLElement {
  const w = document.createElement('div');
  w.style.cssText = 'display:flex;justify-content:center;margin:18px 0 10px;';
  const p = document.createElement('span');
  p.textContent = text;
  p.style.cssText = 'background:#fff;color:#54656f;font-size:12.5px;font-weight:600;padding:5px 12px;border-radius:8px;box-shadow:0 1px 1px rgba(0,0,0,.1);';
  w.appendChild(p);
  return w;
}

function sysEl(text: string): HTMLElement {
  const w = document.createElement('div');
  w.style.cssText = 'display:flex;justify-content:center;margin:8px 0;';
  const p = document.createElement('span');
  p.innerHTML = P.formatText(P.stripMarks(text).trim());
  p.style.cssText = 'background:#ffeecd;color:#7a6a3f;font-size:12px;padding:5px 12px;border-radius:8px;text-align:center;max-width:80%;line-height:1.4;';
  w.appendChild(p);
  return w;
}

function msgEl(m: Message, out: boolean, isGroup: boolean, grouped: boolean, mediaMap: Record<string, string>): HTMLElement {
  const row = document.createElement('div');
  row.style.cssText = `display:flex;justify-content:${out ? 'flex-end' : 'flex-start'};margin:${grouped ? '2px' : '9px'} 0;`;
  const bub = document.createElement('div');
  bub.style.cssText = `max-width:74%;background:${out ? '#d9fdd3' : '#fff'};border-radius:10px;padding:7px 10px 5px;`
    + 'box-shadow:0 1px 1px rgba(0,0,0,.13);font-size:15px;line-height:1.45;word-break:break-word;overflow-wrap:anywhere;';

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
      im.style.cssText = 'max-width:100%;max-height:360px;border-radius:7px;display:block;object-fit:cover;';
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
  tm.style.cssText = 'font-size:11px;color:#667781;text-align:right;margin-top:3px;';
  bub.appendChild(tm);

  row.appendChild(bub);
  return row;
}

/** Build a paginated, cover-fronted "keepsake book" PDF of the whole chat. */
export async function exportBook(meta: BookMeta): Promise<void> {
  const { title, meName, senders, dateOrder, messages, mediaMap } = meta;
  if (!messages.length) throw new Error('Open a chat first.');
  const isGroup = senders.length > 2;

  const PAGE_W = 794;                                   // px ≈ A4 width
  const PAGE_H = Math.round(PAGE_W * 297 / 210);        // px ≈ A4 height (~1123)

  const book = document.createElement('div');
  book.style.cssText = `position:fixed;left:-10000px;top:0;width:${PAGE_W}px;background:${WA_BG};`
    + "font-family:'Segoe UI',system-ui,-apple-system,'Noto Sans',sans-serif;color:#111b21;";

  // ---- Cover (exactly one page) ----
  const firstDate = messages.find((m) => m.date)?.date;
  const lastDate = [...messages].reverse().find((m) => m.date)?.date;
  const range = firstDate && lastDate ? `${P.formatDay(firstDate, dateOrder)} — ${P.formatDay(lastDate, dateOrder)}` : '';
  const others = senders.filter((s) => s !== meName);
  const between = isGroup ? senders.slice(0, 5).join(', ')
    : (meName && others[0] ? `${others[0]}  &  ${meName}` : title);
  const cover = document.createElement('div');
  cover.style.cssText = `height:${PAGE_H}px;box-sizing:border-box;display:flex;flex-direction:column;`
    + 'align-items:center;justify-content:center;text-align:center;padding:70px 60px;'
    + 'background:linear-gradient(160deg,#075e54,#128c7e 55%,#25d366);color:#fff;';
  cover.innerHTML =
    '<div style="font-size:66px;margin-bottom:12px;">💬</div>'
    + `<div style="font-size:44px;font-weight:800;line-height:1.15;margin-bottom:16px;">${escHtml(title)}</div>`
    + '<div style="font-size:20px;opacity:.9;letter-spacing:.5px;margin-bottom:40px;">A conversation keepsake</div>'
    + `<div style="font-size:23px;font-weight:600;">${escHtml(between)}</div>`
    + `<div style="font-size:16px;opacity:.85;margin-top:10px;">${escHtml(range)}</div>`
    + `<div style="font-size:16px;opacity:.85;margin-top:4px;">${meta.msgCount.toLocaleString()} messages</div>`
    + '<div style="font-size:15px;opacity:.8;margin-top:56px;">Made with Chat Tree</div>';
  book.appendChild(cover);

  // ---- Content ----
  const content = document.createElement('div');
  content.style.cssText = 'padding:30px 40px 44px;';
  let lastD: string | null = null, prevSender: string | null = null;
  for (const m of messages) {
    if (m.date !== lastD) { content.appendChild(dayEl(P.formatDay(m.date, dateOrder))); lastD = m.date; prevSender = null; }
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
    const cTop = content.getBoundingClientRect().top;
    const contentPageH = PAGE_H - 64;                    // usable height inside a page's padding
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
      const c = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: WA_BG, logging: false });
      if (!first) pdf.addPage();
      const imgH = 210 * (c.height / c.width);
      pdf.addImage(c.toDataURL('image/jpeg', 0.85), 'JPEG', 0, 0, 210, Math.min(imgH, 297));
    };

    await addPage(cover, true);                          // page 1: cover
    content.remove();                                    // measured already; free it
    for (const group of pageGroups) {
      const page = document.createElement('div');
      page.style.cssText = `width:${PAGE_W}px;height:${PAGE_H}px;box-sizing:border-box;padding:32px 40px;background:${WA_BG};overflow:hidden;`;
      for (const el of group) page.appendChild(el);      // moves rows into this page
      book.appendChild(page);
      await addPage(page, false);
      page.remove();
    }

    const safe = (title || 'chat').replace(/[^a-z0-9._-]+/gi, '_');
    pdf.save(`${safe}-book.pdf`);
  } finally {
    document.body.removeChild(book);
  }
}
