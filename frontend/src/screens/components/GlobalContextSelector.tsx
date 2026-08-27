import { useTenant } from '../../hooks/useTenant';
import { useGlobalContext } from '../../context/GlobalContext';
import { UnitSelectors } from './UnitSelectors';

interface GlobalContextSelectorProps {
  variant?: 'default' | 'header';
  className?: string;
  showVerTodas?: boolean;
}

/**
 * Seletor CN/Unidade ligado ao GlobalContext (CTX-01).
 * Filtra unidades por `usuario_unidades` quando a lista estiver preenchida.
 */
export function GlobalContextSelector({
  variant = 'header',
  className = '',
  showVerTodas = false,
}: GlobalContextSelectorProps) {
  const { usuarioUnidades, loading } = useTenant();
  const { selectedCnId, selectedUnitId, setSelectedCnId, setSelectedUnitId } = useGlobalContext();

  if (loading) return null;

  return (
    <UnitSelectors
      variant={variant}
      className={className}
      selectedCnId={selectedCnId || ''}
      selectedUnitId={selectedUnitId || ''}
      allowedUnitIds={usuarioUnidades}
      onCnChange={(id) => setSelectedCnId(id || null)}
      onUnitChange={(id) => setSelectedUnitId(id || null)}
      showVerTodas={showVerTodas}
    />
  );
}
