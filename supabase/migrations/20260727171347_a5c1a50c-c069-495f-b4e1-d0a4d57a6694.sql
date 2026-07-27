
CREATE POLICY "bundle_concepts_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'bundle-concepts');
CREATE POLICY "bundle_concepts_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'bundle-concepts');
CREATE POLICY "bundle_concepts_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'bundle-concepts') WITH CHECK (bucket_id = 'bundle-concepts');
CREATE POLICY "bundle_concepts_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'bundle-concepts');
