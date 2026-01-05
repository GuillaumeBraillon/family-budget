
import { useState, useEffect, useCallback, useRef } from 'react';
import { Account, ExpenseConfig, IncomeConfig, CategoryDef, Person, PaidItemDetails, AppSettings, Transfer, VariableTransaction, SavedLabel, AccountType, Tag, PlannedItem } from '../types';
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
  apiImportVirLabels,
  apiUpsertTag, apiDeleteTag
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
    savedLabels: [] as SavedLabel[],
    tags: [] as Tag[]
  });

  // Ref pour accéder aux données actuelles dans les fonctions async sans stale closures
  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);

  const loadData = useCallback(async (silent = false) => {
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
        savedLabels: res.savedLabels,
        tags: res.tags
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

  // --- LOGIQUE DE MISE A JOUR AUTOMATIQUE DES SOLDES ---

  const adjustAccountBalance = async (accountId: string, amountDelta: number) => {
    if (Math.abs(amountDelta) < 0.01) return;

    const account = dataRef.current.accounts.find(a => a.id === accountId);
    if (!account) return;

    const newBalance = account.currentBalance + amountDelta;

    // Optimistic Update local
    setData(prev => ({
        ...prev,
        accounts: prev.accounts.map(a => a.id === accountId ? { ...a, currentBalance: newBalance } : a)
    }));

    // Persistance API
    await apiUpsertAccount({ ...account, currentBalance: newBalance });
  };

  // --- ACTIONS MODIFIÉES ---

  const setPaidStatus = async (details: PaidItemDetails | null, instanceId: string) => {
    const oldItem = dataRef.current.paidItems[instanceId];

    // 1. Mise à jour Optimiste de l'UI
    setData(prev => {
      const nextPaid = { ...prev.paidItems };
      if (!details) delete nextPaid[instanceId];
      else nextPaid[instanceId] = details;
      return { ...prev, paidItems: nextPaid };
    });

    try {
      // 2. Gestion des impacts solde
      if (oldItem && !oldItem.isWaiting) {
          const sign = oldItem.type === 'INCOME' ? -1 : 1; 
          await adjustAccountBalance(oldItem.accountId, oldItem.amount * sign);
      }

      if (details && !details.isWaiting) {
          const sign = details.type === 'INCOME' ? 1 : -1;
          await adjustAccountBalance(details.accountId, details.amount * sign);
      }

      // 3. Appel API
      const { error: apiErr } = await apiSetPaidStatus(details, instanceId);
      if (apiErr) throw apiErr;

    } catch (err: any) {
      setError(err.message || "Erreur lors de la mise à jour du statut");
      loadData();
    }
  };

  // NOUVELLE FONCTION : Déplacer un item
  const moveItem = async (item: PlannedItem, newPosition: number) => {
      // Calcul de la date de paiement pour les items virtuels
      let targetDate = new Date().toISOString().split('T')[0];
      
      if (item.paidDetails?.paymentDate) {
          targetDate = item.paidDetails.paymentDate;
      } else {
          // Si virtuel, on reconstruit la date à partir de l'instanceId (ex: c5-2026-01) et item.day
          const match = item.instanceId.match(/-(\d{4}-\d{2})$/);
          if (match && match[1]) {
              const yearMonth = match[1];
              targetDate = `${yearMonth}-${String(item.day).padStart(2, '0')}`;
          } else {
              // Fallback
              targetDate = new Date().toISOString().split('T')[0];
          }
      }

      // On met à jour l'UI localement immédiatement (optimistic)
      setData(prev => {
          const newPaidItems = { ...prev.paidItems };
          
          // Mise à jour de paidItems (utilisé pour les récurrents et la persistance globale)
          if (newPaidItems[item.instanceId]) {
              newPaidItems[item.instanceId] = { ...newPaidItems[item.instanceId], position: newPosition };
          } else {
              // Si c'est un item virtuel (calculé), on doit le "créer" virtuellement pour l'UI
              newPaidItems[item.instanceId] = {
                  instanceId: item.instanceId,
                  amount: item.amount,
                  paymentDate: targetDate, 
                  accountId: item.accountId,
                  beneficiaryId: item.beneficiaryId,
                  label: item.label,
                  category: item.category,
                  subCategory: item.subCategory,
                  type: item.type,
                  isVariable: item.source === 'VARIABLE',
                  isWaiting: true, // Reste en attente
                  isExtra: item.isExtra,
                  comments: item.comments,
                  tagIds: item.tagIds,
                  position: newPosition
              };
          }

          // IMPORTANT: Si c'est une opération variable, on DOIT aussi mettre à jour variableTransactions
          // car usePlanner utilise ce tableau pour générer l'affichage des variables.
          let newVariableTransactions = prev.variableTransactions;
          if (item.source === 'VARIABLE') {
              newVariableTransactions = prev.variableTransactions.map(t => 
                  t.id === item.instanceId ? { ...t, position: newPosition } : t
              );
          }

          return { ...prev, paidItems: newPaidItems, variableTransactions: newVariableTransactions };
      });

      // Persistance
      // On construit l'objet PaidItemDetails complet
      const details: PaidItemDetails = {
          instanceId: item.instanceId,
          amount: item.amount,
          paymentDate: targetDate, 
          accountId: item.accountId,
          beneficiaryId: item.beneficiaryId,
          label: item.label,
          category: item.category,
          subCategory: item.subCategory,
          type: item.type,
          isVariable: item.source === 'VARIABLE',
          isWaiting: item.isWaiting, // Conserve le statut actuel
          isExtra: item.isExtra,
          comments: item.comments,
          tagIds: item.tagIds,
          position: newPosition
      };

      await apiSetPaidStatus(details, item.instanceId);
  };

  const upsertVariableTransaction = async (tx: VariableTransaction) => {
      const oldTx = dataRef.current.variableTransactions.find(t => t.id === tx.id);

      if (oldTx && !oldTx.isWaiting) {
          const sign = oldTx.type === 'INCOME' ? -1 : 1;
          await adjustAccountBalance(oldTx.accountId, oldTx.amount * sign);
      }

      if (!tx.isWaiting) {
          const sign = tx.type === 'INCOME' ? 1 : -1;
          await adjustAccountBalance(tx.accountId, tx.amount * sign);
      }

      return wrapCrud(apiUpsertVariableTransaction)(tx);
  };

  const deleteVariableTransaction = async (id: string) => {
      const oldTx = dataRef.current.variableTransactions.find(t => t.id === id);
      
      if (oldTx && !oldTx.isWaiting) {
          const sign = oldTx.type === 'INCOME' ? -1 : 1;
          await adjustAccountBalance(oldTx.accountId, oldTx.amount * sign);
      }

      return wrapCrud(apiDeleteVariableTransaction)(id);
  };

  const upsertTransfer = async (t: Transfer) => {
      const oldTransfer = dataRef.current.transfers.find(tr => tr.id === t.id);

      if (oldTransfer) {
          await adjustAccountBalance(oldTransfer.sourceAccountId, oldTransfer.amount);
          await adjustAccountBalance(oldTransfer.destinationAccountId, -oldTransfer.amount);
      }

      await adjustAccountBalance(t.sourceAccountId, -t.amount);
      await adjustAccountBalance(t.destinationAccountId, t.amount);

      return wrapCrud(apiUpsertTransfer)(t);
  };

  const deleteTransfer = async (id: string) => {
      const oldTransfer = dataRef.current.transfers.find(tr => tr.id === id);

      if (oldTransfer) {
          await adjustAccountBalance(oldTransfer.sourceAccountId, oldTransfer.amount);
          await adjustAccountBalance(oldTransfer.destinationAccountId, -oldTransfer.amount);
      }

      return wrapCrud(apiDeleteTransfer)(id);
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

  const savingsSuggestions = data.savedLabels
    .filter(l => l.type === AccountType.SAVINGS)
    .map(l => l.name);

  const variableSuggestions = data.savedLabels
    .filter(l => l.type === AccountType.CHECKING)
    .map(l => l.name);

  const finalSavingsSuggestions = savingsSuggestions.length > 0 ? savingsSuggestions : DEFAULT_SAVINGS_LABELS;
  const finalVariableSuggestions = variableSuggestions.length > 0 ? variableSuggestions : DEFAULT_VARIABLE_LABELS;

  const settingsWithLabels = {
      ...data.settings,
      savings_labels: finalSavingsSuggestions,
      variable_labels: finalVariableSuggestions
  };

  return {
    ...data,
    settings: settingsWithLabels, 
    savedLabels: data.savedLabels, 
    tags: data.tags,
    loading,
    error,
    isDbEmpty,
    actions: {
      loadData,
      setPaidStatus,
      moveItem, // Nouvelle action exposée
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
      upsertTransfer, 
      deleteTransfer,
      upsertVariableTransaction,
      deleteVariableTransaction,
      upsertLabel: wrapCrud(apiUpsertLabel),
      deleteLabel: wrapCrud(apiDeleteLabel),
      importLabels: wrapCrud(apiImportLabels),
      importVirLabels: wrapCrud(apiImportVirLabels),
      upsertTag: wrapCrud(apiUpsertTag),
      deleteTag: wrapCrud(apiDeleteTag)
    }
  };
};
