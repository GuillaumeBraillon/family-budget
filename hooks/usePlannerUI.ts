import { useState } from 'react';
import { PlannedItem } from '../types';

export const usePlannerUI = (initialDate: Date = new Date()) => {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [activeWeek, setActiveWeek] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // États des modales
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    item: PlannedItem | null;
    amount: number;
    paymentDate: string;
    accountId: string;
    label: string;
  }>({
    isOpen: false,
    item: null,
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    accountId: '',
    label: ''
  });

  const [uncheckModal, setUncheckModal] = useState<{
    isOpen: boolean;
    item: PlannedItem | null;
  }>({
    isOpen: false,
    item: null
  });

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));

  const openConfirmModal = (item: PlannedItem, defaultAccountId: string) => {
    setConfirmModal({
      isOpen: true,
      item,
      amount: item.amount,
      paymentDate: new Date().toISOString().split('T')[0],
      accountId: defaultAccountId,
      label: item.label
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