
import { useState } from "react";
import { useAuth } from "../../lib/auth_context";
import { User, Lock, Moon, Sun, Camera, Check, AlertCircle } from "lucide-react";
import { api, getImageUrl } from "../../lib/api";
import { useQueryClient } from "@tanstack/react-query";

export default function Profile() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
    const [previewImage, setPreviewImage] = useState(null);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });

    const toggleTheme = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        const html = document.querySelector('html');
        if (html) {
            const theme = newMode ? 'dark' : 'light';
            html.setAttribute('data-theme', theme);
            localStorage.setItem('theme', newMode ? 'dark' : 'light');
        }
    };

    const handleUpdatePhoto = async (file) => {
        setLoading(true);
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('_method', 'PUT');

        try {
            await api.post(`/users/${user.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage({ text: "Profile photo updated!", type: "success" });
            queryClient.invalidateQueries(["user"]); // If user is fetched via react-query
            // Fallback: reload page if user context isn't automatically updated
            window.location.reload();
        } catch (err) {
            setMessage({ text: "Failed to upload photo", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setMessage({ text: "Passwords do not match", type: "error" });
            return;
        }
        setLoading(true);
        // Note: Backend password update endpoint is not implemented yet in this context, 
        // but we would call api.post('/change-password', ...) here.
        // mimicking success for UI demo if no backend endpoint exist yet for change password
        // or we can implement it in backend later.

        // For now, let's just show a message that it's not implemented or simulate success
        setTimeout(() => {
            setLoading(false);
            setMessage({ text: "Password update text simulated (endpoint needed)", type: "info" });
            setPassword("");
            setConfirmPassword("");
        }, 1000);
    };

    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-8">
            <h1 className="text-3xl font-bold">User Preferences</h1>

            {message.text && (
                <div className={`alert alert-${message.type}`}>
                    <span>{message.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Profile Photo */}
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h2 className="card-title"><User /> Profile Information</h2>
                        <div className="flex flex-col items-center gap-4 mt-4">
                            <div className="avatar relative">
                                <div className="w-24 h-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden bg-base-300">
                                    <img
                                        src={previewImage || getImageUrl(user?.photo_path) || "https://ui-avatars.com/api/?name=" + (user?.name || "User")}
                                        alt="profile"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <label className="btn btn-circle btn-xs btn-primary absolute bottom-0 right-0 cursor-pointer">
                                    <Camera size={12} />
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setPreviewImage(URL.createObjectURL(file));
                                                handleUpdatePhoto(file);
                                            }
                                        }}
                                    />
                                </label>
                            </div>
                            <div className="text-center">
                                <p className="text-xl font-bold">{user?.name}</p>
                                <p className="opacity-60">{user?.email}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* UI Mode */}
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h2 className="card-title">Theme Settings</h2>
                        <div className="flex items-center justify-between mt-4">
                            <span>Dark Mode</span>
                            <input
                                type="checkbox"
                                className="toggle toggle-primary"
                                checked={darkMode}
                                onChange={toggleTheme}
                            />
                        </div>
                        <div className="flex items-center gap-2 mt-4 text-sm opacity-60">
                            {darkMode ? <Moon size={16} /> : <Sun size={16} />}
                            <span>Switch between Light and Dark mode</span>
                        </div>
                    </div>
                </div>

                {/* Change Password */}
                <div className="card bg-base-100 shadow-xl md:col-span-2">
                    <div className="card-body">
                        <h2 className="card-title"><Lock /> Security</h2>
                        <form onSubmit={handleUpdatePassword} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="form-control">
                                <label className="label"><span className="label-text">New Password</span></label>
                                <input
                                    type="password"
                                    className="input input-bordered"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-control">
                                <label className="label"><span className="label-text">Confirm Password</span></label>
                                <input
                                    type="password"
                                    className="input input-bordered"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-control mt-6 md:col-span-2">
                                <button className="btn btn-primary" disabled={loading}>
                                    {loading ? <span className="loading loading-spinner"></span> : "Update Password"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
