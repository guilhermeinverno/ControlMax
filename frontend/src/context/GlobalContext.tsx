import React, { createContext, useContext, useState, ReactNode } from 'react';

interface GlobalContextType {
  selectedCnId: string | null;
  selectedUnitId: string | null;
  setSelectedCnId: (cnId: string | null) => void;
  setSelectedUnitId: (unitId: string | null) => void;
}

const GlobalContext = createContext<GlobalContextType>({
  selectedCnId: null,
  selectedUnitId: null,
  setSelectedCnId: () => {},
  setSelectedUnitId: () => {},
});

export function GlobalProvider({ children }: { children: ReactNode }) {
  const [selectedCnId, setSelectedCnId] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  return (
    <GlobalContext.Provider
      value={{
        selectedCnId,
        selectedUnitId,
        setSelectedCnId,
        setSelectedUnitId,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
}

export function useGlobalContext() {
  return useContext(GlobalContext);
}
