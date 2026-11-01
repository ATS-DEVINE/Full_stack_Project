
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('seller-assets', 'seller-assets', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Product images: sellers can upload/manage their own, everyone can view
CREATE POLICY "Anyone can view product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Authenticated users can upload product images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "Users can update own product images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own product images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Seller assets: sellers can upload/manage their own, everyone can view
CREATE POLICY "Anyone can view seller assets" ON storage.objects FOR SELECT USING (bucket_id = 'seller-assets');
CREATE POLICY "Authenticated users can upload seller assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'seller-assets');
CREATE POLICY "Users can update own seller assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'seller-assets' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own seller assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'seller-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Avatars: users can upload/manage their own, everyone can view
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Users can update own avatars" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own avatars" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
