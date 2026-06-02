
import React from 'react';
import { LogOut, LayoutDashboard, Truck, ShieldCheck, BarChart3 } from 'lucide-react';

import { User } from '../types';

type TabType = 'expedition' | 'central' | 'audit' | 'analysis';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onLogout: () => void;
  isAuthenticated: boolean;
  user: User | null;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  onTabChange, 
  onLogout,
  isAuthenticated,
  user
}) => {
  const allTabs = [
    { id: 'expedition' as TabType, label: 'EXPEDIÇÃO', icon: Truck },
    { id: 'central' as TabType, label: 'CENTRAL', icon: LayoutDashboard },
    { id: 'audit' as TabType, label: 'AUDITORIA', icon: ShieldCheck },
    { id: 'analysis' as TabType, label: 'ANÁLISE', icon: BarChart3 },
  ];

  // Logic: Admins see everything. Normal users only see their registered area.
  const tabs = allTabs.filter(tab => {
    if (!user) return false;
    if (user.systemRole === 'administrator') return true;
    return tab.id === user.role;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative overflow-x-hidden">
      {/* Watermark Logo */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0 flex items-center justify-center overflow-hidden">
        <img src="/logo.png" alt="" className="w-full max-w-4xl transform scale-150 rotate-12 grayscale select-none" />
      </div>

      {/* Header */}
      <header className="bg-primary-navy text-white shadow-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-4 group cursor-pointer" onClick={() => onTabChange(user?.role as TabType || 'expedition')}>
              <div className="relative w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300 overflow-hidden border-2 border-primary-gold">
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
                  return (
                    <button
                      key={tab.id}
                      onClick={() => onTabChange(tab.id)}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-black tracking-wider transition-all duration-300 ${
                        activeTab === tab.id
                          ? 'bg-primary-gold text-white shadow-lg scale-105'
                          : 'text-slate-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            )}

            <div className="flex items-center gap-4">
              {isAuthenticated && (
                <div className="hidden md:flex flex-col items-end mr-2">
                  <span className="text-[10px] font-black text-white uppercase tracking-tight">{user?.fullName || user?.username}</span>
                  <span className="text-[8px] font-bold text-primary-gold uppercase tracking-widest">{user?.systemRole}</span>
                </div>
              )}
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
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`p-3 rounded-xl transition-all ${
                  activeTab === tab.id ? 'bg-primary-gold text-white shadow-inner' : 'text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
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
