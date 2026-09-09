import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadConfig() {
  const p1 = path.join(__dirname, '..', 'firebase-applet-config.json');
  const p2 = path.join(__dirname, '..', '..', 'firebase-applet-config.json');
  if (fs.existsSync(p1)) return JSON.parse(fs.readFileSync(p1, 'utf-8'));
  if (fs.existsSync(p2)) return JSON.parse(fs.readFileSync(p2, 'utf-8'));
  throw new Error('Config not found');
}

const config = loadConfig();
if (!getApps().length) initializeApp({ projectId: config.projectId });
const auth = getAuth();
const db = getFirestore();

async function syncAll() {
  const usersList = await auth.listUsers();
  console.log(`Syncing ${usersList.users.length} Auth users to Firestore...`);

  for (const u of usersList.users) {
    const docRef = db.collection('users').doc(u.uid);
    const snap = await docRef.get();
    
    if (!snap.exists) {
      console.log(`Creating missing Firestore doc for ${u.email} (UID: ${u.uid})`);
      const emailLower = (u.email || '').toLowerCase();
      const isAdmin = emailLower.includes('admin') || emailLower === 'controlmax@gmail.com' || emailLower === 'controlmaxia@gmail.com';
      const isSuper = emailLower === 'controlmax@gmail.com' || emailLower === 'controlmaxia@gmail.com';
      
      let tenantId = 'gringo_corretora';
      if (emailLower.includes('oficina')) tenantId = 'tenant_oficinabrasil';
      if (emailLower.includes('milton')) tenantId = 'milton_tenant';
      if (isSuper) tenantId = 'super_admin_tenant';

      await docRef.set({
        email: u.email,
        name: u.displayName || u.email?.split('@')[0] || 'Vendedor',
        userName: u.email?.split('@')[0] || 'vendedor',
        phone: '61999990000',
        role: isSuper ? 'superadmin' : (isAdmin ? 'admin' : 'collector'),
        active: true,
        tenantId: tenantId,
        usuarioUnidades: ['unit_ceu_azul_gringo'],
        usuario_unidades: ['unit_ceu_azul_gringo'],
        unitId: 'unit_ceu_azul_gringo',
        unitName: 'Unidade Céu Azul',
        businessCenterId: 'bc_ceu_azul_gringo',
        cnId: 'bc_ceu_azul_gringo',
        cnName: 'Céu Azul',
        createdAt: new Date().toISOString()
      });
      console.log(`✓ Created doc for ${u.email}`);
    } else {
      // Ensure active, phone and units are defined
      const data = snap.data() || {};
      const updates: Record<string, any> = {};
      if (!data.phone) updates.phone = '61999990000';
      if (!data.name) updates.name = u.email?.split('@')[0] || 'Vendedor';
      if (data.active === undefined) updates.active = true;
      if (!data.tenantId) updates.tenantId = 'gringo_corretora';
      if (!data.usuarioUnidades || data.usuarioUnidades.length === 0) {
        updates.usuarioUnidades = ['unit_ceu_azul_gringo'];
        updates.usuario_unidades = ['unit_ceu_azul_gringo'];
        updates.unitId = 'unit_ceu_azul_gringo';
        updates.unitName = 'Unidade Céu Azul';
        updates.businessCenterId = 'bc_ceu_azul_gringo';
        updates.cnId = 'bc_ceu_azul_gringo';
        updates.cnName = 'Céu Azul';
      }

      if (Object.keys(updates).length > 0) {
        await docRef.update(updates);
        console.log(`✓ Updated fields for ${u.email}:`, Object.keys(updates));
      }
    }
  }

  console.log('All users synced and ready for instant access!');
}

syncAll().catch(console.error).finally(() => process.exit(0));
