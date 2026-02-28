import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { api, getImageUrl } from "../lib/api";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area, BarChart, Bar
} from 'recharts';
import { Activity, ArrowLeft, Thermometer, Droplets, Wind, Waves, Move, Zap, TrendingUp, AlertTriangle } from "lucide-react";
import InsamoLogo from "../assets/InsamoLogo.webp";
import GenericChart from "../components/GenericChart";

export default function Sensordata() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: device, isLoading: isLoadingDevice } = useQuery({
        queryKey: ["device", id],
        queryFn: async () => {
            const res = await api.get(`/devices/${id}`);
            return res.data;
        },
    });

    useEffect(() => {
        let backendUrl = "http://localhost:3000";
        if (import.meta.env.VITE_API_URL) {
            backendUrl = import.meta.env.VITE_API_URL.split('/api')[0];
        }
        const socket = io(backendUrl);

        socket.on('new_sensor_reading', (payload) => {
            if (String(payload.device_id) === String(id)) {
                queryClient.setQueryData(["device", id], (oldData) => {
                    if (!oldData) return oldData;

                    return {
                        ...oldData,
                        sensor_readings: [payload.reading, ...(oldData.sensor_readings || [])]
                    };
                });
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [id, queryClient]);

    // Assume the backend returns sensorReadings along with the device or we fetch it separately
    // The previous DeviceController.php show() method does load('sensorReadings')
    const readings = device?.sensor_readings || [];

    // Format datetime for display
    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const hh = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        const ss = String(date.getSeconds()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
    };

    // Format readings with datetime
    const formattedReadings = readings.map(r => ({
        ...r,
        time: r.recorded_at,
        datetime: formatDateTime(r.recorded_at),
        x: r.vib_x || r.tilt_x || 0,
        y: r.vib_y || r.tilt_y || 0,
        z: r.vib_z || r.tilt_z || 0,
        tilt: r.device_tilt || r.magnitude || 0,
        soil_moisture: r.soil_moisture || 0,
        vib_x: r.vib_x || 0,
        vib_y: r.vib_y || 0,
        vib_z: r.vib_z || 0,
        gyro_x: r.gyro_x || 0,
        gyro_y: r.gyro_y || 0,
        gyro_z: r.gyro_z || 0,
    })).reverse();

    if (isLoadingDevice) return <div className="flex justify-center p-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>;

    const renderCharts = () => {
        const type = device?.device_type;

        switch (type) {
            case 'SIGMA':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <GenericChart
                            title="Vibration Chart (m/s²)"
                            data={formattedReadings}
                            lines={[
                                { key: 'x', name: 'X-Axis', color: 'hsl(0, 80%, 60%)' },
                                { key: 'y', name: 'Y-Axis', color: 'hsl(120, 60%, 50%)' },
                                { key: 'z', name: 'Z-Axis', color: 'hsl(240, 80%, 60%)' }
                            ]}
                            yAxisLabel="m/s²"
                            color="error"
                        />
                        <div className="card bg-base-100 shadow-xl border border-base-200">
                            <div className="card-body">
                                <h3 className="card-title text-sm opacity-50 font-black uppercase tracking-widest flex items-center gap-2 mb-4">
                                    <Activity className="text-error" size={16} /> Latest Readings
                                </h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="bg-base-200 p-4 rounded-xl flex flex-col items-center">
                                        <span className="opacity-50 font-bold text-xs uppercase mb-1">X-Axis</span>
                                        <span className="text-2xl font-black text-error">
                                            {parseFloat(formattedReadings[formattedReadings.length - 1]?.x ?? 0).toFixed(3)}
                                        </span>
                                    </div>
                                    <div className="bg-base-200 p-4 rounded-xl flex flex-col items-center">
                                        <span className="opacity-50 font-bold text-xs uppercase mb-1">Y-Axis</span>
                                        <span className="text-2xl font-black text-secondary">
                                            {parseFloat(formattedReadings[formattedReadings.length - 1]?.y ?? 0).toFixed(3)}
                                        </span>
                                    </div>
                                    <div className="bg-base-200 p-4 rounded-xl flex flex-col items-center">
                                        <span className="opacity-50 font-bold text-xs uppercase mb-1">Z-Axis</span>
                                        <span className="text-2xl font-black text-primary">
                                            {parseFloat(formattedReadings[formattedReadings.length - 1]?.z ?? 0).toFixed(3)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'FLOWS':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <GenericChart
                            title="Water Level (m)"
                            data={formattedReadings}
                            lines={[{ key: 'water_level', name: 'Level', color: 'hsl(210, 80%, 50%)' }]}
                            yAxisLabel="Meters"
                            color="info"
                        />
                        <GenericChart
                            title="Wind Speed (m/s)"
                            data={formattedReadings}
                            lines={[{ key: 'wind_speed', name: 'Speed', color: 'hsl(180, 50%, 60%)' }]}
                            yAxisLabel="m/s"
                            color="accent"
                        />
                        <GenericChart
                            title="Temperature (°C)"
                            data={formattedReadings}
                            lines={[{ key: 'temperature', name: 'Temp', color: 'hsl(10, 80%, 60%)' }]}
                            yAxisLabel="°C"
                            color="error"
                        />
                        <GenericChart
                            title="Rainfall Intensity (%)"
                            data={formattedReadings}
                            lines={[{ key: 'rainfall_intensity', name: 'Rainfall', color: 'hsl(230, 80%, 60%)' }]}
                            yAxisLabel="%"
                            color="primary"
                        />
                    </div>
                );
            case 'LANDSLIDE':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <GenericChart
                            title="Soil Moisture (%)"
                            data={formattedReadings}
                            lines={[{ key: 'soil_moisture', name: 'Moisture', color: 'hsl(200, 80%, 50%)' }]}
                            yAxisLabel="%"
                            color="info"
                        />
                        <GenericChart
                            title="Ground Vibration (m/s²)"
                            data={formattedReadings}
                            lines={[
                                { key: 'vib_x', name: 'X-Axis', color: 'hsl(0, 80%, 60%)' },
                                { key: 'vib_y', name: 'Y-Axis', color: 'hsl(120, 60%, 50%)' },
                                { key: 'vib_z', name: 'Z-Axis', color: 'hsl(240, 80%, 60%)' }
                            ]}
                            yAxisLabel="m/s²"
                            color="error"
                        />
                        <GenericChart
                            title="Slope Angle (°)"
                            data={formattedReadings}
                            lines={[
                                { key: 'gyro_x', name: 'Gyro X', color: 'hsl(30, 90%, 50%)' },
                                { key: 'gyro_y', name: 'Gyro Y', color: 'hsl(280, 70%, 60%)' },
                                { key: 'gyro_z', name: 'Gyro Z', color: 'hsl(180, 60%, 40%)' }
                            ]}
                            yAxisLabel="Degrees"
                            color="warning"
                        />
                        <div className="card bg-base-100 shadow-xl border-t-4 border-warning/50">
                            <div className="card-body">
                                <h3 className="card-title text-sm font-black italic mb-4">3D Slope Visualization</h3>
                                <div className="flex justify-center items-center h-64 bg-base-200 rounded-xl overflow-hidden perspective-[1000px]">
                                    <div
                                        className="relative w-40 h-40 transition-transform duration-500 ease-out"
                                        style={{
                                            transform: `rotateX(${formattedReadings[formattedReadings.length - 1]?.gyro_x ?? 50}deg) rotateY(${formattedReadings[formattedReadings.length - 1]?.gyro_y ?? -30}deg) rotateZ(${formattedReadings[formattedReadings.length - 1]?.gyro_z ?? 0}deg)`,
                                            transformStyle: 'preserve-3d'
                                        }}
                                    >
                                        <div className="absolute w-full h-full bg-warning rounded-2xl flex items-center justify-center font-black italic text-white text-xl shadow-[inset_0_0_20px_rgba(0,0,0,0.2)] border-2 border-white/20" style={{ transform: 'translateZ(16px)' }}>Landslide</div>
                                        <div className="absolute w-full h-full bg-warning rounded-2xl border-2 border-white/20" style={{ transform: 'rotateY(180deg) translateZ(16px)' }}></div>
                                        <div className="absolute w-8 h-[calc(100%-28px)] bg-warning brightness-90" style={{ left: '50%', top: '14px', marginLeft: '-16px', transform: 'rotateY(-90deg) translateZ(80px)' }}></div>
                                        <div className="absolute w-8 h-[calc(100%-28px)] bg-warning brightness-90" style={{ left: '50%', top: '14px', marginLeft: '-16px', transform: 'rotateY(90deg) translateZ(80px)' }}></div>
                                        <div className="absolute w-[calc(100%-28px)] h-8 bg-warning brightness-110" style={{ top: '50%', left: '14px', marginTop: '-16px', transform: 'rotateX(90deg) translateZ(80px)' }}></div>
                                        <div className="absolute w-[calc(100%-28px)] h-8 bg-error brightness-75" style={{ top: '50%', left: '14px', marginTop: '-16px', transform: 'rotateX(-90deg) translateZ(80px)' }}></div>
                                    </div>
                                </div>
                                <div className="flex justify-center gap-4 mt-4 text-xs font-mono opacity-70 font-bold">
                                    <span className="text-error">X: {(formattedReadings[formattedReadings.length - 1]?.gyro_x ?? 0).toFixed(1)}°</span>
                                    <span className="text-secondary">Y: {(formattedReadings[formattedReadings.length - 1]?.gyro_y ?? 0).toFixed(1)}°</span>
                                    <span className="text-primary">Z: {(formattedReadings[formattedReadings.length - 1]?.gyro_z ?? 0).toFixed(1)}°</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return <div className="alert">Unknown device type.</div>;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="btn btn-circle btn-ghost">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-base-300 shadow-sm border border-base-200 hidden md:block">
                            <img
                                src={getImageUrl(device?.image) || InsamoLogo}
                                alt={device?.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.src = InsamoLogo;
                                    e.target.onerror = null;
                                }}
                            />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black italic uppercase">{device?.name} - SENSOR DATA</h2>
                            <p className="text-sm opacity-60 font-bold uppercase tracking-widest">{device?.device_code} ({device?.device_type})</p>
                        </div>
                    </div>
                </div>
                <div className="hidden lg:block">
                    <span className="badge badge-primary badge-outline font-black italic p-4 tracking-tighter">DATA NODE: {id}</span>
                </div>
            </div>

            {/* Quick Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard label="Latest Sync" value={readings.length > 0 ? new Date(readings[readings.length - 1].recorded_at).toLocaleString() : 'N/A'} icon={<Activity size={20} />} />
                <StatCard label="Location" value={`${device?.latitude}, ${device?.longitude}`} icon={<MapPin size={20} />} />
                <StatCard label="Data Points" value={readings.length} icon={<Hash size={20} />} />
            </div>

            {renderCharts()}

            {/* Raw Data Table */}
            <div className="card bg-base-100 shadow-xl border border-base-200 overflow-hidden">
                <div className="p-6 border-b border-base-200">
                    <h3 className="font-black italic">HISTORICAL RAW DATA</h3>
                </div>
                <div className="overflow-x-auto max-h-96">
                    <table className="table table-zebra table-sm">
                        <thead className="sticky top-0 bg-base-100 z-10 font-black uppercase text-[10px] opacity-70">
                            <tr>
                                <th>Timestamp</th>
                                {device?.device_type === 'SIGMA' && <><th>Tilt X</th><th>Tilt Y</th><th>Magnitude</th></>}
                                {device?.device_type === 'FLOWS' && <><th>Water Level</th><th>Wind Speed</th><th>Temp</th></>}
                                {device?.device_type === 'LANDSLIDE' && <><th>Score</th><th>Status</th></>}
                            </tr>
                        </thead>
                        <tbody>
                            {[...readings].reverse().map((r, i) => (
                                <tr key={i}>
                                    <td className="font-mono text-[11px] opacity-60">{new Date(r.recorded_at).toLocaleString()}</td>
                                    {device?.device_type === 'SIGMA' && <><td>{r.tilt_x}</td><td>{r.tilt_y}</td><td>{r.magnitude}</td></>}
                                    {device?.device_type === 'FLOWS' && <><td>{r.water_level}</td><td>{r.wind_speed}</td><td>{r.temperature}</td></>}
                                    {device?.device_type === 'LANDSLIDE' && <><td>{r.landslide_score}</td><td><span className={`badge badge-xs font-bold ${r.landslide_status === 'DANGER' ? 'badge-error' : 'badge-success'}`}>{r.landslide_status}</span></td></>}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function ChartCard({ title, icon, children }) {
    return (
        <div className="card bg-base-100 shadow-xl border border-base-200 overflow-hidden">
            <div className="card-body p-6">
                <h3 className="card-title text-sm opacity-50 font-black uppercase tracking-widest flex items-center gap-2 mb-4">
                    {icon} {title}
                </h3>
                {children}
            </div>
        </div>
    );
}

function StatCard({ label, value, icon }) {
    return (
        <div className="stats shadow bg-base-100 border border-base-200">
            <div className="stat">
                <div className="stat-title text-[10px] font-black uppercase opacity-50 flex items-center gap-2">{icon} {label}</div>
                <div className="stat-value text-lg font-black italic">{value}</div>
            </div>
        </div>
    );
}

function MapPin({ size }) { return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>; }
function Hash({ size }) { return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-hash"><line x1="4" x2="20" y1="9" y2="9" /><line x1="4" x2="20" y1="15" y2="15" /><line x1="10" x2="8" y1="3" y2="21" /><line x1="16" x2="14" y1="3" y2="21" /></svg>; }
