
import { Account, AccountType, Transaction, TransactionType, ExpenseConfig, CategoryDef, Person, IncomeConfig } from '../types';

// --- PERSONNES (FAMILLE) ---
export const INITIAL_PEOPLE: Person[] = [
  { id: 'p_guillaume', name: 'Guillaume', isChild: false },
  { id: 'p_nelly', name: 'Nelly', isChild: false },
  { id: 'p_oscar', name: 'Oscar', isChild: true },
  { id: 'p_eliott', name: 'Eliott', isChild: true },
  { id: 'p_joint', name: 'Commun', isChild: false } // Entité virtuelle pour "Pour nous deux" ou Compte Joint
];

export const MOCK_ACCOUNTS: Account[] = [
  { id: '1', name: 'Compte Perso Guillaume', type: AccountType.CHECKING, ownerId: 'p_guillaume', currentBalance: 1250.50, bankName: 'Boursorama' },
  { id: '2', name: 'Compte Perso Nelly', type: AccountType.CHECKING, ownerId: 'p_nelly', currentBalance: 840.20, bankName: 'Boursorama' }, 
  { id: '3', name: 'Compte Joint', type: AccountType.CHECKING, ownerId: 'p_joint', currentBalance: 2400.00, bankName: "Caisse d'Epargne" },
  { id: '4', name: 'LDDS', type: AccountType.SAVINGS, ownerId: 'p_joint', currentBalance: 8500.00, bankName: "Caisse d'Epargne" },
  { id: '5', name: 'Livret A', type: AccountType.SAVINGS, ownerId: 'p_joint', currentBalance: 15400.00, bankName: "Caisse d'Epargne" }
];

// --- REVENUS RÉCURRENTS (NOUVEAU) ---
// ownerId correspond maintenant aux IDs des comptes (1, 2, 3)
export const MOCK_INCOME_CONFIGS: IncomeConfig[] = [
  { id: 'inc_1', label: 'Salaire Guillaume', amount: 3200, dayOfMonth: 28, ownerId: '1', beneficiaryId: 'p_guillaume', category: 'Salaire' },
  { id: 'inc_2', label: 'Salaire Nelly', amount: 2100, dayOfMonth: 27, ownerId: '2', beneficiaryId: 'p_nelly', category: 'Salaire' },
  { id: 'inc_3', label: 'Allocations Familiales', amount: 142.50, dayOfMonth: 5, ownerId: '3', beneficiaryId: 'p_joint', category: 'CAF' },
];

// --- NOUVELLES CATÉGORIES ---
export const INITIAL_CATEGORIES: CategoryDef[] = [
    { id: 'cat_logement', name: 'Logement', type: 'EXPENSE', subCategories: ['Loyer', 'Electricité', 'Assurance habitation', 'Logement - Autres'] },
    { id: 'cat_alim', name: 'Alimentation & Restaurants', type: 'EXPENSE', subCategories: ['Supermarché / Epicerie', 'Restaurants', 'Alimentation - Autres'] },
    { id: 'cat_scol', name: 'Scolarité & Enfants', type: 'EXPENSE', subCategories: ['Ecole', 'Scolarité & Enfants - Autres'] },
    { id: 'cat_auto', name: 'Auto & Transports', type: 'EXPENSE', subCategories: ['Location de véhicule', 'Péage', 'Transports en commun', 'Stationnement', 'Entretien véhicule', 'Auto & Transports - Autres'] },
    { id: 'cat_sante', name: 'Santé', type: 'EXPENSE', subCategories: ['Dentiste', 'Médecin', 'Pharmacie', 'Mutuelle', 'Opticien / Ophtalmo.', 'Santé - Autres'] },
    { id: 'cat_shopping', name: 'Achats & Shopping', type: 'EXPENSE', subCategories: ['Vêtements/Chaussures', 'Achats & Shopping - Autres'] },
    { id: 'cat_virement', name: 'Retraits, Chq. et Vir.', type: 'EXPENSE', subCategories: [] },
    { id: 'cat_divers', name: 'Divers', type: 'EXPENSE', subCategories: ['Tabac', 'Autres dépenses'] },
    { id: 'cat_abo', name: 'Abonnements', type: 'EXPENSE', subCategories: ['Internet', 'Téléphonie mobile', 'Abonnements - Autres'] },
    { id: 'cat_loisirs', name: 'Loisirs & Sorties', type: 'EXPENSE', subCategories: [] },
    { id: 'cat_banque', name: 'Banque', type: 'EXPENSE', subCategories: ['Frais bancaires', 'Services Bancaires', 'Banque - Autres'] },
    { id: 'cat_vacances', name: 'Vacances', type: 'EXPENSE', subCategories: ['Logement', 'Transport', 'Vacances - Autres'] },
    { id: 'cat_soins', name: 'Esthétique & Soins', type: 'EXPENSE', subCategories: ['Coiffeur', 'Esthétique', 'Esthétique & Soins - Autres'] },
    { id: 'cat_impots', name: 'Impôts & Taxes', type: 'EXPENSE', subCategories: ['Amendes', 'Impôts sur le revenu', 'Impôts & Taxes - Autres'] },
    
    // REVENUS
    { id: 'inc_salaire', name: 'Salaire', type: 'INCOME', subCategories: [] },
    { id: 'inc_caf', name: 'CAF', type: 'INCOME', subCategories: [] },
    { id: 'inc_rente', name: 'Rente', type: 'INCOME', subCategories: [] },
    { id: 'inc_remb', name: 'Remboursement', type: 'INCOME', subCategories: [] }
];

