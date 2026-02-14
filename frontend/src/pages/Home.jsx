import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import L from "leaflet";
import { Link } from "react-router-dom";
import { Eye, Info, Layers, Map as MapIcon } from "lucide-react";
import { useMemo, useEffect } from 'react';

// New component to handle dynamic bounds/zoom
function SetBounds({ devices }) {
    const map = useMap();
    useEffect(() => {
        if (devices && devices.length > 0) {
            const bounds = L.latLngBounds(devices.map(d => [d.latitude, d.longitude]));
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
        }
    }, [devices, map]);
    return null;
}

// Custom marker function based on device type
const getCustomIcon = (type) => {
    let color = "#3b82f6"; // Default Blue (SIGMA)
    if (type === 'FLOWS') color = "#06b6d4"; // Cyan
    if (type === 'LANDSLIDE') color = "#f97316"; // Orange

    return L.divIcon({
        className: "custom-div-icon",
        html: `<div style="
            background-color: ${color};
            width: 24px;
            height: 24px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 2px solid white;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <div style="
                width: 8px;
                height: 8px;
                background: white;
                border-radius: 50%;
                transform: rotate(45deg);
            "></div>
        </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 24],
        popupAnchor: [0, -24]
    });
};

export default function Home() {
    const { data: devices, isLoading } = useQuery({
        queryKey: ["devices"],
        queryFn: async () => {
            const res = await api.get("/devices");
            return res.data;
        },
        refetchInterval: 10000 // Poll every 10s for map updates
    });

    // Calculate dynamic center for initial view
    const mapCenter = useMemo(() => {
        if (!devices || devices.length === 0) return [-6.2088, 106.8456]; // Default Jakarta
        const totalLat = devices.reduce((sum, d) => sum + parseFloat(d.latitude), 0);
        const totalLon = devices.reduce((sum, d) => sum + parseFloat(d.longitude), 0);
        return [totalLat / devices.length, totalLon / devices.length];
    }, [devices]);

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center h-[500px] gap-4">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="font-black italic animate-pulse">LOADING GEOSPATIAL DATA...</p>
        </div>
    );

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-base-content italic flex items-center gap-3">
                        <MapIcon className="text-primary" size={32} /> PROJECT OVERVIEW
                    </h1>
                    <p className="opacity-50 font-bold uppercase tracking-widest text-xs mt-1">Real-time geospatial asset tracking</p>
                </div>
            </div>

            <div className="relative card bg-base-100 shadow-2xl overflow-hidden h-[700px] border border-base-200">
                {/* Map Legend Overlay */}
                <div className="absolute top-4 right-4 z-[1000] bg-base-100/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-base-200 w-48 animate-in slide-in-from-right-4 duration-500">
                    <h4 className="text-[10px] font-black uppercase opacity-50 mb-3 flex items-center gap-2">
                        <Layers size={12} /> Map Legend
                    </h4>
                    <div className="space-y-2">
                        <LegendItem color="bg-blue-500" label="SIGMA" />
                        <LegendItem color="bg-cyan-500" label="FLOWS" />
                        <LegendItem color="bg-orange-500" label="LANDSLIDE" />
                    </div>
                    <div className="divider my-2 opacity-10"></div>
                    <p className="text-[10px] italic opacity-40 font-medium leading-tight">Click on markers to see live details and analysis.</p>
                </div>

                <MapContainer
                    center={mapCenter}
                    zoom={10}
                    style={{ height: "100%", width: "100%" }}
                    className="z-0"
                >
                    <SetBounds devices={devices} />
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {devices?.map((device) => (
                        <Marker
                            key={device.id}
                            position={[device.latitude, device.longitude]}
                            icon={getCustomIcon(device.device_type)}
                        >
                            <Popup className="custom-popup">
                                <div className="p-1 min-w-[200px]">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`badge badge-sm font-black italic ${device.device_type === 'SIGMA' ? 'badge-primary' :
                                            device.device_type === 'FLOWS' ? 'badge-secondary' : 'badge-accent'
                                            }`}>
                                            {device.device_type}
                                        </span>
                                        <span className="text-[10px] font-mono opacity-40 font-bold">{device.device_code}</span>
                                    </div>
                                    <h3 className="font-black text-lg italic text-base-content leading-none mb-1 uppercase tracking-tighter">
                                        {device.name}
                                    </h3>
                                    <div className="text-[11px] opacity-60 flex items-start gap-1 mb-4 italic">
                                        <Info size={12} className="shrink-0 mt-0.5" />
                                        {device.address}
                                    </div>
                                    <Link
                                        to={`/device/${device.id}/data`}
                                        className="btn  text-white btn-sm w-full rounded-xl font-black italic shadow-lg shadow-primary/20"
                                    >
                                        <Eye size={14} /> VIEW DETAILS
                                    </Link>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
}

function LegendItem({ color, label }) {
    return (
        <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${color} ring-2 ring-white shadow-sm`}></div>
            <span className="text-xs font-black italic text-base-content/80 uppercase">{label}</span>
        </div>
    );
}
