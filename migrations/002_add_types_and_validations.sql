-- =====================================================
-- MIGRATION: Types & Validations Base de Données
-- Phase 2 : Intégrité des Données
-- Date: 2026-01-06
-- Durée estimée: 2 heures
-- Risque: MOYEN (modifications structure)
-- Impact: Validation automatique + -20% espace
-- =====================================================

-- ⚠️ IMPORTANT : Exécutez cette migration étape par étape
-- Vérifiez chaque section avant de passer à la suivante

-- =====================================
-- ÉTAPE 1 : VÉRIFICATION PRÉ-MIGRATION
-- =====================================

-- Vérifier les valeurs actuelles des types (doivent correspondre aux ENUM futurs)
SELECT DISTINCT type FROM accounts ORDER BY type;
-- Attendu: COURANT, EPARGNE, VIREMENT

SELECT DISTINCT type FROM paid_items WHERE type IS NOT NULL ORDER BY type;
-- Attendu: EXPENSE, INCOME

SELECT DISTINCT type FROM categories ORDER BY type;
-- Attendu: EXPENSE, INCOME

SELECT DISTINCT period_type FROM app_settings ORDER BY period_type;
-- Attendu: FIXED_DAYS, CALENDAR_WEEKS, CUSTOM_SPLIT

-- Vérifier les valeurs nulles qui devraient être NOT NULL
SELECT 'expense_configs.account_id' as issue, COUNT(*) as nb_nulls
FROM expense_configs WHERE account_id IS NULL
UNION ALL
SELECT 'expense_configs.beneficiary_id', COUNT(*) 
FROM expense_configs WHERE beneficiary_id IS NULL
UNION ALL
SELECT 'expense_configs.day_of_month', COUNT(*) 
FROM expense_configs WHERE day_of_month IS NULL
UNION ALL
SELECT 'income_configs.account_id', COUNT(*) 
FROM income_configs WHERE account_id IS NULL
UNION ALL
SELECT 'paid_items.amount', COUNT(*) 
FROM paid_items WHERE amount IS NULL
UNION ALL
SELECT 'paid_items.payment_date', COUNT(*) 
FROM paid_items WHERE payment_date IS NULL;
-- Toutes ces lignes doivent retourner 0

-- Vérifier les valeurs invalides pour les contraintes CHECK
SELECT 'day_of_month hors range' as issue, COUNT(*) as nb_invalid
FROM expense_configs 
WHERE day_of_month IS NOT NULL AND (day_of_month < 1 OR day_of_month > 31)
UNION ALL
SELECT 'amount négatif expense_configs', COUNT(*)
FROM expense_configs WHERE amount < 0
UNION ALL
SELECT 'amount négatif income_configs', COUNT(*)
FROM income_configs WHERE amount < 0
UNION ALL
SELECT 'amount zero paid_items', COUNT(*)
FROM paid_items WHERE amount = 0
UNION ALL
SELECT 'target_ratio hors range', COUNT(*)
FROM accounts WHERE target_ratio IS NOT NULL AND (target_ratio < 0 OR target_ratio > 100);
-- Toutes ces lignes doivent retourner 0

-- ⚠️ SI DES VALEURS INVALIDES SONT TROUVÉES :
-- 1. Corrigez-les manuellement avant de continuer
-- 2. Ou commentez les contraintes correspondantes dans les étapes suivantes

-- =====================================
-- ÉTAPE 2 : CRÉATION DES TYPES ENUM
-- =====================================

-- Type de compte
CREATE TYPE account_type AS ENUM ('COURANT', 'EPARGNE', 'VIREMENT');

-- Type de transaction
CREATE TYPE transaction_type AS ENUM ('EXPENSE', 'INCOME');

-- Type de période budgétaire
CREATE TYPE period_type AS ENUM ('FIXED_DAYS', 'CALENDAR_WEEKS', 'CUSTOM_SPLIT');

-- =====================================
-- ÉTAPE 3 : MIGRATION PROGRESSIVE DES COLONNES
-- =====================================

-- 3.1. Table ACCOUNTS
-- Ajouter nouvelle colonne ENUM
ALTER TABLE accounts ADD COLUMN type_new account_type;

-- Migrer les données
UPDATE accounts SET type_new = type::account_type;

-- Vérifier la migration
SELECT type, type_new, COUNT(*) FROM accounts GROUP BY type, type_new;
-- Les deux colonnes doivent avoir les mêmes valeurs

-- Supprimer l'ancienne colonne et renommer
ALTER TABLE accounts DROP COLUMN type;
ALTER TABLE accounts RENAME COLUMN type_new TO type;
ALTER TABLE accounts ALTER COLUMN type SET NOT NULL;

-- 3.2. Table PAID_ITEMS
ALTER TABLE paid_items ADD COLUMN type_new transaction_type;
UPDATE paid_items SET type_new = type::transaction_type WHERE type IS NOT NULL;
-- Vérification
SELECT type, type_new, COUNT(*) FROM paid_items GROUP BY type, type_new;
-- Suppression et renommage
ALTER TABLE paid_items DROP COLUMN type;
ALTER TABLE paid_items RENAME COLUMN type_new TO type;
-- Note: Ne pas mettre NOT NULL car peut être NULL pour certains records

