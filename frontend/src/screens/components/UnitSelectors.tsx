import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { useTenant } from '../../hooks/useTenant';
import {
  collection, query, where, orderBy, onSnapshot
} from 'firebase/firestore';
import { BusinessCenter, RouteOption } from '../../types/operational';
import { logFirestoreError } from '../../utils/firestoreError';

interface UnitSelectorsProps {
  selectedCnId?: string;
  selectedUnitId?: string;
  onCnChange?: (cnId: string, cnName: string) => void;
  onUnitChange?: (unitId: string, unitName: string) => void;
  showVerTodas?: boolean;
  verTodas?: boolean;
  onVerTodasChange?: (val: boolean) => void;
  /** Quando definido e não vazio, restringe unidades a este escopo (usuario_unidades). */
  allowedUnitIds?: string[] | null;
  /** compact = header escuro; default = cards brancos */
  variant?: 'default' | 'header';
  className?: string;
}

export function UnitSelectors({
  selectedCnId: propSelectedCnId,
  selectedUnitId: propSelectedUnitId,
  onCnChange,
  onUnitChange,
  showVerTodas = false,
  verTodas = false,
  onVerTodasChange,
  allowedUnitIds = null,
  variant = 'default',
  className = '',
}: UnitSelectorsProps) {
  const { tenantId } = useTenant();

  // Local state for fallback when not controlled
  const [localCnId, setLocalCnId] = useState('');
  const [localUnitId, setLocalUnitId] = useState('');

  const isCnControlled = propSelectedCnId !== undefined;
  const isUnitControlled = propSelectedUnitId !== undefined;

  const selectedCnId = isCnControlled ? propSelectedCnId : localCnId;
  const selectedUnitId = isUnitControlled ? propSelectedUnitId : localUnitId;

  const [cns, setCns] = useState<BusinessCenter[]>([]);
  const [loadingCns, setLoadingCns] = useState(true);

  const [units, setUnits] = useState<RouteOption[]>([]);
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
      })) as BusinessCenter[];

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
        })) as BusinessCenter[];

        setCns(list);
        setLoadingCns(false);
      }, (fallbackErr) => {
        console.error("business_centers fallback query failed:", fallbackErr);
        setLoadingCns(false);
        try {
          logFirestoreError(fallbackErr, 'list', 'business_centers', { throwError: true });
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
      let list = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || '',
        ...doc.data()
      })) as RouteOption[];
      if (allowedUnitIds && allowedUnitIds.length > 0) {
        const allowed = new Set(allowedUnitIds);
        list = list.filter((u) => allowed.has(u.id));
      }
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
        let list = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || '',
          ...doc.data()
        })) as RouteOption[];

        if (allowedUnitIds && allowedUnitIds.length > 0) {
          const allowed = new Set(allowedUnitIds);
          list = list.filter((u) => allowed.has(u.id));
        }

        // Client-side sort
        list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        setUnits(list);
        setLoadingUnits(false);
      }, (fallbackErr) => {
        console.error("routes fallback query failed:", fallbackErr);
        setLoadingUnits(false);
        try {
          logFirestoreError(fallbackErr, 'list', 'routes', { throwError: true });
        } catch (e) {
          // Kept caught
        }
      });

      return () => unsubFallback();
    });

    return () => unsubscribe();
  }, [tenantId, selectedCnId, Array.isArray(allowedUnitIds) ? allowedUnitIds.join('|') : '']);

  const isHeader = variant === 'header';
  const selectClass = isHeader
    ? 'w-full min-w-[9rem] max-w-[14rem] border border-white/40 rounded bg-[#5a0075] text-white text-xs font-semibold p-1.5 outline-none h-9 appearance-none focus:ring-1 focus:ring-white/60 cursor-pointer'
    : 'w-full border border-[#6B21A8] rounded bg-white text-[#333333] text-sm p-2 outline-none h-10 shadow-sm appearance-none focus:ring-1 focus:ring-[#6B21A8] cursor-pointer font-bold';

  return (
    <div className={isHeader ? className : `px-3 py-2 ${className}`.trim()}>
      <div className={isHeader ? 'flex flex-wrap items-center gap-2' : 'grid grid-cols-1 md:grid-cols-3 gap-3 items-center'}>
        
        {/* Select CN */}
        <div className="relative w-full">
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
            className={selectClass}
            title="Centro de Negócios"
          >
            {cns.length === 0 && !loadingCns ? (
              <option value="" disabled>Nenhum CN cadastrado</option>
            ) : (
              [
                <option key="__all_cn__" value="">{isHeader ? 'Todos os CN' : 'Todos os Centros de Negocio'}</option>,
                ...cns.map(cn => (
                  <option key={cn.id} value={cn.id}>{String(cn.name ?? '')}</option>
                )),
              ]
            )}
          </select>
          {loadingCns && (
            <div className={`absolute right-2 ${isHeader ? 'top-2.5' : 'top-3'}`}>
              <div className={`w-3.5 h-3.5 border-2 ${isHeader ? 'border-white' : 'border-[#6B21A8]'} border-t-transparent rounded-full animate-spin`} />
            </div>
          )}
        </div>

        {/* Select Unidade */}
        <div className="relative w-full">
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
            className={selectClass}
            title="Unidade / Rota"
          >
            {units.length === 0 && !loadingUnits ? (
              <option value="" disabled>Nenhuma unidade</option>
            ) : (
              [
                <option key="__all_units__" value="">{isHeader ? `Unidades (${units.length})` : `Todas as unidades (${units.length})`}</option>,
                ...units.map(u => (
                  <option key={u.id} value={u.id}>{String(u.name ?? '')}</option>
                )),
              ]
            )}
          </select>
          {loadingUnits && (
            <div className={`absolute right-2 ${isHeader ? 'top-2.5' : 'top-3'}`}>
              <div className={`w-3.5 h-3.5 border-2 ${isHeader ? 'border-white' : 'border-[#6B21A8]'} border-t-transparent rounded-full animate-spin`} />
            </div>
          )}
        </div>

        {/* Checkbox ver todas */}
        {showVerTodas && !isHeader && (
          <div className="flex items-center pl-1 h-10">
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
    </div>
  );
}
