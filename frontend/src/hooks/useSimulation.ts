import { useEffect, useRef, useState, useCallback } from 'react';
import type { Bus, DashboardStats, PredictionsData } from '../api';

interface SimState {
  running: boolean;
  speed: number;
  tick_count: number;
  festival_mode: string | null;
  festival_multiplier: number;
}

interface AlertEvent {
  type: string;
  severity: string;
  message: string;
  bus_id?: number;
}

interface UseSimulationReturn {
  buses: Bus[];
  stats: DashboardStats | null;
  simState: SimState;
  alerts: AlertEvent[];
  predictions: PredictionsData | null;
  connected: boolean;
}

export function useSimulation(): UseSimulationReturn {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [simState, setSimState] = useState<SimState>({
    running: false, speed: 1, tick_count: 0, festival_mode: null, festival_multiplier: 1.0,
  });
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [predictions, setPredictions] = useState<PredictionsData | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        switch (msg.event) {
          case 'buses_update':
            setBuses(msg.data);
            break;
          case 'stats_update':
            setStats(msg.data);
            break;
          case 'sim_state':
            setSimState(msg.data);
            break;
          case 'alert':
            setAlerts(prev => [msg.data, ...prev].slice(0, 50));
            break;
          case 'predictions_update':
            setPredictions(msg.data);
            break;
        }
      } catch { /* ignore parse errors */ }
    };

    ws.onclose = () => {
      setConnected(false);
      reconnectTimer.current = setTimeout(connect, 2000);
    };

    ws.onerror = () => ws.close();

    wsRef.current = ws;
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { buses, stats, simState, alerts, predictions, connected };
}
