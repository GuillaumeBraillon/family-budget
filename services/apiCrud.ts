/**
 * @file Opérations CRUD pour toutes les entités budgétaires
 * @description Centralise tous les appels API Supabase avec conversion automatique
 * des données (camelCase → snake_case). Chaque fonction retourne un objet
 * `{ data, error }` conforme à l'API Supabase.
 *
 * **Responsabilités :**
 * - Conversion des données applicatives vers format DB
 * - Exécution des requêtes Supabase (INSERT, UPDATE, DELETE)
 * - Gestion spéciale des relations (ex: `paid_item_tags` avec CASCADE)
 * - Retour des résultats bruts (mapping fait par apiMappers)
 *
 * **Gestion des tags :**
 * Les `tagAmounts` sont stockés dans une table séparée (`paid_item_tags`)
 * avec foreign key CASCADE. La suppression d'un `paid_item` supprime
 * automatiquement ses tags associés.
 *
 * @dependencies
 * - services/supabase : Instance client Supabase configurée
 * - services/logger : Traçage des opérations pour debug
 * - types.ts : Types applicatifs pour les paramètres
 */
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
  TagAmount,
  BeneficiaryAmount,
} from "../types";

const normalizeTagAmountsForRpc = (tagAmounts: TagAmount[] | undefined): TagAmount[] | null => {
  if (tagAmounts === undefined) return null;

  return tagAmounts
    .filter((tagAmount) => Boolean(tagAmount.tagId) && Number.isFinite(tagAmount.amount) && tagAmount.amount > 0)
    .map((tagAmount) => ({
      tagId: tagAmount.tagId,
      amount: tagAmount.amount,
      isExtra: !!tagAmount.isExtra,
    }));
};

const normalizeBeneficiaryAmountsForRpc = (beneficiaryAmounts: BeneficiaryAmount[] | undefined): BeneficiaryAmount[] | null => {
  if (beneficiaryAmounts === undefined) return null;

  return beneficiaryAmounts
    .filter((beneficiaryAmount) => Boolean(beneficiaryAmount.beneficiaryId) && Number.isFinite(beneficiaryAmount.amount) && beneficiaryAmount.amount > 0)
    .map((beneficiaryAmount) => ({
      beneficiaryId: beneficiaryAmount.beneficiaryId,
      amount: beneficiaryAmount.amount,
    }));
};

const normalizePaidItemForRpc = (amount: number, type: "EXPENSE" | "INCOME") => {
  const normalizedAmount = Math.abs(Number(amount));
  const normalizedType = amount < 0 && type === "EXPENSE" ? "INCOME" : type;

  return {
    amount: normalizedAmount,
    type: normalizedType,
  };
};

const validatePaidItemForRpc = (payload: { instanceId: string; amount: number; paymentDate: string; accountId: string; label: string; category: string }) => {
  if (!payload.instanceId?.trim()) {
    throw new Error("Instance ID manquant pour l'enregistrement de l'opération.");
  }
  if (!Number.isFinite(payload.amount) || payload.amount <= 0) {
    throw new Error("Le montant doit être strictement supérieur à 0.");
  }
  if (!payload.paymentDate?.trim()) {
    throw new Error("La date de paiement est obligatoire.");
  }
  if (!payload.accountId?.trim()) {
    throw new Error("Le compte est obligatoire.");
  }
  if (!payload.label?.trim()) {
    throw new Error("Le libellé est obligatoire.");
  }
  if (!payload.category?.trim()) {
    throw new Error("La catégorie est obligatoire.");
  }
};

const formatSupabaseError = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return { message: String(error) };
  }

  const candidate = error as {
    message?: string;
    details?: string;
    hint?: string;
    code?: string;
  };

  return {
    message: candidate.message || "Erreur Supabase inconnue",
    details: candidate.details,
    hint: candidate.hint,
    code: candidate.code,
  };
};

/**
 * Opérations sur les Utilisateurs Autorisés
 */
export const apiToggleUserAuthorization = async (email: string, isAllowed: boolean) => {
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
    return result;
  }

  // Si on révoque, on met juste à jour is_allowed
  const result = await supabase.from("authorized_users").update({ is_allowed: isAllowed }).eq("email", email);
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
export const apiUpsertPerson = async (person: Person) =>
  supabase.from("people").upsert({ id: person.id, name: person.name, is_child: person.isChild, display_order: person.displayOrder });

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
  });

export const apiDeleteAccount = async (id: string) => supabase.from("accounts").delete().eq("id", id);

