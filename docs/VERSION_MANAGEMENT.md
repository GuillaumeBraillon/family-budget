# 📦 Gestion de Version et Changelog

## 🎯 Bonnes Pratiques Appliquées

### 1. **Source Unique de Vérité**

**Version** : Stockée uniquement dans `package.json`

```json
{
  "name": "budget-familiale",
  "version": "2.5.0"
}
```

**Changelog** : Fichier `CHANGELOG.md` au format [Keep a Changelog](https://keepachangelog.com/)

```markdown
## [2.5.0] - 2026-01-12

### Added

- Affichage opérations réelles dans BalancesTable

### Fixed

- Balance transfers calculation bug
```

### 2. **Architecture Technique**

#### Import Direct de package.json

```typescript
import packageJson from "../../../../../package.json";

// Accès à la version
const version = packageJson.version; // "2.5.0"
```

#### Composant Dédié

- **Fichier** : `components/features/Configuration/components/molecules/VersionInfoCard.tsx`
- **Responsabilité** : Affichage version + accès changelog
- **Placement** : GlobalSettings > Actions Système

### 3. **Affichage UI**

#### Badge Version

```tsx
<div className="text-4xl font-black text-indigo-600">v{packageJson.version}</div>
```

#### Boutons d'Action

- **"Quoi de neuf ?"** : Modale avec notes de version récente
- **"Changelog complet"** : Lien externe vers GitHub

#### Modale Changelog

- Format Markdown parsé manuellement
- Sections structurées (Nouveautés, Corrections, etc.)
- Lien vers toutes les versions GitHub

### 4. **Workflow de Release (Automatisé)**

Le processus est entièrement automatisé par des **hooks Git locaux** (`.git/hooks/`).

1. **Update CHANGELOG.md** :
   Ajouter la nouvelle version en haut du fichier :

   ```markdown
   ## [2.6.0] - 2026-02-05
   ```

2. **Commit** :

   ```bash
   git add .
   git commit -m "feat: ma nouvelle fonctionnalité"
   ```

3. **Automation (Hooks)** :
   - **Pre-commit** : Lit la version du `CHANGELOG.md` et met à jour automatiquement `package.json` avant de finaliser le commit.
   - **Post-commit** : Détecte la nouvelle version et crée automatiquement le tag Git correspondant (ex: `v2.6.0`).

4. **Push** :
   ```bash
   git push origin main --tags
   ```

_Note : Si les hooks ne sont pas actifs sur votre machine, assurez-vous de copier les scripts dans `.git/hooks/` et de les rendre exécutables._

### 5. **Fonctionnalités Optionnelles**

#### Badge "Nouveau" (Not Implemented)

```typescript
// Stocker dernière version vue dans localStorage
const lastSeenVersion = localStorage.getItem('lastSeenVersion');
const showNewBadge = lastSeenVersion !== packageJson.version;

// Afficher badge si nouvelle version
{showNewBadge && (
  <span className="bg-indigo-600 text-white px-2 py-1 rounded-full text-xs">
    Nouveau
  </span>
)}
```

#### Modale Auto au Premier Lancement (Not Implemented)

```typescript
useEffect(() => {
  const lastVersion = localStorage.getItem("appVersion");
  if (lastVersion !== packageJson.version) {
    setShowChangelog(true);
    localStorage.setItem("appVersion", packageJson.version);
  }
}, []);
```

#### Parser Automatique CHANGELOG.md (Not Implemented)

```typescript
// Utiliser import dynamique + regex pour extraire sections
import changelog from "../../../../../CHANGELOG.md?raw";

const parseChangelog = (md: string): Release[] => {
  // Regex pour extraire versions et notes
  // ...
};
```

### 6. **Avantages de l'Architecture Actuelle**

✅ **DRY** : Version définie une seule fois (package.json)  
✅ **Maintenable** : Changelog externe, facile à mettre à jour  
✅ **User-Friendly** : Accès rapide aux nouveautés depuis Settings  
✅ **Scalable** : Facile d'ajouter auto-update checks  
✅ **Standard** : Suit les conventions npm/SemVer

### 7. **Références**

- [Semantic Versioning](https://semver.org/) : Format de version MAJOR.MINOR.PATCH
- [Keep a Changelog](https://keepachangelog.com/) : Format de changelog standard
- [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github) : Publication de versions

---

## 🛠️ Fichiers Concernés

- `/package.json` : Source de vérité pour la version
- `/CHANGELOG.md` : Historique des modifications
- `/components/features/Configuration/components/molecules/VersionInfoCard.tsx` : Composant UI
- `/components/features/Configuration/components/organisms/GlobalSettings.tsx` : Intégration

## 📸 Capture UI

```
┌─────────────────────────────────────────────┐
│ 🔵 Version de l'application            ⓘ   │
│                                              │
│ ┌──────────────────────────────────────┐   │
│ │  v2.5.0   Version actuelle           │   │
│ │  Family Budget                       │   │
│ │                                       │   │
│ │  [📄 Quoi de neuf ?]  [🔗 Changelog] │   │
│ └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

**Note** : Cette architecture privilégie la simplicité et la maintenabilité plutôt que l'automatisation complète. Le changelog reste manuel pour un meilleur contrôle éditorial.
