import React, { useState, useEffect } from 'react';
import {
    Settings, Save, Bell, Bot, MessageSquare, Check,
    AlertTriangle, Users, History, Trash2, Edit2, X, Plus, UserPlus
} from 'lucide-react';
import { api } from '../lib/api';
import { io } from 'socket.io-client';

const SystemSettings = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [settings, setSettings] = useState([]);
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: "", type: "success" });

    // User Edit Modal State
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userFormData, setUserFormData] = useState({
        name: "", email: "", password: "", roleId: 2, telegram_chat_id: ""
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [settingsRes, usersRes, logsRes] = await Promise.all([
                api.get('/system-settings'),
                api.get('/users'),
                api.get('/telegram-logs')
            ]);
            setSettings(settingsRes.data);
            setUsers(usersRes.data);
            setLogs(logsRes.data.data || logsRes.data); // Handle pagination object
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const backendUrl = import.meta.env.VITE_API_URL
            ? new URL(import.meta.env.VITE_API_URL).origin
            : "http://localhost:3000";
        const socket = io(backendUrl, { path: '/socket.io/', transports: ['websocket', 'polling'] });

        socket.on('telegram-log', (newLog) => {
            setLogs(prevLogs => {
                // Check if already exists (avoid duplicates if any race condition occurs)
                if (prevLogs.find(l => l.id === newLog.id)) return prevLogs;
                return [newLog, ...prevLogs.slice(0, 49)];
            });
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
    };

    const handleUpdateSetting = async (key, value) => {
        try {
            await api.post(`/system-settings/${key}`, { value });
            showToast("Setting updated!", "success");
            const res = await api.get('/system-settings');
            setSettings(res.data);
        } catch (error) {
            showToast("Update failed", "error");
        }
    };

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await api.put(`/users/${editingUser.id}`, userFormData);
                showToast("User updated successfully");
            } else {
                await api.post('/users', userFormData);
                showToast("User created successfully");
            }
            setIsUserModalOpen(false);
            fetchData();
        } catch (error) {
            showToast("Operation failed", "error");
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            await api.delete(`/users/${id}`);
            showToast("User deleted", "info");
            fetchData();
        } catch (error) {
            showToast("Failed to delete user", "error");
        }
    };

    const handleSetWebhook = async () => {
        const url = window.prompt("Enter your application's base URL (e.g. https://yourdomain.com):");
        if (!url) return;

        try {
            const webhookUrl = `${url.replace(/\/$/, '')}/api/telegram/webhook`;
            await api.post('/telegram-logs/set-webhook', { url: webhookUrl });
            showToast("Webhook URL set successfully!");
        } catch (error) {
            showToast("Failed to set webhook: " + (error.response?.data?.message || error.message), "error");
        }
    };

    const handleSetBotMenu = async () => {
        try {
            await api.post('/telegram-logs/set-commands');
            showToast("Bot Menu Commands set successfully!");
        } catch (error) {
            showToast("Failed to set commands: " + (error.response?.data?.message || error.message), "error");
        }
    };

    const handleSendTestMessage = async (userId) => {
        try {
            await api.post('/telegram-logs/send-test', { userId });
            showToast("Test message sent!");
        } catch (error) {
            showToast("Failed to send test: " + (error.response?.data?.message || error.message), "error");
        }
    };

    const getVal = (key) => settings.find(s => s.key === key)?.value || "";

    if (isLoading && settings.length === 0) return <div className="flex justify-center items-center h-64"><span className="loading loading-spinner text-primary" /></div>;

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
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
                    <h2 className="text-3xl font-black flex items-center gap-3 italic tracking-tight uppercase">
                        <Settings className="text-primary" size={32} />
                        Control Center
                    </h2>
                    <p className="opacity-60 font-medium">Global system configuration and user management.</p>
                </div>

                <div className="tabs tabs-boxed bg-base-300/50 p-1 rounded-2xl">
                    <button
                        className={`tab tab-lg rounded-xl font-bold transition-all ${activeTab === 'general' ? 'tab-active bg-primary text-white shadow-lg' : ''}`}
                        onClick={() => setActiveTab('general')}
                    >
                        <Settings size={18} className="mr-2" /> Settings
                    </button>
                    <button
                        className={`tab tab-lg rounded-xl font-bold transition-all ${activeTab === 'users' ? 'tab-active bg-primary text-white shadow-lg' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        <Users size={18} className="mr-2" /> Users
                    </button>
                    <button
                        className={`tab tab-lg rounded-xl font-bold transition-all ${activeTab === 'logs' ? 'tab-active bg-primary text-white shadow-lg' : ''}`}
                        onClick={() => setActiveTab('logs')}
                    >
                        <History size={18} className="mr-2" /> Logs
                    </button>
                </div>
            </div>

            {/* General Settings Tab */}
            {activeTab === 'general' && (
                <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className="card bg-base-100 shadow-xl border border-base-200">
                        <div className="card-body">
                            <div className="flex items-center gap-2 text-primary mb-4">
                                <Bot size={20} />
                                <h3 className="font-bold text-lg italic uppercase tracking-wider">Telegram Integration</h3>
                            </div>
                            <div className="form-control w-full">
                                <label className="label"><span className="label-text font-black text-xs opacity-50 uppercase">Bot API Token</span></label>
                                <div className="flex gap-2">
                                    <input
                                        type="password"
                                        className="input input-bordered flex-1 font-mono text-sm"
                                        defaultValue={getVal('telegram_bot_token')}
                                        onBlur={(e) => handleUpdateSetting('telegram_bot_token', e.target.value)}
                                        placeholder="paste your bot token here..."
                                    />
                                    <button
                                        onClick={handleSetWebhook}
                                        className="btn btn-primary rounded-xl flex items-center gap-2"
                                        title="Configure Telegram Webhook"
                                    >
                                        <Check size={16} /> SET WEBHOOK
                                    </button>
                                    <button
                                        onClick={handleSetBotMenu}
                                        className="btn btn-secondary rounded-xl flex items-center gap-2"
                                        title="Set Bot Menu Commands"
                                    >
                                        <Bot size={16} /> SET BOT MENU
                                    </button>
                                </div>
                                <p className="text-[10px] mt-2 opacity-50 font-bold uppercase italic">Important: Telegram requires an HTTPS webhook URL to receive messages.</p>
                            </div>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-xl border border-base-200">
                        <div className="card-body">
                            <div className="flex items-center gap-2 text-primary mb-4">
                                <MessageSquare size={20} />
                                <h3 className="font-bold text-lg italic uppercase tracking-wider">Alert Message Template</h3>
                            </div>
                            <div className="form-control w-full">
                                <label className="label flex justify-between">
                                    <span className="label-text font-black text-xs opacity-50 uppercase">Flood Alert (Markdown)</span>
                                    <span className="label-text-alt font-mono text-[10px] bg-base-200 px-2 rounded">Variables: {'{device_name}'}, {'{status}'}, {'{water_level}'}</span>
                                </label>
                                <textarea
                                    className="textarea textarea-bordered h-48 font-mono text-sm leading-relaxed"
                                    defaultValue={getVal('flood_alert_template')}
                                    onBlur={(e) => handleUpdateSetting('flood_alert_template', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* User Management Tab */}
            {activeTab === 'users' && (
                <div className="card bg-base-100 shadow-xl border border-base-200 overflow-hidden animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className="p-6 border-b border-base-200 flex justify-between items-center bg-base-200/30">
                        <h3 className="font-black italic flex items-center gap-2">
                            <Users size={20} /> REGISTERED USERS
                        </h3>
                        <button className="btn btn-primary btn-sm rounded-xl" onClick={() => {
                            setEditingUser(null);
                            setUserFormData({ name: "", email: "", password: "", roleId: 2, telegram_chat_id: "" });
                            setIsUserModalOpen(true);
                        }}>
                            <UserPlus size={16} /> ADD USER
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="table table-zebra w-full">
                            <thead>
                                <tr className="bg-base-200/50">
                                    <th className="font-black text-xs uppercase opacity-50">User</th>
                                    <th className="font-black text-xs uppercase opacity-50">Role</th>
                                    <th className="font-black text-xs uppercase opacity-50">Telegram Chat ID</th>
                                    <th className="font-black text-xs uppercase opacity-50 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary">
                                                    {u.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold">{u.name}</p>
                                                    <p className="text-xs opacity-50">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge font-bold text-[10px] ${u.roleId === 1 ? 'badge-primary' :
                                                u.roleId === 2 ? 'badge-info' :
                                                    'badge-ghost'
                                                }`}>
                                                {u.roleId === 1 ? 'SuperAdmin' : u.roleId === 2 ? 'Admin' : 'User'}
                                            </span>
                                        </td>
                                        <td>
                                            <code className="text-xs bg-base-200 px-2 py-1 rounded font-mono">
                                                {u.telegram_chat_id || '---'}
                                            </code>
                                        </td>
                                        <td className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <button className="btn btn-ghost btn-xs text-primary" onClick={() => handleSendTestMessage(u.id)} title="Send Test Telegram Message">
                                                    <Bot size={14} />
                                                </button>
                                                <button className="btn btn-ghost btn-xs" onClick={() => {
                                                    setEditingUser(u);
                                                    setUserFormData({
                                                        name: u.name,
                                                        email: u.email,
                                                        password: "",
                                                        roleId: u.roleId,
                                                        telegram_chat_id: u.telegram_chat_id || ""
                                                    });
                                                    setIsUserModalOpen(true);
                                                }}>
                                                    <Edit2 size={14} />
                                                </button>
                                                <button className="btn btn-ghost btn-xs text-error" onClick={() => handleDeleteUser(u.id)}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Telegram Logs Tab */}
            {activeTab === 'logs' && (
                <div className="card bg-base-100 shadow-xl border border-base-200 overflow-hidden animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className="p-6 border-b border-base-200 bg-base-200/30">
                        <h3 className="font-black italic flex items-center gap-2">
                            <History size={20} /> TELEGRAM MESSAGE HISTORY
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="table table-sm w-full">
                            <thead>
                                <tr className="bg-base-200/50">
                                    <th className="font-black text-xs uppercase opacity-50">Timestamp</th>
                                    <th className="font-black text-xs uppercase opacity-50">Recipient/User</th>
                                    <th className="font-black text-xs uppercase opacity-50">Message</th>
                                    <th className="font-black text-xs uppercase opacity-50">Type</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.length === 0 ? (
                                    <tr><td colSpan="4" className="text-center py-10 opacity-40 font-bold italic">No logs found yet</td></tr>
                                ) : (
                                    logs.map(log => (
                                        <tr key={log.id} className="hover">
                                            <td className="font-mono text-[10px] opacity-60">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </td>
                                            <td>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-xs">{log.user?.name || log.chatId}</span>
                                                    <span className="text-[10px] opacity-50 font-mono">ID: {log.chatId}</span>
                                                </div>
                                            </td>
                                            <td className="max-w-xs">
                                                <p className="truncate text-xs" title={log.message}>{log.message}</p>
                                            </td>
                                            <td>
                                                <span className={`badge badge-outline text-[10px] font-black ${log.type === 'sent' ? 'badge-success' : 'badge-info'}`}>
                                                    {log.type.toUpperCase()}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* User Modal */}
            {isUserModalOpen && (
                <div className="modal modal-open">
                    <div className="modal-box rounded-3xl p-0 overflow-hidden border border-base-300">
                        <div className="p-6 border-b bg-base-200/50 flex justify-between items-center">
                            <h3 className="font-black text-xl italic uppercase font-tight">
                                {editingUser ? "Configure User" : "Register User"}
                            </h3>
                            <button className="btn btn-sm btn-circle btn-ghost" onClick={() => setIsUserModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleUserSubmit} className="p-8 space-y-4">
                            <div className="form-control">
                                <label className="label"><span className="label-text font-black text-xs opacity-50">FULL NAME</span></label>
                                <input
                                    className="input input-bordered font-bold"
                                    required
                                    value={userFormData.name}
                                    onChange={e => setUserFormData({ ...userFormData, name: e.target.value })}
                                />
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text font-black text-xs opacity-50">EMAIL ADDRESS</span></label>
                                <input
                                    type="email"
                                    className="input input-bordered font-bold"
                                    required
                                    value={userFormData.email}
                                    onChange={e => setUserFormData({ ...userFormData, email: e.target.value })}
                                />
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text font-black text-xs opacity-50">PASSWORD {editingUser && '(Leave blank to keep)'}</span></label>
                                <input
                                    type="password"
                                    className="input input-bordered font-bold"
                                    required={!editingUser}
                                    value={userFormData.password}
                                    onChange={e => setUserFormData({ ...userFormData, password: e.target.value })}
                                />
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text font-black text-xs opacity-50">ROLE</span></label>
                                <select
                                    className="select select-bordered font-bold"
                                    value={userFormData.roleId}
                                    onChange={e => setUserFormData({ ...userFormData, roleId: Number(e.target.value) })}
                                >
                                    <option value={1}>SuperAdmin</option>
                                    <option value={2}>Admin</option>
                                    <option value={3}>User</option>
                                </select>
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text font-black text-xs opacity-50">TELEGRAM CHAT ID</span></label>
                                <input
                                    className="input input-bordered font-mono text-sm"
                                    value={userFormData.telegram_chat_id}
                                    placeholder="e.g. 123456789"
                                    onChange={e => setUserFormData({ ...userFormData, telegram_chat_id: e.target.value })}
                                />
                            </div>
                            <div className="pt-4">
                                <button className="btn btn-primary w-full font-black italic shadow-lg shadow-primary/30">
                                    <Check size={18} /> SAVE USER DATA
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemSettings;
