import { useState } from 'react';
import { CATEGORY_PRESETS, catEmoji } from '../lib/categories';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (category: string | null) => void;
  saving: boolean;
}

/** Asks for an optional category before saving a chat to the cloud history. */
export default function SaveModal({ open, onClose, onSave, saving }: Props) {
  const [sel, setSel] = useState('');
  const [custom, setCustom] = useState('');
  const chosen = custom.trim() || sel;

  function reset() { setSel(''); setCustom(''); }
  function close() { if (!saving) { reset(); onClose(); } }
  function save() { onSave(chosen || null); reset(); }

  return (
    <div className={'hist' + (open ? ' show' : '')} onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="hist-box sv-box">
        <span className="x" onClick={close}>&times;</span>
        <h3>☁ Save to history</h3>
        <p className="sv-sub">Give it a category to keep your chats organised (optional).</p>

        <div className="sv-chips">
          {CATEGORY_PRESETS.map((c) => (
            <button key={c} className={'sv-chip' + (sel === c && !custom.trim() ? ' on' : '')}
              onClick={() => { setSel((v) => (v === c ? '' : c)); setCustom(''); }}>
              {catEmoji(c)} {c}
            </button>
          ))}
        </div>

        <input className="sv-custom" placeholder="…or type your own category"
          value={custom} onChange={(e) => setCustom(e.target.value)} maxLength={30} />

        <div className="sv-actions">
          <button className="sv-skip" disabled={saving} onClick={() => onSave(null)}>Skip</button>
          <button className="sv-save" disabled={saving} onClick={save}>
            {saving ? <span className="btn-load"><span className="spinner btn" />Saving…</span>
              : chosen ? `Save to ${chosen}` : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
