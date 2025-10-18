-- Add new fields to orders table
ALTER TABLE public.orders 
ADD COLUMN customer_confirmation text,
ADD COLUMN courier_company text;