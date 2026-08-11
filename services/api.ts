import { supabase, isSupabaseConfigured } from "./supabase";
import * as mappers from "./apiMappers";
import { AppSettings, VariableTransaction, PaidItemDetails, BeneficiaryAmount } from "../types";
import { DbPaidItem, DbPaidItemBeneficiary } from "./dbTypes";
import {
  apiToggleUserAuthorization,
  apiUpdateUserNotes,
  apiDeleteAuthorizedUser,
  apiUpsertPerson,
  apiDeletePerson,
  apiUpsertAccount,
  apiDeleteAccount,
  apiUpsertCategory,
  apiDeleteCategory,
  apiUpdateSettings,
  apiUpsertConfig,
  apiDeleteConfig,
  apiUpsertIncome,
  apiDeleteIncome,
  apiSetPaidStatus,
  apiUpsertTransfer,
  apiDeleteTransfer,
  apiUpsertVariableTransaction,
  apiDeleteVariableTransaction,
  apiUpsertLabel,
  apiDeleteLabel,
  apiImportLabels,
  apiImportVirLabels,
} from "./apiCrud";

// PostgREST plafonne silencieusement chaque requête à ce nombre de lignes (défaut Supabase).
const SUPABASE_MAX_ROWS = 1000;

/**
 * Récupère toutes les lignes d'une table en paginant par blocs de SUPABASE_MAX_ROWS,
 * pour éviter la troncature silencieuse au-delà de la limite par requête de PostgREST.
 */
