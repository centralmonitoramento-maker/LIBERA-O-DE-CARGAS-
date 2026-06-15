
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Keyboard, HelpCircle, X, Sparkles } from 'lucide-react';
import { ExpeditionView } from './views/ExpeditionView';
import { CentralView } from './views/CentralView';
import { AuditView } from './views/AuditView';
import { AnalysisView } from './views/AnalysisView';
import { LoginView } from './views/LoginView';
import { PortariaView } from './views/PortariaView';
import { TrackingView } from './views/TrackingView';
import { CargoLoad, CargoStatus, CargoType, OccurrenceType, User, EventLog, SystemRole } from './types';
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

type TabType = 'expedition' | 'central' | 'audit' | 'analysis' | 'portaria' | 'tracking';

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
  // Keyboard Shortcut States for accelerated operator workflows
  const [shortcutFeedback, setShortcutFeedback] = useState<string | null>(null);
  const [showShortcutHelp, setShowShortcutHelp] = useState<boolean>(false);

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
      if (persisted) {
        const parsed = JSON.parse(persisted);
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      const defaultLoads: CargoLoad[] = [
        {
          id: 'initial-1',
          plate: 'BWU-8171',
          driverName: 'Raimundo Silveira',
          origin: 'CD Atacadão Brasília',
          destination: 'Águas Claras (df-1)',
          cargoType: CargoType.SECA,
          isHighRisk: false,
          palletCount: 24,
          sealNumber: 'L34891',
          status: CargoStatus.RELEASED,
          createdAt: new Date().toISOString(),
          createdBy: 'CARGADD',
          auditedAt: new Date().toISOString()
        },
        {
          id: 'initial-2',
          plate: 'BWH-4H66',
          driverName: 'Valdir Brandão',
          origin: 'CD Atacadão Brasília',
          destination: 'Guará II (df-7)',
          cargoType: CargoType.MISTA,
          isHighRisk: true,
          palletCount: 18,
          sealNumber: 'L99112',
          status: CargoStatus.RELEASED,
          createdAt: new Date().toISOString(),
          createdBy: 'CARGADD',
          auditedAt: new Date().toISOString()
        },
        {
          id: 'initial-3',
          plate: 'KJG-5512',
          driverName: 'Carlos Eduardo',
          origin: 'CD Atacadão Brasília',
          destination: 'Taguatinga Sul (df-3)',
          cargoType: CargoType.PERECIVEIS,
          isHighRisk: false,
          palletCount: 12,
          sealNumber: 'L22119',
          status: CargoStatus.AWAITING,
          createdAt: new Date().toISOString(),
          createdBy: 'CARGADD'
        }
      ];
      localStorage.setItem('cargoradar_loads', JSON.stringify(defaultLoads));
      return defaultLoads;
    } catch {
      return [];
    }
  });

  const saveLoadsToLocalStorage = (loadsArray: CargoLoad[]) => {
    try {
      const cleaned = loadsArray.map((load) => {
        const {
          photoPlate,
          photoSeal,
          photoManifest,
          occurrencePhoto,
          gatePhotoPlate,
          gatePhotoSeal,
          gatePhotoManifest,
          ...rest
        } = load;

        let cleanedHistory = undefined;
        if (load.occurrenceHistory) {
          cleanedHistory = load.occurrenceHistory.map(occ => {
            const { photo, ...occRest } = occ;
            return occRest;
          });
        }

        return {
          ...rest,
          ...(cleanedHistory !== undefined ? { occurrenceHistory: cleanedHistory } : {})
        };
      });

      localStorage.setItem('cargoradar_loads', JSON.stringify(cleaned));
    } catch (err) {
      console.warn('Falha segura ao persistir cargas no local storage (limite excedido):', err);
    }
  };

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const persisted = localStorage.getItem('cargoradar_users');
      if (persisted) {
        const parsed = JSON.parse(persisted);
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      const defaultUsers: User[] = [
        { id: 'master', username: 'cleiton', password: '123456', role: 'audit', systemRole: 'administrator', status: 'active', createdAt: new Date().toISOString(), fullName: 'Administrador Cleiton' },
        { id: '1', username: 'CARGADD', password: '123456', role: 'expedition', systemRole: 'dispatcher', status: 'active', createdAt: new Date().toISOString() },
        { id: '2', username: 'LIBERACAO', password: 'CENTRAL123', role: 'central', systemRole: 'administrator', status: 'active', createdAt: new Date().toISOString() },
        { id: '3', username: 'AUDITORIA', password: 'AUDITOR123', role: 'audit', systemRole: 'auditor', status: 'active', createdAt: new Date().toISOString() },
        { id: '4', username: 'ANALISE', password: 'ANALISE123', role: 'analysis', systemRole: 'administrator', status: 'active', createdAt: new Date().toISOString() },
      ];
      localStorage.setItem('cargoradar_users', JSON.stringify(defaultUsers));
      return defaultUsers;
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

  // Main global keyboard shortcut engine
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for modifier keys (Ctrl or Cmd)
      const hasModifier = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // Help Shortcut: Ctrl + H or Ctrl + /
      if (hasModifier && (key === 'h' || e.key === '/')) {
        e.preventDefault();
        setShowShortcutHelp(prev => !prev);
        setShortcutFeedback(showShortcutHelp ? "Guia Ocultado" : "Guia de Atalhos Aberto");
        return;
      }

      // 1. Ctrl + N -> New Load (Switch tab to expedition, trigger reset, focus plate input)
      if (hasModifier && key === 'n') {
        e.preventDefault();
        if (activeTab !== 'expedition') {
          handleTabChange('expedition');
        }
        // Force cancellation and focus
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('shortcut-new-load'));
        }, activeTab !== 'expedition' ? 120 : 0);

        setShortcutFeedback("Nova Carga: Form redefinido e focado!");
        return;
      }

      // 2. Ctrl + S -> Save (Trigger save in current screen)
      if (hasModifier && key === 's') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('shortcut-save'));
        setShortcutFeedback("Comando de salvar enviado!");
        return;
      }

      // 3. Tab switching with Alt + Number (Alt + 1, Alt + 2, etc.)
      if (e.altKey && !isNaN(Number(e.key))) {
        const num = Number(e.key);
        const tabs: TabType[] = ['expedition', 'central', 'audit', 'analysis', 'portaria', 'tracking'];
        if (num >= 1 && num <= tabs.length) {
          e.preventDefault();
          const targetTab = tabs[num - 1];
          handleTabChange(targetTab);
          setShortcutFeedback(`Aba alterada para: ${targetTab.toUpperCase()}`);
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeTab, showShortcutHelp]);

  // Handle shortcut feedback auto-clear
  useEffect(() => {
    if (shortcutFeedback) {
      const timer = setTimeout(() => {
        setShortcutFeedback(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [shortcutFeedback]);

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

  // Restores active Firebase Auth session automatically on reload/boot if cached in localStorage
  useEffect(() => {
    if (isAuthenticated && loggedInUser && !auth.currentUser) {
      const email = `${loggedInUser.username.toLowerCase()}@cargarelease.com`;
      const authPassword = loggedInUser.password;
      console.log("Restoring Firebase Auth session details:", email);
      signInWithEmailAndPassword(auth, email, authPassword)
        .then((credential) => {
          console.log("Successfully restored Firebase Auth session on boot:", credential.user.email);
        })
        .catch((err) => {
          console.warn("Failed to automatically restore Firebase Auth session:", err);
        });
    }
  }, [isAuthenticated, loggedInUser]);

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

  const playNotificationChime = (type: 'added' | 'blocked') => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const audioCtx = new AudioContextClass();
      
      if (type === 'added') {
        const playTone = (freq: number, start: number, duration: number) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, start);
          
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.02, start + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
          
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          
          osc.start(start);
          osc.stop(start + duration);
        };
        
        const now = audioCtx.currentTime;
        // G5 then C6 subtle high double-tone chime
        playTone(783.99, now, 0.18);
        playTone(1046.50, now + 0.08, 0.3);
      } else if (type === 'blocked') {
        const playTone = (freq: number, start: number, duration: number) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, start);
          
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(0.03, start + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
          
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          
          osc.start(start);
          osc.stop(start + duration);
        };
        
        const now = audioCtx.currentTime;
        // Descriptive minor drop warning but sutil beep chime
        playTone(554.37, now, 0.15);
        playTone(466.16, now + 0.08, 0.25);
      }
    } catch (err) {
      console.warn('Alerta sonoro com falha/bloqueado no navegador:', err);
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
        const changeType = change.type;

        if (changeType === 'added' && !isFirstLoad.current) {
          // Play a subtle chime when load was live added
          playNotificationChime('added');
        }

        if (load.status === CargoStatus.BLOCKED) {
          if (isFirstLoad.current) {
            notifiedLoadIds.current.add(load.id);
          } else {
            if (!notifiedLoadIds.current.has(load.id)) {
              notifiedLoadIds.current.add(load.id);
              triggerNativeNotification(load);
              playNotificationChime('blocked');
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
      saveLoadsToLocalStorage(liveLoads);
    }, (error) => {
      console.warn('Erro ao conectar com Firestore para cargas (obtendo offline/cache local).', error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isOfflineOrQuota = errorMessage.toLowerCase().includes('offline') || 
                               errorMessage.toLowerCase().includes('connection') || 
                               errorMessage.toLowerCase().includes('network') ||
                               errorMessage.toLowerCase().includes('unavailable') ||
                               errorMessage.toLowerCase().includes('quota') ||
                               errorMessage.toLowerCase().includes('limit');
                             
      if (!isOfflineOrQuota) {
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
      const isOfflineOrQuota = errorMessage.toLowerCase().includes('offline') || 
                               errorMessage.toLowerCase().includes('connection') || 
                               errorMessage.toLowerCase().includes('network') ||
                               errorMessage.toLowerCase().includes('unavailable') ||
                               errorMessage.toLowerCase().includes('quota') ||
                               errorMessage.toLowerCase().includes('limit');
                             
      if (!isOfflineOrQuota) {
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
      const isOfflineOrQuota = errorMessage.toLowerCase().includes('offline') || 
                               errorMessage.toLowerCase().includes('connection') || 
                               errorMessage.toLowerCase().includes('network') ||
                               errorMessage.toLowerCase().includes('unavailable') ||
                               errorMessage.toLowerCase().includes('quota') ||
                               errorMessage.toLowerCase().includes('limit');
                             
      if (!isOfflineOrQuota) {
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
          const errMsg = readErr instanceof Error ? readErr.message : String(readErr);
          const isQuotaOrLimit = errMsg.toLowerCase().includes('quota') || 
                                 errMsg.toLowerCase().includes('limit') ||
                                 errMsg.toLowerCase().includes('exhausted') ||
                                 errMsg.toLowerCase().includes('resource');
          
          if (isQuotaOrLimit) {
            console.warn('[Firebase Resiliency] Quota or limit exceeded during read check. Working in local storage fallback mode.');
          } else {
            console.warn('Could not read users collection during bootstrap check:', readErr);
          }
          return; // Skip cloud writes when read check fails
        }

        if (userSnap && userSnap.empty) {
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
              const errMsg = writeErr instanceof Error ? writeErr.message : String(writeErr);
              const isQuotaOrLimit = errMsg.toLowerCase().includes('quota') || 
                                     errMsg.toLowerCase().includes('limit') ||
                                     errMsg.toLowerCase().includes('exhausted') ||
                                     errMsg.toLowerCase().includes('resource');
              if (isQuotaOrLimit) {
                console.warn(`[Firebase Resiliency] Quota or limit exceeded writing user doc ${u.id} (${u.username}).`);
              } else {
                console.warn(`Could not write user doc ${u.id} (${u.username}):`, writeErr);
              }
            }
          }
        }
      } catch (err) {
        console.warn('Silent fallback: Error bootstrapping default users:', err);
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
      saveLoadsToLocalStorage(updated);
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
      saveLoadsToLocalStorage(updated);
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
      saveLoadsToLocalStorage(updated);
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

  const handleUpdateLoad = async (updatedLoad: CargoLoad) => {
    const username = loggedInUser?.username || 'Sistema';

    // Otimista: Atualiza localmente
    setLoads((prev) => {
      const updated = prev.map(l => l.id === updatedLoad.id ? updatedLoad : l);
      saveLoadsToLocalStorage(updated);
      return updated;
    });

    try {
      await setDoc(doc(db, 'loads', updatedLoad.id), sanitizeFirestoreData(updatedLoad), { merge: true });
      addLog('Atualização de Carga', `Carga ${updatedLoad.plate} atualizada por ${username}`, username, updatedLoad.id);
    } catch (err) {
      console.warn('Conexão instável. Carga atualizada localmente.', err);
      addLog('Atualização de Carga (Local)', `Carga ${updatedLoad.plate} atualizada offline por ${username}`, username, updatedLoad.id);
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
        return (
          <ExpeditionView 
            onSubmit={handleAddLoad} 
            onUpdateLoad={handleUpdateLoad}
            loads={loads} 
            logs={logs.filter(l => l.username === loggedInUser?.username)} 
          />
        );
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
                saveLoadsToLocalStorage(updated);
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
      case 'portaria':
        return (
          <PortariaView 
            loads={loads}
            onUpdateLoad={handleUpdateLoad}
            logs={logs}
            loggedInUser={loggedInUser}
          />
        );
      case 'tracking':
        return (
          <TrackingView 
            loads={loads}
          />
        );
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

      {/* Global Shortcut HUD Overlay */}
      {shortcutFeedback && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[99] bg-slate-900/95 border border-primary-gold text-primary-gold text-xs font-black uppercase tracking-widest px-5 py-3 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-primary-gold animate-spin" />
          <span>{shortcutFeedback}</span>
        </div>
      )}

      {/* Floating Shortcut Action Trigger (Positioned alongside FeedbackChat) */}
      {isAuthenticated && (
        <button
          onClick={() => setShowShortcutHelp(true)}
          title="Atalhos do Teclado (Ctrl + H)"
          className="fixed bottom-6 right-24 z-40 bg-slate-900/90 hover:bg-slate-800 text-primary-gold hover:text-white p-3 rounded-full border border-slate-700/80 shadow-2xl transition-all hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center gap-2 group backdrop-blur-md"
        >
          <Keyboard className="w-5 h-5 text-primary-gold animate-pulse group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-wider max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap">
            Atalhos (Ctrl + H)
          </span>
        </button>
      )}

      {/* Keyboard Shortcuts Help Modal */}
      {showShortcutHelp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-slate-800 rounded-xl text-primary-gold">
                  <Keyboard className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-100 tracking-wider">Atalhos Globais do Teclado</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Otimização de processos para operadores e expedidores</p>
                </div>
              </div>
              <button 
                onClick={() => setShowShortcutHelp(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 gap-3">
                <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <dt className="font-extrabold text-slate-300 uppercase text-[10px]">Nova Carga / Limpar Form</dt>
                    <dd className="text-[9px] text-slate-400 mt-0.5">Muda para a aba de Expedição, cancela edição ativa e foca no campo da Placa.</dd>
                  </div>
                  <span className="bg-slate-800 border border-slate-700 text-slate-200 px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold shadow">
                    Ctrl + N
                  </span>
                </div>

                <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <dt className="font-extrabold text-slate-300 uppercase text-[10px]">Salvar / Transmitir</dt>
                    <dd className="text-[9px] text-slate-400 mt-0.5">Se na Expedição: envia a liberação. Se em Auditoria: salva o relatório.</dd>
                  </div>
                  <span className="bg-slate-800 border border-slate-700 text-slate-200 px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold shadow">
                    Ctrl + S
                  </span>
                </div>

                <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <dt className="font-extrabold text-slate-300 uppercase text-[10px]">Exibir / Ocultar Atalhos</dt>
                    <dd className="text-[9px] text-slate-400 mt-0.5">Abre ou fecha este painel explicativo para consulta rápida.</dd>
                  </div>
                  <span className="bg-slate-800 border border-slate-700 text-slate-200 px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold shadow">
                    Ctrl + H
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3">
                <h4 className="text-[10px] font-black text-primary-gold uppercase tracking-wider mb-2">Mudar de Aba Instantaneamente</h4>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-300">
                  <div className="p-2 bg-slate-950/40 rounded-lg flex justify-between items-center">
                    <span>1. Expedição</span>
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-bold font-sans">Alt+1</span>
                  </div>
                  <div className="p-2 bg-slate-950/40 rounded-lg flex justify-between items-center">
                    <span>2. Central</span>
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-bold font-sans">Alt+2</span>
                  </div>
                  <div className="p-2 bg-slate-950/40 rounded-lg flex justify-between items-center">
                    <span>3. Auditoria</span>
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-bold font-sans">Alt+3</span>
                  </div>
                  <div className="p-2 bg-slate-950/40 rounded-lg flex justify-between items-center">
                    <span>4. Monitor</span>
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-bold font-sans">Alt+4</span>
                  </div>
                  <div className="p-2 bg-slate-950/40 rounded-lg flex justify-between items-center">
                    <span>5. Portaria</span>
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-bold font-sans">Alt+5</span>
                  </div>
                  <div className="p-2 bg-slate-950/40 rounded-lg flex justify-between items-center">
                    <span>6. Tracking</span>
                    <span className="bg-slate-850 px-1.5 py-0.5 rounded text-slate-400 font-bold font-sans">Alt+6</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowShortcutHelp(false)}
                className="px-5 py-2.5 bg-primary-gold hover:bg-primary-gold/90 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
