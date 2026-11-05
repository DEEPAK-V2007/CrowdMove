import { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

interface ToastItem {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

let addToastFn: ((type: ToastItem['type'], message: string) => void) | null = null;
let nextId = 0;

export function showToast(type: ToastItem['type'], message: string) {
  addToastFn?.(type, message);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((type: ToastItem['type'], message: string) => {
    const id = nextId++;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => { addToastFn = null; };
  }, [addToast]);

  const remove = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  const icon = (type: ToastItem['type']) => {
    if (type === 'success') return <CheckCircle className="w-5 h-5 text-green-400" />;
    if (type === 'error') return <AlertTriangle className="w-5 h-5 text-red-400" />;
    if (type === 'warning') return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
    return <Info className="w-5 h-5 text-blue-400" />;
  };

  const bg = (type: ToastItem['type']) => {
    if (type === 'success') return 'bg-green-900/90 border-green-700';
    if (type === 'error') return 'bg-red-900/90 border-red-700';
    if (type === 'warning') return 'bg-yellow-900/90 border-yellow-700';
    return 'bg-blue-900/90 border-blue-700';
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm animate-[slideIn_0.3s_ease-out] ${bg(t.type)}`}
        >
          {icon(t.type)}
          <p className="text-sm text-white flex-1">{t.message}</p>
          <button onClick={() => remove(t.id)} className="text-white/50 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
