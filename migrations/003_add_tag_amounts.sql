-- Migration : Système de ventilation des montants par tag
-- Date : 2026-01-07
-- Description : Remplace le système tag_ids par une table de liaison permettant d'affecter un montant à chaque tag

-- 1. Créer la table de liaison paid_item_tags
CREATE TABLE IF NOT EXISTS paid_item_tags (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  paid_item_instance_id text NOT NULL,
  tag_id text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  created_at timestamp with time zone DEFAULT now(),
  
  -- Foreign keys
  CONSTRAINT fk_paid_item 
    FOREIGN KEY (paid_item_instance_id) 
    REFERENCES paid_items(instance_id) 
    ON DELETE CASCADE,
  
  CONSTRAINT fk_tag 
    FOREIGN KEY (tag_id) 
    REFERENCES tags(id) 
    ON DELETE CASCADE,
  
  -- Contrainte d'unicité
  CONSTRAINT unique_paid_item_tag 
    UNIQUE(paid_item_instance_id, tag_id)
);

-- 2. Index pour les performances
CREATE INDEX idx_paid_item_tags_instance ON paid_item_tags(paid_item_instance_id);
CREATE INDEX idx_paid_item_tags_tag ON paid_item_tags(tag_id);

-- 3. Migration automatique des opérations avec UN SEUL tag
-- Pour ces cas simples, le montant à affecter est évident (= montant total)
INSERT INTO paid_item_tags (paid_item_instance_id, tag_id, amount)
SELECT 
  pi.instance_id,
  pi.tag_ids[1] as tag_id,
  ABS(pi.amount) as amount  -- Valeur absolue pour gérer les montants négatifs
FROM paid_items pi
WHERE 
  pi.tag_ids IS NOT NULL 
  AND array_length(pi.tag_ids, 1) = 1  -- UN SEUL tag
  AND pi.amount != 0;  -- Montant non nul

-- 4. Politique RLS (Row Level Security) si activée
ALTER TABLE paid_item_tags ENABLE ROW LEVEL SECURITY;

-- Politique : Tous les utilisateurs authentifiés peuvent tout faire (compatible avec le reste de l'app)
CREATE POLICY "Enable all for authenticated users" ON paid_item_tags
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 5. NOTE IMPORTANTE : Migration des données existantes
-- ✅ Opérations avec UN SEUL tag : migrées automatiquement (montant = montant total)
-- ⚠️ Opérations avec PLUSIEURS tags : nécessitent une ventilation manuelle
-- 
-- Le système supporte les deux formats en parallèle :
--   - tag_ids (ancien système, simple liste de tags)
--   - paid_item_tags (nouveau système, avec ventilation des montants)
-- 
-- Comportement :
--   - Opérations avec paid_item_tags : affichage avec ventilation des montants
--   - Opérations avec tag_ids seulement : affichage normal des tags sans montants
--   - Lors de l'édition, l'utilisateur peut basculer vers le nouveau système

COMMENT ON TABLE paid_item_tags IS 'Table de liaison entre opérations et tags avec ventilation de montants';
COMMENT ON COLUMN paid_item_tags.amount IS 'Montant affecté à ce tag pour cette opération';
