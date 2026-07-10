import { ClipboardList } from 'lucide-react';

export function FormsHeader() {
  return (
    <div className="border-b border-gray-200 pb-4">
      <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <ClipboardList className="w-6 h-6 text-purple-700" />
        <span>Formularios y Auditorías</span>
      </h1>
      <p className="text-xs text-gray-500 mt-1">
        Crea, administra y responde encuestas, checklists dinámicos y reportes de campo en tiempo real.
      </p>
    </div>
  );
}
