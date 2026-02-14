
import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth_context";
import { LayoutDashboard, User, LogOut, Menu } from "lucide-react";

export default function MainLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    return (
        <div className="drawer lg:drawer-open">
            <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
            <div className="drawer-content flex flex-col items-center justify-start bg-base-200 h-screen">
                {/* Navbar for mobile */}
                <div className="navbar bg-base-100 lg:hidden w-full">
                    <div className="flex-none">
                        <label htmlFor="my-drawer-2" className="btn btn-square btn-ghostDrawer">
                            <Menu />
                        </label>
                    </div>
                    <div className="flex-1">
                        <a className="btn btn-ghost text-xl">Insamo</a>
                    </div>
                </div>

                {/* Page Content */}
                <div className="w-full p-4 lg:p-8 overflow-auto flex-grow">
                    <Outlet />
                </div>
            </div>

            <div className="drawer-side h-full">
                <label htmlFor="my-drawer-2" className="drawer-overlay"></label>
                <ul className="menu p-4 w-64 min-h-full bg-base-100 text-base-content flex flex-col h-full">
                    <h1 className="text-2xl font-bold mb-8 px-4 text-primary">Insamo RW</h1>

                    <li className="mb-2"><Link to="/"><LayoutDashboard size={20} /> <Home /></Link></li>
                    <li className="mb-auto"><Link to="/profile"><User size={20} /> Profile</Link></li>

                    <div className="divider"></div>

                    <div className="flex items-center gap-4 px-4 py-2">
                        <div className="avatar">
                            <div className="w-10 rounded-full">
                                <img src={user?.photo_path || "https://ui-avatars.com/api/?name=" + (user?.name || "User")} alt="avatar" />
                            </div>
                        </div>
                        <div className="flex-grow overflow-hidden">
                            <p className="text-sm font-bold truncate">{user?.name}</p>
                            <p className="text-xs opacity-60 truncate">{user?.email}</p>
                        </div>
                    </div>

                    <li className="mt-4">
                        <button onClick={handleLogout} className="text-error">
                            <LogOut size={20} /> Logout
                        </button>
                    </li>
                </ul>
            </div>
        </div>
    );
}
