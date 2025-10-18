-- Add shipping cost column to products table
ALTER TABLE public.products
ADD COLUMN shipping_cost numeric DEFAULT 0 NOT NULL;