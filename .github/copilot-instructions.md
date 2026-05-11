# Instructions Copilot - Budget Familial

Tu es un expert Senior Frontend Engineer spécialisé en React, TypeScript et UI/UX. Tu travailles sur une application de gestion budgétaire familiale avec Supabase (PostgreSQL), TypeScript strict et Tailwind CSS.

## Stack Technique

- **Framework :** React 19 (Hooks, Functional Components)
- **Langage :** TypeScript (strict typing requis)
- **Styles :** Tailwind CSS
- **Icônes :** Lucide-react
- **Graphiques :** Recharts
- **Backend/BDD :** Supabase (PostgreSQL)

## Architecture Centrale : Configs vs Instances

**Concept clé :** Le système sépare les **règles récurrentes** (configs) des **instances mensuelles** (planner).

- **ExpenseConfig / IncomeConfig** : Définitions des opérations récurrentes (loyer, salaire, etc.) stockées en base.
- **PlannedItem** : Instances générées dynamiquement pour le mois en cours via [hooks/usePlanner.ts](../hooks/usePlanner.ts).
- **Instance ID** : Format `{configId}-YYYY-MM` pour lier le pointage (`paid_items`) aux instances mensuelles.

```typescript
// Exemple de génération d'instance
const instanceId = `${conf.id}-2025-12`; // Décembre 2025
const isPaid = paidItems[instanceId] !== undefined;
```

## Organisation Atomic Design

Composants structurés selon Atomic Design :

