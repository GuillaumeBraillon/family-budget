/**
 * @file Tests unitaires pour les fonctions de mapping DB ↔ App
 * @description Tests critiques pour garantir l'intégrité des conversions
 * entre les types DB (snake_case) et les types App (camelCase)
 */
import { describe, it, expect } from "vitest";
import {
  mapDbPerson,
  mapDbAccount,
  mapDbTagAmount,
  mapDbExpenseConfig,
  mapDbIncomeConfig,
  mapDbPaidItem,
  mapDbTransfer,
  mapDbSettings,
  mapDbTag,
} from "../services/apiMappers";
import type { DbPerson, DbAccount, DbPaidItemTag, DbExpenseConfig, DbIncomeConfig, DbPaidItem, DbTransfer, DbSettings, DbTag } from "../services/dbTypes";

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
        target_ratio: null,
        target_cap: null,
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
        targetRatio: undefined,
        targetCap: undefined,
      });
    });

    it("convertit correctement un compte épargne avec ratio et cap", () => {
      const dbAccount: DbAccount = {
        id: "acc-2",
        name: "Livret A",
        type: "SAVINGS",
        owner_id: "person-2",
        current_balance: 5000,
        bank_name: null,
        is_joint: true,
        target_ratio: 0.15,
        target_cap: 10000,
      };

      const result = mapDbAccount(dbAccount);

      expect(result.type).toBe("SAVINGS");
      expect(result.isJoint).toBe(true);
      expect(result.targetRatio).toBe(0.15);
      expect(result.targetCap).toBe(10000);
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
        target_ratio: null,
        target_cap: null,
      };

      const result = mapDbAccount(dbAccount);
      expect(result.currentBalance).toBe(0);
    });
  });

  describe("mapDbTag", () => {
    it("convertit correctement un tag", () => {
      const dbTag: DbTag = {
        id: "tag-1",
        name: "Alimentation",
        color: "#FF5733",
      };

      const result = mapDbTag(dbTag);

      expect(result).toEqual({
        id: "tag-1",
        name: "Alimentation",
        color: "#FF5733",
      });
    });
  });

  describe("mapDbTagAmount", () => {
    it("convertit un TagAmount standard", () => {
      const dbTagAmount: DbPaidItemTag = {
        id: "tag-amount-1",
        paid_item_instance_id: "item-1",
        tag_id: "tag-1",
        amount: 50.5,
        is_extra: false,
        created_at: "2025-12-01T00:00:00Z",
      };

      const result = mapDbTagAmount(dbTagAmount);

      expect(result).toEqual({
        tagId: "tag-1",
        amount: 50.5,
        isExtra: false,
      });
    });

    it("convertit un TagAmount Extra", () => {
      const dbTagAmount: DbPaidItemTag = {
        id: "tag-amount-2",
        paid_item_instance_id: "item-2",
        tag_id: "tag-2",
        amount: 120,
        is_extra: true,
        created_at: "2025-12-01T00:00:00Z",
      };

      const result = mapDbTagAmount(dbTagAmount);

      expect(result.isExtra).toBe(true);
      expect(result.amount).toBe(120);
    });

    it("convertit amount en Number", () => {
      const dbTagAmount: DbPaidItemTag = {
        paid_item_id: "item-3",
        tag_id: "tag-3",
        amount: "75.25", // Type peut être string en DB
        is_extra: false,
      } as any;

      const result = mapDbTagAmount(dbTagAmount);
      expect(result.amount).toBe(75.25);
      expect(typeof result.amount).toBe("number");
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
      expect(result.subCategory).toBeNull();
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
        beneficiary_id: "person-1",
        label: "Loyer Février",
        category: "Logement",
        sub_category: "Loyer",
        type: "EXPENSE",
        is_variable: false,
        is_waiting: false,
        is_extra: false,
        comments: "Paiement OK",
      };

      const result = mapDbPaidItem(dbItem);

      expect(result).toEqual({
        instanceId: "exp-1-2026-02",
        amount: 800,
        paymentDate: "2026-02-05",
        accountId: "acc-1",
        beneficiaryId: "person-1",
        label: "Loyer Février",
        category: "Logement",
        subCategory: "Loyer",
        type: "EXPENSE",
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
        beneficiary_id: "person-1",
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
        beneficiary_id: "person-1",
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
        monthly_envelope: 2500,
        period_type: "CUSTOM_SPLIT",
        period_value: 4,
        carryover_strategy: "SPREAD_REMAINING",
        operations_sorting: ["exp-1", "exp-2", "inc-1"],
        accounts_sorting: ["acc-1", "acc-2"],
      };

      const result = mapDbSettings(dbSettings);

      expect(result).toEqual({
        monthly_envelope: 2500,
        period_type: "CUSTOM_SPLIT",
        period_value: 4,
        carryover_strategy: "SPREAD_REMAINING",
        operations_sorting: ["exp-1", "exp-2", "inc-1"],
        accounts_sorting: ["acc-1", "acc-2"],
      });
    });

    it("retourne les valeurs par défaut si data est null", () => {
      const result = mapDbSettings(null);

      expect(result).toEqual({
        monthly_envelope: 2000,
        period_type: "FIXED_DAYS",
        period_value: 7,
        carryover_strategy: "NEXT_PERIOD",
        operations_sorting: [],
        accounts_sorting: [],
      });
    });

    it("gère les champs null avec valeurs par défaut", () => {
      const dbSettings: DbSettings = {
        id: "1",
        monthly_envelope: null,
        period_type: null,
        period_value: null,
        carryover_strategy: null,
        operations_sorting: null,
        accounts_sorting: null,
      };

      const result = mapDbSettings(dbSettings);

      expect(result.monthly_envelope).toBe(2000);
      expect(result.period_type).toBe("FIXED_DAYS");
      expect(result.period_value).toBe(7);
      expect(result.carryover_strategy).toBe("NEXT_PERIOD");
      expect(result.operations_sorting).toEqual([]);
    });

    it("convertit les valeurs numériques correctement", () => {
      const dbSettings: DbSettings = {
        id: 1,
        monthly_envelope: "3000", // Peut arriver en string
        period_type: "CALENDAR_WEEKS",
        period_value: "7", // Peut arriver en string
        carryover_strategy: "NEXT_PERIOD",
        operations_sorting: [],
        accounts_sorting: [],
      } as any;

      const result = mapDbSettings(dbSettings);

      expect(result.monthly_envelope).toBe(3000);
      expect(typeof result.monthly_envelope).toBe("number");
      expect(result.period_value).toBe(7);
      expect(typeof result.period_value).toBe("number");
    });
  });
});
