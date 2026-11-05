import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../context/AuthContext';
import { busApi, passengerApi, multimodalApi, type Bus, type SmartCard, type Transaction, type BusAlternatives } from '../../api';
import { useSimulation } from '../../hooks/useSimulation';
import CrowdBadge from '../../components/CrowdBadge';
import { showToast } from '../../components/Toast';
import { CreditCard, History, LogOut, MapPin, Plus, RefreshCw, Train, Footprints, Wallet } from 'lucide-react';

export default function PassengerDashboard() {
  const { user, logout } = useAuth();
  const { buses: wsBuses } = useSimulation();
  const [card, setCard] = useState<SmartCard | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [tab, setTab] = useState<'card' | 'buses' | 'history'>('card');
  const [rechargeAmt, setRechargeAmt] = useState('');
  const [rechargeMsg, setRechargeMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [recharging, setRecharging] = useState(false);
  const [alternatives, setAlternatives] = useState<Record<number, BusAlternatives>>({});
  const [loadingAlts, setLoadingAlts] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    loadCard();
    busApi.list(true).then(r => setBuses(r.data));
  }, [user]);

  const loadCard = () => {
    if (!user) return;
    passengerApi.getCard(user.id).then(r => {
      setCard(r.data);
      passengerApi.getTransactions(r.data.id).then(t => setTransactions(t.data));
    });
  };

  useEffect(() => {
    if (wsBuses.length > 0) setBuses(wsBuses.filter(b => b.is_active));
  }, [wsBuses]);

  const refresh = () => {
    loadCard();
    busApi.list(true).then(r => setBuses(r.data));
    showToast('info', 'Refreshed');
  };

  const handleRecharge = async () => {
    if (!card || !rechargeAmt) return;
    const amt = parseFloat(rechargeAmt);
    if (isNaN(amt) || amt <= 0 || amt > 5000) {
      setRechargeMsg({ ok: false, text: 'Enter an amount between 1 and 5000' });
      return;
    }
    setRecharging(true);
    setRechargeMsg(null);
    try {
      const res = await passengerApi.recharge(card.card_number, amt);
      setCard(prev => prev ? { ...prev, balance: res.data.new_balance } : null);
      setRechargeMsg({ ok: true, text: `Recharged ₹${amt.toFixed(2)} successfully` });
      setRechargeAmt('');
      showToast('success', `₹${amt.toFixed(2)} added to your card`);
      loadCard();
    } catch {
      setRechargeMsg({ ok: false, text: 'Recharge failed' });
      showToast('error', 'Recharge failed');
    } finally {
      setRecharging(false);
    }
  };

  const fetchAlternatives = async (busId: number) => {
    if (alternatives[busId]) {
      setAlternatives(prev => { const copy = { ...prev }; delete copy[busId]; return copy; });
      return;
    }
    setLoadingAlts(busId);
    try {
      const res = await multimodalApi.forBus(busId);
      setAlternatives(prev => ({ ...prev, [busId]: res.data }));
    } catch { /* ignore */ }
    setLoadingAlts(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">CrowdMove</h1>
            <p className="text-xs text-gray-500">Welcome, {user?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refresh} className="p-2 text-gray-500 hover:text-blue-600 transition-colors">
              <RefreshCw className="w-5 h-5" />
            </button>
            <button onClick={logout} className="p-2 text-gray-500 hover:text-red-600 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="flex gap-2 mb-4">
          {[
            { key: 'card' as const, label: 'Smart Card', icon: CreditCard },
            { key: 'buses' as const, label: 'Live Buses', icon: RefreshCw },
            { key: 'history' as const, label: 'History', icon: History },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-all ${
                tab === t.key ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 border hover:bg-gray-50'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'card' && card && (
          <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
            {/* Smart Card */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-blue-200 text-xs uppercase tracking-wider">CrowdMove Transit Card</p>
                  <p className="text-lg font-bold mt-1">{card.passenger.name}</p>
                </div>
                <div className="bg-white/20 rounded-lg px-3 py-1 text-sm">
                  {card.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>
              <p className="text-2xl font-mono tracking-widest mb-6">{card.card_number}</p>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-blue-200 text-xs">Balance</p>
                  <p className="text-3xl font-bold">{'₹'}{card.balance.toFixed(2)}</p>
                </div>
                <div className="text-right text-sm text-blue-200">
                  ID: {card.passenger.id}
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="bg-white rounded-xl p-6 border text-center">
              <p className="text-sm text-gray-500 mb-4">Show this QR to the conductor</p>
              <div className="inline-block bg-white p-4 rounded-xl shadow-sm border">
                <QRCodeSVG
                  value={card.card_number}
                  size={180}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <p className="text-xs text-gray-400 mt-3 font-mono">{card.card_number}</p>
            </div>

            {/* Recharge */}
            <div className="bg-white rounded-xl p-4 border">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-4 h-4 text-blue-600" />
                <p className="text-sm font-semibold text-gray-900">Recharge Card</p>
              </div>
              <div className="flex gap-2 mb-2">
                {[100, 200, 500].map(amt => (
                  <button
                    key={amt}
                    onClick={() => setRechargeAmt(String(amt))}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                      rechargeAmt === String(amt)
                        ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {'₹'}{amt}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={rechargeAmt}
                  onChange={e => setRechargeAmt(e.target.value)}
                  placeholder="Custom amount"
                  className="flex-1 px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleRecharge}
                  disabled={!rechargeAmt || recharging}
                  className="px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" /> {recharging ? '...' : 'Recharge'}
                </button>
              </div>
              {rechargeMsg && (
                <p className={`text-sm mt-2 ${rechargeMsg.ok ? 'text-green-600' : 'text-red-600'}`}>
                  {rechargeMsg.text}
                </p>
              )}
            </div>
          </div>
        )}

        {tab === 'buses' && (
          <div className="space-y-3 animate-[fadeIn_0.3s_ease-out]">
            {buses.map(bus => {
              const isFull = bus.crowd_status === 'red' || bus.crowd_status === 'orange';
              const alt = alternatives[bus.id];
              return (
                <div key={bus.id} className="bg-white rounded-xl border overflow-hidden transition-all">
                  <div className={`p-4 flex items-center justify-between ${
                    bus.crowd_status === 'red' ? 'ring-2 ring-red-300 rounded-xl' : ''
                  }`}>
                    <div>
                      <p className="font-semibold text-gray-900">{bus.bus_number}</p>
                      <p className="text-sm text-gray-500">
                        {bus.current_passengers}/{bus.total_capacity} passengers
                      </p>
                      <div className="w-24 bg-gray-200 rounded-full h-1.5 mt-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-700 ${
                            bus.crowd_status === 'red' ? 'bg-red-500' :
                            bus.crowd_status === 'orange' ? 'bg-orange-500' :
                            bus.crowd_status === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(bus.occupancy_percent, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <CrowdBadge status={bus.crowd_status} />
                      <span className="text-xs text-gray-400">{bus.occupancy_percent}%</span>
                    </div>
                  </div>

                  {/* Show alternatives button for crowded buses */}
                  {isFull && (
                    <div className="border-t">
                      <button
                        onClick={() => fetchAlternatives(bus.id)}
                        disabled={loadingAlts === bus.id}
                        className="w-full px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 flex items-center justify-center gap-2 transition-colors"
                      >
                        <Train className="w-4 h-4" />
                        {loadingAlts === bus.id ? 'Finding alternatives...' :
                         alt ? 'Hide alternatives' : 'Show nearby Metro/Rail'}
                      </button>

                      {alt && alt.alternatives.length > 0 && (
                        <div className="px-4 pb-3 space-y-2 animate-[fadeIn_0.2s_ease-out]">
                          <p className="text-xs text-orange-600 font-medium">{alt.suggestion}</p>
                          {alt.alternatives.map(station => (
                            <div key={station.id} className="flex items-center gap-3 bg-blue-50 rounded-lg p-3">
                              <div className={`p-1.5 rounded-lg ${
                                station.station_type === 'metro' ? 'bg-blue-100' : 'bg-green-100'
                              }`}>
                                <Train className={`w-4 h-4 ${
                                  station.station_type === 'metro' ? 'text-blue-600' : 'text-green-600'
                                }`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">{station.name}</p>
                                <p className="text-xs text-gray-500">{station.line}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Footprints className="w-3 h-3" />
                                  {station.distance_km} km
                                </div>
                                <p className="text-xs font-medium text-blue-600">
                                  ~{station.walk_minutes} min walk
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {alt && alt.alternatives.length === 0 && (
                        <div className="px-4 pb-3">
                          <p className="text-xs text-gray-400 text-center">No nearby metro/rail stations found</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {buses.length === 0 && (
              <div className="text-center py-12">
                <div className="animate-spin w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-gray-400">Loading buses...</p>
              </div>
            )}
          </div>
        )}

        {tab === 'history' && (
          <div className="space-y-2 animate-[fadeIn_0.3s_ease-out]">
            {transactions.map(txn => (
              <div key={txn.id} className="bg-white rounded-xl p-4 border flex items-center justify-between transition-all hover:shadow-sm">
                <div>
                  <p className="text-sm font-medium text-gray-900">{txn.description}</p>
                  <p className="text-xs text-gray-400">{new Date(txn.created_at).toLocaleString()}</p>
                </div>
                <p className={`font-semibold ${txn.type === 'debit' ? 'text-red-600' : 'text-green-600'}`}>
                  {txn.type === 'debit' ? '-' : '+'}{'₹'}{txn.amount.toFixed(2)}
                </p>
              </div>
            ))}
            {transactions.length === 0 && (
              <p className="text-center text-gray-400 py-8">No transactions yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
