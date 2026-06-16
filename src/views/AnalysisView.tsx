
import React, { useMemo, useState, useEffect } from 'react';
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
  Search, X, Filter, Download, FileText, Package, Clock, Timer, Flame, Grid,
  CheckCircle2, Lock, Maximize2, Minimize2,
  ChevronLeft, ChevronRight, ArrowUpDown, Truck, User, Calendar, ShieldAlert
} from 'lucide-react';

interface AnalysisViewProps {
  loads: CargoLoad[];
}

const COLORS = ['#D4AF37', '#0A1128', '#E63946', '#10b981', '#457B9D', '#A8DADC', '#F1FAEE'];

export const AnalysisView: React.FC<AnalysisViewProps> = ({ loads }) => {
  const [selectedCategory, setSelectedCategory] = useState<{ type: 'occurrence' | 'route' | 'store' | 'cell' | null; value: string | null }>({ type: null, value: null });
  const [mainChartType, setMainChartType] = useState<'bar' | 'line'>('bar');
  const [fullscreenId, setFullscreenId] = useState<string | null>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreenId(document.fullscreenElement ? document.fullscreenElement.id : null);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    if (document.fullscreenElement === element) {
      document.exitFullscreen().catch(err => console.error(err));
    } else {
      element.requestFullscreen().catch(err => console.error(err));
    }
  };
  
  // Automated KPI Threshold Monitoring
  const [efficiencyThreshold, setEfficiencyThreshold] = useState<number>(() => {
    const saved = localStorage.getItem('analysis_efficiency_threshold');
    return saved ? parseFloat(saved) : 92; // Default limit set to 92%
  });

  useEffect(() => {
    localStorage.setItem('analysis_efficiency_threshold', efficiencyThreshold.toString());
  }, [efficiencyThreshold]);

  // Date filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [heatmapSearch, setHeatmapSearch] = useState<string>('');

  // States for dynamic finalized loads list
  const [finalizedLoadsSearch, setFinalizedLoadsSearch] = useState<string>('');
  const [finalizedLoadsStatusFilter, setFinalizedLoadsStatusFilter] = useState<'ALL' | 'RELEASED' | 'BLOCKED'>('ALL');
  const [finalizedLoadsPage, setFinalizedLoadsPage] = useState<number>(1);
  const [finalizedLoadsSortField, setFinalizedLoadsSortField] = useState<string>('auditedAt');
  const [finalizedLoadsSortOrder, setFinalizedLoadsSortOrder] = useState<'asc' | 'desc'>('desc');

  const setPresetRange = (preset: 'today' | '7days' | '30days' | 'all') => {
    const now = new Date();
    if (preset === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      const formatLocalISO = (d: Date) => {
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      };
      setStartDate(formatLocalISO(start));
      setEndDate(formatLocalISO(end));
    } else if (preset === '7days') {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const formatLocalISO = (d: Date) => {
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      };
      setStartDate(formatLocalISO(start));
      setEndDate(formatLocalISO(now));
    } else if (preset === '30days') {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const formatLocalISO = (d: Date) => {
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      };
      setStartDate(formatLocalISO(start));
      setEndDate(formatLocalISO(now));
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  const activePreset = useMemo(() => {
    if (!startDate && !endDate) return 'all';
    const now = new Date();
    const startObj = startDate ? new Date(startDate) : null;
    const endObj = endDate ? new Date(endDate) : null;
    
    if (startObj && endObj) {
      const diffMs = endObj.getTime() - startObj.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      if (Math.abs(startObj.getTime() - todayStart) < 3 * 60 * 60 * 1000 && Math.abs(diffDays - 1) < 0.1) {
        return 'today';
      }
      if (Math.abs(diffDays - 7) < 0.5) {
        return '7days';
      }
      if (Math.abs(diffDays - 30) < 0.5) {
        return '30days';
      }
    }
    return '';
  }, [startDate, endDate]);

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

  // Heatmap: density of occurrences by destination and occurrenceType
  const heatmapData = useMemo(() => {
    const density: Record<string, Record<string, number>> = {};
    const destinationsSet = new Set<string>();
    
    const occurrenceColumns = [
      OccurrenceType.SEAL_DISCREPANCY,
      OccurrenceType.CARGO_EXCHANGE,
      OccurrenceType.SEAL_TAMPERED,
      OccurrenceType.QUANTITY_DISCREPANCY,
      OccurrenceType.OTHER
    ];

    filteredLoadsByDate.forEach(load => {
      const dest = load.destination || 'Sem Destino';
      destinationsSet.add(dest);
      
      if (!density[dest]) {
        density[dest] = {};
        occurrenceColumns.forEach(col => {
          density[dest][col] = 0;
        });
      }
      
      const occType = load.occurrenceType;
      if (occType && occType !== OccurrenceType.NONE && occurrenceColumns.includes(occType)) {
        density[dest][occType] = (density[dest][occType] || 0) + 1;
      }
    });

    const rows = Array.from(destinationsSet).map(dest => {
      let totalForDest = 0;
      const cells: Record<string, number> = {};
      
      occurrenceColumns.forEach(col => {
        const count = density[dest]?.[col] || 0;
        cells[col] = count;
        totalForDest += count;
      });
      
      return {
        destination: dest,
        cells,
        total: totalForDest
      };
    });

    rows.sort((a, b) => b.total - a.total || a.destination.localeCompare(b.destination));

    return {
      rows,
      columns: occurrenceColumns
    };
  }, [filteredLoadsByDate]);

  // Filtered heatmap rows by search query
  const filteredHeatmapRows = useMemo(() => {
    if (!heatmapSearch) return heatmapData.rows;
    const lSearch = heatmapSearch.toLowerCase();
    return heatmapData.rows.filter(r => r.destination.toLowerCase().includes(lSearch));
  }, [heatmapData.rows, heatmapSearch]);

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
    let awaitingCount = 0;
    let releasedCount = 0;
    let blockedCount = 0;
    let totalReleaseMin = 0;
    let releaseWithTimeCount = 0;
    
    filteredLoadsByDate.forEach(load => {
      // Status counting
      if (load.status === CargoStatus.AWAITING) {
        awaitingCount++;
      } else if (load.status === CargoStatus.RELEASED) {
        releasedCount++;
        if (load.auditedAt && load.createdAt) {
          const ms = new Date(load.auditedAt).getTime() - new Date(load.createdAt).getTime();
          const minutes = Math.floor(ms / (1000 * 60));
          if (minutes > 0 && minutes < 1440) {
            totalReleaseMin += minutes;
            releaseWithTimeCount++;
          }
        }
      } else if (load.status === CargoStatus.BLOCKED) {
        blockedCount++;
      }

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

    const statusData = [
      { name: 'Aguardando', value: awaitingCount, fill: '#D4AF37' },
      { name: 'Liberado', value: releasedCount, fill: '#10b981' },
      { name: 'Divergência', value: blockedCount, fill: '#E63946' }
    ];

    const statusOccurrenceData = [
      {
        name: 'Aguardando',
        'Nenhuma': 0,
        'Divergência de Lacre': 0,
        'Troca de Cargas': 0,
        'Lacre Rompido/Trocado': 0,
        'Divergência de Quantidade': 0,
        'Outros': 0,
        total: 0
      },
      {
        name: 'Liberado',
        'Nenhuma': 0,
        'Divergência de Lacre': 0,
        'Troca de Cargas': 0,
        'Lacre Rompido/Trocado': 0,
        'Divergência de Quantidade': 0,
        'Outros': 0,
        total: 0
      },
      {
        name: 'Divergência',
        'Nenhuma': 0,
        'Divergência de Lacre': 0,
        'Troca de Cargas': 0,
        'Lacre Rompido/Trocado': 0,
        'Divergência de Quantidade': 0,
        'Outros': 0,
        total: 0
      }
    ];

    filteredLoadsByDate.forEach(load => {
      let statusGroup = 'Aguardando';
      if (load.status === CargoStatus.RELEASED) {
        statusGroup = 'Liberado';
      } else if (load.status === CargoStatus.BLOCKED) {
        statusGroup = 'Divergência';
      }
      
      const occType = load.occurrenceType || OccurrenceType.NONE;
      
      const group = statusOccurrenceData.find(g => g.name === statusGroup);
      if (group) {
        group[occType] = (group[occType] || 0) + 1;
        group.total++;
      }
    });

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
      occurrenceRate: filteredLoadsByDate.length > 0 ? ((totalOccurrences / filteredLoadsByDate.length) * 100).toFixed(1) : '0',
      statusData,
      statusOccurrenceData,
      avgReleaseTime: releaseWithTimeCount > 0 ? Math.round(totalReleaseMin / releaseWithTimeCount) : 18,
      efficiencyRate: (releasedCount + blockedCount) > 0 
        ? ((releasedCount / (releasedCount + blockedCount)) * 100).toFixed(1) 
        : '100.0',
      blockedCount,
      releasedCount,
      awaitingCount
    };
  }, [filteredLoadsByDate]);

  const isEfficient = useMemo(() => {
    return parseFloat(stats.efficiencyRate) >= efficiencyThreshold;
  }, [stats.efficiencyRate, efficiencyThreshold]);

  const regionStats = useMemo(() => {
    let dfLoads = 0;
    let goLoads = 0;
    let baLoads = 0;
    let toLoads = 0;

    let dfPallets = 0;
    let goPallets = 0;
    let baPallets = 0;
    let toPallets = 0;

    let dfAwaiting = 0;
    let goAwaiting = 0;
    let baAwaiting = 0;
    let toAwaiting = 0;

    let dfReleased = 0;
    let goReleased = 0;
    let baReleased = 0;
    let toReleased = 0;

    let dfBlocked = 0;
    let goBlocked = 0;
    let baBlocked = 0;
    let toBlocked = 0;

    filteredLoadsByDate.forEach(load => {
      const dest = load.destination.toUpperCase();
      
      const isGo = dest.includes('-GO') || 
                   dest.includes('GOIANIA') || 
                   dest.includes('GOIÂNIA') ||
                   dest.includes('BALNEARIO') || 
                   dest.includes('BALNEÁRIO') || 
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

      const isTo = dest.includes('-TO') || 
                   dest.includes('GURUPI');

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
      } else if (isTo) {
        toLoads++;
        toPallets += load.palletCount || 0;
        if (load.status === CargoStatus.RELEASED) toReleased++;
        else if (load.status === CargoStatus.BLOCKED) toBlocked++;
        else toAwaiting++;
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
      },
      {
        region: 'TO',
        fullname: 'Tocantins (TO)',
        description: 'Lojas Gurupi e Região',
        total: toLoads,
        pallets: toPallets,
        colorBg: 'bg-[#2563EB]', // Blue (matching CentralView design)
        textColor: 'text-[#2563EB]',
        borderColor: 'border-[#2563EB]/20',
        chartData: [
          { name: 'Liberadas', Cargas: toReleased, fill: '#10b981' },
          { name: 'Bloqueadas', Cargas: toBlocked, fill: '#E63946' },
          { name: 'Aguardando', Cargas: toAwaiting, fill: '#D4AF37' }
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
      'GURUPI': 80,
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
      if (clean.includes('GURUPI')) return 'GURUPI (TO)';
      
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

  // Dynamic list of finalized loads filtered by the date range selector and search parameters
  const finalizedLoadsList = useMemo(() => {
    // Only loads that are RELEASED or BLOCKED
    const list = filteredLoadsByDate.filter(load => 
      load.status === CargoStatus.RELEASED || load.status === CargoStatus.BLOCKED
    );

    // Apply status filter matching 'ALL' | 'RELEASED' | 'BLOCKED'
    let filtered = [...list];
    if (finalizedLoadsStatusFilter !== 'ALL') {
      const matchStatus = finalizedLoadsStatusFilter === 'RELEASED' ? CargoStatus.RELEASED : CargoStatus.BLOCKED;
      filtered = filtered.filter(load => load.status === matchStatus);
    }

    // Apply search filter (plate, driver name, id, origin, destination, occurrence type)
    if (finalizedLoadsSearch.trim() !== '') {
      const searchLower = finalizedLoadsSearch.toLowerCase();
      filtered = filtered.filter(load => 
        load.plate.toLowerCase().includes(searchLower) ||
        load.driverName.toLowerCase().includes(searchLower) ||
        load.id.toLowerCase().includes(searchLower) ||
        load.origin.toLowerCase().includes(searchLower) ||
        load.destination.toLowerCase().includes(searchLower) ||
        (load.occurrenceType && load.occurrenceType.toLowerCase().includes(searchLower))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      if (finalizedLoadsSortField === 'auditedAt') {
        valA = new Date(a.auditedAt || a.createdAt || 0).getTime();
        valB = new Date(b.auditedAt || b.createdAt || 0).getTime();
      } else if (finalizedLoadsSortField === 'plate') {
        valA = a.plate;
        valB = b.plate;
      } else if (finalizedLoadsSortField === 'id') {
        valA = a.id;
        valB = b.id;
      } else if (finalizedLoadsSortField === 'palletCount') {
        valA = a.palletCount;
        valB = b.palletCount;
      } else if (finalizedLoadsSortField === 'status') {
        valA = a.status;
        valB = b.status;
      } else {
        valA = a.createdAt;
        valB = b.createdAt;
      }

      if (valA < valB) return finalizedLoadsSortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return finalizedLoadsSortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [filteredLoadsByDate, finalizedLoadsSearch, finalizedLoadsStatusFilter, finalizedLoadsSortField, finalizedLoadsSortOrder]);

  const rowsPerPage = 10;
  const totalPages = Math.ceil(finalizedLoadsList.length / rowsPerPage) || 1;
  const safePage = Math.min(finalizedLoadsPage, totalPages);
  
  const paginatedFinalizedLoads = useMemo(() => {
    const startIndex = (safePage - 1) * rowsPerPage;
    return finalizedLoadsList.slice(startIndex, startIndex + rowsPerPage);
  }, [finalizedLoadsList, safePage]);

  const requestSort = (field: string) => {
    let order: 'asc' | 'desc' = 'asc';
    if (finalizedLoadsSortField === field && finalizedLoadsSortOrder === 'asc') {
      order = 'desc';
    }
    setFinalizedLoadsSortField(field);
    setFinalizedLoadsSortOrder(order);
    setFinalizedLoadsPage(1); // Reset page to 1 on sort change
  };

  const filteredLoads = useMemo(() => {
    if (!selectedCategory.type || !selectedCategory.value) return [];
    
    return filteredLoadsByDate.filter(load => {
      if (selectedCategory.type === 'occurrence') {
        return load.occurrenceType === selectedCategory.value;
      } else if (selectedCategory.type === 'route') {
        const route = `${load.origin} ➔ ${load.destination}`;
        return route === selectedCategory.value && load.occurrenceType && load.occurrenceType !== OccurrenceType.NONE;
      } else if (selectedCategory.type === 'store') {
        return load.destination === selectedCategory.value && load.occurrenceType && load.occurrenceType !== OccurrenceType.NONE;
      } else if (selectedCategory.type === 'cell') {
        const [destination, occurrenceType] = selectedCategory.value.split('||');
        return load.destination === destination && load.occurrenceType === occurrenceType;
      }
      return false;
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

  const exportToCSV = () => {
    const headers = [
      'ID do Manifesto',
      'Placa do Veículo',
      'Nome do Motorista',
      'Tipo de Carga',
      'Quantidade de Paletes',
      'Status Atual',
      'Origem',
      'Destino Principal',
      'Destinos Adicionais',
      'Número do Lacre',
      'Alto Risco (PAR)',
      'Parâmetro PAR',
      'Nota Fiscal PAR',
      'Descrição PAR',
      'Tipo de Ocorrência',
      'Descrição da Ocorrência',
      'Expedidor',
      'Data de Criação',
      'Data de Auditoria'
    ];

    const escape = (val: any) => {
      if (val === undefined || val === null) return '';
      const str = String(val).replace(/\r?\n/g, ' ');
      if (str.includes(';') || str.includes('"') || str.includes('\n') || str.includes(',')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = filteredLoadsByDate.map(load => {
      const additionalDests = load.additionalDestinations && Array.isArray(load.additionalDestinations)
        ? load.additionalDestinations.join(', ')
        : '';
        
      return [
        escape(load.id),
        escape(load.plate),
        escape(load.driverName),
        escape(load.cargoType),
        escape(load.palletCount),
        escape(load.status),
        escape(load.origin),
        escape(load.destination),
        escape(additionalDests),
        escape(load.sealNumber),
        escape(load.isHighRisk ? 'SIM' : 'NÃO'),
        escape(load.parType || 'N/A'),
        escape(load.parInvoiceNumber || 'N/A'),
        escape(load.parDescription || ''),
        escape(load.occurrenceType || 'Nenhum'),
        escape(load.occurrenceDescription || ''),
        escape(load.createdBy || ''),
        escape(load.createdAt ? new Date(load.createdAt).toLocaleString('pt-BR') : ''),
        escape(load.auditedAt ? new Date(load.auditedAt).toLocaleString('pt-BR') : 'Pendente')
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    let filename = 'relatorio_cargas';
    if (startDate) {
      filename += `_desde_${startDate.split('T')[0]}`;
    }
    if (endDate) {
      filename += `_ate_${endDate.split('T')[0]}`;
    }
    filename += '.csv';

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportFinalizedToCSV = () => {
    const finalizedLoads = filteredLoadsByDate.filter(
      load => load.status === CargoStatus.RELEASED || load.status === CargoStatus.BLOCKED
    );

    const headers = [
      'ID do Manifesto',
      'Placa do Veículo',
      'Nome do Motorista',
      'Tipo de Carga',
      'Quantidade de Paletes',
      'Status Atual',
      'Origem',
      'Destino Principal',
      'Destinos Adicionais',
      'Número do Lacre',
      'Alto Risco (PAR)',
      'Parâmetro PAR',
      'Nota Fiscal PAR',
      'Descrição PAR',
      'Tipo de Ocorrência',
      'Descrição da Ocorrência',
      'Expedidor',
      'Data de Criação',
      'Data de Auditoria'
    ];

    const escape = (val: any) => {
      if (val === undefined || val === null) return '';
      const str = String(val).replace(/\r?\n/g, ' ');
      if (str.includes(';') || str.includes('"') || str.includes('\n') || str.includes(',')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = finalizedLoads.map(load => {
      const additionalDests = load.additionalDestinations && Array.isArray(load.additionalDestinations)
        ? load.additionalDestinations.join(', ')
        : '';
        
      return [
        escape(load.id),
        escape(load.plate),
        escape(load.driverName),
        escape(load.cargoType),
        escape(load.palletCount),
        escape(load.status),
        escape(load.origin),
        escape(load.destination),
        escape(additionalDests),
        escape(load.sealNumber),
        escape(load.isHighRisk ? 'SIM' : 'NÃO'),
        escape(load.parType || 'N/A'),
        escape(load.parInvoiceNumber || 'N/A'),
        escape(load.parDescription || ''),
        escape(load.occurrenceType || 'Nenhum'),
        escape(load.occurrenceDescription || ''),
        escape(load.createdBy || ''),
        escape(load.createdAt ? new Date(load.createdAt).toLocaleString('pt-BR') : ''),
        escape(load.auditedAt ? new Date(load.auditedAt).toLocaleString('pt-BR') : '')
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    let filename = 'relatorio_cargas_finalizadas';
    if (startDate) {
      filename += `_desde_${startDate.split('T')[0]}`;
    }
    if (endDate) {
      filename += `_ate_${endDate.split('T')[0]}`;
    }
    filename += '.csv';

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full lg:w-auto">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex-1">
            
            {/* Quick Presets Buttons */}
            <div className="flex flex-col gap-1.5 shrink-0">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" /> Atalhos Rápidos
              </span>
              <div className="bg-slate-105 bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 gap-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => setPresetRange('today')}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300 border-0 cursor-pointer ${
                    activePreset === 'today'
                      ? 'bg-primary-gold text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                  }`}
                >
                  Hoje
                </button>
                <button
                  type="button"
                  onClick={() => setPresetRange('7days')}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300 border-0 cursor-pointer ${
                    activePreset === '7days'
                      ? 'bg-primary-gold text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                  }`}
                >
                  7 Dias
                </button>
                <button
                  type="button"
                  onClick={() => setPresetRange('30days')}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300 border-0 cursor-pointer ${
                    activePreset === '30days'
                      ? 'bg-primary-gold text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                  }`}
                >
                  30 Dias
                </button>
                <button
                  type="button"
                  onClick={() => setPresetRange('all')}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300 border-0 cursor-pointer ${
                    activePreset === 'all'
                      ? 'bg-primary-gold text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                  }`}
                >
                  Tudo
                </button>
              </div>
            </div>

            {/* Separator */}
            <div className="hidden sm:block h-8 w-px bg-slate-200 shrink-0 self-end mb-1" />

            {/* Calendar Inputs */}
            <div className="flex items-center gap-3 flex-1">
              <div className="flex flex-col gap-1 flex-1 min-w-[125px]">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">De (Início)</label>
                <input 
                  type="datetime-local" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-gold focus:border-transparent transition-all shadow-inner"
                />
              </div>
              
              <div className="flex flex-col gap-1 flex-1 min-w-[125px]">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Até (Fim)</label>
                <input 
                  type="datetime-local" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-gold focus:border-transparent transition-all shadow-inner"
                />
              </div>
            </div>

            {(startDate || endDate) && (
              <button 
                type="button"
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="self-end mb-1 p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all cursor-pointer border-0 flex items-center justify-center h-9 w-9"
                title="Limpar Filtros"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <button 
            type="button"
            onClick={exportReport}
            className="flex items-center justify-center gap-2 bg-primary-navy hover:bg-primary-navy/90 text-white px-6 py-4 rounded-3xl font-black text-xs uppercase tracking-widest transition-all shadow-lg hover:shadow-xl active:scale-95 border-b-4 border-primary-gold shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>

          <button 
            type="button"
            onClick={exportFinalizedToCSV}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-3xl font-black text-xs uppercase tracking-widest transition-all shadow-lg hover:shadow-xl active:scale-95 border-b-4 border-emerald-800 shrink-0 cursor-pointer"
            title="Exportar todas as cargas finalizadas (Liberadas ou Bloqueadas) no formato CSV"
          >
            <FileText className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Painel Geral de KPIs no Topo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: Taxa de Eficiência */}
        <div id="kpi-eficiencia" className={`p-6 rounded-3xl border shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300 ${
          isEfficient 
            ? 'bg-gradient-to-br from-white to-emerald-50/10 border-slate-200' 
            : 'bg-gradient-to-br from-rose-50/40 to-rose-100/10 border-rose-200 shadow-rose-100/50'
        }`}>
          <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500 opacity-60 ${
            isEfficient ? 'bg-emerald-50' : 'bg-rose-100/40'
          }`}></div>
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest block">Taxa de Eficiência</span>
              <div className="flex items-baseline gap-1.5">
                <span className={`font-mono text-4xl font-black tracking-tight ${
                  isEfficient ? 'text-slate-800' : 'text-rose-600'
                }`}>{stats.efficiencyRate}%</span>
                <span className={`text-[11px] font-bold flex items-center gap-0.5 ${
                  isEfficient ? 'text-emerald-600' : 'text-rose-600 animate-pulse'
                }`}>
                  {isEfficient ? <ArrowUpRight className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />} 
                  {isEfficient ? 'SLA Ok' : 'CRÍTICO'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-bold leading-normal">
                Proporção de cargas auditadas liberadas sem divergências graves.
              </p>
            </div>
            <div className={`p-3 rounded-2xl shadow-inner group-hover:rotate-6 transition-transform duration-300 ${
              isEfficient ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-100 text-rose-600 animate-bounce'
            }`}>
              {isEfficient ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Meta SLA:</span>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 shadow-inner">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={efficiencyThreshold}
                  onChange={(e) => setEfficiencyThreshold(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                  className="w-10 text-center text-xs font-black text-slate-700 bg-transparent border-none p-0 outline-none focus:ring-0"
                />
                <span className="text-[10px] font-bold text-slate-400 ml-0.5">%</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider">
              {isEfficient ? (
                <span className="text-emerald-600 bg-emerald-100/50 px-2 py-1 rounded-md flex items-center gap-1 font-black">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Conforme (Min {efficiencyThreshold}%)
                </span>
              ) : (
                <span className="text-rose-600 bg-rose-100/50 px-2 py-1 rounded-md flex items-center gap-1 font-black">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                  Alerta (Abaixo de {efficiencyThreshold}%)
                </span>
              )}
            </div>
          </div>
        </div>
 
        {/* KPI 2: Tempo Médio de Liberação */}
        <div id="kpi-tempo-liberacao" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/70 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500 opacity-60"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest block">Tempo Médio de Liberação</span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-4xl font-black text-slate-800 tracking-tight">{stats.avgReleaseTime}</span>
                <span className="text-sm font-bold text-slate-500 tracking-tight">minutos</span>
              </div>
              <p className="text-[11px] text-slate-500 font-bold leading-normal">
                Intervalo médio entre o início do manifesto e a autorização de saída.
              </p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shadow-inner group-hover:rotate-6 transition-transform duration-300">
              <Timer className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Limite Estimado Gate:</span>
            <span className="text-indigo-600 font-extrabold">25 min SLA</span>
          </div>
        </div>
 
        {/* KPI 3: Cargas Bloqueadas */}
        <div id="kpi-bloqueios" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500 opacity-60"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest block">Auditorias com Divergência</span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-4xl font-black text-rose-600 tracking-tight">{stats.blockedCount}</span>
                <span className="text-sm font-bold text-rose-500 tracking-tight">retidas</span>
              </div>
              <p className="text-[11px] text-slate-500 font-bold leading-normal">
                Veículos atualmente retidos no gate devido a divergências de lacre ou avarias.
              </p>
            </div>
            <div className={`p-3 rounded-xl shadow-inner group-hover:rotate-6 transition-transform duration-300 ${stats.blockedCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
              <Lock className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Ação Preventiva:</span>
            <span className={`${stats.blockedCount > 0 ? 'text-rose-600 font-black' : 'text-slate-400 font-bold'}`}>
              {stats.blockedCount > 0 ? 'Atenção Necessária' : 'Zero Críticos'}
            </span>
          </div>
        </div>

        {/* KPI 4: Exportar Relatório CSV */}
        <div id="kpi-exportar-csv" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300 flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500 opacity-60"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest block">Exportação</span>
              <h3 className="font-mono text-base font-black text-slate-700 tracking-tight leading-snug">Relatório Planilha</h3>
              <p className="text-[11px] text-slate-500 font-bold leading-normal">
                Baixe planilhas de cargas do período em formato CSV compatível com Excel.
              </p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shadow-inner group-hover:rotate-6 transition-transform duration-300">
              <FileText className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2 relative z-10">
            <button
              type="button"
              onClick={exportFinalizedToCSV}
              className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md border-0"
              title="Baixar planilha contendo apenas cargas finalizadas (com status de liberada ou bloqueada)"
            >
              <Download className="w-3.5 h-3.5" />
              Cargas Finalizadas ({stats.releasedCount + stats.blockedCount})
            </button>
            <button
              type="button"
              onClick={exportToCSV}
              className="w-full flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-sm border border-slate-200"
              title="Baixar planilha contendo todas as cargas registradas (incluindo as pendentes)"
            >
              <Download className="w-3.5 h-3.5" />
              Todas as Cargas ({filteredLoadsByDate.length})
            </button>
          </div>
        </div>
      </div>

      {/* Cards de Resumo de Cargas por Região (DF, GO, BA, TO) com Gráficos Recharts */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-4">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary-gold animate-pulse"></span>
              Performance e Resumo Logístico por Região (DF, GO, BA, TO)
            </h3>
            <p className="text-[11px] text-slate-500 font-bold">Análise do status de cargas processadas em cada destino geográfico para apoio à decisão tática.</p>
          </div>
          <div className="text-[10px] uppercase font-black tracking-widest bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100">
            Sincronizado
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
        {/* Cruzamento Dinâmico: Volume de Cargas por Status e Tipo de Ocorrência */}
        <div id="chart-cruzamento" className={`lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm transition-all duration-300 ${
          fullscreenId === 'chart-cruzamento' ? 'p-12 w-full h-screen overflow-y-auto z-50 flex flex-col justify-between' : 'p-8'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-xl">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Cargas por Status e Tipo de Ocorrência</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Volume em tempo real cruzando status operacional com inconformidades</p>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              {/* Visual format selector */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60 shadow-inner">
                <button
                  type="button"
                  id="btn-chart-bar"
                  onClick={() => setMainChartType('bar')}
                  className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all duration-200 flex items-center gap-1.5 border-0 cursor-pointer ${
                    mainChartType === 'bar'
                      ? 'bg-white shadow text-indigo-600'
                      : 'text-slate-500 hover:text-slate-800 bg-transparent'
                  }`}
                  title="Gráfico de Barras"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  Barras
                </button>
                <button
                  type="button"
                  id="btn-chart-line"
                  onClick={() => setMainChartType('line')}
                  className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all duration-200 flex items-center gap-1.5 border-0 cursor-pointer ${
                    mainChartType === 'line'
                      ? 'bg-white shadow text-indigo-600'
                      : 'text-slate-500 hover:text-slate-800 bg-transparent'
                  }`}
                  title="Gráfico de Linha"
                >
                  <Activity className="w-3.5 h-3.5" />
                  Linhas
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="flex items-center h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[9px] font-black uppercase text-emerald-600 tracking-widest bg-emerald-50 px-2 py-1 rounded">Tempo Real</span>
              </div>

              {/* Fullscreen Button */}
              <button
                type="button"
                onClick={() => toggleFullscreen('chart-cruzamento')}
                className="p-2 px-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 transition-colors border border-slate-200/50 flex items-center justify-center cursor-pointer shadow-sm"
                title={fullscreenId === 'chart-cruzamento' ? "Sair do modo tela cheia" : "Expandir em tela cheia"}
              >
                {fullscreenId === 'chart-cruzamento' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                <span className="text-[10px] font-bold uppercase ml-1 pb-px">
                  {fullscreenId === 'chart-cruzamento' ? 'Recolher' : 'Expandir'}
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* Recharts Chart Container (Alternates dynamic layouts) */}
            <div className={`w-full transition-all duration-300 ${
              fullscreenId === 'chart-cruzamento' ? 'xl:col-span-12 h-[68vh]' : 'xl:col-span-8 h-[380px]'
            }`}>
              {stats.totalLoads > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  {mainChartType === 'bar' ? (
                    <BarChart 
                      data={stats.statusOccurrenceData}
                      margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fontSize: 11, fontWeight: 900, fill: '#1e293b' }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                        allowDecimals={false}
                      />
                      <Tooltip 
                        cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }}
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const total = payload.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
                            return (
                              <div className="bg-slate-950 border border-slate-850 text-white p-4 rounded-2xl shadow-xl text-xs space-y-2 font-sans text-left">
                                <p className="font-extrabold text-primary-gold uppercase tracking-widest border-b border-white/15 pb-1.5">{label}</p>
                                <div className="space-y-1 text-slate-300 font-bold max-w-[250px]">
                                  {payload.map((item) => {
                                    if (!item.value) return null;
                                    const nameStr = String(item.name);
                                    const pct = total > 0 ? ((Number(item.value) / total) * 100).toFixed(1) : '0';
                                    return (
                                      <p key={item.name} className="flex justify-between gap-6 items-center">
                                        <span className="flex items-center gap-1.5 font-medium">
                                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                          <span className="text-slate-400">{nameStr}:</span>
                                        </span> 
                                        <span className="font-mono font-black text-white">{item.value} <span className="text-[9px] font-bold text-slate-400">({pct}%)</span></span>
                                      </p>
                                    );
                                  })}
                                  <p className="flex justify-between gap-6 items-center pt-1.5 border-t border-white/10 font-black text-white">
                                    <span>Total:</span>
                                    <span className="font-mono">{total} cargas</span>
                                  </p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      
                      {/* Occurrences segments stacks */}
                      <Bar dataKey="Nenhuma" name="Nenhuma" stackId="statusVol" fill="#10b981" barSize={40} />
                      <Bar dataKey="Divergência de Lacre" name="Divergência de Lacre" stackId="statusVol" fill="#f59e0b" barSize={40} />
                      <Bar dataKey="Troca de Cargas" name="Troca de Cargas" stackId="statusVol" fill="#3b82f6" barSize={40} />
                      <Bar dataKey="Lacre Rompido/Trocado" name="Lacre Rompido/Trocado" stackId="statusVol" fill="#ef4444" barSize={40} />
                      <Bar dataKey="Divergência de Quantidade" name="Divergência de Quantidade" stackId="statusVol" fill="#8b5cf6" barSize={40} />
                      <Bar dataKey="Outros" name="Outros" stackId="statusVol" fill="#64748b" barSize={40} />
                    </BarChart>
                  ) : (
                    <LineChart 
                      data={stats.statusOccurrenceData}
                      margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fontSize: 11, fontWeight: 900, fill: '#1e293b' }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                        allowDecimals={false}
                      />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const total = payload.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
                            return (
                              <div className="bg-slate-950 border border-slate-850 text-white p-4 rounded-2xl shadow-xl text-xs space-y-2 font-sans text-left">
                                <p className="font-extrabold text-primary-gold uppercase tracking-widest border-b border-white/15 pb-1.5">{label}</p>
                                <div className="space-y-1 text-slate-300 font-bold max-w-[250px]">
                                  {payload.map((item) => {
                                    if (!item.value) return null;
                                    const nameStr = String(item.name);
                                    const pct = total > 0 ? ((Number(item.value) / total) * 100).toFixed(1) : '0';
                                    return (
                                      <p key={item.name} className="flex justify-between gap-6 items-center">
                                        <span className="flex items-center gap-1.5 font-medium">
                                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                          <span className="text-slate-400">{nameStr}:</span>
                                        </span> 
                                        <span className="font-mono font-black text-white">{item.value} <span className="text-[9px] font-bold text-slate-400">({pct}%)</span></span>
                                      </p>
                                    );
                                  })}
                                  <p className="flex justify-between gap-6 items-center pt-1.5 border-t border-white/10 font-black text-white">
                                    <span>Total:</span>
                                    <span className="font-mono">{total} cargas</span>
                                  </p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      
                      {/* Occurrences segments lines representing consistency */}
                      <Line type="monotone" dataKey="Nenhuma" name="Nenhuma" stroke="#10b981" strokeWidth={3.5} dot={{ r: 5, strokeWidth: 2 }} activeDot={{ r: 7 }} />
                      <Line type="monotone" dataKey="Divergência de Lacre" name="Divergência de Lacre" stroke="#f59e0b" strokeWidth={3.5} dot={{ r: 5, strokeWidth: 2 }} activeDot={{ r: 7 }} />
                      <Line type="monotone" dataKey="Troca de Cargas" name="Troca de Cargas" stroke="#3b82f6" strokeWidth={3.5} dot={{ r: 5, strokeWidth: 2 }} activeDot={{ r: 7 }} />
                      <Line type="monotone" dataKey="Lacre Rompido/Trocado" name="Lacre Rompido/Trocado" stroke="#ef4444" strokeWidth={3.5} dot={{ r: 5, strokeWidth: 2 }} activeDot={{ r: 7 }} />
                      <Line type="monotone" dataKey="Divergência de Quantidade" name="Divergência de Quantidade" stroke="#8b5cf6" strokeWidth={3.5} dot={{ r: 5, strokeWidth: 2 }} activeDot={{ r: 7 }} />
                      <Line type="monotone" dataKey="Outros" name="Outros" stroke="#64748b" strokeWidth={3.5} dot={{ r: 5, strokeWidth: 2 }} activeDot={{ r: 7 }} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 italic">
                  Sem dados para exibição do volume de cargas.
                </div>
              )}
            </div>

            {/* Metrics Breakdown Sidebar */}
            <div className={`xl:col-span-4 flex flex-col justify-between ${
              fullscreenId === 'chart-cruzamento' ? 'hidden' : ''
            }`}>
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inconformidades Reais</h4>
                <div className="grid grid-cols-2 gap-3 xl:grid-cols-1">
                  {/* Status Indicator breakdown cards */}
                  {stats.statusOccurrenceData.map((group) => {
                    // count total deviation items
                    const totalDevs = group.total - group['Nenhuma'];
                    const pctDev = group.total > 0 ? ((totalDevs / group.total) * 100).toFixed(0) : '0';
                    return (
                      <div key={group.name} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-black text-slate-800 uppercase">{group.name}</span>
                          <span className="font-mono text-xs font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">{group.total}</span>
                        </div>
                        <div className="flex items-baseline justify-between font-sans">
                          <span className="text-[10px] font-bold text-slate-400">Com divergência:</span>
                          <span className={`font-mono text-xs font-black ${totalDevs > 0 ? 'text-red-500' : 'text-slate-500'}`}>
                            {totalDevs} un ({pctDev}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Decorative analytical info board */}
              <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100/50 flex gap-3 mt-4">
                <span className="p-1 px-1.5 h-fit text-indigo-700 bg-white border border-indigo-100 font-extrabold text-[9px] rounded-lg uppercase shrink-0">SLA</span>
                <p className="text-[10px] text-indigo-900 leading-normal font-bold">
                  <strong>Controle de Riscos</strong>: Cargas liberadas com inconformidades registradas em histórico geram alertas de pátio automáticos à Central de Monitoramento.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mapa de Calor (Heatmap) de Ocorrências por Destino */}
        <div id="chart-heatmap" className={`lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm transition-all duration-300 ${
          fullscreenId === 'chart-heatmap' ? 'p-12 w-full h-screen overflow-y-auto z-50 flex flex-col justify-between' : 'p-8'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-50 rounded-xl relative">
                <Flame className="w-5 h-5 text-rose-500 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Mapa de Calor: Ocorrências por Destino</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Frequência e severidade de auditorias inconformes mapeadas por loja e tipo de ocorrência</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
              {/* Search Input block inside card header */}
              <div className="relative flex items-center min-w-[200px] w-full sm:w-auto">
                <span className="absolute left-3 text-slate-400 pointer-events-none flex items-center">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Buscar por Loja/Destino..."
                  value={heatmapSearch}
                  onChange={(e) => setHeatmapSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-gold focus:border-transparent transition-all shadow-inner"
                />
                {heatmapSearch && (
                  <button
                    type="button"
                    onClick={() => setHeatmapSearch('')}
                    className="absolute right-2.5 p-1 hover:bg-slate-200 rounded-full cursor-pointer text-slate-400 border-0 bg-transparent flex items-center justify-center text-center"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Fullscreen Button */}
              <button
                type="button"
                onClick={() => toggleFullscreen('chart-heatmap')}
                className="p-2 px-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 transition-colors border border-slate-200/50 flex items-center justify-center cursor-pointer shadow-sm shrink-0"
                title={fullscreenId === 'chart-heatmap' ? "Sair do modo tela cheia" : "Expandir em tela cheia"}
              >
                {fullscreenId === 'chart-heatmap' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                <span className="text-[10px] font-bold uppercase ml-1 pb-px">
                  {fullscreenId === 'chart-heatmap' ? 'Recolher' : 'Expandir'}
                </span>
              </button>
            </div>
          </div>

          {/* Color Scale Legend */}
          <div className="flex flex-wrap items-center gap-4 bg-slate-50/70 border border-slate-100 p-3.5 rounded-2xl mb-6 text-[10px] font-black uppercase text-slate-500 tracking-wider">
            <span className="text-slate-400">Escala de Intensidade:</span>
            <div className="flex flex-wrap gap-4">
              <span className="flex items-center gap-1.5 font-bold text-slate-500">
                <span className="w-3.5 h-3.5 rounded bg-slate-50 border border-slate-200 block shadow-inner animate-duration-1000" /> 0 Ocorrências
              </span>
              <span className="flex items-center gap-1.5 font-bold text-slate-500">
                <span className="w-3.5 h-3.5 rounded bg-rose-50 border border-rose-100 block" /> 1 Caso
              </span>
              <span className="flex items-center gap-1.5 font-bold text-slate-500">
                <span className="w-3.5 h-3.5 rounded bg-rose-100 border border-rose-200 block" /> 2 Casos
              </span>
              <span className="flex items-center gap-1.5 font-bold text-slate-500">
                <span className="w-3.5 h-3.5 rounded bg-rose-200 border border-rose-300 block" /> 3 Casos
              </span>
              <span className="flex items-center gap-1.5 font-bold text-slate-500">
                <span className="w-3.5 h-3.5 rounded bg-rose-600 border border-rose-500 block" /> 4+ Crítico
              </span>
            </div>
          </div>

          {/* Table Container wrapping Heatmap Matrix */}
          <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm relative scrollbar-thin">
            {filteredHeatmapRows.length > 0 ? (
              <table className="w-full border-collapse text-left text-xs bg-white min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-wider text-slate-500 w-[200px]">Destino (Loja)</th>
                    {heatmapData.columns.map((colName) => (
                      <th 
                        key={colName} 
                        onClick={() => setSelectedCategory({ type: 'occurrence', value: colName })}
                        className="py-4 px-4 text-center text-[9px] font-black uppercase tracking-widest text-slate-500 cursor-pointer hover:bg-slate-100/50 hover:text-slate-800 transition-colors"
                      >
                        {colName}
                      </th>
                    ))}
                    <th className="py-4 px-6 text-center text-[10px] font-black uppercase tracking-wider text-slate-500 w-[100px] border-l border-slate-200">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHeatmapRows.map((row) => (
                    <tr 
                      key={row.destination} 
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      {/* Name of destination with trigger filter */}
                      <td 
                        onClick={() => setSelectedCategory({ type: 'store', value: row.destination })}
                        className="py-3 px-6 font-extrabold text-slate-800 hover:text-indigo-600 transition-colors cursor-pointer border-r border-slate-100 bg-white"
                      >
                        {row.destination}
                        <span className="block text-[8px] text-slate-400 font-bold uppercase mt-0.5">Filtrar loja</span>
                      </td>

                      {/* Display cells mapped */}
                      {heatmapData.columns.map((colName) => {
                        const count = row.cells[colName] || 0;
                        let cellBg = 'bg-slate-50/50 text-slate-300';
                        let cellText = 'font-normal';
                        
                        if (count === 1) {
                          cellBg = 'bg-rose-50 text-rose-600 border border-rose-100/35';
                          cellText = 'font-black';
                        } else if (count === 2) {
                          cellBg = 'bg-rose-100 text-rose-700 border border-rose-200/50';
                          cellText = 'font-black scale-[1.02] shadow-sm';
                        } else if (count === 3) {
                          cellBg = 'bg-rose-200 text-rose-850 border border-rose-300/50';
                          cellText = 'font-black scale-[1.04] shadow-sm';
                        } else if (count >= 4) {
                          cellBg = 'bg-rose-600 text-white border border-rose-500 shadow-md';
                          cellText = 'font-black scale-[1.06]';
                        }

                        return (
                          <td key={colName} className="p-1 px-2 text-center align-middle">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCategory({
                                  type: 'cell',
                                  value: `${row.destination}||${colName}`
                                });
                                // Smooth scroll to the details view container
                                const detailsElement = document.getElementById('drilldown-details');
                                if (detailsElement) {
                                  detailsElement.scrollIntoView({ behavior: 'smooth' });
                                }
                              }}
                              className={`w-full py-2.5 rounded-xl transition-all duration-200 border-0 flex items-center justify-center text-xs leading-none cursor-pointer ${cellBg} ${cellText} hover:scale-[1.03] select-none`}
                              title={`${row.destination}: ${count} Ocorrências de "${colName}"`}
                            >
                              {count > 0 ? count : '-'}
                            </button>
                          </td>
                        );
                      })}

                      {/* Total column */}
                      <td className="py-3 px-6 text-center border-l border-slate-100 font-mono font-black text-xs text-slate-800 bg-white">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg ${row.total > 0 ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-50 text-slate-400'}`}>
                          {row.total}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-12 bg-slate-50 flex flex-col items-center justify-center text-slate-400 italic">
                <Grid className="w-8 h-8 text-slate-300 mb-2" />
                <span>Nenhum resultado correspondente para "{heatmapSearch}".</span>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex gap-2.5 items-start bg-indigo-50/50 p-4 border border-indigo-100/30 rounded-2xl">
            <span className="p-1 px-1.5 text-indigo-700 bg-white border border-indigo-100 font-black text-[9px] rounded-lg uppercase leading-none mt-0.5">Dica</span>
            <p className="text-[10px] text-indigo-900 leading-normal font-bold text-left">
              <strong>Interatividade total</strong>: Clique em uma célula do mapa de calor para focar na lista detalhada das cargas exatas com aquela inconformidade associadas àquela loja. Também é possível usar a barra de busca para encontrar lojas específicas rapidamente.
            </p>
          </div>
        </div>

        {/* Distribuição por Status das Cargas (Rosca) */}
        <div id="chart-status-pie" className={`bg-white rounded-3xl border border-slate-200 shadow-sm transition-all duration-300 ${
          fullscreenId === 'chart-status-pie' ? 'p-12 w-full h-screen overflow-y-auto z-50 flex flex-col justify-between md:col-span-2 lg:col-span-2' : 'p-8'
        }`}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-gold/10 rounded-xl">
                <PieChartIcon className="w-5 h-5 text-primary-gold" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Distribuição por Status</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Cargas em tempo real</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-[10px] font-black bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full uppercase">
                Total: {stats.totalLoads}
              </div>
              {/* Fullscreen Button */}
              <button
                type="button"
                onClick={() => toggleFullscreen('chart-status-pie')}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors border border-slate-200/50 flex items-center justify-center cursor-pointer shadow-sm"
                title={fullscreenId === 'chart-status-pie' ? "Sair do modo tela cheia" : "Expandir em tela cheia"}
              >
                {fullscreenId === 'chart-status-pie' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className={`w-full flex flex-col justify-between relative transition-all duration-300 ${
            fullscreenId === 'chart-status-pie' ? 'h-[75vh]' : 'h-[350px]'
          }`}>
            {stats.totalLoads > 0 ? (
              <>
                <div className={`w-full relative transition-all duration-300 ${
                  fullscreenId === 'chart-status-pie' ? 'h-[60vh]' : 'h-[280px]'
                }`}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={fullscreenId === 'chart-status-pie' ? 140 : 80}
                        outerRadius={fullscreenId === 'chart-status-pie' ? 200 : 115}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.statusData.map((entry, index) => (
                           <Cell 
                             key={`cell-${index}`} 
                             fill={entry.fill} 
                           />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '16px', 
                          border: 'none', 
                          boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
                          background: '#0a1128',
                          color: '#fff',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          padding: '10px 14px'
                        }}
                        formatter={(value: number) => {
                          const percent = stats.totalLoads > 0 ? ((value / stats.totalLoads) * 100).toFixed(1) : '0';
                          return [`${value} cargas (${percent}%)`, 'Status'];
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text with Total Loads */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-10px]">
                    <span className={`font-black uppercase text-slate-400 tracking-widest leading-none ${fullscreenId === 'chart-status-pie' ? 'text-xs mb-1' : 'text-[9px]'}`}>Análise</span>
                    <span className={`font-black text-slate-800 leading-none my-1 ${fullscreenId === 'chart-status-pie' ? 'text-4xl' : 'text-2xl'}`}>{stats.totalLoads}</span>
                    <span className={`font-bold text-slate-500 uppercase tracking-wider leading-none ${fullscreenId === 'chart-status-pie' ? 'text-xs mt-1' : 'text-[8px]'}`}>Cargas</span>
                  </div>
                </div>

                {/* Custom Interactive Legend with percentages */}
                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-100">
                  {stats.statusData.map((entry, index) => {
                    const percentage = stats.totalLoads > 0 ? ((entry.value / stats.totalLoads) * 100).toFixed(1) : '0';
                    return (
                      <div key={index} className="flex flex-col items-center">
                        <div className="flex items-center gap-1 justify-center mb-0.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.fill }} />
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{entry.name}</span>
                        </div>
                        <span className="font-mono text-[10px] font-black text-slate-700">
                          {entry.value} ({percentage}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 italic">
                Sem cargas registradas para exibir status.
              </div>
            )}
          </div>
        </div>

        {/* Occurrence Types */}
        <div id="chart-occurrence-pie" className={`bg-white rounded-3xl border border-slate-200 shadow-sm transition-all duration-300 ${
          fullscreenId === 'chart-occurrence-pie' ? 'p-12 w-full h-screen overflow-y-auto z-50 flex flex-col justify-between md:col-span-2 lg:col-span-2' : 'p-8'
        }`}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-gold/10 rounded-xl">
                <PieChartIcon className="w-5 h-5 text-primary-gold" />
              </div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Tipos de Ocorrência</h3>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase hidden sm:block">Clique para detalhar</p>
              {/* Fullscreen Button */}
              <button
                type="button"
                onClick={() => toggleFullscreen('chart-occurrence-pie')}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors border border-slate-200/50 flex items-center justify-center cursor-pointer shadow-sm"
                title={fullscreenId === 'chart-occurrence-pie' ? "Sair do modo tela cheia" : "Expandir em tela cheia"}
              >
                {fullscreenId === 'chart-occurrence-pie' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className={`w-full transition-all duration-300 ${
            fullscreenId === 'chart-occurrence-pie' ? 'h-[75vh]' : 'h-[350px]'
          }`}>
            {stats.occurrenceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.occurrenceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={fullscreenId === 'chart-occurrence-pie' ? 140 : 80}
                    outerRadius={fullscreenId === 'chart-occurrence-pie' ? 220 : 120}
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
        <div id="chart-occurrence-bar" className={`bg-white rounded-3xl border border-slate-200 shadow-sm transition-all duration-300 ${
          fullscreenId === 'chart-occurrence-bar' ? 'p-12 w-full h-screen overflow-y-auto z-50 flex flex-col justify-between md:col-span-2 lg:col-span-2' : 'p-8'
        }`}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-gold/10 rounded-xl">
                <BarChart3 className="w-5 h-5 text-primary-gold" />
              </div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Ocorrências por Tipo (Barras)</h3>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase hidden sm:block">Clique para detalhar</p>
              {/* Fullscreen Button */}
              <button
                type="button"
                onClick={() => toggleFullscreen('chart-occurrence-bar')}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors border border-slate-200/50 flex items-center justify-center cursor-pointer shadow-sm"
                title={fullscreenId === 'chart-occurrence-bar' ? "Sair do modo tela cheia" : "Expandir em tela cheia"}
              >
                {fullscreenId === 'chart-occurrence-bar' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className={`w-full transition-all duration-300 ${
            fullscreenId === 'chart-occurrence-bar' ? 'h-[75vh]' : 'h-[350px]'
          }`}>
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
        <div id="chart-routes-bar" className={`bg-white rounded-3xl border border-slate-200 shadow-sm transition-all duration-300 ${
          fullscreenId === 'chart-routes-bar' ? 'p-12 w-full h-screen overflow-y-auto z-50 flex flex-col justify-between md:col-span-2 lg:col-span-2' : 'p-8'
        }`}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-xl">
                <MapPin className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Rotas com Maiores Ocorrências</h3>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase hidden sm:block">Clique para detalhar</p>
              {/* Fullscreen Button */}
              <button
                type="button"
                onClick={() => toggleFullscreen('chart-routes-bar')}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors border border-slate-200/50 flex items-center justify-center cursor-pointer shadow-sm"
                title={fullscreenId === 'chart-routes-bar' ? "Sair do modo tela cheia" : "Expandir em tela cheia"}
              >
                {fullscreenId === 'chart-routes-bar' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className={`w-full transition-all duration-300 ${
            fullscreenId === 'chart-routes-bar' ? 'h-[75vh]' : 'h-[350px]'
          }`}>
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
          <div id="drilldown-details" className="lg:col-span-2 bg-primary-navy text-white p-8 rounded-3xl shadow-xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-gold/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Filter className="w-5 h-5 text-primary-gold" />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">
                    {selectedCategory.type === 'cell' 
                      ? `${selectedCategory.value?.split('||')[0]}` 
                      : selectedCategory.type === 'store'
                      ? `Loja: ${selectedCategory.value}`
                      : `Detalhes: ${selectedCategory.value}`}
                  </h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                    {selectedCategory.type === 'cell'
                      ? `Ocorrência específica: ${selectedCategory.value?.split('||')[1]}`
                      : selectedCategory.type === 'store'
                      ? 'Todas as auditorias com ocorrências registradas para esta loja (limitado a 10)'
                      : 'Exploração de dados específicos (limitado a 10)'}
                  </p>
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

      {/* SEÇÃO DA LISTAGEM DE CARGAS FINALIZADAS NO PERÍODO */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <FileText className="w-5 h-5 flex items-center justify-center" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Cargas Finalizadas no Período</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase">
                {finalizedLoadsList.length === 0 
                  ? 'Nenhuma carga finalizada encontrada' 
                  : `Exibindo ${finalizedLoadsList.length} de ${stats.releasedCount + stats.blockedCount} cargas finalizadas no período`
                }
              </p>
            </div>
          </div>
          
          {/* Quick Stats Mini-Badges */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[10px] bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl font-black uppercase tracking-wider">
              Total: {finalizedLoadsList.length}
            </span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1.5 rounded-xl font-black uppercase tracking-wider">
              Liberadas: {finalizedLoadsList.filter(l => l.status === CargoStatus.RELEASED).length}
            </span>
            <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-100 px-3 py-1.5 rounded-xl font-black uppercase tracking-wider">
              Bloqueadas: {finalizedLoadsList.filter(l => l.status === CargoStatus.BLOCKED).length}
            </span>
          </div>
        </div>

        {/* Filters and Search toolbar */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-slate-50/50 p-4 rounded-2xl border border-slate-100 shadow-inner">
          {/* Search bar input */}
          <div className="relative flex items-center flex-1 max-w-full lg:max-w-md">
            <span className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Buscar por placa, motorista, romaneio, origem ou destino..."
              value={finalizedLoadsSearch}
              onChange={(e) => {
                setFinalizedLoadsSearch(e.target.value);
                setFinalizedLoadsPage(1);
              }}
              className="w-full pl-10 pr-9 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-gold focus:border-transparent transition-all shadow-sm"
            />
            {finalizedLoadsSearch && (
              <button
                type="button"
                onClick={() => {
                  setFinalizedLoadsSearch('');
                  setFinalizedLoadsPage(1);
                }}
                className="absolute right-3 p-1 hover:bg-slate-100 rounded-full cursor-pointer text-slate-400 border-0 bg-transparent flex items-center justify-center h-6 w-6"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Segment controls for status filtering */}
          <div className="flex bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/50 gap-1.5 self-start lg:self-auto shadow-inner">
            <button
              type="button"
              onClick={() => {
                setFinalizedLoadsStatusFilter('ALL');
                setFinalizedLoadsPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300 border-0 cursor-pointer ${
                finalizedLoadsStatusFilter === 'ALL'
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Todos ({finalizedLoadsList.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setFinalizedLoadsStatusFilter('RELEASED');
                setFinalizedLoadsPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300 border-0 cursor-pointer ${
                finalizedLoadsStatusFilter === 'RELEASED'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-500 hover:text-emerald-700'
              }`}
            >
              Liberadas
            </button>
            <button
              type="button"
              onClick={() => {
                setFinalizedLoadsStatusFilter('BLOCKED');
                setFinalizedLoadsPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300 border-0 cursor-pointer ${
                finalizedLoadsStatusFilter === 'BLOCKED'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-500 hover:text-rose-700'
              }`}
            >
              Bloqueadas
            </button>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-150 shadow-sm scrollbar-thin">
          {paginatedFinalizedLoads.length > 0 ? (
            <table className="w-full border-collapse text-left text-xs bg-white min-w-[900px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-black tracking-wider">
                  <th className="py-4 px-6 w-[120px] cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('id')}>
                    <div className="flex items-center gap-1.5">
                      <span>Romaneio</span>
                      <ArrowUpDown className="w-3" />
                    </div>
                  </th>
                  <th className="py-4 px-6 w-[130px] cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('plate')}>
                    <div className="flex items-center gap-1.5">
                      <span>Placa</span>
                      <ArrowUpDown className="w-3" />
                    </div>
                  </th>
                  <th className="py-4 px-6 w-[180px] cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('driverName')}>
                    <div className="flex items-center gap-1.5">
                      <span>Motorista / Auditor</span>
                      <ArrowUpDown className="w-3" />
                    </div>
                  </th>
                  <th className="py-4 px-6">Rota Logística / Destino</th>
                  <th className="py-4 px-6 w-[100px] text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('palletCount')}>
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Paletes</span>
                      <ArrowUpDown className="w-3" />
                    </div>
                  </th>
                  <th className="py-4 px-4 w-[160px]">Última Ocorrência</th>
                  <th className="py-4 px-6 w-[140px] text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('status')}>
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Status</span>
                      <ArrowUpDown className="w-3" />
                    </div>
                  </th>
                  <th className="py-4 px-6 w-[150px] cursor-pointer hover:bg-slate-100 transition-colors text-right" onClick={() => requestSort('auditedAt')}>
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Auditoria</span>
                      <ArrowUpDown className="w-3" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedFinalizedLoads.map((load) => {
                  const hasOcorrencia = load.occurrenceType && load.occurrenceType !== OccurrenceType.NONE;
                  return (
                    <tr key={load.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Romaneio */}
                      <td className="py-4 px-6 font-mono font-bold text-slate-500">
                        #{load.id.slice(0, 8).toUpperCase()}
                      </td>
                      
                      {/* Placa brasileira */}
                      <td className="py-4 px-6">
                        <span className="inline-flex flex-col border border-slate-300 bg-slate-50 rounded-md overflow-hidden text-[9px] font-mono leading-none shadow-sm">
                          <span className="bg-[#002fcd] text-white px-2 py-0.5 font-bold tracking-widest text-[7px] text-center uppercase">Brasil</span>
                          <span className="px-2 py-1 font-bold text-slate-800 tracking-tighter text-xs">{load.plate}</span>
                        </span>
                      </td>

                      {/* Motorista / Auditor */}
                      <td className="py-4 px-6">
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-slate-800 flex items-center gap-1 leading-tight">
                            <User className="w-3 h-3 text-slate-400 shrink-0" />
                            {load.driverName}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">Auditor: {load.auditedBy || load.createdBy}</p>
                        </div>
                      </td>

                      {/* Rota */}
                      <td className="py-4 px-6 font-semibold">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1 text-slate-800">
                            <span className="text-[11px]">{load.origin}</span>
                            <span className="text-slate-400">➔</span>
                            <span className="text-[11px] text-[#1B365D] font-bold">{load.destination}</span>
                          </div>
                          <span className="text-[9px] text-slate-400 uppercase tracking-wider font-extrabold">{load.cargoType}</span>
                        </div>
                      </td>

                      {/* Paletes */}
                      <td className="py-4 px-6 text-center font-mono font-bold text-slate-800 font-black">
                        {load.palletCount}
                      </td>

                      {/* Inconformidade */}
                      <td className="py-4 px-4 text-xs font-bold leading-normal">
                        {hasOcorrencia ? (
                          <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md text-[10px]">
                            <ShieldAlert className="w-3 h-3 text-rose-500" />
                            {load.occurrenceType}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400 text-[10px]">
                            Sem divergências
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                          load.status === CargoStatus.RELEASED 
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                            : 'bg-rose-50 text-rose-800 border border-rose-200 animate-pulse'
                        }`}>
                          {load.status === CargoStatus.RELEASED ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-rose-500" />
                          )}
                          <span>{load.status}</span>
                        </span>
                      </td>

                      {/* Auditoria timestamp */}
                      <td className="py-4 px-6 text-right font-mono text-slate-500 leading-tight">
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-[11px] font-bold text-slate-705">
                            {new Date(load.auditedAt || load.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400">
                            {new Date(load.auditedAt || load.createdAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="py-16 bg-slate-50/50 flex flex-col items-center justify-center text-slate-400 text-center p-6 rounded-2xl border border-dashed border-slate-200">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                <Search className="w-5 h-5 text-slate-400" />
              </div>
              <span className="font-extrabold text-sm uppercase tracking-tight text-slate-700">Nenhuma carga correspondente</span>
              <p className="text-[11px] text-slate-400 max-w-xs mt-1 font-bold leading-normal">
                Nenhum registro finalizado coincide com o termo buscado ou filtro selecionado para este intervalo de datas.
              </p>
            </div>
          )}
        </div>

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-105 flex-col sm:flex-row gap-4">
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
              Mostrando {Math.min(finalizedLoadsList.length - (safePage - 1) * rowsPerPage, rowsPerPage)} de {finalizedLoadsList.length} registros (Pág. {safePage} de {totalPages})
            </span>
            <div className="flex items-center gap-1 border border-slate-200 rounded-xl p-1 bg-slate-50">
              <button
                type="button"
                onClick={() => setFinalizedLoadsPage(prev => Math.max(prev - 1, 1))}
                disabled={safePage === 1}
                className="p-1.5 rounded-lg border-0 bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-colors"
                title="Página Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {/* Numeric Indicator */}
              <div className="px-3 text-xs font-black text-slate-700 font-mono">
                {safePage}
              </div>

              <button
                type="button"
                onClick={() => setFinalizedLoadsPage(prev => Math.min(prev + 1, totalPages))}
                disabled={safePage === totalPages}
                className="p-1.5 rounded-lg border-0 bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-colors"
                title="Próxima Página"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
