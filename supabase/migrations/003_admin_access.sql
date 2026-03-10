DROP POLICY IF EXISTS "Public Access" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id =
      'product-images' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated Update" ON storage.objects FOR UPDATE USING (bucket_id = 'product-image'
      AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated Delete" ON storage.objects FOR DELETE USING (bucket_id = 'product-image'
      AND auth.role() = 'authenticated');