-- =====================================================
-- MIGRATION 009 : Ajouter budget variable Famille mensuel
-- =====================================================
-- Objectif : Introduire un montant mensuel configurable
-- pour le budget variable ventilé sur le bénéficiaire Famille.

BEGIN;

ALTER TABLE public.app_settings
ADD COLUMN IF NOT EXISTS family_variable_budget numeric NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'app_settings_family_variable_budget_check'
  ) THEN
    ALTER TABLE public.app_settings
    ADD CONSTRAINT app_settings_family_variable_budget_check
    CHECK (family_variable_budget >= 0);
  END IF;
END $$;

INSERT INTO public.app_settings (id, personal_budget_amount, family_variable_budget, period_type, period_value, operations_sorting, accounts_sorting)
VALUES ('global', 350, 0, 'FIXED_DAYS', 7, '{}', '{}')
ON CONFLICT (id) DO NOTHING;

UPDATE public.app_settings
SET family_variable_budget = COALESCE(family_variable_budget, 0)
WHERE family_variable_budget IS NULL;

COMMIT;
