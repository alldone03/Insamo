import React, { useState, useEffect } from 'react';
import { Waves, ArrowLeft, Eye, AlertOctagon } from 'lucide-react';
import GenericChart from '../components/GenericChart';
import MiniMap from '../components/MiniMap';
import { api, getImageUrl } from '../lib/api';

const Flood = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await api.get('/devices');
        // Filter for flood devices (assumed FLOWS or similar)
        const floodDevices = res.data.filter(d => d.device_type === 'FLOWS');
        setDevices(floodDevices);
      } catch (error) {
        console.error("Failed to fetch devices", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDevices();
  }, []);

  // Simulated historical data for charts
  const getSimulatedData = () => {
    const data = [];
    const now = new Date();
    for (let i = 24; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 3600000);
      data.push({
        time: time.toISOString(),
        water_level: 120 + Math.random() * 80, // cm
        wind_speed: 5 + Math.random() * 20, // m/s
        temperature: 25 + Math.random() * 5, // C
        rainfall_intensity: Math.random() * 100, // %
      });
    }
    return data;
  };

  const chartData = getSimulatedData();

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><span className="loading loading-spinner loading-lg text-info"></span></div>;
  }

  if (selectedDevice) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500 pb-20">
        <div className="flex items-center gap-4 mb-6">
          <button
            className="btn btn-circle btn-ghost"
            onClick={() => setSelectedDevice(null)}
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-3xl font-black italic text-info flex items-center gap-2">
              <Waves size={28} />
              {selectedDevice.name}
            </h2>
            <p className="opacity-60 font-mono text-sm">{selectedDevice.device_code}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card bg-base-100 shadow-xl border-t-4 border-info/50">
            <div className="card-body">
              <h3 className="card-title text-lg font-black italic mb-4">Device Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between border-b border-base-200 pb-2">
                    <span className="opacity-60 text-xs font-bold uppercase">Status</span>
                    <span className="badge badge-success badge-sm font-bold">ONLINE</span>
                  </div>
                  <div className="flex justify-between border-b border-base-200 pb-2">
                    <span className="opacity-60 text-xs font-bold uppercase">Signal</span>
                    <span className="text-success text-xs font-bold">Excellent</span>
                  </div>
                  <div className="flex flex-col gap-1 border-b border-base-200 pb-2">
                    <span className="opacity-60 text-[10px] font-bold uppercase tracking-widest">Coordinates</span>
                    <span className="font-mono text-[10px] opacity-80">{selectedDevice.latitude || '-'}, {selectedDevice.longitude || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60 text-xs font-bold uppercase">Last Update</span>
                    <span className="font-mono text-[10px] opacity-80">Just now</span>
                  </div>
                </div>
                <div className="h-full min-h-[120px]">
                  <MiniMap lat={selectedDevice.latitude} lng={selectedDevice.longitude} />
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title text-sm">Recent Alerts</h3>
              <div className="stats shadow bg-base-200 my-4">
                <div className="stat">
                  <div className="stat-figure text-warning">
                    <AlertOctagon />
                  </div>
                  <div className="stat-title">Threshold limit</div>
                  <div className="stat-value text-warning text-2xl">Warning</div>
                  <div className="stat-desc">Limit reached 150cm soon</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Water Level Chart */}
          <GenericChart
            title="Water Level (m)"
            data={chartData}
            lines={[{ key: 'water_level', name: 'Level', color: 'hsl(210, 80%, 50%)' }]}
            yAxisLabel="Meters"
            color="info"
          />

          {/* Wind Speed Chart */}
          <GenericChart
            title="Wind Speed (m/s)"
            data={chartData}
            lines={[{ key: 'wind_speed', name: 'Speed', color: 'hsl(180, 50%, 60%)' }]}
            yAxisLabel="m/s"
            color="accent"
          />

          {/* Temperature Chart */}
          <GenericChart
            title="Temperature (°C)"
            data={chartData}
            lines={[{ key: 'temperature', name: 'Temp', color: 'hsl(10, 80%, 60%)' }]}
            yAxisLabel="°C"
            color="error"
          />

          {/* Rainfall Intensity Chart */}
          <GenericChart
            title="Rainfall Intensity (%)"
            data={chartData}
            lines={[{ key: 'rainfall_intensity', name: 'Rainfall', color: 'hsl(230, 80%, 60%)' }]}
            yAxisLabel="%"
            color="primary"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <h2 className="text-3xl font-black flex items-center gap-3 italic text-info">
        <Waves size={32} />
        FLOOD MONITORING
      </h2>
      <p className="opacity-60 font-medium">Select a river or dam sensor to view detailed water level and weather data.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map(device => (
          <div key={device.id} className="card bg-base-100 w-full shadow-sm border border-base-200 hover:border-info transition-colors group">
            <figure className="h-48 relative overflow-hidden bg-base-300">
              <img
                src={getImageUrl(device.image) || 'https://images.unsplash.com/photo-1547623641-82fbb83476e9?q=80&w=600&auto=format&fit=crop'}
                alt={device.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute top-2 right-2 flex gap-1">
                <span className="badge badge-success font-bold shadow-sm">ONLINE</span>
                <span className="badge badge-info shadow-sm"><Waves size={12} /></span>
              </div>
            </figure>
            <div className="card-body p-5">
              <h2 className="card-title text-lg font-black">{device.name}</h2>
              <p className="text-xs font-mono opacity-50 line-clamp-1">{device.address || 'No location set'}</p>

              <div className="mt-4 pt-4 border-t border-base-200 grid grid-cols-2 gap-2 text-xs">
                <div><span className="opacity-50">Status:</span> <strong className="text-warning">Siaga 2</strong></div>
                <div><span className="opacity-50">Level:</span> <strong>180 cm</strong></div>
              </div>

              <div className="card-actions justify-end mt-4">
                <button
                  className="btn btn-info btn-sm shadow-md"
                  onClick={() => setSelectedDevice(device)}
                >
                  <Eye size={16} /> VIEW DATA
                </button>
              </div>
            </div>
          </div>
        ))}

        {devices.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center p-12 border-2 border-dashed border-base-300 rounded-xl">
            <Waves size={48} className="text-base-300 mb-4" />
            <p className="text-lg font-bold opacity-50">No flood devices found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Flood;