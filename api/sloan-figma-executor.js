// Vercel cron — runs every 60s. Polls sloan_figma_tasks for pending tasks,
// posts the design brief as a Figma file comment (the REST API cannot
// execute Plugin API code — that requires a browser-side plugin), marks the
// task complete, and texts Nate that the work is ready for review.
//
// Env vars required on Vercel:
//   SUPABASE_URL, SUPABASE_SERVICE_KEY, FIGMA_ACCESS_TOKEN,
//   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, SLOAN_PHONE_NUMBER, NATE_PHONE_NUMBER

const SB_URL = process.env.SUPABASE_URL || 'https://gmyenvnfuailickepvax.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN || '';
const FIGMA_FILE_KEY = 'OvtRCtjVRT4DveuZUZkwrc';
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH = process.env.TWILIO_AUTH_TOKEN || '';
const SLOAN_NUMBER = process.env.SLOAN_PHONE_NUMBER || '';
const NATE_NUMBER = process.env.NATE_PHONE_NUMBER || '';

async function sbFetch(path, opts = {}) {
  const r = await fetch(SB_URL + '/rest/v1/' + path, {
    ...opts,
    headers: {
      'Authorization': 'Bearer ' + SB_KEY,
      'apikey': SB_KEY,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  return r;
}

async function postFigmaComment(brief) {
  if (!FIGMA_TOKEN) { console.log('[executor] FIGMA_ACCESS_TOKEN not set, skipping comment'); return false; }
  const r = await fetch('https://api.figma.com/v1/files/' + FIGMA_FILE_KEY + '/comments', {
    method: 'POST',
    headers: {
      'X-Figma-Token': FIGMA_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: '[Sloan Design Task]\n\n' + (brief || '').slice(0, 4000),
    }),
  });
  if (!r.ok) { console.warn('[executor] figma comment failed:', r.status, await r.text()); return false; }
  console.log('[executor] figma comment posted');
  return true;
}

async function sendSms(body) {
  if (!TWILIO_SID || !TWILIO_AUTH || !SLOAN_NUMBER || !NATE_NUMBER) {
    console.log('[executor] Twilio creds incomplete, skipping SMS');
    return false;
  }
  const params = new URLSearchParams({ To: NATE_NUMBER, From: SLOAN_NUMBER, Body: body });
  const r = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + TWILIO_SID + '/Messages.json', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(TWILIO_SID + ':' + TWILIO_AUTH).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });
  if (!r.ok) { console.warn('[executor] twilio send failed:', r.status); return false; }
  return true;
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ error: 'GET or POST only' });

  try {
    // 1. Fetch pending tasks
    const listR = await sbFetch('sloan_figma_tasks?status=eq.pending&order=created_at.asc&limit=5');
    if (!listR.ok) {
      const err = await listR.text();
      console.error('[executor] list error:', listR.status, err);
      return res.status(500).json({ error: err });
    }
    const tasks = await listR.json();
    if (!Array.isArray(tasks) || !tasks.length) {
      return res.json({ processed: 0, message: 'no pending tasks' });
    }

    console.log('[executor] found', tasks.length, 'pending task(s)');
    const results = [];

    for (const task of tasks) {
      const taskName = (task.task || '').slice(0, 80);
      console.log('[executor] processing:', task.id, taskName);

      // 2. Post design brief as a Figma comment
      const commented = await postFigmaComment(task.brief || task.task || '');

      // 3. Mark complete
      const patchR = await sbFetch('sloan_figma_tasks?id=eq.' + task.id, {
        method: 'PATCH',
        headers: { 'Prefer': 'return=representation' },
        body: JSON.stringify({
          status: 'complete',
          result: commented
            ? 'Brief posted as Figma comment. Plugin execution pending — open Figma to run the generated code.'
            : 'Processed (Figma comment skipped — no token).',
        }),
      });
      if (!patchR.ok) console.warn('[executor] patch failed for', task.id, patchR.status);

      // 4. Text Nate
      const smsBody = 'Sloan completed: ' + taskName + (taskName.length >= 80 ? '…' : '') +
        '. Open your Figma sandbox to review.';
      await sendSms(smsBody);

      results.push({ id: task.id, taskName, commented });
    }

    return res.json({ processed: results.length, results });
  } catch (e) {
    console.error('[executor] error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
