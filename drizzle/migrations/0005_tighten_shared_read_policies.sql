-- Shared reads: only signed-in users linked to an app profile
DROP POLICY IF EXISTS "notifications read" ON public.notifications;
CREATE POLICY "notifications read" ON public.notifications FOR SELECT TO authenticated
  USING (public.current_profile_id() IS NOT NULL);

DROP POLICY IF EXISTS "notification_tags read" ON public.notification_tags;
CREATE POLICY "notification_tags read" ON public.notification_tags FOR SELECT TO authenticated
  USING (public.current_profile_id() IS NOT NULL);

DROP POLICY IF EXISTS "activity_events shared read" ON public.activity_events;
CREATE POLICY "activity_events shared read" ON public.activity_events FOR SELECT TO authenticated
  USING (public.current_profile_id() IS NOT NULL);

DROP POLICY IF EXISTS "activity_reactions shared read" ON public.activity_reactions;
CREATE POLICY "activity_reactions shared read" ON public.activity_reactions FOR SELECT TO authenticated
  USING (public.current_profile_id() IS NOT NULL);

DROP POLICY IF EXISTS "duels shared read" ON public.duels;
CREATE POLICY "duels shared read" ON public.duels FOR SELECT TO authenticated
  USING (public.current_profile_id() IS NOT NULL);

DROP POLICY IF EXISTS "duel_results shared read" ON public.duel_results;
CREATE POLICY "duel_results shared read" ON public.duel_results FOR SELECT TO authenticated
  USING (public.current_profile_id() IS NOT NULL);

DROP POLICY IF EXISTS "system_updates authenticated read" ON public.system_updates;
CREATE POLICY "system_updates authenticated read" ON public.system_updates FOR SELECT TO authenticated
  USING (public.current_profile_id() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can read area maintenance" ON public.app_area_maintenance;
CREATE POLICY "Authenticated users can read area maintenance" ON public.app_area_maintenance FOR SELECT TO authenticated
  USING (public.current_profile_id() IS NOT NULL);

DROP POLICY IF EXISTS "published_decks read" ON public.published_decks;
CREATE POLICY "published_decks read" ON public.published_decks FOR SELECT TO authenticated
  USING (public.current_profile_id() IS NOT NULL);

DROP POLICY IF EXISTS "app_settings read" ON public.app_settings;
CREATE POLICY "app_settings read" ON public.app_settings FOR SELECT TO authenticated
  USING (public.current_profile_id() IS NOT NULL);

-- Roles: each profile sees only its own roles; admins see all
DROP POLICY IF EXISTS "Authenticated can read roles" ON public.user_roles;
CREATE POLICY "Authenticated can read roles" ON public.user_roles FOR SELECT TO authenticated
  USING (profile_id = public.current_profile_id() OR public.is_admin());

-- Bundle concepts: linked profiles read, admins write
DROP POLICY IF EXISTS "Anyone can read bundle concepts" ON public.bundle_concepts;
DROP POLICY IF EXISTS "Anyone can insert bundle concepts" ON public.bundle_concepts;
DROP POLICY IF EXISTS "Anyone can update bundle concepts" ON public.bundle_concepts;
DROP POLICY IF EXISTS "Anyone can delete bundle concepts" ON public.bundle_concepts;
REVOKE ALL ON public.bundle_concepts FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bundle_concepts TO authenticated;
GRANT ALL ON public.bundle_concepts TO service_role;
CREATE POLICY "bundle_concepts linked read" ON public.bundle_concepts FOR SELECT TO authenticated
  USING (public.current_profile_id() IS NOT NULL);
CREATE POLICY "bundle_concepts admin insert" ON public.bundle_concepts FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());
CREATE POLICY "bundle_concepts admin update" ON public.bundle_concepts FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "bundle_concepts admin delete" ON public.bundle_concepts FOR DELETE TO authenticated
  USING (public.is_admin());

-- Storage: bundle-concepts bucket
DROP POLICY IF EXISTS "bundle_concepts_read" ON storage.objects;
DROP POLICY IF EXISTS "bundle_concepts_insert" ON storage.objects;
DROP POLICY IF EXISTS "bundle_concepts_update" ON storage.objects;
DROP POLICY IF EXISTS "bundle_concepts_delete" ON storage.objects;
CREATE POLICY "bundle_concepts_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'bundle-concepts' AND public.current_profile_id() IS NOT NULL);
CREATE POLICY "bundle_concepts_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'bundle-concepts' AND public.is_admin());
CREATE POLICY "bundle_concepts_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'bundle-concepts' AND public.is_admin())
  WITH CHECK (bucket_id = 'bundle-concepts' AND public.is_admin());
CREATE POLICY "bundle_concepts_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'bundle-concepts' AND public.is_admin());

-- Storage: shop-featured bucket read
DROP POLICY IF EXISTS "shop-featured read" ON storage.objects;
CREATE POLICY "shop-featured read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'shop-featured' AND public.current_profile_id() IS NOT NULL);