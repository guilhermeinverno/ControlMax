import React, { useState, useEffect } from 'react';
import { Screen } from '../types';
import { Save, X, Upload, AlertCircle, CheckCircle2, CircleDollarSign, FileSpreadsheet, PlusCircle, Trash2, Banknote } from 'lucide-react';
import { ConfirmModal } from './components/ConfirmModal';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, Timestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useBox } from '../hooks/useBox';
import { useTenant } from '../hooks/useTenant';
import { formatCurrencyBRL, parseCurrencyBRLToFloat, autocompleteCurrencyBRL } from '../utils/currency';

interface NewIncomeProps {
  onNavigate?: (screen: Screen) => void;
}

interface FirestoreIncome {
  id: string;
  tenantId: string;
  boxId: string;
  boxName: string;
  cnId: string;
  cnName: string;
  type: string;
  incomeType?: string;
  amount: number; // in cents
  comment: string;
  description: string;
  registeredBy: string;
  createdAt?: any; // FIXED_BY_SCRIPT
  attachmentName?: string;
  attachmentUrl?: string;
}

export function NewIncome({ onNavigate }: NewIncomeProps) {
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [subTab, setSubTab] = useState<'ingreso' | 'complementar'>('ingreso');
  const [showConfirm, setShowConfirm] = useState(false);
  const [amount, setAmount] = useState('0');
  const [incomeType, setIncomeType] = useState('');
  const [comment, setComment] = useState('');
  const [description, setDescription] = useState('');
  const [incomes, setIncomes] = useState<FirestoreIncome[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // File Upload State
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  // Sales/Vendas state
  const [salesList, setSalesList] = useState<unknown[]>([]);
  const [selectedSaleId, setSelectedSaleId] = useState('');
  const [selectedSaleName, setSelectedSaleName] = useState('');

  // Top Business Centers & Units selectors state (matching TryController screenshot 2)
  const [centers, setCenters] = useState<unknown[]>([]);
  const [selectedCnId, setSelectedCnId] = useState('');
  const [selectedCnName, setSelectedCnName] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [selectedUnitName, setSelectedUnitName] = useState('');
  const [seeAllUnits, setSeeAllUnits] = useState(false);

  // Open boxes state to validate if unit has open box
  const [openBoxes, setOpenBoxes] = useState<unknown[]>([]);

  const { activeBox, loading: boxLoading } = useBox();
  const { tenantId, userName } = useTenant();

  // Load real-time business centers
  useEffect(() => {
    if (!tenantId) return;

    const q = query(
      collection(db, 'business_centers'),
      where('tenantId', '==', tenantId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || '',
        code: doc.data().code || '',
        status: doc.data().status || 'Activo',
        linkedUnits: doc.data().linkedUnits || []
      })).filter(c => c.status === 'Activo');

      setCenters(list);

      // Default selections
      if (list.length > 0) {
        // Match activeBox if possible
        if (activeBox) {
          const matchingCn = list.find(c => c.id === activeBox.cnId);
          if (matchingCn) {
            setSelectedCnId(matchingCn.id);
            setSelectedCnName(matchingCn.name);
            const matchingUnit = matchingCn.linkedUnits.find((u: { id: string; name: string }) => u.id === activeBox.unitId || u.name === activeBox.unitName);
            if (matchingUnit) {
              setSelectedUnitId(matchingUnit.id);
              setSelectedUnitName(matchingUnit.name);
            } else if (matchingCn.linkedUnits.length > 0) {
              const firstUnit = matchingCn.linkedUnits[0];
              setSelectedUnitId(firstUnit.id);
              setSelectedUnitName(firstUnit.name);
            }
            return;
          }
        }

        const firstCn = list[0];
        setSelectedCnId(firstCn.id);
        setSelectedCnName(firstCn.name);
        if (firstCn.linkedUnits && firstCn.linkedUnits.length > 0) {
          const firstUnit = firstCn.linkedUnits[0];
          setSelectedUnitId(firstUnit.id);
          setSelectedUnitName(firstUnit.name);
        }
      }
    }, (error) => {
      console.error("Error loading business centers:", error);
    });

    return () => unsubscribe();
  }, [tenantId, activeBox]);

  // Load open boxes for this tenant to check open status of units
  useEffect(() => {
    if (!tenantId) return;

    const boxesRef = collection(db, 'boxes');
    const q = query(
      boxesRef,
      where('tenantId', '==', tenantId),
      where('status', '==', 'open')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      setOpenBoxes(loaded);
    }, (error) => {
      console.error("Error loading open boxes:", error);
    });

    return () => unsubscribe();
  }, [tenantId]);

  // Load real-time incomes under this tenant
  useEffect(() => {
    if (!tenantId) return;

    const incomesRef = collection(db, 'incomes');
    const q = query(
      incomesRef,
      where('tenantId', '==', tenantId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded: FirestoreIncome[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          tenantId: data.tenantId,
          boxId: data.boxId,
          boxName: data.boxName,
          cnId: data.cnId,
          cnName: data.cnName,
          type: data.type || 'income',
          incomeType: data.incomeType || '',
          amount: data.amount || 0,
          comment: data.comment || '',
          description: data.description || '',
          registeredBy: data.registeredBy || data.userName || 'Usuario',
          createdAt: data.createdAt,
          attachmentName: data.attachmentName || '',
          attachmentUrl: data.attachmentUrl || ''
        };
      });
      setIncomes(loaded);
      setLoadingHistory(false);
    }, (error) => {
      console.error("Error loading incomes:", error);
      setLoadingHistory(false);
    });

    return () => unsubscribe();
  }, [tenantId]);

  // Load real-time sales under this tenant
  useEffect(() => {
    if (!tenantId) return;

    const salesRef = collection(db, 'sales');
    const q = query(
      salesRef,
      where('tenantId', '==', tenantId),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          clientName: data.clientName || 'Cliente sin nombre',
          ...data
        };
      });
      loaded.sort((a, b) => a.clientName.localeCompare(b.clientName));
      setSalesList(loaded);
    }, (error) => {
      console.error("Error loading sales for NewIncome:", error);
    });

    return () => unsubscribe();
  }, [tenantId]);

  // Find if selected unit has an open box
  const currentSelectedBox = openBoxes.find(b => 
    b.cnId === selectedCnId && 
    (b.unitId === selectedUnitId || b.unitName === selectedUnitName)
  );

  const handleCnChange = (cnId: string) => {
    const cn = centers.find(c => c.id === cnId);
    if (cn) {
      setSelectedCnId(cn.id);
      setSelectedCnName(cn.name);
      if (cn.linkedUnits && cn.linkedUnits.length > 0) {
        const firstUnit = cn.linkedUnits[0];
        setSelectedUnitId(firstUnit.id);
        setSelectedUnitName(firstUnit.name);
      } else {
        setSelectedUnitId('');
        setSelectedUnitName('');
      }
    }
  };

  const handleUnitChange = (unitId: string) => {
    const cn = centers.find(c => c.id === selectedCnId);
    if (cn) {
      const unit = cn.linkedUnits.find((u: { id: string; name: string }) => u.id === unitId);
      if (unit) {
        setSelectedUnitId(unit.id);
        setSelectedUnitName(unit.name);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFileUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setFileName('');
    setFileUrl('');
  };

  const handleSave = async () => {
    if (!tenantId) {
      setSaveError("No se ha configurado el inquilino.");
      return;
    }
    if (!currentSelectedBox) {
      setSaveError("La unidad seleccionada debe tener la caja abierta para registrar un ingreso.");
      return;
    }
    if (!incomeType) {
      setSaveError("Seleccione un tipo de ingreso.");
      return;
    }
    if ((incomeType === 'venta' || incomeType === 'venda') && !selectedSaleId) {
      setSaveError("Seleccione un Id de Venta.");
      return;
    }
    const val = parseCurrencyBRLToFloat(amount);
    if (val <= 0) {
      setSaveError("El valor del ingreso debe ser mayor que cero.");
      return;
    }
    if (!comment.trim()) {
      setSaveError("El comentario es obligatorio.");
      return;
    }

    setSaveError(null);
    setSuccessMsg(null);
    setSaving(true);
    setShowConfirm(false);

    try {
      const docPayload: Record<string, unknown> = {
        tenantId,
        boxId: currentSelectedBox.id,
        boxName: currentSelectedBox.userName || 'Caja',
        cnId: currentSelectedBox.cnId || '',
        cnName: currentSelectedBox.cnName || '',
        type: 'income',
        incomeType: incomeType,
        amount: Math.round(val * 100), // convert to cents
        comment: comment.trim(),
        description: description.trim(),
        attachmentName: fileName,
        attachmentUrl: fileUrl,
        userId: auth?.currentUser?.uid || 'test-user-id',
        userName: userName || auth?.currentUser?.email || 'Usuario',
        registeredBy: userName || auth?.currentUser?.email || 'Usuario',
        registeredById: auth?.currentUser?.uid || 'test-user-id',
        createdAt: serverTimestamp()
      };

      if (incomeType === 'venta' || incomeType === 'venda') {
        docPayload.saleId = selectedSaleId;
        docPayload.saleClientName = selectedSaleName;
      }

      // 1. Add income document
      await addDoc(collection(db, 'incomes'), docPayload);

      // 2. Update box totals dynamically
      const boxRef = doc(db, 'boxes', currentSelectedBox.id);
      const boxSnap = await getDoc(boxRef);
      if (boxSnap.exists()) {
        const boxData = boxSnap.data();
        const currentIncomes = boxData.totalIncomes || 0;
        const newIncomes = currentIncomes + Math.round(val * 100);

        const initialAmount = boxData.initialAmount || 0;
        const totalCollections = boxData.totalCollections || 0;
        const totalExpenses = boxData.totalExpenses || 0;
        const totalSales = boxData.totalSales || 0;
        const totalTransfers = boxData.totalTransfers || 0;

        const finalAmount = initialAmount + totalCollections + newIncomes - totalExpenses - totalSales - totalTransfers;

        await updateDoc(boxRef, {
          totalIncomes: newIncomes,
          finalAmount: finalAmount
        });
      }

      setSuccessMsg("¡Ingreso registrado y caja actualizada correctamente!");
      
      setTimeout(() => {
        if (onNavigate) {
          onNavigate('dashboard');
        }
      }, 1500);

    } catch (error) {
      console.error("Error creating income:", error);
      setSaveError(error instanceof Error ? error.message : "Error al guardar el ingreso.");
    } finally {
      setSaving(false);
    }
  };

  const formatType = (type: string) => {
    switch (type) {
      case 'inversion': return 'Inversión';
      case 'inversion_odu':
      case 'inversion ODU':
      case 'inversion ou':
      case 'inversion de capital':
      case 'inversion odu': return 'Inversión ODU';
      case 'factura_trycontroller':
      case 'factura trycontroller': return 'Factura Trycontroller';
      case 'descuadre': return 'Descuadre';
      case 'varios': return 'Varios';
      case 'prestamo_otros':
      case 'prestamo otros': return 'Préstamo Otros';
      case 'labada_moto':
      case 'labada moto': return 'Labada Moto';
      case 'peaje': return 'Peaje';
      case 'recarga_cel':
      case 'recarga cel': return 'Recarga Cel';
      case 'aportes': return 'Aportes de Capital';
      case 'prestamos': return 'Préstamos';
      case 'otros': return 'Otros Ingresos';
      case 'venta': return 'Venta';
      case 'venda': return 'Venda';
      default: return type;
    }
  };

  const formatDate = (timestamp: unknown) => {
    if (!timestamp) return 'Reciente';
    try {
      const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date((timestamp as { seconds: number }).seconds * 1000);
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
      return 'Reciente';
    }
  };

  return (
    <div className="flex flex-col bg-[#F0F2F5] min-h-screen text-[#333333] pb-12 select-none">
      
      {/* 1. TOP BUSINESS CENTERS & UNITS SELECTORS (Screenshot 2 and 4) */}
      <div className="px-4 pt-4 pb-3 max-w-md mx-auto w-full space-y-2.5">
        <div className="relative">
          <select 
            value={selectedCnId}
            onChange={(e) => handleCnChange(e.target.value)}
            className="w-full border border-gray-300 rounded-xl bg-white text-gray-800 text-sm p-3 outline-none shadow-xs appearance-none focus:ring-1 focus:ring-[#6A008A] font-medium"
          >
            {centers.length === 0 ? (
              <option value="">/1/ - CN de la sociedad 6501</option>
            ) : (
              centers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.code ? `/${c.code}/ - ` : ''}{c.name}
                </option>
              ))
            )}
          </select>
          <div className="absolute right-4 top-4.5 pointer-events-none text-gray-400">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>

        <div className="relative">
          <select 
            value={selectedUnitId}
            onChange={(e) => handleUnitChange(e.target.value)}
            className="w-full border border-gray-300 rounded-xl bg-white text-gray-800 text-sm p-3 outline-none shadow-xs appearance-none focus:ring-1 focus:ring-[#6A008A] font-medium"
          >
            {centers.length === 0 ? (
              <option value="">Todas las unidades (1)</option>
            ) : (
              (() => {
                const cn = centers.find(c => c.id === selectedCnId);
                if (!cn || !cn.linkedUnits || cn.linkedUnits.length === 0) {
                  return <option value="">Todas las unidades (0)</option>;
                }
                return (
                  <>
                    <option value="">Todas las unidades ({cn.linkedUnits.length})</option>
                    {cn.linkedUnits.map((u: { id: string; name: string }) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </>
                );
              })()
            )}
          </select>
          <div className="absolute right-4 top-4.5 pointer-events-none text-gray-400">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>

        {/* Ver todas las unidades checkbox */}
        <div className="flex items-center pt-1.5 px-1">
          <input 
            type="checkbox" 
            id="see-all-units" 
            checked={seeAllUnits}
            onChange={(e) => setSeeAllUnits(e.target.checked)}
            className="w-4.5 h-4.5 text-[#6A008A] rounded border-gray-300 focus:ring-[#6A008A] mr-2.5 cursor-pointer accent-[#6A008A]"
          />
          <label htmlFor="see-all-units" className="text-sm font-extrabold text-gray-700 cursor-pointer">
            Ver todas las unidades
          </label>
        </div>
      </div>

      {/* 2. TAB TOGGLE BUTTONS (Nuevo Ingreso & Histórico) */}
      <div className="px-4 max-w-md mx-auto w-full">
        <div className="grid grid-cols-2 gap-2 pb-1.5 border-b border-gray-200">
          <button 
            id="tab-new-income"
            onClick={() => setActiveTab('new')}
            className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-extrabold transition-all border shadow-xs ${
              activeTab === 'new' 
                ? 'bg-[#8CC63F] text-black border-[#8CC63F] font-black' 
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <CircleDollarSign className="w-5 h-5 shrink-0" />
            Nuevo Ingreso
          </button>
          <button 
            id="tab-income-history"
            onClick={() => setActiveTab('history')}
            className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-extrabold transition-all border shadow-xs ${
              activeTab === 'history' 
                ? 'bg-[#8CC63F] text-black border-[#8CC63F] font-black' 
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <FileSpreadsheet className="w-5 h-5 shrink-0" />
            Histórico
          </button>
        </div>
      </div>

      {/* 3. MAIN FORM CONTENT AND CARDS */}
      <div className="p-4 max-w-md mx-auto w-full">
        {activeTab === 'new' ? (
          <div className="flex flex-col space-y-4">
            
            {/* SUB-TABS (Ingreso / Complementar) inside White Container */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
              
              <div className="flex bg-[#F3F4F6] p-1.5 rounded-t-2xl border-b border-gray-100">
                <button
                  type="button"
                  onClick={() => setSubTab('ingreso')}
                  className={`flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all w-1/2 ${
                    subTab === 'ingreso'
                      ? 'bg-white text-gray-900 font-extrabold shadow-xs border-t-2 border-[#8CC63F]'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Banknote className="w-4 h-4 text-[#8CC63F]" />
                  Ingreso
                </button>
                <button
                  type="button"
                  onClick={() => setSubTab('complementar')}
                  className={`flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all w-1/2 ${
                    subTab === 'complementar'
                      ? 'bg-white text-gray-900 font-extrabold shadow-xs border-t-2 border-[#8CC63F]'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <PlusCircle className="w-4 h-4 text-[#8CC63F]" />
                  Complementar
                </button>
              </div>

              {/* FORM FIELDS */}
              <div className="p-5 space-y-4">
                
                {/* UGI Diario */}
                <div className="space-y-1.5">
                  <label className="text-gray-900 font-extrabold text-sm block tracking-tight">
                    UGI Diario<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <select 
                      disabled
                      className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm font-extrabold text-gray-800 bg-gray-50 outline-none appearance-none cursor-not-allowed"
                    >
                      {currentSelectedBox ? (
                        <option value={currentSelectedBox.id}>
                          {currentSelectedBox.unitName || currentSelectedBox.cnName}
                        </option>
                      ) : (
                        <option value="">La unidad debe tener la caja cerrada</option>
                      )}
                    </select>
                    <div className="absolute right-4 top-4.5 pointer-events-none text-gray-400">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Trabajador */}
                <div className="space-y-1.5">
                  <label className="text-gray-900 font-extrabold text-sm block tracking-tight">
                    Trabajador<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <select 
                      disabled
                      className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm font-extrabold text-gray-800 bg-gray-50 outline-none appearance-none cursor-not-allowed"
                    >
                      {currentSelectedBox ? (
                        <option value={currentSelectedBox.userId}>
                          {currentSelectedBox.userName || 'Cobrador'}
                        </option>
                      ) : (
                        <option value="">Sin Trabajador</option>
                      )}
                    </select>
                    <div className="absolute right-4 top-4.5 pointer-events-none text-gray-400">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Tipo de ingreso */}
                <div className="space-y-1.5">
                  <label className="text-gray-900 font-extrabold text-sm block tracking-tight">
                    Tipo de ingreso<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <select 
                      id="income-type-select"
                      value={incomeType}
                      onChange={(e) => {
                        setIncomeType(e.target.value);
                        if (e.target.value !== 'venta' && e.target.value !== 'venda') {
                          setSelectedSaleId('');
                          setSelectedSaleName('');
                        }
                      }}
                      className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm font-semibold text-gray-800 bg-white outline-none focus:border-[#6A008A] appearance-none cursor-pointer"
                    >
                      <option value="">Seleccione el tipo de ingreso</option>
                      <option value="venta">venta</option>
                      <option value="venda">venda</option>
                      <option value="inversion">inversion</option>
                      <option value="inversion odu">inversion odu</option>
                      <option value="factura trycontroller">factura trycontroller</option>
                      <option value="descuadre">descuadre</option>
                      <option value="varios">varios</option>
                      <option value="prestamo otros">prestamo otros</option>
                      <option value="labada moto">labada moto</option>
                      <option value="peaje">peaje</option>
                      <option value="recarga cel">recarga cel</option>
                    </select>
                    <div className="absolute right-4 top-4.5 pointer-events-none text-gray-400">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Id de venda */}
                {(incomeType === 'venta' || incomeType === 'venda') && (
                  <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                    <label className="text-gray-900 font-extrabold text-sm block tracking-tight">
                      Id de venda<span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <select 
                        id="sale-id-select"
                        value={selectedSaleId}
                        onChange={(e) => {
                          setSelectedSaleId(e.target.value);
                          const selected = salesList.find(s => s.id === e.target.value);
                          if (selected) {
                            setSelectedSaleName(selected.clientName);
                          } else {
                            setSelectedSaleName('');
                          }
                        }}
                        className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm font-semibold text-gray-800 bg-white outline-none focus:border-[#6A008A] appearance-none cursor-pointer"
                      >
                        <option value="">Seleccionar Id de Venta</option>
                        {salesList.map((sale) => (
                          <option key={sale.id} value={sale.id}>
                            {sale.id} - {sale.clientName}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-4.5 pointer-events-none text-gray-400">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}

                {/* Valor */}
                <div className="space-y-1.5">
                  <label className="text-gray-900 font-extrabold text-sm block tracking-tight">
                    Valor<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input 
                    id="income-amount-input"
                    type="text" 
                    value={amount}
                    onChange={(e) => setAmount(formatCurrencyBRL(e.target.value))}
                    onBlur={(e) => {
                      const autocompleted = autocompleteCurrencyBRL(e.target.value);
                      if (autocompleted) setAmount(autocompleted);
                    }}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm font-semibold text-gray-800 outline-none focus:border-[#6A008A] bg-white"
                    placeholder="0"
                  />
                </div>

                {/* Comentarios */}
                <div className="space-y-1.5">
                  <label className="text-gray-900 font-extrabold text-sm block tracking-tight">
                    Comentários<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input 
                    id="income-comment-input"
                    type="text" 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm font-semibold text-gray-800 outline-none focus:border-[#6A008A] bg-white"
                    placeholder="Ingrese comentarios"
                  />
                </div>

                {/* Descripción */}
                <div className="space-y-1.5">
                  <label className="text-gray-900 font-extrabold text-sm block tracking-tight">
                    Descrição<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input 
                    id="income-desc-input"
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm font-semibold text-gray-800 outline-none focus:border-[#6A008A] bg-white"
                    placeholder="Ingresa la descripción"
                  />
                </div>

                {/* File Upload / Comprobante (Screenshot 1 and 3) */}
                <div className="space-y-1.5 pt-1">
                  <input 
                    type="file" 
                    id="income-file-input" 
                    className="hidden" 
                    onChange={handleFileChange}
                    accept="image/*,application/pdf"
                  />
                  {fileName ? (
                    <div className="border border-green-300 rounded-xl bg-green-50/50 p-3.5 flex items-center justify-between animate-in fade-in duration-200">
                      <div className="flex items-center space-x-3 text-xs text-[#333333] font-medium truncate">
                        {fileUrl.startsWith('data:image/') ? (
                          <img src={fileUrl} alt="Preview" className="w-10 h-10 object-cover rounded border border-gray-200 shrink-0" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 flex items-center justify-center rounded shrink-0">
                            <Upload className="w-5 h-5 text-gray-500" />
                          </div>
                        )}
                        <div className="truncate">
                          <p className="font-extrabold text-gray-800 truncate max-w-[180px]">{fileName}</p>
                          <p className="text-[10px] text-gray-400 font-bold">Archivo seleccionado</p>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={handleRemoveFile}
                        className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label 
                      htmlFor="income-file-input"
                      className="border border-gray-200 bg-[#F9FAFB] rounded-xl flex flex-col items-center justify-center py-5 px-4 cursor-pointer hover:bg-gray-100/70 transition-colors shadow-xs"
                    >
                      <span className="text-sm text-gray-900 font-extrabold tracking-tight">Seleccionar archivo</span>
                      <span className="text-xs text-gray-400 mt-1 font-bold">Ningún archivo seleccionado</span>
                    </label>
                  )}
                </div>

              </div>
            </div>

            {/* Success Message */}
            {successMsg && (
              <div className="bg-green-50 border border-green-200 text-green-800 text-xs rounded-xl p-3.5 font-bold flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4.5 h-4.5 text-green-600 shrink-0" />
                {successMsg}
              </div>
            )}

            {/* Error Message */}
            {saveError && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl p-3.5 font-bold flex items-center gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4.5 h-4.5 text-red-600 shrink-0" />
                {saveError}
              </div>
            )}

            {/* ACTION PILL BUTTONS */}
            <div className="pt-2 flex flex-col space-y-2.5">
              <button 
                id="btn-save-income"
                disabled={!currentSelectedBox || saving}
                onClick={() => setShowConfirm(true)}
                className="w-full bg-[#8CC63F] text-black font-extrabold py-3.5 text-sm flex justify-center items-center rounded-full shadow-md disabled:opacity-50 hover:bg-[#7bb335] active:scale-95 transition-all cursor-pointer"
              >
                {saving ? (
                  <svg className="animate-spin h-4 w-4 mr-1.5 text-black" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : null}
                {saving ? 'GUARDANDO...' : 'Guardar'}
              </button>
              <button 
                id="btn-cancel-income"
                disabled={saving}
                onClick={() => onNavigate && onNavigate('dashboard')}
                className="w-full bg-white text-gray-800 border border-gray-300 font-extrabold py-3.5 text-sm flex justify-center items-center rounded-full shadow-xs hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
              >
                Cancelar
              </button>
            </div>

          </div>
        ) : (
          /* HISTORIAL TABLE LIST */
          <div className="bg-white border border-gray-200 shadow-md rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              {loadingHistory ? (
                <div className="p-12 text-center text-xs text-gray-400 font-extrabold">Cargando historial de ingresos...</div>
              ) : incomes.length === 0 ? (
                <div className="p-12 text-center text-xs text-gray-400 font-extrabold">No se encontraron ingresos registrados.</div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[380px]">
                  <thead>
                    <tr className="bg-[#E5E7EB] text-gray-700 text-[10px] uppercase tracking-wider border-b border-gray-200">
                      <th className="p-3 font-extrabold whitespace-nowrap">Fecha</th>
                      <th className="p-3 font-extrabold whitespace-nowrap">Tipo</th>
                      <th className="p-3 font-extrabold whitespace-nowrap">Comentario</th>
                      <th className="p-3 font-extrabold whitespace-nowrap">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-gray-800">
                    {incomes.map((inc, idx) => (
                      <tr key={inc.id} className={`border-b border-gray-100 ${idx % 2 === 1 ? 'bg-gray-50/70' : ''}`}>
                        <td className="p-3 whitespace-nowrap text-gray-500 font-bold">{formatDate(inc.createdAt)}</td>
                        <td className="p-3 whitespace-nowrap uppercase text-[10px] font-extrabold text-[#6A008A]">{formatType(inc.incomeType || inc.type)}</td>
                        <td className="p-3 text-gray-500 max-w-[150px] truncate">{inc.comment}</td>
                        <td className="p-3 font-extrabold text-green-600 whitespace-nowrap">$ {(inc.amount / 100).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={showConfirm} 
        onClose={() => setShowConfirm(false)} 
        onConfirm={handleSave}
        title="¿Confirmar registro?"
        subtitle="Se registrará un nuevo ingreso en caja"
        confirmText="Sí guardar"
      />

    </div>
  );
}
