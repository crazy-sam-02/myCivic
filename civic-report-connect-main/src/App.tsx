import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from "react-router-dom";
import { AppProvider, useApp } from "@/context/AppContext";
import SplashScreen from "@/pages/SplashScreen";
import RoleSelectionScreen from "@/pages/RoleSelectionScreen";
import UserAuthScreen from "@/pages/UserAuthScreen";
import AdminAuthScreen from "@/pages/AdminAuthScreen";
import AdminDashboard from "@/pages/AdminDashboard";
import UserLayout from "@/components/UserLayout";
import HomeScreen from "@/pages/HomeScreen";
import ReportScreen from "@/pages/ReportScreen";
import HistoryScreen from "@/pages/HistoryScreen";
import CommunityScreen from "@/pages/CommunityScreen";
import ProfileScreen from "@/pages/ProfileScreen";
import MapScreen from "@/pages/MapScreen";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const SplashRoute = () => {
  const navigate = useNavigate();
  return <SplashScreen onFinish={() => navigate("/role", { replace: true })} />;
};

const RoleRoute = () => {
  const navigate = useNavigate();
  return (
    <RoleSelectionScreen
      onSelectRole={(role) => navigate(role === "citizen" ? "/user/login" : "/admin/login")}
    />
  );
};

const UserAuthRoute = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useApp();

  useEffect(() => {
    if (!isLoggedIn) return;
    navigate("/app/home", { replace: true });
  }, [isLoggedIn, user.role, navigate]);

  return (
    <UserAuthScreen
      onAuth={() => navigate("/app/home")}
      onBack={() => navigate("/role")}
    />
  );
};

const AdminAuthRoute = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useApp();

  useEffect(() => {
    if (!isLoggedIn) return;
    if (user.role === "admin" || user.role === "authority") {
      navigate("/admin", { replace: true });
    } else {
      navigate("/app/home", { replace: true });
    }
  }, [isLoggedIn, user.role, navigate]);

  return (
    <AdminAuthScreen
      onAuth={() => navigate("/admin")}
      onBack={() => navigate("/role")}
    />
  );
};

const UserAppRoute = () => {
  const navigate = useNavigate();
  const { tab } = useParams();
  const { isLoggedIn, user } = useApp();
  const allowedTabs = ["home", "report", "history", "map", "community", "profile"];
  const activeTab = tab && allowedTabs.includes(tab) ? tab : "home";

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/user/login", { replace: true });
      return;
    }
  }, [isLoggedIn, user.role, navigate]);

  useEffect(() => {
    if (tab && !allowedTabs.includes(tab)) {
      navigate("/app/home", { replace: true });
    }
  }, [tab, navigate]);

  const handleLogout = () => navigate("/role");

  const renderTab = (currentTab: string) => {
    switch (currentTab) {
      case "home":
        return <HomeScreen onNavigate={(next) => navigate(`/app/${next}`)} />;
      case "report":
        return <ReportScreen />;
      case "history":
        return <HistoryScreen />;
      case "map":
        return <MapScreen />;
      case "community":
        return <CommunityScreen />;
      case "profile":
        return <ProfileScreen onLogout={handleLogout} />;
      default:
        return <HomeScreen onNavigate={(next) => navigate(`/app/${next}`)} />;
    }
  };

  return (
    <UserLayout
      activeTab={activeTab}
      onTabChange={(next) => navigate(`/app/${next}`)}
    >
      {renderTab}
    </UserLayout>
  );
};

const AdminRoute = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useApp();

  if (!isLoggedIn) {
    return <Navigate to="/admin/login" replace />;
  }

  if (user.role !== "admin" && user.role !== "authority") {
    return <Navigate to="/app/home" replace />;
  }

  return <AdminDashboard onLogout={() => navigate("/role")} />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/splash" replace />} />
            <Route path="/splash" element={<SplashRoute />} />
            <Route path="/role" element={<RoleRoute />} />
            <Route path="/user/login" element={<UserAuthRoute />} />
            <Route path="/admin/login" element={<AdminAuthRoute />} />
            <Route path="/app/:tab" element={<UserAppRoute />} />
            <Route path="/app" element={<Navigate to="/app/home" replace />} />
            <Route path="/admin" element={<AdminRoute />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
