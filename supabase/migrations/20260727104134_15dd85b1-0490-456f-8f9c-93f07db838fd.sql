CREATE POLICY "shop-featured read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'shop-featured');

CREATE POLICY "shop-featured admin insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'shop-featured' AND public.is_admin());

CREATE POLICY "shop-featured admin update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'shop-featured' AND public.is_admin())
  WITH CHECK (bucket_id = 'shop-featured' AND public.is_admin());

CREATE POLICY "shop-featured admin delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'shop-featured' AND public.is_admin());