-- 3.3. Table CATEGORIES
ALTER TABLE categories ADD COLUMN type_new transaction_type;
UPDATE categories SET type_new = type::transaction_type WHERE type IS NOT NULL;
-- Vérification
SELECT type, type_new, COUNT(*) FROM categories GROUP BY type, type_new;
-- Suppression et renommage
ALTER TABLE categories DROP COLUMN type;
ALTER TABLE categories RENAME COLUMN type_new TO type;

-- 3.4. Table APP_SETTINGS
ALTER TABLE app_settings ADD COLUMN period_type_new period_type;
UPDATE app_settings SET period_type_new = period_type::period_type;
-- Vérification
SELECT period_type, period_type_new, COUNT(*) FROM app_settings GROUP BY period_type, period_type_new;
-- Suppression et renommage
ALTER TABLE app_settings DROP COLUMN period_type;
ALTER TABLE app_settings RENAME COLUMN period_type_new TO period_type;
ALTER TABLE app_settings ALTER COLUMN period_type SET NOT NULL;

-- =====================================
-- ÉTAPE 4 : CONTRAINTES NOT NULL
-- =====================================

-- Expense Configs
ALTER TABLE expense_configs ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE expense_configs ALTER COLUMN beneficiary_id SET NOT NULL;
ALTER TABLE expense_configs ALTER COLUMN day_of_month SET NOT NULL;
ALTER TABLE expense_configs ALTER COLUMN label SET NOT NULL;
ALTER TABLE expense_configs ALTER COLUMN amount SET NOT NULL;
ALTER TABLE expense_configs ALTER COLUMN category SET NOT NULL;

-- Income Configs
ALTER TABLE income_configs ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE income_configs ALTER COLUMN beneficiary_id SET NOT NULL;
ALTER TABLE income_configs ALTER COLUMN day_of_month SET NOT NULL;
ALTER TABLE income_configs ALTER COLUMN label SET NOT NULL;
ALTER TABLE income_configs ALTER COLUMN amount SET NOT NULL;
ALTER TABLE income_configs ALTER COLUMN category SET NOT NULL;

-- Paid Items (seulement les colonnes critiques)
ALTER TABLE paid_items ALTER COLUMN amount SET NOT NULL;
ALTER TABLE paid_items ALTER COLUMN payment_date SET NOT NULL;
ALTER TABLE paid_items ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE paid_items ALTER COLUMN label SET NOT NULL;
ALTER TABLE paid_items ALTER COLUMN category SET NOT NULL;

-- Transfers
ALTER TABLE transfers ALTER COLUMN source_account_id SET NOT NULL;
ALTER TABLE transfers ALTER COLUMN destination_account_id SET NOT NULL;
ALTER TABLE transfers ALTER COLUMN amount SET NOT NULL;
ALTER TABLE transfers ALTER COLUMN date SET NOT NULL;
ALTER TABLE transfers ALTER COLUMN label SET NOT NULL;

-- Accounts
ALTER TABLE accounts ALTER COLUMN name SET NOT NULL;
ALTER TABLE accounts ALTER COLUMN owner_id SET NOT NULL;

-- People
ALTER TABLE people ALTER COLUMN name SET NOT NULL;

-- =====================================
-- ÉTAPE 5 : CONTRAINTES CHECK
-- =====================================

-- Jour du mois valide (1-31)
ALTER TABLE expense_configs 
  ADD CONSTRAINT check_day_of_month_valid 
  CHECK (day_of_month BETWEEN 1 AND 31);

ALTER TABLE income_configs 
  ADD CONSTRAINT check_day_of_month_valid 
  CHECK (day_of_month BETWEEN 1 AND 31);

-- Montants positifs (sauf paid_items qui peut avoir des remboursements négatifs)
ALTER TABLE expense_configs 
  ADD CONSTRAINT check_amount_positive 
  CHECK (amount > 0);

ALTER TABLE income_configs 
  ADD CONSTRAINT check_amount_positive 
  CHECK (amount > 0);

-- Paid Items : Autoriser les remboursements (montants négatifs)
-- mais interdire les montants nuls
ALTER TABLE paid_items 
  ADD CONSTRAINT check_amount_not_zero 
  CHECK (amount != 0);

ALTER TABLE transfers 
  ADD CONSTRAINT check_amount_positive 
  CHECK (amount > 0);

-- Ratio de répartition valide (0-100%)
ALTER TABLE accounts 
  ADD CONSTRAINT check_target_ratio_valid 
  CHECK (target_ratio IS NULL OR (target_ratio >= 0 AND target_ratio <= 100));

-- Pas de virement vers soi-même
ALTER TABLE transfers 
  ADD CONSTRAINT check_no_self_transfer 
  CHECK (source_account_id != destination_account_id);

-- Période budgétaire valide
ALTER TABLE app_settings 
  ADD CONSTRAINT check_period_value_positive 
  CHECK (period_value > 0);

