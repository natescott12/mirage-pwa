-- studio_filters
-- Historical numeric preset schema from the earlier Studio implementation.
-- The active Studio editor now uses its bundled preset definitions and does
-- not read or write this table. Retained as lineage only.
--
-- If this bootstrap is ever used in a new environment, the table remains
-- server-only. Do not restore anon/authenticated access here.

create table if not exists public.studio_filters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brightness numeric not null default 100,
  contrast numeric not null default 100,
  saturation numeric not null default 100,
  sepia numeric not null default 0,
  haze numeric not null default 100,
  grain_opacity numeric not null default 0,
  warm_shift numeric not null default 0,
  created_by text,
  created_at timestamptz default now()
);

-- Names are unique — editor upserts on name rather than id.
create unique index if not exists studio_filters_name_idx on public.studio_filters (name);

-- RLS: server-only historical data.
alter table public.studio_filters enable row level security;

revoke all privileges on table public.studio_filters from anon, authenticated;

drop policy if exists studio_filters_select_anon on public.studio_filters;
drop policy if exists studio_filters_insert_anon on public.studio_filters;
drop policy if exists studio_filters_update_anon on public.studio_filters;
drop policy if exists studio_filters_delete_anon on public.studio_filters;
drop policy if exists "Public filter preset read" on public.studio_filters;
drop policy if exists "Service role full access" on public.studio_filters;

create policy "Service role full access" on public.studio_filters
  as permissive for all to service_role using (true) with check (true);

grant all privileges on table public.studio_filters to service_role;

-- ── SEED ─────────────────────────────────────────────────────────────
-- Upsert so re-running this is safe. Values are on the 0-200 scale
-- (100 = neutral for most; sepia 0-100; grain_opacity 0-100; warm_shift
-- -100..+100).

insert into public.studio_filters (name, brightness, contrast, saturation, sepia, haze, grain_opacity, warm_shift, created_by) values
  ('A6 Standard', 102,  95,  70,  5, 110, 15,  10, 'seed'),
  ('A6 Soft',      98,  88,  65,  8, 120, 20,  15, 'seed'),
  ('A6 Bright',   110, 105,  75,  3, 100, 12,   5, 'seed'),
  ('Film',         95, 110,  60, 12, 115, 25,  20, 'seed'),
  ('Overcast',    105,  90,  65,  0, 115, 10, -10, 'seed'),
  ('Flash',       110, 105,  85,  0,  95,  8,  -5, 'seed'),
  ('Dusk',         95, 105,  75,  8, 110, 18,  25, 'seed'),
  ('Raw',         100, 100, 100,  0, 100,  0,   0, 'seed')
on conflict (name) do update set
  brightness    = excluded.brightness,
  contrast      = excluded.contrast,
  saturation    = excluded.saturation,
  sepia         = excluded.sepia,
  haze          = excluded.haze,
  grain_opacity = excluded.grain_opacity,
  warm_shift    = excluded.warm_shift;