/**
 * Opérations sur les Catégories
 */
export const apiUpsertCategory = async (categoryOrList: CategoryDef | CategoryDef[]) => {
  const categories = Array.isArray(categoryOrList) ? categoryOrList : [categoryOrList];

  // Pour chaque catégorie, on doit :
  // 1. Upsert la catégorie elle-même (sans sub_categories)
  // 2. Gérer les sous-catégories dans la table séparée

  for (const category of categories) {
    // 1. Upsert la catégorie
    const categoryPayload = {
      id: category.id,
      name: category.name,
      type: category.type,
    };

    const { error: catError } = await supabase.from("categories").upsert(categoryPayload);
    if (catError) return { error: catError };

    // 2. Gérer les sous-catégories
    if (category.subCategories && category.subCategories.length > 0) {
      // Supprimer les anciennes sous-catégories
      await supabase.from("sub_categories").delete().eq("category_id", category.id);

      // Insérer les nouvelles
      const subCategoriesPayload = category.subCategories.map((sc) => ({
        id: sc.id,
        name: sc.name,
        category_id: category.id,
      }));

      const { error: subError } = await supabase.from("sub_categories").insert(subCategoriesPayload);
      if (subError) return { error: subError };
    }
  }

  return { data: null, error: null };
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
    category_id: label.categoryId,
    sub_category_id: label.subCategoryId,
    account_id: label.accountId,
    beneficiary_id: label.beneficiaryId,
  });

export const apiDeleteLabel = async (id: string) => supabase.from("saved_labels").delete().eq("id", id);

