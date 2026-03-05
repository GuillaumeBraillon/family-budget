-- =====================================================
-- SCHÉMA COMPLET - FAMILY BUDGET
-- Base de données PostgreSQL pour Supabase
-- Version: 2.0.0
-- Date: 2026-01-07
-- =====================================================

-- =====================================
-- 0. EXTENSIONS
-- =====================================

CREATE EXTENSION IF NOT EXISTS pg_trgm; -- Recherche full-text

-- =====================================
-- 1. TABLES PRINCIPALES
-- =====================================

-- Table: people
-- Membres du foyer
CREATE TABLE IF NOT EXISTS people (
  id text PRIMARY KEY,
  name text NOT NULL,
  is_child boolean DEFAULT false NOT NULL
);

-- Table: accounts
-- Comptes bancaires (courants, épargne)
CREATE TABLE IF NOT EXISTS accounts (
  id text PRIMARY KEY,
  name text NOT NULL,
  owner_id text NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  current_balance numeric DEFAULT 0 NOT NULL,
  bank_name text,
  target_ratio numeric CHECK (target_ratio IS NULL OR (target_ratio >= 0 AND target_ratio <= 100)),
  target_cap numeric CHECK (target_cap IS NULL OR target_cap > 0),
  is_joint boolean DEFAULT false NOT NULL,
  type text NOT NULL CHECK (type IN ('COURANT', 'EPARGNE', 'VIREMENT'))
);

-- Table: categories
-- Catégories de dépenses/revenus (structure relationnelle via sub_categories)
CREATE TABLE IF NOT EXISTS categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('EXPENSE', 'INCOME'))
);

-- Table: sub_categories
-- Sous-catégories liées aux catégories principales
CREATE TABLE IF NOT EXISTS sub_categories (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL,
  category_id text NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT unique_sub_category UNIQUE(category_id, name)
);

-- Table: tags
-- Tags pour catégorisation avancée
CREATE TABLE IF NOT EXISTS tags (
  id text PRIMARY KEY,
  name text NOT NULL,
  color text NOT NULL
);

-- Table: authorized_users
-- Whitelist des utilisateurs autorisés
CREATE TABLE IF NOT EXISTS authorized_users (
  email text PRIMARY KEY,
  name text,
  added_at timestamptz DEFAULT now(),
  added_by text,
  notes text,
  avatar_url text,
  last_login_at timestamptz,
  is_allowed boolean DEFAULT false NOT NULL
);

-- Table: app_settings
-- Paramètres globaux de l'application
CREATE TABLE IF NOT EXISTS app_settings (
  id text PRIMARY KEY,
  personal_budget_amount numeric DEFAULT 350 NOT NULL CHECK (personal_budget_amount >= 0),
  family_variable_budget numeric DEFAULT 0 NOT NULL CHECK (family_variable_budget >= 0),
  period_value integer DEFAULT 4 NOT NULL CHECK (period_value > 0),
  period_type text DEFAULT 'FIXED_DAYS' NOT NULL CHECK (period_type IN ('FIXED_DAYS', 'CALENDAR_WEEKS', 'CUSTOM_SPLIT')),
  operations_sorting text[] NOT NULL DEFAULT '{}',
  accounts_sorting text[] NOT NULL DEFAULT '{}'
);

-- Table: saved_labels
-- Libellés suggérés pour la saisie rapide avec association catégorie
CREATE TABLE IF NOT EXISTS saved_labels (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL UNIQUE,
  type text NOT NULL,
  is_expense boolean DEFAULT true NOT NULL,
  category_id text REFERENCES categories(id) ON DELETE SET NULL,
  sub_category_id text REFERENCES sub_categories(id) ON DELETE SET NULL,
  account_id text REFERENCES accounts(id) ON DELETE SET NULL,
  beneficiary_id text REFERENCES people(id) ON DELETE SET NULL
);

-- Table: expense_configs
-- Modèles de dépenses récurrentes
CREATE TABLE IF NOT EXISTS expense_configs (
  id text PRIMARY KEY,
  label text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  category text NOT NULL,
  sub_category text,
  beneficiary_id text NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  account_id text NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  day_of_month integer NOT NULL CHECK (day_of_month >= 1 AND day_of_month <= 31),
  start_month text, -- Format: YYYY-MM
  end_month text,   -- Format: YYYY-MM
  is_extra boolean DEFAULT false NOT NULL
);

