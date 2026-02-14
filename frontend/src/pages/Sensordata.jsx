import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area, BarChart, Bar
} from 'recharts';
import { Activity, ArrowLeft, Thermometer, Droplets, Wind, Waves, Move, Zap, TrendingUp, AlertTriangle } from "lucide-react";

export default function Sensordata() {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: device, isLoading: isLoadingDevice } = useQuery({
        queryKey: ["device", id],
        queryFn: async () => {
            const res = await api.get(`/devices/${id}`);
            return res.data;
        },
        refetchInterval: 5000, // Update charts every 5 seconds
    });

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
        datetime: formatDateTime(r.recorded_at)
    })).reverse();

    if (isLoadingDevice) return <div className="flex justify-center p-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>;

    const renderCharts = () => {
        const type = device?.device_type;

        switch (type) {
            case 'SIGMA':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ChartCard title="Tilt Stability (X & Y)" icon={<Move className="text-primary" />}>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={formattedReadings}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                    <XAxis
                                        dataKey="datetime"
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                        tick={{ fontSize: 10 }}
                                    />
                                    <YAxis />
                                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                    <Legend />
                                    <Area type="monotone" dataKey="tilt_x" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={3} isAnimationActive={false} />
                                    <Area type="monotone" dataKey="tilt_y" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} strokeWidth={3} isAnimationActive={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartCard>
                        <ChartCard title="Magnitude Analysis" icon={<Zap className="text-accent" />}>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={formattedReadings}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                    <XAxis
                                        dataKey="datetime"
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                        tick={{ fontSize: 10 }}
                                    />
                                    <YAxis />
                                    <Tooltip contentStyle={{ borderRadius: '16px' }} />
                                    <Legend />
                                    <Line type="stepAfter" dataKey="magnitude" stroke="#f59e0b" strokeWidth={3} dot={false} isAnimationActive={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>
                );
            case 'FLOWS':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ChartCard title="Water Level & Wind Speed" icon={<Waves className="text-secondary" />}>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={formattedReadings}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                    <XAxis
                                        dataKey="datetime"
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                        tick={{ fontSize: 10 }}
                                    />
                                    <YAxis yAxisId="left" />
                                    <YAxis yAxisId="right" orientation="right" />
                                    <Tooltip contentStyle={{ borderRadius: '16px' }} />
                                    <Legend />
                                    <Line yAxisId="left" type="monotone" dataKey="water_level" stroke="#0ea5e9" strokeWidth={3} dot={false} isAnimationActive={false} />
                                    <Line yAxisId="right" type="monotone" dataKey="wind_speed" stroke="#64748b" strokeWidth={2} dot={false} strokeDasharray="5 5" isAnimationActive={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </ChartCard>
                        <ChartCard title="Ambient Temperature" icon={<Thermometer className="text-error" />}>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={formattedReadings}>
                                    <defs>
                                        <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                    <XAxis
                                        dataKey="datetime"
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                        tick={{ fontSize: 10 }}
                                    />
                                    <YAxis domain={['dataMin - 5', 'dataMax + 5']} />
                                    <Tooltip contentStyle={{ borderRadius: '16px' }} />
                                    <Area type="monotone" dataKey="temperature" stroke="#ef4444" fillOpacity={1} fill="url(#colorTemp)" strokeWidth={3} isAnimationActive={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartCard>
                        <ChartCard title="Rainfall Intensity" icon={<Droplets className="text-primary" />}>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={formattedReadings}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                    <XAxis
                                        dataKey="datetime"
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                        tick={{ fontSize: 10 }}
                                    />
                                    <YAxis />
                                    <Tooltip contentStyle={{ borderRadius: '16px' }} />
                                    <Bar dataKey="rainfall_intensity" fill="#3b82f6" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>
                );
            case 'LANDSLIDE':
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ChartCard title="Landslide Risk Score" icon={<TrendingUp className="text-warning" />}>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={formattedReadings}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                    <XAxis
                                        dataKey="datetime"
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                        tick={{ fontSize: 10 }}
                                    />
                                    <YAxis domain={[0, 100]} />
                                    <Tooltip contentStyle={{ borderRadius: '16px' }} />
                                    <Bar dataKey="landslide_score" fill="#f97316" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>
                        <div className="card bg-base-100 shadow-xl border border-base-200">
                            <div className="card-body">
                                <h3 className="card-title text-sm opacity-50 font-black uppercase tracking-widest flex items-center gap-2">
                                    <AlertTriangle className="text-error" size={16} /> Current Status
                                </h3>
                                <div className="flex flex-col items-center justify-center flex-grow py-8">
                                    <div className={`text-5xl font-black italic mb-2 ${formattedReadings[formattedReadings.length - 1]?.landslide_status === 'DANGER' ? 'text-error' : 'text-success'}`}>
                                        {formattedReadings[formattedReadings.length - 1]?.landslide_status || 'STABLE'}
                                    </div>
                                    <p className="text-xs opacity-50 font-bold">LATEST ANALYTICS REPORT</p>
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
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="btn btn-circle btn-ghost">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h2 className="text-3xl font-black italic uppercase">{device?.name} - SENSOR DATA</h2>
                    <p className="text-sm opacity-60 font-bold uppercase tracking-widest">{device?.device_code} ({device?.device_type})</p>
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
