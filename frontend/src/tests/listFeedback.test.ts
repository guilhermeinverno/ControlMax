import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ListEmptyState, ListErrorBanner } from '../components/ListFeedback';

describe('UX ListFeedback', () => {
  it('renderiza banner de erro com retry', () => {
    const html = renderToStaticMarkup(
      createElement(ListErrorBanner, {
        message: 'Falha ao carregar',
        onRetry: () => undefined,
        retryLabel: 'Tentar novamente',
      })
    );
    expect(html).toContain('Falha ao carregar');
    expect(html).toContain('Tentar novamente');
  });

  it('renderiza empty state com ação', () => {
    const html = renderToStaticMarkup(
      createElement(ListEmptyState, {
        title: 'Lista vazia',
        description: 'Nenhum item',
        actionLabel: 'Criar',
        onAction: () => undefined,
      })
    );
    expect(html).toContain('Lista vazia');
    expect(html).toContain('Criar');
  });
});
