import { useEffect, useState } from 'react';
import { listChats, getChat, renameChat, deleteChat, shareChat, updateCategory } from '../lib/supabase';
import type { ChatRow } from '../lib/supabase';
import { CATEGORY_PRESETS, catEmoji } from '../lib/categories';

interface Props {
  open: boolean;
  onClose: () => void;
  onOpenChat: (row: ChatRow) => void;
  toast: (msg: string, ms?: number) => void;
}

export default function HistoryModal({ open, onClose, onOpenChat, toast }: Props) {
  const [rows, setRows] = useState<ChatRow[] | null>(null);
  const [err, setErr] = useState('');
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('');
  const [openingId, setOpeningId] = useState('');

  useEffect(() => {
    if (!open) return;
    setRows(null); setErr('');
    listChats().then(setRows).catch((e) => setErr((e as Error).message || String(e)));
  }, [open]);

  async function refresh() { try { setRows(await listChats()); } catch { /* ignore */ } }

  async function openChat(id: string) {
    if (openingId) return;
    setOpeningId(id);
    toast('Loading chat…', 0);
    try { const row = await getChat(id); if (row) onOpenChat(row); else toast('Chat not found', 2500); }
    catch (e) { toast('❌ ' + ((e as Error).message || e), 3500); }
    finally { setOpeningId(''); }
  }
  async function doRename(id: string, cur: string) {
    const name = prompt('New name for this chat:', cur || ''); if (name == null) return;
    const t = name.trim(); if (!t) return;
    try { await renameChat(id, t); toast('✅ Renamed', 1800); refresh(); }
    catch (e) { toast('❌ ' + ((e as Error).message || e), 3000); }
  }
  async function doShare(id: string) {
    toast('Creating share link…', 0);
    try {
      const url = await shareChat(id);
      try { await navigator.clipboard.writeText(url); toast('🔗 Share link copied! Anyone with it can view this chat (media links stay valid ~1 year).', 5000); }
      catch { prompt('Share this link (media links stay valid ~1 year):', url); toast('', 1); }
    } catch (e) { toast('❌ ' + ((e as Error).message || e), 3500); }
  }
  async function doDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}" from history?\nIts media will also be removed. This cannot be undone.`)) return;
    try { await deleteChat(id); toast('🗑️ Deleted', 1800); refresh(); }
    catch (e) { toast('❌ ' + ((e as Error).message || e), 3000); }
  }
  async function doCategory(id: string, cur: string) {
    const c = prompt(`Category (e.g. ${CATEGORY_PRESETS.join(', ')})\nLeave blank to remove:`, cur || '');
    if (c === null) return;
    const t = c.trim();
    try { await updateCategory(id, t || null); toast('🏷️ Category updated', 1600); refresh(); }
    catch (e) { toast('❌ ' + ((e as Error).message || e), 3000); }
  }

  const cats = Array.from(new Set((rows || []).map((r) => r.category).filter(Boolean))) as string[];

  return (
    <div className={'hist' + (open ? ' show' : '')} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="hist-box">
        <span className="x" onClick={onClose}>&times;</span>
        <h3>☁ Your saved chats</h3>
        {err && <div className="hist-err">{err}</div>}
        {rows === null ? (
          <div className="load-block">
            <span className="spinner lg" />
            <span className="lb-text">Loading your chats…</span>
          </div>
        ) : (
          <>
          {rows.length > 4 && (
            <input className="hist-pass" style={{ marginBottom: 10 }} placeholder="🔍 Search chats…"
              value={query} onChange={(e) => setQuery(e.target.value)} />
          )}
          {cats.length > 0 && (
            <div className="hist-cats">
              <button className={'hc-chip' + (cat === '' ? ' on' : '')} onClick={() => setCat('')}>All</button>
              {cats.map((c) => (
                <button key={c} className={'hc-chip' + (cat === c ? ' on' : '')} onClick={() => setCat((v) => (v === c ? '' : c))}>
                  {catEmoji(c)} {c}
                </button>
              ))}
            </div>
          )}
          <div className="hist-list">
            {rows.length === 0 && (
              <p className="hist-sub">No saved chats yet. Open a chat and click “☁ Save to history”.</p>
            )}
            {rows
              .filter((r) => (r.contact_title || r.title || '').toLowerCase().includes(query.toLowerCase()))
              .filter((r) => !cat || r.category === cat)
              .map((r) => {
              const d = new Date(r.created_at || '');
              const ds = isNaN(+d) ? '' : d.toLocaleDateString();
              const title = r.contact_title || r.title || 'Chat';
              const info = [r.msg_count != null ? `${r.msg_count.toLocaleString()} msgs` : '', ds].filter(Boolean).join(' · ');
              return (
                <div className={'hist-item' + (openingId === r.id ? ' opening' : '')} key={r.id}>
                  <div className="hi-main" onClick={() => openChat(r.id)}>
                    <span className="hi-title">
                      {title}
                      {r.category && <span className="hi-cat">{catEmoji(r.category)} {r.category}</span>}
                    </span>
                    <span className="hi-date">{info}</span>
                  </div>
                  {openingId === r.id && <span className="spinner sm" style={{ marginRight: 8 }} />}
                  <div className="hi-actions">
                    <button className="hi-btn" title="Category" onClick={() => doCategory(r.id, r.category || '')}>🏷️</button>
                    <button className="hi-btn" title="Share link" onClick={() => doShare(r.id)}>🔗</button>
                    <button className="hi-btn hi-rename" title="Rename" onClick={() => doRename(r.id, title)}>✏️</button>
                    <button className="hi-btn hi-del" title="Delete" onClick={() => doDelete(r.id, title)}>🗑️</button>
                  </div>
                </div>
              );
            })}
          </div>
          </>
        )}
      </div>
    </div>
  );
}
