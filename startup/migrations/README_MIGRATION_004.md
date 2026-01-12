# Migration 004 : Sous-catégories relationnelles avec auto-suggestion

## 🎯 Objectif

Transformer le système de sous-catégories d'une simple liste de texte (array PostgreSQL) vers une structure relationnelle robuste permettant l'auto-suggestion intelligente des catégories lors de la saisie d'opérations.

## 📊 Architecture

### Avant (Array-based)

```sql
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  sub_categories TEXT[] -- Simple tableau
);
```

### Après (Relational)

```sql
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL
  -- sub_categories supprimé
);

CREATE TABLE sub_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_sub_category_per_category UNIQUE(category_id, name)
);

CREATE TABLE saved_labels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  is_expense BOOLEAN DEFAULT true,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL, -- NOUVEAU
  sub_category_id TEXT REFERENCES sub_categories(id) ON DELETE SET NULL -- NOUVEAU
);
```

## 🚀 Exécution de la migration

### Étape 1 : Sauvegarde

```bash
# Backup complet de la base de données
pg_dump -h <HOST> -U <USER> -d <DATABASE> > backup_avant_migration_004.sql
```

### Étape 2 : Exécution du script

```bash
# Connexion Supabase SQL Editor
# 1. Aller dans Dashboard > SQL Editor
# 2. Copier-coller le contenu de 004_refactor_categories_to_relational.sql
# 3. Cliquer sur "Run"

# OU en ligne de commande :
psql -h <HOST> -U <USER> -d <DATABASE> -f startup/migrations/004_refactor_categories_to_relational.sql
```

### Étape 3 : Vérification

Le script affiche automatiquement des messages de confirmation :

```
NOTICE:  ✅ Migration réussie !
NOTICE:  - Catégories migrées : X
NOTICE:  - Sous-catégories créées : Y
NOTICE:  - RLS activé sur sub_categories
NOTICE:  - Fonctions helper créées
```

### Étape 4 : Test des données

```sql
-- Vérifier les sous-catégories d'une catégorie
SELECT * FROM get_sub_categories('cat_id_example');

-- Tester l'auto-suggestion
SELECT * FROM suggest_category_from_label('Netflix');
```

## 📝 Modifications du code

### Fichiers TypeScript mis à jour

✅ **services/dbTypes.ts**

- Ajout de `DbSubCategory` interface
- Suppression de `sub_categories: string[]` dans `DbCategory`
- Ajout de `category_id`, `sub_category_id` dans `DbSavedLabel`

✅ **types.ts**

- Ajout de `SubCategory` interface
- Modification de `CategoryDef.subCategories: string[]` → `SubCategory[]`
- Ajout de `categoryId`, `subCategoryId` dans `SavedLabel`

✅ **services/apiMappers.ts**

- Ajout de `mapDbSubCategory` mapper
- Modification de `mapDbCategory` pour accepter tableau de sous-catégories
- Mise à jour de `mapDbSavedLabel` avec nouveaux champs

✅ **services/api.ts**

- Ajout de la requête `sub_categories` dans `fetchInitialData()`
- Passage du tableau subCategories au mapper

✅ **services/apiCrud.ts**

- Refonte complète de `apiUpsertCategory` pour gérer la table relationnelle
- Mise à jour de `apiUpsertLabel` pour sauvegarder category_id et sub_category_id

## 🎨 Fonctionnalités activées

### 1. Auto-suggestion intelligente

**Fonction SQL disponible :**

```sql
SELECT * FROM suggest_category_from_label('Nom du libellé');
```

**Retourne :**

```json
{
  "category_id": "cat_xxx",
  "category_name": "Loisirs",
  "sub_category_id": "sub_xxx",
  "sub_category_name": "Streaming"
}
```

**Intégration UI à faire :**

```typescript
// Dans le formulaire de transaction
const handleLabelSelect = async (labelName: string) => {
  const suggestion = await supabase.rpc("suggest_category_from_label", { p_label_name: labelName }).single();

  if (suggestion.data) {
    setCategory(suggestion.data.category_id);
    setSubCategory(suggestion.data.sub_category_id);
    // Afficher indicateur visuel "Auto-suggéré"
  }
};
```

### 2. Gestion des sous-catégories par catégorie

**Fonction SQL disponible :**

```sql
SELECT * FROM get_sub_categories('category_id');
```

**Usage dans les dropdowns :**

```typescript
const fetchSubCategories = async (categoryId: string) => {
  const { data } = await supabase.rpc("get_sub_categories", { p_category_id: categoryId });

  return data; // [{id, name, category_id, created_at}]
};
```

### 3. Association label → catégorie

**Dans le formulaire de gestion des libellés :**

