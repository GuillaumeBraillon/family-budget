-- =====================================================
-- Migration: Ajout du champ is_interest à transfers
-- Description: Permet de marquer les virements comme
--              ajouts d'intérêts ou ajustements exceptionnels
-- Version: 2.4.1
-- Date: 2026-01-09
-- =====================================================

-- Ajouter le champ is_interest à la table transfers
ALTER TABLE transfers 
ADD COLUMN IF NOT EXISTS is_interest boolean DEFAULT false;

-- Commentaire pour documentation
COMMENT ON COLUMN transfers.is_interest IS 'Indique si le virement est un ajout d''intérêts ou un ajustement exceptionnel (true) ou un virement standard (false)';

-- Index pour requêtes filtrées sur ce champ (optionnel, selon usage)
CREATE INDEX IF NOT EXISTS idx_transfers_is_interest ON transfers(is_interest) WHERE is_interest = true;

-- Mettre à jour le schéma complet
ANALYZE transfers;
