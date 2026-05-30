/* Shared "Pass & Play" helpers used by every mini-game:
   - Banter.askNames({ title, slots }, cb)  → name-entry modal, prefilled from
     localStorage, saved across sessions. cb receives an array of names.
   - Banter.say(category, name)             → pops a Hinglish commentary toast.
   - Banter.loadNames() / saveNames(arr)    → raw access to stored names.

   Self-contained: injects its own CSS + DOM. No dependencies. */
(function () {
  "use strict";
  const KEY = "miniGames.playerNames";

  function loadNames() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; }
  }
  function saveNames(arr) {
    try { localStorage.setItem(KEY, JSON.stringify(arr.slice(0, 4))); } catch (e) {}
  }

  // ---------- commentary bank (Hinglish, inspired by Sidhuisms + gully-cricket banter) ----------
  const LINES = {
    start: [
      "Chalo {name}, dikhao apna jalwa! 🔥",
      "All the best {name} — khul ke khel! 😎",
      "{name} ki baari — pressure mat lena, maza lena! 🙌",
      "Aa gaya apna champion {name}! 👑",
    ],
    good: [
      "Shabash {name}! 👏",
      "Wah {name}, badhiya chaal! 👍",
      "Nice {name} — aise hi chalte reh! 🔥",
      "{name} warming up ho raha hai… 😏",
      "Solid {name}! Control toh dekho. 💪",
      "Theek thaak {name}, lage raho! 👌",
    ],
    great: [
      "Kya baat {name}! Maza aa gaya! 🤩",
      "Arre {name}, kya khel raha hai bhai! 🙌",
      "Sidhu hota toh kehta — '{name} ne maara tracer bullet!' 🚀",
      "{name} on fire! Pura cycle-stand gir gaya! 😆🔥",
      "Laajawaab {name}! Crowd pagal ho gayi! 🎉",
      "Wah wah {name}! Ye hui na baat! 💯",
      "Haaye {name}, dil jeet liya! ❤️🔥",
    ],
    capture: [
      "Ouch! {name} ne dho daala! 😈",
      "{name} ne seedha ghar bhej diya — bye bye! 👋😂",
      "Daring {name}! Kya shikaar hai! 🎯",
      "{name} ka attack! Sambhalo apne aap ko! ⚔️",
      "Rok lo isko — {name} bhaari pad raha hai! 🥵",
    ],
    combo: [
      "Double dhamaka {name}! 💥💥",
      "{name} ek ke baad ek — rok hi nahi raha! 🚂🔥",
      "Combo king {name}! Dimaag ghoom gaya! 🤯",
      "Hat-trick wali feeling {name}! 🎩✨",
    ],
    sixer: [
      "Chhakka! {name} rolls a SIX! 🎲🔥",
      "{name} ko mila six — ek aur baari, lucky! 😏",
      "Sixer {name}! Phir se phenk, kismat saath hai! 🍀",
      "Chhe aaya {name}! Aag laga di! 🔥",
    ],
    unlucky: [
      "Oof {name}, bad luck! Aisa hota hai. 😬",
      "Arre {name}, sambhal ke — tension mat le. 🙃",
      "Saanp kha gaya {name} ko! 🐍 Wapas neeche! 😂",
      "Thoda ulta pad gaya {name}, koi na — agli baari pakki! 💪",
      "Itni si baat pe? Wapas khade ho jao {name}! 😅",
    ],
    win: [
      "🏆 {name} is the CHAMPION! Kya khela, kya khela!",
      "Game, set, match — {name}! 👑 Maza aa gaya!",
      "{name} ne baazi maar li! Crowd on its feet! 🎉🔥",
      "Take a bow {name}! 🙇 Aaj ka hero!",
      "{name} ne kar dikhaya! Itihaas ban gaya! 📜🔥",
    ],
  };

  let lastLine = "";
  function pick(cat) {
    const arr = LINES[cat] || LINES.good;
    let line = arr[Math.floor(Math.random() * arr.length)];
    if (arr.length > 1 && line === lastLine) line = arr[(arr.indexOf(line) + 1) % arr.length];
    lastLine = line;
    return line;
  }

  // ---------- styles ----------
  const css = `
  #banterToast{position:fixed;top:60px;left:50%;transform:translateX(-50%) translateY(-14px);
    z-index:60;max-width:90vw;background:rgba(20,28,40,0.94);color:#fff;font-family:"Comic Sans MS","Trebuchet MS",sans-serif;
    font-size:clamp(15px,3.6vw,22px);font-weight:bold;padding:11px 20px;border-radius:18px;
    box-shadow:0 8px 24px rgba(0,0,0,0.45);border:2px solid rgba(241,196,15,0.85);
    opacity:0;pointer-events:none;transition:opacity .25s, transform .25s;text-align:center;white-space:normal;}
  #banterToast.show{opacity:1;transform:translateX(-50%) translateY(0);}
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
  }

  let toastTimer = null;
  function say(cat, name) {
    ensureDom();
    const el = document.getElementById("banterToast");
    el.textContent = pick(cat).replace(/\{name\}/g, name || "Player");
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2700);
  }

  // ---------- name entry modal ----------
  // opts: { title?, slots: [{label, color}] }   cb(namesArray)
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
      const names = inputs.map((inp, i) => (inp.value.trim() || slots[i].label).slice(0, 14));
      saveNames(names);
      modal.remove();
      cb(names);
    }
    modal.querySelector(".banterGo").addEventListener("click", finish);
    inputs.forEach((inp) => inp.addEventListener("keydown", (e) => { if (e.key === "Enter") finish(); }));
  }

  window.Banter = { askNames, say, loadNames, saveNames };
})();
