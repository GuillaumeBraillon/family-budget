# 📝 Standards des Formulaires - Guide de Développement

**Version :** 1.0.0  
**Date :** 9 janvier 2026  
**Objectif :** Assurer une cohérence visuelle et comportementale de tous les formulaires de l'application.

---

## 🎨 Standards Visuels

### Espacement (Spacing)

**Container principal** :

```tsx
<div className="space-y-2.5">{/* Contenu du formulaire */}</div>
```

- **Valeur standard** : `space-y-2.5` (10px entre chaque élément)
- **Rationale** : Équilibre parfait entre compacité et lisibilité

**Grilles** :

```tsx
<div className="grid grid-cols-2 gap-2.5">{/* Deux colonnes égales */}</div>
```

- **Gap standard** : `gap-2.5` (10px entre colonnes)
- **Usage** : Montant/Date, Compte/Bénéficiaire, etc.

**Container de boutons** :

```tsx
<div className="flex gap-2.5 pt-3 border-t border-slate-100">{/* Boutons d'action */}</div>
```

- **Gap boutons** : `gap-2.5`
- **Padding top** : `pt-3` (12px)
- **Border separator** : Toujours présent avant les actions

### Séparateurs Visuels

**Séparateur standard** :

```tsx
<div className="border-t border-slate-100 pt-2.5 mt-2.5"></div>
```

**Où placer les séparateurs ?**

1. ✅ **AVANT** les sections de tags/ventilation
2. ✅ **AVANT** les sections de durée/validité
3. ✅ **AVANT** le container de boutons d'action
4. ❌ **JAMAIS** entre champs d'un même groupe logique

**Exemple d'usage** :

```tsx
{/* Groupe 1 : Informations de base */}
<TextInput label="Libellé" ... />
<AmountInput label="Montant" ... />

{/* Séparateur avant groupe 2 */}
<div className="border-t border-slate-100 pt-2.5 mt-2.5"></div>

{/* Groupe 2 : Options avancées */}
<TagAmountSelector ... />
<ToggleExtra ... />

{/* Séparateur avant actions */}
<div className="flex gap-2.5 pt-3 border-t border-slate-100">
  <button>Annuler</button>
  <button>Valider</button>
</div>
```

### Padding & Margins

**Toggles & Cards** :

```tsx
<div className="px-3 py-2.5 rounded-lg border">{/* Contenu */}</div>
```

- **Padding horizontal** : `px-3` (12px)
- **Padding vertical** : `py-2.5` (10px)

**InfoBox explicatives** :

```tsx
<div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex items-start gap-2.5">
  <Icon />
  <p className="text-xs">Explication...</p>
</div>
```

- **Padding uniforme** : `p-3` (12px)
- **Gap icône/texte** : `gap-2.5`

### Bordures & Arrondis

**Input fields** :

```tsx
className = "border border-slate-300 rounded-lg";
```

- **Couleur standard** : `border-slate-300`
- **Arrondi** : `rounded-lg` (8px)

**Toggles & Cards** :

```tsx
// État inactif
className = "border border-transparent hover:border-slate-200";

// État actif
className = "border border-emerald-200 bg-emerald-50";
```

**Containers** :

```tsx
className = "rounded-xl"; // 12px pour containers principaux
className = "rounded-lg"; // 8px pour éléments internes
```

---

## 🎯 Standards Comportementaux

### Validation & Erreurs

**Bloc d'erreurs standard** :

```tsx
{
  validationErrors.length > 0 && (
    <div
      ref={errorBlockRef}
      tabIndex={-1}
      className="bg-rose-50 border border-rose-200 rounded-xl p-3 animate-in fade-in slide-in-from-top-2 duration-200 outline-none focus:ring-2 focus:ring-rose-300"
    >
      <p className="text-xs font-bold text-rose-700 mb-1">⚠️ Champs manquants :</p>
      <ul className="text-xs text-rose-600 space-y-0.5 list-disc list-inside">
        {validationErrors.map((error, idx) => (
          <li key={idx}>{error}</li>
        ))}
      </ul>
    </div>
  );
}
```

**Comportement requis** :

1. ✅ **Scroll automatique** vers le bloc d'erreurs
2. ✅ **Focus automatique** pour accessibilité
3. ✅ **Animation d'entrée** pour attirer l'attention
4. ✅ **Liste à puces** pour clarté
5. ✅ **Emoji ⚠️** pour impact visuel

**Code de scroll automatique** :

```tsx
const errorBlockRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (validationErrors.length > 0 && errorBlockRef.current) {
    errorBlockRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    errorBlockRef.current.focus();
  }
}, [validationErrors]);
```

### Gestion des Erreurs Async

**Pattern try/catch standard** :

```tsx
const { showError } = useError();

const handleFormSubmit = async () => {
  try {
    const result = form.handleSubmit(onClose);
    if (!result) return;
    await onSaveAction(result);
  } catch (err) {
    showError(err as Error, "Contexte de l'erreur");
  }
};
```

