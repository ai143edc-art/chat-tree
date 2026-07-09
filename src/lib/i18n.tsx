import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export type Lang = 'en' | 'hi';

/* Every user-facing string keyed once, with an English and a Hindi variant.
   Add a key here and it's instantly available via t('key') anywhere. */
const DICT = {
  en: {
    langName: 'English',
    // ---- Landing ----
    badge: 'Free · No sign-up to try',
    navOpen: 'Open app',
    heroTitle: 'WhatsApp-style chat generator & viewer',
    heroSub: 'Create realistic chat screenshots in seconds, or upload your exported chat and relive it — with media, replies, reactions, call logs, ticks and more.',
    ctaCreate: '🚀 Create your chat',
    ctaUpload: 'Upload a chat',
    trust: '✅ Works in browser · 🔒 Private · 📱 Any device',
    featuresTitle: 'Everything you need to build the perfect chat',
    f1t: 'Full chat editor', f1d: 'Add messages from either side, edit or delete any text, and build a whole conversation in seconds.',
    f2t: 'Photos, videos & docs', f2d: 'Drop in images, videos, voice notes and documents — they render exactly like the real app.',
    f3t: 'Replies & reactions', f3d: 'Quote messages, add emoji reactions, forwarded tags and “deleted” placeholders.',
    f4t: 'Call logs & system msgs', f4d: 'Insert missed calls, voice/video calls and encryption notices for a truly authentic look.',
    f5t: 'Ticks, time & status', f5d: 'Set sent / delivered / read ticks, edit timestamps, and customise the online / typing status.',
    f6t: 'Any phone frame', f6d: 'Preview on 29+ device sizes with a realistic status bar, in light or dark theme.',
    f7t: 'Export image / PDF / book', f7d: 'Download a screenshot, a PDF, or a beautiful keepsake book of your whole chat.',
    f8t: 'Private & secure', f8d: 'Everything runs in your browser. Saved chats stay behind your login with private media links.',
    stepsTitle: 'How it works',
    s1t: 'Open the tool', s1d: 'Start blank, or upload an exported WhatsApp chat (.zip or _chat.txt) to relive it.',
    s2t: 'Craft your chat', s2d: 'Turn on Edit mode to add messages, media, replies, reactions and call logs — from both sides.',
    s3t: 'Export & share', s3d: 'Pick a phone & theme, then download it as an image, PDF or book, or save it to your private history.',
    usesTitle: 'Perfect for',
    use1: 'Memes & social content', use2: 'YouTube thumbnails', use3: 'Prank chats',
    use4: 'App UI mockups', use5: 'Tutorials & demos', use6: 'Reliving old conversations',
    faqTitle: 'Frequently asked questions',
    q1: 'Is it free?', a1: 'Yes — you can create and view chats for free, right in your browser. No download needed, and no sign-up to try it.',
    q2: 'Can I make a fake chat?', a2: 'Absolutely. Turn on Edit mode to add messages from either side, insert photos, replies, reactions, call logs and system messages, then export it as an image or PDF.',
    q3: 'Is my data private?', a3: 'Viewing and editing happen entirely in your browser. Chats you save are kept privately behind your login and media is served through short-lived signed links.',
    q4: 'Is this affiliated with WhatsApp?', a4: 'No. Chat Tree is an independent tool, not affiliated with, endorsed by, or connected to WhatsApp or Meta.',
    finalTitle: 'Ready to craft your chat?',
    finalCta: "🚀 Get started — it's free",
    footerDisc: 'Chat Tree is an independent tool and is not affiliated with, endorsed by, or connected to WhatsApp or Meta. “WhatsApp” is a trademark of Meta Platforms, Inc. Please use responsibly — do not create content to deceive or harm others.',
    privacyLink: 'Privacy Policy',
    // ---- Auth ----
    welcomeBack: 'Welcome back', createAccount: 'Create your account',
    signInSub: 'Log in to open your saved chats.', signUpSub: 'Sign up to save your chats to a private history.',
    emailPh: 'Email address',
    logIn: 'Log in', signUp: 'Sign up', pleaseWait: 'Please wait…',
    orText: 'or', continueGoogle: 'Continue with Google',
    haveAccount: 'Already have an account?', newHere: 'New here?',
    logInLink: 'Log in', createLink: 'Create an account',
    privateNote: '🔒 Your chats are private — only you can see them after logging in.',
    errBoth: 'Enter your email and password.',
    errCaptcha: 'Please complete the CAPTCHA.',
    okLoggedIn: '✅ Logged in', okCreated: '✅ Account created',
    okCreatedConfirm: '✅ Account created! Check your email to confirm, then log in.',
    forgotLink: 'Forgot password?',
    resetTitle: 'Reset your password', resetSub: "Enter your email and we'll send you a reset link.",
    sendReset: 'Send reset link', backToLogin: '← Back to log in',
    resetSent: '✅ Reset link sent! Check your email (and spam folder).',
    setNewTitle: 'Set a new password', setNewSub: 'Choose a new password for your account.',
    updatePw: 'Update password', pwUpdated: '✅ Password updated — you are now logged in.',
    termsLink: 'Terms of Use',
  },
  hi: {
    langName: 'हिन्दी',
    // ---- Landing ----
    badge: 'मुफ़्त · बिना साइन-अप आज़माएँ',
    navOpen: 'ऐप खोलें',
    heroTitle: 'WhatsApp जैसी चैट बनाएँ और देखें',
    heroSub: 'कुछ ही सेकंड में असली जैसी चैट स्क्रीनशॉट बनाएँ, या अपनी एक्सपोर्ट की हुई चैट अपलोड करके उसे फिर से जिएँ — मीडिया, रिप्लाई, रिएक्शन, कॉल लॉग, टिक और बहुत कुछ के साथ।',
    ctaCreate: '🚀 अपनी चैट बनाएँ',
    ctaUpload: 'चैट अपलोड करें',
    trust: '✅ ब्राउज़र में चले · 🔒 निजी · 📱 हर डिवाइस पर',
    featuresTitle: 'परफ़ेक्ट चैट बनाने के लिए सब कुछ',
    f1t: 'पूरा चैट एडिटर', f1d: 'दोनों तरफ़ से मैसेज जोड़ें, किसी भी टेक्स्ट को बदलें या हटाएँ, और सेकंडों में पूरी बातचीत बनाएँ।',
    f2t: 'फ़ोटो, वीडियो और डॉक्युमेंट', f2d: 'इमेज, वीडियो, वॉइस नोट और डॉक्युमेंट डालें — बिल्कुल असली ऐप जैसे दिखेंगे।',
    f3t: 'रिप्लाई और रिएक्शन', f3d: 'मैसेज को कोट करें, इमोजी रिएक्शन, फ़ॉरवर्ड टैग और “डिलीटेड” प्लेसहोल्डर जोड़ें।',
    f4t: 'कॉल लॉग और सिस्टम मैसेज', f4d: 'मिस्ड कॉल, वॉइस/वीडियो कॉल और एन्क्रिप्शन नोटिस डालें — एकदम असली लुक के लिए।',
    f5t: 'टिक, समय और स्टेटस', f5d: 'सेंट/डिलीवर्ड/रीड टिक सेट करें, समय बदलें, और ऑनलाइन/टाइपिंग स्टेटस कस्टमाइज़ करें।',
    f6t: 'कोई भी फ़ोन फ़्रेम', f6d: '29+ डिवाइस साइज़ पर असली स्टेटस बार के साथ प्रीव्यू करें, लाइट या डार्क थीम में।',
    f7t: 'इमेज / PDF / बुक एक्सपोर्ट', f7d: 'स्क्रीनशॉट, PDF, या अपनी पूरी चैट की एक सुंदर यादगार किताब डाउनलोड करें।',
    f8t: 'निजी और सुरक्षित', f8d: 'सब कुछ आपके ब्राउज़र में चलता है। सेव की गई चैट आपके लॉगिन के पीछे निजी मीडिया लिंक के साथ रहती हैं।',
    stepsTitle: 'कैसे काम करता है',
    s1t: 'टूल खोलें', s1d: 'खाली शुरू करें, या एक्सपोर्ट की हुई WhatsApp चैट (.zip या _chat.txt) अपलोड करके उसे फिर से जिएँ।',
    s2t: 'अपनी चैट बनाएँ', s2d: 'एडिट मोड ऑन करके दोनों तरफ़ से मैसेज, मीडिया, रिप्लाई, रिएक्शन और कॉल लॉग जोड़ें।',
    s3t: 'एक्सपोर्ट और शेयर', s3d: 'फ़ोन और थीम चुनें, फिर इमेज, PDF या बुक के रूप में डाउनलोड करें, या अपनी निजी हिस्ट्री में सेव करें।',
    usesTitle: 'इनके लिए बढ़िया',
    use1: 'मीम्स और सोशल कंटेंट', use2: 'YouTube थंबनेल', use3: 'प्रैंक चैट',
    use4: 'ऐप UI मॉकअप', use5: 'ट्यूटोरियल और डेमो', use6: 'पुरानी बातचीत फिर से जीना',
    faqTitle: 'अक्सर पूछे जाने वाले सवाल',
    q1: 'क्या यह मुफ़्त है?', a1: 'हाँ — आप ब्राउज़र में ही मुफ़्त चैट बना और देख सकते हैं। कोई डाउनलोड नहीं, और आज़माने के लिए साइन-अप भी नहीं।',
    q2: 'क्या मैं फ़ेक चैट बना सकता हूँ?', a2: 'बिल्कुल। एडिट मोड ऑन करके दोनों तरफ़ से मैसेज जोड़ें, फ़ोटो, रिप्लाई, रिएक्शन, कॉल लॉग और सिस्टम मैसेज डालें, फिर इमेज या PDF के रूप में एक्सपोर्ट करें।',
    q3: 'क्या मेरा डेटा निजी है?', a3: 'देखना और एडिट करना पूरी तरह आपके ब्राउज़र में होता है। सेव की गई चैट आपके लॉगिन के पीछे निजी रहती हैं और मीडिया छोटी-अवधि के साइन्ड लिंक से दिखता है।',
    q4: 'क्या यह WhatsApp से जुड़ा है?', a4: 'नहीं। Chat Tree एक स्वतंत्र टूल है, WhatsApp या Meta से न जुड़ा है, न इनके द्वारा समर्थित है।',
    finalTitle: 'अपनी चैट बनाने के लिए तैयार?',
    finalCta: '🚀 शुरू करें — बिल्कुल मुफ़्त',
    footerDisc: 'Chat Tree एक स्वतंत्र टूल है और WhatsApp या Meta से न जुड़ा है, न इनके द्वारा समर्थित है। “WhatsApp” Meta Platforms, Inc. का ट्रेडमार्क है। कृपया ज़िम्मेदारी से इस्तेमाल करें — किसी को धोखा देने या नुकसान पहुँचाने वाला कंटेंट न बनाएँ।',
    privacyLink: 'प्राइवेसी पॉलिसी',
    // ---- Auth ----
    welcomeBack: 'वापसी पर स्वागत है', createAccount: 'अपना अकाउंट बनाएँ',
    signInSub: 'अपनी सेव की गई चैट खोलने के लिए लॉग इन करें।', signUpSub: 'अपनी चैट निजी हिस्ट्री में सेव करने के लिए साइन अप करें।',
    emailPh: 'ईमेल पता',
    logIn: 'लॉग इन', signUp: 'साइन अप', pleaseWait: 'कृपया प्रतीक्षा करें…',
    orText: 'या', continueGoogle: 'Google से जारी रखें',
    haveAccount: 'पहले से अकाउंट है?', newHere: 'नए हैं?',
    logInLink: 'लॉग इन करें', createLink: 'अकाउंट बनाएँ',
    privateNote: '🔒 आपकी चैट निजी हैं — लॉग इन के बाद सिर्फ़ आप ही इन्हें देख सकते हैं।',
    errBoth: 'अपना ईमेल और पासवर्ड डालें।',
    errCaptcha: 'कृपया CAPTCHA पूरा करें।',
    okLoggedIn: '✅ लॉग इन हो गए', okCreated: '✅ अकाउंट बन गया',
    okCreatedConfirm: '✅ अकाउंट बन गया! पुष्टि के लिए अपना ईमेल देखें, फिर लॉग इन करें।',
    forgotLink: 'पासवर्ड भूल गए?',
    resetTitle: 'पासवर्ड रीसेट करें', resetSub: 'अपना ईमेल डालें, हम आपको रीसेट लिंक भेज देंगे।',
    sendReset: 'रीसेट लिंक भेजें', backToLogin: '← लॉग इन पर वापस',
    resetSent: '✅ रीसेट लिंक भेज दिया! अपना ईमेल देखें (स्पैम फ़ोल्डर भी)।',
    setNewTitle: 'नया पासवर्ड सेट करें', setNewSub: 'अपने अकाउंट के लिए नया पासवर्ड चुनें।',
    updatePw: 'पासवर्ड अपडेट करें', pwUpdated: '✅ पासवर्ड अपडेट हो गया — अब आप लॉग इन हैं।',
    termsLink: 'उपयोग की शर्तें',
  },
} as const;

export type TKey = keyof typeof DICT['en'];

interface LangValue { lang: Lang; setLang: (l: Lang) => void; t: (key: TKey) => string }
const LangCtx = createContext<LangValue>({ lang: 'en', setLang: () => {}, t: (k) => DICT.en[k] });

function initialLang(): Lang {
  const saved = (typeof localStorage !== 'undefined' && localStorage.getItem('lang')) as Lang | null;
  if (saved === 'en' || saved === 'hi') return saved;
  return typeof navigator !== 'undefined' && navigator.language?.startsWith('hi') ? 'hi' : 'en';
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const setLang = useCallback((l: Lang) => {
    try { localStorage.setItem('lang', l); } catch { /* ignore */ }
    document.documentElement.lang = l;
    setLangState(l);
  }, []);
  const t = useCallback((key: TKey) => DICT[lang][key] ?? DICT.en[key] ?? String(key), [lang]);
  return <LangCtx.Provider value={{ lang, setLang, t }}>{children}</LangCtx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLang() { return useContext(LangCtx); }
