import React from 'react';
import { Mountain } from 'lucide-react';

const Landslide = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Mountain className="text-warning" /> Landslide Warning
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Indikator Status */}
        <div className="stat bg-base-100 shadow rounded-box">
           <div className="stat-title">Risk Level</div>
           <div className="stat-value text-success">LOW</div>
        </div>
        <div className="stat bg-base-100 shadow rounded-box">
           <div className="stat-title">Soil Moisture</div>
           <div className="stat-value text-info">45%</div>
        </div>
        <div className="stat bg-base-100 shadow rounded-box">
           <div className="stat-title">Movement</div>
           <div className="stat-value">0 mm</div>
        </div>
        <div className="stat bg-base-100 shadow rounded-box">
           <div className="stat-title">Slope Angle</div>
           <div className="stat-value">35°</div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title">Soil Saturation Levels</h3>
          <div className="space-y-4 mt-4">
             <div>
               <div className="flex justify-between text-xs mb-1"><span>Depth 1M</span><span>30%</span></div>
               <progress className="progress progress-success w-full" value="30" max="100"></progress>
             </div>
             <div>
               <div className="flex justify-between text-xs mb-1"><span>Depth 3M</span><span>55%</span></div>
               <progress className="progress progress-warning w-full" value="55" max="100"></progress>
             </div>
             <div>
               <div className="flex justify-between text-xs mb-1"><span>Depth 5M</span><span>80%</span></div>
               <progress className="progress progress-error w-full" value="80" max="100"></progress>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landslide;