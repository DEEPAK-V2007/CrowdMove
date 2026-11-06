import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, ArrowRight, Zap, Sparkles } from 'lucide-react';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@crowdmove.in');
  const [password, setPassword] = useState('test123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/admin');
    } catch {
      setError('Invalid Administrative Credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6">
      <div className="max-w-md mx-auto w-full my-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl shadow-lg shadow-blue-950 mb-3">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-widest">
              TN-ITIS Central Operations
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Admin Command Center Login</h1>
          <p className="text-xs text-slate-400 mt-1">
            Overall administrative clearance for fleet control, ML predictions, bunching prevention, and multi-portal oversight.
          </p>
        </div>

        {/* Security Clearance Notice */}
        <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-4 mb-4 shadow-lg text-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" /> Overall System Authority
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Role: MTC Central Transit Controller</p>
            </div>
            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/30 font-semibold">
              Root Clearance
            </span>
          </div>
        </div>

        {/* Sign In Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Administrator Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="admin@crowdmove.in"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Admin Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter admin password"
                required
              />
            </div>

            {error && <p className="text-red-400 text-xs font-medium">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-950 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              {loading ? 'Authenticating Clearance...' : 'Authenticate & Access Command Center'}
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
        Tamil Nadu Intelligent Transit Management System · Central Dispatch & Operations
      </footer>
    </div>
  );
}
