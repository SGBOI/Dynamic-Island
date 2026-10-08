// Clawd Island widgets for Scriptable (free on the App Store: https://scriptable.app). Works on iPhone and iPad.
//
// One script, many widgets. Long-press a widget → Edit Widget → Parameter, then type one of:
//
//   scene                     Clawd on the horizon with a speech bubble (default for medium / large)
//   scene: Finish essay       …and Clawd mentions your task
//   clawd                     just Clawd, mood follows the clock (default for small)
//   clock                     live clock with seconds (clock: 24 for 24-hour)
//   date                      big date with Clawd peeking up from the bottom
//   calendar                  this month, plus your next events on medium / large
//   day                       how much of today is gone, Clawd walks along it
//   week                      this week with today marked
//   battery                   battery level, Clawd reacts to it
//   tasks                     your open Reminders (tasks: @School for one list)
//   tasks: Essay; Gym; x Email     or type your own list ("x " ticks an item off)
//   focus: Finish essay       your one task right now, Clawd at the laptop
//   quote                     a comic speech bubble from Clawd
//   random                    a different Clawd every refresh: hats, weather, facts, headlines
//
// Lock Screen sizes work too (circle, rectangle, inline). Tapping any widget opens the app.

const APP_URL = "https://sgboi.github.io/Dynamic-Island/";

