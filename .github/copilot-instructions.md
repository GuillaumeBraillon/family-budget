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

## Navigation Dual-Mode (Planner)

[components/BudgetPlanner/BudgetPlanner.tsx](../components/BudgetPlanner/BudgetPlanner.tsx) possède un état `viewMode` :

- **'calendar'** : Suivi mensuel et pointage des opérations (`isPaid`)
- **'models'** : Édition CRUD des règles récurrentes (configs)

Cette séparation rapproche la gestion des règles du contexte métier, contrairement à `ConfigurationView` qui gère uniquement les données structurelles (comptes, membres, catégories).

## Système de Périodes Budgétaires

Configuré via `AppSettings.period_type` :

- **FIXED_DAYS** : Périodes de X jours (ex: semaines de 7 jours)
- **CALENDAR_WEEKS** : Semaines calendaires (lundi-dimanche)
- **CUSTOM_SPLIT** : Découpage du mois en N parts égales

L'enveloppe mensuelle (`monthly_envelope`) est répartie proportionnellement par période dans [hooks/usePlanner.ts](../hooks/usePlanner.ts).

## Calculs d'Équité

**Règle métier :** Les enfants (`Person.isChild = true`) sont exclus des calculs de contribution.

Les revenus (`IncomeConfig`) sont attribués au `beneficiaryId`. Le calcul de l'équité (qui doit payer quoi) se base sur ces attributions dans les composants `EquityKPI` et `DetailedAnalysis`.

## Commandes Développement

```bash
npm run dev        # Lance Vite dev server (port 5173)
npm run build      # Build production TypeScript + Vite
npm run preview    # Preview build de production
```

**Configuration Supabase :** Nécessite les variables d'environnement `SUPABASE_PROJECT_ID` et `SUPABASE_ANON_KEY` (voir [default.env.txt](../default.env.txt)).

## Patterns UI/UX

**InfoBox systématique :** Utiliser [components/ui/InfoBox.tsx](../components/ui/InfoBox.tsx) pour expliquer les concepts financiers lors de l'introduction d'une nouvelle vue.

**Animations de transition :** Classes Tailwind `animate-in fade-in slide-in-from-bottom-2 duration-300` lors des changements de vue.

**Feedback utilisateur :** Toujours afficher des loaders (`loading` state) et messages d'erreur (`error` state avec bouton "RÉESSAYER").

## Fichiers Critiques à Connaître

- [types.ts](../types.ts) : Toutes les interfaces TypeScript (source de vérité)
- [hooks/useBudget.ts](../hooks/useBudget.ts) : Hub central des données
- [hooks/usePlanner.ts](../hooks/usePlanner.ts) : Génération des instances mensuelles
- [services/apiMappers.ts](../services/apiMappers.ts) : Conversion DB ↔ App
- [App.tsx](../App.tsx) : Point d'entrée, gestion des vues principales

## Anti-Patterns à Éviter

- ❌ Appeler Supabase directement depuis un composant
- ❌ Définir des composants dans le corps d'un parent
- ❌ Utiliser `snake_case` dans le code TypeScript
- ❌ Oublier de vérifier `isChild` dans les calculs financiers
- ❌ Ignorer les états `loading`/`error` dans l'UI

## Contexte Projet

L'application a subi une refonte majeure déplaçant la gestion des opérations récurrentes dans l'échéancier (BudgetPlanner) pour rapprocher la configuration de l'action métier. ConfigurationView a été simplifiée pour ne regrouper que les réglages structurels du foyer (membres, comptes, catégories, paramètres globaux).

## Contexte Projet

L'application a subi une refonte majeure déplaçant la gestion des opérations récurrentes dans l'échéancier (BudgetPlanner) pour rapprocher la configuration de l'action métier. ConfigurationView a été simplifiée pour ne regrouper que les réglages structurels du foyer (membres, comptes, catégories, paramètres globaux).
