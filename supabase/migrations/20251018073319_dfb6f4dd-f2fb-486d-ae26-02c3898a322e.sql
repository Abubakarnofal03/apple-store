-- Add quantity column to product_variations table
ALTER TABLE public.product_variations
ADD COLUMN quantity integer NOT NULL DEFAULT 0;

-- Create product_colors table
CREATE TABLE public.product_colors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  color_code text NOT NULL,
  price numeric NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  apply_sale boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on product_colors
ALTER TABLE public.product_colors ENABLE ROW LEVEL SECURITY;

-- Create policies for product_colors
CREATE POLICY "Anyone can view product colors"
ON public.product_colors
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage product colors"
ON public.product_colors
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_product_colors_updated_at
BEFORE UPDATE ON public.product_colors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();