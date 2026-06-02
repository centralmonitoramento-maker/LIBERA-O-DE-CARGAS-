import React, { useState, useEffect } from 'react';
import { Lojas_Atacadao, LojaAtacadao } from '../data/lojas';
import { 
  MapPin, 
  CheckSquare, 
  Square, 
  Navigation, 
  Locate, 
  ExternalLink, 
  Map as MapIcon, 
  Check, 
  Search, 
  ArrowRight, 
  Compass, 
  SlidersHorizontal,
  RefreshCw,
  AlertCircle,
  Maximize2,
  Minimize2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  ListOrdered,
  Truck,
  TrafficCone
} from 'lucide-react';

interface RoutingViewProps {
  // Let's allow logging the routing activity to the central event log
  onLogRoute?: (action: string, details: string) => void;
}

// Haversine formula to compute distance in km between two sets of coordinates
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

// Estimate driving duration based on distance (average speed of 50 km/h for heavy vehicles)
function estimateDurationMinutes(distanceKm: number): number {
  // 50 km/h equals 1.2 minutes per km + 10 mins loading overhead per stop
  return Math.round((distanceKm / 50) * 60);
}

// Deterministic traffic congestion level based on coordinates to keep it stable
function getTrafficState(lat1: number, lng1: number, lat2: number, lng2: number) {
  const sum = Math.abs(lat1 + lng1 + lat2 + lng2);
  const mod = Math.floor(sum * 1000) % 3;
  if (mod === 0) {
    return { 
      label: 'Fluido', 
      color: '#10b981', // green-500
      secondaryColor: 'rgba(16, 185, 129, 0.4)',
      dur: '1.8s'
    };
  }
  if (mod === 1) {
    return { 
      label: 'Lentidão Média', 
      color: '#f59e0b', // amber-500
      secondaryColor: 'rgba(245, 158, 11, 0.4)',
      dur: '4.5s'
    };
  }
  return { 
    label: 'Congestionamento', 
    color: '#ef4444', // red-500
    secondaryColor: 'rgba(239, 68, 68, 0.4)',
    dur: '9.5s'
  };
}

