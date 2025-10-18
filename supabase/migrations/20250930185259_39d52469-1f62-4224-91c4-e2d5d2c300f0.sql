-- Add banners table for dynamic homepage banners
CREATE TABLE public.banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add product_images table for multiple product images
CREATE TABLE public.product_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add SKU to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE;

-- Update orders table for guest checkout
ALTER TABLE public.orders 
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS first_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS last_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Enable RLS for banners
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Banners policies
CREATE POLICY "Anyone can view active banners"
  ON public.banners FOR SELECT
  USING (active = true);

CREATE POLICY "Admins can manage banners"
  ON public.banners FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Enable RLS for product_images
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Product images policies
CREATE POLICY "Anyone can view product images"
  ON public.product_images FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage product images"
  ON public.product_images FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Add trigger for banners updated_at
CREATE TRIGGER update_banners_updated_at
  BEFORE UPDATE ON public.banners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert dummy categories
INSERT INTO public.categories (name, slug, description, image_url) VALUES
  ('Home Décor', 'home-decor', 'Premium home decoration items', 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800'),
  ('Men''s Wallets', 'mens-wallets', 'Luxury leather wallets for men', 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800'),
  ('Women''s Wallets', 'womens-wallets', 'Elegant wallets for women', 'https://images.unsplash.com/photo-1591561954555-607968c989ab?w=800')
ON CONFLICT (slug) DO NOTHING;

-- Insert dummy products
INSERT INTO public.products (name, slug, description, price, stock_quantity, category_id, is_featured, sku, images) 
SELECT 
  'Premium Leather Wallet',
  'premium-leather-wallet',
  'Handcrafted genuine leather wallet with multiple card slots',
  89.99,
  25,
  c.id,
  true,
  'PLW-001',
  ARRAY['https://images.unsplash.com/photo-1627123424574-724758594e93?w=800']
FROM public.categories c WHERE c.slug = 'mens-wallets'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (name, slug, description, price, stock_quantity, category_id, is_featured, sku, images)
SELECT 
  'Elegant Wall Mirror',
  'elegant-wall-mirror',
  'Gold-framed decorative mirror perfect for living spaces',
  149.99,
  15,
  c.id,
  true,
  'EWM-001',
  ARRAY['https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800']
FROM public.categories c WHERE c.slug = 'home-decor'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (name, slug, description, price, stock_quantity, category_id, is_featured, sku, images)
SELECT 
  'Designer Clutch',
  'designer-clutch',
  'Sophisticated leather clutch with premium finish',
  119.99,
  20,
  c.id,
  true,
  'DC-001',
  ARRAY['https://images.unsplash.com/photo-1591561954555-607968c989ab?w=800']
FROM public.categories c WHERE c.slug = 'womens-wallets'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (name, slug, description, price, stock_quantity, category_id, sku, images)
SELECT 
  'Modern Table Lamp',
  'modern-table-lamp',
  'Elegant brass table lamp with warm lighting',
  79.99,
  30,
  c.id,
  'MTL-001',
  ARRAY['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800']
FROM public.categories c WHERE c.slug = 'home-decor'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (name, slug, description, price, stock_quantity, category_id, sku, images)
SELECT 
  'Executive Wallet',
  'executive-wallet',
  'Professional bifold wallet with RFID protection',
  99.99,
  18,
  c.id,
  'EW-001',
  ARRAY['https://images.unsplash.com/photo-1627123424574-724758594e93?w=800']
FROM public.categories c WHERE c.slug = 'mens-wallets'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (name, slug, description, price, stock_quantity, category_id, sku, images)
SELECT 
  'Luxury Card Holder',
  'luxury-card-holder',
  'Slim leather card holder with metallic accents',
  69.99,
  35,
  c.id,
  'LCH-001',
  ARRAY['https://images.unsplash.com/photo-1591561954555-607968c989ab?w=800']
FROM public.categories c WHERE c.slug = 'womens-wallets'
ON CONFLICT (slug) DO NOTHING;

-- Insert dummy banners
INSERT INTO public.banners (title, subtitle, image_url, link_url, active, sort_order) VALUES
  ('Elevate Your Lifestyle', 'Discover premium home décor and luxury leather accessories', 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1920', '/shop', true, 1),
  ('New Collection', 'Handcrafted leather goods for the discerning customer', 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=1920', '/shop?category=mens-wallets', true, 2)
ON CONFLICT DO NOTHING;