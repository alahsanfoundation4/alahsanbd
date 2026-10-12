ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS slug text;
CREATE UNIQUE INDEX IF NOT EXISTS pages_slug_unique ON public.pages (lower(slug)) WHERE slug IS NOT NULL;

CREATE POLICY "Public read chat images" ON storage.objects FOR SELECT USING (bucket_id = 'chat-images');
CREATE POLICY "Users upload own chat images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own chat images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'chat-images' AND (storage.foldername(name))[1] = auth.uid()::text);