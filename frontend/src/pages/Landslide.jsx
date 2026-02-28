import React, { useState, useEffect } from 'react';
import { Mountain, ArrowLeft, Thermometer, Wind, Eye } from 'lucide-react';
import GenericChart from '../components/GenericChart';
import MiniMap from '../components/MiniMap';
import { api, getImageUrl } from '../lib/api';
import { io } from 'socket.io-client';

const Landslide = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const selectedDeviceIdRef = React.useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [latestReadings, setLatestReadings] = useState({});
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    selectedDeviceIdRef.current = selectedDevice?.id;
  }, [selectedDevice]);

  useEffect(() => {
    // Fetch Landslide devices
    const fetchDevices = async () => {
      try {
        const res = await api.get('/devices');
        // Filter for landslide or just use all for demo if none strictly landslide
        const landslideDevices = res.data.filter(d => d.device_type === 'LANDSLIDE'); // Adjusted for demo
        setDevices(landslideDevices);
      } catch (error) {
        console.error("Failed to fetch devices", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDevices();
  }, []);

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_API_URL
      ? new URL(import.meta.env.VITE_API_URL).origin
      : "http://localhost:3000";
    const socket = io(backendUrl, { path: '/socket.io/', transports: ['websocket', 'polling'] });

    socket.on('new_sensor_reading', (payload) => {
      if (payload.device_type === 'LANDSLIDE') {
        const { device_id, reading } = payload;

        const storedReading = { ...reading, recorded_at: reading.recorded_at || new Date().toISOString() };
        setLatestReadings(prev => ({
          ...prev,
          [device_id]: storedReading
        }));

        setChartData(prevData => {
          if (selectedDeviceIdRef.current !== device_id) {
            return prevData;
          }

          const newPoint = {
            time: reading.recorded_at || new Date().toISOString(),
            soil_moisture: reading.soil_moisture || 0,
            vib_x: reading.vib_x || 0,
            vib_y: reading.vib_y || 0,
            vib_z: reading.vib_z || 0,
            gyro_x: reading.gyro_x || 0,
            gyro_y: reading.gyro_y || 0,
            gyro_z: reading.gyro_z || 0,
          };

          return [...prevData, newPoint].slice(-24);
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      api.get(`/sensor-readings?device_id=${selectedDevice.id}`).then(res => {
        const readings = res.data && Array.isArray(res.data) ? res.data : (res.data?.data || []);

        const formattedData = readings.reverse().map(r => ({
          time: r.recorded_at,
          soil_moisture: r.soil_moisture || 0,
          vib_x: r.vib_x || 0,
          vib_y: r.vib_y || 0,
          vib_z: r.vib_z || 0,
          gyro_x: r.gyro_x || 0,
          gyro_y: r.gyro_y || 0,
          gyro_z: r.gyro_z || 0,
        }));
        setChartData(formattedData);
      }).catch(err => {
        console.error("Failed to fetch sensor readings", err);
      });
    }
  }, [selectedDevice]);

  const isDeviceOnline = (devId) => {
    const isRecent = (timestamp) => {
      if (!timestamp) return false;
      return (currentTime - new Date(timestamp).getTime()) <= 60000;
    };

    if (latestReadings[devId]) {
      return isRecent(latestReadings[devId].recorded_at);
    }
    const dev = devices.find(d => d.id === devId);
    if (dev && dev.sensor_readings && dev.sensor_readings.length > 0) {
      return isRecent(dev.sensor_readings[0].recorded_at);
    }
    return false;
  };

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
                    {isDeviceOnline(selectedDevice.id) ? (
                      <span className="badge badge-success badge-sm font-bold">ONLINE</span>
                    ) : (
                      <span className="badge badge-error badge-sm font-bold">OFFLINE</span>
                    )}
                  </div>
                  <div className="flex justify-between border-b border-base-200 pb-2">
                    <span className="opacity-60 text-xs font-bold uppercase">Slope</span>
                    <span className={`text-xs font-bold italic ${latestReadings[selectedDevice.id]?.landslide_status === 'DANGER' ? 'text-error' : 'text-warning'}`}>
                      {latestReadings[selectedDevice.id]?.landslide_status || (selectedDevice.sensor_readings?.[0]?.landslide_status || 'STABLE')}
                    </span>
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
              { key: 'vib_x', name: 'X-Axis', color: 'hsl(0, 80%, 60%)' },
              { key: 'vib_y', name: 'Y-Axis', color: 'hsl(120, 60%, 50%)' },
              { key: 'vib_z', name: 'Z-Axis', color: 'hsl(240, 80%, 60%)' }
            ]}
            yAxisLabel="m/s²"
            color="error"
          />

          {/* Slope Angle Chart */}
          <GenericChart
            title="Slope Angle (°)"
            data={chartData}
            lines={[
              { key: 'gyro_x', name: 'Gyro X', color: 'hsl(30, 90%, 50%)' },
              { key: 'gyro_y', name: 'Gyro Y', color: 'hsl(280, 70%, 60%)' },
              { key: 'gyro_z', name: 'Gyro Z', color: 'hsl(180, 60%, 40%)' }
            ]}
            yAxisLabel="Degrees"
            color="warning"
          />
          {/* 3D Box Visualization */}
          <div className="card bg-base-100 shadow-xl border-t-4 border-warning/50">
            <div className="card-body">
              <h3 className="card-title text-sm font-black italic mb-4">3D Slope Visualization</h3>
              <div className="flex justify-center items-center h-64 bg-base-200 rounded-xl overflow-hidden perspective-[1000px]">
                <div
                  className="relative w-40 h-40 transition-transform duration-500 ease-out"
                  style={{
                    transform: `rotateX(${latestReadings[selectedDevice.id]?.gyro_x ?? selectedDevice.sensor_readings?.[0]?.gyro_x ?? 50}deg) rotateY(${latestReadings[selectedDevice.id]?.gyro_y ?? selectedDevice.sensor_readings?.[0]?.gyro_y ?? -30}deg) rotateZ(${latestReadings[selectedDevice.id]?.gyro_z ?? selectedDevice.sensor_readings?.[0]?.gyro_z ?? 0}deg)`,
                    transformStyle: 'preserve-3d'
                  }}
                >
                  {/* Front Face */}
                  <div className="absolute w-full h-full bg-warning rounded-2xl flex items-center justify-center font-black italic text-white text-xl shadow-[inset_0_0_20px_rgba(0,0,0,0.2)] border-2 border-white/20" style={{ transform: 'translateZ(16px)' }}>
                    Landslide
                  </div>
                  {/* Back Face */}
                  <div className="absolute w-full h-full bg-warning rounded-2xl border-2 border-white/20" style={{ transform: 'rotateY(180deg) translateZ(16px)' }}></div>
                  {/* Left Face */}
                  <div className="absolute w-8 h-[calc(100%-28px)] bg-warning brightness-90" style={{ left: '50%', top: '14px', marginLeft: '-16px', transform: 'rotateY(-90deg) translateZ(80px)' }}></div>
                  {/* Right Face */}
                  <div className="absolute w-8 h-[calc(100%-28px)] bg-warning brightness-90" style={{ left: '50%', top: '14px', marginLeft: '-16px', transform: 'rotateY(90deg) translateZ(80px)' }}></div>
                  {/* Top Face */}
                  <div className="absolute w-[calc(100%-28px)] h-8 bg-warning brightness-110" style={{ top: '50%', left: '14px', marginTop: '-16px', transform: 'rotateX(90deg) translateZ(80px)' }}></div>
                  {/* Bottom Face */}
                  <div className="absolute w-[calc(100%-28px)] h-8 bg-error brightness-75" style={{ top: '50%', left: '14px', marginTop: '-16px', transform: 'rotateX(-90deg) translateZ(80px)' }}></div>
                </div>
              </div>
              <div className="flex justify-center gap-4 mt-4 text-xs font-mono opacity-70 font-bold">
                <span className="text-error">X: {(latestReadings[selectedDevice.id]?.gyro_x ?? selectedDevice.sensor_readings?.[0]?.gyro_x ?? 0).toFixed(1)}°</span>
                <span className="text-secondary">Y: {(latestReadings[selectedDevice.id]?.gyro_y ?? selectedDevice.sensor_readings?.[0]?.gyro_y ?? 0).toFixed(1)}°</span>
                <span className="text-primary">Z: {(latestReadings[selectedDevice.id]?.gyro_z ?? selectedDevice.sensor_readings?.[0]?.gyro_z ?? 0).toFixed(1)}°</span>
              </div>
            </div>
          </div>
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
                {isDeviceOnline(device.id) ? (
                  <span className="badge badge-success font-bold shadow-sm">ONLINE</span>
                ) : (
                  <span className="badge badge-error font-bold shadow-sm">OFFLINE</span>
                )}
                <span className="badge badge-warning shadow-sm"><Mountain size={12} /></span>
              </div>
            </figure>
            <div className="card-body p-5">
              <h2 className="card-title text-lg font-black">{device.name}</h2>
              <p className="text-xs font-mono opacity-50 line-clamp-1">{device.address || 'No location set'}</p>

              <div className="mt-4 pt-4 border-t border-base-200 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="opacity-50">Risk Level:</span>{" "}
                  <strong className={` ${latestReadings[device.id]?.landslide_status === 'DANGER' ? 'text-error' : 'text-success'}`}>
                    {latestReadings[device.id]?.landslide_status || (device.sensor_readings?.[0]?.landslide_status || 'LOW')}
                  </strong>
                </div>
                <div><span className="opacity-50">Moisture:</span> <strong>{(latestReadings[device.id]?.soil_moisture ?? device.sensor_readings?.[0]?.soil_moisture) !== undefined ? Number(latestReadings[device.id]?.soil_moisture ?? device.sensor_readings?.[0]?.soil_moisture).toFixed(2) : '-'} %</strong></div>
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