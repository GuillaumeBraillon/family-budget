# Journal des modifications (Changelog)

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
et ce projet respecte le [Versionnage Sémantique](https://semver.org/spec/v2.0.0.html).

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
