import React from 'react';
import { CloudSun, CloudRain, Sun, Wind, Droplets } from 'lucide-react';

const Weather = () => {
  return (
    <div className="space-y-6">
      <div className="card bg-gradient-to-br from-blue-500 to-blue-300 text-white shadow-xl">
         <div className="card-body">
            <div className="flex flex-col md:flex-row justify-between items-center">
               <div className="text-center md:text-left">
                  <h2 className="text-3xl font-bold">Surabaya, ID</h2>
                  <p className="opacity-80">Monday, 12 Oct</p>
                  <div className="flex items-center gap-4 mt-4 justify-center md:justify-start">
                     <span className="text-7xl font-bold">32°</span>
                     <div className="text-sm">
                        <p>Sunny</p>
                        <p>H:34° L:28°</p>
                     </div>
                  </div>
               </div>
               <Sun size={100} className="text-yellow-300 animate-spin-slow mt-6 md:mt-0" />
            </div>

            <div className="flex justify-around mt-8 pt-4 border-t border-white/20">
               <div className="text-center">
                  <Wind className="mx-auto mb-1" />
                  <span className="font-bold">12 km/h</span>
               </div>
               <div className="text-center">
                  <Droplets className="mx-auto mb-1" />
                  <span className="font-bold">64%</span>
               </div>
               <div className="text-center">
                  <CloudRain className="mx-auto mb-1" />
                  <span className="font-bold">10%</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

// PASTIKAN BARIS INI ADA DI PALING BAWAH
export default Weather;