
import { supabase } from './supabase';
import { Person, Account, CategoryDef, ExpenseConfig, IncomeConfig, PaidItemDetails, AppSettings, SavingsTransaction } from '../types';

/**
 * Opérations sur les Membres (People)
 */
export const apiUpsertPerson = async (person: Person) => 
  supabase.from('people').upsert({ id: person.id, name: person.name, is_child: person.isChild });

export const apiDeletePerson = async (id: string) => 
  supabase.from('people').delete().eq('id', id);

/**
 * Opérations sur les Comptes (Accounts)
 */
export const apiUpsertAccount = async (account: Account) => 
  supabase.from('accounts').upsert({ 
    id: account.id, 
    name: account.name, 
    type: account.type, 
    owner_id: account.ownerId, 
    current_balance: account.currentBalance, 
    bank_name: account.bankName 
  });

export const apiDeleteAccount = async (id: string) => 
  supabase.from('accounts').delete().eq('id', id);

/**
 * Opérations sur les Catégories
 */
export const apiUpsertCategory = async (category: CategoryDef) => 
  supabase.from('categories').upsert({ 
    id: category.id, 
    name: category.name, 
    type: category.type, 
    sub_categories: category.subCategories 
  });

export const apiDeleteCategory = async (id: string) => 
  supabase.from('categories').delete().eq('id', id);

/**
 * Opérations sur les Paramètres (Settings)
 */
export const apiUpdateSettings = async (settings: AppSettings) => 
  supabase.from('app_settings').upsert({ 
    id: 'global', 
    monthly_envelope: Number(settings.monthly_envelope), 
    period_type: settings.period_type,
    period_value: Math.floor(Number(settings.period_value)),
    savings_labels: settings.savings_labels
  });

/**
 * Opérations sur les Modèles de Dépenses (ExpenseConfigs)
 */
export const apiUpsertConfig = async (config: ExpenseConfig) => 
  supabase.from('expense_configs').upsert({ 
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
    is_extra: config.isExtra 
  });

export const apiDeleteConfig = async (id: string) => 
  supabase.from('expense_configs').delete().eq('id', id);

/**
 * Opérations sur les Modèles de Revenus (IncomeConfigs)
 */
export const apiUpsertIncome = async (income: IncomeConfig) => 
  supabase.from('income_configs').upsert({ 
    id: income.id, 
    label: income.label, 
    amount: income.amount, 
    account_id: income.accountId, 
    beneficiary_id: income.beneficiaryId, 
    day_of_month: income.dayOfMonth, 
    category: income.category, 
    sub_category: income.subCategory 
  });

export const apiDeleteIncome = async (id: string) => 
  supabase.from('income_configs').delete().eq('id', id);

/**
 * Opérations sur le Pointage (PaidItems)
 */
export const apiSetPaidStatus = async (details: PaidItemDetails | null, instanceId: string) => {
  if (details) {
    return supabase.from('paid_items').upsert({ 
      instance_id: details.instanceId, 
      is_paid: true, 
      amount: details.amount, 
      payment_date: details.paymentDate, 
      account_id: details.accountId, 
      beneficiary_id: details.beneficiaryId, 
      label: details.label, 
      category: details.category, 
      sub_category: details.subCategory 
    });
  } else {
    return supabase.from('paid_items').delete().eq('instance_id', instanceId);
  }
};

/**
 * Opérations sur les Transactions d'Épargne
 */
export const apiUpsertSavingsTransaction = async (tx: SavingsTransaction) => 
  supabase.from('savings_transactions').upsert({
    id: tx.id,
    account_id: tx.accountId,
    date: tx.date,
    label: tx.label,
    amount: tx.amount
  });

export const apiDeleteSavingsTransaction = async (id: string) => 
  supabase.from('savings_transactions').delete().eq('id', id);