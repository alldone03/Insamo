import React, { useState, useEffect, useRef } from 'react';
import { Thermometer, Droplets, Gauge, Wind, ChevronLeft, ChevronRight, Maximize } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Mock data untuk grafik
const generateMockChartData = () => {
   const data = [];
   const times = ['10:00', '13:00', '16:00', '19:00', '22:00', '01:00', '04:00', '07:00'];
   times.forEach((time) => {
      data.push({
         time,
         temperature: 25 + Math.random() * 5,
         humidity: 60 + Math.random() * 20,
         pressure: 1005 + Math.random() * 10,
         windSpeed: 2 + Math.random() * 8,
      });
   });
   return data;
};

const chartData = generateMockChartData();

const Weather = () => {
   const [currentWeather, setCurrentWeather] = useState({
      temperature: 0,
      humidity: 0,
      pressure: 0,
      wind_speed: 0,
      lastUpdated: '',
   });
   const [loading, setLoading] = useState(true);
   
   // Ref untuk fitur scroll horizontal pada kartu
   const scrollContainerRef = useRef(null);

   // GANTI DENGAN API KEY OPENWEATHERMAP MILIKMU
   const API_KEY = 'e04f2e96a08e807e28cde3851558cff6'; 
   const CITY = 'Surabaya'; 

   const fetchWeather = async () => {
      try {
         const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${API_KEY}&units=metric`);
         const data = await response.json();
         
         if (response.ok) {
            const now = new Date();
            const formattedDate = `${now.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}, ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

            setCurrentWeather({
               temperature: data.main.temp,
               humidity: data.main.humidity,
               pressure: data.main.pressure,
               wind_speed: data.wind.speed * 3.6, // m/s ke km/h
               lastUpdated: formattedDate,
            });
         } else {
            console.error("Error from API:", data.message);
         }
      } catch (error) {
         console.error("Failed to fetch weather:", error);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchWeather();
      const interval = setInterval(fetchWeather, 600000); // 10 menit
      return () => clearInterval(interval);
   }, []);

   // Fungsi untuk scroll horizontal menggunakan tombol
   const scroll = (direction) => {
      if (scrollContainerRef.current) {
         const scrollAmount = direction === 'left' ? -300 : 300;
         scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
   };

   if (loading) {
      return (
         <div className="flex justify-center items-center h-64">
            <span className="loading loading-spinner loading-lg text-blue-500"></span>
         </div>
      );
   }

   return (
      <div className="p-4 md:p-6 bg-[#A8D1DF] min-h-screen font-sans overflow-x-hidden">
         <h1 className="text-2xl md:text-3xl font-extrabold text-black mb-4 md:mb-6">Weather</h1>

         {/* --- TOP CARDS SECTION --- */}
         {/* Tambahkan class group untuk memunculkan tombol panah hanya saat kursor mendekat (di desktop) */}
         <div className="relative flex items-center mb-6 md:mb-8 group">
            
            {/* Tombol Kiri (Disembunyikan di Mobile) */}
            <button 
               onClick={() => scroll('left')}
               className="hidden md:flex absolute left-0 z-10 -ml-4 bg-white rounded-full p-2 shadow hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
            >
               <ChevronLeft size={24} className="text-gray-600" />
            </button>
            
            {/* Container Kartu: 
                - overflow-x-auto untuk scroll horizontal 
                - snap-x agar scroll-nya pas berhenti di setiap kartu (seperti carousel)
                - menyembunyikan scrollbar bawaan browser
            */}
            <div 
               ref={scrollContainerRef}
               className="flex w-full gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 pt-2 -mt-2 px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
            >
               
               {/* Temperature Card */}
               <div className="snap-center shrink-0 w-[85%] sm:w-auto sm:flex-1 sm:min-w-[200px] bg-[#67D4E1] rounded-xl p-4 md:p-5 text-slate-800 shadow-md relative transition-transform hover:scale-[1.02]">
                  <h3 className="text-base md:text-lg font-bold">Temperature</h3>
                  <p className="text-[10px] md:text-xs mb-3 md:mb-4 opacity-80">Average temperature is:</p>
                  <div className="flex justify-between items-end">
                     <Thermometer size={40} className="opacity-70 md:w-12 md:h-12" />
                     <div className="text-right">
                        <p className="text-3xl lg:text-4xl font-black">{currentWeather.temperature.toFixed(1)}°C</p>
                        <p className="text-[9px] mt-1 md:mt-2 opacity-70">Last updated: {currentWeather.lastUpdated}</p>
                     </div>
                  </div>
               </div>

               {/* Humidity Card */}
               <div className="snap-center shrink-0 w-[85%] sm:w-auto sm:flex-1 sm:min-w-[200px] bg-[#4DE3DD] rounded-xl p-4 md:p-5 text-slate-800 shadow-md relative transition-transform hover:scale-[1.02]">
                  <h3 className="text-base md:text-lg font-bold">Humidity</h3>
                  <p className="text-[10px] md:text-xs mb-3 md:mb-4 opacity-80">Average air humidity is:</p>
                  <div className="flex justify-between items-end">
                     <Droplets size={40} className="opacity-70 md:w-12 md:h-12" />
                     <div className="text-right">
                        <p className="text-3xl lg:text-4xl font-black">{currentWeather.humidity}%</p>
                        <p className="text-[9px] mt-1 md:mt-2 opacity-70">Last updated: {currentWeather.lastUpdated}</p>
                     </div>
                  </div>
               </div>

               {/* Air Pressure Card */}
               <div className="snap-center shrink-0 w-[85%] sm:w-auto sm:flex-1 sm:min-w-[200px] bg-[#F7D046] rounded-xl p-4 md:p-5 text-slate-800 shadow-md relative transition-transform hover:scale-[1.02]">
                  <h3 className="text-base md:text-lg font-bold">Air Pressure</h3>
                  <p className="text-[10px] md:text-xs mb-3 md:mb-4 opacity-80">Average air pressure is:</p>
                  <div className="flex justify-between items-end">
                     <Gauge size={40} className="opacity-70 md:w-12 md:h-12" />
                     <div className="text-right">
                        <p className="text-3xl lg:text-4xl font-black">{currentWeather.pressure}hPa</p>
                        <p className="text-[9px] mt-1 md:mt-2 opacity-70">Last updated: {currentWeather.lastUpdated}</p>
                     </div>
                  </div>
               </div>

               {/* Wind Speed Card */}
               <div className="snap-center shrink-0 w-[85%] sm:w-auto sm:flex-1 sm:min-w-[200px] bg-[#C5E1A5] rounded-xl p-4 md:p-5 text-slate-800 shadow-md relative transition-transform hover:scale-[1.02]">
                  <h3 className="text-base md:text-lg font-bold">Wind Speed</h3>
                  <p className="text-[10px] md:text-xs mb-3 md:mb-4 opacity-80">Average wind speed is:</p>
                  <div className="flex justify-between items-end">
                     <Wind size={40} className="opacity-70 md:w-12 md:h-12" />
                     <div className="text-right">
                        <p className="text-3xl lg:text-4xl font-black">{currentWeather.wind_speed.toFixed(1)}<span className="text-base lg:text-2xl font-bold">km/h</span></p>
                        <p className="text-[9px] mt-1 md:mt-2 opacity-70">Last updated: {currentWeather.lastUpdated}</p>
                     </div>
                  </div>
               </div>

            </div>

            {/* Tombol Kanan (Disembunyikan di Mobile) */}
            <button 
               onClick={() => scroll('right')}
               className="hidden md:flex absolute right-0 z-10 -mr-4 bg-white rounded-full p-2 shadow hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
            >
               <ChevronRight size={24} className="text-gray-600" />
            </button>
         </div>

         {/* --- CHARTS SECTION --- */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            
            {/* Temperature Chart */}
            <div className="bg-white rounded-xl shadow-md p-4">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm md:text-base font-bold text-gray-800">Temperature Chart</h3>
                  <Maximize size={18} className="text-gray-400 cursor-pointer hover:text-gray-600" />
               </div>
               <div className="h-56 md:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                           <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#FF8FA3" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#FF8FA3" stopOpacity={0.2}/>
                           </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                        <XAxis dataKey="time" tick={{fontSize: 10}} md={{fontSize: 12}} tickLine={false} axisLine={false} />
                        <YAxis tick={{fontSize: 10}} md={{fontSize: 12}} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Legend verticalAlign="top" height={36} iconType="square" formatter={() => <span className="text-xs md:text-sm font-semibold text-gray-700">Temperature (°C)</span>} />
                        <Area type="monotone" dataKey="temperature" stroke="#FF8FA3" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" />
                     </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* Humidity Chart */}
            <div className="bg-white rounded-xl shadow-md p-4">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm md:text-base font-bold text-gray-800">Humidity Chart</h3>
                  <Maximize size={18} className="text-gray-400 cursor-pointer hover:text-gray-600" />
               </div>
               <div className="h-56 md:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                           <linearGradient id="colorHumid" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#60A5FA" stopOpacity={0.2}/>
                           </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                        <XAxis dataKey="time" tick={{fontSize: 10}} md={{fontSize: 12}} tickLine={false} axisLine={false} />
                        <YAxis tick={{fontSize: 10}} md={{fontSize: 12}} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Legend verticalAlign="top" height={36} iconType="square" formatter={() => <span className="text-xs md:text-sm font-semibold text-gray-700">Humidity (%)</span>} />
                        <Area type="stepAfter" dataKey="humidity" stroke="#60A5FA" strokeWidth={3} fillOpacity={1} fill="url(#colorHumid)" />
                     </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* Air Pressure Chart */}
            <div className="bg-white rounded-xl shadow-md p-4">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm md:text-base font-bold text-gray-800">Air Pressure Chart</h3>
                  <Maximize size={18} className="text-gray-400 cursor-pointer hover:text-gray-600" />
               </div>
               <div className="h-56 md:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                           <linearGradient id="colorPress" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6EE7B7" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#6EE7B7" stopOpacity={0.2}/>
                           </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                        <XAxis dataKey="time" tick={{fontSize: 10}} md={{fontSize: 12}} tickLine={false} axisLine={false} />
                        <YAxis domain={[900, 1100]} tick={{fontSize: 10}} md={{fontSize: 12}} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Legend verticalAlign="top" height={36} iconType="square" formatter={() => <span className="text-xs md:text-sm font-semibold text-gray-700">pressures (hPa)</span>} />
                        <Area type="monotone" dataKey="pressure" stroke="#6EE7B7" strokeWidth={3} fillOpacity={1} fill="url(#colorPress)" />
                     </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* Wind Speed Chart */}
            <div className="bg-white rounded-xl shadow-md p-4">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm md:text-base font-bold text-gray-800">Wind Speed Chart</h3>
                  <Maximize size={18} className="text-gray-400 cursor-pointer hover:text-gray-600" />
               </div>
               <div className="h-56 md:h-64">
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                           <linearGradient id="colorWind" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#FCD34D" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#FCD34D" stopOpacity={0.2}/>
                           </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                        <XAxis dataKey="time" tick={{fontSize: 10}} md={{fontSize: 12}} tickLine={false} axisLine={false} />
                        <YAxis tick={{fontSize: 10}} md={{fontSize: 12}} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Legend verticalAlign="top" height={36} iconType="square" formatter={() => <span className="text-xs md:text-sm font-semibold text-gray-700">wind speed (km/h)</span>} />
                        <Area type="stepBefore" dataKey="windSpeed" stroke="#FCD34D" strokeWidth={3} fillOpacity={1} fill="url(#colorWind)" />
                     </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>

         </div>
      </div>
   );
};

export default Weather;