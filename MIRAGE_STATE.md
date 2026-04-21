# Mirage — Project State

_Last updated: 2026-04-20_

## Done today (Apr 20)

- Proxy v3.6.3, `mirage-proxy-v3` API key active
- Studio rebuilt — top-to-bottom flow, 1744 lines, categorized Flux prompt, filter variance with grain overlay
- Persona Builder updated with full appearance fields (freckles, age range, signature style, distinguishing features, tattoos/piercings, typical setting)
- Admin accent color `#77cc6e`, Afacad everywhere, no Playfair
- Tech Reference live from Supabase `system_config` table (4 sections, 27 rows)
- Sloan Chat with images and PDF support
- Sloan Design Bible + Section 7 Nate principles in knowledge base
- `studio_filters` table seeded in Supabase (8 presets — A6 Standard / A6 Soft / A6 Bright / Film / Overcast / Flash / Dusk / Raw)
- Figma Workshop cleared and ready
- Studio top nav restored — left: ← Admin, Persona Builder · center: Proxy + Flux status · right: Generate, Converse, Library [count], Icons, Queue [count]

## Pending — next session

- Studio: test filters and grain live in browser
- Studio: build the actual Queue feature (currently a nav placeholder that says "Queue is empty")
- Figma plugin: PATCH reliability intermittent
- LoRA retrain images 94, 96, 98, 100, 102
- Task Checklist content full refresh
- Manual synthesis trigger for Sloan (`POST /sloan/synthesize-now`)
- Andie build (not started)
- Supabase `service_role` legacy key migration (rotate the key that was hardcoded in the pre-rebuild Studio file; new file uses publishable key only)

## Live URLs

| Label         | Value                                           | URL                                                      |
| ------------- | ----------------------------------------------- | -------------------------------------------------------- |
| Domain        | mirage.is                                       | https://mirage.is                                        |
| Studio        | mirage-pwa.vercel.app/studio                    | https://mirage-pwa.vercel.app/studio                     |
| Admin         | mirage-pwa.vercel.app/admin                     | https://mirage-pwa.vercel.app/admin                      |
| Railway Proxy | mirage-proxy-production.up.railway.app          | https://mirage-proxy-production.up.railway.app           |
| Proxy health  | .../health                                      | https://mirage-proxy-production.up.railway.app/health    |

_Primary domain is `mirage.is`; `www.mirageicons.com` now redirects to it._