const C = {
  skyTop: "#0d0a09", skyLow: "#1a1210", ground: "#0b0908", text: "#efe6dd", muted: "#8f8177", faint: "#5e534c",
  line: "#3a302a", clay: "#d97757", clayHi: "#f2a582", clayLo: "#9b4a32", paper: "#f6ede3", ink: "#1d1410",
  outline: "#070504", eye: "#1b100c", lid: "#2c2826", sun: "#f5cf6b"
};
const col = (hex, a = 1) => new Color(hex, a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const pad = n => String(n).padStart(2, "0");

const now = new Date();
const hour = now.getHours();
const family = config.widgetFamily || "medium";

/* ---------- parameter ---------- */
const STYLES = ["scene", "clawd", "clock", "date", "calendar", "day", "week", "battery", "tasks", "focus", "quote", "random"];
const DEFAULT = { small: "clawd", medium: "scene", large: "scene", extraLarge: "scene" };
const raw = (args.widgetParameter || "").trim();
const m = raw.match(/^([a-z]+)\s*:?\s*([\s\S]*)$/i);
const style = m && STYLES.includes(m[1].toLowerCase()) ? m[1].toLowerCase() : (DEFAULT[family] || "scene");
const extra = m && STYLES.includes(m[1].toLowerCase()) ? m[2].trim() : raw;

/* ---------- words ---------- */
const VERBS = ["Clauding", "Pondering", "Noodling", "Percolating", "Tinkering", "Simmering", "Ruminating",
  "Wrangling", "Brewing", "Cogitating", "Moseying", "Puttering", "Whirring", "Vibing", "Forging"];
const verb = pick(VERBS);
const SPARK = pick(["✢", "✶", "✻", "✽"]);
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const mood = hour < 6 || hour >= 23 ? "sleep" : hour < 11 ? "wave" : hour >= 18 ? "happy" : "idle";
const LINES = {
  sleep: ["zzz… you should sleep too.", "It's late. Tomorrow-you says thanks.", "Resting my eyes. Just for a bit."],
  wave: ["Morning! What are we shipping?", "Coffee first, then greatness.", "Pick one thing. Start there."],
  idle: ["One task at a time.", "Small commits, big wins.", "Hydrate! Crabs need water too.", "Close a tab. You know which one.",
    "Stuck? Explain it to me.", "Done is better than perfect.", "Break it into smaller pieces."],
  happy: ["Nice work today.", "Wrap one thing up, then rest.", "Shoulders down. Unclench the jaw."]
};
const line = (mood !== "sleep" && extra && style === "scene") ? pick([`“${extra}”? I believe in you.`, `Today's quest: ${extra}.`, `${extra}. Let's go.`]) : pick(LINES[mood]);

/* ---------- canvas helpers ---------- */
// Widget sizes in points. The image fills the widget, so content keeps a safe margin.
const PHONE = (() => { try { return Device.isPhone(); } catch (e) { return false; } })();
const SIZE = PHONE ? { small: [158, 158], medium: [338, 158], large: [338, 354], extraLarge: [338, 354] }
  : { small: [170, 170], medium: [364, 170], large: [364, 382], extraLarge: [780, 382] };

function canvas(W, H, opaque = true) {
  const c = new DrawContext(); c.size = new Size(W, H); c.opaque = opaque; c.respectScreenScale = true; return c;
}
function box(ctx, x, y, w, h, c, a = 1) { ctx.setFillColor(col(c, a)); ctx.fillRect(new Rect(x, y, w, h)); }
function txt(ctx, s, x, y, w, h, font, color, align = "left", a = 1) {
  ctx.setFont(font); ctx.setTextColor(col(color, a));
  if (align === "center") ctx.setTextAlignedCenter(); else if (align === "right") ctx.setTextAlignedRight(); else ctx.setTextAlignedLeft();
  ctx.drawTextInRect(s, new Rect(x, y, w, h));
}
// Night sky with a warm glow on the horizon (DrawContext has no gradients, so it's drawn in bands).
function sky(ctx, W, H, hz, glow = .9) {
  const mix = (a, b, t) => { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b);
    return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join(""); };
  const bands = 48;
  for (let i = 0; i < bands; i++) { const y0 = hz * i / bands; box(ctx, 0, y0, W, hz / bands + 1, mix(C.skyTop, C.skyLow, Math.pow(i / bands, 1.6))); }
  box(ctx, 0, hz, W, H - hz, C.ground);
  for (let i = 0; i < 26; i++) {
    const rw = W * (1.3 - i * .045), rh = H * (.7 - i * .024);
    ctx.setFillColor(col(C.clay, .0065 * glow)); ctx.fillEllipse(new Rect(W / 2 - rw / 2, hz - rh / 2, rw, rh));
  }
  box(ctx, 0, hz, W, 1, "#ffece0", .16);
}
// Pixel Clawd on the app's 18×10 grid. (cx, base) = centre of the body, ground line.
function clawd(ctx, cx, base, u, pose, opts = {}) {
  const x0 = cx - 9 * u, y0 = base - 10 * u, a = opts.alpha ?? 1;
  const r = (x, y, w, h, c) => {
    const yy = opts.reflect ? base + (base - (y0 + (y + h) * u)) : y0 + y * u;
    ctx.setFillColor(col(c, a)); ctx.fillRect(new Rect(x0 + x * u, yy, w * u, h * u));
  };
  if (!opts.reflect) { ctx.setFillColor(col("#000000", .55 * a)); ctx.fillEllipse(new Rect(cx - 5 * u, base - .45 * u, 10 * u, .9 * u)); }
  for (const x of [4, 6, 11, 13]) r(x, 8, 1, 2, C.clay);
  r(1, 4, 2, 2, C.clay);
  if (pose === "wave") r(15.3, 1.3, 2, 2, C.clay); else r(15, 4, 2, 2, C.clay);
  r(3, 0, 12, 8, C.clay); r(3, 0, 12, .7, C.clayHi); r(3, 7.3, 12, .7, C.clayLo);
  for (const ex of [5.5, 12.5]) {
    if (pose === "happy" || pose === "wave") { r(ex - 1.05, 3.1, .7, .7, C.eye); r(ex - .35, 2.45, .7, .7, C.eye); r(ex + .35, 3.1, .7, .7, C.eye); }
    else if (pose === "sleep") r(ex - 1.1, 3.1, 2.2, .5, C.eye);
    else if (pose === "typing") r(ex - .5, 2.4, 1, 1.4, C.eye);
    else if (pose === "surprised") r(ex - .65, 1.7, 1.3, 2.6, C.eye);
    else r(ex - .5, 2, 1, 2, C.eye);
  }
  if (pose === "typing") { // laptop in front
    r(3.5, 4.4, 11, 4.6, C.lid); r(2, 9, 14, .8, "#3d3835");
    txt(ctx, "✻", x0 + 7.4 * u, y0 + 5.05 * u, 3.2 * u, 3 * u, Font.boldSystemFont(2.5 * u), C.clayHi, "center");
  }
  if (opts.gear && !opts.reflect) gear(ctx, x0, y0, u, opts.gear);
  if (pose === "sleep" && !opts.reflect) {
    txt(ctx, "z", x0 + 16 * u, y0 - 2.6 * u, 4 * u, 3 * u, Font.boldRoundedSystemFont(2 * u), C.muted);
    txt(ctx, "z", x0 + 18 * u, y0 - 4 * u, 3 * u, 2 * u, Font.boldRoundedSystemFont(1.3 * u), C.faint);
  }
}
function clawdWithReflection(ctx, cx, base, u, pose) {
  clawd(ctx, cx, base, u, pose, { reflect: true, alpha: .055 });
  clawd(ctx, cx, base, u, pose);
}
// Comic speech bubble; the tail points down at tailX.
function bubble(ctx, x, y, w, h, s, size, tailX) {
  const p = new Path(); p.addRoundedRect(new Rect(x, y, w, h), 13, 13);
  ctx.addPath(p); ctx.setFillColor(col(C.paper)); ctx.fillPath();
  ctx.addPath(p); ctx.setStrokeColor(col(C.outline)); ctx.setLineWidth(2.4); ctx.strokePath();
  const tx = clamp(tailX, x + 18, x + w - 14), b = y + h;
  const t = new Path(); t.move(new Point(tx - 8, b - 2)); t.addLine(new Point(tx - 11, b + 10)); t.addLine(new Point(tx + 6, b - 2)); t.closeSubpath();
  ctx.addPath(t); ctx.setFillColor(col(C.paper)); ctx.fillPath();
  const e = new Path(); e.move(new Point(tx - 8, b)); e.addLine(new Point(tx - 11, b + 10)); e.addLine(new Point(tx + 6, b));
  ctx.addPath(e); ctx.setStrokeColor(col(C.outline)); ctx.setLineWidth(2.4); ctx.strokePath();
  txt(ctx, s, x + 12, y + 8, w - 24, h - 12, Font.boldRoundedSystemFont(size), C.ink);
}
function status(ctx, x, y, w, size, color = C.clayHi) {
  txt(ctx, `${SPARK} ${verb}…`, x, y, w, size * 1.6, Font.mediumMonospacedSystemFont(size), color);
}
const dayFrac = () => (now - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 864e5;

// Hats, glasses and things to hold, on Clawd's grid. Used by the random widget.
function gear(ctx, x0, y0, u, g) {
  const r = (x, y, w, h, c, a = 1) => { ctx.setFillColor(col(c, a)); ctx.fillRect(new Rect(x0 + x * u, y0 + y * u, w * u, h * u)); };
  const hat = g.hat;
  if (hat === "party") { r(6.5, -1, 5, 1, C.sun); r(7.2, -2, 3.6, 1, C.clayHi); r(7.8, -3, 2.4, 1, C.sun); r(8.4, -4, 1.2, 1, C.clayHi); r(8.5, -4.9, 1, .9, C.paper); }
  if (hat === "crown") { r(5.5, -1.3, 7, 1.3, C.sun); r(5.5, -2.5, 1.2, 1.2, C.sun); r(8.4, -2.8, 1.2, 1.5, C.sun); r(11.3, -2.5, 1.2, 1.2, C.sun); r(8.7, -1, .6, .6, C.clay); }
  if (hat === "wizard") { const P = "#6b5bd6"; r(4, -.9, 10, .9, P); r(5.8, -2.1, 6.4, 1.2, P); r(6.8, -3.3, 4.4, 1.2, P); r(7.8, -4.5, 2.4, 1.2, P); r(8.5, -5.6, 1.2, 1.1, P); r(10.2, -6.2, .8, .8, P); r(7.4, -2.8, .7, .7, C.sun); r(10, -1.8, .5, .5, C.sun); }
  if (hat === "chef") { r(5.6, -1.1, 6.8, 1.1, C.paper); r(5, -3.2, 8, 2.1, C.paper); r(5.6, -4.1, 2.6, .9, C.paper); r(8.6, -4.3, 2.8, 1.1, C.paper); r(5.6, -1.1, 6.8, .25, "#d9cfc4"); }
  if (hat === "cap") { const B = "#3f6fd8"; r(4.6, -1.4, 8.8, 1.4, B); r(5.4, -2.1, 7.2, .8, B); r(13.4, -.6, 3.4, .6, B); r(8.7, -2.4, .6, .4, C.paper); }
  if (hat === "beanie") { r(3.8, -.9, 10.4, 1.3, C.clayLo); r(4.4, -2.3, 9.2, 1.5, C.paper); r(5.4, -3.1, 7.2, .9, C.paper); r(8.4, -4, 1.2, 1, C.clayLo); r(4.4, -1.7, 9.2, .4, C.clay); }
  if (hat === "headphones") { const D = "#2b2b30"; r(3.4, -1.3, 11.2, .6, D); r(2.8, -1.3, .6, 2.6, D); r(14.6, -1.3, .6, 2.6, D); r(2, 1.1, 1.4, 2.8, D); r(14.6, 1.1, 1.4, 2.8, D); r(2.2, 1.6, .6, 1.8, C.clayHi); r(15.2, 1.6, .6, 1.8, C.clayHi); }
  if (g.glasses) { const K = "#0a0a0a"; r(3.8, 1.9, 10.4, .5, K); r(4.2, 1.9, 3.1, 1.8, K); r(10.7, 1.9, 3.1, 1.8, K); r(4.6, 2.1, .8, .4, "#ffffff", .45); r(11.1, 2.1, .8, .4, "#ffffff", .45); }
  const hold = g.hold, bc = g.color || "#e36f8f";
  if (hold === "balloon") {
    for (let i = 0; i < 8; i++) r(17 + i * .25, 4.4 - i * 1.05, .25, 1.05, C.muted);
    ctx.setFillColor(col(bc)); ctx.fillEllipse(new Rect(x0 + 17.6 * u, y0 - 8.2 * u, 3.4 * u, 4 * u));
    r(19, -4.3, .6, .5, bc); r(18.2, -7.4, .6, 1, "#ffffff", .5);
  }
  if (hold === "sign") {
    r(17.3, -1, .4, 6, "#8a6d5d"); r(15, -5.4, 9, 4.6, C.outline); r(15.3, -5.1, 8.4, 4, C.paper);
    txt(ctx, g.sign, x0 + 15.3 * u, y0 - 4.6 * u, 8.4 * u, 3.4 * u, Font.heavySystemFont(1.55 * u), C.ink, "center");
  }
  if (hold === "mug") { r(17.2, 3.4, 2, 2.3, C.paper); r(19.2, 3.9, .6, 1.2, C.paper); r(17.7, 1.8, .4, 1, "#ffffff", .4); r(18.5, 1.1, .4, 1, "#ffffff", .4); }
  if (hold === "umbrella") {
    const U = "#c2553b"; r(8.8, -5, .4, 5, "#3a302a");
    r(-.5, -3, 19, 1, U); r(.5, -4, 17, 1, U); r(2.5, -5, 13, 1, U); r(5.5, -6, 7, 1, U); r(8.6, -6.8, .8, .8, U);
    for (const x of [-.5, 5.5, 11.5]) r(x, -3, 2.2, 1, C.clayHi);
  }
}
// Weather and party effects for the random widget.
function backdrop(ctx, W, H, hz, kind) {
  const R = (a, b) => a + Math.random() * (b - a);
  if (kind === "stars") {
    for (let i = 0; i < 46; i++) { const s = R(.7, 1.9); ctx.setFillColor(col(C.paper, R(.15, .7))); ctx.fillEllipse(new Rect(R(0, W), R(0, hz * .85), s, s)); }
    for (let i = 0; i < 4; i++) txt(ctx, "✻", R(0, W - 14), R(0, hz * .7), 16, 16, Font.boldSystemFont(R(8, 13)), C.clayHi, "left", .5);
  }
  if (kind === "rain") for (let i = 0; i < 80; i++) {
    const x = R(0, W + 10), y = R(-10, H); const p = new Path(); p.move(new Point(x, y)); p.addLine(new Point(x - 3, y + 9));
    ctx.addPath(p); ctx.setStrokeColor(col("#9fb4d9", .32)); ctx.setLineWidth(1); ctx.strokePath();
  }
  if (kind === "snow") for (let i = 0; i < 70; i++) { const s = R(1.4, 3.6); ctx.setFillColor(col(C.paper, R(.35, .85))); ctx.fillEllipse(new Rect(R(0, W), R(0, H), s, s)); }
  if (kind === "confetti") for (let i = 0; i < 46; i++) box(ctx, R(0, W), R(0, hz), R(2, 4), R(3, 6), pick([C.clay, C.sun, "#86d0ae", C.clayHi, "#6b5bd6"]), R(.5, .9));
  if (kind === "hearts") for (let i = 0; i < 9; i++) {
    const x = R(0, W - 12), y = R(0, hz * .8), p = R(1.6, 3);
    [[1, 0], [3, 0], [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [1, 2], [2, 2], [3, 2], [2, 3]].forEach(([a, b]) => box(ctx, x + a * p, y + b * p, p, p, C.clayHi, .55));
  }
  if (kind === "sunset") {
    const d = Math.min(W, H) * .55; ctx.setFillColor(col(C.clayHi, .2)); ctx.fillEllipse(new Rect(W * .72 - d / 2, hz - d / 2, d, d));
    ctx.setFillColor(col(C.sun, .16)); ctx.fillEllipse(new Rect(W * .72 - d * .32, hz - d * .32, d * .64, d * .64));
    box(ctx, 0, hz, W, H - hz, C.ground); box(ctx, 0, hz, W, 1, "#ffece0", .2);
  }
}

/* ---------- random Clawd ---------- */
const RANDOM = (() => {
  let back = pick(["stars", "rain", "snow", "confetti", "hearts", "sunset", "none", "stars"]);
  let hat = pick(["party", "crown", "wizard", "chef", "cap", "headphones", "none", "none"]);
  let hold = pick(["balloon", "sign", "mug", "none", "none"]);
  const glasses = Math.random() < .25;
  if (back === "rain") hold = "umbrella";
  if (back === "snow" && Math.random() < .6) hat = "beanie";
  if (back === "confetti" && Math.random() < .5) hat = "party";
  const FACTS = [
    "Clawd has never closed all their tabs. Not once.", "Clawd's favorite number is 8. Most legs.",
    "Clawd thinks semicolons are tiny winks;", "Clawd once debugged a sandwich. It worked.",
    "Clawd is 60% shell and 40% vibes.", "Clawd can't swim, but Clawd can scroll.",
    "Clawd's to-do list is just the word “ship”.", "Clawd has two arms and zero regrets.",
    "Clawd naps in the cloud. Literally.", "Clawd reads the docs. All of them. For fun.",
    "Clawd walks sideways so the bugs can't follow.", "Clawd's love language is a passing test suite.",
    "Clawd named a variable “banana” and never looked back."
  ];
  const VERB = ["refactors", "befriends", "accidentally ships", "politely declines", "renames", "deploys", "finds", "adopts", "high-fives", "out-naps"];
  const OBJ = ["the moon", "a very large sandwich", "your inbox", "a rubber duck", "Tuesday", "42 open tabs", "a single semicolon", "the whole weekend", "one (1) bug", "a cloud"];
  const SAYS = ["Did someone say snacks?", "I have achieved maximum crab.", "Is it Friday yet?", "I fixed it. Don't ask how.",
    "Ten more minutes. Then greatness.", "beep boop (crab dialect)", "I'm not lost. I'm exploring.", "New hat. Who dis?"];
  const DO = ["ship something small", "drink one extra water", "close one tab", "finish what you start", "ask for help once", "take the scenic route"];
  const SNACK = ["pretzels", "mango", "toast", "a single grape", "noodles", "cereal at 4 PM"];
  const kind = pick(["fact", "news", "scope", "says"]);
  const n = 1 + Math.floor(Math.random() * 999);
  const cap = {
    fact: ["CLAWD FACT #" + n, pick(FACTS)],
    news: ["BREAKING", `Clawd ${pick(VERB)} ${pick(OBJ)}.`],
    scope: ["CLAWDSCOPE", `Today: ${pick(DO)}. Lucky snack: ${pick(SNACK)}.`],
    says: ["EPISODE " + n, pick(SAYS)]
  }[kind];
  return {
    back, kind, label: cap[0], text: cap[1],
    pose: pick(["wave", "happy", "idle", "idle", "surprised"]),
    gear: { hat, hold, glasses, sign: pick(["HI!", "SHIP IT", "NAP?", "LGTM", "WOW", "BRB", "YAY", "OK!"]), color: pick(["#e36f8f", "#86d0ae", C.sun, "#6b9be3"]) }
  };
})();

/* ---------- data for tasks, calendar, battery ---------- */
const data = {};
async function loadReminders(listName) {
  try {
    let cals;
    if (listName) { const c = await Calendar.forRemindersByTitle(listName); cals = [c]; }
    const open = await Reminder.allIncomplete(cals);
    open.sort((a, b) => (a.dueDate ? a.dueDate.getTime() : 9e15) - (b.dueDate ? b.dueDate.getTime() : 9e15));
    let doneToday = [];
    try { doneToday = await Reminder.completedToday(cals); } catch (e) {}
    return [...open.map(r => ({ title: r.title, done: false, due: r.dueDate })), ...doneToday.map(r => ({ title: r.title, done: true }))];
  } catch (e) { return null; }
}
async function loadCalendar() {
  try {
    const y = now.getFullYear(), mo = now.getMonth(), today0 = new Date(y, mo, now.getDate());
    const month = await CalendarEvent.between(new Date(y, mo, 1), new Date(y, mo + 1, 1));
    const days = new Set(month.filter(e => e.startDate.getMonth() === mo).map(e => e.startDate.getDate()));
    const soon = (await CalendarEvent.between(today0, new Date(today0.getTime() + 8 * 864e5)))
      .filter(e => e.isAllDay || e.endDate > now).sort((a, b) => a.startDate - b.startDate);
    return { days, soon };
  } catch (e) { return null; }
}
const fmtTime = d => { const h = d.getHours() % 12 || 12; return `${h}:${pad(d.getMinutes())} ${d.getHours() < 12 ? "AM" : "PM"}`; };
const dayLabel = d => { const t = new Date(now.getFullYear(), now.getMonth(), now.getDate()), diff = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - t) / 864e5);
  return diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : diff < 0 ? "Late" : DAYS[d.getDay()].slice(0, 3); };

