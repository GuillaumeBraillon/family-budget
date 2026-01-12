import {
  Person,
  Account,
  CategoryDef,
  SubCategory,
  ExpenseConfig,
  IncomeConfig,
  PaidItemDetails,
  AppSettings,
  AccountType,
  VariableTransaction,
  SavedLabel,
  Transfer,
  Tag,
  AuthorizedUser,
  TagAmount,
} from "../types";
import {
  DbPerson,
  DbAuthorizedUser,
  DbTag,
  DbPaidItemTag,
  DbAccount,
  DbCategory,
  DbSubCategory,
  DbSavedLabel,
  DbExpenseConfig,
  DbIncomeConfig,
  DbPaidItem,
  DbTransfer,
  DbSettings,
} from "./dbTypes";

export const mapDbPerson = (person: DbPerson): Person => ({
  id: person.id,
  name: person.name,
  isChild: person.is_child,
});

export const mapDbAuthorizedUser = (user: DbAuthorizedUser): AuthorizedUser => {
  return {
    email: user.email,
    name: user.name,
    avatarUrl: user.avatar_url,
    isAllowed: !!user.is_allowed,
    addedAt: user.added_at,
    addedBy: user.added_by,
    lastLoginAt: user.last_login_at,
    notes: user.notes,
  };
};

export const mapDbTag = (tag: DbTag): Tag => ({
  id: tag.id,
  name: tag.name,
  color: tag.color,
});

export const mapDbTagAmount = (tagAmount: DbPaidItemTag): TagAmount => ({
  tagId: tagAmount.tag_id,
  amount: Number(tagAmount.amount),
  isExtra: !!tagAmount.is_extra,
});

export const mapDbAccount = (account: DbAccount): Account => ({
  id: account.id,
  name: account.name,
  type: account.type as AccountType,
  ownerId: account.owner_id,
  currentBalance: account.current_balance ?? 0,
  bankName: account.bank_name,
  isJoint: !!account.is_joint,
  targetRatio: account.target_ratio !== null && account.target_ratio !== undefined ? Number(account.target_ratio) : undefined,
  targetCap: account.target_cap !== null && account.target_cap !== undefined ? Number(account.target_cap) : undefined,
});

export const mapDbSubCategory = (subCategory: DbSubCategory): SubCategory => ({
  id: subCategory.id,
  name: subCategory.name,
  categoryId: subCategory.category_id,
  createdAt: subCategory.created_at,
});

export const mapDbCategory = (category: DbCategory, subCategories: DbSubCategory[] = []): CategoryDef => ({
  id: category.id,
  name: category.name,
  type: (category.type as "EXPENSE" | "INCOME") || "EXPENSE",
  subCategories: subCategories.filter((sc) => sc.category_id === category.id).map(mapDbSubCategory),
});

export const mapDbSavedLabel = (label: DbSavedLabel): SavedLabel => ({
  id: label.id,
  name: label.name,
  type: label.type as AccountType,
  isExpense: label.is_expense !== false, // Default true si null/undefined pour rétrocompatibilité
  categoryId: label.category_id,
  subCategoryId: label.sub_category_id,
  accountId: label.account_id,
  beneficiaryId: label.beneficiary_id,
});

export const mapDbExpenseConfig = (config: DbExpenseConfig): ExpenseConfig => ({
  id: config.id,
  label: config.label,
  amount: config.amount ?? 0,
  category: config.category,
  subCategory: config.sub_category,
  beneficiaryId: config.beneficiary_id,
  accountId: config.account_id,
  dayOfMonth: config.day_of_month,
  startMonth: config.start_month || undefined,
  endMonth: config.end_month || undefined,
  isExtra: !!config.is_extra,
});

export const mapDbIncomeConfig = (income: DbIncomeConfig): IncomeConfig => ({
  id: income.id,
  label: income.label,
  amount: income.amount ?? 0,
  accountId: income.account_id,
  beneficiaryId: income.beneficiary_id,
  dayOfMonth: income.day_of_month,
  category: income.category,
  subCategory: income.sub_category,
  isExtra: !!income.is_extra,
  isSalary: !!income.is_salary,
  startMonth: income.start_month || undefined,
  endMonth: income.end_month || undefined,
});

export const mapDbPaidItem = (item: DbPaidItem): PaidItemDetails => ({
  instanceId: item.instance_id,
  amount: Number(item.amount),
  paymentDate: item.payment_date,
  accountId: item.account_id,
  beneficiaryId: item.beneficiary_id,
  label: item.label,
  category: item.category,
  subCategory: item.sub_category,
  type: item.type || "EXPENSE",
  isVariable: !!item.is_variable,
  isWaiting: !!item.is_waiting,
  isExtra: !!item.is_extra,
  comments: item.comments || undefined,
  position: item.position !== null ? Number(item.position) : undefined,
});

export const mapDbTransfer = (transfer: DbTransfer): Transfer => ({
  id: transfer.id,
  date: transfer.date,
  label: transfer.label,
  amount: Number(transfer.amount),
  sourceAccountId: transfer.source_account_id,
  destinationAccountId: transfer.destination_account_id,
  createdAt: transfer.created_at,
  position: transfer.position !== null ? Number(transfer.position) : undefined,
  isInterest: !!transfer.is_interest,
});

export const mapDbVariableTransaction = (transaction: DbPaidItem): VariableTransaction => ({
  id: transaction.id || transaction.instance_id, // Utiliser id si disponible, sinon instance_id
  date: transaction.date || transaction.payment_date, // Utiliser date si disponible, sinon payment_date
  label: transaction.label,
  amount: Number(transaction.amount),
  category: transaction.category,
  subCategory: transaction.sub_category,
  accountId: transaction.account_id,
  beneficiaryId: transaction.beneficiary_id,
  type: transaction.type || "EXPENSE",
  isWaiting: !!transaction.is_waiting,
  isExtra: !!transaction.is_extra,
  comments: transaction.comments || undefined,
  position: transaction.position !== null ? Number(transaction.position) : undefined,
});

export const mapDbSettings = (data: DbSettings | null): AppSettings => {
  if (!data) return { monthly_envelope: 2000, period_type: "FIXED_DAYS", period_value: 7, carryover_strategy: "NEXT_PERIOD" };
  return {
    monthly_envelope: Number(data.monthly_envelope || 2000),
    period_type: (data.period_type || "FIXED_DAYS") as "FIXED_DAYS" | "CALENDAR_WEEKS" | "CUSTOM_SPLIT",
    period_value: Number(data.period_value || 7),
    carryover_strategy: (data.carryover_strategy || "NEXT_PERIOD") as "NEXT_PERIOD" | "SPREAD_REMAINING",
  };
};
