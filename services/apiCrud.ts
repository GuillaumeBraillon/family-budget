import { supabase } from "./supabase";
import { logger } from "./logger";
import {
  Person,
  Account,
  CategoryDef,
  ExpenseConfig,
  IncomeConfig,
  PaidItemDetails,
  AppSettings,
  Transfer,
  VariableTransaction,
  SavedLabel,
  Tag,
  AuthorizedUser,
} from "../types";

/**
 * Opérations sur les Utilisateurs Autorisés
 */
export const apiToggleUserAuthorization = async (email: string, isAllowed: boolean) => {
  logger.log("📡 API: Mise à jour autorisation", { email, isAllowed });

  // Si on autorise quelqu'un, on enregistre qui l'a autorisé
  if (isAllowed) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const result = await supabase
      .from("authorized_users")
      .update({
        is_allowed: isAllowed,
        added_by: user?.email || null,
      })
      .eq("email", email);
    logger.log("📡 API: Résultat", result);
    return result;
  }

  // Si on révoque, on met juste à jour is_allowed
  const result = await supabase.from("authorized_users").update({ is_allowed: isAllowed }).eq("email", email);
  logger.log("📡 API: Résultat", result);
  return result;
};

export const apiUpdateUserNotes = async (email: string, notes: string) => supabase.from("authorized_users").update({ notes }).eq("email", email);

export const apiDeleteAuthorizedUser = async (email: string) => supabase.from("authorized_users").delete().eq("email", email);

/**
 * Opérations sur les Tags
 */
export const apiUpsertTag = async (tag: Tag) => supabase.from("tags").upsert({ id: tag.id, name: tag.name, color: tag.color });

export const apiDeleteTag = async (id: string) => supabase.from("tags").delete().eq("id", id);

/**
 * Opérations sur les Membres (People)
 */
export const apiUpsertPerson = async (person: Person) => supabase.from("people").upsert({ id: person.id, name: person.name, is_child: person.isChild });

export const apiDeletePerson = async (id: string) => supabase.from("people").delete().eq("id", id);

/**
 * Opérations sur les Comptes (Accounts)
 */
export const apiUpsertAccount = async (account: Account) =>
  supabase.from("accounts").upsert({
    id: account.id,
    name: account.name,
    type: account.type,
    owner_id: account.ownerId,
    current_balance: account.currentBalance,
    bank_name: account.bankName || null,
    is_joint: !!account.isJoint,
    target_ratio: account.targetRatio !== undefined ? account.targetRatio : null,
    target_cap: account.targetCap !== undefined ? account.targetCap : null,
  });

export const apiDeleteAccount = async (id: string) => supabase.from("accounts").delete().eq("id", id);

/**
 * Opérations sur les Catégories
 */
export const apiUpsertCategory = async (categoryOrList: CategoryDef | CategoryDef[]) => {
  const payload = Array.isArray(categoryOrList)
    ? categoryOrList.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        sub_categories: c.subCategories,
      }))
    : {
        id: categoryOrList.id,
        name: categoryOrList.name,
        type: categoryOrList.type,
        sub_categories: categoryOrList.subCategories,
      };

  return supabase.from("categories").upsert(payload);
};

export const apiDeleteCategory = async (id: string) => supabase.from("categories").delete().eq("id", id);

/**
 * Opérations sur les Libellés Sauvegardés (Saved Labels)
 */
export const apiUpsertLabel = async (label: SavedLabel) =>
  supabase.from("saved_labels").upsert({
    id: label.id,
    name: label.name,
    type: label.type,
    is_expense: label.isExpense,
  });

export const apiDeleteLabel = async (id: string) => supabase.from("saved_labels").delete().eq("id", id);

export const apiImportLabels = async () => {
  const { data: items, error: fetchError } = await supabase.from("paid_items").select("label").ilike("label", "CB %");

  if (fetchError) return { error: fetchError };

  const { data: existing, error: existError } = await supabase.from("saved_labels").select("name");

  if (existError) return { error: existError };

  const existingSet = new Set(existing?.map((e) => e.name));
  const distinctLabels = [...new Set(items?.map((i) => i.label))];

  const toInsert = distinctLabels
    .filter((l) => l && !existingSet.has(l))
    .map((l) => ({
      id: `lbl_imp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: l,
      type: "COURANT",
      is_expense: true,
    }));

  if (toInsert.length === 0) return { count: 0 };

  const { error: insertError } = await supabase.from("saved_labels").insert(toInsert);

  return { error: insertError, count: toInsert.length };
};

export const apiImportVirLabels = async () => {
  const { data: items, error: fetchError } = await supabase.from("paid_items").select("label").ilike("label", "VIR %");

  if (fetchError) return { error: fetchError };

  const { data: existing, error: existError } = await supabase.from("saved_labels").select("name");

  if (existError) return { error: existError };

  const existingSet = new Set(existing?.map((e) => e.name));
  const distinctLabels = [...new Set(items?.map((i) => i.label))];

  const toInsert = distinctLabels
    .filter((l) => l && !existingSet.has(l))
    .map((l) => ({
      id: `lbl_vir_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: l,
      type: "COURANT",
      is_expense: false,
    }));

  if (toInsert.length === 0) return { count: 0 };

  const { error: insertError } = await supabase.from("saved_labels").insert(toInsert);

  return { error: insertError, count: toInsert.length };
};

