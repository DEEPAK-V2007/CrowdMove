import { useEffect, useState } from 'react';
import { busApi, passengerApi, type Bus } from '../../api';
import { useSimulation } from '../../hooks/useSimulation';
import QrScanner from '../../components/QrScanner';
import CrowdBadge from '../../components/CrowdBadge';
import { Camera, CheckCircle, LogIn, LogOut, ScanLine, XCircle } from 'lucide-react';

type ScanResult = { success: boolean; message: string; fare: number } | null;

export default function ConductorScanner() {
  const { buses: wsBuses } = useSimulation();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [action, setAction] = useState<'board' | 'alight'>('board');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult>(null);
  const [processing, setProcessing] = useState(false);
  const [manualCard, setManualCard] = useState('');

  useEffect(() => {
    busApi.list(true).then(r => setBuses(r.data));
  }, []);

  useEffect(() => {
    if (wsBuses.length > 0) {
      const active = wsBuses.filter(b => b.is_active);
      setBuses(active);
      if (selectedBus) {
        const updated = active.find(b => b.id === selectedBus.id);
        if (updated) setSelectedBus(updated);
      }
    }
  }, [wsBuses]);

  const handleScan = async (cardNumber: string) => {
    if (!selectedBus || processing) return;
    setProcessing(true);
    setScanning(false);
    try {
      const res = await passengerApi.scan(cardNumber, selectedBus.id, action);
      setResult({ success: res.data.success, message: res.data.message, fare: res.data.fare });
      if (res.data.success) {
        setSelectedBus(prev => prev ? { ...prev, current_passengers: res.data.current_passengers } : null);
      }
    } catch {
      setResult({ success: false, message: 'Scan failed — try again', fare: 0 });
    } finally {
      setProcessing(false);
    }
  };

  const handleManualScan = () => {
    if (manualCard.trim()) {
      handleScan(manualCard.trim());
      setManualCard('');
    }
  };

  if (!selectedBus) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-blue-600 text-white px-4 py-4">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-2">
              <ScanLine className="w-6 h-6" />
              <h1 className="text-lg font-bold">Conductor Scanner</h1>
            </div>
            <p className="text-blue-200 text-sm mt-1">Select your bus to begin scanning</p>
          </div>
        </header>
        <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
          {buses.map(bus => (
            <button
              key={bus.id}
              onClick={() => setSelectedBus(bus)}
              className="w-full bg-white rounded-xl p-4 border text-left flex items-center justify-between hover:border-blue-300 transition-colors"
            >
              <div>
                <p className="font-semibold text-gray-900">{bus.bus_number}</p>
                <p className="text-sm text-gray-500">{bus.current_passengers}/{bus.total_capacity} passengers</p>
              </div>
              <CrowdBadge status={bus.crowd_status} />
            </button>
          ))}
          {buses.length === 0 && (
            <p className="text-center text-gray-400 py-8">No active buses</p>
          )}
        </div>
      </div>
    );
  }

  const occupancyPct = selectedBus.total_capacity > 0
    ? Math.round((selectedBus.current_passengers / selectedBus.total_capacity) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">{selectedBus.bus_number}</h1>
            <p className="text-blue-200 text-sm">
              {selectedBus.current_passengers}/{selectedBus.total_capacity} passengers · {occupancyPct}%
            </p>
          </div>
          <button onClick={() => { setSelectedBus(null); setResult(null); setScanning(false); }}
            className="text-sm bg-white/20 px-3 py-1.5 rounded-lg hover:bg-white/30">
            Change Bus
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Occupancy bar */}
        <div className="bg-white rounded-xl p-4 border">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Bus Occupancy</span>
            <CrowdBadge status={selectedBus.crowd_status} />
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                selectedBus.crowd_status === 'red' ? 'bg-red-500' :
                selectedBus.crowd_status === 'orange' ? 'bg-orange-500' :
                selectedBus.crowd_status === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(occupancyPct, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{selectedBus.current_passengers} onboard</span>
            <span>{selectedBus.total_capacity - selectedBus.current_passengers} remaining</span>
          </div>
        </div>

        {/* Action toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setAction('board')}
            className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors ${
              action === 'board' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border'
            }`}
          >
            <LogIn className="w-5 h-5" /> Board
          </button>
          <button
            onClick={() => setAction('alight')}
            className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors ${
              action === 'alight' ? 'bg-orange-600 text-white' : 'bg-white text-gray-600 border'
            }`}
          >
            <LogOut className="w-5 h-5" /> Alight
          </button>
        </div>

        {/* Scan result */}
        {result && (
          <div className={`rounded-xl p-4 flex items-center gap-3 ${
            result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            {result.success
              ? <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
              : <XCircle className="w-6 h-6 text-red-600 shrink-0" />
            }
            <div>
              <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                {result.message}
              </p>
              {result.fare > 0 && (
                <p className="text-sm text-green-600">Fare deducted: {'₹'}{result.fare.toFixed(2)}</p>
              )}
            </div>
            <button onClick={() => setResult(null)} className="ml-auto text-gray-400 hover:text-gray-600">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Camera scanner */}
        {scanning ? (
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="bg-gray-900 p-2 flex items-center justify-between">
              <span className="text-white text-sm flex items-center gap-1.5">
                <Camera className="w-4 h-4" /> Scanning...
              </span>
              <button onClick={() => setScanning(false)} className="text-gray-400 hover:text-white text-sm">
                Cancel
              </button>
            </div>
            <QrScanner active={scanning} onScan={handleScan} />
          </div>
        ) : (
          <button
            onClick={() => { setResult(null); setScanning(true); }}
            disabled={processing}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <Camera className="w-5 h-5" />
            {processing ? 'Processing...' : 'Scan QR Code'}
          </button>
        )}

        {/* Manual entry fallback */}
        <div className="bg-white rounded-xl p-4 border">
          <p className="text-sm text-gray-500 mb-2">Manual Card Entry</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualCard}
              onChange={e => setManualCard(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleManualScan()}
              placeholder="e.g. CM2024001"
              className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleManualScan}
              disabled={!manualCard.trim() || processing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {action === 'board' ? 'Board' : 'Alight'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
