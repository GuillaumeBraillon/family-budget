-- =====================================================
-- NETTOYAGE DES DONNÉES ANTÉRIEURES AU 01/01/2026
-- À exécuter dans l'éditeur SQL Supabase
-- Supabase > SQL Editor > New Query
--
-- ⚠️  IRRÉVERSIBLE : Faire une sauvegarde avant exécution
--
-- Effet :
--   - Supprime tous les paid_items (+ tags + bénéficiaires) avant 2026
--   - Supprime tous les virements (transfers) avant 2026
--   - Remet à zéro le carryover accumulé depuis les années précédentes
--   - Les configs (expense_configs, income_configs) ne sont PAS touchées
--   - Les comptes, personnes, catégories ne sont PAS touchés
-- =====================================================

BEGIN;

-- 1. Supprimer les paid_items antérieurs au 01/01/2026
--    (paid_item_tags et paid_item_beneficiaries supprimés en CASCADE)
DELETE FROM paid_items
WHERE payment_date < '2026-01-01';

-- 2. Supprimer les virements antérieurs au 01/01/2026
DELETE FROM transfers
WHERE date < '2026-01-01';

-- Vérification (affiche les comptes après nettoyage)
SELECT
  'paid_items restants'       AS table_name,
  COUNT(*)                    AS count,
  MIN(payment_date)           AS date_min,
  MAX(payment_date)           AS date_max
FROM paid_items
UNION ALL
SELECT
  'transfers restants',
  COUNT(*),
  MIN(date),
  MAX(date)
FROM transfers;

COMMIT;
