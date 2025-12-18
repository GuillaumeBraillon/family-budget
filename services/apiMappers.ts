
import { Person, Account, CategoryDef, ExpenseConfig, IncomeConfig, PaidItemDetails, AppSettings, AccountType } from '../types';

/**
 * Mappe un enregistrement de la table 'people' vers le type Person.
 */
export const mapDbPerson = (p: any): Person => ({
  id: p.id,
  name: p.name,
  isChild: p.is_child
});

/**
 * Mappe un enregistrement de la table 'accounts' vers le type Account.
 */
export const mapDbAccount = (a: any): Account => ({
  id: a.id,
  name: a.name,
  type: a.type as AccountType,
  ownerId: a.owner_id,
  currentBalance: a.current_balance ?? 0,
  bankName: a.bank_name
});

/**
 * Mappe un enregistrement de la table 'categories' vers le type CategoryDef.
 */
export const mapDbCategory = (c: any): CategoryDef => ({
  id: c.id,
  name: c.name,
  type: c.type || 'EXPENSE',
  subCategories: c.sub_categories || []
});

/**
 * Mappe un enregistrement de la table 'expense_configs' vers le type ExpenseConfig.
 */
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
  isExtra: c.is_extra
});

/**
 * Mappe un enregistrement de la table 'income_configs' vers le type IncomeConfig.
 */
export const mapDbIncomeConfig = (i: any): IncomeConfig => ({
  id: i.id,
  label: i.label,
  amount: i.amount ?? 0,
  accountId: i.account_id,
  beneficiaryId: i.beneficiary_id,
  dayOfMonth: i.day_of_month,
  category: i.category,
  subCategory: i.sub_category
});

/**
 * Mappe un enregistrement de la table 'paid_items' vers le type PaidItemDetails.
 */
export const mapDbPaidItem = (item: any): PaidItemDetails => ({
  instanceId: item.instance_id,
  amount: item.amount,
  paymentDate: item.payment_date,
  accountId: item.account_id,
  beneficiaryId: item.beneficiary_id,
  label: item.label,
  category: item.category,
  subCategory: item.sub_category
});

/**
 * Mappe un enregistrement de la table 'app_settings' vers le type AppSettings.
 */
export const mapDbSettings = (data: any): AppSettings => {
  if (!data) return { monthly_envelope: 2000, period_type: 'FIXED_DAYS', period_value: 7 };
  return {
    // Modification ici : On lit 'monthly_envelope' directement depuis la DB
    monthly_envelope: Number(data.monthly_envelope || 2000),
    period_type: (data.period_type || 'FIXED_DAYS') as any,
    period_value: Number(data.period_value || 7)
  };
};
