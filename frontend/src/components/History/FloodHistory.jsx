import React, { useState, useMemo, useEffect } from 'react';
import {
    Waves,
    TrendingUp,
    BarChart3,
    Table as TableIcon,
    Calendar,
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const FloodHistory = () => {
    const [deviceId, setDeviceId] = useState('');
    const [dateRange, setDateRange] = useState('7d');
    const [devices, setDevices] = useState([]);
    const [rawLogs, setRawLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        api.get('/devices').then(res => setDevices(res.data.filter(d => d.device_type === 'FLOWS' || d.device_type === 'SIGMA')));
    }, []);

    // Simulated / Processed Data for Charts
    const hourlyData = useMemo(() => {
        // Hourly pattern (seasonal)
        return Array.from({ length: 24 }).map((_, i) => ({
            hour: `${String(i).padStart(2, '0')}:00`,
            avg_level: 10 + Math.random() * 50
        }));
    }, []);

    const trendData = useMemo(() => {
        // 7-Period MA
        let base = 20;
        return Array.from({ length: 30 }).map((_, i) => {
            base += (Math.random() - 0.5) * 5;
            return {
                day: i + 1,
                value: base,
                ma: base * 0.9 + (Math.random() * 5)
            };
        });
    }, []);

    const distributionData = [
        { name: '< 9cm', value: 40 },
        { name: '9-19cm', value: 35 },
        { name: '19+cm', value: 25 },
    ];

    const statusData = [
        { name: 'Aman', value: 60 },
        { name: 'Siaga 1', value: 25 },
        { name: 'Siaga 2', value: 10 },
        { name: 'Bahaya', value: 5 },
    ];

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

                    <button className="btn btn-sm btn-primary self-end gap-2">
                        <Search size={14} /> FILTER
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="stat bg-base-100 shadow-xl rounded-2xl border border-base-200">
                    <div className="stat-figure text-primary"><Waves size={32} /></div>
                    <div className="stat-title text-xs font-bold opacity-50">KETINGGIAN TERAKHIR</div>
                    <div className="stat-value text-primary">180<span className="text-sm font-normal ml-1">cm</span></div>
                    <div className="stat-desc font-medium">Just updated</div>
                </div>
                <div className="stat bg-base-100 shadow-xl rounded-2xl border border-base-200">
                    <div className="stat-figure text-secondary"><TrendingUp size={32} /></div>
                    <div className="stat-title text-xs font-bold opacity-50">TOTAL DATA (RAW)</div>
                    <div className="stat-value">12.4K</div>
                    <div className="stat-desc font-medium text-success">↗︎ 40 (2%)</div>
                </div>
                <div className="stat bg-base-100 shadow-xl rounded-2xl border border-base-200">
                    <div className="stat-figure text-error"><Filter size={32} /></div>
                    <div className="stat-title text-xs font-bold opacity-50">THRESHOLD BAHAYA</div>
                    <div className="stat-value text-error">150<span className="text-sm font-normal ml-1">cm</span></div>
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
                            Garis Trend (7-Periode MA Per Jam)
                        </h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                    <XAxis dataKey="day" fontSize={10} />
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
                            Histogram Distribusi Ketinggian (Per Jam)
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
                                    <th className="font-black italic">DEVICE CODE</th>
                                    <th className="font-black italic">LEVEL (cm)</th>
                                    <th className="font-black italic">STATUS</th>
                                    <th className="font-black italic">TEMP (°C)</th>
                                    <th className="font-black italic">WIND (m/s)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[1, 2, 3, 4, 5].map(i => (
                                    <tr key={i}>
                                        <td>2024-02-23 10:00:0{i}</td>
                                        <td>FLOWS-00{i}</td>
                                        <td className="font-bold text-primary">1{i}0 cm</td>
                                        <td><span className="badge badge-success badge-xs">AMAN</span></td>
                                        <td>2{i}.5</td>
                                        <td>{i}.2</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 flex justify-center border-t border-base-200">
                        <div className="join">
                            <button className="join-item btn btn-xs btn-outline">«</button>
                            <button className="join-item btn btn-xs btn-outline">Page 1</button>
                            <button className="join-item btn btn-xs btn-outline">»</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FloodHistory;
