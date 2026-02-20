import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth_context";
import { LayoutDashboard, User, LogOut, Menu, Cpu, History, Settings, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import InsamoLogo from "../assets/InsamoLogo.webp";
import { getImageUrl } from "../lib/api";

export default function MainLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

    useEffect(() => {
        const daisyTheme = theme === "dark" ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", daisyTheme);
        localStorage.setItem("theme", theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(theme === "light" ? "dark" : "light");
    };

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    const menuItems = [
        { path: "/home", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
        { path: "/device", label: "Device Management", icon: <Cpu size={20} /> },
        { path: "/history", label: "History", icon: <History size={20} /> },
    ];

    return (
        <div className="drawer lg:drawer-open">
            <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
            <div className="drawer-content flex flex-col h-screen bg-base-200">
                {/* Topbar */}
                <div className="navbar bg-base-100 shadow-sm px-4 flex justify-between lg:items-center">
                    <div className="flex-none lg:hidden">
                        <label htmlFor="my-drawer-2" className="btn btn-square btn-ghost">
                            <Menu />
                        </label>
                    </div>

                    <div className="flex items-center justify-center w-full ">
                        <img src={InsamoLogo} alt="INSAMO Logo" className="w-12 h-12" />
                        <div className="ml-2">
                            <span className="text-4xl font-black tracking-widest text-primary">INSAMO</span>
                        </div>
                    </div>

                    <div className="flex-none gap-2">
                        <button className="btn btn-ghost btn-circle" onClick={toggleTheme}>
                            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
                        </button>
                        {/* <button className="btn btn-ghost btn-circle">
                            <Settings size={20} />
                        </button> */}
                    </div>
                </div>

                {/* Page Content */}
                <main className="w-full p-4 lg:p-8 overflow-auto flex-grow">
                    <Outlet />
                </main>
            </div>

            <div className="drawer-side h-full z-20 ">
                <label htmlFor="my-drawer-2" className="drawer-overlay"></label>
                <div className="menu p-4 w-72 min-h-full bg-base-100 text-base-content flex flex-col shadow-xl">
                    <div className="px-4 py-6 mb-4">
                        <img src={InsamoLogo} alt="INSAMO Logo" className="w-12 h-12" />
                        <h1 className="text-3xl font-black text-primary italic">INSAMO</h1>
                        <p className="text-xs opacity-50 font-bold uppercase tracking-widest">Integrated Smart Monitoring</p>
                    </div>

                    <div className="flex-grow space-y-1">
                        {menuItems.map((item) => (
                            <li key={item.path}>
                                <Link
                                    to={item.path}
                                    className={`flex items-center gap-4 py-3 px-4 rounded-xl transition-all ${location.pathname === item.path
                                        ? "bg-primary text-primary-content shadow-lg shadow-primary/20 font-bold"
                                        : "hover:bg-base-200"
                                        }`}
                                >
                                    {item.icon}
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </div>

                    <div className="divider opacity-50"></div>

                    {/* Profile Dropdown */}
                    <div className="dropdown dropdown-top w-full">
                        <div tabIndex={0} role="button" className="flex items-center gap-4 p-3 hover:bg-base-200 rounded-2xl cursor-pointer transition-all active:scale-95">
                            <div className="avatar">
                                <div className="w-12 h-12 rounded-2xl shadow-md ring ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden bg-base-300">
                                    <img
                                        src={getImageUrl(user?.photo_path) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || "User"}`}
                                        alt="avatar"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                            <div className="flex-grow overflow-hidden">
                                <p className="text-sm font-bold truncate">{user?.name}</p>
                                <p className="text-xs opacity-60 truncate">{user?.email}</p>
                            </div>
                        </div>
                        <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-2xl bg-base-100 rounded-2xl w-full mb-2 border border-base-200 animate-in fade-in slide-in-from-bottom-2">
                            <li>
                                <Link to="/profile" className="py-3 px-4">
                                    <User size={18} /> Profile & Preference
                                </Link>
                            </li>
                            <div className="divider my-0 opacity-50"></div>
                            <li>
                                <button onClick={handleLogout} className="text-error py-3 px-4">
                                    <LogOut size={18} /> Logout
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
