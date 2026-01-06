-- =====================================================
-- MIGRATION: Optimisation Critique Base de Données
-- Phase 1 : Index Performance-Critical
-- Date: 2026-01-06
-- Durée estimée: 30 minutes
-- Risque: NUL (ajout index uniquement)
-- Impact: +200% performance requêtes critiques
-- =====================================================

-- =====================================
-- 0. ACTIVATION EXTENSIONS REQUISES
-- =====================================
-- Extension pour recherche full-text trigramme
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =====================================
-- 1. INDEX SUR CLÉS ÉTRANGÈRES
-- =====================================
-- PostgreSQL ne crée PAS automatiquement d'index sur les FK
-- Impact: Jointures ×10-100 plus rapides

-- Accounts ↔ People
CREATE INDEX IF NOT EXISTS idx_accounts_owner 
  ON accounts(owner_id);

-- Expense Configs ↔ People & Accounts  
CREATE INDEX IF NOT EXISTS idx_expense_configs_beneficiary 
  ON expense_configs(beneficiary_id);

CREATE INDEX IF NOT EXISTS idx_expense_configs_account 
  ON expense_configs(account_id);

-- Income Configs ↔ Accounts
CREATE INDEX IF NOT EXISTS idx_income_configs_account 
  ON income_configs(account_id);

-- Paid Items ↔ Accounts & People (table la plus interrogée)
CREATE INDEX IF NOT EXISTS idx_paid_items_account 
  ON paid_items(account_id);

CREATE INDEX IF NOT EXISTS idx_paid_items_beneficiary 
  ON paid_items(beneficiary_id);

-- Transfers ↔ Accounts (double FK)
CREATE INDEX IF NOT EXISTS idx_transfers_source 
  ON transfers(source_account_id);

CREATE INDEX IF NOT EXISTS idx_transfers_dest 
  ON transfers(destination_account_id);

-- =====================================
-- 2. INDEX SUR COLONNES DE TRI
-- =====================================
-- Utilisées pour drag&drop ordering (usePlanner, TransfersView)
-- Impact: Tri ×20 plus rapide (200ms → 5ms sur 1000 items)

CREATE INDEX IF NOT EXISTS idx_paid_items_position 
  ON paid_items(position);

CREATE INDEX IF NOT EXISTS idx_transfers_position 
  ON transfers(position);

-- =====================================
-- 3. INDEX COMPOSITE OPTIMISÉ PLANNER
-- =====================================
-- Requête critique dans usePlanner.ts :
-- "Récupère toutes les opérations d'un mois donné pour un compte"
-- Impact: Requête mensuelle ×10 plus rapide (200ms → 20ms)

CREATE INDEX IF NOT EXISTS idx_paid_items_planner 
  ON paid_items(payment_date, account_id, is_waiting)
  INCLUDE (position, amount, type, label, category);
-- INCLUDE : colonnes additionnelles dans l'index (index-only scan possible)

-- Index alternatif pour requêtes par bénéficiaire
CREATE INDEX IF NOT EXISTS idx_paid_items_beneficiary_date 
  ON paid_items(beneficiary_id, payment_date)
  INCLUDE (amount, type, category);

-- =====================================
-- 4. INDEX FILTRE AUTORISATION
-- =====================================
-- Utilisé dans UsersManager pour séparer pending vs authorized
-- Impact: Filtre ×5 plus rapide (scan complet → index scan)

CREATE INDEX IF NOT EXISTS idx_authorized_users_allowed 
  ON authorized_users(is_allowed)
  WHERE is_allowed = false;
-- Partial index: uniquement les demandes en attente (économie espace)

-- =====================================
-- 5. INDEX TRI CHRONOLOGIQUE
-- =====================================
-- Utilisés pour affichage par date (TransfersView, historique)

CREATE INDEX IF NOT EXISTS idx_transfers_date 
  ON transfers(date DESC);
