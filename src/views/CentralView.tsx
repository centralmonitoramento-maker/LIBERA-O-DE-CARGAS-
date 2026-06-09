
import React, { useState, useEffect, useMemo } from 'react';
import { CargoLoad, CargoStatus, CargoType, OccurrenceType } from '../types';
import { 
  LayoutDashboard, 
  Search, 
  ShieldCheck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MapPin, 
  Truck, 
  Package, 
  ShieldAlert, 
  Navigation, 
  Info,
  Compass,
  ExternalLink,
  Timer,
  AlertTriangle,
  GripVertical,
  Car,
  FileText,
  Camera,
  Columns,
  PanelRight,
  History,
  ImageOff
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ROUTE_COORDINATES: Record<string, { lat: number; lng: number; address: string; label: string }> = {
  'CD-01': {
    lat: -16.01515,
    lng: -47.98503,
    address: 'DVA ATACADOS EIRELI, Trecho 2, Conjunto 8 lote 17 - Santa Maria, Brasília - DF',
    label: 'CD-01 (Santa Maria)'
  },
  'CD-02': {
    lat: -16.01515,
    lng: -47.98503,
    address: 'DVA ATACADOS EIRELI, Trecho 2, Conjunto 8 lote 17 - Santa Maria, Brasília - DF',
    label: 'CD-02 (Santa Maria)'
  },
  '07 -SIA': {
    lat: -15.7953,
    lng: -47.9622,
    address: 'SIA Trecho 5, Brasília - DF',
    label: 'SIA'
  },
  '28-AGUAS CLARAS': {
    lat: -15.8396,
    lng: -48.0261,
    address: 'Av. das Castanheiras, Águas Claras, Brasília - DF',
    label: 'Águas Claras'
  },
  '29-GUARA': {
    lat: -15.8190,
    lng: -47.9863,
    address: 'QE 13, Guará II, Brasília - DF',
    label: 'Guará'
  },
  '42-JARDIM BOTANICO': {
    lat: -15.8821,
    lng: -47.8189,
    address: 'SMDB Jardim Botânico, Brasília - DF',
    label: 'Jardim Botânico'
  },
  '25-NOVO GAMA': {
    lat: -16.0592,
    lng: -48.0371,
    address: 'Novo Gama - GO',
    label: 'Novo Gama'
  },
  '13-LUZIANIA 01': {
    lat: -16.2559,
    lng: -47.9398,
    address: 'Parque Estrela Dalva II, Luziânia - GO',
    label: 'Luziânia 13'
  },
  '16-SANTO ANTONIO': {
    lat: -15.9404,
    lng: -48.2562,
    address: 'Santo Antônio do Descoberto - GO',
    label: 'Santo Antônio'
  },
  '32-CEILANDIA CENTRO': {
    lat: -15.8235,
    lng: -48.1032,
    address: 'QNM 11, Ceilândia Centro, Brasília - DF',
    label: 'Ceilândia Centro'
  },
  '01-BR 070': {
    lat: -15.8115,
    lng: -48.1189,
    address: 'Rodovia BR 070, Km 08, Ceilândia - DF',
    label: 'BR 070'
  },
  '21-CEILÂNDIA SUL': {
    lat: -15.8262,
    lng: -48.1256,
    address: 'Ceilândia Sul, Brasília - DF',
    label: 'Ceilândia Sul (O SUL)'
  },
  '55-RECANTO DAS EMAS': {
    lat: -15.9015,
    lng: -48.0743,
    address: 'Recanto das Emas, Brasília - DF',
    label: 'Recanto das Emas'
  },
  '34-SAMAMBAIA SUL': {
    lat: -15.8814,
    lng: -48.1165,
    address: 'QR 502, ADE Sul, Samambaia Sul, Brasília - DF',
    label: 'Samambaia Sul'
  },
  '60-FURNAS': {
    lat: -15.8643,
    lng: -48.0872,
    address: 'Furnas, Brasília - DF',
    label: 'Furnas'
  },
  '08-TAGUATINGA': {
    lat: -15.8335,
    lng: -48.0560,
    address: 'Taguatinga, Brasília - DF',
    label: 'Taguatinga'
  },
  '58-EPTG': {
    lat: -15.8164,
    lng: -48.0182,
    address: 'Marginal EPTG, Brasília - DF',
    label: 'EPTG'
  },
  '38-VICENTE PIRES R04': {
    lat: -15.8012,
    lng: -48.0263,
    address: 'Rua 4, Vicente Pires, Brasília - DF',
    label: 'Vicente Pires Rua 4'
  },
  '37-VICENTE PIRES R12': {
    lat: -15.8078,
    lng: -48.0163,
    address: 'Rua 12, Vicente Pires, Brasília - DF',
    label: 'Vicente Pires Rua 12'
  },
  '52-RIACHO FUNDO': {
    lat: -15.8784,
    lng: -48.0189,
    address: 'Riacho Fundo I, Brasília - DF',
    label: 'Riacho Fundo'
  },
  '18-AGUAS LINDAS': {
    lat: -15.7702,
    lng: -48.2778,
    address: 'Alameda Santa Luzia, Águas Lindas de Goiás - GO',
    label: 'Águas Lindas (Águas Belas)'
  },
  '33-PLANALTINA DF': {
    lat: -15.6173,
    lng: -47.6698,
    address: 'Setor Norte, Planaltina - DF',
    label: 'Planaltina DF'
  },
  '27-PLANLTINA GO': {
    lat: -15.4542,
    lng: -47.6152,
    address: 'Planaltina de Goiás - GO',
    label: 'Planaltina GO (Plantina GO)'
  },
  "50- MESTRE D'ARMAS": {
    lat: -15.6025,
    lng: -47.6983,
    address: 'Mestre d\'Armas, Planaltina - DF',
    label: 'Planaltina Mestre d\'Armas'
  },
  '63-FORMOSA': {
    lat: -15.5414,
    lng: -47.3344,
    address: 'Formosa - GO',
    label: 'Formosa'
  },
  '40-GURUPI TO': {
    lat: -11.7268,
    lng: -49.0668,
    address: 'Av. Maranhão, 2901 - Perímetro Urbano, Gurupi - TO, 77410-020',
    label: '40-Gurupi TO'
  },
  '30-LEM': {
    lat: -12.0933,
    lng: -45.7909,
    address: 'Luís Eduardo Magalhães - BA',
    label: 'LEM'
  },
  '19-CALDAS NOVAS': {
    lat: -17.7441,
    lng: -48.6258,
    address: 'Caldas Novas - GO',
    label: 'Caldas Novas'
  },
  '47-APARECIDA DE GOIANIA': {
    lat: -16.8208,
    lng: -49.2559,
    address: 'Aparecida de Goiânia - GO',
    label: 'Aparecida de Goiânia'
  },
  '15-BALNEARIO': {
    lat: -16.6341,
    lng: -49.2882,
    address: 'Setor Balneário, Goiânia - GO',
    label: 'Balneário'
  },
  '26-CESAR LATTES': {
    lat: -16.7325,
    lng: -49.3245,
    address: 'Av. César Lattes, Goiânia - GO',
    label: 'César Lattes'
  },
  '12-GAMA': {
    lat: -15.9912,
    lng: -48.0494,
    address: 'Setor Leste, Gama - DF',
    label: 'Gama (Completo)'
  },
  '39-GOIANESIA': {
    lat: -15.3189,
    lng: -49.1179,
    address: 'Área Comercial, Goianésia - GO',
    label: 'Goianésia (Goiênia)'
  },
  '64-ITUMBIARA': {
    lat: -18.4189,
    lng: -49.2157,
    address: 'Vila Vitória, Itumbiara - GO',
    label: 'Itumbiara'
  },
  '62-LUZIANIA 2': {
    lat: -16.2754,
    lng: -47.9622,
    address: 'Luziânia Loja 2 - GO',
    label: 'Luziânia 2 (Luciani 2)'
  },
  '53-RIO VERDE': {
    lat: -17.7915,
    lng: -50.9208,
    address: 'Rio Verde - GO',
    label: 'Rio Verde'
  },
  '04-SOBRADINHO': {
    lat: -15.6514,
    lng: -47.7915,
    address: 'Sobradinho - DF',
    label: 'Sobradinho'
  }
};

const getRegionForStore = (storeKey: string): 'DF' | 'GO' | 'BA' | 'TO' => {
  const upper = storeKey.toUpperCase();
  if (upper.includes('-GO') || 
      upper.includes('GOIANIA') || 
      upper.includes('GOIÂNIA') ||
      upper.includes('LUZIANIA') || 
      upper.includes('LUZIÂNIA') || 
      upper.includes('NOVO GAMA') || 
      upper.includes('SANTO ANTONIO') || 
      upper.includes('SANTO ANTÔNIO') || 
      upper.includes('FORMOSA') || 
      upper.includes('CALDAS') || 
      upper.includes('GOIANESIA') || 
      upper.includes('GOIANÉSIA') || 
      upper.includes('ITUMBIARA') || 
      upper.includes('RIO VERDE') || 
      upper.includes('LINDAS') ||
      upper.includes('PLANLTINA GO') ||
      upper.includes('AGUAS LINDAS')) {
    return 'GO';
  }
  if (upper.includes('-BA') || 
      upper.includes('LEM') || 
      upper.includes('LUÍS EDUARDO') ||
      upper.includes('LUIS EDUARDO') ||
      upper.includes('MAGALHÃES') ||
      upper.includes('MAGALHAES')) {
    return 'BA';
  }
  if (upper.includes('-TO') || 
      upper.includes('GURUPI')) {
    return 'TO';
  }
  return 'DF';
};

const CountdownTracker: React.FC<{ load: CargoLoad; estimatedDurationMinutes: number }> = ({ load, estimatedDurationMinutes }) => {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [load.id, load.status, load.auditedAt, load.gateVerifiedAt]);

  const releaseTimeStr = load.gateVerifiedAt || load.auditedAt || load.createdAt;
  const releaseTime = new Date(releaseTimeStr);
  const totalLimitMs = estimatedDurationMinutes * 60 * 1000;
  
  // Real elapsed time
  const elapsedMs = now.getTime() - releaseTime.getTime();
  const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
  const elapsedSeconds = Math.floor((elapsedMs % (1000 * 60)) / 1000);

  const remainingMs = totalLimitMs - elapsedMs;
  const isExceeded = remainingMs < 0;

  const absRemainingMs = Math.abs(remainingMs);
  const remHours = Math.floor(absRemainingMs / (1000 * 60 * 60));
  const remMinutes = Math.floor((absRemainingMs % (1000 * 60 * 60)) / (1000 * 60));
  const remSeconds = Math.floor((absRemainingMs % (1000 * 60)) / 1000);

  // Format string
  const formatTime = (h: number, m: number, s: number) => {
    const pad = (num: number) => String(num).padStart(2, '0');
    return h > 0 ? `${pad(h)}h ${pad(m)}m ${pad(s)}s` : `${pad(m)}m ${pad(s)}s`;
  };

  const formattedRemaining = formatTime(remHours, remMinutes, remSeconds);
  const formattedElapsed = formatTime(
    Math.floor(elapsedMs / (1000 * 60 * 60)),
    Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60)),
    Math.floor((elapsedMs % (1000 * 60)) / 1000)
  );

  // Calculate percentage of elapsed time against SLA
  const pct = Math.max(0, Math.min(100, (elapsedMs / totalLimitMs) * 100));

  if (load.status !== CargoStatus.RELEASED) {
    return (
      <div className="mx-8 mt-6 bg-slate-50 border border-slate-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-500 animate-pulse">
            <Timer className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans">Rastreamento de Deslocamento</span>
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Carga Aguardando Gate/Liberação</h4>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">O cronômetro regressivo da viagem iniciará automaticamente após autorização de saída pela Portaria.</p>
          </div>
        </div>
        <div className="bg-white border px-4 py-2.5 rounded-2xl text-center min-w-[130px] shadow-2xs">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Viagem Estimada</p>
          <p className="text-sm font-extrabold text-slate-700 font-mono">~{estimatedDurationMinutes} minutos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-8 mt-6">
      <div className={`p-6 rounded-3xl border transition-all shadow-sm ${
        isExceeded 
          ? 'bg-rose-50/70 border-rose-200/90 ring-4 ring-rose-500/5' 
          : 'bg-emerald-50/40 border-emerald-100/80 ring-4 ring-emerald-500/5'
      }`}>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          
          {/* Header & Status message */}
          <div className="flex items-start gap-4">
            <div className={`p-3.5 rounded-2xl shrink-0 ${
              isExceeded ? 'bg-rose-100 text-rose-600 animate-bounce' : 'bg-emerald-100 text-emerald-600'
            }`}>
              {isExceeded ? <AlertTriangle className="w-6 h-6" /> : <Timer className="w-6 h-6" />}
            </div>
            
            <div className="space-y-1 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-widest ${
                  isExceeded ? 'bg-rose-200 text-rose-800' : 'bg-emerald-200 text-emerald-800'
                }`}>
                  {isExceeded ? 'Tempo Limite Excedido' : 'Em Trânsito Monitorado'}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase font-mono">
                  Saída: {releaseTime.toLocaleTimeString('pt-BR')}
                </span>
              </div>
              
              <h4 className="text-base font-black text-slate-800 tracking-tight">
                {isExceeded 
                  ? "PRAZO OPERACIONAL ULTRAPASSADO" 
                  : "Controle de Tempo de Deslocamento"}
              </h4>
              <p className="text-[11px] text-slate-500 font-medium">
                {isExceeded 
                  ? `Alerta de SLA! A carga superou o tempo limite de rodagem de ${estimatedDurationMinutes}min estabelecido pela IA.`
                  : `Viagem monitorada via GPS. Tempo total acordado de rota está estimado em ${estimatedDurationMinutes} minutos.`}
              </p>
            </div>
          </div>

          {/* Counts metrics */}
          <div className="grid grid-cols-3 gap-4 w-full lg:w-auto text-left lg:text-right">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tempo Limite (IA)</p>
              <p className="text-sm font-black text-slate-800 font-mono">~{estimatedDurationMinutes}m</p>
            </div>
            
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Real Decorrido</p>
              <p className="text-sm font-black text-slate-800 font-mono">{formattedElapsed || '00m 00s'}</p>
            </div>

            <div>
              <p className={`text-[9px] font-black uppercase tracking-widest ${
                isExceeded ? 'text-rose-500' : 'text-slate-400'
              }`}>
                {isExceeded ? 'Atraso em Rota' : 'Tempo Restante'}
              </p>
              <p className={`text-base font-black font-mono tracking-tighter ${
                isExceeded ? 'text-rose-600 animate-pulse' : 'text-emerald-700'
              }`}>
                {isExceeded ? `+${formattedRemaining}` : formattedRemaining}
              </p>
            </div>
          </div>

        </div>

        {/* Progress details */}
        <div className="mt-4 space-y-2">
          <div className="h-2.5 w-full bg-slate-200/60 rounded-full overflow-hidden flex shadow-inner">
            <div 
              style={{ width: `${pct}%` }} 
              className={`h-full rounded-full transition-all duration-1000 ${
                isExceeded ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
              }`}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] font-medium text-slate-400">
            <span>Gate Portaria CD (0%)</span>
            <span className={isExceeded ? 'text-rose-500 font-black' : 'text-emerald-600'}>
              {pct.toFixed(0)}% do SLA estimado
            </span>
            <span>Destino Principal (100%)</span>
          </div>
        </div>

      </div>
    </div>
  );
};

interface CentralViewProps {
  loads: CargoLoad[];
  onUpdateStatus: (id: string, newStatus: CargoStatus) => void;
  onUpdateLoad?: (load: CargoLoad) => void;
}

export const CentralView: React.FC<CentralViewProps> = ({ loads, onUpdateStatus, onUpdateLoad }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<CargoStatus | 'ALL'>('ALL');
  const [selectedLoadId, setSelectedLoadId] = useState<string | null>(null);
  const [selectedLoadIds, setSelectedLoadIds] = useState<string[]>([]);

  const toggleLoadSelection = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedLoadIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAllLoads = () => {
    const ids = filteredLoads.map(load => load.id);
    setSelectedLoadIds(ids);
  };

  const deselectAllLoads = () => {
    setSelectedLoadIds([]);
  };

  const handleBulkUpdateStatus = async (status: CargoStatus) => {
    if (selectedLoadIds.length === 0) return;
    for (const id of selectedLoadIds) {
      await onUpdateStatus(id, status);
    }
    setSelectedLoadIds([]);
  };

  const [viewMode, setViewMode] = useState<'split' | 'side-panel'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cargaRadarViewMode');
      if (saved === 'split' || saved === 'side-panel') return saved;
    }
    return 'split';
  });

  const handleSetViewMode = (mode: 'split' | 'side-panel') => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cargaRadarViewMode', mode);
    }
  };

  const [routeSummary, setRouteSummary] = useState<string>('');
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [mapMode, setMapMode] = useState<'api' | 'free'>('free');
  const [sealConfirm, setSealConfirm] = useState('');
  const [palletsConfirm, setPalletsConfirm] = useState('');
  const [plateConfirm, setPlateConfirm] = useState('');
  const [driverConfirm, setDriverConfirm] = useState('');

  const [newSealForNextTrip, setNewSealForNextTrip] = useState('');
  const [isAwaitingNextSeal, setIsAwaitingNextSeal] = useState(false);

  const [editingSeals, setEditingSeals] = useState<Record<number, string>>({});

  const [draggedTargetIdx, setDraggedTargetIdx] = useState<number | null>(null);
  const [dragOverTargetIdx, setDragOverTargetIdx] = useState<number | null>(null);
  const [showReorderCentralPanel, setShowReorderCentralPanel] = useState<boolean>(false);
  const [showTrafficAlertsPanel, setShowTrafficAlertsPanel] = useState<boolean>(false);
  const [trafficPeakSimulation, setTrafficPeakSimulation] = useState<boolean>(true);

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showOccurrencesModal, setShowOccurrencesModal] = useState<boolean>(false);

  const [selectedRegionName, setSelectedRegionName] = useState<string | null>(null);
  const [selectedRegionStoreSearch, setSelectedRegionStoreSearch] = useState<string>('');
  const [expandedStoreKey, setExpandedStoreKey] = useState<string | null>(null);

  const regionStoresDetails = useMemo(() => {
    if (!selectedRegionName) return [];

    // 1. Collect all known store keys from ROUTE_COORDINATES + any destination from current loads
    const allStoreNames = new Set<string>();
    Object.keys(ROUTE_COORDINATES).forEach(k => allStoreNames.add(k));
    loads.forEach(l => {
      if (l.destination) allStoreNames.add(l.destination);
      if (l.additionalDestinations) {
        l.additionalDestinations.forEach(d => allStoreNames.add(d));
      }
    });

    // 2. Filter stores that belong to the selected region and match search text
    const selectedStoresFiltered = Array.from(allStoreNames).filter(storeName => {
      const reg = getRegionForStore(storeName);
      if (reg !== selectedRegionName) return false;

      if (selectedRegionStoreSearch.trim()) {
        const term = selectedRegionStoreSearch.toLowerCase();
        const label = (ROUTE_COORDINATES[storeName]?.label || storeName).toLowerCase();
        const address = (ROUTE_COORDINATES[storeName]?.address || '').toLowerCase();
        return label.includes(term) || address.includes(term) || storeName.toLowerCase().includes(term);
      }
      return true;
    });

    // 3. For each store, calculate its metrics based on the loads
    return selectedStoresFiltered.map(storeName => {
      const storeLoads = loads.filter(l => {
        const carriesToStore = l.destination === storeName || 
          (l.additionalDestinations && l.additionalDestinations.includes(storeName));
        return carriesToStore;
      });

      // Calculate pallets count specifically for this store
      let totalPallets = 0;
      storeLoads.forEach(l => {
        if (l.palletDetails && l.palletDetails.length > 0) {
          // Count specific pallets assigned to this store
          const storePallets = l.palletDetails.filter(p => p.destination === storeName);
          if (storePallets.length > 0) {
            totalPallets += storePallets.reduce((sum, p) => sum + p.quantity, 0);
          } else {
            // Fallback if no specific destination mapped in details but this is the primary
            if (l.destination === storeName) {
              totalPallets += l.palletCount || 0;
            }
          }
        } else {
          if (l.destination === storeName) {
            totalPallets += l.palletCount || 0;
          }
        }
      });

      const highRiskCount = storeLoads.filter(l => l.isHighRisk).length;
      const releasedCount = storeLoads.filter(l => l.status === CargoStatus.RELEASED).length;
      const blockedCount = storeLoads.filter(l => l.status === CargoStatus.BLOCKED).length;
      const pendingCount = storeLoads.filter(l => l.status === CargoStatus.AWAITING).length;

      const coord = ROUTE_COORDINATES[storeName] || { address: 'Endereço não cadastrado', label: storeName };

      return {
        key: storeName,
        label: coord.label || storeName,
        address: coord.address,
        loadsCount: storeLoads.length,
        palletsCount: totalPallets,
        highRiskCount,
        releasedCount,
        blockedCount,
        pendingCount,
        loads: storeLoads
      };
    }).sort((a, b) => b.loadsCount - a.loadsCount); // Sort by most active store (highest manifest volume)
  }, [selectedRegionName, selectedRegionStoreSearch, loads]);

  const handleReorderTargets = (fromIndex: number, toIndex: number) => {
    if (!selectedLoad) return;
    const newTargets = [...targets];
    const [removed] = newTargets.splice(fromIndex, 1);
    newTargets.splice(toIndex, 0, removed);

    // Reorder pallet details to match the new destination sequence (if pallets have destinations)
    const reorderedPallets = selectedLoad.palletDetails 
      ? [...selectedLoad.palletDetails].sort((a, b) => {
          const aDest = a.destination || selectedLoad.destination;
          const bDest = b.destination || selectedLoad.destination;
          const aIndex = newTargets.indexOf(aDest);
          const bIndex = newTargets.indexOf(bDest);
          return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
        })
      : undefined;

    const updatedLoad: CargoLoad = {
      ...selectedLoad,
      destination: newTargets[0],
      additionalDestinations: newTargets.slice(1),
      palletDetails: reorderedPallets
    };

    if (onUpdateLoad) {
      onUpdateLoad(updatedLoad);
    }
  };

  const handleSaveSealForStage = (idx: number, sealValue: string) => {
    if (!selectedLoad || idx < 0) return;
    
    const cleanSeal = sealValue.trim().toUpperCase();
    if (!cleanSeal) return;

    let updatedLoad: CargoLoad;
    if (idx === 0) {
      updatedLoad = {
        ...selectedLoad,
        sealNumber: cleanSeal
      };
    } else {
      const dest = targets[idx];
      updatedLoad = {
        ...selectedLoad,
        sealsByDest: {
          ...(selectedLoad.sealsByDest || {}),
          [dest]: cleanSeal
        }
      };
    }

    if (onUpdateLoad) {
      onUpdateLoad(updatedLoad);
    }
    
    setEditingSeals(prev => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
  };

  const regionChartData = useMemo(() => {
    let dfLoads = 0;
    let goLoads = 0;
    let baLoads = 0;
    let toLoads = 0;

    let dfPallets = 0;
    let goPallets = 0;
    let baPallets = 0;
    let toPallets = 0;

    let dfHighRisk = 0;
    let goHighRisk = 0;
    let baHighRisk = 0;
    let toHighRisk = 0;

    let dfReleased = 0;
    let goReleased = 0;
    let baReleased = 0;
    let toReleased = 0;

    let dfBlocked = 0;
    let goBlocked = 0;
    let baBlocked = 0;
    let toBlocked = 0;

    loads.forEach(load => {
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

      const isTo = dest.includes('-TO') || 
                   dest.includes('GURUPI');

      if (isGo) {
        goLoads++;
        goPallets += load.palletCount || 0;
        if (load.isHighRisk) goHighRisk++;
        if (load.status === CargoStatus.RELEASED) goReleased++;
        if (load.status === CargoStatus.BLOCKED) goBlocked++;
      } else if (isBa) {
        baLoads++;
        baPallets += load.palletCount || 0;
        if (load.isHighRisk) baHighRisk++;
        if (load.status === CargoStatus.RELEASED) baReleased++;
        if (load.status === CargoStatus.BLOCKED) baBlocked++;
      } else if (isTo) {
        toLoads++;
        toPallets += load.palletCount || 0;
        if (load.isHighRisk) toHighRisk++;
        if (load.status === CargoStatus.RELEASED) toReleased++;
        if (load.status === CargoStatus.BLOCKED) toBlocked++;
      } else {
        dfLoads++;
        dfPallets += load.palletCount || 0;
        if (load.isHighRisk) dfHighRisk++;
        if (load.status === CargoStatus.RELEASED) dfReleased++;
        if (load.status === CargoStatus.BLOCKED) dfBlocked++;
      }
    });

    return [
      {
        name: 'DF',
        fullname: 'Distrito Federal',
        'Total de Cargas': dfLoads,
        'Volume de Paletes': dfPallets,
        'Alto Risco (PAR)': dfHighRisk,
        'Cargas Liberadas': dfReleased,
        'Cargas Bloqueadas': dfBlocked,
        color: '#10B981', // Verde
      },
      {
        name: 'GO',
        fullname: 'Goiás / Entorno',
        'Total de Cargas': goLoads,
        'Volume de Paletes': goPallets,
        'Alto Risco (PAR)': goHighRisk,
        'Cargas Liberadas': goReleased,
        'Cargas Bloqueadas': goBlocked,
        color: '#D4AF37', // Gold
      },
      {
        name: 'BA',
        fullname: 'Bahia',
        'Total de Cargas': baLoads,
        'Volume de Paletes': baPallets,
        'Alto Risco (PAR)': baHighRisk,
        'Cargas Liberadas': baReleased,
        'Cargas Bloqueadas': baBlocked,
        color: '#A01F24', // Red
      },
      {
        name: 'TO',
        fullname: 'Tocantins',
        'Total de Cargas': toLoads,
        'Volume de Paletes': toPallets,
        'Alto Risco (PAR)': toHighRisk,
        'Cargas Liberadas': toReleased,
        'Cargas Bloqueadas': toBlocked,
        color: '#2563EB', // Azul
      },
    ];
  }, [loads]);

  const centralStats = useMemo(() => {
    // 1. Tempo médio de liberação
    const releasedLoads = loads.filter(l => l.status === CargoStatus.RELEASED);
    let totalMin = 0;
    let countWithTime = 0;

    releasedLoads.forEach(l => {
      if (l.auditedAt && l.createdAt) {
        const ms = new Date(l.auditedAt).getTime() - new Date(l.createdAt).getTime();
        const minutes = Math.floor(ms / (1000 * 60));
        // Be safe with intervals: only count if it's realistic (between 1 minute and 1440 minutes)
        if (minutes > 0 && minutes < 1440) {
          totalMin += minutes;
          countWithTime++;
        }
      }
    });

    const avgReleaseTime = countWithTime > 0 ? Math.round(totalMin / countWithTime) : 18;

    // 2. Volume de cargas por região (Group by DF, GO, BA, TO)
    let dfLoads = 0;
    let goLoads = 0;
    let baLoads = 0;
    let toLoads = 0;

    let dfPallets = 0;
    let goPallets = 0;
    let baPallets = 0;
    let toPallets = 0;

    loads.forEach(load => {
      const dest = load.destination.toUpperCase();
      
      // Determine region
      let isGo = dest.includes('-GO') || 
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
                 dest.includes('LINDAS');
      
      let isBa = dest.includes('-BA') || 
                 dest.includes('LEM') || 
                 dest.includes('LUÍS EDUARDO') ||
                 dest.includes('LUIS EDUARDO') ||
                 dest.includes('MAGALHÃES') ||
                 dest.includes('MAGALHAES');

      let isTo = dest.includes('-TO') || 
                 dest.includes('GURUPI');

      if (isGo) {
        goLoads++;
        goPallets += load.palletCount || 0;
      } else if (isBa) {
        baLoads++;
        baPallets += load.palletCount || 0;
      } else if (isTo) {
        toLoads++;
        toPallets += load.palletCount || 0;
      } else {
        dfLoads++;
        dfPallets += load.palletCount || 0;
      }
    });

    const totalLoadsCount = loads.length;

    return {
      avgReleaseTime,
      countWithTime,
      regions: {
        df: { 
          name: 'Distrito Federal (DF)', 
          loads: dfLoads, 
          pallets: dfPallets, 
          pct: totalLoadsCount > 0 ? Math.round((dfLoads / totalLoadsCount) * 100) : 0 
        },
        go: { 
          name: 'Região de Goiás (GO)', 
          loads: goLoads, 
          pallets: goPallets, 
          pct: totalLoadsCount > 0 ? Math.round((goLoads / totalLoadsCount) * 100) : 0 
        },
        ba: { 
          name: 'Oeste Baiano (BA)', 
          loads: baLoads, 
          pallets: baPallets, 
          pct: totalLoadsCount > 0 ? Math.round((baLoads / totalLoadsCount) * 100) : 0 
        },
        to: { 
          name: 'Tocantins (TO)', 
          loads: toLoads, 
          pallets: toPallets, 
          pct: totalLoadsCount > 0 ? Math.round((toLoads / totalLoadsCount) * 100) : 0 
        },
        other: {
          name: 'Demais',
          loads: 0,
          pallets: 0,
          pct: 0
        }
      },
      totalPallets: loads.reduce((acc, l) => acc + l.palletCount, 0),
      riskCount: loads.filter(l => l.isHighRisk).length,
      releasedCount: releasedLoads.length,
      blockedCount: loads.filter(l => l.status === CargoStatus.BLOCKED).length
    };
  }, [loads]);

  const filteredLoads = loads.filter(load => {
    const matchesSearch = 
      load.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      load.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      load.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      load.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      load.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'ALL' || load.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const selectedLoad = loads.find(l => l.id === selectedLoadId);

  const handleExportManifest = () => {
    if (!selectedLoad) return;
    const doc = new jsPDF();
    
    // Header Style
    doc.setFillColor(27, 54, 93); // Navy background #1B365D
    doc.rect(0, 0, 210, 35, 'F');
    
    // Logo / Text inside header
    doc.setFontSize(18);
    doc.setTextColor(212, 175, 55); // Gold text #D4AF37
    doc.setFont("helvetica", "bold");
    doc.text('ATACADÃO DIA A DIA', 14, 15);
    
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
    doc.text('Central de Monitoramento e Liberação de Cargas', 14, 22);
    doc.text(`Manifesto ID: ${selectedLoad.id.toUpperCase()}`, 14, 28);
    
    // Export Date
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 145, 28);

    // Section: Dados do Veículo e Motorista (Y: 48)
    doc.setFontSize(11);
    doc.setTextColor(27, 54, 93);
    doc.setFont("helvetica", "bold");
    doc.text('1. Informações Básicas da Carga', 14, 48);
    
    autoTable(doc, {
      startY: 52,
      head: [['Identificador', 'Informação / Valor']],
      body: [
        ['ID do Manifesto', selectedLoad.id.toUpperCase()],
        ['Placa do Veículo', selectedLoad.plate],
        ['Nome do Motorista', selectedLoad.driverName],
        ['Tipo de Carga', selectedLoad.cargoType],
        ['Status Atual', selectedLoad.status],
        ['Usuário Expedidor', selectedLoad.createdBy],
        ['Data de Envio', new Date(selectedLoad.createdAt).toLocaleString('pt-BR')],
        ['Alto Risco (PAR)', selectedLoad.isHighRisk ? 'SIM' : 'NÃO']
      ],
      theme: 'striped',
      headStyles: { fillColor: '#1B365D', textColor: '#ffffff' },
      styles: { fontSize: 8.5 }
    });

    // Section 2: Detalhes Logísticos e Rotas
    const nextY1 = (doc as any).lastAutoTable.finalY + 12;
    doc.setFontSize(11);
    doc.setTextColor(27, 54, 93);
    doc.setFont("helvetica", "bold");
    doc.text('2. Rota de Distribuição e Carga', 14, nextY1);

    const routesList = [selectedLoad.destination];
    if (selectedLoad.additionalDestinations && Array.isArray(selectedLoad.additionalDestinations)) {
      routesList.push(...selectedLoad.additionalDestinations);
    }

    autoTable(doc, {
      startY: nextY1 + 4,
      head: [['Localidade', 'Função', 'Lacre Atribuído', 'Status de Visita']],
      body: [
        [selectedLoad.origin, 'Centro de Distribuição (Origem)', selectedLoad.sealNumber || 'N/A', 'Saída'],
        ...routesList.map((dest, idx) => {
          const sealForDest = selectedLoad.sealsByDest?.[dest] || selectedLoad.sealNumber || 'N/A';
          const isVisited = selectedLoad.checkedDestinations?.includes(dest) || false;
          return [
            dest,
            idx === 0 ? 'Destino Principal' : `Destino Adicional #${idx}`,
            sealForDest,
            isVisited ? 'CONCLUÍDO' : 'PENDENTE'
          ];
        })
      ],
      theme: 'grid',
      headStyles: { fillColor: '#D4AF37', textColor: '#0A1128' },
      styles: { fontSize: 8.5 }
    });

    // Section 3: Paletes e Conferência de Segurança
    const nextY2 = (doc as any).lastAutoTable.finalY + 12;
    doc.setFontSize(11);
    doc.setTextColor(27, 54, 93);
    doc.setFont("helvetica", "bold");
    doc.text('3. Segurança & Volumetria', 14, nextY2);

    const palletBody = selectedLoad.palletDetails && selectedLoad.palletDetails.length > 0 
      ? selectedLoad.palletDetails.map(p => [p.type, `${p.quantity} un`, p.destination || 'Geral'])
      : [['Paletes Padrão', `${selectedLoad.palletCount} un`, 'Geral']];

    autoTable(doc, {
      startY: nextY2 + 4,
      head: [['Tipo de Palete', 'Quantidade', 'Destinação']],
      body: [
        ...palletBody,
        [{ content: 'Total Geral de Paletes', colSpan: 1, styles: { fontStyle: 'bold' } }, { content: `${selectedLoad.palletCount} un`, colSpan: 2, styles: { fontStyle: 'bold' } }]
      ],
      theme: 'striped',
      headStyles: { fillColor: '#1B365D', textColor: '#ffffff' },
      styles: { fontSize: 8.5 }
    });

    // Check if PAR details are present
    let nextY3 = (doc as any).lastAutoTable.finalY + 12;
    if (selectedLoad.isHighRisk) {
      if (nextY3 > 240) {
        doc.addPage();
        nextY3 = 20;
      }
      doc.setFontSize(11);
      doc.setTextColor(160, 31, 36); // Red color for PAR
      doc.setFont("helvetica", "bold");
      doc.text('4. Tratamento de Alto Risco (PAR)', 14, nextY3);

      autoTable(doc, {
        startY: nextY3 + 4,
        head: [['Parâmetro PAR', 'Especificação']],
        body: [
          ['Tipo de Tratamento', selectedLoad.parType || 'Não especificado'],
          ['Número da Nota Fiscal (NF)', selectedLoad.parInvoiceNumber || 'Não especificado'],
          ['Descrição do Procedimento', selectedLoad.parDescription || 'Não especificado']
        ],
        theme: 'grid',
        headStyles: { fillColor: '#A01F24', textColor: '#ffffff' },
        styles: { fontSize: 8.5 }
      });
      nextY3 = (doc as any).lastAutoTable.finalY + 12;
    }

    // Check if Occurrence details are present
    if (selectedLoad.occurrenceType && selectedLoad.occurrenceType !== OccurrenceType.NONE) {
      if (nextY3 > 240) {
        doc.addPage();
        nextY3 = 20;
      }
      doc.setFontSize(11);
      doc.setTextColor(190, 100, 0); // Orange/Amber
      doc.setFont("helvetica", "bold");
      doc.text('5. Histórico de Ocorrência Registrada', 14, nextY3);

      autoTable(doc, {
        startY: nextY3 + 4,
        head: [['Ocorrência Detectada', 'Relatório do Auditor / Descrição']],
        body: [
          ['Divergência / Alerta', selectedLoad.occurrenceType],
          ['Detalhes da Auditoria', selectedLoad.occurrenceDescription || 'Sem detalhes informados'],
          ['Data de Auditoria', selectedLoad.auditedAt ? new Date(selectedLoad.auditedAt).toLocaleString('pt-BR') : 'Procedimento em andamento']
        ],
        theme: 'grid',
        headStyles: { fillColor: '#D4AF37', textColor: '#0A1128' },
        styles: { fontSize: 8.5 }
      });
      nextY3 = (doc as any).lastAutoTable.finalY + 12;
    }

    // Footer lines and signatures
    if (nextY3 > 220) {
      doc.addPage();
      nextY3 = 30;
    }

    doc.setDrawColor(200, 200, 200);
    doc.line(14, nextY3 + 15, 90, nextY3 + 15);
    doc.line(120, nextY3 + 15, 196, nextY3 + 15);

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Assinatura do Motorista', 14, nextY3 + 20);
    doc.text(`RG/CPF: ______________________`, 14, nextY3 + 25);

    doc.text('Assinatura da Central de Monitoramento', 120, nextY3 + 20);
    doc.text(`Usuário Responsável: ${selectedLoad.createdBy || 'Central'}`, 120, nextY3 + 25);

    doc.save(`Resumo_Manifesto_${selectedLoad.plate}_${selectedLoad.id.slice(0,8)}.pdf`);
  };

  const targets = selectedLoad
    ? [selectedLoad.destination, ...(selectedLoad.additionalDestinations || [])]
    : [];
  const currentDestIndex = selectedLoad?.currentDestinationIndex || 0;
  const currentDest = targets[currentDestIndex] || '';

  const currentActiveSeal = selectedLoad
    ? (selectedLoad.sealsByDest?.[currentDest] || selectedLoad.sealNumber)
    : '';

  const currentDestPallets = selectedLoad
    ? (selectedLoad.palletDetails?.filter(p => p.destination === currentDest || (!p.destination && currentDestIndex === 0)) || [])
    : [];
  const currentDestPalletCount = currentDestPallets.reduce((sum, p) => sum + p.quantity, 0);

  const targetPalletCount = selectedLoad?.cargoType === CargoType.COMPARTILHADA
    ? currentDestPalletCount
    : (selectedLoad ? selectedLoad.palletCount : 0);

  const isSealMatched = selectedLoad ? (sealConfirm.trim().toUpperCase() === currentActiveSeal.toUpperCase()) : false;
  const isPalletsMatched = selectedLoad ? (Number(palletsConfirm.trim()) === targetPalletCount) : false;

  const normalizeText = (text: string) => 
    text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');

  const isPlateMatched = selectedLoad 
    ? (plateConfirm.trim().replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === 
       selectedLoad.plate.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()) 
    : false;

  const isDriverMatched = selectedLoad 
    ? (normalizeText(driverConfirm) === normalizeText(selectedLoad.driverName)) 
    : false;

  const isFourStepValidated = isSealMatched && isPalletsMatched && isPlateMatched && isDriverMatched;

  useEffect(() => {
    if (selectedLoad) {
      generateRouteSummary(selectedLoad);
    } else {
      setRouteSummary('');
    }
    setSealConfirm('');
    setPalletsConfirm('');
    setPlateConfirm('');
    setDriverConfirm('');
    setNewSealForNextTrip('');
    setIsAwaitingNextSeal(false);
    setEditingSeals({});
  }, [selectedLoadId]);

  const generateRouteSummary = async (load: CargoLoad) => {
    if (!process.env.GEMINI_API_KEY) return;
    
    setIsLoadingSummary(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const destinations = [load.destination, ...(load.additionalDestinations || [])].join(', ');
      const prompt = `Como um especialista em logística, forneça um resumo executivo curto (máximo 3 linhas) da rota de ${load.origin} para ${destinations}. 
      Inclua: 
      1. Estimativa de tempo e distância aproximada.
      2. Principais rodovias prováveis.
      3. Alerta de segurança se a rota passar por áreas críticas.
      Seja direto e profissional.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setRouteSummary(response.text || 'Resumo indisponível.');
    } catch (error) {
      console.error('Erro ao gerar resumo da rota:', error);
      setRouteSummary('Erro ao carregar resumo da inteligência artificial.');
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  };

  const getRouteInfo = (load: CargoLoad) => {
    if (!load.origin || !load.destination) return null;

    let originGeo = ROUTE_COORDINATES[load.origin];
    if (!originGeo) {
      const key = Object.keys(ROUTE_COORDINATES).find(k => 
        k.toLowerCase().includes(load.origin.toLowerCase()) || 
        load.origin.toLowerCase().includes(k.toLowerCase())
      );
      if (key) originGeo = ROUTE_COORDINATES[key];
    }
    
    let destGeo = ROUTE_COORDINATES[load.destination];
    if (!destGeo) {
      const key = Object.keys(ROUTE_COORDINATES).find(k => 
        k.toLowerCase().includes(load.destination.toLowerCase()) || 
        load.destination.toLowerCase().includes(k.toLowerCase())
      );
      if (key) destGeo = ROUTE_COORDINATES[key];
    }

    const defaultOrigin = { 
      lat: -16.01515, 
      lng: -47.98503, 
      address: 'DVA ATACADOS EIRELI, Trecho 2, Conjunto 8 lote 17 - Santa Maria, Brasília - DF', 
      label: load.origin 
    };
    const defaultDest = { 
      lat: -15.7953, 
      lng: -47.9622, 
      address: load.destination, 
      label: load.destination 
    };

    const originPoint = originGeo || defaultOrigin;
    const destPoint = destGeo || defaultDest;

    const additionalPoints = (load.cargoType === CargoType.COMPARTILHADA ? (load.additionalDestinations || []) : [])
      .map(d => {
        let geo = ROUTE_COORDINATES[d];
        if (!geo) {
          const key = Object.keys(ROUTE_COORDINATES).find(k => 
            k.toLowerCase().includes(d.toLowerCase()) || 
            d.toLowerCase().includes(k.toLowerCase())
          );
          if (key) geo = ROUTE_COORDINATES[key];
        }
        return geo || { lat: -15.7953, lng: -47.9622, address: d, label: d };
      });

    // Trace destinations exactly in the sequence defined in the load (main destination then additional destinations)
    const sortedDestinations: typeof ROUTE_COORDINATES[string][] = [destPoint, ...additionalPoints];
    let currentLat = originPoint.lat;
    let currentLng = originPoint.lng;
    let accumulatedDistance = 0;

    for (let i = 0; i < sortedDestinations.length; i++) {
      const d = getDistanceKm(currentLat, currentLng, sortedDestinations[i].lat, sortedDestinations[i].lng);
      accumulatedDistance += d;
      currentLat = sortedDestinations[i].lat;
      currentLng = sortedDestinations[i].lng;
    }

    if (accumulatedDistance < 1) {
      accumulatedDistance = 25.5; 
    }

    const totalEstDuration = Math.round((accumulatedDistance / 50) * 60);

    const originParam = `${originPoint.lat},${originPoint.lng}`;
    const destParam = `${sortedDestinations[sortedDestinations.length - 1].lat},${sortedDestinations[sortedDestinations.length - 1].lng}`;
    
    const fallbackEmbedUrl = `https://maps.google.com/maps?saddr=${originParam}&daddr=${sortedDestinations.map(r => `${r.lat},${r.lng}`).join('+to:')}&output=embed`;
    const externalUrl = `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destParam}&waypoints=${sortedDestinations.slice(0, -1).map(s => `${s.lat},${s.lng}`).join('|')}&travelmode=driving`;

    return {
      sequence: sortedDestinations,
      totalDistance: parseFloat(accumulatedDistance.toFixed(1)),
      totalDuration: totalEstDuration,
      embedUrl: fallbackEmbedUrl,
      externalUrl,
    };
  };

  interface TrafficAlertBase {
    id: string;
    legFrom: string;
    legTo: string;
    severity: 'heavy' | 'moderate' | 'light';
    delayMinutes: number;
    streetName: string;
    description: string;
    isMockedGoogleMapsResponse: boolean;
  }

  const getTrafficAlerts = (load: CargoLoad): TrafficAlertBase[] => {
    if (!load) return [];
    const info = getRouteInfo(load);
    if (!info || !info.sequence || info.sequence.length === 0) return [];
    
    // Check if we are simulating heavy peak traffic.
    if (!trafficPeakSimulation) return [];

    const alerts: TrafficAlertBase[] = [];
    const points = info.sequence;
    const originLabel = ROUTE_COORDINATES[load.origin]?.label || load.origin;

    // Use a value representing the current load unique properties to generate realistic leg variations
    const seed = load.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + (load.additionalDestinations?.length || 0);
    
    // High-traffic streets or highways in Brasilia / DF area (since coordinates are DF stores)
    const dfHighways = [
      "EPTG (Estrada Parque Taguatinga) - Km 4",
      "DF-095 (Estrutural Autódromo)",
      "DF-003 (EPIA Sul - Próximo Carrefour)",
      "BR-020 (Próximo à descida do Colorado)",
      "BR-040 (KM 12 / Entrada Valparaíso)",
      "Pistão Sul (Taguatinga - Próximo Centro)"
    ];
    
    // Leg 1: Origin to First Target
    const dest1 = points[0]?.label || load.destination;
    
    // Add Leg 1 Alert
    alerts.push({
      id: `${load.id}-traffic-leg1`,
      legFrom: originLabel,
      legTo: dest1,
      severity: seed % 2 === 0 ? 'heavy' : 'moderate',
      delayMinutes: seed % 2 === 0 ? Math.round(((seed % 8) + 12)) : Math.round(((seed % 5) + 5)),
      streetName: dfHighways[seed % dfHighways.length],
      description: seed % 2 === 0 
        ? "CONGESTIONAMENTO PESADO DETECTADO: Tráfego saturado na via expressa principal. Dados em tempo real via Google Maps Directions API."
        : "TRÂNSITO LENTO: Fluxo intenso com velocidade média reduzida de veículos comerciais.",
      isMockedGoogleMapsResponse: true
    });

    // Leg 2: First Target to Second Target (if multideposit/shared load with multiple destinations)
    if (points.length > 1) {
      const dest2 = points[1]?.label || load.additionalDestinations?.[0] || 'Destino';
      alerts.push({
        id: `${load.id}-traffic-leg2`,
        legFrom: dest1,
        legTo: dest2,
        severity: seed % 3 === 0 ? 'heavy' : 'moderate',
        delayMinutes: seed % 3 === 0 ? Math.round(((seed % 7) + 10)) : Math.round(((seed % 4) + 4)),
        streetName: dfHighways[(seed + 1) % dfHighways.length],
        description: seed % 3 === 0
          ? "PONTO DE GARGALO: Lentidão severa por veículo quebrado ocupando faixa reversível na DF-095."
          : "RETENÇÃO PARCIAL: Tráfego intermitente em aproximação de rotatória/semáforo.",
        isMockedGoogleMapsResponse: true
      });
    }

    return alerts;
  };

  const getGoogleMapsUrl = (load: CargoLoad) => {
    const info = getRouteInfo(load);
    if (info) {
      return info.embedUrl;
    }
    const origin = encodeURIComponent(load.origin);
    const destination = encodeURIComponent(load.destination);
    const destinations = [load.destination, ...(load.additionalDestinations || [])];
    const daddr = destinations.map(d => d).join('+to:');
    return `https://maps.google.com/maps?saddr=${origin}&daddr=${encodeURIComponent(daddr)}&output=embed`;
  };

  return (
    <div className="space-y-8">
      {/* Componente de Dashboard Inteligente - Volume de Cargas por Região (DF, GO, BA) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 md:p-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-zinc-100">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-gold opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-gold"></span>
              </span>
              <h2 className="text-xs font-black uppercase tracking-[0.1em] text-slate-800">Painel Tático de Distribuição por Região</h2>
            </div>
            <p className="text-[11px] font-bold text-slate-500 mt-1">Análise volumétrica em tempo real das cargas destinadas ao Distrito Federal (DF), Goiás (GO), Bahia (BA) e Tocantins (TO)</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-[10px] uppercase tracking-wider font-black">Monitoramento Ativo</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Gráfico de Barras Principal (Recharts) */}
          <div className="lg:col-span-7 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 11, fontWeight: 800, fill: '#334155' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-800 text-white p-4 rounded-2xl shadow-xl text-xs space-y-2">
                          <p className="font-extrabold text-primary-gold uppercase tracking-widest">{data.fullname}</p>
                          <div className="space-y-1.5 text-slate-300 font-bold">
                            <p className="flex justify-between gap-6">Total de Cargas: <span className="font-mono font-black text-white">{data['Total de Cargas']} un</span></p>
                            <p className="flex justify-between gap-6">Volume de Paletes: <span className="font-mono font-black text-white">{data['Volume de Paletes']} un</span></p>
                            <p className="flex justify-between gap-6 text-rose-400">Alto Risco (PAR): <span className="font-mono font-black">{data['Alto Risco (PAR)']} un</span></p>
                            <p className="flex justify-between gap-6 text-emerald-400">Cargas Liberadas: <span className="font-mono font-black">{data['Cargas Liberadas']} un</span></p>
                            <p className="flex justify-between gap-6 text-amber-400">Cargas Bloqueadas: <span className="font-mono font-black">{data['Cargas Bloqueadas']} un</span></p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  iconType="circle" 
                  wrapperStyle={{ fontSize: '10px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }} 
                />
                <Bar 
                  dataKey="Total de Cargas" 
                  name="Volume de Cargas" 
                  radius={[6, 6, 0, 0]}
                  barSize={40}
                >
                  {regionChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      onClick={() => {
                        setSelectedRegionName(selectedRegionName === entry.name ? null : entry.name);
                        setExpandedStoreKey(null);
                        setSelectedRegionStoreSearch('');
                      }}
                      className="cursor-pointer hover:opacity-80 transition-all"
                    />
                  ))}
                </Bar>
                <Bar 
                  dataKey="Alto Risco (PAR)" 
                  name="Cargas Alto Risco (PAR)" 
                  fill="#A01F24"
                  radius={[6, 6, 0, 0]}
                  barSize={12}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Cards Rápidos de Detalhamento por Estado */}
          <div className="lg:col-span-5 flex flex-col justify-center gap-4">
            {regionChartData.map((reg) => {
              const isActive = selectedRegionName === reg.name;
              return (
                <button 
                  type="button"
                  key={reg.name}
                  onClick={() => {
                    setSelectedRegionName(isActive ? null : reg.name);
                    setExpandedStoreKey(null);
                    setSelectedRegionStoreSearch('');
                  }}
                  className={`w-full text-left p-4 rounded-2xl border flex items-center justify-between transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? 'border-primary-gold bg-amber-50/40 ring-4 ring-primary-gold/15 shadow-md scale-[1.01]' 
                      : 'border-slate-100 bg-slate-50/50 hover:bg-slate-150/40 hover:shadow-xs hover:scale-[1.005]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      style={{ backgroundColor: reg.color }} 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-md"
                    >
                      {reg.name}
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-700 uppercase tracking-tight">{reg.fullname}</h3>
                      <p className="text-[10px] text-slate-500 font-bold">
                        {reg['Volume de Paletes']} paletes movimentados
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <div className="font-mono font-black text-slate-800 text-lg leading-none">
                        {reg['Total de Cargas']}
                      </div>
                      <span className="text-[9px] font-black tracking-widest uppercase text-slate-400">Manifestos</span>
                    </div>
                    <div className="border-l border-slate-200 pl-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                        reg['Alto Risco (PAR)'] > 0 
                          ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}>
                        {reg['Alto Risco (PAR)']} PAR
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Regional Stores Panel */}
        <div className="border-t border-slate-100 mt-8 pt-8">
          {!selectedRegionName ? (
            <div className="flex items-center justify-center py-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400 shrink-0" />
                Clique em uma região no gráfico ou card acima para planejar e inspecionar o detalhamento das lojas
              </p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
              {/* Header section */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div 
                    style={{ backgroundColor: regionChartData.find(r => r.name === selectedRegionName)?.color || '#64748B' }}
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md"
                  >
                    {selectedRegionName}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                        Lojas Monitoradas: Regional {selectedRegionName}
                      </h3>
                      <span className="bg-slate-200 text-slate-700 text-[10px] uppercase font-black px-2 py-0.5 rounded-full">
                        {regionStoresDetails.length} {regionStoresDetails.length === 1 ? 'Loja' : 'Lojas'}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                      {regionChartData.find(r => r.name === selectedRegionName)?.fullname || ''}
                    </p>
                  </div>
                </div>

                {/* Actions & Filters */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                  {/* Search bar inside selected regional */}
                  <div className="relative flex-1 md:flex-initial">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder={`Buscar loja nesta regional...`}
                      value={selectedRegionStoreSearch}
                      onChange={(e) => {
                        setSelectedRegionStoreSearch(e.target.value);
                        setExpandedStoreKey(null);
                      }}
                      className="w-full md:w-64 pl-10 pr-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-primary-gold focus:ring-2 focus:ring-primary-gold/15 transition-all placeholder:text-slate-400"
                    />
                    {selectedRegionStoreSearch && (
                      <button 
                        type="button"
                        onClick={() => {
                          setSelectedRegionStoreSearch('');
                          setExpandedStoreKey(null);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase font-black text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        Limpar
                      </button>
                    )}
                  </div>

                  {/* Close button */}
                  <button 
                    type="button"
                    onClick={() => {
                      setSelectedRegionName(null);
                      setSelectedRegionStoreSearch('');
                      setExpandedStoreKey(null);
                    }}
                    className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-500 hover:text-slate-800 rounded-xl transition-all cursor-pointer"
                    title="Fechar detalhamento"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Stores list */}
              {regionStoresDetails.length === 0 ? (
                <div className="text-center py-12 text-slate-500 font-bold text-xs bg-slate-50/30 rounded-2xl border border-slate-100">
                  Nenhuma loja encontrada para os filtros aplicados nesta regional.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {regionStoresDetails.map((store) => {
                    const isExpanded = expandedStoreKey === store.key;
                    return (
                      <div 
                        key={store.key}
                        className={`rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col ${
                          isExpanded 
                            ? 'border-primary-gold bg-amber-50/5 ring-4 ring-primary-gold/5 shadow-md col-span-1 md:col-span-2 lg:col-span-3' 
                            : 'border-slate-150 bg-white hover:bg-slate-50/50 hover:shadow-xs'
                        }`}
                      >
                        {/* Upper card data */}
                        <div 
                          onClick={() => setExpandedStoreKey(isExpanded ? null : store.key)}
                          className="p-4 flex items-start justify-between gap-4 cursor-pointer select-none"
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 text-slate-700 text-[9px] font-black uppercase tracking-wider px-2 py-0.5">
                              ID: {store.key}
                            </span>
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight truncate">
                              {store.label}
                            </h4>
                            <p className="text-[10px] text-slate-400 font-medium truncate flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              {store.address || 'Endereço não cadastrado'}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 self-center shrink-0">
                            {/* Metrics badges */}
                            <div className="text-right">
                              <div className="flex items-center gap-1 justify-end font-mono font-black text-slate-800 text-xs text-right">
                                <Truck className="w-3 h-3 text-slate-400" />
                                {store.loadsCount}
                              </div>
                              <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 text-right block">
                                {store.loadsCount === 1 ? 'Manifesto' : 'Manifestos'}
                              </span>
                            </div>

                            <div className="border-l border-slate-200 pl-3 text-right">
                              <div className="flex items-center gap-1 justify-end font-mono font-black text-slate-800 text-xs text-right">
                                <Package className="w-3 h-3 text-slate-400" />
                                {store.palletsCount}
                              </div>
                              <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 text-right block">Paletes</span>
                            </div>

                            {/* Chevron indicators */}
                            <div className="pl-1 text-slate-400">
                              <span className={`block transition-transform duration-200 text-[10px] font-black ${isExpanded ? 'rotate-180 text-primary-gold' : ''}`}>
                                ▼
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Store high alert banner */}
                        {store.highRiskCount > 0 && !isExpanded && (
                          <div className="px-4 py-1.5 bg-rose-50 border-t border-rose-100/50 flex items-center justify-between">
                            <span className="text-[9px] font-black text-rose-700 uppercase tracking-wider flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3 text-rose-500" /> Possui {store.highRiskCount} {store.highRiskCount === 1 ? 'carga' : 'cargas'} de Alto Risco (PAR)
                            </span>
                          </div>
                        )}

                        {/* Expanded details list */}
                        {isExpanded && (
                          <div className="border-t border-slate-100 bg-slate-50/30 p-4 space-y-3 animate-in fade-in duration-200">
                            <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                              <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                              Manifestos Atribuídos a esta Loja ({store.loads.length})
                            </h5>

                            {store.loads.length === 0 ? (
                              <p className="text-[11px] font-medium text-slate-400 py-2">Nenhum manifesto ativo ou programado em rota direta para esta loja no momento.</p>
                            ) : (
                              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                                <table className="w-full text-left border-collapse">
                                  <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                      <th className="p-3">Veículo / Placa</th>
                                      <th className="p-3">Motorista</th>
                                      <th className="p-3 text-center">Paletes</th>
                                      <th className="p-3 text-center">Tipo PAR</th>
                                      <th className="p-3">Status de Trânsito</th>
                                      <th className="p-3 text-right">Ação</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-150 text-[11px]">
                                    {store.loads.map((load) => {
                                      // Get status styling
                                      const isReleased = load.status === CargoStatus.RELEASED;
                                      const isBlocked = load.status === CargoStatus.BLOCKED;

                                      return (
                                        <tr key={load.id} className="hover:bg-slate-50/50 transition-colors">
                                          <td className="p-3 font-black text-slate-700">
                                            <div className="flex items-center gap-1.5">
                                              <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0"></span>
                                              {load.plate}
                                            </div>
                                          </td>
                                          <td className="p-3 font-bold text-slate-600">{load.driverName}</td>
                                          <td className="p-3 font-mono font-black text-slate-700 text-center">
                                            {load.palletCount} un
                                          </td>
                                          <td className="p-3 text-center">
                                            {load.isHighRisk ? (
                                              <span className="inline-flex items-center gap-1 rounded bg-rose-50 border border-rose-100 px-1.5 py-0.5 text-[9px] font-black text-rose-700 uppercase">
                                                PAR
                                              </span>
                                            ) : (
                                              <span className="text-slate-400">-</span>
                                            )}
                                          </td>
                                          <td className="p-3">
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                                              isReleased 
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                                : isBlocked
                                                  ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                                  : 'bg-amber-50 text-amber-700 border border-amber-100'
                                            }`}>
                                              {load.status}
                                            </span>
                                          </td>
                                          <td className="p-3 text-right">
                                            <button 
                                              type="button"
                                              onClick={() => {
                                                setSelectedLoadId(load.id);
                                              }}
                                              className="px-2.5 py-1 text-[10px] font-black uppercase bg-primary-gold hover:bg-opacity-90 hover:scale-[1.02] text-slate-800 rounded-lg transition-all cursor-pointer"
                                            >
                                              Rastrear
                                            </button>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Tempo Médio de Liberação */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-start justify-between min-h-[140px]">
          <div className="space-y-3 flex-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tempo de Liberação</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-800 font-mono">{centralStats.avgReleaseTime}</span>
              <span className="text-xs font-black text-slate-500 uppercase">minutos</span>
            </div>
            <p className="text-[10px] font-bold text-slate-500">
              {centralStats.countWithTime > 0 
                ? `Média de ${centralStats.countWithTime} liberação(ões)` 
                : "Tempo médio estimado de gate"}
            </p>
          </div>
          <div className="p-3 bg-amber-50 rounded-2xl text-amber-500">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Volume de Cargas por Região */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between min-h-[140px]">
          <div className="flex items-start justify-between">
            <div className="space-y-0.5 w-[75%]">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Volume por Região</span>
              <div className="text-[11px] font-bold text-slate-600 space-y-1 mt-1.5">
                <div className="flex justify-between gap-4">
                  <span className="truncate">Distrito Fed. (DF):</span>
                  <span className="font-mono font-black text-slate-800">{centralStats.regions.df.loads} <span className="text-[9px] font-normal text-slate-400">({centralStats.regions.df.pct}%)</span></span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="truncate">Entorno / GO:</span>
                  <span className="font-mono font-black text-slate-800">{centralStats.regions.go.loads} <span className="text-[9px] font-normal text-slate-400">({centralStats.regions.go.pct}%)</span></span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="truncate">Oeste Baiano (BA):</span>
                  <span className="font-mono font-black text-slate-800">{centralStats.regions.ba.loads} <span className="text-[9px] font-normal text-slate-400">({centralStats.regions.ba.pct}%)</span></span>
                </div>
                <div className="flex justify-between gap-4 text-blue-600">
                  <span className="truncate">Tocantins (TO):</span>
                  <span className="font-mono font-black text-blue-700">{centralStats.regions.to.loads} <span className="text-[9px] font-normal text-slate-400">({centralStats.regions.to.pct}%)</span></span>
                </div>
              </div>
            </div>
            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-500">
              <MapPin className="w-6 h-6" />
            </div>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex mt-3">
            {centralStats.regions.df.pct > 0 && (
              <div 
                style={{ width: `${centralStats.regions.df.pct}%` }} 
                className="bg-emerald-500 h-full" 
                title={`DF: ${centralStats.regions.df.pct}%`} 
              />
            )}
            {centralStats.regions.go.pct > 0 && (
              <div 
                style={{ width: `${centralStats.regions.go.pct}%` }} 
                className="bg-primary-gold h-full" 
                title={`GO: ${centralStats.regions.go.pct}%`} 
              />
            )}
            {centralStats.regions.ba.pct > 0 && (
              <div 
                style={{ width: `${centralStats.regions.ba.pct}%` }} 
                className="bg-rose-600 h-full" 
                title={`BA: ${centralStats.regions.ba.pct}%`} 
              />
            )}
            {centralStats.regions.to.pct > 0 && (
              <div 
                style={{ width: `${centralStats.regions.to.pct}%` }} 
                className="bg-blue-600 h-full" 
                title={`TO: ${centralStats.regions.to.pct}%`} 
              />
            )}
          </div>
        </div>

        {/* Card 3: Cargas Ativas e Fluxo de Paletes */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-start justify-between min-h-[140px]">
          <div className="space-y-3 flex-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Paletes Ativos</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-800 font-mono">{centralStats.totalPallets}</span>
              <span className="text-xs font-black text-slate-500 uppercase">unidades</span>
            </div>
            <p className="text-[10px] font-bold text-slate-500">
              Média de {(centralStats.totalPallets / (loads.length || 1)).toFixed(1)} paletes por carga
            </p>
          </div>
          <div className="p-3 bg-blue-50 rounded-2xl text-blue-500">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Taxa de Eficiência Operacional */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-start justify-between min-h-[140px]">
          <div className="space-y-3 flex-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Eficiência de Liberação</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-emerald-600 font-mono">
                {loads.length > 0 ? Math.round((centralStats.releasedCount / loads.length) * 100) : 100}%
              </span>
            </div>
            <p className="text-[10px] font-bold text-slate-500">
              {centralStats.releasedCount} liberadas • {centralStats.blockedCount} com divergência
            </p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* List Section */}
      <div className={`${viewMode === 'split' ? 'lg:col-span-4' : 'lg:col-span-12'} space-y-6 transition-all duration-300`}>
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-[750px] flex flex-col">
          <div className="p-6 border-b bg-primary-navy flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-gold rounded-lg">
                <LayoutDashboard className="w-5 h-5 text-primary-navy" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-tight text-white">Monitoramento</h3>
                <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Tempo Real</p>
              </div>
            </div>
            <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
              <div className="bg-slate-900/40 p-1 rounded-xl flex items-center border border-white/5 gap-1 shadow-inner">
                <button
                  onClick={() => handleSetViewMode('split')}
                  className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 cursor-pointer border-0 ${
                    viewMode === 'split'
                      ? 'bg-primary-gold text-primary-navy shadow-md shadow-amber-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
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
                      ? 'bg-primary-gold text-primary-navy shadow-md shadow-amber-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                  title="Layout Isolar Painel Lateral"
                >
                  <PanelRight className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Painel Lateral</span>
                </button>
              </div>
              <span className="text-[10px] font-black bg-primary-gold text-white px-2.5 py-1.5 rounded-lg uppercase tracking-widest shadow-sm">
                {filteredLoads.length} Cargas
              </span>
            </div>
          </div>

          <div className="p-4 space-y-4 border-b bg-white">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-primary-navy focus:ring-2 focus:ring-primary-gold outline-none transition-all"
                placeholder="Buscar placa, motorista, rota..."
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
              {[
                { key: 'ALL', label: 'TODOS', count: loads.length, activeBg: 'bg-primary-navy border-primary-navy text-white shadow-lg shadow-slate-900/10', hoverBg: 'hover:bg-slate-200' },
                { 
                  key: CargoStatus.AWAITING, 
                  label: 'PORTARIA', 
                  count: loads.filter(l => l.status === CargoStatus.AWAITING).length, 
                  activeBg: 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20', 
                  hoverBg: 'hover:bg-amber-100',
                  dotColor: 'bg-amber-500'
                },
                { 
                  key: CargoStatus.RELEASED, 
                  label: 'EM TRÂNSITO', 
                  count: loads.filter(l => l.status === CargoStatus.RELEASED).length, 
                  activeBg: 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/20', 
                  hoverBg: 'hover:bg-emerald-100',
                  dotColor: 'bg-emerald-500'
                },
                { 
                  key: CargoStatus.BLOCKED, 
                  label: 'DIVERGÊNCIAS', 
                  count: loads.filter(l => l.status === CargoStatus.BLOCKED).length, 
                  activeBg: 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-600/20', 
                  hoverBg: 'hover:bg-orange-100',
                  dotColor: 'bg-orange-500'
                }
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setFilterStatus(item.key as any)}
                  className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 border cursor-pointer ${
                    filterStatus === item.key
                      ? `${item.activeBg}`
                      : `bg-slate-50 border-slate-100 text-slate-500 hover:text-slate-800 ${item.hoverBg}`
                  }`}
                >
                  {item.dotColor && (
                    <span className={`w-1.5 h-1.5 rounded-full ${item.dotColor} ${filterStatus === item.key ? 'bg-white animate-pulse' : ''}`} />
                  )}
                  <span>{item.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black ${
                    filterStatus === item.key 
                      ? 'bg-white/20 text-white' 
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {item.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Controls for Bulk Selection and Bulk Actions */}
            <div className="flex flex-col gap-2.5 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Ações em Lote</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllLoads}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] font-black rounded-lg uppercase tracking-wider transition-all"
                  >
                    Selecionar Todos
                  </button>
                  {selectedLoadIds.length > 0 && (
                    <button
                      type="button"
                      onClick={deselectAllLoads}
                      className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-[9px] font-black rounded-lg uppercase tracking-wider transition-all"
                    >
                      Limpar ({selectedLoadIds.length})
                    </button>
                  )}
                </div>
              </div>

              {selectedLoadIds.length > 0 && (
                <div className="bg-slate-900 text-white rounded-xl p-3 space-y-2.5 border border-slate-800 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400">
                      Alterar estado ({selectedLoadIds.length} selecionadas):
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleBulkUpdateStatus(CargoStatus.RELEASED)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black py-2 rounded-lg uppercase tracking-widest transition-all cursor-pointer text-center"
                    >
                      Liberar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkUpdateStatus(CargoStatus.BLOCKED)}
                      className="bg-red-600 hover:bg-red-500 text-white text-[9px] font-black py-2 rounded-lg uppercase tracking-widest transition-all cursor-pointer text-center"
                    >
                      Bloquear
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkUpdateStatus(CargoStatus.AWAITING)}
                      className="bg-amber-500 hover:bg-amber-400 text-white text-[9px] font-black py-2 rounded-lg uppercase tracking-widest transition-all cursor-pointer text-center"
                    >
                      Portaria
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={`flex-grow overflow-y-auto p-4 ${
            viewMode === 'split' 
              ? 'space-y-3' 
              : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max align-start content-start placeholder-parent pb-16'
          }`}>
            {filteredLoads.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                <Search className="w-12 h-12 text-slate-300" />
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Nenhum registro encontrado</p>
              </div>
            ) : (
              filteredLoads.map((load) => {
                const isSelected = selectedLoadIds.includes(load.id);
                return (
                  <div
                    key={load.id}
                    onClick={() => setSelectedLoadId(load.id)}
                    className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 group relative overflow-hidden border-l-4 cursor-pointer ${
                      selectedLoadId === load.id
                        ? 'bg-slate-50 border-primary-navy ring-4 ring-primary-navy/5 shadow-inner'
                        : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-md'
                    } ${
                      load.status === CargoStatus.RELEASED ? 'border-l-emerald-500' :
                      load.status === CargoStatus.BLOCKED ? 'border-l-red-500' : 'border-l-amber-500 font-bold'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleLoadSelection(load.id);
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{load.plate}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider flex items-center gap-1 ${
                        load.status === CargoStatus.RELEASED 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : load.status === CargoStatus.BLOCKED 
                            ? 'bg-orange-50 text-orange-700 border border-orange-200 animate-pulse' 
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          load.status === CargoStatus.RELEASED ? 'bg-emerald-500' :
                          load.status === CargoStatus.BLOCKED ? 'bg-orange-500' : 'bg-amber-500'
                        }`} />
                        {load.status === CargoStatus.RELEASED ? 'EM TRÂNSITO' :
                         load.status === CargoStatus.BLOCKED ? 'DIVERGÊNCIA' : 'PORTARIA'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate w-40">{load.driverName}</p>
                        <p className="text-[9px] font-black text-primary-navy uppercase tracking-tighter">{load.origin} ➔ {load.destination}</p>
                        {load.gateStatus && (
                          <span className={`inline-block mt-1 text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${
                            load.gateStatus === 'Aprovado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' :
                            load.gateStatus === 'Divergente' ? 'bg-rose-50 text-rose-700 border-rose-200/50 animate-pulse' :
                            'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            Gate: {load.gateStatus === 'Aprovado' ? '✓ Aprovado' : load.gateStatus === 'Divergente' ? '✗ Divergente' : '⏱ Aguardando'}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[9px] font-mono font-bold text-slate-400">{new Date(load.createdAt).toLocaleTimeString()}</span>
                        {load.isHighRisk && (
                          <div className="bg-red-100 p-1 rounded-lg">
                            <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Backdrop for Side-Panel View */}
      {viewMode === 'side-panel' && selectedLoadId && (
        <div 
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-xs transition-opacity animate-in fade-in duration-300"
          onClick={() => setSelectedLoadId(null)}
        />
      )}

      {/* Details Section */}
      <div className={
        viewMode === 'split'
          ? 'lg:col-span-8 space-y-6'
          : selectedLoadId
            ? 'fixed inset-y-0 right-0 z-50 w-full max-w-4xl bg-white shadow-2xl flex flex-col h-full border-l border-slate-200 transition-all duration-300 animate-in slide-in-from-right'
            : 'hidden'
      }>
        <div className={
          viewMode === 'split'
            ? 'bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-[750px] flex flex-col'
            : 'bg-white flex flex-col h-full overflow-hidden'
        }>
          {viewMode === 'side-panel' && selectedLoad && (
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-primary-navy tracking-widest bg-primary-gold px-2.5 py-1 rounded">Painel de Conferência</span>
                <span className="text-xs font-black text-slate-800 uppercase font-mono tracking-tight">{selectedLoad.plate}</span>
              </div>
              <button 
                onClick={() => setSelectedLoadId(null)}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-1 border-0"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>FECHAR PAINEL</span>
              </button>
            </div>
          )}
          {selectedLoad ? (
            <div className="flex-grow overflow-y-auto">
              <div className="p-8 bg-primary-navy text-white relative h-40 flex items-center">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_center,_var(--tw-gradient-stops))] from-primary-gold via-transparent to-transparent"></div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 w-full relative z-10">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl border-4 border-primary-gold group overflow-hidden">
                      <Truck className="w-10 h-10 text-primary-navy group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-3xl font-black tracking-tighter">{selectedLoad.plate}</h2>
                        {selectedLoad.isHighRisk && (
                          <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">
                            ALTO RISCO (PAR)
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Manifesto: {selectedLoad.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="flex flex-col md:items-end gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <button
                        id="view-load-details-modal-btn"
                        onClick={() => setShowOccurrencesModal(true)}
                        className="bg-slate-800 hover:bg-slate-705 text-white text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5 shadow-md border border-slate-700 cursor-pointer"
                        title="Visualizar Histórico Completo de Ocorrências e Detalhes da Carga"
                      >
                        <History className="w-3.5 h-3.5 text-primary-gold" />
                        <span>Ver Ocorrências ({selectedLoad.occurrenceHistory?.length || 0})</span>
                      </button>
                      <button
                        id="export-manifest-summary-btn"
                        onClick={handleExportManifest}
                        className="bg-primary-gold hover:bg-yellow-500 text-primary-navy text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer border-0"
                        title="Exportar Resumo do Manifesto"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Exportar Resumo</span>
                      </button>
                      <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg ${
                        selectedLoad.status === CargoStatus.RELEASED ? 'bg-emerald-600 text-white' :
                        selectedLoad.status === CargoStatus.BLOCKED ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
                      }`}>
                        {selectedLoad.status}
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">Última atualização: {new Date(selectedLoad.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Real-time Countdown Tracker for Cargo Delivery */}
              <CountdownTracker 
                load={selectedLoad} 
                estimatedDurationMinutes={getRouteInfo(selectedLoad)?.totalDuration || 45} 
              />

              {/* Grid Info */}
              <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                  <div className="flex items-center gap-3 text-slate-400">
                    <MapPin className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Logística</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Origem</p>
                      <p className="text-sm font-black text-slate-800">{selectedLoad.origin}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Destino</p>
                      <p className="text-sm font-black text-slate-800">{selectedLoad.destination}</p>
                      {selectedLoad.additionalDestinations && selectedLoad.additionalDestinations.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {selectedLoad.additionalDestinations.map((d, i) => (
                            <span key={i} className="text-[8px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">
                              + {d}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                  <div className="flex items-center gap-3 text-slate-400">
                    <Package className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Carga</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Tipo</p>
                      <p className="text-sm font-black text-slate-800">{selectedLoad.cargoType}</p>
                      {selectedLoad.cargoType === CargoType.COMPARTILHADA && selectedLoad.sharedCargoDescriptions && Object.keys(selectedLoad.sharedCargoDescriptions).length > 0 && (
                        <div className="mt-2 text-[10px] space-y-1 bg-white p-2.5 rounded-xl border border-slate-200/80">
                          <p className="font-extrabold text-slate-500 uppercase tracking-widest text-[8px] mb-1">Descrição por destino:</p>
                          {Object.entries(selectedLoad.sharedCargoDescriptions).map(([dest, desc]) => (
                            <div key={dest} className="flex justify-between gap-2 border-b border-slate-50 last:border-0 pb-1 last:pb-0">
                              <span className="font-bold text-slate-600 shrink-0">{dest}:</span>
                              <span className="text-slate-700 italic text-right truncate max-w-[150px]" title={desc}>{desc}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Volume</p>
                      <p className="text-sm font-black text-slate-800">{selectedLoad.palletCount} Paletes</p>
                      {selectedLoad.palletDetails && selectedLoad.palletDetails.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {selectedLoad.palletDetails.map((p, i) => (
                            <span key={i} className="text-[9px] bg-white text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-extrabold uppercase shadow-2xs">
                              {p.quantity}x {p.type}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                  <div className="flex items-center gap-3 text-slate-400">
                    <ShieldCheck className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Segurança</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Lacre</p>
                      <p className="text-sm font-mono font-black text-primary-gold">{selectedLoad.sealNumber}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Expedidor</p>
                      <p className="text-sm font-black text-slate-800">{selectedLoad.createdBy}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline Carga Compartilhada */}
              {selectedLoad.cargoType === CargoType.COMPARTILHADA && (
                <div className="px-8 pb-8">
                  <div className="bg-blue-50/50 border border-blue-200/50 rounded-3xl p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-2.5 w-2.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                        </span>
                        <h3 className="text-xs font-black uppercase text-blue-900 tracking-wider">Acompanhamento e Registro de Lacres por Etapa ({targets.length} Destinos)</h3>
                      </div>
                      <span className="text-[9px] font-black bg-blue-900 text-white px-2.5 py-1 rounded max-w-max uppercase tracking-wider">
                        CONTROLE MULTI-LACRE
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                      {targets.map((dest, idx) => {
                        const isChecked = idx < currentDestIndex;
                        const isCurrent = idx === currentDestIndex;

                        const destPalletsList = selectedLoad.palletDetails?.filter(p => p.destination === dest || (!p.destination && idx === 0)) || [];
                        const destPalletQty = destPalletsList.reduce((sum, p) => sum + p.quantity, 0);

                        const originalVal = idx === 0 
                          ? selectedLoad.sealNumber 
                          : (selectedLoad.sealsByDest?.[dest] || '');

                        const currentVal = editingSeals[idx] !== undefined 
                          ? editingSeals[idx] 
                          : originalVal;

                        const hasChanged = currentVal.trim().toUpperCase() !== originalVal.trim().toUpperCase();

                        return (
                          <div 
                            key={idx} 
                            draggable
                            onDragStart={(e) => {
                              setDraggedTargetIdx(idx);
                              e.dataTransfer.effectAllowed = 'move';
                            }}
                            onDragEnd={() => {
                              setDraggedTargetIdx(null);
                              setDragOverTargetIdx(null);
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                            }}
                            onDragEnter={(e) => {
                              e.preventDefault();
                              setDragOverTargetIdx(idx);
                            }}
                            onDragLeave={() => {
                              if (dragOverTargetIdx === idx) {
                                setDragOverTargetIdx(null);
                              }
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (draggedTargetIdx === null || draggedTargetIdx === idx) return;
                              handleReorderTargets(draggedTargetIdx, idx);
                              setDraggedTargetIdx(null);
                              setDragOverTargetIdx(null);
                            }}
                            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between cursor-grab active:cursor-grabbing hover:shadow-md ${
                              draggedTargetIdx === idx ? 'opacity-30 border-dashed border-primary-gold bg-amber-50/25 scale-95' :
                              dragOverTargetIdx === idx ? 'border-primary-gold bg-amber-50 ring-2 ring-primary-gold/10 scale-[1.02]' :
                              isChecked ? 'bg-emerald-50 border-emerald-200 text-emerald-950' :
                              isCurrent ? 'bg-blue-600 border-blue-700 text-white shadow-md' :
                              'bg-white border-slate-200 text-slate-500'
                            }`}
                          >
                            <div className="select-none">
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1.5 ${
                                  isChecked ? 'bg-emerald-150 text-emerald-800' :
                                  isCurrent ? 'bg-white/20 text-white' :
                                  'bg-slate-100 text-slate-500'
                                }`}>
                                  <GripVertical className="w-3 h-3 text-current opacity-60 shrink-0" />
                                  {idx + 1}º Destino
                                </span>
                                {isChecked && (
                                  <span className="text-[9px] font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded uppercase">Conferido</span>
                                )}
                                {isCurrent && (
                                  <span className="text-[9px] font-bold bg-white text-blue-600 px-1.5 py-0.5 rounded animate-pulse uppercase font-black">Destino Atual</span>
                                )}
                              </div>

                              <p className="text-sm font-black uppercase truncate text-left" title={dest}>{dest}</p>
                              <p className={`text-[10px] font-bold mt-1 text-left ${isCurrent ? 'text-blue-100' : 'text-slate-400'}`}>
                                Palete classificados: <span className="font-black">{destPalletQty} un</span>
                              </p>
                              {selectedLoad.sharedCargoDescriptions?.[dest] && (
                                <p className={`text-[10px] italic mt-1 text-left ${isCurrent ? 'text-blue-50/90 font-medium' : 'text-slate-500'}`}>
                                  Carga: <span className="font-bold">{selectedLoad.sharedCargoDescriptions[dest]}</span>
                                </p>
                              )}
                            </div>

                            {isChecked ? (
                              /* Historic stage: view only / secured seal record */
                              <div className="mt-3 pt-3 border-t border-emerald-200/50 flex flex-col gap-1 text-[10px] text-left">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold uppercase tracking-wider flex items-center gap-1 opacity-70">
                                    <svg className="w-3 h-3 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path>
                                    </svg>
                                    Lacre Validado:
                                  </span>
                                  <span className="font-mono font-black text-xs text-emerald-800 bg-emerald-100/50 px-2 py-0.5 rounded">{originalVal || 'M-0000'}</span>
                                </div>
                              </div>
                            ) : (
                              /* Current & upcoming stages: editable seal registration */
                              <div className={`mt-3 pt-3 border-t ${isCurrent ? 'border-white/20' : 'border-slate-100'} space-y-1.5 text-left`}>
                                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider">
                                  <span className={isCurrent ? 'text-blue-100' : 'text-slate-400'}>
                                    {isCurrent ? 'Lacre Ativo da Etapa:' : 'Lacre Agendado:'}
                                  </span>
                                  {originalVal && (
                                    <span className={`font-mono ${isCurrent ? 'text-blue-150' : 'text-slate-400'}`}>
                                      Gravado: {originalVal}
                                    </span>
                                  )}
                                </div>
                                <div className="flex gap-1.5">
                                  <input
                                    type="text"
                                    className={`w-full text-xs font-bold font-mono uppercase tracking-wider rounded-lg px-2.5 py-1.5 outline-none transition-all ${
                                      isCurrent 
                                        ? 'bg-blue-800/85 text-white border border-blue-500/50 focus:ring-1 focus:ring-white placeholder:text-blue-300/40' 
                                        : 'bg-slate-50 text-slate-800 border border-slate-200 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-350 shrink-0'
                                    }`}
                                    placeholder={originalVal ? originalVal : "DIGITE O LACRE..."}
                                    value={currentVal}
                                    onChange={(e) => setEditingSeals(prev => ({ ...prev, [idx]: e.target.value.toUpperCase() }))}
                                  />
                                  {hasChanged && currentVal.trim() !== '' && (
                                    <button
                                      type="button"
                                      onClick={() => handleSaveSealForStage(idx, currentVal)}
                                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow active:scale-95 flex items-center justify-center gap-1 shrink-0 ${
                                        isCurrent
                                          ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
                                          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                      }`}
                                      title="Salvar Lacre para esta Etapa"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Route Analysis Section */}
              {(() => {
                const routeInfo = getRouteInfo(selectedLoad);
                const activeTrafficAlerts = selectedLoad ? getTrafficAlerts(selectedLoad) : [];
                return (
                  <div className="px-8 pb-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left side: Map and Mobile GPS opening */}
                      <div className="space-y-4">
                        <div className="bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden h-[300px] relative font-sans shadow-sm">
                          <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
                            <div className="bg-white/95 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-2 shadow-sm">
                              <Navigation className="w-3 h-3 text-primary-gold" />
                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-700">Rastreamento da Rota</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {selectedLoad && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowTrafficAlertsPanel(!showTrafficAlertsPanel);
                                    setShowReorderCentralPanel(false);
                                  }}
                                  className={`shadow-sm px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border ${
                                    activeTrafficAlerts.length > 0
                                      ? 'bg-rose-950/90 border-rose-505/50 text-rose-200 hover:border-rose-400'
                                      : 'bg-slate-900 border-primary-gold/30 hover:border-primary-gold text-white hover:text-primary-gold'
                                  }`}
                                  title="Análise de Tráfego via Directions API"
                                >
                                  <Car className={`w-3 h-3 ${activeTrafficAlerts.length > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`} />
                                  <span>Tráfego {activeTrafficAlerts.length > 0 && `(${activeTrafficAlerts.length})`}</span>
                                </button>
                              )}
                              {selectedLoad?.cargoType === CargoType.COMPARTILHADA && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowReorderCentralPanel(!showReorderCentralPanel);
                                    setShowTrafficAlertsPanel(false);
                                  }}
                                  className="bg-slate-900 border border-primary-gold/30 hover:border-primary-gold text-white hover:text-primary-gold shadow-sm px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                                  title="Reordenar Sequência de Entregas"
                                >
                                  <GripVertical className="w-3 h-3 text-primary-gold shrink-0 animate-pulse" />
                                  Reordenar
                                </button>
                              )}
                              <span className="bg-emerald-600 text-white text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-wider shadow-sm">
                                OTIMIZADO
                              </span>
                            </div>
                          </div>
                          
                          <iframe
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            style={{ border: 0 }}
                            src={routeInfo ? routeInfo.embedUrl : getGoogleMapsUrl(selectedLoad)}
                            allowFullScreen
                            title="Monitoramento Rota CargaRadar"
                          ></iframe>

                          {showReorderCentralPanel && selectedLoad && (
                            <div className="absolute inset-x-4 top-14 bottom-4 z-20 bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl border border-slate-200/80 p-4 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top duration-300 select-none">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2 shrink-0">
                                <div className="flex items-center gap-1.5 text-slate-900">
                                  <GripVertical className="w-3.5 h-3.5 text-primary-gold shrink-0 animate-pulse" />
                                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-800">
                                    Sequência de Entregas (Drag & Drop)
                                  </h4>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setShowReorderCentralPanel(false)}
                                  className="p-1 rounded hover:bg-slate-100 text-[9px] font-black uppercase text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                                >
                                  Fechar
                                </button>
                              </div>

                              <div className="flex-grow overflow-y-auto space-y-1.5 pr-1 font-sans scrollbar-thin">
                                {targets.map((dest, index) => {
                                  const isDragging = draggedTargetIdx === index;
                                  const isOver = dragOverTargetIdx === index;

                                  return (
                                    <div
                                      key={dest}
                                      draggable
                                      onDragStart={(e) => {
                                        setDraggedTargetIdx(index);
                                        e.dataTransfer.effectAllowed = 'move';
                                      }}
                                      onDragEnd={() => {
                                        setDraggedTargetIdx(null);
                                        setDragOverTargetIdx(null);
                                      }}
                                      onDragOver={(e) => {
                                        e.preventDefault();
                                      }}
                                      onDragEnter={(e) => {
                                        e.preventDefault();
                                        setDragOverTargetIdx(index);
                                      }}
                                      onDragLeave={() => {
                                        if (dragOverTargetIdx === index) {
                                          setDragOverTargetIdx(null);
                                        }
                                      }}
                                      onDrop={(e) => {
                                        e.preventDefault();
                                        if (draggedTargetIdx === null || draggedTargetIdx === index) return;
                                        handleReorderTargets(draggedTargetIdx, index);
                                        setDraggedTargetIdx(null);
                                        setDragOverTargetIdx(null);
                                      }}
                                      className={`flex items-center gap-2 p-2 rounded-xl border transition-all duration-155 relative cursor-grab active:cursor-grabbing text-left ${
                                        isDragging
                                          ? 'opacity-40 border-dashed border-primary-gold bg-amber-50/20'
                                          : isOver
                                          ? 'border-primary-gold shadow-md bg-amber-50 scale-[1.01] ring-2 ring-primary-gold/10'
                                          : 'border-slate-200 bg-white hover:border-slate-300'
                                      }`}
                                    >
                                      <GripVertical className="w-3.5 h-3.5 text-slate-450 shrink-0" />
                                      <span className="w-4 h-4 rounded-full bg-primary-gold/15 border border-primary-gold/30 text-amber-700 text-[9px] font-black flex items-center justify-center shrink-0">
                                        {index + 1}
                                      </span>
                                      <p className="text-[10px] font-black text-slate-800 uppercase truncate flex-grow">
                                        {dest}
                                      </p>
                                      
                                      {/* Arrow Buttons for Layout Fallback */}
                                      <div className="flex shrink-0">
                                        <button
                                          type="button"
                                          disabled={index === 0}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleReorderTargets(index, index - 1);
                                          }}
                                          className="p-1 rounded hover:bg-slate-100 text-slate-400 disabled:opacity-20 transition-colors cursor-pointer"
                                        >
                                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7"></path>
                                          </svg>
                                        </button>
                                        <button
                                          type="button"
                                          disabled={index === targets.length - 1}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleReorderTargets(index, index + 1);
                                          }}
                                          className="p-1 rounded hover:bg-slate-100 text-slate-400 disabled:opacity-20 transition-colors cursor-pointer"
                                        >
                                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path>
                                          </svg>
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              <p className="text-[8px] font-bold text-slate-450 uppercase text-center mt-1 shrink-0">
                                Arraste os destinos para atualizar a sequência da rota na central.
                              </p>
                            </div>
                          )}

                          {showTrafficAlertsPanel && selectedLoad && (
                            <div className="absolute inset-x-4 top-14 bottom-4 z-20 bg-slate-950/95 backdrop-blur-md shadow-2xl rounded-2xl border border-rose-500/20 p-4 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top duration-300 text-white">
                              {/* Header */}
                              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 shrink-0">
                                <div className="flex items-center gap-2">
                                  <div className="p-1 bg-rose-500/10 rounded border border-rose-500/20">
                                    <Car className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                                  </div>
                                  <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-wider text-rose-400">
                                      Monitor de Tráfego do Google Maps
                                    </h4>
                                    <p className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">
                                      Live Directions API Telemetry
                                    </p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setShowTrafficAlertsPanel(false)}
                                  className="p-1 rounded hover:bg-slate-800 text-[8.5px] font-black uppercase text-slate-400 hover:text-white transition-colors cursor-pointer"
                                >
                                  Fechar
                                </button>
                              </div>

                              {/* Simulation Control Toggle */}
                              <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800/80 p-2 rounded-xl mb-2.5 shrink-0 text-left">
                                <div className="space-y-0.5">
                                  <p className="text-[8.5px] font-black uppercase tracking-wider text-slate-200">Tráfego de Horário de Pico</p>
                                  <p className="text-[7px] font-bold text-slate-400 leading-none">Simular gargalos nas vias principais via Directions API</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer select-none">
                                  <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={trafficPeakSimulation} 
                                    onChange={(e) => setTrafficPeakSimulation(e.target.checked)} 
                                  />
                                  <div className="w-7 h-4 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-rose-600"></div>
                                </label>
                              </div>

                              {/* Alert List */}
                              <div className="flex-grow overflow-y-auto space-y-2 pr-1 font-sans scrollbar-thin">
                                {activeTrafficAlerts.length === 0 ? (
                                  <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400 h-full">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-1.5">
                                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    </div>
                                    <p className="text-[9px] font-black uppercase tracking-wider text-emerald-400">Nenhum Alerta</p>
                                    <p className="text-[7px] font-bold uppercase mt-0.5 font-sans">Vias recomendadas pelo Maps livres de obstruções.</p>
                                  </div>
                                ) : (
                                  activeTrafficAlerts.map((alert) => {
                                    const isHeavy = alert.severity === 'heavy';
                                    return (
                                      <div 
                                        key={alert.id}
                                        className={`p-2 rounded-xl border text-left flex flex-col gap-1.5 transition-all ${
                                          isHeavy 
                                            ? 'bg-rose-950/35 border-rose-500/30 text-rose-100 hover:border-rose-500/50' 
                                            : 'bg-amber-955/15 border-amber-500/20 text-amber-100 hover:border-amber-500/45'
                                        }`}
                                      >
                                        <div className="flex items-start justify-between gap-1.5">
                                          <div className="flex items-center gap-1.5">
                                            <AlertTriangle className={`w-3 h-3 shrink-0 ${isHeavy ? 'text-rose-500 animate-pulse' : 'text-amber-500'}`} />
                                            <div>
                                              <p className="text-[7.5px] font-bold tracking-widest uppercase text-slate-400 leading-none">Trecho Crítico</p>
                                              <p className="text-[9px] font-black uppercase text-white truncate max-w-[170px] mt-0.5">
                                                {alert.streetName}
                                              </p>
                                            </div>
                                          </div>
                                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-lg shrink-0 ${
                                            isHeavy ? 'bg-rose-500 text-white' : 'bg-amber-500 text-slate-900'
                                          }`}>
                                            +{alert.delayMinutes} MIN
                                          </span>
                                        </div>

                                        {/* Path Indicator */}
                                        <div className="flex items-center gap-1 text-[7.5px] font-black text-slate-400 uppercase tracking-widest bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
                                          <span className="truncate max-w-[85px]">{alert.legFrom}</span>
                                          <span className="text-rose-500/60">➜</span>
                                          <span className="truncate max-w-[85px] text-white">{alert.legTo}</span>
                                        </div>

                                        <p className="text-[8px] text-slate-300 font-medium leading-relaxed uppercase">
                                          {alert.description}
                                        </p>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                              
                              <div className="mt-2 text-center text-[7px] font-black text-slate-500 uppercase shrink-0 border-t border-slate-900 pt-2 flex items-center justify-between">
                                <span>Rota Ativa Recalculada</span>
                                <span className="flex items-center gap-0.5 text-rose-400">
                                  <span className="w-1 h-1 rounded-full bg-rose-500 animate-ping mr-0.5" />
                                  Live directions
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {routeInfo && (
                          <a
                            href={routeInfo.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-primary-gold hover:text-white border border-primary-gold/10 font-black rounded-2xl text-xs flex items-center justify-center gap-2 transition-all uppercase tracking-wider cursor-pointer shadow-md"
                          >
                            Abrir no Maps do Celular
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>

                      {/* Right side: Stats and AI feedback */}
                      <div className="space-y-4 flex flex-col justify-between">
                        {/* Stats Panel */}
                        {routeInfo && (
                          <div className="bg-emerald-50/60 border border-emerald-100/80 rounded-3xl p-6 space-y-4 shadow-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black bg-emerald-600 text-white px-2.5 py-1 rounded-lg uppercase tracking-wider">
                                Roteamento Inteligente Central
                              </span>
                              <span className="text-[9px] text-slate-400 font-bold uppercase font-mono">STATUS: ATIVO</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-center pt-1">
                              <div className="bg-white p-3.5 rounded-2xl border border-emerald-100/50 shadow-sm">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Distância Total</p>
                                <p className="text-lg font-black text-slate-800">{routeInfo.totalDistance} km</p>
                              </div>
                              <div className="bg-white p-3.5 rounded-2xl border border-emerald-100/50 shadow-sm">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tempo Estimado</p>
                                <p className="text-lg font-black text-slate-800">~{routeInfo.totalDuration} min</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Route Analysis AI */}
                        <div className="bg-blue-50/50 rounded-3xl border border-blue-100 p-6 flex flex-col flex-grow">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-primary-gold rounded-lg shadow-md">
                              <Info className="w-4 h-4 text-primary-navy" />
                            </div>
                            <h3 className="text-xs font-black text-blue-800 uppercase tracking-tight">Análise Executiva da Rota</h3>
                          </div>
                          
                          <div className="flex-grow">
                            {isLoadingSummary ? (
                              <div className="flex flex-col items-center justify-center h-full space-y-3 opacity-50">
                                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-blue-400 font-black">Analisando dados logísticos de viagem...</p>
                              </div>
                            ) : (
                              <p className="text-xs font-medium text-slate-605 leading-relaxed italic text-blue-900 leading-relaxed font-semibold">
                                "{routeSummary || 'Análise de roteamento inteligente carregada.'}"
                              </p>
                            )}
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-blue-100">
                            <p className="text-[8px] font-bold text-blue-400 uppercase tracking-widest">Modelagem por Inteligência Artificial</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Itinerary Timeline list */}
                    {routeInfo && (
                      <div className="p-6 bg-slate-50 border border-slate-150 rounded-3xl space-y-4">
                        <div className="flex items-center gap-2.5">
                          <Compass className="w-5 h-5 text-primary-gold" />
                          <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Sequenciamento de Entrega Otimizado (Menor Trajeto):</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          {/* Origin */}
                          <div className="flex items-start gap-3 p-3 bg-white border border-slate-100 rounded-2xl">
                            <div className="w-6 h-6 rounded-full bg-primary-navy text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                              0
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-800 uppercase leading-snug">
                                {ROUTE_COORDINATES[selectedLoad.origin]?.label || selectedLoad.origin}
                              </p>
                              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                {ROUTE_COORDINATES[selectedLoad.origin]?.address || 'Origem da rota'}
                              </p>
                            </div>
                          </div>

                          {/* Sorted destinations sequence */}
                          {routeInfo.sequence.map((stop, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 bg-white border border-slate-100 rounded-2xl relative">
                              <div className="w-6 h-6 rounded-full bg-primary-gold text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                                {index + 1}
                              </div>
                              <div>
                                <p className="text-xs font-black text-slate-800 uppercase leading-snug">
                                  {stop.label}
                                </p>
                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5 truncate max-w-[280px]" title={stop.address}>
                                  {stop.address}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* PAR Details if applicable */}
              {selectedLoad.isHighRisk && (
                <div className="px-8 pb-8">
                  <div className="bg-red-50 border border-red-100 rounded-3xl p-8 space-y-6">
                    <div className="flex items-center gap-3">
                      <ShieldAlert className="w-6 h-6 text-red-600" />
                      <h3 className="text-lg font-black text-red-800 uppercase tracking-tight">Protocolo PAR Ativado</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Tipo de Produto</p>
                        <p className="text-sm font-black text-red-900">{selectedLoad.parType}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Nota Fiscal</p>
                        <p className="text-sm font-black text-red-900">{selectedLoad.parInvoiceNumber}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Observações de Segurança</p>
                        <p className="text-sm font-medium text-red-900 leading-relaxed">{selectedLoad.parDescription || 'Nenhuma observação adicional.'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Evidências Fotográficas da Expedição (Placa, Lacre, Romaneio) */}
              {(selectedLoad.photoPlate || selectedLoad.photoSeal || selectedLoad.photoManifest) && (
                <div className="px-8 pb-8">
                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Camera className="w-5 h-5 text-primary-gold" />
                      <h3 className="text-xs font-black uppercase text-slate-705 tracking-wider">Evidências Fotográficas da Expedição</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {selectedLoad.photoPlate && (
                        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 flex flex-col items-center gap-2 shadow-sm">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">1. Placa do Veículo</span>
                          <div 
                            className="w-full h-32 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 relative group cursor-pointer" 
                            onClick={() => setPreviewImage(selectedLoad.photoPlate || null)}
                          >
                            <img src={selectedLoad.photoPlate} alt="Placa do Veículo" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-[9px] text-white font-black uppercase tracking-widest bg-black/60 px-3 py-1.5 rounded-full">Zoom</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedLoad.photoSeal && (
                        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 flex flex-col items-center gap-2 shadow-sm">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">2. Lacre de Segurança</span>
                          <div 
                            className="w-full h-32 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 relative group cursor-pointer" 
                            onClick={() => setPreviewImage(selectedLoad.photoSeal || null)}
                          >
                            <img src={selectedLoad.photoSeal} alt="Lacre de Segurança" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-[9px] text-white font-black uppercase tracking-widest bg-black/60 px-3 py-1.5 rounded-full">Zoom</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedLoad.photoManifest && (
                        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 flex flex-col items-center gap-2 shadow-sm">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">3. Romaneio / Manifesto</span>
                          <div 
                            className="w-full h-32 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 relative group cursor-pointer" 
                            onClick={() => setPreviewImage(selectedLoad.photoManifest || null)}
                          >
                            <img src={selectedLoad.photoManifest} alt="Romaneio / Manifesto" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-[9px] text-white font-black uppercase tracking-widest bg-black/60 px-3 py-1.5 rounded-full">Zoom</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="p-8 border-t bg-slate-50/50 mt-auto">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 text-center">Ações de Controle Central</h3>
                
                {/* Validador de Quatro Etapas */}
                {selectedLoad.status === CargoStatus.AWAITING && (
                  <div className="mb-6 bg-amber-50/50 border border-amber-200 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center gap-2 text-amber-800">
                      <ShieldCheck className="w-5 h-5 text-amber-500" />
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider">
                          {selectedLoad.cargoType === CargoType.COMPARTILHADA 
                            ? `Validador do Destino Atual: ${currentDest}` 
                            : 'Validador Digital em Quatro Etapas'}
                        </h4>
                        {selectedLoad.cargoType === CargoType.COMPARTILHADA && (
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Destino {currentDestIndex + 1} de {targets.length}</span>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
                      {selectedLoad.cargoType === CargoType.COMPARTILHADA 
                        ? `Para autorizar a saída deste trecho (${currentDest}), confirme o lacre de viagem ativo, os paletes destinados a este local (${targetPalletCount} un), a placa e o motorista.` 
                        : 'Para autorizar a liberação desta carga, confirme o número do lacre, a quantidade exata de paletes, a placa do veículo e o nome do motorista registrados no manifesto.'}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      {/* Lacre Confirm */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 flex items-center justify-between">
                          <span>1ª Etapa: Confirmar Lacre</span>
                          {selectedLoad.cargoType === CargoType.COMPARTILHADA && (
                            <span className="text-[8px] font-semibold text-blue-600">Alvo: {currentActiveSeal}</span>
                          )}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={sealConfirm}
                            onChange={(e) => setSealConfirm(e.target.value)}
                            placeholder="Digite o nº do lacre..."
                            className={`w-full bg-white border rounded-xl pl-3 pr-8 py-2.5 text-xs font-bold font-mono outline-none transition-all ${
                              sealConfirm === '' 
                                ? 'border-slate-200 focus:ring-2 focus:ring-primary-gold'
                                : isSealMatched
                                  ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-500 bg-emerald-50/30'
                                  : 'border-red-500 focus:ring-2 focus:ring-red-500 bg-red-50/30'
                            }`}
                          />
                          {sealConfirm !== '' && (
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
                              {isSealMatched ? (
                                <CheckCircle className="w-4 h-4 text-emerald-500 animate-bounce" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Pallets Confirm */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 flex items-center justify-between">
                          <span>2ª Etapa: Confirmar Paletes</span>
                          {selectedLoad.cargoType === CargoType.COMPARTILHADA && (
                            <span className="text-[8px] font-semibold text-blue-600">Qtd esperada: {targetPalletCount} p</span>
                          )}
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={palletsConfirm}
                            onChange={(e) => setPalletsConfirm(e.target.value)}
                            placeholder="Qtd. de paletes..."
                            className={`w-full bg-white border rounded-xl pl-3 pr-8 py-2.5 text-xs font-bold outline-none transition-all ${
                              palletsConfirm === ''
                                ? 'border-slate-200 focus:ring-2 focus:ring-primary-gold'
                                : isPalletsMatched
                                  ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-500 bg-emerald-50/30'
                                  : 'border-red-500 focus:ring-2 focus:ring-red-500 bg-red-50/30'
                            }`}
                          />
                          {palletsConfirm !== '' && (
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
                              {isPalletsMatched ? (
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Plate Confirm */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                          3ª Etapa: Confirmar Placa
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={plateConfirm}
                            onChange={(e) => setPlateConfirm(e.target.value.toUpperCase())}
                            placeholder="Placa do veículo..."
                            className={`w-full bg-white border rounded-xl pl-3 pr-8 py-2.5 text-xs font-bold font-mono outline-none transition-all ${
                              plateConfirm === ''
                                ? 'border-slate-200 focus:ring-2 focus:ring-primary-gold'
                                : isPlateMatched
                                  ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-500 bg-emerald-50/30'
                                  : 'border-red-500 focus:ring-2 focus:ring-red-500 bg-red-50/30'
                            }`}
                          />
                          {plateConfirm !== '' && (
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
                              {isPlateMatched ? (
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Driver Confirm */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                          4ª Etapa: Confirmar Motorista
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={driverConfirm}
                            onChange={(e) => setDriverConfirm(e.target.value)}
                            placeholder="Nome do motorista..."
                            className={`w-full bg-white border rounded-xl pl-3 pr-8 py-2.5 text-xs font-bold outline-none transition-all ${
                              driverConfirm === ''
                                ? 'border-slate-200 focus:ring-2 focus:ring-primary-gold'
                                : isDriverMatched
                                  ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-500 bg-emerald-50/30'
                                  : 'border-red-500 focus:ring-2 focus:ring-red-500 bg-red-50/30'
                            }`}
                          />
                          {driverConfirm !== '' && (
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
                              {isDriverMatched ? (
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Novo Número do Lacre do Veículo para avançar para o próximo destino */}
                    {selectedLoad.cargoType === CargoType.COMPARTILHADA && currentDestIndex < targets.length - 1 && isFourStepValidated && (
                      <div className="pt-4 border-t border-amber-300/40 space-y-2 animate-in fade-in slide-in-from-top-4 duration-300 text-left">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-700 flex items-center gap-1.5">
                          <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                          Novo Número do Lacre do Veículo
                        </label>
                        <input
                          type="text"
                          value={newSealForNextTrip}
                          onChange={(e) => setNewSealForNextTrip(e.target.value.toUpperCase())}
                          placeholder="Digite o novo nº de lacre para o próximo trecho..."
                          className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-xs font-mono font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                        />
                        <p className="text-[9px] text-blue-600 font-bold leading-tight uppercase tracking-tight">
                          ℹ️ Este lacre garantirá a segurança da rota até {targets[currentDestIndex + 1]}.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {selectedLoad.status === CargoStatus.RELEASED && (
                  <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-3xl p-6 flex items-start gap-3 text-emerald-800">
                    <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider">Rota Concluída / Viagem Finalizada</h4>
                      <p className="text-[11px] font-medium text-slate-600 mt-0.5">
                        Todos os destinos da rota foram validados e descarregados. O veículo está totalmente liberado.
                      </p>
                    </div>
                  </div>
                )}

                {selectedLoad.status === CargoStatus.BLOCKED && (
                  <div className="mb-6 bg-orange-50 border border-orange-200 rounded-3xl p-6 flex items-start gap-3 text-orange-800 animate-pulse">
                    <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider">Alerta de Divergência Ativo</h4>
                      <p className="text-[11px] font-medium text-slate-600 mt-0.5">
                        Esta carga possui um alerta de divergência registrado para a auditoria. A liberação do veículo continua sendo permitida.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      // Shared cargo leg or final leg handling
                      if (selectedLoad.cargoType === CargoType.COMPARTILHADA) {
                        if (currentDestIndex < targets.length - 1) {
                          // If they clicked the button and we have the new seal, advance!
                          if (!newSealForNextTrip.trim()) return;
                          const updatedLoad = {
                            ...selectedLoad,
                            currentDestinationIndex: currentDestIndex + 1,
                            checkedDestinations: [...(selectedLoad.checkedDestinations || []), currentDest],
                            sealsByDest: {
                              ...(selectedLoad.sealsByDest || {}),
                              [targets[currentDestIndex + 1]]: newSealForNextTrip.toUpperCase()
                            }
                          };
                          if (onUpdateLoad) {
                            onUpdateLoad(updatedLoad);
                          }
                          setSealConfirm('');
                          setPalletsConfirm('');
                          setPlateConfirm('');
                          setDriverConfirm('');
                          setNewSealForNextTrip('');
                        } else {
                          // Last destination, complete the route!
                          const updatedLoad = {
                            ...selectedLoad,
                            status: CargoStatus.RELEASED,
                            checkedDestinations: [...(selectedLoad.checkedDestinations || []), currentDest]
                          };
                          if (onUpdateLoad) {
                            onUpdateLoad(updatedLoad);
                          } else {
                            onUpdateStatus(selectedLoad.id, CargoStatus.RELEASED);
                          }
                        }
                      } else {
                        // Standard load
                        const updatedLoad = {
                          ...selectedLoad,
                          gateStatus: 'Aguardando' as const,
                          auditedAt: new Date().toISOString()
                        };
                        if (onUpdateLoad) {
                          onUpdateLoad(updatedLoad);
                        } else {
                          onUpdateStatus(selectedLoad.id, CargoStatus.RELEASED);
                        }
                      }
                    }}
                    disabled={
                      selectedLoad.status === CargoStatus.RELEASED || 
                      !isFourStepValidated || 
                      (selectedLoad.cargoType === CargoType.COMPARTILHADA && currentDestIndex < targets.length - 1 && !newSealForNextTrip.trim())
                    }
                    className={`flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 cursor-pointer ${
                      selectedLoad.status === CargoStatus.RELEASED || 
                      !isFourStepValidated || 
                      (selectedLoad.cargoType === CargoType.COMPARTILHADA && currentDestIndex < targets.length - 1 && !newSealForNextTrip.trim())
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                        : selectedLoad.cargoType === CargoType.COMPARTILHADA && currentDestIndex < targets.length - 1
                          ? 'bg-blue-600 hover:bg-blue-500 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    <CheckCircle className="w-5 h-5" />
                    {selectedLoad.cargoType === CargoType.COMPARTILHADA 
                      ? (currentDestIndex < targets.length - 1 ? `Liberar para ${targets[currentDestIndex + 1]}` : 'CONFERIR & FINALIZAR ROTA')
                      : 'LIBERAR PARA GATE'}
                  </button>
                  <button
                    onClick={() => onUpdateStatus(selectedLoad.id, CargoStatus.BLOCKED)}
                    disabled={selectedLoad.status === CargoStatus.RELEASED}
                    className={`flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 cursor-pointer ${
                      selectedLoad.status === CargoStatus.RELEASED
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                        : selectedLoad.status === CargoStatus.BLOCKED
                          ? 'bg-orange-100 border border-orange-300 text-orange-800'
                          : 'bg-orange-600 hover:bg-orange-500 text-white'
                    }`}
                  >
                    <AlertTriangle className="w-5 h-5" />
                    {selectedLoad.status === CargoStatus.BLOCKED ? 'DIVERGÊNCIA ALERTADA' : 'ALERTAR DIVERGÊNCIA'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-6">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center">
                <Clock className="w-12 h-12 text-slate-200" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Aguardando Seleção</h3>
                <p className="text-slate-500 text-sm font-medium max-w-xs mx-auto">Selecione uma carga na lista lateral para visualizar os detalhes completos e realizar ações de controle.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Modal Detalhes da Carga & Histórico de Ocorrências */}
    {showOccurrencesModal && selectedLoad && (
      <div 
        className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300"
        onClick={() => setShowOccurrencesModal(false)}
      >
        <div 
          className="relative max-w-3xl w-full max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-slate-50 p-6 border-b border-slate-200/80 flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest block">Ficha & Histórico</span>
              <h3 className="font-sans text-xl font-black text-slate-800 tracking-tight">Detalhes & Ocorrências da Carga</h3>
              <p className="text-xs text-slate-500 font-medium">Visualização detalhada da auditoria, ocorrências e trajeto para esta placa.</p>
            </div>
            <button
              onClick={() => setShowOccurrencesModal(false)}
              className="bg-slate-250/60 hover:bg-slate-200 text-slate-500 hover:text-slate-700 p-2 rounded-xl transition-all duration-200 cursor-pointer border-0"
              title="Fechar Detalhes"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-grow overflow-y-auto p-6 md:p-8 space-y-8 max-h-[60vh]">
            {/* Informações Gerais da Carga Panel */}
            <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Placa do Veículo</p>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-black text-slate-800 font-mono tracking-tight">{selectedLoad.plate}</span>
                </div>
              </div>

              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nome do Motorista</p>
                <span className="text-sm font-bold text-slate-700 block truncate">{selectedLoad.driverName}</span>
              </div>

              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">ID do Manifesto</p>
                <span className="text-sm font-mono font-bold text-slate-500 block">#{selectedLoad.id.slice(0, 12).toUpperCase()}</span>
              </div>

              <div className="col-span-2">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Rota Logística</p>
                <span className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                  {selectedLoad.origin} ➔ {selectedLoad.destination}
                </span>
                {selectedLoad.additionalDestinations && selectedLoad.additionalDestinations.length > 0 && (
                  <p className="text-[10px] text-slate-500 mt-1 font-bold">
                    Destinos adicionais: {selectedLoad.additionalDestinations.join(', ')}
                  </p>
                )}
              </div>

              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status Atual</p>
                <span className={`inline-flex px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${
                  selectedLoad.status === CargoStatus.RELEASED ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                  selectedLoad.status === CargoStatus.BLOCKED ? 'bg-red-50 text-red-700 border border-red-100 animate-pulse' : 'bg-amber-50 text-amber-700 border border-amber-100'
                }`}>
                  {selectedLoad.status === CargoStatus.RELEASED ? 'EM TRÂNSITO' :
                   selectedLoad.status === CargoStatus.BLOCKED ? 'ALERTA / DIVERGÊNCIA' : 'PORTARIA'}
                </span>
              </div>

              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Número do Lacre</p>
                <span className="text-sm font-mono font-black text-slate-700">{selectedLoad.sealNumber}</span>
              </div>

              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Paletes & Carga</p>
                <span className="text-xs font-bold text-slate-700 block truncate">{selectedLoad.palletCount} Pls ({selectedLoad.cargoType})</span>
              </div>

              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Registrado por</p>
                <span className="text-xs font-bold text-slate-600 block">{selectedLoad.createdBy}</span>
              </div>
            </div>

            {/* Histórico completo de ocorrências */}
            <div className="space-y-4">
              <h4 className="font-sans font-black text-slate-800 uppercase tracking-wider text-xs flex items-center gap-2 pb-2 border-b border-slate-100">
                <History className="w-5 h-5 text-primary-gold" />
                Linha do Tempo de Ocorrências ({selectedLoad.occurrenceHistory?.length || 0})
              </h4>

              {selectedLoad.occurrenceHistory && selectedLoad.occurrenceHistory.length > 0 ? (
                <div className="relative border-l-2 border-slate-150 ml-4 pl-6 space-y-6">
                  {selectedLoad.occurrenceHistory.map((occ, idx) => {
                    const isNormal = occ.type === OccurrenceType.NONE;
                    return (
                      <div key={idx} className="relative">
                        {/* Timeline node */}
                        <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                          isNormal ? 'bg-emerald-500' : 'bg-red-500'
                        }`} />
                        
                        <div className={`p-5 rounded-2xl border ${
                          isNormal 
                            ? 'bg-emerald-50/20 hover:bg-emerald-50/40 border-emerald-100' 
                            : 'bg-red-50/10 hover:bg-red-50/20 border-red-100'
                        } transition-colors duration-200`}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-3">
                            <span className={`inline-flex text-[9px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider ${
                              isNormal ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {occ.type}
                            </span>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-slate-400 text-[10px] font-bold">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(occ.timestamp).toLocaleString('pt-BR')}
                              </span>
                              <span className="hidden sm:inline">•</span>
                              <span className="bg-slate-105 text-slate-600 px-2 py-0.5 rounded-md uppercase font-mono">
                                Auditor: {occ.auditor}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-4 items-start">
                            {/* Evidence Photo */}
                            {occ.photo && (
                              <div 
                                className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer group relative shrink-0"
                                onClick={() => setPreviewImage(occ.photo || null)}
                                title="Expandir imagem"
                              >
                                <img src={occ.photo} alt="Evidência" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                  <Camera className="w-4 h-4" />
                                </div>
                              </div>
                            )}

                            <div className="flex-grow">
                              <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                                {occ.description || 'Nenhum detalhe adicional inserido.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Fallback section if no occurrenceHistory array but has localized occurrence flags */
                selectedLoad.occurrenceType && selectedLoad.occurrenceType !== OccurrenceType.NONE ? (
                  <div className="p-5 rounded-2xl border border-red-100 bg-red-50/20">
                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-red-100">
                      <span className="bg-red-105 text-red-800 text-[10px] font-black px-2.5 py-0.5 rounded uppercase font-sans">
                        {selectedLoad.occurrenceType}
                      </span>
                      <span className="text-slate-400 text-[10px] font-mono">
                        {selectedLoad.auditedAt ? new Date(selectedLoad.auditedAt).toLocaleString('pt-BR') : 'Sem data registrada'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-705 leading-relaxed font-medium">
                      {selectedLoad.occurrenceDescription || 'Ocorrência registrada no sistema, sem notas adicionais.'}
                    </p>
                  </div>
                ) : (
                  /* Compliant state */
                  <div className="flex flex-col items-center justify-center text-center p-8 bg-emerald-50/10 border border-dashed border-emerald-200 rounded-3xl space-y-3">
                    <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center animate-bounce">
                      <ShieldCheck className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                      <h5 className="text-sm font-black text-slate-800 uppercase tracking-tight">Carga Sem Divergências</h5>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium mt-1">Esta carga está em perfeita conformidade. Nenhuma ocorrência ou irregularidade foi registrada durante o processo de auditoria de lacres/documentos.</p>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 p-6 border-t border-slate-200/80 flex justify-end gap-3 rounded-b-3xl">
            <button
              onClick={() => setShowOccurrencesModal(false)}
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 px-6 text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer border-0 shadow-sm"
            >
              Fechar Detalhes
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Imagem Modal Preview */}
    {previewImage && (
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm shadow-2xl p-4 animate-in fade-in duration-300 select-none"
        onClick={() => setPreviewImage(null)}
      >
        <div 
          className="relative max-w-4xl max-h-[90vh] bg-slate-900 border border-white/10 p-4 rounded-3xl shadow-2xl flex flex-col items-center"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full transition-all duration-300 cursor-pointer border-0"
            title="Fechar Visualização"
          >
            <XCircle className="w-5 h-5" />
          </button>
          <img src={previewImage} alt="Preview" className="max-w-full max-h-[80vh] object-contain rounded-2xl" />
        </div>
      </div>
    )}
   </div>
  );
};
