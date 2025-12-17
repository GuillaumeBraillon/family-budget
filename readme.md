
# 💰 Budget Familial

Une application web moderne de gestion financière pour les couples et les familles. Elle permet de gérer un budget basé sur la méthode des enveloppes virtuelles et la projection de trésorerie.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E)

## ✨ Fonctionnalités Principales

- **📊 Dashboard :** Vue d'ensemble du patrimoine, dernières opérations et enveloppes hebdomadaires avec calcul d'équité.
- **📅 Planner Budgétaire (Dual Mode) :**
    - **Suivi Mensuel :** Pointage (Check) des opérations réalisées et visualisation du "Reste à payer".
    - **Modèles Récurrents :** Gestion des règles de génération automatique (loyers, abonnements, salaires).
- **⚙️ Configuration Unifiée :**
    - Gestion des membres de la famille (Adultes/Enfants).
    - Gestion des comptes bancaires et des catégories/sous-catégories.
    - Paramétrage de l'enveloppe hebdomadaire de dépense variable.
- **💡 Onboarding Contextuel :** Présence de cadres d'information pédagogiques pour guider l'utilisateur dans sa gestion budgétaire.

## 🛠️ Stack Technique

- **Frontend :** React 19, TypeScript
- **Styling :** Tailwind CSS
- **Icones :** Lucide React
- **Graphiques :** Recharts
- **Backend :** Supabase (PostgreSQL)

## 📁 Structure du Projet

- `App.tsx` : Point d'entrée, routing et chargement des données.
- `components/BudgetPlanner/` : Cœur de l'application (Suivi mensuel + Éditeur de modèles).
- `components/Configuration/` : Réglages structurels (Comptes, Membres, Catégories).
- `components/ui/` : Bibliothèque de composants réutilisables (Cards, InfoBoxes, Modales).
- `hooks/` : Logique métier (usePlanner, useBudget, useCategoryManager).

---
*Développé avec ❤️ pour une gestion financière saine.*
