'use strict';
/* =====================================================================
   STUDENTS / PROCEDURAL CHARACTER GENERATION & TRAIT RULES
   ===================================================================== */
const APT_KEYS = ['intelligence', 'physicality', 'social', 'libido'];

const SKILL_KEYS = [
  'knowledge', 'fitness', 'etiquette', 'compliance', 'lust',
  'singing', 'dancing', 'bartending', 'conversation', 'security',
  'seduction', 'massage', 'kissing',
  'manual_service', 'oral_service', 'vaginal_service', 'anal_service'
];

const SKILL_LABELS = {
  knowledge: 'Knowledge',
  fitness: 'Fitness',
  etiquette: 'Etiquette',
  compliance: 'Compliance',
  lust: 'Lust',
  singing: 'Singing',
  dancing: 'Dancing',
  bartending: 'Bartending',
  conversation: 'Conversation',
  security: 'Security',
  seduction: 'Seduction',
  massage: 'Massage',
  kissing: 'Kissing',
  manual_service: 'Manual',
  oral_service: 'Oral',
  vaginal_service: 'Vaginal',
  anal_service: 'Anal'
};

const CLOTH = [
  { id: 'dressed', label: 'Dressed' },
  { id: 'partial', label: 'Partly Undressed' },
  { id: 'under', label: 'Lingerie' },
  { id: 'nude', label: 'Nude' },
  { id: 'sleepwear', label: 'Sleepwear' }
];

function rollStat(mean){
  return clamp(Math.round(mean + (Math.random() - 0.5) * 40), 5, 100);
}

function weightedBust(){
  return weighted(PEOPLE.busts, b => b.weight);
}

function buildPhysicalDescription(design, traits){
  const h = design.heightCm;
  const hDesc = h > 175 ? 'remarkably tall and statuesque' : h < 158 ? 'petite and delicate' : 'of graceful medium height';
  const bStr = design.bust.length > 2 ? design.bust : `${design.bust}-cup`;
  const feat = design.feature ? ` Noticeably, she wears ${design.feature}.` : '';
  const base = `Standing at ${h}cm with a ${design.build} build and a ${bStr} bust, she has ${design.hairStyle} in ${design.hairColor}, ${design.eyeColor} eyes, and ${design.skinTone} skin. Her frame is ${hDesc}, carrying an unmistakable presence.${feat}`;
  const traitLines = (traits || []).map(t => {
    const td = PEOPLE.traits[t];
    return td && td.desc && td.desc.length ? pick(td.desc) : '';
  }).filter(Boolean).join(' ');
  return cleanText(`${base} ${traitLines}`);
}

function pickOutfitsForStudent(){
  const out = {};
  Object.entries(PEOPLE.outfits).forEach(([slot, list]) => {
    if(Array.isArray(list) && list.length) out[slot] = pick(list).id;
  });
  return out;
}

function genStudent(qualityLevel = 25){
  const q = Number(qualityLevel) || 25;
  const aptitudes = {
    intelligence: rollStat(q),
    physicality: rollStat(q),
    social: rollStat(q),
    libido: rollStat(q)
  };
  const name = `${pick(PEOPLE.firstNames)} ${pick(PEOPLE.lastNames)}`;
  const majorKeys = Object.keys(ACAD.majors);
  const major = pick(majorKeys);
  const allTraits = Object.keys(PEOPLE.traits);
  const t1 = pick(allTraits);
  const t2 = pick(allTraits.filter(x => x !== t1));
  const traits = [t1, t2];

  const heightCm = ri(154, 182);
  const weightKg = Math.round((heightCm - 100) * rnd(0.78, 1.12));
  const hipsCm = ri(85, 112);
  const bustObj = weightedBust();

  const design = {
    hairColor: pick(PEOPLE.hairColors),
    hairStyle: pick(PEOPLE.hairStyles),
    eyeColor: pick(PEOPLE.eyeColors),
    skinTone: pick(PEOPLE.skinTones),
    build: pick(PEOPLE.builds),
    heightCm,
    weightKg,
    bust: bustObj.size,
    hipsCm,
    feature: pick(PEOPLE.features),
    favColor: pick(PEOPLE.favColors),
    outfits: pickOutfitsForStudent(),
    underwearId: pick(PEOPLE.underwear).id
  };

  const skills = {
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
    manual_service: 5 + ri(0, 9),
    oral_service: 5 + ri(0, 9),
    vaginal_service: 0,
    anal_service: 0
  };
  (ACAD.majors[major].skills || []).forEach(sk => {
    skills[sk] = Math.min(100, (skills[sk] || 0) + 15);
  });

  const defaultClass = ACAD.majors[major].defaultClass || 'Academics';

  const s = {
    id: uid(),
    seed: ri(1, 2147483646),
    name,
    age: ri(19, 24),
    description: cleanText(pick(PEOPLE.backgrounds)),
    physicalDescription: '',
    physicalStats: {
      hairColor: cap(design.hairColor),
      eyeColor: cap(design.eyeColor),
      height: `${heightCm}cm`,
      weight: `${weightKg}kg`,
      bust: design.bust,
      hips: `${hipsCm}cm`
    },
    design,
    major,
    classFocus: defaultClass,
    morningFocus: defaultClass,
    afternoonFocus: defaultClass,
    clubRole: 'None',
    serviceFocus: 'auto',
    autoRest: true,
    autoResting: false,
    lastPeriodScene: null,
    skills,
    aptitudes,
    traits,
    depravity: 0,
    fatigue: 0,
    arousal: ri(10, 45),
    year: 1,
    imgVar: {},
    stats: { earnings: 0, patrons: 0, visits: 0 }
  };
  s.physicalDescription = buildPhysicalDescription(design, traits);
  return s;
}

