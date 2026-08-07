import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useTenant } from '../hooks/useTenant';
import { Shield, Check, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { Screen } from '../types';

interface ProfilesProps {
  onNavigate?: (screen: Screen) => void;
}

interface PermissionItem {
  name: string;
  key: string;
}

interface PermissionGroup {
  title: string;
  items: PermissionItem[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    title: 'Ventas',
    items: [
      { name: 'Ingresos / Complementarios', key: 'ventas:ingresos' },
      { name: 'Resumen por periodo', key: 'ventas:resumen_periodo' },
      { name: 'Gastos', key: 'ventas:gastos' },
      { name: 'Apertura masiva de cajas', key: 'ventas:apertura_masiva' },
      { name: 'Ventas', key: 'ventas:lista' },
      { name: 'Aprobación de pre venta', key: 'ventas:aprobar_preventa' },
      { name: 'Gestión de caja: Abrir y cerrar', key: 'ventas:caja_gestion' },
      { name: 'Abrir Caja', key: 'ventas:abrir_caja' },
      { name: 'Cerrar Caja', key: 'ventas:cerrar_caja' },
      { name: 'Confirmar Caja', key: 'ventas:confirmar_caja' },
      { name: 'Resumen', key: 'ventas:resumen' },
      { name: 'Aprobación de llaves automáticas', key: 'ventas:aprobar_llaves' },
      { name: 'Crear llave', key: 'ventas:crear_llave' },
      { name: 'Limpieza de cobro', key: 'ventas:limpieza_cobro' },
      { name: 'Aprobación de Pre Gastos', key: 'ventas:aprobar_pregastos' },
      { name: 'Transferencia masiva de ventas', key: 'ventas:transferencia_masiva' },
    ]
  },
  {
    title: 'Permisos adicionales',
    items: [
      { name: 'Gráficos', key: 'adicionales:graficos' },
      { name: 'Permitir transferencias', key: 'adicionales:transferencias' },
    ]
  },
  {
    title: 'Centros de negocios',
    items: [
      { name: 'Ingresos', key: 'centros:ingresos' },
      { name: 'Resumen por periodo', key: 'centros:resumen_periodo' },
      { name: 'Cierre masivo de cajas', key: 'centros:cierre_masivo' },
      { name: 'Egresos', key: 'centros:egresos' },
      { name: 'Traslado de unidades', key: 'centros:traslado_unidades' },
      { name: 'Transferencia de dinero', key: 'centros:transferencia_dinero' },
      { name: 'Gestión de caja: Abrir y cerrar', key: 'centros:caja_gestion' },
      { name: 'Abrir Caja', key: 'centros:abrir_caja' },
      { name: 'Cerrar Caja', key: 'centros:cerrar_caja' },
      { name: 'Confirmar Caja', key: 'centros:confirmar_caja' },
      { name: 'Resumen', key: 'centros:resumen' },
      { name: 'Mapa', key: 'centros:mapa' },
      { name: 'Facturación', key: 'centros:facturacion' },
      { name: 'Seguros', key: 'centros:seguros' },
      { name: 'Consulta de facturas', key: 'centros:consulta_facturas' },
      { name: 'Fondeo', key: 'centros:fondeo' },
      { name: 'Préstamos', key: 'centros:prestamos' },
      { name: 'Aprobaciones', key: 'centros:aprobaciones' },
    ]
  },
  {
    title: 'Administración',
    items: [
      { name: 'Gestión de Plataforma', key: 'admin:plataforma' },
      { name: 'Sociedades', key: 'admin:sociedades' },
      { name: 'Centros de negocios', key: 'admin:centros' },
      { name: 'Unidades', key: 'admin:unidades' },
      { name: 'Trabajadores', key: 'admin:trabajadores' },
      { name: 'Tipos de movimientos', key: 'admin:movimientos' },
      { name: 'Dispositivos', key: 'admin:dispositivos' },
      { name: 'Liquidación del trabajador', key: 'admin:liquidacion' },
      { name: 'Gestión de Usuarios', key: 'admin:usuarios_gestion' },
      { name: 'Perfiles', key: 'admin:perfiles' },
      { name: 'Usuarios', key: 'admin:usuarios' },
      { name: 'Asignación de unidades', key: 'admin:asignar_unidades' },
      { name: 'Gestión de Clientes', key: 'admin:clientes' },
      { name: 'Lista negra', key: 'admin:lista_negra' },
    ]
  },
  {
    title: 'Reportes',
    items: [
      { name: 'Ventas', key: 'reportes:ventas' },
      { name: 'Plataforma', key: 'reportes:plataforma' },
      { name: 'Procesos encolados', key: 'reportes:procesos_encolados' },
      { name: 'Log de Acciones', key: 'reportes:log_acciones' },
      { name: 'Log Móvil', key: 'reportes:log_movil' },
      { name: 'Verificación de ventas', key: 'reportes:verificacion_ventas' },
      { name: 'Reportes Personalizados', key: 'reportes:personalizados' },
      { name: 'Ubicar Mis Trabajadores', key: 'reportes:ubicar_cobradores' },
      { name: 'Reportes Rápidos', key: 'reportes:rapidos' },
      { name: 'Reporte Dispositivos Vinculados', key: 'reportes:dispositivos_vinculados' },
      { name: 'Histórico de alertas de pánico', key: 'reportes:historico_panico' },
    ]
  }
];

const ROLES = [
  { id: 'admin', label: 'Administrador' },
  { id: 'supervisor', label: 'Supervisor' },
  { id: 'collector', label: 'Cobrador / Cajero' }
];

const DEFAULT_PERMISSIONS: Record<string, Record<string, boolean>> = {
  admin: {
    'ventas:ingresos': true,
    'ventas:resumen_periodo': true,
    'ventas:gastos': true,
    'ventas:apertura_masiva': true,
    'ventas:lista': true,
    'ventas:aprobar_preventa': true,
    'ventas:caja_gestion': true,
    'ventas:abrir_caja': true,
    'ventas:cerrar_caja': true,
    'ventas:confirmar_caja': true,
    'ventas:resumen': true,
    'ventas:aprobar_llaves': true,
    'ventas:crear_llave': true,
    'ventas:limpieza_cobro': true,
    'ventas:aprobar_pregastos': true,
    'ventas:transferencia_masiva': true,
    'adicionales:graficos': true,
    'adicionales:transferencias': true,
    'centros:ingresos': true,
    'centros:resumen_periodo': true,
    'centros:cierre_masivo': true,
    'centros:egresos': true,
    'centros:traslado_unidades': true,
    'centros:transferencia_dinero': true,
    'centros:caja_gestion': true,
    'centros:abrir_caja': true,
    'centros:cerrar_caja': true,
    'centros:confirmar_caja': true,
    'centros:resumen': true,
    'centros:mapa': true,
    'centros:facturacion': true,
    'centros:seguros': true,
    'centros:consulta_facturas': true,
    'centros:fondeo': true,
    'centros:prestamos': true,
    'centros:aprobaciones': true,
    'admin:plataforma': true,
    'admin:sociedades': true,
    'admin:centros': true,
    'admin:unidades': true,
    'admin:trabajadores': true,
    'admin:movimientos': true,
    'admin:dispositivos': true,
    'admin:liquidacion': true,
    'admin:usuarios_gestion': true,
    'admin:perfiles': true,
    'admin:usuarios': true,
    'admin:asignar_unidades': true,
    'admin:clientes': true,
    'admin:lista_negra': true,
    'reportes:ventas': true,
    'reportes:plataforma': true,
    'reportes:procesos_encolados': true,
    'reportes:log_acciones': true,
    'reportes:log_movil': true,
    'reportes:verificacion_ventas': true,
    'reportes:personalizados': true,
    'reportes:ubicar_cobradores': true,
    'reportes:rapidos': true,
    'reportes:dispositivos_vinculados': true,
    'reportes:historico_panico': true,
  },
  supervisor: {
    'ventas:ingresos': true,
    'ventas:resumen_periodo': true,
    'ventas:gastos': true,
    'ventas:lista': true,
    'ventas:caja_gestion': true,
    'ventas:abrir_caja': true,
    'ventas:cerrar_caja': true,
    'ventas:resumen': true,
    'adicionales:graficos': true,
    'centros:ingresos': true,
    'centros:resumen_periodo': true,
    'centros:egresos': true,
    'centros:caja_gestion': true,
    'centros:abrir_caja': true,
    'centros:cerrar_caja': true,
    'centros:resumen': true,
    'centros:mapa': true,
    'reportes:ventas': true,
    'reportes:verificacion_ventas': true,
    'reportes:ubicar_cobradores': true,
    'reportes:rapidos': true,
  },
  collector: {
    'ventas:ingresos': true,
    'ventas:gastos': true,
    'ventas:lista': true,
    'ventas:abrir_caja': true,
    'ventas:cerrar_caja': true,
  }
};

export function Profiles({ onNavigate }: ProfilesProps) {
  const { tenantId } = useTenant();
  const [permissionsMap, setPermissionsMap] = useState<Record<string, Record<string, boolean>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // Fetch or initialize roles in Firestore
  useEffect(() => {
    if (!tenantId) return;

    const loadPermissions = async () => {
      setLoading(true);
      setError(null);

      try {
        const loadedPermissions: Record<string, Record<string, boolean>> = {};

        for (const role of ROLES) {
          const roleDocRef = doc(db, 'tenants', tenantId, 'roles', role.id);
          const docSnap = await getDoc(roleDocRef);

          if (docSnap.exists()) {
            loadedPermissions[role.id] = docSnap.data().permissions || {};
          } else {
            // Save default permissions to Firestore
            const initialPerms = DEFAULT_PERMISSIONS[role.id] || {};
            await setDoc(roleDocRef, {
              id: role.id,
              name: role.label,
              permissions: initialPerms,
              createdAt: new Date().toISOString()
            });
            loadedPermissions[role.id] = initialPerms;
          }
        }

        setPermissionsMap(loadedPermissions);
      } catch (err: any) {
        console.error('Error loading permissions:', err);
        setError(`Error al conectar con la base de datos de permisos: ${err?.message || err}. (Tenant: ${tenantId || 'não definido'})`);
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [tenantId]);

  // Toggle permission in local state and Firestore
  const handleTogglePermission = async (roleId: string, permissionKey: string) => {
    if (!tenantId || savingKey) return;

    const currentVal = !!permissionsMap[roleId]?.[permissionKey];
    const newVal = !currentVal;
    
    // Optimistic UI update
    setPermissionsMap(prev => ({
      ...prev,
      [roleId]: {
        ...(prev[roleId] || {}),
        [permissionKey]: newVal
      }
    }));

    const statusKey = `${roleId}-${permissionKey}`;
    setSavingKey(statusKey);

    try {
      const roleDocRef = doc(db, 'tenants', tenantId, 'roles', roleId);
      await updateDoc(roleDocRef, {
        [`permissions.${permissionKey}`]: newVal
      });
    } catch (err) {
      console.error('Error updating permission in Firestore:', err);
      // Revert local state
      setPermissionsMap(prev => ({
        ...prev,
        [roleId]: {
          ...(prev[roleId] || {}),
          [permissionKey]: currentVal
        }
      }));
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#6A008A] mb-4" />
          <p className="text-gray-500 text-sm font-bold">Cargando perfiles y accesos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] p-4 md:p-6 select-none pb-12">
      
      {/* Outer wrapper to stretch nicely */}
      <div className="max-w-7xl mx-auto w-full space-y-6">
        
        {/* Header Bar */}
        <div className="bg-[#6A008A] pt-4 pb-3 text-white flex flex-col shrink-0 shadow-md rounded-t-xl">
          <div className="flex items-center justify-between px-4 lg:px-6">
            <button 
              onClick={() => onNavigate && onNavigate('dashboard')}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <div className="flex flex-col items-center text-center">
              <span className="text-white font-black text-base lg:text-lg tracking-tight uppercase">Gestión de Perfiles y Accesos</span>
              <span className="text-white/80 text-[10px] font-bold tracking-wider mt-0.5">
                ADMINISTRACIÓN DE ACCESOS CORPORATIVOS
              </span>
            </div>
            <div className="w-9" />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl p-3 font-bold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Matrix Container */}
        <div className="bg-white border border-gray-200 shadow-md rounded-b-xl overflow-hidden">
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 text-xs font-black text-gray-500 uppercase tracking-wider min-w-[280px]">
                    Módulos y Permisos
                  </th>
                  {ROLES.map((role) => (
                    <th 
                      key={role.id}
                      className="p-4 text-center text-xs font-black text-gray-500 uppercase tracking-wider min-w-[150px]"
                    >
                      {role.label}
                    </th>
                  ))}
                </tr>
              </thead>
              
              <tbody className="divide-y divide-gray-100">
                {PERMISSION_GROUPS.map((group) => (
                  <tr key={group.title} className="bg-white">
                    <td colSpan={ROLES.length + 1} className="p-0">
                      
                      {/* Section Heading Row */}
                      <div className="bg-gray-50/70 border-y border-gray-200/60 px-4 py-3 text-xs font-black text-red-600 uppercase tracking-wider">
                        {group.title}
                      </div>

                      <table className="w-full border-collapse">
                        <tbody>
                          {group.items.map((item) => (
                            <tr key={item.key} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                              <td className="p-4 text-xs font-bold text-gray-700 w-[280px]">
                                {item.name}
                              </td>
                              
                              {ROLES.map((role) => {
                                const hasAccess = !!permissionsMap[role.id]?.[item.key];
                                const isSaving = savingKey === `${role.id}-${item.key}`;

                                return (
                                  <td 
                                    key={role.id}
                                    className="p-4 text-center w-[150px] align-middle"
                                  >
                                    <button
                                      type="button"
                                      disabled={isSaving}
                                      onClick={() => handleTogglePermission(role.id, item.key)}
                                      className="inline-flex items-center justify-center p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                                    >
                                      {isSaving ? (
                                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                      ) : hasAccess ? (
                                        /* CIRCULAR TARGET SELECTOR ACTIVE */
                                        <span className="w-5 h-5 rounded-full border-4 border-[#8CC63F] bg-white flex items-center justify-center">
                                          <span className="w-1.5 h-1.5 bg-[#8CC63F] rounded-full"></span>
                                        </span>
                                      ) : (
                                        /* CIRCULAR TARGET SELECTOR INACTIVE */
                                        <span className="w-5 h-5 rounded-full border border-gray-300 bg-white inline-block"></span>
                                      )}
                                    </button>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>

                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>

        </div>

      </div>

    </div>
  );
}
