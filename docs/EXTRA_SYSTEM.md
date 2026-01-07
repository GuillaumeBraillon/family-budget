# Système "Extra" (Hors Budget) à Deux Niveaux

## Vue d'ensemble

Le système "Extra" permet de marquer des opérations comme étant hors budget, c'est-à-dire ne devant pas être comptabilisées dans le suivi budgétaire courant. Il fonctionne à **deux niveaux complémentaires** :

### 1. Niveau Opération (Global)

**Emplacement** : Toggle dans le formulaire de saisie d'opération variable
**Usage** : Marquer toute l'opération comme exceptionnelle
**Exemple** : Une sortie au restaurant pour un événement spécial → 150€ entièrement hors budget

### 2. Niveau Tag (Granulaire)

**Emplacement** : Bouton étoile ⭐ à côté de chaque tag dans la ventilation
**Usage** : Marquer individuellement certains montants de tags comme hors budget
**Exemple** : Courses de 200€ → 150€ budget normal + 50€ Extra (achat spécial)

## Cas d'usage

### Scénario 1 : Opération entièrement exceptionnelle

```
Cadeau d'anniversaire : 120€
☑ Toggle "Extra" global activé
→ Toute l'opération est hors budget
```

### Scénario 2 : Opération avec montant partiellement exceptionnel

```
Courses alimentaires : 200€
☐ Toggle "Extra" global désactivé
Ventilation :
  - Tag "Alimentaire" : 150€ (dans le budget)
  - Tag "Cadeaux" : 50€ ⭐ (hors budget)
→ 150€ comptés dans le budget, 50€ hors budget
```

### Scénario 3 : Mix des deux niveaux

```
Sortie loisirs : 300€
☑ Toggle "Extra" global activé (opération exceptionnelle)
Ventilation :
  - Tag "Restaurant" : 150€
  - Tag "Cinéma" : 100€
  - Tag "Transport" : 50€
→ Toute l'opération est hors budget (priorité au niveau global)
```

## Logique d'interaction

### Priorité et comportement

- **Toggle Global activé** : Toute l'opération est Extra, peu importe les tags individuels
- **Toggle Global désactivé** : Seuls les tags marqués ⭐ sont Extra
- **Aucun marquage** : Opération entièrement dans le budget

### Dans les calculs budgétaires

```typescript
// Pseudo-code logique
if (operation.isExtra) {
  // Toute l'opération est hors budget
  extraAmount += operation.amount;
} else if (operation.tagAmounts) {
  // Calcul granulaire par tag
  operation.tagAmounts.forEach((tag) => {
    if (tag.isExtra) {
      extraAmount += tag.amount;
    } else {
      budgetAmount += tag.amount;
    }
  });
} else {
  // Pas de tags, tout est dans le budget
  budgetAmount += operation.amount;
}
```

## Implémentation technique

### Structure des données

**Opération** (`VariableTransaction` / `PaidItemDetails`)

```typescript
{
  isExtra: boolean, // Toggle global
  tagAmounts?: TagAmount[] // Ventilation optionnelle
}
```

**Tag Amount** (`TagAmount`)

```typescript
{
  tagId: string,
  amount: number,
  isExtra?: boolean // Toggle individuel par tag
}
```

### Base de données

**Table `paid_items`**

```sql
is_extra boolean DEFAULT false -- Niveau opération
```

**Table `paid_item_tags`**

```sql
is_extra boolean DEFAULT false -- Niveau tag individuel
```

## Interface utilisateur

### Formulaire de saisie

1. **TagAmountSelector** : Bouton ⭐ pour chaque tag (couleur amber quand actif)
2. **Toggle Global** : Case à cocher "Dépense temporaire / Exceptionnelle"

### Affichage dans les listes

- **Opération Extra globale** : Badge "Extra" sur la ligne entière
- **Tags Extra individuels** : Étoile ⭐ à côté du montant du tag

## Migration requise

Exécuter dans Supabase :

```sql
-- Migration 004: Ajouter la colonne is_extra aux tags
ALTER TABLE paid_item_tags
ADD COLUMN IF NOT EXISTS is_extra boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_paid_item_tags_is_extra
ON paid_item_tags(is_extra);
```

## Bénéfices du système à deux niveaux

✅ **Flexibilité** : S'adapte à tous les cas d'usage  
✅ **Granularité** : Précision au centime près pour la ventilation  
✅ **Simplicité** : Toggle global pour les cas simples  
✅ **Compatibilité** : Fonctionne avec ou sans tags
