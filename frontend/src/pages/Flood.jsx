import React, { useState, useEffect } from 'react';
import { Waves, ArrowLeft, Eye, AlertOctagon } from 'lucide-react';
import GenericChart from '../components/GenericChart';
import MiniMap from '../components/MiniMap';
import { api, getImageUrl } from '../lib/api';
import { io } from 'socket.io-client';

const getStatus = (level, settings) => {
  const danger = settings?.danger_threshold || 80;
  const alert = settings?.alert_threshold || 50;
  // Use half of alert_threshold for SIAGA 2 if not explicitly defined in settings, otherwise default to 10
  const siaga2 = settings?.siaga2_threshold || (alert > 0 ? alert / 2 : 10);

  if (level >= danger) return { label: 'BAHAYA', type: 'error', color: 'badge-error' };
  if (level >= alert) return { label: 'SIAGA 1', type: 'warning', color: 'badge-warning' };
  if (level >= siaga2) return { label: 'SIAGA 2', type: 'info', color: 'badge-info' };
  return { label: 'AMAN', type: 'success', color: 'badge-success' };
};

const Flood = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const selectedDeviceIdRef = React.useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [latestReadings, setLatestReadings] = useState({});
  const [currentTime, setCurrentTime] = useState(Date.now());

  const calibrateLevel = (val, device) => {
    const initial = device?.settings?.initial_distance || 10;
    return val + initial;
  };

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    selectedDeviceIdRef.current = selectedDevice?.id;
  }, [selectedDevice]);

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

  useEffect(() => {
    let backendUrl = "http://localhost:3000";
    if (import.meta.env.VITE_API_URL) {
      backendUrl = import.meta.env.VITE_API_URL.split('/api')[0];
    }
    const socket = io(backendUrl);

    socket.on('new_sensor_reading', (payload) => {
      if (payload.device_type === 'FLOWS') {
        const { device_id, reading } = payload;

        // Update latest reading map
        const storedReading = { ...reading, recorded_at: reading.recorded_at || new Date().toISOString() };
        setLatestReadings(prev => ({
          ...prev,
          [device_id]: storedReading
        }));

        setChartData(prevData => {
          // Hanya tambahkan point jika data ini milik device yang sedang dilihat
          if (selectedDeviceIdRef.current !== device_id) {
            return prevData;
          }

          const currentDev = devices.find(d => d.id === device_id);

          // Add the new point if not already added to chart
          const newPoint = {
            time: reading.recorded_at || new Date().toISOString(),
            water_level: calibrateLevel(reading.water_level || 0, currentDev),
            wind_speed: reading.wind_speed || 0,
            temperature: reading.temperature || 0,
            rainfall_intensity: reading.rainfall_intensity || 0,
          };
          // Only keep last 24 items limit
          return [...prevData, newPoint].slice(-24);
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [devices]);

  useEffect(() => {
    if (selectedDevice) {
      api.get(`/sensor-readings?device_id=${selectedDevice.id}`).then(res => {
        // Data usually comes with latest first, reverse to make chronological
        const readings = res.data && Array.isArray(res.data) ? res.data : (res.data?.data || []);

        const formattedData = readings.reverse().map(r => ({
          time: r.recorded_at,
          water_level: calibrateLevel(r.water_level || 0, selectedDevice),
          wind_speed: r.wind_speed || 0,
          temperature: r.temperature || 0,
          rainfall_intensity: r.rainfall_intensity || 0,
        }));
        setChartData(formattedData);
      }).catch(err => {
        console.error("Failed to fetch sensor readings", err);
      });
    }
  }, [selectedDevice]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><span className="loading loading-spinner loading-lg text-info"></span></div>;
  }

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

  if (selectedDevice) {
    const currentCalLevel = calibrateLevel(latestReadings[selectedDevice.id]?.water_level ?? (selectedDevice.sensor_readings?.[0]?.water_level ?? 0), selectedDevice);
    const status = getStatus(currentCalLevel, selectedDevice.settings);

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
                    {isDeviceOnline(selectedDevice.id) ? (
                      <span className="badge badge-success badge-sm font-bold">ONLINE</span>
                    ) : (
                      <span className="badge badge-error badge-sm font-bold">OFFLINE</span>
                    )}
                  </div>
                  <div className="flex justify-between border-b border-base-200 pb-2">
                    <span className="opacity-60 text-xs font-bold uppercase">Calibration</span>
                    <span className="text-info text-xs font-bold">+{selectedDevice.settings?.initial_distance || 10} cm</span>
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
              <h3 className="card-title text-sm italic font-black uppercase">Current Warning Status</h3>
              <div className={`stats shadow bg-base-200 my-4`}>
                <div className="stat">
                  <div className={`stat-figure ${status.type === 'error' ? 'text-error' : status.type === 'warning' ? 'text-warning' : 'text-success'}`}>
                    <AlertOctagon size={32} />
                  </div>
                  <div className="stat-title text-xs font-bold">Condition Level ({currentCalLevel.toFixed(1)} cm)</div>
                  <div className={`stat-value text-2xl font-black italic ${status.type === 'error' ? 'text-error' : status.type === 'warning' ? 'text-warning' : 'text-success'}`}>
                    {status.label}
                  </div>
                  <div className="stat-desc font-medium">Thresholds: {selectedDevice.settings?.alert_threshold || 50}cm (Siaga 1), {selectedDevice.settings?.danger_threshold || 80}cm (Bahaya)</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Water Level Chart */}
          <GenericChart
            title="Water Level (cm)"
            data={chartData}
            lines={[{ key: 'water_level', name: 'Level', color: 'hsl(210, 80%, 50%)' }]}
            yAxisLabel="cm"
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
        {devices.map(device => {
          const calLevel = calibrateLevel(latestReadings[device.id]?.water_level ?? (device.sensor_readings?.[0]?.water_level ?? 0), device);
          const status = getStatus(calLevel, device.settings);
          return (
            <div key={device.id} className="card bg-base-100 w-full shadow-sm border border-base-200 hover:border-info transition-colors group">
              <figure className="h-48 relative overflow-hidden bg-base-300">
                <img
                  src={getImageUrl(device.image) || 'https://images.unsplash.com/photo-1547623641-82fbb83476e9?q=80&w=600&auto=format&fit=crop'}
                  alt={device.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  {isDeviceOnline(device.id) ? (
                    <span className="badge badge-success font-bold shadow-sm">ONLINE</span>
                  ) : (
                    <span className="badge badge-error font-bold shadow-sm">OFFLINE</span>
                  )}
                  <span className={`badge ${status.color} shadow-sm font-bold`}>{status.label}</span>
                </div>
              </figure>
              <div className="card-body p-5">
                <h2 className="card-title text-lg font-black">{device.name}</h2>
                <p className="text-xs font-mono opacity-50 line-clamp-1">{device.address || 'No location set'}</p>

                <div className="mt-4 pt-4 border-t border-base-200 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="opacity-50">Status: </span>
                    {isDeviceOnline(device.id) ? (
                      <strong className="text-success">Active</strong>
                    ) : (
                      <strong className="text-error">Inactive</strong>
                    )}
                  </div>
                  <div><span className="opacity-50">Level:</span> <strong className="text-primary">{calLevel.toFixed(1)} cm</strong></div>
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
          );
        })}

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
