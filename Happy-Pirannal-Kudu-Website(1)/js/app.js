/* A small, self-contained പിറന്നാൾ story. No analytics, remote fonts or CDNs.
   Each function in scenes renders one experience; the order is the story order.
   Text and photo assignments can be changed in content.js without touching games. */
"use strict";
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const app = $("#app"),
  P = KUDU.photos,
  KEY = "kudu-journey-v1";
let state = { current: 0, completed: [], started: false, sound: false };
let storageOK = true;
try {
  const saved = JSON.parse(localStorage.getItem(KEY) || "null");
  if (saved && Array.isArray(saved.completed)) {
    state = { ...state, ...saved };
    state.completed = state.completed.filter(
      (n) => Number.isInteger(n) && n >= 0 && n < 28,
    );
    state.current = Math.max(0, Math.min(Number(state.current) || 0, 27));
    while (state.current > 0 && !state.completed.includes(state.current - 1))
      state.current--;
  }
} catch {
  storageOK = false;
}
let timers = [],
  frame = 0,
  controller = new AbortController(),
  context = null,
  toastTimer,
  activeMusic = null;
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    storageOK = false;
  }
}
function after(fn, ms) {
  const id = setTimeout(fn, ms);
  timers.push(["t", id]);
  return id;
}
function every(fn, ms) {
  const id = setInterval(fn, ms);
  timers.push(["i", id]);
  return id;
}
function on(el, event, fn, opts = {}) {
  el.addEventListener(event, fn, { ...opts, signal: controller.signal });
}
function clean() {
  controller.abort();
  controller = new AbortController();
  timers.forEach(([t, id]) =>
    t === "t" ? clearTimeout(id) : clearInterval(id),
  );
  timers = [];
  cancelAnimationFrame(frame);
  if (activeMusic) {
    activeMusic.pause();
    activeMusic = null;
  }
}
function toast(s) {
  clearTimeout(toastTimer);
  $("#toast").textContent = s;
  $("#toast").hidden = false;
  toastTimer = setTimeout(() => ($("#toast").hidden = true), 3000);
}
function bell(kind = "bell") {
  if (!state.sound) return;
  try {
    context ||= new (window.AudioContext || window.webkitAudioContext)();
    context.resume();
    const now = context.currentTime;
    [0, 1, 2].forEach((i) => {
      const o = context.createOscillator(),
        g = context.createGain();
      o.type = "sine";
      o.frequency.value = (kind === "pop" ? 330 : 523.25) * [1, 1.5, 2][i];
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.065 / (i + 1), now + 0.01);
      g.gain.exponentialRampToValueAtTime(
        0.001,
        now + (kind === "pop" ? 0.18 : 1.5),
      );
      o.connect(g);
      g.connect(context.destination);
      o.start();
      o.stop(now + 1.6);
    });
  } catch {}
}
function confetti() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const box = $("#particles");
  for (let i = 0; i < 22; i++) {
    const n = document.createElement("span");
    n.className = "particle";
    n.textContent = i % 4 === 0 ? "♡" : "✦";
    n.style.cssText = `--left:${Math.random() * 100}%;--color:${["#bd944d", "#a66774", "#c9b394"][i % 3]};--size:${10 + Math.random() * 13}px;--duration:${2 + Math.random() * 3}s`;
    box.append(n);
    setTimeout(() => n.remove(), 5500);
  }
}
function photo(key, cls = "") {
  const p = P[key];
  return `<figure class="photo-card ${cls}" data-photo="${key}" tabindex="0" role="button" aria-label="Enlarge photograph: ${esc(p.alt)}"><img src="${p.src}" alt="${esc(p.alt)}" loading="lazy"><figcaption>${esc(p.caption)}</figcaption></figure>`;
}
function showPhoto(key) {
  const p = P[key];
  $("#photo-dialog img").src = p.src;
  $("#photo-dialog img").alt = p.alt;
  $("#photo-dialog p").textContent = p.caption;
  $("#photo-dialog").showModal();
}
function flowerSVG(type) {
  const petals =
    type === "lotus"
      ? '<path d="M32 53C7 53 6 35 9 26Q22 30 32 45Q43 30 55 26C60 46 45 54 32 53" fill="#d4a2a8"/><path d="M32 53C10 40 24 16 32 8C41 18 54 42 32 53" fill="#aa5a71"/><path d="M32 51Q21 31 32 18Q43 32 32 51" fill="#e7bec4"/>'
      : Array.from(
          { length: type === "jasmine" ? 8 : 5 },
          (_, i) =>
            '<ellipse cx="32" cy="20" rx="' +
            (type === "jasmine" ? 8 : 12) +
            '" ry="17" transform="rotate(' +
            i * (type === "jasmine" ? 45 : 72) +
            ' 32 32)" fill="' +
            (type === "jasmine" ? "#fffdf1" : "#a9485a") +
            '" stroke="' +
            (type === "jasmine" ? "#d2c5a8" : "#883b4d") +
            '"/>',
        ).join("") + '<circle cx="32" cy="32" r="6" fill="#d8b364"/>';
  return '<svg viewBox="0 0 64 64" aria-hidden="true">' + petals + "</svg>";
}
function lamp(lit = false) {
  return `<svg class="lamp-art ${lit ? "lit" : ""}" viewBox="0 0 240 300" aria-hidden="true"><defs><linearGradient id="brass" x1="0" x2="1"><stop stop-color="#845a27"/><stop offset=".32" stop-color="#e4c17b"/><stop offset=".6" stop-color="#af8040"/><stop offset=".85" stop-color="#e9ca88"/><stop offset="1" stop-color="#855b2b"/></linearGradient><radialGradient id="glow"><stop stop-color="#ffd88a" stop-opacity=".35"/><stop offset="1" stop-color="#ffca65" stop-opacity="0"/></radialGradient></defs><ellipse cx="120" cy="280" rx="75" ry="9" fill="#6a461c" opacity=".15"/><path d="M76 271Q87 262 104 256L110 113H130L137 256Q155 262 165 271Q175 284 120 286Q66 284 76 271" fill="url(#brass)"/><ellipse cx="120" cy="253" rx="24" ry="7" fill="url(#brass)"/><path d="M112 81L116 53L120 43L124 53L128 81Z" fill="url(#brass)"/><path d="M47 92Q120 67 193 92L181 112Q120 137 59 112Z" fill="url(#brass)"/><ellipse cx="120" cy="92" rx="73" ry="16" fill="#a0783c" stroke="#e1be79" stroke-width="4"/><ellipse cx="120" cy="95" rx="56" ry="9" fill="#714f26"/><path d="M114 80Q120 62 126 80L128 109H112Z" fill="url(#brass)"/><g class="wick-flame"><circle cx="67" cy="76" r="70" fill="url(#glow)"/><circle cx="176" cy="76" r="70" fill="url(#glow)"/><path class="flame" d="M66 93C45 78 69 59 70 48C88 70 81 91 66 93" fill="#eab556"/><path d="M68 90C60 82 68 70 70 69C77 79 75 88 68 90" fill="#fff2b0"/><path class="flame" d="M174 93C157 77 176 59 179 48C196 70 188 92 174 93" fill="#eab556"/><path d="M176 90C169 81 177 70 179 69C184 80 183 88 176 90" fill="#fff2b0"/></g></svg>`;
}
function setup(title, sub, theme = "A LITTLE പിറന്നാൾ MAGIC", dark = false) {
  clean();
  document.body.classList.toggle("dark", dark);
  app.innerHTML = `<section class="screen"><div class="eyebrow">${theme}</div><h2>${title}</h2><p class="subtitle">${sub}</p><div class="stage" id="stage"></div><div class="stage-status" id="status" role="status"></div><div class="outcome" id="outcome" hidden></div><div class="hint-area" id="hint-area"></div></section>`;
  window.scrollTo(0, 0);
  app.focus({ preventScroll: true });
}
function hint(text) {
  after(() => {
    if (!$("#outcome")?.hidden) return;
    $("#hint-area").innerHTML =
      '<button class="text-button" id="hint">Need a hint?</button><p class="hint-content" hidden></p>';
    on($("#hint"), "click", () => {
      $(".hint-content").textContent = text;
      $(".hint-content").hidden = false;
    });
  }, 7000);
}
function status(text) {
  if ($("#status")) $("#status").textContent = text;
}
function done(text) {
  const first = !state.completed.includes(state.current);
  if (first) {
    state.completed.push(state.current);
    save();
    bell();
    confetti();
  }
  const out = $("#outcome");
  if (!out) return;
  out.hidden = false;
  out.innerHTML = `<p>${esc(text)}</p><div class="next-note">ഒരു ചെറിയ surprise കൂടി… ♡</div><button class="primary" id="next">Continue <span class="arrow">→</span></button>`;
  $("#hint-area").innerHTML = "";
  on($("#next"), "click", () => {
    state.current = Math.min(27, state.current + 1);
    save();
    render();
  });
  if (first)
    out.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "nearest",
    });
}
function restoreDone(text) {
  if (state.completed.includes(state.current)) done(text);
}
function button(id, text, cls = "primary") {
  return `<button id="${id}" class="${cls}">${text}</button>`;
}
function render() {
  save();
  // The fourth activity is the balloon page. Keep the artwork for later pages.
  document.body.classList.toggle("story-art", state.current >= 3);
  scenes[state.current]();
}
function opening(gate = false) {
  clean();
  document.body.classList.remove("story-art");
  document.body.classList.add("dark");
  if (gate) {
    app.innerHTML = `<section class="gate"><div class="eyebrow">A GIFT FROM MY HEART TO YOURS</div>${lamp(true)}<h1>A little light.<br>A lot of love.</h1><p class="gate-blessing" lang="ml">സ്നേഹത്തോടെ, ജന്മാന്തരങ്ങളുടെ പുണ്യത്തിന്... ഹൃദയം നിറഞ്ഞ പിറന്നാൾ ആശംസകൾ.</p>${button("enter", "Tap to begin, Kudu ♡")}</section>`;
    on($("#enter"), "click", () => {
      bell();
      opening();
    });
    return;
  }
  app.innerHTML = `<section class="opening"><div class="intro-copy"><div class="eyebrow">A LITTLE JOURNEY MADE JUST FOR YOU</div><h1>Happy പിറന്നാൾ<br><em>Kudu.</em> ♡</h1><p class="intro-sub">Some little surprises.<br>Some of our favourite memories.<br>All the love I can fit into a day.</p>${button("start", state.started ? 'Continue my surprise <span class="arrow">→</span>' : 'Start my surprise <span class="arrow">→</span>')}<p class="malayalam">പിറന്നാൾ ആശംസകൾ, എന്റെ Kudu ♡</p><div class="intro-detail">OPEN SLOWLY. THIS ONE IS PERSONAL.</div></div><div class="intro-photo"><img src="${P.couple.src}" alt="${esc(P.couple.alt)}"><p>you, me & all our little moments.</p><span class="photo-flower" aria-hidden="true">✳</span></div></section>`;
  on($("#start"), "click", () => {
    state.started = true;
    save();
    render();
    if (!storageOK)
      toast("This browser cannot save progress. Keep this tab open.");
  });
}

