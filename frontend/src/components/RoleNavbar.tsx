import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Camera, CreditCard, LogOut, Navigation, Shield, User, Crown } from 'lucide-react';

export default function RoleNavbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isAdmin = user?.role === 'admin';

  // Navigation items exclusively available to the Master Administrator
  const adminNavItems = [
    {
      to: '/admin',
      label: 'Admin Command Center',
      icon: Shield,
      activeColor: 'bg-blue-600/30 text-blue-300 border-blue-500/50',
    },
    {
      to: '/passenger',
      label: 'Passenger Smart Pass',
      icon: CreditCard,
      activeColor: 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50',
    },
    {
      to: '/scanner',
      label: 'Conductor Scanner',
      icon: Camera,
      activeColor: 'bg-cyan-600/30 text-cyan-300 border-cyan-500/50',
    },
    {
      to: '/driver',
      label: 'Driver HUD',
      icon: Navigation,
      activeColor: 'bg-amber-600/30 text-amber-300 border-amber-500/50',
    },
  ];

  // 1. MASTER ADMINISTRATOR VIEW: Full overall access across all subsystems
  if (isAdmin) {
    return (
      <nav className="bg-slate-900/95 backdrop-blur border-b border-blue-900/40 px-4 py-2 text-xs sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 overflow-x-auto">
          {/* Admin Identity Badge */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-1.5 rounded-lg text-white shadow-sm">
              <Crown className="w-4 h-4 text-yellow-300" />
            </div>
            <div>
              <span className="font-bold text-white text-sm tracking-wide">CrowdMove</span>
              <span className="text-[10px] text-yellow-300 ml-1.5 font-bold px-1.5 py-0.5 bg-yellow-950/80 rounded border border-yellow-700/60">
                MASTER ADMIN ACCESS
              </span>
            </div>
          </div>

          {/* Master Admin Subsystem Switcher Tabs */}
          <div className="flex items-center gap-1.5 shrink-0">
            {adminNavItems.map((item) => {
              const isActive = location.pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 border ${
                    isActive
                      ? item.activeColor
                      : 'bg-slate-800/80 text-slate-300 border-slate-700/60 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User & Logout */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-blue-950/60 rounded-lg border border-blue-800/50 text-slate-300">
              <User className="w-3 h-3 text-blue-400" />
              <span className="font-semibold text-white">{user?.name}</span>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 bg-slate-800 hover:bg-red-950/60 hover:text-red-400 text-slate-400 rounded-lg border border-slate-700 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>
    );
  }

  // 2. PASSENGER VIEW: Clean commuter header with ZERO mentions of driver or admin
  if (user?.role === 'passenger') {
    return (
      <nav className="bg-slate-900/95 backdrop-blur border-b border-emerald-900/30 px-4 py-2 text-xs sticky top-0 z-50 shadow-md">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 p-1.5 rounded-lg text-white">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white text-sm">MTC Smart Pass</span>
              <span className="text-[10px] text-emerald-400 ml-1.5 font-medium px-1.5 py-0.5 bg-emerald-950 rounded border border-emerald-800">
                Commuter Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 font-medium hidden sm:inline">
              {user.name}
            </span>
            <button
              onClick={logout}
              title="Logout"
              className="px-2.5 py-1 bg-slate-800 hover:bg-red-950 hover:text-red-400 text-slate-400 rounded-lg border border-slate-700 transition-colors flex items-center gap-1 text-[11px]"
            >
              <LogOut className="w-3 h-3" /> Logout
            </button>
          </div>
        </div>
      </nav>
    );
  }

  // 3. DRIVER VIEW: Cockpit instrument header with ZERO mentions of passenger or admin
  if (user?.role === 'driver') {
    return (
      <nav className="bg-slate-900/95 backdrop-blur border-b border-amber-900/30 px-4 py-2 text-xs sticky top-0 z-50 shadow-md">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="bg-amber-600 p-1.5 rounded-lg text-white">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white text-sm">MTC Driver HUD</span>
              <span className="text-[10px] text-amber-400 ml-1.5 font-medium px-1.5 py-0.5 bg-amber-950 rounded border border-amber-800">
                In-Cab Console
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 font-medium hidden sm:inline">
              Driver: {user.name}
            </span>
            <button
              onClick={logout}
              title="Logout"
              className="px-2.5 py-1 bg-slate-800 hover:bg-red-950 hover:text-red-400 text-slate-400 rounded-lg border border-slate-700 transition-colors flex items-center gap-1 text-[11px]"
            >
              <LogOut className="w-3 h-3" /> Logout
            </button>
          </div>
        </div>
      </nav>
    );
  }

  // 4. CONDUCTOR OR GUEST VIEW: ETM terminal header
  return (
    <nav className="bg-slate-900/95 backdrop-blur border-b border-cyan-900/30 px-4 py-2 text-xs sticky top-0 z-50 shadow-md">
      <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-cyan-600 p-1.5 rounded-lg text-white">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white text-sm">MTC Conductor ETM</span>
            <span className="text-[10px] text-cyan-400 ml-1.5 font-medium px-1.5 py-0.5 bg-cyan-950 rounded border border-cyan-800">
              Terminal
            </span>
          </div>
        </div>

        {user && (
          <button
            onClick={logout}
            className="px-2.5 py-1 bg-slate-800 hover:bg-red-950 hover:text-red-400 text-slate-400 rounded-lg border border-slate-700 transition-colors flex items-center gap-1 text-[11px]"
          >
            <LogOut className="w-3 h-3" /> Logout
          </button>
        )}
      </div>
    </nav>
  );
}
