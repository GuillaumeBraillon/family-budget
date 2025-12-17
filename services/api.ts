import { supabase } from './supabase';
import { Account, ExpenseConfig, IncomeConfig, CategoryDef, Person, AccountType, PaidItemDetails } from '../types';
import { INITIAL_PEOPLE, MOCK_ACCOUNTS, INITIAL_CATEGORIES, MOCK_EXPENSE_CONFIGS, MOCK_INCOME_CONFIGS } from './mockData';

/* 
   ⚠️ MIGRATION SQL REQUISE ⚠️
   Voir le script dans la constante SQL_SETUP_SCRIPT dans App.tsx
*/

// --- READ OPERATIONS ---

export const fetchInitialData = async () => {
  // On utilise Promise.allSettled ou on gère les erreurs individuellement, 
  // mais ici Supabase renvoie { data, error } sans throw.
  
  const [peopleRes, accountsRes, categoriesRes, configsRes, incomesRes, paidItemsRes] = await Promise.all([
    supabase.from('people').select('*'),
    supabase.from('accounts').select('*'),
    supabase.from('categories').select('*'), 
    supabase.from('expense_configs').select('*'),
    supabase.from('income_configs').select('*'),
    supabase.from('paid_items').select('*')
  ]);

  // Check for critical table errors (Postgres error 42P01 means "undefined table")
  const responses = [peopleRes, accountsRes, categoriesRes, configsRes, incomesRes, paidItemsRes];
  const errors = responses.map(r => r.error).filter(e => e !== null);
  
  if (errors.length > 0) {
      // Si une table manque, on renvoie une erreur explicite
      const missingTableError = errors.find(e => e?.code === '42P01');
      if (missingTableError) {
          throw new Error("TABLE_MISSING");
      }
      console.error("Supabase errors:", errors);
  }

  // Mapping DB snake_case -> App camelCase
  
  const people: Person[] = (peopleRes.data || []).map((p: any) => ({
    id: p.id, 
    name: p.name, 
    isChild: p.is_child
  }));

  const accounts: Account[] = (accountsRes.data || []).map((a: any) => ({
    id: a.id, name: a.name, type: a.type as AccountType, ownerId: a.owner_id, currentBalance: a.current_balance ?? 0, bankName: a.bank_name
  }));

  const categories: CategoryDef[] = (categoriesRes.data || []).map((c: any) => ({
    id: c.id, 
    name: c.name, 
    type: c.type || 'EXPENSE', // Fallback si null
    subCategories: c.sub_categories || []
  }));

  const configs: ExpenseConfig[] = (configsRes.data || []).map((c: any) => ({
    id: c.id,
    label: c.label,
    amount: c.amount ?? 0, 
    category: c.category,
    subCategory: c.sub_category,
    beneficiary_id: c.beneficiary_id, 
    beneficiaryId: c.beneficiary_id,
    accountId: c.account_id ?? c.owner_id, // Support pour migration owner_id -> account_id
    dayOfMonth: c.day_of_month,
    startMonth: c.start_month,
    endMonth: c.end_month,
    isExtra: c.is_extra
  }));

  const incomeConfigs: IncomeConfig[] = (incomesRes.data || []).map((i: any) => ({
    id: i.id,
    label: i.label,
    amount: i.amount ?? 0,
    accountId: i.account_id ?? i.owner_id, // Support pour migration owner_id -> account_id
    beneficiaryId: i.beneficiary_id || i.owner_id, // Fallback si pas encore défini
    dayOfMonth: i.day_of_month,
    category: i.category
  }));

  const paidItems: Record<string, PaidItemDetails> = {};
  (paidItemsRes.data || []).forEach((item: any) => {
    paidItems[item.instance_id] = { 
        instanceId: item.instance_id,
        amount: item.amount,
        paymentDate: item.payment_date,
        accountId: item.account_id,
        beneficiaryId: item.beneficiary_id,
        label: item.label,
        category: item.category,
        subCategory: item.sub_category
    };
  });

  return { people, accounts, categories, configs, incomeConfigs, paidItems };
};

