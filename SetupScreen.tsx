import React, { useState } from 'react';
import { Cloud, ShieldCheck } from 'lucide-react';

interface Props {
  onComplete: (username: string, pin: string, customId: string) => void;
}

export const SetupScreen: React.FC<Props> = ({ onComplete }) => {
  const [username, setUsername] = useState('');
  const [customId, setCustomId] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Nama profil tidak boleh kosong.');
      return;
    }
    if (!customId.trim()) {
      setError('ID Atmosphere tidak boleh kosong.');
      return;
    }
    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
      setError('PIN harus terdiri dari 4 angka.');
      return;
    }
    if (pin !== confirmPin) {
      setError('Konfirmasi PIN tidak cocok.');
      return;
    }
    if (pin === '9999') {
      setError('PIN 9999 dicadangkan untuk sistem darurat (Panic Button).');
      return;
    }
    
    onComplete(username, pin, customId.trim().toUpperCase());
  };

  return (
    <div className="h-full w-full bg-gradient-to-b from-[#1a237e] to-[#000000] flex flex-col items-center justify-center px-6 font-sans text-white overflow-y-auto py-10">
      <Cloud className="w-16 h-16 text-blue-300 mb-4 animate-pulse flex-shrink-0" />
      <h1 className="text-2xl font-bold mb-2">Atmosphere Pro</h1>
      <p className="text-center text-blue-200/70 mb-6 text-sm max-w-xs">
        Atur profil lokal, ID unik, dan PIN keamanan untuk menyimpan preferensi cuaca Anda.
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 bg-white/10 p-6 rounded-2xl backdrop-blur-md border border-white/10 shadow-2xl">
        <div>
          <label className="block text-sm font-medium text-blue-200 mb-1">Nama Profil</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Contoh: Pengamat Cuaca"
            className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-blue-200 mb-1">Buat ID Atmosphere</label>
          <input
            type="text"
            value={customId}
            onChange={(e) => setCustomId(e.target.value.replace(/\s/g, '').toUpperCase())}
            placeholder="Contoh: ELANG-007"
            className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400 transition-colors font-mono uppercase"
          />
          <p className="text-[11px] text-blue-200/50 mt-1">ID ini akan digunakan teman Anda untuk menambahkan kontak.</p>
        </div>

        <div className="flex space-x-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-blue-200 mb-1">PIN (4 Angka)</label>
            <input
              type="password"
              maxLength={4}
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400 transition-colors tracking-widest text-center text-lg"
            />
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-blue-200 mb-1">Konfirmasi PIN</label>
            <input
              type="password"
              maxLength={4}
              inputMode="numeric"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              placeholder="••••"
              className="w-full bg-black/30 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-400 transition-colors tracking-widest text-center text-lg"
            />
          </div>
        </div>

        {error && <p className="text-red-400 text-sm text-center font-medium pt-2">{error}</p>}

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-colors mt-6 flex items-center justify-center"
        >
          <ShieldCheck className="w-5 h-5 mr-2" />
          Simpan & Lanjutkan
        </button>
      </form>
    </div>
  );
};
