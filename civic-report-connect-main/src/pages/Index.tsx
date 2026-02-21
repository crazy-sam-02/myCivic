import { useState, useCallback, useEffect } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import SplashScreen from '@/pages/SplashScreen';
import RoleSelectionScreen from '@/pages/RoleSelectionScreen';
import UserAuthScreen from '@/pages/UserAuthScreen';
import AdminAuthScreen from '@/pages/AdminAuthScreen';
import AdminDashboard from '@/pages/AdminDashboard';
import UserLayout from '@/components/UserLayout';
import HomeScreen from './HomeScreen';
import ReportScreen from '@/pages/ReportScreen';
import HistoryScreen from '@/pages/HistoryScreen';
import CommunityScreen from '@/pages/CommunityScreen';
import ProfileScreen from '@/pages/ProfileScreen';
import MapScreen from './MapScreen';

type AppScreen = 'splash' | 'role' | 'userAuth' | 'adminAuth' | 'userApp' | 'adminApp';

const IndexContent = () => {
  const { isLoggedIn, user } = useApp();
  const [screen, setScreen] = useState<AppScreen>('splash');

  const handleSplashDone = useCallback(() => setScreen('role'), []);
  const handleRoleSelect = useCallback((role: 'citizen' | 'admin') => {
    setScreen(role === 'citizen' ? 'userAuth' : 'adminAuth');
  }, []);
  const handleUserAuth = useCallback(() => setScreen('userApp'), []);
  const handleAdminAuth = useCallback(() => setScreen('adminApp'), []);
  const handleBackToRole = useCallback(() => setScreen('role'), []);
  const handleLogout = useCallback(() => setScreen('role'), []);

  const renderTab = (tab: string) => {
    switch (tab) {
      case 'home': return <HomeScreen onNavigate={() => { }} />;
      case 'report': return <ReportScreen />;
      case 'history': return <HistoryScreen />;
      case 'map': return <MapScreen />;
      case 'community': return <CommunityScreen />;
      case 'profile': return <ProfileScreen onLogout={handleLogout} />;
      default: return <HomeScreen onNavigate={() => { }} />;
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    if (user.role === 'admin' || user.role === 'authority') {
      setScreen('adminApp');
    } else {
      setScreen('userApp');
    }
  }, [isLoggedIn, user.role]);

  return (
    <>
      {screen === 'splash' && <SplashScreen onFinish={handleSplashDone} />}
      {screen === 'role' && <RoleSelectionScreen onSelectRole={handleRoleSelect} />}
      {screen === 'userAuth' && <UserAuthScreen onAuth={handleUserAuth} onBack={handleBackToRole} />}
      {screen === 'adminAuth' && <AdminAuthScreen onAuth={handleAdminAuth} onBack={handleBackToRole} />}
      {screen === 'userApp' && <UserLayout>{renderTab}</UserLayout>}
      {screen === 'adminApp' && <AdminDashboard onLogout={handleLogout} />}
    </>
  );
};

const Index = () => (
  <AppProvider>
    <IndexContent />
  </AppProvider>
);

export default Index;
