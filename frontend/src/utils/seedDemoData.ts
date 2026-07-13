import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export async function seedDemoData() {
  const tenantId = 'tenant_demo';
  const isOffline = typeof window !== 'undefined' && localStorage.getItem('controlmax_demo_active') === 'true';

  // Safe write helper to prevent hanging or slowing down login flow
  const safeSetDoc = async (ref: any, data: any) => {
    try {
      // Trigger setDoc in the background immediately.
      // Firestore's offline latency compensation updates the local cache and active onSnapshot listeners synchronously.
      setDoc(ref, data, { merge: true }).catch((err) => {
        console.warn("Background setDoc failed:", err);
      });
    } catch (e) {
      console.warn("safeSetDoc warning:", e);
    }
  };

  // 1. Seed Tenant
  const tenantRef = doc(db, 'tenants', tenantId);
  await safeSetDoc(tenantRef, {
    name: 'Gringo Eletrônica S.A.',
    ownerName: 'Gringo Eletrônica',
    ownerEmail: 'gringoeletronica@gmail.com',
    ownerPhone: '+55 11 99999-9999',
    plan: 'Premium',
    billingStatus: 'active',
    active: true,
    createdAt: Timestamp.now(),
  });

  // 2. Seed Business Center (Centro de Negócios)
  const cnId = 'demo_center';
  const cnRef = doc(db, 'business_centers', cnId);
  await safeSetDoc(cnRef, {
    tenantId,
    name: 'Centro de Distribuição Principal',
    code: 'CD-MAIN',
    status: 'active',
    unitCount: 5,
    responsible: 'Gerente Demo',
    observations: 'Unidade central para controle de rotas de demonstração.',
    linkedUnits: [
      { id: 'route_1', name: 'Rota Norte 1', active: true },
      { id: 'route_2', name: 'Rota Sul 1', active: true },
      { id: 'route_3', name: 'Rota Leste 1', active: true },
      { id: 'route_4', name: 'Rota Oeste 1', active: true },
      { id: 'route_5', name: 'Rota Central 1', active: true },
    ],
    financialParams: {
      maxAmountPerCredit: 5000000, // R$ 50.000,00
      annualInterestRate: 20,
      lateFeePercentage: 5,
      allowRefinance: true,
      minCapitalRequirement: 100000000, // R$ 1.000.000,00
    },
  });

  // 3. Seed 5 Collectors (Users)
  const collectors = [
    { id: 'col_1', name: 'Juan Pérez', username: 'juan_perez', email: 'juan.perez@controlmax.dev' },
    { id: 'col_2', name: 'Carlos Gomes', username: 'carlos_gomes', email: 'carlos.gomes@controlmax.dev' },
    { id: 'col_3', name: 'Mateo Silva', username: 'mateo_silva', email: 'mateo.silva@controlmax.dev' },
    { id: 'col_4', name: 'Lucas Santos', username: 'lucas_santos', email: 'lucas.santos@controlmax.dev' },
    { id: 'col_5', name: 'André Costa', username: 'andre_costa', email: 'andre.costa@controlmax.dev' },
  ];

  for (const col of collectors) {
    const colRef = doc(db, 'users', col.id);
    await safeSetDoc(colRef, {
      tenantId,
      email: col.email,
      role: 'collector',
      name: col.name,
      userName: col.name,
      username: col.username,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: Timestamp.now(),
    });
  }

  // 4. Seed 5 Routes
  const routes = [
    { id: 'route_1', name: 'Rota Norte 1', desc: 'Região de vendas da Zona Norte', colId: 'col_1', colName: 'Juan Pérez' },
    { id: 'route_2', name: 'Rota Sul 1', desc: 'Região de vendas da Zona Sul', colId: 'col_2', colName: 'Carlos Gomes' },
    { id: 'route_3', name: 'Rota Leste 1', desc: 'Região de vendas da Zona Leste', colId: 'col_3', colName: 'Mateo Silva' },
    { id: 'route_4', name: 'Rota Oeste 1', desc: 'Região de vendas da Zona Oeste', colId: 'col_4', colName: 'Lucas Santos' },
    { id: 'route_5', name: 'Rota Central 1', desc: 'Região de vendas da Zona Central', colId: 'col_5', colName: 'André Costa' },
  ];

  for (const r of routes) {
    const routeRef = doc(db, 'routes', r.id);
    await safeSetDoc(routeRef, {
      tenantId,
      name: r.name,
      description: r.desc,
      assignedUserId: r.colId,
      assignedUserName: r.colName,
      cnId,
      cnName: 'Centro de Distribuição Principal',
      clientCount: 2,
      active: true,
      createdAt: Timestamp.now(),
    });
  }

  // 5. Seed 5 Open Boxes (Caixas) - one for each collector
  const initialAmount = 20000; // R$ 200,00
  for (let i = 0; i < 5; i++) {
    const col = collectors[i];
    const rt = routes[i];
    const boxId = `box_${i + 1}`;
    const boxRef = doc(db, 'boxes', boxId);
    await safeSetDoc(boxRef, {
      tenantId,
      unitId: rt.id,
      unitName: rt.name,
      cnId,
      cnName: 'Centro de Distribuição Principal',
      userId: col.id,
      userName: col.name,
      status: 'open',
      openedAt: Timestamp.now(),
      initialAmount,
      totalIncomes: 0,
      totalExpenses: 0,
      totalSales: 400000, // R$ 4.000,00
      totalCollections: 150000, // R$ 1.500,00
      totalTransfers: 0,
      finalAmount: initialAmount + 150000, // initialAmount + collections
    });
  }

  // 6. Seed 10 Customers/Clients
  const customers = [
    { id: 'cust_1', name: 'Arthur Dent', doc: '111.222.333-44', rId: 'route_1', rName: 'Rota Norte 1' },
    { id: 'cust_2', name: 'Ford Prefect', doc: '222.333.444-55', rId: 'route_1', rName: 'Rota Norte 1' },
    { id: 'cust_3', name: 'Trillian Astra', doc: '333.444.555-66', rId: 'route_2', rName: 'Rota Sul 1' },
    { id: 'cust_4', name: 'Zaphod Beeblebrox', doc: '444.555.666-77', rId: 'route_2', rName: 'Rota Sul 1' },
    { id: 'cust_5', name: 'Marvin Paranoid', doc: '555.666.777-88', rId: 'route_3', rName: 'Rota Leste 1' },
    { id: 'cust_6', name: 'Slartibartfast', doc: '666.777.888-99', rId: 'route_3', rName: 'Rota Leste 1' },
    { id: 'cust_7', name: 'Tricia McMillan', doc: '777.888.999-00', rId: 'route_4', rName: 'Rota Oeste 1' },
    { id: 'cust_8', name: 'Fenchurch Grace', doc: '888.999.000-11', rId: 'route_4', rName: 'Rota Oeste 1' },
    { id: 'cust_9', name: 'Random Dent', doc: '999.000.111-22', rId: 'route_5', rName: 'Rota Central 1' },
    { id: 'cust_10', name: 'Procol Harum', doc: '000.111.222-33', rId: 'route_5', rName: 'Rota Central 1' },
  ];

  for (let i = 0; i < customers.length; i++) {
    const cust = customers[i];
    const custRef = doc(db, 'customers', cust.id);
    await safeSetDoc(custRef, {
      tenantId,
      unitId: cust.rId,
      unitName: cust.rName,
      businessCenterId: cnId,
      city: 'Cidade Demo',
      name: cust.name,
      apellidos: 'Demo',
      apodo: cust.name.split(' ')[0],
      email: `${cust.name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      documentType: 'CPF',
      documentNumber: cust.doc,
      birthDate: '1990-01-01',
      address: `Rua das Oliveiras, ${10 * (i + 1)}`,
      barrio: 'Bairro Novo',
      phone: `+55 11 99999-000${i}`,
      celularPrefix: '55',
      celular: `1199999000${i}`,
      comentario: 'Cliente importado automaticamente para demonstração e testes.',
      actividadEconomica: 'Comercio',
      active: true,
      createdAt: new Date().toISOString(),
    });
  }

  // 7. Seed 10 Sales (active & completed)
  const sales = [
    { id: 'sale_1', custId: 'cust_1', custName: 'Arthur Dent', custDoc: '111.222.333-44', amt: 50000, bal: 30000, colId: 'col_1', colName: 'Juan Pérez', bId: 'box_1', rtId: 'route_1', rtName: 'Rota Norte 1' },
    { id: 'sale_2', custId: 'cust_2', custName: 'Ford Prefect', custDoc: '222.333.444-55', amt: 120000, bal: 100000, colId: 'col_1', colName: 'Juan Pérez', bId: 'box_1', rtId: 'route_1', rtName: 'Rota Norte 1' },
    { id: 'sale_3', custId: 'cust_3', custName: 'Trillian Astra', custDoc: '333.444.555-66', amt: 80000, bal: 0, colId: 'col_2', colName: 'Carlos Gomes', bId: 'box_2', rtId: 'route_2', rtName: 'Rota Sul 1', completed: true },
    { id: 'sale_4', custId: 'cust_4', custName: 'Zaphod Beeblebrox', custDoc: '444.555.666-77', amt: 150000, bal: 120000, colId: 'col_2', colName: 'Carlos Gomes', bId: 'box_2', rtId: 'route_2', rtName: 'Rota Sul 1' },
    { id: 'sale_5', custId: 'cust_5', custName: 'Marvin Paranoid', custDoc: '555.666.777-88', amt: 200000, bal: 180000, colId: 'col_3', colName: 'Mateo Silva', bId: 'box_3', rtId: 'route_3', rtName: 'Rota Leste 1' },
    { id: 'sale_6', custId: 'cust_6', custName: 'Slartibartfast', doc: '666.777.888-99', amt: 60000, bal: 0, colId: 'col_3', colName: 'Mateo Silva', bId: 'box_3', rtId: 'route_3', rtName: 'Rota Leste 1', completed: true },
    { id: 'sale_7', custId: 'cust_7', custName: 'Tricia McMillan', custDoc: '777.888.999-00', amt: 90000, bal: 50000, colId: 'col_4', colName: 'Lucas Santos', bId: 'box_4', rtId: 'route_4', rtName: 'Rota Oeste 1' },
    { id: 'sale_8', custId: 'cust_8', custName: 'Fenchurch Grace', custDoc: '888.999.000-11', amt: 110000, bal: 100000, colId: 'col_4', colName: 'Lucas Santos', bId: 'box_4', rtId: 'route_4', rtName: 'Rota Oeste 1' },
    { id: 'sale_9', custId: 'cust_9', custName: 'Random Dent', custDoc: '999.000.111-22', amt: 300000, bal: 250000, colId: 'col_5', colName: 'André Costa', bId: 'box_5', rtId: 'route_5', rtName: 'Rota Central 1' },
    { id: 'sale_10', custId: 'cust_10', custName: 'Procol Harum', custDoc: '000.111.222-33', amt: 40000, bal: 10000, colId: 'col_5', colName: 'André Costa', bId: 'box_5', rtId: 'route_5', rtName: 'Rota Central 1' },
  ];

  for (const s of sales) {
    const saleRef = doc(db, 'sales', s.id);
    await safeSetDoc(saleRef, {
      tenantId,
      clientId: s.custId,
      clientName: s.custName,
      clientDoc: s.custDoc || '000.000.000-00',
      userId: s.colId,
      userName: s.colName,
      boxId: s.bId,
      unitId: s.rtId,
      unitName: s.rtName,
      cnId,
      cnName: 'Centro de Distribuição Principal',
      amount: s.amt,
      balance: s.bal,
      status: s.completed ? 'completed' : 'active',
      score: 'A',
      unidade: s.rtName,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      valor: (s.amt / 100).toFixed(2),
      interes: '20,0%',
      saldoTotal: (s.amt / 100).toFixed(2),
      saldoPendiente: (s.bal / 100).toFixed(2),
      saldoTotalCents: s.amt,
      saldoPendienteCents: s.bal,
    });
  }

  // 8. Seed 10 Collections (payments)
  const collections = [
    { id: 'col_rec_1', saleId: 'sale_1', amt: 20000, colId: 'col_1', colName: 'Juan Pérez', bId: 'box_1', custId: 'cust_1', custName: 'Arthur Dent' },
    { id: 'col_rec_2', saleId: 'sale_2', amt: 20000, colId: 'col_1', colName: 'Juan Pérez', bId: 'box_1', custId: 'cust_2', custName: 'Ford Prefect' },
    { id: 'col_rec_3', saleId: 'sale_3', amt: 80000, colId: 'col_2', colName: 'Carlos Gomes', bId: 'box_2', custId: 'cust_3', custName: 'Trillian Astra' },
    { id: 'col_rec_4', saleId: 'sale_4', amt: 30000, colId: 'col_2', colName: 'Carlos Gomes', bId: 'box_2', custId: 'cust_4', custName: 'Zaphod Beeblebrox' },
    { id: 'col_rec_5', saleId: 'sale_5', amt: 20000, colId: 'col_3', colName: 'Mateo Silva', bId: 'box_3', custId: 'cust_5', custName: 'Marvin Paranoid' },
    { id: 'col_rec_6', saleId: 'sale_6', amt: 60000, colId: 'col_3', colName: 'Mateo Silva', bId: 'box_3', custId: 'cust_6', custName: 'Slartibartfast' },
    { id: 'col_rec_7', saleId: 'sale_7', amt: 40000, colId: 'col_4', colName: 'Lucas Santos', bId: 'box_4', custId: 'cust_7', custName: 'Tricia McMillan' },
    { id: 'col_rec_8', saleId: 'sale_8', amt: 10000, colId: 'col_4', colName: 'Lucas Santos', bId: 'box_4', custId: 'cust_8', custName: 'Fenchurch Grace' },
    { id: 'col_rec_9', saleId: 'sale_9', amt: 50000, colId: 'col_5', colName: 'André Costa', bId: 'box_5', custId: 'cust_9', custName: 'Random Dent' },
    { id: 'col_rec_10', saleId: 'sale_10', amt: 30000, colId: 'col_5', colName: 'André Costa', bId: 'box_5', custId: 'cust_10', custName: 'Procol Harum' },
  ];

  for (const c of collections) {
    const colRef = doc(db, 'collections', c.id);
    await safeSetDoc(colRef, {
      tenantId,
      boxId: c.bId,
      boxName: 'Caja Principal',
      userId: c.colId,
      userName: c.colName,
      clientId: c.custId,
      clientName: c.custName,
      saleId: c.saleId,
      amount: c.amt,
      type: 'collection',
      paymentMethod: 'Cash',
      comment: 'Recibo automático de prueba.',
      registeredBy: 'Gerente Demo',
      registeredById: 'demo_admin',
      createdAt: Timestamp.now(),
    });
  }

  // 9. Create platform_settings for tenant_demo to prevent errors
  const platformRef = doc(db, 'platform_settings', tenantId);
  await safeSetDoc(platformRef, {
    tenantId,
    platformName: 'Gringo Eletrônica S.A.',
    updatedAt: Timestamp.now(),
  });
}
