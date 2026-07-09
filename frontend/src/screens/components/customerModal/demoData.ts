import { CustomerPaymentRow, CustomerSaleRow } from '../../../types/company';

export const DEMO_SALES: CustomerSaleRow[] = [
  { id: 'demo-s1', ugi: '3', caixa: '1006671', date: '27/08/2025 19:38:41', amount: 1011660 },
  { id: 'demo-s2', ugi: '3', caixa: '1006585', date: '24/07/2025 20:18:42', amount: 1011444 },
  { id: 'demo-s3', ugi: '3', caixa: '1006543', date: '08/07/2025 16:01:58', amount: 1011317 },
];

export const DEMO_PAYMENTS: CustomerPaymentRow[] = [
  { id: 'demo-p1', ugi: '3', caixa: '1006671', date: '28/08/2025 09:12:00', method: 'Efectivo', amount: 50000 },
  { id: 'demo-p2', ugi: '3', caixa: '1006585', date: '25/07/2025 10:30:15', method: 'Transferencia', amount: 50000 },
];

export const DEMO_PHOTOS = [
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=400&q=80',
];
