import React from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const customIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

const MiniMap = ({ lat, lng, zoom = 13 }) => {
    if (!lat || !lng) return (
        <div className="w-full h-32 bg-base-200 rounded-xl flex items-center justify-center border border-dashed border-base-300">
            <p className="text-[10px] font-bold opacity-40 uppercase italic">Coordinate Required</p>
        </div>
    );

    const position = [parseFloat(lat), parseFloat(lng)];

    return (
        <div className="w-full h-32 rounded-xl overflow-hidden border-2 border-base-300 relative group shadow-inner">
            <MapContainer
                center={position}
                zoom={zoom}
                style={{ height: "100%", width: "100%" }}
                zoomControl={false}
                scrollWheelZoom={false}
                dragging={false}
            >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={position} icon={customIcon} />
            </MapContainer>
            <div className="absolute inset-0 z-[49] bg-transparent cursor-default"></div>
        </div>
    );
};

export default MiniMap;