- **atoms/** : Primitives réutilisables (`SearchBar`, `StatCard`)
- **molecules/** : Groupes cohérents (`MonthNavigator`, `OperationRow`)
- **organisms/** : Sections complètes (`DetailedAnalysis`, `CategoryManager`)

**Règle importante :** Ne jamais définir de sous-composants dans le corps d'un composant parent. Toujours extraire dans un fichier séparé ou hors du rendu.

## Flux de Données (Hub Central)

[hooks/useBudget.ts](../hooks/useBudget.ts) est le **seul point d'entrée** pour les données :

- Charge toutes les données via `fetchInitialData()` au démarrage
- Expose `actions` pour CRUD (upsert/delete)
- Gère l'état `loading`, `error`, et détection de DB vide (`isDbEmpty`)

Les composants ne doivent **jamais** appeler directement les API Supabase - passer systématiquement par `useBudget`.

## Mapping Base de Données

**Convention stricte :** `snake_case` (Supabase) → `camelCase` (TypeScript) dans [services/apiMappers.ts](../services/apiMappers.ts). Les conversions se font via les mappers, pas dans `services/api.ts`.

```typescript
// ❌ Mauvais : Accès direct aux noms DB
const name = dbRecord.owner_id;

// ✅ Correct : Utiliser les mappers
const account = mapDbAccount(dbRecord);
const name = account.ownerId;
```

Toutes les fonctions CRUD dans [services/apiCrud.ts](../services/apiCrud.ts) doivent convertir avant/après les appels Supabase.

## Navigation et Vues

**Architecture actuelle :** L'application utilise un système de vues avec navigation par tabs :

- **Dashboard** : Vue d'ensemble financière avec graphiques et analytics
- **Balances** : Suivi des soldes par compte avec ratios cibles
- **Operations (Planner)** : Échéancier mensuel avec pointage des opérations
- **Transfers** : Gestion des virements internes et opérations d'épargne
- **Configuration** : Réglages (comptes, membres, catégories, opérations récurrentes)

La gestion des opérations récurrentes se fait dans la vue Configuration > Opérations, séparée du pointage mensuel dans Operations View.

## Système Extra

**Concept clé :** Gestion simple des opérations "hors budget" via un toggle global.

### Niveaux

1. **Niveau Opération (Global)** : Toggle dans le formulaire → marque toute l'opération

### Comportement UI

- **Badge "EXTRA"** : Affiché si `item.isExtra === true`
- **Filtre "Nature: Extra"** : Inclut les opérations marquées Extra
- **Icône ⭐** : Amber quand actif (Extra), gris sinon (Standard)

### Cas d'Usage

```typescript
// Scénario : Tout Extra (toggle global)
operation: 120€, isExtra: true
→ Toute l'opération hors budget
```

## Calculs Intelligents et Filtres

### Montants Effectifs

Les montants effectifs s'appuient sur le filtre de nature (`ALL`, `ONLY`, `EXCLUDE`) et le flag `isExtraGlobal`.

### Impacts sur les Calculs

- **QuickPeriodSummary** : Totaux alignés sur les filtres actifs
- **Soldes par compte** : Ajustés selon les filtres actifs
- **Graphiques** : Données filtrées contextuellement

## Système de Périodes Budgétaires

Configuré via `AppSettings.period_type` :

- **FIXED_DAYS** : Périodes de X jours (ex: semaines de 7 jours)
- **CALENDAR_WEEKS** : Semaines calendaires (lundi-dimanche)
- **CUSTOM_SPLIT** : Découpage du mois en N parts égales

Le budget de période est calculé à partir du budget personnel (`personal_budget_amount`) de chaque bénéficiaire dans [hooks/usePlanner.ts](../hooks/usePlanner.ts).

## Calculs d'Équité

**Règle métier :** Les enfants (`Person.isChild = true`) sont exclus des calculs de contribution.

Les revenus (`IncomeConfig`) sont attribués au `beneficiaryId`. Le calcul de l'équité (qui doit payer quoi) se base sur ces attributions dans les composants `EquityKPI` et `DetailedAnalysis`.

## Commandes Développement

```bash
npm run dev        # Lance Vite dev server (port 5173)
npm run build      # Build production TypeScript + Vite
npm run preview    # Preview build de production
```

**Configuration Supabase :** Nécessite les variables d'environnement :

- `VITE_SUPABASE_PROJECT_ID` : ID du projet Supabase
- `VITE_SUPABASE_ANON_KEY` : Clé publique anon

Voir [default.env.txt](../default.env.txt) pour le template. Les variables doivent avoir le préfixe `VITE_` pour être accessibles côté client avec Vite.

## Patterns UI/UX

**InfoBox systématique :** Utiliser [components/ui/InfoBox.tsx](../components/ui/InfoBox.tsx) pour expliquer les concepts financiers lors de l'introduction d'une nouvelle vue.

**Animations de transition :** Classes Tailwind `animate-in fade-in slide-in-from-bottom-2 duration-300` lors des changements de vue.

**Feedback utilisateur :** Toujours afficher des loaders (`loading` state) et messages d'erreur (`error` state avec bouton "RÉESSAYER").

## Fichiers Critiques à Connaître

### Types et État Global

- [types.ts](../types.ts) : Toutes les interfaces TypeScript (source de vérité)
- [hooks/useBudget.ts](../hooks/useBudget.ts) : Hub central des données avec actions CRUD
- [hooks/budget/useBudgetBalances.ts](../hooks/budget/useBudgetBalances.ts) : Gestion des soldes de comptes
- [hooks/budget/useBudgetActions.ts](../hooks/budget/useBudgetActions.ts) : Actions CRUD wrappées

### Planification et Opérations

- [hooks/usePlanner.ts](../hooks/usePlanner.ts) : Génération des instances mensuelles
- [hooks/operations/useOperationsData.ts](../hooks/operations/useOperationsData.ts) : Logique métier opérations (inclut `getEffectiveAmount`)
- [hooks/operations/useOperationsFilters.ts](../hooks/operations/useOperationsFilters.ts) : État des filtres

### API et Base de Données

- [services/api.ts](../services/api.ts) : Chargement initial des données (READ)
- [services/apiCrud.ts](../services/apiCrud.ts) : Opérations CRUD transactionnelles
- [services/apiMappers.ts](../services/apiMappers.ts) : Conversion DB ↔ App
- [services/dbTypes.ts](../services/dbTypes.ts) : Types PostgreSQL (snake_case)

### Composants UI

- [App.tsx](../App.tsx) : Point d'entrée, gestion des vues principales
- [components/features/Operations/OperationsView.tsx](../components/features/Operations/OperationsView.tsx) : Vue échéancier avec filtres
- [components/features/Operations/components/PlannerModals.tsx](../components/features/Operations/components/PlannerModals.tsx) : Modales de pointage
- [components/features/Operations/components/VariableTransactionForm.tsx](../components/features/Operations/components/VariableTransactionForm.tsx) : Formulaire transactions variables

### Gestion Budgétaire et Soldes

- [components/features/Balances/BalancesView.tsx](../components/features/Balances/BalancesView.tsx) : Vue soldes avec calculs par bénéficiaire
- [components/features/Balances/components/BudgetDistributionSummary.tsx](../components/features/Balances/components/BudgetDistributionSummary.tsx) : Résumé budgétaire avec répartition par bénéficiaire

### Gestion d'Erreurs

- [contexts/ErrorContext.tsx](../contexts/ErrorContext.tsx) : State management global des erreurs
- [components/ui/ErrorDisplay.tsx](../components/ui/ErrorDisplay.tsx) : Composant réutilisable d'affichage
- [components/ui/ErrorModal.tsx](../components/ui/ErrorModal.tsx) : Modal pour erreurs handlers
- [components/ErrorBoundary.tsx](../components/ErrorBoundary.tsx) : Capture erreurs React

## Anti-Patterns à Éviter

- ❌ Appeler Supabase directement depuis un composant
- ❌ Définir des composants dans le corps d'un parent
- ❌ Utiliser `snake_case` dans le code TypeScript
- ❌ Oublier de vérifier `isChild` dans les calculs financiers
- ❌ Ignorer les états `loading`/`error` dans l'UI
- ❌ Utiliser `alert()` ou `console.error()` - utiliser le système global d'erreurs
- ❌ Appeler Supabase dans un handler sans try/catch

## Gestion d'Erreurs Globale

**Architecture unifiée pour toutes les erreurs applicatives avec design élégant.**

### 🎯 Composants Clés

#### ErrorContext ([contexts/ErrorContext.tsx](../contexts/ErrorContext.tsx))

Gestion d'état global des erreurs de handlers (try/catch).

```typescript
import { useError } from "../contexts/ErrorContext";

const MyComponent = () => {
  const { showError } = useError();

  const handleAction = async () => {
    try {
      await riskyOperation();
    } catch (err) {
      showError(err as Error, "Contexte de l'erreur");
    }
  };
};
```

**Méthodes :**

- `showError(error: Error, context?: string)` : Affiche ErrorModal
- `clearError()` : Ferme la modal

#### ErrorDisplay ([components/ui/ErrorDisplay.tsx](../components/ui/ErrorDisplay.tsx))

Composant réutilisable pour affichage unifié des erreurs.

**Props :**

- `error` : Objet Error à afficher
- `context` : Contexte d'exécution (ex: "Drag & drop")
- `showDetails` : État du toggle stack trace
- `onToggleDetails` : Callback toggle
- `onRefresh` : Action rafraîchir
- `onGoHome` : Action retour accueil
- `onClose?` : Action fermer (ErrorModal uniquement)
- `isModal` : true = overlay modal, false = fullscreen

**Design unifié :**

- Header gradient rose-50 to orange-50
- Icône AlertCircle dans badge rose-100
- Contexte : fond blue-50, texte blue-700
- Message : fond rose-50, texte rose-700 monospace
- Stack trace : Pliable avec bouton chevron, fond slate-900
- Conseils : fond amber-50 avec bullet points
- Footer : Boutons indigo-600 (Rafraîchir) + slate-700 (Home)

#### ErrorModal ([components/ui/ErrorModal.tsx](../components/ui/ErrorModal.tsx))

Modal pour erreurs de handlers. Utilise ErrorDisplay.

**Usage :**

```typescript
// Dans App.tsx
const { currentError, clearError } = useError();

{currentError && (
  <ErrorModal
    isOpen={true}
    error={currentError.error}
    context={currentError.context}
    onClose={clearError}
  />
)}
```

#### ErrorBoundary ([components/ErrorBoundary.tsx](../components/ErrorBoundary.tsx))

Capture les erreurs React (render/lifecycle). Utilise ErrorDisplay.

**Usage :**

```typescript
// Dans index.tsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

**Méthodes :**

- `componentDidCatch()` : Capture et log l'erreur
- `getDerivedStateFromError()` : Met à jour l'état

### 📋 Handlers Protégés

**7 handlers critiques avec try/catch :**

1. **OperationsView**
   - `handleReorder` : Drag & drop d'opérations
   - `handleDeleteVariable` : Suppression d'opération variable

2. **VariableTransactionForm**
   - `handleFormSubmit` : Sauvegarde de transaction
   - `handleDelete` : Suppression de transaction

3. **TransfersView**
   - `handleDragEnd` : Drag & drop de virement

4. **PlannerModals**
   - `onClick` validation : Pointage d'opération
   - `onClick` annulation : Dépointage d'opération

### ✅ Pattern Standard

```typescript
import { useError } from "../contexts/ErrorContext";

const MyComponent = () => {
  const { showError } = useError();

  const handleCriticalAction = async () => {
    try {
      // Opération risquée (API, calculs, etc.)
      await actions.criticalOperation();
    } catch (err) {
      // Affichage élégant via ErrorModal
      showError(err as Error, "Description du contexte");
    }
  };

  return <button onClick={handleCriticalAction}>Action</button>;
};
```

### 🚫 Anti-Patterns

```typescript
// ❌ MAUVAIS : alert() dispersés
const handleAction = () => {
  try {
    riskyOperation();
  } catch (err) {
    alert("Erreur: " + err.message); // UX médiocre
  }
};

// ❌ MAUVAIS : console.error() sans UI
const handleAction = () => {
  try {
    riskyOperation();
  } catch (err) {
    console.error(err); // Utilisateur dans le noir
  }
};

// ❌ MAUVAIS : Pas de try/catch
const handleAction = async () => {
  await actions.dangerousOperation(); // Crash silencieux
};

// ✅ BON : Système global
const handleAction = async () => {
  try {
    await actions.dangerousOperation();
  } catch (err) {
    showError(err as Error, "Opération dangereuse");
  }
};
```

### 🎨 Avantages Architecture

- **UX cohérente** : Design identique pour tous les types d'erreurs
- **DRY** : Composant ErrorDisplay réutilisable (-54% de code)
- **Maintenabilité** : Une seule source de vérité pour le design
- **Debugging** : Stack trace accessible avec toggle
- **Production-ready** : Messages utilisateur + logs développeur
- **Type-safe** : Typage strict de toutes les props

## Contexte Projet

L'application a subi plusieurs refactorings majeurs :

1. **Architecture État Global (v2.2.1)** : Refactorisation complète de useBudget avec délégation aux hooks spécialisés
   - `useBudgetBalances` : Gestion des soldes de comptes
   - `useBudgetActions` : Actions CRUD wrappées avec reload
   - Application des principes SOLID (SRP, DRY, Composition)

2. **Système Extra (v2.0.0)** : Gestion des opérations hors budget via toggle global

- Niveau opération : Toggle global

4. **Gestion d'Erreurs Globale (v2.2.3)** : Architecture unifiée avec design élégant
   - `ErrorContext` : State management global
   - `ErrorDisplay` : Composant réutilisable (-54% duplication)
   - `ErrorModal` + `ErrorBoundary` : Coverage complète
   - 7 handlers critiques protégés avec try/catch

5. **Refactorisation Hooks (v2.2.0)** : Séparation des responsabilités
   - `useOperationsData` : Logique métier (quickStats, getEffectiveAmount)
   - `useOperationsFilters` : État des filtres
   - `usePlannerUI` : État UI (navigation, recherche)
   - Atomic Design appliqué aux hooks

6. **Affichage Opérations Réelles (v2.5.0)** : Vue détaillée des opérations pointées
   - `BalancesTable` : Affichage Total/Standard/Extra pour opérations réelles
   - `ClickableAmount` : Composant réutilisable pour navigation filtrée
   - `useBalancesRows` : Extension interface avec `paidAmount`, `paidStandard`, `paidExtra`
   - Terminologie : "Réel" au lieu de "Pointé"
   - Suivi des délais : Opérations en attente des périodes précédentes

7. **Gestion Dépassements (v2.5.0)** : Suivi des dépassements budgétaires ALLOWANCE

- Calcul basé sur `personal_budget_amount` par bénéficiaire
- Exclusion des montants Extra et virements internes

8. **Support Intérêts d'Épargne (v2.5.0)** : Distinction virements classiques vs ajustements
   - Migration 002 : Flag `is_interest` sur table `transfers`
   - `TransferForm` : Toggle "Intérêts ou Ajustement Exceptionnel"
   - Badge amber "INTÉRÊTS" vs bleu "💰 ÉPARGNE"
   - Exclusion virements internes des calculs budgétaires

9. **Alignement Tri Manuel Operations/Transfers (v2.7.0)** : Unification complète du drag & drop

- `operations_sorting` (Operations) et `accounts_sorting` (Transfers) comme sources de vérité Supabase
- Hook générique `useManualSorting` pour éviter la duplication
- Hook `useTransfersSorting` dédié avec même UX que `useOperationsSorting`

9. **Atomicité transactionnelle (v2.7.0)** : Écritures robustes `paid_items` + `paid_item_beneficiaries`

- RPC PostgreSQL `upsert_paid_item_atomic` (transaction unique)
- Validation SQL : somme des bénéficiaires ≤ montant total, montants strictement positifs
- Refactor `apiCrud.ts` pour appeler la RPC côté client

10. **Optimisation chargement initial (v2.7.0)** : Réduction du payload au strict nécessaire

- `fetchInitialData` charge uniquement les données liées aux `paid_items` récupérés

**Version actuelle :** 2.7.0 (19 février 2026)
**Qualité code :** 0 erreurs ESLint, 0 warnings, TypeScript strict

**Dernières fonctionnalités ajoutées :**

- Tri manuel unifié Operations/Transfers avec persistance Supabase (`operations_sorting` / `accounts_sorting`)
- Hook générique `useManualSorting` + hook spécialisé `useTransfersSorting`
- RPC transactionnelle `upsert_paid_item_atomic` pour garantir l'atomicité des écritures
- Optimisation `fetchInitialData` : chargement scoppé des données relationnelles utiles
- Nettoyage dépendances Vite (versions unifiées, doublons supprimés)
