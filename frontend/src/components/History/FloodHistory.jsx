import React, { useState, useMemo, useEffect } from 'react';
import {
    Waves,
    TrendingUp,
    BarChart3,
    Table as TableIcon,
    Search,
    Download,
    Filter,
    Activity
} from "lucide-react";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { api } from "../../lib/api";
import { io } from "socket.io-client";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const getStatus = (level, settings) => {
    const danger = settings?.danger_threshold || 80;
    const alert = settings?.alert_threshold || 50;
    const siaga2 = 10;

    if (level >= danger) return { label: 'BAHAYA', type: 'error', color: 'badge-error' };
    if (level >= alert) return { label: 'SIAGA 1', type: 'warning', color: 'badge-warning' };
    if (level >= siaga2) return { label: 'SIAGA 2', type: 'info', color: 'badge-info' };
    return { label: 'AMAN', type: 'success', color: 'badge-success' };
};

const FloodHistory = () => {
    const [deviceId, setDeviceId] = useState('');
    const [dateRange, setDateRange] = useState('7d');
    const [devices, setDevices] = useState([]);
    const [rawLogs, setRawLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const limit = 10;

    useEffect(() => {
        let isMounted = true;
        api.get('/devices').then(res => {
            if (isMounted) {
                const flowsDevices = res.data.filter(d => d.device_type === 'FLOWS');
                setDevices(flowsDevices);
            }
        });
        return () => { isMounted = false; };
    }, []);

    const currentDeviceSettings = useMemo(() => {
        if (!deviceId) return null;
        return devices.find(d => String(d.id) === String(deviceId))?.settings || null;
    }, [devices, deviceId]);

    const calibrateLevel = (val) => {
        const initial = currentDeviceSettings?.initial_distance || 10;
        return val + initial;
    };

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const params = new URLSearchParams();
                if (deviceId) params.append('device_id', deviceId);

                const now = new Date();
                const start = new Date();
                if (dateRange === '1d') start.setDate(now.getDate() - 1);
                else if (dateRange === '7d') start.setDate(now.getDate() - 7);
                else if (dateRange === '30d') start.setDate(now.getDate() - 30);

                params.append('start_date', start.toISOString());
                params.append('end_date', now.toISOString());
                params.append('per_page', '1000'); // get enough logs

                const res = await api.get(`/sensor-readings?${params.toString()}`);
                if (isMounted && res.data && res.data.data) {
                    setRawLogs(res.data.data);
                    setPage(1); // reset page on filter change
                }
            } catch (error) {
                console.error("Error fetching readings:", error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        fetchData();
        return () => { isMounted = false; };
    }, [deviceId, dateRange]);

    useEffect(() => {
        const backendUrl = import.meta.env.VITE_API_URL
            ? new URL(import.meta.env.VITE_API_URL).origin
            : "http://localhost:3000";
        const socket = io(backendUrl, { path: '/socket.io/', transports: ['websocket', 'polling'] });

        socket.on('new_sensor_reading', (payload) => {
            if (payload.device_type === 'FLOWS') {
                setRawLogs(prev => {
                    if (deviceId && String(payload.device_id) !== String(deviceId)) {
                        return prev;
                    }
                    // Prevent duplicate insertion
                    if (prev.some(log => log.id === payload.reading.id)) {
                        return prev;
                    }
                    return [payload.reading, ...prev];
                });
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [deviceId]);

    const hourlyData = useMemo(() => {
        if (!rawLogs.length) return [];
        const groups = {};
        rawLogs.forEach(log => {
            const d = new Date(log.recorded_at);
            const hour = `${String(d.getHours()).padStart(2, '0')}:00`;
            if (!groups[hour]) groups[hour] = { sum: 0, count: 0 };
            groups[hour].sum += calibrateLevel(log.water_level || 0);
            groups[hour].count += 1;
        });
        return Object.keys(groups).sort().map(hour => ({
            hour,
            avg_level: +(groups[hour].sum / groups[hour].count).toFixed(1)
        }));
    }, [rawLogs, currentDeviceSettings]);

    const trendData = useMemo(() => {
        if (!rawLogs.length) return [];
        const groups = {};
        // Use ascending order for trend timeline
        [...rawLogs].reverse().forEach(log => {
            const d = new Date(log.recorded_at);
            const key = dateRange === '1d'
                ? `${String(d.getHours()).padStart(2, '0')}:00`
                : `${d.getMonth() + 1}/${d.getDate()}`;
            if (!groups[key]) groups[key] = { sum: 0, count: 0 };
            groups[key].sum += calibrateLevel(log.water_level || 0);
            groups[key].count += 1;
        });
        const timeline = Object.keys(groups);
        return timeline.map((time, idx, arr) => {
            const value = +(groups[time].sum / groups[time].count).toFixed(1);
            let maSum = 0;
            let maCount = 0;
            for (let i = Math.max(0, idx - 6); i <= idx; i++) {
                maSum += +(groups[arr[i]].sum / groups[arr[i]].count);
                maCount++;
            }
            return {
                time,
                value,
                ma: +(maSum / maCount).toFixed(1)
            }
        });
    }, [rawLogs, dateRange, currentDeviceSettings]);

    const distributionData = useMemo(() => {
        const danger = currentDeviceSettings?.danger_threshold || 80;
        const alert = currentDeviceSettings?.alert_threshold || 50;
        const counts = { [`< ${alert}cm`]: 0, [`${alert}-${danger}cm`]: 0, [`> ${danger}cm`]: 0 };

        rawLogs.forEach(log => {
            const l = calibrateLevel(log.water_level || 0);
            if (l < alert) counts[`< ${alert}cm`]++;
            else if (l <= danger) counts[`${alert}-${danger}cm`]++;
            else counts[`> ${danger}cm`]++;
        });
        return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
    }, [rawLogs, currentDeviceSettings]);

    const statusData = useMemo(() => {
        const counts = { 'Aman': 0, 'Siaga 2': 0, 'Siaga 1': 0, 'Bahaya': 0 };
        rawLogs.forEach(log => {
            const l = calibrateLevel(log.water_level || 0);
            const statusObj = getStatus(l, currentDeviceSettings);
            if (statusObj.label === 'BAHAYA') counts['Bahaya']++;
            else if (statusObj.label === 'SIAGA 1') counts['Siaga 1']++;
            else if (statusObj.label === 'SIAGA 2') counts['Siaga 2']++;
            else counts['Aman']++;
        });
        return Object.keys(counts).map(key => ({ name: key, value: counts[key] })).filter(d => d.value > 0);
    }, [rawLogs, currentDeviceSettings]);

    const lastWaterLevel = calibrateLevel(rawLogs[0]?.water_level || 0);
    const totalData = rawLogs.length;
    const totalPages = Math.ceil(totalData / limit);
    const paginatedLogs = rawLogs.slice((page - 1) * limit, page * limit);

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="card bg-base-100 shadow-xl border border-base-200">
                <div className="card-body p-4 flex flex-row flex-wrap items-center gap-4">
                    <div className="form-control w-full max-w-xs">
                        <label className="label py-1"><span className="label-text text-[10px] font-bold opacity-50 uppercase">Select Device</span></label>
                        <select
                            className="select select-bordered select-sm w-full font-bold"
                            value={deviceId}
                            onChange={(e) => setDeviceId(e.target.value)}
                        >
                            <option value="">All Devices</option>
                            {devices.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>

                    <div className="form-control w-full max-w-xs">
                        <label className="label py-1"><span className="label-text text-[10px] font-bold opacity-50 uppercase">Date Range</span></label>
                        <div className="join">
                            <button className={`btn btn-sm join-item ${dateRange === '1d' ? 'btn-active' : ''}`} onClick={() => setDateRange('1d')}>Today</button>
                            <button className={`btn btn-sm join-item ${dateRange === '7d' ? 'btn-active' : ''}`} onClick={() => setDateRange('7d')}>7 Days</button>
                            <button className={`btn btn-sm join-item ${dateRange === '30d' ? 'btn-active' : ''}`} onClick={() => setDateRange('30d')}>30 Days</button>
                        </div>
                    </div>

                    {isLoading && (
                        <div className="loading loading-spinner loading-md text-primary self-end mb-1"></div>
                    )}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="stat bg-base-100 shadow-xl rounded-2xl border border-base-200">
                    <div className="stat-figure text-primary"><Waves size={32} /></div>
                    <div className="stat-title text-xs font-bold opacity-50">KETINGGIAN TERAKHIR</div>
                    <div className="stat-value text-primary">{lastWaterLevel.toFixed(1)}<span className="text-sm font-normal ml-1">cm</span></div>
                    <div className="stat-desc font-medium">Just updated</div>
                </div>
                <div className="stat bg-base-100 shadow-xl rounded-2xl border border-base-200">
                    <div className="stat-figure text-secondary"><TrendingUp size={32} /></div>
                    <div className="stat-title text-xs font-bold opacity-50">TOTAL DATA (RAW)</div>
                    <div className="stat-value">{totalData}</div>
                    <div className="stat-desc font-medium text-success">Within range</div>
                </div>
                <div className="stat bg-base-100 shadow-xl rounded-2xl border border-base-200">
                    <div className="stat-figure text-error"><Filter size={32} /></div>
                    <div className="stat-title text-xs font-bold opacity-50">THRESHOLD BAHAYA</div>
                    <div className="stat-value text-error">{currentDeviceSettings?.danger_threshold || 80}<span className="text-sm font-normal ml-1">cm</span></div>
                    <div className="stat-desc font-medium">Alert active</div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Hourly Average */}
                <div className="card bg-base-100 shadow-xl border border-base-200">
                    <div className="card-body p-5">
                        <h3 className="card-title text-sm font-black italic flex items-center gap-2 mb-4">
                            <TrendingUp size={16} className="text-primary" />
                            Rata-rata Ketinggian Air Per Jam (cm)
                        </h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={hourlyData}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                    <XAxis dataKey="hour" fontSize={10} />
                                    <YAxis fontSize={10} />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="avg_level" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Moving Average Trend */}
                <div className="card bg-base-100 shadow-xl border border-base-200">
                    <div className="card-body p-5">
                        <h3 className="card-title text-sm font-black italic flex items-center gap-2 mb-4">
                            <Activity size={16} className="text-secondary" />
                            Garis Trend (7-Periode MA)
                        </h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                    <XAxis dataKey="time" fontSize={10} />
                                    <YAxis fontSize={10} />
                                    <Tooltip />
                                    <Legend wrapperStyle={{ fontSize: 10 }} />
                                    <Line type="monotone" dataKey="value" stroke="#94a3b8" strokeWidth={1} dot={false} name="Raw Value" />
                                    <Line type="monotone" dataKey="ma" stroke="#f43f5e" strokeWidth={3} dot={false} name="7-Period MA" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Histogram Distribution */}
                <div className="card bg-base-100 shadow-xl border border-base-200">
                    <div className="card-body p-5">
                        <h3 className="card-title text-sm font-black italic flex items-center gap-2 mb-4">
                            <BarChart3 size={16} className="text-warning" />
                            Histogram Distribusi Ketinggian
                        </h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={distributionData}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                    <XAxis dataKey="name" fontSize={10} />
                                    <YAxis fontSize={10} />
                                    <Tooltip />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {distributionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Status Distribution */}
                <div className="card bg-base-100 shadow-xl border border-base-200">
                    <div className="card-body p-5">
                        <h3 className="card-title text-sm font-black italic flex items-center gap-2 mb-4">
                            <Waves size={16} className="text-info" />
                            Distribusi Status Air
                        </h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Raw Data Table */}
            <div className="card bg-base-100 shadow-xl border border-base-200 overflow-hidden">
                <div className="card-body p-0">
                    <div className="p-4 border-b border-base-200 flex justify-between items-center bg-base-200/50">
                        <h3 className="font-black italic flex items-center gap-2 text-sm">
                            <TableIcon size={16} /> DATA DETAIL (RAW)
                        </h3>
                        <button className="btn btn-xs btn-outline gap-1">
                            <Download size={12} /> EXCEL
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="table table-zebra w-full font-mono text-[10px]">
                            <thead className="bg-base-200">
                                <tr>
                                    <th className="font-black italic">WAKTU RECORDED</th>
                                    <th className="font-black italic">LEVEL (cm)</th>
                                    <th className="font-black italic">STATUS</th>
                                    <th className="font-black italic">TEMP (°C)</th>
                                    <th className="font-black italic">WIND (m/s)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedLogs.map((log) => {
                                    const calLevel = calibrateLevel(log.water_level || 0);
                                    const status = getStatus(calLevel, currentDeviceSettings);
                                    return (
                                        <tr key={log.id}>
                                            <td>{new Date(log.recorded_at).toLocaleString('id-ID')}</td>
                                            <td className="font-bold text-primary">{calLevel.toFixed(1)} cm</td>
                                            <td><span className={`badge badge-xs ${status.color}`}>{status.label}</span></td>
                                            <td>{(log.temperature || 0).toFixed(1)}</td>
                                            <td>{(log.wind_speed || 0).toFixed(1)}</td>
                                        </tr>
                                    );
                                })}
                                {paginatedLogs.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="text-center py-4">No data available for selected criteria</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (
                        <div className="p-4 flex justify-center border-t border-base-200">
                            <div className="join">
                                <button
                                    className="join-item btn btn-xs btn-outline"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >«</button>
                                <button className="join-item btn btn-xs btn-outline">Page {page} of {totalPages}</button>
                                <button
                                    className="join-item btn btn-xs btn-outline"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                >»</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FloodHistory;