export const RoutingView: React.FC<RoutingViewProps> = ({ onLogRoute }) => {
  // Coordinates State
  const [gpsLatitude, setGpsLatitude] = useState<number>(-15.7953); // Default to CD-01 SIA
  const [gpsLongitude, setGpsLongitude] = useState<number>(-47.9622);
  const [startName, setStartName] = useState<string>('CD-01 (SIA) - Centro de Distribuição');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationSuccess, setLocationSuccess] = useState<boolean>(false);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<'ALL' | 'DF' | 'GO' | 'BA'>('ALL');
  
  // Selection State
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  
  // Route Plot State
  const [isCalculated, setIsCalculated] = useState<boolean>(false);
  const [optimizedRoute, setOptimizedRoute] = useState<LojaAtacadao[]>([]);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [totalDuration, setTotalDuration] = useState<number>(0);
  const [mapUrl, setMapUrl] = useState<string>('');
  const [externalGmapsUrl, setExternalGmapsUrl] = useState<string>('');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showReorderPanel, setShowReorderPanel] = useState<boolean>(true);
  const [isSvgMode, setIsSvgMode] = useState<boolean>(true);
  const [truckProgress, setTruckProgress] = useState<number>(0);
  const [isSimulationPlaying, setIsSimulationPlaying] = useState<boolean>(true);
  const [showTrafficLayer, setShowTrafficLayer] = useState<boolean>(true);

  // Animation loop for the truck traveling across waypoints
  useEffect(() => {
    if (!isSvgMode || !isCalculated || !isSimulationPlaying) return;
    
    let frameId: number;
    let lastTime = performance.now();
    const durationSeconds = 12; // Complete entire loop in 12 seconds
    const speed = 1 / durationSeconds; 
    
    const animate = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;
      
      setTruckProgress(prev => {
        const next = prev + speed * delta;
        return next > 1 ? 0 : next;
      });
      
      frameId = requestAnimationFrame(animate);
    };
    
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [isSvgMode, isCalculated, isSimulationPlaying]);

  // Synchronize iframe map URL with showTrafficLayer state reactively
  useEffect(() => {
    if (!isCalculated || optimizedRoute.length === 0) return;
    const originParam = `${gpsLatitude},${gpsLongitude}`;
    const trafficParam = showTrafficLayer ? '&layer=t' : '';
    const gmapsEmbedFallbackUrl = `https://maps.google.com/maps?saddr=${originParam}&daddr=${optimizedRoute.map(r => `${r.latitude},${r.longitude}`).join('+to:')}&output=embed${trafficParam}`;
    setMapUrl(gmapsEmbedFallbackUrl);
  }, [showTrafficLayer, gpsLatitude, gpsLongitude, optimizedRoute, isCalculated]);

  // Projection mathematics for the SVG route map
  const getProjectedCoordinates = () => {
    const width = 800; // coordinate space width
    const height = 450; // coordinate space height
    const padding = 80; // keep nodes padding safe from clipping

    const allPoints = [
      { name: startName, latitude: gpsLatitude, longitude: gpsLongitude, isOrigin: true, label: "Partida" },
      ...optimizedRoute.map((store, idx) => ({
        name: store.name.replace('Atacadista Dia a Dia ', '').replace('Atacadão ', ''),
        latitude: store.latitude,
        longitude: store.longitude,
        isOrigin: false,
        seq: idx + 1,
        label: `${idx + 1}º Destino`
      }))
    ];

    if (allPoints.length === 0) return [];

    let minLat = Math.min(...allPoints.map(p => p.latitude));
    let maxLat = Math.max(...allPoints.map(p => p.latitude));
    let minLng = Math.min(...allPoints.map(p => p.longitude));
    let maxLng = Math.max(...allPoints.map(p => p.longitude));

    // Fallbacks if only single node or zero range
    if (maxLat === minLat) {
      minLat -= 0.05; maxLat += 0.05;
      minLng -= 0.05; maxLng += 0.05;
    } else {
      const latRange = maxLat - minLat;
      const lngRange = maxLng - minLng;
      // Add safe margins so nodes aren't pinned on the extreme borders
      minLat -= latRange * 0.15;
      maxLat += latRange * 0.15;
      minLng -= lngRange * 0.15;
      maxLng += lngRange * 0.15;
    }

    return allPoints.map(p => {
      const x = padding + ((p.longitude - minLng) / (maxLng - minLng)) * (width - 2 * padding);
      // Invert Y coordinate so higher latitudes (North/Up) are near Y=0
      const y = height - (padding + ((p.latitude - minLat) / (maxLat - minLat)) * (height - 2 * padding));
      return { ...p, x, y };
    });
  };

  const projectedNodes = getProjectedCoordinates();

  // Get truck interpolated X, Y and angle
  const getTruckPosition = (progress: number) => {
    if (projectedNodes.length < 2) return { x: 0, y: 0, angle: 0, activeLeg: 0 };
    
    const legsCount = projectedNodes.length - 1;
    const scaledProgress = progress * legsCount;
    const currentLegIndex = Math.min(Math.floor(scaledProgress), legsCount - 1);
    const legProgress = scaledProgress - currentLegIndex; // 0 to 1 inside current leg
    
    const startPt = projectedNodes[currentLegIndex];
    const endPt = projectedNodes[currentLegIndex + 1];
    
    const x = startPt.x + (endPt.x - startPt.x) * legProgress;
    const y = startPt.y + (endPt.y - startPt.y) * legProgress;
    
    const dx = endPt.x - startPt.x;
    const dy = endPt.y - startPt.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    
    return { x, y, angle, activeLeg: currentLegIndex };
  };

  const truckPos = getTruckPosition(truckProgress);

  // Auto trigger GPS detection on mount
  useEffect(() => {
    detectGpsLocation();
  }, []);

  const detectGpsLocation = () => {
    setIsLocating(true);
    setLocationError(null);
    setLocationSuccess(false);

    if (!navigator.geolocation) {
      setLocationError('Navegador não suporta geolocalização por GPS.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setGpsLatitude(latitude);
        setGpsLongitude(longitude);
        setStartName('Minha Localização GPS Atual');
        setLocationSuccess(true);
        setIsLocating(false);
        
        // If route is already calculated, recalculate starting from new GPS coords
        if (isCalculated) {
          calculateOptimizedRoute(latitude, longitude);
        }
      },
      (error) => {
        let msg = 'Erro ao obter GPS.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Permissão de GPS bloqueada pelo usuário.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Sinal de GPS indisponível.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Tempo limite de GPS excedido.';
        }
        setLocationError(msg + ' Usando CD-01 SIA como padrão.');
        setGpsLatitude(-15.7953); // Fallback to CD-01 SIA
        setGpsLongitude(-47.9622);
        setStartName('CD-01 (SIA) - Padrão de Partida');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Toggle store selection
  const toggleStore = (id: string) => {
    setSelectedStoreIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Select all filtered stores
  const selectAllFiltered = (filteredStores: LojaAtacadao[]) => {
    const idsToSelect = filteredStores.map(s => s.id);
    setSelectedStoreIds(prev => {
      const merged = new Set([...prev, ...idsToSelect]);
      return Array.from(merged);
    });
  };

  // Deselect all filtered stores
  const deselectAllFiltered = (filteredStores: LojaAtacadao[]) => {
    const idsToDeselect = filteredStores.map(s => s.id);
    setSelectedStoreIds(prev => prev.filter(id => !idsToDeselect.includes(id)));
  };

  // Filter stores list based on search and region selection
  const filteredStores = Lojas_Atacadao.filter(store => {
    const matchesSearch = 
      store.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      store.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRegion = selectedRegion === 'ALL' || store.region === selectedRegion;
    
    return matchesSearch && matchesRegion;
  });

  // Mathematically solve Nearest-Neighbor (greedy TSP optimization) for the selected stores
  const calculateOptimizedRoute = (currentLat: number, currentLng: number) => {
    if (selectedStoreIds.length === 0) {
      alert('Selecione pelo menos uma loja para traçar a rota.');
      return;
    }

    const storesToVisit = Lojas_Atacadao.filter(s => selectedStoreIds.includes(s.id));
    const sequencedRoute: LojaAtacadao[] = [];
    let unvisited = [...storesToVisit];
    
    let activeLat = currentLat;
    let activeLng = currentLng;
    let accumulatedDistance = 0;

    // Nearest Neighbor solver loop
    while (unvisited.length > 0) {
      let nearestIndex = 0;
      let minDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const dist = getDistanceKm(activeLat, activeLng, unvisited[i].latitude, unvisited[i].longitude);
        if (dist < minDistance) {
          minDistance = dist;
          nearestIndex = i;
        }
      }

      const closestStore = unvisited[nearestIndex];
      sequencedRoute.push(closestStore);
      accumulatedDistance += minDistance;
      
      // Move current reference location to visited store
      activeLat = closestStore.latitude;
      activeLng = closestStore.longitude;
      
      // Remove from unvisited array
      unvisited.splice(nearestIndex, 1);
    }

    // Save outputs
    setOptimizedRoute(sequencedRoute);
    setTotalDistance(parseFloat(accumulatedDistance.toFixed(1)));
    setTotalDuration(estimateDurationMinutes(accumulatedDistance));
    setIsCalculated(true);

    // Compute embedded maps URL using direction format compatible with iframe embeds
    // Origin is latitude/longitude coordinate or 'SIA, Brasilia'
    const originParam = `${currentLat},${currentLng}`;
    
    // Primary destination is the final optimized stop
    const finalStop = sequencedRoute[sequencedRoute.length - 1];
    const destParam = `${finalStop.latitude},${finalStop.longitude}`;

    // Waypoints are intermediate stops in order
    const waypoints = sequencedRoute.slice(0, -1).map(s => `${s.latitude},${s.longitude}`).join('|');

    const mapsKey = process.env.VITE_GOOGLE_MAPS_API_KEY || 
                    process.env.GOOGLE_MAPS_API_KEY || 
                    'AIzaSyD8hGoYRyTfMTGiVmbykxBiH3_51EG1HqQ';

    let iframeUrl = `https://www.google.com/maps/embed/v1/directions?key=${mapsKey}&origin=${originParam}&destination=${destParam}&mode=driving`;
    
    if (waypoints) {
      iframeUrl += `&waypoints=${waypoints}`;
    }

    // Embed maps has security restrictions sometimes, fallback to open coordinates Directions format:
    // https://maps.google.com/maps?saddr={origin}&daddr={way1}+to:{way2}&output=embed
    const gmapsEmbedFallbackUrl = `https://maps.google.com/maps?saddr=${originParam}&daddr=${sequencedRoute.map(r => `${r.latitude},${r.longitude}`).join('+to:')}&output=embed`;

    // Map will default to the robust cross-origin fallback coordinates directions if dynamic API keys fail
    setMapUrl(gmapsEmbedFallbackUrl);

    // Compute external Google Maps directions link for native phone routing
    const externalUrl = `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destParam}&waypoints=${sequencedRoute.slice(0, -1).map(s => `${s.latitude},${s.longitude}`).join('|')}&travelmode=driving`;
    setExternalGmapsUrl(externalUrl);

    // Log this action centrally if log callback is mounted
    if (onLogRoute) {
      onLogRoute('Cálculo de Rota', `Rota gerada de ${startName} passando por ${sequencedRoute.length} lojas Atacadão. Distância total: ${accumulatedDistance.toFixed(1)}km`);
    }
  };

  // Manually update the sequence of the route waypoints and re-calculate routing stats
  const updateManualRoute = (sequencedRoute: LojaAtacadao[]) => {
    let accumulatedDistance = 0;
    // Walk from current GPS location down the sequenced list
    let activeLat = gpsLatitude;
    let activeLng = gpsLongitude;

    for (let i = 0; i < sequencedRoute.length; i++) {
      const dist = getDistanceKm(activeLat, activeLng, sequencedRoute[i].latitude, sequencedRoute[i].longitude);
      accumulatedDistance += dist;
      activeLat = sequencedRoute[i].latitude;
      activeLng = sequencedRoute[i].longitude;
    }

    setOptimizedRoute(sequencedRoute);
    setTotalDistance(parseFloat(accumulatedDistance.toFixed(1)));
    setTotalDuration(estimateDurationMinutes(accumulatedDistance));

    // Recompute embedded maps URL
    const originParam = `${gpsLatitude},${gpsLongitude}`;
    const finalStop = sequencedRoute[sequencedRoute.length - 1];
    const destParam = `${finalStop.latitude},${finalStop.longitude}`;

    // fallback Google directions embed URL:
    const gmapsEmbedFallbackUrl = `https://maps.google.com/maps?saddr=${originParam}&daddr=${sequencedRoute.map(r => `${r.latitude},${r.longitude}`).join('+to:')}&output=embed`;
    setMapUrl(gmapsEmbedFallbackUrl);

    // Compute external Google Maps directions link for native phone routing
    const externalUrl = `https://www.google.com/maps/dir/?api=1&origin=${originParam}&destination=${destParam}&waypoints=${sequencedRoute.slice(0, -1).map(s => `${s.latitude},${s.longitude}`).join('|')}&travelmode=driving`;
    setExternalGmapsUrl(externalUrl);

    if (onLogRoute) {
      onLogRoute('Reordenação de Rota', `Alteração de sequência manual de destino pelo operador. Nova distância: ${accumulatedDistance.toFixed(1)}km`);
    }
  };

  const moveWaypoint = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === optimizedRoute.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...optimizedRoute];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;
    
    updateManualRoute(reordered);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* LEFT COLUMN: Controls, Store lists, GPS status */}
      <div className="lg:col-span-5 space-y-6 flex flex-col">
        {/* Module Title */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-primary-navy relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Compass className="w-24 h-24 text-primary-gold animate-spin-slow" />
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary-navy text-primary-gold rounded-2xl border border-primary-gold/30">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-primary-gold uppercase tracking-[0.2em] leading-none">Roteirização Inteligente</p>
              <h2 className="text-xl font-black uppercase tracking-tight mt-1">Lojas Atacadão</h2>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4 leading-relaxed">
            Selecione as lojas desejadas, capture as coordenadas de GPS do veículo e trace trajetos calculadamente otimizados pelo algoritmo do CARGARADAR.
          </p>
        </div>

        {/* GPS Control Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Locate className="w-4 h-4 text-primary-navy" />
            Ponto de Partida (GPS)
          </h3>
          
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[9px] font-black uppercase text-slate-400">Origem Configurada</p>
                <p className="text-xs font-black text-slate-800 mt-0.5">{startName}</p>
                <p className="text-[10px] font-mono text-slate-500 mt-1 font-bold">
                  Lat: {gpsLatitude.toFixed(6)} | Lng: {gpsLongitude.toFixed(6)}
                </p>
              </div>
              <button
                onClick={detectGpsLocation}
                disabled={isLocating}
                className="p-2.5 bg-primary-navy hover:bg-primary-gold hover:text-white text-primary-gold rounded-xl border border-primary-gold/20 transition-all flex items-center justify-center cursor-pointer"
                title="Detectar localização real via GPS"
              >
                <RefreshCw className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Geolocation visual cues */}
            {isLocating && (
              <div className="flex items-center gap-2 text-blue-600 bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/50 text-[10px] font-bold animate-pulse">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-ping"></span>
                Solicitando autorização de GPS ao navegador...
              </div>
            )}

            {locationError && (
              <div className="text-[10px] font-bold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100 flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{locationError}</span>
              </div>
            )}

            {locationSuccess && (
              <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 flex items-center gap-1.5 animate-in fade-in duration-300">
                <Check className="w-3.5 h-3.5 text-emerald-600 bg-emerald-100 p-0.5 rounded-full" />
                <span>Coordenadas de GPS capturadas com sucesso!</span>
              </div>
            )}
          </div>
        </div>

        {/* Stores Selection List */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex-grow flex flex-col space-y-4 max-h-[600px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary-gold" />
              Lojas Disponíveis ({selectedStoreIds.length} / {Lojas_Atacadao.length})
            </h3>
            
            {/* Action Group select/clear */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => selectAllFiltered(filteredStores)}
                className="text-[9px] font-black uppercase text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded border border-blue-100"
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => deselectAllFiltered(filteredStores)}
                className="text-[9px] font-black uppercase text-red-600 hover:text-red-800 bg-red-50 px-2 py-1 rounded border border-red-100"
              >
                Limpar
              </button>
            </div>
          </div>

          {/* Search bar & region filters */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por unidade, endereço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-primary-gold transition-all"
              />
            </div>

            {/* Region selection buttons */}
            <div className="flex gap-1 overflow-x-auto pb-1">
              {(['ALL', 'DF', 'GO', 'BA'] as const).map((reg) => (
                <button
                  key={reg}
                  type="button"
                  onClick={() => setSelectedRegion(reg)}
                  className={`text-[9px] font-black px-3 py-1.5 rounded-lg border transition-all uppercase tracking-wider ${
                    selectedRegion === reg
                      ? 'bg-primary-navy border-primary-navy text-white shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {reg === 'ALL' ? 'Todas' : reg}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable list content */}
          <div className="overflow-y-auto space-y-2 pr-1 flex-grow scrollbar-thin">
            {filteredStores.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs font-bold uppercase tracking-widest bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                Nenhuma loja localizada
              </div>
            ) : (
              filteredStores.map((store) => {
                const isSelected = selectedStoreIds.includes(store.id);
                return (
                  <div
                    key={store.id}
                    onClick={() => toggleStore(store.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                      isSelected
                        ? 'bg-amber-50/60 border-primary-gold/40 shadow-sm'
                        : 'bg-white border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="mt-0.5">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-primary-gold shrink-0 fill-primary-gold/5" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 shrink-0" />
                      )}
                    </div>
                    <div className="flex-grow space-y-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <h4 className="text-xs font-black text-slate-800">{store.name}</h4>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
                          store.region === 'DF' 
                            ? 'bg-blue-100 text-blue-700' 
                            : store.region === 'GO' 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-amber-100 text-amber-700'
                        }`}>
                          {store.region}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{store.address}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Core action button */}
          <button
            type="button"
            onClick={() => calculateOptimizedRoute(gpsLatitude, gpsLongitude)}
            disabled={selectedStoreIds.length === 0}
            className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg text-center flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] ${
              selectedStoreIds.length === 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-primary-gold hover:bg-amber-500 text-white cursor-pointer'
            }`}
          >
            <Navigation className="w-4 h-4" />
            Traçar Rota Otimizada ({selectedStoreIds.length} lojas)
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: Map rendering & optimized route stats */}
      <div className="lg:col-span-7 flex flex-col space-y-6">
        
        {/* Map display */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col min-h-[460px] flex-grow">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <MapIcon className="w-4 h-4 text-primary-navy" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Visualização de Trajeto e Mapa
              </h3>
            </div>
            {isCalculated && (
              <a
                href={externalGmapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[10px] font-black text-primary-gold bg-primary-gold/10 hover:bg-primary-gold hover:text-white border border-primary-gold/20 px-3 py-1.5 rounded-xl transition-all uppercase tracking-wider cursor-pointer"
              >
                Abrir GPS nativo
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          <div className={isFullScreen 
            ? "fixed inset-0 z-[9999] bg-slate-900 border-none rounded-none w-full h-full min-h-screen flex flex-col items-center justify-center transition-all duration-500"
            : `relative w-full h-[450px] bg-slate-100 rounded-2xl border border-slate-200/60 overflow-hidden min-h-[340px] flex flex-col items-center justify-center transition-all duration-500 ${isCalculated ? 'animate-route-pulse ring-2 ring-primary-gold/15 scale-[1.01] border-primary-gold' : ''}`
          }>
            {isCalculated && (
              <>
                {/* Reorder Toggle / Trigger Button */}
                {!showReorderPanel && (
                  <button
                    type="button"
                    onClick={() => setShowReorderPanel(true)}
                    className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white/85 hover:bg-white text-slate-800 font-black text-[10px] uppercase tracking-wider backdrop-blur transition-all cursor-pointer shadow-md active:scale-95 hover:text-black"
                  >
                    <ListOrdered className="w-3.5 h-3.5 text-primary-gold" />
                    Ajustar Sequência
                  </button>
                )}

                {/* Main Fullscreen Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  className={`absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-black text-[10px] uppercase tracking-wider backdrop-blur transition-all cursor-pointer shadow-md active:scale-95 ${
                    isFullScreen
                      ? 'bg-red-600/95 hover:bg-red-600 text-white border-red-500 shadow-red-500/10'
                      : 'bg-white/80 hover:bg-white text-slate-800 border-slate-200/80 hover:text-black'
                  }`}
                  title={isFullScreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
                >
                  {isFullScreen ? (
                    <>
                      <Minimize2 className="w-3.5 h-3.5" />
                      Sair da Tela Cheia
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-3.5 h-3.5" />
                      Tela Cheia
                    </>
                  )}
                </button>

                {/* Interactive Waypoints Drag-And-Drop Overlay Panel */}
                {showReorderPanel && (
                  <div className="absolute top-4 left-4 z-20 w-72 md:w-80 max-h-[calc(100%-2rem)] bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl border border-slate-200/80 p-4 flex flex-col overflow-hidden animate-in fade-in slide-in-from-left duration-300">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                      <div className="flex items-center gap-1.5 text-primary-navy">
                        <ListOrdered className="w-4 h-4 text-primary-gold" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-850">
                          Sequência da Rota
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowReorderPanel(false)}
                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors text-[9px] font-black uppercase tracking-wide cursor-pointer"
                      >
                        Ocultar
                      </button>
                    </div>

                    {/* Draggable Stop Nodes list */}
                    <div className="flex-grow overflow-y-auto space-y-2 pr-1 select-none">
                      <div className="p-2 border border-slate-100 bg-slate-50/80 rounded-xl mb-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-wide flex items-center justify-between">
                        <span className="truncate max-w-[200px]">Origem: {startName.split(' - ')[0]}</span>
                        <span className="bg-slate-200/75 text-slate-600 px-1.5 py-0.5 rounded text-[8px] font-black uppercase shrink-0">Partida</span>
                      </div>

                      {optimizedRoute.map((store, index) => {
                        const isDragging = draggedIndex === index;
                        const isOver = dragOverIndex === index;

                        return (
                          <div
                            key={store.id}
                            draggable
                            onDragStart={(e) => {
                              setDraggedIndex(index);
                              e.dataTransfer.effectAllowed = 'move';
                            }}
                            onDragEnd={() => {
                              setDraggedIndex(null);
                              setDragOverIndex(null);
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                            }}
                            onDragEnter={(e) => {
                              e.preventDefault();
                              setDragOverIndex(index);
                            }}
                            onDragLeave={() => {
                              if (dragOverIndex === index) {
                                setDragOverIndex(null);
                              }
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (draggedIndex === null || draggedIndex === index) return;
                              const reordered = [...optimizedRoute];
                              const [removed] = reordered.splice(draggedIndex, 1);
                              reordered.splice(index, 0, removed);
                              updateManualRoute(reordered);
                              setDraggedIndex(null);
                              setDragOverIndex(null);
                            }}
                            className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all duration-150 relative cursor-grab active:cursor-grabbing ${
                              isDragging
                                ? 'opacity-40 border-dashed border-primary-gold bg-amber-50/20'
                                : isOver
                                ? 'border-primary-gold shadow-md bg-amber-50 scale-[1.02] ring-2 ring-primary-gold/10'
                                : 'border-slate-150 bg-white hover:border-slate-300 hover:shadow-sm'
                            }`}
                          >
                            {/* Grip handle icons */}
                            <div className="text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing shrink-0">
                              <GripVertical className="w-3.5 h-3.5" />
                            </div>

                            {/* Sequential position badge */}
                            <span className="w-5 h-5 rounded-full bg-primary-gold/15 border border-primary-gold/30 text-amber-700 text-[9px] font-black flex items-center justify-center shrink-0">
                              {index + 1}
                            </span>

                            {/* Loja information */}
                            <div className="flex-grow min-w-0 pr-1 text-left">
                              <p className="text-[10px] font-black text-slate-800 leading-tight uppercase truncate">
                                {store.name.replace('Atacadista Dia a Dia ', '').replace('Atacadão ', '')}
                              </p>
                              <p className="text-[8px] text-slate-400 font-bold leading-none truncate mt-0.5">
                                {store.address.split(',')[0]}
                              </p>
                            </div>

                            {/* Micro-interactive up/down arrows */}
                            <div className="flex flex-col shrink-0">
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveWaypoint(index, 'up');
                                }}
                                className="p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 disabled:opacity-20 transition-colors cursor-pointer"
                                title="Subir"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={index === optimizedRoute.length - 1}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveWaypoint(index, 'down');
                                }}
                                className="p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 disabled:opacity-20 transition-colors cursor-pointer"
                                title="Descer"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 mt-2 text-[8px] font-bold text-slate-400 uppercase text-center leading-normal">
                      Arraste as paradas para mudar os destinos da rota ou use as setas.
                    </div>
                  </div>
                )}
              </>
            )}

            {isCalculated ? (
              isSvgMode ? (
                <div className="absolute inset-0 bg-slate-950 flex flex-col justify-between overflow-hidden select-none">
                  {/* Procedural Grid Layer */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25">
                    <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" strokeWidth="0.5" />
                        <circle cx="4" cy="4" r="1" fill="#1e293b" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>

                  {/* Header / Telemetry Info of Simulation */}
                  <div className="absolute top-16 right-4 bg-slate-900/95 hover:bg-slate-900 text-white p-3 rounded-2xl border border-slate-800 backdrop-blur shadow-lg text-left hidden sm:flex flex-col gap-1.5 z-10 max-w-xs font-sans">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                      <span className="text-[8.5px] font-black uppercase text-emerald-400 tracking-wider">Simulação GeoLocalizada Ativa</span>
                    </div>
                    <div>
                      <p className="text-[7.5px] font-bold text-slate-400 uppercase">Trecho Ativo</p>
                      <p className="text-[10px] font-black text-slate-100 uppercase truncate">
                        {projectedNodes[truckPos.activeLeg]?.name || "Origem"} ➜ {projectedNodes[truckPos.activeLeg + 1]?.name || "Destino"}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-t border-slate-800 pt-1.5 mt-0.5">
                      <div>
                        <p className="text-[7px] font-black uppercase text-slate-500">Progresso Rota</p>
                        <p className="text-[9.5px] font-mono font-bold text-amber-400">{(truckProgress * 100).toFixed(0)}%</p>
                      </div>
                      <div>
                        <p className="text-[7px] font-black uppercase text-slate-500">Status Caminhão</p>
                        <p className="text-[9.5px] font-black text-emerald-400 uppercase">{isSimulationPlaying ? "Em trânsito" : "Parado"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Vector SVG Routing Canvas */}
                  <div className="w-full h-full p-4 relative">
                    <svg
                      viewBox="0 0 800 450"
                      className="w-full h-full"
                      style={{ filter: "drop-shadow(0 10px 15px rgba(0,0,0,0.5))" }}
                    >
                      {/* 1. DRAW CONNECTING PATHS (ROADS) */}
                      {projectedNodes.length > 1 && (
                        <>
                          {/* Background Road Base */}
                          <path
                            d={projectedNodes.reduce((acc, p, idx) => idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '')}
                            fill="none"
                            stroke="#1e293b"
                            strokeWidth="10"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="transition-all duration-300"
                          />
                          <path
                            d={projectedNodes.reduce((acc, p, idx) => idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '')}
                            fill="none"
                            stroke="#334155"
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="transition-all duration-300"
                          />
                          
                          {/* Pulsing Active Route Path or Traffic Congestion Layers */}
                          {showTrafficLayer ? (
                            projectedNodes.slice(0, -1).map((p1, idx) => {
                              const p2 = projectedNodes[idx + 1];
                              const traffic = getTrafficState(p1.latitude, p1.longitude, p2.latitude, p2.longitude);
                              return (
                                <g key={`traffic-overlay-${idx}`}>
                                  {/* Wide glowing halo of traffic severity */}
                                  <line
                                    x1={p1.x}
                                    y1={p1.y}
                                    x2={p2.x}
                                    y2={p2.y}
                                    stroke={traffic.color}
                                    strokeWidth="6"
                                    strokeLinecap="round"
                                    opacity="0.25"
                                    className="animate-pulse"
                                  />
                                  {/* Solid high-visibility traffic stroke */}
                                  <line
                                    x1={p1.x}
                                    y1={p1.y}
                                    x2={p2.x}
                                    y2={p2.y}
                                    stroke={traffic.color}
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                  />
                                  {/* Flow indicator particles travelling along the road segment */}
                                  <circle r="2.2" fill="#ffffff" className="shadow-lg">
                                    <animateMotion
                                      path={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`}
                                      dur={traffic.dur}
                                      repeatCount="indefinite"
                                    />
                                  </circle>
                                </g>
                              );
                            })
                          ) : (
                            <path
                              d={projectedNodes.reduce((acc, p, idx) => idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '')}
                              fill="none"
                              stroke="#eab308"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeDasharray="14 10"
                              className="opacity-90"
                            >
                              <animate
                                attributeName="stroke-dashoffset"
                                values="120;0"
                                dur="4s"
                                repeatCount="indefinite"
                              />
                            </path>
                          )}
                        </>
                      )}

                      {/* 2. DRAW TARGET/WAYPOINT LOCATIONS (STORES / ORIGIN) */}
                      {projectedNodes.map((node, idx) => {
                        return (
                          <g key={idx} className="group cursor-pointer">
                            {/* Inner/Outer Pulsing glow */}
                            <circle
                              cx={node.x}
                              cy={node.y}
                              r={node.isOrigin ? "14" : "11"}
                              fill={node.isOrigin ? "#1e1b4b" : "#451a03"}
                              stroke={node.isOrigin ? "#312e81" : "#78350f"}
                              strokeWidth="1.5"
                            />
                            
                            {/* Active Point Outline */}
                            <circle
                              cx={node.x}
                              cy={node.y}
                              r={node.isOrigin ? "20" : "16"}
                              fill="none"
                              stroke={node.isOrigin ? "#a5b4fc" : "#fde047"}
                              strokeWidth="1.5"
                              strokeDasharray="4 2"
                              className="opacity-45"
                            >
                              <animateTransform
                                attributeName="transform"
                                type="rotate"
                                from={`0 ${node.x} ${node.y}`}
                                to={`360 ${node.x} ${node.y}`}
                                dur={node.isOrigin ? "8s" : "6s"}
                                repeatCount="indefinite"
                              />
                            </circle>

                            {/* Solid core center */}
                            <circle
                              cx={node.x}
                              cy={node.y}
                              r="4"
                              fill={node.isOrigin ? "#818cf8" : "#facc15"}
                            />

                            {/* Node Sequential Label (Inner) */}
                            <text
                              x={node.x}
                              y={node.y + 3}
                              textAnchor="middle"
                              className="font-sans font-black text-[8px] uppercase select-none fill-white pointer-events-none"
                            >
                              {node.isOrigin ? "P" : node.seq}
                            </text>

                            {/* Hover info popups / Stationary labels */}
                            <text
                              x={node.x}
                              y={node.y - 18}
                              textAnchor="middle"
                              className="font-mono text-[7px] font-bold tracking-widest uppercase fill-slate-300 select-none pointer-events-none"
                            >
                              {node.isOrigin ? "CENTRAL (CD)" : node.name}
                            </text>
                          </g>
                        );
                      })}

                      {/* 3. ANIMATE AND POSITION THE SEMI-TRUCK */}
                      {projectedNodes.length > 1 && (
                        <g
                          transform={`translate(${truckPos.x}, ${truckPos.y}) rotate(${truckPos.angle})`}
                          className="transition-all duration-75 ease-linear"
                        >
                          {/* Glow drop-shadow under truck */}
                          <rect
                            x="-18"
                            y="-9"
                            width="36"
                            height="18"
                            rx="5"
                            fill="#facc15"
                            className="blur-md opacity-45"
                          />

                          {/* Semi-Truck Trailer */}
                          <rect
                            x="-16"
                            y="-7"
                            width="24"
                            height="14"
                            rx="2"
                            fill="#1e293b"
                            stroke="#facc15"
                            strokeWidth="1"
                          />

                          {/* Detail stripes on the trailer */}
                          <line x1="-12" y1="-4" x2="2" y2="-4" stroke="#facc15" strokeWidth="0.5" strokeDasharray="2 1" />
                          <line x1="-12" y1="4" x2="2" y2="4" stroke="#facc15" strokeWidth="0.5" strokeDasharray="2 1" strokeOpacity="0.8" />

                          {/* Connection Joint */}
                          <rect x="7" y="-2" width="3" height="4" fill="#64748b" />

                          {/* Semi-Truck Front Cabin */}
                          <path
                            d="M 10 -6 L 15 -6 C 17 -6 18 -4 18 -1 L 18 1 C 18 4 17 6 15 6 L 10 6 Z"
                            fill="#e2e8f0"
                            stroke="#94a3b8"
                            strokeWidth="1"
                          />

                          {/* Windshield */}
                          <path
                            d="M 14 -4 L 16.5 -4 Q 17.5 -2 17.5 0 Q 17.5 2 16.5 2 L 14 2 Z"
                            fill="#0f172a"
                          />

                          {/* Glowing Headlights */}
                          <circle cx="18" cy="-5" r="1" fill="#fef08a" />
                          <circle cx="18" cy="5" r="1" fill="#fef08a" />

                          {/* Exhaust Pipe or Details */}
                          <rect x="11" y="-8" width="1.5" height="1.5" fill="#475569" />
                        </g>
                      )}
                    </svg>
                  </div>

                  {/* Traffic Layer Real-time Status Legend overlay */}
                  {showTrafficLayer && (
                    <div className="absolute bottom-16 right-4 bg-slate-950/90 text-white p-2.5 rounded-xl border border-slate-800/80 backdrop-blur shadow-2xl text-left flex flex-col gap-1.5 z-10 font-sans max-w-[130px] animate-in fade-in slide-in-from-right duration-300">
                      <div className="flex items-center gap-1.5">
                        <TrafficCone className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                        <span className="text-[8px] font-black uppercase tracking-wider text-slate-300">Camada Tráfego</span>
                      </div>
                      <div className="space-y-1.5 mt-1 border-t border-slate-800/60 pt-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_6px_#10b981]"></span>
                          <span className="text-[7.5px] font-bold text-slate-300">Livre</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#f59e0b] shadow-[0_0_6px_#f59e0b]"></span>
                          <span className="text-[7.5px] font-bold text-slate-300">Moderado</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#ef4444] shadow-[0_0_6px_#ef4444]"></span>
                          <span className="text-[7.5px] font-bold text-slate-300">Congestionado</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Floating Controller Panel overlay inside maps area */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex bg-slate-900/90 backdrop-blur-md text-white p-1 rounded-2xl gap-1 border border-slate-800 shadow-2xl select-none max-w-[95%] items-center">
                    <button
                      type="button"
                      onClick={() => setIsSvgMode(false)}
                      className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all ${
                        !isSvgMode ? 'bg-primary-gold text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-100'
                      }`}
                    >
                      <MapIcon className="w-3.5 h-3.5" />
                      <span>Mapa Satélite</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsSvgMode(true)}
                      className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${
                        isSvgMode ? 'bg-primary-gold text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-100'
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5 animate-pulse" />
                      <span>Simulador (SVG)</span>
                    </button>

                    <button
                      type="button"
                      id="traffic-layer-toggle-svg-btn"
                      onClick={() => setShowTrafficLayer(!showTrafficLayer)}
                      className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer border transition-all ${
                        showTrafficLayer 
                          ? 'bg-rose-500/10 text-rose-450 border-rose-500/20' 
                          : 'text-slate-400 border-transparent hover:text-slate-100'
                      }`}
                      title={showTrafficLayer ? "Desativar Camada de Trânsito" : "Ativar Camada de Trânsito"}
                    >
                      <TrafficCone className={`w-3.5 h-3.5 ${showTrafficLayer ? 'animate-bounce text-rose-500' : 'text-slate-400'}`} />
                      <span>Trânsito: {showTrafficLayer ? 'ON' : 'OFF'}</span>
                    </button>
                    
                    <div className="flex items-center gap-1 ml-1 border-l border-slate-800 pl-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsSimulationPlaying(!isSimulationPlaying)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-350 transition-colors cursor-pointer"
                        title={isSimulationPlaying ? "Pausar Simulação" : "Iniciar Simulação"}
                      >
                        {isSimulationPlaying ? (
                          <svg className="w-3.5 h-3.5 text-rose-500 fill-current" viewBox="0 0 24 24">
                            <rect x="5" y="4" width="4" height="16" rx="1"></rect>
                            <rect x="15" y="4" width="4" height="16" rx="1"></rect>
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5 text-emerald-500 fill-current" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"></path>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full relative">
                  <iframe
                    title="Roteirizador Atacadão"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0, position: 'absolute', top: 0, left: 0, bottom: 0, right: 0 }}
                    src={mapUrl}
                    allowFullScreen
                  ></iframe>

                  {/* Floating Controller Panel overlay inside maps area when in satellite mode */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex bg-slate-900/90 backdrop-blur-md text-white p-1 rounded-2xl gap-1 border border-slate-800 shadow-2xl select-none max-w-[95%] items-center">
                    <button
                      type="button"
                      onClick={() => setIsSvgMode(false)}
                      className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all ${
                        !isSvgMode ? 'bg-primary-gold text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-100'
                      }`}
                    >
                      <MapIcon className="w-3.5 h-3.5" />
                      <span>Mapa Satélite</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsSvgMode(true)}
                      className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${
                        isSvgMode ? 'bg-primary-gold text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-100'
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5 animate-pulse" />
                      <span>Simulador (SVG)</span>
                    </button>

                    <button
                      type="button"
                      id="traffic-layer-toggle-sat-btn"
                      onClick={() => setShowTrafficLayer(!showTrafficLayer)}
                      className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer border transition-all ${
                        showTrafficLayer 
                          ? 'bg-rose-500/10 text-rose-450 border-rose-500/20' 
                          : 'text-slate-400 border-transparent hover:text-slate-100'
                      }`}
                      title={showTrafficLayer ? "Desativar Camada de Trânsito" : "Ativar Camada de Trânsito"}
                    >
                      <TrafficCone className={`w-3.5 h-3.5 ${showTrafficLayer ? 'animate-bounce text-rose-500' : 'text-slate-400'}`} />
                      <span>Trânsito: {showTrafficLayer ? 'ON' : 'OFF'}</span>
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div className="text-center p-8 space-y-4 max-w-sm">
                <div className="w-16 h-16 bg-slate-200 text-slate-400 rounded-full flex items-center justify-center mx-auto animate-pulse">
                  <MapPin className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Aguardando Parâmetros</h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-2">
                    Selecione as lojas desejadas do Atacadão na barra esquerda e clique no botão de roteirização para visualizar os trajetos no mapa.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Optimization results itinerary overlay */}
        {isCalculated && (
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-3xl p-6 shadow-sm space-y-4 animate-in slide-in-from-bottom duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-200/50">
              <div>
                <span className="text-[9px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Algoritmo Inteligente Ativo
                </span>
                <h4 className="text-sm font-black text-slate-800 mt-1 uppercase">Relatório de Otimização</h4>
              </div>
              <div className="flex gap-4">
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-400">Distância Total</p>
                  <p className="text-lg font-black text-emerald-800">{totalDistance} km</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-400">Tempo Estimado</p>
                  <p className="text-lg font-black text-emerald-800">~{totalDuration} min</p>
                </div>
              </div>
            </div>

            {/* Optimized Sequence path */}
            <div className="space-y-3">
              <p className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Sequência Cronológica Otimizada:</p>
              
              <div className="flex flex-col gap-3">
                {/* Starting Point Indicator */}
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary-navy text-white text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5 border border-primary-navy">
                    P
                  </div>
                  <div className="flex-grow">
                    <p className="text-[11px] font-black text-slate-800 uppercase">{startName}</p>
                    <p className="text-[9px] text-slate-400 font-bold">Início da viagem</p>
                  </div>
                </div>

                {/* Loja waypoints list */}
                {optimizedRoute.map((store, index) => {
                  const isLast = index === optimizedRoute.length - 1;
                  // Compute distance from previous point
                  const prevPoint = index === 0 
                    ? { latitude: gpsLatitude, longitude: gpsLongitude } 
                    : optimizedRoute[index - 1];
                  const legDist = getDistanceKm(prevPoint.latitude, prevPoint.longitude, store.latitude, store.longitude);

                  return (
                    <div key={store.id} className="relative flex items-start gap-3 pl-2.5">
                      {/* Connection Line */}
                      <div className="absolute left-[-2px] top-[-16px] bottom-[16px] w-0.5 bg-slate-300"></div>

                      <div className="w-5 h-5 rounded-full bg-primary-gold text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5 border border-amber-600">
                        {index + 1}
                      </div>
                      
                      <div className="flex-grow flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white/70 p-2.5 rounded-xl border border-slate-100">
                        <div>
                          <p className="text-[11px] font-black text-slate-800">{store.name}</p>
                          <p className="text-[9px] text-slate-500 font-bold">{store.address}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                            <ArrowRight className="w-3 h-3 text-emerald-600" />
                            {legDist} km
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
