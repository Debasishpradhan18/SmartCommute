import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, Activity, MapPin, Eye, EyeOff } from 'lucide-react';

interface MapViewProps {
  source: { name: string; coords: [number, number] } | null;
  destination: { name: string; coords: [number, number] } | null;
  routes: any[];
  selectedRouteIndex: number;
  onSelectRoute: (index: number) => void;
  onSelectSource?: (name: string) => void;
  onSelectDestination?: (name: string) => void;
}

// Odisha bounds as requested
const odishaBounds: L.LatLngBoundsExpression = [
  [17.000, 80.500], // South-West corner
  [23.200, 88.000]  // North-East corner
];

const position: [number, number] = [20.9517, 85.0985]; // Center of Odisha

// Highlighted cities list (20 cities)
const ODISHA_CITIES = [
  { name: 'Bhubaneswar', coords: [20.2961, 85.8245], congestion: 'Moderate', trafficSpeed: '42 km/h', description: 'Capital City, Smart City Hub' },
  { name: 'Cuttack', coords: [20.4625, 85.8830], congestion: 'Heavy', trafficSpeed: '28 km/h', description: 'Millennium City, High density traffic' },
  { name: 'Puri', coords: [19.8134, 85.8315], congestion: 'Low', trafficSpeed: '55 km/h', description: 'Tourist Transit Hub, Grand Road corridor' },
  { name: 'Rourkela', coords: [22.2604, 84.8536], congestion: 'Low', trafficSpeed: '48 km/h', description: 'Steel City, Clean Traffic Corridor' },
  { name: 'Sambalpur', coords: [21.4653, 83.9757], congestion: 'Moderate', trafficSpeed: '38 km/h', description: 'Western Odisha Transit Hub' },
  { name: 'Berhampur', coords: [19.3000, 84.8500], congestion: 'Moderate', trafficSpeed: '35 km/h', description: 'Silk City Transit Gateway' },
  { name: 'Balasore', coords: [21.4950, 86.9317], congestion: 'Moderate', trafficSpeed: '40 km/h', description: 'Coastal Industrial Hub, North Odisha Transit' },
  { name: 'Angul', coords: [20.8400, 85.1000], congestion: 'Heavy', trafficSpeed: '30 km/h', description: 'Major Coal & Power Hub, Industrial Transit' },
  { name: 'Bhadrak', coords: [21.0500, 86.5000], congestion: 'Moderate', trafficSpeed: '36 km/h', description: 'Trading Center, Coastal Transit Corridor' },
  { name: 'Jajpur', coords: [20.8500, 86.3333], congestion: 'Moderate', trafficSpeed: '34 km/h', description: 'Historic Land, Steel Sector Transit' },
  { name: 'Jagatsinghpur', coords: [20.2700, 86.1700], congestion: 'Low', trafficSpeed: '45 km/h', description: 'Agricultural & Port Linkage Region' },
  { name: 'Paradeep', coords: [20.3164, 86.6085], congestion: 'Heavy', trafficSpeed: '25 km/h', description: 'Major Deep-water Port, Heavy Freight Link' },
  { name: 'Kendrapara', coords: [20.5000, 86.4200], congestion: 'Low', trafficSpeed: '48 km/h', description: 'Coastal Green Corridor' },
  { name: 'Dhenkanal', coords: [20.6621, 85.6000], congestion: 'Low', trafficSpeed: '42 km/h', description: 'Artisanal City, Central Transit Link' },
  { name: 'Koraput', coords: [18.8100, 82.7200], congestion: 'Low', trafficSpeed: '40 km/h', description: 'Southern Scenic Hill City, Tribal Heritage' },
  { name: 'Keonjhar', coords: [21.6289, 85.5817], congestion: 'Moderate', trafficSpeed: '35 km/h', description: 'Mineral Rich Zone, Heavy Mining Traffic' },
  { name: 'Baripada', coords: [21.9320, 86.7516], congestion: 'Low', trafficSpeed: '44 km/h', description: 'Cultural Gateway, Mayurbhanj Hub' },
  { name: 'Rayagada', coords: [19.1689, 83.4150], congestion: 'Low', trafficSpeed: '38 km/h', description: 'Paper Industry Center, Southern Transit Link' },
  { name: 'Jharsuguda', coords: [21.8550, 84.0300], congestion: 'Moderate', trafficSpeed: '37 km/h', description: 'Industrial Powerhouse, Airport Gateway' },
  { name: 'Phulbani', coords: [20.4700, 84.2300], congestion: 'Low', trafficSpeed: '42 km/h', description: 'Forest Cover Heartlands, Scenic Transit Link' }
];

