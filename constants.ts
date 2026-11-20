
import { Rank, Major, Facility, Skills, ClubRole, ClassType } from './types';

export const INITIAL_DEBT = 2000000;
export const MAX_YEARS = 4;
export const DAYS_PER_YEAR = 100;
export const SEMESTER_DAYS = 50;
export const INTEREST_RATE_WEEKLY = 0.025; // 2.5% per week

export const RANK_THRESHOLDS: { rank: Rank; min: number }[] = [
  { rank: 'SSS', min: 98 },
  { rank: 'SS', min: 91 },
  { rank: 'S', min: 81 },
  { rank: 'A', min: 66 },
  { rank: 'B', min: 46 },
  { rank: 'C', min: 26 },
  { rank: 'D', min: 11 },
  { rank: 'E', min: 0 },
];

export const getRank = (value: number): Rank => {
  for (const threshold of RANK_THRESHOLDS) {
    if (value >= threshold.min) return threshold.rank;
  }
  return 'E';
};

export const CLASS_SKILLS: Record<ClassType, (keyof Skills)[]> = {
  [ClassType.Academics]: ['knowledge', 'etiquette', 'conversation'],
  [ClassType.PE]: ['fitness', 'dancing', 'security'],
  [ClassType.Performance]: ['singing', 'dancing'],
  [ClassType.Seduction]: ['seduction', 'massage', 'kissing'],
  [ClassType.Intimacy]: ['vaginal_service', 'anal_service', 'fitness'],
  [ClassType.Service]: ['manual_service', 'oral_service', 'bartending']
};

export const MAJOR_SKILLS: Record<Major, (keyof Skills)[]> = {
  [Major.Academic]: ['knowledge', 'conversation'],
  [Major.Athletic]: ['fitness', 'security'],
  [Major.Socialite]: ['etiquette', 'conversation'],
  [Major.Performance]: ['singing', 'dancing'],
  [Major.Companion]: ['seduction', 'kissing'],
};

export const INITIAL_FACILITIES: Record<string, Facility> = {
  classrooms: { id: 'classrooms', name: 'Academic Hall', level: 1, maxLevel: 5, upgradeCost: 5000, effect: 'Increases Academic Skill growth.' },
  gym: { id: 'gym', name: 'Athletic Center', level: 1, maxLevel: 5, upgradeCost: 5000, effect: 'Increases PE and Fitness. Unlocks Security role at Lv3.' },
  salon: { id: 'salon', name: 'Beauty Salon', level: 1, maxLevel: 5, upgradeCost: 7500, effect: 'Increases Seduction and Socialite skills.' },
  dorms: { id: 'dorms', name: 'Student Dorms', level: 1, maxLevel: 5, upgradeCost: 10000, effect: 'Determines student capacity.', capacity: 4 },
  living_standards: { id: 'living_standards', name: 'Living Standards', level: 1, maxLevel: 5, upgradeCost: 12000, effect: 'Improves nightly fatigue recovery.' },
  nightclub: { id: 'nightclub', name: 'Nightfall Club', level: 1, maxLevel: 5, upgradeCost: 15000, effect: 'Unlocks roles: Lv1 Hostess, Lv2 Dancer, Lv3 Singer, Lv4 Private Service.' },
  bureau: { id: 'bureau', name: 'Intelligence Bureau', level: 1, maxLevel: 5, upgradeCost: 20000, effect: 'Increases applicant quality.' },
};

export const ROLE_UNLOCKS: Record<ClubRole, { facility: string, level: number }> = {
  [ClubRole.Hostess]: { facility: 'nightclub', level: 1 },
  [ClubRole.Bartender]: { facility: 'nightclub', level: 1 },
  [ClubRole.Dancer]: { facility: 'nightclub', level: 2 },
  [ClubRole.Singer]: { facility: 'nightclub', level: 3 },
  [ClubRole.Private_Service]: { facility: 'nightclub', level: 4 },
  [ClubRole.Security]: { facility: 'gym', level: 3 },
  [ClubRole.None]: { facility: '', level: 0 },
};

export const DORM_CAPACITY = [0, 4, 8, 12, 20, 40];

// --- Generation Pools ---

export const FIRST_NAMES = [
  "Aiko", "Elena", "Sasha", "Luna", "Yuki", "Mei", "Clara", "Isabella", "Mina", "Seraphina",
  "Chloe", "Sofia", "Hana", "Elara", "Nadia", "Valeria", "Kiana", "Jasmine", "Lydia", "Rhea",
  "Noemi", "Zara", "Ingrid", "Siofra", "Ember", "Xanthe", "Freyja", "Amara", "Yuna", "Layla"
];

