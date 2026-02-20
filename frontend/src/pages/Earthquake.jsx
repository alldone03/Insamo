import React from 'react';
import { Activity } from 'lucide-react';

const Earthquake = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Activity className="text-error" /> Seismic Monitoring
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Seismograph Dummy */}
        <div className="card bg-base-100 shadow-xl lg:col-span-2">
          <div className="card-body">
            <h3 className="card-title">Live Seismograph</h3>
            <div className="bg-neutral text-neutral-content h-64 rounded-box flex items-center justify-center overflow-hidden relative">
               <svg className="w-full h-24 text-success" viewBox="0 0 100 20" preserveAspectRatio="none">
                 <path fill="none" stroke="currentColor" strokeWidth="0.5" d="M0,10 Q5,10 10,10 T20,10 T30,5 T40,15 T50,10 T60,10 T70,8 T80,12 T90,10 T100,10" />
               </svg>
               <span className="absolute top-2 right-2 text-xs badge badge-ghost">Live Feed</span>
            </div>
            <div className="stats mt-4 shadow bg-base-200">
              <div className="stat">
                <div className="stat-title">Magnitude</div>
                <div className="stat-value text-sm">0.02 SR</div>
              </div>
              <div className="stat">
                <div className="stat-title">Depth</div>
                <div className="stat-value text-sm">10 km</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Events */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title text-sm">Recent Activity</h3>
            <ul className="steps steps-vertical text-xs">
              <li className="step step-error">5.2 SR - South Java</li>
              <li className="step step-warning">3.1 SR - West Sumatra</li>
              <li className="step">2.0 SR - Local Sensor</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Earthquake;