// Predefined highways (Odisha National Highways)
const TRAFFIC_CORRIDORS = [
  {
    name: 'NH-16 (Coastal Highway: Berhampur - Bhubaneswar - Cuttack - Balasore)',
    path: [
      [19.3000, 84.8500],
      [19.8000, 85.2000],
      [20.2961, 85.8245],
      [20.4625, 85.8830],
      [21.0500, 86.5000],
      [21.4950, 86.9317]
    ],
    status: 'Heavy',
    color: '#ff0055', // Cyber Red
    speed: '34 km/h'
  },
  {
    name: 'NH-53 (Sambalpur - Talcher - Jajpur - Paradeep Port Expressway)',
    path: [
      [21.4653, 83.9757],
      [21.8550, 84.0300],
      [21.1500, 84.8000],
      [20.9500, 85.2000],
      [20.8500, 86.3333],
      [20.3164, 86.6085]
    ],
    status: 'Moderate',
    color: '#ffd700', // Gold Yellow
    speed: '48 km/h'
  },
  {
    name: 'NH-55 (Central Corridor: Sambalpur - Angul - Dhenkanal - Cuttack)',
    path: [
      [21.4653, 83.9757],
      [21.0500, 84.4500],
      [20.8400, 85.1000],
      [20.6621, 85.6000],
      [20.4625, 85.8830]
    ],
    status: 'Low',
    color: '#39ff14', // Neon Green
    speed: '62 km/h'
  },
  {
    name: 'NH-26 (Western-Southern Corridor: Sambalpur - Bhawanipatna - Rayagada - Koraput)',
    path: [
      [21.4653, 83.9757],
      [20.8400, 83.4800],
      [20.1500, 83.1500],
      [19.1689, 83.4150],
      [18.8100, 82.7200]
    ],
    status: 'Low',
    color: '#39ff14',
    speed: '58 km/h'
  }
];

// Public Transit Lines
const PUBLIC_TRANSIT_ROUTES = [
  {
    name: 'Bhubaneswar-Cuttack Metro Phase 1 (Proposed)',
    path: [
      [20.2961, 85.8245], // Master Canteen
      [20.3300, 85.8200], // Patia Square
      [20.3700, 85.8400], // Trishulia Hub
      [20.4300, 85.8750], // Netaji Terminal
      [20.4625, 85.8830]  // Cuttack Center
    ],
    color: '#00f0ff', // Neon Cyan
    dashArray: '10, 8'
  },
  {
    name: 'Mo Bus Interstate Line 10 (Bhubaneswar - Puri)',
    path: [
      [20.2961, 85.8245],
      [20.1900, 85.8450],
      [19.9800, 85.8200],
      [19.8134, 85.8315]
    ],
    color: '#00f0ff',
    dashArray: '5, 5'
  }
];

