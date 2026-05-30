# 🎮 Pass & Play — Mini Games

Mini games for **one shared phone**. No servers, no accounts, no online matchmaking — your phone *is* the board. Put it on the table, gather round with friends and family, and take turns on the same screen, just like the old days.

Each game is a single, self-contained `index.html` (HTML5 canvas + vanilla JavaScript) — no build step, no dependencies, works offline.

## ▶ Play online

**https://gjgaurav9.github.io/mini-games/**

## 🪑 Gather round — board games (2–4 players, one device)

| | Game | Description |
|---|------|-------------|
| 🎯 | **[Carrom](carrom-board-game/index.html)** | 2-player (White vs Black) or 4-player (2-v-2 partners). Flick the striker to pot your colour — pot one of yours and you go again, miss and pass the phone. Cover the Queen! The striker baseline rotates to whoever's turn it is. |
| 🎲 | **[Ludo](ludo/index.html)** | 2–4 players. Roll a 6 to leave base, race your four tokens around and up your home lane to the centre, and capture rivals by landing on them. Sixes, captures and reaching home grant an extra turn. First to get all four tokens home wins. |
| 🐍 | **[Snakes & Ladders](snake-and-ladder/index.html)** | 2–4 players. Tap the dice, climb the ladders, slide down the snakes, and race to 100 (exact roll to finish). Roll a 6 and go again. |
| 🔴 | **[Connect 4](connect-4/index.html)** | 2 players. Take turns dropping discs into the columns — first to line up four in a row (across, down or diagonally) wins. |
| ⬛ | **[Dots & Boxes](dots-and-boxes/index.html)** | 2–4 players, choose grid size. Draw one line per turn; close the fourth side of a box to claim it and go again. Most boxes wins. |
| ♟️ | **[Checkers](checkers/index.html)** | 2 players. Diagonal moves, compulsory captures, multi-jumps and King promotion. Take all the rival's pieces (or leave them with no move) to win. |

## 🕹️ Quick solo play

| | Game | Description |
|---|------|-------------|
| 🍎 | **[Apples for Mom](apple-collecting-game/index.html)** | Help Lily walk home, collect apples and jump the puddles, then give them all to Mom. |
| 🍌 | **[Collect Banana](collect-banana/index.html)** | Maya shakes the banana trees, catches the falling bananas, and brings the bunch home to Mom. |
| 🥦 | **[Broccoli Garden](broccoli-collection-game/index.html)** | Ben picks ripe broccoli from the garden beds before the hungry bunnies nibble it, then brings the harvest home to Mom. |

## Controls

**Board games (pass the phone between turns):**
- **Carrom** — drag the striker along your line to position it, then pull back and release to flick (mouse or touch). The active player's side glows.
- **Ludo / Snakes & Ladders** — tap the dice to roll on your turn; in Ludo, tap which token to move when you have a choice.

**Solo games:**
- **← →** — walk
- **↑ / Space** — jump (Apples), shake the tree (Banana), or pick the broccoli (Broccoli Garden)
- **Mobile** — tap the screen sides to walk, tap the middle to jump / shake / pick

## Names & commentary 🎙️

Every game asks for player **names** on the start screen (saved in your browser's
`localStorage`, so they're pre-filled next time). During play, a shared commentary
engine ([`shared/banter.js`](shared/banter.js)) cheers players on at big moments
with fun **Hinglish** dialogue — captures, combos, sixes, ladders, wins and more —
inspired by Sidhuisms and gully-cricket banter (*“Kya baat {name}, maza aa gaya!”*,
*“Saanp kha gaya {name} ko!”*). It's a single self-contained module each game loads.

## Design idea

This collection is built around **local, offline, pass-and-play** fun: everyone sits together around a single phone instead of each playing alone on their own device and connecting to a server. The constraints (one screen, no backend) are the point — it's zero-friction and brings back the feeling of a real board game night.

## Running locally

```bash
open index.html          # the landing page
```

Or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Adding a new game

1. Create a new folder with its own self-contained `index.html`.
2. Add a card linking to it in the root `index.html`.
3. Add a row to the relevant table above.
4. Prefer **local multiplayer / pass-and-play** designs to fit the collection.

---

*More gather-round games coming soon ✨*
