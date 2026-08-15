import React, { useState, useEffect } from 'react';
import { Activity, Table as TableIcon, Download, Search } from "lucide-react";
import { api } from "../../lib/api";

const getConfidenceStyle = (confidence) => {
    if (confidence >= 0.7) return 'progress-error';
    if (confidence >= 0.4) return 'progress-warning';
    return 'progress-success';
};

const ConfidenceBar = ({ confidence }) => {
    if (confidence == null) return <span className="opacity-30">-</span>;
    const pct = Math.round(confidence * 100);
    return (
        <div className="flex items-center gap-1.5 min-w-[64px]">
            <progress className={`progress ${getConfidenceStyle(confidence)} w-10 h-1.5`} value={pct} max="100"></progress>
            <span className="font-bold">{pct}%</span>
        </div>
    );
};

const EarthquakeHistory = () => {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(1);

    useEffect(() => {
        setIsLoading(true);
        api.get('/sensor-readings', { params: { per_page: 20, page } })
            .then(res => {
                setLogs(res.data.data.filter(r => r.device?.device_type === 'SIGMA' || r.vib_x));
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, [page]);

    return (
        <div className="space-y-6">
            <div className="card bg-base-100 shadow-xl border border-base-200 overflow-hidden">
                <div className="card-body p-0">
                    <div className="p-4 border-b border-base-200 flex justify-between items-center bg-base-200/50">
                        <h3 className="font-black italic flex items-center gap-2 text-sm uppercase">
                            <Activity size={16} className="text-error" /> Earthquake History Table
                        </h3>
                        <div className="flex gap-2">
                            <button className="btn btn-xs btn-outline gap-1 leading-none"><Download size={12} /> CSV</button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="table table-zebra w-full font-mono text-[10px]">
                            <thead className="bg-base-200 uppercase">
                                <tr>
                                    <th className="font-black">No</th>
                                    <th className="font-black">Device ID</th>
                                    <th className="font-black">Lokasi</th>
                                    <th className="font-black">Waktu</th>
                                    <th className="font-black">AX</th>
                                    <th className="font-black">AY</th>
                                    <th className="font-black">AZ</th>
                                    <th className="font-black">PGA (Gal)</th>
                                    <th className="font-black">Shindo</th>
                                    <th className="font-black">Satelit</th>
                                    <th className="font-black">Status</th>
                                    <th className="font-black">AI Confidence</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log, i) => (
                                    <tr key={log.id} className="hover">
                                        <td>{i + 1 + (page - 1) * 20}</td>
                                        <td className="font-bold">{log.device?.device_code}</td>
                                        <td>{log.device?.address || 'Unknown'}</td>
                                        <td>{new Date(log.recorded_at).toLocaleString()}</td>
                                        <td>{log.vib_x || 0}</td>
                                        <td>{log.vib_y || 0}</td>
                                        <td>{log.vib_z || 0}</td>
                                        <td>{log.pga_gal ?? 0}</td>
                                        <td>{log.shindo ?? '-'}</td>
                                        <td>{log.satellite_count ?? '-'}</td>
                                        <td>
                                            <span className={`badge badge-xs font-bold ${log.earthquake_status === 'GEMPA' ? 'badge-error' : log.earthquake_status === 'CROSSCHECK' ? 'badge-warning' : 'badge-success'}`}>
                                                {log.earthquake_status || 'AMAN'}
                                            </span>
                                        </td>
                                        <td><ConfidenceBar confidence={log.classificationResults?.[0]?.confidence} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {/* Pagination */}
            <div className="flex justify-center mt-4">
                <div className="join">
                    <button className="join-item btn btn-xs" onClick={() => setPage(p => Math.max(1, p - 1))}>«</button>
                    <button className="join-item btn btn-xs">Page {page}</button>
                    <button className="join-item btn btn-xs" onClick={() => setPage(p => p + 1)}>»</button>
                </div>
            </div>
        </div>
    );
};

export default EarthquakeHistory;
