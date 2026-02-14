
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth_context";

export default function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { register } = useAuth();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");
        try {
            await register(name, email, password);
            navigate("/");
        } catch (err) {
            setError(err.response?.data?.message || err.message || "An error occurred");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-base-200">
            <div className="card w-96 bg-base-100 shadow-xl">
                <div className="card-body">
                    <h2 className="card-title justify-center text-2xl font-bold mb-4">Register</h2>
                    {error && <div className="alert alert-error mb-4"><span>{error}</span></div>}
                    <form onSubmit={handleRegister}>
                        <div className="form-control">
                            <label className="label"><span className="label-text">Name</span></label>
                            <input
                                type="text"
                                placeholder="Your Name"
                                className="input input-bordered"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-control mt-2">
                            <label className="label"><span className="label-text">Email</span></label>
                            <input
                                type="email"
                                placeholder="email@example.com"
                                className="input input-bordered"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-control mt-2">
                            <label className="label"><span className="label-text">Password</span></label>
                            <input
                                type="password"
                                placeholder="password"
                                className="input input-bordered"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-control mt-6">
                            <button className="btn btn-primary">Register</button>
                        </div>
                    </form>
                    <div className="mt-4 text-center">
                        <p className="text-sm">Already have an account? <Link to="/login" className="link link-primary">Login</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
}
