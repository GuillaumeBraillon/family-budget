
import React, { useState } from 'react';
import { Trash2, Save, Tag, DownloadCloud, Search, Check, Info, TrendingDown, TrendingUp } from 'lucide-react';
import { SavedLabel, AccountType } from '../../../types';
import { ConfirmModal } from '../atoms/ConfirmModal';
import { LabelTypeSelector } from '../molecules/LabelTypeSelector';
import { DataList } from '../../ui/molecules/DataList';
import { DataListRow } from '../../ui/molecules/DataListRow';
import { Modal } from '../../ui/Modal';
import { TextInput } from '../../ui/molecules/FormInputs';

interface AccountLabelManagerProps {
    labels: SavedLabel[];
    onUpsertLabel: (l: SavedLabel) => void;
    onDeleteLabel: (id: string) => void;
    onImportLabels?: () => Promise<any> | void;
    onImportVirLabels?: () => Promise<any> | void;
}

export const AccountLabelManager: React.FC<AccountLabelManagerProps> = ({ labels, onUpsertLabel, onDeleteLabel, onImportLabels, onImportVirLabels }) => {
    const [type, setType] = useState<AccountType>(AccountType.CHECKING);
    const [isExpenseMode, setIsExpenseMode] = useState(true);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLabel, setEditingLabel] = useState<SavedLabel | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, name: string } | null>(null);
    const [name, setName] = useState('');
    
    // Search & Feedback
    const [searchQuery, setSearchQuery] = useState('');
    const [importStatus, setImportStatus] = useState<{ type: 'success' | 'info' | 'error', message: string } | null>(null);

    const filteredList = labels
        .filter(l => l.type === type && l.isExpense === isExpenseMode)
        .filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name));
        
    const isSavings = type === AccountType.SAVINGS;

    const resetForm = () => {
        setName('');
        setEditingLabel(null);
        setIsModalOpen(false);
        setDeleteConfirm(null);
    };

    const handleAddClick = () => {
        setEditingLabel(null);
        setName('');
        setIsModalOpen(true);
    };

    const handleEditClick = (label: SavedLabel) => {
        setEditingLabel(label);
        setName(label.name);
        setIsModalOpen(true);
    };

    const handleSubmit = () => {
        if (!name.trim()) return;
        
        let newId = `lbl_${Date.now()}`;
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            newId = crypto.randomUUID();
        }

        const label: SavedLabel = {
            id: editingLabel ? editingLabel.id : newId,
            name: name.trim(),
            type: type,
            isExpense: isExpenseMode
        };
        onUpsertLabel(label);
        resetForm();
    };

    const handleDelete = () => {
        if (deleteConfirm) {
            onDeleteLabel(deleteConfirm.id);
            resetForm();
        }
    };

    const runImport = async (importFn: () => Promise<any> | void, sourceName: string) => {
        const result = await importFn();
        
        if (result && typeof result.count === 'number') {
            if (result.count > 0) {
                setImportStatus({ type: 'success', message: `${result.count} libellé${result.count > 1 ? 's' : ''} (${sourceName}) importé${result.count > 1 ? 's' : ''}.` });
            } else {
                setImportStatus({ type: 'info', message: `Aucun nouveau libellé ${sourceName} à importer.` });
            }
        } else if (result && result.error) {
             setImportStatus({ type: 'error', message: "Erreur lors de l'import." });
        }

        setTimeout(() => setImportStatus(null), 4000);
    };

    const handleImportCbClick = () => {
        if (onImportLabels) runImport(onImportLabels, 'CB');
    };

    const handleImportVirClick = () => {
        if (onImportVirLabels) runImport(onImportVirLabels, 'VIR');
    };

    return (
        <div className="space-y-4">
             <Modal 
                isOpen={isModalOpen} 
                onClose={resetForm} 
                title={editingLabel ? "Modifier le libellé" : "Ajouter un libellé"}
            >
                <div className="space-y-4">
                    <TextInput 
                        label="Libellé" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        placeholder={isSavings ? "Ex: Virement Épargne..." : "Ex: Courses..."}
                        required 
                        autoFocus
                    />
                    
                    <div className="flex gap-3 pt-2">
                        {editingLabel && (
                            <button 
                                type="button" 
                                onClick={() => setDeleteConfirm({ id: editingLabel.id, name: editingLabel.name })}
                                className="px-4 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                        <button 
                            onClick={handleSubmit} 
                            className="flex-1 bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                        >
                            <Save size={18} /> {editingLabel ? "Enregistrer" : "Ajouter"}
                        </button>
                    </div>
                </div>
            </Modal>

             <ConfirmModal 
                isOpen={!!deleteConfirm}
                title="Supprimer le libellé ?"
                message={<span>Voulez-vous vraiment supprimer le libellé <strong>{deleteConfirm?.name}</strong> ?</span>}
                onConfirm={handleDelete}
                onCancel={() => setDeleteConfirm(null)}
             />

             <LabelTypeSelector type={type} onChange={setType} />

             {/* Selecteur de Flux (Dépense / Revenu) */}
             <div className="flex justify-center mb-4">
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setIsExpenseMode(true)}
                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${isExpenseMode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <TrendingDown size={14}/> Dépenses (Débits)
                    </button>
                    <button
                        onClick={() => setIsExpenseMode(false)}
                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${!isExpenseMode ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <TrendingUp size={14}/> Revenus (Crédits)
                    </button>
                </div>
             </div>

             {/* Boutons d'import spécifiques aux comptes courants */}
             {!isSavings && (
                <div className="flex flex-col sm:flex-row justify-end items-end sm:items-center gap-2 mb-2">
                    {importStatus && (
                        <div className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-right-2 ${
                            importStatus.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 
                            importStatus.type === 'info' ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-700'
                        }`}>
                            {importStatus.type === 'success' && <Check size={14} />}
                            {importStatus.type === 'info' && <Info size={14} />}
                            {importStatus.message}
                        </div>
                    )}
                    <div className="flex gap-2">
                        {isExpenseMode && onImportLabels && (
                            <button 
                                onClick={handleImportCbClick}
                                className="text-xs font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1.5 transition-colors bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm hover:border-indigo-200 active:scale-95"
                                title="Importer les libellés 'CB %' depuis l'historique"
                            >
                                <DownloadCloud size={14} /> Import (CB)
                            </button>
                        )}
                        {!isExpenseMode && onImportVirLabels && (
                            <button 
                                onClick={handleImportVirClick}
                                className="text-xs font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1.5 transition-colors bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm hover:border-indigo-200 active:scale-95"
                                title="Importer les libellés 'VIR %' depuis l'historique"
                            >
                                <DownloadCloud size={14} /> Import (VIR)
                            </button>
                        )}
                    </div>
                </div>
             )}

             {/* Barre de Recherche */}
             <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Rechercher un libellé..." 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white shadow-sm"
                />
             </div>

            <DataList 
                title={`${isSavings ? "Epargne" : "Courant"} - ${isExpenseMode ? "Débits" : "Crédits"}`}
                count={filteredList.length} 
                onAdd={handleAddClick} 
                addButtonLabel="Ajouter un libellé"
                emptyMessage={searchQuery ? "Aucun libellé ne correspond à votre recherche." : "Aucun libellé défini pour cette section."}
            >
                {filteredList.map(label => (
                    <DataListRow 
                        key={label.id}
                        icon={<Tag size={20} className={isExpenseMode ? (isSavings ? "text-red-500" : "text-indigo-500") : "text-emerald-500"} />}
                        label={label.name}
                        onClick={() => handleEditClick(label)}
                    />
                ))}
            </DataList>
        </div>
    );
};
