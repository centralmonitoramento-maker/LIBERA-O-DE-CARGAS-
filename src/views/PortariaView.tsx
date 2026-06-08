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
  Eye, 
  Save, 
  X, 
  Truck, 
  Key, 
  FileText, 
  ArrowRight, 
  ClipboardCheck, 
  Info,
  Calendar
} from 'lucide-react';
import { CargoLoad, CargoStatus, User, EventLog } from '../types';

interface PortariaViewProps {
  loads: CargoLoad[];
  onUpdateLoad: (updatedLoad: CargoLoad) => Promise<void>;
  logs: EventLog[];
  loggedInUser: User | null;
}

export const PortariaView: React.FC<PortariaViewProps> = ({ 
  loads = [], 
  onUpdateLoad, 
  logs, 
  loggedInUser 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLoadId, setSelectedLoadId] = useState<string | null>(null);

  // Validation Form states
  const [gatePhotoPlate, setGatePhotoPlate] = useState('');
  const [gatePhotoSeal, setGatePhotoSeal] = useState('');
  const [gatePhotoManifest, setGatePhotoManifest] = useState('');
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

  // Refs for camera uploads
  const refPlateInput = useRef<HTMLInputElement>(null);
  const refSealInput = useRef<HTMLInputElement>(null);
  const refManifestInput = useRef<HTMLInputElement>(null);

  // Computed/Found active load
  const selectedLoad = useMemo(() => {
    return loads.find(l => l.id === selectedLoadId) || null;
  }, [loads, selectedLoadId]);

  // Filter loads by search
  const filteredLoads = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return loads;
    return loads.filter(load => 
      load.plate.toLowerCase().includes(q) ||
      load.driverName.toLowerCase().includes(q) ||
      load.destination.toLowerCase().includes(q) ||
      (load.sealNumber && load.sealNumber.toLowerCase().includes(q))
    );
  }, [loads, searchQuery]);

  // Handle selecting a load
  const handleSelectLoad = (load: CargoLoad) => {
    setSelectedLoadId(load.id);
    setGatePhotoPlate(load.gatePhotoPlate || '');
    setGatePhotoSeal(load.gatePhotoSeal || '');
    setGatePhotoManifest(load.gatePhotoManifest || '');
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
  };

  // Convert uploaded image file to Base64
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'plate' | 'seal' | 'manifest') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (target === 'plate') setGatePhotoPlate(base64String);
        if (target === 'seal') setGatePhotoSeal(base64String);
        if (target === 'manifest') setGatePhotoManifest(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Gatehouse validation
  const handleSavePortariaValidation = async () => {
    if (!selectedLoad) return;

    if (!gatePhotoPlate || !gatePhotoSeal || !gatePhotoManifest) {
      setNotification({
        type: 'error',
        message: 'Atenção: É mandatório anexar as fotos da Placa, do Lacre e do Romaneio na validação da Portaria.'
      });
      return;
    }

    // Determine default status if checked match
    const isAllChecked = chkPlate && chkSeal && chkRomaneio;
    const finalGateStatus = gateStatus === 'Aguardando' && isAllChecked ? 'Aprovado' : gateStatus;

    const updated: CargoLoad = {
      ...selectedLoad,
      gateVerified: true,
      gateVerifiedAt: new Date().toISOString(),
      gateVerifiedBy: loggedInUser?.username || 'Portaria',
      gatePhotoPlate,
      gatePhotoSeal,
      gatePhotoManifest,
      gateStatus: finalGateStatus,
      gateObservation: gateObservation.trim(),
      // Auto-update global load status optionally if approved
      status: finalGateStatus === 'Aprovado' 
        ? CargoStatus.RELEASED 
        : finalGateStatus === 'Divergente' 
          ? CargoStatus.BLOCKED 
          : selectedLoad.status
    };

    try {
      await onUpdateLoad(updated);
      setNotification({
        type: 'success',
        message: 'Validação da portaria salva com sucesso!'
      });
      // Update locally selected representation safely
      setSelectedLoadId(updated.id);
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: 'Erro ao salvar validação. Tentando novamente.'
      });
    }
  };

  // Save modified main loading data directly (e.g. driver name, plate, seal)
  const handleSaveMainDataEdits = async () => {
    if (!selectedLoad) return;

    if (!editPlate.trim() || !editDriverName.trim()) {
      setNotification({
        type: 'error',
        message: 'Por favor, preencha os campos obrigatórios (Placa e Motorista).'
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
        message: 'Informações principais da carga alteradas com sucesso!'
      });
      setIsEditingMainData(false);
    } catch (err) {
      setNotification({
        type: 'error',
        message: 'Erro ao atualizar dados principais da carga.'
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-500 text-slate-800">
      
      {/* Top Banner and Heading */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-primary-navy p-8 rounded-3xl text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 hidden lg:block transform translate-x-12">
          <Truck className="w-96 h-96 -rotate-12" />
        </div>
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-primary-gold/25 text-primary-gold border border-primary-gold/40 text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full">
              Controle de Acesso
            </span>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Setor de Portaria</h1>
          <p className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
            Validação de saída e recebimento físico das expedições por meio de imagens comprobatórias
          </p>
        </div>
        <div className="flex gap-4 items-center shrink-0 relative z-10 bg-slate-900/35 border border-white/10 px-4 py-3 rounded-2xl">
          <ClipboardCheck className="w-10 h-10 text-primary-gold" />
          <div className="text-left font-sans">
            <span className="block text-[8px] text-slate-400 font-extrabold uppercase tracking-widest">Sessão Ativa</span>
            <span className="block text-xs font-black text-white uppercase">{loggedInUser?.fullName || loggedInUser?.username || 'Porteiro'}</span>
            <span className="block text-[8px] text-primary-gold font-extrabold uppercase tracking-widest">Acesso de Portaria</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Search and List representing standard Cargo items */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[700px]">
            
            {/* Header and Search Container */}
            <div className="p-5 border-b border-slate-200 bg-slate-50/50 space-y-4">
              <div>
                <h2 className="font-black text-sm uppercase tracking-wider text-primary-navy">Pesquisar Cargas</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Selecione uma expedição para iniciar a conferência</p>
              </div>

              <div className="relative">
                <Search className="absolute left-3.5 top-[13px] w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-9 py-3 text-xs text-primary-navy font-bold focus:ring-2 focus:ring-primary-gold outline-none transition-all placeholder:text-slate-400"
                  placeholder="DIGITE PLACA, MOTORISTA OU LACRE..."
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-[11px] text-xs text-slate-400 hover:text-slate-600 font-black border-0 bg-transparent cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Expedition Loads List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredLoads.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-50 space-y-3">
                  <Truck className="w-10 h-10 text-slate-300" />
                  <p className="text-xs font-bold text-slate-450 uppercase tracking-widest">Nenhuma carga encontrada</p>
                </div>
              ) : (
                filteredLoads.map((load) => {
                  const isSelected = selectedLoadId === load.id;
                  let statusBg = 'bg-amber-100 text-amber-700 border-amber-200/50';
                  if (load.status === CargoStatus.RELEASED) {
                    statusBg = 'bg-emerald-55 text-emerald-800 border-emerald-200/40';
                  } else if (load.status === CargoStatus.BLOCKED) {
                    statusBg = 'bg-red-50 text-red-750 border-red-200/50';
                  }

                  let portariaStatusLabel = 'Aguardando Validação';
                  let portariaColor = 'bg-slate-100 text-slate-600 border-slate-200';
                  if (load.gateStatus === 'Aprovado') {
                    portariaStatusLabel = 'Portaria Aprovada';
                    portariaColor = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
                  } else if (load.gateStatus === 'Divergente') {
                    portariaStatusLabel = 'Divergência Portaria';
                    portariaColor = 'bg-red-500/10 text-red-650 border-red-500/20';
                  }

                  return (
                    <button
                      key={load.id}
                      type="button"
                      onClick={() => handleSelectLoad(load)}
                      className={`w-full p-4 rounded-2xl border transition-all text-left flex flex-col gap-3 cursor-pointer group ${
                        isSelected 
                          ? 'bg-primary-gold/10 border-primary-gold shadow-md' 
                          : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 w-full">
                        <div className="space-y-1">
                          <span className="text-sm font-mono font-black tracking-widest text-primary-navy bg-slate-100 border border-slate-200 px-2 py-0.5 rounded uppercase">
                            {load.plate}
                          </span>
                          <div className="text-[11px] font-bold text-slate-700 mt-1">
                            Motorista: <span className="font-semibold text-slate-500">{load.driverName}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${statusBg}`}>
                            {load.status === CargoStatus.RELEASED ? 'EM TRÂNSITO' :
                             load.status === CargoStatus.BLOCKED ? 'DIVERGÊNCIA' : 'AGUARDANDO'}
                          </span>
                          <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${portariaColor}`}>
                            {portariaStatusLabel}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 w-full text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                        <div>
                          <span className="block text-[8px] text-slate-400 font-extrabold mb-0.5">Destino</span>
                          <span className="text-slate-650 truncate block">{load.destination}</span>
                        </div>
                        <div>
                          <span className="block text-[8px] text-slate-400 font-extrabold mb-0.5 font-bold">Lacre / Paletes</span>
                          <span className="text-slate-650 truncate block">L- {load.sealNumber || 'N/A'} ({load.palletCount} P)</span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Detailed summary, verification panel, camera uploads, edit capability */}
        <div className="lg:col-span-8 space-y-6">
          {notification && (
            <div className={`p-4 rounded-2xl text-xs font-black flex items-center gap-3 border ${
              notification.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {notification.type === 'success' ? (
                <Check className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
          )}

          {!selectedLoad ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center space-y-5 h-[700px] shadow-sm">
              <div className="p-4 bg-slate-50 rounded-full animate-bounce">
                <ClipboardCheck className="w-16 h-16 text-primary-gold" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="text-lg font-black uppercase text-primary-navy tracking-tight">Nenhuma Carga Selecionada</h3>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  Por favor, escolha uma carga na barra lateral ou faça uma busca digitando a placa para iniciar o processo de conferência física na portaria.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">

              {/* Dynamic Cargo Summary */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-5 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-450 font-black uppercase tracking-widest block">Resumo da Carga Lançada</span>
                    <div className="flex gap-2 items-center flex-wrap">
                      <h2 className="text-2xl font-mono font-black text-primary-navy tracking-widest">{selectedLoad.plate}</h2>
                      <span className="text-xs bg-slate-100 hover:bg-slate-200 font-bold px-3 py-1 rounded-xl border border-slate-200 text-slate-600 block">
                        CD-01 &rarr; {selectedLoad.destination}
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar for selected load */}
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingMainData(!isEditingMainData);
                        setEditPlate(selectedLoad.plate);
                        setEditDriverName(selectedLoad.driverName);
                        setEditSealNumber(selectedLoad.sealNumber || '');
                        setEditDestination(selectedLoad.destination);
                        setEditPalletCount(selectedLoad.palletCount || 0);
                      }}
                      className={`px-4 py-2 text-xs font-black uppercase tracking-wider border rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                        isEditingMainData 
                          ? 'bg-slate-800 text-white border-slate-800 hover:bg-slate-700' 
                          : 'bg-white hover:bg-slate-50 text-slate-650 border-slate-250'
                      }`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      {isEditingMainData ? 'Visualizar Validação' : 'Alterar Dados da Carga'}
                    </button>
                  </div>
                </div>

                {!isEditingMainData ? (
                  /* Standard display details of load */
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl text-left space-y-1.5">
                      <span className="block text-[8px] text-slate-400 font-black uppercase tracking-widest">Motorista</span>
                      <span className="block text-sm font-black text-primary-navy capitalize truncate">{selectedLoad.driverName}</span>
                    </div>

                    <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl text-left space-y-1.5">
                      <span className="block text-[8px] text-slate-400 font-black uppercase tracking-widest">Número do Lacre</span>
                      <span className="block text-sm font-mono font-black text-primary-navy uppercase truncate">L- {selectedLoad.sealNumber || 'NÃO LANÇADO'}</span>
                    </div>

                    <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl text-left space-y-1.5">
                      <span className="block text-[8px] text-slate-400 font-black uppercase tracking-widest">Qtd. Paletes</span>
                      <span className="block text-sm font-black text-primary-navy truncate">{selectedLoad.palletCount} PALETES</span>
                    </div>

                    <div className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl text-left space-y-1.5">
                      <span className="block text-[8px] text-slate-400 font-black uppercase tracking-widest">Expedido em</span>
                      <span className="block text-xs font-extrabold text-slate-500 truncate">
                        {new Date(selectedLoad.createdAt).toLocaleDateString('pt-BR')} {new Date(selectedLoad.createdAt).toTimeString().substring(0, 5)}
                      </span>
                    </div>

                    {selectedLoad.additionalDestinations && selectedLoad.additionalDestinations.length > 0 && (
                      <div className="col-span-full bg-blue-50/30 border border-blue-100/70 p-4 rounded-2xl text-left space-y-2.5">
                        <span className="block text-[8px] text-blue-600 font-black uppercase tracking-wider">Rotas / Destinos Adicionais</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="bg-white border border-blue-200 px-3 py-1 rounded-lg text-[10px] font-bold text-slate-650">{selectedLoad.destination}</span>
                          {selectedLoad.additionalDestinations.map((dest, idx) => (
                            <React.Fragment key={idx}>
                              <ArrowRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                              <span className="bg-white border border-blue-200 px-3 py-1 rounded-lg text-[10px] font-bold text-slate-650">{dest}</span>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Form to directly edit cargo details representing "incluir ou alterar as informações" */
                  <div className="bg-primary-navy/5 border border-primary-navy/10 rounded-2xl p-6.5 space-y-5 text-left animate-in fade-in duration-300">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-primary-gold" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-primary-navy">Ficha de Edição dos Dados Originais</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-450 ml-1">Placa do Veículo</label>
                        <input
                          type="text"
                          value={editPlate}
                          onChange={(e) => setEditPlate(e.target.value)}
                          className="w-full bg-white border border-slate-250 rounded-xl px-4 py-2.5 text-xs text-primary-navy font-bold focus:ring-2 focus:ring-primary-gold outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-450 ml-1">Nome do Motorista</label>
                        <input
                          type="text"
                          value={editDriverName}
                          onChange={(e) => setEditDriverName(e.target.value)}
                          className="w-full bg-white border border-slate-250 rounded-xl px-4 py-2.5 text-xs text-primary-navy font-bold focus:ring-2 focus:ring-primary-gold outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-450 ml-1">Lacre Original</label>
                        <input
                          type="text"
                          value={editSealNumber}
                          onChange={(e) => setEditSealNumber(e.target.value)}
                          className="w-full bg-white border border-slate-250 rounded-xl px-4 py-2.5 text-xs text-primary-navy font-mono font-bold focus:ring-2 focus:ring-primary-gold outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-450 ml-1">Destino Principal</label>
                        <input
                          type="text"
                          value={editDestination}
                          onChange={(e) => setEditDestination(e.target.value)}
                          className="w-full bg-white border border-slate-250 rounded-xl px-4 py-2.5 text-xs text-primary-navy font-bold focus:ring-2 focus:ring-primary-gold outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-450 ml-1">Total Paletes</label>
                        <input
                          type="number"
                          value={editPalletCount}
                          onChange={(e) => setEditPalletCount(Number(e.target.value))}
                          className="w-full bg-white border border-slate-250 rounded-xl px-4 py-2.5 text-xs text-primary-navy font-bold focus:ring-2 focus:ring-primary-gold outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3.5 pt-3.5 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setIsEditingMainData(false)}
                        className="px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-700 bg-transparent border-0 cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveMainDataEdits}
                        className="px-5 py-2.5 text-xs font-black uppercase tracking-wider bg-primary-gold hover:bg-primary-gold/90 text-white rounded-xl shadow-md border-0 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Salvar Alterações
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Guardhouse Portaria Checklist And Camera Upload Panel */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-8 text-left">
                <div>
                  <h3 className="font-black text-lg text-primary-navy uppercase tracking-tight">Etapa de Validação da Portaria</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Capture as fotos corporativas da carga para permitir a liberação ou registrar as divergências</p>
                </div>

                {/* Upload Section for the three required images */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Gate Photo Placa */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-450 uppercase tracking-widest">1. Foto da Placa (Portaria)</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment"
                      ref={refPlateInput} 
                      onChange={(e) => handlePhotoUpload(e, 'plate')} 
                      className="hidden" 
                    />
                    {gatePhotoPlate ? (
                      <div className="relative h-44 bg-slate-900 rounded-2xl overflow-hidden group shadow border border-slate-200">
                        <img 
                          src={gatePhotoPlate} 
                          alt="Placa" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-350" 
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setGatePhotoPlate('');
                            if (refPlateInput.current) refPlateInput.current.value = '';
                          }}
                          className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-500 text-white rounded-xl shadow border-0 cursor-pointer flex items-center justify-center transition-all active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => refPlateInput.current?.click()}
                        className="w-full h-44 bg-slate-50 border-2 border-dashed border-slate-200 hover:border-primary-gold hover:bg-slate-100/50 rounded-2xl flex flex-col items-center justify-center gap-2.5 transition-all outline-none cursor-pointer group text-center px-4"
                      >
                        <div className="p-3 bg-white group-hover:bg-primary-gold/15 rounded-xl transition-all shadow-sm">
                          <Camera className="w-5 h-5 text-slate-450 group-hover:text-primary-gold transition-colors" />
                        </div>
                        <div>
                          <span className="block text-[10px] font-black text-primary-navy uppercase tracking-wider">Tirar Foto Placa</span>
                          <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Traseira / Frente Veículo</span>
                        </div>
                      </button>
                    )}
                  </div>

                  {/* Gate Photo Lacre */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-450 uppercase tracking-widest">2. Foto do Lacre (Portaria)</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment"
                      ref={refSealInput} 
                      onChange={(e) => handlePhotoUpload(e, 'seal')} 
                      className="hidden" 
                    />
                    {gatePhotoSeal ? (
                      <div className="relative h-44 bg-slate-900 rounded-2xl overflow-hidden group shadow border border-slate-200">
                        <img 
                          src={gatePhotoSeal} 
                          alt="Lacre" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-350" 
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setGatePhotoSeal('');
                            if (refSealInput.current) refSealInput.current.value = '';
                          }}
                          className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-500 text-white rounded-xl shadow border-0 cursor-pointer flex items-center justify-center transition-all active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => refSealInput.current?.click()}
                        className="w-full h-44 bg-slate-50 border-2 border-dashed border-slate-200 hover:border-primary-gold hover:bg-slate-100/50 rounded-2xl flex flex-col items-center justify-center gap-2.5 transition-all outline-none cursor-pointer group text-center px-4"
                      >
                        <div className="p-3 bg-white group-hover:bg-primary-gold/15 rounded-xl transition-all shadow-sm">
                          <Camera className="w-5 h-5 text-slate-450 group-hover:text-primary-gold transition-colors" />
                        </div>
                        <div>
                          <span className="block text-[10px] font-black text-primary-navy uppercase tracking-wider">Tirar Foto Lacre</span>
                          <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Foco no número gravado</span>
                        </div>
                      </button>
                    )}
                  </div>

                  {/* Gate Photo Manifesto / Romaneio */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-450 uppercase tracking-widest">3. Foto do Romaneio / Manifesto</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment"
                      ref={refManifestInput} 
                      onChange={(e) => handlePhotoUpload(e, 'manifest')} 
                      className="hidden" 
                    />
                    {gatePhotoManifest ? (
                      <div className="relative h-44 bg-slate-900 rounded-2xl overflow-hidden group shadow border border-slate-200">
                        <img 
                          src={gatePhotoManifest} 
                          alt="Romaneio" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-355" 
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setGatePhotoManifest('');
                            if (refManifestInput.current) refManifestInput.current.value = '';
                          }}
                          className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-500 text-white rounded-xl shadow border-0 cursor-pointer flex items-center justify-center transition-all active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => refManifestInput.current?.click()}
                        className="w-full h-44 bg-slate-50 border-2 border-dashed border-slate-200 hover:border-primary-gold hover:bg-slate-100/50 rounded-2xl flex flex-col items-center justify-center gap-2.5 transition-all outline-none cursor-pointer group text-center px-4"
                      >
                        <div className="p-3 bg-white group-hover:bg-primary-gold/15 rounded-xl transition-all shadow-sm">
                          <Camera className="w-5 h-5 text-slate-450 group-hover:text-primary-gold transition-colors" />
                        </div>
                        <div>
                          <span className="block text-[10px] font-black text-primary-navy uppercase tracking-wider">Tirar Foto Romaneio</span>
                          <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Assinado e Carimbado</span>
                        </div>
                      </button>
                    )}
                  </div>

                </div>

                {/* Gate Physical Checklists */}
                <div className="bg-slate-50 rounded-2xl p-6.5 border border-slate-100 space-y-4">
                  <span className="block text-[9px] font-black text-primary-navy uppercase tracking-widest">Checklist de Itens Físicos correspondentes</span>
                  
                  <div className="space-y-3">
                    <label className="flex items-center gap-3.5 p-3.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50/50 transition-colors select-none">
                      <input 
                        type="checkbox" 
                        checked={chkPlate}
                        onChange={(e) => setChkPlate(e.target.checked)}
                        className="w-4.5 h-4.5 accent-primary-gold rounded" 
                      />
                      <div className="text-left">
                        <span className="block text-xs font-black text-primary-navy uppercase">Placa física confere?</span>
                        <span className="block text-[9px] text-slate-400 font-bold">Confirme se as letras e números estampados no caminhão batem exatamente com o sistema: <strong className="text-primary-navy">{selectedLoad.plate}</strong></span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3.5 p-3.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50/50 transition-colors select-none">
                      <input 
                        type="checkbox" 
                        checked={chkSeal}
                        onChange={(e) => setChkSeal(e.target.checked)}
                        className="w-4.5 h-4.5 accent-primary-gold rounded" 
                      />
                      <div className="text-left">
                        <span className="block text-xs font-black text-primary-navy uppercase">Lacre físico confere?</span>
                        <span className="block text-[9px] text-slate-400 font-bold">Confirme se o número cravado no selo plástico/aço bate rigorosamente: <strong className="text-primary-navy">{selectedLoad.sealNumber || 'NÃO LANÇADO'}</strong></span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3.5 p-3.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50/50 transition-colors select-none">
                      <input 
                        type="checkbox" 
                        checked={chkRomaneio}
                        onChange={(e) => setChkRomaneio(e.target.checked)}
                        className="w-4.5 h-4.5 accent-primary-gold rounded" 
                      />
                      <div className="text-left">
                        <span className="block text-xs font-black text-primary-navy uppercase">Dados do Romaneio e Paletes conferem?</span>
                        <span className="block text-[9px] text-slate-400 font-bold">Confirme se o total de <span className="text-primary-navy font-bold">{selectedLoad.palletCount} paletes</span> está em total congruência com o documento fiscal/romaneio físico.</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Validation Status dropdown and Observations */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  <div className="space-y-2 md:col-span-1">
                    <label className="text-[9px] font-black text-slate-450 uppercase tracking-widest ml-1">Status da Conferência</label>
                    <select
                      value={gateStatus}
                      onChange={(e) => setGateStatus(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-250 rounded-xl px-4 py-3 text-xs font-black text-primary-navy uppercase tracking-wider focus:ring-2 focus:ring-primary-gold outline-none cursor-pointer h-12"
                    >
                      <option value="Aguardando">AGUARDANDO AVALIAÇÃO</option>
                      <option value="Aprovado">LIBERADO / PORTARIA OK (VERDE)</option>
                      <option value="Divergente">DIVERGÊNCIA NOTIFICADA (VERMELHO)</option>
                    </select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[9px] font-black text-slate-450 uppercase tracking-widest ml-1">Observações da Portaria</label>
                    <textarea
                      rows={2}
                      value={gateObservation}
                      onChange={(e) => setGateObservation(e.target.value)}
                      placeholder="Descreva detalhes físicos constatados no gate da portaria, violações, estado do veículo ou detalhes do motorista..."
                      className="w-full bg-slate-50 border border-slate-250 rounded-xl px-4 py-2.5 text-xs text-primary-navy font-bold focus:ring-2 focus:ring-primary-gold outline-none placeholder:text-slate-400"
                    />
                  </div>

                </div>

                {/* Save Button for validation */}
                <button
                  type="button"
                  onClick={handleSavePortariaValidation}
                  className="w-full bg-primary-navy hover:bg-slate-800 text-white font-black py-5 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3 text-xs uppercase tracking-widest cursor-pointer border-b-4 border-slate-900"
                >
                  <ShieldCheck className="w-5 h-5 text-primary-gold" />
                  Salvar e Registrar Validação na Portaria
                </button>
              </div>

              {/* Validation History of other gates logs if related */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm text-left">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                  <Calendar className="w-4 h-4 text-primary-gold" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Informações Adicionais de Tráfego do Sistema</span>
                </div>
                <div className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase tracking-wider space-y-1">
                  <div>Status de Auditoria Geral: <span className="text-primary-navy font-semibold">{selectedLoad.occurrenceType || 'Sem ocorrências gerais registradas'}</span></div>
                  {selectedLoad.gateVerifiedAt && (
                    <div className="text-emerald-600">
                      Carga validada na portaria anteriormente em {new Date(selectedLoad.gateVerifiedAt).toLocaleDateString()} às {new Date(selectedLoad.gateVerifiedAt).toLocaleTimeString()} por {selectedLoad.gateVerifiedBy}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
