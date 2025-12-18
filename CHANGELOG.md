
# Journal des modifications (Changelog)

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
et ce projet respecte le [Versionnage Sémantique](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Corrigé
- **Supabase Error 400** : Correction de l'erreur lors de l'enregistrement des paramètres en ajoutant un script de migration SQL automatique pour les colonnes `period_type` et `period_value`.
- **Typage API** : Forçage des types numériques lors de l'envoi des données à Supabase pour éviter les conflits de types Postgres.
- **Gestion d'erreur** : Amélioration du composant d'alerte pour afficher le message d'erreur détaillé renvoyé par le backend.

## [1.1.1] - 2025-05-21

### Ajouté
- Migration SQL automatique pour les installations existantes.

### Corrigé
- Problème de navigation "page blanche" lié à l'importmap.

## [1.1.0] - 2025-05-20

### Ajouté
- **Composant InfoBox** : Nouveau composant d'onboarding et d'aide contextuelle.
- **Mode Dual dans le Planner** : Introduction d'un sélecteur de mode (`Suivi Mensuel` vs `Modèles Récurrents`).

### Changé
- **Refonte Ergonomique** : Déplacement de la logique métier "Opérations" vers l'Échéancier.

## [1.0.0] - 2025-05-15
- Version initiale de l'application.
