import React, { useState, useEffect } from 'react';
import { Users, Radio, Plus, ShieldAlert, UserCircle, Fingerprint, Activity } from 'lucide-react';
import { LocalSession, LocalContact, LocalGroup } from '../types';
import { getContacts, getGroups } from '../services/db';
import { requestNotificationPermission } from '../services/notification';

interface Props {
  session: LocalSession;
  onPanic: () => void;
  onOpenChat: (id: string, name: string) => void;
  onAddContact: () => void;
  onOpenProfile: () => void;
}

export const ChatDashboard: React.FC<Props> = ({ session, onPanic, onOpenChat, onAddContact, onOpenProfile }) => {
  const [contacts, setContacts] = useState<LocalContact[]>([]);
  const [groups, setGroups] = useState<LocalGroup[]>([]);
  const [activeTab, setActiveTab] = useState<'CONTACTS' | 'GROUPS'>('CONTACTS');

  useEffect(() => {
    setContacts(getContacts());
    setGroups(getGroups());
    
    requestNotificationPermission();
    
    const handleMotion = (e: DeviceMotionEvent) => {
      if (e.accelerationIncludingGravity) {
        const { x, y, z } = e.accelerationIncludingGravity;
        const acceleration = Math.sqrt((x || 0)**2 + (y || 0)**2 + (z || 0)**2);
        if (acceleration > 20) {
          onPanic();
        }
      }
    };
    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [onPanic]);

  return (
    <div className="h-full w-full bg-[#050505] text-gray-200 flex flex-col relative font-sans overflow-hidden">
      {/* Mysterious Background Grid */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-20" 
           style={{ backgroundImage: 'linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
      </div>
      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050505_100%)]"></div>

      {/* Stealth Header */}
      <div className="px-6 py-5 flex justify-between items-center z-10 bg-black/40 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center">
          <button onClick={onOpenProfile} className="mr-4 relative group">
            <div className="absolute inset-0 bg-cyan-500 rounded-full blur opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
            {session.profile_picture ? (
              <img src={session.profile_picture} alt="Profile" className="w-11 h-11 rounded-full object-cover border border-cyan-900/50 relative z-10" />
            ) : (
              <div className="w-11 h-11 bg-zinc-900 rounded-full flex items-center justify-center border border-cyan-900/50 relative z-10">
                <Fingerprint className="w-6 h-6 text-cyan-500/70" />
              </div>
            )}
          </button>
          <div>
            <h2 className="text-xl font-bold text-white tracking-widest uppercase flex items-center">
              ATMOSPHERE <Activity className="w-4 h-4 ml-2 text-cyan-400 animate-pulse" />
            </h2>
            <p className="text-[10px] text-cyan-500/70 font-mono mt-0.5 tracking-widest">OP_ID: {session.my_id}</p>
          </div>
        </div>
        <button onClick={onPanic} className="p-2.5 text-red-500/80 bg-red-500/10 rounded-full hover:bg-red-500/20 hover:text-red-400 transition-all shadow-[0_0_15px_rgba(239,68,68,0.1)]" title="Emergency Exit">
          <ShieldAlert className="w-5 h-5" />
        </button>
      </div>

      {/* Cyber Tabs */}
      <div className="flex z-10 px-4 pt-4 pb-2 space-x-2">
        <button 
          className={`flex-1 py-3 text-xs font-bold tracking-widest rounded-lg transition-all duration-300 ${activeTab === 'CONTACTS' ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'bg-zinc-900/50 text-zinc-500 border border-white/5 hover:bg-zinc-800/50'}`}
          onClick={() => setActiveTab('CONTACTS')}
        >
          SECURE CHANNELS
        </button>
        <button 
          className={`flex-1 py-3 text-xs font-bold tracking-widest rounded-lg transition-all duration-300 ${activeTab === 'GROUPS' ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'bg-zinc-900/50 text-zinc-500 border border-white/5 hover:bg-zinc-800/50'}`}
          onClick={() => setActiveTab('GROUPS')}
        >
          SYNCED FREQS
        </button>
      </div>

      {/* Content List */}
      <div className="flex-1 overflow-y-auto z-10 px-4 py-2 space-y-3">
        {activeTab === 'CONTACTS' && (
          <>
            {contacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-zinc-600">
                <Users className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-mono text-xs tracking-widest">NO CHANNELS FOUND</p>
              </div>
            ) : (
              contacts.map(c => (
                <div 
                  key={c.contact_id} 
                  onClick={() => onOpenChat(c.contact_id, c.contact_name)}
                  className="group flex items-center px-4 py-4 bg-zinc-900/40 hover:bg-cyan-950/20 backdrop-blur-sm rounded-xl border border-white/5 hover:border-cyan-500/30 cursor-pointer transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-zinc-800/50 group-hover:bg-cyan-900/50 rounded-full flex items-center justify-center mr-4 border border-white/5 group-hover:border-cyan-500/30 transition-colors">
                    <UserCircle className="w-6 h-6 text-zinc-400 group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-base text-zinc-200 group-hover:text-white transition-colors">{c.contact_name}</h4>
                    <p className="text-[10px] text-zinc-500 group-hover:text-cyan-500/70 font-mono mt-1 tracking-wider">ID: {c.contact_id}</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-zinc-700 group-hover:bg-cyan-400 group-hover:shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-all"></div>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'GROUPS' && (
          <>
            {groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-zinc-600">
                <Radio className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-mono text-xs tracking-widest">NO FREQUENCIES SYNCED</p>
              </div>
            ) : (
              groups.map(g => (
                <div 
                  key={g.group_id} 
                  onClick={() => onOpenChat(g.group_id, g.group_name)}
                  className="group flex items-center px-4 py-4 bg-zinc-900/40 hover:bg-indigo-950/20 backdrop-blur-sm rounded-xl border border-white/5 hover:border-indigo-500/30 cursor-pointer transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-zinc-800/50 group-hover:bg-indigo-900/50 rounded-full flex items-center justify-center mr-4 border border-white/5 group-hover:border-indigo-500/30 transition-colors">
                    <Radio className="w-6 h-6 text-zinc-400 group-hover:text-indigo-400 transition-colors" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-base text-zinc-200 group-hover:text-white transition-colors">{g.group_name}</h4>
                    <p className="text-[10px] text-zinc-500 group-hover:text-indigo-400/70 font-mono mt-1 tracking-wider">FREQ: {g.frequency_key}</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-zinc-700 group-hover:bg-indigo-400 group-hover:shadow-[0_0_8px_rgba(129,140,248,0.8)] transition-all"></div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={onAddContact}
        className="absolute bottom-8 right-6 w-14 h-14 bg-cyan-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(8,145,178,0.4)] hover:bg-cyan-500 hover:shadow-[0_0_25px_rgba(8,145,178,0.6)] hover:scale-105 transition-all z-20 border border-cyan-400/50"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>
    </div>
  );
};
