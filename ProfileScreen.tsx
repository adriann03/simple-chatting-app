import React, { useState, useRef } from 'react';
import { ArrowLeft, Camera, User, Info, Check, Edit2 } from 'lucide-react';
import { LocalSession } from '../types';
import { updateProfile } from '../services/db';

interface Props {
  session: LocalSession;
  onBack: () => void;
}

export const ProfileScreen: React.FC<Props> = ({ session, onBack }) => {
  const [name, setName] = useState(session.my_username);
  const [bio, setBio] = useState(session.bio || 'Available');
  const [customId, setCustomId] = useState(session.my_id);
  const [profilePic, setProfilePic] = useState(session.profile_picture || '');
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingId, setIsEditingId] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveName = () => {
    setIsEditingName(false);
    updateProfile(name, bio, customId, profilePic);
  };

  const handleSaveBio = () => {
    setIsEditingBio(false);
    updateProfile(name, bio, customId, profilePic);
  };

  const handleSaveId = () => {
    setIsEditingId(false);
    // Pastikan ID tidak kosong, jika kosong kembalikan ke ID sebelumnya
    if (!customId.trim()) {
      setCustomId(session.my_id);
      return;
    }
    const formattedId = customId.replace(/\s/g, '').toUpperCase();
    setCustomId(formattedId);
    updateProfile(name, bio, formattedId, profilePic);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        
        // Simple resize using canvas to prevent localStorage quota issues
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const resizedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setProfilePic(resizedBase64);
          updateProfile(name, bio, customId, resizedBase64);
        };
        img.src = base64String;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="h-full w-full bg-[#121212] text-gray-200 flex flex-col font-sans overflow-y-auto">
      {/* Header */}
      <div className="bg-[#1E1E1E] px-4 py-4 flex items-center shadow-md sticky top-0 z-10">
        <button onClick={onBack} className="mr-4 p-2 rounded-full hover:bg-gray-800 transition-colors">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h3 className="font-bold text-xl text-white">Profil</h3>
      </div>

      <div className="flex flex-col items-center pt-10 pb-6">
        {/* Profile Picture */}
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <div className="w-40 h-40 rounded-full overflow-hidden bg-gray-800 border-4 border-gray-700 flex items-center justify-center">
            {profilePic ? (
              <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-20 h-20 text-gray-500" />
            )}
          </div>
          <div className="absolute bottom-0 right-2 bg-blue-600 p-3 rounded-full shadow-lg border-2 border-[#121212]">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
      </div>

      <div className="px-6 space-y-6 mt-4 pb-10">
        {/* Name Section */}
        <div className="bg-[#1E1E1E] p-5 rounded-2xl border border-gray-800 shadow-sm">
          <div className="flex items-start">
            <User className="w-6 h-6 text-gray-400 mr-4 mt-1" />
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-1">Nama</p>
              {isEditingName ? (
                <div className="flex items-center border-b-2 border-blue-500 pb-1">
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 bg-transparent text-white focus:outline-none text-lg"
                    autoFocus
                  />
                  <button onClick={handleSaveName} className="p-1 text-blue-500">
                    <Check className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-lg text-white">{name}</p>
                  <button onClick={() => setIsEditingName(true)} className="p-1 text-gray-400 hover:text-white">
                    <Edit2 className="w-5 h-5" />
                  </button>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Ini bukan PIN atau ID Anda. Nama ini akan terlihat oleh kontak Anda.
              </p>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div className="bg-[#1E1E1E] p-5 rounded-2xl border border-gray-800 shadow-sm">
          <div className="flex items-start">
            <Info className="w-6 h-6 text-gray-400 mr-4 mt-1" />
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-1">Info</p>
              {isEditingBio ? (
                <div className="flex items-center border-b-2 border-blue-500 pb-1">
                  <input 
                    type="text" 
                    value={bio} 
                    onChange={(e) => setBio(e.target.value)}
                    className="flex-1 bg-transparent text-white focus:outline-none text-lg"
                    autoFocus
                  />
                  <button onClick={handleSaveBio} className="p-1 text-blue-500">
                    <Check className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-lg text-white">{bio}</p>
                  <button onClick={() => setIsEditingBio(true)} className="p-1 text-gray-400 hover:text-white">
                    <Edit2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ID Section (Editable) */}
        <div className="bg-[#1E1E1E] p-5 rounded-2xl border border-gray-800 shadow-sm">
          <div className="flex items-start">
            <div className="w-6 h-6 flex items-center justify-center text-gray-400 mr-4 mt-1 font-bold">ID</div>
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-1">Atmosphere ID</p>
              {isEditingId ? (
                <div className="flex items-center border-b-2 border-blue-500 pb-1">
                  <input 
                    type="text" 
                    value={customId} 
                    onChange={(e) => setCustomId(e.target.value.replace(/\s/g, '').toUpperCase())}
                    className="flex-1 bg-transparent text-white focus:outline-none text-lg font-mono"
                    autoFocus
                  />
                  <button onClick={handleSaveId} className="p-1 text-blue-500">
                    <Check className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-lg text-white font-mono">{customId}</p>
                  <button onClick={() => setIsEditingId(true)} className="p-1 text-gray-400 hover:text-white">
                    <Edit2 className="w-5 h-5" />
                  </button>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Berikan ID ini kepada teman Anda agar mereka bisa menambahkan Anda. Anda dapat mengubahnya kapan saja.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