export const apiImportLabels = async () => {
  // Récupérer tous les paid_items CB avec leurs catégories ET comptes
  const { data: rawItems, error: fetchError } = await supabase
    .from("paid_items")
    .select("instance_id, label, category, sub_category, account_id")
    .ilike("label", "CB%");

  if (fetchError) return { error: fetchError };

  const items = (rawItems || []).filter((item) => (item.label || "").toUpperCase().startsWith("CB "));
  const instanceIds = Array.from(new Set(items.map((item) => item.instance_id).filter(Boolean)));

  let primaryBeneficiaryByInstance: Record<string, string> = {};
  if (instanceIds.length > 0) {
    const { data: beneficiaryRows, error: beneficiaryError } = await supabase
      .from("paid_item_beneficiaries")
      .select("paid_item_instance_id, beneficiary_id, amount")
      .in("paid_item_instance_id", instanceIds);

    if (beneficiaryError) return { error: beneficiaryError };

    const bestByInstance: Record<string, { beneficiaryId: string; amount: number }> = {};
    (beneficiaryRows || []).forEach((row) => {
      const current = bestByInstance[row.paid_item_instance_id];
      const amount = Number(row.amount || 0);
      if (!current || amount > current.amount) {
        bestByInstance[row.paid_item_instance_id] = {
          beneficiaryId: row.beneficiary_id,
          amount,
        };
      }
    });

    primaryBeneficiaryByInstance = Object.fromEntries(Object.entries(bestByInstance).map(([instanceId, value]) => [instanceId, value.beneficiaryId]));
  }

  const { data: existing, error: existError } = await supabase.from("saved_labels").select("name");

  if (existError) return { error: existError };

  // Récupérer toutes les catégories pour résoudre les IDs
  const { data: categories, error: catError } = await supabase.from("categories").select("id, name");
  if (catError) return { error: catError };

  const { data: subCategories, error: subCatError } = await supabase.from("sub_categories").select("id, name, category_id");
  if (subCatError) return { error: subCatError };

  const existingSet = new Set(existing?.map((e) => e.name));

  // Grouper par libellé et compter les occurrences de chaque catégorie ET compte
  const labelStats: Record<
    string,
    Record<
      string,
      {
        count: number;
        subCategory?: string;
        accountId?: string;
        beneficiaryId?: string;
      }
    >
  > = {};

  items?.forEach((item) => {
    if (!item.label) return;
    if (!labelStats[item.label]) labelStats[item.label] = {};
    const beneficiaryId = primaryBeneficiaryByInstance[item.instance_id] || "";
    const key = `${item.category}|${item.sub_category || ""}|${item.account_id || ""}|${beneficiaryId}`;
    if (!labelStats[item.label][key]) {
      labelStats[item.label][key] = {
        count: 0,
        subCategory: item.sub_category,
        accountId: item.account_id,
        beneficiaryId: beneficiaryId || undefined,
      };
    }
    labelStats[item.label][key].count++;
  });

  const toInsert = Object.keys(labelStats)
    .filter((label) => label && !existingSet.has(label))
    .map((label) => {
      // Trouver la combinaison la plus fréquente pour ce libellé
      const stats = labelStats[label];
      let maxCount = 0;
      let mostFrequentCategory = "";
      let mostFrequentSubCategory = "";
      let mostFrequentAccountId: string | undefined;
      let mostFrequentBeneficiaryId: string | undefined;

      Object.entries(stats).forEach(([key, data]) => {
        if (data.count > maxCount) {
          maxCount = data.count;
          const [cat, sub] = key.split("|");
          mostFrequentCategory = cat;
          mostFrequentSubCategory = sub;
          mostFrequentAccountId = data.accountId;
          mostFrequentBeneficiaryId = data.beneficiaryId;
        }
      });

      // Résoudre les IDs à partir des noms
      const categoryId = categories?.find((c) => c.name === mostFrequentCategory)?.id;
      const subCategoryId = mostFrequentSubCategory
        ? subCategories?.find((sc) => sc.name === mostFrequentSubCategory && sc.category_id === categoryId)?.id
        : null;

      return {
        id: `lbl_imp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: label,
        type: "COURANT",
        is_expense: true,
        category_id: categoryId || null,
        sub_category_id: subCategoryId || null,
        account_id: mostFrequentAccountId || null,
        beneficiary_id: mostFrequentBeneficiaryId || null,
      };
    });

  if (toInsert.length === 0) return { count: 0 };

  const { error: insertError } = await supabase.from("saved_labels").insert(toInsert);

  return { error: insertError, count: toInsert.length };
};

export const apiImportVirLabels = async () => {
  // Récupérer tous les paid_items VIR avec leurs catégories ET comptes
  const { data: rawItems, error: fetchError } = await supabase
    .from("paid_items")
    .select("instance_id, label, category, sub_category, account_id")
    .ilike("label", "VIR%");

  if (fetchError) return { error: fetchError };

  const items = (rawItems || []).filter((item) => (item.label || "").toUpperCase().startsWith("VIR "));
  const instanceIds = Array.from(new Set(items.map((item) => item.instance_id).filter(Boolean)));

  let primaryBeneficiaryByInstance: Record<string, string> = {};
  if (instanceIds.length > 0) {
    const { data: beneficiaryRows, error: beneficiaryError } = await supabase
      .from("paid_item_beneficiaries")
      .select("paid_item_instance_id, beneficiary_id, amount")
      .in("paid_item_instance_id", instanceIds);

    if (beneficiaryError) return { error: beneficiaryError };

    const bestByInstance: Record<string, { beneficiaryId: string; amount: number }> = {};
    (beneficiaryRows || []).forEach((row) => {
      const current = bestByInstance[row.paid_item_instance_id];
      const amount = Number(row.amount || 0);
      if (!current || amount > current.amount) {
        bestByInstance[row.paid_item_instance_id] = {
          beneficiaryId: row.beneficiary_id,
          amount,
        };
      }
    });

    primaryBeneficiaryByInstance = Object.fromEntries(Object.entries(bestByInstance).map(([instanceId, value]) => [instanceId, value.beneficiaryId]));
  }

  const { data: existing, error: existError } = await supabase.from("saved_labels").select("name");

  if (existError) return { error: existError };

  // Récupérer toutes les catégories pour résoudre les IDs
  const { data: categories, error: catError } = await supabase.from("categories").select("id, name");
  if (catError) return { error: catError };

  const { data: subCategories, error: subCatError } = await supabase.from("sub_categories").select("id, name, category_id");
  if (subCatError) return { error: subCatError };

  const existingSet = new Set(existing?.map((e) => e.name));

  // Grouper par libellé et compter les occurrences de chaque catégorie ET compte
  const labelStats: Record<
    string,
    Record<
      string,
      {
        count: number;
        subCategory?: string;
        accountId?: string;
        beneficiaryId?: string;
      }
    >
  > = {};

  items?.forEach((item) => {
    if (!item.label) return;
    if (!labelStats[item.label]) labelStats[item.label] = {};
    const beneficiaryId = primaryBeneficiaryByInstance[item.instance_id] || "";
    const key = `${item.category}|${item.sub_category || ""}|${item.account_id || ""}|${beneficiaryId}`;
    if (!labelStats[item.label][key]) {
      labelStats[item.label][key] = {
        count: 0,
        subCategory: item.sub_category,
        accountId: item.account_id,
        beneficiaryId: beneficiaryId || undefined,
      };
    }
    labelStats[item.label][key].count++;
  });

  const toInsert = Object.keys(labelStats)
    .filter((label) => label && !existingSet.has(label))
    .map((label) => {
      // Trouver la combinaison la plus fréquente pour ce libellé
      const stats = labelStats[label];
      let maxCount = 0;
      let mostFrequentCategory = "";
      let mostFrequentSubCategory = "";
      let mostFrequentAccountId: string | undefined;
      let mostFrequentBeneficiaryId: string | undefined;

      Object.entries(stats).forEach(([key, data]) => {
        if (data.count > maxCount) {
          maxCount = data.count;
          const [cat, sub] = key.split("|");
          mostFrequentCategory = cat;
          mostFrequentSubCategory = sub;
          mostFrequentAccountId = data.accountId;
          mostFrequentBeneficiaryId = data.beneficiaryId;
        }
      });

      // Résoudre les IDs à partir des noms
      const categoryId = categories?.find((c) => c.name === mostFrequentCategory)?.id;
      const subCategoryId = mostFrequentSubCategory
        ? subCategories?.find((sc) => sc.name === mostFrequentSubCategory && sc.category_id === categoryId)?.id
        : null;

      return {
        id: `lbl_vir_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: label,
        type: "COURANT",
        is_expense: false,
        category_id: categoryId || null,
        sub_category_id: subCategoryId || null,
        account_id: mostFrequentAccountId || null,
        beneficiary_id: mostFrequentBeneficiaryId || null,
      };
    });

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
    personal_budget_amount: Number(settings.personal_budget_amount || 350),
    family_variable_budget: Number(settings.family_variable_budget || 0),
    period_type: settings.period_type,
    period_value: Math.floor(Number(settings.period_value)),
    operations_sorting: settings.operations_sorting || [],
    accounts_sorting: settings.accounts_sorting || [],
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
    start_month: config.startMonth || undefined,
    end_month: config.endMonth || undefined,
    is_extra: config.isExtra,
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
    start_month: income.startMonth || undefined,
    end_month: income.endMonth || undefined,
  });

