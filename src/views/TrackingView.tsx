import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Compass, 
  MapPin, 
  Truck, 
  Play, 
  Pause, 
  RefreshCw, 
  Search, 
  Navigation, 
  Clock, 
  Maximize2, 
  Activity, 
  Map as MapIcon,
  MapPinOff,
  User as UserIcon,
  Sparkles
} from 'lucide-react';
import { CargoLoad, CargoStatus } from '../types';
import { Lojas_Atacadao } from '../data/lojas';

interface TrackingViewProps {
  loads: CargoLoad[];
}

interface TruckData {
  ras_vei_placa: string;
  ras_eve_latitude: string;
  ras_eve_longitude: string;
  ras_eve_velocidade: string;
  ras_eve_ignicao: string;
  // Extended fields for richer integration with real loads
  driverName?: string;
  destinationName?: string;
  cargoType?: string;
  sealNumber?: string;
  realLoadId?: string;
  progressPercent?: number; // 0 to 100
  lastUpdate?: string;
}

export const TrackingView: React.FC<TrackingViewProps> = ({ loads = [] }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [placa: string]: L.Marker }>({});
  
  // Simulation and search states
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPlaca, setSelectedPlaca] = useState<string | null>(null);
  const [trucks, setTrucks] = useState<TruckData[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  // Sede / CD coordinates (SIA)
  const defaultCenter: [number, number] = [-15.7953, -47.9622];

  // Helper: Find store coordinates by name
  const findStoreCoordinates = (destName: string): [number, number] | null => {
    if (!destName) return null;
    const normalizedDest = destName.toLowerCase();
    const foundStore = Lojas_Atacadao.find(loja => 
      normalizedDest.includes(loja.name.toLowerCase()) || 
      loja.name.toLowerCase().includes(normalizedDest)
    );
    if (foundStore) {
      return [foundStore.latitude, foundStore.longitude];
    }
    return null;
  };

  // 1. Initial Sync of Trucks (requested base trucks + in-transit loads from DB)
  useEffect(() => {
    // Basic static test positions required by code guidelines
    const initialStatic: TruckData[] = [
      {
        ras_vei_placa: 'BWU-8171',
        ras_eve_latitude: '-15.877314',
        ras_eve_longitude: '-47.986102',
        ras_eve_velocidade: '0',
        ras_eve_ignicao: '0',
        driverName: 'Raimundo Silveira',
        destinationName: 'Águas Claras (df-1)',
        cargoType: 'Seca',
        lastUpdate: new Date().toLocaleTimeString(),
        progressPercent: 30
      },
      {
        ras_vei_placa: 'BWH-4H66',
        ras_eve_latitude: '-15.79361',
        ras_eve_longitude: '-47.989587',
        ras_eve_velocidade: '45',
        ras_eve_ignicao: '1',
        driverName: 'Valdir Brandão',
        destinationName: 'Guará II (df-7)',
        cargoType: 'Mista',
        lastUpdate: new Date().toLocaleTimeString(),
        progressPercent: 75
      }
    ];

    // Read real "EM TRÂNSITO" shipments from Firestore to dynamically map them
    const activeRouteLoads = loads.filter(
      load => load.status === CargoStatus.RELEASED && load.plate
    );

    const mappedActive: TruckData[] = activeRouteLoads.map((load, idx) => {
      // Find coordinates of destination store with a sensible fallback around DF
      const destCoords = findStoreCoordinates(load.destination || '');
      const finalLat = destCoords ? destCoords[0] : -15.8115 - (idx * 0.05);
      const finalLng = destCoords ? destCoords[1] : -48.1189 + (idx * 0.03);

      // Start somewhere on route (e.g. interpolation between SIA and target)
      return {
        ras_vei_placa: load.plate.toUpperCase(),
        ras_eve_latitude: String(finalLat),
        ras_eve_longitude: String(finalLng),
        ras_eve_velocidade: String(Math.floor(Math.random() * 41) + 40), // 40-80 km/h
        ras_eve_ignicao: '1',
        driverName: load.driverName,
        destinationName: load.destination,
        cargoType: load.cargoType || 'Mista',
        sealNumber: load.sealNumber,
        realLoadId: load.id,
        progressPercent: Math.floor(Math.random() * 50) + 25, // 25-75% progress
        lastUpdate: new Date().toLocaleTimeString()
      };
    });

    // Merge lists avoiding duplicates on plate
    const allMerged = [...initialStatic];
    mappedActive.forEach(item => {
      const idx = allMerged.findIndex(x => x.ras_vei_placa === item.ras_vei_placa);
      if (idx === -1) {
        allMerged.push(item);
      } else {
        // Overlay and prefer active Firestore DB details
        allMerged[idx] = { ...allMerged[idx], ...item };
      }
    });

    setTrucks(allMerged);
    setLastSyncTime(new Date().toLocaleTimeString());
  }, [loads]);

  // 2. Leaflet Map Instance Initialization (Once on mount)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Reset previous leaflet container reference if exists properties
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // 1. Initialise Map centered on Distrito Federal (Brasília area)
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([-15.79361, -47.88215], 11);

    // Add scale and custom zoom UI
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // 2. Add visual map tiles (OpenStreetMap tiles)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 3. Update Markers Reactively when trucks list changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove any markers from previous render that are no longer in the list
    Object.keys(markersRef.current).forEach(placa => {
      const isPresent = trucks.some(t => t.ras_vei_placa === placa);
      if (!isPresent) {
        markersRef.current[placa].remove();
        delete markersRef.current[placa];
      }
    });

    // Add or update markers for current list
    trucks.forEach(truck => {
      const lat = parseFloat(truck.ras_eve_latitude);
      const lng = parseFloat(truck.ras_eve_longitude);
      const ignicaoStr = truck.ras_eve_ignicao === '1' ? 'Ligada' : 'Desligada';
      
      const isDivergent = loads.some(l => l.plate?.toUpperCase() === truck.ras_vei_placa.toUpperCase() && l.status === CargoStatus.BLOCKED);

      // Unique custom Tailwind HTML DivIcon for maximum style and ZERO assets-loading issues!
      const iconHtml = `
        <div class="relative group cursor-pointer">
          <!-- Ping warning pulses for active ignited vehicles -->
          ${truck.ras_eve_ignicao === '1' ? `
            <div class="absolute -inset-2.5 bg-sky-500/35 rounded-full animate-ping pointer-events-none duration-1000"></div>
          ` : ''}

          <!-- Outer badge ring colored differently based on status -->
          <div class="relative w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-transform duration-300 hover:scale-110 shadow-xl ${
            isDivergent 
              ? 'bg-rose-600 border-rose-300 text-white' 
              : truck.ras_eve_ignicao === '1' 
                ? 'bg-primary-navy border-primary-gold text-primary-gold' 
                : 'bg-slate-600 border-slate-350 text-slate-100'
          }">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <rect x="1" y="3" width="15" height="13" rx="2" ry="2"></rect>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
              <circle cx="5.5" cy="18.5" r="2.5"></circle>
              <circle cx="18.5" cy="18.5" r="2.5"></circle>
            </svg>
            
            <!-- Small speed or ignition indicator dot -->
            <span class="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border border-white flex items-center justify-center text-[7px] font-black ${
              isDivergent 
                ? 'bg-red-500 text-white' 
                : truck.ras_eve_ignicao === '1' 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-slate-500 text-white'
            }">
              ${truck.ras_eve_ignicao === '1' ? '⚡' : '●'}
            </span>
          </div>

          <!-- Tiny license plate tooltip directly visible on map -->
          <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700/80 text-white font-mono font-black text-[9px] px-2.5 py-0.5 rounded-md shadow-lg whitespace-nowrap tracking-wider pointer-events-none">
            ${truck.ras_vei_placa}
          </div>
        </div>
      `;

      const divIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-tracker-leaflet-div',
        iconSize: [48, 48],
        iconAnchor: [24, 24],
        popupAnchor: [0, -18]
      });

      // Construct high-fidelity HTML popup mimicking Brazil's professional telemetry software
      const popupContent = `
        <div class="p-3 font-sans max-w-[280px]">
          <div class="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
            <span class="font-mono font-black text-xs text-primary-navy bg-primary-gold/20 px-2 py-0.5 rounded border border-primary-gold/30 uppercase tracking-widest">
              ${truck.ras_vei_placa}
            </span>
            <span class="text-[8px] font-black text-slate-400 uppercase">TELEMETRIA G7</span>
          </div>

          <div class="space-y-1.5 text-[10px]">
            <div class="flex justify-between">
              <strong class="text-slate-400 font-bold uppercase">Motorista:</strong>
              <span class="text-slate-700 font-extrabold uppercase">${truck.driverName || 'N/A'}</span>
            </div>
            <div class="flex justify-between">
              <strong class="text-slate-400 font-bold uppercase">Destino:</strong>
              <span class="text-slate-700 font-extrabold text-right max-w-[130px] truncate uppercase">${truck.destinationName || 'N/A'}</span>
            </div>
            <div class="flex justify-between">
              <strong class="text-slate-400 font-bold uppercase">Ignição (Motor):</strong>
              <span class="font-black ${truck.ras_eve_ignicao === '1' ? 'text-emerald-600' : 'text-slate-500'}">
                ${ignicaoStr}
              </span>
            </div>
            <div class="flex justify-between">
              <strong class="text-slate-400 font-bold uppercase">Velocidade:</strong>
              <span class="text-slate-800 font-black">${truck.ras_eve_velocidade} km/h</span>
            </div>
            ${truck.cargoType ? `
              <div class="flex justify-between">
                <strong class="text-slate-400 font-bold uppercase">Tipo de Carga:</strong>
                <span class="text-slate-700 font-extrabold uppercase">${truck.cargoType}</span>
              </div>
            ` : ''}
            <div class="flex justify-between items-center bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100 mt-2">
              <span class="text-[8px] text-slate-400 font-semibold uppercase">Último GPS:</span>
              <span class="font-mono text-slate-500 font-bold text-[9px]">${truck.lastUpdate || ''}</span>
            </div>
          </div>
        </div>
      `;

      if (markersRef.current[truck.ras_vei_placa]) {
        // Move existing marker smoothly
        markersRef.current[truck.ras_vei_placa].setLatLng([lat, lng]);
        markersRef.current[truck.ras_vei_placa].getPopup()?.setContent(popupContent);
      } else {
        // Initialize new marker
        const marker = L.marker([lat, lng], { icon: divIcon })
          .addTo(map)
          .bindPopup(popupContent);
        
        markersRef.current[truck.ras_vei_placa] = marker;
      }
    });
  }, [trucks, loads]);

  // 4. Smooth Move / Fly map to selected Vehicle helper function
  const handleFocusTruck = (truck: TruckData) => {
    setSelectedPlaca(truck.ras_vei_placa);
    const map = mapInstanceRef.current;
    if (map) {
      const lat = parseFloat(truck.ras_eve_latitude);
      const lng = parseFloat(truck.ras_eve_longitude);
      map.flyTo([lat, lng], 14, {
        animate: true,
        duration: 1.5
      });

      // Automatically pop up active info box
      setTimeout(() => {
        markersRef.current[truck.ras_vei_placa]?.openPopup();
      }, 1500);
    }
  };

  // 5. Simulation Interval Loop (Requested 10-second updates)
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setTrucks(prevTrucks => {
        return prevTrucks.map(truck => {
          // If ignition is off, truck doesn't move
          if (truck.ras_eve_ignicao === '0') {
            return {
              ...truck,
              lastUpdate: new Date().toLocaleTimeString()
            };
          }

          // Move coordinates slightly to simulate transit towards their destination
          const currentLat = parseFloat(truck.ras_eve_latitude);
          const currentLng = parseFloat(truck.ras_eve_longitude);
          
          // Slight jitter or direction steps
          let dLat = (Math.random() - 0.45) * 0.004; // Slightly north/south
          let dLng = (Math.random() - 0.5) * 0.004;  // Slightly east/west
          
          const newLat = (currentLat + dLat).toFixed(6);
          const newLng = (currentLng + dLng).toFixed(6);

          // Speed fluctuations around average
          const currentSpeedVal = Number(truck.ras_eve_velocidade);
          let newSpeedVal = currentSpeedVal + (Math.random() > 0.5 ? 5 : -5);
          if (newSpeedVal > 85) newSpeedVal = 80;
          if (newSpeedVal < 25) newSpeedVal = 35;

          const nextProgress = Math.min((truck.progressPercent || 0) + Math.random() * 2, 100);

          return {
            ...truck,
            ras_eve_latitude: newLat,
            ras_eve_longitude: newLng,
            ras_eve_velocidade: String(Math.round(newSpeedVal)),
            progressPercent: parseFloat(nextProgress.toFixed(1)),
            lastUpdate: new Date().toLocaleTimeString()
          };
        });
      });
      setLastSyncTime(new Date().toLocaleTimeString());
    }, 10000); // 10 seconds refresh rate exactly as specified

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Handle forcing a manual telemetry refresh
  const triggerManualFetch = () => {
    setTrucks(prev => prev.map(t => ({
      ...t,
      ras_eve_velocidade: t.ras_eve_ignicao === '1' ? String(Math.floor(Math.random() * 30) + 40) : '0',
      lastUpdate: new Date().toLocaleTimeString()
    })));
    setLastSyncTime(new Date().toLocaleTimeString());
  };

  // Switch Ignition state manually to demonstrate interactive telemetry handling
  const toggleIgnition = (placa: string) => {
    setTrucks(prev => prev.map(t => {
      if (t.ras_vei_placa === placa) {
        const isCurrentlyLigada = t.ras_eve_ignicao === '1';
        return {
          ...t,
          ras_eve_ignicao: isCurrentlyLigada ? '0' : '1',
          ras_eve_velocidade: isCurrentlyLigada ? '0' : '45',
          lastUpdate: new Date().toLocaleTimeString()
        };
      }
      return t;
    }));
  };

  const filteredTrucks = trucks.filter(t => 
    t.ras_vei_placa.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.driverName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.destinationName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-13rem)] min-h-[580px]">
      
      {/* SIDEBAR LIST & CONFIGURATOR PANEL (4 cols) */}
      <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col h-full overflow-hidden">
        
        {/* Header telemetry titles */}
        <div className="mb-5 flex justify-between items-start">
          <div>
            <h2 className="text-xs font-black text-primary-navy tracking-widest uppercase flex items-center gap-2">
              <Activity className="w-4.5 h-4.5 text-primary-gold animate-pulse" />
              Rastreamento Ativo
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
              Satélites integrados em tempo real
            </p>
          </div>
          <span className="text-[8px] font-black bg-primary-gold/15 text-primary-gold border border-primary-gold/10 px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-primary-gold" />
            VITE + LEAFLET
          </span>
        </div>

        {/* Search controls */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="w-full bg-slate-50 border border-slate-200/90 rounded-2xl pl-10 pr-4 py-3 text-xs font-bold text-slate-700 placeholder-slate-400 outline-none focus:ring-1 focus:ring-primary-gold focus:border-primary-gold transition-all"
            placeholder="Filtrar por placa, motorista ou destino..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Global actions (Play/Pause Simulation & Sync status) */}
        <div className="flex bg-slate-50 rounded-2xl p-2 border border-slate-100 gap-2 mb-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              isPlaying 
                ? 'bg-amber-600/10 text-amber-700 hover:bg-amber-600/15' 
                : 'bg-emerald-600 text-white shadow-md hover:bg-emerald-700'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                Pausar Simulação
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                Iniciar Telemetria
              </>
            )}
          </button>
          
          <button
            onClick={triggerManualFetch}
            className="p-2.5 bg-white text-slate-600 hover:text-primary-navy hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer"
            title="Atualizar posições instantaneamente"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Simulated Telemetry Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Caminhões Conectados</span>
            <span className="text-xl font-black text-primary-navy mt-1">{trucks.length}</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Última Escuta</span>
            <span className="text-xs font-mono font-bold text-slate-600 mt-2">{lastSyncTime || '--:--:--'}</span>
          </div>
        </div>

        {/* List of active trucks */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filteredTrucks.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl">
              <MapPinOff className="w-8 h-8 text-slate-350 mb-2" />
              <p className="text-[10px] font-black text-slate-400 uppercase">Nenhum caminhão monitorado</p>
            </div>
          ) : (
            filteredTrucks.map((truck) => {
              const loadingIsBlocked = loads.some(load => load.plate?.toUpperCase() === truck.ras_vei_placa.toUpperCase() && load.status === CargoStatus.BLOCKED);
              return (
                <div
                  key={truck.ras_vei_placa}
                  onClick={() => handleFocusTruck(truck)}
                  className={`border p-4 rounded-2xl text-left cursor-pointer transition-all ${
                    selectedPlaca === truck.ras_vei_placa
                      ? 'border-primary-gold bg-primary-gold/5 shadow-md scale-[1.01]'
                      : 'border-slate-200/90 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-mono font-black text-xs text-primary-navy bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {truck.ras_vei_placa}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {loadingIsBlocked && (
                        <span className="text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider text-rose-700 bg-rose-100 border border-rose-200">
                          Bloqueado
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleIgnition(truck.ras_vei_placa);
                        }}
                        className={`text-[8px] font-black px-2 py-0.5 rounded border uppercase transition-all tracking-wider ${
                          truck.ras_eve_ignicao === '1'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                        title="Alternar motor (Ignição)"
                      >
                        {truck.ras_eve_ignicao === '1' ? 'LIGADO' : 'DESLIGADO'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] mb-2.5">
                    <div className="flex flex-col">
                      <span className="text-slate-400 font-bold uppercase text-[7px]">Motorista</span>
                      <span className="text-slate-700 font-extrabold uppercase outline-none truncate">
                        {truck.driverName || 'Nenhum'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-400 font-bold uppercase text-[7px]">Destino</span>
                      <span className="text-slate-700 font-extrabold uppercase truncate" title={truck.destinationName}>
                        {truck.destinationName || 'N/A'}
                      </span>
                    </div>
                    <div className="flex flex-col mt-1">
                      <span className="text-slate-400 font-bold uppercase text-[7px]">Velocidade</span>
                      <span className="text-slate-800 font-black">{truck.ras_eve_velocidade} KM/H</span>
                    </div>
                    <div className="flex flex-col mt-1">
                      <span className="text-slate-400 font-bold uppercase text-[7px]">Última Comunicação</span>
                      <span className="text-slate-500 font-mono font-bold">{truck.lastUpdate || '---'}</span>
                    </div>
                  </div>

                  {/* Progress timeline bar built with styled classes only */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100">
                    <div className="flex justify-between items-center text-[7.5px] font-bold text-slate-400 uppercase tracking-tight mb-1">
                      <span>Progresso do Trajeto</span>
                      <span>{truck.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          loadingIsBlocked 
                            ? 'bg-rose-500' 
                            : truck.ras_eve_ignicao === '1' 
                              ? 'bg-primary-navy' 
                              : 'bg-slate-400'
                        }`}
                        style={{ width: `${truck.progressPercent || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MAP VIEWER (8 cols) */}
      <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-full min-h-[460px]">
        
        {/* Map view controls */}
        <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <MapIcon className="w-4 h-4 text-primary-navy" />
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Painel de Rastreamento - CARGA RADAR
            </h3>
          </div>
          <span className="font-mono text-[9px] text-slate-400 font-bold flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            Reciclagem de dados a cada 10s
          </span>
        </div>

        {/* Map Canvas Box */}
        <div className="relative flex-1 bg-slate-50 h-full min-h-[300px]">
          <div 
            id="mapa-radar" 
            ref={mapContainerRef} 
            className="w-full h-full min-h-[380px] select-none rounded-b-3xl"
            style={{ height: '100%', width: '100%', outline: 'none' }}
          ></div>
          
          {/* Custom floats over map layer */}
          <div className="absolute top-4 left-4 z-[999] bg-white/95 backdrop-blur-md border border-slate-200 p-2.5 rounded-xl shadow-xl space-y-1 select-none flex flex-col">
            <span className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest pl-1">Legenda Técnica</span>
            <div className="flex items-center gap-2 text-[9px] font-bold text-slate-700 px-1 py-0.5">
              <span className="w-2.5 h-2.5 bg-primary-navy border border-primary-gold rounded-md"></span>
              Caminhão em Trânsito (Ignição Ligada)
            </div>
            <div className="flex items-center gap-2 text-[9px] font-bold text-slate-700 px-1 py-0.5">
              <span className="w-2.5 h-2.5 bg-slate-650/80 border border-slate-350 rounded-md"></span>
              Ignição Desligada (Parado)
            </div>
            <div className="flex items-center gap-2 text-[9px] font-bold text-slate-700 px-1 py-0.5 animate-pulse">
              <span className="w-2.5 h-2.5 bg-rose-600 rounded-md"></span>
              Alerta de Divergência (Bloqueado)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
