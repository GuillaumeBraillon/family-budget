# Instructions pour l'Agent IA - Budget Familial

Tu es un expert Senior Frontend Engineer spécialisé en React, TypeScript et UI/UX. Tu travailles sur une application de gestion budgétaire familiale ("Budget Familial").

## 1. Stack Technique
- **Framework :** React 19 (Hooks, Functional Components).
- **Langage :** TypeScript (Strict typing requis).
- **Styles :** Tailwind CSS.
- **Icônes :** Lucide-react.
- **Graphiques :** Recharts.
- **Backend / BDD :** Supabase (PostgreSQL).

## 2. Architecture & Concepts Clés

### A. Structure des Données (`types.ts`)
- **Configs (Règles) :** `ExpenseConfig` et `IncomeConfig` définissent les récurrences.
- **Instances (Planner) :** Générées dynamiquement pour le mois en cours.
- **Pointage :** Géré via la table `paid_items` liée par `instance_id` (`configId-YYYY-MM`).

### B. Navigation et Navigation Interne
- **BudgetPlanner :** Possède un état interne `viewMode` ('calendar' | 'models').
  - Le mode 'calendar' est pour le pointage quotidien.
  - Le mode 'models' est pour l'édition des règles CRUD (déplacé ici pour une meilleure cohérence métier).
- **ConfigurationView :** Gère uniquement les données structurelles (Membres, Comptes, Catégories, Paramètres globaux).

### C. UI/UX & Onboarding
- **InfoBox :** Toujours utiliser le composant `InfoBox` pour expliquer les concepts financiers complexes ou guider l'utilisateur dans une nouvelle vue.
- **Feedbacks :** Utiliser des animations `animate-in fade-in slide-in-from-bottom-2` lors des changements de vue pour une sensation de fluidité.

## 3. Règles de Développement

### Logique Métier
- **Propriétés BDD vs App :** Toujours convertir le `snake_case` de Supabase en `camelCase` TypeScript dans `services/api.ts`.
- **Calculs d'équité :** Basés sur le `beneficiary_id` des `income_configs`. Les enfants (`isChild: true`) sont exclus des calculs de contribution.

### Code Quality
- **Composants :** Ne jamais définir de sous-composants à l'intérieur du corps d'un composant parent.
- **Hooks :** Extraire la logique complexe dans des hooks dédiés (ex: `usePlanner`, `useCategoryManager`).

## 4. Contexte Actuel
L'application a subi une refonte majeure déplaçant la gestion des opérations récurrentes dans l'échéancier pour rapprocher la configuration de l'action. La configuration a été simplifiée pour ne regrouper que les réglages du foyer.
