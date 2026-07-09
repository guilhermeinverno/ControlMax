import React, { useState, useEffect } from 'react';
import { db, auth } from '../../lib/firebase';
import { useTenant } from '../../hooks/useTenant';
import {
  collection, query, where, orderBy, onSnapshot
} from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface UnitSelectorsProps {
  selectedCnId?: string;
  selectedUnitId?: string;
  onCnChange?: (cnId: string, cnName: string) => void;
  onUnitChange?: (unitId: string, unitName: string) => void;
  showVerTodas?: boolean;
  verTodas?: boolean;
  onVerTodasChange?: (val: boolean) => void;
}

export function UnitSelectors({
  selectedCnId: propSelectedCnId,
  selectedUnitId: propSelectedUnitId,
  onCnChange,
  onUnitChange,
  showVerTodas = false,
  verTodas = false,
  onVerTodasChange
}: UnitSelectorsProps) {
  const { tenantId } = useTenant();

  // Local state for fallback when not controlled
  const [localCnId, setLocalCnId] = useState('');
  const [localUnitId, setLocalUnitId] = useState('');

  const isCnControlled = propSelectedCnId !== undefined;
  const isUnitControlled = propSelectedUnitId !== undefined;

  const selectedCnId = isCnControlled ? propSelectedCnId : localCnId;
  const selectedUnitId = isUnitControlled ? propSelectedUnitId : localUnitId;

  const [cns, setCns] = useState<unknown[]>([]);
  const [loadingCns, setLoadingCns] = useState(true);

  const [units, setUnits] = useState<unknown[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(true);

  // 1. Fetch Business Centers (CNs)
  useEffect(() => {
    if (!tenantId) return;
    setLoadingCns(true);

    const ref = collection(db, 'business_centers');
    const q = query(
      ref,
      where('tenantId', '==', tenantId),
      where('active', '==', true),
      orderBy('name', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || '',
        ...doc.data()
      }));
      setCns(list);
      setLoadingCns(false);
    }, (err) => {
      console.warn("business_centers orderBy query failed, falling back to query without orderBy:", err);
      // Fallback query without orderBy
      const fallbackQ = query(
        ref,
        where('tenantId', '==', tenantId),
        where('active', '==', true)
      );

      const unsubFallback = onSnapshot(fallbackQ, (snapshot) => {
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || '',
          ...doc.data()
        })) as unknown[];
        
        // Client-side sort
        list.sort((a, b) => {
          const nameA = String((a as { name?: string }).name || '');
          const nameB = String((b as { name?: string }).name || '');
          return nameA.localeCompare(nameB);
        });

        setCns(list);
        setLoadingCns(false);
      }, (fallbackErr) => {
        console.error("business_centers fallback query failed:", fallbackErr);
        setLoadingCns(false);
        try {
          handleFirestoreError(fallbackErr, OperationType.LIST, 'business_centers');
        } catch (e) {
          // Kept caught
        }
      });

      return () => unsubFallback();
    });

    return () => unsubscribe();
  }, [tenantId]);

  // 2. Fetch Units (Routes)
  useEffect(() => {
    if (!tenantId) return;
    setLoadingUnits(true);

    const ref = collection(db, 'routes');
    
    // Build query dynamically
    const constraints = [
      where('tenantId', '==', tenantId),
      where('active', '==', true)
    ];

    if (selectedCnId !== '') {
      constraints.push(where('cnId', '==', selectedCnId));
    }

    const q = query(
      ref,
      ...constraints,
      orderBy('name', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || '',
        ...doc.data()
      }));
      setUnits(list);
      setLoadingUnits(false);
    }, (err) => {
      console.warn("routes orderBy query failed, falling back to query without orderBy:", err);
      // Fallback query without orderBy
      const fallbackQ = query(
        ref,
        ...constraints
      );

      const unsubFallback = onSnapshot(fallbackQ, (snapshot) => {
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || '',
          ...doc.data()
        })) as unknown[];

        // Client-side sort
        list.sort((a, b) => {
          const nameA = String((a as { name?: string }).name || '');
          const nameB = String((b as { name?: string }).name || '');
          return nameA.localeCompare(nameB);
        });

        setUnits(list);
        setLoadingUnits(false);
      }, (fallbackErr) => {
        console.error("routes fallback query failed:", fallbackErr);
        setLoadingUnits(false);
        try {
          handleFirestoreError(fallbackErr, OperationType.LIST, 'routes');
        } catch (e) {
          // Kept caught
        }
      });

      return () => unsubFallback();
    });

    return () => unsubscribe();
  }, [tenantId, selectedCnId]);

  return (
    <div className="px-3 pt-4 pb-2">
      <div className="space-y-2 mb-2">
        
        {/* Select CN */}
        <div className="relative">
          <select
            value={selectedCnId}
            onChange={e => {
              const val = e.target.value;
              const opt = cns.find(cn => cn.id === val);
              
              if (!isCnControlled) {
                setLocalCnId(val);
              }
              onCnChange?.(val, opt?.name || '');

              if (!isUnitControlled) {
                setLocalUnitId('');
              }
              onUnitChange?.('', '');
            }}
            className="w-full border border-[#6B21A8] rounded bg-white 
              text-[#333333] text-sm p-2 outline-none h-10 shadow-sm 
              appearance-none focus:ring-1 focus:ring-[#6B21A8] cursor-pointer"
          >
            {cns.length === 0 && !loadingCns ? (
              <option value="" disabled>Nenhum CN cadastrado</option>
            ) : (
              <>
                <option value="">Todos os Centros de Negocio</option>
                {cns.map(cn => (
                  <option key={cn.id} value={cn.id}>{cn.name}</option>
                ))}
              </>
            )}
          </select>
          {loadingCns && (
            <div className="absolute right-8 top-3">
              <div className="w-4 h-4 border-2 border-[#6B21A8] 
                border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Select Unidade */}
        <div className="relative">
          <select
            value={selectedUnitId}
            onChange={e => {
              const val = e.target.value;
              const opt = units.find(u => u.id === val);

              if (!isUnitControlled) {
                setLocalUnitId(val);
              }
              onUnitChange?.(val, opt?.name || '');
            }}
            className="w-full border border-[#6B21A8] rounded bg-white 
              text-[#333333] text-sm p-2 outline-none h-10 shadow-sm 
              appearance-none focus:ring-1 focus:ring-[#6B21A8] cursor-pointer"
          >
            {units.length === 0 && !loadingUnits ? (
              <option value="" disabled>Nenhuma unidade</option>
            ) : (
              <>
                <option value="">Todas as unidades ({units.length})</option>
                {units.map(u => (
                  <option key={u.id} value={u.id}>{(u as { name: string }).name}</option>
                ))}
              </>
            )}
          </select>
          {loadingUnits && (
            <div className="absolute right-8 top-3">
              <div className="w-4 h-4 border-2 border-[#6B21A8] 
                border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Checkbox ver todas */}
      {showVerTodas && (
        <div className="flex items-center">
          <input
            type="checkbox"
            id="see-all"
            checked={verTodas}
            onChange={e => onVerTodasChange?.(e.target.checked)}
            className="w-4 h-4 text-[#6B21A8] rounded 
              border-gray-300 focus:ring-[#6B21A8] mr-2 cursor-pointer"
          />
          <label htmlFor="see-all" className="text-sm font-bold text-[#333333] cursor-pointer select-none">
            Ver todas as unidades
          </label>
        </div>
      )}
    </div>
  );
}
