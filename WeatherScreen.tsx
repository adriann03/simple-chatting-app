import React, { useState, useEffect } from 'react';
import { CloudRain, Wind, Droplets, MapPin, Sun, Cloud, CloudLightning, CloudSnow, CloudFog, Calendar, Clock, ChevronRight, ArrowLeft } from 'lucide-react';
import { startRainAmbient, stopRainAmbient, playWoosh } from '../services/audio';

interface Props {
  onSecretTrigger: () => void;
}

type WeatherType = 'clear' | 'cloudy' | 'rain' | 'thunderstorm' | 'snow' | 'fog';

interface HourlyForecast {
  time: string;
  temp: number;
  code: number;
}

interface DailyForecast {
  date: string;
  maxTemp: number;
  minTemp: number;
  code: number;
}

export const WeatherScreen: React.FC<Props> = ({ onSecretTrigger }) => {
  const [locationName, setLocationName] = useState('Mencari lokasi...');
  const [temperature, setTemperature] = useState<number | null>(null);
  const [weatherType, setWeatherType] = useState<WeatherType>('clear');
  
  // State untuk navigasi ke halaman ramalan detail
  const [showForecast, setShowForecast] = useState(false);
  
  // Forecast States
  const [hourlyData, setHourlyData] = useState<HourlyForecast[]>([]);
  const [dailyData, setDailyData] = useState<DailyForecast[]>([]);
  const [currentDetails, setCurrentDetails] = useState({ wind: 0, humidity: 0, high: 0, low: 0 });

  // WMO Weather Code Mapping
  const getWeatherTypeFromCode = (code: number): WeatherType => {
    if (code === 0) return 'clear';
    if (code >= 1 && code <= 3) return 'cloudy';
    if (code === 45 || code === 48) return 'fog';
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return 'snow';
    if (code >= 95 && code <= 99) return 'thunderstorm';
    return 'clear';
  };

  const getWeatherIcon = (code: number, className: string = "w-6 h-6") => {
    const type = getWeatherTypeFromCode(code);
    switch (type) {
      case 'clear': return <Sun className={`${className} text-yellow-400`} />;
      case 'cloudy': return <Cloud className={`${className} text-gray-300`} />;
      case 'rain': return <CloudRain className={`${className} text-blue-400`} />;
      case 'thunderstorm': return <CloudLightning className={`${className} text-yellow-500`} />;
      case 'snow': return <CloudSnow className={`${className} text-white`} />;
      case 'fog': return <CloudFog className={`${className} text-gray-400`} />;
      default: return <Sun className={`${className} text-yellow-400`} />;
    }
  };

  useEffect(() => {
    const fetchWeatherData = async () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              // Fetch Comprehensive Weather from Open-Meteo
              const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
              const weatherRes = await fetch(url);
              const data = await weatherRes.json();
              
              // Current
              const currentTemp = Math.round(data.current.temperature_2m);
              const currentCode = data.current.weather_code;
              setTemperature(currentTemp);
              
              const type = getWeatherTypeFromCode(currentCode);
              setWeatherType(type);
              
              setCurrentDetails({
                wind: Math.round(data.current.wind_speed_10m),
                humidity: Math.round(data.current.relative_humidity_2m),
                high: Math.round(data.daily.temperature_2m_max[0]),
                low: Math.round(data.daily.temperature_2m_min[0])
              });

              if (type === 'rain' || type === 'thunderstorm') {
                startRainAmbient();
              } else {
                stopRainAmbient();
              }

              // Hourly (Next 24 hours)
              const currentHourIndex = data.hourly.time.findIndex((t: string) => new Date(t).getTime() > Date.now());
              const startIndex = currentHourIndex > 0 ? currentHourIndex - 1 : 0;
              const hourly: HourlyForecast[] = [];
              for (let i = startIndex; i < startIndex + 24; i++) {
                if (data.hourly.time[i]) {
                  const date = new Date(data.hourly.time[i]);
                  hourly.push({
                    time: i === startIndex ? 'Sekarang' : `${date.getHours().toString().padStart(2, '0')}:00`,
                    temp: Math.round(data.hourly.temperature_2m[i]),
                    code: data.hourly.weather_code[i]
                  });
                }
              }
              setHourlyData(hourly);

              // Daily (Next 7 days)
              const daily: DailyForecast[] = [];
              for (let i = 0; i < 7; i++) {
                const date = new Date(data.daily.time[i]);
                const dayName = i === 0 ? 'Hari Ini' : date.toLocaleDateString('id-ID', { weekday: 'long' });
                daily.push({
                  date: dayName,
                  maxTemp: Math.round(data.daily.temperature_2m_max[i]),
                  minTemp: Math.round(data.daily.temperature_2m_min[i]),
                  code: data.daily.weather_code[i]
                });
              }
              setDailyData(daily);

              // Fetch City Name
              const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
              const geoData = await geoRes.json();
              const city = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.county || 'Lokasi Anda';
              setLocationName(city);

            } catch (error) {
              console.error("Error fetching weather/location", error);
              handleOfflineFallback();
            }
          },
          (error) => {
            console.error("Geolocation error", error);
            handleOfflineFallback('Akses Lokasi Ditolak');
          }
        );
      } else {
        handleOfflineFallback('Geolokasi tidak didukung');
      }
    };

    const handleOfflineFallback = (locName = 'Lokasi Tidak Diketahui') => {
      setLocationName(locName);
      setTemperature(28);
      setWeatherType('cloudy');
      setCurrentDetails({ wind: 12, humidity: 65, high: 32, low: 24 });
      
      // Mock Hourly
      const mockHourly = Array.from({length: 24}).map((_, i) => ({
        time: i === 0 ? 'Sekarang' : `${(new Date().getHours() + i) % 24}:00`,
        temp: 28 + Math.floor(Math.random() * 5) - 2,
        code: 3
      }));
      setHourlyData(mockHourly);

      // Mock Daily
      const days = ['Hari Ini', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const mockDaily = days.map(d => ({
        date: d,
        maxTemp: 32 + Math.floor(Math.random() * 3),
        minTemp: 24 + Math.floor(Math.random() * 2),
        code: 3
      }));
      setDailyData(mockDaily);
      
      stopRainAmbient();
    };

    fetchWeatherData();

    return () => {
      stopRainAmbient();
    };
  }, []);

  // Dynamic UI Configurations based on Weather Type
  const weatherConfig = {
    clear: {
      desc: 'Cerah',
      gradient: 'from-[#4facfe] to-[#00f2fe]',
      icon: <Sun className="w-40 h-40 text-yellow-300 animate-spin-slow drop-shadow-2xl" style={{ animationDuration: '20s' }} />
    },
    cloudy: {
      desc: 'Berawan',
      gradient: 'from-[#606c88] to-[#3f4c6b]',
      icon: <Cloud className="w-40 h-40 text-gray-300 animate-pulse drop-shadow-2xl" style={{ animationDuration: '4s' }} />
    },
    rain: {
      desc: 'Hujan',
      gradient: 'from-[#1a237e] to-[#000000]',
      icon: <CloudRain className="w-40 h-40 text-blue-300 animate-bounce drop-shadow-2xl" style={{ animationDuration: '3s' }} />
    },
    thunderstorm: {
      desc: 'Badai Petir',
      gradient: 'from-[#141E30] to-[#243B55]',
      icon: <CloudLightning className="w-40 h-40 text-yellow-500 animate-pulse drop-shadow-2xl" style={{ animationDuration: '2s' }} />
    },
    snow: {
      desc: 'Salju',
      gradient: 'from-[#8e9eab] to-[#eef2f3]',
      icon: <CloudSnow className="w-40 h-40 text-white animate-pulse drop-shadow-2xl" style={{ animationDuration: '3s' }} />
    },
    fog: {
      desc: 'Berkabut',
      gradient: 'from-[#757F9A] to-[#D7DDE8]',
      icon: <CloudFog className="w-40 h-40 text-gray-300 animate-pulse drop-shadow-2xl" style={{ animationDuration: '5s' }} />
    }
  };

  const currentConfig = weatherConfig[weatherType];

  // Generate random particles for Rain/Snow
  const particles = Array.from({ length: 40 }).map((_, i) => ({
    left: `${Math.random() * 100}%`,
    animationDuration: weatherType === 'snow' ? `${3 + Math.random() * 3}s` : `${0.5 + Math.random() * 0.5}s`,
    animationDelay: `${Math.random() * 2}s`,
    width: weatherType === 'snow' ? `${4 + Math.random() * 4}px` : '2px',
    height: weatherType === 'snow' ? `${4 + Math.random() * 4}px` : '40px',
    opacity: weatherType === 'snow' ? 0.8 : 0.5,
  }));

  return (
    <div className={`h-full w-full bg-gradient-to-b ${currentConfig.gradient} relative overflow-hidden transition-colors duration-1000`}>
      
      {/* Background Animations (Shared across both views) */}
      {weatherType === 'thunderstorm' && <div className="absolute inset-0 pointer-events-none z-0 thunder-bg"></div>}
      {(weatherType === 'rain' || weatherType === 'thunderstorm' || weatherType === 'snow') && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 fixed">
          {particles.map((style, i) => (
            <div key={i} className={weatherType === 'snow' ? 'snow-drop' : 'rain-drop'} style={style} />
          ))}
        </div>
      )}

      {/* VIEW 1: MAIN WEATHER SCREEN */}
      {!showForecast ? (
        <div className="flex flex-col items-center justify-center h-full w-full pb-10 z-10 relative">
          <div className="text-white text-center mb-8">
            <div className="flex items-center justify-center mb-2">
              <MapPin className="w-5 h-5 mr-2 opacity-80" />
              <h1 className="text-3xl font-light tracking-wide truncate max-w-[250px]">{locationName}</h1>
            </div>
            <p className="text-xl opacity-90 font-medium">{currentConfig.desc}</p>
          </div>

          <div className="relative mb-10">
            {currentConfig.icon}
          </div>

          {/* THE SECRET TRIGGER: Tap degree symbol once */}
          <div className="text-white text-8xl font-thin mb-12 select-none drop-shadow-lg tracking-tighter flex items-start justify-center">
            <span>{temperature !== null ? temperature : '--'}</span>
            <span 
              onClick={() => {
                stopRainAmbient();
                playWoosh();
                onSecretTrigger();
              }}
              className="cursor-default" // Stealthy: no pointer cursor on desktop
            >
              °
            </span>
          </div>

          <div className="flex w-full max-w-xs justify-between text-white opacity-90 px-6 bg-white/10 rounded-2xl py-4 backdrop-blur-sm border border-white/10 mb-8">
            <div className="flex flex-col items-center">
              <Wind className="w-7 h-7 mb-2 text-blue-200" />
              <span className="font-medium">{currentDetails.wind} km/h</span>
            </div>
            <div className="flex flex-col items-center">
              <Droplets className="w-7 h-7 mb-2 text-blue-200" />
              <span className="font-medium">{currentDetails.humidity}%</span>
            </div>
          </div>

          {/* Button to open Forecast Page */}
          <button 
            onClick={() => setShowForecast(true)}
            className="flex items-center text-white/90 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-6 py-3 rounded-full backdrop-blur-md border border-white/20 shadow-lg"
          >
            Prakiraan Lengkap <ChevronRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      ) : (
        /* VIEW 2: DETAILED FORECAST SCREEN (NEXT PAGE) */
        <div className="h-full w-full overflow-y-auto z-10 relative pb-10 flex flex-col animate-in slide-in-from-right-8 duration-300">
          
          {/* Header Forecast */}
          <div className="pt-12 pb-6 px-4 flex items-center sticky top-0 z-20 bg-gradient-to-b from-black/40 to-transparent">
            <button 
              onClick={() => setShowForecast(false)} 
              className="p-2 bg-white/10 rounded-full backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-medium text-white ml-4 drop-shadow-md">Prakiraan Cuaca</h2>
          </div>

          <div className="px-4 space-y-6 mt-2">
            
            {/* Current Summary Card */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 text-white shadow-lg flex items-center justify-between">
              <div>
                <h3 className="text-3xl font-light mb-1">{temperature}°C</h3>
                <p className="text-white/80 font-medium">{currentConfig.desc}</p>
                <p className="text-white/60 text-sm mt-1">H: {currentDetails.high}°  L: {currentDetails.low}°</p>
              </div>
              <div className="scale-75 origin-right">
                {currentConfig.icon}
              </div>
            </div>

            {/* Hourly Forecast (Horizontal Scroll) */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 text-white shadow-lg">
              <div className="flex items-center text-white/80 text-xs font-bold mb-5 uppercase tracking-wider">
                <Clock className="w-4 h-4 mr-2" />
                Prakiraan Per Jam
              </div>
              <div className="flex overflow-x-auto pb-2 space-x-6 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {hourlyData.map((hour, idx) => (
                  <div key={idx} className="flex flex-col items-center flex-shrink-0">
                    <span className="text-sm font-medium mb-3">{hour.time}</span>
                    {getWeatherIcon(hour.code, "w-8 h-8 mb-3")}
                    <span className="text-lg font-semibold">{hour.temp}°</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Forecast (Vertical List) */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 text-white shadow-lg">
              <div className="flex items-center text-white/80 text-xs font-bold mb-5 uppercase tracking-wider">
                <Calendar className="w-4 h-4 mr-2" />
                Prakiraan 7 Hari
              </div>
              <div className="space-y-5">
                {dailyData.map((day, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="w-24 text-base font-medium">{day.date}</span>
                    <div className="flex-1 flex justify-center">
                      {getWeatherIcon(day.code, "w-7 h-7")}
                    </div>
                    <div className="w-32 flex items-center justify-end space-x-3">
                      <span className="text-white/60 font-medium w-6 text-right">{day.minTemp}°</span>
                      {/* Temperature Bar Indicator */}
                      <div className="flex-1 h-1.5 bg-black/30 rounded-full overflow-hidden relative">
                        <div 
                          className="absolute h-full bg-gradient-to-r from-blue-400 to-orange-400 rounded-full"
                          style={{ 
                            left: `${Math.max(0, (day.minTemp / 40) * 100)}%`, 
                            right: `${Math.max(0, 100 - ((day.maxTemp / 40) * 100))}%` 
                          }}
                        />
                      </div>
                      <span className="text-white font-medium w-6 text-right">{day.maxTemp}°</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Extra Details */}
            <div className="grid grid-cols-2 gap-4 pb-6">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 text-white shadow-lg flex flex-col justify-between h-36">
                <div className="flex items-center text-white/80 text-xs font-bold uppercase tracking-wider">
                  <Wind className="w-4 h-4 mr-2" />
                  Angin
                </div>
                <div className="text-4xl font-light">{currentDetails.wind} <span className="text-lg font-medium">km/h</span></div>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-5 text-white shadow-lg flex flex-col justify-between h-36">
                <div className="flex items-center text-white/80 text-xs font-bold uppercase tracking-wider">
                  <Droplets className="w-4 h-4 mr-2" />
                  Kelembapan
                </div>
                <div className="text-4xl font-light">{currentDetails.humidity} <span className="text-lg font-medium">%</span></div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
