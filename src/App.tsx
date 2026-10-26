
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Keyboard, HelpCircle, X, Sparkles, CloudOff, RefreshCw } from 'lucide-react';
import { ExpeditionView } from './views/ExpeditionView';
import { CentralView } from './views/CentralView';
import { AuditView } from './views/AuditView';
import { AnalysisView } from './views/AnalysisView';
import { LoginView } from './views/LoginView';
import { PortariaView } from './views/PortariaView';
import { SettingsView } from './views/SettingsView';
import { ReverseTransferView } from './views/ReverseTransferView';
import { GuideView } from './views/GuideView';
import { SupervisorCDView } from './views/SupervisorCDView';
import { CargoLoad, CargoStatus, CargoType, OccurrenceType, User, EventLog, SystemRole } from './types';
import { getGmailToken, sendGmailEmail } from './utils/gmailService';
import { capLoadDocumentSize } from './utils/imageCompressor';
import { localDb, generateLocalId } from './services/localDatabase';

type TabType = 'supervisor_cd' | 'expedition' | 'central' | 'audit' | 'analysis' | 'portaria' | 'settings' | 'reverse_transfer' | 'guide';

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
  // Offline and synchronization status of the cached system
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !window.navigator.onLine;
    }
    return false;
  });

  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    try {
      return localStorage.getItem('cargoradar_last_sync') || null;
    } catch {
      return null;
    }
  });

  // Keyboard Shortcut States for accelerated operator workflows
  const [shortcutFeedback, setShortcutFeedback] = useState<string | null>(null);
  const [showShortcutHelp, setShowShortcutHelp] = useState<boolean>(false);

