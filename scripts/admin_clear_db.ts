import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Load config file using fs to avoid JSON module resolution issues in ES modules
const configPath = path.resolve(process.cwd(), './firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

console.log('Admin SDK connecting to project ID:', firebaseConfig.projectId);
console.log('Target Database ID:', firebaseConfig.firestoreDatabaseId);

// Initialize Firebase Admin App
const app = initializeApp({
  projectId: firebaseConfig.projectId,
});

// Get Firestore client pointing to the specific custom database ID
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function clearCollection(name: string) {
  console.log(`\n-----------------------------------------`);
  console.log(`[ADMIN] Iniciando a limpeza da coleção: "${name}"...`);
  const colRef = db.collection(name);
  const snapshot = await colRef.get();
  
  if (snapshot.empty) {
    console.log(`[ADMIN] Nenhum documento encontrado na coleção "${name}". Já está limpa.`);
    return;
  }
  
  console.log(`[ADMIN] Encontrados ${snapshot.size} documentos na coleção "${name}".`);
  let deletedCount = 0;
  
  // Delete in batches or sequentially
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
    deletedCount++;
    console.log(`[OK] Agendado para deleção (Admin): ${name}/${doc.id} (${deletedCount}/${snapshot.size})`);
  });
  
  await batch.commit();
  console.log(`[SUCESSO] Coleção "${name}" foi totalmente limpa com privilégios de Admin.`);
}

async function run() {
  try {
    console.log('=== CARGARADAR ADMIN DATABASE PURGE ENGINE v1.1 ===');
    console.log('Limpando dados de transações com privilégios administrativos...');
    console.log('Mantendo intacta a coleção de usuários ("users") conforme solicitado.');
    
    await clearCollection('loads');
    await clearCollection('logs');
    await clearCollection('feedbacks');
    
    console.log('\n=========================================');
    console.log('SISTEMA LIMPO COM SUCESSO! APLICATIVO PRONTO PARA USO DO ZERO.');
    console.log('=========================================');
    process.exit(0);
  } catch (error) {
    console.error('Erro crítico durante a limpeza administrativa do banco de dados:', error);
    process.exit(1);
  }
}

run();
