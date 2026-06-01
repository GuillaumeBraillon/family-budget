# Instructions Copilot - Family Budget

Tu contribues à une application React/TypeScript de gestion budgétaire familiale.
Priorité: fiabilité métier, typage strict, UI cohérente, zéro régression sur les calculs financiers.

## Objectif et périmètre

- Stack: React 19, TypeScript strict, Tailwind, Supabase (PostgreSQL), Vitest.
- Version actuelle: 2.10.8 (voir CHANGELOG).
- Architecture front en Atomic Design + hooks métier.
- Tu dois modifier le minimum nécessaire et préserver les conventions existantes.

## Commandes de dev

- `npm run dev` : serveur Vite
- `npm run build` : build production
- `npm run preview` : preview locale
- `npm run lint` / `npm run lint:fix` : lint
- `npm run tsc` : vérification TypeScript
- `npm run test` : tests Vitest
- `npm run "check commit"` : format + lint fix + tsc + tests

## Source de vérité des données

- Point d'entrée unique côté UI: `hooks/useBudget.ts`.
- Les composants ne doivent pas appeler Supabase directement.
- Accès DB via services seulement (`services/api.ts`, `services/apiCrud.ts`, `services/supabase.ts`).

## Conventions critiques

- Mapping DB obligatoire: `snake_case` -> `camelCase` via `services/apiMappers.ts`.
- TypeScript strict obligatoire (ne pas contourner avec `any`).
- Pas de sous-composant déclaré dans le corps d'un composant React.
- Toujours gérer `loading` et `error` dans les vues.
- Gestion d'erreurs: `useError()` + `showError(...)`; éviter `alert()` et `console.error()` dans les handlers UI.

## Architecture métier (à respecter)

### 1) Configs vs instances mensuelles

- Les règles récurrentes vivent dans `ExpenseConfig` / `IncomeConfig`.
- Les instances de mois sont générées par `hooks/usePlanner.ts`.
- Clé d'instance: `{configId}-YYYY-MM` pour le lien avec `paid_items`.

### 2) Filtres Operations

- Les filtres sont centralisés dans `hooks/filterBar/useFilterBarLogic.tsx` et `hooks/operations/*`.
- Sémantique importante: un filtre "actif mais vide" doit exclure tout résultat (ex: tout décoché).
- Les catégories/sous-catégories proposées doivent être contextualisées au mois courant.

### 3) Exclusions budgétaires

- Exclure des calculs budgétaires:
  - `category === "Virement Interne"`
  - `subCategory === "Intérêts"`
- Référence: `services/financeUtils.ts` (`isBudgetExcluded`).

### 4) Permissions admin vs non-admin

- `AdminViewContext` gère le mode "voir comme non-admin".
- Les actions sensibles (édition/réordonnancement) doivent rester réservées aux admins effectifs.
- Vérifier l'impact UI dans Dashboard/Operations/Navigation.

### 5) Virements épargne (règle pivot)

- Depuis épargne -> destination compte joint obligatoire.
- Vers épargne -> source compte joint obligatoire.
- Référence: `hooks/transfers/useTransferForm.ts`.

### 6) Tri manuel

- Operations: tri persistant via `operations_sorting`.
- Les interactions DnD doivent respecter le mode de tri manuel et les permissions.

## Fichiers pivots à consulter avant modification

- `types.ts`
- `App.tsx`
- `hooks/useBudget.ts`
- `hooks/usePlanner.ts`
- `hooks/operations/useOperationsData.ts`
- `hooks/filterBar/useFilterBarLogic.tsx`
- `hooks/transfers/useTransferForm.ts`
- `hooks/balances/useBalancesData.ts`
- `hooks/balances/useBalancesRows.ts`
- `services/api.ts`
- `services/apiCrud.ts`
- `services/apiMappers.ts`
- `services/financeUtils.ts`
- `contexts/ErrorContext.tsx`

## Règles de modification

- Préférer des changements ciblés et atomiques.
- Si tu touches une règle de calcul: ajouter/adapter des tests Vitest associés.
- Si tu touches un mapper DB: valider les tests de mapping.
- Si tu touches opérations/filtres: vérifier cas Standard/Extra/Salaire + actif vide.
- Si tu touches balances: vérifier standard vs extra vs pending et exclusions de virements internes.

## Points d'attention récents (2.10.x)

- Suppression complète du système de tags (ne pas réintroduire de types ou logique tags).
- RPC de référence pour pointage: `upsert_paid_item_atomic`.
- `isSalary` existe aussi sur les transactions variables.
- Ajustements UX récents sur FilterBar et responsive mobile (safe-area bottom padding).

## Documentation à lier (ne pas dupliquer)

- Changelog: [CHANGELOG.md](../CHANGELOG.md)
- README produit/architecture: [README.md](../README.md)
- Versioning: [docs/VERSION_MANAGEMENT.md](../docs/VERSION_MANAGEMENT.md)
- Setup DB: [startup/README.md](../startup/README.md)
- Script SQL global: [startup/database_complete.sql](../startup/database_complete.sql)

## Anti-patterns interdits

- Appel direct Supabase depuis un composant.
- Conversion `snake_case/camelCase` faite hors mappers.
- Contournement du typage strict avec casts non justifiés.
- Régression des permissions admin/non-admin.
- Régression sur les règles métiers de budget (extra, salaires, virements internes, pivot épargne).
