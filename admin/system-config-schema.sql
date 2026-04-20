-- system_config
-- Canonical source for the Admin → Tech Reference pane. One row per
-- reference item (URL, repo, credential, route, system-state fact).
-- Edits happen inline in the admin UI via the Supabase REST API using
-- the publishable anon key; client-side admin auth gates the edit UI,
-- the table itself accepts anon read + update since the anon key is
-- public per Supabase design.
--
-- Run this file once against the Mirage project's SQL editor. Idempotent
-- on re-run via IF NOT EXISTS guards and ON CONFLICT upserts.

create table if not exists public.system_config (
  id uuid primary key default gen_random_uuid(),
  section text not null,
  label text not null,
  value text,
  note text,
  status text default 'active',
  url text,
  method text,
  is_code boolean default false,
  sort_order integer default 0,
  updated_at timestamptz default now()
);

-- Natural key — a (section, label) pair is unique. Lets the seed use
-- ON CONFLICT to be idempotent.
create unique index if not exists system_config_section_label_idx
  on public.system_config (section, label);

-- updated_at auto-bump trigger. Without this, inline edits would need
-- to set updated_at on every PATCH.
create or replace function public.system_config_touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists system_config_touch_updated_at_trg on public.system_config;
create trigger system_config_touch_updated_at_trg
  before update on public.system_config
  for each row execute function public.system_config_touch_updated_at();

-- RLS — enable and set permissive anon policies. The admin UI gates
-- write access client-side via its login; server-side we trust the
-- anon key since it's publicly distributed.
alter table public.system_config enable row level security;

drop policy if exists system_config_select_anon on public.system_config;
create policy system_config_select_anon on public.system_config
  for select to anon using (true);

drop policy if exists system_config_update_anon on public.system_config;
create policy system_config_update_anon on public.system_config
  for update to anon using (true) with check (true);

drop policy if exists system_config_insert_anon on public.system_config;
create policy system_config_insert_anon on public.system_config
  for insert to anon with check (true);

-- ── SEED ─────────────────────────────────────────────────────────────
-- Upsert so running this multiple times is safe. sort_order follows
-- display order within each section.

