import React from 'react';
import { Flame, Wind, Thermometer } from 'lucide-react';

const Wildfire = () => {
  return (
    <div className="space-y-6">
      <div className="alert alert-error text-white shadow-lg">
        <Flame />
        <span>Fire Danger Index: HIGH (Dry Season Detected)</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-base-100 shadow-xl">
           <div className="card-body items-center text-center">
             <Thermometer className="w-10 h-10 text-error mb-2"/>
             <h2 className="card-title text-3xl">38°C</h2>
             <p>Ambient Temp</p>
           </div>
        </div>
        <div className="card bg-base-100 shadow-xl">
           <div className="card-body items-center text-center">
             <Wind className="w-10 h-10 text-info mb-2"/>
             <h2 className="card-title text-3xl">15 km/h</h2>
             <p>Wind Speed</p>
           </div>
        </div>
        <div className="card bg-base-100 shadow-xl">
           <div className="card-body items-center text-center">
             <Flame className="w-10 h-10 text-warning mb-2"/>
             <h2 className="card-title text-3xl text-success">0 ppm</h2>
             <p>Smoke/CO2</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Wildfire;