// --- WRITE OPERATIONS ---

// --- SEEDING (INITIALISATION) ---
export const seedDatabase = async () => {
    // 1. People
    for(const p of INITIAL_PEOPLE) {
        await supabase.from('people').upsert({ id: p.id, name: p.name, is_child: p.isChild });
    }
    // 2. Categories
    for(const c of INITIAL_CATEGORIES) {
        await supabase.from('categories').upsert({ id: c.id, name: c.name, type: c.type, sub_categories: c.subCategories });
    }
    // 3. Accounts
    for(const a of MOCK_ACCOUNTS) {
        await supabase.from('accounts').upsert({ id: a.id, name: a.name, type: a.type, owner_id: a.ownerId, current_balance: a.currentBalance, bank_name: a.bankName });
    }
    // 4. Expense Configs
    for(const c of MOCK_EXPENSE_CONFIGS) {
        await supabase.from('expense_configs').upsert({
            id: c.id, label: c.label, amount: c.amount, category: c.category, sub_category: c.subCategory,
            beneficiary_id: c.beneficiaryId, account_id: c.accountId, day_of_month: c.dayOfMonth,
            start_month: c.startMonth, end_month: c.endMonth, is_extra: c.isExtra
        });
    }
    // 5. Income Configs
    for(const i of MOCK_INCOME_CONFIGS) {
        await supabase.from('income_configs').upsert({
            id: i.id, label: i.label, amount: i.amount, account_id: i.accountId, beneficiary_id: i.beneficiaryId, day_of_month: i.dayOfMonth, category: i.category
        });
    }
};

// --- PEOPLE ---
export const apiUpsertPerson = async (person: Person) => {
  return await supabase.from('people').upsert({
    id: person.id, 
    name: person.name, 
    is_child: person.isChild
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

// --- CATEGORIES (Unified) ---
export const apiUpsertCategory = async (category: CategoryDef) => {
  return await supabase.from('categories').upsert({
    id: category.id, 
    name: category.name, 
    type: category.type, // Sauvegarde du type
    sub_categories: category.subCategories
  });
};
export const apiDeleteCategory = async (id: string) => {
  return await supabase.from('categories').delete().eq('id', id);
};

// --- CONFIGS (EXPENSES) ---
export const apiUpsertConfig = async (config: ExpenseConfig) => {
  return await supabase.from('expense_configs').upsert({
    id: config.id,
    label: config.label,
    amount: config.amount,
    category: config.category,
    sub_category: config.subCategory,
    beneficiary_id: config.beneficiaryId,
    account_id: config.accountId, // owner_id -> account_id
    day_of_month: config.dayOfMonth,
    start_month: config.startMonth,
    end_month: config.endMonth,
    is_extra: config.isExtra
  });
};
export const apiDeleteConfig = async (id: string) => {
  return await supabase.from('expense_configs').delete().eq('id', id);
};

// --- INCOMES (REVENUS) ---
export const apiUpsertIncome = async (income: IncomeConfig) => {
  return await supabase.from('income_configs').upsert({
    id: income.id,
    label: income.label,
    amount: income.amount,
    account_id: income.accountId, // owner_id -> account_id
    beneficiary_id: income.beneficiaryId,
    day_of_month: income.dayOfMonth,
    category: income.category
  });
};
export const apiDeleteIncome = async (id: string) => {
  return await supabase.from('income_configs').delete().eq('id', id);
};

// --- PAID ITEMS ---
export const apiSetPaidStatus = async (details: PaidItemDetails | null, instanceId: string) => {
  if (details) {
    return await supabase.from('paid_items').upsert({ 
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
    return await supabase.from('paid_items').delete().eq('instance_id', instanceId);
  }
};