import { useState } from 'react';
import type { HtmlInputChangeEvent } from '../types/reactEvents';
import { Screen } from '../types';
import { ConfirmModal } from './components/ConfirmModal';
import { NewExpenseCnSelector } from './components/NewExpenseCnSelector';
import { NewExpenseFormPanel } from './components/NewExpenseFormPanel';
import { NewExpenseHistoryPanel } from './components/NewExpenseHistoryPanel';
import { NewExpenseMainTabs } from './components/NewExpenseMainTabs';
import { useBox } from '../hooks/useBox';
import { useNewExpenseData } from '../hooks/useNewExpenseData';
import { useTenant } from '../hooks/useTenant';
import { getErrorMessage } from '../utils/errorMessage';
import { expenseSuccessMessage, persistExpense, validateExpenseForm } from '../utils/expenseSave';

interface NewExpenseProps {
  onNavigate?: (screen: Screen) => void;
}

export function NewExpense({ onNavigate }: NewExpenseProps) {
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [egresoMode, setEgresoMode] = useState<'gasto' | 'retiro'>('gasto');
  const [showConfirm, setShowConfirm] = useState(false);
  const [amount, setAmount] = useState('0');
  const [expenseType, setExpenseType] = useState('');
  const [comment, setComment] = useState('');
  const [description, setDescription] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  const { activeBox } = useBox();
  const { tenantId, role, userName, isSuperAdmin } = useTenant();
  const {
    centers,
    selectedCnId,
    selectedCnName,
    selectedBoxId,
    selectedBoxName,
    cnOpenBoxes,
    unifiedHistory,
    loadingHistory,
    handleCnChange,
    handleBoxChange,
  } = useNewExpenseData({ tenantId, activeBox });

  const handleFileChange = (e: HtmlInputChangeEvent) => {
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

  const handleSave = async () => {
    const formInput = {
      tenantId,
      egresoMode,
      selectedCnId,
      selectedCnName,
      selectedBoxId,
      selectedBoxName,
      expenseType,
      amount,
      comment,
      description,
      fileName,
      fileUrl,
      userName,
      role,
      isSuperAdmin,
    };

    const validationError = validateExpenseForm(formInput);
    if (validationError) {
      setSaveError(validationError);
      return;
    }

    setSaveError(null);
    setSuccessMsg(null);
    setSaving(true);
    setShowConfirm(false);

    try {
      const status = await persistExpense(formInput);
      setSuccessMsg(expenseSuccessMessage(egresoMode, status));
      setTimeout(() => onNavigate?.('dashboard'), 1500);
    } catch (error) {
      console.error('Error creating expense:', error);
      setSaveError(getErrorMessage(error) || 'Error al guardar el egreso.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col bg-[#F0F2F5] min-h-screen text-[#333333] pb-12 select-none">
      <NewExpenseCnSelector centers={centers} selectedCnId={selectedCnId} onCnChange={handleCnChange} />
      <NewExpenseMainTabs activeTab={activeTab} onChange={setActiveTab} />

      <div className="p-4 max-w-md mx-auto w-full">
        {activeTab === 'new' ? (
          <NewExpenseFormPanel
            egresoMode={egresoMode}
            onEgresoModeChange={setEgresoMode}
            centers={centers}
            selectedCnId={selectedCnId}
            onCnChange={handleCnChange}
            cnOpenBoxes={cnOpenBoxes}
            selectedBoxId={selectedBoxId}
            onBoxChange={handleBoxChange}
            expenseType={expenseType}
            onExpenseTypeChange={setExpenseType}
            amount={amount}
            onAmountChange={setAmount}
            comment={comment}
            onCommentChange={setComment}
            description={description}
            onDescriptionChange={setDescription}
            fileName={fileName}
            fileUrl={fileUrl}
            onFileChange={handleFileChange}
            onRemoveFile={() => {
              setFileName('');
              setFileUrl('');
            }}
            successMsg={successMsg}
            saveError={saveError}
            saving={saving}
            onSaveClick={() => setShowConfirm(true)}
            onNavigate={onNavigate}
          />
        ) : (
          <NewExpenseHistoryPanel loadingHistory={loadingHistory} unifiedHistory={unifiedHistory} />
        )}
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSave}
        title="¿Confirmar registro?"
        subtitle={
          egresoMode === 'gasto'
            ? 'Se registrará un nuevo gasto en la caja seleccionada'
            : 'Se registrará un nuevo retiro de CN Principal'
        }
        confirmText="Sí guardar"
      />
    </div>
  );
}
