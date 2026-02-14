import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import L from "leaflet";

// Fix leaflet icon issue
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

export default function Home() {
    const { data: devices, isLoading } = useQuery({
        queryKey: ["devices"],
        queryFn: async () => {
            const res = await api.get("/devices");
            return res.data;
        }
    });

    if (isLoading) return <div className="flex justify-center p-10"><span className="loading loading-spinner"></span></div>;

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-3xl font-bold text-base-content">Home</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="stats shadow bg-base-100">
                    <div className="stat">
                        <div className="stat-title">Total Devices</div>
                        <div className="stat-value text-primary">{devices?.length || 0}</div>
                        <div className="stat-desc">Connected to system</div>
                    </div>
                </div>
            </div>

            <div className="card bg-base-100 shadow-xl overflow-hidden h-[600px]">
                <MapContainer
                    center={[-6.2088, 106.8456]}
                    zoom={10}
                    style={{ height: "100%", width: "100%" }}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    {devices?.map((device) => (
                        <Marker key={device.id} position={[device.latitude, device.longitude]}>
                            <Popup>
                                <div className="p-2">
                                    <h3 className="font-bold text-lg">{device.name}</h3>
                                    <p className="text-sm opacity-70">{device.deviceType}</p>
                                    <p className="text-xs mt-2">{device.address}</p>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
}
