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

## Système de Tags avec Montants (Tag Amounts)

**Concept clé :** Ventilation granulaire des opérations avec montants spécifiques par tag.

### Architecture

- **Table `paid_item_tags`** : Relations avec foreign keys CASCADE (automatic cleanup)
- **Type `TagAmount`** : `{ tagId: string, amount: number, isExtra?: boolean }`
- **Ancien système `tagIds`** : COMPLÈTEMENT SUPPRIMÉ - utiliser uniquement `tagAmounts`

### Règles de Ventilation

- **Partielle autorisée** : La somme des montants tags peut être < montant total (reste non taggé)
- **Validation** : Erreur UNIQUEMENT si somme > montant total
- **Calculs contextuels** : Les totaux s'adaptent aux filtres de tags actifs

```typescript
// ✅ Correct : Ventilation partielle valide
operation: 150€
  tag1: 50€
  tag2: 30€
  reste: 70€ (non taggé)

// ❌ Invalide : Dépassement du total
operation: 100€
  tag1: 60€
  tag2: 50€
  ERREUR: 110€ > 100€
```

### Composants Clés

- **[TagAmountSelector](../components/ui/molecules/TagAmountSelector.tsx)** : Interface de ventilation avec bouton ⭐ Extra par tag
- **getEffectiveAmount()** : Fonction helper pour calculer les montants basés sur les filtres actifs

### Migrations

- `migrations/003_add_tag_amounts.sql` : Création table + migration automatique anciens tags
- `migrations/004_add_tag_is_extra.sql` : Support Extra au niveau tag

## Système Extra à Deux Niveaux

**Concept clé :** Gestion flexible des dépenses "hors budget" à deux niveaux complémentaires.

### Niveaux

1. **Niveau Opération (Global)** : Toggle dans le formulaire → marque toute l'opération
2. **Niveau Tag (Granulaire)** : Bouton ⭐ par tag → marque individuellement certains montants

### Logique de Détection

Fonction `hasExtraAmounts()` dans [hooks/usePlanner.ts](../hooks/usePlanner.ts) :

```typescript
// Une opération est Extra si :
// 1. Le toggle global est activé OU
// 2. Au moins un de ses tags est marqué Extra
const hasExtraAmounts = (isExtraGlobal: boolean, tagAmounts?: TagAmount[]): boolean => {
  if (isExtraGlobal) return true;
  if (tagAmounts) return tagAmounts.some((ta) => ta.isExtra === true);
  return false;
};
```

### Comportement UI

- **Badge "EXTRA"** : Affiché si `item.isExtra === true` (calculé via `hasExtraAmounts`)
- **Filtre "Nature: Extra"** : Inclut toutes les opérations détectées comme Extra
- **Icône ⭐** : Amber quand actif (Extra), gris sinon (Standard)

### Cas d'Usage

```typescript
// Scénario 1 : Tout Extra (toggle global)
operation: 120€, isExtra: true
→ Toute l'opération hors budget

// Scénario 2 : Ventilation mixte (tags individuels)
operation: 200€, isExtra: false
  tag1: 150€ (standard)
  tag2: 50€ ⭐ (Extra)
→ 150€ dans budget, 50€ hors budget

// Scénario 3 : Priorité globale
operation: 300€, isExtra: true
  tag1: 150€
  tag2: 100€ ⭐
→ Toute l'opération hors budget (priorité au toggle global)
```

Documentation complète : [docs/EXTRA_SYSTEM.md](../docs/EXTRA_SYSTEM.md)

## Calculs Intelligents et Filtres

### Montants Effectifs

Quand des filtres de tags sont actifs, utiliser `getEffectiveAmount(item)` au lieu de `item.amount` :

```typescript
// Dans quickStats (OperationsView.tsx)
const getEffectiveAmount = (item: PlannedItem): number => {
  // Pas de filtre → montant total
  if (!filters.includedTagIds?.length) return item.amount;

  // Filtre actif → somme des montants des tags filtrés
  return item.tagAmounts?.filter((ta) => filters.includedTagIds.includes(ta.tagId)).reduce((sum, ta) => sum + ta.amount, 0) || 0;
};
```

### Impacts sur les Calculs

- **QuickPeriodSummary** : Totaux basés sur montants filtrés
- **Soldes par compte** : Ajustés selon les filtres actifs
- **Graphiques** : Données filtrées contextuellement

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
- [hooks/usePlanner.ts](../hooks/usePlanner.ts) : Génération des instances mensuelles + fonction `hasExtraAmounts`
- [services/apiMappers.ts](../services/apiMappers.ts) : Conversion DB ↔ App (inclut `mapDbTagAmount`)
- [services/apiCrud.ts](../services/apiCrud.ts) : Opérations CRUD avec gestion des `paid_item_tags`
- [components/ui/molecules/TagAmountSelector.tsx](../components/ui/molecules/TagAmountSelector.tsx) : Interface de ventilation des tags
- [App.tsx](../App.tsx) : Point d'entrée, gestion des vues principales

## Anti-Patterns à Éviter

- ❌ Appeler Supabase directement depuis un composant
- ❌ Définir des composants dans le corps d'un parent
- ❌ Utiliser `snake_case` dans le code TypeScript
- ❌ Oublier de vérifier `isChild` dans les calculs financiers
- ❌ Ignorer les états `loading`/`error` dans l'UI
- ❌ Utiliser `tagIds` au lieu de `tagAmounts` (système obsolète)
- ❌ Oublier `getEffectiveAmount()` dans les calculs avec filtres de tags
- ❌ Utiliser `item.amount` directement quand des filtres de tags sont actifs

## Contexte Projet

L'application a subi plusieurs refactorings majeurs :

1. **Architecture Opérations** : Déplacement de la gestion des opérations récurrentes dans l'échéancier (BudgetPlanner) pour rapprocher la configuration de l'action métier. ConfigurationView simplifiée pour les réglages structurels uniquement.

2. **Système de Tags** : Migration complète de `tagIds` (JSONB simple) vers `tagAmounts` (table relationnelle avec montants). Support de la ventilation partielle et des calculs contextuels.

3. **Système Extra** : Évolution d'un simple flag booléen à un système à deux niveaux (opération + tags) pour une granularité maximale.
