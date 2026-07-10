import type { TenantDoc, TerminalLog, TerminalLogType } from '../types/superAdmin';

const INITIAL_LOG_TYPES: TerminalLogType[] = ['INFO', 'SUCCESS', 'INFO', 'SUCCESS'];
const INITIAL_MESSAGES = [
  'Núcleo SaaS inicializado com sucesso. Monitorando canais Firestore.',
  'Sincronização de segurança de auditoria concluída (SSL Ativo).',
  'Verificação de integridade do banco: 5 coleções ativas, integridade 100%.',
  'Conexão estabelecida com sucesso com o servidor secundário.',
];

export function createInitialTerminalLogs(): TerminalLog[] {
  return Array.from({ length: 4 }).map((_, i) => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - (10 - i * 2));
    return {
      id: `log_${i}_${Date.now()}`,
      time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type: INITIAL_LOG_TYPES[i],
      message: INITIAL_MESSAGES[i],
    };
  });
}

export function createSimulatedTerminalLog(tenants: TenantDoc[], logCount: number): TerminalLog | null {
  if (tenants.length === 0) return null;

  const tenantIndex = Date.now() % tenants.length;
  const selectedTenant = tenants[tenantIndex];
  const types: TerminalLogType[] = ['INFO', 'SUCCESS', 'WARN', 'ALERT'];
  const messages = [
    `Leitura de documento realizada: users/auth para o tenant '${selectedTenant.name}'`,
    `Auditoria periódica: Nenhuma inconsistência encontrada em '${selectedTenant.name}'`,
    `Sincronização offline: Usuário do tenant '${selectedTenant.name}' sincronizou 1 transação pendente`,
    `Monitor de segurança: Limite operacional do tenant '${selectedTenant.name}' verificado com sucesso`,
  ];
  const index = (Date.now() + logCount) % messages.length;

  return {
    id: `log_${Date.now()}`,
    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    type: types[index],
    message: messages[index],
  };
}

export function prependTerminalLog(prev: TerminalLog[], log: TerminalLog): TerminalLog[] {
  return [log, ...prev.slice(0, 25)];
}

export function createActionTerminalLog(idPrefix: string, type: TerminalLogType, message: string): TerminalLog {
  return {
    id: `${idPrefix}_${Date.now()}`,
    time: new Date().toLocaleTimeString('pt-BR'),
    type,
    message,
  };
}
