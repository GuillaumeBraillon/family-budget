-- =====================================================
-- Migration 004 : Refactorisation Relationnelle des Catégories
-- =====================================================
-- Date : 2026-01-12
-- Objectif : Passer d'un système de sous-catégories en array
--            à une structure relationnelle avec auto-suggestion
-- =====================================================

BEGIN;

-- =====================================================
-- ÉTAPE 1 : Sauvegarde des données existantes
-- =====================================================

-- Table temporaire pour sauvegarder les sous-catégories actuelles
CREATE TEMP TABLE temp_sub_categories AS
SELECT 
  id as category_id,
  name as category_name,
  unnest(sub_categories) as sub_category_name
FROM public.categories
WHERE sub_categories IS NOT NULL 
  AND array_length(sub_categories, 1) > 0;

-- Afficher les données sauvegardées pour vérification
DO $$
DECLARE
  sub_cat_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO sub_cat_count FROM temp_sub_categories;
  RAISE NOTICE '✓ Sauvegarde : % sous-catégories extraites', sub_cat_count;
END $$;

-- =====================================================
-- ÉTAPE 2 : Création de la nouvelle table sub_categories
-- =====================================================

CREATE TABLE IF NOT EXISTS public.sub_categories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte d'unicité : Une sous-catégorie unique par catégorie
  CONSTRAINT unique_sub_category_per_category UNIQUE(category_id, name)
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_sub_categories_category_id ON public.sub_categories(category_id);
CREATE INDEX idx_sub_categories_name ON public.sub_categories(name);

COMMENT ON TABLE public.sub_categories IS 'Sous-catégories relationnelles liées aux catégories principales';
COMMENT ON COLUMN public.sub_categories.id IS 'Identifiant unique de la sous-catégorie';
COMMENT ON COLUMN public.sub_categories.name IS 'Nom de la sous-catégorie';
COMMENT ON COLUMN public.sub_categories.category_id IS 'Référence vers la catégorie parente';

-- =====================================================
-- ÉTAPE 3 : Migration des données historiques
-- =====================================================

-- Insérer les sous-catégories depuis la sauvegarde temporaire
INSERT INTO public.sub_categories (id, name, category_id)
SELECT 
  gen_random_uuid() as id,
  sub_category_name as name,
  category_id
FROM temp_sub_categories
ON CONFLICT (category_id, name) DO NOTHING;

-- Afficher le résultat de la migration
DO $$
DECLARE
  migrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_count FROM public.sub_categories;
  RAISE NOTICE '✓ Migration : % sous-catégories insérées dans la nouvelle table', migrated_count;
END $$;

-- =====================================================
-- ÉTAPE 4 : Enrichissement de saved_labels
-- =====================================================

-- Ajouter les colonnes pour l'auto-suggestion
ALTER TABLE public.saved_labels
  ADD COLUMN IF NOT EXISTS category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sub_category_id TEXT REFERENCES public.sub_categories(id) ON DELETE SET NULL;

-- Index pour les requêtes d'auto-suggestion
CREATE INDEX IF NOT EXISTS idx_saved_labels_category_id ON public.saved_labels(category_id);
CREATE INDEX IF NOT EXISTS idx_saved_labels_sub_category_id ON public.saved_labels(sub_category_id);

COMMENT ON COLUMN public.saved_labels.category_id IS 'Catégorie suggérée automatiquement pour ce libellé';
COMMENT ON COLUMN public.saved_labels.sub_category_id IS 'Sous-catégorie suggérée automatiquement pour ce libellé';

-- =====================================================
-- ÉTAPE 5 : Suppression de l'ancien système (array)
-- =====================================================

-- Supprimer la colonne sub_categories de type array
ALTER TABLE public.categories DROP COLUMN IF EXISTS sub_categories;

DO $$
BEGIN
  RAISE NOTICE '✓ Colonne sub_categories (array) supprimée de la table categories';
