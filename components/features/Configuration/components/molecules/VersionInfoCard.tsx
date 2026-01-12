import React, { useState } from "react";
import { Info, FileText, ExternalLink } from "lucide-react";
import packageJson from "../../../../../package.json";
import { MobileTooltip } from "../../../../ui/MobileTooltip";
import { Modal } from "../../../../ui/Modal";

/**
 * Composant d'affichage de la version et du changelog.
 *
 * @description
 * Affiche le numéro de version depuis package.json avec accès au changelog.
 * Suit les bonnes pratiques :
 * - Source unique de vérité (package.json)
 * - Lien vers changelog complet
 * - UI discrète mais accessible
 *
 * @architecture
 * - Version : Import direct depuis package.json
 * - Changelog : Lien externe vers GitHub
 * - Badge version avec couleur sémantique
 * - Modale optionnelle pour notes de version récentes
 *
 * @component
 * @example
 * ```tsx
 * <VersionInfoCard />
 * ```
 */
export const VersionInfoCard: React.FC = () => {
  const [showChangelog, setShowChangelog] = useState(false);

  // Extraction notes de la dernière version du CHANGELOG
  const latestVersionNotes = `
### ✨ Nouveautés v${packageJson.version}

#### 🎯 Affichage Opérations Réelles
- **Ventilation détaillée** : Colonne "Opérations Réelles" avec Total/Standard/Extra
- **Navigation filtrée** : Clic sur montant → Vue Opérations pré-filtrée
- **Suivi des retards** : Opérations en attente des périodes précédentes

#### 💰 Gestion Dépassements Persistante
- **Stratégies configurables** : Déduction simple ou Étalement
- **Configuration sauvegardée** : Choix persistant en base
- **UI adaptative** : Texte explicatif selon stratégie active

#### 🏦 Support Intérêts d'Épargne
- **Flag is_interest** : Distinction virements classiques vs ajustements
- **Badge amber INTÉRÊTS** : Identification visuelle claire
- **Exclusion calculs** : Intérêts non comptés dans budget

#### 🎨 Améliorations UX
- **Accordéon Options Avancées** : Hiérarchie visuelle dans formulaires
- **TransferSummaryCard** : Ventilation LDDS (Joint vs Personnels)
- **ClickableAmount** : Navigation contextuelle améliorée

#### 🐛 Corrections
- **Balance transfers** : Gestion des déficits budgétaires (3-case algorithm)
- **LDDS calculation** : Flux bidirectionnel (Joint ↔ Personnels)
  `.trim();

  return (
    <>
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Info size={20} className="text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-slate-900">Version de l'application</h3>
            <p className="text-xs text-slate-500">Informations sur la version actuelle</p>
          </div>
          <MobileTooltip
            text="La version suit le format SemVer (MAJOR.MINOR.PATCH). Consultez le changelog pour voir les nouveautés."
            icon={<Info size={16} className="text-slate-400 hover:text-slate-600" />}
            widthClass="w-64"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
          {/* Version Badge */}
          <div className="flex items-center gap-3">
            <div className="text-4xl font-black text-indigo-600">v{packageJson.version}</div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-600">Version actuelle</span>
              <span className="text-[10px] text-slate-400">Family Budget</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowChangelog(true)}
              className="px-4 py-2 bg-white border border-indigo-200 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <FileText size={16} />
              Quoi de neuf ?
            </button>
            <a
              href="https://github.com/GuillaumeBraillon/family-budget/blob/main/CHANGELOG.md"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <ExternalLink size={16} />
              Changelog complet
            </a>
          </div>
        </div>
      </div>

      {/* Modale Changelog */}
      <Modal isOpen={showChangelog} onClose={() => setShowChangelog(false)} title={`Nouveautés v${packageJson.version}`}>
        <div className="prose prose-sm max-w-none">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-lg p-4 mb-4">
            <p className="text-sm text-indigo-900 font-medium mb-0">
              🎉 Merci d'utiliser <strong>Family Budget</strong> ! Découvrez les dernières améliorations de cette version.
            </p>
          </div>

          <div className="space-y-4 text-slate-700">
            {latestVersionNotes.split("\n").map((line, idx) => {
              if (line.startsWith("###")) {
                return (
                  <h3 key={idx} className="text-lg font-bold text-slate-900 mt-4 mb-2">
                    {line.replace("###", "").trim()}
                  </h3>
                );
              }
              if (line.startsWith("####")) {
                return (
                  <h4 key={idx} className="text-md font-bold text-indigo-700 mt-3 mb-1 flex items-center gap-2">
                    {line.replace("####", "").trim()}
                  </h4>
                );
              }
              if (line.startsWith("- **")) {
                const match = line.match(/- \*\*(.+?)\*\*\s*:\s*(.+)/);
                if (match) {
                  return (
                    <div key={idx} className="flex items-start gap-2 ml-4">
                      <span className="text-indigo-600 font-bold">•</span>
                      <div>
                        <strong className="text-slate-900">{match[1]}</strong>
                        <span className="text-slate-600"> : {match[2]}</span>
                      </div>
                    </div>
                  );
                }
              }
              if (line.trim() === "") {
                return <div key={idx} className="h-2" />;
              }
              return (
                <p key={idx} className="text-sm text-slate-600 ml-4">
                  {line}
                </p>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-900 mb-2 font-bold">📝 Notes importantes</p>
            <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
              <li>Cette version nécessite TypeScript strict mode</li>
              <li>Base de données : Migration 003 (carryover_strategy) et 002 (is_interest) appliquées automatiquement</li>
              <li>Consultez le changelog complet pour tous les détails techniques</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => setShowChangelog(false)}
            className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
          >
            Fermer
          </button>
          <a
            href="https://github.com/GuillaumeBraillon/family-budget/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            <ExternalLink size={18} />
            Toutes les versions
          </a>
        </div>
      </Modal>
    </>
  );
};
