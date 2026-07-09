import React, { useState } from 'react';
import { Screen } from '../types';
import { Save, X, Key, List, PlusCircle, CheckCircle, XCircle, Info, Edit, Trash } from 'lucide-react';
import { ConfirmModal } from './components/ConfirmModal';

interface AutoKeysProps {
  onNavigate?: (screen: Screen) => void;
}

interface Rule {
  id: string;
  name: string;
  type: string;
  minAmount: number;
  maxAmount: number;
  minScore: number;
  minAge: number;
  maxInstallments: number;
  active: boolean;
}

export function AutoKeys({ onNavigate }: AutoKeysProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'new'>('list');
  const [showConfirm, setShowConfirm] = useState(false);
  
  // Rules State
  const [rules, setRules] = useState<Rule[]>([
    {
      id: 'L-001',
      name: 'Aprobación de Crédito MicroExpress',
      type: 'Aprobación de Crédito',
      minAmount: 1000,
      maxAmount: 15000,
      minScore: 70,
      minAge: 6,
      maxInstallments: 12,
      active: true,
    },
    {
      id: 'L-002',
      name: 'Ampliación Clientes Recurrentes Gold',
      type: 'Ampliación de Crédito',
      minAmount: 5000,
      maxAmount: 50000,
      minScore: 85,
      minAge: 12,
      maxInstallments: 24,
      active: true,
    },
    {
      id: 'L-003',
      name: 'Aprobación Automática de Viáticos',
      type: 'Aprobación de Gastos',
      minAmount: 100,
      maxAmount: 1500,
      minScore: 0,
      minAge: 0,
      maxInstallments: 1,
      active: false,
    },
    {
      id: 'L-004',
      name: 'Transferencia Rutas del Norte',
      type: 'Transferencias',
      minAmount: 0,
      maxAmount: 100000,
      minScore: 0,
      minAge: 0,
      maxInstallments: 1,
      active: true,
    },
  ]);

  // Form State
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('Aprobación de Crédito');
  const [formMinAmount, setFormMinAmount] = useState('1000');
  const [formMaxAmount, setFormMaxAmount] = useState('20000');
  const [formMinScore, setFormMinScore] = useState('75');
  const [formMinAge, setFormMinAge] = useState('6');
  const [formMaxInstallments, setFormMaxInstallments] = useState('12');
  const [formActive, setFormActive] = useState(true);

  // For Editing state (simple helper)
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleCreateOrEdit = () => {
    if (!formName.trim()) {
      alert('Por favor, ingrese el nombre de la regla.');
      return;
    }
    setShowConfirm(true);
  };

  const saveRule = () => {
    const newRule: Rule = {
      id: editingId || `L-00${rules.length + 1}`,
      name: formName,
      type: formType,
      minAmount: parseFloat(formMinAmount) || 0,
      maxAmount: parseFloat(formMaxAmount) || 0,
      minScore: parseInt(formMinScore) || 0,
      minAge: parseInt(formMinAge) || 0,
      maxInstallments: parseInt(formMaxInstallments) || 0,
      active: formActive,
    };

    if (editingId) {
      setRules(prev => prev.map(r => r.id === editingId ? newRule : r));
    } else {
      setRules(prev => [...prev, newRule]);
    }

    // Reset Form
    resetForm();
    setShowConfirm(false);
    setActiveTab('list');
  };

  const resetForm = () => {
    setFormName('');
    setFormType('Aprobación de Crédito');
    setFormMinAmount('1000');
    setFormMaxAmount('20000');
    setFormMinScore('75');
    setFormMinAge('6');
    setFormMaxInstallments('12');
    setFormActive(true);
    setEditingId(null);
  };

  const startEdit = (rule: Rule) => {
    setEditingId(rule.id);
    setFormName(rule.name);
    setFormType(rule.type);
    setFormMinAmount(rule.minAmount.toString());
    setFormMaxAmount(rule.maxAmount.toString());
    setFormMinScore(rule.minScore.toString());
    setFormMinAge(rule.minAge.toString());
    setFormMaxInstallments(rule.maxInstallments.toString());
    setFormActive(rule.active);
    setActiveTab('new');
  };

  const toggleRuleActive = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const deleteRule = (id: string) => {
    if (confirm('¿Está seguro de eliminar esta regla de aprobación automática?')) {
      setRules(prev => prev.filter(r => r.id !== id));
    }
  };

  return (
    <div className="flex flex-col bg-[#F3F4F6] min-h-screen text-[#333333]">
      
      {/* DESCRIPTION BANNER */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm flex items-start space-x-3">
        <div className="bg-purple-100 p-2 rounded-full mt-0.5">
          <Key className="w-5 h-5 text-[#6B21A8]" />
        </div>
        <div>
          <h2 className="text-xs font-black text-[#6B21A8] uppercase tracking-wider">Reglas Operativas</h2>
          <p className="text-xs text-[#555555]">
            Configure parámetros para aprobación automática de créditos y ampliaciones.
          </p>
        </div>
      </div>

      {/* ABAS / TABS */}
      <div className="flex px-2 pt-2 bg-white border-b border-gray-300">
        <button 
          onClick={() => { setActiveTab('list'); resetForm(); }}
          className={`flex-1 py-2 text-xs font-bold text-center flex items-center justify-center space-x-1.5 border-b-[3px] ${activeTab === 'list' ? 'border-[#6B21A8] text-[#6B21A8]' : 'border-transparent text-[#777777]'}`}
        >
          <List className="w-3.5 h-3.5" />
          <span>Reglas Configuradas</span>
        </button>
        <button 
          onClick={() => { setActiveTab('new'); }}
          className={`flex-1 py-2 text-xs font-bold text-center flex items-center justify-center space-x-1.5 border-b-[3px] ${activeTab === 'new' ? 'border-[#6B21A8] text-[#6B21A8]' : 'border-transparent text-[#777777]'}`}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>{editingId ? 'Editar Regla' : 'Nueva Regla'}</span>
        </button>
      </div>

      <div className="p-3">
        {activeTab === 'new' ? (
          <div className="flex flex-col space-y-3">
            {/* FORMULÁRIO */}
            <div className="bg-white border border-gray-300 shadow-sm rounded-sm p-3">
              <h3 className="font-bold text-[#6B21A8] border-b border-gray-200 pb-1 mb-3 uppercase text-[10px] tracking-wider">Parameters de Configuración</h3>
              
              <div className="space-y-3">
                
                <div>
                  <label className="block text-[11px] font-bold text-[#555555] mb-1">Nombre de la Regla *</label>
                  <input 
                    type="text" 
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-[#333333] outline-none focus:border-[#6B21A8] bg-white font-semibold"
                    placeholder="Ej. Aprobación Automática Express"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#555555] mb-1">Tipo de Regla *</label>
                  <select 
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs text-[#333333] outline-none focus:border-[#6B21A8] bg-white"
                  >
                    <option value="Aprobación de Crédito">Aprobación de Crédito</option>
                    <option value="Ampliación de Crédito">Ampliación de Crédito</option>
                    <option value="Aprobación de Gastos">Aprobación de Gastos</option>
                    <option value="Transferencias">Transferencias</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#555555] mb-1">Monto Mínimo *</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-[10px]">$</span>
                      <input 
                        type="number" 
                        value={formMinAmount}
                        onChange={(e) => setFormMinAmount(e.target.value)}
                        className="w-full border border-gray-300 rounded pl-7 pr-2 py-1.5 text-xs font-bold text-[#333333] outline-none focus:border-[#6B21A8]"
                        placeholder="Min"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#555555] mb-1">Monto Máximo *</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-[10px]">$</span>
                      <input 
                        type="number" 
                        value={formMaxAmount}
                        onChange={(e) => setFormMaxAmount(e.target.value)}
                        className="w-full border border-gray-300 rounded pl-7 pr-2 py-1.5 text-xs font-bold text-[#333333] outline-none focus:border-[#6B21A8]"
                        placeholder="Max"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-[#555555] mb-1">Score Mínimo</label>
                    <input 
                      type="number" 
                      value={formMinScore}
                      onChange={(e) => setFormMinScore(e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs font-bold text-[#333333] outline-none focus:border-[#6B21A8]"
                      placeholder="0-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#555555] mb-1" title="Antigüedad Mínima en Meses">Antigüedad (Meses)</label>
                    <input 
                      type="number" 
                      value={formMinAge}
                      onChange={(e) => setFormMinAge(e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs font-bold text-[#333333] outline-none focus:border-[#6B21A8]"
                      placeholder="Meses"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#555555] mb-1">Max Cuotas</label>
                    <input 
                      type="number" 
                      value={formMaxInstallments}
                      onChange={(e) => setFormMaxInstallments(e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs font-bold text-[#333333] outline-none focus:border-[#6B21A8]"
                      placeholder="Cuotas"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <input 
                    type="checkbox" 
                    id="ruleActive"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="w-4 h-4 text-[#6B21A8] focus:ring-[#6B21A8] border-gray-300 rounded"
                  />
                  <label htmlFor="ruleActive" className="text-xs font-bold text-[#333333] select-none cursor-pointer">
                    Estado Activo
                  </label>
                </div>

              </div>
            </div>

            {/* DYNAMIC EXPECTED RESULT SUMMARY */}
            <div className="bg-[#FAF5FF] border border-[#D8B4FE] shadow-sm rounded-sm p-3 text-xs flex flex-col space-y-1.5">
              <div className="flex items-center text-[#7B1FA2] font-bold uppercase text-[10px] tracking-wider space-x-1 border-b border-[#D8B4FE] pb-1">
                <Info className="w-3.5 h-3.5 text-[#7B1FA2]" />
                <span>Resumen Operativo</span>
              </div>
              <p className="text-[#333333] leading-relaxed font-medium">
                "Las solicitudes que cumplan estos parámetros serán aprobadas automáticamente."
              </p>
              <div className="bg-white/80 p-2 rounded border border-[#E9D5FF] text-[11px] text-[#555555] space-y-1 font-mono">
                <div>• Tipo: <strong className="text-[#6B21A8]">{formType}</strong></div>
                <div>• Límites: <strong className="text-gray-800">$ {formMinAmount || '0'} - $ {formMaxAmount || '0'}</strong></div>
                {(formType.includes('Crédito') || formType.includes('Ampliación')) && (
                  <>
                    <div>• Score Mínimo: <strong className="text-gray-800">{formMinScore || '0'} pts</strong></div>
                    <div>• Antigüedad Mínima: <strong className="text-gray-800">{formMinAge || '0'} meses</strong></div>
                    <div>• Máximo de Cuotas: <strong className="text-gray-800">{formMaxInstallments || '0'} cuotas</strong></div>
                  </>
                )}
                <div>• Estado: <strong className={formActive ? 'text-[#16A34A]' : 'text-red-500'}>{formActive ? 'ACTIVO' : 'INACTIVO'}</strong></div>
              </div>
            </div>

            {/* BOTONES */}
            <div className="pt-1 flex flex-col space-y-2">
              <button 
                onClick={handleCreateOrEdit}
                className="w-full bg-[#16A34A] text-white font-bold py-2.5 text-sm flex justify-center items-center rounded-sm shadow-sm"
              >
                <Save className="w-4 h-4 mr-1.5" />
                {editingId ? 'GUARDAR CAMBIOS' : 'GUARDAR REGLA'}
              </button>
              <button 
                onClick={() => { setActiveTab('list'); resetForm(); }}
                className="w-full bg-white text-[#555555] border border-gray-300 font-bold py-2.5 text-sm flex justify-center items-center rounded-sm shadow-sm hover:bg-gray-50"
              >
                <X className="w-4 h-4 mr-1.5" />
                Cancelar
              </button>
            </div>
            
          </div>
        ) : (
          <div className="flex flex-col space-y-3">
            {/* COMPACT RULES LIST TABLE */}
            <div className="bg-white border border-gray-300 shadow-sm rounded-sm overflow-hidden flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[340px]">
                  <thead>
                    <tr className="bg-[#E5E7EB] text-[#333333] text-[10px] uppercase tracking-wider">
                      <th className="p-2 border-r border-gray-300 font-bold whitespace-nowrap w-12 text-center">ID</th>
                      <th className="p-2 border-r border-gray-300 font-bold whitespace-nowrap">Nombre</th>
                      <th className="p-2 border-r border-gray-300 font-bold whitespace-nowrap">Tipo</th>
                      <th className="p-2 border-r border-gray-300 font-bold whitespace-nowrap text-center w-16">Estado</th>
                      <th className="p-2 font-bold whitespace-nowrap text-center w-20">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-[#333333]">
                    {rules.map((rule) => (
                      <tr key={rule.id} className="border-b border-gray-200 hover:bg-gray-50/80 transition-colors">
                        <td className="p-2 border-r border-gray-200 text-center font-bold text-gray-500 whitespace-nowrap">
                          {rule.id}
                        </td>
                        <td className="p-2 border-r border-gray-200 font-semibold text-[#333333]">
                          {rule.name}
                        </td>
                        <td className="p-2 border-r border-gray-200 text-[#555555] text-[11px]">
                          {rule.type}
                        </td>
                        <td className="p-2 border-r border-gray-200 text-center">
                          <button 
                            onClick={() => toggleRuleActive(rule.id)}
                            className="focus:outline-none inline-flex"
                          >
                            {rule.active ? (
                              <span className="inline-flex items-center text-[10px] font-black uppercase text-[#16A34A] bg-green-50 px-2 py-0.5 rounded border border-green-200 shadow-sm">
                                Activo
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-[10px] font-black uppercase text-[#DC2626] bg-red-50 px-2 py-0.5 rounded border border-red-200 shadow-sm">
                                Inactivo
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="p-2 text-center">
                          <div className="flex justify-center items-center space-x-2">
                            <button 
                              onClick={() => startEdit(rule)}
                              className="p-1 hover:bg-[#FAF5FF] text-[#6B21A8] rounded"
                              title="Editar"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => deleteRule(rule.id)}
                              className="p-1 hover:bg-red-50 text-red-600 rounded"
                              title="Eliminar"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {rules.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-xs text-[#777777] italic bg-gray-50">
                          Ninguna llave automática configurada. Cree una nueva regla.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* QUICK RETBACK TO DASHBOARD */}
            <button 
              onClick={() => onNavigate && onNavigate('dashboard')}
              className="mt-2 w-full bg-[#333333] hover:bg-[#444444] text-white font-bold py-2.5 text-xs flex justify-center items-center rounded-sm shadow-sm uppercase tracking-wider"
            >
              <X className="w-4 h-4 mr-1.5" />
              Cerrar Módulo
            </button>
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={showConfirm} 
        onClose={() => setShowConfirm(false)} 
        onConfirm={saveRule}
        title="¿Desea guardar esta llave automática?"
        subtitle="Las solicitudes que cumplan estos parámetros se procesarán automáticamente."
        confirmText="Confirmar"
      />

    </div>
  );
}
