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

  // ---------- commentary bank (Hinglish): [ toast text (Latin), spoken text (Devanagari) ] ----------
  // Latin is shown on screen; the Devanagari is what a hi-IN voice speaks, so it sounds properly Hindi.
  const LINES = {
    start: [
      ["Chalo {name}, dikhao apna jalwa!", "चलो {name}, दिखाओ अपना जलवा!"],
      ["All the best {name} — khul ke khel!", "ऑल द बेस्ट {name}, खुल के खेल!"],
      ["{name} ki baari — pressure mat lena, maza lena!", "{name} की बारी, प्रेशर मत लेना, मज़ा लेना!"],
      ["Aa gaya apna champion {name}!", "आ गया अपना चैंपियन {name}!"],
    ],
    good: [
      ["Shabash {name}!", "शाबाश {name}!"],
      ["Wah {name}, badhiya chaal!", "वाह {name}, बढ़िया चाल!"],
      ["Nice {name} — aise hi chalte reh!", "नाइस {name}, ऐसे ही चलते रह!"],
      ["{name} warming up ho raha hai!", "{name} वॉर्मिंग अप हो रहा है!"],
      ["Solid {name}! Control toh dekho.", "सॉलिड {name}! कंट्रोल तो देखो।"],
      ["Theek thaak {name}, lage raho!", "ठीक ठाक {name}, लगे रहो!"],
    ],
    great: [
      ["Kya baat {name}! Maza aa gaya!", "क्या बात {name}! मज़ा आ गया!"],
      ["Arre {name}, kya khel raha hai bhai!", "अरे {name}, क्या खेल रहा है भाई!"],
      ["{name} ne maara tracer bullet!", "{name} ने मारा ट्रेसर बुलेट!"],
      ["{name} on fire! Pura cycle-stand gir gaya!", "{name} ऑन फ़ायर! पूरा साइकिल स्टैंड गिर गया!"],
      ["Laajawaab {name}! Crowd pagal ho gayi!", "लाजवाब {name}! क्राउड पागल हो गई!"],
      ["Wah wah {name}! Ye hui na baat!", "वाह वाह {name}! ये हुई ना बात!"],
      ["Haaye {name}, dil jeet liya!", "हाय {name}, दिल जीत लिया!"],
    ],
    capture: [
      ["Ouch! {name} ne dho daala!", "ओह! {name} ने धो डाला!"],
      ["{name} ne seedha ghar bhej diya — bye bye!", "{name} ने सीधा घर भेज दिया, बाय बाय!"],
      ["Daring {name}! Kya shikaar hai!", "डेयरिंग {name}! क्या शिकार है!"],
      ["{name} ka attack! Sambhalo apne aap ko!", "{name} का अटैक! संभालो अपने आप को!"],
      ["Rok lo isko — {name} bhaari pad raha hai!", "रोक लो इसको, {name} भारी पड़ रहा है!"],
    ],
    combo: [
      ["Double dhamaka {name}!", "डबल धमाका {name}!"],
      ["{name} ek ke baad ek — rok hi nahi raha!", "{name} एक के बाद एक, रुक ही नहीं रहा!"],
      ["Combo king {name}! Dimaag ghoom gaya!", "कॉम्बो किंग {name}! दिमाग़ घूम गया!"],
      ["Hat-trick wali feeling {name}!", "हैट ट्रिक वाली फ़ीलिंग {name}!"],
    ],
    sixer: [
      ["Chhakka! {name} rolls a six!", "छक्का! {name} ने फेंका छह!"],
      ["{name} ko mila six — ek aur baari, lucky!", "{name} को मिला छह, एक और बारी, लकी!"],
      ["Sixer {name}! Phir se phenk, kismat saath hai!", "सिक्सर {name}! फिर से फेंक, किस्मत साथ है!"],
      ["Chhe aaya {name}! Aag laga di!", "छह आया {name}! आग लगा दी!"],
    ],
    unlucky: [
      ["Oof {name}, bad luck! Aisa hota hai.", "ओफ़ {name}, बैड लक! ऐसा होता है।"],
      ["Arre {name}, sambhal ke — tension mat le.", "अरे {name}, संभल के, टेंशन मत ले।"],
      ["Saanp kha gaya {name} ko! Wapas neeche!", "साँप खा गया {name} को! वापस नीचे!"],
      ["Thoda ulta pad gaya {name}, koi na — agli baari pakki!", "थोड़ा उल्टा पड़ गया {name}, कोई ना, अगली बारी पक्की!"],
      ["Itni si baat pe? Wapas khade ho jao {name}!", "इतनी सी बात पे? वापस खड़े हो जाओ {name}!"],
    ],
    win: [
      ["{name} is the champion! Kya khela, kya khela!", "{name} इज़ द चैंपियन! क्या खेला, क्या खेला!"],
      ["Game, set, match — {name}! Maza aa gaya!", "गेम सेट मैच, {name}! मज़ा आ गया!"],
      ["{name} ne baazi maar li! Crowd on its feet!", "{name} ने बाज़ी मार ली! क्राउड ऑन इट्स फ़ीट!"],
      ["Take a bow {name}! Aaj ka hero!", "टेक अ बाउ {name}! आज का हीरो!"],
      ["{name} ne kar dikhaya! Itihaas ban gaya!", "{name} ने कर दिखाया! इतिहास बन गया!"],
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
  // a single dice "clack" on a board: noisy transient + short woody body, scheduled at time t
  function clack(a, t, freq, dur, vol) {
    const n = Math.floor(a.sampleRate * dur);
    const buf = a.createBuffer(1, n, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
    const src = a.createBufferSource(); src.buffer = buf;
    const bp = a.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = freq; bp.Q.value = 1.3;
    const g = a.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp).connect(g).connect(a.destination); src.start(t); src.stop(t + dur + 0.02);
    const o = a.createOscillator(); o.type = "triangle"; o.frequency.setValueAtTime(freq * 0.32, t);
    const g2 = a.createGain(); g2.gain.setValueAtTime(vol * 0.5, t); g2.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.8);
    o.connect(g2).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
  }

  const SFX = {
    dice() {
      const a = ac(); if (!a || muted) return;
      const now = a.currentTime;
      const count = 6 + Math.floor(Math.random() * 2);
      let t = now;
      for (let i = 0; i < count; i++) {            // tumbling clacks, speeding up then slowing
        clack(a, t, 850 + Math.random() * 1700, 0.045 + Math.random() * 0.03, 0.13);
        t += 0.05 + Math.random() * 0.04;
      }
      clack(a, t + 0.05, 480, 0.13, 0.22);          // final settle thunk
    },
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

  // ===================== SOOTHING BACKGROUND MUSIC =====================
  // A gentle synthesized ambient loop (soft pad chords + occasional pentatonic
  // notes) — no audio files, fully offline. Starts when a game begins.
  let musicGain = null, musicTimer = null, musicStep = 0, musicOn = false;
  // calm progression: C major, G, A minor, F (low, warm)
  const PROG = [
    [130.81, 164.81, 196.00],
    [196.00, 246.94, 293.66],
    [110.00, 130.81, 164.81],
    [87.31, 110.00, 130.81],
  ];
  const MELODY = [523.25, 587.33, 659.25, 783.99, 880.00]; // C-pentatonic, soft & sweet

  function padNote(a, f, t, dur, vol, bright) {
    const o = a.createOscillator(); o.type = bright ? "triangle" : "sine"; o.frequency.value = f;
    const o2 = a.createOscillator(); o2.type = "sine"; o2.frequency.value = f; o2.detune.value = 7;
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + (bright ? 0.2 : 0.9));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const lp = a.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = bright ? 2200 : 1100;
    o.connect(g); o2.connect(g); g.connect(lp).connect(musicGain);
    o.start(t); o2.start(t); o.stop(t + dur + 0.1); o2.stop(t + dur + 0.1);
  }
  function musicTick() {
    if (!musicOn || muted) { musicTimer = null; return; }
    const a = ac(); if (!a) { musicTimer = setTimeout(musicTick, 1500); return; }
    const t = a.currentTime + 0.05;
    const chord = PROG[musicStep % PROG.length]; musicStep++;
    chord.forEach((f) => padNote(a, f, t, 3.6, 0.05, false));
    if (musicStep % 2 === 0) padNote(a, MELODY[Math.floor(Math.random() * MELODY.length)], t + 0.4, 1.8, 0.035, true);
    musicTimer = setTimeout(musicTick, 3000);
  }
  function startMusic() {
    const a = ac(); if (!a) return;
    if (!musicGain) { musicGain = a.createGain(); musicGain.gain.value = 0.6; musicGain.connect(a.destination); }
    if (musicOn || muted) return;
    musicOn = true;
    if (!musicTimer) musicTick();
  }
  function stopMusic() {
    musicOn = false;
    if (musicTimer) { clearTimeout(musicTimer); musicTimer = null; }
  }

  // ===================== DOM (toast + mute button) =====================
  const css = `
  #banterToast{position:fixed;top:104px;left:50%;transform:translateX(-50%) translateY(-14px);
    z-index:60;max-width:90vw;background:rgba(20,28,40,0.94);color:#fff;font-family:"Comic Sans MS","Trebuchet MS",sans-serif;
    font-size:clamp(15px,3.6vw,22px);font-weight:bold;padding:11px 20px;border-radius:18px;
    box-shadow:0 8px 24px rgba(0,0,0,0.45);border:2px solid rgba(241,196,15,0.85);
    opacity:0;pointer-events:none;transition:opacity .25s, transform .25s;text-align:center;white-space:normal;}
  #banterToast.show{opacity:1;transform:translateX(-50%) translateY(0);}
  #banterTurn{position:fixed;top:52px;left:50%;transform:translateX(-50%);z-index:58;display:none;
    font-family:"Comic Sans MS","Trebuchet MS",sans-serif;font-weight:bold;font-size:clamp(16px,4.4vw,28px);
    color:#fff;padding:8px 22px;border-radius:30px;box-shadow:0 6px 18px rgba(0,0,0,0.4);
    border:3px solid rgba(255,255,255,0.9);max-width:94vw;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
    text-shadow:0 1px 3px rgba(0,0,0,0.4);pointer-events:none;}
  #banterTurn.show{display:block;}
  @keyframes banterTurnPop{0%{transform:translateX(-50%) scale(.65);}60%{transform:translateX(-50%) scale(1.12);}100%{transform:translateX(-50%) scale(1);}}
  #banterTurn.pop{animation:banterTurnPop .35s ease-out;}
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
    const turnEl = document.createElement("div");
    turnEl.id = "banterTurn";
    document.body.appendChild(turnEl);
    const mute = document.createElement("button");
    mute.id = "banterMute";
    mute.textContent = muted ? "🔇" : "🔊";
    mute.title = "Sound on/off";
    mute.addEventListener("click", () => {
      muted = !muted;
      try { localStorage.setItem(MUTE_KEY, muted ? "1" : "0"); } catch (e) {}
      mute.textContent = muted ? "🔇" : "🔊";
      if (muted) stopMusic();
      else { sfx("good"); startMusic(); }
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
    const pair = pick(cat);
    const latin = pair[0].replace(/\{name\}/g, name || "Player");
    const el = document.getElementById("banterToast");
    el.textContent = (EMOJI[cat] ? EMOJI[cat] + " " : "") + latin;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2700);
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
      ac(); startMusic(); // unlock audio + begin soothing background music on this gesture
      const names = inputs.map((inp, i) => (inp.value.trim() || slots[i].label).slice(0, 14));
      saveNames(names);
      modal.remove();
      cb(names);
    }
    modal.querySelector(".banterGo").addEventListener("click", finish);
    inputs.forEach((inp) => inp.addEventListener("keydown", (e) => { if (e.key === "Enter") finish(); }));
  }

  // ---------- persistent "whose turn" banner ----------
  function textColorFor(bg) {
    if (!bg || bg[0] !== "#") return "#fff";
    let h = bg.slice(1); if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62 ? "#2c3e50" : "#fff";
  }
  let lastTurnText = "";
  function turn(name, color, action) {
    ensureDom();
    const el = document.getElementById("banterTurn");
    const txt = "👉 " + (name || "Player") + (action ? " — " + action : "");
    el.style.background = color || "#2c3e50";
    el.style.color = textColorFor(color);
    el.classList.add("show");
    if (txt !== lastTurnText) {
      el.textContent = txt; lastTurnText = txt;
      el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop");
    }
  }
  function turnClear() {
    const el = document.getElementById("banterTurn");
    if (el) el.classList.remove("show");
    lastTurnText = "";
  }

  window.Banter = { askNames, say, sfx, turn, turnClear, startMusic, stopMusic, loadNames, saveNames };

  // show the 🏠 home + 🔊 mute controls right away, even before a game starts
  if (document.body) ensureDom();
  else document.addEventListener("DOMContentLoaded", ensureDom);
})();