END $$;

-- =====================================================
-- ÉTAPE 6 : Activation de Row Level Security (RLS)
-- =====================================================

ALTER TABLE public.sub_categories ENABLE ROW LEVEL SECURITY;

-- Policy : Lecture publique pour tous les utilisateurs authentifiés
CREATE POLICY "Allow public read access to sub_categories"
  ON public.sub_categories
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy : Modification réservée aux utilisateurs autorisés
-- (Utilise la même logique que categories)
CREATE POLICY "Allow authorized users to manage sub_categories"
  ON public.sub_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.authorized_users
      WHERE email = auth.jwt() ->> 'email'
      AND is_allowed = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.authorized_users
      WHERE email = auth.jwt() ->> 'email'
      AND is_allowed = true
    )
  );

-- =====================================================
-- ÉTAPE 7 : Fonctions helper pour l'auto-suggestion
-- =====================================================

-- Fonction : Récupérer les sous-catégories d'une catégorie
CREATE OR REPLACE FUNCTION get_sub_categories(p_category_id TEXT)
RETURNS TABLE (
  id TEXT,
  name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT sc.id, sc.name
  FROM public.sub_categories sc
  WHERE sc.category_id = p_category_id
  ORDER BY sc.name;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_sub_categories IS 'Récupère toutes les sous-catégories d''une catégorie donnée';

-- Fonction : Suggérer catégorie/sous-catégorie depuis un libellé
CREATE OR REPLACE FUNCTION suggest_category_from_label(p_label_name TEXT)
RETURNS TABLE (
  category_id TEXT,
  category_name TEXT,
  sub_category_id TEXT,
  sub_category_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as category_id,
    c.name as category_name,
    sl.sub_category_id,
    sc.name as sub_category_name
  FROM public.saved_labels sl
  LEFT JOIN public.categories c ON c.id = sl.category_id
  LEFT JOIN public.sub_categories sc ON sc.id = sl.sub_category_id
  WHERE sl.name ILIKE p_label_name
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION suggest_category_from_label IS 'Suggère catégorie et sous-catégorie à partir d''un libellé enregistré';

-- =====================================================
-- ÉTAPE 8 : Vérifications et rapport final
-- =====================================================

DO $$
DECLARE
  cat_count INTEGER;
  sub_cat_count INTEGER;
  label_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO cat_count FROM public.categories;
  SELECT COUNT(*) INTO sub_cat_count FROM public.sub_categories;
  SELECT COUNT(*) INTO label_count FROM public.saved_labels;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration 004 : RÉSUMÉ';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Catégories principales : %', cat_count;
  RAISE NOTICE 'Sous-catégories (nouvelle table) : %', sub_cat_count;
  RAISE NOTICE 'Libellés sauvegardés : %', label_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Migration 004 terminée avec succès !';
  RAISE NOTICE '';
END $$;

COMMIT;

-- =====================================================
-- POST-MIGRATION : Script de rollback (en cas de besoin)
-- =====================================================

-- Pour annuler cette migration, exécuter :
/*
BEGIN;

-- Recréer la colonne sub_categories en array
ALTER TABLE public.categories ADD COLUMN sub_categories TEXT[];

-- Reconstituer les arrays depuis la table relationnelle
UPDATE public.categories c
SET sub_categories = (
  SELECT array_agg(sc.name ORDER BY sc.name)
  FROM public.sub_categories sc
  WHERE sc.category_id = c.id
);

-- Supprimer les colonnes ajoutées à saved_labels
ALTER TABLE public.saved_labels 
  DROP COLUMN IF EXISTS category_id,
  DROP COLUMN IF EXISTS sub_category_id;

-- Supprimer la nouvelle table
DROP TABLE IF EXISTS public.sub_categories CASCADE;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS get_sub_categories;
DROP FUNCTION IF EXISTS suggest_category_from_label;

COMMIT;
*/
