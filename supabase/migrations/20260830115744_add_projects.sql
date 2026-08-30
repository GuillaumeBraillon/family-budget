CREATE TABLE IF NOT EXISTS public.projects (
	id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
	name text NOT NULL,
	is_archived boolean DEFAULT false NOT NULL,
	created_at timestamptz DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_policies
		WHERE schemaname = 'public'
			AND tablename = 'projects'
			AND policyname = 'Enable all for authenticated users'
	) THEN
		CREATE POLICY "Enable all for authenticated users" ON public.projects
			FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
	END IF;
END;
$$;

ALTER TABLE public.paid_items
	ADD COLUMN IF NOT EXISTS project_id text REFERENCES public.projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_paid_items_project ON public.paid_items(project_id);

DROP FUNCTION IF EXISTS public.upsert_paid_item_atomic(
	text, numeric, date, text, text, text, text,
	public.transaction_type, boolean, boolean, boolean, boolean, boolean, text, jsonb
);

CREATE FUNCTION public.upsert_paid_item_atomic(
	p_instance_id text,
	p_amount numeric,
	p_payment_date date,
	p_account_id text,
	p_label text,
	p_category text,
	p_sub_category text,
	p_type public.transaction_type,
	p_is_variable boolean,
	p_is_waiting boolean,
	p_is_extra boolean,
	p_is_refund boolean,
	p_is_salary boolean,
	p_comments text,
	p_beneficiary_amounts jsonb DEFAULT NULL,
	p_project_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
	v_sum_beneficiaries numeric := 0;
BEGIN
	IF p_instance_id IS NULL OR length(trim(p_instance_id)) = 0 THEN
		RAISE EXCEPTION 'instance_id requis';
	END IF;

	IF p_amount IS NULL OR p_amount <= 0 THEN
		RAISE EXCEPTION 'amount invalide: %', p_amount;
	END IF;

	IF p_beneficiary_amounts IS NULL
		 OR jsonb_typeof(p_beneficiary_amounts) <> 'array'
		 OR jsonb_array_length(p_beneficiary_amounts) = 0 THEN
		RAISE EXCEPTION 'p_beneficiary_amounts requis et doit contenir au moins 1 bénéficiaire';
	END IF;

	INSERT INTO public.paid_items (
		instance_id, amount, payment_date, account_id, label, category, sub_category,
		type, is_variable, is_waiting, is_extra, is_refund, is_salary, comments, project_id
	) VALUES (
		p_instance_id, p_amount, p_payment_date, p_account_id, p_label, p_category, p_sub_category,
		p_type, COALESCE(p_is_variable, false), COALESCE(p_is_waiting, false),
		COALESCE(p_is_extra, false), COALESCE(p_is_refund, false), COALESCE(p_is_salary, false),
		p_comments, p_project_id
	)
	ON CONFLICT (instance_id) DO UPDATE SET
		amount = EXCLUDED.amount,
		payment_date = EXCLUDED.payment_date,
		account_id = EXCLUDED.account_id,
		label = EXCLUDED.label,
		category = EXCLUDED.category,
		sub_category = EXCLUDED.sub_category,
		type = EXCLUDED.type,
		is_variable = EXCLUDED.is_variable,
		is_waiting = EXCLUDED.is_waiting,
		is_extra = EXCLUDED.is_extra,
		is_refund = EXCLUDED.is_refund,
		is_salary = EXCLUDED.is_salary,
		comments = EXCLUDED.comments,
		project_id = EXCLUDED.project_id;

	SELECT COALESCE(sum((entry->>'amount')::numeric), 0)
		INTO v_sum_beneficiaries
	FROM jsonb_array_elements(p_beneficiary_amounts) AS entry;

	IF v_sum_beneficiaries > p_amount THEN
		RAISE EXCEPTION 'Somme des bénéficiaires (%) > montant (%)', v_sum_beneficiaries, p_amount;
	END IF;

	IF EXISTS (
		SELECT 1
		FROM jsonb_array_elements(p_beneficiary_amounts) AS entry
		WHERE COALESCE((entry->>'amount')::numeric, 0) <= 0
	) THEN
		RAISE EXCEPTION 'Chaque montant bénéficiaire doit être > 0';
	END IF;

	DELETE FROM public.paid_item_beneficiaries
	WHERE paid_item_instance_id = p_instance_id;

	INSERT INTO public.paid_item_beneficiaries (paid_item_instance_id, beneficiary_id, amount)
	SELECT
		p_instance_id,
		entry->>'beneficiaryId',
		(entry->>'amount')::numeric
	FROM jsonb_array_elements(p_beneficiary_amounts) AS entry;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_paid_item_atomic(
	text, numeric, date, text, text, text, text,
	public.transaction_type, boolean, boolean, boolean, boolean, boolean, text, jsonb, text
) TO authenticated;
