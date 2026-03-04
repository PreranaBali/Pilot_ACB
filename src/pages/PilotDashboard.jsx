import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

// 🚁 Clean Pilot Marker
const pilotIcon = new L.DivIcon({
  html: `
    <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px;">
      <div style="position: absolute; width: 100%; height: 100%; background: rgba(0,0,0,0.1); border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="background: #000; width: 34px; height: 34px; border: 3px solid #fff; border-radius: 50%; box-shadow: 0 4px 15px rgba(0,0,0,0.3); z-index: 10; display: flex; align-items: center; justify-content: center; color: white; font-size: 16px;">🚁</div>
    </div>
  `,
  className: "",
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

// 📍 Target Mission Marker
const missionTargetIcon = new L.DivIcon({
  html: `<div style="font-size: 24px;">🎯</div>`,
  className: "",
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 15, { duration: 1.2 });
  }, [center, map]);
  return null;
};

const PilotDashboard = () => {
  const [pilotToken, setPilotToken] = useState(localStorage.getItem("pilotToken"));
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ username: "", password: "", name: "", phone: "", drone_model: "DJI Agras T20" });
  const [authLoading, setAuthLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });
  const [viewMode, setViewMode] = useState("available");
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // 🟢 State for detailed mission view
  const [selectedMission, setSelectedMission] = useState(null);

  useEffect(() => {
    if (!pilotToken) return;
    let watchId;
    if ("geolocation" in navigator) {
      setIsBroadcasting(true);
      watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setCurrentLocation([latitude, longitude]);
          try {
            await fetch(`${BASE_URL}/api/pilots/telemetry`, {
              method: "PUT",
              headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${pilotToken}` 
              },
              body: JSON.stringify({ lat: latitude, lon: longitude, battery_level: 100 })
            });
          } catch (err) { console.error("Update failed:", err); }
        },
        () => {
          setIsBroadcasting(false);
          setStatusMsg({ type: "error", text: "Location signal lost. Please check your GPS settings." });
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
    }
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, [pilotToken]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const endpoint = authMode === "login" ? `${BASE_URL}/api/pilots/login` : `${BASE_URL}/api/pilots/register`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authMode === "login" ? { username: authForm.username, password: authForm.password } : authForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Something went wrong. Please try again.");
      
      if (authMode === "register") {
        setStatusMsg({ type: "success", text: "Account created! You can now log in." });
        setAuthMode("login");
      } else {
        localStorage.setItem("pilotToken", data.token);
        localStorage.setItem("pilotName", data.name);
        setPilotToken(data.token);
        setStatusMsg({ type: "success", text: `Welcome back, ${data.name}` });
      }
    } catch (err) { setStatusMsg({ type: "error", text: err.message }); }
    finally { setAuthLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem("pilotToken");
    localStorage.removeItem("pilotName");
    setPilotToken(null);
    setJobs([]);
    setCurrentLocation(null);
  };

  const fetchJobs = async () => {
    if (!pilotToken) return;
    try {
      setLoading(true);
      const endpoint = viewMode === "available" ? `${BASE_URL}/api/pilots/available-jobs` : `${BASE_URL}/api/pilots/my-jobs`;
      const res = await fetch(endpoint, { method: "GET", headers: { "Authorization": `Bearer ${pilotToken}` } });
      if (res.status === 401) handleLogout();
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (err) { setStatusMsg({ type: "error", text: "Could not load jobs." }); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (pilotToken) fetchJobs(); }, [pilotToken, viewMode]);

  const acceptJob = async (bookingId) => {
    try {
      const res = await fetch(`${BASE_URL}/api/pilots/jobs/${bookingId}/accept`, { method: "POST", headers: { "Authorization": `Bearer ${pilotToken}` } });
      if (!res.ok) throw new Error("Could not accept this job.");
      setViewMode("my_jobs");
      setSelectedMission(null);
      setStatusMsg({ type: "success", text: "Job accepted. Check your mission list." });
    } catch (err) { setStatusMsg({ type: "error", text: err.message }); }
  };

  const updateJobStatus = async (bookingId, newStatus) => {
    try {
      const res = await fetch(`${BASE_URL}/api/pilots/jobs/${bookingId}/status?status=${newStatus}`, { method: "PATCH", headers: { "Authorization": `Bearer ${pilotToken}` } });
      if (!res.ok) throw new Error("Status update failed.");
      fetchJobs();
    } catch (err) { setStatusMsg({ type: "error", text: err.message }); }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111] font-sans pb-32 pt-28">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .card { background: #fff; border: 1px solid #F3F4F6; border-radius: 20px; padding: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.02); }
        .input-field { background: #F3F4F6; border-radius: 12px; width: 100%; padding: 14px; margin-bottom: 12px; outline: none; font-weight: 500; border: 2px solid transparent; transition: 0.3s; }
        .input-field:focus { border-color: #000; background: #fff; }
        @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
      `}</style>

      <div className="max-w-4xl mx-auto px-5">
        {statusMsg.text && (
          <div className={`mb-6 p-4 text-center rounded-xl font-bold text-sm border ${statusMsg.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
            {statusMsg.text}
          </div>
        )}

        {!pilotToken ? (
          /* Authentication Section */
          <div className="card max-w-lg mx-auto text-center">
            <h1 className="text-2xl font-extrabold mb-2 uppercase tracking-tight">Pilot Access</h1>
            <p className="text-gray-400 text-sm mb-8 font-medium">Link your credentials to the Aircab terminal.</p>
            <form onSubmit={handleAuthSubmit}>
              <input className="input-field" type="text" placeholder="Username" required value={authForm.username} onChange={(e) => setAuthForm({...authForm, username: e.target.value})} />
              <input className="input-field" type="password" placeholder="Password" required value={authForm.password} onChange={(e) => setAuthForm({...authForm, password: e.target.value})} />
              {authMode === "register" && (
                <>
                  <input className="input-field" type="text" placeholder="Full Name" required value={authForm.name} onChange={(e) => setAuthForm({...authForm, name: e.target.value})} />
                  <input className="input-field" type="tel" placeholder="Phone Number" required value={authForm.phone} onChange={(e) => setAuthForm({...authForm, phone: e.target.value})} />
                  <select className="input-field" value={authForm.drone_model} onChange={(e) => setAuthForm({...authForm, drone_model: e.target.value})}>
                    <option value="DJI Agras T20">Aircab Alpha (Agri)</option>
                    <option value="DJI Matrice 300 RTK">Aircab Spectre (Cargo)</option>
                    <option value="Custom VTOL">Executive VTOL</option>
                  </select>
                </>
              )}
              <button disabled={authLoading} type="submit" className="w-full py-4 bg-black text-white rounded-xl font-bold uppercase tracking-wide mt-4 shadow-lg active:scale-95 transition-all">
                {authLoading ? "Synchronizing..." : (authMode === "login" ? "Initialize Link" : "Register Drone")}
              </button>
            </form>
            <button onClick={() => setAuthMode(authMode === "login" ? "register" : "login")} className="mt-6 text-xs font-bold text-gray-400 hover:text-black uppercase tracking-wider">
              {authMode === "login" ? "New pilot? Join the fleet" : "Return to terminal"}
            </button>
          </div>
        ) : (
          /* Dashboard Section */
          <>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter">Pilot Hub</h1>
                <div className="mt-1 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isBroadcasting ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{isBroadcasting ? "Broadcasting Live Telemetry" : "GPS disconnected"}</span>
                </div>
              </div>
              <button onClick={handleLogout} className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-xs font-bold hover:bg-gray-200">Sign Out</button>
            </div>

            <div className="w-full h-[500px] rounded-[30px] overflow-hidden border-2 border-white mb-8 shadow-xl relative">
              {!currentLocation ? (
                <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center">
                  <div className="w-8 h-8 border-4 border-gray-300 border-t-black rounded-full animate-spin mb-3"></div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Acquiring GPS Signal...</p>
                </div>
              ) : (
                <MapContainer center={currentLocation} zoom={15} style={{ height: "100%", width: "100%" }} zoomControl={false}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                  <MapUpdater center={currentLocation} />
                  <Marker position={currentLocation} icon={pilotIcon} />
                </MapContainer>
              )}
            </div>

            <div className="flex bg-gray-200/50 p-1 rounded-xl mb-8">
              <button onClick={() => setViewMode("available")} className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase transition-all ${viewMode === "available" ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-black"}`}>Job Board</button>
              <button onClick={() => setViewMode("my_jobs")} className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase transition-all ${viewMode === "my_jobs" ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-black"}`}>My Missions</button>
            </div>

            {loading ? (
              <p className="text-center text-xs font-bold text-gray-300 uppercase animate-pulse py-20">Scanning frequencies...</p>
            ) : jobs.length === 0 ? (
              <div className="card text-center py-20 border-dashed border-2 opacity-50">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No active missions available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {jobs.map((job) => (
                  <div 
                    key={job.booking_id} 
                    onClick={() => setSelectedMission(job)} // 🟢 Open Mission Detail
                    className="card flex flex-col cursor-pointer hover:border-gray-300 transition-all active:scale-[0.98]"
                  >
                    <div className="flex justify-between items-start mb-6 border-b border-gray-50 pb-4">
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase mb-1 tracking-widest">Mission: {job.booking_id.slice(0,8)}</p>
                        <h2 className="text-lg font-black uppercase text-black tracking-tight">{job.service_type}</h2>
                      </div>
                      <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase border ${job.status === 'in_progress' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-100 text-gray-500'}`}>{job.status}</span>
                    </div>

                    <div className="space-y-4 mb-8 flex-grow">
                      <div><p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Schedule</p><p className="font-bold text-sm">{job.date} @ {job.time}</p></div>
                      <div><p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Deployment Zone</p><p className="text-xs text-gray-500 font-medium leading-relaxed truncate">{job.address}</p></div>
                      <p className="text-sm font-black text-green-600">₹{job.total_price}</p>
                    </div>

                    <div className="pt-2">
                       <p className="text-[9px] font-black text-gray-300 uppercase text-center">Click for Mission Briefing</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* 📋 MISSION BRIEFING MODAL */}
        {selectedMission && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-2xl rounded-[40px] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
              {/* Modal Map Section */}
              <div className="w-full h-64 bg-gray-100 relative">
                <MapContainer center={[selectedMission.location.lat, selectedMission.location.lon]} zoom={14} style={{ height: "100%", width: "100%" }} zoomControl={false}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                  <Marker position={[selectedMission.location.lat, selectedMission.location.lon]} icon={missionTargetIcon} />
                </MapContainer>
                <button onClick={() => setSelectedMission(null)} className="absolute top-6 right-6 z-[1000] w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg font-bold">✕</button>
              </div>

              {/* Modal Content */}
              <div className="p-10">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-2 block">Mission Briefing</span>
                    <h2 className="text-3xl font-black uppercase tracking-tighter">{selectedMission.service_type}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Estimated Payment</p>
                    <p className="text-2xl font-black text-green-600">₹{selectedMission.total_price}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-10">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Customer</p>
                    <p className="font-bold text-sm">{selectedMission.customer_name || "Enterprise Client"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Schedule</p>
                    <p className="font-bold text-sm">{selectedMission.date} at {selectedMission.time}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Deployment Location</p>
                    <p className="text-sm font-medium text-gray-600">{selectedMission.address}</p>
                  </div>
                  <div className="col-span-2 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Flight Instructions</p>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                      {selectedMission.instructions || "Standard operating procedure applies. Maintain visual line of sight and monitor telemetry 120Hz. Battery cells must be at 4.2V nominal before ignition."}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  {viewMode === "available" ? (
                    <button 
                      onClick={() => acceptJob(selectedMission.booking_id)} 
                      className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-gray-900 transition-all active:scale-95"
                    >
                      Accept Mission
                    </button>
                  ) : (
                    <>
                      {selectedMission.status === "Accepted" && (
                        <button onClick={() => updateJobStatus(selectedMission.booking_id, "in_progress")} className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl active:scale-95">Begin Operation</button>
                      )}
                      {selectedMission.status === "in_progress" && (
                        <button onClick={() => updateJobStatus(selectedMission.booking_id, "Delivered")} className="w-full py-5 bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl active:scale-95">Confirm Delivery</button>
                      )}
                      {selectedMission.status === "Delivered" && (
                        <div className="w-full py-5 bg-gray-100 text-gray-400 text-center rounded-2xl font-black uppercase tracking-widest text-sm italic">Mission Archive Closed</div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PilotDashboard;