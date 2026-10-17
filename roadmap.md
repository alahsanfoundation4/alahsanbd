# Al-Ahsan AI roadmap

- [x] Added allowlisted masculine voice selector before Start; signed-in male-voice call returned Bengali mathematical answer with playing nonzero audio, mute/unmute and released audio after Stop; eight tests pass; model/effort/caps unchanged

- [x] Current latency pass: overlap session/conversation creation and URL preparation; start voice reply before database saves; consolidate voice transcript fragments without dropping words; preserve models/effort/caps/timers; six tests pass
- [x] Signed-in verification: three new-chat answers appeared after 3.85 / 2.36 / 2.35 seconds and the saved answer read back; voice produced a Bengali mathematical proof with nonzero playing audio, mute/unmute, Stop and released audio; delegated response took 6.052 seconds, so no 1–2s guarantee

- [x] Email sign-in was disabled on the remixed backend — enabled; test signup returns confirmation_sent_at (real inbox delivery pending manual check)
- [x] Password reset (forgot link + /reset-password page) — pending manual email check
- [x] Phase 4: stop/regenerate/copy/edit message; regenerate no longer double-saves the question (signed-in click test pending)
- [x] Phase 5: model picker in chat (auto + allowed list, server-validated)
- [x] Phase 6–8: image (5), PDF/Word files, image generation, mic + voice reply (already existed, audited)
- [x] Phase 8–9: Bengali two-way voice calls implemented; signed-in microphone input produces Bengali answers, delegated reasoning succeeds, Start/Stop and final usage verified in preview; four access/cleanup tests pass
- [ ] Voice release verification — owner must publish before hosted checks; human listening, interruption/correction, background-tab endurance, and real mobile microphone remain unverified; automated playing audio/mute/Stop now verified
- [x] Parallelize URL reads and overlap search with memory preparation without changing models/caps; signed-in short-question first visible answer measured at 2.85 seconds (one sample, not a guarantee)
- [x] Phase 10–12: study / writing / coding mode picker
- [ ] Phase 13–15: builders, workspace
- [x] Phase 16: web search (already existed, audited)
- [x] Phase 17/35: /profile page — account info, memories view/delete, delete all chats
- [x] Phase 18: admin panel (already existed)
- [ ] Phase 19–22: security, performance, mobile, regression
