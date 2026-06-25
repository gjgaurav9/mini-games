# CLAUDE.md — Mini Games ("Pass & Play")

Handoff/context doc for any Claude Code session working on this repo. Read this first.

## What this project is

A collection of **local, offline, "pass-and-play" mini-games**. The core idea: the
phone/tablet **is** the board — friends and family gather around **one device** and
take turns on the same screen, like an old-school board game.

**Guiding principle (do not break):** NO servers, NO accounts, NO online matchmaking,
NO per-person devices. Everything is **static HTML/JS that works offline**. Each game
is a **single self-contained `index.html`** (HTML5 canvas + vanilla JS) — no build
step, no dependencies, no frameworks. Family/kid-friendly, cozy visual style.

## Live deployments

- **Vercel:** https://garmi-ki-chutti.vercel.app — project `garmi-ki-chutti`, account
  `gjgaurav9`. **Manual** deploy: `vercel deploy --prod --yes` from repo root.
  `.vercel/` is gitignored. NOT auto-deployed from git (no Git integration connected).
- **GitHub Pages:** https://gjgaurav9.github.io/mini-games/ — repo `gjgaurav9/mini-games`,
  **auto-builds on push to `main`**.

## Repo conventions (important)

- **Commit authorship:** commits here must be authored **only** as
  `gjgaurav9 <gjgaurav9@gmail.com>` with **NO `Co-Authored-By: Claude` trailer** (and
  no Claude mention) in commit messages or PR bodies. `git config user.name/email` are
  already set locally to this.
- One game = one folder with a self-contained `index.html`. No shared build.
- Prefer **local multiplayer / pass-and-play** designs for new games.
- Landing page is `index.html` at the repo root; it links every game, grouped by section.

## Games

**Gather round — board games (2–4 player hot-seat):**
`carrom-board-game` (2p White-vs-Black & 4p 2v2 partners; rotating striker baseline, Queen cover rule),
`ludo` (2–4p; 6-to-leave-base, captures, safe squares, extra turns, home lanes),
`snake-and-ladder` (2–4p; exact-finish, animated snake bite + slither),
`drop-four` (2p; gravity drop + win-line; renamed from "Connect 4" — Hasbro trademark),
`dots-and-boxes` (2–4p; pick grid size),
`checkers` (2p; American rules — forced captures, multi-jumps, kings).

**Eagle Eye — head-to-head spotting duels (2 players, split-screen, one device flat on table):**
`eagle-eye-safari` (Safari, 6 symbols/card), `eagle-eye-feast` (Feast, 6/card),
`eagle-eye-lightning` (8/card). **Renamed from "Dobble"** (Asmodee trademark) for sale-readiness;
the folder slugs changed too, with redirects in `vercel.json`. Decks are generated from a **projective plane of order n**
(`buildDeck(n)` → any two cards share exactly ONE symbol; needs `n²+n+1` symbols). Top
half is rotated 180° for the opposite player; tap the shared symbol on your card to
score, wrong tap = **−1** and a short freeze. All three share one templated `index.html` differing
only in the `CFG` block (emoji/title/matchWord/n/symbols/colors) — keep them in sync.

