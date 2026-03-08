import React, { useState } from 'react';
import { useTheme } from './ThemeContext';
import { Lock } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: (token: string) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess }) => {
  const { theme } = useTheme();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.token) {
        onSuccess(data.token);
      } else {
        setError(data.error || 'Invalid password');
      }
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] text-black dark:text-white flex items-center justify-center p-8 transition-colors duration-300">
      <div className="glass w-full max-w-md rounded-3xl p-10 border border-black/10 dark:border-white/10">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center">
            <Lock className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        <h1 className="text-2xl font-serif font-bold text-center mb-2">Admin <span className="text-orange-500">Login</span></h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm text-center mb-8">Enter your password to manage projects</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 focus:border-orange-500 outline-none transition-all"
              placeholder="••••••••"
              required
              autoFocus
            />
          </div>
          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold hover:bg-orange-500 hover:text-white transition-all disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
