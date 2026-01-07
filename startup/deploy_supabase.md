# Déploiement Supabase

Guide complet pour configurer et déployer la base de données PostgreSQL avec Supabase.

## Prérequis

- Un compte Supabase (gratuit) : [supabase.com](https://supabase.com)
- 15 minutes de configuration

## Étape 1 : Créer un nouveau projet

1. **Connexion**

   - Rendez-vous sur [app.supabase.com](https://app.supabase.com)
   - Connectez-vous avec GitHub ou Email

2. **Nouveau projet**
   - Cliquez sur "New Project"
   - Remplissez les informations :
     ```
     Name: family-budget
     Database Password: [générez un mot de passe fort]
     Region: [choisissez le plus proche de vous]
     ```
   - Cliquez sur "Create new project"
   - ⏳ Attendre 2-3 minutes (initialisation de la base)

## Étape 2 : Exécuter le script SQL

1. **Ouvrir SQL Editor**

   - Dans le menu latéral, cliquez sur "SQL Editor"
   - Cliquez sur "New query"

2. **Copier le schéma complet**

   - Ouvrez le fichier `startup/database_complete.sql`
   - Copiez **TOUT** le contenu (Ctrl+A, Ctrl+C)

3. **Exécuter**

   - Collez le contenu dans l'éditeur SQL
   - Cliquez sur "Run" (ou Ctrl+Enter)
   - ✅ Vérifiez qu'aucune erreur n'apparaît

4. **Vérification**
   - Allez dans "Table Editor"
   - Vous devriez voir 12 tables :
     - `accounts`
     - `app_settings`
     - `authorized_users`
     - `categories`
     - `expense_configs`
     - `income_configs`
     - `paid_items`
     - `paid_item_tags`
     - `people`
     - `saved_labels`
     - `tags`
     - `transfers`

## Étape 3 : Configurer l'authentification

1. **Activer Google Auth**

   - Allez dans "Authentication" > "Providers"
   - Cherchez "Google"
   - Activez le toggle

2. **Configurer les Redirect URLs** (si déploiement Vercel)

   ```
   https://votre-app.vercel.app/auth/callback
   ```

   - Remplacez `votre-app` par votre nom de domaine

3. **Récupérer les identifiants Google** (optionnel)
   - Allez sur [Google Cloud Console](https://console.cloud.google.com)
   - Créez un projet OAuth
   - Ajoutez les Client ID et Client Secret dans Supabase

## Étape 4 : Récupérer les identifiants du projet

1. **Project ID**

   - Allez dans "Settings" > "General"
   - Notez le "Reference ID" (ex: `abcdefghijklmnop`)

2. **Anon Key**
   - Allez dans "Settings" > "API"
   - Copiez la clé "anon" / "public"
   - ⚠️ **NE PARTAGEZ JAMAIS** cette clé publiquement

## Étape 5 : Insérer les données initiales

1. **Créer un enregistrement de paramètres**

   ```sql
   INSERT INTO app_settings (id, monthly_envelope, period_type, period_value)
   VALUES ('global', 2000, 'FIXED_DAYS', 7);
   ```

2. **Créer des catégories par défaut** (optionnel)

   ```sql
   -- Catégories de dépenses
   INSERT INTO categories (id, name, type, sub_categories) VALUES
   ('cat_habitation', 'Habitation', 'EXPENSE', ARRAY['Loyer', 'Électricité', 'Eau', 'Internet']),
   ('cat_transport', 'Transport', 'EXPENSE', ARRAY['Essence', 'Assurance', 'Entretien']),
   ('cat_alimentation', 'Alimentation', 'EXPENSE', ARRAY['Courses', 'Restaurant']),
   ('cat_loisirs', 'Loisirs', 'EXPENSE', ARRAY['Sport', 'Cinéma', 'Vacances']);

   -- Catégories de revenus
   INSERT INTO categories (id, name, type, sub_categories) VALUES
   ('cat_salaire', 'Salaire', 'INCOME', ARRAY['Salaire net', 'Prime', 'Bonus']),
   ('cat_aides', 'Aides', 'INCOME', ARRAY['CAF', 'Allocations']);
   ```

## Étape 6 : Configurer Row Level Security (RLS)

Les politiques RLS sont déjà configurées dans le script SQL.

**Vérification** :

- Allez dans "Table Editor"
- Sélectionnez une table
- Cliquez sur l'icône bouclier (🛡️)
- Vous devriez voir la politique "Enable all for authenticated users"

**Sécurité** :

- Par défaut, tous les utilisateurs authentifiés ont accès complet
- Pour restreindre, modifiez les politiques selon vos besoins
- Exemple : limiter l'accès par email ou par colonne `owner_id`

## Étape 7 : Whitelist des utilisateurs (optionnel)

Si vous souhaitez contrôler manuellement les accès :

1. **Ajouter votre email**

   ```sql
   INSERT INTO authorized_users (email, is_allowed)
   VALUES ('votre.email@example.com', true);
   ```

2. **Gérer via l'interface**
   - Une fois l'app déployée, allez dans "Réglages" > "Utilisateurs"
   - Vous pourrez autoriser/refuser les demandes d'accès

## Dépannage

### ❌ Erreur "relation does not exist"

**Cause** : Le script SQL n'a pas été exécuté complètement  
**Solution** : Réexécutez le script `database_complete.sql`

### ❌ Erreur "policy violation"

**Cause** : Les politiques RLS bloquent l'accès  
**Solution** : Vérifiez que vous êtes connecté via Supabase Auth

### ❌ Tables vides après déploiement

**Cause** : Données initiales non insérées  
**Solution** : Exécutez les INSERT de l'Étape 5

### 🔍 Logs et monitoring

- Allez dans "Logs" > "Query Performance"
- Activez "Query Insights" pour suivre les performances

## Maintenance

### Backup automatique

- Plan gratuit : 7 jours de rétention
- Plan Pro : 30 jours
- Allez dans "Database" > "Backups" pour restaurer

### Mises à jour du schéma

- Créez des scripts de migration numérotés
- Testez en environnement de dev avant production
- Utilisez `IF NOT EXISTS` pour éviter les erreurs

## Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Don%27t_Do_This)

---

**Prochaine étape** : [Déploiement Vercel →](./deploy_vercel.md)
