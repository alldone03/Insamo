import React, { useState, useEffect } from 'react';
import { Activity, ArrowLeft, Eye } from 'lucide-react';
import GenericChart from '../components/GenericChart';
import MiniMap from '../components/MiniMap';
import { api, getImageUrl } from '../lib/api';

const Earthquake = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await api.get('/devices');
        // Filter for earthquake/sigma devices
        const eqDevices = res.data.filter(d => d.device_type === 'SIGMA');
        setDevices(eqDevices);
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
        x: Math.random() * 0.1 - 0.05,
        y: Math.random() * 0.1 - 0.05,
        z: 9.8 + (Math.random() * 0.05 - 0.025),
        tilt: Math.random() * 5,
      });
    }
    return data;
  };

  const chartData = getSimulatedData();

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><span className="loading loading-spinner loading-lg text-error"></span></div>;
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
            <h2 className="text-3xl font-black italic text-error flex items-center gap-2">
              <Activity size={28} />
              {selectedDevice.name}
            </h2>
            <p className="opacity-60 font-mono text-sm">{selectedDevice.device_code}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card bg-base-100 shadow-xl border-t-4 border-error/50">
            <div className="card-body">
              <h3 className="card-title text-lg font-black italic mb-4">Device Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between border-b border-base-200 pb-2">
                    <span className="opacity-60 text-xs font-bold uppercase">Status</span>
                    <span className="badge badge-success badge-sm font-bold">ONLINE</span>
                  </div>
                  <div className="flex justify-between border-b border-base-200 pb-2">
                    <span className="opacity-60 text-xs font-bold uppercase">Vibration</span>
                    <span className="text-error text-xs font-bold italic">NORMAL</span>
                  </div>
                  <div className="flex flex-col gap-1 border-b border-base-200 pb-2">
                    <span className="opacity-60 text-[10px] font-bold uppercase tracking-widest">Coordinates</span>
                    <span className="font-mono text-[10px] opacity-80">{selectedDevice.latitude || '-'}, {selectedDevice.longitude || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60 text-xs font-bold uppercase">Last Sync</span>
                    <span className="font-mono text-[10px] opacity-80 font-bold">Just now</span>
                  </div>
                </div>
                <div className="h-full min-h-[120px]">
                  <MiniMap lat={selectedDevice.latitude} lng={selectedDevice.longitude} />
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl overflow-hidden border border-base-200">
            <div className="card-body p-0">
              <div className="h-full min-h-[250px] w-full bg-base-300 relative flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-error/20 to-base-300 pointer-events-none"></div>
                <div className="flex flex-col items-center gap-2 z-10">
                  <Activity size={48} className="text-error opacity-50 absolute animate-ping" />
                  <Activity size={48} className="text-error opacity-80" />
                  <p className="font-bold opacity-70 tracking-widest text-sm mt-4">LIVE SEISMOGRAPH</p>
                  <span className="badge badge-error badge-outline text-xs">Simulated</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Vibration Chart */}
          <GenericChart
            title="Vibration Chart (m/s²)"
            data={chartData}
            lines={[
              { key: 'x', name: 'X-Axis', color: 'hsl(0, 80%, 60%)' },
              { key: 'y', name: 'Y-Axis', color: 'hsl(120, 60%, 50%)' },
              { key: 'z', name: 'Z-Axis', color: 'hsl(240, 80%, 60%)' }
            ]}
            yAxisLabel="m/s²"
            color="error"
          />

          {/* Device Tilt Chart */}
          <GenericChart
            title="Device Tilt (°)"
            data={chartData}
            lines={[
              { key: 'tilt', name: 'Tilt', color: 'hsl(30, 90%, 50%)' }
            ]}
            yAxisLabel="Degrees"
            color="warning"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <h2 className="text-3xl font-black flex items-center gap-3 italic text-error">
        <Activity size={32} />
        EARTHQUAKE SENSORS
      </h2>
      <p className="opacity-60 font-medium">Select a seismic sensor to view detailed vibration data.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map(device => (
          <div key={device.id} className="card bg-base-100 w-full shadow-sm border border-base-200 hover:border-error transition-colors group">
            <figure className="h-48 relative overflow-hidden bg-base-300">
              <img
                src={getImageUrl(device.image) || 'https://images.unsplash.com/photo-1579782504812-70b7ab80132b?q=80&w=600&auto=format&fit=crop'}
                alt={device.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute top-2 right-2 flex gap-1">
                <span className="badge badge-success font-bold shadow-sm">ONLINE</span>
                <span className="badge badge-error shadow-sm"><Activity size={12} /></span>
              </div>
            </figure>
            <div className="card-body p-5">
              <h2 className="card-title text-lg font-black">{device.name}</h2>
              <p className="text-xs font-mono opacity-50 line-clamp-1">{device.address || 'No location set'}</p>

              <div className="mt-4 pt-4 border-t border-base-200 grid grid-cols-2 gap-2 text-xs">
                <div><span className="opacity-50">Risk Level:</span> <strong className="text-success">LOW</strong></div>
                <div><span className="opacity-50">Magnitude:</span> <strong>0.02 SR</strong></div>
              </div>

              <div className="card-actions justify-end mt-4">
                <button
                  className="btn btn-error btn-sm shadow-md"
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
            <Activity size={48} className="text-base-300 mb-4" />
            <p className="text-lg font-bold opacity-50">No seismic devices found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Earthquake;