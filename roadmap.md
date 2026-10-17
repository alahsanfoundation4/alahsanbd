# Al-Ahsan AI roadmap

- [ ] Current request: reduce chat and voice latency without weakening knowledge; retest short chat and spoken questions, resolve actionable prior verification notes, document remaining external blockers

- [x] Email sign-in was disabled on the remixed backend — enabled; test signup returns confirmation_sent_at (real inbox delivery pending manual check)
- [x] Password reset (forgot link + /reset-password page) — pending manual email check
- [x] Phase 4: stop/regenerate/copy/edit message; regenerate no longer double-saves the question (signed-in click test pending)
- [x] Phase 5: model picker in chat (auto + allowed list, server-validated)
- [x] Phase 6–8: image (5), PDF/Word files, image generation, mic + voice reply (already existed, audited)
- [x] Phase 8–9: Bengali two-way voice calls implemented; signed-in microphone input produces Bengali answers, delegated reasoning succeeds, Start/Stop and final usage verified in preview; four access/cleanup tests pass
- [ ] Voice release verification — owner must publish before hosted checks; human listening, interruption/correction, background-tab endurance, and real mobile microphone remain unverified
- [x] Parallelize URL reads and overlap search with memory preparation without changing models/caps; signed-in short-question first visible answer measured at 2.85 seconds (one sample, not a guarantee)
- [x] Phase 10–12: study / writing / coding mode picker
- [ ] Phase 13–15: builders, workspace
- [x] Phase 16: web search (already existed, audited)
- [x] Phase 17/35: /profile page — account info, memories view/delete, delete all chats
- [x] Phase 18: admin panel (already existed)
- [ ] Phase 19–22: security, performance, mobile, regression
