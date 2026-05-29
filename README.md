# 🎮 Mini Games

A cozy little collection of browser mini-games. Each one is a single, self-contained `index.html` (HTML5 canvas + vanilla JavaScript) — no build step, no dependencies. Just open and play.

## ▶ Play online

**https://gjgaurav9.github.io/mini-games/**

## Games

| | Game | Description |
|---|------|-------------|
| 🍎 | **[Apples for Mom](apple-collecting-game/index.html)** | Help Lily walk home, collect apples and jump the puddles, then give them all to Mom. |
| 🍌 | **[Collect Banana](collect-banana/index.html)** | Maya shakes the banana trees, catches the falling bananas, and brings the bunch home to Mom. |
| 🥦 | **[Broccoli Garden](broccoli-collection-game/index.html)** | Ben picks ripe broccoli from the garden beds before the hungry bunnies nibble it, then brings the harvest home to Mom. |
| 🎯 | **[Carrom (Karam)](carrom-board-game/index.html)** | The classic board game — slingshot the striker to pot all 19 coins and the Queen into the corner pockets in as few strikes as possible. |

## Controls

- **← →** — walk (collection games) / nudge the striker (Carrom)
- **↑ / Space** — jump (Apples), shake the tree (Banana), or pick the broccoli (Broccoli Garden)
- **Carrom** — drag the striker left/right to position it, then pull back from it and release to flick (works with mouse or touch)
- **Mobile** — tap the screen sides to walk, tap the middle to jump / shake / pick

## Running locally

Just open `index.html` in any modern browser:

```bash
open index.html          # the landing page
```

Or serve the folder if you prefer a local web server:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Adding a new game

1. Create a new folder with its own self-contained `index.html`.
2. Add a card linking to it in the root `index.html`.
3. Add a row to the table above.

---

*More games coming soon ✨*
