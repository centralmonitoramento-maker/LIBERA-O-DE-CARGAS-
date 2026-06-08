
import React from 'react';
import { LogOut, LayoutDashboard, Truck, ShieldCheck, BarChart3, Bell, BellOff, Sun, Moon, ClipboardCheck } from 'lucide-react';

import { User, CargoLoad, CargoStatus } from '../types';

type TabType = 'expedition' | 'central' | 'audit' | 'analysis' | 'portaria';

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

  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

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
    { id: 'audit' as TabType, label: 'AUDITORIA', icon: ShieldCheck },
    { id: 'analysis' as TabType, label: 'ANÁLISE', icon: BarChart3 },
    { id: 'portaria' as TabType, label: 'PORTARIA', icon: ClipboardCheck },
  ];

  // Logic: Admins see everything. Normal users only see their registered area.
  // Exception: Perfil expedidor ('expedition') has access to both 'expedition' and 'portaria'.
  const tabs = allTabs.filter(tab => {
    if (!user) return false;
    if (user.systemRole === 'administrator') return true;
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
    </div>
  );
};
