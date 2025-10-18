-- Add apply_sale column to product_variations table
ALTER TABLE public.product_variations 
ADD COLUMN apply_sale boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.product_variations.apply_sale IS 'Whether to apply product/global sales to this variation';