import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, 
  ShieldCheck, 
  AlertCircle, 
  Camera, 
  Check, 
  Clock, 
  Trash2, 
  Pencil, 
  MapPin, 
  Save, 
  X, 
  Truck, 
  Calendar, 
  ArrowRight, 
  ClipboardCheck, 
  Info 
} from 'lucide-react';
import { CargoLoad, CargoStatus, User, EventLog, getPhotosArray, CargoType } from '../types';
import { compressImage } from '../utils/imageCompressor';
import { ImageEnhanceZoom } from '../components/ImageEnhanceZoom';

interface PortariaViewProps {
  loads: CargoLoad[];
  onUpdateLoad: (load: CargoLoad) => Promise<void>;
  onDeleteLoad?: (id: string) => Promise<void>;
  logs?: EventLog[];
  loggedInUser: User | null;
}

export const PortariaView: React.FC<PortariaViewProps> = ({ 
  loads = [], 
  onUpdateLoad, 
  onDeleteLoad,
  logs,
  loggedInUser 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLoadId, setSelectedLoadId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Validation Form states
  const [gatePhotoPlate, setGatePhotoPlate] = useState<string[]>([]);
  const [zoomPhoto, setZoomPhoto] = useState<string | null>(null);
  const [gatePhotoSeal, setGatePhotoSeal] = useState<string[]>([]);
  const [gatePhotoManifest, setGatePhotoManifest] = useState<string[]>([]);
  const [gateObservation, setGateObservation] = useState('');
  const [gateStatus, setGateStatus] = useState<'Aguardando' | 'Aprovado' | 'Divergente'>('Aguardando');
  
  // Checklist items
  const [chkPlate, setChkPlate] = useState(false);
  const [chkSeal, setChkSeal] = useState(false);
  const [chkRomaneio, setChkRomaneio] = useState(false);

  // Main Loads Edits states (for "incluir ou alterar as informações")
  const [isEditingMainData, setIsEditingMainData] = useState(false);
  const [editPlate, setEditPlate] = useState('');
  const [editDriverName, setEditDriverName] = useState('');
  const [editSealNumber, setEditSealNumber] = useState('');
  const [editDestination, setEditDestination] = useState('');
  const [editPalletCount, setEditPalletCount] = useState(0);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Date Filters
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'LAST_7_DAYS' | 'CUSTOM'>('ALL');
  const [customDate, setCustomDate] = useState('');

  // Modal Open State (Overlay)
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Refs for camera uploads
  const refPlateInput = useRef<HTMLInputElement>(null);
  const refSealInput = useRef<HTMLInputElement>(null);
  const refManifestInput = useRef<HTMLInputElement>(null);

  const filteredForPortaria = useMemo(() => {
    return loads;
  }, [loads]);

  // Computed active load
  const selectedLoad = useMemo(() => {
    return filteredForPortaria.find(l => l.id === selectedLoadId) || null;
  }, [filteredForPortaria, selectedLoadId]);

  // Compute Overall Stats for the Portaria Dashboard
  const stats = useMemo(() => {
    const total = filteredForPortaria.length;
    const pending = filteredForPortaria.filter(l => !l.gateVerified).length;
    const approved = filteredForPortaria.filter(l => l.gateStatus === 'Aprovado').length;
    const divergent = filteredForPortaria.filter(l => l.gateStatus === 'Divergente').length;
    return { total, pending, approved, divergent };
  }, [filteredForPortaria]);

  // Filter loads by search and DATE, giving priority to the most recent elements (descending sort order)
  const filteredLoads = useMemo(() => {
    let result = [...filteredForPortaria];

    const toLocalYMD = (dateString: string) => {
      if (!dateString) return '';
      try {
        const dst = new Date(dateString);
        if (isNaN(dst.getTime())) return '';
        const year = dst.getFullYear();
        const month = String(dst.getMonth() + 1).padStart(2, '0');
        const day = String(dst.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      } catch {
        return '';
      }
    };

    // 1. Filter by selected date range
    const d = new Date();
    const localTodayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    if (dateFilter === 'TODAY') {
      result = result.filter(load => 
        !load.gateVerified ||
        load.status === CargoStatus.AWAITING ||
        toLocalYMD(load.createdAt) === localTodayStr || 
        (load.gateVerifiedAt && toLocalYMD(load.gateVerifiedAt) === localTodayStr)
      );
    } else if (dateFilter === 'LAST_7_DAYS') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      result = result.filter(load => 
        !load.gateVerified ||
        load.status === CargoStatus.AWAITING ||
        new Date(load.createdAt) >= sevenDaysAgo
      );
    } else if (dateFilter === 'CUSTOM' && customDate) {
      result = result.filter(load => 
        !load.gateVerified ||
        load.status === CargoStatus.AWAITING ||
        toLocalYMD(load.createdAt) === customDate || 
        (load.gateVerifiedAt && toLocalYMD(load.gateVerifiedAt) === customDate)
      );
    }

    // 2. Search query filter (plate, driver name, destination, seal number)
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      result = result.filter(load => 
        (load.plate || '').toLowerCase().includes(q) ||
        (load.driverName || '').toLowerCase().includes(q) ||
        (load.destination || '').toLowerCase().includes(q) ||
        (load.sealNumber && load.sealNumber.toLowerCase().includes(q))
      );
    }

    // 3. Sort by most recent first (dará prioridade para os lançamentos mais recentes)
    result.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [loads, searchQuery, dateFilter, customDate]);

  // Handle selecting a load and triggering the popup modal
  const handleSelectLoad = (load: CargoLoad) => {
    setSelectedLoadId(load.id);
    setGatePhotoPlate(getPhotosArray(load.gatePhotoPlate));
    setGatePhotoSeal(getPhotosArray(load.gatePhotoSeal));
    setGatePhotoManifest(getPhotosArray(load.gatePhotoManifest));
    setGateObservation(load.gateObservation || '');
    setGateStatus(load.gateStatus || 'Aguardando');
    setChkPlate(!!load.gateVerified);
    setChkSeal(!!load.gateVerified);
    setChkRomaneio(!!load.gateVerified);

    // Initialize edit fields
    setEditPlate(load.plate);
    setEditDriverName(load.driverName);
    setEditSealNumber(load.sealNumber || '');
    setEditDestination(load.destination);
    setEditPalletCount(load.palletCount || 0);
    setIsEditingMainData(false);
    setNotification(null);
    setShowDeleteConfirm(false);
    setIsModalOpen(true); // Abre modal sobreposto
  };

  const handleDeleteConfirmClick = async () => {
    if (!selectedLoad || !onDeleteLoad) return;
    try {
      await onDeleteLoad(selectedLoad.id);
      setNotification({
        type: 'success',
        message: `Carga de placa ${selectedLoad.plate} excluída com sucesso!`
      });
      setShowDeleteConfirm(false);
      
      setTimeout(() => {
        setIsModalOpen(false);
        setSelectedLoadId(null);
        setNotification(null);
      }, 1500);
    } catch (err) {
      setNotification({
        type: 'error',
        message: 'Erro ao excluir a carga do sistema.'
      });
    }
  };

  // Synchronize checklist items with gateStatus
  const handleToggleCheck = (type: 'plate' | 'seal' | 'romaneio', val: boolean) => {
    let p = chkPlate;
    let s = chkSeal;
    let r = chkRomaneio;
    if (type === 'plate') {
      p = val;
      setChkPlate(val);
    } else if (type === 'seal') {
      s = val;
      setChkSeal(val);
    } else {
      r = val;
      setChkRomaneio(val);
    }

    if (p && s && r) {
      setGateStatus('Aprovado');
    } else {
      setGateStatus('Divergente');
    }
  };

  const handleGateStatusChange = (val: 'Aguardando' | 'Aprovado' | 'Divergente') => {
    setGateStatus(val);
    if (val === 'Aprovado') {
      setChkPlate(true);
      setChkSeal(true);
      setChkRomaneio(true);
    } else if (val === 'Divergente') {
      if (chkPlate && chkSeal && chkRomaneio) {
        setChkSeal(false);
      }
    }
  };

  // Convert uploaded image file to Base64 to enable direct localStorage / FireStore saves
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'plate' | 'seal' | 'manifest') => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const getTargetPhotoState = () => {
        if (target === 'plate') return gatePhotoPlate;
        if (target === 'seal') return gatePhotoSeal;
        return gatePhotoManifest;
      };
      
      const setTargetPhotoState = (newPhotos: string[] | ((prev: string[]) => string[])) => {
        if (target === 'plate') setGatePhotoPlate(newPhotos);
        else if (target === 'seal') setGatePhotoSeal(newPhotos);
        else setGatePhotoManifest(newPhotos);
      };

      const currentPhotos = getTargetPhotoState();
      const remainingSlots = 10 - currentPhotos.length;
      const filesToProcess = Array.from(files).slice(0, remainingSlots) as File[];

      filesToProcess.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const rawBase64 = reader.result as string;
          const compressed = await compressImage(rawBase64);
          setTargetPhotoState(prev => {
            if (prev.length >= 10) return prev;
            return [...prev, compressed];
          });
        };
        reader.readAsDataURL(file);
      });
      e.target.value = '';
    }
  };

  const handleRemoveGatePhoto = (target: 'plate' | 'seal' | 'manifest', idxToRemove: number) => {
    if (target === 'plate') {
      setGatePhotoPlate(prev => prev.filter((_, idx) => idx !== idxToRemove));
    } else if (target === 'seal') {
      setGatePhotoSeal(prev => prev.filter((_, idx) => idx !== idxToRemove));
    } else {
      setGatePhotoManifest(prev => prev.filter((_, idx) => idx !== idxToRemove));
    }
  };

  // Save physical confirmation check to global load objects
  const handleSavePortariaValidation = async () => {
    if (!selectedLoad) return;

    const valDate = new Date().toISOString();
    const valBy = loggedInUser?.fullName || loggedInUser?.username || 'Portaria G7';

    const updated: CargoLoad = {
      ...selectedLoad,
      gateVerified: true,
      gateVerifiedAt: valDate,
      gateVerifiedBy: valBy,
      gatePhotoPlate: gatePhotoPlate.length > 0 ? gatePhotoPlate : undefined,
      gatePhotoSeal: gatePhotoSeal.length > 0 ? gatePhotoSeal : undefined,
      gatePhotoManifest: gatePhotoManifest.length > 0 ? gatePhotoManifest : undefined,
      gateObservation: gateObservation.trim(),
      gateStatus: 'Aprovado',
      status: CargoStatus.RELEASED, // Set immediately to EM TRÂNSITO to start trip
      gateCheckedIn: true,
      needsCentralCheckout: true,
      tripFinished: false
    };

    try {
      await onUpdateLoad(updated);
      setNotification({
        type: 'success',
        message: 'Check-in de Portaria realizado com sucesso! Veículo em trânsito e viagem iniciada.'
      });
      
      // Auto close overlay modal window after brief success display
      setTimeout(() => {
        setIsModalOpen(false);
        setSelectedLoadId(null);
        setNotification(null);
      }, 1505);
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: 'Falha ao processar lançamento na portaria. Por favor, tente novamente.'
      });
    }
  };

  // Save manual modifications directly inside the validation popup
  const handleSaveMainDataEdits = async () => {
    if (!selectedLoad) return;

    if (!editPlate.trim() || !editDriverName.trim()) {
      setNotification({
        type: 'error',
        message: 'Os campos Placa e Motorista são obrigatórios na edição.'
      });
      return;
    }

    const updatedLoad: CargoLoad = {
      ...selectedLoad,
      plate: editPlate.trim().toUpperCase(),
      driverName: editDriverName.trim(),
      sealNumber: editSealNumber.trim().toUpperCase(),
      destination: editDestination.trim(),
      palletCount: Number(editPalletCount)
    };

    try {
      await onUpdateLoad(updatedLoad);
      setNotification({
        type: 'success',
        message: 'Informações de viagem atualizadas com sucesso!'
      });
      setIsEditingMainData(false);
    } catch (err) {
      setNotification({
        type: 'error',
        message: 'Erro ao gravar alterações nos dados da carga.'
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-500 text-slate-800" id="portaria-container">
      
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-primary-navy p-8 rounded-3xl text-white shadow-md relative overflow-hidden" id="portaria-banner">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 hidden lg:block transform translate-x-12">
          <Truck className="w-96 h-96 -rotate-12" />
        </div>
        <div className="relative z-10 space-y-1 text-left">
          <div className="flex items-center gap-2">
            <span className="bg-primary-gold/25 text-primary-gold border border-primary-gold/40 text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full">
              Posto Avançado
            </span>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Setor de Portaria</h1>
          <p className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
            Validação fotográfica de saída de cargas, conferência de lacres e romaneio de paletes
          </p>
        </div>
        <div className="flex gap-4 items-center shrink-0 relative z-10 bg-slate-900/35 border border-white/10 px-4 py-3 rounded-2xl">
          <ClipboardCheck className="w-10 h-10 text-primary-gold" />
          <div className="text-left font-sans">
            <span className="block text-[8px] text-slate-400 font-extrabold uppercase tracking-widest">Sessão Ativa</span>
            <span className="block text-xs font-black text-white uppercase">{loggedInUser?.fullName || loggedInUser?.username || 'Portaria'}</span>
            <span className="block text-[8px] text-primary-gold font-extrabold uppercase tracking-widest">Permissão de Acesso G7</span>
          </div>
        </div>
      </div>

      {/* Statistics Counters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="portaria-kpis">
        <div className="bg-white border border-slate-205 rounded-2xl p-5 shadow-sm text-left flex items-center justify-between">
          <div>
            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Expedido</span>
            <span className="text-2xl font-black text-primary-navy mt-0.5 block">{stats.total}</span>
          </div>
          <div className="p-3 bg-slate-50 text-slate-500 rounded-xl">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-205 rounded-2xl p-5 shadow-sm text-left flex items-center justify-between">
          <div>
            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Aguardando Validação</span>
            <span className="text-2xl font-black text-amber-500 mt-0.5 block">{stats.pending}</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        <div className="bg-white border border-slate-205 rounded-2xl p-5 shadow-sm text-left flex items-center justify-between">
          <div>
            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Liberadas em Trânsito</span>
            <span className="text-2xl font-black text-emerald-600 mt-0.5 block">{stats.approved}</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-205 rounded-2xl p-5 shadow-sm text-left flex items-center justify-between">
          <div>
            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Cargas com Divergência</span>
            <span className="text-2xl font-black text-rose-600 mt-0.5 block">{stats.divergent}</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-500 rounded-xl">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control Panel: Intelligent Search & High Priority Date Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 md:space-y-0 flex flex-col md:flex-row gap-5 items-center justify-between" id="portaria-filters">
        
        {/* Real-time Filter Search */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-[12px] w-4 h-4 text-slate-400" />
          <input
            type="text"
            id="searchInputField"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-9 py-2.5 text-xs text-primary-navy font-bold focus:ring-2 focus:ring-primary-gold outline-none transition-all placeholder:text-slate-400"
            placeholder="PESQUISAR POR PLACA, MOTORISTA OU LACRE..."
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-[9px] p-1.5 text-xs text-slate-450 hover:text-slate-650 font-black border-0 bg-transparent cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Dynamic Date Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mr-1">Filtrar Cargas:</span>
          
          <button
            type="button"
            id="filterAllBtn"
            onClick={() => setDateFilter('ALL')}
            className={`px-3 py-2 text-[10px] font-black uppercase rounded-xl border tracking-wider transition-all cursor-pointer ${
              dateFilter === 'ALL' 
                ? 'bg-primary-navy text-white border-primary-navy shadow-sm' 
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            Todos
          </button>
          
          <button
            type="button"
            id="filterTodayBtn"
            onClick={() => setDateFilter('TODAY')}
            className={`px-3 py-2 text-[10px] font-black uppercase rounded-xl border tracking-wider transition-all cursor-pointer ${
              dateFilter === 'TODAY' 
                ? 'bg-primary-navy text-white border-primary-navy shadow-sm' 
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            Hoje
          </button>

          <button
            type="button"
            id="filterWeekBtn"
            onClick={() => setDateFilter('LAST_7_DAYS')}
            className={`px-3 py-2 text-[10px] font-black uppercase rounded-xl border tracking-wider transition-all cursor-pointer ${
              dateFilter === 'LAST_7_DAYS' 
                ? 'bg-primary-navy text-white border-primary-navy shadow-sm' 
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            Últimos 7 Dias
          </button>

          <button
            type="button"
            id="filterCustomBtn"
            onClick={() => setDateFilter('CUSTOM')}
            className={`px-3 py-2 text-[10px] font-black uppercase rounded-xl border tracking-wider transition-all cursor-pointer ${
              dateFilter === 'CUSTOM' 
                ? 'bg-primary-navy text-white border-primary-navy shadow-sm' 
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            Por Dia
          </button>

          {dateFilter === 'CUSTOM' && (
            <input
              type="date"
              id="datePickerInput"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-black text-primary-navy outline-none focus:ring-1 focus:ring-primary-gold"
            />
          )}
        </div>
      </div>

      {/* Grid of Expedition Cards */}
      {filteredLoads.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center flex flex-col items-center justify-center space-y-4 shadow-sm" id="emptyStateCargas">
          <div className="p-4 bg-slate-50 text-slate-305 rounded-full">
            <Truck className="w-12 h-12 text-slate-300" />
          </div>
          <h3 className="text-base font-black uppercase text-primary-navy tracking-tight">Cargas Não Identificadas</h3>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider max-w-sm ml-auto mr-auto">
            Nenhuma expedição atende aos parâmetros aplicados na busca ou período.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="cargasGrid">
          {filteredLoads.map((load) => {
            let statusBg = 'bg-amber-50 text-amber-800 border-amber-200/60';
            if (load.status === CargoStatus.RELEASED) {
              statusBg = 'bg-emerald-50 text-emerald-800 border-emerald-200/60';
            } else if (load.status === CargoStatus.BLOCKED) {
              statusBg = 'bg-rose-50 text-rose-750 border-rose-200/60';
            }

            let portariaStatusLabel = 'Aguardando Validação';
            let portariaColor = 'bg-slate-50 text-slate-600 border-slate-200';
            if (load.gateStatus === 'Aprovado') {
              portariaStatusLabel = 'Portaria Aprovada';
              portariaColor = 'bg-emerald-50 text-emerald-700 border-emerald-250/50';
            } else if (load.gateStatus === 'Divergente') {
              portariaStatusLabel = 'Divergência Portaria';
              portariaColor = 'bg-rose-50 text-rose-700 border-rose-250/50 animate-pulse';
            }

            return (
              <div
                key={load.id}
                id={`load-card-${load.id}`}
                onClick={() => handleSelectLoad(load)}
                className="bg-white rounded-2xl border border-slate-200 hover:border-primary-gold hover:shadow-md p-5 flex flex-col justify-between cursor-pointer transition-all duration-200 group text-left relative overflow-hidden"
              >
                {/* Visual Accent Top Line on Hover */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-transparent group-hover:bg-primary-gold transition-colors" />

                <div className="space-y-4">
                  {/* Card Header information */}
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <span className="text-sm font-mono font-black tracking-widest text-primary-navy bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg uppercase">
                        {load.plate}
                      </span>
                      <span className="block text-[10px] text-slate-400 font-extrabold uppercase mt-2.5">Motorista</span>
                      <span className="text-sm font-bold text-slate-800 truncate block max-w-[190px]">{load.driverName}</span>
                      {load.driverPhone && (
                        <span className="block text-[11px] font-semibold text-slate-500 mt-1">{load.driverPhone}</span>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${statusBg}`}>
                        {load.status === CargoStatus.RELEASED ? 'EM TRÂNSITO' :
                         load.status === CargoStatus.BLOCKED ? 'DIVERGÊNCIA' : 'AGUARDANDO'}
                      </span>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${portariaColor}`}>
                        {portariaStatusLabel}
                      </span>
                    </div>
                  </div>

                  {/* Route & Seal / Pallet descriptions */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate uppercase font-black">{load.origin} &rarr; {load.destination}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <div>
                        <span className="block text-[8px] text-slate-400 font-extrabold mb-0.5">Lacre Original</span>
                        <span className="text-slate-700 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded font-mono truncate block text-left">
                          L-{load.sealNumber || 'NÃO LANÇADO'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[8px] text-slate-400 font-extrabold mb-0.5">Qtd. Paletes</span>
                        <span className="text-slate-705 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded truncate block text-center font-black">
                          {load.palletCount} Pls
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer and visual release guidance */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[9px] font-mono font-semibold text-slate-405">
                    {new Date(load.createdAt).toLocaleDateString()} &bull; {new Date(load.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-[10px] font-black text-primary-navy group-hover:text-primary-gold uppercase tracking-wider flex items-center gap-1">
                    Conferir Lote
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* OVERLAY DYNAMIC WINDOW POPUP MODAL */}
      {isModalOpen && selectedLoad && (
        <div className="fixed inset-0 z-50 overflow-y-auto" id="portaria-modal">
          
          {/* Backdrop Glass with Blur Effect */}
          <div 
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm transition-opacity" 
            onClick={() => {
              setIsModalOpen(false);
              setSelectedLoadId(null);
            }} 
          />

          {/* Centering popup box wrapper */}
          <div className="flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10 w-full animate-in zoom-in-95 duration-200">
            <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all mr-auto ml-auto my-8 flex flex-col">
              
              {/* Header inside modal */}
              <div className="bg-primary-navy px-6 py-5 flex items-center justify-between text-white border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                  <ClipboardCheck className="w-5.5 h-5.5 text-primary-gold animate-bounce" />
                  <div className="text-left">
                    <h3 className="text-sm font-black uppercase tracking-wider">
                      Lançamento da Portaria &bull; Placa {selectedLoad.plate}
                    </h3>
                    <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest mt-0.5 font-mono">
                      MOTORISTA: {selectedLoad.driverName} &bull; DESTINO: {selectedLoad.destination} &bull; EXPEDIDO: {new Date(selectedLoad.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedLoadId(null);
                  }}
                  className="text-slate-300 hover:text-white transition-colors bg-white/10 hover:bg-white/15 p-2 rounded-xl border-0 cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Scrollable Modal Area */}
              <div className="p-6 md:p-8 space-y-6 overflow-y-auto max-h-[70vh] text-left">
                
                {/* Notification banners inside overlay */}
                {notification && (
                  <div className={`p-4 rounded-xl text-xs font-black flex items-center gap-3 border ${
                    notification.type === 'success' 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-850' 
                      : 'bg-red-50 border-red-200 text-red-850'
                  }`}>
                    {notification.type === 'success' ? (
                      <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                    )}
                    <span>{notification.message}</span>
                  </div>
                )}

                {/* Info Ribbon & Main Data alteration toggle */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 border border-slate-150 p-4 rounded-xl gap-4">
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-x-6 gap-y-2 text-left text-[11px] font-bold text-slate-505 uppercase tracking-wider">
                    <div>
                      <span className="block text-[8px] text-slate-400 font-black">Motorista</span>
                      <span className="text-primary-navy font-black">{selectedLoad.driverName}</span>
                      {selectedLoad.driverPhone && (
                        <span className="block text-[10px] font-semibold text-slate-500">{selectedLoad.driverPhone}</span>
                      )}
                    </div>
                    <div>
                      <span className="block text-[8px] text-slate-400 font-black">Lacre Cadastrado</span>
                      <span className="text-primary-navy font-mono font-black">L-{selectedLoad.sealNumber || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] text-slate-400 font-black">Ficha Paletes</span>
                      <span className="text-primary-navy font-black text-center block">{selectedLoad.palletCount} Pls</span>
                    </div>
                    <div>
                      <span className="block text-[8px] text-slate-400 font-black font-bold">Data/Hora Expedido</span>
                      <span className="text-primary-navy font-mono font-black">
                        {new Date(selectedLoad.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingMainData(!isEditingMainData);
                        setShowDeleteConfirm(false);
                        setEditPlate(selectedLoad.plate);
                        setEditDriverName(selectedLoad.driverName);
                        setEditSealNumber(selectedLoad.sealNumber || '');
                        setEditDestination(selectedLoad.destination);
                        setEditPalletCount(selectedLoad.palletCount || 0);
                      }}
                      className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider border rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                        isEditingMainData 
                          ? 'bg-slate-800 text-white border-slate-800 hover:bg-slate-700' 
                          : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      {isEditingMainData ? 'Visualizar Lançamento' : 'Alterar Dados da Carga'}
                    </button>

                    {onDeleteLoad && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowDeleteConfirm(!showDeleteConfirm);
                          setIsEditingMainData(false);
                        }}
                        className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider border rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                          showDeleteConfirm
                            ? 'bg-rose-700 text-white border-rose-700 hover:bg-rose-850'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 shadow-xs'
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {showDeleteConfirm ? 'Voltar para Lançamento' : 'Excluir Carga Lancada'}
                      </button>
                    )}
                  </div>
                </div>

                {showDeleteConfirm ? (
                  <div className="bg-rose-50/70 border-2 border-rose-200 rounded-2xl p-6 md:p-8 space-y-5 text-left animate-in zoom-in-95 duration-200">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-rose-100 rounded-xl text-rose-600 shrink-0">
                        <AlertCircle className="w-6 h-6 animate-pulse" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-sans font-black text-xs text-rose-850 uppercase tracking-wider">
                          Confirmar Exclusão de Carga
                        </h4>
                        <p className="text-xs text-rose-700 font-bold leading-normal">
                          Você tem certeza de que deseja excluir permanentemente a carga com a placa <span className="bg-rose-100 px-1.5 py-0.5 rounded font-mono font-black">{selectedLoad.plate}</span>?
                        </p>
                        <p className="text-xs text-rose-650 leading-relaxed">
                          Esta ação é irreversível e removerá este veículo de todas as listagens (Portaria e Central). Utilize esta ferramenta exclusivamente para remover lançamentos feitos equivocadamente ou em duplicidade, evitando o excesso de informações na portaria.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-rose-200/50 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white border border-slate-205 text-slate-600 hover:bg-slate-50 cursor-pointer transition-all"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteConfirmClick}
                        className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-rose-655 text-white border-0 hover:bg-rose-755 flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
                      >
                        <Trash2 className="w-4 h-4 text-rose-200" />
                        Sim, Excluir Carga
                      </button>
                    </div>
                  </div>
                ) : !isEditingMainData ? (
                  /* SIMPLIFIED PORTARIA CHECK-IN */
                  <div className="space-y-6 animate-in fade-in duration-200">
                    
                    <div className="bg-emerald-50/50 border border-emerald-200/50 rounded-2xl p-5 flex items-start gap-4">
                      <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                        <Truck className="w-6 h-6 animate-pulse" />
                      </div>
                      <div className="text-left space-y-1">
                        <h4 className="font-sans font-black text-xs text-primary-navy uppercase tracking-wider">
                          Modo de Check-in de Saída (Simplificado)
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          A confirmação da portaria agora é simplificada. Realize o check-in de portaria para prosseguir e iniciar a rota do veículo. 
                          A verificação e o **Checkout detalhado** de Placa, Lacre, Motorista e Paletes serão de responsabilidade exclusiva da **Central de Monitoramento** quando o veículo chegar à loja de destino.
                        </p>
                      </div>
                    </div>

                    {/* Image uploads block (OPCIONAL) */}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Registros Fotográficos (Opcionais)</span>
                        <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-bold uppercase tracking-wider">Não Obrigatório</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        
                        {/* Photo Placa */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-[9px] font-black text-slate-455 uppercase tracking-widest block">Foto da Placa</label>
                            <span className="text-[9px] font-bold text-slate-400">{gatePhotoPlate.length}/10</span>
                          </div>
                          <input 
                            type="file" 
                            multiple
                            accept="image/*" 
                            capture="environment"
                            ref={refPlateInput} 
                            onChange={(e) => handlePhotoUpload(e, 'plate')} 
                            className="hidden" 
                          />
                          <div className="grid grid-cols-2 gap-2">
                            {gatePhotoPlate.map((p, idx) => (
                              <div key={idx} className="relative h-24 bg-slate-100 rounded-xl overflow-hidden group shadow border border-slate-250 col-span-1 cursor-zoom-in" onClick={() => setZoomPhoto(p)}>
                                <img 
                                  src={p} 
                                  alt={`Placa Portaria ${idx + 1}`} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                                  referrerPolicy="no-referrer"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveGatePhoto('plate', idx);
                                  }}
                                  className="absolute top-1 right-1 p-1.5 bg-red-650 hover:bg-red-550 text-white rounded-lg shadow-md border-0 cursor-pointer flex items-center justify-center transition-all"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            {gatePhotoPlate.length < 10 && (
                              <button
                                type="button"
                                onClick={() => refPlateInput.current?.click()}
                                className="w-full h-24 bg-slate-50 border-2 border-dashed border-slate-200 hover:border-primary-gold hover:bg-slate-100/50 rounded-xl flex flex-col items-center justify-center gap-1 transition-all outline-none cursor-pointer group text-center col-span-1"
                              >
                                <div className="p-1.5 bg-white group-hover:bg-primary-gold/15 rounded-lg shadow-sm transition-all">
                                  <Camera className="w-4 h-4 text-slate-400 group-hover:text-primary-gold" />
                                </div>
                                <span className="block text-[8px] font-black text-primary-navy uppercase">Capturar Placa</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Photo Lacre */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-[9px] font-black text-slate-455 uppercase tracking-widest block">Foto do Lacre</label>
                            <span className="text-[9px] font-bold text-slate-400">{gatePhotoSeal.length}/10</span>
                          </div>
                          <input 
                            type="file" 
                            multiple
                            accept="image/*" 
                            capture="environment"
                            ref={refSealInput} 
                            onChange={(e) => handlePhotoUpload(e, 'seal')} 
                            className="hidden" 
                          />
                          <div className="grid grid-cols-2 gap-2">
                            {gatePhotoSeal.map((p, idx) => (
                              <div key={idx} className="relative h-24 bg-slate-100 rounded-xl overflow-hidden group shadow border border-slate-250 col-span-1 cursor-zoom-in" onClick={() => setZoomPhoto(p)}>
                                <img 
                                  src={p} 
                                  alt={`Lacre Portaria ${idx + 1}`} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                                  referrerPolicy="no-referrer"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveGatePhoto('seal', idx);
                                  }}
                                  className="absolute top-1 right-1 p-1.5 bg-red-650 hover:bg-red-550 text-white rounded-lg shadow-md border-0 cursor-pointer flex items-center justify-center transition-all"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            {gatePhotoSeal.length < 10 && (
                              <button
                                type="button"
                                onClick={() => refSealInput.current?.click()}
                                className="w-full h-24 bg-slate-50 border-2 border-dashed border-slate-200 hover:border-primary-gold hover:bg-slate-100/50 rounded-xl flex flex-col items-center justify-center gap-1 transition-all outline-none cursor-pointer group text-center col-span-1"
                              >
                                <div className="p-1.5 bg-white group-hover:bg-primary-gold/15 rounded-lg shadow-sm transition-all">
                                  <Camera className="w-4 h-4 text-slate-400 group-hover:text-primary-gold" />
                                </div>
                                <span className="block text-[8px] font-black text-primary-navy uppercase">Capturar Lacre</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Photo Romaneio */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-[9px] font-black text-slate-455 uppercase tracking-widest block">Foto Romaneio</label>
                            <span className="text-[9px] font-bold text-slate-400">{gatePhotoManifest.length}/10</span>
                          </div>
                          <input 
                            type="file" 
                            multiple
                            accept="image/*" 
                            capture="environment"
                            ref={refManifestInput} 
                            onChange={(e) => handlePhotoUpload(e, 'manifest')} 
                            className="hidden" 
                          />
                          <div className="grid grid-cols-2 gap-2">
                            {gatePhotoManifest.map((p, idx) => (
                              <div key={idx} className="relative h-24 bg-slate-100 rounded-xl overflow-hidden group shadow border border-slate-250 col-span-1 cursor-zoom-in" onClick={() => setZoomPhoto(p)}>
                                <img 
                                  src={p} 
                                  alt={`Romaneio Portaria ${idx + 1}`} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                                  referrerPolicy="no-referrer"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveGatePhoto('manifest', idx);
                                  }}
                                  className="absolute top-1 right-1 p-1.5 bg-red-650 hover:bg-red-550 text-white rounded-lg shadow-md border-0 cursor-pointer flex items-center justify-center transition-all"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            {gatePhotoManifest.length < 10 && (
                              <button
                                type="button"
                                onClick={() => refManifestInput.current?.click()}
                                className="w-full h-24 bg-slate-50 border-2 border-dashed border-slate-200 hover:border-primary-gold hover:bg-slate-100/50 rounded-xl flex flex-col items-center justify-center gap-1 transition-all outline-none cursor-pointer group text-center col-span-1"
                              >
                                <div className="p-1.5 bg-white group-hover:bg-primary-gold/15 rounded-lg shadow-sm transition-all">
                                  <Camera className="w-4 h-4 text-slate-400 group-hover:text-primary-gold" />
                                </div>
                                <span className="block text-[8px] font-black text-primary-navy uppercase">Capturar Romaneio</span>
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Observações da Portaria */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-455 uppercase tracking-widest ml-1">Observações da Portaria (Opcional)</label>
                      <textarea
                        rows={2}
                        value={gateObservation}
                        onChange={(e) => setGateObservation(e.target.value)}
                        placeholder="Anote detalhes se houver necessidade (ex: observação sobre o veículo ou motorista)..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-primary-navy font-bold focus:ring-2 focus:ring-primary-gold outline-none"
                      />
                    </div>

                    {/* Action button inside simplified check-in */}
                    <button
                      type="button"
                      onClick={handleSavePortariaValidation}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4.5 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3 text-xs uppercase tracking-widest cursor-pointer border-b-4 border-emerald-800 border-0"
                    >
                      <ShieldCheck className="w-5 h-5 text-primary-gold" />
                      EFETUAR CHECK-IN E INICIAR VIAGEM
                    </button>

                  </div>
                ) : (
                  /* FICHA DE EDICAO INSIDE POPUP OVERLAY WINDOW */
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-primary-gold" />
                      <h4 className="text-xs font-black text-primary-navy uppercase tracking-tight">Ficha Cadastro - Alterar Informações</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <div className="space-y-1 text-left">
                        <label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Placa do Veículo</label>
                        <input
                          type="text"
                          value={editPlate}
                          onChange={(e) => setEditPlate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-primary-navy font-black focus:ring-2 focus:ring-primary-gold outline-none"
                        />
                      </div>

                      <div className="space-y-1 text-left">
                        <label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Motorista</label>
                        <input
                          type="text"
                          value={editDriverName}
                          onChange={(e) => setEditDriverName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-primary-navy font-black focus:ring-2 focus:ring-primary-gold outline-none"
                        />
                      </div>

                      <div className="space-y-1 text-left">
                        <label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Número do Lacre</label>
                        <input
                          type="text"
                          value={editSealNumber}
                          onChange={(e) => setEditSealNumber(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-primary-navy font-mono font-black focus:ring-2 focus:ring-primary-gold outline-none"
                        />
                      </div>

                      <div className="space-y-1 text-left">
                        <label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Destino Principal</label>
                        <input
                          type="text"
                          value={editDestination}
                          onChange={(e) => setEditDestination(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-primary-navy font-black focus:ring-2 focus:ring-primary-gold outline-none"
                        />
                      </div>

                      <div className="space-y-1 text-left col-span-full">
                        <label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Total Paletes</label>
                        <input
                          type="number"
                          value={editPalletCount}
                          onChange={(e) => setEditPalletCount(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-primary-navy font-black focus:ring-2 focus:ring-primary-gold outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-150">
                      <button
                        type="button"
                        onClick={() => setIsEditingMainData(false)}
                        className="px-4 py-2 text-xs font-black uppercase text-slate-500 hover:text-slate-700 bg-transparent border-0 cursor-pointer"
                      >
                        Voltar para checklist
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveMainDataEdits}
                        className="px-5 py-2.5 text-xs font-black uppercase bg-primary-gold hover:bg-primary-gold/90 text-white rounded-xl shadow-md border-0 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 animate-in"
                      >
                        <Save className="w-4 h-4" />
                        Gravar Alterações
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal window footer summary */}
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center text-[10px] font-bold text-slate-450 uppercase tracking-wider shrink-0 select-none">
                <div className="text-left font-sans">
                  Incidência de Logística Geral: <span className="text-primary-navy font-black">{selectedLoad.occurrenceType || 'Sem divergências externas cadastradas'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedLoadId(null);
                  }}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 border-0 rounded-lg cursor-pointer transition-colors font-black uppercase text-[9px] tracking-widest"
                >
                  Fechar Janela
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {zoomPhoto && (
        <ImageEnhanceZoom 
          src={zoomPhoto} 
          onClose={() => setZoomPhoto(null)} 
          title="Visualização e Melhoria de Evidência da Portaria" 
        />
      )}

    </div>
  );
};
