/**
 * @file Tests unitaires pour les helpers utilitaires
 * @description Tests de formatage, validation et helpers courants
 */
import { describe, it, expect } from "vitest";

/**
 * Formate un montant en euros
 * @param amount - Montant numérique
 * @param showSign - Afficher le signe +/- (défaut: false)
 * @returns Montant formaté (ex: "1 234,56 €")
 */
function formatCurrency(amount: number, showSign: boolean = false): string {
  const formatted = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(Math.abs(amount));

  if (showSign && amount !== 0) {
    return amount > 0 ? `+${formatted}` : `-${formatted}`;
  }

  return amount < 0 ? `-${formatted}` : formatted;
}

/**
 * Formate une date au format français
 * @param dateString - Date au format ISO (YYYY-MM-DD)
 * @returns Date formatée (ex: "15 février 2026")
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/**
 * Formate une date courte au format français
 * @param dateString - Date au format ISO (YYYY-MM-DD)
 * @returns Date formatée (ex: "15/02/2026")
 */
function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/**
 * Vérifie si une date est dans le mois en cours
 * @param dateString - Date au format ISO (YYYY-MM-DD)
 * @param currentMonth - Mois courant au format YYYY-MM
 * @returns true si la date est dans le mois
 */
function isInMonth(dateString: string, currentMonth: string): boolean {
  return dateString.startsWith(currentMonth);
}

/**
 * Calcule le pourcentage par rapport à un total
 * @param value - Valeur
 * @param total - Total
 * @returns Pourcentage arrondi à 1 décimale
 */
function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 1000) / 10;
}

/**
 * Valide un email
 * @param email - Email à valider
 * @returns true si email valide
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Tronque un texte avec ellipsis
 * @param text - Texte à tronquer
 * @param maxLength - Longueur maximale
 * @returns Texte tronqué
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * Génère un ID unique basé sur timestamp
 * @param prefix - Préfixe optionnel
 * @returns ID unique
 */
function generateId(prefix: string = ""): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 5);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

