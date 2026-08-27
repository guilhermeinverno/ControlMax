import { auth } from '../lib/firebase';
import type { SaasBillingSummary, SaasInvoice } from '../types/superAdmin';

async function authHeaders(): Promise<HeadersInit> {
  const token = auth?.currentUser ? await auth.currentUser.getIdToken() : '';
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchSaasBillingSummary(): Promise<SaasBillingSummary> {
  const res = await fetch('/api/admin/saas-billing/summary', { headers: await authHeaders() });
  const data = await res.json().catch(() => ({} as { error?: string }));
  if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
  return data as SaasBillingSummary;
}

export async function fetchSaasInvoices(tenantId?: string): Promise<SaasInvoice[]> {
  const qs = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}&limit=30` : '?limit=50';
  const res = await fetch(`/api/admin/saas-invoices${qs}`, { headers: await authHeaders() });
  const data = await res.json().catch(() => ({} as { error?: string; invoices?: SaasInvoice[] }));
  if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
  return Array.isArray(data.invoices) ? data.invoices : [];
}

export async function createSaasInvoice(input: {
  tenantId: string;
  amountCents?: number;
  method?: string;
  period?: string;
  externalRef?: string;
  notes?: string;
  markPastDue?: boolean;
}): Promise<SaasInvoice> {
  const res = await fetch('/api/admin/saas-invoices', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({} as { error?: string; invoice?: SaasInvoice }));
  if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
  return data.invoice as SaasInvoice;
}

export async function markSaasInvoicePaid(
  invoiceId: string,
  opts?: { externalRef?: string; notes?: string }
): Promise<void> {
  const res = await fetch(`/api/admin/saas-invoices/${encodeURIComponent(invoiceId)}/mark-paid`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(opts || {}),
  });
  const data = await res.json().catch(() => ({} as { error?: string }));
  if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
}

export async function updateTenantBilling(
  tenantId: string,
  patch: Record<string, unknown>
): Promise<void> {
  const res = await fetch(`/api/admin/tenants/${encodeURIComponent(tenantId)}/billing`, {
    method: 'PUT',
    headers: await authHeaders(),
    body: JSON.stringify(patch),
  });
  const data = await res.json().catch(() => ({} as { error?: string }));
  if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
}