/* ---------- widget styles ---------- */
const PAINT = {
  scene(W, H) {
    const wide = W / H > 1.5, ctx = canvas(W, H), hz = H * (wide ? .72 : .8), s = H / 170, f = Math.min(s, 1.45);
    sky(ctx, W, H, hz);
    const tx = W * .07, ty = H * (wide ? .1 : .07);
    txt(ctx, DAYS[now.getDay()], tx, ty, W * .6, 40 * s, Font.lightSystemFont((wide ? 26 * s : 30 * f)), C.text);
    txt(ctx, `${MONTHS[now.getMonth()]} ${now.getDate()}`, tx, ty + (wide ? 31 * s : 38 * f), W * .6, 20 * s, Font.regularSystemFont(wide ? 12 * s : 14 * f), C.muted);
    const u = wide ? H * .026 : W * .022, cx = W * (wide ? .72 : .66);
    clawdWithReflection(ctx, cx, hz, u, mood);
    const bw = wide ? W * .4 : W * .7, bh = wide ? 44 * Math.max(1, s * .8) : 50 * f;
    const by = Math.max(wide ? 0 : ty + 38 * f + 30 * f, hz - 10 * u - bh - 18);
    bubble(ctx, clamp(cx - bw * .6, W * .05, W * .95 - bw), by, bw, bh, line, wide ? 12 * Math.max(1, s * .75) : 13.5 * f, cx - u);
    const gy = hz + (H - hz) * (wide ? .3 : .2), g = wide ? Math.max(1, s * .8) : f;
    status(ctx, tx, gy, W * .6, (wide ? 10 : 11) * g);
    if (extra) txt(ctx, `Now · ${extra}`, tx, gy + 16 * g, wide ? W * .6 : W * .86, 18 * g, Font.mediumSystemFont((wide ? 11 : 12) * g), C.text);
    return ctx.getImage();
  },

  clawd(W, H) {
    const ctx = canvas(W, H), hz = H * .74;
    sky(ctx, W, H, hz);
    clawdWithReflection(ctx, W * .5, hz, Math.min(W, H) / 23, mood);
    status(ctx, W * .09, H * .09, W * .82, Math.min(W, H) * .066);
    return ctx.getImage();
  },

  date(W, H) {
    const ctx = canvas(W, H), s = Math.min(W, H) / 170;
    sky(ctx, W, H, H * 1.02, .7);
    txt(ctx, String(now.getDate()), W * .08, H * .02, W * .9, 96 * s, Font.ultraLightSystemFont(88 * s), C.text);
    txt(ctx, MONTHS[now.getMonth()].toUpperCase(), W * .1, H * .58, W * .6, 16 * s, Font.mediumMonospacedSystemFont(11 * s), C.clayHi);
    txt(ctx, DAYS[now.getDay()], W * .1, H * .67, W * .6, 20 * s, Font.regularSystemFont(15 * s), C.muted);
    clawd(ctx, W * .8, H + 3.6 * (W / 30), W / 30, mood === "sleep" ? "sleep" : "idle"); // peeking up from the edge
    return ctx.getImage();
  },

  day(W, H) {
    const ctx = canvas(W, H), s = H / 170, hz = H * .74, f = dayFrac(), wide = W / H > 1.5;
    sky(ctx, W, H, hz, .6);
    const x0 = W * .08, x1 = W * .92, px = x0 + (x1 - x0) * f;
    box(ctx, x0, hz - 1, px - x0, 2.5, C.clay);
    const u = Math.min(W, H) * .022;
    clawd(ctx, clamp(px, x0 + 9 * u, x1 - 9 * u), hz, u, mood);
    const left = Math.max(0, 24 * (1 - f)), hl = Math.floor(left), ml = Math.floor((left - hl) * 60);
    txt(ctx, `${Math.round(f * 100)}%`, x0, H * .06, W * .6, 60 * s, Font.ultraLightSystemFont(50 * s), C.text);
    txt(ctx, "of today is gone", x0, H * .06 + 54 * s, W * .7, 18 * s, Font.regularSystemFont(13 * s), C.muted);
    if (wide) txt(ctx, `${hl}h ${pad(ml)}m left`, W * .5, H * .1, W * .42, 22 * s, Font.lightMonospacedSystemFont(17 * s), C.clayHi, "right");
    else txt(ctx, `${hl}h ${pad(ml)}m left`, x0, hz + 10 * s, W * .84, 16 * s, Font.mediumMonospacedSystemFont(10.5 * s), C.faint);
    return ctx.getImage();
  },

  quote(W, H) {
    const ctx = canvas(W, H), s = H / 170, wide = W / H > 1.5, hz = H * .86;
    sky(ctx, W, H, hz, .5);
    const u = H * .03, cx = W * (wide ? .12 : .22);
    clawd(ctx, cx, hz, u, mood);
    const msg = extra || pick(LINES[mood]);
    bubble(ctx, W * .07, H * (wide ? .14 : .08), W * .86, H * (wide ? .4 : .52), msg, (wide ? 17 : 14) * s, cx - u);
    txt(ctx, "— Clawd", cx + 10 * u, hz - 15 * s, W * .5, 16 * s, Font.mediumMonospacedSystemFont(10 * s), C.faint);
    return ctx.getImage();
  },

  focus(W, H) {
    const ctx = canvas(W, H), s = Math.min(H / 170, 1.4), hz = H * .74, wide = W / H > 1.2;
    sky(ctx, W, H, hz, .8);
    const u = Math.min(W, H) * .028;
    clawdWithReflection(ctx, W * (wide ? .78 : .68), hz, u, "typing");
    const x = W * .07, tw = wide ? W * .52 : W * .86;
    txt(ctx, "N O W", x, H * .1, tw, 16 * s, Font.boldMonospacedSystemFont(10 * s), C.clay);
    txt(ctx, extra || "Pick one thing to focus on", x, H * .1 + 17 * s, tw, 52 * s, Font.semiboldSystemFont(19 * s), extra ? C.text : C.muted);
    status(ctx, x, hz + (H - hz) * .28, W * .6, 11 * s);
    return ctx.getImage();
  },

  tasks(W, H) {
    const ctx = canvas(W, H), s = Math.min(H / 170, 1.25), tall = H / W > .8 && W > 250;
    sky(ctx, W, H, H * .9, .5);
    const fromReminders = data.reminders !== undefined;
    let items;
    if (data.reminders === null) items = [{ title: "Open Scriptable and allow Reminders access", done: false }];
    else if (fromReminders) items = data.reminders.length ? data.reminders : [{ title: "Nothing left. Go outside!", done: true }];
    else items = (extra || "Plan today's top 3; Deep work block; x Reply to messages").split(/;|\n/).map(t => t.trim()).filter(Boolean)
      .map(t => ({ title: t.replace(/^(x|✓)\s+/i, ""), done: /^(x|✓)\s/i.test(t) }));
    const done = items.filter(t => t.done).length;
    const x = W * .07, title = extra.startsWith("@") ? extra.slice(1).trim().toUpperCase().split("").join(" ") : "S H I P   L I S T";
    txt(ctx, title, x, H * .08, W * .6, 16 * s, Font.boldMonospacedSystemFont(10 * s), C.clay);
    txt(ctx, `${done}/${items.length}`, W * .5, H * .08, W * .43, 16 * s, Font.mediumMonospacedSystemFont(10 * s), C.faint, "right");
    const rowH = 26 * s, max = Math.floor((H * .84 - H * .2) / rowH);
    items.slice(0, max).forEach((t, i) => {
      const y = H * .2 + i * rowH, r = new Rect(x, y + 3 * s, 14 * s, 14 * s);
      if (t.done) { ctx.setFillColor(col(C.clay)); ctx.fillEllipse(r); txt(ctx, "✓", x, y + 3.5 * s, 14 * s, 14 * s, Font.boldSystemFont(9 * s), C.ink, "center"); }
      else { ctx.setStrokeColor(col(C.muted)); ctx.setLineWidth(1.4); ctx.strokeEllipse(r); }
      const dueW = t.due ? W * .2 : 0;
      txt(ctx, t.title, x + 22 * s, y + 1 * s, W * (tall ? .78 : .62) - dueW, 20 * s, Font.regularSystemFont(14 * s), t.done ? C.faint : C.text);
      if (t.due) { const late = t.due < now; txt(ctx, late ? "late" : dayLabel(t.due) === "Today" ? fmtTime(t.due) : dayLabel(t.due), W * .6, y + 3 * s, W * .33, 16 * s,
        Font.mediumMonospacedSystemFont(9.5 * s), late ? C.clay : C.muted, "right"); }
    });
    if (!tall || items.length <= max - 3) clawd(ctx, W * .86, H * .9, Math.min(W, H) * .02, items.length && done === items.length ? "happy" : mood);
    return ctx.getImage();
  },

  week(W, H) {
    const ctx = canvas(W, H), s = Math.min(H / 170, 1.3), hz = H * .9;
    sky(ctx, W, H, hz, .5);
    const d0 = new Date(now); d0.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday
    const t = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())); t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
    const wk = Math.ceil(((t - new Date(Date.UTC(t.getUTCFullYear(), 0, 1))) / 864e5 + 1) / 7);
    const x0 = W * .07, cw = (W * .86) / 7;
    txt(ctx, `W E E K  ${wk}`, x0, H * .08, W * .6, 16 * s, Font.boldMonospacedSystemFont(10 * s), C.clay);
    txt(ctx, MONTHS[now.getMonth()], W * .4, H * .08, W * .53, 16 * s, Font.regularSystemFont(11 * s), C.faint, "right");
    const ti = (now.getDay() + 6) % 7, rowY = H * .62;
    "MTWTFSS".split("").forEach((L, i) => {
      const d = new Date(d0); d.setDate(d0.getDate() + i);
      const cx = x0 + cw * i + cw / 2, isT = i === ti;
      txt(ctx, L, cx - cw / 2, rowY - 22 * s, cw, 14 * s, Font.mediumMonospacedSystemFont(10 * s), isT ? C.clayHi : C.faint, "center");
      if (isT) { ctx.setFillColor(col(C.clay)); ctx.fillEllipse(new Rect(cx - 13 * s, rowY - 4 * s, 26 * s, 26 * s)); }
      txt(ctx, String(d.getDate()), cx - cw / 2, rowY, cw, 20 * s, Font.semiboldSystemFont(13 * s), isT ? C.ink : (i < ti ? C.faint : C.text), "center");
    });
    const cx = x0 + cw * ti + cw / 2, u = Math.min(cw / 20, 1.6 * s);
    clawd(ctx, cx, rowY - 26 * s, u, mood);
    return ctx.getImage();
  },

  battery(W, H) {
    const ctx = canvas(W, H), s = Math.min(H / 170, 1.4), wide = W / H > 1.5, tall = H / W > .8 && W > 250, hz = H * .84;
    const lvl = data.battery ?? .5, chg = !!data.charging, pct = Math.round(lvl * 100);
    sky(ctx, W, H, hz, chg ? 1.2 : .6);
    const fill = chg ? "#86d0ae" : pct <= 20 ? "#e0563b" : C.clay;
    const pose = chg ? "happy" : pct <= 20 ? "sleep" : pct >= 80 ? "wave" : "idle";
    const say = chg ? pick(["Charging… nom nom.", "Snack time for the battery."]) : pct <= 20 ? pick(["Running on fumes. Plug me in?", "Low battery. Same, honestly."])
      : pct >= 95 ? pick(["Fully charged. Let's go!", "100%? Unstoppable."]) : pick(["Plenty of juice left.", "Battery's fine. You're fine."]);
    const x = W * .07;
    txt(ctx, `${pct}%`, x, H * .05, W * .6, 64 * s, Font.ultraLightSystemFont((tall ? 64 : 48) * s), C.text);
    txt(ctx, chg ? "charging" : pct <= 20 ? "low battery" : "battery", x + 2, H * .05 + (tall ? 70 : 54) * s, W * .5, 16 * s, Font.mediumMonospacedSystemFont(10.5 * s), chg ? "#86d0ae" : C.muted);
    // pixel battery with Clawd standing on it
    const bw = wide ? W * .3 : tall ? W * .4 : W * .48, bh = bw * .44;
    const bx = wide ? W * .62 - bw / 2 : tall ? W * .5 - bw / 2 : W * .07, by = hz - bh;
    box(ctx, bx, by, bw, bh, C.muted); box(ctx, bx + 3, by + 3, bw - 6, bh - 6, C.ground);
    box(ctx, bx + bw, by + bh * .3, bw * .06, bh * .4, C.muted);
    const segs = 5, gap = 3, inner = bw - 12, sw = (inner - gap * (segs - 1)) / segs, lit = Math.max(1, Math.ceil(lvl * segs));
    for (let i = 0; i < segs; i++) box(ctx, bx + 6 + i * (sw + gap), by + 6, sw, bh - 12, i < lit ? fill : C.line, i < lit ? 1 : .6);
    if (chg) { const cx = bx + bw / 2, cy = by + bh / 2, k = bh * .36, p = new Path();
      p.move(new Point(cx + k * .2, cy - k)); p.addLine(new Point(cx - k * .5, cy + k * .15)); p.addLine(new Point(cx, cy + k * .15));
      p.addLine(new Point(cx - k * .2, cy + k)); p.addLine(new Point(cx + k * .5, cy - k * .15)); p.addLine(new Point(cx, cy - k * .15)); p.closeSubpath();
      ctx.addPath(p); ctx.setFillColor(col(C.sun)); ctx.fillPath(); }
    const u = wide ? Math.min(bw / 22, H * .028) : bw / 30;
    if (!wide && !tall) clawd(ctx, W * .8, hz, Math.min(W, H) * .02, pose);
    else clawd(ctx, bx + bw / 2, by, u, pose);
    if (tall) bubble(ctx, W * .12, H * .05 + 92 * s, W * .76, 38 * s, say, 14 * s, bx + bw / 2 - u);
    else if (wide) txt(ctx, say, x, H * .62, W * .42, 40 * s, Font.boldRoundedSystemFont(13 * s), C.text);
    return ctx.getImage();
  },

  calendar(W, H) {
    const ctx = canvas(W, H), s = Math.min(H / 170, 1.3), wide = W / H > 1.5, tall = H / W > .8 && W > 250;
    sky(ctx, W, H, H * 1.05, .45);
    const y = now.getFullYear(), mo = now.getMonth(), first = new Date(y, mo, 1), lead = (first.getDay() + 6) % 7, nd = new Date(y, mo + 1, 0).getDate();
    const rows = Math.ceil((lead + nd) / 7), cal = data.cal;
    const gx = W * .06, gy = H * (tall ? .05 : .08), gw = wide ? W * .42 : W * .88, gh = tall ? H * .52 : H * .86;
    txt(ctx, MONTHS[mo].toUpperCase(), gx, gy, gw * .7, 16 * s, Font.boldMonospacedSystemFont(10 * s), C.clay);
    txt(ctx, String(y), gx, gy, gw, 16 * s, Font.mediumMonospacedSystemFont(10 * s), C.faint, "right");
    const cw = gw / 7, top = gy + 18 * s, ch = (gh - (top - gy)) / (rows + 1);
    "MTWTFSS".split("").forEach((L, i) => txt(ctx, L, gx + i * cw, top, cw, ch, Font.mediumMonospacedSystemFont(8.5 * s), C.faint, "center"));
    for (let d = 1; d <= nd; d++) {
      const i = lead + d - 1, cx = gx + (i % 7) * cw, cy = top + ch * (1 + Math.floor(i / 7)), isT = d === now.getDate();
      if (isT) { const r = Math.min(cw, ch) * .92; ctx.setFillColor(col(C.clay)); ctx.fillEllipse(new Rect(cx + cw / 2 - r / 2, cy + ch / 2 - r / 2 - 1, r, r)); }
      txt(ctx, String(d), cx, cy + ch * .5 - 7.5 * s, cw, 16 * s, Font.semiboldSystemFont(10.5 * s), isT ? C.ink : d < now.getDate() ? C.faint : C.text, "center");
      if (cal && cal.days.has(d) && !isT) box(ctx, cx + cw / 2 - 1.2, cy + ch * .5 + 6 * s, 2.4, 2.4, C.clayHi);
    }
    if (!wide && !tall) return ctx.getImage();
    // up next
    const lx = wide ? W * .53 : W * .06, ly = wide ? H * .08 : H * .62, lw = wide ? W * .41 : W * .88, lh = (wide ? H * .86 : H * .34);
    txt(ctx, "U P   N E X T", lx, ly, lw, 16 * s, Font.boldMonospacedSystemFont(10 * s), C.clay);
    if (!cal) { txt(ctx, "Open Scriptable and allow Calendar access to see your events.", lx, ly + 20 * s, lw, 60 * s, Font.regularSystemFont(12 * s), C.muted); return ctx.getImage(); }
    const rowH = 34 * s, max = Math.max(1, Math.floor((lh - 20 * s) / rowH)), list = cal.soon.slice(0, max);
    if (!list.length) { txt(ctx, "Nothing scheduled. Nap?", lx, ly + 22 * s, lw, 20 * s, Font.boldRoundedSystemFont(13 * s), C.text);
      clawd(ctx, lx + lw * .75, ly + lh - 4, Math.min(W, H) * .02, "sleep"); return ctx.getImage(); }
    list.forEach((e, i) => {
      const ry = ly + 20 * s + i * rowH;
      ctx.setFillColor(e.calendar && e.calendar.color ? e.calendar.color : col(C.clay)); ctx.fillRect(new Rect(lx, ry + 3 * s, 3, rowH - 10 * s));
      txt(ctx, e.title || "Event", lx + 10, ry, lw - 10, 18 * s, Font.semiboldSystemFont(12.5 * s), C.text);
      txt(ctx, `${dayLabel(e.startDate)} · ${e.isAllDay ? "All day" : fmtTime(e.startDate)}`, lx + 10, ry + 16 * s, lw - 10, 14 * s, Font.mediumMonospacedSystemFont(9.5 * s), C.muted);
    });
    return ctx.getImage();
  },

  clockBg(W, H) {
    const ctx = canvas(W, H), s = Math.min(H / 170, 1.4), wide = W / H > 1.5, tall = H / W > .8 && W > 250, hz = H * (tall ? .82 : wide ? .8 : .86);
    sky(ctx, W, H, hz, .8);
    const label = `${DAYS[now.getDay()].toUpperCase()} ${now.getDate()}${/24/.test(extra) ? "" : (hour < 12 ? " · AM" : " · PM")}`;
    const x = W * .07;
    txt(ctx, label, x, H * (wide ? .12 : .08), wide ? W * .55 : W * .86, 16 * s, Font.boldMonospacedSystemFont(10 * s), C.clay, wide ? "left" : "center");
    if (wide) { clawdWithReflection(ctx, W * .82, hz, H * .03, mood); status(ctx, x, hz + (H - hz) * .3, W * .5, 10.5 * s); }
    else if (tall) { clawdWithReflection(ctx, W * .5, hz, W * .03, mood); status(ctx, x, H * .38, W * .86, 12 * s); }
    else clawd(ctx, W * .5, hz, W / 32, mood);
    return ctx.getImage();
  },

  random(W, H) {
    const ctx = canvas(W, H), s = Math.min(H / 170, 1.4), wide = W / H > 1.5, tall = H / W > .8 && W > 250, small = !wide && !tall;
    const R = RANDOM, hz = H * (small ? .88 : tall ? .86 : .84);
    sky(ctx, W, H, hz, R.back === "sunset" ? 1.6 : .8);
    backdrop(ctx, W, H, hz, R.back);
    const u = small ? W / 34 : wide ? H * .03 : W * .026, cx = W * (small ? .36 : wide ? .66 : .42);
    clawd(ctx, cx, hz, u, R.pose, { gear: R.gear });
    const x = W * .07, tw = wide ? W * .46 : W * .86;
    if (R.kind === "says" && !wide) {
      txt(ctx, R.label, x, H * .05, tw, 14 * s, Font.boldMonospacedSystemFont(9 * s), C.clay);
      const bh = small ? H * .3 : H * .16;
      bubble(ctx, x, H * .05 + 16 * s, W * .86, bh, R.text, (small ? 11.5 : 15) * s, cx - u);
    } else if (tall) { // comic caption box
      const bh = H * .2; box(ctx, x - 2, H * .05 - 2, W * .86 + 4, bh + 4, C.outline); box(ctx, x, H * .05, W * .86, bh, C.sun);
      txt(ctx, R.label, x + 10, H * .05 + 8, W * .8, 14 * s, Font.heavyMonospacedSystemFont(9.5 * s), C.clayLo);
      txt(ctx, R.text, x + 10, H * .05 + 8 + 14 * s, W * .8, bh - 14 * s - 10, Font.heavySystemFont(15 * s), C.ink);
    } else {
      txt(ctx, R.label, x, H * .07, tw, 14 * s, Font.boldMonospacedSystemFont(9 * s), C.clay);
      txt(ctx, R.text, x, H * .07 + 15 * s, tw, (small ? H * .42 : H * .6), Font.boldRoundedSystemFont((small ? 11.5 : 15) * s), C.text);
    }
    return ctx.getImage();
  }
};

