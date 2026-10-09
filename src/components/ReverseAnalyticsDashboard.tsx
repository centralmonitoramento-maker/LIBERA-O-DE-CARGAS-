import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  Calendar, 
  BarChart3, 
  PieChart as PieChartIcon, 
  Activity, 
  RotateCcw, 
  Package, 
  ShieldAlert, 
  CheckCircle2, 
  Truck, 
  Store, 
  Clock,
  Sparkles,
  Info,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { CargoLoad, CargoStatus, CargoType, OccurrenceType, User } from '../types';

export type ReverseDateFilter = 'today' | 'last_7_days' | 'this_month' | 'last_month' | 'last_3_months';

interface ReverseAnalyticsDashboardProps {
  loads: CargoLoad[];
  currentUser?: User;
}

const STATUS_COLORS = {
  finalizadas: '#10b981', // Emerald
  emTransito: '#38bdf8',  // Sky
  aguardando: '#f59e0b',  // Amber
  divergencias: '#ef4444' // Rose
};

export const ReverseAnalyticsDashboard: React.FC<ReverseAnalyticsDashboardProps> = ({ 
  loads = [],
  currentUser
}) => {
  const [dateFilter, setDateFilter] = useState<ReverseDateFilter>('last_7_days');

  // Compute date range boundaries based on the selected filter
  const { start, end, label, displayRange } = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    let filterLabel = 'Últimos 7 dias';

    switch (dateFilter) {
      case 'today': {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        filterLabel = 'Hoje';
        break;
      }
      case 'last_7_days': {
        startDate = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        filterLabel = 'Últimos 7 dias';
        break;
      }
      case 'this_month': {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        filterLabel = 'Este Mês';
        break;
      }
      case 'last_month': {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        filterLabel = 'Mês Anterior';
        break;
      }
      case 'last_3_months': {
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        filterLabel = 'Últimos 3 Meses';
        break;
      }
      default: {
        startDate = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        filterLabel = 'Últimos 7 dias';
      }
    }

    const fmtDate = (d: Date) => {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    return {
      start: startDate,
      end: endDate,
      label: filterLabel,
      displayRange: `${fmtDate(startDate)} até ${fmtDate(endDate)}`
    };
  }, [dateFilter]);

  // Base reverse logistics & transfer loads relevant to the current user/scope
  const filteredLoads = useMemo(() => {
    let list = loads.filter(l => 
      l.cargoType === CargoType.REVERSA_CD || 
      l.cargoType === CargoType.TRANSFERENCIA ||
      l.cargoType === CargoType.COLETA
    );

    // If store user, match their store
    if (currentUser && currentUser.systemRole !== 'administrator' && currentUser.storeLocation) {
      const userStore = currentUser.storeLocation.toUpperCase().trim();
      const unitCode = userStore.split('-')[0].trim();
      list = list.filter(l => {
        const orig = (l.origin || '').toUpperCase().trim();
        const dest = (l.destination || '').toUpperCase().trim();
        return orig.includes(userStore) || 
               dest.includes(userStore) ||
               userStore.includes(orig) ||
               userStore.includes(dest) ||
               (unitCode.length >= 3 && (orig.includes(unitCode) || dest.includes(unitCode)));
      });
    }

    // Filter by selected date range
    return list.filter(l => {
      if (!l.createdAt) return false;
      const cDate = new Date(l.createdAt);
      if (isNaN(cDate.getTime())) return false;
      return cDate >= start && cDate <= end;
    });
  }, [loads, currentUser, start, end]);

  // Overall KPI statistics for the selected period
  const kpis = useMemo(() => {
    const totalLoads = filteredLoads.length;
    const totalPallets = filteredLoads.reduce((acc, curr) => acc + (curr.palletCount || 0), 0);
    const finalized = filteredLoads.filter(l => l.status === CargoStatus.FINISHED || l.tripFinished).length;
    const inTransit = filteredLoads.filter(l => l.status === CargoStatus.RELEASED && !l.tripFinished).length;
    const awaiting = filteredLoads.filter(l => l.status === CargoStatus.AWAITING).length;
    const discrepancies = filteredLoads.filter(l => 
      l.status === CargoStatus.BLOCKED || 
      (l.occurrenceType && l.occurrenceType !== OccurrenceType.NONE)
    ).length;

    const avgPallets = totalLoads > 0 ? (totalPallets / totalLoads).toFixed(1) : '0';
    const completionRate = totalLoads > 0 ? Math.round((finalized / totalLoads) * 100) : 0;

    return {
      totalLoads,
      totalPallets,
      finalized,
      inTransit,
      awaiting,
      discrepancies,
      avgPallets,
      completionRate
    };
  }, [filteredLoads]);

  // 1. Line Chart Data: Pallet volume evolution over time
  const timelineData = useMemo(() => {
    if (filteredLoads.length === 0) return [];

    // Helper format DD/MM
    const formatDay = (d: Date) => {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${day}/${month}`;
    };

    if (dateFilter === 'today') {
      // Group by 2-hour blocks for today
      const hourlyMap: Record<string, { time: string; paletes: number; cargas: number }> = {};
      const hours = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
      hours.forEach(h => {
        hourlyMap[h] = { time: h, paletes: 0, cargas: 0 };
      });

      filteredLoads.forEach(l => {
        const d = new Date(l.createdAt);
        if (isNaN(d.getTime())) return;
        const h = d.getHours();
        // Bucket into nearest 2-hour bracket
        const bucketHour = Math.floor(h / 2) * 2;
        const key = `${String(bucketHour).padStart(2, '0')}:00`;
        if (hourlyMap[key]) {
          hourlyMap[key].paletes += (l.palletCount || 0);
          hourlyMap[key].cargas += 1;
        } else {
          // If out of range, assign to closest
          const fallbackKey = h < 6 ? '06:00' : '22:00';
          if (hourlyMap[fallbackKey]) {
            hourlyMap[fallbackKey].paletes += (l.palletCount || 0);
            hourlyMap[fallbackKey].cargas += 1;
          }
        }
      });

      return Object.values(hourlyMap);
    }

    if (dateFilter === 'last_7_days') {
      // Create continuous 7 days sequence
      const dailyMap: Record<string, { date: string; paletes: number; cargas: number; fullDate: string }> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = formatDay(d);
        dailyMap[key] = {
          date: key,
          paletes: 0,
          cargas: 0,
          fullDate: d.toLocaleDateString('pt-BR')
        };
      }

      filteredLoads.forEach(l => {
        const d = new Date(l.createdAt);
        if (isNaN(d.getTime())) return;
        const key = formatDay(d);
        if (dailyMap[key]) {
          dailyMap[key].paletes += (l.palletCount || 0);
          dailyMap[key].cargas += 1;
        }
      });

      return Object.values(dailyMap);
    }

    if (dateFilter === 'last_3_months') {
      // Group by weeks to make 3-month visualization clean and legible
      const weekMap: Record<string, { date: string; paletes: number; cargas: number; timestamp: number }> = {};

      filteredLoads.forEach(l => {
        const d = new Date(l.createdAt);
        if (isNaN(d.getTime())) return;
        // Start of week (Sunday)
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - d.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const key = formatDay(startOfWeek);
        if (!weekMap[key]) {
          weekMap[key] = {
            date: key,
            paletes: 0,
            cargas: 0,
            timestamp: startOfWeek.getTime()
          };
        }
        weekMap[key].paletes += (l.palletCount || 0);
        weekMap[key].cargas += 1;
      });

      return Object.values(weekMap).sort((a, b) => a.timestamp - b.timestamp);
    }

    // Default for this_month or last_month: group by day of the month
    const dayMap: Record<string, { date: string; paletes: number; cargas: number; timestamp: number }> = {};
    filteredLoads.forEach(l => {
      const d = new Date(l.createdAt);
      if (isNaN(d.getTime())) return;
      const key = formatDay(d);
      if (!dayMap[key]) {
        dayMap[key] = {
          date: key,
          paletes: 0,
          cargas: 0,
          timestamp: new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
        };
      }
      dayMap[key].paletes += (l.palletCount || 0);
      dayMap[key].cargas += 1;
    });

    return Object.values(dayMap).sort((a, b) => a.timestamp - b.timestamp);
  }, [filteredLoads, dateFilter]);

  // 2. Donut Chart Data: Proportion of statuses
  const statusDonutData = useMemo(() => {
    if (filteredLoads.length === 0) return [];

    const data = [
      { 
        name: 'Finalizadas', 
        value: kpis.finalized, 
        color: STATUS_COLORS.finalizadas,
        desc: 'Concluídas no CD / Loja'
      },
      { 
        name: 'Em Trânsito', 
        value: kpis.inTransit, 
        color: STATUS_COLORS.emTransito,
        desc: 'Liberadas e em rota'
      },
      { 
        name: 'Aguardando Portaria', 
        value: kpis.awaiting, 
        color: STATUS_COLORS.aguardando,
        desc: 'Na fila de conferência'
      },
      { 
        name: 'Divergências', 
        value: kpis.discrepancies, 
        color: STATUS_COLORS.divergencias,
        desc: 'Com alertas ou retenções'
      }
    ];

    // Filter out 0 values if needed for pie display, but keep them for legend
    return data;
  }, [filteredLoads, kpis]);

  // 3. Bar Chart Data: Top 5 Origin Stores
  const topOriginsData = useMemo(() => {
    if (filteredLoads.length === 0) return [];

    const originMap: Record<string, { origin: string; shortName: string; paletes: number; cargas: number }> = {};

    filteredLoads.forEach(l => {
      const rawOrigin = (l.origin || 'Não Informado').trim();
      // Clean up common prefixes like "Atacadão Dia a Dia - " for punchier chart labels
      const cleanName = rawOrigin
        .replace(/^Atacad[aã]o\s+Dia\s+a\s+Dia\s*[-–]\s*/i, '')
        .replace(/^CD\s+Atacad[aã]o\s*[-–]?\s*/i, 'CD ')
        .trim();

      if (!originMap[rawOrigin]) {
        originMap[rawOrigin] = {
          origin: rawOrigin,
          shortName: cleanName.length > 20 ? `${cleanName.slice(0, 18)}…` : cleanName,
          paletes: 0,
          cargas: 0
        };
      }
      originMap[rawOrigin].paletes += (l.palletCount || 0);
      originMap[rawOrigin].cargas += 1;
    });

    return Object.values(originMap)
      .sort((a, b) => b.paletes - a.paletes || b.cargas - a.cargas)
      .slice(0, 5);
  }, [filteredLoads]);

  const hasData = filteredLoads.length > 0;

  return (
    <section 
      id="reverse-analytics-dashboard" 
      aria-label="Dashboard Analítico de Logística Reversa"
      className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl text-slate-100 relative overflow-hidden transition-all duration-300"
    >
      {/* Decorative ambient backdrop */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Title and Date Selector */}
      <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-5 pb-6 border-b border-slate-800/90">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white uppercase">
                  Dashboard Analítico de Logística Reversa
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-purple-950/80 text-purple-300 border border-purple-800/60 px-2 py-0.5 rounded-md">
                  <Sparkles className="w-2.5 h-2.5" /> Métricas Ativas
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Monitoramento de devoluções, saldo de paletes e ranking das lojas emissoras
              </p>
            </div>
          </div>
        </div>

        {/* Date Filter Selector with all 5 required options */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="text-[11px] font-bold text-slate-300">Período:</span>
          </div>

          <div 
            id="reverse-analytics-date-selector"
            className="inline-flex flex-wrap p-1 bg-slate-950/90 rounded-2xl border border-slate-800 shadow-inner gap-1"
          >
            {[
              { id: 'today', label: 'Hoje' },
              { id: 'last_7_days', label: 'Últimos 7 dias' },
              { id: 'this_month', label: 'Este Mês' },
              { id: 'last_month', label: 'Mês Anterior' },
              { id: 'last_3_months', label: 'Últimos 3 Meses' }
            ].map(tab => {
              const isActive = dateFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`btn-date-filter-${tab.id}`}
                  onClick={() => setDateFilter(tab.id as ReverseDateFilter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                    isActive 
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40 font-black' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Date Range Sub-Indicator */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-3 pb-5 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium">
            Exibindo dados de <strong className="text-white">{displayRange}</strong>
          </span>
        </div>
        <div className="text-[11px] font-medium text-slate-400 bg-slate-800/40 px-3 py-1 rounded-full border border-slate-800">
          Total de {kpis.totalLoads} {kpis.totalLoads === 1 ? 'carga registrada' : 'cargas registradas'} no intervalo
        </div>
      </div>

      {/* Mini KPI Highlights inside the dark dashboard */}
      <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <div className="bg-slate-950/60 border border-slate-800/90 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Paletes Retornados</span>
            <Package className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white mt-1 font-mono tracking-tight">
            {kpis.totalPallets}
          </p>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">
            Média de <strong className="text-purple-300 font-bold">{kpis.avgPallets}</strong> un / carga
          </p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/90 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Taxa de Conclusão</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white mt-1 font-mono tracking-tight">
            {kpis.completionRate}%
          </p>
          <p className="text-[10px] text-emerald-400 mt-1 font-medium">
            {kpis.finalized} cargas finalizadas
          </p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/90 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Em Trânsito / Fila</span>
            <Truck className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white mt-1 font-mono tracking-tight">
            {kpis.inTransit + kpis.awaiting}
          </p>
          <p className="text-[10px] text-sky-300 mt-1 font-medium">
            {kpis.inTransit} na rota • {kpis.awaiting} aguardando
          </p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/90 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Divergências / Alertas</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white mt-1 font-mono tracking-tight">
            {kpis.discrepancies}
          </p>
          <p className={`text-[10px] mt-1 font-medium ${kpis.discrepancies > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
            {kpis.discrepancies > 0 ? 'Requer atenção imediata' : 'Nenhuma anomalia detectada'}
          </p>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Chart 1: Line Chart - Temporal Evolution of Returned Pallets */}
        <div className="lg:col-span-12 xl:col-span-7 bg-slate-950/70 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-purple-900/40 text-purple-400 rounded-lg">
                <TrendingUp className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-sm font-extrabold text-white tracking-tight uppercase">
                  Evolução Temporal de Paletes
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">
                  Volume de paletes retornados ao longo do período ({label.toLowerCase()})
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold bg-slate-800/60 text-purple-300 px-2.5 py-1 rounded-md self-start sm:self-auto">
              Total: {kpis.totalPallets} Paletes
            </span>
          </div>

          <div className="h-[280px] w-full flex items-center justify-center">
            {hasData && timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey={dateFilter === 'today' ? 'time' : 'date'} 
                    stroke="#64748b" 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-950 border border-slate-800 text-white p-3.5 rounded-xl shadow-2xl text-xs space-y-1.5 font-sans">
                            <p className="font-black text-purple-400 uppercase tracking-wider pb-1 border-b border-slate-800">
                              {data.fullDate || label}
                            </p>
                            <div className="flex justify-between items-center gap-4 text-slate-300">
                              <span>Paletes Retornados:</span>
                              <strong className="font-mono text-purple-300 text-sm">{data.paletes}</strong>
                            </div>
                            <div className="flex justify-between items-center gap-4 text-slate-400">
                              <span>Cargas no período:</span>
                              <strong className="font-mono text-white">{data.cargas}</strong>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="paletes" 
                    name="Paletes"
                    stroke="#a855f7" 
                    strokeWidth={3}
                    dot={{ fill: '#a855f7', stroke: '#ffffff', strokeWidth: 1.5, r: 4 }}
                    activeDot={{ r: 6, fill: '#ec4899', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-500">
                  <Activity className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-300">Sem dados para o período</p>
                <p className="text-[10px] text-slate-500 max-w-xs">
                  Nenhuma movimentação temporal de retorno registrada no intervalo selecionado ({label.toLowerCase()}).
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Donut Chart - Load Status Distribution */}
        <div className="lg:col-span-6 xl:col-span-5 bg-slate-950/70 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-900/40 text-emerald-400 rounded-lg">
                <PieChartIcon className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-sm font-extrabold text-white tracking-tight uppercase">
                  Status das Cargas
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">
                  Distribuição proporcional operacional
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold bg-slate-800/60 text-emerald-300 px-2.5 py-1 rounded-md">
              {kpis.totalLoads} Cargas
            </span>
          </div>

          <div className="h-[280px] w-full flex items-center justify-center">
            {hasData && kpis.totalLoads > 0 ? (
              <div className="w-full h-full flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="w-full sm:w-1/2 h-[190px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDonutData.filter(d => d.value > 0)}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                      >
                        {statusDonutData.filter(d => d.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            const pct = kpis.totalLoads > 0 ? ((d.value / kpis.totalLoads) * 100).toFixed(1) : '0';
                            return (
                              <div className="bg-slate-950 border border-slate-800 text-white p-3 rounded-xl shadow-2xl text-xs space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                                  <span className="font-bold text-slate-200">{d.name}</span>
                                </div>
                                <p className="font-mono text-base font-black text-white">
                                  {d.value} <span className="text-[10px] font-medium text-slate-400">({pct}%)</span>
                                </p>
                                <p className="text-[9px] text-slate-400">{d.desc}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Donut Center Counter */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-black text-white font-mono leading-none">
                      {kpis.totalLoads}
                    </span>
                    <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                      Total
                    </span>
                  </div>
                </div>

                {/* Status Legend Pills */}
                <div className="w-full sm:w-1/2 flex flex-col gap-1.5">
                  {statusDonutData.map(item => {
                    const pct = kpis.totalLoads > 0 ? Math.round((item.value / kpis.totalLoads) * 100) : 0;
                    return (
                      <div 
                        key={item.name}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 text-[11px]"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="text-slate-300 font-semibold truncate">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-mono font-bold text-white">{item.value}</span>
                          <span className="text-[9px] text-slate-500 font-medium">({pct}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-500">
                  <PieChartIcon className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-300">Sem dados para o período</p>
                <p className="text-[10px] text-slate-500 max-w-xs">
                  Nenhum status computado pois não há registros no intervalo de {label.toLowerCase()}.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Chart 3: Horizontal Bar Chart - Top 5 Origin Stores */}
        <div className="lg:col-span-12 bg-slate-950/70 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-sky-900/40 text-sky-400 rounded-lg">
                <Store className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-sm font-extrabold text-white tracking-tight uppercase">
                  Top 5 Lojas Emissoras (Origem)
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">
                  Filiais que mais emitiram reversas e paletes no período selecionado
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-slate-800/60 text-sky-300 px-2.5 py-1 rounded-md self-start sm:self-auto">
              Ranking por Volume de Paletes
            </span>
          </div>

          <div className="min-h-[220px] w-full flex items-center justify-center">
            {hasData && topOriginsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={Math.max(200, topOriginsData.length * 45)}>
                <BarChart
                  data={topOriginsData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis 
                    type="number" 
                    stroke="#64748b" 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                    allowDecimals={false}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="shortName" 
                    stroke="#64748b" 
                    width={140}
                    tick={{ fill: '#e2e8f0', fontSize: 11, fontWeight: 800 }}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-950 border border-slate-800 text-white p-3.5 rounded-xl shadow-2xl text-xs space-y-1.5 font-sans">
                            <p className="font-black text-sky-400 uppercase tracking-wider pb-1 border-b border-slate-800">
                              {data.origin}
                            </p>
                            <div className="flex justify-between items-center gap-4 text-slate-300">
                              <span>Paletes Enviados:</span>
                              <strong className="font-mono text-sky-300 text-sm">{data.paletes}</strong>
                            </div>
                            <div className="flex justify-between items-center gap-4 text-slate-400">
                              <span>Total de Remessas:</span>
                              <strong className="font-mono text-white">{data.cargas} cargas</strong>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="paletes" 
                    name="Paletes" 
                    fill="#38bdf8" 
                    radius={[0, 8, 8, 0]} 
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-8 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-500">
                  <Store className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-300">Sem dados para o período</p>
                <p className="text-[10px] text-slate-500 max-w-sm">
                  Nenhuma loja de origem registrada no período de {label.toLowerCase()}. Os envios de reversa alimentarão este ranking automaticamente.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  );
};
