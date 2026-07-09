export function approvalStatusLabel(status: string): string {
  if (status === 'pending') return 'Pendente';
  if (status === 'approved') return 'Aprovado';
  return 'Rejeitado';
}

export function transferStatusLabel(status: string): string {
  if (status === 'pending') return 'Pendente';
  if (status === 'confirmed') return 'Confirmada';
  return 'Rejeitada';
}

export function boxStatusLabel(status: string): string {
  if (status === 'open') return 'Aberta';
  if (status === 'closed') return 'Fechada';
  return 'Confirmada';
}

export function deviceStatusLabel(status: string): string {
  if (status === 'active') return 'Ativo';
  if (status === 'blocked') return 'Bloqueado';
  return 'Inativo';
}

export function saleActivityLabel(status: string): string {
  if (status === 'active') return 'Activa';
  if (status === 'inactive') return 'Inactiva';
  return status;
}

export function userRoleLabel(role: string): string {
  if (role === 'collector') return 'Cobrador';
  if (role === 'supervisor') return 'Supervisor';
  return 'Administrador';
}

export function gpsLocationButtonLabel(
  gettingLocation: boolean,
  hasCoordinates: boolean,
  updateLabel: string,
  addLabel: string
): string {
  if (gettingLocation) return 'Obtendo Localização Atual...';
  if (hasCoordinates) return updateLabel;
  return addLabel;
}

export function layoutRoleLabel(role: string, showSuperAdmin: boolean): string {
  if (showSuperAdmin) return 'Super Admin';
  if (role === 'admin') return 'Administrador';
  if (role === 'vendedor') return 'Vendedor';
  return 'Cobrador';
}

export function centerMapIconColor(isSelected: boolean, isActive: boolean): string {
  if (isSelected) return '#84CC16';
  if (isActive) return '#7E22CE';
  return '#4B5563';
}

export function approvalStatusBadgeClasses(status: string): string {
  if (status === 'pending') return 'bg-yellow-100 text-yellow-800';
  if (status === 'approved') return 'bg-green-100 text-green-800';
  return 'bg-red-100 text-red-800';
}

export function transferStatusBadgeClasses(status: string): string {
  if (status === 'pending') return 'bg-yellow-100 text-yellow-800';
  if (status === 'confirmed') return 'bg-green-100 text-green-800';
  return 'bg-red-100 text-red-800';
}

/** Rótulo da lista de caixas no Dashboard (aberta/confirmada → "Confirmada"). */
export function dashboardBoxListStatusLabel(status: string): string {
  if (status === 'closed') return 'Fechada';
  return 'Confirmada';
}

export function collectorRankMedal(rank: number): string {
  if (rank === 0) return '🥇';
  if (rank === 1) return '🥈';
  if (rank === 2) return '🥉';
  return '👤';
}

export function activeInactiveLabel(active: boolean): string {
  return active ? 'ACTIVO' : 'INACTIVO';
}

export function activeInactiveTextClass(active: boolean): string {
  return active ? 'text-[#16A34A]' : 'text-red-500';
}

export function creditScoreColorClasses(score: number): string {
  if (score >= 70) return 'text-green-600 bg-green-50 border-green-200';
  if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-red-600 bg-red-50 border-red-200';
}

export function creditRequestStatusLabel(status: string): string {
  if (status === 'approved') return 'Aprovada';
  if (status === 'rejected') return 'Rejeitada';
  if (status === 'auto') return 'Automática';
  return 'Pendente';
}

export function creditRequestStatusBadgeClasses(status: string): string {
  if (status === 'approved') return 'bg-green-100 text-green-800';
  if (status === 'rejected') return 'bg-red-100 text-red-800';
  if (status === 'auto') return 'bg-blue-100 text-blue-800';
  return 'bg-yellow-100 text-yellow-800';
}

export function booleanFieldDisplay(value: boolean): string {
  return value ? 'Sí ✅' : 'No ❌';
}

export function approvalStatusCardBorderClasses(status: string): string {
  if (status === 'pending') return 'border-l-4 border-l-amber-500 border-gray-300';
  if (status === 'approved') return 'border-l-4 border-l-green-500 border-gray-300';
  return 'border-l-4 border-l-red-500 border-gray-300';
}

export function boxStatusBadgeBorderClasses(status: string): string {
  if (status === 'open') return 'bg-green-50 text-green-700 border-green-300';
  if (status === 'closed') return 'bg-yellow-50 text-yellow-700 border-yellow-300';
  return 'bg-purple-50 text-purple-700 border-purple-300';
}

export function deviceStatusBadgeClasses(status: string): string {
  if (status === 'active') return 'bg-green-100 text-green-800';
  if (status === 'blocked') return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-600';
}

export function financeMovementStatusBadgeClasses(status: string): string {
  if (status === 'Aprobado') return 'bg-green-100 text-green-800';
  if (status === 'Pendiente') return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-800';
}

export function insuranceStatusBadgeClasses(status: string): string {
  if (status === 'Aprobado') return 'bg-green-100 text-green-800 border-green-200';
  if (status === 'Pendiente') return 'bg-amber-100 text-amber-800 border-amber-200';
  return 'bg-red-100 text-red-800 border-red-200';
}

export function terminalLogTextClass(type: string): string {
  if (type === 'SUCCESS') return 'text-emerald-400';
  if (type === 'ALERT') return 'text-amber-400';
  if (type === 'WARN') return 'text-rose-400';
  return 'text-blue-400';
}

export function superAdminRoleBadgeClasses(role: string): string {
  if (role === 'admin') return 'bg-purple-950 text-purple-300 border border-purple-900/30';
  if (role === 'supervisor') return 'bg-amber-950 text-amber-300 border border-amber-900/30';
  return 'bg-slate-900 text-slate-400 border border-slate-800/30';
}
