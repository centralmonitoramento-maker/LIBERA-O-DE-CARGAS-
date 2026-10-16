import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Compass, 
  MapPin, 
  Truck, 
  Play, 
  RefreshCw, 
  Search, 
  Clock, 
  Maximize2, 
  Activity, 
  Map as MapIcon,
  MapPinOff,
  User as UserIcon,
  Sparkles,
  Locate,
  Settings,
  AlertTriangle,
  ArrowUpDown,
  Filter,
  X,
  Pin,
  Bell,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Wrench,
  Gauge,
  Flag,
  FileText,
  Zap,
  Battery,
  Send,
  History,
  Check,
  Eye,
  EyeOff,
  Flame
} from 'lucide-react';
import { CargoLoad, CargoStatus, CargoType } from '../types';
import { Lojas_Atacadao } from '../data/lojas';
import { TELEMETRY_DATA } from '../data/telemetryData';

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

const resolveDestinationCoords = (name: any): [number, number] => {
  if (!name) return [-16.048231, -47.971867];
  const nameStr = String(name).toLowerCase();
  
  // 1. Direct or partial match in ROUTE_COORDINATES
  let geo = ROUTE_COORDINATES[name];
  if (!geo) {
    const key = Object.keys(ROUTE_COORDINATES).find(k => 
      k.toLowerCase().includes(nameStr) || 
      nameStr.includes(k.toLowerCase())
    );
    if (key) geo = ROUTE_COORDINATES[key];
  }
  if (geo) return [geo.lat, geo.lng];

  // 2. Fallback to Lojas_Atacadao
  const foundStore = Lojas_Atacadao.find(loja => {
    const storeName = String(loja.name || '').toLowerCase();
    return nameStr.includes(storeName) || storeName.includes(nameStr);
  });
  if (foundStore) return [foundStore.latitude, foundStore.longitude];

  // 3. Absolute fallback (Santa Maria)
  return [-16.048231, -47.971867];
};

const normalizePlateStr = (p: any): string => {
  if (!p) return '';
  return String(p).toUpperCase().replace(/[^A-Z0-9]/g, '');
};

const platesMatch = (p1?: string, p2?: string): boolean => {
  if (!p1 || !p2) return false;
  return normalizePlateStr(p1) === normalizePlateStr(p2);
};

// Custom coordinate to RA district reverse lookup
const getAddressForCoords = (latStr: string, lngStr: string, plate?: string): string => {
  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);
  if (isNaN(lat) || isNaN(lng)) return "Brasília, DF, Brasil";
  
  if (plate === 'KTU-4C64') return "Santa Maria, DF, Brasil";
  if (plate === 'BWP-1F60') return "Estrada Parque Núcleo Bandeirante, Samambaia, DF, Brasil";
  if (plate === 'BYE-9369') return "Estrada Parque Industrial e Abastecimento, Guará, DF, Brasil";
  if (plate === 'GWM-1F49') return "BR-040, Parque Três Poderes, Parque Três Pinheiros, DF, Brasil";
  if (plate === 'NGY-7119') return "Estrada Parque Industrial e Abastecimento, Brasília, DF, Brasil";

  // Dynamic thresholds
  if (lat < -16.03) return "Santa Maria, DF, Brasil";
  if (lat < -15.98) return "Gama, DF, Brasil";
  if (lat < -15.89) return "Núcleo Bandeirante, DF, Brasil";
  if (lat < -15.82) return "Guará, DF, Brasil";
  if (lat < -15.75) return "Asa Sul, Brasília, DF, Brasil";
  if (lat < -15.68) return "Asa Norte, Brasília, DF, Brasil";
  if (lng < -48.12) return "Ceilândia, DF, Brasil";
  if (lng < -48.05) return "Taguatinga, DF, Brasil";
  if (lng < -47.98) return "Samambaia, DF, Brasil";
  return "SIA, Brasília, DF, Brasil";
};

// Generates smooth realistic steps from standard CD SIA to selected vehicle target coordinates for paths tracing
const generateHistoryPath = (startLat: number, startLng: number): [number, number][] => {
  const cdLat = -15.7915;
  const cdLng = -47.9622;
  const path: [number, number][] = [];
  for (let i = 0; i <= 6; i++) {
    const ratio = i / 6;
    const lat = cdLat + (startLat - cdLat) * ratio + (Math.random() - 0.5) * 0.003;
    const lng = cdLng + (startLng - cdLng) * ratio + (Math.random() - 0.5) * 0.003;
    path.push([lat, lng]);
  }
  return path;
};

interface TrackingViewProps {
  loads: CargoLoad[];
}

interface TruckData {
  ras_vei_placa: string;
  ras_eve_latitude: string;
  ras_eve_longitude: string;
  ras_eve_velocidade: string;
  ras_eve_ignicao: string;
  driverName?: string;
  destinationName?: string;
  cargoType?: string;
  sealNumber?: string;
  realLoadId?: string;
  progressPercent?: number;
  lastUpdate?: string;
  status?: CargoStatus;
}