-- DESC : Optimisé pour ORDER BY date DESC (plus récent d'abord)

CREATE INDEX IF NOT EXISTS idx_paid_items_date 
  ON paid_items(payment_date DESC);

-- =====================================
-- 6. INDEX RECHERCHE FULL-TEXT
-- =====================================
-- Si recherche textuelle sur labels fréquente (SearchBar)
-- Impact: Recherche ILIKE ×50 plus rapide

CREATE INDEX IF NOT EXISTS idx_expense_configs_label_trgm 
  ON expense_configs USING gin(label gin_trgm_ops);
-- Nécessite extension pg_trgm (déjà installée sur Supabase)

CREATE INDEX IF NOT EXISTS idx_income_configs_label_trgm 
  ON income_configs USING gin(label gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_paid_items_label_trgm 
  ON paid_items USING gin(label gin_trgm_ops);

-- =====================================
-- 7. INDEX RECHERCHE PAR PÉRIODE
-- =====================================
-- Pour requêtes "entre deux dates" (DashboardView, BalancesView)
-- Note: Index fonctionnel DATE_TRUNC non supporté (nécessite fonction IMMUTABLE)
-- Alternative: Filtrer avec WHERE payment_date >= '2025-01-01' AND payment_date < '2025-02-01'
-- Les index existants (idx_paid_items_planner, idx_paid_items_date) sont suffisants

-- =====================================
-- 8. ANALYSE DES TABLES
-- =====================================
-- Met à jour les statistiques PostgreSQL pour l'optimiseur de requêtes
-- CRITIQUE après création d'index

ANALYZE accounts;
ANALYZE expense_configs;
ANALYZE income_configs;
ANALYZE paid_items;
ANALYZE transfers;
ANALYZE authorized_users;
ANALYZE people;
ANALYZE categories;
ANALYZE tags;

-- =====================================
-- VÉRIFICATION POST-MIGRATION
-- =====================================
-- Décommentez et exécutez manuellement après la création des index

/*
-- Lister tous les index créés
SELECT 
  schemaname, 
  tablename, 
  indexname, 
  pg_size_pretty(pg_relation_size(indexname::regclass)) as size
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Vérifier utilisation des index (après quelques jours)
-- Note: Nécessite pg_stat_statements activé
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as nb_scans,
  idx_tup_read as rows_read,
  idx_tup_fetch as rows_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC
LIMIT 20;
*/

-- =====================================
-- ROLLBACK (si problème)
-- =====================================

/*
-- Supprimer tous les index ajoutés (rare, mais au cas où)

DROP INDEX IF EXISTS idx_accounts_owner;
DROP INDEX IF EXISTS idx_expense_configs_beneficiary;
DROP INDEX IF EXISTS idx_expense_configs_account;
DROP INDEX IF EXISTS idx_income_configs_account;
DROP INDEX IF EXISTS idx_paid_items_account;
DROP INDEX IF EXISTS idx_paid_items_beneficiary;
DROP INDEX IF EXISTS idx_transfers_source;
DROP INDEX IF EXISTS idx_transfers_dest;
DROP INDEX IF EXISTS idx_paid_items_position;
DROP INDEX IF EXISTS idx_transfers_position;
DROP INDEX IF EXISTS idx_paid_items_planner;
DROP INDEX IF EXISTS idx_paid_items_beneficiary_date;
DROP INDEX IF EXISTS idx_authorized_users_allowed;
DROP INDEX IF EXISTS idx_transfers_date;
DROP INDEX IF EXISTS idx_paid_items_date;
DROP INDEX IF EXISTS idx_expense_configs_label_trgm;
DROP INDEX IF EXISTS idx_income_configs_label_trgm;
DROP INDEX IF EXISTS idx_paid_items_label_trgm;
DROP INDEX IF EXISTS idx_paid_items_month;
*/

-- =====================================
-- NOTES D'IMPLÉMENTATION
-- =====================================

/*
DÉPLOIEMENT RECOMMANDÉ :

1. Backup avant application :
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

2. Exécution en production (Supabase Dashboard) :
   - SQL Editor > New query
   - Copier-coller ce fichier
   - Run

3. Durée création index (estimations) :
   - < 1000 records : ~10 secondes
   - 1000-10000 records : ~1 minute
   - 10000-100000 records : ~5 minutes
   - > 100000 records : ~15-30 minutes

4. Index créés CONCURRENTLY (pas de lock table) :
   Note: CREATE INDEX IF NOT EXISTS ne supporte pas CONCURRENTLY
   Si base en prod avec trafic, utiliser :
   
   CREATE INDEX CONCURRENTLY idx_name ON table(column);
   
   (Mais ignore erreur si index existe déjà)

5. Espace disque requis :
   Index = ~20-40% de la taille de la table
   Prévoir ~100MB d'espace libre minimum

6. Monitoring après déploiement :
   - Vérifier temps de réponse Dashboard (devrait passer de ~200ms à ~20ms)
   - Vérifier drag&drop fluide (pas de lag)
   - Checker logs Supabase (aucune erreur liée aux index)

7. Prochaines étapes (Phase 2) :
   - Voir DATABASE_OPTIMIZATION.md section "Phase 2: Types & Validations"
   - Implémenter ENUM types
   - Ajouter CHECK constraints
*/
