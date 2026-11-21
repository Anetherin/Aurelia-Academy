'use strict';
/* =====================================================================
   GAME STATE, PERSISTENCE & MIGRATIONS
   ===================================================================== */
const SAVE_VER = 1;
const HISTORY_MAX = 40;

function makeInitialFacilities(){
  const out = {};
  Object.values(ACAD.facilities).forEach(f => {
    out[f.id] = {
      id: f.id,
      name: f.name,
      level: 1,
      maxLevel: f.maxLevel || 5,
      upgradeCost: f.upgradeCost,
      effect: f.effect
    };
  });
  return out;
}

function newGameState(director, initialStudents){
  const bg = (ACAD.backgrounds || []).find(b => b.id === director.bgId) || ACAD.backgrounds[0];
  const aptitudes = { intelligence: 40, physicality: 30, social: 45, libido: 50 };
  Object.entries(bg.bonus || {}).forEach(([k, v]) => {
    aptitudes[k] = clamp((aptitudes[k] || 0) + v, 0, 100);
  });

  const students = (initialStudents || []).map(ensureStudent);
  const payInterval = (BAL.economy.mandatedPayments && BAL.economy.mandatedPayments.intervalDays) || 14;
  const s = {
    v: SAVE_VER,
    runName: `${director.name.trim()}'s Term`,
    day: 1,
    year: 1,
    term: 1,
    time: 'Morning',
    debt: BAL.economy.initialDebt,
    initialDebt: BAL.economy.initialDebt,
    funds: BAL.economy.initialFunds,
    paymentCycle: 1,
    nextPaymentDay: payInterval,
    cycleDebtPaid: 0,
    missedPayments: 0,
    foreclosureReason: '',
    pendingNightVisits: [],
    students,
    applicants: [],
    facilities: makeInitialFacilities(),
    director: {
      name: director.name.trim(),
      bgId: bg.id,
      background: bg.name,
      traits: (bg.traits || []).slice(),
      aptitudes,
      activeRole: 'None',
      energy: 100,
      maxEnergy: 100
    },
    selectedProtocol: 'rest',
    protocolTargetId: students[0] ? students[0].id : '',
    reputation: {
      academic: BAL.reputation.startAcademic,
      refinement: BAL.reputation.startRefinement,
      infamy: BAL.reputation.startInfamy
    },
    stats: {
      totalEarned: 0,
      totalDebtPaid: 0,
      interestAccrued: 0,
      nightVisits: 0,
      incidentsHandled: 0,
      incidentsMissed: 0
    },
    lastPeriod: null,
    history: [],
    won: false,
    over: false,
    endless: false,
    semesterRefreshed: false
  };

  S = s;
  S.applicants = generateApplicants();
  logEvent(`Director ${S.director.name} (${S.director.background}) assumed command of Aurelia Academy with ${students.length} enrolled students and ${fmtMoney(S.debt)} debt.`, 'success');
  save();
  return S;
}

function logEvent(text, type = 'info', meta = {}){
  if(!S) return;
  const stamp = `[Y${S.year} D${S.day} ${S.time.charAt(0)}]`;
  S.history.unshift(Object.assign({ text, type, stamp, day: S.day, time: S.time }, meta));
  if(S.history.length > HISTORY_MAX) S.history.length = HISTORY_MAX;
}

function clearHistory(){
  if(!S) return;
  S.history = [];
  save();
  render();
  toast('Log cleared.');
}

function save(){
  if(!S) return false;
  return store.set(KEY_SAVE, S);
}

function saveSettings(){
  return store.set(KEY_SET, SET);
}

function saveLib(){
  return store.set(KEY_LIB, LIB);
}

function migrate(raw){
  if(!raw || typeof raw !== 'object') return null;
  const s = raw;
  s.v = SAVE_VER;
  s.day = Math.max(1, Number(s.day) || 1);
  s.year = Math.max(1, Number(s.year) || 1);
  s.term = s.term || (((s.day - 1) % BAL.economy.daysPerYear) < BAL.economy.semesterDays ? 1 : 2);
  s.time = ['Morning', 'Afternoon', 'Evening', 'Night'].includes(s.time) ? s.time : 'Morning';
  s.debt = Math.max(0, Number(s.debt) || 0);
  s.initialDebt = Number(s.initialDebt) || BAL.economy.initialDebt;
  s.funds = Number(s.funds) || 0;
  s.students = (Array.isArray(s.students) ? s.students : []).map(ensureStudent);
  s.applicants = (Array.isArray(s.applicants) ? s.applicants : []).map(ensureStudent);
  const baseFac = makeInitialFacilities();
  Object.keys(baseFac).forEach(k => {
    if(s.facilities && s.facilities[k]){
      baseFac[k] = Object.assign(baseFac[k], s.facilities[k]);
    }
  });
  s.facilities = baseFac;
  s.director = Object.assign({
    name: 'Director',
    bgId: 'academic',
    background: 'Disgraced Academic',
    traits: ['Bureaucrat', 'Methodical'],
    aptitudes: { intelligence: 40, physicality: 30, social: 45, libido: 50 },
    activeRole: 'None',
    energy: 100,
    maxEnergy: 100
  }, s.director || {});
  s.selectedProtocol = s.selectedProtocol || 'rest';
  if(!s.protocolTargetId || !s.students.some(x => x.id === s.protocolTargetId)){
    s.protocolTargetId = s.students[0] ? s.students[0].id : '';
  }
  s.reputation = Object.assign({ academic: 10, refinement: 10, infamy: 0 }, s.reputation || {});
  s.stats = Object.assign({ totalEarned: 0, totalDebtPaid: 0, interestAccrued: 0, nightVisits: 0, incidentsHandled: 0, incidentsMissed: 0 }, s.stats || {});
  s.history = Array.isArray(s.history) ? s.history.slice(0, HISTORY_MAX) : [];
  const payInterval = (BAL.economy.mandatedPayments && BAL.economy.mandatedPayments.intervalDays) || 14;
  s.paymentCycle = Math.max(1, Number(s.paymentCycle) || Math.ceil(s.day / payInterval));
  s.nextPaymentDay = Number(s.nextPaymentDay) || (Math.ceil(s.day / payInterval) * payInterval);
  s.cycleDebtPaid = Math.max(0, Number(s.cycleDebtPaid) || 0);
  s.missedPayments = Math.max(0, Number(s.missedPayments) || 0);
  s.foreclosureReason = s.foreclosureReason || '';
  s.pendingNightVisits = Array.isArray(s.pendingNightVisits) ? s.pendingNightVisits : [];
  s.won = !!s.won;
  s.over = !!s.over;
  s.endless = !!s.endless;
  return s;
}

async function purgeUnusedImages(){
  const keep = new Set((LIB || []).map(w => w.id));
  if(S){
    (S.students || []).forEach(w => keep.add(w.id));
    (S.applicants || []).forEach(w => keep.add(w.id));
  }
  let removed = 0;
  for(const k of [...IMGKEYS]){
    const sid = k.split('|')[0];
    if(!keep.has(sid)){
      await imgDel(k);
      removed++;
    }
  }
  Object.keys(THUMBS).forEach(id => {
    if(!keep.has(id)){
      delete THUMBS[id];
      idbReq('thumbs', 'readwrite', st => st.delete(id));
    }
  });
  return removed;
}

async function restart(){
  store.del(KEY_SAVE);
  S = null;
  await purgeUnusedImages();
  startSetup();
}
