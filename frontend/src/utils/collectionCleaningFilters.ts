import { Timestamp } from 'firebase/firestore';
import type { CleaningCollection, CollectionStatusFilter } from '../types/collectionCleaning';

export function filterDisplayedCollections(
  collections: CleaningCollection[],
  searchQuery: string,
  statusFilter: CollectionStatusFilter
): CleaningCollection[] {
  return collections.filter((c) => {
    const matchesSearch = searchQuery
      ? c.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.userName?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesStatus = statusFilter === 'all' ? true : c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
}

export interface CollectionCleaningStats {
  totalCount: number;
  activeCount: number;
  cancelledCount: number;
  activeValueSum: number;
}

export function computeCollectionCleaningStats(collections: CleaningCollection[]): CollectionCleaningStats {
  const active = collections.filter((c) => c.status === 'active');
  return {
    totalCount: collections.length,
    activeCount: active.length,
    cancelledCount: collections.filter((c) => c.status === 'cancelled').length,
    activeValueSum: active.reduce((sum, c) => sum + (c.amount || 0), 0),
  };
}

export function formatCollectionTime(createdAt: Timestamp | undefined): string {
  if (!createdAt) return '---';
  try {
    return createdAt.toDate().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '---';
  }
}
