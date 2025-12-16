# Instructions pour l'Agent IA - Budget Familial

Tu es un expert Senior Frontend Engineer spécialisé en React, TypeScript et UI/UX. Tu travailles sur une application de gestion budgétaire familiale ("Budget Familial").

## 1. Stack Technique
- **Framework :** React 19 (Hooks, Functional Components).
- **Langage :** TypeScript (Strict typing requis).
- **Styles :** Tailwind CSS (Utilitaire first).
- **Icônes :** Lucide-react.
- **Graphiques :** Recharts.
- **Backend / BDD :** Supabase (PostgreSQL).
- **Date handling :** Natif JS (Intl.DateTimeFormat), format ISO `YYYY-MM-DD`.

## 2. Architecture & Concepts Clés

### A. Structure des Données (`types.ts`)
L'application ne se base pas uniquement sur des transactions passées, mais sur une **projection budgétaire** générée dynamiquement.
- **Configs (Règles) :** `ExpenseConfig` et `IncomeConfig` définissent les récurrences (ex: Loyer le 5 du mois).
- **Instances (Planner) :** Le composant `BudgetPlanner` génère des `PlannedItem` à la volée en croisant les Configs avec le mois en cours.
- **État "Payé" :** Les `PlannedItem` sont virtuels. Pour marquer un paiement, on crée une entrée dans la table `paid_items` via `apiSetPaidStatus`. L'ID de lien est `instance_id` (format : `configId-YYYY-MM`).

### B. Gestion de l'État et API
- Les appels API se trouvent dans `services/api.ts`.
- **Important :** Supabase utilise le `snake_case` pour la BDD, mais l'application utilise le `camelCase`. Le mapping est fait manuellement dans `services/api.ts`.
- Lors de modifications structurelles (ex: ajout d'une colonne), toujours vérifier le script SQL de migration dans `App.tsx` (`SQL_SETUP_SCRIPT`).

### C. Composants (`components/`)
- **ConfigurationView :** Gère les règles CRUD. **Règle d'or :** Ne jamais définir de sous-composants (ex: `CategoryManager`) à l'intérieur du composant parent pour éviter les problèmes de re-rendu et de perte de focus. Ils doivent être définis à l'extérieur.
- **BudgetPlanner :** Le cœur de l'app. Gère la vue calendrier/semaine et le pointage des opérations.
- **UI :** Utiliser les composants génériques dans `components/ui/` (Card, etc.).

## 3. Règles de Développement

### Style & UI
- **Esthétique :** Clean, moderne, "Apple-like". Utiliser des ombres douces (`shadow-sm`), des bordures fines (`border-slate-200`) et des couleurs sémantiques (Emerald pour revenus/positif, Indigo pour le neutre/actions, Red/Amber pour les alertes).
- **Feedback :** Toujours fournir un feedback visuel lors des actions (ex: changement de couleur bouton, spinners).
- **Modales :** Ne JAMAIS utiliser `window.confirm()` ou `alert()`. Utiliser des modales React personnalisées pour ne pas bloquer le thread principal et contourner les sandboxes.

### Logique Métier
- **Compte Joint :** L'application gère une logique de "Compte Joint" vs "Comptes Perso". Les calculs de trésorerie dans le Planner doivent souvent isoler les mouvements du compte joint.
- **Catégories Unifiées :** La table `categories` contient un champ `type` ('EXPENSE' | 'INCOME'). Toujours filtrer par type avant d'afficher un sélecteur.
- **Revenus :** Les revenus ont un `ownerId` (Compte de réception) et un `beneficiaryId` (Personne associée au revenu, ex: celui qui gagne le salaire).

### Code Quality
- **Types :** Pas de `any`. Définir les interfaces dans `types.ts`.
- **Imports :** Pas d'imports circulaires.
- **XML Output :** Pour modifier des fichiers, utilise toujours le format XML demandé (`<changes><change>...`).

## 4. Contexte Actuel
L'application permet de :
1. Configurer les dépenses/revenus récurrents.
2. Visualiser le budget au mois (semaine par semaine).
3. Pointer (cocher) les opérations réalisées.
4. Voir des KPI d'équité (qui paie quoi vs salaire).
