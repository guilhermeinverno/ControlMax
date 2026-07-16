import { useEffect, useState, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { useTenant } from '../hooks/useTenant';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { ShieldAlert, Search, RefreshCw, Navigation } from 'lucide-react';
import { listViewBody } from '../utils/listViewBody';

interface CollectorLocation {
  userId: string;
  tenantId: string;
  userName: string;
  unitId?: string;
  unitName?: string;
  cnId?: string;
  cnName?: string;
  boxId?: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  status: 'active' | 'inactive';
  lastSeen?: Timestamp;
  createdAt?: Timestamp;
}

// Map Controller component to handle programmatically flying/panning to coordinates without locking the zoom/pan
function MapFlyController({ 
  selectedLocation
}: { 
  selectedLocation: [number, number] | null; 
}) {
  const map = useMap();
  const lastFlownRef = useRef<string | null>(null);

  // Fly to selected locations (e.g. clicked collector or explicit centring)
  useEffect(() => {
    if (selectedLocation) {
      const coordKey = `selected-${selectedLocation[0].toFixed(5)},${selectedLocation[1].toFixed(5)}`;
      if (lastFlownRef.current !== coordKey) {
        lastFlownRef.current = coordKey;
        map.flyTo(selectedLocation, 16, { duration: 1.5 });
      }
    }
  }, [selectedLocation, map]);

  return null;
}

export function CollectorMap() {
  const { tenantId, role, isSuperAdmin, loading: tenantLoading } = useTenant();
  const [locations, setLocations] = useState<CollectorLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'inactive'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [userLatLng, setUserLatLng] = useState<[number, number] | null>(null);
  const [userAccuracy, setUserAccuracy] = useState<number | null>(null);

  // Real-time Firestore subscription
  useEffect(() => {
    if (tenantLoading) return;
    if (!tenantId) {
      setLoading(false);
      return;
    }

    // Check permissions: only admins, supervisors, or superadmins
    const hasPermission = isSuperAdmin || role === 'admin' || role === 'supervisor';
    if (!hasPermission) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const locationsRef = collection(db, 'locations');
    const q = query(locationsRef, where('tenantId', '==', tenantId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const locList: CollectorLocation[] = [];
        snapshot.forEach((doc) => {
          locList.push(doc.data() as CollectorLocation);
        });
        setLocations(locList);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching collector locations:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tenantId, tenantLoading, role, isSuperAdmin]);

  // Track user's own current browser location
  useEffect(() => {
    if (!navigator.geolocation) return;

    const handleSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords;
      setUserLatLng([latitude, longitude]);
      setUserAccuracy(accuracy);
    };

    const handleError = (error: GeolocationPositionError) => {
      console.warn("Error getting browser geolocation:", error.message);
    };

    // Get position immediately
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 15000,
    });

    // Watch position for changes
    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 15000,
    });

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Authorization Guard
  const hasPermission = isSuperAdmin || role === 'admin' || role === 'supervisor';

  if (tenantLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-700 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500 font-medium">Carregando dados do usuário...</p>
        </div>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center bg-gray-50">
        <div className="bg-red-50 p-4 rounded-full text-red-600 mb-4 shadow-sm">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Acesso Restrito</h1>
        <p className="mt-2 text-sm text-gray-600 max-w-md">
          Apenas administradores e supervisores têm permissão para acessar o mapa de rastreamento de cobradores em tempo real.
        </p>
      </div>
    );
  }

  // Count active vs inactive from fetched tenant locations
  const activeCount = locations.filter(l => l.status === 'active').length;
  const inactiveCount = locations.filter(l => l.status === 'inactive').length;

  // Filter and search locations list
  const filteredLocations = locations.filter((loc) => {
    // 1. Filter by status
    if (filterMode === 'active' && loc.status !== 'active') return false;
    if (filterMode === 'inactive' && loc.status !== 'inactive') return false;

    // 2. Filter by search query (username, unit, business center)
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = loc.userName?.toLowerCase().includes(q);
      const matchUnit = loc.unitName?.toLowerCase().includes(q);
      const matchCn = loc.cnName?.toLowerCase().includes(q);
      return matchName || matchUnit || matchCn;
    }

    return true;
  });

  // Calculate center of the map: average of active locations, or user's position, or Brasilia as fallback
  const activeWithCoords = filteredLocations.filter(l => l.latitude && l.longitude);
  const defaultCenter: [number, number] = [-15.7801, -47.9292]; // Brasília
  const mapCenter: [number, number] = activeWithCoords.length > 0 
    ? [activeWithCoords[0].latitude, activeWithCoords[0].longitude] 
    : (userLatLng || defaultCenter);

  const createUserLocationIcon = () => {
    return L.divIcon({
      html: `
        <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
          <!-- Pulsing Ring -->
          <div style="
            position: absolute;
            width: 100%; height: 100%;
            background: #3B82F6;
            border-radius: 50%;
            opacity: 0.4;
            animation: pulse-ring 1.8s cubic-bezier(0.215, 0.610, 0.355, 1) infinite;
          "></div>
          <!-- Blue Circle Core -->
          <div style="
            position: relative;
            width: 14px; height: 14px;
            background: #1D4ED8;
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 0 8px rgba(0,0,0,0.4);
          "></div>
        </div>
        <style>
          @keyframes pulse-ring {
            0% { transform: scale(0.6); opacity: 0.8; }
            80%, 100% { transform: scale(2.2); opacity: 0; }
          }
        </style>
      `,
      className: '',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };

  const createCustomIcon = (loc: CollectorLocation) => {
    const initial = loc.userName ? loc.userName.charAt(0).toUpperCase() : '?';
    const pinColor = loc.status === 'active' ? '#6B21A8' : '#9CA3AF'; // Purple for active, gray for inactive
    return L.divIcon({
      html: `
        <div style="
          position: relative;
          width: 38px; height: 38px;
          background: ${pinColor};
          border: 3px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 10px rgba(0,0,0,0.35);
          display: flex; align-items: center; justify-content: center;
          transition: background 0.3s ease;
        ">
          <span style="
            transform: rotate(45deg);
            color: white; font-weight: 900;
            font-size: 14px; font-family: system-ui, sans-serif;
            margin-top: -1px;
            margin-left: -1px;
          ">${initial}</span>
        </div>
      `,
      className: '',
      iconSize: [38, 38],
      iconAnchor: [19, 38],
      popupAnchor: [0, -38],
    });
  };

  const formatTimeAgo = (ts: Timestamp | undefined): string => {
    if (!ts) return 'Sem dados';
    const diff = Date.now() - ts.toDate().getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'Agora mesmo';
    if (min < 60) return `Há ${min} min`;
    const hours = Math.floor(min / 60);
    if (hours < 24) return `Há ${hours} h`;
    return ts.toDate().toLocaleDateString('pt-BR');
  };

  const flyToCollector = (loc: CollectorLocation) => {
    if (loc.latitude && loc.longitude) {
      setSelectedLocation([loc.latitude, loc.longitude]);
    }
  };

  return (
    <div className="flex flex-col bg-gray-50 min-h-[calc(100vh-64px)] lg:flex-row" id="collector-map-screen">
      
      {/* LEFT SIDEBAR: Search, Filters and Collector List */}
      <div className="w-full lg:w-[380px] bg-white border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col h-[400px] lg:h-[calc(100vh-64px)] shrink-0 z-10 shadow-sm">
        
        {/* Header Block inside Sidebar */}
        <div className="bg-[#6B21A8] px-5 py-4 text-white">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-extrabold tracking-tight flex items-center gap-2">
              <Navigation className="w-5 h-5 fill-current rotate-45" />
              Mapa de Cobradores
            </h1>
            <span className="text-[10px] bg-purple-800 text-purple-200 font-bold px-2 py-0.5 rounded-full uppercase">
              GPS Real-time
            </span>
          </div>
          <p className="text-purple-200 text-xs mt-1 font-medium">
            {activeCount} cobrador(es) ativo(s) em rota
          </p>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-100 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar cobrador, UGI, Centro..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-600 bg-gray-50/50"
            />
          </div>
        </div>

        {/* Filter Badges */}
        <div className="px-4 py-3 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between gap-1.5 shrink-0">
          <div className="flex gap-1.5 overflow-x-auto">
            <button
              onClick={() => setFilterMode('active')}
              className={`px-2.5 py-1 rounded-full text-xs font-extrabold transition-all shrink-0 ${
                filterMode === 'active'
                  ? 'bg-purple-700 text-white shadow-sm'
                  : 'bg-white text-purple-700 hover:bg-purple-50 border border-purple-200'
              }`}
            >
              Ativos ({activeCount})
            </button>
            <button
              onClick={() => setFilterMode('inactive')}
              className={`px-2.5 py-1 rounded-full text-xs font-extrabold transition-all shrink-0 ${
                filterMode === 'inactive'
                  ? 'bg-gray-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Inativos ({inactiveCount})
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-full text-xs font-extrabold transition-all shrink-0 ${
                filterMode === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-200'
              }`}
            >
              Todos ({locations.length})
            </button>
          </div>
          
          <button 
            onClick={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 400);
            }} 
            className="text-gray-400 hover:text-purple-600 transition-colors p-1"
            title="Sincronizar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />
          </button>
        </div>

        {/* Collector List Container */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {listViewBody(
            loading,
            filteredLocations.length,
            (
            <div className="p-8 text-center text-gray-400 text-xs">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-700 mx-auto mb-2"></div>
              Sincronizando localizações...
            </div>
          ),
            (
            <div className="p-8 text-center text-gray-400 text-xs">
              Nenhum registro encontrado para o filtro selecionado.
            </div>
          ),
            (
            <>
            {filteredLocations.map((loc) => (
              <div
                key={loc.userId}
                onClick={() => flyToCollector(loc)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-purple-50/50 cursor-pointer transition-colors duration-150 border-l-4 border-transparent hover:border-purple-600"
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm shadow-sm ${
                  loc.status === 'active' ? 'bg-[#6B21A8]' : 'bg-gray-400'
                }`}>
                  {loc.userName ? loc.userName.charAt(0).toUpperCase() : '?'}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-xs text-gray-800 truncate">{loc.userName}</div>
                  <div className="text-[10px] text-gray-500 font-medium mt-0.5 truncate">
                    {loc.unitName || 'Sem Unidade'} — {loc.cnName || 'Sem Centro'}
                  </div>
                </div>

                <div className="text-right flex flex-col items-end shrink-0">
                  <div className="text-[10px] text-gray-400 font-mono font-medium">
                    {formatTimeAgo(loc.lastSeen)}
                  </div>
                  <span className={`w-2.5 h-2.5 rounded-full mt-1.5 border border-white ${
                    loc.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
                  }`} />
                </div>
              </div>
            ))}
            </>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE: LEAFLET MAP CONTAINER */}
      <div className="flex-1 min-h-[300px] h-[calc(100vh-464px)] lg:h-[calc(100vh-64px)] relative z-0">
        <MapContainer
          key={userLatLng ? 'located' : 'default'}
          center={userLatLng || mapCenter}
          zoom={userLatLng ? 13 : 12}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapFlyController selectedLocation={selectedLocation} />

          {/* User's own real-time location blue dot and accuracy circle */}
          {userLatLng && (
            <>
              {userAccuracy != null && userAccuracy > 0 && userAccuracy < 2000 && (
                <Circle
                  center={userLatLng}
                  radius={userAccuracy}
                  pathOptions={{
                    color: '#3B82F6',
                    fillColor: '#3B82F6',
                    fillOpacity: 0.1,
                    weight: 1,
                  }}
                />
              )}
              <Marker position={userLatLng} icon={createUserLocationIcon()}>
                <Popup>
                  <div className="p-1 text-center" style={{ minWidth: 120 }}>
                    <div className="font-extrabold text-xs text-blue-600">Você está aqui</div>
                    <p className="text-[10px] text-gray-500 mt-0.5">Sua localização atual</p>
                    {userAccuracy != null && (
                      <div className="text-[9px] text-gray-400 font-mono mt-1 border-t border-gray-100 pt-1">
                        Precisão: ±{Math.round(userAccuracy)}m
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            </>
          )}
          
          {filteredLocations
            .filter((loc) => loc.latitude && loc.longitude)
            .map((loc) => (
              <Marker
                key={loc.userId}
                position={[loc.latitude, loc.longitude]}
                icon={createCustomIcon(loc)}
              >
                <Popup>
                  <div className="p-1" style={{ minWidth: 160 }}>
                    <div className="font-black text-sm text-[#6B21A8]">{loc.userName}</div>
                    <div className="text-[11px] text-gray-600 font-bold mt-1">
                      {loc.unitName} | {loc.cnName}
                    </div>
                    {loc.status === 'active' ? (
                      <span className="inline-block mt-1.5 px-2 py-0.5 bg-green-100 text-green-800 text-[9px] font-black rounded uppercase tracking-wide">
                        Caixa Ativo ({loc.boxId?.slice(-6)})
                      </span>
                    ) : (
                      <span className="inline-block mt-1.5 px-2 py-0.5 bg-gray-100 text-gray-800 text-[9px] font-black rounded uppercase tracking-wide">
                        Caixa Fechado
                      </span>
                    )}
                    <div className="text-[10px] text-gray-400 font-medium mt-2 border-t border-gray-100 pt-1.5">
                      Atualizado: {loc.lastSeen ? loc.lastSeen.toDate().toLocaleString('pt-BR') : 'Sem dados'}
                    </div>
                    <div className="text-[9px] text-gray-400 font-mono mt-0.5">
                      Precisão: {loc.accuracy ? `${Math.round(loc.accuracy)}m` : 'Sem dados'}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>

        {/* Floating action button to center on user location */}
        {userLatLng && (
          <button
            onClick={() => setSelectedLocation(userLatLng)}
            className="absolute bottom-6 right-6 z-[1000] bg-white hover:bg-gray-100 text-[#6B21A8] hover:text-blue-600 transition-all p-3.5 rounded-full shadow-lg border border-gray-200 cursor-pointer flex items-center justify-center group animate-fadeIn"
            title="Centralizar em minha localização"
          >
            <Navigation className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform fill-current rotate-45" />
          </button>
        )}
      </div>
      
    </div>
  );
}