**Contextes recommandés** :

- `"Sauvegarde de transaction"`
- `"Suppression de virement"`
- `"Pointage d'opération"`
- `"Création de règle récurrente"`

### Modales de Confirmation

**ConfirmModal standard** :

```tsx
if (showDeleteConfirm) {
  return (
    <ConfirmModal
      isOpen={true}
      title="Supprimer ?"
      message={`Voulez-vous supprimer "${item.label}" ?`}
      onConfirm={handleDelete}
      onCancel={() => setShowDeleteConfirm(false)}
    />
  );
}
```

**État requis** :

```tsx
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
```

---

## 🧩 Composants Réutilisables

### Inputs

**TextInput** :

```tsx
<TextInput
  label="Libellé"
  value={formData.label}
  onChange={(e) => setFormData((prev) => ({ ...prev, label: e.target.value }))}
  placeholder="Ex: Loyer, Courses..."
  icon={Icon}
  required
/>
```

**AmountInput** :

```tsx
<AmountInput
  label="Montant"
  value={formData.amount}
  onChange={(e) => setFormData((prev) => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
  color="indigo"
  required
/>
```

**SearchableTextInput** :

```tsx
<SearchableTextInput
  label="Libellé"
  value={formData.label}
  onChange={(e) => setFormData((prev) => ({ ...prev, label: e.target.value }))}
  onSelectSuggestion={(value) => setFormData((prev) => ({ ...prev, label: value }))}
  placeholder="Ex: Épargne..."
  suggestions={savedSuggestions}
  required
/>
```

### Selectors

**AccountSelector** :

```tsx
<AccountSelector
  label="Compte"
  accounts={accounts}
  value={formData.accountId}
  onChange={(e) => setFormData((prev) => ({ ...prev, accountId: e.target.value }))}
  color="indigo"
  showBalance
  filterTypes={[AccountType.CHECKING]}
/>
```

**BeneficiarySelector** :

```tsx
<BeneficiarySelector
  people={people}
  value={formData.beneficiaryId}
  onChange={(e) => setFormData((prev) => ({ ...prev, beneficiaryId: e.target.value }))}
  color="indigo"
/>
```

**CategorySelector** :

```tsx
<CategorySelector
  categories={categories}
  type="EXPENSE"
  selectedCategory={formData.category}
  selectedSubCategory={formData.subCategory}
  onCategoryChange={(val) => setFormData((prev) => ({ ...prev, category: val }))}
  onSubCategoryChange={(val) => setFormData((prev) => ({ ...prev, subCategory: val }))}
/>
```

### Toggles

**Pattern standard** :