```typescript
interface SavedLabelForm {
  name: string;
  type: AccountType;
  isExpense: boolean;
  categoryId?: string; // NOUVEAU - Pour auto-suggestion
  subCategoryId?: string; // NOUVEAU
}
```

## ⚙️ Composants à mettre à jour

### 1. CategoryManager (URGENT)

**Fichiers concernés :**

- `components/features/Configuration/components/organisms/CategoryManager.tsx`
- `hooks/useCategoryManager.ts`

**Changements requis :**

- Remplacer `string[]` par `SubCategory[]` dans les states
- Utiliser `id + name` au lieu de juste `name` dans les listes
- Gérer la création/suppression de sous-catégories via table relationnelle

### 2. CategorySelector (URGENT)

**Fichiers concernés :**

- `components/ui/molecules/CategorySelector.tsx`

**Changements requis :**

- Dropdown sous-catégories doit afficher `SubCategory.name` avec `SubCategory.id` comme valeur
- Filtrer les sous-catégories par `categoryId` sélectionné

### 3. Transaction Forms (HAUTE PRIORITÉ)

**Fichiers concernés :**

- `components/features/Operations/components/VariableTransactionForm.tsx`
- Tous les formulaires avec sélection de catégorie

**Changements requis :**

- Implémenter l'auto-suggestion via `suggest_category_from_label()`
- Afficher indicateur visuel "Auto-suggéré depuis usage précédent"
- Permettre override manuel si suggestion incorrecte

### 4. Saved Labels Management (MOYENNE PRIORITÉ)

**Fichiers concernés :**

- Composants de gestion des libellés sauvegardés

**Changements requis :**

- Ajouter dropdowns catégorie/sous-catégorie (optionnels)
- Label : "Catégorie suggérée par défaut"
- Sauvegarder `categoryId` et `subCategoryId` via `apiUpsertLabel`

## 🔄 Rollback

En cas de problème, le script complet de rollback est disponible dans le fichier de migration sous la section "ROLLBACK SCRIPT".

```sql
-- Récupérer le backup temp (si session active)
CREATE TABLE categories_backup AS SELECT * FROM temp_sub_categories;

-- Restaurer la colonne array
ALTER TABLE categories ADD COLUMN sub_categories TEXT[];

-- Reconstituer les arrays
UPDATE categories c SET sub_categories = ARRAY(
  SELECT name FROM sub_categories WHERE category_id = c.id
);

-- Supprimer les tables relationnelles
DROP TABLE IF EXISTS sub_categories CASCADE;
ALTER TABLE saved_labels DROP COLUMN category_id;
ALTER TABLE saved_labels DROP COLUMN sub_category_id;
```

## 📈 Métriques de succès

- ✅ Toutes les sous-catégories existantes préservées
- ✅ Relations catégorie-sous-catégorie intactes
- ✅ Fonctions SQL de suggestion opérationnelles
- ✅ Zéro perte de données
- ✅ Application compile sans erreurs TypeScript

## 📚 Prochaines étapes

1. **Exécuter la migration** sur la base de développement
2. **Tester les fonctions** `get_sub_categories` et `suggest_category_from_label`
3. **Mettre à jour CategoryManager** pour gérer SubCategory[]
4. **Implémenter l'auto-suggestion** dans les formulaires de transaction
5. **Ajouter UI** pour associer libellés → catégories
6. **Tester end-to-end** le workflow complet
7. **Documenter** dans CHANGELOG.md
8. **Release v2.6.4**

## 🐛 Debugging

### Vérifier la migration

```sql
-- Compter les sous-catégories
SELECT COUNT(*) FROM sub_categories;

-- Afficher la structure
\d sub_categories

-- Vérifier les RLS policies
SELECT * FROM pg_policies WHERE tablename = 'sub_categories';

-- Tester les fonctions
SELECT * FROM get_sub_categories('cat_test');
SELECT * FROM suggest_category_from_label('Netflix');
```

### Logs d'erreur

Si la migration échoue, vérifier :

1. Permissions Supabase (besoin d'être owner ou admin)
2. Existence de données nulles dans sub_categories array
3. Contraintes d'unicité violées

## ✅ Checklist de migration

- [ ] Backup de la base de données effectué
- [ ] Script de migration exécuté sans erreur
- [ ] Messages NOTICE de confirmation affichés
- [ ] Fonctions SQL testées et fonctionnelles
- [ ] Code TypeScript compile sans erreur
- [ ] Tests manuels de l'UI passés
- [ ] Documentation CHANGELOG mise à jour
- [ ] Version package.json incrémentée (2.6.4)
- [ ] Commit et tag git créés
- [ ] Push vers GitHub effectué

---

**Auteur :** Migration automatique v2.6.4  
**Date :** 10 janvier 2025  
**Impact :** ⚠️ BREAKING CHANGE - Nécessite mise à jour de tous les composants utilisant les catégories
