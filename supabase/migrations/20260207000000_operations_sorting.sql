-- Migration: Add operations_sorting to app_settings
-- Description: Replaces position-based sorting with a deterministic array-based sorting.

-- 1. Add the column
ALTER TABLE public.app_settings
ADD COLUMN operations_sorting text[] NOT NULL DEFAULT '{}';

-- 2. Populate the column with existing paid_items sorted by date (best guess initial order)
WITH sorted_items AS (
    SELECT instance_id 
    FROM public.paid_items 
    ORDER BY payment_date DESC, created_at DESC
)
UPDATE public.app_settings
SET operations_sorting = ARRAY(SELECT instance_id FROM sorted_items);

-- 3. (Optional) Remove the position column from paid_items
-- We keep it for now as a backup, but it's deprecated.
-- ALTER TABLE public.paid_items DROP COLUMN position;
