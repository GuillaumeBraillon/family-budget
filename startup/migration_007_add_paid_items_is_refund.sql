-- =====================================================
-- MIGRATION 007 : Ajout de paid_items.is_refund
-- =====================================================
-- Objectif : Persister explicitement la notion métier "remboursement"
-- sans dépendre uniquement d'heuristiques (type/category).

BEGIN;

-- 1) Ajout colonne
ALTER TABLE public.paid_items
ADD COLUMN IF NOT EXISTS is_refund boolean NOT NULL DEFAULT false;

-- 2) Backfill legacy (heuristique existante)
UPDATE public.paid_items pi
SET is_refund = true
WHERE pi.is_refund = false
  AND pi.type = 'INCOME'
  AND (
    pi.category = 'Dépenses'
    OR pi.category = 'Remboursement'
    OR EXISTS (
      SELECT 1
      FROM public.categories c
      WHERE c.name = pi.category
        AND c.type = 'EXPENSE'
    )
  );

-- 3) Révoquer ancienne signature RPC (sans p_is_refund)
REVOKE EXECUTE ON FUNCTION public.upsert_paid_item_with_tags(
  text, numeric, date, text, text, text, text,
  public.transaction_type, boolean, boolean, boolean, text, jsonb, jsonb
) FROM authenticated;

-- 4) Recréer la RPC avec p_is_refund
CREATE OR REPLACE FUNCTION public.upsert_paid_item_with_tags(
  p_instance_id         text,
  p_amount              numeric,
  p_payment_date        date,
  p_account_id          text,
  p_label               text,
  p_category            text,
  p_sub_category        text,
  p_type                public.transaction_type,
  p_is_variable         boolean,
  p_is_waiting          boolean,
  p_is_extra            boolean,
  p_is_refund           boolean,
  p_is_salary           boolean,
  p_comments            text,
  p_tag_amounts         jsonb DEFAULT NULL,
  p_beneficiary_amounts jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_sum_tags numeric := 0;
  v_sum_beneficiaries numeric := 0;
BEGIN
  IF p_instance_id IS NULL OR length(trim(p_instance_id)) = 0 THEN
    RAISE EXCEPTION 'instance_id requis';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'amount invalide : %', p_amount;
  END IF;

  IF p_beneficiary_amounts IS NULL
     OR jsonb_typeof(p_beneficiary_amounts) <> 'array'
     OR jsonb_array_length(p_beneficiary_amounts) = 0 THEN
    RAISE EXCEPTION 'p_beneficiary_amounts requis et doit contenir au moins 1 bénéficiaire';
  END IF;

  IF p_tag_amounts IS NOT NULL AND jsonb_typeof(p_tag_amounts) <> 'array' THEN
    RAISE EXCEPTION 'p_tag_amounts doit être un array JSON';
  END IF;

  INSERT INTO public.paid_items (
    instance_id,
    amount,
    payment_date,
    account_id,
    label,
    category,
    sub_category,
    type,
    is_variable,
    is_waiting,
    is_extra,
    is_refund,
    is_salary,
    comments
  ) VALUES (
    p_instance_id,
    p_amount,
    p_payment_date,
    p_account_id,
    p_label,
    p_category,
    p_sub_category,
    p_type,
    COALESCE(p_is_variable, false),
    COALESCE(p_is_waiting, false),
    COALESCE(p_is_extra, false),
    COALESCE(p_is_refund, false),
    COALESCE(p_is_salary, false),
    p_comments
  )
  ON CONFLICT (instance_id) DO UPDATE SET
    amount       = EXCLUDED.amount,
    payment_date = EXCLUDED.payment_date,
    account_id   = EXCLUDED.account_id,
    label        = EXCLUDED.label,
    category     = EXCLUDED.category,
    sub_category = EXCLUDED.sub_category,
    type         = EXCLUDED.type,
    is_variable  = EXCLUDED.is_variable,
    is_waiting   = EXCLUDED.is_waiting,
    is_extra     = EXCLUDED.is_extra,
    is_refund    = EXCLUDED.is_refund,
    is_salary    = EXCLUDED.is_salary,
    comments     = EXCLUDED.comments;

  IF p_tag_amounts IS NOT NULL THEN
    SELECT COALESCE(sum((entry->>'amount')::numeric), 0)
      INTO v_sum_tags
    FROM jsonb_array_elements(p_tag_amounts) AS entry;

    IF v_sum_tags > p_amount THEN
      RAISE EXCEPTION 'Somme des tags (%) > montant (%)', v_sum_tags, p_amount;
    END IF;

    IF EXISTS (
      SELECT 1
      FROM jsonb_array_elements(p_tag_amounts) AS entry
      WHERE COALESCE((entry->>'amount')::numeric, 0) <= 0
    ) THEN
      RAISE EXCEPTION 'Chaque montant de tag doit être > 0';
    END IF;

    DELETE FROM public.paid_item_tags
    WHERE paid_item_instance_id = p_instance_id;

    IF jsonb_array_length(p_tag_amounts) > 0 THEN
      INSERT INTO public.paid_item_tags (paid_item_instance_id, tag_id, amount, is_extra)
      SELECT
        p_instance_id,
        entry->>'tagId',
        (entry->>'amount')::numeric,
        COALESCE((entry->>'isExtra')::boolean, false)
      FROM jsonb_array_elements(p_tag_amounts) AS entry;
    END IF;
  END IF;

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

-- 5) Grant nouvelle signature
GRANT EXECUTE ON FUNCTION public.upsert_paid_item_with_tags(
  text, numeric, date, text, text, text, text,
  public.transaction_type, boolean, boolean, boolean, boolean, boolean, text, jsonb, jsonb
) TO authenticated;

COMMIT;