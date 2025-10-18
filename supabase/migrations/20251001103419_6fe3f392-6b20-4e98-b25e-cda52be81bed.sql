-- Update storage bucket to allow video uploads
UPDATE storage.buckets
SET 
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/ogg'],
  file_size_limit = 52428800  -- 50MB in bytes
WHERE id = 'store-images';