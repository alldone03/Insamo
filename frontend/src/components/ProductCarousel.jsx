import React from 'react';
import { CloudRain, Flame, Mountain, Activity, Waves, Cpu } from 'lucide-react';

const products = [
    { title: "Weather Monitoring", icon: CloudRain, color: "text-blue-500", desc: "Precision meteorological data for agriculture and aviation." },
    { title: "Wildfire Monitoring", icon: Flame, color: "text-red-500", desc: "Early detection systems to prevent forest fire spread." },
    { title: "Landslide Monitoring", icon: Mountain, color: "text-amber-700", desc: "Geotechnical sensors to warn of soil instability." },
    { title: "Earthquake Monitoring", icon: Activity, color: "text-purple-500", desc: "Seismic activity tracking for disaster preparedness." },
    { title: "Flood Early Warning", icon: Waves, color: "text-cyan-500", desc: "Real-time water level alerts for community safety." },
    { title: "AI Visual Analytics", icon: Cpu, color: "text-emerald-500", desc: "Predictive water level monitoring using computer vision." },
];

const ProductCarousel = () => {
    return (
        <div className="carousel carousel-center max-w-full p-4 space-x-4 rounded-box">
            {products.map((product, index) => (
                <div key={index} className="carousel-item p-4">
                    <div className="card w-80 bg-base-100 shadow-xl border border-base-200 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">

                        {/* Section Figure: Area Ikon */}
                        <figure className="px-10 pt-10">
                            <div className={`p-4 rounded-2xl bg-opacity-10 ${product.color.replace('text-', 'bg-')}`}>
                                <product.icon size={48} className={product.color} />
                            </div>
                        </figure>

                        {/* Section Body: Konten Teks */}
                        <div className="card-body items-center text-center">
                            <h2 className="card-title text-xl font-bold text-base-content">
                                {product.title}
                            </h2>
                            <p className="text-sm text-base-content/70 leading-relaxed">
                                {product.desc}
                            </p>

                            {/* Section Actions: Tombol */}
                            <div className="card-actions mt-6">
                                <button className="btn btn-primary btn-sm rounded-full px-6">
                                    Learn More
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ProductCarousel;
