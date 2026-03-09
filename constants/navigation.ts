import { LayoutDashboard, CalendarCheck, Calculator, ArrowRightLeft, Settings } from "lucide-react";

export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "planner", label: "Opérations", icon: CalendarCheck },
  { id: "balances", label: "Soldes", icon: Calculator },
  { id: "transfers", label: "Comptes", icon: ArrowRightLeft },
  { id: "analytics", label: "Analytics", icon: Calculator },
  { id: "config", label: "Réglages", icon: Settings },
] as const;

export type ViewState = (typeof NAV_ITEMS)[number]["id"];

export const VIEW_ORDER: ViewState[] = NAV_ITEMS.map((item) => item.id) as ViewState[];
