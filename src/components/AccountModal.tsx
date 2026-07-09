import { useState } from 'react';
import { changePassword, deleteAccount, signOut } from '../lib/supabase';

interface Props {
  open: boolean;
  onClose: () => void;
  email: string | null;
  toast: (msg: string, ms?: number) => void;
}

export default function AccountModal({ open, onClose, email, toast }: Props) {
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function doChangePw() {
    setErr('');
    if (pw.length < 6) { setErr('Password must be at least 6 characters.'); return; }
    setBusy(true);
    try { await changePassword(pw); setPw(''); toast('✅ Password changed', 2200); }
    catch (e) { setErr((e as Error).message || String(e)); }
    finally { setBusy(false); }
  }
  async function doLogout() { await signOut(); onClose(); toast('Logged out', 1600); }
  async function doDelete() {
    if (!confirm('Delete your account permanently?\nAll your saved chats and media will be erased. This cannot be undone.')) return;
    if (!confirm('Are you absolutely sure? This is irreversible.')) return;
    setErr(''); setBusy(true);
    try { await deleteAccount(); onClose(); toast('Account deleted', 2500); }
    catch (e) { setErr((e as Error).message || String(e)); setBusy(false); }
  }

  return (
    <div className={'hist' + (open ? ' show' : '')} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="hist-box">
        <span className="x" onClick={onClose}>&times;</span>
        <h3>⚙️ Account</h3>
        <p className="hist-sub">Signed in as <b>{email}</b></p>

        <div className="acc-sec">
          <div className="acc-label">Change password</div>
          <input className="hist-pass" type="password" placeholder="New password (min 6)"
            value={pw} onChange={(e) => setPw(e.target.value)} />
          <button className="btn hist-open" onClick={doChangePw} disabled={busy}>Update password</button>
        </div>

        <div className="hist-err">{err}</div>

        <div className="acc-actions">
          <button className="mini-btn" onClick={doLogout} disabled={busy}>Log out</button>
          <button className="mini-btn acc-del" onClick={doDelete} disabled={busy}>🗑️ Delete account</button>
        </div>
      </div>
    </div>
  );
}
