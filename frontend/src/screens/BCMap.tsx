import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useTenant } from '../hooks/useTenant';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Building2, Layers, DollarSign, Users, Briefcase, RefreshCw, Compass, Navigation } from 'lucide-react';

interface BusinessCenter {
  id: string;
  name: string;
  code: string;
  status: 'Activo' | 'Inactivo';
  unitCount: number;
  responsible: string;
  observations: string;
  linkedUnits: Array<{
    id: string;
    name: string;
    location: string;
    active: boolean;
  }>;
  financialParams: {
    maxAmountPerCredit: number;
    annualInterestRate: number;
    lateFeePercentage: number;
    allowRefinance: boolean;
    minCapitalRequirement: number;
  };
}

// Map Controller component to handle programmatically flying/panning to coordinates
function MapFlyController({ selectedLocation }: { selectedLocation: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (selectedLocation) {
      map.flyTo(selectedLocation, 12, { duration: 1.5 });
    }
  }, [selectedLocation, map]);
  return null;
}

export function BCMap() {
  const { tenantId, loading: tenantLoading } = useTenant();
  const [centers, setCenters] = useState<BusinessCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCenter, setSelectedCenter] = useState<BusinessCenter | null>(null);
  const [userLatLng, setUserLatLng] = useState<[number, number] | null>(null);
  const [userAccuracy, setUserAccuracy] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);

  const fetchCenters = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'business_centers'), where('tenantId', '==', tenantId));
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          code: data.code || '',
          status: data.status || 'Activo',
          unitCount: data.unitCount || 0,
          responsible: data.responsible || '',
          observations: data.observations || '',
          linkedUnits: data.linkedUnits || [],
          financialParams: data.financialParams || {
            maxAmountPerCredit: 5000000,
            annualInterestRate: 20,
            lateFeePercentage: 5,
            allowRefinance: true,
            minCapitalRequirement: 10000000
          }
        };
      }) as BusinessCenter[];

      setCenters(list);
      if (list.length > 0) {
        setSelectedCenter(list[0]);
      }
    } catch (err) {
      console.error("Error loading business centers for map:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      fetchCenters();
    }
  }, [tenantId]);

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

  if (tenantLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B21A8] mb-4"></div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cargando Mapa de Operaciones...</p>
      </div>
    );
  }

  // Real-world coordinates mapping for primary Business Centers in Brazil
  const mapCoordinates: Record<string, [number, number]> = {
    'CN-MET-NOR': [-19.9217, -43.9333], // Belo Horizonte
    'CN-SUR-PAC': [-30.0346, -51.2177], // Porto Alegre
    'CN-ORI-ANT': [-22.9068, -43.1729], // Rio de Janeiro
  };

  const getCoordinates = (code: string, index: number): [number, number] => {
    if (mapCoordinates[code]) return mapCoordinates[code];
    // Fallback stable positioning distributed near Brasília
    const baseLat = -15.7801;
    const baseLng = -47.9292;
    const offsetLat = ((index * 1.5) % 4) - 2;
    const offsetLng = ((index * 2.0) % 4) - 2;
    return [baseLat + offsetLat, baseLng + offsetLng];
  };

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

  const createCenterIcon = (isSelected: boolean, isActive: boolean) => {
    const color = isSelected ? '#84CC16' : (isActive ? '#7E22CE' : '#4B5563');
    const borderColor = isSelected ? '#FFFFFF' : '#FFFFFF';
    return L.divIcon({
      html: `
        <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
          <div style="
            width: 28px; height: 28px;
            background: ${color};
            border: 2px solid ${borderColor};
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            display: flex; align-items: center; justify-content: center;
            color: ${isSelected ? '#0F172A' : '#FFFFFF'};
          ">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building-2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
          </div>
        </div>
      `,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  const defaultCenter: [number, number] = [-15.7801, -47.9292]; // Brasília
  const selectedCenterIdx = selectedCenter ? centers.findIndex(c => c.id === selectedCenter.id) : -1;
  const selectedCenterCoords = selectedCenter && selectedCenterIdx !== -1 ? getCoordinates(selectedCenter.code, selectedCenterIdx) : null;
  const mapCenter: [number, number] = selectedCenterCoords || userLatLng || defaultCenter;

  return (
    <div className="flex flex-col space-y-6 w-full max-w-[1550px] mx-auto animate-fadeIn">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Compass className="w-6 h-6 text-[#6B21A8]" />
            <span>Mapa de Distribución y Cobertura</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Visualización interactiva de Centros de Negocios y sus Unidades de Cobranza activas en el territorio nacional.
          </p>
        </div>
        
        <button 
          onClick={fetchCenters}
          className="mt-3 md:mt-0 flex items-center justify-center gap-2 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 font-bold py-2 px-3.5 rounded text-xs transition-colors shadow-sm cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sincronizar Mapa</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left map visualizer - Grid size 8 */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-lg shadow-lg overflow-hidden flex flex-col min-h-[500px]">
          
          {/* Map Header bar */}
          <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex justify-between items-center text-white">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8CC63F] animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Monitoreo Territorial Activo</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Región: Brazil / Cono Sur</span>
          </div>

          {/* Map Canvas body */}
          <div className="flex-1 relative min-h-[420px] h-[500px] z-0">
            <MapContainer
              center={mapCenter}
              zoom={5}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <MapFlyController selectedLocation={selectedLocation || selectedCenterCoords} />

              {/* User's own real-time location blue dot and accuracy circle */}
              {userLatLng && (
                <>
                  {userAccuracy && userAccuracy < 2000 && (
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
                        {userAccuracy && (
                          <div className="text-[9px] text-gray-400 font-mono mt-1 border-t border-gray-100 pt-1">
                            Precisão: ±{Math.round(userAccuracy)}m
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                </>
              )}

              {/* Render dynamic pin anchors */}
              {centers.map((center, index) => {
                const coords = getCoordinates(center.code, index);
                const isSelected = selectedCenter?.id === center.id;
                const isActive = center.status === 'Activo';

                return (
                  <Marker
                    key={center.id}
                    position={coords}
                    icon={createCenterIcon(isSelected, isActive)}
                    eventHandlers={{
                      click: () => {
                        setSelectedCenter(center);
                        setSelectedLocation(coords);
                      }
                    }}
                  >
                    <Popup>
                      <div className="p-2" style={{ minWidth: 180 }}>
                        <div className="font-extrabold text-xs text-purple-800">{center.name}</div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">Código: {center.code}</div>
                        <div className="text-[11px] text-gray-600 mt-1 border-t border-gray-100 pt-1.5 space-y-1">
                          <div><strong>Responsável:</strong> {center.responsible}</div>
                          <div><strong>Unidades:</strong> {center.unitCount}</div>
                          <div><strong>Status:</strong> <span className={`font-bold px-1 rounded ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{center.status}</span></div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

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

            {/* Map Legend */}
            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur border border-gray-200 p-3 rounded-md text-[10px] font-medium text-gray-700 space-y-2 z-[1000] shadow-md">
              <div className="font-bold border-b border-gray-200 pb-1 uppercase tracking-wide text-gray-500">Leyenda</div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#84CC16]"></span>
                <span>Selecionado</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-700"></span>
                <span>Centro Operativo Activo</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-500"></span>
                <span>Centro Inactivo</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                <span>Sua Localização</span>
              </div>
            </div>

          </div>

        </div>

        {/* Right side info panel - Grid size 4 */}
        <div className="lg:col-span-4 flex flex-col space-y-6">
          
          {/* Business Centers List Quick-selector */}
          <div className="bg-white border border-gray-200 shadow-md rounded-lg p-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Lista de Centros</h2>
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {centers.map((center, index) => {
                const isSelected = selectedCenter?.id === center.id;
                return (
                  <button
                    key={center.id}
                    onClick={() => {
                      setSelectedCenter(center);
                      setSelectedLocation(getCoordinates(center.code, index));
                    }}
                    className={`w-full text-left p-2.5 rounded border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected 
                        ? 'border-[#6B21A8] bg-purple-50/70 font-bold text-[#6B21A8]' 
                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <Building2 className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#6B21A8]' : 'text-gray-400'}`} />
                      <div className="truncate text-xs">
                        <div className="font-bold truncate">{center.name}</div>
                        <div className="text-[10px] text-gray-500 font-mono">{center.code}</div>
                      </div>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                      center.status === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {center.status}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active selected center card details */}
          {selectedCenter ? (
            <div className="bg-white border border-gray-200 shadow-md rounded-lg overflow-hidden flex-1 flex flex-col">
              
              {/* Card Header */}
              <div className="bg-[#6B21A8] text-white p-4">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="bg-[#8CC63F] text-slate-950 text-[9px] font-black uppercase px-1.5 py-0.5 rounded">
                    {selectedCenter.code}
                  </span>
                  <span className="text-[10px] text-white/80 font-semibold">Responsable: {selectedCenter.responsible}</span>
                </div>
                <h3 className="font-extrabold text-base tracking-tight truncate">{selectedCenter.name}</h3>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 overflow-y-auto space-y-4">
                
                {/* Financial overview stats */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 p-2.5 rounded border border-gray-100 text-center">
                    <div className="text-[9px] font-bold text-gray-400 uppercase">Monto Max Crédito</div>
                    <div className="text-xs font-black text-purple-700 mt-1">
                      $ {(selectedCenter.financialParams.maxAmountPerCredit / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded border border-gray-100 text-center">
                    <div className="text-[9px] font-bold text-gray-400 uppercase">Requisito Capital</div>
                    <div className="text-xs font-black text-[#16A34A] mt-1">
                      $ {(selectedCenter.financialParams.minCapitalRequirement / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {/* Technical data list */}
                <div className="text-xs space-y-2 bg-purple-50/30 p-3 rounded-md border border-purple-100/50">
                  <div className="flex justify-between items-center py-1 border-b border-purple-100/30">
                    <span className="text-gray-500 font-medium">Tasa de Interés Anual:</span>
                    <span className="font-bold text-gray-800">{selectedCenter.financialParams.annualInterestRate}%</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-purple-100/30">
                    <span className="text-gray-500 font-medium">Mora de Pago (Mora):</span>
                    <span className="font-bold text-gray-800">{selectedCenter.financialParams.lateFeePercentage}%</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-500 font-medium">Permite Refinanciamiento:</span>
                    <span className={`font-bold px-1.5 py-0.2 rounded uppercase text-[10px] ${
                      selectedCenter.financialParams.allowRefinance ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedCenter.financialParams.allowRefinance ? 'Sí' : 'No'}
                    </span>
                  </div>
                </div>

                {/* Linked Units sub-table */}
                <div>
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Unidades Vinculadas ({selectedCenter.linkedUnits.length})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedCenter.linkedUnits.length === 0 ? (
                      <p className="text-[11px] text-gray-400 italic">No hay unidades vinculadas.</p>
                    ) : (
                      selectedCenter.linkedUnits.map((unit) => (
                        <div 
                          key={unit.id}
                          className="p-2 border border-gray-100 rounded-md bg-gray-50 flex items-center justify-between"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="font-bold text-xs truncate text-gray-800">{unit.name}</div>
                            <div className="text-[10px] text-gray-500 truncate">{unit.location}</div>
                          </div>
                          <span className={`text-[9px] shrink-0 font-bold uppercase px-1.5 py-0.5 rounded-full ${
                            unit.active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {unit.active ? 'Activa' : 'Inactiva'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Observations */}
                {selectedCenter.observations && (
                  <div className="border-t border-gray-100 pt-3">
                    <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Observaciones</h4>
                    <p className="text-xs text-gray-600 leading-relaxed italic">
                      "{selectedCenter.observations}"
                    </p>
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 shadow-md rounded-lg p-6 text-center text-gray-400 flex-1 flex flex-col justify-center items-center">
              <Building2 className="w-12 h-12 text-gray-300 mb-2" />
              <p className="text-xs">Seleccione un Centro de Negocios para ver su detalle territorial.</p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