describe("Helpers utilitaires", () => {
  describe("formatCurrency", () => {
    it("formate un montant positif", () => {
      const result = formatCurrency(1234.56);
      expect(result).toContain("1");
      expect(result).toContain("234,56");
      expect(result).toContain("€");
    });

    it("formate un montant négatif", () => {
      const result = formatCurrency(-1234.56);
      expect(result).toContain("-1");
      expect(result).toContain("234,56");
      expect(result).toContain("€");
    });

    it("formate zéro", () => {
      const result = formatCurrency(0);
      expect(result).toContain("0,00");
      expect(result).toContain("€");
    });

    it("affiche le signe + pour un montant positif", () => {
      const result = formatCurrency(100, true);
      expect(result).toMatch(/^\+100,00/);
      expect(result).toContain("€");
    });

    it("affiche le signe - pour un montant négatif", () => {
      const result = formatCurrency(-100, true);
      expect(result).toMatch(/^-100,00/);
      expect(result).toContain("€");
    });

    it("n'affiche pas de signe pour zéro même avec showSign=true", () => {
      const result = formatCurrency(0, true);
      expect(result).toContain("0,00");
      expect(result).toContain("€");
      expect(result).not.toMatch(/^[+-]/);
    });

    it("gère les montants avec beaucoup de décimales", () => {
      const result = formatCurrency(1234.567891);
      expect(result).toContain("1");
      expect(result).toContain("234,57"); // Arrondi à 2 décimales
      expect(result).toContain("€");
    });

    it("gère les très grands montants", () => {
      const result = formatCurrency(1000000);
      expect(result).toContain("1");
      expect(result).toContain("000");
      expect(result).toContain("000,00");
      expect(result).toContain("€");
    });

    it("gère les centimes", () => {
      const result = formatCurrency(0.99);
      expect(result).toContain("0,99");
      expect(result).toContain("€");
    });
  });

  describe("formatDate", () => {
    it("formate une date complète", () => {
      expect(formatDate("2026-02-15")).toBe("15 février 2026");
    });

    it("formate le premier jour du mois", () => {
      expect(formatDate("2026-01-01")).toBe("1 janvier 2026");
    });

    it("formate le dernier jour du mois", () => {
      expect(formatDate("2026-12-31")).toBe("31 décembre 2026");
    });

    it("gère février", () => {
      expect(formatDate("2026-02-28")).toBe("28 février 2026");
    });
  });

  describe("formatDateShort", () => {
    it("formate une date courte", () => {
      expect(formatDateShort("2026-02-15")).toBe("15/02/2026");
    });

    it("formate avec zéros préfixés", () => {
      expect(formatDateShort("2026-01-05")).toBe("05/01/2026");
    });
  });

  describe("isInMonth", () => {
    it("retourne true si la date est dans le mois", () => {
      expect(isInMonth("2026-02-15", "2026-02")).toBe(true);
    });

    it("retourne false si la date est dans un autre mois", () => {
      expect(isInMonth("2026-03-15", "2026-02")).toBe(false);
    });

    it("retourne true pour le premier jour du mois", () => {
      expect(isInMonth("2026-02-01", "2026-02")).toBe(true);
    });

    it("retourne true pour le dernier jour du mois", () => {
      expect(isInMonth("2026-02-28", "2026-02")).toBe(true);
    });

    it("retourne false pour une autre année", () => {
      expect(isInMonth("2025-02-15", "2026-02")).toBe(false);
    });
  });

  describe("calculatePercentage", () => {
    it("calcule un pourcentage simple", () => {
      expect(calculatePercentage(50, 100)).toBe(50.0);
    });

    it("calcule un pourcentage avec décimale", () => {
      expect(calculatePercentage(33, 100)).toBe(33.0);
    });

    it("arrondit à 1 décimale", () => {
      expect(calculatePercentage(33.333, 100)).toBe(33.3);
    });

    it("gère les valeurs avec décimales", () => {
      expect(calculatePercentage(45.5, 200)).toBe(22.8);
    });

    it("retourne 0 si total est 0", () => {
      expect(calculatePercentage(100, 0)).toBe(0);
    });

    it("retourne 100 si value = total", () => {
      expect(calculatePercentage(150, 150)).toBe(100.0);
    });

    it("peut retourner > 100%", () => {
      expect(calculatePercentage(150, 100)).toBe(150.0);
    });

    it("gère les valeurs négatives", () => {
      expect(calculatePercentage(-50, 100)).toBe(-50.0);
    });
  });

  describe("isValidEmail", () => {
    it("accepte un email valide standard", () => {
      expect(isValidEmail("user@example.com")).toBe(true);
    });

    it("accepte un email avec sous-domaine", () => {
      expect(isValidEmail("user@mail.example.com")).toBe(true);
    });

    it("accepte un email avec +", () => {
      expect(isValidEmail("user+tag@example.com")).toBe(true);
    });

    it("accepte un email avec .", () => {
      expect(isValidEmail("first.last@example.com")).toBe(true);
    });

    it("rejette un email sans @", () => {
      expect(isValidEmail("userexample.com")).toBe(false);
    });

    it("rejette un email sans domaine", () => {
      expect(isValidEmail("user@")).toBe(false);
    });

    it("rejette un email sans extension", () => {
      expect(isValidEmail("user@example")).toBe(false);
    });

    it("rejette un email vide", () => {
      expect(isValidEmail("")).toBe(false);
    });

    it("rejette un email avec espaces", () => {
      expect(isValidEmail("user @example.com")).toBe(false);
    });
  });

  describe("truncateText", () => {
    it("ne tronque pas un texte court", () => {
      expect(truncateText("Hello", 10)).toBe("Hello");
    });

    it("tronque un texte trop long", () => {
      expect(truncateText("Hello World", 8)).toBe("Hello...");
    });

    it("gère la longueur exacte", () => {
      expect(truncateText("Hello", 5)).toBe("Hello");
    });

    it("tronque à la longueur limite", () => {
      expect(truncateText("Hello World", 5)).toBe("He...");
    });

    it("gère les textes vides", () => {
      expect(truncateText("", 10)).toBe("");
    });

    it("gère maxLength = 3 (minimum pour ellipsis)", () => {
      expect(truncateText("Hello", 3)).toBe("...");
    });
  });

  describe("generateId", () => {
    it("génère un ID unique", () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it("génère un ID avec préfixe", () => {
      const id = generateId("test");
      expect(id).toMatch(/^test_\d+_[a-z0-9]{5}$/);
    });

    it("génère un ID sans préfixe", () => {
      const id = generateId();
      expect(id).toMatch(/^\d+_[a-z0-9]{5}$/);
    });

    it("génère des IDs différents successivement", () => {
      const ids = new Set();
      for (let i = 0; i < 10; i++) {
        ids.add(generateId());
      }
      expect(ids.size).toBe(10); // Tous uniques
    });
  });

  describe("Scénarios d'intégration", () => {
    it("formate un montant budget avec pourcentage", () => {
      const spent = 1234.56;
      const budget = 2000;

      const formattedSpent = formatCurrency(spent);
      const percentage = calculatePercentage(spent, budget);

      expect(formattedSpent).toContain("1");
      expect(formattedSpent).toContain("234,56");
      expect(formattedSpent).toContain("€");
      expect(percentage).toBe(61.7);
    });

    it("formate une transaction avec date et montant", () => {
      const date = "2026-02-15";
      const amount = -123.45;

      const formattedDate = formatDateShort(date);
      const formattedAmount = formatCurrency(amount, true);

      expect(formattedDate).toBe("15/02/2026");
      expect(formattedAmount).toMatch(/^-123,45/);
      expect(formattedAmount).toContain("€");
    });

    it("valide et formate un email utilisateur", () => {
      const email = "user@example.com";
      const isValid = isValidEmail(email);

      expect(isValid).toBe(true);
    });

    it("tronque un libellé long pour affichage", () => {
      const label = "Remboursement frais médicaux pharmacie";
      const truncated = truncateText(label, 30);

      expect(truncated).toMatch(/^Remboursement frais/);
      expect(truncated).toContain("...");
      expect(truncated.length).toBe(30);
    });
  });
});
