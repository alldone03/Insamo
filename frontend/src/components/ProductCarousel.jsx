import React from 'react';
import { useLanguage } from '../lib/language_context';

import weatherImg from "../assets/weather.webp";
import wildfireImg from "../assets/apiapi.webp";
import landslideImg from "../assets/longsyor.webp";
import earthquakeImg from "../assets/gempajir.webp";
import floodImg from "../assets/banjier.webp";
import aiImg from "../assets/logoInsamo.webp";

const ProductCarousel = () => {
    const { t } = useLanguage();

    const products = [
        { title: t('prod_weather_title'), img: weatherImg, color: "bg-blue-500", desc: t('prod_weather_desc') },
        { title: t('prod_wildfire_title'), img: wildfireImg, color: "bg-red-500", desc: t('prod_wildfire_desc') },
        { title: t('prod_landslide_title'), img: landslideImg, color: "bg-amber-700", desc: t('prod_landslide_desc') },
        { title: t('prod_earthquake_title'), img: earthquakeImg, color: "bg-blue-600", desc: t('prod_earthquake_desc') },
        { title: t('prod_flood_title'), img: floodImg, color: "bg-cyan-500", desc: t('prod_flood_desc') },
        { title: t('prod_ai_title'), img: aiImg, color: "bg-emerald-500", desc: t('prod_ai_desc') },
    ];

    return (
        <div className="carousel carousel-center max-w-full p-4 space-x-6 rounded-box scroll-smooth">
            {products.map((product, index) => (
                <div key={index} className="carousel-item p-4">
                    <div className="card w-80 bg-base-100 shadow-xl border border-base-200 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group overflow-hidden">

                        {/* Section Figure: Area Ikon/Logo */}
                        <figure className="px-10 pt-10 relative">
                            <div className={`absolute inset-0 opacity-5 ${product.color} group-hover:opacity-10 transition-opacity`}></div>
                            <div className={`p-4 rounded-3xl bg-opacity-10 ${product.color} relative z-10 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                                <img
                                    src={product.img}
                                    alt={product.title}
                                    className="w-8 h-8 object-contain filter drop-shadow-md"
                                />
                            </div>
                        </figure>

                        {/* Section Body: Konten Teks */}
                        <div className="card-body items-center text-center pb-10">
                            <h2 className="card-title text-xl font-black text-base-content tracking-tighter uppercase italic">
                                {product.title}
                            </h2>
                            <div className={`w-12 h-1 ${product.color} rounded-full mb-2 opacity-50 group-hover:w-24 transition-all duration-500`}></div>
                            <p className="text-sm text-base-content/70 leading-relaxed font-medium">
                                {product.desc}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ProductCarousel;
