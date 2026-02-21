import { useState, type ReactNode } from 'react';
import {
  Home, FileWarning, ClipboardList, Map, Users, User,
  Shield, ExternalLink, Menu, X,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface Tab { id: string; label: string; icon: typeof Home; }

const TABS: Tab[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'report', label: 'Report', icon: FileWarning },
  { id: 'history', label: 'My Reports', icon: ClipboardList },
  { id: 'map', label: 'Map', icon: Map },
  { id: 'community', label: 'Community', icon: Users },
  { id: 'profile', label: 'Profile', icon: User },
];

interface UserLayoutProps {
  children: (activeTab: string) => ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const UserLayout = ({ children, activeTab: controlledTab, onTabChange }: UserLayoutProps) => {
  const [internalTab, setInternalTab] = useState('home');
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentTab = controlledTab ?? internalTab;
  const setTab = (t: string) => {
    (onTabChange ?? setInternalTab)(t);
    setMobileOpen(false);
  };
  const { user } = useApp();
  const isAdmin = user.role === 'admin' || user.role === 'authority';

  return (
    <div className="min-h-screen bg-[#f0f4f8]">

      {/* ─── Top Navbar ─── */}
      <nav className="sticky top-0 z-50 h-[56px] border-b border-[#e8edf2] bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-4 sm:px-6">

          {/* Logo */}
          <div className="flex flex-shrink-0 items-center gap-2">
            <div className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-[#2a9d8f] shadow-md shadow-[#2a9d8f]/30">
              <Shield size={15} color="white" />
            </div>
            <span className="text-[15px] font-bold tracking-tight text-gray-900">
              Civic<span className="text-[#2a9d8f]">AI</span>
            </span>
          </div>

          {/* Desktop center nav */}
          <div className="hidden items-center gap-0.5 md:flex">
            {TABS.map(tab => {
              const isActive = currentTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setTab(tab.id)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-[7px] text-[13px] font-medium transition-all
                    ${isActive
                      ? 'bg-[#e8f7f5] font-semibold text-[#2a9d8f]'
                      : 'text-gray-500 hover:bg-gray-100/80 hover:text-gray-700'
                    }`}
                >
                  <Icon size={14} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span className="hidden lg:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
           

            {/* Mobile hamburger */}
            <button
              className="flex items-center justify-center rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 md:hidden"
              onClick={() => setMobileOpen(o => !o)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Mobile Dropdown Menu ─── */}
      {mobileOpen && (
        <div className="sticky top-[56px] z-40 border-b border-[#e8edf2] bg-white shadow-md md:hidden">
          <div className="grid grid-cols-3 gap-1 p-3">
            {TABS.map(tab => {
              const isActive = currentTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setTab(tab.id)}
                  className={`flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-[11px] font-medium transition-all
                    ${isActive
                      ? 'bg-[#e8f7f5] font-semibold text-[#2a9d8f]'
                      : 'text-gray-500 hover:bg-gray-100'
                    }`}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Page Content ─── */}
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        {children(currentTab)}
      </div>

    </div>
  );
};

export default UserLayout;
