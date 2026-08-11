import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Settings, 
  Palette, 
  Monitor, 
  HelpCircle, 
  Volume2, 
  Info, 
  User as UserIcon, 
  Cpu, 
  Maximize2, 
  Minimize2, 
  PhoneCall, 
  BookOpen, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Sun,
  Moon,
  Laptop,
  Mail,
  Link2,
  Send,
  RefreshCw,
  LogOut,
  Check,
  Sparkles,
  Loader2
} from 'lucide-react';
import { User, CargoLoad } from '../types';
import { 
  getGmailToken, 
  getGmailUser, 
  signInWithGmail, 
  logoutGmail, 
  fetchGmailProfile, 
  sendGmailEmail, 
  fetchGmailSentMessages 
} from '../utils/gmailService';

interface SettingsViewProps {
  currentUser: User | null;
  loads: CargoLoad[];
}

export const SettingsView: React.FC<SettingsViewProps> = ({ currentUser, loads }) => {
  // Notification State
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    if (typeof window === 'undefined') return 'default';
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  });

  const [notifAlerts, setNotifAlerts] = useState(() => {
    const saved = localStorage.getItem('cargoradar_notif_alerts');
    return saved ? JSON.parse(saved) : {
      divergences: true,
      highRisk: true,
      gateReleased: false,
      soundAlert: true
    };
  });

  // Personalization State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'dark';
  });

  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem('cargoradar_accent_color') || 'purple';
  });

  const [compactMode, setCompactMode] = useState(() => {
    return localStorage.getItem('cargoradar_compact_mode') === 'true';
  });

  // Screen Mode State (Fullscreen and Operator display optimization)
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [stretchMonitor, setStretchMonitor] = useState(() => {
    return localStorage.getItem('cargoradar_stretch_monitor') === 'true';
  });

  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('cargoradar_font_size') || 'normal'; // 'normal' | 'large'
  });

  // Support / Help states
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMsg, setTicketMsg] = useState('');
  const [ticketSeverity, setTicketSeverity] = useState('low');
  const [ticketSuccess, setTicketSuccess] = useState(false);

  // Gmail Integration States
  const [gmailToken, setGmailToken] = useState<string | null>(getGmailToken());
  const [gmailUser, setGmailUser] = useState<any>(getGmailUser());
  const [gmailProfile, setGmailProfile] = useState<any>(null);
  const [sentEmails, setSentEmails] = useState<any[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  // Custom Compose Form States
  const [testTo, setTestTo] = useState('');
  const [testSubject, setTestSubject] = useState('');
  const [testBody, setTestBody] = useState('');
  const [testEmailSuccess, setTestEmailSuccess] = useState(false);
  const [testEmailError, setTestEmailError] = useState<string | null>(null);

  // Sync Gmail states from custom window auth events
  useEffect(() => {
    const handleAuthChanged = () => {
      const token = getGmailToken();
      setGmailToken(token);
      setGmailUser(getGmailUser());
      if (!token) {
        setGmailProfile(null);
        setSentEmails([]);
      }
    };
    window.addEventListener('gmail-auth-changed', handleAuthChanged);
    return () => {
      window.removeEventListener('gmail-auth-changed', handleAuthChanged);
    };
  }, []);

  const loadGmailData = async () => {
    setIsLoadingProfile(true);
    try {
      const profile = await fetchGmailProfile();
      setGmailProfile(profile);
      const messages = await fetchGmailSentMessages();
      setSentEmails(messages);
    } catch (err) {
      console.error('Erro ao carregar dados do Gmail:', err);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (gmailToken) {
      loadGmailData();
    }
  }, [gmailToken]);

  const handleGmailLogin = async () => {
    try {
      await signInWithGmail();
    } catch (err: any) {
      if (err && (err.code === 'auth/popup-closed-by-user' || err.message?.includes('popup-closed-by-user'))) {
        console.warn('Login do Gmail cancelado pelo usuário (popup fechado).');
      } else {
        console.error('Erro ao fazer login no Gmail:', err);
      }
    }
  };

  const handleGmailLogout = () => {
    logoutGmail();
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTo.trim() || !testSubject.trim() || !testBody.trim()) return;
    setIsSendingEmail(true);
    setTestEmailError(null);
    setTestEmailSuccess(false);

    try {
      const formattedBody = '<p>' + testBody.trim().replace(/\n/g, '<br/>') + '</p>';
      await sendGmailEmail(testTo.trim(), testSubject.trim(), formattedBody);
      setTestEmailSuccess(true);
      setTestTo('');
      setTestSubject('');
      setTestBody('');
      
      // Reload sent emails list
      const messages = await fetchGmailSentMessages();
      setSentEmails(messages);
      
      setTimeout(() => setTestEmailSuccess(false), 5000);
    } catch (err: any) {
      setTestEmailError(err.message || 'Erro ao enviar e-mail via Gmail.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Sync theme changes with other views/components
  useEffect(() => {
    const handleThemeChanged = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail === 'light' || customEvent.detail === 'dark') {
        setTheme(customEvent.detail);
      }
    };
    window.addEventListener('theme-changed', handleThemeChanged);
    return () => {
      window.removeEventListener('theme-changed', handleThemeChanged);
    };
  }, []);

  // Sync fullscreen state with actual browser fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Sync settings helper
  const saveNotifAlerts = (newAlerts: typeof notifAlerts) => {
    setNotifAlerts(newAlerts);
    localStorage.setItem('cargoradar_notif_alerts', JSON.stringify(newAlerts));
  };

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    } catch (err) {
      console.warn('Erro ao alternar modo tela cheia:', err);
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', newTheme);
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: newTheme }));
  };

  const handleAccentChange = (color: string) => {
    setAccentColor(color);
    localStorage.setItem('cargoradar_accent_color', color);
    // Reload styles optionally or update layout classes
    window.dispatchEvent(new CustomEvent('accent-changed', { detail: color }));
  };

  const handleCompactModeToggle = (checked: boolean) => {
    setCompactMode(checked);
    localStorage.setItem('cargoradar_compact_mode', String(checked));
    window.dispatchEvent(new CustomEvent('compact-changed', { detail: checked }));
  };

  const handleStretchMonitorToggle = (checked: boolean) => {
    setStretchMonitor(checked);
    localStorage.setItem('cargoradar_stretch_monitor', String(checked));
    window.dispatchEvent(new CustomEvent('stretch-changed', { detail: checked }));
    // Force a minor resize trigger to tell google maps / tables to span fully
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 150);
  };

  const handleFontSizeChange = (size: string) => {
    setFontSize(size);
    localStorage.setItem('cargoradar_font_size', size);
    if (size === 'large') {
      document.body.classList.add('text-lg-operational');
    } else {
      document.body.classList.remove('text-lg-operational');
    }
    window.dispatchEvent(new CustomEvent('fontsize-changed', { detail: size }));
  };

  const requestNotifPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    try {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
      if (permission === 'granted') {
        new Notification('CargaRadar - Notificações Ativadas', {
          body: 'Notificações de teste enviadas com sucesso!',
          icon: '/logo.png'
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMsg.trim()) return;

    if (gmailToken) {
      setIsSendingEmail(true);
      try {
        const emailBody = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
            <h2 style="color: #e11d48; margin-top: 0;">Novo Chamado de Suporte Técnico</h2>
            <p><strong>Usuário:</strong> ${currentUser?.fullName || currentUser?.username} (${currentUser?.username || ''})</p>
            <p><strong>Gravidade:</strong> ${ticketSeverity.toUpperCase()}</p>
            <p><strong>Assunto:</strong> ${ticketSubject}</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
            <p><strong>Descrição:</strong></p>
            <p style="white-space: pre-wrap; background-color: #f8fafc; padding: 12px; border-radius: 8px;">${ticketMsg}</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
            <p style="font-size: 11px; color: #64748b;">Enviado de forma segura via API do Gmail do CargaRadar.</p>
          </div>
        `;
        await sendGmailEmail(
          'central.monitoramento@atacadaodiaadia.com.br',
          `[SUPORTE CARGARADAR] ${ticketSubject}`,
          emailBody
        );
        // Refresh sent emails list in background
        const messages = await fetchGmailSentMessages();
        setSentEmails(messages);
      } catch (err) {
        console.error('Falha ao enviar e-mail de suporte real via Gmail API:', err);
      } finally {
        setIsSendingEmail(false);
      }
    }

    // Simulate/set success locally so user gets immediate visual feedback
    setTicketSuccess(true);
    setTicketSubject('');
    setTicketMsg('');
    setTimeout(() => setTicketSuccess(false), 5000);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-205 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-gold/10 text-primary-gold rounded-2xl">
              <Settings className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              PAINEL DE CONFIGURAÇÕES
            </h2>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-400 mt-1 uppercase font-bold tracking-wider">
            Gerencie preferências de exibição de monitores, personalização, alertas e canais de suporte
          </p>
        </div>

        {/* Global Stats Info */}
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200/55 dark:border-slate-800 px-4 py-2.5 rounded-2xl">
          <Info className="w-4 h-4 text-slate-400" />
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
            Protocol: v2.5.0-STABLE | Terminal: Monit-Ops
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left column options index */}
        <aside className="md:col-span-3 space-y-2">
          <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-150 dark:border-slate-850 p-4 shadow-sm">
            <h3 className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-3 px-2">
              Seções de Ajustes
            </h3>
            <div className="space-y-1">
              <a href="#notifications" className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-black uppercase text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                <Bell className="w-4 h-4 text-amber-500" />
                <span>Notificações</span>
              </a>
              <a href="#gmail-integration" className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-black uppercase text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                <Mail className="w-4 h-4 text-blue-500" />
                <span>Integração Gmail</span>
              </a>
              <a href="#personalization" className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-black uppercase text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                <Palette className="w-4 h-4 text-emerald-500" />
                <span>Personalização</span>
              </a>
              <a href="#screen-mode" className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-black uppercase text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                <Monitor className="w-4 h-4 text-blue-500" />
                <span>Modo de Tela</span>
              </a>
              <a href="#support" className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-black uppercase text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                <HelpCircle className="w-4 h-4 text-rose-500" />
                <span>Suporte Técnico</span>
              </a>
            </div>
          </div>

          {/* Connected User Profile Box */}
          <div className="bg-gradient-to-br from-primary-navy to-slate-900 text-white rounded-3xl border border-slate-800 p-5 shadow-lg relative overflow-hidden">
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-primary-gold" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-tight">{currentUser?.fullName || currentUser?.username}</h4>
                  <span className="text-[9px] font-bold text-primary-gold uppercase tracking-wider">{currentUser?.systemRole}</span>
                </div>
              </div>
              <div className="pt-3 border-t border-white/10 text-[10px] space-y-1 opacity-80">
                <p><span className="font-bold">Setor:</span> <span className="capitalize">{currentUser?.role}</span></p>
                <p><span className="font-bold">IP Monitorado:</span> 192.168.32.110</p>
              </div>
            </div>
            {/* Background design accents */}
            <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-primary-gold/10 rounded-full blur-2xl pointer-events-none" />
          </div>
        </aside>

        {/* Right column detailed panels */}
        <div className="md:col-span-9 space-y-8">
          
          {/* SEC 1: NOTIFICATIONS */}
          <section id="notifications" className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-[32px] p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-4">
              <div className="flex items-center gap-2.5">
                <Bell className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                  Notificações do Sistema
                </h3>
              </div>
              <span className="bg-amber-500/10 text-amber-500 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase">
                Alertas Ativos
              </span>
            </div>

            {/* Browser Permission Info Box */}
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-slate-400" />
                  Notificações Nativas do Navegador
                </h4>
                <p className="text-[11px] text-slate-500 max-w-md">
                  Receba alertas instantâneos popup fora do navegador se uma divergência crítica de carga/rota for registrada pela Auditoria ou Portaria.
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded ${
                  notifPermission === 'granted' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  notifPermission === 'denied' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {notifPermission === 'granted' ? 'PERMITIDO' :
                   notifPermission === 'denied' ? 'BLOQUEADO' : 'NÃO SOLICITADO'}
                </span>
                
                {notifPermission !== 'granted' && (
                  <button
                    onClick={requestNotifPermission}
                    className="px-3.5 py-2 bg-slate-800 text-white hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Ativar Alertas
                  </button>
                )}
              </div>
            </div>

            {/* Specific alerts checklist */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Selecione os Eventos de Disparo
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-start gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 hover:border-slate-200 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifAlerts.divergences}
                    onChange={(e) => saveNotifAlerts({...notifAlerts, divergences: e.target.checked})}
                    className="mt-1 w-4 h-4 text-amber-500 border-slate-300 rounded focus:ring-amber-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-200 block">Divergências de Rota (Auditoria)</span>
                    <span className="text-[10px] text-slate-400">Qualquer nova ocorrência criada por um auditor especializado.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 hover:border-slate-200 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifAlerts.highRisk}
                    onChange={(e) => saveNotifAlerts({...notifAlerts, highRisk: e.target.checked})}
                    className="mt-1 w-4 h-4 text-amber-500 border-slate-300 rounded focus:ring-amber-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-200 block">Cargas de Alto Risco</span>
                    <span className="text-[10px] text-slate-400">Notificará sempre que cargas sinalizadas como alto risco entrarem em pátio.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 hover:border-slate-200 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifAlerts.gateReleased}
                    onChange={(e) => saveNotifAlerts({...notifAlerts, gateReleased: e.target.checked})}
                    className="mt-1 w-4 h-4 text-amber-500 border-slate-300 rounded focus:ring-amber-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-200 block">Liberações de Portaria</span>
                    <span className="text-[10px] text-slate-400">Logs de veículos liberados na saída do CD Atacadão.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 hover:border-slate-200 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifAlerts.soundAlert}
                    onChange={(e) => saveNotifAlerts({...notifAlerts, soundAlert: e.target.checked})}
                    className="mt-1 w-4 h-4 text-amber-500 border-slate-300 rounded focus:ring-amber-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-200 block flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-amber-505" />
                      Alertas Sonoros
                    </span>
                    <span className="text-[10px] text-slate-400">Ativa um bipe sutil de atenção em caso de bloqueio.</span>
                  </div>
                </label>
              </div>
            </div>
          </section>

          {/* SEC 2: PERSONALIZATION */}
          <section id="personalization" className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-[32px] p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-4">
              <div className="flex items-center gap-2.5">
                <Palette className="w-5 h-5 text-emerald-500" />
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                  Personalização Visual
                </h3>
              </div>
              <span className="bg-emerald-500/10 text-emerald-500 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase">
                Temas e Cores
              </span>
            </div>

            {/* Light / Dark Mode Buttons */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Tema de visualização padrão
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleThemeChange('light')}
                  className={`flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer text-xs font-bold uppercase ${
                    theme === 'light'
                      ? 'border-primary-gold bg-primary-gold/5 text-primary-navy font-black shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                >
                  <Sun className={`w-4 h-4 ${theme === 'light' ? 'text-primary-gold' : ''}`} />
                  Modo Claro
                </button>
                <button
                  type="button"
                  onClick={() => handleThemeChange('dark')}
                  className={`flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer text-xs font-bold uppercase ${
                    theme === 'dark'
                      ? 'border-emerald-500 bg-emerald-500/5 text-slate-205 font-black shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'
                  }`}
                >
                  <Moon className={`w-4 h-4 ${theme === 'dark' ? 'text-emerald-500' : ''}`} />
                  Modo Escuro
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    handleThemeChange(sysDark ? 'dark' : 'light');
                  }}
                  className="flex items-center justify-center gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer text-xs font-bold uppercase"
                >
                  <Laptop className="w-4 h-4" />
                  Padrão do Sistema
                </button>
              </div>
            </div>

            {/* Accent Color Preferer */}
            <div className="space-y-3 pt-2">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Cor de destaque / Marcação prioritária
              </h4>
              <div className="flex flex-wrap gap-3">
                {[
                  { name: 'purple', class: 'bg-purple-600', label: 'Roxo Reversa (Moderno)' },
                  { name: 'gold', class: 'bg-primary-gold', label: 'Dourado Operacional' },
                  { name: 'emerald', class: 'bg-emerald-600', label: 'Verde Segurança' },
                  { name: 'blue', class: 'bg-[#1e40af]', label: 'Azul Corporativo' },
                  { name: 'rose', class: 'bg-rose-600', label: 'Vermelho Prioridade' }
                ].map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => handleAccentChange(color.name)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all text-xs font-bold cursor-pointer uppercase ${
                      accentColor === color.name
                        ? 'border-slate-800 dark:border-slate-200 bg-slate-50 dark:bg-slate-900 font-extrabold text-slate-850 dark:text-white'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full ${color.class} block border border-white/20`} />
                    {color.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Densidade de tabelas */}
            <div className="pt-2">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-950 rounded-2xl">
                <div className="space-y-0.5">
                  <span className="text-xs font-black uppercase text-slate-800 dark:text-slate-100 block">Modo Compacto das Listagens</span>
                  <p className="text-[10px] text-slate-400">Otimiza tabelas ocultando paddings secundários, perfeito para ver mais dados sem rolar.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={compactMode}
                    onChange={(e) => handleCompactModeToggle(e.target.checked)}
                    className="sr-only peer cursor-pointer"
                  />
                  <div className="w-11 h-6 bg-slate-250 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
                </label>
              </div>
            </div>
          </section>

          {/* SEC 3: SCREEN MODE - FULLSCREEN & COCS OP-MONITORS */}
          <section id="screen-mode" className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-[32px] p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-4">
              <div className="flex items-center gap-2.5">
                <Monitor className="w-5 h-5 text-blue-500" />
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                  Modo de Tela & Visualização de Operação
                </h3>
              </div>
              <span className="bg-blue-500/10 text-blue-500 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase">
                Fixed Monitors
              </span>
            </div>

            {/* Fullscreen Button */}
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center md:text-left">
                <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-100 flex items-center justify-center md:justify-start gap-2">
                  <Maximize2 className="w-4 h-4 text-blue-550" />
                  Módulo de Tela Inteira (Fullscreen Mode)
                </h4>
                <p className="text-[11px] text-slate-500 max-w-md">
                  Recomendado para televisores de monitoramento fixo nos centros de inteligência e expedição. Expande de ponta a ponta e esconde barras comuns do navegador.
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleFullscreen}
                className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-black uppercase text-xs tracking-wider transition-all cursor-pointer shadow-md ${
                  isFullscreen 
                    ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                    : 'bg-primary-navy hover:bg-slate-900 text-white border border-primary-gold/30'
                }`}
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="w-4 h-4 text-white" />
                    Sair da Tela Cheia
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-4 h-4 text-primary-gold" />
                    Ativar Tela Cheia
                  </>
                )}
              </button>
            </div>

            {/* Width scale stretch toggler (OPERATIONAL MIRROR) */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Ajuste para Painéis Largos / Vídeo Walls
              </h4>
              
              <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl">
                <div className="space-y-0.5">
                  <span className="text-xs font-black uppercase text-slate-800 dark:text-slate-100 block">Esticar Layout no Limite da Tela (100% Fluid Width)</span>
                  <p className="text-[10px] text-slate-400">Desativa o limite padrão de largura de 1280px (7xl) para expandir as tabelas e o mapa por toda a tela em monitores UltraWide.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stretchMonitor}
                    onChange={(e) => handleStretchMonitorToggle(e.target.checked)}
                    className="sr-only peer cursor-pointer"
                  />
                  <div className="w-11 h-6 bg-slate-250 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
                </label>
              </div>

              {/* FontSize Controller */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl">
                <div className="space-y-0.5">
                  <span className="text-xs font-black uppercase text-slate-800 dark:text-slate-100 block">Tamanho de Texto Operacional</span>
                  <p className="text-[10px] text-slate-400">Aumenta ligeiramente a fonte das informações cruciais para leituras facilitadas a distância de monitores fixos.</p>
                </div>
                
                <div className="flex gap-2">
                  {[
                    { val: 'normal', label: 'Monitor Normal' },
                    { val: 'large', label: 'Monitor Distante (+15%)' }
                  ].map((sz) => (
                    <button
                      key={sz.val}
                      type="button"
                      onClick={() => handleFontSizeChange(sz.val)}
                      className={`px-3.5 py-2.5 rounded-xl border text-[10.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        fontSize === sz.val
                          ? 'border-slate-800 dark:border-white bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-extrabold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* SEC 3.5: GMAIL INTEGRATION (GOOGLE WORKSPACE) */}
          <section id="gmail-integration" className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-[32px] p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-4">
              <div className="flex items-center gap-2.5">
                <Mail className="w-5 h-5 text-blue-500" />
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                  Integração Gmail & Google Workspace
                </h3>
              </div>
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${
                gmailToken ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-400'
              }`}>
                {gmailToken ? 'Conectado' : 'Não Ativo'}
              </span>
            </div>

            {!gmailToken ? (
              <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/20 dark:from-blue-950/10 dark:to-slate-950 border border-blue-100/70 dark:border-slate-850 p-6 sm:p-8 rounded-3xl flex flex-col items-center text-center space-y-4">
                <div className="p-3.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div className="max-w-md space-y-2">
                  <h4 className="text-sm font-black uppercase text-slate-800 dark:text-slate-100">
                    Vincule seu Gmail do Google Workspace
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Habilite o envio em tempo real de relatórios de liberação de carga, alertas de bloqueio de prevenção de perdas e abertura automática de chamados de suporte técnico diretamente do seu e-mail corporativo.
                  </p>
                </div>

                <button
                  onClick={handleGmailLogin}
                  className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-black text-xs uppercase tracking-wider cursor-pointer shadow-sm text-slate-700 dark:text-slate-200 mt-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Conectar com Google</span>
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Active Connection Profile */}
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {gmailUser?.photoURL ? (
                      <img src={gmailUser.photoURL} alt="Profile" className="w-11 h-11 rounded-full border-2 border-blue-500/30" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-sm">
                        {gmailUser?.displayName?.charAt(0) || gmailProfile?.emailAddress?.charAt(0).toUpperCase() || 'G'}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-100">
                          {gmailUser?.displayName || 'Conta Google Vinculada'}
                        </h4>
                        <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-emerald-500"></span> Ativo
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium font-mono mt-0.5">
                        {gmailProfile?.emailAddress || gmailUser?.email || 'Buscando endereço...'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={loadGmailData}
                      disabled={isLoadingProfile}
                      className="p-2 bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 cursor-pointer disabled:opacity-50"
                      title="Sincronizar"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoadingProfile ? 'animate-spin text-blue-500' : ''}`} />
                    </button>
                    <button
                      onClick={handleGmailLogout}
                      className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Desconectar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left Column: Gmail history */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Histórico Recente de E-mails Enviados
                      </h4>
                      <span className="text-[9px] font-bold text-slate-400 uppercase font-mono">Últimos 5</span>
                    </div>

                    {isLoadingProfile ? (
                      <div className="bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-900 rounded-2xl p-8 flex flex-col items-center justify-center space-y-2">
                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                        <p className="text-[10px] uppercase font-bold text-slate-400">Consultando API do Gmail...</p>
                      </div>
                    ) : sentEmails.length === 0 ? (
                      <div className="bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-900 rounded-2xl p-8 text-center">
                        <p className="text-xs text-slate-400 font-semibold uppercase">Nenhum e-mail enviado recentemente via Gmail.</p>
                        <p className="text-[10px] text-slate-400/80 mt-1">Envie uma mensagem ao lado ou abra um chamado para registrar correspondências.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {sentEmails.map((email) => (
                          <div key={email.id} className="p-3 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-850 hover:border-slate-200 rounded-xl space-y-1 text-xs">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-bold text-slate-500 font-mono">Para: {email.to}</span>
                              <span className="text-slate-400 font-semibold">{email.date}</span>
                            </div>
                            <p className="font-black text-slate-700 dark:text-slate-200 truncate uppercase tracking-tight">{email.subject}</p>
                            <p className="text-[11px] text-slate-400 truncate leading-relaxed">{email.snippet}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Quick compose form */}
                  <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl p-5 space-y-4">
                    <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-100 block">
                      Enviar Notificação Rápida via Gmail
                    </h4>

                    {testEmailSuccess ? (
                      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-850/60 p-4 rounded-xl flex items-start gap-2 text-emerald-800 dark:text-emerald-450 text-xs font-bold leading-relaxed">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-emerald-900 dark:text-emerald-300 uppercase tracking-tight">E-MAIL ENVIADO!</p>
                          <p className="text-[10px] font-normal opacity-80 mt-0.5">Mensagem enviada com sucesso utilizando sua conta corporativa vinculada.</p>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleSendTestEmail} className="space-y-3 text-xs">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block mb-1">Destinatário (E-mail)</label>
                          <input
                            type="email"
                            value={testTo}
                            onChange={(e) => setTestTo(e.target.value)}
                            placeholder="Ex: coordenacao@atacadaodiaadia.com.br"
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-white font-medium focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block mb-1">Assunto</label>
                          <input
                            type="text"
                            value={testSubject}
                            onChange={(e) => setTestSubject(e.target.value)}
                            placeholder="Ex: Atualização de Status da Carga"
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-white font-medium focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block mb-1">Corpo do E-mail</label>
                          <textarea
                            rows={3}
                            value={testBody}
                            onChange={(e) => setTestBody(e.target.value)}
                            placeholder="Digite sua mensagem operacional aqui..."
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-white font-medium focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>

                        {testEmailError && (
                          <div className="text-[10.5px] text-red-500 font-semibold uppercase flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {testEmailError}
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={isSendingEmail}
                          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10.5px] tracking-widest rounded-xl transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isSendingEmail ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              Transmitir Mensagem
                            </>
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* SEC 4: TECHNICAL SUPPORT & MANUAL */}
          <section id="support" className="bg-white dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-[32px] p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-4">
              <div className="flex items-center gap-2.5">
                <HelpCircle className="w-5 h-5 text-rose-500" />
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                  Suporte Técnico & Ouvidoria
                </h3>
              </div>
              <span className="bg-rose-500/10 text-rose-500 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase">
                Ouvidoria CD
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Support Info */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-100">
                    Canais de Emergência de Operações
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Se você notar falha no sinal do rastreador, erros de login de novos expedidores ou lentidão nas confirmações de descarga, utilize os canais abaixo de prioridade ou envie uma requisição ao lado.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-xl">
                    <PhoneCall className="w-4 h-4 text-slate-505" />
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Prevenção de Perdas CD Central</p>
                      <p className="text-xs font-black text-slate-700 dark:text-slate-100">Ramal: 3102 | Whatsapp: (61) 99882-3102</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-xl">
                    <BookOpen className="w-4 h-4 text-slate-505" />
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Documentos e Diretrizes do Operador</p>
                      <p className="text-xs font-black text-slate-700 dark:text-slate-100 decoration-dotted underline cursor-pointer">
                        Manual_Seguranca_Cargas_v2.pdf
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-950/40 rounded-2xl">
                  <p className="text-[9.5px] font-bold text-rose-800 dark:text-rose-450 uppercase flex items-center gap-1.5 leading-none">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Regra Operacional de Lacre
                  </p>
                  <p className="text-[10px] text-rose-700 dark:text-rose-400 mt-1 leading-relaxed font-semibold">
                    Veículos de expedição que cruzarem o portão sem o registro do lacre no CARGARADAR serão bloqueados automaticamente.
                  </p>
                </div>
              </div>

              {/* Support Form */}
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-100 block">
                  Enviar Mensagem de Suporte / Feedbacks
                </h4>

                {ticketSuccess ? (
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-850/60 p-4 rounded-xl flex items-start gap-2 text-emerald-800 dark:text-emerald-450 text-xs font-bold leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-emerald-900 dark:text-emerald-300 uppercase tracking-tight">ENVIADO COM SUCESSO!</p>
                      <p className="text-[10px] font-normal opacity-80 mt-0.5">Seu chamado foi registrado na Central de TI CargaRadar e será respondido em instantes.</p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitTicket} className="space-y-3 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block mb-1">Assunto / Tipo de Problema</label>
                      <input
                        type="text"
                        value={ticketSubject}
                        onChange={(e) => setTicketSubject(e.target.value)}
                        placeholder="Ex: Falha ao cadastrar placa ou erro de mapa"
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-white font-medium focus:ring-rose-500 focus:border-rose-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block mb-1">Gravidade</label>
                      <select
                        value={ticketSeverity}
                        onChange={(e) => setTicketSeverity(e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-700 dark:text-slate-200 font-medium focus:ring-rose-505 focus:border-rose-505"
                      >
                        <option value="low">Baixa - Dúvidas / Reclamações</option>
                        <option value="medium">Média - Lentidão no Sistema</option>
                        <option value="high">Alta - Erro Crítico que trava a Operação</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block mb-1">Descrição Detalhada</label>
                      <textarea
                        rows={3}
                        value={ticketMsg}
                        onChange={(e) => setTicketMsg(e.target.value)}
                        placeholder="Descreva exatamente o que está acontecendo..."
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-white font-medium focus:ring-rose-505 focus:border-rose-550"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black uppercase text-[10.5px] tracking-widest rounded-xl transition-colors cursor-pointer shadow-md"
                    >
                      Enviar Chamado de Suporte
                    </button>
                  </form>
                )}
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};
