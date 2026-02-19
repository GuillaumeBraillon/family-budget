import { supabase, isSupabaseConfigured } from "./supabase";
import * as mappers from "./apiMappers";
import { AppSettings, VariableTransaction, TagAmount, PaidItemDetails } from "../types";
import { DbPaidItem, DbPaidItemTag } from "./dbTypes";
import { logger } from "./logger";
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
  apiUpsertTag,
  apiDeleteTag,
} from "./apiCrud";

/**
 * Orchestrateur de données : Récupère l'intégralité du contexte applicatif au démarrage.
 * Délègue la conversion des données brutes aux fonctions de mapping.
 */
export const fetchInitialData = async () => {
  logger.debug("api", "Début fetchInitialData");

  // PROTECTION : Si Supabase n'est pas configuré (ou placeholder), on ne lance pas les requêtes
  if (!isSupabaseConfigured()) {
    return {
      people: [],
      accounts: [],
      categories: [],
      configs: [],
      incomeConfigs: [],
      paidItems: {},
      settings: { monthly_envelope: 2000, period_type: "FIXED_DAYS", period_value: 7 } as AppSettings,
      transfers: [],
      variableTransactions: [],
      savedLabels: [],
      tags: [],
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
    tagsRes,
    authUsersRes,
  ] = await Promise.all([
    supabase.from("people").select("id, name, is_child, display_order"),
    supabase.from("accounts").select("id, name, type, owner_id, current_balance, bank_name, is_joint, target_ratio, target_cap"),
    supabase.from("categories").select("id, name, type"),
    supabase.from("sub_categories").select("id, name, category_id, created_at"),
    supabase
      .from("expense_configs")
      .select("id, label, amount, category, sub_category, beneficiary_id, account_id, day_of_month, start_month, end_month, is_extra"),
    supabase
      .from("income_configs")
      .select("id, label, amount, account_id, beneficiary_id, day_of_month, category, sub_category, is_extra, is_salary, start_month, end_month"),
    supabase
      .from("paid_items")
      .select(
        "instance_id, amount, payment_date, account_id, beneficiary_id, label, category, sub_category, type, is_variable, is_waiting, is_extra, comments"
      ),
    supabase
      .from("app_settings")
      .select("id, monthly_envelope, period_type, period_value, carryover_strategy, operations_sorting, accounts_sorting")
      .maybeSingle(),
    supabase
      .from("transfers")
      .select("id, date, label, amount, source_account_id, destination_account_id, created_at, is_interest")
      .order("date", { ascending: false }),
    supabase.from("saved_labels").select("id, name, type, is_expense, category_id, sub_category_id, account_id, beneficiary_id"),
    supabase.from("tags").select("id, name, color"),
    supabase.from("authorized_users").select("email, name, avatar_url, is_allowed, added_at, added_by").order("added_at", { ascending: false }),
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
    tagsRes,
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
  const tags = (tagsRes.data || []).map(mappers.mapDbTag);
  const authorizedUsers = (authUsersRes.data || []).map(mappers.mapDbAuthorizedUser);

  // Optimisation payload: charger uniquement les tags des paid_items réellement récupérés
  const paidItemInstanceIds = Array.from(new Set((paidItemsRes.data || []).map((item: DbPaidItem) => item.instance_id)));
  let paidItemTagsData: DbPaidItemTag[] = [];
  if (paidItemInstanceIds.length > 0) {
    const { data: tagData, error: tagError } = await supabase
      .from("paid_item_tags")
      .select("id, paid_item_instance_id, tag_id, amount, is_extra, created_at")
      .in("paid_item_instance_id", paidItemInstanceIds);

    if (tagError) {
      throw new Error(tagError.message || "Erreur lors du chargement des tags des opérations");
    }

    paidItemTagsData = tagData || [];
  }

  // Grouper les tag amounts par instance_id
  const tagAmountsByInstance: Record<string, TagAmount[]> = {};
  paidItemTagsData.forEach((ta: DbPaidItemTag) => {
    if (!tagAmountsByInstance[ta.paid_item_instance_id]) {
      tagAmountsByInstance[ta.paid_item_instance_id] = [];
    }
    tagAmountsByInstance[ta.paid_item_instance_id].push(mappers.mapDbTagAmount(ta));
  });

  const paidItems: Record<string, PaidItemDetails> = {};
  const variableTransactions: VariableTransaction[] = [];

  (paidItemsRes.data || []).forEach((item: DbPaidItem) => {
    const mapped = mappers.mapDbPaidItem(item);
    // Ajouter les tagAmounts s'ils existent
    if (tagAmountsByInstance[item.instance_id]) {
      mapped.tagAmounts = tagAmountsByInstance[item.instance_id];
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
        beneficiaryId: mapped.beneficiaryId,
        type: mapped.type,
        isWaiting: mapped.isWaiting,
        isExtra: mapped.isExtra,
        comments: mapped.comments,
        tagAmounts: mapped.tagAmounts,
      });
    }
  });

  logger.debug("api", "fetchInitialData terminé", {
    people: people.length,
    accounts: accounts.length,
    configs: configs.length,
    paidItems: Object.keys(paidItems).length,
    authorizedUsers: authorizedUsers.length,
  });

  return { people, accounts, categories, configs, incomeConfigs, paidItems, settings, transfers, variableTransactions, savedLabels, tags, authorizedUsers };
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
  apiUpsertTag,
  apiDeleteTag,
};
