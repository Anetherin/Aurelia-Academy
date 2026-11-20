
import { GoogleGenAI } from "@google/genai";
import { Student, Major, ClubRole, PhysicalStats, Skills, ClassType, Aptitudes } from "../types";
import { 
  FIRST_NAMES, LAST_NAMES, TRAITS, HAIR_COLORS, EYE_COLORS, BUST_WEIGHTS, 
  BACKGROUND_TEMPLATES, MAJOR_SKILLS, TRAIT_SENS 
} from "../constants";

const MAJOR_DEFAULT_CLASS: Record<Major, ClassType> = {
  [Major.Academic]: ClassType.Academics,
  [Major.Athletic]: ClassType.PE,
  [Major.Socialite]: ClassType.Academics,
  [Major.Performance]: ClassType.Performance,
  [Major.Companion]: ClassType.Seduction
};

const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const getWeightedBust = (): string => {
  const totalWeight = BUST_WEIGHTS.reduce((acc, curr) => acc + curr.weight, 0);
  let random = Math.random() * totalWeight;
  for (const item of BUST_WEIGHTS) {
    if (random < item.weight) return item.size;
    random -= item.weight;
  }
  return "B"; // Fallback
};

const generatePhysicalDescription = (stats: PhysicalStats, traits: string[]): string => {
  const heightVal = parseInt(stats.height);
  const hDesc = heightVal > 175 ? "remarkably tall and statuesque" : heightVal < 155 ? "quite petite and delicate" : "of average, unassuming height";
  const bDesc = stats.bust.length > 2 ? stats.bust : `${stats.bust}-cup`;
  
  const base = `Standing at ${stats.height} with a ${bDesc} bust, she possesses ${stats.hairColor} hair and ${stats.eyeColor} eyes. Her frame is ${hDesc}, carrying herself with a presence that is impossible to ignore.`;
  
  const traitDescriptions = traits.map(t => {
    const sens = TRAIT_SENS[t];
    return sens ? getRandom(sens) : `She displays a ${t.toLowerCase()} temperament in her daily interactions.`;
  }).join(" ");

  return `${base} ${traitDescriptions}`;
};

