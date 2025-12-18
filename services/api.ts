
import { supabase } from './supabase';
import * as mappers from './apiMappers';
import { 
  apiUpsertPerson, apiDeletePerson, 
  apiUpsertAccount, apiDeleteAccount, 
  apiUpsertCategory, apiDeleteCategory, 
  apiUpdateSettings, 
  apiUpsertConfig, apiDeleteConfig, 
  apiUpsertIncome, apiDeleteIncome, 
  apiSetPaidStatus 
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
    settingsRes
  ] = await Promise.all([
    supabase.from('people').select('*'),
    supabase.from('accounts').select('*'),
    supabase.from('categories').select('*'), 
    supabase.from('expense_configs').select('*'),
    supabase.from('income_configs').select('*'),
    supabase.from('paid_items').select('*'),
    supabase.from('app_settings').select('*').maybeSingle()
  ]);

  const responses = [peopleRes, accountsRes, categoriesRes, configsRes, incomesRes, paidItemsRes, settingsRes];
  const errors = responses.map(r => r.error).filter(e => e !== null);
  
  if (errors.length > 0) {
      throw new Error(errors[0]?.message || "Erreur lors du chargement des données. Vérifiez votre schéma SQL.");
  }

  const people = (peopleRes.data || []).map(mappers.mapDbPerson);
  const accounts = (accountsRes.data || []).map(mappers.mapDbAccount);
  const categories = (categoriesRes.data || []).map(mappers.mapDbCategory);
  const configs = (configsRes.data || []).map(mappers.mapDbExpenseConfig);
  const incomeConfigs = (incomesRes.data || []).map(mappers.mapDbIncomeConfig);
  const settings = mappers.mapDbSettings(settingsRes.data);

  const paidItems: Record<string, any> = {};
  (paidItemsRes.data || []).forEach((item: any) => {
    paidItems[item.instance_id] = mappers.mapDbPaidItem(item);
  });

  return { people, accounts, categories, configs, incomeConfigs, paidItems, settings };
};

// Ré-exports explicites pour garantir la visibilité par le compilateur TS
export {
  apiUpsertPerson, apiDeletePerson,
  apiUpsertAccount, apiDeleteAccount,
  apiUpsertCategory, apiDeleteCategory,
  apiUpdateSettings,
  apiUpsertConfig, apiDeleteConfig,
  apiUpsertIncome, apiDeleteIncome,
  apiSetPaidStatus
};
