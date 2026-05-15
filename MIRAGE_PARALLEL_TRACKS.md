# MIRAGE — Parallel Tracks Plan
*GZA + Method Man — May 15, 2026*

---

## The Two Tracks

**Track 1 — Sloan (continuous)**
Sloan is a permanent work in progress. She doesn't pause while Track 2 gets built.
Her codebase is never touched by Track 2. Zero interference.

**Track 2 — Icon Platform (new build)**
Clean slate. Icon-agnostic from day one. Triggered by SMS approval (Twilio or Sinch).
Built alongside Sloan, not on top of her.

---

## Track 1 — Sloan

### What's open

**Voice (GZA)**
The performing vs being problem. She has the register right but nothing behind the words.
Fix is subtraction — pull instructions that tell her how to be Sloan. They create the narrator layer.
The knowledge file needs opinions, not descriptions. What does she actually think about the 964?
What does she find boring? What makes her stop the conversation?
This is ongoing coaching work, not a one-time fix. It doesn't have an end date.

**Visual consistency (Method Man)**
Every loft shot is built from the same ingredients but arranged differently each time.
The prompt needs a fixed spatial anchor — not keywords, actual room layout.
Sofa position, piano corner, window placement, light source. Same room every time.
This is a server.js fix to how SEND_WORLD constructs the prompt for known locations.

**Context bleed (Method Man + GZA)**
Synthesis needs ownership markers. Nate's facts tag as subscriber, not world context.
Method Man: architecture change to synthesis extraction — subscriber_fact[nate] vs sloan_world.
GZA: knowledge file rule while the architecture fix is pending — his world is his, not hers.

**Oliver Framework §13 (Method Man)**
Not in sloan-knowledge.js yet. Needs to be a shared module. Method Man builds it.

**Layer 2 pre-send review (Method Man)**
Launch blocker. Hallucinated images cannot reach real subscribers.
Must be built before any real subscriber gets access to Sloan.

**LoRA (Method Man + Nate)**
5 clean headshots needed. Face consistency blocked without it.
Parked until images are ready. Do not discuss with Sloan.

**First-week choreography for Sloan (GZA)**
She has a different role — internal CD, not subscriber-facing Icon.
What does her presence look like publicly? This is a future problem, not now.
Parked until Track 2 is proven.

### What doesn't get touched
Memory architecture — working. Leave it.
Image pipeline — VIEW_CONTENT structural, Persona Builder injection, aspect ratio. All working. Leave it.
SEND_WORLD / SEND_IMAGE — working. Leave it.
Proxy core — stable. Do not touch for Track 2 work.

### Track 1 milestones
1. Visual consistency fix confirmed — 5 consecutive loft shots feel like the same room
2. Voice — one conversation where she says something genuinely interesting unprompted
3. Oliver §13 in knowledge file
4. Layer 2 pre-send review live
5. Context bleed architecture fix deployed

---

## Track 2 — Icon Platform

### Trigger
SMS approval — Twilio toll-free or Sinch fallback.
Nothing gets built until a real number is live. Real subscribers are the test. Nothing else is.

### What gets built

**The Icon Template (GZA spec, Method Man builds)**
The fields every Icon is built from. Fill the template, Icon is ready.

Required fields at minimum:
- Identity: name, age, location, physical constants
- Voice fingerprint: register, what she finds gross, what she'd never say, actual opinions
- Visual canon: one locked description per major space — not keywords, spatial layout with light and objects
- World logic: daily rhythm, where she goes, what a normal week looks like
- Image threshold: her specific ratio and what earns each type
- Domain expertise: what she actually knows and goes deep on
- Extension slots: empty by default, filled for Icon-specific capabilities

**The Persona Builder (Method Man)**
Rebuilt to be Icon-agnostic. The template fields are the UI.
Create a new Icon: fill the fields, hit save, she exists.
No Sloan-specific fields. No assumptions about loft or 964.
Sloan's current Persona Builder stays exactly as it is. New UI is a separate view.

