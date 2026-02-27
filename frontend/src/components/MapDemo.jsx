import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  LayersControl,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Link } from "react-router-dom";
import { Eye, Info, Layers, Map as MapIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useEffect, useMemo, useState } from "react";

import banjier from "../assets/banjier.webp";
import longsyor from "../assets/longsyor.webp";
import apiapi from "../assets/apiapi.webp";
import gempajir from "../assets/gempajir.webp";
import logoInsamo from "../assets/logoInsamo.webp";

// Dummy data for the landing page map (fallback if backend is empty)
const DUMMY_DEVICES = [];

const { BaseLayer } = LayersControl;

function SetBounds({ devices }) {
  const map = useMap();
  useEffect(() => {
    if (devices && devices.length > 0) {
      const bounds = L.latLngBounds(
        devices.map((d) => [d.latitude, d.longitude]),
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    }
  }, [devices, map]);
  return null;
}

const getCustomIcon = (type, status) => {
  let color = "#3b82f6"; // Default Blue (SIGMA)
  let iconUrl = logoInsamo;

  if (type === "FLOWS") {
    color = "#06b6d4";
    iconUrl = banjier;
  } else if (type === "LANDSLIDE") {
    color = "#f97316";
    iconUrl = longsyor;
  } else if (type === "WILDFIRE") {
    color = "#ef4444";
    iconUrl = apiapi;
  } else if (type === "SIGMA") {
    color = "#3b82f6";
    iconUrl = gempajir;
  }

  // Change to black if offline or inactive
  if (status === "OFFLINE" || status === "INACTIVE") {
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
    popupAnchor: [0, -32],
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
    const totalLat = devices.reduce(
      (sum, d) => sum + parseFloat(d.latitude),
      0,
    );
    const totalLon = devices.reduce(
      (sum, d) => sum + parseFloat(d.longitude),
      0,
    );
    return [totalLat / devices.length, totalLon / devices.length];
  }, [devices]);

  return (
    <div className="relative card bg-base-100 shadow-2xl overflow-hidden h-[600px] border border-base-200 group">
      
      {/* --- BAGIAN DROPDOWN LEGEND DAISYUI --- */}
      <div className="dropdown dropdown-end absolute top-4 right-4 z-[1000]">
        <div 
          tabIndex={0} 
          role="button" 
          className="btn btn-sm bg-base-100/90 backdrop-blur-md shadow-xl border-base-200 gap-2 font-black italic text-xs"
        >
          <Layers size={14} /> MAP LEGEND
        </div>
        
        <div 
          tabIndex={0} 
          className="dropdown-content z-[1] menu mt-2 bg-base-100/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-base-200 w-52"
        >
          <div className="space-y-3">
            <LegendItem color="bg-blue-500" label="SIGMA" icon={gempajir} />
            <LegendItem color="bg-cyan-500" label="FLOWS" icon={banjier} />
            <LegendItem color="bg-orange-500" label="LANDSLIDE" icon={longsyor} />
            <LegendItem color="bg-red-500" label="WILDFIRE" icon={apiapi} />
            <div className="divider my-1 opacity-10"></div>
            <LegendItem color="bg-black" label="OFFLINE / NO SIGNAL" icon={logoInsamo} />
          </div>
          
          <p className="text-[10px] opacity-50 mt-4 italic font-medium leading-tight text-center">
            Click on markers to see live details and analysis.
          </p>
        </div>
      </div>
      {/* -------------------------------------- */}

      <MapContainer
        center={mapCenter}
        zoom={6}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
        scrollWheelZoom={false}
      >
        <SetBounds devices={devices} />

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
              attribution="&copy; Google Maps"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Terrain View">
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}"
              attribution="&copy; Google Maps"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {devices.map((device) => (
          <Marker
            key={device.id}
            position={[device.latitude, device.longitude]}
            icon={getCustomIcon(device.device_type, device.status)}
          >
            <Popup className="custom-popup">
              <div className="p-1 min-w-[200px]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex flex-col gap-1">
                    <span
                      className={`badge badge-sm font-black italic ${
                        device.device_type === "SIGMA"
                          ? "badge-primary"
                          : device.device_type === "FLOWS"
                            ? "badge-secondary"
                            : "badge-accent"
                      }`}
                    >
                      {device.device_type}
                    </span>
                    <span
                      className={`text-[10px] font-black italic px-2 py-0.5 rounded-full ${
                        device.status === "ACTIVE"
                          ? "bg-success/20 text-success"
                          : "bg-error/20 text-error"
                      }`}
                    >
                      {device.status}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono opacity-40 font-bold">
                    {device.device_code}
                  </span>
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

function LegendItem({ color, label, icon }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-7 h-7 rounded-full ${color} ring-2 ring-white shadow-sm flex items-center justify-center overflow-hidden p-1`}
      >
        {icon && (
          <img
            src={icon}
            className="w-full h-full object-contain brightness-0 invert"
            alt={label}
          />
        )}
      </div>
      <span className="text-xs font-black italic text-base-content/80 uppercase">
        {label}
      </span>
    </div>
  );
}