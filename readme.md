# 💰 Budget Familial

Une application web moderne de gestion financière pour les couples et les familles. Elle permet de gérer un budget basé sur la méthode des enveloppes virtuelles et la projection de trésorerie.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E)

## ✨ Fonctionnalités Principales

- **📊 Dashboard :** Vue d'ensemble du patrimoine, dernières opérations et enveloppes hebdomadaires.
- **📅 Planner Budgétaire :**
    - Génération automatique des échéances basées sur des règles de récurrence.
    - Vue semaine par semaine.
    - Pointage (Check) des opérations payées/reçues.
    - Simulation de trésorerie fin de semaine (alerte si virement nécessaire).
- **⚙️ Configuration Avancée :**
    - Gestion des dépenses et revenus récurrents.
    - Gestion des catégories unifiées.
    - Gestion des membres de la famille (Adultes/Enfants) et des comptes bancaires.
- **⚖️ Équité :** Graphiques de répartition des revenus pour calculer le prorata des charges.

## 🛠️ Stack Technique

- **Frontend :** React 19, TypeScript
- **Styling :** Tailwind CSS
- **Icones :** Lucide React
- **Graphiques :** Recharts
- **Backend :** Supabase (PostgreSQL)

## 🚀 Installation et Démarrage

1. **Cloner le projet** (ou télécharger les fichiers source).

2. **Installer les dépendances :**
   *(Note : Dans un environnement classique Node/Vite)*
   ```bash
   npm install
   ```

3. **Lancer l'application :**
   ```bash
   npm start
   # ou
   npm run dev
   ```

## 🗄️ Configuration de la Base de Données (Supabase)

L'application nécessite une instance Supabase.

1. Créez un projet sur [Supabase](https://supabase.com).
2. Allez dans l'éditeur SQL de Supabase.
3. Exécutez le script suivant pour créer les tables nécessaires :

```sql
-- 1. Table des revenus récurrents
CREATE TABLE IF NOT EXISTS income_configs (
  id text PRIMARY KEY,
  label text,
  amount numeric,
  owner_id text,
  day_of_month integer,
  category text
);
ALTER TABLE income_configs DISABLE ROW LEVEL SECURITY;

-- 2. Table des dépenses récurrentes
CREATE TABLE IF NOT EXISTS expense_configs (
  id text PRIMARY KEY,
  label text,
  amount numeric,
  category text,
  sub_category text,
  beneficiary_id text,
  owner_id text,
  day_of_month integer,
  start_month text,
  end_month text,
  is_extra boolean
);
ALTER TABLE expense_configs DISABLE ROW LEVEL SECURITY;

-- 3. Table des paiements effectués
CREATE TABLE IF NOT EXISTS paid_items (
  instance_id text PRIMARY KEY,
  is_paid boolean DEFAULT true,
  amount numeric,
  payment_date date,
  account_id text,
  beneficiary_id text,
  label text,
  category text,
  sub_category text
);
ALTER TABLE paid_items DISABLE ROW LEVEL SECURITY;

-- 4. Tables référentielles (si non gérées par l'app via apiUpsert)
CREATE TABLE IF NOT EXISTS people (
    id text PRIMARY KEY,
    name text,
    is_child boolean
);
ALTER TABLE people DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS accounts (
    id text PRIMARY KEY,
    name text,
    type text,
    owner_id text,
    current_balance numeric,
    bank_name text
);
ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS categories (
    id text PRIMARY KEY,
    name text,
    type text,
    sub_categories text[]
);
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
```

4. **Connexion API :**
   Ouvrez le fichier `services/supabase.ts` et remplacez les valeurs par les vôtres :
   ```typescript
   const SUPABASE_URL = 'VOTRE_URL_SUPABASE';
   const SUPABASE_KEY = 'VOTRE_CLE_ANON_PUBLIC';
   ```

## 📁 Structure du Projet

- `App.tsx` : Point d'entrée, gestion du routing (vues) et chargement global des données.
- `types.ts` : Définitions TypeScript partagées (Interfaces BDD et UI).
- `services/` :
    - `api.ts` : Fonctions CRUD vers Supabase.
    - `mockData.ts` : Données de démo et structures initiales.
- `components/` :
    - `Dashboard/` : Vues synthétiques (KPI, Enveloppes).
    - `BudgetPlanner/` : Le calendrier interactif des dépenses.
    - `Configuration/` : Formulaires d'ajout/édition (Règles, Comptes, Personnes).
    - `ui/` : Composants atomiques (Cards, etc.).

---
*Développé avec ❤️ pour une gestion financière saine.*
