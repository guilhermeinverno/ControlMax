import React, { useState, useEffect } from 'react';
import { Screen } from '../types';
import { Save, X, Upload, AlertCircle, CheckCircle2, CircleDollarSign, FileSpreadsheet, PlusCircle, Trash2, Banknote, ClipboardList } from 'lucide-react';
import { ConfirmModal } from './components/ConfirmModal';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, Timestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useBox } from '../hooks/useBox';
import { useTenant } from '../hooks/useTenant';
import { formatCurrencyBRL, parseCurrencyBRLToFloat, autocompleteCurrencyBRL } from '../utils/currency';

interface NewExpenseProps {
  onNavigate?: (screen: Screen) => void;
}

interface FirestoreExpense {
  id: string;
  tenantId: string;
  boxId?: string;
  boxName?: string;
  cnId: string;
  cnName: string;
  type: string;
  expenseType?: string;
  amount: number; // in cents
  comment: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: string;
  requestedById: string;
  createdAt?: any; // FIXED_BY_SCRIPT
  attachmentName?: string;
  attachmentUrl?: string;
}

export function NewExpense({ onNavigate }: NewExpenseProps) {
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [egresoMode, setEgresoMode] = useState<'gasto' | 'retiro'>('gasto');
  const [showConfirm, setShowConfirm] = useState(false);
  const [amount, setAmount] = useState('0');
  const [expenseType, setExpenseType] = useState('');
  const [comment, setComment] = useState('');
  const [description, setDescription] = useState('');
  
  // History lists
  const [boxExpenses, setBoxExpenses] = useState<FirestoreExpense[]>([]);
  const [bcExpenses, setBcExpenses] = useState<unknown[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // File Upload State
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  // Top Business Centers & open boxes selectors state (matching NewIncome layout)
  const [centers, setCenters] = useState<unknown[]>([]);
  const [selectedCnId, setSelectedCnId] = useState('');
  const [selectedCnName, setSelectedCnName] = useState('');
  const [selectedBoxId, setSelectedBoxId] = useState('');
  const [selectedBoxName, setSelectedBoxName] = useState('');

  // Open boxes state to validate / select
  const [openBoxes, setOpenBoxes] = useState<unknown[]>([]);

  const { activeBox } = useBox();
  const { tenantId, role, userName } = useTenant();

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
        if (activeBox) {
          const matchingCn = list.find(c => c.id === activeBox.cnId);
          if (matchingCn) {
            setSelectedCnId(matchingCn.id);
            setSelectedCnName(matchingCn.name);
            return;
          }
        }
        const firstCn = list[0];
        setSelectedCnId(firstCn.id);
        setSelectedCnName(firstCn.name);
      }
    }, (error) => {
      console.error("Error loading business centers:", error);
    });

    return () => unsubscribe();
  }, [tenantId, activeBox]);

  // Load open boxes for this tenant to select box in Gasto mode
  useEffect(() => {
    if (!tenantId) return;

    const boxesRef = collection(db, 'boxes');
    const q = query(
      boxesRef,
      where('tenantId', '==', tenantId),
      where('status', '==', 'open')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          cnId: data.cnId || '',
          userName: data.userName || '',
          unitName: data.unitName || '',
          status: data.status || 'open'
        };
      });
      setOpenBoxes(loaded);

      // Auto-select first box under currently selected CN if possible
      if (loaded.length > 0 && selectedCnId) {
        const matchingBox = loaded.find(b => b.cnId === selectedCnId);
        if (matchingBox) {
          setSelectedBoxId(matchingBox.id);
          setSelectedBoxName(matchingBox.userName || 'Caja');
        } else {
          setSelectedBoxId('');
          setSelectedBoxName('');
        }
      }
    }, (error) => {
      console.error("Error loading open boxes:", error);
    });

    return () => unsubscribe();
  }, [tenantId, selectedCnId]);

  // Load real-time historic box expenses
  useEffect(() => {
    if (!tenantId) return;

    const expensesRef = collection(db, 'expenses');
    const q = query(
      expensesRef,
      where('tenantId', '==', tenantId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded: FirestoreExpense[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          tenantId: data.tenantId,
          boxId: data.boxId,
          boxName: data.boxName,
          cnId: data.cnId,
          cnName: data.cnName,
          type: 'Gasto Caja',
          expenseType: data.expenseType || '',
          amount: data.amount || 0,
          comment: data.comment || '',
          description: data.description || '',
          status: data.status || 'approved',
          requestedBy: data.requestedBy || data.userName || 'Usuario',
          requestedById: data.requestedById || data.userId || '',
          createdAt: data.createdAt,
          attachmentName: data.attachmentName || '',
          attachmentUrl: data.attachmentUrl || ''
        };
      });
      setBoxExpenses(loaded);
    }, (error) => {
      console.error("Error loading box expenses:", error);
    });

    return () => unsubscribe();
  }, [tenantId]);

  // Load real-time historic CN level withdrawals (bc_expenses)
  useEffect(() => {
    if (!tenantId) return;

    const bcExpensesRef = collection(db, 'bc_expenses');
    const q = query(
      bcExpensesRef,
      where('tenantId', '==', tenantId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          tenantId: data.tenantId,
          cnId: data.cnId,
          cnName: data.cnName,
          type: 'Retiro CN',
          expenseType: data.expenseType || data.category || '',
          amount: data.amount || 0,
          comment: data.comment || data.description || '',
          description: data.description || '',
          status: data.status || 'approved',
          requestedBy: data.userName || 'Usuario',
          requestedById: data.userId || '',
          createdAt: data.createdAt,
          attachmentName: data.attachmentName || '',
          attachmentUrl: data.attachmentUrl || ''
        };
      });
      setBcExpenses(loaded);
      setLoadingHistory(false);
    }, (error) => {
      console.error("Error loading bc_expenses:", error);
      setLoadingHistory(false);
    });

    return () => unsubscribe();
  }, [tenantId]);

  // Combine both historic lists chronologically
  const unifiedHistory = [...boxExpenses, ...bcExpenses].sort((a, b) => {
    const timeA = a.createdAt?.seconds || 0;
    const timeB = b.createdAt?.seconds || 0;
    return timeB - timeA;
  });

  const handleCnChange = (cnId: string) => {
    const cn = centers.find(c => c.id === cnId);
    if (cn) {
      setSelectedCnId(cn.id);
      setSelectedCnName(cn.name);

      // Auto update selected open box to match this CN
      const matchingBox = openBoxes.find(b => b.cnId === cn.id);
      if (matchingBox) {
        setSelectedBoxId(matchingBox.id);
        setSelectedBoxName(matchingBox.userName || 'Caja');
      } else {
        setSelectedBoxId('');
        setSelectedBoxName('');
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

  const mapExpenseTypeToBcCategory = (type: string): 'salary' | 'rent' | 'supplies' | 'transport' | 'other' => {
    const t = type.toLowerCase();
    if (t.includes('sueldo')) return 'salary';
    if (t.includes('arriendo')) return 'rent';
    if (t.includes('gasolina') || t.includes('aceite') || t.includes('moto') || t.includes('pinchada')) return 'transport';
    if (t.includes('almuerzo') || t.includes('recarga') || t.includes('internet') || t.includes('cel') || t.includes('factura')) return 'supplies';
    return 'other';
  };

  const handleSave = async () => {
    if (!tenantId) {
      setSaveError("No se ha configurado el inquilino.");
      return;
    }
    if (!selectedCnId) {
      setSaveError("Seleccione un Centro de Negocios.");
      return;
    }
    if (egresoMode === 'gasto' && !selectedBoxId) {
      setSaveError("Debe seleccionar una Caja abierta.");
      return;
    }
    if (!expenseType) {
      setSaveError("Seleccione un tipo de egreso.");
      return;
    }

    const val = parseCurrencyBRLToFloat(amount);
    if (val <= 0) {
      setSaveError("El valor del egreso debe ser mayor que cero.");
      return;
    }
    if (!comment.trim()) {
      setSaveError("El comentario es obligatorio.");
      return;
    }
    if (!description.trim()) {
      setSaveError("La descripción es obligatoria.");
      return;
    }

    setSaveError(null);
    setSuccessMsg(null);
    setSaving(true);
    setShowConfirm(false);

    try {
      const isApproved = (role === 'admin' || role === 'superadmin') ? 'approved' : 'pending';

      if (egresoMode === 'gasto') {
        // 1. Create Box Expense
        await addDoc(collection(db, 'expenses'), {
          tenantId,
          boxId: selectedBoxId,
          boxName: selectedBoxName,
          cnId: selectedCnId,
          cnName: selectedCnName,
          type: 'expense',
          expenseType: expenseType,
          amount: Math.round(val * 100), // convert to cents
          comment: comment.trim(),
          description: description.trim(),
          attachmentName: fileName,
          attachmentUrl: fileUrl,
          status: isApproved,
          userId: auth?.currentUser?.uid || 'test-user-id',
          userName: userName || auth?.currentUser?.email || 'Usuario',
          requestedBy: userName || auth?.currentUser?.email || 'Usuario',
          requestedById: auth?.currentUser?.uid || 'test-user-id',
          createdAt: serverTimestamp()
        });

        // 2. Fetch and Update Box Totals
        const boxRef = doc(db, 'boxes', selectedBoxId);
        const boxSnap = await getDoc(boxRef);
        if (boxSnap.exists()) {
          const boxData = boxSnap.data();
          const currentExpenses = boxData.totalExpenses || 0;
          const newExpenses = currentExpenses + Math.round(val * 100);

          const initialAmount = boxData.initialAmount || 0;
          const totalCollections = boxData.totalCollections || 0;
          const totalIncomes = boxData.totalIncomes || 0;
          const totalSales = boxData.totalSales || 0;
          const totalTransfers = boxData.totalTransfers || 0;

          const finalAmount = initialAmount + totalCollections + totalIncomes - newExpenses - totalSales - totalTransfers;

          await updateDoc(boxRef, {
            totalExpenses: newExpenses,
            finalAmount: finalAmount
          });
        }

        setSuccessMsg(
          isApproved === 'approved'
            ? "¡Gasto registrado y caja actualizada correctamente!"
            : "¡Solicitud de gasto enviada correctamente!"
        );
      } else {
        // 3. Create CN Principal Withdrawal (bc_expenses)
        await addDoc(collection(db, 'bc_expenses'), {
          tenantId,
          cnId: selectedCnId,
          cnName: selectedCnName,
          userId: auth.currentUser?.uid || 'unknown',
          userName: userName || auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Usuario',
          amount: Math.round(val * 100), // convert to cents
          description: description.trim(),
          comment: comment.trim(),
          category: mapExpenseTypeToBcCategory(expenseType),
          expenseType: expenseType,
          status: isApproved,
          attachmentName: fileName,
          attachmentUrl: fileUrl,
          createdAt: serverTimestamp()
        });

        setSuccessMsg(
          isApproved === 'approved'
            ? "¡Retiro de CN Principal registrado correctamente!"
            : "¡Solicitud de retiro de CN Principal enviada correctamente!"
        );
      }

      setTimeout(() => {
        if (onNavigate) {
          onNavigate('dashboard');
        }
      }, 1500);

    } catch (error) {
      console.error("Error creating expense:", error);
      setSaveError(error instanceof Error ? error.message : "Error al guardar el egreso.");
    } finally {
      setSaving(false);
    }
  };

  const formatType = (type: string) => {
    switch (type) {
      case 'gasolina': return 'Gasolina';
      case 'aceite': return 'Aceite';
      case 'sueldo': return 'Sueldo';
      case 'arriendo': return 'Arriendo';
      case 'pinchada': return 'Pinchada';
      case 'arreglo moto': return 'Arreglo Moto';
      case 'almuerzo trabajador': return 'Almuerzo Trabajador';
      case 'recarga telefono': return 'Recarga Teléfono';
      case 'factura trycontroller': return 'Factura Trycontroller';
      case 'pago internet oficina': return 'Pago Internet Oficina';
      case 'pago cel jf': return 'Pago Cel JF';
      case 'descuadre': return 'Descuadre';
      case 'varios': return 'Varios';
      case 'jefe': return 'JEFE';
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

  const cnOpenBoxes = openBoxes.filter(b => b.cnId === selectedCnId);

  return (
    <div className="flex flex-col bg-[#F0F2F5] min-h-screen text-[#333333] pb-12 select-none">
      
      {/* 1. TOP BUSINESS CENTERS SELECTOR */}
      <div className="px-4 pt-4 pb-3 max-w-md mx-auto w-full">
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
      </div>

      {/* 2. TAB TOGGLE BUTTONS (Nuevo Egreso & Histórico) */}
      <div className="px-4 max-w-md mx-auto w-full">
        <div className="grid grid-cols-2 gap-2 pb-1.5 border-b border-gray-200">
          <button 
            id="tab-new-expense"
            onClick={() => setActiveTab('new')}
            className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-extrabold transition-all border shadow-xs ${
              activeTab === 'new' 
                ? 'bg-[#8CC63F] text-black border-[#8CC63F] font-black' 
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <CircleDollarSign className="w-5 h-5 shrink-0" />
            Nuevo Egreso
          </button>
          <button 
            id="tab-expense-history"
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
            
            {/* White Container holding Radio Buttons and Inputs */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
              
              {/* Toggle Gasto vs Retiro Radio Buttons (Screenshots 2 and 4) */}
              <div className="flex items-center justify-center space-x-6 py-4 px-2 border-b border-gray-100 bg-[#F9FAFB]">
                <label className="flex items-center space-x-2 text-xs font-black text-gray-700 cursor-pointer">
                  <input 
                    type="radio" 
                    name="egresoMode" 
                    value="gasto"
                    checked={egresoMode === 'gasto'}
                    onChange={() => setEgresoMode('gasto')}
                    className="w-4.5 h-4.5 text-[#6A008A] focus:ring-[#6A008A] accent-[#6A008A] cursor-pointer"
                  />
                  <span>Crear Gasto</span>
                </label>
                <label className="flex items-center space-x-2 text-xs font-black text-gray-700 cursor-pointer">
                  <input 
                    type="radio" 
                    name="egresoMode" 
                    value="retiro"
                    checked={egresoMode === 'retiro'}
                    onChange={() => setEgresoMode('retiro')}
                    className="w-4.5 h-4.5 text-[#6A008A] focus:ring-[#6A008A] accent-[#6A008A] cursor-pointer"
                  />
                  <span>Crear Retiro CN principal</span>
                </label>
              </div>

              {/* FORM FIELDS */}
              <div className="p-5 space-y-4">
                
                {/* CN Field Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-gray-900 font-extrabold text-sm block tracking-tight">
                    CN<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <select 
                      value={selectedCnId}
                      onChange={(e) => handleCnChange(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm font-semibold text-gray-800 bg-white outline-none focus:border-[#6A008A] appearance-none cursor-pointer"
                    >
                      {centers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
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

                {/* Caja dropdown - Only visible in Gasto mode */}
                {egresoMode === 'gasto' && (
                  <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                    <label className="text-gray-900 font-extrabold text-sm block tracking-tight">
                      Caja<span className="text-red-500 ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <select 
                        id="box-select"
                        value={selectedBoxId}
                        onChange={(e) => {
                          setSelectedBoxId(e.target.value);
                          const b = openBoxes.find(x => x.id === e.target.value);
                          if (b) {
                            setSelectedBoxName(b.userName || 'Caja');
                          } else {
                            setSelectedBoxName('');
                          }
                        }}
                        className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm font-semibold text-gray-800 bg-white outline-none focus:border-[#6A008A] appearance-none cursor-pointer"
                      >
                        <option value="">Seleccione caja</option>
                        {cnOpenBoxes.map(b => (
                          <option key={b.id} value={b.id}>
                            {b.userName || 'Cobrador'} ({b.unitName || 'Caja'})
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

                {/* Tipo de Egreso */}
                <div className="space-y-1.5">
                  <label className="text-gray-900 font-extrabold text-sm block tracking-tight">
                    Tipo de Egreso<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <div className="relative">
                    <select 
                      id="expense-type-select"
                      value={expenseType}
                      onChange={(e) => setExpenseType(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm font-semibold text-gray-800 bg-white outline-none focus:border-[#6A008A] appearance-none cursor-pointer"
                    >
                      <option value="">Seleccione Tipo de movimiento</option>
                      <option value="gasolina">Gasolina</option>
                      <option value="aceite">Aceite</option>
                      <option value="sueldo">Sueldo</option>
                      <option value="arriendo">Arriendo</option>
                      <option value="pinchada">Pinchada</option>
                      <option value="arreglo moto">Arreglo Moto</option>
                      <option value="almuerzo trabajador">Almuerzo Trabajador</option>
                      <option value="recarga telefono">Recarga Teléfono</option>
                      <option value="factura trycontroller">Factura Trycontroller</option>
                      <option value="pago internet oficina">Pago Internet Oficina</option>
                      <option value="pago cel jf">Pago Cel JF</option>
                      <option value="descuadre">Descuadre</option>
                      <option value="varios">Varios</option>
                      <option value="jefe">JEFE</option>
                    </select>
                    <div className="absolute right-4 top-4.5 pointer-events-none text-gray-400">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Valor */}
                <div className="space-y-1.5">
                  <label className="text-gray-900 font-extrabold text-sm block tracking-tight">
                    Valor<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input 
                    id="expense-amount-input"
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

                {/* Comentario */}
                <div className="space-y-1.5">
                  <label className="text-gray-900 font-extrabold text-sm block tracking-tight">
                    Comentario<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input 
                    id="expense-comment-input"
                    type="text" 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm font-semibold text-gray-800 outline-none focus:border-[#6A008A] bg-white"
                    placeholder="Ingrese Comentario"
                  />
                </div>

                {/* Descripción */}
                <div className="space-y-1.5">
                  <label className="text-gray-900 font-extrabold text-sm block tracking-tight">
                    Descripción<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input 
                    id="expense-desc-input"
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-3 text-sm font-semibold text-gray-800 outline-none focus:border-[#6A008A] bg-white"
                    placeholder="ingrese descripción"
                  />
                </div>

                {/* File Upload / Comprobante Selector */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-gray-900 font-extrabold text-sm block tracking-tight">
                    Seleccione Archivo
                  </label>
                  <input 
                    type="file" 
                    id="expense-file-input" 
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
                      htmlFor="expense-file-input"
                      className="border border-gray-200 bg-[#F9FAFB] rounded-xl flex flex-col items-center justify-center py-5 px-4 cursor-pointer hover:bg-gray-100/70 transition-colors shadow-xs"
                    >
                      <span className="text-sm text-gray-900 font-extrabold tracking-tight">Escolher arquivos</span>
                      <span className="text-xs text-gray-400 mt-1 font-bold">Nenhum a... escolhido</span>
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
            <div className="pt-2 flex flex-col space-y-2.5 max-w-xs mx-auto w-full">
              <button 
                id="btn-save-expense"
                disabled={saving || (egresoMode === 'gasto' && !selectedBoxId)}
                onClick={() => setShowConfirm(true)}
                className="w-full bg-[#8CC63F] text-black font-extrabold py-3.5 text-sm flex justify-center items-center rounded-full shadow-md disabled:opacity-50 hover:bg-[#7bb335] active:scale-95 transition-all cursor-pointer uppercase tracking-wider"
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
                id="btn-cancel-expense"
                disabled={saving}
                onClick={() => onNavigate && onNavigate('dashboard')}
                className="w-full bg-white text-gray-800 border border-gray-300 font-extrabold py-3.5 text-sm flex justify-center items-center rounded-full shadow-xs hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
              >
                Cancelar
              </button>

              <button 
                id="btn-back-to-summary"
                disabled={saving}
                onClick={() => onNavigate && onNavigate('dashboard')}
                className="w-full bg-white text-gray-800 border border-gray-300 font-extrabold py-3.5 text-sm flex justify-center items-center rounded-full shadow-xs hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
              >
                Volver A Resumen
              </button>
            </div>

          </div>
        ) : (
          /* HISTORIAL TABLE LIST */
          <div className="bg-white border border-gray-200 shadow-md rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              {loadingHistory ? (
                <div className="p-12 text-center text-xs text-gray-400 font-extrabold">Cargando historial de egresos...</div>
              ) : unifiedHistory.length === 0 ? (
                <div className="p-12 text-center text-xs text-gray-400 font-extrabold">No se encontraron egresos registrados.</div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[420px]">
                  <thead>
                    <tr className="bg-[#E5E7EB] text-gray-700 text-[10px] uppercase tracking-wider border-b border-gray-200">
                      <th className="p-3 font-extrabold whitespace-nowrap">Fecha</th>
                      <th className="p-3 font-extrabold whitespace-nowrap">Origen</th>
                      <th className="p-3 font-extrabold whitespace-nowrap">Tipo</th>
                      <th className="p-3 font-extrabold whitespace-nowrap">Comentario</th>
                      <th className="p-3 font-extrabold whitespace-nowrap">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-gray-800">
                    {unifiedHistory.map((exp, idx) => (
                      <tr key={exp.id} className={`border-b border-gray-100 ${idx % 2 === 1 ? 'bg-gray-50/70' : ''}`}>
                        <td className="p-3 whitespace-nowrap text-gray-500 font-bold">{formatDate(exp.createdAt)}</td>
                        <td className="p-3 whitespace-nowrap text-[10px] text-gray-600 font-semibold">{exp.boxName ? `Caja: ${exp.boxName}` : 'CN Principal'}</td>
                        <td className="p-3 whitespace-nowrap uppercase text-[10px] font-extrabold text-[#6A008A]">{formatType(exp.expenseType || '')}</td>
                        <td className="p-3 text-gray-500 max-w-[130px] truncate" title={exp.comment || exp.description}>{exp.comment || exp.description}</td>
                        <td className="p-3 font-extrabold text-red-600 whitespace-nowrap">$ {(exp.amount / 100).toFixed(2)}</td>
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
        subtitle={egresoMode === 'gasto' ? "Se registrará un nuevo gasto en la caja seleccionada" : "Se registrará un nuevo retiro de CN Principal"}
        confirmText="Sí guardar"
      />

    </div>
  );
}
