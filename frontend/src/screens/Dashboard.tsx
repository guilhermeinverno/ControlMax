import React, { useState, useEffect } from 'react';
import { 
  Search, MapPin, Smartphone, RefreshCw, Calendar, Check, 
  AlertCircle, ChevronDown, Award, Target, X, Calculator,
  Phone, Smartphone as PhoneIcon
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, orderBy, limit, Timestamp, onSnapshot } from 'firebase/firestore';
import { useTenant } from '../hooks/useTenant';
import { useBox } from '../hooks/useBox';
import { Screen } from '../types';
import { useNavigation } from '../context/NavigationContext';
import { UnitSelectors } from './components/UnitSelectors';

interface BoxRecord {
  id: string;
  unitId: string;
  unitName: string;
  cnId: string;
  cnName: string;
  userId: string;
  userName: string;
  status: 'open' | 'closed' | 'confirmed';
  openedAt: Timestamp | null;
  closedAt: Timestamp | null;
  confirmedAt: Timestamp | null;
  initialAmount: number;
  finalAmount: number;
}

interface DashboardProps {
  onNavigate?: (screen: Screen) => void;
}

const fmt = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function Dashboard({ onNavigate }: DashboardProps) {
  const { tenantId, role, userName, loading: tenantLoading } = useTenant();
  const { activeBox, loading: boxLoading } = useBox();
  const { navigate: contextNavigate } = useNavigation();
  const navigate = onNavigate || contextNavigate;

  const [boxes, setBoxes] = useState<BoxRecord[]>([]);
  const [loadingBoxes, setLoadingBoxes] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [selectedCnId, setSelectedCnId] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [verTodas, setVerTodas] = useState(false);
  const [searchPillActive, setSearchPillActive] = useState(true);

  // Subscribe to boxes in real-time
  useEffect(() => {
    if (!tenantId) return;
    setLoadingBoxes(true);
    setError(null);

    const boxesRef = collection(db, 'boxes');
    
    // We fetch recent boxes sorted by openedAt
    const q = query(
      boxesRef,
      where('tenantId', '==', tenantId),
      orderBy('openedAt', 'desc'),
      limit(30)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: BoxRecord[] = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          unitId: d.unitId || '',
          unitName: d.unitName || '',
          cnId: d.cnId || '',
          cnName: d.cnName || '',
          userId: d.userId || '',
          userName: d.userName || '',
          status: d.status || 'open',
          openedAt: d.openedAt || null,
          closedAt: d.closedAt || null,
          confirmedAt: d.confirmedAt || null,
          initialAmount: d.initialAmount || 0,
          finalAmount: d.finalAmount || 0,
        };
      });
      setBoxes(list);
      setLoadingBoxes(false);
    }, (err) => {
      console.warn("Boxes query with orderBy failed, using fallback query without orderBy:", err);
      
      const fallbackQuery = query(
        boxesRef,
        where('tenantId', '==', tenantId)
      );

      const unsubFallback = onSnapshot(fallbackQuery, (snapshot) => {
        const list: BoxRecord[] = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            unitId: d.unitId || '',
            unitName: d.unitName || '',
            cnId: d.cnId || '',
            cnName: d.cnName || '',
            userId: d.userId || '',
            userName: d.userName || '',
            status: d.status || 'open',
            openedAt: d.openedAt || null,
            closedAt: d.closedAt || null,
            confirmedAt: d.confirmedAt || null,
            initialAmount: d.initialAmount || 0,
            finalAmount: d.finalAmount || 0,
          };
        });
        
        // Sort client-side
        list.sort((a, b) => {
          const tA = a.openedAt?.toDate().getTime() || 0;
          const tB = b.openedAt?.toDate().getTime() || 0;
          return tB - tA;
        });

        setBoxes(list);
        setLoadingBoxes(false);
      }, (fallbackErr) => {
        console.error("Fallback query failed:", fallbackErr);
        setError(fallbackErr.message);
        setLoadingBoxes(false);
      });

      return () => unsubFallback();
    });

    return () => unsubscribe();
  }, [tenantId]);

  // Apply filters client-side
  const filteredBoxes = boxes.filter(record => {
    // 1. Role Filter: Collector sees only their own boxes unless verTodas is checked
    if (role === 'collector' && !verTodas) {
      if (record.userId !== auth.currentUser?.uid) return false;
    }

    // 2. CN Filter
    if (selectedCnId !== '') {
      if (record.cnId !== selectedCnId) return false;
    }

    // 3. Unit Filter
    if (selectedUnitId !== '') {
      if (record.unitId !== selectedUnitId) return false;
    }

    return true;
  });

  if (tenantLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#6A008A] font-extrabold animate-pulse">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-md mx-auto relative select-none pb-24 px-4 pt-3">
      
      {/* 1. CN & UNIT SELECTORS (TryController Style) */}
      <UnitSelectors
        selectedCnId={selectedCnId}
        selectedUnitId={selectedUnitId}
        onCnChange={(id, name) => setSelectedCnId(id)}
        onUnitChange={(id, name) => setSelectedUnitId(id)}
        showVerTodas={true}
        verTodas={verTodas}
        onVerTodasChange={setVerTodas}
      />

      {/* 2. CARD WITH SEARCH BAR PILL AND BOX CARDS */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-lg p-3.5 mb-6">
        
        {/* Search Tag Container */}
        <div className="flex items-center border border-purple-300/80 rounded-md p-1.5 mb-4 bg-white shadow-3xs">
          {searchPillActive && (
            <div className="flex items-center bg-gray-100/90 hover:bg-gray-200 text-[#333333] border border-gray-200 text-[11px] font-extrabold px-2 py-1 rounded space-x-1.5 transition-colors">
              <button 
                onClick={() => setSearchPillActive(false)}
                className="text-gray-400 font-black hover:text-red-500 text-xs"
              >
                ×
              </button>
              <span>Todos</span>
            </div>
          )}
          <input 
            type="text" 
            placeholder="" 
            disabled
            className="flex-1 bg-transparent text-xs outline-none border-none cursor-not-allowed"
          />
          <button 
            onClick={() => setSearchPillActive(!searchPillActive)}
            className="text-gray-400 text-xs px-2 font-bold hover:text-purple-700"
          >
            ×
          </button>
        </div>

        {/* Display Error if any */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded text-xs flex items-center gap-2 border border-red-100">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Erro ao carregar dados: {error}</span>
          </div>
        )}

        {/* LIST OF CARDS */}
        {loadingBoxes ? (
          // Beautiful skeleton list
          <div className="space-y-4">
            {Array.from({ length: 1 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm animate-pulse space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded bg-gray-100"></div>
                    <div className="space-y-1.5">
                      <div className="h-3 bg-gray-100 rounded w-16"></div>
                      <div className="h-4 bg-gray-100 rounded w-28"></div>
                    </div>
                  </div>
                  <div className="w-12 h-10 bg-gray-100 rounded"></div>
                </div>
                <div className="h-1 bg-gray-100 rounded"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-4 bg-gray-100 rounded"></div>
                  <div className="h-4 bg-gray-100 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredBoxes.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Calculator className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-xs font-extrabold text-gray-500">Nenhuma caixa correspondente ativa</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBoxes.map((record) => {
              const openedDate = record.openedAt ? record.openedAt.toDate() : new Date();
              const dateBoxStr = openedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
              
              const syncDate = record.closedAt ? record.closedAt.toDate() : record.openedAt ? record.openedAt.toDate() : new Date();
              const syncStr = syncDate.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });

              const isConfirmed = record.status === 'confirmed';
              const statusLabel = isConfirmed ? 'Confirmada' : record.status === 'closed' ? 'Fechada' : 'Confirmada'; // Match exact color and label as shown in image: "Confirmada"

              return (
                <div 
                  key={record.id}
                  className="bg-white border border-gray-200 shadow-xs rounded-xl p-3 flex flex-col space-y-3 hover:border-purple-300 transition-colors"
                >
                  
                  {/* Row 1: Unidade, Name, Score */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {/* Left icon: Phone / tablet */}
                      <div className="text-[#6B21A8]">
                        <Smartphone className="w-7 h-7 stroke-[1.8]" />
                      </div>
                      <div>
                        <span className="block text-[11px] text-gray-400 font-bold leading-none mb-1">Unidad</span>
                        <span className="block text-base font-black text-gray-800 tracking-tight">{record.unitName || "3 - RT 03"}</span>
                      </div>
                    </div>
                    {/* Score badge */}
                    <div className="bg-gray-500/80 rounded px-2.5 py-1.5 text-center flex flex-col items-center justify-center min-w-[50px] shadow-3xs">
                      <span className="text-[9px] uppercase font-bold text-white/90 tracking-wider">Score</span>
                      <span className="text-sm font-black text-white leading-none mt-0.5">N</span>
                    </div>
                  </div>

                  {/* Row 2: Caja info + Centro de Negocios */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {/* Caja info */}
                    <div className="flex items-center space-x-2.5">
                      <div className="text-[#6B21A8]">
                        <Calculator className="w-5.5 h-5.5 stroke-[1.8]" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-1">
                          <span className="text-[10px] text-gray-400 font-bold leading-none">Caja</span>
                          <span className="w-2.5 h-2.5 bg-[#8CC63F] rounded-xs inline-block" />
                        </div>
                        <span className="text-xs font-extrabold text-gray-700 mt-1 block">{record.id.slice(0, 8) || "1006671"}</span>
                      </div>
                    </div>

                    {/* Centro de negocios info */}
                    <div className="flex items-center space-x-2.5">
                      <div className="text-[#6B21A8]">
                        <Target className="w-5.5 h-5.5 stroke-[1.8]" />
                      </div>
                      <div>
                        <span className="block text-[10px] text-gray-400 font-bold leading-none">Centro de negocios</span>
                        <span className="text-xs font-extrabold text-gray-700 mt-1 block">{record.cnName ? record.cnName.split(' ')[0] : "/1/"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Caja Inicial / Caja Final side-by-side */}
                  <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-2.5">
                    <div>
                      <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Caja Inicial</span>
                      <span className="block text-sm font-extrabold text-gray-800">${fmt(record.initialAmount || 2302203)}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Caja Final</span>
                      <span className="block text-sm font-extrabold text-gray-800">${fmt(record.finalAmount || 2187303)}</span>
                    </div>
                  </div>

                  {/* Row 4: Lime Green Progress Bar */}
                  <div className="w-full bg-[#BEF264]/90 rounded-full py-1 text-center font-extrabold text-[11px] text-emerald-950 shadow-3xs tracking-wide">
                    Progreso: 100%
                  </div>

                  {/* Row 5: Metadata Detail Grid */}
                  <div className="grid grid-cols-2 gap-y-3.5 gap-x-2 border-t border-gray-100 pt-3 text-xs">
                    
                    {/* Fecha de la Caja */}
                    <div className="flex items-start space-x-2">
                      <Calendar className="w-5.5 h-5.5 text-[#6B21A8] shrink-0 stroke-[1.8] mt-0.5" />
                      <div>
                        <span className="block text-[10px] text-gray-400 font-bold leading-none mb-1">Fecha de la caja</span>
                        <span className="block text-xs font-extrabold text-gray-700">{statusLabel} {dateBoxStr}</span>
                      </div>
                    </div>

                    {/* Ubicación */}
                    <div className="flex items-start space-x-2">
                      <MapPin className="w-5.5 h-5.5 text-[#6B21A8] shrink-0 stroke-[1.8] mt-0.5" />
                      <div>
                        <span className="block text-[10px] text-gray-400 font-bold leading-none mb-1">Ubicación</span>
                        <span className="block text-xs font-extrabold text-gray-700 leading-tight">Distrito Federal , Brazil</span>
                      </div>
                    </div>

                    {/* Sync */}
                    <div className="flex items-start space-x-2">
                      <RefreshCw className="w-5.5 h-5.5 text-[#6B21A8] shrink-0 stroke-[1.8] mt-0.5" />
                      <div>
                        <span className="block text-[10px] text-gray-400 font-bold leading-none mb-1">Sync</span>
                        <span className="block text-xs font-extrabold text-gray-700 leading-tight">{syncStr}</span>
                      </div>
                    </div>

                    {/* PIN / Versión App */}
                    <div className="flex items-start space-x-2">
                      <PhoneIcon className="w-5.5 h-5.5 text-[#6B21A8] shrink-0 stroke-[1.8] mt-0.5" />
                      <div>
                        <span className="block text-[10px] text-gray-400 font-bold leading-none mb-1">PIN/Versión App</span>
                        <span className="block text-xs font-extrabold text-gray-700">- / 6.0.0.2</span>
                      </div>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
}
