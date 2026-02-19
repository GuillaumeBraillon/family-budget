# Audit technique — Family Budget

Dernière mise à jour : **2026-02-19**  
Version repo observée : `package.json` → **2.6.27**  
Référentiel de conventions : `.github/copilot-instructions.md`

## Objectif

Ce document sert de **rapport d’audit** et de **journal de suivi** pour appliquer et vérifier les corrections au fur et à mesure.

## Comment reproduire (état de référence)

- **Lint** : `npm run lint` (actuellement bloquant si warnings)
- **Typecheck** : `npx tsc --noEmit` (actuellement en échec)

## Architecture actuelle (résumé)

- **UI** : React (Vite), composants fonctionnels + hooks, Tailwind.
- **Navigation** : state local dans `App.tsx` avec vues : dashboard / balances / planner / transfers / config.
- **Hub data** : `hooks/useBudget.ts` (chargement initial via `fetchInitialData`, exposition d’actions).
- **Supabase** :
  - client/config : `services/supabase.ts`
  - read initial : `services/api.ts` (`fetchInitialData`)
  - mutations : `services/apiCrud.ts`
  - mapping DB↔App : `services/apiMappers.ts` + types DB `services/dbTypes.ts`
- **Erreurs** :
  - handlers : `contexts/ErrorContext.tsx` + `components/ui/ErrorModal`
  - rendu React : `components/ErrorBoundary.tsx`

## Checklist de conformité (conventions projet)

- [x] Les composants **n’appellent jamais** Supabase directement (passent par `useBudget` / services).
- [x] Le mapping `snake_case → camelCase` ne se fait que dans `services/apiMappers.ts`.
- [x] `tagIds` n’est utilisé nulle part (seulement `tagAmounts`).
- [x] Aucun sous-composant défini dans le corps d’un composant parent (Atomic Design).
- [x] Gestion d’erreurs : pas de `alert()` / `console.error()` sans UI ; handlers à risque avec `try/catch` + `showError`.
- [x] **TypeScript strict** : `npx tsc --noEmit` passe.
- [x] ESLint : `npm run lint` passe (0 warning).

---

## Problèmes trouvés (liste actionnable)

### 1) TypeScript ne passe pas (`tsc --noEmit`) — **CRITIQUE** ✅ Corrigé

- **Gravité** : critique
- **Impact** : perte de garanties de types, régressions silencieuses, refactors risqués.
- **Preuves** : `npx tsc --noEmit` remonte notamment :
  - filtres incohérents (`extra` vs `nature`)
  - variable `ready` non définie dans `AnalyticsCards.tsx`
  - réapparition de `position` (ancienne logique) dans plusieurs zones
  - typages/exports manquants (`SortOrder`, `Account` non importé, etc.)
- **Correction concrète (priorité 0)** :
  - Corriger d’abord les erreurs structurelles ci-dessous (sections 2, 3, 4).
  - Ajouter un script `typecheck` (ex: `tsc --noEmit`) et l’exécuter en CI.

### 2) Exposition potentielle de secrets côté client — **CRITIQUE** ✅ Corrigé

- **Gravité** : critique
- **Où** : `vite.config.ts`
- **Constat** : injection de variables dans le bundle client via `define` (configuration Vite), incluant `GEMINI_API_KEY`.
- **Risque** : toute valeur injectée est **visible/extractible** dans le bundle navigateur.
- **Correction concrète** :
  - Ne jamais exposer de clé “serveur” dans le client.
  - Migrer vers un backend/proxy (serverless) pour les appels nécessitant une clé privée.
  - Conserver uniquement les variables publiques côté client (ex: Supabase anon key).

### 3) Configuration Supabase incohérente (localStorage/env/UI) — **IMPORTANT** ✅ Corrigé

- **Gravité** : important
- **Où** :
  - `services/supabase.ts` lit `supabase_project_id` / `supabase_key`
  - `App.tsx` supprime `SUPABASE_PROJECT_ID` / `SUPABASE_ANON_KEY` (reset inopérant)
  - `DatabaseConnectionCard.tsx` attend `isFromEnv` mais `getSupabaseConfig()` ne le fournit pas
- **Impact** :
  - reset de connexion non fiable
  - UI “source navigateur vs .env” incorrecte
  - confusion avec conventions Vite (`VITE_*` + `import.meta.env`)
- **Correction concrète** :
  - Standardiser les noms de clés localStorage (une seule convention, partout).
  - Utiliser `import.meta.env.VITE_SUPABASE_PROJECT_ID` / `VITE_SUPABASE_ANON_KEY`.
  - Faire retourner `{ isFromEnv: boolean }` par `getSupabaseConfig()`.

### 4) Régression filtres : `extra` vs `nature` — **IMPORTANT** ✅ Corrigé

- **Gravité** : important
- **Où** :
  - `types.ts` définit `OperationFilters.nature`
  - `ClickableAmount.tsx` utilise `extra`
  - `useFilterBarLogic.tsx` a un `clear()` qui écrit `extra`
- **Impact** :
  - navigation filtrée cassée (et erreurs TypeScript)
  - comportement incohérent entre UI et logique
- **Correction concrète** :
  - Remplacer `extra` par `nature` partout.
  - Vérifier les défauts : `nature: "EXCLUDE"` pour standard, `nature: "ALL"` pour tout.

### 5) “Ancien système `position`” encore présent — **IMPORTANT** ✅ Corrigé

- **Gravité** : important
- **Où** :
  - `services/dbTypes.ts` contient `position?` sur `DbPaidItem` et `DbTransfer`
  - `services/api.ts` essaye de propager `position` dans `VariableTransaction`
  - `hooks/transactions/useTransactionForm.ts` réinjecte `position`
  - `hooks/transfers/useTransfersData.ts` trie encore via `position`
