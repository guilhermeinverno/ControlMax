/**
 * Cria a empresa de testes 'tenant_teste' e popula com dados realistas de homologação:
 * - 10 Funcionários (1 Admin, 1 Supervisor, 8 Cobradores)
 * - 2 Centros de Negócios com unidades vinculadas
 * - 2 Sociedades
 * - 20 Clientes cadastrados
 * - 30 Vendas distribuídas aleatoriamente
 * - Caixas iniciais abertos para os cobradores
 *
 * Uso:
 *   export GOOGLE_APPLICATION_CREDENTIALS="/caminho/service-account.json"
 *   cd backend && npx tsx scripts/seedTestTenant.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TENANT_ID = 'tenant_teste';
const TENANT_NAME = 'Perfil de Teste ControlMax';
const MAIN_EMAIL = 'teste@controlmax.dev';
const PASSWORD = 'ControlMax-Teste-2026!';

function loadFirebaseConfig(): { projectId: string; firestoreDatabaseId?: string } {
  const configPath = path.join(__dirname, '..', 'firebase-applet-config.json');
  const examplePath = path.join(__dirname, '..', 'firebase-applet-config.example.json');
  const resolved = fs.existsSync(configPath) ? configPath : examplePath;
  return JSON.parse(fs.readFileSync(resolved, 'utf-8'));
}

function initAdminApp(): void {
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const config = loadFirebaseConfig();

  if (credentialsPath && fs.existsSync(credentialsPath)) {
    console.log(`[Firebase Admin] Inicializando com GOOGLE_APPLICATION_CREDENTIALS: ${credentialsPath}`);
    const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: config.projectId || serviceAccount.project_id,
    });
  } else if (serviceAccountKey) {
    console.log(`[Firebase Admin] Inicializando com FIREBASE_SERVICE_ACCOUNT_KEY da variável de ambiente.`);
    const serviceAccount = JSON.parse(serviceAccountKey);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: config.projectId || serviceAccount.project_id,
    });
  } else {
    console.warn(`[Firebase Admin] Nenhuma credencial encontrada. Usando inicialização padrão.`);
    admin.initializeApp({
      projectId: config.projectId || 'dummy-project',
    });
  }
}

async function ensureUserAuth(email: string, displayName: string): Promise<string> {
  const auth = getAuth();
  try {
    const existing = await auth.getUserByEmail(email);
    await auth.updateUser(existing.uid, {
      password: PASSWORD,
      displayName: displayName,
      emailVerified: true,
      disabled: false,
    });
    return existing.uid;
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      const created = await auth.createUser({
        email,
        password: PASSWORD,
        displayName: displayName,
        emailVerified: true,
        disabled: false,
      });
      return created.uid;
    }
    throw error;
  }
}

async function deleteCollectionByTenant(db: any, collectionName: string): Promise<void> {
  const snapshot = await db.collection(collectionName).where('tenantId', '==', TENANT_ID).get();
  if (snapshot.empty) return;
  const batch = db.batch();
  snapshot.docs.forEach((doc: any) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
  console.log(`Coleção '${collectionName}' limpa para o tenant '${TENANT_ID}' (${snapshot.size} documentos deletados).`);
}

async function main(): Promise<void> {
  initAdminApp();
  const config = loadFirebaseConfig();
  const db = config.firestoreDatabaseId
    ? getFirestore(admin.app(), config.firestoreDatabaseId)
    : getFirestore();

  console.log('----------------------------------------------------');
  console.log('Iniciando Seeding do Perfil de Testes...');
  console.log('----------------------------------------------------');

  // 1. Limpar dados anteriores do tenant_teste
  await deleteCollectionByTenant(db, 'users');
  await deleteCollectionByTenant(db, 'customers');
  await deleteCollectionByTenant(db, 'sales');
  await deleteCollectionByTenant(db, 'business_centers');
  await deleteCollectionByTenant(db, 'routes');
  await deleteCollectionByTenant(db, 'boxes');
  await deleteCollectionByTenant(db, 'societies');

  const now = FieldValue.serverTimestamp();

  // 2. Cadastrar Tenant
  await db.collection('tenants').doc(TENANT_ID).set({
    name: TENANT_NAME,
    active: true,
    plan: 'enterprise',
    billingStatus: 'active',
    createdAt: now,
    updatedAt: now,
  }, { merge: true });

  // 3. Cadastrar Platform Settings
  await db.collection('platform_settings').doc(TENANT_ID).set({
    tenantId: TENANT_ID,
    platformName: TENANT_NAME,
    updatedAt: now,
  }, { merge: true });

  // 4. Provisionar Usuários/Funcionários (1 Admin Principal, 1 Supervisor, 9 Cobradores)
  const employeeData = [
    { email: MAIN_EMAIL, name: 'Test Admin', role: 'admin', username: 'test_admin', units: ['unit_norte_1', 'unit_norte_2', 'unit_sul_1', 'unit_sul_2'] },
    { email: 'teste_supervisor@controlmax.dev', name: 'Test Supervisor', role: 'supervisor', username: 'test_supervisor', units: ['unit_norte_1', 'unit_norte_2', 'unit_sul_1', 'unit_sul_2'] },
    { email: 'collector1_teste@controlmax.dev', name: 'Carlos Cobrador', role: 'collector', username: 'carlos_cob', units: ['unit_sul_1'] },
    { email: 'collector2_teste@controlmax.dev', name: 'Maria Cobradora', role: 'collector', username: 'maria_cob', units: ['unit_sul_2'] },
    { email: 'collector3_teste@controlmax.dev', name: 'Pedro Cobrador', role: 'collector', username: 'pedro_cob', units: ['unit_norte_1'] },
    { email: 'collector4_teste@controlmax.dev', name: 'Ana Cobradora', role: 'collector', username: 'ana_cob', units: ['unit_norte_2'] },
    { email: 'collector5_teste@controlmax.dev', name: 'Lucas Cobrador', role: 'collector', username: 'lucas_cob', units: ['unit_sul_1', 'unit_sul_2'] },
    { email: 'collector6_teste@controlmax.dev', name: 'Julia Cobradora', role: 'collector', username: 'julia_cob', units: ['unit_norte_1', 'unit_norte_2'] },
    { email: 'collector7_teste@controlmax.dev', name: 'Marcos Cobrador', role: 'collector', username: 'marcos_cob', units: ['unit_sul_1'] },
    { email: 'collector8_teste@controlmax.dev', name: 'Sofia Cobradora', role: 'collector', username: 'sofia_cob', units: ['unit_norte_2'] },
    { email: 'collector9_teste@controlmax.dev', name: 'Vendedor Teste Individual', role: 'collector', username: 'vendedor_teste', units: ['unit_norte_1'] },
  ];

  const seededEmployees: { uid: string; email: string; name: string; role: string; username: string }[] = [];

  for (const emp of employeeData) {
    const uid = await ensureUserAuth(emp.email, emp.name);
    await db.collection('users').doc(uid).set({
      email: emp.email,
      role: emp.role,
      tenantId: TENANT_ID,
      name: emp.name,
      userName: emp.name,
      username: emp.username,
      firstName: emp.name.split(' ')[0],
      lastName1: emp.name.split(' ')[1] || 'Teste',
      active: true,
      isSuperAdmin: false,
      usuarioUnidades: emp.units,
      usuario_unidades: emp.units,
      createdAt: new Date().toISOString(),
      updatedAt: now,
    }, { merge: true });

    seededEmployees.push({ uid, email: emp.email, name: emp.name, role: emp.role, username: emp.username });
    console.log(`Funcionário cadastrado: ${emp.name} (${emp.role}) - UID: ${uid}`);
  }

  // 5. Cadastrar Sociedades (societies)
  const societies = [
    { id: 'sociedade_alfa', name: 'Sociedade Alfa Ltda', active: true },
    { id: 'sociedade_beta', name: 'Sociedade Beta S.A.', active: true },
  ];

  for (const soc of societies) {
    await db.collection('societies').doc(soc.id).set({
      tenantId: TENANT_ID,
      name: soc.name,
      active: soc.active,
      createdAt: now,
    });
    console.log(`Sociedade cadastrada: ${soc.name}`);
  }

  // 6. Cadastrar Centros de Negócios (business_centers)
  const businessCenters = [
    {
      id: 'bc_norte_teste',
      name: 'Centro Teste Norte',
      code: 'CN-NTE-TST',
      status: 'Activo' as const,
      unitCount: 2,
      responsible: 'Test Supervisor',
      observations: 'Centro Norte para testes integrados.',
      linkedUnits: [
        { id: 'unit_norte_1', name: 'Unidade Norte 1', location: 'Centro Comercial Norte', active: true },
        { id: 'unit_norte_2', name: 'Unidade Norte 2', location: 'Terminal Norte', active: true },
      ],
      financialParams: {
        maxAmountPerCredit: 10000000,
        annualInterestRate: 20,
        lateFeePercentage: 5,
        allowRefinance: true,
        minCapitalRequirement: 50000000,
      }
    },
    {
      id: 'bc_sul_teste',
      name: 'Centro Teste Sul',
      code: 'CN-SUL-TST',
      status: 'Activo' as const,
      unitCount: 2,
      responsible: 'Carlos Cobrador',
      observations: 'Centro Sul para testes e homologação.',
      linkedUnits: [
        { id: 'unit_sul_1', name: 'Unidade Sul 1', location: 'Shopping Sul', active: true },
        { id: 'unit_sul_2', name: 'Unidade Sul 2', location: 'Praça Sul', active: true },
      ],
      financialParams: {
        maxAmountPerCredit: 5000000,
        annualInterestRate: 24,
        lateFeePercentage: 4,
        allowRefinance: true,
        minCapitalRequirement: 20000000,
      }
    }
  ];

  for (const bc of businessCenters) {
    await db.collection('business_centers').doc(bc.id).set({
      ...bc,
      active: true,
      tenantId: TENANT_ID,
      createdAt: now,
    });
    console.log(`Centro de Negócios cadastrado: ${bc.name}`);

    // Criar documentos individuais na coleção 'routes' para cada unidade deste CN
    for (const unit of bc.linkedUnits) {
      await db.collection('routes').doc(unit.id).set({
        id: unit.id,
        name: unit.name,
        location: unit.location,
        active: true,
        cnId: bc.id,
        cnName: bc.name,
        tenantId: TENANT_ID,
        createdAt: now,
      });
      console.log(`  -> Rota/Unidade cadastrada: ${unit.name} (CN: ${bc.name})`);
    }
  }

  // 7. Cadastrar 20 Clientes (customers)
  const cities = ['Brasilia', 'São Paulo', 'Rio de Janeiro', 'Belo Horizonte'];
  const economicActivities = ['Comercio', 'Servicios', 'Independiente', 'Otros'];
  const collectors = seededEmployees.filter(e => e.role === 'collector');

  const seededCustomers: string[] = [];
  const customersByUnit: Record<string, string[]> = {};

  for (let i = 1; i <= 20; i++) {
    const randomCity = cities[Math.floor(Math.random() * cities.length)];
    const randomActivity = economicActivities[Math.floor(Math.random() * economicActivities.length)];
    
    // Distribuir entre Centro Norte e Centro Sul alternadamente
    const bc = businessCenters[i % 2];
    const unit = bc.linkedUnits[Math.floor(Math.random() * bc.linkedUnits.length)];

    const customerDocRef = db.collection('customers').doc();
    const customerPayload = {
      tenantId: TENANT_ID,
      unitId: unit.id,
      unitName: unit.name,
      businessCenterId: bc.id,
      city: randomCity,
      name: `Cliente Teste ${i}`,
      secondName: '',
      apellidos: `Sobrenome ${i}`,
      secondApellidos: '',
      apodo: `Apelido ${i}`,
      email: `cliente${i}@teste.com`,
      documentType: 'CPF',
      documentNumber: `123.456.789-${i.toString().padStart(2, '0')}`,
      document2: '',
      birthDate: '1990-01-01',
      address: `Rua Teste, Número ${100 + i}`,
      barrio: `Bairro Central ${i}`,
      phone: `+55 61 98888-00${i.toString().padStart(2, '0')}`,
      celular: `+55 61 98888-00${i.toString().padStart(2, '0')}`,
      celularPrefix: '55',
      comentario: 'Cliente gerado automaticamente para fins de homologação e testes de fluxo.',
      actividadEconomica: randomActivity,
      status: 'Activo',
      createdAt: new Date().toISOString(),
    };

    await customerDocRef.set(customerPayload);
    seededCustomers.push(customerDocRef.id);
    
    if (!customersByUnit[unit.id]) {
      customersByUnit[unit.id] = [];
    }
    customersByUnit[unit.id].push(customerDocRef.id);
    
    console.log(`Cliente cadastrado: ${customerPayload.name} (ID: ${customerDocRef.id})`);
  }

  // 8. Provisionar Caixas Abertos para os Cobradores
  // Cada cobrador precisa ter uma caixa para poder testar o vendedor mobile
  for (const col of collectors) {
    const boxId = `box_${col.username}_teste`;
    const empData = employeeData.find(e => e.username === col.username);
    const assignedUnitId = empData?.units[0] || 'unit_norte_1';

    const bc = businessCenters.find(b => b.linkedUnits.some(u => u.id === assignedUnitId)) || businessCenters[0];
    const unit = bc.linkedUnits.find(u => u.id === assignedUnitId) || bc.linkedUnits[0];

    await db.collection('boxes').doc(boxId).set({
      tenantId: TENANT_ID,
      userId: col.uid,
      userName: col.name,
      cnId: bc.id,
      cnName: bc.name,
      unitId: unit.id,
      unitName: unit.name,
      status: 'open',
      openedAt: new Date().toISOString(),
      initialAmount: 500000, // 5.000,00 reais em centavos
      totalIncomes: 0,
      totalExpenses: 0,
      totalSales: 0,
      totalCollections: 0,
      totalTransfers: 0,
      finalAmount: 0,
    });
    console.log(`Caixa aberto criado para ${col.name} (Box ID: ${boxId}, Unidade: ${unit.name})`);
  }

  // 9. Cadastrar 30 Vendas (sales) distribuídas aleatoriamente
  const frequencies = ['diaria', 'semanal_fixa', 'mensal'] as const;
  
  for (let i = 1; i <= 30; i++) {
    const collector = collectors[Math.floor(Math.random() * collectors.length)];
    const empData = employeeData.find(e => e.email === collector.email);
    const collectorUnits = empData?.units || [];

    let possibleCustomerIds: string[] = [];
    for (const unitId of collectorUnits) {
      if (customersByUnit[unitId]) {
        possibleCustomerIds = possibleCustomerIds.concat(customersByUnit[unitId]);
      }
    }

    if (possibleCustomerIds.length === 0) {
      possibleCustomerIds = seededCustomers; // Fallback
    }

    const customerId = possibleCustomerIds[Math.floor(Math.random() * possibleCustomerIds.length)];
    
    // Obter dados do cliente
    const clientSnap = await db.collection('customers').doc(customerId).get();
    const clientData = clientSnap.data() || {};
    const clientName = `${clientData.name || ''} ${clientData.apellidos || ''}`.trim() || `Cliente Teste ${i}`;

    const amountCents = Math.round((500 + Math.random() * 4500) * 100) * 100; // de 500,00 a 5.000,00
    const interest = 0.20; // 20% fixo para facilidade de juros
    const totalAmountCents = Math.round(amountCents * (1 + interest));
    const installments = 20;
    const installmentAmountCents = Math.round(totalAmountCents / installments);

    const saleDocRef = db.collection('sales').doc();
    await saleDocRef.set({
      tenantId: TENANT_ID,
      clientId: customerId,
      clientName: clientName,
      clientDoc: clientData.documentNumber || 'SIN NÚMERO',
      amount: amountCents,
      interest: interest,
      installments: installments,
      installmentAmount: installmentAmountCents,
      balance: totalAmountCents,
      saldoPendienteCents: totalAmountCents,
      status: 'active',
      paidInstallments: 0,
      createdAt: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toISOString(), // Distribuídas ao longo dos últimos 30 dias
      userId: collector.uid,
      notes: `Venda simulada de teste número ${i}`,
      photoUrl: '',
      photoName: '',
      frequency: frequencies[Math.floor(Math.random() * frequencies.length)],
      unitId: clientData.unitId || 'unit_norte_1'
    });

    // Atualizar total do caixa do cobrador
    const boxId = `box_${collector.username}_teste`;
    await db.collection('boxes').doc(boxId).update({
      totalSales: FieldValue.increment(amountCents)
    });

    console.log(`Venda ${i}/30 cadastrada: ${clientName} por ${amountCents / 100} para o cobrador ${collector.name}`);
  }

  console.log('\n----------------------------------------------------');
  console.log('✅ Seeding Concluído com Sucesso!');
  console.log('----------------------------------------------------');
  console.log(`Empresa (Tenant):    ${TENANT_NAME} (ID: ${TENANT_ID})`);
  console.log(`Administrador Principal:`);
  console.log(`  E-mail:   ${MAIN_EMAIL}`);
  console.log(`  Senha:    ${PASSWORD}`);
  console.log('\nFuncionários Criados (Senha padrão: ${PASSWORD}):');
  employeeData.forEach((emp) => {
    console.log(`  - Name: ${emp.name.padEnd(20)} | E-mail: ${emp.email.padEnd(35)} | Role: ${emp.role}`);
  });
  console.log('\nEstruturas de Rede de Cobrança:');
  console.log(`  - Centros de Negócios: ${businessCenters.map(b => b.name).join(', ')}`);
  console.log(`  - Sociedades: ${societies.map(s => s.name).join(', ')}`);
  console.log(`  - Clientes Criados: 20`);
  console.log(`  - Vendas Criadas: 30 distribuídas e associadas aos caixas dos cobradores`);
  console.log('----------------------------------------------------');
}

main().catch((error) => {
  console.error('Falha ao rodar o Seeding de testes:', error);
  process.exit(1);
});
