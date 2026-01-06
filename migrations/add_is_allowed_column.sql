-- Migration : Ajout de la colonne is_allowed pour le système de whitelist
-- Date : 2026-01-06
-- Description : Permet de contrôler l'autorisation d'accès des utilisateurs

-- Étape 1 : Ajouter la colonne is_allowed (par défaut false pour les nouveaux utilisateurs)
ALTER TABLE authorized_users 
ADD COLUMN IF NOT EXISTS is_allowed boolean DEFAULT false NOT NULL;

-- Étape 2 : Autoriser tous les utilisateurs existants (transition en douceur)
-- Commentez cette ligne si vous voulez vérifier manuellement chaque utilisateur existant
UPDATE authorized_users SET is_allowed = true WHERE is_allowed = false;

-- Vérification
SELECT email, name, is_allowed, added_at FROM authorized_users ORDER BY added_at DESC;