/* ---------- Lock Screen ---------- */
function lockCircle() {
  const w = new ListWidget(); w.addAccessoryWidgetBackground = true;
  const ctx = canvas(60, 60, false); clawd(ctx, 30, 40, 2.6, mood);
  const img = w.addImage(ctx.getImage()); img.centerAlignImage();
  return w;
}
function lockText() {
  if (style === "battery" && data.battery !== undefined) return `${Math.round(data.battery * 100)}%${data.charging ? " · charging" : ""}`;
  if (style === "calendar" && data.cal) { const e = data.cal.soon[0]; return e ? `${e.isAllDay ? dayLabel(e.startDate) : fmtTime(e.startDate)} ${e.title}` : "Nothing scheduled"; }
  if (style === "tasks" && data.reminders) return data.reminders.filter(t => !t.done).slice(0, 2).map(t => t.title).join(" · ") || "All done!";
  if (style === "tasks" && extra) return extra.split(";").map(s => s.trim()).filter(s => !/^(x|✓)\s/i.test(s)).slice(0, 2).join(" · ") || "All shipped!";
  if (style === "random") return RANDOM.text;
  return extra || line;
}
function lockRect() {
  const w = new ListWidget();
  const head = { tasks: "Ship list", focus: "Now", battery: "Battery", calendar: "Up next", random: RANDOM.label }[style] || "Clawd";
  const t1 = w.addText(`${SPARK} ${head}`); t1.font = Font.boldSystemFont(13);
  const t2 = w.addText(lockText()); t2.font = Font.regularSystemFont(13); t2.lineLimit = 2;
  return w;
}
function lockInline() {
  const w = new ListWidget();
  w.addText(`${SPARK} ${style === "scene" || style === "clawd" ? verb + "…" : lockText()}`);
  return w;
}
// Live clock: the seconds tick using a timer that counts up from midnight (or noon for 12-hour).
function clockWidget(W, H) {
  const w = new ListWidget(), wide = W / H > 1.5, tall = H / W > .8 && W > 250, s = Math.min(H / 170, 1.4);
  w.backgroundImage = PAINT.clockBg(W, H);
  const mid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const ref = !/24/.test(extra) && hour >= 13 ? new Date(mid.getTime() + 12 * 36e5) : mid;
  w.setPadding(0, wide ? W * .07 : 8, 0, wide ? 0 : 8);
  w.addSpacer(wide ? H * .3 : tall ? H * .13 : H * .2);
  const row = w.addStack(); if (!wide) row.addSpacer();
  const t = row.addDate(ref); t.applyTimerStyle();
  t.font = Font.lightMonospacedSystemFont(wide ? (W > 600 ? 84 : 44) : tall ? 62 : 30); t.textColor = col(C.text);
  if (!wide) { t.centerAlignText(); row.addSpacer(); } else t.leftAlignText();
  w.addSpacer();
  return w;
}

/* ---------- run ---------- */
if (style === "battery") { try { data.battery = Device.batteryLevel(); data.charging = Device.isCharging(); } catch (e) {} }
if (style === "tasks" && (!extra || extra.startsWith("@"))) data.reminders = await loadReminders(extra.startsWith("@") ? extra.slice(1).trim() : null);
if (style === "calendar") data.cal = await loadCalendar();

let widget;
if (family === "accessoryCircular") widget = lockCircle();
else if (family === "accessoryRectangular") widget = lockRect();
else if (family === "accessoryInline") widget = lockInline();
else {
  const [W, H] = SIZE[family] || SIZE.medium;
  if (style === "clock") widget = clockWidget(W, H);
  else { widget = new ListWidget(); widget.backgroundImage = PAINT[style](W, H); }
}
widget.url = APP_URL;
widget.refreshAfterDate = new Date(Date.now() + (style === "random" ? 10 : 15) * 60 * 1000);

if (config.runsInWidget) Script.setWidget(widget);
else await widget.presentMedium();
Script.complete();
