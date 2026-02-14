import { History as HistoryIcon, TrendingUp, Activity, Clock } from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from "recharts";

const data = [
    { time: "00:00", temperature: 24, humidity: 45, power: 120 },
    { time: "02:00", temperature: 23, humidity: 46, power: 110 },
    { time: "04:00", temperature: 22, humidity: 48, power: 105 },
    { time: "06:00", temperature: 24, humidity: 50, power: 130 },
    { time: "08:00", temperature: 26, humidity: 42, power: 250 },
    { time: "10:00", temperature: 28, humidity: 40, power: 310 },
    { time: "12:00", temperature: 30, humidity: 38, power: 330 },
    { time: "14:00", temperature: 32, humidity: 35, power: 340 },
    { time: "16:00", temperature: 31, humidity: 37, power: 300 },
    { time: "18:00", temperature: 29, humidity: 40, power: 220 },
    { time: "20:00", temperature: 27, humidity: 43, power: 180 },
    { time: "22:00", temperature: 25, humidity: 45, power: 150 },
];

export default function History() {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-3xl font-black flex items-center gap-3">
                    <HistoryIcon className="text-primary" size={32} />
                    Device History & Analytics
                </h2>
                <p className="opacity-60">Visualizing historical data and device performance relations</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Temperature Card */}
                <div className="card bg-base-100 shadow-xl border border-base-200">
                    <div className="card-body">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="card-title flex items-center gap-2">
                                <TrendingUp className="text-orange-500" />
                                Temperature Variation
                            </h3>
                            <div className="badge badge-warning font-bold">AVG 27°C</div>
                        </div>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data}>
                                    <defs>
                                        <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
                                    <XAxis dataKey="time" strokeOpacity={0.5} fontSize={12} />
                                    <YAxis strokeOpacity={0.5} fontSize={12} unit="°C" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--color-base-100)', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="temperature" stroke="#f97316" fillOpacity={1} fill="url(#colorTemp)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Power Usage Card */}
                <div className="card bg-base-100 shadow-xl border border-base-200">
                    <div className="card-body">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="card-title flex items-center gap-2">
                                <Activity className="text-blue-500" />
                                Power Consumption (W)
                            </h3>
                            <div className="badge badge-info font-bold">Peak 340W</div>
                        </div>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
                                    <XAxis dataKey="time" strokeOpacity={0.5} fontSize={12} />
                                    <YAxis strokeOpacity={0.5} fontSize={12} unit="W" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--color-base-100)', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Line type="monotone" dataKey="power" stroke="#2563eb" strokeWidth={3} dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Relation Summary */}
            <div className="card bg-primary text-primary-content shadow-2xl">
                <div className="card-body md:flex-row md:items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-2xl">
                            <Clock size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black">Performance Correlation</h3>
                            <p className="opacity-80">Device power peaks align with temperature increase (10:00 - 16:00)</p>
                        </div>
                    </div>
                    <button className="btn btn-ghost border-white/20 hover:bg-white/10 mt-4 md:mt-0 font-bold">
                        Export Report
                    </button>
                </div>
            </div>
        </div>
    );
}
