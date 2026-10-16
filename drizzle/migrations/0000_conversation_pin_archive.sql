ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;