
import { Person, Account, CategoryDef, ExpenseConfig, IncomeConfig, PaidItemDetails, AppSettings, AccountType, SavingsTransaction, VariableTransaction, SavedLabel } from '../types';

export const mapDbPerson = (p: any): Person => ({
  id: p.id,
  name: p.name,
  isChild: p.is_child
});

export const mapDbAccount = (a: any): Account => ({
  id: a.id,
  name: a.name,
  type: a.type as AccountType,
  ownerId: a.owner_id,
  currentBalance: a.current_balance ?? 0,
  bankName: a.bank_name,
  isJoint: !!a.is_joint,
  targetRatio: a.target_ratio !== null && a.target_ratio !== undefined ? Number(a.target_ratio) : undefined,
  targetCap: a.target_cap !== null && a.target_cap !== undefined ? Number(a.target_cap) : undefined
});

export const mapDbCategory = (c: any): CategoryDef => ({
  id: c.id,
  name: c.name,
  type: c.type || 'EXPENSE',
  subCategories: c.sub_categories || []
});

export const mapDbSavedLabel = (l: any): SavedLabel => ({
  id: l.id,
  name: l.name,
  type: l.type,
  isExpense: l.is_expense !== false // Default true si null/undefined pour rétrocompatibilité
});

export const mapDbExpenseConfig = (c: any): ExpenseConfig => ({
  id: c.id,
  label: c.label,
  amount: c.amount ?? 0,
  category: c.category,
  subCategory: c.sub_category,
  beneficiaryId: c.beneficiary_id,
  accountId: c.account_id,
  dayOfMonth: c.day_of_month,
  startMonth: c.start_month,
  endMonth: c.end_month,
  isExtra: !!c.is_extra
});

export const mapDbIncomeConfig = (i: any): IncomeConfig => ({
  id: i.id,
  label: i.label,
  amount: i.amount ?? 0,
  accountId: i.account_id,
  beneficiaryId: i.beneficiary_id,
  dayOfMonth: i.day_of_month,
  category: i.category,
  subCategory: i.sub_category,
  isExtra: !!i.is_extra,
  isSalary: !!i.is_salary
});

export const mapDbPaidItem = (item: any): PaidItemDetails => ({
  instanceId: item.instance_id,
  amount: Number(item.amount),
  paymentDate: item.payment_date,
  accountId: item.account_id,
  beneficiaryId: item.beneficiary_id,
  label: item.label,
  category: item.category,
  subCategory: item.sub_category,
  type: item.type || 'EXPENSE',
  isVariable: !!item.is_variable,
  isWaiting: !!item.is_waiting,
  isExtra: !!item.is_extra,
  comments: item.comments || undefined
});

export const mapDbSavingsTransaction = (t: any): SavingsTransaction => ({
  id: t.id,
  accountId: t.account_id,
  date: t.date,
  label: t.label,
  amount: Number(t.amount)
});

export const mapDbVariableTransaction = (t: any): VariableTransaction => ({
  id: t.id,
  date: t.date,
  label: t.label,
  amount: Number(t.amount),
  category: t.category,
  subCategory: t.sub_category,
  accountId: t.account_id,
  beneficiaryId: t.beneficiary_id,
  type: t.type || 'EXPENSE',
  isWaiting: !!t.is_waiting,
  isExtra: !!t.is_extra,
  comments: t.comments || undefined
});

export const mapDbSettings = (data: any): AppSettings => {
  if (!data) return { monthly_envelope: 2000, period_type: 'FIXED_DAYS', period_value: 7 };
  return {
    monthly_envelope: Number(data.monthly_envelope || 2000),
    period_type: (data.period_type || 'FIXED_DAYS') as any,
    period_value: Number(data.period_value || 7)
  };
};
