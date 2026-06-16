
import React, { useState, useMemo, useEffect } from 'react';
import { CargoLoad, CargoType, CargoStatus, EventLog } from '../types';
import { getUniquePlatesRaw, getUniquePlatesNormalized } from '../data/telemetryData';
import { 
  Truck, 
  Plus, 
  History, 
  Package, 
  MapPin, 
  ShieldCheck, 
  AlertCircle, 
  XCircle, 
  Compass, 
  Map as MapIcon, 
  ExternalLink, 
  Clock, 
  ArrowRight, 
  Navigation,
  Search,
  Pencil,
  Phone
} from 'lucide-react';

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

const ROUTE_OPTIONS = [
  'CD-01',
  'CD-02',
  '07 -SIA',
  '28-AGUAS CLARAS',
  '29-GUARA',
  '42-JARDIM BOTANICO',
  '25-NOVO GAMA',
  '13-LUZIANIA 01',
  '16-SANTO ANTONIO',
  '32-CEILANDIA CENTRO',
  '01-BR 070',
  '21-CEILÂNDIA SUL',
  '55-RECANTO DAS EMAS',
  '34-SAMAMBAIA SUL',
  '60-FURNAS',
  '08-TAGUATINGA',
  '58-EPTG',
  '38-VICENTE PIRES R04',
  '37-VICENTE PIRES R12',
  '52-RIACHO FUNDO',
  '18-AGUAS LINDAS',
  '33-PLANALTINA DF',
  '27-PLANLTINA GO',
  "50- MESTRE D'ARMAS",
  '63-FORMOSA',
  '40-GURUPI TO',
  '30-LEM',
  '19-CALDAS NOVAS',
  '47-APARECIDA DE GOIANIA',
  '15-BALNEARIO',
  '26-CESAR LATTES',
  '12-GAMA',
  '39-GOIANESIA',
  '64-ITUMBIARA',
  '62-LUZIANIA 2',
  '53-RIO VERDE',
  '04-SOBRADINHO'
];

const BASE_VEHICLE_PLATES = [
  'NFU2C00',
  'KQP2410',
  'GVH1B52',
  'REO4J88',
  'GSW3D02',
  'BWH4H66',
  'BWP1560',
  'NLR6G87',
  'ONU6411',
  'GSV9I93',
  'CXA8183',
  'PBL7888',
  'JKK7186',
  'ATB6A80',
  'CGVH1B52',
  'KDL7729',
  'NKT7445',
  'LYI7962',
  'LYC8031',
  'BWC1E46',
  'JXA2058',
  'BWI8492',
  'BTS7345',
  'BII3185',
  'CBN9498',
  'MAT4378',
  'JXA5E19',
  'PRB9568',
  'BWJ6F09',
  'JJL6329',
  'OMJ5997',
  'PRT1898',
  'PZE6079',
  'KDP2410',
  'FRZ9797',
  'ABF8135',
  'JJC0097',
  'OMY1B34',
  'GRA7922',
  'JJA5H71',
  'GSV9893',
  'NFU7C00',
  'CQH5155',
  'JHM2104',
  'OPG6684',
  'FCQ3377',
  'OYB1D24',
  'NVW1921',
  'MEH5E78',
  'PRQ0325',
  'NFN3296',
  'CRY5H40',
  'CUB2320'
];

const VEHICLE_PLATES = Array.from(new Set([
  ...BASE_VEHICLE_PLATES,
  ...getUniquePlatesRaw(),
  ...getUniquePlatesNormalized()
]));

