import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import "leaflet/dist/leaflet.css";

// 🚁 Precision Drone Icon (Black with Safety Glow)
const droneIcon = new L.DivIcon({
  html: `<div style="background: #000; border: 3px solid #fff; border-radius: 50%; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 25px rgba(0,0,0,0.2); font-size: 20px;">🚁</div>`,
  className: "", iconSize: [44, 44], iconAnchor: [22, 22],
});

const PilotMissionControl = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  
  const [telemetry, setTelemetry] = useState({
    lat: 15.3647, 
    lon: 75.1240,
    status: "MISSION_ACTIVE",
    battery: 94,
    distance: 0.52,
    altitude: 115,
    speed: 42,
    signal: 18, // Latency in MS
    timer: 0
  });

  const [path, setPath] = useState([[15.3647, 75.1240]]);
  const [isEmergency, setIsEmergency] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry(prev => ({
        ...prev,
        lat: prev.lat + 0.00008,
        lon: prev.lon + 0.00008,
        timer: prev.timer + 1,
        battery: prev.battery > 1 ? prev.battery - 0.05 : 0,
        distance: prev.distance + 0.004,
      }));
      setPath(prev => [...prev, [telemetry.lat, telemetry.lon]]);
    }, 1000);
    return () => clearInterval(interval);
  }, [telemetry.lat, telemetry.lon]);

  const formatTime = (s) => new Date(s * 1000).toISOString().substr(11, 8);

  return (
    <div className="h-screen w-full bg-[#F4F7F9] text-[#1A1A1A] font-sans overflow-hidden selection:bg-black selection:text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .glass-panel { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(12px); border: 1px solid rgba(0,0,0,0.05); border-radius: 24px; padding: 24px; box-shadow: 0 15px 35px rgba(0,0,0,0.05); }
        .data-label { font-size: 10px; color: #9BA3AF; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 4px; font-weight: 800; }
        .data-value { font-size: 22px; font-weight: 900; color: #000; tracking: -0.02em; }
        .critical-text { color: #EF4444; animation: blink 1.5s infinite; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>

      {/* 🗺️ LAYER 1: Light Premium Map */}
      <div className="absolute inset-0 z-0">
        <MapContainer center={[telemetry.lat, telemetry.lon]} zoom={17} className="h-full w-full" zoomControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          <Marker position={[telemetry.lat, telemetry.lon]} icon={droneIcon} />
          <Polyline positions={path} color="#000" weight={3} opacity={0.2} dashArray="10, 10" />
          <Circle center={[telemetry.lat, telemetry.lon]} radius={150} pathOptions={{ color: '#000', weight: 1, fillOpacity: 0.02 }} />
        </MapContainer>
      </div>

      {/* 🛠️ LAYER 2: TOP NAVIGATION */}
      <div className="absolute top-8 left-8 right-8 z-10 flex justify-between items-start pointer-events-none">
        <div className="glass-panel pointer-events-auto">
          <div className="flex items-center gap-4">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
            <div>
              <p className="data-label">Live Mission</p>
              <p className="text-sm font-black tracking-widest uppercase">{bookingId || "MSN-ALPHA-26"}</p>
            </div>
          </div>
        </div>

        <div className="glass-panel text-right pointer-events-auto">
          <p className="data-label">Elapsed Time</p>
          <p className="text-3xl font-black tabular-nums tracking-tighter text-black">{formatTime(telemetry.timer)}</p>
        </div>
      </div>

      {/* 📊 LAYER 3: SIDEBAR TELEMETRY */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2 z-10 w-72 space-y-4 pointer-events-none">
        <div className="glass-panel pointer-events-auto border-l-[6px] border-l-black">
          <p className="data-label">Battery Capacity</p>
          <div className="flex items-baseline gap-2">
            <p className={`text-4xl font-black ${telemetry.battery < 20 ? 'critical-text' : 'text-black'}`}>{Math.floor(telemetry.battery)}%</p>
            <span className="text-[10px] font-bold text-gray-400">LI-PO S6</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 mt-4 rounded-full overflow-hidden">
            <div className="h-full bg-black transition-all duration-500" style={{ width: `${telemetry.battery}%` }}></div>
          </div>
        </div>

        <div className="glass-panel pointer-events-auto grid grid-cols-2 gap-y-8 gap-x-4">
          <div><p className="data-label">Altitude</p><p className="data-value">{telemetry.altitude}<span className="text-xs ml-1 opacity-30">M</span></p></div>
          <div><p className="data-label">G-Speed</p><p className="data-value">{telemetry.speed}<span className="text-xs ml-1 opacity-30">KM/H</span></p></div>
          <div><p className="data-label">Latency</p><p className="data-value text-blue-500">{telemetry.signal}<span className="text-xs ml-1 opacity-40 font-bold">MS</span></p></div>
          <div><p className="data-label">Distance</p><p className="data-value">{telemetry.distance.toFixed(2)}<span className="text-xs ml-1 opacity-30">KM</span></p></div>
        </div>
      </div>

      {/* 🧭 LAYER 4: BOTTOM NAVIGATION */}
      <div className="absolute bottom-12 left-8 right-8 z-10 flex justify-between items-end pointer-events-none">
        <div className="glass-panel pointer-events-auto flex gap-12 px-10">
          <div><p className="data-label">Latitude</p><p className="font-bold text-sm tracking-tight">{telemetry.lat.toFixed(6)}</p></div>
          <div><p className="data-label">Longitude</p><p className="font-bold text-sm tracking-tight">{telemetry.lon.toFixed(6)}</p></div>
          <div><p className="data-label">Status</p><p className="font-bold text-sm text-blue-600 uppercase tracking-widest">{telemetry.status}</p></div>
        </div>

        <div className="flex gap-4 pointer-events-auto">
          <button className="bg-white text-black border border-gray-100 py-4 px-10 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-gray-50 transition-all active:scale-95">
            Switch View
          </button>
          <button 
            onClick={() => setIsEmergency(true)}
            className="bg-[#FFF1F1] text-red-600 border border-red-100 py-4 px-10 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-red-600 hover:text-white transition-all active:scale-95"
          >
            Abort Mission
          </button>
        </div>
      </div>

      {/* 🚨 MODAL: EMERGENCY ABORT */}
      {isEmergency && (
        <div className="fixed inset-0 z-[100] bg-white/60 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-white border border-gray-100 p-12 rounded-[3rem] max-w-md text-center shadow-[0_40px_100px_rgba(0,0,0,0.1)]">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">⚠️</div>
            <h2 className="text-3xl font-black text-black uppercase mb-4 tracking-tighter">Confirm Abort</h2>
            <p className="text-gray-400 mb-10 text-sm font-medium leading-relaxed uppercase tracking-wide">
              Initiating RTH (Return to Home) will override manual control. Airspace authorities will be alerted.
            </p>
            <div className="flex gap-4">
              <button onClick={() => setIsEmergency(false)} className="flex-1 py-5 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-[10px]">Back</button>
              <button onClick={() => navigate('/pilot-dashboard')} className="flex-1 py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl active:scale-95">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PilotMissionControl;