import React, { useState, useMemo } from 'react';
import {
    History as HistoryIcon,
    Waves,
    Activity,
    Mountain,
    Calendar,
    Search,
    Download,
    TrendingUp,
    BarChart3,
    Table as TableIcon
} from "lucide-react";
import FloodHistory from '../components/History/FloodHistory';
import EarthquakeHistory from '../components/History/EarthquakeHistory';
import LandslideHistory from '../components/History/LandslideHistory';

const History = () => {
    const [activeTab, setActiveTab] = useState('flood');

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black flex items-center gap-3 italic">
                        <HistoryIcon className="text-primary" size={32} />
                        HISTORICAL DATA
                    </h2>
                    <p className="opacity-60 font-medium tracking-tight">Deep dive into previous sensor readings and events.</p>
                </div>

                <div className="join bg-base-100 shadow-sm border border-base-200">
                    <button
                        className={`join-item btn btn-sm ${activeTab === 'flood' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setActiveTab('flood')}
                    >
                        <Waves size={16} /> FLOOD
                    </button>
                    <button
                        className={`join-item btn btn-sm ${activeTab === 'earthquake' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setActiveTab('earthquake')}
                    >
                        <Activity size={16} /> EARTHQUAKE
                    </button>
                    <button
                        className={`join-item btn btn-sm ${activeTab === 'landslide' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setActiveTab('landslide')}
                    >
                        <Mountain size={16} /> LANDSLIDE
                    </button>
                </div>
            </div>

            <div className="min-h-[600px]">
                {activeTab === 'flood' && <FloodHistory />}
                {activeTab === 'earthquake' && <EarthquakeHistory />}
                {activeTab === 'landslide' && <LandslideHistory />}
            </div>
        </div>
    );
};

export default History;
