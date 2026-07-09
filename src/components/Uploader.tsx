import { useRef, useState } from 'react';
import JSZip from 'jszip';

export interface LoadedChat {
  rawText: string;
  mediaMap: Record<string, string>;
  mediaBlobs: Record<string, Blob>;
}

interface Props {
  onLoaded: (l: LoadedChat) => void;
  onHistory: () => void;
  onBlank: () => void;
  onHome: () => void;
  userEmail: string | null;
  onLogin: () => void;
  onAccount: () => void;
}

export default function Uploader({ onLoaded, onHistory, onBlank, onHome, userEmail, onLogin, onAccount }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState('');

  async function handleFiles(files: File[]) {
    if (!files.length) return;
    setBusy('Reading files…');
    try {
      let chatText: string | null = null;
      const mediaMap: Record<string, string> = {};
      const mediaBlobs: Record<string, Blob> = {};
      const register = (name: string, blob: Blob) => {
        const b = name.split('/').pop()!.toLowerCase();
        mediaMap[b] = URL.createObjectURL(blob);
        mediaBlobs[b] = blob;
      };
      for (const f of files) {
        const lower = f.name.toLowerCase();
        if (lower.endsWith('.zip')) {
          try {
            setBusy('Opening ZIP…');
            const zip = await JSZip.loadAsync(f);
            const entries = Object.values(zip.files);
            const txtEntry = entries.find((e) => /(^|\/)_chat\.txt$/i.test(e.name))
              || entries.find((e) => e.name.toLowerCase().endsWith('.txt'));
            if (txtEntry) chatText = await txtEntry.async('string');
            const media = entries.filter((e) => !e.dir && e !== txtEntry && !e.name.toLowerCase().endsWith('.txt'));
            let done = 0;
            for (const e of media) {
              register(e.name, await e.async('blob'));
              done++;
              if (media.length > 3) setBusy(`Extracting media ${done} / ${media.length}…`);
            }
          } catch (err) {
            alert("Couldn't open the ZIP. Is the internet on? Or upload the files individually.");
            console.error(err);
          }
        } else if (lower.endsWith('.txt')) {
          chatText = await f.text();
        } else {
          register(f.name, f);
        }
      }
      if (!chatText) {
        alert("No chat .txt file found. Please upload the WhatsApp export ZIP or the '_chat.txt' file.");
        return;
      }
      setBusy('Building chat…');
      onLoaded({ rawText: chatText, mediaMap, mediaBlobs });
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="up-screen">
      <header className="up-nav">
        <span className="lp-logo" style={{ cursor: 'pointer' }} onClick={onHome}>💬 Chat Tree</span>
        {userEmail
          ? <button className="lp-cta sm" onClick={onAccount}>👤 {userEmail.split('@')[0]}</button>
          : <button className="lp-cta sm" onClick={onLogin}>Log in</button>}
      </header>

      <div className="up-wrap">
        <h1 className="up-title">Start your chat</h1>
        <p className="up-sub">Create a chat from scratch, or upload an exported chat to view &amp; edit it.</p>

        <div className="up-cards">
          <button className="up-card blank" onClick={onBlank}>
            <span className="up-ic">✍️</span>
            <span className="up-ct">Create blank chat</span>
            <span className="up-cd">Start empty and build it message by message</span>
          </button>

          <div
            className={'up-card drop' + (drag ? ' drag' : '')}
            style={{ position: 'relative' }}
            onClick={() => { if (!busy) inputRef.current?.click(); }}
            onDragEnter={(e) => { e.preventDefault(); if (!busy) setDrag(true); }}
            onDragOver={(e) => { e.preventDefault(); if (!busy) setDrag(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDrag(false); }}
            onDrop={(e) => { e.preventDefault(); setDrag(false); if (!busy && e.dataTransfer.files?.length) handleFiles([...e.dataTransfer.files]); }}
          >
            <span className="up-ic">📤</span>
            <span className="up-ct">Upload exported chat</span>
            <span className="up-cd">Drop a <b>.zip</b> or <b>_chat.txt</b> (with media)</span>
            <input
              ref={inputRef} type="file" multiple hidden
              accept=".zip,.txt,image/*,video/*,audio/*,.opus,.vcf,.pdf,.doc,.docx"
              onChange={(e) => handleFiles([...(e.target.files || [])])}
            />
            {busy && (
              <div className="up-busy">
                <span className="spinner lg" />
                <span className="lb-text">{busy}</span>
              </div>
            )}
          </div>
        </div>

        <div className="up-foot">
          <button className="lp-cta ghost" onClick={onHistory}>🔓 Open saved history</button>
          <div className="up-note">
            {userEmail
              ? <>Logged in as <b>{userEmail}</b> · <a role="button" tabIndex={0} onClick={onAccount} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAccount(); } }}>Account</a></>
              : <><a role="button" tabIndex={0} onClick={onLogin} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onLogin(); } }}>Log in</a> to save your chats privately</>}
          </div>
        </div>

        <details className="up-help">
          <summary>How to export a WhatsApp chat</summary>
          <p>Open a chat in WhatsApp → tap ⋮ menu → <b>More → Export chat</b> → choose <b>Include media</b>. Upload the <b>.zip</b> you get here. Everything runs privately in your browser.</p>
        </details>
      </div>
    </div>
  );
}