**The base proxy (Method Man)**
New service on Railway. Does not share code with mirage-proxy.
Reads from the Icon template, not from sloan-test.js or sloan-knowledge.js.
Same proven pipeline — image generation, memory architecture, guardrails — rebuilt clean.
Oliver framework as a shared module that any Icon loads.

**Visual canon system (Method Man)**
The proxy recognizes location keywords in SEND_WORLD directives.
Matches against the Icon's visual canon fields.
Injects the canonical spatial description into the Flux prompt automatically.
First generation of a new location: verdict gets saved as the canon for that place going forward.
SAVE_PLACE rebuilt to actually do this — not just store a name, store a full visual description.

**Memory architecture (Method Man)**
Same structure as Sloan's — subscriber_facts, shared_moments, open_threads, synthesis.
Clean tables, no Sloan data.
Ownership markers from day one — subscriber context tagged separately from Icon world.

**Guardrails (Method Man)**
Oliver framework shared module loaded by every Icon.
FUGAZI rule built in.
Crisis protocol built in.
Not customizable per Icon. Non-negotiable baseline.

**Extension layer (GZA spec, Method Man builds per Icon)**
Capability modules that plug into the base platform.
Vera the podcaster: episode format, show notes, listener interaction.
Margot the wellness Icon: article templates, product review format.
Each module is a config slot, not a parallel system.
First extension module gets built when the first Icon needs it — not before.

### What proven looks like for Track 2
- One Icon built from the template in under a day
- Real subscriber conversation runs for one week without world coherence breaking
- Three different subscribers ask three different things — world holds
- Visual canon holds across 10 consecutive images — feels like the same place
- Extension module (whichever the first Icon needs) works without touching base platform code

### Track 2 milestones
1. Icon template spec finalized — GZA delivers, Method Man reviews
2. SMS approval received
3. New Persona Builder view built — fill template, Icon exists
4. Base proxy service live on Railway — clean, no Sloan code
5. Visual canon system working — auto-injection from template fields
6. First Icon live — name TBD, built from template in one day
7. One week of real subscriber conversations — world holds
8. First extension module built and proven

---

## Shared Infrastructure — Collision Risk

These are the places Track 1 and Track 2 could interfere.
Each has a defined boundary so they don't.

**Supabase**
Track 1 uses existing tables — icon_chats, sloan_memory, subscriber_details, etc.
Track 2 gets new tables with an icon_platform prefix. No shared tables.
Same project, separate schema. No risk of Track 2 writes corrupting Sloan's data.

**Railway**
Track 1 runs on mirage-proxy. Stays exactly as it is.
Track 2 gets a new Railway service — mirage-icon-platform or similar.
Separate deployment, separate env vars, separate logs. Zero interference.

**Persona Builder UI**
Track 1 Sloan Persona Builder stays in admin/index.html exactly as it is.
Track 2 gets a new section or separate page in admin. Does not touch existing Sloan fields.

**Image pipeline**
Same Flux model, same Supabase storage bucket structure.
Different icon_id values. No content collision.

---

## Who Owns What

| Item | Owner | When |
|---|---|---|
| Icon template spec | GZA | Before SMS approval |
| Voice work (Sloan) | GZA | Ongoing |
| Visual consistency fix (Sloan) | Method Man | Now |
| Oliver §13 | Method Man | Now |
| Layer 2 pre-send review | Method Man | Now — launch blocker |
| Context bleed architecture | Method Man | After current fixes |
| New Persona Builder view | Method Man | At SMS approval |
| Base proxy (new) | Method Man | At SMS approval |
| Visual canon system | Method Man | At SMS approval |
| First Icon character write | GZA | At SMS approval |
| Extension module spec | GZA | When first Icon needs it |

---

## What This Is Not

This is not a plan to replace Sloan.
This is not a plan to pause Sloan work.
This is not a plan to merge the two tracks.

Sloan keeps getting built. The new platform gets built clean.
When the new platform is proven, Icons get built on it.
Sloan's role as internal CD gets defined separately, on her own timeline.

---

*The constraint is never the system. It's only ever imagination.*
