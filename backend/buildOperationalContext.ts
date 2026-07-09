import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";

function toDate(value: { toDate?: () => Date; seconds?: number } | null | undefined): Date | null {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (value.seconds != null) return new Date(value.seconds * 1000);
  return null;
}

function isToday(timestamp: { toDate?: () => Date; seconds?: number } | null | undefined): boolean {
  const date = toDate(timestamp);
  if (!date) return false;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return date >= startOfToday;
}

export async function buildOperationalContext(tenantId: string): Promise<string> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const qUsers = query(
    collection(db, "users"),
    where("tenantId", "==", tenantId),
    where("role", "==", "collector"),
    where("active", "==", true)
  );
  const usersSnap = await getDocs(qUsers);
  const collectors = usersSnap.docs.map((docSnap) => ({
    id: docSnap.id,
    name: docSnap.data().name || docSnap.data().username || "Coletor",
    ...docSnap.data(),
  }));

  const qBoxes = query(
    collection(db, "boxes"),
    where("tenantId", "==", tenantId),
    where("status", "==", "open")
  );
  const boxesSnap = await getDocs(qBoxes);
  const openBoxes = boxesSnap.docs
    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    .filter((box) => isToday(box.openedAt));

  const qRoutes = query(collection(db, "routes"), where("tenantId", "==", tenantId));
  const routesSnap = await getDocs(qRoutes);
  const routes = routesSnap.docs
    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    .filter((r) => r.active !== false);

  const qCollections = query(collection(db, "collections"), where("tenantId", "==", tenantId));
  const collectionsSnap = await getDocs(qCollections);
  const collectionsToday = collectionsSnap.docs
    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    .filter((col) => isToday(col.createdAt));

  const totalCollectedTodayCents = collectionsToday.reduce(
    (sum, col) => sum + (col.amount || 0),
    0
  );

  const qSales = query(collection(db, "sales"), where("tenantId", "==", tenantId));
  const salesSnap = await getDocs(qSales);
  const salesToday = salesSnap.docs
    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    .filter((sale) => isToday(sale.createdAt));

  const totalSalesTodayCents = salesToday.reduce(
    (sum, s) => sum + (s.totalAmount || s.amount || 0),
    0
  );

  const collectorIdsWithOpenBox = new Set(openBoxes.map((b) => b.userId));
  const notOnRouteCollectors = collectors.filter((c) => !collectorIdsWithOpenBox.has(c.id));
  const onRouteCollectors = collectors.filter((c) => collectorIdsWithOpenBox.has(c.id));

  const formatNames = (list: { name?: string }[]) =>
    list.map((c) => c.name).join(", ") || "Nenhum";

  const formatRoutes = (list: { name?: string; assignedUserName?: string }[]) =>
    list.map((r) => `${r.name} (Atribuída a: ${r.assignedUserName || "Ninguém"})`).join("; ") ||
    "Nenhuma";

  return `
--- CONTEXTO EM TEMPO REAL DO SISTEMA ---
Data/Hora Atual do Servidor: ${new Date().toLocaleString("pt-BR")}
Cobradores Ativos Cadastrados (Total ${collectors.length}): ${formatNames(collectors)}
Cobradores em Rota Hoje (Caixa Aberto Hoje) (Total ${onRouteCollectors.length}): ${formatNames(onRouteCollectors)}
Cobradores que ainda NÃO saíram para a rota hoje (Sem caixa aberto hoje) (Total ${notOnRouteCollectors.length}): ${formatNames(notOnRouteCollectors)}
Rotas Ativas Cadastradas: ${formatRoutes(routes)}
Faturamento Hoje (Vendas): R$ ${(totalSalesTodayCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
Total Cobrado Hoje (Recebimentos): R$ ${(totalCollectedTodayCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
----------------------------------------
Utilize estritamente estas informações reais em tempo real para responder de forma precisa a perguntas sobre quem saiu ou não para a rota, faturamento do dia, recebimentos ou rotas cadastradas. Seja extremamente preciso e nunca invente nomes ou valores.`;
}
