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
    if (type === 'success') return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (type === 'error') return <AlertTriangle className="w-5 h-5 text-red-600" />;
    if (type === 'warning') return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    return <Info className="w-5 h-5 text-blue-600" />;
  };

  const bg = (type: ToastItem['type']) => {
    if (type === 'success') return 'bg-green-50 border-green-300';
    if (type === 'error') return 'bg-red-50 border-red-300';
    if (type === 'warning') return 'bg-yellow-50 border-yellow-300';
    return 'bg-blue-50 border-blue-300';
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
          <p className="text-sm text-gray-900 flex-1">{t.message}</p>
          <button onClick={() => remove(t.id)} className="text-gray-400 hover:text-gray-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
