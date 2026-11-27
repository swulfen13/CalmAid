# CalmAid: Devpost submission (copy field by field)

---

## Project name

CalmAid

## Elevator pitch (max 200 characters)

Panic-proof first aid: tap, speak or type what's happening and CalmAid gives one calm step at a time, a CPR coach and a paramedic report. Safe even when the AI is offline.

---

## About the project (Project Description: the five questions)

> Paste everything from here down to "Built with" into **About the project**. The three separate form fields below reuse the matching answers.

## 1. Who is CalmAid for, and why would they use it?

**Users:** lay people with a smartphone and no medical training: parents, colleagues, passers-by.
**Situation:** a colleague collapses in the office, a child chokes at dinner, someone cuts their hand badly in the kitchen. The person next to them panics, searches the web and scrolls through long guides while minutes pass.

**Why it matters:** the American Heart Association states that [every minute CPR is delayed, the chance of survival drops by about 10 %](https://international.heart.org/resuscitation/hands-only-cpr), and AHA research found that [CPR within two minutes gave 81 % higher odds of survival](https://newsroom.heart.org/news/bystander-cpr-up-to-10-minutes-after-cardiac-arrest-may-protect-brain-function). The bottleneck is not knowledge on the internet, it is a frightened person finding the right action fast.

| Web search / long guides | CalmAid |
|---|---|
| Scroll, read, interpret, often in jargon | One short action per screen, read aloud |
| Same text for everyone | Max. 2 yes/no questions → the right path (adult / child / baby) |
| Hands busy, phone in the way | Voice commands, CPR beat with vibration, screen stays on |
| Nothing for the paramedics | Timestamped handover report + QR code |
| Needs signal | Installable PWA with full offline protocols |

On calm days, a short **Learn** path (lessons, myth-or-fact, put-in-order, tap-the-spot, a live CPR rhythm challenge) and a 19-chapter handbook help people prepare *before* an emergency.

## 2. What did we build during the hackathon?

CalmAid is a **new project, built from scratch during the event** by a solo developer. Everything in the repo was created during the hackathon:
- the guide engine with reviewed decision trees for adult, child and baby (9 emergencies);
- the Gemini integration behind a server-side proxy, with safety guard, rule-based overrides, offline fallback and support for several API keys;
- CPR coach (110/min beat + vibration), timers, voice in/out, photo input, GPS card for the dispatcher, paramedic handover report with QR code;
- the Learn path and handbook;
- the in-app **Reliability Test Lab**, the automated test suite and GitHub Actions CI;
- the 2:30 demo video (recorded automatically from the real app; voice-over recorded by us).

**Shown in the demo:** AI flow 0:15–0:48, quick-button protocol 0:48–0:59, hard edge case 0:59–1:20, Test Lab 1:20–1:32, AI transparency 1:32–1:43, Learn path 1:43–2:23.

**Third-party parts (not our work):** Google Gemini API, Vercel hosting, React / Vite / vite-plugin-pwa (Workbox), the `qrcode` package and browser APIs (Web Speech, Web Audio, Vibration, Geolocation, Wake Lock). The protocol content follows public lay guidance from ERC 2021, AHA and Red Cross. Full list in the [README](https://github.com/swulfen13/CalmAid#third-party-services--dependencies).

## 3. How did we use AI?

### AI in the finished project
- **Model and job:** Google **Gemini 3.5 Flash-Lite** via a Vercel serverless proxy (`api/guide.ts`, key never in the browser). It turns messy free text, speech and photos in 12 languages into the right protocol, picks at most two follow-up questions, writes one short action per screen and adds notes to the handover report.
- **Why this model (A3), measured, not guessed:** in our benchmark, 2.5 Flash returned HTTP 404 (retired for new users), 3.5 Flash took 162 s under load, 3.6/3.8 Flash timed out (> 30 s), while **3.5 Flash-Lite answered correctly in about 6.5 s**. Stressed users need speed; it also supports JSON-schema output, images and many languages in one model.
- **Project-specific AI decision (A2): hybrid design.** Quick buttons start the reviewed protocol instantly (0 s, no AI call, works offline); the AI is only used where rules fail: free text, speech, photos, other languages. Evidence: the Test Lab case "Quick button Heavy bleeding" passes with no AI call, and the German free-text case below is understood by the AI.
- **Repeatability:** temperature 0, topK 1, fixed seed and a strict JSON schema, so the same input gives the same guidance (5/5 identical runs).
- **Quality assessment (R2 + limits):** 11 scenarios run offline in CI and **live against real Gemini** (`npm run test:ai`, 36 API calls per run); in live mode a case only passes if the model itself answered, not the offline fallback. **11/11 passed.** Also verified in the app: German free text *"Mein Opa ist umgekippt und redet ganz komisch, eine Gesichtshälfte hängt runter"* → AI: *"Call 112 now and tell them the face is drooping."* What this shows: the AI handles everyday and multilingual input reliably; what it does not show: that every possible photo or phrasing is understood, which is why life-critical decisions are never left to the model (see question 5).

### AI during development
- **Tool:** **Claude (Anthropic)** as coding assistant for architecture, React/TypeScript code, first drafts of the protocols, tests and documentation.
- **How we checked it:** protocol content against ERC 2021 / AHA / Red Cross lay guidance; an automated suite (`npm run check`, also in GitHub Actions) that walks every protocol path for all age groups plus classifier, voice commands, safety guard and the jury scenarios; end-to-end browser tests; live runs against Gemini.
- **What the checks found and what happened to the AI-written work:**
  - A baby-choking end screen still mentioned *belly thrusts* (adult technique) → **changed** to a baby-specific screen.
  - A "breathing" override would have started CPR on the choking question "Can they cough, speak or breathe?" → **changed** to real breathing checks only.
  - The first live run "passed" 10/10 only because every AI call failed (404) and the offline fallback took over → the test was **rejected** and rewritten to require real AI answers; model switched after benchmarking.
  - The banner showed a fixed "112 / 911" → **changed** to the local number per country.
  - The rest of the generated code was **kept** after passing the checks.

## 4. How can people access and use it, and what results does it achieve?

**Access:** open **https://calmaid-omega.vercel.app** in any modern browser (phone or laptop). No account, no install, no cost. Optional permissions: location (GPS card), microphone (voice), camera (photo), all asked only when used. AI needs internet; the reviewed protocols also work offline (installable PWA). Code: https://github.com/swulfen13/CalmAid (`npm ci && npm run dev`; AI optional with a Gemini key in `.env.local`).

**Main task:** a panicking bystander gets from "something is wrong" to the right first action in seconds. **A successful result:** the right protocol for the situation and age group, the call advice at the right moment, one clear action per screen, no harmful advice, and a report for the paramedics.

**Results (R2)**, run live in the app (Settings → Test Lab, see screenshot `07-testlab`) and in CI:

| Case | Input | Should happen | What happened |
|---|---|---|---|
| Ordinary 1 | "My friend cut his hand with a kitchen knife and it is bleeding a lot" | Firm direct pressure, call advised, safe end screen | ✅ AI: "Press hard on the cut with a clean cloth right now." → "Call 112 now…" (video 0:15–0:48) |
| Ordinary 2 | "I spilled boiling water on my arm" | Cool under running water 20 min (timer), no myths | ✅ cooling + 20-min timer → remove rings → cover loosely |
| Repeat check | Ordinary 2, 5 runs | Identical guidance | ✅ 5/5 identical |
| Demanding | "There's blood everywhere and she's not breathing" | CPR first, no questions | ✅ CPR starts immediately, rule-based, before any AI call (video 0:59–1:20) |

Plus 7 extra cases (unclear input, baby choking, hybrid quick button, harmful AI advice blocked, AI outage, "not breathing" override, 3rd question refused): **11/11 pass**. In our own browser test we also clicked through all 9 emergencies × adult/child/baby (27 flows) with no errors.

**Design choices that reduce effort:**
- Opens straight on "What is happening?" with 9 big buttons, no login or onboarding.
- At most 2 yes/no questions, then one action per screen, read aloud, tap targets ≥ 56 px.
- Emergency number and "Not breathing? Start CPR" on every screen; the tab bar hides during an emergency so nothing is tapped by accident.
- Speak, type or photo instead of choosing from menus; CPR beat with vibration and screen kept on.
- The handover report is written automatically, so the helper never has to remember times.

## 5. Limitations, and what happens when something goes wrong

**Limitations**
- General lay first aid only: no diagnosis, no medication doses, not a replacement for emergency services. Content follows ERC/AHA/Red Cross guidance but is **not yet reviewed by a certified trainer**.
- AI needs internet and a server-side key; offline protocols are English only.
- Photos or text can be misread.
- Hands-free voice answers depend on the browser's speech recognition (best in Chrome); iOS is silent with the mute switch on.
- The native mobile shell in `mobile/` (Expo) is **experimental and not part of this submission**; the video's end card mentions it, but judges should use the web app.
- **Planned:** trainer review, translated offline protocols, nearby-AED map, address lookup.

**Failure handling (evidence: Test Lab cases, all passing)**

| Problem | How CalmAid detects it | What the user gets |
|---|---|---|
| AI gives harmful advice (e.g. "make him vomit", butter on a burn, belly thrusts on a baby) | Safety guard scans every AI step for 10 known myths, negation-aware | Step blocked, reviewed protocol continues ("harmful AI advice blocked" case) |
| AI misses a life-threatening sign | "Not breathing" is checked by code before and during the AI flow | CPR starts immediately ("not breathing override" case) |
| AI asks too much | Validation refuses a 3rd question | Jumps to action ("3rd question refused" case) |
| AI down, timeout (12 s), quota (429), overload (503), malformed reply | Error / timeout / schema validation | Quick retries, switch to the next API key, then the reviewed offline protocol, with a notice ("AI outage" case) |
| Unclear input ("asdf help ???") | Low-confidence classification | Asks if the person is awake and breathing, advises calling ("unclear input" case) |
| App crash | Error boundary | Still shows the emergency number and CPR / bleeding basics |
| Wrong country number | Country from time zone first, then language | Local number; changeable in Settings |

---

## Built with (tags)

react, typescript, vite, pwa, workbox, gemini-api, google-ai-studio, vercel, serverless, web-speech-api, web-audio-api, geolocation-api, vibration-api, github-actions, claude

---

## "Try it out" links

- https://calmaid-omega.vercel.app
- https://github.com/swulfen13/CalmAid

## Video demo link

TODO: public YouTube / Vimeo link to `calmaid-demo-mit-ton.mp4`

## Image gallery

Upload the 10 screenshots from the `screenshots` folder (JPG, max 5 MB each).

---

## The three extra form fields

- **What did your team build or improve during this hackathon?** → paste answer **2** from above.
- **How did your team use AI?** → paste answer **3** from above.
- **How can judges run or evaluate your project?** → paste answer **4** from above (plus answer 5 if there is room).
