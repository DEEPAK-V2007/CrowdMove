import { useState, useEffect } from 'react';
import { simulationApi, dashboardApi, type Festival } from '../api';
import { Pause, Play, RotateCcw, Zap, Gauge, PartyPopper } from 'lucide-react';

interface Props {
  simState: { running: boolean; speed: number; tick_count: number; festival_mode: string | null };
  connected: boolean;
}

export default function SimControls({ simState, connected }: Props) {
  const [festivals, setFestivals] = useState<Festival[]>([]);

  useEffect(() => {
    dashboardApi.festivals().then(r => setFestivals(r.data));
  }, []);

  const speeds = [0.5, 1, 2, 3, 5];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">Simulation Engine</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-400'}`} />
          <span className="text-xs text-gray-500">{connected ? 'Live' : 'Disconnected'}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        {simState.running ? (
          <button onClick={() => simulationApi.stop()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors">
            <Pause className="w-3.5 h-3.5" /> Pause
          </button>
        ) : (
          <button onClick={() => simulationApi.start()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors">
            <Play className="w-3.5 h-3.5" /> Start
          </button>
        )}
        <button onClick={() => simulationApi.reset()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors border border-gray-300">
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
        <div className="ml-auto flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 text-yellow-600" />
          {speeds.map(s => (
            <button key={s} onClick={() => simulationApi.setSpeed(s)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                simState.speed === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-500 hover:text-gray-900 border border-gray-200'
              }`}>
              {s}x
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span>Tick: {simState.tick_count}</span>
        <span className="text-gray-300">|</span>
        <span>Speed: {simState.speed}x</span>
        {simState.festival_mode && (
          <>
            <span className="text-gray-300">|</span>
            <span className="text-yellow-600 flex items-center gap-1">
              <PartyPopper className="w-3 h-3" /> {simState.festival_mode}
            </span>
          </>
        )}
      </div>

      {festivals.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Festival Mode</p>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => simulationApi.activateFestival(0)}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                !simState.festival_mode
                  ? 'bg-gray-200 text-gray-900 font-medium'
                  : 'bg-gray-100 text-gray-500 hover:text-gray-900 border border-gray-200'
              }`}>
              Normal
            </button>
            {festivals.map(f => (
              <button key={f.id} onClick={() => simulationApi.activateFestival(f.id)}
                className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                  simState.festival_mode === f.name
                    ? 'bg-yellow-500 text-white font-medium'
                    : 'bg-gray-100 text-gray-500 hover:text-gray-900 border border-gray-200'
                }`}>
                {f.name} ({f.demand_multiplier}x)
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