- **Impact** :
  - source de vérité ambiguë entre DB `position` et `settings.*_sorting`
  - bugs de tri / ordre, dette technique persistante
- **Correction concrète (à choisir)** :
  - **Option A (recommandée)** : supprimer `position` côté app et basculer sur `operations_sorting` / `accounts_sorting` (et ajouter un tri dédié aux transferts si nécessaire).
  - **Option B** : si `position` reste nécessaire, l’assumer : typage + mapping + persistance cohérents, et tests.

### 6) Non-atomicité possible sur `paid_item_tags` — **IMPORTANT** ✅ Corrigé

- **Gravité** : important
- **Où** : `services/apiCrud.ts` (`apiSetPaidStatus`, `apiUpsertVariableTransaction`)
- **Constat** : séquence `DELETE` puis `INSERT` en requêtes séparées.
- **Risque** :
  - perte de tags si la seconde requête échoue
  - états partiels en cas de double soumission / latence / erreurs réseau
- **Correction concrète** :
  - RPC Supabase transactionnelle (upsert paid_item + remplacement tags atomique).
  - À défaut : check strict des retours `error` sur chaque requête + stratégie de retry/rollback.

### 7) Performance : chargement initial coûteux + `select("*")` — **IMPORTANT** ✅ Corrigé

- **Gravité** : important
- **Où** : `services/api.ts` (`fetchInitialData`)
- **Constat** : ~13 requêtes parallèles, toutes en `select("*")`, incluant `paid_items` et `paid_item_tags`.
- **Impact** :
  - surcoût réseau/CPU
  - scalabilité limitée (historique qui grossit)
- **Correction concrète** :
  - sélectionner uniquement les colonnes nécessaires
  - scoper `paid_items`/`paid_item_tags` (mois courant, pagination, ou lazy-load)
  - index DB selon accès (ex: `paid_item_tags.paid_item_instance_id`)

### 8) Lint : warnings bloquants + code mort local — **MINEUR** ✅ Corrigé

- **Gravité** : mineur (mais bloque `npm run lint` car `max-warnings 0`)
- **Exemples** :
  - imports non utilisés dans `components/features/Operations/OperationsView.tsx` (`useCallback`, `arrayMove`)
  - usage de `any` dans des hooks de tri
  - `prefer-const` dans `hooks/useBudget.ts`
- **Correction concrète** :
  - supprimer imports/vars inutilisés
  - remplacer `any` par types (unions simples / generics mieux contraints)

### 9) `package.json` : dépendances Vite dupliquées/incohérentes — **MINEUR** ✅ Corrigé

- **Gravité** : mineur
- **Constat** : `vite` + `@vitejs/plugin-react` présents en `dependencies` et `devDependencies` avec versions différentes.
- **Impact** : confusion de versions, builds non déterministes.
- **Correction** : garder ces paquets en `devDependencies` uniquement, avec une version unique.

---

## Suivi des corrections (à cocher)

### Priorité 0 — remettre le projet “healthy”

- [x] (P0) Corriger `extra → nature` partout (types + défauts + navigation).
- [x] (P0) Retirer `ready` non défini dans `AnalyticsCards.tsx` (utiliser `_isChartReady`).
- [x] (P0) Décider et appliquer la stratégie `position` (Option A ou B) pour operations/transfers/variables.
- [x] (P0) Rendre cohérente la config Supabase (localStorage/env) + `isFromEnv`.
- [x] (P0) `npx tsc --noEmit` passe.
- [x] (P0) `npm run lint` passe.

### Sécurité

- [x] (SEC) Retirer toute injection de clé privée (ex: `GEMINI_API_KEY`) du bundle client.
- [x] (SEC) Vérifier que seules des données minimales sont chargées côté client (éviter `select("*")`).

### Performance / Données

- [x] (PERF) Réduire le payload `fetchInitialData` (colonnes explicites, scope temporel).
- [x] (DATA) Rendre la mise à jour `paid_item_tags` atomique (RPC/transaction).

### UX / Tri manuel

- [x] (UX) Aligner le Drag & Drop `Transfers` sur `Operations` (mêmes capteurs, collisions, logique de reorder, mode `manual`).
- [x] (UX) Supprimer la persistance locale de l’ordre manuel des virements au profit de Supabase (`app_settings.accounts_sorting`).
- [x] (ARCHI) Extraire la logique de tri manuel commune dans un hook réutilisable (éviter le copier-coller).

---

## Journal de modifications (à remplir au fil de l’eau)

> Format conseillé : 1 ligne par modification livrée.

| Date       | Sujet                               | Gravité   | Statut | Référence (commit/PR) | Notes                                                         |
| ---------- | ----------------------------------- | --------- | ------ | --------------------- | ------------------------------------------------------------- |
| 2026-02-19 | Cleanup deps Vite (`package.json`)  | Mineur    | Fait   | -                     | Suppression doublons deps/devDeps + version unique           |
| 2026-02-19 | Perf + atomicité RPC `paid_item_tags` | Important | Fait | -                     | Chargement tags scoppé + RPC transactionnelle (upsert paid_item + tags) |
| 2026-02-19 | DnD Transfers aligné Operations     | Important | Fait   | -                     | Tri manuel unifié + persistence `accounts_sorting`            |
| 2026-02-18 | Sécurité (Secrets, Select Columns)  | Critique  | Fait   | -                     | Nettoyage bundle client                                       |
| 2026-02-18 | Correctifs P0 (Types, Lint, Config) | Critique  | Fait   | -                     | Rétablissement santé projet                                   |
| 2026-02-17 | Création rapport audit              | -         | Fait   | -                     | État initial, sert de suivi                                   |
