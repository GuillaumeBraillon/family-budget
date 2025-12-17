# Journal des modifications (Changelog)

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
et ce projet respecte le [Versionnage Sémantique](https://semver.org/spec/v2.0.0.html).

## [Non publié]

### Corrigé

- Correction de la page blanche au démarrage : ajout du script d'entrée dans index.html et suppression de l'importmap incompatible avec Vite.

## [1.1.0] - 2025-12-18

### Ajouté

- **Composant InfoBox** : Nouveau composant d'onboarding et d'aide contextuelle (`components/ui/InfoBox.tsx`) déployé sur toutes les vues principales.
- **Mode Dual dans le Planner** : Introduction d'un sélecteur de mode (`Suivi Mensuel` vs `Modèles Récurrents`) dans le `BudgetPlanner`.
- **Amélioration de la documentation** : Mise à jour complète du README, des instructions Copilot et du CHANGELOG avec détails sur la stack technique et les concepts clés.

### Changé

- **Refonte Ergonomique** : Déplacement de la logique métier "Opérations" (Dépenses et Revenus récurrents) depuis les Paramètres vers l'Échéancier.
- **Unification de la Configuration** : Restructuration complète de la vue de configuration en composants modulaires avec extraction de hooks (`useConfigurationUI`).
- **Simplification de l'UI** : Suppression de l'onglet 'opérations' dédié, intégration implicite des fonctionnalités.
- **Navigation simplifiée** : Réduction du nombre d'onglets de configuration pour une meilleure lisibilité.

### Corrigé

- Mapping des propriétés CamelCase vers SnakeCase pour les appels API Supabase sur les tables `expense_configs` et `income_configs`.
- Gestion des erreurs lors de la création initiale de la base de données.

## [1.0.0] - 2025-12-17

### Ajouté

- **Extraction de la logique métier** : Nouveaux hooks `useBudget` et `usePlanner` pour la gestion d'état et les interactions API.
- **Support des sous-catégories** : Champ `subCategory` pour `IncomeConfig` et `ExpenseConfig` permettant un suivi plus granulaire.
- **Bénéficiaire de revenu** : Nouveau champ `beneficiaryId` dans `IncomeConfig` pour distinguer le compte receveur de la personne bénéficiaire.
- **Affichage planifié vs réalisé** : Vue détaillée des montants planifiés et payés dans l'analyse budgétaire.
- **Composant Modal** : Nouveau composant pour les dialogues de confirmation (remplacement de window.confirm).
- **Composant SearchBar** : Barre de recherche avec alignement d'icônes et styles de focus améliorés.

### Changé

- **Refactorisation de BudgetEnvelopes** : Accepte maintenant `weeklyLimit` comme prop au lieu d'une limite globale codée en dur.
- **Renommage pour clarté** : `ownerId` renommé en `accountId` dans les configurations pour une meilleure lisibilité.
- **Suppression de Owner enum** : L'interface `Person` ne dépend plus d'un enum Owner.
- **Nouveau type AppSettings** : Remplace `IncomeProfile` pour les paramètres généraux de l'application.
- **Amélioration du calcul de semaine** : Refonte de la logique de calcul de semaine active dans `usePlannerUI`.
- **Simplification de l'initialisation** : Suppression de useEffect inutiles dans BudgetPlanner.

### Corrigé

- **Alignement d'icône SearchBar** : Correction du problème d'alignement vertical dû au comportement flexbox.
- **Style des alertes de solde** : Couleurs de bordure et de texte dynamiques basées sur le solde restant.
- **Affichage des montants planifiés** : N'affiche que lorsqu'ils diffèrent des montants payés pour réduire l'encombrement UI.

## [0.2.0] - 2025-12-16

### Ajouté

- **Documentation complète** : README détaillé avec description du projet, fonctionnalités principales, stack technique et instructions d'installation Supabase.
- **Structure du projet** : Vue d'ensemble de l'organisation des fichiers dans le README.

### Changé

- **Type IncomeConfig** : Refonte complète pour mieux représenter les sources de revenus récurrents.
- **CategoryDef amélioré** : Ajout du champ `type` pour distinguer les catégories de dépenses et de revenus.
- **PlannedItem enrichi** : Intègre `type` et meilleure gestion du statut payé via `paidDetails`.
- **Mise à jour des dépendances** : recharts et supabase.

## [0.1.0] - 2025-12-14

### Ajouté

- **Intégration Supabase** : Ajout du client Supabase et de la couche API pour gérer les opérations de données.
- **Composants principaux** :
  - BudgetPlanner avec états de chargement, gestion d'erreurs et capacités de filtrage
  - Dashboard avec vue d'ensemble des comptes et enveloppes budgétaires
  - ConfigurationView pour gérer personnes, comptes, catégories et configurations de dépenses
- **Types de données** : Définition des interfaces pour budgets mensuels et plages de dates.
- **Mock data** : Données de test pour le développement.

### Changé

- **Nom de l'application** : "Budget Couple" → "Budget Familiale"
- **Persistance des données** : Remplacement des données mock par des interactions base de données en temps réel.

## [0.0.1] - 2025-12-12

### Ajouté

- **Initialisation du projet** : Structure de base avec Vite, React 19, TypeScript
- **Configuration** :
  - package.json avec dépendances (React, Recharts, Lucide, Supabase)
  - tsconfig.json pour TypeScript strict
  - vite.config.ts pour la configuration du build
  - .gitignore
- **Fichiers de base** :
  - index.html avec Tailwind CSS
  - index.tsx point d'entrée
  - types.ts avec définitions de types initiales
  - services/mockData.ts avec données de test
- **README.md** : Documentation initiale du projet
