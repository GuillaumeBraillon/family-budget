# Journal des modifications (Changelog)

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
et ce projet respecte le [Versionnage Sémantique](https://semver.org/spec/v2.0.0.html).

---

## [2.2.1] - 2026-01-08

### Ajouté

- **Champ `isExtraGlobal` dans PlannedItem** : Séparation du toggle Extra brut et du calcul dérivé
  - Source de vérité pour le toggle Extra global (sans influence des tags)
  - `isExtra` : Calcul dérivé (true si toggle global OU au moins un tag Extra)
  - `isExtraGlobal` : Valeur brute du toggle (pour calculs robustes)

- **Système de logs de debug activable** : Logs détaillés activables en production via variable d'environnement
  - Nouvelle méthode `logger.debug(namespace, ...args)` pour logs on-demand
  - Activation via `VITE_ENABLE_DEBUG_LOGS=true` (local ou Vercel)
  - Logs instrumentés aux points stratégiques :
    - API : Chargement initial des données (fetchInitialData)
    - Auth : Récupération session et changements d'état
    - Authorization : Vérification whitelist avec valeurs brutes
    - Drag & drop : Calcul des positions avec contexte (ASC/DESC)
    - Calculs financiers : getEffectiveAmount() avec détails filtres
    - Planner : Génération des périodes budgétaires
    - CRUD : Opérations de pointage avec tags
  - Permet diagnostiquer problèmes en prod sans redéployer

- **Error Boundary global** : Capture des erreurs React avec UI élégante
  - Composant `ErrorBoundary` wrappant toute l'application
  - Page d'erreur user-friendly au lieu d'écran blanc
  - Détails techniques pliables (message + stack trace)
  - Actions : Rafraîchir la page ou retour à l'accueil
  - Logs automatiques des erreurs dans la console

- **Configuration ESLint + Prettier** : Outils de qualité de code professionnels
  - ESLint 8.57.1 avec plugins TypeScript, React, React Hooks
  - Prettier 3.2.4 pour formatting automatique (160 char width)
  - Scripts : `npm run lint`, `npm run lint:fix`, `npm run format`
  - Configuration : `.eslintrc.cjs`, `.prettierrc`, `.eslintignore`

### Corrigé

- **Calcul des statistiques QuickPeriodSummary** : Montants incorrects avec opérations mixtes Extra/Standard
  - Correction du calcul des totaux "Dépenses Période" et "Revenus Période"
  - Prise en compte correcte des montants Extra et Standard selon filtre actif
  - Résolution du bug : Opération 115.22€ (70€ Extra + 45.22€ Standard) affichait toujours 115.22€

- **Calcul des montants effectifs** : Refonte complète de `getEffectiveAmount()` pour gérer les opérations mixtes
  - Fonction avec logique contextuelle selon filtres actifs (Extra/Standard + Tags)
  - Support des double-filtres (Extra + Tags spécifiques)
  - Calcul précis des montants Extra vs Standard avec ventilation de tags
  - **Exemples** :
    - Opération 115.22€ avec tag 70€ Extra + 45.22€ non taggé
    - Filtre "Nature: Extra" → **70€** (somme tags Extra)
    - Filtre "Nature: Standard" → **45.22€** (montant total - tags Extra)
    - Aucun filtre → **115.22€** (montant total)

- **Positions manuelles drag & drop** : Gestion des collisions de positions identiques
  - Tri stable avec second critère (`instanceId`) en cas d'égalité de position
  - Décalage automatique des items suivants lors de collision

- **Drag & drop en mode DESC** : Correction du calcul des positions en tri descendant
  - Inversion automatique des voisins (prev/next) selon le sens du tri
  - Positions correctement calculées : DESC (première position = plus grande valeur)
  - Résolution du bug : En DESC, les items étaient placés aux mauvaises positions

- **Crash VariableTransactionForm** : Correction de l'accès à la propriété lors de la suppression
  - TypeError lors de la suppression d'une opération (accès à `form.label` au lieu de `label`)
  - Correction de la référence dans le message de confirmation de suppression

- **Logs sensibles** : Retrait des logs affichant les emails en clair
  - Nettoyage de `mapDbAuthorizedUser` (logs de mapping utilisateurs)
  - Sécurité renforcée en développement

### Refactorisation - Code Portfolio-Ready

- **Qualité de code exemplaire** : Nettoyage complet pour standards professionnels
  - **89 problèmes ESLint → 0** (100% de réduction)
  - **0 erreurs, 0 warnings** en production

- **Corrections TypeScript** (2 erreurs critiques) :
  - `@ts-ignore` → `@ts-expect-error` avec commentaires explicatifs (ExpenseRulesEditor, IncomeEditor)
  - TypeScript strict mode maintenu sur toute la codebase

- **Nettoyage des imports** (26 suppressions) :
  - Icônes inutilisées : Users, Save, TrendingUp, Wallet, etc.
  - Hooks React non utilisés : useState, useEffect
  - Types TypeScript inutilisés : PlannedItem
  - Fonctions dnd-kit : arrayMove
  - Variables locales obsolètes

- **Typage strict** (40+ corrections) :
  - **Création de 8 nouveaux types** :
    - `BudgetData` : État global du budget (useBudgetBalances)
    - `HistoryEntry` : Évolution des soldes (useTransfersData)
    - `AccountStats` : Statistiques par compte (usePlanner)
    - `BeneficiaryStats` : Statistiques par bénéficiaire (usePlanner)
    - `BeforeInstallPromptEvent` : Événement PWA (usePWAInstall)

  - **React components** :
    - `React.ReactElement<any>` → `React.ReactElement` (Header, 2 occurrences)
    - Clonage d'éléments avec types propres (DataListRow)
    - Événements keyboard typés (BalancesTable)

  - **Promises & handlers** :
    - `Promise<any>` → types retour explicites (ConfigurationView, AccountLabelManager)
    - Handlers async typés (onImportLabels, onToggleUserAuthorization, etc.)

  - **Hooks personnalisés** :
    - Génériques `<T>` pour wrapCrudWithReload (useBudgetActions)
    - Type guards propres : `isTransfer` (useTransfersData)
    - Refs typées : `React.MutableRefObject<BudgetData>` (useBudgetBalances)

  - **Services & mappers** :
    - Casts d'enum TypeScript : `period_type` (apiMappers)
    - Records typés : `tagAmountsByInstance`, `paidItems` (api.ts)

  - **Gestion d'erreurs** :
    - `catch (err)` → `const error = err as Error` (3 occurrences dans useBudget)
    - Variables d'environnement : `process.env` (supabase.ts)

  - **Formulaires** :
    - Spread `as any` → propriétés explicites (ExpenseRulesEditor, IncomeEditor)
    - Édition de transactions : `editingVar` typé (TransfersView)
    - PaidItemDetails typé (PlannerModals)

  - **Logger (justifiés)** :
    - Fonctions variadiques : `eslint-disable-next-line @typescript-eslint/no-explicit-any`
    - Console statements : `eslint-disable-line no-console`
    - Documentation des justifications

- **Optimisation React Hooks** (7 corrections) :
  - **useCallback wrappés** (3 fonctions) :
    - `isRefundCategory` (DashboardView) : Détection remboursements
    - `resetForm` (useTransactionForm) : Réinitialisation formulaire
    - Dépendances optimisées pour éviter re-création

  - **useMemo wrappés** (2 calculs) :
    - `unsortedItems` (useOperationsData) : Filtrage opérations
    - Calculs de stats périodiques memoized

  - **Dépendances corrigées** :
    - Ajout de `filters.extra` (useOperationsData)
    - Ajout de `isRefundCategory` (DashboardView, 2 deps)
    - Suppression de deps inutiles (categories, accounts non utilisés)

  - **Justifications documentées** :
    - `loadData` : eslint-disable (chargement une seule fois au montage)

- **Imports React manquants** (2 fixes runtime) :
  - `useCallback` ajouté dans DashboardView
  - `useCallback` ajouté dans useTransactionForm
  - Résolution des crashes `useCallback is not defined`

### Technique

- **Robustesse des calculs** : Système plus fiable pour gérer la complexité (tags, extra, remboursements)
  - Source de vérité unique (`isExtraGlobal`) pour le toggle Extra
  - Calculs contextuels basés sur les filtres actifs
  - Support complet des cas d'usage mixtes

- **Debugging amélioré** : Infrastructure de logs professionnelle
  - Logs conditionnels (dev only par défaut)
  - Activation on-demand en production sans redéploiement
  - Namespace pour identifier l'origine des logs
  - Documentation dans `default.env.txt`

- **Gestion d'erreurs** : Architecture robuste avec Error Boundary
  - Capture toutes les erreurs React non gérées
  - UI de fallback élégante et informative
  - Logging automatique avec stack traces
  - Amélioration de l'expérience utilisateur en cas d'erreur

- **Standards professionnels** : Code portfolio-ready
  - 100% type-safe (TypeScript strict)
  - Zero-defect standard (0 ESLint errors/warnings)
  - React best practices (hooks optimisés)
  - Clean architecture (imports propres, pas de code mort)
  - Documentation inline des justifications techniques

---

## [2.2.0] - 2026-01-08

### Ajouté

- **Système de tri manuel intelligent** : Gestion robuste du drag & drop des opérations avec positions manuelles
  - Système à deux niveaux : positions manuelles (< 1M) et automatiques (>= 1M)
  - Intervalles larges (1000) pour scalabilité et éviter les conflits
  - Gestion automatique des collisions avec décalage des items suivants
  - Support de 8 cas d'insertion différents (première position, dernière, entre deux items avec/sans positions)

### Amélioré

- **Logique de filtrage des opérations** : Amélioration du filtrage Nature (Extra/Standard)
  - Détection des opérations mixtes (montants à la fois Extra et Standard)
  - Opérations mixtes visibles dans les deux filtres (Extra ET Standard)
  - Calcul des montants effectifs dans `useOperationsData` au lieu du filtrage dans `usePlanner`

- **Architecture des hooks** : Refactorisation complète pour améliorer la maintenabilité
  - Création de `hooks/filterBar/useFilterBarLogic.tsx` (538 lignes) pour la logique des filtres
  - Création de `hooks/operations/` avec 4 hooks spécialisés (useOperationsFilters, useOperationsSorting, useOperationsData)
  - Création de `hooks/transactions/useTransactionForm.ts` (500 lignes) pour la gestion des formulaires
  - Création de `hooks/transfers/` avec useTransfersData et useTransfersFilters
  - Création de `hooks/budget/` avec useBudgetActions et useBudgetBalances
  - Ajout de JSDoc complet à tous les nouveaux hooks
  - OperationsView réduit de ~600 à ~326 lignes (-45%)
  - VariableTransactionForm réduit de ~363 à ~151 lignes (-58%)

- **Bouton Reset des filtres** : Amélioration de la visibilité et du comportement
  - Détection de l'état par défaut (`isDefaultFilters`) distincte de "tous les filtres désactivés"
  - Bouton toujours visible avec styling adaptatif (grisé si défaut, rouge si modifié)
  - Tooltips contextuels ("Filtres déjà par défaut" vs "Réinitialiser aux filtres par défaut")

### Corrigé

- **Crash validation dans PlannerModals** : Suppression de la référence obsolète `tagIds: selectedTags`
  - Résolution de ReferenceError lors de la validation d'opérations
  - Les `tagAmounts` sont correctement préservés via le spread operator

- **Positions manuelles** : Correction de la détection des positions manuelles vs automatiques
  - Ajout du seuil `< 1_000_000` dans `getManualPosition()` helper
  - Alignement des fonctions de scoring entre `usePlanner.ts` et `useOperationsSorting.ts`
  - Réduction de AUTO_BASE de 100B → 10M → 1M pour cohérence

### Technique

- **Refactorisation Architecture** : Application des principes SOLID et Atomic Design
  - Séparation claire des responsabilités (SRP)
  - Composition de hooks spécialisés plutôt que composants monolithiques
  - Logique métier isolée dans des hooks réutilisables
  - Réduction de la duplication de code (DRY)

- **Documentation Technique** :
  - Ajout de JSDoc complet sur 15+ hooks avec exemples d'utilisation
  - Documentation des cas d'usage et des patterns de composition
  - Clarification des dépendances et du flux de données

**Commits** :

- Improve manual position logic and filtering in planner (4e1c770)
- Refactor manual sorting logic for operations (edc5a05)
- Refactor operations and forms logic into custom hooks (4b264c6)

---

## [2.1.0] - 2026-01-07

### Changé

- **Restructuration de la documentation** :
  - Consolidation de tous les fichiers SQL dans `startup/database_complete.sql`
  - Création du dossier `startup/` avec guides de déploiement (Supabase, Vercel)
  - Réécriture complète du README avec documentation exhaustive de toutes les fonctionnalités
  - Suppression du dossier `migrations/` (migrations consolidées dans le fichier SQL principal)
  - Suppression du dossier `docs/` (documentation intégrée dans les fichiers SQL et README)
  - Suppression des noms propres dans les exemples de formulaires

**Commit** : Refactor tags and extra system, update docs and migrations (7ae00bc)

---

## [2.0.0] - 2026-01-07

### Ajouté

- **Système de Tags avec Montants** : Ventilation granulaire des opérations par tags avec montants spécifiques
  - Table `paid_item_tags` pour stocker les associations tag/montant
  - Composant `TagAmountSelector` pour gérer la ventilation dans les formulaires
  - Support de la ventilation partielle (montant non affecté autorisé)
  - Affichage des montants par tag dans les listes d'opérations
  - Migration automatique des anciens tags simples vers le nouveau système

- **Système Extra à Deux Niveaux** : Gestion flexible des dépenses hors budget
  - Niveau opération : Toggle global "Dépense temporaire / Exceptionnelle"
  - Niveau tag : Marquage individuel des montants Extra par tag (⭐)
  - Détection automatique : Une opération est Extra si le toggle global est activé OU si au moins un tag est marqué Extra
  - Filtrage cohérent avec le badge visuel "EXTRA" dans les listes

- **Calculs Contextuels** : Les totaux s'adaptent aux filtres actifs
  - Calcul des montants basé sur les tags filtrés
  - QuickPeriodSummary reflète les montants filtrés
  - Support des opérations mixtes (plusieurs tags dont certains filtrés)

- **Toast Notifications** : Système de feedback visuel amélioré
- **Validation Formulaires** : Gestion des erreurs renforcée

### Changé

- **Architecture Tags** : Migration complète du système `tagIds` vers `tagAmounts`
  - Suppression des colonnes `tag_ids` (JSONB) dans toutes les tables
  - Nouvelle table relationnelle `paid_item_tags` avec foreign keys CASCADE

### Corrigé

- **Filtrage Extra** : Les opérations avec tags Extra individuels apparaissent dans le filtre "Nature: Extra"
- **Calculs Soldes** : Les totaux utilisent les montants affectés aux tags filtrés

## [1.5.0] - 2026-01-06

### Ajouté

- **Authentification Utilisateur** : Système de login avec Google via Supabase Auth
  - Gestion des sessions utilisateur
  - Protection des routes
  - Whitelist des utilisateurs autorisés

- **Gestion des Utilisateurs Autorisés** : Interface d'administration
  - Liste des utilisateurs avec statut d'autorisation
  - Toggle pour activer/désactiver l'accès
  - Notes administratives par utilisateur
  - Historique de connexion

- **Graphiques Dashboard** : Amélioration des visualisations
  - Type safety renforcé
  - Nouveaux graphiques analytiques

### Changé

- **Refactorisation Configuration** : Structure des composants améliorée
  - Séparation claire des responsabilités
  - Atomic Design appliqué

### Corrigé

- **Validation Données** : Contrôles renforcés sur les formulaires et la DB
- **Typage TypeScript** : Amélioration de la sécurité des types

## [1.4.0] - 2026-01-05

### Ajouté

- **PWA (Progressive Web App)** : Support complet de l'installation
  - Service Worker pour mise en cache
  - Manifest.json statique pour installation
  - Support offline basique
  - Icônes et splash screens

- **Tri Manuel des Opérations** : Interface drag & drop
  - Réorganisation des opérations par glisser-déposer
  - Persistance de l'ordre personnalisé
  - Système de position avec BigInt

- **Réinitialisation des Filtres** : Bouton pour remettre les filtres par défaut

- **Navigation par Swipe** : Gestion tactile entre les vues
  - Support mobile natif
  - Détection des zones scrollables
  - Transitions fluides

### Changé

- **Refactorisation UI** : Migration vers structure Atomic Design
  - Components/ui/atoms, molecules, organisms
  - Meilleure réutilisabilité

## [1.3.0] - 2026-01-02

### Ajouté

- **Gestion Avancée des Remboursements** :
  - Détection automatique (catégories type EXPENSE)
  - Déduction des dépenses dans les calculs
  - Badge visuel distinctif

- **Analyse Dashboard Enrichie** : Nouveaux graphiques et métriques
  - Agrégation annuelle des dépenses
  - Analyse des flux de trésorerie
  - Visualisation des revenus récurrents

### Changé

- **Formulaire Transactions** : Amélioration de l'UX
  - Validation temps réel
  - Messages d'erreur contextuels

### Corrigé

- **Calculs Revenus** : Alignement avec le strict cashflow
  - Filtrage correct des revenus récurrents
  - Sommes cohérentes dans tous les composants

## [1.2.0] - 2025-12-30

### Ajouté

- **Système de Tags** : Filtrage des opérations par tags personnalisés
  - Création et gestion des tags avec couleurs
  - Filtrage inclusif/exclusif
  - Affichage visuel dans les listes
  - Présence/absence de tags

- **Amélioration Barre de Filtres** : Interface enrichie
  - Multi-critères (flux, source, statut, nature, tags)
  - Filtrage par comptes et bénéficiaires
  - Persistance entre sessions

### Changé

- **Refactorisation Filtres** : Plus grande flexibilité
  - Support de conditions complexes
  - Performance optimisée

## [1.1.2] - 2025-12-28

### Ajouté

- **Navigation Multi-Modes** : Choix de la portée d'affichage
  - Vue par période (semaine/personnalisée)
  - Vue mensuelle globale
  - Sélecteur de périmètre dans l'interface

- **Scope Selection** : Navigation temporelle améliorée

## [1.1.1] - 2025-12-24

### Ajouté

- **Modèle Transfers** : Gestion des virements internes
  - Vue dédiée aux transferts entre comptes
  - Séparation virements/épargne
  - Prévention double comptabilisation

- **Import Automatique de Libellés** :
  - Import des libellés CB depuis transactions existantes
  - Import des libellés VIR (virements)
  - Évite les doublons automatiquement

- **Horodatage Transactions** :
  - Colonne `createdAt` ajoutée
  - Tri chronologique précis
  - Historique complet des modifications

### Changé

- **Refonte DataList** : Amélioration du composant de liste
  - Performance optimisée
  - Affichage responsive

### Corrigé

- **Tri des Transactions** : Ordre cohérent basé sur createdAt

## [1.1.0] - 2025-12-23

### Ajouté

- **Cartes Analytiques Dashboard** : Nouvelles visualisations
  - Synthèse financière
  - Tendances mensuelles
  - KPIs personnalisés

### Changé

- **Refactorisation Configuration/Planner** : Séparation des responsabilités
  - Planner pour le suivi mensuel et pointage
  - Configuration pour paramètres structurels (comptes, membres, catégories)
  - Logique métier rapprochée de l'action

### Corrigé

- **Prévention Appels API** : Évite les appels quand Supabase non configuré
  - Amélioration de la robustesse
  - Messages d'erreur clairs

## [1.0.2] - 2025-12-22

### Ajouté

- **Flag isSalary** : Classification des revenus structurels
  - Distinction salaires/autres revenus
  - Filtrage dédié dans l'interface
  - Calculs d'équité ajustés

- **Type Transaction Interne** : Gestion des transferts
  - Évite la double comptabilisation
  - Filtre "Virement Interne" dédié
  - Catégorie spéciale

- **Calcul Dépenses Variables Amélioré** : Vue Balances optimisée
  - Prise en compte de la période courante
  - Totaux cohérents par semaine

### Changé

- **Restructuration Routing** : Architecture des composants
  - Séparation claire des vues
  - Navigation plus intuitive
  - App.tsx simplifié

- **Budget Planner & Config** : Clarification des rôles
  - Planner = Suivi opérationnel
  - Config = Réglages structurels

## [1.0.1] - 2025-12-20

### Ajouté

- **Libellés Sauvegardés** : Suggestions intelligentes
  - Auto-complétion des libellés fréquents
  - Gestion par type de compte (courant/épargne)
  - Distinction dépenses/revenus
  - Gain de temps de saisie

- **Transactions Variables** : Gestion complète
  - Suivi des opérations ponctuelles
  - Interface CRUD dédiée
  - Distinction récurrent/variable dans les calculs

### Changé

- **Consolidation Composants UI** : Amélioration des formulaires
  - Composants réutilisables standardisés
  - Validation unifiée
  - Styles cohérents

## [1.0.0] - 2025-12-19

### Ajouté

- **Vue Balances** : Suivi complet des soldes
  - Ratios cibles par compte
  - Solde personnel total
  - Distribution budgétaire
  - Support comptes joints

- **PWA Initial** : Première version Progressive Web App
  - Installation sur écran d'accueil
  - Icônes et splash screens
  - Configuration de base

- **Gestion Épargne** : Transactions d'épargne dédiées
  - Comptes d'épargne séparés
  - Suivi des mouvements
  - Objectifs de capitalisation

- **Analyse Détaillée Dashboard** :
  - Graphiques de tendances
  - Répartition par catégories
  - Projections budgétaires
  - Statistiques avancées

### Changé

- **Configuration Environnement** : Variables d'env sécurisées
  - `SUPABASE_PROJECT_ID` et `SUPABASE_ANON_KEY`
  - Remplacement de localStorage volatile
  - Meilleure sécurité

- **Documentation** : README et instructions Copilot
  - Guide d'installation complet
  - Conventions de développement
  - Architecture expliquée

### Corrigé

- **Configuration Supabase** : Instructions améliorées
  - Setup plus clair
  - Gestion des erreurs

## [Beta] - 2025-12-18

### Ajouté

- **Tooltips Mobile** : Affichage via portals
  - Gestion contextuelle
  - Touch-friendly
  - Positioning intelligent

- **Sous-Catégories** : Support hiérarchique complet
  - Revenus et dépenses
  - 2 niveaux de granularité
  - Filtrage avancé

- **Enveloppe Mensuelle** : Configuration budgétaire
  - Adaptation automatique aux périodes
  - Répartition proportionnelle
  - Paramétrage flexible

### Changé

- **Amélioration Analyses** : Calculs optimisés
  - Montants prévus vs réels
  - Affichage des écarts
  - Visualisations enrichies

### Corrigé

- **Page Blanche au Démarrage** : Problème d'importmap résolu
- **Gestion Erreurs DB** : Messages utilisateur clairs
- **Calculs Semaines** : Affichage montants prévus correct

## [Alpha] - 2025-12-17

### Ajouté

- **Hooks Personnalisés** : Extraction logique métier
  - `useBudget` : Hub central des données
  - `usePlanner` : Génération instances mensuelles
  - `useConfigurationUI` : État interface
  - Separation of Concerns appliquée

- **Support Sous-Catégories** : Granularité accrue
  - Configuration par opération
  - Filtrage sur 2 niveaux
  - Rapports détaillés

### Changé

- **Clarification Nomenclature** : `ownerId` → `accountId`
  - Cohérence terminologique
  - Code plus lisible et maintenable

- **Simplification Logique Planner** : Initialisation optimisée
  - Moins de calculs redondants
  - Performance améliorée

### Corrigé

- **Alignement Icônes SearchBar** : Styles CSS corrigés
- **Style Alertes Solde** : Amélioration visuelle
- **Focus Styles** : Accessibilité améliorée

## [Initial] - 2025-12-14 to 2025-12-16

### Ajouté

- **Intégration Supabase** : Persistance données PostgreSQL
  - Configuration complète
  - Row Level Security (RLS) activé
  - Migrations SQL structurées
  - Real-time optionnel

- **Bénéficiaire Revenus** : Attribution des revenus
  - Calculs d'équité automatiques
  - Traçabilité des contributions
  - Support enfants (exclusion des calculs)

- **Structure Projet Initiale** :
  - React 19 + TypeScript strict
  - Tailwind CSS pour le styling
  - Vite comme build tool
  - Architecture composants modulaire
  - Lucide React pour les icônes
  - Recharts pour les graphiques

### Documentation

- README détaillé avec setup complet
- Instructions de configuration Supabase
- Schéma de base de données commenté
- Guide de contribution

---

## Versions Précédentes (Avant refonte majeure)

## [1.1.1] - 2025-05-21

### Ajouté

- Migration SQL automatique pour les installations existantes

### Corrigé

- Problème de navigation "page blanche" lié à l'importmap

## [1.1.0] - 2025-05-20

### Ajouté

- **Composant InfoBox** : Onboarding et aide contextuelle
- **Mode Dual dans le Planner** : Sélecteur `Suivi Mensuel` vs `Modèles Récurrents`

### Changé

- **Refonte Ergonomique** : Déplacement logique "Opérations" vers l'Échéancier

## [1.0.0] - 2025-05-15

- Version initiale de l'application (première release publique)