const VALID_TABS: TabType[] = ['supervisor_cd', 'expedition', 'central', 'audit', 'analysis', 'portaria', 'settings', 'reverse_transfer', 'guide'];

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    try {
      const savedTab = localStorage.getItem('cargoradar_tab');
      // If previous session was on the removed tracking view, purge it
      if (savedTab === 'tracking' || (savedTab && !VALID_TABS.includes(savedTab as TabType))) {
        localStorage.removeItem('cargoradar_tab');
      }

      const persistedUser = localStorage.getItem('cargoradar_user');
      if (persistedUser) {
        const user = JSON.parse(persistedUser);
        if (user.role === 'store_app') {
          return 'reverse_transfer';
        }
        if (savedTab && VALID_TABS.includes(savedTab as TabType)) {
          return savedTab as TabType;
        }
        if (user.role && VALID_TABS.includes(user.role as TabType)) {
          return user.role as TabType;
        }
        return 'expedition';
      }
      if (savedTab && VALID_TABS.includes(savedTab as TabType)) {
        return savedTab as TabType;
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
          const filtered = parsed.filter((l: any) => l && l.id && !l.id.startsWith('initial-'));
          return filtered;
        }
      }
      return [];
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
        const tabs: TabType[] = ['supervisor_cd', 'expedition', 'central', 'audit', 'analysis', 'portaria', 'settings', 'guide'];
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
      // Avoid registering Service Worker if inside an iframe (e.g. AI Studio development environment preview)
      if (window.self !== window.top) {
        console.log('Ambiente de visualização (Iframe) detectado. Registro de Service Worker ignorado.');
        return;
      }
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('Service Worker registrado:', reg.scope))
        .catch((err) => {
          console.warn('Aviso: Não foi possível registrar o Service Worker (comum em ambientes restritos/iframe):', err);
        });
    }
  }, []);

  // Listen to window connection event changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOffline(false);
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
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
        playTone(554.37, now, 0.15);
        playTone(466.16, now + 0.08, 0.25);
      }
    } catch (err) {
      console.warn('Alerta sonoro com falha/bloqueado no navegador:', err);
    }
  };

  const handleRetryConnection = async () => {
    setIsOffline(false);
    const nowStr = new Date().toLocaleString('pt-BR');
    setLastSyncTime(nowStr);
    try {
      localStorage.setItem('cargoradar_last_sync', nowStr);
    } catch (e) {
      console.warn('Erro ao salvar timestamp da sincronização:', e);
    }
    setShortcutFeedback('Banco local operacional e sincronizado!');
  };

  // Set up reactive subscriptions to localDb
  useEffect(() => {
    const unsubLoads = localDb.subscribeLoads((liveLoads) => {
      // Analyze changes to detect state transitioning to BLOCKED (DIVERGENCY)
      liveLoads.forEach((load) => {
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
          if (notifiedLoadIds.current.has(load.id)) {
            notifiedLoadIds.current.delete(load.id);
          }
        }
      });

      isFirstLoad.current = false;
      setLoads(liveLoads);
      const nowStr = new Date().toLocaleString('pt-BR');
      setLastSyncTime(nowStr);
    });

    const unsubUsers = localDb.subscribeUsers((liveUsers) => {
      setUsers(liveUsers);
    });

    const unsubLogs = localDb.subscribeLogs((liveLogs) => {
      setLogs(liveLogs);
    });

    return () => {
      unsubLoads();
      unsubUsers();
      unsubLogs();
    };
  }, []);

  const addLog = async (action: string, details: string, username: string, loadId?: string) => {
    localDb.addLog(action, details, username, loadId);
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

    localDb.saveLoad(newLoad);
    addLog('Criação de Carga', `Carga ${newLoad.plate} criada por ${username}`, username, newLoad.id);
    
    // Admins or specific roles might want to stay or move
    if (loggedInUser?.systemRole === 'administrator' || loggedInUser?.role === 'central') {
       handleTabChange('central');
    }
  };

  const sendBlockedAlertEmail = async (load: CargoLoad, optType?: string, optDesc?: string) => {
    try {
      const savedEmails = localStorage.getItem('occurrenceAlertEmails');
      const targetEmails = savedEmails ? JSON.parse(savedEmails) : [
        'central.monitoramento@atacadaodiaadia.com.br',
        'prevencao.perdas@atacadaodiaadia.com.br'
      ];
      
      const originEmail = loggedInUser 
        ? `${loggedInUser.username.toLowerCase()}@cargarelease.com`
        : 'central.monitoramento@atacadaodiaadia.com.br';

      const type = optType || load.occurrenceType || 'OUTRAS DIVERGÊNCIAS';
      const desc = optDesc || load.occurrenceDescription || 'Carga marcada como BLOQUEADA por ação operacional.';

      // Check for Gmail Token
      const gmailToken = getGmailToken();
      if (gmailToken) {
        console.log(`Disparando envio automático de e-mail de bloqueio via Gmail API...`);
        const emailHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e1e8ed; border-radius: 16px; background-color: #ffffff; color: #1c2434;">
            <div style="background-color: #0b1532; padding: 24px; border-radius: 12px 12px 0 0; text-align: center; border-bottom: 4px solid #f29c1f;">
              <h1 style="margin: 0; font-size: 18px; text-transform: uppercase; font-weight: 900; color: #ffffff;">ALERTA DE OCORRÊNCIA EM CURSO</h1>
              <p style="margin: 6px 0 0 0; font-size: 10px; text-transform: uppercase; color: #f29c1f; font-weight: 800;">Atacadão Dia a Dia - CargaRelease</p>
            </div>
            
            <div style="padding: 24px 16px;">
              <p style="font-size: 13.5px; margin-top: 0; line-height: 1.6; color: #475569;">
                Informamos que foi registrada uma <strong>ocorrência operacional crítica</strong> durante o processo de auditoria de pátio/gate para a carga identificada abaixo:
              </p>
              
              <table style="width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 13px;">
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 12px 16px; font-weight: bold; border-bottom: 1px solid #edf2f7; color: #64748b; width: 35%;">VEÍCULO / PLACA:</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #edf2f7; color: #0b1532; font-family: monospace; font-weight: 800; font-size: 15px;">${load.plate}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-weight: bold; border-bottom: 1px solid #edf2f7; color: #64748b;">MOTORISTA:</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #edf2f7; color: #334155; font-weight: bold;">${load.driverName || "NÃO CADASTRADO"}</td>
                </tr>
                <tr style="background-color: #fef2f2;">
                  <td style="padding: 12px 16px; font-weight: bold; border-bottom: 1px solid #edf2f7; color: #b91c1c;">TIPO DE OCORRÊNCIA:</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #edf2f7; font-weight: 900; color: #b91c1c; text-transform: uppercase;">${type}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-weight: bold; border-bottom: 1px solid #edf2f7; color: #64748b; vertical-align: top;">DESCRIÇÃO DETALHADA:</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #edf2f7; color: #1e293b; line-height: 1.6; font-weight: 500;">${desc}</td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: #f8fafc; padding: 16px; border-radius: 0 0 12px 12px; border-top: 1px solid #edf2f7; font-size: 11px; color: #64748b; text-align: center; line-height: 1.6;">
              Mensagem de comunicação automática instantânea enviada via API do Gmail conectada ao <strong>CargaRelease</strong>.
            </div>
          </div>
        `;

        for (const recipient of targetEmails) {
          try {
            await sendGmailEmail(recipient, `[ALERTA DE OCORRÊNCIA] Carga ${load.plate} - ${type}`, emailHtml);
            console.log(`E-mail de alerta de ocorrência enviado para ${recipient} com sucesso via Gmail.`);
          } catch (err) {
            console.error(`Falha ao enviar e-mail de alerta de ocorrência para ${recipient} via Gmail:`, err);
          }
        }
        return; // Exit as Gmail sent successfully
      }

      console.log(`Disparando envio automático de e-mail de bloqueio via SendGrid...`);
      const response = await fetch('/api/send-alert-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plate: load.plate,
          driverName: load.driverName || 'Não cadastrado',
          occurrenceType: type,
          occurrenceDescription: desc,
          targetEmails: targetEmails,
          originEmail: originEmail
        })
      });
      const result = await response.json();
      if (!response.ok) {
        console.warn('SendGrid automatically triggered alert returned failure:', result);
      } else {
        console.log('SendGrid automatically triggered alert email sent successfully:', result);
      }
    } catch (err) {
      console.error('Error on auto email alert dispatch:', err);
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
      tripFinished: newStatus === CargoStatus.FINISHED ? true : (newStatus === CargoStatus.RELEASED || newStatus === CargoStatus.AWAITING ? false : load.tripFinished),
      auditedAt: newStatus === CargoStatus.RELEASED || newStatus === CargoStatus.BLOCKED || newStatus === CargoStatus.FINISHED ? timestamp : (load.auditedAt || "")
    };

    localDb.saveLoad(updatedLoad);
    addLog('Atualização de Status', `Carga ${load.plate} alterada para ${newStatus} por ${username}`, username, id);

    if (newStatus === CargoStatus.BLOCKED && load.status !== CargoStatus.BLOCKED) {
      sendBlockedAlertEmail(updatedLoad);
    }
  };

  const handleUpdateOccurrence = async (id: string, type: OccurrenceType, description: string, photo?: string) => {
    const load = loads.find(l => l.id === id);
    const username = loggedInUser?.username || 'Sistema';
    const timestamp = new Date().toISOString();
    if (!load) return;

    const newStatus = type !== OccurrenceType.NONE ? CargoStatus.BLOCKED : load.status;

    const updatedLoad = {
      ...load,
      occurrenceType: type,
      occurrenceDescription: description,
      occurrencePhoto: photo || "",
      auditedAt: timestamp,
      status: newStatus,
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

    localDb.saveLoad(updatedLoad);
    addLog('Auditoria de Carga', `Auditoria realizada na carga ${load.plate} por ${username}. Ocorrência: ${type}`, username, id);

    if (newStatus === CargoStatus.BLOCKED && load.status !== CargoStatus.BLOCKED) {
      sendBlockedAlertEmail(updatedLoad, type, description);
    }
  };

  const handleUpdateLoad = async (updatedLoad: CargoLoad) => {
    const username = loggedInUser?.username || 'Sistema';
    localDb.saveLoad(updatedLoad);
    addLog('Atualização de Carga', `Carga ${updatedLoad.plate} atualizada por ${username}`, username, updatedLoad.id);
  };

  const handleDeleteLoad = async (loadId: string) => {
    const load = loads.find(l => l.id === loadId);
    if (!load) return;
    const username = loggedInUser?.username || 'Sistema';

    localDb.deleteLoad(loadId);
    addLog('Exclusão de Carga', `Carga ${load.plate} excluída por ${username}`, username, loadId);
  };

  const handleRegisterUser = async (user: Omit<User, 'id' | 'status' | 'createdAt'>) => {
    const result = localDb.register({
      ...user,
      status: 'pending'
    });
    if (result.user) {
      addLog('Solicitação de Cadastro', `Novo usuário ${result.user.username} (${result.user.fullName || 'S/N'}) - Unidade: ${result.user.storeLocation || 'S/N'} aguardando aprovação`, 'Sistema');
    }
  };

  const handleApproveUser = async (userId: string, approve: boolean) => {
    const user = users.find(u => u.id === userId);
    const username = loggedInUser?.username || 'Sistema';
    if (!user) return;
    
    let systemRole: SystemRole = user.systemRole || 'viewer';
    if (approve) {
      if (user.role === 'supervisor_cd') {
        systemRole = 'supervisor_cd';
      } else if (user.role === 'expedition' || user.role === 'portaria') {
        systemRole = 'dispatcher';
      } else if (user.role === 'audit') {
        systemRole = 'auditor';
      } else if (user.role === 'central' || user.role === 'analysis') {
        systemRole = 'administrator';
      } else if (user.role === 'store_app') {
        systemRole = 'store_app';
      }
    }
    
    localDb.updateUser(userId, { 
      status: approve ? 'active' : 'rejected',
      systemRole: systemRole
    });
    addLog('Gestão de Usuários', `Usuário ${user.username} ${approve ? 'aprovado' : 'rejeitado'} com perfil de sistema: ${systemRole} por ${username}`, username);
  };

  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    const username = loggedInUser?.username || 'Sistema';
    if (!user) return;
    localDb.deleteUser(userId);
    addLog('Gestão de Usuários', `Usuário ${user.username} excluído por ${username}`, username);
  };

  const handleChangePassword = async (userId: string, newPassword: string) => {
    const user = users.find(u => u.id === userId);
    const username = loggedInUser?.username || 'Sistema';
    if (!user) return;
    localDb.updateUser(userId, { password: newPassword });
    addLog('Gestão de Usuários', `Senha do usuário ${user.username} alterada por ${username}`, username);
  };

  const handleUpdateSystemRole = async (userId: string, systemRole: SystemRole) => {
    const user = users.find(u => u.id === userId);
    const username = loggedInUser?.username || 'Sistema';
    if (!user) return;
    localDb.updateUser(userId, { systemRole });
    addLog('Gestão de Usuários', `Perfil de sistema do usuário ${user.username} alterado para ${systemRole} por ${username}`, username);
  };

  const handleLoginSuccess = async (user: User) => {
    localDb.setCurrentUser(user);
    setIsAuthenticated(true);
    setLoggedInUser(user);
    
    let initialTab: TabType = 'expedition';
    if (user.role === 'supervisor_cd' || user.systemRole === 'supervisor_cd') {
      initialTab = 'supervisor_cd';
    } else if (user.role === 'store_app' || user.systemRole === 'store_app') {
      initialTab = 'reverse_transfer';
    } else if (user.role) {
      initialTab = user.role as TabType;
    }
    
    setActiveTab(initialTab);

    // Salva sessão no localStorage
    try {
      localStorage.setItem('cargoradar_auth', 'true');
      localStorage.setItem('cargoradar_user', JSON.stringify(user));
      localStorage.setItem('cargoradar_tab', initialTab);
    } catch (e) {
      console.error('Erro ao persistir sessão do usuário no localStorage:', e);
    }

    addLog('Login', `Usuário ${user.username} realizou login e foi direcionado para ${initialTab}`, user.username);
  };

  const handleLogout = async () => {
    const username = loggedInUser?.username || 'Desconhecido';
    localDb.logout();
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
      case 'supervisor_cd':
        return (
          <SupervisorCDView 
            loads={loads}
            users={users}
            logs={logs}
            currentUser={loggedInUser}
            onApproveUser={handleApproveUser}
            onNavigateToTab={(tab) => handleTabChange(tab as TabType)}
          />
        );
      case 'expedition':
        return (
          <ExpeditionView 
            onSubmit={handleAddLoad} 
            onUpdateLoad={handleUpdateLoad}
            loads={loads} 
            logs={logs.filter(l => l.username === loggedInUser?.username)} 
            currentUser={loggedInUser}
          />
        );
      case 'central':
        return (
          <CentralView 
            loads={loads} 
            onUpdateStatus={handleUpdateStatus} 
            onUpdateLoad={async (updatedLoad) => {
              const username = loggedInUser?.username || 'Sistema';
              localDb.saveLoad(updatedLoad);
              addLog('Atualização da Rota', `Carga ${updatedLoad.plate} atualizada no processo de rota por ${username}`, username, updatedLoad.id);
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
            onDeleteLoad={handleDeleteLoad}
            logs={logs}
            loggedInUser={loggedInUser}
          />
        );
      case 'reverse_transfer':
        return (
          <ReverseTransferView 
            onSubmit={handleAddLoad} 
            onUpdateLoad={handleUpdateLoad}
            onDeleteLoad={handleDeleteLoad}
            loads={loads}
            currentUser={loggedInUser}
          />
        );
      case 'settings':
        return (
          <SettingsView 
            currentUser={loggedInUser}
            loads={loads}
          />
        );
      case 'guide':
        return <GuideView />;
      default:
        // Guaranteed fallback so the view never renders empty or breaks
        if (loggedInUser?.role === 'supervisor_cd' || loggedInUser?.systemRole === 'supervisor_cd') {
          return (
            <SupervisorCDView 
              loads={loads}
              users={users}
              logs={logs}
              currentUser={loggedInUser}
              onApproveUser={handleApproveUser}
              onNavigateToTab={(tab) => handleTabChange(tab as TabType)}
            />
          );
        }
        return (
          <ExpeditionView 
            onSubmit={handleAddLoad} 
            onUpdateLoad={handleUpdateLoad}
            loads={loads} 
            logs={logs.filter(l => l.username === loggedInUser?.username)} 
            currentUser={loggedInUser}
          />
        );
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
      isOffline={isOffline}
      lastSyncTime={lastSyncTime}
    >
      {/* Persistent Offline Banner Toast */}
      {isOffline && isAuthenticated && (
        <div className="mb-6 bg-amber-500/10 dark:bg-amber-500/5 border-2 border-amber-500/30 dark:border-amber-500/20 rounded-3xl p-5 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-top-6 duration-500 text-left">
          {/* Ambient decorative glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 z-10 relative">
            <div className="flex items-start md:items-center gap-4">
              <div className="p-3 bg-amber-500/20 dark:bg-amber-500/10 text-amber-600 dark:text-amber-450 rounded-2xl shrink-0 shadow-lg border border-amber-500/20">
                <CloudOff className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-xs font-black uppercase text-amber-850 dark:text-amber-300 tracking-wider">
                    Operando com Dados Locais (Offline)
                  </h4>
                  <span className="bg-amber-500/20 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[8.5px] font-black px-2 py-0.5 rounded-full border border-amber-500/20 uppercase tracking-widest animate-pulse">
                    Banco Local Ativo
                  </span>
                </div>
                <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400/90 leading-relaxed max-w-4xl">
                  A conexão com o servidor está indisponível ou limitada no momento. O CargaRadar está armazenando todos os seus registros de veículos, checklists de portaria e ocorrências localmente de forma segura. A transmissão para a nuvem ocorrerá automaticamente assim que sua internet estabilizar.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto border-t md:border-t-0 border-amber-500/20 pt-3 md:pt-0 shrink-0 justify-between md:justify-end">
              <button
                onClick={handleRetryConnection}
                className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-200 border border-amber-500/40 rounded-2xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow"
                title="Sincronizar com o banco de dados agora"
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Tentar Reconectar</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="flex flex-col items-start md:items-end">
                  <span className="text-[8.5px] font-black uppercase tracking-widest text-amber-500/80 dark:text-amber-505">
                    Última sincronização bem-sucedida
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-900 dark:text-amber-300 mt-0.5">
                    {lastSyncTime ? lastSyncTime : 'Nenhuma recente nesta sessão'}
                  </span>
                </div>
                <div className="w-3.5 h-3.5 rounded-full bg-amber-500/40 dark:bg-amber-500/20 flex items-center justify-center border border-amber-500/35 flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400 animate-ping" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    <span>1. Supervisor CD</span>
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-bold font-sans">Alt+1</span>
                  </div>
                  <div className="p-2 bg-slate-950/40 rounded-lg flex justify-between items-center">
                    <span>2. Expedição</span>
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-bold font-sans">Alt+2</span>
                  </div>
                  <div className="p-2 bg-slate-950/40 rounded-lg flex justify-between items-center">
                    <span>3. Central</span>
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-bold font-sans">Alt+3</span>
                  </div>
                  <div className="p-2 bg-slate-950/40 rounded-lg flex justify-between items-center">
                    <span>4. Auditoria</span>
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-bold font-sans">Alt+4</span>
                  </div>
                  <div className="p-2 bg-slate-950/40 rounded-lg flex justify-between items-center">
                    <span>5. Análise</span>
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-bold font-sans">Alt+5</span>
                  </div>
                  <div className="p-2 bg-slate-950/40 rounded-lg flex justify-between items-center">
                    <span>6. Portaria</span>
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-bold font-sans">Alt+6</span>
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
