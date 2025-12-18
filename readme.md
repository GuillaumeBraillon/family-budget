
# 💰 Budget Familial

Une application web moderne de gestion financière pour les couples et les familles. Elle permet de gérer un budget basé sur la méthode des enveloppes virtuelles et la projection de trésorerie.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E)

## 🚀 Configuration de la Base de Données (Supabase)

Pour faire fonctionner l'application, vous devez créer les tables suivantes dans votre projet Supabase (onglet **SQL Editor**). 

Copiez-collez l'intégralité du script ci-dessous :

```sql
-- 1. Table des membres de la famille
CREATE TABLE IF NOT EXISTS public.people (
  id text NOT NULL PRIMARY KEY,
  name text NOT NULL,
  is_child boolean DEFAULT false
);

-- 2. Table des comptes bancaires
CREATE TABLE IF NOT EXISTS public.accounts (
  id text NOT NULL PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL,
  owner_id text NOT NULL,
  current_balance numeric DEFAULT 0,
  bank_name text
);

-- 3. Table des catégories
CREATE TABLE IF NOT EXISTS public.categories (
  id text NOT NULL PRIMARY KEY,
  name text NOT NULL,
  type text DEFAULT 'EXPENSE',
  sub_categories text[] DEFAULT '{}'
);

-- 4. Paramètres de l'application
CREATE TABLE IF NOT EXISTS public.app_settings (
  id text NOT NULL PRIMARY KEY,
  weekly_envelope numeric DEFAULT 500,
  period_type text DEFAULT 'FIXED_DAYS',
  period_value integer DEFAULT 7
);

-- 5. Revenus récurrents (Modèles)
CREATE TABLE IF NOT EXISTS public.income_configs (
  id text NOT NULL PRIMARY KEY,
  label text NOT NULL,
  amount numeric NOT NULL,
  account_id text REFERENCES public.accounts(id) ON DELETE SET NULL,
  beneficiary_id text,
  day_of_month integer NOT NULL,
  category text,
  sub_category text
);

-- 6. Dépenses récurrentes (Modèles)
CREATE TABLE IF NOT EXISTS public.expense_configs (
  id text NOT NULL PRIMARY KEY,
  label text NOT NULL,
  amount numeric NOT NULL,
  category text,
  sub_category text,
  beneficiary_id text,
  account_id text REFERENCES public.accounts(id) ON DELETE SET NULL,
  day_of_month integer NOT NULL,
  start_month text,
  end_month text,
  is_extra boolean DEFAULT false
);

-- 7. Éléments pointés (Transactions validées)
CREATE TABLE IF NOT EXISTS public.paid_items (
  instance_id text NOT NULL PRIMARY KEY,
  is_paid boolean DEFAULT true,
  amount numeric NOT NULL,
  payment_date date NOT NULL,
  account_id text,
  beneficiary_id text,
  label text,
  category text,
  sub_category text
);

-- Initialisation des paramètres par défaut
INSERT INTO public.app_settings (id, weekly_envelope, period_type, period_value) 
VALUES ('global', 500, 'FIXED_DAYS', 7) 
ON CONFLICT (id) DO NOTHING;
```

## ✨ Fonctionnalités Principales

- **📊 Dashboard :** Vue d'ensemble du patrimoine, dernières opérations et enveloppes hebdomadaires avec calcul d'équité.
- **📅 Planner Budgétaire (Dual Mode) :**
    - **Suivi Mensuel :** Pointage (Check) des opérations réalisées et visualisation du "Reste à payer".
    - **Modèles Récurrents :** Gestion des règles de génération automatique (loyers, abonnements, salaires).
- **⚙️ Configuration Unifiée :**
    - Gestion des membres de la famille (Adultes/Enfants).
    - Gestion des comptes bancaires et des catégories/sous-catégories.
    - Paramétrage de l'enveloppe hebdomadaire de dépense variable.

## 🛠️ Stack Technique

- **Frontend :** React 19, TypeScript
- **Styling :** Tailwind CSS
- **Icones :** Lucide React
- **Graphiques :** Recharts
- **Backend :** Supabase (PostgreSQL)

---
*Développé avec ❤️ pour une gestion financière saine.*
