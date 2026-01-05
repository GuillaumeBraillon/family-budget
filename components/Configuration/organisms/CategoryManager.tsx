
import React from 'react';
import { Plus, Trash2, Pencil, X, ChevronDown, ChevronRight, Save } from 'lucide-react';
import { CategoryDef } from '../../../types';
import { ConfirmModal } from '../../ui/atoms/ConfirmModal';
import { useCategoryManager } from '../../../hooks/useCategoryManager';
import { CategoryTypeSelector } from '../molecules/CategoryTypeSelector';

interface CategoryManagerProps {
    categories: CategoryDef[];
    onUpdateCategories: (cats: CategoryDef[]) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, onUpdateCategories }) => {
    const {
        mode, setMode, currentList,
        expandedCat, setExpandedCat,
        editingCatId, setEditingCatId,
        tempName, setTempName,
        newSubCat, setNewSubCat,
        editingSubCat, setEditingSubCat,
        tempSubName, setTempSubName,
        deleteConfirm, setDeleteConfirm,
        addCategory, saveCatName, handleDelete,
        addSubCat, removeSubCat, saveSubCat
    } = useCategoryManager(categories, onUpdateCategories);

    const isIncome = mode === 'INCOME';

    return (
        <div className="space-y-4">
             <ConfirmModal 
                isOpen={!!deleteConfirm}
                title="Supprimer la catégorie ?"
                message={<span>Voulez-vous vraiment supprimer la catégorie <strong>{deleteConfirm?.name}</strong> ?</span>}
                onConfirm={handleDelete}
                onCancel={() => setDeleteConfirm(null)}
             />

             <CategoryTypeSelector mode={mode} onChange={setMode} />

             <div className="flex justify-end">
                <button 
                    onClick={addCategory} 
                    className={`${isIncome ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-sm active:scale-95`}
                >
                    <Plus size={18} /> Nouveau
                </button>
            </div>

            <div className="grid gap-2">
                {currentList.map(cat => (
                    <div key={cat.id} className={`bg-white border rounded-lg overflow-hidden transition-all ${isIncome ? 'border-emerald-100 shadow-sm hover:border-emerald-200' : 'border-slate-200 shadow-sm hover:border-slate-300'}`}>
                        <div className="flex items-center justify-between p-3 bg-slate-50/50">
                            <div className="flex items-center gap-2 flex-1">
                                <button 
                                    onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)} 
                                    className="text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {expandedCat === cat.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                </button>
                                
                                {editingCatId === cat.id ? (
                                    <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                                        <input 
                                            autoFocus 
                                            value={tempName} 
                                            onChange={e => setTempName(e.target.value)} 
                                            className="p-1 text-sm border border-indigo-300 rounded bg-white text-slate-900 outline-none ring-2 ring-indigo-100" 
                                            onKeyDown={e => e.key === 'Enter' && saveCatName(cat.id)}
                                        />
                                        <button onClick={() => saveCatName(cat.id)} className="text-green-600 hover:bg-green-50 p-1 rounded"><Save size={16} /></button>
                                        <button onClick={() => setEditingCatId(null)} className="text-slate-400 p-1 rounded"><X size={16} /></button>
                                    </div>
                                ) : (
                                    <span 
                                        className="font-semibold text-slate-800 cursor-pointer hover:text-indigo-600 transition-colors" 
                                        onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
                                    >
                                        {cat.name}
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-1">
                                <button 
                                    onClick={() => { setEditingCatId(cat.id); setTempName(cat.name); }} 
                                    className="p-1.5 text-slate-300 hover:text-indigo-600 transition-colors"
                                >
                                    <Pencil size={16} />
                                </button>
                                <button 
                                    onClick={() => setDeleteConfirm({ id: cat.id, name: cat.name })} 
                                    className="p-1.5 text-slate-300 hover:text-red-600 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        {expandedCat === cat.id && (
                            <div className="p-3 bg-white border-t border-slate-100 animate-in slide-in-from-top-1 duration-200">
                                <div className="space-y-1">
                                    {cat.subCategories.map((sub, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm pl-8 pr-2 py-1.5 hover:bg-slate-50 rounded group">
                                            {editingSubCat?.catId === cat.id && editingSubCat?.oldName === sub ? (
                                                <div className="flex items-center gap-2 flex-1 animate-in fade-in duration-200">
                                                     <input 
                                                        autoFocus 
                                                        value={tempSubName} 
                                                        onChange={e => setTempSubName(e.target.value)} 
                                                        className="p-1 text-sm border border-indigo-200 rounded w-full bg-white text-slate-900 outline-none"
                                                        onKeyDown={e => e.key === 'Enter' && saveSubCat()} 
                                                    />
                                                     <button onClick={saveSubCat} className="text-green-600"><Save size={14} /></button>
                                                     <button onClick={() => setEditingSubCat(null)} className="text-slate-400"><X size={14} /></button>
                                                </div>
                                            ) : (
                                                <>
                                                    <span className="text-slate-600">{sub}</span>
                                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => { setEditingSubCat({ catId: cat.id, oldName: sub }); setTempSubName(sub); }} 
                                                            className="text-slate-300 hover:text-indigo-500"
                                                        >
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button 
                                                            onClick={() => removeSubCat(cat.id, sub)} 
                                                            className="text-slate-300 hover:text-red-500"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                    
                                    <div className="flex items-center gap-2 pl-8 mt-2 border-t border-dashed border-slate-100 pt-3">
                                        <input 
                                            placeholder="Nouvelle sous-catégorie..." 
                                            className="text-sm p-1.5 border border-slate-200 rounded flex-1 bg-white text-slate-900 focus:border-indigo-300 outline-none transition-all"
                                            value={newSubCat}
                                            onChange={e => setNewSubCat(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && addSubCat(cat.id)}
                                        />
                                        <button 
                                            onClick={() => addSubCat(cat.id)} 
                                            className={`${isIncome ? 'text-emerald-600 hover:bg-emerald-50' : 'text-indigo-600 hover:bg-indigo-50'} p-1.5 rounded transition-colors`}
                                            title="Ajouter"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {currentList.length === 0 && (
                    <div className="p-8 text-center text-slate-400 italic text-sm">
                        Aucune catégorie définie.
                    </div>
                )}
            </div>
        </div>
    );
};
