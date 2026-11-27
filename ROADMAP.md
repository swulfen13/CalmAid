# CalmAid Roadmap

Deadline: **28 Nov 2026, 15:00 PST** (29 Nov, 00:00 German time).
Order = most impact on the judging criteria first
(AI & creativity 30 % · tech & reliability 30 % · impact 20 % · design & UX 20 %).

## ✅ Phase 0: MVP (done)
- Emergency banner, start screen, 9 quick buttons, free text + voice input
- Step-by-step guide (≤ 2 yes/no questions, one action per screen)
- Offline protocols + Gemini engine with automatic fallback
- Read-aloud, CPR metronome, step timers, "Not breathing" override
- Handover report (localStorage), 14 everyday guides, photo input

## Phase 1: Must-have (reliability & impact)
| # | Feature | Why | Status |
|---|---|---|---|
| 1 | **PWA**: installable, works offline (service worker) | Works in a basement with no signal → reliability | ✅ |
| 2 | **Location card** for the emergency call (GPS + accuracy, works offline) | Callers often can't say where they are | ✅ |
| 3 | **Hands-free mode**: answer "yes / no / next / repeat / not breathing" by voice | Hands are busy pressing a wound or doing CPR | ✅ |
| 4 | **CPR vibration** on every beat | Works when it's loud | ✅ |
| 5 | **QR code handover**: paramedics scan the report | Quick, contact-free handover | ✅ |
| 6 | **Child & baby mode** (CPR + choking technique differ) | Safety for the most common lay-rescuer scenario | ✅ |

## Phase 2: AI & creativity
| # | Feature | Status |
|---|---|---|
| 7 | **Visible photo analysis**: AI states what it sees, written into the report | ✅ |
| 8 | **Guidance in the user's language** (AI) + **local emergency number** by country | ✅ |
| 9 | **Secure AI proxy** (Vercel function + Vite dev middleware): API key never ships to the browser | ✅ |

## Phase 3: Design & UX
| # | Feature | Status |
|---|---|---|
| 10 | **Illustrations** for key steps (CPR hands, recovery position, pressure, cooling, back blows…) | ✅ |
| 11 | **Medical ID** (allergies, meds, conditions, emergency contact), local only, optional in report | ✅ |
| 12 | **Dark mode** (auto + manual) for night-time emergencies | ✅ |
| 13 | **Demo mode** (`?demo`): timers shortened to 10 s for a smooth video | ✅ |

## Phase 3b: Jury polish (done)
| # | Feature | Status |
|---|---|---|
| 14 | **Tab bar** Help now · Learn · Settings, decluttered home, consistent line icons | ✅ |
| 15 | **Learn tab:** 8 micro-lessons with drawings + quizzes + progress, sources | ✅ |
| 16 | **CPR rhythm trainer** with live rate gauge and 30-s score | ✅ |
| 17 | **Safety guard** (10 harmful-myth rules) + rule-based critical overrides | ✅ |
| 18 | **Deterministic AI** (temperature 0, topK 1, seed) | ✅ |
| 19 | **Test Lab** in the app: R2 cases + 6 edge cases, Markdown export | ✅ |
| 20 | **AI transparency page** (A2–A5) | ✅ |
| 21 | Error boundary, GitHub Actions CI, README / DEVPOST / VIDEO_SCRIPT | ✅ |

## Phase 3c: Mobile, learning path, handbook (done)
| # | Feature | Status |
|---|---|---|
| 22 | Screen stays on during emergencies (Wake Lock / expo-keep-awake) | ✅ |
| 23 | Seamless AI → offline fallback (no repeated questions) | ✅ |
| 24 | **Expo app** (iOS + Android via Expo Go): native haptics, keep-awake, speech, offline emergency screen | ✅ |
| 25 | **Learning path**: 4 units, 21 steps, 5 exercise types, XP, streak, badges, daily refresher | ✅ |
| 26 | **Handbook**: 19 searchable chapters, linked from emergency guides | ✅ |
| 27 | **For judges** page with QR codes | ✅ |

## Phase 4: Submission
- [x] Test key: live AI run 10/10 (`npm run test:ai`), app flow via proxy verified
- [ ] Photo analysis with a real photo (manual)
- [ ] Fresh key in Vercel env `GEMINI_API_KEY` before submission
- [ ] Manual test on a real phone (voice, vibration, install as app) + Expo Go on iPhone and Android
- [ ] `eas update` for the Expo app, put the link into `VITE_EXPO_URL` and `app.json`
- [ ] Public GitHub repo + deploy to Vercel
- [x] Live results in DEVPOST.md
- [ ] Record 2–4 min demo video (see VIDEO_SCRIPT.md)
- [ ] Devpost text (draft in DEVPOST.md) + participant form (same name & e-mail as Devpost)

## Later (after the hackathon)
- Address lookup (reverse geocoding) and nearby AED map; needs external services
- Offline protocols translated (currently English only; AI answers in any language)
- Review of all medical content by a certified first-aid trainer
- Direct call to emergency services with location (eCall / AML) where available
- Wearable / smartwatch CPR feedback