function ensureStudent(s){
  if(!s) return s;
  s.id = s.id || uid();
  s.seed = s.seed || (hashStr(s.name || s.id) % 2147483646) || 1;
  s.age = Math.max(18, Math.round(Number(s.age) || 20));
  s.major = ACAD.majors[s.major] ? s.major : 'Academic';
  const defClass = ACAD.majors[s.major].defaultClass || 'Academics';
  const baseClass = ACAD.classes[s.classFocus] ? s.classFocus : defClass;
  s.morningFocus = ACAD.classes[s.morningFocus] ? s.morningFocus : baseClass;
  s.afternoonFocus = ACAD.classes[s.afternoonFocus] ? s.afternoonFocus : baseClass;
  s.classFocus = s.morningFocus;
  s.clubRole = ACAD.roles[s.clubRole] ? s.clubRole : 'None';
  s.serviceFocus = s.serviceFocus || 'auto';
  if(s.autoRest === undefined) s.autoRest = true;
  s.autoResting = !!s.autoResting;
  s.skills = Object.assign(
    Object.fromEntries(SKILL_KEYS.map(k => [k, 10])),
    s.skills || {}
  );
  s.aptitudes = Object.assign({ intelligence: 25, physicality: 25, social: 25, libido: 25 }, s.aptitudes || {});
  s.traits = Array.isArray(s.traits) && s.traits.length ? s.traits : [pick(Object.keys(PEOPLE.traits))];
  s.depravity = clamp(Number(s.depravity) || 0, 0, 100);
  s.fatigue = clamp(Number(s.fatigue) || 0, 0, 100);
  s.arousal = clamp(Number(s.arousal) || 15, 0, 100);
  s.year = s.year || 1;
  s.imgVar = s.imgVar || {};
  s.stats = Object.assign({ earnings: 0, patrons: 0, visits: 0 }, s.stats || {});

  const ps = s.physicalStats || {};
  const hNum = parseInt(ps.height, 10) || 166;
  const wNum = parseInt(ps.weight, 10) || Math.round((hNum - 100) * 0.9);
  const hipNum = parseInt(ps.hips, 10) || 92;

  if(!s.design){
    s.design = {
      hairColor: String(ps.hairColor || pick(PEOPLE.hairColors)).toLowerCase(),
      hairStyle: pick(PEOPLE.hairStyles),
      eyeColor: String(ps.eyeColor || pick(PEOPLE.eyeColors)).toLowerCase(),
      skinTone: pick(PEOPLE.skinTones),
      build: pick(PEOPLE.builds),
      heightCm: hNum,
      weightKg: wNum,
      bust: ps.bust || 'C',
      hipsCm: hipNum,
      feature: pick(PEOPLE.features),
      favColor: pick(PEOPLE.favColors),
      outfits: pickOutfitsForStudent(),
      underwearId: pick(PEOPLE.underwear).id
    };
  } else {
    s.design.outfits = Object.assign(pickOutfitsForStudent(), s.design.outfits || {});
    s.design.underwearId = s.design.underwearId || pick(PEOPLE.underwear).id;
    s.design.favColor = s.design.favColor || pick(PEOPLE.favColors);
    s.design.hairStyle = s.design.hairStyle || pick(PEOPLE.hairStyles);
    s.design.skinTone = s.design.skinTone || pick(PEOPLE.skinTones);
    s.design.build = s.design.build || pick(PEOPLE.builds);
    s.design.heightCm = s.design.heightCm || hNum;
    s.design.weightKg = s.design.weightKg || wNum;
    s.design.hipsCm = s.design.hipsCm || hipNum;
    s.design.bust = s.design.bust || ps.bust || 'C';
  }

  s.physicalStats = {
    hairColor: cap(s.design.hairColor),
    eyeColor: cap(s.design.eyeColor),
    height: `${s.design.heightCm}cm`,
    weight: `${s.design.weightKg}kg`,
    bust: s.design.bust,
    hips: `${s.design.hipsCm}cm`
  };
  s.description = cleanText(s.description || pick(PEOPLE.backgrounds));
  if(!s.physicalDescription) s.physicalDescription = buildPhysicalDescription(s.design, s.traits);
  else s.physicalDescription = cleanText(s.physicalDescription);
  return s;
}

