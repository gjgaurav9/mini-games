/* Shared "Pass & Play" helpers used by every mini-game:
   - Banter.askNames({ title, slots }, cb)  → name-entry modal, prefilled from
     localStorage, saved across sessions. cb receives an array of names.
   - Banter.say(category, name, opts?)      → commentary toast + spoken line
     (Web Speech) + a matching sound. opts.mute skips the sound (so the game can
     play its own custom sfx instead).
   - Banter.sfx(name)                        → play a synthesized sound effect.
   - Banter.loadNames() / saveNames(arr)     → raw access to stored names.

   Sounds are synthesized with the Web Audio API and speech uses
   SpeechSynthesis, so there are no asset files and everything works offline.
   A 🔊/🔇 mute toggle (bottom-left) controls both, remembered per device. */
(function () {
  "use strict";
  const KEY = "miniGames.playerNames";
  const MUTE_KEY = "miniGames.muted";

  function loadNames() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; }
  }
  function saveNames(arr) {
    try { localStorage.setItem(KEY, JSON.stringify(arr.slice(0, 4))); } catch (e) {}
  }

  let muted = false;
  try { muted = localStorage.getItem(MUTE_KEY) === "1"; } catch (e) {}

  // ---------- commentary bank (Hinglish, inspired by Sidhuisms + gully-cricket banter) ----------
  const LINES = {
    start: [
      "Chalo {name}, dikhao apna jalwa!",
      "All the best {name} — khul ke khel!",
      "{name} ki baari — pressure mat lena, maza lena!",
      "Aa gaya apna champion {name}!",
    ],
    good: [
      "Shabash {name}!",
      "Wah {name}, badhiya chaal!",
      "Nice {name} — aise hi chalte reh!",
      "{name} warming up ho raha hai!",
      "Solid {name}! Control toh dekho.",
      "Theek thaak {name}, lage raho!",
    ],
    great: [
      "Kya baat {name}! Maza aa gaya!",
      "Arre {name}, kya khel raha hai bhai!",
      "{name} ne maara tracer bullet!",
      "{name} on fire! Pura cycle-stand gir gaya!",
      "Laajawaab {name}! Crowd pagal ho gayi!",
      "Wah wah {name}! Ye hui na baat!",
      "Haaye {name}, dil jeet liya!",
    ],
    capture: [
      "Ouch! {name} ne dho daala!",
      "{name} ne seedha ghar bhej diya — bye bye!",
      "Daring {name}! Kya shikaar hai!",
      "{name} ka attack! Sambhalo apne aap ko!",
      "Rok lo isko — {name} bhaari pad raha hai!",
    ],
    combo: [
      "Double dhamaka {name}!",
      "{name} ek ke baad ek — rok hi nahi raha!",
      "Combo king {name}! Dimaag ghoom gaya!",
      "Hat-trick wali feeling {name}!",
    ],
    sixer: [
      "Chhakka! {name} rolls a six!",
      "{name} ko mila six — ek aur baari, lucky!",
      "Sixer {name}! Phir se phenk, kismat saath hai!",
      "Chhe aaya {name}! Aag laga di!",
    ],
    unlucky: [
      "Oof {name}, bad luck! Aisa hota hai.",
      "Arre {name}, sambhal ke — tension mat le.",
      "Saanp kha gaya {name} ko! Wapas neeche!",
      "Thoda ulta pad gaya {name}, koi na — agli baari pakki!",
      "Itni si baat pe? Wapas khade ho jao {name}!",
    ],
    win: [
      "{name} is the champion! Kya khela, kya khela!",
      "Game, set, match — {name}! Maza aa gaya!",
      "{name} ne baazi maar li! Crowd on its feet!",
      "Take a bow {name}! Aaj ka hero!",
      "{name} ne kar dikhaya! Itihaas ban gaya!",
    ],
  };
  // emoji to prepend in the toast (speech reads the clean text only)
  const EMOJI = { start: "🎮", good: "👍", great: "🤩", capture: "😈", combo: "💥", sixer: "🎲", unlucky: "😬", win: "🏆" };

  let lastLine = "";
  function pick(cat) {
    const arr = LINES[cat] || LINES.good;
    let line = arr[Math.floor(Math.random() * arr.length)];
    if (arr.length > 1 && line === lastLine) line = arr[(arr.indexOf(line) + 1) % arr.length];
    lastLine = line;
    return line;
  }

  // ===================== AUDIO (Web Audio synth) =====================
  let actx = null;
  function ac() {
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === "suspended") actx.resume();
    } catch (e) {}
    return actx;
  }
  // unlock audio on the first user gesture (browsers require it)
  ["pointerdown", "keydown", "touchstart"].forEach((ev) =>
    window.addEventListener(ev, ac, { once: true, passive: true }));

  function tone(o) {
    const a = ac(); if (!a || muted) return;
    const osc = a.createOscillator(), g = a.createGain();
    osc.type = o.type || "sine";
    const t0 = a.currentTime + (o.delay || 0);
    osc.frequency.setValueAtTime(o.f, t0);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.f2), t0 + o.dur);
    const vol = o.vol == null ? 0.2 : o.vol;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    osc.connect(g).connect(a.destination);
    osc.start(t0); osc.stop(t0 + o.dur + 0.03);
  }
  function noise(dur, vol, hp) {
    const a = ac(); if (!a || muted) return;
    const n = Math.floor(a.sampleRate * dur);
    const buf = a.createBuffer(1, n, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = a.createBufferSource(); src.buffer = buf;
    const g = a.createGain();
    g.gain.setValueAtTime(vol || 0.2, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
    const f = a.createBiquadFilter(); f.type = "highpass"; f.frequency.value = hp || 700;
    src.connect(f).connect(g).connect(a.destination);
    src.start();
  }

  const SFX = {
    dice() { for (let i = 0; i < 5; i++) tone({ f: 180 + Math.random() * 320, f2: 110, dur: 0.05, type: "square", vol: 0.12, delay: i * 0.085 }); noise(0.14, 0.05); },
    drop() { tone({ f: 520, f2: 120, dur: 0.18, type: "sine", vol: 0.25 }); },
    pot() { tone({ f: 720, f2: 200, dur: 0.14, type: "triangle", vol: 0.2 }); noise(0.05, 0.04); },
    strike() { tone({ f: 280, f2: 620, dur: 0.07, type: "square", vol: 0.15 }); },
    click() { tone({ f: 440, f2: 300, dur: 0.05, type: "square", vol: 0.12 }); },
    box() { tone({ f: 600, f2: 920, dur: 0.12, type: "triangle", vol: 0.18 }); },
    capture() { tone({ f: 320, f2: 80, dur: 0.18, type: "sawtooth", vol: 0.22 }); noise(0.08, 0.07); },
    snake() { tone({ f: 620, f2: 90, dur: 0.5, type: "sawtooth", vol: 0.2 }); noise(0.42, 0.05, 1200); },
    bite() { tone({ f: 200, f2: 70, dur: 0.12, type: "square", vol: 0.22 }); noise(0.1, 0.09, 500); },
    ladder() { [330, 440, 550, 660].forEach((f, i) => tone({ f, dur: 0.12, type: "triangle", vol: 0.16, delay: i * 0.07 })); },
    six() { [880, 1175].forEach((f, i) => tone({ f, dur: 0.13, type: "triangle", vol: 0.18, delay: i * 0.06 })); },
    great() { [660, 880].forEach((f, i) => tone({ f, dur: 0.12, type: "triangle", vol: 0.16, delay: i * 0.06 })); },
    combo() { [700, 900, 1100].forEach((f, i) => tone({ f, dur: 0.1, type: "triangle", vol: 0.16, delay: i * 0.05 })); },
    unlucky() { tone({ f: 400, f2: 150, dur: 0.3, type: "sawtooth", vol: 0.18 }); },
    good() { tone({ f: 600, dur: 0.1, type: "triangle", vol: 0.14 }); },
    start() { [440, 660].forEach((f, i) => tone({ f, dur: 0.12, type: "triangle", vol: 0.14, delay: i * 0.08 })); },
    win() { [523, 659, 784, 1047].forEach((f, i) => tone({ f, dur: 0.18, type: "triangle", vol: 0.2, delay: i * 0.12 })); },
  };
  function sfx(name) { const fn = SFX[name]; if (fn) try { fn(); } catch (e) {} }

  // ===================== SPEECH =====================
  function pickVoice() {
    if (!("speechSynthesis" in window)) return null;
    const vs = speechSynthesis.getVoices() || [];
    return vs.find((v) => /en[-_]IN/i.test(v.lang)) || vs.find((v) => /hi[-_]IN/i.test(v.lang)) ||
           vs.find((v) => /^en/i.test(v.lang)) || vs[0] || null;
  }
  function stripEmoji(s) {
    return s.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "")
            .replace(/[←-⇿⌀-➿⬀-⯿️‍]/g, "")
            .replace(/\s+/g, " ").trim();
  }
  function speak(text) {
    if (muted || !("speechSynthesis" in window)) return;
    const clean = stripEmoji(text);
    if (!clean) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(clean);
      u.rate = 1.06; u.pitch = 1.05; u.volume = 1;
      const v = pickVoice(); if (v) { u.voice = v; u.lang = v.lang; }
      speechSynthesis.speak(u);
    } catch (e) {}
  }
  if ("speechSynthesis" in window) { try { speechSynthesis.onvoiceschanged = pickVoice; } catch (e) {} }

  // ===================== DOM (toast + mute button) =====================
  const css = `
  #banterToast{position:fixed;top:60px;left:50%;transform:translateX(-50%) translateY(-14px);
    z-index:60;max-width:90vw;background:rgba(20,28,40,0.94);color:#fff;font-family:"Comic Sans MS","Trebuchet MS",sans-serif;
    font-size:clamp(15px,3.6vw,22px);font-weight:bold;padding:11px 20px;border-radius:18px;
    box-shadow:0 8px 24px rgba(0,0,0,0.45);border:2px solid rgba(241,196,15,0.85);
    opacity:0;pointer-events:none;transition:opacity .25s, transform .25s;text-align:center;white-space:normal;}
  #banterToast.show{opacity:1;transform:translateX(-50%) translateY(0);}
  #banterMute{position:fixed;left:12px;bottom:12px;z-index:62;width:42px;height:42px;border-radius:50%;
    border:none;cursor:pointer;font-size:20px;background:rgba(255,255,255,0.9);box-shadow:0 3px 8px rgba(0,0,0,0.35);}
  #banterMute:active{transform:translateY(2px);}
  #banterHome{position:fixed;left:62px;bottom:12px;z-index:62;width:42px;height:42px;border-radius:50%;
    display:flex;align-items:center;justify-content:center;text-decoration:none;font-size:20px;
    background:rgba(255,255,255,0.9);box-shadow:0 3px 8px rgba(0,0,0,0.35);}
  #banterHome:active{transform:translateY(2px);}
  .banterModal{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;
    background:rgba(0,0,0,0.72);padding:20px;font-family:"Comic Sans MS","Trebuchet MS",sans-serif;}
  .banterCard{background:#fff;color:#2c3e50;border-radius:24px;padding:24px 22px;max-width:420px;width:100%;
    box-shadow:0 18px 48px rgba(0,0,0,0.5);text-align:center;}
  .banterCard h2{font-size:clamp(22px,5vw,30px);margin-bottom:4px;}
  .banterCard .sub{font-size:14px;color:#7f8c8d;margin-bottom:16px;}
  .banterRow{display:flex;align-items:center;gap:10px;margin:9px 0;}
  .banterDot{width:22px;height:22px;border-radius:50%;flex:0 0 auto;border:2px solid rgba(0,0,0,0.15);}
  .banterRow input{flex:1;font-family:inherit;font-size:18px;padding:10px 12px;border:2px solid #dfe6e9;
    border-radius:12px;outline:none;color:#2c3e50;min-width:0;}
  .banterRow input:focus{border-color:#f1c40f;}
  .banterGo{margin-top:16px;width:100%;padding:13px;font-family:inherit;font-size:20px;border:none;border-radius:14px;
    background:#f1c40f;color:#5a4500;cursor:pointer;box-shadow:0 5px 0 #b8860b;}
  .banterGo:active{transform:translateY(3px);box-shadow:0 2px 0 #b8860b;}
  `;
  function ensureDom() {
    if (document.getElementById("banterToast")) return;
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
    const toast = document.createElement("div");
    toast.id = "banterToast";
    document.body.appendChild(toast);
    const mute = document.createElement("button");
    mute.id = "banterMute";
    mute.textContent = muted ? "🔇" : "🔊";
    mute.title = "Sound on/off";
    mute.addEventListener("click", () => {
      muted = !muted;
      try { localStorage.setItem(MUTE_KEY, muted ? "1" : "0"); } catch (e) {}
      mute.textContent = muted ? "🔇" : "🔊";
      if (muted && "speechSynthesis" in window) try { speechSynthesis.cancel(); } catch (e) {}
      if (!muted) sfx("good");
    });
    document.body.appendChild(mute);
    const home = document.createElement("a");
    home.id = "banterHome";
    home.href = "../index.html";
    home.textContent = "🏠";
    home.title = "Back to all games";
    document.body.appendChild(home);
  }

  let toastTimer = null;
  function say(cat, name, opts) {
    ensureDom();
    const line = pick(cat).replace(/\{name\}/g, name || "Player");
    const el = document.getElementById("banterToast");
    el.textContent = (EMOJI[cat] ? EMOJI[cat] + " " : "") + line;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2700);
    speak(line);
    if (!(opts && opts.mute)) sfx(cat === "sixer" ? "six" : cat);
  }

  // ---------- name entry modal ----------
  function askNames(opts, cb) {
    ensureDom();
    const slots = opts.slots || [];
    const stored = loadNames();
    const modal = document.createElement("div");
    modal.className = "banterModal";
    const rows = slots.map((s, i) =>
      `<div class="banterRow">
         <span class="banterDot" style="background:${s.color || "#bbb"}"></span>
         <input type="text" maxlength="14" placeholder="${s.label}" value="${(stored[i] || "").replace(/"/g, "")}" data-i="${i}">
       </div>`).join("");
    modal.innerHTML =
      `<div class="banterCard">
         <h2>${opts.title || "Who's playing? 🎮"}</h2>
         <div class="sub">Names are saved on this phone for next time.</div>
         ${rows}
         <button class="banterGo">Let's play! 🚀</button>
       </div>`;
    document.body.appendChild(modal);
    const inputs = [...modal.querySelectorAll("input")];
    if (inputs[0]) setTimeout(() => inputs[0].focus(), 50);
    function finish() {
      ac(); // unlock audio via this gesture
      const names = inputs.map((inp, i) => (inp.value.trim() || slots[i].label).slice(0, 14));
      saveNames(names);
      modal.remove();
      cb(names);
    }
    modal.querySelector(".banterGo").addEventListener("click", finish);
    inputs.forEach((inp) => inp.addEventListener("keydown", (e) => { if (e.key === "Enter") finish(); }));
  }

  window.Banter = { askNames, say, sfx, loadNames, saveNames };

  // show the 🏠 home + 🔊 mute controls right away, even before a game starts
  if (document.body) ensureDom();
  else document.addEventListener("DOMContentLoaded", ensureDom);
})();
