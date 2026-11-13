# Reading Homework Coach — Coaching Basis (Florida / Miami-Dade)

Portable design reference for the Homework Helper app. Reading subject first.
Every coaching tip below is anchored to a cited source so the guidance reinforces
the classroom instead of competing with it.

## Who this is for
- Jian's two boys (approx. grades 1 and 3 — confirm). Miami-Dade County Public Schools (M-DCPS).
- The app reads a photo of a reading assignment and coaches the PARENT on how to help
  (ask, don't tell), showing the work colorfully for the kid.

## The three pillars this rests on (verified)

### 1. Standards — Florida B.E.S.T. ELA (effective 2021–22)
- M-DCPS teaches to Florida's B.E.S.T. Standards (Benchmarks for Excellent Student Thinking).
- Benchmark code format: `ELA.<grade>.<strand>.<standard>.<benchmark>`
  e.g. `ELA.1.F.1.3` = Grade 1, Foundational skills, phonics/decoding.
- Source: Florida DOE — ELA B.E.S.T. Standards
  https://www.fldoe.org/core/fileparse.php/7539/urlt/elabeststandardsfinal.pdf
- Rule 6A-1.09401, F.A.C. (official rule text):
  https://flrules.org/gateway/readRefFile.asp?filename=B.E.S.T.%20ELA%20Standards%202025_Clean%206A-1.09401.pdf&refId=18865

Relevant foundational benchmarks seen on the sample worksheets:
- Phonological awareness (blend/segment sounds): `ELA.K.F.1.2`, continues in grade 1.
- Phonics & word analysis — decode words, short vowels: `ELA.1.F.1.3` / grade-2 equivalent.
- High-frequency / sight words: foundational-skills strand (decode + recognize irregular words).
- Comprehension — sequence of events / text evidence: Reading strand (R.2 / R.3).

### 2. Program — HMH Into Reading Florida (strong match, ~85% confident)
- FLDOE-approved K-5 ELA programs: HMH Into Reading, McGraw-Hill Wonders, Benchmark Advance.
- Sample worksheet signatures matching HMH Into Reading Florida:
  "Words to Know", Essential Question, Genre, Reading Skill, "Leader of the Week",
  unit/week codes (U2W2), Week/Day tags.
- Source: HMH Into Reading Florida — https://www.hmhco.com/states/hmh-into-reading-florida
- TO CONFIRM: a sheet with the publisher footer/logo. If it's actually Wonders or
  Benchmark Advance, the METHOD is the same (all Science of Reading); only branded
  vocabulary shifts.

### 3. Method — Science of Reading
- Both B.E.S.T. and Into Reading are built on the Science of Reading: explicit,
  systematic phonics + the five pillars (phonemic awareness, phonics, fluency,
  vocabulary, comprehension). National Reading Panel (2000).
- Assessment that matters later: grades 3–10 take Florida's FAST reading test.

## Coaching routines (vetted, reusable)
Each maps to a standard so it's defensible:
- BLENDING — "stretch it slow, then say it fast" → decoding (`ELA.1.F.1.3`).
- SIGHT-WORD FLASH — recognize irregular high-frequency words by sight, not sound.
- TEXT EVIDENCE — "find the clue word in the story" → comprehension (answer from text).
- SEQUENCING — order words First/Next/Then/Finally; act it out (multisensory).
- VOCABULARY IN CONTEXT — ask for the word from its meaning; tie to the theme.

## Design rules learned from the two sample sheets
- Coaching must change shape by worksheet TYPE: word-list → phonics coloring;
  story+questions → text-evidence "clue hunt". The engine must classify the task first.
- Each photo is its OWN assignment; do not carry a theme (e.g. "What buildings do you
  know?") from one sheet onto an unrelated one.
- Show a CONFIDENCE signal: high (text says it) vs. inferred (looks like short-u).
- Hide direct answers behind a parent-only reveal so the kid does the thinking.
- Mascot "Captain Clue" speaks to the kid to make it a game, not a drill.

## Parent-facing display rules (what the kid/parent actually sees)
Keep the page CLEAN and unambiguous. Parent-friendly beats complete.
1. NO standard codes (ELA.1.F.1.3) on the card — sourcing lives in this file, not on screen.
2. NO hedging labels ("inferred", "verify against teacher's list"). If not confident,
   leave the item OUT rather than show a guess or a warning.
3. Show the LETTER, demonstrate the SOUND with bolded examples. NEVER write a sound as
   its own word that could be mistaken for a misspelling.
   - Wrong: find 5 "uh" things        (parent reads "uh" as a typo for U)
   - Right: find 5 things with the short-**u** sound (c**u**p, r**u**g, m**u**g)
   - Vowel sound traps: short a="ah", short e="eh", short i="ih", short o="oh", short u="uh".
4. Only show confident, usable guidance. Uncertainty stays behind the scenes.

## Pre-send accuracy review (run on EVERY generated card before showing it)
This is a QA gate. A card does not display until it passes. First-grade especially.
- [ ] PHONICS CHECK: every word placed in a "sound-it-out" group genuinely has that
      target sound. Drop (don't mislabel) any word that doesn't — e.g. "men" is short-e,
      not short-u, so it is NOT shown in a short-u group.
- [ ] SIGHT-WORD CHECK: irregular/high-frequency words are in "just know it", not sound-out.
- [ ] SOUND-SPELLING CHECK: no bare phonetic spelling that looks like a misspelled letter
      (rule 3 above). Letter shown, sound demonstrated by bolded examples.
- [ ] ANSWER CHECK: every revealed answer matches the text/evidence on the sheet.
- [ ] GRADE CHECK: vocabulary and routine match the child's grade (1 vs 3 differ a lot).
- [ ] SCOPE CHECK: no theme/skill carried over from a different worksheet.
- [ ] CLUTTER CHECK: no codes, no hedges, nothing a parent must decode (rules 1–2).
- [ ] CONFIDENCE CHECK: anything uncertain is omitted, not hedged on-page.
Implementation note: in the built app, this gate should be an automated self-review
pass (model re-checks its own card against this list) PLUS a one-time human/teacher
sign-off on the reusable coaching routines.

## Open items
- Confirm boys' grades (tag benchmarks precisely).
- Confirm exact program with a logo'd sheet.
- Platform decision: mobile-friendly web app first (camera upload + colorful coach),
  native app later if it earns it.
