import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ArrowDown, 
  ArrowUp, 
  Bell, 
  AlertTriangle, 
  TrendingUp,
  ChevronDown
} from 'lucide-react';

const AiPredict = () => {
  const [horizon, setHorizon] = useState('24');

  return (
    <div className="min-h-screen bg-[#f0f2f5] p-6 font-sans text-base-content">
      
      {/* Header */}
      <h2 className="text-4xl font-extrabold text-gray-800 mb-8">
        AI Water Level Predictive Monitor
      </h2>

      {/* Controls Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-6">
        {/* Dropdown Device */}
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn bg-[#1B75A7] hover:bg-[#155e8a] text-white border-none rounded-md px-6">
            Device ID 9 <ChevronDown className="w-4 h-4 ml-2" />
          </div>
          <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 mt-2">
            <li><a>Device ID 9</a></li>
            <li><a>Device ID 10</a></li>
          </ul>
        </div>

        {/* Prediction Horizon Radios */}
        <div className="flex items-center gap-4 text-sm font-semibold text-gray-600 bg-white px-4 py-2 rounded-lg shadow-sm">
          <span>Select Prediction Horizon:</span>
          <label className="flex items-center gap-2 cursor-pointer hover:text-primary">
            <input 
              type="radio" 
              name="horizon" 
              className="radio radio-primary radio-sm" 
              value="24" 
              checked={horizon === '24'} 
              onChange={(e) => setHorizon(e.target.value)} 
            />
            24 Hours
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:text-primary">
            <input 
              type="radio" 
              name="horizon" 
              className="radio radio-primary radio-sm" 
              value="72" 
              checked={horizon === '72'} 
              onChange={(e) => setHorizon(e.target.value)} 
            />
            72 Hours
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:text-primary">
            <input 
              type="radio" 
              name="horizon" 
              className="radio radio-primary radio-sm" 
              value="168" 
              checked={horizon === '168'} 
              onChange={(e) => setHorizon(e.target.value)} 
            />
            168 Hours (7 Days)
          </label>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-[#e6ffed] text-[#008000] p-5 rounded-xl flex flex-col md:flex-row items-center justify-between font-bold mb-6 shadow-sm border border-green-200">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-[#008000]" fill="currentColor" stroke="white" />
          <span className="text-lg tracking-wide">SYSTEM IS SAFE (CONTROLLED) IN THE NEXT {horizon} HOURS</span>
        </div>
        <div className="mt-2 md:mt-0 text-lg">
          CURRENT WATER LEVEL: 3.80 cm
        </div>
      </div>

      {/* 5 Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5 mb-6">
        
        {/* Card 1 */}
        <div className="card bg-base-100 shadow-sm border border-base-200 rounded-xl">
          <div className="card-body p-5">
            <h4 className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Predicted 1 Hour</h4>
            <div className="flex justify-between items-start">
              <span className="text-3xl font-extrabold text-[#007bff]">3.80 cm</span>
              <ArrowDown className="w-5 h-5 text-red-500" />
            </div>
            {/* Mock Sparkline */}
            <div className="mt-3 h-8 w-full">
              <svg viewBox="0 0 100 30" className="w-full h-full stroke-[#007bff] fill-none" preserveAspectRatio="none">
                <path d="M0,15 L20,25 L40,10 L60,20 L80,5 L100,28" strokeWidth="1.5" strokeDasharray="3,3" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="card bg-base-100 shadow-sm border border-base-200 rounded-xl relative overflow-hidden">
          <div className="card-body p-5">
            <h4 className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Real-Time Water</h4>
            <div className="flex justify-between items-start">
              <span className="text-3xl font-extrabold text-[#007bff]">3.80 cm</span>
              <ArrowUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-[10px] text-gray-400 text-right absolute right-5 top-14">Last updated: 8:27:41 AM</p>
            {/* Mock Sparkline */}
            <div className="mt-3 h-8 w-full">
              <svg viewBox="0 0 100 30" className="w-full h-full stroke-[#007bff] fill-none" preserveAspectRatio="none">
                <path d="M0,25 L20,20 L40,25 L60,15 L80,20 L100,5" strokeWidth="1.5" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="card bg-base-100 shadow-sm border border-base-200 rounded-xl">
          <div className="card-body p-5">
            <h4 className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Predicted Peak (24h)</h4>
            <div className="flex justify-between items-start">
              <span className="text-3xl font-extrabold text-[#007bff]">3.80 cm</span>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            {/* Mock Sparkline */}
            <div className="mt-3 h-8 w-full">
              <svg viewBox="0 0 100 30" className="w-full h-full stroke-[#007bff] fill-none" preserveAspectRatio="none">
                <path d="M0,28 L20,25 L40,20 L60,10 L80,15 L100,5" strokeWidth="1.5" strokeDasharray="3,3" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="card bg-base-100 shadow-sm border border-base-200 rounded-xl justify-center">
          <div className="card-body p-5">
            <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Warning Threshold</h4>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-extrabold text-[#d89f00]">50.00 cm</span>
              <Bell className="w-6 h-6 text-[#d89f00] fill-current" />
            </div>
          </div>
        </div>

        {/* Card 5 */}
        <div className="card bg-base-100 shadow-sm border border-base-200 rounded-xl justify-center">
          <div className="card-body p-5">
            <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Danger Threshold</h4>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-extrabold text-[#cc0000]">80.00 cm</span>
              <AlertTriangle className="w-6 h-6 text-[#cc0000] fill-current" />
            </div>
          </div>
        </div>

      </div>

      {/* Main Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart Section (col-span-2) */}
        <div className="lg:col-span-2 card bg-base-100 shadow-md border-l-4 border-l-[#007bff] rounded-xl">
          <div className="card-body">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Water Level & Forecast Trend (cm) - 24h Hist. + 24h Pred.
            </h3>
            
            {/* Legend Mock */}
            <div className="flex justify-center gap-6 mb-4 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 bg-[#007bff]"></div> Actual Water Level (cm)
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 border-b-2 border-dashed border-[#ff8000]"></div> AI Prediction (24h) (cm)
              </div>
            </div>

            {/* Placeholder untuk Chart.js / Recharts */}
            <div className="w-full h-80 bg-gray-50 rounded flex items-center justify-center border border-gray-100 relative">
               <span className="text-gray-400 font-medium absolute z-10">Area Render <code className="text-primary">react-chartjs-2</code></span>
               {/* Mock Grid & Lines just for visual representation */}
               <svg className="absolute w-full h-full opacity-30" preserveAspectRatio="none">
                 <g stroke="#e5e7eb" strokeWidth="1">
                   <line x1="0" y1="20%" x2="100%" y2="20%"/>
                   <line x1="0" y1="40%" x2="100%" y2="40%"/>
                   <line x1="0" y1="60%" x2="100%" y2="60%"/>
                   <line x1="0" y1="80%" x2="100%" y2="80%"/>
                 </g>
                 <path d="M0,200 C50,220 100,50 150,180 S200,20 250,150 S300,200 350,100 L400,100" fill="none" stroke="#007bff" strokeWidth="2"/>
                 <path d="M400,100 L500,100 L600,100 L700,100 L800,100" fill="none" stroke="#ff8000" strokeWidth="2" strokeDasharray="5,5"/>
               </svg>
            </div>
          </div>
        </div>

        {/* AI Prediction Insights Section */}
        <div className="card bg-base-100 shadow-md rounded-xl">
          <div className="card-body">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Prediction Insights</h3>
            <p className="text-sm text-gray-600 mb-4">
              The system predicts the water level will remain stable and controlled within the next {horizon} hours. No flood risk detected.
            </p>
            
            <h4 className="font-bold text-gray-800 mb-1">AI Scaling Parameters:</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 mb-6 space-y-1">
              <li>Mean: -0.0000</li>
              <li>StdDev: 0.4276</li>
              <li>Last Raw Level: 3.80 cm</li>
            </ul>

            <button className="btn w-full bg-[#28a745] hover:bg-[#218838] text-white border-none rounded-lg font-bold tracking-wide mt-auto">
              NO ACTION REQUIRED
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AiPredict;