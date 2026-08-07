export async function logSecurityAction(
  usuario_id: string,
  operador_role: string,
  acao: 'CONFIRM_BOX' | 'CHANGE_CREDIT_LIMIT' | 'CHANGE_PERMISSION',
  unidad_id: string,
  status: 'SUCCESS' | 'DENIED'
): Promise<void> {
  // Os logs oficiais de auditoria e segurança são gravados exclusivamente no servidor (BFF)
  // com tenantId validado pelo token JWT. Esta função registra localmente para rastreamento de UI.
  console.info(`[SecurityLog Client] User: ${usuario_id} | Role: ${operador_role} | Action: ${acao} | Unit: ${unidad_id} | Status: ${status}`);
}

