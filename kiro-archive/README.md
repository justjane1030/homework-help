# Homework Helper (photo → parent coach card)

A single-page web app. Snap or upload a photo of a child's homework worksheet
and get a warm, plain-English parent-coaching card: what to say, the real
answers hidden behind a tap, make-it-fun ideas, and a finish line.

- **Bring-your-own-key:** each user pastes their own free Google Gemini API key.
  The key is stored only in that browser (localStorage) — it is never in this
  file and never uploaded anywhere except Google when a photo is scanned.
- **No build step.** `index.html` is the whole app.

## Deploy
Hosted on Netlify. Every push to the `main` branch auto-deploys the live site.

## Local preview
Open `index.html` in any browser, or serve it:

    python3 -m http.server 8777 --bind 127.0.0.1 --directory .
