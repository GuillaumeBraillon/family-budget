
import { useState, useEffect, useCallback } from 'react';
import { Account, ExpenseConfig, IncomeConfig, CategoryDef, Person, PaidItemDetails, AppSettings, Transfer, VariableTransaction, SavedLabel, AccountType } from '../types';
import { 
  fetchInitialData, 
  apiUpsertConfig, apiDeleteConfig, 
  apiUpsertIncome, apiDeleteIncome, 
  apiUpsertCategory, apiDeleteCategory, 
  apiUpsertPerson, apiDeletePerson, 
  apiUpsertAccount, apiDeleteAccount, 
  apiSetPaidStatus, apiUpdateSettings,
  apiUpsertTransfer, apiDeleteTransfer,
  apiUpsertVariableTransaction, apiDeleteVariableTransaction,
  apiUpsertLabel, apiDeleteLabel,
  apiImportLabels,
  apiImportVirLabels
} from '../services/api';
import { isSupabaseConfigured } from '../services/supabase';

const DEFAULT_SAVINGS_LABELS = [
  "Virement mensuel",
  "Épargne automatique",
  "Intérêts",
  "Retrait",
  "Apport exceptionnel",
  "Régularisation"
];

const DEFAULT_VARIABLE_LABELS = [
  "Courses Alimentaires",
  "Essence / Carburant",
  "Restaurant",
  "Pharmacie",
  "Loisirs",
  "Shopping"
];

/**
 * Hook central gérant l'état global des finances et les actions CRUD synchronisées avec Supabase.
 */
export const useBudget = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDbEmpty, setIsDbEmpty] = useState(false);

  const [data, setData] = useState({
    accounts: [] as Account[],
    configs: [] as ExpenseConfig[],
    incomeConfigs: [] as IncomeConfig[],
    categories: [] as CategoryDef[],
    people: [] as Person[],
    paidItems: {} as Record<string, PaidItemDetails>,
    settings: { 
      monthly_envelope: 2000,
      period_type: 'FIXED_DAYS',
      period_value: 7
    } as AppSettings,
    transfers: [] as Transfer[],
    variableTransactions: [] as VariableTransaction[],
    savedLabels: [] as SavedLabel[]
  });

  const loadData = useCallback(async (silent = false) => {
    // Si Supabase n'est pas configuré, on ne tente même pas le chargement
    if (!isSupabaseConfigured()) {
        setLoading(false);
        return;
    }

    try {
      if (!silent) setLoading(true);
      setError(null);
      const res = await fetchInitialData();
      
      setIsDbEmpty(res.people.length === 0 && res.accounts.length === 0);

      setData({
        accounts: res.accounts,
        configs: res.configs,
        incomeConfigs: res.incomeConfigs,
        categories: res.categories,
        people: res.people,
        paidItems: res.paidItems,
        settings: res.settings,
        transfers: res.transfers,
        variableTransactions: res.variableTransactions,
        savedLabels: res.savedLabels
      });
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des données");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const setPaidStatus = async (details: PaidItemDetails | null, instanceId: string) => {
    // Optimistic Update
    setData(prev => {
      const nextPaid = { ...prev.paidItems };
      if (!details) delete nextPaid[instanceId];
      else nextPaid[instanceId] = details;
      return { ...prev, paidItems: nextPaid };
    });

    try {
      const { error: apiErr } = await apiSetPaidStatus(details, instanceId);
      if (apiErr) throw apiErr;
    } catch (err: any) {
      setError(err.message || "Erreur lors de la mise à jour du statut");
      loadData();
    }
  };

  const updateSettings = async (settings: AppSettings) => {
    try {
      const { error: apiErr } = await apiUpdateSettings(settings);
      if (apiErr) throw apiErr;
      setData(prev => ({ ...prev, settings }));
    } catch (err: any) {
      setError(err.message || "Erreur lors de la mise à jour des paramètres");
      loadData();
    }
  };

  const wrapCrud = (fn: (...args: any[]) => Promise<any>) => async (...args: any[]) => {
    try {
      const res = await fn(...args);
      if (res && res.error) throw res.error;
      await loadData(true);
      return res;
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'opération");
      return { error: err };
    }
  };

  // Helpers pour dériver les listes de suggestions pour l'UI existante
  // EPARGNE correspond aux anciens SAVINGS_LABELS
  const savingsSuggestions = data.savedLabels
    .filter(l => l.type === AccountType.SAVINGS)
    .map(l => l.name);

  // COURANT correspond aux anciens VARIABLE_LABELS
  const variableSuggestions = data.savedLabels
    .filter(l => l.type === AccountType.CHECKING)
    .map(l => l.name);

  // Si vide, on utilise les défauts (visuel uniquement, ne persiste pas en BDD sauf si utilisateur ajoute)
  const finalSavingsSuggestions = savingsSuggestions.length > 0 ? savingsSuggestions : DEFAULT_SAVINGS_LABELS;
  const finalVariableSuggestions = variableSuggestions.length > 0 ? variableSuggestions : DEFAULT_VARIABLE_LABELS;

  // Surcharge pour l'UI qui attendait ces champs dans settings
  const settingsWithLabels = {
      ...data.settings,
      savings_labels: finalSavingsSuggestions,
      variable_labels: finalVariableSuggestions
  };

  return {
    ...data,
    settings: settingsWithLabels, // Rétro-compatibilité pour l'UI
    savedLabels: data.savedLabels, // Accès direct aux objets complets
    loading,
    error,
    isDbEmpty,
    actions: {
      loadData,
      setPaidStatus,
      updateSettings,
      upsertConfig: wrapCrud(apiUpsertConfig),
      deleteConfig: wrapCrud(apiDeleteConfig),
      upsertIncome: wrapCrud(apiUpsertIncome),
      deleteIncome: wrapCrud(apiDeleteIncome),
      upsertCategory: wrapCrud(apiUpsertCategory),
      deleteCategory: wrapCrud(apiDeleteCategory),
      upsertPerson: wrapCrud(apiUpsertPerson),
      deletePerson: wrapCrud(apiDeletePerson),
      upsertAccount: wrapCrud(apiUpsertAccount),
      deleteAccount: wrapCrud(apiDeleteAccount),
      upsertTransfer: wrapCrud(apiUpsertTransfer),
      deleteTransfer: wrapCrud(apiDeleteTransfer),
      upsertVariableTransaction: wrapCrud(apiUpsertVariableTransaction),
      deleteVariableTransaction: wrapCrud(apiDeleteVariableTransaction),
      upsertLabel: wrapCrud(apiUpsertLabel),
      deleteLabel: wrapCrud(apiDeleteLabel),
      importLabels: wrapCrud(apiImportLabels),
      importVirLabels: wrapCrud(apiImportVirLabels)
    }
  };
};
