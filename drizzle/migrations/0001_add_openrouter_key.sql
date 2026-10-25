-- PR #3 added OpenRouter support in application code but did not add the
-- corresponding database column. Keep this idempotent so it is safe to apply
-- to projects where the column may already exist.
ALTER TABLE public.ai_keys
  ADD COLUMN IF NOT EXISTS openrouter_key text NOT NULL DEFAULT '';

-- Refresh PostgREST's schema cache so the admin panel can immediately read/write it.
NOTIFY pgrst, 'reload schema';
