
export enum CargoStatus {
  AWAITING = 'AGUARDANDO CONFERÊNCIA',
  RELEASED = 'EM TRÂNSITO',
  BLOCKED = 'ALERTA DE DIVERGÊNCIA',
  FINISHED = 'FINALIZADA'
}

export enum CargoType {
  FLV = 'FLV (Frutas, Legumes, Verduras)',
  MISTA = 'Mista',
  SECA = 'Seca',
  TRANSFERENCIA = 'Transferência',
  COMPARTILHADA = 'Carga Compartilhada',
  PERECIVEIS = 'Perecíveis',
  REVERSA_CD = 'Reversa CD (Retorno CD / Transf. Lojas)',
  COLETA = 'Coleta (Recicláveis / Resíduos / Terceiros)'
}

export enum OccurrenceType {
  NONE = 'Nenhuma',
  SEAL_DISCREPANCY = 'Divergência de Lacre',
  CARGO_EXCHANGE = 'Troca de Cargas',
  SEAL_TAMPERED = 'Lacre Rompido/Trocado',
  QUANTITY_DISCREPANCY = 'Divergência de Quantidade',
  PNEU_FURADO = 'Pneu furando',
  PROBLEMAS_MECANICOS = 'Problemas mecânicos',
  DESVIO_ROTA = 'Desvio de rota',
  CARGA_ATRASADA = 'Carga atrasada',
  LACRE_ROMPIDO = 'Lacre rompido',
  ABERTURA_SEM_AUTORIZACAO = 'Abertura sem autorização',
  CARGA_SEM_RASTREIO = 'Carga sem rastreio',
  FALTA_PALETES = 'Falta de paletes',
  SOBRA_PALETES = 'Sobra de paletes',
  OTHER = 'Outros'
}

export interface CargoLoad {
  id: string;
  plate: string;
  driverName: string;
  driverPhone?: string;
  cargoType: CargoType;
  origin: string;
  destination: string;
  additionalDestinations?: string[];
  isHighRisk: boolean;
  parType?: string;
  parInvoiceNumber?: string;
  parDescription?: string;
  sealNumber: string;
  palletCount: number;
  palletDetails?: {
    type: string;
    quantity: number;
    destination?: string;
  }[];
  status: CargoStatus;
  createdAt: string;
  createdBy: string; // Username of the expedition user
  photoPlate?: string | string[];
  photoSeal?: string | string[];
  photoManifest?: string | string[];
  occurrenceType?: OccurrenceType;
  occurrenceDescription?: string;
  occurrencePhoto?: string | string[];
  auditedAt?: string;
  occurrenceHistory?: {
    type: OccurrenceType;
    description: string;
    photo?: string | string[];
    auditor: string;
    timestamp: string;
  }[];
  // Shared cargo trackings
  currentDestinationIndex?: number;
  sealsByDest?: Record<string, string>;
  checkedDestinations?: string[];
  sharedCargoDescriptions?: Record<string, string>;
  cargoClassificationByDest?: Record<string, string>;
  // Portaria Validation
  gateVerified?: boolean;
  gateVerifiedAt?: string;
  gateVerifiedBy?: string;
  gatePhotoPlate?: string | string[];
  gatePhotoSeal?: string | string[];
  gatePhotoManifest?: string | string[];
  gateStatus?: 'Aguardando' | 'Aprovado' | 'Divergente';
  gateObservation?: string;
  gateCheckedIn?: boolean;
  needsCentralCheckout?: boolean;
  tripFinished?: boolean;
  contactApp?: string;
  validationTime?: string;
}

export type SystemRole = 'administrator' | 'dispatcher' | 'auditor' | 'viewer' | 'store_app';

export interface User {
  id: string;
  username: string;
  password: string;
  fullName?: string;
  storeLocation?: string;
  jobFunction?: string;
  role: 'expedition' | 'central' | 'audit' | 'analysis' | 'portaria' | 'store_app';
  systemRole?: SystemRole;
  status: 'pending' | 'active' | 'rejected';
  createdAt: string;
}

