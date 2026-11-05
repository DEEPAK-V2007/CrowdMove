import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, Bus, ArrowRight, ShieldCheck, Zap, User } from 'lucide-react';

const DEMO_COMMUTERS = [
  { name: 'Priya Muthukumar', card: 'TN-MTC-2026-0001', email: 'priya@gmail.com', passType: 'General Commuter Pass' },
  { name: 'Arun Karthik', card: 'TN-MTC-2026-0002', email: 'arun@gmail.com', passType: 'Daily Smart Pass' },
  { name: 'Divya Sundaram', card: 'TN-MTC-2026-0003', email: 'divya@gmail.com', passType: 'Student Subsidized Pass' },
];

export default function PassengerLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('TN-MTC-2026-0001');
  const [password, setPassword] = useState('test123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(identifier, password);
      navigate('/passenger');
    } catch {
      setError('Invalid Smart Card Number, Email, or Password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (commuter: typeof DEMO_COMMUTERS[0]) => {
    setIdentifier(commuter.card);
    setPassword('test123');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6">
      <div className="max-w-md mx-auto w-full my-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl shadow-lg shadow-emerald-950 mb-3">
            <CreditCard className="w-7 h-7 text-white" />
          </div>
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">
              Govt. of Tamil Nadu · MTC
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Commuter Smart Pass Login</h1>
          <p className="text-xs text-slate-400 mt-1">
            Access your prepaid travel wallet, QR boarding pass, and live bus occupancy.
          </p>
        </div>

        {/* Demo Commuter Quick Selector */}
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 mb-4 shadow-lg">
          <p className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" /> Demo Commuter Accounts:
          </p>
          <div className="space-y-1.5">
            {DEMO_COMMUTERS.map((c) => (
              <button
                key={c.card}
                type="button"
                onClick={() => handleQuickSelect(c)}
                className={`w-full px-3 py-2 rounded-xl text-left text-xs transition-all flex items-center justify-between border ${
                  identifier === c.card
                    ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <div>
                  <span className="font-semibold text-white">{c.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono ml-2">({c.card})</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-medium">{c.passType}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sign In Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Smart Card Number or Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. TN-MTC-2026-0001 or priya@gmail.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Account Password / PIN
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Enter password"
                required
              />
            </div>

            {error && <p className="text-red-400 text-xs font-medium">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              {loading ? 'Validating Smart Pass...' : 'Sign In to Commuter Portal'}
              <ArrowRight className="w-4 h-4 ml-auto" />
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <Link to="/login" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            ← Switch to Transit Portal Gateway
          </Link>
        </div>
      </div>

      <footer className="text-center text-[11px] text-slate-600 mt-4">
        Tamil Nadu State Transport Corporation · Passenger Self-Service Portal
      </footer>
    </div>
  );
}

