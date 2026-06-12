import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, MoreVertical, Paperclip, Camera, Mic, Image as ImageIcon, FileText, X, Square, Lock, Check, CheckCheck, Smile, Ghost, Skull, Eye, Bot, Flame, Zap, UserCircle, Plus } from 'lucide-react';
import { LocalSession, LocalMessage, MessageType } from '../types';
import { getMessages, saveMessage, markMessagesAsReadLocal } from '../services/db';
import { showStealthNotification } from '../services/notification';
import { socket } from '../services/socket';

interface Props {
  session: LocalSession;
  chatId: string;
  chatName: string;
  onBack: () => void;
  onPanic: () => void;
}

export const ChatRoom: React.FC<Props> = ({ session, chatId, chatName, onBack, onPanic }) => {
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showStickerMenu, setShowStickerMenu] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper untuk menentukan Room ID (Grup vs Personal)
  const getRoomName = () => {
    // Jika ID diawali 'grp_', berarti ini grup chat. Jika tidak, ini personal chat (gabungan 2 ID diurutkan)
    return chatId.startsWith('grp_') ? chatId : [session.my_id, chatId].sort().join('_');
  };

  useEffect(() => {
    setMessages(getMessages(chatId));
    scrollToBottom();
    
    socket.connect();
    const roomName = getRoomName();
    socket.emit('join_chat', roomName);

    const handleReceiveMessage = (incomingMsg: LocalMessage) => {
      if (incomingMsg.sender_id !== session.my_id) {
        const savedMsg = saveMessage(incomingMsg);
        if (savedMsg) {
          setMessages(prev => [...prev, savedMsg]);
          scrollToBottom();
          showStealthNotification();
        }
      }
    };

    const handleMessagesRead = ({ messageIds }: { messageIds: string[] }) => {
      markMessagesAsReadLocal(messageIds);
      setMessages(prev => prev.map(m => 
        messageIds.includes(m.message_id) ? { ...m, is_read: true } : m
      ));
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('messages_read', handleMessagesRead);

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
    
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('messages_read', handleMessagesRead);
      socket.disconnect();
      
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [chatId, onPanic, isRecording, session.my_id]);

  useEffect(() => {
    const unreadIds = messages
      .filter(m => m.sender_id !== session.my_id && !m.is_read)
      .map(m => m.message_id);

    if (unreadIds.length > 0) {
      markMessagesAsReadLocal(unreadIds);
      setMessages(prev => prev.map(m => 
        unreadIds.includes(m.message_id) ? { ...m, is_read: true } : m
      ));
      
      const roomName = getRoomName();
      socket.emit('mark_messages_read', { roomName, messageIds: unreadIds });
    }
  }, [messages, session.my_id, chatId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendText = () => {
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText('');
    setShowStickerMenu(false);
    
    const newMsg = saveMessage({
      chat_id: chatId,
      sender_id: session.my_id,
      message_type: 'text',
      message_text: text,
      is_read: false
    });
    
    if (newMsg) {
      setMessages(prev => [...prev, newMsg]);
      scrollToBottom();
      const roomName = getRoomName();
      socket.emit('send_message', { roomName, message: newMsg });
    }
  };

  const handleSendMedia = (type: MessageType, data: string, fileName?: string) => {
    const newMsg = saveMessage({
      chat_id: chatId,
      sender_id: session.my_id,
      message_type: type,
      message_text: type === 'sticker' ? data : '',
      media_data: type !== 'sticker' ? data : undefined,
      file_name: fileName,
      is_read: false
    });
    
    if (newMsg) {
      setMessages(prev => [...prev, newMsg]);
      scrollToBottom();
      const roomName = getRoomName();
      socket.emit('send_message', { roomName, message: newMsg });
    }
    setShowAttachMenu(false);
    setShowStickerMenu(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          let width = img.width;
          let height = img.height;
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const resizedBase64 = canvas.toDataURL('image/jpeg', 0.6);
          handleSendMedia('image', resizedBase64);
        };
        img.src = base64String;
      };
      reader.readAsDataURL(file);
    }
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleSendMedia('file', 'dummy_data', file.name);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          handleSendMedia('audio', base64Audio);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error("Microphone access denied", err);
      alert("Akses mikrofon ditolak.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = () => {
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // --- Sticker Rendering Logic ---
  const renderSticker = (stickerId: string) => {
    const stickerClass = "w-28 h-28 animate-pulse";
    switch (stickerId) {
      case 'ghost': return <Ghost className={`${stickerClass} text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.8)]`} />;
      case 'skull': return <Skull className={`${stickerClass} text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]`} />;
      case 'eye': return <Eye className={`${stickerClass} text-indigo-400 drop-shadow-[0_0_20px_rgba(129,140,248,0.8)]`} />;
      case 'bot': return <Bot className={`${stickerClass} text-green-400 drop-shadow-[0_0_20px_rgba(74,222,128,0.8)]`} />;
      case 'flame': return <Flame className={`${stickerClass} text-orange-500 drop-shadow-[0_0_20px_rgba(249,115,22,0.8)]`} />;
      case 'zap': return <Zap className={`${stickerClass} text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]`} />;
      default: return <Ghost className={`${stickerClass} text-cyan-400`} />;
    }
  };

  const renderMessageContent = (msg: LocalMessage) => {
    switch (msg.message_type) {
      case 'image':
        return (
          <div className="mt-1 mb-1">
            <img src={msg.media_data} alt="Sent image" className="max-w-full h-auto rounded-lg max-h-64 object-cover border border-white/10" />
          </div>
        );
      case 'audio':
        return (
          <div className="mt-1 mb-1 flex items-center space-x-2 bg-black/30 p-2 rounded-full border border-white/5">
            <Mic className="w-4 h-4 text-cyan-400" />
            <audio controls src={msg.media_data} className="h-8 w-48 outline-none opacity-80" />
          </div>
        );
      case 'file':
        return (
          <div className="mt-1 mb-1 flex items-center space-x-3 bg-black/30 p-3 rounded-lg border border-white/5">
            <div className="bg-cyan-500/20 p-2 rounded-full">
              <FileText className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate text-zinc-200">{msg.file_name}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">Encrypted File</p>
            </div>
          </div>
        );
      case 'sticker':
        return (
          <div className="mt-2 mb-2 flex justify-center">
            {renderSticker(msg.message_text)}
          </div>
        );
      default:
        return <p className="break-words pr-12 pb-1 leading-relaxed text-[15px]">{msg.message_text}</p>;
    }
  };

  return (
    <div className="h-full w-full bg-[#050505] text-zinc-200 flex flex-col font-sans relative overflow-hidden">
      <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageUpload} className="hidden" />
      <input type="file" accept="*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

      {/* Mysterious Background */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-10" 
           style={{ backgroundImage: 'linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>
      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.05),transparent_50%)]"></div>

      {/* Floating Glass Header */}
      <div className="px-4 py-3 flex items-center z-20 bg-black/50 backdrop-blur-xl border-b border-white/5 shadow-lg">
        <button onClick={onBack} className="p-2 flex items-center text-zinc-400 hover:text-cyan-400 hover:bg-cyan-950/30 rounded-full transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="w-10 h-10 bg-zinc-900 border border-cyan-900/50 rounded-full ml-2 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
          <span className="text-lg font-bold text-cyan-500">{chatName.charAt(0).toUpperCase()}</span>
        </div>
        
        <div className="flex-1 ml-3 cursor-pointer overflow-hidden">
          <h3 className="font-semibold text-base leading-tight truncate text-zinc-100">{chatName}</h3>
          <div className="flex items-center mt-0.5">
            <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse mr-1.5 shadow-[0_0_5px_#06b6d4]"></div>
            <p className="text-[10px] text-cyan-500/70 font-mono tracking-widest">SECURE LINK</p>
          </div>
        </div>
        
        <div className="flex space-x-1 text-zinc-400 px-1">
          <button className="p-2 hover:text-cyan-400 hover:bg-cyan-950/30 rounded-full transition-all"><MoreVertical className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 z-10" onClick={() => { setShowAttachMenu(false); setShowStickerMenu(false); }}>
        
        {/* Terminal-like Encryption Notice */}
        <div className="flex justify-center mb-8 mt-2">
          <div className="bg-cyan-950/20 border border-cyan-900/50 text-cyan-500/80 text-[10px] font-mono px-4 py-2 rounded-md text-center max-w-[90%] shadow-[0_0_15px_rgba(6,182,212,0.05)] flex items-center">
            <Lock className="w-3 h-3 mr-2" />
            <span>CONNECTION ESTABLISHED. END-TO-END ENCRYPTION ACTIVE.</span>
          </div>
        </div>

        {messages.map(msg => {
          const isMe = msg.sender_id === session.my_id;
          const isSticker = msg.message_type === 'sticker';
          
          return (
            <div key={msg.message_id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end space-x-2`}>
              
              {/* LINE-style Sender Avatar for incoming messages */}
              {!isMe && (
                <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700 flex-shrink-0 mb-1">
                  <UserCircle className="w-5 h-5 text-zinc-400" />
                </div>
              )}

              <div className={`relative max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                
                {/* Bubble Container */}
                <div 
                  className={`
                    ${isSticker ? 'bg-transparent shadow-none' : 'px-3.5 py-2.5 shadow-lg backdrop-blur-md border'}
                    ${!isSticker && isMe ? 'bg-gradient-to-br from-cyan-950/60 to-blue-950/40 border-cyan-500/30 text-cyan-50 rounded-2xl rounded-br-sm shadow-[0_0_15px_rgba(6,182,212,0.1)]' : ''}
                    ${!isSticker && !isMe ? 'bg-gradient-to-br from-zinc-800/60 to-zinc-900/60 border-zinc-700/50 text-zinc-200 rounded-2xl rounded-bl-sm' : ''}
                  `}
                >
                  {renderMessageContent(msg)}
                  
                  {/* Timestamp & Read Receipt (Inside bubble for text/media, outside for stickers) */}
                  {!isSticker && (
                    <div className={`absolute bottom-1.5 right-2.5 flex items-center space-x-1 ${msg.message_type === 'image' ? 'bg-black/50 px-1.5 rounded-full backdrop-blur-sm' : ''}`}>
                      <span className={`text-[9px] font-mono tracking-wider ${isMe ? 'text-cyan-400/70' : 'text-zinc-500'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                      {isMe && (
                        msg.is_read ? (
                          <CheckCheck className="w-3.5 h-3.5 text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)] ml-0.5" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-cyan-800 ml-0.5" />
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* Timestamp & Read Receipt for Stickers (Floating below) */}
                {isSticker && (
                  <div className="flex items-center space-x-1 mt-1 px-1">
                    <span className="text-[10px] font-mono tracking-wider text-zinc-500">
                      {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    {isMe && (
                      msg.is_read ? (
                        <CheckCheck className="w-3.5 h-3.5 text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)] ml-0.5" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-zinc-600 ml-0.5" />
                      )
                    )}
                  </div>
                )}

              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Sticker Menu Popup */}
      {showStickerMenu && (
        <div className="absolute bottom-24 left-0 right-0 mx-4 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 z-20 animate-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center mb-3 border-b border-white/10 pb-2">
            <h4 className="text-xs font-mono text-cyan-500 tracking-widest">HOLOGRAM STICKERS</h4>
            <button onClick={() => setShowStickerMenu(false)} className="text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-3 gap-4 justify-items-center py-2">
            {['ghost', 'skull', 'eye', 'bot', 'flame', 'zap'].map((stickerId) => (
              <button 
                key={stickerId}
                onClick={() => handleSendMedia('sticker', stickerId)}
                className="p-3 hover:bg-white/5 rounded-xl transition-all hover:scale-110"
              >
                {renderSticker(stickerId)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Attachment Menu Popup */}
      {showAttachMenu && (
        <div className="absolute bottom-24 left-4 bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 flex space-x-6 z-20 animate-in slide-in-from-bottom-2">
          <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center space-y-2 group">
            <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center group-hover:bg-indigo-500/20 group-hover:border-indigo-500/50 border border-transparent transition-all">
              <FileText className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="text-[10px] font-mono text-zinc-400">DOC</span>
          </button>
          <button onClick={() => imageInputRef.current?.click()} className="flex flex-col items-center space-y-2 group">
            <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center group-hover:bg-pink-500/20 group-hover:border-pink-500/50 border border-transparent transition-all">
              <ImageIcon className="w-5 h-5 text-pink-400" />
            </div>
            <span className="text-[10px] font-mono text-zinc-400">IMG</span>
          </button>
          <button onClick={() => imageInputRef.current?.click()} className="flex flex-col items-center space-y-2 group">
            <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center group-hover:bg-cyan-500/20 group-hover:border-cyan-500/50 border border-transparent transition-all">
              <Camera className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="text-[10px] font-mono text-zinc-400">CAM</span>
          </button>
        </div>
      )}

      {/* Floating Input Dock */}
      <div className="p-4 z-20 bg-gradient-to-t from-black via-black/90 to-transparent pb-6">
        <div className="flex items-end space-x-2">
          
          {/* Attachment Button */}
          <button 
            onClick={() => { setShowAttachMenu(!showAttachMenu); setShowStickerMenu(false); }}
            className="w-[44px] h-[44px] bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-zinc-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all flex-shrink-0"
          >
            <Plus className="w-5 h-5" />
          </button>

          {isRecording ? (
            <div className="flex-1 bg-zinc-900/80 backdrop-blur-xl border border-red-900/50 rounded-full flex items-center justify-between px-5 py-3 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
              <div className="flex items-center text-red-500 animate-pulse">
                <Mic className="w-5 h-5 mr-3" />
                <span className="font-mono text-sm tracking-widest">{formatTime(recordingTime)}</span>
              </div>
              <button onClick={cancelRecording} className="text-zinc-500 hover:text-red-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex-1 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl flex items-end min-h-[44px] px-2 py-1 shadow-lg focus-within:border-cyan-500/50 focus-within:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all">
              <button 
                onClick={() => { setShowStickerMenu(!showStickerMenu); setShowAttachMenu(false); }}
                className="p-2 text-zinc-500 hover:text-cyan-400 transition-colors"
              >
                <Smile className="w-5 h-5" />
              </button>
              <textarea
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendText();
                  }
                }}
                placeholder="Transmit message..."
                className="flex-1 bg-transparent text-zinc-200 max-h-32 outline-none resize-none py-2 px-2 text-[15px] leading-tight placeholder-zinc-600 font-sans"
                rows={1}
              />
            </div>
          )}
          
          {inputText.trim() ? (
            <button 
              onClick={handleSendText} 
              className="w-[44px] h-[44px] bg-cyan-600 rounded-full flex items-center justify-center text-white flex-shrink-0 hover:bg-cyan-500 transition-all shadow-[0_0_15px_rgba(8,145,178,0.4)] border border-cyan-400/50"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          ) : (
            <button 
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-[44px] h-[44px] rounded-full flex items-center justify-center text-white flex-shrink-0 transition-all border ${
                isRecording 
                  ? 'bg-red-600 hover:bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] border-red-400/50' 
                  : 'bg-zinc-800 hover:bg-zinc-700 border-white/10 hover:border-cyan-500/30 hover:text-cyan-400'
              }`}
            >
              {isRecording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