export const LAST_NAMES = [
  "Vance", "Kuroki", "Belmont", "Zhang", "Novak", "Moretti", "Dupont", "Sato", "Sterling", "Kovalenko",
  "Ivers", "Aris", "Watanabe", "Chen", "Muller", "O'Neill", "Bianchi", "Katsaros", "Hawthorne", "Silva",
  "Leclair", "Russo", "Vega", "Kim", "Tanaka", "Mendez", "Park", "Fischer", "Rossi", "Wagner"
];

export const TRAITS = [
  "Diligent", "Rebellious", "Charismatic", "Anxious", "Determined", "Sultry", "Graceful",
  "Stoic", "Playful", "Cunning", "Naive", "Perfectionist", "Impulsive", "Eloquent", "Shy",
  "Ambitious", "Melancholic", "Altruistic", "Vain", "Frugal", "Observant", "Stubborn"
];

export const HAIR_COLORS = ["Ink Black", "Platinum Blonde", "Chestnut Brown", "Fiery Red", "Ash Grey", "Deep Violet", "Golden Silk", "Emerald Green"];
export const EYE_COLORS = ["Amber", "Azure Blue", "Jade Green", "Crimson", "Deep Brown", "Steel Grey", "Amethyst", "Golden"];

// Realistic weighted distribution for bust sizes (AA to F)
export const BUST_WEIGHTS: { size: string, weight: number }[] = [
  { size: "AA", weight: 5 },
  { size: "A", weight: 12 },
  { size: "B", weight: 25 },
  { size: "C", weight: 25 },
  { size: "D", weight: 18 },
  { size: "DD", weight: 8 },
  { size: "E", weight: 4 },
  { size: "F", weight: 3 }
];

export const TRAIT_SENS: Record<string, string[]> = {
  "Diligent": [
    "She is often the last to leave the study halls, her fingers stained with ink and her posture perfectly upright.",
    "She keeps a meticulous schedule, checking her watch with a sharp, disciplined frequency."
  ],
  "Rebellious": [
    "She has a habit of adjusting her uniform to be just slightly out of regulation, a silent challenge to authority.",
    "Her gaze is often defiant, lingering a second too long on her superiors before she scoffs and turns away."
  ],
  "Charismatic": [
    "She commands the room effortlessly, her laughter drawing people in like a magnetic force.",
    "There is a natural warmth to her gestures that makes even strangers feel like they've known her for years."
  ],
  "Anxious": [
    "She frequently toys with the hem of her skirt or the ends of her hair when addressed directly.",
    "Her eyes dart around the room as if searching for an exit, her breathing shallow and controlled."
  ],
  "Determined": [
    "There is a hardness to her jawline that suggests she will weather any storm to reach her objective.",
    "She rarely speaks of failure, treating every setback as merely another data point in her eventual success."
  ],
  "Sultry": [
    "Every movement she makes seems deliberately slow and liquid, drawing the eye to the curve of her hips.",
    "She has a way of lowering her voice to a suggestive whisper that makes the most mundane conversation feel intimate."
  ],
  "Graceful": [
    "She moves through the academy halls as if floating, her steps making almost no sound on the stone floors.",
    "Her posture is consistently elegant, reminiscent of a prima ballerina even when she is simply sitting at rest."
  ],
  "Stoic": [
    "Her face is a mask of cool indifference, rarely betraying a hint of her internal state.",
    "She accepts both praise and punishment with the same steady, unblinking composure."
  ],
  "Playful": [
    "She often has a mischievous glint in her eyes, as if she's sharing a private joke with the world.",
    "Her conversation is peppered with lighthearted teasing and sudden, infectious bursts of energy."
  ],
  "Cunning": [
    "She listens more than she speaks, her sharp eyes always calculating the best way to leverage a situation.",
    "There is a subtle, predatory edge to her smile that suggests she is always three steps ahead of everyone else."
  ],
  "Naive": [
    "She possesses a wide-eyed wonder about the academy that is both endearing and dangerously vulnerable.",
    "She often takes words at face value, lacking the cynical filter that protects most girls in her position."
  ],
  "Perfectionist": [
    "She is never satisfied with 'good enough,' often redoing tasks until they meet her impossible internal standards.",
    "Even the slightest smudge on her notes or a stray hair in her mirror is enough to cause her visible distress."
  ],
  "Impulsive": [
    "She tends to act on her first instinct, rarely pausing to consider the long-term consequences of her whims.",
    "Her energy is chaotic and unpredictable, shifting from intense focus to wild distraction in a heartbeat."
  ],
  "Eloquent": [
    "She speaks with a melodic, sophisticated cadence that makes listening to her an effortless pleasure.",
    "Her vocabulary is vast and precise, allowing her to navigate complex social situations with total verbal mastery."
  ],
  "Shy": [
    "She often hides behind a curtain of hair, speaking in a voice so soft it requires leaning in to hear.",
    "She blushes easily when complimented, her entire frame shrinking as she tries to avoid the spotlight."
  ],
  "Ambitious": [
    "She views every peer as a competitor and every lecture as a stepping stone to a higher social caste.",
    "She is constantly inquiring about the 'VIP' tiers of the academy, her hunger for status clearly visible."
  ],
  "Melancholic": [
    "There is a persistent, elegant sadness in her expression, as if she is mourning a life she never quite had.",
    "She often seeks out quiet, shadowed corners of the academy, staring out at the rain with a heavy, pensive air."
  ],
  "Altruistic": [
    "She is frequently found assisting other students with their burdens, often at the expense of her own rest.",
    "Her kindness feels genuine and rare in this environment, making her a natural confidante for the others."
  ],
  "Vain": [
    "She is seldom seen without a mirror in hand, constantly adjusting her appearance to maintain a flawless facade.",
    "She expects and demands attention, visibly wilting if she isn't the most admired person in the room."
  ],
  "Frugal": [
    "She counts her credits with a frantic intensity, hoarding even the smallest tips for some unspoken future goal.",
    "She takes meticulous care of her belongings, knowing exactly how much it would cost to replace even a simple pen."
  ],
  "Observant": [
    "She notices the smallest details—a flickering lamp, a nervous tic—long before anyone else in the room.",
    "She rarely engages in gossip herself, but she seems to know everyone's secrets just by watching them."
  ],
  "Stubborn": [
    "Once she has made up her mind, no amount of reasoning or authority can sway her from her chosen path.",
    "She will dig her heels in on principle alone, preferring a difficult failure to an easy compromise."
  ]
};

