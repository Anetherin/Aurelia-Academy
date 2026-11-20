
import { GameState, TimeOfDay, Student, LogEntry, ClubRole } from '../types';
import { CLASS_SKILLS } from '../constants';
import { calculateServiceResult } from './serviceNarratives';

export const getTimeActionLabel = (time: TimeOfDay): string => {
  switch (time) {
    case TimeOfDay.Morning: return "Commence Morning Lectures";
    case TimeOfDay.Afternoon: return "Begin Afternoon Specializations";
    case TimeOfDay.Evening: return "Open Nightfall Operations";
    case TimeOfDay.Night: return "Finalize Ledger & Rest";
    default: return "Advance Time";
  }
};

export const processTimeTick = async (
  gameState: GameState,
  selectedProtocolId: string,
  principalActions: any[],
  generateNightVisit: (s: Student, pName: string) => Promise<string>
) => {
  const { time, students, facilities, funds, principal, day } = gameState;
  const protocol = principalActions.find(a => a.id === selectedProtocolId);
  
  let nextTime: TimeOfDay = TimeOfDay.Morning;
  let nextDay = day;
  let totalIncome = 0;
  let totalTips = 0;
  let acadDelta = 0;
  let refinDelta = 0;
  const periodLogs: {text: string, type: LogEntry['type']}[] = [];

  // Director Action Log with custom flavor
  if (protocol) {
    if (protocol.id === 'hall_walk') {
      periodLogs.push({ 
        text: `DIRECTOR: You walk the halls with measured, heavy steps, ensuring every student is in line. Your gaze is a weight they carry with a mix of fear and feverish appreciation; as the only male authority, your attention is the most coveted prize in the academy. Discipline is absolute.`, 
        type: 'info' 
      });
    } else {
      periodLogs.push({ text: `DIRECTOR: Executed protocol "${protocol.name}". ${protocol.effect}`, type: 'info' });
    }
  }

  const isNightTransition = time === TimeOfDay.Night;

  const updatedStudents = await Promise.all(students.map(async (s) => {
    let localS = { ...s };
    if (isNightTransition) {
      localS.lastServiceType = null;
      if (localS.arousal > 70) {
        const withDirector = Math.random() < (localS.skills.compliance / 100);
        if (withDirector) {
           const narrative = await generateNightVisit(localS, principal.name);
           periodLogs.push({text: narrative, type: 'private'});
           localS.skills.compliance = Math.min(100, localS.skills.compliance + 6);
           localS.skills.lust = Math.min(100, localS.skills.lust + 4);
           localS.lastServiceType = 'private'; 
        }
        localS.arousal = Math.max(10, localS.arousal - 70);
      }
      const recoveryAmt = 20 + (facilities.living_standards.level * 12);
      localS.fatigue = Math.max(0, localS.fatigue - recoveryAmt);
      return localS;
    }

    // Special behavior for Hall Walk
    if (selectedProtocolId === 'hall_walk') {
      localS.skills.compliance = Math.min(100, localS.skills.compliance + 1.5);
      localS.arousal = Math.min(100, localS.arousal + 3.0);
    }

    // Fatigue Check
    if (s.fatigue > 98) {
      periodLogs.push({text: `CRITICAL: ${s.name} collapsed from exhaustion.`, type: 'error'});
      return { ...s, fatigue: Math.max(0, s.fatigue - 30), clubRole: ClubRole.None, lastServiceType: null };
    }

    // General Increments
    localS.fatigue = Math.min(100, localS.fatigue + (time === TimeOfDay.Evening ? 0 : 9));
    localS.arousal = Math.min(100, localS.arousal + (localS.aptitudes.libido / 25) + 1.5);

    // Classes
    if (time === TimeOfDay.Morning || time === TimeOfDay.Afternoon) {
      const gain = (Math.random() * 2.5 + (time === TimeOfDay.Morning ? facilities.classrooms.level : facilities.salon.level));
      const skillsToTrain = CLASS_SKILLS[localS.classFocus];
      skillsToTrain.forEach(sk => { localS.skills[sk] = Math.min(100, localS.skills[sk] + gain); });
      
      const skillNames = skillsToTrain.map(sk => sk.charAt(0).toUpperCase() + sk.slice(1)).join(', ');
      periodLogs.push({ text: `${localS.name} gained +${gain.toFixed(1)} in ${skillNames}.`, type: 'info' });

      if (time === TimeOfDay.Morning) acadDelta += gain / students.length;
      else refinDelta += gain / students.length;
    } 
    // Nightclub - MULTI CUSTOMER SYSTEM
    else if (time === TimeOfDay.Evening && localS.clubRole !== ClubRole.None) {
      const numCustomers = 1 + Math.floor(facilities.nightclub.level / 2) + (Math.random() > 0.5 ? 1 : 0);
      let studentRevenue = 0;
      let studentTips = 0;
      let serviceType = 'massage';
      if (localS.clubRole === ClubRole.Private_Service) serviceType = 'vaginal';
      
      for (let i = 0; i < numCustomers; i++) {
        const res = calculateServiceResult(localS, serviceType, 100, facilities.nightclub.level);
        studentRevenue += res.revenue;
        studentTips += res.tip;
        periodLogs.push({ text: `[${localS.name}] Patron ${i+1}: ${res.narrative}`, type: res.type });
        localS.lastServiceType = res.type.includes('fail') ? null : serviceType;
        localS.fatigue = Math.min(100, localS.fatigue + 10);
      }
      
      totalIncome += studentRevenue;
      totalTips += studentTips;
      
      periodLogs.push({ 
        text: `${localS.name} Summary: $${(studentRevenue + studentTips).toLocaleString()} ($${studentRevenue.toLocaleString()} Base + $${studentTips.toLocaleString()} Tips) from ${numCustomers} Patrons.`, 
        type: 'success' 
      });
    }

    return localS;
  }));

  if (time === TimeOfDay.Evening && (totalIncome > 0 || totalTips > 0)) {
    periodLogs.push({ 
      text: `NIGHTFALL OVERVIEW: Club operations generated $${(totalIncome + totalTips).toLocaleString()} Total.`, 
      type: 'success' 
    });
  }

  if (isNightTransition) nextDay = day + 1;
  else {
    const times = [TimeOfDay.Morning, TimeOfDay.Afternoon, TimeOfDay.Evening, TimeOfDay.Night];
    nextTime = times[(times.indexOf(time) + 1) % 4];
  }

  return {
    updatedStudents,
    nextTime,
    nextDay,
    totalIncome: totalIncome + totalTips,
    acadDelta,
    refinDelta,
    periodLogs
  };
};
