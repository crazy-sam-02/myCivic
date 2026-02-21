import { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen = ({ onFinish }: SplashScreenProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onFinish, 300);
          return 100;
        }
        return prev + 4;
      });
    }, 60);
    return () => clearInterval(interval);
  }, [onFinish]);

  return (
    <div className="min-h-screen bg-[#f6f7f9] flex items-center justify-center px-6">
      <div className="flex flex-col items-center gap-5 fade-in">
        <div className="w-20 h-20 rounded-3xl bg-emerald-100 flex items-center justify-center">
          <Shield size={28} className="text-emerald-600" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">CivicAI</h1>
          <p className="text-muted-foreground text-sm mt-1">Making cities better, together</p>
        </div>
        <div className="w-48 mt-4">
          <div className="h-1 rounded-full bg-emerald-100 overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-muted-foreground text-xs text-center mt-3">Loading...</p>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
