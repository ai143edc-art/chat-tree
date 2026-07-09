import { useMemo, useState } from 'react';
import * as P from '../lib/parser';
import type { Message } from '../lib/parser';

interface Item { url: string; kind: 'img' | 'video'; name: string }

interface Props {
  open: boolean;
  onClose: () => void;
  messages: Message[];
  mediaMap: Record<string, string>;
  onOpen: (url: string, kind: 'img' | 'video') => void;
}

/** A dedicated grid of every photo & video in the chat. Click to open in the lightbox. */
export default function GalleryModal({ open, onClose, messages, mediaMap, onOpen }: Props) {
  const [tab, setTab] = useState<'all' | 'img' | 'video'>('all');

  const items = useMemo<Item[]>(() => {
    if (!open) return [];
    const out: Item[] = [];
    const seen = new Set<string>();
    for (const m of messages) {
      if (m.call) continue;
      const att = P.findAttachment(m.text);
      if (!att) continue;
      const fkey = att.split('/').pop()!.toLowerCase();
      const url = mediaMap[fkey];
      if (!url || seen.has(fkey)) continue;
      const ext = (fkey.match(/\.([a-z0-9]+)$/) || [])[1] || '';
      if (/^(jpe?g|png|gif|webp|bmp|heic)$/.test(ext)) { out.push({ url, kind: 'img', name: att }); seen.add(fkey); }
      else if (/^(mp4|3gp|mov|mkv|webm|avi)$/.test(ext)) { out.push({ url, kind: 'video', name: att }); seen.add(fkey); }
    }
    return out;
  }, [open, messages, mediaMap]);

  const photos = items.filter((i) => i.kind === 'img').length;
  const videos = items.length - photos;
  const shown = items.filter((i) => tab === 'all' || i.kind === tab);

  return (
    <div className={'gal' + (open ? ' show' : '')} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="gal-box">
        <span className="x" onClick={onClose}>&times;</span>
        <h3>🖼️ Media gallery</h3>
        <div className="gal-tabs">
          <button className={tab === 'all' ? 'on' : ''} onClick={() => setTab('all')}>All ({items.length})</button>
          <button className={tab === 'img' ? 'on' : ''} onClick={() => setTab('img')}>📷 Photos ({photos})</button>
          <button className={tab === 'video' ? 'on' : ''} onClick={() => setTab('video')}>🎥 Videos ({videos})</button>
        </div>
        {shown.length === 0 ? (
          <p className="gal-empty">No media to show here. 📭</p>
        ) : (
          <div className="gal-grid">
            {shown.map((it, i) => (
              <div className="gal-cell" key={it.name + i} onClick={() => onOpen(it.url, it.kind)}>
                {it.kind === 'img'
                  ? <img src={it.url} loading="lazy" alt="" />
                  : <><video src={it.url} preload="metadata" muted /><span className="gal-play">▶</span></>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
