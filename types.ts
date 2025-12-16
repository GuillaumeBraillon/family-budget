
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
  ownerId: string; // Lien vers Person.id (Propriétaire légal du compte)
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
  beneficiaryId: string; // Lien vers Person.id
  accountId: string;     // Compte débité
  type: TransactionType;
  initiatedBy: string;   // Lien vers Person.id (Celui qui a fait la CB)
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
  beneficiaryId: string; // Lien vers Person.id (Qui profite de la dépense ?)
  ownerId: string;       // Lien vers Account.id (Quel compte est débité ?)
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
  ownerId: string;       // Lien vers Account.id (Quel compte reçoit l'argent ?)
  beneficiaryId: string; // Lien vers Person.id (Qui a gagné cet argent ?)
  dayOfMonth: number;
  category: string; 
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
  amount: number;         // Montant Effectif (Réel si payé, sinon Prévu)
  originalAmount: number; // Montant Initial (Configuration) pour calcul d'écart
  // isPaid est dérivé de la présence ou non dans paidItems
  paidDetails?: PaidItemDetails; 
  isPaid?: boolean; // Propriété ajoutée pour le statut de paiement
  category: string;
  subCategory?: string;
  beneficiaryId: string;
  isExtra?: boolean;
  ownerId: string; // ID du compte prévu (ExpenseConfig.ownerId)
  startMonth?: string;
  endMonth?: string;
}

export interface WeeklyBudget {
  weekNumber: number;
  label: string;
  items: PlannedItem[];
}
