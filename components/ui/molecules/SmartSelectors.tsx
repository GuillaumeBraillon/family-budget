import React from "react";
import { CreditCard, User } from "lucide-react";
import { SelectInput } from "./FormInputs";
import { Account, Person, AccountType } from "../../../types";

interface AccountSelectorProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  accounts: Account[];
  label?: string;
  color?: "indigo" | "emerald";
  showBalance?: boolean;
  filterTypes?: AccountType[]; // Nouveau: filtre optionnel par types de compte
  allowEmpty?: boolean;
}

export const AccountSelector: React.FC<AccountSelectorProps> = ({
  accounts,
  label = "Compte",
  color,
  showBalance = false,
  filterTypes,
  allowEmpty = false,
  ...props
}) => {
  const filteredAccounts = filterTypes ? accounts.filter((a) => filterTypes.includes(a.type)) : accounts;

  return (
    <SelectInput label={label} icon={CreditCard} color={color} {...props}>
      {allowEmpty && <option value="">(Aucun)</option>}
      {filteredAccounts.length === 0 && <option value="">Aucun compte disponible</option>}
      {filteredAccounts.map((a) => (
        <option key={a.id} value={a.id}>
          {a.name} {showBalance ? `(${a.currentBalance.toFixed(2)}€)` : ""}
        </option>
      ))}
    </SelectInput>
  );
};

interface BeneficiarySelectorProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  people: Person[];
  label?: string;
  color?: "indigo" | "emerald";
  allowEmpty?: boolean;
}

export const BeneficiarySelector: React.FC<BeneficiarySelectorProps> = ({ people, label = "Bénéficiaires", color, allowEmpty = false, ...props }) => {
  return (
    <SelectInput label={label} icon={User} color={color} {...props}>
      {allowEmpty && <option value="">(Aucun)</option>}
      {people.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name} {p.isChild ? "(Enfant)" : ""}
        </option>
      ))}
    </SelectInput>
  );
};
