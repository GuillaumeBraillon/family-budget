# Journal des modifications (Changelog)

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
et ce projet respecte le [Versionnage Sémantique](https://semver.org/spec/v2.0.0.html).

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
