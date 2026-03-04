import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PilotRegistration = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', address: '',
    govId: '', licenseId: '', droneType: 'Aircab Alpha (Agri)',
    experience: '', docs: null
  });

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = (e) => setFormData({ ...formData, docs: e.target.files[0] });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API Submission
    setTimeout(() => {
      setLoading(false);
      alert("Application Submitted. Our flight safety team will review your credentials within 24 hours.");
      navigate('/pilot');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111] font-sans pb-32 pt-28 selection:bg-black selection:text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .form-input { background: #F3F4F6; border: 2px solid transparent; border-radius: 14px; width: 100%; padding: 14px; outline: none; font-weight: 600; transition: 0.3s; }
        .form-input:focus { border-color: #000; background: #fff; }
        .step-bubble { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; transition: 0.4s; }
      `}</style>

      <div className="max-w-2xl mx-auto px-6">
        {/* Header */}
        <header className="text-center mb-12">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-3 block">Operator Enrollment // 2026</span>
          <h1 className="text-4xl font-black tracking-tighter uppercase text-black">Pilot Verification</h1>
          <p className="text-gray-400 text-sm mt-2 font-medium uppercase tracking-widest">Join the Aircab Black Elite Fleet</p>
        </header>

        {/* Progress Tracker */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <div className={`step-bubble ${step >= 1 ? 'bg-black text-white' : 'bg-gray-200 text-gray-400'}`}>01</div>
          <div className="w-12 h-px bg-gray-200"></div>
          <div className={`step-bubble ${step >= 2 ? 'bg-black text-white' : 'bg-gray-200 text-gray-400'}`}>02</div>
          <div className="w-12 h-px bg-gray-200"></div>
          <div className={`step-bubble ${step >= 3 ? 'bg-black text-white' : 'bg-gray-200 text-gray-400'}`}>03</div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* STEP 1: PERSONAL INTEL */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Personal Intel</h3>
                <input required name="name" placeholder="FULL NAME" className="form-input" onChange={handleInputChange} />
                <input required name="phone" type="tel" placeholder="PHONE NUMBER" className="form-input" onChange={handleInputChange} />
                <input required name="email" type="email" placeholder="EMAIL ADDRESS" className="form-input" onChange={handleInputChange} />
                <textarea name="address" placeholder="CITY / PERMANENT ADDRESS" className="form-input h-28" onChange={handleInputChange}></textarea>
                <button type="button" onClick={() => setStep(2)} className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs mt-4">Next: Credentials</button>
              </div>
            )}

            {/* STEP 2: CREDENTIALS & HARDWARE */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Professional Specs</h3>
                <input required name="govId" placeholder="GOVERNMENT ID (AADHAR/PASSPORT)" className="form-input" onChange={handleInputChange} />
                <input required name="licenseId" placeholder="DGCA CERTIFICATION ID" className="form-input" onChange={handleInputChange} />
                <div className="grid grid-cols-2 gap-4">
                  <select name="droneType" className="form-input appearance-none" onChange={handleInputChange}>
                    <option>Aircab Alpha (Agri)</option>
                    <option>Aircab Spectre (Cargo)</option>
                    <option>Custom VTOL</option>
                  </select>
                  <input required name="experience" type="number" placeholder="EXP (YEARS)" className="form-input" onChange={handleInputChange} />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 py-5 bg-gray-100 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-xs">Back</button>
                  <button type="button" onClick={() => setStep(3)} className="flex-[2] py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs">Next: Documents</button>
                </div>
              </div>
            )}

            {/* STEP 3: DOCUMENT UPLOAD */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Security Validation</h3>
                <div className="border-2 border-dashed border-gray-200 rounded-3xl p-10 text-center hover:border-black transition-colors group cursor-pointer relative">
                  <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
                  <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">📄</span>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Upload PDF/JPG (License & ID)</p>
                  <p className="text-[9px] text-gray-300 mt-1 italic">Maximum file size: 10MB</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <p className="text-[9px] text-blue-600 font-bold leading-relaxed uppercase tracking-widest">
                    ℹ️ Warning: Providing false aviation credentials results in permanent blacklisting and legal action per DGCA regulations.
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setStep(2)} className="flex-1 py-5 bg-gray-100 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-xs">Back</button>
                  <button disabled={loading} type="submit" className="flex-[2] py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">
                    {loading ? "AUTHENTICATING..." : "Submit Application"}
                  </button>
                </div>
              </div>
            )}

          </form>
        </div>
      </div>
    </div>
  );
};

export default PilotRegistration;