import React, { useMemo, useState } from "react";
import { Account, Person, ExpenseConfig, IncomeConfig, PaidItemDetails, AppSettings, VariableTransaction, CategoryDef } from "../../../types";
import { usePlanner } from "../../../hooks/usePlanner";
import { Calendar, CalendarRange } from "lucide-react";
import { MonthNavigator } from "../../ui/molecules/MonthNavigator";
import { WeekSelector } from "../../ui/molecules/WeekSelector";
import { BalancesHeader } from "./components/BalancesHeader";
import { BalancesTable, BalanceRow } from "./components/BalancesTable";
import { TransferSummaryCard } from "./components/TransferSummaryCard";
import { BudgetDistributionSummary } from "./components/BudgetDistributionSummary";

interface BalancesViewProps {
  accounts: Account[];
  people: Person[];
  configs: ExpenseConfig[];
  incomeConfigs: IncomeConfig[];
  paidItems: Record<string, PaidItemDetails>;
  variableTransactions: VariableTransaction[];
  settings: AppSettings;
  categories: CategoryDef[];
  onUpdateAccount: (account: Account) => void;
}

export const BalancesView: React.FC<BalancesViewProps> = ({
  accounts,
  people,
  configs,
  incomeConfigs,
  paidItems,
  variableTransactions,
  settings,
  categories,
  onUpdateAccount,
}) => {
  // État de navigation
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scope, setScope] = useState<"MONTH" | "PERIOD">("PERIOD");

  // Déterminer la période active (semaine actuelle du mois affiché)
  const getWeekFromDate = (date: Date): number => {
    const day = date.getDate();
    if (day <= 7) return 1;
    if (day <= 14) return 2;
    if (day <= 21) return 3;
    return 4;
  };

  const [activeWeek, setActiveWeek] = useState(() => {
    const today = new Date();
    // Si on affiche le mois en cours, utiliser la période actuelle
    if (today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear()) {
      return getWeekFromDate(today);
    }
    // Sinon, première période du mois
    return 1;
  });

  const { calculatePeriodStatistics, filteredPeriodBudgets } = usePlanner(
    configs,
    incomeConfigs,
    paidItems,
    variableTransactions,
    currentDate,
    "",
    settings,
    categories
  );

  const stats = calculatePeriodStatistics(activeWeek);

  /**
   * Calcul des reports de dépassement budgétaire avec deux stratégies disponibles.
   *
   * @description
   * Gère la cascade des dépassements/économies budgétaires entre périodes selon
   * la stratégie configurée dans les paramètres (Settings > Général).
   *
   * **Deux stratégies de report :**
   *
   * 1. **NEXT_PERIOD (Déduction simple)** :
   *    - Le dépassement/économie de la période N est reporté UNIQUEMENT sur la période N+1
   *    - Report cumulatif : chaque période hérite du solde complet de la période précédente
   *    - Exemple : P1 = +278€ → P2 = 500€ - 278€ = 222€ → P3 = 222€ + solde P2
   *
   * 2. **SPREAD_REMAINING (Étalement sur périodes restantes)** :
   *    - Le dépassement/économie est RÉPARTI équitablement sur TOUTES les périodes suivantes
   *    - Calcul proportionnel : montant / nombre de périodes restantes
   *    - Exemple : P1 = +300€ avec 3 périodes restantes → P2, P3, P4 = 500€ - (300÷3) = 400€ chacune
   *    - Gère les reports multiples : P3 accumule les parts de P1 ET P2
   *
   * **Workflow de calcul :**
   * - ÉTAPE 1 : Calculer la consommation réelle de chaque période (dépenses - revenus, hors Extra)
   * - ÉTAPE 2 : Appliquer la stratégie choisie pour calculer les budgets ajustés
   *
   * **Gestion des montants Extra :**
   * - Fonction `getStandardAmountForCarryover` : exclut les montants Extra des calculs
   * - Seuls les montants Standard impactent les budgets de période
   * - Les montants Extra sont traités séparément (voir useOperationsData)
   *
   * @returns {Record<number, Object>} carryovers - Données budgétaires par période :
   *   - budgetBase: Budget théorique de la période (enveloppe ÷ nb périodes)
   *   - consumption: Consommation réelle (dépenses - revenus Standard)
   *   - carryover: Solde restant après consommation (peut être négatif)
   *   - adjustedBudget: Budget ajusté avec les reports (base + report(s))
   *
   * @example
   * ```tsx
   * // NEXT_PERIOD avec dépassement
   * P1: budgetBase=500, consumption=778 → carryover=-278, adjustedBudget=500
   * P2: budgetBase=500, consumption=150 → carryover=72, adjustedBudget=222 (500-278)
   *
   * // SPREAD_REMAINING avec dépassement
   * P1: budgetBase=500, consumption=800 → carryover=-300, adjustedBudget=500
   * P2: budgetBase=500, consumption=150 → adjustedBudget=400 (500 - 300÷3)
   * P3: budgetBase=500, consumption=200 → adjustedBudget=400 (500 - 300÷3)
   * P4: budgetBase=500, consumption=100 → adjustedBudget=400 (500 - 300÷3)
   * ```
   */
  const periodCarryovers = useMemo(() => {
    const carryovers: Record<number, { budgetBase: number; consumption: number; carryover: number; adjustedBudget: number }> = {};
    // Récupération de la stratégie choisie (défaut : NEXT_PERIOD pour compatibilité)
    const strategy = settings.carryover_strategy || "NEXT_PERIOD";

    // ÉTAPE 1 : Calculer la consommation de chaque période
    const periodConsumptions: Record<number, number> = {};
    filteredPeriodBudgets.forEach((period) => {
      const periodNumber = period.weekNumber;
      const periodVariableItems = period.items.filter((i) => i.source === "VARIABLE" && i.category !== "Virement Interne" && i.subCategory !== "Intérêts");

      /**
       * Calcule le montant Standard d'un item pour les reports budgétaires.
       *
       * @description
       * Exclut les montants Extra des calculs de consommation de période :
       * - Si toggle Extra global activé → 0€ (toute l'opération est hors budget)
       * - Si pas de tags → Montant total (tout est Standard)
       * - Si tags présents → Montant total - somme des tags Extra
       *
       * **Logique de filtrage :**
       * 1. Vérifier le toggle global (`isExtraGlobal`) en priorité
       * 2. Si tags présents, soustraire uniquement les montants marqués `isExtra: true`
       * 3. Retourner maximum entre 0 et montant calculé (éviter négatifs)
       *
       * @param {PlannedItem} item - Opération à analyser (dépense ou revenu)
       * @returns {number} Montant Standard en € (0 si 100% Extra)
       *
       * @example
       * ```tsx
       * // Opération 100% Extra (toggle global)
       * item = { amount: 150, isExtraGlobal: true, tagAmounts: [] }
       * getStandardAmountForCarryover(item) // → 0€
       *
       * // Opération mixte (70€ Extra + 45€ Standard)
       * item = { amount: 115, isExtraGlobal: false, tagAmounts: [
       *   { tagId: 't1', amount: 70, isExtra: true },
       *   { tagId: 't2', amount: 45, isExtra: false }
       * ]}
       * getStandardAmountForCarryover(item) // → 45€ (115 - 70)
       *
       * // Opération 100% Standard (pas de tags)
       * item = { amount: 200, isExtraGlobal: false, tagAmounts: [] }
       * getStandardAmountForCarryover(item) // → 200€
       * ```
       */
      const getStandardAmountForCarryover = (item: PlannedItem): number => {
        // Cas 1 : Toggle global Extra activé → Toute l'opération est hors budget
        if (item.isExtraGlobal) return 0;
        // Cas 2 : Pas de ventilation par tags → Tout le montant est Standard
        if (!item.tagAmounts || item.tagAmounts.length === 0) return item.amount;
        // Cas 3 : Ventilation par tags → Calculer montant Standard (total - Extra)
        const extraSum = item.tagAmounts.filter((ta) => ta.isExtra === true).reduce((sum, ta) => sum + ta.amount, 0);
        return Math.max(0, item.amount - extraSum);
      };

      let periodExpenses = 0;
      let periodIncome = 0;

      periodVariableItems.forEach((i) => {
        const standardAmount = getStandardAmountForCarryover(i);
        if (i.type === "EXPENSE") {
          periodExpenses += standardAmount;
        } else if (i.type === "INCOME") {
          periodIncome += standardAmount;
        }
      });

      periodConsumptions[periodNumber] = periodExpenses - periodIncome;
    });

    // ========== ÉTAPE 2 : Calculer les reports selon la stratégie ==========

    if (strategy === "NEXT_PERIOD") {
      /**
       * STRATÉGIE 1 : NEXT_PERIOD (Déduction simple)
       *
       * @description
       * Report cumulatif linéaire : chaque période hérite du solde complet de la période précédente.
       *
       * **Algorithme :**
       * 1. Initialiser cumulativeCarryover = 0
       * 2. Pour chaque période :
       *    - Budget ajusté = Budget de base + Report cumulé
       *    - Solde restant = Budget ajusté - Consommation
       *    - Report cumulé (pour période suivante) = Solde restant
       *
       * **Avantages :**
       * - Simple à comprendre et prévisible
       * - Effet immédiat sur la période suivante
       * - Pas de calculs complexes
       *
       * **Exemple avec dépassement :**
       * P1: Budget 500€, Conso 778€ → Report = -278€
       * P2: Budget 500€ + (-278€) = 222€ → Si conso 150€ → Report = +72€
       * P3: Budget 500€ + 72€ = 572€ → Etc.
       *
       * **Exemple avec économie :**
       * P1: Budget 500€, Conso 300€ → Report = +200€
       * P2: Budget 500€ + 200€ = 700€ → Si conso 400€ → Report = +300€
       * P3: Budget 500€ + 300€ = 800€ → Etc.
       */
      let cumulativeCarryover = 0;

      filteredPeriodBudgets.forEach((period) => {
        const periodNumber = period.weekNumber;
        const periodBudget = period.periodLimit || 0;
        const adjustedBudget = periodBudget + cumulativeCarryover;
        const periodConsumption = periodConsumptions[periodNumber] || 0;
        const remainingBalance = adjustedBudget - periodConsumption;

        cumulativeCarryover = remainingBalance;

        carryovers[periodNumber] = {
          budgetBase: periodBudget,
          consumption: periodConsumption,
          carryover: remainingBalance,
          adjustedBudget: adjustedBudget,
        };
      });
    } else {
      /**
       * STRATÉGIE 2 : SPREAD_REMAINING (Étalement sur périodes restantes)
       *
       * @description
       * Report distribué : les dépassements/économies sont répartis équitablement
       * sur TOUTES les périodes restantes (pas seulement la suivante).
       *
       * **Algorithme complexe avec gestion multi-périodes :**
       * 1. Pour chaque période N :
       *    - Analyser toutes les périodes précédentes (0 à N-1)
       *    - Pour chaque période précédente i :
       *      a) Calculer son report brut (budget - consommation)
       *      b) Soustraire les ajustements déjà appliqués par les périodes encore plus anciennes (0 à i-1)
       *      c) Diviser le report "nettoyé" par le nombre de périodes restantes depuis i
       *      d) Ajouter cette fraction au report total de la période N
       *
       * **Pourquoi soustraire les ajustements précédents ?**
       * - Problème : Sans soustraction, risque de double-comptage
       * - Exemple : P3 doit compter la part de P1 ET P2, mais le budget P2 inclut déjà une part de P1
       * - Solution : Soustraire de P2 ce qu'elle a déjà reçu de P1 avant de calculer sa propre part
       *
       * **Avantages :**
       * - Lisse l'impact d'un gros dépassement sur plusieurs périodes
       * - Évite de "sacrifier" complètement la période suivante
       * - Meilleure visibilité sur plusieurs périodes
       *
       * **Exemple avec dépassement P1 = -300€ (4 périodes) :**
       * P1: Budget 500€, Conso 800€ → Part à étaler = -300€ sur 3 périodes restantes
       * P2: Budget ajusté = 500€ + (-300÷3) = 400€
       * P3: Budget ajusté = 500€ + (-300÷3) = 400€ (même part de P1)
       * P4: Budget ajusté = 500€ + (-300÷3) = 400€ (même part de P1)
       *
       * **Exemple avec dépassements multiples :**
       * P1: -300€ → Étalé sur P2, P3, P4 → -100€ chacune
       * P2: -150€ (après ajustement -100€ de P1) → Reste -50€ → Étalé sur P3, P4 → -25€ chacune
       * P3: Budget ajusté = 500€ - 100€ (part P1) - 25€ (part P2) = 375€
       * P4: Budget ajusté = 500€ - 100€ (part P1) - 25€ (part P2) = 375€
       */
      filteredPeriodBudgets.forEach((period, index) => {
        const periodNumber = period.weekNumber;
        const periodBudget = period.periodLimit || 0;

        // Calculer le report à appliquer pour cette période
        let carryoverForThisPeriod = 0;

        // Analyser toutes les périodes précédentes
        for (let i = 0; i < index; i++) {
          const prevPeriod = filteredPeriodBudgets[i];
          const prevPeriodNumber = prevPeriod.weekNumber;
          const prevBudget = prevPeriod.periodLimit || 0;
          const prevConsumption = periodConsumptions[prevPeriodNumber] || 0;

          // Report brut de cette période précédente
          let prevRawCarryover = prevBudget - prevConsumption;

          /**
           * Soustraire les ajustements déjà appliqués par les périodes encore plus anciennes.
           *
           * @description
           * Cette boucle imbriquée évite le double-comptage des reports multiples.
           *
           * **Problème à résoudre :**
           * Si P1 a un dépassement de -300€ étalé sur P2, P3, P4 :
           * - P2 reçoit -100€ (300÷3)
           * - Le budget ajusté de P2 devient 400€ (500 - 100)
           * - Si P2 consomme 300€, son report brut = 400 - 300 = 100€
           * - MAIS ce 100€ inclut déjà l'effet du -100€ de P1
           * - Donc pour calculer la vraie part de P2 à étaler sur P3 et P4,
           *   il faut soustraire l'ajustement de P1 : 100€ - (-100€) = 200€
           *
           * **Algorithme :**
           * Pour chaque période j antérieure à la période i en cours d'analyse :
           * 1. Calculer le report brut de j (budget - consommation)
           * 2. Calculer la part étalée de j (report brut ÷ périodes restantes)
           * 3. Soustraire cette part du report brut de i
           * 4. Répéter pour toutes les périodes j < i
           *
           * **Exemple concret :**
           * ```
           * P1: Budget 500, Conso 800 → Report brut = -300 → Part P1 sur 3 périodes = -100
           * P2: Budget ajusté 400 (500-100), Conso 300 → Report brut = 100
           *     Mais ce 100 inclut déjà l'effet -100 de P1
           *     Report "nettoyé" = 100 - (-100) = 200
           *     Part P2 sur 2 périodes restantes = 200÷2 = 100
           * P3: Budget ajusté = 500 - 100 (P1) + 100 (P2) = 500
           * ```
           */
          for (let j = 0; j < i; j++) {
            const evenEarlierPeriod = filteredPeriodBudgets[j];
            const evenEarlierNumber = evenEarlierPeriod.weekNumber;
            const evenEarlierBudget = evenEarlierPeriod.periodLimit || 0;
            const evenEarlierConsumption = periodConsumptions[evenEarlierNumber] || 0;
            const evenEarlierRawCarryover = evenEarlierBudget - evenEarlierConsumption;

            if (evenEarlierRawCarryover < 0) {
              const remainingPeriods = filteredPeriodBudgets.length - evenEarlierNumber;
              const spreadAmount = evenEarlierRawCarryover / remainingPeriods;
              prevRawCarryover -= spreadAmount;
            } else if (evenEarlierRawCarryover > 0) {
              const remainingPeriods = filteredPeriodBudgets.length - evenEarlierNumber;
              const spreadAmount = evenEarlierRawCarryover / remainingPeriods;
              prevRawCarryover -= spreadAmount;
            }
          }

          // Si dépassement, étaler sur les périodes restantes
          if (prevRawCarryover < 0) {
            const remainingPeriods = filteredPeriodBudgets.length - prevPeriodNumber;
            const spreadAmount = prevRawCarryover / remainingPeriods;
            carryoverForThisPeriod += spreadAmount;
          } else if (prevRawCarryover > 0) {
            // Si économie, étaler aussi
            const remainingPeriods = filteredPeriodBudgets.length - prevPeriodNumber;
            const spreadAmount = prevRawCarryover / remainingPeriods;
            carryoverForThisPeriod += spreadAmount;
          }
        }

        const adjustedBudget = periodBudget + carryoverForThisPeriod;
        const periodConsumption = periodConsumptions[periodNumber] || 0;
        const remainingBalance = adjustedBudget - periodConsumption;

        carryovers[periodNumber] = {
          budgetBase: periodBudget,
          consumption: periodConsumption,
          carryover: remainingBalance,
          adjustedBudget: adjustedBudget,
        };
      });
    }

    return carryovers;
  }, [filteredPeriodBudgets, settings.carryover_strategy]);

  // Budget alloué pour la période (adapté selon le scope)
  const budgetPeriodeGlobal =
    scope === "MONTH"
      ? filteredPeriodBudgets.reduce((sum, p) => sum + (p.periodLimit || 0), 0)
      : periodCarryovers[activeWeek]?.adjustedBudget || stats.periodLimit;

  // Calcul des opérations récurrentes en attente (Courant + Retard)
  const pendingRecurring = stats.fixedToPay + stats.fixedDelays;

  // 1. Identification des comptes
  const checkingAccounts = useMemo(() => accounts.filter((a) => a.type === "COURANT"), [accounts]);
  const jointAccount = checkingAccounts.find((a) => a.isJoint);
  const personalAccounts = checkingAccounts.filter((a) => !a.isJoint);

  // 2. Calcul du total des soldes personnels actuels
  const totalPersonalBalance = personalAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0);

  // 3. Récupération des données selon le scope (Mois complet ou Période spécifique)
  const scopeItems = useMemo(() => {
    if (scope === "MONTH") {
      return filteredPeriodBudgets.flatMap((w) => w.items);
    } else {
      const currentWeekData = filteredPeriodBudgets.find(
        (w) => w.weekNumber === (filteredPeriodBudgets.some((w) => w.weekNumber === activeWeek) ? activeWeek : 1)
      );
      return currentWeekData?.items || [];
    }
  }, [scope, filteredPeriodBudgets, activeWeek]);

  // Calcul de la consommation variable totale (Payé + En attente)
  // Exclusion de "Virement Interne" ET "Intérêts"
  const variableItems = scopeItems.filter((i) => i.source === "VARIABLE" && i.category !== "Virement Interne" && i.subCategory !== "Intérêts");

  /**
   * Calcule le montant Standard d'une opération (hors Extra).
   * Gère les opérations mixtes avec tags Extra partiels.
   *
   * Logique :
   * - Si toggle global Extra : 0€ (tout est Extra)
   * - Sinon, si tags présents : montant total - somme des tags Extra
   * - Sinon : montant total
   */
  const getStandardAmount = (item: PlannedItem): number => {
    // Si toggle global Extra activé : tout est Extra, rien de Standard
    if (item.isExtraGlobal) return 0;

    // Pas de tags : tout le montant est Standard
    if (!item.tagAmounts || item.tagAmounts.length === 0) {
      return item.amount;
    }

    // Avec tags : calculer la somme des montants Extra
    const extraSum = item.tagAmounts.filter((ta) => ta.isExtra === true).reduce((sum, ta) => sum + ta.amount, 0);

    // Retourner le montant Standard (total - Extra)
    return Math.max(0, item.amount - extraSum);
  };

  // LOGIQUE SIMPLIFIÉE GRÂCE AUX DÉPENSES NÉGATIVES
  // Somme simple : Si dépense (100) -> +100. Si remboursement (-20) -> -20.
  // Donc le total = Somme des montants dépenses
  let varExpenses = 0;
  let varIncome = 0;

  variableItems.forEach((i) => {
    const standardAmount = getStandardAmount(i);

    if (i.type === "EXPENSE") {
      varExpenses += standardAmount; // Uniquement la partie Standard
    } else if (i.type === "INCOME") {
      varIncome += standardAmount; // Uniquement la partie Standard
    }
  });

  // Calculs pour le Header
  const realConsumption = varExpenses - varIncome;
  const distributableBalance = Math.max(0, budgetPeriodeGlobal - realConsumption);

  // --- DÉTAILS PAR COMPTE ---

  // 1. Opérations Variables En Attente
  const pendingVariablesDetails = useMemo(() => {
    return checkingAccounts
      .map((acc) => {
        const totalPending = filteredPeriodBudgets
          .flatMap((w) => w.items)
          .filter((i) => i.accountId === acc.id && i.source === "VARIABLE" && i.type === "EXPENSE" && !i.isPaid && i.subCategory !== "Intérêts")
          .reduce((sum, i) => sum + i.amount, 0); // Marche aussi avec montants négatifs

        return { name: acc.name, amount: totalPending };
      })
      .filter((x) => x.amount > 0); // On n'affiche que s'il y a une dette positive
  }, [filteredPeriodBudgets, checkingAccounts]);

  // 2. Opérations Récurrentes En Attente (Courant + Retards)
  const pendingRecurringDetails = useMemo(() => {
    const relevantItems = filteredPeriodBudgets
      .filter((w) => w.weekNumber <= activeWeek)
      .flatMap((w) => w.items)
      .filter((i) => i.source === "RECURRING" && !i.isPaid && i.category !== "Virement Interne" && i.type === "EXPENSE");

    return checkingAccounts
      .map((acc) => {
        const amount = relevantItems.filter((i) => i.accountId === acc.id).reduce((sum, i) => sum + i.amount, 0);
        return { name: acc.name, amount };
      })
      .filter((x) => x.amount > 0);
  }, [filteredPeriodBudgets, activeWeek, checkingAccounts]);

  // 3. Total Dette (Reste à payer global)
  const totalDebtDetails = useMemo(() => {
    return checkingAccounts
      .map((acc) => {
        const remaining = stats.byAccount[acc.id]?.remaining || 0;
        return { name: acc.name, amount: remaining };
      })
      .filter((x) => x.amount > 0);
  }, [checkingAccounts, stats]);

  // 4. Consommation Variable Réelle par compte
  const consumedDetails = useMemo(() => {
    return checkingAccounts
      .map((acc) => {
        const items = variableItems.filter((i) => i.accountId === acc.id);

        let expense = 0;
        let income = 0;

        items.forEach((i) => {
          const standardAmount = getStandardAmount(i);

          if (i.type === "EXPENSE") {
            expense += standardAmount;
          } else if (i.type === "INCOME") {
            income += standardAmount;
          }
        });

        return { name: acc.name, amount: expense - income };
      })
      .filter((x) => Math.abs(x.amount) > 0.01);
  }, [checkingAccounts, variableItems]);

  const { jointRows, personalRows, totalPersonalRow, virLddsTotal } = useMemo(() => {
    const jRows: BalanceRow[] = [];
    const pRows: BalanceRow[] = [];

    // --- LOGIQUE COMPTES PERSONNELS (Méthode Enveloppe) ---
    // 1. Calcul du Reste à Vivre Réel (Budget - Consommation)
    const remainingBudget = distributableBalance;

    // 2. Calcul du Montant Net à Distribuer (Reste à vivre - Ce qu'ils ont déjà)
    const netDistributable = Math.max(0, remainingBudget - totalPersonalBalance);

    let totalTransfersToPersonals = 0;

    // Calcul pour chaque compte perso
    for (const acc of personalAccounts) {
      const owner = people.find((p) => p.id === acc.ownerId);

      let transferAmount = 0;

      // Application du Ratio sur le Net à Distribuer
      if (acc.targetRatio !== undefined) {
        const shareOfDistributable = netDistributable * (acc.targetRatio / 100);
        const cap = acc.targetCap !== undefined ? acc.targetCap : Infinity;
        transferAmount = Math.min(shareOfDistributable, cap);
      }

      // Cible = Solde Actuel + Virement (Ce qu'ils devraient avoir au final)
      const targetBalance = acc.currentBalance + transferAmount;

      // On cumule les virements positifs uniquement pour la synthèse
      if (transferAmount > 0) {
        totalTransfersToPersonals += transferAmount;
      }

      pRows.push({
        id: acc.id,
        name: acc.name,
        owner: owner?.name || "Inconnu",
        balance: acc.currentBalance,
        target: targetBalance,
        transfer: transferAmount, // Peut être négatif si surplus (mais ignoré pour le global)
        isJoint: false,
        ratio: acc.targetRatio,
        cap: acc.targetCap,
      });
    }

    // --- LOGIQUE COMPTE JOINT (Méthode Couverture de Dettes) ---
    let jointTransferNeeded = 0;
    let jointTarget = 0;

    if (jointAccount) {
      const owner = people.find((p) => p.id === jointAccount.ownerId);

      // Besoin Joint = Somme de toutes les dettes en attente sur ce compte (Récurrentes + Variables)
      const jointStats = stats.byAccount[jointAccount.id];
      const pendingOnJoint = jointStats ? jointStats.remaining : 0;

      // Le compte joint doit couvrir ses dettes.
      jointTarget = pendingOnJoint;

      // Virement nécessaire = Dettes - Solde Actuel
      const gap = pendingOnJoint - jointAccount.currentBalance;

      // Si le solde couvre les dettes (gap < 0), le virement est 0 pour la synthèse
      jointTransferNeeded = Math.max(0, gap);

      jRows.push({
        id: jointAccount.id,
        name: jointAccount.name,
        owner: owner?.name || "Commun",
        balance: jointAccount.currentBalance,
        target: jointTarget,
        transfer: gap, // On affiche le vrai gap même si négatif (excédent)
        isJoint: true,
      });
    }

    // --- LIGNE DE TOTAL POUR COMPTES PERSONNELS ---
    const totalPersonalRow: BalanceRow = {
      id: "total",
      name: "TOTAL",
      owner: "",
      balance: pRows.reduce((sum, r) => sum + r.balance, 0),
      target: pRows.reduce((sum, r) => sum + r.target, 0),
      transfer: pRows.reduce((sum, r) => sum + r.transfer, 0),
      isJoint: false,
    };

    // --- SYNTHÈSE GLOBALE ---
    // Le virement du LDDS doit couvrir le trou du Compte Joint + les Top-ups des comptes persos
    const globalTransfer = jointTransferNeeded + totalTransfersToPersonals;

    // Tri par libellé (name) pour un affichage cohérent
    jRows.sort((a, b) => a.name.localeCompare(b.name));
    pRows.sort((a, b) => a.name.localeCompare(b.name));

    return { jointRows: jRows, personalRows: pRows, totalPersonalRow, virLddsTotal: globalTransfer };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts, people, budgetPeriodeGlobal, totalPersonalBalance, jointAccount, personalAccounts, stats, distributableBalance]);

  const handleUpdateBalance = (id: string, newBalance: number) => {
    const account = accounts.find((a) => a.id === id);
    if (account) {
      onUpdateAccount({ ...account, currentBalance: newBalance });
    }
  };

  // Récupération de la dette totale pour l'affichage header
  const totalPendingHeader = checkingAccounts.reduce((sum, acc) => {
    return sum + (stats.byAccount[acc.id]?.remaining || 0);
  }, 0);

  // Handlers de navigation
  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
    setActiveWeek(1); // Réinitialiser à la première période
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
    setActiveWeek(1); // Réinitialiser à la première période
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Navigation de période */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <MonthNavigator date={currentDate} onPrev={handlePrevMonth} onNext={handleNextMonth} />

          <div className="bg-white border border-slate-200 p-1 rounded-xl flex items-center justify-center shadow-sm">
            <button
              onClick={() => setScope("MONTH")}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                scope === "MONTH" ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Calendar size={14} /> Mois
            </button>
            <button
              onClick={() => setScope("PERIOD")}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                scope === "PERIOD" ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <CalendarRange size={14} /> Période
            </button>
          </div>
        </div>
      </div>

      {/* Sélecteur de période si en mode PERIOD */}
      {scope === "PERIOD" && <WeekSelector weeks={filteredPeriodBudgets} activeWeek={activeWeek} onSelect={setActiveWeek} searchQuery="" showBadge={false} />}

      <BalancesHeader
        resteAPayer={totalPendingHeader}
        pendingRecurring={pendingRecurring}
        pendingVariablesDetails={pendingVariablesDetails}
        pendingRecurringDetails={pendingRecurringDetails}
        totalDetails={totalDebtDetails}
      />

      {jointRows.length > 0 && <BalancesTable title="Compte Pivot" rows={jointRows} onUpdateBalance={handleUpdateBalance} />}

      {/* SECTION RÉPARTITION BUDGÉTAIRE */}
      <BudgetDistributionSummary
        totalEnvelope={budgetPeriodeGlobal}
        usedEnvelope={realConsumption}
        distributable={distributableBalance}
        consumedDetails={consumedDetails}
        previousCarryover={scope === "PERIOD" && activeWeek > 1 ? periodCarryovers[activeWeek - 1]?.carryover : undefined}
        budgetBase={scope === "PERIOD" ? periodCarryovers[activeWeek]?.budgetBase : undefined}
        carryoverStrategy={settings.carryover_strategy || "NEXT_PERIOD"}
      />

      <BalancesTable title="Comptes Courants" rows={personalRows} onUpdateBalance={handleUpdateBalance} totalRow={totalPersonalRow} />

      <TransferSummaryCard amount={virLddsTotal} />
    </div>
  );
};
