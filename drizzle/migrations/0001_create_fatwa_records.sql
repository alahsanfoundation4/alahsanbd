CREATE TABLE public.fatwa_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  source text NOT NULL DEFAULT '',
  reference text NOT NULL DEFAULT '',
  original_text text NOT NULL DEFAULT '',
  ruling text NOT NULL,
  keywords text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fatwa_records TO authenticated;
GRANT ALL ON public.fatwa_records TO service_role;
ALTER TABLE public.fatwa_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage fatwa" ON public.fatwa_records FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));