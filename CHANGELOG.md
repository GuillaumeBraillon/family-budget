# Journal des modifications (Changelog)

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
et ce projet respecte le [Versionnage Sémantique](https://semver.org/spec/v2.0.0.html).

---

## [2.9.6] - 2026-03-13

### ✅ Corrections

- Inclusion des revenus (`INCOME`) dans les calculs des montants en attente : les totaux `Récurrentes` / `Variables` et les montants `En retard` prennent désormais en compte les revenus non-salariaux (somme dépenses - revenus).
- Correction du calcul des détails par compte : les montants nets négatifs sont conservés (ne sont plus filtrés) et contribuent correctement au total.
- Exclusion explicite des salaires (`isSalary`) des totaux en attente.

### 🔧 UI / Améliorations

- `PendingOperationsCard` : affichage des signes inversé pour une lecture claire « à payer » (total, sous-totaux, tooltip et retards).
- `FamilyVariableBalanceCard` : harmonisation des signes, enrichissement du tooltip avec le détail du calcul du solde de période (budget du mois, report, base budget / période, nombre de périodes et valeur `period_value`).
- Transmission de `monthBudget`, `periodsCount` et `period_value` depuis `useBalancesData` → `DashboardView` → `FamilyVariableBalanceCard` pour un affichage exact et cohérent.

### 🧰 Maintenance

- Correction d'avertissements ESLint dans `UsersManager.tsx` (suppression du `any` implicite et du paramètre `catch` inutilisé).
- Passe `eslint --fix` appliquée sur les fichiers modifiés.

## [2.9.5] - 2026-03-10

### ✅ Corrections

- Correction du comportement de réorganisation (drag & drop) : l'insertion se fait désormais correctement avant/after la cible selon la direction du déplacement.
- Normalisation et déduplication automatique de `operations_sorting` pour réparer les entrées mixtes (ex: `c_noveo-2026-03` vs `c_noveo`) et garantir un tri stable cross-mois.

### 🔧 Notes techniques

- `moveItem` (hook `useBudget`) : normalise et déduplique l'array `operations_sorting` avant d'écrire pour auto-réparer les données corrompues.
- `usePlanner` et `useOperationsSorting` : lecture plus robuste du tableau `operations_sorting` via format stable pour éviter les comportements inconsistants.

## [2.9.4] - 2026-03-09

### ✅ Corrections

- `authorized_users` : ajout des champs `last_login_at`, `notes` et `is_admin` dans le chargement initial (`fetchInitialData`) pour corriger les affichages manquants côté UI.
- `UsersManager` : correction de l'affichage de "Dernière connexion" (parsing date robuste) et affichage fiable des notes.
- `MobileTooltip` : correction du découpage hors écran (positionnement intelligent haut/bas + gestion du débordement vertical).

### ✨ Améliorations

- Gestion Admin : ajout du mapping `is_admin` → `isAdmin`, badge `ADMIN` dans la liste utilisateurs, et restriction des vues `Soldes`, `Comptes`, `Analytics`, `Réglages` pour les non-admins.
- Navigation Header : recentrage cohérent du menu (desktop/mobile), avec alignement toujours centré demandé.
- `MonthSelector` : affichage année seule, suppression de prop inutile (`currentDate`), optimisation du composant (`React.memo`, callbacks memoïsés, accessibilité boutons).

### ♻️ Refactor UI

- Harmonisation des cartes Balances (`PersonalBudgetSummary`, `FamilyVariableBalanceCard`, `PendingOperationsCard`) avec usage de `Card`, `CardHeader`, `CardTitle`, `CardContent`.
- Uniformisation styles/espacements/ombres/typo des sous-cartes pour une cohérence visuelle complète.
- Clarification du tooltip "Budget Famille" avec libellés explicites et métriques mieux alignées avec les valeurs affichées.

## [2.9.3] - 2026-03-09

### ✨ Améliorations

- `PendingOperationsCard` : ajout de l'affichage explicite des montants **en retard** (récurrentes et variables), séparés des montants totaux en attente.
- `DashboardView` : calcul dédié des retards basé sur les périodes précédentes non pointées (`weekNumber < activeWeek`) pour les dépenses `RECURRING` et `VARIABLE`.

### ♻️ Refactor

- Harmonisation globale du naming des montants avec suffixe `Amount` sur le flux `useBalancesData` → `DashboardView` → cartes Balances/Dashboard.
- Standardisation des callbacks métier de navigation des cartes : `onNavigateToOperations` (au lieu d'un mix `onNavigate`/`onNavigateToOperations`).
- `ClickableAmount` rendu plus robuste : props de navigation optionnelles avec fallback non cliquable sans branche conditionnelle côté parent.

### 🧹 Nettoyage

- Mise à jour des JSDoc et exemples pour refléter la nouvelle convention de nommage.
- Suppression des alias/variables obsolètes après renommage (cohérence et maintenabilité).

## [2.9.2] - 2026-03-09

### ✅ Corrections

- Correction du calcul de report (carryover) : le report utilise désormais uniquement les montants Standard réellement pointés (`realStandard`), excluant les montants Extra et les montants en attente. Ceci corrige des budgets de période négatifs inattendus.
- Suppression des logs de débogage temporaires introduits lors de l'enquête (cleanup de la sortie console).

### ✨ Améliorations & Fonctionnalités

- UI : intégration et utilisation du composant `BudgetProgressBar` dans `FamilyVariableBalanceCard` et `PersonalBudgetSummary` (affichage du pourcentage, gestion visuelle du dépassement, label positionné dynamiquement).
- `PersonalBudgetSummary` : restructuration responsive et affichage par bénéficiaire (disponible / dépensé / reste) avec barre de progression par bénéficiaire.
- `FamilyVariableBalanceCard` : alignements et layout améliorés (titres à gauche, montants centrés et alignés en haut, bloc "En attente" collé en bas).

### 🧠 Logique métier

- `useOperationsData` : correction du comptage par bénéficiaire quand un filtre `beneficiaryIds` est actif — les `quickStats` prennent désormais en compte la ventilation `beneficiaryAmounts` (proportionnalisation) au lieu d'attribuer le montant total à chaque bénéficiaire.

### 🔧 Transfers / Périodes

- `TransfersView` : branchement sur `usePlanner` pour alimenter `PeriodNavigationBar` et affichage du sélecteur de périodes (ex. `1-7 | 8-14 | 15-21 | 22-28`).
- `useTransfersData` : ajout du support `scope`/`activeWeek`/`periodBudgets` et filtrage temporel (`MONTH` vs `PERIOD`) pour que la `DataList` n'affiche que les mouvements de la période active.

### ♻️ Refactor

- Centralisation de la navigation : création de `constants/navigation.ts` regroupant `NAV_ITEMS`, `ViewState` et l'ordre des vues ; `Header.tsx` et `App.tsx` consomment désormais cette source unique (icônes centralisées aussi).

### 🧪 Tests

- Ajout d'un test unitaire dédié `tests/useOperationsData.test.ts` pour verrouiller la ventilation bénéficiaires (ex: opération 12,10€ ventilée 8€ / 4,10€ → `quickStats` renvoie bien 8€ pour Guillaume et 4,10€ pour Person A quand filtré).

### 🧰 Divers

- `index.html` : suppression du log `console.log("SW registered")` lors de l'enregistrement du service worker (réduction du bruit console).

## [2.9.1] - 2026-03-07

### ✨ Améliorations UI

- Ajout du composant `BudgetProgressBar` (Dashboard/components) : affiche le pourcentage, gère le dépassement visuel, propose des dégradés et un badge/animation pour montrer consommé vs budget.
- `FamilyVariableBalanceCard` : import et intégration de `BudgetProgressBar` ; simplification de la logique d'arrondi ; mise à jour du layout, des espacements, de la typographie et du style des cartes ; affichages convertis en entiers arrondis avec suffixe € ; ajustement des styles de `ClickableAmount` et suppression des puces séparatrices.
- `PendingOperationsCard` : ajustement des tailles, espacements et typographie ; passage du layout en grille ; ajout d'ombres subtiles et d'effets au survol pour les cartes enfants ; mise en valeur renforcée du montant restant.
- `PersonalBudgetSummary` : renommage de l'en-tête pour inclure « (Mensuel) » ; restructuration en colonnes responsives pour Disponible et Dépensé ; ajout de lignes par bénéficiaire et des totaux ; réorganisation des styles pour une lecture claire.
- `DashboardView` : réordonnancement des composants (PersonalBudgetSummary / FamilyVariableBalanceCard / PendingOperationsCard) et raccordement des handlers de navigation correspondants.

Ces changements sont centrés sur l'expérience utilisateur et la visualisation claire du budget ; aucune logique d'API n'a été modifiée.

## [2.9.0] - 2026-03-05

### ✨ Fonctionnalités (Features)

#### **Vue Analytics (nouvelle vue dédiée)**

- Ajout de `AnalyticsView` (`components/features/Analytics/AnalyticsView.tsx`) : orchestrateur de la vue "Analytique" accessible depuis le header.
- Migration des composants graphiques du dashboard vers `components/features/Analytics/charts/` :
  - `AnnualBeneficiaryAnalysis.tsx` : analyse annuelle par bénéficiaire
  - `AnalyticsCards.tsx` : cartes KPI analytiques
  - `AnnualIncomeAnalysis.tsx` : analyse des revenus annuels
  - `AnnualExpensesCard.tsx` : carte dépenses annuelles
- Suppression de `components/features/Dashboard/components/charts/` (composants déplacés).
- `Header.tsx` et `App.tsx` : ajout de l'onglet `analytics` dans la navigation principale.

#### **Navigation de période partagée (`PeriodNavigationContext`)**

- Nouveau contexte `contexts/PeriodNavigationContext.tsx` exposant `usePeriodNav()` : `currentDate`, `scope`, `activeWeek`, `setCurrentDate`, `setScope`, `setActiveWeek`, `handlePrevMonth`, `handleNextMonth`.
- Nouveau composant `components/ui/molecules/PeriodNavigationBar.tsx` : barre de navigation réutilisable lisant l'état depuis le contexte ; accepte `filteredPeriodBudgets` et un slot `children`.
- `App.tsx` enveloppé avec `PeriodNavigationProvider` : toutes les vues partagent le même mois/période/semaine.
- Migration de `DashboardView`, `BalancesView`, `OperationsView` et `TransfersView` pour consommer `usePeriodNav()` au lieu d'un état local dupliqué.

#### **Soldes de comptes contextuels (nouveau hook)**

- Nouveau hook `hooks/accounts/useAccountBalancesAtDate.ts` : recalcule rétroactivement les soldes de tous les comptes à la fin de la période/mois sélectionné en annulant les opérations postérieures à la date de coupure (`paidItems`, `variableTransactions`, `transfers`).
- `SavingsSummaryCard` affiche désormais les soldes ajustés à la période active et réagit à `PeriodNavigationBar`.
- Granularité jour en mode `PERIOD` : la coupure correspond au `endDate` de la période sélectionnée.

#### **Support multi-bénéficiaires sur les opérations pointées**

- Nouveau type `BeneficiaryAmount { beneficiaryId, amount }` dans `types.ts`.
- Nouvelle table PostgreSQL `paid_item_beneficiaries` avec contrainte `UNIQUE(paid_item_instance_id, beneficiary_id)` et FK CASCADE, indexée et soumise à RLS.
- `fetchInitialData` (`services/api.ts`) : chargement parallèle de `paid_item_tags` et `paid_item_beneficiaries` scopé aux `paid_items` du mois ; mapping via `mapDbBeneficiaryAmount`.
- RPC `upsert_paid_item_with_tags` étendue : accepte `p_beneficiary_amounts jsonb` (requis, min 1 entrée) ; insère/replace dans `paid_item_beneficiaries` en transactionnel ; validation SQL de la somme des montants bénéficiaires.
- `services/apiCrud.ts` : helper `normalizeBeneficiaryAmountsForRpc` ; import CB enrichi pour résoudre le bénéficiaire principal depuis `paid_item_beneficiaries`.
- `usePlanner.ts` : helper `getValidBeneficiaryAmounts` — reconstruit `beneficiaryAmounts[]` pour chaque `PlannedItem` à partir de `paidDetails.beneficiaryAmounts` avec fallback sur `beneficiaryId` legacy.
- `hooks/balances/useBalancesData.ts` : toute la logique métier (consommation personnelle, family variable, carryover) utilise désormais `beneficiaryAmounts[]` via `getBeneficiaryStandardShare` / `getBeneficiaryExtraShare` / `resolveBeneficiaryAmounts`.

#### **Budget famille variable**

- `familyVariableBudgetRemaining` calculé sur `realStandard` uniquement (dépenses réelles pointées, sans extras, sans attentes) pour cohérence avec `displayedFamilyNet`.
- Nouveau champ `family_variable_budget` dans `app_settings` (migration 009) ; `AppSettings` mis à jour.

#### **Auto-import de libellés à la sortie du Planner**

- `App.tsx` : `useEffect` surveille `currentView` ; déclenche `actions.importLabels()` / `actions.importVirLabels()` automatiquement dès que l'utilisateur quitte la vue `planner` si de nouvelles opérations CB/VIR ont été saisies.
- Feedback via `Toast` : succès avec nombre de libellés importés, info si aucun nouveau, erreur en cas d'échec.
- `OperationsView` notifie `onVariableCreated(type)` pour chaque nouvelle transaction variable.

### 🔄 Refactorisations (Refactoring)

#### **BalancesView simplifiée**

- Suppression de `BalancesHeader.tsx` (header dédié supprimé, navigation absorbée par `PeriodNavigationBar`).
- Suppression de `BudgetDistributionSummary.tsx` (résumé de répartition budgétaire supprimé).
- `BalancesView` allégée : tri manuel conservé via `useAccountsSorting`, données déléguées à `useBalancesData` + `useBalancesRows`.

#### **Dashboard simplifié**

- Suppression de `BalancesOverview.tsx` : `PendingOperationsCard` et `FamilyVariableBalanceCard` intégrées directement dans `DashboardView`.
- Suppression de `DashboardHeader.tsx` (remplacé par `PeriodNavigationBar`).
- `SavingsSummaryCard` : refactorisation complète — suppression du recalcul interne via `transfers`/`paidItems` (remplacé par `useAccountBalancesAtDate`) ; grille 5 colonnes (`lg:grid-cols-5`) ; UI compacte (`p-2`, icône `w-8`, texte `text-xs`).

#### **Configuration — suppression du concept d'Enveloppe mensuelle**

- Suppression de `CarryoverStrategyCard.tsx` et `WeeklyEnvelopeCard.tsx`.
- `PeriodSettingsCard.tsx` et `GlobalSettings.tsx` nettoyés : suppression de `monthly_envelope` et `carryover_strategy`.
- `AppSettings` : `monthly_envelope` et `CarryoverStrategy` supprimés ; remplacés par `personal_budget_amount` et `family_variable_budget`.

#### **Centralisation des filtres**

- `buildOperationsFilters` (`services/financeUtils`) : source unique pour les valeurs par défaut de `OperationFilters`.
- `useOperationsFilters`, `useFilterBarLogic`, `FamilyVariableBalanceCard` : tous utilisent `buildOperationsFilters`.

### 🗄️ Base de données (Migrations)

| Migration | Description                                                                                                                      |
| --------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `006`     | Suppression de `beneficiary_id` de `paid_items` — ventilation exclusivement via `paid_item_beneficiaries`                        |
| `007`     | Ajout de `is_refund boolean DEFAULT false` sur `paid_items`                                                                      |
| `008`     | Backfill et persistance de `is_salary boolean` sur `paid_items`                                                                  |
| `009`     | Ajout de `family_variable_budget numeric DEFAULT 0` sur `app_settings` ; renommage `monthly_envelope` → `personal_budget_amount` |

### 🧹 Suppressions et nettoyage

- Fichiers supprimés : `BalancesHeader.tsx`, `BudgetDistributionSummary.tsx`, `DashboardHeader.tsx`, `BalancesOverview.tsx`, `CarryoverStrategyCard.tsx`, `WeeklyEnvelopeCard.tsx`, tous les composants charts dans `components/features/Dashboard/components/charts/`.
- Suppression des imports `logger` inutilisés dans `OperationsView.tsx`, `useBudget.ts`, `usePlanner.ts`, `useAuth.ts`, `useAuthorization.ts`, `useCategoryAutoSuggest.ts`.
- Type `CarryoverStrategy` supprimé de `types.ts`.
- `usePlanner` : suppression de la limite de période calculée depuis `monthly_envelope` (`distributedLimit` fixé à 0 ; `periodLimit` conservé pour compatibilité UI si utilisé).

**Version actuelle :** 2.9.0 (5 mars 2026)

---

## [2.8.3] - 2026-02-23

### 🐛 Corrections de bugs (Bugfixes)

- **RPC `upsert_paid_item_with_tags` (Supabase/PostgREST)**
  - Correction de l'ambiguïté de signature en base (`p_type text` vs `p_type public.transaction_type`) pour éviter l'erreur :
    - _"Could not choose the best candidate function..."_
  - Alignement de la fonction SQL sur le schéma réel `paid_items` :
    - suppression de l'usage de la colonne legacy `date`
    - signature `p_type public.transaction_type`
    - validation renforcée de `tagId` et normalisation de `beneficiary_id` vide vers `NULL`

- **Flux frontend RPC (propre, sans bypass permanent)**
  - Retour à un mode **RPC-only** pour les écritures `paid_items` + `paid_item_tags`.
  - Journalisation d'erreurs SQL détaillées (code/message/details/hint) dans `apiCrud` pour diagnostiquer rapidement les incidents DB.
  - Normalisation defensive avant appel RPC : montant positif, conversion des remboursements legacy (`EXPENSE` négatif → `INCOME` positif), filtrage des `tagAmounts` invalides.

### ✨ Fonctionnalités (Features)

- **Nouveaux tests unitaires ciblés `apiCrud`**
  - Ajout du fichier `tests/apiCrud.test.ts` (5 tests) couvrant :
    - normalisation montant/type pour remboursements legacy
    - normalisation `beneficiaryId` vide vers `null`
    - filtrage des `tagAmounts` invalides
    - validation des champs obligatoires avant appel RPC
    - journalisation en cas d'erreur RPC

### 🧹 Nettoyage (Chores)

- Suppression des migrations SQL de rattrapage temporaires dans `supabase/migrations/` (contexte dev mono-instance).
- Consolidation de la **source SQL unique** dans `startup/database_complete.sql`.

---

## [2.8.2] - 2026-02-19

### ✨ Fonctionnalités (Features)

- **Extension majeure de la couverture de tests unitaires**
  - **130 nouveaux tests** (passage de 11 à 141 tests au total)
  - **4 nouveaux fichiers de tests** créés :
    - `apiMappers.test.ts` (23 tests) : Tests complets des conversions DB ↔ App
    - `tagAmounts.test.ts` (24 tests) : Validation de la ventilation des tags et calculs Extra/Standard
    - `periodCalculations.test.ts` (32 tests) : Tests des algorithmes de périodes budgétaires (FIXED_DAYS, CALENDAR_WEEKS, CUSTOM_SPLIT)
    - `helpers.test.ts` (51 tests) : Tests des utilitaires (formatage, validation, calculs)

### 🐛 Corrections de bugs (Bugfixes)

- **apiMappers.ts** : Ajout de `accounts_sorting: []` dans la valeur par défaut de `mapDbSettings()` (cohérence avec la structure complète d'`AppSettings`)
- **eslint.config.cjs** : Correction de la configuration ESLint flat config (v10.x)
  - Remplacement de `defineConfig()` et `globalIgnores()` par la syntaxe flat config standard
  - Déplacement des `ignores` en premier objet de configuration
  - Utilisation du spread operator `...fixupConfigRules(compat.extends(...))` au lieu de `extends` dans l'objet
  - Garantit que les fichiers de test (`tests/**`, `*.test.ts`, `*.test.tsx`) sont correctement ignorés
- **tests/apiMappers.test.ts** : Correction des erreurs TypeScript dans les tests
  - Renommage `paid_item_id` → `paid_item_instance_id` pour conformité avec `DbPaidItemTag`
  - Ajout des champs manquants `id` et `created_at` dans les objets de test `DbPaidItemTag`
  - Conversion des `id` de `DbSettings` de `number` vers `string` pour cohérence avec le schéma DB

### 📊 Couverture de Tests

#### **apiMappers.test.ts** (23 tests)

Tests de toutes les fonctions de mapping critiques pour l'intégrité des données :

- `mapDbPerson` : Conversion personnes avec gestion `isChild` et `displayOrder`
- `mapDbAccount` : Comptes avec types (CHECKING/SAVINGS), ratios et caps d'épargne
- `mapDbTag` + `mapDbTagAmount` : Tags et ventilation avec flags Extra
- `mapDbExpenseConfig` + `mapDbIncomeConfig` : Configurations récurrentes avec plages temporelles
- `mapDbPaidItem` : Opérations pointées avec tous les flags (isVariable, isWaiting, isExtra)
- `mapDbTransfer` : Virements standards et intérêts d'épargne
- `mapDbSettings` : Paramètres app avec valeurs par défaut robustes

#### **tagAmounts.test.ts** (24 tests)

Tests de la logique métier de ventilation des tags :

- **validateTagAmounts()** :
  - Ventilation partielle autorisée (somme tags < total)
  - Rejet si somme > total
  - Tolérance erreurs d'arrondi (±0.01€)
- **calculateExtraSum()** : Calcul montants hors budget
- **calculateStandardSum()** : Calcul montants dans budget
- **Scénarios complexes** : Ventilation mixte Extra/Standard, montants décimaux

#### **periodCalculations.test.ts** (32 tests)

Tests des algorithmes de découpage du mois et distribution budgétaire :

- **calculateDistributedBudget()** : Distribution proportionnelle selon nombre de jours (gestion février normal/bissextile, mois de 28/30/31 jours)
- **generateFixedDaysPeriods()** : Mode FIXED_DAYS avec gestion périodes partielles (dernière semaine)
- **generateCustomSplitPeriods()** : Mode CUSTOM_SPLIT avec parts égales (dernière part absorbe le reste)
- **calculateEqualBudgetPerPart()** : Budget égal par part
- **Scénarios réels complets** : Janvier/Février/Mars/Avril 2026 avec validation somme totale = budget mensuel

#### **helpers.test.ts** (51 tests)

Tests des utilitaires courants de l'application :

- **formatCurrency()** (9 tests) : Formatage euros avec signes +/- optionnels, gestion espaces insécables
- **formatDate()** + **formatDateShort()** (6 tests) : Formatage dates françaises
- **isInMonth()** (5 tests) : Vérification appartenance au mois
- **calculatePercentage()** (8 tests) : Calculs pourcentages avec arrondis
- **isValidEmail()** (9 tests) : Validation emails (regex robuste)
- **truncateText()** (6 tests) : Troncature avec ellipsis
- **generateId()** (4 tests) : Génération IDs uniques avec préfixes
- **Scénarios d'intégration** (4 tests) : Combinaisons réalistes (budget + pourcentage, transaction avec date)

### 🔍 Méthodologie de Tests

- **Tests unitaires purs** : Fonctions helpers isolées, pas de dépendances React
- **Cas limites** : Valeurs nulles, décimales complexes, mois particuliers (février)
- **Validation métier** : Règles strictes (somme tags, distribution budgétaire)
- **Reproductibilité** : Exemples chiffrés réalistes (budgets 2000-2500€, mois 2026)

### 🚀 Améliorations (Enhancements)

- **Qualité code** : 141 tests passent (100% de réussite)
- **CI/CD** : Integration automatique via GitHub Actions
- **Maintenabilité** : Tests documentés avec commentaires explicatifs
- **Non-régression** : Protection contre les bugs futurs sur les calculs critiques

---

## [2.8.1] - 2026-02-19

### 🐛 Corrections de bugs (Bugfixes)

- **Refactoring majeur : Pattern `setState` dans `useEffect`**
  - Migration de tous les `setState()` synchrones dans `useEffect` vers le pattern `setTimeout(() => setState(), 0)` avec cleanup
  - Conformité avec la règle stricte `react-hooks/set-state-in-effect` d'ESLint 8.x (prévient les cascades de renders)
  - **Fichiers modifiés** :
    - `App.tsx` : Initialisation `plannerContext`
    - `PeriodSettingsCard.tsx` : Synchronisation avec les props de paramètres
    - `ExpenseRulesEditor.tsx` : Calcul automatique de `endMonth`
    - `IncomeEditor.tsx` : Calcul automatique de `endMonth`
    - `FormInputs.tsx` : Mise à jour des suggestions filtrées (catégories)
    - `MobileTooltip.tsx` : Ajustement de position du tooltip
    - `useTransactionForm.ts` : Initialisation du formulaire à l'ouverture
    - `useTransferForm.ts` : Initialisation et ajustement automatique des montants
  - Alignement avec les meilleures pratiques React 18+ (déférer les updates hors de la phase de render)

- **Élimination des assignments inutiles**
  - `AccountManager.tsx` : Refactoring de `iconNode` avec expressions ternaires imbriquées
  - `FilterDropdown.tsx` : Conversion des `let` mutables en IIFE retournant un objet littéral
  - `useBalancesRows.ts` : Suppression de branche `else` redondante (variable déjà initialisée à 0), conversion `effectiveTransfer` en IIFE
  - `useTransfersData.ts` : Simplification de `deltaForAccount` avec expression ternaire unique

- **Nettoyage de code mort**
  - `useOperationsFilters.ts` : Suppression du ref inutilisé `hasAppliedInitialFilters` et de son import
  - `useTransactionForm.ts` : Suppression de lignes orphelines dupliquées (parsing error fix)
  - `ErrorContext.tsx` : Suppression du commentaire `eslint-disable` pour règle inexistante

### 🧹 Nettoyage (Chores)

- Configuration ESLint : Exclusion des fichiers de test (`**/tests/**`, `**/*.test.ts`, `**/*.test.tsx`) et du service worker (`**/public/sw.js`) pour éviter les warnings techniques légitimes.
- Suppression de l'ancien fichier `.eslintrc.cjs` (format obsolète remplacé par `eslint.config.cjs`).
- Maintien de `--max-warnings 0` pour le code de production (contrôle qualité strict sur le code applicatif uniquement).

---

## [2.8.0] - 2026-02-19

### ✨ Fonctionnalités (Features)

- Mise en place d'une stack de tests unitaires : `vitest` + `@testing-library/react` + `@testing-library/jest-dom`.
- Ajout de scripts npm : `test`, `test:watch`, `test:ui` pour lancer Vitest en local.

### 🚀 Améliorations (Enhancements)

- CI GitHub Actions : workflow `CI` exécutant `npm ci --legacy-peer-deps`, `prettier --check`, `tsc --noEmit`, `eslint` et `npm test` sur `push`/`PR`.
- Export de deux helpers de `usePlanner` pour testabilité : `hasExtraAmounts` et `hasStandardAmounts`.
- Ajout de tests unitaires pour :
  - `getDefaultAccountId` (tests utilitaire de sélection de compte)
  - `usePlanner` helpers (tests pour la logique Extra / Standard)
- Mise à jour des scripts `package.json` pour intégrer les checks de format et tests automatiques.

### 🧹 Nettoyage (Chores)

- Mise à jour d'`@typescript-eslint/parser` et `@typescript-eslint/eslint-plugin` (→ version compatible avec TypeScript 5.8).
- Ajout d'un hook `pre-commit` qui exécute `npm run fix` (Prettier + ESLint --fix + `tsc`) et ajoute automatiquement les modifications au commit. Ce hook synchronise toujours la version `package.json` avec le `CHANGELOG.md`.
- Formatage automatique des fichiers de tests/config pour respecter Prettier.

---

## [2.7.1] - 2026-02-19

### 🐛 Corrections de bugs (Bugfixes)

#### **Correction du type d'input date dans VariableTransactionForm**

- Correction typo : `type="form.date"` → `type="date"` (line 172)
- Impact : Date picker HTML5 s'affiche correctement, format cohérent avec `TransferForm`

### ✨ Fonctionnalités (Features)

#### **Bouton d'effacement pour les champs de catégorie**

- Ajout d'une croix (✖) dans `SearchableTextInput` pour nettoyer rapidement les sélections erronées
- Apparaît uniquement si la valeur n'est pas vide, hover → couleur rose
- Intégration dans `CategorySelector` (catégorie + sous-catégorie)
- Props `onClear?: () => void` exposée pour les callbacks personnalisés

### 🚀 Améliorations (Enhancements)

#### **Sélection intelligente du compte par défaut (isJoint)**

- Harmonisation complète de la logique à travers tous les formulaires (VariableTransactionForm, TransferForm)
- Priorité `isJoint` au lieu du "premier compte" pour meilleure UX en production
- Extraction en fonction utilitaire centralisée `getDefaultAccountId(accounts, filterChecking)` → [hooks/accounts/getDefaultAccountId.ts](hooks/accounts/getDefaultAccountId.ts)
- Élimine 18 lignes de code dupliqué

#### **Sélection intelligente du bénéficiaire par défaut (displayOrder)**

- Remplacement de la valeur en dur `p.name === "Famille"` par logique flexible basée sur `displayOrder`
- Appliqué dans :
  - `useTransactionForm.ts` (VariableTransactionForm)
  - `ExpenseRulesEditor.tsx` (création dépenses récurrentes)
  - `IncomeEditor.tsx` (création revenus récurrents)
- Avantage : Configuration automatique sans codage si le `displayOrder` change

### 🧹 Nettoyage (Chores)

- Code cleanup : suppression de 4 occurrences de `p.name === "Famille"` hardcodé
- Suppression du composant inutilisé `CalculationDetailsCard` → simplification de `BalancesView`
- Meilleure maintenabilité : sélections par ordre de priorité au lieu de noms fixes

## [2.7.0] - 2026-02-19

### ✨ Fonctionnalités (Features)

#### **Atomicité réelle des écritures `paid_items` + `paid_item_tags`**

- Ajout d'une RPC PostgreSQL transactionnelle `upsert_paid_item_with_tags`.
- L'upsert de l'opération et le remplacement des tags sont désormais exécutés dans une seule transaction côté base.
- Validation SQL intégrée : format JSON des tags, montants strictement positifs, somme des tags ≤ montant total.

### 🚀 Améliorations (Enhancements)

#### **Tri manuel unifié entre Operations et Transfers**

- Alignement du Drag & Drop Transfers sur le comportement Operations (capteurs, collisions, mode manuel).
- Introduction d'un hook générique réutilisable `useManualSorting` pour éviter la duplication de logique.
- Nouveau hook `useTransfersSorting` branché sur `app_settings.accounts_sorting`.
- Persistance Supabase des réordonnancements Transfers (source de vérité serveur), en cohérence avec `operations_sorting`.

#### **Performance du chargement initial**

- `fetchInitialData` ne charge plus toute la table `paid_item_tags`.
- Les tags sont désormais chargés uniquement pour les `instance_id` réellement récupérés dans `paid_items`.

#### **Configuration et sécurité Supabase**

- Standardisation de la configuration client via variables d'environnement `VITE_SUPABASE_*`.
- Nettoyage des flux de configuration legacy côté navigateur.

### 🧹 Nettoyage (Chores)

- Nettoyage des dépendances Vite : suppression des doublons entre `dependencies` et `devDependencies`, versions unifiées.
- Intégration des ajouts récents (tri manuel + RPC transactionnelle) dans `startup/database_complete.sql` pour bootstrap direct.
- Mise à jour de la documentation projet (`AUDIT_TECHNIQUE.md`, `README.md`, `copilot-instructions.md`).

---

## [2.6.27] - 2026-02-08

### 🚀 Améliorations (Enhancements)

#### **Refonte du Système de Tri Manuel : Passage à un Ordre Déterministe**

**Problème :** L'ancien système de tri basé sur une propriété `position` numérique était instable, causant des collisions de valeurs, des pertes d'ordre et un comportement imprévisible lors du glisser-déposer (drag & drop).

**Solution :** Remplacement complet du système de position par un **tri déterministe basé sur un tableau d'identifiants (`instance_id`)** stocké dans `app_settings.operations_sorting`. Ce changement garantit un ordre stable, persistant et sans collisions.

**Modifications Techniques :**

1.  **Base de Données (Supabase) :**
    - Ajout de la colonne `operations_sorting` (`text[]`) à la table `app_settings`.
    - Création d'un script de migration pour initialiser ce tableau avec l'ordre existant (basé sur la date).
    - Suppression de la colonne `position` de la table `paid_items` (dépréciée).

2.  **Hooks (`useBudget`, `useOperationsSorting`, `usePlanner`) :**
    - **`useOperationsSorting` :** La logique de tri manuel se base désormais sur l'index des `instance_id` dans le tableau `operations_sorting`. Les opérations non présentes dans le tableau sont ajoutées à la fin.
    - **`useBudget` :**
      - La fonction `moveItem` a été remplacée par `updateOperationsSorting` qui sauvegarde le nouvel ordre complet du tableau dans Supabase après un drag & drop.
      - Lors du pointage ou de la création d'une nouvelle opération, son `instance_id` est automatiquement ajouté au début du tableau de tri.
    - **`usePlanner` :** Le tri des opérations planifiées respecte maintenant l'ordre défini par `operations_sorting` pour une cohérence parfaite.

3.  **Composants (`OperationsView`) :**
    - Le `handleReorder` (glisser-déposer) a été simplifié pour mettre à jour l'ordre directement via `useBudget`.

**Impacts & Avantages :**

- ✅ **Stabilité Absolue :** L'ordre des opérations est maintenant 100% prévisible et contrôlé.
- ✅ **Zéro Collision :** La nature même du tableau d'identifiants uniques élimine tout risque de collision de positions.
- ✅ **Persistance Fiable :** Le tri manuel est conservé de manière robuste entre les sessions.
- ✅ **Simplicité :** Suppression de la logique complexe de calcul et de correction des positions numériques.

---

## [2.6.26] - 2026-02-05

### 🐛 Corrections de bugs (Bug Fixes)

#### **Navigation Dashboard**

- Correction du lien de navigation dans le tableau `GlobalMonthlyAnalysis` qui ouvrait le mauvais mois (inversion de l'index). Le clic sur une ligne mensuelle ouvre désormais correctement la vue détaillée du mois correspondant.

#### **Formulaires de Configuration**

- Correction de la saisie des montants dans `ExpenseRulesEditor` et `IncomeEditor`. Il est désormais possible de vider le champ ou de saisir des décimales sans que la valeur ne soit automatiquement convertie ou forcée à "0" à chaque frappe.

### 🧹 Nettoyage (Chores)

- Suppression de la dépendance `vite-plugin-pwa` inutilisée (la gestion PWA étant faite manuellement).

---

## [2.6.25] - 2026-02-03

### ✨ Fonctionnalités (Features)

#### **Amélioration de l'affichage des soldes**

- **Alerte de dépassement** : Ajout d'une alerte visuelle (texte rouge + icône ⚠️) dans le tableau des soldes lorsque le total des comptes courants dépasse le montant distribuable sur la période.
- **Détails contextuels** : Intégration d'un tooltip expliquant la cause de l'alerte au survol.

---

## [2.6.24] - 2026-02-03

### 🐛 Corrections (Bug Fixes)

#### **Calcul des soldes et opérations en attente**

- **Logique de signe (usePlanner)** : Correction critique du calcul des montants en attente. Les dépenses en attente sont désormais correctement déduites (négatives) et les revenus en attente ajoutés (positifs), au lieu de l'inverse.
- **Compte Joint (useBalancesRows)** : Ajustement du calcul du "Solde prévu" et du "Gap" (besoin de virement). Le solde prévu reflète maintenant correctement la projection financière (Solde Actuel + Opérations en attente), et le virement est calculé pour atteindre l'équilibre parfait (0€).

### 🔧 Modifications techniques

- `hooks/usePlanner.ts` : Inversion des signes dans le calcul de `remaining` et `remainingStandard`.
- `hooks/balances/useBalancesRows.ts` : Refonte du calcul de `jointTarget` et `jointGap` pour utiliser le solde projeté.

---

## [2.6.23] - 2026-02-02

### 🐛 Corrections de bugs

#### **Stabilité du tri lors du drag & drop (ordre DESC préservé)**

**Problème** :

- L'ordre de tri oscille entre ASC et DESC lors du drag & drop d'opérations
- Lors d'une renormalisation des positions, l'ordre était inversé à chaque déplacement
- Positions renormalisées en ASC (1000, 2000, 3000...) même quand le tri était en DESC (25000, 24000...)
- Résultat : opérations se retrouvent complètement inversées après un déplacement

**Solution** :

- Modification de la renormalisation dans `handleReorder` pour respecter l'ordre de tri actuel
- Si `sortOrder === 'desc'` → positions décroissantes : `(length - idx) * 1000` (25000, 24000...)
- Si `sortOrder === 'asc'` → positions croissantes : `(idx + 1) * 1000` (1000, 2000...)
- Rétrait des logs de debug devant plus être nécessaires

**Impact** :

- ✅ Tri reste stable pendant les opérations de drag & drop
- ✅ Ordre DESC préservé (plus récent en haut) après chaque déplacement
- ✅ Pas d'inversion aléatoire des listes
- ✅ Comportement prévisible et cohérent

**Fichiers modifiés** :

- `components/features/Operations/OperationsView.tsx` (fonction `handleReorder`)
- `hooks/operations/useOperationsSorting.ts` (suppression des logs de debug)

---

## [2.6.22] - 2026-02-02

### 🐛 Corrections de bugs

#### **Exclusion des salaires en attente des calculs de soldes**

**Problème** :

- Les salaires en attente (non pointés) étaient incorrectement inclus dans les calculs de soldes de comptes
- Cela gonflait artificiellement les montants "restant à payer" dans la vue Soldes
- Vision déformée des dettes réelles des comptes bancaires

**Solution** :

- Ajout d'une condition dans `calculatePeriodStatistics` pour exclure les salaires en attente
- Condition : `if (item.isSalary && item.isWaiting) return;`
- Les salaires déjà payés continuent d'être inclus normalement dans les calculs

**Impact** :

- ✅ Soldes de comptes plus précis (excluent les salaires non perçus)
- ✅ Vision réaliste des montants réellement dus
- ✅ Cohérence avec la logique métier (seuls les revenus perçus impactent les soldes)

**Fichier modifié** :

- `hooks/usePlanner.ts` (fonction `calculatePeriodStatistics`)

---

## [2.6.21] - 2026-01-31

### ♿ Accessibilité (WCAG 2.1 AA)

#### **Corrections pour conformité Vercel Accessibility Audit**

Résolution de 3 catégories d'avertissements d'accessibilité détectés par Vercel lors du déploiement en production :

**1. Taille minimale des cibles tactiles (WCAG 2.5.5 - Target Size)**

- **Problème** : Boutons d'info dans MobileTooltip inférieurs à 24px
- **Solution** : Ajout de `min-w-[24px]` et `min-h-[24px]` avec centrage flex
- **Conformité** : Toutes les cibles tactiles respectent maintenant le minimum de 24x24px
- **Fichier modifié** : `components/ui/MobileTooltip.tsx`

**2. Texte visible dans les noms accessibles (WCAG 2.5.3 - Label in Name)**

- **Problème** : Labels ARIA masquant le texte visible (ex: "Voir les infos" au lieu d'inclure le nom d'utilisateur)
- **Solutions** :
  - **UserMenu** : `aria-label` modifié de "Voir les infos du compte" à "Menu utilisateur {userName}" (inclut le nom visible)
  - **DataListRow** : Suppression de l'`aria-label` redondant (le texte visible + `role="button"` suffisent)
- **Conformité** : Les lecteurs d'écran annoncent maintenant correctement le texte visible
- **Fichiers modifiés** :
  - `components/Layout/UserMenu.tsx`
  - `components/ui/molecules/DataListRow.tsx`

**3. Hiérarchie des titres (WCAG 1.3.1 - Info and Relationships)**

- **Problème** : Utilisation de `<h3>` comme premier niveau de titre (sans `<h1>` ou `<h2>` parent)
- **Solution** : Remplacement de `<h3>` par `<h2>` dans le composant DataList
- **Rationale** : `<h2>` est le niveau approprié pour les titres de sections (pas de `<h1>` dans l'app car SPA)
- **Impact** : Navigation améliorée pour les lecteurs d'écran via structure sémantique correcte
- **Fichier modifié** : `components/ui/molecules/DataList.tsx`

**Résultat** :

- ✅ Tous les avertissements d'accessibilité Vercel résolus
- ✅ Conformité WCAG 2.1 niveau AA maintenue
- ✅ Meilleure expérience utilisateur pour navigation tactile et lecteurs d'écran
- ✅ Prêt pour déploiement en production sans warnings

---

## [2.6.20] - 2026-01-31

### 🐛 Corrections de bugs

#### **Correction du bug de navigation mensuelle (saut de mois en fin de mois)**

**Problème** :

- Quand on est le 31 d'un mois (31 janvier, 31 mars, etc.), cliquer sur "Mois suivant" sautait un mois
- Exemple : 31 janvier → Mars (au lieu de Février)
- Cause : JavaScript tente de créer "31 février" qui n'existe pas et déborde automatiquement sur mars

**Explication technique** :

```javascript
// ❌ Comportement incorrect
const date = new Date(2026, 0, 31); // 31 janvier 2026
date.setMonth(date.getMonth() + 1); // Essaie de créer "31 février" → déborde sur mars
// Résultat : 2-3 mars 2026

// ✅ Solution
const date = new Date(2026, 0, 31);
date.setDate(1); // Réinitialiser au 1er du mois
date.setMonth(date.getMonth() + 1); // 1er février 2026
// Résultat : 1er février 2026
```

**Solution** :

- Ajout de `setDate(1)` avant `setMonth()` dans tous les handlers de navigation
- Garantit qu'on part toujours du 1er du mois avant de changer le mois
- Corrige également la navigation vers le mois précédent

**Impact** :

- ✅ Navigation mensuelle correcte même en fin de mois (31, 30, 29)
- ✅ Pas de saut de mois avec les boutons "Précédent" et "Suivant"
- ✅ Comportement cohérent sur toutes les vues (Opérations, Soldes, Virements)

**Fichiers modifiés** :

- `hooks/usePlannerUI.ts` (utilisé par OperationsView et TransfersView)
- `components/features/Balances/BalancesView.tsx`

---

## [2.6.19] - 2026-01-31

### 🐛 Corrections de bugs

#### **Correction de l'erreur `sortKey is not defined` dans IncomeEditor**

**Problème** :

- `IncomeEditor.tsx` déclarait `sortKey` et `sortOrder` en props mais ne les utilisait pas dans la destructuration
- L'erreur `ReferenceError: sortKey is not defined` se produisait à la ligne 166 dans `sortedIncomes` useMemo
- Les dépendances du useMemo ne contenaient pas `sortKey` et `sortOrder`, causant des calculs incorrects

**Solution** :

1. Ajout de `sortKey` et `sortOrder` dans la destructuration des props de `IncomeEditor`
2. Ajout de `sortKey` et `sortOrder` dans les dépendances du useMemo de `sortedIncomes`
3. Alignement avec le comportement de `ExpenseRulesEditor` (identique)

**Impact** :

- ✅ Plus d'erreur de référence dans la console
- ✅ Tri fonctionnel dans la gestion des revenus récurrents
- ✅ Cohérence avec l'éditeur de dépenses

**Fichiers modifiés** :

- `components/features/Configuration/components/organisms/IncomeEditor.tsx`

---

## [2.6.18] - 2026-01-31

### 🔧 Améliorations

#### **Refonte Complète du Système de Tri Manuel**

**Problème résolu** : Le tri manuel des opérations était instable avec :

- Plusieurs opérations ayant la même position → ordre imprévisible
- Position 0 traitée comme valide → collisions
- Système de scores complexes (AUTO_BASE + DAY_STEP + hash) → désynchronisations

**Solution implémentée** :

1. **Simplification radicale de `getEffectivePosition()`** :
   - Retourne la position manuelle si `position > 0`
   - Retourne `null` si `position = 0` ou `undefined`
   - Plus de système de scores auto-générés

2. **Logique de tri robuste dans `sortItems()`** :

   ```typescript
   // RÈGLE 1 : Items avec position manuelle TOUJOURS en premier
   if (posA && posB) → Comparer les positions
   if (posA && !posB) → A avant B
   if (!posA && posB) → B avant A

   // RÈGLE 2 : Items sans position → Tri chronologique
   → Tri par payment_date (format YYYY-MM-DD)
   → Fallback sur instanceId pour stabilité
   ```

3. **Synchronisation parfaite** :
   - `usePlanner.ts` et `useOperationsSorting.ts` utilisent la même logique
   - Élimination des désynchronisations entre génération et affichage

**Modifications techniques** :

- **Hook `useOperationsSorting.ts`** :
  - Simplification de `getEffectivePosition()` : retour de `number | null` au lieu de scores complexes
  - Refonte de `sortItems()` avec logique de tri explicite et déterministe
  - Tri des items sans position par date de paiement puis instanceId

- **Hook `usePlanner.ts`** :
  - Remplacement du système `getItemSortScore()` par logique identique à `useOperationsSorting`
  - Tri robuste : position manuelle → jour → instanceId

**Impact** :

- ✅ Ordre stable et prévisible des opérations
- ✅ Plus de changements spontanés d'ordre
- ✅ Drag & drop fiable avec positions uniques
- ✅ Items sans position triés chronologiquement (plus récent en haut)

---

#### **Verrouillage de l'Ordre en Mode Tri Manuel**

**Ajout** : Le tri manuel n'autorise plus le changement d'ordre (asc/desc).

**Justification** :

- L'ordre décroissant (plus récent en haut) est le comportement par défaut optimal
- Évite la perte d'ordre manuel lors de basculements asc/desc

**Modifications** :

1. **Hook `useOperationsSorting.ts`** :
   - Méthode `setSorting()` : force `sortOrder = "desc"` si `sortKey === "manual"`
   - Export de `canToggleOrder` : retourne `false` en mode manuel
   - Tri manuel toujours en ordre décroissant (return `-res`)

2. **Composant `ListSorter.tsx`** :
   - Ajout prop `canToggleOrder?: boolean`
   - Désactivation du clic sur le bouton actif si `canToggleOrder = false`
   - Icône flèche descendante grisée avec tooltip "Ordre fixe en mode manuel"
   - Curseur par défaut au lieu de pointer

3. **Composants `FilterBar.tsx` et `OperationsView.tsx`** :
   - Passage du prop `canToggleOrder` au composant `ListSorter`

**Impact** :

- ✅ Interface claire : impossible de changer l'ordre en mode manuel
- ✅ Comportement prévisible et stable
- ✅ Évite les confusions utilisateur

---

## [2.6.17] - 2026-01-23

### ✨ Nouvelles Fonctionnalités

#### **Analyse Annuelle des Bénéficiaires**

**Ajout** : Nouveau tableau d'analyse des revenus et dépenses par bénéficiaire sur l'année complète dans le Dashboard.

**Composants créés** :

- `AnnualBeneficiaryAnalysis.tsx` : Tableau interactif avec tri par mois/bénéficiaire
- `useBeneficiaryData.ts` : Hook de calcul des données financières par bénéficiaire et par mois
  - Détection automatique des remboursements (revenus dans catégories EXPENSE)
  - Calcul des balances (revenus - dépenses) par bénéficiaire
  - Support des opérations récurrentes et variables
  - Filtrage sur comptes courants uniquement

**Fonctionnalités** :

- 📊 Vue annuelle avec 12 mois de données
- 👥 Analyse par bénéficiaire (revenus, dépenses, balance)
- 🔄 Tri par colonne (mois/bénéficiaire/montant)
- 💰 Totaux mensuels et par bénéficiaire
- 🎨 Code couleur (revenus verts, dépenses rouges, balance conditionnelle)
- 📱 Responsive avec scroll horizontal sur mobile

**Impact** :

- ✅ Vision complète de la répartition des finances par bénéficiaire
- ✅ Détection des déséquilibres financiers entre membres
- ✅ Suivi des contributions et consommations individuelles

---

#### **Ordre d'Affichage Personnalisé des Bénéficiaires**

**Ajout** : Système de tri manuel des bénéficiaires avec champ `displayOrder`.

**Modifications base de données** :

- Ajout colonne `display_order` (smallint null) dans table `people`

**Modifications types et mappers** :

- `Person` : Ajout propriété `displayOrder?: number`
- `DbPerson` : Ajout champ `display_order?: number`
- `mapDbPerson` : Mapping du champ display_order
- `apiUpsertPerson` : Persistence du displayOrder en base

**Logique de tri** :

```typescript
sort((a, b) => {
  const orderA = a.displayOrder ?? 999;
  const orderB = b.displayOrder ?? 999;

  if (orderA !== orderB) {
    return orderA - orderB; // Tri par ordre numérique
  }

  return a.name.localeCompare(b.name); // Fallback alphabétique
});
```

**Interface utilisateur** (PeopleManager) :

- 🔢 Champ "Ordre d'affichage" dans le formulaire d'édition
- #️⃣ Badge `#N` affichant l'ordre dans la liste
- 📝 Aide contextuelle : "Les bénéficiaires seront triés par cet ordre"
- ↕️ Tri automatique de la liste selon displayOrder

**Impact** :

- ✅ Contrôle total de l'ordre d'affichage des bénéficiaires
- ✅ Ordre appliqué globalement (dashboard, configuration, analyses)
- ✅ Fallback alphabétique si ordre non défini
- ✅ Facilite l'organisation selon les préférences (famille, parents, enfants par âge)

---

### 🐛 Corrections

#### **Fix Warning React Hook useMemo**

**Problème** : Deux warnings ESLint dans `useBeneficiaryData.ts`

1. "React Hook useMemo has a missing dependency: 'isRefund'"
2. "React Hook useMemo has an unnecessary dependency: 'accounts'"

**Corrections** :

1. **isRefund** : Fonction déplacée à l'intérieur du `useMemo` pour être dans la bonne portée
2. **accounts** : Retiré des dépendances car déjà couvert par `checkingAccountIds`

**Impact** :

- ✅ Code conforme aux règles `react-hooks/exhaustive-deps`
- ✅ 0 erreur, 0 warning ESLint
- ✅ Performance optimale (pas de recalculs inutiles)

---

## [2.6.15] - 2026-01-23

### 🐛 Corrections

#### **Fix Affichage aria-label dans MobileTooltip**

**Problème** : Le texte `aria-label={ariaLabel}` s'affichait comme du texte visible sur toutes les pages au lieu d'être un attribut HTML du bouton.

**Cause** : Erreur de syntaxe JSX - l'attribut `aria-label` était en dehors de la balise `<button>`

**Correction** : `MobileTooltip.tsx` (lignes 67-71)

- ❌ Avant :
  ```tsx
  <>
    {" "}
    aria-label={ariaLabel}  // ← Affiché comme texte !
    <button onClick={...}>
  ```
- ✅ Après :
  ```tsx
  <>
    <button onClick={...} aria-label={ariaLabel}>  // ← Attribut correct
  ```

**Impact** :

- ✅ Suppression du texte parasite visible sur toutes les pages
- ✅ Attribut aria-label correctement appliqué au bouton
- ✅ Accessibilité fonctionnelle (lecteurs d'écran)
- ✅ UX restaurée (interface propre)

---

## [2.6.14] - 2026-01-23

### ♿ Accessibilité

#### **Correction de la Hiérarchie des Titres (WCAG 2 AA)**

**Problème** : Vercel a détecté "Heading levels should only increase by one"

**Correction** : `VersionInfoCard.tsx` - Hiérarchie des titres dans la modale

- ❌ Avant : Modal title (h3) → Contenu h3 → Contenu h4 (saut de niveau)
- ✅ Après : Modal title (h3) → Contenu h4 → Contenu h5 (progression correcte)

**Modifications** :

- Titres markdown `###` : h3 → h4
- Titres markdown `####` : h4 → h5

**Résultat** : Hiérarchie sémantique correcte pour les lecteurs d'écran

**Impact** :

- ✅ Conformité WCAG 2 AA (structure sémantique)
- ✅ Navigation améliorée pour les technologies d'assistance
- ✅ Logique de document HTML respectée

---

## [2.6.13] - 2026-01-23

### ♿ Accessibilité

#### **Activation du Zoom et Scaling (WCAG 2 AA)**

**Problème** : Vercel a détecté "Zooming and scaling must not be disabled"

**Correction** : `index.html` - Balise `<meta name="viewport">`

- ❌ Suppression de `user-scalable=no` (désactivait complètement le zoom)
- ❌ Suppression de `maximum-scale=1.0` (empêchait le zoom au-delà de 100%)
- ✅ Ajout de `maximum-scale=5.0` (permet le zoom jusqu'à 500%)

**Résultat** : Les utilisateurs peuvent désormais zoomer sur le contenu pour améliorer la lisibilité

**Impact** :

- ✅ Conformité WCAG 2 AA niveau AA (zoom minimum 200% requis)
- ✅ Accessibilité pour les utilisateurs malvoyants
- ✅ Zoom natif du navigateur fonctionnel (pinch-to-zoom sur mobile)

---

## [2.6.12] - 2026-01-23

### ♿ Accessibilité

#### **Ajout d'aria-labels aux Boutons d'Icônes (WCAG 2 AA)**

**Problème** : Vercel a détecté 19 violations "Buttons must have discernible text"

**Corrections appliquées** (10 fichiers modifiés) :

1. **MobileTooltip.tsx**
   - Ajout de la prop `ariaLabel` avec valeur par défaut "Afficher les détails"
   - Ajout d'`aria-label` au bouton d'ouverture du tooltip
   - Conversion du X de fermeture en vrai bouton avec `aria-label="Fermer"`
   - **Impact** : Corrige toutes les instances de MobileTooltip dans l'application ✅

2. **BalancesTable.tsx** (BalanceDisplay)
   - Conversion du `<div>` Pencil en `<button>` avec `aria-label="Modifier le solde"`
   - Ajout d'`aria-label="Voir le détail du calcul"` au MobileTooltip
   - Boutons d'édition : `aria-label="Valider la modification"` et `aria-label="Annuler"`
   - **Impact** : 2 instances par ligne de solde (Avec/Hors attente) + édition ✅

3. **CategoryManager.tsx**
   - Boutons d'édition catégories : `aria-label="Modifier la catégorie {nom}"`
   - Boutons de suppression catégories : `aria-label="Supprimer la catégorie {nom}"`
   - Boutons d'édition sous-catégories : `aria-label="Modifier la sous-catégorie {nom}"`
   - Boutons de suppression sous-catégories : `aria-label="Supprimer la sous-catégorie {nom}"`
   - **Impact** : 4+ instances contextuelles ✅

4. **SortableRow.tsx**
   - Ajout d'`aria-label="Glisser pour réorganiser"` au drag handle
   - Ajout de `role="button"` et `tabIndex={0}` pour navigation clavier
   - **Impact** : Toutes les listes réorganisables ✅

5. **TagAmountSelector.tsx**
   - Bouton Extra/Standard : `aria-label` dynamique selon état
   - Bouton suppression tag : `aria-label="Retirer le tag {nom}"`
   - **Impact** : Ventilation des montants par tags ✅

6. **DataListRow.tsx**
   - Ajout d'`aria-label="Voir les détails de {label}"` au conteneur cliquable
   - Ajout de `role="button"`, `tabIndex={0}` et gestion clavier (Enter/Space)
   - **Impact** : Toutes les lignes de liste cliquables ✅

7. **Modal.tsx**
   - Bouton de fermeture : Ajout d'`aria-label="Fermer"`
   - **Impact** : Toutes les modales de l'application ✅

8. **PlannerModals.tsx**
   - Bouton de fermeture : Ajout d'`aria-label="Fermer"`
   - **Impact** : Modales de pointage d'opérations ✅

9. **ErrorDisplay.tsx**
   - Bouton de fermeture : Ajout d'`aria-label="Fermer"`
   - **Impact** : Affichage des erreurs (Modal + Boundary) ✅

10. **UserMenu.tsx**
    - Bouton avatar : Ajout d'`aria-label="Voir les infos du compte"`
    - Bouton déconnexion : Ajout d'`aria-label="Se déconnecter"`
    - **Impact** : Navigation utilisateur ✅

**Résultat** : 0 violations "Buttons must have discernible text" sur Vercel

**Impact Global** :

- ✅ Conformité WCAG 2 AA complète (contraste + boutons)
- ✅ Navigation clavier améliorée (tabIndex, onKeyDown)
- ✅ Lecteurs d'écran : descriptions contextuelles pour tous les boutons d'icônes
- ✅ UX inclusive : tous les contrôles interactifs sont identifiables
- ✅ 19 violations corrigées sur 10 composants critiques

---

## [2.6.11] - 2026-01-23

### ♿ Accessibilité

#### **Amélioration du Contraste des Couleurs (WCAG 2 AA)**

**Problème** : Vercel a détecté 15+ violations WCAG 2 AA pour contraste insuffisant

**Corrections appliquées** (15 fichiers modifiés) :

1. **Navigation** (Header.tsx)
   - `text-slate-500` → `text-slate-600` pour les onglets inactifs
   - Contraste amélioré : **3.8:1 → 5.7:1** ✅

2. **Labels en Majuscules** (18 fichiers)
   - `text-slate-400` → `text-slate-500` pour tous les labels uppercase
   - Contraste amélioré : **2.5:1 → 3.8:1** ✅
   - Fichiers : UserMenu, BalancesHeader, BudgetDistributionSummary, TransfersKPIs, ListSorter, DatabaseConnectionCard, SavingsSummaryCard, AnalyticsCards, TransfersView, FilterBar, DataListRow, QuickPeriodSummary, BalancesTable, etc.

3. **Labels d'Accent** (SupabaseSetup, BalancesTable)
   - `text-indigo-400` → `text-indigo-600`
   - Contraste amélioré : **2.8:1 → 4.8:1** ✅

**Impact** : Conformité WCAG 2 AA pour déploiement Vercel

### 🎨 UI/UX

#### **Harmonisation Affichage des Soldes** (BalancesTable)

**Améliorations** :

1. **Composant Réutilisable `BalanceDisplay`**
   - Évite la duplication de code
   - Garantit une cohérence visuelle entre "Avec attente" et "Hors attente"

2. **Labels Explicites Ajoutés**
   - ✅ **"Avec attente:"** (solde actuel incluant les opérations en attente)
   - ✅ **"Hors attente:"** (solde sans les opérations en attente)
   - Meilleure clarté pour l'utilisateur

3. **MobileTooltips Sortis des Boutons Cliquables**
   - Les tooltips ne sont plus intégrés dans les zones cliquables
   - Améliore l'UX : on peut cliquer sans ouvrir le tooltip
   - Meilleure séparation des responsabilités

**Structure harmonisée** :

```tsx
<BalanceDisplay
  label="Avec attente:"      // Label explicite
  amount={row.balance}       // Montant
  onClick={...}              // Action d'édition
  tooltipContent={...}       // Détails (sorti du bouton)
/>
```

---

## [2.6.10] - 2026-01-22

### 🐛 Corrections Critiques

#### **Balance Calculation : Correction du Double-Comptage**

**Problème identifié** :

- Gap du compte joint calculé avec double-comptage des opérations en attente
- Formule incorrecte : `gap = pendingOnJoint - currentBalance`
- Exemple : 384.96€ - 9.85€ = 375.11€ ❌ (besoin fictif créé par double-comptage)
- Cause : `currentBalance` inclut déjà les opérations en attente dans son calcul

**Solution appliquée** (hooks/balances/useBalancesRows.ts) :

```typescript
// AVANT (INCORRECT)
jointGap = pendingOnJoint - jointAccount.currentBalance;

// APRÈS (CORRECT)
const balanceExcludingPending = jointAccount.currentBalance + pendingOnJoint;
jointGap = pendingOnJoint - balanceExcludingPending;
```

- Exemple corrigé : 384.96€ - (9.85€ + 384.96€) = -9.85€ ✅ (surplus correct)

**Améliorations Logique Métier** :

1. **Seuil de Tolérance (20€) - Compte Joint** :
   - Surplus ≤ 20€ : Pas de virement (tolérance pour petites variations)
   - Surplus > 20€ : Virement automatique vers LDDS
   - Évite les micro-virements inutiles

2. **Système de Priorités** :
   - **Priorité 1** : Besoins du compte joint → Virement depuis LDDS
   - **Priorité 2** : Besoins comptes courants persos → Utilisation surplus joint d'abord
   - **Priorité 3** : Tous les comptes OK → Surplus joint vers LDDS (si > 20€)
   - Garantit que les comptes courants ne manquent jamais de fonds

3. **Calcul Solde Prévu** :
   - Formule corrigée : `targetBalance = currentBalance + effectiveTransfer`
   - Affiche le solde projeté APRÈS virement exécuté
   - Exemple : -59.85€ + 59.85€ = 0€ ✅

**Améliorations UI** (BalancesTable.tsx) :

- Colonne Solde Prévu : Ajout ligne "Hors attente" pour compte joint
- Affiche solde avec ET sans opérations en attente
- Tooltip enrichi avec 4 lignes d'information

**Impact** :

- ✅ Gap du compte joint : Calcul correct sans double-comptage
- ✅ Virements : Pertinents et évitent micro-ajustements
- ✅ Surplus : Utilisés intelligemment selon priorités
- ✅ Projections : Solde prévu précis et compréhensible

---

## [2.6.9] - 2026-01-17

### 🎨 Harmonisation UI

#### **Configuration View : Standardisation à 48px**

Harmonisation complète de tous les gestionnaires de configuration avec un pattern unifié.

**Composants Refactorisés** :

1. **CategoryManager** :
   - Ajout wrapper navigation (48px) : `CategoryTypeSelector` + bouton "Nouveau"
   - Intégration `InfoBox` dans le composant
   - Boutons actions compacts : `py-2` → `py-1`
   - Pattern : Sélecteur + Action → InfoBox → Liste

2. **OperationsManager** :
   - Navigation : `CategoryTypeSelector` + `ListSorter` dans wrapper 48px
   - InfoBox intégrée (gestion revenus/dépenses récurrents)
   - Tri délégué au parent : ExpenseRulesEditor et IncomeEditor reçoivent props
   - Pattern : Sélecteur + Sorter → InfoBox → Éditeurs

3. **AccountLabelManager** (Refactor complet) :
   - Navigation : 3 onglets (Courant/Virements/Épargne) + bouton "Nouveau" dans wrapper 48px
   - InfoBox "Libellés & Autocomplétion" intégrée
   - Sous-menu conditionnel (mode Courant) : Dépenses/Revenus + Boutons Import
   - Tous les boutons : hauteur fixe `h-[30px]` (pas `py-*`)
   - Boutons Import compacts : `py-1`
   - Pattern : Onglets + Action → InfoBox → [Sous-menu conditionnel] → Recherche → Liste

**Pattern Universel Établi** :

```tsx
<div className="space-y-4">
  <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
    <div className="flex flex-wrap items-center gap-2 justify-between">
      <SelectorOrTabs /> {/* h-[30px] buttons */}
      <button className="px-4 py-1 ...">Action</button>
    </div>
  </div>

  <InfoBox title="..." description="..." icon={...} />

  {/* Contenu principal */}
</div>
```

**Formule de Hauteur (48px)** :

- Container `p-2` : 8px top + 8px bottom = 16px
- Button `h-[30px]` : 30px fixe
- Border : 2px
- **Total : 48px** ✓

**ConfigurationView Simplifié** :

- Suppression des `InfoBox` externes (intégrées dans chaque manager)
- Suppression des fragments `<> </>` inutiles
- Rendu direct des composants : `{activeTab === "operations" && <OperationsManager />}`

### 🐛 Corrections

#### **WeekSelector : Colonnes Dynamiques**

- **Problème** : Grille fixée à 4 colonnes (`grid-cols-4`) même avec 5+ périodes
- **Solution** : Style inline dynamique `gridTemplateColumns: repeat(${weeks.length}, minmax(0, 1fr))`
- **Impact** : Adaptation automatique à tout nombre de périodes (4, 5, 6...)

#### **ESLint : Nettoyage Imports**

- Suppression imports non utilisés suite aux refactors :
  - `ConfigurationView` : Retrait `List` (InfoBox déplacée)
  - `ExpenseRulesEditor` : Retrait `ListSorter` (tri délégué au parent)
  - `IncomeEditor` : Retrait `ListSorter`, état local tri supprimé
  - `TransfersView` : Retrait `ArrowRightLeft`, `Filter`, `X`, `GripVertical`, `Wallet`, `PiggyBank`, `InfoBox`
  - `FilterBar` : Retrait `FilterBarHeader` (composant supprimé)
- Correction dépendances `useMemo` : Retrait `sortKey`/`sortOrder` (valeurs outer scope)
- **Résultat** : 0 erreurs, 0 warnings ESLint

#### **Corrections Structurelles JSX**

1. **ConfigurationView** :
   - Retrait fragment `<> </>` autour de `OperationsManager` (redondant)
   - Pattern : Rendu conditionnel direct sans wrapper

2. **AccountLabelManager** (Corrections critiques) :
   - **Bouton "Nouveau"** : Fermeture corrompue (texte après `>`) → Structure JSX valide
   - **InfoBox manquante** : Ajout après la navigation
   - **Sous-menu** : Extra `}>` supprimé, fermeture conditionnelle corrigée
   - **Code dupliqué** : 18 lignes de boutons Import répétés → Supprimé
   - **DataList** : Prop `onAdd` retirée (bouton dans navigation), `emptyMessage` ajouté

### 🎯 Nouvelles Fonctionnalités

#### **ScopeSelector : Nouveau Composant de Navigation**

Création d'un composant réutilisable pour basculer entre vue mensuelle et par période.

**Caractéristiques** :

- Toggle élégant avec icons `Calendar` (mois) / `CalendarRange` (période)
- Design cohérent avec le pattern 48px établi
- Transitions smooth entre états
- Actif : bg-indigo-600 avec shadow / Inactif : hover:bg-slate-50

**Utilisation** :

- `OperationsView` : Basculer entre échéancier mensuel et périodique
- `BalancesView` : Basculer entre soldes mensuels et périodiques

**Architecture** :

```tsx
<ScopeSelector scope={scope} onScopeChange={setScope} />
```

#### **SearchBar Rétractable avec Animation**

Refonte complète de la SearchBar avec UX améliorée.

**Avant** :

- Input toujours visible (occupe espace même non utilisé)
- Pas d'affordance visuelle

**Après** :

- **État fermé** : Bouton compact avec icon Search uniquement
- **État ouvert** : Input complet avec animation slide-in
- **Auto-focus** : Input focus automatique à l'ouverture
- **Fermeture auto** : Clic extérieur ferme si vide
- **Clear button** : Bouton X animé quand texte présent
- **Responsive** : `w-full` mobile, `md:flex-1 md:max-w-xs` desktop

**Bénéfices** :

- ✅ Économie d'espace sur mobile
- ✅ Animation fluide (fade-in + slide-in 200ms)
- ✅ UX intuitive (auto-focus, fermeture intelligente)
- ✅ Design moderne (transitions Tailwind)

#### **FilterBar Modernisée : Header Intégré**

Refonte de FilterBar avec suppression de FilterBarHeader en faveur d'une intégration directe.

**Avant** :

- Composant `FilterBarHeader` séparé avec badge d'état
- Layout vertical avec gap-3
- "FILTRES" label statique

**Après** :

- Header intégré dans FilterBar directement
- Layout horizontal avec `justify-between`
- Bouton "Plus de filtres" avec indicateur visuel :
  - Actif (ouvert) : bg-slate-800 text-white
  - Filtres secondaires actifs : bg-indigo-50 avec badge dot
  - Inactif : bg-white hover:border-slate-300
- Icons SVG inline pour meilleure performance
- Texte masqué sur mobile (`hidden sm:inline`)

**Architecture simplifiée** :

```tsx
<FilterBar>
  {/* Filtres primaires + Toggle "Plus de filtres" */}
  <div className="flex justify-between">
    <div className="flex gap-2">
      <CyclicFilterButton ... />
      {/* Autres filtres primaires */}
    </div>
    <button>Plus de filtres {hasActiveSecondary && <dot />}</button>
  </div>

  {/* Filtres secondaires (collapsible) */}
  {showAllFilters && <div>...</div>}
</FilterBar>
```

**Fichier supprimé** :

- `components/ui/molecules/FilterBarHeader.tsx` (46 lignes) → Fonctionnalité intégrée

**Bénéfices** :

- ✅ -1 composant à maintenir
- ✅ Code plus DRY (pas de duplication du state hasActiveSecondary)
- ✅ Layout plus compact (gap-3 → gap-1)
- ✅ Indicateur visuel amélioré (badge dot + couleur)

### 🔧 Améliorations

#### **TransfersView : Drag & Drop Unifié**

Support complet du drag & drop pour virements ET transactions directes.

**Avant** :

- Drag & drop uniquement pour les virements (`Transfer`)
- Transactions directes (`VariableTransaction`) non réordonnables

**Après** :

- **Drag & drop universel** : Support virements + transactions dans la même liste
- **Gestion intelligente** : Détecte automatiquement le type (`source === "TRANSFER"` vs `"DIRECT"`)
- **Position calculation** : Adapte le calcul selon le type de l'item voisin
- **Props ajoutée** : `onMoveTransaction` pour gérer le réordonnancement des transactions

**Architecture** :

```tsx
const handleDragEnd = (event: DragEndEvent) => {
  const movedItem = currentItems[oldIndex];

  if (movedItem.source === "TRANSFER" && onMoveTransfer) {
    onMoveTransfer(movedItem.transferData, newPosition);
  } else if (movedItem.source === "DIRECT" && onMoveTransaction) {
    onMoveTransaction(movedItem.transactionData, newPosition);
  }
};
```

**Calcul de position** :

- Récupère `getEffectivePosition()` des items voisins (virements OU transactions)
- Moyenne entre prev/next pour insertion entre deux items
- Décalage de 50M pour insertion en début/fin de liste

**Bénéfices** :

- ✅ Ordre personnalisé pour tous les types d'opérations
- ✅ Persistance automatique via callbacks
- ✅ UX cohérente (même comportement virements/transactions)

#### **TransfersView : Filtre "Intérêts" au lieu de "Opérations Directes"**

Refonte du système de filtrage pour mieux gérer les ajustements d'épargne.

**Avant** :

- Filtre `includeDirectOps` (booléen) : Masquer/Afficher opérations directes
- Problème : Les intérêts d'épargne sont des transactions directes mais nécessitent un traitement différent

**Après** :

- Nouveau filtre `interestFilter` avec 3 états :
  - `"ALL"` : Tout afficher (virements + transactions + intérêts)
  - `"ONLY"` : Uniquement les intérêts/ajustements exceptionnels
  - `"EXCLUDE"` : Masquer les intérêts (afficher virements + transactions standards)

**Impact sur les composants** :

- `useTransfersFilters` : Ajout du nouveau filtre dans l'état
- `useTransfersData` : Logique de filtrage mise à jour
- `TransfersView` : Passage du filtre au hook de données

**Bénéfices** :

- ✅ Séparation claire intérêts/transactions courantes
- ✅ Filtrage plus granulaire pour analyse
- ✅ Support migration 002 (flag `is_interest` sur transfers)

### 📦 Refactoring

#### **Architecture Composants**

- **Principe appliqué** : SRP (Single Responsibility Principle)
- **Délégation des responsabilités** :
  - `OperationsManager` : Gestion tri + navigation
  - `ExpenseRulesEditor` / `IncomeEditor` : Affichage + props tri reçues
- **Élimination duplication** : Pattern 48px copié 3× → Réutilisé systématiquement
- **InfoBox intégrées** : Chaque manager auto-contenu (pas de dépendances externes)

### 🎯 Bénéfices

- ✅ **Cohérence visuelle** : Tous les managers suivent le même pattern
- ✅ **Hauteur uniforme** : Navigation toujours 48px (calcul validé)
- ✅ **Maintenabilité** : Pattern clair et documenté pour futurs composants
- ✅ **Responsive** : `flex-wrap` adapte automatiquement sur mobile
- ✅ **Accessibilité** : Hauteurs fixes facilitent la navigation au clavier
- ✅ **Code propre** : 0 warnings ESLint, JSX valide partout
- ✅ **Architecture solide** : SRP appliqué, responsabilités claires

---

## [2.6.8] - 2026-01-16

### 🎯 Nouvelles Fonctionnalités

#### **Montants Cliquables avec Filtres Centralisés dans Dashboard**

Ajout de la navigation contextuelle depuis les deux tableaux du Dashboard vers la vue Opérations avec filtres automatiques.

**Tableaux Concernés** :

1. **"Analyse Complète (Réel)"** (AnnualIncomeAnalysis)
   - Revenus récurrents/variables
   - Dépenses récurrentes/variables
   - Totaux par période
   - Filtres : status=REAL, salary=EXCLUDE, transfer=ALL

2. **"Trésorerie Globale & Épargne"** (GlobalMonthlyAnalysis)
   - Salaires (Réel)
   - Autres Revenus
   - Total Entrées
   - Dépenses (Réel)
   - Filtres : status=REAL, column-specific salary rules

**Architecture** :

- **Fonction centralisée** : `getDetailedAnalysisFilters(flux, source)` dans `useDashboardData.ts`
- **Fonction globale** : `getGlobalAnalysisFilters(column)` avec type `GlobalAnalysisColumn`
- **Composant UI** : `ClickableAmount` pour affordance visuelle (soulignement au hover)
- **Gestion des salaires** :
  - Analyse Complète : salary=EXCLUDE (salaires dans tableau séparé)
  - Trésorerie Globale : salary=ONLY | EXCLUDE | ALL (selon colonne)

**Bénéfices** :

- ✅ **Source de vérité unique** : Calculs et filtres de navigation colocalisés
- ✅ **DRY** : Pas de duplication des définitions de filtres
- ✅ **Type-safe** : Enums empêchent les erreurs
- ✅ **Auto-documenté** : JSDoc explique les règles métier

### 🔧 Améliorations

#### **Sélecteur d'Année Centralisé dans DashboardHeader**

Déplacement du sélecteur d'année du tableau "Analyse Complète" vers le header global du Dashboard.

**Avant** :

- Sélecteur dans chaque tableau (duplication)
- Bouton "Gérer l'échéancier" dans DashboardHeader

**Après** :

- Sélecteur d'année unique en haut du Dashboard
- Contrôle toutes les vues annuelles (GlobalMonthlyAnalysis + AnnualIncomeAnalysis)
- Navigation cohérente entre les sections

#### **Scope Intelligent dans OperationsView**

Amélioration de l'initialisation du scope (Mois/Période) selon le contexte de navigation.

**Logique** :

- Si `initialWeek` fourni (navigation depuis AnnualIncomeAnalysis) → scope = "PERIOD"
- Si `initialWeek` absent (navigation depuis GlobalMonthlyAnalysis) → scope = "MONTH"

**Impact** :

- Navigation depuis GlobalMonthlyAnalysis affiche maintenant le mois complet par défaut
- Plus besoin de changer manuellement le scope après navigation

### 🐛 Corrections de Bugs

#### **Correction Import ClickableAmount dans GlobalMonthlyAnalysis**

Correction du chemin d'import relatif pour le composant `ClickableAmount`.

**Erreur Vite** :

```
Failed to resolve import "../ClickableAmount" from "components/features/Dashboard/components/charts/GlobalMonthlyAnalysis.tsx"
```

**Correction** :

- Chemin erroné : `../ClickableAmount`
- Chemin correct : `../../../../ui/atoms/ClickableAmount`

### 📦 Exports & Architecture

#### **Nouveaux Exports dans hooks/dashboard/index.ts**

Ajout des fonctions de filtrage centralisées pour utilisation dans les composants.

**Exports ajoutés** :

- `getDetailedAnalysisFilters` : Filtres pour Analyse Complète
- `getGlobalAnalysisFilters` : Filtres pour Trésorerie Globale
- Type `GlobalAnalysisColumn` : Enum des colonnes ("salaries" | "otherIncome" | "totalIncome" | "expenses")

### 📝 Documentation Technique

#### **JSDoc Complet pour Fonctions de Filtrage**

Documentation détaillée des règles métier et exemples d'usage pour les fonctions de filtrage.

**Documentation inclut** :

- Description de la logique de filtrage
- Paramètres avec explications
- Exemples d'utilisation
- Règles métier (pourquoi salary=EXCLUDE vs ALL)
- Type de retour avec structure complète

---

## [2.6.7] - 2026-01-13

### 🚀 Changements Majeurs

#### **Refonte Complète des Tooltips : Fond Blanc & Lisibilité**

Migration de tous les tooltips de l'application vers un fond blanc avec amélioration majeure de la lisibilité.

**Changement de Design** :

- **Ancien** : Fond sombre (`bg-slate-900`) adapté aux superpositions modales
- **Nouveau** : Fond blanc (`bg-white`) avec bordures (`border-slate-300`) pour design moderne

**Impact Architecture** :

- Fichier source : `components/ui/MobileTooltip.tsx`
- Couleur flèche : `border-t-slate-900` → `border-t-white`
- Séparateur header : `border-slate-700` → `border-slate-200`
- Bouton fermeture : `hover:text-red-400` → `hover:text-red-500`

**Harmonisation des Contenus** :
Cette migration a nécessité la mise à jour de **TOUS** les contenus de tooltips pour garantir un contraste optimal (WCAG AA).

### 🔧 Refactorisation Technique

#### **Renommage du Filtre `extra` → `nature`**

Amélioration de la sémantique des filtres d'opérations pour une meilleure clarté du code.

**Motivation** :

- Le terme "extra" était ambigu (extra quoi ?)
- "nature" décrit mieux la **nature de l'opération** (Standard vs Hors Budget)
- Cohérence avec la terminologie métier

**Impact Code** :

- **Type modifié** : `OperationFilters.extra` → `OperationFilters.nature` (types.ts)
- **Valeurs inchangées** : "ALL" | "ONLY" | "EXCLUDE"
- **Aucun impact utilisateur** : Fonctionnalité identique, seul le code interne change

**Fichiers mis à jour** (10+ fichiers) :

- `types.ts` - Interface `OperationFilters`
- `hooks/operations/useOperationsData.ts` - Logique de filtrage (6 occurrences)
- `hooks/operations/useOperationsFilters.ts` - Filtres par défaut et persistance
- `hooks/filterBar/useFilterBarLogic.tsx` - Détection filtre actif
- `hooks/usePlanner.ts` - Application des filtres (2 occurrences)
- `components/ui/atoms/ClickableAmount.tsx` - Documentation et filtres par défaut
- `components/features/Balances/components/BalancesHeader.tsx` - Filtres navigation
- `components/features/Balances/components/BalancesTable.tsx` - Filtres tooltips
- `components/features/Dashboard/components/AnnualIncomeAnalysis.tsx` - Filtres graphique

**Migration automatique** :

- LocalStorage : Les préférences existantes restent compatibles
- Pas de migration de données nécessaire

#### **Amélioration de la Navigation Contextuelle (ClickableAmount)**

Ajout de **filtres par défaut robustes** dans `ClickableAmount` pour éviter les régressions.

**Problème résolu** :

- Avant : Si props `filters` manquante → Navigation sans filtres → Résultats incohérents
- Après : Filtres par défaut garantissent un comportement prévisible

**Filtres par défaut** :

```typescript
const defaultFilters: Partial<OperationFilters> = {
  flux: "ALL",
  source: "ALL",
  nature: "ALL", // Anciennement "extra"
  transfer: "EXCLUDE", // Masquer virements internes par défaut
  salary: "EXCLUDE", // Masquer salaires par défaut
  accountIds: [],
  beneficiaryIds: [],
  includedTagIds: [],
  excludedTagIds: [],
  tagPresence: "ALL",
};
```

**Impact** :

- Navigation Dashboard → Opérations : Plus fiable même si props oubliées
- Clics sur montants : Filtrage cohérent garanti

**Fichier modifié** :

- `components/ui/atoms/ClickableAmount.tsx`

### ✨ Nouvelles Fonctionnalités

#### **Validation Renforcée des Virements Épargne (Règle Pivot)**

Implémentation stricte de la **règle du compte pivot** pour les virements impliquant des comptes d'épargne.

**Règle Métier** :

- ✅ Virement **DEPUIS épargne** → DOIT aller vers **compte joint** (pivot)
- ✅ Virement **VERS épargne** → DOIT provenir **du compte joint** (pivot)
- ❌ Virement **épargne ↔ compte personnel** : **INTERDIT**

**Validation** :

```typescript
// Si source = ÉPARGNE et destination ≠ joint → ERREUR
"Les virements depuis un compte d'épargne doivent aller vers le compte joint (pivot).";

// Si destination = ÉPARGNE et source ≠ joint → ERREUR
"Les virements vers un compte d'épargne doivent provenir du compte joint (pivot).";
```

**Améliorations UX** :

1. **Initialisation intelligente** : Compte joint sélectionné par défaut comme source
2. **Auto-ajustement** : Si épargne sélectionnée → Force compte joint sur l'autre côté
3. **Messages clairs** : Explications précises en cas d'erreur

**Avantages** :

- Empêche les opérations financières invalides
- Guide l'utilisateur vers les bonnes pratiques
- Garantit la cohérence du pivot budgétaire

**Fichier modifié** :

- `hooks/transfers/useTransferForm.ts` (+80 lignes de validation)

### 🎨 Harmonisation des Couleurs des Tooltips

**Application de la nouvelle charte graphique** suite au changement de fond des tooltips.

**Principe** :

- Fond sombre → Variantes claires (`-200` à `-400`)
- **Fond blanc → Variantes sombres (`-600` à `-900`)** ✨

**Problématique** :

- Les tooltips utilisent maintenant un fond blanc (`MobileTooltip.tsx`)
- Certains textes conservaient des couleurs claires (`-200`, `-300`, `-400`) adaptées aux fonds sombres
- **Contraste insuffisant → difficulté de lecture**

**Phase 1 - Textes des tooltips** (`BalancesTable.tsx`) :

- Titres : `text-indigo-300` → `text-indigo-700`
- Labels : `text-slate-300/400` → `text-slate-700/800`
- Notes : `text-slate-400` → `text-slate-600`
- Séparateurs : `border-white/10` → `border-slate-200`

**Phase 2 - Icônes des tooltips** (6 fichiers) :

- `BalancesHeader.tsx` : 3 icônes Info
- `BudgetDistributionSummary.tsx` : 3 icônes Info
- `CalculationDetailsCard.tsx` : 1 icône Info
- `CarryoverStrategyCard.tsx` : 1 icône Info
- `VersionInfoCard.tsx` : 1 icône Info
- `DataListRow.tsx` : 1 icône Info

Standard appliqué :

- Neutre : `text-slate-400/500` → `text-slate-600` (hover: `text-slate-800`)
- Accent indigo : `text-indigo-400` → `text-indigo-500/600` (hover: `text-indigo-700/800`)

**Phase 3 - Contenus des tooltips** (2 fichiers) :

- `BudgetDistributionSummary.tsx` : Tooltip "Consommation Variables"
  - Titre : `text-indigo-200` → `text-indigo-700`
  - Note : `text-indigo-300/80` → `text-indigo-600`
- `BalancesHeader.tsx` : Fonction `renderTooltipContent()`
  - Titre : `text-indigo-200` → `text-indigo-700`

**Impact** :

- ✅ Tous les tooltips ont maintenant un contraste optimal (WCAG AA)
- ✅ Cohérence visuelle sur toute l'application
- ✅ Design system unifié : variants `-600` à `-900` sur fond blanc

**Fichiers modifiés** :

- `components/features/Balances/components/BalancesTable.tsx`
- `components/features/Balances/components/BalancesHeader.tsx`
- `components/features/Balances/components/BudgetDistributionSummary.tsx`
- `components/features/Balances/components/CalculationDetailsCard.tsx`
- `components/features/Configuration/components/molecules/CarryoverStrategyCard.tsx`
- `components/features/Configuration/components/molecules/VersionInfoCard.tsx`
- `components/ui/molecules/DataListRow.tsx`

---

## [2.6.6] - 2026-01-12

### ✨ Nouvelles Fonctionnalités

#### **Auto-complétion Compte & Bénéficiaire**

Extension du système d'auto-suggestion des libellés sauvegardés pour inclure les comptes et bénéficiaires.

**Architecture** :

- Ajout de colonnes `account_id` et `beneficiary_id` dans la table `saved_labels`
- Relations directes (foreign keys) vers `accounts` et `people`
- Contraintes `ON DELETE SET NULL` pour préserver les labels si suppression compte/personne

**Interface Utilisateur** :

- **Configuration → Libellés** :
  - Sélecteurs de compte et bénéficiaire dans l'accordéon "Options Avancées"
  - Affichage des associations dans la liste (icônes 💳 Compte / 👤 Bénéficiaire)
  - Chargement automatique lors de l'édition d'un libellé existant

- **Nouvelle Opération** :
  - Saisie ou sélection d'un libellé → Pré-remplissage automatique :
    - ✅ Catégorie (existant v2.6.5)
    - ✅ Sous-catégorie (existant v2.6.5)
    - ✅ **Compte** (nouveau v2.6.6)
    - ✅ **Bénéficiaire** (nouveau v2.6.6)

**Import Intelligent** :

Les fonctions **Import (CB)** et **Import (VIR)** détectent automatiquement le compte et bénéficiaire les plus fréquemment utilisés pour chaque libellé :

**Fonctionnement** :

1. Analyse de tous les `paid_items` correspondants
2. Pour chaque libellé, calcul statistique de la combinaison catégorie + compte + bénéficiaire la plus fréquente
3. Création des `saved_labels` avec tous les champs pré-remplis

**Script SQL One-Shot** (fourni) :

Pour mettre à jour les libellés existants avec les comptes/bénéficiaires historiques :

```sql
-- Analyse statistique des paid_items + mise à jour bulk des saved_labels
WITH label_account_beneficiary_stats AS (
  SELECT label, account_id, beneficiary_id, COUNT(*) as usage_count,
         ROW_NUMBER() OVER (PARTITION BY label ORDER BY COUNT(*) DESC) as rn
  FROM paid_items WHERE label IS NOT NULL
  GROUP BY label, account_id, beneficiary_id
)
UPDATE saved_labels sl
SET account_id = COALESCE(sl.account_id, mf.account_id),
    beneficiary_id = COALESCE(sl.beneficiary_id, mf.beneficiary_id)
FROM (SELECT label, account_id, beneficiary_id FROM label_account_beneficiary_stats WHERE rn = 1) mf
WHERE sl.name = mf.label AND (sl.account_id IS NULL OR sl.beneficiary_id IS NULL);
```

**Avantages** :

- ⚡ Saisie ultra-rapide des opérations (5 champs pré-remplis automatiquement)
- 🎯 Cohérence des données (même libellé = mêmes catégorie/compte/bénéficiaire)
- 🧠 Intelligence contextuelle (basée sur l'historique réel d'utilisation)

### 🔧 Améliorations Techniques

**Backend** :

- `types.ts` : Ajout `accountId?: string` et `beneficiaryId?: string` dans `SavedLabel`
- `dbTypes.ts` : Ajout `account_id?: string` et `beneficiary_id?: string` dans `DbSavedLabel`
- `apiMappers.ts` : Mapping bidirectionnel pour les nouveaux champs
- `apiCrud.ts` :
  - `apiUpsertLabel` : Sauvegarde des nouveaux champs
  - `apiImportLabels` / `apiImportVirLabels` : Détection intelligente compte + bénéficiaire
- `database_complete.sql` : Schéma complet mis à jour avec foreign keys et commentaires

**Frontend** :

- `AccountLabelManager.tsx` :
  - États `accountId` et `beneficiaryId`
  - Handlers `resetForm`, `handleEditClick`, `handleFormSubmit` étendus
  - UI : `AccountSelector` et `BeneficiarySelector` dans accordéon
  - Affichage : Résolution ID → nom pour liste des libellés
- `ConfigurationView.tsx` : Passage des props `accounts` et `people`
- `DataListRow.tsx` : Support dual prop `account` / `accountName` (rétrocompatibilité)
- `useTransactionForm.ts` :
  - Recherche directe dans `savedLabels` (prioritaire sur RPC)
  - Auto-complétion complète : catégorie + sous-catégorie + compte + bénéficiaire

### 📖 Documentation

- Commentaires inline dans tous les composants modifiés
- Documentation SQL avec COMMENT ON COLUMN
- CHANGELOG détaillé avec exemples SQL

### 🗄️ Migration Base de Données

**Script à exécuter dans Supabase Console** :

```sql
-- Ajout des colonnes avec foreign keys
ALTER TABLE saved_labels
ADD COLUMN account_id text REFERENCES accounts(id) ON DELETE SET NULL,
ADD COLUMN beneficiary_id text REFERENCES people(id) ON DELETE SET NULL;

-- Documentation des colonnes
COMMENT ON COLUMN saved_labels.account_id IS 'Compte suggéré pour auto-complétion (optionnel)';
COMMENT ON COLUMN saved_labels.beneficiary_id IS 'Bénéficiaire suggéré pour auto-complétion (optionnel)';
```

**Note** : Pour les installations existantes, exécuter d'abord la migration ALTER TABLE, puis optionnellement le script one-shot pour peupler avec l'historique.

---

## [2.6.5] - 2026-01-12

### 🐛 Corrections Critiques (Post-v2.6.4)

Cette version patch corrige un problème critique découvert après la release v2.6.4 :

#### **Problème : Interface manquante pour l'auto-suggestion**

La table `saved_labels` possédait déjà les colonnes `category_id` et `sub_category_id`, mais aucune interface ne permettait de les renseigner lors de la création ou modification d'un libellé sauvegardé.

**Solution** :

- Ajout de `<CategorySelector>` dans la modal "Modifier le libellé" (sous accordéon "Options Avancées")
- Affichage des catégories/sous-catégories associées dans la liste des libellés
- Impact : Pré-remplissage automatique des catégories lors de la saisie de transactions

#### **Amélioration : Import intelligent des catégories**

Les fonctions **Import (CB)** et **Import (VIR)** détectent maintenant automatiquement la catégorie/sous-catégorie la plus fréquemment utilisée pour chaque libellé dans l'historique :

**Fonctionnement** :

1. Analyse de tous les `paid_items` correspondants (CB % ou VIR %)
2. Pour chaque libellé, détection de la catégorie la plus fréquente
3. Résolution automatique des noms de catégories → IDs relationnels
4. Création des `saved_labels` avec catégories pré-remplies

**Impact** : Gain de temps considérable lors de l'import massif de libellés depuis l'historique.

#### **Correction : Modal de suppression de libellé**

**Problème** : La modal de confirmation de suppression d'un libellé ne se fermait pas après validation (clic sur "Supprimer")

**Cause** : Appel à `clearForm()` (fonction inexistante) au lieu de `resetForm()` dans le handler `handleDelete()`

**Solution** : Correction pour appeler la bonne fonction de réinitialisation qui ferme la modal

- ✅ Ajout de `<CategorySelector>` dans le modal "Modifier le libellé"
- ✅ Sélection catégorie + sous-catégorie optionnelle
- ✅ Interface dans accordéon "Options Avancées" (UX clean)
- ✅ Chargement des associations existantes lors de l'édition
- ✅ Sauvegarde automatique dans `saved_labels.category_id/sub_category_id`

**Impact utilisateur** :

Lors de la création d'opérations variables, l'application peut maintenant pré-remplir automatiquement la catégorie et sous-catégorie en fonction du libellé saisi, grâce aux associations définies dans "Configuration → Libellés".

### 🔧 Améliorations Techniques

- **database_complete.sql** : Schéma complet mis à jour pour nouvelles installations
- **AccountLabelManager.tsx** : Intégration `CategorySelector` avec handlers load/save
- **ConfigurationView.tsx** : Ajout du passage de la prop `categories`
- **Type Safety** : Aucune modification requise (types déjà conformes)

### 📖 Documentation

- CHANGELOG mis à jour avec détails du correctif
- Commentaires inline dans les composants modifiés

---

## [2.6.4] - 2026-01-12

### ⚠️ BREAKING CHANGE

**Migration Base de Données Requise** : Exécuter `startup/migrations/004_refactor_categories_to_relational.sql`

Cette version refond complètement l'architecture des sous-catégories pour améliorer la robustesse et préparer l'auto-suggestion intelligente.

### ✨ Nouvelles Fonctionnalités

#### **Structure Relationnelle des Sous-Catégories**

Refactorisation majeure de l'architecture database :

**Avant (v2.6.3)** :

- Sous-catégories stockées dans un array PostgreSQL (`sub_categories: TEXT[]`)
- Pas de lien structurel entre libellés et catégories
- Identification par nom uniquement (fragile)

**Après (v2.6.4)** :

- ✅ Table dédiée `sub_categories` avec foreign keys
- ✅ Identifiants uniques (`id`, `category_id`)
- ✅ Contraintes d'intégrité référentielle
- ✅ RLS policies pour sécurité multi-tenant
- ✅ Indexes pour performances optimales

**Schéma relationnel** :

```sql
CREATE TABLE sub_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **Auto-Suggestion Intelligente de Catégories**

Système d'apprentissage automatique basé sur les libellés enregistrés :

**Fonctionnalités** :

- ✨ **Suggestion automatique** : Pré-remplit catégorie/sous-catégorie lors de la saisie
- 🎯 **Contexte intelligent** : Basé sur `saved_labels` (associations mémorisées)
- ⚡ **Feedback visuel** : Indicateur "✨ Recherche de suggestion..." pendant l'appel
- 🔄 **Non bloquant** : Pas de suggestion ? Saisie manuelle reste possible

**Workflow utilisateur** :

1. Saisir libellé dans formulaire de transaction : "Netflix"
2. Auto-suggestion déclenche recherche dans base (≥3 caractères)
3. Si trouvé → Catégorie "Loisirs" + Sous-catégorie "Streaming" pré-remplies
4. Validation ou modification manuelle si nécessaire

**Implémentation technique** :

- Hook `useCategoryAutoSuggest` : Appel RPC à Supabase
- Fonction SQL `suggest_category_from_label(p_label_name)` : Requête optimisée
- Intégration transparente dans `VariableTransactionForm`

**Exemple d'usage** :

```typescript
const { suggestFromLabel, isLoading } = useCategoryAutoSuggest();

const handleLabelChange = async (label: string) => {
  const suggestion = await suggestFromLabel(label);
  if (suggestion) {
    // Pré-remplir catégorie + sous-catégorie automatiquement
    setCategory(suggestion.category_id);
    setSubCategory(suggestion.sub_category_id);
  }
};
```

### 🔧 Améliorations Techniques

#### **Migration 004 : Refactorisation Complète**

Script SQL complet de migration en 8 étapes :

1. **Sauvegarde** : Export des données existantes dans table temporaire
2. **Création table** : Structure relationnelle avec contraintes
3. **Migration données** : Transformation array → lignes relationnelles
4. **Extension labels** : Ajout `category_id`, `sub_category_id` à `saved_labels`
5. **Suppression array** : Colonne `sub_categories: TEXT[]` retirée de `categories`
6. **RLS policies** : Sécurité multi-tenant activée
7. **Fonctions helpers** : `get_sub_categories()`, `suggest_category_from_label()`
8. **Vérification** : Validation de l'intégrité des données

**Statistiques migration** :

- ~300 lignes SQL documentées
- 0 perte de données (backup temporaire)
- Rollback possible via backup

#### **Refactorisation Complète du Type System**

Mise à jour de toute la chaîne de typage TypeScript :

**Fichiers refactorisés** :

- `services/dbTypes.ts` : Nouveaux types `DbSubCategory`, `DbPaidItemTag`
- `types.ts` : Interface `SubCategory { id, name, categoryId }`
- `services/apiMappers.ts` : Mapper `mapDbSubCategory()`
- `services/api.ts` : Chargement relationnel des sous-catégories
- `services/apiCrud.ts` : CRUD atomique avec gestion relationnelle

**Pattern de mapping** :

```typescript
// AVANT (array simple)
CategoryDef.subCategories: string[]

// APRÈS (objets typés)
CategoryDef.subCategories: SubCategory[]
```

#### **Composants UI Mis à Jour**

Adaptation de tous les composants pour objets SubCategory :

**Composants refactorisés** :

- `hooks/useCategoryManager.ts` : Opérations CRUD sur SubCategory[]
- `CategoryManager.tsx` : Affichage de `sub.name`, utilisation de `sub.id`
- `CategorySelector.tsx` : Tri et mapping des noms de sous-catégories
- `useTransactionForm.ts` : Hook avec auto-suggestion intégrée
- `VariableTransactionForm.tsx` : UI avec indicateur de chargement

**Exemple de changement** :

```tsx
// AVANT (string direct)
{
  cat.subCategories.map((sub, idx) => <div key={idx}>{sub}</div>);
}

// APRÈS (objet structuré)
{
  cat.subCategories.map((sub) => <div key={sub.id}>{sub.name}</div>);
}
```

### 📦 Dépendances et Build

- Build successful : **2161 modules** transformés
- Bundle size : **838.18 kB** (gzip: 228.95 kB)
- 0 erreurs TypeScript, 0 warnings ESLint

### 🎯 Impact Utilisateur

**Expérience améliorée** :

- ⚡ Gain de temps : Catégories pré-remplies automatiquement
- 🎯 Moins d'erreurs : Réutilisation des catégories déjà utilisées
- 🧠 Apprentissage : Le système mémorise les associations

**Migration utilisateur** :

1. Exécuter migration 004 (script fourni)
2. Actualiser l'application (build)
3. Tester auto-suggestion sur libellés connus
4. Profiter du gain de temps sur saisies répétitives

---

## [2.6.3] - 2026-01-12

### 🔧 Améliorations Techniques

#### **Automatisation du Parser de CHANGELOG**

Élimination de la duplication de contenu entre CHANGELOG.md et VersionInfoCard.tsx grâce à un système de parsing automatique.

**Problème résolu** :

- ❌ Avant : Notes de version maintenues manuellement dans 2 endroits
- ❌ Risque d'oubli de mise à jour de la modale "Quoi de neuf ?"
- ❌ Duplication de contenu source d'erreurs

**Solution implémentée** :

- ✅ **Source unique de vérité** : CHANGELOG.md est la seule source
- ✅ **Parser automatique** : Extraction dynamique de la dernière version
- ✅ **Simplification user-facing** : Filtrage des sections techniques
- ✅ **Support Vite** : Import de `.md?raw` pour lecture du fichier

**Architecture** :

- `services/changelogParser.ts` :
  - `getVersionNotes(version)` : Extrait une version spécifique
  - `getLatestVersionNotes()` : Extrait automatiquement la dernière version
  - Filtrage intelligent : Conserve uniquement les sections user-facing
  - Suppression des blocs de code TypeScript, fichiers modifiés, formules

- `components/features/Configuration/components/molecules/VersionInfoCard.tsx` :
  - Remplacement du contenu hardcodé par `getLatestVersionNotes()`
  - Plus besoin de mise à jour manuelle à chaque release

- `vite-env.d.ts` :
  - Déclaration de type pour `*.md?raw`
  - Support TypeScript pour l'import de markdown

**Workflow de release simplifié** :

```bash
# Avant (2 fichiers à éditer)
1. Éditer CHANGELOG.md
2. Éditer VersionInfoCard.tsx (❌ risque d'oubli)

# Maintenant (1 seul fichier)
1. Éditer CHANGELOG.md → ✅ Modale mise à jour automatiquement !
```

**Bénéfices** :

- 🎯 **DRY** : Une seule source de vérité pour les notes de version
- ⚡ **Maintenance simplifiée** : Plus de risque d'oubli
- 🔄 **Toujours à jour** : La modale reflète toujours le CHANGELOG actuel
- 🧹 **Clean Code** : Élimination de 20+ lignes de contenu dupliqué

**Fichiers modifiés** :

- `services/changelogParser.ts` : Nouveau fichier (parser automatique)
- `vite-env.d.ts` : Ajout déclaration de type pour `.md?raw`
- `components/features/Configuration/components/molecules/VersionInfoCard.tsx` :
  - Import de `getLatestVersionNotes`
  - Suppression du contenu hardcodé (20 lignes)
  - Remplacement par appel dynamique

---

## [2.6.2] - 2026-01-12

### ✨ Nouvelles Fonctionnalités

#### **Édition Bidirectionnelle des Soldes Bancaires**

Amélioration majeure de la vue Soldes avec affichage et édition de deux perspectives de solde : avec et sans opérations en attente.

**Nouveaux Affichages** :

- ✅ **Solde avec attente** : Solde projeté incluant les opérations non validées (valeur principale cliquable)
- ✅ **Solde hors attente** : Solde réel excluant les opérations futures (ligne secondaire cliquable avec icône ✏️)
- ✅ **Tooltip explicatif** : Description détaillée des deux visions avec calcul transparent
- ✅ **Prévisualisation temps réel** : Affichage du solde complémentaire pendant la saisie

**Système d'Édition Dual** :

- 🖱️ Cliquer sur **Solde Actuel** → Éditer directement le solde avec attente
- 🖱️ Cliquer sur **Hors attente** → Éditer le solde sans attente avec recalcul automatique
- ⚡ Mode d'édition affiché : "Édition: Avec attente" ou "Édition: Hors attente"
- 🔄 Calcul intelligent : Le système convertit automatiquement la valeur pour la base de données
- 📊 Prévisualisation en direct : Montre l'autre solde pendant la saisie

**Formules de Calcul** :

```typescript
// Affichage
Solde hors attente = Solde actuel + Montant en attente
// (Le montant en attente est négatif pour les dépenses)

// Sauvegarde
Si édition "Hors attente" :
  Solde à sauvegarder = Solde hors attente - Montant en attente
Sinon :
  Solde à sauvegarder = Valeur saisie
```

**Exemple d'Usage** :

```
Situation : Compte avec 1000€, opérations en attente -200€
Affichage :
  - Solde actuel (avec attente) : 1000€ ✏️
  - Hors attente : 1200€ ✏️

Scénario 1 : Éditer "Solde actuel"
  → Saisir 950€
  → Prévisualisation : "Hors attente: 1150€"
  → Sauvegarde : 950€

Scénario 2 : Éditer "Hors attente"
  → Saisir 1300€
  → Prévisualisation : "Avec attente: 1100€"
  → Sauvegarde : 1100€ (conversion automatique)
```

**Fichiers modifiés** :

- `components/features/Balances/components/BalancesTable.tsx` :
  - État `editMode` pour tracker la perspective d'édition
  - Fonction `startEdit` avec paramètre mode (WITH_PENDING | WITHOUT_PENDING)
  - Fonction `saveEdit` avec calcul inversé pour mode WITHOUT_PENDING
  - UI en colonne avec prévisualisation temps réel
  - Ligne "Hors attente" cliquable avec icône crayon
  - Tooltips enrichis avec calculs détaillés

**Bénéfices UX** :

- 🎯 **Flexibilité maximale** : Éditer depuis la perspective la plus naturelle
- 🧮 **Transparence totale** : Calculs expliqués avec tooltip détaillé
- ⚡ **Feedback immédiat** : Prévisualisation en temps réel de l'autre solde
- 🔒 **Intégrité des données** : Conversion automatique garantit la cohérence
- 📱 **Responsive** : Interface adaptée mobile avec icônes minimalistes

---

## [2.6.1] - 2026-01-12

### 🐛 Corrections

#### **Persistance des Filtres lors de la Navigation**

Correction majeure du système de gestion des filtres dans la vue Opérations pour respecter les préférences utilisateur lors de la navigation entre vues.

**Problèmes résolus** :

- ❌ Les filtres personnalisés (flux, source, bénéficiaires, tags, salaires) se réinitialisaient au changement de vue
- ❌ Le retour sur la vue Opérations perdait les réglages utilisateur
- ❌ Le filtre "Salaires" restait coché alors qu'il devrait être masqué par défaut

**Architecture mise en place** :

- ✅ **Hook useOperationsFilters** : Application unique des `initialFilters` via `useRef` et `useState` initializer
- ✅ **ClickableAmount** : Defaults complets et cohérents pour tous les filtres (10 propriétés)
- ✅ **Navigation contextuelle** : Seuls les filtres contextuels (status, extra, accountIds) sont passés
- ✅ **localStorage** : Préservation systématique des préférences utilisateur

**Fichiers modifiés** :

- `hooks/operations/useOperationsFilters.ts` : Suppression du useEffect problématique, application unique via useState
- `components/ui/atoms/ClickableAmount.tsx` : Defaults complets (flux, source, extra, transfer, salary, beneficiaryIds, tags)
- `components/features/Balances/components/BalancesTable.tsx` : Suppression de flux/source explicites (6 instances)
- `components/features/Balances/components/BalancesHeader.tsx` : Suppression de source explicite (3 handlers)
- `components/features/Dashboard/components/charts/AnnualIncomeAnalysis.tsx` : Suppression de flux/source/salary explicites

**Comportement final** :

1. **Premier accès** : Filtres par défaut + contexte de navigation appliqué
2. **Personnalisation** : Utilisateur modifie flux/source/bénéficiaires → sauvegarde localStorage
3. **Navigation** : Balances → Dashboard → Opérations
4. **Retour** : Préférences utilisateur restaurées, contexte ignoré

**Exemple concret** :

```
// Utilisateur configure :
Flux: Dépenses, Source: Variables, Bénéficiaire: Guillaume

// Navigation vers Balances, clic "En attente Standard"
→ Applique SEULEMENT : status="WAITING", extra="EXCLUDE", accountIds=[...]
→ PRÉSERVE : flux="EXPENSE", source="VARIABLE", beneficiaryIds=["Guillaume"]

// Retour sur Opérations → Filtres restaurés depuis localStorage
```

**Impact UX** :

- 🎯 Préférences utilisateur respectées
- 🔄 Navigation contextuelle fonctionnelle
- 💾 Persistance multi-sessions via localStorage
- ⚖️ Balance parfaite entre contexte et autonomie

---

## [2.6.0] - 2026-01-12

### ✨ Nouveau - Affichage de la Version et Changelog

**Transparence et traçabilité des releases**

L'application affiche maintenant sa version et donne accès au changelog directement depuis l'interface, suivant les bonnes pratiques de gestion de version.

#### **Composant VersionInfoCard**

**Emplacement** : Configuration > Réglages > Actions Système

**Fonctionnalités** :

- 🏷️ **Badge version** : Affichage de la version actuelle (v2.6.0)
- 📄 **Bouton "Quoi de neuf ?"** : Modale avec notes de version récente
- 🔗 **Bouton "Changelog complet"** : Lien vers GitHub
- 💡 **Tooltip explicatif** : Information sur le format SemVer

**Architecture Technique** :

- Source unique de vérité : `package.json`
- Import direct : `import packageJson from "../../../../../package.json"`
- Design élégant : Gradient indigo-purple avec badges
- Format standard : Semantic Versioning (MAJOR.MINOR.PATCH)

**Modale Changelog** :

- Format structuré : Sections Nouveautés/Corrections/Améliorations
- Parsing manuel du CHANGELOG.md
- Notes importantes : Migrations DB, dépendances
- Liens externes : GitHub Releases pour historique complet

**Documentation** :

- Nouveau fichier : `docs/VERSION_MANAGEMENT.md`
- Bonnes pratiques détaillées
- Workflow de release
- Fonctionnalités optionnelles futures

**Fichiers ajoutés** :

- `components/features/Configuration/components/molecules/VersionInfoCard.tsx`
- `docs/VERSION_MANAGEMENT.md`
- `vite-env.d.ts` (déclarations TypeScript)

---

### 🎨 Amélioration - Ventilation Détaillée des Virements LDDS

**Transparence des flux financiers**

Le composant `TransferSummaryCard` affiche maintenant le détail de la ventilation des virements LDDS entre le compte joint et les comptes personnels.

#### **Nouveau Props TransferSummaryCard**

```typescript
interface TransferSummaryCardProps {
  amount: number;
  toJoint?: number; // Nouveau : Montant pour compte joint
  toPersonals?: number; // Nouveau : Montant pour comptes personnels
}
```

**Affichage UI** :

- 💙 **Badge indigo** : "Factures Joint" avec montant `lddsToJoint`
- 💙 **Badge bleu** : "Comptes Courants (via Joint)" avec montant `lddsToPersonals`
- Conditionnel : Badges affichés seulement si montants > 0.01€
- Wrapping responsive : Flex-wrap pour mobile

**Flux de données** :

1. `useBalancesRows` : Calcul et exposition de `lddsToJoint` et `lddsToPersonals`
2. `BalancesView` : Destructuration et passage des props
3. `TransferSummaryCard` : Affichage conditionnel des badges

**Exemple d'affichage** :

```
Vir LDDS vers Joint                    106€

Montant total à transférer...

[Factures Joint: 50.00€]
[Comptes Courants (via Joint): 56.00€]
```

**Compatibilité** :

- Props optionnelles : Backward compatible
- Affichage graceful : Ne casse pas si props absentes

**Fichiers modifiés** :

- `hooks/balances/useBalancesRows.ts` : Exposition variables `lddsToJoint` et `lddsToPersonals`
- `components/features/Balances/BalancesView.tsx` : Passage des nouvelles props
- `components/features/Balances/components/TransferSummaryCard.tsx` : Affichage badges

---

### 🐛 Correctif - Scope des Variables dans useBalancesRows

**Correction TypeScript**

Les variables `lddsToJoint` et `lddsToPersonals` étaient déclarées avec `const` dans un scope local (bloc `if`), les rendant inaccessibles dans le `return` du `useMemo`.

**Solution** :

- Déclaration avec `let` au début du `useMemo`
- Initialisation à `0`
- Assignation dans le bloc `if (jointAccount)`
- Disponibles pour le return de la fonction

**Code corrigé** :

```typescript
return useMemo(() => {
  let lddsToJoint = 0;
  let lddsToPersonals = 0;
  // ... calculs
  if (jointAccount) {
    lddsToJoint = Math.max(0, remainingGap);
    lddsToPersonals = totalTransfersToPersonals;
  }
  return { ..., lddsToJoint, lddsToPersonals };
}, [deps]);
```

---

## [2.5.0] - 2026-01-09

### 🎉 Version Majeure - Amélioration UX et Persistence

Cette version apporte des améliorations majeures à l'expérience utilisateur avec l'affichage détaillé des opérations pointées dans la vue Soldes, la persistance des paramètres de gestion des dépassements, et plusieurs fonctionnalités avancées pour les virements et l'interface utilisateur.

---

### ✨ Nouveau - Affichage des Opérations Pointées dans les Soldes

**Visibilité complète de la consommation réelle**

Les soldes affichent maintenant le détail des opérations "Réelles" (pointées) en plus des opérations "En attente", offrant une transparence totale sur la consommation budgétaire de chaque compte.

#### **Interface Utilisateur Enrichie**

**Nouvelle section "Opérations Réelles"** dans `BalancesTable` :

- 💚 **Total Réel** : Somme de toutes les opérations pointées (émeraude)
- 💙 **Standard** : Opérations dans le budget (bleu)
- 💜 **Extra** : Opérations hors budget (violet)
- 🖱️ **Navigation interactive** : Clic → Filtre automatique vers vue Opérations
- 💡 **Tooltips explicatifs** : Aide contextuelle sur chaque montant

**Terminologie clarifiée** :

- ✅ "Réel" au lieu de "Pointé" (plus intuitif)
- ⏳ "En attente" pour les opérations non confirmées

#### **Nouveau Composant Réutilisable**

**ClickableAmount** (`components/ui/atoms/ClickableAmount.tsx`)

- Composant générique pour navigation filtrée
- Props : `date`, `filters`, `weekNumber`, `onNavigate`, `className`, `title`
- Utilisé dans `BalancesTable` et `AnnualIncomeAnalysis`
- Hover effect + cursor pointer pour UX intuitive

#### **Architecture Backend**

**Interface BalanceRow étendue** (`hooks/balances/useBalancesRows.ts`) :

```typescript
interface BalanceRow {
  // ... existant
  paidAmount: number; // Total opérations pointées
  paidStandard: number; // Montant Standard pointé
  paidExtra: number; // Montant Extra pointé
}
```

**Calculs de données** dans `useBalancesRows` :

- **PASS 0** : Comptes persos (lignes 145-172) avec données pointées
- **PASS 1+** : Itérations après redistributions (lignes 211-237)
- **Joint Account** : Compte pivot (lignes 258-281)
- Source données : `stats.byAccount[id]?.paid` et `?.paidStandard` depuis `usePlanner`

**Protection contre découverts** (lignes 194-199) :

- Si virement négatif > solde actuel → Ajustement avec solde minimal
- Calcul intelligent pour éviter les découverts lors des transferts

#### **Commits Associés**

- `26adf37` : Add display of real (paid) operations in balances table
- `4ef064a` : Add ClickableAmount component and enhance balances table

---

### 🔧 Correctif - Persistance Gestion des Dépassements

**Sauvegarde des paramètres budgétaires**

Correction du bug empêchant la persistance du choix de stratégie de gestion des dépassements budgétaires (NEXT_PERIOD vs SPREAD_REMAINING).

#### **Migration Base de Données**

**Migration 003** (`startup/migrations/003_add_carryover_strategy.sql`) :

```sql
ALTER TABLE public.app_settings
ADD COLUMN IF NOT EXISTS carryover_strategy text
DEFAULT 'NEXT_PERIOD' NOT NULL
CHECK (carryover_strategy IN ('NEXT_PERIOD', 'SPREAD_REMAINING'));

UPDATE public.app_settings
SET carryover_strategy = 'NEXT_PERIOD'
WHERE carryover_strategy IS NULL;
```

**Action requise** : Exécuter cette migration dans l'éditeur SQL Supabase

#### **Modifications Backend**

**Système de types** :

- `DbSettings` interface : Ajout `carryover_strategy?: string`
- `mapDbSettings` : Cast vers union type avec défaut `"NEXT_PERIOD"`
- `apiUpdateSettings` : Upsert du champ avec fallback

**Fichiers modifiés** :

- `services/dbTypes.ts` : Interface DB étendue
- `services/apiMappers.ts` : Mapping avec casting de type
- `services/apiCrud.ts` : Sauvegarde du paramètre
- `startup/database_complete.sql` : Schéma complet mis à jour

**Contraintes** :

- Valeurs valides : `'NEXT_PERIOD'` | `'SPREAD_REMAINING'`
- Défaut : `'NEXT_PERIOD'`
- NOT NULL avec CHECK constraint

---

### 🎯 Amélioration - Support des Intérêts d'Épargne

**Distinction virements classiques vs ajustements**

Ajout d'un flag `isInterest` pour différencier les virements d'épargne normaux des ajouts d'intérêts ou ajustements exceptionnels.

#### **Migration Base de Données**

**Migration 002** (`startup/migrations/002_add_is_interest_to_transfers.sql`) :

```sql
ALTER TABLE public.transfers
ADD COLUMN IF NOT EXISTS is_interest boolean DEFAULT false NOT NULL;
```

#### **Interface Utilisateur**

**TransferForm** enrichi :

- Toggle "Intérêts ou Ajustement Exceptionnel"
- Déplacé dans accordéon "Options Avancées"
- UI simplifiée : champs essentiels (Montant/Date/Comptes/Motif) avant accordéon

**Affichage adapté** :

- Badge "INTÉRÊTS" (amber) dans `TransfersView` si `isInterest === true`
- Badge "💰 ÉPARGNE" (bleu) pour virements classiques
- Filtrage et analytics ajustés

#### **Architecture Backend**

- `Transfer` interface : Ajout `isInterest?: boolean`
- `mapDbTransfer` : Mapping du flag depuis DB
- `apiUpsertTransfer` : Sauvegarde du flag
- `useTransferForm` : Gestion du toggle dans le formulaire

**Commit** : `84eae29` - Add interest/adjustment support to transfers

---

### 🎨 Amélioration UI - Accordéon Options Avancées

**Simplification des formulaires avec hiérarchie visuelle**

Implémentation d'un accordéon intelligent "Options Avancées" pour masquer les champs rares et réduire la charge cognitive.

#### **Nouveau Composant**

**AdvancedOptionsAccordion** (`components/ui/molecules/AdvancedOptionsAccordion.tsx`)

- Animation fluide (300ms) avec transition `max-height` + `opacity`
- Badge indicateur : "Masquées" / "Affichées"
- Icône Settings + chevron directionnel
- **Optimisation automatique** : Si 1 seul enfant → affichage direct

#### **Formulaires Refactorisés**

**5 formulaires optimisés** :

1. **VariableTransactionForm** :
   - Tags, toggles Extra/Remboursement dans accordéon
   - Note remontée avant accordéon (plus importante)

2. **TransferForm** :
   - Toggle "Intérêts" dans accordéon
   - Champs essentiels prioritaires

3. **ExpenseRulesEditor**, **IncomeRulesEditor**, **CategoryManager** :
   - Options avancées masquées par défaut

**Commit** : `48e7765` - feat(ui): accordéon Options Avancées avec affichage intelligent

---

### 🔄 Amélioration - Clarification Virements et Délais

**Distinction nette virements internes vs opérations budgétaires**

Amélioration des calculs budgétaires avec exclusion explicite des virements internes et ajout du suivi des retards.

#### **Vue Soldes**

- Calcul des délais (opérations en attente des périodes précédentes)
- Exclusion systématique des "Virement Interne" des budgets
- Clarification des labels : "Dette Totale" → "Dépenses À Venir"

#### **Vue Échéancier**

- Statistiques rapides : ajout des délais (`quickStats.expenses.delays`, `income.delays`)
- Affichage contextuel : délais visibles uniquement en mode PERIOD
- Filtrage optimisé : virements exclus des calculs de consommation

**Commit** : `e428b24` - Improve balances and planner: add delays, clarify transfers

---

### 🧹 Nettoyage Codebase

**Suppression de code obsolète**

- Retrait formulaires dépréciés : `ExpenseForm`, `IncomeForm`
- Suppression documentation migration obsolète : `001_README.md`, `002_README.md`
- Simplification architecture : réduction duplication code

**Commit** : `dc5b88e` - Remove obsolete form and migration documentation

---

### 📊 Statistiques Version

**Depuis v2.4.0** :

- **Commits** : 6
- **Fichiers modifiés** : 33
- **Insertions** : +3239 lignes
- **Suppressions** : -1231 lignes

**Nouveaux composants** :

- `ClickableAmount.tsx` (80 lignes)
- `AdvancedOptionsAccordion.tsx`
- `TransferForm.tsx` (252 lignes)
- `ValidationErrorBlock.tsx`

**Nouveaux hooks** :

- `useTransferForm.ts` (318 lignes)
- `useValidationScroll.ts`

**Migrations** :

- 002 : `is_interest` pour transfers
- 003 : `carryover_strategy` pour app_settings

---

### 🚀 Actions Requises

**Pour les utilisateurs existants** :

1. **Migration 002** : Exécuter dans l'éditeur SQL Supabase

   ```sql
   ALTER TABLE public.transfers
   ADD COLUMN IF NOT EXISTS is_interest boolean DEFAULT false NOT NULL;
   ```

2. **Migration 003** : Exécuter dans l'éditeur SQL Supabase

   ```sql
   ALTER TABLE public.app_settings
   ADD COLUMN IF NOT EXISTS carryover_strategy text
   DEFAULT 'NEXT_PERIOD' NOT NULL
   CHECK (carryover_strategy IN ('NEXT_PERIOD', 'SPREAD_REMAINING'));
   ```

3. **Rafraîchir la page** après application des migrations

---

## [2.4.5] - 2026-01-09

### ✨ Amélioration UX - Accordéon "Options Avancées"

**Simplification des formulaires avec hiérarchie visuelle claire**

Implémentation d'un accordéon "Options Avancées" pour masquer les champs avancés/rares par défaut, réduisant la charge cognitive et améliorant la navigation.

#### **Nouveau Composant Réutilisable**

**AdvancedOptionsAccordion** (`components/ui/molecules/AdvancedOptionsAccordion.tsx`)

- Accordéon contrôlé avec animation fluide (300ms)
- Badge indicateur : "Masquées" (fermé) / "Affichées" (ouvert)
- Icône Settings + chevron directionnel
- Gradient header : `from-slate-50 to-slate-100` avec hover effect
- Transition smooth : `max-height (0→2000px)` + `opacity (0→100%)`
- Pattern : `<AdvancedOptionsAccordion isOpen={showAdvanced} onToggle={setShowAdvanced}>`
- **🎯 Optimisation automatique** : Si 1 seul enfant → affichage direct sans accordéon (pas d'économie de place)

#### **Formulaires Refactorisés**

**5 formulaires avec accordéon** :

**1. VariableTransactionForm** (`components/features/Operations/components/VariableTransactionForm.tsx`)

- ✅ Champs déplacés dans accordéon :
  - Ventilation par tags (TagAmountSelector)
  - Toggle "Dépense temporaire / Exceptionnelle (Hors Budget)"
  - Toggle "C'est un remboursement" (conditionnel si isExpense)
- ✅ Champ "Note/Commentaire" remonté AVANT accordéon (plus important que tags)
- ✅ Background toggles : `bg-slate-50 → bg-white` (meilleur contraste)

**2. TransferForm** (`components/features/Transfers/components/TransferForm.tsx`)

- ✅ Champ déplacé dans accordéon :
  - Toggle "Intérêts ou Ajustement Exceptionnel"
- ✅ Réorganisation : Montant/Date/Comptes/Motif AVANT accordéon (champs essentiels)

**3. ExpenseRulesEditor** (`components/features/Configuration/components/organisms/ExpenseRulesEditor.tsx`)

- ✅ Section complète déplacée dans accordéon :
  - Checkbox "Dépense temporaire / Exceptionnelle"
  - Champs durée conditionnels (startMonth, endMonth, duration selector)
- ✅ Container `bg-white/60` préservé (style visuel inchangé)

**4. IncomeEditor** (`components/features/Configuration/components/organisms/IncomeEditor.tsx`)

- ✅ Champs déplacés dans accordéon :
  - Toggle "Revenu Structurel / Salaire"
  - Toggle "Revenu Exceptionnel / Temporaire"
  - Champs durée conditionnels (startMonth, endMonth, duration selector)
- ✅ Background section : `bg-slate-50 → bg-white` (cohérence visuelle)

**5. PlannerModals** (`components/features/Operations/components/PlannerModals.tsx`)

- ✅ Champ déplacé dans accordéon :
  - Note/Commentaire (optionnel)
- ✅ Bouton standardisé : `bg-slate-900 → bg-indigo-600` (dépenses)
- ✅ Pattern simplifié : champ direct dans accordéon (1 enfant → affichage direct sans header)
  - Checkbox "Dépense temporaire / Exceptionnelle"
  - Champs durée conditionnels (startMonth, endMonth, duration selector)
- ✅ Container `bg-white/60` préservé (style visuel inchangé)

**4. IncomeEditor** (`components/features/Configuration/components/organisms/IncomeEditor.tsx`)

- ✅ Champs déplacés dans accordéon :
  - Toggle "Revenu Structurel / Salaire"
  - Toggle "Revenu Exceptionnel / Temporaire"
  - Champs durée conditionnels (startMonth, endMonth, duration selector)
- ✅ Background section : `bg-slate-50 → bg-white` (cohérence visuelle)

#### **Améliorations UX**

**Hiérarchie visuelle** :

- Champs essentiels toujours visibles (libellé, montant, date, compte, catégorie)
- Options avancées masquées par défaut (réduction charge cognitive ~40%)
- Accès rapide en 1 clic (accordéon)

**Design cohérent** :

- Pattern identique sur 5 formulaires (cohérence applicative)
- Animation smooth 300ms (feeling naturel)
- Badge état clair (feedback visuel immédiat)
- Default closed (utilisateurs novices protégés)
- Affichage intelligent : 1 enfant → direct, 2+ enfants → accordéon

**Cas d'usage** :

- 🆕 Création rapide : Formulaire simplifié, focus sur l'essentiel
- 🔧 Édition avancée : Options accessibles en 1 clic
- 👁️ Lisibilité : Moins de scroll, hiérarchie claire

#### **Impact Code**

**Composant créé** :
20 lignes, composant molecules réutilisable avec affichage conditionnel

**Formulaires modifiés** : 5 fichiers

- Import `AdvancedOptionsAccordion`
- State `showAdvanced` ajouté (default false)
- Wrapping sections avancées dans accordéon
- Background adjustments (slate-50 → white pour contraste)
- Standardisation couleurs boutons (indigo-600
- Background adjustments (slate-50 → white pour contraste)

**Aucune régression** : ✅

- Toutes les fonctionnalités préservées
- Validation formulaire inchangée
- Soumission avec champs cachés fonctionnelle
- 0 erreurs ESLint/TypeScript

---

## [2.4.4] - 2026-01-09

### ♻️ Refactorisation DRY - Modularité et Réutilisabilité

**Élimination systématique de la duplication de code dans les formulaires**

Refactorisation majeure appliquant strictement le principe DRY (Don't Repeat Yourself) pour réduire la dette technique et améliorer la maintenabilité.

#### **Nouveaux Composants Réutilisables**

**1. ValidationErrorBlock** (`components/ui/atoms/ValidationErrorBlock.tsx`)

- Bloc d'erreurs de validation unifié avec support ref
- Design cohérent (rose-50, animation, focus automatique)
- Élimine 5 duplications de 15 lignes chacune (75 lignes économisées)

**2. FormField** (`components/ui/atoms/FormField.tsx`)

- Wrapper générique label + input
- Style standardisé : `text-xs font-medium text-slate-500 uppercase`
- Support required indicator optionnel
- Remplace définition locale dans PlannerModals

**3. useValidationScroll** (`hooks/useValidationScroll.ts`)

- Hook réutilisable pour scroll automatique vers erreurs
- Encapsule `useEffect` + `scrollIntoView` + `focus()`
- Élimine 5 duplications de 7 lignes chacune (35 lignes économisées)

#### **Composants Refactorisés**

**Formulaires mis à jour** (5 fichiers) :

- ✅ `VariableTransactionForm.tsx` : ValidationErrorBlock + useValidationScroll
- ✅ `TransferForm.tsx` : ValidationErrorBlock + useValidationScroll
- ✅ `ExpenseRulesEditor.tsx` : ValidationErrorBlock + useValidationScroll
- ✅ `IncomeEditor.tsx` : ValidationErrorBlock + useValidationScroll + harmonisation `space-y-2 → 2.5`
- ✅ `PlannerModals.tsx` : Import FormField depuis atoms (suppression définition locale)

**Imports ajoutés** :

```tsx
import { ValidationErrorBlock } from "../../../ui/atoms/ValidationErrorBlock";
import { useValidationScroll } from "../../../../hooks/useValidationScroll";
```

**Code avant (pattern répété 5x)** :

```tsx
useEffect(() => {
  if (validationErrors.length > 0 && errorBlockRef.current) {
    errorBlockRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    errorBlockRef.current.focus();
  }
}, [validationErrors]);

{
  validationErrors.length > 0 && (
    <div ref={errorBlockRef} tabIndex={-1} className="bg-rose-50 border border-rose-200 ...">
      <p className="text-xs font-bold text-rose-700 mb-1">⚠️ Champs manquants :</p>
      <ul className="text-xs text-rose-600 space-y-0.5 list-disc list-inside">
        {validationErrors.map((error, idx) => (
          <li key={idx}>{error}</li>
        ))}
      </ul>
    </div>
  );
}
```

**Code après (DRY)** :

```tsx
useValidationScroll(validationErrors, errorBlockRef);

<ValidationErrorBlock errors={validationErrors} ref={errorBlockRef} />;
```

#### **Impact Technique**

**Dette technique éliminée** :

- ❌ 5 duplications de bloc d'erreurs (15 lignes × 5 = **75 lignes**)
- ❌ 5 duplications de useEffect scroll (7 lignes × 5 = **35 lignes**)
- ❌ 1 définition locale de FormField (7 lignes)
- **Total : ~117 lignes de duplication supprimées**

**Maintenabilité améliorée** :

- ✅ **Single Source of Truth** : Un seul endroit pour modifier le design des erreurs
- ✅ **Type Safety** : Interfaces TypeScript strictes avec forwardRef
- ✅ **Testabilité** : Composants isolés facilement testables
- ✅ **Évolutivité** : Ajout de features (ex: internationalisation) en un seul endroit

**Performance** :

- ✅ Aucun impact négatif (React.memo pas nécessaire ici)
- ✅ Bundle size réduit (-117 lignes brutes, gzip optimise davantage)

**Accessibilité** :

- ✅ `tabIndex={-1}` pour focus programmatique
- ✅ `outline-none focus:ring-2` pour indicateur visuel
- ✅ Scroll smooth vers erreurs (UX fluide)

#### **Documentation**

**Pattern de réutilisation documenté** dans chaque fichier :

- JSDoc détaillé avec exemples d'usage
- Architecture DRY expliquée
- Références croisées entre composants

**Exemple d'usage standardisé** :

```tsx
// 1. Importer les utilitaires
import { ValidationErrorBlock } from "../../../ui/atoms/ValidationErrorBlock";
import { useValidationScroll } from "../../../../hooks/useValidationScroll";

// 2. Utiliser dans le composant
const MyForm = () => {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const errorBlockRef = useRef<HTMLDivElement>(null);

  useValidationScroll(validationErrors, errorBlockRef);

  return (
    <Modal>
      <ValidationErrorBlock errors={validationErrors} ref={errorBlockRef} />
      {/* Form fields */}
    </Modal>
  );
};
```

#### **Bénéfices Long Terme**

**Développement** :

- 🚀 Nouveaux formulaires 5x plus rapides à créer
- 🎯 Consistency garantie par défaut
- 🔧 Modifications centralisées (1 fichier au lieu de 5)
- 📚 Pattern clair pour onboarding nouveaux dev

**Qualité Code** :

- 📊 Moins de lignes = moins de bugs potentiels
- ✅ Tests simplifiés (composants isolés)
- 🔍 Code reviews plus rapides (patterns connus)
- 📈 Metrics améliorés (DRY score, maintainability index)

---

## [2.4.3] - 2026-01-09

### 🎨 Harmonisation - Formulaires de Saisie

**Uniformisation complète du design et du comportement des formulaires**

Refonte systématique de tous les formulaires de l'application pour garantir une expérience utilisateur cohérente et professionnelle.

#### **Uniformisation Visuelle**

**Espacement standardisé** :

- Container principal : `space-y-2.5` (10px) sur tous les formulaires
- Grilles : `gap-2.5` (10px) pour colonnes multiples
- Boutons : `flex gap-2.5` (10px) entre actions
- Séparateurs : `border-t border-slate-100 pt-2.5 mt-2.5` avant groupes logiques

**Padding harmonisé** :

- Toggles/Cards : `px-3 py-2.5` (12px horizontal, 10px vertical)
- InfoBox : `p-3` (12px uniforme)
- Buttons container : `pt-3` (12px) avec border separator

**Composants modifiés** :

- `VariableTransactionForm.tsx` : `space-y-2 → 2.5`, grids `gap-2 → 2.5`, ajout séparateur avant tags
- `TransferForm.tsx` : `space-y-3 → 2.5`, comptes `space-y-3 → 2.5`, grids et gaps uniformisés
- `ExpenseRulesEditor.tsx` : `space-y-2 → 2.5`, ajout séparateur avant section durée
- `PlannerModals.tsx` : `space-y-5 → 2.5`, grid `gap-4 → 2.5`, ajout séparateur avant validation

#### **Séparateurs Visuels**

**Règle d'application** :

- ✅ **AVANT** sections de tags/ventilation
- ✅ **AVANT** sections de durée/validité
- ✅ **AVANT** container de boutons (toujours)
- ❌ **JAMAIS** entre champs d'un même groupe

**Pattern standard** :

```tsx
<div className="border-t border-slate-100 pt-2.5 mt-2.5"></div>
```

#### **Documentation Technique**

**Nouveau fichier** : `FORM_GUIDELINES.md`

- 📏 Standards visuels détaillés (spacing, padding, bordures)
- 🎯 Standards comportementaux (validation, erreurs, modales)
- 🧩 Catalogue de composants réutilisables
- 📱 Templates boutons et actions
- ✅ Checklist de développement
- 📖 Exemples complets commentés

**Sections clés** :

1. Standards visuels (espacement, séparateurs, padding)
2. Standards comportementaux (validation, erreurs async)
3. Composants réutilisables (inputs, selectors, toggles)
4. Boutons d'action (primaires, suppression, layouts)
5. Checklist pré-commit
6. Exemples complets (formulaires 1 et 2 colonnes)

#### **Impact Développement**

- 🎨 **Cohérence visuelle** : Design unifié sur tous les formulaires
- 📏 **Maintenabilité** : Standards documentés pour futures contributions
- 🚀 **Productivité** : Templates réutilisables + checklist de validation
- ♿ **Accessibilité** : Patterns d'erreurs et focus management standardisés

#### **Impact Utilisateur**

- ✅ **Familiarité** : Tous les formulaires se comportent de manière identique
- ✅ **Lisibilité** : Espacement optimisé pour réduire encombrement vertical
- ✅ **Clarté** : Séparateurs visuels pour grouper logiquement les champs
- ✅ **Professionnalisme** : Design soigné et cohérent

---

## [2.4.2] - 2026-01-09

### 🎨 Amélioration UX - Formulaire de Virement avec Intérêts

**Interface adaptative selon le type de transaction**

Amélioration de l'ergonomie du formulaire de virement pour mieux refléter la nature des transactions : virements internes classiques vs. ajouts d'intérêts/ajustements.

#### **Composant** (`TransferForm.tsx`)

- **Rendu conditionnel** : UI s'adapte automatiquement selon le toggle `isInterest`
  - **Mode Virement classique** (`isInterest=false`) : Affiche Source → Flèche → Destination
  - **Mode Intérêts** (`isInterest=true`) : Affiche uniquement "Compte concerné" (pas de source)
- **Changements UI** :
  - Sélecteur "Depuis (Source)" masqué quand `isInterest=true`
  - Flèche indicateur masquée quand `isInterest=true`
  - Ligne de connexion verticale masquée quand `isInterest=true`
  - Label destination dynamique : "Vers (Destination)" → "Compte concerné"
- **Justification** : Les intérêts/ajustements affectent UN seul compte (crédit/débit), pas DEUX (transfert)

#### **Hook** (`useTransferForm.ts`)

- **Filtrage intelligent** : Nouvelle règle pour `filteredDestAccounts`
  - **Priorité 1** : Si `isInterest=true` → Uniquement comptes ÉPARGNE
  - **Priorité 2** : Si source est ÉPARGNE → Destination doit être compte pivot
  - **Priorité 3** : Cas général → Tous les comptes disponibles
- **Documentation** : Commentaires JSDoc mis à jour avec les 3 règles
- **Dépendances useMemo** : Ajout de `isInterest` aux dépendances pour réactivité

#### **Qualité Code**

- **Corrections ESLint** :
  - `DashboardView.tsx` : Import `AccountType` non utilisé supprimé
  - `TransfersView.tsx` : 4 paramètres préfixés avec `_` (`_people`, `_settings`, `_categories`, `_onUpsertTransaction`)
  - `useBalancesRows.ts` : Paramètres `_accounts` et `_budgetPeriodeGlobal` préfixés, dépendances useMemo inutiles retirées
- **Résultat** : 0 erreurs, 0 warnings ESLint

#### **Impact Utilisateur**

- ✅ **Clarté sémantique** : Le formulaire reflète visuellement la nature de l'opération
- ✅ **Réduction de confusion** : Plus de sélecteur source inapproprié pour les intérêts
- ✅ **Guidage utilisateur** : Seuls les comptes d'épargne sont proposés pour les intérêts bancaires

---

## [2.4.1] - 2026-01-09

### ✨ Amélioration - Gestion des Intérêts et Ajustements

**Nouveau champ `isInterest` pour les virements internes**

Ajout d'une fonctionnalité permettant de marquer les virements comme ajouts d'intérêts bancaires ou ajustements exceptionnels. Cette distinction permet une meilleure catégorisation et un suivi plus précis des mouvements financiers.

#### **Types** (`types.ts`)

- **Ajout** : Nouveau champ optionnel `isInterest?: boolean` dans l'interface `Transfer`
- **Documentation** : Commentaire JSDoc explicatif sur l'usage du champ

#### **Hook** (`useTransactionForm.ts`)

- **État** : Nouveau state `isInterest` avec getter/setter
- **Initialisation** : Détection automatique depuis le label lors de l'édition
  - Reconnaît les labels contenant "intérêt", "ajustement" ou commençant par "intérêts"
- **Reset** : Réinitialisation à `false` lors du nettoyage du formulaire
- **Soumission** : Champ inclus dans l'objet `Transfer` final lors de la création/modification

#### **Interface Utilisateur** (`VariableTransactionForm.tsx`)

- **Nouveau toggle** : Carte interactive "Intérêts ou Ajustement Exceptionnel"
- **Design** :
  - Icône `TrendingUp` avec couleur adaptative (emerald si actif, slate si inactif)
  - Background emerald-50 + border emerald-200 quand activé
  - Texte d'aide contextuel expliquant l'usage
- **Placement** : Entre l'InfoBox de description et le formulaire de saisie
- **UX** : Carte entièrement cliquable, feedback visuel immédiat

#### **Base de Données**

- **Migration** : `startup/migrations/002_add_is_interest_to_transfers.sql`
- **Colonne** : `is_interest boolean DEFAULT false` ajoutée à la table `transfers`
- **Index** : Index partiel sur `is_interest = true` pour optimiser les requêtes filtrées
- **Rétrocompatibilité** : ✅ Champ optionnel, pas d'impact sur les données existantes

#### **Services API**

- **`dbTypes.ts`** : Ajout de `is_interest?: boolean` à l'interface `DbTransfer`
- **`apiMappers.ts`** : Mapping bidirectionnel `is_interest ↔ isInterest` dans `mapDbTransfer`
- **`apiCrud.ts`** : Champ `is_interest` inclus dans la fonction `apiUpsertTransfer`

#### **Documentation**

- **Guide complet** : `docs/FEATURE_INTERESTS_ADJUSTMENTS.md`
  - Cas d'usage détaillés
  - Instructions d'utilisation
  - Tests recommandés
  - Prochaines étapes possibles

#### **Cas d'usage typiques**

- 💰 **Intérêts bancaires** : Ajout automatique d'intérêts sur comptes épargne
- 🔧 **Ajustement exceptionnel** : Correction manuelle après erreur bancaire
- 📊 **Régularisation** : Virements de régularisation comptable

---

## [2.4.0] - 2026-01-09

### ♻️ Refactorisation Architecturale Majeure

**Architecture 100% Cohérente : Séparation Logique Métier / Présentation**

Refactorisation complète de tous les composants majeurs pour appliquer le principe SRP (Single Responsibility Principle) avec architecture hook spécialisée. Tous les composants de vue suivent maintenant le même pattern : composant orchestrateur pur + hooks métier dédiés.

#### **BalancesView.tsx** - Réduction 71% (788 → 230 lignes)

**Création de `/hooks/balances/` avec 2 hooks spécialisés :**

- **`useBalancesData.ts` (395 lignes)** : Logique de calcul des soldes
  - Filtrage des comptes courants
  - Calcul des reports de période (`periodCarryovers`) avec dual-algorithm
  - Agrégation des consommations réelles (pointées + en attente)
  - Calcul du solde distribuable
  - Statistiques par compte et bénéficiaire
  - Gestion des montants Extra et Standard avec helper `getStandardAmountForCarryover`
  - Documentation JSDoc complète (workflow, exemples, cas d'usage)

- **`useBalancesRows.ts` (230 lignes)** : Génération des lignes de tableau avec redistribution 2-pass
  - Calcul des lignes Compte Pivot (joint) avec ratios configurables
  - Calcul des lignes Comptes Persos avec distribution proportionnelle
  - Algorithme 2-pass pour équilibrage optimal :
    - Pass 1 : Répartition selon ratios bruts
    - Pass 2 : Ajustement si gap Pivot négatif (prélèvement sur excédents)
  - Calcul des virements LDDS nécessaires
  - Gestion des arrondi (0€ et 5€) selon préférence utilisateur

**Résultat :** Composant BalancesView.tsx réduit à un orchestrateur pur de ~230 lignes (appel hooks + render JSX)

#### **DashboardView.tsx** - Réduction 71% (313 → 92 lignes)

**Création de `/hooks/dashboard/` avec hook de calcul :**

- **`useDashboardData.ts` (501 lignes)** : Centralisation de toute la logique dashboard
  - **Filtrage préliminaire** : Extraction des comptes courants uniquement
  - **Helper `isRefundCategory`** : Détection intelligente des remboursements
    - Catégorie "Remboursement" ou "Dépenses" → refund
    - Catégorie définie comme EXPENSE dans `categories` → refund
  - **`globalMonthlyData` (88 lignes)** : Tableau macro annuel (12 mois)
    - Agrégation des salaires (`isSalary=true`)
    - Agrégation des autres revenus (récurrents + variables)
    - Agrégation des dépenses (récurrents + variables)
    - **Gestion des remboursements** : Réduit les dépenses au lieu d'augmenter les revenus
    - Calcul du balance et taux d'épargne
    - Retour inversé (décembre en premier)
  - **`annualData` (158 lignes)** : Tableau détaillé par période (12 mois)
    - **Génération des périodes** (3 stratégies) :
      - `FIXED_DAYS` : Périodes de N jours fixes
      - `CUSTOM_SPLIT` : Découpage du mois en N parts égales
      - Fallback : Semaines de 7 jours
    - **Initialisation des buckets** : Revenus/dépenses par période
    - **Helper `addToPeriod`** : Affectation automatique aux bonnes périodes
    - **Agrégation revenus récurrents** : EXCLUSION des salaires
    - **Agrégation dépenses récurrentes**
    - **Agrégation transactions variables**
    - Calcul des totaux mensuels
    - Retour inversé
  - **Interfaces TypeScript exportées** :
    - `GlobalMonthData` : Cashflow macro avec salaires (7 propriétés)
    - `AnnualMonthData` : Détail mensuel avec périodes (5 propriétés)
    - `PeriodData` : Données d'une période (4 objets imbriqués)
  - **Documentation** : 132 lignes de JSDoc (architecture, responsabilités, workflow, exemples)
  - **Optimisation** : Memoization complète (`useMemo` avec dépendances explicites)

**Résultat :** Composant DashboardView.tsx réduit à un orchestrateur pur de ~92 lignes (1 hook call + 4 child components)

### 📊 Statistiques Refactorisation

**Avant refactorisation :**

- BalancesView.tsx : 788 lignes (logique + UI mélangées)
- DashboardView.tsx : 313 lignes (2 useMemo massifs + helpers)
- **Total : 1,101 lignes monolithiques**

**Après refactorisation :**

- **Composants** : 230 + 92 = 322 lignes (-68% de code UI)
- **Hooks spécialisés** : 395 + 230 + 501 = 1,126 lignes (+ documentation)
- **Gain maintenabilité** :
  - Logique métier testable indépendamment
  - Séparation claire des responsabilités
  - Documentation exhaustive de l'architecture
  - Réutilisabilité des hooks

**Architecture unifiée :**

```
✅ BalancesView → useBalancesData + useBalancesRows
✅ DashboardView → useDashboardData
✅ OperationsView → useOperationsData + useOperationsFilters + useOperationsSorting (déjà refactorisé)
✅ TransfersView → useTransfersData + useTransfersFilters (déjà refactorisé)
✅ VariableTransactionForm → useTransactionForm (déjà refactorisé)
```

**Résultat : 100% de cohérence architecturale sur toutes les vues majeures**

### 🛠️ Technique

- **Pattern appliqué** : Hook Specialization + SRP
- **Memoization** : Tous les calculs lourds memoizés (`useMemo`, `useCallback`)
- **Type Safety** : Toutes les interfaces exportées et documentées
- **Zero Breaking Changes** : Pure refactorisation, aucun changement de comportement
- **Compilation** : 0 erreur TypeScript, 0 warning ESLint

---

## [2.3.0] - 2026-01-09

### 🎯 Ajouté

- **Système de gestion des dépassements budgétaires avec stratégies configurables**
  - **Nouveau type** : `CarryoverStrategy` avec deux valeurs possibles
    - `NEXT_PERIOD` : Déduction simple sur la période suivante uniquement (défaut)
    - `SPREAD_REMAINING` : Étalement équitable sur toutes les périodes restantes
  - **Extension AppSettings** : Ajout du champ `carryover_strategy?: CarryoverStrategy`
  - **Nouveau composant** : `CarryoverStrategyCard` dans Configuration > Réglages > Général
    - Design purple-themed avec 2 options cliquables
    - Badge "ACTIF" sur l'option sélectionnée
    - Exemples chiffrés pour illustrer chaque stratégie :
      - NEXT_PERIOD : "Période 1 dépasse de 278€ → Période 2 = 500€ - 278€ = 222€"
      - SPREAD_REMAINING : "Période 1 dépasse de 300€ → Périodes 2, 3, 4 = 400€ chacune"
    - Tooltip explicatif avec icône Info
    - Icons : ArrowRightLeft (simple) / TrendingDown (étalement)
  - **Persistance** : Configuration sauvegardée via `apiUpdateSettings` dans `app_settings` table
  - **Impact immédiat** : Changement de stratégie recalcule automatiquement tous les budgets de période

### 🧮 Amélioré

- **Calcul des reports de période avec dual-algorithm dans BalancesView**
  - **Stratégie NEXT_PERIOD (simple)** :
    - Report cumulatif linéaire : chaque période hérite du solde complet de la période précédente
    - Exemple : P1 (500€, conso 778€) → P2 (222€) → P3 (222€ + solde P2)
    - Avantages : Simple, prévisible, effet immédiat
  - **Stratégie SPREAD_REMAINING (distribué)** :
    - Dépassement/économie réparti équitablement sur TOUTES les périodes restantes
    - Algorithme complexe avec boucle imbriquée pour éviter le double-comptage
    - Exemple : P1 (-300€) sur 3 périodes → P2, P3, P4 = 400€ chacune (500 - 100)
    - Gestion des reports multiples : P3 accumule les parts de P1 ET P2
    - Avantages : Lisse l'impact d'un gros dépassement exceptionnel
  - **Fonction `getStandardAmountForCarryover`** : Exclut les montants Extra des calculs
    - Toggle global Extra → 0€ (toute l'opération hors budget)
    - Pas de tags → Montant total (tout Standard)
    - Avec tags → Montant total - somme des tags Extra
  - **Exclusions automatiques** : Virements internes et intérêts d'épargne ne comptent pas
  - **Optimisation** : Recalcul via `useMemo` uniquement si `filteredPeriodBudgets` ou `carryover_strategy` change

- **Affichage contextuel dans BudgetDistributionSummary**
  - **Banner de report adaptatif** :
    - Titre : "Report période précédente" (NEXT_PERIOD) vs "Report étalé" (SPREAD_REMAINING)
    - Description : Texte explicatif selon la stratégie active
    - Couleur : Rouge (dépassement) / Vert (économie)
    - Transformation affichée : "500€ → 222€" pour visualiser l'impact
  - **Tooltip stratégie-spécifique** :
    - NEXT_PERIOD : "Budget ajusté avec le report de la période précédente"
    - SPREAD_REMAINING : "Budget ajusté avec la part de report étalé des périodes précédentes"
  - **Subtext budget initial** :
    - "Budget ajusté avec report" vs "Budget ajusté avec étalement"
  - **Footer message négatif** :
    - NEXT_PERIOD : "Dépassement à déduire de la période suivante"
    - SPREAD_REMAINING : "Dépassement à étaler sur les périodes restantes"

### 📚 Documentation

- **Commentaires JSDoc détaillés (200+ lignes)** :
  - **BalancesView.tsx** :
    - Documentation complète du `periodCarryovers` useMemo (50+ lignes)
    - Fonction `getStandardAmountForCarryover` avec 3 exemples (30+ lignes)
    - Stratégie NEXT_PERIOD : algorithme, avantages, exemples (20+ lignes)
    - Stratégie SPREAD_REMAINING : algorithme complexe, cas d'usage, exemples (40+ lignes)
    - Boucle imbriquée anti-double-comptage : problème, solution, exemple (30+ lignes)
  - **BudgetDistributionSummary.tsx** :
    - Props interface documentée avec rôle de chaque propriété (10 lignes)
    - Composant principal : comportement, affichage contextuel, exemples (40+ lignes)
  - **CarryoverStrategyCard.tsx** :
    - Description des 2 stratégies avec icônes, exemples, cas d'usage (30+ lignes)
    - Intégration système : persistence, impact, design UI
    - Exemple d'utilisation dans GlobalSettings

- **Mise à jour du fichier copilot-instructions.md** :
  - Nouvelle section complète "Système de Gestion des Dépassements (Carryover)" (60+ lignes)
  - Configuration, stratégies, composants, règles métier
  - Ajout de la sous-section "Gestion Budgétaire et Soldes" dans "Fichiers Critiques"
  - Mise à jour "Dernières fonctionnalités ajoutées"

### 🔧 Technique

- **Types TypeScript** :

  ```typescript
  export type CarryoverStrategy = "NEXT_PERIOD" | "SPREAD_REMAINING";

  export interface AppSettings {
    monthly_envelope: number;
    period_type: PeriodType;
    period_value: number;
    carryover_strategy?: CarryoverStrategy; // Nouveau champ
    savings_labels?: string[];
    variable_labels?: string[];
  }
  ```

- **Architecture des composants** :
  - `CarryoverStrategyCard` (molecule) : Configuration UI dans GlobalSettings
  - `GlobalSettings` (organism) : Intégration avec handler `updateCarryoverStrategy`
  - `BalancesView` (feature) : Calcul dual-algorithm + passage de props
  - `BudgetDistributionSummary` (molecule) : Affichage contextuel

- **Flux de données** :

  ```
  AppSettings.carryover_strategy
  ↓
  GlobalSettings (sélection utilisateur)
  ↓
  BalancesView (calcul periodCarryovers)
  ↓
  BudgetDistributionSummary (affichage adaptatif)
  ```

- **Rétrocompatibilité** : Défaut "NEXT_PERIOD" si champ absent (backward compatible)

- **Validation** : 0 erreurs TypeScript sur les 5 fichiers modifiés

### 📊 Exemples d'utilisation

**Scénario 1 : NEXT_PERIOD avec dépassement**

```
Mois divisé en 4 périodes de 500€ chacune
P1: Consommation 778€ → Dépassement -278€
P2: Budget ajusté = 500€ - 278€ = 222€
P3: Budget ajusté = 222€ + solde P2
```

**Scénario 2 : SPREAD_REMAINING avec dépassement**

```
Mois divisé en 4 périodes de 500€ chacune
P1: Consommation 800€ → Dépassement -300€
Périodes restantes : 3 (P2, P3, P4)
Part par période : -300€ ÷ 3 = -100€
P2: Budget ajusté = 500€ - 100€ = 400€
P3: Budget ajusté = 500€ - 100€ = 400€
P4: Budget ajusté = 500€ - 100€ = 400€
```

**Scénario 3 : SPREAD_REMAINING avec reports multiples**

```
P1: Dépassement -300€ → Étalé sur P2, P3, P4 → -100€ chacune
P2: Dépassement -150€ (après ajustement de P1)
    → Reste -50€ → Étalé sur P3, P4 → -25€ chacune
P3: Budget ajusté = 500€ - 100€ (P1) - 25€ (P2) = 375€
P4: Budget ajusté = 500€ - 100€ (P1) - 25€ (P2) = 375€
```

---

## [2.2.4] - 2026-01-09

### Corrigé

- **Bug critique du filtre Extra/Standard** : Les opérations Extra apparaissaient dans le filtre Standard
  - **Cause** : Toggle global `isExtraGlobal: true` avec tags non marqués Extra (`isExtra: false`)
  - **Symptôme** : Opération 77,84€ Extra visible dans filtre "Nature: Standard"
  - **Analyse** : La logique vérifiait `hasStandardTags` en cherchant des tags `!isExtra`, trouvait le tag avec `isExtra: false`, et considérait l'opération comme ayant du Standard
  - **Solution** : Priorité absolue du toggle global sur les flags individuels des tags
    - Si `isExtraGlobal: true` → Toute l'opération est Extra, peu importe les tags
    - Simplification de la logique : 15 lignes → 3 lignes
  - **Impact** : Filtre Standard maintenant cohérent (exclut correctement les opérations avec toggle Extra)

### Amélioré

- **Documentation du système Extra à deux niveaux** : Commentaires détaillés (60 lignes) dans `usePlanner.ts`
  - **Concept clé** : Séparation entre affichage (filtrage) et calculs (montants effectifs)
  - **Architecture à deux niveaux** :
    1. Toggle global (`isExtraGlobal`) : Affecte TOUTE l'opération
    2. Tags individuels (`tagAmounts[].isExtra`) : Affectent des PARTIES de l'opération
  - **Règle de priorité** : Le toggle global a TOUJOURS la priorité absolue
  - **4 scénarios d'exemples** avec résultats attendus :
    - Scénario 1 : Opération 100% Extra (toggle activé, pas de tags)
    - Scénario 2 : Opération 100% Standard (toggle désactivé, pas de tags)
    - Scénario 3 : Opération mixte (toggle désactivé, tags variés)
    - Scénario 4 : Toggle global prioritaire (toggle activé + tags Standard)
  - **3 règles de filtrage** documentées inline :
    - RÈGLE 1 : Toggle global Extra → Tout est Extra (priorité absolue)
    - RÈGLE 2 : Pas de toggle → Analyser les tags individuels
    - RÈGLE 3 : Avec tags → Calculer le reste Standard (total - extraSum)

- **Cohérence TypeScript** : Ajout de `isExtraGlobal` pour les revenus récurrents
  - Correction de l'erreur de compilation manquante
  - Parité complète entre revenus et dépenses

### Technique

- **Logique de filtre simplifiée** :

  ```typescript
  // AVANT (INCORRECT - 15 lignes, complexe)
  if (hasGlobalExtra) {
    if (pas de tags) return false;
    if (tags Standard) return true;  // ❌ Incohérent !
    return false;
  }

  // APRÈS (CORRECT - 3 lignes, simple)
  if (hasGlobalExtra) {
    return false;  // ✅ Toggle Extra → Tout est Extra
  }
  ```

- **Avantages de la simplification** :
  - **Cohérence logique** : Toggle Extra = Tout Extra (pas d'ambiguïté)
  - **Moins de code** : -80% de lignes dans la condition
  - **Maintenabilité** : Logique claire et prévisible
  - **Pas de synchro** : Pas besoin de forcer les tags à `isExtra: true`

---

## [2.2.3] - 2026-01-09

### Ajouté

- **Système global de gestion d'erreurs** : Architecture unifiée avec design élégant pour toutes les erreurs
  - **ErrorContext** : State management global avec hook `useError`
    - `showError(error, context?)` pour afficher ErrorModal
    - `clearError()` pour fermer la modal
    - Type `ErrorInfo` : `{ error, context, timestamp }`
  - **ErrorDisplay** : Composant réutilisable pour affichage unifié
    - Props flexibles pour ErrorModal (avec bouton Fermer) et ErrorBoundary (fullscreen)
    - Design gradient header (rose-50 to orange-50)
    - Stack trace pliable avec boutons chevron
    - Conseils contextuels par type d'erreur (modal vs boundary)
  - **ErrorModal** : Modal overlay pour erreurs de handlers (try/catch)
    - Utilisé par tous les handlers critiques
    - Boutons : Fermer, Rafraîchir, Retour accueil
    - Affichage du contexte (ex: "Drag & drop d'opération")
  - **ErrorBoundary redesigné** : Capture des erreurs React avec UI identique
    - Design unifié avec ErrorModal via ErrorDisplay
    - Contexte automatique : "Erreur dans le cycle de rendu React"
    - Boutons : Rafraîchir, Retour accueil (pas de Fermer)

- **Protection try/catch complète** : 7 handlers critiques sécurisés
  - **OperationsView** : `handleReorder`, `handleDeleteVariable`
  - **VariableTransactionForm** : `handleFormSubmit`, `handleDelete`
  - **TransfersView** : `handleDragEnd`
  - **PlannerModals** : Validation et annulation de pointage
  - Tous les handlers utilisent `showError(err, context)` pour affichage élégant

### Amélioré

- **UX erreurs** : Remplacement de tous les `alert()` et `console.error()` par ErrorModal
  - Messages utilisateur clairs et contextuels
  - Stack trace accessible pour debug (pliable)
  - Actions de récupération (Rafraîchir, Home, Fermer)
  - Design professionnel avec gradient et couleurs sémantiques

- **Architecture composants** : Refactorisation DRY avec ErrorDisplay
  - **-54% de duplication** : 131 lignes (ErrorModal + ErrorBoundary) vs 286 lignes avant
  - **Maintenabilité** : Une seule source de vérité pour le design d'erreur
  - **Réutilisabilité** : Props flexibles pour différents contextes
  - **Cohérence** : Design identique garanti entre ErrorModal et ErrorBoundary

### Corrigé

- **Gestion erreurs silencieuses** : Les erreurs de handlers ne crashent plus l'app
  - Avant : Erreurs loggées dans console, utilisateur perdu
  - Après : Modal élégante avec message + actions
  - Expérience utilisateur grandement améliorée

### Supprimé

- **Artefacts de test** : Nettoyage complet du code de production
  - Fichier `TestErrorBoundary.tsx` supprimé
  - Boutons de test retirés d'OperationsView
  - Import `TestErrorBoundary` nettoyé
  - Code 100% production-ready

### Technique

- **Design System erreurs** : Palette cohérente
  - Header : `bg-gradient-to-br from-rose-50 to-orange-50`
  - Icône : `AlertCircle` dans badge `bg-rose-100 w-14 h-14 rounded-2xl`
  - Contexte : `bg-blue-50 border-blue-200` avec texte `text-blue-700`
  - Message : `bg-rose-50 border-rose-200` avec `font-mono text-rose-700`
  - Stack : `bg-slate-900 text-slate-100 font-mono` (pliable)
  - Conseils : `bg-amber-50 border-amber-200` avec bullet list
  - Actions : `bg-indigo-600` (primaire) + `bg-slate-700` (secondaire)

- **Pattern standard handlers** :

  ```typescript
  import { useError } from "../contexts/ErrorContext";

  const { showError } = useError();

  const handleAction = async () => {
    try {
      await riskyOperation();
    } catch (err) {
      showError(err as Error, "Contexte descriptif");
    }
  };
  ```

- **Flux d'erreurs** :
  ```
  Erreurs Applicatives
          ↓
  ┌───────────────────┬───────────────────┐
  │  Handler Errors   │  Render Errors    │
  │   try/catch       │ Error Boundary    │
  │   → showError()   │ componentDidCatch │
  └────────┬──────────┴────────┬──────────┘
           ↓                   ↓
      ErrorContext        ErrorBoundary
           ↓                   ↓
      ErrorModal          ErrorDisplay
           ↓                   ↓
           └───────────────────┘
                ErrorDisplay
         (composant réutilisable)
  ```

**Impact qualité** : Gestion d'erreurs professionnelle complète (0 alert, 0 console.error, UX élégante)

---

## [2.2.2] - 2026-01-08

### Corrigé

- **Erreurs TypeScript** : Correction des problèmes de typage et d'imports
  - Remplacement de `JSX.Element` par `React.ReactNode` dans `CyclicFilterButton` et `useFilterBarLogic`
  - Ajout de l'import `React` manquant dans `useFilterBarLogic`
  - Correction du chemin d'import de `FilterOption` (relatif depuis `hooks/filterBar/`)
  - Import du type `FormMode` dans `VariableTransactionForm`
  - Création de la constante typée `DEFAULT_MODE` pour résoudre les problèmes d'inférence de type
  - Nettoyage des fichiers de sauvegarde `.bak` et `.bak2`

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

### Refactorisation - Qualité de Code

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
    - Variables d'environnement : configuration Supabase côté client (supabase.ts)

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

- **Standards professionnels** : Code de haute qualité
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
