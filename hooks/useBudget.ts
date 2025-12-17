
import { useState, useEffect, useCallback } from 'react';
import { Account, ExpenseConfig, IncomeConfig, CategoryDef, Person, PaidItemDetails, AppSettings } from '../types';
import { fetchInitialData, apiUpsertConfig, apiDeleteConfig, apiUpsertIncome, apiDeleteIncome, apiUpsertCategory, apiDeleteCategory, apiUpsertPerson, apiDeletePerson, apiUpsertAccount, apiDeleteAccount, apiSetPaidStatus, apiUpdateSettings, seedDatabase } from '../services/api';

export const useBudget = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDbEmpty, setIsDbEmpty] = useState(false);
  const [missingTables, setMissingTables] = useState(false);

  const [data, setData] = useState({
    accounts: [] as Account[],
    configs: [] as ExpenseConfig[],
    incomeConfigs: [] as IncomeConfig[],
    categories: [] as CategoryDef[],
    people: [] as Person[],
    paidItems: {} as Record<string, PaidItemDetails>,
    settings: { weekly_envelope: 500 } as AppSettings
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setMissingTables(false);
      const res = await fetchInitialData();
      
      if (res.people.length === 0 && res.accounts.length === 0) {
        setIsDbEmpty(true);
      } else {
        setIsDbEmpty(false);
      }

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
      if (err.message === 'TABLE_MISSING') {
        setMissingTables(true);
      } else {
        setError(err.message || "Erreur de connexion");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSeed = async () => {
    setLoading(true);
    await seedDatabase();
    await loadData();
  };

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
    } catch (err) {
      loadData();
      throw err;
    }
  };

  const updateSettings = async (settings: AppSettings) => {
    setData(prev => ({ ...prev, settings }));
    try {
      const { error: apiErr } = await apiUpdateSettings(settings);
      if (apiErr) throw apiErr;
    } catch (err) {
      loadData();
      throw err;
    }
  };

  return {
    ...data,
    loading,
    error,
    isDbEmpty,
    missingTables,
    actions: {
      loadData,
      handleSeed,
      setPaidStatus,
      updateSettings,
      upsertConfig: apiUpsertConfig,
      deleteConfig: apiDeleteConfig,
      upsertIncome: apiUpsertIncome,
      deleteIncome: apiDeleteIncome,
      upsertCategory: apiUpsertCategory,
      deleteCategory: apiDeleteCategory,
      upsertPerson: apiUpsertPerson,
      deletePerson: apiDeletePerson,
      upsertAccount: apiUpsertAccount,
      deleteAccount: apiDeleteAccount,
    }
  };
};