export const TrackingView: React.FC<TrackingViewProps> = ({ loads = [] }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [placa: string]: L.Marker }>({});
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const tracePolylineRef = useRef<L.Polyline | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  // States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPlaca, setSelectedPlaca] = useState<string | null>(null);
  const [trucks, setTrucks] = useState<TruckData[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [sidebarTab, setSidebarTab] = useState<'trucks' | 'loads'>('trucks');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLoadId, setSelectedLoadId] = useState<string | null>(null);
  const [hideOtherVehicles, setHideOtherVehicles] = useState<boolean>(false);

  const cdSiaCoordinates: [number, number] = [-15.7953, -47.9622];
  const cdSantaMariaCoordinates: [number, number] = [-16.048231, -47.971867];

  const fetchedRoutesRef = useRef<Set<string>>(new Set());

  // Helper: Get origin coordinates for a truck based on its associated cargo load
  const getOriginCoordinates = (truck: TruckData): [number, number] => {
    const matchedLoad = loads.find(l => platesMatch(l.plate, truck.ras_vei_placa));
    if (matchedLoad && matchedLoad.origin) {
      return resolveDestinationCoords(matchedLoad.origin);
    }
    return cdSantaMariaCoordinates;
  };

  // Helper: Get destination coordinates for a truck
  const getDestinationCoordinates = (truck: TruckData): [number, number] => {
    const matchedLoad = loads.find(l => platesMatch(l.plate, truck.ras_vei_placa));
    if (matchedLoad && matchedLoad.destination) {
      return resolveDestinationCoords(matchedLoad.destination);
    }
    const destCoords = findStoreCoordinates(truck.destinationName || '');
    return destCoords || cdSantaMariaCoordinates; // fallback to Santa Maria
  };

  // Helper: Generate expected route waypoints between origin and destination (highway backbone router)
  const getExpectedRoutePoints = (origin: [number, number], dest: [number, number]): [number, number][] => {
    const latDiff = Math.abs(origin[0] - dest[0]);
    const lngDiff = Math.abs(origin[1] - dest[1]);
    
    // If origin and destination are extremely close, return direct line
    if (latDiff < 0.01 && lngDiff < 0.01) {
      return [origin, dest];
    }

    const isFromSantaMaria = Math.abs(origin[0] - (-16.01515)) < 0.05 || Math.abs(origin[0] - (-16.048231)) < 0.05;
    
    if (isFromSantaMaria) {
      // Base route from Santa Maria going North along BR-040 / EPIA South
      const route: [number, number][] = [origin];
      
      // Step 1: Santa Maria to BR-040 near Valparaíso border
      route.push([-16.002, -47.989]);
      
      // Step 2: BR-040 near Catetinho
      route.push([-15.955, -47.978]);
      
      // Step 3: BR-040 / EPIA South Interchange
      route.push([-15.918, -47.969]);
      
      // Step 4: EPIA South near Park Way / Airport junction
      route.push([-15.882, -47.961]);

      // Determine the destination region to route through the correct highway
      const destLat = dest[0];
      const destLng = dest[1];

      if (destLng < -48.08) {
        // West/Ceilândia region (Ceilândia, Samambaia, BR-070)
        route.push([-15.836, -47.945]); // EPIA Zoo
        route.push([-15.798, -47.947]); // EPIA SIA
        route.push([-15.776, -47.995]); // Estrutural / Vicente Pires
        route.push([-15.793, -48.065]); // Estrutural West / Pistão Norte
        route.push([-15.811, -48.115]); // BR-070 Ceilândia
      } else if (destLng < -47.99) {
        // West-Central / Taguatinga, Águas Claras, Vicente Pires
        route.push([-15.836, -47.945]); // EPIA Zoo
        route.push([-15.815, -47.985]); // EPTG Vicente Pires entrance
        route.push([-15.835, -48.015]); // EPTG Águas Claras entrance
      } else if (destLat > -15.75) {
        // North region (Sobradinho, Planaltina, Formosa)
        route.push([-15.836, -47.945]); // EPIA Zoo
        route.push([-15.798, -47.947]); // EPIA SIA
        route.push([-15.735, -47.905]); // EPIA North Balão do Torto
        
        if (destLng > -47.6) {
          // Formosa
          route.push([-15.660, -47.800]); // BR-020 Sobradinho
          route.push([-15.617, -47.669]); // BR-020 Planaltina
          route.push([-15.570, -47.500]); // BR-020 to Formosa
        } else if (destLat > -15.64) {
          // Planaltina
          route.push([-15.660, -47.800]); // BR-020 Sobradinho
          route.push([-15.617, -47.669]); // BR-020 Planaltina
        } else {
          // Sobradinho
          route.push([-15.660, -47.800]); // BR-020 Sobradinho
        }
      } else if (destLat < -16.05) {
        // South region (Luziânia)
        const southRoute: [number, number][] = [origin];
        southRoute.push([-16.055, -48.020]); // Novo Gama / BR-040 South
        southRoute.push([-16.150, -47.990]); // BR-040 South midway
        southRoute.push([-16.255, -47.939]); // Luziânia
        southRoute.push(dest);
        return southRoute;
      } else {
        // Central region (SIA, Guará, Jardim Botânico, Riacho Fundo)
        route.push([-15.836, -47.945]); // EPIA Zoo / Guará
        if (destLat > -15.81) {
          route.push([-15.798, -47.947]); // EPIA SIA
        }
      }

      route.push(dest);
      return route;
    }

    // Default generic 4-segment interpolation fallback
    const lat1 = origin[0] + (dest[0] - origin[0]) * 0.35 + (dest[0] > origin[0] ? -0.003 : 0.003);
    const lng1 = origin[1] + (dest[1] - origin[1]) * 0.35 + (dest[1] > origin[1] ? 0.004 : -0.004);
    
    const lat2 = origin[0] + (dest[0] - origin[0]) * 0.70 + (dest[0] > origin[0] ? 0.002 : -0.002);
    const lng2 = origin[1] + (dest[1] - origin[1]) * 0.70 + (dest[1] > origin[1] ? -0.003 : 0.003);
    
    return [origin, [lat1, lng1], [lat2, lng2], dest];
  };

  // Helper: Get full planned route sequence for a truck including additional destinations (Carga Compartilhada)
  const getTruckRoutePoints = (truck: TruckData): [number, number][] => {
    const placa = truck.ras_vei_placa;
    const matchedLoad = loads.find(l => platesMatch(l.plate, placa));
    const origin = getOriginCoordinates(truck);
    const dest = getDestinationCoordinates(truck);
    const addDests = matchedLoad && matchedLoad.cargoType === CargoType.COMPARTILHADA 
      ? (matchedLoad.additionalDestinations || []).join('|')
      : '';
    const routeKey = `${placa}_${origin[0]},${origin[1]}_${dest[0]},${dest[1]}_${addDests}`;

    // If OSRM has returned the high-precision road coordinate points, use them!
    if (osrmRoutes[routeKey]) {
      return osrmRoutes[routeKey];
    }
    if (osrmRoutes[placa]) {
      return osrmRoutes[placa];
    }

    let waypoints: [number, number][] = [];
    waypoints.push(...getExpectedRoutePoints(origin, dest));
    
    if (matchedLoad && matchedLoad.cargoType === CargoType.COMPARTILHADA && matchedLoad.additionalDestinations && matchedLoad.additionalDestinations.length > 0) {
      let currentDest = dest;
      matchedLoad.additionalDestinations.forEach(addDestName => {
        const nextDest = resolveDestinationCoords(addDestName);
        const legPoints = getExpectedRoutePoints(currentDest, nextDest);
        waypoints.push(...legPoints.slice(1));
        currentDest = nextDest;
      });
    }
    
    return waypoints;
  };

  // Helper: Interpolate truck position along expected route based on progress percent
  const getTruckPositionOnRoute = (origin: [number, number], dest: [number, number], progress: number): [number, number] => {
    const ratio = progress / 100;
    const waypoints = getExpectedRoutePoints(origin, dest);
    const numSegments = waypoints.length - 1;
    const segmentIndex = Math.min(Math.floor(ratio * numSegments), numSegments - 1);
    const segmentRatio = (ratio * numSegments) - segmentIndex;
    
    const start = waypoints[segmentIndex];
    const end = waypoints[segmentIndex + 1];
    
    const lat = start[0] + (end[0] - start[0]) * segmentRatio;
    const lng = start[1] + (end[1] - start[1]) * segmentRatio;
    return [lat, lng];
  };

  const getTruckPositionOnRoutePoints = (waypoints: [number, number][], progress: number): [number, number] => {
    if (waypoints.length === 0) return cdSantaMariaCoordinates;
    if (waypoints.length === 1) return waypoints[0];
    
    const ratio = progress / 100;
    const numSegments = waypoints.length - 1;
    const segmentIndex = Math.min(Math.floor(ratio * numSegments), numSegments - 1);
    const segmentRatio = (ratio * numSegments) - segmentIndex;
    
    const start = waypoints[segmentIndex];
    const end = waypoints[segmentIndex + 1];
    
    const lat = start[0] + (end[0] - start[0]) * segmentRatio;
    const lng = start[1] + (end[1] - start[1]) * segmentRatio;
    return [lat, lng];
  };

  // Visual/Interactive GIS States
  const [mapStyle, setMapStyle] = useState<'osm' | 'dark' | 'satellite'>('osm');
  const [mapLabelToggle, setMapLabelToggle] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  // Selected Truck Drawer states
  const [isDetailPinned, setIsDetailPinned] = useState<boolean>(false);
  const [isResumoExpanded, setIsResumoExpanded] = useState<boolean>(true);
  const [isInfoExpanded, setIsInfoExpanded] = useState<boolean>(true);
  
  // Interactive Shortcut Actions
  const [activeTracePlaca, setActiveTracePlaca] = useState<string | null>(null);
  const [activeRoutePlaca, setActiveRoutePlaca] = useState<string | null>(null);
  const [activeShortcutAction, setActiveShortcutAction] = useState<string | null>(null);
  const [traces, setTraces] = useState<{ [placa: string]: [number, number][] }>({});
  const [osrmRoutes, setOsrmRoutes] = useState<Record<string, [number, number][]>>({});

  const [comandosLogs, setComandosLogs] = useState<{ [placa: string]: string[] }>({});
  const [blockLoading, setBlockLoading] = useState<boolean>(false);

  // Helper: Find Coordinates
  const findStoreCoordinates = (destName: string): [number, number] | null => {
    if (!destName) return null;
    return resolveDestinationCoords(destName);
  };

  // Sync trucks from telemetry and Firestore loads
  useEffect(() => {
    const baseTrucks: TruckData[] = TELEMETRY_DATA.map(t => {
      const matchedLoad = loads.find(l => platesMatch(l.plate, t.ras_vei_placa));
      const existingTruck = trucks.find(x => platesMatch(x.ras_vei_placa, t.ras_vei_placa));
      
      const baselineProgress = existingTruck?.progressPercent !== undefined
        ? existingTruck.progressPercent
        : (matchedLoad?.status === CargoStatus.RELEASED ? Math.floor(Math.random() * 50) + 25 : 0);

      const destinationName = matchedLoad?.destination || (t.ras_vei_placa === 'KTU-4C64' ? 'Santa Maria (DF)' : 'Atacadão SIA');
      const tempTruck: TruckData = {
        ras_vei_placa: t.ras_vei_placa,
        ras_eve_latitude: t.ras_eve_latitude,
        ras_eve_longitude: t.ras_eve_longitude,
        ras_eve_velocidade: t.ras_eve_velocidade,
        ras_eve_ignicao: t.ras_eve_ignicao,
        destinationName
      };

      const routePts = getTruckRoutePoints(tempTruck);

      let initialLat = t.ras_eve_latitude;
      let initialLng = t.ras_eve_longitude;

      if (matchedLoad?.status === CargoStatus.RELEASED) {
        const normalPos = getTruckPositionOnRoutePoints(routePts, baselineProgress);
        initialLat = String(normalPos[0]);
        initialLng = String(normalPos[1]);
      }

      return {
        ras_vei_placa: t.ras_vei_placa,
        ras_eve_latitude: initialLat,
        ras_eve_longitude: initialLng,
        ras_eve_velocidade: matchedLoad?.status === CargoStatus.RELEASED 
          ? (existingTruck?.ras_eve_velocidade || String(Math.floor(Math.random() * 21) + 50)) 
          : t.ras_eve_velocidade,
        ras_eve_ignicao: matchedLoad?.status === CargoStatus.RELEASED 
          ? "1" 
          : t.ras_eve_ignicao,
        driverName: matchedLoad?.driverName || (t.ras_vei_placa === 'KTU-4C64' ? 'Valdir Brandão' : 'Raimundo Silveira'),
        destinationName: destinationName,
        cargoType: matchedLoad?.cargoType || "Mista",
        sealNumber: matchedLoad?.sealNumber || "",
        realLoadId: matchedLoad?.id,
        progressPercent: baselineProgress,
        lastUpdate: existingTruck?.lastUpdate || new Date().toLocaleTimeString(),
        status: matchedLoad?.status
      };
    });

    const customLoads = loads.filter(
      l => l.plate && !TELEMETRY_DATA.some(t => platesMatch(t.ras_vei_placa, l.plate))
    );

    const customMapped: TruckData[] = customLoads.map((load) => {
      const destinationName = load.destination || '';
      const tempTruck: TruckData = {
        ras_vei_placa: load.plate ? load.plate.toUpperCase() : "PLA-0000",
        ras_eve_latitude: "0",
        ras_eve_longitude: "0",
        ras_eve_velocidade: "0",
        ras_eve_ignicao: "0",
        destinationName
      };

      const routePts = getTruckRoutePoints(tempTruck);

      const existingTruck = trucks.find(x => platesMatch(x.ras_vei_placa, load.plate));
      const baselineProgress = existingTruck?.progressPercent !== undefined
        ? existingTruck.progressPercent
        : (load.status === CargoStatus.RELEASED ? Math.floor(Math.random() * 50) + 25 : 0);

      let initialLat = routePts.length > 0 ? String(routePts[routePts.length - 1][0]) : String(cdSantaMariaCoordinates[0]);
      let initialLng = routePts.length > 0 ? String(routePts[routePts.length - 1][1]) : String(cdSantaMariaCoordinates[1]);

      if (load.status === CargoStatus.RELEASED) {
        const normalPos = getTruckPositionOnRoutePoints(routePts, baselineProgress);
        initialLat = String(normalPos[0]);
        initialLng = String(normalPos[1]);
      } else {
        const originCoords = getOriginCoordinates(tempTruck);
        initialLat = existingTruck?.ras_eve_latitude || String(originCoords[0]);
        initialLng = existingTruck?.ras_eve_longitude || String(originCoords[1]);
      }

      return {
        ras_vei_placa: load.plate ? load.plate.toUpperCase() : "PLA-0000",
        ras_eve_latitude: initialLat,
        ras_eve_longitude: initialLng,
        ras_eve_velocidade: existingTruck?.ras_eve_velocidade || (load.status === CargoStatus.RELEASED ? String(Math.floor(Math.random() * 21) + 50) : "0"),
        ras_eve_ignicao: existingTruck?.ras_eve_ignicao || (load.status === CargoStatus.RELEASED ? "1" : "0"),
        driverName: load.driverName,
        destinationName: load.destination,
        cargoType: load.cargoType || "Mista",
        sealNumber: load.sealNumber,
        realLoadId: load.id,
        progressPercent: baselineProgress,
        lastUpdate: existingTruck?.lastUpdate || new Date().toLocaleTimeString(),
        status: load.status
      };
    });

    const allMerged = [...baseTrucks];
    customMapped.forEach(item => {
      const idx = allMerged.findIndex(x => platesMatch(x.ras_vei_placa, item.ras_vei_placa));
      if (idx === -1) {
        allMerged.push(item);
      } else {
        allMerged[idx] = { ...allMerged[idx], ...item };
      }
    });

    setTrucks(allMerged);
    setLastSyncTime(prev => prev || new Date().toLocaleTimeString());
  }, [loads]);

  // Seed Traces for all trucks
  useEffect(() => {
    if (trucks.length === 0) return;
    const seeded: { [plate: string]: [number, number][] } = {};
    trucks.forEach(t => {
      const lat = parseFloat(t.ras_eve_latitude);
      const lng = parseFloat(t.ras_eve_longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        seeded[t.ras_vei_placa] = generateHistoryPath(lat, lng);
      }
    });
    setTraces(seeded);
  }, [trucks.length]);



  // Reactive OSRM Route Fetching Effect
  useEffect(() => {
    let active = true;

    const fetchActiveRoutes = async () => {
      // Find plates that need high-precision street routes:
      // - Trucks with active/released cargo
      // - Active route displaying
      // - Selected vehicle
      const platesToFetch = new Set<string>();
      
      trucks.forEach(t => {
        const matchedLoad = loads.find(l => platesMatch(l.plate, t.ras_vei_placa));
        if (matchedLoad?.status === CargoStatus.RELEASED) {
          platesToFetch.add(t.ras_vei_placa);
        }
      });

      if (activeRoutePlaca) {
        platesToFetch.add(activeRoutePlaca);
      }
      if (selectedPlaca) {
        platesToFetch.add(selectedPlaca);
      }

      for (const placa of platesToFetch) {
        if (!active) return;
        const truck = trucks.find(t => t.ras_vei_placa === placa);
        if (!truck) continue;

        const matchedLoad = loads.find(l => platesMatch(l.plate, placa));
        const origin = getOriginCoordinates(truck);
        const dest = getDestinationCoordinates(truck);
        const addDests = matchedLoad && matchedLoad.cargoType === CargoType.COMPARTILHADA 
          ? (matchedLoad.additionalDestinations || []).join('|')
          : '';
        const routeKey = `${placa}_${origin[0]},${origin[1]}_${dest[0]},${dest[1]}_${addDests}`;

        // If already cached or currently fetching, skip
        if (osrmRoutes[routeKey] || fetchedRoutesRef.current.has(routeKey)) continue;

        // Mark as fetching/fetched to prevent duplicate parallel requests
        fetchedRoutesRef.current.add(routeKey);

        // Form multiple stop coordinates: [Origin, Destination, ...AdditionalDestinations]
        const points: [number, number][] = [origin, dest];
        if (matchedLoad && matchedLoad.cargoType === CargoType.COMPARTILHADA && matchedLoad.additionalDestinations && matchedLoad.additionalDestinations.length > 0) {
          matchedLoad.additionalDestinations.forEach(addDestName => {
            points.push(resolveDestinationCoords(addDestName));
          });
        }

        const coordString = points.map(p => `${p[1]},${p[0]}`).join(';');
        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`;
          const response = await fetch(url);
          if (response.ok && active) {
            const data = await response.json();
            if (data.code === 'Ok' && data.routes && data.routes[0]) {
              const coords = data.routes[0].geometry.coordinates;
              const routePoints = coords.map((c: any) => [c[1], c[0]] as [number, number]);
              setOsrmRoutes(prev => ({
                ...prev,
                [routeKey]: routePoints,
                [placa]: routePoints
              }));
            } else {
              // On OSRM error or no routes, remove from ref so we can retry or fallback later
              fetchedRoutesRef.current.delete(routeKey);
            }
          } else {
            fetchedRoutesRef.current.delete(routeKey);
          }
        } catch (err) {
          console.error(`Failed to fetch high-precision OSRM route for ${placa}:`, err);
          fetchedRoutesRef.current.delete(routeKey);
        }
      }
    };

    fetchActiveRoutes();

    return () => {
      active = false;
    };
  }, [trucks, loads, activeRoutePlaca, selectedPlaca]);

  // Leaflet Map Initial setup
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    // Safely cleanup the previous map instance if it exists
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (err) {
        console.warn("Error removing previous map instance:", err);
      }
      mapInstanceRef.current = null;
    }

    // Safely remove pre-existing _leaflet_id to avoid "Map container is already initialized" crash
    const container = mapContainerRef.current;
    if (container && (container as any)._leaflet_id) {
      (container as any)._leaflet_id = null;
    }

    let map: L.Map;
    try {
      map = L.map(container, {
        zoomControl: false,
        attributionControl: false
      }).setView([-15.79361, -47.88215], 11);
    } catch (e) {
      console.warn("Failed to initialize Leaflet map, retrying after resetting container:", e);
      if (container) {
        container.innerHTML = "";
        (container as any)._leaflet_id = null;
      }
      map = L.map(container, {
        zoomControl: false,
        attributionControl: false
      }).setView([-15.79361, -47.88215], 11);
    }

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (err) {
          console.warn("Cleanup error removing map:", err);
        }
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Force Leaflet map resize/invalidate size when panels shift or window resizes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleResize = () => {
      map.invalidateSize();
    };

    // Multiple timeouts to capture layout changes before/after transition end
    handleResize();
    const t1 = setTimeout(handleResize, 50);
    const t2 = setTimeout(handleResize, 150);
    const t3 = setTimeout(handleResize, 300);
    const t4 = setTimeout(handleResize, 500);

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      window.removeEventListener('resize', handleResize);
    };
  }, [selectedPlaca, sidebarTab, isFullscreen]);



  // Dynamic Tile Layer Swapping
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    let url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    let attribution = '';
    
    if (mapStyle === 'dark') {
      url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      attribution = '&copy; OpenStreetMap &copy; CARTO';
    } else if (mapStyle === 'satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = 'Tiles &copy; Esri World Imagery';
    } else {
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '&copy; OpenStreetMap';
    }

    const layer = L.tileLayer(url, {
      maxZoom: 19,
      attribution
    }).addTo(map);

    tileLayerRef.current = layer;
  }, [mapStyle]);



  // Marker click delegator (binds 'Ver também' inside Leaflet popup inside React)
  useEffect(() => {
    const handlePopupClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.id && target.id.startsWith('popup-ver-tambem-')) {
        e.preventDefault();
        const plate = target.id.replace('popup-ver-tambem-', '');
        const truck = trucks.find(t => t.ras_vei_placa === plate);
        if (truck) {
          handleFocusTruck(truck);
        }
      }
    };
    document.addEventListener('click', handlePopupClick);
    return () => {
      document.removeEventListener('click', handlePopupClick);
    };
  }, [trucks]);

   // Update Map Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const visibleTrucks = hideOtherVehicles && selectedLoadId
      ? trucks.filter(t => t.realLoadId === selectedLoadId)
      : trucks;

    Object.keys(markersRef.current).forEach(placa => {
      const exists = visibleTrucks.some(t => t.ras_vei_placa === placa);
      if (!exists) {
        markersRef.current[placa].remove();
        delete markersRef.current[placa];
      }
    });

    visibleTrucks.forEach(truck => {
      const lat = parseFloat(truck.ras_eve_latitude);
      const lng = parseFloat(truck.ras_eve_longitude);
      
      const matchedLoad = loads.find(l => platesMatch(l.plate, truck.ras_vei_placa));
      const isDivergent = matchedLoad?.status === CargoStatus.BLOCKED;
      const address = getAddressForCoords(truck.ras_eve_latitude, truck.ras_eve_longitude, truck.ras_vei_placa);

      let releaseStatus = 'Sem Carga Vinculada';
      let releaseStatusBg = '#f1f5f9';
      let releaseStatusColor = '#475569';
      let releaseStatusBorder = '#cbd5e1';

      if (matchedLoad) {
        if (matchedLoad.status === CargoStatus.RELEASED) {
          releaseStatus = 'Liberada';
          releaseStatusBg = '#dcfce7';
          releaseStatusColor = '#166534';
          releaseStatusBorder = '#bbf7d0';
        } else if (matchedLoad.status === CargoStatus.AWAITING) {
          releaseStatus = 'Aguardando';
          releaseStatusBg = '#fef9c3';
          releaseStatusColor = '#854d0e';
          releaseStatusBorder = '#fef08a';
        } else if (matchedLoad.status === CargoStatus.BLOCKED) {
          releaseStatus = 'Bloqueada';
          releaseStatusBg = '#fee2e2';
          releaseStatusColor = '#991b1b';
          releaseStatusBorder = '#fecaca';
        }
      }

      let voltage = '12 V';
      if (truck.ras_vei_placa === 'NGY-7119') voltage = '27 V';
      else if (truck.ras_vei_placa === 'BWP-1F60' || truck.ras_vei_placa === 'GWM-1F49') voltage = '14 V';
      else if (truck.ras_vei_placa === 'BYE-9369') voltage = '11 V';

      const isSelectedLoad = selectedLoadId && truck.realLoadId === selectedLoadId;

      // Circle grey/green markers exactly matching image
      let markerColor = isDivergent
        ? 'bg-amber-500 ring-2 ring-amber-400/25'
        : truck.ras_eve_ignicao === '1'
          ? 'bg-emerald-600 text-white border border-white ring-4 ring-emerald-500/10'
          : 'bg-slate-500 text-white border border-white ring-4 ring-slate-400/10';

      if (isSelectedLoad) {
        markerColor = 'bg-indigo-600 text-white border-2 border-primary-gold ring-8 ring-indigo-500/40 scale-125 z-[1000]';
      }

      const iconHtml = `
        <div class="relative group cursor-pointer flex flex-col items-center">
          ${isSelectedLoad ? `
            <div class="absolute -inset-3 bg-indigo-500/30 rounded-full animate-ping pointer-events-none duration-1000"></div>
          ` : ''}

          <!-- Grey/Green circular markers with flat truck design design -->
          <div class="relative w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg ${markerColor}">
            <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19,8.18V5a1,1,0,0,0-1-1H3a1,1,0,0,0-1,1V17a1,1,0,0,0,1,1H5a3,3,0,0,0,6,0h4a3,3,0,0,0,6,0h1a1,1,0,0,0,1-1V11.23M7,19a1.5,1.5,0,1,1,1.5-1.5A1.5,1.5,0,0,1,7,19Zm4-3H8.22a2.92,2.92,0,0,0-2.43,0H4V6H16v8.42A3,3,0,0,0,11,16Zm6,3a1.5,1.5,0,1,1,1.5-1.5A1.5,1.5,0,0,1,7,19Zm4-1H18.78a2.92,2.92,0,0,0-2.43,0H15V10h4.56L21,11.78Z" />
            </svg>
            
            ${truck.ras_eve_ignicao === '1' ? `
              <span class="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 border border-white rounded-full"></span>
            ` : ''}
          </div>

          <!-- Pined text block plates -->
          ${mapLabelToggle ? `
            <div class="absolute -bottom-5 ${isSelectedLoad ? 'bg-indigo-900 border-primary-gold text-primary-gold font-bold scale-110 z-[1001]' : 'bg-slate-900/90 border border-slate-700 text-white'} font-mono font-black text-[7.5px] px-1.5 py-0.5 rounded shadow whitespace-nowrap tracking-wider">
              ${truck.ras_vei_placa}
            </div>
          ` : ''}
        </div>
      `;

      const divIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-tracker-leaflet-div',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -12]
      });

      // Perfect popup balloons mirroring the screenshot
      const popupContent = `
        <div style="font-family: sans-serif; font-size: 11px; padding: 4px; width: 232px; line-height: 1.4; color: #1e293b;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 5px;">
            <span style="font-weight: 800; font-family: monospace; font-size: 13px; color: #0f172a;">${truck.ras_vei_placa}</span>
            <span style="font-size: 8.5px; color: #64748b; display: flex; align-items: center; gap: 3px;">
              <svg style="width: 10px; height: 10px; color: #475569;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path d="M12 18h.01M8.5 14.5a5 5 0 017 0M5 11a10 10 0 0114 0" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
              09/06/2026 ${truck.lastUpdate || '14:32:39'}
            </span>
          </div>

          <div style="font-size: 9.5px; color: #475569; margin-bottom: 7px; font-weight: 500;">
            ${address}
          </div>
          
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; padding: 2px 0;">
            <span style="font-size: 8.5px; font-weight: 800; color: #64748b; text-transform: uppercase;">Expedição:</span>
            <span style="padding: 1.5px 5.5px; border-radius: 4px; font-size: 8.5px; font-weight: 950; background-color: ${releaseStatusBg}; color: ${releaseStatusColor}; border: 1px solid ${releaseStatusBorder}; text-transform: uppercase; letter-spacing: 0.3px;">
              ${releaseStatus}
            </span>
          </div>

          ${matchedLoad ? `
          <div style="font-size: 8.5px; color: #475569; margin-bottom: 6px; padding: 4px 6px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; display: flex; flex-direction: column; gap: 2px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 700; color: #64748b; text-transform: uppercase;">Motorista:</span>
              <span style="font-weight: 800; color: #334155; text-transform: uppercase;">${matchedLoad.driverName}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 700; color: #64748b; text-transform: uppercase;">Destino:</span>
              <span style="font-weight: 850; color: #1e293b; text-transform: uppercase; text-overflow: ellipsis; white-space: nowrap; overflow: hidden; max-width: 130px; text-align: right;" title="${matchedLoad.destination}">${matchedLoad.destination}</span>
            </div>
          </div>
          ` : ''}
          
          <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 5px;">
            <span style="padding: 1.5px 5.5px; border-radius: 4px; font-size: 8.5px; font-weight: 900; background: ${truck.ras_eve_ignicao === '1' ? '#3b82f6 text-white' : '#475569'}; background-color: ${truck.ras_eve_ignicao === '1' ? '#2563eb' : '#334155'}; color: #ffffff; border: 1px solid ${truck.ras_eve_ignicao === '1' ? '#1d4ed8' : '#1e293b'}; text-transform: uppercase;">
              ${truck.ras_eve_ignicao === '1' ? 'Ligado em movimento' : 'Ignição desligada'}
            </span>
            <span style="padding: 1.5px 5.5px; border-radius: 4px; font-size: 8.5px; font-weight: 900; background-color: #334155; color: #ffffff; border: 1px solid #1e293b; text-transform: uppercase;">
              Não especificado
            </span>
            <span style="padding: 1.5px 5.5px; border-radius: 4px; font-size: 8.5px; font-weight: 900; background-color: #f8fafc; color: #475569; border: 1px solid #cbd5e1;">
              ${truck.ras_eve_ignicao === '1' ? truck.ras_eve_velocidade + ' km/h' : '0 km/h'}
            </span>
          </div>
          
          <div style="display: flex; gap: 4px; margin-bottom: 8px;">
            <span style="padding: 1.5px 5.5px; border-radius: 4px; font-size: 8.5px; font-weight: 900; background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1;">
              ⚡ 100%
            </span>
            <span style="padding: 1.5px 5.5px; border-radius: 4px; font-size: 8.5px; font-weight: 900; background-color: #fef9c3; color: #854d0e; border: 1px solid #fef08a;">
              ⚡ ${voltage}
            </span>
          </div>
          
          <div style="font-weight: 800; font-size: 9.5px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
            ATACADAO DIA A DIA
          </div>
          
          <div style="margin-top: 8px; border-top: 1px solid #f1f5f9; padding-top: 6px; display: flex; justify-content: flex-end;">
            <a href="#" style="color: #0284c7; font-weight: 700; text-decoration: none; font-size: 9px;" id="popup-ver-tambem-${truck.ras_vei_placa}">Ver também</a>
          </div>
        </div>
      `;

      if (markersRef.current[truck.ras_vei_placa]) {
        markersRef.current[truck.ras_vei_placa].setLatLng([lat, lng]);
        markersRef.current[truck.ras_vei_placa].setIcon(divIcon);
        markersRef.current[truck.ras_vei_placa].getPopup()?.setContent(popupContent);
      } else {
        const marker = L.marker([lat, lng], { icon: divIcon })
          .addTo(map)
          .bindPopup(popupContent);
        markersRef.current[truck.ras_vei_placa] = marker;
      }
    });
  }, [trucks, loads, mapLabelToggle, selectedLoadId, hideOtherVehicles]);

  // Handle Focus On Vehicle
  const handleFocusTruck = (truck: TruckData) => {
    setSelectedPlaca(truck.ras_vei_placa);
    setIsResumoExpanded(true);
    setIsInfoExpanded(true);
    
    const map = mapInstanceRef.current;
    if (map) {
      const lat = parseFloat(truck.ras_eve_latitude);
      const lng = parseFloat(truck.ras_eve_longitude);
      map.flyTo([lat, lng], 14, { animate: true, duration: 1.2 });

      setTimeout(() => {
        markersRef.current[truck.ras_vei_placa]?.openPopup();
      }, 1200);
    }
  };

  // Traces and scheduled routes Polyline overlay drawer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tracePolylineRef.current) {
      tracePolylineRef.current.remove();
      tracePolylineRef.current = null;
    }
    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }

    if (activeTracePlaca && traces[activeTracePlaca]) {
      const pts = traces[activeTracePlaca];
      if (pts.length > 1) {
        const poly = L.polyline(pts, {
          color: '#2563eb',
          weight: 4,
          dashArray: '5, 8',
          opacity: 0.9
        }).addTo(map);
        tracePolylineRef.current = poly;
        try {
          map.fitBounds(poly.getBounds(), { padding: [50, 50] });
        } catch(e) {}
      }
    }

    if (activeRoutePlaca) {
      const truck = trucks.find(t => t.ras_vei_placa === activeRoutePlaca);
      if (truck) {
        const routePts = getTruckRoutePoints(truck);

        const poly = L.polyline(routePts, {
          color: '#4f46e5',
          weight: 5,
          opacity: 0.85
        }).addTo(map);
        routePolylineRef.current = poly;
        try {
          map.fitBounds(poly.getBounds(), { padding: [50, 50] });
        } catch(e) {}
      }
    }
  }, [activeTracePlaca, activeRoutePlaca, traces, trucks]);

  const triggerManualFetch = () => {
    setTrucks(prev => prev.map(t => ({
      ...t,
      ras_eve_velocidade: t.ras_eve_ignicao === '1' ? String(Math.floor(Math.random() * 30) + 40) : '0',
      lastUpdate: new Date().toLocaleTimeString()
    })));
    setLastSyncTime(new Date().toLocaleTimeString());
  };

  const toggleIgnition = (placa: string) => {
    setTrucks(prev => prev.map(t => {
      if (t.ras_vei_placa === placa) {
        const isCurrentlyLigada = t.ras_eve_ignicao === '1';
        return {
          ...t,
          ras_eve_ignicao: isCurrentlyLigada ? '0' : '1',
          ras_eve_velocidade: isCurrentlyLigada ? '0' : '48',
          lastUpdate: new Date().toLocaleTimeString()
        };
      }
      return t;
    }));
  };

  // Post live telemetry commands
  const sendTelemetryCommand = (cmd: string, p: string) => {
    setBlockLoading(true);
    setTimeout(() => {
      setBlockLoading(false);
      setComandosLogs(prev => {
        const list = prev[p] || [];
        const cleanTimestamp = new Date().toLocaleTimeString();
        let feedback = `[${cleanTimestamp}] Comando enviado com sucesso!`;
        if (cmd === 'lock') {
          feedback = `[${cleanTimestamp}] Bloqueio de Ignição efetuado.`;
          setTrucks(tr => tr.map(t => t.ras_vei_placa === p ? { ...t, ras_eve_ignicao: '0', ras_eve_velocidade: '0' } : t));
        } else if (cmd === 'unlock') {
          feedback = `[${cleanTimestamp}] Ignição Desbloqueada e liberada.`;
          setTrucks(tr => tr.map(t => t.ras_vei_placa === p ? { ...t, ras_eve_ignicao: '1' } : t));
        } else if (cmd === 'sirene') {
          feedback = `[${cleanTimestamp}] Sirene de cabine ativa de emergência enviada.`;
        } else if (cmd === 'buzzer') {
          feedback = `[${cleanTimestamp}] Alerta sonoro de teclado ativo de cabine.`;
        }
        return {
          ...prev,
          [p]: [feedback, ...list]
        };
      });
    }, 1200);
  };

  const handleShortcutClick = (actionName: string) => {
    if (!selectedPlaca) return;
    const truck = trucks.find(t => t.ras_vei_placa === selectedPlaca);
    if (!truck) return;
    
    if (actionName === 'mapas') {
      window.open(`https://www.google.com/maps?q=${truck.ras_eve_latitude},${truck.ras_eve_longitude}`, '_blank');
      return;
    }
    
    if (actionName === 'trajeto') {
      if (activeTracePlaca === selectedPlaca) {
        setActiveTracePlaca(null);
      } else {
        setActiveTracePlaca(selectedPlaca);
        setActiveRoutePlaca(null);
      }
      return;
    }
    
    if (actionName === 'rota') {
      if (activeRoutePlaca === selectedPlaca) {
        setActiveRoutePlaca(null);
      } else {
        setActiveRoutePlaca(selectedPlaca);
        setActiveTracePlaca(null);
      }
      return;
    }
    
    setActiveShortcutAction(activeShortcutAction === actionName ? null : actionName);
  };

  const filteredTrucks = trucks.filter(t => {
    const matchesSearch = 
      t.ras_vei_placa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.driverName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.destinationName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    const matchedLoad = loads.find(l => platesMatch(l.plate, t.ras_vei_placa));
    if (statusFilter === 'all') return true;
    if (statusFilter === 'em_transito') return matchedLoad?.status === CargoStatus.RELEASED;
    if (statusFilter === 'aguardando') return matchedLoad?.status === CargoStatus.AWAITING;
    if (statusFilter === 'alerta') return matchedLoad?.status === CargoStatus.BLOCKED;
    if (statusFilter === 'sem_carga') return !matchedLoad;
    return true;
  });

  const selectedTruckObj = trucks.find(t => t.ras_vei_placa === selectedPlaca);
  const selectedTruckLoad = selectedTruckObj ? loads.find(l => platesMatch(l.plate, selectedTruckObj.ras_vei_placa)) : null;

  return (
    <div className={`flex flex-col lg:flex-row gap-5 relative ${isFullscreen ? 'fixed inset-0 z-[1050] bg-slate-100 p-6 h-screen' : 'h-[calc(100vh-10rem)] min-h-[580px]'} select-none transition-all duration-300 font-sans text-left`}>
      
      {/* PANEL 1: SIDEBAR LIST OF VEHICLES */}
      <div className={`bg-white rounded-2xl border border-slate-200 p-5 flex flex-col h-full shrink-0 transition-all duration-300 ${isFullscreen ? 'w-full lg:w-96' : 'w-full lg:w-[380px] xl:w-[400px]'}`}>
        
        {/* Header Title Section */}
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h2 className="text-xs font-black text-slate-850 tracking-wider uppercase flex items-center gap-1.5 font-sans">
              <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
              SISTEMA CARGA RADAR
            </h2>
            <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">
              Monitoramento Corporativo
            </p>
          </div>
          <span className="text-[8px] font-extrabold bg-primary-gold/10 text-primary-gold border border-primary-gold/20 px-2 py-0.5 rounded tracking-wider flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            TELEMETRIA G7
          </span>
        </div>

        {/* Column isolation tabs */}
        <div className="flex bg-slate-100 rounded-xl p-1 mb-4 select-none">
          <button
            type="button"
            onClick={() => setSidebarTab('trucks')}
            className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              sidebarTab === 'trucks'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            Veículos ({trucks.length})
          </button>
          <button
            type="button"
            onClick={() => setSidebarTab('loads')}
            className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              sidebarTab === 'loads'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Cargas ({loads.length})
          </button>
        </div>

        {/* TAB 1 CONTENT: CAMINHÕES LIST */}
        {sidebarTab === 'trucks' && (
          <div className="flex flex-col flex-grow overflow-hidden">
            
            {/* Search, Filter, Sort and Gear buttons identical to mockups */}
            <div className="flex gap-2 items-center mb-3">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs font-semibold text-slate-700 placeholder-slate-400 outline-none focus:ring-1 focus:ring-slate-300 transition-all"
                  placeholder="Pesquisar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button 
                onClick={triggerManualFetch}
                className="p-1.5 border border-slate-200 bg-white rounded-lg text-slate-500 hover:bg-slate-50 cursor-pointer" 
                title="Ordenar / Sincronizar"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
              <button className="p-1.5 border border-slate-200 bg-white rounded-lg text-slate-500 hover:bg-slate-50" title="Filtrar">
                <Filter className="w-3.5 h-3.5" />
              </button>
              <button className="p-1.5 border border-slate-200 bg-white rounded-lg text-slate-500 hover:bg-slate-50" title="Configurar Painel">
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick telemetry counter */}
            <div className="grid grid-cols-2 gap-3 mb-3.5 shrink-0 select-none">
              <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-left">
                <span className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 block">Veículos monitorados</span>
                <span className="text-sm font-black text-slate-800 block mt-0.5">{trucks.length}</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-left">
                <span className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 block">Último recebimento</span>
                <span className="text-xs font-mono font-bold text-slate-650 block mt-1">{lastSyncTime || 'Síncrono'}</span>
              </div>
            </div>

            {/* Status Filter Pills for Expedition coordination */}
            <div className="mb-4 shrink-0 select-none text-left">
              <span className="text-[8px] font-extrabold uppercase tracking-wider text-slate-450 block mb-2 pl-1">Filtrar por Status de Expedição</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border cursor-pointer transition-all ${
                    statusFilter === 'all'
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-350'
                  }`}
                >
                  Todos ({trucks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('em_transito')}
                  className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border cursor-pointer transition-all flex items-center gap-1 ${
                    statusFilter === 'em_transito'
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm font-black'
                      : 'bg-emerald-50/40 border-emerald-100 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Trânsito ({trucks.filter(t => loads.find(l => platesMatch(l.plate, t.ras_vei_placa))?.status === CargoStatus.RELEASED).length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('aguardando')}
                  className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border cursor-pointer transition-all flex items-center gap-1 ${
                    statusFilter === 'aguardando'
                      ? 'bg-amber-500 border-amber-500 text-white shadow-sm font-black'
                      : 'bg-amber-50/40 border-amber-100 text-amber-700 hover:bg-amber-50 hover:border-amber-250'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Aguardando ({trucks.filter(t => loads.find(l => platesMatch(l.plate, t.ras_vei_placa))?.status === CargoStatus.AWAITING).length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('alerta')}
                  className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border cursor-pointer transition-all flex items-center gap-1 ${
                    statusFilter === 'alerta'
                      ? 'bg-rose-600 border-rose-600 text-white shadow-sm font-black'
                      : 'bg-rose-50/40 border-rose-100 text-rose-700 hover:bg-rose-50 hover:border-rose-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                  Alerta ({trucks.filter(t => loads.find(l => platesMatch(l.plate, t.ras_vei_placa))?.status === CargoStatus.BLOCKED).length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('sem_carga')}
                  className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border cursor-pointer transition-all ${
                    statusFilter === 'sem_carga'
                      ? 'bg-slate-700 border-slate-700 text-white shadow-sm font-black'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  Sem Carga ({trucks.filter(t => !loads.find(l => platesMatch(l.plate, t.ras_vei_placa))).length})
                </button>
              </div>
            </div>

            {/* Interactive vehicle list */}
            <div className="flex-grow overflow-y-auto space-y-2 pr-1 h-full max-h-[360px] lg:max-h-[none]">
              {filteredTrucks.length === 0 ? (
                <div className="py-12 border-2 border-dashed border-slate-100 rounded-2xl text-center">
                  <MapPinOff className="w-6 h-6 mx-auto text-slate-350 mb-2" />
                  <p className="text-[9px] font-bold uppercase text-slate-400">Nenhum veículo localizado</p>
                </div>
              ) : (
                filteredTrucks.map(truck => {
                  const matchedLoad = loads.find(load => platesMatch(load.plate, truck.ras_vei_placa));
                  const isSelected = selectedPlaca === truck.ras_vei_placa;
                  
                  const address = getAddressForCoords(truck.ras_eve_latitude, truck.ras_eve_longitude, truck.ras_vei_placa);
                  const timestamp = "09/06/2026 às " + (truck.lastUpdate || "14:32:39");

                  let voltage = '12 V';
                  if (truck.ras_vei_placa === 'NGY-7119') voltage = '27 V';
                  else if (truck.ras_vei_placa === 'BWP-1F60' || truck.ras_vei_placa === 'GWM-1F49') voltage = '14 V';
                  else if (truck.ras_vei_placa === 'BYE-9369') voltage = '11 V';

                  return (
                    <div
                      key={truck.ras_vei_placa}
                      onClick={() => handleFocusTruck(truck)}
                      className={`relative border p-3.5 rounded-xl text-left cursor-pointer transition-all flex flex-col gap-1.5 ${
                        isSelected 
                          ? 'border-primary-gold bg-primary-gold/5 ring-1 ring-primary-gold-30'
                          : 'border-slate-150 hover:bg-slate-50 bg-white'
                      }`}
                    >
                      {/* Pinned visual icon on selected cards */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 flex items-center justify-center p-0.5 text-primary-gold">
                          <Pin className="w-3 h-3 fill-current rotate-45" />
                        </div>
                      )}

                      {/* Header row: Plate / GPS Stamp */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-xs text-slate-800 uppercase tracking-widest leading-none">
                            {truck.ras_vei_placa}
                          </span>
                          <span className="text-[8px] font-bold text-slate-450 uppercase font-mono">
                            {truck.ras_vei_placa}
                          </span>
                        </div>
                        <span className="text-[8px] text-slate-400 font-bold flex items-center gap-1 select-none font-sans">
                          <svg className="w-2.5 h-2.5 text-slate-350" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93s3.05-7.44 7-7.93v15.86zm2-15.86c3.95.49 7 3.85 7 7.93s-3.05 7.44-7 7.93V3.07z"/></svg>
                          {timestamp}
                        </span>
                      </div>

                      {/* Dynamic Address Label */}
                      <p className="text-[9.5px] font-medium text-slate-500 font-sans tracking-tight truncate max-w-[240px] select-none" title={address}>
                        {address}
                      </p>

                      {/* Badges strip mirroring screenshot */}
                      <div className="flex flex-wrap gap-1 px-0.5">
                        {/* Ignition / Motion badge */}
                        <span className={`text-[7.5px] font-black uppercase px-1.5 py-0.5 rounded tracking-wide font-sans flex items-center gap-1 select-none ${
                          truck.ras_eve_ignicao === '1' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-slate-800 text-white'
                        }`}>
                          {truck.ras_eve_ignicao === '1' ? (
                            <>
                              <Play className="w-2 h-2 fill-current" />
                              Ligado em movimento
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                              Ignição desligada
                            </>
                          )}
                        </span>

                        {/* Steering badge */}
                        <span className="text-[7.5px] font-black text-slate-100 bg-slate-800 uppercase px-1.5 py-0.5 rounded tracking-none flex items-center gap-0.5 select-none font-sans">
                          Não especificado
                        </span>

                        {/* Battery backup */}
                        <span className="text-[7.5px] font-black text-slate-700 bg-slate-100 border border-slate-200 px-1 py-0.5 rounded flex items-center gap-0.5 select-none font-sans">
                          <Battery className="w-2.5 h-2.5 text-slate-500" />
                          100 %
                        </span>

                        {/* Voltage */}
                        <span className="text-[7.5px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-1 py-0.5 rounded flex items-center gap-0.5 select-none font-sans">
                          <Zap className="w-2.5 h-2.5 text-amber-500 fill-current" />
                          {voltage}
                        </span>
                      </div>

                      {/* Active Cargo Info Sub-block */}
                      {matchedLoad ? (
                        <div className="mt-1 bg-slate-50 border border-slate-150 rounded-lg p-2.5 flex items-center justify-between text-[9px] font-medium text-slate-700 select-none">
                          <div className="truncate pr-1 max-w-[160px] text-left">
                            <span className="font-extrabold text-slate-400 block text-[7px] uppercase tracking-wide">Carga: {matchedLoad.id.substring(0, 8)}...</span>
                            <span className="text-slate-800 font-extrabold truncate block leading-tight">{matchedLoad.driverName}</span>
                            <span className="text-slate-500 text-[8px] font-bold truncate block leading-none mt-0.5">&rarr; {matchedLoad.destination}</span>
                          </div>
                          
                          {/* Rich Status badge */}
                          {matchedLoad.status === CargoStatus.RELEASED ? (
                            <span className="px-1.5 py-0.5 rounded-md text-[7.5px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-250 shrink-0">
                              Trânsito
                            </span>
                          ) : matchedLoad.status === CargoStatus.AWAITING ? (
                            <span className="px-1.5 py-0.5 rounded-md text-[7.5px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-250 shrink-0">
                              Conf.
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded-md text-[7.5px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-200 shrink-0 animate-pulse">
                              Alerta
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="mt-1 bg-slate-50/50 rounded-lg p-1.5 border border-slate-100/40 flex items-center justify-between text-[7px] font-bold text-slate-400 select-none">
                          <span>SEM EXPEDIÇÃO VINCULADA</span>
                        </div>
                      )}

                      {/* Client row bottom */}
                      <div className="border-t border-slate-100 pt-2 flex flex-wrap gap-1 justify-between items-center text-[7.5px] font-black uppercase text-slate-400 tracking-wider font-sans select-none">
                        <span>ATACADAO DIA A DIA</span>
                        {matchedLoad?.status === CargoStatus.BLOCKED && (
                          <span className="text-[7px] text-amber-600 bg-amber-50 border border-amber-200 px-1 py-0.2 rounded">
                            RESTRITO
                          </span>
                        )}
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3 CONTENT: ACTIVE LOADS LIST */}
        {sidebarTab === 'loads' && (
          <div className="flex flex-col flex-grow overflow-hidden">
            {/* Search loads can reuse searchQuery */}
            <div className="flex gap-2 items-center mb-3">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs font-semibold text-slate-700 placeholder-slate-400 outline-none focus:ring-1 focus:ring-slate-300 transition-all"
                  placeholder="Pesquisar cargas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {selectedLoadId && (
                <button
                  type="button"
                  onClick={() => setSelectedLoadId(null)}
                  className="px-2 py-1.5 border border-rose-200 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-rose-100 transition-all cursor-pointer"
                  title="Limpar seleção"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Smart Highlighting Control */}
            <div className="bg-indigo-50/50 border border-indigo-100 p-2.5 rounded-xl mb-3 flex items-center justify-between select-none shrink-0 text-left">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase text-indigo-900 tracking-tight flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-600 animate-pulse" />
                  Isolar Carga Selecionada
                </span>
                <span className="text-[7.5px] text-slate-400 font-bold uppercase block mt-0.5">Oculta outros marcadores</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={hideOtherVehicles} 
                  onChange={(e) => setHideOtherVehicles(e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-8 h-4.5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Loads List scroll area */}
            <div className="flex-grow overflow-y-auto space-y-2 pr-1 h-full">
              {(() => {
                const filteredLoads = loads.filter(l => 
                  l.plate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  l.driverName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  l.destination?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  l.id?.toLowerCase().includes(searchQuery.toLowerCase())
                );

                if (filteredLoads.length === 0) {
                  return (
                    <div className="py-12 border-2 border-dashed border-slate-100 rounded-2xl text-center">
                      <FileText className="w-6 h-6 mx-auto text-slate-350 mb-2" />
                      <p className="text-[9px] font-bold uppercase text-slate-400">Nenhuma carga encontrada</p>
                    </div>
                  );
                }

                return filteredLoads.map(load => {
                  const isLoadSelected = selectedLoadId === load.id;
                  const matchedTruck = trucks.find(t => platesMatch(t.ras_vei_placa, load.plate));
                  
                  return (
                    <div
                      key={load.id}
                      onClick={() => {
                        setSelectedLoadId(isLoadSelected ? null : load.id);
                        if (matchedTruck) {
                          handleFocusTruck(matchedTruck);
                        }
                      }}
                      className={`relative border p-3.5 rounded-xl text-left cursor-pointer transition-all flex flex-col gap-2 ${
                        isLoadSelected 
                          ? 'border-indigo-600 bg-indigo-50/20 ring-1 ring-indigo-300'
                          : 'border-slate-150 bg-white hover:bg-slate-50'
                      }`}
                    >
                      {/* Selection Pin */}
                      {isLoadSelected && (
                        <div className="absolute top-2.5 right-2.5 flex items-center justify-center p-0.5 text-indigo-600">
                          <Check className="w-4 h-4 font-bold" />
                        </div>
                      )}

                      {/* Header Row: Plate badge & Carga designation */}
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-black text-xs text-slate-800 uppercase tracking-widest leading-none bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5">
                              {load.plate || "SEM PLACA"}
                            </span>
                            <span className="text-[8px] font-extrabold uppercase text-slate-400">
                              #{load.id.substring(0, 8)}
                            </span>
                          </div>
                          
                          <span className="block mt-1.5 font-black text-[10px] text-slate-800 uppercase tracking-tight">
                            {load.driverName}
                          </span>
                        </div>

                        {/* Status Badge */}
                        {load.status === CargoStatus.RELEASED ? (
                          <span className="px-2 py-0.5 rounded text-[7.5px] font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-250 shrink-0 flex items-center gap-1">
                            <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
                            Trânsito
                          </span>
                        ) : load.status === CargoStatus.AWAITING ? (
                          <span className="px-2 py-0.5 rounded text-[7.5px] font-black uppercase bg-amber-50 text-amber-800 border border-amber-250 shrink-0 flex items-center gap-1">
                            <span className="w-1 h-1 bg-amber-500 rounded-full"></span>
                            Conf.
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[7.5px] font-black uppercase bg-rose-50 text-rose-850 border border-rose-220 shrink-0 flex items-center gap-1 animate-pulse">
                            <span className="w-1.5 h-1.5 bg-rose-600 rounded-full"></span>
                            Alerta
                          </span>
                        )}
                      </div>

                      {/* Middle Details: Origin/Destination & Cargo Details */}
                      <div className="grid grid-cols-2 gap-2 border-t border-dashed border-slate-100 pt-2 text-[9px] font-semibold text-slate-600">
                        <div>
                          <span className="text-[7px] text-slate-400 uppercase font-black tracking-wider block">Destinatário</span>
                          <span className="text-slate-800 font-extrabold truncate block leading-tight">
                            {load.destination}
                          </span>
                        </div>
                        <div>
                          <span className="text-[7px] text-slate-400 uppercase font-black tracking-wider block">Canal / Carga</span>
                          <span className="text-slate-800 font-extrabold truncate block leading-tight">
                            {load.cargoType}
                          </span>
                        </div>
                        <div>
                          <span className="text-[7px] text-slate-400 uppercase font-black tracking-wider block">Paletes / Lacre</span>
                          <span className="text-slate-700 font-extrabold truncate block leading-tight">
                            {load.palletCount} Pls | {load.sealNumber || "S/ Lacre"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[7px] text-slate-400 uppercase font-black tracking-wider block">Rastreamento Gps</span>
                          {matchedTruck ? (
                            <span className="text-emerald-700 font-extrabold flex items-center gap-0.5 uppercase text-[8px] leading-tight">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Ativo
                            </span>
                          ) : (
                            <span className="text-slate-400 font-bold uppercase text-[8px] leading-tight">
                              Sem GPS
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Footer Row: Actions or risk warnings */}
                      <div className="flex items-center justify-between text-[7px] font-black uppercase tracking-wider text-slate-400 pt-1.5 border-t border-slate-50">
                        <span>LDI Operacional</span>
                        {load.isHighRisk && (
                          <span className="text-rose-650 bg-rose-50 border border-rose-200 px-1 rounded flex items-center gap-0.5 animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            Alto Risco
                          </span>
                        )}
                      </div>

                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}
      </div>

      {/* PANEL 2: INTEGRATED MIDDLE DETALHES SHEET (FLOATING OVER MAP) */}
      {selectedPlaca && selectedTruckObj && (
        <div className="absolute top-5 right-5 bottom-5 left-5 lg:left-auto z-[1010] w-auto lg:w-[360px] bg-white rounded-2xl border border-slate-200 p-5 flex flex-col h-[calc(100%-2.5rem)] shadow-2xl overflow-y-auto font-sans pointer-events-auto">
          
          {/* Details header row with action icons */}
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4 select-none">
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => {
                  setSelectedPlaca(null);
                  setActiveShortcutAction(null);
                  setActiveTracePlaca(null);
                  setActiveRoutePlaca(null);
                }}
                className="text-slate-500 hover:text-slate-800 p-1 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all border border-slate-200 cursor-pointer"
                title="Fechar Detalhes"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Detalhes
              </h3>
            </div>
            
            {/* Action buttons (Pin, bell, compass) matching mockup positioning */}
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsDetailPinned(!isDetailPinned)}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  isDetailPinned 
                    ? 'border-primary-gold bg-primary-gold/10 text-primary-gold' 
                    : 'border-slate-200 bg-white text-slate-450 hover:bg-slate-50'
                }`}
                title="Fixar Veículo"
              >
                <Pin className="w-3.5 h-3.5 fill-current" />
              </button>
              <button className="p-1.5 border border-slate-200 bg-white rounded-lg text-slate-450 hover:bg-slate-50" title="Ativar Alertas Especiais">
                <Bell className="w-3.5 h-3.5" />
              </button>
              <button className="p-1.5 border border-slate-200 bg-white rounded-lg text-slate-450 hover:bg-slate-50" title="Direção do Sensor">
                <Compass className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Plate details and round vehicle category icon */}
          <div className="flex justify-between items-start mb-4">
            <div className="text-left font-sans">
              <h1 className="text-base font-black text-slate-800 uppercase tracking-widest leading-none flex items-baseline gap-1.5 select-all">
                {selectedTruckObj.ras_vei_placa}
                <span className="text-xxs font-black text-slate-400 tracking-wider">
                  {selectedTruckObj.ras_vei_placa}
                </span>
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 leading-tight">
                {getAddressForCoords(selectedTruckObj.ras_eve_latitude, selectedTruckObj.ras_eve_longitude, selectedTruckObj.ras_vei_placa)}
              </p>
            </div>

            {/* Circular grey truck category representative circle */}
            <div className="w-10 h-10 rounded-full bg-slate-650 flex items-center justify-center text-white shrink-0 shadow-sm select-none">
              <Truck className="w-5 h-5" />
            </div>
          </div>

          {/* Multi-badges status row matching mockup spacing */}
          <div className="flex flex-wrap gap-1.5 mb-2.5 px-0.5">
            <span className="px-2 py-1 text-[8.5px] font-black text-slate-600 bg-slate-100 rounded flex items-center gap-1 select-none font-sans uppercase">
              <Clock className="w-3 h-3 text-slate-400" />
              09/06 {selectedTruckObj.lastUpdate || "14:32:39"}
            </span>

            <span className="px-2 py-1 text-[8.5px] font-black text-slate-600 bg-slate-100 rounded flex items-center gap-1 select-none font-sans uppercase">
              Não especificado
            </span>

            <span className="px-2 py-1 text-[8.5px] font-black text-slate-600 bg-slate-100 rounded flex items-center gap-1 select-none font-sans uppercase">
              <Gauge className="w-3 h-3 text-slate-400" />
              {selectedTruckObj.ras_eve_ignicao === '1' ? selectedTruckObj.ras_eve_velocidade + ' km/h' : '0 km/h'}
            </span>

            <span className="px-2 py-1 text-[8.5px] font-black text-slate-600 bg-slate-100 rounded flex items-center gap-1 select-none font-sans uppercase">
              ⚡ 100%
            </span>
          </div>

          {/* Live communicator link row */}
          <div className="flex items-center gap-2 px-2.5 py-2 bg-blue-50/70 border border-blue-100 rounded-xl mb-4 text-[9px] font-extrabold text-blue-800 tracking-tight font-sans select-none">
            <svg className="w-3.5 h-3.5 text-blue-600 animate-pulse shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93s3.05-7.44 7-7.93v15.86zm2-15.86c3.95.49 7 3.85 7 7.93s-3.05 7.44-7 7.93V3.07z"/></svg>
            <span>Comunicou há 8 minutos em 09/06/2026 às {selectedTruckObj.lastUpdate || "14:32:39"}</span>
          </div>

          {/* Expedition & Cargo Release Status Card Segment */}
          <div className="mb-4 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-left font-sans shadow-sm select-none">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 mb-2.5">
              <span className="text-[9px] font-black uppercase text-slate-450 tracking-wider">Estado da Expedição</span>
              <span className="text-[8px] font-mono font-black py-0.5 px-1.5 rounded bg-slate-200 text-slate-700 uppercase tracking-widest">
                INTEGRADA
              </span>
            </div>

            {selectedTruckLoad ? (
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-slate-800 tracking-tight block uppercase">
                    Status da Carga:
                  </span>
                  {selectedTruckLoad.status === CargoStatus.RELEASED ? (
                    <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                      EM TRÂNSITO (LIBERADO)
                    </span>
                  ) : selectedTruckLoad.status === CargoStatus.AWAITING ? (
                    <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-250 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                      AGUARDANDO CONFERÊNCIA
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-220 flex items-center gap-1 animate-pulse">
                      <span className="w-1.5 h-1.5 bg-rose-600 rounded-full"></span>
                      DIVERGÊNCIA / RESTRITO
                    </span>
                  )}
                </div>

                {/* Grid details */}
                <div className="grid grid-cols-2 gap-2 text-[9px] border-t border-slate-100 pt-2.5">
                  <div>
                    <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block">ID / Registro</span>
                    <strong className="text-slate-800 uppercase font-mono">{selectedTruckLoad.id.substring(0, 10).toUpperCase()}...</strong>
                  </div>
                  <div>
                    <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block">Número Lacre</span>
                    <strong className="text-slate-800 font-mono text-center tracking-normal">{selectedTruckLoad.sealNumber || "NÃO CONFERIDO"}</strong>
                  </div>
                  <div className="mt-1">
                    <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block">Condutor / Motorista</span>
                    <strong className="text-slate-800 uppercase truncate block max-w-[130px]">{selectedTruckLoad.driverName}</strong>
                  </div>
                  <div className="mt-1">
                    <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest block">Canal / Carga</span>
                    <strong className="text-slate-800 uppercase">{selectedTruckLoad.cargoType}</strong>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-2.5 space-y-1.5">
                  <div className="flex justify-between items-center text-[8.5px]">
                    <span className="font-semibold text-slate-450 uppercase">Rota Operacional</span>
                    <strong className="text-slate-750 uppercase truncate max-w-[160px]" title={`${selectedTruckLoad.origin} para ${selectedTruckLoad.destination}`}>
                      {selectedTruckLoad.origin} &rarr; {selectedTruckLoad.destination}
                    </strong>
                  </div>
                  {selectedTruckLoad.additionalDestinations && selectedTruckLoad.additionalDestinations.length > 0 && (
                    <div className="flex justify-between items-center text-[8px]">
                      <span className="font-semibold text-slate-400 uppercase">Paradas extras</span>
                      <strong className="text-slate-650 uppercase truncate max-w-[160px]">
                        {selectedTruckLoad.additionalDestinations.join(' | ')}
                      </strong>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-[8.5px]">
                    <span className="font-semibold text-slate-450 uppercase">Paletes Totais</span>
                    <strong className="text-slate-700">{selectedTruckLoad.palletCount} Pls</strong>
                  </div>
                  
                  {/* High Risk indicator */}
                  {selectedTruckLoad.isHighRisk && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg p-2 text-[8px] font-black uppercase flex items-center gap-1.5 leading-snug">
                      <AlertTriangle className="w-4.5 h-4.5 text-rose-600 shrink-0 animate-bounce" />
                      <div>
                        ALERTA DE ALTO RISCO DA EXPECIÇÃO! 
                        <span className="block font-bold text-slate-500 text-[7px] mt-0.5 normal-case font-sans">Escolta veicular armada e sensores de baú em vigilância redundante.</span>
                      </div>
                    </div>
                  )}

                  {/* Portaria Validation details */}
                  <div className="mt-1.5 p-2 bg-white rounded-lg border border-slate-200 text-[8.5px] space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-slate-400 uppercase text-[7.5px] tracking-wider">Verificação de Portaria</span>
                      {selectedTruckLoad.gateVerified ? (
                        <span className={`px-1 rounded text-[7.5px] font-black uppercase ${
                          selectedTruckLoad.gateStatus === 'Aprovado' 
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-250' 
                            : 'bg-rose-50 text-rose-800 border border-rose-250'
                        }`}>
                          {selectedTruckLoad.gateStatus || 'Verificado'}
                        </span>
                      ) : (
                        <span className="px-1.5 bg-slate-50 text-slate-450 rounded text-[7.5px] font-black uppercase border border-slate-200">
                          Pendente
                        </span>
                      )}
                    </div>
                    {selectedTruckLoad.gateVerified && (
                      <div className="text-[7.5px] text-slate-550 uppercase leading-snug font-bold">
                        Responsável: <strong className="text-slate-800">{selectedTruckLoad.gateVerifiedBy}</strong> em <strong className="text-slate-800">{selectedTruckLoad.gateVerifiedAt ? new Date(selectedTruckLoad.gateVerifiedAt).toLocaleTimeString() : 'N/D'}</strong>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-5 bg-slate-100/50 border border-dashed border-slate-200 rounded-lg text-slate-400">
                <p className="text-[9.5px] font-black uppercase tracking-tight text-slate-455">Sem Expedição Ativa</p>
                <p className="text-[8px] mt-0.5 uppercase tracking-wide px-2 font-medium">O dispositivo rastreador está transmitindo telemetria sem uma guia de carga correspondente.</p>
              </div>
            )}
          </div>

          {/* Accordion List exactly matching "Resumo do dia" and "Informações do Rastreado" dropdown structures */}
          <div className="space-y-2 mb-4">
            
            {/* Accordion 1: Resumo do dia */}
            <div className="border border-slate-150 rounded-xl overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => setIsResumoExpanded(!isResumoExpanded)}
                className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/80 flex justify-between items-center text-[10.5px] font-black uppercase text-slate-750 tracking-wider transition-all"
              >
                <span>Resumo do dia</span>
                {isResumoExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {isResumoExpanded && (
                <div className="p-3 text-[9px] text-slate-600 space-y-2 border-t border-slate-100 text-left font-sans select-text">
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-400 uppercase">Motorista</span>
                    <strong className="text-slate-800 uppercase">{selectedTruckObj.driverName || 'Raimundo Silveira'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-400 uppercase">Destino Planejado</span>
                    <strong className="text-slate-800 uppercase truncate max-w-[170px]">{selectedTruckObj.destinationName || 'Centro de Distribuição'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-400 uppercase">Carga</span>
                    <strong className="text-slate-800 uppercase">{selectedTruckObj.cargoType || 'Seca'}</strong>
                  </div>
                  <div className="flex justify-between border-t border-slate-50 pt-1.5 font-mono">
                    <span className="font-sans font-bold text-slate-400 uppercase">Progresso Estimado</span>
                    <strong className="text-slate-800">{selectedTruckObj.progressPercent || 0}%</strong>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-700" style={{ width: `${selectedTruckObj.progressPercent}%` }}></div>
                  </div>
                </div>
              )}
            </div>

            {/* Accordion 2: Informações do Rastreado */}
            <div className="border border-slate-150 rounded-xl overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => setIsInfoExpanded(!isInfoExpanded)}
                className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/80 flex justify-between items-center text-[10.5px] font-black uppercase text-slate-750 tracking-wider transition-all"
              >
                <span>Informações do Rastreado</span>
                {isInfoExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {isInfoExpanded && (
                <div className="p-3 text-[9px] text-slate-650 space-y-1.5 border-t border-slate-100 text-left font-sans select-text">
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-400 uppercase">Equipamento</span>
                    <strong className="text-slate-800 uppercase font-mono">G7 Tracker Pro Dual</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-400 uppercase">Número do Lacre</span>
                    <strong className="text-slate-800 uppercase font-mono">{selectedTruckObj.sealNumber || 'Não Relatado'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-400 uppercase">Sinal GPS</span>
                    <strong className="text-emerald-600 uppercase">Muito Forte (-61 dBm)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-400 uppercase">Coordenadas atuais</span>
                    <strong className="text-slate-800 font-mono text-[8px]">
                      {selectedTruckObj.ras_eve_latitude}, {selectedTruckObj.ras_eve_longitude}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section: Atalhos (Action Shortcuts Grid identical to image) */}
          <div className="text-left font-sans">
            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest pl-1 mb-3.5 flex items-center justify-between">
              <span>Atalhos</span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            </h3>

            {/* Grid display perfectly square widgets */}
            <div className="grid grid-cols-3 gap-2.5 mb-2 relative">
              
              <div 
                onClick={() => handleShortcutClick('mapas')}
                className="p-3 flex flex-col justify-between items-start text-left h-[84px] rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 transition-all font-sans cursor-pointer group shadow-sm hover:shadow active:scale-95 select-none"
              >
                <ExternalLink className="w-5 h-5 text-slate-500 group-hover:text-blue-600 transition-colors" />
                <span className="text-[8.5px] font-black text-slate-700 leading-tight uppercase mt-1">
                  Abrir ponto em outros mapas
                </span>
              </div>

              <div 
                onClick={() => handleShortcutClick('referencia')}
                className={`p-3 flex flex-col justify-between items-start text-left h-[84px] rounded-xl border font-sans cursor-pointer shadow-sm hover:shadow transition-all active:scale-95 select-none ${
                  activeShortcutAction === 'referencia' ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <MapPin className={`w-5 h-5 ${activeShortcutAction === 'referencia' ? 'text-indigo-600' : 'text-slate-500'}`} />
                <span className="text-[8.5px] font-black text-slate-700 leading-tight uppercase mt-1">
                  Ponto de referência
                </span>
              </div>

              <div 
                onClick={() => handleShortcutClick('historico')}
                className={`p-3 flex flex-col justify-between items-start text-left h-[84px] rounded-xl border font-sans cursor-pointer shadow-sm hover:shadow transition-all active:scale-95 select-none ${
                  activeShortcutAction === 'historico' ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <History className={`w-5 h-5 ${activeShortcutAction === 'historico' ? 'text-indigo-600' : 'text-slate-500'}`} />
                <span className="text-[8.5px] font-black text-slate-700 leading-tight uppercase mt-1">
                  Histórico de Posições
                </span>
              </div>

              <div 
                onClick={() => handleShortcutClick('manutencao')}
                className={`p-3 flex flex-col justify-between items-start text-left h-[84px] rounded-xl border font-sans cursor-pointer shadow-sm hover:shadow transition-all active:scale-95 select-none ${
                  activeShortcutAction === 'manutencao' ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <Wrench className={`w-5 h-5 ${activeShortcutAction === 'manutencao' ? 'text-indigo-600' : 'text-slate-500'}`} />
                <span className="text-[8.5px] font-black text-slate-700 leading-tight uppercase mt-1">
                  Manutenções programadas
                </span>
              </div>

              <div 
                onClick={() => handleShortcutClick('comandos')}
                className={`p-3 flex flex-col justify-between items-start text-left h-[84px] rounded-xl border font-sans cursor-pointer shadow-sm hover:shadow transition-all active:scale-95 select-none ${
                  activeShortcutAction === 'comandos' ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <Send className={`w-5 h-5 ${activeShortcutAction === 'comandos' ? 'text-indigo-600' : 'text-slate-500'}`} />
                <span className="text-[8.5px] font-black text-slate-700 leading-tight uppercase mt-1">
                  Comandos enviados
                </span>
              </div>

              <div 
                onClick={() => handleShortcutClick('permanencia')}
                className={`p-3 flex flex-col justify-between items-start text-left h-[84px] rounded-xl border font-sans cursor-pointer shadow-sm hover:shadow transition-all active:scale-95 select-none ${
                  activeShortcutAction === 'permanencia' ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <UserIcon className={`w-5 h-5 ${activeShortcutAction === 'permanencia' ? 'text-indigo-600' : 'text-slate-500'}`} />
                <span className="text-[8.5px] font-black text-slate-700 leading-tight uppercase mt-1">
                  Permanência em ponto
                </span>
              </div>

              <div 
                onClick={() => handleShortcutClick('velocidade')}
                className={`p-3 flex flex-col justify-between items-start text-left h-[84px] rounded-xl border font-sans cursor-pointer shadow-sm hover:shadow transition-all active:scale-95 select-none ${
                  activeShortcutAction === 'velocidade' ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <Gauge className={`w-5 h-5 ${activeShortcutAction === 'velocidade' ? 'text-indigo-600' : 'text-slate-500'}`} />
                <span className="text-[8.5px] font-black text-slate-700 leading-tight uppercase mt-1">
                  Relatório de velocidade
                </span>
              </div>

              {/* Trajeto percorrido - Draw paths history */}
              <div 
                onClick={() => handleShortcutClick('trajeto')}
                className={`p-3 flex flex-col justify-between items-start text-left h-[84px] rounded-xl border font-sans cursor-pointer shadow-sm hover:shadow transition-all active:scale-95 select-none ${
                  activeTracePlaca === selectedPlaca ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <svg className={`w-5 h-5 ${activeTracePlaca === selectedPlaca ? 'text-white' : 'text-slate-500'}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93s3.05-7.44 7-7.93v15.86zm2-15.86c3.95.49 7 3.85 7 7.93s-3.05 7.44-7 7.93V3.07z"/>
                </svg>
                <span className={`text-[8.5px] font-black leading-tight uppercase mt-1 ${activeTracePlaca === selectedPlaca ? 'text-white' : 'text-slate-700'}`}>
                  {activeTracePlaca === selectedPlaca ? 'Remover Rota' : 'Trajeto percorrido'}
                </span>
              </div>

              {/* Rota do veículo - Draw planned route */}
              <div 
                onClick={() => handleShortcutClick('rota')}
                className={`p-3 flex flex-col justify-between items-start text-left h-[84px] rounded-xl border font-sans cursor-pointer shadow-sm hover:shadow transition-all active:scale-95 select-none ${
                  activeRoutePlaca === selectedPlaca ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <Flag className={`w-5 h-5 ${activeRoutePlaca === selectedPlaca ? 'text-white' : 'text-slate-500'}`} />
                <span className={`text-[8.5px] font-black leading-tight uppercase mt-1 ${activeRoutePlaca === selectedPlaca ? 'text-white' : 'text-slate-700'}`}>
                  {activeRoutePlaca === selectedPlaca ? 'Limpar rota' : 'Rota do veículo'}
                </span>
              </div>

              {/* Relatório de eventos consolidados */}
              <div 
                onClick={() => handleShortcutClick('relatorio')}
                className={`p-3 flex flex-col justify-between items-start text-left h-[84px] rounded-xl border font-sans cursor-pointer shadow-sm hover:shadow transition-all active:scale-95 select-none ${
                  activeShortcutAction === 'relatorio' ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <FileText className={`w-5 h-5 ${activeShortcutAction === 'relatorio' ? 'text-indigo-600' : 'text-slate-500'}`} />
                <span className="text-[8.5px] font-black text-slate-700 leading-tight uppercase mt-1">
                  Relatório Consol.
                </span>
              </div>

            </div>

            {/* NESTED DYNAMIC SHORTCUT INTERFACES PANEL */}
            {activeShortcutAction && (
              <div className="mt-4 border border-indigo-100 bg-indigo-50/45 p-4 rounded-xl relative text-left font-sans animate-fadeIn select-text shrink-0">
                <button 
                  onClick={() => setActiveShortcutAction(null)}
                  className="absolute top-2 right-2 text-indigo-400 hover:text-indigo-700 bg-white border border-indigo-150 p-1 rounded-md"
                >
                  <X className="w-3 h-3" />
                </button>

                {/* 1. SHORTCUT: REFERÊNCIA */}
                {activeShortcutAction === 'referencia' && (
                  <div>
                    <strong className="text-[9.5px] font-black uppercase text-indigo-900 block mb-1">Pontos de Referência Importantes</strong>
                    <p className="text-[9px] text-slate-600 uppercase font-medium leading-relaxed">
                      Veículo associado ao CD central está localizado a:
                    </p>
                    <ul className="text-[8.5px] text-slate-700 space-y-1 mt-2 pl-2">
                      <li className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                        <strong>1.2 km de:</strong> Atacadão Santa Maria
                      </li>
                      <li className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                        <strong>11.4 km de:</strong> Central operacional CD Santa Maria
                      </li>
                    </ul>
                  </div>
                )}

                {/* 2. SHORTCUT: TIMELINE HISTORICO */}
                {activeShortcutAction === 'historico' && (
                  <div>
                    <strong className="text-[9.5px] font-black uppercase text-indigo-900 block mb-2">Histórico de Transmissões (Hoje)</strong>
                    <div className="space-y-2.5 pl-2 border-l border-slate-200 max-h-[140px] overflow-y-auto pr-1">
                      <div className="relative">
                        <span className="absolute -left-[11px] top-1 w-1.5 h-1.5 bg-indigo-600 rounded-full ring-2 ring-indigo-100"></span>
                        <p className="text-[8.5px] font-black text-indigo-950 uppercase">{selectedTruckObj.lastUpdate || "14:32:39"}</p>
                        <p className="text-[8px] text-slate-500 font-medium uppercase mt-0.5">SIA Trecho 4, DF - Transmissão GPS</p>
                      </div>
                      <div className="relative">
                        <span className="absolute -left-[11px] top-1 w-1.5 h-1.5 bg-slate-350 rounded-full"></span>
                        <p className="text-[8.5px] font-bold text-slate-700 uppercase">14:15:20</p>
                        <p className="text-[8px] text-slate-500 font-medium uppercase mt-0.5">Partida Operacional CD SIA - Motor ON</p>
                      </div>
                      <div className="relative">
                        <span className="absolute -left-[11px] top-1 w-1.5 h-1.5 bg-slate-350 rounded-full"></span>
                        <p className="text-[8.5px] font-bold text-slate-700 uppercase">11:00:20</p>
                        <p className="text-[8px] text-slate-500 font-medium uppercase mt-0.5">Estacionado Pátio - Portaria de Expedição</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. SHORTCUT: MANUTENÇÃO */}
                {activeShortcutAction === 'manutencao' && (
                  <div className="space-y-2 select-text">
                    <strong className="text-[9.5px] font-black uppercase text-indigo-900 block">Status Técnico do Veículo</strong>
                    <div className="space-y-1.5">
                      <div className="p-1.5 bg-white border border-slate-150 rounded flex justify-between">
                        <span className="font-bold text-[8.5px] text-slate-450 uppercase">Dispositivo Tracker</span>
                        <strong className="text-emerald-600 text-[8.5px] uppercase">Operando OK (100% bateria)</strong>
                      </div>
                      <div className="p-1.5 bg-white border border-slate-150 rounded flex justify-between">
                        <span className="font-bold text-[8.5px] text-slate-450 uppercase">Próxima Revisão</span>
                        <strong className="text-slate-800 text-[8.5px] uppercase">Troca óleo: 14.500 km restantes</strong>
                      </div>
                      <div className="p-1.5 bg-white border border-slate-150 rounded flex justify-between">
                        <span className="font-bold text-[8.5px] text-slate-450 uppercase">Sensor de Temperatura</span>
                        <strong className="text-slate-700 text-[8.5px] font-mono">2.5 °C (Estabilizado)</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. SHORTCUT: COMANDOS ENVIADOS */}
                {activeShortcutAction === 'comandos' && (
                  <div className="space-y-2.5 select-none">
                    <strong className="text-[9.5px] font-black uppercase text-indigo-900 block">Console de Comando Remoto</strong>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => sendTelemetryCommand('lock', selectedPlaca)}
                        disabled={blockLoading}
                        className="py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-[8px] rounded uppercase transition-all tracking-wider disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <LockToggleIcon className="w-3.5 h-3.5" />
                        Cortar Ignição
                      </button>

                      <button
                        onClick={() => sendTelemetryCommand('unlock', selectedPlaca)}
                        disabled={blockLoading}
                        className="py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-black text-[8px] rounded uppercase transition-all tracking-wider disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-primary-gold" />
                        Desbloquear
                      </button>

                      <button
                        onClick={() => sendTelemetryCommand('sirene', selectedPlaca)}
                        disabled={blockLoading}
                        className="py-1.5 bg-indigo-650 hover:bg-indigo-750 text-white font-black text-[8px] rounded uppercase transition-all tracking-wider disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Flame className="w-3.5 h-3.5 text-primary-gold" />
                        Disparar Sirene
                      </button>

                      <button
                        onClick={() => sendTelemetryCommand('buzzer', selectedPlaca)}
                        disabled={blockLoading}
                        className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-350 font-black text-[8px] rounded uppercase transition-all tracking-wider disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        Enviar BIP
                      </button>
                    </div>

                    {blockLoading && (
                      <div className="text-[8px] font-black uppercase text-rose-600 animate-pulse text-center">
                        Processando comando satelital de barramento ...
                      </div>
                    )}

                    {/* Command History inside container */}
                    <div className="border-t border-indigo-150 pt-2 text-left font-sans">
                      <span className="text-[7.5px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Logs Consolidados do Dispositivo</span>
                      <div className="bg-white p-2 rounded-lg border border-slate-200 h-16 overflow-y-auto space-y-1">
                        {comandosLogs[selectedPlaca]?.map((log, index) => (
                          <div key={index} className="text-[7.5px] font-bold text-indigo-950 font-sans leading-relaxed">
                            {log}
                          </div>
                        )) || (
                          <span className="text-[7.5px] text-slate-400 uppercase font-semibold">Sem transmissões recentes.</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. SHORTCUT: PERMANENCIA EM PONTO */}
                {activeShortcutAction === 'permanencia' && (
                  <div>
                    <strong className="text-[9.5px] font-black uppercase text-indigo-900 block mb-1">Estacionamento e Permanência</strong>
                    <p className="text-[9px] text-slate-600 leading-snug uppercase">
                      Informações de carga parados nos pontos mapeados:
                    </p>
                    <div className="mt-2 space-y-1 border border-slate-100 bg-white p-2 rounded-lg">
                      <div className="flex justify-between text-[8px]">
                        <span className="font-bold text-slate-400">Tempo de Carga</span>
                        <strong className="text-slate-850">03h 12m</strong>
                      </div>
                      <div className="flex justify-between text-[8px]">
                        <span className="font-bold text-slate-400">Tempo de Deslocamento</span>
                        <strong className="text-slate-850">02h 45m</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. SHORTCUT: VELOCIDADE CHARTS */}
                {activeShortcutAction === 'velocidade' && (
                  <div>
                    <strong className="text-[9.5px] font-black uppercase text-indigo-900 block mb-1">Registro de Velocidade (Última hora)</strong>
                    <p className="text-[8px] text-slate-500 uppercase leading-snug mb-2">Flutuações de telemetria base:</p>
                    {/* Visual styled SVG graph representing speed fluctuations */}
                    <div className="bg-white p-2 rounded-lg border border-slate-150 flex items-end justify-between h-14 select-none">
                      <div className="w-5 bg-indigo-500 rounded" style={{ height: '30%' }} title="30 km/h"></div>
                      <div className="w-5 bg-indigo-650 rounded animate-pulse" style={{ height: '70%' }} title="70 km/h"></div>
                      <div className="w-5 bg-indigo-500 rounded" style={{ height: '52%' }} title="52 km/h"></div>
                      <div className="w-5 bg-indigo-500 rounded" style={{ height: '40%' }} title="40 km/h"></div>
                      <div className="w-5 bg-indigo-650 rounded" style={{ height: '80%' }} title="80 km/h"></div>
                    </div>
                    <div className="flex justify-between text-[7px] text-slate-400 uppercase font-black pt-1">
                      <span>14:00</span>
                      <span>14:15</span>
                      <span>14:30</span>
                      <span>Agora</span>
                    </div>
                  </div>
                )}

                {/* 8. SHORTCUT: RELATORIO CONSOLIDADO */}
                {activeShortcutAction === 'relatorio' && (
                  <div>
                    <strong className="text-[9.5px] font-black uppercase text-indigo-900 block mb-1">Eventos Consolidados do Dispositivo</strong>
                    <div className="space-y-1 mt-2">
                      <div className="text-[7.5px] bg-white border border-slate-150 p-1 rounded-md text-slate-700 flex justify-between select-text uppercase">
                        <span>Chegada ao Ponto Operacional Santa Maria</span>
                        <strong>14:31:02</strong>
                      </div>
                      <div className="text-[7.5px] bg-white border border-slate-150 p-1 rounded-md text-slate-700 flex justify-between select-text uppercase">
                        <span>Transmissão Normal de GPS</span>
                        <strong>14:26:00</strong>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

        </div>
      )}

      {/* PANEL 3: COMPREHENSIVE MAP ENGINE (Remaining columns) */}
      <div className="flex-grow bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-full relative">
        
        {/* Map Header Strip */}
        <div className="px-4 py-3 border-b border-slate-100 bg-white flex justify-between items-center sticky top-0 z-10 select-none">
          <div className="flex items-center gap-2">
            <MapIcon className="w-4 h-4 text-slate-600" />
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Painel de Rastreamento - CARGA RADAR
            </h3>
          </div>
          <span className="font-mono text-[9px] text-slate-400 font-bold flex items-center gap-1 font-sans">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Status Síncrono
          </span>
        </div>

        {/* Map Canvas Frame */}
        <div className="relative flex-1 bg-slate-50 h-full min-h-[300px]">
          
          <div 
            id="mapa-radar-integrated" 
            ref={mapContainerRef} 
            className="w-full h-full min-h-[360px] lg:min-h-[none] outline-none select-none"
            style={{ height: '100%', width: '100%' }}
          ></div>

          {/* PROFESSIONAL GIS MAP TOOLBAR RAIL FLOATING OVER MAP ON LEFT */}
          <div className="absolute top-4 left-4 z-[999] flex flex-col gap-1.5 p-1.5 bg-white/90 backdrop-blur border border-slate-200/80 shadow-lg rounded-xl select-none select-none">
            {/* 1. Center / Locate selected vehicle */}
            <button
              onClick={() => {
                if (selectedTruckObj) {
                  handleFocusTruck(selectedTruckObj);
                } else if (trucks.length > 0) {
                  handleFocusTruck(trucks[0]);
                }
              }}
              className="p-2 bg-white hover:bg-slate-50 text-slate-650 hover:text-slate-900 rounded-lg border border-slate-200 shadow-sm transition-all cursor-pointer group"
              title="Centralizar no veículo"
            >
              <Locate className="w-4 h-4 text-indigo-600 group-hover:scale-110" />
            </button>

            {/* 2. Zoom In */}
            <button
              onClick={() => mapInstanceRef.current?.zoomIn()}
              className="p-1.5 bg-white hover:bg-slate-50 text-slate-650 font-black rounded-lg border border-slate-200 shadow-sm transition-all cursor-pointer"
              title="Mais Zoom"
            >
              <span className="text-xs font-black select-none">+</span>
            </button>

            {/* 3. Zoom Out */}
            <button
              onClick={() => mapInstanceRef.current?.zoomOut()}
              className="p-1.5 bg-white hover:bg-slate-50 text-slate-650 font-black rounded-lg border border-slate-200 shadow-sm transition-all cursor-pointer"
              title="Menos Zoom"
            >
              <span className="text-xs font-black select-none">-</span>
            </button>

            {/* divider */}
            <div className="h-[1.5px] bg-slate-150 mx-1"></div>

            {/* 4. Layer Selector button */}
            <button
              onClick={() => {
                if (mapStyle === 'osm') setMapStyle('dark');
                else if (mapStyle === 'dark') setMapStyle('satellite');
                else setMapStyle('osm');
              }}
              className="p-2 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 shadow-sm transition-all text-slate-650 cursor-pointer"
              title={`Mudar visual do mapa (Atual: ${mapStyle.toUpperCase()})`}
            >
              <MapIcon className="w-4 h-4 text-emerald-600" />
            </button>

            {/* 5. Plates Toggle Eye icon */}
            <button
              onClick={() => setMapLabelToggle(!mapLabelToggle)}
              className="p-2 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 shadow-sm transition-all text-slate-650 cursor-pointer"
              title="Alternar etiquetas de placas"
            >
              {mapLabelToggle ? (
                <Eye className="w-4 h-4 text-indigo-600" />
              ) : (
                <EyeOff className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {/* 6. Fullscreen Canvas size Mode */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 shadow-sm transition-all text-slate-650 cursor-pointer"
              title="Tela Inteira"
            >
              <Maximize2 className="w-4 h-4 text-slate-600" />
            </button>
          </div>

          {/* MAP INFRASTRUCTURE TECHNICAL LEGEND FLOATING BOX */}
          <div className="absolute bottom-4 left-4 z-[999] bg-white/95 backdrop-blur-md border border-slate-200/80 p-3 rounded-xl shadow-xl space-y-1.5 select-none flex flex-col text-left font-sans">
            <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest pl-1 leading-none">Legenda</span>
            
            <div className="flex items-center gap-2 text-[9px] font-bold text-slate-700 px-1">
              <span className="w-2.5 h-2.5 bg-emerald-600 border border-white rounded-full block"></span>
              Ignição Ligada (Em Rota)
            </div>
            
            <div className="flex items-center gap-2 text-[9px] font-bold text-slate-700 px-1">
              <span className="w-2.5 h-2.5 bg-slate-500 border border-white rounded-full block"></span>
              Ignição Desligada (Parado)
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

// Help icons supporting active commands
const LockToggleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);
