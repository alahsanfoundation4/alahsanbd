<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Long-term memory lives per user in the `user_memories` table (via `src/lib/memory.server.ts`); Google Drive memory was removed — keep memory in the database.
- `/api/chat` streams `data: {"stage": ...}` SSE events before model output so the UI can show progress steps; keep new tools (search, image) emitting stages.
- Backup API key pool is capped at 2 and deduplicated on save; keys are only read server-side for AI calls.
- Live voice uses the shared persistent SDK relay in development and the Worker server entry in production; authenticate app.start before any paid session and retain heartbeat/Stop/final-usage cleanup.
- Voice UI owns the useLiveVoice hook and mounted audio element for the full call; captions must not recreate media connections.
- Latency optimizations overlap independent preparation and consolidate adjacent voice fragments without dropping context; preserve model selection, reasoning budgets, search, access checks, and call lifecycle timers.
- Voice policy is enforced by a shared server resolver and fixed per call; obsolete or arbitrary client choices cannot bypass it, and no automatic reconnection changes voices.
- Google-key voice uses authenticated server-minted single-use constrained Gemini tokens; permanent provider keys never leave the server for inference, and browser audio capture/playback stays in one call-owned hook.
- Private image downloads require authenticated owner access; message writes require ownership of both message and parent conversation, and admin roles cannot be self-granted.
