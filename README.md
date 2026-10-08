# Clawd Island

A minimalist, full-screen "living wallpaper" for your iPad, starring Clawd. There are no widgets. The whole screen is one calm scene:

- **A liquid Dynamic Island** at the top. It shows the time, and while a timer runs it splits off a bubble with a progress ring. It also pops open with alerts (focus started, task shipped, break over). Tap it to expand into a Live Activity with Pause, +5 min, Skip, and Ship task.
- **A large thin clock** with the date and a Claude status line underneath (`✻ Pondering… · your current task`).
- **Clawd on the horizon.** Clawd wanders across the screen, thinks out loud with Claude's spinner and verbs, and talks in comic speech bubbles. In focus mode Clawd types on a laptop, on breaks Clawd sips coffee, and after a few idle minutes Clawd falls asleep. Shipping a task sets off a "SHIPPED!" burst. Tap Clawd to say hi.
- **The horizon line is the timer.** It fills with orange during focus and green during breaks. The glow behind it changes with the time of day.
- **Tasks & timer live in a sheet.** Tap the status line or the "Tasks & timer" button to slide it up; swipe down or tap outside to close it.
- **Corner buttons fade away** after a few seconds untouched, so it stays clean on your desk. Touch the screen to bring them back.

Everything (tasks, timer, today's stats) is saved on the device. There is no account and no server.

## Put it on your iPad

1. Host the folder anywhere static. The easiest option is **GitHub Pages**: in the repo, go to *Settings → Pages → Deploy from branch*, then pick the branch and `/ (root)`.
2. Open the Pages URL in **Safari** on the iPad.
3. Tap **Share → Add to Home Screen**. Launching from the icon opens it full screen with no browser bars, and it works offline after the first load.
4. Turn on the ☀︎ keep-awake button (top right) so it can sit on your desk like a clock.

> iPadOS doesn't let apps or websites draw over other apps, so the island lives inside this app, not across the whole system.

## Home Screen & Lock Screen widgets

Web apps can't make iPad widgets, so the widget uses **Scriptable**, a free app that turns a script into a native widget.

![Widget sizes](widget/preview.png)

Clawd's mood follows the clock: waving in the morning, happy in the evening, asleep at night. Each refresh (about every 15 minutes) brings a new speech bubble and a Claude status verb. Tapping the widget opens the app.

1. Install **Scriptable** from the App Store (free).
2. In Safari, open [`widget/clawd-widget.js`](https://raw.githubusercontent.com/SGBOI/Dynamic-Island/claude/clawd-island/widget/clawd-widget.js), select all the text, and copy it.
3. In Scriptable, tap **+**, paste, and rename the script to **Clawd** (tap the title at the top).
4. Go to the Home Screen, long-press an empty spot → **Edit** → **Add Widget** → **Scriptable**. Pick a size and add it.
5. Long-press the new widget → **Edit Widget** → set **Script** to **Clawd**.
   Optional: type your current task in **Parameter**, and Clawd will cheer you on about it.

For the Lock Screen: long-press the Lock Screen → **Customize** → **Lock Screen** → tap the widget area → **Scriptable**, then set the script to Clawd the same way.

## Files

- `index.html`: the whole app (HTML, CSS, JS, and Clawd drawn as pixel-art SVG)
- `manifest.webmanifest`, `sw.js`, `icons/`: Home Screen install and offline support
- `widget/clawd-widget.js`: the Scriptable widget