// Helper dates
const today = new Date();
const getDaysAgo = (days: number) => {
  const date = new Date(today);
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};

// --- CONFIGURATION DES DÉPENSES ---
// ownerId pointe maintenant vers des Account IDs (1, 2, 3...)
export const MOCK_EXPENSE_CONFIGS: ExpenseConfig[] = [
  // SEMAINE 1
  { id: 'c1', label: 'Orange : Guillaume', amount: 20.99, dayOfMonth: 1, category: 'Abonnements', subCategory: 'Téléphonie mobile', beneficiaryId: 'p_guillaume', ownerId: '1' },
  { id: 'c2', label: 'Argent de poche Oscar', amount: 10.00, dayOfMonth: 1, category: 'Scolarité & Enfants', subCategory: 'Scolarité & Enfants - Autres', beneficiaryId: 'p_oscar', ownerId: '1' },
  { id: 'c3', label: 'Drivalia Lease (Voiture)', amount: 423.18, dayOfMonth: 1, category: 'Auto & Transports', subCategory: 'Location de véhicule', beneficiaryId: 'p_joint', ownerId: '3' },
  { id: 'c4', label: 'EDF Particuliers', amount: 112.35, dayOfMonth: 3, category: 'Logement', subCategory: 'Electricité', beneficiaryId: 'p_joint', ownerId: '3' },
  { id: 'c5', label: 'Acadomia (Cours)', amount: 130.00, dayOfMonth: 3, category: 'Scolarité & Enfants', subCategory: 'Ecole', beneficiaryId: 'p_eliott', ownerId: '3' },
  { id: 'c5b', label: 'Assoc St Marc (Cantine)', amount: 50.00, dayOfMonth: 3, category: 'Scolarité & Enfants', subCategory: 'Ecole', beneficiaryId: 'p_eliott', ownerId: '3' },
  { id: 'c_bouygues', label: 'Bouygues : Oscar', amount: 6.99, dayOfMonth: 4, category: 'Abonnements', subCategory: 'Téléphonie mobile', beneficiaryId: 'p_oscar', ownerId: '1' },
  { id: 'c_free', label: 'Free Telecom', amount: 55.98, dayOfMonth: 4, category: 'Abonnements', subCategory: 'Internet', beneficiaryId: 'p_joint', ownerId: '3' },
  { id: 'c_stmarc_cours', label: 'Assoc St Marc (Cours)', amount: 318.00, dayOfMonth: 7, category: 'Scolarité & Enfants', subCategory: 'Ecole', beneficiaryId: 'p_oscar', ownerId: '3' },
  { id: 'c_maif', label: 'Maif Niort (Assurance)', amount: 156.53, dayOfMonth: 7, category: 'Logement', subCategory: 'Assurance habitation', beneficiaryId: 'p_joint', ownerId: '3' },
  { id: 'c6', label: 'Faubourg Gestion (Loyer)', amount: 1204.88, dayOfMonth: 7, category: 'Logement', subCategory: 'Loyer', beneficiaryId: 'p_joint', ownerId: '3' },
  
  // SEMAINE 2
  { id: 'c_artis', label: 'ARTIS (Musique)', amount: 82.00, dayOfMonth: 9, category: 'Loisirs & Sorties', beneficiaryId: 'p_oscar', ownerId: '3' },
  { id: 'c_plug', label: 'Plug N Play', amount: 75.00, dayOfMonth: 9, category: 'Loisirs & Sorties', beneficiaryId: 'p_eliott', ownerId: '3' },
  { id: 'c_noveo', label: 'Noveocare', amount: 10.20, dayOfMonth: 10, category: 'Santé', subCategory: 'Mutuelle', beneficiaryId: 'p_joint', ownerId: '3' },
  { id: 'c_hp', label: 'HP (Imprimante)', amount: 1.49, dayOfMonth: 10, category: 'Abonnements', subCategory: 'Abonnements - Autres', beneficiaryId: 'p_joint', ownerId: '3' },
  { id: 'c7', label: 'Orange : Nelly', amount: 17.99, dayOfMonth: 10, category: 'Abonnements', subCategory: 'Téléphonie mobile', beneficiaryId: 'p_nelly', ownerId: '2' },
  
  // SEMAINE 3
  { id: 'c_rest_scol', label: 'Rest Scol Eliott', amount: 60.00, dayOfMonth: 16, category: 'Scolarité & Enfants', subCategory: 'Ecole', beneficiaryId: 'p_eliott', ownerId: '3' },
  { id: 'c_youtube', label: 'Google Youtube', amount: 16.99, dayOfMonth: 21, category: 'Abonnements', subCategory: 'Abonnements - Autres', beneficiaryId: 'p_joint', ownerId: '3' },

  // SEMAINE 4
  { id: 'c_ww_nelly', label: 'Weight Watcher Nelly', amount: 25.00, dayOfMonth: 23, category: 'Loisirs & Sorties', beneficiaryId: 'p_nelly', ownerId: '2' },
  
  // EXTRA
  { 
    id: 'c_impot_1', 
    label: 'Impôts (Tiers 1/3)', 
    amount: 329.00, 
    dayOfMonth: 25, 
    category: 'Impôts & Taxes', 
    subCategory: 'Impôts sur le revenu',
    beneficiaryId: 'p_joint',
    ownerId: '3', 
    isExtra: true,
    startMonth: '2025-10',
    endMonth: '2025-12'
  },
  {
    id: 'c_piscine',
    label: 'Abonnement Piscine (Été)',
    amount: 45.00,
    dayOfMonth: 15,
    category: 'Loisirs & Sorties',
    beneficiaryId: 'p_joint',
    ownerId: '3',
    startMonth: '2025-06',
    endMonth: '2025-09'
  }
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't6', date: getDaysAgo(1), description: 'Carrefour Drive', amount: 45.50, category: 'Alimentation & Restaurants', subCategory: 'Supermarché / Epicerie', beneficiaryId: 'p_joint', accountId: '3', type: TransactionType.DEBIT, initiatedBy: 'p_joint' },
  { id: 't7', date: getDaysAgo(2), description: 'Station Service', amount: 60.00, category: 'Auto & Transports', subCategory: 'Entretien véhicule', beneficiaryId: 'p_guillaume', accountId: '1', type: TransactionType.DEBIT, initiatedBy: 'p_guillaume' },
  { id: 't8', date: getDaysAgo(0), description: 'Tabac', amount: 15.00, category: 'Divers', subCategory: 'Tabac', beneficiaryId: 'p_guillaume', accountId: '1', type: TransactionType.DEBIT, initiatedBy: 'p_guillaume' },
  { id: 't9', date: getDaysAgo(1), description: 'Zara', amount: 89.90, category: 'Achats & Shopping', subCategory: 'Vêtements/Chaussures', beneficiaryId: 'p_nelly', accountId: '2', type: TransactionType.DEBIT, initiatedBy: 'p_nelly' },
];
