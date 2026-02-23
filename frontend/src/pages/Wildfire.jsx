import React, { useState } from 'react';
import { Flame, PlayCircle } from 'lucide-react';

const Wildfire = () => {
  // In a real scenario, this could be fetched from an API
  // For now, these are placeholder video items pointing to local assets
  const [videos] = useState([
    {
      id: 1,
      title: "Sector Alpha Drone View",
      description: "Live feed from monitoring drone over Sector Alpha.",
      videoSrc: "/videos/wildfire_demo_1.mp4", // This will require the video to be in public/videos
      date: "2024-02-23"
    },
    {
      id: 2,
      title: "Forest Edge Camera 2",
      description: "Fixed camera detecting smoke patterns.",
      videoSrc: "/videos/wildfire_demo_2.mp4",
      date: "2024-02-23"
    }
  ]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <h2 className="text-3xl font-black flex items-center gap-3 italic text-error">
        <Flame size={32} />
        WILDFIRE SURVEILLANCE
      </h2>
      <p className="opacity-60 font-medium">Live video feeds and drone recordings</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((vid) => (
          <div key={vid.id} className="card bg-base-100 shadow-xl overflow-hidden border border-base-200 group hover:border-error transition-colors">
            <figure className="aspect-video bg-black relative">
              {/* In production, use a real <video> tag if sources exist, e.g.:
                                <video src={vid.videoSrc} controls className="w-full h-full object-cover" />
                                For now, simulating a video player UI:
                            */}
              <div className="absolute inset-0 flex items-center justify-center bg-base-300/20 group-hover:bg-base-300/0 transition-all">
                <PlayCircle size={48} className="text-white opacity-70 group-hover:opacity-100" />
              </div>
              <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 text-white text-[10px] font-bold rounded">
                LIVE
              </div>
            </figure>
            <div className="card-body p-5">
              <h2 className="card-title text-lg font-black">{vid.title}</h2>
              <p className="text-sm opacity-70">{vid.description}</p>
              <div className="card-actions justify-between items-center mt-4">
                <span className="text-xs font-mono opacity-50">{vid.date}</span>
                <button className="btn btn-sm btn-error btn-outline">Watch Stream</button>
              </div>
            </div>
          </div>
        ))}

        {videos.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center p-12 border-2 border-dashed border-base-300 rounded-xl">
            <Flame size={48} className="text-base-300 mb-4" />
            <p className="text-lg font-bold opacity-50">No active surveillance feeds</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wildfire;