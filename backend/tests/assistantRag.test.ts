import { describe, expect, it } from 'vitest';
import {
  assembleContextFromChunks,
  retrieveRelevantChunks,
  scoreChunk,
  type ContextChunk,
} from '../services/assistantRag';

const sampleChunks: ContextChunk[] = [
  {
    id: 'summary',
    title: 'Resumo',
    keywords: ['resumo'],
    alwaysInclude: true,
    body: 'KPI do dia',
  },
  {
    id: 'collectors',
    title: 'Cobradores',
    keywords: ['cobrador', 'rota', 'sairam'],
    body: 'João e Maria na rua',
  },
  {
    id: 'finance',
    title: 'Financeiro',
    keywords: ['faturamento', 'vendas', 'cobrado'],
    body: 'Vendas R$ 100,00',
  },
  {
    id: 'routes',
    title: 'Rotas',
    keywords: ['rota', 'rotas'],
    body: 'Rota Norte',
  },
  {
    id: 'boxes',
    title: 'Caixas',
    keywords: ['caixa', 'aberto'],
    body: '2 caixas abertos',
  },
];

describe('ENT-07 assistantRag', () => {
  it('sempre inclui summary e prioriza cobradores na pergunta de rota', () => {
    const { selected, metrics } = retrieveRelevantChunks(
      'Quem ainda não saiu para a rota hoje?',
      sampleChunks
    );
    expect(selected.some((c) => c.id === 'summary')).toBe(true);
    expect(selected.some((c) => c.id === 'collectors')).toBe(true);
    expect(metrics.mode).toBe('rag');
    expect(metrics.charsSelected).toBeLessThanOrEqual(metrics.charsFull);
  });

  it('prioriza finance para pergunta de faturamento', () => {
    const { selected } = retrieveRelevantChunks('Qual o faturamento de vendas hoje?', sampleChunks);
    expect(selected.map((c) => c.id)).toContain('finance');
  });

  it('forceFull devolve todos os chunks', () => {
    const { selected, metrics } = retrieveRelevantChunks('qualquer', sampleChunks, { forceFull: true });
    expect(selected).toHaveLength(sampleChunks.length);
    expect(metrics.mode).toBe('full');
  });

  it('scoreChunk dá peso a keywords', () => {
    const collectors = sampleChunks.find((c) => c.id === 'collectors')!;
    const finance = sampleChunks.find((c) => c.id === 'finance')!;
    expect(scoreChunk('cobrador pendente rota', collectors)).toBeGreaterThan(
      scoreChunk('cobrador pendente rota', finance)
    );
  });

  it('assembleContextFromChunks marca bloco RAG', () => {
    const text = assembleContextFromChunks([sampleChunks[0]]);
    expect(text).toContain('CONTEXTO EM TEMPO REAL DO SISTEMA (RAG)');
    expect(text).toContain('KPI do dia');
  });
});
