import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Bus, NearbyStation } from '../api';
import { multimodalApi } from '../api';

const CHENNAI_CENTER: [number, number] = [13.0527, 80.2213];

function busIcon(status: string) {
  const color = status === 'red' ? '#ef4444' : status === 'orange' ? '#f97316' : status === 'yellow' ? '#eab308' : '#22c55e';
  return L.divIcon({
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
    html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="0"><path d="M4 16V6a4 4 0 014-4h8a4 4 0 014 4v10m-16 0h16m-16 0v2a1 1 0 001 1h2a1 1 0 001-1v-2m8 0v2a1 1 0 001 1h2a1 1 0 001-1v-2M8 6h8M8 10h8"/></svg>
    </div>`,
  });
}

function stationIcon(type: string) {
  const color = type === 'metro' ? '#2563eb' : '#16a34a';
  const label = type === 'metro' ? 'M' : 'S';
  return L.divIcon({
    className: '',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -14],
    html: `<div style="width:22px;height:22px;border-radius:4px;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700;">${label}</div>`,
  });
}

function MapUpdater({ buses }: { buses: Bus[] }) {
  const map = useMap();
  useEffect(() => {
    if (buses.length > 0) {
      const active = buses.filter(b => b.is_active && b.latitude !== 0);
      if (active.length > 0) {
        const bounds = L.latLngBounds(active.map(b => [b.latitude, b.longitude] as [number, number]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      }
    }
  }, []);
  return null;
}

interface Props {
  buses: Bus[];
  showStations?: boolean;
}

export default function BusMap({ buses, showStations = true }: Props) {
  const activeBuses = buses.filter(b => b.is_active && b.latitude !== 0);
  const [stations, setStations] = useState<NearbyStation[]>([]);

  useEffect(() => {
    if (showStations) {
      multimodalApi.stations().then(r => setStations(r.data)).catch(() => {});
    }
  }, [showStations]);

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: 420 }}>
      <MapContainer
        center={CHENNAI_CENTER}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater buses={activeBuses} />
        {activeBuses.map(bus => (
          <Marker
            key={bus.id}
            position={[bus.latitude, bus.longitude]}
            icon={busIcon(bus.crowd_status)}
          >
            <Popup>
              <div className="text-sm min-w-[140px]">
                <p className="font-bold">{bus.bus_number}</p>
                <p>{bus.current_passengers}/{bus.total_capacity} passengers</p>
                <p>Occupancy: {bus.occupancy_percent}%</p>
                <p>Stop index: {bus.current_stop_index}</p>
              </div>
            </Popup>
          </Marker>
        ))}
        {stations.map(s => (
          <Marker
            key={`station-${s.id}`}
            position={[s.latitude, s.longitude]}
            icon={stationIcon(s.station_type)}
          >
            <Popup>
              <div className="text-sm min-w-[120px]">
                <p className="font-bold">{s.name}</p>
                <p className="text-gray-500">{s.station_type === 'metro' ? 'Metro' : 'Suburban Rail'}</p>
                <p className="text-xs">{s.line}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
