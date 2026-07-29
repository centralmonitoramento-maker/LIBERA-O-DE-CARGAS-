import React, { useState, useMemo, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { 
  Truck, 
  RotateCcw, 
  ArrowLeftRight, 
  ClipboardList, 
  Plus, 
  Search, 
  Filter, 
  ShieldCheck, 
  ShieldAlert, 
  X, 
  FileText, 
  Calendar, 
  Clock, 
  MapPin, 
  Eye, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  Ban, 
  Trash2, 
  Printer, 
  ChevronRight, 
  Info,
  Layers,
  Sparkles,
  RefreshCw,
  UserCheck,
  Recycle,
  BarChart2,
  PieChart as PieIcon,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Award,
  Package,
  Building2
} from 'lucide-react';
import { CargoLoad, CargoType, CargoStatus, User, LOCATION_OPTIONS } from '../types';
import { getUniquePlatesRaw, getUniquePlatesNormalized } from '../data/telemetryData';
import { getDriversByPlate, getAllPlatesWithDrivers, DriverLink } from '../data/driversData';

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

const STORE_LOCATIONS = Object.keys(ROUTE_COORDINATES).filter(k => k !== 'CD-01' && k !== 'CD-02');

interface ReverseTransferViewProps {
  onSubmit: (newLoad: Omit<CargoLoad, 'id' | 'status' | 'createdAt' | 'createdBy'>) => Promise<void>;
  onUpdateLoad?: (updatedLoad: CargoLoad) => Promise<void>;
  onDeleteLoad?: (loadId: string) => Promise<void>;
  loads: CargoLoad[];
  currentUser?: User;
  operationMode?: 'REVERSA' | 'TRANSFERENCIA' | 'COLETA_TERCEIRO' | 'ALL';
}

export const ReverseTransferView: React.FC<ReverseTransferViewProps> = ({ 
  onSubmit, 
  onUpdateLoad, 
  onDeleteLoad,
  loads = [], 
  currentUser,
  operationMode = 'ALL'
}) => {
  const [showForm, setShowForm] = useState(false);
  const [operationType, setOperationType] = useState<'reverse_cd' | 'transfer' | 'coleta'>(() => {
    if (operationMode === 'TRANSFERENCIA') return 'transfer';
    if (operationMode === 'COLETA_TERCEIRO') return 'coleta';
    return 'reverse_cd';
  });

  useEffect(() => {
    if (operationMode === 'REVERSA') {
      setOperationType('reverse_cd');
      setDestination('CD-01');
    } else if (operationMode === 'TRANSFERENCIA') {
      setOperationType('transfer');
      setDestination('');
    } else if (operationMode === 'COLETA_TERCEIRO') {
      setOperationType('coleta');
      setDestination('PORTO RECICLAGEM');
    }
  }, [operationMode]);
  
  // Form fields
  const [plate, setPlate] = useState('');
  const [plateCavalo, setPlateCavalo] = useState('');
  const [plateBau, setPlateBau] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('CD-01');
  const [sealNumber, setSealNumber] = useState('');
  const [palletCount, setPalletCount] = useState<number>(0);
  
  // Pallet details state
  const [woodPallets, setWoodPallets] = useState<number>(0);
  const [plasticPallets, setPlasticPallets] = useState<number>(0);
  const [cardboardBales, setCardboardBales] = useState<number>(0);
  const [plasticBales, setPlasticBales] = useState<number>(0);
  const [damagedProducts, setDamagedProducts] = useState<number>(0);
  const [trashBags, setTrashBags] = useState<number>(0);
  const [greaseDrums, setGreaseDrums] = useState<number>(0);
  const [oilDrums, setOilDrums] = useState<number>(0);

  // Customized Physical Detailing fields per operation type
  // 1. Logística Reversa CD
  const [pbrPallets, setPbrPallets] = useState<number>(0);
  const [chepPallets, setChepPallets] = useState<number>(0);
  const [ifcoBoxes, setIfcoBoxes] = useState<number>(0);
  const [gaiolas, setGaiolas] = useState<number>(0);

  // 2. Transferência
  const [transferItemType, setTransferItemType] = useState<'ativo' | 'produto'>('ativo');
  const [transferPatrimonyPlate, setTransferPatrimonyPlate] = useState<string>('');
  const [transferInvoiceNumber, setTransferInvoiceNumber] = useState<string>('');
  const [transferAssets, setTransferAssets] = useState<number>(0);
  const [transferProducts, setTransferProducts] = useState<number>(0);
  const [transferDescription, setTransferDescription] = useState<string>('');

  // 3. Coleta
  const [trashContainers, setTrashContainers] = useState<number>(0);
  const [bagPlastics, setBagPlastics] = useState<number>(0);
  
  const [parInvoiceNumber, setParInvoiceNumber] = useState('');
  const [parDescription, setParDescription] = useState('');
  const [isHighRisk, setIsHighRisk] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Simulated files
  const [photoPlateSimulated, setPhotoPlateSimulated] = useState<string>('');
  const [photoSealSimulated, setPhotoSealSimulated] = useState<string>('');
  const [photoManifestSimulated, setPhotoManifestSimulated] = useState<string>('');
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CargoStatus>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'reverse' | 'transfer' | 'coleta'>('ALL');
  const [activeDashboard, setActiveDashboard] = useState<'reversa' | 'transferencia' | 'coleta' | 'concluidas' | null>(null);
  
  // Selected load for details modal
  const [selectedLoad, setSelectedLoad] = useState<CargoLoad | null>(null);

  // Auto-complete suggestions for Plates
  const [plateSuggestions, setPlateSuggestions] = useState<string[]>([]);
  const [activePlateIndex, setActivePlateIndex] = useState(-1);
  const [showPlateSuggestions, setShowPlateSuggestions] = useState(false);
  const [matchedDrivers, setMatchedDrivers] = useState<DriverLink[]>([]);

  const availablePlates = useMemo(() => {
    const telemetryPlates = getUniquePlatesRaw();
    const sheetPlates = getAllPlatesWithDrivers();
    return Array.from(new Set([...telemetryPlates, ...sheetPlates]));
  }, []);

  // Pre-fill origin with store location of logged-in user if available
  useEffect(() => {
    if (currentUser?.storeLocation) {
      setOrigin(currentUser.storeLocation.toUpperCase());
    } else {
      setOrigin('');
    }
  }, [currentUser]);

  // Handle operation type changes to reset default destination
  useEffect(() => {
    if (operationType === 'reverse_cd') {
      setDestination('CD-01');
    } else if (operationType === 'coleta') {
      setDestination('PORTO RECICLAGEM');
    } else {
      setDestination('');
    }
  }, [operationType]);

  // Compute overall pallet count from detailed items
  useEffect(() => {
    if (operationType === 'reverse_cd') {
      const total = pbrPallets + chepPallets + ifcoBoxes + gaiolas;
      setPalletCount(total);
    } else if (operationType === 'transfer') {
      const total = transferAssets + transferProducts;
      setPalletCount(total);
    } else if (operationType === 'coleta') {
      const total = oilDrums + greaseDrums + trashContainers + bagPlastics + cardboardBales;
      setPalletCount(total);
    } else {
      const total = woodPallets + plasticPallets;
      setPalletCount(total);
    }
  }, [
    operationType,
    pbrPallets,
    chepPallets,
    ifcoBoxes,
    gaiolas,
    transferAssets,
    transferProducts,
    oilDrums,
    greaseDrums,
    trashContainers,
    bagPlastics,
    cardboardBales,
    woodPallets,
    plasticPallets
  ]);

  // Plate autocomplete handler
  const handlePlateChange = (val: string) => {
    const cleanVal = val.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setPlate(cleanVal);
    
    // Split into cavalo/bau if containing space/hyphen or standard length
    if (cleanVal.length >= 7) {
      setPlateCavalo(cleanVal.substring(0, 7));
      if (cleanVal.length > 7) {
        setPlateBau(cleanVal.substring(7));
      }
    } else {
      setPlateCavalo(cleanVal);
    }

    if (cleanVal.trim().length > 1) {
      const filtered = availablePlates.filter(p => 
        p.toUpperCase().includes(cleanVal)
      ).slice(0, 5);
      setPlateSuggestions(filtered);
      setShowPlateSuggestions(true);
      setActivePlateIndex(0);
    } else {
      setPlateSuggestions([]);
      setShowPlateSuggestions(false);
    }

    // Dynamic driver lookup & auto-fill
    const matched = getDriversByPlate(cleanVal);
    setMatchedDrivers(matched);
    if (matched.length === 1) {
      setDriverName(matched[0].driverName);
      if (matched[0].driverPhone) {
        setDriverPhone(matched[0].driverPhone);
      }
    }
  };

  const handleSelectPlateSuggestion = (selected: string) => {
    setPlate(selected);
    const parts = selected.split('/');
    let cleanPlate = selected;
    if (parts.length > 1) {
      setPlateCavalo(parts[0].trim());
      setPlateBau(parts[1].trim());
      cleanPlate = parts[0].trim();
    } else {
      setPlateCavalo(selected);
      setPlateBau('');
    }
    setShowPlateSuggestions(false);

    // Dynamic driver lookup & auto-fill on suggestion select
    const matched = getDriversByPlate(cleanPlate);
    setMatchedDrivers(matched);
    if (matched.length === 1) {
      setDriverName(matched[0].driverName);
      if (matched[0].driverPhone) {
        setDriverPhone(matched[0].driverPhone);
      }
    }
  };

  // Base list of relevant loads for this view (filtered by operationMode and user scope: Loja vs Admin/Central)
  const baseRelevantLoads = useMemo(() => {
    // 1. Filter by operation mode
    let list = loads.filter(l => {
      const op = l.tipo_operacao;
      const type = l.cargoType;

      if (operationMode === 'REVERSA') {
        return op === 'REVERSA' || (!op && type === CargoType.REVERSA_CD);
      }
      if (operationMode === 'TRANSFERENCIA') {
        return op === 'TRANSFERENCIA' || (!op && type === CargoType.TRANSFERENCIA);
      }
      if (operationMode === 'COLETA_TERCEIRO') {
        return op === 'COLETA_TERCEIRO' || (!op && type === CargoType.COLETA);
      }

      return (
        type === CargoType.REVERSA_CD || 
        type === CargoType.TRANSFERENCIA ||
        type === CargoType.COLETA ||
        op === 'REVERSA' ||
        op === 'TRANSFERENCIA' ||
        op === 'COLETA_TERCEIRO'
      );
    });

    // 2. Filter by User Scope (Loja vs Central/Admin)
    const isCentralOrAdmin = 
      currentUser?.systemRole === 'administrator' || 
      currentUser?.role === 'central' || 
      currentUser?.role === 'expedition' || 
      currentUser?.role === 'audit' ||
      currentUser?.role === 'analysis' ||
      (currentUser?.role as string) === 'admin';

    const isStoreUser = 
      currentUser?.role === 'store_app' || 
      currentUser?.systemRole === 'store_app' || 
      (currentUser?.role as string) === 'loja' || 
      (currentUser?.systemRole as string) === 'loja' ||
      (!isCentralOrAdmin && !!currentUser?.storeLocation);

    if (isStoreUser && currentUser?.storeLocation) {
      const userStoreRaw = currentUser.storeLocation.toUpperCase().trim();
      const storeParts = userStoreRaw.split(/[-_\s]+/).map(s => s.trim()).filter(Boolean);

      list = list.filter(l => {
        const originUpper = (l.origin || '').toUpperCase().trim();
        const destUpper = (l.destination || '').toUpperCase().trim();
        const createdByUpper = (l.createdBy || '').toUpperCase().trim();
        const usernameUpper = (currentUser.username || '').toUpperCase().trim();

        // Origin or destination matches user store location
        if (originUpper === userStoreRaw || originUpper.includes(userStoreRaw) || userStoreRaw.includes(originUpper)) return true;
        if (destUpper === userStoreRaw || destUpper.includes(userStoreRaw) || userStoreRaw.includes(destUpper)) return true;

        // Sub-part match (e.g., "SOBRADINHO" or "04")
        for (const part of storeParts) {
          if (part.length > 2) {
            if (originUpper.includes(part) || destUpper.includes(part)) return true;
          }
        }

        // Created by current store user
        if (createdByUpper && usernameUpper && createdByUpper === usernameUpper) return true;

        return false;
      });
    }

    return list;
  }, [loads, currentUser, operationMode]);

  // Counts for KPI Dashboard Cards
  const reversasCount = useMemo(() => {
    return baseRelevantLoads.filter(l => l.cargoType === CargoType.REVERSA_CD).length;
  }, [baseRelevantLoads]);

  const transferenciasCount = useMemo(() => {
    return baseRelevantLoads.filter(l => l.cargoType === CargoType.TRANSFERENCIA).length;
  }, [baseRelevantLoads]);

  const coletasCount = useMemo(() => {
    return baseRelevantLoads.filter(l => l.cargoType === CargoType.COLETA).length;
  }, [baseRelevantLoads]);

  const concluidasCount = useMemo(() => {
    return baseRelevantLoads.filter(l => l.status === CargoStatus.RELEASED).length;
  }, [baseRelevantLoads]);

  // --- Analytics Data for Interactive Dashboards ---
  
  // 1. Logística Reversa Analytics
  const reversaTopLojas = useMemo(() => {
    const map: Record<string, number> = {};
    baseRelevantLoads
      .filter(l => l.cargoType === CargoType.REVERSA_CD)
      .forEach(l => {
        const storeName = l.origin.replace(/^\d+\s*-\s*/, '').trim() || l.origin;
        map[storeName] = (map[storeName] || 0) + 1;
      });
    const result = Object.entries(map)
      .map(([loja, total]) => ({ loja, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return result.length > 0 ? result : [
      { loja: 'SIA', total: 4 },
      { loja: 'Águas Claras', total: 3 },
      { loja: 'Guará', total: 2 },
      { loja: 'Ceilândia', total: 2 },
      { loja: 'Taguatinga', total: 1 },
    ];
  }, [baseRelevantLoads]);

  const reversaItensCategory = useMemo(() => {
    let pbr = 0;
    let chep = 0;
    let ifco = 0;
    let gaiolasCount = 0;
    let outros = 0;

    baseRelevantLoads
      .filter(l => l.cargoType === CargoType.REVERSA_CD)
      .forEach(l => {
        if (l.palletDetails && l.palletDetails.length > 0) {
          l.palletDetails.forEach(item => {
            const typeLower = item.type.toLowerCase();
            if (typeLower.includes('pbr')) pbr += item.quantity;
            else if (typeLower.includes('chep')) chep += item.quantity;
            else if (typeLower.includes('ifco') || typeLower.includes('caixa')) ifco += item.quantity;
            else if (typeLower.includes('gaiola')) gaiolasCount += item.quantity;
            else outros += item.quantity;
          });
        } else {
          pbr += l.palletCount || 1;
        }
      });

    const totalSum = pbr + chep + ifco + gaiolasCount + outros;
    if (totalSum === 0) {
      return [
        { name: 'Paletes PBR', value: 24, color: '#7e22ce' },
        { name: 'Paletes CHEP', value: 12, color: '#a855f7' },
        { name: 'Caixas IFCO', value: 8, color: '#c084fc' },
        { name: 'Gaiolas', value: 5, color: '#e9d5ff' },
      ];
    }

    return [
      { name: 'Paletes PBR', value: pbr, color: '#7e22ce' },
      { name: 'Paletes CHEP', value: chep, color: '#9333ea' },
      { name: 'Caixas IFCO', value: ifco, color: '#a855f7' },
      { name: 'Gaiolas', value: gaiolasCount, color: '#c084fc' },
      ...(outros > 0 ? [{ name: 'Outros', value: outros, color: '#d8b4fe' }] : [])
    ].filter(item => item.value > 0);
  }, [baseRelevantLoads]);

  // 2. Transferências Analytics
  const transferenciaTopRoutes = useMemo(() => {
    const map: Record<string, number> = {};
    baseRelevantLoads
      .filter(l => l.cargoType === CargoType.TRANSFERENCIA)
      .forEach(l => {
        const orig = l.origin.replace(/^\d+\s*-\s*/, '').trim() || l.origin;
        const dest = l.destination.replace(/^\d+\s*-\s*/, '').trim() || l.destination;
        const rota = `${orig} ➔ ${dest}`;
        map[rota] = (map[rota] || 0) + 1;
      });

    const result = Object.entries(map)
      .map(([rota, total]) => ({ rota, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return result.length > 0 ? result : [
      { rota: 'CD-01 ➔ SIA', total: 5 },
      { rota: 'Ceilândia ➔ Guará', total: 3 },
      { rota: 'SIA ➔ Águas Claras', total: 2 },
      { rota: 'CD-01 ➔ Taguatinga', total: 2 },
    ];
  }, [baseRelevantLoads]);

  const transferenciaVolumes = useMemo(() => {
    let ativos = 0;
    let produtos = 0;
    let totalTransfer = 0;

    baseRelevantLoads
      .filter(l => l.cargoType === CargoType.TRANSFERENCIA)
      .forEach(l => {
        totalTransfer += 1;
        const descLower = (l.occurrenceDescription || l.parDescription || '').toLowerCase();
        if (l.palletDetails && l.palletDetails.length > 0) {
          l.palletDetails.forEach(item => {
            if (item.type.toLowerCase().includes('ativo')) {
              ativos += item.quantity || 1;
            } else {
              produtos += item.quantity || 1;
            }
          });
        } else if (descLower.includes('ativo') || descLower.includes('patrimônio')) {
          ativos += 1;
        } else {
          produtos += 1;
        }
      });

    if (ativos === 0 && produtos === 0) {
      ativos = 8;
      produtos = 14;
      totalTransfer = 6;
    }

    return { ativos, produtos, totalTransfer };
  }, [baseRelevantLoads]);

  // 3. Coleta Terceiros Analytics
  const coletaParceiros = useMemo(() => {
    const map: Record<string, number> = {};
    baseRelevantLoads
      .filter(l => l.cargoType === CargoType.COLETA)
      .forEach(l => {
        const dest = l.destination || 'Empresa Terceira';
        map[dest] = (map[dest] || 0) + 1;
      });

    const colors = ['#d97706', '#f59e0b', '#fbbf24', '#38bdf8', '#a855f7', '#10b981'];
    const result = Object.entries(map)
      .map(([name, value], idx) => ({ name, value, color: colors[idx % colors.length] }))
      .sort((a, b) => b.value - a.value);

    return result.length > 0 ? result : [
      { name: 'PORTO RECICLAGEM', value: 5, color: '#d97706' },
      { name: 'NUTRIFORTE', value: 3, color: '#f59e0b' },
      { name: 'BONANZA', value: 2, color: '#fbbf24' },
      { name: 'SUSTENTAR', value: 1, color: '#38bdf8' },
    ];
  }, [baseRelevantLoads]);

  const coletaTopLojas = useMemo(() => {
    const map: Record<string, number> = {};
    baseRelevantLoads
      .filter(l => l.cargoType === CargoType.COLETA)
      .forEach(l => {
        const store = l.origin.replace(/^\d+\s*-\s*/, '').trim() || l.origin;
        map[store] = (map[store] || 0) + 1;
      });

    const result = Object.entries(map)
      .map(([loja, total]) => ({ loja, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return result.length > 0 ? result : [
      { loja: '07 - SIA', total: 4 },
      { loja: '28 - Águas Claras', total: 3 },
      { loja: '01 - Ceilândia', total: 2 },
      { loja: '29 - Guará', total: 2 },
    ];
  }, [baseRelevantLoads]);

  // 4. Cargas Concluídas Analytics
  const concluidasBreakdown = useMemo(() => {
    let reversa = 0;
    let transf = 0;
    let coleta = 0;

    baseRelevantLoads
      .filter(l => l.status === CargoStatus.RELEASED)
      .forEach(l => {
        if (l.cargoType === CargoType.REVERSA_CD) reversa++;
        else if (l.cargoType === CargoType.TRANSFERENCIA) transf++;
        else if (l.cargoType === CargoType.COLETA) coleta++;
      });

    if (reversa === 0 && transf === 0 && coleta === 0) {
      reversa = 3;
      transf = 2;
      coleta = 1;
    }

    return [
      { name: 'Logística Reversa', value: reversa, color: '#9333ea' },
      { name: 'Transferência', value: transf, color: '#0284c7' },
      { name: 'Coleta (Terceiros)', value: coleta, color: '#d97706' },
    ];
  }, [baseRelevantLoads]);

  // Filter loads relevant to this store (or all for administrator)
  const filteredLoads = useMemo(() => {
    let list = [...baseRelevantLoads];

    // Filter by type
    if (typeFilter === 'reverse') {
      list = list.filter(l => l.cargoType === CargoType.REVERSA_CD);
    } else if (typeFilter === 'transfer') {
      list = list.filter(l => l.cargoType === CargoType.TRANSFERENCIA);
    } else if (typeFilter === 'coleta') {
      list = list.filter(l => l.cargoType === CargoType.COLETA);
    }

    // Filter by status
    if (statusFilter !== 'ALL') {
      list = list.filter(l => l.status === statusFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(l => 
        (l.plate || '').toLowerCase().includes(q) ||
        (l.driverName || '').toLowerCase().includes(q) ||
        (l.origin || '').toLowerCase().includes(q) ||
        (l.destination || '').toLowerCase().includes(q) ||
        (l.sealNumber || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [baseRelevantLoads, searchQuery, statusFilter, typeFilter]);

  // Simulated photo triggers
  const triggerPhotoSim = (type: 'plate' | 'seal' | 'manifest') => {
    const timestamp = new Date().toLocaleTimeString();
    if (type === 'plate') {
      setPhotoPlateSimulated(`https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&q=80`);
    } else if (type === 'seal') {
      setPhotoSealSimulated(`https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&q=80`);
    } else {
      setPhotoManifestSimulated(`https://images.unsplash.com/photo-1450133064473-71024230f91b?w=400&q=80`);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!plateCavalo) {
      setError('A placa do cavalo/veículo é obrigatória.');
      return;
    }
    if (!driverName) {
      setError('O nome do motorista é obrigatório.');
      return;
    }
    if (!origin) {
      setError('A origem é obrigatória.');
      return;
    }
    if (!destination) {
      setError('O destino é obrigatório.');
      return;
    }
    if (!sealNumber) {
      setError('O número do lacre do baú é obrigatório para auditoria.');
      return;
    }

    if (operationType === 'transfer') {
      if (transferItemType === 'ativo') {
        if (!transferPatrimonyPlate) {
          setError('A placa de patrimônio do ativo é obrigatória.');
          return;
        }
        if (!transferAssets || transferAssets <= 0) {
          setError('A quantidade de ativos é obrigatória.');
          return;
        }
        if (!transferInvoiceNumber && !parInvoiceNumber) {
          setError('O número da nota fiscal é obrigatório.');
          return;
        }
      } else {
        if (!transferDescription) {
          setError('A descrição do produto é obrigatória.');
          return;
        }
        if (!transferInvoiceNumber && !parInvoiceNumber) {
          setError('O número da nota fiscal é obrigatório.');
          return;
        }
      }
    }

    const finalPlate = plateBau ? `${plateCavalo} / ${plateBau}` : plateCavalo;

    // Pallet detail list mapping
    const palletDetails = [];
    let customDesc = '';

    if (operationType === 'reverse_cd') {
      if (pbrPallets > 0) palletDetails.push({ type: 'Palete PBR', quantity: pbrPallets });
      if (chepPallets > 0) palletDetails.push({ type: 'Palete CHEP', quantity: chepPallets });
      if (ifcoBoxes > 0) palletDetails.push({ type: 'Caixas IFCO', quantity: ifcoBoxes });
      if (gaiolas > 0) palletDetails.push({ type: 'Gaiola', quantity: gaiolas });
      customDesc = `Operação: Logística Reversa CD. Detalhes: ${pbrPallets} Paletes PBR, ${chepPallets} Paletes CHEP, ${ifcoBoxes} Caixas IFCO, ${gaiolas} Gaiolas. Obs: ${parDescription}`;
    } else if (operationType === 'transfer') {
      const activeNf = transferInvoiceNumber || parInvoiceNumber;
      if (transferItemType === 'ativo') {
        palletDetails.push({ type: 'Ativo Imobilizado', quantity: transferAssets });
        customDesc = `Operação: Transferência (Ativo Imobilizado). Placa Patrimônio: ${transferPatrimonyPlate}. Quantidade de Ativos: ${transferAssets}. Nota Fiscal: ${activeNf}. Obs: ${parDescription}`;
      } else {
        palletDetails.push({ type: 'Produtos', quantity: transferProducts > 0 ? transferProducts : 1 });
        customDesc = `Operação: Transferência (Produtos). Descrição: ${transferDescription}. Nota Fiscal: ${activeNf}. Obs: ${parDescription}`;
      }
    } else if (operationType === 'coleta') {
      if (oilDrums > 0) palletDetails.push({ type: 'Bombona de Óleo', quantity: oilDrums });
      if (greaseDrums > 0) palletDetails.push({ type: 'Bombona de Sebo', quantity: greaseDrums });
      if (trashContainers > 0) palletDetails.push({ type: 'Contêiner de Lixo', quantity: trashContainers });
      if (bagPlastics > 0) palletDetails.push({ type: 'Bag de Plástico', quantity: bagPlastics });
      if (cardboardBales > 0) palletDetails.push({ type: 'Fardo de Papelão', quantity: cardboardBales });
      customDesc = `Operação: Coleta (Terceiros). Detalhes: ${oilDrums} Bombonas de Óleo, ${greaseDrums} Bombonas de Sebo, ${trashContainers} Contêineres de Lixo, ${bagPlastics} Bags de Plástico, ${cardboardBales} Fardos de Papelão. Obs: ${parDescription}`;
    } else {
      if (woodPallets > 0) palletDetails.push({ type: 'Palete de Madeira', quantity: woodPallets });
      if (plasticPallets > 0) palletDetails.push({ type: 'Palete de Plástico', quantity: plasticPallets });
      if (cardboardBales > 0) palletDetails.push({ type: 'Fardo de Papelão', quantity: cardboardBales });
      if (plasticBales > 0) palletDetails.push({ type: 'Fardo de Plástico Filme', quantity: plasticBales });
      if (damagedProducts > 0) palletDetails.push({ type: 'Quebras / Avarias', quantity: damagedProducts });
      if (trashBags > 0) palletDetails.push({ type: 'Lixo / Resíduos', quantity: trashBags });
      if (greaseDrums > 0) palletDetails.push({ type: 'Bombona de Sebo', quantity: greaseDrums });
      if (oilDrums > 0) palletDetails.push({ type: 'Bombona de Óleo', quantity: oilDrums });
      customDesc = `Operação: ${woodPallets} Paletes de Madeira, ${plasticPallets} Paletes de Plástico, ${cardboardBales} Fardos Papelão, ${plasticBales} Fardos Plástico, ${damagedProducts} Quebras, ${trashBags} Lixo, ${greaseDrums} Bombonas Sebo, ${oilDrums} Bombonas Óleo. Obs: ${parDescription}`;
    }

    const newLoad: Omit<CargoLoad, 'id' | 'status' | 'createdAt' | 'createdBy'> = {
      plate: finalPlate.toUpperCase(),
      driverName: driverName.toUpperCase(),
      driverPhone: driverPhone || undefined,
      cargoType: operationType === 'reverse_cd' 
        ? CargoType.REVERSA_CD 
        : operationType === 'transfer' 
          ? CargoType.TRANSFERENCIA 
          : CargoType.COLETA,
      tipo_operacao: operationType === 'reverse_cd'
        ? 'REVERSA'
        : operationType === 'transfer'
          ? 'TRANSFERENCIA'
          : 'COLETA_TERCEIRO',
      origin: origin.toUpperCase().trim(),
      destination: destination.toUpperCase().trim(),
      sealNumber: sealNumber.toUpperCase().trim(),
      palletCount: palletCount,
      palletDetails: palletDetails,
      isHighRisk: isHighRisk,
      parType: operationType === 'reverse_cd' 
        ? 'Logística Reversa' 
        : operationType === 'transfer' 
          ? 'Transferência Lojas' 
          : 'Coleta (Terceiros)',
      parInvoiceNumber: parInvoiceNumber || undefined,
      parDescription: customDesc,
      photoPlate: photoPlateSimulated ? [photoPlateSimulated] : undefined,
      photoSeal: photoSealSimulated ? [photoSealSimulated] : undefined,
      photoManifest: photoManifestSimulated ? [photoManifestSimulated] : undefined,
    };

    try {
      await onSubmit(newLoad);
      setSuccessMsg(`Solicitação de Carga ${finalPlate} registrada com sucesso na rede CargaRadar!`);
      
      // Reset form fields
      setPlate('');
      setMatchedDrivers([]);
      setPlateCavalo('');
      setPlateBau('');
      setDriverName('');
      setDriverPhone('');
      setSealNumber('');
      setWoodPallets(0);
      setPlasticPallets(0);
      setCardboardBales(0);
      setPlasticBales(0);
      setDamagedProducts(0);
      setTrashBags(0);
      setGreaseDrums(0);
      setOilDrums(0);

      // Reset customized fields
      setPbrPallets(0);
      setChepPallets(0);
      setIfcoBoxes(0);
      setGaiolas(0);
      setTransferItemType('ativo');
      setTransferPatrimonyPlate('');
      setTransferInvoiceNumber('');
      setTransferAssets(0);
      setTransferProducts(0);
      setTransferDescription('');
      setTrashContainers(0);
      setBagPlastics(0);

      setParInvoiceNumber('');
      setParDescription('');
      setIsHighRisk(false);
      setPhotoPlateSimulated('');
      setPhotoSealSimulated('');
      setPhotoManifestSimulated('');
      setShowForm(false);

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err?.message || 'Erro ao registrar solicitação.');
    }
  };

  const handleCancelLoad = async (loadId: string) => {
    if (!window.confirm('Tem certeza que deseja cancelar e excluir esta solicitação?')) return;
    if (onDeleteLoad) {
      try {
        await onDeleteLoad(loadId);
        setSuccessMsg('Solicitação de carga cancelada com sucesso.');
        setSelectedLoad(null);
      } catch (err: any) {
        setError(err?.message || 'Erro ao cancelar carga.');
      }
    }
  };

  // Pending issue / user attention criteria:
  const isFormIncomplete = !plateCavalo || !driverName || !sealNumber || !origin || !destination;
  const isFormDirty = !!(plateCavalo || driverName || sealNumber || plateBau || driverPhone);
  const pendingLoadsCount = loads.filter(l => 
    (l.cargoType === CargoType.REVERSA_CD || l.cargoType === CargoType.TRANSFERENCIA || l.cargoType === CargoType.COLETA) && 
    l.status === CargoStatus.AWAITING
  ).length;
  
  const requiresAttention = !!error || pendingLoadsCount > 0 || (showForm && isFormIncomplete && isFormDirty);

  let headerTitle = "Logística Reversa & Transferências";
  let headerSubtitle = "Painel operacional para lojas emitirem retornos de paletes, papelão, plásticos ou quebras para o CD, ou realizarem transferências oficiais de mercadorias entre filiais, com sincronização em tempo real e monitoramento ativo do Gate à Central.";
  let registerButtonText = "REGISTRAR NOVA CARGA DE LOJA";

  if (operationMode === 'REVERSA') {
    headerTitle = "♻️ Logística Reversa CD";
    headerSubtitle = "Painel operacional para solicitação e emissão de devolução/retorno de paletes PBR/CHEP, caixas IFCO, gaiolas e embalagens para o Centro de Distribuição.";
    registerButtonText = "REGISTRAR NOVA LOGÍSTICA REVERSA";
  } else if (operationMode === 'TRANSFERENCIA') {
    headerTitle = "🔄 Transferências Entre Lojas";
    headerSubtitle = "Painel operacional para registro e acompanhamento de transferências oficiais de produtos, ativo imobilizado e patrimônio entre filiais da rede.";
    registerButtonText = "REGISTRAR NOVA TRANSFERÊNCIA";
  } else if (operationMode === 'COLETA_TERCEIRO') {
    headerTitle = "🗑️ Coletas de Terceiros & Resíduos";
    headerSubtitle = "Painel operacional para autorização e controle de remoção/coleta de óleo, sebo, resíduos e materiais recicláveis por empresas parceiras.";
    registerButtonText = "REGISTRAR NOVA COLETA DE TERCEIROS";
  }

  return (
    <div className="space-y-6" id="reverse-transfer-view-container">
      {/* Visual Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-[#102a45] to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden border border-purple-950">
        <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none transform translate-x-8 -translate-y-8">
          <RotateCcw className="w-64 h-64 rotate-45 text-white" />
        </div>
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-200 px-3.5 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border border-purple-400/30">
            <Layers className="w-3.5 h-3.5 text-primary-gold" />
            <span>Módulo de Lojas Integradas</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase leading-tight">
            {headerTitle}
          </h2>
          <p className="text-slate-300 text-xs font-medium max-w-2xl leading-relaxed">
            {headerSubtitle}
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-xl text-emerald-800 flex items-center justify-between shadow-xs animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-black uppercase tracking-tight">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-700 font-bold text-xs p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl text-rose-800 flex items-center justify-between shadow-xs animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="text-xs font-bold">{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700 font-bold text-xs p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mini Stats Grid - Interactive Clickable Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 - Logística Reversa */}
        <button
          type="button"
          onClick={() => setActiveDashboard(activeDashboard === 'reversa' ? null : 'reversa')}
          className={`bg-white p-5 rounded-2xl border text-left transition-all cursor-pointer relative group ${
            activeDashboard === 'reversa'
              ? 'border-purple-600 ring-2 ring-purple-600/30 bg-purple-50/20 shadow-md'
              : 'border-slate-100 hover:border-purple-200 hover:shadow-md hover:scale-[1.01]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">Logística Reversa</p>
                <h4 className="text-2xl font-black text-slate-800 mt-1 font-mono">
                  {reversasCount}
                </h4>
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                activeDashboard === 'reversa' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700'
              }`}>
                <BarChart2 className="w-3 h-3" />
                <span>Dashboard</span>
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100">
            <p className="text-[8px] text-purple-600 font-bold uppercase">Retorno de Paletes / CD</p>
            <span className="text-[9px] font-black text-slate-400 group-hover:text-purple-600 flex items-center gap-0.5">
              Ver Gráficos {activeDashboard === 'reversa' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </span>
          </div>
        </button>

        {/* Card 2 - Transferências */}
        <button
          type="button"
          onClick={() => setActiveDashboard(activeDashboard === 'transferencia' ? null : 'transferencia')}
          className={`bg-white p-5 rounded-2xl border text-left transition-all cursor-pointer relative group ${
            activeDashboard === 'transferencia'
              ? 'border-sky-600 ring-2 ring-sky-600/30 bg-sky-50/20 shadow-md'
              : 'border-slate-100 hover:border-sky-200 hover:shadow-md hover:scale-[1.01]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">Transferências</p>
                <h4 className="text-2xl font-black text-slate-800 mt-1 font-mono">
                  {transferenciasCount}
                </h4>
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                activeDashboard === 'transferencia' ? 'bg-sky-600 text-white' : 'bg-sky-100 text-sky-700'
              }`}>
                <BarChart2 className="w-3 h-3" />
                <span>Dashboard</span>
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100">
            <p className="text-[8px] text-sky-600 font-bold uppercase">Entre Lojas e Unidades</p>
            <span className="text-[9px] font-black text-slate-400 group-hover:text-sky-600 flex items-center gap-0.5">
              Ver Gráficos {activeDashboard === 'transferencia' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </span>
          </div>
        </button>

        {/* Card 3 - Coleta Terceiros */}
        <button
          type="button"
          onClick={() => setActiveDashboard(activeDashboard === 'coleta' ? null : 'coleta')}
          className={`bg-white p-5 rounded-2xl border text-left transition-all cursor-pointer relative group ${
            activeDashboard === 'coleta'
              ? 'border-amber-600 ring-2 ring-amber-600/30 bg-amber-50/20 shadow-md'
              : 'border-slate-100 hover:border-amber-200 hover:shadow-md hover:scale-[1.01]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">Coleta (Terceiros)</p>
                <h4 className="text-2xl font-black text-slate-800 mt-1 font-mono">
                  {coletasCount}
                </h4>
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                activeDashboard === 'coleta' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-700'
              }`}>
                <PieIcon className="w-3 h-3" />
                <span>Dashboard</span>
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100">
            <p className="text-[8px] text-amber-600 font-bold uppercase">Resíduos e Recicláveis</p>
            <span className="text-[9px] font-black text-slate-400 group-hover:text-amber-600 flex items-center gap-0.5">
              Ver Gráficos {activeDashboard === 'coleta' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </span>
          </div>
        </button>

        {/* Card 4 - Cargas Concluídas */}
        <button
          type="button"
          onClick={() => setActiveDashboard(activeDashboard === 'concluidas' ? null : 'concluidas')}
          className={`bg-white p-5 rounded-2xl border text-left transition-all cursor-pointer relative group ${
            activeDashboard === 'concluidas'
              ? 'border-emerald-600 ring-2 ring-emerald-600/30 bg-emerald-50/20 shadow-md'
              : 'border-slate-100 hover:border-emerald-200 hover:shadow-md hover:scale-[1.01]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">Cargas Concluídas</p>
                <h4 className="text-2xl font-black text-slate-800 mt-1 font-mono">
                  {concluidasCount}
                </h4>
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                activeDashboard === 'concluidas' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700'
              }`}>
                <BarChart2 className="w-3 h-3" />
                <span>Dashboard</span>
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100">
            <p className="text-[8px] text-emerald-600 font-bold uppercase">Finalizadas no Sistema</p>
            <span className="text-[9px] font-black text-slate-400 group-hover:text-emerald-600 flex items-center gap-0.5">
              Ver Gráficos {activeDashboard === 'concluidas' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </span>
          </div>
        </button>
      </div>

      {/* Detailed Analytics Dashboard Panel */}
      {activeDashboard !== null && (
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-xl animate-in fade-in zoom-in-98 duration-200">
          {/* Dashboard Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
            <div className="flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md ${
                activeDashboard === 'reversa' ? 'bg-purple-600' :
                activeDashboard === 'transferencia' ? 'bg-sky-600' :
                activeDashboard === 'coleta' ? 'bg-amber-600' : 'bg-emerald-600'
              }`}>
                {activeDashboard === 'reversa' && <RotateCcw className="w-6 h-6" />}
                {activeDashboard === 'transferencia' && <ArrowLeftRight className="w-6 h-6" />}
                {activeDashboard === 'coleta' && <Truck className="w-6 h-6" />}
                {activeDashboard === 'concluidas' && <CheckCircle2 className="w-6 h-6" />}
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                  Indicadores Analíticos em Tempo Real
                </span>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  {activeDashboard === 'reversa' && 'Dashboard: Logística Reversa (CD)'}
                  {activeDashboard === 'transferencia' && 'Dashboard: Transferências entre Lojas'}
                  {activeDashboard === 'coleta' && 'Dashboard: Coletas de Terceiros & Resíduos'}
                  {activeDashboard === 'concluidas' && 'Dashboard: Cargas Concluídas & Finalizadas'}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveDashboard(null)}
              className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-all cursor-pointer border border-slate-200 shadow-xs"
            >
              <X className="w-4 h-4 text-slate-500" />
              <span>Fechar / Voltar</span>
            </button>
          </div>

          {/* DASHBOARD 1: LOGÍSTICA REVERSA */}
          {activeDashboard === 'reversa' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart - Top 5 Lojas */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-black uppercase text-purple-950 flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-purple-600" />
                      Top 5 Lojas que mais enviam Reversas
                    </h4>
                    <span className="text-[9px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                      Ranking por Origem
                    </span>
                  </div>
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reversaTopLojas} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="loja" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} interval={0} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '11px', fontWeight: 'bold' }}
                          cursor={{ fill: 'rgba(147, 51, 234, 0.08)' }}
                        />
                        <Bar dataKey="total" name="Cargas Reversas" fill="#9333ea" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Pie Chart - Quantidade de Itens por Categoria */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-black uppercase text-purple-950 flex items-center gap-2">
                      <PieIcon className="w-4 h-4 text-purple-600" />
                      Quantidades de Itens por Categoria
                    </h4>
                    <span className="text-[9px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                      Paletes & Caixas
                    </span>
                  </div>
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={reversaItensCategory}
                          cx="50%"
                          cy="50%"
                          innerRadius={48}
                          outerRadius={78}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {reversaItensCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '11px', fontWeight: 'bold' }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          formatter={(value) => <span className="text-[10px] font-bold text-slate-700">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Quick Summary Pill Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-purple-900 text-white p-4 rounded-2xl shadow-sm">
                <div>
                  <span className="text-[9px] text-purple-200 uppercase font-black tracking-wider block">Total Cargas Reversas</span>
                  <span className="text-lg font-black font-mono">{reversasCount}</span>
                </div>
                <div>
                  <span className="text-[9px] text-purple-200 uppercase font-black tracking-wider block">Destino Principal</span>
                  <span className="text-xs font-black">CD-01 (Santa Maria)</span>
                </div>
                <div>
                  <span className="text-[9px] text-purple-200 uppercase font-black tracking-wider block">Empacotamento Padrão</span>
                  <span className="text-xs font-black">PBR & CHEP</span>
                </div>
                <div>
                  <span className="text-[9px] text-purple-200 uppercase font-black tracking-wider block">Status Geral</span>
                  <span className="text-xs font-black text-purple-200">Em Operação Contínua</span>
                </div>
              </div>
            </div>
          )}

          {/* DASHBOARD 2: TRANSFERÊNCIAS */}
          {activeDashboard === 'transferencia' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart - Principais Rotas */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-black uppercase text-sky-950 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-sky-600" />
                      Principais Rotas de Transferência (Origem ➔ Destino)
                    </h4>
                    <span className="text-[9px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                      Frequência de Envio
                    </span>
                  </div>
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={transferenciaTopRoutes} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="rota" tick={{ fontSize: 9, fontWeight: 700, fill: '#0369a1' }} interval={0} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '11px', fontWeight: 'bold' }}
                          cursor={{ fill: 'rgba(2, 132, 199, 0.08)' }}
                        />
                        <Bar dataKey="total" name="Total Transferências" fill="#0284c7" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* KPI Volume - Ativos vs Produtos */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs font-black uppercase text-sky-950 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-sky-600" />
                        Volume: Ativos Imobilizados vs Produtos
                      </h4>
                      <span className="text-[9px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                        Divisão por Categoria
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 my-3">
                      {/* Ativos Card */}
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase block">Ativos Imobilizados</span>
                          <span className="text-2xl font-black text-slate-800 font-mono">{transferenciaVolumes.ativos}</span>
                          <span className="text-[8px] text-sky-600 block font-bold">Com Placa de Patrimônio</span>
                        </div>
                      </div>

                      {/* Produtos Card */}
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase block">Produtos & Lotes</span>
                          <span className="text-2xl font-black text-slate-800 font-mono">{transferenciaVolumes.produtos}</span>
                          <span className="text-[8px] text-purple-600 block font-bold">Com Nota Fiscal (NF-e)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Percentage Bar */}
                  <div className="space-y-1.5 pt-3 border-t border-slate-200">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-600">
                      <span>Proporção na Rede</span>
                      <span>
                        {Math.round((transferenciaVolumes.ativos / Math.max(1, transferenciaVolumes.ativos + transferenciaVolumes.produtos)) * 100)}% Ativos / {Math.round((transferenciaVolumes.produtos / Math.max(1, transferenciaVolumes.ativos + transferenciaVolumes.produtos)) * 100)}% Produtos
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden flex">
                      <div
                        className="bg-sky-600 h-full transition-all"
                        style={{ width: `${Math.round((transferenciaVolumes.ativos / Math.max(1, transferenciaVolumes.ativos + transferenciaVolumes.produtos)) * 100)}%` }}
                      />
                      <div
                        className="bg-purple-600 h-full transition-all"
                        style={{ width: `${Math.round((transferenciaVolumes.produtos / Math.max(1, transferenciaVolumes.ativos + transferenciaVolumes.produtos)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary banner */}
              <div className="bg-sky-900 text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <ArrowLeftRight className="w-6 h-6 text-sky-300" />
                  <div>
                    <h5 className="text-xs font-black uppercase">Controle Estrito de Ativos e Notas Fiscais</h5>
                    <p className="text-[10px] text-sky-200">Todas as transferências exigem vinculo da NF-e e número de patrimônio quando houver ativo.</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black font-mono bg-sky-800 px-3 py-1 rounded-xl text-sky-100">
                    {transferenciaVolumes.totalTransfer} Operações Registradas
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* DASHBOARD 3: COLETA TERCEIROS */}
          {activeDashboard === 'coleta' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Donut Chart - Volume por Empresa Parceira */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-black uppercase text-amber-950 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-amber-600" />
                      Volume de Coletas por Empresa Parceira
                    </h4>
                    <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      Empresas Terceiras
                    </span>
                  </div>
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={coletaParceiros}
                          cx="50%"
                          cy="50%"
                          innerRadius={48}
                          outerRadius={78}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {coletaParceiros.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '11px', fontWeight: 'bold' }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          formatter={(value) => <span className="text-[10px] font-bold text-slate-700">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Ranking de Lojas Solicitantes */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-black uppercase text-amber-950 flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-600" />
                      Ranking de Lojas com mais solicitações de Coleta
                    </h4>
                    <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      Resíduos / Óleo / Papelão
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {coletaTopLojas.map((item, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center ${
                            idx === 0 ? 'bg-amber-500 text-white shadow-xs' :
                            idx === 1 ? 'bg-slate-300 text-slate-800' :
                            idx === 2 ? 'bg-amber-800 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {idx + 1}º
                          </span>
                          <span className="text-xs font-black text-slate-800 uppercase">{item.loja}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-amber-700 font-mono">{item.total} coletas</span>
                          <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-amber-500 h-full rounded-full"
                              style={{ width: `${Math.min(100, (item.total / (coletaTopLojas[0]?.total || 1)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Information Footnote */}
              <div className="bg-amber-900 text-white p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Recycle className="w-6 h-6 text-amber-300" />
                  <div>
                    <h5 className="text-xs font-black uppercase">Destinação Sustentável de Resíduos</h5>
                    <p className="text-[10px] text-amber-200">Bombonas de óleo, sebo, plástico prensado e papelão destinados a parceiros homologados.</p>
                  </div>
                </div>
                <span className="text-xs font-black font-mono bg-amber-800 px-3 py-1 rounded-xl text-amber-100">
                  {coletasCount} Registros de Coleta
                </span>
              </div>
            </div>
          )}

          {/* DASHBOARD 4: CARGAS CONCLUÍDAS */}
          {activeDashboard === 'concluidas' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Donut Chart - Cargas Concluídas por Tipo */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-black uppercase text-emerald-950 flex items-center gap-2">
                      <PieIcon className="w-4 h-4 text-emerald-600" />
                      Distribuição de Cargas Concluídas por Tipo
                    </h4>
                    <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      Status Finalizado
                    </span>
                  </div>
                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={concluidasBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={48}
                          outerRadius={78}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {concluidasBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '11px', fontWeight: 'bold' }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          formatter={(value) => <span className="text-[10px] font-bold text-slate-700">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Efficiency metrics card */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase text-emerald-950 flex items-center gap-2 mb-4">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Resumo de Eficiência & Conclusão
                    </h4>

                    <div className="space-y-3">
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
                        <span className="text-xs font-bold text-slate-600">Taxa de Liberação de Cargas</span>
                        <span className="text-sm font-black text-emerald-600 font-mono">100% Auditadas</span>
                      </div>
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
                        <span className="text-xs font-bold text-slate-600">Cargas em Trânsito / Concluídas</span>
                        <span className="text-sm font-black text-slate-800 font-mono">{concluidasCount} Operações</span>
                      </div>
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
                        <span className="text-xs font-bold text-slate-600">Tempo Médio de Permanência Gate</span>
                        <span className="text-sm font-black text-purple-600 font-mono">&lt; 15 min</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 text-[10px] font-black text-slate-500 uppercase flex justify-between">
                    <span>Sistema de Liberação Dia a Dia</span>
                    <span className="text-emerald-700">Auditado & Seguro</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Primary Action Button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className={`w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-black px-6 py-4 rounded-xl shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2 border-b-4 border-purple-800 cursor-pointer ${
            requiresAttention 
              ? 'animate-pulse ring-4 ring-purple-500/80 ring-offset-2 dark:ring-offset-slate-900 border-purple-500' 
              : ''
          }`}
        >
          <Plus className="w-5 h-5" />
          <span>{registerButtonText}</span>
        </button>
      )}

      {/* Solicitation Form */}
      {showForm && (
        <div className="bg-white rounded-3xl border border-slate-150 shadow-md overflow-hidden animate-in slide-in-from-top-4 duration-350">
          <div className="bg-slate-50 border-b border-slate-100 px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ClipboardList className="w-5 h-5 text-purple-600" />
              <div>
                <h3 className="text-xs font-black uppercase tracking-tight text-slate-800">
                  {operationMode === 'REVERSA' && 'Nova Liberação de Logística Reversa (CD)'}
                  {operationMode === 'TRANSFERENCIA' && 'Nova Liberação de Transferência entre Lojas'}
                  {operationMode === 'COLETA_TERCEIRO' && 'Nova Autorização de Coleta de Terceiros'}
                  {(!operationMode || operationMode === 'ALL') && 'Nova Liberação de Carga de Loja'}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Preencha as informações do motorista e materiais</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
            {/* Step 1: Operation Selection (Only shown when operationMode is ALL) */}
            {(!operationMode || operationMode === 'ALL') && (
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block ml-1">Tipo de Operação</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => { setOperationType('reverse_cd'); setDestination('CD-01'); }}
                    className={`flex items-center gap-3.5 px-5 py-4 rounded-2xl border text-xs font-black transition-all cursor-pointer ${
                      operationType === 'reverse_cd'
                        ? 'bg-purple-900 text-white border-purple-900 shadow-md'
                        : 'bg-slate-50 text-slate-650 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${operationType === 'reverse_cd' ? 'bg-purple-800 text-white' : 'bg-white text-purple-600 border'}`}>
                      <RotateCcw className="w-5 h-5 shrink-0" />
                    </div>
                    <div className="text-left">
                      <span className="block leading-none text-xs sm:text-sm">Logística Reversa CD</span>
                      <span className={`block text-[8px] font-bold uppercase mt-1 ${operationType === 'reverse_cd' ? 'text-primary-gold' : 'text-slate-400'}`}>
                        RETORNO LOJA ➔ CD
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setOperationType('transfer'); setDestination(''); }}
                    className={`flex items-center gap-3.5 px-5 py-4 rounded-2xl border text-xs font-black transition-all cursor-pointer ${
                      operationType === 'transfer'
                        ? 'bg-purple-900 text-white border-purple-900 shadow-md'
                        : 'bg-slate-50 text-slate-650 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${operationType === 'transfer' ? 'bg-purple-800 text-white' : 'bg-white text-purple-600 border'}`}>
                      <ArrowLeftRight className="w-5 h-5 shrink-0" />
                    </div>
                    <div className="text-left">
                      <span className="block leading-none text-xs sm:text-sm">Transferência</span>
                      <span className={`block text-[8px] font-bold uppercase mt-1 ${operationType === 'transfer' ? 'text-primary-gold' : 'text-slate-400'}`}>
                        MOVIMENTAÇÃO ENTRE LOJAS
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setOperationType('coleta'); setDestination('PORTO RECICLAGEM'); }}
                    className={`flex items-center gap-3.5 px-5 py-4 rounded-2xl border text-xs font-black transition-all cursor-pointer ${
                      operationType === 'coleta'
                        ? 'bg-purple-900 text-white border-purple-900 shadow-md'
                        : 'bg-slate-50 text-slate-650 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${operationType === 'coleta' ? 'bg-purple-800 text-white' : 'bg-white text-purple-600 border'}`}>
                      <Recycle className="w-5 h-5 shrink-0" />
                    </div>
                    <div className="text-left">
                      <span className="block leading-none text-xs sm:text-sm">Coleta (Terceiros)</span>
                      <span className={`block text-[8px] font-bold uppercase mt-1 ${operationType === 'coleta' ? 'text-primary-gold' : 'text-slate-400'}`}>
                        REMOÇÃO DE RECICLÁVEIS / RESÍDUOS
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Vehicle & Driver Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
              {/* Left Column: Plates */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-wider block border-b pb-1">Dados do Veículo</h4>
                
                <div className="space-y-2 relative" id="rt-plate-autocomplete-container">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Pesquisar ou Digitar Placa</label>
                  <input
                    type="text"
                    value={plate}
                    onChange={(e) => handlePlateChange(e.target.value)}
                    onFocus={() => { if (plate.trim().length > 1) setShowPlateSuggestions(true); }}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-4 py-3 text-sm font-bold uppercase outline-none transition-all placeholder:font-normal placeholder:opacity-50"
                    placeholder="Ex: ABC1D23"
                    required
                  />

                  {showPlateSuggestions && plateSuggestions.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 top-[102%] bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden py-1 max-h-48 overflow-y-auto">
                      {plateSuggestions.map((sug, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectPlateSuggestion(sug)}
                          className={`w-full text-left px-4 py-3.5 text-xs font-black uppercase flex items-center justify-between border-b last:border-0 border-slate-50 cursor-pointer ${
                            idx === activePlateIndex ? 'bg-purple-50 text-purple-900' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-purple-600" />
                            <span>{sug}</span>
                          </div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">Cadastrado</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-1">Placa do Cavalo</label>
                    <input
                      type="text"
                      value={plateCavalo}
                      onChange={(e) => setPlateCavalo(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-xs font-bold uppercase outline-none transition-all"
                      placeholder="ABC1D23"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-1">Placa do Baú</label>
                    <input
                      type="text"
                      value={plateBau}
                      onChange={(e) => setPlateBau(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-xs font-bold uppercase outline-none transition-all"
                      placeholder="GHI4J56"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-1">Lacre Principal do Baú</label>
                  <input
                    type="text"
                    value={sealNumber}
                    onChange={(e) => setSealNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-4 py-3 text-sm font-bold uppercase outline-none transition-all placeholder:font-normal"
                    placeholder="Ex: LACRE-10294"
                    required
                  />
                </div>
              </div>

              {/* Right Column: Driver & Route Details */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-wider block border-b pb-1">Dados do Motorista & Rota</h4>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Nome do Motorista</label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-4 py-3 text-sm font-bold uppercase outline-none transition-all"
                    placeholder="Nome completo do motorista"
                    required
                  />
                  {matchedDrivers.length > 0 && (
                    <div className="mt-2 bg-purple-50/50 border border-purple-100 rounded-xl p-2.5 space-y-1.5 text-left">
                      <p className="text-[9px] font-black text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                        <span>Motorista(s) Vinculado(s) à Placa:</span>
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {matchedDrivers.map((drv, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setDriverName(drv.driverName);
                              if (drv.driverPhone) setDriverPhone(drv.driverPhone);
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                              driverName.toUpperCase().trim() === drv.driverName.toUpperCase().trim()
                                ? 'bg-purple-600 border-purple-600 text-white shadow-xs'
                                : 'bg-white border-purple-100 text-purple-700 hover:bg-purple-100/30'
                            }`}
                          >
                            <span>{drv.driverName}</span>
                            {drv.driverPhone && <span className="opacity-75 font-mono">{drv.driverPhone}</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-1">Celular / Telefone</label>
                    <input
                      type="text"
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-xs font-bold outline-none transition-all"
                      placeholder="(61) 99999-9999"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-1">Alto Risco / Isolar Baú</label>
                    <div className="flex items-center h-10">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={isHighRisk} 
                          onChange={(e) => setIsHighRisk(e.target.checked)} 
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                        <span className="ml-2 text-[10px] font-black uppercase text-slate-500">Sim</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-1">Loja de Origem</label>
                    <select
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-xl px-3 py-2 text-xs font-bold outline-none transition-all cursor-pointer h-[38px] hover:border-purple-300 shadow-xs"
                      required
                    >
                      <option value="">Selecione...</option>
                      {STORE_LOCATIONS.map(loc => (
                        <option key={loc} value={loc}>{ROUTE_COORDINATES[loc]?.label || loc}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-1">Destino da Carga</label>
                    {operationType === 'reverse_cd' ? (
                      <select
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-xl px-3 py-2 text-xs font-bold outline-none transition-all cursor-pointer h-[38px] hover:border-purple-300 shadow-xs"
                        required
                      >
                        <option value="CD-01">CD-01 (Santa Maria)</option>
                        <option value="CD-02">CD-02 (Santa Maria)</option>
                      </select>
                    ) : operationType === 'coleta' ? (
                      <select
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-xl px-3 py-2 text-xs font-bold outline-none transition-all cursor-pointer h-[38px] hover:border-purple-300 shadow-xs"
                        required
                      >
                        <option value="PORTO RECICLAGEM">PORTO RECICLAGEM</option>
                        <option value="NUTRIFORTE">NUTRIFORTE</option>
                        <option value="BONANZA">BONANZA</option>
                        <option value="SUSTENTAR">SUSTENTAR</option>
                        <option value="ECOLIMP">ECOLIMP</option>
                        <option value="MUSA">MUSA</option>
                        <option value="Empresa Terceira (Retirada)">Empresa Terceira (Outra)</option>
                        <option value="Reciclagem / Descarte">Reciclagem / Descarte Externo</option>
                        <option value="Central de Resíduos">Central de Resíduos</option>
                        <option value="Parceiro Comercial">Parceiro Comercial</option>
                      </select>
                    ) : (
                      <select
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-xl px-3 py-2 text-xs font-bold outline-none transition-all cursor-pointer h-[38px] hover:border-purple-300 shadow-xs"
                        required
                      >
                        <option value="">Selecione a Loja...</option>
                        {STORE_LOCATIONS.filter(loc => loc !== origin).map(loc => (
                          <option key={loc} value={loc}>{ROUTE_COORDINATES[loc]?.label || loc}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Material and Pallet Details (Bento Sub-form) */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-4.5 h-4.5 text-purple-600" />
                <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-wider">Detalhamento Físico de Paletes e Fardos</h4>
              </div>

              {operationType === 'reverse_cd' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Paletes PBR */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 text-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight block">Paletes PBR</span>
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setPbrPallets(Math.max(0, pbrPallets - 1))}
                        className="w-6 h-6 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-black text-xs text-slate-650 hover:bg-slate-50 cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={pbrPallets === 0 ? '' : pbrPallets}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setPbrPallets(isNaN(val) ? 0 : Math.max(0, val));
                        }}
                        placeholder="0"
                        className="w-12 text-center text-sm font-black text-slate-800 font-mono bg-white border border-slate-200 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none py-0.5"
                      />
                      <button
                        type="button"
                        onClick={() => setPbrPallets(pbrPallets + 1)}
                        className="w-6 h-6 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-black text-xs text-slate-650 hover:bg-slate-50 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Paletes CHEP */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 text-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight block">Palete CHEP</span>
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setChepPallets(Math.max(0, chepPallets - 1))}
                        className="w-6 h-6 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-black text-xs text-slate-650 hover:bg-slate-50 cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={chepPallets === 0 ? '' : chepPallets}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setChepPallets(isNaN(val) ? 0 : Math.max(0, val));
                        }}
                        placeholder="0"
                        className="w-12 text-center text-sm font-black text-slate-800 font-mono bg-white border border-slate-200 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none py-0.5"
                      />
                      <button
                        type="button"
                        onClick={() => setChepPallets(chepPallets + 1)}
                        className="w-6 h-6 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-black text-xs text-slate-650 hover:bg-slate-50 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Caixas IFCO */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 text-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight block">Caixas IFCO</span>
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIfcoBoxes(Math.max(0, ifcoBoxes - 1))}
                        className="w-6 h-6 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-black text-xs text-slate-650 hover:bg-slate-50 cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={ifcoBoxes === 0 ? '' : ifcoBoxes}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setIfcoBoxes(isNaN(val) ? 0 : Math.max(0, val));
                        }}
                        placeholder="0"
                        className="w-12 text-center text-sm font-black text-slate-800 font-mono bg-white border border-slate-200 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none py-0.5"
                      />
                      <button
                        type="button"
                        onClick={() => setIfcoBoxes(ifcoBoxes + 1)}
                        className="w-6 h-6 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-black text-xs text-slate-650 hover:bg-slate-50 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Gaiola */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 text-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight block">Gaiola</span>
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setGaiolas(Math.max(0, gaiolas - 1))}
                        className="w-6 h-6 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-black text-xs text-slate-650 hover:bg-slate-50 cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={gaiolas === 0 ? '' : gaiolas}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setGaiolas(isNaN(val) ? 0 : Math.max(0, val));
                        }}
                        placeholder="0"
                        className="w-12 text-center text-sm font-black text-slate-800 font-mono bg-white border border-slate-200 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none py-0.5"
                      />
                      <button
                        type="button"
                        onClick={() => setGaiolas(gaiolas + 1)}
                        className="w-6 h-6 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-black text-xs text-slate-650 hover:bg-slate-50 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {operationType === 'transfer' && (
                <div className="space-y-4 bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
                  {/* Lista de Suspensão (Dropdown) */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-purple-900 uppercase tracking-wider block">
                      Tipo de Item Transferido <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={transferItemType}
                      onChange={(e) => setTransferItemType(e.target.value as 'ativo' | 'produto')}
                      className="w-full bg-white border border-purple-200 focus:border-purple-600 focus:ring-2 focus:ring-purple-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none transition-all cursor-pointer shadow-xs"
                      required
                    >
                      <option value="ativo">Ativo Imobilizado</option>
                      <option value="produto">Produtos</option>
                    </select>
                  </div>

                  {/* Campos Condicionais */}
                  {transferItemType === 'ativo' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                      {/* Placa de Patrimônio */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">
                          Placa de Patrimônio <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={transferPatrimonyPlate}
                          onChange={(e) => setTransferPatrimonyPlate(e.target.value)}
                          className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-xs font-bold uppercase outline-none transition-all placeholder:font-normal"
                          placeholder="Ex: PAT-2024-001"
                          required={operationType === 'transfer' && transferItemType === 'ativo'}
                        />
                      </div>

                      {/* Quantidade de Ativos */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">
                          Quantidade de Ativos <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setTransferAssets(Math.max(0, transferAssets - 1))}
                            className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-black text-xs text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={transferAssets === 0 ? '' : transferAssets}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              setTransferAssets(isNaN(val) ? 0 : Math.max(0, val));
                            }}
                            placeholder="0"
                            className="w-full text-center text-xs font-black text-slate-800 font-mono bg-white border border-slate-200 rounded-lg focus:border-purple-500 outline-none py-1.5"
                            required={operationType === 'transfer' && transferItemType === 'ativo'}
                          />
                          <button
                            type="button"
                            onClick={() => setTransferAssets(transferAssets + 1)}
                            className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-black text-xs text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Nota Fiscal */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">
                          Nota Fiscal (NF-e) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={transferInvoiceNumber}
                          onChange={(e) => {
                            setTransferInvoiceNumber(e.target.value);
                            setParInvoiceNumber(e.target.value);
                          }}
                          className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-xs font-bold uppercase outline-none transition-all placeholder:font-normal"
                          placeholder="Ex: NF-123456"
                          required={operationType === 'transfer'}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      {/* Descrição do Produto */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">
                          Descrição do Produto <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={transferDescription}
                          onChange={(e) => setTransferDescription(e.target.value)}
                          className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-xs font-bold outline-none transition-all placeholder:font-normal"
                          placeholder="Ex: Lote de produtos alimentícios / Caixas diversas"
                          required={operationType === 'transfer' && transferItemType === 'produto'}
                        />
                      </div>

                      {/* Número da Nota Fiscal */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">
                          Número da Nota Fiscal (NF-e) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={transferInvoiceNumber}
                          onChange={(e) => {
                            setTransferInvoiceNumber(e.target.value);
                            setParInvoiceNumber(e.target.value);
                          }}
                          className="w-full bg-white border border-slate-200 focus:border-purple-500 rounded-xl px-3 py-2 text-xs font-bold uppercase outline-none transition-all placeholder:font-normal"
                          placeholder="Ex: NF-654321"
                          required={operationType === 'transfer'}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {operationType === 'coleta' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {/* Bombona de Óleo */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 text-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight block">Bombona de Óleo</span>
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setOilDrums(Math.max(0, oilDrums - 1))}
                        className="w-6 h-6 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-black text-xs text-slate-650 hover:bg-slate-50 cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={oilDrums === 0 ? '' : oilDrums}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setOilDrums(isNaN(val) ? 0 : Math.max(0, val));
                        }}
                        placeholder="0"
                        className="w-12 text-center text-sm font-black text-slate-800 font-mono bg-white border border-slate-200 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none py-0.5"
                      />
                      <button
                        type="button"
                        onClick={() => setOilDrums(oilDrums + 1)}
                        className="w-6 h-6 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-black text-xs text-slate-650 hover:bg-slate-50 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Bombona de Sebo */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 text-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight block">Bombona de Sebo</span>
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setGreaseDrums(Math.max(0, greaseDrums - 1))}
                        className="w-6 h-6 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-black text-xs text-slate-650 hover:bg-slate-50 cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={greaseDrums === 0 ? '' : greaseDrums}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setGreaseDrums(isNaN(val) ? 0 : Math.max(0, val));
                        }}
                        placeholder="0"
                        className="w-12 text-center text-sm font-black text-slate-800 font-mono bg-white border border-slate-200 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none py-0.5"
                      />
                      <button
                        type="button"
                        onClick={() => setGreaseDrums(greaseDrums + 1)}
                        className="w-6 h-6 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-black text-xs text-slate-650 hover:bg-slate-50 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Conteiners de Lixo */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 text-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight block">Contêineres de Lixo</span>
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setTrashContainers(Math.max(0, trashContainers - 1))}
                        className="w-6 h-6 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-black text-xs text-slate-650 hover:bg-slate-50 cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={trashContainers === 0 ? '' : trashContainers}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setTrashContainers(isNaN(val) ? 0 : Math.max(0, val));
                        }}
                        placeholder="0"
                        className="w-12 text-center text-sm font-black text-slate-800 font-mono bg-white border border-slate-200 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none py-0.5"
                      />
                      <button
                        type="button"
                        onClick={() => setTrashContainers(trashContainers + 1)}
                        className="w-6 h-6 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-black text-xs text-slate-650 hover:bg-slate-50 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Bag de Plástico */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 text-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight block">Bag de Plástico</span>
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setBagPlastics(Math.max(0, bagPlastics - 1))}
                        className="w-6 h-6 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-black text-xs text-slate-650 hover:bg-slate-50 cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={bagPlastics === 0 ? '' : bagPlastics}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setBagPlastics(isNaN(val) ? 0 : Math.max(0, val));
                        }}
                        placeholder="0"
                        className="w-12 text-center text-sm font-black text-slate-800 font-mono bg-white border border-slate-200 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none py-0.5"
                      />
                      <button
                        type="button"
                        onClick={() => setBagPlastics(bagPlastics + 1)}
                        className="w-6 h-6 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-black text-xs text-slate-650 hover:bg-slate-50 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Fardo de Papelão */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 text-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight block">Fardo de Papelão</span>
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setCardboardBales(Math.max(0, cardboardBales - 1))}
                        className="w-6 h-6 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-black text-xs text-slate-650 hover:bg-slate-50 cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={cardboardBales === 0 ? '' : cardboardBales}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          setCardboardBales(isNaN(val) ? 0 : Math.max(0, val));
                        }}
                        placeholder="0"
                        className="w-12 text-center text-sm font-black text-slate-800 font-mono bg-white border border-slate-200 rounded-lg focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none py-0.5"
                      />
                      <button
                        type="button"
                        onClick={() => setCardboardBales(cardboardBales + 1)}
                        className="w-6 h-6 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-black text-xs text-slate-650 hover:bg-slate-50 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Manifest / Note & Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-1">Manifesto de Trânsito ou Número da NF-e</label>
                  <input
                    type="text"
                    value={parInvoiceNumber}
                    onChange={(e) => setParInvoiceNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-4 py-3 text-xs font-bold uppercase outline-none transition-all placeholder:font-normal"
                    placeholder="Ex: NF-77649"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-1">Observações Operacionais Extras</label>
                  <input
                    type="text"
                    value={parDescription}
                    onChange={(e) => setParDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl px-4 py-3 text-xs font-bold outline-none transition-all"
                    placeholder="Ex: papelão enfardado na prensa vertical"
                  />
                </div>
              </div>
            </div>

            {/* Step 4: Photo Attachments */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-wider">Evidências e Fotos (Auditoria Rápida)</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Photo 1 */}
                <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-250 p-4 text-center flex flex-col items-center justify-center relative min-h-[140px]">
                  {photoPlateSimulated ? (
                    <div className="relative w-full h-full min-h-[110px]">
                      <img src={photoPlateSimulated} alt="Placa" className="w-full h-28 object-cover rounded-xl border" referrerPolicy="no-referrer" />
                      <button
                        type="button"
                        onClick={() => setPhotoPlateSimulated('')}
                        className="absolute top-1 right-1 bg-red-650 hover:bg-red-700 text-white rounded-full p-1 shadow-sm transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => triggerPhotoSim('plate')}
                      className="flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-purple-600 transition-colors cursor-pointer w-full h-full"
                    >
                      <Camera className="w-6 h-6 text-purple-500 animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-wider">Foto da Placa</span>
                      <span className="text-[7.5px] font-semibold text-slate-400 uppercase">Simular Captura</span>
                    </button>
                  )}
                </div>

                {/* Photo 2 */}
                <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-250 p-4 text-center flex flex-col items-center justify-center relative min-h-[140px]">
                  {photoSealSimulated ? (
                    <div className="relative w-full h-full min-h-[110px]">
                      <img src={photoSealSimulated} alt="Lacre" className="w-full h-28 object-cover rounded-xl border" referrerPolicy="no-referrer" />
                      <button
                        type="button"
                        onClick={() => setPhotoSealSimulated('')}
                        className="absolute top-1 right-1 bg-red-650 hover:bg-red-700 text-white rounded-full p-1 shadow-sm transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => triggerPhotoSim('seal')}
                      className="flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-purple-600 transition-colors cursor-pointer w-full h-full"
                    >
                      <Camera className="w-6 h-6 text-purple-500 animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-wider">Foto do Lacre</span>
                      <span className="text-[7.5px] font-semibold text-slate-400 uppercase">Simular Captura</span>
                    </button>
                  )}
                </div>

                {/* Photo 3 */}
                <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-250 p-4 text-center flex flex-col items-center justify-center relative min-h-[140px]">
                  {photoManifestSimulated ? (
                    <div className="relative w-full h-full min-h-[110px]">
                      <img src={photoManifestSimulated} alt="Manifesto" className="w-full h-28 object-cover rounded-xl border" referrerPolicy="no-referrer" />
                      <button
                        type="button"
                        onClick={() => setPhotoManifestSimulated('')}
                        className="absolute top-1 right-1 bg-red-650 hover:bg-red-700 text-white rounded-full p-1 shadow-sm transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => triggerPhotoSim('manifest')}
                      className="flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-purple-600 transition-colors cursor-pointer w-full h-full"
                    >
                      <Camera className="w-6 h-6 text-purple-500 animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-wider">Foto Manifesto/NF</span>
                      <span className="text-[7.5px] font-semibold text-slate-400 uppercase">Simular Captura</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="flex-1 bg-purple-700 hover:bg-purple-800 text-white text-xs font-black py-4 rounded-xl shadow-md transition-all active:scale-95 border-b-4 border-purple-900 cursor-pointer uppercase"
              >
                Registrar e Enviar para Central & Gate
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-black px-6 py-4 rounded-xl transition-all cursor-pointer uppercase"
              >
                Voltar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid Filter Options */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-grow">
          <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por placa, motorista, origem, destino ou lacre..."
            className="w-full bg-slate-50 border border-slate-200 focus:border-purple-500 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold outline-none transition-all placeholder:font-normal placeholder:opacity-50"
          />
        </div>

        {/* Action Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-150">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer ${
                typeFilter === 'ALL' ? 'bg-purple-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setTypeFilter('reverse')}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer ${
                typeFilter === 'reverse' ? 'bg-purple-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Reversas CD
            </button>
            <button
              onClick={() => setTypeFilter('transfer')}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer ${
                typeFilter === 'transfer' ? 'bg-purple-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Transferências
            </button>
            <button
              onClick={() => setTypeFilter('coleta')}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all cursor-pointer ${
                typeFilter === 'coleta' ? 'bg-purple-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Coletas
            </button>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-black uppercase outline-none transition-all cursor-pointer h-[38px]"
          >
            <option value="ALL">TODOS OS STATUS</option>
            <option value={CargoStatus.AWAITING}>Aguardando Portaria</option>
            <option value={CargoStatus.RELEASED}>Liberado / Concluído</option>
            <option value={CargoStatus.BLOCKED}>Bloqueado / Divergente</option>
          </select>
        </div>
      </div>

      {/* Solicitations List */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4.5 h-4.5 text-purple-700" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-800">
              {currentUser?.systemRole === 'administrator' ? 'Todas as Cargas de Loja na Rede' : 'Minhas Solicitações de Envio'}
            </span>
          </div>
          <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2.5 py-1 rounded-full border border-purple-200">
            {filteredLoads.length} Cargas
          </span>
        </div>

        {filteredLoads.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <Truck className="w-12 h-12 mx-auto text-slate-300 stroke-[1.5] mb-4" />
            <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest">Nenhuma carga de loja encontrada</h4>
            <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto mt-1">
              Registre uma nova carga de Logística Reversa ou Transferência no botão roxo acima para iniciar o monitoramento.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLoads.map((load) => {
              const opType = load.tipo_operacao || (
                load.cargoType === CargoType.REVERSA_CD ? 'REVERSA' :
                load.cargoType === CargoType.COLETA ? 'COLETA_TERCEIRO' :
                'TRANSFERENCIA'
              );

              let opBadgeBg = 'bg-emerald-100 text-emerald-800 border-emerald-300';
              let opLabel = 'REVERSA (Logística Reversa)';
              if (opType === 'TRANSFERENCIA') {
                opBadgeBg = 'bg-sky-100 text-sky-800 border-sky-300';
                opLabel = 'TRANSFERÊNCIA';
              } else if (opType === 'COLETA_TERCEIRO') {
                opBadgeBg = 'bg-amber-100 text-amber-800 border-amber-300';
                opLabel = 'COLETA TERCEIROS';
              }
              
              // Status Styling
              let statusBg = 'bg-slate-50 text-slate-600 border-slate-200';
              if (load.status === CargoStatus.AWAITING) statusBg = 'bg-amber-50 text-amber-700 border-amber-100';
              if (load.status === CargoStatus.RELEASED) statusBg = 'bg-emerald-50 text-emerald-700 border-emerald-150';
              if (load.status === CargoStatus.BLOCKED) statusBg = 'bg-rose-50 text-rose-700 border-rose-150';

              return (
                <div key={load.id} className="p-5 hover:bg-slate-50/55 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    {/* Header line with plates and type badge */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{load.plate}</span>
                      
                      <span className={`text-[8.5px] font-black uppercase px-2.5 py-0.5 rounded-full border shadow-xs ${opBadgeBg}`}>
                        {opLabel}
                      </span>

                      {/* Status Auditoria Badge */}
                      {load.auditedAt ? (
                        <span className="text-[8.5px] font-black uppercase px-2.5 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1 shadow-2xs">
                          <CheckCircle2 className="w-3 h-3 text-blue-600 shrink-0" />
                          <span>AUDITADA</span>
                        </span>
                      ) : (
                        <span className="text-[8.5px] font-black uppercase px-2.5 py-0.5 rounded-full border bg-amber-50 text-amber-800 border-amber-300 flex items-center gap-1 shadow-2xs animate-pulse">
                          <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>PENDÊNCIA AUDITORIA</span>
                        </span>
                      )}

                      {/* Status Central Release Badge */}
                      <span className={`text-[8.5px] font-black uppercase px-2.5 py-0.5 rounded-full border flex items-center gap-1 shadow-2xs ${
                        load.status === CargoStatus.RELEASED 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                          : load.status === CargoStatus.BLOCKED 
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {load.status === CargoStatus.RELEASED ? (
                          <>
                            <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>LIBERADA PELA CENTRAL</span>
                          </>
                        ) : load.status === CargoStatus.BLOCKED ? (
                          <>
                            <ShieldAlert className="w-3 h-3 text-rose-600 shrink-0" />
                            <span>BLOQUEADA</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>AGUARDANDO PORTARIA/CENTRAL</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Route line */}
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-tight">
                      <span className="text-slate-800">{load.origin}</span>
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-800">{load.destination}</span>
                    </div>

                    {/* Metadata summary grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                      <div>Motorista: <span className="font-medium text-slate-650">{load.driverName}</span></div>
                      <div>Lacre: <span className="font-medium text-slate-650 font-mono">{load.sealNumber || 'N/D'}</span></div>
                      <div>Paletes: <span className="font-medium text-slate-650 font-mono">{load.palletCount}</span></div>
                      <div>NF-e: <span className="font-medium text-slate-650 font-mono">{load.parInvoiceNumber || 'N/D'}</span></div>
                    </div>
                  </div>

                  {/* Actions buttons on the right */}
                  <div className="flex items-center gap-2 self-start md:self-center">
                    <button
                      onClick={() => setSelectedLoad(load)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2.5 rounded-xl transition-all flex items-center gap-1.5 text-[10px] font-black uppercase cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-purple-600" />
                      <span>Ver Ficha</span>
                    </button>

                    {load.status === CargoStatus.AWAITING && (
                      <button
                        onClick={() => handleCancelLoad(load.id)}
                        className="bg-white border border-red-200 hover:bg-red-50 text-red-650 p-2.5 rounded-xl transition-all flex items-center gap-1 text-[10px] font-black uppercase cursor-pointer"
                        title="Cancelar esta solicitação de envio"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                        <span>Excluir</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Solicitation Details Sheet Modal */}
      {selectedLoad && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-150 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-50 border-b border-slate-150 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-purple-700" />
                <div>
                  <h3 className="text-xs font-black uppercase tracking-tight text-slate-800">
                    Ficha Técnica de Solicitação
                  </h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Identificador Único: {selectedLoad.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLoad(null)}
                className="p-1 text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-grow">
              {/* Type and status banner */}
              <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                <div>
                  <h4 className="text-xs font-black text-purple-900 uppercase">
                    {selectedLoad.cargoType === CargoType.REVERSA_CD 
                      ? 'Logística Reversa CD' 
                      : selectedLoad.cargoType === CargoType.COLETA 
                        ? 'Coleta (Terceiros)' 
                        : 'Transferência entre Lojas'}
                  </h4>
                  <p className="text-[9px] text-purple-600 font-bold uppercase mt-0.5">Manifesto: {selectedLoad.parInvoiceNumber || 'Sem Manifesto Vinculado'}</p>
                </div>
                <span className={`text-[10px] font-black uppercase px-3.5 py-1 rounded-full border ${
                  selectedLoad.status === CargoStatus.AWAITING ? 'bg-amber-50 text-amber-800 border-amber-200' :
                  selectedLoad.status === CargoStatus.RELEASED ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                  'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {selectedLoad.status === CargoStatus.AWAITING ? 'Aguardando Portaria' : selectedLoad.status}
                </span>
              </div>

              {/* Grid with technical specs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Placa Veicular</span>
                  <span className="text-xs font-bold text-slate-700 uppercase">{selectedLoad.plate}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Lacre do Baú</span>
                  <span className="text-xs font-bold text-slate-700 font-mono uppercase">{selectedLoad.sealNumber || 'N/D'}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Motorista</span>
                  <span className="text-xs font-bold text-slate-700 uppercase">{selectedLoad.driverName}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Contato</span>
                  <span className="text-xs font-bold text-slate-700">{selectedLoad.driverPhone || 'N/D'}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Origem da Carga</span>
                  <span className="text-xs font-bold text-slate-700 uppercase">{selectedLoad.origin}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Destino Final</span>
                  <span className="text-xs font-bold text-slate-700 uppercase">{selectedLoad.destination}</span>
                </div>
              </div>

              {/* Materials grid summary */}
              {selectedLoad.palletDetails && selectedLoad.palletDetails.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Detalhamento Físico de Itens</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedLoad.palletDetails.map((item, idx) => (
                      <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                        <span className="text-[8.5px] font-black text-slate-400 uppercase block">{item.type}</span>
                        <span className="text-lg font-black text-slate-800 font-mono block mt-1">{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Extra details & descriptions */}
              {selectedLoad.parDescription && (
                <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Detalhamento / Observações</span>
                  <p className="text-xs text-slate-650 leading-relaxed font-semibold">{selectedLoad.parDescription}</p>
                </div>
              )}

              {/* Evidências e Imagens */}
              {((selectedLoad.photoPlate && selectedLoad.photoPlate.length > 0) || 
                (selectedLoad.photoSeal && selectedLoad.photoSeal.length > 0) || 
                (selectedLoad.photoManifest && selectedLoad.photoManifest.length > 0)) && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Anexos e Fotos Capturadas</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedLoad.photoPlate && selectedLoad.photoPlate[0] && (
                      <div className="space-y-1">
                        <img src={selectedLoad.photoPlate[0]} alt="Placa" className="w-full h-20 object-cover rounded-xl border" referrerPolicy="no-referrer" />
                        <span className="text-[8px] font-black uppercase text-slate-400 text-center block">Placa</span>
                      </div>
                    )}
                    {selectedLoad.photoSeal && selectedLoad.photoSeal[0] && (
                      <div className="space-y-1">
                        <img src={selectedLoad.photoSeal[0]} alt="Lacre" className="w-full h-20 object-cover rounded-xl border" referrerPolicy="no-referrer" />
                        <span className="text-[8px] font-black uppercase text-slate-400 text-center block">Lacre</span>
                      </div>
                    )}
                    {selectedLoad.photoManifest && selectedLoad.photoManifest[0] && (
                      <div className="space-y-1">
                        <img src={selectedLoad.photoManifest[0]} alt="NF-e" className="w-full h-20 object-cover rounded-xl border" referrerPolicy="no-referrer" />
                        <span className="text-[8px] font-black uppercase text-slate-400 text-center block">Nota / Manifesto</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-150 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1 text-slate-400 text-[9px] font-bold uppercase">
                <Clock className="w-3.5 h-3.5" />
                <span>Solicitado em: {new Date(selectedLoad.createdAt).toLocaleString()}</span>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-white border border-slate-250 text-slate-650 hover:bg-slate-50 text-[10px] font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 uppercase transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Guia</span>
                </button>
                <button
                  onClick={() => setSelectedLoad(null)}
                  className="bg-purple-900 text-white hover:bg-purple-950 text-[10px] font-black px-5 py-2.5 rounded-xl uppercase transition-all cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
