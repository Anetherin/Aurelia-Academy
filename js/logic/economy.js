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
  S.cycleDebtPaid = (S.cycleDebtPaid || 0) + pay;
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

function mandatedPaymentAmount(cycle){
  const mp = BAL.economy.mandatedPayments || {};
  const sched = Array.isArray(mp.schedule) && mp.schedule.length ? mp.schedule : [5000];
  const idx = Math.max(1, Number(cycle) || 1) - 1;
  const raw = idx < sched.length
    ? sched[idx]
    : sched[sched.length - 1] + (mp.extraStepAfterTable || 15000) * (idx - sched.length + 1);
  return S ? Math.min(S.debt, raw) : raw;
}

function mandatedRemainingDue(){
  if(!S || S.debt <= 0 || S.won) return 0;
  const target = mandatedPaymentAmount(S.paymentCycle || 1);
  return Math.max(0, Math.min(S.debt, target - (S.cycleDebtPaid || 0)));
}

function daysUntilMandatedPayment(){
  if(!S) return 0;
  return Math.max(0, (S.nextPaymentDay || 14) - (S.day || 1));
}

function processMandatedPayment(addHL, prevDay){
  if(!S || S.debt <= 0 || S.won) return;
  const mp = BAL.economy.mandatedPayments || {};
  const cycle = S.paymentCycle || 1;
  const due = mandatedRemainingDue();
  if(due <= 0){
    addHL({
      kind: 'payment',
      title: `Syndicate Installment #${cycle} Satisfied`,
      text: `Your voluntary debt repayments this cycle already covered the scheduled ${fmtMoney(mandatedPaymentAmount(cycle))} installment.`
    });
    logEvent(`INSTALLMENT #${cycle}: Covered ahead of schedule by voluntary repayments.`, 'success');
  } else if(S.funds >= due){
    S.funds -= due;
    S.debt -= due;
    S.stats.totalDebtPaid = (S.stats.totalDebtPaid || 0) + due;
    addHL({
      kind: 'payment',
      title: `Syndicate Installment #${cycle} Paid (-${fmtMoney(due)})`,
      text: `Collected ${fmtMoney(due)} toward the Academy's debt ledger. Remaining debt: ${fmtMoney(Math.max(0, S.debt))}.`
    });
    logEvent(`INSTALLMENT #${cycle}: Collected ${fmtMoney(due)} (Remaining debt: ${fmtMoney(Math.max(0, S.debt))}).`, 'success');
    if(S.debt <= 0){
      S.debt = 0;
      S.won = true;
      logEvent(`VICTORY: Aurelia Academy's debt has been cleared in Year ${S.year}, Day ${S.day}!`, 'success');
    }
  } else {
    const partial = Math.max(0, Math.min(Math.floor(S.funds), due));
    if(partial > 0){
      S.funds -= partial;
      S.debt -= partial;
      S.stats.totalDebtPaid = (S.stats.totalDebtPaid || 0) + partial;
    }
    const shortfall = due - partial;
    const fee = Math.max(mp.lateFeeMin || 2500, Math.round(shortfall * (mp.lateFeeRate || 0.25)));
    S.debt += fee;
    S.stats.interestAccrued = (S.stats.interestAccrued || 0) + fee;
    S.missedPayments = (S.missedPayments || 0) + 1;
    S.reputation.academic = clamp(S.reputation.academic - 5);
    S.reputation.refinement = clamp(S.reputation.refinement - 5);
    S.reputation.infamy = clamp(S.reputation.infamy + 5);
    const maxMissed = mp.maxMissed || 3;
    const partialMsg = partial > 0
      ? `Paid ${fmtMoney(partial)} partially, leaving ${fmtMoney(shortfall)} unpaid.`
      : `Unable to cover the ${fmtMoney(due)} installment.`;
    addHL({
      kind: 'incident',
      title: `Missed Installment #${cycle} (Strike ${S.missedPayments}/${maxMissed})`,
      text: `${partialMsg} The credit syndicate added a ${fmtMoney(fee)} penalty to your debt and damaged Academy standing (-5 Prestige/Refinement, +5 Infamy).`
    });
    logEvent(`MISSED INSTALLMENT #${cycle}: ${partialMsg} Penalty +${fmtMoney(fee)} (Strike ${S.missedPayments}/${maxMissed}).`, 'error');
    if(S.missedPayments >= maxMissed){
      S.over = true;
      S.foreclosureReason = 'missed_payments';
    }
  }
  S.paymentCycle = cycle + 1;
  S.nextPaymentDay = (S.nextPaymentDay || prevDay || S.day) + (mp.intervalDays || 14);
  S.cycleDebtPaid = 0;
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
  const maxMissed = (BAL.economy.mandatedPayments && BAL.economy.mandatedPayments.maxMissed) || 3;
  const reasonText = S.foreclosureReason === 'missed_payments'
    ? `After ${S.missedPayments} missed mandated syndicate installments (limit ${maxMissed}), the credit syndicate seized Aurelia Academy with ${fmtMoney(S.debt)} still unpaid.`
    : `Year ${BAL.economy.maxYears} has closed with ${fmtMoney(S.debt)} still owed to the heiress's credit syndicate. Foreclosure notices are pinned to the Academy gates.`;
  modal(`<h2>Foreclosure</h2>
    <p class="story">${reasonText}</p>
    <div class="card">
      <div><b>Total Debt Paid:</b> ${fmtMoney(S.stats.totalDebtPaid)}</div>
      <div><b>Total Interest &amp; Penalties:</b> ${fmtMoney(S.stats.interestAccrued)}</div>
      <div><b>Missed Installments:</b> ${S.missedPayments || 0} / ${maxMissed}</div>
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
  const dirSoc = (S.director.aptitudes && S.director.aptitudes.social) || 0;
  return Math.round(18 + bureau * 6 + (S.reputation.academic || 0) * 0.22 + recBonus + dirSoc * 0.1);
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
  if(typeof autoWriteBackstory === 'function') autoWriteBackstory(stu);
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
