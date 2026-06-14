
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
  FileSpreadsheet
} from 'lucide-react';

import { User, CargoLoad, CargoStatus, CargoType, OccurrenceType, getPhotosArray } from '../types';
import { FeedbackChat } from './FeedbackChat';

type TabType = 'expedition' | 'central' | 'audit' | 'analysis' | 'portaria' | 'tracking';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onLogout: () => void;
  isAuthenticated: boolean;
  user: User | null;
  loads?: CargoLoad[];
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  onTabChange, 
  onLogout,
  isAuthenticated,
  user,
  loads = []
}) => {
  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [notifPermission, setNotifPermission] = React.useState<NotificationPermission | 'unsupported'>(() => {
    if (typeof window === 'undefined') return 'default';
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  });

  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCargoFromSearch, setSelectedCargoFromSearch] = React.useState<CargoLoad | null>(null);
  const [zoomPhoto, setZoomPhoto] = React.useState<string | null>(null);

  const searchContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

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
      load.plate.toLowerCase().includes(q) || 
      (load.driverName || '').toLowerCase().includes(q)
    );
  }, [searchQuery, loads]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
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
    { id: 'tracking' as TabType, label: 'RASTREAMENTO', icon: Compass },
    { id: 'audit' as TabType, label: 'AUDITORIA', icon: ShieldCheck },
    { id: 'analysis' as TabType, label: 'ANÁLISE', icon: BarChart3 },
    { id: 'portaria' as TabType, label: 'PORTARIA', icon: ClipboardCheck },
  ];

  // Logic: Admins see everything. Normal users only see their registered area.
  // Exception: Perfil expedidor ('expedition') has access to both 'expedition' and 'portaria'.
  // 'tracking' is a global feature accessible by all roles.
  const tabs = allTabs.filter(tab => {
    if (!user) return false;
    if (user.systemRole === 'administrator') return true;
    if (tab.id === 'tracking') return true;
    if (user.role === 'expedition') {
      return tab.id === 'expedition' || tab.id === 'portaria';
    }
    return tab.id === user.role;
  });

  const blockedCount = React.useMemo(() => {
    return loads.filter(load => load.status === CargoStatus.BLOCKED).length;
  }, [loads]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative overflow-x-hidden">
      {/* Watermark Logo */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0 flex items-center justify-center overflow-hidden">
        <img src="/logo.png" alt="" className="w-full max-w-4xl transform scale-150 grayscale select-none" />
      </div>

      {/* Header */}
      <header className="bg-primary-navy text-white shadow-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-4 group cursor-pointer" onClick={() => onTabChange(user?.role as TabType || 'expedition')}>
              <div className="relative w-14 h-14 bg-white keep-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300 overflow-hidden border-2 border-primary-gold">
                <img src="/logo.png" alt="Prev de Perdas" className="w-full h-full object-cover" onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                }} />
                <Truck className="fallback-icon hidden w-8 h-8 text-primary-navy" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-black tracking-tighter leading-none text-white">CARGARADAR</h1>
                <p className="text-[10px] font-bold text-primary-gold tracking-[0.2em] uppercase">Prevenção de Perdas</p>
              </div>
            </div>

            {/* Global Search Input */}
            {isAuthenticated && (
              <div ref={searchContainerRef} className="relative flex-grow max-w-[140px] xs:max-w-[170px] sm:max-w-[220px] md:max-w-xs xl:max-w-md mx-2 sm:mx-4 z-50">
                <div className="relative flex items-center bg-white/10 hover:bg-white/15 focus-within:bg-white text-white focus-within:text-slate-800 rounded-2xl border border-white/10 focus-within:border-primary-gold transition-all duration-300 px-3 py-2 shadow-inner">
                  <Search className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar placa ou motorista..."
                    className="ml-2 w-full bg-transparent focus:outline-none text-xs font-semibold placeholder:text-slate-400 focus-within:placeholder:text-slate-500 border-none p-0 focus:ring-0 focus:border-transparent focus:text-slate-800"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="p-0.5 hover:bg-slate-250/50 rounded-full transition-colors cursor-pointer">
                      <X className="w-3.5 h-3.5 text-slate-400 focus-within:text-slate-600" />
                    </button>
                  )}
                </div>

                {/* Dropdown Results */}
                {searchQuery.trim().length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white text-slate-800 rounded-3xl shadow-2xl border border-slate-150 z-[100] max-h-96 overflow-y-auto overflow-x-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Resultados encontrados ({searchResults.length})
                      </span>
                      {searchResults.length > 0 && (
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                          Pressione Esc para fechar
                        </span>
                      )}
                    </div>
                    
                    {searchResults.length === 0 ? (
                      <div className="p-8 text-center text-slate-400">
                        <Search className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-500 animate-pulse" />
                        <p className="text-[11px] font-bold uppercase tracking-wider">Nenhum registro encontrado</p>
                        <p className="text-[9px] opacity-75 mt-1">Busque pela placa exata ou pelo nome do motorista</p>
                      </div>
                    ) : (
                      <div className="p-2 space-y-1">
                        {searchResults.map((load) => (
                          <button
                            key={load.id}
                            onClick={() => {
                              setSelectedCargoFromSearch(load);
                              setSearchQuery(''); 
                            }}
                            className="w-full text-left p-3 rounded-2xl hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 border border-transparent hover:border-slate-100"
                          >
                            <div className="flex-grow min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-[10px] text-primary-navy bg-slate-100 px-2 py-0.5 rounded border border-slate-255">
                                  {load.plate}
                                </span>
                                <span className="text-[11px] font-black text-slate-700 truncate block">
                                  {load.driverName}
                                </span>
                              </div>
                              <p className="text-[10px] font-medium text-slate-400 truncate mt-1">
                                {load.origin} ➔ {load.destination}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                                load.status === CargoStatus.RELEASED ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                load.status === CargoStatus.BLOCKED ? 'bg-red-50 text-red-700 border-red-100 animate-pulse' : 'bg-amber-50 text-amber-700 border-amber-100'
                              }`}>
                                {load.status === CargoStatus.RELEASED ? 'Em Trânsito' :
                                 load.status === CargoStatus.BLOCKED ? 'Divergência' : 'Portaria'}
                              </span>
                              <span className="text-[8px] text-slate-400 font-bold">
                                {new Date(load.createdAt).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {isAuthenticated && (
              <nav className="hidden lg:flex items-center gap-1 bg-white/10 p-1 rounded-2xl border border-white/10">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isAuditWithBlocked = tab.id === 'audit' && blockedCount > 0;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => onTabChange(tab.id)}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-black tracking-wider transition-all duration-300 relative ${
                        activeTab === tab.id
                          ? 'bg-primary-gold text-white shadow-lg scale-105'
                          : 'text-slate-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span className="relative">
                        <Icon className="w-4 h-4" />
                        {isAuditWithBlocked && (
                          <span className="absolute -top-1 -right-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          </span>
                        )}
                      </span>
                      {tab.label}
                      {isAuditWithBlocked && (
                        <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full ml-1 animate-pulse">
                          {blockedCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            )}

            <div className="flex items-center gap-4">
              {isAuthenticated && blockedCount > 0 && (
                <button
                  onClick={() => {
                    const hasAuditAccess = user?.systemRole === 'administrator' || user?.role === 'audit';
                    if (hasAuditAccess) {
                      onTabChange('audit');
                    }
                  }}
                  className="relative p-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all border border-red-500 shadow-md flex items-center justify-center animate-pulse"
                  title={`${blockedCount} carga(s) bloqueada(s). Clique para ver na Auditoria.`}
                >
                  <Bell className="w-5 h-5 animate-bounce" />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-800 text-[10px] font-black leading-none text-white items-center justify-center">
                      {blockedCount}
                    </span>
                  </span>
                </button>
              )}

              {isAuthenticated && (
                <div className="hidden md:flex flex-col items-end mr-2">
                  <span className="text-[10px] font-black text-white uppercase tracking-tight">{user?.fullName || user?.username}</span>
                  <span className="text-[8px] font-bold text-primary-gold uppercase tracking-widest">{user?.systemRole}</span>
                </div>
              )}
              {isAuthenticated && notifPermission !== 'unsupported' && (
                <button
                  onClick={requestNotifPermission}
                  className={`p-2.5 rounded-xl transition-all border flex items-center justify-center cursor-pointer relative ${
                    notifPermission === 'granted'
                      ? 'bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border-emerald-500/20'
                      : notifPermission === 'denied'
                      ? 'bg-red-650/10 hover:bg-red-650/20 text-red-450 border-red-500/20'
                      : 'bg-amber-600/10 hover:bg-amber-600/20 text-amber-500 border-amber-500/20 animate-pulse'
                  }`}
                  title={
                    notifPermission === 'granted'
                      ? 'Notificações de Alerta de Divergência Ativas'
                      : notifPermission === 'denied'
                      ? 'Notificações Bloqueadas pelo Navegador. Clique para saber como ativar.'
                      : 'Ativar Notificações no Navegador'
                  }
                >
                  {notifPermission === 'granted' ? (
                    <>
                      <Bell className="w-4 h-4 text-emerald-400" />
                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-duration-1000"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    </>
                  ) : notifPermission === 'denied' ? (
                    <BellOff className="w-4 h-4 text-red-450" />
                  ) : (
                    <Bell className="w-4 h-4 text-amber-500" />
                  )}
                </button>
              )}

              <button
                onClick={toggleTheme}
                className="p-2.5 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white rounded-xl transition-all border border-white/10 flex items-center justify-center cursor-pointer"
                title={theme === 'light' ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'}
              >
                {theme === 'light' ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4 text-primary-gold" />
                )}
              </button>

              {isAuthenticated && (
                <button
                  onClick={() => onLogout()}
                  className="flex items-center gap-2 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black transition-all border border-red-500/20"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">SAIR</span>
                </button>
              )}
              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-primary-gold to-primary-red opacity-80"></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Nav */}
      {isAuthenticated && (
        <div className="lg:hidden bg-primary-navy border-t border-white/10 px-4 py-2 flex justify-around sticky top-20 z-40 shadow-lg">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isAuditWithBlocked = tab.id === 'audit' && blockedCount > 0;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`p-3 rounded-xl transition-all relative ${
                  activeTab === tab.id ? 'bg-primary-gold text-white shadow-inner' : 'text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                {isAuditWithBlocked && (
                  <span className="absolute top-2 right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-in fade-in duration-700">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-slate-900 rounded flex items-center justify-center">
              <Truck className="w-3 h-3 text-white" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              © 2026 CargaRadar Logistics Security
            </span>
          </div>
          <div className="flex gap-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Protocol: v2.5.0-STABLE</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Status: System Operational</span>
          </div>
        </div>
      </footer>

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