async function fetchAllRows<T>(
  buildQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<{ data: T[]; error: { message: string } | null }> {
  const allRows: T[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await buildQuery(from, from + SUPABASE_MAX_ROWS - 1);
    if (error) return { data: allRows, error };
    allRows.push(...(data || []));
    if (!data || data.length < SUPABASE_MAX_ROWS) break;
    from += SUPABASE_MAX_ROWS;
  }
  return { data: allRows, error: null };
}

/**
 * Orchestrateur de données : Récupère l'intégralité du contexte applicatif au démarrage.
 * Délègue la conversion des données brutes aux fonctions de mapping.
 */
export const fetchInitialData = async () => {
  // PROTECTION : Si Supabase n'est pas configuré (ou placeholder), on ne lance pas les requêtes
  if (!isSupabaseConfigured()) {
    return {
      people: [],
      accounts: [],
      categories: [],
      configs: [],
      incomeConfigs: [],
      paidItems: {},
      settings: { personal_budget_amount: 350, family_variable_budget: 0, period_type: "FIXED_DAYS", period_value: 7 } as AppSettings,
      transfers: [],
      variableTransactions: [],
      savedLabels: [],
    };
  }

  const [
    peopleRes,
    accountsRes,
    categoriesRes,
    subCategoriesRes,
    configsRes,
    incomesRes,
    paidItemsRes,
    settingsRes,
    transfersRes,
    savedLabelsRes,
    authUsersRes,
  ] = await Promise.all([
    supabase.from("people").select("id, name, is_child, display_order"),
    supabase.from("accounts").select("id, name, type, owner_id, current_balance, bank_name, is_joint"),
    supabase.from("categories").select("id, name, type"),
    supabase.from("sub_categories").select("id, name, category_id, created_at"),
    supabase
      .from("expense_configs")
      .select("id, label, amount, category, sub_category, beneficiary_id, account_id, day_of_month, start_month, end_month, is_extra"),
    supabase
      .from("income_configs")
      .select("id, label, amount, account_id, beneficiary_id, day_of_month, category, sub_category, is_extra, is_salary, start_month, end_month"),
    fetchAllRows<DbPaidItem>((from, to) =>
      supabase
        .from("paid_items")
        .select(
          "instance_id, amount, payment_date, account_id, label, category, sub_category, type, is_variable, is_waiting, is_extra, is_refund, is_salary, comments"
        )
        .order("instance_id", { ascending: true })
        .range(from, to)
    ),
    supabase
      .from("app_settings")
      .select("id, personal_budget_amount, family_variable_budget, period_type, period_value, operations_sorting, accounts_sorting")
      .maybeSingle(),
    fetchAllRows((from, to) =>
      supabase
        .from("transfers")
        .select("id, date, label, amount, source_account_id, destination_account_id, created_at, is_interest")
        .order("date", { ascending: false })
        .order("id", { ascending: true })
        .range(from, to)
    ),
    supabase.from("saved_labels").select("id, name, type, is_expense, category_id, sub_category_id, account_id, beneficiary_id"),
    supabase
      .from("authorized_users")
      .select("email, name, avatar_url, is_allowed, added_at, added_by, last_login_at, notes, is_admin")
      .order("added_at", { ascending: false }),
  ]);

  const responses = [
    peopleRes,
    accountsRes,
    categoriesRes,
    subCategoriesRes,
    configsRes,
    incomesRes,
    paidItemsRes,
    settingsRes,
    transfersRes,
    savedLabelsRes,
    authUsersRes,
  ];
  const errors = responses.map((r) => r.error).filter((e) => e !== null);

  if (errors.length > 0) {
    throw new Error(errors[0]?.message || "Erreur lors du chargement des données.");
  }

  const people = (peopleRes.data || []).map(mappers.mapDbPerson);
  const accounts = (accountsRes.data || []).map(mappers.mapDbAccount);
  const subCategories = subCategoriesRes.data || [];
  const categories = (categoriesRes.data || []).map((cat) => mappers.mapDbCategory(cat, subCategories));
  const configs = (configsRes.data || []).map(mappers.mapDbExpenseConfig);
  const incomeConfigs = (incomesRes.data || []).map(mappers.mapDbIncomeConfig);
  const settings = mappers.mapDbSettings(settingsRes.data);
  const transfers = (transfersRes.data || []).map(mappers.mapDbTransfer);
  const savedLabels = (savedLabelsRes.data || []).map(mappers.mapDbSavedLabel);
  const authorizedUsers = (authUsersRes.data || []).map(mappers.mapDbAuthorizedUser);

  const paidItemInstanceIds = Array.from(new Set((paidItemsRes.data || []).map((item: DbPaidItem) => item.instance_id)));
  let paidItemBeneficiariesData: DbPaidItemBeneficiary[] = [];
  if (paidItemInstanceIds.length > 0) {
    const { data: beneficiaryData, error: beneficiaryError } = await fetchAllRows<DbPaidItemBeneficiary>((from, to) =>
      supabase
        .from("paid_item_beneficiaries")
        .select("id, paid_item_instance_id, beneficiary_id, amount, created_at")
        .order("id", { ascending: true })
        .range(from, to)
    );

    if (beneficiaryError) {
      throw new Error(beneficiaryError.message || "Erreur lors du chargement de la ventilation des bénéficiaires");
    }

    paidItemBeneficiariesData = beneficiaryData || [];
  }

  const beneficiaryAmountsByInstance: Record<string, BeneficiaryAmount[]> = {};
  paidItemBeneficiariesData.forEach((beneficiaryAmount: DbPaidItemBeneficiary) => {
    if (!beneficiaryAmountsByInstance[beneficiaryAmount.paid_item_instance_id]) {
      beneficiaryAmountsByInstance[beneficiaryAmount.paid_item_instance_id] = [];
    }
    beneficiaryAmountsByInstance[beneficiaryAmount.paid_item_instance_id].push(mappers.mapDbBeneficiaryAmount(beneficiaryAmount));
  });

  const paidItems: Record<string, PaidItemDetails> = {};
  const variableTransactions: VariableTransaction[] = [];

  (paidItemsRes.data || []).forEach((item: DbPaidItem) => {
    const mapped = mappers.mapDbPaidItem(item);
    if (beneficiaryAmountsByInstance[item.instance_id]) {
      mapped.beneficiaryAmounts = beneficiaryAmountsByInstance[item.instance_id];
    }
    paidItems[item.instance_id] = mapped;

    // Si c'est une opération VARIABLE (is_variable = true)
    if (mapped.isVariable) {
      variableTransactions.push({
        id: mapped.instanceId,
        date: mapped.paymentDate,
        label: mapped.label,
        amount: mapped.amount,
        category: mapped.category,
        subCategory: mapped.subCategory,
        accountId: mapped.accountId,
        beneficiaryId: mapped.beneficiaryAmounts?.[0]?.beneficiaryId,
        beneficiaryAmounts: mapped.beneficiaryAmounts,
        type: mapped.type,
        isRefund: !!mapped.isRefund,
        isSalary: !!mapped.isSalary,
        isWaiting: mapped.isWaiting,
        isExtra: mapped.isExtra,
        comments: mapped.comments,
      });
    }
  });

  return { people, accounts, categories, configs, incomeConfigs, paidItems, settings, transfers, variableTransactions, savedLabels, authorizedUsers };
};

// Ré-exports explicites
export {
  apiToggleUserAuthorization,
  apiUpdateUserNotes,
  apiDeleteAuthorizedUser,
  apiUpsertPerson,
  apiDeletePerson,
  apiUpsertAccount,
  apiDeleteAccount,
  apiUpsertCategory,
  apiDeleteCategory,
  apiUpdateSettings,
  apiUpsertConfig,
  apiDeleteConfig,
  apiUpsertIncome,
  apiDeleteIncome,
  apiSetPaidStatus,
  apiUpsertTransfer,
  apiDeleteTransfer,
  apiUpsertVariableTransaction,
  apiDeleteVariableTransaction,
  apiUpsertLabel,
  apiDeleteLabel,
  apiImportLabels,
  apiImportVirLabels,
};
