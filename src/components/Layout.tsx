
import React from 'react';
import { 
  LogOut, 
  LayoutDashboard, 
  Truck, 
  ShieldCheck, 
  BarChart3, 
  Bell, 
  BellOff, 
  Sun, 
  Moon, 
  ClipboardCheck, 
  Compass,
  Search,
  X,
  ExternalLink,
  Eye,
  AlertTriangle,
  MapPin,
  User as UserIcon,
  Calendar,
  Layers,
  FileSpreadsheet,
  Settings,
  Menu
} from 'lucide-react';

import { User, CargoLoad, CargoStatus, CargoType, OccurrenceType, getPhotosArray } from '../types';
import { FeedbackChat } from './FeedbackChat';

type TabType = 'expedition' | 'central' | 'audit' | 'analysis' | 'portaria' | 'tracking' | 'settings' | 'reverse_transfer';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onLogout: () => void;
  isAuthenticated: boolean;
  user: User | null;
  loads?: CargoLoad[];
  isOffline?: boolean;
  lastSyncTime?: string | null;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  onTabChange, 
  onLogout,
  isAuthenticated,
  user,
  loads = [],
  isOffline = false,
  lastSyncTime = null
}) => {
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'dark'; // Default to dark theme for modern cosmic purple-navy ambiance
  });

  const [notifPermission, setNotifPermission] = React.useState<NotificationPermission | 'unsupported'>(() => {
    if (typeof window === 'undefined') return 'default';
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  });

  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCargoFromSearch, setSelectedCargoFromSearch] = React.useState<CargoLoad | null>(null);
  const [zoomPhoto, setZoomPhoto] = React.useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const [stretchMonitor, setStretchMonitor] = React.useState(() => {
    return localStorage.getItem('cargoradar_stretch_monitor') === 'true';
  });

  const [fontSize, setFontSize] = React.useState(() => {
    return localStorage.getItem('cargoradar_font_size') || 'normal';
  });

  const [accentColor, setAccentColor] = React.useState(() => {
    return localStorage.getItem('cargoradar_accent_color') || 'purple';
  });

  const searchContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (theme === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  React.useEffect(() => {
    const handleStretch = () => {
      setStretchMonitor(localStorage.getItem('cargoradar_stretch_monitor') === 'true');
    };
    const handleFontSize = () => {
      const sizeStr = localStorage.getItem('cargoradar_font_size') || 'normal';
      setFontSize(sizeStr);
      if (sizeStr === 'large') {
        document.body.classList.add('text-lg-operational');
      } else {
        document.body.classList.remove('text-lg-operational');
      }
    };
    const handleAccent = () => {
      setAccentColor(localStorage.getItem('cargoradar_accent_color') || 'purple');
    };
    const handleThemeChanged = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail === 'light' || customEvent.detail === 'dark') {
        setTheme(customEvent.detail);
      }
    };

    window.addEventListener('stretch-changed', handleStretch);
    window.addEventListener('fontsize-changed', handleFontSize);
    window.addEventListener('accent-changed', handleAccent);
    window.addEventListener('theme-changed', handleThemeChanged);

    // Initial setups
    handleFontSize();

    return () => {
      window.removeEventListener('stretch-changed', handleStretch);
      window.removeEventListener('fontsize-changed', handleFontSize);
      window.removeEventListener('accent-changed', handleAccent);
      window.removeEventListener('theme-changed', handleThemeChanged);
    };
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return loads.filter(load => 
      (load.plate || '').toLowerCase().includes(q) || 
      (load.driverName || '').toLowerCase().includes(q)
    );
  }, [searchQuery, loads]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: newTheme }));
  };

  const requestNotifPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    try {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
      if (permission === 'granted') {
        const testNotif = new Notification('CargaRadar - Alertas Ativos', {
          body: 'Notificações nativas configuradas! Você receberá alertas visuais se houver cargas com divergência no sistema.',
          icon: '/logo.png',
        });
      };
    } catch (err) {
      console.error('Erro ao solicitar permissão de notificação:', err);
    }
  };

  const allTabs = [
    { id: 'expedition' as TabType, label: 'EXPEDIÇÃO', icon: Truck },
    { id: 'central' as TabType, label: 'CENTRAL', icon: LayoutDashboard },
    { id: 'reverse_transfer' as TabType, label: 'REVERSA & TRANSF.', icon: Layers },
    { id: 'tracking' as TabType, label: 'RASTREAMENTO', icon: Compass },
    { id: 'audit' as TabType, label: 'AUDITORIA', icon: ShieldCheck },
    { id: 'analysis' as TabType, label: 'ANÁLISE', icon: BarChart3 },
    { id: 'portaria' as TabType, label: 'PORTARIA', icon: ClipboardCheck },
    { id: 'settings' as TabType, label: 'CONFIGURAÇÕES', icon: Settings },
  ];

  // Logic: Admins see everything. Normal users only see their registered area.
  // Exception: Perfil expedidor ('expedition') has access to both 'expedition' and 'portaria'.
  // 'tracking' is a global feature accessible by all roles except expedition.
  const tabs = allTabs.filter(tab => {
    if (!user) return false;
    if (tab.id === 'settings') return true;
    if (user.systemRole === 'administrator') return true;
    if (user.role === 'store_app' || user.systemRole === 'store_app') {
      return tab.id === 'reverse_transfer' || tab.id === 'tracking';
    }
    if (user.role === 'expedition') {
      return tab.id === 'expedition' || tab.id === 'portaria';
    }
    if (tab.id === 'tracking') return true;
    return tab.id === user.role;
  });

  const blockedCount = React.useMemo(() => {
    return loads.filter(load => load.status === CargoStatus.BLOCKED).length;
  }, [loads]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col lg:flex-row font-sans relative overflow-x-hidden text-slate-800 dark:text-slate-100">
      {/* Watermark Logo */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.015] z-0 flex items-center justify-center overflow-hidden">
        <img src="/logo.png" alt="" className="w-full max-w-4xl transform scale-150 grayscale select-none" />
      </div>

      {/* PERSISTENT LEFT SIDEBAR FOR DESKTOP */}
      {isAuthenticated && (
        <aside className="hidden lg:flex flex-col w-72 bg-[#0a0915] text-white sticky top-0 h-screen border-r border-[#1f1b40] flex-shrink-0 z-30 shadow-2xl">
          {/* Top Branding Header */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-[#1f1b40] bg-[#080714]/50">
            <div className="relative w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-primary-gold overflow-hidden flex-shrink-0">
              <img src="/logo.png" alt="Prev de Perdas" className="w-full h-full object-cover animate-in fade-in zoom-in-50 duration-500" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tighter leading-none text-white uppercase">CARGARADAR</h1>
              <p className="text-[8px] font-black text-primary-gold tracking-[0.2em] uppercase mt-1">Prevenção de Perdas</p>
            </div>
          </div>

          {/* Navigation Sections List */}
          <div className="flex-grow py-6 px-4 space-y-1 overflow-y-auto">
            <p className="text-[9px] font-black tracking-widest text-[#567bb0] uppercase mb-3 px-3">
              Módulos do Sistema
            </p>
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isAuditWithBlocked = tab.id === 'audit' && blockedCount > 0;
                const isActive = activeTab === tab.id;
                
                // Determine active style class based on accent preferences
                let activeBtnClass = 'bg-primary-gold text-white border-primary-gold';
                if (accentColor === 'emerald') activeBtnClass = 'bg-emerald-600 text-white border-emerald-500';
                if (accentColor === 'blue') activeBtnClass = 'bg-[#1e40af] text-white border-blue-500';
                if (accentColor === 'rose') activeBtnClass = 'bg-rose-600 text-white border-rose-500';

                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`flex items-center justify-between w-full px-4 py-3 rounded-2xl text-[10.5px] font-extrabold tracking-wider transition-all duration-200 group border cursor-pointer ${
                      isActive
                        ? `${activeBtnClass} shadow-xl translate-x-1`
                        : 'border-transparent text-slate-350 hover:text-white hover:bg-white/5 hover:border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-primary-gold'
                      }`} />
                      <span className="uppercase text-left">{tab.label}</span>
                    </div>
                    {isAuditWithBlocked && (
                      <span className="bg-red-650 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse border border-red-500/30">
                        {blockedCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Profile and support link inside sidebar */}
          <div className="p-4 border-t border-[#1f1b40] space-y-3 bg-[#080714]/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-gold to-red-650 border border-white/10 flex items-center justify-center text-xs font-black text-white uppercase shadow-md flex-shrink-0">
                {user?.username?.substring(0, 2) || 'OP'}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-white uppercase truncate tracking-tight">{user?.fullName || user?.username}</p>
                <p className="text-[8px] font-bold text-primary-gold uppercase tracking-widest leading-none mt-0.5">{user?.systemRole}</p>
              </div>
            </div>

            {/* Modo Escuro Toggle Switch inside Desktop Sidebar */}
            <div className="flex items-center justify-between bg-white/5 hover:bg-white/10 px-3 py-2.5 rounded-xl border border-white/5 transition-all text-left">
              <span className="text-[9.5px] font-extrabold text-[#8a8ca3] uppercase tracking-wider">Modo Escuro / Turno</span>
              <button
                type="button"
                onClick={toggleTheme}
                id="sidebar-darkmode-toggle"
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-primary-gold focus:ring-offset-1 focus:ring-offset-[#0a0915] ${
                  theme === 'dark' ? 'bg-primary-gold' : 'bg-slate-700'
                }`}
                aria-label="Alternar modo escuro"
              >
                <span
                  id="sidebar-darkmode-knob"
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                    theme === 'dark' ? 'translate-x-4' : 'translate-x-0'
                  }`}
                >
                  {theme === 'dark' ? (
                    <Moon className="w-2.5 h-2.5 text-primary-navy" />
                  ) : (
                    <Sun className="w-2.5 h-2.5 text-amber-500" />
                  )}
                </span>
              </button>
            </div>
            
            <button
              onClick={() => onLogout()}
              className="flex items-center justify-center gap-2 w-full bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white py-2.5 rounded-xl text-[10px] font-black transition-all border border-red-500/20 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>DESCONECTAR SESSÃO</span>
            </button>
          </div>
        </aside>
      )}

      {/* MOBILE SLIDING SIDE NAVIGATION DRAWER */}
      {isAuthenticated && mobileMenuOpen && (
        <div className="fixed inset-0 z-[110] flex lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Sliding drawer list */}
          <div className="relative flex flex-col w-72 max-w-xs bg-[#0a0915] text-white h-full shadow-2xl p-5 space-y-6 animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between border-b border-[#1f1b40] pb-4 border-opacity-70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border-2 border-primary-gold overflow-hidden">
                  <img src="/logo.png" alt="Prev de Perdas" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h1 className="text-sm font-black leading-none text-white">CARGARADAR</h1>
                  <p className="text-[7.5px] font-bold text-primary-gold uppercase mt-0.5 tracking-wider font-mono">PREVENÇÃO DE PERDAS</p>
                </div>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-305 hover:text-white hover:bg-white/10 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-grow space-y-1 overflow-y-auto">
              <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase mb-3 px-3">MÓDULOS DE VERIFICAÇÃO</p>
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isAuditWithBlocked = tab.id === 'audit' && blockedCount > 0;
                  const isActive = activeTab === tab.id;

                  let activeBtnClass = 'bg-primary-gold text-white border-primary-gold';
                  if (accentColor === 'emerald') activeBtnClass = 'bg-emerald-600 text-white border-emerald-500';
                  if (accentColor === 'blue') activeBtnClass = 'bg-[#1e40af] text-white border-blue-500';
                  if (accentColor === 'rose') activeBtnClass = 'bg-rose-600 text-white border-rose-500';

                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        onTabChange(tab.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex items-center justify-between w-full px-4 py-3.5 rounded-xl text-[10.5px] font-extrabold tracking-wider transition-all duration-200 border ${
                        isActive
                          ? activeBtnClass
                          : 'border-transparent text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="uppercase">{tab.label}</span>
                      </div>
                      {isAuditWithBlocked && (
                        <span className="bg-red-650 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                          {blockedCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* User profile & connect bottom */}
            <div className="pt-4 border-t border-[#1f1b40] space-y-3 bg-black/20 p-4 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-gold to-red-600 flex items-center justify-center text-xs font-black text-white uppercase shadow-md">
                  {user?.username?.substring(0, 2) || 'OP'}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-white truncate">{user?.fullName || user?.username}</p>
                  <p className="text-[8px] text-primary-gold uppercase leading-none mt-0.5">{user?.systemRole}</p>
                </div>
              </div>

              {/* Modo Escuro Toggle Switch inside Mobile Sidebar */}
              <div className="flex items-center justify-between bg-white/5 hover:bg-white/10 px-3 py-2.5 rounded-xl border border-white/5 transition-all text-left">
                <span className="text-[9.5px] font-extrabold text-[#8a8ca3] uppercase tracking-wider">Modo Escuro / Turno</span>
                <button
                  type="button"
                  onClick={toggleTheme}
                  id="mobile-darkmode-toggle"
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-primary-gold focus:ring-offset-1 focus:ring-offset-[#0a0915] ${
                    theme === 'dark' ? 'bg-primary-gold' : 'bg-slate-700'
                  }`}
                  aria-label="Alternar modo escuro"
                >
                  <span
                    id="mobile-darkmode-knob"
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                      theme === 'dark' ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  >
                    {theme === 'dark' ? (
                      <Moon className="w-2.5 h-2.5 text-primary-navy" />
                    ) : (
                      <Sun className="w-2.5 h-2.5 text-amber-500" />
                    )}
                  </span>
                </button>
              </div>

              <button
                onClick={() => {
                  onLogout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-2 w-full bg-red-650/20 text-red-400 py-2.5 rounded-xl text-[9.5px] font-black tracking-wider cursor-pointer border border-red-500/10"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>DESCONECTAR SESSÃO</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RIGHT SIDE WORKSPACE WORKFLOW PANEL */}
      <div className="flex-grow flex flex-col min-h-screen min-w-0 bg-slate-50 dark:bg-[#080714] transition-colors duration-250">
        
        {/* TOP SLIM HEADER UTILITY BAR */}
        <header className="bg-primary-navy dark:bg-[#080714] text-white shadow-md sticky top-0 z-40 transition-colors duration-250 border-b border-[#1f1b40]">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              
              {/* Left Indicator - Hamburger for Mobile and Tab Name for Desktop */}
              <div className="flex items-center gap-3">
                {isAuthenticated && (
                  <button 
                    onClick={() => setMobileMenuOpen(true)}
                    className="p-2 bg-white/10 text-slate-100 hover:text-white rounded-xl transition-all cursor-pointer flex items-center justify-center border border-white/10 lg:hidden"
                    title="Abrir Menu Lateral"
                  >
                    <Menu className="w-4 h-4" />
                  </button>
                )}
                
                {/* Branding or Section Indicator */}
                <div className="flex items-center gap-2">
                  <div className="lg:hidden relative w-9 h-9 bg-white keep-white rounded-xl flex items-center justify-center shadow-md overflow-hidden">
                    <img src="/logo.png" alt="Prev de Perdas" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-xs font-black uppercase text-white tracking-widest hidden lg:block select-none mt-0.5">
                      {activeTab === 'expedition' && '📝 EXPEDIÇÃO DE CARGAS'}
                      {activeTab === 'central' && '🖥️ CENTRAL DE LOGÍSTICA'}
                      {activeTab === 'tracking' && '🗺️ RASTREAMENTO MAPA'}
                      {activeTab === 'audit' && '🛡️ AUDITORIA & SEGURANÇA'}
                      {activeTab === 'analysis' && '📊 ANÁLISE OPERACIONAL'}
                      {activeTab === 'portaria' && '📋 PORTARIA DE SINAL'}
                      {activeTab === 'settings' && '⚙️ AJUSTES DO MONITOR'}
                    </h2>
                    <h2 className="text-xs font-black uppercase text-white tracking-widest lg:hidden select-none">
                      CARGARADAR
                    </h2>
                  </div>
                </div>
              </div>

              {/* Global Search Input */}
              {isAuthenticated && (
                <div ref={searchContainerRef} className="relative flex-grow max-w-[120px] xs:max-w-[160px] sm:max-w-[200px] md:max-w-xs xl:max-w-md mx-2 sm:mx-4 z-50">
                  <div className="relative flex items-center bg-white/10 hover:bg-white/15 focus-within:bg-white text-white focus-within:text-slate-800 rounded-2xl border border-white/10 focus-within:border-primary-gold transition-all duration-300 px-3 py-1.5 shadow-inner">
                    <Search className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar placa..."
                      className="ml-2 w-full bg-transparent focus:outline-none text-[11px] font-semibold placeholder:text-slate-400 focus-within:placeholder:text-slate-500 border-none p-0 focus:ring-0 focus:border-transparent focus:text-slate-800"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="p-0.5 hover:bg-slate-200/50 rounded-full transition-colors cursor-pointer">
                        <X className="w-3 h-3 text-slate-400 focus-within:text-slate-600" />
                      </button>
                    )}
                  </div>

                  {/* Dropdown Results */}
                  {searchQuery.trim().length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-150 z-[100] max-h-96 overflow-y-auto overflow-x-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center text-[10px]">
                        <span className="font-black text-slate-400 uppercase tracking-widest">
                          Resultados ({searchResults.length})
                        </span>
                        <span className="font-bold text-slate-400 tracking-widest">ESC para fechar</span>
                      </div>
                      
                      {searchResults.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-[11px]">
                          <Search className="w-6 h-6 mx-auto mb-1.5 opacity-35 text-slate-500" />
                          <p className="font-bold uppercase">Nenhum registro encontrado</p>
                        </div>
                      ) : (
                        <div className="p-1.5 space-y-0.5">
                          {searchResults.map((load) => (
                            <button
                              key={load.id}
                              onClick={() => {
                                setSelectedCargoFromSearch(load);
                                setSearchQuery(''); 
                              }}
                              className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 border border-transparent"
                            >
                              <div className="flex-grow min-w-0 text-xs">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-black text-[9px] text-primary-navy bg-slate-100 px-1.5 py-0.5 rounded border">
                                    {load.plate}
                                  </span>
                                  <span className="font-black text-slate-700 truncate">{load.driverName}</span>
                                </div>
                              </div>
                              <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded ${
                                load.status === CargoStatus.RELEASED ? 'bg-emerald-50 text-emerald-700' :
                                load.status === CargoStatus.BLOCKED ? 'bg-red-50 text-red-700 animate-pulse' : 'bg-amber-50 text-amber-700'
                              }`}>
                                {load.status === CargoStatus.RELEASED ? 'Em Trânsito' :
                                 load.status === CargoStatus.BLOCKED ? 'Divergência' : 'Portaria'}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Utility Badges & settings toggles */}
              <div className="flex items-center gap-2 sm:gap-3.5">
                
                {/* Blocked Badge alerting indicator */}
                {isAuthenticated && blockedCount > 0 && (
                  <button
                    onClick={() => {
                      const hasAuditAccess = user?.systemRole === 'administrator' || user?.role === 'audit';
                      if (hasAuditAccess) {
                        onTabChange('audit');
                      }
                    }}
                    className="relative p-2 bg-red-650 hover:bg-red-700 text-white rounded-xl transition-all border border-red-500 animate-pulse flex items-center justify-center shadow-md cursor-pointer"
                    title={`${blockedCount} bloqueio(s). Clique para ver na Auditoria.`}
                  >
                    <Bell className="w-4 h-4" />
                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-905 text-[8.5px] font-black leading-none text-white items-center justify-center">
                        {blockedCount}
                      </span>
                    </span>
                  </button>
                )}

                {/* Notifications setup permission state */}
                {isAuthenticated && notifPermission !== 'unsupported' && (
                  <button
                    onClick={requestNotifPermission}
                    className={`p-2 rounded-xl transition-all border flex items-center justify-center cursor-pointer relative ${
                      notifPermission === 'granted'
                        ? 'bg-emerald-600/10 hover:bg-emerald-600/15 text-emerald-450 border-emerald-500/20'
                        : 'bg-amber-600/10 hover:bg-amber-600/15 text-amber-450 border-amber-500/20'
                    }`}
                    title={notifPermission === 'granted' ? 'Alertas Nativos Ativos' : 'Ativar Alertas Nativos'}
                  >
                    <Bell className={`w-4 h-4 ${notifPermission === 'granted' ? 'text-emerald-450' : 'text-amber-450'}`} />
                  </button>
                )}

                {/* System Connection Badge Indicator */}
                {isAuthenticated && (
                  <>
                    {isOffline ? (
                      <div 
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600/10 border border-amber-500/30 text-amber-500 rounded-xl text-[9px] font-black uppercase tracking-wider animate-pulse cursor-help"
                        title={`Modo Local (Offline). Última sincronização bem-sucedida: ${lastSyncTime || 'Nenhuma recente nesta sessão'}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                        <span className="hidden sm:inline">MODO LOCAL</span>
                        <span className="sm:hidden">LOCAL</span>
                      </div>
                    ) : (
                      <div 
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/10 border border-emerald-500/30 text-emerald-500 rounded-xl text-[9px] font-black uppercase tracking-wider cursor-help"
                        title={`Sistema conectado ao banco de dados em tempo real. Última sincronização: ${lastSyncTime || 'Agora mesmo'}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="hidden sm:inline">CONECTADO</span>
                        <span className="sm:hidden font-black">ONLINE</span>
                      </div>
                    )}
                  </>
                )}

                {/* Quick Theme Toggle Icon */}
                <button
                  onClick={toggleTheme}
                  className="p-2 bg-white/5 hover:bg-white/10 text-slate-350 hover:text-white rounded-xl border border-white/5 transition-all flex items-center justify-center cursor-pointer"
                  title={theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
                >
                  {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-primary-gold" />}
                </button>

                {/* Avatar Icon */}
                <div 
                  onClick={() => onTabChange('settings')}
                  className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-gold to-red-500 border border-white/10 flex items-center justify-center overflow-hidden cursor-pointer shadow-inner hover:scale-105 active:scale-95 transition-transform"
                  title="Ajustes de Exibição"
                >
                  <span className="text-[10px] font-black text-white">{user?.username?.substring(0, 2).toUpperCase() || 'OP'}</span>
                </div>
              </div>

            </div>
          </div>
        </header>

        {/* MAIN BODY CONTENTS */}
        <main className={`flex-grow transition-all duration-250 pb-16 ${
          stretchMonitor 
            ? 'w-full px-4 sm:px-6 lg:px-8 py-8' 
            : 'max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8'
        }`}>
          <div className="animate-in fade-in duration-500 relative z-10">
            {children}
          </div>
        </main>

        {/* FOOTER */}
        <footer className="bg-white dark:bg-[#080714] border-t border-slate-200 dark:border-[#1f1b40] py-8 transition-colors duration-250 relative z-10">
          <div className="w-full px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-slate-900 rounded flex items-center justify-center">
                <Truck className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-black text-slate-400 uppercase tracking-widest">
                © 2026 CargaRadar Logistics Security
              </span>
            </div>
            <div className="flex gap-6 font-bold text-slate-400 uppercase">
              <span>Protocol: v2.5.0-STABLE</span>
              <span>Status: Operational</span>
            </div>
          </div>
        </footer>

      </div>

      {/* GLOBAL SEARCH DETAILS MODAL */}
      {selectedCargoFromSearch && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 md:p-8 z-[110] overflow-y-auto animate-in fade-in duration-300">
          <div className="relative bg-white border border-slate-100 rounded-[32px] shadow-2xl max-w-4xl w-full flex flex-col overflow-hidden max-h-[90vh] text-slate-800 animate-in zoom-in-95 duration-300">
            {/* Header top */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="font-mono font-black text-xs text-white bg-primary-navy border border-primary-gold px-3 py-1.5 rounded-lg inline-block uppercase tracking-widest shadow-inner">
                  {selectedCargoFromSearch.plate}
                </span>
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border flex items-center gap-1.5 ${
                  selectedCargoFromSearch.status === CargoStatus.RELEASED 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-105' 
                    : selectedCargoFromSearch.status === CargoStatus.BLOCKED 
                      ? 'bg-red-50 text-red-700 border-red-105 animate-pulse' 
                      : 'bg-amber-50 text-amber-700 border-amber-105'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    selectedCargoFromSearch.status === CargoStatus.RELEASED 
                    ? 'bg-emerald-500' 
                    : selectedCargoFromSearch.status === CargoStatus.BLOCKED 
                      ? 'bg-red-500 animate-ping' 
                      : 'bg-amber-500'
                  }`} />
                  {selectedCargoFromSearch.status === CargoStatus.RELEASED ? 'Em Trânsito' :
                   selectedCargoFromSearch.status === CargoStatus.BLOCKED ? 'Divergência Ativa' : 'Aguardando Conferência'}
                </span>
                {selectedCargoFromSearch.isHighRisk && (
                  <span className="bg-red-600 text-white font-black text-[9px] uppercase tracking-widest px-2.5 py-1.5 rounded-lg animate-pulse border border-red-500/30">
                    ⚠️ ALTO RISCO
                  </span>
                )}
              </div>
              <button 
                onClick={() => setSelectedCargoFromSearch(null)}
                className="p-2 hover:bg-slate-105 rounded-full transition-colors font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable details */}
            <div className="p-6 md:p-8 space-y-8 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Core card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Dados do Motorista e Veículo</h3>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center text-slate-500">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Nome do Motorista</p>
                      <p className="text-sm font-black text-slate-805">{selectedCargoFromSearch.driverName}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200/50">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Classificação</p>
                      <p className="text-xs font-bold text-slate-700">{selectedCargoFromSearch.cargoType}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Nº de Paletes</p>
                      <p className="text-xs font-mono font-bold text-slate-700">{selectedCargoFromSearch.palletCount} paletes</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200/50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Número do Lacre (Expedição)</p>
                    <p className="text-xs font-mono font-black text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md inline-block mt-1">
                      🔒 {selectedCargoFromSearch.sealNumber}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-150 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Rota da Viagem</h3>
                    <div className="relative pl-6 space-y-6">
                      <div className="absolute top-1.5 bottom-1.5 left-[7px] w-0.5 border-l-2 border-dashed border-slate-300" />
                      <div className="relative flex items-start gap-3">
                        <div className="absolute -left-[23px] top-1 w-3 h-3 bg-primary-navy border-2 border-white rounded-full" />
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Origem</p>
                          <p className="text-xs font-black text-slate-800">{selectedCargoFromSearch.origin}</p>
                        </div>
                      </div>
                      
                      {selectedCargoFromSearch.additionalDestinations && selectedCargoFromSearch.additionalDestinations.length > 0 && 
                        selectedCargoFromSearch.additionalDestinations.map((dest, idx) => (
                          <div key={idx} className="relative flex items-start gap-3">
                            <div className="absolute -left-[23px] top-1 w-3 h-3 bg-amber-500 border-2 border-white rounded-full" />
                            <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Ponto Intermediário {idx + 1}</p>
                              <p className="text-xs font-bold text-slate-700">{dest}</p>
                            </div>
                          </div>
                        ))
                      }

                      <div className="relative flex items-start gap-3 border-none">
                        <div className="absolute -left-[23px] top-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Destino Final</p>
                          <p className="text-xs font-black text-slate-800">{selectedCargoFromSearch.destination}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-200/50 grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                    <div>
                      <span className="font-bold block">Expedido em:</span>
                      <span className="font-medium text-slate-600">{new Date(selectedCargoFromSearch.createdAt).toLocaleString('pt-BR')}</span>
                    </div>
                    {selectedCargoFromSearch.auditedAt && (
                      <div>
                        <span className="font-bold block">Última Auditoria:</span>
                        <span className="font-medium text-slate-600">{new Date(selectedCargoFromSearch.auditedAt).toLocaleString('pt-BR')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Portaria verification info box */}
              {selectedCargoFromSearch.gateVerified && (
                <div className="border border-emerald-100 bg-emerald-50/20 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ClipboardCheck className="w-5 h-5 text-emerald-500" />
                      <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Verificação & Liberação da Portaria</h4>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9px] font-black uppercase px-2.5 py-1 rounded-md">
                      ✓ Liberado na Portaria
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold text-slate-600">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Validador</p>
                      <p className="text-slate-800 font-extrabold">{selectedCargoFromSearch.gateVerifiedBy}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Data da Saída</p>
                      <p className="text-slate-800">{selectedCargoFromSearch.gateVerifiedAt ? new Date(selectedCargoFromSearch.gateVerifiedAt).toLocaleString('pt-BR') : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Avaliação de Integridade</p>
                      <p className="text-slate-800 capitalize font-bold">{selectedCargoFromSearch.gateStatus || 'Aprovado'}</p>
                    </div>
                  </div>
                  {selectedCargoFromSearch.gateObservation && (
                    <div className="bg-white/70 p-4 rounded-2xl border border-slate-100 text-xs">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Observações da Portaria</p>
                      <p className="text-slate-700 italic font-medium mt-1">{selectedCargoFromSearch.gateObservation}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Photos Gallery Section */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 animate-pulse">Evidências Fotográficas do Processo</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Expedition photos */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Imagens de Expedição (Cadastro)</p>
                    <div className="grid grid-cols-3 gap-2">
                      {getPhotosArray(selectedCargoFromSearch.photoPlate).length > 0 ? (
                        <div 
                          className="relative group h-24 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 cursor-pointer shadow-sm"
                          onClick={() => setZoomPhoto(getPhotosArray(selectedCargoFromSearch.photoPlate)[0])}
                        >
                          <img src={getPhotosArray(selectedCargoFromSearch.photoPlate)[0]} alt="Placa" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye className="w-4 h-4 text-white" />
                          </div>
                          <span className="absolute bottom-1 left-1.5 bg-black/60 text-white text-[8px] px-1 rounded uppercase tracking-wider font-bold">Placa</span>
                        </div>
                      ) : (
                        <div className="h-24 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300">
                          <Eye className="w-4 h-4 opacity-40 mb-1" />
                          <span className="text-[8px] font-bold uppercase tracking-wider">Sem Placa</span>
                        </div>
                      )}

                      {getPhotosArray(selectedCargoFromSearch.photoSeal).length > 0 ? (
                        <div 
                          className="relative group h-24 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 cursor-pointer shadow-sm"
                          onClick={() => setZoomPhoto(getPhotosArray(selectedCargoFromSearch.photoSeal)[0])}
                        >
                          <img src={getPhotosArray(selectedCargoFromSearch.photoSeal)[0]} alt="Lacre" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye className="w-4 h-4 text-white" />
                          </div>
                          <span className="absolute bottom-1 left-1.5 bg-black/60 text-white text-[8px] px-1 rounded uppercase tracking-wider font-bold">Lacre</span>
                        </div>
                      ) : (
                        <div className="h-24 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300">
                          <Eye className="w-4 h-4 opacity-40 mb-1" />
                          <span className="text-[8px] font-bold uppercase tracking-wider">Sem Lacre</span>
                        </div>
                      )}

                      {getPhotosArray(selectedCargoFromSearch.photoManifest).length > 0 ? (
                        <div 
                          className="relative group h-24 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 cursor-pointer shadow-sm"
                          onClick={() => setZoomPhoto(getPhotosArray(selectedCargoFromSearch.photoManifest)[0])}
                        >
                          <img src={getPhotosArray(selectedCargoFromSearch.photoManifest)[0]} alt="NFe/Xml" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye className="w-4 h-4 text-white" />
                          </div>
                          <span className="absolute bottom-1 left-1.5 bg-black/60 text-white text-[8px] px-1 rounded uppercase tracking-wider font-bold">Manif.</span>
                        </div>
                      ) : (
                        <div className="h-24 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300">
                          <Eye className="w-4 h-4 opacity-40 mb-1" />
                          <span className="text-[8px] font-bold uppercase tracking-wider">Sem NFe</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Portaria photos */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Imagens Verificadas na Portaria (Saída)</p>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedCargoFromSearch.gateVerified && getPhotosArray(selectedCargoFromSearch.gatePhotoPlate).length > 0 ? (
                        <div 
                          className="relative group h-24 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 cursor-pointer shadow-sm"
                          onClick={() => setZoomPhoto(getPhotosArray(selectedCargoFromSearch.gatePhotoPlate)[0])}
                        >
                          <img src={getPhotosArray(selectedCargoFromSearch.gatePhotoPlate)[0]} alt="Portaria Placa" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye className="w-4 h-4 text-white" />
                          </div>
                          <span className="absolute bottom-1 left-1.5 bg-black/60 text-white text-[8px] px-1 rounded uppercase tracking-wider font-bold">Placa</span>
                        </div>
                      ) : (
                        <div className="h-24 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300">
                          <Eye className="w-4 h-4 opacity-40 mb-1" />
                          <span className="text-[8px] font-bold uppercase tracking-wider">Aguardando</span>
                        </div>
                      )}

                      {selectedCargoFromSearch.gateVerified && getPhotosArray(selectedCargoFromSearch.gatePhotoSeal).length > 0 ? (
                        <div 
                          className="relative group h-24 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 cursor-pointer shadow-sm"
                          onClick={() => setZoomPhoto(getPhotosArray(selectedCargoFromSearch.gatePhotoSeal)[0])}
                        >
                          <img src={getPhotosArray(selectedCargoFromSearch.gatePhotoSeal)[0]} alt="Portaria Lacre" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye className="w-4 h-4 text-white" />
                          </div>
                          <span className="absolute bottom-1 left-1.5 bg-black/60 text-white text-[8px] px-1 rounded uppercase tracking-wider font-bold">Lacre</span>
                        </div>
                      ) : (
                        <div className="h-24 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300">
                          <Eye className="w-4 h-4 opacity-40 mb-1" />
                          <span className="text-[8px] font-bold uppercase tracking-wider font-medium">Aguardando</span>
                        </div>
                      )}

                      {selectedCargoFromSearch.gateVerified && getPhotosArray(selectedCargoFromSearch.gatePhotoManifest).length > 0 ? (
                        <div 
                          className="relative group h-24 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 cursor-pointer shadow-sm"
                          onClick={() => setZoomPhoto(getPhotosArray(selectedCargoFromSearch.gatePhotoManifest)[0])}
                        >
                          <img src={getPhotosArray(selectedCargoFromSearch.gatePhotoManifest)[0]} alt="Portaria Manifesto" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye className="w-4 h-4 text-white" />
                          </div>
                          <span className="absolute bottom-1 left-1.5 bg-black/60 text-white text-[8px] px-1 rounded uppercase tracking-wider font-bold">Manif.</span>
                        </div>
                      ) : (
                        <div className="h-24 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300">
                          <Eye className="w-4 h-4 opacity-40 mb-1" />
                          <span className="text-[8px] font-bold uppercase tracking-wider">Aguardando</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Occurrence timeline if present */}
              {selectedCargoFromSearch.occurrenceHistory && selectedCargoFromSearch.occurrenceHistory.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <h4 className="text-xs font-black uppercase text-rose-800 tracking-wider">Histórico de Ocorrências / Divergências de Rota</h4>
                  </div>
                  <div className="space-y-4">
                    {selectedCargoFromSearch.occurrenceHistory.map((occ, idx) => (
                      <div key={idx} className="bg-white border border-rose-100 rounded-2xl p-4 text-xs space-y-2 relative shadow-sm">
                        <div className="flex justify-between items-center bg-rose-50 px-2 py-1.5 rounded-lg border border-rose-200/20">
                          <span className="font-extrabold text-rose-850 uppercase text-[9.5px]">{occ.type}</span>
                          <span className="text-[9px] text-slate-400 font-bold">{new Date(occ.timestamp).toLocaleString('pt-BR')}</span>
                        </div>
                        <p className="text-slate-600 font-medium leading-relaxed">{occ.description}</p>
                        <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                          <span>Auditor: <strong className="text-slate-655 font-black">{occ.auditor}</strong></span>
                          {occ.photo && getPhotosArray(occ.photo).length > 0 && (
                            <button 
                              onClick={() => setZoomPhoto(getPhotosArray(occ.photo)[0])}
                              className="text-[9px] font-black uppercase tracking-wider text-rose-600 hover:text-rose-500 cursor-pointer"
                            >
                              Ver Foto em Anexo
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick action bar */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-wrap gap-3 items-center justify-between flex-shrink-0">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:inline-block">Ações de Prevenção de Perdas</span>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    onTabChange('tracking');
                    setSelectedCargoFromSearch(null);
                  }}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md cursor-pointer flex-grow sm:flex-grow-0"
                >
                  <Compass className="w-4 h-4" />
                  Rastrear no Mapa
                </button>
                <button
                  onClick={() => {
                    onTabChange('central');
                    setSelectedCargoFromSearch(null);
                  }}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#0a192f] hover:bg-[#122e54] text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-200 shadow-md cursor-pointer flex-grow sm:flex-grow-0"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Interagir na Central
                </button>
                {user?.role === 'expedition' && (
                  <>
                    <button
                      onClick={() => {
                        onTabChange('portaria');
                        setSelectedCargoFromSearch(null);
                      }}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md cursor-pointer flex-grow sm:flex-grow-0"
                    >
                      <ClipboardCheck className="w-4 h-4" />
                      Portaria Saída
                    </button>
                    <button
                      onClick={() => {
                        onTabChange('expedition');
                        setSelectedCargoFromSearch(null);
                      }}
                      className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex-grow sm:flex-grow-0"
                    >
                      <Truck className="w-4 h-4" />
                      Expedição
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelectedCargoFromSearch(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex-grow sm:flex-grow-0"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REUSABLE LIGHTBOX OR PHOTO ZOOM OVERLAY */}
      {zoomPhoto && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-[200] p-4 text-white animate-in fade-in duration-300">
          <button 
            onClick={() => setZoomPhoto(null)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-4xl max-h-[85vh] w-full flex items-center justify-center relative">
            <img src={zoomPhoto} alt="Zoom" className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300" referrerPolicy="no-referrer" />
          </div>
        </div>
      )}

      {isAuthenticated && <FeedbackChat currentUser={user} />}
    </div>
  );
};
