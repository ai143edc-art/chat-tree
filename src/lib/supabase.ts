import { createClient } from '@supabase/supabase-js';
import type { Session } from '@supabase/supabase-js';

// The anon key is public by design — all access is enforced by Row Level
// Security, so it is safe to ship in the client. Env vars take precedence when
// set (to point at another project or rotate the key); otherwise we fall back
// to the known public project so the site never white-screens if the hosting
// environment hasn't been configured with the vars.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
  || 'https://avzpmcriwzwznvqwixgb.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2enBtY3Jpd3p3em52cXdpeGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwMDY1OTUsImV4cCI6MjA5ODU4MjU5NX0.eIJiDlJK6K6hkIJf36vE4kyLvhIdQM_F4udBSI9HUks';

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export interface ChatRow {
  id: string;
  user_id?: string;
  title?: string;
  contact_title?: string;
  me_name?: string | null;
  model?: string;
  theme?: string;
  chat_text?: string;
  media_map?: Record<string, string>;
  msg_count?: number;
  media_count?: number;
  avatar?: string | null;
  share_token?: string | null;
  shared_media?: Record<string, string>;
  category?: string | null;
  created_at?: string;
}
export interface SaveMeta {
  contactTitle: string; meName: string | null; model: string; theme: string; rawText: string;
  msgCount: number; mediaCount: number; avatar: string | null; category?: string | null;
}

export function uuidv4(): string {
  const c = window.crypto as Crypto | undefined;
  if (c && 'randomUUID' in c) { try { return c.randomUUID(); } catch { /* fall through */ } }
  const b = new Uint8Array(16);
  if (c && c.getRandomValues) c.getRandomValues(b);
  else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map(x => x.toString(16).padStart(2, '0'));
  return `${h[0]}${h[1]}${h[2]}${h[3]}-${h[4]}${h[5]}-${h[6]}${h[7]}-${h[8]}${h[9]}-${h[10]}${h[11]}${h[12]}${h[13]}${h[14]}${h[15]}`;
}

/* ---------------- Auth ---------------- */
export function signUp(email: string, password: string, captchaToken?: string) {
  return sb.auth.signUp({ email, password, options: captchaToken ? { captchaToken } : undefined });
}
export function signIn(email: string, password: string, captchaToken?: string) {
  return sb.auth.signInWithPassword({ email, password, options: captchaToken ? { captchaToken } : undefined });
}
export function signInWithGoogle() {
  return sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: location.origin },
  });
}
export function signOut() { return sb.auth.signOut(); }
/** Send a password-reset email. The link returns the user to the app with a
 *  recovery session, which onPasswordRecovery() below picks up. */
export async function resetPassword(email: string, captchaToken?: string): Promise<void> {
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: location.origin,
    ...(captchaToken ? { captchaToken } : {}),
  });
  if (error) throw error;
}
export async function changePassword(newPassword: string): Promise<void> {
  const { error } = await sb.auth.updateUser({ password: newPassword });
  if (error) throw error;
}
/** Fires when the user arrives via a password-reset link, so the UI can prompt
 *  for a new password. Returns an unsubscribe function. */
export function onPasswordRecovery(cb: () => void): () => void {
  const { data: { subscription } } = sb.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') cb();
  });
  return () => subscription.unsubscribe();
}
export async function deleteAccount(): Promise<void> {
  const { data: { user } } = await sb.auth.getUser();
  if (user) {
    const { data: folders } = await sb.storage.from('user-media').list(user.id);
    for (const folder of folders || []) {
      const { data: files } = await sb.storage.from('user-media').list(`${user.id}/${folder.name}`);
      if (files && files.length) {
        await sb.storage.from('user-media').remove(files.map((f) => `${user.id}/${folder.name}/${f.name}`));
      }
    }
  }
  const { error } = await sb.rpc('delete_own_account');
  if (error) throw error;
  await sb.auth.signOut();
}
export function onAuthChange(cb: (session: Session | null) => void): () => void {
  sb.auth.getSession().then(({ data }) => cb(data.session));
  const { data: { subscription } } = sb.auth.onAuthStateChange((_e, session) => cb(session));
  return () => subscription.unsubscribe();
}

