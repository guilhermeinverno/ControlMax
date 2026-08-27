import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';

const STORAGE_CN = 'controlmax.selectedCnId';
const STORAGE_UNIT = 'controlmax.selectedUnitId';

function readStored(key: string): string | null {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    const raw = sessionStorage.getItem(key);
    return raw && raw.trim() ? raw.trim() : null;
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string | null): void {
  try {
    if (typeof sessionStorage === 'undefined') return;
    if (!value) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {
    // ignore quota / private mode
  }
}

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
  const [selectedCnId, setSelectedCnIdState] = useState<string | null>(() => readStored(STORAGE_CN));
  const [selectedUnitId, setSelectedUnitIdState] = useState<string | null>(() => readStored(STORAGE_UNIT));

  useEffect(() => {
    writeStored(STORAGE_CN, selectedCnId);
  }, [selectedCnId]);

  useEffect(() => {
    writeStored(STORAGE_UNIT, selectedUnitId);
  }, [selectedUnitId]);

  const setSelectedCnId = useCallback((cnId: string | null) => {
    const next = cnId && cnId.trim() ? cnId.trim() : null;
    setSelectedCnIdState((prev) => {
      if (prev !== next) {
        setSelectedUnitIdState(null);
      }
      return next;
    });
  }, []);

  const setSelectedUnitId = useCallback((unitId: string | null) => {
    const next = unitId && unitId.trim() ? unitId.trim() : null;
    setSelectedUnitIdState(next);
  }, []);

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
