-- Migration 010: suppression des anciennes regles de tresorerie par compte
-- Objectif: retirer target_ratio / target_cap de la table accounts

ALTER TABLE accounts
  DROP COLUMN IF EXISTS target_ratio,
  DROP COLUMN IF EXISTS target_cap;
