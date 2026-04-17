// Vercel cron — runs every Sunday at 9am PT (4pm UTC).
// Hits /sloan/synthesize on the Railway proxy to distill the week's
// memory entries into permanent character growth.

const PROXY = 'https://mirage-proxy-production.up.railway.app';
const INTERNAL_KEY = process.env.MIRAGE_INTERNAL_KEY || '';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ error: 'GET or POST only' });

  try {
    console.log('[sloan-synthesize] triggering weekly synthesis');
    const r = await fetch(PROXY + '/sloan/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-mirage-key': INTERNAL_KEY },
    });
    if (!r.ok) {
      const err = await r.text();
      console.error('[sloan-synthesize] proxy error:', r.status, err);
      return res.status(r.status).json({ error: err });
    }
    const result = await r.json();
    console.log('[sloan-synthesize] complete — learnings:', (result.synthesis && result.synthesis.learnings || []).length, 'from', result.entries, 'entries');
    res.json(result);
  } catch (e) {
    console.error('[sloan-synthesize] error:', e.message);
    res.status(500).json({ error: e.message });
  }
}
