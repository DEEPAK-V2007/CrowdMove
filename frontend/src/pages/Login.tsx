import { Link } from 'react-router-dom';
import { Bus, Camera, CreditCard, Navigation, Shield, ArrowRight, Sparkles } from 'lucide-react';

export default function Login() {
  const portals = [
    {
      title: 'Commuter Smart Pass Portal',
      subtitle: 'Passengers & Public Citizens',
      description: 'Access your prepaid travel wallet balance, digital QR boarding pass, live bus crowd tracking, and multimodal Chennai Metro alternatives.',
      icon: CreditCard,
      color: 'from-emerald-950/70 to-slate-900 border-emerald-500/40 text-emerald-400',
      btnColor: 'bg-emerald-600 hover:bg-emerald-500 text-white',
      badge: 'Public Commuter',
      to: '/login/passenger',
      btnLabel: 'Proceed to Commuter Sign In',
    },
    {
      title: 'Conductor ETM Terminal',
      subtitle: 'Onboard Ticket Examiners',
      description: 'Handheld Electronic Ticketing Machine (ETM) interface for contactless RFID smart card validation, QR code boarding, and fare deduction.',
      icon: Camera,
      color: 'from-cyan-950/70 to-slate-900 border-cyan-500/40 text-cyan-400',
      btnColor: 'bg-cyan-600 hover:bg-cyan-500 text-white',
      badge: 'ETM Hardware',
      to: '/login/conductor',
      btnLabel: 'Proceed to Conductor Terminal',
    },
    {
      title: 'Driver In-Cab HUD Console',
      subtitle: 'Assigned MTC Vehicle Drivers',
      description: 'In-bus occupancy gauge telemetry, upcoming stop platform demand preview, door safety lock, and 90% overcrowding audio alarm.',
      icon: Navigation,
      color: 'from-amber-950/70 to-slate-900 border-amber-500/40 text-amber-400',
      btnColor: 'bg-amber-600 hover:bg-amber-500 text-white',
      badge: 'Vehicle Cockpit',
      to: '/login/driver',
      btnLabel: 'Proceed to Driver Sign In',
    },
    {
      title: 'Central Operations Command Center',
      subtitle: 'MTC Administrative Controllers',
      description: 'Master Administrative Clearance for fleet control, real-time GIS tracking, ML overcrowding predictions, proactive bunching regulation, and overall system access.',
      icon: Shield,
      color: 'from-blue-950/70 to-slate-900 border-blue-500/40 text-blue-400',
      btnColor: 'bg-blue-600 hover:bg-blue-500 text-white',
      badge: 'Overall Authority',
      to: '/login/admin',
      btnLabel: 'Proceed to Admin Sign In',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto w-full my-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-blue-950/80 border border-blue-700/60 rounded-full text-blue-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            Tamil Nadu Intelligent Transit Management System (TN-ITIS)
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center justify-center gap-3">
            <span className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl shadow-lg shadow-blue-950">
              <Bus className="w-8 h-8 text-white" />
            </span>
            SEERPAYANAM
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto mt-2 leading-relaxed">
            Please select your authorized department portal below. Each portal operates as an independent, segregated subsystem.
          </p>
        </div>

        {/* 4 Separate Portal Gateway Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {portals.map((p, i) => {
            const Icon = p.icon;
            return (
              <div
                key={i}
                className={`bg-gradient-to-br ${p.color} rounded-2xl p-6 border shadow-xl flex flex-col justify-between transition-all hover:scale-[1.01] hover:border-white/30`}
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-black/50 rounded-xl border border-white/10">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-white">{p.title}</h2>
                        <p className="text-xs font-medium text-slate-400">{p.subtitle}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-slate-300">
                      {p.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300/90 leading-relaxed mb-6">
                    {p.description}
                  </p>
                </div>

                <Link
                  to={p.to}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${p.btnColor}`}
                >
                  {p.btnLabel}
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      <footer className="text-center text-[11px] text-slate-500 mt-6">
        Government of Tamil Nadu · Metropolitan Transport Corporation (MTC) Chennai
      </footer>
    </div>
  );
}
