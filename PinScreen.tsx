import React, { useState } from 'react';
import { Satellite, Delete } from 'lucide-react';
import { clearAllData, saveSession, getSession } from '../services/db';

interface Props {
  correctPin: string;
  onSuccess: () => void;
  onFail: () => void;
  onPanicWipe: () => void;
}

export const PinScreen: React.FC<Props> = ({ correctPin, onSuccess, onFail, onPanicWipe }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handlePress = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError(false);
      
      if (newPin.length === 4) {
        setTimeout(() => {
          if (newPin === correctPin) {
            const s = getSession();
            if (s) {
              s.is_logged_in = true;
              saveSession(s);
            }
            onSuccess();
          } else if (newPin === '9999') {
            // PANIC PIN: Wipe database and return to weather
            clearAllData();
            onPanicWipe();
          } else {
            setError(true);
            setTimeout(() => {
              setPin('');
              onFail(); // Return to weather on fail
            }, 500);
          }
        }, 200);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="h-full w-full bg-[#0a0a0a] text-green-500 flex flex-col items-center justify-center font-mono relative overflow-hidden">
      {/* Radar sweep effect */}
      <div className="absolute inset-0 opacity-20 pointer-events-none flex items-center justify-center">
        <div className="w-[200%] h-[200%] border border-green-500 rounded-full animate-ping" style={{ animationDuration: '4s' }}></div>
      </div>

      <Satellite className="w-16 h-16 mb-6 text-green-600 animate-pulse" />
      <h2 className="text-xl mb-10 tracking-widest text-center px-4 font-bold">
        KODE POS SATELIT
      </h2>
      
      <div className="flex space-x-6 mb-16">
        {[0, 1, 2, 3].map(i => (
          <div 
            key={i} 
            className={`w-5 h-5 rounded-full border-2 transition-colors duration-200 ${
              error ? 'border-red-500 bg-red-500 shadow-[0_0_10px_red]' : 
              i < pin.length ? 'border-green-400 bg-green-400 shadow-[0_0_10px_#4ade80]' : 'border-green-900'
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-8 max-w-xs w-full px-6 z-10">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            onClick={() => handlePress(num.toString())}
            className="w-20 h-20 rounded-full border-2 border-green-900 flex items-center justify-center text-3xl font-light active:bg-green-900/50 active:border-green-500 transition-all"
          >
            {num}
          </button>
        ))}
        <div /> {/* Empty cell */}
        <button
          onClick={() => handlePress('0')}
          className="w-20 h-20 rounded-full border-2 border-green-900 flex items-center justify-center text-3xl font-light active:bg-green-900/50 active:border-green-500 transition-all"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          className="w-20 h-20 rounded-full flex items-center justify-center text-3xl active:bg-green-900/50 transition-all text-green-700"
        >
          <Delete className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
};
