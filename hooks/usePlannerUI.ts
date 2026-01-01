
import { useState } from 'react';
import { PlannedItem } from '../types';

/**
 * Calcule le numéro de semaine (1 à 4) utilisé par le Planner
 * en fonction du jour du mois.
 */
const getWeekFromDate = (date: Date): number => {
  const day = date.getDate();
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  return 4;
};

export const usePlannerUI = (initialDate: Date = new Date(), initialWeek?: number) => {
  const [currentDate, setCurrentDate] = useState(initialDate);
  // On initialise la semaine active : soit forcée par props (navigation dashboard), soit calculée via la date
  const [activeWeek, setActiveWeek] = useState(() => initialWeek ?? getWeekFromDate(initialDate));
  const [searchQuery, setSearchQuery] = useState('');

  // États des modales
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    item: PlannedItem | null;
    amount: number;
    paymentDate: string;
    accountId: string;
    label: string;
    comments: string;
  }>({
    isOpen: false,
    item: null,
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    accountId: '',
    label: '',
    comments: ''
  });

  const [uncheckModal, setUncheckModal] = useState<{
    isOpen: boolean;
    item: PlannedItem | null;
  }>({
    isOpen: false,
    item: null
  });

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const openConfirmModal = (item: PlannedItem, defaultAccountId: string) => {
    setConfirmModal({
      isOpen: true,
      item,
      amount: item.amount,
      paymentDate: new Date().toISOString().split('T')[0],
      accountId: defaultAccountId,
      label: item.label,
      comments: item.comments || ''
    });
  };

  const closeConfirmModal = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));
  const openUncheckModal = (item: PlannedItem) => setUncheckModal({ isOpen: true, item });
  const closeUncheckModal = () => setUncheckModal(prev => ({ ...prev, isOpen: false }));

  return {
    currentDate,
    activeWeek,
    searchQuery,
    confirmModal,
    uncheckModal,
    setActiveWeek,
    setSearchQuery,
    setConfirmModal,
    handlePrevMonth,
    handleNextMonth,
    openConfirmModal,
    closeConfirmModal,
    openUncheckModal,
    closeUncheckModal
  };
};
