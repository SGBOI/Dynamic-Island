// Clawd Island widget for Scriptable (free on the App Store: https://scriptable.app)
//
// Home Screen: small, medium, large, extra large.  Lock Screen: circle, rectangle, inline.
// Optional: long-press the widget → Edit Widget → Parameter → type the task you're focusing on.
// Tapping the widget opens the Clawd Island app.

const APP_URL = "https://sgboi.github.io/Dynamic-Island/";

const C = {
  bgTop: "#1a1310", bgBottom: "#0b0908", text: "#efe6dd", muted: "#8f8177", faint: "#5e534c",
  clay: "#d97757", clayHi: "#f2a582", clayLo: "#9b4a32", paper: "#f6ede3", ink: "#1d1410", eye: "#1b100c"
};
const col = (hex, a = 1) => new Color(hex, a);
const pick = a => a[Math.floor(Math.random() * a.length)];

const now = new Date();
const hour = now.getHours();
const family = config.widgetFamily || "medium";
const task = (args.widgetParameter || "").trim();

const VERBS = ["Clauding", "Pondering", "Noodling", "Percolating", "Tinkering", "Simmering", "Ruminating",
  "Wrangling", "Brewing", "Cogitating", "Moseying", "Puttering", "Whirring", "Vibing", "Forging"];
const verb = pick(VERBS);
const SPARK = pick(["✢", "✶", "✻", "✽"]);

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Clawd's mood follows the clock.
const mood = hour < 6 || hour >= 23 ? "sleep" : hour < 11 ? "wave" : hour >= 18 ? "happy" : "idle";

const LINES = {
  sleep: ["zzz… you should sleep too.", "It's late. Tomorrow-you says thanks.", "Resting my eyes. Just for a bit."],
  wave: ["Morning! What are we shipping?", "Coffee first, then greatness.", "Pick one thing. Start there."],
  idle: ["One task at a time.", "Small commits, big wins.", "Hydrate! Crabs need water too.", "Close a tab. You know which one.",
    "Stuck? Explain it to me.", "Done is better than perfect."],
  happy: ["Nice work today.", "Wrap one thing up, then rest.", "Shoulders down. Unclench the jaw."]
};
const TASK_LINES = t => [`Working on “${t}”? I believe in you.`, `Today's quest: ${t}.`, `${t}. Let's go.`];
const line = mood !== "sleep" && task && Math.random() < .6 ? pick(TASK_LINES(task)) : pick(LINES[mood]);

/* ---------- drawing ---------- */

// Pixel-art Clawd on the same 18×10 grid as the app, plus a faint horizon line.
function clawdImage(u, pose, opts = {}) {
  const W = opts.width || 20, H = 12;
  const ctx = new DrawContext();
  ctx.size = new Size(W * u, H * u);
  ctx.opaque = false;
  ctx.respectScreenScale = true;
  const ox = (W - 18) / 2, oy = 1.4;
  const r = (x, y, w, h, c) => { ctx.setFillColor(col(c)); ctx.fillRect(new Rect((ox + x) * u, (oy + y) * u, w * u, h * u)); };

  if (opts.horizon) r(-ox, 10, W, .1, C.faint);
  r(5, 9.9, 8, .35, "#000000");                          // shadow
  for (const x of [4, 6, 11, 13]) r(x, 8, 1, 2, C.clay);   // legs
  r(1, 4, 2, 2, C.clay);                                    // left arm
  if (pose === "wave") r(15.3, 1.3, 2, 2, C.clay); else r(15, 4, 2, 2, C.clay);
  r(3, 0, 12, 8, C.clay); r(3, 0, 12, .7, C.clayHi); r(3, 7.3, 12, .7, C.clayLo);

  for (const cx of [5.5, 12.5]) {
    if (pose === "happy" || pose === "wave") { r(cx - 1.05, 3.1, .7, .7, C.eye); r(cx - .35, 2.45, .7, .7, C.eye); r(cx + .35, 3.1, .7, .7, C.eye); }
    else if (pose === "sleep") r(cx - 1.1, 3.1, 2.2, .5, C.eye);
    else r(cx - .5, 2, 1, 2, C.eye);
  }
  if (pose === "sleep") {
    ctx.setTextColor(col(C.muted));
    ctx.setFont(Font.boldRoundedSystemFont(1.8 * u)); ctx.drawText("z", new Point((ox + 16.2) * u, 0));
    ctx.setFont(Font.boldRoundedSystemFont(1.2 * u)); ctx.drawText("z", new Point((ox + 17.6) * u, -.2 * u));
  }
  return ctx.getImage();
}

// Comic speech bubble with a tail pointing down at Clawd.
function bubbleImage(text, w, h, size) {
  const tail = 10, ctx = new DrawContext();
  ctx.size = new Size(w, h + tail);
  ctx.opaque = false;
  ctx.respectScreenScale = true;
  const box = new Rect(2, 2, w - 4, h - 4);
  const p = new Path(); p.addRoundedRect(box, 14, 14);
  ctx.addPath(p); ctx.setFillColor(col(C.paper)); ctx.fillPath();
  ctx.addPath(p); ctx.setStrokeColor(col("#070504")); ctx.setLineWidth(2.5); ctx.strokePath();

  const tx = Math.round(w * .5), base = h - 2;
  const t = new Path();
  t.move(new Point(tx - 9, base - 2)); t.addLine(new Point(tx - 12, base + tail - 1)); t.addLine(new Point(tx + 6, base - 2)); t.closeSubpath();
  ctx.addPath(t); ctx.setFillColor(col(C.paper)); ctx.fillPath();
  const edge = new Path();
  edge.move(new Point(tx - 9, base)); edge.addLine(new Point(tx - 12, base + tail - 1)); edge.addLine(new Point(tx + 6, base));
  ctx.addPath(edge); ctx.setStrokeColor(col("#070504")); ctx.setLineWidth(2.5); ctx.strokePath();

  ctx.setFont(Font.boldRoundedSystemFont(size));
  ctx.setTextColor(col(C.ink));
  ctx.drawTextInRect(text, new Rect(14, 10, w - 28, h - 18));
  return ctx.getImage();
}

