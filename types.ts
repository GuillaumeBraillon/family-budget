
export enum AccountType {
  CHECKING = 'COURANT',
  SAVINGS = 'EPARGNE'
}

export interface Person {
  id: string;
  name: string;
  isChild?: boolean;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  ownerId: string;
  currentBalance: number;
  bankName?: string;
}

export interface CategoryDef {
  id: string; 
  name: string;
  type: 'EXPENSE' | 'INCOME';
  subCategories: string[];
}

export enum TransactionType {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT'
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  subCategory?: string;
  beneficiaryId: string;
  accountId: string;
  type: TransactionType;
  initiatedBy: string;
}

export interface AppSettings {
  weekly_envelope: number;
}

export interface ExpenseConfig {
  id: string;
  label: string;
  amount: number;
  category: string;
  subCategory?: string;
  beneficiaryId: string;
  accountId: string;
  dayOfMonth: number;
  startMonth?: string;
  endMonth?: string;
  isExtra?: boolean;
}

export interface IncomeConfig {
  id: string;
  label: string;
  amount: number;
  accountId: string;
  beneficiaryId: string;
  dayOfMonth: number;
  category: string; 
  subCategory?: string;
}

export interface PaidItemDetails {
  instanceId: string;
  amount: number;
  paymentDate: string;
  accountId: string;
  beneficiaryId: string;
  label: string;
  category: string;
  subCategory?: string;
}

export type PlannedItemType = 'EXPENSE' | 'INCOME';

export interface PlannedItem {
  type: PlannedItemType;
  configId: string;
  instanceId: string;
  day: number;
  label: string;
  amount: number;
  originalAmount: number;
  paidDetails?: PaidItemDetails; 
  isPaid?: boolean;
  category: string;
  subCategory?: string;
  beneficiaryId: string;
  isExtra?: boolean;
  accountId: string;
  startMonth?: string;
  endMonth?: string;
}

export interface WeeklyBudget {
  weekNumber: number;
  label: string;
  items: PlannedItem[];
}
