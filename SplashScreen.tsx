import React, { useEffect, useState } from 'react';
import { Cloud, Sun } from 'lucide-react';
import { playTing, playWoosh } from '../services/audio';

interface Props {
  onComplete: () => void;
}

export const SplashScreen: React.FC<Props> = ({ onComplete }) => {
  const [showSun, setShowSun] = useState(false);

  useEffect(() => {
    // Play soft wind at 0s
    playWoosh();

    // Show sun and play Ting at 1.5s
    const timer1 = setTimeout(() => {
      playTing();
      setShowSun(true);
    }, 1500);

    // Auto transition at 3.5s
    const timer2 = setTimeout(() => {
      onComplete();
    }, 3500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-[#E0F7FA]">
      <div className="relative flex items-center justify-center mb-12 h-40 w-40">
        {/* Clouds */}
        <Cloud className="absolute text-white w-32 h-32 animate-bounce z-10 drop-shadow-md" style={{ animationDuration: '3s' }} />
        <Cloud className="absolute text-blue-100 w-24 h-24 animate-bounce z-0 -left-4 top-4" style={{ animationDuration: '4s' }} />
        
        {/* Sun with Sunglasses (Appears after 1.5s) */}
        <div className={`absolute transition-all duration-700 ease-out z-20 ${showSun ? 'opacity-100 -top-8 scale-100' : 'opacity-0 top-10 scale-50'}`}>
          <div className="relative">
            <Sun className="text-yellow-400 w-24 h-24 animate-spin-slow drop-shadow-lg" style={{ animationDuration: '10s' }} />
            {/* Sunglasses */}
            <div className="absolute top-8 left-4 flex space-x-1">
              <div className="w-7 h-5 bg-gray-900 rounded-full border-2 border-gray-800"></div>
              <div className="w-7 h-5 bg-gray-900 rounded-full border-2 border-gray-800"></div>
              {/* Bridge */}
              <div className="absolute top-2 left-6 w-3 h-1 bg-gray-900"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="px-8 text-center">
        <p className="text-gray-700 text-lg font-medium leading-relaxed">
          "Memantau masa depanmu yang cerah... secerah matahari hari ini yang siap membakar semangat (dan kulit) Anda. ☀️✨"
        </p>
      </div>
    </div>
  );
};