const formatPhoneNumber = (value: string) => {
  if (!value) return value;
  const phoneNumber = value.replace(/[^\d]/g, '');
  const phoneNumberLength = phoneNumber.length;
  if (phoneNumberLength < 3) return phoneNumber;
  if (phoneNumberLength < 7) {
    return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`;
  }
  return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7, 11)}`;
};

interface ExpeditionViewProps {
  onSubmit: (load: Omit<CargoLoad, 'id' | 'status' | 'createdAt' | 'createdBy'>) => void;
  onUpdateLoad?: (updatedLoad: CargoLoad) => Promise<void>;
  loads: CargoLoad[];
  logs: EventLog[];
}

export const ExpeditionView: React.FC<ExpeditionViewProps> = ({ onSubmit, onUpdateLoad, loads = [], logs }) => {
  const [plate, setPlate] = useState('');
  const [plateCavalo, setPlateCavalo] = useState('');
  const [plateBau, setPlateBau] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [cargoType, setCargoType] = useState<CargoType>(CargoType.SECA);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [additionalDestinations, setAdditionalDestinations] = useState<string[]>([]);
  const [newDestination, setNewDestination] = useState('');
  const [sealNumber, setSealNumber] = useState('');
  const [seals, setSeals] = useState<string[]>(['']);
  const [palletDetailsByDest, setPalletDetailsByDest] = useState<Record<string, Record<string, number>>>({});
  const [sharedCargoDescriptions, setSharedCargoDescriptions] = useState<Record<string, string>>({});

  // Synchronize plate structure
  useEffect(() => {
    const cav = plateCavalo.trim().toUpperCase();
    const bau = plateBau.trim().toUpperCase();
    if (cav && bau) {
      setPlate(`${cav} / ${bau}`);
    } else if (cav) {
      setPlate(cav);
    } else if (bau) {
      setPlate(bau);
    } else {
      setPlate('');
    }
  }, [plateCavalo, plateBau]);

  // Synchronize seal numbers structure
  useEffect(() => {
    const combined = seals.map(s => s.trim().toUpperCase()).filter(Boolean).join(', ');
    setSealNumber(combined);
  }, [seals]);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  const suggestions = useMemo(() => {
    const query = plateCavalo.toUpperCase().trim();
    if (!query) {
      return VEHICLE_PLATES;
    }
    return VEHICLE_PLATES.filter(p => p.includes(query));
  }, [plateCavalo]);

  useEffect(() => {
    setActiveSuggestionIndex(-1);
  }, [plateCavalo]);

  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [activeOriginIndex, setActiveOriginIndex] = useState(-1);

  const originSuggestions = useMemo(() => {
    const query = origin.toUpperCase().trim();
    if (!query) {
      return ROUTE_OPTIONS;
    }
    const filtered = ROUTE_OPTIONS.filter(r => r.toUpperCase().includes(query));
    if (filtered.length === 1 && filtered[0].toUpperCase() === query) {
      return ROUTE_OPTIONS;
    }
    return filtered;
  }, [origin]);

  useEffect(() => {
    setActiveOriginIndex(-1);
  }, [origin]);

  const [showDestSuggestions, setShowDestSuggestions] = useState(false);
  const [activeDestIndex, setActiveDestIndex] = useState(-1);

  const destSuggestions = useMemo(() => {
    const query = destination.toUpperCase().trim();
    if (!query) {
      return ROUTE_OPTIONS;
    }
    const filtered = ROUTE_OPTIONS.filter(r => r.toUpperCase().includes(query));
    if (filtered.length === 1 && filtered[0].toUpperCase() === query) {
      return ROUTE_OPTIONS;
    }
    return filtered;
  }, [destination]);

  useEffect(() => {
    setActiveDestIndex(-1);
  }, [destination]);

  const [showNewDestSuggestions, setShowNewDestSuggestions] = useState(false);
  const [activeNewDestIndex, setActiveNewDestIndex] = useState(-1);

  const newDestSuggestions = useMemo(() => {
    const query = newDestination.toUpperCase().trim();
    if (!query) {
      return ROUTE_OPTIONS;
    }
    const filtered = ROUTE_OPTIONS.filter(r => r.toUpperCase().includes(query));
    if (filtered.length === 1 && filtered[0].toUpperCase() === query) {
      return ROUTE_OPTIONS;
    }
    return filtered;
  }, [newDestination]);

  useEffect(() => {
    setActiveNewDestIndex(-1);
  }, [newDestination]);

  const destinationsList = [destination, ...additionalDestinations].filter(Boolean);
  const [selectedDestForPallets, setSelectedDestForPallets] = useState('');
  
  const activeDest = destinationsList.includes(selectedDestForPallets)
    ? selectedDestForPallets
    : (destinationsList[0] || '');

  const defaultPallets = {
    'BIN': 0,
    'CAIXA IFCO': 0,
    'PALETE PBR': 0,
    'PALETE CHEP': 0,
    'GAIOLA': 0,
  };

  const getPalletDetailsForDest = (dest: string): Record<string, number> => {
    return palletDetailsByDest[dest] || { ...defaultPallets };
  };

  const palletCount = cargoType === CargoType.COMPARTILHADA
    ? destinationsList.reduce((sum, dest) => {
        return sum + (Object.values(getPalletDetailsForDest(dest)) as number[]).reduce((a: number, b: number) => a + b, 0);
      }, 0)
    : (Object.values(getPalletDetailsForDest(destination || 'Principal')) as number[]).reduce((a: number, b: number) => a + b, 0);

  const activeDestPalletCount = (Object.values(getPalletDetailsForDest(activeDest)) as number[]).reduce((a: number, b: number) => a + b, 0);

  const [selectedPalletType, setSelectedPalletType] = useState('PALETE PBR');
  const [inputPalletQty, setInputPalletQty] = useState('');

  const [isHighRisk, setIsHighRisk] = useState(false);
  const [parType, setParType] = useState('');
  const [parInvoiceNumber, setParInvoiceNumber] = useState('');
  const [parDescription, setParDescription] = useState('');
  const [error, setError] = useState('');

  const [editingLoadId, setEditingLoadId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarTab, setSidebarTab] = useState<'resumo' | 'atividades'>('resumo');

  const filteredLoads = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return loads;
    return loads.filter(load => 
      load.plate.toLowerCase().includes(q) ||
      load.driverName.toLowerCase().includes(q) ||
      load.destination.toLowerCase().includes(q) ||
      (load.additionalDestinations && load.additionalDestinations.some(d => d.toLowerCase().includes(q))) ||
      load.sealNumber.toLowerCase().includes(q) ||
      load.cargoType.toLowerCase().includes(q)
    );
  }, [loads, searchQuery]);

  const handleEditLoad = (load: CargoLoad) => {
    setEditingLoadId(load.id);
    setPlate(load.plate);
    if (load.plate.includes(' / ')) {
      const [cav, bau] = load.plate.split(' / ');
      setPlateCavalo(cav.trim());
      setPlateBau((bau || '').trim());
    } else {
      setPlateCavalo(load.plate);
      setPlateBau('');
    }
    setDriverName(load.driverName);
    setDriverPhone(load.driverPhone || '');
    setCargoType(load.cargoType);
    setOrigin(load.origin);
    setDestination(load.destination);
    setAdditionalDestinations(load.additionalDestinations || []);
    setSealNumber(load.sealNumber || '');
    if (load.sealNumber) {
      const parts = load.sealNumber.split(',').map(s => s.trim());
      setSeals(parts);
    } else {
      setSeals(['']);
    }
    setIsHighRisk(!!load.isHighRisk);
    setParType(load.parType || '');
    setParInvoiceNumber(load.parInvoiceNumber || '');
    setParDescription(load.parDescription || '');
    setSharedCargoDescriptions(load.sharedCargoDescriptions || {});

    // Now, let's load the palletDetailsByDest:
    const newPalletDetailsByDest: Record<string, Record<string, number>> = {};
    if (load.palletDetails && load.palletDetails.length > 0) {
      load.palletDetails.forEach(detail => {
        const destKey = detail.destination || load.destination || 'Principal';
        if (!newPalletDetailsByDest[destKey]) {
          newPalletDetailsByDest[destKey] = { ...defaultPallets };
        }
        newPalletDetailsByDest[destKey][detail.type] = detail.quantity;
      });
    } else {
      const destKey = load.destination || 'Principal';
      newPalletDetailsByDest[destKey] = { ...defaultPallets };
    }
    setPalletDetailsByDest(newPalletDetailsByDest);
    setError('');

    // Scroll up to form on mobile devices smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingLoadId(null);
    setPlate('');
    setPlateCavalo('');
    setPlateBau('');
    setDriverName('');
    setDriverPhone('');
    setOrigin('');
    setDestination('');
    setAdditionalDestinations([]);
    setSealNumber('');
    setSeals(['']);
    setPalletDetailsByDest({});
    setSharedCargoDescriptions({});
    setIsHighRisk(false);
    setParType('');
    setParInvoiceNumber('');
    setParDescription('');
    setError('');
  };

  // Keyboard shortcut listeners for global workflow speedups (Ctrl + N and Ctrl + S)
  useEffect(() => {
    const handleShortcutNewLoad = () => {
      // Clear/Reset entire form state
      handleCancelEdit();
      // Focus on the Vehicle Plate input field to start typing immediately
      setTimeout(() => {
        const plateInput = document.getElementById('expedition-plate-input');
        if (plateInput) {
          (plateInput as HTMLInputElement).focus();
        }
      }, 80);
    };

    const handleShortcutSave = () => {
      // Native form submission handling (guarantees HTML5 fields validator prompts are triggered)
      const formEl = document.getElementById('expedition-manifest-form') as HTMLFormElement;
      if (formEl) {
        formEl.requestSubmit();
      }
    };

    window.addEventListener('shortcut-new-load', handleShortcutNewLoad);
    window.addEventListener('shortcut-save', handleShortcutSave);

    return () => {
      window.removeEventListener('shortcut-new-load', handleShortcutNewLoad);
      window.removeEventListener('shortcut-save', handleShortcutSave);
    };
  }, []);

  const validatePlate = (p: string) => {
    const mercosulRegex = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/;
    const oldRegex = /^[A-Z]{3}[0-9]{4}$/;
    return mercosulRegex.test(p) || oldRegex.test(p);
  };

  const handleUpdateDetail = (type: string, value: number) => {
    if (!activeDest && cargoType === CargoType.COMPARTILHADA) {
      setError('Selecione ou informe um destino para classificar os paletes.');
      return;
    }
    const targetDest = activeDest || destination || 'Principal';
    const safeVal = Math.max(0, value);
    setPalletDetailsByDest(prev => ({
      ...prev,
      [targetDest]: {
        ...getPalletDetailsForDest(targetDest),
        [type]: safeVal
      }
    }));
  };

  const handleLaunchPallet = () => {
    const targetDest = activeDest || destination || 'Principal';
    if (!targetDest) {
      setError('Por favor, informe primeiro o destino antes de lançar paletes.');
      return;
    }
    const qty = parseInt(inputPalletQty);
    if (isNaN(qty) || qty <= 0) {
      setError('Por favor, informe uma quantidade de paletes válida (maior que zero).');
      return;
    }
    setError('');
    const current = getPalletDetailsForDest(targetDest);
    setPalletDetailsByDest(prev => ({
      ...prev,
      [targetDest]: {
        ...current,
        [selectedPalletType]: (current[selectedPalletType] || 0) + qty
      }
    }));
    setInputPalletQty('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const normalizedCavalo = plateCavalo.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const normalizedBau = plateBau.toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (!normalizedCavalo) {
      setError('Por favor, informe a placa do Cavalo.');
      return;
    }

    if (!validatePlate(normalizedCavalo)) {
      setError('Placa do Cavalo inválida. Use o formato Mercosul (AAA1A11) ou Antigo (AAA1111).');
      return;
    }

    if (normalizedBau && !validatePlate(normalizedBau)) {
      setError('Placa do Baú inválida. Use o formato Mercosul (AAA1A11) ou Antigo (AAA1111).');
      return;
    }

    const normalizedPlate = normalizedBau 
      ? `${normalizedCavalo} / ${normalizedBau}` 
      : normalizedCavalo;

    const activeSeals = seals.map(s => s.trim().toUpperCase()).filter(Boolean);
    if (activeSeals.length === 0) {
      setError('Por favor, adicione pelo menos um número de lacre para a liberação da carga.');
      return;
    }
    const combinedSeal = activeSeals.join(', ');

    if (palletCount <= 0) {
      setError('Por favor, adicione e classifique pelo menos um palete para a liberação da carga.');
      return;
    }

    let payloadPalletDetails: { type: string; quantity: number, destination?: string }[] = [];
    if (cargoType === CargoType.COMPARTILHADA) {
      destinationsList.forEach(dest => {
        const details = getPalletDetailsForDest(dest);
        Object.entries(details).forEach(([type, qty]) => {
          if ((qty as number) > 0) {
            payloadPalletDetails.push({ type, quantity: qty as number, destination: dest });
          }
        });
      });
    } else {
      const details = getPalletDetailsForDest(destination || 'Principal');
      Object.entries(details).forEach(([type, qty]) => {
        if ((qty as number) > 0) {
          payloadPalletDetails.push({ type, quantity: qty as number });
        }
      });
    }

    if (editingLoadId) {
      const originalLoad = loads.find(l => l.id === editingLoadId);
      if (!originalLoad) {
        setError('Carga original não encontrada.');
        return;
      }
      const updatedLoad: CargoLoad = {
        ...originalLoad,
        plate: normalizedPlate,
        driverName,
        driverPhone: driverPhone || undefined,
        cargoType,
        origin,
        destination,
        additionalDestinations: cargoType === CargoType.COMPARTILHADA ? additionalDestinations : undefined,
        sharedCargoDescriptions: cargoType === CargoType.COMPARTILHADA ? sharedCargoDescriptions : undefined,
        sealNumber: combinedSeal,
        palletCount,
        palletDetails: payloadPalletDetails,
        isHighRisk,
        parType: isHighRisk ? parType : undefined,
        parInvoiceNumber: isHighRisk ? parInvoiceNumber : undefined,
        parDescription: isHighRisk ? parDescription : undefined,
        photoPlate: originalLoad.photoPlate,
        photoSeal: originalLoad.photoSeal,
        photoManifest: originalLoad.photoManifest,
      };

      if (onUpdateLoad) {
        onUpdateLoad(updatedLoad);
      }
      handleCancelEdit();
    } else {
      onSubmit({
        plate: normalizedPlate,
        driverName,
        driverPhone: driverPhone || undefined,
        cargoType,
        origin,
        destination,
        additionalDestinations: cargoType === CargoType.COMPARTILHADA ? additionalDestinations : undefined,
        sharedCargoDescriptions: cargoType === CargoType.COMPARTILHADA ? sharedCargoDescriptions : undefined,
        sealNumber: combinedSeal,
        palletCount,
        palletDetails: payloadPalletDetails,
        isHighRisk,
        parType: isHighRisk ? parType : undefined,
        parInvoiceNumber: isHighRisk ? parInvoiceNumber : undefined,
        parDescription: isHighRisk ? parDescription : undefined,
      });
      handleCancelEdit();
    }
  };

  const addDestination = () => {
    if (newDestination.trim() && !additionalDestinations.includes(newDestination.trim())) {
      setAdditionalDestinations([...additionalDestinations, newDestination.trim()]);
      setNewDestination('');
    }
  };

  const removeDestination = (index: number) => {
    setAdditionalDestinations(additionalDestinations.filter((_, i) => i !== index));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Form Section */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-primary-navy p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-gold rounded-lg shrink-0">
                {editingLoadId ? (
                  <Pencil className="w-5 h-5 text-primary-navy" />
                ) : (
                  <Plus className="w-5 h-5 text-primary-navy" />
                )}
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-black uppercase tracking-tight">
                  {editingLoadId ? 'Alterar Liberação de Carga' : 'Nova Liberação de Carga'}
                </h2>
                <p className="text-[10px] font-bold text-primary-gold uppercase tracking-widest mt-0.5">
                  {editingLoadId ? `Editando dados da placa: ${plate}` : 'Preencha os dados do manifesto'}
                </p>
              </div>
            </div>
            {editingLoadId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all active:scale-95 border-b-2 border-red-950 text-center cursor-pointer shrink-0"
              >
                Cancelar Edição
              </button>
            )}
          </div>

          <form id="expedition-manifest-form" onSubmit={handleSubmit} className="p-8 space-y-8">
            {error && (
              <div className="bg-red-900/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 relative" id="plate-autocomplete-container">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Placa do Cavalo</label>
                <div className="relative">
                  <Truck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="expedition-plate-input"
                    type="text"
                    value={plateCavalo}
                    onChange={(e) => {
                      setPlateCavalo(e.target.value.toUpperCase());
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setShowSuggestions(false)}
                    onKeyDown={(e) => {
                      if (!showSuggestions) {
                        if (e.key === 'ArrowDown') {
                          setShowSuggestions(true);
                        }
                        return;
                      }

                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setActiveSuggestionIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setActiveSuggestionIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
                      } else if (e.key === 'Enter') {
                        if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
                          e.preventDefault();
                          setPlateCavalo(suggestions[activeSuggestionIndex]);
                          setShowSuggestions(false);
                        }
                      } else if (e.key === 'Escape') {
                        setShowSuggestions(false);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm font-black text-primary-navy focus:ring-2 focus:ring-primary-gold outline-none transition-all uppercase font-mono"
                    placeholder="AAA1A11"
                    required
                  />
                </div>
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg divide-y divide-slate-100 flex flex-col">
                    {suggestions.map((p, index) => (
                      <button
                        key={p}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault(); // prevents blur before click registers
                          setPlateCavalo(p);
                          setShowSuggestions(false);
                        }}
                        onMouseEnter={() => setActiveSuggestionIndex(index)}
                        className={`w-full text-left px-4 py-2.5 text-xs font-black transition-colors flex items-center justify-between ${
                          activeSuggestionIndex === index 
                            ? 'bg-slate-100 text-primary-navy' 
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="font-mono tracking-widest">{p}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                          activeSuggestionIndex === index 
                            ? 'bg-primary-gold/20 text-primary-navy' 
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          Sugestão de Placa
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Placa do Baú</label>
                <div className="relative">
                  <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={plateBau}
                    onChange={(e) => setPlateBau(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm font-black text-primary-navy focus:ring-2 focus:ring-primary-gold outline-none transition-all uppercase font-mono"
                    placeholder="AAA1A11 (Opcional)"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Nome do Motorista</label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-primary-navy focus:ring-2 focus:ring-primary-gold outline-none transition-all"
                  placeholder="Nome completo"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Telefone do Motorista</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={driverPhone}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      setDriverPhone(formatted);
                    }}
                    maxLength={15}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-primary-navy focus:ring-2 focus:ring-primary-gold outline-none transition-all"
                    placeholder="(00) 90000-0000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Tipo de Carga</label>
                <select
                  value={cargoType}
                  onChange={(e) => setCargoType(e.target.value as CargoType)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-primary-navy focus:ring-2 focus:ring-primary-gold outline-none transition-all"
                >
                  {Object.values(CargoType).map(type => (
                    <option key={type} value={type} className="bg-white text-primary-navy">{type}</option>
                  ))}
                </select>
              </div>

              {/* Dynamic Multiple Seals Section */}
              <div className="space-y-3 md:col-span-2 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Números dos Lacres</label>
                    <p className="text-[9px] text-slate-400 font-bold ml-1 uppercase mt-0.5">Adicione outros lacres caso seja necessário</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSeals([...seals, ''])}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    Incluir Lacre
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {seals.map((seal, index) => (
                    <div key={index} className="flex gap-2 items-center animate-in slide-in-from-top-2 duration-150">
                      <div className="relative flex-grow">
                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={seal}
                          onChange={(e) => {
                            const updated = [...seals];
                            updated[index] = e.target.value.toUpperCase();
                            setSeals(updated);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-2.5 text-sm font-mono font-black text-primary-navy focus:ring-2 focus:ring-primary-gold outline-none transition-all uppercase"
                          placeholder={`L-000000 (Lacre ${index + 1})`}
                          required={index === 0}
                        />
                      </div>
                      {seals.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = seals.filter((_, i) => i !== index);
                            setSeals(updated);
                          }}
                          className="p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 rounded-xl transition-all cursor-pointer shrink-0"
                          title="Remover este lacre"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 relative" id="origin-autocomplete-container">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Origem</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => {
                      setOrigin(e.target.value.toUpperCase());
                      setShowOriginSuggestions(true);
                    }}
                    onFocus={() => setShowOriginSuggestions(true)}
                    onBlur={() => setShowOriginSuggestions(false)}
                    onKeyDown={(e) => {
                      if (!showOriginSuggestions) {
                        if (e.key === 'ArrowDown') {
                          setShowOriginSuggestions(true);
                        }
                        return;
                      }

                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setActiveOriginIndex(prev => (prev < originSuggestions.length - 1 ? prev + 1 : 0));
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setActiveOriginIndex(prev => (prev > 0 ? prev - 1 : originSuggestions.length - 1));
                      } else if (e.key === 'Enter') {
                        if (activeOriginIndex >= 0 && activeOriginIndex < originSuggestions.length) {
                          e.preventDefault();
                          setOrigin(originSuggestions[activeOriginIndex]);
                          setShowOriginSuggestions(false);
                        }
                      } else if (e.key === 'Escape') {
                        setShowOriginSuggestions(false);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm font-black text-primary-navy focus:ring-2 focus:ring-primary-gold outline-none transition-all uppercase"
                    placeholder="Selecione ou digite a origem..."
                    required
                  />
                </div>
                {showOriginSuggestions && originSuggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg divide-y divide-slate-100 flex flex-col">
                    {originSuggestions.map((route, index) => (
                      <button
                        key={route}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setOrigin(route);
                          setShowOriginSuggestions(false);
                        }}
                        onMouseEnter={() => setActiveOriginIndex(index)}
                        className={`w-full text-left px-4 py-2.5 text-xs font-black transition-colors flex items-center justify-between ${
                          activeOriginIndex === index 
                            ? 'bg-slate-100 text-primary-navy' 
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{route}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                          activeOriginIndex === index 
                            ? 'bg-primary-gold/20 text-primary-navy' 
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          Origem
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2 relative" id="dest-autocomplete-container">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Destino Principal</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => {
                      setDestination(e.target.value.toUpperCase());
                      setShowDestSuggestions(true);
                    }}
                    onFocus={() => setShowDestSuggestions(true)}
                    onBlur={() => setShowDestSuggestions(false)}
                    onKeyDown={(e) => {
                      if (!showDestSuggestions) {
                        if (e.key === 'ArrowDown') {
                          setShowDestSuggestions(true);
                        }
                        return;
                      }

                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setActiveDestIndex(prev => (prev < destSuggestions.length - 1 ? prev + 1 : 0));
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setActiveDestIndex(prev => (prev > 0 ? prev - 1 : destSuggestions.length - 1));
                      } else if (e.key === 'Enter') {
                        if (activeDestIndex >= 0 && activeDestIndex < destSuggestions.length) {
                          e.preventDefault();
                          setDestination(destSuggestions[activeDestIndex]);
                          setShowDestSuggestions(false);
                        }
                      } else if (e.key === 'Escape') {
                        setShowDestSuggestions(false);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm font-black text-primary-navy focus:ring-2 focus:ring-primary-gold outline-none transition-all uppercase"
                    placeholder="Selecione ou digite o destino..."
                    required
                  />
                </div>
                {showDestSuggestions && destSuggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg divide-y divide-slate-100 flex flex-col">
                    {destSuggestions.map((route, index) => (
                      <button
                        key={route}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setDestination(route);
                          setShowDestSuggestions(false);
                        }}
                        onMouseEnter={() => setActiveDestIndex(index)}
                        className={`w-full text-left px-4 py-2.5 text-xs font-black transition-colors flex items-center justify-between ${
                          activeDestIndex === index 
                            ? 'bg-slate-100 text-primary-navy' 
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{route}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                          activeDestIndex === index 
                            ? 'bg-primary-gold/20 text-primary-navy' 
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          Destino
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {cargoType === CargoType.COMPARTILHADA && (
                <div className="md:col-span-2 space-y-4 animate-in slide-in-from-top-4 duration-300">
                  <label className="text-[10px] font-black text-blue-400 uppercase tracking-wider ml-1">Destinos Adicionais (Carga Compartilhada)</label>
                  <div className="flex gap-2">
                    <div className="relative flex-grow" id="new-dest-autocomplete-container">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={newDestination}
                        onChange={(e) => {
                          setNewDestination(e.target.value.toUpperCase());
                          setShowNewDestSuggestions(true);
                        }}
                        onFocus={() => setShowNewDestSuggestions(true)}
                        onBlur={() => setShowNewDestSuggestions(false)}
                        onKeyDown={(e) => {
                          if (!showNewDestSuggestions) {
                            if (e.key === 'ArrowDown') {
                              setShowNewDestSuggestions(true);
                            }
                            return;
                          }

                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setActiveNewDestIndex(prev => (prev < newDestSuggestions.length - 1 ? prev + 1 : 0));
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setActiveNewDestIndex(prev => (prev > 0 ? prev - 1 : newDestSuggestions.length - 1));
                          } else if (e.key === 'Enter') {
                            if (activeNewDestIndex >= 0 && activeNewDestIndex < newDestSuggestions.length) {
                              e.preventDefault();
                              setNewDestination(newDestSuggestions[activeNewDestIndex]);
                              setShowNewDestSuggestions(false);
                            }
                          } else if (e.key === 'Escape') {
                            setShowNewDestSuggestions(false);
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm font-bold text-primary-navy focus:ring-2 focus:ring-primary-gold outline-none transition-all uppercase"
                        placeholder="Selecione ou digite destino adicional..."
                      />
                      {showNewDestSuggestions && newDestSuggestions.length > 0 && (
                        <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg divide-y divide-slate-100 flex flex-col">
                          {newDestSuggestions.map((route, index) => (
                            <button
                              key={route}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setNewDestination(route);
                                setShowNewDestSuggestions(false);
                              }}
                              onMouseEnter={() => setActiveNewDestIndex(index)}
                              className={`w-full text-left px-4 py-2.5 text-xs font-black transition-colors flex items-center justify-between ${
                                activeNewDestIndex === index 
                                  ? 'bg-slate-100 text-primary-navy' 
                                  : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <span>{route}</span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                                activeNewDestIndex === index 
                                  ? 'bg-blue-600/20 text-blue-700' 
                                  : 'bg-slate-100 text-slate-400'
                              }`}>
                                Adicional
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={addDestination}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-4 rounded-xl transition-all h-[46px] flex items-center justify-center self-start"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {additionalDestinations.map((dest, index) => (
                      <div key={index} className="bg-slate-800 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2">
                        {dest}
                        <button onClick={() => removeDestination(index)} className="hover:text-red-400">
                          <XCircle className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {cargoType === CargoType.COMPARTILHADA && destinationsList.length > 0 && (
                <div className="md:col-span-2 space-y-4 animate-in slide-in-from-top-4 duration-300 bg-blue-50/20 border border-blue-200/40 p-6 rounded-3xl">
                  <div>
                    <h3 className="text-xs font-black uppercase text-blue-900 tracking-wider">Descrição das Cargas por Destino</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Descreva o tipo de carga transportada para cada um dos destinos</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {destinationsList.map((dest) => (
                      <div key={dest} className="space-y-1.5 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center justify-between">
                          <span>Destino: <span className="text-blue-600 font-extrabold">{dest}</span></span>
                        </label>
                        <input
                          type="text"
                          value={sharedCargoDescriptions[dest] || ''}
                          onChange={(e) => {
                            setSharedCargoDescriptions(prev => ({
                              ...prev,
                              [dest]: e.target.value
                            }));
                          }}
                          placeholder="Ex: Perecíveis (iogurtes, carnes), Seca, etc."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-primary-gold outline-none transition-all"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-6">
                <div>
                  <h3 className="text-xs font-black uppercase text-primary-navy tracking-wider">Lançamento & Classificação de Paletes</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Selecione o tipo, informe a quantidade e clique em OK para lançar</p>
                </div>

                {cargoType === CargoType.COMPARTILHADA && (
                  <div className="bg-blue-50/50 border border-blue-200/50 p-4 rounded-2xl space-y-2">
                    <span className="text-[10px] font-black uppercase text-blue-900 tracking-wider flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      Destino para Lançamento do Palete:
                    </span>
                    {destinationsList.length === 0 ? (
                      <p className="text-[10px] text-amber-600 font-bold">⚠️ Adicione primeiro o destino principal e adicionais acima.</p>
                    ) : (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {destinationsList.map((dest) => {
                          const destCount = (Object.values(getPalletDetailsForDest(dest)) as number[]).reduce((a: number, b: number) => a + b, 0);
                          return (
                            <button
                              key={dest}
                              type="button"
                              onClick={() => setSelectedDestForPallets(dest)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border shrink-0 cursor-pointer ${
                                activeDest === dest
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {dest} ({destCount} P)
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Launcher Inputs Row */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-6 space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Palete</label>
                    <select
                      value={selectedPalletType}
                      onChange={(e) => setSelectedPalletType(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-black text-primary-navy focus:ring-2 focus:ring-primary-gold outline-none transition-all cursor-pointer"
                    >
                      <option value="BIN">BIN</option>
                      <option value="CAIXA IFCO">CAIXA IFCO</option>
                      <option value="PALETE PBR">PALETE PBR</option>
                      <option value="PALETE CHEP">PALETE CHEP</option>
                      <option value="GAIOLA">GAIOLA</option>
                    </select>
                  </div>

                  <div className="sm:col-span-4 space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantidade</label>
                    <div className="relative">
                      <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="number"
                        placeholder="Ex: 10"
                        value={inputPalletQty}
                        onChange={(e) => setInputPalletQty(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleLaunchPallet();
                          }
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-xs font-black text-primary-navy focus:ring-2 focus:ring-primary-gold outline-none transition-all"
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleLaunchPallet}
                      className="w-full bg-primary-navy hover:bg-slate-800 text-primary-gold text-xs font-black py-3 rounded-xl uppercase tracking-widest cursor-pointer transition-all active:scale-95 shadow-sm hover:shadow-md text-center flex items-center justify-center gap-1 border-b-2 border-slate-950"
                    >
                      OK
                    </button>
                  </div>
                </div>

                {/* Current Pallets Summary and List */}
                <div className="border-t border-slate-200/60 pt-5 space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center bg-white border border-slate-200/80 p-4 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-primary-gold" />
                      <div>
                        <span className="text-[10px] font-black uppercase text-primary-navy tracking-wider block">Somatória Final da Carga:</span>
                        {cargoType === CargoType.COMPARTILHADA && activeDest && (
                          <span className="text-[9px] font-bold text-blue-500 uppercase tracking-tight block">Filtro Ativo: {activeDest} ({activeDestPalletCount} P)</span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-xl self-end sm:self-auto shrink-0 animate-pulse">
                      {palletCount} {palletCount === 1 ? 'Palete' : 'Paletes'}
                    </span>
                  </div>

                  {palletCount > 0 ? (
                    <div className="space-y-4">
                      {/* Detailed list grouped per active / all destinations if shared */}
                      <div className="space-y-2">
                        {cargoType === CargoType.COMPARTILHADA && (
                          <p className="text-[9px] font-black uppercase text-slate-500 tracking-wider">
                            Lista de Paletes em {activeDest || 'Sem destino selecionado'}:
                          </p>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {Object.entries(getPalletDetailsForDest(activeDest || destination || 'Principal'))
                            .filter(([_, qty]) => (qty as number) > 0)
                            .map(([type, qty]) => (
                              <div key={type} className="bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 flex items-center justify-between shadow-xs group hover:border-slate-300 transition-all">
                                <div className="flex flex-col">
                                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{type}</span>
                                  <span className="text-xs font-black text-primary-navy">{qty} un</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateDetail(type, (qty as number) - 1)}
                                    className="w-6 h-6 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-stone-600 font-black text-xs flex items-center justify-center cursor-pointer active:scale-90 transition-all"
                                  >
                                    -
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateDetail(type, (qty as number) + 1)}
                                    className="w-6 h-6 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-stone-600 font-black text-xs flex items-center justify-center cursor-pointer active:scale-90 transition-all"
                                  >
                                    +
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateDetail(type, 0)}
                                    className="text-red-500 hover:text-red-600 font-bold text-xs px-2 py-1 rounded-md hover:bg-red-50 transition-all cursor-pointer font-black uppercase tracking-wider"
                                    title="Remover lançamentos"
                                  >
                                    Limpar
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* Summary of other destinations if any */}
                      {cargoType === CargoType.COMPARTILHADA && destinationsList.length > 1 && (
                        <div className="bg-slate-100/50 p-3.5 rounded-2xl space-y-2 border border-slate-200/50">
                          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Visão Geral dos Outros Destinos:</p>
                          <div className="flex flex-wrap gap-2">
                            {destinationsList.filter(d => d !== activeDest).map(dest => {
                              const list = getPalletDetailsForDest(dest);
                              const listCount = (Object.values(list) as number[]).reduce((a, b) => a + b, 0);
                              return (
                                <button
                                  key={dest}
                                  type="button"
                                  onClick={() => setSelectedDestForPallets(dest)}
                                  className="text-[9px] font-bold bg-white text-slate-600 border border-slate-200 rounded-lg px-2.5 py-1.5 cursor-pointer hover:border-blue-300"
                                >
                                  {dest}: <span className="font-extrabold text-blue-600">{listCount}P</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 border border-dashed border-slate-200 rounded-2xl bg-white/50">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Nenhum palete lançado nesta liberação</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* High Risk Section */}
            <div className={`p-6 rounded-2xl border transition-all duration-500 ${isHighRisk ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isHighRisk ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-black uppercase tracking-tight ${isHighRisk ? 'text-red-700' : 'text-slate-700'}`}>Carga de Alto Risco (PAR)</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Produtos de Alto Risco / Valor Agregado</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsHighRisk(!isHighRisk)}
                  className={`w-12 h-6 rounded-full transition-all relative ${isHighRisk ? 'bg-red-600' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isHighRisk ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>

              {isHighRisk && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-4 duration-300">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-red-400 uppercase tracking-wider ml-1">Tipo de Produto PAR</label>
                    <input
                      type="text"
                      value={parType}
                      onChange={(e) => setParType(e.target.value)}
                      className="w-full bg-slate-50 border border-red-500/30 rounded-xl px-4 py-3 text-sm font-bold text-primary-navy focus:ring-2 focus:ring-red-500 outline-none transition-all"
                      placeholder="Ex: Bebidas, Higiene, etc"
                      required={isHighRisk}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-red-400 uppercase tracking-wider ml-1">Número da Nota Fiscal</label>
                    <input
                      type="text"
                      value={parInvoiceNumber}
                      onChange={(e) => setParInvoiceNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-red-500/30 rounded-xl px-4 py-3 text-sm font-bold text-primary-navy focus:ring-2 focus:ring-red-500 outline-none transition-all"
                      placeholder="NF-e"
                      required={isHighRisk}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-red-400 uppercase tracking-wider ml-1">Descrição Adicional</label>
                    <textarea
                      value={parDescription}
                      onChange={(e) => setParDescription(e.target.value)}
                      className="w-full bg-slate-50 border border-red-500/30 rounded-xl px-4 py-3 text-sm font-medium text-primary-navy focus:ring-2 focus:ring-red-500 outline-none transition-all h-24 resize-none"
                      placeholder="Detalhes sobre a carga PAR..."
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-primary-gold hover:bg-primary-gold/90 text-white font-black py-5 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 text-sm uppercase tracking-widest border-b-4 border-primary-navy cursor-pointer"
            >
              <ShieldCheck className="w-5 h-5" />
              {editingLoadId ? 'SALVAR ALTERAÇÕES DA CARGA' : 'REGISTRAR E LIBERAR PARA CENTRAL'}
            </button>
          </form>
        </div>
      </div>

      {/* Sidebar Section */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col min-h-[500px]">
          {/* Sidebar Tab Options */}
          <div className="bg-primary-navy border-b border-slate-800">
            <div className="flex">
              <button
                type="button"
                onClick={() => setSidebarTab('resumo')}
                className={`flex-1 py-4 text-xs font-black uppercase tracking-wider transition-all border-b-2 text-center flex items-center justify-center gap-2 cursor-pointer ${
                  sidebarTab === 'resumo'
                    ? 'border-primary-gold text-white bg-slate-900/40'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Truck className="w-4 h-4 text-primary-gold" />
                Resumo de Cargas
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab('atividades')}
                className={`flex-1 py-4 text-xs font-black uppercase tracking-wider transition-all border-b-2 text-center flex items-center justify-center gap-2 cursor-pointer ${
                  sidebarTab === 'atividades'
                    ? 'border-primary-gold text-white bg-slate-900/40'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <History className="w-4 h-4 text-primary-gold" />
                Atividades ({logs.length})
              </button>
            </div>
          </div>

          {/* Search Box (only for Resumo de Cargas tab) */}
          {sidebarTab === 'resumo' && (
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <div className="relative">
                <Search className="absolute left-3 top-[12px] w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2.5 text-xs text-primary-navy font-bold focus:ring-2 focus:ring-primary-gold outline-none transition-all"
                  placeholder="Buscar placa, motorista, destino ou lacre..."
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-[9px] text-xs text-slate-400 hover:text-slate-650 font-bold border-0 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tab Content Display Area */}
          <div className="flex-grow overflow-y-auto p-6 space-y-4">
            {sidebarTab === 'resumo' ? (
              filteredLoads.length === 0 ? (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 space-y-4 opacity-40">
                  <Truck className="w-12 h-12 text-slate-300" />
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 leading-normal">
                    {searchQuery ? 'Nenhuma carga correspondente' : 'Nenhuma carga lançada'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredLoads.map((load) => {
                    const isCurrentEdit = editingLoadId === load.id;
                    let statusBg = 'bg-amber-50 text-amber-805 border-amber-200';
                    if (load.status === CargoStatus.RELEASED) {
                      statusBg = 'bg-green-50 text-green-805 border-green-200';
                    } else if (load.status === CargoStatus.BLOCKED) {
                      statusBg = 'bg-red-50 text-red-805 border-red-200';
                    }

                    return (
                      <div
                        key={load.id}
                        onClick={() => handleEditLoad(load)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer group flex flex-col gap-3 text-left ${
                          isCurrentEdit
                            ? 'bg-blue-50/50 border-blue-400 shadow-md ring-2 ring-blue-400/20'
                            : 'bg-white border-slate-200/80 hover:bg-slate-50/60 hover:shadow-sm hover:border-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-mono font-black tracking-widest text-primary-navy uppercase bg-slate-100 px-2 py-0.5 rounded border border-slate-200 group-hover:bg-primary-gold/10 group-hover:border-primary-gold/30 transition-colors">
                                {load.plate}
                              </span>
                              <span className={`text-[8px] sm:text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${statusBg}`}>
                                {load.status.split(' ')[1] || load.status}
                              </span>
                            </div>
                            <div className="text-xs font-bold text-slate-700">
                              Motorista: <span className="font-semibold text-slate-500">{load.driverName}</span>
                              {load.driverPhone && (
                                <span className="text-slate-400 font-medium block mt-0.5">Tel: {load.driverPhone}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditLoad(load);
                              }}
                              className={`p-2 rounded-lg transition-all border-0 ${
                                isCurrentEdit
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-750'
                              }`}
                              title="Editar Carga"
                            >
                              <Pencil className="w-3 h-3 md:w-3.5 md:h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 border-t border-slate-100 pt-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          <div>
                            <span className="block text-[8px] text-slate-400 font-extrabold uppercase mb-0.5">Origem &rarr; Destino</span>
                            <span className="truncate block text-slate-700">{load.origin} &rarr; {load.destination}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] text-slate-400 font-extrabold uppercase mb-0.5">Lacre & Paletes</span>
                            <span className="block text-slate-700 font-semibold">L- {load.sealNumber || 'N/A'} ({load.palletCount} P)</span>
                          </div>
                        </div>

                        {load.createdAt && (
                          <div className="text-[9px] text-slate-400 flex items-center gap-1.5 pt-2 border-t border-dashed border-slate-100 uppercase tracking-widest font-extrabold">
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>Lançado: {new Date(load.createdAt).toLocaleDateString('pt-BR')} {new Date(load.createdAt).toTimeString().substring(0, 5)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            ) : logs.length === 0 ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 space-y-4 opacity-40">
                <History className="w-12 h-12 text-slate-300" />
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Nenhuma atividade recente</p>
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-left group hover:bg-white hover:border-blue-200 transition-all">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{log.action}</span>
                    <span className="text-[9px] text-slate-400 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-700 leading-snug">{log.details}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
