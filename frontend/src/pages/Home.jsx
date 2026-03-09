import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getImageUrl } from "../lib/api";
import { io } from "socket.io-client";
import L from "leaflet";
import { Link } from "react-router-dom";
import { Eye, Info, Layers, Map as MapIcon } from "lucide-react";
import { useMemo, useEffect, useState } from 'react';

import banjier from "../assets/banjier.webp";
import longsyor from "../assets/longsyor.webp";
import apiapi from "../assets/apiapi.webp";
import gempajir from "../assets/gempajir.webp";
import logoInsamo from "../assets/logoInsamo.webp";

// New component to handle dynamic bounds/zoom (Only fits once to prevent jumping on data updates)
function SetBounds({ devices }) {
    const map = useMap();
    const [hasFit, setHasFit] = useState(false);

    useEffect(() => {
        if (devices && devices.length > 0 && !hasFit) {
            const bounds = L.latLngBounds(devices.map(d => [d.latitude, d.longitude]));
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
            setHasFit(true);
        }
    }, [devices?.length, map, hasFit]);

    return null;
}

// GeoJSON layer component
function GeoJsonLayer({ url, visible, color = "#3b82f6" }) {
    const { data, isLoading } = useQuery({
        queryKey: ["geojson", url],
        queryFn: async () => {
            if (!url) return null;

            // Map the BMKG URLs to our backend proxy types
            let proxyType = null;
            if (url.includes('jatimkab.json')) proxyType = 'kab';
            else if (url.includes('bahaya_longsor.json')) proxyType = 'longsor';
            else if (url.includes('airport_indo.json')) proxyType = 'airport';

            if (proxyType) {
                const res = await api.get(`/geo-proxy`, { params: { type: proxyType } });
                return res.data;
            }

            // Fallback for other URLs that might not need proxying (CORS-friendly sites)
            const res = await fetch(url);
            if (!res.ok) throw new Error("Network response was not ok");
            return res.json();
        },
        enabled: visible && !!url,
        staleTime: Infinity,
    });

    if (!visible || !data) return null;

    return (
        <GeoJSON
            data={data}
            style={{
                color: color,
                weight: 1.5,
                opacity: 0.8,
                fillColor: color,
                fillOpacity: 0.15
            }}
            onEachFeature={(feature, layer) => {
                if (feature.properties && (feature.properties.NAME_2 || feature.properties.NAMOBJ || feature.properties.Keterangan)) {
                    const name = feature.properties.NAME_2 || feature.properties.NAMOBJ || feature.properties.Keterangan || "Feature";
                    layer.bindPopup(`<strong>${name}</strong>`);
                }
            }}
        />
    );
}

