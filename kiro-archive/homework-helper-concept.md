# Homework Helper — Concept & Share Doc

*A phone app that reads a photo of a kid's homework and coaches the PARENT on
how to help — making homework time fun, not a fight. Reading first, then all
subjects and grades.*

Last updated: 2026-10-21 · Companion file: `reading-coach-basis.md` (the sourced pedagogy + accuracy rules)

---

## 1. The idea in one line
A parent snaps a photo of tonight's homework. The app reads it and shows a short,
warm, colorful card that tells the parent **exactly what to say and do** to help
their child — ask, don't tell — so homework feels like a game, not a drill.

## 2. Who it's for
- **The parent**, not the teacher and not the kid directly. Parents aren't trained
  teachers; the app gives them the words and the steps so they feel confident.
- First build: Jian's two boys (approx. grades 1 and 3), Miami-Dade County Public
  Schools. Grounded in the real Florida curriculum so home help reinforces class.

## 3. The core principle — coach the parent
The card talks to the parent in plain language and keeps homework time positive:
- **Speak to the parent, plainly** — "Say this," "Ask this." No teacher jargon, no codes.
- **Give exact words to say** — parents freeze when they don't know how to phrase it;
  scripts fix that.
- **Help, don't tell** — answers stay hidden behind a tap-to-reveal, so the kid does
  the thinking and the parent isn't tempted to hand over the answer.
- **Keep it short and timed** — 5–10 minutes, a few clear steps, doable after a long day.
- **End on fun + a finish line** — the parent knows when to stop, and it ends on a win.

### The parent-coach card shape (every card follows this)
1. **Warm up** (1 min) — a playful hook to get the kid interested.
2. **Read / look together** (2 min) — the full content on screen, colorfully.
3. **Help, don't tell** (3 min) — "If they're stuck, say THIS" prompts; answers are a peek.
4. **Make it fun** — one quick game/activity that reinforces the exact skill.
5. **You're done when…** — a clear finish line so the parent stops on a high note.

### Fun elements that work
- **Captain Clue 🕵️** — a detective mascot that turns comprehension into a "find the
  secret clue words" hunt.
- **Color-coded phonics** — each sound in a word gets its own color (r·u·n) so the
  parent can point as the child sounds it out.
- **Order ladder** — sequencing words (First/Next/Then/Finally) shown as colored steps.
- **Act it out** — multisensory suggestions (unwrap a real box, make a sandwich in order).

## 4. Reading-first, built to scale
Start with reading, get it great, then add math, then all subjects and grades.
The same engine scales: **read the page → sort it into sections → coach each part.**
Worksheets are often mixed-subject, so the engine finds the reading parts and ignores
the rest — which is exactly how it grows to every subject later.

Coaching changes shape by **worksheet type**:
- Word list → phonics coloring + blending.
- Story + questions → text-evidence "clue hunt."
- (Later) math problem → worked-example coaching, etc.

## 5. Is the guidance trustworthy? (yes — it's sourced)
Everything is anchored to the real Florida curriculum, not improvised. Full detail
with source links lives in `reading-coach-basis.md`. In short:
- **Standards:** Florida B.E.S.T. ELA (what every kid must learn).
- **Program:** HMH Into Reading Florida (~85% match to the sample worksheets — the
  textbook/worksheets the school uses).
- **Method:** Science of Reading (explicit phonics + the five reading pillars).

An **8-point accuracy review** runs on every card before it shows — right sounds,
correct sorting, no confusing sound-spelling, correct answers, right grade, one
worksheet at a time, no clutter, and "if unsure, leave it out." (Full checklist in
the basis file.)

## 6. Can it be automated? (yes)
The parent only does step 1. Everything else is automatic:

| Step | What happens | Automatic? | Notes |
|------|--------------|-----------|-------|
| 1. Snap photo | Parent photographs the homework | Parent action | Printed pages read cleanly; kids' handwriting is the weak spot |
| 2. Read the photo | A vision AI model extracts the words/story/questions | ✅ | **The one real cost** — a few cents per photo |
| 3. Classify the task | Word list? Story + questions? | ✅ | Picks the right coaching style |
| 4. Build the parent-coach card | Fill the fixed card template from the photo | ✅ | Warm-up → read → help → fun → finish |
| 5. Self-check | Re-read the card against the 8 accuracy checks | ✅ | Catches slips without a human in the loop |
| 6. Show the parent | Clean card on the phone | ✅ | No chat, no setup |

**The honest tradeoff:** everything except reading the photo (step 2) is basically
free and reliable — just logic and templates. Step 2 needs a vision-capable AI model,
which costs a small amount per photo (roughly a few cents) and can misread messy
handwriting. That's the real engineering decision, not the coaching.

## 7. How to build it
- **Prototype (fastest, works now):** a mobile-friendly **web app** — open a link on
  the phone, tap "add photo," use the camera, get the coach card back. No app store,
  no accounts. Recommended starting point.
- **Polished app later:** installable on the home screen, saved history per kid,
  maybe offline for simple parts. Earns its way in once the prototype proves the
  coaching is good.

## 8. Open decisions
- Confirm the boys' grades (to tag the right skill level).
- Confirm the exact program with a sheet that shows the publisher logo (method is the
  same across the three Florida programs regardless).
- Accept the small per-photo vision cost (pennies/week for two kids; adds up for a
  public app).
- Green-light building the prototype web app.

---

*Two sample worksheets drove this design: a short-**u** "Words to Know" word-list page
and an "Opening a Gift" sequencing story. Both were rebuilt as clean parent-coach
cards passing all 8 accuracy checks.*
