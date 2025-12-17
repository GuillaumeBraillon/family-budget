
# Journal des modifications (Changelog)

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
et ce projet respecte le [Versionnage Sémantique](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-05-20

### Ajouté
- **Composant InfoBox** : Nouveau composant d'onboarding et d'aide contextuelle (`components/ui/InfoBox.tsx`) déployé sur toutes les vues principales.
- **Mode Dual dans le Planner** : Introduction d'un sélecteur de mode (`Suivi Mensuel` vs `Modèles Récurrents`) dans le `BudgetPlanner`.
- **Système de tri** : Possibilité de trier les modèles de dépenses/revenus par date, libellé ou montant.

### Changé
- **Refonte Ergonomique** : Déplacement de la logique métier "Opérations" (Dépenses et Revenus récurrents) depuis les Paramètres vers l'Échéancier.
- **Unification de la Configuration** : L'onglet "Catégories" est désormais regroupé avec les réglages structurels du foyer (Membres, Comptes).
- **Navigation simplifiée** : Réduction du nombre d'onglets de configuration pour une meilleure lisibilité.

### Corrigé
- Mapping des propriétés CamelCase vers SnakeCase pour les appels API Supabase sur les tables `expense_configs` et `income_configs`.
- Gestion des erreurs lors de la création initiale de la base de données.

## [1.0.0] - 2025-05-15
- Version initiale de l'application avec Dashboard, Planner et Configuration via Supabase.
