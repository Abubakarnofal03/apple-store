-- Add SEO fields to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS meta_title TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS focus_keywords TEXT[];

-- Add SEO fields to categories table
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS meta_title TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS focus_keywords TEXT[];

-- Create blogs table for content marketing
CREATE TABLE IF NOT EXISTS public.blogs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  meta_title TEXT,
  meta_description TEXT,
  focus_keywords TEXT[],
  featured_image_url TEXT,
  author TEXT DEFAULT 'The Shopping Cart',
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on blogs
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- Anyone can view published blogs
CREATE POLICY "Anyone can view published blogs"
ON public.blogs
FOR SELECT
USING (published = true);

-- Admins can manage blogs
CREATE POLICY "Admins can manage blogs"
ON public.blogs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for blogs updated_at
CREATE TRIGGER update_blogs_updated_at
BEFORE UPDATE ON public.blogs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample blog posts
INSERT INTO public.blogs (title, slug, content, excerpt, meta_title, meta_description, focus_keywords, published, featured_image_url) VALUES
(
  'Top 10 Home Decor Trends in Pakistan 2025',
  'top-10-home-decor-trends-pakistan-2025',
  '<h2>Transform Your Space with Latest Home Decor Trends</h2><p>Discover the hottest home decor trends sweeping across Pakistan in 2025. From minimalist aesthetics to bold statement pieces, we''re exploring what''s making Pakistani homes beautiful this year.</p><h3>1. Sustainable Materials</h3><p>Eco-friendly furniture and decor made from sustainable materials are gaining popularity...</p><h3>2. Bold Color Palettes</h3><p>Pakistani homeowners are embracing vibrant colors and patterns...</p><h3>3. Multifunctional Furniture</h3><p>Space-saving designs that serve multiple purposes...</p>',
  'Explore the top 10 home decor trends in Pakistan for 2025. Find inspiration for your home with our expert guide to furniture, accessories, and design.',
  'Top 10 Home Decor Trends in Pakistan 2025 | The Shopping Cart',
  'Discover the hottest home decor trends in Pakistan for 2025. From sustainable furniture to bold colors - transform your space with The Shopping Cart.',
  ARRAY['home decor', 'Pakistan', 'interior design', 'furniture trends', 'home accessories', '2025 trends'],
  true,
  '/placeholder.svg'
),
(
  'Best Wallets for Men & Women – 2025 Complete Guide',
  'best-wallets-men-women-2025-guide',
  '<h2>Find Your Perfect Wallet</h2><p>Choosing the right wallet is more than just style - it''s about functionality, durability, and personal expression. Our 2025 guide covers everything you need to know.</p><h3>Men''s Wallets</h3><p>From classic bifolds to modern minimalist designs, explore the best men''s wallets available online in Pakistan...</p><h3>Women''s Wallets</h3><p>Elegant, practical, and stylish - find women''s wallets that complement any outfit...</p><h3>Materials Matter</h3><p>Genuine leather vs synthetic - what''s best for you?</p>',
  'Complete guide to choosing the best wallets for men and women in 2025. Compare styles, materials, and find your perfect wallet at The Shopping Cart.',
  'Best Wallets for Men & Women – 2025 Guide | The Shopping Cart',
  'Expert guide to the best wallets for men and women in 2025. Shop premium leather wallets online in Pakistan with fast delivery at TheShoppingCart.shop.',
  ARRAY['wallets', 'men wallets', 'women wallets', 'leather wallets', 'buy wallets online', 'Pakistan'],
  true,
  '/placeholder.svg'
),
(
  'Affordable Furniture & Garden Decorations Online in Pakistan',
  'affordable-furniture-garden-decorations-pakistan',
  '<h2>Shop Premium Yet Affordable Home & Garden Items</h2><p>Looking for quality furniture and garden decorations without breaking the bank? The Shopping Cart brings you the best deals on premium home and outdoor decor.</p><h3>Furniture for Every Room</h3><p>From bedroom sets to living room sofas, find affordable furniture that doesn''t compromise on quality...</p><h3>Garden & Outdoor Decor</h3><p>Transform your outdoor spaces with beautiful garden decorations, planters, and accessories...</p><h3>Why Shop Online?</h3><p>Convenience, better prices, and delivery to your doorstep across Pakistan.</p>',
  'Shop affordable furniture and garden decorations online in Pakistan. Quality home decor and outdoor accessories delivered fast. TheShoppingCart.shop',
  'Affordable Furniture & Garden Decorations | The Shopping Cart',
  'Buy affordable furniture and garden decorations online in Pakistan. Premium quality, fast delivery across Pakistan. Shop now at TheShoppingCart.shop.',
  ARRAY['affordable furniture', 'garden decorations', 'online shopping Pakistan', 'home decor', 'outdoor accessories', 'furniture online'],
  true,
  '/placeholder.svg'
);