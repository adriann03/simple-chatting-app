import React, { useState, useEffect } from 'react';
import { AppScreen, LocalSession } from './types';
import { initDB, getSession, createSession, lockSession } from './services/db';
import { SplashScreen } from './components/SplashScreen';
import { SetupScreen } from './components/SetupScreen';
import { WeatherScreen } from './components/WeatherScreen';
import { PinScreen } from './components/PinScreen';
import { ChatDashboard } from './components/ChatDashboard';
import { ChatRoom } from './components/ChatRoom';
import { AddContactScreen } from './components/AddContactScreen';
import { ProfileScreen } from './components/ProfileScreen';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('SPLASH');
  const [session, setSession] = useState<LocalSession | null>(null);
  
  const [activeChatId, setActiveChatId] = useState<string>('');
  const [activeChatName, setActiveChatName] = useState<string>('');

  useEffect(() => {
    const s = initDB();
    setSession(s);

    // FITUR BIOMETRIC PANIC LOCK (AppLifecycleState Equivalent)
    // Mendeteksi jika aplikasi masuk ke background (paused/detached)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const currentSession = getSession();
        // Jika user sedang berada di dalam area rahasia (sudah login)
        if (currentSession && currentSession.is_logged_in) {
          lockSession(); // Kunci sesi di database lokal
          setSession(getSession()); // Perbarui state sesi
          setCurrentScreen('WEATHER'); // Otomatis tendang kembali ke halaman cuaca
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleSplashComplete = () => {
    if (session) {
      setCurrentScreen('WEATHER');
    } else {
      setCurrentScreen('SETUP');
    }
  };

  const handleSetupComplete = (username: string, pin: string, customId: string) => {
    const newSession = createSession(username, pin, customId);
    setSession(newSession);
    setCurrentScreen('WEATHER');
  };

  const handleSecretTrigger = () => setCurrentScreen('PIN');
  
  const handlePinSuccess = () => {
    const s = getSession();
    if (s) {
      s.is_logged_in = true;
      setSession(s);
    }
    setCurrentScreen('DASHBOARD');
  };

  const handlePinFail = () => setCurrentScreen('WEATHER');
  
  const handlePanicWipe = () => {
    const s = initDB(); 
    setSession(s);
    setCurrentScreen('WEATHER');
  };

  const handlePanic = () => {
    lockSession();
    setSession(getSession());
    setCurrentScreen('WEATHER');
  };

  const handleOpenChat = (id: string, name: string) => {
    setActiveChatId(id);
    setActiveChatName(name);
    setCurrentScreen('CHAT_ROOM');
  };

  const handleAddContact = () => setCurrentScreen('ADD_CONTACT');
  const handleOpenProfile = () => setCurrentScreen('PROFILE');
  const handleBackToDashboard = () => {
    // Refresh session in case profile was updated
    setSession(getSession());
    setCurrentScreen('DASHBOARD');
  };

  return (
    <div className="h-full w-full bg-black">
      {currentScreen === 'SPLASH' && <SplashScreen onComplete={handleSplashComplete} />}
      
      {currentScreen === 'SETUP' && <SetupScreen onComplete={handleSetupComplete} />}

      {currentScreen === 'WEATHER' && <WeatherScreen onSecretTrigger={handleSecretTrigger} />}
      
      {currentScreen === 'PIN' && session && (
        <PinScreen 
          correctPin={session.pin} 
          onSuccess={handlePinSuccess} 
          onFail={handlePinFail}
          onPanicWipe={handlePanicWipe}
        />
      )}
      
      {currentScreen === 'DASHBOARD' && session && (
        <ChatDashboard 
          session={session} 
          onPanic={handlePanic} 
          onOpenChat={handleOpenChat}
          onAddContact={handleAddContact}
          onOpenProfile={handleOpenProfile}
        />
      )}

      {currentScreen === 'CHAT_ROOM' && session && (
        <ChatRoom 
          session={session}
          chatId={activeChatId}
          chatName={activeChatName}
          onBack={handleBackToDashboard}
          onPanic={handlePanic}
        />
      )}

      {currentScreen === 'ADD_CONTACT' && (
        <AddContactScreen onBack={handleBackToDashboard} />
      )}

      {currentScreen === 'PROFILE' && session && (
        <ProfileScreen session={session} onBack={handleBackToDashboard} />
      )}
    </div>
  );
};

export default App;
