import { PlatformSettings } from '../../../types/platformSettings';

interface PlatformTabProps {
  settings: PlatformSettings;
  onChange: (field: keyof PlatformSettings, value: unknown) => void;
}

export function PlatformToggle({
  enabled,
  onToggle,
  activeClass = 'bg-[#8CC63F]',
}: {
  enabled: boolean;
  onToggle: () => void;
  activeClass?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-12 h-6.5 rounded-full p-1.5 transition-colors cursor-pointer focus:outline-none ${enabled ? activeClass : 'bg-gray-300'}`}
    >
      <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform ${enabled ? 'translate-x-5.5' : 'translate-x-0'}`} />
    </button>
  );
}

export type { PlatformTabProps };
