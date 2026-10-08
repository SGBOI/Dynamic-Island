// Clawd Island widgets for Scriptable (free on the App Store: https://scriptable.app)
//
// One script, many widgets. Long-press a widget → Edit Widget → Parameter, then type one of:
//
//   scene                     Clawd on the horizon with a speech bubble (default for medium / large)
//   scene: Finish essay       …and Clawd mentions your task
//   clawd                     just Clawd, mood follows the clock (default for small)
//   date                      big date with Clawd peeking up from the bottom
//   day                       how much of today is gone, Clawd walks along it
//   quote                     a comic speech bubble from Clawd
//   focus: Finish essay       your one task right now, Clawd at the laptop
//   tasks: Essay; Gym; x Email     a ship list (start an item with "x " to tick it off)
//   week                      this week with today marked
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
const STYLES = ["scene", "clawd", "date", "day", "quote", "focus", "tasks", "week"];
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
// Widget sizes in points (iPad). The image fills the widget, so content keeps a safe margin.
const SIZE = { small: [170, 170], medium: [364, 170], large: [364, 382], extraLarge: [780, 382] };

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
    else r(ex - .5, 2, 1, 2, C.eye);
  }
  if (pose === "typing") { // laptop in front
    r(3.5, 4.4, 11, 4.6, C.lid); r(2, 9, 14, .8, "#3d3835");
    txt(ctx, "✻", x0 + 7.4 * u, y0 + 5.05 * u, 3.2 * u, 3 * u, Font.boldSystemFont(2.5 * u), C.clayHi, "center");
  }
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

/* ---------- widget styles ---------- */
const PAINT = {
  scene(W, H) {
    const ctx = canvas(W, H), hz = H * .72, wide = W / H > 1.5, s = H / 170, f = Math.min(s, 1.45);
    sky(ctx, W, H, hz);
    const tx = W * .07, ty = H * (wide ? .1 : .07);
    txt(ctx, DAYS[now.getDay()], tx, ty, W * .6, 40 * s, Font.lightSystemFont((wide ? 26 * s : 30 * f)), C.text);
    txt(ctx, `${MONTHS[now.getMonth()]} ${now.getDate()}`, tx, ty + (wide ? 31 * s : 38 * f), W * .6, 20 * s, Font.regularSystemFont(wide ? 12 * s : 14 * f), C.muted);
    const u = wide ? H * .026 : W * .022, cx = W * (wide ? .72 : .66);
    clawdWithReflection(ctx, cx, hz, u, mood);
    const bw = wide ? W * .4 : W * .7, bh = wide ? 44 * Math.max(1, s * .8) : 50 * f;
    const by = Math.max(wide ? 0 : ty + 38 * f + 30 * f, hz - 10 * u - bh - 18);
    bubble(ctx, clamp(cx - bw * .6, W * .05, W * .95 - bw), by, bw, bh, line, wide ? 12 * Math.max(1, s * .75) : 13.5 * f, cx - u);
    const gy = hz + (H - hz) * .3, g = wide ? Math.max(1, s * .8) : f;
    status(ctx, tx, gy, W * .6, (wide ? 10 : 11) * g);
    if (extra) txt(ctx, `Now · ${extra}`, tx, gy + 16 * g, W * .6, 18 * g, Font.mediumSystemFont((wide ? 11 : 12) * g), C.text);
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
    const ctx = canvas(W, H), s = Math.min(H / 170, 1.25), tall = H / W > .8;
    sky(ctx, W, H, H * .9, .5);
    const items = (extra || "Plan today's top 3; Deep work block; x Reply to messages").split(/;|\n/).map(t => t.trim()).filter(Boolean);
    const done = items.filter(t => /^(x|✓)\s/i.test(t)).length;
    const x = W * .07;
    txt(ctx, "S H I P   L I S T", x, H * .08, W * .6, 16 * s, Font.boldMonospacedSystemFont(10 * s), C.clay);
    txt(ctx, `${done}/${items.length}`, W * .5, H * .08, W * .43, 16 * s, Font.mediumMonospacedSystemFont(10 * s), C.faint, "right");
    const rowH = 26 * s, max = Math.floor((H * .84 - H * .2) / rowH);
    items.slice(0, max).forEach((t, i) => {
      const isDone = /^(x|✓)\s/i.test(t), label = t.replace(/^(x|✓)\s+/i, ""), y = H * .2 + i * rowH;
      const r = new Rect(x, y + 3 * s, 14 * s, 14 * s);
      if (isDone) { ctx.setFillColor(col(C.clay)); ctx.fillEllipse(r); txt(ctx, "✓", x, y + 3.5 * s, 14 * s, 14 * s, Font.boldSystemFont(9 * s), C.ink, "center"); }
      else { ctx.setStrokeColor(col(C.muted)); ctx.setLineWidth(1.4); ctx.strokeEllipse(r); }
      txt(ctx, label, x + 22 * s, y + 1 * s, W * (tall ? .78 : .62), 20 * s, Font.regularSystemFont(14 * s), isDone ? C.faint : C.text);
    });
    if (!tall || items.length <= max - 3) clawd(ctx, W * .86, H * .9, Math.min(W, H) * .02, done === items.length ? "happy" : mood);
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
  }
};

/* ---------- Lock Screen ---------- */
function lockCircle() {
  const w = new ListWidget(); w.addAccessoryWidgetBackground = true;
  const ctx = canvas(60, 60, false); clawd(ctx, 30, 40, 2.6, mood);
  const img = w.addImage(ctx.getImage()); img.centerAlignImage();
  return w;
}
function lockRect() {
  const w = new ListWidget();
  const t1 = w.addText(`${SPARK} ${style === "tasks" ? "Ship list" : style === "focus" ? "Now" : "Clawd"}`); t1.font = Font.boldSystemFont(13);
  const body = style === "tasks" && extra ? extra.split(";").map(s => s.trim()).filter(s => !/^(x|✓)\s/i.test(s)).slice(0, 2).join(" · ") : (extra || line);
  const t2 = w.addText(body || "All shipped!"); t2.font = Font.regularSystemFont(13); t2.lineLimit = 2;
  return w;
}
function lockInline() {
  const w = new ListWidget();
  w.addText(`${SPARK} ${verb}…${extra ? " · " + extra.split(";")[0] : ""}`);
  return w;
}

/* ---------- run ---------- */
let widget;
if (family === "accessoryCircular") widget = lockCircle();
else if (family === "accessoryRectangular") widget = lockRect();
else if (family === "accessoryInline") widget = lockInline();
else {
  const [W, H] = SIZE[family] || SIZE.medium;
  widget = new ListWidget();
  widget.backgroundImage = PAINT[style](W, H);
}
widget.url = APP_URL;
widget.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000);

if (config.runsInWidget) Script.setWidget(widget);
else await widget.presentMedium();
Script.complete();
