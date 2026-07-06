# Personal OS — v1 Build Specification

*(Working title. Rename to whatever you like: "Ascend", "Command", "Atlas", etc.)*

A private, single-user life-management web app for tracking habits, people, journaling, and personal growth, synced across phone, laptop, and iPad.

---

## 1. Purpose

A single place to manage and "ascend" across every area of life: knowledge, discipline, social intelligence, and day-to-day order. The owner is the only user. The app opens to a daily command center and expands into focused dashboards through a sidebar.

---

## 2. Tech stack (locked)

| Layer | Choice | Why |
|---|---|---|
| Framework | React + Vite + TypeScript | Fast, modern, easy for Claude Code to build and maintain |
| Styling | Tailwind CSS | Quick, consistent UI |
| State | Zustand | Lightweight global state, simple to reason about |
| Backend / DB / Auth | Supabase (free tier) | Postgres database, login, and sync bundled at zero cost |
| Delivery | PWA (Progressive Web App) | Installable to home screen on all three devices from one codebase |
| Hosting | Vercel or Netlify (free tier) | Free static hosting for the web app frontend |

### Key architecture notes for Claude Code
- **Single user, but real auth.** Use Supabase email/password (or magic link) login. One account. This is what keeps it private and synced.
- **Row-Level Security (RLS) ON for every table.** Every row carries a `user_id`. RLS policy: a user can only read/write rows where `user_id = auth.uid()`. Non-negotiable, this is the privacy guarantee.
- **PWA requirements:** web manifest, service worker, installable, works in any mobile/desktop browser. Add-to-home-screen should feel like a native app.
- **Offline tolerance (nice-to-have, not v1-blocking):** cache the latest data so a brief offline moment doesn't break ticking a habit; sync when back online. If this complicates v1, defer it.
- **Supabase free-tier caveat to design around:** projects pause after 7 days of zero activity. Daily use never triggers this. No special handling needed.

---

## 3. Navigation structure

**Left sidebar** (collapsible on mobile into a bottom bar or hamburger):

Phase 1 (build first):
1. **Daily Command Center** (home, opens by default)
2. **Habits**
3. **People**
4. **Journal**

Phase 2 (layer on after Phase 1 works and syncs):
5. **The Forge** (universal capture → AI triage → Claude battle-plan)
6. **Knowledge Base**
7. **Goals & Vision**
8. **Tasks**
9. **Focus** (Pomodoro)

---

## 4. Phase 1 — detailed specs

### 4.1 Daily Command Center (home)

The first screen on open. A glanceable dashboard, not a place to do heavy work.

- **Today's habits:** the same checklist as the Habits "Today" view, embedded here for one-tap ticking.
- **At-a-glance strip:** today's completion %, current streaks on key habits, and a one-line editable "daily intention" field.
- **Journal quick-entry box:** a single text field to drop a thought; saves to today's journal entry.
- Layout: clean, mobile-first, minimal clutter. This is the screen seen most often.

### 4.2 Habits

The core engine. Two habit types and three views over one shared dataset.

**Habit types:**
- **Boolean (checkbox):** did / didn't. e.g. "Meditated", "No sugar".
- **Quantitative (value):** a number, optionally with a target and unit. e.g. "Sleep" (hours), "Water" (glasses), "Reading" (minutes). Quantitative habits can be displayed in bands (like the sleep example in the reference image) and feed richer metrics.

**Per-habit settings:**
- Name, type, unit (for quantitative), target value (optional), frequency (daily / weekly / x-times-per-week), color, icon, sort order, life-area tag (optional, links to growth scoring later), archived flag.

**Three views (toggle between them):**

1. **Today (default):** today's habits as a clean checklist. Tap to tick a boolean; enter a number for a quantitative. Fast, uncluttered. The day-to-day driver.
2. **Month grid:** habits as rows, days 1–31 as columns, filled cells (the green-squares / heatmap look from the reference image). At-a-glance consistency.
3. **Metrics:** per-habit completion %, current and longest streaks, trend lines, best and worst performers over the selected month. Quantitative habits also show averages and trends (e.g. average sleep this month).

*(Week view intentionally skipped in v1. Add later if wanted.)*

### 4.3 People