export const apiDeleteIncome = async (id: string) => supabase.from("income_configs").delete().eq("id", id);

/**
 * Enregistre ou supprime le pointage d'une opération récurrente.
 *
 * @description
 * Gère la persistence des pointages mensuels avec traitement spécial des `tagAmounts`
 * qui sont stockés dans une table relationnelle séparée.
 *
 * **Comportement :**
 * - Si `details` fourni : Upsert du pointage + remplacement complet des tags
 * - Si `details = null` : Suppression du pointage (tags supprimés automatiquement par CASCADE)
 * - Les tags sont remplacés atomiquement (DELETE ancien + INSERT nouveau)
 *
 * **Gestion des tags :**
 * 1. Upsert du `paid_item` principal
 * 2. Suppression de tous les anciens `paid_item_tags`
 * 3. Insertion des nouveaux tags si `tagAmounts` présent
 * 4. Si `tagAmounts = []` : Suppression explicite des tags (ventilation vide)
 *
 * @param {PaidItemDetails | null} details - Détails du pointage ou null pour supprimer
 * @param {string} instanceId - Identifiant de l'instance (non utilisé si details fourni)
 * @returns {Promise<{data: any, error: any}>} Résultat Supabase
 *
 * @example
 * ```tsx
 * // Pointer avec ventilation de tags
 * await apiSetPaidStatus({
 *   instanceId: "exp_123-2025-01",
 *   amount: 150,
 *   tagAmounts: [
 *     { tagId: 'tag1', amount: 100 },
 *     { tagId: 'tag2', amount: 50, isExtra: true }
 *   ],
 *   // ... autres champs
 * }, "exp_123-2025-01");
 *
 * // Dépointer
 * await apiSetPaidStatus(null, "exp_123-2025-01");
 * ```
 */
