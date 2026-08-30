import React, { useState, useMemo } from "react";
import { Trash2, Briefcase, Save, Archive, ArchiveRestore } from "lucide-react";
import { Project } from "../../../../../types";
import { ConfirmModal } from "../../../../ui/atoms/ConfirmModal";
import { DataList } from "../../../../ui/molecules/DataList";
import { DataListRow } from "../../../../ui/molecules/DataListRow";
import { Modal } from "../../../../ui/Modal";
import { TextInput } from "../../../../ui/molecules/FormInputs";

interface ProjectManagerProps {
  projects: Project[];
  onUpsertProject: (p: Project) => void;
  onDeleteProject: (id: string) => void;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({ projects, onUpsertProject, onDeleteProject }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const [name, setName] = useState("");
  const [isArchived, setIsArchived] = useState(false);

  // Actifs d'abord (alphabétique), puis archivés (alphabétique)
  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      if (!!a.isArchived !== !!b.isArchived) return a.isArchived ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
  }, [projects]);

  const resetForm = () => {
    setName("");
    setIsArchived(false);
    setEditingProject(null);
    setIsModalOpen(false);
    setDeleteConfirm(null);
  };

  const handleAddClick = () => {
    setEditingProject(null);
    setName("");
    setIsArchived(false);
    setIsModalOpen(true);
  };

  const handleEditClick = (p: Project) => {
    setEditingProject(p);
    setName(p.name);
    setIsArchived(!!p.isArchived);
    setIsModalOpen(true);
  };

  const handleFormSubmit = () => {
    if (!name.trim()) return;
    const project: Project = {
      id: editingProject ? editingProject.id : `proj_${Date.now()}`,
      name: name.trim(),
      isArchived,
    };
    onUpsertProject(project);
    resetForm();
  };

  const handleDelete = () => {
    if (deleteConfirm) {
      onDeleteProject(deleteConfirm.id);
      resetForm();
    }
  };

  return (
    <div className="space-y-4">
      <ConfirmModal
        isOpen={!!deleteConfirm}
        title="Supprimer le projet ?"
        message={
          <span>
            Voulez-vous vraiment supprimer <strong>{deleteConfirm?.name}</strong> ?<br />
            <br />
            Les opérations déjà rattachées à ce projet ne seront pas supprimées, elles seront simplement dissociées.
          </span>
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />

      <Modal isOpen={isModalOpen} onClose={resetForm} title={editingProject ? "Modifier le projet" : "Ajouter un projet"}>
        <div className="space-y-4">
          <TextInput
            label="Nom du projet"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Vacances été 2026, Rénovation salon..."
            required
            autoFocus
          />

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isArchived}
                onChange={(e) => setIsArchived(e.target.checked)}
                className="h-5 w-5 text-indigo-600 rounded bg-white border-slate-300 focus:ring-indigo-500"
              />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Archive size={16} className="text-indigo-500" /> Archivé
                </span>
                <span className="text-xs text-slate-500">
                  Un projet archivé disparaît des sélecteurs de saisie mais reste visible dans les statistiques et l'historique.
                </span>
              </div>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            {editingProject && (
              <button
                type="button"
                onClick={() => setDeleteConfirm({ id: editingProject.id, name: editingProject.name })}
                className="px-4 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100"
              >
                <Trash2 size={20} />
              </button>
            )}
            <button
              onClick={handleFormSubmit}
              className="flex-1 bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              <Save size={18} /> {editingProject ? "Enregistrer" : "Ajouter"}
            </button>
          </div>
        </div>
      </Modal>

      <DataList
        title="Projets & Événements"
        count={sortedProjects.length}
        onAdd={handleAddClick}
        addButtonLabel="Ajouter un projet"
        emptyMessage="Aucun projet défini. Créez-en un pour regrouper des opérations (ex: vacances, travaux)."
      >
        {sortedProjects.map((p) => (
          <DataListRow
            key={p.id}
            icon={p.isArchived ? <ArchiveRestore size={20} /> : <Briefcase size={20} />}
            label={p.name}
            category={p.isArchived ? "Archivé" : "Actif"}
            onClick={() => handleEditClick(p)}
            badge={p.isArchived ? <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase">Archivé</span> : null}
          />
        ))}
      </DataList>
    </div>
  );
};
