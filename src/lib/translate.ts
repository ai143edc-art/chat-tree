/**
 * Translation helper with automatic provider selection.
 *
 * translateBatch() tries the server-side Gemini edge function first
 * (`supabase/functions/translate/`), which is fast, higher-quality and keeps
 * the API key private. If that function isn't deployed (or errors), it falls
 * back automatically to the free browser-side MyMemory provider — so the app
 * works out of the box, and simply gets better the moment you deploy the edge
 * function and set GEMINI_API_KEY. No code change needed to switch.
 */

import { sb } from './supabase';

export type Lang2 = 'en' | 'hi';
export type FromLang = Lang2 | 'auto';

/** Cheap script check: any Devanagari char ⇒ treat as Hindi, else English. */
export function detectLang(s: string): Lang2 {
  return /[ऀ-ॿ]/.test(s) ? 'hi' : 'en';
}

interface MMResp {
  responseData?: { translatedText?: string };
  responseStatus?: number | string;
}

/** Translate a single string. Returns the original text on empty / same-language. */
export async function translateText(text: string, from: FromLang, to: Lang2): Promise<string> {
  const q = text.trim();
  if (!q) return text;
  const src = from === 'auto' ? detectLang(q) : from;
  if (src === to) return text;

  const url = 'https://api.mymemory.translated.net/get?q='
    + encodeURIComponent(q) + '&langpair=' + encodeURIComponent(`${src}|${to}`);
  const r = await fetch(url);
  if (!r.ok) throw new Error('Translation service is unavailable right now.');
  const j = (await r.json()) as MMResp;
  const out = j.responseData?.translatedText || '';
  if (/MYMEMORY WARNING|QUOTA|LIMIT REACHED|too many/i.test(out)) {
    throw new Error('Daily free translation limit reached. Please try again later.');
  }
  return out || text;
}

/** Try the Gemini edge function for a chunk. Returns null if it isn't available
 *  or gives back an unusable shape, so the caller can fall back to MyMemory. */
async function translateViaEdge(texts: string[], to: Lang2): Promise<string[] | null> {
  try {
    const { data, error } = await sb.functions.invoke('translate', { body: { texts, to } });
    if (error) return null;
    const tr = (data as { translations?: unknown } | null)?.translations;
    if (Array.isArray(tr) && tr.length === texts.length && tr.every((x) => typeof x === 'string')) {
      return tr as string[];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Translate many strings in order. Same-language / empty strings pass through
 * untouched. Uses the edge function in chunks when available, otherwise the free
 * MyMemory provider (identical strings translated once). `onProgress` reports how
 * many have completed so the UI can show a live count.
 */
export async function translateBatch(
  items: string[],
  from: FromLang,
  to: Lang2,
  onProgress?: (done: number, total: number) => void,
): Promise<string[]> {
  const total = items.length;
  const out = new Array<string>(total);

  // Which items actually need translating (rest pass straight through).
  const need: number[] = [];
  for (let i = 0; i < total; i++) {
    const text = items[i];
    const src = from === 'auto' ? detectLang(text) : from;
    if (!text.trim() || src === to) out[i] = text;
    else need.push(i);
  }
  const passthrough = total - need.length;
  if (!need.length) { onProgress?.(total, total); return out; }

  // ---- Preferred path: server-side Gemini edge function, in chunks. ----
  const CHUNK = 80;
  let edgeOk = true;
  let done = passthrough;
  for (let c = 0; c < need.length && edgeOk; c += CHUNK) {
    const idxs = need.slice(c, c + CHUNK);
    const tr = await translateViaEdge(idxs.map((i) => items[i]), to);
    if (!tr) { edgeOk = false; break; }
    idxs.forEach((gi, k) => { out[gi] = tr[k] ?? items[gi]; });
    done += idxs.length;
    onProgress?.(done, total);
  }
  if (edgeOk) return out;

  // ---- Fallback: MyMemory, one string at a time, with caching. ----
  const cache = new Map<string, string>();
  done = passthrough;
  for (const i of need) {
    const text = items[i];
    const src = from === 'auto' ? detectLang(text) : from;
    out[i] = cache.get(text) ?? await (async () => {
      const tr = await translateText(text, src, to);
      cache.set(text, tr);
      return tr;
    })();
    done++;
    onProgress?.(done, total);
  }
  return out;
}