insert into public.system_config (section, label, value, note, status, url, method, is_code, sort_order) values
  -- live_urls
  ('live_urls', 'Studio', 'mirage-pwa.vercel.app/studio', null, 'active', 'https://mirage-pwa.vercel.app/studio', null, false, 10),
  ('live_urls', 'Admin', 'mirage-pwa.vercel.app/admin', 'nate / MirageAdmin2026!', 'active', 'https://mirage-pwa.vercel.app/admin', null, false, 20),
  ('live_urls', 'Domain', 'www.mirageicons.com', null, 'active', 'https://www.mirageicons.com', null, false, 30),
  ('live_urls', 'Railway Proxy', 'mirage-proxy-production.up.railway.app', null, 'active', 'https://mirage-proxy-production.up.railway.app', null, false, 40),
  ('live_urls', 'Proxy health', '.../health', null, 'active', 'https://mirage-proxy-production.up.railway.app/health', null, false, 50),
  ('live_urls', 'SMS test image', '.../sms/test-image', null, 'info', 'https://mirage-proxy-production.up.railway.app/sms/test-image', null, false, 60),

  -- repos
  ('repos', 'PWA repo', 'github.com/natescott12/mirage-pwa', null, 'active', 'https://github.com/natescott12/mirage-pwa', null, false, 10),
  ('repos', 'Proxy repo', 'github.com/natescott12/mirage-proxy', null, 'active', 'https://github.com/natescott12/mirage-proxy', null, false, 20),
  ('repos', 'Local PWA', '~/Documents/Claude/Projects/Mirage/mirage-pwa', null, 'info', null, null, true, 30),
  ('repos', 'Local proxy', '~/Documents/Claude/Projects/Mirage/mirage-proxy', null, 'info', null, null, true, 40),
  ('repos', 'Sloan persona', 'mirage-proxy/personas/sloan.js', null, 'info', null, null, true, 50),
  ('repos', 'Claude Code (PWA)', 'cd ~/Documents/Claude/Projects/Mirage/mirage-pwa && claude', null, 'info', null, null, true, 60),
  ('repos', 'Claude Code (Proxy)', 'cd ~/Documents/Claude/Projects/Mirage/mirage-proxy && claude', null, 'info', null, null, true, 70),

  -- credentials
  ('credentials', 'GitHub token', null, 'stored in macOS Keychain (osxkeychain helper) — not committed', 'info', null, null, false, 10),
  ('credentials', 'Anthropic account', 'platform.claude.com', 'Mirage Proxy workspace · fresh monthly counter as of Apr 20 2026', 'active', null, null, false, 20),
  ('credentials', 'Anthropic proxy key', 'mirage-proxy-v3', 'updated Apr 20 2026 — set in Railway as ANTHROPIC_API_KEY', 'active', null, null, false, 30),
  ('credentials', 'Replicate account', 'natescott12', '$20 loaded', 'active', null, null, false, 40),
  ('credentials', 'Replicate token', null, 'set in Railway as REPLICATE_API_TOKEN — not committed', 'info', null, null, false, 50),
  ('credentials', 'Sloan LoRA model', 'natescott12/mirage-sloan-lora', null, 'active', null, null, true, 60),
  ('credentials', 'Sloan LoRA training ID', 'z27jjwyp8drm0cxhhht0s53pm', null, 'active', null, null, true, 70),
  ('credentials', 'BFL Flux API', 'api.bfl.ai', 'key in Railway as FLUX_API_KEY', 'active', null, null, false, 80),
  ('credentials', 'Supabase URL', 'gmyenvnfuailickepvax.supabase.co', null, 'active', 'https://gmyenvnfuailickepvax.supabase.co', null, false, 90),
  ('credentials', 'Supabase publishable key', 'sb_publishable_a_5MuHV2aP8yvDOEYM_hvg_gQ-yRN1D', null, 'active', null, null, true, 100),
  ('credentials', 'Twilio Account SID', null, 'set in Railway as TWILIO_ACCOUNT_SID — not committed', 'info', null, null, false, 110),
  ('credentials', 'Twilio Auth Token', null, 'set in Railway as TWILIO_AUTH_TOKEN — not committed', 'info', null, null, false, 120),
  ('credentials', 'Twilio auth code', null, 'see 1Password — not committed', 'info', null, null, false, 130),
  ('credentials', 'Twilio WhatsApp sandbox', '+1 415 523 8886', 'join code: join air-poet', 'active', null, null, false, 140),
  ('credentials', 'Sloan toll-free', '+1 855 533 0518', 'verification pending', 'pending', null, null, false, 150),
  ('credentials', 'Vercel account', 'mirage-pwa.vercel.app', null, 'active', null, null, false, 160),
  ('credentials', 'Railway project', 'perpetual-patience', null, 'active', null, null, false, 170),
  ('credentials', 'Namecheap', 'domain registrar for mirageicons.com', null, 'info', null, null, false, 180),
  ('credentials', 'Anna (collaborator)', 'anna@wearecurrent.net', null, 'info', null, null, false, 190),

  -- proxy_routes
  ('proxy_routes', '/health', 'status check', null, 'active', null, 'GET', false, 10),
  ('proxy_routes', '/flux/generate', 'Flux Pro 1.1 text-to-image', null, 'active', null, 'POST', false, 20),
  ('proxy_routes', '/flux/generate-with-lora', 'Flux Kontext Pro with LoRA', null, 'active', null, 'POST', false, 30),
  ('proxy_routes', '/claude/chat', 'Claude API with image support', null, 'active', null, 'POST', false, 40),
  ('proxy_routes', '/sms/incoming', 'Twilio SMS/WhatsApp webhook (Sloan agent)', null, 'active', null, 'POST', false, 50),
  ('proxy_routes', '/voice/incoming', 'Twilio voice (redirects to SMS)', null, 'active', null, 'POST', false, 60),
  ('proxy_routes', '/sms/test', 'SMS config check', null, 'active', null, 'GET', false, 70),
  ('proxy_routes', '/sms/test-image', 'Fire test image to Nate''s WhatsApp', null, 'active', null, 'GET', false, 80),

  -- system_state
  ('system_state', 'Proxy version', 'v3.3.0', null, 'active', null, null, false, 10),
  ('system_state', 'Supabase table: icon_briefs', 'icon_id text PK · scene, wardrobe, shot, light, updated_by, updated_at', null, 'active', null, null, false, 20),
  ('system_state', 'Supabase table: icon_chats', 'icon_id text PK · messages jsonb, updated_by, updated_at', null, 'active', null, null, false, 30),
  ('system_state', 'Clear Sloan SMS history (SQL)', 'DELETE FROM icon_chats WHERE icon_id = ''sms_whatsapp:+13233093096'';', null, 'info', null, null, true, 40),
  ('system_state', 'Railway env: ANTHROPIC_API_KEY', null, 'set in Railway', 'active', null, null, false, 50),
  ('system_state', 'Railway env: FLUX_API_KEY', null, 'set in Railway', 'active', null, null, false, 60),
  ('system_state', 'Railway env: REPLICATE_API_TOKEN', null, 'set in Railway', 'active', null, null, false, 70),
  ('system_state', 'Railway env: TWILIO_ACCOUNT_SID', null, 'set in Railway', 'active', null, null, false, 80),
  ('system_state', 'Railway env: TWILIO_AUTH_TOKEN', null, 'set in Railway', 'active', null, null, false, 90),
  ('system_state', 'Railway env: SLOAN_PHONE_NUMBER', '+18555330518', null, 'active', null, null, true, 100),
  ('system_state', 'Vercel (PWA) deploy', 'git push natescott12/mirage-pwa → auto deploys ~60s', null, 'info', null, null, false, 110),
  ('system_state', 'Railway (Proxy) deploy', 'git push natescott12/mirage-proxy → auto deploys ~2 min', null, 'info', null, null, false, 120),
  ('system_state', 'Hard refresh', 'Cmd + Shift + R', null, 'info', null, null, true, 130),
  ('system_state', 'Check version', 'hit /health endpoint', null, 'info', null, null, false, 140)
on conflict (section, label) do update set
  value = excluded.value,
  note = excluded.note,
  status = excluded.status,
  url = excluded.url,
  method = excluded.method,
  is_code = excluded.is_code,
  sort_order = excluded.sort_order;
