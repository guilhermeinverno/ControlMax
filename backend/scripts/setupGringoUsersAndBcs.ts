import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadFirebaseConfig() {
  const p1 = path.join(__dirname, '..', 'firebase-applet-config.json');
  const p2 = path.join(__dirname, '..', '..', 'firebase-applet-config.json');
  if (fs.existsSync(p1)) return JSON.parse(fs.readFileSync(p1, 'utf-8'));
  if (fs.existsSync(p2)) return JSON.parse(fs.readFileSync(p2, 'utf-8'));
  throw new Error('firebase config not found');
}

const config = loadFirebaseConfig();
if (getApps().length === 0) {
  initializeApp({ projectId: config.projectId });
}

const auth = getAuth();
const db = getFirestore();

const TENANT_GRINGO = 'gringo_corretora';

async function run() {
  console.log('--- 1. Ativando Business Centers de Gringo Corretora ---');
  const gringoBcs = [
    { id: 'bc_norte_gringo', name: 'Norte', unitId: 'unit_norte_gringo' },
    { id: 'bc_sul_gringo', name: 'Sul', unitId: 'unit_sul_gringo' },
    { id: 'bc_leste_gringo', name: 'Leste', unitId: 'unit_leste_gringo' },
    { id: 'bc_oeste_gringo', name: 'Oeste', unitId: 'unit_oeste_gringo' },
    { id: 'bc_ceu_azul_gringo', name: 'Céu Azul', unitId: 'unit_ceu_azul_gringo' }
  ];

  for (const bc of gringoBcs) {
    await db.collection('business_centers').doc(bc.id).set({
      tenantId: TENANT_GRINGO,
      name: bc.name,
      code: bc.name.substring(0, 3).toUpperCase(),
      status: 'Activo',
      active: true,
      linkedUnits: [{ id: bc.unitId, name: 'Unidade ' + bc.name, active: true }],
      units: [{ id: bc.unitId, name: 'Unidade ' + bc.name, active: true }]
    }, { merge: true });
    console.log(`Business Center ativado: ${bc.id} (${bc.name}) com active: true`);
  }

  console.log('\n--- 2. Alocando Vendedores 1 a 12 com CN e Unidade ---');
  for (let i = 1; i <= 12; i++) {
    const email = `vendedor${i}@controlmax.com`;
    try {
      const userRecord = await auth.getUserByEmail(email);
      const uid = userRecord.uid;

      // Distribuir entre os centros para permitir testes variados
      // Vendedores 1 a 6 em Céu Azul, 7 e 8 no Norte, 9 e 10 no Sul, 11 no Leste, 12 no Oeste
      let assignedBc = gringoBcs[4]; // Céu Azul padrão
      if (i === 7 || i === 8) assignedBc = gringoBcs[0]; // Norte
      else if (i === 9 || i === 10) assignedBc = gringoBcs[1]; // Sul
      else if (i === 11) assignedBc = gringoBcs[2]; // Leste
      else if (i === 12) assignedBc = gringoBcs[3]; // Oeste

      await db.collection('users').doc(uid).set({
        name: `Vendedor ${i}`,
        userName: `vendedor${i}`,
        email: email,
        role: 'collector',
        tenantId: TENANT_GRINGO,
        active: true,
        phone: `6199999000${i < 10 ? '0' + i : i}`,
        usuarioUnidades: [assignedBc.unitId],
        usuario_unidades: [assignedBc.unitId],
        unitId: assignedBc.unitId,
        unitName: `Unidade ${assignedBc.name}`,
        businessCenterId: assignedBc.id,
        cnId: assignedBc.id,
        cnName: assignedBc.name
      }, { merge: true });

      console.log(`Vendedor ${i} configurado: ${email} -> Unidade: ${assignedBc.unitId} (${assignedBc.name})`);
    } catch (err: any) {
      console.error(`Erro ao configurar ${email}:`, err.message);
    }
  }

  console.log('\nConfiguração concluída com sucesso!');
}

run().catch(console.error).finally(() => process.exit(0));
