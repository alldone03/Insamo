import React from 'react';
import { Waves, AlertOctagon } from 'lucide-react';

const Flood = () => {
  const level = 180; // dummy data

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Flood Monitoring</h2>
        <div className="badge badge-warning p-3">Status: Siaga 2</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Visualisasi Air */}
        <div className="card bg-base-100 shadow-xl md:col-span-1">
          <div className="card-body items-center">
            <h3 className="card-title">Water Level</h3>
            <div className="w-24 h-64 bg-base-200 rounded-box relative overflow-hidden border border-base-300 mt-4">
              <div 
                className="absolute bottom-0 left-0 w-full bg-blue-500 transition-all duration-1000 opacity-80"
                style={{ height: `${(level / 250) * 100}%` }}
              >
                <div className="w-full h-2 bg-white opacity-20 animate-pulse"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center z-10 font-bold text-white drop-shadow-md">
                {level} cm
              </div>
            </div>
          </div>
        </div>

        {/* Info & Log */}
        <div className="card bg-base-100 shadow-xl md:col-span-2">
          <div className="card-body">
            <h3 className="card-title">Recent Status</h3>
            <div className="stats shadow bg-base-200 my-4">
              <div className="stat">
                <div className="stat-figure text-warning">
                  <AlertOctagon />
                </div>
                <div className="stat-title">Threshold</div>
                <div className="stat-value text-warning">Warning</div>
                <div className="stat-desc">limit 150cm</div>
              </div>
            </div>

            <h4 className="font-bold mt-4">Logs</h4>
            <table className="table table-zebra table-xs">
              <thead><tr><th>Time</th><th>Level</th><th>Status</th></tr></thead>
              <tbody>
                <tr><td>10:00 AM</td><td>180 cm</td><td className="text-warning">Siaga 2</td></tr>
                <tr><td>09:00 AM</td><td>140 cm</td><td className="text-success">Aman</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Flood;