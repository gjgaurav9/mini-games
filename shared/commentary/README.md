# Real Hinglish voice commentary (Dobble / Spot games)

The Dobble games show commentary in the **neutral centre strip** between the two cards
(so it never covers a player's card) and can speak it aloud with **real recorded clips**.

We deliberately do **NOT** use the browser's text-to-speech for this — it sounds robotic
and no native speaker accepts it as real Hinglish. Until clips are added, the game plays a
short synth cue instead. Drop real clips here and it switches to the real voice automatically.

## How to add the voice (one-time)

1. Record (or generate with a natural Hindi/Hinglish neural voice — e.g. ElevenLabs Hindi)
   short, upbeat lines. Keep each clip ~1–2 seconds. Export as small **.mp3**.
2. Save them in this folder with these names (record a few variants per category for variety):

   | Category | When it plays | Suggested lines |
   |----------|---------------|-----------------|
   | `start`  | match begins  | "Chalo, shuru karte hain!" · "All the best dono ko!" · "Ho jaaye muqabla!" |
   | `good`   | a correct tap | "Shabash!" · "Badhiya!" · "Sahi pakde!" |
   | `great`  | a sharp find  | "Kya baat! Maza aa gaya!" · "Wah wah, laajawaab!" · "Arre kya nazar hai!" |
   | `combo`  | 3-in-a-row    | "Double dhamaka!" · "Ek ke baad ek — rukna hi nahi!" |
   | `unlucky`| wrong tap     | "Oho, galat! Sambhal ke." · "Arre dhyaan se, koi na." |
   | `win`    | game won      | "Game jeet liya! Kya khela!" · "Take a bow — aaj ka champion!" |

   e.g. `great-1.mp3`, `great-2.mp3`, `win-1.mp3`, …

3. In **each** Dobble game's `index.html` (dobble-animals / dobble-food / dobble-classic),
   fill the `VOICE` map near the top of the `<script>`:

   ```js
   const VOICE = {
     start:   ["../shared/commentary/start-1.mp3", "../shared/commentary/start-2.mp3"],
     good:    ["../shared/commentary/good-1.mp3"],
     great:   ["../shared/commentary/great-1.mp3", "../shared/commentary/great-2.mp3"],
     combo:   ["../shared/commentary/combo-1.mp3"],
     unlucky: ["../shared/commentary/unlucky-1.mp3"],
     win:     ["../shared/commentary/win-1.mp3"],
   };
   ```

That's it — the games pick a random clip per moment, respect the 🔇 mute button, and fall
back to the synth cue for any category left empty. Clips are static files, so it all still
works offline.
