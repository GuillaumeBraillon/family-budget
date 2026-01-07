# Ventilation des montants par tag - Guide d'implémentation

## Vue d'ensemble

Cette fonctionnalité permet de ventiler le montant total d'une opération sur plusieurs tags avec des montants spécifiques. Par exemple, pour un achat de 100€ au supermarché, vous pouvez affecter :

- 60€ au tag "Courses"
- 25€ au tag "Entretien maison"
- 15€ au tag "Loisirs"

## Architecture

### 1. Base de données

**Nouvelle table `paid_item_tags`** :

```sql
- id (UUID, PK)
- paid_item_instance_id (TEXT, FK → paid_items.instance_id)
- tag_id (TEXT, FK → tags.id)
- amount (DECIMAL)
- created_at (TIMESTAMPTZ)
```

**Migration** : `/migrations/003_add_tag_amounts.sql`

- Crée la table avec foreign keys et contraintes
- Migre les données existantes (montants à 0)
- Active RLS pour la sécurité

### 2. Types TypeScript

**Nouveau type `TagAmount`** :

```typescript
interface TagAmount {
  tagId: string;
  amount: number;
}
```

**Interfaces mises à jour** :

- `ExpenseConfig.tagAmounts?: TagAmount[]`
- `IncomeConfig.tagAmounts?: TagAmount[]`
- `PaidItemDetails.tagAmounts?: TagAmount[]`
- `VariableTransaction.tagAmounts?: TagAmount[]`

**Rétrocompatibilité** : Le champ `tagIds` est conservé et marqué deprecated.

### 3. Nouveau composant UI

**`TagAmountSelector.tsx`** :

- Interface de ventilation des montants
- Validation : somme des montants = montant total
- Fonctionnalité "Répartir équitablement"
- Gestion visuelle des erreurs

## Étapes d'intégration

### Étape 1 : Exécuter la migration SQL

```bash
# Connectez-vous à votre base Supabase et exécutez :
psql <votre_connexion_string> -f migrations/003_add_tag_amounts.sql
```

Ou via l'interface Supabase :

1. Aller dans SQL Editor
2. Copier le contenu de `003_add_tag_amounts.sql`
3. Exécuter

### Étape 2 : Mettre à jour les types DB

Fichier `services/dbTypes.ts` - Ajouter :

```typescript
export interface DbPaidItemTag {
  id: string;
  paid_item_instance_id: string;
  tag_id: string;
  amount: number;
  created_at: string;
}
```

### Étape 3 : Créer les mappers

Fichier `services/apiMappers.ts` - Ajouter :

```typescript
export const mapDbTagAmount = (t: DbPaidItemTag): TagAmount => ({
  tagId: t.tag_id,
  amount: Number(t.amount),
});
```

### Étape 4 : Mettre à jour fetchInitialData

Fichier `services/api.ts` - Modifier `fetchInitialData` :

```typescript
// Ajouter dans Promise.all
const paidItemTagsRes = await supabase.from("paid_item_tags").select("*");

// Dans la boucle de traitement des paid_items
(paidItemsRes.data || []).forEach((item: DbPaidItem) => {
  const mapped = mappers.mapDbPaidItem(item);

  // Récupérer les tagAmounts depuis paid_item_tags
  const itemTagAmounts = (paidItemTagsRes.data || []).filter((pit) => pit.paid_item_instance_id === item.instance_id).map(mappers.mapDbTagAmount);

  if (itemTagAmounts.length > 0) {
    mapped.tagAmounts = itemTagAmounts;
  }

  paidItems[item.instance_id] = mapped;
  // ... reste du code
});
```

### Étape 5 : Mettre à jour les fonctions CRUD

Fichier `services/apiCrud.ts` - Modifier `apiSetPaidStatus` :