**Eagle Eye commentary** does NOT use `Banter.say` (its toast floated over the rotated top
player's card). Instead each game has a local `comment(cat)` that shows the line in the
**neutral centre strip** (`#comment`, mirrored top/bottom so both players read it, never over
a card) and plays **real recorded Hinglish clips** when present via the `VOICE` map — falling
back to a synth cue (`Banter.sfx`) until clips are added. No robotic TTS. Drop clips in
`shared/commentary/` and fill `VOICE` in each game — see `shared/commentary/README.md`.

**Learn & play — letters & spelling (solo, ~ages 3–6, no-fail):**
`abc-missing-letter` (ABC Train — fill the missing letter in a 3-letter window `A _ C`;
tap one of 3 big tiles, never type; stars as reward; `Aa` upper/lower toggle; pure DOM, no
canvas), `trace-and-spell` (Trace & Spell — emoji picture + lowercase CVC word, trace each
letter on a **canvas** then advance; rhyming families grouped; finger drawing via pointer
events + `touch-action:none`, DPR-scaled, midpoint-quadratic smoothing; completion by
**lenient ~60% coverage** sampled from an offscreen glyph render, plus a ✓ Done fallback).
Both skip `askNames` (big Play button), load `banter.js` for sfx/music/home/mute. Design is
grounded in early-literacy research (3-letter window for working memory, tap-not-type, no
penalties, effort rewards).

**TTS exception — these two games DO use spoken voice** (user-requested, June 2026). Each has
its own small `speak()` helper over the **Web Speech API** (`SpeechSynthesisUtterance`, offline
via the device's own voices) — NOT in `banter.js`. ABC Train speaks the two flanking letter
names as a hint and the answer on success; Trace & Spell speaks each letter's NAME as you trace
it, the whole word ("sound it out") on completion, and re-reads on picture tap. Speech is gated
by the shared mute flag (`localStorage miniGames.muted`). We speak letter NAMES + whole WORDS,
not isolated phonemes — browser TTS can't make a clean `/b/` and a mangled "buh" hurts blending.
This is the *only* place browser TTS lives; the board/Eagle Eye games stay TTS-free (see note below). (Eagle Eye additionally supports *recorded* Hinglish voice clips — not TTS — via `shared/commentary/`.)

**Quick solo play (collecting games):**
`apple-collecting-game`, `collect-banana`, `broccoli-collection-game`.

**For little ones (under 4)** — big taps, no rules, no losing:
`bubble-pop`, `animal-tap`, `tap-fireworks`.

Docs: `README.md`. Landing: `index.html`.

## Shared module: `shared/banter.js`

Loaded by **every** game via `<script src="../shared/banter.js"></script>` (placed
before the game's own inline `<script>`). Exposes `window.Banter`:

- `askNames({title, slots:[{label,color}]}, cb)` — name-entry modal, prefilled from
  `localStorage` (key `miniGames.playerNames`), saved across sessions. `cb(namesArray)`.
  Also unlocks audio and **starts background music** on submit (the user gesture).
- `say(category, name, opts?)` — shows an **on-screen Hinglish commentary toast** and
  plays a matching sound. Categories: `start, good, great, capture, combo, sixer,
  unlucky, win`. `opts.mute` skips the sound so the game can play its own sfx instead.
  (Spoken text-to-speech voice was **intentionally removed** — toast only.)
- `turn(name, color, action)` — big persistent color-coded **"whose turn" banner**
  (auto-contrast text). Call it from each game's `updateHUD()`. `turnClear()` hides it —
  call in `win()/finish()` and any back-to-menu path.
- `sfx(name)` — synthesized sound. Names: `dice, drop, pot, strike, click, box,
  capture, snake, bite, ladder, six, great, combo, unlucky, good, start, win`.
- `startMusic()` / `stopMusic()` — soothing synth ambient loop (soft pad chords +
  pentatonic notes). Starts on game start; controlled by the mute toggle.
- `loadNames()` / `saveNames(arr)`.

Auto-injected on load in every game: a **🔊/🔇 mute button** (persists `miniGames.muted`,
mutes music + sfx) and a **🏠 home button** linking to `../index.html`.

All audio is **Web Audio synthesis** (no audio files, offline). Commentary lines live
in `LINES` as `[Latin, Devanagari]` pairs; only `pair[0]` (Latin) is used now, for the
toast (Devanagari was for the removed voice — safe to keep or repurpose).

## Adding a new game (checklist)

1. New folder + self-contained `index.html` (canvas + vanilla JS).
2. Load `../shared/banter.js`.
3. Collect names with `Banter.askNames` (skip for toddler games — just a big Play button).
4. Call `Banter.turn(name, color, action)` in `updateHUD()`; `Banter.turnClear()` on
   game end and when returning to the menu.
5. `Banter.sfx(...)` at events; `Banter.say(category, name)` for commentary moments.
6. Add a card in the root `index.html` (matching section) and a row in `README.md`.

## Verify changes (no browser available in past sessions)

Syntax-check a game's inline JS:
```
awk '/<script>/{flag=1;next}/<\/script>/{flag=0}flag' GAME/index.html > /tmp/c.js && node --check /tmp/c.js
```
Check `shared/banter.js` with `node --check shared/banter.js`.

## Deploy after changes

```
git add -A && git commit -m "..."   # author gjgaurav9, NO Claude co-author
git push origin main                # → GitHub Pages auto-builds
vercel deploy --prod --yes          # → Vercel (manual)
```

## Possible next steps (not done yet)

- Connect Vercel ↔ GitHub for auto-deploy (currently Vercel is manual).
- More toddler games (shapes/colors, peekaboo, counting); maybe a softer music track
  just for the kids' section.
- Playtest *feel* and tune: Carrom flick power/friction, dice/animation speed,
  commentary frequency, sfx volume. (These were verified by syntax-check + inspection,
  not live playtest.)
- Optional "Leave game?" confirm on the 🏠 button (currently navigates immediately).

**Note:** the spoken voice was removed from the board/Eagle Eye games and `banter.js` on purpose
— do not re-add TTS there unless asked. (Exception: the two kids' learning games `abc-missing-letter`
and `trace-and-spell` use Web Speech TTS by explicit request — see the Learn & play section.)
