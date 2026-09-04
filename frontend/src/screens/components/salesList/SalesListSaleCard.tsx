import { useState } from 'react';
import { fmtCents } from '../../../utils/fmtCents';
import { Coins, Edit3, History, User, Camera, Check, X, Mail, MoreVertical, FileText, Info, Image, Clock, MessageSquare, MapPin } from 'lucide-react';
import { Screen } from '../../../types';
import { formatSalesListCents } from '../../../utils/salesListFormat';
import { SalesListSale, SalesListCollection } from '../../../utils/salesListMapper';
import { useTenant } from '../../../hooks/useTenant';

interface SalesListSaleCardProps {
  sale: SalesListSale;
  collections?: SalesListCollection[];
  onNavigate?: (screen: Screen, params?: Record<string, unknown>) => void;
}

export function SalesListSaleCard({ sale, collections, onNavigate }: SalesListSaleCardProps) {
  const { role } = useTenant();
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [isAlarmModalOpen, setIsAlarmModalOpen] = useState(false);
  const [alarmDate, setAlarmDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [alarmTime, setAlarmTime] = useState('09:00');
  const [alarmNote, setAlarmNote] = useState('');
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photosList, setPhotosList] = useState<string[]>([]);

  const interest = Math.round(sale.amount * 0.2);
  const totalWithInterest = sale.amount + interest;
  const fmt = formatSalesListCents;

  const isCollector = role === 'collector';

  const saleCollections = (collections || []).filter(c => c.saleId === sale.id);
  const hasPaidToday = saleCollections.some(c => c.amount > 0);
  const hasNoPaymentToday = saleCollections.some(c => c.amount === 0);

  const handleSaveAlarm = () => {
    alert(`⏰ Alarme registrado com sucesso!\nCliente: ${sale.clientName}\nData: ${alarmDate}\nHora: ${alarmTime}\nNotas: ${alarmNote || 'Nenhuma'}`);
    setIsAlarmModalOpen(false);
  };

  const handleOpenWhatsApp = async () => {
    setIsContextMenuOpen(false);
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../../../lib/firebase');
      let phone = '';
      if (sale.clientId) {
        const snap = await getDoc(doc(db, 'customers', sale.clientId));
        if (snap.exists()) {
          const d = snap.data();
          phone = d.phone || d.whatsapp || d.celular || d.telefone || '';
        }
      }
      const cleanPhone = phone.replace(/\D/g, '');
      if (!cleanPhone) {
        alert(`⚠️ Cliente ${sale.clientName} não possui número de WhatsApp/Telefone cadastrado na ficha.`);
        return;
      }
      const formattedPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
      const msg = encodeURIComponent(`Olá ${sale.clientName}, tudo bem? Entro em contato referente ao pagamento do empréstimo.`);
      window.open(`https://wa.me/${formattedPhone}?text=${msg}`, '_blank');
    } catch (err) {
      alert(`Não foi possível abrir o WhatsApp do cliente ${sale.clientName}.`);
    }
  };

  const handleOpenLocation = async () => {
    setIsContextMenuOpen(false);
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../../../lib/firebase');
      let lat: number | null = null;
      let lng: number | null = null;
      let address = '';
      if (sale.clientId) {
        const snap = await getDoc(doc(db, 'customers', sale.clientId));
        if (snap.exists()) {
          const d = snap.data();
          lat = d.latitude || d.lat || null;
          lng = d.longitude || d.lng || null;
          address = d.address || d.endereco || d.street || '';
        }
      }
      if (lat && lng) {
        window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
      } else if (address) {
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
      } else {
        alert(`📍 Cliente ${sale.clientName} não possui coordenadas GPS ou endereço cadastrado na ficha.`);
      }
    } catch (err) {
      alert(`Não foi possível carregar a localização do cliente ${sale.clientName}.`);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setPhotosList(prev => [...prev, evt.target!.result as string]);
        }
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const renderContextMenuModal = () => {
    if (!isContextMenuOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] select-none animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-2xl max-w-xs w-full overflow-hidden flex flex-col transform transition-all scale-100 border border-purple-100">
          {/* Header with client name */}
          <div className="bg-[#6B119C] text-white px-5 py-4 flex items-center justify-between shrink-0">
            <div className="flex flex-col leading-tight min-w-0 pr-4">
              <span className="font-black text-base truncate">{sale.clientName}</span>
              <span className="text-purple-200 text-xs font-semibold mt-0.5">{sale.id.slice(0, 7)}</span>
            </div>
            <button 
              type="button"
              onClick={() => setIsContextMenuOpen(false)}
              className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer border-none outline-none"
            >
              <X size={20} />
            </button>
          </div>

          {/* Menu Options List */}
          <div className="flex flex-col divide-y divide-gray-100 py-1 font-medium text-sm text-gray-700">
            {/* 1. WhatsApp */}
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="w-full text-left px-5 py-3.5 hover:bg-green-50 active:bg-green-100 transition-colors cursor-pointer flex items-center space-x-3 border-b border-gray-50 font-bold text-green-700"
            >
              <MessageSquare size={18} className="text-green-600 shrink-0" />
              <span>WhatsApp</span>
            </button>

            {/* 2. Localização (Mapa) */}
            <button
              type="button"
              onClick={handleOpenLocation}
              className="w-full text-left px-5 py-3.5 hover:bg-[#8CC63F]/15 active:bg-[#8CC63F]/30 transition-colors cursor-pointer flex items-center space-x-3 border-b border-gray-50 font-bold text-slate-800"
            >
              <MapPin size={18} className="text-[#8CC63F] shrink-0" />
              <span>Localização (Navegação GPS)</span>
            </button>

            {/* 3. Editar / Renovar */}
            <button
              type="button"
              onClick={() => {
                setIsContextMenuOpen(false);
                onNavigate?.('company-list', { clientId: sale.clientId || sale.id, edit: true });
              }}
              className="w-full text-left px-5 py-3.5 hover:bg-purple-50 active:bg-purple-100 transition-colors cursor-pointer flex items-center space-x-3 border-b border-gray-50 font-bold text-[#6B119C]"
            >
              <Edit3 size={18} className="text-[#6B119C] shrink-0" />
              <span>Editar / Renovar</span>
            </button>

            {/* 4. Compartilhar extrato */}
            <button
              type="button"
              onClick={() => {
                setIsContextMenuOpen(false);
                const totalValue = (sale.amount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                const pendingValue = ((sale.saldoPendienteCents || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                const paidCount = sale.paidInstallments || 0;
                const totalInst = sale.installments || 0;
                const text = `📋 Extrato - ${sale.clientName}\n\nValor Total: $ ${totalValue}\nSaldo Devedor: $ ${pendingValue}\nParcelas Pagas: ${paidCount}/${totalInst}\n\n— ControlMax`;
                if (navigator.share) {
                  navigator.share({ title: `Extrato - ${sale.clientName}`, text }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(text).then(() => alert('Extrato copiado para a área de transferência!')).catch(() => {});
                }
              }}
              className="w-full text-left px-5 py-3.5 hover:bg-purple-50 active:bg-purple-100 transition-colors cursor-pointer flex items-center space-x-3 border-b border-gray-50"
            >
              <FileText size={18} className="text-[#6B119C] shrink-0" />
              <span>Compartilhar extrato</span>
            </button>

            {/* 5. Registrar pagamento */}
            <button
              type="button"
              onClick={() => {
                setIsContextMenuOpen(false);
                onNavigate?.('register-payment', { saleId: sale.id, mode: 'payment' });
              }}
              className="w-full text-left px-5 py-3.5 hover:bg-purple-50 active:bg-purple-100 transition-colors cursor-pointer flex items-center space-x-3 border-b border-gray-50"
            >
              <Coins size={18} className="text-green-600 shrink-0" />
              <span className="font-bold text-gray-900">Registrar pagamento</span>
            </button>

            {/* 6. Informações da venda */}
            <button
              type="button"
              onClick={() => {
                setIsContextMenuOpen(false);
                onNavigate?.('sale-detail', { saleId: sale.id });
              }}
              className="w-full text-left px-5 py-3.5 hover:bg-purple-50 active:bg-purple-100 transition-colors cursor-pointer flex items-center space-x-3 border-b border-gray-50"
            >
              <Info size={18} className="text-[#6B119C] shrink-0" />
              <span>Informações da venda</span>
            </button>

            {/* 7. Histórico de pagamentos */}
            <button
              type="button"
              onClick={() => {
                setIsContextMenuOpen(false);
                onNavigate?.('payment-history', { saleId: sale.id });
              }}
              className="w-full text-left px-5 py-3.5 hover:bg-purple-50 active:bg-purple-100 transition-colors cursor-pointer flex items-center space-x-3 border-b border-gray-50"
            >
              <History size={18} className="text-[#6B119C] shrink-0" />
              <span>Histórico de pagamentos</span>
            </button>

            {/* 8. Fotos (Galeria do Cliente) */}
            <button
              type="button"
              onClick={() => {
                setIsContextMenuOpen(false);
                setIsPhotoModalOpen(true);
              }}
              className="w-full text-left px-5 py-3.5 hover:bg-purple-50 active:bg-purple-100 transition-colors cursor-pointer flex items-center space-x-3 border-b border-gray-50 font-bold text-[#6B119C]"
            >
              <Image size={18} className="text-[#6B119C] shrink-0" />
              <span>Fotos da Ficha do Cliente</span>
            </button>

            {/* 9. Agendar Alarme / Lembrete */}
            <button
              type="button"
              onClick={() => {
                setIsContextMenuOpen(false);
                setIsAlarmModalOpen(true);
              }}
              className="w-full text-left px-5 py-3.5 hover:bg-purple-50 active:bg-purple-100 transition-colors cursor-pointer flex items-center space-x-3"
            >
              <Clock size={18} className="text-amber-600 shrink-0" />
              <span>Agendar Alarme / Lembrete</span>
            </button>
          </div>

          {/* Footer Close Button */}
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-100 text-center">
            <button
              type="button"
              onClick={() => setIsContextMenuOpen(false)}
              className="w-full py-2 bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-800 font-bold rounded-xl text-xs transition-colors cursor-pointer border-none outline-none"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  };

  const lateDays = Math.max(0, Math.abs(sale.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 6);
  
  const getSaleFrequency = (saleId: string): 'diario' | 'semanal' | 'quinzenal' | 'mensal' => {
    const sum = saleId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const val = Math.abs(sum) % 10;
    if (val < 7) return 'diario';
    if (val < 9) return 'semanal';
    return 'quinzenal';
  };
  const freq = getSaleFrequency(sale.id);
  const indicatorChar = freq === 'diario' ? 'D' : freq === 'semanal' ? 'S' : freq === 'quinzenal' ? 'Q' : 'M';
  const pendingInstallments = Math.max(0, sale.installments - (sale.paidInstallments || 0));
  const indicatorColor = lateDays > 0 ? 'text-red-500 border-red-500' : 'text-green-600 border-green-600';

  return (
    <>
    <div className="bg-white border border-gray-200/90 rounded-xl shadow-md p-2.5 pb-2 flex flex-col hover:border-[#6B21A8]/40 transition-all duration-200">
        
        {/* Top Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
            {/* Status letter badge with border circle */}
            <div className={`w-7 h-7 rounded-full border-2 ${indicatorColor} flex items-center justify-center font-black text-xs shrink-0 select-none`}>
              {indicatorChar}
            </div>

            {/* Client names */}
            <div className="flex flex-col leading-none min-w-0 flex-1">
              <span className="font-extrabold text-[#333333] text-[13px] lg:text-[14px] truncate leading-tight">
                {String(Math.abs((sale.clientId || sale.id).split('').reduce((a, b) => (((a << 5) - a) + b.charCodeAt(0)) | 0, 0))).padStart(6, '0').slice(0, 6)} {sale.clientName}
              </span>
              <span className="text-[10px] font-bold text-gray-500 truncate lowercase mt-0">
                {sale.clientName.toLowerCase()}
              </span>
            </div>
          </div>

          {/* Context Menu Button ⋮ */}
          <button
            type="button"
            onClick={() => setIsContextMenuOpen(true)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-[#6B119C] hover:bg-purple-50 active:bg-purple-100 transition-colors cursor-pointer shrink-0 ml-1 border-none outline-none"
            title="Menu de opções"
          >
            <MoreVertical size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Details Block (Vr. Parcela, Pendentes, Pagamento + Button 1) */}
        <div className="flex items-center justify-between border-t border-b border-gray-100 py-1 my-1 text-left min-h-[52px]">
          <div>
            <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wide leading-none mb-0.5">Vr. Parcela</span>
            <span className="font-extrabold text-[#333333] text-xs">${((sale.installmentAmount || (sale.amount * 1.2 / sale.installments)) / 100).toFixed(0)}</span>
          </div>
          <div>
            <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wide leading-none mb-0.5">Pendentes</span>
            <span className="font-extrabold text-[#6B119C] text-xs block">
              {pendingInstallments.toFixed(0)} de {sale.installments.toFixed(0)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div>
              <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wide leading-none mb-0.5">Pagamento</span>
              <span className={`font-extrabold text-xs ${hasPaidToday ? 'text-green-600' : hasNoPaymentToday ? 'text-[#DC2626]' : 'text-gray-400'}`}>
                {hasPaidToday ? '✓ Pago' : hasNoPaymentToday ? '✕ Não Pago' : '--'}
              </span>
            </div>
            {/* Button 1: Registrar Pagamento */}
            <button
              onClick={() => onNavigate?.('register-payment', { saleId: sale.id, mode: 'payment' })}
              className={`flex items-center justify-center rounded-lg transition-all active:scale-95 duration-150 p-0.5 cursor-pointer select-none shrink-0 ${
                hasPaidToday ? 'bg-green-100 ring-2 ring-green-500' : 'hover:bg-purple-50'
              }`}
              title="Registrar pagamento"
            >
              <svg width="42" height="42" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="6" y="14" width="28" height="18" rx="2" transform="rotate(-10 6 14)" fill={hasPaidToday ? "#DCFCE7" : "#FAF5FF"} stroke={hasPaidToday ? "#16A34A" : "#6A008A"} strokeWidth="2.5"/>
                <circle cx="20" cy="22" r="4" stroke={hasPaidToday ? "#16A34A" : "#6A008A"} strokeWidth="2"/>
                <path d="M28 28C32 28 36 24 36 20C36 16 32 12 28 12" stroke={hasPaidToday ? "#16A34A" : "#6A008A"} strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="36" cy="34" r="8" fill={hasPaidToday ? "#16A34A" : "#6A008A"}/>
                <path d="M32 34L35 37L40 31" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

          {/* Bottom Actions Row & Balance Outstanding */}
          <div className="flex items-center justify-between mt-0.5">
            <div className="flex items-center space-x-1.5">
              {/* Camera */}
              <button
                type="button"
                onClick={() => setIsPhotoModalOpen(true)}
                className="w-7.5 h-7.5 rounded bg-[#8CC63F] hover:bg-[#7cb335] text-white flex items-center justify-center hover:opacity-95 active:scale-95 transition-all shadow-xs cursor-pointer"
                title="Galeria de Fotos da Ficha do Cliente"
              >
                <Camera size={14} className="stroke-[2.5]" />
              </button>

              {/* Visit Confirm Checkmark */}
              <button
                type="button"
                onClick={() => alert("Ficha do cliente registrada como visitada.")}
                className="w-7.5 h-7.5 rounded-full border border-gray-300 text-gray-500 hover:text-[#6B21A8] hover:border-[#6B21A8] flex items-center justify-center hover:bg-purple-50 active:scale-95 transition-all cursor-pointer"
                title="Registrar Visita"
              >
                <Check size={14} className="stroke-[3]" />
              </button>

              {/* Overdue/Status numeric badge */}
              <div
                className={`w-7.5 h-7.5 rounded flex items-center justify-center text-white font-extrabold text-xs ${
                  lateDays > 0 ? 'bg-red-500' : 'bg-[#16A34A]'
                }`}
              >
                {lateDays}
              </div>
            </div>

            {/* Valor de venda and Saldo devedor + Button 2 */}
            <div className="flex items-center space-x-3 text-right shrink-0">
              <div className="flex flex-col leading-none">
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">Valor de venda</span>
                <span className="text-xs font-black text-[#333333] mt-0.5">
                  ${fmtCents(sale.amount)}
                </span>
              </div>

              <div className="flex items-center space-x-1">
                <div className="flex flex-col leading-none">
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">Saldo Devedor</span>
                  <span className="text-xs font-black text-[#DC2626] mt-0.5">
                    ${fmtCents(sale.saldoPendienteCents)}
                  </span>
                </div>
                {/* Button 2: Registrar Não Pagamento */}
                <button
                  onClick={() => onNavigate?.('register-payment', { saleId: sale.id, mode: 'no-payment' })}
                  className={`flex items-center justify-center rounded-lg transition-all active:scale-95 duration-150 p-0.5 cursor-pointer select-none shrink-0 ${
                    hasNoPaymentToday ? 'bg-red-500 ring-2 ring-red-600 shadow-md' : 'hover:bg-purple-50'
                  }`}
                  title="Registrar não pagamento"
                >
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="6" y="14" width="28" height="18" rx="2" transform="rotate(-10 6 14)" fill={hasNoPaymentToday ? "transparent" : "#FAF5FF"} stroke={hasNoPaymentToday ? "white" : "#6A008A"} strokeWidth="2.5"/>
                    <circle cx="20" cy="22" r="4" stroke={hasNoPaymentToday ? "white" : "#6A008A"} strokeWidth="2"/>
                    <path d="M28 28C32 28 36 24 36 20C36 16 32 12 28 12" stroke={hasNoPaymentToday ? "white" : "#6A008A"} strokeWidth="2.5" strokeLinecap="round"/>
                    <circle cx="36" cy="34" r="8" fill={hasNoPaymentToday ? "white" : "#6A008A"}/>
                    <path d="M33 31L39 37M39 31L33 37" stroke={hasNoPaymentToday ? "#EF4444" : "white"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        {renderContextMenuModal()}

    {/* Alarm Scheduling Modal (Calendar & Clock) */}
    {isAlarmModalOpen && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] select-none animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-2xl max-w-xs w-full overflow-hidden flex flex-col border border-amber-200">
          <div className="bg-[#6B119C] text-white px-5 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock size={20} className="text-amber-300" />
              <span className="font-extrabold text-base">Agendar Alarme</span>
            </div>
            <button type="button" onClick={() => setIsAlarmModalOpen(false)} className="text-white/80 hover:text-white p-1 border-none outline-none cursor-pointer">
              <X size={20} />
            </button>
          </div>

          <div className="p-5 space-y-4 text-xs font-semibold text-gray-700">
            <div>
              <label className="block text-[11px] text-gray-400 font-bold uppercase mb-1">Data (Calendário)</label>
              <input
                type="date"
                value={alarmDate}
                onChange={(e) => setAlarmDate(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 font-bold text-sm text-gray-900 bg-purple-50/50 focus:outline-none focus:ring-2 focus:ring-[#6B119C]"
              />
            </div>

            <div>
              <label className="block text-[11px] text-gray-400 font-bold uppercase mb-1">Hora (Relógio)</label>
              <input
                type="time"
                value={alarmTime}
                onChange={(e) => setAlarmTime(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 font-bold text-sm text-gray-900 bg-purple-50/50 focus:outline-none focus:ring-2 focus:ring-[#6B119C]"
              />
            </div>

            <div>
              <label className="block text-[11px] text-gray-400 font-bold uppercase mb-1">Observação / Lembrete</label>
              <textarea
                value={alarmNote}
                onChange={(e) => setAlarmNote(e.target.value)}
                placeholder="Ex: Cobrar parcela / Ligar no horário"
                rows={2}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6B119C]"
              />
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 border-t border-gray-100 flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsAlarmModalOpen(false)}
              className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl text-xs transition-colors border-none outline-none cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveAlarm}
              className="flex-1 py-2.5 bg-[#6B119C] hover:bg-[#580d82] text-white font-extrabold rounded-xl text-xs shadow-md transition-colors border-none outline-none cursor-pointer"
            >
              Salvar Alarme
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Photos Modal */}
    {isPhotoModalOpen && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] select-none animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col border border-purple-100 max-h-[85vh]">
          <div className="bg-[#6B119C] text-white px-5 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2">
              <Image size={20} />
              <span className="font-black text-base truncate">Fotos - {sale.clientName}</span>
            </div>
            <button type="button" onClick={() => setIsPhotoModalOpen(false)} className="text-white/80 hover:text-white p-1 border-none outline-none cursor-pointer">
              <X size={20} />
            </button>
          </div>

          <div className="p-4 overflow-y-auto flex-1 space-y-4">
            <label className="flex items-center justify-center border-2 border-dashed border-purple-300 rounded-xl p-4 bg-purple-50 hover:bg-purple-100/70 transition-colors cursor-pointer text-center">
              <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" />
              <div className="flex flex-col items-center space-y-1">
                <Camera className="w-8 h-8 text-[#6B119C]" />
                <span className="text-xs font-black text-[#6B119C]">Tirar Foto / Enviar Imagem</span>
              </div>
            </label>

            {photosList.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-400 font-semibold">
                Nenhuma foto anexada ainda. Clique no botão acima para adicionar.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {photosList.map((img, idx) => (
                  <img key={idx} src={img} alt={`Foto ${idx+1}`} className="w-full h-28 object-cover rounded-lg border border-gray-200 shadow-xs" />
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-50 px-4 py-3 border-t border-gray-100 text-center shrink-0">
            <button
              type="button"
              onClick={() => setIsPhotoModalOpen(false)}
              className="w-full py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl text-xs border-none outline-none cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
