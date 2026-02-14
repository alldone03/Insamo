import { useState, useMemo } from "react";
import { Cpu, Plus, Trash2, Search, Edit2, MapPin, Hash, Activity, ArrowUpDown, X, Check, UserPlus, ShieldAlert, UserMinus, Eye } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth_context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function Device() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isSuperAdmin = user?.role_id === 1;

    // Toast State
    const [toast, setToast] = useState({ show: false, message: "", type: "success" });

    // Search and Sort State
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: 'device_code', direction: 'asc' });

    // Modal States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

    // Form and Selection States
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [targetUserId, setTargetUserId] = useState("");
    const [formData, setFormData] = useState({
        device_code: "",
        name: "",
        device_type: "SIGMA",
        latitude: "",
        longitude: "",
        address: ""
    });

    // Helper: Show Toast
    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
    };

    // API: Fetch Devices
    const { data: rawDevices = [], isLoading: isLoadingDevices } = useQuery({
        queryKey: ["devices"],
        queryFn: async () => {
            const res = await api.get("/devices");
            return res.data;
        }
    });

    // API: Fetch All Potential Users
    const { data: allUsers = [] } = useQuery({
        queryKey: ["users"],
        queryFn: async () => {
            if (!isSuperAdmin) return [];
            const res = await api.get("/users");
            return res.data;
        },
        enabled: isSuperAdmin
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (newDevice) => api.post("/devices", newDevice),
        onSuccess: () => {
            queryClient.invalidateQueries(["devices"]);
            setIsCreateModalOpen(false);
            resetForm();
            showToast("Device registered successfully!", "success");
        },
        onError: () => showToast("Failed to register device", "error")
    });

    const updateMutation = useMutation({
        mutationFn: (updatedDevice) => api.put(`/devices/${updatedDevice.id}`, updatedDevice),
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
            // Refresh local selected device users
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
            // Refresh local selected device users
            api.get("/devices").then(res => {
                const refreshed = res.data.find(d => d.id === selectedDevice.id);
                setSelectedDevice(refreshed);
            });
        }
    });

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedAndFiltered = useMemo(() => {
        let items = [...rawDevices].filter(d =>
            d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.device_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.device_type.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (sortConfig.key) {
            items.sort((a, b) => {
                const valA = a[sortConfig.key]?.toLowerCase?.() || a[sortConfig.key];
                const valB = b[sortConfig.key]?.toLowerCase?.() || b[sortConfig.key];
                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return items;
    }, [rawDevices, searchTerm, sortConfig]);

    const resetForm = () => {
        setFormData({ device_code: "", name: "", device_type: "SIGMA", latitude: "", longitude: "", address: "" });
        setSelectedDevice(null);
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'SIGMA': return 'badge-primary';
            case 'FLOWS': return 'badge-secondary';
            case 'LANDSLIDE': return 'badge-accent';
            default: return 'badge-ghost';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* DaisyUI Toast */}
            {toast.show && (
                <div className="toast toast-top toast-end z-[999]">
                    <div className={`alert ${toast.type === 'success' ? 'alert-success' : toast.type === 'error' ? 'alert-error' : toast.type === 'warning' ? 'alert-warning' : 'alert-info'} shadow-2xl rounded-2xl border-none`}>
                        <div className="flex items-center gap-2 text-white font-bold italic uppercase tracking-widest text-xs">
                            {toast.type === 'success' && <Check size={16} />}
                            <span>{toast.message}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black flex items-center gap-3 italic">
                        <Cpu className="text-primary" size={32} />
                        DEVICE MANAGEMENT
                    </h2>
                    <p className="opacity-60 font-medium">Configure hardware access and system visibility</p>
                </div>
                {isSuperAdmin && (
                    <button className="btn btn-primary shadow-lg shadow-primary/30" onClick={() => { resetForm(); setIsCreateModalOpen(true); }}>
                        <Plus size={20} /> REGISTER DEVICE
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="card bg-base-100 shadow-2xl border border-base-200">
                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-base-200">
                    <h3 className="text-xl font-black italic">DEVICE LIST & ACCESS</h3>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={18} />
                        <input type="text" placeholder="Search..." className="input input-bordered w-full pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="table w-full">
                        <thead className="bg-base-200/50 font-black uppercase text-xs">
                            <tr>
                                <th onClick={() => handleSort('device_code')} className="cursor-pointer">Code <ArrowUpDown size={12} /></th>
                                <th onClick={() => handleSort('name')} className="cursor-pointer">Asset Name <ArrowUpDown size={12} /></th>
                                <th>Type</th>
                                {isSuperAdmin && <th>Access (Assigned Users)</th>}
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoadingDevices ? <tr><td colSpan="5" className="text-center p-8"><span className="loading loading-spinner"></span></td></tr> : sortedAndFiltered.map((device) => (
                                <tr key={device.id} className="hover:bg-primary/5">
                                    <td className="font-mono font-black text-primary">{device.device_code}</td>
                                    <td>
                                        <div className="font-bold">{device.name}</div>
                                        <div className="text-[10px] opacity-40">{device.address}</div>
                                    </td>
                                    <td><span className={`badge ${getTypeColor(device.device_type)} badge-sm font-black`}>{device.device_type}</span></td>
                                    {isSuperAdmin && (
                                        <td>
                                            <div className="flex flex-wrap gap-1 items-center">
                                                {device.users?.length > 0 ? device.users.map(u => (
                                                    <div key={u.id} className="badge badge-info gap-1 badge-outline px-2 h-6 text-[10px] font-bold">
                                                        {u.name}
                                                    </div>
                                                )) : <span className="text-[10px] opacity-30 italic">Public / Unassigned</span>}
                                                <button onClick={() => { setSelectedDevice(device); setIsAssignModalOpen(true); }} className="btn btn-xs btn-circle btn-primary btn-outline">
                                                    <UserPlus size={10} />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                    <td className="text-right space-x-2">
                                        <button
                                            className="btn btn-primary btn-sm px-4 italic font-black"
                                            onClick={() => navigate(`/device/${device.id}/data`)}
                                        >
                                            <Eye size={14} className="mr-1" /> Detail
                                        </button>
                                        <button className="btn btn-ghost btn-sm btn-square" onClick={() => { setSelectedDevice(device); setFormData(device); setIsEditModalOpen(true); }}>
                                            <Edit2 size={16} />
                                        </button>
                                        {isSuperAdmin && (
                                            <button className="btn btn-ghost btn-sm btn-square text-error" onClick={() => { if (window.confirm("Delete asset?")) deleteMutation.mutate(device.id) }}>
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal: Create/Edit */}
            {(isCreateModalOpen || isEditModalOpen) && (
                <div className="modal modal-open">
                    <div className="modal-box rounded-3xl p-8 border border-base-300">
                        <button className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4" onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}><X /></button>
                        <h3 className="font-black text-2xl italic mb-6 uppercase tracking-tighter">
                            {isEditModalOpen ? "Update Asset Configuration" : "New Asset Registration"}
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-control col-span-1"><label className="label text-xs font-black opacity-50">CODE</label><input className="input input-bordered font-bold" value={formData.device_code} onChange={e => setFormData({ ...formData, device_code: e.target.value })} /></div>
                            <div className="form-control col-span-1"><label className="label text-xs font-black opacity-50">NAME</label><input className="input input-bordered font-bold" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                            <div className="form-control col-span-2"><label className="label text-xs font-black opacity-50">LOCATION ADDRESS</label><textarea className="textarea textarea-bordered font-medium" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} /></div>
                        </div>
                        <div className="modal-action">
                            <button className="btn btn-primary px-12 italic font-black shadow-lg shadow-primary/20" onClick={() => isEditModalOpen ? updateMutation.mutate(formData) : createMutation.mutate(formData)}>
                                <Check size={18} /> {isEditModalOpen ? "Update" : "Register"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Advanced User Access Assignment */}
            {isAssignModalOpen && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-lg p-8 rounded-3xl border-2 border-primary/20 bg-base-100 shadow-2xl">
                        <button className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4" onClick={() => setIsAssignModalOpen(false)}><X /></button>
                        <div className="flex items-center gap-3 mb-6">
                            <ShieldAlert className="text-primary" size={28} />
                            <h3 className="font-black text-2xl italic uppercase tracking-tighter">ACCESS CONTROL</h3>
                        </div>

                        <div className="bg-base-200 p-4 rounded-2xl mb-6">
                            <p className="text-xs font-black opacity-50 uppercase mb-2">Selected Device</p>
                            <div className="flex justify-between items-center">
                                <span className="font-mono font-black text-primary">{selectedDevice?.device_code}</span>
                                <span className="text-sm font-bold">{selectedDevice?.name}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="label font-black text-[10px] uppercase opacity-50">Grant New Access</label>
                                <div className="flex gap-2">
                                    <select className="select select-bordered grow font-bold" value={targetUserId} onChange={e => setTargetUserId(e.target.value)}>
                                        <option value="">Choose User...</option>
                                        {allUsers.filter(u => !selectedDevice?.users?.some(du => du.id === u.id)).map(u => (
                                            <option key={u.id} value={u.id}>{u.name} ({u.role?.name})</option>
                                        ))}
                                    </select>
                                    <button className="btn btn-primary" onClick={() => attachMutation.mutate({ deviceId: selectedDevice.id, userId: targetUserId })} disabled={!targetUserId || attachMutation.isPending}>
                                        ADD
                                    </button>
                                </div>
                            </div>

                            <div className="divider">Active Permissions</div>

                            <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                                {selectedDevice?.users?.length > 0 ? selectedDevice.users.map(u => (
                                    <div key={u.id} className="flex items-center justify-between p-3 bg-base-200 rounded-xl">
                                        <div>
                                            <p className="text-sm font-black">{u.name}</p>
                                            <p className="text-[10px] opacity-50 uppercase font-bold">{u.role?.name}</p>
                                        </div>
                                        <button className="btn btn-ghost btn-xs text-error" onClick={() => detachMutation.mutate({ deviceId: selectedDevice.id, userId: u.id })}>
                                            <UserMinus size={14} />
                                        </button>
                                    </div>
                                )) : <p className="text-center text-xs opacity-30 italic py-4">No specific users assigned.</p>}
                            </div>
                        </div>

                        <div className="modal-action mt-8">
                            <button className="btn btn-ghost w-full font-bold" onClick={() => setIsAssignModalOpen(false)}>CLOSE</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
