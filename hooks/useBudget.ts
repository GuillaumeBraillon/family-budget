
import { useState, useEffect, useCallback } from 'react';
import { Account, ExpenseConfig, IncomeConfig, CategoryDef, Person, PaidItemDetails, AppSettings } from '../types';
import { 
  fetchInitialData, 
  apiUpsertConfig, apiDeleteConfig, 
  apiUpsertIncome, apiDeleteIncome, 
  apiUpsertCategory, apiDeleteCategory, 
  apiUpsertPerson, apiDeletePerson, 
  apiUpsertAccount, apiDeleteAccount, 
  apiSetPaidStatus, apiUpdateSettings 
} from '../services/api';

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
    } as AppSettings
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
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
        settings: res.settings
      });
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const setPaidStatus = async (details: PaidItemDetails | null, instanceId: string) => {
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
      const { error: apiErr } = await fn(...args);
      if (apiErr) throw apiErr;
      await loadData();
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'opération");
    }
  };

  return {
    ...data,
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
    }
  };
};
