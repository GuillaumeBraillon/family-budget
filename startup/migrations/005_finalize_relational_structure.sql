-- =====================================================
-- MIGRATION 005 : Finalisation Structure Relationnelle
-- Date: 2026-01-12
-- Version: 2.6.5
-- =====================================================
--
-- OBJECTIF : Nettoyer les vestiges de l'ancien format
-- - Supprimer colonne sub_categories (array) de categories
-- - Supprimer colonnes tag_ids (array) de expense_configs, income_configs, paid_items
-- - Ajouter colonnes category_id/sub_category_id à saved_labels
--
-- =====================================================

-- =====================================
-- ÉTAPE 1 : Ajouter colonnes aux saved_labels
-- =====================================

-- Ajout des colonnes pour lier catégorie/sous-catégorie
ALTER TABLE saved_labels 
ADD COLUMN IF NOT EXISTS category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS sub_category_id TEXT REFERENCES sub_categories(id) ON DELETE SET NULL;

-- Index pour les recherches d'auto-suggestion
CREATE INDEX IF NOT EXISTS idx_saved_labels_category ON saved_labels(category_id);
CREATE INDEX IF NOT EXISTS idx_saved_labels_sub_category ON saved_labels(sub_category_id);

COMMENT ON COLUMN saved_labels.category_id IS 'Catégorie suggérée pour auto-complétion (optionnel)';
COMMENT ON COLUMN saved_labels.sub_category_id IS 'Sous-catégorie suggérée pour auto-complétion (optionnel)';

-- =====================================
-- ÉTAPE 2 : Supprimer colonnes obsolètes
-- =====================================

-- Supprimer sub_categories de la table categories (maintenant dans sub_categories)
ALTER TABLE categories DROP COLUMN IF EXISTS sub_categories;

-- Supprimer tag_ids de expense_configs (maintenant dans paid_item_tags)
ALTER TABLE expense_configs DROP COLUMN IF EXISTS tag_ids;

-- Supprimer tag_ids de income_configs (maintenant dans paid_item_tags)
ALTER TABLE income_configs DROP COLUMN IF EXISTS tag_ids;

-- Supprimer tag_ids de paid_items (maintenant dans paid_item_tags)
ALTER TABLE paid_items DROP COLUMN IF EXISTS tag_ids;

-- =====================================
-- ÉTAPE 3 : Mise à jour des commentaires
-- =====================================

COMMENT ON TABLE categories IS 'Catégories hiérarchiques pour les dépenses/revenus (structure relationnelle via sub_categories)';
COMMENT ON TABLE saved_labels IS 'Libellés pré-enregistrés avec association catégorie/sous-catégorie pour auto-suggestion';

-- =====================================
-- ÉTAPE 4 : Mise à jour des statistiques
-- =====================================

ANALYZE categories;
ANALYZE saved_labels;
ANALYZE expense_configs;
ANALYZE income_configs;
ANALYZE paid_items;

-- =====================================================
-- VÉRIFICATION POST-MIGRATION
-- =====================================================
--
-- Pour vérifier que la migration s'est bien passée :
--
-- 1. Vérifier les nouvelles colonnes de saved_labels :
--    SELECT column_name, data_type, is_nullable 
--    FROM information_schema.columns 
--    WHERE table_name = 'saved_labels' AND column_name IN ('category_id', 'sub_category_id');
--
-- 2. Vérifier la suppression des anciennes colonnes :
--    SELECT column_name 
--    FROM information_schema.columns 
--    WHERE table_name = 'categories' AND column_name = 'sub_categories';
--    -- Doit retourner 0 ligne
--
--    SELECT column_name 
--    FROM information_schema.columns 
--    WHERE table_name IN ('expense_configs', 'income_configs', 'paid_items') 
--      AND column_name = 'tag_ids';
--    -- Doit retourner 0 ligne
--
-- 3. Tester l'auto-suggestion avec un libellé lié :
--    INSERT INTO saved_labels (id, name, type, is_expense, category_id, sub_category_id)
--    VALUES ('lbl_test', 'Test Auto-Suggestion', 'COURANT', true, 
--            (SELECT id FROM categories WHERE name = 'Alimentation' LIMIT 1),
--            (SELECT id FROM sub_categories WHERE name = 'Courses' LIMIT 1));
--
--    SELECT * FROM suggest_category_from_label('Test Auto-Suggestion');
--    -- Doit retourner category_id et sub_category_id
--
-- =====================================================
-- NOTES D'IMPLÉMENTATION
-- =====================================================
--
-- POURQUOI CETTE MIGRATION ?
--
-- 1. **saved_labels** : Manquait les colonnes pour stocker les associations
--    catégorie/sous-catégorie nécessaires à l'auto-suggestion
--
-- 2. **Colonnes array obsolètes** : 
--    - sub_categories : Remplacé par table relationnelle sub_categories
--    - tag_ids : Remplacé par table relationnelle paid_item_tags
--
-- 3. **Cohérence** : Le système utilise maintenant 100% de relations
--    PostgreSQL au lieu de tableaux JSONB
--
-- IMPACT UTILISATEUR :
--
-- - L'interface "Modifier le libellé" pourra maintenant afficher des dropdowns
--   pour sélectionner catégorie et sous-catégorie
--
-- - Ces associations seront utilisées par la fonction suggest_category_from_label()
--   pour pré-remplir automatiquement lors de la saisie
--
-- - Plus besoin de références array (plus propre, plus performant)
--
-- =====================================================
