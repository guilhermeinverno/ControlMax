import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf-8'));
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

async function test() {
  const cred = await signInWithEmailAndPassword(auth, 'vendedor7@controlmax.com', 'ControlMax-Teste-2026!');
  console.log('Logged in as:', cred.user.uid, cred.user.email);

  const uDoc = await getDoc(doc(db, 'users', cred.user.uid));
  console.log('User doc in Firestore exists?', uDoc.exists());
  console.log('User doc data:', uDoc.data());

  const tenantId = uDoc.data()?.tenantId;
  console.log('Using tenantId:', tenantId);

  try {
    const testCustomerId = '1007967' + Math.floor(100 + Math.random() * 900);
    console.log('Trying to setDoc customer with ID:', testCustomerId);
    await setDoc(doc(db, 'customers', testCustomerId), {
      tenantId: tenantId || 'gringo_corretora',
      unitId: 'unit_ceu_azul_gringo',
      unitName: 'Unidade Principal',
      businessCenterId: 'bc_ceu_azul_gringo',
      city: 'Brasilia',
      name: 'Cliente Teste',
      secondName: '',
      apellidos: 'Silva',
      secondApellidos: '',
      apodo: 'Testinho',
      email: '',
      documentType: 'SIN TIPO',
      documentNumber: 'SIN NÚMERO',
      document2: '',
      birthDate: '',
      address: 'Lat: -15.123, Lng: -47.123',
      barrio: 'GPS Localizado',
      phone: '5561999999999',
      celular: '5561999999999',
      celularPrefix: '55',
      comentario: '',
      actividadEconomica: 'Otros',
      active: true,
      createdAt: new Date().toISOString(),
      latitude: -15.123,
      longitude: -47.123,
      photos: ['data:image/png;base64,test'],
      addresses: [{ id: 'addr-1', address: 'Lat: -15.123, Lng: -47.123', barrio: 'GPS Localizado', city: 'Brasilia' }],
      phones: [{ id: 'phone-1', number: '5561999999999' }],
      references: []
    });
    console.log('[PASS] Customer registered successfully via client SDK!');
  } catch (err: any) {
    console.error('[FAIL] Customer registration error:', err.code, err.message);
  }
}

test().catch(console.error).finally(() => process.exit(0));
