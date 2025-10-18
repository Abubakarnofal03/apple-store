-- Add color columns to cart_items table
ALTER TABLE public.cart_items
ADD COLUMN color_id uuid REFERENCES public.product_colors(id) ON DELETE SET NULL,
ADD COLUMN color_name text,
ADD COLUMN color_code text,
ADD COLUMN color_price numeric;