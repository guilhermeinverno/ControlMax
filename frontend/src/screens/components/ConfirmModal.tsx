
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  subtitle?: string;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  title = "¿Está seguro?",
  subtitle = "¡No podrá revertir esto!",
  confirmText = "Sí, eliminar",
  cancelText = "Cancelar"
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-[320px] p-6 flex flex-col items-center animate-in fade-in zoom-in duration-200">
        
        {/* Warning Icon Container */}
        <div className="w-16 h-16 rounded-full border-4 border-[#EAB308]/20 flex items-center justify-center mb-4">
          <div className="w-12 h-12 rounded-full border-2 border-[#EAB308] flex items-center justify-center">
            <span className="text-[#EAB308] font-bold text-2xl leading-none">!</span>
          </div>
        </div>
        
        {/* Texts */}
        <h2 className="text-[#333333] font-bold text-xl mb-1 text-center">{title}</h2>
        <p className="text-[#777777] text-sm mb-6 text-center">{subtitle}</p>
        
        {/* Buttons */}
        <div className="flex w-full space-x-3">
          <button 
            onClick={onClose}
            className="flex-1 bg-[#333333] text-white font-bold py-2.5 rounded text-sm shadow-sm"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 bg-[#2563EB] text-white font-bold py-2.5 rounded text-sm shadow-sm"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
