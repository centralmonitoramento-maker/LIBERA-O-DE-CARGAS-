
export enum CargoStatus {
  AWAITING = 'AGUARDANDO CONFERÊNCIA',
  RELEASED = 'CARGA LIBERADA',
  BLOCKED = 'ALERTA DE DIVERGÊNCIA'
}

export enum CargoType {
  FLV = 'FLV (Frutas, Legumes, Verduras)',
  MISTA = 'Mista',
  SECA = 'Seca',
  TRANSFERENCIA = 'Transferência',
  COMPARTILHADA = 'Carga Compartilhada'
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
  photoPlate?: string;
  photoSeal?: string;
  photoManifest?: string;
  occurrenceType?: OccurrenceType;
  occurrenceDescription?: string;
  occurrencePhoto?: string;
  auditedAt?: string;
  occurrenceHistory?: {
    type: OccurrenceType;
    description: string;
    photo?: string;
    auditor: string;
    timestamp: string;
  }[];
  // Shared cargo trackings
  currentDestinationIndex?: number;
  sealsByDest?: Record<string, string>;
  checkedDestinations?: string[];
}

export type SystemRole = 'administrator' | 'dispatcher' | 'auditor' | 'viewer';

export interface User {
  id: string;
  username: string;
  password: string;
  fullName?: string;
  storeLocation?: string;
  jobFunction?: string;
  role: 'expedition' | 'central' | 'audit' | 'analysis';
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

export const LOCATION_OPTIONS = [
  'SIA', 'SOF SUL', 'SOF NORTE', 'TAGUATINGA', 'CEILANDIA', 'SAMAMBAIA', 
  'RECANTO DAS EMAS', 'GAMA', 'SANTA MARIA', 'PLANALTINA', 'SOBRADINHO', 
  'LAGO SUL', 'LAGO NORTE', 'ASA SUL', 'ASA NORTE', 'SUDOESTE', 'GUARA', 
  'VICENTE PIRES', 'AGUAS CLARAS', 'NUCLEO BANDEIRANTE'
];

const mapsKey = process.env.VITE_GOOGLE_MAPS_API_KEY || 
                process.env.GOOGLE_MAPS_API_KEY || 
                'AIzaSyD8hGoYRyTfMTGiVmbykxBiH3_51EG1HqQ';

export const CD_ROUTES_MAP: Record<string, string> = {
  'CD-01-SIA': `https://www.google.com/maps/embed/v1/directions?key=${mapsKey}&origin=SIA+Brasilia&destination=SIA+Brasilia&mode=driving`,
  'CD-02-SIA': `https://www.google.com/maps/embed/v1/directions?key=${mapsKey}&origin=SIA+Brasilia&destination=SIA+Brasilia&mode=driving`,
};
