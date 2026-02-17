import { useState, useMemo } from "react";
import {
    Cpu, Plus, Trash2, Search, Edit2, MapPin,
    Activity, X, Check, UserPlus,
    ShieldAlert, UserMinus, Eye, Waves, Mountain, Flame,
    AlertTriangle, ImageIcon
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api, getImageUrl } from "../lib/api";
import { useAuth } from "../lib/auth_context";
import InsamoLogo from "../assets/InsamoLogo.webp";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const DEVICE_CATEGORIES = {
    FLOWS: {
        label: "Flood Detection",
        icon: Waves,
        color: "text-blue-500",
        bg: "bg-blue-500/5",
        border: "border-blue-500/20",
        badge: "badge-info",
        defaultImage: InsamoLogo
    },
    LANDSLIDE: {
        label: "Landslide Monitor",
        icon: Mountain,
        color: "text-amber-600",
        bg: "bg-amber-600/5",
        border: "border-amber-600/20",
        badge: "badge-warning",
        defaultImage: InsamoLogo
    },
    SIGMA: {
        label: "Sigma System",
        icon: Activity,
        color: "text-purple-500",
        bg: "bg-purple-500/5",
        border: "border-purple-500/20",
        badge: "badge-primary",
        defaultImage: InsamoLogo
    },
    WILDFIRE: {
        label: "Wildfire Alert",
        icon: Flame,
        color: "text-red-500",
        bg: "bg-red-500/5",
        border: "border-red-500/20",
        badge: "badge-error",
        defaultImage: InsamoLogo
    }
};