```typescript
export const apiSetPaidStatus = async (details: PaidItemDetails | null, instanceId: string) => {
  if (details) {
    // 1. Upsert paid_item
    const { error: itemError } = await supabase.from("paid_items").upsert({
      instance_id: details.instanceId,
      // ... autres champs
      tag_ids: details.tagIds || [], // Conservé pour compatibilité
    });

    if (itemError) return { error: itemError };

    // 2. Gérer les tagAmounts
    if (details.tagAmounts && details.tagAmounts.length > 0) {
      // Supprimer les anciens
      await supabase.from("paid_item_tags").delete().eq("paid_item_instance_id", details.instanceId);

      // Insérer les nouveaux
      const tagRows = details.tagAmounts.map((ta) => ({
        paid_item_instance_id: details.instanceId,
        tag_id: ta.tagId,
        amount: ta.amount,
      }));

      const { error: tagsError } = await supabase.from("paid_item_tags").insert(tagRows);

      if (tagsError) return { error: tagsError };
    }

    return {};
  } else {
    // Suppression
    const { error: itemError } = await supabase.from("paid_items").delete().eq("instance_id", instanceId);

    // Les paid_item_tags sont supprimés automatiquement (ON DELETE CASCADE)

    return { error: itemError };
  }
};
```

### Étape 6 : Intégrer dans le formulaire

Fichier `VariableTransactionForm.tsx` - Modifier :

```typescript
import { TagAmountSelector } from "../../../ui/molecules/TagAmountSelector";

// Dans le state
const [selectedTagAmounts, setSelectedTagAmounts] = useState<TagAmount[]>([]);

// Dans useEffect (chargement editingTransaction)
if (editingTransaction) {
  // ...
  setSelectedTagAmounts(editingTransaction.tagAmounts || []);
}

// Dans le formulaire (remplacer TagSelector)
<TagAmountSelector tags={tags} totalAmount={parseFloat(amount) || 0} selectedTagAmounts={selectedTagAmounts} onTagAmountsChange={setSelectedTagAmounts} />;

// Dans handleSubmit
onAddTransaction({
  // ... autres champs
  tagIds: selectedTagAmounts.map((ta) => ta.tagId), // Pour rétrocompatibilité
  tagAmounts: selectedTagAmounts,
});
```

### Étape 7 : Validation côté client

Ajouter dans `handleSubmit` :

```typescript
// Vérifier que la somme des montants = montant total (si tagAmounts utilisés)
if (selectedTagAmounts.length > 0) {
  const totalTagged = selectedTagAmounts.reduce((sum, ta) => sum + ta.amount, 0);
  const totalOp = parseFloat(amount);

  if (Math.abs(totalTagged - totalOp) > 0.01) {
    errors.push("La somme des montants par tag doit égaler le montant total");
  }
}
```

## Fonctionnalités UI

### Interface de ventilation

- Ajout/suppression de tags
- Saisie du montant pour chaque tag
- Indicateur visuel : total / affecté / reste
- Alerte si déséquilibre

### Bouton "Répartir équitablement"

- Distribue le montant total également entre tous les tags

### Validation

- La somme doit être égale au montant total (tolérance 0.01€)
- Empêche la soumission si déséquilibre

## Migration des données existantes

Les opérations existantes avec des tags auront des entrées dans `paid_item_tags` avec `amount = 0`.

Pour migrer automatiquement (optionnel) :

```sql
-- Distribuer équitablement le montant sur les tags existants
UPDATE paid_item_tags pit
SET amount = (
  SELECT pi.amount / array_length(pi.tag_ids, 1)
  FROM paid_items pi
  WHERE pi.instance_id = pit.paid_item_instance_id
)
WHERE pit.amount = 0;
```

## Rétrocompatibilité

- Le champ `tagIds` est conservé dans toutes les interfaces
- L'application fonctionne avec les deux systèmes
- Migration progressive : `tagIds` → `tagAmounts`
- Dans une future version, `tagIds` pourra être supprimé

## Tests recommandés

1. ✅ Créer une nouvelle opération avec ventilation
2. ✅ Modifier une opération existante pour ajouter ventilation
3. ✅ Vérifier que la somme des montants = total
4. ✅ Tester le bouton "Répartir équitablement"
5. ✅ Vérifier la persistance en base de données
6. ✅ Tester la suppression d'une opération (cascade)
7. ✅ Vérifier l'affichage des opérations avec tagAmounts dans le planner

## Notes importantes

- **Performance** : Les jointures SQL sont indexées
- **Sécurité** : RLS activée sur `paid_item_tags`
- **Cascade** : La suppression d'un paid_item supprime automatiquement ses tagAmounts
- **Validation** : Contrainte CHECK(amount > 0) en base
