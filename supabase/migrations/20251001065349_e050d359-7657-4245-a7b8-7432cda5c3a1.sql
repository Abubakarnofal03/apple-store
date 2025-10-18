-- Add show_text_overlay column to banners table
ALTER TABLE public.banners 
ADD COLUMN show_text_overlay boolean NOT NULL DEFAULT true;