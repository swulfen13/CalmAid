# CalmAid: Devpost submission draft

> Copy the sections below into Devpost. Replace the links marked TODO.

**Tagline:** Calm, one-step-at-a-time first aid for anyone, powered by AI and safe even when the AI isn't.

**Links**
- Live demo: https://calmaid-omega.vercel.app
- GitHub: https://github.com/swulfen13/CalmAid
- Video: TODO (YouTube / Vimeo / Loom, public)
- Mobile (Expo Go): TODO (eas update link / QR)

---

## Inspiration
In an emergency, the people closest are almost never trained. They panic, search the web and scroll through long guides while minutes pass. In cardiac arrest, every minute without CPR costs roughly 7–10 % chance of survival. We wanted the opposite of a web page: one calm instruction at a time.

## What it does
- **Help now:** tap what is happening (or speak, type, take a photo). CalmAid asks at most two yes/no questions, then gives one plain-language action per screen, read aloud, with drawings, timers and a CPR coach (110 / min beat + vibration).
- **Always safe:** the local emergency number and "Not breathing? Start CPR" are on every screen; a GPS card helps you tell the dispatcher where you are.
- **Handover:** CalmAid writes a timestamped report for the paramedics (observations, actions, CPR time, photo, location) and shows it as a QR code.
- **Learn:** a Duolingo-style path (21 steps, XP, streaks, badges) with lessons, put-in-order, myth-or-fact, tap-the-spot, branching scenarios and a CPR rhythm challenge that measures your tapping speed live, plus a 19-chapter searchable handbook, so people are ready *before* an emergency.
- **Web + mobile:** runs in any browser (installable PWA) and as an Expo app with native haptics on iPhone and Android; the screen stays on during an emergency.
- Adult / child / baby modes, 12 languages, hands-free voice commands, dark mode, installable offline PWA. No login, no database.

## How we built it
React 19 + TypeScript + Vite, PWA (Workbox); Expo (SDK 58) shell with expo-haptics, expo-keep-awake and expo-speech sharing the same web codebase. Web Speech API (voice in/out), Web Audio API (CPR metronome), Vibration & Geolocation APIs. Gemini 3.5 Flash-Lite via a Vercel serverless proxy (`api/guide.ts`), so the key never reaches the browser. A deterministic offline engine with reviewed decision trees is the safety baseline.

## AI usage

### A1: AI tools used to build it
CalmAid was built with **Claude (Anthropic)** as coding assistant (architecture, code, protocol drafts, tests, docs).
**How we checked it:** protocol content against ERC 2021 / AHA / Red Cross lay guidance; an automated suite (`npm run check`, also in GitHub Actions) for every protocol path (adult/child/baby), the classifier, voice commands, the safety guard and the jury scenarios; end-to-end browser tests incl. a mocked AI server.
**What we corrected:** the tests caught a baby-choking screen that still mentioned belly thrusts (fixed); a too-broad "breathing" rule that would have started CPR on the choking question (narrowed); temperature lowered to 0 + seed for repeatability; the first live run passed only via the offline fallback (retired model, HTTP 404), so we made the live test require real AI answers and switched models based on a latency benchmark.

### A2: AI value in the product
Gemini turns messy free text and speech, in 12 languages, into the right protocol, **reads photos** ("AI sees: palm-sized burn with blisters"), chooses the follow-up questions and writes handover notes. Hybrid: quick buttons start the reviewed protocol instantly (0 s, no quota); the AI handles what rules can't (free text, speech, photos, languages). Without a key, CalmAid still works with keyword matching and reviewed offline protocols.

### A3: Model choice
Gemini 3.5 Flash-Lite with `thinkingLevel: minimal`, chosen by measurement: 2.5 Flash is retired for new users (404), 3.5 Flash took 162 s under load, 3.6/3.8 Flash timed out (> 30 s), Flash-Lite answered correctly in ≈ 6.5 s. Also: low latency for stressed users, native JSON-schema output (every reply has the exact UI shape), multimodal + multilingual in one model, deterministic decoding (temperature 0, topK 1, seed).