export const generateStudent = async (qualityLevel: number): Promise<Partial<Student>> => {
  const rollStat = (mean: number) => Math.max(5, Math.min(100, Math.round(mean + (Math.random() - 0.5) * 40)));
  
  const aptitudes: Aptitudes = {
    intelligence: rollStat(qualityLevel),
    physicality: rollStat(qualityLevel),
    social: rollStat(qualityLevel),
    libido: rollStat(qualityLevel)
  };

  const name = `${getRandom(FIRST_NAMES)} ${getRandom(LAST_NAMES)}`;
  const major = getRandom(Object.values(Major));
  const traits = [getRandom(TRAITS), getRandom(TRAITS)];
  if (traits[0] === traits[1]) traits[1] = getRandom(TRAITS.filter(t => t !== traits[0]));

  const height = 150 + Math.floor(Math.random() * 35);
  const weight = Math.round((height - 100) * (0.8 + Math.random() * 0.4));
  const stats: PhysicalStats = {
    hairColor: getRandom(HAIR_COLORS),
    eyeColor: getRandom(EYE_COLORS),
    height: `${height}cm`,
    weight: `${weight}kg`,
    bust: getWeightedBust(),
    hips: `${85 + Math.floor(Math.random() * 30)}cm`
  };

  const skills: Skills = {
    knowledge: rollStat(aptitudes.intelligence / 2),
    fitness: rollStat(aptitudes.physicality / 2),
    etiquette: rollStat(aptitudes.social / 2),
    compliance: rollStat(30),
    lust: rollStat(aptitudes.libido / 3),
    singing: rollStat(aptitudes.social / 4),
    dancing: rollStat(aptitudes.physicality / 4),
    bartending: rollStat(aptitudes.social / 5),
    conversation: rollStat(aptitudes.social / 3),
    security: rollStat(aptitudes.physicality / 5),
    seduction: rollStat(aptitudes.libido / 4),
    massage: rollStat(20),
    kissing: rollStat(25),
    manual_service: 5 + Math.floor(Math.random() * 10),
    oral_service: 5 + Math.floor(Math.random() * 10),
    vaginal_service: 0,
    anal_service: 0
  };

  MAJOR_SKILLS[major].forEach(sk => {
    skills[sk] = Math.min(100, skills[sk] + 15);
  });

  const sid = Math.random().toString(36).substr(2, 9);
  const portraitPrompt = `A portrait of ${name}, a ${major} student with ${stats.hairColor} hair and ${stats.eyeColor} eyes.`;

  const outfits: Record<string, { prompt: string; url: string }> = {
    default: { prompt: "Casual school attire", url: `https://picsum.photos/seed/${sid}_def/400/600` },
    class: { prompt: "Academy uniform", url: `https://picsum.photos/seed/${sid}_cls/400/600` },
    hostess: { prompt: "Elegant evening dress", url: `https://picsum.photos/seed/${sid}_hst/400/600` },
    service: { prompt: "Revealing service outfit", url: `https://picsum.photos/seed/${sid}_srv/400/600` },
    rest: { prompt: "Silk sleepwear", url: `https://picsum.photos/seed/${sid}_rst/400/600` }
  };

  const background = getRandom(BACKGROUND_TEMPLATES);
  const physicalDescription = generatePhysicalDescription(stats, traits);

  return {
    id: sid,
    name,
    folderName: name.toLowerCase().replace(/\s+/g, '_'),
    age: 18 + Math.floor(Math.random() * 5),
    description: background,
    physicalDescription,
    physicalStats: stats,
    major,
    classFocus: MAJOR_DEFAULT_CLASS[major],
    clubRole: ClubRole.None,
    lastServiceType: null,
    skills,
    aptitudes,
    traits,
    depravity: 0,
    fatigue: 0,
    arousal: 10 + Math.floor(Math.random() * 40),
    year: 1,
    portraitPrompt,
    outfits
  };
};

export const getLocalPeriodFlavor = (student: Student, context: 'Morning' | 'Afternoon' | 'Evening'): string => {
  const morningLines = [
    `showed exceptional focus during her specialization lectures.`,
    `refined her core knowledge base in the academic wing today.`,
    `was spotted taking diligent notes in the main hall.`,
    `excelled in her morning theory sessions.`,
    `demonstrated a sharp intellect during the curriculum brief.`
  ];
  const afternoonLines = [
    `honed her social presence in the academy salon.`,
    `showcased impressive etiquette during group drills.`,
    `refined her conversational delivery under peer review.`,
    `focused on her poise and personal refinement today.`,
    `was the highlight of the social seminar.`
  ];
  const eveningLines = [
    `was a captivating presence at the Nightfall VIP tables.`,
    `maintained a high professional standard during her shift.`,
    `handled club patrons with remarkable grace and wit.`,
    `was a key revenue generator during the evening operations.`,
    `earned significant praise from the club's elite guests.`
  ];

  const pool = context === 'Morning' ? morningLines : context === 'Afternoon' ? afternoonLines : eveningLines;
  const line = pool[Math.floor(Math.random() * pool.length)];
  return `${student.name} ${line}`;
};

// Fix: Complete the truncated function and ensure it returns a string as required by the Promise<string> return type.
export const generateNightVisitNarrative = async (student: Student, principalName: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Generate a visceral, highly explicit, and carnal erotic narrative paragraph (85-130 words) describing an intimate night visit between the academy director ${principalName} and the student ${student.name}. She is ${student.age} years old and has the following traits: ${student.traits.join(', ')}. Focus on her specific physical features: ${student.physicalDescription}. The tone should be dark, sophisticated, and intensely carnal, reflecting the power dynamics of Aurelia Academy.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    // Using .text property directly as per @google/genai documentation
    return response.text || "The night air was thick with tension as the visit concluded in shadow.";
  } catch (error) {
    console.error("Narrative generation failed:", error);
    // Return fallback string to prevent "function must return a value" error
    return `${student.name} spent a private session with Director ${principalName} behind closed doors.`;
  }
};
