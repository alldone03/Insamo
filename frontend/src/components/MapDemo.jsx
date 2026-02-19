import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Link } from "react-router-dom";
import { Eye, Info, Layers } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useEffect, useMemo } from "react";

// Dummy data for the landing page map (fallback if backend is empty)
const DUMMY_DEVICES = [
    { id: 'd1', name: "Weather Station Alpha", latitude: -6.2088, longitude: 106.8456, device_type: "SIGMA", device_code: "WS-001", address: "Jakarta Pusat" },
    { id: 'd2', name: "Flood Sensor Beta", latitude: -6.9175, longitude: 107.6191, device_type: "FLOWS", device_code: "FS-002", address: "Bandung" },
    { id: 'd3', name: "Landslide Monitor Gamma", latitude: -7.2575, longitude: 112.7521, device_type: "LANDSLIDE", device_code: "LM-003", address: "Surabaya" },
    { id: 'd4', name: "Wildfire Detector Delta", latitude: -8.4095, longitude: 115.1889, device_type: "WILDFIRE", device_code: "WD-004", address: "Bali" },
];

function SetBounds({ devices }) {
    const map = useMap();
    useEffect(() => {
        if (devices && devices.length > 0) {
            const bounds = L.latLngBounds(devices.map(d => [d.latitude, d.longitude]));
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
        }
    }, [devices, map]);
    return null;
}


const getCustomIcon = (type) => {
    let color = "#3b82f6"; // Default Blue (SIGMA)
    if (type === 'FLOWS') color = "#06b6d4"; // Cyan
    if (type === 'LANDSLIDE') color = "#f97316"; // Orange
    if (type === 'WILDFIRE') color = "#ef4444"; // Red

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

const MapDemo = () => {
    const { data: backendDevices } = useQuery({
        queryKey: ["public-devices"],
        queryFn: async () => {
            const res = await api.get("/public-devices");
            return res.data;
        },
    });

    const devices = useMemo(() => {
        if (backendDevices && backendDevices.length > 0) return backendDevices;
        return DUMMY_DEVICES;
    }, [backendDevices]);

    const mapCenter = useMemo(() => {
        if (!devices || devices.length === 0) return [-7.5, 110.0];
        const totalLat = devices.reduce((sum, d) => sum + parseFloat(d.latitude), 0);
        const totalLon = devices.reduce((sum, d) => sum + parseFloat(d.longitude), 0);
        return [totalLat / devices.length, totalLon / devices.length];
    }, [devices]);

    return (
        <div className="relative card bg-base-100 shadow-2xl overflow-hidden h-[500px] border border-base-200">
            {/* Map Legend Overlay */}
            <div className="absolute top-4 right-4 z-[400] bg-base-100/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-base-200 w-48 pointer-events-none">
                <h4 className="text-[10px] font-black uppercase opacity-50 mb-3 flex items-center gap-2">
                    <Layers size={12} /> Live Network
                </h4>
                <div className="space-y-2">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span className="text-xs font-bold">SIGMA</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-cyan-500"></div><span className="text-xs font-bold">FLOWS</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500"></div><span className="text-xs font-bold">LANDSLIDE</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div><span className="text-xs font-bold">WILDFIRE</span></div>
                </div>
            </div>

            <MapContainer
                center={mapCenter}
                zoom={6}
                style={{ height: "100%", width: "100%" }}
                className="z-0"
                scrollWheelZoom={false}
            >
                <SetBounds devices={devices} />
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {devices.map((device) => (
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
                                    to="/register"
                                    className="btn btn-primary text-white btn-sm w-full rounded-xl font-black italic shadow-lg shadow-primary/20"
                                >
                                    <Eye size={14} /> VIEW DETAILS
                                </Link>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default MapDemo;
