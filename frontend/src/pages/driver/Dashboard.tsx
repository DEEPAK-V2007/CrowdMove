import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { busApi, type Bus } from '../../api';
import { useSimulation } from '../../hooks/useSimulation';
import CrowdBadge from '../../components/CrowdBadge';
import { AlertTriangle, ArrowRight, LogOut, MapPin, Navigation, RefreshCw, Users } from 'lucide-react';

interface StopInfo {
  id: number;
  name: string;
  stop_order: number;
  estimated_waiting: number;
}

interface RouteInfo {
  route_number: string;
  name: string;
  source: string;
  destination: string;
}

interface DriverBus extends Bus {
  route_info?: RouteInfo;
  stops?: StopInfo[];
}

export default function DriverDashboard() {
  const { user, logout } = useAuth();
  const { buses: wsBuses } = useSimulation();
  const [bus, setBus] = useState<DriverBus | null>(null);
  const [driverBusId, setDriverBusId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const alertPlayed = useRef(false);

  const fetchBus = () => {
    if (!user) return;
    busApi.byDriver(user.id)
      .then(r => { setBus(r.data as DriverBus); setDriverBusId(r.data.id); })
      .catch(() => setError('No bus assigned'));
  };

  useEffect(() => {
    fetchBus();
  }, [user]);

  // Merge WebSocket updates into bus state while keeping route_info and stops
  useEffect(() => {
    if (driverBusId && wsBuses.length > 0) {
      const found = wsBuses.find(b => b.id === driverBusId);
      if (found) {
        setBus(prev => ({
          ...found,
          route_info: prev?.route_info,
          stops: prev?.stops,
        }));
      }
    }
  }, [wsBuses, driverBusId]);

  // Re-fetch full bus detail periodically for updated stop waiting counts
  useEffect(() => {
    if (!driverBusId) return;
    const interval = setInterval(() => {
      busApi.byDriver(user!.id).then(r => {
        const data = r.data as DriverBus;
        setBus(prev => prev ? { ...prev, route_info: data.route_info, stops: data.stops } : data);
      }).catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [driverBusId, user]);

  useEffect(() => {
    if (bus && bus.occupancy_percent >= 90 && !alertPlayed.current) {
      alertPlayed.current = true;
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 880;
        gain.gain.value = 0.3;
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        setTimeout(() => { osc.frequency.value = 660; }, 200);
        setTimeout(() => { osc.frequency.value = 880; }, 400);
        setTimeout(() => { osc.stop(); ctx.close(); }, 600);
      } catch { /* audio may not be available */ }
    }
    if (bus && bus.occupancy_percent < 90) {
      alertPlayed.current = false;
    }
  }, [bus]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">{error}</p>
          <button onClick={logout} className="text-blue-400 underline">Logout</button>
        </div>
      </div>
    );
  }

  if (!bus) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const remaining = bus.total_capacity - bus.current_passengers;
  const isCritical = bus.occupancy_percent >= 90;
  const isWarning = bus.occupancy_percent >= 75;
  const stops = bus.stops || [];
  const currentStop = stops[bus.current_stop_index];
  const nextStop = stops[bus.current_stop_index + 1];
  const strokeColor = isCritical ? '#ef4444' : bus.crowd_status === 'orange' ? '#f97316' : bus.crowd_status === 'yellow' ? '#eab308' : '#22c55e';

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isCritical ? 'bg-red-950' : 'bg-slate-900'}`}>
      {/* Header */}
      <header className="px-4 py-3 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isCritical ? 'bg-red-600' : 'bg-blue-600'}`}>
            <Navigation className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">{bus.bus_number}</h1>
            {bus.route_info && (
              <p className="text-xs text-gray-400">
                Route {bus.route_info.route_number} · {bus.route_info.source} → {bus.route_info.destination}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchBus} className="p-2 text-gray-400 hover:text-white">
            <RefreshCw className="w-5 h-5" />
          </button>
          <button onClick={logout} className="p-2 text-gray-400 hover:text-red-400">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Critical alert banner */}
      {isCritical && (
        <div className="bg-red-600 px-4 py-3 flex items-center gap-3 animate-pulse">
          <AlertTriangle className="w-6 h-6 text-white shrink-0" />
          <p className="text-white font-bold">CAPACITY REACHED — No more boarding</p>
        </div>
      )}

      <div className="px-4 py-5 space-y-5 max-w-lg mx-auto">
        {/* Occupancy gauge */}
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center w-44 h-44">
            <svg className="w-44 h-44 -rotate-90" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" />
              <circle cx="100" cy="100" r="85" fill="none"
                stroke={strokeColor}
                strokeWidth="14" strokeLinecap="round"
                strokeDasharray={`${(bus.occupancy_percent / 100) * 534} 534`}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute text-center">
              <p className="text-4xl font-bold text-white">{bus.occupancy_percent}%</p>
              <CrowdBadge status={bus.crowd_status} />
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Onboard', value: bus.current_passengers, icon: <Users className="w-4 h-4 text-blue-400" /> },
            { label: 'Capacity', value: bus.total_capacity, icon: null },
            { label: 'Remaining', value: remaining, icon: null },
            { label: 'Seated', value: bus.seated_capacity, icon: null },
          ].map((s, i) => (
            <div key={i} className="bg-white/5 rounded-xl p-3 border border-white/10 text-center">
              {s.icon && <div className="flex justify-center mb-1">{s.icon}</div>}
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Boarding stats bar */}
        <div className="bg-white/5 rounded-xl p-3 border border-white/10">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Boarded: <span className="text-green-400 font-semibold">{bus.boarded_count}</span></span>
            <span>Alighted: <span className="text-orange-400 font-semibold">{bus.alighted_count}</span></span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-700 ${
                isCritical ? 'bg-red-500' : isWarning ? 'bg-orange-500' : bus.crowd_status === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(bus.occupancy_percent, 100)}%` }}
            />
          </div>
        </div>

        {/* Current & next stop */}
        {currentStop && (
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-1 pt-1">
                <div className={`w-3 h-3 rounded-full ${isCritical ? 'bg-red-500' : 'bg-blue-500'} ring-2 ring-white/20`} />
                {nextStop && <div className="w-0.5 h-8 bg-white/20" />}
                {nextStop && <div className="w-3 h-3 rounded-full bg-white/20" />}
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Current Stop</p>
                  <p className="text-white font-semibold">{currentStop.name}</p>
                  {currentStop.estimated_waiting > 0 && (
                    <p className="text-xs text-yellow-400 mt-0.5">
                      ~{currentStop.estimated_waiting} waiting
                    </p>
                  )}
                </div>
                {nextStop && (
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Next Stop</p>
                    <p className="text-gray-300 font-medium">{nextStop.name}</p>
                    {nextStop.estimated_waiting > 0 && (
                      <p className="text-xs text-yellow-400 mt-0.5">
                        ~{nextStop.estimated_waiting} expected to board
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Route progress */}
        {stops.length > 0 && (
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Route Progress</p>
              <p className="text-xs text-gray-400">
                Stop {bus.current_stop_index + 1} of {stops.length}
              </p>
            </div>
            <div className="flex items-center gap-0.5">
              {stops.map((stop, i) => {
                const isPast = i < bus.current_stop_index;
                const isCurrent = i === bus.current_stop_index;
                const hasWaiting = stop.estimated_waiting > 0;
                return (
                  <div key={stop.id} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`w-full h-1.5 rounded-full transition-all duration-500 ${
                      isPast ? 'bg-blue-500' :
                      isCurrent ? (isCritical ? 'bg-red-500' : 'bg-blue-400') :
                      hasWaiting ? 'bg-yellow-600/50' : 'bg-white/10'
                    }`} />
                    {(isCurrent || i === 0 || i === stops.length - 1) && (
                      <p className={`text-[8px] truncate max-w-full ${
                        isCurrent ? 'text-white font-semibold' : 'text-gray-500'
                      }`}>
                        {stop.name.length > 10 ? stop.name.slice(0, 10) + '…' : stop.name}
                      </p>
                    )}
                    {hasWaiting && !isPast && (
                      <p className="text-[8px] text-yellow-400">{stop.estimated_waiting}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Next stop demand warning */}
        {nextStop && nextStop.estimated_waiting > 0 && (
          <div className={`rounded-xl p-3 border flex items-center gap-3 ${
            remaining < nextStop.estimated_waiting
              ? 'bg-red-500/10 border-red-500/30'
              : 'bg-yellow-500/10 border-yellow-500/30'
          }`}>
            <MapPin className={`w-5 h-5 shrink-0 ${
              remaining < nextStop.estimated_waiting ? 'text-red-400' : 'text-yellow-400'
            }`} />
            <div>
              <p className={`text-sm font-medium ${
                remaining < nextStop.estimated_waiting ? 'text-red-300' : 'text-yellow-300'
              }`}>
                {remaining < nextStop.estimated_waiting
                  ? `Cannot accommodate all ${nextStop.estimated_waiting} waiting at ${nextStop.name}`
                  : `${nextStop.estimated_waiting} passengers expected at ${nextStop.name}`
                }
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {remaining} seats remaining
                {remaining < nextStop.estimated_waiting && (
                  <span> · {nextStop.estimated_waiting - remaining} may be left behind</span>
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
