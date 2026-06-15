import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Load config file using fs to avoid JSON module resolution issues in ES modules
const configPath = path.resolve(process.cwd(), './firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

console.log('Firebase Config loaded for project:', firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

async function clearCollection(name: string) {
  console.log(`\n-----------------------------------------`);
  console.log(`Iniciando a limpeza da coleção: "${name}"...`);
  const colRef = collection(db, name);
  const snapshot = await getDocs(colRef);
  
  if (snapshot.empty) {
    console.log(`Nenhum documento encontrado na coleção "${name}". Já está limpa.`);
    return;
  }
  
  console.log(`Encontrados ${snapshot.size} documentos na coleção "${name}".`);
  let deletedCount = 0;
  
  for (const document of snapshot.docs) {
    const docRef = doc(db, name, document.id);
    await deleteDoc(docRef);
    deletedCount++;
    console.log(`[OK] Documento deletado: ${name}/${document.id} (${deletedCount}/${snapshot.size})`);
  }
  console.log(`[SUCESSO] Coleção "${name}" foi totalmente limpa.`);
}

async function run() {
  try {
    console.log('--- CARGARADAR DATABASE PURGE ENGINE v1.0 ---');
    console.log('Limpando dados de transações (loads, logs, feedbacks)...');
    console.log('Mantendo intacta a coleção de usuários ("users") conforme solicitado.');
    
    await clearCollection('loads');
    await clearCollection('logs');
    await clearCollection('feedbacks');
    
    console.log('\n=========================================');
    console.log('SISTEMA LIMPO COM SUCESSO! APLICATIVO PRONTO PARA USO DO ZERO.');
    console.log('=========================================');
    process.exit(0);
  } catch (error) {
    console.error('Erro crítico durante a limpeza do banco de dados:', error);
    process.exit(1);
  }
}

run();
