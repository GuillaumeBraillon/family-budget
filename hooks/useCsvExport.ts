/**
 * @file Hook réutilisable pour l'export CSV
 * @description Fournit une fonction générique pour générer et télécharger des fichiers CSV
 * avec gestion du BOM UTF-8 pour Excel et échappement des caractères spéciaux.
 */

/**
 * Hook d'export CSV générique.
 *
 * @description
 * Génère un fichier CSV à partir de données tabulaires et déclenche le téléchargement.
 * Compatible Excel avec BOM UTF-8 et échappement RFC 4180.
 *
 * @returns {Object} Fonction d'export
 * @returns {Function} exportToCsv - Génère et télécharge le CSV
 *
 * @example
 * ```tsx
 * const { exportToCsv } = useCsvExport();
 *
 * const handleExport = () => {
 *   const headers = ["Nom", "Prénom", "Age"];
 *   const rows = [
 *     ["Doe", "John", "30"],
 *     ["Smith", "Jane", "25"]
 *   ];
 *   exportToCsv(headers, rows, "export_contacts");
 * };
 * ```
 */
export const useCsvExport = () => {
  /**
   * Formate un nombre au format français pour CSV (Google Sheets).
   *
   * @param {number} num - Nombre à formater
   * @param {number} decimals - Nombre de décimales (défaut: 2)
   * @returns {string} Nombre formaté avec "," comme séparateur décimal et sans espace pour les milliers
   *
   * @example
   * ```tsx
   * formatNumberFr(1234.56) // "1234,56"
   * formatNumberFr(1000) // "1000,00"
   * ```
   */
  const formatNumberFr = (num: number, decimals: number = 2): string => {
    // Arrondir à N décimales et remplacer le point par une virgule
    return num.toFixed(decimals).replace(".", ",");
  };

  /**
   * Échappe une chaîne pour CSV selon RFC 4180.
   *
   * @param {string} str - Chaîne à échapper
   * @returns {string} Chaîne échappée entre guillemets si nécessaire
   */
  const escapeCsv = (str: string): string => {
    const value = (str || "").toString();
    // Échapper les guillemets doubles en les doublant
    const escaped = value.replace(/"/g, '""');
    // Entourer de guillemets si contient des caractères spéciaux
    if (escaped.includes(";") || escaped.includes("\n") || escaped.includes('"')) {
      return `"${escaped}"`;
    }
    return `"${escaped}"`;
  };

  /**
   * Génère et télécharge un fichier CSV.
   *
   * @param {string[]} headers - En-têtes de colonnes
   * @param {string[][]} rows - Lignes de données (tableau 2D)
   * @param {string} filename - Nom du fichier sans extension
   *
   * @example
   * ```tsx
   * exportToCsv(
   *   ["Date", "Montant", "Libellé"],
   *   [["2025-01-15", "50.00", "Courses"]],
   *   "export_operations"
   * );
   * // Télécharge : export_operations_2025-01-23.csv
   * ```
   */
  const exportToCsv = (headers: string[], rows: string[][], filename: string) => {
    // Échapper les headers
    const escapedHeaders = headers.map(escapeCsv);

    // Construire le contenu CSV
    const csvContent = [escapedHeaders.join(";"), ...rows.map((row) => row.join(";"))].join("\n");

    // Ajouter BOM UTF-8 pour Excel
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });

    // Créer un lien de téléchargement
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      const today = new Date().toISOString().split("T")[0];
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}_${today}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Nettoyage mémoire
    }
  };

  return { exportToCsv, escapeCsv, formatNumberFr };
};