export const apiSetPaidStatus = async (details: PaidItemDetails | null, instanceId: string) => {
  if (details) {
    const normalizedTagAmounts = normalizeTagAmountsForRpc(details.tagAmounts);
    const normalizedBeneficiaryAmounts = normalizeBeneficiaryAmountsForRpc(details.beneficiaryAmounts);
    const normalizedPaidItem = normalizePaidItemForRpc(details.amount, details.type);

    validatePaidItemForRpc({
      instanceId: details.instanceId,
      amount: normalizedPaidItem.amount,
      paymentDate: details.paymentDate,
      accountId: details.accountId,
      label: details.label,
      category: details.category,
    });

    const rpcPayload = {
      p_instance_id: details.instanceId,
      p_amount: normalizedPaidItem.amount,
      p_payment_date: details.paymentDate,
      p_account_id: details.accountId,
      p_label: details.label,
      p_category: details.category,
      p_sub_category: details.subCategory || null,
      p_type: normalizedPaidItem.type,
      p_is_variable: !!details.isVariable,
      p_is_waiting: !!details.isWaiting,
      p_is_extra: !!details.isExtra,
      p_is_refund: !!details.isRefund,
      p_is_salary: !!details.isSalary,
      p_comments: details.comments || null,
      p_tag_amounts: normalizedTagAmounts,
      p_beneficiary_amounts: normalizedBeneficiaryAmounts,
    };

    const rpcResult = await supabase.rpc("upsert_paid_item_with_tags", rpcPayload);
    if (rpcResult.error) {
      logger.error("crud", "RPC upsert_paid_item_with_tags failed", {
        context: "apiSetPaidStatus",
        instanceId: details.instanceId,
        amount: normalizedPaidItem.amount,
        type: normalizedPaidItem.type,
        tagCount: normalizedTagAmounts?.length ?? null,
        beneficiaryCount: normalizedBeneficiaryAmounts?.length ?? null,
        error: formatSupabaseError(rpcResult.error),
      });
    }

    return rpcResult;
  } else {
    // La suppression du paid_item déclenche automatiquement la suppression des paid_item_tags (CASCADE)
    return supabase.from("paid_items").delete().eq("instance_id", instanceId);
  }
};

/**
 * Opérations sur les Virements (Transfers)
 */
export const apiUpsertTransfer = async (transfer: Transfer) =>
  supabase.from("transfers").upsert({
    id: transfer.id,
    date: transfer.date,
    label: transfer.label,
    amount: transfer.amount,
    source_account_id: transfer.sourceAccountId,
    destination_account_id: transfer.destinationAccountId,
    is_interest: transfer.isInterest || false,
  });

export const apiDeleteTransfer = async (id: string) => supabase.from("transfers").delete().eq("id", id);

/**
 * Opérations sur les Transactions Variables (Suivi Réel)
 */
export const apiUpsertVariableTransaction = async (transaction: VariableTransaction) => {
  const normalizedTagAmounts = normalizeTagAmountsForRpc(transaction.tagAmounts);
  const normalizedBeneficiaryAmounts = normalizeBeneficiaryAmountsForRpc(transaction.beneficiaryAmounts);
  const normalizedPaidItem = normalizePaidItemForRpc(transaction.amount, transaction.type);

  validatePaidItemForRpc({
    instanceId: transaction.id,
    amount: normalizedPaidItem.amount,
    paymentDate: transaction.date,
    accountId: transaction.accountId,
    label: transaction.label,
    category: transaction.category,
  });

  const rpcPayload = {
    p_instance_id: transaction.id,
    p_amount: normalizedPaidItem.amount,
    p_payment_date: transaction.date,
    p_account_id: transaction.accountId,
    p_label: transaction.label,
    p_category: transaction.category,
    p_sub_category: transaction.subCategory || null,
    p_type: normalizedPaidItem.type,
    p_is_variable: true,
    p_is_waiting: !!transaction.isWaiting,
    p_is_extra: !!transaction.isExtra,
    p_is_refund: !!transaction.isRefund,
    p_is_salary: !!transaction.isSalary,
    p_comments: transaction.comments || null,
    p_tag_amounts: normalizedTagAmounts,
    p_beneficiary_amounts: normalizedBeneficiaryAmounts,
  };

  const rpcResult = await supabase.rpc("upsert_paid_item_with_tags", rpcPayload);
  if (rpcResult.error) {
    logger.error("crud", "RPC upsert_paid_item_with_tags failed", {
      context: "apiUpsertVariableTransaction",
      instanceId: transaction.id,
      amount: normalizedPaidItem.amount,
      type: normalizedPaidItem.type,
      tagCount: normalizedTagAmounts?.length ?? null,
      beneficiaryCount: normalizedBeneficiaryAmounts?.length ?? null,
      error: formatSupabaseError(rpcResult.error),
    });
  }

  return rpcResult;
};

export const apiDeleteVariableTransaction = async (id: string) => supabase.from("paid_items").delete().eq("instance_id", id);
