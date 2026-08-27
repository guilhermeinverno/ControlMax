import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import {
  assembleContextFromChunks,
  retrieveRelevantChunks,
  type ContextChunk,
  type RagMetrics,
} from "./services/assistantRag";

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

function formatMoneyBr(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

/**
 * Monta chunks estruturados do tenant (fonte para RAG / contexto legado).
 */
export async function buildOperationalContextChunks(tenantId: string): Promise<ContextChunk[]> {
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

  const nowLabel = new Date().toLocaleString("pt-BR");

  const chunks: ContextChunk[] = [
    {
      id: "summary",
      title: "Resumo do dia",
      keywords: ["resumo", "hoje", "dia", "geral", "status", "situacao"],
      alwaysInclude: true,
      body: `Data/Hora: ${nowLabel}
Cobradores ativos: ${collectors.length}
Em rota (caixa aberto hoje): ${onRouteCollectors.length}
Ainda não saíram: ${notOnRouteCollectors.length}
Rotas ativas: ${routes.length}
Faturamento vendas hoje: R$ ${formatMoneyBr(totalSalesTodayCents)}
Total cobrado hoje: R$ ${formatMoneyBr(totalCollectedTodayCents)}`,
    },
    {
      id: "collectors",
      title: "Cobradores e rota",
      keywords: [
        "cobrador",
        "cobradores",
        "coletor",
        "rota",
        "sairam",
        "saio",
        "pendente",
        "quem",
        "collector",
        "ruta",
      ],
      body: `Cobradores ativos (${collectors.length}): ${formatNames(collectors)}
Em rota hoje (${onRouteCollectors.length}): ${formatNames(onRouteCollectors)}
Ainda NÃO saíram (${notOnRouteCollectors.length}): ${formatNames(notOnRouteCollectors)}`,
    },
    {
      id: "boxes",
      title: "Caixas abertos hoje",
      keywords: ["caixa", "caixas", "box", "aberto", "abrir", "fechar", "caja"],
      body:
        openBoxes.length === 0
          ? "Nenhum caixa aberto hoje."
          : openBoxes
              .map(
                (b) =>
                  `Caixa ${b.id} — userId=${b.userId || "?"} status=${b.status || "open"} inicial=${b.initialAmount ?? "?"}`
              )
              .join("\n"),
    },
    {
      id: "routes",
      title: "Rotas ativas",
      keywords: ["rota", "rotas", "route", "atribuida", "assigned"],
      body: `Rotas: ${formatRoutes(routes)}`,
    },
    {
      id: "finance",
      title: "Financeiro do dia",
      keywords: [
        "faturamento",
        "venda",
        "vendas",
        "cobrado",
        "recebimento",
        "recebimentos",
        "dinheiro",
        "valor",
        "finance",
        "sales",
        "collection",
        "cobran",
      ],
      body: `Vendas hoje: ${salesToday.length} ops · R$ ${formatMoneyBr(totalSalesTodayCents)}
Recebimentos hoje: ${collectionsToday.length} ops · R$ ${formatMoneyBr(totalCollectedTodayCents)}`,
    },
  ];

  return chunks;
}

export interface BuildOperationalContextResult {
  text: string;
  metrics: RagMetrics;
}

/**
 * Contexto para o assistente com RAG (default) ou full se ASSISTANT_RAG_ENABLED=false.
 */
export async function buildOperationalContextWithRag(
  tenantId: string,
  userQuery: string,
  options?: { forceFull?: boolean }
): Promise<BuildOperationalContextResult> {
  const chunks = await buildOperationalContextChunks(tenantId);
  const { selected, metrics } = retrieveRelevantChunks(userQuery, chunks, {
    forceFull: options?.forceFull,
  });
  return {
    text: assembleContextFromChunks(selected),
    metrics,
  };
}

/** Compat: contexto completo (todos os chunks). */
export async function buildOperationalContext(tenantId: string): Promise<string> {
  const { text } = await buildOperationalContextWithRag(tenantId, "", { forceFull: true });
  return text;
}
