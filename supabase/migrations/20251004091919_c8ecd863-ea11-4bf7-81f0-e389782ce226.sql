-- Make shipping_state and shipping_zip nullable since they're no longer required
ALTER TABLE public.orders 
  ALTER COLUMN shipping_state DROP NOT NULL,
  ALTER COLUMN shipping_zip DROP NOT NULL;