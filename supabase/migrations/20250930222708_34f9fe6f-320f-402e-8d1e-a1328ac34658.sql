-- Create storage bucket for store images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'store-images',
  'store-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
);

-- Allow public read access to images
CREATE POLICY "Public can view store images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'store-images');

-- Allow admins to upload images
CREATE POLICY "Admins can upload store images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'store-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to update images
CREATE POLICY "Admins can update store images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'store-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to delete images
CREATE POLICY "Admins can delete store images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'store-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);