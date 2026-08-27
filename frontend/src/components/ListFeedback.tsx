import type { ReactNode } from 'react';
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';

interface ListErrorBannerProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

/** Banner de erro de listagem com ação clara de retry (guia §4). */
export function ListErrorBanner({
  message,
  onRetry,
  retryLabel = 'Tentar novamente',
}: ListErrorBannerProps) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded mb-4 text-xs flex flex-col sm:flex-row sm:items-center gap-2">
      <div className="flex items-start gap-2 flex-1 min-w-0">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <span className="break-words">{message}</span>
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center justify-center gap-1.5 self-start sm:self-auto px-3 py-1.5 rounded bg-[#6A008A] text-white text-[11px] font-bold cursor-pointer hover:bg-[#52006A]"
        >
          <RefreshCw className="w-3 h-3" />
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}

interface ListEmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

/** Empty state padronizado para listagens. */
export function ListEmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
}: ListEmptyStateProps) {
  return (
    <div className="text-center py-12 bg-gray-50 border border-dashed border-gray-300 rounded-sm">
      <div className="mx-auto mb-3 flex justify-center text-gray-300">
        {icon ?? <Inbox className="w-10 h-10" />}
      </div>
      <p className="text-sm font-bold text-gray-700">{title}</p>
      {description ? <p className="text-xs text-gray-500 mt-1 mb-4">{description}</p> : <div className="mb-4" />}
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="bg-[#6A008A] hover:bg-[#52006A] text-white text-xs font-bold px-4 py-2 rounded shadow-sm transition-all cursor-pointer"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
