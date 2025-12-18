# 💰 Budget Familial

Application de gestion financière optimisée pour les couples.

## 🛡️ Sécurisation de la Base de Données (Supabase)

Pour une installation conforme aux bonnes pratiques de sécurité :

1.  **URL & Clés** : Récupérez votre `Project ID` et votre `API Key (anon public)` dans les paramètres de votre projet Supabase.
2.  **Variables d'Environnement** : L'application recherche les variables `SUPABASE_PROJECT_ID` et `SUPABASE_ANON_KEY`.
    - **En local** : Copiez le fichier `default.env.txt` vers un fichier `.env` et remplissez vos informations.
    - **En production** : Renseignez ces variables dans l'interface de votre hébergeur (Vercel, Netlify, etc.).
3.  **Script SQL** : 
    - Allez dans le **SQL Editor** de Supabase.
    - Utilisez les schémas décrits pour créer les tables `people`, `accounts`, `categories`, `expense_configs`, `income_configs`, `paid_items` et `app_settings`.
4.  **Vérification RLS** :
    - Vérifiez que la colonne **RLS** indique bien `Enabled` pour toutes les tables.
    - Configurez les politiques d'accès (Policies) pour permettre l'accès public ou authentifié selon vos besoins.

## 🛠️ Développement

L'application utilise :
- **React 19** pour l'interface.
- **Tailwind CSS** pour le design.
- **Supabase** pour la persistance des données.
- **Lucide React** pour l'iconographie.

## 📝 Changelog

Consultez `CHANGELOG.md` pour voir les dernières évolutions, notamment le support des variables d'environnement pour éviter la volatilité du localStorage.
