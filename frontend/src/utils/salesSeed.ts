import { auth, db } from '../lib/firebase';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { SalesListSale } from './salesListMapper';

interface SeedSalesOptions {
  tenantId: string;
  unitId?: string;
  unitName?: string;
}

export async function seedExampleSales({ tenantId, unitId, unitName }: SeedSalesOptions) {
  const uId = auth.currentUser?.uid || 'collector-user';
  const uName =
    auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Cobrador';
  const unitIdVal = unitId || '3';
  const unitNameVal = unitName || '3 - RT 03';

  const salesToSeed: SalesListSale[] = [
    {
      id: '1000614',
      tenantId,
      clientId: '1000614',
      clientName: 'Alexa alexsandra da silva',
      clientDoc: '00699672104',
      userId: uId,
      userName: uName,
      unitId: unitIdVal,
      unitName: unitNameVal,
      amount: 72000,
      balance: 64800,
      saldoPendienteCents: 64800,
      installments: 20,
      installmentAmount: 3600,
      paidInstallments: 2,
      status: 'active',
      createdAt: Timestamp.now(),
    },
    {
      id: '1001443',
      tenantId,
      clientId: '1001443',
      clientName: 'Ana karolina At Ana pereira',
      clientDoc: '00699672105',
      userId: uId,
      userName: uName,
      unitId: unitIdVal,
      unitName: unitNameVal,
      amount: 456000,
      balance: 168000,
      saldoPendienteCents: 168000,
      installments: 19,
      installmentAmount: 24000,
      paidInstallments: 12,
      status: 'active',
      createdAt: Timestamp.now(),
    },
    {
      id: '1001214',
      tenantId,
      clientId: '1001214',
      clientName: 'Cleber Cleber Moreira',
      clientDoc: '00699672106',
      userId: uId,
      userName: uName,
      unitId: unitIdVal,
      unitName: unitNameVal,
      amount: 60000,
      balance: 54000,
      saldoPendienteCents: 54000,
      installments: 20,
      installmentAmount: 3000,
      paidInstallments: 2,
      status: 'active',
      createdAt: Timestamp.now(),
    },
  ];

  for (const sale of salesToSeed) {
    await setDoc(doc(db, 'sales', sale.id), sale);
  }
}