// Custom marker function based on device type and status
const getCustomIcon = (type, status) => {
    let color = "#3b82f6"; // Default Blue (SIGMA)
    let iconUrl = logoInsamo;

    if (type === 'FLOWS') {
        color = "#06b6d4";
        iconUrl = banjier;
    } else if (type === 'LANDSLIDE') {
        color = "#f97316";
        iconUrl = longsyor;
    } else if (type === 'WILDFIRE') {
        color = "#ef4444";
        iconUrl = apiapi;
    } else if (type === 'SIGMA') {
        color = "#3b82f6";
        iconUrl = gempajir;
    }

    // Change to black if offline or inactive
    if (status === 'OFFLINE' || status === 'INACTIVE') {
        color = "#1a1a1a";
    }

    return L.divIcon({
        className: "custom-div-icon",
        html: `<div style="
            background-color: ${color};
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 2px solid white;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <div style="
                width: 22px;
                height: 22px;
                background: white;
                border-radius: 50%;
                transform: rotate(45deg);
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
            ">
                <img src="${iconUrl}" style="width: 100%; height: 100%; object-fit: contain; background-color: ${color}; " alt="${type}" />
            </div>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
};

export default function Home() {
    const queryClient = useQueryClient();
    const { data: devices, isLoading } = useQuery({
        queryKey: ["devices"],
        queryFn: async () => {
            const res = await api.get("/devices");
            return res.data;
        }
    });

    useEffect(() => {
        const backendUrl = import.meta.env.VITE_API_URL
            ? new URL(import.meta.env.VITE_API_URL).origin
            : "http://localhost:3000";
        const socket = io(backendUrl, { path: '/socket.io/', transports: ['websocket', 'polling'] });

        socket.on('new_sensor_reading', (payload) => {
            queryClient.setQueryData(["devices"], (oldData) => {
                if (!oldData) return oldData;
                return oldData.map(device => {
                    if (String(device.id) === String(payload.device_id)) {
                        return {
                            ...device,
                            status: 'ACTIVE',
                            updatedAt: new Date().toISOString()
                        };
                    }
                    return device;
                });
            });
        });

        return () => {
            socket.disconnect();
        };
    }, [queryClient]);

    // Calculate dynamic center for initial view (only re-computes if device count changes)
    const mapCenter = useMemo(() => {
        if (!devices || devices.length === 0) return [-6.2088, 106.8456]; // Default Jakarta
        const totalLat = devices.reduce((sum, d) => sum + parseFloat(d.latitude), 0);
        const totalLon = devices.reduce((sum, d) => sum + parseFloat(d.longitude), 0);
        return [totalLat / devices.length, totalLon / devices.length];
    }, [devices?.length]);

    const [activeLayers, setActiveLayers] = useState({
        kab: false,
        kec: false,
        tol: false,
        ap: false,
        sungai: false,
        longsor: false,
        rw10: false,
        rw28: false,
        gempa: false
    });

    const [deviceFilter, setDeviceFilter] = useState({
        SIGMA: true,
        FLOWS: true,
        LANDSLIDE: true,
        WILDFIRE: true,
        OFFLINE: true
    });

    const toggleLayer = (id, checked) => {
        setActiveLayers(prev => ({ ...prev, [id]: checked }));
    };

    const toggleDeviceFilter = (id, checked) => {
        setDeviceFilter(prev => ({ ...prev, [id]: checked }));
    };

    // Fetch latest earthquake data
    const { data: gempaData } = useQuery({
        queryKey: ["gempa"],
        queryFn: async () => {
            const res = await fetch("https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json");
            return res.json();
        },
        refetchInterval: 60000,
        enabled: activeLayers.gempa
    });

    const earthquakeMarker = useMemo(() => {
        if (!activeLayers.gempa || !gempaData?.Infogempa?.gempa) return null;
        const g = gempaData.Infogempa.gempa;
        const coords = g.Coordinates.split(',');
        return {
            position: [parseFloat(coords[0]), parseFloat(coords[1])],
            info: g
        };
    }, [gempaData, activeLayers.gempa]);

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

                {/* --- BAGIAN DROPDOWN SETTINGS --- */}
                <div className="dropdown dropdown-end absolute top-4 right-4 z-[30]">
                    <div
                        tabIndex={0}
                        role="button"
                        className="btn btn-sm bg-base-100/90 backdrop-blur-md shadow-xl border-base-200 gap-2 font-black italic text-xs animate-in slide-in-from-right-4 duration-500"
                    >
                        <Layers size={14} /> MAP SETTINGS
                    </div>

                    <div
                        tabIndex={0}
                        className="dropdown-content z-[1] menu mt-2 bg-neutral-900/80 backdrop-blur-xl p-5 rounded-3xl shadow-2xl border border-white/10 w-72 max-h-[80vh] overflow-y-auto"
                    >

                        <div className="space-y-4">
                            {/* <p className="text-[10px] text-white/40 mt-6 italic font-medium leading-tight text-center">
                                Filter devices and toggle map layers.
                            </p> */}
                            {/* Device Legend Section */}
                            <div>
                                <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3 px-1">Device Categories</h3>
                                <div className="space-y-2">
                                    <LegendToggle color="bg-blue-500" label="SIGMA" icon={gempajir} checked={deviceFilter.SIGMA} onChange={(c) => toggleDeviceFilter('SIGMA', c)} />
                                    <LegendToggle color="bg-cyan-500" label="FLOWS" icon={banjier} checked={deviceFilter.FLOWS} onChange={(c) => toggleDeviceFilter('FLOWS', c)} />
                                    <LegendToggle color="bg-orange-500" label="LANDSLIDE" icon={longsyor} checked={deviceFilter.LANDSLIDE} onChange={(c) => toggleDeviceFilter('LANDSLIDE', c)} />
                                    <LegendToggle color="bg-red-500" label="WILDFIRE" icon={apiapi} checked={deviceFilter.WILDFIRE} onChange={(c) => toggleDeviceFilter('WILDFIRE', c)} />
                                    <LegendToggle color="bg-black" label="OFFLINE" icon={logoInsamo} checked={deviceFilter.OFFLINE} onChange={(c) => toggleDeviceFilter('OFFLINE', c)} />
                                </div>
                            </div>

                            <div className="divider opacity-10 my-0"></div>

                            {/* Overlays Section */}
                            <div>
                                <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3 px-1">Geospatial Overlays</h3>
                                <div id="section-overlay" className="space-y-2">
                                    <OverlayToggle label="Kota/Kabupaten" checked={activeLayers.kab} onChange={(c) => toggleLayer('kab', c)} />
                                    <OverlayToggle label="Kecamatan" checked={activeLayers.kec} onChange={(c) => toggleLayer('kec', c)} />
                                    <OverlayToggle label="Jalan Tol" checked={activeLayers.tol} onChange={(c) => toggleLayer('tol', c)} />
                                    <OverlayToggle label="Bandara" checked={activeLayers.ap} onChange={(c) => toggleLayer('ap', c)} />
                                    <OverlayToggle label="Sungai" checked={activeLayers.sungai} onChange={(c) => toggleLayer('sungai', c)} />
                                    <OverlayToggle label="Kerawanan Longsor" checked={activeLayers.longsor} onChange={(c) => toggleLayer('longsor', c)} />
                                    <OverlayToggle label="Update Gempa" checked={activeLayers.gempa} onChange={(c) => toggleLayer('gempa', c)} />
                                    <div className="divider my-1 opacity-20"></div>
                                    <OverlayToggle label="Holding Area RW 10" checked={activeLayers.rw10} onChange={(c) => toggleLayer('rw10', c)} />
                                    <OverlayToggle label="Holding Area RW 28" checked={activeLayers.rw28} onChange={(c) => toggleLayer('rw28', c)} />
                                </div>
                            </div>
                        </div>


                    </div>
                </div>
                {/* -------------------------------------- */}

                <MapContainer
                    center={mapCenter}
                    zoom={10}
                    style={{ height: "100%", width: "100%" }}
                    className="z-0"
                >
                    <SetBounds devices={devices} />

                    {/* Dynamic Overlays */}
                    <GeoJsonLayer
                        url="https://stamet-juanda.bmkg.go.id/radar/transparent/jatimkab.json"
                        visible={activeLayers.kab}
                        color="#ffffff"
                    />
                    <GeoJsonLayer
                        url="https://stamet-juanda.bmkg.go.id/radar/asset/geojson/airport_indo.json"
                        visible={activeLayers.ap}
                        color="#fde047"
                    />
                    <GeoJsonLayer
                        url="https://stamet-juanda.bmkg.go.id/radar/asset/geojson/bahaya_longsor.json"
                        visible={activeLayers.longsor}
                        color="#ef4444"
                    />

                    {earthquakeMarker && (
                        <Marker
                            position={earthquakeMarker.position}
                            icon={L.divIcon({
                                className: 'gempa-icon',
                                html: `<div class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></div>
                                       <div class="relative inline-flex rounded-full h-8 w-8 bg-red-500 border-2 border-white flex items-center justify-center">
                                         <span class="text-[10px] text-white font-black">${earthquakeMarker.info.Magnitude}</span>
                                       </div>`,
                                iconSize: [32, 32]
                            })}
                        >
                            <Popup>
                                <div className="p-2">
                                    <h4 className="font-black italic text-red-600">GEMPA TERKINI</h4>
                                    <p className="text-xs"><strong>Wilayah:</strong> {earthquakeMarker.info.Wilayah}</p>
                                    <p className="text-xs"><strong>Magnitude:</strong> {earthquakeMarker.info.Magnitude}</p>
                                    <p className="text-xs"><strong>Kedalaman:</strong> {earthquakeMarker.info.Kedalaman}</p>
                                    <p className="text-xs"><strong>Waktu:</strong> {earthquakeMarker.info.Tanggal} {earthquakeMarker.info.Jam}</p>
                                </div>
                            </Popup>
                        </Marker>
                    )}

                    <LayersControl position="bottomleft">
                        <LayersControl.BaseLayer checked name="Street View">
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                        </LayersControl.BaseLayer>
                        <LayersControl.BaseLayer name="Satellite View">
                            <TileLayer
                                url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                                attribution='&copy; Google Maps'
                            />
                        </LayersControl.BaseLayer>
                        <LayersControl.BaseLayer name="Terrain View">
                            <TileLayer
                                url="https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}"
                                attribution='&copy; Google Maps'
                            />
                        </LayersControl.BaseLayer>
                    </LayersControl>

                    {devices?.filter(d => {
                        const isOffline = d.status === 'OFFLINE' || d.status === 'INACTIVE';
                        if (isOffline) return deviceFilter.OFFLINE;
                        return deviceFilter[d.device_type];
                    }).map((device) => (
                        <Marker
                            key={device.id}
                            position={[device.latitude, device.longitude]}
                            icon={getCustomIcon(device.device_type, device.status)}
                        >
                            <Popup className="custom-popup">
                                <div className="p-1 min-w-[220px]">
                                    <h3 className="font-black text-lg italic text-base-content leading-none mb-3 uppercase tracking-tighter">
                                        {device.name}
                                    </h3>

                                    <div className="w-full h-32 rounded-xl bg-base-200 mb-4 overflow-hidden border border-base-300 shadow-inner">
                                        {device.image ? (
                                            <img src={getImageUrl(device.image)} alt={device.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <img src={logoInsamo} alt="Insamo Logo" className="w-full h-full object-contain p-4 bg-white dark:bg-white" />
                                        )}
                                    </div>

                                    <div className="text-xs space-y-2 mb-5">
                                        <div className="flex items-start">
                                            <span className="font-bold opacity-60 w-16 shrink-0">Lokasi:</span>
                                            <span className="opacity-90 font-medium leading-tight">{device.address || '-'}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="font-bold opacity-60 w-16 shrink-0">Tipe:</span>
                                            <span className="badge badge-sm badge-neutral font-bold">{device.device_type || '-'}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="font-bold opacity-60 w-16 shrink-0">Status:</span>
                                            <span className={`font-black ${device.status === 'ACTIVE' ? 'text-success' : 'text-error'}`}>
                                                {device.status || 'LOST'}
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="font-bold opacity-60 w-16 shrink-0">Update:</span>
                                            <span className="opacity-90 font-mono text-[10px]">
                                                {device.updatedAt
                                                    ? new Date(device.updatedAt).toLocaleString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':')
                                                    : '2026-02-13 19:46:31'}
                                            </span>
                                        </div>
                                    </div>

                                    <Link
                                        to={`/device/${device.id}/data`}
                                        className="btn  text-white btn-sm w-full rounded-xl font-black italic shadow-lg shadow-primary/20 flex gap-2"
                                    >
                                        <span>🔍</span> Lihat Detail
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

function LegendItem({ color, label, icon }) {
    return (
        <div className="flex items-center gap-3">
            <div className={`w-7 h-7 rounded-full ${color} ring-2 ring-white shadow-sm flex items-center justify-center overflow-hidden p-1`}>
                {icon && <img src={icon} className="w-full h-full object-contain brightness-0 invert" alt={label} />}
            </div>
            <span className="text-xs font-black italic text-base-content/80 uppercase">{label}</span>
        </div>
    );
}

function LegendToggle({ color, label, icon, checked, onChange }) {
    return (
        <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.05] border border-white/10 transition-all hover:bg-white/[0.08]">
            <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full ${color} ring-2 ring-white/20 flex items-center justify-center overflow-hidden p-1`}>
                    {icon && <img src={icon} className="w-full h-full object-contain brightness-0 invert" alt={label} />}
                </div>
                <span className="text-[10px] font-black italic text-white/90 uppercase">{label}</span>
            </div>
            <label className="switch">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <span className="slider"></span>
            </label>
        </div>
    );
}

function OverlayToggle({ label, checked, onChange }) {
    return (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.05] border border-white/10 text-[11px] font-bold text-white transition-all hover:bg-white/[0.08]">
            <span className="uppercase tracking-tight opacity-90">{label}</span>
            <label className="switch">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <span className="slider"></span>
            </label>
        </div>
    );
}
