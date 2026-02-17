import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth_context";
import { Mail, Lock, LogIn, Eye, EyeOff, AlertCircle } from "lucide-react";
import InsamoLogo from "../../assets/InsamoLogo.webp";


export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        try {
            await login(email, password);
            navigate("/");
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Login failed. Please check your credentials.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-base-200/50 p-4">
            <div className="card w-full max-w-sm bg-base-100 shadow-2xl border border-base-200 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="card-body p-8">
                    <div className="text-center mb-6">
                        <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                            <img src={InsamoLogo} alt="INSAMO Logo" className="w-12 h-12" />
                        </div>
                        <h2 className="text-3xl font-black italic">INSAMO</h2>
                        <p className="text-sm opacity-60 font-medium">Integrated Smart Monitoring</p>
                    </div>

                    {error && (
                        <div className="alert alert-error shadow-sm rounded-xl mb-4 text-sm font-bold flex items-center gap-2 p-3">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="form-control">
                            <label className="label text-xs font-black opacity-60 uppercase">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                                <input
                                    type="email"
                                    placeholder="name@company.com"
                                    className="input input-bordered w-full font-medium"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-control">
                            <label className="label text-xs font-black opacity-60 uppercase">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="input input-bordered w-full pr-10 font-medium"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100 transition-opacity"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <label className="label justify-end">
                                <Link href="#" className="label-text-alt link link-hover text-primary font-bold">Forgot password?</Link>
                            </label>
                        </div>

                        <div className="form-control mt-6">
                            <button className="btn btn-primary w-full font-black italic shadow-lg shadow-primary/30" disabled={isLoading}>
                                {isLoading ? <span className="loading loading-spinner loading-sm"></span> : "SIGN IN"}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center text-sm font-medium opacity-80">
                        Don't have an account? <Link to="/register" className="link link-primary font-bold">Create Account</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}