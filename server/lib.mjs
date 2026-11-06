// Gemeinsame Bausteine für die Jarvis-Server-Skripte (Claude, Push, Gmail nur lesen).
export const env = process.env;

/* ---------- Claude ---------- */
export async function claude({ prompt, maxSearches = 0, model = env.MODEL || 'claude-sonnet-5-5', maxTokens = 3000 }) {
  const messages = [{ role: 'user', content: prompt }];
  const tools = maxSearches ? [{ type: 'web_search_20250305', name: 'web_search', max_uses: maxSearches }] : undefined;
  for (let i = 0; i < 5; i++) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model, max_tokens: maxTokens, tools, messages }),
    });
    const j = await r.json();
    if (!r.ok) {
      if (tools && /web_search/i.test(j.error?.message || '')) return claude({ prompt, model, maxTokens });
      throw new Error('Claude-Fehler: ' + (j.error?.message || r.status));
    }
    if (j.stop_reason === 'pause_turn') { messages.push({ role: 'assistant', content: j.content }); continue; }
    return j.content.filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
  }
  throw new Error('Claude hat nicht fertig geantwortet');
}

/* ---------- Push (Ende-zu-Ende verschlüsselt durch Web Push) ---------- */
function fitBytes(text, max) {
  const enc = new TextEncoder();
  if (enc.encode(text).length <= max) return text;
  while (enc.encode(text + ' …').length > max) text = text.slice(0, -50);
  return text + ' …';
}
export async function sendPush(payload) {
  if (!env.PUSH_SUBSCRIPTION) { console.log('Kein PUSH_SUBSCRIPTION – Push übersprungen.'); return; }
  const { default: webpush } = await import('web-push');
  webpush.setVapidDetails(env.VAPID_SUBJECT || 'mailto:jarvis@localhost', env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
  payload.text = fitBytes(payload.text, 3300); // Push-Nachrichten dürfen max. ~4 KB groß sein
  payload.zeit ||= new Date().toISOString();
  await webpush.sendNotification(JSON.parse(env.PUSH_SUBSCRIPTION), JSON.stringify(payload), { TTL: 12 * 3600 });
  console.log('Push gesendet ✓');
}

/* ---------- Gmail (Bereich gmail.readonly – kann nichts senden oder löschen) ---------- */
export const gmailConfigured = () => Boolean(env.GMAIL_CLIENT_ID && env.GMAIL_CLIENT_SECRET && env.GMAIL_REFRESH_TOKEN);
let access = null;
async function gmailToken() {
  if (access) return access;
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env.GMAIL_CLIENT_ID, client_secret: env.GMAIL_CLIENT_SECRET, refresh_token: env.GMAIL_REFRESH_TOKEN, grant_type: 'refresh_token' }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error('Google-Anmeldung fehlgeschlagen: ' + (j.error_description || j.error));
  return (access = j.access_token);
}
async function gmail(path) {
  const r = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/' + path, { headers: { authorization: 'Bearer ' + await gmailToken() } });
  if (!r.ok) throw new Error('Gmail-Fehler ' + r.status);
  return r.json();
}
export async function searchMails(q, max = 15) {
  const l = await gmail(`messages?q=${encodeURIComponent(q)}&maxResults=${max}`);
  if (!l.messages) return [];
  return Promise.all(l.messages.map(async (m) => {
    const d = await gmail(`messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`);
    const h = (n) => d.payload.headers.find((x) => x.name.toLowerCase() === n.toLowerCase())?.value || '';
    return { id: m.id, von: h('From'), betreff: h('Subject'), vorschau: d.snippet, gmail_wichtig: d.labelIds?.includes('IMPORTANT') };
  }));
}
export const MAIL_QUERY = '-category:promotions -category:social -category:forums';
