/**
 * Formatte les messages d'erreur PostgreSQL en messages user-friendly
 */
export const formatDatabaseError = (errorMessage: string): string => {
  // Erreurs de contrainte CHECK
  if (errorMessage.includes('check constraint "check_day_of_month_valid"')) {
    return "Le jour du mois doit être compris entre 1 et 31.";
  }

  if (errorMessage.includes('check constraint "check_amount_positive"')) {
    return "Le montant doit être positif (supérieur à 0).";
  }

  if (errorMessage.includes('check constraint "check_amount_not_zero"')) {
    return "Le montant ne peut pas être nul (0€).";
  }

  if (errorMessage.includes('check constraint "check_no_self_transfer"')) {
    return "Impossible de faire un virement vers le même compte.";
  }

  if (errorMessage.includes('check constraint "check_period_value_positive"')) {
    return "La valeur de période doit être positive.";
  }

  if (errorMessage.includes('check constraint "check_month_format_start"') || errorMessage.includes('check constraint "check_month_format_end"')) {
    return "Le format du mois doit être AAAA-MM (exemple: 2025-12).";
  }

  if (errorMessage.includes('check constraint "check_month_order"')) {
    return "Le mois de fin doit être après le mois de début.";
  }

  // Erreurs de contrainte NOT NULL
  if (errorMessage.includes("violates not-null constraint")) {
    const match = errorMessage.match(/column "([^"]+)"/);
    const column = match ? match[1] : "champ";
    return `Le champ "${column}" est obligatoire.`;
  }

  // Erreurs de clé étrangère
  if (errorMessage.includes("violates foreign key constraint")) {
    return "Cette opération fait référence à un élément qui n'existe plus.";
  }

  // Erreurs d'unicité
  if (errorMessage.includes("duplicate key value violates unique constraint")) {
    return "Cette valeur existe déjà dans la base de données.";
  }

  // Erreurs de type ENUM
  if (errorMessage.includes("invalid input value for enum")) {
    return "Valeur non valide pour ce type de champ.";
  }

  // Message par défaut (affiche le message brut si non reconnu)
  return errorMessage;
};
