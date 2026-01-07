# Guide de Déploiement - Family Budget

Documentation complète pour déployer l'application de A à Z.

## Vue d'ensemble

Cette application nécessite deux composants :

1. **Base de données PostgreSQL** : Hébergée sur Supabase (gratuit)
2. **Application React** : Hébergée sur Vercel (gratuit)

**Durée totale** : ~30 minutes  
**Coût** : Gratuit avec les plans de base

## Architecture de déploiement

```
┌─────────────────┐
│   Utilisateur   │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│  Vercel (CDN)   │  ← Application React (Frontend)
│  family-budget  │
└────────┬────────┘
         │ API/Auth
         ▼
┌─────────────────┐
│    Supabase     │  ← PostgreSQL + Auth + Storage
│  (PostgreSQL)   │
└─────────────────┘
```

## Ordre de déploiement

### 1️⃣ Base de données (Supabase)

**Fichier guide** : [deploy_supabase.md](./deploy_supabase.md)

**Étapes clés** :

- Créer un projet Supabase
- Exécuter `startup/database_complete.sql`
- Configurer l'authentification Google
- Récupérer Project ID et Anon Key

**Résultat attendu** :

- ✅ 12 tables créées
- ✅ Authentification activée
- ✅ Identifiants notés

### 2️⃣ Application (Vercel)

**Fichier guide** : [deploy_vercel.md](./deploy_vercel.md)

**Étapes clés** :

- Pusher le code sur GitHub
- Connecter Vercel au repository
- Configurer les variables d'environnement
- Déployer automatiquement

**Résultat attendu** :

- ✅ Application accessible publiquement
- ✅ Connexion Google fonctionnelle
- ✅ Données Supabase accessibles

## Prérequis techniques

### Comptes requis (gratuits)

- [x] Compte GitHub : [github.com](https://github.com/signup)
- [x] Compte Vercel : [vercel.com/signup](https://vercel.com/signup)
- [x] Compte Supabase : [supabase.com/dashboard](https://supabase.com/dashboard)
- [x] Compte Google Cloud (pour OAuth) : [console.cloud.google.com](https://console.cloud.google.com)

### Outils locaux

```bash
# Node.js (version 18+)
node --version  # v18.x.x ou supérieur

# Git
git --version  # Toute version récente

# NPM
npm --version  # v9.x.x ou supérieur
```

## Variables d'environnement

### Développement local (`.env`)

```env
VITE_SUPABASE_PROJECT_ID=abcdefghijklmnop
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Production (Vercel)

Les mêmes variables, configurées dans l'interface Vercel.

## Checklist de déploiement

### Avant de commencer

- [ ] J'ai créé un compte Supabase
- [ ] J'ai créé un compte Vercel
- [ ] Mon code est sur GitHub
- [ ] J'ai Node.js 18+ installé

### Déploiement Supabase

- [ ] Projet créé
- [ ] Script SQL exécuté sans erreur
- [ ] 12 tables visibles dans Table Editor
- [ ] Auth Google activée
- [ ] Project ID noté
- [ ] Anon Key notée
- [ ] Données initiales insérées

### Déploiement Vercel

- [ ] Repository GitHub connecté
- [ ] Variables d'environnement configurées
- [ ] Build réussi
- [ ] Application accessible
- [ ] Connexion Google fonctionnelle
- [ ] Redirect URLs configurées dans Supabase

### Tests post-déploiement

- [ ] Se connecter avec Google
- [ ] Créer un membre (People)
- [ ] Créer un compte bancaire
- [ ] Créer une catégorie
- [ ] Ajouter une opération récurrente
- [ ] Pointer une opération
- [ ] Vérifier les soldes

## Environnements

### Local Development

```bash
npm run dev
# Application : http://localhost:5173
# API : Supabase project URL
```

### Preview (Pull Requests)

```
https://family-budget-git-feature-xxx.vercel.app
```

### Production

```
https://family-budget.vercel.app
```

## Mises à jour

### Déploiement automatique

Chaque push sur `main` déclenche un redéploiement :

```bash
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push
# ⏳ Vercel déploie automatiquement
```

### Mise à jour du schéma SQL

Si vous modifiez la structure de la base :

1. **Créer un script de migration** (ex: `005_add_new_table.sql`)
2. **Tester localement** sur votre projet Supabase de dev
3. **Exécuter en production** via SQL Editor Supabase
4. **Mettre à jour `database_complete.sql`** pour les nouvelles installations

## Sécurité

### Variables d'environnement

- ⚠️ **NE JAMAIS** commit le fichier `.env`
- ✅ Utiliser les variables d'environnement Vercel
- ✅ Régénérer les clés si exposées

### Row Level Security

- ✅ RLS activé par défaut sur toutes les tables
- ✅ Seuls les utilisateurs authentifiés ont accès
- ⚠️ Adaptez les politiques selon vos besoins

### Whitelist des utilisateurs

L'application inclut un système de whitelist :

- Les nouveaux utilisateurs apparaissent en "attente"
- Un admin doit les autoriser manuellement
- Géré dans "Réglages" > "Utilisateurs"

## Support et debugging

### Logs Vercel

```bash
# Via CLI Vercel
vercel logs
```

### Logs Supabase

- Allez dans "Logs" > "API Logs"
- Filtrez par status code, table, etc.

### Database Backup

```bash
# Via Supabase CLI (si installé)
supabase db dump -f backup.sql
```

## Coûts et limites

### Plan Gratuit Supabase

- **Database** : 500 MB
- **API Requests** : Illimité
- **Auth Users** : 50 000
- **Storage** : 1 GB

### Plan Gratuit Vercel

- **Bandwidth** : 100 GB/mois
- **Builds** : 100 heures/mois
- **Deployments** : Illimité

**Pour la plupart des usages personnels, les plans gratuits suffisent.**

## Alternatives

### Base de données

- **Neon** : PostgreSQL serverless gratuit
- **Railway** : PostgreSQL + Redis
- **PlanetScale** : MySQL serverless

### Hosting Frontend

- **Netlify** : Alternative à Vercel
- **Cloudflare Pages** : Edge network global
- **GitHub Pages** : Gratuit mais statique uniquement

## Ressources

- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [React + Vite Guide](https://vitejs.dev/guide/)
- [GitHub OAuth Setup](https://docs.github.com/en/developers/apps/building-oauth-apps)

---

**Prochaines étapes** :

1. [Configurer Supabase →](./deploy_supabase.md)
2. [Déployer sur Vercel →](./deploy_vercel.md)
