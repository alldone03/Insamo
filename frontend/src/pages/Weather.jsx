import React, { useState, useEffect } from 'react';
import { CloudSun, CloudRain, Sun, Wind, Droplets, Thermometer, Gauge } from 'lucide-react';
import { api } from '../lib/api';

const Weather = () => {
   const [weather, setWeather] = useState(null);
   const [loading, setLoading] = useState(true);

   const fetchLatestWeather = async () => {
      try {
         const response = await api.get('/weather/latest');
         setWeather(response.data);
      } catch (error) {
         console.error("Error fetching weather:", error);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      fetchLatestWeather();
      const interval = setInterval(fetchLatestWeather, 10000); // Update every 10s
      return () => clearInterval(interval);
   }, []);

   if (loading && !weather) {
      return (
         <div className="flex justify-center items-center h-64">
            <span className="loading loading-spinner loading-lg text-primary"></span>
         </div>
      );
   }

   return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
         <div className="card bg-gradient-to-br from-blue-600 to-indigo-400 text-white shadow-2xl border-none">
            <div className="card-body p-8">
               <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="text-center md:text-left">
                     <div className="flex items-center gap-2 mb-1">
                        <Sun className="text-yellow-400" size={20} />
                        <h2 className="text-3xl font-black italic tracking-tighter">SURABAYA, ID</h2>
                     </div>
                     <p className="opacity-75 font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>

                     <div className="flex items-center gap-6 mt-6 justify-center md:justify-start">
                        <span className="text-8xl font-black italic tracking-tighter">
                           {weather?.temperature?.toFixed(1) || '--'}° <span className="text-3xl align-top">C</span>
                        </span>
                        <div className="text-sm border-l border-white/30 pl-6 h-full flex flex-col justify-center">
                           <p className="font-bold opacity-60 uppercase tracking-widest text-[10px]">Condition</p>
                           <p className="text-xl font-black italic uppercase italic">Clear Skies</p>
                           <p className="text-xs opacity-75">H:{((weather?.temperature || 0) + 2).toFixed(0)}° L:{((weather?.temperature || 0) - 2).toFixed(0)}°</p>
                        </div>
                     </div>
                  </div>
                  <div className="relative">
                     <Sun size={120} className="text-yellow-400 animate-pulse" />
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-150 blur-3xl opacity-30 bg-white w-full h-full rounded-full"></div>
                  </div>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/20">
                  <div className="flex flex-col items-center gap-2 p-2 border-r border-white/10 last:border-0">
                     <Thermometer size={24} className="text-white" />
                     <div className="text-center">
                        <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Temperature</p>
                        <p className="text-xl font-black italic">{weather?.temperature?.toFixed(1)}°C</p>
                        <p className="text-[9px] opacity-70">Average temperature is: {((weather?.temperature || 0) - 0.5).toFixed(1)}°C</p>
                     </div>
                  </div>

                  <div className="flex flex-col items-center gap-2 p-2 border-r border-white/10 last:border-0">
                     <Droplets size={24} className="text-cyan-300" />
                     <div className="text-center">
                        <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Humidity</p>
                        <p className="text-xl font-black italic">{weather?.humidity?.toFixed(0)}%</p>
                        <p className="text-[9px] opacity-70">Average air humidity is: {((weather?.humidity || 0) - 5).toFixed(0)}%</p>
                     </div>
                  </div>

                  <div className="flex flex-col items-center gap-2 p-2 border-r border-white/10 last:border-0">
                     <Gauge size={24} className="text-orange-300" />
                     <div className="text-center">
                        <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Air Pressure</p>
                        <p className="text-xl font-black italic">{weather?.pressure?.toFixed(0)}hPa</p>
                        <p className="text-[9px] opacity-70">Average air pressure is: {weather?.pressure?.toFixed(0)}hPa</p>
                     </div>
                  </div>

                  <div className="flex flex-col items-center gap-2 p-2 border-r border-white/10 last:border-0">
                     <Wind size={24} className="text-emerald-300" />
                     <div className="text-center">
                        <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Wind Speed</p>
                        <p className="text-xl font-black italic">{weather?.wind_speed?.toFixed(1)}km/h</p>
                        <p className="text-[9px] opacity-70 tracking-tight">Last updated: {weather?.recorded_at ? new Date(weather.recorded_at).toLocaleString('en-US', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '---'}</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

export default Weather;