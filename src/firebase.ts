import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = (firebaseConfig as any).firestoreDatabaseId 
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): void {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));

  const errMsg = errInfo.error.toLowerCase();
  const isQuotaOrLimitError = 
    errMsg.includes('quota') || 
    errMsg.includes('limit exceeded') || 
    errMsg.includes('billing') ||
    errMsg.includes('free tier') ||
    errMsg.includes('exhausted') ||
    errMsg.includes('resource_exhausted');

  if (isQuotaOrLimitError) {
    console.warn(`[Firestore Resiliency] Limite de cota excedido para caminho "${path}" (${operationType}). O aplicativo continuará funcionando em modo local / offline.`);
    return;
  }

  console.warn(`[Firestore Resiliency] Erro de operação "${operationType}" no caminho "${path}":`, errInfo);
}

export function sanitizeFirestoreData<T extends Record<string, any>>(data: T): T {
  const clean: Record<string, any> = {};
  Object.keys(data).forEach((key) => {
    const value = data[key];
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        clean[key] = sanitizeFirestoreData(value);
      } else if (Array.isArray(value)) {
        clean[key] = value.map(item => 
          item !== null && typeof item === 'object' ? sanitizeFirestoreData(item) : item
        ).filter(item => item !== undefined);
      } else {
        clean[key] = value;
      }
    }
  });
  return clean as T;
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Conexão inicial com o Firestore offline ou em andamento. Isso é normal no ambiente de preview.");
    }
  }
}

testConnection();
