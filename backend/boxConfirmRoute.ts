import { Response } from "express";
import { doc, getDoc, updateDoc, addDoc, collection } from "firebase/firestore";
import { db } from "./firebase";
import { AuthenticatedRequest } from "./authMiddleware";

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
    // 1. Fetch user document
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Security Log: DENIED
      await addDoc(collection(db, "security_logs"), {
        timestamp: new Date().toISOString(),
        usuario_id: userId,
        operador_role: 'unknown',
        acao: 'CONFIRM_BOX',
        unidad_id: 'unknown',
        ip_origem,
        status: 'DENIED'
      });
      return res.status(403).json({ error: "Acesso negado: Usuário não existe no sistema." });
    }

    const userData = userSnap.data();

    // Verify tenant
    if (userData.tenantId !== tenantId) {
      await addDoc(collection(db, "security_logs"), {
        timestamp: new Date().toISOString(),
        usuario_id: userId,
        operador_role: userData.role || 'unknown',
        acao: 'CONFIRM_BOX',
        unidad_id: 'unknown',
        ip_origem,
        status: 'DENIED'
      });
      return res.status(403).json({ error: "Acesso negado: Inconsistência de Tenant." });
    }

    const role = userData.role || '';
    const roleLower = String(role).toLowerCase();
    const permissions = userData.permissions || {};

    const isGerenteOrSupervisor = ['gerente', 'supervisor', 'admin', 'superadmin'].includes(roleLower);
    const hasConfirmFlag = permissions && (
      permissions['caja:confirmar'] === true ||
      (Array.isArray(permissions) && permissions.includes('caja:confirmar'))
    );

    // 2. Fetch box document
    const boxRef = doc(db, "boxes", boxId);
    const boxSnap = await getDoc(boxRef);

    if (!boxSnap.exists()) {
      return res.status(404).json({ error: "Caixa não encontrada." });
    }

    const boxData = boxSnap.data();
    const boxUnitId = boxData.unitId || boxData.unidad_id || boxData.unidadId || '';

    // Validar perfil e flag caja:confirmar
    if (!isGerenteOrSupervisor || !hasConfirmFlag) {
      await addDoc(collection(db, "security_logs"), {
        timestamp: new Date().toISOString(),
        usuario_id: userId,
        operador_role: role,
        acao: 'CONFIRM_BOX',
        unidad_id: boxUnitId || 'unknown',
        ip_origem,
        status: 'DENIED'
      });
      return res.status(403).json({ error: "Acesso negado: Permissão insuficiente (caja:confirmar)." });
    }

    // Validar se unidad_id pertence ao array usuario_unidades
    const userUnits = userData.usuario_unidades || userData.usuarioUnidades || [];
    if (boxUnitId && !userUnits.includes(boxUnitId)) {
      await addDoc(collection(db, "security_logs"), {
        timestamp: new Date().toISOString(),
        usuario_id: userId,
        operador_role: role,
        acao: 'CONFIRM_BOX',
        unidad_id: boxUnitId,
        ip_origem,
        status: 'DENIED'
      });
      return res.status(403).json({ error: "Acesso negado: O caixa pertence a uma unidade não atribuída a este usuário." });
    }

    // Validar status
    if (boxData.status !== 'closed') {
      return res.status(400).json({ error: "Apenas caixas fechadas podem ser confirmadas." });
    }

    // Apenas caixas fechadas podem ser confirmadas
    await updateDoc(boxRef, {
      status: 'confirmed',
      confirmedAt: new Date().toISOString(),
      confirmedBy: userId
    });

    // Security Log: SUCCESS
    await addDoc(collection(db, "security_logs"), {
      timestamp: new Date().toISOString(),
      usuario_id: userId,
      operador_role: role,
      acao: 'CONFIRM_BOX',
      unidad_id: boxUnitId || 'unknown',
      ip_origem,
      status: 'SUCCESS'
    });

    return res.json({ success: true });
  } catch (error: any) {
    console.error("Error in handleConfirmBox:", error);
    return res.status(500).json({ error: "Erro interno do servidor ao processar confirmação de caixa." });
  }
}
