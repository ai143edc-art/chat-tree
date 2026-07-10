import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import * as P from '../lib/parser';
import { useLang } from '../lib/i18n';

interface Props {
  open: boolean;
  url: string;
  title: string;
  avatar?: string | null;
  onClose: () => void;
  toast: (msg: string, ms?: number) => void;
}

/** Share sheet for a saved chat: a downloadable QR card with the chat's
 *  profile (avatar + name) plus copy-link. */
export default function ShareModal({ open, url, title, avatar, onClose, toast }: Props) {
  const { t } = useLang();
  const [qr, setQr] = useState('');
  const [busy, setBusy] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const name = title || 'Chat';

  useEffect(() => {
    if (!open || !url) { setQr(''); return; }
    let alive = true;
    // Tuned so phone cameras lock on instantly: a full 4-module quiet zone
    // (the QR spec's requirement), low EC so the modules stay large, near-black
    // on white for maximum contrast, and a 3x source so the 240px render is crisp.
    QRCode.toDataURL(url, {
      width: 720, margin: 4, errorCorrectionLevel: 'L',
      color: { dark: '#111b21', light: '#ffffff' },
    })
      .then((d) => { if (alive) setQr(d); })
      .catch(() => { if (alive) setQr(''); });
    return () => { alive = false; };
  }, [open, url]);

  async function copy() {
    try { await navigator.clipboard.writeText(url); toast(t('shareCopied'), 2200); }
    catch { prompt(t('hSharePrompt'), url); }
  }

  async function download() {
    if (!cardRef.current) return;
    setBusy(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const c = await html2canvas(cardRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });
      const a = document.createElement('a');
      a.href = c.toDataURL('image/png');
      a.download = `${name.replace(/[^a-z0-9._-]+/gi, '_')}-qr.png`;
      a.click();
      toast(t('shareDownloaded'), 2400);
    } catch (e) {
      toast('❌ ' + ((e as Error).message || e), 3500);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={'hist' + (open ? ' show' : '')} onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}>
      <div className="hist-box sh-box">
        <span className="x" onClick={() => !busy && onClose()}>&times;</span>
        <h3>🔗 {t('shareTitle')}</h3>

        <div className="sh-card" ref={cardRef}>
          <div className="sh-brand">💬 Chat Tree</div>

          <div className="sh-who">
            {avatar
              ? <img className="sh-ava" src={avatar} alt="" crossOrigin="anonymous" />
              : <span className="sh-ava e" style={{ background: P.avatarColor(name) }}>{P.initial(name)}</span>}
            <div className="sh-nm">
              <b>{name}</b>
              <span>{t('shareReadOnly')}</span>
            </div>
          </div>

          <div className="sh-qr">
            {qr ? <img src={qr} alt="QR code" /> : <span className="spinner lg" />}
          </div>

          <div className="sh-scan">{t('shareScan')}</div>
          <div className="sh-link">{url}</div>
        </div>

        <div className="sh-actions">
          <button className="sh-copy" onClick={copy} disabled={busy}>⧉ {t('shareCopy')}</button>
          <button className="sh-dl" onClick={download} disabled={busy || !qr}>
            {busy
              ? <span className="btn-load"><span className="spinner btn" />{t('pleaseWait')}</span>
              : `⬇ ${t('shareDownload')}`}
          </button>
        </div>

        <p className="sh-note">{t('shareNote')}</p>
      </div>
    </div>
  );
}
