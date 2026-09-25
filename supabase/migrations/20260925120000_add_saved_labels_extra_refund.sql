ALTER TABLE public.saved_labels
	ADD COLUMN IF NOT EXISTS is_extra boolean NOT NULL DEFAULT false,
	ADD COLUMN IF NOT EXISTS is_refund boolean NOT NULL DEFAULT false;
