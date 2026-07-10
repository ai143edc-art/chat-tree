import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { useLang } from '../lib/i18n';
import {
  BOOK_THEMES, BOOK_BORDERS, BOOK_SIZES, defaultBookConfig, themeOf, sizeOf,
  loadTemplates, saveTemplate, deleteTemplate,
} from '../lib/bookThemes';
import type { BookConfig, BookTemplate } from '../lib/bookThemes';

interface Props {
  open: boolean;
  onClose: () => void;
  onExport: (config: BookConfig) => void;
  exporting: boolean;
  defaultTitle: string;
  avatar: string | null;
  meName: string | null;
  senders: string[];
  msgCount: number;
  days: number;
  mediaCount: number;
}

export default function BookModal(p: Props) {
  const { t } = useLang();
  const [cfg, setCfg] = useState<BookConfig>(() => defaultBookConfig(p.defaultTitle));
  const [tpls, setTpls] = useState<BookTemplate[]>([]);
  const [tplName, setTplName] = useState('');

  // Re-seed the title from the current chat whenever the studio is opened.
  useEffect(() => {
    if (p.open) { setCfg((c) => ({ ...c, title: p.defaultTitle })); setTpls(loadTemplates()); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.open]);

  const th = themeOf(cfg.themeKey);
  const sz = sizeOf(cfg.sizeKey);
  const headFont = cfg.serif ? "Georgia,'Times New Roman',serif" : 'inherit';
  const set = (patch: Partial<BookConfig>) => setCfg((c) => ({ ...c, ...patch }));

  const between = useMemo(() => {
    const others = p.senders.filter((s) => s !== p.meName);
    if (p.senders.length > 2) return p.senders.slice(0, 4).join(', ');
    return p.meName && others[0] ? `${others[0]}  &  ${p.meName}` : (cfg.title || p.defaultTitle);
  }, [p.senders, p.meName, cfg.title, p.defaultTitle]);

  function doSaveTpl() {
    const name = tplName.trim();
    if (!name) return;
    setTpls(saveTemplate(name, cfg));
    setTplName('');
  }
  /** Merge over the defaults so templates saved before a field existed
   *  (e.g. phoneFrame, twoColumns, sizeKey) don't leave it undefined. */
  function applyTpl(tp: BookTemplate) {
    const title = cfg.title || tp.config.title;
    setCfg({ ...defaultBookConfig(title), ...tp.config, title });
  }
  function delTpl(name: string) { setTpls(deleteTemplate(name)); }

  const toggle = (key: keyof BookConfig, label: string) => (
    <label className="bk-toggle">
      <input type="checkbox" checked={cfg[key] as boolean} onChange={(e) => set({ [key]: e.target.checked } as Partial<BookConfig>)} />
      <span>{label}</span>
    </label>
  );

  /** Phone frame and two columns can't both apply — a phone is a single column.
   *  Turning one on switches the other off, so neither silently does nothing. */
  const exclusiveToggle = (key: 'phoneFrame' | 'twoColumns', other: 'phoneFrame' | 'twoColumns', label: string) => (
    <label className="bk-toggle">
      <input type="checkbox" checked={cfg[key]}
        onChange={(e) => set(e.target.checked
          ? ({ [key]: true, [other]: false } as unknown as Partial<BookConfig>)
          : ({ [key]: false } as unknown as Partial<BookConfig>))} />
      <span>{label}</span>
    </label>
  );

  const chips = [
    [p.msgCount.toLocaleString(), t('sMessages')],
    [p.days.toLocaleString(), p.days === 1 ? t('bkDay') : t('bkDays')],
    ...(p.mediaCount ? [[p.mediaCount.toLocaleString(), t('sMedia')]] : []),
  ] as [string, string][];

  // ---- live inside-page preview bits ----
  const DOODLE = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><g fill='none' stroke='%23dccfbe' stroke-width='2' stroke-linecap='round'><circle cx='20' cy='24' r='7'/><path d='M60 16 h22 v13 h-13 l-6 6 v-6 h-3 z'/><path d='M96 20 q6 -7 12 0'/><path d='M16 70 q7 -8 14 0'/><path d='M70 64 l4 8 8 1 -6 6 2 8 -8 -4 -8 4 2 -8 -6 -6 8 -1 z'/><rect x='96' y='62' width='18' height='14' rx='3'/><path d='M22 104 q7 -8 14 0'/><circle cx='92' cy='104' r='6'/></g></svg>\")";
  const insideBg: CSSProperties = cfg.showWallpaper
    ? { backgroundColor: '#efeae2', backgroundImage: DOODLE, backgroundSize: '54px 54px' }
    : { background: th.paper };
  const SAMPLE = [
    { out: false, txt: 'Kal milte hai? ☕' }, { out: true, txt: 'Haan pakka 👍' },
    { out: false, txt: '', media: true }, { out: true, txt: 'Perfect 🔥' },
    { out: false, txt: 'Address bhej diya 📍' }, { out: true, txt: 'Mil jayega' },
  ];
  const bubble = (m: { out: boolean; txt: string; media?: boolean }, i: number) => (
    <div key={i} className={'bkm ' + (m.out ? 'out' : 'in')}>
      <div className="bkm-b" style={{ background: m.out ? '#d9fdd3' : '#fff' }}>
        {m.media ? <span className="bkm-media">📷</span> : <span>{m.txt}</span>}
        <span className="bkm-t">10:0{i}{m.out && <b> ✓✓</b>}</span>
      </div>
    </div>
  );
  const frameJsx = () => {
    const c = th.accent, k = cfg.borderKey;
    if (k === 'none') return null;
    const corners = (['tl', 'tr', 'bl', 'br'] as const).map((pos) => {
      const s: CSSProperties = { borderColor: c };
      if (pos[0] === 't') { s.top = 5; s.borderBottom = 'none'; } else { s.bottom = 5; s.borderTop = 'none'; }
      if (pos[1] === 'l') { s.left = 5; s.borderRight = 'none'; } else { s.right = 5; s.borderLeft = 'none'; }
      return <span key={pos} className="bk-fc" style={s} />;
    });
    if (k === 'corners') return <>{corners}</>;
    const s: CSSProperties = { borderColor: c };
    if (k === 'rounded') s.borderRadius = '9px';
    if (k === 'dotted') s.borderStyle = 'dotted';
    return (
      <>
        <span className="bk-fr" style={s} />
        {(k === 'double' || k === 'ornate') && <span className="bk-fr inner" style={{ borderColor: c }} />}
        {k === 'ornate' && corners}
      </>
    );
  };
  const insideTitle = cfg.title || p.defaultTitle;

  return (
    <div className={'hist' + (p.open ? ' show' : '')} onClick={(e) => { if (e.target === e.currentTarget && !p.exporting) p.onClose(); }}>
      <div className="hist-box bk-box">
        <span className="x" onClick={() => !p.exporting && p.onClose()}>&times;</span>
        <h3>📖 {t('bkTitle')}</h3>

        <div className="bk-grid">
          {/* ---- live preview ---- */}
          <div className="bk-preview">
            <div className="bk-cover" style={{ background: th.coverBg, color: th.ink, aspectRatio: `${sz.w}/${sz.h}` }}>
              <div className="bk-frame" style={{ borderColor: th.frame }} />
              <div className="bk-mark" style={{ color: th.inkSoft }}>C H A T · T R E E</div>
              {cfg.showAvatar && p.avatar
                ? <img className="bk-med" src={p.avatar} alt="" style={{ borderColor: th.frame }} />
                : <div className="bk-med bk-med-emoji" style={{ background: th.chip, borderColor: th.frame }}>💬</div>}
              <div className="bk-ttl" style={{ fontFamily: headFont, fontWeight: cfg.serif ? 700 : 800 }}>{cfg.title || p.defaultTitle}</div>
              <div className="bk-div" style={{ background: th.inkSoft }} />
              <div className="bk-who">{between}</div>
              {cfg.showStats && (
                <div className="bk-chips">
                  {chips.map(([v, l]) => (
                    <div key={l} className="bk-chip" style={{ background: th.chip, borderColor: th.chipBorder }}>
                      <b>{v}</b><span>{l}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="bk-tag" style={{ color: th.inkSoft }}>
                {cfg.subtitle && <em style={{ color: th.ink, fontFamily: headFont }}>{cfg.subtitle}</em>}
                <div>Made with 💚 Chat Tree</div>
              </div>
            </div>
            <div className="bk-preview-cap">{t('bkPreview')} · Cover</div>

            {/* inside / chat page — live */}
            <div className="bk-inside" style={{ aspectRatio: `${sz.w}/${sz.h}`, ...(cfg.phoneFrame ? { background: th.paper } : insideBg) }}>
              {!cfg.phoneFrame && frameJsx()}
              {cfg.phoneFrame ? (
                <div className="bk-ph">
                  <div className="bk-ph-scr">
                    <div className="bk-ph-head">
                      <span className="bk-ph-back">‹</span>
                      {cfg.showAvatar && p.avatar
                        ? <img className="bk-ph-ava" src={p.avatar} alt="" />
                        : <span className="bk-ph-ava e">{insideTitle.slice(0, 1).toUpperCase()}</span>}
                      <span className="bk-ph-nm">{insideTitle}</span>
                      <span className="bk-ph-ic">⋮</span>
                    </div>
                    <div className="bk-ph-body" style={insideBg}>
                      {cfg.showChapters && <div className="bkm-day">Today</div>}
                      {SAMPLE.map(bubble)}
                    </div>
                  </div>
                </div>
              ) : cfg.twoColumns ? (
                <div className="bk-cols">
                  <div className="bk-col">{cfg.showChapters && <div className="bkm-day">July</div>}{SAMPLE.slice(0, 3).map(bubble)}</div>
                  <div className="bk-coldiv" style={{ background: th.accent }} />
                  <div className="bk-col">{SAMPLE.slice(3).map(bubble)}</div>
                </div>
              ) : (
                <div className="bk-single">{cfg.showChapters && <div className="bkm-day">9 July</div>}{SAMPLE.map(bubble)}</div>
              )}
              {cfg.showPageNumbers && !cfg.phoneFrame && <div className="bk-pgn">1</div>}
            </div>
            <div className="bk-preview-cap">Inside page</div>
          </div>

          {/* ---- settings ---- */}
          <div className="bk-settings">
            <label className="bk-field">
              <span>{t('bkTitleLabel')}</span>
              <input value={cfg.title} onChange={(e) => set({ title: e.target.value })} placeholder={p.defaultTitle} maxLength={60} />
            </label>
            <label className="bk-field">
              <span>{t('bkSubtitle')}</span>
              <input value={cfg.subtitle} onChange={(e) => set({ subtitle: e.target.value })} maxLength={60} />
            </label>
            <label className="bk-field">
              <span>{t('bkDedication')}</span>
              <input value={cfg.dedication} onChange={(e) => set({ dedication: e.target.value })} placeholder={t('bkDedicationPh')} maxLength={120} />
            </label>

            <div className="bk-sec">{t('bkTheme')}</div>
            <div className="bk-themes">
              {BOOK_THEMES.map((tm) => (
                <button key={tm.key} className={'bk-sw' + (cfg.themeKey === tm.key ? ' on' : '')}
                  title={tm.name} onClick={() => set({ themeKey: tm.key })}>
                  <span className="bk-sw-dot" style={{ background: tm.coverBg }} />
                  <span className="bk-sw-nm">{tm.name}</span>
                </button>
              ))}
            </div>

            <div className="bk-sec">{t('bkBorder')}</div>
            <div className="bk-borders">
              {BOOK_BORDERS.map((b) => (
                <button key={b.key} className={'bk-bd' + (cfg.borderKey === b.key ? ' on' : '')}
                  onClick={() => set({ borderKey: b.key })}>{b.name}</button>
              ))}
            </div>

            <div className="bk-sec">{t('bkSize')}</div>
            <div className="bk-borders">
              {BOOK_SIZES.map((s) => (
                <button key={s.key} className={'bk-bd' + (cfg.sizeKey === s.key ? ' on' : '')}
                  title={`${s.w} × ${s.h} mm`} onClick={() => set({ sizeKey: s.key })}>{s.name}</button>
              ))}
            </div>

            <div className="bk-sec">{t('bkInclude')}</div>
            <div className="bk-toggles">
              {exclusiveToggle('phoneFrame', 'twoColumns', t('bkPhoneFrame'))}
              {exclusiveToggle('twoColumns', 'phoneFrame', t('bkTwoCol'))}
              {toggle('serif', t('bkSerif'))}
              {toggle('showWallpaper', t('bkWallpaper'))}
              {toggle('showCover', t('bkCoverPage'))}
              {toggle('showTitlePage', t('bkTitlePage'))}
              {toggle('showAvatar', t('bkAvatar'))}
              {toggle('showStats', t('bkStats'))}
              {toggle('showChapters', t('bkChapters'))}
              {toggle('showPageNumbers', t('bkPageNumbers'))}
              {toggle('showClosing', t('bkClosing'))}
            </div>

            <div className="bk-sec">{t('bkTemplates')}</div>
            <div className="bk-tpl-save">
              <input value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder={t('bkTplNamePh')} maxLength={30}
                onKeyDown={(e) => { if (e.key === 'Enter') doSaveTpl(); }} />
              <button className="bk-tpl-savebtn" onClick={doSaveTpl}>{t('bkSaveTpl')}</button>
            </div>
            {tpls.length > 0 ? (
              <div className="bk-tpl-list">
                {tpls.map((tp) => (
                  <div key={tp.name} className="bk-tpl">
                    <span className="bk-tpl-dot" style={{ background: themeOf(tp.config.themeKey).coverBg }} />
                    <span className="bk-tpl-nm" title={t('bkApply')} onClick={() => applyTpl(tp)}>{tp.name}</span>
                    <button className="bk-tpl-del" title={t('hDelete')} onClick={() => delTpl(tp.name)}>🗑️</button>
                  </div>
                ))}
              </div>
            ) : <p className="bk-tpl-none">{t('bkNoTpl')}</p>}
          </div>
        </div>

        <div className="bk-actions">
          <button className="bk-cancel" disabled={p.exporting} onClick={p.onClose}>{t('bkClose')}</button>
          <button className="bk-export" disabled={p.exporting} onClick={() => p.onExport(cfg)}>
            {p.exporting ? <span className="btn-load"><span className="spinner btn" />{t('vActSaving')}</span> : `📖 ${t('bkExportPdf')}`}
          </button>
        </div>
      </div>
    </div>
  );
}
