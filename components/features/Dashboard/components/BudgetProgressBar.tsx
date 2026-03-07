import React, { useMemo } from "react";

interface BudgetProgressBarProps {
  /** Montant consommé */
  consumed: number;
  /** Budget total alloué */
  budget: number;
  /** Libellé optionnel */
  label?: string;
}

export const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({ consumed, budget }) => {
  const rawPct = budget > 0 ? (consumed / budget) * 100 : 0;
  const pctRounded = Math.round(rawPct);
  const cappedNormal = Math.min(rawPct, 100);
  const overflowPct = Math.max(0, rawPct - 100);
  const overflowWidth = Math.min(overflowPct, 100); // overflow visible dans 100% de la track

  const isOver = rawPct > 100;
  const isWarn = rawPct >= 75 && rawPct <= 100;

  // Couleur de la barre principale selon l'état
  const barGradient = useMemo(() => {
    if (rawPct >= 100) return "linear-gradient(90deg, #6366f1, #f43f5e)";
    if (rawPct >= 90) return "linear-gradient(90deg, #f97316, #fb923c)";
    if (rawPct >= 75) return "linear-gradient(90deg, #f59e0b, #fbbf24)";
    return "linear-gradient(90deg, #6366f1, #818cf8)";
  }, [rawPct]);

  // Position du badge (clampée pour rester dans la track)
  const badgeLeft = `${Math.max(4, Math.min(cappedNormal, 96))}%`;

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Track + badge */}
      <div style={{ position: "relative", paddingBottom: "18px" }}>
        {/* Track */}
        <div
          style={{
            position: "relative",
            height: "8px",
            background: "#f1f5f9",
            borderRadius: "99px",
            overflow: "hidden",
          }}
          role="progressbar"
          aria-valuenow={pctRounded}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {/* Barre principale (0–100%) */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              width: `${cappedNormal}%`,
              background: barGradient,
              borderRadius: "99px",
              transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
            }}
          />

          {/* Barre de dépassement (>100%) — rouge animé depuis la droite */}
          {isOver && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                height: "100%",
                width: `${overflowWidth}%`,
                background: "linear-gradient(90deg, #f43f5e, #e11d48)",
                borderRadius: "0 99px 99px 0",
                boxShadow: "0 0 8px rgba(244,63,94,0.55)",
                transition: "width 0.6s cubic-bezier(0.4,0,0.2,1) 0.1s",
              }}
            />
          )}
        </div>

        {/* Marqueur 100% (trait vertical, visible seulement en dépassement) */}
        {isOver && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "-3px",
              width: "2px",
              height: "14px",
              background: "rgba(244,63,94,0.35)",
              borderRadius: "1px",
              pointerEvents: "none",
            }}
          />
        )}

        {/* Badge flottant */}
        {isOver ? (
          // En dépassement : badge ancré à droite
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "10px",
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "3px",
                padding: "2px 7px",
                borderRadius: "6px",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.04em",
                background: "#e11d48",
                color: "white",
                boxShadow: "0 2px 8px rgba(225,29,72,0.45)",
                animation: "budgetPulse 1.2s ease-in-out infinite",
                whiteSpace: "nowrap",
              }}
            >
              +{Math.round(rawPct - 100)}% dépassé
            </span>
          </div>
        ) : (
          // Normal : badge qui suit la barre
          <div
            style={{
              position: "absolute",
              left: badgeLeft,
              top: "10px",
              transform: "translateX(-50%)",
              pointerEvents: "none",
              transition: "left 0.6s cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            <span
              style={{
                display: "inline-block",
                padding: "2px 7px",
                borderRadius: "6px",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.04em",
                background: isWarn ? "#f59e0b" : "#0f172a",
                color: "white",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                whiteSpace: "nowrap",
              }}
            >
              {pctRounded}%
            </span>
          </div>
        )}
      </div>

      {/* Keyframes injectés une fois */}
      <style>{`
        @keyframes budgetPulse {
          0%, 100% { box-shadow: 0 2px 8px rgba(225,29,72,0.4); }
          50%       { box-shadow: 0 2px 16px rgba(225,29,72,0.75); }
        }
      `}</style>
    </div>
  );
};
