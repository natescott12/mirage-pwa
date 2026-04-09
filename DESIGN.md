# Mirage — Design System

## Typography
- **Font:** Afacad (Google Fonts) — single family, no Playfair, no italics
- **Page heading:** 600, 22px
- **Page subtitle:** 400, 12px, var(--ink-dim)
- **Section label:** 500, 10–11px, UPPERCASE, 0.12em tracking, var(--ink-dim)
- **Body / UI:** 400, 13–14px
- **Stat value:** 400, 32px
- **Muted / meta:** 400, 10–11px, var(--ink-dim)

## Colors
## Spacing
- Page padding: 32px top, 40px sides
- Section gap: 28–32px
- Card padding: 20–24px
- Border radius: 2px
- Border: 1px solid var(--border)

## Components

### Page Header
- Title: Afacad 600, 22px, var(--ink) — class `pane-title`
- Subtitle: Afacad 400, 12px, var(--ink-dim) — class `pane-subtitle`
- Actions: right-aligned buttons

### Stat Cards (grid of 4)
- Background: var(--bg2), border: 1px solid var(--border)
- Value: 32px Afacad 400
- Label: 10px UPPERCASE 0.1em tracking var(--ink-dim)

### Section Label
- 10–11px, UPPERCASE, 0.12em tracking, var(--ink-dim), weight 500

### Buttons
- Primary: bg var(--ink), color var(--bg), 11px 500 UPPERCASE, 8px 16px padding, 2px radius
- Secondary: transparent bg, border var(--border), same typography

### Inputs
- bg var(--bg3), border var(--border), Afacad 14px, 2px radius

### Status Badges
- DONE: green · IN PROGRESS: orange/accent · TO DO: bg3/ink-dim
- 9px UPPERCASE 0.12em tracking, no radius

### Infra Status Row
- Background: var(--bg2), border: 1px solid var(--border), radius 2px
- Label: 9px UPPERCASE var(--ink-dim)
- Value: 13px var(--ink), accent color for live/active links

### Priority Rows
- Number: 22px var(--ink-dim)
- Title: 500 14px var(--ink)
- Description: 400 12px var(--ink-dim)
- Divider: 1px var(--border)

## Layout Shell
- Topbar: 48px, var(--ink) bg
- Sidebar: 220px fixed
- Content: flex:1, overflow-y:auto, padding 32px 40px

## Do Nots
- No Playfair Display
- No italic text
- No border-radius > 2px
- No drop shadows or gradients
- No dark panel backgrounds on content panes
- No browser-side btoa() for GitHub pushes
