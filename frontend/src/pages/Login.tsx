import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bus, ScanLine, Shield, User } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@crowdmove.in', password: 'test123', icon: Shield, color: 'bg-purple-600' },
  { label: 'Driver', email: 'rajesh@crowdmove.in', password: 'test123', icon: Bus, color: 'bg-blue-600' },
  { label: 'Passenger', email: 'priya@gmail.com', password: 'test123', icon: User, color: 'bg-green-600' },
];

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (em: string, pw: string) => {
    setError('');
    setLoading(true);
    try {
      await login(em, pw);
    } catch {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <Bus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">CrowdMove</h1>
          <p className="text-blue-300 mt-2">Intelligent Transit Management System</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/10 mb-6">
          <h2 className="text-white font-semibold mb-4">Quick Demo Login</h2>
          <div className="grid grid-cols-3 gap-3">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.label}
                onClick={() => quickLogin(acc.email, acc.password)}
                disabled={loading}
                className={`${acc.color} hover:opacity-90 text-white rounded-xl p-4 flex flex-col items-center gap-2 transition-all disabled:opacity-50`}
              >
                <acc.icon className="w-6 h-6" />
                <span className="text-sm font-medium">{acc.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-blue-200 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-lg text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter email"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-blue-200 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-lg text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter password"
                required
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <Link
          to="/scanner"
          className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-2xl font-medium transition-colors"
        >
          <ScanLine className="w-5 h-5" />
          Open Conductor Scanner
        </Link>
      </div>
    </div>
  );
}
