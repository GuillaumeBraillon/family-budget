-- Migration 004: Ajouter la colonne is_extra à paid_item_tags
-- Permet de marquer individuellement chaque montant de tag comme "hors budget"

-- Ajouter la colonne is_extra (false par défaut pour les enregistrements existants)
ALTER TABLE paid_item_tags 
ADD COLUMN IF NOT EXISTS is_extra boolean DEFAULT false;

-- Optionnel : Créer un index pour améliorer les performances des filtres sur is_extra
CREATE INDEX IF NOT EXISTS idx_paid_item_tags_is_extra ON paid_item_tags(is_extra);

-- Commentaire explicatif
COMMENT ON COLUMN paid_item_tags.is_extra IS 'Indique si ce montant de tag est hors budget (Extra). Permet une granularité au niveau de chaque tag plutôt qu''au niveau de l''opération.';
