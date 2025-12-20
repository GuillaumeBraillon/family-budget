
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
  isJoint?: boolean; // Identifie le compte pivot pour la trésorerie
  // Nouveaux champs pour la logique de répartition
  targetRatio?: number; // Pourcentage (ex: 30 pour 30%)
  targetCap?: number;   // Plafond en euros (ex: 50)
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
  type: AccountType; // Lien direct avec le type de compte
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
}

export type PeriodType = 'FIXED_DAYS' | 'CALENDAR_WEEKS' | 'CUSTOM_SPLIT';

export interface AppSettings {
  monthly_envelope: number;
  period_type: PeriodType;
  period_value: number;
  // savings_labels et variable_labels sont injectés par useBudget pour l'UI (rétrocompatibilité)
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
  isManual?: boolean; // Nouveau champ pour distinguer les ajouts manuels
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
  startDate: number;
  endDate: number;
  periodLimit?: number;
}