function addText(stack, str, font, color, lines = 1) {
  const t = stack.addText(str);
  t.font = font; t.textColor = col(color); t.lineLimit = lines; t.minimumScaleFactor = .7;
  return t;
}
function statusLine(stack, size) {
  const row = stack.addStack(); row.centerAlignContent(); row.spacing = 5;
  addText(row, SPARK, Font.boldMonospacedSystemFont(size), C.clay);
  addText(row, verb + "…", Font.mediumMonospacedSystemFont(size), C.clayHi);
  return row;
}
function background(w) {
  const g = new LinearGradient();
  g.colors = [col(C.bgTop), col(C.bgBottom)];
  g.locations = [0, 1];
  w.backgroundGradient = g;
}
const dayLine = `${DAYS[now.getDay()]}`;
const dateLine = `${MONTHS[now.getMonth()]} ${now.getDate()}`;

/* ---------- layouts ---------- */

function small() {
  const w = new ListWidget(); background(w); w.setPadding(14, 14, 10, 14);
  addText(w, dayLine, Font.lightSystemFont(24), C.text);
  addText(w, dateLine, Font.regularSystemFont(13), C.muted);
  w.addSpacer(4);
  statusLine(w, 10);
  w.addSpacer();
  const img = w.addImage(clawdImage(5, mood, { horizon: true, width: 24 }));
  img.centerAlignImage();
  return w;
}

function medium(scale = 1) {
  const w = new ListWidget(); background(w); w.setPadding(12, 14, 8, 16);
  const row = w.addStack(); row.layoutHorizontally(); row.spacing = 10;

  const left = row.addStack(); left.layoutVertically();
  const bub = left.addImage(bubbleImage(line, 150 * scale, 48 * scale, 12 * scale));
  bub.imageSize = new Size(150 * scale, 58 * scale);
  const cl = left.addImage(clawdImage(6 * scale, mood, { horizon: true, width: 25 }));
  cl.imageSize = new Size(150 * scale, 72 * scale);

  row.addSpacer();
  const right = row.addStack(); right.layoutVertically();
  right.addSpacer(6);
  addText(right, dayLine, Font.lightSystemFont(28 * scale), C.text);
  addText(right, dateLine, Font.regularSystemFont(14 * scale), C.muted);
  right.addSpacer(10);
  statusLine(right, 11 * scale);
  right.addSpacer(4);
  addText(right, task ? `Now · ${task}` : "Tap to focus", Font.mediumSystemFont(12 * scale), task ? C.text : C.muted, 2);
  right.addSpacer();
  return w;
}

function large() {
  const w = new ListWidget(); background(w); w.setPadding(18, 18, 12, 18);
  addText(w, dayLine, Font.ultraLightSystemFont(44), C.text);
  addText(w, dateLine, Font.regularSystemFont(17), C.muted);
  w.addSpacer(8);
  statusLine(w, 12);
  if (task) { w.addSpacer(4); addText(w, `Now · ${task}`, Font.mediumSystemFont(14), C.text, 2); }
  w.addSpacer();
  const bubRow = w.addStack(); bubRow.addSpacer();
  const bub = bubRow.addImage(bubbleImage(line, 250, 64, 15)); bub.imageSize = new Size(250, 74);
  bubRow.addSpacer();
  w.addSpacer(2);
  const img = w.addImage(clawdImage(9.5, mood, { horizon: true, width: 26 }));
  img.centerAlignImage();
  return w;
}

function lockCircle() {
  const w = new ListWidget(); w.addAccessoryWidgetBackground = true;
  const img = w.addImage(clawdImage(3.2, mood, { width: 20 })); img.centerAlignImage();
  return w;
}
function lockRect() {
  const w = new ListWidget();
  const head = w.addStack(); head.spacing = 4;
  addText(head, SPARK + " Clawd", Font.boldSystemFont(13), "#ffffff");
  addText(w, task ? task : line, Font.regularSystemFont(13), "#ffffff", 2);
  return w;
}
function lockInline() {
  const w = new ListWidget();
  addText(w, `${SPARK} ${verb}… ${task ? "· " + task : ""}`.trim(), Font.regularSystemFont(12), "#ffffff");
  return w;
}

/* ---------- run ---------- */

const build = {
  small, medium: () => medium(1), large, extraLarge: () => medium(1.9),
  accessoryCircular: lockCircle, accessoryRectangular: lockRect, accessoryInline: lockInline
}[family] || (() => medium(1));
const widget = build();
widget.url = APP_URL;
widget.refreshAfterDate = new Date(Date.now() + 15 * 60 * 1000);

if (config.runsInWidget) Script.setWidget(widget);
else await widget.presentMedium();
Script.complete();
