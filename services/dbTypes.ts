/**
 * Types pour les données provenant de Supabase (snake_case)
 * Ces types correspondent à la structure de la base de données PostgreSQL
 */

export interface DbPerson {
  id: string;
  name: string;
  is_child: boolean;
  display_order?: number;
}

export interface DbAuthorizedUser {
  email: string;
  name?: string;
  avatar_url?: string;
  is_allowed: boolean;
  added_at?: string;
  added_by?: string;
  last_login_at?: string;
  is_admin?: boolean;
  notes?: string;
}

export interface DbPaidItemBeneficiary {
  id: string;
  paid_item_instance_id: string;
  beneficiary_id: string;
  amount: number;
  created_at: string;
}

export interface DbAccount {
  id: string;
  name: string;
  type: string;
  owner_id: string;
  current_balance: number | null;
  bank_name?: string | null;
  is_joint: boolean;
}

export interface DbCategory {
  id: string;
  name: string;
  type: string;
  // sub_categories supprimé - voir table sub_categories relationnelle
}

export interface DbSubCategory {
  id: string;
  name: string;
  category_id: string;
  created_at: string;
}

export interface DbSavedLabel {
  id: string;
  name: string;
  type: string;
  is_expense: boolean;
  category_id?: string;
  sub_category_id?: string;
  account_id?: string;
  beneficiary_id?: string;
}

export interface DbExpenseConfig {
  id: string;
  label: string;
  amount: number | null;
  category: string;
  sub_category?: string | null;
  beneficiary_id: string;
  account_id: string;
  day_of_month: number;
  start_month?: string | null;
  end_month?: string | null;
  is_extra: boolean;
}

export interface DbIncomeConfig {
  id: string;
  label: string;
  amount: number | null;
  account_id: string;
  beneficiary_id: string;
  day_of_month: number;
  category: string;
  sub_category?: string | null;
  is_extra: boolean;
  is_salary: boolean;
  start_month?: string | null;
  end_month?: string | null;
}

export interface DbPaidItem {
  id?: string; // ID technique auto-généré par Supabase
  instance_id: string;
  amount: number;
  payment_date: string;
  account_id: string;
  label: string;
  category: string;
  sub_category?: string | null;
  type: "EXPENSE" | "INCOME" | null;
  is_variable: boolean;
  is_waiting: boolean;
  is_extra: boolean;
  is_refund?: boolean;
  is_salary?: boolean;
  comments?: string | null;
  date?: string; // Alias de payment_date pour compatibilité
}

export interface DbTransfer {
  id: string;
  date: string;
  label: string;
  amount: number;
  source_account_id: string | null;
  destination_account_id: string;
  created_at?: string;
  is_interest?: boolean;
}

export interface DbSettings {
  id: string;
  personal_budget_amount?: number;
  family_variable_budget?: number;
  period_type: string;
  period_value: number;
  operations_sorting?: string[];
  accounts_sorting?: string[];
}
