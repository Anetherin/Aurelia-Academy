
import React, { useState } from 'react';
import { User, Shield, GraduationCap, Briefcase, Crown, ArrowRight } from 'lucide-react';
import { Principal, Aptitudes } from '../types';
import { BACKGROUNDS } from '../constants';

interface Props {
  onComplete: (principal: Principal) => void;
}

const DirectorSetup: React.FC<Props> = ({ onComplete }) => {
  const [name, setName] = useState("");
  const [selectedBg, setSelectedBg] = useState(BACKGROUNDS[0]);

  const handleFinish = () => {
    if (!name.trim()) return;

    const baseAptitudes: Aptitudes = { 
      intelligence: 40, 
      physicality: 30, 
      social: 45, 
      libido: 50 
    };

    // Apply background adjustments
    if (selectedBg.id === 'academic') baseAptitudes.intelligence += 15;
    if (selectedBg.id === 'fixer') baseAptitudes.physicality += 15;
    if (selectedBg.id === 'noble') baseAptitudes.social += 15;

    onComplete({
      name,
      background: selectedBg.name,
      traits: selectedBg.traits,
      aptitudes: baseAptitudes,
      activeRole: 'None',
      energy: 100,
      maxEnergy: 100
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 bg-slate-900 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-700">
        
        <div className="p-12 bg-indigo-600/5 border-r border-slate-800 flex flex-col justify-center">
          <h1 className="text-5xl font-serif font-bold text-white mb-6 italic">The Director</h1>
          <p className="text-slate-400 leading-relaxed mb-10 text-lg">
            Aurelia Academy requires a firm hand and a sharp mind. Define your persona before assuming control of the dossiers.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-indigo-300">
              <div className="p-3 bg-indigo-500/10 rounded-2xl"><Shield size={20} /></div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Security & Discipline</p>
                <p className="text-sm font-medium">Maintain order among the elite.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-amber-300">
              <div className="p-3 bg-amber-500/10 rounded-2xl"><Crown size={20} /></div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Social Standing</p>
                <p className="text-sm font-medium">Navigate the city's high society.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-12 bg-slate-900 flex flex-col">
          <div className="space-y-8 flex-1">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 ml-1">Legal Identity</label>
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Director Surname"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-5 px-6 text-lg outline-none focus:border-indigo-500 transition-all text-white font-serif italic"
                />
                <User className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-700" size={20} />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 ml-1">Professional Origin</label>
              <div className="grid grid-cols-1 gap-3">
                {BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => setSelectedBg(bg)}
                    className={`w-full text-left p-5 rounded-2xl border transition-all flex items-center gap-5 ${
                      selectedBg.id === bg.id 
                        ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-600/20' 
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className={`p-3 rounded-xl ${selectedBg.id === bg.id ? 'bg-white/10' : 'bg-slate-800'}`}>
                      {bg.id === 'academic' && <GraduationCap size={20} />}
                      {bg.id === 'fixer' && <Shield size={20} />}
                      {bg.id === 'noble' && <Briefcase size={20} />}
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold ${selectedBg.id === bg.id ? 'text-white' : 'text-slate-200'}`}>{bg.name}</h4>
                      <p className={`text-[10px] leading-tight mt-1 ${selectedBg.id === bg.id ? 'text-indigo-100' : 'text-slate-500'}`}>{bg.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button 
            onClick={handleFinish}
            disabled={!name.trim()}
            className="mt-10 w-full py-6 bg-white hover:bg-slate-200 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold rounded-3xl transition-all shadow-2xl flex items-center justify-center gap-2 group"
          >
            Assume Command <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default DirectorSetup;
