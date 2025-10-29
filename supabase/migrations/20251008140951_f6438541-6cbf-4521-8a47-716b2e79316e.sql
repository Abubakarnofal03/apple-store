-- Create product_variations table
CREATE TABLE product_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE product_variations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view product variations"
ON product_variations FOR SELECT
USING (true);

CREATE POLICY "Admins can manage product variations"
ON product_variations FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for better performance
CREATE INDEX idx_product_variations_product_id ON product_variations(product_id);

-- Add trigger for updated_at
CREATE TRIGGER update_product_variations_updated_at
BEFORE UPDATE ON product_variations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add variation tracking to cart_items
ALTER TABLE cart_items
ADD COLUMN variation_id UUID REFERENCES product_variations(id) ON DELETE SET NULL,
ADD COLUMN variation_name TEXT,
ADD COLUMN variation_price NUMERIC;

-- Add variation tracking to order_items
ALTER TABLE order_items
ADD COLUMN variation_id UUID REFERENCES product_variations(id) ON DELETE SET NULL,
ADD COLUMN variation_name TEXT,
ADD COLUMN variation_price NUMERIC;