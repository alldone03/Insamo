import React, { useState, useEffect } from 'react';
import { Mountain, ArrowLeft, Thermometer, Wind, Eye } from 'lucide-react';
import GenericChart from '../components/GenericChart';
import MiniMap from '../components/MiniMap';
import { api, getImageUrl } from '../lib/api';

const Landslide = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch Landslide devices
    const fetchDevices = async () => {
      try {
        const res = await api.get('/devices');
        // Filter for landslide or just use all for demo if none strictly landslide
        const landslideDevices = res.data.filter(d => d.device_type === 'LANDSLIDE' || d.device_type === 'SIGMA'); // Adjusted for demo
        setDevices(landslideDevices);
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
      const time = new Date(now.getTime() - i * 3600000); // Past 24 hours
      data.push({
        time: time.toISOString(),
        soil_moisture: 30 + Math.random() * 20, // 30-50%
        ax: Math.random() * 0.5 - 0.25,
        ay: Math.random() * 0.5 - 0.25,
        az: 9.8 + (Math.random() * 0.2 - 0.1),
        gyrox: Math.random() * 2 - 1,
        gyroy: Math.random() * 2 - 1,
        gyroz: Math.random() * 2 - 1,
      });
    }
    return data;
  };

  const chartData = getSimulatedData();

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><span className="loading loading-spinner loading-lg text-warning"></span></div>;
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
            <h2 className="text-3xl font-black italic text-warning flex items-center gap-2">
              <Mountain size={28} />
              {selectedDevice.name}
            </h2>
            <p className="opacity-60 font-mono text-sm">{selectedDevice.device_code}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Device Information Card */}
          <div className="card bg-base-100 shadow-xl border-t-4 border-warning/50">
            <div className="card-body">
              <h3 className="card-title text-lg font-black italic mb-4">Device Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between border-b border-base-200 pb-2">
                    <span className="opacity-60 text-xs font-bold uppercase">Status</span>
                    <span className="badge badge-success badge-sm font-bold">ONLINE</span>
                  </div>
                  <div className="flex justify-between border-b border-base-200 pb-2">
                    <span className="opacity-60 text-xs font-bold uppercase">Slope</span>
                    <span className="text-warning text-xs font-bold italic">STABLE</span>
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

          {/* 3D Visualization Placeholder */}
          <div className="card bg-base-100 shadow-xl overflow-hidden border border-base-200">
            <div className="card-body p-0">
              {/* Placeholder for 3D View */}
              <div className="h-full min-h-[250px] w-full bg-base-300 relative flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-warning/20 to-base-300 pointer-events-none"></div>
                <div className="flex flex-col items-center gap-2 z-10">
                  <Mountain size={48} className="text-warning opacity-50" />
                  <p className="font-bold opacity-70 tracking-widest text-sm">3D SLOPE VIEW</p>
                  <span className="badge badge-warning badge-outline text-xs">Simulated</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Soil Moisture Chart */}
          <GenericChart
            title="Soil Moisture (%)"
            data={chartData}
            lines={[{ key: 'soil_moisture', name: 'Moisture', color: 'hsl(200, 80%, 50%)' }]}
            yAxisLabel="%"
            color="info"
          />

          {/* Ground Vibration Chart */}
          <GenericChart
            title="Ground Vibration (m/s²)"
            data={chartData}
            lines={[
              { key: 'ax', name: 'X-Axis', color: 'hsl(0, 80%, 60%)' },
              { key: 'ay', name: 'Y-Axis', color: 'hsl(120, 60%, 50%)' },
              { key: 'az', name: 'Z-Axis', color: 'hsl(240, 80%, 60%)' }
            ]}
            yAxisLabel="m/s²"
            color="error"
          />

          {/* Slope Angle Chart */}
          <GenericChart
            title="Slope Angle (°)"
            data={chartData}
            lines={[
              { key: 'gyrox', name: 'Gyro X', color: 'hsl(30, 90%, 50%)' },
              { key: 'gyroy', name: 'Gyro Y', color: 'hsl(280, 70%, 60%)' },
              { key: 'gyroz', name: 'Gyro Z', color: 'hsl(180, 60%, 40%)' }
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
      <h2 className="text-3xl font-black flex items-center gap-3 italic text-warning">
        <Mountain size={32} />
        LANDSLIDE MONITOR
      </h2>
      <p className="opacity-60 font-medium">Select a device to view detailed terrain activity.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map(device => (
          <div key={device.id} className="card bg-base-100 w-full shadow-sm border border-base-200 hover:border-warning transition-colors group">
            <figure className="h-48 relative overflow-hidden bg-base-300">
              <img
                src={getImageUrl(device.image) || 'https://images.unsplash.com/photo-1623150531586-21899178ad05?q=80&w=600&auto=format&fit=crop'}
                alt={device.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute top-2 right-2 flex gap-1">
                <span className="badge badge-success font-bold shadow-sm">ONLINE</span>
                <span className="badge badge-warning shadow-sm"><Mountain size={12} /></span>
              </div>
            </figure>
            <div className="card-body p-5">
              <h2 className="card-title text-lg font-black">{device.name}</h2>
              <p className="text-xs font-mono opacity-50 line-clamp-1">{device.address || 'No location set'}</p>

              <div className="mt-4 pt-4 border-t border-base-200 grid grid-cols-2 gap-2 text-xs">
                <div><span className="opacity-50">Risk Level:</span> <strong className="text-success">LOW</strong></div>
                <div><span className="opacity-50">Moisture:</span> <strong>45%</strong></div>
              </div>

              <div className="card-actions justify-end mt-4">
                <button
                  className="btn btn-warning btn-sm shadow-md"
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
            <Mountain size={48} className="text-base-300 mb-4" />
            <p className="text-lg font-bold opacity-50">No landslide devices found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Landslide;