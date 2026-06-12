import React, { useState } from 'react';
import { ArrowLeft, UserPlus, Radio } from 'lucide-react';
import { saveContact, saveGroup } from '../services/db';
import { syncGroupToCloud } from '../services/api';

interface Props {
  onBack: () => void;
}

export const AddContactScreen: React.FC<Props> = ({ onBack }) => {
  // Manual State
  const [manualId, setManualId] = useState('');
  const [manualName, setManualName] = useState('');
  
  // Sync State
  const [syncKeyword, setSyncKeyword] = useState('');
  const [syncName, setSyncName] = useState('');
  const [syncStatus, setSyncStatus] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualAdd = () => {
    if (manualId && manualName) {
      saveContact(manualId, manualName);
      onBack();
    }
  };

  const handleSync = async () => {
    if (!syncKeyword.trim() || !syncName.trim()) return;
    setIsSyncing(true);
    setSyncStatus('Menghubungkan ke VM Cloud...');
    
    const groupId = `grp_${syncKeyword.toLowerCase()}_${Date.now()}`;
    const group = await syncGroupToCloud(groupId, syncName, syncKeyword);
    
    if (group) {
      setSyncStatus(`Berhasil membuat grup: ${group.group_name}`);
      saveGroup(group);
      setTimeout(() => {
        onBack();
      }, 1500);
    } else {
      setSyncStatus('Gagal sinkronisasi ke server.');
      setIsSyncing(false);
    }
  };

  return (
    <div className="h-full w-full bg-[#121212] text-gray-200 flex flex-col font-sans overflow-y-auto">
      {/* Header */}
      <div className="bg-[#1E1E1E] px-4 py-4 flex items-center shadow-md sticky top-0 z-10">
        <button onClick={onBack} className="mr-4 p-2 rounded-full hover:bg-gray-800 transition-colors">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h3 className="font-bold text-xl text-white">Tambah Koneksi</h3>
      </div>

      <div className="p-6 space-y-10">
        {/* Section 1: Manual Contact */}
        <div className="bg-[#1E1E1E] p-6 rounded-2xl border border-gray-800 shadow-lg">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center mr-3">
              <UserPlus className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Simpan Kontak Manual</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5 font-medium">Nama Samaran</label>
              <input
                type="text"
                value={manualName}
                onChange={e => setManualName(e.target.value)}
                placeholder="Contoh: Elang Hitam"
                className="w-full bg-[#121212] border border-gray-700 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5 font-medium">ID Atmosphere</label>
              <input
                type="text"
                value={manualId}
                onChange={e => setManualId(e.target.value)}
                placeholder="ATMOS-XXXX-X"
                className="w-full bg-[#121212] border border-gray-700 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-blue-500 font-mono transition-colors"
              />
            </div>
            <button 
              onClick={handleManualAdd}
              disabled={!manualId || !manualName}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold py-4 rounded-xl transition-colors mt-2 shadow-md"
            >
              Simpan Kontak
            </button>
          </div>
        </div>

        {/* Section 2: Cloud Sync Group */}
        <div className="bg-[#1E1E1E] p-6 rounded-2xl border border-gray-800 shadow-lg">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-blue-900/30 rounded-full flex items-center justify-center mr-3">
              <Radio className={`w-5 h-5 text-blue-400 ${isSyncing ? 'animate-ping' : ''}`} />
            </div>
            <h3 className="text-lg font-bold text-white">Sinkronisasi Grup Cloud</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5 font-medium">Nama Grup</label>
              <input
                type="text"
                value={syncName}
                onChange={e => setSyncName(e.target.value)}
                placeholder="Contoh: Stasiun Alpha"
                className="w-full bg-[#121212] border border-gray-700 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                disabled={isSyncing}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5 font-medium">Kunci Frekuensi Bersama</label>
              <input
                type="text"
                value={syncKeyword}
                onChange={e => setSyncKeyword(e.target.value)}
                placeholder="Contoh: badai-selatan-9"
                className="w-full bg-[#121212] border border-gray-700 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-blue-500 font-mono transition-colors"
                disabled={isSyncing}
              />
            </div>
            <button 
              onClick={handleSync}
              disabled={isSyncing || !syncKeyword || !syncName}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-500 text-white font-bold py-4 rounded-xl transition-all mt-2 shadow-md"
            >
              {isSyncing ? 'Menyinkronkan...' : 'Buat & Sinkronisasi Grup'}
            </button>
            {syncStatus && <p className="mt-4 text-sm text-blue-400 text-center font-medium">{syncStatus}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