```tsx
<div
  onClick={() => setIsActive(!isActive)}
  className={`cursor-pointer px-3 py-2.5 rounded-lg border transition-all flex items-center gap-3 ${
    isActive ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-transparent hover:border-slate-200"
  }`}
>
  <div className={`p-1 rounded ${isActive ? "bg-emerald-200 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
    <Icon size={14} />
  </div>
  <div className="flex-1">
    <span className={`text-xs font-bold block ${isActive ? "text-emerald-800" : "text-slate-600"}`}>Titre du toggle</span>
    {isActive && <span className="text-[10px] text-emerald-600 leading-none">Explication quand actif.</span>}
  </div>
  <input type="checkbox" checked={isActive} onChange={() => {}} className="pointer-events-none" />
</div>
```

**Couleurs selon contexte** :

- **Extra/Exceptionnel** : `amber-*`
- **Intérêts/Crédit** : `emerald-*`
- **Remboursement** : `emerald-*`
- **Alerte/Attention** : `rose-*`
- **Information** : `indigo-*` ou `blue-*`

---

## 📱 Boutons d'Action

### Boutons Primaires

**Validation principale** :

```tsx
<button
  onClick={handleSubmit}
  className="flex-1 text-white py-2 rounded-xl font-bold shadow-sm transition-colors flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700"
>
  <Icon size={18} /> Valider
</button>
```

**Couleurs selon contexte** :

- **Dépense** : `bg-indigo-600 hover:bg-indigo-700`
- **Revenu** : `bg-emerald-600 hover:bg-emerald-700`
- **En attente** : `bg-amber-100 text-amber-700 hover:bg-amber-200`

### Bouton Suppression

```tsx
<button
  type="button"
  onClick={() => setShowDeleteConfirm(true)}
  className="px-3 py-2 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors"
>
  <Trash2 size={18} />
</button>
```

### Layout Standard

```tsx
<div className="flex gap-2.5 pt-3 border-t border-slate-100">
  {/* Bouton suppression (optionnel) */}
  {isEditing && onDelete && (
    <button className="px-3 py-2 bg-red-50 text-red-600 ...">
      <Trash2 size={18} />
    </button>
  )}

  {/* Boutons actions principales */}
  <button className="flex-1 ...">Action 1</button>
  <button className="flex-1 ...">Action 2</button>
</div>
```

---

## ✅ Checklist de Développement

Avant de soumettre un nouveau formulaire, vérifier :

### Structure

- [ ] Container principal avec `space-y-2.5`
- [ ] Grilles avec `gap-2.5`
- [ ] Séparateurs avant groupes de champs
- [ ] Border separator avant boutons (`pt-3 border-t`)

### Validation

- [ ] Bloc d'erreurs avec ref + scroll automatique
- [ ] useEffect pour scroll vers erreurs
- [ ] Messages d'erreur clairs et concis
- [ ] Animation d'entrée du bloc d'erreurs

### Gestion d'Erreurs

- [ ] Importation de `useError()`
- [ ] Tous les handlers async dans try/catch
- [ ] `showError()` avec contexte descriptif
- [ ] Modale de confirmation pour suppressions

### Composants

- [ ] Utilisation des composants atomiques (`TextInput`, `AmountInput`, etc.)
- [ ] Props `required` sur champs obligatoires
- [ ] `autoFocus` sur premier champ (création uniquement)
- [ ] Toggles avec icônes et texte explicatif

### Boutons

- [ ] Container avec `flex gap-2.5`
- [ ] Icônes Lucide sur tous les boutons
- [ ] Couleurs adaptées au contexte
- [ ] États hover définis

### Accessibilité

- [ ] Labels explicites sur tous les champs
- [ ] Placeholder texte clair
- [ ] Focus management (scroll + tabIndex)
- [ ] Contraste couleurs suffisant

---

## 📖 Exemples Complets

### Formulaire Simple (1 colonne)

```tsx
<Modal isOpen={isOpen} onClose={onClose} title="Nouvelle Entrée">
  <div className="space-y-2.5">
    {/* Bloc erreurs */}
    {validationErrors.length > 0 && (
      <div ref={errorBlockRef} tabIndex={-1} className="bg-rose-50...">
        <p className="text-xs font-bold text-rose-700 mb-1">⚠️ Champs manquants :</p>
        <ul className="text-xs text-rose-600 space-y-0.5 list-disc list-inside">
          {validationErrors.map((error, idx) => (
            <li key={idx}>{error}</li>
          ))}
        </ul>
      </div>
    )}

    {/* Champs */}
    <TextInput label="Nom" value={name} onChange={setName} required />
    <AmountInput label="Montant" value={amount} onChange={setAmount} required />

    {/* Séparateur */}
    <div className="border-t border-slate-100 pt-2.5 mt-2.5"></div>

    {/* Toggle */}
    <div onClick={toggleActive} className="cursor-pointer px-3 py-2.5...">
      {/* Contenu toggle */}
    </div>

    {/* Boutons */}
    <div className="flex gap-2.5 pt-3 border-t border-slate-100">
      <button className="flex-1...">Valider</button>
    </div>
  </div>
</Modal>
```

### Formulaire Complexe (2 colonnes)

```tsx
<Modal isOpen={isOpen} onClose={onClose} title="Transaction Complète">
  <div className="space-y-2.5">
    {/* Erreurs */}
    {/* ... */}

    {/* Section 1 : Informations de base */}
    <SearchableTextInput label="Libellé" ... required />

    <div className="grid grid-cols-2 gap-2.5">
      <AmountInput label="Montant" ... required />
      <TextInput label="Date" type="date" ... required />
    </div>

    <div className="grid grid-cols-2 gap-2.5">
      <AccountSelector label="Compte" ... />
      <BeneficiarySelector ... />
    </div>

    <CategorySelector ... />

    {/* Séparateur */}
    <div className="border-t border-slate-100 pt-2.5 mt-2.5"></div>

    {/* Section 2 : Options avancées */}
    <TagAmountSelector tags={tags} ... />

    <div onClick={toggleExtra} className="cursor-pointer px-3 py-2.5...">
      {/* Toggle Extra */}
    </div>

    <TextInput label="Note" ... />

    {/* Boutons */}
    <div className="flex gap-2.5 pt-3 border-t border-slate-100">
      {isEditing && <button className="px-3 py-2 bg-red-50...">
        <Trash2 size={18} />
      </button>}
      <button className="flex-1...">En attente</button>
      <button className="flex-1...">Pointé</button>
    </div>
  </div>
</Modal>
```

---

## 🔧 Maintenance

### Quand modifier ce guide ?

1. **Ajout de nouveau pattern** : Documenter immédiatement
2. **Modification standard existant** : Mettre à jour + noter date
3. **Bug pattern récurrent** : Ajouter dans anti-patterns
4. **Nouveau composant réutilisable** : Ajouter dans section Composants

### Version History

| Version | Date       | Changements                                    |
| ------- | ---------- | ---------------------------------------------- |
| 1.0.0   | 2026-01-09 | Création initiale après harmonisation complète |

---

## 📞 Support

Pour toute question ou suggestion d'amélioration de ces standards :

- Ouvrir une issue GitHub avec label `form-standards`
- Contacter l'équipe frontend

**Rappel** : Ces standards sont vivants et doivent évoluer avec le projet ! 🚀
