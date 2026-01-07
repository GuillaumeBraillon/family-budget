# Déploiement Vercel

Guide complet pour déployer l'application React sur Vercel avec connexion à Supabase.

## Prérequis

- Un compte Vercel (gratuit) : [vercel.com](https://vercel.com)
- Un repository GitHub avec le projet
- Les identifiants Supabase (voir [deploy_supabase.md](./deploy_supabase.md))

## Étape 1 : Préparer le repository GitHub

1. **Créer un repository**

   ```bash
   # Si pas encore fait
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/votre-username/family-budget.git
   git push -u origin main
   ```

2. **Vérifier les fichiers ignorés**
   - Le `.env` ne doit PAS être commit (déjà dans `.gitignore`)
   - Les `node_modules/` doivent être ignorés
   - Le dossier `dist/` de build doit être ignoré

## Étape 2 : Créer le projet Vercel

1. **Connexion**

   - Allez sur [vercel.com/new](https://vercel.com/new)
   - Connectez-vous avec GitHub

2. **Import du projet**

   - Cliquez sur "Import Project"
   - Sélectionnez votre repository `family-budget`
   - Cliquez sur "Import"

3. **Configuration Build**
   Vercel détecte automatiquement Vite. Vérifiez les paramètres :
   ```
   Framework Preset: Vite
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

## Étape 3 : Configurer les variables d'environnement

1. **Dans l'interface Vercel**

   - Avant de déployer, cliquez sur "Environment Variables"
   - Ajoutez les 2 variables suivantes :

   ```env
   VITE_SUPABASE_PROJECT_ID=abcdefghijklmnop
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   > ⚠️ **Important** : Les variables Vite doivent commencer par `VITE_`

2. **Environnements**
   - Production : ✅
   - Preview : ✅
   - Development : ✅ (optionnel)

## Étape 4 : Déployer

1. **Premier déploiement**

   - Cliquez sur "Deploy"
   - ⏳ Attendre 2-3 minutes

2. **Vérification**
   - Une fois terminé, cliquez sur "Visit"
   - L'application devrait s'ouvrir
   - Testez la connexion Google

## Étape 5 : Configurer le domaine (optionnel)

1. **Domaine Vercel gratuit**

   - URL par défaut : `family-budget-xxx.vercel.app`
   - Personnalisez dans "Settings" > "Domains"

2. **Domaine personnalisé**
   - Allez dans "Settings" > "Domains"
   - Cliquez sur "Add"
   - Entrez votre domaine (ex: `budget.monsite.com`)
   - Suivez les instructions DNS

## Étape 6 : Configurer les Redirect URLs Supabase

1. **Retour sur Supabase**

   - Allez dans "Authentication" > "URL Configuration"
   - Ajoutez votre URL Vercel dans "Site URL" :
     ```
     https://family-budget-xxx.vercel.app
     ```

2. **Redirect URLs**
   - Ajoutez dans "Redirect URLs" :
     ```
     https://family-budget-xxx.vercel.app/**
     https://family-budget-xxx.vercel.app/auth/callback
     ```

## Déploiement automatique

Vercel déploie automatiquement à chaque push sur `main` :

```bash
# Faire des modifications
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push

# Vercel détecte le push et redéploie automatiquement
```

## Preview Deployments

Chaque Pull Request crée un déploiement de preview :

1. **Créer une branche**

   ```bash
   git checkout -b feature/nouvelle-fonction
   git push -u origin feature/nouvelle-fonction
   ```

2. **Ouvrir une PR sur GitHub**

   - Vercel crée automatiquement un déploiement de test
   - URL unique : `family-budget-git-feature-xxx.vercel.app`

3. **Tester avant de merger**
   - Vérifiez le déploiement de preview
   - Mergez si OK → déploiement en production

## Optimisations Performance

### 1. Activer la compression

Dans `vercel.json` (créer à la racine) :

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### 2. Configurer les redirections

```json
{
  "redirects": [
    {
      "source": "/old-path",
      "destination": "/new-path",
      "permanent": true
    }
  ]
}
```

### 3. Activer Analytics

- Allez dans "Analytics" (onglet du projet)
- Activez "Web Analytics"
- Suivez les performances et le trafic

## Monitoring et Logs

### Voir les logs

1. **Logs de build**

   - Allez dans "Deployments"
   - Cliquez sur un déploiement
   - Onglet "Build Logs"

2. **Logs runtime**
   - Onglet "Functions" (si vous utilisez des serverless functions)
   - Logs en temps réel

### Alertes

- Allez dans "Settings" > "Notifications"
- Configurez les alertes par email/Slack
- Activez "Deployment Failed" et "Error Rate"

## Dépannage

### ❌ Build Failed: "Cannot find module"

**Cause** : Dépendance manquante dans `package.json`  
**Solution** :

```bash
npm install
git add package.json package-lock.json
git commit -m "fix: update dependencies"
git push
```

### ❌ "VITE_SUPABASE_PROJECT_ID is not defined"

**Cause** : Variables d'environnement non configurées  
**Solution** : Vérifiez dans "Settings" > "Environment Variables"

### ❌ 404 Not Found sur les routes

**Cause** : React Router nécessite une config SPA  
**Solution** : Créer `vercel.json` :

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### ❌ Erreur CORS depuis Supabase

**Cause** : URL non autorisée dans Supabase  
**Solution** : Ajoutez l'URL Vercel dans les Redirect URLs de Supabase

## Rollback en cas de problème

Si un déploiement cause des problèmes :

1. **Rollback instantané**

   - Allez dans "Deployments"
   - Trouvez le dernier déploiement fonctionnel
   - Cliquez sur "⋯" > "Promote to Production"

2. **Revert Git**
   ```bash
   git revert HEAD
   git push
   ```

## Limites du plan gratuit

- **Bandwidth** : 100 GB/mois
- **Builds** : 100 heures/mois
- **Serverless Functions** : 100 GB-Hrs
- **Concurrent Builds** : 1

Pour plus, passer au plan Pro (~$20/mois).

## Ressources

- [Documentation Vercel](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html#vercel)
- [Environment Variables Best Practices](https://vercel.com/docs/concepts/projects/environment-variables)

---

**Déploiement terminé** ✅  
Votre application est maintenant accessible publiquement !
