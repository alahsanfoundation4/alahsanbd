-- Ensure openrouter_key column exists on public.ai_keys
ALTER TABLE public.ai_keys
  ADD COLUMN IF NOT EXISTS openrouter_key text NOT NULL DEFAULT '';

-- Notify PostgREST to reload its schema cache immediately
NOTIFY pgrst, 'reload schema';
