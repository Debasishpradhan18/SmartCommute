import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

interface MapViewProps {
  source: { name: string; coords: [number, number] } | null;
  destination: { name: string; coords: [number, number] } | null;
  routes: any[];
  selectedRouteIndex: number;
  onSelectRoute: (index: number) => void;
}

// Custom icons using inline style for 100% reliability
const createPinIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="
        background-color: ${color};
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 2px solid #FFFFFF;
        box-shadow: 0 0 10px rgba(0,0,0,0.5);
        position: relative;
      ">
        <div style="
          position: absolute;
          width: 6px;
          height: 6px;
          background-color: #FFFFFF;
          border-radius: 50%;
          top: 3px;
          left: 3px;
        "></div>
      </div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

// Component to dynamically fit the bounds of the map to the selected route
function ChangeView({ bounds }: { bounds: L.LatLngBoundsExpression | null }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14, animate: true, duration: 1.5 });
    }
  }, [bounds, map]);
  return null;
}

export default function MapView({
  source,
  destination,
  routes,
  selectedRouteIndex,
  onSelectRoute
}: MapViewProps) {
  const defaultPosition: [number, number] = [51.5074, -0.1278]; // London default

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
      <MapContainer
        center={source ? source.coords : defaultPosition}
        zoom={12}
        zoomControl={true}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        {/* OpenStreetMap TileLayer with standard carto dark-matter tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {source && (
          <Marker position={source.coords} icon={createPinIcon('var(--traffic-low)')}>
            <Popup>
              <div style={{ color: '#000000', fontWeight: 600 }}>Start: {source.name}</div>
            </Popup>
          </Marker>
        )}

        {destination && (
          <Marker position={destination.coords} icon={createPinIcon('var(--traffic-heavy)')}>
            <Popup>
              <div style={{ color: '#000000', fontWeight: 600 }}>Destination: {destination.name}</div>
            </Popup>
          </Marker>
        )}

        {/* Render all routes. Selected route will be highlighted thicker */}
        {routes.map((route, idx) => {
          const isSelected = idx === selectedRouteIndex;
          return (
            <Polyline
              key={route.id}
              positions={route.path}
              color={isSelected ? route.trafficColor : '#4B5563'}
              opacity={isSelected ? 0.95 : 0.4}
              weight={isSelected ? 6 : 4}
              eventHandlers={{
                click: () => onSelectRoute(idx)
              }}
            >
              <Popup>
                <div style={{ color: '#000000', fontFamily: 'sans-serif' }}>
                  <strong style={{ display: 'block', marginBottom: '2px' }}>{route.name}</strong>
                  <span>Distance: {route.distance} km</span><br/>
                  <span>Time: {route.duration} mins ({route.trafficLevel} traffic)</span>
                </div>
              </Popup>
            </Polyline>
          );
        })}

        <ChangeView bounds={bounds} />
      </MapContainer>
    </div>
  );
}
