import { Response } from "express";
import { adminDb, AuthenticatedRequest } from "./authMiddleware";

export async function handleConfirmBox(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: "Não autenticado." });
  }

  const { boxId } = req.body;
  const userId = req.user.uid;
  const tenantId = req.user.tenantId;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const ip_origem = Array.isArray(ip) ? ip[0] : ip;

  if (!boxId) {
    return res.status(400).json({ error: "Parâmetro obrigatório ausente (boxId)." });
  }

  try {
    // 1. Fetch user document via Admin SDK
    const userDocRef = adminDb.collection("users").doc(userId);
    const userSnap = await userDocRef.get();

    if (!userSnap.exists) {
      await adminDb.collection("security_logs").add({
        timestamp: new Date().toISOString(),
        tenantId,
        usuario_id: userId,
        operador_role: 'unknown',
        acao: 'CONFIRM_BOX',
        unidad_id: 'unknown',
        ip_origem,
        status: 'DENIED',
        detalhes: 'Usuário não existe no sistema.'
      });
      return res.status(403).json({ error: "Acesso negado: Usuário não existe no sistema." });
    }

    const userData = userSnap.data() || {};

    // Verify tenant isolation
    if (userData.tenantId !== tenantId) {
      await adminDb.collection("security_logs").add({
        timestamp: new Date().toISOString(),
        tenantId,
        usuario_id: userId,
        operador_role: userData.role || 'unknown',
        acao: 'CONFIRM_BOX',
        unidad_id: 'unknown',
        ip_origem,
        status: 'DENIED',
        detalhes: 'Inconsistência de Tenant.'
      });
      return res.status(403).json({ error: "Acesso negado: Inconsistência de Tenant." });
    }

    const role = userData.role || req.user.role || '';
    const roleLower = String(role).toLowerCase();
    const permissions = userData.permissions || {};

    const isGerenteOrSupervisor = ['gerente', 'supervisor', 'admin', 'superadmin', 'director', 'coordinador'].includes(roleLower);
    const hasConfirmFlag = permissions && (
      permissions['caja:confirmar'] === true ||
      (Array.isArray(permissions) && permissions.includes('caja:confirmar'))
    );

    const boxDocRef = adminDb.collection("boxes").doc(boxId);
    const boxSnap = await boxDocRef.get();

    if (!boxSnap.exists) {
      return res.status(404).json({ error: "Caixa não encontrada." });
    }

    const boxData = boxSnap.data() || {};
    const boxUnitId = boxData.unitId || boxData.unidad_id || boxData.unidadId || '';

    // Verify box belongs to user's tenant
    if (boxData.tenantId !== tenantId) {
      await adminDb.collection("security_logs").add({
        timestamp: new Date().toISOString(),
        tenantId,
        usuario_id: userId,
        operador_role: role,
        acao: 'CONFIRM_BOX',
        unidad_id: boxUnitId || 'unknown',
        ip_origem,
        status: 'DENIED',
        detalhes: 'Caixa pertence a outro tenant.'
      });
      return res.status(403).json({ error: "Acesso negado: Caixa pertence a outro tenant." });
    }

    // Validar perfil e permissão caja:confirmar
    if (!isGerenteOrSupervisor && !hasConfirmFlag) {
      await adminDb.collection("security_logs").add({
        timestamp: new Date().toISOString(),
        tenantId,
        usuario_id: userId,
        operador_role: role,
        acao: 'CONFIRM_BOX',
        unidad_id: boxUnitId || 'unknown',
        ip_origem,
        status: 'DENIED',
        detalhes: 'Permissão insuficiente (caja:confirmar).'
      });
      return res.status(403).json({ error: "Acesso negado: Permissão insuficiente (caja:confirmar)." });
    }

    // Validar se unidad_id pertence ao array usuario_unidades
    const userUnits = userData.usuario_unidades || userData.usuarioUnidades || [];
    if (boxUnitId && Array.isArray(userUnits) && userUnits.length > 0 && !userUnits.includes(boxUnitId)) {
      await adminDb.collection("security_logs").add({
        timestamp: new Date().toISOString(),
        tenantId,
        usuario_id: userId,
        operador_role: role,
        acao: 'CONFIRM_BOX',
        unidad_id: boxUnitId,
        ip_origem,
        status: 'DENIED',
        detalhes: 'Caixa pertence a uma unidade não atribuída ao usuário.'
      });
      return res.status(403).json({ error: "Acesso negado: O caixa pertence a uma unidade não atribuída a este usuário." });
    }

    // Transação atômica para confirmar o caixa
    await adminDb.runTransaction(async (transaction) => {
      const freshBoxSnap = await transaction.get(boxDocRef);
      if (!freshBoxSnap.exists) {
        throw new Error("NOT_FOUND: Caixa não encontrada.");
      }
      const freshBoxData = freshBoxSnap.data() || {};
      if (freshBoxData.status !== 'closed') {
        throw new Error("INVALID_STATUS: Apenas caixas fechadas podem ser confirmadas.");
      }

      transaction.update(boxDocRef, {
        status: 'confirmed',
        confirmedAt: new Date().toISOString(),
        confirmedBy: userId
      });
    });

    // Security Log: SUCCESS
    await adminDb.collection("security_logs").add({
      timestamp: new Date().toISOString(),
      tenantId,
      usuario_id: userId,
      operador_role: role,
      acao: 'CONFIRM_BOX',
      unidad_id: boxUnitId || 'unknown',
      ip_origem,
      status: 'SUCCESS'
    });

    return res.json({ success: true });
  } catch (error: any) {
    const msg = error?.message || '';
    if (msg.includes("INVALID_STATUS")) {
      return res.status(400).json({ error: "Apenas caixas fechadas podem ser confirmadas." });
    }
    if (msg.includes("NOT_FOUND")) {
      return res.status(404).json({ error: "Caixa não encontrada." });
    }
    console.error("Error in handleConfirmBox:", error);
    return res.status(500).json({ error: "Erro interno do servidor ao processar confirmação de caixa." });
  }
}

