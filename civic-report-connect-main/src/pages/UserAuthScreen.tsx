import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Eye, EyeOff, Shield, User, ShieldCheck, Zap } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

interface UserAuthScreenProps {
  onAuth: () => void;
  onBack: () => void;
}

/* ─── Shared sub-components ─────────────────────── */
const RoleButton = ({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-[1.5px] px-3 py-2.5 text-sm font-medium transition-all
      ${active
        ? 'border-[#2a9d8f] bg-[#e8f7f5] text-[#2a9d8f]'
        : 'border-[#e8edf2] bg-white text-gray-500 hover:border-[#2a9d8f] hover:text-[#2a9d8f]'
      }`}
  >
    {children}
  </button>
);

const RadioDot = ({ active }: { active: boolean }) => (
  <span className={`flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full border-2 ${active ? 'border-[#2a9d8f]' : 'border-gray-300'}`}>
    {active && <span className="h-2 w-2 rounded-full bg-[#2a9d8f]" />}
  </span>
);

const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label className="mb-1.5 block text-xs font-semibold text-gray-700">
    {children}{required && <span className="ml-0.5 text-[#2a9d8f]"> *</span>}
  </label>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={`h-11 w-full rounded-xl border-[1.5px] border-[#e8edf2] bg-white px-3.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-[#2a9d8f] focus:ring-2 focus:ring-[#2a9d8f]/10 ${props.className ?? ''}`}
  />
);

const PrimaryBtn = ({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="h-[46px] w-full rounded-xl bg-[#2a9d8f] text-sm font-semibold text-white transition-all hover:bg-[#237f72] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
  >
    {children}
  </button>
);

/* ─── Main component ─────────────────────────────── */
const UserAuthScreen = ({ onAuth, onBack }: UserAuthScreenProps) => {
  const { login, signup, firebaseGoogleLogin } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [areaCity, setAreaCity] = useState('');
  const [role, setRole] = useState<'citizen' | 'admin'>('citizen');

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      if (isLogin) {
        if (!form.email || !form.password) { alert('Please fill in all fields'); return; }
        const r = await login(form.email, form.password);
        if (!r.success) { alert(r.message || 'Login failed'); return; }
      } else {
        if (!form.name || !form.email || !form.password) { alert('Please fill in all fields'); return; }
        if (form.password !== form.confirmPassword) { alert('Passwords do not match'); return; }
        const r = await signup(form.name, form.email, form.password);
        if (!r.success) { alert(r.message || 'Signup failed'); return; }
      }
      onAuth();
    } finally { setIsLoading(false); }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoadingGoogle(true);
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = { email: result.user.email || '', displayName: result.user.displayName || 'User', uid: result.user.uid };
      const r = await firebaseGoogleLogin(firebaseUser);
      if (!r.success) { alert(r.message || 'Google sign-in failed'); return; }
      onAuth();
    } catch (e: any) {
      alert(e.message || 'Google sign-in failed');
    } finally { setIsLoadingGoogle(false); }
  };

  const demoLogin = async (email: string) => {
    setIsLoading(true);
    try {
      const r = await login(email, 'demo1234');
      if (r.success) onAuth();
    } finally { setIsLoading(false); }
  };

  /* ─── Logo ─── */
  const Logo = () => (
    <div className="mb-6 flex flex-col items-center">
      <div className="mb-3 flex h-[60px] w-[60px] items-center justify-center rounded-2xl bg-[#2a9d8f] shadow-lg shadow-[#2a9d8f]/30">
        <Shield size={28} color="white" />
      </div>
      <h1 className="text-[26px] font-bold text-gray-900">
        Civic<span className="text-[#2a9d8f]">AI</span>
      </h1>
      <p className="mt-1 text-[13px] text-gray-500">AI-Powered Smart Civic Reporting</p>
    </div>
  );

  /* ─── Register Screen ─── */
  if (!isLogin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f0f4f8] px-4 py-8 fade-in">
        <div className="mb-5 flex flex-col items-center">
          <div className="mb-2.5 flex h-[54px] w-[54px] items-center justify-center rounded-2xl bg-[#2a9d8f] shadow-lg shadow-[#2a9d8f]/30">
            <Shield size={26} color="white" />
          </div>
          <h1 className="text-[22px] font-bold text-gray-900">
            Join Civic<span className="text-[#2a9d8f]">AI</span>
          </h1>
          <p className="mt-1 text-[13px] text-gray-500">Join the Smart Civic Community</p>
        </div>

        <div className="w-full max-w-[400px] rounded-2xl border border-[#e8edf2] bg-white p-5 shadow-sm sm:p-7">
          {/* Full Name */}
          <div className="mb-3.5">
            <Label required>Full Name</Label>
            <Input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" />
          </div>

          {/* Email */}
          <div className="mb-3.5">
            <Label required>Email</Label>
            <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" />
          </div>

          {/* Phone */}
          <div className="mb-3.5">
            <Label>Phone Number</Label>
            <Input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="+91 XXXXX XXXXX" />
          </div>

          {/* Password */}
          <div className="mb-3.5">
            <Label required>Password</Label>
            <div className="relative">
              <Input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" className="pr-11" />
              <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="mb-3.5">
            <Label required>Confirm Password</Label>
            <div className="relative">
              <Input type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} placeholder="Re-enter password" className="pr-11" />
              <button type="button" onClick={() => setShowConfirm(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Select Role */}
          <div className="mb-3.5">
            <Label>Select Role</Label>
            <div className="flex gap-2.5">
              <RoleButton active={role === 'citizen'} onClick={() => setRole('citizen')}>
                <RadioDot active={role === 'citizen'} /><User size={15} />Citizen
              </RoleButton>
              <RoleButton active={role === 'admin'} onClick={() => setRole('admin')}>
                <RadioDot active={role === 'admin'} /><ShieldCheck size={15} />Admin
              </RoleButton>
            </div>
          </div>

          {/* Area / City */}
          <div className="mb-5">
            <Label>Area / City</Label>
            <Input type="text" value={areaCity} onChange={e => setAreaCity(e.target.value)} placeholder="Your area or city" />
          </div>

          <PrimaryBtn onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Register'}
          </PrimaryBtn>

          <p className="mt-4 text-center text-[13px] text-gray-500">
            Already have an account?{' '}
            <button onClick={() => setIsLogin(true)} className="font-semibold text-[#2a9d8f] hover:underline">Login</button>
          </p>
        </div>
      </div>
    );
  }

  /* ─── Login Screen ─── */
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f0f4f8] px-4 py-8 fade-in">
      <Logo />

      <div className="w-full max-w-[400px] rounded-2xl border border-[#e8edf2] bg-white p-5 shadow-sm sm:p-7">
        <h2 className="mb-1 text-center text-[20px] font-bold text-gray-900">Welcome Back 👋</h2>
        <p className="mb-6 text-center text-[13px] text-gray-500">Login to CivicAI</p>

        {/* Email */}
        <div className="mb-3.5">
          <Label>Email / Username</Label>
          <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" />
        </div>

        {/* Password */}
        <div className="mb-4">
          <Label>Password</Label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
              className="pr-11"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        

        <PrimaryBtn onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </PrimaryBtn>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#e8edf2]" />
          <span className="text-[11px] font-medium text-gray-400">OR</span>
          <div className="h-px flex-1 bg-[#e8edf2]" />
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={isLoadingGoogle}
          className="flex h-[46px] w-full items-center justify-center gap-2 rounded-xl border-[1.5px] border-[#e8edf2] bg-white text-sm font-semibold text-gray-700 transition-all hover:border-[#2a9d8f] hover:text-[#2a9d8f] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {isLoadingGoogle ? 'Signing in...' : 'Continue with Google'}
        </button>

        {/* Forgot / Register */}
        <div className="mt-3.5 flex items-center justify-between">
          <button className="text-[13px] text-gray-500 hover:underline">Forgot Password?</button>
          <button onClick={() => setIsLogin(false)} className="text-[13px] font-semibold text-[#2a9d8f] hover:underline">Register Now</button>
        </div>

        
      </div>
    </div>
  );
};

export default UserAuthScreen;