export const BACKGROUND_TEMPLATES = [
  "A former scholarship student from the outer districts. Her family's business collapsed under the weight of city taxes, leaving her as the sole provider. She views Aurelia not as a school, but as a high-stakes gamble for her future survival.",
  "The disowned daughter of a merchant prince. She was raised in luxury but cast out after a scandalous affair with a commoner. She has nothing left but her pride and the refined manners that are now her only currency.",
  "An aspiring stage performer who found the city's theaters closed to those without a patron. She heard that Aurelia Academy could turn a simple dancer into a muse for the elite, and she is willing to pay the price in blood and sweat.",
  "A street-smart drifter who spent her youth navigating the city's neon-lit slums. She was caught attempting to pick the pocket of an Academy recruiter, who saw potential in her sharp wits and desperate hunger for a better life.",
  "The survivor of a fallen noble house from the northern territories. Her lineage is ancient but her coffers are empty. She seeks to use the Academy's social polishing to marry back into the status her family lost to war.",
  "A brilliant but impoverished academic who was expelled from the State University for 'unorthodox' research. She needs the Academy's resources—and the funds from its nightlife operations—to continue her forbidden studies.",
  "Escaped from a stifling religious commune on the city's edge. To her, the Academy's depravity is a form of liberation she is still trying to understand, viewing every new experience with a mixture of fear and intoxicating curiosity.",
  "A former corporate intern who was framed for a high-level embezzlement scheme. With a massive debt now assigned to her name by the courts, she fled to Aurelia as the only place where she could 'earn' her way back to a clean slate."
];

export const BACKGROUNDS = [
  { 
    id: 'academic', 
    name: 'Disgraced Academic', 
    description: 'A former dean who knows the system. +10% Knowledge growth academy-wide.',
    traits: ['Bureaucrat', 'Methodical']
  },
  { 
    id: 'fixer', 
    name: 'Former Fixer', 
    description: 'You dealt with the city underbelly. +20% Nightfall Club security and compliance.',
    traits: ['Connected', 'Intimidating']
  },
  { 
    id: 'noble', 
    name: 'Disowned Heir', 
    description: 'Fallen from grace but kept the manners. +15% Etiquette growth.',
    traits: ['Cultured', 'Arrogant']
  }
];

export const ROLE_BONUSES = {
  Academic: "Intelligence provides 50% more bonus to skill growth.",
  Manager: "Hostesses earn 25% more revenue.",
  Recruiter: "Increases applicant quality and quantity.",
  Researcher: "Upgrading facilities costs 20% less.",
  None: "No active bonus."
};
