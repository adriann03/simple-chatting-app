import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, Radio, ArrowLeft, ShieldAlert } from 'lucide-react';
import { LocalSession, LocalMessage, LocalContact } from '../types';
import { getMessages, saveMessage, getContacts, addContact, syncFrequencyGroup } from '../services/db';

interface Props {
  session: LocalSession;
  onPanic: () => void;
}

export const ChatScreen: React.FC<Props> = ({ session, onPanic }) => {
  const [activeTab, setActiveTab] = useState<'CHATS' | 'SYNC'>('CHATS');
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [contacts, setContacts] = useState<LocalContact[]>([]);
  const [syncKeyword, setSyncKeyword] = useState('');
  const [syncStatus, setSyncStatus] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setContacts(getContacts());
    
    // Panic Button: Gyroscope Shake Detection
    const handleMotion = (e: DeviceMotionEvent) => {
      if (e.accelerationIncludingGravity) {
        const { x, y, z } = e.accelerationIncludingGravity;
        const acceleration = Math.sqrt((x || 0)**2 + (y || 0)**2 + (z || 0)**2);
        if (acceleration > 20) { // Shake threshold
          onPanic();
        }
      }
    };
    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [onPanic]);

  useEffect(() => {
    if (activeChat) {
      setMessages(getMessages(activeChat));
      scrollToBottom();
    }
  }, [activeChat]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSend = () => {
    if (!inputText.trim() || !activeChat) return;
    const newMsg = saveMessage({
      chat_id: activeChat,
      sender_id: session.my_id,
      message_text: inputText.trim()
    });
    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    scrollToBottom();
  };

  const handleSync = async () => {
    if (!syncKeyword.trim()) return;
    setSyncStatus('Mencari frekuensi...');
    const group = await syncFrequencyGroup(syncKeyword);
    if (group) {
      setSyncStatus(`Terhubung ke: ${group.group_name}`);
      addContact(group.group_id, group.group_name);
      setContacts(getContacts());
      setTimeout(() => {
        setActiveTab('CHATS');
        setActiveChat(group.group_id);
        setSyncKeyword('');
        setSyncStatus('');
      }, 1000);
    }
  };

  if (activeChat) {
    const chatName = contacts.find(c => c.contact_id === activeChat)?.contact_name || 'Unknown';
    return (
      <div className="h-full w-full bg-gray-950 text-gray-200 flex flex-col">
        {/* Chat Header */}
        <div className="bg-gray-900 p-4 flex items-center border-b border-gray-800">
          <button onClick={() => setActiveChat(null)} className="mr-4 p-2 rounded-full hover:bg-gray-800">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h3 className="font-bold">{chatName}</h3>
            <p className="text-xs text-gray-500">Encrypted Connection</p>
          </div>
          <button onClick={onPanic} className="p-2 text-red-500 hover:bg-gray-800 rounded-full" title="Panic Button">
            <ShieldAlert className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(msg => {
            const isMe = msg.sender_id === session.my_id;
            return (
              <div key={msg.message_id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none'}`}>
                  <p>{msg.message_text}</p>
                  <p className="text-[10px] opacity-50 text-right mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-gray-900 border-t border-gray-800 flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ketik pesan rahasia..."
            className="flex-1 bg-gray-800 text-white rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button onClick={handleSend} className="ml-2 p-2 bg-blue-600 rounded-full text-white">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-gray-950 text-gray-200 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 p-6 border-b border-gray-800 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Atmosphere</h2>
          <p className="text-xs text-gray-500 font-mono mt-1">ID: {session.my_id}</p>
        </div>
        <button onClick={onPanic} className="p-2 text-red-500 bg-red-500/10 rounded-full">
          <ShieldAlert className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        <button 
          className={`flex-1 py-3 flex justify-center items-center ${activeTab === 'CHATS' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('CHATS')}
        >
          <Users className="w-5 h-5 mr-2" /> Kontak
        </button>
        <button 
          className={`flex-1 py-3 flex justify-center items-center ${activeTab === 'SYNC' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('SYNC')}
        >
          <Radio className="w-5 h-5 mr-2" /> Freq Sync
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'CHATS' ? (
          <div className="p-2">
            {contacts.length === 0 ? (
              <div className="text-center text-gray-600 mt-10">Belum ada kontak. Gunakan Freq Sync.</div>
            ) : (
              contacts.map(c => (
                <div 
                  key={c.contact_id} 
                  onClick={() => setActiveChat(c.contact_id)}
                  className="p-4 border-b border-gray-800/50 flex items-center cursor-pointer hover:bg-gray-900"
                >
                  <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mr-4">
                    <Users className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{c.contact_name}</h4>
                    <p className="text-xs text-gray-500 font-mono">{c.contact_id}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="p-6 flex flex-col items-center justify-center h-full">
            <Radio className="w-16 h-16 text-blue-500 mb-6 animate-pulse" />
            <h3 className="text-lg font-bold mb-2 text-white">Frequency Sync</h3>
            <p className="text-sm text-gray-400 text-center mb-8">
              Masukkan kata kunci yang sama dengan teman Anda untuk terhubung secara anonim.
            </p>
            <input
              type="text"
              value={syncKeyword}
              onChange={e => setSyncKeyword(e.target.value)}
              placeholder="Contoh: alpha-tango-9"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-center text-white mb-4 focus:outline-none focus:border-blue-500"
            />
            <button 
              onClick={handleSync}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
            >
              Sinkronisasi
            </button>
            {syncStatus && <p className="mt-4 text-sm text-blue-400">{syncStatus}</p>}
          </div>
        )}
      </div>
    </div>
  );
};
