import { Shield, User } from 'lucide-react';

interface RoleSelectionScreenProps {
  onSelectRole: (role: 'citizen' | 'admin') => void;
}

const RoleSelectionScreen = ({ onSelectRole }: RoleSelectionScreenProps) => {
  return (
    <div className="min-h-screen bg-[#f6f7f9] px-4 py-10">
      <div className="mx-auto w-full max-w-md flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
          <Shield size={22} className="text-emerald-600" />
        </div>
        <h1 className="text-xl font-bold text-foreground">CivicAI</h1>
        <p className="text-sm text-muted-foreground mb-8">Choose how you want to continue</p>

        <div className="w-full space-y-3">
          <button
            onClick={() => onSelectRole('citizen')}
            className="w-full bg-white border border-border/60 rounded-2xl p-4 flex items-center gap-4 text-left hover:border-emerald-300 hover:bg-emerald-50/40 transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <User size={22} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Citizen Login</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Report civic issues & track your complaints</p>
            </div>
          </button>

          <button
            onClick={() => onSelectRole('admin')}
            className="w-full bg-white border border-border/60 rounded-2xl p-4 flex items-center gap-4 text-left hover:border-emerald-300 hover:bg-emerald-50/40 transition-all"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <Shield size={22} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Admin Login</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Manage & resolve community issues</p>
            </div>
          </button>
        </div>

        <p className="text-[11px] text-muted-foreground/60 mt-10">v1.0 — Making cities better, together</p>
      </div>
    </div>
  );
};

export default RoleSelectionScreen;
