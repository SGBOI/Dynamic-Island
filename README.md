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

## Files

- `index.html`: the whole app (HTML, CSS, JS, and Clawd drawn as pixel-art SVG)
- `manifest.webmanifest`, `sw.js`, `icons/`: Home Screen install and offline support