export interface EventLog {
  id: string;
  timestamp: string;
  userId?: string;
  username: string;
  action: string;
  details: string;
  loadId?: string;
}

export interface VerificationResult {
  isMatch: boolean;
  message: string;
}

export interface StoreLocationGroup {
  region: string;
  stores: string[];
}

export const STORE_LOCATIONS_BY_REGION: StoreLocationGroup[] = [
  {
    region: 'Distrito Federal (DF) — 23 Unidades',
    stores: [
      '1001 - Ceilândia',
      '0701004 - Sobradinho',
      '1007 - SIA',
      '1008 - Taguatinga',
      '1012 - Gama',
      '1021 - P Sul',
      '1028 - Águas Claras',
      '1029 - Guará II',
      '1032 - Ceilândia Centro',
      '1033 - Planaltina DF',
      '1034 - Samambaia',
      '1037 - VCP Rua 12 (Vicente Pires)',
      '1038 - VCP Rua 04 (Vicente Pires)',
      '1042 - Jardim Botânico',
      "1050 - Mestre D'armas",
      '1052 - Riacho Fundo',
      '1055 - Recanto das Emas',
      '1058 - EPTG',
      '1060 - Samambaia Furnas',
      '1065 - Cei Norte (Ceilândia Norte)',
      'CD-01 - Centro de Distribuição 01',
      'CD-02 - Centro de Distribuição 02',
      'Sobradinho 2 - Filial Sobradinho II',
    ]
  },
  {
    region: 'Goiás (GO) — 14 Unidades',
    stores: [
      '1013 - Luziânia',
      '1015 - Balneário',
      '1016 - SAD (Santo Antônio do Descoberto)',
      '1018 - Águas Lindas',
      '1019 - Caldas Novas',
      '1025 - Novo Gama',
      '1026 - César Lattes',
      '1027 - Planaltina GO',
      '1039 - Goianésia',
      '1047 - Aparecida',
      '1053 - Rio Verde',
      '1062 - Luziânia II',
      '1063 - Formosa',
      '1064 - Itumbiara',
    ]
  },
  {
    region: 'Bahia (BA) — 1 Unidade',
    stores: [
      '1030 - LEM (Luís Eduardo Magalhães)',
    ]
  },
  {
    region: 'Tocantins (TO) — 1 Unidade',
    stores: [
      '1040 - Gurupi',
    ]
  }
];

export const LOCATION_OPTIONS = STORE_LOCATIONS_BY_REGION.flatMap(group => group.stores);

const mapsKey = process.env.VITE_GOOGLE_MAPS_API_KEY || 
                process.env.GOOGLE_MAPS_API_KEY || 
                'AIzaSyD8hGoYRyTfMTGiVmbykxBiH3_51EG1HqQ';

export const CD_ROUTES_MAP: Record<string, string> = {
  'CD-01-SIA': `https://www.google.com/maps/embed/v1/directions?key=${mapsKey}&origin=SIA+Brasilia&destination=SIA+Brasilia&mode=driving`,
  'CD-02-SIA': `https://www.google.com/maps/embed/v1/directions?key=${mapsKey}&origin=SIA+Brasilia&destination=SIA+Brasilia&mode=driving`,
};

export const getPhotosArray = (photoVal: string | string[] | undefined): string[] => {
  if (!photoVal) return [];
  if (Array.isArray(photoVal)) return photoVal;
  if (typeof photoVal === 'string' && photoVal.trim() !== '') {
    if (photoVal.startsWith('[') && photoVal.endsWith(']')) {
      try {
        const parsed = JSON.parse(photoVal);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
      } catch (e) {
        // Fallback below
      }
    }
    // Return single non-empty string as a single-element array
    return [photoVal];
  }
  return [];
};
