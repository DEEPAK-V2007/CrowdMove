import { Link } from 'react-router-dom';
import { Bus, Camera, CreditCard, Navigation, Shield, ArrowRight, Sparkles } from 'lucide-react';

export default function Login() {
  const portals = [
    {
      title: 'Commuter Smart Pass Portal',
      subtitle: 'Passengers & Public Citizens',
      description: 'Access your prepaid travel wallet balance, digital QR boarding pass, live bus crowd tracking, and multimodal Chennai Metro alternatives.',
      icon: CreditCard,
      color: 'bg-white border-emerald-200 hover:border-emerald-400',
      iconBg: 'bg-emerald-100 text-emerald-700',
      btnColor: 'bg-emerald-600 hover:bg-emerald-500 text-white',
      badge: 'Public Commuter',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      to: '/login/passenger',
      btnLabel: 'Proceed to Commuter Sign In',
    },
    {
      title: 'Conductor ETM Terminal',
      subtitle: 'Onboard Ticket Examiners',
      description: 'Handheld Electronic Ticketing Machine (ETM) interface for contactless RFID smart card validation, QR code boarding, and fare deduction.',
      icon: Camera,
      color: 'bg-white border-cyan-200 hover:border-cyan-400',
      iconBg: 'bg-cyan-100 text-cyan-700',
      btnColor: 'bg-cyan-600 hover:bg-cyan-500 text-white',
      badge: 'ETM Hardware',
      badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      to: '/login/conductor',
      btnLabel: 'Proceed to Conductor Terminal',
    },
    {
      title: 'Driver In-Cab HUD Console',
      subtitle: 'Assigned MTC Vehicle Drivers',
      description: 'In-bus occupancy gauge telemetry, upcoming stop platform demand preview, door safety lock, and 90% overcrowding audio alarm.',
      icon: Navigation,
      color: 'bg-white border-amber-200 hover:border-amber-400',
      iconBg: 'bg-amber-100 text-amber-700',
      btnColor: 'bg-amber-600 hover:bg-amber-500 text-white',
      badge: 'Vehicle Cockpit',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      to: '/login/driver',
      btnLabel: 'Proceed to Driver Sign In',
    },
    {
      title: 'Central Operations Command Center',
      subtitle: 'MTC Administrative Controllers',
      description: 'Master Administrative Clearance for fleet control, real-time GIS tracking, ML overcrowding predictions, proactive bunching regulation, and overall system access.',
      icon: Shield,
      color: 'bg-white border-blue-200 hover:border-blue-400',
      iconBg: 'bg-blue-100 text-blue-700',
      btnColor: 'bg-blue-600 hover:bg-blue-500 text-white',
      badge: 'Overall Authority',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      to: '/login/admin',
      btnLabel: 'Proceed to Admin Sign In',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto w-full my-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-blue-50 border border-blue-200 rounded-full text-blue-700 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-yellow-600" />
            Tamil Nadu Intelligent Transit Management System (TN-ITIS)
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight flex items-center justify-center gap-3">
            <span className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl shadow-lg">
              <Bus className="w-8 h-8 text-white" />
            </span>
            SEERPAYANAM
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm max-w-xl mx-auto mt-2 leading-relaxed">
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
                className={`${p.color} rounded-2xl p-6 border shadow-sm flex flex-col justify-between transition-all hover:shadow-md`}
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${p.iconBg}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-gray-900">{p.title}</h2>
                        <p className="text-xs font-medium text-gray-500">{p.subtitle}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${p.badgeColor}`}>
                      {p.badge}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed mb-6">
                    {p.description}
                  </p>
                </div>

                <Link
                  to={p.to}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all ${p.btnColor}`}
                >
                  {p.btnLabel}
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      <footer className="text-center text-[11px] text-gray-400 mt-6">
        Government of Tamil Nadu · Metropolitan Transport Corporation (MTC) Chennai
      </footer>
    </div>
  );
}
