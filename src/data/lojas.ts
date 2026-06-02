export interface LojaAtacadao {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  region: 'DF' | 'GO' | 'BA' | 'TO';
}

export const Lojas_Atacadao: LojaAtacadao[] = [
  // --- Distrito Federal (DF) ---
  {
    id: 'df-1',
    name: 'Águas Claras',
    address: 'Av. das Castanheiras, Lotes 200 a 280, Loja 1 - CEP: 71900-100',
    latitude: -15.8396,
    longitude: -48.0261,
    region: 'DF'
  },
  {
    id: 'df-2',
    name: 'BR-070',
    address: 'Rodovia BR 070, Km 08, DF',
    latitude: -15.8115,
    longitude: -48.1189,
    region: 'DF'
  },
  {
    id: 'df-3',
    name: 'Ceilândia Centro',
    address: 'QNM 11 s/n, Lote 05, Ceilândia Sul - CEP 72215-110',
    latitude: -15.8235,
    longitude: -48.1032,
    region: 'DF'
  },
  {
    id: 'df-4',
    name: 'Ceilândia (QNN 9)',
    address: 'QNN 09 Conj. I, Lotes 07 e 08 - CEP: 72225-090',
    latitude: -15.8166,
    longitude: -48.1017,
    region: 'DF'
  },
  {
    id: 'df-5',
    name: 'Ceilândia (QNN 30)',
    address: 'QNN 30 - Ceilândia, DF',
    latitude: -15.8262,
    longitude: -48.1256,
    region: 'DF'
  },
  {
    id: 'df-6',
    name: 'Gama',
    address: 'Área para Mercado 1, Setor Leste - CEP: 72460-100',
    latitude: -15.9912,
    longitude: -48.0494,
    region: 'DF'
  },
  {
    id: 'df-7',
    name: 'Guará II',
    address: 'Q SRIA QE 13, Bloco A, Lj 2 3 6 10 - CEP: 71050-130',
    latitude: -15.8190,
    longitude: -47.9863,
    region: 'DF'
  },
  {
    id: 'df-8',
    name: 'Jardim Botânico',
    address: 'SMDB (Setor de Mansões Dom Bosco) - Jardim Botânico, DF',
    latitude: -15.8821,
    longitude: -47.8189,
    region: 'DF'
  },
  {
    id: 'df-9',
    name: 'Planaltina',
    address: 'EN 15, Setor Norte (Av. Independência) - CEP: 73340-150',
    latitude: -15.6173,
    longitude: -47.6698,
    region: 'DF'
  },
  {
    id: 'df-10',
    name: 'Samambaia (ADE Sul)',
    address: 'QR 502, ADE Sul, Conjunto 14 - CEP: 72314-714',
    latitude: -15.8814,
    longitude: -48.1165,
    region: 'DF'
  },
  {
    id: 'df-11',
    name: 'SIA',
    address: 'Área SIA QD 5C 55, Zona Industrial - CEP: 71200-055',
    latitude: -15.7953,
    longitude: -47.9622,
    region: 'DF'
  },
  {
    id: 'df-12',
    name: 'Vicente Pires',
    address: 'Rua 12, Chácara 129A, Conjunto B, Lotes 10-22',
    latitude: -15.8078,
    longitude: -48.0163,
    region: 'DF'
  },

  // --- Goiás (GO) ---
  {
    id: 'go-1',
    name: 'Águas Lindas',
    address: 'Alameda Santa Luzia S/N, Qd. 00, Lote 6B-2, Mansões Centro Oeste',
    latitude: -15.7702,
    longitude: -48.2778,
    region: 'GO'
  },
  {
    id: 'go-2',
    name: 'Aparecida de Goiânia',
    address: 'BR-153 / Avenida Principal, GO',
    latitude: -16.8208,
    longitude: -49.2559,
    region: 'GO'
  },
  {
    id: 'go-3',
    name: 'Caldas Novas',
    address: 'Rua JB 21, Área 49, S/N - CEP: 75690-000',
    latitude: -17.7441,
    longitude: -48.6258,
    region: 'GO'
  },
  {
    id: 'go-4',
    name: 'Formosa',
    address: 'Avenida Principal de Formosa, GO',
    latitude: -15.5414,
    longitude: -47.3344,
    region: 'GO'
  },
  {
    id: 'go-5',
    name: 'Goianésia',
    address: 'Área Comercial, Goianésia, GO',
    latitude: -15.3189,
    longitude: -49.1179,
    region: 'GO'
  },
  {
    id: 'go-6',
    name: 'Goiânia (Balneário)',
    address: 'Av. Balneário, Goiânia, GO',
    latitude: -16.6341,
    longitude: -49.2882,
    region: 'GO'
  },
  {
    id: 'go-7',
    name: 'Goiânia (Novo Horizonte)',
    address: 'Setor Novo Horizonte, Goiânia, GO',
    latitude: -16.7118,
    longitude: -49.3082,
    region: 'GO'
  },
  {
    id: 'go-8',
    name: 'Itumbiara',
    address: 'Av. Modesto de Carvalho, 1935, Qd. 29, Vila Vitória 1',
    latitude: -18.4189,
    longitude: -49.2157,
    region: 'GO'
  },
  {
    id: 'go-9',
    name: 'Luziânia',
    address: 'Parque Estrela Dalva II, Quadra 146, Lote 1A - CEP: 72820-020',
    latitude: -16.2559,
    longitude: -47.9398,
    region: 'GO'
  },

  // --- Bahia (BA) ---
  {
    id: 'ba-1',
    name: 'Luís Eduardo Magalhães',
    address: 'Av. Antônio Dimas Pinto, 391, Parque Oeste Fase 1',
    latitude: -12.0933,
    longitude: -45.7909,
    region: 'BA'
  },

  // --- Tocantins (TO) ---
  {
    id: 'to-1',
    name: '40-Gurupi TO',
    address: 'Av. Maranhão, 2901 - Perímetro Urbano, Gurupi - TO, 77410-020',
    latitude: -11.7268,
    longitude: -49.0668,
    region: 'TO'
  }
];
