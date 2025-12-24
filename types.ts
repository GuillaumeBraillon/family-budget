
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
  isJoint?: boolean;
  targetRatio?: number;
  targetCap?: number;
}

export interface CategoryDef {
  id: string; 
  name: string;
  type: 'EXPENSE' | 'INCOME';
  subCategories: string[];
}

export interface SavedLabel {
  id: string;
  name: string;
  type: AccountType;
  isExpense: boolean;
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

export interface SavingsTransaction {
  id: string;
  accountId: string;
  date: string;
  label: string;
  amount: number;
}

export interface VariableTransaction {
  id: string;
  date: string;
  label: string;
  amount: number;
  category: string;
  subCategory?: string;
  accountId: string;
  beneficiaryId?: string;
  type: 'EXPENSE' | 'INCOME';
  isWaiting: boolean; // True = En attente, False = Pointé
  isExtra: boolean;   // True = Hors budget
  comments?: string;
}

export type PeriodType = 'FIXED_DAYS' | 'CALENDAR_WEEKS' | 'CUSTOM_SPLIT';

export interface AppSettings {
  monthly_envelope: number;
  period_type: PeriodType;
  period_value: number;
  savings_labels?: string[];
  variable_labels?: string[];
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
  isExtra?: boolean;
  isSalary?: boolean; // Nouveau champ pour identifier les revenus structurels
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
  type: 'EXPENSE' | 'INCOME';
  isVariable: boolean;
  isWaiting: boolean;
  isExtra: boolean;
  comments?: string;
}

export type PlannedItemType = 'EXPENSE' | 'INCOME';

export interface PlannedItem {
  type: PlannedItemType;
  source: 'RECURRING' | 'VARIABLE';
  configId: string;
  instanceId: string;
  day: number;
  label: string;
  amount: number;
  originalAmount: number;
  paidDetails?: PaidItemDetails; 
  isPaid: boolean;      // Pour l'UI : inverse de isWaiting
  isWaiting: boolean;   // Pour la logique métier
  category: string;
  subCategory?: string;
  beneficiaryId: string;
  isExtra: boolean;
  isSalary?: boolean;   // Propagation de l'info structurelle
  accountId: string;
  startMonth?: string;
  endMonth?: string;
  comments?: string;
}

export interface WeeklyBudget {
  weekNumber: number;
  label: string;
  items: PlannedItem[];
  startDate: number;
  endDate: number;
  periodLimit?: number;
}

export interface OperationFilters {
  flux: 'EXPENSE' | 'INCOME' | 'ALL';
  source: 'RECURRING' | 'VARIABLE' | 'ALL';
  status: 'WAITING' | 'REAL' | 'ALL';
  extra: 'ALL' | 'ONLY' | 'EXCLUDE';
  transfer: 'ALL' | 'ONLY' | 'EXCLUDE';
  salary: 'ALL' | 'ONLY' | 'EXCLUDE';
  accountIds: string[];
  beneficiaryIds: string[];
}
