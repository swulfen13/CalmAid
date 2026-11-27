# CalmAid: calm first aid for everyone

**An AI first-aid guide for lay people in the worst five minutes of their day, and a pocket course for the calm days before.**
One instruction per screen, read aloud, with a CPR coach and an automatic report for the paramedics.
No login, no install, works offline.

> CalmAid gives general first-aid guidance. It does **not** replace emergency services or a doctor.
> In a life-threatening situation, always call your local emergency number (112 / 911 / 999 …) first.

**Jury quick links:** [Problem](#1-problem--who-its-for) · [AI in the product (A2–A5)](#3-ai-in-the-product-a2a5) · [Test cases (R2)](#4-reliability--test-cases-r2) · [AI disclosure (A1)](#6-ai-disclosure-a1-built-with-ai) · [Setup](#7-setup)

---

## 1. Problem & who it's for

When someone collapses, bleeds heavily or chokes, bystanders panic. Long first-aid pages, search results and medical jargon are useless with shaking hands.
Every minute without CPR in cardiac arrest lowers the chance of survival by roughly 7–10 %, and most bystanders don't start because they're unsure what to do.

**Target group:** lay people (parents, colleagues, passers-by) with a smartphone and no medical training.

**Why CalmAid is better than a web search:**

| Web search / long guides | CalmAid |
|---|---|
| Scroll, read, interpret, often in jargon | One short action per screen, read aloud |
| Same text for everyone | Max. 2 yes/no questions → the right path (adult / child / baby) |
| Hands busy, phone in the way | Hands-free voice commands, CPR beat with vibration |
| Nothing for the paramedics | Timestamped handover report + QR code |
| Needs signal | Installable PWA, full offline protocols |

---

## 2. What it does

**Help now** (emergency)
- 9 big quick buttons, or describe it: **speak, type or take a photo**. Adult / child / baby switch.
- **Step-by-step guide:** max. 2 yes/no questions, then one plain-language action per screen, with simple drawings.
- **CPR coach:** Web Audio metronome at 110 / min, pulse animation, vibration, compression counter.
- **Always visible:** emergency banner with tap-to-call and **"Not breathing? Start CPR"**.
- **Location card** (GPS, offline) to read to the dispatcher. Timers where time matters (20 min cooling, 10 min pressure).
- **Handover report:** timeline, observations, actions, CPR time, photo, location, optional medical ID, plus a **QR code**.

**Learn** (calm moments): a Duolingo-style **learning path**
- **4 units, 21 steps**, unlocked one after another, with **XP, day streak and 7 badges**.
- **Exercise types built for first aid:** 8 micro-lessons with quiz · **put the steps in order** · **myth or fact** · **tap the right spot** (hand position for CPR, baby CPR, where to press) · **branching scenarios** (bus stop, kitchen, office) · **CPR rhythm challenge**.
- **Daily 2-minute refresher** (5 questions) keeps the streak and the knowledge alive.
- **CPR rhythm trainer:** tap along (e.g. while pushing a pillow); live rate gauge and a 30-second score.
- **Handbook:** 19 searchable chapters for reading at your own pace (recognise · help · never · children · when to call, plus myths, first-aid kit, "Am I allowed to help?"). Linked from every finished emergency guide.
- **15 quick guides** for everyday situations. Sources listed in the app.

**Mobile app (Expo)**: same app on iOS and Android via Expo Go, adding **native haptics** (iPhone browsers can't vibrate), **keep-awake** and native speech, plus a native offline emergency screen. See [`mobile/README.md`](mobile/README.md).

**Settings**: local emergency number by country, 12 guidance languages, hands-free mode, vibration, dark mode, medical ID, install as app.
**Transparency**: **For judges** page (3-minute tour + QR codes for phone and app), "How CalmAid uses AI" page and a **Test Lab** that runs the jury test cases live.
**Screen stays on** during the whole emergency (Wake Lock API / expo-keep-awake), so the phone never goes dark mid-CPR.

---

## 3. AI in the product (A2–A5)

### A2: Real value through AI
| Without AI | With AI (Gemini) |
|---|---|
| Keyword matching on the description | Understands messy free text and speech ("my grandpa fell and talks weird" → stroke) in **12 languages** |
| Photo is only attached to the report | **Photo understanding:** "AI sees: palm-sized burn with blisters on the forearm", which shapes the steps and the report |
| Fixed decision trees | Follow-up questions chosen for *this* situation, then actions in the user's language |
| Generic report lines | Short factual handover notes per step |

**Hybrid by design:** a tapped quick button needs no interpretation, so it starts the reviewed protocol **instantly** (0 s, no API quota, works offline). The AI is used where rules fall short: messy free text, speech, photos and other languages. The offline protocols are the reviewed safety baseline; the AI makes CalmAid understand people better and never removes a safety net.

### A3: Why Gemini 3.5 Flash-Lite (measured, not guessed)
We benchmarked the available Flash models with CalmAid's real request (JSON schema, temperature 0) on 26 Nov 2026:

| Model | Result |
|---|---|
| gemini-2.5-flash | ❌ "no longer available to new users" (HTTP 404) |
| gemini-3.5-flash (default thinking) | ✅ correct, but **162 s** under load |
| gemini-3.6-flash / 3.8-flash / 3-flash-preview (reduced thinking) | ❌ timeout > 30 s (high demand) |
| **gemini-3.5-flash-lite, `thinkingLevel: minimal`** | ✅ correct JSON in **≈ 6.5 s** |

- **Latency:** in an emergency, a fast answer beats a beautiful one. Thinking is set to `minimal`.
- **Native JSON schema output:** every reply has exactly the shape the UI renders (`type`, `text`, `detail`, `call_emergency`, `timer_seconds`, `illustration`, `photo_note`, `log`).
- **Multimodal + multilingual** in one model (text, photos, 12 languages).
- **Deterministic decoding:** `temperature 0`, `topK 1`, fixed `seed` for repeatable decisions.
- Configurable via `GEMINI_MODEL` (and `thinkingLevel` in `aiShared.ts`) when a faster model becomes available.

### A4/A5: Limits, reliability & protection against misinformation
Six layers, in order:

1. **Life-critical rules first.** "Not breathing" in the description, or a **no** to any breathing question, starts CPR, decided by code, never by the model (`src/engine/safetyGuard.ts`).
2. **Strict system prompt + JSON schema:** one action per reply, ≤ 15 words, no diagnosis, no doses, local emergency number.
3. **Validation:** malformed / overlong replies are rejected; a 3rd question is refused.
4. **Safety guard:** every AI step is scanned for 10 known harmful myths (induce vomiting, butter/ice on burns, objects in a seizing person's mouth, pulling out embedded objects, medication doses, belly thrusts on babies, delaying the call …). Negation-aware: "Do **not** use butter" passes, "Put butter on it" is blocked.
5. **Timeout & fallback:** no reply in 12 s, any error, or a blocked step → the reviewed offline protocol takes over instantly, and the user is told. If questions were already answered, it continues with the first safe action instead of asking again.
6. **Always-visible escape:** emergency number + "Not breathing? Start CPR" on every guide screen.

**Known limits:** the AI can misread a photo or a vague description, so it never diagnoses and life-critical paths are rule-based. AI needs internet; offline protocols are English. The guard catches known myths, not every possible error. Content follows ERC 2021 / AHA / Red Cross lay guidance but has not yet been reviewed by a certified trainer.

**Privacy:** no account, no database. The session log stays in `localStorage`; photos stay in memory and are only sent to the model when AI is on. The API key stays on the server (`api/guide.ts`).

---

## 4. Reliability & test cases (R2)

The same test code runs **in the app** (Settings → Test Lab, offline or against the live AI) and **in CI** (`npm run check`, GitHub Actions).

| Type | Test | Input | Expected | Result |
|---|---|---|---|---|
| Standard | Deep cut with heavy bleeding | "My friend cut his hand with a kitchen knife and it is bleeding a lot" | Call advised, firm direct pressure, no jargon, ends with "stay with them" | ✅ Pass (5/5 checks) |
| Standard | Small scald from boiling water | "I spilled boiling water on my arm" | Cool with running water for 20 min (timer), cover, no myths | ✅ Pass (4/4 checks) |
| Repeat | Same input 5× → same guidance | "I spilled boiling water on my arm" | All 5 runs give identical steps (offline) / identical decisions (AI, temperature 0) | ✅ Pass (5/5 identical) |
| Edge case | Two emergencies at once | "There's blood everywhere and she's not breathing" | Life threat first: CPR path immediately, no questions, no waiting for the AI | ✅ Pass (4/4 checks) |

**Extra edge cases (also automated):** quick button starts the reviewed protocol instantly (hybrid) · unclear input ("asdf help ???") → safe default · baby choking → forearm back blows, never belly thrusts · AI suggests "make him vomit" → blocked by the guard · AI down / timeout → instant offline fallback · AI flow + "not breathing" → rule-based CPR override · AI asks a 3rd question → refused.
**Result: 11 / 11 scenarios pass**, offline in CI **and against the real Gemini API** (`npm run test:ai`, in live mode a pass must come from the model itself; see DEVPOST.md for the live table).

Also checked automatically: every protocol path for adult / child / baby (valid links, ≤ 2 questions, safe end), offline fallback entries, the learning path (lessons, exercises, scenario answers, tap targets), handbook links, the text classifier, voice commands and 10 guard rules.
The tests found real bugs during development (see A1).

---

## 5. Design & UX (D1–D5)

- **Instant start:** opens straight on "What is happening?", with 9 big buttons. No login, no onboarding.
- **One thing per screen:** one question or one action, ≥ 56 px tap targets, calm colours, read aloud.
- **No dead ends:** every screen has a way back; the tab bar disappears during an emergency so nothing is tapped by accident; the report can always return to the guide; reload resumes the session.
- **Inclusive:** dark mode, reduced-motion support, voice input/output, 12 AI languages, local emergency numbers.
- **Crash-safe:** an error boundary still shows the emergency number and CPR / bleeding basics.

---

## 6. AI disclosure (A1: built with AI)

- **Development:** CalmAid was built with **Claude (Anthropic)** as coding assistant: architecture, React/TypeScript code, first-aid protocol drafts, tests and documentation.
- **How results were checked:**
  - Protocol content was checked against public lay guidance (ERC 2021, AHA, Red Cross).
  - Automated checks (`npm run check`): protocol graph for all age groups, classifier, voice commands, safety guard and the 10 jury scenarios.
  - End-to-end browser tests (Playwright) of every screen, including a mocked AI server for photo analysis, guard blocks and fallback.
- **What was corrected or discarded (examples):**
  - The test suite caught a baby-choking end screen that still mentioned *belly thrusts* (adult text) → fixed with a baby-specific screen.
  - The first "breathing question" override would also have triggered CPR on the choking question "Can they cough, speak or breathe?" → narrowed to real breathing checks.
  - AI temperature was lowered from 0.2 to 0 (+ seed) after defining the repeatability test.
  - The first live run "passed" 10/10, but only because every AI call failed (HTTP 404: model retired) and the offline safety net took over. We made the live test stricter (a pass must come from the model itself) and switched to the model that measured fastest.
  - The banner showed a fixed "112 / 911" → replaced by the local number per country.
  - Browser tests found that the handbook search ignored the "children & babies" sections → fixed.
  - `react-native-webview` 14 types resolve to `never` with current TypeScript → typed wrapper instead of ignoring the error.
  - Live testing: Google returned 503 (overload) and 429 (rate limit) → automatic retries; the AI skipped the 20-min cooling timer and the call advice for unclear input → new prompt rules; a Berlin PC with a Chinese-language browser showed China's emergency number → country now from the time zone first.
- **In the product:** Google **Gemini 3.5 Flash-Lite** (optional, via server proxy) for understanding text and photos and generating steps.

---

## 7. Setup

```bash
npm install
npm run dev        # http://localhost:5173  (works fully offline without a key)
npm run check      # protocol + safety + jury test scenarios
npm run build      # type-check + production build + PWA
```

### Turn on AI (key stays on the server)

```bash
cp .env.example .env.local
# GEMINI_API_KEY=your-key
npm run dev
```

`npm run dev` serves `/api/guide` via a Vite middleware; on Vercel the same logic runs in `api/guide.ts`.
The start screen then shows **"AI on · safety-checked · offline backup"**.

### Deploy to Vercel
1. Push to a public GitHub repo → **Import** in Vercel (Vite is auto-detected).
2. Settings → Environment Variables: `GEMINI_API_KEY` (optional `GEMINI_MODEL`).
3. Deploy. Without the variable the app runs in offline mode.

### Live AI test (real Gemini, all jury scenarios)
```bash
npm run test:ai      # reads GEMINI_API_KEY from .env.local, writes test-results-live.md
```

### Mobile app (Expo Go)
```bash
npm run dev:lan                                   # web app reachable on your Wi-Fi
cd mobile && npm install
EXPO_PUBLIC_WEB_URL=http://<your-ip>:5173 npx expo start   # scan with Expo Go
```
For judges after deployment: set `expo.extra.webUrl` to the Vercel URL, publish with `eas update`, put the link in `VITE_EXPO_URL` so the **For judges** page shows its QR code.

### Demo mode
Open `/?demo`: all timers last 10 seconds, ideal for recording the video.

---

## 8. Project structure

```
src/
  engine/
    protocols.ts     # offline decision trees (10 emergencies) + child/baby overrides
    safetyGuard.ts   # harmful-advice guard, critical rules
    aiShared.ts      # prompt, JSON schema, Gemini call (browser, Vite & Vercel)
    geminiEngine.ts  # AI guide with validation, guard, overrides, fallback
    localEngine.ts   # deterministic offline guide
    classify.ts      # free text → category
  testlab/scenarios.ts   # R2 jury scenarios (app + CI)
  learn/lessons.ts       # micro-lessons + quizzes + sources
  learn/path.ts          # learning path: units, exercises, badges
  learn/progress.ts      # XP, streak, badges (localStorage)
  learn/handbook.ts      # 19 handbook chapters
  native.ts              # bridge to the Expo app (haptics, keep-awake, speech)
  guides/library.ts      # quick guides
  components/            # Home, Flow, Cpr, Handover, Learn, CprTrainer, TestLab, AiInfo, Settings …
  hooks/                 # speech, dictation + voice commands, metronome, location, session
api/guide.ts             # Vercel serverless AI proxy
mobile/                  # Expo app (WebView shell + native haptics/keep-awake/speech)
scripts/check-protocols.ts
.github/workflows/ci.yml
```

## License
MIT