export default function Device() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isSuperAdmin = user?.role_id === 1;

    // Toast State
    const [toast, setToast] = useState({ show: false, message: "", type: "success" });
    const [searchTerm, setSearchTerm] = useState("");

    // Modal States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

    // Form and Selection States
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [targetUserId, setTargetUserId] = useState("");
    const [formData, setFormData] = useState({
        device_code: "",
        name: "",
        device_type: "SIGMA",
        latitude: "",
        longitude: "",
        address: "",
        image: "", // New Field for Image URL
        initial_distance: 10,
        alert_threshold: 50,
        danger_threshold: 80
    });

    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
    };

    const { data: rawDevices = [], isLoading: isLoadingDevices } = useQuery({
        queryKey: ["devices"],
        queryFn: async () => (await api.get("/devices")).data
    });

    const { data: allUsers = [] } = useQuery({
        queryKey: ["users"],
        queryFn: async () => isSuperAdmin ? (await api.get("/users")).data : [],
        enabled: isSuperAdmin
    });

    const createMutation = useMutation({
        mutationFn: (newDevice) => {
            const data = new FormData();
            Object.keys(newDevice).forEach(key => {
                if (newDevice[key] !== null && newDevice[key] !== undefined) {
                    data.append(key, newDevice[key]);
                }
            });
            return api.post("/devices", data, {
                headers: { "Content-Type": "multipart/form-data" }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["devices"]);
            setIsCreateModalOpen(false);
            resetForm();
            showToast("Device registered successfully!", "success");
        },
        onError: () => showToast("Failed to register device", "error")
    });

    const updateMutation = useMutation({
        mutationFn: (updatedDevice) => {
            const data = new FormData();
            Object.keys(updatedDevice).forEach(key => {
                if (updatedDevice[key] !== null && updatedDevice[key] !== undefined) {
                    data.append(key, updatedDevice[key]);
                }
            });
            // Laravel workaround for PUT + Multipart
            data.append("_method", "PUT");
            return api.post(`/devices/${updatedDevice.id}`, data, {
                headers: { "Content-Type": "multipart/form-data" }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["devices"]);
            setIsEditModalOpen(false);
            resetForm();
            showToast("Device updated successfully!", "success");
        },
        onError: () => showToast("Failed to update device", "error")
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/devices/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(["devices"]);
            showToast("Device deleted correctly", "info");
        }
    });

    const attachMutation = useMutation({
        mutationFn: ({ deviceId, userId }) => api.post(`/users/${userId}/devices`, { device_id: deviceId }),
        onSuccess: () => {
            queryClient.invalidateQueries(["devices"]);
            setTargetUserId("");
            showToast("Access granted successfully!", "success");
            api.get("/devices").then(res => {
                const refreshed = res.data.find(d => d.id === selectedDevice.id);
                setSelectedDevice(refreshed);
            });
        }
    });

    const detachMutation = useMutation({
        mutationFn: ({ deviceId, userId }) => api.delete(`/users/${userId}/devices/${deviceId}`),
        onSuccess: () => {
            queryClient.invalidateQueries(["devices"]);
            showToast("Access revoked!", "warning");
            api.get("/devices").then(res => {
                const refreshed = res.data.find(d => d.id === selectedDevice.id);
                setSelectedDevice(refreshed);
            });
        }
    });

    const resetForm = () => {
        setFormData({
            device_code: "",
            name: "",
            device_type: "SIGMA",
            latitude: "",
            longitude: "",
            address: "",
            image: "",
            initial_distance: 10,
            alert_threshold: 50,
            danger_threshold: 80
        });
        setSelectedDevice(null);
        setPreviewImage(null);
    };

    function LocationPicker({ onLocationSelect }) {
        useMapEvents({ click(e) { onLocationSelect(e.latlng); } });
        return null;
    }

    const customIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
    });

    const getDeviceStatus = (device) => {
        if (!device.sensor_readings || device.sensor_readings.length === 0) {
            return { status: 'offline', label: 'OFFLINE', color: 'text-error' };
        }
        const latestReading = device.sensor_readings[0];
        const recordedAt = new Date(latestReading.recorded_at);
        const diffMinutes = (new Date() - recordedAt) / 1000 / 60;
        return diffMinutes < 1
            ? { status: 'online', label: 'ONLINE', color: 'text-success' }
            : { status: 'offline', label: 'OFFLINE', color: 'text-error' };
    };

    const groupedDevices = useMemo(() => {
        const groups = { FLOWS: [], LANDSLIDE: [], SIGMA: [], WILDFIRE: [] };
        rawDevices.forEach(device => {
            let type = device.device_type;
            if (groups[type] && (
                device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                device.device_code.toLowerCase().includes(searchTerm.toLowerCase())
            )) {
                groups[type].push(device);
            }
        });
        return groups;
    }, [rawDevices, searchTerm]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {toast.show && (
                <div className="toast toast-top toast-end z-[999]">
                    <div className={`alert ${toast.type === 'success' ? 'alert-success' : 'alert-error'} shadow-2xl rounded-2xl`}>
                        <div className="flex items-center gap-2 text-white font-bold text-xs uppercase">
                            {toast.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
                            <span>{toast.message}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black flex items-center gap-3 italic">
                        <Cpu className="text-primary" size={32} />
                        MONITORING DASHBOARD
                    </h2>
                    <p className="opacity-60 font-medium">Real-time Environmental Monitoring Systems</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={18} />
                        <input
                            type="text"
                            placeholder="Find asset..."
                            className="input input-bordered pl-10 w-full md:w-64 font-bold"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {isSuperAdmin && (
                        <button className="btn btn-primary shadow-lg shadow-primary/30" onClick={() => { resetForm(); setIsCreateModalOpen(true); }}>
                            <Plus size={20} /> NEW DEVICE
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {Object.keys(DEVICE_CATEGORIES).map((key) => {
                    const category = DEVICE_CATEGORIES[key];
                    const devices = groupedDevices[key] || [];
                    const Icon = category.icon;

                    return (
                        <div key={key} className={`card bg-base-100 shadow-xl overflow-hidden border-t-4 ${category.border.replace('border-', 'border-t-')}`}>
                            <div className="p-4 bg-base-100 border-b border-base-200 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${category.bg} ${category.color}`}>
                                        <Icon size={20} />
                                    </div>
                                    <h3 className="font-black italic text-lg">{category.label}</h3>
                                </div>
                                <span className={`badge ${category.badge} font-bold`}>{devices.length} Items</span>
                            </div>

                            <div className="p-4 space-y-3 min-h-[200px] bg-base-200/30">
                                {isLoadingDevices ? (
                                    <div className="flex justify-center items-center h-32"><span className="loading loading-spinner"></span></div>
                                ) : devices.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-base-300 rounded-xl opacity-40">
                                        <Icon size={32} className="mb-2" />
                                        <span className="text-xs font-bold uppercase">No Devices</span>
                                    </div>
                                ) : (
                                    devices.map(device => {
                                        const status = getDeviceStatus(device);
                                        // Gunakan gambar spesifik device jika ada, jika tidak gunakan default kategori
                                        const deviceImage = getImageUrl(device.image) || category.defaultImage;

                                        return (
                                            <div key={device.id} className="card card-side bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-all p-2 gap-3 items-center group">
                                                {/* DEVICE IMAGE (THUMBNAIL) */}
                                                <figure className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-base-300 relative">
                                                    <img
                                                        src={deviceImage}
                                                        alt={device.name}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                        onError={(e) => {
                                                            e.target.src = InsamoLogo;
                                                            e.target.onerror = null;
                                                        }} // Safe fallback
                                                    />
                                                    <div className={`absolute bottom-0 w-full text-[8px] font-black text-center text-white py-1 ${status.status === 'online' ? 'bg-success/80' : 'bg-error/80'}`}>
                                                        {status.label}
                                                    </div>
                                                </figure>

                                                {/* DEVICE INFO */}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-sm truncate">{device.name}</h4>
                                                    <p className="text-[10px] font-mono opacity-50 mb-1">{device.device_code}</p>
                                                    <p className="text-[10px] opacity-60 line-clamp-2 leading-tight">
                                                        {device.address || "No location address set."}
                                                    </p>
                                                </div>

                                                {/* ACTIONS */}
                                                <div className="flex flex-col gap-1 pr-2">
                                                    <button
                                                        onClick={() => navigate(`/device/${device.id}/data`)}
                                                        className="btn btn-xs btn-primary btn-outline"
                                                    >
                                                        <Eye size={12} />
                                                    </button>
                                                    {isSuperAdmin && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedDevice(device);
                                                                setFormData({
                                                                    ...device,
                                                                    image: null, // Don't pre-fill with path string for file input
                                                                    initial_distance: device.settings?.initial_distance || 10,
                                                                    alert_threshold: device.settings?.alert_threshold || 50,
                                                                    danger_threshold: device.settings?.danger_threshold || 80
                                                                });
                                                                setPreviewImage(getImageUrl(device.image));
                                                                setIsEditModalOpen(true);
                                                            }}
                                                            className="btn btn-xs btn-ghost"
                                                        >
                                                            <Edit2 size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal: Create/Edit */}
            {
                (isCreateModalOpen || isEditModalOpen) && (
                    <div className="modal modal-open z-[1000]">
                        <div className="modal-box max-w-2xl rounded-3xl p-0 border border-base-300 overflow-hidden">
                            <div className="p-6 border-b border-base-200 bg-base-200/30 flex justify-between items-center">
                                <h3 className="font-black text-xl italic uppercase tracking-tight">
                                    {isEditModalOpen ? "Configure Asset" : "Register New Asset"}
                                </h3>
                                <button className="btn btn-sm btn-circle btn-ghost" onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}><X size={18} /></button>
                            </div>

                            <div className="p-8 grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
                                {/* Device Type Selection */}
                                <div className="col-span-2 form-control">
                                    <label className="label text-xs font-black opacity-50">SYSTEM TYPE</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {Object.keys(DEVICE_CATEGORIES).map(type => {
                                            const Cat = DEVICE_CATEGORIES[type];
                                            const isSelected = formData.device_type === type;
                                            return (
                                                <div
                                                    key={type}
                                                    onClick={() => (!isEditModalOpen || isSuperAdmin) && setFormData({ ...formData, device_type: type })}
                                                    className={`
                                                    cursor-pointer rounded-xl border-2 p-3 flex flex-col items-center gap-2 transition-all
                                                    ${isSelected ? `border-${Cat.color.split('-')[1]}-500 bg-base-200` : 'border-base-200 hover:border-base-300'}
                                                    ${(isEditModalOpen && !isSuperAdmin) ? 'opacity-50 cursor-not-allowed' : ''}
                                                `}
                                                >
                                                    <Cat.icon className={isSelected ? Cat.color : 'opacity-30'} size={24} />
                                                    <span className={`text-[10px] font-black ${isSelected ? '' : 'opacity-40'}`}>{type}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="form-control col-span-1">
                                    <label className="label text-xs font-black opacity-50">DEVICE CODE</label>
                                    <input
                                        className="input input-bordered font-bold"
                                        value={formData.device_code}
                                        onChange={e => setFormData({ ...formData, device_code: e.target.value })}
                                        disabled={isEditModalOpen && !isSuperAdmin}
                                        placeholder="e.g. SIG-001"
                                    />
                                </div>
                                <div className="form-control col-span-1">
                                    <label className="label text-xs font-black opacity-50">ASSET NAME</label>
                                    <input
                                        className="input input-bordered font-bold"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Sector 7 Unit"
                                    />
                                </div>

                                {/* Image Upload Input */}
                                <div className="form-control col-span-2">
                                    <label className="label text-xs font-black opacity-50 flex items-center gap-2">
                                        <ImageIcon size={12} /> DEVICE IMAGE
                                    </label>
                                    <div className="flex items-center gap-4">
                                        {previewImage && (
                                            <div className="w-20 h-20 rounded-xl overflow-hidden bg-base-300 border border-base-200">
                                                <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                className="file-input file-input-bordered file-input-sm w-full font-bold"
                                                accept="image/*"
                                                onChange={e => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        setFormData({ ...formData, image: file });
                                                        setPreviewImage(URL.createObjectURL(file));
                                                    }
                                                }}
                                            />
                                            <label className="label">
                                                <span className="label-text-alt opacity-50">Upload a photo for this device. Leave empty to use category default.</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-span-2 mt-2">
                                    <div className="h-48 rounded-xl overflow-hidden border-2 border-base-300 relative group">
                                        <div className="absolute top-2 left-2 z-[500] bg-base-100/90 px-2 py-1 rounded text-[10px] font-bold shadow backdrop-blur">
                                            Lat: {formData.latitude || "?"}, Lng: {formData.longitude || "?"}
                                        </div>
                                        <MapContainer
                                            center={[formData.latitude || -6.2088, formData.longitude || 106.8456]}
                                            zoom={13}
                                            style={{ height: "100%", width: "100%" }}
                                        >
                                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                            <LocationPicker onLocationSelect={(latlng) => setFormData({ ...formData, latitude: latlng.lat.toFixed(6), longitude: latlng.lng.toFixed(6) })} />
                                            {formData.latitude && <Marker position={[formData.latitude, formData.longitude]} icon={customIcon} />}
                                        </MapContainer>
                                    </div>
                                </div>

                                <div className="form-control col-span-2">
                                    <label className="label text-xs font-black opacity-50">FULL ADDRESS</label>
                                    <input
                                        className="input input-bordered text-sm"
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Street, City, Province..."
                                    />
                                </div>

                                <div className="col-span-2 divider text-xs font-black opacity-30 mt-4">CALIBRATION</div>
                                <div className="form-control col-span-2 md:col-span-1">
                                    <label className="label text-xs font-black opacity-50">INITIAL DISTANCE (CM)</label>
                                    <input type="number" className="input input-bordered font-mono font-bold" value={formData.initial_distance} onChange={e => setFormData({ ...formData, initial_distance: e.target.value })} />
                                </div>
                                <div className="form-control col-span-1 md:col-span-1">
                                    <div className="flex gap-2">
                                        <div>
                                            <label className="label text-xs font-black opacity-50 text-warning">ALERT</label>
                                            <input type="number" className="input input-bordered w-full font-mono font-bold text-warning" value={formData.alert_threshold} onChange={e => setFormData({ ...formData, alert_threshold: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="label text-xs font-black opacity-50 text-error">DANGER</label>
                                            <input type="number" className="input input-bordered w-full font-mono font-bold text-error" value={formData.danger_threshold} onChange={e => setFormData({ ...formData, danger_threshold: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-base-200/50 flex justify-end gap-2">
                                <button className="btn btn-ghost font-bold" onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}>Cancel</button>
                                <button className="btn btn-primary px-8 font-black italic shadow-lg shadow-primary/20" onClick={() => isEditModalOpen ? updateMutation.mutate(formData) : createMutation.mutate(formData)}>
                                    <Check size={18} /> SAVE ASSET
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}