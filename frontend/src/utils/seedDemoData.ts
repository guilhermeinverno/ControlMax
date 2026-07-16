import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export async function seedDemoData(customTenantId?: string) {
  const tenantId = customTenantId || 'tenant_demo';
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
    name: tenantId === 'super_admin_tenant' ? 'Super Admin Workspace' : 'Gringo Eletrônica S.A.',
    ownerName: tenantId === 'super_admin_tenant' ? 'Super Admin' : 'Gringo Eletrônica',
    ownerEmail: tenantId === 'super_admin_tenant' ? 'controlmaxia@gmail.com' : 'gringoeletronica@gmail.com',
    ownerPhone: '+55 11 99999-9999',
    plan: 'Premium',
    billingStatus: 'active',
    active: true,
    createdAt: Timestamp.now(),
  });

  // 2. Seed Business Centers (Centros de Negócios)
  const centersToSeed = [
    {
      id: 'demo_center',
      name: 'Centro de Distribuição Principal',
      code: 'CD-MAIN',
      status: 'Activo',
      unitCount: 2,
      responsible: 'Gerente Demo',
      observations: 'Unidade central para controle de rotas de demonstração.',
      linkedUnits: [
        { id: 'route_1', name: 'Rota Norte 1', active: true, location: 'Zona Norte' },
        { id: 'route_5', name: 'Rota Central 1', active: true, location: 'Zona Central' },
      ],
      financialParams: {
        maxAmountPerCredit: 5000000, // R$ 50.000,00
        annualInterestRate: 20,
        lateFeePercentage: 5,
        allowRefinance: true,
        minCapitalRequirement: 100000000, // R$ 1.000.000,00
      },
    },
    {
      id: 'cn_met_nor',
      name: 'Centro Metropolitano Norte',
      code: 'CN-MET-NOR',
      status: 'Activo',
      unitCount: 2,
      responsible: 'Humberto De la Calle',
      observations: 'Atiende la zona comercial norte alta densidad. Mayor flujo de créditos Express diarios.',
      linkedUnits: [
        { id: 'route_2', name: 'Rota Sul 1', active: true, location: 'Zona Sul' },
        { id: 'route_3', name: 'Rota Leste 1', active: true, location: 'Zona Leste' },
      ],
      financialParams: {
        maxAmountPerCredit: 10000000, // R$ 100.000,00
        annualInterestRate: 24,
        lateFeePercentage: 4,
        allowRefinance: true,
        minCapitalRequirement: 50000000, // R$ 500.000,00
      },
    },
    {
      id: 'cn_sur_pac',
      name: 'Centro Sur Comercial Pacífico',
      code: 'CN-SUR-PAC',
      status: 'Activo',
      unitCount: 1,
      responsible: 'Clara Luz Roldán',
      observations: 'Foco comercial en microcréditos rurales y semiurbanos del Pacífico.',
      linkedUnits: [
        { id: 'route_4', name: 'Rota Oeste 1', active: true, location: 'Zona Oeste' },
      ],
      financialParams: {
        maxAmountPerCredit: 15000000, // R$ 150.000,00
        annualInterestRate: 22,
        lateFeePercentage: 5,
        allowRefinance: false,
        minCapitalRequirement: 75000000, // R$ 750.000,00
      },
    },
  ];

  for (const center of centersToSeed) {
    const cnRef = doc(db, 'business_centers', center.id);
    await safeSetDoc(cnRef, {
      tenantId,
      name: center.name,
      code: center.code,
      status: center.status,
      active: true,
      unitCount: center.unitCount,
      responsible: center.responsible,
      observations: center.observations,
      linkedUnits: center.linkedUnits,
      financialParams: center.financialParams,
    });
  }

  // 3. Seed 5 Collectors (Users)
  const currentUserId = auth.currentUser?.uid || 'col_1';
  const currentUserName = auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Juan Pérez';
  const currentUserEmail = auth.currentUser?.email || 'juan.perez@controlmax.dev';

  const collectors = [
    { id: currentUserId, name: currentUserName, username: 'juan_perez', email: currentUserEmail },
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
    { id: 'route_1', name: 'Rota Norte 1', desc: 'Região de vendas da Zona Norte', colId: currentUserId, colName: currentUserName, cnId: 'demo_center', cnName: 'Centro de Distribuição Principal' },
    { id: 'route_2', name: 'Rota Sul 1', desc: 'Região de vendas da Zona Sul', colId: 'col_2', colName: 'Carlos Gomes', cnId: 'cn_met_nor', cnName: 'Centro Metropolitano Norte' },
    { id: 'route_3', name: 'Rota Leste 1', desc: 'Região de vendas da Zona Leste', colId: 'col_3', colName: 'Mateo Silva', cnId: 'cn_met_nor', cnName: 'Centro Metropolitano Norte' },
    { id: 'route_4', name: 'Rota Oeste 1', desc: 'Região de vendas da Zona Oeste', colId: 'col_4', colName: 'Lucas Santos', cnId: 'cn_sur_pac', cnName: 'Centro Sur Comercial Pacífico' },
    { id: 'route_5', name: 'Rota Central 1', desc: 'Região de vendas da Zona Central', colId: 'col_5', colName: 'André Costa', cnId: 'demo_center', cnName: 'Centro de Distribuição Principal' },
  ];

  for (const r of routes) {
    const routeRef = doc(db, 'routes', r.id);
    await safeSetDoc(routeRef, {
      tenantId,
      name: r.name,
      description: r.desc,
      assignedUserId: r.colId,
      assignedUserName: r.colName,
      cnId: r.cnId,
      cnName: r.cnName,
      clientCount: r.id === 'route_1' ? 4 : 2,
      active: true,
      createdAt: Timestamp.now(),
    });
  }

  // 5. Seed 5 Open Boxes (Caixas) - one for each collector
  const initialAmount = 20000; // R$ 200,00
  for (let i = 0; i < 5; i++) {
    const col = collectors[i];
    const rt = routes[i];
    const boxId = `box_${rt.id}`;
    const boxRef = doc(db, 'boxes', boxId);
    await safeSetDoc(boxRef, {
      tenantId,
      unitId: rt.id,
      unitName: rt.name,
      cnId: rt.cnId,
      cnName: rt.cnName,
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

  // 6. Seed 10 Customers/Clients (Matched to user's collector view)
  const customers = [
    { id: '1000614', name: 'Alexa alexsandra da silva', doc: '00699672104', rId: 'route_1', rName: 'Rota Norte 1', cnId: 'demo_center' },
    { id: '1001443', name: 'Ana karolina At Ana pereira', doc: '00699672105', rId: 'route_1', rName: 'Rota Norte 1', cnId: 'demo_center' },
    { id: '1001214', name: 'Cleber Cleber Moreira', doc: '00699672106', rId: 'route_1', rName: 'Rota Norte 1', cnId: 'demo_center' },
    { id: '1001227', name: 'Dyeny Kelly lav dyeny ramos', doc: '00699672107', rId: 'route_1', rName: 'Rota Norte 1', cnId: 'demo_center' },
    { id: 'cust_5', name: 'Marvin Paranoid', doc: '555.666.777-88', rId: 'route_3', rName: 'Rota Leste 1', cnId: 'cn_met_nor' },
    { id: 'cust_6', name: 'Slartibartfast', doc: '666.777.888-99', rId: 'route_3', rName: 'Rota Leste 1', cnId: 'cn_met_nor' },
    { id: 'cust_7', name: 'Tricia McMillan', doc: '777.888.999-00', rId: 'route_4', rName: 'Rota Oeste 1', cnId: 'cn_sur_pac' },
    { id: 'cust_8', name: 'Fenchurch Grace', doc: '888.999.000-11', rId: 'route_4', rName: 'Rota Oeste 1', cnId: 'cn_sur_pac' },
    { id: 'cust_9', name: 'Random Dent', doc: '999.000.111-22', rId: 'route_5', rName: 'Rota Central 1', cnId: 'demo_center' },
    { id: 'cust_10', name: 'Procol Harum', doc: '000.111.222-33', rId: 'route_5', rName: 'Rota Central 1', cnId: 'demo_center' },
  ];

  for (let i = 0; i < customers.length; i++) {
    const cust = customers[i];
    const custRef = doc(db, 'customers', cust.id);
    await safeSetDoc(custRef, {
      tenantId,
      unitId: cust.rId,
      unitName: cust.rName,
      businessCenterId: cust.cnId,
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
    { id: 'sale_1000614', custId: '1000614', custName: 'Alexa alexsandra da silva', custDoc: '00699672104', amt: 72000, bal: 64800, colId: currentUserId, colName: currentUserName, bId: 'box_route_1', rtId: 'route_1', rtName: 'Rota Norte 1', cnId: 'demo_center', cnName: 'Centro de Distribuição Principal', installments: 20, installmentAmount: 3600, paidInstallments: 2 },
    { id: 'sale_1001443', custId: '1001443', custName: 'Ana karolina At Ana pereira', custDoc: '00699672105', amt: 456000, bal: 168000, colId: currentUserId, colName: currentUserName, bId: 'box_route_1', rtId: 'route_1', rtName: 'Rota Norte 1', cnId: 'demo_center', cnName: 'Centro de Distribuição Principal', installments: 19, installmentAmount: 24000, paidInstallments: 12 },
    { id: 'sale_1001214', custId: '1001214', custName: 'Cleber Cleber Moreira', custDoc: '00699672106', amt: 60000, bal: 54000, colId: currentUserId, colName: currentUserName, bId: 'box_route_1', rtId: 'route_1', rtName: 'Rota Norte 1', cnId: 'demo_center', cnName: 'Centro de Distribuição Principal', installments: 20, installmentAmount: 3000, paidInstallments: 2 },
    { id: 'sale_1001227', custId: '1001227', custName: 'Dyeny Kelly lav dyeny ramos', custDoc: '00699672107', amt: 100000, bal: 80000, colId: currentUserId, colName: currentUserName, bId: 'box_route_1', rtId: 'route_1', rtName: 'Rota Norte 1', cnId: 'demo_center', cnName: 'Centro de Distribuição Principal', installments: 20, installmentAmount: 5000, paidInstallments: 4 },
    { id: 'sale_5', custId: 'cust_5', custName: 'Marvin Paranoid', custDoc: '555.666.777-88', amt: 200000, bal: 180000, colId: 'col_3', colName: 'Mateo Silva', bId: 'box_route_3', rtId: 'route_3', rtName: 'Rota Leste 1', cnId: 'cn_met_nor', cnName: 'Centro Metropolitano Norte' },
    { id: 'sale_6', custId: 'cust_6', custName: 'Slartibartfast', custDoc: '666.777.888-99', amt: 60000, bal: 0, colId: 'col_3', colName: 'Mateo Silva', bId: 'box_route_3', rtId: 'route_3', rtName: 'Rota Leste 1', completed: true, cnId: 'cn_met_nor', cnName: 'Centro Metropolitano Norte' },
    { id: 'sale_7', custId: 'cust_7', custName: 'Tricia McMillan', custDoc: '777.888.999-00', amt: 90000, bal: 50000, colId: 'col_4', colName: 'Lucas Santos', bId: 'box_route_4', rtId: 'route_4', rtName: 'Rota Oeste 1', cnId: 'cn_sur_pac', cnName: 'Centro Sur Comercial Pacífico' },
    { id: 'sale_8', custId: 'cust_8', custName: 'Fenchurch Grace', custDoc: '888.999.000-11', amt: 110000, bal: 100000, colId: 'col_4', colName: 'Lucas Santos', bId: 'box_route_4', rtId: 'route_4', rtName: 'Rota Oeste 1', cnId: 'cn_sur_pac', cnName: 'Centro Sur Comercial Pacífico' },
    { id: 'sale_9', custId: 'cust_9', custName: 'Random Dent', custDoc: '999.000.111-22', amt: 300000, bal: 250000, colId: 'col_5', colName: 'André Costa', bId: 'box_route_5', rtId: 'route_5', rtName: 'Rota Central 1', cnId: 'demo_center', cnName: 'Centro de Distribuição Principal' },
    { id: 'sale_10', custId: 'cust_10', custName: 'Procol Harum', custDoc: '000.111.222-33', amt: 40000, bal: 10000, colId: 'col_5', colName: 'André Costa', bId: 'box_route_5', rtId: 'route_5', rtName: 'Rota Central 1', cnId: 'demo_center', cnName: 'Centro de Distribuição Principal' },
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
      cnId: s.cnId,
      cnName: s.cnName,
      amount: s.amt,
      balance: s.bal,
      status: s.completed ? 'completed' : 'active',
      score: 'A',
      unidade: s.rtName,
      installments: s.installments ?? 20,
      installmentAmount: s.installmentAmount ?? Math.round(s.amt / 20),
      paidInstallments: s.paidInstallments ?? Math.round((s.amt - s.bal) / Math.max(1, Math.round(s.amt / 20))),
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
    { id: 'col_rec_1', saleId: 'sale_1000614', amt: 20000, colId: currentUserId, colName: currentUserName, bId: 'box_route_1', custId: '1000614', custName: 'Alexa alexsandra da silva' },
    { id: 'col_rec_2', saleId: 'sale_1001443', amt: 20000, colId: currentUserId, colName: currentUserName, bId: 'box_route_1', custId: '1001443', custName: 'Ana karolina At Ana pereira' },
    { id: 'col_rec_3', saleId: 'sale_5', amt: 80000, colId: 'col_3', colName: 'Mateo Silva', bId: 'box_route_3', custId: 'cust_5', custName: 'Marvin Paranoid' },
    { id: 'col_rec_4', saleId: 'sale_6', amt: 30000, colId: 'col_3', colName: 'Mateo Silva', bId: 'box_route_3', custId: 'cust_6', custName: 'Slartibartfast' },
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

  // 9. Create platform_settings for tenant to prevent errors
  const platformRef = doc(db, 'platform_settings', tenantId);
  await safeSetDoc(platformRef, {
    tenantId,
    platformName: tenantId === 'super_admin_tenant' ? 'Super Admin Workspace' : 'Gringo Eletrônica S.A.',
    updatedAt: Timestamp.now(),
  });
}

