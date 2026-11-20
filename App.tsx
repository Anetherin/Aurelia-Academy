
import React, { useState, useCallback, useEffect } from 'react';
import { 
  GameState, TimeOfDay, Student, Major, ClubRole, Facility, GamePhase, Reputation, Skills, ClassType, LogEntry, Principal
} from './types';
import { 
  INITIAL_DEBT, DAYS_PER_YEAR, getRank, ROLE_BONUSES, INITIAL_FACILITIES, SEMESTER_DAYS, BACKGROUNDS, DORM_CAPACITY, MAJOR_SKILLS, ROLE_UNLOCKS, INTEREST_RATE_WEEKLY, CLASS_SKILLS
} from './constants';
import { generateStudent, getLocalPeriodFlavor, generateNightVisitNarrative } from './services/geminiService';
import { crawlDropbox } from './services/dropboxService';
import { calculateServiceResult } from './logic/serviceNarratives';
import { getTimeActionLabel, processTimeTick } from './logic/gameLogic';
import StudentCard from './components/StudentCard';
import DropboxConnect from './components/DropboxConnect';
import DirectorSetup from './components/DirectorSetup';
import EnrollmentView from './components/EnrollmentView';
import StudentDetailModal from './components/StudentDetailModal';
import { 
  Users, School, TrendingUp, Zap, Star, Search, Wallet, Settings as SettingsIcon, Eye, Briefcase, ChevronDown, User, Brain, Handshake, Sparkles, Clock, LayoutDashboard
} from 'lucide-react';

type ExtendedPhase = GamePhase | 'setup_dropbox' | 'setup_director';

const PRINCIPAL_ACTIONS = [
  { id: 'rest', name: 'Director\'s Recess', energy: -35, effect: 'Significant energy recovery at the cost of oversight.' },
  { id: 'hall_walk', name: 'Walking the Halls', energy: 15, effect: 'Ensures discipline while stoking a feverish, obsessive desire (Lust) among students.' },
  { id: 'lead_seminar', name: 'Lead Academic Seminar', energy: 40, effect: 'Massive Skill Gains for all students.' },
  { id: 'city_work', name: 'City Consulting', energy: 45, effect: 'Earn substantial personal funds off-site to clear academy debts.' },
  { id: 'personal_counseling', name: 'Targeted Counseling', energy: 25, effect: 'Fatigue reduction and Compliance boost for one.' },
  { id: 'vip_filtering', name: 'VIP Filtering', energy: 25, effect: 'Higher tip quality during Evening operations.' },
  { id: 'intimate_guidance', name: 'Intimate Guidance', energy: 50, effect: 'Major Lust and Compliance gain for one student.' },
];

