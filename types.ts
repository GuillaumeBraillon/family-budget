
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

// Structure pour la gestion des catégories dynamiques (UNIFIÉE)
export interface CategoryDef {
  id: string; 
  name: string;
  type: 'EXPENSE' | 'INCOME'; // Nouveau champ de distinction
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

// NOUVEAU : Configuration des revenus récurrents
export interface IncomeConfig {
  id: string;
  label: string;
  amount: number;
  ownerId: string; // Le compte qui REÇOIT l'argent (ex: Compte Joint pour la CAF)
  beneficiaryId: string; // La personne concernée par ce revenu (ex: Guillaume pour son salaire)
  dayOfMonth: number;
  category: string; // Ex: 'Salaire', 'CAF', 'Rente'
}

// NOUVEAU : Détails complets d'un paiement effectué (Table paid_items)
export interface PaidItemDetails {
  instanceId: string;
  amount: number;
  paymentDate: string;
  accountId: string; // Compte réellement débité
  beneficiaryId: string;
  label: string;
  category: string;
  subCategory?: string;
}

export type PlannedItemType = 'EXPENSE' | 'INCOME';

export interface PlannedItem {
  type: PlannedItemType; // Pour distinguer Dépense vs Revenu dans le Planner
  configId: string;
  instanceId: string;
  day: number;
  label: string;
  amount: number;
  // isPaid est dérivé de la présence ou non dans paidItems
  paidDetails?: PaidItemDetails; 
  isPaid?: boolean; // Propriété ajoutée pour le statut de paiement
  category: string;
  subCategory?: string;
  beneficiaryId: string;
  isExtra?: boolean;
  ownerId: string; // Propriétaire théorique (celui de la config)
  startMonth?: string;
  endMonth?: string;
}

export interface WeeklyBudget {
  weekNumber: number;
  label: string;
  items: PlannedItem[];
}
