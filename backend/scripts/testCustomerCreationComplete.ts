import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf-8'));
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

function generateNumericCustomerId(): string {
  const now = Date.now().toString();
  const suffix = Math.floor(100 + Math.random() * 900).toString();
  return `${now.slice(-7)}${suffix}`;
}

async function test() {
  const cred = await signInWithEmailAndPassword(auth, 'vendedor7@controlmax.com', 'ControlMax-Teste-2026!');
  console.log('Logged in as:', cred.user.uid, cred.user.email);

  const newCustomerId = generateNumericCustomerId();
  console.log('Generated customer ID:', newCustomerId);

  try {
    await setDoc(doc(db, 'customers', newCustomerId), {
      tenantId: 'gringo_corretora',
      unitId: 'unit_norte_gringo',
      unitName: 'Unidade Norte',
      businessCenterId: 'bc_norte_gringo',
      city: 'Brasilia',
      name: 'Cliente Teste Sucesso',
      secondName: '',
      apellidos: '',
      secondApellidos: '',
      apodo: 'Cliente Teste Sucesso',
      email: '',
      documentType: 'OUTROS',
      documentNumber: 'S/N',
      document2: '',
      birthDate: '',
      address: 'Lat: -15.78, Lng: -47.92',
      barrio: 'GPS Localizado',
      phone: '5561999998888',
      celular: '5561999998888',
      celularPrefix: '55',
      comentario: '',
      actividadEconomica: 'Geral',
      active: true,
      createdAt: new Date().toISOString(),
      latitude: -15.78,
      longitude: -47.92,
      photos: ['data:image/jpeg;base64,/9j/4AAQSkZJRg...'],
      addresses: [{ id: 'addr-1', address: 'Lat: -15.78, Lng: -47.92', barrio: 'GPS Localizado', city: 'Brasilia' }],
      phones: [{ id: 'phone-1', number: '5561999998888' }],
      references: []
    });
    console.log('[SUCCESS] Customer created directly in Cloud Firestore by vendedor7!');
  } catch (err: any) {
    console.error('[FAIL] setDoc failed:', err.code, err.message);
  }
}

test().catch(console.error).finally(() => process.exit(0));
