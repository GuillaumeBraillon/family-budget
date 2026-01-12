/**
 * @file Parser de CHANGELOG.md
 * @description Extrait automatiquement les notes de la dernière version depuis CHANGELOG.md
 * pour affichage dans la modale "Quoi de neuf ?". Élimine la duplication de contenu.
 *
 * @architecture
 * **Source unique de vérité** : CHANGELOG.md
 * - Les notes de version ne sont écrites qu'une seule fois
 * - VersionInfoCard.tsx récupère automatiquement le contenu
 * - Plus de risque d'oubli de mise à jour manuelle
 *
 * **Format attendu du CHANGELOG** :
 * ```markdown
 * ## [X.Y.Z] - YYYY-MM-DD
 *
 * ### ✨ Nouvelles Fonctionnalités
 * ...
 * ```
 *
 * **Logique de parsing** :
 * 1. Lire CHANGELOG.md depuis /CHANGELOG.md
 * 2. Trouver la première occurrence de `## [version]`
 * 3. Extraire jusqu'à la prochaine version ou fin de section notable
 * 4. Nettoyer et formater pour affichage modal
 */
import changelogRaw from "../CHANGELOG.md?raw";

/**
 * Extrait les notes de version pour une version spécifique.
 *
 * @description
 * Parse le CHANGELOG.md et extrait la section correspondant à la version fournie.
 * Retourne une version simplifiée et formatée pour la modale "Quoi de neuf ?".
 *
 * **Algorithme** :
 * 1. Split par lignes
 * 2. Trouver ligne `## [version]`
 * 3. Collecter jusqu'à prochaine section `## [` ou section majeure
 * 4. Extraire uniquement les sections "Nouvelles Fonctionnalités" et descriptions user-facing
 * 5. Retirer les détails techniques trop verbeux (fichiers modifiés, code TypeScript)
 *
 * **Simplifications appliquées** :
 * - Conserver uniquement les sections ✨ Nouvelles Fonctionnalités
 * - Retirer les blocs de code TypeScript (```typescript ... ```)
 * - Retirer les sections "Fichiers modifiés" (trop techniques)
 * - Retirer les sections "Formules de Calcul" (trop verbeux pour modal)
 * - Garder les sections user-facing : titres ####, listes -, exemples d'usage
 *
 * @param {string} version - Version à extraire (format "X.Y.Z")
 * @returns {string} Notes formatées pour la modale
 *
 * @example
 * ```tsx
 * const notes = getVersionNotes("2.6.2");
 * // Retourne :
 * // ### ✨ Nouvelles Fonctionnalités
 * // #### Édition Bidirectionnelle des Soldes Bancaires
 * // ...
 * ```
 */
export const getVersionNotes = (version: string): string => {
  const lines = changelogRaw.split("\n");

  // Trouver le début de la section version
  const versionHeaderRegex = new RegExp(`^## \\[${version.replace(/\./g, "\\.")}\\]`);
  const startIndex = lines.findIndex((line) => versionHeaderRegex.test(line));

  if (startIndex === -1) {
    return `### ✨ Nouveautés v${version}\n\nAucune note de version disponible.`;
  }

  // Trouver la fin de la section (prochaine version ou fin fichier)
  let endIndex = lines.findIndex((line, idx) => idx > startIndex && line.startsWith("## ["));
  if (endIndex === -1) endIndex = lines.length;

  // Extraire les lignes de cette version
  const versionLines = lines.slice(startIndex + 1, endIndex);

  // Filtrer et simplifier pour la modale
  const simplifiedLines: string[] = [];
  let inCodeBlock = false;
  let inTechnicalSection = false;
  let skipUntilNextSection = false;

  for (let i = 0; i < versionLines.length; i++) {
    const line = versionLines[i];

    // Gestion des blocs de code (à ignorer)
    if (line.trim().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    // Détecter sections techniques à ignorer
    if (line.trim().startsWith("**Fichiers modifiés**") || line.trim().startsWith("**Formules de Calcul**")) {
      skipUntilNextSection = true;
      continue;
    }

    // Réinitialiser skip au début d'une nouvelle sous-section ####
    if (line.trim().startsWith("####")) {
      skipUntilNextSection = false;
    }

    if (skipUntilNextSection) continue;

    // Garder uniquement les sections user-facing
    if (line.trim().startsWith("### ✨")) {
      simplifiedLines.push(line);
      inTechnicalSection = false;
      continue;
    }

    // Titres de fonctionnalités (####)
    if (line.trim().startsWith("#### **")) {
      simplifiedLines.push(line);
      continue;
    }

    // Sous-titres (#### sans **)
    if (line.trim().startsWith("####")) {
      // Ignorer si c'est une sous-section technique
      if (line.includes("Fichiers modifiés") || line.includes("Formules") || line.includes("Architecture") || line.includes("Code")) {
        inTechnicalSection = true;
        continue;
      }
      simplifiedLines.push(line);
      inTechnicalSection = false;
      continue;
    }

    if (inTechnicalSection) continue;

    // Listes à puces user-facing
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      // Ignorer listes de fichiers modifiés
      if (line.includes(".tsx") || line.includes(".ts") || line.includes("État `")) {
        continue;
      }
      simplifiedLines.push(line);
      continue;
    }

    // Textes explicatifs
    if (line.trim().length > 0 && !line.startsWith("**Exemple")) {
      // Ignorer les blocs d'exemple trop longs
      if (line.includes("Situation :") || line.includes("Scénario")) {
        skipUntilNextSection = true;
        continue;
      }
      simplifiedLines.push(line);
    }
  }

  // Reconstituer le texte
  const content = simplifiedLines.join("\n").trim();

  return `### ✨ Nouveautés v${version}\n\n${content}`;
};

/**
 * Récupère les notes de la dernière version du CHANGELOG.
 *
 * @description
 * Wrapper pratique qui extrait automatiquement la toute première version
 * listée dans le CHANGELOG (qui est la plus récente).
 *
 * @returns {string} Notes de la dernière version formatées
 *
 * @example
 * ```tsx
 * const notes = getLatestVersionNotes();
 * // Retourne les notes de la version la plus récente
 * ```
 */
export const getLatestVersionNotes = (): string => {
  const lines = changelogRaw.split("\n");

  // Trouver la première occurrence de ## [X.Y.Z]
  const versionMatch = lines.find((line) => line.match(/^## \[(\d+\.\d+\.\d+)\]/));

  if (!versionMatch) {
    return "### ✨ Nouveautés\n\nAucune note de version disponible.";
  }

  const match = versionMatch.match(/^## \[(\d+\.\d+\.\d+)\]/);
  if (!match) return "### ✨ Nouveautés\n\nAucune note de version disponible.";

  const latestVersion = match[1];
  return getVersionNotes(latestVersion);
};
