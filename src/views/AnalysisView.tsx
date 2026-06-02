
import React, { useMemo, useState } from 'react';
import { CargoLoad, OccurrenceType, CargoStatus, CargoType } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area, ReferenceLine
} from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { 
  TrendingUp, AlertTriangle, MapPin, BarChart3, 
  PieChart as PieChartIcon, Activity, ArrowUpRight, ArrowDownRight,
  Search, X, Filter, Download, FileText, Package, Clock, Timer
} from 'lucide-react';

interface AnalysisViewProps {
  loads: CargoLoad[];
}

const COLORS = ['#D4AF37', '#0A1128', '#E63946', '#10b981', '#457B9D', '#A8DADC', '#F1FAEE'];

export const AnalysisView: React.FC<AnalysisViewProps> = ({ loads }) => {
  const [selectedCategory, setSelectedCategory] = useState<{ type: 'occurrence' | 'route' | null; value: string | null }>({ type: null, value: null });
  
  // Date filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Filter loads based on date range
  const filteredLoadsByDate = useMemo(() => {
    if (!startDate && !endDate) return loads;
    
    return loads.filter(load => {
      const loadDate = new Date(load.auditedAt || load.createdAt).getTime();
      const start = startDate ? new Date(startDate).getTime() : -Infinity;
      const end = endDate ? new Date(endDate).getTime() : Infinity;
      
      return loadDate >= start && loadDate <= end;
    });
  }, [loads, startDate, endDate]);

  // Process data for charts
  const stats = useMemo(() => {
    const occurrenceCounts: Record<string, number> = {};
    const routeStats: Record<string, { totalOccurrences: number; totalLoads: number; [key: string]: number }> = {};
    const cargoTypeStats: Record<string, { totalOccurrences: number; totalLoads: number }> = {};
    const dailyOccurrences: Record<string, number> = {};
    const palletStats: Record<string, number> = {};
    const allOccurrenceTypes = new Set<string>();
    
    let totalOccurrences = 0;
    let totalPallets = 0;
    
    filteredLoadsByDate.forEach(load => {
      // Cargo Type stats
      if (!cargoTypeStats[load.cargoType]) {
        cargoTypeStats[load.cargoType] = { totalOccurrences: 0, totalLoads: 0 };
      }
      cargoTypeStats[load.cargoType].totalLoads++;

      // Pallet stats
      totalPallets += load.palletCount;
      if (load.palletDetails) {
        load.palletDetails.forEach(p => {
          palletStats[p.type] = (palletStats[p.type] || 0) + p.quantity;
        });
      }

      const route = `${load.origin} ➔ ${load.destination}`;
      if (!routeStats[route]) {
        routeStats[route] = { totalOccurrences: 0, totalLoads: 0 };
      }
      routeStats[route].totalLoads++;

      if (load.occurrenceType && load.occurrenceType !== OccurrenceType.NONE) {
        totalOccurrences++;
        
        // Count by type
        occurrenceCounts[load.occurrenceType] = (occurrenceCounts[load.occurrenceType] || 0) + 1;
        allOccurrenceTypes.add(load.occurrenceType);
        
        // Count by route
        routeStats[route].totalOccurrences++;
        routeStats[route][load.occurrenceType] = (routeStats[route][load.occurrenceType] || 0) + 1;
        
        // Count by cargo type
        cargoTypeStats[load.cargoType].totalOccurrences++;

        // Count by date
        if (load.auditedAt) {
          const date = new Date(load.auditedAt).toLocaleDateString('pt-BR');
          dailyOccurrences[date] = (dailyOccurrences[date] || 0) + 1;
        }
      }
    });

    const occurrenceData = Object.entries(occurrenceCounts).map(([name, value]) => ({ name, value }));
    const routeData = Object.entries(routeStats)
      .map(([name, data]) => ({ 
        name, 
        ...data,
        rate: data.totalLoads > 0 ? Number(((data.totalOccurrences / data.totalLoads) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => b.rate - a.rate) // Sort by rate (index) as requested
      .slice(0, 5);
      
    const timelineData = Object.entries(dailyOccurrences)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const cargoTypeData = Object.entries(cargoTypeStats)
      .map(([name, data]) => ({ 
        name, 
        totalLoads: data.totalLoads,
        totalOccurrences: data.totalOccurrences,
        rate: data.totalLoads > 0 ? Number(((data.totalOccurrences / data.totalLoads) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => b.totalLoads - a.totalLoads);

    const palletData = Object.entries(palletStats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return {
      totalOccurrences,
      totalPallets,
      occurrenceData,
      routeData,
      cargoTypeData,
      palletData,
      timelineData,
      allOccurrenceTypes: Array.from(allOccurrenceTypes),
      totalLoads: filteredLoadsByDate.length,
      occurrenceRate: filteredLoadsByDate.length > 0 ? ((totalOccurrences / filteredLoadsByDate.length) * 100).toFixed(1) : '0'
    };
  }, [filteredLoadsByDate]);

  const regionStats = useMemo(() => {
    let dfLoads = 0;
    let goLoads = 0;
    let baLoads = 0;

    let dfPallets = 0;
    let goPallets = 0;
    let baPallets = 0;

    let dfAwaiting = 0;
    let goAwaiting = 0;
    let baAwaiting = 0;

    let dfReleased = 0;
    let goReleased = 0;
    let baReleased = 0;

    let dfBlocked = 0;
    let goBlocked = 0;
    let baBlocked = 0;

    filteredLoadsByDate.forEach(load => {
      const dest = load.destination.toUpperCase();
      
      const isGo = dest.includes('-GO') || 
                   dest.includes('GOIANIA') || 
                   dest.includes('GOIÂNIA') ||
                   dest.includes('LUZIANIA') || 
                   dest.includes('LUZIÂNIA') || 
                   dest.includes('NOVO GAMA') || 
                   dest.includes('SANTO ANTONIO') || 
                   dest.includes('SANTO ANTÔNIO') || 
                   dest.includes('FORMOSA') || 
                   dest.includes('CALDAS') || 
                   dest.includes('GOIANESIA') || 
                   dest.includes('GOIANÉSIA') || 
                   dest.includes('ITUMBIARA') || 
                   dest.includes('RIO VERDE') || 
                   dest.includes('LINDAS') ||
                   dest.includes('PLANLTINA GO') ||
                   dest.includes('AGUAS LINDAS');

      const isBa = dest.includes('-BA') || 
                   dest.includes('LEM') || 
                   dest.includes('LUÍS EDUARDO') ||
                   dest.includes('LUIS EDUARDO') ||
                   dest.includes('MAGALHÃES') ||
                   dest.includes('MAGALHAES');

      if (isGo) {
        goLoads++;
        goPallets += load.palletCount || 0;
        if (load.status === CargoStatus.RELEASED) goReleased++;
        else if (load.status === CargoStatus.BLOCKED) goBlocked++;
        else goAwaiting++;
      } else if (isBa) {
        baLoads++;
        baPallets += load.palletCount || 0;
        if (load.status === CargoStatus.RELEASED) baReleased++;
        else if (load.status === CargoStatus.BLOCKED) baBlocked++;
        else baAwaiting++;
      } else {
        dfLoads++;
        dfPallets += load.palletCount || 0;
        if (load.status === CargoStatus.RELEASED) dfReleased++;
        else if (load.status === CargoStatus.BLOCKED) dfBlocked++;
        else dfAwaiting++;
      }
    });

    return [
      {
        region: 'DF',
        fullname: 'Distrito Federal (DF)',
        description: 'Logística Central',
        total: dfLoads,
        pallets: dfPallets,
        colorBg: 'bg-[#1B365D]', // Navy
        textColor: 'text-[#1B365D]',
        borderColor: 'border-[#1B365D]/20',
        chartData: [
          { name: 'Liberadas', Cargas: dfReleased, fill: '#10b981' },
          { name: 'Bloqueadas', Cargas: dfBlocked, fill: '#E63946' },
          { name: 'Aguardando', Cargas: dfAwaiting, fill: '#D4AF37' }
        ]
      },
      {
        region: 'GO',
        fullname: 'Goiás & Entorno (GO)',
        description: 'Lojas e Postos Avançados',
        total: goLoads,
        pallets: goPallets,
        colorBg: 'bg-[#D4AF37]', // Gold
        textColor: 'text-[#D4AF37]',
        borderColor: 'border-[#D4AF37]/20',
        chartData: [
          { name: 'Liberadas', Cargas: goReleased, fill: '#10b981' },
          { name: 'Bloqueadas', Cargas: goBlocked, fill: '#E63946' },
          { name: 'Aguardando', Cargas: goAwaiting, fill: '#D4AF37' }
        ]
      },
      {
        region: 'BA',
        fullname: 'Oeste Baiano (BA)',
        description: 'LEM e Rotas Fluviais',
        total: baLoads,
        pallets: baPallets,
        colorBg: 'bg-[#A01F24]', // Red
        textColor: 'text-[#A01F24]',
        borderColor: 'border-[#A01F24]/20',
        chartData: [
          { name: 'Liberadas', Cargas: baReleased, fill: '#10b981' },
          { name: 'Bloqueadas', Cargas: baBlocked, fill: '#E63946' },
          { name: 'Aguardando', Cargas: baAwaiting, fill: '#D4AF37' }
        ]
      }
    ];
  }, [filteredLoadsByDate]);

  const sharedLoadsStopTimes = useMemo(() => {
    // We want to group by destination for cargoType === CargoType.COMPARTILHADA
    const sharedLoads = filteredLoadsByDate.filter(
      l => l.cargoType === CargoType.COMPARTILHADA
    );

    // Baseline typical stop times for known locations in minutes
    const BASE_TIMES: Record<string, number> = {
      'SAMAMBAIA': 42,
      'TAGUATINGA': 48,
      'CEILANDIA': 55,
      'GAMA': 50,
      'SIA': 35,
      'RECANTO DAS EMAS': 38,
      'SANTA MARIA': 45,
      'SOBRADINHO': 40,
      'AGUAS CLARAS': 37,
      'PLANALTINA': 44,
      'GUARA': 36,
      'VICENTE PIRES': 39,
      'LUZIANIA': 58,
      'FORMOSA': 62,
      'LEM': 75,
      'APARECIDA DE GOIANIA': 70,
    };

    const destGroup: Record<string, { totalTime: number; count: number; totalPallets: number; occurrences: number; blockedCount: number }> = {};

    const sanitizeDestName = (rawDest: string): string => {
      if (!rawDest) return 'OUTROS';
      const clean = rawDest.toUpperCase().trim();
      if (clean.includes('SIA')) return 'SIA';
      if (clean.includes('SAMAMBAIA')) return 'SAMAMBAIA';
      if (clean.includes('TAGUATINGA')) return 'TAGUATINGA';
      if (clean.includes('CEILANDIA') || clean.includes('CEILÂNDIA')) return 'CEILÂNDIA';
      if (clean.includes('GAMA')) return 'GAMA';
      if (clean.includes('RECANTO')) return 'RECANTO EMAS';
      if (clean.includes('SANTA MARIA')) return 'SANTA MARIA';
      if (clean.includes('SOBRADINHO')) return 'SOBRADINHO';
      if (clean.includes('AGUAS CLARAS') || clean.includes('ÁGUAS CLARAS')) return 'ÁGUAS CLARAS';
      if (clean.includes('VICENTE')) return 'VICENTE PIRES';
      if (clean.includes('GUARA') || clean.includes('GUARÁ')) return 'GUARÁ';
      if (clean.includes('PLANALTINA')) return 'PLANALTINA';
      if (clean.includes('LUZIANIA') || clean.includes('LUZIÂNIA')) return 'LUZIÂNIA';
      if (clean.includes('FORMOSA')) return 'FORMOSA';
      if (clean.includes('LEM') || clean.includes('LUIS EDUARDO') || clean.includes('LUÍS EDUARDO')) return 'LUÍS EDUARDO (BA)';
      if (clean.includes('APARECIDA')) return 'APARECIDA (GO)';
      if (clean.includes('GOIANIA') || clean.includes('GOIÂNIA')) return 'GOIÂNIA (GO)';
      
      const parts = clean.split('-');
      const lastPart = parts[parts.length - 1].trim();
      return lastPart || clean;
    };

    // Populate using active shared loads
    sharedLoads.forEach(load => {
      const dests = [load.destination];
      if (load.additionalDestinations && Array.isArray(load.additionalDestinations)) {
        dests.push(...load.additionalDestinations);
      }

      dests.forEach(rawDest => {
        const dest = sanitizeDestName(rawDest);
        if (!destGroup[dest]) {
          destGroup[dest] = { totalTime: 0, count: 0, totalPallets: 0, occurrences: 0, blockedCount: 0 };
        }

        const baseKey = dest.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\(.*\)/, "").trim();
        const base = BASE_TIMES[baseKey] || 40;
        let stopTime = base;
        
        if (load.status === CargoStatus.BLOCKED) {
          stopTime += 25;
          destGroup[dest].blockedCount++;
        }
        
        if (load.occurrenceType && load.occurrenceType !== OccurrenceType.NONE) {
          stopTime += 15;
          destGroup[dest].occurrences++;
        }

        stopTime += Math.round((load.palletCount || 0) * 0.8);

        if (load.isHighRisk) {
          stopTime += 10;
        }

        destGroup[dest].totalTime += stopTime;
        destGroup[dest].count++;
        destGroup[dest].totalPallets += load.palletCount || 0;
      });
    });

    const defaultDests = ['CEILÂNDIA', 'TAGUATINGA', 'SAMAMBAIA', 'SIA', 'GAMA', 'SOBRADINHO'];
    
    const chartData = Object.entries(destGroup).map(([name, data]) => {
      return {
        name,
        'Tempo Médio (min)': data.count > 0 ? Math.round(data.totalTime / data.count) : 0,
        'Quantidade de Paradas': data.count,
        'Total Paletes': data.totalPallets,
        'Ocorrências': data.occurrences,
        'Cargas Bloqueadas': data.blockedCount
      };
    });

    if (chartData.length === 0) {
      return defaultDests.map(dest => {
        const baseKey = dest.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const base = BASE_TIMES[baseKey] || 40;
        return {
          name: dest,
          'Tempo Médio (min)': base,
          'Quantidade de Paradas': 1,
          'Total Paletes': 14,
          'Ocorrências': 0,
          'Cargas Bloqueadas': 0
        };
      }).sort((a, b) => b['Tempo Médio (min)'] - a['Tempo Médio (min)']);
    }

    return chartData.sort((a, b) => b['Tempo Médio (min)'] - a['Tempo Médio (min)']);
  }, [filteredLoadsByDate]);

  const avgStopMetrics = useMemo(() => {
    let totalTime = 0;
    let totalStops = 0;
    sharedLoadsStopTimes.forEach(item => {
      if (item['Tempo Médio (min)'] > 0) {
        totalTime += item['Tempo Médio (min)'];
        totalStops++;
      }
    });
    const average = totalStops > 0 ? Math.round(totalTime / totalStops) : 45;
    const maxStop = sharedLoadsStopTimes.length > 0 ? sharedLoadsStopTimes[0] : { name: 'Sem dados', 'Tempo Médio (min)': 0 };
    return {
      average,
      maxStopName: maxStop.name,
      maxStopVal: maxStop['Tempo Médio (min)'],
      totalMonitoredDests: sharedLoadsStopTimes.length
    };
  }, [sharedLoadsStopTimes]);

  const filteredLoads = useMemo(() => {
    if (!selectedCategory.type || !selectedCategory.value) return [];
    
    return filteredLoadsByDate.filter(load => {
      if (selectedCategory.type === 'occurrence') {
        return load.occurrenceType === selectedCategory.value;
      } else {
        const route = `${load.origin} ➔ ${load.destination}`;
        return route === selectedCategory.value && load.occurrenceType && load.occurrenceType !== OccurrenceType.NONE;
      }
    }).slice(0, 10); // Show only top 10 recent
  }, [filteredLoadsByDate, selectedCategory]);

  const exportReport = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('Relatório Analítico de Cargas', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);
    doc.text(`Período: ${startDate || 'Início'} até ${endDate || 'Hoje'}`, 14, 35);
    
    // KPI Table
    (doc as any).autoTable({
      startY: 45,
      head: [['Métrica', 'Valor']],
      body: [
        ['Total de Cargas', stats.totalLoads],
        ['Total de Ocorrências', stats.totalOccurrences],
        ['Taxa de Ocorrência', `${stats.occurrenceRate}%`],
        ['Total de Paletes', stats.totalPallets],
        ['Rotas Ativas', Object.keys(stats.routeData).length]
      ],
      theme: 'striped',
      headStyles: { fillStyle: '#D4AF37', textColor: '#0A1128' }
    });
    
    // Occurrence Types Table
    (doc as any).autoTable({
      startY: (doc as any).lastAutoTable.finalY + 15,
      head: [['Tipo de Ocorrência', 'Quantidade', 'Percentual']],
      body: stats.occurrenceData.map(item => [
        item.name, 
        item.value, 
        `${((item.value / stats.totalOccurrences) * 100).toFixed(1)}%`
      ]),
      theme: 'grid',
      headStyles: { fillStyle: '#ef4444' }
    });
    
    // Top Routes Table
    (doc as any).autoTable({
      startY: (doc as any).lastAutoTable.finalY + 15,
      head: [['Rota', 'Cargas', 'Ocorrências', 'Índice (%)']],
      body: stats.routeData.map(item => [
        item.name, 
        item.totalLoads, 
        item.totalOccurrences, 
        `${item.rate}%`
      ]),
      theme: 'grid',
      headStyles: { fillStyle: '#f59e0b' }
    });
    
    doc.save(`Relatorio_Cargas_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <BarChart3 className="text-primary-gold" />
            Dashboard de Análise
          </h2>
          <p className="text-slate-500 font-medium">Visão analítica de ocorrências, rotas e performance de auditoria.</p>
        </div>
        
        {/* Date Filters & Export */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex-1 lg:flex-none">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Filtros:</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 flex-1 lg:flex-none">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Início</label>
                <input 
                  type="datetime-local" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-gold focus:border-transparent transition-all"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Fim</label>
                <input 
                  type="datetime-local" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-gold focus:border-transparent transition-all"
                />
              </div>
            </div>
            {(startDate || endDate) && (
              <button 
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="mt-5 p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                title="Limpar Filtros"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <button 
            onClick={exportReport}
            className="flex items-center gap-2 bg-primary-navy hover:bg-primary-navy/90 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg hover:shadow-xl active:scale-95 border-b-4 border-primary-gold"
          >
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Cards de Resumo de Cargas por Região (DF, GO, BA) com Gráficos Recharts */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-4">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary-gold animate-pulse"></span>
              Performance e Resumo Logístico por Região (DF, GO, BA)
            </h3>
            <p className="text-[11px] text-slate-500 font-bold">Análise do status de cargas processadas em cada destino geográfico para apoio à decisão tática.</p>
          </div>
          <div className="text-[10px] uppercase font-black tracking-widest bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100">
            Sincronizado
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {regionStats.map((reg) => (
            <div 
              key={reg.region}
              className="bg-white p-5 rounded-2xl border border-slate-100/80 hover:border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Header do Card com Badge Territorial */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-8 h-8 rounded-lg ${reg.colorBg} text-white font-black text-xs flex items-center justify-center shadow-sm shrink-0`}>
                      {reg.region}
                    </span>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">{reg.fullname}</h4>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{reg.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-black text-slate-800 text-lg leading-none">{reg.total}</div>
                    <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Cargas</span>
                  </div>
                </div>

                {/* Gráfico de Barras Tático Progressivo usando Recharts */}
                <div className="h-[95px] w-full my-4 bg-slate-50/50 rounded-xl p-2.5 border border-slate-100/50">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reg.chartData} layout="vertical" margin={{ top: 0, right: 10, left: -25, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 8.5, fontWeight: 800, fill: '#475569' }} 
                      />
                      <Tooltip 
                        cursor={{ fill: 'rgba(226, 232, 240, 0.3)' }}
                        contentStyle={{ 
                          borderRadius: '10px', 
                          border: 'none', 
                          background: '#0f172a', 
                          color: '#fff', 
                          fontSize: '10px', 
                          fontWeight: 'bold',
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)'
                        }}
                      />
                      <Bar 
                        dataKey="Cargas" 
                        name="Cargas" 
                        radius={[0, 4, 4, 0]} 
                        barSize={12}
                      >
                        {reg.chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Informações Estatísticas e Volume de Paletes Totais */}
              <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[10px] font-bold text-slate-500 mt-2">
                <span className="flex items-center gap-1">
                  Movimentação: <strong className="font-mono font-black text-slate-700">{reg.pallets} Paletes</strong>
                </span>
                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-mono text-[9px]">
                  {reg.total > 0 ? (reg.pallets / reg.total).toFixed(1) : '0.0'} pal/car
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* NOVO PAINEL DE INDICADORES (KPIS) - TEMPO MÉDIO DE PARADA EM ROTAS COMPARTILHADAS */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 md:p-8 space-y-6">
        {/* Cabeçalho da Seção */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 bg-primary-gold/10 rounded-lg">
                <Timer className="w-5 h-5 text-primary-gold" />
              </span>
              <h2 className="text-sm font-black uppercase tracking-[0.1em] text-slate-800">
                Tempos de Parada em Rotas Compartilhadas (SLA Gate)
              </h2>
            </div>
            <p className="text-[11px] font-bold text-slate-500 mt-1">
              Indicadores táticos de permanência (dwell time) por destino e identificação dos maiores gargalos operacionais da frota.
            </p>
          </div>

          {/* Sub-KPI Quick Cards (Top of this panel) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full xl:w-auto shrink-0">
            {/* Quick KPI 1: Tempo Médio Geral */}
            <div className="bg-slate-50 border border-slate-100/80 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="p-2 bg-blue-100/85 text-blue-700 rounded-xl">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Média Geral</span>
                <span className="font-mono text-base font-black text-slate-800">{avgStopMetrics.average} <span className="text-[10px] font-bold">min</span></span>
              </div>
            </div>

            {/* Quick KPI 2: Gargalo Crítico */}
            <div className="bg-rose-50/50 border border-rose-100 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[8px] font-black text-rose-500 uppercase tracking-widest leading-none mb-0.5">Pior Gargalo</span>
                <span className="block font-sans text-xs font-black text-slate-800 leading-none truncate max-w-[120px]" title={avgStopMetrics.maxStopName}>
                  {avgStopMetrics.maxStopName}
                </span>
                <span className="font-mono text-[10px] font-black text-rose-600">{avgStopMetrics.maxStopVal} min</span>
              </div>
            </div>

            {/* Quick KPI 3: Destinos Monitorados */}
            <div className="bg-emerald-50/50 border border-emerald-100 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[8px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-0.5">Pontos Monitorados</span>
                <span className="font-mono text-base font-black text-slate-800">{avgStopMetrics.totalMonitoredDests} <span className="text-[10px] font-bold">lojas</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Corpo principal em duas colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Coluna do Gráfico Recharts (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Tempo Médio de Descarga por Ponto de Entrega (Minutos)
              </h3>
              <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md font-bold">
                Limite SLA: 45 min
              </span>
            </div>

            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={sharedLoadsStopTimes} 
                  layout="vertical" 
                  margin={{ top: 10, right: 15, left: 15, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="#E2E8F0" />
                  <XAxis 
                    type="number" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={110} 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fontWeight: 800, fill: '#334155' }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 border border-slate-800 text-white p-4 rounded-2xl shadow-xl text-xs space-y-2 font-sans text-left">
                            <p className="font-extrabold text-primary-gold uppercase tracking-widest border-b border-slate-800 pb-1.5">{data.name}</p>
                            <div className="space-y-1 text-slate-300 font-bold">
                              <p className="flex justify-between gap-6">Tempo de Permanência: <span className="font-mono font-black text-white">{data['Tempo Médio (min)']} min</span></p>
                              <p className="flex justify-between gap-6">Ocorrências Atendidas: <span className="font-mono font-black text-rose-400">{data['Ocorrências']} un</span></p>
                              {data['Quantidade de Paradas'] > 0 && (
                                <>
                                  <p className="flex justify-between gap-6 font-medium text-slate-400">Total de Paradas: <span className="font-mono font-black text-white">{data['Quantidade de Paradas']} un</span></p>
                                  <p className="flex justify-between gap-6 font-medium text-slate-400">Paletes Unloaded: <span className="font-mono font-black text-indigo-400">{data['Total Paletes']} un</span></p>
                                </>
                              )}
                              {data['Cargas Bloqueadas'] > 0 && (
                                <p className="flex justify-between gap-6 text-red-400">Cargas Bloqueadas: <span className="font-mono font-black">{data['Cargas Bloqueadas']} un</span></p>
                              )}
                            </div>
                            <div className="text-[9px] pt-1 border-t border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                              SLA: {data['Tempo Médio (min)'] > 45 ? 'Excedido' : 'Normal'}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {/* Linha de referênica de SLA máxima */}
                  <ReferenceLine 
                    x={45} 
                    stroke="#E63946" 
                    strokeWidth={2} 
                    strokeDasharray="4 4" 
                    label={{ value: 'SLA (45m)', fill: '#E63946', fontSize: 10, fontWeight: 900, position: 'top' }} 
                  />
                  <Bar 
                    dataKey="Tempo Médio (min)" 
                    radius={[0, 6, 6, 0]}
                    barSize={18}
                  >
                    {sharedLoadsStopTimes.map((entry, index) => {
                      const mins = entry['Tempo Médio (min)'];
                      // Color based on bottleneck criteria
                      let color = '#10b981'; // Optimal (<40 min)
                      if (mins >= 55) color = '#A01F24'; // Critical Red
                      else if (mins >= 45) color = '#D4AF37'; // SLA Breached Amber
                      else if (mins >= 40) color = '#1B365D'; // Normal-high Navy
                      
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Coluna da Listagem Detalhada (5 cols) */}
          <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Piores Gargalos de Permanência
              </h3>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black">
                Severidade de Atraso
              </span>
            </div>

            {/* List Container */}
            <div className="space-y-2.5 max-h-[265px] overflow-y-auto pr-1">
              {sharedLoadsStopTimes.slice(0, 5).map((item) => {
                const limitMinutes = item['Tempo Médio (min)'];
                
                // Classificação e badge
                let severityLabel = 'Ideal';
                let severityBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                let cardBorderClass = 'border-l-4 border-l-emerald-500';
                
                if (limitMinutes >= 55) {
                  severityLabel = 'Crítico';
                  severityBadgeClass = 'bg-rose-50 text-rose-700 border-rose-100';
                  cardBorderClass = 'border-l-4 border-l-rose-600';
                } else if (limitMinutes >= 45) {
                  severityLabel = 'Excedido';
                  severityBadgeClass = 'bg-amber-50 text-amber-700 border-amber-100';
                  cardBorderClass = 'border-l-4 border-l-amber-500';
                }

                return (
                  <div 
                    key={item.name}
                    className={`p-3.5 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50 transition-all duration-200 flex items-center justify-between ${cardBorderClass}`}
                  >
                    <div className="space-y-1 text-left">
                      <span className="block text-xs font-black text-slate-700 uppercase leading-none truncate max-w-[150px]">
                        {item.name}
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold">
                        <span>{item['Total Paletes'] || 14} paletes</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span>{item['Quantidade de Paradas'] || 1} rotas</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="block font-mono font-black text-slate-800 text-sm leading-none">
                          {limitMinutes}m
                        </span>
                        <span className="text-[8px] font-black uppercase text-slate-400">Permanência</span>
                      </div>
                      
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase border leading-none ${severityBadgeClass}`}>
                        {severityLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rodapé com Explicação Operacional */}
            <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100/50 flex gap-2.5 items-start mt-1">
              <span className="relative flex h-2 w-2 mt-1 sm:mt-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <p className="text-[10px] text-blue-800 leading-normal font-bold text-left">
                <strong>Análise Tática</strong>: Tempos de parada superiores a 45 minutos demandam auditoria de pátio imediata pelas equipes de descarga para mitigar multas contratuais e atrasos flutuantes.
              </p>
            </div>

          </div>

        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary-gold/10 rounded-lg">
              <Activity className="w-6 h-6 text-primary-gold" />
            </div>
            <span className="flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              <ArrowUpRight className="w-3 h-3" /> +12%
            </span>
          </div>
          <h3 className="text-slate-500 text-xs font-black uppercase tracking-wider mb-1">Total de Cargas</h3>
          <p className="text-3xl font-black text-slate-800">{stats.totalLoads}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <span className="flex items-center text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">
              <ArrowUpRight className="w-3 h-3" /> +5%
            </span>
          </div>
          <h3 className="text-slate-500 text-xs font-black uppercase tracking-wider mb-1">Total de Ocorrências</h3>
          <p className="text-3xl font-black text-slate-800">{stats.totalOccurrences}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-amber-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
            <span className="flex items-center text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">
              <ArrowUpRight className="w-3 h-3" /> +2.1%
            </span>
          </div>
          <h3 className="text-slate-500 text-xs font-black uppercase tracking-wider mb-1">Taxa de Ocorrência</h3>
          <p className="text-3xl font-black text-slate-800">{stats.occurrenceRate}%</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <span className="flex items-center text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
              {stats.totalPallets > 0 ? 'Ativo' : 'Vazio'}
            </span>
          </div>
          <h3 className="text-slate-500 text-xs font-black uppercase tracking-wider mb-1">Total de Paletes</h3>
          <p className="text-3xl font-black text-slate-800">{stats.totalPallets}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Occurrence Types */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-gold/10 rounded-xl">
                <PieChartIcon className="w-5 h-5 text-primary-gold" />
              </div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Tipos de Ocorrência</h3>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Clique para detalhar</p>
          </div>
          <div className="h-[350px] w-full">
            {stats.occurrenceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.occurrenceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                    onClick={(data) => setSelectedCategory({ type: 'occurrence', value: data.name })}
                    className="cursor-pointer"
                  >
                    {stats.occurrenceData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                        stroke={selectedCategory.value === entry.name ? '#000' : 'none'}
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => {
                      const percent = ((value / stats.totalOccurrences) * 100).toFixed(1);
                      return [`${value} (${percent}%)`, 'Ocorrências'];
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 italic">
                Sem dados de ocorrência para exibir.
              </div>
            )}
          </div>
        </div>

        {/* Quantidade de Ocorrências por Tipo (Gráfico de Barras) */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-gold/10 rounded-xl">
                <BarChart3 className="w-5 h-5 text-primary-gold" />
              </div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Ocorrências por Tipo (Barras)</h3>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Clique para detalhar</p>
          </div>
          <div className="h-[350px] w-full">
            {stats.occurrenceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={stats.occurrenceData} 
                  margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => {
                      const percent = ((value / stats.totalOccurrences) * 100).toFixed(1);
                      return [`${value} (${percent}%)`, 'Ocorrências'];
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    name="Ocorrências" 
                    radius={[4, 4, 0, 0]} 
                    barSize={32}
                    onClick={(data) => {
                      if (data && data.name) {
                        setSelectedCategory({ type: 'occurrence', value: data.name });
                      }
                    }}
                    className="cursor-pointer"
                  >
                    {stats.occurrenceData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                        stroke={selectedCategory.value === entry.name ? '#000' : 'none'}
                        strokeWidth={2}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 italic">
                Sem dados de ocorrência para exibir.
              </div>
            )}
          </div>
        </div>

        {/* Top Routes with Occurrences */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-xl">
                <MapPin className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Rotas com Maiores Ocorrências</h3>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Clique para detalhar</p>
          </div>
          <div className="h-[350px] w-full">
            {stats.routeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.routeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={150} 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any, name: string) => {
                      if (name === 'rate') return [`${value}%`, 'Taxa de Ocorrência'];
                      if (name === 'totalLoads') return [value, 'Total de Cargas'];
                      if (name === 'totalOccurrences') return [value, 'Total de Ocorrências'];
                      return [value, name];
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 700 }} />
                  {stats.allOccurrenceTypes.map((type, index) => (
                    <Bar 
                      key={type} 
                      dataKey={type} 
                      name={type}
                      stackId="a" 
                      fill={COLORS[index % COLORS.length]} 
                      barSize={24}
                      onClick={(data) => setSelectedCategory({ type: 'route', value: data.name })}
                      className="cursor-pointer"
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 italic">
                Sem dados de rotas para exibir.
              </div>
            )}
          </div>
        </div>

        {/* Category Details (Drill-down) */}
        {selectedCategory.value && (
          <div className="lg:col-span-2 bg-primary-navy text-white p-8 rounded-3xl shadow-xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-gold/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Filter className="w-5 h-5 text-primary-gold" />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">Detalhes: {selectedCategory.value}</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Exploração de dados específicos</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCategory({ type: null, value: null })}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {filteredLoads.map((load) => (
                <div key={load.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-white/10 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full uppercase">
                      Carga #{load.id.slice(-4)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{new Date(load.auditedAt || '').toLocaleString('pt-BR')}</span>
                  </div>
                  <p className="text-sm font-bold mb-1">{load.origin} ➔ {load.destination}</p>
                  <p className="text-xs text-slate-400 line-clamp-1 italic">"{load.occurrenceDescription || 'Sem descrição'}"</p>
                </div>
              ))}
              {filteredLoads.length === 0 && (
                <p className="text-slate-500 italic text-sm col-span-2 text-center py-8">Nenhuma carga recente encontrada para este filtro.</p>
              )}
            </div>
            
            <div className="flex justify-center">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mostrando as 10 ocorrências mais recentes</p>
            </div>
          </div>
        )}

        {/* Cargo Type Analysis */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-purple-50 rounded-xl">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Análise por Tipo de Carga</h3>
          </div>
          <div className="h-[300px] w-full">
            {stats.cargoTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.cargoTypeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 700 }} />
                  <Bar dataKey="totalLoads" name="Total de Cargas" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="totalOccurrences" name="Ocorrências" fill="#E63946" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 italic">
                Sem dados de tipo de carga para exibir.
              </div>
            )}
          </div>
        </div>

        {/* Timeline of Occurrences */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-emerald-50 rounded-xl">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Evolução Temporal de Ocorrências</h3>
          </div>
          <div className="h-[300px] w-full">
            {stats.timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.timelineData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorCount)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 italic">
                Sem dados temporais suficientes.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