const scenes = [
  function lightLamp() {
    const msg =
      "May this light always stay in our home, our hearts, and our little family. ♡";
    setup(
      "A beautiful beginning.",
      "ഒരു നല്ല കാര്യം തുടങ്ങുമ്പോൾ ആദ്യം വിളക്ക് തെളിയിക്കാം… ✨",
      "LIGHT & BLESSINGS",
      true,
    );
    $("#stage").innerHTML =
      `<button class="lamp-button" id="light" aria-label="Light the Nilavilakku">${lamp()}</button><span class="lamp-caption">TAP THE WICK TO LIGHT OUR NILAVILAKKU</span>`;
    on($("#light"), "click", () => {
      $("#light").classList.add("lit");
      done(msg);
    });
    hint("Tap anywhere on the lamp to light its wicks.");
    restoreDone(msg);
  },
  function flowers() {
    const msg = "May your life always bloom this beautifully, Kudu.";
    setup(
      "A little offering of love.",
      "Jasmine, lotus, hibiscus. Tap each flower and let our wishes bloom.",
      "FLOWERS & GOOD WISHES",
    );
    $("#stage").innerHTML =
      '<div class="floral-options"><button class="flower-pick" aria-label="Offer jasmine">' +
      flowerSVG("jasmine") +
      '</button><button class="flower-pick" aria-label="Offer lotus">' +
      flowerSVG("lotus") +
      '</button><button class="flower-pick" aria-label="Offer hibiscus">' +
      flowerSVG("hibiscus") +
      '</button></div><div class="uruli" aria-label="Brass bowl for flowers"></div>';
    let n = 0;
    $$(".flower-pick").forEach((b) =>
      on(b, "click", () => {
        b.disabled = true;
        b.classList.add("used");
        $(".uruli").insertAdjacentHTML(
          "beforeend",
          `<span class="offering">${b.innerHTML}</span>`,
        );
        bell("pop");
        if (++n === 3) done(msg);
      }),
    );
    hint("Tap all three flowers. Each one will settle into the brass bowl.");
    restoreDone(msg);
  },
  function findKudu() {
    const msg = "Found her! The prettiest one was easy. ♡";
    setup(
      "Where is my Kudu?",
      "Find the portrait of just you, പിറന്നാൾ girl.",
      "MY FAVOURITE FACE",
    );
    $("#stage").innerHTML =
      '<div class="photo-choices">' +
      ["couple", "garden", "familyB"]
        .map(
          (k) =>
            `<button class="photo-choice" data-answer="${k}" aria-label="${k === "garden" ? "Meera on her own" : k === "couple" ? "A couple photograph" : "A family photograph"}"><img src="${P[k].src}" alt="${esc(P[k].alt)}"></button>`,
        )
        .join("") +
      "</div>";
    $$(".photo-choice").forEach((b) =>
      on(b, "click", () => {
        if (b.dataset.answer === "garden") {
          b.classList.add("correct");
          done(msg);
        } else
          status(
            "A beautiful memory… now look for the portrait of only you. ♡",
          );
      }),
    );
    hint("Look for your solo photograph in the green garden.");
    restoreDone(msg);
  },
  function balloons() {
    const msg = "Every celebration is better when it is with you.";
    setup(
      "A sky full of little wishes.",
      "Pop the balloons. There is love hiding in every one.",
      "LET’S CELEBRATE",
    );
    const words = ["Love", "Home", "Kudu", "Us", "Forever", "Family", "Smile"];
    $("#stage").innerHTML =
      '<div class="balloon-field">' +
      words
        .map(
          (w, i) =>
            `<button class="balloon" aria-label="Pop balloon ${i + 1}" style="left:${7 + (i % 4) * 24}%;top:${i < 4 ? 30 : 165}px;--b:${["#a56573", "#a38d58", "#728774", "#bd9474"][i % 4]};animation-delay:${i * 0.2}s" data-word="${w}"></button>`,
        )
        .join("") +
      "</div>";
    let n = 0;
    $$(".balloon").forEach((b) =>
      on(b, "click", () => {
        b.textContent = b.dataset.word;
        b.classList.add("popped");
        b.disabled = true;
        bell("pop");
        if (++n === words.length) {
          after(() => {
            $("#stage").innerHTML = photo("selfie", "completion-photo");
            done(msg);
          }, 450);
        }
      }),
    );
    hint("Tap every balloon. There is no timer.");
    restoreDone(msg);
  },
  function puzzle() {
    const msg =
      "Out of millions of pieces in this world, you became the piece that completed mine. ♡";
    setup(
      "You & me. Piece by piece.",
      "Tap two pieces to swap them and bring our photograph together.",
      "WE JUST FIT",
    );
    let order = [3, 0, 5, 1, 2, 4],
      selected = null;
    $("#stage").innerHTML =
      '<div class="jigsaw" role="group" aria-label="Six piece photograph puzzle"></div><div class="button-row">' +
      button("puzzle-help", "Place one piece for me", "text-button") +
      "</div>";
    function draw() {
      $(".jigsaw").innerHTML = order
        .map(
          (v, i) =>
            `<button class="tile ${selected === i ? "selected" : ""}" aria-label="Puzzle position ${i + 1}, photo piece ${v + 1}" style="background-image:url('${P.couple.src}');background-position:${(v % 2) * 100}% ${Math.floor(v / 2) * 50}%" data-pos="${i}" draggable="true"></button>`,
        )
        .join("");
      $$(".tile").forEach((b) => {
        const i = +b.dataset.pos;
        on(b, "click", () => {
          if (selected === null) {
            selected = i;
            draw();
          } else {
            [order[selected], order[i]] = [order[i], order[selected]];
            selected = null;
            draw();
            check();
          }
        });
        on(b, "dragstart", (e) => e.dataTransfer.setData("text/plain", i));
        on(b, "dragover", (e) => e.preventDefault());
        on(b, "drop", (e) => {
          e.preventDefault();
          const from = Number(e.dataTransfer.getData("text/plain"));
          if (Number.isInteger(from) && from >= 0 && from < 6) {
            [order[from], order[i]] = [order[i], order[from]];
            selected = null;
            draw();
            check();
          }
        });
      });
    }
    function check() {
      if (order.every((v, i) => v === i)) {
        status("There we are. Together.");
        done(msg);
      }
    }
    draw();
    const picture = new Image();
    picture.onload = () => {
      if ($(".jigsaw"))
        $(".jigsaw").style.aspectRatio =
          picture.naturalWidth + "/" + picture.naturalHeight;
    };
    picture.src = P.couple.src;
    on($("#puzzle-help"), "click", () => {
      const i = order.findIndex((v, i) => v !== i);
      if (i < 0) return;
      const j = order.indexOf(i);
      [order[i], order[j]] = [order[j], order[i]];
      selected = null;
      draw();
      check();
    });
    hint(
      "Choose any two pieces to swap them. “Place one piece for me” gently helps you finish.",
    );
    restoreDone(msg);
  },
  function catchHearts() {
    const msg = "Still not enough to hold all the love I have for you.";
    setup(
      "Catch a little love.",
      "Slide the brass bowl under the falling hearts. You can tap a heart to catch it, too.",
      "ALL MY LOVE",
    );
    $("#stage").innerHTML =
      '<div class="catch-field"><div class="basket" role="slider" tabindex="0" aria-label="Move the heart basket" aria-valuemin="5" aria-valuemax="95" aria-valuenow="50"></div></div>';
    const field = $(".catch-field"),
      basket = $(".basket");
    let count = 0,
      x = 50,
      finished = false;
    status("A few little hearts are on their way…");
    const setX = (n) => {
      x = Math.max(5, Math.min(95, n));
      basket.style.left = x + "%";
      basket.setAttribute("aria-valuenow", Math.round(x));
    };
    on(field, "pointermove", (e) => {
      const r = field.getBoundingClientRect();
      setX(((e.clientX - r.left) / r.width) * 100);
    });
    on(field, "pointerdown", (e) => {
      const r = field.getBoundingClientRect();
      setX(((e.clientX - r.left) / r.width) * 100);
    });
    on(basket, "keydown", (e) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        setX(x + (e.key === "ArrowRight" ? 8 : -8));
      }
    });
    function caught(b) {
      if (b.dataset.caught || finished) return;
      b.dataset.caught = "yes";
      b.remove();
      bell("pop");
      count++;
      status(`${count} little hearts caught ♡`);
      if (count >= 6) {
        finished = true;
        $$(".falling-heart").forEach((h) => h.remove());
        done(msg);
      }
    }
    function spawn() {
      if (finished) return;
      const b = document.createElement("button");
      b.className = "falling-heart";
      b.textContent = "♥";
      b.setAttribute("aria-label", "Catch heart");
      b.style.left = 8 + Math.random() * 78 + "%";
      field.append(b);
      on(b, "click", () => caught(b));
      after(() => b.remove(), 5500);
    }
    spawn();
    every(spawn, 900);
    function loop() {
      if (!finished) {
        const br = basket.getBoundingClientRect();
        $$(".falling-heart").forEach((h) => {
          const r = h.getBoundingClientRect();
          if (
            r.bottom >= br.top &&
            r.top < br.bottom &&
            r.right > br.left &&
            r.left < br.right
          )
            caught(h);
        });
        frame = requestAnimationFrame(loop);
      }
    }
    loop();
    hint(
      "Move your finger across the game to slide the bowl, or simply tap six hearts. Keyboard: focus the bowl and use left/right arrows.",
    );
    restoreDone(msg);
  },
  function sadhya() {
    const msg = "Kudu’s പിറന്നാൾ Sadhya is ready! 😋 ♡";
    setup(
      "A പിറന്നാൾ, Kerala style.",
      "Our banana leaf is waiting. Tap the dishes to serve a little happiness.",
      "A TASTE OF HOME",
    );
    const dishes = [
      ["Rice", "#f5ead2"],
      ["Parippu", "#e8bf4f"],
      ["Sambar", "#ac6b36"],
      ["Avial", "#dbd29d"],
      ["Thoran", "#b7bb72"],
      ["Kaalan", "#e6d19a"],
      ["Olan", "#efe4be"],
      ["Inji curry", "#87522b"],
      ["Pappadam", "#dfc17c"],
      ["Pickle", "#b75432"],
      ["Banana", "#edcd63"],
    ];
    $("#stage").innerHTML =
      '<div class="banana-leaf" aria-label="പിറന്നാൾ sadhya"></div><div class="dish-options">' +
      dishes
        .map(([n, c]) => `<button data-color="${c}">${n}</button>`)
        .join("") +
      "</div>";
    let n = 0;
    $$(".dish-options button").forEach((b) =>
      on(b, "click", () => {
        b.disabled = true;
        $(".banana-leaf").insertAdjacentHTML(
          "beforeend",
          `<span class="dish" style="--dish:${b.dataset.color}">${b.textContent}</span>`,
        );
        bell("pop");
        if (++n === dishes.length) {
          $("#stage").insertAdjacentHTML(
            "beforeend",
            photo("sadhya", "small-photo"),
          );
          done(msg);
        }
      }),
    );
    hint(
      "Tap every dish below the leaf. We will find the perfect place for each one.",
    );
    restoreDone(msg);
  },
  function payasam() {
    const msg =
      "പിറന്നാൾ calories don’t count. Especially payasam. ഒരു ഗ്ലാസ് കൂടി വേണോ Kudu? ♡";
    setup(
      "Something sweet, of course.",
      "പായസം കുടിച്ചാലോ? Take a little sip. And another.",
      "THE BEST PART OF SADHYA",
    );
    $("#stage").innerHTML =
      '<div class="payasam" aria-label="Payasam bowl"><div class="payasam-liquid"></div></div>' +
      button("sip", "A little sip ♡");
    let n = 0;
    on($("#sip"), "click", () => {
      $(".payasam-liquid").style.height = Math.max(0, 92 - ++n * 18.4) + "%";
      bell("pop");
      if (n === 5) {
        $("#sip").disabled = true;
        $("#sip").textContent = "Delicious.";
        done(msg);
      }
    });
    hint("Tap “A little sip” until the payasam is finished.");
    restoreDone(msg);
  },
  function quiz() {
    const msg =
      "No scores here. Just two people who are very good at being us.";
    setup(
      "A very serious love quiz.",
      "There are no wrong answers. Well… almost.",
      "ONLY WE WOULD KNOW",
    );
    const qs = [
      ["Who says sorry first?", ["Vishnu", "Kudu", "Whoever wants chai"]],
      [
        "Who takes longer to get ready?",
        ["Vishnu", "Kudu", "We are both perfectly on time"],
      ],
      [
        "Who steals more space on the bed?",
        ["Vishnu", "Kudu", "The pillows are responsible"],
      ],
      ["Who loves Kudu the most?", ["Vishnu. Obviously. ♡"]],
    ];
    let i = 0;
    function draw() {
      $("#stage").innerHTML =
        `<p class="quiz-question">${qs[i][0]}</p><div class="choices">${qs[i][1].map((a) => `<button class="choice">${a}</button>`).join("")}</div><p class="quiz-response" role="status"></p>`;
      $$(".choice").forEach((b) =>
        on(b, "click", () => {
          $$(".choice").forEach((x) => (x.disabled = true));
          b.classList.add("chosen");
          $(".quiz-response").textContent =
            i === 3
              ? "Correct. Always. ♡"
              : "Your answer is officially accepted. 😌";
          after(() => {
            if (++i === qs.length) done(msg);
            else draw();
          }, 650);
        }),
      );
    }
    draw();
    hint(
      "Pick whichever answer makes you smile. Every answer moves our story forward.",
    );
    restoreDone(msg);
  },
  function wheel() {
    const msg =
      "Whatever life brings, I hope it always brings us more of this.";
    setup(
      "Where will a memory take us?",
      "Give our little wheel a spin.",
      "THE MEMORY WHEEL",
    );
    $("#stage").innerHTML =
      '<div class="wheel-wrap"><div class="wheel"><span>our story</span></div></div><p class="audio-note">Love · Family · Adventure · Laughter · Kudu · Us</p>' +
      button("spin", "Spin a memory");
    on($("#spin"), "click", () => {
      $("#spin").disabled = true;
      const n = Math.floor(Math.random() * 6);
      $(".wheel").style.transform = `rotate(${1440 + n * 60 + 30}deg)`;
      after(() => {
        $("#stage").innerHTML = photo(
          ["kiss", "familyB", "outdoors", "selfie", "sari", "cafe"][n],
        );
        done(msg);
      }, 2700);
    });
    hint("Tap “Spin a memory” and wait for your photograph to appear.");
    restoreDone(msg);
  },
  function scratch() {
    const msg = "One of my favourite people, in one of my favourite pictures.";
    setup(
      "There is someone under here…",
      "Scratch slowly with your finger to reveal a favourite face.",
      "A LITTLE REVEAL",
    );
    $("#stage").innerHTML =
      `<div class="scratch-wrap"><img src="${P.portrait.src}" alt="${esc(P.portrait.alt)}"><canvas width="260" height="355" aria-label="Scratch the gold cover"></canvas></div>${button("uncover", "Gently uncover it", "text-button")}`;
    const canvas = $("canvas"),
      ctx = canvas.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, 260, 355);
    grad.addColorStop(0, "#dbc59e");
    grad.addColorStop(1, "#a78043");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 260, 355);
    ctx.fillStyle = "#63432c";
    ctx.font = "italic 28px Georgia";
    ctx.textAlign = "center";
    ctx.fillText("a little surprise", 130, 165);
    ctx.font = "40px Georgia";
    ctx.fillText("♡", 130, 217);
    let down = false,
      finished = false;
    function reveal() {
      if (finished) return;
      finished = true;
      canvas.style.opacity = 0;
      canvas.style.pointerEvents = "none";
      $("#uncover").hidden = true;
      done(msg);
    }
    function erase(e) {
      if (!down || finished) return;
      const r = canvas.getBoundingClientRect(),
        x = ((e.clientX - r.left) * 260) / r.width,
        y = ((e.clientY - r.top) * 355) / r.height;
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, 28, 0, Math.PI * 2);
      ctx.fill();
      const data = ctx.getImageData(0, 0, 260, 355).data;
      let erased = 0,
        total = 0;
      for (let i = 3; i < data.length; i += 64) {
        total++;
        if (data[i] < 128) erased++;
      }
      if (erased / total > 0.27) reveal();
    }
    on(canvas, "pointerdown", (e) => {
      down = true;
      canvas.setPointerCapture(e.pointerId);
      erase(e);
    });
    on(canvas, "pointermove", erase);
    on(canvas, "pointerup", () => (down = false));
    on(canvas, "pointercancel", () => (down = false));
    on($("#uncover"), "click", reveal);
    hint(
      "Rub across the gold cover, or choose “Gently uncover it” for a tap-only reveal.",
    );
    restoreDone(msg);
  },
  function pookalam() {
    const msg = "Wherever you are, you make the place feel like home.";
    setup(
      "Flowers, in a little circle of joy.",
      "Tap around the circle to make our പിറന്നാൾ Pookalam.",
      "MADE OF FLOWERS & LOVE",
    );
    $("#stage").innerHTML =
      '<div class="pookalam">' +
      Array.from(
        { length: 12 },
        (_, i) =>
          `<button class="petal-slot" style="--angle:${i * 30}deg;--petal:${["#d59835", "#9d4d56", "#e6c562"][i % 3]}" aria-label="Place flower petal ${i + 1}"></button>`,
      ).join("") +
      '<span class="pookalam-center" aria-hidden="true">✳</span></div>';
    let n = 0;
    $$(".petal-slot").forEach((b) =>
      on(b, "click", () => {
        b.classList.add("filled");
        b.disabled = true;
        bell("pop");
        if (++n === 12) done(msg);
      }),
    );
    hint(
      "Tap each pale petal around the circle until the flower carpet is complete.",
    );
    restoreDone(msg);
  },
  function family() {
    const msg = "Two families. One beautiful journey. ♡";
    setup(
      "So many people. So much love.",
      "Open each photograph and spend a moment with the people who make our world.",
      "OUR PEOPLE",
    );
    const keys = ["familyA", "familyB", "wedding", "car", "familyGatheringA", "familyGatheringB"];
    $("#stage").innerHTML =
      '<div class="memory-wall">' +
      keys
        .map((k, i) =>
          photo(k, k.startsWith("familyGathering") ? "family-collage" : "").replace(
            'class="photo-card ',
            'style="--rotation:' +
              [-3, 2, 3, -2][i % 4] +
              'deg" class="photo-card ',
          ),
        )
        .join("") +
      "</div>";
    const seen = new Set();
    $$("[data-photo]", $("#stage")).forEach((b) =>
      on(b, "click", () => {
        seen.add(b.dataset.photo);
        status(
          seen.size === keys.length
            ? "Every memory, held close."
            : "Open the other photographs when you are ready.",
        );
        if (seen.size === keys.length) done(msg);
      }),
    );
    hint(
      "Tap each photograph, including the two family collages below, then use × to close the full-screen view.",
    );
    restoreDone(msg);
  },
  function letter() {
    const msg = "Not a perfect life. A beautiful life, because it is with you.";
    setup(
      "For you. Always.",
      "Some things are easier to write when they come straight from the heart.",
      "A LETTER FROM VISHNU",
    );
    $("#stage").innerHTML =
      '<button class="envelope" id="envelope" aria-label="Open your love letter"><span class="wax">♡</span></button><p class="mini-label">BREAK THE LITTLE HEART SEAL</p>';
    on($("#envelope"), "click", () => {
      $("#stage").innerHTML =
        `<article class="letter">${esc(KUDU.loveLetter)}</article>`;
      done(msg);
    });
    hint("Tap the red heart seal to open your letter.");
    restoreDone(msg);
  },
  function heart() {
    const msg = "Still my favourite partnership.";
    setup(
      "There you are. My other half.",
      "Bring our two halves together.",
      "ALWAYS BETTER TOGETHER",
    );
    $("#stage").innerHTML =
      '<div class="heart-halves"><button class="half-heart left" aria-label="Move left heart half"></button><button class="half-heart right" aria-label="Move right heart half"></button></div>' +
      button("join", "Bring us together ♡");
    let joined = false;
    const join = () => {
      if (joined) return;
      joined = true;
      $(".heart-halves").classList.add("joined");
      $("#join").disabled = true;
      after(() => {
        $("#stage").innerHTML = photo("kiss");
        done(msg);
      }, 900);
    };
    on($("#join"), "click", join);
    $$(".half-heart").forEach((b) => {
      let start = 0;
      on(b, "pointerdown", (e) => {
        start = e.clientX;
        b.setPointerCapture(e.pointerId);
      });
      on(b, "pointerup", (e) => {
        if (Math.abs(e.clientX - start) > 20) join();
      });
      on(b, "click", join);
    });
    hint(
      "Drag either heart half toward the centre, tap a half, or tap “Bring us together.”",
    );
    restoreDone(msg);
  },
  function nurse() {
    const msg =
      "You spend your life caring for others… Today is our turn to celebrate you. ♡";
    setup(
      "For the heart that cares for everyone.",
      "A little thank-you for the nurse, and the wonderful person, you are.",
      "OUR VERY OWN EVERYDAY HERO",
    );
    $("#stage").innerHTML =
      '<div class="nursing-layout">' +
      photo("nurse", "small-photo") +
      '<div><div class="healing-hearts">' +
      [1, 2, 3]
        .map(
          (i) =>
            `<button class="heal-heart" aria-label="Give heart ${i} a little care">♥</button>`,
        )
        .join("") +
      '</div><p class="audio-note">Tap each heart. A little kindness<br>can make all the difference.</p></div></div>';
    let n = 0;
    $$(".heal-heart").forEach((b) =>
      on(b, "click", () => {
        b.classList.add("healed");
        b.disabled = true;
        bell();
        if (++n === 3) done(msg);
      }),
    );
    hint("Tap each of the three soft grey hearts to fill it with love.");
    restoreDone(msg);
  },
  function coconut() {
    const msg = "Expected coconut. Got another memory. 😂 ♡";
    setup(
      "A very Kerala kind of surprise.",
      "Give our coconut tree a few gentle taps.",
      "SOMETHING IN THE TREETOPS",
    );
    $("#stage").innerHTML =
      '<button class="tree-button" aria-label="Gently shake the coconut tree"><svg class="tree-art" viewBox="0 0 250 280" aria-hidden="true"><path d="M115 262Q145 160 124 84L144 84Q166 178 138 262" fill="#ab8254"/><path d="M128 247L144 237M133 218L150 208M137 185L152 179M140 155L155 149M137 125L151 119" stroke="#805e3d" stroke-width="3"/><path d="M134 91Q81 19 29 80Q85 65 134 91M135 87Q146 16 212 35Q171 45 135 87M130 84Q74 28 67 7Q120 17 130 84M138 86Q202 66 238 126Q185 105 138 86M132 86Q77 65 24 149Q84 103 132 86M133 79Q131 14 161 4Q159 53 133 79" fill="#5d7651"/><circle cx="131" cy="94" r="14" fill="#866741"/><circle cx="148" cy="95" r="11" fill="#9c7950"/><ellipse cx="125" cy="266" rx="53" ry="6" fill="#af9f7833"/></svg></button>';
    let n = 0;
    on($(".tree-button"), "click", () => {
      const b = $(".tree-button");
      b.classList.remove("shake");
      void b.offsetWidth;
      b.classList.add("shake");
      b.insertAdjacentHTML("beforeend", '<span class="fall-gift">♥</span>');
      bell("pop");
      if (++n === 4) {
        b.disabled = true;
        after(() => {
          $("#stage").innerHTML = photo("outdoors");
          done(msg);
        }, 700);
      }
    });
    hint(
      "Tap the coconut tree four times. Something sweet is hiding up there.",
    );
    restoreDone(msg);
  },
  function temple() {
    const msg =
      "If I could ask for one blessing again… I would still ask for this life with you.";
    setup(
      "A quiet walk, side by side.",
      "Follow the little steps. Let each one leave a light behind.",
      "A MOMENT OF GRATITUDE",
    );
    $("#stage").innerHTML =
      '<div class="temple-path"><div class="temple"><div class="temple-roof"></div><div class="temple-body"></div></div><div class="path-line"></div>' +
      [0, 1, 2, 3]
        .map(
          (i) =>
            `<button class="path-step" data-step="${i}" style="bottom:${12 + i * 43}px;left:calc(50% + ${i % 2 ? 7 : -47}px)" aria-label="Take step ${i + 1}" ${i ? "disabled" : ""}>♩</button>`,
        )
        .join("") +
      "</div>";
    $$(".path-step").forEach((b) =>
      on(b, "click", () => {
        b.textContent = "✦";
        b.classList.add("visited");
        b.disabled = true;
        const n = +b.dataset.step;
        bell();
        if (n === 3) done(msg);
        else $(`[data-step="${n + 1}"]`).disabled = false;
      }),
    );
    hint(
      "Start with the lowest step and follow the path upward. Each step unlocks the next.",
    );
    restoreDone(msg);
  },
  function hiddenHearts() {
    const msg =
      "You found every heart… except mine. That one was already yours. ♡";
    setup(
      "Love is in the little details.",
      "Find the five little hearts tucked into this memory.",
      "LOOK A LITTLE CLOSER",
    );
    $("#stage").innerHTML =
      `<div class="hidden-scene"><img src="${P.cafe.src}" alt="${esc(P.cafe.alt)}">${[
        [8, 9],
        [78, 7],
        [42, 48],
        [9, 77],
        [78, 82],
      ]
        .map(
          ([x, y], i) =>
            `<button class="hidden-heart" style="left:${x}%;top:${y}%" aria-label="Hidden heart ${i + 1}">♡</button>`,
        )
        .join("")}</div>`;
    let n = 0;
    $$(".hidden-heart").forEach((b) =>
      on(b, "click", () => {
        b.classList.add("found");
        b.textContent = "♥";
        b.disabled = true;
        bell("pop");
        status(`${++n} little hearts found`);
        if (n === 5) done(msg);
      }),
    );
    hint("Look near the corners and the middle. Tap each outlined heart.");
    restoreDone(msg);
  },
  function music() {
    const msg =
      "Every love story needs a soundtrack. Sometimes, a quiet moment says enough.";
    setup(
      "If our love were a song…",
      "A small pause. A favourite memory. Just us.",
      "OUR OWN LITTLE SOUNDTRACK",
    );
    $("#stage").innerHTML =
      `<div class="record"><img src="${P.cafe.src}" alt="${esc(P.cafe.alt)}"></div><div class="audio-controls">${button("play", "Play our music", "secondary")}<label class="audio-note" for="music-progress">Song progress</label><input type="range" id="music-progress" min="0" max="100" value="0" aria-label="Song progress" disabled></div><p class="audio-note" id="music-note"></p><div class="song-photos">${photo("greenWalk", "song-photo")}${photo("dayOut", "song-photo")}</div><div class="button-row">${button("quiet", "Stay in this quiet moment ♡", "text-button")}</div>`;
    if (KUDU.music) {
      const audio = new Audio(KUDU.music);
      audio.preload = "metadata";
      activeMusic = audio;
      $("#play").setAttribute("aria-pressed", "false");
      $("#music-note").setAttribute("aria-live", "polite");
      $("#music-note").textContent = "Tap Play our music to listen. ♡";
      on($("#play"), "click", async () => {
        try {
          if (audio.paused) {
            if (audio.error) audio.load();
            await audio.play();
            // Navigation can happen while a phone is still loading the song.
            if (activeMusic !== audio) {
              audio.pause();
              return;
            }
            state.sound = true;
            save();
            $("#sound-toggle").textContent = "Sound on ♫";
            $(".record").classList.add("playing");
            $("#play").textContent = "Pause our music";
            $("#play").setAttribute("aria-pressed", "true");
            $("#music-note").textContent = "Just you, me, and our song. ♡";
            done(msg);
          } else {
            audio.pause();
            $(".record").classList.remove("playing");
            $("#play").textContent = "Play our music";
          }
        } catch {
          if (activeMusic !== audio) return;
          $("#music-note").textContent =
            "Tap Play our music to try again, and check your phone’s media volume.";
        }
      });
      const updateProgress = () => {
        if (Number.isFinite(audio.duration) && audio.duration > 0) {
          $("#music-progress").disabled = false;
          $("#music-progress").value =
            (audio.currentTime / audio.duration) * 100;
        }
      };
      on(audio, "loadedmetadata", updateProgress);
      on(audio, "timeupdate", updateProgress);
      on(audio, "pause", () => {
        $(".record").classList.remove("playing");
        $("#play").textContent = audio.ended ? "Play again" : "Play our music";
        $("#play").setAttribute("aria-pressed", "false");
      });
      on($("#music-progress"), "input", (e) => {
        if (Number.isFinite(audio.duration))
          audio.currentTime = (+e.target.value / 100) * audio.duration;
      });
      on(audio, "ended", () => {
        $(".record").classList.remove("playing");
        $("#play").textContent = "Play again";
        $("#play").setAttribute("aria-pressed", "false");
      });
      on(audio, "error", () => {
        $("#music-note").textContent =
          "The song couldn’t load. Check your connection, then tap Play our music to retry.";
      });
    } else {
      $("#play").disabled = true;
      $("#play").textContent = "A song will live here";
      $("#music-note").textContent =
        "For now, let this be a quiet little moment with a favourite photograph.";
    }
    on($("#quiet"), "click", () => done(msg));
    hint(
      "Tap “Play our music” to hear our song. You can pause it or move the slider to your favourite moment.",
    );
    restoreDone(msg);
  },
  function tea() {
    const msg =
      "Some of the best moments are just two people, one conversation, and chai.";
    setup(
      "You. Me. And a little chai.",
      "Bring the glasses together. Let the world wait a moment.",
      "OUR KIND OF PERFECT",
    );
    $("#stage").innerHTML =
      '<div class="tea-scene"><div class="steam-heart" aria-hidden="true">♡</div><div class="tea-glass"></div><div class="tea-glass"></div></div>' +
      button("cheers", "A little cheers ♡") +
      photo("cafeFriends", "chai-photo");
    const join = () => {
      $(".tea-scene").classList.add("together");
      $("#cheers").disabled = true;
      done(msg);
    };
    on($("#cheers"), "click", join);
    let start;
    on($(".tea-scene"), "pointerdown", (e) => {
      start = e.clientX;
      $(".tea-scene").setPointerCapture(e.pointerId);
    });
    on($(".tea-scene"), "pointerup", (e) => {
      if (Math.abs(e.clientX - start) > 20) join();
    });
    hint("Slide one glass toward the other, or tap “A little cheers.”");
    restoreDone(msg);
  },
  function timeline() {
    const msg = "My favourite story is the one we are still writing.";
    setup(
      "Little moments. Our whole world.",
      "A handful of memories, held close.",
      "THE STORY OF US",
    );
    const items = [
      ["When we began", "car"],
      ["Somewhere along the way", "outdoors"],
      ["We became us", "wedding"],
      ["Our family", "familyB"],
      ["And now…", "couple"],
    ];
    let i = 0;
    function draw() {
      $("#stage").innerHTML =
        `<h3 class="timeline-title">${items[i][0]}</h3>${photo(items[i][1], "small-photo")}<div class="timeline-dots" aria-hidden="true">${items.map((_, j) => `<span class="${j <= i ? "on" : ""}"></span>`).join("")}</div>${i < items.length - 1 ? button("memory-next", "Turn to another memory", "secondary") : ""}`;
      if (i < items.length - 1)
        on($("#memory-next"), "click", () => {
          i++;
          draw();
        });
      else done(msg);
    }
    draw();
    hint("Tap “Turn to another memory” to gently move through our story.");
    restoreDone(msg);
  },
  function smile() {
    const msg = "That smile. That is what this was all for.";
    setup(
      "What would make Kudu smile?",
      "Pick a little mood. There is more where that came from.",
      "JUST FOR YOUR SMILE",
    );
    $("#stage").innerHTML =
      '<div class="message-card" role="status">Your next smile is one little tap away.</div><div class="choices">' +
      Object.keys(KUDU.messages)
        .map(
          (k) =>
            `<button class="choice" data-mood="${esc(k)}">${esc(k)}</button>`,
        )
        .join("") +
      "</div>";
    const last = {};
    $$("[data-mood]").forEach((b) =>
      on(b, "click", () => {
        const k = b.dataset.mood,
          arr = KUDU.messages[k];
        let n =
          last[k] === undefined
            ? Math.floor(Math.random() * arr.length)
            : (last[k] + 1) % arr.length;
        last[k] = n;
        $(".message-card").textContent = arr[n];
        bell("pop");
        done(msg);
      }),
    );
    hint(
      "Tap any mood for a message. Tap again for another. Stay as long as you like.",
    );
    restoreDone(msg);
  },
  function decorate() {
    const msg = "Perfect. Almost as cute as the പിറന്നാൾ girl.";
    setup(
      "A cake worthy of Kudu.",
      "A little cream, a few flowers, and the finishing touches.",
      "MADE WITH EXTRA LOVE",
    );
    $("#stage").innerHTML =
      cake() +
      '<div class="choices">' +
      [
        ["cream", "Cream"],
        ["flowers", "Flowers"],
        ["with-candles", "Candles"],
        ["hearts", "Heart topper"],
        ["name", "Kudu topper"],
      ]
        .map(
          ([c, t]) => `<button class="choice" data-decor="${c}">${t}</button>`,
        )
        .join("") +
      "</div>";
    let n = 0;
    $$("[data-decor]").forEach((b) =>
      on(b, "click", () => {
        $(".cake-scene").classList.add(b.dataset.decor);
        b.disabled = true;
        bell("pop");
        if (++n === 5) done(msg);
      }),
    );
    hint("Tap all five decorations to make the cake yours.");
    restoreDone(msg);
  },
  function candles() {
    const msg = "Make a wish, Kudu… ♡";
    setup(
      "Close your eyes. Make a wish.",
      "Press and hold the button to send a little പിറന്നാൾ breeze.",
      "A WISH JUST FOR YOU",
    );
    $("#stage").innerHTML =
      cake("cream flowers with-candles hearts name") +
      '<div class="hold-progress" aria-hidden="true"><span></span></div>' +
      button("blow", "Hold to blow the candles") +
      button("blow-tap", "Or send a gentle breeze with one tap", "text-button");
    let start = 0,
      holding = false,
      finished = false;
    function extinguish() {
      if (finished) return;
      finished = true;
      holding = false;
      $(".cake-scene").classList.add("unlit");
      $(".hold-progress span").style.width = "100%";
      $("#blow").disabled = true;
      $("#blow-tap").disabled = true;
      done(msg);
    }
    function hold() {
      if (finished || holding) return;
      holding = true;
      start = performance.now();
      function tick(now) {
        if (!holding) return;
        const progress = Math.min(1, (now - start) / 1400);
        $(".hold-progress span").style.width = progress * 100 + "%";
        if (progress === 1) extinguish();
        else frame = requestAnimationFrame(tick);
      }
      frame = requestAnimationFrame(tick);
    }
    function release() {
      holding = false;
      if (!finished) $(".hold-progress span").style.width = "0";
    }
    on($("#blow"), "pointerdown", (e) => {
      e.preventDefault();
      $("#blow").setPointerCapture(e.pointerId);
      hold();
    });
    on($("#blow"), "pointerup", release);
    on($("#blow"), "pointercancel", release);
    on($("#blow"), "keydown", (e) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        hold();
      }
    });
    on($("#blow"), "keyup", release);
    on($("#blow-tap"), "click", extinguish);
    hint(
      "Hold the button for a moment, or choose the single-tap breeze below it. No microphone is needed.",
    );
    restoreDone(msg);
  },
  function cutCake() {
    const msg = "Happy പിറന്നാൾ Kudu ♡ First piece for me, obviously.";
    setup(
      "The sweetest little moment.",
      "Swipe across the cake to cut the first slice.",
      "HAPPY പിറന്നാൾ, MY LOVE",
    );
    $("#stage").innerHTML =
      cake("cream flowers with-candles hearts name unlit") +
      button("cut-cake", "Cut our first slice ♡");
    $(".cake-scene").insertAdjacentHTML(
      "beforeend",
      '<span class="knife" aria-hidden="true"><svg width="85" height="30" viewBox="0 0 85 30"><path d="M4 7H57V19H16Q5 19 4 7" fill="#d8d7d1" stroke="#a9a49a"/><rect x="56" y="6" width="26" height="14" rx="4" fill="#85515d"/><circle cx="65" cy="13" r="2" fill="#dabb82"/></svg></span>',
    );
    let finished = false,
      start;
    function cut() {
      if (finished) return;
      finished = true;
      $(".cake-scene").classList.add("cut");
      $(".knife").hidden = true;
      $("#cut-cake").disabled = true;
      done(msg);
    }
    on($("#cut-cake"), "click", cut);
    on($(".cake-scene"), "pointerdown", (e) => {
      start = e.clientX;
      $(".cake-scene").setPointerCapture(e.pointerId);
    });
    on($(".cake-scene"), "pointerup", (e) => {
      if (Math.abs(e.clientX - start) > 30) cut();
    });
    hint("Swipe sideways over the cake, or tap “Cut our first slice.”");
    restoreDone(msg);
  },
  function future() {
    const msg = "And a completely new chapter…";
    setup(
      "A little box of tomorrows.",
      "Some wishes for all the days we have yet to live.",
      "THE BEST IS STILL UNWRITTEN",
    );
    $("#stage").innerHTML =
      '<button class="keepsake" aria-label="Open our future box"></button><div class="future-card" role="status">What shall we keep inside?</div>';
    const cards = [
      "More laughs.",
      "More small trips.",
      "More family days.",
      "More silly fights.",
      "More making up.",
      "More photos.",
      "More memories.",
      "More us.",
    ];
    let n = 0;
    on($(".keepsake"), "click", () => {
      if (n < cards.length) {
        $(".future-card").textContent = cards[n++];
        bell("pop");
        if (n === cards.length) {
          $(".keepsake").disabled = true;
          done(msg);
          $("#next").innerHTML = "Open the last surprise ♡";
        }
      }
    });
    hint("Tap the keepsake box to open each little wish for our future.");
    restoreDone(msg);
    if ($("#next")) $("#next").innerHTML = "Open the last surprise ♡";
  },
  function junior() {
    clean();
    document.body.classList.add("dark");
    window.scrollTo(0, 0);
    app.innerHTML =
      '<section class="final"><div class="eyebrow" style="justify-content:center">OUR MOST BEAUTIFUL CHAPTER</div><div class="three-hearts" aria-hidden="true"><span>♡</span><span>♡</span><span>♡</span></div><div class="final-line" aria-live="polite"></div>' +
      button("reveal-line", "Stay with me ♡") +
      "</section>";
    const lines = [
      "Kudu…\nThis പിറന്നാൾ feels different.",
      "Because this year…\nit isn’t only you and me anymore. ♡",
      "There is a tiny little person already listening to our stories…\nalready travelling everywhere with you…\nalready making our family a little bigger.",
      "Five months of carrying our little Junior.\nA whole lifetime of love already. ♡",
    ];
    let i = 0;
    function draw() {
      $(".final-line").style.whiteSpace = "pre-line";
      $(".final-line").textContent = lines[i];
      $(".final-line").style.animation = "none";
      void $(".final-line").offsetWidth;
      $(".final-line").style.animation = "";
      $("#reveal-line").textContent =
        i === lines.length - 1
          ? "One last letter, my love ♡"
          : "Stay with me ♡";
    }
    draw();
    on($("#reveal-line"), "click", () => {
      if (++i < lines.length) {
        draw();
        bell();
      } else finale();
    });
  },
];
function cake(classes = "") {
  return `<div class="cake-scene ${classes}" aria-label="Kudu’s പിറന്നാൾ cake"><div class="cake-plate"></div><div class="cake-body"></div><div class="cake-top"></div><div class="cake-flowers">✿ ✿</div><div class="cake-topper">Kudu</div><div class="cake-heart">♡</div><div class="candles"><i class="candle"></i><i class="candle"></i><i class="candle"></i></div><div class="cake-slice"></div></div>`;
}
function finale() {
  if (!state.completed.includes(27)) {
    state.completed.push(27);
    save();
  }
  app.innerHTML = `<section class="final"><div class="eyebrow" style="justify-content:center">YOU ARE SO LOVED</div><div class="three-hearts" aria-hidden="true"><span>♡</span><span>♡</span><span>♡</span></div><article class="final-letter"><h2>Happy പിറന്നാൾ<br>Kudu ♡</h2>This പിറന്നാൾ, I celebrate you.

The woman I love.
My wife. My home.
And now, the beautiful mother of our little one.

This year we celebrate your പിറന്നാൾ together…

but next പിറന്നാൾ,
there will be a tiny pair of hands trying to grab your cake,
a little person probably stealing all the attention,
and our little Junior celebrating Amma’s പിറന്നാൾ with us. ♡

So enjoy this പിറന്നാൾ, Kudu.
Because our next one is going to look very different.</article>${photo("couple")}<p class="signature">From, your Vishnu ♡</p><div class="heart-names">VISHNU ♡ KUDU ♡ JUNIOR</div><p class="final-closing">Our next chapter has already begun…</p>${button("replay", "Replay our journey ♡", "secondary")}</section>`;
  on($("#replay"), "click", () => $("#restart-dialog").showModal());
  confetti();
  bell();
  window.scrollTo(0, 0);
}
// Page-level controls intentionally survive scene changes.
document.addEventListener("click", (e) => {
  const p = e.target.closest("[data-photo]");
  if (p) showPhoto(p.dataset.photo);
});
document.addEventListener("keydown", (e) => {
  if (
    (e.key === "Enter" || e.key === " ") &&
    e.target.matches("[data-photo]")
  ) {
    e.preventDefault();
    e.target.click();
  }
  if (e.key === "Escape") {
    $("#menu").hidden = true;
    $("#menu-toggle").setAttribute("aria-expanded", "false");
  }
});
$("#menu-toggle").addEventListener("click", () => {
  const open = $("#menu").hidden;
  $("#menu").hidden = !open;
  $("#menu-toggle").setAttribute("aria-expanded", open);
});
function closeMenu() {
  $("#menu").hidden = true;
  $("#menu-toggle").setAttribute("aria-expanded", "false");
}
$("#sound-toggle").textContent = state.sound ? "Sound on ♫" : "Sound off ♫";
$("#sound-toggle").addEventListener("click", () => {
  state.sound = !state.sound;
  save();
  $("#sound-toggle").textContent = state.sound ? "Sound on ♫" : "Sound off ♫";
  if (!state.sound && activeMusic) {
    activeMusic.pause();
    $(".record")?.classList.remove("playing");
    if ($("#play")) $("#play").textContent = "Play our music";
  }
  bell();
});
$("#previous").addEventListener("click", () => {
  closeMenu();
  if (state.started && state.current > 0) {
    state.current--;
    render();
  } else opening();
});
$("#return-current").addEventListener("click", () => {
  closeMenu();
  if (state.started) render();
  else opening();
});
$("#home-link").addEventListener("click", (e) => {
  e.preventDefault();
  closeMenu();
  opening();
});
$("#restart").addEventListener("click", () => {
  closeMenu();
  $("#restart-dialog").showModal();
});
$("#cancel-restart").addEventListener("click", () =>
  $("#restart-dialog").close(),
);
$("#confirm-restart").addEventListener("click", () => {
  $("#restart-dialog").close();
  state = { current: 0, completed: [], started: false, sound: state.sound };
  save();
  opening(true);
});
$("#photo-dialog .close-modal").addEventListener("click", () =>
  $("#photo-dialog").close(),
);
$("#photo-dialog").addEventListener("click", (e) => {
  if (e.target === $("#photo-dialog")) $("#photo-dialog").close();
});
if (state.started) render();
else opening(true);
