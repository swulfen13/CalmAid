# CalmAid: Devpost submission (copy field by field)

---

## Project name

CalmAid

## Elevator pitch (max 200 characters)

Panic-proof first aid: tap, speak or type what's happening and CalmAid gives one calm step at a time, a CPR coach and a paramedic report. Safe even when the AI is offline.

---

## About the project (Project Story)

## Inspiration
In an emergency, the people closest are almost never trained. They panic, search the web and scroll through long guides while minutes pass. In cardiac arrest, every minute without CPR lowers the chance of survival by roughly 7–10 %. We wanted the opposite of a web page: **one calm instruction at a time**, from the first second until the paramedics arrive.

## What it does
- **Help now:** tap what is happening, or speak, type or take a photo. CalmAid asks at most two yes/no questions, then gives one plain-language action per screen, read aloud, with drawings, timers and a CPR coach (110 beats per minute plus vibration).
- **Always safe:** the local emergency number and "Not breathing? Start CPR" are on every screen. A GPS card helps you tell the dispatcher where you are.
- **Handover:** CalmAid writes a timestamped report for the paramedics (observations, actions, CPR time, photo, location) and shows it as a QR code.
- **Learn:** a Duolingo-style path (21 steps, XP, streaks, badges) with lessons, put-in-order, myth-or-fact, tap-the-spot, branching scenarios and a CPR rhythm challenge that measures your tapping speed live, plus a 19-chapter searchable handbook, so people are ready *before* an emergency.
- Adult / child / baby modes, 12 languages, hands-free voice commands, dark mode, installable offline PWA. No login, no database.

## How we built it
React 19 + TypeScript + Vite as an installable PWA (Workbox). Web Speech API for voice in and out, Web Audio API for the CPR metronome, Vibration and Geolocation APIs. **Gemini 3.5 Flash-Lite** runs behind a Vercel serverless proxy (`api/guide.ts`), so the API key never reaches the browser. A deterministic offline engine with reviewed decision trees is the safety baseline, and the AI sits on top of it.

## Challenges we ran into
- **Safe when the AI is wrong or absent.** We designed the offline protocols first, then added AI on top with a safety guard and rule-based overrides ("not breathing" always means CPR, never a model decision).
- **Real-world API behavior.** The first model we picked was retired for new users (HTTP 404), the larger models took 30 to 160 seconds under load, and the free tier hit rate limits (429) and overloads (503). We benchmarked models, added quick retries, support for several API keys, and a seamless switch to the offline protocol.
- **Small mistakes with big consequences.** Our tests caught a baby-choking screen that still mentioned belly thrusts and a too-broad "breathing" rule that would have started CPR on a choking question. Both were fixed and are now covered by tests.

## What we learned
In a life-critical app, the most important AI feature is a good fallback. Measuring latency beat reading model specs, and an automated test for every protocol path made it safe to change things quickly.

## What's next
Review by certified first-aid trainers, translated offline protocols, a native mobile app, a nearby-AED map and address lookup for the location card.

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

## What did your team build or improve during this hackathon?

CalmAid is an entirely new project, built from scratch during the event. Everything was built during the hackathon: the guide engine with reviewed adult, child and baby protocols; the Gemini integration behind a server-side proxy with a safety guard, rule-based overrides and offline fallback; the CPR coach, timers, voice in/out, photo input, GPS card and paramedic handover report with QR code; the Learn path and handbook; the in-app Reliability Test Lab; the automated test suite and CI; and the demo video.

## How did your team use AI?

**AI in the finished product: Google Gemini 3.5 Flash-Lite** (via Google AI Studio, server-side proxy on Vercel).
- Turns messy free text and speech in 12 languages into the right protocol, reads photos ("AI sees: palm-sized burn with blisters"), chooses the follow-up questions and writes handover notes.
- Hybrid design: quick buttons start the reviewed protocol instantly with no AI call. The AI handles what rules can't: free text, speech, photos and other languages.
- Chosen by measurement: 3.5 Flash-Lite answered correctly in about 6.5 s, while larger models timed out under load. Settings: `thinkingLevel: minimal`, temperature 0, topK 1, fixed seed and a JSON schema, so replies are repeatable and always have the exact UI shape.
- Protection against wrong advice: life-critical decisions are rule-based; strict prompt and schema (one action, max 15 words, no diagnosis, no doses); validation of every reply; a safety guard that blocks 10 known harmful myths (making someone vomit, butter on burns, belly thrusts on babies, doses …); on timeout, error or a blocked step the app switches to the reviewed offline protocol and tells the user. Emergency number and CPR button are always visible.

**AI during development: Claude (Anthropic)** as coding assistant for architecture, code, protocol drafts, tests and documentation.
- How we reviewed it: protocol content was checked against ERC 2021, AHA and Red Cross lay-rescuer guidance. An automated suite (`npm run check`, also in GitHub Actions) walks every protocol path for adult, child and baby, plus the classifier, voice commands, the safety guard and the jury scenarios. We also ran end-to-end browser tests and live runs against the real Gemini API.
- What review caught: a baby-choking screen that mentioned belly thrusts, an over-broad "breathing" rule, non-repeatable answers (fixed with temperature 0 and a seed), and a first live run that only passed through the offline fallback (we made the live test require real AI answers).

## How can judges run or evaluate your project?

**Fastest:** open https://calmaid-omega.vercel.app on a phone or laptop. No login, no setup, no key needed. Tap **Settings → For judges** for a 3-minute guided tour.

**Suggested tour**
1. Tap **Heavy bleeding** (instant reviewed protocol, no AI).
2. Tap **Type** and enter *"I spilled boiling water on my arm"* (AI picks the protocol, 20-minute cooling timer).
3. Tap **Unconscious**, answer **No** twice and tap through to the CPR coach (beat and vibration).
4. Open **Report for paramedics** for the handover report and QR code.
5. Open **Settings → Reliability Test Lab** and run the jury tests live.

**Test cases** (run live in the app and in CI)

| Type | Input | Expected | Result |
|---|---|---|---|
| Standard 1 | "My friend cut his hand with a kitchen knife and it is bleeding a lot" | Call advised, firm direct pressure, safe end screen | ✅ |
| Standard 2 | "I spilled boiling water on my arm" | Cool running water 20 min (timer), no myths | ✅ |
| Repeat | Standard 2, run 5× | Identical guidance every run | ✅ 5/5 identical |
| Edge case | "There's blood everywhere and she's not breathing" | CPR first, no questions, rule-based | ✅ |

Plus 7 automated edge cases (unclear input, baby choking, hybrid quick button, harmful AI advice blocked, AI outage, "not breathing" override, third AI question refused): **11/11 pass**, offline in CI and live against Gemini.

**Run locally**
```bash
git clone https://github.com/swulfen13/CalmAid && cd CalmAid
npm ci
npm run check   # all protocol paths + 11 test scenarios, no key needed
npm run dev     # optional: put GEMINI_API_KEY=... in .env.local for AI
```

**Known limitations**
- Not a substitute for professional training or the emergency services. Content is based on ERC/AHA/Red Cross lay guidance but not yet reviewed by a certified trainer.
- AI needs internet and a Gemini key on the server; without it, the app uses keyword matching and the reviewed offline protocols (English only).
- Photos or text can be misread, so the app never diagnoses.
- Hands-free voice answers depend on the browser's speech recognition (best in Chrome); iOS is silent when the mute switch is on.

**External dependencies:** Google Gemini API (server-side, key held in Vercel environment variables), Vercel hosting. No database, no accounts.
