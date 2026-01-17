import React, { useState, useEffect } from "react";
import { CalendarClock, Split, TableProperties, Info, AlertTriangle } from "lucide-react";
import { AppSettings, PeriodType } from "../../../../../types";
import { MobileTooltip } from "../../../../ui/MobileTooltip";
import { startOfMonth, endOfMonth, eachWeekOfInterval, getDaysInMonth, differenceInDays } from "date-fns";

interface PeriodSettingsCardProps {
  settings: AppSettings;
  onUpdate: (type: PeriodType, value: number) => void;
}

export const PeriodSettingsCard: React.FC<PeriodSettingsCardProps> = ({ settings, onUpdate }) => {
  const [type, setType] = useState<PeriodType>(settings.period_type || "FIXED_DAYS");
  // Utilisation de string pour permettre de vider l'input (suppression caractère par caractère)
  const [val, setVal] = useState<string>(String(settings.period_value || 7));

  useEffect(() => {
    // Synchronisation si les props changent (ex: après un reset global)
    setType(settings.period_type || "FIXED_DAYS");
    setVal(String(settings.period_value || 7));
  }, [settings]);

  // Réinitialisation de la valeur par défaut si changement de type drastique (optionnel mais meilleur UX)
  const handleTypeChange = (newType: PeriodType) => {
    setType(newType);

    let newVal = val;
    // Si on passe à Division et que la valeur est > 10, on remet à 2 pour éviter les incohérences
    if (newType === "CUSTOM_SPLIT" && parseInt(val) > 10) {
      newVal = "2";
      setVal(newVal);
    }
    // Si on passe à Jours Fixes et valeur < 1, on remet à 7
    if (newType === "FIXED_DAYS" && parseInt(val) < 1) {
      newVal = "7";
      setVal(newVal);
    }

    // Appliquer immédiatement le changement
    const numValue = parseInt(newVal) || (newType === "FIXED_DAYS" ? 7 : 2);
    onUpdate(newType, numValue);
  };

  const handleValueChange = (newVal: string) => {
    setVal(newVal);

    // Appliquer immédiatement si la valeur est valide
    const numValue = parseInt(newVal);
    if (numValue && numValue > 0) {
      onUpdate(type, numValue);
    }
  };

  // Calcul de l'exemple budgétaire basé sur le mois en cours
  const calculateExample = () => {
    const monthlyBudget = settings.monthly_envelope || 2000;
    const numValue = parseInt(val) || 7;
    const now = new Date();
    const daysInCurrentMonth = getDaysInMonth(now);
    const monthName = new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(now);
    const budgetPerDay = monthlyBudget / daysInCurrentMonth;

    if (type === "FIXED_DAYS") {
      const periodDays = numValue;
      const numPeriods = Math.ceil(daysInCurrentMonth / periodDays);
      const budgetPerPeriod = budgetPerDay * periodDays;
      return {
        numPeriods,
        budgetPerPeriod: Math.round(budgetPerPeriod),
        example: `${numPeriods} périodes d'environ ${Math.round(budgetPerPeriod)}€ chacune`,
        detail: `pour ${monthName} (${daysInCurrentMonth} jours)`,
      };
    } else if (type === "CALENDAR_WEEKS") {
      // Calcul précis des semaines calendaires du mois en cours avec prorata
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const calendarWeeks = eachWeekOfInterval(
        { start: monthStart, end: monthEnd },
        { weekStartsOn: 1 } // Lundi
      );

      // Calculer les jours réels de chaque semaine dans le mois
      const weekDetails = calendarWeeks.map((weekStart, index) => {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6); // Dimanche

        // Ajuster pour rester dans le mois
        const effectiveStart = weekStart < monthStart ? monthStart : weekStart;
        const effectiveEnd = weekEnd > monthEnd ? monthEnd : weekEnd;

        // Calculer le nombre de jours avec date-fns (plus fiable)
        const daysInWeek = differenceInDays(effectiveEnd, effectiveStart) + 1;
        const weekBudget = Math.round(budgetPerDay * daysInWeek);

        return { weekNumber: index + 1, days: daysInWeek, budget: weekBudget };
      });

      const numPeriods = weekDetails.length;

      // Afficher toutes les semaines avec leur budget respectif au prorata
      const detailedExample = weekDetails.map((w) => `S${w.weekNumber} (${w.days}j) : ${w.budget}€`).join(", ");

      // Calculer le budget représentatif (moyenne des semaines complètes ou première semaine)
      const fullWeeks = weekDetails.filter((w) => w.days === 7);
      const representativeBudget = fullWeeks.length > 0 ? fullWeeks[0].budget : weekDetails[0].budget;

      return {
        numPeriods,
        budgetPerPeriod: representativeBudget,
        example: detailedExample,
        detail: `pour ${monthName} (prorata selon jours réels)`,
      };
    } else {
      // CUSTOM_SPLIT
      const numPeriods = Math.max(1, Math.min(10, numValue));
      const budgetPerPeriod = monthlyBudget / numPeriods;
      return {
        numPeriods,
        budgetPerPeriod: Math.round(budgetPerPeriod),
        example: `${numPeriods} périodes de ${Math.round(budgetPerPeriod)}€ chacune`,
        detail: `pour ${monthName}`,
      };
    }
  };

  const budgetExample = calculateExample();

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <CalendarClock size={20} className="text-indigo-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-slate-900">Découpage de l'Échéancier</h3>
          <p className="text-xs text-slate-500">Organisez vos périodes budgétaires</p>
        </div>
        <MobileTooltip
          text="Choisissez comment découper le mois : par blocs de jours fixes, par semaines civiles, ou en parts égales. Votre enveloppe mensuelle sera automatiquement répartie entre ces périodes."
          icon={<Info size={16} className="text-slate-600 hover:text-slate-800" />}
          widthClass="w-72"
        />
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <PeriodOption
            active={type === "FIXED_DAYS"}
            onClick={() => handleTypeChange("FIXED_DAYS")}
            icon={<TableProperties size={20} />}
            label="Jours Fixes"
            desc="Blocs constants"
          />
          <PeriodOption
            active={type === "CALENDAR_WEEKS"}
            onClick={() => handleTypeChange("CALENDAR_WEEKS")}
            icon={<CalendarClock size={20} />}
            label="Calendrier"
            desc="Lundi au Dimanche"
          />
          <PeriodOption
            active={type === "CUSTOM_SPLIT"}
            onClick={() => handleTypeChange("CUSTOM_SPLIT")}
            icon={<Split size={20} />}
            label="Division"
            desc="X parts égales"
          />
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          {type === "FIXED_DAYS" && (
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Info size={16} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  Découpe le mois en blocs de <strong>X jours</strong>, peu importe le jour de la semaine.
                  <br />
                  <span className="italic text-slate-500">Exemple (7 jours) : Période 1 du 1er au 7, Période 2 du 8 au 14, etc.</span>
                </p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                <p className="text-xs font-bold text-emerald-900 mb-1">💰 Répartition budgétaire</p>
                <p className="text-sm font-black text-emerald-700">{budgetExample.example}</p>
                <p className="text-[10px] text-emerald-600 mt-1">
                  Basé sur {settings.monthly_envelope}€ mensuels {budgetExample.detail}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200/60">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-tight">Durée d'une période (Jours)</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={val}
                  onChange={(e) => handleValueChange(e.target.value)}
                  className="w-full p-2.5 mt-1 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {type === "CALENDAR_WEEKS" && (
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Info size={16} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  Suit les semaines civiles du calendrier (Lundi au Dimanche). Idéal pour gérer vos courses hebdomadaires.
                </p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                <p className="text-xs font-bold text-emerald-900 mb-1">💰 Répartition budgétaire</p>
                <p className="text-sm font-black text-emerald-700">{budgetExample.example}</p>
                <p className="text-[10px] text-emerald-600 mt-1">
                  Basé sur {settings.monthly_envelope}€ mensuels {budgetExample.detail}
                </p>
              </div>
              <div className="flex items-start gap-2 bg-amber-50 p-2 rounded-lg border border-amber-100 text-amber-800">
                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                <p className="text-[10px] leading-tight">
                  <strong>Attention :</strong> La première et la dernière période du mois peuvent être incomplètes (ex: 2 jours si le mois commence un samedi),
                  ce qui réduira proportionnellement leur budget alloué.
                </p>
              </div>
            </div>
          )}

          {type === "CUSTOM_SPLIT" && (
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Info size={16} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-slate-600 leading-relaxed">
                  Divise le mois en <strong>X parties égales</strong> (autant que possible).
                  <br />
                  <span className="italic text-slate-500">Exemple (2 parts) : Le mois est coupé en deux (quinzaine).</span>
                </p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                <p className="text-xs font-bold text-emerald-900 mb-1">💰 Répartition budgétaire</p>
                <p className="text-sm font-black text-emerald-700">{budgetExample.example}</p>
                <p className="text-[10px] text-emerald-600 mt-1">
                  Basé sur {settings.monthly_envelope}€ mensuels {budgetExample.detail}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200/60">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-tight">Nombre de divisions</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={val}
                  onChange={(e) => handleValueChange(e.target.value)}
                  className="w-full p-2.5 mt-1 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PeriodOption: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string; desc: string }> = ({
  active,
  onClick,
  icon,
  label,
  desc,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
      active ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm" : "border-slate-100 bg-white text-slate-400 hover:border-slate-200"
    }`}
  >
    {icon}
    <div className="text-center">
      <p className="text-[11px] font-bold uppercase tracking-tight">{label}</p>
      <p className="text-[9px] opacity-75 whitespace-nowrap">{desc}</p>
    </div>
  </button>
);
