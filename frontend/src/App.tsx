import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import PassengerDashboard from './pages/passenger/Dashboard';
import DriverDashboard from './pages/driver/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import ConductorScanner from './pages/conductor/Scanner';
import ToastContainer from './components/Toast';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-3 border-blue-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Login />;

  if (user.role === 'admin') return <AdminDashboard />;
  if (user.role === 'driver') return <DriverDashboard />;
  return <PassengerDashboard />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastContainer />
        <Routes>
          <Route path="/scanner" element={<ConductorScanner />} />
          <Route path="*" element={<AppRoutes />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
