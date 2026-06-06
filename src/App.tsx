
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { ExpeditionView } from './views/ExpeditionView';
import { CentralView } from './views/CentralView';
import { AuditView } from './views/AuditView';
import { AnalysisView } from './views/AnalysisView';
import { LoginView } from './views/LoginView';
import { CargoLoad, CargoStatus, OccurrenceType, User, EventLog, SystemRole } from './types';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  limit, 
  onSnapshot 
} from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError, sanitizeFirestoreData } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';

type TabType = 'expedition' | 'central' | 'audit' | 'analysis';

// Helper function to safely generate UUIDs, with fallback for insecure/sandboxed environments where crypto.randomUUID is not defined
const generateId = (): string => {
  if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Main Application Component for CargaRadar System - v1.0.1
const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    try {
      const persistedUser = localStorage.getItem('cargoradar_user');
      if (persistedUser) {
        const user = JSON.parse(persistedUser);
        return (localStorage.getItem('cargoradar_tab') as TabType) || (user.role as TabType) || 'expedition';
      }
      return 'expedition';
    } catch {
      return 'expedition';
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('cargoradar_auth') === 'true';
    } catch {
      return false;
    }
  });

  const [loggedInUser, setLoggedInUser] = useState<User | null>(() => {
    try {
      const persisted = localStorage.getItem('cargoradar_user');
      return persisted ? JSON.parse(persisted) : null;
    } catch {
      return null;
    }
  });

  const [loads, setLoads] = useState<CargoLoad[]>(() => {
    try {
      const persisted = localStorage.getItem('cargoradar_loads');
      return persisted ? JSON.parse(persisted) : [];
    } catch {
      return [];
    }
  });

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const persisted = localStorage.getItem('cargoradar_users');
      return persisted ? JSON.parse(persisted) : [];
    } catch {
      return [];
    }
  });

  const [logs, setLogs] = useState<EventLog[]>(() => {
    try {
      const persisted = localStorage.getItem('cargoradar_logs');
      return persisted ? JSON.parse(persisted) : [];
    } catch {
      return [];
    }
  });

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    try {
      localStorage.setItem('cargoradar_tab', tab);
    } catch (e) {
      console.error('Erro ao salvar aba ativa localmente:', e);
    }
  };

  const notifiedLoadIds = React.useRef<Set<string>>(new Set());
  const isFirstLoad = React.useRef<boolean>(true);

  // Set up service worker
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('Service Worker registrado:', reg.scope))
        .catch((err) => console.error('Erro ao registrar Service Worker:', err));
    }
  }, []);

  const triggerNativeNotification = (load: CargoLoad) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const title = `🚨 DIVERGÊNCIA: PLACA ${load.plate}`;
    const options = {
      body: `Motorista: ${load.driverName}\nCarga: ${load.cargoType}\nExige ação imediata da Central de Monitoramento!`,
      icon: '/logo.png',
      badge: '/logo.png',
      vibrate: [200, 100, 200, 100, 200],
      requireInteraction: true,
      tag: `divergency-${load.id}`
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, options);
      }).catch(() => {
        new Notification(title, options);
      });
    } else {
      const notification = new Notification(title, options);
      notification.onclick = () => {
        window.focus();
      };
    }
  };

  // Set up real-time onSnapshot listeners
  // 1. Cargo Loads (always subscribed)
  useEffect(() => {
    const unsubLoads = onSnapshot(collection(db, 'loads'), (snapshot) => {
      const liveLoads: CargoLoad[] = [];
      snapshot.forEach((doc) => {
        liveLoads.push(doc.data() as CargoLoad);
      });

      // Analyze document changes to detect state transitioning to BLOCKED (DIVERGENCY)
      snapshot.docChanges().forEach((change) => {
        const load = change.doc.data() as CargoLoad;
        if (load.status === CargoStatus.BLOCKED) {
          if (isFirstLoad.current) {
            notifiedLoadIds.current.add(load.id);
          } else {
            if (!notifiedLoadIds.current.has(load.id)) {
              notifiedLoadIds.current.add(load.id);
              triggerNativeNotification(load);
            }
          }
        } else {
          // If a load transitioned back from BLOCKED, remove from notified set
          if (notifiedLoadIds.current.has(load.id)) {
            notifiedLoadIds.current.delete(load.id);
          }
        }
      });

      isFirstLoad.current = false;
      setLoads(liveLoads);
      try {
        localStorage.setItem('cargoradar_loads', JSON.stringify(liveLoads));
      } catch (err) {
        console.error('Erro ao persistir cargas no localStorage:', err);
      }
    }, (error) => {
      console.warn('Erro ao conectar com Firestore para cargas (obtendo offline/cache local).', error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isOfflineError = errorMessage.toLowerCase().includes('offline') || 
                             errorMessage.toLowerCase().includes('connection') || 
                             errorMessage.toLowerCase().includes('network') ||
                             errorMessage.toLowerCase().includes('unavailable');
                             
      if (!isOfflineError) {
        handleFirestoreError(error, OperationType.LIST, 'loads');
      }
    });

    return () => {
      unsubLoads();
    };
  }, []);

  // 2. Users (subscribed when guest for login, or when administrative role is active)
  useEffect(() => {
    const shouldSubscribe = !isAuthenticated || (loggedInUser?.systemRole === 'administrator');

    if (!shouldSubscribe) {
      setUsers([]);
      return;
    }

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const liveUsers: User[] = [];
      snapshot.forEach((docSnap) => {
        liveUsers.push(docSnap.data() as User);
      });
      if (liveUsers.length > 0) {
        setUsers(liveUsers);
        try {
          localStorage.setItem('cargoradar_users', JSON.stringify(liveUsers));
        } catch (err) {
          console.error('Erro ao persistir usuários no localStorage:', err);
        }
      }
    }, (error) => {
      console.warn('Erro ao conectar com Firestore para usuários. Mantendo cache local.', error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isOfflineError = errorMessage.toLowerCase().includes('offline') || 
                             errorMessage.toLowerCase().includes('connection') || 
                             errorMessage.toLowerCase().includes('network') ||
                             errorMessage.toLowerCase().includes('unavailable');
                             
      if (!isOfflineError) {
        handleFirestoreError(error, OperationType.LIST, 'users');
      }
    });

    return () => {
      unsubUsers();
    };
  }, [isAuthenticated, loggedInUser]);

  // 3. System logs (subscribed only if user is logged in as administrator)
  useEffect(() => {
    const isAdmin = isAuthenticated && loggedInUser?.systemRole === 'administrator';

    if (!isAdmin) {
      setLogs([]);
      return;
    }

    const unsubLogs = onSnapshot(collection(db, 'logs'), (snapshot) => {
      const liveLogs: EventLog[] = [];
      snapshot.forEach((docSnap) => {
        liveLogs.push(docSnap.data() as EventLog);
      });
      liveLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setLogs(liveLogs);
      try {
        localStorage.setItem('cargoradar_logs', JSON.stringify(liveLogs));
      } catch (err) {
        console.error('Erro ao persistir logs no localStorage:', err);
      }
    }, (error) => {
      console.warn('Erro ao conectar com Firestore para logs. Mantendo cache local.', error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isOfflineError = errorMessage.toLowerCase().includes('offline') || 
                             errorMessage.toLowerCase().includes('connection') || 
                             errorMessage.toLowerCase().includes('network') ||
                             errorMessage.toLowerCase().includes('unavailable');
                             
      if (!isOfflineError) {
        handleFirestoreError(error, OperationType.LIST, 'logs');
      }
    });

    return () => {
      unsubLogs();
    };
  }, [isAuthenticated, loggedInUser]);

  // Bootstrap default users to Firestore if the users collection is empty
  useEffect(() => {
    const bootstrapData = async () => {
      try {
        const usersCol = collection(db, 'users');
        const q = query(usersCol, limit(1));
        console.log('Attempting to read users collection for bootstrapping...');
        let userSnap;
        try {
          userSnap = await getDocs(q);
          console.log('Successfully read users collection. Empty?', userSnap.empty);
        } catch (readErr) {
          console.error('Failed to read users collection during bootstrap check:', readErr);
          throw readErr;
        }

        if (userSnap.empty) {
          console.log('Bootstrapping default users to Firestore...');
          const defaultUsers: User[] = [
            { id: 'master', username: 'cleiton', password: '123456', role: 'audit', systemRole: 'administrator', status: 'active', createdAt: new Date().toISOString(), fullName: 'Administrador Cleiton' },
            { id: '1', username: 'CARGADD', password: '123456', role: 'expedition', systemRole: 'dispatcher', status: 'active', createdAt: new Date().toISOString() },
            { id: '2', username: 'LIBERACAO', password: 'CENTRAL123', role: 'central', systemRole: 'administrator', status: 'active', createdAt: new Date().toISOString() },
            { id: '3', username: 'AUDITORIA', password: 'AUDITOR123', role: 'audit', systemRole: 'auditor', status: 'active', createdAt: new Date().toISOString() },
            { id: '4', username: 'ANALISE', password: 'ANALISE123', role: 'analysis', systemRole: 'administrator', status: 'active', createdAt: new Date().toISOString() },
          ];
          for (const u of defaultUsers) {
            try {
              console.log(`Attempting to set user: ${u.username} (${u.id})`);
              await setDoc(doc(db, 'users', u.id), u);
              console.log(`Successfully bootstrapped user: ${u.username}`);
            } catch (writeErr) {
              console.error(`Failed to write user doc ${u.id} (${u.username}):`, writeErr);
              throw writeErr;
            }
          }
        }
      } catch (err) {
        console.error('Error bootstrapping default users:', err);
      }
    };
    bootstrapData();
  }, []);

  const addLog = async (action: string, details: string, username: string, loadId?: string) => {
    const newLog: EventLog = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      username,
      action,
      details,
      loadId: loadId || "",
    };

    // Altera o estado local e persiste localmente imediatamente de forma otimista
    setLogs((prev) => {
      const updated = [newLog, ...prev].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      try {
        localStorage.setItem('cargoradar_logs', JSON.stringify(updated));
      } catch (e) {
        console.error('Erro ao salvar logs localmente:', e);
      }
      return updated;
    });

    try {
      await setDoc(doc(db, 'logs', newLog.id), sanitizeFirestoreData(newLog));
    } catch (err) {
      console.warn('Falha remota ao registrar log (offline/conexão instável):', err);
    }
  };

  const handleAddLoad = async (newLoadData: Omit<CargoLoad, 'id' | 'status' | 'createdAt' | 'createdBy'>) => {
    const username = loggedInUser?.username || 'Sistema';
    const newLoad: CargoLoad = {
      ...newLoadData,
      id: generateId(),
      status: CargoStatus.AWAITING,
      createdAt: new Date().toISOString(),
      createdBy: username,
    };

    // Otimista: Salva localmente primeiro
    setLoads((prev) => {
      const updated = [newLoad, ...prev];
      try {
        localStorage.setItem('cargoradar_loads', JSON.stringify(updated));
      } catch (e) {
        console.error('Erro ao salvar carga localmente:', e);
      }
      return updated;
    });

    try {
      await setDoc(doc(db, 'loads', newLoad.id), sanitizeFirestoreData(newLoad));
      addLog('Criação de Carga', `Carga ${newLoad.plate} criada por ${username}`, username, newLoad.id);
    } catch (err) {
      console.warn('Conexão instável. Carga mantida localmente e log registrado localmente.', err);
      addLog('Criação de Carga (Local)', `Carga ${newLoad.plate} criada offline por ${username}`, username, newLoad.id);
    }
    
    // Admins or specific roles might want to stay or move
    if (loggedInUser?.systemRole === 'administrator' || loggedInUser?.role === 'central') {
       handleTabChange('central');
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: CargoStatus) => {
    const load = loads.find(l => l.id === id);
    const username = loggedInUser?.username || 'Sistema';
    const timestamp = new Date().toISOString();
    if (!load) return;

    const updatedLoad = {
      ...load,
      status: newStatus,
      auditedAt: newStatus === CargoStatus.RELEASED || newStatus === CargoStatus.BLOCKED ? timestamp : (load.auditedAt || "")
    };

    // Otimista: Atualiza localmente
    setLoads((prev) => {
      const updated = prev.map(l => l.id === id ? updatedLoad : l);
      try {
        localStorage.setItem('cargoradar_loads', JSON.stringify(updated));
      } catch (e) {
        console.error('Erro ao atualizar status da carga localmente:', e);
      }
      return updated;
    });

    try {
      await setDoc(doc(db, 'loads', id), sanitizeFirestoreData(updatedLoad), { merge: true });
      addLog('Atualização de Status', `Carga ${load.plate} alterada para ${newStatus} por ${username}`, username, id);
    } catch (err) {
      console.warn('Conexão instável. Modificação do status mantida localmente.', err);
      addLog('Atualização de Status (Local)', `Carga ${load.plate} alterada para ${newStatus} offline por ${username}`, username, id);
    }
  };

  const handleUpdateOccurrence = async (id: string, type: OccurrenceType, description: string, photo?: string) => {
    const load = loads.find(l => l.id === id);
    const username = loggedInUser?.username || 'Sistema';
    const timestamp = new Date().toISOString();
    if (!load) return;

    const updatedLoad = {
      ...load,
      occurrenceType: type,
      occurrenceDescription: description,
      occurrencePhoto: photo || "",
      auditedAt: timestamp,
      status: type !== OccurrenceType.NONE ? CargoStatus.BLOCKED : load.status,
      occurrenceHistory: [
        ...(load.occurrenceHistory || []),
        {
          type,
          description,
          photo: photo || "",
          auditor: username,
          timestamp
        }
      ]
    };

    // Otimista: Atualiza localmente
    setLoads((prev) => {
      const updated = prev.map(l => l.id === id ? updatedLoad : l);
      try {
        localStorage.setItem('cargoradar_loads', JSON.stringify(updated));
      } catch (e) {
        console.error('Erro ao atualizar ocorrência localmente:', e);
      }
      return updated;
    });

    try {
      await setDoc(doc(db, 'loads', id), sanitizeFirestoreData(updatedLoad), { merge: true });
      addLog('Auditoria de Carga', `Auditoria realizada na carga ${load.plate} por ${username}. Ocorrência: ${type}`, username, id);
    } catch (err) {
      console.warn('Conexão instável. Auditoria de ocorrência mantida localmente.', err);
      addLog('Auditoria de Carga (Local)', `Auditoria offline na carga ${load.plate} por ${username}. Ocorrência: ${type}`, username, id);
    }
  };

  const handleRegisterUser = async (user: Omit<User, 'id' | 'status' | 'createdAt'>) => {
    try {
      const email = `${user.username.toLowerCase()}@cargarelease.com`;
      let uid = generateId();
      
      try {
        const credential = await createUserWithEmailAndPassword(auth, email, user.password);
        uid = credential.user.uid;
        console.log("Successfully registered user in Firebase Auth with UID:", uid);
      } catch (authErr) {
        console.warn("Could not create Firebase Auth credential, using a standard ID:", authErr);
      }

      const newUser: User = {
        ...user,
        id: uid,
        status: 'pending',
        systemRole: 'viewer',
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', newUser.id), sanitizeFirestoreData(newUser));
      addLog('Solicitação de Cadastro', `Novo usuário ${newUser.username} (${newUser.fullName || 'S/N'}) - Loja: ${newUser.storeLocation || 'S/N'} aguardando aprovação`, 'Sistema');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'users/new');
    }
  };

  const handleApproveUser = async (userId: string, approve: boolean) => {
    const user = users.find(u => u.id === userId);
    const username = loggedInUser?.username || 'Sistema';
    if (!user) return;
    try {
      let systemRole: SystemRole = user.systemRole || 'viewer';
      if (approve) {
        if (user.role === 'expedition') {
          systemRole = 'dispatcher';
        } else if (user.role === 'audit') {
          systemRole = 'auditor';
        } else if (user.role === 'central' || user.role === 'analysis') {
          systemRole = 'administrator';
        }
      }
      await setDoc(doc(db, 'users', userId), sanitizeFirestoreData({ 
        status: approve ? 'active' : 'rejected',
        systemRole: systemRole
      }), { merge: true });
      addLog('Gestão de Usuários', `Usuário ${user.username} ${approve ? 'aprovado' : 'rejeitado'} com perfil de sistema: ${systemRole} por ${username}`, username);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'users/' + userId);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    const username = loggedInUser?.username || 'Sistema';
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
      addLog('Gestão de Usuários', `Usuário ${user.username} excluído por ${username}`, username);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'users/' + userId);
    }
  };

  const handleChangePassword = async (userId: string, newPassword: string) => {
    const user = users.find(u => u.id === userId);
    const username = loggedInUser?.username || 'Sistema';
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', userId), sanitizeFirestoreData({ password: newPassword }), { merge: true });
      addLog('Gestão de Usuários', `Senha do usuário ${user.username} alterada por ${username}`, username);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'users/' + userId);
    }
  };

  const handleUpdateSystemRole = async (userId: string, systemRole: SystemRole) => {
    const user = users.find(u => u.id === userId);
    const username = loggedInUser?.username || 'Sistema';
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', userId), sanitizeFirestoreData({ systemRole }), { merge: true });
      addLog('Gestão de Usuários', `Perfil de sistema do usuário ${user.username} alterado para ${systemRole} por ${username}`, username);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'users/' + userId);
    }
  };

  const handleLoginSuccess = async (user: User) => {
    const email = `${user.username.toLowerCase()}@cargarelease.com`;
    const authPassword = user.password;
    let finalUser = { ...user };

    try {
      let authUser;
      try {
        const credential = await signInWithEmailAndPassword(auth, email, authPassword);
        authUser = credential.user;
        console.log("Successfully signed in to Firebase Auth:", email);
      } catch (signInErr: any) {
        if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential' || signInErr.code === 'auth/wrong-password') {
          try {
            console.log("User not found in Auth, registering under the hood:", email);
            const credential = await createUserWithEmailAndPassword(auth, email, authPassword);
            authUser = credential.user;
          } catch (createErr) {
            console.warn("Failed to automatically register user in Firebase Auth:", createErr);
          }
        } else {
          console.warn("Firebase Auth fallback active. Email/Password sign-in method may be disabled in the Firebase Console, but database verification worked successfully:", signInErr);
        }
      }

      if (authUser && user.id !== authUser.uid) {
        console.log(`Migrating document ID for ${user.username} from ${user.id} to ${authUser.uid}`);
        finalUser = {
          ...user,
          id: authUser.uid
        };
        await setDoc(doc(db, 'users', authUser.uid), sanitizeFirestoreData(finalUser));
        await deleteDoc(doc(db, 'users', user.id));
        console.log(`Migration completed for user ${user.username}`);
      }
    } catch (authErr) {
      console.error("Critical Auth migration step skipped:", authErr);
    }

    setIsAuthenticated(true);
    setLoggedInUser(finalUser);
    setActiveTab(finalUser.role as TabType);

    // Salva sessão localmente no localStorage
    try {
      localStorage.setItem('cargoradar_auth', 'true');
      localStorage.setItem('cargoradar_user', JSON.stringify(finalUser));
      localStorage.setItem('cargoradar_tab', finalUser.role);
    } catch (e) {
      console.error('Erro ao persistir sessão do usuário no localStorage:', e);
    }

    addLog('Login', `Usuário ${finalUser.username} realizou login unificado e foi direcionado para ${finalUser.role}`, finalUser.username);
  };

  const handleLogout = async () => {
    const username = loggedInUser?.username || 'Desconhecido';
    try {
      await signOut(auth);
      console.log("Signed out of Firebase Auth");
    } catch (signOutErr) {
      console.error("Error during Firebase Auth sign out:", signOutErr);
    }
    setIsAuthenticated(false);
    setLoggedInUser(null);

    // Remove sessão do localStorage
    try {
      localStorage.removeItem('cargoradar_auth');
      localStorage.removeItem('cargoradar_user');
      localStorage.removeItem('cargoradar_tab');
    } catch (e) {
      console.error('Erro ao remover sessão do usuário do localStorage:', e);
    }

    addLog('Logout', `Usuário ${username} saiu do sistema`, username);
  };

  const renderContent = () => {
    if (!isAuthenticated) {
      return (
        <LoginView 
          users={users}
          onLoginSuccess={handleLoginSuccess} 
          onRegisterRequest={handleRegisterUser}
        />
      );
    }

    switch (activeTab) {
      case 'expedition':
        return <ExpeditionView onSubmit={handleAddLoad} logs={logs.filter(l => l.username === loggedInUser?.username)} />;
      case 'central':
        return (
          <CentralView 
            loads={loads} 
            onUpdateStatus={handleUpdateStatus} 
            onUpdateLoad={async (updatedLoad) => {
              const username = loggedInUser?.username || 'Sistema';

              // Otimista: Atualiza localmente
              setLoads((prev) => {
                const updated = prev.map(l => l.id === updatedLoad.id ? updatedLoad : l);
                try {
                  localStorage.setItem('cargoradar_loads', JSON.stringify(updated));
                } catch (e) {
                  console.error('Erro ao atualizar rota localmente:', e);
                }
                return updated;
              });

              try {
                await setDoc(doc(db, 'loads', updatedLoad.id), sanitizeFirestoreData(updatedLoad), { merge: true });
                addLog('Atualização da Rota', `Carga ${updatedLoad.plate} atualizada no processo de rota por ${username}`, username, updatedLoad.id);
              } catch (err) {
                console.warn('Conexão instável. Rota atualizada localmente.', err);
                addLog('Atualização da Rota (Local)', `Carga ${updatedLoad.plate} atualizada offline em rota por ${username}`, username, updatedLoad.id);
              }
            }}
          />
        );
      case 'audit':
        return (
          <AuditView 
            loads={loads} 
            users={users}
            logs={logs}
            onUpdateOccurrence={handleUpdateOccurrence} 
            onApproveUser={handleApproveUser}
            onDeleteUser={handleDeleteUser}
            onChangePassword={handleChangePassword}
            onUpdateSystemRole={handleUpdateSystemRole}
            currentUser={loggedInUser}
          />
        );
      case 'analysis':
        return <AnalysisView loads={loads} />;
      default:
        return null;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={handleTabChange} 
      onLogout={handleLogout}
      isAuthenticated={isAuthenticated}
      user={loggedInUser}
      loads={loads}
    >
      <div className="animate-in fade-in duration-500">
        {renderContent()}
      </div>
    </Layout>
  );
};

export default App;
