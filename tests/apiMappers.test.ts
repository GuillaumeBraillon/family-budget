/**
 * @file Tests unitaires pour les fonctions de mapping DB ↔ App
 * @description Tests critiques pour garantir l'intégrité des conversions
 * entre les types DB (snake_case) et les types App (camelCase)
 */
import { describe, it, expect } from "vitest";
import { mapDbPerson, mapDbAccount, mapDbExpenseConfig, mapDbIncomeConfig, mapDbPaidItem, mapDbTransfer, mapDbSettings } from "../services/apiMappers";
import type { DbPerson, DbAccount, DbExpenseConfig, DbIncomeConfig, DbPaidItem, DbTransfer, DbSettings } from "../services/dbTypes";

describe("apiMappers - Conversions DB vers App", () => {
  describe("mapDbPerson", () => {
    it("convertit correctement un DbPerson en Person", () => {
      const dbPerson: DbPerson = {
        id: "person-1",
        name: "Alice",
        is_child: true,
        display_order: 2,
      };

      const result = mapDbPerson(dbPerson);

      expect(result).toEqual({
        id: "person-1",
        name: "Alice",
        isChild: true,
        displayOrder: 2,
      });
    });

    it("gère is_child = false", () => {
      const dbPerson: DbPerson = {
        id: "person-2",
        name: "Bob",
        is_child: false,
        display_order: 1,
      };

      const result = mapDbPerson(dbPerson);
      expect(result.isChild).toBe(false);
    });
  });

  describe("mapDbAccount", () => {
    it("convertit correctement un compte courant avec solde", () => {
      const dbAccount: DbAccount = {
        id: "acc-1",
        name: "Compte Courant",
        type: "CHECKING",
        owner_id: "person-1",
        current_balance: 1500.5,
        bank_name: "BNP Paribas",
        is_joint: false,
      };

      const result = mapDbAccount(dbAccount);

      expect(result).toEqual({
        id: "acc-1",
        name: "Compte Courant",
        type: "CHECKING",
        ownerId: "person-1",
        currentBalance: 1500.5,
        bankName: "BNP Paribas",
        isJoint: false,
      });
    });

    it("convertit correctement un compte épargne", () => {
      const dbAccount: DbAccount = {
        id: "acc-2",
        name: "Livret A",
        type: "SAVINGS",
        owner_id: "person-2",
        current_balance: 5000,
        bank_name: null,
        is_joint: true,
      };

      const result = mapDbAccount(dbAccount);

      expect(result.type).toBe("SAVINGS");
      expect(result.isJoint).toBe(true);
    });

    it("gère current_balance null comme 0", () => {
      const dbAccount: DbAccount = {
        id: "acc-3",
        name: "Nouveau Compte",
        type: "CHECKING",
        owner_id: "person-1",
        current_balance: null,
        bank_name: null,
        is_joint: false,
      };

      const result = mapDbAccount(dbAccount);
      expect(result.currentBalance).toBe(0);
    });
  });

  describe("mapDbExpenseConfig", () => {
    it("convertit une dépense récurrente complète", () => {
      const dbConfig: DbExpenseConfig = {
        id: "exp-1",
        label: "Loyer",
        amount: 800,
        category: "Logement",
        sub_category: "Loyer",
        beneficiary_id: "person-1",
        account_id: "acc-1",
        day_of_month: 5,
        start_month: "2026-01",
        end_month: "2026-12",
        is_extra: false,
      };

      const result = mapDbExpenseConfig(dbConfig);

      expect(result).toEqual({
        id: "exp-1",
        label: "Loyer",
        amount: 800,
        category: "Logement",
        subCategory: "Loyer",
        beneficiaryId: "person-1",
        accountId: "acc-1",
        dayOfMonth: 5,
        startMonth: "2026-01",
        endMonth: "2026-12",
        isExtra: false,
      });
    });

    it("gère les champs optionnels null", () => {
      const dbConfig: DbExpenseConfig = {
        id: "exp-2",
        label: "Courses",
        amount: null,
        category: "Alimentation",
        sub_category: null,
        beneficiary_id: "person-2",
        account_id: "acc-1",
        day_of_month: 15,
        start_month: null,
        end_month: null,
        is_extra: false,
      };

      const result = mapDbExpenseConfig(dbConfig);

      expect(result.amount).toBe(0);
      expect(result.subCategory).toBeUndefined();
      expect(result.startMonth).toBeUndefined();
      expect(result.endMonth).toBeUndefined();
    });

    it("convertit is_extra correctement", () => {
      const dbConfig: DbExpenseConfig = {
        id: "exp-3",
        label: "Cadeau",
        amount: 150,
        category: "Loisirs",
        sub_category: null,
        beneficiary_id: "person-1",
        account_id: "acc-1",
        day_of_month: 20,
        start_month: null,
        end_month: null,
        is_extra: true,
      };

      const result = mapDbExpenseConfig(dbConfig);
      expect(result.isExtra).toBe(true);
    });
  });

  describe("mapDbIncomeConfig", () => {
    it("convertit un revenu récurrent (salaire)", () => {
      const dbIncome: DbIncomeConfig = {
        id: "inc-1",
        label: "Salaire Alice",
        amount: 2500,
        account_id: "acc-1",
        beneficiary_id: "person-1",
        day_of_month: 28,
        category: "Salaires",
        sub_category: "CDI",
        is_extra: false,
        is_salary: true,
        start_month: "2026-01",
        end_month: null,
      };

      const result = mapDbIncomeConfig(dbIncome);

      expect(result).toEqual({
        id: "inc-1",
        label: "Salaire Alice",
        amount: 2500,
        accountId: "acc-1",
        beneficiaryId: "person-1",
        dayOfMonth: 28,
        category: "Salaires",
        subCategory: "CDI",
        isExtra: false,
        isSalary: true,
        startMonth: "2026-01",
        endMonth: undefined,
      });
    });

    it("gère les revenus non-salaire", () => {
      const dbIncome: DbIncomeConfig = {
        id: "inc-2",
        label: "Remboursement",
        amount: 50,
        account_id: "acc-1",
        beneficiary_id: "person-2",
        day_of_month: 10,
        category: "Alimentation",
        sub_category: null,
        is_extra: false,
        is_salary: false,
        start_month: null,
        end_month: null,
      };

      const result = mapDbIncomeConfig(dbIncome);
      expect(result.isSalary).toBe(false);
    });
  });

  describe("mapDbPaidItem", () => {
    it("convertit un paid_item (opération pointée)", () => {
      const dbItem: DbPaidItem = {
        instance_id: "exp-1-2026-02",
        amount: 800,
        payment_date: "2026-02-05",
        account_id: "acc-1",
        label: "Loyer Février",
        category: "Logement",
        sub_category: "Loyer",
        type: "EXPENSE",
        is_variable: false,
        is_waiting: false,
        is_extra: false,
        is_refund: false,
        is_salary: false,
        comments: "Paiement OK",
      };

      const result = mapDbPaidItem(dbItem);

      expect(result).toEqual({
        instanceId: "exp-1-2026-02",
        amount: 800,
        paymentDate: "2026-02-05",
        accountId: "acc-1",
        label: "Loyer Février",
        category: "Logement",
        subCategory: "Loyer",
        type: "EXPENSE",
        isRefund: false,
        isSalary: false,
        isVariable: false,
        isWaiting: false,
        isExtra: false,
        comments: "Paiement OK",
      });
    });

    it("gère comments null comme undefined", () => {
      const dbItem: DbPaidItem = {
        instance_id: "exp-2-2026-02",
        amount: 50,
        payment_date: "2026-02-10",
        account_id: "acc-1",
        label: "Courses",
        category: "Alimentation",
        sub_category: null,
        type: "EXPENSE",
        is_variable: true,
        is_waiting: false,
        is_extra: false,
        comments: null,
      };

      const result = mapDbPaidItem(dbItem);
      expect(result.comments).toBeUndefined();
    });

    it("convertit type null en EXPENSE par défaut", () => {
      const dbItem: DbPaidItem = {
        instance_id: "exp-3-2026-02",
        amount: 100,
        payment_date: "2026-02-15",
        account_id: "acc-1",
        label: "Transaction",
        category: "Divers",
        sub_category: null,
        type: null,
        is_variable: false,
        is_waiting: false,
        is_extra: false,
        comments: null,
      };

      const result = mapDbPaidItem(dbItem);
      expect(result.type).toBe("EXPENSE");
    });
  });

  describe("mapDbTransfer", () => {
    it("convertit un virement standard", () => {
      const dbTransfer: DbTransfer = {
        id: "trans-1",
        date: "2026-02-15",
        label: "Épargne mensuelle",
        amount: 500,
        source_account_id: "acc-1",
        destination_account_id: "acc-2",
        created_at: "2026-02-15T10:00:00Z",
        is_interest: false,
      };

      const result = mapDbTransfer(dbTransfer);

      expect(result).toEqual({
        id: "trans-1",
        date: "2026-02-15",
        label: "Épargne mensuelle",
        amount: 500,
        sourceAccountId: "acc-1",
        destinationAccountId: "acc-2",
        createdAt: "2026-02-15T10:00:00Z",
        isInterest: false,
      });
    });

    it("convertit un virement d'intérêts", () => {
      const dbTransfer: DbTransfer = {
        id: "trans-2",
        date: "2026-02-28",
        label: "Intérêts Livret A",
        amount: 5.5,
        source_account_id: null,
        destination_account_id: "acc-2",
        created_at: "2026-02-28T00:00:00Z",
        is_interest: true,
      };

      const result = mapDbTransfer(dbTransfer);
      expect(result.isInterest).toBe(true);
      expect(result.amount).toBe(5.5);
    });
  });

  describe("mapDbSettings", () => {
    it("convertit les settings complets", () => {
      const dbSettings: DbSettings = {
        id: "1",
        personal_budget_amount: 400,
        family_variable_budget: 180,
        period_type: "CUSTOM_SPLIT",
        period_value: 4,
        operations_sorting: ["exp-1", "exp-2", "inc-1"],
        accounts_sorting: ["acc-1", "acc-2"],
      };

      const result = mapDbSettings(dbSettings);

      expect(result).toEqual({
        personal_budget_amount: 400,
        family_variable_budget: 180,
        period_type: "CUSTOM_SPLIT",
        period_value: 4,
        operations_sorting: ["exp-1", "exp-2", "inc-1"],
        accounts_sorting: ["acc-1", "acc-2"],
      });
    });

    it("retourne les valeurs par défaut si data est null", () => {
      const result = mapDbSettings(null);

      expect(result).toEqual({
        personal_budget_amount: 350,
        family_variable_budget: 0,
        period_type: "FIXED_DAYS",
        period_value: 7,
        operations_sorting: [],
        accounts_sorting: [],
      });
    });

    it("gère les champs null avec valeurs par défaut", () => {
      const dbSettings: DbSettings = {
        id: "1",
        personal_budget_amount: null,
        family_variable_budget: null,
        period_type: null,
        period_value: null,
        operations_sorting: null,
        accounts_sorting: null,
      } as any;

      const result = mapDbSettings(dbSettings);

      expect(result.personal_budget_amount).toBe(350);
      expect(result.family_variable_budget).toBe(0);
      expect(result.period_type).toBe("FIXED_DAYS");
      expect(result.period_value).toBe(7);
      expect(result.operations_sorting).toEqual([]);
    });

    it("convertit les valeurs numériques correctement", () => {
      const dbSettings: DbSettings = {
        id: 1,
        period_type: "CALENDAR_WEEKS",
        period_value: "7", // Peut arriver en string
        operations_sorting: [],
        accounts_sorting: [],
      } as any;

      const result = mapDbSettings(dbSettings);

      expect(result.period_value).toBe(7);
      expect(typeof result.period_value).toBe("number");
    });
  });
});