A dashboard of profiles for the people in the owner's life, used to learn from them and track relationships.

**Per-person profile card:**
- Name, how we met, relationship/role, last meaningful interaction (date).
- **Qualities to learn from** (free text).
- **Weak spots to avoid in myself** (free text).
- **What they're good at that I'm not** (free text).
- **My raw thoughts / notes** (free text).
- **Questions to ask them** (free text or checklist).
- **Lessons extracted** (a running, dated log).
- **Optional trait ratings:** private 1–10 scores across traits (discipline, social skill, knowledge, etc.) so the owner can see who to learn what from.

### 4.4 Journal

- **Daily entry:** date, free-form content, optional mood slider (1–5), optional energy slider (1–5), tags.
- The home-screen quick-entry box appends to the current day's entry.
- **Search/filter** by date and by tag.
- Optional prompts to nudge an entry (can be a simple rotating prompt, defer if it adds complexity).

---

## 5. Phase 2 — roadmap (specs to expand later)

### The Forge — universal capture → AI triage → Claude battle-plan

*The headline Phase 2 feature. The point of the whole app's "AI age" thesis: drop in any raw thought and turn it into an executable plan that leverages Claude, so one person operates at the throughput of a team.*

**The capture box.** A single, frictionless input (text first; voice/share-target later). You dump anything — an idea, a task, a worry, a half-formed project, "I should learn to negotiate," "build a script that renames my screenshots." Zero deciding-where-it-goes. It lands as a raw item in an inbox list with a status (`new` → `triaged` → `in_progress` → `done` / `archived`).

**AI triage (suggest, then confirm — never auto-file).** Claude reads each raw item and proposes:
- **Category / nature:** task, project, idea, research question, person-note, habit-candidate, journal-thought, etc.
- **Destination:** which Ascend module it should flow into (Tasks, Habits, People, Journal, Knowledge Base), kept as a *suggestion* — the item stays in the inbox until the owner approves filing it.

**The Claude battle-plan (the core value).** For each item, Claude produces a card with:
- **Recommended Claude surface** — which tool fits: Claude.ai chat, Cowork, Claude Code, Projects, Deep Research, a specific skill/MCP, etc.
- **Copy-ready, step-wise prompts** — actual prompts (one-tap copy), broken into ordered steps when the task is multi-stage, that the owner pastes straight into the chosen surface.
- **Why this approach** — a one-line rationale, so the owner gets better at orchestrating Claude over time.
- **Effort / time estimate** — quick-win vs. deep project, to help choose what to tackle.
- **Suggested next single action** — the one concrete first step to take right now.

**Engine (build-time decision — keep loose, do NOT pin volatile specifics now):**
- **Primary: the owner's Claude Max subscription via Claude Code / Cowork + MCP.** Ascend stays pure capture/store/display. The intelligence comes from the owner pointing Claude Code or Cowork at the inbox on demand (e.g. "triage my Forge inbox"); Claude reads unprocessed items — through an MCP server exposing the inbox, or by reading Supabase directly — classifies them, and writes the category + battle-plan back into the DB for the app to render. **No API key, no per-call cost, no client-side AI; uses the subscription already paid for.** Tradeoff: triage is on-demand (triggered from a Claude session), not instant-on-capture. This is acceptable and is the intended design.
- **Why not an in-app API call:** a PWA cannot safely hold *any* LLM API key in browser JS — even a free one — so any auto-triage engine would require a server-side proxy (Supabase Edge Function). Free removes the cost, not the infra.
- **Optional later enhancement (not built now):** if instant auto-triage is ever wanted, add a server-side proxy calling a free-tier model (e.g. OpenRouter `:free` models, Google Gemini free tier, or Groq) for a lightweight first-pass classification, reserving the subscription/Claude route for the deeper battle-plans. Free-tier model names and daily-call limits churn constantly — decide the exact provider at build time, not here.

### Other Phase 2 modules

