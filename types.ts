
export type Rank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS';

export type PerformanceTier = 'Fail' | 'Poor' | 'Decent' | 'Good' | 'Excellent';

export interface PhysicalStats {
  hairColor: string;
  eyeColor: string;
  height: string;
  weight: string;
  bust: string;
  hips: string;
}

export interface Skills {
  knowledge: number;
  fitness: number;
  etiquette: number;
  compliance: number;
  lust: number;
  singing: number;
  dancing: number;
  bartending: number;
  conversation: number;
  security: number;
  seduction: number;
  massage: number;
  kissing: number;
  manual_service: number;
  oral_service: number;
  vaginal_service: number;
  anal_service: number;
}

export enum ClassType {
  Academics = 'Academics',
  PE = 'PE',
  Performance = 'Performance',
  Seduction = 'Seduction',
  Intimacy = 'Intimacy',
  Service = 'Service'
}

export interface Aptitudes {
  intelligence: number;
  physicality: number;
  social: number;
  libido: number;
}

export enum Major {
  Academic = 'Academic',
  Athletic = 'Athletic',
  Socialite = 'Socialite',
  Performance = 'Performance',
  Companion = 'Companion'
}

export enum ClubRole {
  Hostess = 'Hostess',
  Bartender = 'Bartender',
  Security = 'Security',
  Dancer = 'Dancer',
  Singer = 'Singer',
  Private_Service = 'Private Service',
  None = 'None'
}

export interface StudentOutfit {
  prompt: string;
  url: string;
}

export interface Student {
  id: string;
  name: string;
  folderName: string; 
  age: number;
  description: string;
  physicalDescription: string;
  physicalStats: PhysicalStats;
  major: Major;
  classFocus: ClassType;
  clubRole: ClubRole;
  lastServiceType: string | null; 
  skills: Skills;
  aptitudes: Aptitudes;
  traits: string[];
  depravity: number;
  fatigue: number;
  arousal: number;
  year: number;
  portraitPrompt: string;
  outfits: Record<string, StudentOutfit>;
}

export interface Facility {
  id: string;
  name: string;
  level: number;
  maxLevel: number;
  upgradeCost: number;
  effect: string;
  capacity?: number;
}

export interface Principal {
  name: string;
  background: string;
  traits: string[];
  aptitudes: Aptitudes;
  activeRole: 'Academic' | 'Manager' | 'Recruiter' | 'Researcher' | 'None';
  energy: number;
  maxEnergy: number;
}

export enum TimeOfDay {
  Morning = 'Morning',
  Afternoon = 'Afternoon',
  Evening = 'Evening',
  Night = 'Night'
}

export type GamePhase = 'setup' | 'enrollment' | 'active';

export interface Reputation {
  academic: number;
  refinement: number;
  infamy: number;
}

export interface GameSettings {
  useCustomAssets: boolean;
  assetBaseUrl: string; 
  dropboxToken: string;
  isDriveMode: boolean; 
}

export interface LogEntry {
  text: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'private' | 'tier_fail' | 'tier_poor' | 'tier_decent' | 'tier_good' | 'tier_excellent';
  timestamp: string;
}

export interface GameState {
  phase: GamePhase;
  day: number;
  year: number;
  time: TimeOfDay;
  debt: number;
  funds: number;
  students: Student[];
  applicants: Student[];
  facilities: Record<string, Facility>;
  principal: Principal;
  reputation: Reputation;
  settings: GameSettings;
  assetMap: Record<string, string[]>; 
  isGameOver: boolean;
  history: LogEntry[];
}
