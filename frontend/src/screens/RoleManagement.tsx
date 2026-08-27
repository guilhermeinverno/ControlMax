import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  Loader2,
  Plus,
  Save,
  Shield,
  Trash2,
} from 'lucide-react';
import { Screen } from '../types';
import {
  PERMISSION_MATRIX_LABELS,
  emptyPermissionMatrix,
  type PermissionMatrix,
  type PermissionModule,
  type TenantRole,
} from '../types/rbac';
import { useTenantRoles } from '../hooks/useTenantRoles';
import { useHasPermission } from '../hooks/useHasPermission';

interface RoleManagementProps {
  onNavigate?: (screen: Screen) => void;
}

function cloneMatrix(m: PermissionMatrix): PermissionMatrix {
  return JSON.parse(JSON.stringify(m)) as PermissionMatrix;
}

/** Gestão de perfis RBAC (matriz de permissões por tenant). */
export function RoleManagement({ onNavigate }: RoleManagementProps) {
  const { can } = useHasPermission();
  const { roles, loading, error, saving, createRole, updateRole, deleteRole, cloneRole, refresh } =
    useTenantRoles();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [matrix, setMatrix] = useState<PermissionMatrix>(emptyPermissionMatrix());
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [isNewDraft, setIsNewDraft] = useState(false);

  const canManage = can('platform', 'manageRoles');

  const selected = useMemo(
    () => roles.find((r) => r.id === selectedId) || null,
    [roles, selectedId]
  );

  useEffect(() => {
    if (!selectedId && roles.length > 0 && !isNewDraft) {
      setSelectedId(roles[0].id);
    }
  }, [roles, selectedId, isNewDraft]);

  useEffect(() => {
    if (isNewDraft) return;
    if (!selected) return;
    setName(selected.name);
    setDescription(selected.description || '');
    setMatrix(cloneMatrix(selected.permissions || emptyPermissionMatrix()));
  }, [selected, isNewDraft]);

  const startNew = () => {
    setIsNewDraft(true);
    setSelectedId(null);
    setName('');
    setDescription('');
    setMatrix(emptyPermissionMatrix());
    setNotice(null);
  };

  const selectRole = (role: TenantRole) => {
    setIsNewDraft(false);
    setSelectedId(role.id);
    setNotice(null);
  };

  const toggle = (module: PermissionModule, action: string) => {
    setMatrix((prev) => {
      const next = cloneMatrix(prev);
      const mod = next[module] as Record<string, boolean>;
      mod[action] = !mod[action];
      return next;
    });
  };

  const handleSave = async () => {
    setNotice(null);
    try {
      if (!name.trim()) {
        setNotice({ type: 'err', text: 'Informe o nome do perfil.' });
        return;
      }
      if (isNewDraft || !selectedId) {
        const created = await createRole({ name, description, permissions: matrix });
        setIsNewDraft(false);
        setSelectedId(created.id);
        setNotice({ type: 'ok', text: 'Perfil criado com sucesso.' });
      } else {
        await updateRole(selectedId, { name, description, permissions: matrix });
        setNotice({ type: 'ok', text: 'Alterações salvas.' });
      }
    } catch (err) {
      setNotice({ type: 'err', text: err instanceof Error ? err.message : 'Falha ao salvar.' });
    }
  };

  const handleClone = async () => {
    if (!selected) return;
    setNotice(null);
    try {
      const created = await cloneRole(selected, `${selected.name} (cópia)`);
      setIsNewDraft(false);
      setSelectedId(created.id);
      setNotice({ type: 'ok', text: 'Perfil clonado. Edite e salve conforme necessário.' });
    } catch (err) {
      setNotice({ type: 'err', text: err instanceof Error ? err.message : 'Falha ao clonar.' });
    }
  };

  const handleDelete = async () => {
    if (!selected || selected.isSystemRole) return;
    if (!window.confirm(`Excluir o perfil "${selected.name}"?`)) return;
    setNotice(null);
    try {
      await deleteRole(selected.id);
      setSelectedId(null);
      setNotice({ type: 'ok', text: 'Perfil excluído.' });
    } catch (err) {
      setNotice({ type: 'err', text: err instanceof Error ? err.message : 'Falha ao excluir.' });
    }
  };

  if (!canManage) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-3">
        <Shield className="w-10 h-10 text-red-500 mx-auto" />
        <p className="font-bold text-gray-800">Acesso negado</p>
        <p className="text-sm text-gray-500">Requer platform.manageRoles (ou Admin).</p>
        <button type="button" className="text-[#6A008A] text-sm underline" onClick={() => onNavigate?.('dashboard')}>
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#6A008A] flex items-center gap-2">
            <Shield className="w-7 h-7" /> Perfis de acesso
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Crie perfis customizados e defina permissões granulares por módulo.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void refresh()}
            className="px-3 py-2 text-xs font-bold border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Atualizar
          </button>
          <button
            type="button"
            onClick={startNew}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-[#8CC63F] text-white rounded-md hover:bg-[#7BB52F]"
          >
            <Plus className="w-4 h-4" /> Novo perfil
          </button>
        </div>
      </header>

      {notice && (
        <div
          className={`flex items-start gap-2 text-sm rounded-lg border p-3 ${
            notice.type === 'ok'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {notice.type === 'ok' ? <Check className="w-4 h-4 mt-0.5" /> : <AlertCircle className="w-4 h-4 mt-0.5" />}
          <span>{notice.text}</span>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 text-sm rounded-lg border border-red-200 bg-red-50 text-red-700 p-3">
          <AlertCircle className="w-4 h-4 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 min-h-[480px]">
        <aside className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100 text-[10px] font-bold uppercase text-gray-500">
            Perfis do tenant
          </div>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <ul className="max-h-[70vh] overflow-y-auto divide-y divide-gray-50">
              {isNewDraft && (
                <li className="px-3 py-2.5 bg-purple-50 text-xs font-bold text-[#6A008A]">Novo perfil (rascunho)</li>
              )}
              {roles.map((role) => (
                <li key={role.id}>
                  <button
                    type="button"
                    onClick={() => selectRole(role)}
                    className={`w-full text-left px-3 py-2.5 text-xs transition-colors ${
                      selectedId === role.id && !isNewDraft
                        ? 'bg-[#6A008A]/10 text-[#6A008A] font-bold'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="block truncate">{role.name}</span>
                    {role.isSystemRole && (
                      <span className="text-[10px] text-gray-400 font-semibold">Sistema</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="block text-xs font-bold text-gray-600 space-y-1">
              <span>Nome do perfil *</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="Ex: Cobrador Campo"
              />
            </label>
            <label className="block text-xs font-bold text-gray-600 space-y-1">
              <span>Descrição</span>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="Opcional"
              />
            </label>
          </div>

          {selected?.isSystemRole && !isNewDraft && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              Perfil de sistema: pode editar permissões, mas não excluir. Use &quot;Salvar como novo&quot; para clonar.
            </p>
          )}

          <div className="overflow-x-auto border border-gray-100 rounded-lg">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500 uppercase tracking-wide">
                  <th className="text-left px-3 py-2 font-bold">Módulo</th>
                  <th className="text-left px-3 py-2 font-bold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {PERMISSION_MATRIX_LABELS.map((group) => (
                  <tr key={group.module} className="border-t border-gray-50 align-top">
                    <td className="px-3 py-3 font-bold text-gray-800 whitespace-nowrap">{group.title}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-3">
                        {group.actions.map((action) => {
                          const checked = Boolean(
                            (matrix[group.module] as Record<string, boolean>)[action.key]
                          );
                          return (
                            <label
                              key={action.key}
                              className="inline-flex items-center gap-1.5 cursor-pointer select-none"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggle(group.module, action.key)}
                                className="rounded border-gray-300"
                              />
                              <span className="text-gray-700 font-semibold">{action.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#6A008A] text-white text-xs font-bold disabled:opacity-40"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar alterações
            </button>
            {selected && !isNewDraft && (
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleClone()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-gray-300 text-xs font-bold hover:bg-gray-50 disabled:opacity-40"
              >
                <Copy className="w-4 h-4" /> Salvar como novo perfil
              </button>
            )}
            {selected && !selected.isSystemRole && !isNewDraft && (
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleDelete()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-red-200 text-red-700 text-xs font-bold hover:bg-red-50 disabled:opacity-40"
              >
                <Trash2 className="w-4 h-4" /> Excluir
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