### A4/A5: Limits & protection against misinformation
1. Life-critical decisions are rule-based: "not breathing" → CPR, never left to the model.
2. Strict prompt + JSON schema (one action, ≤ 15 words, no diagnosis, no doses).
3. Validation (malformed replies, 3rd question refused).
4. **Safety guard** scans every AI step for 10 known harmful myths (vomiting, butter on burns, objects in the mouth, doses, belly thrusts on babies …), negation-aware.
5. 12 s timeout / any error / blocked step → reviewed offline protocol, and the user is told.
6. Emergency number + CPR button always visible.
Limits: photo or text can be misread (hence no diagnosis), AI needs internet, offline protocols are English, content not yet reviewed by a certified trainer.

## Test cases (R2)
All cases run live in the app (Settings → Test Lab) and in CI.

| Type | Input | Expected | Result |
|---|---|---|---|
| Standard 1 | "My friend cut his hand with a kitchen knife and it is bleeding a lot" | Call advised, firm direct pressure, safe end screen | ✅ 5/5 checks |
| Standard 2 | "I spilled boiling water on my arm" | Cool running water 20 min (timer), no myths | ✅ 4/4 checks |
| Repeat | Standard 2, run 5× | Identical guidance every run | ✅ 5/5 identical |
| Edge case | "There's blood everywhere and she's not breathing" | CPR first, no questions, rule-based | ✅ 4/4 checks |

Plus 7 automated edge cases (unclear input, baby choking, hybrid quick button, harmful AI advice blocked, AI outage, "not breathing" override in AI flow, 3rd AI question refused): **11/11 pass**, offline in CI and live against Gemini.

### Live AI run (real Gemini, 26 Nov 2026)
`npm run test:ai` with `gemini-3.5-flash-lite` (thinking: minimal), 36 API calls per run. In live mode a case only passes if **the model itself** answered (no offline fallback).

| Type | Input | Result |
|---|---|---|
| Standard 1 | "My friend cut his hand with a kitchen knife and it is bleeding a lot" | ✅ 6/6 · AI: "Press hard on the cut with a clean cloth right now." → "Call 112 now for help while keeping the pressure on the wound." → "Keep pressing on the cut and stay calm until help arrives." |
| Standard 2 | "I spilled boiling water on my arm" | ✅ 5/5 · AI: cool under running water (20-min timer) → remove rings → cover loosely → stay with them |
| Repeat | Standard 2, 5 runs | ✅ 5/5 identical decisions |
| Edge case | "There's blood everywhere and she's not breathing" | ✅ CPR immediately (rule-based, before any model call) |
| Extra | "asdf help ???" · "My baby is choking" | ✅ asks awake/breathing then advises calling · forearm back blows, no belly thrusts |
| Extra (hybrid) | Quick button "Heavy bleeding" | ✅ reviewed protocol starts instantly, no AI call |
| Extra (simulated AI) | harmful myth · outage · "not breathing" override · 3rd question | ✅ 4/4 |

**11/11 passed with real AI** (latest run, incl. the hybrid case; full table in `test-results-live.md`). Also verified end-to-end in the app: German free text *"Mein Opa ist umgekippt und redet ganz komisch, eine Gesichtshälfte hängt runter"* → AI: *"Call 112 now and tell them the face is drooping."*

**What the live runs taught us (and what we fixed):** retired model (404) → benchmark & switch; Google overload (503) and free-tier rate limit (429) → automatic retries + seamless offline continuation; AI skipped the 20-min cooling timer and the call advice for unclear input → two new prompt rules; country detection from browser language showed China's 120 on a Berlin PC → time zone first.

## Challenges
Making an AI product that is *safe when the AI is wrong or absent*: we designed the offline protocols first, then added AI on top with a guard and rule-based overrides.

## Accomplishments
A complete flow from panic to paramedic handover that works offline, in a browser, in seconds, plus a learning mode that turns the app into preparation.

## What's next
Review by certified first-aid trainers, translated offline protocols, nearby-AED map, address lookup for the location card.

## Built with
react · typescript · vite · pwa · expo · react-native · gemini-api · vercel · web-speech-api · web-audio-api
