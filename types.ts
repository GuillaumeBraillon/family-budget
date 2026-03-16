export enum AccountType {
  CHECKING = "COURANT",
  SAVINGS = "EPARGNE",
  TRANSFER = "VIREMENT",
}

export interface Person {
  id: string;
  name: string;
  isChild?: boolean;
  displayOrder?: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface TagAmount {
  tagId: string;
  amount: number;
  isExtra?: boolean; // Indique si ce montant est hors budget
}

export interface BeneficiaryAmount {
  beneficiaryId: string;
  amount: number;
}

export interface AuthorizedUser {
  email: string;
  name?: string;
  avatarUrl?: string;
  isAllowed: boolean;
  addedAt?: string;
  addedBy?: string;
  lastLoginAt?: string;
  isAdmin?: boolean;
  notes?: string;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  ownerId: string;
  currentBalance: number;
  bankName?: string;
  isJoint?: boolean;
}

export interface SubCategory {
  id: string;
  name: string;
  categoryId: string;
  createdAt?: string;
}

export interface CategoryDef {
  id: string;
  name: string;
  type: "EXPENSE" | "INCOME";
  subCategories: SubCategory[]; // Maintenant un tableau d'objets au lieu de strings
}

export interface SavedLabel {
  id: string;
  name: string;
  type: AccountType;
  isExpense: boolean;
  categoryId?: string; // Catégorie suggérée pour auto-complétion
  subCategoryId?: string; // Sous-catégorie suggérée pour auto-complétion
  accountId?: string; // Compte suggéré pour auto-complétion
  beneficiaryId?: string; // Bénéficiaire suggéré pour auto-complétion
}

export enum TransactionType {
  DEBIT = "DEBIT",
  CREDIT = "CREDIT",
}

export interface Transfer {
  id: string;
  date: string;
  label: string;
  amount: number;
  sourceAccountId: string;
  destinationAccountId: string;
  createdAt?: string;
  isInterest?: boolean; // Indique si le virement est un ajout d'intérêts ou un ajustement exceptionnel
}

export interface SavingsTransaction {
  id: string;
  date: string;
  label: string;
  amount: number;
  accountId: string;
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
  beneficiaryAmounts?: BeneficiaryAmount[];
  type: "EXPENSE" | "INCOME";
  isRefund?: boolean;
  isWaiting: boolean; // True = En attente, False = Pointé
  isExtra: boolean; // True = Hors budget
  comments?: string;
  tagAmounts?: TagAmount[]; // Ventilation des montants par tag
  position?: number; // Tri manuel (legacy/compat)
}

export type PeriodType = "FIXED_DAYS" | "CALENDAR_WEEKS" | "CUSTOM_SPLIT";
export type SortOrder = "asc" | "desc";

export interface AppSettings {
  personal_budget_amount?: number;
  family_variable_budget?: number;
  period_type: PeriodType;
  period_value: number;
  savings_labels?: string[];
  variable_labels?: string[];
  operations_sorting?: string[];
  accounts_sorting?: string[];
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
  tagAmounts?: TagAmount[]; // Ventilation des montants par tag
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
  startMonth?: string;
  endMonth?: string;
  tagAmounts?: TagAmount[]; // Ventilation des montants par tag
}

export interface PaidItemDetails {
  instanceId: string;
  amount: number;
  paymentDate: string;
  accountId: string;
  beneficiaryAmounts?: BeneficiaryAmount[];
  label: string;
  category: string;
  subCategory?: string;
  type: "EXPENSE" | "INCOME";
  isRefund?: boolean;
  isSalary?: boolean;
  isVariable: boolean;
  isWaiting: boolean;
  isExtra: boolean;
  comments?: string;
  tagAmounts?: TagAmount[]; // Ventilation des montants par tag
}

export type PlannedItemType = "EXPENSE" | "INCOME";

export interface PlannedItem {
  type: PlannedItemType;
  source: "RECURRING" | "VARIABLE";
  configId: string;
  instanceId: string;
  day: number;
  label: string;
  amount: number;
  originalAmount: number;
  paidDetails?: PaidItemDetails;
  isPaid: boolean; // Pour l'UI : inverse de isWaiting
  isWaiting: boolean; // Pour la logique métier
  category: string;
  subCategory?: string;
  beneficiaryId: string;
  beneficiaryAmounts?: BeneficiaryAmount[];
  isExtra: boolean; // Calculé : true si toggle global OU au moins un tag Extra
  isExtraGlobal: boolean; // Toggle global uniquement (sans tags)
  isRefund?: boolean;
  isSalary?: boolean; // Propagation de l'info structurelle
  accountId: string;
  startMonth?: string;
  endMonth?: string;
  comments?: string;
  tagAmounts?: TagAmount[]; // Ventilation des montants par tag
}

export interface WeeklyBudget {
  weekNumber: number;
  label: string;
  items: PlannedItem[];
  startDate: number;
  endDate: number;
  periodLimit?: number;
}

export interface NameAmountDetail {
  name: string;
  amount: number;
}

export interface ConsumedDetail {
  beneficiaryId: string;
  name: string;
  amount: number;
  available: number;
  remaining: number;
}

export interface AllowanceContext {
  allowancePerBeneficiary: number;
  previousCarryoverTotal: number;
  availableMonthlyAllowance: number;
  carryoverByBeneficiary: Record<string, number>;
}

export interface FamilyVariableNetBreakdown {
  nature: {
    standard: number;
    refunds: number;
    extra: number;
    total: number;
  };
  status: {
    real: number;
    waiting: number;
    realStandard: number;
    waitingStandard: number;
    realExtra: number;
    waitingExtra: number;
  };
}

export interface FamilyVariablePeriodCarryovers {
  periodBudgets: number[];
  periodRemaining: number[];
  monthBudget: number;
  monthSpent: number;
  monthRemaining: number;
}

export interface AccountBalanceStats {
  paid: number;
  remaining: number;
  remainingStandard: number;
  paidStandard: number;
  planned?: number;
  pendingCount?: number;
}

export interface BalancesStats {
  fixedToPay: number;
  fixedDelays: number;
  byAccount: Record<string, AccountBalanceStats>;
}

export interface BalanceRowCalculation {
  sharePercent?: number;
  theoreticalAmount?: number;
  isContributor?: boolean;
  jointDebts?: number;
  jointGap?: number;
  fromPersonals?: number;
  fromLdds?: number;
}

export interface BalanceRow {
  id: string;
  name: string;
  owner: string;
  balance: number;
  target: number;
  transfer: number;
  isJoint: boolean;
  pendingAmount?: number;
  pendingStandard?: number;
  pendingExtra?: number;
  paidAmount?: number;
  paidStandard?: number;
  paidExtra?: number;
  calculation?: BalanceRowCalculation;
}

export interface OperationFilters {
  flux: "EXPENSE" | "INCOME" | "ALL";
  source: "RECURRING" | "VARIABLE" | "ALL";
  status: "WAITING" | "REAL" | "ALL";
  nature: "ALL" | "ONLY" | "EXCLUDE";
  transfer: "ALL" | "ONLY" | "EXCLUDE";
  salary: "ALL" | "ONLY" | "EXCLUDE";
  accountIds: string[];
  beneficiaryIds: string[];
  // Nouveau système de Tags
  includedTagIds: string[];
  excludedTagIds: string[];
  tagPresence: "ALL" | "WITH_TAGS" | "WITHOUT_TAGS";
}