// Predefined Smart Parking Garages
const SMART_PARKINGS = [
  { name: 'Saheed Nagar Smart Multi-Level Parking', city: 'Bhubaneswar', coords: [20.2882, 85.8424], totalSlots: 150, availableSlots: 84, rate: '₹20/hr' },
  { name: 'Rajmahal Square Parking Lot', city: 'Bhubaneswar', coords: [20.2685, 85.8322], totalSlots: 80, availableSlots: 12, rate: '₹15/hr' },
  { name: 'Link Road Smart Parking', city: 'Cuttack', coords: [20.4435, 85.8890], totalSlots: 120, availableSlots: 45, rate: '₹15/hr' },
  { name: 'Puri Beach Grand Parking', city: 'Puri', coords: [19.8090, 85.8300], totalSlots: 200, availableSlots: 110, rate: '₹20/hr' },
  { name: 'Rourkela VIP Road Multi-Level Parking', city: 'Rourkela', coords: [22.2512, 84.8480], totalSlots: 100, availableSlots: 60, rate: '₹10/hr' },
  { name: 'Golbazar Smart Parking', city: 'Sambalpur', coords: [21.4705, 83.9720], totalSlots: 90, availableSlots: 32, rate: '₹10/hr' },
  { name: 'Station Square Parking Lot', city: 'Balasore', coords: [21.4920, 86.9280], totalSlots: 70, availableSlots: 28, rate: '₹12/hr' }
];

// Major Transport Hubs
const TRANSPORT_HUBS = [
  { name: 'Biju Patnaik International Airport', type: 'airport', coords: [20.2520, 85.8180], details: 'Odisha\'s primary international gateway.' },
  { name: 'Bhubaneswar Railway Station', type: 'railway', coords: [20.2930, 85.8436], details: 'A-1 class station and East Coast Railway headquarters.' },
  { name: 'Cuttack Railway Station', type: 'railway', coords: [20.4680, 85.8970], details: 'Key transit link in the Howrah-Chennai mainline.' },
  { name: 'Puri Railway Station', type: 'railway', coords: [19.8160, 85.8430], details: 'Terminal station serving millions of holy pilgrims.' },
  { name: 'Paradeep Port', type: 'port', coords: [20.2940, 86.6710], details: 'Major deep-water shipping port on the East coast.' },
  { name: 'Rourkela Railway Station', type: 'railway', coords: [22.2530, 84.8870], details: 'Major industrial rail junction in North Odisha.' },
  { name: 'Sambalpur Railway Station', type: 'railway', coords: [21.4880, 83.9900], details: 'Key western junction routing transit across states.' }
];

// Emergency Locations
const EMERGENCY_LOCATIONS = [
  { name: 'SCB Medical College & Hospital', type: 'hospital', coords: [20.4727, 85.8898], city: 'Cuttack', phone: '0671-2414332' },
  { name: 'AIIMS Bhubaneswar', type: 'hospital', coords: [20.2452, 85.7766], city: 'Bhubaneswar', phone: '0674-2476789' },
  { name: 'Ispat General Hospital (IGH)', type: 'hospital', coords: [22.2272, 84.8690], city: 'Rourkela', phone: '0661-2448989' },
  { name: 'MKCG Medical College & Hospital', type: 'hospital', coords: [19.3090, 84.8040], city: 'Berhampur', phone: '0680-2292746' },
  { name: 'Capital Police Station', type: 'police', coords: [20.2730, 85.8320], city: 'Bhubaneswar', phone: '112 / 0674-2533800' },
  { name: 'Purighat Police Station', type: 'police', coords: [20.4578, 85.8670], city: 'Cuttack', phone: '112 / 0671-2301543' },
  { name: 'Puri Town Police Station', type: 'police', coords: [19.8115, 85.8252], city: 'Puri', phone: '112 / 06752-222039' },
  { name: 'Sambalpur Town Police Station', type: 'police', coords: [21.4720, 83.9780], city: 'Sambalpur', phone: '112 / 0663-2402120' },
  { name: 'Kalpana Fire Station', type: 'fire', coords: [20.2612, 85.8402], city: 'Bhubaneswar', phone: '101 / 0674-2312101' },
  { name: 'Rourkela Fire Station', type: 'fire', coords: [22.2450, 84.8560], city: 'Rourkela', phone: '101 / 0661-2500101' },
  { name: 'Balasore Fire Station', type: 'fire', coords: [21.4920, 86.9280], city: 'Balasore', phone: '101 / 06782-262101' },
  { name: 'Tata Power EV Charging Station', type: 'charging', coords: [20.3532, 85.8280], city: 'Bhubaneswar', speed: '50 kW DC Fast' },
  { name: 'Biju Patnaik Airport EV Station', type: 'charging', coords: [20.2530, 85.8170], city: 'Bhubaneswar', speed: '30 kW DC' },
  { name: 'NH-16 Highway EV Charger', type: 'charging', coords: [20.4420, 85.8900], city: 'Cuttack', speed: '60 kW Dual Fast' },
  { name: 'NH-53 EV Charging Station', type: 'charging', coords: [21.4550, 83.9600], city: 'Sambalpur', speed: '50 kW Fast' }
];