/**
 * Opérations sur les Paramètres (Settings)
 */
export const apiUpdateSettings = async (settings: AppSettings) =>
  supabase.from("app_settings").upsert({
    id: "global",
    monthly_envelope: Number(settings.monthly_envelope),
    period_type: settings.period_type,
    period_value: Math.floor(Number(settings.period_value)),
  });

/**
 * Opérations sur les Modèles de Dépenses (ExpenseConfigs)
 */
export const apiUpsertConfig = async (config: ExpenseConfig) =>
  supabase.from("expense_configs").upsert({
    id: config.id,
    label: config.label,
    amount: config.amount,
    category: config.category,
    sub_category: config.subCategory,
    beneficiary_id: config.beneficiaryId,
    account_id: config.accountId,
    day_of_month: config.dayOfMonth,
    start_month: config.startMonth,
    end_month: config.endMonth,
    is_extra: config.isExtra,
    tag_ids: config.tagIds || [],
  });

export const apiDeleteConfig = async (id: string) => supabase.from("expense_configs").delete().eq("id", id);

/**
 * Opérations sur les Modèles de Revenus (IncomeConfigs)
 */
export const apiUpsertIncome = async (income: IncomeConfig) =>
  supabase.from("income_configs").upsert({
    id: income.id,
    label: income.label,
    amount: income.amount,
    account_id: income.accountId,
    beneficiary_id: income.beneficiaryId,
    day_of_month: income.dayOfMonth,
    category: income.category,
    sub_category: income.subCategory,
    is_extra: income.isExtra,
    is_salary: income.isSalary,
    start_month: income.startMonth,
    end_month: income.endMonth,
    tag_ids: income.tagIds || [],
  });

export const apiDeleteIncome = async (id: string) => supabase.from("income_configs").delete().eq("id", id);

/**
 * Opérations sur le Pointage (PaidItems)
 */
export const apiSetPaidStatus = async (details: PaidItemDetails | null, instanceId: string) => {
  if (details) {
    return supabase.from("paid_items").upsert({
      instance_id: details.instanceId,
      amount: details.amount,
      payment_date: details.paymentDate,
      account_id: details.accountId,
      beneficiary_id: details.beneficiaryId,
      label: details.label,
      category: details.category,
      sub_category: details.subCategory,
      type: details.type,
      is_variable: !!details.isVariable,
      is_waiting: !!details.isWaiting, // False si pointé
      is_extra: !!details.isExtra,
      comments: details.comments || null,
      tag_ids: details.tagIds || [],
      position: details.position,
    });
  } else {
    return supabase.from("paid_items").delete().eq("instance_id", instanceId);
  }
};

/**
 * Opérations sur les Virements (Transfers)
 */
export const apiUpsertTransfer = async (t: Transfer) =>
  supabase.from("transfers").upsert({
    id: t.id,
    date: t.date,
    label: t.label,
    amount: t.amount,
    source_account_id: t.sourceAccountId,
    destination_account_id: t.destinationAccountId,
    position: t.position,
  });

export const apiDeleteTransfer = async (id: string) => supabase.from("transfers").delete().eq("id", id);

/**
 * Opérations sur les Transactions Variables (Suivi Réel)
 */
export const apiUpsertVariableTransaction = async (tx: VariableTransaction) =>
  supabase.from("paid_items").upsert({
    instance_id: tx.id,
    payment_date: tx.date,
    label: tx.label,
    amount: tx.amount,
    category: tx.category,
    sub_category: tx.subCategory || null,
    account_id: tx.accountId,
    beneficiary_id: tx.beneficiaryId || null,
    type: tx.type,
    is_variable: true,
    is_waiting: !!tx.isWaiting,
    is_extra: !!tx.isExtra,
    comments: tx.comments || null,
    tag_ids: tx.tagIds || [],
    position: tx.position,
  });

export const apiDeleteVariableTransaction = async (id: string) => supabase.from("paid_items").delete().eq("instance_id", id);
