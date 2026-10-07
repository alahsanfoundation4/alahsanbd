CREATE POLICY "Admins insert settings" ON public.ai_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) AND id = 1);
CREATE POLICY "Admins insert keys" ON public.ai_keys FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) AND id = 1);
GRANT INSERT ON public.ai_settings TO authenticated;
GRANT INSERT ON public.ai_keys TO authenticated;