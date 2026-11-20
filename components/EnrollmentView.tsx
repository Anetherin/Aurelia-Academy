
import React, { useState } from 'react';
import { Student, Facility, GameSettings } from '../types';
import { generateStudent } from '../services/geminiService';
import { UserCheck, X, Search, Users, ChevronRight, Check, AlertCircle, Info, ChevronDown, Download, Terminal } from 'lucide-react';

interface Props {
  applicants: Student[];
  onFinish: (selectedStudents: Student[]) => void;
  facilities: Record<string, Facility>;
  settings: GameSettings;
  assetMap: Record<string, string[]>;
  currentStudentCount: number;
}

const EnrollmentView: React.FC<Props> = ({ applicants: initialApplicants, onFinish, facilities, settings, assetMap, currentStudentCount }) => {
  const [applicants, setApplicants] = useState<Student[]>(initialApplicants);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showImport, setShowImport] = useState(false);
  const [importData, setImportData] = useState("");
  const [importError, setImportError] = useState("");
  
  const maxCap = facilities.dorms.capacity || 4;
  const remainingSlots = maxCap - currentStudentCount;

  const toggleSelection = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      if (newSet.size < remainingSlots) {
        newSet.add(id);
      }
    }
    setSelectedIds(newSet);
  };

  const handleImport = async () => {
    try {
      const data = JSON.parse(importData);
      if (!data.name || !data.physicalStats) throw new Error("Invalid Dossier Format");

      // Generate a fresh student with game stats but override with dossier info
      const baseStudent = await generateStudent(25) as Student;
      const importedStudent: Student = {
        ...baseStudent,
        ...data,
        id: Math.random().toString(36).substr(2, 9), // Fresh ID
        // Ensure certain things stay "fresh" for balance
        arousal: 10 + Math.floor(Math.random() * 40),
        fatigue: 0,
        depravity: 0,
        year: 1,
      };

      setApplicants(prev => [importedStudent, ...prev]);
      setShowImport(false);
      setImportData("");
      setImportError("");
    } catch (e: any) {
      setImportError("Error decrypting dossier: " + e.message);
    }
  };

  const handleFinalize = () => {
    const selectedStudents = applicants.filter(a => selectedIds.has(a.id));
    onFinish(selectedStudents);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col p-6 lg:p-12 overflow-hidden">
      <header className="max-w-6xl mx-auto w-full mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-5xl font-serif font-bold italic text-white mb-2">Admissions Queue</h2>
          <div className="flex items-center gap-4">
            <p className="text-slate-500 uppercase tracking-[0.4em] text-[10px] font-bold">Cycle Review // Academy Capacity: {maxCap}</p>
            <button 
              onClick={() => setShowImport(true)}
              className="flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-indigo-500/20 transition-all"
            >
              <Download size={12} /> Import External Dossier
            </button>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="bg-slate-900 border border-slate-800 px-10 py-5 rounded-[2.5rem] text-right">
             <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Contract Status</p>
             <p className="text-3xl font-mono font-bold text-white">
               <span className={selectedIds.size > 0 ? 'text-emerald-400' : 'text-white'}>{currentStudentCount + selectedIds.size}</span> 
               <span className="text-slate-700 mx-3">/</span> 
               {maxCap}
             </p>
          </div>
          <button 
            onClick={handleFinalize}
            className="bg-white hover:bg-indigo-100 text-slate-950 px-12 py-6 rounded-[2.5rem] font-bold shadow-2xl transition-all text-xl"
          >
            Finalize Cycle
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto w-full flex-1 overflow-y-auto pr-4 space-y-4 scrollbar-hide pb-20">
        {applicants.map((app, idx) => {
          const isSelected = selectedIds.has(app.id);
          const isExpanded = expandedIdx === idx;
          
          return (
            <div 
              key={app.id} 
              className={`bg-slate-900 border transition-all rounded-[2.5rem] overflow-hidden ${
                isExpanded ? 'border-indigo-500 ring-4 ring-indigo-500/10' : 'border-slate-800 hover:border-slate-700'
              } ${isSelected ? 'bg-emerald-950/20' : ''}`}
            >
              {/* Header Bar */}
              <div 
                onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                className="p-6 flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${
                    isSelected ? 'bg-emerald-500 border-emerald-300 text-white' : 'bg-slate-950 border-slate-800 text-slate-600'
                  }`}>
                    {isSelected ? <Check size={28} /> : <span className="text-2xl font-serif italic">{app.name.charAt(0)}</span>}
                  </div>
                  <div>
                    <h3 className="text-xl font-serif font-bold text-white italic group-hover:text-indigo-400 transition-colors">{app.name}</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">{app.major} Candidate</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                   <div className="hidden md:flex flex-wrap gap-2">
                     {app.traits.slice(0, 2).map(t => (
                       <span key={t} className="text-[9px] font-bold px-3 py-1 bg-slate-800 text-slate-400 rounded-lg uppercase tracking-widest">{t}</span>
                     ))}
                   </div>
                   <button 
                     onClick={(e) => toggleSelection(app.id, e)}
                     disabled={!isSelected && selectedIds.size >= remainingSlots}
                     className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${
                       isSelected 
                         ? 'bg-emerald-600 border-emerald-400 text-white' 
                         : 'bg-slate-950 border-slate-800 text-slate-700 hover:text-emerald-400 hover:border-emerald-500'
                     } disabled:opacity-20`}
                   >
                     <UserCheck size={24} />
                   </button>
                   <ChevronDown size={20} className={`text-slate-700 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-indigo-400' : ''}`} />
                </div>
              </div>

              {/* Expanded Dossier */}
              {isExpanded && (
                <div className="px-10 pb-10 pt-4 border-t border-slate-800 animate-in slide-in-from-top-4 duration-300">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-4 space-y-8">
                      <div>
                         <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-4">Subject Profile</h4>
                         <p className="text-slate-300 font-serif italic text-lg leading-relaxed">"{app.description}"</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                         {app.traits.map(t => (
                           <span key={t} className="bg-indigo-600/10 border border-indigo-500/20 text-indigo-300 px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest">{t}</span>
                         ))}
                      </div>
                    </div>

                    <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800">
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Physical Stats</h4>
                          <div className="grid grid-cols-2 gap-y-4 gap-x-10">
                            {[
                              { l: 'Bust', v: app.physicalStats.bust },
                              { l: 'Hips', v: app.physicalStats.hips },
                              { l: 'Height', v: app.physicalStats.height },
                              { l: 'Eyes', v: app.physicalStats.eyeColor },
                              { l: 'Hair', v: app.physicalStats.hairColor },
                              { l: 'Age', v: app.age },
                            ].map(s => (
                              <div key={s.l} className="flex justify-between border-b border-slate-800 pb-2">
                                <span className="text-[9px] text-slate-600 font-bold uppercase">{s.l}</span>
                                <span className="text-xs font-mono text-slate-200">{s.v}</span>
                              </div>
                            ))}
                          </div>
                       </div>
                       <div className="flex flex-col justify-center">
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Medical & Physiological Notes</h4>
                          <p className="text-sm text-slate-400 italic leading-relaxed">{app.physicalDescription}</p>
                       </div>
                    </div>
                  </div>

                  <div className="mt-10 flex gap-4">
                     <button 
                       onClick={() => toggleSelection(app.id)}
                       disabled={!isSelected && selectedIds.size >= remainingSlots}
                       className={`flex-1 py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${
                         isSelected 
                          ? 'bg-rose-900/40 text-rose-400 border border-rose-800 hover:bg-rose-800/60' 
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white disabled:bg-slate-800 disabled:text-slate-600'
                       }`}
                     >
                       {isSelected ? <><AlertCircle size={20}/> Revoke Contract</> : <><UserCheck size={20}/> Authorize Enrollment</>}
                     </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-8 bg-slate-950/90 backdrop-blur-md">
          <div className="max-w-2xl w-full bg-slate-900 border border-indigo-500/30 rounded-[3rem] p-10 shadow-2xl relative">
            <button onClick={() => setShowImport(false)} className="absolute top-8 right-8 text-slate-500 hover:text-white"><X size={24}/></button>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-indigo-600/20 rounded-2xl text-indigo-400"><Terminal size={32}/></div>
              <div>
                <h2 className="text-3xl font-serif font-bold italic text-white">External Dossier Uplink</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Paste secure student record below</p>
              </div>
            </div>

            <textarea 
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="Paste Dossier JSON here..."
              className="w-full h-64 bg-slate-950 border border-slate-800 rounded-2xl p-6 font-mono text-xs text-indigo-300 outline-none focus:border-indigo-500 transition-all mb-6 resize-none"
            />

            {importError && (
              <p className="text-rose-500 text-[10px] font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                <AlertCircle size={14}/> {importError}
              </p>
            )}

            <div className="flex gap-4">
              <button 
                onClick={handleImport}
                className="flex-1 py-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-[2rem] shadow-xl transition-all"
              >
                Establish Uplink & Add to Queue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrollmentView;
