import { supabase } from './supabase';
import { Account, ExpenseConfig, CategoryDef, Person, AccountType } from '../types';

// --- READ OPERATIONS ---

export const fetchInitialData = async () => {
  const [peopleRes, accountsRes, categoriesRes, configsRes, paidItemsRes] = await Promise.all([
    supabase.from('people').select('*'),
    supabase.from('accounts').select('*'),
    supabase.from('categories').select('*'),
    supabase.from('expense_configs').select('*'),
    supabase.from('paid_items').select('*')
  ]);

  // Mapping DB snake_case -> App camelCase
  
  const people: Person[] = (peopleRes.data || []).map((p: any) => ({
    id: p.id, name: p.name, isChild: p.is_child
  }));

  const accounts: Account[] = (accountsRes.data || []).map((a: any) => ({
    id: a.id, name: a.name, type: a.type as AccountType, ownerId: a.owner_id, currentBalance: a.current_balance, bankName: a.bank_name
  }));

  const categories: CategoryDef[] = (categoriesRes.data || []).map((c: any) => ({
    id: c.id, name: c.name, subCategories: c.sub_categories || []
  }));

  const configs: ExpenseConfig[] = (configsRes.data || []).map((c: any) => ({
    id: c.id,
    label: c.label,
    amount: c.amount,
    category: c.category,
    subCategory: c.sub_category,
    beneficiaryId: c.beneficiary_id,
    ownerId: c.owner_id,
    dayOfMonth: c.day_of_month,
    startMonth: c.start_month,
    endMonth: c.end_month,
    isExtra: c.is_extra
  }));

  const paidItems: Record<string, boolean> = {};
  (paidItemsRes.data || []).forEach((item: any) => {
    paidItems[item.instance_id] = item.is_paid;
  });

  return { people, accounts, categories, configs, paidItems };
};

// --- WRITE OPERATIONS (Simplifiées) ---

// --- PEOPLE ---
export const apiUpsertPerson = async (person: Person) => {
  return await supabase.from('people').upsert({
    id: person.id, name: person.name, is_child: person.isChild
  });
};
export const apiDeletePerson = async (id: string) => {
  return await supabase.from('people').delete().eq('id', id);
};

// --- ACCOUNTS ---
export const apiUpsertAccount = async (account: Account) => {
  return await supabase.from('accounts').upsert({
    id: account.id, name: account.name, type: account.type, owner_id: account.ownerId, current_balance: account.currentBalance, bank_name: account.bankName
  });
};
export const apiDeleteAccount = async (id: string) => {
  return await supabase.from('accounts').delete().eq('id', id);
};

// --- CATEGORIES ---
export const apiUpsertCategory = async (category: CategoryDef) => {
  return await supabase.from('categories').upsert({
    id: category.id, name: category.name, sub_categories: category.subCategories
  });
};
export const apiDeleteCategory = async (id: string) => {
  return await supabase.from('categories').delete().eq('id', id);
};

// --- CONFIGS ---
export const apiUpsertConfig = async (config: ExpenseConfig) => {
  return await supabase.from('expense_configs').upsert({
    id: config.id,
    label: config.label,
    amount: config.amount,
    category: config.category,
    sub_category: config.subCategory,
    beneficiary_id: config.beneficiaryId,
    owner_id: config.ownerId,
    day_of_month: config.dayOfMonth,
    start_month: config.startMonth,
    end_month: config.endMonth,
    is_extra: config.isExtra
  });
};
export const apiDeleteConfig = async (id: string) => {
  return await supabase.from('expense_configs').delete().eq('id', id);
};

// --- PAID ITEMS ---
export const apiSetPaidStatus = async (instanceId: string, isPaid: boolean) => {
  if (isPaid) {
    return await supabase.from('paid_items').upsert({ instance_id: instanceId, is_paid: true });
  } else {
    return await supabase.from('paid_items').delete().eq('instance_id', instanceId);
  }
};
