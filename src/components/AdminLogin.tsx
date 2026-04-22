import { useState, type FormEvent } from 'react';
import { Lock } from 'lucide-react';
import { useSchedulerStore } from '../store/useSchedulerStore';

interface Props {
  onClose: () => void;
}

export default function AdminLogin({ onClose }: Props) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const setAdminMode = useSchedulerStore((s) => s.setAdminMode);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    const ok = await setAdminMode(password);
    setLoading(false);
    if (ok) {
      onClose();
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-6 w-80" onClick={(e) => e.stopPropagation()} dir="rtl">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold">\u05db\u05e0\u05d9\u05e1\u05ea \u05de\u05e0\u05d4\u05dc</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="\u05e1\u05d9\u05e1\u05de\u05d4"
            autoFocus
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <p className="text-red-500 text-sm">\u05e1\u05d9\u05e1\u05de\u05d4 \u05e9\u05d2\u05d5\u05d9\u05d4</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || !password}
              className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '...' : '\u05db\u05e0\u05d9\u05e1\u05d4'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border rounded-lg py-2 text-sm font-medium hover:bg-gray-50"
            >
              \u05d1\u05d9\u05d8\u05d5\u05dc
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
