import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Eye, EyeOff, Shield } from 'lucide-react';

interface AdminAuthScreenProps {
  onAuth: () => void;
  onBack: () => void;
}

const AdminAuthScreen = ({ onAuth, onBack }: AdminAuthScreenProps) => {
  const { login, logout } = useApp();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ adminId: '', password: '' });

  const handleSubmit = async () => {
    if (!form.adminId || !form.password) {
      alert('Please fill in all fields');
      return;
    }
    const result = await login(form.adminId, form.password);
    if (!result.success) {
      alert(result.message || 'Login failed');
      return;
    }
    if (result.role !== 'admin' && result.role !== 'authority') {
      await logout();
      alert('Admin access only');
      return;
    }
    onAuth();
  };

  return (
    <div className="min-h-screen bg-[#f6f7f9] px-4 py-8">
      <div className="mx-auto w-full max-w-md">
        <button onClick={onBack} className="text-xs text-muted-foreground font-medium mb-6 hover:underline">
          ← Back to role selection
        </button>

        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
            <Shield size={22} className="text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-foreground mt-3">Admin Portal</h1>
          <p className="text-sm text-muted-foreground">Authorized personnel only</p>
        </div>

        <div className="bg-white rounded-2xl border border-border/60 shadow-sm px-5 py-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Admin ID / Email</label>
            <input
              type="text"
              value={form.adminId}
              onChange={e => setForm(f => ({ ...f, adminId: e.target.value }))}
              placeholder="admin@civicreport.gov"
              className="w-full h-11 px-4 rounded-xl border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full h-11 px-4 pr-11 rounded-xl border border-border bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full h-12 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 active:scale-[0.98] transition-all"
          >
            Access Dashboard
          </button>

          <div className="flex items-start gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <Shield size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-800/80">This portal is for authorized government officials only. Unauthorized access is prohibited.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAuthScreen;
