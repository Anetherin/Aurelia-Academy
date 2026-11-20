'use strict';
/* =====================================================================
   ECONOMY, FACILITIES, DEBT, INTEREST & ADMISSIONS
   ===================================================================== */
function dormCapacity(facilities){
  const f = (facilities || (S && S.facilities) || {}).dorms;
  const lvl = f ? f.level : 1;
  return ACAD.dormCapacity[lvl] || 4;
}

function facilityUpgradeCost(id){
  if(!S || !S.facilities[id]) return 0;
  const base = S.facilities[id].upgradeCost || 0;
  const disc = S.director.activeRole === 'Researcher' ? (1 - BAL.economy.researcherDiscount) : 1;
  return Math.round(base * disc);
}

function upgradeFacility(id){
  if(!S) return false;
  const f = S.facilities[id];
  if(!f || f.level >= f.maxLevel) return false;
  const cost = facilityUpgradeCost(id);
  if(S.funds < cost){
    toast('Insufficient funds for expansion.');
    return false;
  }
  S.funds -= cost;
  f.level += 1;
  f.upgradeCost = Math.floor(f.upgradeCost * BAL.economy.facilityCostMult);
  logEvent(`LOGISTICS: ${f.name} expanded to Tier ${f.level} (-${fmtMoney(cost)}).`, 'success');
  save();
  render();
  return true;
}

function payDebt(amount){
  if(!S || S.debt <= 0) return 0;
  const maxPay = Math.min(Math.max(0, Math.floor(S.funds)), S.debt);
  const pay = Math.min(maxPay, Math.max(0, Math.floor(Number(amount) || 0)));
  if(pay <= 0){
    toast('Insufficient liquid funds to make a debt payment.');
    return 0;
  }
  S.funds -= pay;
  S.debt -= pay;
  S.stats.totalDebtPaid = (S.stats.totalDebtPaid || 0) + pay;
  logEvent(`DEBT LEDGER: Paid ${fmtMoney(pay)} toward the Academy debt. Remaining: ${fmtMoney(S.debt)}.`, 'success');

  if(S.debt <= 0 && !S.won){
    S.debt = 0;
    S.won = true;
    logEvent(`VICTORY: Aurelia Academy's debt has been cleared in Year ${S.year}, Day ${S.day}!`, 'success');
    save();
    render();
    showVictoryModal();
    return pay;
  }
  save();
  render();
  return pay;
}

function payAllDebt(){
  if(!S) return 0;
  return payDebt(Math.min(Math.floor(S.funds), S.debt));
}

function showVictoryModal(){
  modal(`<h2>Debt Cleared!</h2>
    <p class="story">The final wire clears the credit house ledger. For the first time since assuming command, Aurelia Academy belongs entirely to you — debt-free in Year ${S.year}, Day ${S.day}.</p>
    <div class="card">
      <div><b>Total Revenue Earned:</b> ${fmtMoney(S.stats.totalEarned)}</div>
      <div><b>Total Debt Repaid:</b> ${fmtMoney(S.stats.totalDebtPaid)}</div>
      <div><b>Enrolled Students:</b> ${S.students.length}</div>
    </div>
    <div class="row">
      <button class="primary" onclick="S.endless=true;save();closeModal();render()">Continue in Endless Mode</button>
      <button onclick="if(confirm('Start a brand new term?')) { closeModal(); restart(); }">Start New Term</button>
    </div>`, { lock: true });
}

function showGameOverModal(){
  modal(`<h2>Foreclosure</h2>
    <p class="story">Year ${BAL.economy.maxYears} has closed with ${fmtMoney(S.debt)} still owed to the heiress's credit syndicate. Foreclosure notices are pinned to the Academy gates.</p>
    <div class="card">
      <div><b>Total Debt Paid:</b> ${fmtMoney(S.stats.totalDebtPaid)}</div>
      <div><b>Total Interest Accrued:</b> ${fmtMoney(S.stats.interestAccrued)}</div>
    </div>
    <div class="row">
      <button class="primary" onclick="closeModal();restart()">Start New Academy Run</button>
    </div>`, { lock: true });
}

function applyWeeklyInterest(){
  if(!S || S.debt <= 0 || S.won) return 0;
  const interest = Math.round(S.debt * BAL.economy.weeklyInterestRate);
  S.debt += interest;
  S.stats.interestAccrued = (S.stats.interestAccrued || 0) + interest;
  return interest;
}

function applicantQuality(){
  if(!S) return 25;
  const bureau = S.facilities.bureau ? S.facilities.bureau.level : 1;
  const recBonus = S.director.activeRole === 'Recruiter' ? BAL.economy.recruiterQualityBonus : 0;
  return Math.round(18 + bureau * 6 + (S.reputation.academic || 0) * 0.22 + recBonus);
}

function generateApplicants(){
  const count = 10 + (S && S.director.activeRole === 'Recruiter' ? BAL.economy.recruiterExtraApplicants : 0);
  const q = applicantQuality();
  const list = [];
  if(SET.libraryInPool && Array.isArray(LIB) && LIB.length){
    const enrolledNames = new Set((S ? S.students : []).map(x => x.name.toLowerCase()));
    const pool = shuffle(LIB.filter(x => !enrolledNames.has(String(x.name || '').toLowerCase()))).slice(0, 2);
    pool.forEach(tpl => {
      const copy = ensureStudent(clone(tpl));
      copy.id = uid();
      copy.fatigue = 0;
      copy.depravity = 0;
      copy.year = 1;
      copy.clubRole = 'None';
      copy.serviceFocus = 'auto';
      copy.fromLibrary = true;
      list.push(copy);
    });
  }
  while(list.length < count){
    list.push(genStudent(q));
  }
  return list;
}

function refreshApplicants(free){
  if(!S) return;
  const cost = free ? 0 : BAL.economy.applicantRefreshCost;
  if(cost > 0 && S.funds < cost){
    toast(`Refreshing admissions costs ${fmtMoney(cost)}.`);
    return;
  }
  if(cost > 0) S.funds -= cost;
  S.applicants = generateApplicants();
  if(free) S.semesterRefreshed = true;
  logEvent(`ADMISSIONS: Refreshed candidate queue (${S.applicants.length} dossiers${cost ? `, -${fmtMoney(cost)}` : ''}).`, 'info');
  save();
  render();
}

function enrollApplicant(id){
  if(!S) return false;
  const capMax = dormCapacity();
  if(S.students.length >= capMax){
    toast(`Dorm capacity (${capMax}) is full. Upgrade Student Dorms first.`);
    return false;
  }
  const idx = S.applicants.findIndex(a => a.id === id);
  if(idx < 0) return false;
  const stu = ensureStudent(S.applicants.splice(idx, 1)[0]);
  S.students.push(stu);
  if(!S.protocolTargetId) S.protocolTargetId = stu.id;
  logEvent(`ENROLLMENT: ${stu.name} (${stu.major}) signed an academy contract.`, 'success');
  save();
  render();
  return true;
}

function dismissStudent(id){
  if(!S) return false;
  const idx = S.students.findIndex(x => x.id === id);
  if(idx < 0) return false;
  const stu = S.students[idx];
  S.students.splice(idx, 1);
  if(S.protocolTargetId === id){
    S.protocolTargetId = S.students[0] ? S.students[0].id : '';
  }
  logEvent(`PERSONNEL: Dismissed ${stu.name} from Aurelia Academy.`, 'warning');
  if(SHEET === id) closeModal();
  save();
  render();
  return true;
}
