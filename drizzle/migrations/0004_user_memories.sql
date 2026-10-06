CREATE TABLE public.user_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text text NOT NULL,
  kind text NOT NULL DEFAULT 'preference',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX user_memories_user_idx ON public.user_memories(user_id, created_at DESC);
GRANT SELECT, DELETE ON public.user_memories TO authenticated;
GRANT ALL ON public.user_memories TO service_role;
ALTER TABLE public.user_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own memories" ON public.user_memories FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own memories" ON public.user_memories FOR DELETE TO authenticated USING (auth.uid() = user_id);