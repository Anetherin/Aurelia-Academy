'use strict';
/* =====================================================================
   CONFIG & DATA ACCESS
   Editable content lives in data/*.json (loaded by loader.js into window.AA_DATA).
   ===================================================================== */
const DATA = window.AA_DATA || {};
function needData(k){
  if(!DATA[k]) throw new Error(`data/${k}.json didn't load.`);
  return DATA[k];
}
const noMeta = o => Object.fromEntries(Object.entries(o || {}).filter(([k]) => !k.startsWith('_')));

const BAL = needData('balance');
const ACAD = needData('academy');
const STAT_DOCS = ACAD.statDocs || {};
const PEOPLE = needData('people');
const SERVICES_DATA = needData('services');
const SERVICES = noMeta(SERVICES_DATA.services);
const ROLE_STORIES = noMeta(SERVICES_DATA.roles);
const INCIDENTS_DATA = noMeta(SERVICES_DATA.incidents);
const NIGHT_VISITS = noMeta(SERVICES_DATA.nightVisits);
const SCENES_DATA = needData('scenes');
const SCENES = noMeta(SCENES_DATA.scenes);
const SNIPPETS = needData('snippets');
const AI_FILE = needData('ai-prompts');
const DEFAULT_AI_TPL = Object.fromEntries(
  Object.entries(noMeta(AI_FILE)).filter(([k, v]) => k !== 'guidance' && typeof v === 'string')
);

const DEFAULT_SETTINGS = {
  style: "4k anime style, masterpiece, high detailed quality, dark academia aesthetic, dramatic moody lighting",
  negative: "child, minor, teenager, loli, young-looking, schoolgirl, lowres, bad anatomy, extra fingers, watermark, text, signature",
  resolution: "512x768",
  autoPortrait: true,
  autoImg: true,
  autoSceneChange: false,
  imgHidden: false,
  repImg: true,
  libraryInPool: true,
  showStudentThoughts: true,
  nightVisitTone: 'explicit',
  nightVisitMode: 'auto',
  ai: { on: true, auto: false, autoBackstory: false, guidance: '' }
};

function getRank(value){
  for(const [rank, min] of BAL.ranks){
    if(value >= min) return rank;
  }
  return 'E';
}
