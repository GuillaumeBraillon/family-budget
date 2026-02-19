# 💰 Budget Familial

Application web complète de gestion financière pour couples et familles, développée avec React et TypeScript, hébergée sur Vercel avec base de données Supabase.

---

## 📑 Table des matières

- [Présentation](#-présentation)
- [Fonctionnalités complètes](#-fonctionnalités-complètes)
- [Démarrage rapide](#-démarrage-rapide)
- [Configuration](#️-configuration)
- [Stack technique](#-stack-technique)
- [Architecture](#-architecture)
- [Historique de conception](#-historique-de-conception)
- [Contribution](#-contribution)
- [Documentation](#-documentation)

---

## 🎯 Présentation

**Family Budget** est une application de gestion budgétaire pensée pour les couples et familles souhaitant :

- 📊 Suivre leurs **revenus et dépenses** en temps réel
- 💳 Gérer **plusieurs comptes bancaires** (courants, épargne)
- 🔄 Automatiser les **opérations récurrentes** (loyers, salaires, abonnements)
- 🏷️ **Ventiler finement** les dépenses par tags avec montants
- ⚖️ Calculer l'**équité des contributions** entre membres du foyer
- 📈 Visualiser les **tendances** et **projections** budgétaires
- 🔐 Contrôler les **accès** via whitelist utilisateur

---

## ✨ Fonctionnalités complètes

### 🏠 Dashboard

**Vue d'ensemble financière instantanée**

- 💰 **Synthèse patrimoniale** : Total des actifs (comptes courants + épargne)
- 📊 **Graphiques annuels** :
  - Analyse mensuelle globale (cashflow macro avec salaires)
  - Analyse des revenus non salariaux par période
  - Répartition des dépenses par catégorie
- 🎯 **Navigation rapide** : Accès direct aux opérations par mois/période
- ⚡ **Performance optimale** : Chargement instantané des données

**Indicateurs clés** :

- Solde total du patrimoine
- Soldes par compte (courant / épargne)
- Mouvements mensuels d'épargne
- Tendances des dépenses

---

### 💳 Vue Soldes

**Suivi en temps réel des comptes bancaires**

- 📊 **Tableau récapitulatif** :
  - Solde actuel par compte
  - Dépenses fixes payées vs à venir
  - Dépenses variables du mois
  - Budget restant disponible
- 🎯 **Distribution budgétaire** :
  - Ratios cibles par compte (ex: 60% Compte 1, 40% Compte 2)
  - Caps de sécurité pour épargne
  - Calculs d'équité entre bénéficiaires
- 💰 **Comptes joints** : Support des comptes partagés
- 🔄 **Actualisation automatique** : Mise à jour après chaque opération pointée

**Fonctionnalités avancées** :

- Modification manuelle des soldes (régularisations)
- Visualisation des écarts budget prévu vs réel
- Suivi des contributions par personne

---

### 📅 Vue Opérations (Échéancier)

**Gestion complète des flux financiers**

#### 🔄 Opérations récurrentes

- **Dépenses fixes** : Loyer, abonnements, assurances
- **Revenus réguliers** : Salaires, allocations, revenus locatifs
- **Configuration** :
  - Montant, catégorie, sous-catégorie
  - Jour du mois d'échéance
  - Bénéficiaire et compte associé
  - Période de validité (date début/fin)
  - Flag "Extra" (hors budget)
  - Flag "Salaire" (exclusion analytique)

#### 💸 Opérations variables

- **Dépenses ponctuelles** : Courses, restaurants, loisirs
- **Revenus exceptionnels** : Remboursements, primes
- **Saisie rapide** :
  - Date, montant, catégorie
  - Libellés suggérés (auto-complétion)
  - Support des tags avec ventilation
  - Mode "En attente" vs "Pointé"

#### 🏷️ Système de tags avec montants

- **Ventilation granulaire** : Affectez des montants spécifiques à chaque tag
- **Ventilation partielle autorisée** : Montant non taggé possible
- **Calculs contextuels** : Les totaux s'adaptent aux filtres actifs
- **Affichage détaillé** : Montants par tag dans les listes

**Exemple** :

```
Courses alimentaires : 150€
  - Tag "Alimentaire" : 100€
  - Tag "Produits ménagers" : 30€
  - Sans tag : 20€
```

#### ⭐ Gestion Extra à deux niveaux

- **Niveau opération** : Marquer toute l'opération comme "hors budget"
- **Niveau tag** : Marquer individuellement certains montants de tags comme Extra
- **Flexibilité maximale** : Opérations mixtes (ex: 150€ normaux + 50€ Extra)

#### 🔍 Filtres puissants

- **Flux** : Dépenses / Revenus / Tout
- **Source** : Récurrent / Variable / Tout
- **Statut** : En attente / Pointé / Tout
- **Nature** : Standard / Extra / Exclure Extra
- **Transferts** : Inclure / Exclure
- **Salaires** : Inclure / Exclure
- **Comptes** : Filtrage multi-sélection
- **Bénéficiaires** : Filtrage multi-sélection
- **Tags** : Inclusion / Exclusion / Présence

#### 📊 Modes d'affichage

- **Vue par période** : Semaines ou périodes personnalisées
- **Vue mensuelle** : Tous les flux du mois
- **Tri Manuel (Drag & Drop)** : Réorganisez l'ordre des opérations
- **Tri automatique** : Par date, montant, catégorie, alphabétique

#### ✅ Pointage des opérations

- **Modification rapide** :
  - Montant réel vs prévu
  - Date effective
  - Compte utilisé
  - Libellé personnalisé
  - Ventilation par tags
- **Gestion de la waiting list** : Mode "En attente" pour opérations futures
- **Historique** : Conservation des montants d'origine

#### 🔢 Synthèse budgétaire

- **Dépenses fixes** : Payées / À payer / En retard
- **Dépenses variables** : Réelles du mois
- **Revenus** : Réels vs prévus
- **Budget restant** : Enveloppe mensuelle - dépenses

---

### 🔄 Vue Comptes (Virements)

**Gestion des transferts entre comptes**

#### 💸 Virements internes

- **Création** : Source, destination, montant, libellé, date
- **Suivi mensuel** : Historique complet des mouvements
- **Calcul des soldes** : Impact automatique sur les comptes
- **Motifs récurrents** : Auto-complétion des libellés fréquents

#### 💰 Opérations directes sur épargne

- **Versements** : Intérêts, primes
- **Retraits** : Dépenses exceptionnelles
- **Régularisations** : Ajustements manuels

#### 📊 Indicateurs

- **Total vers épargne** : Somme des virements sortants
- **Total depuis épargne** : Somme des retraits
- **Solde net épargne** : Impact mensuel
- **Historique avec soldes** : Évolution temporelle

#### 🔍 Filtres

- **Type de compte** : Tous / Courants / Épargne / Compte spécifique
- **Motif** : Filtrage par libellé récurrent
- **Filtre intérêts** : Tous / Intérêts uniquement / Sans intérêts

#### 🎯 Tri Manuel (Drag & Drop)

Réorganisez l'ordre d'affichage des virements pour prioriser visuellement.

---

### ⚙️ Vue Réglages (Configuration)

**Centre de paramétrage complet**

#### 🌐 Paramètres Globaux

- **Enveloppe mensuelle** : Budget total à répartir
- **Type de période** :
  - Jours fixes (ex: semaines de 7 jours)
  - Semaines calendaires (lundi-dimanche)
  - Découpage personnalisé (N parts égales)
- **Valeur de période** : Nombre de jours ou de parts
- **Configuration base de données** :
  - Variables d'environnement Supabase (`VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_ANON_KEY`)
  - Statut de configuration détecté automatiquement au démarrage

#### 👥 Membres du Foyer

- **Gestion** : Ajout, modification, suppression
- **Propriétés** :
  - Nom
  - Type : Adulte / Enfant
- **Calculs d'équité** : Les enfants sont exclus automatiquement

#### 💳 Comptes Bancaires

- **Types** :
  - Courants (opérations quotidiennes)
  - Épargne (capitalisation)
  - Virements (techniques)
- **Configuration** :
  - Nom, banque
  - Propriétaire (membre du foyer)
  - Solde initial
  - Ratio cible budgétaire (%)
  - Cap de sécurité épargne
  - Mode joint (partagé)

#### 📁 Catégories

- **Hiérarchiques** : Catégorie → Sous-catégories
- **Types** : Dépenses / Revenus
- **Exemples** :
  - Habitation → Loyer, Électricité, Internet
  - Transport → Essence, Assurance, Entretien
  - Salaire → Salaire net, Primes

#### 🏷️ Tags

- **Création** : Nom + Couleur
- **Usage** : Ventilation transversale des opérations
- **Filtrage** : Inclusion/Exclusion dans les analyses

#### 📋 Libellés Sauvegardés

- **Types** :
  - Opérations courantes (débits/crédits)
  - Virements internes
  - Opérations d'épargne
- **Auto-complétion** : Saisie rapide des libellés fréquents
- **Import automatique** : Détection des libellés CB et VIR existants

#### 🔄 Modèles d'Opérations

- **Dépenses récurrentes** : Configuration complète des charges fixes
- **Revenus récurrents** : Salaires, allocations, revenus réguliers
- **Édition en masse** : Modification groupée possible

#### 🛡️ Utilisateurs Autorisés

- **Whitelist** : Liste des emails autorisés à se connecter
- **Demandes en attente** : Validation manuelle des nouveaux utilisateurs
- **Gestion** :
  - Autoriser / Refuser
  - Ajouter des notes
  - Supprimer définitivement
- **Historique** : Date d'ajout, ajouté par, dernière connexion

---

## 🚀 Démarrage rapide

### Installation locale

```bash
# Cloner le repository
git clone https://github.com/votre-username/family-budget.git
cd family-budget

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp default.env.txt .env
# Éditez .env avec vos identifiants Supabase

# Lancer en développement
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

### Déploiement complet

Suivez le guide de déploiement complet : **[startup/README.md](./startup/README.md)**

**Sommaire du guide** :

1. [Configurer Supabase](./startup/deploy_supabase.md) (~15 min)
2. [Déployer sur Vercel](./startup/deploy_vercel.md) (~10 min)

---

## 🛠️ Configuration

### Variables d'environnement

Créez un fichier `.env` à la racine :

```env
VITE_SUPABASE_PROJECT_ID=votre_project_id
VITE_SUPABASE_ANON_KEY=votre_anon_key
```

**Obtention des identifiants** :

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Allez dans Settings > API
3. Copiez le Project ID et l'anon/public key

### Base de données

**Initialisation complète** :

```bash
# Via Supabase SQL Editor
# Exécutez le fichier database_complete.sql
```

Le script crée automatiquement :

- ✅ 12 tables principales
- ✅ Tous les index de performance
- ✅ Politiques Row Level Security
- ✅ Contraintes, colonnes de tri manuel (`operations_sorting` / `accounts_sorting`) et fonction RPC transactionnelle pour les tags

Ce fichier inclut désormais les évolutions récentes (tri manuel déterministe + RPC transactionnelle) pour permettre un bootstrap complet sans rejouer des migrations historiques.

**Détails** : Voir [startup/database_complete.sql](./startup/database_complete.sql) (commenté)

---

## 🔧 Stack technique

### Frontend

- **React 19** : Framework UI moderne avec Hooks
- **TypeScript** : Typage strict pour robustesse maximale
- **Vite** : Build tool ultra-rapide (~1s hot reload)
- **Tailwind CSS** : Design system utilitaire
- **Lucide React** : Bibliothèque d'icônes modernes
- **Recharts** : Graphiques interactifs
- **DnD Kit** : Drag & drop natif

### Backend & Infrastructure

- **Supabase** : Backend-as-a-Service (PostgreSQL + Auth + Storage)
- **PostgreSQL** : Base de données relationnelle
- **Row Level Security** : Sécurité native au niveau DB
- **Google OAuth** : Authentification via Google Sign-In

### Hébergement & CI/CD

- **Vercel** : Déploiement automatique et CDN global
- **GitHub Actions** : CI/CD (si configuré)

### Outils de développement

- **ESLint** : Linter JavaScript/TypeScript
- **PostCSS** : Processeur CSS pour Tailwind

### Gestion d'erreurs

- **ErrorContext** : State management global des erreurs
- **ErrorDisplay** : Composant réutilisable pour UI unifiée
- **ErrorModal** : Modal overlay pour erreurs de handlers
- **ErrorBoundary** : Capture des erreurs React avec fallback UI
- **Try/catch systématique** : 7 handlers critiques protégés

---

## 🏗️ Architecture

### Atomic Design

```
components/
├── ui/
│   ├── atoms/          # Primitives (Button, Input, SearchBar)
│   ├── molecules/      # Composants composés (FilterBar, MonthNavigator)
│   └── organisms/      # Sections complètes (CategoryManager, PeopleManager)
├── features/           # Vues métier
│   ├── Dashboard/
│   ├── Balances/
│   ├── Operations/
│   ├── Transfers/
│   └── Configuration/
└── Layout/             # Header, navigation
```

### Hooks métier

```
hooks/
├── useBudget.ts        # Hub central des données (single source of truth)
├── usePlanner.ts       # Génération des instances mensuelles
├── useAuth.ts          # Authentification Supabase
├── useAuthorization.ts # Whitelist utilisateur
└── usePlannerUI.ts     # État UI (navigation, recherche, tri)
```

### Services

```
services/
├── api.ts              # Chargement des données (READ)
├── apiCrud.ts          # Opérations CRUD (CREATE/UPDATE/DELETE)
├── apiMappers.ts       # Conversion DB ↔ App (snake_case ↔ camelCase)
├── dbTypes.ts          # Types PostgreSQL (snake_case)
├── supabase.ts         # Client Supabase
├── logger.ts           # Logs développement
└── errorFormatter.ts   # Messages d'erreur utilisateur
```

### Gestion d'erreurs

#### Architecture unifiée

**Système global avec design élégant pour toutes les erreurs applicatives.**

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

**Composants clés** :

- **ErrorContext** : State management global (hook `useError`)
- **ErrorDisplay** : Composant réutilisable avec design unifié
- **ErrorModal** : Modal pour erreurs de handlers (try/catch)
- **ErrorBoundary** : Capture erreurs React (render/lifecycle)

**Pattern standard** :

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

**Design unifié** :

- Header gradient rose-50 to orange-50
- Stack trace pliable avec chevrons
- Contexte coloré (blue pour info, rose pour erreur)
- Actions : Fermer, Rafraîchir, Retour accueil

**Handlers protégés** :

1. Drag & drop opérations/virements
2. Suppression opérations/transactions
3. Soumission formulaires
4. Pointage/dépointage opérations

### Concepts clés

#### Configs vs Instances

- **Configs** : Règles récurrentes stockées en DB (loyer, salaire)
- **Instances** : Opérations mensuelles générées dynamiquement
- **PaidItems** : Pointages et ajustements des instances

**Exemple** :

```typescript
// Config (règle permanente)
const loyer: ExpenseConfig = {
  id: "exp_001",
  label: "Loyer appartement",
  amount: 800,
  dayOfMonth: 5,
  // ...
};

// Instance générée pour janvier 2026
const instanceId = "exp_001-2026-01"; // Format : configId-YYYY-MM
```

#### Mapping Base de Données

- **Convention stricte** : `snake_case` (DB) → `camelCase` (TypeScript)
- **Mappers obligatoires** : Jamais d'accès direct aux noms DB
- **Type safety** : Types DB séparés des types App

```typescript
// ❌ Mauvais
const name = dbRecord.owner_id;

// ✅ Correct
const account = mapDbAccount(dbRecord);
const name = account.ownerId;
```

#### Hub Central (useBudget)

- **Unique point d'entrée** pour les données
- **Actions centralisées** : CRUD via `actions.*`
- **Mise à jour automatique** : Recharge après modification

```typescript
// Les composants n'appellent JAMAIS Supabase directement
const { accounts, actions } = useBudget();

// Créer un compte
await actions.upsertAccount(newAccount);
// → useBudget recharge automatiquement les données
```

---

## 🤖 Historique de conception

**Phase 1 : Développement initial (décembre 2024 - 6 janvier 2026)**

Conception et aide au développement réalisées via l'interface **Google AI Studio**.

**Phase 2 : Migration vers GitHub Copilot (depuis le 6 janvier 2026)**

À partir du commit **"feat(auth): Implement user authentication and login flow"**, migration de l'environnement de travail vers **VS Code**, utilisant :

- **GitHub Copilot** (assistance en ligne)
- **Claude 3.5 Sonnet** en mode Agent/Édition

Cette approche hybride combine la puissance de Copilot pour les suggestions contextuelles et de Claude pour les refactorisations complexes et l'architecture.

---

## 🤝 Contribution

### Conventions de code

- **Atomic Design** : Organisation stricte des composants
- **TypeScript strict** : Aucun `any` toléré
- **No direct DB access** : Toutes les opérations via `useBudget`
- **Mappers obligatoires** : Conversion DB ↔ App systématique

### Git Workflow

```bash
# Créer une branche feature
git checkout -b feature/nouvelle-fonction

# Commiter avec message descriptif
git commit -m "feat(operations): Ajouter filtre par bénéficiaire"

# Pusher et ouvrir une Pull Request
git push -u origin feature/nouvelle-fonction
```

### Tests

```bash
# Build de production
npm run build
npm run preview
```

---

## 📚 Documentation

### Guides principaux

- **[CHANGELOG.md](./CHANGELOG.md)** : Historique complet des versions
- **[startup/README.md](./startup/README.md)** : Guide de déploiement
- **[startup/deploy_supabase.md](./startup/deploy_supabase.md)** : Configuration Supabase
- **[startup/deploy_vercel.md](./startup/deploy_vercel.md)** : Déploiement Vercel

### Documentation technique

- **[.github/copilot-instructions.md](./.github/copilot-instructions.md)** : Guide complet pour développeurs (includes système Extra)
- **[startup/database_complete.sql](./startup/database_complete.sql)** : Schéma PostgreSQL avec commentaires

---

## 🙏 Remerciements

- **Supabase** pour le backend gratuit
- **Vercel** pour l'hébergement
- **Google AI Studio** pour l'assistance initiale au développement
- **GitHub Copilot** et **Claude 3.5 Sonnet** pour l'assistance continue

---

**Fait avec ❤️ pour une gestion budgétaire sereine**
