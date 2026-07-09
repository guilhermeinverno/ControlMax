import { ReactNode } from 'react';

/** Evita ternários aninhados loading / vazio / conteúdo (Sonar S3358). */
export function listViewBody(
  loading: boolean,
  itemCount: number,
  loadingView: ReactNode,
  emptyView: ReactNode,
  contentView: ReactNode,
): ReactNode {
  if (loading) return loadingView;
  if (itemCount === 0) return emptyView;
  return contentView;
}

/** Loading / erro / conteúdo (sem estado vazio). */
export function loadingErrorContent(
  loading: boolean,
  hasError: boolean,
  loadingView: ReactNode,
  errorView: ReactNode,
  contentView: ReactNode,
): ReactNode {
  if (loading) return loadingView;
  if (hasError) return errorView;
  return contentView;
}

/** Guarda pré-condição + loading / vazio / conteúdo (ex.: CN não selecionado). */
export function guardedListViewBody(
  guardOk: boolean,
  guardView: ReactNode,
  loading: boolean,
  itemCount: number,
  loadingView: ReactNode,
  emptyView: ReactNode,
  contentView: ReactNode,
): ReactNode {
  if (!guardOk) return guardView;
  if (loading) return loadingView;
  if (itemCount === 0) return emptyView;
  return contentView;
}

/** Loading / prompt / vazio / conteúdo (ex.: relatório de período). */
export function reportPeriodBody(
  loading: boolean,
  reportGenerated: boolean,
  totalBoxes: number,
  loadingView: ReactNode,
  promptView: ReactNode,
  emptyView: ReactNode,
  contentView: ReactNode,
): ReactNode {
  if (loading) return loadingView;
  if (!reportGenerated) return promptView;
  if (totalBoxes === 0) return emptyView;
  return contentView;
}

/** Loading / erro / vazio / conteúdo. */
export function loadingErrorEmptyContent(
  loading: boolean,
  error: string | null,
  itemCount: number,
  loadingView: ReactNode,
  errorView: ReactNode,
  emptyView: ReactNode,
  contentView: ReactNode,
): ReactNode {
  if (loading) return loadingView;
  if (error) return errorView;
  if (itemCount === 0) return emptyView;
  return contentView;
}
