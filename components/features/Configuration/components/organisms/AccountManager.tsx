import React, { useState, useMemo } from "react";
import { Trash2, Save, PiggyBank, Users, Wallet } from "lucide-react";
import { Account, Person, AccountType, AppSettings } from "../../../../../types";
import { ConfirmModal } from "../../../../ui/atoms/ConfirmModal";
import { MobileTooltip } from "../../../../ui/MobileTooltip";
import { DataList } from "../../../../ui/molecules/DataList";
import { DataListRow } from "../../../../ui/molecules/DataListRow";
import { Modal } from "../../../../ui/Modal";
import { TextInput, SelectInput } from "../../../../ui/molecules/FormInputs";
import { useAccountsSorting } from "../../../../../hooks/accounts/useAccountsSorting";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableRow } from "../../../../ui/molecules/SortableRow";
import { ListSorter } from "../../../../ui/molecules/ListSorter";

interface AccountManagerProps {
  accounts: Account[];
  people: Person[];
  onUpsertAccount: (a: Account) => void;
  onDeleteAccount: (id: string) => void;
  settings: AppSettings; // Ajouté pour récupérer accounts_sorting
  onUpdateAccountsSorting: (newSorting: string[]) => void; // Nouvelle prop pour persister l'ordre
}

export const AccountManager: React.FC<AccountManagerProps> = ({ accounts, people, onUpsertAccount, onDeleteAccount, settings, onUpdateAccountsSorting }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [bankName, setBankName] = useState("");
  const [type, setType] = useState<AccountType>(AccountType.CHECKING);
  const [ownerId, setOwnerId] = useState("");
  const [isJoint, setIsJoint] = useState(false);

  // Tri alphabétique des comptes
  const { sortKey, sortOrder, setSorting, sortAccounts, isManualSort, sortOptions, canToggleOrder } = useAccountsSorting(settings.accounts_sorting || []);

  // Tri des comptes en utilisant le hook
  const sortedAndFilteredAccounts = useMemo(() => {
    // Filtrage simple si nécessaire, ici juste le tri
    return sortAccounts(accounts);
  }, [accounts, sortAccounts]);

  const clearForm = () => {
    setName("");
    setBankName("");
    setType(AccountType.CHECKING);
    setOwnerId(people.filter((p) => !p.isChild)[0]?.id || "");
    setIsJoint(false);
    setEditingAccount(null);
    setIsModalOpen(false);
    setDeleteConfirm(null);
  };

  const handleAddClick = () => {
    setEditingAccount(null);
    // Defaults
    setName("");
    setBankName("");
    setType(AccountType.CHECKING);
    setOwnerId(people.filter((p) => !p.isChild)[0]?.id || "");
    setIsJoint(false);

    setIsModalOpen(true);
  };

  const handleEditClick = (acc: Account) => {
    setEditingAccount(acc);
    setName(acc.name);
    setBankName(acc.bankName || "");
    setType(acc.type);
    setOwnerId(acc.ownerId);
    setIsJoint(!!acc.isJoint);

    setIsModalOpen(true);
  };

  const handleFormSubmit = () => {
    if (!name) return;

    const account: Account = {
      id: editingAccount ? editingAccount.id : `acc_${Date.now()}`,
      name,
      bankName,
      type,
      ownerId,
      isJoint,
      currentBalance: editingAccount ? editingAccount.currentBalance : 0,
    };

    onUpsertAccount(account);
    clearForm();
  };

  const handleDelete = () => {
    if (deleteConfirm) {
      onDeleteAccount(deleteConfirm.id);
      clearForm();
    }
  };

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const handleReorder = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id && isManualSort) {
      const oldIndex = sortedAndFilteredAccounts.findIndex((acc) => acc.id === active.id);
      const newIndex = sortedAndFilteredAccounts.findIndex((acc) => acc.id === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newSorting = [...sortedAndFilteredAccounts].map((acc) => acc.id);
        const [movedId] = newSorting.splice(oldIndex, 1);
        newSorting.splice(newIndex, 0, movedId);
        onUpdateAccountsSorting(newSorting);
      }
    }
  };

  return (
    <div className="space-y-4">
      <ConfirmModal
        isOpen={!!deleteConfirm}
        title="Supprimer le compte ?"
        message={
          <span>
            Voulez-vous vraiment supprimer le compte <strong>{deleteConfirm?.name}</strong> ? Cette action est irréversible et affectera tous les mouvements de
            trésorerie associés.
          </span>
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />

      <Modal isOpen={isModalOpen} onClose={clearForm} title={editingAccount ? "Modifier le compte" : "Ajouter un compte"}>
        <div className="space-y-4">
          <TextInput label="Nom du compte" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Compte Joint, Livret A..." required />

          <div className="grid grid-cols-2 gap-4">
            <TextInput label="Banque" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Ex: Bourso..." />
            <SelectInput label="Type" value={type} onChange={(e) => setType(e.target.value as AccountType)}>
              <option value={AccountType.CHECKING}>Courant</option>
              <option value={AccountType.SAVINGS}>Épargne</option>
            </SelectInput>
          </div>

          <SelectInput label="Titulaire" value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
            {people
              .filter((p) => !p.isChild)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </SelectInput>

          {/* Option Compte Joint */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isJoint} onChange={(e) => setIsJoint(e.target.checked)} className="h-4 w-4 text-indigo-600 rounded" />
              <span className="text-sm font-bold text-slate-700">Compte Joint (Pivot)</span>
              <MobileTooltip text="Ce compte devient le point central : il reçoit l'argent du LDDS pour payer les charges et alimente les comptes persos si besoin." />
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            {editingAccount && (
              <button
                type="button"
                onClick={() => setDeleteConfirm({ id: editingAccount.id, name: editingAccount.name })}
                className="px-4 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100"
              >
                <Trash2 size={20} />
              </button>
            )}
            <button
              onClick={handleFormSubmit}
              className="flex-1 bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              <Save size={18} /> {editingAccount ? "Enregistrer" : "Créer le compte"}
            </button>
          </div>
        </div>
      </Modal>

      <DataList title="Vos Comptes" count={sortedAndFilteredAccounts.length} onAdd={handleAddClick} addButtonLabel="Ajouter un compte">
        <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm mb-4">
          <ListSorter
            options={sortOptions}
            currentSort={sortKey}
            currentOrder={sortOrder}
            onSortChange={(key, order) => setSorting(key as Parameters<typeof setSorting>[0], order)}
            canToggleOrder={canToggleOrder}
          />
        </div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleReorder}>
          <SortableContext items={sortedAndFilteredAccounts.map((acc) => acc.id)} strategy={verticalListSortingStrategy}>
            {sortedAndFilteredAccounts.map((acc) => {
              const owner = people.find((p) => p.id === acc.ownerId)?.name || "Inconnu";
              const iconNode = acc.type === AccountType.SAVINGS ? <PiggyBank size={20} /> : acc.isJoint ? <Users size={20} /> : <Wallet size={20} />;

              return (
                <SortableRow key={acc.id} id={acc.id} disabled={!isManualSort}>
                  <DataListRow
                    icon={iconNode}
                    label={acc.name}
                    amount={acc.currentBalance}
                    category={acc.bankName || "Banque"}
                    beneficiary={owner}
                    onClick={() => handleEditClick(acc)}
                    badge={
                      acc.isJoint ? <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold uppercase">Joint</span> : null
                    }
                  />
                </SortableRow>
              );
            })}
          </SortableContext>
        </DndContext>
      </DataList>
    </div>
  );
};