-- Table: income_configs
-- Modèles de revenus récurrents
CREATE TABLE IF NOT EXISTS income_configs (
  id text PRIMARY KEY,
  label text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  account_id text NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  day_of_month integer NOT NULL CHECK (day_of_month >= 1 AND day_of_month <= 31),
  category text NOT NULL,
  beneficiary_id text NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  sub_category text,
  is_extra boolean DEFAULT false NOT NULL,
  is_salary boolean DEFAULT false NOT NULL,
  start_month text, -- Format: YYYY-MM
  end_month text    -- Format: YYYY-MM
);

-- Table: paid_items
-- Opérations pointées (récurrentes + variables)
-- Note: le bénéficiaire n'est PAS stocké ici — il est dans paid_item_beneficiaries
--       (même modèle que paid_item_tags, pas de colonne scalaire redondante)
CREATE TABLE IF NOT EXISTS paid_items (
  id text DEFAULT gen_random_uuid()::text, -- ID technique (compatibilité)
  instance_id text PRIMARY KEY,
  amount numeric NOT NULL,
  payment_date date NOT NULL,
  account_id text NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  label text NOT NULL,
  category text NOT NULL,
  sub_category text,
  is_variable boolean DEFAULT false NOT NULL,
  is_extra boolean DEFAULT false NOT NULL,
  is_refund boolean DEFAULT false NOT NULL,
  is_salary boolean DEFAULT false NOT NULL,
  is_waiting boolean DEFAULT false NOT NULL,
  comments text,
  position bigint DEFAULT 0,
  type text NOT NULL CHECK (type IN ('EXPENSE', 'INCOME'))
);

-- Table: paid_item_tags
-- Ventilation des montants par tag (Système v2.0)
CREATE TABLE IF NOT EXISTS paid_item_tags (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  paid_item_instance_id text NOT NULL REFERENCES paid_items(instance_id) ON DELETE CASCADE,
  tag_id text NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  is_extra boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT unique_paid_item_tag UNIQUE(paid_item_instance_id, tag_id)
);

-- Table: paid_item_beneficiaries
-- Ventilation des montants par bénéficiaire
CREATE TABLE IF NOT EXISTS paid_item_beneficiaries (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  paid_item_instance_id text NOT NULL REFERENCES paid_items(instance_id) ON DELETE CASCADE,
  beneficiary_id text NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  created_at timestamptz DEFAULT now(),

  CONSTRAINT unique_paid_item_beneficiary UNIQUE(paid_item_instance_id, beneficiary_id)
);

-- Table: transfers
-- Virements internes entre comptes
CREATE TABLE IF NOT EXISTS transfers (
  id text PRIMARY KEY,
  date date NOT NULL,
  label text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  source_account_id text NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  destination_account_id text NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  position bigint DEFAULT 0,
  
  CONSTRAINT no_self_transfer CHECK (source_account_id != destination_account_id)
);

-- =====================================
-- 2. INDEX DE PERFORMANCE
-- =====================================

