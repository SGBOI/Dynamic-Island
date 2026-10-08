# Clawd Island

A Dynamic Island for your iPad, starring Clawd. It's a full-screen web app with:

- **A liquid Dynamic Island** at the top. It shows the time, and while a timer runs it splits off a bubble with a progress ring. It also pops open with alerts (focus started, task shipped, break over). Tap it to expand into a Live Activity with Pause, +5 min, Skip, and Ship task.
- **Clawd's comic panel.** Clawd wanders around, thinks out loud with Claude's spinner (`· ✢ ✳ ✶ ✻ ✽`) and verbs ("Pondering…", "Noodling…"), and talks in comic speech bubbles. In focus mode Clawd types on a laptop, on breaks Clawd sips coffee, and after a few idle minutes Clawd falls asleep. Shipping a task sets off a "SHIPPED!" burst with confetti. Tap Clawd to say hi.
- **Focus timer:** 25/5 pomodoro, with a long break every 4th round.
- **Ship list:** tasks you check off. The one marked NOW shows up in the island.
- **Desk-clock extras:** a keep-screen-awake toggle, sound chimes, and full screen.

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