function traitMul(s, key){
  let m = 1;
  (s.traits || []).forEach(t => {
    const td = PEOPLE.traits[t];
    if(td && td.fx && typeof td.fx[key] === 'number') m *= td.fx[key];
  });
  return m;
}
function traitAdd(s, key){
  let a = 0;
  (s.traits || []).forEach(t => {
    const td = PEOPLE.traits[t];
    if(td && td.fx && typeof td.fx[key] === 'number') a += td.fx[key];
  });
  return a;
}

function studentAvgApt(s){
  return APT_KEYS.reduce((acc, k) => acc + (s.aptitudes[k] || 0), 0) / APT_KEYS.length;
}
function studentRank(s){
  return getRank(studentAvgApt(s));
}
function studentEnergy(s){
  return clamp(Math.round(100 - (s.fatigue || 0)), 0, 100);
}

function canDoRole(roleId, facilities){
  const role = ACAD.roles[roleId];
  if(!role) return 'Unknown role';
  const u = role.unlock;
  if(!u || !u.facility) return null;
  const f = (facilities || (S && S.facilities) || {})[u.facility];
  if(!f || f.level < u.level) return `Requires ${ACAD.facilities[u.facility].name} Lv ${u.level}`;
  return null;
}

function eligibleServices(s){
  return Object.values(SERVICES).filter(svc =>
    s.depravity >= svc.depravityMin || s.skills.compliance >= svc.depravityMin + 25
  );
}

function eligibleNightVisitStages(s){
  const all = Object.values(NIGHT_VISITS || {});
  return all.filter(st =>
    st.id === 'tease' ||
    (s.depravity || 0) >= (st.depravityMin || 0) ||
    ((s.skills && s.skills.compliance) || 0) >= (st.complianceMin || 0)
  );
}

function studentStudyFocus(s, time){
  const t = time || (S && S.time) || 'Morning';
  if(t === 'Afternoon') return s.afternoonFocus || s.classFocus || 'Academics';
  return s.morningFocus || s.classFocus || 'Academics';
}

function studentCurrentScene(s, time){
  const t = time || (S && S.time) || 'Morning';
  if(t === 'Morning' || t === 'Afternoon'){
    if(s.autoResting) return 'class_Rest';
    const key = 'class_' + studentStudyFocus(s, t);
    return SCENES[key] ? key : 'class_Academics';
  }
  if(t === 'Evening'){
    if(s.autoResting) return 'night_rest';
    if(s.clubRole === 'Private_Service' && s.serviceFocus && s.serviceFocus !== 'auto' && SERVICES[s.serviceFocus]){
      return 'svc:' + s.serviceFocus;
    }
    const role = ACAD.roles[s.clubRole];
    return (role && role.scene && SCENES[role.scene]) ? role.scene : 'night_rest';
  }
  if(t === 'Night'){
    return (s.lastPeriodScene && (SCENES[s.lastPeriodScene] || String(s.lastPeriodScene).startsWith('svc:'))) ? s.lastPeriodScene : 'night_rest';
  }
  return 'portrait';
}

function exportDossierObj(s){
  return {
    name: s.name,
    age: s.age,
    major: s.major,
    description: s.description,
    physicalDescription: s.physicalDescription,
    physicalStats: s.physicalStats,
    design: s.design,
    traits: s.traits
  };
}

function importDossierObj(raw){
  if(!raw || typeof raw !== 'object' || !raw.name) throw new Error('Dossier JSON must include a "name" field.');
  const base = genStudent(typeof applicantQuality === 'function' ? applicantQuality() : 25);
  const merged = Object.assign({}, base, {
    name: cleanText(String(raw.name)).slice(0, 60) || base.name,
    age: Math.max(18, Math.round(Number(raw.age) || base.age)),
    major: ACAD.majors[raw.major] ? raw.major : base.major,
    description: raw.description ? cleanText(raw.description) : base.description,
    physicalDescription: raw.physicalDescription ? cleanText(raw.physicalDescription) : '',
    physicalStats: raw.physicalStats ? Object.assign({}, base.physicalStats, raw.physicalStats) : base.physicalStats,
    design: raw.design ? Object.assign({}, base.design, raw.design) : undefined,
    traits: Array.isArray(raw.traits) && raw.traits.length
      ? raw.traits.filter(t => PEOPLE.traits[t]).slice(0, 3)
      : base.traits
  });
  if(!merged.traits.length) merged.traits = base.traits;
  return ensureStudent(merged);
}