-- Index sur les clés étrangères (PostgreSQL ne les crée pas automatiquement)
CREATE INDEX IF NOT EXISTS idx_accounts_owner ON accounts(owner_id);
CREATE INDEX IF NOT EXISTS idx_expense_configs_beneficiary ON expense_configs(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_expense_configs_account ON expense_configs(account_id);
CREATE INDEX IF NOT EXISTS idx_income_configs_account ON income_configs(account_id);
CREATE INDEX IF NOT EXISTS idx_income_configs_beneficiary ON income_configs(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_paid_items_account ON paid_items(account_id);
CREATE INDEX IF NOT EXISTS idx_transfers_source ON transfers(source_account_id);
CREATE INDEX IF NOT EXISTS idx_transfers_dest ON transfers(destination_account_id);
CREATE INDEX IF NOT EXISTS idx_paid_item_tags_instance ON paid_item_tags(paid_item_instance_id);
CREATE INDEX IF NOT EXISTS idx_paid_item_tags_tag ON paid_item_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_paid_item_beneficiaries_instance ON paid_item_beneficiaries(paid_item_instance_id);
CREATE INDEX IF NOT EXISTS idx_paid_item_beneficiaries_beneficiary ON paid_item_beneficiaries(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_sub_categories_category ON sub_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_saved_labels_category ON saved_labels(category_id);
CREATE INDEX IF NOT EXISTS idx_saved_labels_sub_category ON saved_labels(sub_category_id);

-- Index sur les colonnes de tri (drag & drop)
CREATE INDEX IF NOT EXISTS idx_paid_items_position ON paid_items(position);
CREATE INDEX IF NOT EXISTS idx_transfers_position ON transfers(position);

-- Index composite optimisé pour le planner mensuel
CREATE INDEX IF NOT EXISTS idx_paid_items_planner 
  ON paid_items(payment_date, account_id, is_waiting)
  INCLUDE (position, amount, type, label, category);

-- Index pour tri chronologique
CREATE INDEX IF NOT EXISTS idx_transfers_date ON transfers(date DESC);
CREATE INDEX IF NOT EXISTS idx_paid_items_date ON paid_items(payment_date DESC);

-- Index pour filtres spécifiques
CREATE INDEX IF NOT EXISTS idx_authorized_users_allowed ON authorized_users(is_allowed) WHERE is_allowed = false;
CREATE INDEX IF NOT EXISTS idx_paid_item_tags_is_extra ON paid_item_tags(is_extra);

-- Index de recherche full-text (ILIKE)
CREATE INDEX IF NOT EXISTS idx_expense_configs_label_trgm ON expense_configs USING gin(label gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_income_configs_label_trgm ON income_configs USING gin(label gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_paid_items_label_trgm ON paid_items USING gin(label gin_trgm_ops);

-- =====================================
-- 3. ROW LEVEL SECURITY (RLS)
-- =====================================

-- Activation RLS sur toutes les tables
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE authorized_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE paid_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE paid_item_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE paid_item_beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;

-- Politique par défaut : Tous les utilisateurs authentifiés peuvent tout faire
-- Note: Adapter ces politiques selon vos besoins de sécurité

CREATE POLICY "Enable all for authenticated users" ON people
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON accounts
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON categories
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON sub_categories
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON tags
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON authorized_users
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON app_settings
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON saved_labels
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON expense_configs
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON income_configs
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON paid_items
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON paid_item_tags
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON paid_item_beneficiaries
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable all for authenticated users" ON transfers
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- =====================================
-- 3.1 FONCTIONS RPC TRANSACTIONNELLES
-- =====================================

-- Fonction RPC: upsert paid_item + remplacement atomique des tags et bénéficiaires
-- Note: p_beneficiary_id supprimé (migration 006) — tout passe par p_beneficiary_amounts
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
    RAISE EXCEPTION 'amount invalide: %', p_amount;
  END IF;

  -- p_beneficiary_amounts obligatoire (min 1 entrée)
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
      INSERT INTO public.paid_item_tags (
        paid_item_instance_id,
        tag_id,
        amount,
        is_extra
      )
      SELECT
        p_instance_id,
        entry->>'tagId',
        (entry->>'amount')::numeric,
        COALESCE((entry->>'isExtra')::boolean, false)
      FROM jsonb_array_elements(p_tag_amounts) AS entry;
    END IF;
  END IF;

  -- Bénéficiaires (déjà validés ci-dessus : non NULL, array, min 1 entrée)
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

GRANT EXECUTE ON FUNCTION public.upsert_paid_item_with_tags(
  text, numeric, date, text, text, text, text,
  public.transaction_type, boolean, boolean, boolean, boolean, boolean, text, jsonb, jsonb
) TO authenticated;

-- =====================================
-- 4. COMMENTAIRES DE DOCUMENTATION
-- =====================================

COMMENT ON TABLE people IS 'Membres du foyer (famille)';
COMMENT ON TABLE accounts IS 'Comptes bancaires (courants, épargne)';
COMMENT ON TABLE categories IS 'Catégories hiérarchiques pour les dépenses/revenus (structure relationnelle via sub_categories)';
COMMENT ON TABLE sub_categories IS 'Sous-catégories liées aux catégories principales avec contrainte d''unicité par catégorie';
COMMENT ON TABLE tags IS 'Tags pour catégorisation avancée et filtrage';
COMMENT ON TABLE authorized_users IS 'Whitelist des utilisateurs autorisés à accéder à l''application';
COMMENT ON TABLE app_settings IS 'Paramètres globaux de l''application (budget personnel, périodes de découpage)';
COMMENT ON TABLE saved_labels IS 'Libellés pré-enregistrés avec association catégorie/sous-catégorie pour auto-suggestion';

COMMENT ON COLUMN saved_labels.category_id IS 'Catégorie suggérée pour auto-complétion (optionnel)';
COMMENT ON COLUMN saved_labels.sub_category_id IS 'Sous-catégorie suggérée pour auto-complétion (optionnel)';
COMMENT ON COLUMN saved_labels.account_id IS 'Compte suggéré pour auto-complétion (optionnel)';
COMMENT ON COLUMN saved_labels.beneficiary_id IS 'Bénéficiaire suggéré pour auto-complétion (optionnel)';
COMMENT ON TABLE expense_configs IS 'Modèles de dépenses récurrentes (loyer, abonnements, etc.)';
COMMENT ON TABLE income_configs IS 'Modèles de revenus récurrents (salaires, etc.)';
COMMENT ON TABLE paid_items IS 'Opérations réelles pointées (récurrentes + variables)';
COMMENT ON TABLE paid_item_tags IS 'Ventilation des montants par tag pour analyse granulaire';
COMMENT ON TABLE paid_item_beneficiaries IS 'Ventilation des montants par bénéficiaire pour calculs budgétaires';
COMMENT ON TABLE transfers IS 'Virements internes entre comptes (ne comptent pas dans le budget)';

COMMENT ON COLUMN paid_item_tags.amount IS 'Montant affecté à ce tag pour cette opération';
COMMENT ON COLUMN paid_item_tags.is_extra IS 'Indique si ce montant de tag est hors budget (Extra au niveau tag)';
COMMENT ON COLUMN people.is_child IS 'Les enfants sont exclus des calculs d''équité';
COMMENT ON COLUMN income_configs.is_salary IS 'Identifie les revenus structurels (salaires) pour les calculs';
COMMENT ON COLUMN accounts.target_ratio IS 'Ratio cible du budget mensuel (0-100%) pour ce compte';
COMMENT ON COLUMN accounts.target_cap IS 'Plafond maximal du solde pour l''épargne automatique';

-- =====================================
-- 5. ANALYSE DES TABLES
-- =====================================

-- Mise à jour des statistiques pour l'optimiseur de requêtes PostgreSQL
ANALYZE people;
ANALYZE accounts;
ANALYZE categories;
ANALYZE sub_categories;
ANALYZE tags;
ANALYZE authorized_users;
ANALYZE app_settings;
ANALYZE saved_labels;
ANALYZE expense_configs;
ANALYZE income_configs;
ANALYZE paid_items;
ANALYZE paid_item_tags;
ANALYZE paid_item_beneficiaries;
ANALYZE transfers;

-- =====================================
-- NOTES D'IMPLÉMENTATION
-- =====================================

/*
DÉPLOIEMENT :

1. Sur Supabase Dashboard :
   - Aller dans SQL Editor
   - Créer une nouvelle query
   - Copier-coller ce fichier complet
   - Exécuter

2. Vérification :
   - Toutes les tables doivent apparaître dans Table Editor
   - RLS doit être activé (icône bouclier vert)
   - Les index doivent être listés dans les métadonnées

3. Configuration Auth :
   - Activer Google Auth dans Authentication > Providers
   - Configurer les Redirect URLs

4. Données initiales (optionnel) :
   - Insérer un enregistrement dans app_settings (id='global')
   - Créer quelques catégories par défaut

MIGRATIONS FUTURES :

Ce schéma inclut déjà toutes les migrations jusqu'à v2.6.5 :
- 001_add_critical_indexes.sql : Index de performance
- 002_add_types_and_validations.sql : Contraintes et validations
- 003_add_tag_amounts.sql : Système de ventilation par tags
- 004_refactor_categories_to_relational.sql : Structure relationnelle sous-catégories
- 005_finalize_relational_structure.sql : Suppression colonnes obsolètes + saved_labels

Les ajouts récents (tri manuel + RPC transactionnelle tags) sont désormais intégrés directement
dans ce schéma complet pour faciliter les déploiements manuels sans rejouer les migrations.

Pour les futures modifications, créer de nouvelles migrations numérotées
dans le dossier migrations/ et les documenter dans CHANGELOG.md.
*/
