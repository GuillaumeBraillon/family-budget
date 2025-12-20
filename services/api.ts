
import { supabase } from './supabase';
import * as mappers from './apiMappers';
import { 
  apiUpsertPerson, apiDeletePerson, 
  apiUpsertAccount, apiDeleteAccount, 
  apiUpsertCategory, apiDeleteCategory, 
  apiUpdateSettings, 
  apiUpsertConfig, apiDeleteConfig, 
  apiUpsertIncome, apiDeleteIncome, 
  apiSetPaidStatus,
  apiUpsertSavingsTransaction, apiDeleteSavingsTransaction,
  apiUpsertVariableTransaction, apiDeleteVariableTransaction,
  apiUpsertLabel, apiDeleteLabel
} from './apiCrud';

/**
 * Orchestrateur de données : Récupère l'intégralité du contexte applicatif au démarrage.
 * Délègue la conversion des données brutes aux fonctions de mapping.
 */
export const fetchInitialData = async () => {
  const [
    peopleRes, 
    accountsRes, 
    categoriesRes, 
    configsRes, 
    incomesRes, 
    paidItemsRes, 
    settingsRes,
    savingsRes,
    savedLabelsRes
  ] = await Promise.all([
    supabase.from('people').select('*'),
    supabase.from('accounts').select('*'),
    supabase.from('categories').select('*'), 
    supabase.from('expense_configs').select('*'),
    supabase.from('income_configs').select('*'),
    supabase.from('paid_items').select('*'),
    supabase.from('app_settings').select('*').maybeSingle(),
    supabase.from('savings_transactions').select('*').order('date', { ascending: false }),
    supabase.from('saved_labels').select('*')
  ]);

  const responses = [peopleRes, accountsRes, categoriesRes, configsRes, incomesRes, paidItemsRes, settingsRes, savingsRes, savedLabelsRes];
  const errors = responses.map(r => r.error).filter(e => e !== null);
  
  if (errors.length > 0) {
      throw new Error(errors[0]?.message || "Erreur lors du chargement des données.");
  }

  const people = (peopleRes.data || []).map(mappers.mapDbPerson);
  const accounts = (accountsRes.data || []).map(mappers.mapDbAccount);
  const categories = (categoriesRes.data || []).map(mappers.mapDbCategory);
  const configs = (configsRes.data || []).map(mappers.mapDbExpenseConfig);
  const incomeConfigs = (incomesRes.data || []).map(mappers.mapDbIncomeConfig);
  const settings = mappers.mapDbSettings(settingsRes.data);
  const savingsTransactions = (savingsRes.data || []).map(mappers.mapDbSavingsTransaction);
  const savedLabels = (savedLabelsRes.data || []).map(mappers.mapDbSavedLabel);

  const paidItems: Record<string, any> = {};
  const variableTransactions: any[] = []; // On reconstruit cette liste depuis paidItems

  (paidItemsRes.data || []).forEach((item: any) => {
    const mapped = mappers.mapDbPaidItem(item);
    paidItems[item.instance_id] = mapped;
    
    // Si c'est manuel, on l'ajoute aussi comme "VariableTransaction" pour la rétrocompatibilité
    if (mapped.isManual) {
        variableTransactions.push({
            id: mapped.instanceId,
            date: mapped.paymentDate,
            label: mapped.label,
            amount: mapped.amount,
            category: mapped.category,
            subCategory: mapped.subCategory,
            accountId: mapped.accountId,
            beneficiaryId: mapped.beneficiaryId,
            type: mapped.type
        });
    }
  });

  return { people, accounts, categories, configs, incomeConfigs, paidItems, settings, savingsTransactions, variableTransactions, savedLabels };
};

// Ré-exports explicites
export {
  apiUpsertPerson, apiDeletePerson,
  apiUpsertAccount, apiDeleteAccount,
  apiUpsertCategory, apiDeleteCategory,
  apiUpdateSettings,
  apiUpsertConfig, apiDeleteConfig,
  apiUpsertIncome, apiDeleteIncome,
  apiSetPaidStatus,
  apiUpsertSavingsTransaction, apiDeleteSavingsTransaction,
  apiUpsertVariableTransaction, apiDeleteVariableTransaction,
  apiUpsertLabel, apiDeleteLabel
};
