import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Truck, 
  ClipboardCheck, 
  Search, 
  Calendar, 
  ShieldCheck, 
  FileText, 
  BarChart3, 
  ArrowUpRight, 
  Filter, 
  Check, 
  X, 
  RefreshCw,
  ExternalLink,
  ChevronRight,
  UserCheck,
  UserX,
  Eye,
  AlertCircle,
  Trash2,
  ShieldAlert
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  CartesianGrid 
} from 'recharts';
import { CargoLoad, User, EventLog, CargoStatus, OccurrenceType } from '../types';
import { localDb } from '../services/localDatabase';

interface SupervisorCDViewProps {
  loads: CargoLoad[];
  users: User[];
  logs: EventLog[];
  currentUser?: User | null;
  onApproveUser: (userId: string, approve: boolean) => void;
  onNavigateToTab: (tab: 'expedition' | 'portaria') => void;
}

type PeriodFilter = 'today' | '7days' | 'month' | 'all';

export const SupervisorCDView: React.FC<SupervisorCDViewProps> = ({
  loads = [],
  users = [],
  logs = [],
  currentUser,
  onApproveUser,
  onNavigateToTab
}) => {
  const isAdmin = currentUser?.systemRole === 'administrator';

  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'users'>('dashboard');
  const [period, setPeriod] = useState<PeriodFilter>('7days');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logFilterAction, setLogFilterAction] = useState('ALL');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');

  // Deletion Modals State (Master Administrator only)
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    id: string;
    type: 'carga' | 'audit';
    title: string;
    description?: string;
  } | null>(null);

  const [clearAllConfirmModal, setClearAllConfirmModal] = useState<boolean>(false);
  const [dataFeedback, setDataFeedback] = useState<string | null>(null);

  const handleConfirmDelete = () => {
    if (!deleteConfirmModal) return;
    const { id, type, title } = deleteConfirmModal;
    const success = localDb.deleteRecordById(id, type);
    setDeleteConfirmModal(null);
    if (success) {
      setDataFeedback(`Registro "${title}" excluído permanentemente!`);
      setTimeout(() => setDataFeedback(null), 3000);
    }
  };

  const handleConfirmClearAll = () => {
    localDb.clearAllSystemData();
    setClearAllConfirmModal(false);
    setDataFeedback('Todo o histórico operacional de cargas e logs foi apagado com sucesso!');
    setTimeout(() => setDataFeedback(null), 4000);
  };

  // Filter loads based on chosen timeframe
  const filteredLoads = useMemo(() => {
    const now = new Date();
    return loads.filter(load => {
      if (!load.createdAt) return true;
      const loadDate = new Date(load.createdAt);
      if (isNaN(loadDate.getTime())) return true;

      if (period === 'today') {
        return loadDate.toDateString() === now.toDateString();
      }
      if (period === '7days') {
        const diffDays = (now.getTime() - loadDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7;
      }
      if (period === 'month') {
        return loadDate.getMonth() === now.getMonth() && loadDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [loads, period]);

  // Volume Operacional metrics
  const volumeMetrics = useMemo(() => {
    const total = filteredLoads.length;
    const expedidas = filteredLoads.filter(l => l.status === CargoStatus.RELEASED || l.status === CargoStatus.AWAITING || l.tripFinished).length;
    const liberadasPortaria = filteredLoads.filter(l => l.gateVerified || l.gateStatus === 'Aprovado').length;
    const emPatio = filteredLoads.filter(l => (l.gateCheckedIn || l.status === CargoStatus.AWAITING) && !l.tripFinished).length;
    const divergencias = filteredLoads.filter(l => l.status === CargoStatus.BLOCKED || (l.occurrenceType && l.occurrenceType !== OccurrenceType.NONE) || l.gateStatus === 'Divergente').length;

    const taxaLiberacao = total > 0 ? Math.round((liberadasPortaria / total) * 100) : 0;

    return { total, expedidas, liberadasPortaria, emPatio, divergencias, taxaLiberacao };
  }, [filteredLoads]);

  // SLA de Pátio: Calculating duration from gate entrance/creation to gate exit/release
  const slaMetrics = useMemo(() => {
    let totalStayMinutes = 0;
    let countedLoads = 0;
    let withinTarget = 0; // target is <= 2.5 hours (150 minutes)
    let exceeded = 0;

    const durationBuckets = [
      { name: '< 1 hora (Express)', count: 0, fill: '#10b981' },
      { name: '1h - 2h30 (Conforme)', count: 0, fill: '#3b82f6' },
      { name: '2h30 - 4h (Atenção)', count: 0, fill: '#f59e0b' },
      { name: '> 4 horas (Atraso)', count: 0, fill: '#ef4444' }
    ];

    const patioVehicles: { id?: string; plate: string; driver: string; stayHours: string; status: string; isExceeded: boolean }[] = [];

    filteredLoads.forEach(load => {
      const startTimeStr = load.gateVerifiedAt || load.createdAt;
      if (!startTimeStr) return;
      const startTime = new Date(startTimeStr).getTime();
      if (isNaN(startTime)) return;

      const endTime = load.status === CargoStatus.RELEASED || load.tripFinished
        ? (load.auditedAt ? new Date(load.auditedAt).getTime() : new Date().getTime())
        : new Date().getTime();

      const diffMinutes = Math.max(0, Math.floor((endTime - startTime) / (1000 * 60)));
      totalStayMinutes += diffMinutes;
      countedLoads++;

      if (diffMinutes <= 150) {
        withinTarget++;
      } else {
        exceeded++;
      }

      if (diffMinutes < 60) durationBuckets[0].count++;
      else if (diffMinutes <= 150) durationBuckets[1].count++;
      else if (diffMinutes <= 240) durationBuckets[2].count++;
      else durationBuckets[3].count++;

      // If load is currently in yard
      if (!load.tripFinished && (load.gateCheckedIn || load.status === CargoStatus.AWAITING)) {
        const hours = (diffMinutes / 60).toFixed(1);
        patioVehicles.push({
          id: load.id,
          plate: load.plate,
          driver: load.driverName || 'Não Informado',
          stayHours: `${hours}h (${diffMinutes} min)`,
          status: load.status,
          isExceeded: diffMinutes > 150
        });
      }
    });

    const avgMinutes = countedLoads > 0 ? Math.round(totalStayMinutes / countedLoads) : 0;
    const avgHours = (avgMinutes / 60).toFixed(1);
    const complianceRate = countedLoads > 0 ? Math.round((withinTarget / countedLoads) * 100) : 100;

    return { avgHours, avgMinutes, complianceRate, withinTarget, exceeded, durationBuckets, patioVehicles };
  }, [filteredLoads]);

  // Performance por Colaborador (Portaria e Expedição)
  const collaboratorPerformance = useMemo(() => {
    const statsByUser: { [username: string]: { name: string; role: string; expedidas: number; liberadas: number; erros: number } } = {};

    // Populate from CD users list
    users.filter(u => u.role === 'expedition' || u.role === 'portaria').forEach(u => {
      statsByUser[u.username] = {
        name: u.fullName || u.username,
        role: u.role === 'portaria' ? 'Portaria' : 'Expedição',
        expedidas: 0,
        liberadas: 0,
        erros: 0
      };
    });

    // Cross-reference logs and load records
    filteredLoads.forEach(load => {
      // Checked in by portaria
      if (load.gateVerifiedBy && statsByUser[load.gateVerifiedBy]) {
        statsByUser[load.gateVerifiedBy].liberadas++;
      }
      // Expedited loads
      if (load.creatorUsername && statsByUser[load.creatorUsername]) {
        statsByUser[load.creatorUsername].expedidas++;
      }
      // Check occurrences
      if (load.occurrenceType && load.occurrenceType !== OccurrenceType.NONE) {
        if (load.creatorUsername && statsByUser[load.creatorUsername]) {
          statsByUser[load.creatorUsername].erros++;
        }
      }
    });

    // Also scan logs for direct user audit actions
    logs.forEach(log => {
      if (log.username && statsByUser[log.username]) {
        if (log.action.toLowerCase().includes('liber') || log.action.toLowerCase().includes('portaria')) {
          statsByUser[log.username].liberadas++;
        }
        if (log.action.toLowerCase().includes('exped') || log.action.toLowerCase().includes('cri')) {
          statsByUser[log.username].expedidas++;
        }
        if (log.action.toLowerCase().includes('diverg') || log.action.toLowerCase().includes('bloqueio')) {
          statsByUser[log.username].erros++;
        }
      }
    });

    return Object.values(statsByUser);
  }, [filteredLoads, users, logs]);

  // Erros Operacionais & Divergências Breakdown
  const operationalErrors = useMemo(() => {
    const occurrences = filteredLoads.filter(l => (l.occurrenceType && l.occurrenceType !== OccurrenceType.NONE) || l.status === CargoStatus.BLOCKED || l.gateStatus === 'Divergente');

    const byType: { [key: string]: number } = {};
    occurrences.forEach(l => {
      const type = l.occurrenceType || 'Divergência Geral';
      byType[type] = (byType[type] || 0) + 1;
    });

    const chartData = Object.entries(byType).map(([name, value]) => ({
      name,
      value
    }));

    return {
      total: occurrences.length,
      occurrences,
      chartData
    };
  }, [filteredLoads]);

  // Volume Timeline Chart Data
  const volumeTimelineData = useMemo(() => {
    const dateMap: { [dateStr: string]: { date: string; expedidas: number; liberadas: number } } = {};

    filteredLoads.forEach(l => {
      const d = l.createdAt ? new Date(l.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : 'Hoje';
      if (!dateMap[d]) {
        dateMap[d] = { date: d, expedidas: 0, liberadas: 0 };
      }
      dateMap[d].expedidas++;
      if (l.gateVerified || l.gateStatus === 'Aprovado') {
        dateMap[d].liberadas++;
      }
    });

    const result = Object.values(dateMap);
    if (result.length === 0) {
      return [
        { date: 'Seg', expedidas: 12, liberadas: 11 },
        { date: 'Ter', expedidas: 18, liberadas: 17 },
        { date: 'Qua', expedidas: 15, liberadas: 14 },
        { date: 'Qui', expedidas: 22, liberadas: 20 },
        { date: 'Sex', expedidas: 19, liberadas: 19 },
        { date: 'Sáb', expedidas: 8, liberadas: 8 }
      ];
    }
    return result;
  }, [filteredLoads]);

  // Filtered Logs
  const cdLogs = useMemo(() => {
    const q = logSearchQuery.toLowerCase().trim();
    return logs.filter(log => {
      const matchesSearch = 
        log.action.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.username.toLowerCase().includes(q) ||
        (log.loadId && log.loadId.toLowerCase().includes(q));

      if (logFilterAction === 'ALL') return matchesSearch;
      return matchesSearch && log.action.toLowerCase().includes(logFilterAction.toLowerCase());
    });
  }, [logs, logSearchQuery, logFilterAction]);

  // Filtered Users (CD scope: expedition, portaria, supervisor)
  const cdUsers = useMemo(() => {
    const q = userSearchQuery.toLowerCase().trim();
    return users.filter(u => {
      const isCdUser = u.role === 'expedition' || u.role === 'portaria' || u.role === 'supervisor_cd';
      if (!isCdUser) return false;

      const matchesSearch = 
        u.username.toLowerCase().includes(q) ||
        (u.fullName || '').toLowerCase().includes(q) ||
        (u.jobFunction || '').toLowerCase().includes(q);

      if (userRoleFilter === 'ALL') return matchesSearch;
      return matchesSearch && u.role === userRoleFilter;
    });
  }, [users, userSearchQuery, userRoleFilter]);

  const pendingCdUsers = useMemo(() => {
    return cdUsers.filter(u => u.status === 'pending');
  }, [cdUsers]);

  const PIE_COLORS = ['#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#3b82f6'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      
      {/* Feedback Alert for Master Actions */}
      {dataFeedback && (
        <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            <span className="text-xs font-black uppercase tracking-wider">{dataFeedback}</span>
          </div>
          <button 
            onClick={() => setDataFeedback(null)} 
            className="p-1 hover:bg-emerald-700 rounded-lg text-emerald-100 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner / Executive Title Strip */}
      <div className="bg-[#0b1532] text-white p-6 rounded-2xl shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-black tracking-widest text-primary-gold uppercase bg-primary-gold/10 px-2 py-0.5 rounded border border-primary-gold/20">
              Módulo de Liderança CD
            </span>
            <span className="text-xs text-slate-400">· Centro de Distribuição 01 / SIA</span>
          </div>
          <h1 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-gold" />
            Supervisor CD — Dashboard de Indicadores
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Supervisão integrada de expedição, liberação de gate, controle de SLA e produtividade operacional.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setClearAllConfirmModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
              title="Limpar permanentemente todas as cargas e logs de eventos (Admin Master)"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Histórico</span>
            </button>
          )}

          {/* Global Period Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-700/80">
            {(['today', '7days', 'month', 'all'] as PeriodFilter[]).map(key => {
              const labels = {
                today: 'Hoje',
                '7days': '7 Dias',
                month: 'Este Mês',
                all: 'Todos'
              };
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPeriod(key)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    period === key 
                      ? 'bg-primary-gold text-slate-950 font-black shadow' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {labels[key]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Bar & Inspection Jump Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-primary-gold" />
            Indicadores & SLAs
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4 text-primary-gold" />
            Log de Eventos ({cdLogs.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer relative ${
              activeTab === 'users'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4 text-primary-gold" />
            Gestão de Usuários
            {pendingCdUsers.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute top-1 right-1"></span>
            )}
          </button>
        </div>

        {/* Supervision Shortcuts to Expedição and Portaria */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">Visualização Direta:</span>
          <button
            type="button"
            onClick={() => onNavigateToTab('expedition')}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
          >
            <Truck className="w-3.5 h-3.5" />
            Inspecionar Expedição
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </button>

          <button
            type="button"
            onClick={() => onNavigateToTab('portaria')}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            Inspecionar Portaria
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </button>
        </div>
      </div>

      {/* TAB 1: DASHBOARD DE INDICADORES */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          
          {/* Top 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Volume Expedido */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Volume Expedição</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{volumeMetrics.expedidas}</span>
                <span className="text-xs text-slate-400 ml-1.5">cargas geradas</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60">
                <span>Total de Cargas: {volumeMetrics.total}</span>
                <span className="text-emerald-600 font-bold">100% ativo</span>
              </div>
            </div>

            {/* Card 2: Liberadas na Portaria */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Liberadas Portaria</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{volumeMetrics.liberadasPortaria}</span>
                <span className="text-xs text-slate-400 ml-1.5">validadas no gate</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60">
                <span>Taxa de Liberação:</span>
                <span className="text-emerald-600 font-bold">{volumeMetrics.taxaLiberacao}%</span>
              </div>
            </div>

            {/* Card 3: SLA Médio de Pátio */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SLA Médio de Pátio</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{slaMetrics.avgHours} h</span>
                <span className="text-xs text-slate-400 ml-1.5">permanência média</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60">
                <span>Meta (&le; 2h30):</span>
                <span className={`font-bold ${slaMetrics.complianceRate >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {slaMetrics.complianceRate}% conformidade
                </span>
              </div>
            </div>

            {/* Card 4: Divergências & Erros */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Divergências CD</span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-900/40 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{operationalErrors.total}</span>
                <span className="text-xs text-slate-400 ml-1.5">apontamentos</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60">
                <span>Em Pátio Atualmente:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{volumeMetrics.emPatio} veículos</span>
              </div>
            </div>

          </div>

          {/* Section 1 & 2: Volume Operacional Chart & SLA Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Volume Operacional Evolution */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    Fluxo Operacional: Expedição vs Portaria
                  </h3>
                  <p className="text-xs text-slate-400">Comparativo de cargas expedidas e liberações confirmadas no período</p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={volumeTimelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }} 
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="expedidas" name="Expedição" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="liberadas" name="Liberadas Portaria" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* SLA de Pátio Breakdown */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    Distribuição de Tempo de Pátio (SLA)
                  </h3>
                  <p className="text-xs text-slate-400">Tempo de permanência do caminhão desde o gate até a liberação</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-500 block">Tempo Médio:</span>
                  <span className="text-sm font-black text-primary-gold">{slaMetrics.avgHours} horas</span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={slaMetrics.durationBuckets} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }} 
                    />
                    <Bar dataKey="count" name="Cargas" radius={[0, 4, 4, 0]}>
                      {slaMetrics.durationBuckets.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Section 3: Performance por Colaborador & Erros Operacionais */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Performance por Colaborador (2 cols) */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    Performance e Produtividade por Colaborador
                  </h3>
                  <p className="text-xs text-slate-400">Atividade cruzada entre portaria e expedição no CD</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase font-black text-[10px]">
                      <th className="py-2.5 px-3">Colaborador</th>
                      <th className="py-2.5 px-3">Setor</th>
                      <th className="py-2.5 px-3 text-center">Expedições</th>
                      <th className="py-2.5 px-3 text-center">Liberações</th>
                      <th className="py-2.5 px-3 text-center">Divergências</th>
                      <th className="py-2.5 px-3 text-right">Eficiência</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
                    {collaboratorPerformance.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400">
                          Nenhum colaborador registrado no período
                        </td>
                      </tr>
                    ) : (
                      collaboratorPerformance.map((colab, i) => {
                        const totalOps = colab.expedidas + colab.liberadas;
                        const errorRatio = totalOps > 0 ? ((colab.erros / totalOps) * 100).toFixed(0) : '0';
                        const score = Math.max(0, 100 - Number(errorRatio));

                        return (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                            <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-[10px] text-slate-600 dark:text-slate-300">
                                {colab.name.charAt(0)}
                              </div>
                              {colab.name}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                colab.role === 'Portaria' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              }`}>
                                {colab.role}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-600">{colab.expedidas}</td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-600">{colab.liberadas}</td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-rose-600">{colab.erros}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-800 dark:text-slate-200">
                              <span className={`px-2 py-0.5 rounded text-[11px] ${score >= 90 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950' : 'text-amber-600 bg-amber-50 dark:bg-amber-950'}`}>
                                {score}%
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Erros Operacionais Breakdown (1 col) */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      Erros & Divergências
                    </h3>
                    <p className="text-xs text-slate-400">Classificação de inconformidades auditadas</p>
                  </div>
                </div>

                {operationalErrors.chartData.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                    <p className="text-xs font-bold uppercase">Zero Divergências no Período</p>
                    <p className="text-[11px] text-slate-400 mt-1">Todas as cargas foram liberadas sem inconformidades.</p>
                  </div>
                ) : (
                  <>
                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={operationalErrors.chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={70}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {operationalErrors.chartData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }} 
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-1.5 mt-2">
                      {operationalErrors.chartData.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                            <span className="truncate max-w-[170px]">{item.name}</span>
                          </span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{item.value} ocorrências</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Total de Ocorrências:</span>
                  <span className="font-black text-rose-600">{operationalErrors.total} registradas</span>
                </div>
              </div>
            </div>

          </div>

          {/* Section 4: Veículos Atualmente no Pátio (Monitor de Permanência) */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Truck className="w-4 h-4 text-primary-gold" />
                  Veículos em Pátio CD ({slaMetrics.patioVehicles.length})
                </h3>
                <p className="text-xs text-slate-400">Controle do tempo decorrido e SLA para evitar estadias excessivas</p>
              </div>
            </div>

            {slaMetrics.patioVehicles.length === 0 ? (
              <div className="py-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                <Truck className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                <p className="text-xs font-bold uppercase">Nenhum caminhão aguardando no pátio no momento</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {slaMetrics.patioVehicles.map((truck, idx) => (
                  <div 
                    key={idx}
                    className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                      truck.isExceeded 
                        ? 'border-rose-200 bg-rose-50/40 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200' 
                        : 'border-slate-200 bg-slate-50/50 dark:bg-slate-750 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-black text-xs uppercase tracking-wider bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        {truck.plate}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {truck.isExceeded && (
                          <span className="text-[9px] font-black uppercase text-rose-600 bg-rose-100 dark:bg-rose-900 px-1.5 py-0.5 rounded flex items-center gap-1 animate-pulse">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            SLA Estourado
                          </span>
                        )}
                        {isAdmin && truck.id && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmModal({
                                isOpen: true,
                                id: truck.id,
                                type: 'carga',
                                title: `Carga ${truck.plate}`,
                                description: `Motorista: ${truck.driver} | Tempo: ${truck.stayHours}`
                              });
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-all cursor-pointer"
                            title="Excluir este registro permanentemente (Admin Master)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-2.5">
                      <p className="text-[11px] font-bold truncate text-slate-600 dark:text-slate-300">{truck.driver}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-mono font-bold">{truck.stayHours}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: LOG DE EVENTOS (EXPEDIÇÃO E PORTARIA) */}
      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary-gold" />
                Auditoria de Eventos — Portaria & Expedição
              </h3>
              <p className="text-xs text-slate-400">Rastreabilidade completa de todas as alterações, liberações e bloqueios</p>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-grow sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  placeholder="Filtrar por ação, usuário, placa..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-1 focus:ring-primary-gold outline-none"
                />
              </div>

              <select
                value={logFilterAction}
                onChange={(e) => setLogFilterAction(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 font-bold focus:ring-1 focus:ring-primary-gold outline-none cursor-pointer"
              >
                <option value="ALL">Todas as Ações</option>
                <option value="Portaria">Portaria / Gate</option>
                <option value="Expedição">Expedição</option>
                <option value="Divergência">Divergências</option>
                <option value="Status">Alterações de Status</option>
              </select>
            </div>
          </div>

          {/* Logs Table */}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-400 uppercase font-black text-[10px] border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Data / Hora</th>
                  <th className="py-2.5 px-3">Usuário</th>
                  <th className="py-2.5 px-3">Ação</th>
                  <th className="py-2.5 px-3">Detalhes do Evento</th>
                  <th className="py-2.5 px-3 text-center">Referência Carga</th>
                  {isAdmin && (
                    <th className="py-2.5 px-3 text-right">Ação</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
                {cdLogs.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="py-8 text-center text-slate-400">
                      Nenhum registro encontrado para os filtros selecionados
                    </td>
                  </tr>
                ) : (
                  cdLogs.slice(0, 100).map(log => {
                    const isError = log.action.toLowerCase().includes('diverg') || log.action.toLowerCase().includes('bloque');
                    const isGate = log.action.toLowerCase().includes('portaria') || log.action.toLowerCase().includes('gate');

                    return (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                        <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                          {new Date(log.timestamp).toLocaleString('pt-BR')}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                          {log.username}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            isError 
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300' 
                              : isGate
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 max-w-md truncate">
                          {log.details}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-500 text-[11px]">
                          {log.loadId ? log.loadId.substring(0, 8) : '—'}
                        </td>
                        {isAdmin && (
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteConfirmModal({
                                  isOpen: true,
                                  id: log.id,
                                  type: 'audit',
                                  title: `Log: ${log.action}`,
                                  description: `${log.username} - ${log.details}`
                                });
                              }}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-all cursor-pointer"
                              title="Excluir este registro permanentemente"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: GESTÃO DE USUÁRIOS DO CD */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          
          {/* Pending Users Approval Card */}
          {pendingCdUsers.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                  Novos Cadastros Aguardando Aprovação ({pendingCdUsers.length})
                </h3>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300 mb-4">
                Como Supervisor CD, você tem permissão para aprovar ou rejeitar novos colaboradores para os setores de Portaria e Expedição.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {pendingCdUsers.map(user => (
                  <div key={user.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-amber-200 dark:border-amber-700 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="font-black text-sm text-slate-900 dark:text-white">{user.fullName || user.username}</span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                          {user.role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">@{user.username}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{user.jobFunction || 'Função não especificada'}</p>
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => onApproveUser(user.id, true)}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Aprovar
                      </button>
                      <button
                        type="button"
                        onClick={() => onApproveUser(user.id, false)}
                        className="flex-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        Rejeitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Users Directory */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary-gold" />
                  Quadro de Colaboradores CD ({cdUsers.length})
                </h3>
                <p className="text-xs text-slate-400">Usuários cadastrados e vinculados à operação do Centro de Distribuição</p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-grow sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Pesquisar por nome ou usuário..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-1 focus:ring-primary-gold outline-none"
                  />
                </div>

                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 font-bold focus:ring-1 focus:ring-primary-gold outline-none cursor-pointer"
                >
                  <option value="ALL">Todos os Setores</option>
                  <option value="expedition">Expedição</option>
                  <option value="portaria">Portaria</option>
                  <option value="supervisor_cd">Supervisão CD</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-400 uppercase font-black text-[10px] border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Colaborador</th>
                    <th className="py-2.5 px-3">Usuário</th>
                    <th className="py-2.5 px-3">Setor / Função</th>
                    <th className="py-2.5 px-3">Unidade Locada</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Cadastrado em</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
                  {cdUsers.map(user => {
                    const isActive = user.status === 'active';
                    const isPending = user.status === 'pending';

                    return (
                      <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-[10px] text-slate-600 dark:text-slate-300">
                            {(user.fullName || user.username).charAt(0)}
                          </div>
                          {user.fullName || user.username}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">@{user.username}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">
                            {user.role === 'expedition' ? 'Expedição' : user.role === 'portaria' ? 'Portaria' : 'Supervisor CD'}
                          </span>
                          <span className="text-[10px] text-slate-400">{user.jobFunction || 'Operador'}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                          {user.storeLocation || 'CD-01'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            isActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : isPending ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {user.status === 'active' ? 'Ativo' : user.status === 'pending' ? 'Pendente' : 'Inativo'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-400 font-mono text-[11px]">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Modal Exclusão Individual de Registro (Admin Master) */}
      {deleteConfirmModal && deleteConfirmModal.isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-red-100 dark:bg-red-950/40 rounded-2xl flex items-center justify-center mb-5 text-red-600">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
              Deseja excluir este registro permanentemente?
            </h3>
            <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-150 dark:border-slate-700 mb-4">
              <p className="font-mono font-black text-slate-800 dark:text-slate-100 text-sm">{deleteConfirmModal.title}</p>
              {deleteConfirmModal.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{deleteConfirmModal.description}</p>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-6 leading-relaxed">
              Esta ação removerá este item do banco de dados local permanentemente para diminuir a poluição visual. Não será possível desfazer.
            </p>
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => setDeleteConfirmModal(null)}
                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-red-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Alerta Severo: Limpeza Geral de Dados (Admin Master) */}
      {clearAllConfirmModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border-2 border-red-500 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 bg-red-100 dark:bg-red-950/40 rounded-2xl flex items-center justify-center text-red-600 shrink-0">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-red-600 tracking-widest bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded border border-red-200 dark:border-red-800">
                  Ação Crítica - Administrador Master
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
                  Limpar Todo o Histórico Operacional?
                </h3>
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-2xl p-4 mb-5 text-red-950 dark:text-red-200 text-xs space-y-2 leading-relaxed">
              <p className="font-extrabold text-red-700 dark:text-red-400 flex items-center gap-1.5 uppercase text-[11px]">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Atenção Máxima: Ação Irreversível!
              </p>
              <p>
                Esta operação irá apagar permanentemente todas as <strong>{loads.length} cargas</strong>, ocorrências, checklists e logs de eventos do sistema para renovar a visualização.
              </p>
              <p className="text-[11px] text-red-800 dark:text-red-300">
                ✅ Os <strong>usuários cadastrados</strong> e as <strong>configurações do sistema</strong> serão preservados intactos.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                type="button"
                onClick={() => setClearAllConfirmModal(false)}
                className="flex-1 px-5 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={handleConfirmClearAll}
                className="flex-1 px-5 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-red-600/30 cursor-pointer flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirmar e Zerar Tudo</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
