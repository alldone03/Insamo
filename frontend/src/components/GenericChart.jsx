import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';

const GenericChart = ({ data, title, lines, yAxisLabel, color }) => {
    return (
        <div className="card bg-base-100 shadow-xl border border-base-200">
            <div className="card-body p-4">
                <h3 className="card-title text-sm font-black italic flex items-center gap-2 mb-4">
                    <Activity size={16} className={`text-${color || 'primary'}`} />
                    {title}
                </h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                            <XAxis
                                dataKey="time"
                                tick={{ fontSize: 10 }}
                                tickFormatter={(timeStr) => {
                                    if (!timeStr) return '';
                                    const date = new Date(timeStr);
                                    return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
                                }}
                            />
                            <YAxis
                                tick={{ fontSize: 10 }}
                                label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', fontSize: 10 }}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Legend wrapperStyle={{ fontSize: 10 }} />
                            {lines.map((line, i) => (
                                <Line
                                    key={line.key}
                                    type="monotone"
                                    dataKey={line.key}
                                    name={line.name}
                                    stroke={line.color || `hsl(${i * 60}, 70%, 50%)`}
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 4 }}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default GenericChart;
