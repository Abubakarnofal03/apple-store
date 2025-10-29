-- Add admin_notes column to orders table for admin to add notes
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS admin_notes text;