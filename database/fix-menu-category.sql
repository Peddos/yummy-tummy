-- Add 'category' column to 'menu_items' table
-- This fixes the issue where the vendor dashboard attempts to save a category string directly

ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS category TEXT;

-- Optional: If you want to migrate existing category_ids to the text column (if any existed)
-- UPDATE menu_items mi 
-- SET category = mc.name 
-- FROM menu_categories mc 
-- WHERE mi.category_id = mc.id;