/* ---------------- Per-user chats ---------------- */
export async function saveChat(
  meta: SaveMeta,
  mediaBlobs: Record<string, Blob>,
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error('Please log in first.');
  const id = uuidv4();
  const files = Object.keys(mediaBlobs);
  const cloudMap: Record<string, string> = {};
  for (let i = 0; i < files.length; i++) {
    const fname = files[i], blob = mediaBlobs[fname];
    onProgress?.(i + 1, files.length);
    const safe = fname.replace(/[^a-z0-9._-]+/gi, '_');
    const path = `${user.id}/${id}/${safe}`;
    const up = await sb.storage.from('user-media').upload(path, blob, { upsert: true, contentType: blob.type || undefined });
    if (up.error) { console.warn('media upload failed:', fname, up.error); continue; }
    cloudMap[fname] = path;   // store the storage PATH (private bucket → sign on load)
  }
  const row: ChatRow = {
    id, user_id: user.id, title: meta.contactTitle, contact_title: meta.contactTitle,
    me_name: meta.meName, model: meta.model, theme: meta.theme, chat_text: meta.rawText, media_map: cloudMap,
    msg_count: meta.msgCount, media_count: meta.mediaCount, avatar: meta.avatar,
    category: meta.category ?? null,
  };
  const { error } = await sb.from('user_chats').insert(row);
  if (error) throw error;
}

export async function listChats(): Promise<ChatRow[]> {
  const { data, error } = await sb.from('user_chats')
    .select('id,title,contact_title,created_at,msg_count,media_count,category')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as ChatRow[];
}
export async function getChat(id: string): Promise<ChatRow | null> {
  const { data, error } = await sb.from('user_chats').select('*').eq('id', id).single();
  if (error) throw error;
  const row = data as ChatRow;
  row.media_map = await signMediaMap(row.media_map || {});
  return row;
}

/** Turn stored storage-paths into short-lived signed URLs (private bucket). */
async function signMediaMap(map: Record<string, string>): Promise<Record<string, string>> {
  const entries = Object.entries(map);
  if (!entries.length) return {};
  const out: Record<string, string> = {};
  const toSign: { fname: string; path: string }[] = [];
  for (const [fname, val] of entries) {
    if (/^https?:\/\//i.test(val)) out[fname] = val;      // legacy public URL — keep as-is
    else toSign.push({ fname, path: val });
  }
  if (toSign.length) {
    const { data, error } = await sb.storage.from('user-media')
      .createSignedUrls(toSign.map((t) => t.path), 3600);  // valid 1 hour
    if (error) throw error;
    (data || []).forEach((d, i) => {
      if (d.signedUrl && !d.error) out[toSign[i].fname] = d.signedUrl;
    });
  }
  return out;
}
export async function renameChat(id: string, title: string): Promise<void> {
  const { error } = await sb.from('user_chats').update({ title, contact_title: title }).eq('id', id);
  if (error) throw error;
}
export async function updateCategory(id: string, category: string | null): Promise<void> {
  const { error } = await sb.from('user_chats').update({ category }).eq('id', id);
  if (error) throw error;
}
/** Make a chat shareable: mint long-lived signed URLs for its media + a token. Returns the share URL. */
export async function shareChat(id: string): Promise<string> {
  const { data, error } = await sb.from('user_chats').select('media_map, share_token').eq('id', id).single();
  if (error) throw error;
  const row = data as ChatRow;
  const map = row.media_map || {};
  const sharedMedia: Record<string, string> = {};
  const toSign: { fname: string; path: string }[] = [];
  for (const [fname, val] of Object.entries(map)) {
    if (/^https?:\/\//i.test(val)) sharedMedia[fname] = val;
    else toSign.push({ fname, path: val });
  }
  if (toSign.length) {
    const YEAR = 60 * 60 * 24 * 365;
    const { data: signed, error: e2 } = await sb.storage.from('user-media')
      .createSignedUrls(toSign.map((t) => t.path), YEAR);
    if (e2) throw e2;
    (signed || []).forEach((s, i) => { if (s.signedUrl && !s.error) sharedMedia[toSign[i].fname] = s.signedUrl; });
  }
  const token = row.share_token || uuidv4();
  const { error: e3 } = await sb.from('user_chats').update({ share_token: token, shared_media: sharedMedia }).eq('id', id);
  if (e3) throw e3;
  return `${location.origin}/?c=${token}`;
}
export async function unshareChat(id: string): Promise<void> {
  const { error } = await sb.from('user_chats').update({ share_token: null, shared_media: null }).eq('id', id);
  if (error) throw error;
}
export async function getSharedChat(token: string): Promise<ChatRow | null> {
  const { data, error } = await sb.rpc('get_shared_chat', { token });
  if (error) throw error;
  const arr = (data || []) as ChatRow[];
  if (!arr.length) return null;
  const r = arr[0];
  return { ...r, media_map: r.shared_media || {} };
}

export async function deleteChat(id: string): Promise<void> {
  const { data: { user } } = await sb.auth.getUser();
  if (user) {
    const folder = `${user.id}/${id}`;
    const { data: files } = await sb.storage.from('user-media').list(folder);
    if (files && files.length) {
      await sb.storage.from('user-media').remove(files.map((f) => `${folder}/${f.name}`));
    }
  }
  const { error } = await sb.from('user_chats').delete().eq('id', id);
  if (error) throw error;
}
