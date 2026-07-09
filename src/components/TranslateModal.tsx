import { useState } from 'react';
import { translateText } from '../lib/translate';
import type { FromLang, Lang2 } from '../lib/translate';

interface Props {
  open: boolean;
  onClose: () => void;
  onTranslateChat: (from: FromLang, to: Lang2) => void;
  translating: boolean;
  translated: boolean;
}

export default function TranslateModal({ open, onClose, onTranslateChat, translating, translated }: Props) {
  const [from, setFrom] = useState<FromLang>('auto');
  const [to, setTo] = useState<Lang2>('en');

  // quick one-off translator
  const [qText, setQText] = useState('');
  const [qFrom, setQFrom] = useState<FromLang>('auto');
  const [qTo, setQTo] = useState<Lang2>('hi');
  const [qOut, setQOut] = useState('');
  const [qBusy, setQBusy] = useState(false);
  const [qErr, setQErr] = useState('');

  async function quick() {
    setQErr(''); setQOut('');
    const text = qText.trim();
    if (!text) return;
    setQBusy(true);
    try { setQOut(await translateText(text, qFrom, qTo)); }
    catch (e) { setQErr((e as Error).message || String(e)); }
    finally { setQBusy(false); }
  }

  return (
    <div className={'hist' + (open ? ' show' : '')} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="hist-box tr-box">
        <span className="x" onClick={onClose}>&times;</span>
        <h3>🌐 Translate</h3>

        <div className="tr-sec">
          <div className="tr-h">Translate the whole chat</div>
          <div className="tr-langs">
            <label>From
              <select value={from} onChange={(e) => setFrom(e.target.value as FromLang)}>
                <option value="auto">Auto-detect</option>
                <option value="en">English</option>
                <option value="hi">Hindi</option>
              </select>
            </label>
            <span className="tr-arrow">→</span>
            <label>To
              <select value={to} onChange={(e) => setTo(e.target.value as Lang2)}>
                <option value="en">English</option>
                <option value="hi">Hindi</option>
              </select>
            </label>
          </div>
          <button className="tr-go" disabled={translating} onClick={() => onTranslateChat(from, to)}>
            {translating ? 'Translating…' : translated ? 'Re-translate chat' : 'Translate chat'}
          </button>
          <p className="tr-note">The chat switches to the translation — you can toggle back to the original anytime from the badge on the chat.</p>
        </div>

        <div className="tr-div" />

        <div className="tr-sec">
          <div className="tr-h">Quick translate a line</div>
          <textarea className="tr-ta" rows={3} placeholder="Type or paste text to translate…"
            value={qText} onChange={(e) => setQText(e.target.value)} />
          <div className="tr-langs">
            <label>From
              <select value={qFrom} onChange={(e) => setQFrom(e.target.value as FromLang)}>
                <option value="auto">Auto</option>
                <option value="en">English</option>
                <option value="hi">Hindi</option>
              </select>
            </label>
            <span className="tr-arrow">→</span>
            <label>To
              <select value={qTo} onChange={(e) => setQTo(e.target.value as Lang2)}>
                <option value="hi">Hindi</option>
                <option value="en">English</option>
              </select>
            </label>
            <button className="tr-go sm" disabled={qBusy} onClick={quick}>{qBusy ? '…' : 'Translate'}</button>
          </div>
          {qErr && <div className="tr-err">{qErr}</div>}
          {qOut && (
            <div className="tr-out">
              <span>{qOut}</span>
              <button className="tr-copy" title="Copy" onClick={() => navigator.clipboard?.writeText(qOut)}>⧉ Copy</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
