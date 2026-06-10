import React, { useState, useEffect, useCallback } from "react";
import { ViewState, VIEW_ORDER } from "../constants/navigation";
import { ConfigTab } from "./useConfigurationUI";
import { OperationFilters } from "../types";

const VIEWS: ViewState[] = VIEW_ORDER;

interface TouchPos {
  x: number;
  y: number;
}

/**
 * Hook centralisant la navigation et la gestion des gestes (swipe) de l'application.
 */
export const useAppNavigation = (setActiveTab: (tab: ConfigTab) => void) => {
  const [currentView, setCurrentView] = useState<ViewState>("dashboard");
  const [plannerContext, setPlannerContext] = useState<{
    date: Date;
    weekNumber?: number;
    filters?: Partial<OperationFilters>;
  } | null>(null);

  // --- LOGIQUE SWIPE ---
  const [touchStart, setTouchStart] = useState<TouchPos | null>(null);
  const [touchEnd, setTouchEnd] = useState<TouchPos | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    const target = e.target as HTMLElement;
    let isScrollable = false;
    let el = target;

    // Détecter si on swipe sur un élément qui a son propre scroll horizontal
    while (el && el !== e.currentTarget && el !== document.body) {
      if (el.scrollWidth > el.clientWidth) {
        const style = window.getComputedStyle(el);
        if (["auto", "scroll"].includes(style.overflowX) || ["auto", "scroll"].includes(style.overflow)) {
          isScrollable = true;
          break;
        }
      }
      el = el.parentElement as HTMLElement;
    }

    if (!isScrollable) {
      setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
    } else {
      setTouchStart(null);
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const xDist = touchStart.x - touchEnd.x;
    const yDist = touchStart.y - touchEnd.y;

    // Ignorer si le swipe est plus vertical que horizontal
    if (Math.abs(yDist) > Math.abs(xDist)) return;

    const minSwipeDistance = 50;
    const isLeftSwipe = xDist > minSwipeDistance;
    const isRightSwipe = xDist < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      const currentIndex = VIEWS.indexOf(currentView);
      if (isLeftSwipe && currentIndex < VIEWS.length - 1) {
        setCurrentView(VIEWS[currentIndex + 1]);
      }
      if (isRightSwipe && currentIndex > 0) {
        setCurrentView(VIEWS[currentIndex - 1]);
      }
    }
  }, [touchStart, touchEnd, currentView]);

  // --- NAVIGATION HELPERS ---

  const navigateToConfig = useCallback(
    (tab: ConfigTab) => {
      setActiveTab(tab);
      setCurrentView("config");
    },
    [setActiveTab]
  );

  const navigateToPlannerWithContext = useCallback((date: Date, filters?: Partial<OperationFilters>, weekNumber?: number) => {
    setPlannerContext({ date, filters, weekNumber });
    setCurrentView("planner");
  }, []);

  // Effacer le contexte de navigation quand on quitte Operations
  useEffect(() => {
    if (currentView !== "planner" && plannerContext !== null) {
      const timer = setTimeout(() => setPlannerContext(null), 0);
      return () => clearTimeout(timer);
    }
  }, [currentView, plannerContext]);

  return {
    currentView,
    setCurrentView,
    plannerContext,
    setPlannerContext,
    navigateToConfig,
    navigateToPlannerWithContext,
    touchHandlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
};
