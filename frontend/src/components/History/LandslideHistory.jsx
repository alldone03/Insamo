import React, { useState, useEffect } from 'react';
import { Mountain, Table as TableIcon, Download } from "lucide-react";
import { api } from "../../lib/api";

const LandslideHistory = () => {
    const [logs, setLogs] = useState([]);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        api.get('/sensor-readings', { params: { per_page: 20, page } })
            .then(res => {
                setLogs(res.data.data.filter(r => r.device?.device_type === 'LANDSLIDE' || r.landslide_status));
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
                            <Mountain size={16} className="text-warning" /> Landslide History Table
                        </h3>
                        <button className="btn btn-xs btn-outline gap-1"><Download size={12} /> EXPORT</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="table table-zebra w-full font-mono text-[10px]">
                            <thead className="bg-base-200 uppercase">
                                <tr>
                                    <th className="font-black">No</th>
                                    <th className="font-black">Device ID</th>
                                    <th className="font-black">Lokasi</th>
                                    <th className="font-black">Datetime</th>
                                    <th className="font-black">Moisture</th>
                                    <th className="font-black">Magnitude</th>
                                    <th className="font-black">Slope</th>
                                    <th className="font-black">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log, i) => (
                                    <tr key={log.id} className="hover">
                                        <td>{i + 1 + (page - 1) * 20}</td>
                                        <td className="font-bold">{log.device?.device_code}</td>
                                        <td>{log.device?.address || 'Unknown'}</td>
                                        <td>{new Date(log.recorded_at).toLocaleString()}</td>
                                        <td>{log.soil_moisture || 0}%</td>
                                        <td>{log.magnitude || 0}</td>
                                        <td>{log.device_tilt || 0}°</td>
                                        <td>
                                            <span className={`badge badge-xs font-bold ${log.landslide_status === 'SAFE' ? 'badge-success' : 'badge-warning'}`}>
                                                {log.landslide_status || 'SAFE'}
                                            </span>
                                        </td>
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

export default LandslideHistory;
