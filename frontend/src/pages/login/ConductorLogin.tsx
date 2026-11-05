import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Camera, ScanLine, ArrowRight, Zap, Smartphone, KeyRound } from 'lucide-react';

export default function ConductorLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('conductor@crowdmove.in');
  const [password, setPassword] = useState('test123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(identifier, password);
      navigate('/scanner');
    } catch {
      setError('Invalid Operator Badge ID or Terminal PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6">
      <div className="max-w-md mx-auto w-full my-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-cyan-600 to-teal-500 rounded-2xl shadow-lg shadow-cyan-950 mb-3">
            <ScanLine className="w-7 h-7 text-white" />
          </div>
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-widest">
              Electronic Ticketing Machine (ETM)
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Conductor Terminal Login</h1>
          <p className="text-xs text-slate-400 mt-1">
            Sign in to start contactless smart card validations, QR scans, and fare collection.
          </p>
        </div>

        {/* Device Clearance Badge Card */}
        <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-4 mb-4 shadow-lg text-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-white flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-cyan-400" /> Authorized Terminal: ETM-POS-AY-01
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Operator: Deepa Krishnan (Badge #OP-9821)</p>
            </div>
            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30 font-semibold">
              Ready
            </span>
          </div>
        </div>

        {/* Sign In Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Operator Badge ID or Email
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="e.g. conductor@crowdmove.in or OP-9821"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Terminal PIN / Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Enter terminal PIN"
                required
              />
            </div>

            {error && <p className="text-red-400 text-xs font-medium">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-cyan-950 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              {loading ? 'Authorizing Handheld Terminal...' : 'Sign In to Conductor Scanner'}
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
        Tamil Nadu State Transport Corporation · Onboard Electronic Ticketing Device
      </footer>
    </div>
  );
}

