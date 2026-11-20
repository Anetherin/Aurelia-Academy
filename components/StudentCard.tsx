
import React, { useState, useEffect, useRef } from 'react';
import { Student, ClubRole, Facility, GameSettings, TimeOfDay, ClassType } from '../types';
import { getRank, ROLE_UNLOCKS } from '../constants';
import { getDropboxLink } from '../services/dropboxService';
import { Sparkles, Flame, Heart, Zap, Search, Mic2 } from 'lucide-react';

interface Props {
  student: Student;
  settings: GameSettings;
  assetMap: Record<string, string[]>;
  time: TimeOfDay;
  onUpdateRole: (id: string, role: ClubRole) => void;
  onUpdateFocus: (id: string, focus: ClassType) => void;
  onViewDetails: (student: Student, currentImage: string) => void;
  facilities: Record<string, Facility>;
}

const StudentCard: React.FC<Props> = ({ student, settings, assetMap, time, onUpdateRole, onUpdateFocus, onViewDetails, facilities }) => {
  const [imgSrc, setImgSrc] = useState<string>('');
  const [isSyncingImage, setIsSyncingImage] = useState(false);
  const currentCategoryRef = useRef<string>('');

  const avgApt = (Object.values(student.aptitudes) as number[]).reduce((a, b) => (a as number) + (b as number), 0) / 4;
  const rank = getRank(avgApt);
  const energy = 100 - student.fatigue;

  const roleToCategory: Record<ClubRole, string> = {
    [ClubRole.Hostess]: 'hostess',
    [ClubRole.Bartender]: 'bar',
    [ClubRole.Security]: 'security',
    [ClubRole.Dancer]: 'dancer',
    [ClubRole.Singer]: 'singer',
    [ClubRole.Private_Service]: 'vip',
    [ClubRole.None]: 'rest'
  };

  let category = 'rest';
  if (student.lastServiceType) {
    category = student.lastServiceType;
  } else if (time === TimeOfDay.Morning || time === TimeOfDay.Afternoon) {
    category = 'class';
  } else if (time === TimeOfDay.Evening) {
    category = roleToCategory[student.clubRole];
  } else if (time === TimeOfDay.Night) {
    category = 'rest';
  }

  useEffect(() => {
    if (category === currentCategoryRef.current && imgSrc) return;
    currentCategoryRef.current = category;

    const updateImage = async () => {
      if (settings.useCustomAssets && settings.dropboxToken) {
        const studentKey = student.folderName;
        const mapKey = `${studentKey}/${category}`;
        const defaultMapKey = `default/${category}`;
        const pathCandidates = assetMap[mapKey] || assetMap[defaultMapKey] || [];
        
        if (pathCandidates.length > 0) {
          setIsSyncingImage(true);
          try {
            const randomPath = pathCandidates[Math.floor(Math.random() * pathCandidates.length)];
            const link = await getDropboxLink(settings.dropboxToken, randomPath);
            setImgSrc(link);
          } catch (e) {
            fallbackToProcedural();
          } finally {
            setIsSyncingImage(false);
          }
        } else {
          fallbackToProcedural();
        }
      } else {
        fallbackToProcedural();
      }
    };

    const fallbackToProcedural = () => {
      const pKey = category === 'service' ? 'service' : (category === 'class' ? 'class' : (category === 'hostess' ? 'hostess' : (category === 'rest' ? 'rest' : 'default')));
      setImgSrc(student.outfits?.[pKey]?.url || student.outfits?.['default']?.url || '');
    };

    updateImage();
  }, [category, settings.useCustomAssets, settings.dropboxToken, assetMap]);

  const availableRoles = Object.values(ClubRole).filter(role => {
    const unlock = ROLE_UNLOCKS[role];
    if (!unlock || !unlock.facility) return true;
    const facility = facilities[unlock.facility];
    return facility && facility.level >= unlock.level;
  });

  const StatRow = ({ label, value, icon: Icon, color }: any) => (
    <div className="mb-2">
      <div className="flex justify-between text-[8px] mb-1 items-center">
        <span className="flex items-center gap-1 text-slate-500 truncate uppercase tracking-tighter">
          <Icon size={10} className={color} /> {label}
        </span>
        <span className="text-slate-400 font-mono font-bold">{Math.round(value)}%</span>
      </div>
      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
        <div className={`h-full transition-all duration-700 ${color.replace('text-', 'bg-')}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden hover:border-indigo-500/50 transition-all shadow-2xl group relative flex flex-col h-full transform-gpu hover:-translate-y-2">
      <div className="relative h-60 bg-slate-950 shrink-0 border-b border-slate-800 overflow-hidden">
        {imgSrc && (
          <img 
            src={imgSrc} 
            alt={student.name}
            className={`w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all duration-1000 ${isSyncingImage ? 'blur-md scale-125' : 'scale-100 group-hover:scale-105'}`}
          />
        )}
        <div className="absolute top-4 right-4 bg-indigo-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase shadow-2xl tracking-widest border border-indigo-400/30">
          RANK {rank}
        </div>
        
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1 rounded-full text-[10px] font-bold border border-white/5 backdrop-blur-md shadow-lg">
            <Zap size={10} className={energy > 30 ? 'text-amber-400' : 'text-rose-400'} /> {Math.round(energy)}%
          </div>
          <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1 rounded-full text-[10px] font-bold border border-white/5 backdrop-blur-md shadow-lg">
            <Heart size={10} className={student.arousal > 50 ? 'text-pink-400' : 'text-slate-400'} /> {Math.round(student.arousal)}%
          </div>
        </div>

        <button onClick={() => onViewDetails(student, imgSrc)} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-slate-950 p-4 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-2xl z-10">
          <Search size={20} />
        </button>

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent p-6">
          <h3 className="text-xl font-serif font-bold text-white leading-tight mb-1 group-hover:text-indigo-300 transition-colors italic">{student.name}</h3>
          <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-[0.3em]">{student.major}</p>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1 bg-slate-900/50 backdrop-blur-sm">
        <div className="grid grid-cols-2 gap-x-6 mb-6">
          <StatRow label="Conv" value={student.skills.conversation} icon={Mic2} color="text-amber-400" />
          <StatRow label="Etiq" value={student.skills.etiquette} icon={Sparkles} color="text-emerald-400" />
          <StatRow label="Sedct" value={student.skills.seduction} icon={Flame} color="text-rose-400" />
          <StatRow label="Intm" value={(student.skills.vaginal_service + student.skills.anal_service) / 2} icon={Heart} color="text-pink-400" />
        </div>

        <div className="mt-auto flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
               <span className="text-[8px] uppercase font-bold text-slate-500 tracking-widest ml-1">Daily Study</span>
               <select 
                  value={student.classFocus}
                  onChange={(e) => onUpdateFocus(student.id, e.target.value as ClassType)}
                  className="w-full bg-slate-950 border border-slate-800 text-[10px] rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-indigo-500 transition-colors shadow-inner"
                >
                  {Object.values(ClassType).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
            </div>
            <div className="flex flex-col gap-1.5">
               <span className="text-[8px] uppercase font-bold text-slate-500 tracking-widest ml-1">Club Role</span>
               <select 
                  value={student.clubRole}
                  onChange={(e) => onUpdateRole(student.id, e.target.value as ClubRole)}
                  className="w-full bg-slate-950 border border-slate-800 text-[10px] rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-indigo-500 transition-colors shadow-inner"
                >
                  {availableRoles.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentCard;
