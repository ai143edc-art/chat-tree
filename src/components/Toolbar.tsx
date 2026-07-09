import type { ChangeEvent } from 'react';
import { MODELS, WALLPAPERS } from '../lib/models';
import type { PhoneModel } from '../lib/models';
import { fileToAvatar, fileToDataUrl } from '../lib/image';
import MiniSelect from './MiniSelect';

interface Props {
  meName: string | null;
  onRenameMe: (v: string) => void;
  onSwap: () => void;
  model: PhoneModel;
  onModel: (m: PhoneModel) => void;
  contactTitle: string;
  onTitle: (v: string) => void;
  status: string;
  onStatus: (v: string) => void;
  showStatusBar: boolean;
  onToggleStatusBar: () => void;
  showTyping: boolean;
  onToggleTyping: () => void;
  settingsOpen: boolean;
  onToggleSettings: () => void;
  editMode: boolean;
  onEditMode: () => void;
  onHome: () => void;
  userEmail: string | null;
  onLogin: () => void;
  onAccount: () => void;
  wallpaper: string;
  onWallpaper: (css: string) => void;
  avatar: string | null;
  onAvatar: (dataUrl: string | null) => void;
}

export default function Toolbar(p: Props) {
  async function pickAvatar(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try { p.onAvatar(await fileToAvatar(f)); }
    catch (err) { alert((err as Error).message); }
  }
  async function pickWallpaper(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try { p.onWallpaper(`center/cover no-repeat url("${await fileToDataUrl(f)}")`); }
    catch (err) { alert((err as Error).message); }
  }
  return (
    <div className="toolbar">
      <div className="toolbar-top">
        <span className="tb-brand" onClick={p.onHome} title="Home">💬 Chat Tree</span>
        <span className="spacer" />
        {p.userEmail
          ? <button className="collapse-btn" onClick={p.onAccount} title={p.userEmail}>👤 {p.userEmail.split('@')[0]}</button>
          : <button className="collapse-btn" onClick={p.onLogin}>🔐 Log in</button>}
        <button className={'collapse-btn' + (p.settingsOpen ? ' on' : '')} onClick={p.onToggleSettings}>⚙️ Settings</button>
        <button className={'collapse-btn' + (p.editMode ? ' on' : '')} onClick={p.onEditMode} title="Click messages to edit them">
          ✏️ Edit: {p.editMode ? 'ON' : 'OFF'}
        </button>
      </div>

      {p.settingsOpen && (
        <div className="panel">
          <div className="settings-row">
            <div className="ctrl">
              <label>You are (right side)</label>
              <input value={p.meName ?? ''} placeholder="Your name" onChange={(e) => p.onRenameMe(e.target.value)} />
            </div>
            <button className="swap-btn" title="Swap sides (left ↔ right)" onClick={p.onSwap}>⇄</button>
            <div className="ctrl">
              <label>Contact name (header)</label>
              <input value={p.contactTitle} placeholder="Name" onChange={(e) => p.onTitle(e.target.value)} />
            </div>
            <div className="ctrl" style={{ flex: '0 0 auto' }}>
              <label>Phone status bar</label>
              <button className="mini-btn" onClick={p.onToggleStatusBar}>📶 {p.showStatusBar ? 'ON' : 'OFF'}</button>
            </div>
            <div className="ctrl" style={{ flex: '0 0 auto' }}>
              <label>Typing indicator</label>
              <button className="mini-btn" onClick={p.onToggleTyping}>⌨️ {p.showTyping ? 'ON' : 'OFF'}</button>
            </div>
            <div className="ctrl" style={{ flex: '0 0 auto' }}>
              <label>Header avatar</label>
              <div className="avatar-ctrl">
                <label className="mini-btn">{p.avatar ? '📷 Change' : '📷 Set'}
                  <input type="file" accept="image/*" hidden onChange={pickAvatar} />
                </label>
                {p.avatar && <button className="mini-btn" title="Remove" onClick={() => p.onAvatar(null)}>✕</button>}
              </div>
            </div>
          </div>
          <div className="settings-row">
            <div className="ctrl">
              <label>Status (under name)</label>
              <div className="status-ctrl">
                <MiniSelect
                  value={p.status}
                  onChange={p.onStatus}
                  placeholder="custom"
                  options={[
                    { label: 'online', value: 'online' },
                    { label: 'typing…', value: 'typing…' },
                    { label: 'last seen recently', value: 'last seen recently' },
                    { label: '(hidden)', value: '' },
                  ]}
                />
                <input value={p.status} placeholder="custom status…" onChange={(e) => p.onStatus(e.target.value)} />
              </div>
            </div>
            <div className="ctrl">
              <label>Wallpaper</label>
              <div className="wp-ctrl">
                <MiniSelect
                  value={p.wallpaper}
                  onChange={p.onWallpaper}
                  placeholder="🖼️ Custom image"
                  options={WALLPAPERS.map((w) => ({ label: w.name, value: w.css }))}
                />
                <label className="mini-btn" title="Upload your own wallpaper">📷
                  <input type="file" accept="image/*" hidden onChange={pickWallpaper} />
                </label>
              </div>
            </div>
            <div className="ctrl">
              <label>Phone model (screen size)</label>
              <MiniSelect
                value={p.model.name}
                onChange={(name) => { const m = MODELS.find((x) => x.name === name); if (m) p.onModel(m); }}
                options={MODELS.map((m) => ({ label: `${m.name} (${m.w}×${m.h})`, value: m.name }))}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
