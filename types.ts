export enum AccountType {
  CHECKING = 'COURANT',
  SAVINGS = 'EPARGNE'
}

// "Owner" n'est plus un enum, c'est une référence d'ID vers une Personne
export interface Person {
  id: string;
  name: string;
  isChild?: boolean; // Pour savoir si c'est un payeur potentiel ou juste un bénéficiaire (ex: enfant mineur)
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  ownerId: string; // Lien vers Person.id
  currentBalance: number;
  bankName?: string;
}

// Structure pour la gestion des catégories dynamiques
export interface CategoryDef {
  id: string; // Ajout d'un ID pour faciliter le renommage
  name: string;
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
  beneficiaryId: string; // Lien vers Person.id (anciennement Beneficiary string)
  accountId: string;
  type: TransactionType;
  initiatedBy: string; // Lien vers Person.id (Celui qui a fait la CB)
}

export interface IncomeProfile {
  ownerId: string;
  monthlyNetIncome: number;
}

export interface ExpenseConfig {
  id: string;
  label: string;
  amount: number;
  category: string;
  subCategory?: string;
  beneficiaryId: string; // Lien vers Person.id
  ownerId: string;       // Lien vers Person.id (Celui qui paye)
  dayOfMonth: number;
  startMonth?: string;
  endMonth?: string;
  isExtra?: boolean;
}

export interface PlannedItem {
  configId: string;
  instanceId: string;
  day: number;
  label: string;
  amount: number;
  isPaid: boolean;
  category: string;
  subCategory?: string;
  beneficiaryId: string;
  isExtra?: boolean;
  ownerId: string;
}

export interface WeeklyBudget {
  weekNumber: number;
  label: string;
  items: PlannedItem[];
}