// Custom icons using inline style for 100% reliability
const createPinIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="
        background-color: ${color};
        width: 18px;
        height: 18px;
        border-radius: 50%;
        border: 2px solid #FFFFFF;
        box-shadow: 0 0 10px ${color};
        position: relative;
      ">
        <div style="
          position: absolute;
          width: 6px;
          height: 6px;
          background-color: #FFFFFF;
          border-radius: 50%;
          top: 4px;
          left: 4px;
        "></div>
      </div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
};

const createCityIcon = (congestion: string) => {
  const color = congestion === 'Heavy' ? 'var(--traffic-heavy)' :
                congestion === 'Moderate' ? 'var(--traffic-medium)' :
                'var(--traffic-low)';
  return L.divIcon({
    className: 'city-neon-marker',
    html: `
      <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
        <div style="
          position: absolute;
          width: 10px;
          height: 10px;
          background-color: ${color};
          border-radius: 50%;
          border: 2px solid #ffffff;
          box-shadow: 0 0 10px ${color};
          z-index: 2;
        "></div>
        <div style="
          position: absolute;
          width: 24px;
          height: 24px;
          background-color: ${color};
          opacity: 0.35;
          border-radius: 50%;
          animation: mapPulse 2s infinite ease-in-out;
          z-index: 1;
        "></div>
      </div>
      <style>
        @keyframes mapPulse {
          0% { transform: scale(0.5); opacity: 0.7; }
          100% { transform: scale(1.4); opacity: 0; }
        }
      </style>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

const createParkingIcon = () => {
  return L.divIcon({
    className: 'parking-neon-marker',
    html: `
      <div style="
        background-color: #00f0ff;
        width: 18px;
        height: 18px;
        border-radius: 4px;
        border: 1px solid #FFFFFF;
        box-shadow: 0 0 8px rgba(0,240,255,0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #050811;
        font-family: 'Inter', sans-serif;
        font-size: 10px;
        font-weight: 900;
      ">P</div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
};

const createHubIcon = (type: string) => {
  const symbol = type === 'airport' ? '✈️' : type === 'port' ? '⚓' : '🚆';
  return L.divIcon({
    className: 'hub-neon-marker',
    html: `
      <div style="
        background-color: #818CF8;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 1px solid #FFFFFF;
        box-shadow: 0 0 8px rgba(129,140,248,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
      ">${symbol}</div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

const createEmergencyIcon = (type: string) => {
  const symbol = type === 'hospital' ? '🏥' :
                 type === 'police' ? '🚨' :
                 type === 'fire' ? '🚒' : '⚡';
  const bgColor = type === 'hospital' ? '#ff0055' :
                  type === 'police' ? '#2563EB' :
                  type === 'fire' ? '#EA580C' : '#39ff14';
  return L.divIcon({
    className: 'emergency-neon-marker',
    html: `
      <div style="
        background-color: ${bgColor};
        width: 20px;
        height: 20px;
        border-radius: 4px;
        border: 1px solid #FFFFFF;
        box-shadow: 0 0 8px ${bgColor};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
      ">${symbol}</div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

// Component to dynamically fit the bounds of the map to the selected route
function ChangeView({ bounds }: { bounds: L.LatLngBoundsExpression | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13, animate: true, duration: 1.2 });
    } else {
      // Default reset to center Odisha
      map.setView(position, 7);
    }
  }, [bounds, map]);
  return null;
}

export default function MapView({
  source,
  destination,
  routes,
  selectedRouteIndex,
  onSelectRoute,
  onSelectSource,
  onSelectDestination
}: MapViewProps) {
  // Layer toggles
  const [showHighways, setShowHighways] = useState(true);
  const [showTransit, setShowTransit] = useState(true);
  const [showParking, setShowParking] = useState(true);
  const [showCities, setShowCities] = useState(true);
  const [showHubs, setShowHubs] = useState(true);
  const [showEmergency, setShowEmergency] = useState(true);

  // Compute map bounds if route is available
  let bounds: L.LatLngBoundsExpression | null = null;
  if (source && destination) {
    bounds = [
      [source.coords[0], source.coords[1]],
      [destination.coords[0], destination.coords[1]]
    ];
  }

  return (
    <div className="map-container dark-map">
      {/* Floating Control Panel for Overlays */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        width: '210px',
        padding: '12px 14px',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }} className="glass-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '6px' }}>
          <Layers size={14} style={{ color: 'var(--accent-color)' }} />
          <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Map Overlays</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => setShowCities(!showCities)}
            style={{
              background: 'transparent',
              border: 'none',
              color: showCities ? '#ffffff' : 'var(--text-secondary)',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontWeight: 600,
              width: '100%'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={12} style={{ color: 'var(--traffic-low)' }} /> Highlighted Cities
            </span>
            {showCities ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>

          <button
            onClick={() => setShowHighways(!showHighways)}
            style={{
              background: 'transparent',
              border: 'none',
              color: showHighways ? '#ffffff' : 'var(--text-secondary)',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontWeight: 600,
              width: '100%'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={12} style={{ color: 'var(--traffic-heavy)' }} /> NH Traffic Corridors
            </span>
            {showHighways ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>

          <button
            onClick={() => setShowTransit(!showTransit)}
            style={{
              background: 'transparent',
              border: 'none',
              color: showTransit ? '#ffffff' : 'var(--text-secondary)',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontWeight: 600,
              width: '100%'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '1px', borderBottom: '2px dashed #00f0ff' }}></span> Transit Corridors
            </span>
            {showTransit ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>

          <button
            onClick={() => setShowParking(!showParking)}
            style={{
              background: 'transparent',
              border: 'none',
              color: showParking ? '#ffffff' : 'var(--text-secondary)',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontWeight: 600,
              width: '100%'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ background: '#00f0ff', color: '#050811', fontSize: '8px', fontWeight: 'bold', width: '12px', height: '12px', borderRadius: '2px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>P</span> Smart Parking Hubs
            </span>
            {showParking ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>

          <button
            onClick={() => setShowHubs(!showHubs)}
            style={{
              background: 'transparent',
              border: 'none',
              color: showHubs ? '#ffffff' : 'var(--text-secondary)',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontWeight: 600,
              width: '100%'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ background: '#818CF8', width: '12px', height: '12px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px' }}>🎫</span> Transport Hubs
            </span>
            {showHubs ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>

          <button
            onClick={() => setShowEmergency(!showEmergency)}
            style={{
              background: 'transparent',
              border: 'none',
              color: showEmergency ? '#ffffff' : 'var(--text-secondary)',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              fontWeight: 600,
              width: '100%'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ background: '#ff0055', width: '12px', height: '12px', borderRadius: '2px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px' }}>🚨</span> Emergency Services
            </span>
            {showEmergency ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>
        </div>
      </div>

      <MapContainer
        center={position}
        zoom={7}
        maxBounds={odishaBounds}
        maxBoundsViscosity={1.0}
        minZoom={7}
        zoomControl={true}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Selected custom route endpoints */}
        {source && (
          <Marker position={source.coords} icon={createPinIcon('var(--accent-color)')}>
            <Popup>
              <div style={{ color: '#0b1120', fontFamily: 'sans-serif', padding: '2px' }}>
                <strong style={{ display: 'block', fontSize: '12px' }}>Start Location</strong>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{source.name}</span>
              </div>
            </Popup>
          </Marker>
        )}

        {destination && (
          <Marker position={destination.coords} icon={createPinIcon('var(--traffic-heavy)')}>
            <Popup>
              <div style={{ color: '#0b1120', fontFamily: 'sans-serif', padding: '2px' }}>
                <strong style={{ display: 'block', fontSize: '12px' }}>Destination</strong>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{destination.name}</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Render calculated search routes */}
        {routes.map((route, idx) => {
          const isSelected = idx === selectedRouteIndex;
          return (
            <Polyline
              key={route.id}
              positions={route.path}
              color={isSelected ? 'var(--accent-color)' : '#334155'}
              opacity={isSelected ? 0.95 : 0.4}
              weight={isSelected ? 6 : 4}
              eventHandlers={{
                click: () => onSelectRoute(idx)
              }}
            >
              <Popup>
                <div style={{ color: '#0b1120', fontFamily: 'sans-serif', fontSize: '12px' }}>
                  <strong style={{ display: 'block', marginBottom: '2px' }}>{route.name}</strong>
                  <span>Distance: {route.distance} km</span><br/>
                  <span>Time: {route.duration} mins</span><br/>
                  <span style={{
                    color: route.trafficLevel === 'low' ? 'var(--traffic-low)' :
                           route.trafficLevel === 'medium' ? 'var(--traffic-medium)' : 'var(--traffic-heavy)',
                    fontWeight: 700
                  }}>Traffic: {route.trafficLevel.toUpperCase()}</span>
                </div>
              </Popup>
            </Polyline>
          );
        })}

        {/* Overlay 1: Highlighted Cities */}
        {showCities && ODISHA_CITIES.map(city => (
          <Marker key={city.name} position={city.coords as [number, number]} icon={createCityIcon(city.congestion)}>
            <Popup>
              <div style={{ color: '#0b1120', fontFamily: 'sans-serif', width: '200px' }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#050811' }}>{city.name}</h4>
                <p style={{ margin: '0 0 6px 0', fontSize: '11px', color: '#64748b' }}>{city.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', background: '#f8fafc', padding: '6px', borderRadius: '4px', marginBottom: '8px' }}>
                  <span>Traffic: <strong style={{
                    color: city.congestion === 'Heavy' ? 'var(--traffic-heavy)' :
                           city.congestion === 'Moderate' ? 'var(--traffic-medium)' : 'var(--traffic-low)'
                  }}>{city.congestion}</strong></span>
                  <span>Avg Speed: <strong>{city.trafficSpeed}</strong></span>
                </div>
                {onSelectSource && onSelectDestination && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <button
                      onClick={() => { onSelectSource(city.name); }}
                      style={{
                        background: '#0b1120', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '4px 6px', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer'
                      }}
                    >
                      Set Start
                    </button>
                    <button
                      onClick={() => { onSelectDestination(city.name); }}
                      style={{
                        background: 'var(--traffic-heavy)', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '4px 6px', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer'
                      }}
                    >
                      Set Dest
                    </button>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Overlay 2: Highway Corridors */}
        {showHighways && TRAFFIC_CORRIDORS.map(corridor => (
          <Polyline
            key={corridor.name}
            positions={corridor.path as [number, number][]}
            color={corridor.color}
            opacity={0.8}
            weight={4}
          >
            <Popup>
              <div style={{ color: '#0b1120', fontFamily: 'sans-serif', fontSize: '11px' }}>
                <strong style={{ display: 'block', fontSize: '12px' }}>{corridor.name}</strong>
                <span>Status: <strong>{corridor.status} Traffic</strong></span><br/>
                <span>Flow Speed: <strong>{corridor.speed}</strong></span>
              </div>
            </Popup>
          </Polyline>
        ))}

        {/* Overlay 3: Transit Routes */}
        {showTransit && PUBLIC_TRANSIT_ROUTES.map(route => (
          <Polyline
            key={route.name}
            positions={route.path as [number, number][]}
            color={route.color}
            opacity={0.8}
            weight={3.5}
            dashArray={route.dashArray}
          >
            <Popup>
              <div style={{ color: '#0b1120', fontFamily: 'sans-serif', fontSize: '11px' }}>
                <strong style={{ display: 'block', fontSize: '12px', color: '#0f172a' }}>{route.name}</strong>
                <span style={{ color: '#0284c7', fontWeight: 600 }}>Active Public Transit Corridor</span>
              </div>
            </Popup>
          </Polyline>
        ))}

        {/* Overlay 4: Smart Parking Hubs */}
        {showParking && SMART_PARKINGS.map(parkingSpot => (
          <Marker key={parkingSpot.name} position={parkingSpot.coords as [number, number]} icon={createParkingIcon()}>
            <Popup>
              <div style={{ color: '#0b1120', fontFamily: 'sans-serif', width: '180px' }}>
                <h4 style={{ margin: '0 0 2px 0', fontSize: '12px', color: '#0f172a' }}>{parkingSpot.name}</h4>
                <span style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '4px' }}>City: {parkingSpot.city}</span>
                <div style={{ fontSize: '11px', marginBottom: '6px' }}>
                  <span>Occupancy: <strong style={{
                    color: parkingSpot.availableSlots === 0 ? 'var(--traffic-heavy)' :
                           parkingSpot.availableSlots < 30 ? 'var(--traffic-medium)' : 'var(--traffic-low)'
                  }}>{parkingSpot.totalSlots - parkingSpot.availableSlots} / {parkingSpot.totalSlots}</strong> slots used</span><br/>
                  <span>Pricing: <strong>{parkingSpot.rate}</strong></span>
                </div>
                {onSelectDestination && (
                  <button
                    onClick={() => { onSelectDestination(parkingSpot.name); }}
                    style={{
                      width: '100%', background: '#00f0ff', color: '#050811', border: 'none', borderRadius: '4px', padding: '4px 6px', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer'
                    }}
                  >
                    Set Destination
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Overlay 5: Major Transport Hubs */}
        {showHubs && TRANSPORT_HUBS.map(hub => (
          <Marker key={hub.name} position={hub.coords as [number, number]} icon={createHubIcon(hub.type)}>
            <Popup>
              <div style={{ color: '#0b1120', fontFamily: 'sans-serif', width: '180px' }}>
                <h4 style={{ margin: '0 0 2px 0', fontSize: '12px', color: '#0f172a' }}>{hub.name}</h4>
                <span style={{ fontSize: '10px', color: '#64748b', display: 'block', marginBottom: '4px', textTransform: 'capitalize' }}>Type: {hub.type} Hub</span>
                <p style={{ fontSize: '11px', color: '#334155', margin: '0 0 6px 0' }}>{hub.details}</p>
                {onSelectDestination && (
                  <button
                    onClick={() => { onSelectDestination(hub.name); }}
                    style={{
                      width: '100%', background: '#818CF8', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '4px 6px', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer'
                    }}
                  >
                    Set Destination
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Overlay 6: Emergency Locations */}
        {showEmergency && EMERGENCY_LOCATIONS.map(loc => (
          <Marker key={loc.name} position={loc.coords as [number, number]} icon={createEmergencyIcon(loc.type)}>
            <Popup>
              <div style={{ color: '#0b1120', fontFamily: 'sans-serif', width: '180px' }}>
                <h4 style={{ margin: '0 0 2px 0', fontSize: '12px', color: '#0f172a' }}>{loc.name}</h4>
                <span style={{ fontSize: '10px', color: 'var(--traffic-heavy)', fontWeight: 600, display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>🚨 {loc.type}</span>
                <div style={{ fontSize: '11px', marginBottom: '6px' }}>
                  <span>City: <strong>{loc.city}</strong></span><br/>
                  {loc.phone && <span>Contact: <strong>{loc.phone}</strong></span>}
                  {loc.speed && <span>Charging: <strong>{loc.speed}</strong></span>}
                </div>
                {onSelectDestination && (
                  <button
                    onClick={() => { onSelectDestination(loc.name); }}
                    style={{
                      width: '100%', background: '#ff0055', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '4px 6px', fontSize: '9px', fontWeight: 'bold', cursor: 'pointer'
                    }}
                  >
                    Set Destination
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        <ChangeView bounds={bounds} />
      </MapContainer>
    </div>
  );
}
