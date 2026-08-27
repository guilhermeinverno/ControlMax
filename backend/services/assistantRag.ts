/**
 * ENT-07 — RAG leve (retrieval por keywords) sobre chunks do contexto operacional.
 * Sem vector DB externo: reduz tokens enviados ao Gemini quando a pergunta é específica.
 */

export interface ContextChunk {
  id: string;
  title: string;
  /** Termos que aumentam score se aparecerem na pergunta. */
  keywords: string[];
  body: string;
  /** Sempre entra no prompt (resumo KPI do dia). */
  alwaysInclude?: boolean;
}

export interface RagMetrics {
  mode: 'rag' | 'full';
  totalChunks: number;
  selectedChunks: number;
  selectedIds: string[];
  charsFull: number;
  charsSelected: number;
  queryPreview: string;
}

export interface RetrieveOptions {
  /** Máximo de chunks além dos alwaysInclude. Default 4. */
  maxExtraChunks?: number;
  /** Teto de caracteres do contexto montado. Default 4500. */
  maxChars?: number;
  /** Se true, devolve todos os chunks (modo legado). */
  forceFull?: boolean;
}

const DEFAULT_MAX_EXTRA = 4;
const DEFAULT_MAX_CHARS = 4500;

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function tokenize(query: string): string[] {
  return normalize(query)
    .split(/[^a-z0-9_]+/i)
    .filter((t) => t.length >= 3);
}

/** Score de relevância chunk ↔ pergunta (overlap de keywords + tokens no body). */
export function scoreChunk(query: string, chunk: ContextChunk): number {
  if (chunk.alwaysInclude) return Number.POSITIVE_INFINITY;
  const q = normalize(query);
  if (!q.trim()) return 0;

  let score = 0;
  for (const kw of chunk.keywords) {
    const n = normalize(kw);
    if (n && q.includes(n)) score += 3;
  }

  const tokens = tokenize(query);
  const body = normalize(chunk.body);
  const title = normalize(chunk.title);
  for (const t of tokens) {
    if (title.includes(t)) score += 2;
    if (body.includes(t)) score += 1;
  }
  return score;
}

export function assembleContextFromChunks(chunks: ContextChunk[]): string {
  if (chunks.length === 0) return '';
  const parts = chunks.map((c) => `### ${c.title}\n${c.body.trim()}`);
  return `
--- CONTEXTO EM TEMPO REAL DO SISTEMA (RAG) ---
${parts.join('\n\n')}
----------------------------------------
Utilize estritamente estas informações reais para responder. Não invente nomes ou valores ausentes acima.`;
}

/**
 * Seleciona chunks relevantes. Sempre inclui `alwaysInclude`; completa com os de maior score.
 */
export function retrieveRelevantChunks(
  query: string,
  chunks: ContextChunk[],
  options: RetrieveOptions = {}
): { selected: ContextChunk[]; metrics: RagMetrics } {
  const maxExtra = options.maxExtraChunks ?? DEFAULT_MAX_EXTRA;
  const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS;
  const charsFull = assembleContextFromChunks(chunks).length;

  if (options.forceFull || process.env.ASSISTANT_RAG_ENABLED === 'false') {
    return {
      selected: chunks,
      metrics: {
        mode: 'full',
        totalChunks: chunks.length,
        selectedChunks: chunks.length,
        selectedIds: chunks.map((c) => c.id),
        charsFull,
        charsSelected: charsFull,
        queryPreview: query.slice(0, 80),
      },
    };
  }

  const always = chunks.filter((c) => c.alwaysInclude);
  const rest = chunks.filter((c) => !c.alwaysInclude);

  const ranked = rest
    .map((c) => ({ chunk: c, score: scoreChunk(query, c) }))
    .sort((a, b) => b.score - a.score || a.chunk.id.localeCompare(b.chunk.id));

  const positive = ranked.filter((r) => r.score > 0).map((r) => r.chunk);
  const fallback = ranked.map((r) => r.chunk);

  // Sem match: inclui resumo + top genéricos (cobradores + financeiro) se existirem
  let extras: ContextChunk[] =
    positive.length > 0
      ? positive.slice(0, maxExtra)
      : fallback
          .filter((c) => ['collectors', 'finance', 'routes', 'boxes'].includes(c.id))
          .slice(0, Math.min(3, maxExtra));

  if (extras.length === 0) {
    extras = fallback.slice(0, Math.min(2, maxExtra));
  }

  const selected: ContextChunk[] = [];
  const seen = new Set<string>();
  for (const c of [...always, ...extras]) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    selected.push(c);
  }

  // Respeita teto de caracteres (remove extras de menor prioridade)
  let assembled = assembleContextFromChunks(selected);
  while (assembled.length > maxChars && selected.length > always.length) {
    selected.pop();
    assembled = assembleContextFromChunks(selected);
  }

  return {
    selected,
    metrics: {
      mode: 'rag',
      totalChunks: chunks.length,
      selectedChunks: selected.length,
      selectedIds: selected.map((c) => c.id),
      charsFull,
      charsSelected: assembled.length,
      queryPreview: query.slice(0, 80),
    },
  };
}

/** Query default quando só há áudio (sem texto). */
export const DEFAULT_AUDIO_RAG_QUERY =
  'resumo cobradores rota caixa faturamento vendas recebimentos cobrado';
