import { useNavigate } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import InsamoLogo from "../assets/InsamoLogo.webp";

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-base-200/50 p-4 text-center">
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
                {/* Logo & Brand */}
                <div className="flex flex-col items-center mb-12">
                    <div className="bg-primary/10 w-24 h-24 rounded-3xl flex items-center justify-center mb-6 text-primary shadow-inner rotate-3">
                        <img src={InsamoLogo} alt="INSAMO Logo" className="w-16 h-16" />
                    </div>
                    <h2 className="text-4xl font-black italic tracking-tighter">INSAMO</h2>
                    <div className="badge badge-primary font-bold mt-2">SYSTEM ERROR</div>
                </div>

                {/* 404 Content */}
                <div className="relative">
                    <h1 className="text-[12rem] font-black leading-none opacity-5 select-none italic">
                        404
                    </h1>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <h2 className="text-3xl font-black italic uppercase">Asset Not Found</h2>
                        <p className="text-sm opacity-60 font-medium max-w-xs mt-2">
                            The coordinate or resource you're looking for is offline or moved to another sector.
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 mt-12 justify-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="btn btn-ghost border-base-300 font-bold px-8 rounded-2xl"
                    >
                        <ArrowLeft size={18} /> GO BACK
                    </button>
                    <button
                        onClick={() => navigate("/")}
                        className="btn btn-primary font-black italic px-8 rounded-2xl shadow-lg shadow-primary/20"
                    >
                        <Home size={18} /> BACK TO BASE
                    </button>
                </div>
            </div>

            {/* Subtle Footer */}
            <div className="fixed bottom-8 opacity-20 text-[10px] font-black uppercase tracking-[0.2em]">
                Integrated Smart Monitoring System • INSAMO v2.0
            </div>
        </div>
    );
}
