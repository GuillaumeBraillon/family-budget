# 🔄 Guide de Migration - Ajout du champ `is_interest`

## 📋 Prérequis

- Accès au SQL Editor de Supabase (ou CLI Supabase)
- Base de données existante avec la table `transfers`

## 🚀 Procédure de migration

### Option 1 : Via Supabase Dashboard (Interface Web)

1. **Se connecter** au tableau de bord Supabase
   - URL : https://app.supabase.com
   - Sélectionner votre projet

2. **Ouvrir le SQL Editor**
   - Menu latéral : `Database` → `SQL Editor`
   - Cliquer sur `New query`

3. **Copier-coller le script de migration**

   ```sql
   -- =====================================================
   -- Migration: Ajout du champ is_interest à transfers
   -- Description: Permet de marquer les virements comme
   --              ajouts d'intérêts ou ajustements exceptionnels
   -- Version: 2.4.1
   -- Date: 2026-01-09
   -- =====================================================

   -- Ajouter le champ is_interest à la table transfers
   ALTER TABLE transfers
   ADD COLUMN IF NOT EXISTS is_interest boolean DEFAULT false;

   -- Commentaire pour documentation
   COMMENT ON COLUMN transfers.is_interest IS 'Indique si le virement est un ajout d''intérêts ou un ajustement exceptionnel (true) ou un virement standard (false)';

   -- Index pour requêtes filtrées sur ce champ (optionnel, selon usage)
   CREATE INDEX IF NOT EXISTS idx_transfers_is_interest ON transfers(is_interest) WHERE is_interest = true;

   -- Mettre à jour le schéma complet
   ANALYZE transfers;
   ```

4. **Exécuter la requête**
   - Cliquer sur le bouton `Run` (ou `Ctrl/Cmd + Enter`)
   - Vérifier le message de succès

5. **Vérification**

   ```sql
   -- Vérifier que la colonne existe
   SELECT column_name, data_type, column_default
   FROM information_schema.columns
   WHERE table_name = 'transfers' AND column_name = 'is_interest';

   -- Résultat attendu :
   -- column_name | data_type | column_default
   -- is_interest | boolean   | false
   ```

### Option 2 : Via Supabase CLI (Ligne de commande)

1. **Installer Supabase CLI** (si pas déjà fait)

   ```bash
   npm install -g supabase
   ```

2. **Se connecter à votre projet**

   ```bash
   supabase login
   supabase link --project-ref your-project-ref
   ```

3. **Créer une nouvelle migration**

   ```bash
   supabase migration new add_is_interest_to_transfers
   ```

4. **Éditer le fichier de migration**
   - Ouvrir `supabase/migrations/YYYYMMDDHHMMSS_add_is_interest_to_transfers.sql`
   - Copier le contenu du fichier `startup/migrations/002_add_is_interest_to_transfers.sql`

5. **Appliquer la migration**

   ```bash
   supabase db push
   ```

6. **Vérification**
   ```bash
   supabase db diff --use-migra
   ```

## ✅ Validation post-migration

### Tests SQL

```sql
-- 1. Créer un virement test avec is_interest = true
INSERT INTO transfers (
  id, date, label, amount,
  source_account_id, destination_account_id,
  is_interest
) VALUES (
  'test_interest_' || gen_random_uuid()::text,
  CURRENT_DATE,
  'Intérêts mensuels',
  50.00,
  'acc_epargne_1',
  'acc_courant_1',
  true
);

-- 2. Vérifier la création
SELECT id, label, is_interest
FROM transfers
WHERE label = 'Intérêts mensuels'
LIMIT 1;

-- 3. Vérifier l'index
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE
  tablename = 'transfers' AND
  indexname = 'idx_transfers_is_interest';

-- 4. Nettoyer les tests
DELETE FROM transfers WHERE label = 'Intérêts mensuels';
```

### Tests Application

1. **Ouvrir l'application** : https://family-budget-eta.vercel.app
2. **Aller dans** : Menu "Comptes" → "Nouveau mouvement"
3. **Créer un virement** :
   - Activer le toggle "Intérêts ou Ajustement Exceptionnel"
   - Remplir les champs (montant, date, comptes, label)
   - Valider
4. **Vérifier** :
   - Pas d'erreur console
   - Virement créé avec succès
   - Badge visible dans la liste (si implémenté)

## 🔙 Rollback (Retour arrière)

Si vous devez annuler la migration :

```sql
-- Supprimer l'index
DROP INDEX IF EXISTS idx_transfers_is_interest;

-- Supprimer la colonne
ALTER TABLE transfers DROP COLUMN IF EXISTS is_interest;

-- Mettre à jour le schéma
ANALYZE transfers;
```

**⚠️ Attention** : Le rollback supprimera définitivement les données `is_interest` de tous les virements existants.

## 📊 Impact Performance

### Avant migration

- Table `transfers` : 8 colonnes
- Index : 4 (id, source, dest, position)

### Après migration

- Table `transfers` : **9 colonnes** (+1)
- Index : **5** (+1 partiel sur `is_interest = true`)
- Impact stockage : **~1 octet par ligne**
- Impact performance : **Négligeable** (index partiel optimisé)

### Estimation de taille

```sql
-- Calculer la taille de la table transfers
SELECT
  pg_size_pretty(pg_total_relation_size('transfers')) AS table_size,
  pg_size_pretty(pg_indexes_size('transfers')) AS indexes_size;
```

## ❓ Troubleshooting

### Erreur : "relation 'transfers' does not exist"

**Cause** : La table `transfers` n'existe pas (schema non initialisé)
**Solution** : Exécuter d'abord le schema complet `startup/database_complete.sql`

### Erreur : "column 'is_interest' already exists"

**Cause** : La migration a déjà été appliquée
**Solution** : Vérifier avec `\d transfers` ou ignorer (IF NOT EXISTS protège)

### Erreur : "permission denied"

**Cause** : Droits insuffisants
**Solution** : Se connecter avec un compte admin (owner de la base)

### Erreur application : "is_interest is undefined"

**Cause** : Le mapping TypeScript n'est pas à jour
**Solution** :

1. Vérifier que `apiMappers.ts` inclut le mapping
2. Redémarrer le serveur de dev (`npm run dev`)
3. Vider le cache navigateur

## 📞 Support

Pour toute question ou problème :

- **Documentation complète** : `docs/FEATURE_INTERESTS_ADJUSTMENTS.md`
- **Issues GitHub** : https://github.com/GuillaumeBraillon/family-budget/issues
- **Discussions** : https://github.com/GuillaumeBraillon/family-budget/discussions
