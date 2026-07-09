import { useLang } from '../lib/i18n';
import LangToggle from './LangToggle';

const BRAND = 'Chat Tree';

export default function Landing({ onLaunch, onPrivacy, onTerms }: { onLaunch: () => void; onPrivacy: () => void; onTerms: () => void }) {
  const { t } = useLang();
  const keyActivate = (fn: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); }
  };

  const FEATURES = [
    { icon: '✍️', title: t('f1t'), desc: t('f1d') },
    { icon: '🖼️', title: t('f2t'), desc: t('f2d') },
    { icon: '💬', title: t('f3t'), desc: t('f3d') },
    { icon: '📞', title: t('f4t'), desc: t('f4d') },
    { icon: '✓✓', title: t('f5t'), desc: t('f5d') },
    { icon: '📱', title: t('f6t'), desc: t('f6d') },
    { icon: '⬇️', title: t('f7t'), desc: t('f7d') },
    { icon: '🔒', title: t('f8t'), desc: t('f8d') },
  ];
  const STEPS = [
    { n: '1', title: t('s1t'), desc: t('s1d') },
    { n: '2', title: t('s2t'), desc: t('s2d') },
    { n: '3', title: t('s3t'), desc: t('s3d') },
  ];
  const USES = [t('use1'), t('use2'), t('use3'), t('use4'), t('use5'), t('use6')];
  const FAQ = [
    { q: t('q1'), a: t('a1') }, { q: t('q2'), a: t('a2') },
    { q: t('q3'), a: t('a3') }, { q: t('q4'), a: t('a4') },
  ];

  return (
    <div className="lp">
      <header className="lp-nav">
        <span className="lp-logo">💬 {BRAND}</span>
        <span className="lp-nav-right">
          <LangToggle />
          <button className="lp-cta sm" onClick={onLaunch}>{t('navOpen')}</button>
        </span>
      </header>

      <section className="lp-hero">
        <div className="lp-hero-txt">
          <span className="lp-badge">{t('badge')}</span>
          <h1>{t('heroTitle')}</h1>
          <p className="lp-sub">{t('heroSub')}</p>
          <div className="lp-actions">
            <button className="lp-cta" onClick={onLaunch}>{t('ctaCreate')}</button>
            <button className="lp-cta ghost" onClick={onLaunch}>{t('ctaUpload')}</button>
          </div>
          <div className="lp-trust">{t('trust')}</div>
        </div>
        <div className="lp-hero-art">
          <div className="lp-phone">
            <div className="lp-ph-head"><span className="lp-ph-ava" />Priya <span className="lp-ph-st">online</span></div>
            <div className="lp-ph-body">
              <div className="lp-b in">Happy birthday! 🎉</div>
              <div className="lp-b out">Aww thank you! 😄</div>
              <div className="lp-b in">Party tonight? 🥳</div>
              <div className="lp-b out">Definitely 🔥 <span className="lp-tk">✓✓</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-sec">
        <h2>{t('featuresTitle')}</h2>
        <div className="lp-grid">
          {FEATURES.map((f) => (
            <div className="lp-card" key={f.title}>
              <span className="lp-ic">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-sec lp-steps-sec">
        <h2>{t('stepsTitle')}</h2>
        <div className="lp-steps">
          {STEPS.map((s) => (
            <div className="lp-step" key={s.n}>
              <span className="lp-step-n">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-sec">
        <h2>{t('usesTitle')}</h2>
        <div className="lp-uses">
          {USES.map((u) => <span className="lp-use" key={u}>{u}</span>)}
        </div>
      </section>

      <section className="lp-sec">
        <h2>{t('faqTitle')}</h2>
        <div className="lp-faq">
          {FAQ.map((f) => (
            <details className="lp-q" key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="lp-final">
        <h2>{t('finalTitle')}</h2>
        <button className="lp-cta" onClick={onLaunch}>{t('finalCta')}</button>
      </section>

      <footer className="lp-foot">
        <div>💬 {BRAND}</div>
        <p className="lp-disc">{t('footerDisc')}</p>
        <div className="lp-copy">
          © {new Date().getFullYear()} {BRAND}
          <span className="lp-sep"> · </span>
          <a className="lp-link" role="button" tabIndex={0} onClick={onPrivacy} onKeyDown={keyActivate(onPrivacy)}>{t('privacyLink')}</a>
          <span className="lp-sep"> · </span>
          <a className="lp-link" role="button" tabIndex={0} onClick={onTerms} onKeyDown={keyActivate(onTerms)}>{t('termsLink')}</a>
        </div>
      </footer>
    </div>
  );
}
