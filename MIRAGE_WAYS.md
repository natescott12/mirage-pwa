# MIRAGE — Ways of Working
*Read this alongside MIRAGE_STATE.md at the start of every session.*

---

## The Bridge Model

Three players every session:

- **Nate** — founder, decision-maker, the bridge
- **Claude (chat)** — strategist, architect, prompt writer
- **Claude Code** — executor. Reads files, edits code, pushes to GitHub

Nate is the bridge. Claude chat writes prompts, Claude Code executes, Nate passes results back.

---

## Rules

- Always grep or cat the relevant file section FIRST before any edit
- Never ask for line numbers — find the code yourself
- One task at a time, confirm before moving to next
- After any push, report the commit hash and what changed
- GitHub API is blocked in Claude chat — all file changes go through Claude Code

---

## Session Start Ritual

1. Claude reads `MIRAGE_STATE.md` — current state, credentials, active priorities
2. Claude reads `MIRAGE_WAYS.md` — this doc
3. Before touching any file, Claude writes a prompt for Claude Code to **dump the relevant section** of the actual file first
4. Claude confirms the real state matches MIRAGE_STATE.md before writing any fix
5. Then execute in priority order from Active Priorities

**Never assume file structure from state alone. Always grep first.**

---

## Pre-Flight Check — Required Before Any Proxy or Persona Change

Before touching sloan-test.js, sloan.js, sloan-knowledge.js, or server.js:

1. List what's currently working that this change could affect
2. Make the change
3. Test the specific thing that was broken
4. Confirm everything from step 1 still works

No exceptions. One change, one test, confirm no regressions before moving on.

## Git Tagging Discipline

Before any significant commit to mirage-proxy or mirage-pwa:

1. git tag stable-[date] in both repos
2. Push both tags to remote
3. Then make the commit

This gives real rollback points. Persona file changes especially require tagging first. If something breaks after a commit, roll back to the last stable tag — don't patch forward blind.

Rollback command: git checkout stable-[date]
Current stable tag: stable-may3

---

## How Claude Writes Prompts for Claude Code

- One task at a time
- Include the exact file path (`studio/index.html`, not `studio.html`)
- Include line range or grep pattern when asking for current code
- Always ask Claude Code to paste back the result before applying changes
- After a push, ask Claude Code for the commit hash and a summary of what changed

**Standard opener for any UI task:**
```
Show me [section] in [file path] — lines [X–Y] or grep for "[pattern]".
Paste the current code before making any changes.
```

---

## What Claude Code Can Do Without Asking

- Edit and push files to GitHub
- Grep, read, dump file contents
- Run SQL via Supabase CLI
- Trigger Vercel redeploys
- Set Railway/Vercel env vars

## What Needs Nate's OK First

- Dropping or truncating any Supabase table
- Changing auth or access for Anna
- Any financial or payment config
- Deleting files permanently

---

## GitHub Pattern (When Needed from Claude Chat)

GitHub API is blocked in Claude's browser environment. All file changes go through Claude Code. If Claude chat ever needs to read a file, the pattern is:

```
Ask Claude Code: cat [filepath] | head -100
```

Never try GitHub API calls from Claude chat — they will fail silently.

---

## File Locations

| File | Path |
|---|---|
| Studio | `studio/index.html` (in mirage-pwa) |
| PWA | `mirage-pwa.vercel.app` |
| Admin | `mirage-pwa.vercel.app/admin` |
| Proxy server | `mirage-proxy/server.js` |
| State doc | `mirage-pwa/MIRAGE_STATE.md` (tracked in git) |
| Ways doc | `~/Documents/Claude/Projects/Mirage/MIRAGE_WAYS.md` (local-only) |

Local base: `~/Documents/Claude/Projects/Mirage/`

> Note: State lives inside the `mirage-pwa` repo so it's versioned with the code it describes. Ways stays at the parent folder because the parent isn't a git repo and Ways is a personal collaboration doc, not a project artifact.

---

## Figma Plugin Rules (Sloan Live)

- All fetch calls live in `ui.html` (iframe), not `code.js` (main thread — cannot make network requests)
- Use `await figma.setCurrentPageAsync(page)` — not deprecated `figma.currentPage = page`
- Fonts: Helvetica Neue only (Light, Regular, Medium, Bold)
- Text node order: createText → fontName → fontSize → characters → resize
- No `closePlugin()`, no sync page assignment, no page navigation in generated code
- All work lands on page: `00 — Sloan's Workshop`

---

## Proxy Architecture (Quick Ref)

- Version: v3.6.3 on Railway
- Auth: all `/sloan/*` routes require `x-mirage-key: mirage-int-2026`
- Active API key: `mirage-proxy-v3` (set in Railway — see MIRAGE_STATE.md for key)
- Admin chat uses `POST /sms/incoming` with `channel=admin` — bypasses Twilio
- Image pipeline: Flux → Supabase upload → autoSaveToContentLibrary → autoAuditImage

---

## Common Failure Patterns

| Symptom | Likely cause |
|---|---|
| Nav items missing after rebuild | Rebuild was too aggressive — grep for old nav HTML before re-adding |
| Supabase insert 400 | Missing NOT NULL field with no default (check `icon_id`) |
| Figma plugin fetch fails | Fetch call is in `code.js` not `ui.html` |
| LoRA 409 conflict | SHA mismatch — re-fetch SHA immediately before PUT |

---

## Session Close

1. Update `MIRAGE_STATE.md` — current state only, no history, under 2 pages
2. Note exactly what's broken and the next action
3. Include last commit hash

---

## Tone

Nate is an Executive Design Director. Keep it casual and direct. Lead with the result. No fluff. No preamble. If something broke, say what broke and what the fix is.
