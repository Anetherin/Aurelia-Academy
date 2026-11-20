
import React, { useState } from 'react';
import { Student } from '../types';
import { X, Heart, Zap, Flame, Sparkles, Mic2, GraduationCap, Info, Ruler, Dumbbell, BookOpen, Users, Share2, Check, Shield, Fingerprint, Activity } from 'lucide-react';

interface Props {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  currentImage: string;
}

const StudentDetailModal: React.FC<Props> = ({ student, isOpen, onClose, currentImage }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const exportDossier = () => {
    const dossier = {
      name: student.name,
      folderName: student.folderName,
      age: student.age,
      description: student.description,
      physicalDescription: student.physicalDescription,
      physicalStats: student.physicalStats,
      traits: student.traits,
    };
    navigator.clipboard.writeText(JSON.stringify(dossier, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const MiniStat = ({ label, value, color }: { label: string, value: number, color: string }) => (
    <div className="bg-slate-950/40 border border-white/5 p-3 rounded-xl">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
        <span className="text-[10px] font-mono font-bold text-slate-300">{Math.round(value)}</span>
      </div>
      <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-1000`} 
          style={{ width: `${Math.min(100, value)}%` }} 
        />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/98 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-7xl h-[90vh] bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Section: Visual Identity (Sticky) */}
        <div className="w-full md:w-[40%] h-64 md:h-full relative shrink-0 border-b md:border-b-0 md:border-r border-white/10 bg-black">
          <img 
            src={currentImage} 
            alt={student.name}
            className="w-full h-full object-cover opacity-80"
          />
          {/* Scanline Effect Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_4px,3px_100%] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-slate-900/20" />
          
          <div className="absolute top-8 left-8 flex flex-col gap-3">
             <div className="bg-indigo-600/20 backdrop-blur-md border border-indigo-500/30 text-indigo-400 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
               <Fingerprint size={12}/> Biometric Lock Active
             </div>
          </div>

          <div className="absolute bottom-10 left-10 right-10">
            <h2 className="text-5xl font-serif font-bold italic text-white mb-2 tracking-tight">{student.name}</h2>
            <div className="flex items-center gap-4 text-indigo-400 text-[10px] font-bold uppercase tracking-[0.4em]">
              <span>{student.major} Division</span>
              <span className="text-slate-700">|</span>
              <span>Year {student.year}</span>
            </div>
          </div>
        </div>

        {/* Right Section: Executive Data (Scrollable) */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-900/50">
          {/* Top Bar */}
          <div className="h-20 border-b border-white/5 flex items-center justify-between px-10 shrink-0 bg-slate-900/80 backdrop-blur-md z-10">
            <div className="flex items-center gap-6">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.5em]">Dossier Revision: 4.02.1</span>
              <div className="h-4 w-px bg-slate-800" />
              <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400">
                <Activity size={12} className="animate-pulse" /> System Nominal
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-3 bg-slate-800 hover:bg-rose-600 text-white rounded-xl transition-all border border-white/5 shadow-lg"
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable Document */}
          <div className="flex-1 overflow-y-auto p-10 space-y-12 scrollbar-hide pb-32">
            
            {/* Row 1: Status & Traits */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                 <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.4em] flex items-center gap-2">
                   <Shield size={14}/> Psychological Profile
                 </h4>
                 <div className="bg-slate-950/40 border border-white/5 p-8 rounded-3xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><GraduationCap size={80}/></div>
                    <p className="text-slate-300 font-serif italic text-xl leading-relaxed relative z-10">
                      "{student.description}"
                    </p>
                    <div className="mt-8 flex flex-wrap gap-2">
                      {student.traits.map(t => (
                        <span key={t} className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-xl text-[10px] font-bold uppercase tracking-widest">{t}</span>
                      ))}
                    </div>
                 </div>
              </div>
              <div className="space-y-6">
                <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.4em] flex items-center gap-2">
                   <Zap size={14}/> Operational Status
                 </h4>
                 <div className="grid grid-cols-1 gap-3">
                   <MiniStat label="System Energy" value={100-student.fatigue} color="bg-amber-400" />
                   <MiniStat label="Emotional Heat" value={student.arousal} color="bg-rose-500" />
                   <MiniStat label="Authority Compliance" value={student.skills.compliance} color="bg-indigo-400" />
                 </div>
              </div>
            </div>

            {/* Row 2: Behavioral & Service Metrics */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
               <section className="space-y-8">
                  <div className="flex justify-between items-end border-b border-white/5 pb-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">Core Competencies</h4>
                    <span className="text-[8px] font-mono text-slate-600">Institutional Training Data</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <MiniStat label="Knowledge" value={student.skills.knowledge} color="bg-indigo-400" />
                    <MiniStat label="Socialite" value={student.skills.etiquette} color="bg-cyan-400" />
                    <MiniStat label="Fitness" value={student.skills.fitness} color="bg-emerald-400" />
                    <MiniStat label="Rhetoric" value={student.skills.conversation} color="bg-amber-400" />
                    <MiniStat label="Rhythm" value={(student.skills.singing + student.skills.dancing)/2} color="bg-purple-400" />
                    <MiniStat label="Defense" value={student.skills.security} color="bg-slate-400" />
                  </div>
               </section>

               <section className="space-y-8">
                  <div className="flex justify-between items-end border-b border-white/5 pb-4">
                    <h4 className="text-[10px] font-bold text-rose-400 uppercase tracking-[0.4em]">Specialized Services</h4>
                    <span className="text-[8px] font-mono text-rose-900/60">Restricted Nightfall Metrics</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <MiniStat label="Seduction" value={student.skills.seduction} color="bg-rose-500" />
                    <MiniStat label="Massage" value={student.skills.massage} color="bg-pink-400" />
                    <MiniStat label="Kissing" value={student.skills.kissing} color="bg-red-400" />
                    <MiniStat label="Vaginal" value={student.skills.vaginal_service} color="bg-rose-600" />
                    <MiniStat label="Anal" value={student.skills.anal_service} color="bg-purple-600" />
                    <MiniStat label="Manual" value={student.skills.manual_service} color="bg-orange-400" />
                  </div>
               </section>
            </div>

            {/* Row 3: Physical Assessment */}
            <section className="space-y-8">
               <div className="flex justify-between items-end border-b border-white/5 pb-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">Physical Manifest</h4>
                  <span className="text-[8px] font-mono text-slate-600">Subjective Observation Log</span>
               </div>
               <div className="flex flex-col lg:flex-row gap-8">
                  <div className="flex-1 bg-slate-950/40 border border-white/5 p-8 rounded-3xl italic text-slate-400 text-sm leading-relaxed">
                    "{student.physicalDescription}"
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full lg:w-96">
                     {[
                        { l: 'Bust', v: student.physicalStats.bust },
                        { l: 'Hips', v: student.physicalStats.hips },
                        { l: 'Height', v: student.physicalStats.height },
                        { l: 'Eyes', v: student.physicalStats.eyeColor },
                        { l: 'Hair', v: student.physicalStats.hairColor },
                        { l: 'Age', v: student.age }
                     ].map(item => (
                        <div key={item.l} className="bg-slate-950/60 border border-white/5 px-4 py-3 rounded-xl text-center">
                           <p className="text-[7px] font-bold text-slate-600 uppercase tracking-widest mb-1">{item.l}</p>
                           <p className="text-xs font-mono text-slate-200">{item.v}</p>
                        </div>
                     ))}
                  </div>
               </div>
            </section>
          </div>

          {/* Floating Action Bar */}
          <div className="absolute bottom-10 right-10 flex gap-4">
             <button 
                onClick={exportDossier}
                className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all shadow-2xl border border-white/10 backdrop-blur-md ${
                  copied ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-indigo-600 text-indigo-300 hover:text-white'
                }`}
              >
                {copied ? <><Check size={16}/> Dossier Exported</> : <><Share2 size={16}/> Export Dossier</>}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailModal;
