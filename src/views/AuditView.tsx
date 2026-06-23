
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CargoLoad, OccurrenceType, CargoStatus, User, EventLog, SystemRole, getPhotosArray } from '../types';
import { compressImage } from '../utils/imageCompressor';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Camera, 
  Image as ImageIcon, 
  ImageOff, 
  User as UserIcon, 
  Calendar, 
  CheckCircle, 
  AlertTriangle,
  FileText,
  Eye,
  Maximize2,
  X,
  History,
  ShieldAlert,
  Search,
  Filter,
  RotateCcw,
  Columns,
  PanelRight,
  Mail,
  Plus,
  Trash2,
  Send,
  TrendingUp,
  Clock,
  Activity,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { db } from '../firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

interface AuditViewProps {
  loads: CargoLoad[];
  users: User[];
  logs: EventLog[];
  onUpdateOccurrence: (id: string, type: OccurrenceType, description: string, photo?: string) => void;
  onApproveUser: (userId: string, approve: boolean) => void;
  onDeleteUser: (userId: string) => void;
  onChangePassword: (userId: string, newPassword: string) => void;
  onUpdateSystemRole: (userId: string, systemRole: SystemRole) => void;
  currentUser?: User | null;
}

export const AuditView: React.FC<AuditViewProps> = ({ 
  loads, 
  users, 
  logs, 
  onUpdateOccurrence, 
  onApproveUser,
  onDeleteUser,
  onChangePassword,
  onUpdateSystemRole,
  currentUser
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'audit' | 'users' | 'logs'>('audit');
  
  const isAdmin = currentUser?.systemRole === 'administrator';

  useEffect(() => {
    if (!isAdmin && activeSubTab !== 'audit') {
      setActiveSubTab('audit');
    }
  }, [isAdmin, activeSubTab]);
  const [selectedLoadId, setSelectedLoadId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'split' | 'side-panel'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cargaRadarAuditViewMode');
      if (saved === 'split' || saved === 'side-panel') return saved;
    }
    return 'split';
  });

  const handleSetViewMode = (mode: 'split' | 'side-panel') => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cargaRadarAuditViewMode', mode);
    }
  };
  const [occType, setOccType] = useState<OccurrenceType>(OccurrenceType.NONE);
  const [customOccType, setCustomOccType] = useState('');
  const [occDescription, setOccDescription] = useState('');
  const [occPhoto, setOccPhoto] = useState<string[]>([]);
  const [sealInput, setSealInput] = useState('');
  const [saveFeedback, setSaveFeedback] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // User Filtering States and Selector
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('ALL');

  const filteredUsers = useMemo(() => {
    const q = userSearchQuery.toLowerCase().trim();
    return users.filter(user => {
      // Role filter
      if (userRoleFilter !== 'ALL' && user.role !== userRoleFilter) {
        return false;
      }
      // Status filter
      if (userStatusFilter !== 'ALL' && user.status !== userStatusFilter) {
        return false;
      }
      // Search query filter (matches username, fullName, storeLocation, jobFunction)
      if (q) {
        const usernameMatch = (user.username || '').toLowerCase().includes(q);
        const fullNameMatch = (user.fullName || '').toLowerCase().includes(q);
        const storeMatch = (user.storeLocation || '').toLowerCase().includes(q);
        const jobMatch = (user.jobFunction || '').toLowerCase().includes(q);
        return usernameMatch || fullNameMatch || storeMatch || jobMatch;
      }
      return true;
    });
  }, [users, userSearchQuery, userRoleFilter, userStatusFilter]);

  // Load Filtering States
  const [loadSearchQuery, setLoadSearchQuery] = useState('');
  const [loadAuditFilter, setLoadAuditFilter] = useState<'ALL' | 'PENDING' | 'AUDITED'>('ALL');
  const [loadStatusFilter, setLoadStatusFilter] = useState<string>('ALL');
  const [loadOccurrenceFilter, setLoadOccurrenceFilter] = useState<'ALL' | 'WITH_OCCURRENCE' | 'WITHOUT_OCCURRENCE'>('ALL');
  const [loadStartDate, setLoadStartDate] = useState<string>('');
  const [loadEndDate, setLoadEndDate] = useState<string>('');

  const filteredLoads = useMemo(() => {
    const q = loadSearchQuery.toLowerCase().trim();
    return loads.filter(load => {
      // Search Box: match plate, driverName, or sealNumber, origin, destination
      if (q) {
        const plateMatch = (load.plate || '').toLowerCase().includes(q);
        const driverMatch = (load.driverName || '').toLowerCase().includes(q);
        const sealMatch = (load.sealNumber || '').toLowerCase().includes(q);
        const originMatch = (load.origin || '').toLowerCase().includes(q);
        const destMatch = (load.destination || '').toLowerCase().includes(q);
        
        if (!plateMatch && !driverMatch && !sealMatch && !originMatch && !destMatch) {
          return false;
        }
      }

      // Audit status filter
      if (loadAuditFilter === 'PENDING' && load.auditedAt) {
        return false;
      }
      if (loadAuditFilter === 'AUDITED' && !load.auditedAt) {
        return false;
      }

      // Cargo status filter
      if (loadStatusFilter !== 'ALL' && load.status !== loadStatusFilter) {
        return false;
      }

      // Occurrence filter
      const hasOccurrence = (load.occurrenceType && load.occurrenceType !== OccurrenceType.NONE) || load.occurrencePhoto;
      if (loadOccurrenceFilter === 'WITH_OCCURRENCE' && !hasOccurrence) {
        return false;
      }
      if (loadOccurrenceFilter === 'WITHOUT_OCCURRENCE' && hasOccurrence) {
        return false;
      }

      // Date start filter limit check
      if (loadStartDate) {
        const loadDate = new Date(load.createdAt);
        const startDate = new Date(loadStartDate + 'T00:00:00');
        if (loadDate < startDate) return false;
      }

      // Date end filter limit check
      if (loadEndDate) {
        const loadDate = new Date(load.createdAt);
        const endDate = new Date(loadEndDate + 'T23:59:59');
        if (loadDate > endDate) return false;
      }

      return true;
    });
  }, [loads, loadSearchQuery, loadAuditFilter, loadStatusFilter, loadOccurrenceFilter, loadStartDate, loadEndDate]);

  // Dashboard Calculations for Audit View
  const [showDashboard, setShowDashboard] = useState(true);

  const localYMDOfStr = (dateString: string) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '';
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  // 1. Blocked loads in last 24 hours (with actual status BLOCKED or blocked-related occurrences)
  const blockedLast24Hours = useMemo(() => {
    const limit24h = Date.now() - 24 * 60 * 60 * 1000;
    return loads.filter(load => {
      const isBlocked = load.status === CargoStatus.BLOCKED;
      const loadTime = new Date(load.createdAt).getTime();
      return isBlocked && loadTime >= limit24h;
    });
  }, [loads]);

  // 2. Average release time of loads
  const averageReleaseTimeMinutes = useMemo(() => {
    let totalsMs = 0;
    let count = 0;
    
    loads.forEach(load => {
      if (load.auditedAt) {
        const start = new Date(load.createdAt).getTime();
        const end = new Date(load.auditedAt).getTime();
        const diff = end - start;
        if (diff >= 0 && diff < 48 * 60 * 60 * 1000) { // filter extreme outlier durations > 48h for realistic average
          totalsMs += diff;
          count++;
        }
      }
    });

    if (count === 0) return 0;
    return Math.round(totalsMs / (count * 60000)); // returns in minutes
  }, [loads]);

  // Format Average Release Time beautifully (e.g. 45 min, or 2h 15m)
  const formattedAverageReleaseTime = useMemo(() => {
    const t = averageReleaseTimeMinutes;
    if (t === 0) return '---';
    if (t < 60) {
      return `${t} min`;
    }
    const hrs = Math.floor(t / 60);
    const mins = t % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  }, [averageReleaseTimeMinutes]);

  // 3. Trends of Average Release Time per day (Last 7 days)
  const releaseTimeTrendData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }).reverse();

    return days.map(day => {
      const dayLoads = loads.filter(l => l.auditedAt && localYMDOfStr(l.auditedAt) === day);
      
      let sumMin = 0;
      let count = 0;

      dayLoads.forEach(l => {
        const diff = new Date(l.auditedAt!).getTime() - new Date(l.createdAt).getTime();
        const min = diff / 60000;
        if (min >= 0 && min < 48 * 60 * 60 * 1000) {
          sumMin += min;
          count++;
        }
      });

      const avg = count > 0 ? Math.round(sumMin / count) : 0;
      
      const parts = day.split('-');
      const dispLabel = `${parts[2]}/${parts[1]}`;

      return {
        date: dispLabel,
        "Tempo (min)": avg,
        "Cargas": count
      };
    });
  }, [loads]);

  // 4. Status distribution of loads loaded/edited in last 24h
  const last24hDistributionData = useMemo(() => {
    const limit24h = Date.now() - 24 * 60 * 60 * 1000;
    const last24h = loads.filter(l => new Date(l.createdAt).getTime() >= limit24h);

    const awaiting = last24h.filter(l => l.status === CargoStatus.AWAITING).length;
    const released = last24h.filter(l => l.status === CargoStatus.RELEASED).length;
    const blocked = last24h.filter(l => l.status === CargoStatus.BLOCKED).length;

    return [
      { name: 'Aguardando', value: awaiting, color: '#f59e0b' },
      { name: 'Em Trânsito', value: released, color: '#10b981' },
      { name: 'Bloqueadas', value: blocked, color: '#ef4444' }
    ].filter(item => item.value > 0);
  }, [loads]);

  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<User | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Email Alert Configuration System
  const [alertEmails, setAlertEmails] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('occurrenceAlertEmails');
      return saved ? JSON.parse(saved) : [
        'central.monitoramento@atacadaodiaadia.com.br',
        'prevencao.perdas@atacadaodiaadia.com.br'
      ];
    } catch {
      return [
        'central.monitoramento@atacadaodiaadia.com.br',
        'prevencao.perdas@atacadaodiaadia.com.br'
      ];
    }
  });

  const [autoEmailEnabled, setAutoEmailEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('autoEmailEnabled');
    return saved !== 'false'; // default is true
  });

  const [newEmailInput, setNewEmailInput] = useState<string>('');
  const [emailActionFeedback, setEmailActionFeedback] = useState<string | null>(null);
  const [lastSentNotification, setLastSentNotification] = useState<{
    success: boolean;
    timestamp: string;
    targetEmails: string[];
    occurrenceDetails: string;
    originEmail?: string;
  } | null>(null);

  // Synchronize alert email list from Firestore
  useEffect(() => {
    try {
      const docRef = doc(db, 'settings', 'occurrence_alert');
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data.emails)) {
            setAlertEmails(data.emails);
            localStorage.setItem('occurrenceAlertEmails', JSON.stringify(data.emails));
          }
          if (typeof data.autoEmailEnabled === 'boolean') {
            setAutoEmailEnabled(data.autoEmailEnabled);
            localStorage.setItem('autoEmailEnabled', String(data.autoEmailEnabled));
          }
        }
      }, (err) => {
        console.warn("Firestore listener warning on settings/occurrence_alert:", err);
      });
      return unsubscribe;
    } catch (err) {
      console.warn("Could not synchronize email alert settings in real time from Firestore:", err);
    }
  }, []);

  const handleAddEmail = async () => {
    const trimmed = newEmailInput.trim().toLowerCase();
    if (!trimmed) return;
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setError('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    if (alertEmails.includes(trimmed)) {
      setError('Este e-mail já está cadastrado para alertas.');
      return;
    }

    const updatedEmails = [...alertEmails, trimmed];
    setAlertEmails(updatedEmails);
    localStorage.setItem('occurrenceAlertEmails', JSON.stringify(updatedEmails));
    setNewEmailInput('');
    setEmailActionFeedback('E-mail cadastrado com sucesso!');
    setTimeout(() => setEmailActionFeedback(null), 3000);

    // Save to Firestore
    try {
      await setDoc(doc(db, 'settings', 'occurrence_alert'), {
        emails: updatedEmails,
        autoEmailEnabled
      }, { merge: true });
    } catch (err) {
      console.warn('Could not save email registry to Firestore:', err);
    }
  };

  const handleRemoveEmail = async (emailToRemove: string) => {
    const updatedEmails = alertEmails.filter(e => e !== emailToRemove);
    setAlertEmails(updatedEmails);
    localStorage.setItem('occurrenceAlertEmails', JSON.stringify(updatedEmails));
    setEmailActionFeedback('E-mail removido com sucesso!');
    setTimeout(() => setEmailActionFeedback(null), 3000);

    // Save to Firestore
    try {
      await setDoc(doc(db, 'settings', 'occurrence_alert'), {
        emails: updatedEmails,
        autoEmailEnabled
      }, { merge: true });
    } catch (err) {
      console.warn('Could not update email registry in Firestore:', err);
    }
  };

  const handleToggleAutoEmail = async (checked: boolean) => {
    setAutoEmailEnabled(checked);
    localStorage.setItem('autoEmailEnabled', String(checked));
    
    // Save to Firestore
    try {
      await setDoc(doc(db, 'settings', 'occurrence_alert'), {
        emails: alertEmails,
        autoEmailEnabled: checked
      }, { merge: true });
    } catch (err) {
      console.warn('Could not update toggle flag in Firestore:', err);
    }
  };

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);

  // State for filtering logs
  const [logStartDate, setLogStartDate] = useState<string>('');
  const [logEndDate, setLogEndDate] = useState<string>('');
  const [logActionFilter, setLogActionFilter] = useState<string>('all');
  const [logUserFilter, setLogUserFilter] = useState<string>('all');
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');

  // Extract unique users and action types dynamically from the raw logs database
  const uniqueLogUsers = Array.from(new Set(logs.map(l => l.username).filter(Boolean).sort())) as string[];
  const uniqueLogActions = Array.from(new Set(logs.map(l => l.action).filter(Boolean).sort())) as string[];

  // Apply sequential multi-criteria filtering to global log tracking system
  const filteredLogs = logs.filter(log => {
    // 1. Start Date cutoff check
    if (logStartDate) {
      const logDate = new Date(log.timestamp);
      const startDate = new Date(logStartDate + 'T00:00:00');
      if (logDate < startDate) return false;
    }
    // 2. End Date cutoff check
    if (logEndDate) {
      const logDate = new Date(log.timestamp);
      const endDate = new Date(logEndDate + 'T23:59:59');
      if (logDate > endDate) return false;
    }

    // 3. Action Type matching check
    if (logActionFilter !== 'all' && log.action !== logActionFilter) {
      return false;
    }

    // 4. Per-User tracking check
    if (logUserFilter !== 'all' && log.username !== logUserFilter) {
      return false;
    }

    // 5. Raw text/details match query (plates, descriptors, etc)
    if (logSearchQuery.trim()) {
      const query = logSearchQuery.toLowerCase();
      const detailsMatch = (log.details || '').toLowerCase().includes(query) || 
                           (log.action || '').toLowerCase().includes(query) || 
                           (log.username || '').toLowerCase().includes(query);
      if (!detailsMatch) return false;
    }

    return true;
  });

  const selectedLoad = loads.find(l => l.id === selectedLoadId);

  const handleSaveOccurrence = async () => {
    if (selectedLoad) {
      // Basic validation: if occurrence is selected, seal input must not be empty
      if (occType !== OccurrenceType.NONE && !sealInput) {
        setError('Por favor, confirme o número do lacre antes de salvar.');
        return;
      }

      // If OTHER is selected, text field is required
      if (occType === OccurrenceType.OTHER && !customOccType.trim()) {
        setError('Por favor, especifique a ocorrência no campo de texto.');
        return;
      }

      // Description validation for specific types
      const requiresDescription = [
        OccurrenceType.SEAL_DISCREPANCY,
        OccurrenceType.CARGO_EXCHANGE,
        OccurrenceType.SEAL_TAMPERED
      ].includes(occType);

      if (requiresDescription && !occDescription.trim()) {
        setError('Para este tipo de ocorrência, a descrição detalhada é obrigatória.');
        return;
      }

      // If there is any selected occurrence type, it must match the original seal
      if (occType !== OccurrenceType.NONE && 
          sealInput !== selectedLoad.sealNumber) {
        setError('O lacre digitado não confere com o manifesto. Verifique os dados.');
        return;
      }

      const finalOccType = occType === OccurrenceType.OTHER 
        ? (customOccType.trim() as OccurrenceType) 
        : occType;

      onUpdateOccurrence(selectedLoad.id, finalOccType, occDescription, occPhoto.length > 0 ? occPhoto : undefined);
      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 3000);

      // Envia alerta de e-mail de imediato se habilitado
      if (autoEmailEnabled && alertEmails.length > 0) {
        const timestampStr = new Date().toLocaleString('pt-BR');
        
        // Vincula usuários de auditoria e administradores ao e-mail de origem especificado
        const isAuditorOrAdmin = currentUser?.role === 'audit' || 
                                 currentUser?.systemRole === 'administrator' || 
                                 currentUser?.systemRole === 'auditor';
        const originEmail = isAuditorOrAdmin 
          ? 'central.monitoramento@atacadaodiaadia.com.br' 
          : `${(currentUser?.username || 'sistema').toLowerCase()}@cargarelease.com`;

        setLastSentNotification({
          success: true,
          timestamp: timestampStr,
          targetEmails: [...alertEmails],
          occurrenceDetails: `${finalOccType} - ${occDescription || 'Sem observações adicionais'}`,
          originEmail: originEmail
        });

        // O envio real à API SendGrid foi movido para o controlador central de estado no App (onUpdateOccurrence) para centralizar todos os alertas de bloqueio de forma automatizada.
        console.log('Notificação de e-mail automática delegada ao gerenciador central de estado.');

        // Tenta tocar uma notificação discreta (chime de envio de alerta)
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            osc.start();
            osc.stop(ctx.currentTime + 0.15);
          }
        } catch (e) {
          console.log('Audio notification fallback:', e);
        }

        // Registrar no Firestore um log específico de retransmissão de alerta
        try {
          const logId = `alert-mail-${Date.now()}`;
          const mailLogsRef = doc(db, 'logs', logId);
          await setDoc(mailLogsRef, {
            id: logId,
            action: 'Alerta de E-mail de Ocorrência',
            details: `Relatório para carga ${selectedLoad.plate} enviado para: ${alertEmails.join(', ')}`,
            username: currentUser?.username || 'Sistema',
            senderEmail: originEmail,
            timestamp: new Date().toISOString(),
            loadId: selectedLoad.id
          }, { merge: true });
        } catch (err) {
          console.warn('Could not record email alert log in Firestore:', err);
        }
      }
    }
  };

  // Keyboard shortcut listener for global quick save (Ctrl + S)
  useEffect(() => {
    const handleShortcutSave = () => {
      if (!selectedLoad) return;
      
      const isDisabled = (occType !== OccurrenceType.NONE && (
        !sealInput || 
        sealInput !== selectedLoad.sealNumber
      )) ||
      ([OccurrenceType.SEAL_DISCREPANCY, OccurrenceType.CARGO_EXCHANGE, OccurrenceType.SEAL_TAMPERED].includes(occType) && !occDescription.trim()) ||
      (occType === OccurrenceType.OTHER && !customOccType.trim());

      if (!isDisabled) {
        handleSaveOccurrence();
      }
    };

    window.addEventListener('shortcut-save', handleShortcutSave);
    return () => {
      window.removeEventListener('shortcut-save', handleShortcutSave);
    };
  }, [selectedLoad, occType, sealInput, occDescription, customOccType, handleSaveOccurrence]);

  const handleSelectLoad = (id: string) => {
    const load = loads.find(l => l.id === id);
    setSelectedLoadId(id);
    if (load) {
      const dbType = load.occurrenceType || OccurrenceType.NONE;
      const isStandard = Object.values(OccurrenceType).includes(dbType);

      if (dbType !== OccurrenceType.NONE && !isStandard) {
        setOccType(OccurrenceType.OTHER);
        setCustomOccType(dbType);
      } else {
        setOccType(dbType);
        setCustomOccType('');
      }

      setOccDescription(load.occurrenceDescription || '');
      setOccPhoto(getPhotosArray(load.occurrencePhoto));
      setSealInput('');
    }
    setSaveFeedback(false);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const remainingSlots = 10 - occPhoto.length;
      const filesToProcess = Array.from(files).slice(0, remainingSlots) as File[];
      
      filesToProcess.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const rawBase64 = reader.result as string;
          const compressed = await compressImage(rawBase64);
          setOccPhoto(prev => {
            if (prev.length >= 10) return prev;
            return [...prev, compressed];
          });
        };
        reader.readAsDataURL(file);
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removePhoto = (idx: number) => {
    setOccPhoto(prev => prev.filter((_, i) => i !== idx));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const pendingUsers = users.filter(u => u.status === 'pending');

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.text('Event Log Report - CargaRadar', 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    
    let subtitle = `Relatório gerado em: ${new Date().toLocaleString('pt-BR')}`;
    const applied = [];
    if (logStartDate) applied.push(`Início: ${new Date(logStartDate).toLocaleDateString('pt-BR')}`);
    if (logEndDate) applied.push(`Fim: ${new Date(logEndDate).toLocaleDateString('pt-BR')}`);
    if (logActionFilter !== 'all') applied.push(`Ação: ${logActionFilter}`);
    if (logUserFilter !== 'all') applied.push(`Usuário: ${logUserFilter}`);
    if (logSearchQuery.trim()) applied.push(`Termo: "${logSearchQuery}"`);
    
    if (applied.length > 0) {
      subtitle += ` | Filtros: ${applied.join(', ')}`;
    }
    doc.text(subtitle, 14, 30);
    
    // Table
    const tableData = filteredLogs.map(log => [
      new Date(log.timestamp).toLocaleString('pt-BR'),
      log.username,
      log.action,
      log.details
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['Timestamp', 'Username', 'Action', 'Details']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42] }, // slate-900
      styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 30 },
        2: { cellWidth: 40 },
        3: { cellWidth: 'auto' }
      }
    });

    doc.save(`event-logs-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportLoadAuditToPDF = (load: CargoLoad) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth(); // 210
    const pageHeight = doc.internal.pageSize.getHeight(); // 297
    const margin = 15;
    let currentY = 20;

    // Helper functions to check page overflow and add a page if necessary
    const checkSpace = (neededHeight: number) => {
      if (currentY + neededHeight > pageHeight - margin - 15) {
        doc.addPage();
        currentY = 20;
      }
    };

    // --- PAGE 1 INIT ---
    // Top banner - Slate-900 with clear borders and professional alignment
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(margin, currentY, pageWidth - 2 * margin, 26, 'F');

    // Accent line (Amber / Gold)
    doc.setFillColor(217, 119, 6); // primary-gold / amber-600
    doc.rect(margin, currentY + 24.5, pageWidth - 2 * margin, 1.5, 'F');

    // Title inside dark banner
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('RELATÓRIO DE AUDITORIA E OCORRÊNCIAS', margin + 8, currentY + 10);
    
    // Sub-banner subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(191, 219, 254); // blue-200
    doc.text('Sistema de Prevenção de Perdas e Gestão de Portaria - CargaRadar', margin + 8, currentY + 16);
    
    // Header timestamp
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth - margin - 8, currentY + 10, { align: 'right' });

    currentY += 34;

    // --- 1. METADADOS E INFORMAÇÕES DO VEÍCULO ---
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('1. DADOS DO REGISTRO E VEÍCULO', margin, currentY);
    currentY += 5;

    const metaBody: any[][] = [
      [
        { content: 'Placa Veículo:', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
        { content: load.plate, styles: { fontStyle: 'bold', textColor: [15, 23, 42] } },
        { content: 'Lacre Original:', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
        { content: load.sealNumber, styles: { fontStyle: 'bold', textColor: [180, 83, 9] } } // amber-700
      ],
      [
        { content: 'Motorista:', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
        { content: load.driverName, styles: { textColor: [51, 65, 85] } },
        { content: 'Status Atual:', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
        { content: load.status, styles: { fontStyle: 'bold', textColor: load.status === CargoStatus.RELEASED ? [16, 122, 87] : [220, 38, 38] } }
      ],
      [
        { content: 'Origem (CD):', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
        { content: load.origin, styles: { textColor: [51, 65, 85] } },
        { content: 'Destino Principal:', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
        { content: load.destination, styles: { textColor: [51, 65, 85] } }
      ],
      [
        { content: 'Tipo de Carga:', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
        { content: load.cargoType, styles: { textColor: [51, 65, 85] } },
        { content: 'Total de Paletes:', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
        { content: `${load.palletCount} un`, styles: { textColor: [51, 65, 85] } }
      ],
      [
        { content: 'Manifesto ID:', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
        { content: load.id.toUpperCase(), styles: { textColor: [71, 85, 105], fontSize: 7 } },
        { content: 'Criado Em:', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
        { content: new Date(load.createdAt).toLocaleString('pt-BR'), styles: { textColor: [51, 65, 85] } }
      ]
    ];

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      body: metaBody,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2.5, halign: 'left', valign: 'middle' },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 55 },
        2: { cellWidth: 35 },
        3: { cellWidth: 'auto' }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 9;

    // --- 2. CLASSIFICAÇÃO DETALHADA DE PALETES ---
    if (load.palletDetails && load.palletDetails.length > 0) {
      checkSpace(30);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text('2. CLASSIFICAÇÃO DETALHADA DE PALETES', margin, currentY);
      currentY += 5;

      const palletTableData = load.palletDetails.map(p => [
        p.type,
        `${p.quantity} un`,
        p.destination || 'Unidade Principal'
      ]);

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['Tipo de Palete', 'Quantidade', 'Destino Especificado']],
        body: palletTableData,
        theme: 'striped',
        headStyles: { fillColor: [51, 65, 85] }, // slate-700
        styles: { fontSize: 8, cellPadding: 2.5 }
      });
      currentY = (doc as any).lastAutoTable.finalY + 9;
    }

    // --- HIGH RISK ALERTS (CARGA PAR) ---
    if (load.isHighRisk) {
      checkSpace(34);
      doc.setFillColor(254, 242, 242); // bg-red-50
      doc.setDrawColor(252, 165, 165); // border-red-300
      doc.setLineWidth(0.4);
      doc.rect(margin, currentY, pageWidth - 2 * margin, 26, 'FD');

      // Draw danger icon / warning
      doc.setTextColor(220, 38, 38); // text-red-600
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('ALERTA DE SEGURANÇA: CONTROLE DE CARGA PAR (RISCO EXCEPCIONAL)', margin + 6, currentY + 6);

      doc.setTextColor(127, 29, 29); // text-red-900
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Produto Classificado: ${load.parType || 'Item PAR'}`, margin + 6, currentY + 12);
      doc.text(`Nota Fiscal Vinculada: ${load.parInvoiceNumber || 'N/A'}`, margin + 6, currentY + 17);
      
      const descText = load.parDescription ? `Obs: ${load.parDescription}` : 'Revisão redobrada no gate para lacre e integridade física das portas.';
      const chunkedDesc = doc.splitTextToSize(descText, pageWidth - 2 * margin - 12);
      doc.text(chunkedDesc, margin + 6, currentY + 22);

      currentY += 32;
    }

    // --- HISTÓRICO DE OCORRÊNCIAS & AUDITORIAS ---
    checkSpace(22);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('3. REGISTROS DE OCORRÊNCIAS E AUDITORIA DE PORTARIA', margin, currentY);
    currentY += 6;

    const occurrences = load.occurrenceHistory && load.occurrenceHistory.length > 0 
      ? load.occurrenceHistory 
      : (load.occurrenceType && load.occurrenceType !== OccurrenceType.NONE 
          ? [{
              type: load.occurrenceType,
              description: load.occurrenceDescription || 'Sem detalhes.',
              photo: load.occurrencePhoto,
              auditor: load.createdBy || 'Central Monitoramento',
              timestamp: load.auditedAt || load.createdAt
            }]
          : []);

    if (occurrences.length === 0) {
      doc.setFillColor(240, 253, 250); // bg-teal-50
      doc.setDrawColor(204, 251, 241); // border-teal-200
      doc.rect(margin, currentY, pageWidth - 2 * margin, 14, 'FD');
      
      doc.setTextColor(13, 148, 136); // teal-600
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('✓ STATUS DE GATE COMPLETAMENTE LIBERADO - NENHUMA OCORRÊNCIA ENCONTRADA', margin + 6, currentY + 6);
      doc.setTextColor(20, 110, 100);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text('Todas as conformidades técnicas e de quantidade foram atendidas sem irregularidades durante a passagem.', margin + 6, currentY + 11.5);
      
      currentY += 21;
    } else {
      occurrences.forEach((occ, index) => {
        const isNormal = occ.type === OccurrenceType.NONE;
        const typeStr = `Auditoria #${index + 1} - [Status: ${occ.type}]`;
        const auditorStr = `Auditor: ${occ.auditor}  |  Data/Hora: ${new Date(occ.timestamp).toLocaleString('pt-BR')}`;
        const descText = occ.description || 'Auditor Gate Liberado - Nenhuma ocorrência identificada.';
        
        // Wrap description text to page width
        const lines = doc.splitTextToSize(descText, pageWidth - 2 * margin - 14);
        const textHeight = lines.length * 4.5;
        
        const photoHeight = occ.photo ? 56 : 0;
        const totalOccHeight = 22 + textHeight + photoHeight;

        checkSpace(totalOccHeight + 5);

        // Render card border backer
        doc.setFillColor(250, 250, 250); // bg-zinc-50
        doc.setDrawColor(228, 228, 231); // border-zinc-200
        doc.setLineWidth(0.3);
        doc.rect(margin, currentY, pageWidth - 2 * margin, totalOccHeight - 4, 'FD');

        // Card side bar color indicator
        doc.setFillColor(isNormal ? 16 : 220, isNormal ? 185 : 38, isNormal ? 129 : 38); // emerald or red
        doc.rect(margin, currentY, 3, totalOccHeight - 4, 'F');

        // Draw header info inside card
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.text(typeStr, margin + 8, currentY + 6.5);

        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text(auditorStr, margin + 8, currentY + 11.5);
        
        // Draw line separator
        doc.setDrawColor(228, 228, 231);
        doc.line(margin + 8, currentY + 14.5, pageWidth - margin - 8, currentY + 14.5);

        // Description text
        doc.setTextColor(63, 63, 70); // zinc-700
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.2);
        doc.text(lines, margin + 8, currentY + 19.5);

        // Image evidence
        if (occ.photo) {
          try {
            const pArray = getPhotosArray(occ.photo);
            if (pArray.length > 0) {
              const firstPhoto = pArray[0];
              const imgX = margin + 8;
              const imgY = currentY + 19.5 + textHeight + 2;
              const imgW = 85;
              const imgH = 50;
              
              // Render photo placeholder or background border
              doc.setFillColor(244, 244, 245);
              doc.rect(imgX, imgY, imgW, imgH, 'F');
              doc.setDrawColor(212, 212, 216);
              doc.rect(imgX, imgY, imgW, imgH, 'D');

              // Find correct image type dynamically
              let imgFormat = 'JPEG';
              if (firstPhoto.includes('image/png')) imgFormat = 'PNG';
              if (firstPhoto.includes('image/webp')) imgFormat = 'WEBP';

              // Draw Base64 image
              doc.addImage(firstPhoto, imgFormat, imgX + 1, imgY + 1, imgW - 2, imgH - 2);

              // Print Label below the photo
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(6.5);
              doc.setTextColor(113, 113, 122);
              doc.text('[ANEXO DE AUDITORIA] REGISTRO FOTOGRÁFICO DE EVIDÊNCIA DE GATE', imgX, imgY + imgH + 4);
            }
          } catch (err) {
            console.error("PDF image adding error:", err);
            doc.setTextColor(220, 38, 38);
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(8);
            doc.text('[Mídia fotográfica anexada no registro - Erro ao carregar no PDF]', margin + 8, currentY + 19.5 + textHeight + 6);
          }
        }

        currentY += totalOccHeight + 3;
      });
    }

    // --- SEÇÃO DE ASSINATURA ---
    checkSpace(35);
    currentY += 10;
    
    // Draw visual outline/box for signature
    doc.setDrawColor(228, 228, 231);
    doc.setLineWidth(0.3);
    doc.setLineDashPattern([2, 2], 0);
    
    const sigLineY = currentY + 18;
    const boxW = 80;
    
    // Left Box for Auditor Signature
    doc.line(margin + 10, sigLineY, margin + 10 + boxW, sigLineY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('AUDITOR DE PORTARIA RESPONSÁVEL', margin + 10 + (boxW / 2), sigLineY + 4.5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(113, 113, 122);
    doc.text(`Matrícula / Assinatura Eletrônica ativa`, margin + 10 + (boxW / 2), sigLineY + 8.5, { align: 'center' });

    // Right Box for Driver Signature 
    doc.line(pageWidth - margin - 10 - boxW, sigLineY, pageWidth - margin - 10, sigLineY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('DOCUMENTAÇÃO E CONDUTOR DO VEÍCULO', pageWidth - margin - 10 - (boxW / 2), sigLineY + 4.5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(113, 113, 122);
    doc.text(`${load.driverName || 'Motorista'}`, pageWidth - margin - 10 - (boxW / 2), sigLineY + 8.5, { align: 'center' });

    // Reset dash pattern
    doc.setLineDashPattern([], 0);

    // Apply header & footer decoration, page numbering dynamically using full layout loops
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Footer signature and layout
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 16, pageWidth - margin, pageHeight - 16);
      
      doc.setTextColor(148, 163, 184); // slate-400
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(`Documento emitido eletronicamente pela Central de Auditoria - Rede Atacadão Dia a Dia. Atividades atestadas sob ID ${load.id.slice(0, 8).toUpperCase()}`, margin, pageHeight - 11);
      
      // Right Page counter
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 18, pageHeight - 11, { align: 'right' });

      // If page > 1, draw a running mini-header
      if (i > 1) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105); // slate-600
        doc.text(`RELATÓRIO DE AUDITORIA DE CARGA | PLACA: ${load.plate}`, margin, 12);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(`Manifesto: ${load.id.toUpperCase()}`, pageWidth - margin, 12, { align: 'right' });
        
        doc.setDrawColor(241, 245, 249);
        doc.line(margin, 14, pageWidth - margin, 14);
      }
    }

    // Save PDF
    doc.save(`relatorio-auditoria-${load.plate}-${load.id.slice(0, 8).toUpperCase()}.pdf`);
  };

  return (
    <div className="space-y-6 relative">
      {/* Error Message Overlay */}
      {error && (
        <div className="fixed top-4 right-4 z-[100] bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          <p className="text-sm font-black uppercase tracking-tight">{error}</p>
          <button onClick={() => setError(null)} className="ml-4 p-1 hover:bg-white/20 rounded-full">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDeleteUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Confirmar Exclusão</h3>
            <p className="text-slate-500 font-medium mb-8">
              Tem certeza que deseja excluir o usuário <span className="font-black text-slate-900">{confirmDeleteUser.username}</span>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmDeleteUser(null)}
                className="flex-1 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  onDeleteUser(confirmDeleteUser.id);
                  setConfirmDeleteUser(null);
                }}
                className="flex-1 px-6 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-200"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zoom Image Modal */}
      {modalImage && (
        <div 
          onClick={() => setModalImage(null)}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-350 cursor-zoom-out"
        >
          <div 
            className="relative max-w-4xl w-full max-h-[85vh] bg-slate-900 rounded-3xl overflow-hidden p-2 flex flex-col shadow-2xl animate-in zoom-in-95 duration-250 cursor-default" 
            onClick={(e) => e.stopPropagation()}
          >
            <img src={modalImage} alt="Evidência Ampliada" className="w-full h-auto max-h-[72vh] object-contain rounded-2xl mx-auto" />
            <div className="p-4 flex justify-between items-center text-white">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Camera className="w-4 h-4 text-primary-gold" />
                Evidência Fotográfica de Auditoria
              </span>
              <button 
                onClick={() => setModalImage(null)}
                className="bg-white/10 hover:bg-white/20 text-white rounded-xl p-2 px-3 text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
              >
                <X className="w-4 h-4" />
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Etapa 3: Auditoria & Gestão</h2>
          <p className="text-slate-500 font-medium">Controle de gate, gestão de usuários e log de eventos do sistema.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button 
            onClick={() => setActiveSubTab('audit')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${activeSubTab === 'audit' ? 'bg-white shadow-sm text-primary-gold' : 'text-slate-500 hover:text-slate-700'}`}
          >
            AUDITORIA
          </button>
          {isAdmin && (
            <button 
              onClick={() => setActiveSubTab('users')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${activeSubTab === 'users' ? 'bg-white shadow-sm text-primary-navy' : 'text-slate-500 hover:text-slate-700'}`}
            >
              USUÁRIOS
              {pendingUsers.length > 0 && <span className="w-2 h-2 bg-primary-red rounded-full animate-pulse"></span>}
            </button>
          )}
          {isAdmin && (
            <button 
              onClick={() => setActiveSubTab('logs')}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${activeSubTab === 'logs' ? 'bg-white shadow-sm text-primary-navy' : 'text-slate-500 hover:text-slate-700'}`}
            >
              LOGS
            </button>
          )}
        </div>
      </div>

      {activeSubTab === 'audit' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* List of released loads for audit */}
          <div className={`${viewMode === 'split' ? 'lg:col-span-4' : 'lg:col-span-12'} bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[750px] transition-all duration-300`}>
            <div className="p-5 border-b bg-slate-50/50 rounded-t-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-700">Histórico de Cargas</h3>
                <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Controle de Gate</p>
              </div>
              
              <div className="flex items-center gap-3 shrink-0">
                <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 gap-1 shadow-inner">
                  <button
                    onClick={() => handleSetViewMode('split')}
                    className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 cursor-pointer border-0 ${
                      viewMode === 'split'
                        ? 'bg-primary-gold text-white shadow-md shadow-amber-500/10'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                    }`}
                    title="Layout Dividido (Lado a Lado)"
                  >
                    <Columns className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Dividido</span>
                  </button>
                  <button
                    onClick={() => handleSetViewMode('side-panel')}
                    className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 cursor-pointer border-0 ${
                      viewMode === 'side-panel'
                        ? 'bg-primary-gold text-white shadow-md shadow-amber-500/10'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                    }`}
                    title="Layout Isolar Painel Lateral"
                  >
                    <PanelRight className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Painel Lateral</span>
                  </button>
                </div>
                <span className="text-[10px] font-black bg-primary-navy text-white px-2.5 py-1.5 rounded-lg uppercase tracking-widest shadow-sm">
                  {filteredLoads.length} / {loads.length} Cargas
                </span>
              </div>
            </div>

            {/* Sistema de Filtros de Auditoria */}
            <div className="bg-slate-50/70 p-4 border-b border-slate-200 flex flex-col gap-3">
              {/* Pesquisa por texto */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-400" />
                <input
                  id="load-search-query"
                  type="text"
                  placeholder="Pesquisar por Placa, Motorista, Lacre, Origem..."
                  value={loadSearchQuery}
                  onChange={(e) => setLoadSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-bold outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-primary-navy"
                />
              </div>

              {/* Filtros Dropdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[8px] font-black uppercase text-slate-400 mb-1">Status Auditoria</label>
                  <select
                    id="load-audit-filter"
                    value={loadAuditFilter}
                    onChange={(e) => setLoadAuditFilter(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-[10px] font-bold outline-none focus-visible:ring-2 focus-visible:ring-primary-navy"
                  >
                    <option value="ALL">TODAS</option>
                    <option value="PENDING">A SEREM AUDITADAS</option>
                    <option value="AUDITED">AUDITADAS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[8px] font-black uppercase text-slate-400 mb-1">Status Carga</label>
                  <select
                    id="load-status-filter"
                    value={loadStatusFilter}
                    onChange={(e) => setLoadStatusFilter(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-[10px] font-bold outline-none focus-visible:ring-2 focus-visible:ring-primary-navy"
                  >
                    <option value="ALL">TODOS OS STATUS</option>
                    <option value="AWAITING">AGUARDANDO</option>
                    <option value="RELEASED">LIBERADO</option>
                    <option value="BLOCKED">BLOQUEADO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[8px] font-black uppercase text-slate-400 mb-1">Ocorrência</label>
                  <select
                    id="load-occurrence-filter"
                    value={loadOccurrenceFilter}
                    onChange={(e) => setLoadOccurrenceFilter(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-[10px] font-bold outline-none focus-visible:ring-2 focus-visible:ring-primary-navy"
                  >
                    <option value="ALL">TODAS</option>
                    <option value="WITH_OCCURRENCE">COM OCORRÊNCIA</option>
                    <option value="WITHOUT_OCCURRENCE">SEM OCORRÊNCIAS</option>
                  </select>
                </div>
              </div>

              {/* Filtro de Datas adicionado */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[8px] font-black uppercase text-slate-400 mb-1">Data Início</label>
                  <input
                    type="date"
                    id="load-start-date"
                    value={loadStartDate}
                    onChange={(e) => setLoadStartDate(e.target.value)}
                    onClick={(e) => {
                      try {
                        (e.currentTarget as any).showPicker();
                      } catch (err) {
                        console.log('showPicker not supported / failed', err);
                      }
                    }}
                    onFocus={(e) => {
                      try {
                        (e.currentTarget as any).showPicker();
                      } catch (err) {
                        console.log('showPicker failed', err);
                      }
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-[10px] font-bold outline-none focus-visible:ring-2 focus-visible:ring-primary-navy cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-black uppercase text-slate-400 mb-1">Data Fim</label>
                  <input
                    type="date"
                    id="load-end-date"
                    value={loadEndDate}
                    onChange={(e) => setLoadEndDate(e.target.value)}
                    onClick={(e) => {
                      try {
                        (e.currentTarget as any).showPicker();
                      } catch (err) {
                        console.log('showPicker not supported / failed', err);
                      }
                    }}
                    onFocus={(e) => {
                      try {
                        (e.currentTarget as any).showPicker();
                      } catch (err) {
                        console.log('showPicker failed', err);
                      }
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-[10px] font-bold outline-none focus-visible:ring-2 focus-visible:ring-primary-navy cursor-pointer"
                  />
                </div>
              </div>

              {/* Botão de limpar filtros quando algum estiver ativo */}
              {(loadSearchQuery || loadAuditFilter !== 'ALL' || loadStatusFilter !== 'ALL' || loadOccurrenceFilter !== 'ALL' || loadStartDate || loadEndDate) && (
                <div className="flex justify-between items-center bg-blue-50/50 px-2 py-1.5 rounded-lg border border-blue-100">
                  <span className="text-[9px] text-blue-800 font-bold">
                    Resultados: {filteredLoads.length} de {loads.length}
                  </span>
                  <button
                    onClick={() => {
                      setLoadSearchQuery('');
                      setLoadAuditFilter('ALL');
                      setLoadStatusFilter('ALL');
                      setLoadOccurrenceFilter('ALL');
                      setLoadStartDate('');
                      setLoadEndDate('');
                    }}
                    className="flex items-center gap-1.5 text-[8px] font-black text-rose-600 uppercase hover:text-rose-800 transition-colors border-0 bg-transparent cursor-pointer"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    Limpar Filtros
                  </button>
                </div>
              )}
            </div>

            <div className={`overflow-y-auto flex-1 p-3 ${
              viewMode === 'split' 
                ? 'space-y-3' 
                : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max align-start content-start placeholder-parent pb-16'
            }`}>
              {filteredLoads.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 italic py-12 text-center text-xs">
                  <p className="font-bold">Nenhum registro encontrado.</p>
                  <p className="text-[10px] text-slate-400 font-medium">Experimente trocar ou limpar os filtros para buscar novamente.</p>
                </div>
              ) : (
                filteredLoads.map((load) => (
                  <button
                    key={load.id}
                    onClick={() => handleSelectLoad(load.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedLoadId === load.id 
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-50' 
                        : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono font-black text-slate-800">{load.plate}</span>
                      <div className="flex gap-1">
                        {load.auditedAt && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700">
                            AUDITADO
                          </span>
                        )}
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                          load.status === CargoStatus.RELEASED ? 'bg-emerald-100 text-emerald-700' : 
                          load.status === CargoStatus.BLOCKED ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {load.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 font-medium truncate w-32">{load.driverName}</span>
                      {(load.occurrenceType && load.occurrenceType !== OccurrenceType.NONE) || load.occurrencePhoto ? (
                        <span className="text-[9px] text-red-600 font-bold flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                          Ocorrência
                        </span>
                      ) : null}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Dynamic Backdrop for Side-Panel View */}
          {viewMode === 'side-panel' && selectedLoadId && (
            <div 
              className="fixed inset-0 z-40 bg-black/45 backdrop-blur-xs transition-opacity animate-in fade-in duration-300"
              onClick={() => setSelectedLoadId(null)}
            />
          )}

          {/* Audit Form */}
          <div className={
            viewMode === 'split'
              ? 'lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[750px]'
              : selectedLoadId
                ? 'fixed inset-y-0 right-0 z-50 w-full max-w-4xl bg-white shadow-2xl flex flex-col h-full border-l border-slate-200 transition-all duration-300 animate-in slide-in-from-right'
                : 'hidden'
          }>
            <div className="flex flex-col h-full overflow-hidden bg-white">
              {viewMode === 'side-panel' && selectedLoad && (
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-primary-navy tracking-widest bg-primary-gold px-2.5 py-1 rounded">Painel de Auditoria</span>
                    <span className="text-xs font-black text-slate-800 uppercase font-mono tracking-tight">{selectedLoad.plate}</span>
                  </div>
                  <button 
                    onClick={() => setSelectedLoadId(null)}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-1 border-0"
                  >
                    <X className="w-3.5 h-3.5 text-rose-600" />
                    <span>FECHAR PAINEL</span>
                  </button>
                </div>
              )}
              {selectedLoad ? (
                <div className="p-8 space-y-8 overflow-y-auto flex-1">
                <div className="flex justify-between items-start border-b pb-6">
                  <div>
                    <h3 className="text-2xl font-black text-slate-800">{selectedLoad.plate}</h3>
                    <p className="text-sm text-slate-500">Manifesto: {selectedLoad.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">Criado por: {selectedLoad.createdBy}</p>
                    {selectedLoad.auditedAt && (
                      <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                        AUDITADO EM: {new Date(selectedLoad.auditedAt).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">Lacre Original</p>
                      <p className="text-lg font-mono font-black text-primary-gold">{selectedLoad.sealNumber}</p>
                    </div>
                    <button 
                      onClick={() => exportLoadAuditToPDF(selectedLoad)}
                      className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white text-[9px] font-extrabold px-3 py-2 rounded-xl uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer mt-1"
                      title="Exportar Relatório PDF com Histórico e Fotos de Auditoria"
                    >
                      <FileText className="w-3.5 h-3.5 text-rose-100" />
                      PDF Auditoria
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Origem</p>
                    <p className="text-sm font-bold text-slate-700">{selectedLoad.origin}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Destino Principal</p>
                    <p className="text-sm font-bold text-slate-700">{selectedLoad.destination}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Carga</p>
                    <p className="text-sm font-bold text-slate-700">{selectedLoad.cargoType}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Volume (Paletes)</p>
                    <div className="flex flex-col">
                      <p className="text-sm font-bold text-slate-700">{selectedLoad.palletCount} un</p>
                      {selectedLoad.palletDetails && selectedLoad.palletDetails.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedLoad.palletDetails.map((p, i) => (
                            <span key={i} className="text-[8px] bg-white text-slate-500 px-1 py-0.5 rounded border border-slate-200 font-black uppercase">
                              {p.quantity}x {p.type}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {selectedLoad.isHighRisk && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl space-y-3">
                    <div className="flex gap-3">
                      <div className="text-red-500 mt-0.5">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-red-700 uppercase tracking-widest">Alerta de Carga PAR</p>
                        <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-[9px] font-bold text-red-400 uppercase">Item PAR</p>
                            <p className="text-xs font-bold text-red-900">{selectedLoad.parType}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-red-400 uppercase">Nota Fiscal</p>
                            <p className="text-xs font-bold text-red-900">{selectedLoad.parInvoiceNumber}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    {selectedLoad.parDescription && (
                      <div className="pt-2 border-t border-red-200/50">
                        <p className="text-[9px] font-bold text-red-400 uppercase">Observações Adicionais</p>
                        <p className="text-xs font-medium text-red-900 leading-snug">{selectedLoad.parDescription}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-6">
                  <div className="p-6 bg-primary-navy rounded-2xl text-white">
                    <h4 className="font-bold text-primary-gold mb-6 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                      Registro de Ocorrências
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Tipo de Ocorrência</label>
                            <select 
                              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                              value={occType}
                              onChange={(e) => {
                                const val = e.target.value as OccurrenceType;
                                setOccType(val);
                                if (val !== OccurrenceType.OTHER) {
                                  setCustomOccType('');
                                }
                              }}
                            >
                              {Object.values(OccurrenceType).map(type => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                          </div>

                          {occType === OccurrenceType.OTHER && (
                            <div className="animate-in slide-in-from-top-2 duration-300">
                              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">
                                Especificar Ocorrência <span className="text-red-500">*</span>
                              </label>
                              <input 
                                type="text"
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-500"
                                placeholder="Especifique a ocorrência..."
                                value={customOccType}
                                onChange={(e) => setCustomOccType(e.target.value)}
                              />
                            </div>
                          )}

                          {occType !== OccurrenceType.NONE && (
                            <div className="animate-in slide-in-from-top-2 duration-300">
                              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">
                                Confirmação de Lacre (Digite o Lacre Encontrado)
                              </label>
                              <div className="relative">
                                <input 
                                  type="text"
                                  className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-sm font-mono font-bold outline-none transition-all ${
                                    sealInput === '' 
                                      ? 'border-slate-700' 
                                      : (sealInput === selectedLoad.sealNumber 
                                          ? 'border-emerald-500 ring-1 ring-emerald-500' 
                                          : 'border-red-500 ring-1 ring-red-500')
                                  }`}
                                  placeholder="Digite o número do lacre..."
                                  value={sealInput}
                                  onChange={(e) => setSealInput(e.target.value.toUpperCase())}
                                />
                                {sealInput !== '' && (
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {sealInput === selectedLoad.sealNumber ? (
                                      <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                                    ) : (
                                      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
                                    )}
                                  </div>
                                )}
                              </div>
                              <p className={`text-[9px] font-bold mt-1 uppercase tracking-tight ${
                                sealInput === '' ? 'text-slate-500' : (sealInput === selectedLoad.sealNumber ? 'text-emerald-400' : 'text-red-400')
                              }`}>
                                {sealInput === '' 
                                  ? 'Aguardando digitação...' 
                                  : (sealInput === selectedLoad.sealNumber 
                                      ? 'Lacre conferido com sucesso!' 
                                      : 'Atenção: Lacre não confere com o manifesto!')}
                              </p>
                              <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase">Evidência Fotográfica ({occPhoto.length}/10)</label>
                            </div>
                            <div className="flex flex-col gap-3">
                              <input 
                                type="file" 
                                multiple
                                accept="image/*" 
                                capture="environment" 
                                className="hidden" 
                                ref={fileInputRef}
                                onChange={handlePhotoChange}
                              />
                              {occPhoto.length < 10 && (
                                <button 
                                  onClick={() => fileInputRef.current?.click()}
                                  className="w-full bg-slate-800 border-2 border-dashed border-slate-700 hover:border-primary-gold hover:bg-slate-700 p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all group cursor-pointer border-0"
                                >
                                  <svg className="w-6 h-6 text-slate-500 group-hover:text-primary-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                  <span className="text-[10px] font-bold text-slate-400 group-hover:text-primary-gold">ANEXAR OU TIRAR FOTO</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 min-h-[200px] flex flex-col justify-center">
                          {occPhoto.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3">
                              {occPhoto.map((p, idx) => (
                                <div key={idx} className="relative h-28 bg-slate-900 border border-slate-700 rounded-lg overflow-hidden group">
                                  <img src={p} alt={`Evidência ${idx + 1}`} className="w-full h-full object-cover" />
                                  <button 
                                    onClick={() => removePhoto(idx)}
                                    className="absolute top-1.5 right-1.5 bg-red-650 hover:bg-red-500 p-1.5 rounded-lg text-white shadow-lg transition-all border-0 flex items-center justify-center cursor-pointer"
                                    title="Remover Foto"
                                  >
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-600 text-[10px] font-bold italic text-center">Sem visualização de mídia (anexe até 10 fotos)</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Relatório Detalhado</label>
                        <textarea 
                          className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none placeholder:text-slate-600 transition-all ${
                            [OccurrenceType.SEAL_DISCREPANCY, OccurrenceType.CARGO_EXCHANGE, OccurrenceType.SEAL_TAMPERED].includes(occType) && !occDescription.trim()
                              ? 'border-red-500/50 focus:border-red-500'
                              : 'border-slate-700'
                          }`}
                          placeholder="Descreva aqui qualquer irregularidade encontrada na auditoria do gate..."
                          value={occDescription}
                          onChange={(e) => setOccDescription(e.target.value)}
                        />
                        {[OccurrenceType.SEAL_DISCREPANCY, OccurrenceType.CARGO_EXCHANGE, OccurrenceType.SEAL_TAMPERED].includes(occType) && !occDescription.trim() && (
                          <p className="text-[10px] text-red-400 font-bold mt-1 uppercase tracking-tight animate-pulse">
                            A descrição é obrigatória para este tipo de ocorrência
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-3 pt-4">
                        <button 
                          onClick={handleSaveOccurrence}
                          disabled={
                            (occType !== OccurrenceType.NONE && (
                              !sealInput || 
                              sealInput !== selectedLoad.sealNumber
                            )) ||
                            ([OccurrenceType.SEAL_DISCREPANCY, OccurrenceType.CARGO_EXCHANGE, OccurrenceType.SEAL_TAMPERED].includes(occType) && !occDescription.trim()) ||
                            (occType === OccurrenceType.OTHER && !customOccType.trim())
                          }
                          className={`w-full font-black py-4 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                            (occType !== OccurrenceType.NONE && (
                              !sealInput || 
                              sealInput !== selectedLoad.sealNumber
                            )) ||
                            ([OccurrenceType.SEAL_DISCREPANCY, OccurrenceType.CARGO_EXCHANGE, OccurrenceType.SEAL_TAMPERED].includes(occType) && !occDescription.trim()) ||
                            (occType === OccurrenceType.OTHER && !customOccType.trim())
                            ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                            : 'bg-primary-gold hover:bg-primary-gold/90 text-white border-b-4 border-primary-navy'
                          }`}
                        >
                          SALVAR RELATÓRIO DE AUDITORIA
                        </button>
                        {saveFeedback && (
                          <p className="text-center text-emerald-400 text-xs font-bold animate-pulse">Relatório saved successfully in local and cloud records.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* COMODO / PAINEL DE RETRANSMISSÃO DE RETRANSMISSÃO DE ALERTAS POR EMAIL */}
                  <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-800 space-y-5 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between border-b pb-4">
                      <div className="flex items-center gap-2.5">
                        <span className="p-2.5 bg-primary-navy/5 text-primary-navy rounded-xl">
                          <Mail className="w-5 h-5 text-primary-gold" />
                        </span>
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-tight">Retransmissão de Alertas por E-mail</h4>
                          <p className="text-[10px] text-slate-455 font-bold uppercase tracking-wider">Mapeamento & Disparo de Ocorrências</p>
                        </div>
                      </div>
                      
                      <span className="text-[8px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded uppercase tracking-widest animate-pulse">
                        Módulo Ativo
                      </span>
                    </div>

                    {/* INTERRUPTOR PRINCIPAL / COMODO TOGGLE */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/60 rounded-xl transition-all hover:bg-slate-100/50">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-black text-slate-800 uppercase tracking-tight">Enviar alertas automaticamente</span>
                        <span className="text-[10px] text-slate-500 font-bold leading-normal">Disparar relatório imediato para os e-mails cadastrados</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleAutoEmail(!autoEmailEnabled)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${autoEmailEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${autoEmailEnabled ? 'translate-x-5' : 'translate-x-0'}`}
                        />
                      </button>
                    </div>

                    {/* CADASTRO DE ADRESSES DE EMAIL */}
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Destinatários Cadastrados ({alertEmails.length})</label>
                        {alertEmails.length > 0 && autoEmailEnabled && (
                          <span className="text-[9px] font-black text-emerald-600 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                            Prontos para retransmissão
                          </span>
                        )}
                      </div>
                      
                      <div className="flex gap-2.5">
                        <div className="relative flex-grow">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                            <Mail className="w-4 h-4 text-slate-400" />
                          </span>
                          <input
                            type="email"
                            placeholder="Adicione um e-mail para alerta..."
                            className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-primary-gold rounded-xl pl-9 pr-4 py-2.5 text-xs font-bold outline-none transition-all placeholder:text-slate-400 h-10"
                            value={newEmailInput}
                            onChange={(e) => setNewEmailInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddEmail();
                              }
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddEmail}
                          className="bg-primary-navy hover:bg-primary-navy/90 text-white font-black px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm h-10"
                        >
                          <Plus className="w-4 h-4 text-primary-gold" />
                          CADASTRAR
                        </button>
                      </div>

                      {emailActionFeedback && (
                        <p className="text-[9.5px] font-black text-emerald-600 uppercase tracking-wider pl-1">{emailActionFeedback}</p>
                      )}

                      {alertEmails.length === 0 ? (
                        <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center italic text-xs text-slate-400">
                          Nenhum e-mail de alerta cadastrado. Adicione destinatários acima para receber cópias dos relatórios de ocorrências.
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100 bg-white border border-slate-200 rounded-xl max-h-[140px] overflow-y-auto shadow-inner">
                          {alertEmails.map((email) => (
                            <div key={email} className="flex items-center justify-between px-3.5 py-2.5 transition-colors hover:bg-slate-50">
                              <span className="text-xs font-mono font-bold text-slate-700">{email}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveEmail(email)}
                                className="text-slate-400 hover:text-red-500 hover:bg-red-55 p-1.5 rounded-lg transition-colors border-0 bg-transparent cursor-pointer"
                                title="Remover E-mail"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex gap-3">
                      <svg className="w-5 h-5 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        <strong>Importante:</strong> Qualquer ocorrência registrada como <strong>Divergência de Lacre</strong> ou <strong>Lacre Rompido</strong> deve ser comunicada imediatamente à Central de Monitoramento e Prevenção de Perdas. Anexe fotos nítidas do lacre e das dobradiças da porta.
                      </p>
                    </div>
                  </div>

                  {/* History of Occurrences Section */}
                  {selectedLoad.occurrenceHistory && selectedLoad.occurrenceHistory.length > 0 && (
                    <div className="space-y-6 pt-6 border-t font-sans">
                      <h4 className="font-black text-slate-800 uppercase tracking-wider text-xs flex items-center gap-2">
                        <History className="w-5 h-5 text-primary-gold" />
                        Histórico de Auditorias ({selectedLoad.occurrenceHistory.length})
                      </h4>
                      <div className="space-y-4">
                        {selectedLoad.occurrenceHistory.map((occ, index) => {
                          const isNormal = occ.type === OccurrenceType.NONE;
                          return (
                            <div 
                              key={index} 
                              className={`bg-slate-50 border-y border-r rounded-2xl p-5 flex flex-col sm:flex-row gap-5 transition-all hover:bg-white hover:shadow-md ${
                                isNormal 
                                  ? 'border-l-4 border-l-emerald-500 border-slate-200/80' 
                                  : 'border-l-4 border-l-red-500 border-slate-200/80'
                              }`}
                            >
                              {/* Photo Block / Visual indicator container */}
                              <div className="w-full sm:w-28 shrink-0 flex flex-col gap-2 items-center">
                                {occ.photo ? (
                                  <div className="relative w-28 h-28 group overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-slate-100 cursor-zoom-in">
                                    <img 
                                      src={occ.photo} 
                                      alt="Foto Evidência" 
                                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setModalImage(occ.photo || null)}
                                      className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white"
                                    >
                                      <Maximize2 className="w-3.5 h-3.5" />
                                      <span className="text-[9px] font-black uppercase tracking-wider">Ampliar</span>
                                    </button>
                                  </div>
                                ) : (
                                  <div className="w-28 h-28 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-450 bg-slate-200/40">
                                    <ImageOff className="w-6 h-6 text-slate-300 mb-1" />
                                    <span className="text-[8px] font-bold text-slate-400 italic uppercase tracking-widest leading-none">Sem Mídia</span>
                                  </div>
                                )}
                                
                                {/* Photo indicator badge as explicitly requested */}
                                {occ.photo ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200/80 shadow-xs">
                                    <Camera className="w-3 h-3 text-emerald-600" />
                                    Com Foto
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 border border-slate-250 shadow-xs">
                                    <ImageOff className="w-3 h-3 text-slate-400" />
                                    Sem Foto
                                  </span>
                                )}
                              </div>

                              {/* Details text area */}
                              <div className="flex-grow space-y-3 flex flex-col justify-between">
                                <div className="space-y-2">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                                    {/* Action Type Badge */}
                                    <span className={`inline-flex self-start text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider ${
                                      isNormal 
                                        ? 'bg-emerald-100 text-emerald-800' 
                                        : 'bg-red-100 text-red-800 border border-red-200/50'
                                    }`}>
                                      {occ.type}
                                    </span>
                                    
                                    {/* Timestamp */}
                                    <span className="text-[10px] text-slate-400 font-mono font-bold flex items-center gap-1">
                                      <Calendar className="w-3.5 h-3.5" />
                                      {new Date(occ.timestamp).toLocaleString('pt-BR')}
                                    </span>
                                  </div>

                                  {/* Description */}
                                  <p className="text-xs text-slate-700 font-medium leading-relaxed bg-white/75 p-3 rounded-xl border border-slate-100/60 shadow-xs">
                                    {occ.description || (isNormal ? 'Auditor Gate Liberado - Nenhuma ocorrência formal identificada.' : 'Irregularidade registrada pelo auditor.')}
                                  </p>
                                </div>

                                {/* Auditor Name & metadata */}
                                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[10px]">
                                  <div className="flex items-center gap-1.5 text-slate-600 bg-slate-200/60 px-2.5 py-1 rounded-lg">
                                    <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                                    <span className="font-bold uppercase tracking-wider">
                                      Auditor: <span className="font-black text-slate-800">{occ.auditor}</span>
                                    </span>
                                  </div>

                                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">
                                    GATE AUDIT CHECK ✓
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        }).reverse()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Aguardando Auditoria</h3>
                <p className="text-slate-500 max-w-sm">Selecione uma carga na lista lateral para iniciar o processo de conferência final e registro de ocorrências.</p>
              </div>
            )}
            </div>
          </div>
        </div>
        </div>
      )}

      {activeSubTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
          <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Gestão de Usuários</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Administração de contas e permissões</p>
            </div>
            {pendingUsers.length > 0 && (
              <span className="bg-red-100 text-red-600 text-[10px] font-black px-3 py-1 rounded-full animate-pulse">
                {pendingUsers.length} SOLICITAÇÃO(ÕES) PENDENTE(S)
              </span>
            )}
          </div>

          {/* User Filtering Inputs */}
          <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <input
                id="user-search-input"
                type="text"
                placeholder="Pesquisar por nome, usuário, loja ou função..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-primary-navy"
              />
            </div>
            <div className="w-full md:w-48">
              <select
                id="user-role-filter"
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus-visible:ring-2 focus-visible:ring-primary-navy"
              >
                <option value="ALL">TODAS AS REGRAS</option>
                <option value="expedition">EXPEDIÇÃO</option>
                <option value="portaria">PORTARIA</option>
                <option value="central">CENTRAL</option>
                <option value="audit">AUDITORIA</option>
                <option value="analysis">ANÁLISE</option>
              </select>
            </div>
            <div className="w-full md:w-48">
              <select
                id="user-status-filter"
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold outline-none focus-visible:ring-2 focus-visible:ring-primary-navy"
              >
                <option value="ALL">TODOS OS STATUS</option>
                <option value="active">ATIVOS</option>
                <option value="pending">PENDENTES</option>
                <option value="rejected">REJEITADOS</option>
              </select>
            </div>
          </div>

          <div className="p-6">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12 bg-slate-50/30 rounded-2xl border border-dashed border-slate-200">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Nenhum usuário encontrado com os filtros selecionados.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map(user => (
                <div key={user.id} className={`border rounded-2xl p-5 space-y-4 transition-all ${user.status === 'pending' ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200 hover:border-blue-200'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-slate-800 uppercase tracking-tight truncate w-40">{user.fullName || user.username}</h4>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black text-primary-navy uppercase tracking-widest">{user.role}</span>
                        {user.systemRole && (
                          <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded uppercase tracking-widest border border-purple-100">
                            {user.systemRole}
                          </span>
                        )}
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
                          user.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                          user.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {user.status}
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono">{new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="space-y-2 bg-white/50 p-3 rounded-xl border border-slate-100/50">
                    <div className="flex justify-between">
                      <span className="text-[9px] font-black text-slate-400 uppercase">Usuário:</span>
                      <span className="text-[9px] font-bold text-slate-700">{user.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[9px] font-black text-slate-400 uppercase">Loja:</span>
                      <span className="text-[9px] font-bold text-slate-700">{user.storeLocation || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[9px] font-black text-slate-400 uppercase">Função:</span>
                      <span className="text-[9px] font-bold text-slate-700">{user.jobFunction || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-100/50 pt-1.5 mt-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase">Vínculo de Alertas:</span>
                      <span className="text-[9px] font-black text-emerald-600 font-mono">
                        {user.role === 'audit' || user.systemRole === 'administrator' || user.systemRole === 'auditor'
                          ? 'central.monitoramento@atacadaodiaadia.com.br'
                          : `${user.username.toLowerCase()}@cargarelease.com`
                        }
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 pt-1 border-t border-slate-100 mt-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase">Perfil de Sistema:</span>
                      <select 
                        className="text-[9px] font-bold text-primary-navy bg-primary-gold/10 border-none rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-primary-gold"
                        value={user.systemRole || 'viewer'}
                        onChange={(e) => onUpdateSystemRole(user.id, e.target.value as SystemRole)}
                        disabled={user.status !== 'active'}
                      >
                        <option value="administrator">Administrador</option>
                        <option value="dispatcher">Expedidor</option>
                        <option value="auditor">Auditor</option>
                        <option value="viewer">Visualizador</option>
                      </select>
                    </div>
                  </div>

                  {user.status === 'pending' ? (
                    <div className="flex gap-2 pt-2">
                      <button 
                        onClick={() => onApproveUser(user.id, true)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black py-2.5 rounded-xl shadow-sm transition-all"
                      >
                        APROVAR
                      </button>
                      <button 
                        onClick={() => onApproveUser(user.id, false)}
                        className="flex-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-[10px] font-black py-2.5 rounded-xl transition-all"
                      >
                        REJEITAR
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-2">
                      {editingUserId === user.id ? (
                        <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                          <input 
                            type="password"
                            placeholder="Nova senha"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                if (newPassword.trim()) {
                                  onChangePassword(user.id, newPassword);
                                  setEditingUserId(null);
                                  setNewPassword('');
                                }
                              }}
                              className="flex-1 bg-primary-navy text-white text-[9px] font-black py-2 rounded-lg"
                            >
                              CONFIRMAR
                            </button>
                            <button 
                              onClick={() => {
                                setEditingUserId(null);
                                setNewPassword('');
                              }}
                              className="flex-1 bg-slate-100 text-slate-600 text-[9px] font-black py-2 rounded-lg"
                            >
                              CANCELAR
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setEditingUserId(user.id)}
                            className="flex-1 bg-slate-100 hover:bg-primary-gold/10 text-primary-navy text-[9px] font-black py-2 rounded-lg transition-all flex items-center justify-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
                            SENHA
                          </button>
                          <button 
                            onClick={() => setConfirmDeleteUser(user)}
                            className="flex-1 bg-slate-100 hover:bg-red-50 text-red-600 text-[9px] font-black py-2 rounded-lg transition-all flex items-center justify-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            EXCLUIR
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
          <div className="p-6 border-b bg-primary-navy flex justify-between items-center">
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Log de Eventos Global</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Rastreabilidade total das operações do sistema</p>
            </div>
            <button 
              onClick={exportToPDF}
              className="bg-primary-gold hover:bg-primary-gold/90 text-primary-navy text-[10px] font-black px-4 py-2 rounded-lg shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              EXPORTAR PDF
            </button>
          </div>

          {/* Filtros de Rastreabilidade System */}
          <div className="bg-slate-50 border-b border-slate-200 p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Intervalo de Datas */}
              <div className="space-y-1.5 md:col-span-2 grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Data de Início</label>
                  <input 
                    type="date" 
                    className="w-full bg-white border border-slate-200 hover:border-slate-350 focus:border-primary-gold rounded-xl px-3 py-2 text-xs font-bold leading-none outline-none transition-all h-9"
                    value={logStartDate}
                    onChange={(e) => setLogStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Data de Fim</label>
                  <input 
                    type="date" 
                    className="w-full bg-white border border-slate-200 hover:border-slate-350 focus:border-primary-gold rounded-xl px-3 py-2 text-xs font-bold leading-none outline-none transition-all h-9"
                    value={logEndDate}
                    onChange={(e) => setLogEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Tipo de Evento / Ação */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Tipo de Evento</label>
                <select
                  className="w-full bg-white border border-slate-200 focus:border-primary-gold rounded-xl px-3 py-2 text-xs font-bold outline-none transition-all h-9 cursor-pointer"
                  value={logActionFilter}
                  onChange={(e) => setLogActionFilter(e.target.value)}
                >
                  <option value="all">TODAS AS AÇÕES</option>
                  {uniqueLogActions.map((action, idx) => (
                    <option key={idx} value={action}>{action.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              {/* Usuário de Destino/Origem */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Usuário Responsável</label>
                <select
                  className="w-full bg-white border border-slate-200 focus:border-primary-gold rounded-xl px-3 py-2 text-xs font-bold outline-none transition-all h-9 cursor-pointer"
                  value={logUserFilter}
                  onChange={(e) => setLogUserFilter(e.target.value)}
                >
                  <option value="all">TODOS OS USUÁRIOS</option>
                  {uniqueLogUsers.map((usr, idx) => (
                    <option key={idx} value={usr}>{usr.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Segunda Linha: Busca Texto + Status */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-200/60 mt-2 justify-between items-center">
              <div className="relative w-full sm:max-w-md">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-3.5 w-3.5 text-slate-400" />
                </span>
                <input
                  type="text"
                  placeholder="Pesquisar por detalhes, manifesto, placa..."
                  className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-primary-gold rounded-xl pl-9 pr-4 py-2 text-xs font-bold outline-none transition-all h-9"
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                />
              </div>

              {/* Limpar e Contagem de Resultados */}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider">
                  Exibindo <strong className="font-extrabold text-primary-navy bg-slate-200/70 px-2 py-0.5 rounded-md">{filteredLogs.length}</strong> de {logs.length} ações
                </span>
                
                {(logStartDate || logEndDate || logActionFilter !== 'all' || logUserFilter !== 'all' || logSearchQuery) && (
                  <button
                    onClick={() => {
                      setLogStartDate('');
                      setLogEndDate('');
                      setLogActionFilter('all');
                      setLogUserFilter('all');
                      setLogSearchQuery('');
                    }}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200/50 px-3 py-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer"
                    title="Resetar todos os filtros"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    LIMPAR
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data/Hora</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuário</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ação</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center text-slate-400 italic text-sm">Nenhum evento correspondente encontrado.</td>
                  </tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-[10px] font-mono text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{log.username}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase tracking-tighter ${
                          log.action.includes('Login') ? 'bg-blue-100 text-blue-700' :
                          log.action.includes('Criação') ? 'bg-emerald-100 text-emerald-700' :
                          log.action.includes('Auditoria') ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 font-medium">{log.details}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PAINEL FLUTUANTE DE SINALIZAÇÃO DE ENVIO DE E-MAIL EM TEMPO REAL */}
      {lastSentNotification && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-slate-900 text-white rounded-2xl border-l-[6px] border-l-emerald-500 p-6 shadow-2xl max-w-md animate-in slide-in-from-right duration-500 space-y-3 font-sans" id="toast-email-alerta">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                <Send className="w-5 h-5 animate-pulse" />
              </span>
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-300">Alerta de Ocorrência por E-mail</h4>
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">{lastSentNotification.success ? 'TRANSMITIDO EM TEMPO REAL' : 'EDICAO PENDENTE'}</p>
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => setLastSentNotification(null)}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer border-0 bg-transparent"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="bg-slate-950/80 p-3.5 rounded-xl text-left border border-slate-800 space-y-2.5">
            <div className="text-[10px] font-medium leading-relaxed">
              <strong className="text-primary-gold uppercase block text-[8px] tracking-wider mb-0.5">Assunto do E-mail</strong>
              <span className="text-slate-100">[ALERTA DE OCORRÊNCIA] Carga {selectedLoad?.plate} - {selectedLoad?.driverName}</span>
            </div>
            {lastSentNotification.originEmail && (
              <div className="text-[10px] font-medium leading-relaxed">
                <strong className="text-primary-gold uppercase block text-[8px] tracking-wider mb-0.5">Remetente (Origem)</strong>
                <span className="text-emerald-400 font-mono text-[9px] font-bold">{lastSentNotification.originEmail}</span>
              </div>
            )}
            <div className="text-[10px] font-medium leading-relaxed col-span-2">
              <strong className="text-primary-gold uppercase block text-[8px] tracking-wider mb-0.5">Destinatários ({lastSentNotification.targetEmails.length})</strong>
              <div className="flex flex-wrap gap-1 mt-1 max-h-[60px] overflow-y-auto">
                {lastSentNotification.targetEmails.map((email, idx) => (
                  <span key={idx} className="bg-slate-800 border border-slate-700/60 text-slate-300 text-[8.5px] font-mono px-2 py-0.5 rounded">{email}</span>
                ))}
              </div>
            </div>
            <div className="text-[10px] font-medium leading-relaxed border-t border-slate-800/80 pt-2">
              <strong className="text-red-400 uppercase block text-[8px] tracking-wider mb-0.5">Ocorrência Registrada</strong>
              <span className="font-bold text-slate-200">{lastSentNotification.occurrenceDetails}</span>
            </div>
          </div>
          
          <p className="text-[8.5px] font-mono text-slate-500 text-center leading-none">
            Relatório digital enviado imediatamente às {lastSentNotification.timestamp}.
          </p>
        </div>
      )}
    </div>
  );
};
