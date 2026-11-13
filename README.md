# Homework Captain — homework help, in your own voice

A single-page web app. A parent snaps a photo of a child's homework worksheet
and gets a parent-coaching card: exactly what to say, answers hidden behind a
tap, and a "Play Quick Check" game made from that page. Grounded in Florida
B.E.S.T. standards and the Science of Reading (see reading-coach-basis.md).

## One repo, two hosts
- **Netlify** (main): homework-captain.netlify.app — serves index.html and
  netlify/functions/scan.js. netlify.toml rewrites /api/scan to that function.
- **Cloudflare Pages** (backup): serves the same index.html and the Pages
  Function at functions/api/scan.js.

The app always calls /api/scan. Both hosts need the environment variable
GEMINI_API_KEY set (a free-tier Google Gemini key with no billing attached).
The key is never in this repo.

## Notes
- No build step. index.html is the whole app.
- Per-phone soft cap: 20 scans/day. Photos are never stored.
