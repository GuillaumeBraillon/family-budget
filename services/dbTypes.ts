/**
 * Types pour les données provenant de Supabase (snake_case)
 * Ces types correspondent à la structure de la base de données PostgreSQL
 */

export interface DbPerson {
  id: string;
  name: string;
  is_child: boolean;
}

export interface DbAuthorizedUser {
  email: string;
  name?: string;
  avatar_url?: string;
  is_allowed: boolean;
  added_at?: string;
  added_by?: string;
  last_login_at?: string;
  notes?: string;
}

export interface DbTag {
  id: string;
  name: string;
  color: string;
}

export interface DbPaidItemTag {
  id: string;
  paid_item_instance_id: string;
  tag_id: string;
  amount: number;
  is_extra?: boolean;
  created_at: string;
}

export interface DbAccount {
  id: string;
  name: string;
  type: string;
  owner_id: string;
  current_balance: number;
  bank_name?: string;
  is_joint: boolean;
  target_ratio?: number;
  target_cap?: number;
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
  amount: number;
  category: string;
  sub_category?: string;
  beneficiary_id: string;
  account_id: string;
  day_of_month: number;
  start_month?: string;
  end_month?: string;
  is_extra: boolean;
  tag_ids?: string[];
}

export interface DbIncomeConfig {
  id: string;
  label: string;
  amount: number;
  account_id: string;
  beneficiary_id: string;
  day_of_month: number;
  category: string;
  sub_category?: string;
  is_extra: boolean;
  is_salary: boolean;
  start_month?: string;
  end_month?: string;
  tag_ids?: string[];
}

export interface DbPaidItem {
  id?: string; // ID technique auto-généré par Supabase
  instance_id: string;
  amount: number;
  payment_date: string;
  account_id: string;
  beneficiary_id: string;
  label: string;
  category: string;
  sub_category?: string;
  type: "EXPENSE" | "INCOME";
  is_variable: boolean;
  is_waiting: boolean;
  is_extra: boolean;
  comments?: string;
  date?: string; // Alias de payment_date pour compatibilité
  tag_ids?: string[];
  position?: number;
}

export interface DbTransfer {
  id: string;
  date: string;
  label: string;
  amount: number;
  source_account_id: string;
  destination_account_id: string;
  created_at?: string;
  position?: number;
  is_interest?: boolean;
}

export interface DbSettings {
  id: string;
  monthly_envelope: number;
  period_type: string;
  period_value: number;
  carryover_strategy?: string;
}
