
import React from 'react';
import { CreditCard, User } from 'lucide-react';
import { SelectInput } from '../atoms/Inputs';
import { Account, Person } from '../../../types';

interface AccountSelectorProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  accounts: Account[];
  label?: string;
  color?: 'indigo' | 'emerald';
  showBalance?: boolean;
}

export const AccountSelector: React.FC<AccountSelectorProps> = ({ 
  accounts, label = "Compte", color, showBalance = false, ...props 
}) => {
  return (
    <SelectInput label={label} icon={CreditCard} color={color} {...props}>
      {accounts.length === 0 && <option value="">Aucun compte disponible</option>}
      {accounts.map(a => (
        <option key={a.id} value={a.id}>
          {a.name} {showBalance ? `(${a.currentBalance.toFixed(2)}€)` : ''}
        </option>
      ))}
    </SelectInput>
  );
};

interface BeneficiarySelectorProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  people: Person[];
  label?: string;
  color?: 'indigo' | 'emerald';
}

export const BeneficiarySelector: React.FC<BeneficiarySelectorProps> = ({ 
  people, label = "Bénéficiaires", color, ...props 
}) => {
  return (
    <SelectInput label={label} icon={User} color={color} {...props}>
      {people.map(p => (
        <option key={p.id} value={p.id}>
          {p.name} {p.isChild ? '(Enfant)' : ''}
        </option>
      ))}
    </SelectInput>
  );
};
