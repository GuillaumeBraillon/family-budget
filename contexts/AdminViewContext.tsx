import React, { createContext, useContext, useState } from "react";

type AdminViewContextType = {
  viewAsNonAdmin: boolean;
  setViewAsNonAdmin: (v: boolean) => void;
  toggleViewAsNonAdmin: () => void;
};

const AdminViewContext = createContext<AdminViewContextType | undefined>(undefined);

export const AdminViewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [viewAsNonAdmin, setViewAsNonAdmin] = useState(false);

  const toggleViewAsNonAdmin = () => setViewAsNonAdmin((v) => !v);

  return <AdminViewContext.Provider value={{ viewAsNonAdmin, setViewAsNonAdmin, toggleViewAsNonAdmin }}>{children}</AdminViewContext.Provider>;
};

export const useAdminView = () => {
  const ctx = useContext(AdminViewContext);
  if (!ctx) throw new Error("useAdminView must be used within AdminViewProvider");
  return ctx;
};

export default AdminViewContext;
