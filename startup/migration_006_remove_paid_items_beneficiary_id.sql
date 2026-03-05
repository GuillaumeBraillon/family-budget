-- =====================================================
-- MIGRATION 006 : Suppression paid_items.beneficiary_id
-- =====================================================
-- Problème : Double stockage du bénéficiaire
--   - paid_items.beneficiary_id    → colonne scalaire LEGACY
--   - paid_item_beneficiaries      → table relationnelle (source de vérité)
--
-- Objectif : Aligner paid_items sur le même modèle que paid_item_tags
--   (aucune colonne bénéficiaire sur paid_items, tout dans la table dédiée)
--
-- Impact :
--   - RPC upsert_paid_item_with_tags : retire p_beneficiary_id,
--     rend p_beneficiary_amounts obligatoire (min 1 entrée)
--   - Aucune perte de données : migration préalable des lignes orphelines
--
-- Exécution : Supabase Dashboard → SQL Editor → Run
-- =====================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- ÉTAPE 1 : Migrer les données legacy
-- Pour chaque paid_item ayant un beneficiary_id mais SANS entrée dans
-- paid_item_beneficiaries, on crée l'entrée correspondante.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO paid_item_beneficiaries (id, paid_item_instance_id, beneficiary_id, amount)
SELECT
  gen_random_uuid()::text,
  pi.instance_id,
  pi.beneficiary_id,
  ABS(pi.amount)   -- amount_check exige > 0 ; le signe est porté par paid_items.type
FROM paid_items pi
WHERE pi.beneficiary_id IS NOT NULL
  AND pi.beneficiary_id <> ''
  AND pi.amount <> 0          -- amount_check exige > 0 ; on ignore les items à montant nul
  AND NOT EXISTS (
    SELECT 1
    FROM paid_item_beneficiaries pib
    WHERE pib.paid_item_instance_id = pi.instance_id
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- ÉTAPE 2 : Vérification de complétude (lève une exception si migration KO)
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_orphan_count integer;
BEGIN
  SELECT COUNT(*)
  INTO v_orphan_count
  FROM paid_items pi
  WHERE pi.beneficiary_id IS NOT NULL
    AND pi.beneficiary_id <> ''
    AND pi.amount <> 0
    AND NOT EXISTS (
      SELECT 1
      FROM paid_item_beneficiaries pib
      WHERE pib.paid_item_instance_id = pi.instance_id
    );

  IF v_orphan_count > 0 THEN
    RAISE EXCEPTION
      'Migration incomplète : % paid_item(s) sans entrée dans paid_item_beneficiaries. Rollback.',
      v_orphan_count;
  END IF;

  RAISE NOTICE 'Vérification OK : 0 paid_item orphelin.';
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- ÉTAPE 3 : Supprimer la colonne redondante + index associé
-- ─────────────────────────────────────────────────────────────────────────────

DROP INDEX IF EXISTS idx_paid_items_beneficiary;

ALTER TABLE paid_items DROP COLUMN IF EXISTS beneficiary_id;

-- ─────────────────────────────────────────────────────────────────────────────
-- ÉTAPE 4 : Révoquer l'ancienne RPC (signature différente à cause du retrait
--           du paramètre p_beneficiary_id)
-- ─────────────────────────────────────────────────────────────────────────────

REVOKE EXECUTE ON FUNCTION public.upsert_paid_item_with_tags(
  text, numeric, date, text, text, text, text, text,
  public.transaction_type, boolean, boolean, boolean, text, jsonb, jsonb
) FROM authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- ÉTAPE 5 : Recréer la RPC sans p_beneficiary_id
--           p_beneficiary_amounts devient obligatoire (min 1 entrée)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.upsert_paid_item_with_tags(
  p_instance_id        text,
  p_amount             numeric,
  p_payment_date       date,
  p_account_id         text,
  p_label              text,
  p_category           text,
  p_sub_category       text,
  p_type               public.transaction_type,
  p_is_variable        boolean,
  p_is_waiting         boolean,
  p_is_extra           boolean,
  p_comments           text,
  p_tag_amounts        jsonb DEFAULT NULL,
  p_beneficiary_amounts jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_sum_tags           numeric := 0;
  v_sum_beneficiaries  numeric := 0;
BEGIN
  -- ── Validations ──────────────────────────────────────────────────────────

  IF p_instance_id IS NULL OR length(trim(p_instance_id)) = 0 THEN
    RAISE EXCEPTION 'instance_id requis';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'amount invalide : %', p_amount;
  END IF;

  -- p_beneficiary_amounts est maintenant obligatoire (min 1 entrée)
  IF p_beneficiary_amounts IS NULL
     OR jsonb_typeof(p_beneficiary_amounts) <> 'array'
     OR jsonb_array_length(p_beneficiary_amounts) = 0 THEN
    RAISE EXCEPTION 'p_beneficiary_amounts requis et doit contenir au moins 1 bénéficiaire';
  END IF;

  IF p_tag_amounts IS NOT NULL AND jsonb_typeof(p_tag_amounts) <> 'array' THEN
    RAISE EXCEPTION 'p_tag_amounts doit être un array JSON';
  END IF;

  -- ── Upsert paid_item (sans colonne beneficiary_id) ───────────────────────

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
    comments     = EXCLUDED.comments;

  -- ── Tags (optionnels) ─────────────────────────────────────────────────────

  IF p_tag_amounts IS NOT NULL THEN
    SELECT COALESCE(sum((entry->>'amount')::numeric), 0)
      INTO v_sum_tags
    FROM jsonb_array_elements(p_tag_amounts) AS entry;

    IF v_sum_tags > p_amount THEN
      RAISE EXCEPTION 'Somme des tags (%) > montant (%)', v_sum_tags, p_amount;
    END IF;

    IF EXISTS (
      SELECT 1 FROM jsonb_array_elements(p_tag_amounts) AS entry
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

  -- ── Bénéficiaires (obligatoire, min 1) ───────────────────────────────────

  SELECT COALESCE(sum((entry->>'amount')::numeric), 0)
    INTO v_sum_beneficiaries
  FROM jsonb_array_elements(p_beneficiary_amounts) AS entry;

  IF v_sum_beneficiaries > p_amount THEN
    RAISE EXCEPTION 'Somme des bénéficiaires (%) > montant (%)', v_sum_beneficiaries, p_amount;
  END IF;

  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_beneficiary_amounts) AS entry
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

GRANT EXECUTE ON FUNCTION public.upsert_paid_item_with_tags(
  text, numeric, date, text, text, text, text,
  public.transaction_type, boolean, boolean, boolean, text, jsonb, jsonb
) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- ÉTAPE 6 : Vérification finale
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_total_items        integer;
  v_items_with_benef   integer;
  v_coverage_pct       numeric;
BEGIN
  SELECT COUNT(*) INTO v_total_items FROM paid_items;
  SELECT COUNT(DISTINCT paid_item_instance_id) INTO v_items_with_benef FROM paid_item_beneficiaries;

  IF v_total_items > 0 THEN
    v_coverage_pct := round((v_items_with_benef::numeric / v_total_items) * 100, 1);
    RAISE NOTICE 'Couverture paid_item_beneficiaries : %/% paid_items (% %%)', v_items_with_benef, v_total_items, v_coverage_pct;
    IF v_coverage_pct < 100 THEN
      RAISE WARNING '% paid_item(s) sans bénéficiaire (opérations "Virement Interne" ou sans bénéficiaire configuré)',
        v_total_items - v_items_with_benef;
    END IF;
  ELSE
    RAISE NOTICE 'Aucun paid_item en base (DB vide).';
  END IF;
END;
$$;

COMMIT;