-- Format des mois (YYYY-MM)
ALTER TABLE expense_configs 
  ADD CONSTRAINT check_month_format_start 
  CHECK (start_month IS NULL OR start_month ~ '^\d{4}-\d{2}$');

ALTER TABLE expense_configs 
  ADD CONSTRAINT check_month_format_end 
  CHECK (end_month IS NULL OR end_month ~ '^\d{4}-\d{2}$');

ALTER TABLE income_configs 
  ADD CONSTRAINT check_month_format_start 
  CHECK (start_month IS NULL OR start_month ~ '^\d{4}-\d{2}$');

ALTER TABLE income_configs 
  ADD CONSTRAINT check_month_format_end 
  CHECK (end_month IS NULL OR end_month ~ '^\d{4}-\d{2}$');

-- Cohérence start_month < end_month
ALTER TABLE expense_configs 
  ADD CONSTRAINT check_month_order 
  CHECK (start_month IS NULL OR end_month IS NULL OR start_month <= end_month);

ALTER TABLE income_configs 
  ADD CONSTRAINT check_month_order 
  CHECK (start_month IS NULL OR end_month IS NULL OR start_month <= end_month);

-- =====================================
-- ÉTAPE 6 : ANALYSE DES TABLES
-- =====================================

ANALYZE accounts;
ANALYZE expense_configs;
ANALYZE income_configs;
ANALYZE paid_items;
ANALYZE transfers;
ANALYZE app_settings;
ANALYZE categories;

-- =====================================
-- VÉRIFICATION POST-MIGRATION
-- =====================================

-- Lister toutes les contraintes ajoutées
SELECT 
  conname as constraint_name,
  conrelid::regclass as table_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conname LIKE 'check_%'
  AND connamespace = 'public'::regnamespace
ORDER BY conrelid::regclass::text, conname;

-- Lister les types ENUM créés
SELECT 
  t.typname as enum_name,
  array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typnamespace = 'public'::regnamespace
GROUP BY t.typname
ORDER BY t.typname;

-- =====================================
-- ROLLBACK (si problème)
-- =====================================

/*
-- Supprimer toutes les contraintes CHECK
ALTER TABLE expense_configs DROP CONSTRAINT IF EXISTS check_day_of_month_valid;
ALTER TABLE expense_configs DROP CONSTRAINT IF EXISTS check_amount_positive;
ALTER TABLE expense_configs DROP CONSTRAINT IF EXISTS check_month_format_start;
ALTER TABLE expense_configs DROP CONSTRAINT IF EXISTS check_month_format_end;
ALTER TABLE expense_configs DROP CONSTRAINT IF EXISTS check_month_order;

ALTER TABLE income_configs DROP CONSTRAINT IF EXISTS check_day_of_month_valid;
ALTER TABLE income_configs DROP CONSTRAINT IF EXISTS check_amount_positive;
ALTER TABLE income_configs DROP CONSTRAINT IF EXISTS check_month_format_start;
ALTER TABLE income_configs DROP CONSTRAINT IF EXISTS check_month_format_end;
ALTER TABLE income_configs DROP CONSTRAINT IF EXISTS check_month_order;

ALTER TABLE paid_items DROP CONSTRAINT IF EXISTS check_amount_positive;
ALTER TABLE transfers DROP CONSTRAINT IF EXISTS check_amount_positive;
ALTER TABLE transfers DROP CONSTRAINT IF EXISTS check_no_self_transfer;
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS check_target_ratio_valid;
ALTER TABLE app_settings DROP CONSTRAINT IF EXISTS check_period_value_positive;

-- Revenir aux types TEXT (migration inverse)
-- ⚠️ Plus complexe, nécessite recréer les colonnes
*/

-- =====================================
-- NOTES D'IMPLÉMENTATION
-- =====================================

/*
DÉPLOIEMENT RECOMMANDÉ :

1. ⚠️ BACKUP OBLIGATOIRE cette fois :
   pg_dump $DATABASE_URL > backup_avant_phase2.sql

2. Exécution PROGRESSIVE :
   - Exécuter ÉTAPE 1 (vérifications)
   - Corriger les problèmes détectés
   - Exécuter ÉTAPE 2 (ENUM)
   - Exécuter ÉTAPE 3 (migration colonnes) UNE TABLE À LA FOIS
   - Tester l'app après chaque table
   - Exécuter ÉTAPES 4-5 (contraintes)
   - Vérifier l'app complète

3. En cas d'erreur :
   - Noter la ligne qui échoue
   - Corriger les données manuellement
   - Ou commenter la contrainte problématique
   - Continuer avec les autres

4. Tests à faire après migration :
   - Créer une nouvelle dépense
   - Créer un nouveau revenu
   - Pointer une opération
   - Créer un virement
   - Vérifier que les formulaires fonctionnent

5. Bénéfices immédiats :
   - Impossible d'insérer des données invalides
   - Meilleure compréhension du schéma
   - Économie d'espace (~20% sur les index)
   - Requêtes WHERE sur ENUM plus rapides
*/