const App: React.FC = () => {
  const [gameState, setGameState] = useState<Omit<GameState, 'phase'> & { phase: ExtendedPhase }>({
    phase: 'setup_dropbox',
    day: 1,
    year: 1,
    time: TimeOfDay.Morning,
    debt: INITIAL_DEBT,
    funds: 12000,
    students: [],
    applicants: [],
    facilities: INITIAL_FACILITIES,
    principal: {
      name: "",
      background: "",
      traits: [],
      aptitudes: { intelligence: 35, physicality: 20, social: 40, libido: 50 },
      activeRole: 'None',
      energy: 100,
      maxEnergy: 100
    },
    reputation: {
      academic: 10,
      refinement: 10,
      infamy: 0
    },
    settings: {
      useCustomAssets: false,
      assetBaseUrl: '/Aurelia Academy', 
      dropboxToken: '', 
      isDriveMode: false
    },
    assetMap: {},
    isGameOver: false,
    history: []
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingNarrative, setIsGeneratingNarrative] = useState(false);
  const [view, setView] = useState<'students' | 'facilities' | 'principal' | 'settings'>('students');
  const [history, setHistory] = useState<LogEntry[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<string>('rest');
  
  // Modal State
  const [detailStudent, setDetailStudent] = useState<{ s: Student, img: string } | null>(null);

  const log = useCallback((msg: string, type: LogEntry['type'] = 'info') => {
    const timestamp = `[D${gameState.day} ${gameState.time.charAt(0)}]`;
    setHistory(prev => [{ text: msg, type, timestamp }, ...prev].slice(0, 300));
  }, [gameState.day, gameState.time]);

  const syncDropboxAssets = async () => {
    if (!gameState.settings.dropboxToken) return;
    setIsLoading(true);
    try {
      const newMap = await crawlDropbox(gameState.settings.dropboxToken, gameState.settings.assetBaseUrl);
      const count = Object.values(newMap).reduce((acc, curr) => acc + curr.length, 0);
      setGameState(prev => ({ 
        ...prev, 
        assetMap: newMap, 
        settings: { ...prev.settings, useCustomAssets: count > 0 }
      }));
      log(`DROPBOX: Linked ${count} assets from the cloud archives.`, 'success');
    } catch (e: any) {
      log(`DROPBOX ERROR: ${e.message}`, 'error');
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const initEnrollment = async () => {
    setIsLoading(true);
    try {
      const results = await Promise.all(Array.from({ length: 12 }, () => generateStudent(25)));
      const applicants = results.filter(s => s !== null) as Student[];
      setGameState(prev => ({ ...prev, applicants, phase: 'enrollment' }));
    } catch (e) {
      log("Admissions system disruption.", 'error');
    } finally { setIsLoading(false); }
  };

  const finalizeEnrollment = (selectedStudents: Student[]) => {
    setGameState(prev => ({
      ...prev,
      students: [...prev.students, ...selectedStudents],
      applicants: [],
      phase: 'active'
    }));
    log(`ENROLLMENT: ${selectedStudents.length} new students signed their academy contracts.`, 'success');
  };

  const advanceTime = async () => {
    setIsLoading(true);
    
    // Logic update: Persist selection unless insufficient energy
    const protocolData = PRINCIPAL_ACTIONS.find(a => a.id === selectedProtocol);
    const cost = protocolData?.energy || 0;
    
    let effectiveProtocol = selectedProtocol;
    if (gameState.principal.energy < cost && selectedProtocol !== 'rest') {
      effectiveProtocol = 'rest';
      setSelectedProtocol('rest'); // Revert UI selection
      log(`DIRECTOR: Insufficient energy for "${protocolData?.name}". Forced to take a recess.`, "warning");
    }

    try {
      const res = await processTimeTick(
        gameState as GameState, 
        effectiveProtocol, 
        PRINCIPAL_ACTIONS, 
        generateNightVisitNarrative
      );

      setGameState(prev => ({
        ...prev,
        time: res.nextTime,
        day: res.nextDay,
        funds: Math.floor(prev.funds + res.totalIncome),
        students: res.updatedStudents,
        reputation: {
          academic: Math.min(100, Math.max(0, prev.reputation.academic + res.acadDelta - 0.05)),
          refinement: Math.min(100, Math.max(0, prev.reputation.refinement + res.refinDelta - 0.05)),
          infamy: Math.min(100, Math.max(0, prev.reputation.infamy - 0.06))
        },
        principal: {
          ...prev.principal,
          energy: Math.min(prev.principal.maxEnergy, Math.max(0, prev.principal.energy - (PRINCIPAL_ACTIONS.find(a => a.id === effectiveProtocol)?.energy || 0)))
        }
      }));

      // Selection remains as the user intended for the next turn, unless it was forced to rest above.

      res.periodLogs.forEach(entry => log(entry.text, entry.type));
    } catch (e) {
      log("Critical system fault during time progression.", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const upgradeFacility = (id: string) => {
    const f = gameState.facilities[id];
    if (gameState.funds >= f.upgradeCost && f.level < f.maxLevel) {
      setGameState(prev => ({
        ...prev,
        funds: prev.funds - f.upgradeCost,
        facilities: {
          ...prev.facilities,
          [id]: { ...f, level: f.level + 1, upgradeCost: Math.floor(f.upgradeCost * 2.8), capacity: id === 'dorms' ? DORM_CAPACITY[f.level + 1] : f.capacity }
        }
      }));
      log(`LOGISTICS: ${f.name} upgraded to Tier ${f.level + 1}.`, 'success');
    }
  };

  if (gameState.phase === 'setup_dropbox') {
    return (
      <DropboxConnect 
        settings={gameState.settings}
        onUpdateSettings={(s) => setGameState(p => ({ ...p, settings: s }))}
        onSync={syncDropboxAssets}
        onComplete={() => setGameState(p => ({ ...p, phase: 'setup_director' }))}
        isLoading={isLoading}
      />
    );
  }

  if (gameState.phase === 'setup_director') {
    return (
      <DirectorSetup 
        onComplete={(principal) => {
          setGameState(p => ({ ...p, principal }));
          initEnrollment();
        }}
      />
    );
  }

  if (gameState.phase === 'enrollment') {
    return (
      <EnrollmentView 
        applicants={gameState.applicants}
        onFinish={finalizeEnrollment}
        facilities={gameState.facilities}
        settings={gameState.settings}
        assetMap={gameState.assetMap}
        currentStudentCount={gameState.students.length}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-950 text-slate-200">
      <aside className="w-full lg:w-96 bg-slate-900 border-r border-slate-800 p-8 flex flex-col shadow-2xl z-20">
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-serif font-bold text-indigo-400 italic tracking-tighter">Aurelia</h1>
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-[0.4em] mt-2">Academy Executive Terminal</p>
        </div>
        
        <div className="space-y-6 mb-10">
          <div className="bg-slate-950 p-6 rounded-[2rem] border border-slate-800 shadow-inner">
            <div className="flex justify-between text-[11px] text-indigo-400 mb-3 uppercase tracking-widest font-bold">
              <span>Semester Day {gameState.day}</span>
              <span className="font-mono bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">{gameState.time}</span>
            </div>
            <div className="text-2xl font-bold text-white font-serif italic">Year 0{gameState.year} <span className="text-slate-700 font-sans not-italic mx-2">//</span> <span className="text-sm font-sans not-italic text-slate-400">Term 01</span></div>
          </div>
          
          <button 
            onClick={() => setView('principal')}
            className={`w-full bg-slate-950 border p-6 rounded-[2rem] transition-all group ${view === 'principal' ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-800 hover:border-slate-700'}`}
          >
             <div className="flex justify-between items-center mb-3">
               <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest flex items-center gap-2">
                 <Zap size={14} className="text-amber-400 group-hover:animate-pulse"/> Director Stamina
               </span>
               <span className="text-xs font-mono font-bold text-indigo-200">{Math.round(gameState.principal.energy)}%</span>
             </div>
             <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden mb-4">
                <div className={`h-full transition-all duration-1000 ${gameState.principal.energy > 50 ? 'bg-indigo-500' : 'bg-rose-500'}`} style={{ width: `${gameState.principal.energy}%` }} />
             </div>
             <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
               <User size={14} className="text-indigo-500"/> Director {gameState.principal.name}
             </div>
          </button>
        </div>
        
        <nav className="flex-1 space-y-2 overflow-y-auto pr-2 scrollbar-hide">
          <button onClick={() => setView('students')} className={`w-full flex items-center justify-between px-6 py-5 rounded-2xl transition-all ${view === 'students' ? 'bg-indigo-600 text-white shadow-xl translate-x-1' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
            <div className="flex items-center gap-4"><Users size={20}/> <span className="text-sm font-bold uppercase tracking-widest">Students</span></div>
            <span className="text-[10px] font-mono opacity-60">[{gameState.students.length}]</span>
          </button>
          <button onClick={() => setView('facilities')} className={`w-full flex items-center justify-between px-6 py-5 rounded-2xl transition-all ${view === 'facilities' ? 'bg-indigo-600 text-white shadow-xl translate-x-1' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
            <div className="flex items-center gap-4"><School size={20}/> <span className="text-sm font-bold uppercase tracking-widest">Facilities</span></div>
            <span className="text-[10px] font-mono opacity-60">[{Object.keys(gameState.facilities).length}]</span>
          </button>
          <button onClick={() => setView('principal')} className={`w-full flex items-center justify-between px-6 py-5 rounded-2xl transition-all ${view === 'principal' ? 'bg-indigo-600 text-white shadow-xl translate-x-1' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
            <div className="flex items-center gap-4"><LayoutDashboard size={20}/> <span className="text-sm font-bold uppercase tracking-widest">Dashboard</span></div>
          </button>
          
          <div className="mt-10 p-6 bg-slate-950 rounded-[2.5rem] border border-indigo-500/10">
             <h4 className="text-[9px] font-bold text-indigo-400 uppercase tracking-[0.4em] mb-5 flex items-center gap-2"><Eye size={12}/> Executive Protocol</h4>
             <div className="relative">
                <select 
                  value={selectedProtocol}
                  onChange={(e) => setSelectedProtocol(e.target.value)}
                  className="w-full appearance-none bg-slate-900 border border-slate-800 text-[11px] font-bold py-5 pl-6 pr-10 rounded-2xl text-slate-100 outline-none focus:border-indigo-500 transition-colors"
                >
                  {PRINCIPAL_ACTIONS.map(act => (
                    <option key={act.id} value={act.id}>{act.name} ({act.energy > 0 ? '-' : '+'}{Math.abs(act.energy)}E)</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" />
             </div>
          </div>
        </nav>

        <div className="mt-auto pt-8 border-t border-slate-800">
           <div className="flex justify-between items-end mb-6 px-2">
             <div className="flex flex-col">
               <span className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.3em] mb-1">Liquid Assets</span>
               <span className={`font-mono font-bold text-2xl tracking-tighter ${gameState.funds < 0 ? 'text-rose-500' : 'text-emerald-400'}`}>${gameState.funds.toLocaleString()}</span>
             </div>
             <div className="text-right">
               <span className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.3em] mb-1">Debt Status</span>
               <p className="text-xs font-mono text-rose-500/60 font-bold">-${gameState.debt.toLocaleString()}</p>
             </div>
           </div>
           <button 
             onClick={advanceTime} 
             disabled={isLoading || isGeneratingNarrative} 
             className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-6 rounded-[2rem] flex flex-col items-center justify-center shadow-2xl active:scale-[0.97] transition-all disabled:bg-slate-800 disabled:text-slate-600 group overflow-hidden relative"
           >
             <span className="text-sm uppercase tracking-[0.2em] relative z-10">{getTimeActionLabel(gameState.time)}</span>
             <span className="text-[8px] opacity-60 mt-1 uppercase relative z-10">Shift Progression Authorized</span>
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
           </button>
        </div>
      </aside>

      <main className="flex-1 p-12 overflow-y-auto bg-slate-950">
        {view === 'principal' && (
          <div className="max-w-6xl mx-auto animate-in slide-in-from-bottom-6 duration-700">
            <h2 className="text-7xl font-serif font-bold italic mb-16 text-white leading-tight">Academy Terminal</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
               <div className="bg-slate-900 border border-slate-800 p-12 rounded-[4rem] shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 text-indigo-500/10"><Handshake size={120} /></div>
                  <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-[0.5em] mb-12 flex items-center gap-3">Institutional Ranking</h4>
                  <div className="space-y-12 relative z-10">
                     {[
                       { label: 'Academic Prestige', val: gameState.reputation.academic, color: 'bg-indigo-400', desc: 'Influences student starting skills and applicant pool.' },
                       { label: 'Social Refinement', val: gameState.reputation.refinement, color: 'bg-emerald-400', desc: 'Increases base tips from high-society patrons.' },
                       { label: 'City Infamy', val: gameState.reputation.infamy, color: 'bg-rose-500', desc: 'Higher revenue at the cost of potential security risks.' },
                     ].map(st => (
                       <div key={st.label}>
                         <div className="flex justify-between items-end mb-3">
                           <div>
                             <span className="text-sm font-bold text-slate-100 block">{st.label}</span>
                             <span className="text-[10px] text-slate-500 italic">{st.desc}</span>
                           </div>
                           <span className="text-sm font-mono font-bold text-white">{Math.round(st.val)}%</span>
                         </div>
                         <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden shadow-inner"><div className={`h-full transition-all duration-1000 ${st.color}`} style={{ width: `${st.val}%` }}></div></div>
                       </div>
                     ))}
                  </div>
               </div>
               <div className="bg-slate-900 border border-slate-800 p-12 rounded-[4rem] shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 text-indigo-500/10"><Brain size={120} /></div>
                  <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-[0.5em] mb-12 flex items-center gap-3">Director Competencies</h4>
                  <div className="space-y-10 relative z-10">
                     {Object.entries(gameState.principal.aptitudes).map(([k, v]) => (
                       <div key={k}>
                         <div className="flex justify-between items-center mb-3"><span className="text-sm font-bold text-slate-100 capitalize">{k}</span><span className="text-sm font-mono font-bold text-indigo-300">{v}</span></div>
                         <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-indigo-500/80 transition-all duration-1000" style={{ width: `${v}%` }}></div></div>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        )}

        {view === 'students' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-10 animate-in fade-in duration-700">
            {gameState.students.map(s => (
              <StudentCard 
                key={s.id} 
                student={s} 
                settings={gameState.settings} 
                assetMap={gameState.assetMap} 
                time={gameState.time} 
                onUpdateRole={(id, role) => setGameState(prev => ({ ...prev, students: prev.students.map(s => s.id === id ? { ...s, clubRole: role } : s) }))} 
                onUpdateFocus={(id, focus) => setGameState(prev => ({ ...prev, students: prev.students.map(s => s.id === id ? { ...s, classFocus: focus } : s) }))} 
                onViewDetails={(student, img) => setDetailStudent({ s: student, img })} 
                facilities={gameState.facilities} 
              />
            ))}
          </div>
        )}

        {view === 'facilities' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-in fade-in duration-700 max-w-6xl mx-auto">
            {(Object.values(gameState.facilities) as Facility[]).map(f => (
              <div key={f.id} className="bg-slate-900 border border-slate-800 p-12 rounded-[4rem] shadow-2xl group hover:border-indigo-500/40 transition-all flex flex-col">
                <div className="flex justify-between items-start mb-6">
                   <h3 className="text-4xl font-serif font-bold text-slate-100 italic">{f.name}</h3>
                   <span className="text-[10px] bg-indigo-600/20 text-indigo-300 px-5 py-2 rounded-full uppercase font-bold tracking-[0.3em] border border-indigo-500/20">Tier 0{f.level}</span>
                </div>
                <p className="text-base text-slate-400 italic mb-12 leading-relaxed flex-1">"{f.effect}"</p>
                <button 
                  onClick={() => upgradeFacility(f.id)} 
                  disabled={gameState.funds < f.upgradeCost || f.level >= f.maxLevel} 
                  className="w-full py-6 bg-slate-950 hover:bg-indigo-600 border border-slate-800 hover:border-indigo-400 disabled:bg-slate-950 disabled:text-slate-700 rounded-3xl text-xs font-bold flex justify-between px-12 transition-all shadow-inner group-hover:shadow-2xl"
                >
                  <span className="tracking-widest uppercase">Invest in Expansion</span>
                  {f.level < f.maxLevel && <span className="text-emerald-400 font-mono font-bold">${f.upgradeCost.toLocaleString()}</span>}
                </button>
              </div>
            ))}
          </div>
        )}

        {view !== 'principal' && (
          <div className="mt-24 bg-slate-900 border border-slate-800/60 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 text-indigo-500/5"><Clock size={120} /></div>
            <h3 className="text-[11px] font-bold text-indigo-400 uppercase tracking-[0.6em] mb-10 flex items-center gap-3"><Eye size={16}/> Intelligence Feed</h3>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-8 font-mono text-xs leading-relaxed scrollbar-hide relative z-10">
              {history.map((h, i) => (
                <div key={i} className={`flex gap-8 border-l-2 pl-8 py-4 transition-all hover:bg-white/5 rounded-r-2xl ${
                  h.type.includes('fail') ? 'border-rose-600 bg-rose-950/20' : 
                  h.type === 'private' ? 'border-pink-500 bg-pink-950/20' : 
                  h.type === 'success' ? 'border-emerald-500 bg-emerald-950/20' : 'border-slate-800'
                }`}>
                  <span className="text-slate-600 shrink-0 font-bold opacity-40 select-none">{h.timestamp}</span>
                  <span className={h.type === 'private' ? 'text-pink-300 italic' : h.type === 'success' ? 'text-emerald-300 font-bold' : 'text-slate-300'}>
                    {h.text}
                  </span>
                </div>
              ))}
              {history.length === 0 && (
                <div className="text-slate-700 italic py-10 text-center">No intelligence reports currently logged for this cycle.</div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {detailStudent && (
        <StudentDetailModal 
          student={detailStudent.s} 
          currentImage={detailStudent.img}
          isOpen={!!detailStudent} 
          onClose={() => setDetailStudent(null)} 
        />
      )}
    </div>
  );
};

export default App;