- **Knowledge Base (Notion-style):** nested pages, free-form notes, tags, search, save links/quotes/book notes, optional templates.
- **Goals & Vision (the "ascension" layer):** a cascade of vision → yearly → quarterly → monthly → this week, each level linking down so daily actions ladder up. A "Wheel of Life" monthly self-rating across life areas to visualize growth over time. Habits tagged to life areas feed this score.
- **Tasks (Todoist-style):** due dates, priorities, recurring tasks, projects, quick natural-language add.
- **Focus (Pomodoro):** 25/5 timer, log sessions, optionally attach a session to a task or habit so focused time becomes a tracked metric.

---

## 6. Proposed data model (Postgres / Supabase)

Every table includes `id` (uuid, primary key), `user_id` (uuid, references auth.users), and `created_at` (timestamp). RLS enforces `user_id = auth.uid()` on all.

**life_areas** *(used now for habit tagging, expands in Phase 2)*
- `name`, `color`

**habits**
- `name`, `type` ('boolean' | 'quantitative'), `unit` (nullable), `target` (numeric, nullable), `frequency` ('daily' | 'weekly' | 'x_per_week'), `times_per_week` (int, nullable), `color`, `icon`, `sort_order`, `life_area_id` (nullable FK), `archived` (bool)

**habit_logs**
- `habit_id` (FK), `log_date` (date), `completed` (bool, for boolean habits), `value` (numeric, for quantitative habits)
- Unique constraint on (`habit_id`, `log_date`) so one log per habit per day.

**people**
- `name`, `how_we_met`, `relationship`, `qualities_to_learn`, `weaknesses_to_avoid`, `what_theyre_good_at`, `my_thoughts`, `questions_to_ask`, `last_interaction` (date)

**person_traits** *(optional ratings)*
- `person_id` (FK), `trait`, `rating` (int 1–10)

**person_lessons**
- `person_id` (FK), `lesson` (text), `lesson_date` (date)

**journal_entries**
- `entry_date` (date, unique per user), `content`, `mood` (int, nullable), `energy` (int, nullable), `tags` (text array)

#### Phase 2 tables (not built in Phase 1)

**forge_items** *(The Forge inbox — captured first, triaged later)*
- `raw_text` (text), `status` ('new' | 'triaged' | 'in_progress' | 'done' | 'archived'), `ai_category` (text, nullable), `ai_destination` (text, nullable — which module it's suggested to flow into), `recommended_surface` (text, nullable — which Claude tool), `rationale` (text, nullable — the "why"), `effort_estimate` (text, nullable), `next_action` (text, nullable), `triaged_at` (timestamp, nullable)

**forge_prompts** *(the step-wise battle-plan for an item)*
- `forge_item_id` (FK), `step_order` (int), `surface` (text — Claude.ai / Cowork / Claude Code / etc.), `prompt_text` (text)

---

## 7. Build order for Claude Code

1. Scaffold Vite + React + TS + Tailwind, set up Zustand, set up the Supabase client.
2. Build Supabase auth (single login) and create all Phase 1 tables with RLS policies.
3. Build the Habits module first (the hard part): the three views and both habit types, wired to `habits` and `habit_logs`.
4. Build the Daily Command Center, reusing the Habits "Today" component plus the at-a-glance strip and journal quick-entry.
5. Build People, then Journal.
6. Add the PWA layer (manifest, service worker, installability) and deploy to Vercel/Netlify.
7. Confirm sync works across phone, laptop, and iPad.
8. Stop. Review. Then start Phase 2.

---

## 8. Open decisions

### Decided
- **App name:** **Ascend.**
- **Delivery:** **PWA**, installed to the device on all three — Mac dock, Pixel 9 Pro app drawer (Chrome/WebAPK), iPad home screen (Safari). One codebase. Cross-device sync via Supabase is required: all data identical everywhere; the Pixel is the primary device.
- **Login method:** **email + password** with a **persistent session** — log in once per device, then never see the login screen again (this is what enables the cross-device sync).
- **The Forge engine:** runs on the owner's **Claude Max subscription via Claude Code / Cowork + MCP** — no API key, no per-call cost. See §5. (Exact engine confirmed at build time, in Phase 2.)

### Still open (not blocking)
- **Visual theme:** light, dark, or both with a toggle (leaning dark for a personal/evening-use app — decide before/at build).
- **Whether offline-ticking is in v1 or deferred.**

---

*This spec is the working agreement. Anything here can change before build starts.*
