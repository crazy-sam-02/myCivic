import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#f6f7f9] flex items-center justify-center px-6">
      <div className="text-center bg-white border border-border/60 rounded-2xl p-8 shadow-sm max-w-md w-full">
        <h1 className="mb-2 text-4xl font-bold text-foreground">404</h1>
        <p className="mb-6 text-sm text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="inline-flex items-center justify-center h-11 px-5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
