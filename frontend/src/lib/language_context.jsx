import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const translations = {
    en: {
        // Navbar
        features: "Features",
        products: "Products",
        demo: "Live Demo",
        about_us: "About Us",
        login: "Log In",
        register: "Get Started",
        
        // Hero
        hero_title_1: "Integrated",
        hero_title_2: "Smart",
        hero_title_3: "Monitoring",
        hero_desc: "Transform your environmental data into actionable insights. Insamo provides real-time analytics, predictive maintenance alerts, and seamless IoT integration for modern industries.",
        view_demo: "View Live Demo",
        
        // Solutions
        solutions_title: "Our Solutions",
        solutions_desc: "Specialized monitoring systems for every environment.",
        
        // Demo/Map
        demo_title: "Live Network Visualization",
        demo_desc: "See real-time data from our deployed sensors across the region. Experience the power of Insamo's interactive geospatial dashboard.",
        full_dashboard: "Access Full Dashboard",
        map_legend: "MAP LEGEND",
        legend_sigma: "SIGMA (EARTHQUAKE)",
        legend_flows: "FLOWS (FLOOD)",
        legend_landslide: "LANDSLIDE",
        legend_wildfire: "WILDFIRE",
        legend_offline: "OFFLINE / NO SIGNAL",
        click_marker: "Click on markers to see live details and analysis.",
        view_details: "VIEW DETAILS",
        
        // About Us
        about_title: "About Us",
        about_badge: "Our Mission",
        about_desc_1: "Insamo is a collaborative research initiative from Institut Teknologi Sepuluh Nopember (ITS) focused on disaster mitigation and climate change through innovative IoT technology.",
        about_desc_2: "We aim to provide reliable, real-time monitoring solutions that help communities and industries prepare for and respond to natural challenges.",
        research_collab: "Joint Collaboration by",
        its_name: "Institut Teknologi",
        its_sub: "Sepuluh Nopember",
        mkpi_name: "Pusat Studi MKPI",
        mkpi_sub: "Disaster Mitigation & Climate Change",
        
        // Dashboard
        dashboard: "Dashboard",
        ai_prediction: "AI Prediction",
        flood_monitor: "Flood Monitor",
        earthquake: "Earthquake",
        landslide: "Landslide",
        wildfire: "Wildfire",
        weather: "Weather",
        history: "History",
        device_mgmt: "Device Management",
        sys_settings: "System Settings",
        profile: "Profile & Preference",
        logout: "Logout",
        
        // Carousel Items
        prod_weather_title: "Weather Monitoring",
        prod_weather_desc: "High-precision real-time weather parameter monitoring system for microclimate analysis.",
        prod_wildfire_title: "Wildfire Monitoring",
        prod_wildfire_desc: "Early fire point detection and air quality monitoring to prevent widespread forest fires.",
        prod_landslide_title: "Landslide Monitoring",
        prod_landslide_desc: "Soil movement and slope inclination sensors for early warning of potential landslides.",
        prod_earthquake_title: "Earthquake Monitoring",
        prod_earthquake_desc: "Real-time seismic activity monitoring to mitigate the impact of earthquake disasters.",
        prod_flood_title: "Flood Early Warning",
        prod_flood_desc: "Integrated flood early warning system based on water level and river discharge.",
        prod_ai_title: "AI Visual Analytics",
        prod_ai_desc: "AI-based visual analytics for intelligent environmental monitoring and event prediction.",
        
        // Footer
        footer_desc: "Empowering industries with next-generation IoT monitoring and analytics. Built for reliability, designed for people.",
        company: "Company",
        legal: "Legal",
        terms: "Terms of use",
        privacy: "Privacy policy",
        cookies: "Cookie policy",
        copyright: "Insamo is an Integrated Smart Monitoring system. Copyright © {year} Berlian Al Kindhi & Team, ITS Research Collaboration",
    },
    id: {
        // Navbar
        features: "Fitur",
        products: "Produk",
        demo: "Demo Live",
        about_us: "Tentang Kami",
        login: "Masuk",
        register: "Mulai Sekarang",
        
        // Hero
        hero_title_1: "Integrated",
        hero_title_2: "Smart",
        hero_title_3: "Monitoring",
        hero_desc: "Ubah data lingkungan Anda menjadi wawasan yang dapat ditindaklanjuti. Insamo menyediakan analitik real-time, peringatan pemeliharaan prediktif, dan integrasi IoT yang mulus untuk industri modern.",
        view_demo: "Lihat Demo Live",
        
        // Solutions
        solutions_title: "Solusi Kami",
        solutions_desc: "Sistem pemantauan khusus untuk setiap lingkungan.",
        
        // Demo/Map
        demo_title: "Visualisasi Jaringan Langsung",
        demo_desc: "Lihat data real-time dari sensor kami yang tersebar di seluruh wilayah. Rasakan kekuatan dasbor geospasial interaktif Insamo.",
        full_dashboard: "Akses Dasbor Lengkap",
        map_legend: "LEGENDA PETA",
        legend_sigma: "SIGMA (GEMPA)",
        legend_flows: "FLOWS (BANJIR)",
        legend_landslide: "LANDSLIDE (LONGSOR)",
        legend_wildfire: "WILDFIRE (KEBAKARAN)",
        legend_offline: "OFFLINE / TANPA SINYAL",
        click_marker: "Klik pada penanda untuk melihat detail dan analisis langsung.",
        view_details: "LIHAT DETAIL",

        // About Us
        about_title: "Tentang Kami",
        about_badge: "Misi Kami",
        about_desc_1: "Insamo adalah inisiatif riset kolaborasi dari Institut Teknologi Sepuluh Nopember (ITS) yang berfokus pada mitigasi bencana dan perubahan iklim melalui teknologi IoT yang inovatif.",
        about_desc_2: "Kami bertujuan untuk menyediakan solusi pemantauan real-time yang andal yang membantu masyarakat dan industri bersiap dan menanggapi tantangan alam.",
        research_collab: "Kolaborasi Riset oleh",
        its_name: "Institut Teknologi",
        its_sub: "Sepuluh Nopember",
        mkpi_name: "Pusat Studi MKPI",
        mkpi_sub: "Mitigasi Kebencanaan & Perubahan Iklim",
        
        // Dashboard
        dashboard: "Dasbor",
        ai_prediction: "Prediksi AI",
        flood_monitor: "Pantau Banjir",
        earthquake: "Gempa Bumi",
        landslide: "Tanah Longsor",
        wildfire: "Kebakaran Hutan",
        weather: "Cuaca",
        history: "Riwayat",
        device_mgmt: "Manajemen Perangkat",
        sys_settings: "Pengaturan Sistem",
        profile: "Profil & Preferensi",
        logout: "Keluar",
        
        // Carousel Items
        prod_weather_title: "Weather Monitoring",
        prod_weather_desc: "Sistem pemantauan parameter cuaca real-time dengan akurasi tinggi untuk analisis mikroklimat.",
        prod_wildfire_title: "Wildfire Monitoring",
        prod_wildfire_desc: "Deteksi dini titik api dan pemantauan kualitas udara untuk mencegah kebakaran hutan yang meluas.",
        prod_landslide_title: "Landslide Monitoring",
        prod_landslide_desc: "Sensor pergerakan tanah dan kemiringan lereng untuk peringatan dini potensi tanah longsor.",
        prod_earthquake_title: "Earthquake Monitoring",
        prod_earthquake_desc: "Pemantauan aktivitas seismik secara real-time untuk mitigasi dampak bencana gempa bumi.",
        prod_flood_title: "Flood Early Warning",
        prod_flood_desc: "Sistem peringatan dini banjir berbasis ketinggian muka air dan debit sungai yang terintegrasi.",
        prod_ai_title: "AI Visual Analytics",
        prod_ai_desc: "Analisis visual berbasis AI untuk pemantauan lingkungan dan prediksi kejadian secara cerdas.",
        
        // Footer
        footer_desc: "Memberdayakan industri dengan pemantauan IoT dan analitik generasi berikutnya. Dibangun untuk keandalan, dirancang untuk manusia.",
        company: "Perusahaan",
        legal: "Hukum",
        terms: "Ketentuan penggunaan",
        privacy: "Kebijakan privasi",
        cookies: "Kebijakan kuki",
        copyright: "Insamo adalah Integrated Smart Monitoring merupakan Copyright © {year} Berlian Al Kindhi & Tim, Riset Kolaborasi ITS",
    }
};

export const LanguageProvider = ({ children }) => {
    const [lang, setLang] = useState(() => localStorage.getItem("lang") || "en");

    useEffect(() => {
        localStorage.setItem("lang", lang);
    }, [lang]);

    const t = (key) => {
        return translations[lang][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
};
