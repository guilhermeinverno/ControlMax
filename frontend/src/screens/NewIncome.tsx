import { useState } from 'react';
import type { HtmlInputChangeEvent } from '../types/reactEvents';
import { Screen } from '../types';
import { ConfirmModal } from './components/ConfirmModal';
import { NewIncomeCenterSelectors } from './components/NewIncomeCenterSelectors';
import { NewIncomeFormPanel } from './components/NewIncomeFormPanel';
import { NewIncomeHistoryPanel } from './components/NewIncomeHistoryPanel';
import { NewIncomeMainTabs } from './components/NewIncomeMainTabs';
import { useBox } from '../hooks/useBox';
import { useNewIncomeData } from '../hooks/useNewIncomeData';
import { getErrorMessage } from '../utils/errorMessage';
import { useTenant } from '../hooks/useTenant';
import { isSaleIncomeType } from '../utils/incomeTypeLabels';
import { persistIncomeAndUpdateBox, validateIncomeForm } from '../utils/incomeSave';

interface NewIncomeProps {
  onNavigate?: (screen: Screen) => void;
}

export function NewIncome({ onNavigate }: NewIncomeProps) {
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [subTab, setSubTab] = useState<'ingreso' | 'complementar'>('ingreso');
  const [showConfirm, setShowConfirm] = useState(false);
  const [amount, setAmount] = useState('0');
  const [incomeType, setIncomeType] = useState('');
  const [comment, setComment] = useState('');
  const [description, setDescription] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [selectedSaleId, setSelectedSaleId] = useState('');
  const [selectedSaleName, setSelectedSaleName] = useState('');
  const [seeAllUnits, setSeeAllUnits] = useState(false);

  const { activeBox } = useBox();
  const { tenantId, userName } = useTenant();
  const {
    centers,
    selectedCnId,
    selectedUnitId,
    incomes,
    loadingHistory,
    salesList,
    handleCnChange,
    handleUnitChange,
    currentSelectedBox,
  } = useNewIncomeData({ tenantId, activeBox });

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

  const handleIncomeTypeChange = (value: string) => {
    setIncomeType(value);
    if (!isSaleIncomeType(value)) {
      setSelectedSaleId('');
      setSelectedSaleName('');
    }
  };

  const handleSave = async () => {
    const validationError = validateIncomeForm({
      tenantId,
      currentSelectedBox,
      incomeType,
      selectedSaleId,
      selectedSaleName,
      amount,
      comment,
      description,
      fileName,
      fileUrl,
      userName,
    });

    if (validationError) {
      setSaveError(validationError);
      return;
    }

    setSaveError(null);
    setSuccessMsg(null);
    setSaving(true);
    setShowConfirm(false);

    try {
      await persistIncomeAndUpdateBox({
        tenantId,
        currentSelectedBox,
        incomeType,
        selectedSaleId,
        selectedSaleName,
        amount,
        comment,
        description,
        fileName,
        fileUrl,
        userName,
      });

      setSuccessMsg('¡Ingreso registrado y caja actualizada correctamente!');
      setTimeout(() => onNavigate?.('dashboard'), 1500);
    } catch (error) {
      console.error('Error creating income:', error);
      setSaveError(getErrorMessage(error) || 'Error al guardar el ingreso.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col bg-[#F0F2F5] min-h-screen text-[#333333] pb-12 select-none">
      <NewIncomeCenterSelectors
        centers={centers}
        selectedCnId={selectedCnId}
        selectedUnitId={selectedUnitId}
        seeAllUnits={seeAllUnits}
        onCnChange={handleCnChange}
        onUnitChange={handleUnitChange}
        onSeeAllUnitsChange={setSeeAllUnits}
      />

      <NewIncomeMainTabs activeTab={activeTab} onChange={setActiveTab} />

      <div className="p-4 max-w-md mx-auto w-full">
        {activeTab === 'new' ? (
          <NewIncomeFormPanel
            subTab={subTab}
            onSubTabChange={setSubTab}
            currentSelectedBox={currentSelectedBox}
            incomeType={incomeType}
            onIncomeTypeChange={handleIncomeTypeChange}
            salesList={salesList}
            selectedSaleId={selectedSaleId}
            onSaleSelect={(saleId, saleName) => {
              setSelectedSaleId(saleId);
              setSelectedSaleName(saleName);
            }}
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
          <NewIncomeHistoryPanel loadingHistory={loadingHistory} incomes={incomes} />
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
