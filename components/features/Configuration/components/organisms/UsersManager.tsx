import React, { useState } from "react";
import { Users, Check, X, Trash2, Edit2, UserCheck, UserX, Calendar, Mail, MessageSquare } from "lucide-react";
import { AuthorizedUser } from "../../../../../types";
import { logger } from "../../../../../services/logger";

interface UsersManagerProps {
  users: AuthorizedUser[];
  onToggleAuthorization: (email: string, isAllowed: boolean) => void;
  onUpdateNotes: (email: string, notes: string) => void;
  onDeleteUser: (email: string) => void;
}

/**
 * Gestion des utilisateurs autorisés (whitelist).
 * Permet d'autoriser/refuser l'accès et d'ajouter des notes.
 */
export const UsersManager: React.FC<UsersManagerProps> = ({ users, onToggleAuthorization, onUpdateNotes, onDeleteUser }) => {
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const pendingUsers = users.filter((u) => !u.isAllowed);
  const authorizedUsers = users.filter((u) => u.isAllowed);

  const handleStartEditNotes = (user: AuthorizedUser) => {
    setEditingNotes(user.email);
    setNotesValue(user.notes || "");
  };

  const handleSaveNotes = (email: string) => {
    onUpdateNotes(email, notesValue);
    setEditingNotes(null);
  };

  const handleCancelEditNotes = () => {
    setEditingNotes(null);
    setNotesValue("");
  };

  const handleAuthorize = async (email: string) => {
    try {
      await onToggleAuthorization(email, true);
      setFeedback({ type: "success", message: "Utilisateur autorisé avec succès" });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      logger.error("❌ Erreur d'autorisation:", err);
      setFeedback({ type: "error", message: "Erreur lors de l'autorisation" });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleRevoke = async (email: string) => {
    try {
      await onToggleAuthorization(email, false);
      setFeedback({ type: "success", message: "Accès révoqué" });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      logger.error("❌ Erreur de révocation:", err);
      setFeedback({ type: "error", message: "Erreur lors de la révocation" });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Jamais";
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg animate-in fade-in slide-in-from-top-2 ${
            feedback.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? <Check size={18} /> : <X size={18} />}
            <span className="font-medium">{feedback.message}</span>
          </div>
        </div>
      )}

      {/* Demandes en attente */}
      {pendingUsers.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <UserX size={20} className="text-amber-600" />
            <h3 className="text-lg font-bold text-amber-900">Demandes en attente ({pendingUsers.length})</h3>
          </div>

          <div className="space-y-3">
            {pendingUsers.map((user) => (
              <div key={user.email} className="bg-white p-4 rounded-lg border border-amber-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name || user.email}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full border-2 border-amber-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                      <Mail size={18} />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 truncate">{user.name || user.email}</div>
                    {user.name && <div className="text-xs text-slate-500 truncate">{user.email}</div>}
                    <div className="text-xs text-slate-400 mt-0.5">Demande le {formatDate(user.addedAt)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAuthorize(user.email)}
                    className="px-3 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center gap-1.5 text-sm"
                    title="Autoriser l'accès"
                  >
                    <Check size={16} />
                    Autoriser
                  </button>

                  <button
                    onClick={() => {
                      onDeleteUser(user.email);
                    }}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Supprimer définitivement"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Utilisateurs autorisés */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck size={20} className="text-emerald-600" />
            <h3 className="text-lg font-bold text-slate-900">Utilisateurs autorisés ({authorizedUsers.length})</h3>
          </div>
        </div>

        <div className="divide-y divide-slate-200">
          {authorizedUsers.map((user) => (
            <div key={user.email} className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name || user.email}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full border-2 border-slate-200 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
                      <Users size={18} />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 truncate">{user.name || user.email}</div>
                    {user.name && <div className="text-sm text-slate-600 truncate">{user.email}</div>}

                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>Dernière connexion: {formatDate(user.lastLoginAt)}</span>
                      </div>
                      {user.addedBy && (
                        <div className="flex items-center gap-1">
                          <UserCheck size={12} />
                          <span>Autorisé par: {user.addedBy}</span>
                        </div>
                      )}
                    </div>

                    {/* Notes éditables */}
                    {editingNotes === user.email ? (
                      <div className="mt-3">
                        <textarea
                          value={notesValue}
                          onChange={(e) => setNotesValue(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none"
                          rows={2}
                          placeholder="Ajouter une note..."
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleSaveNotes(user.email)}
                            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700"
                          >
                            Enregistrer
                          </button>
                          <button
                            onClick={handleCancelEditNotes}
                            className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-300"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : user.notes ? (
                      <div className="mt-2 flex items-start gap-2">
                        <MessageSquare size={12} className="text-slate-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-slate-600 italic">{user.notes}</p>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleStartEditNotes(user)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Modifier les notes"
                  >
                    <Edit2 size={16} />
                  </button>

                  <button
                    onClick={() => handleRevoke(user.email)}
                    className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    title="Révoquer l'accès"
                  >
                    <X size={16} />
                  </button>

                  <button
                    onClick={() => {
                      onDeleteUser(user.email);
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Supprimer définitivement"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {authorizedUsers.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              <Users size={32} className="mx-auto mb-2 text-slate-300" />
              <p className="text-sm">Aucun utilisateur autorisé pour le moment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
