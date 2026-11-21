'use strict';
/* =====================================================================
   4-PERIOD DAILY SIMULATION (Morning -> Afternoon -> Evening -> Night)
   ===================================================================== */
function getTimeActionLabel(time){
  switch(time){
    case 'Morning': return 'Commence Morning Lectures';
    case 'Afternoon': return 'Begin Afternoon Specializations';
    case 'Evening': return 'Open Nightfall Operations';
    case 'Night': return 'Finalize Ledger & Rest';
    default: return 'Advance Period';
  }
}

function tierFromScore(score){
  const T = BAL.tiers.thresholds;
  if(score >= T.Excellent) return 'Excellent';
  if(score >= T.Good) return 'Good';
  if(score >= T.Decent) return 'Decent';
  if(score >= T.Poor) return 'Poor';
  return 'Fail';
}

function selectServiceForStudent(s){
  if(s.serviceFocus && s.serviceFocus !== 'auto' && SERVICES[s.serviceFocus]){
    return s.serviceFocus;
  }
  const pool = eligibleServices(s);
  const chosen = pool.length ? pool[pool.length - 1] : SERVICES.massage;
  return chosen.id;
}

function runServiceEncounter(s, serviceId, clubLevel, tipBonusMult, revBonusMult){
  const svc = SERVICES[serviceId] || SERVICES.massage;
  const relSkill = (s.skills && s.skills[svc.skill]) || 0;
  const reluctantPenalty = (s.depravity < svc.depravityMin && s.skills.compliance < svc.depravityMin + 25) ? 18 : 0;

  const perfScore =
    relSkill * 0.55 +
    (s.skills.seduction || 0) * 0.2 +
    (s.skills.compliance || 0) * 0.1 +
    (s.aptitudes.libido || 0) * 0.1 +
    (s.skills.lust || 0) * 0.05 +
    (s.skills.kissing || 0) * 0.08;

  const roll = rnd(-10, 10);
  const finalScore = perfScore + roll + clubLevel * 5 - reluctantPenalty;
  const tier = tierFromScore(finalScore);

  const revMult = BAL.tiers.revenueMult[tier] ?? 0;
  const tMult = BAL.tiers.tipMult[tier] ?? 0;

  const stuSocTipMult = 1 + ((s.aptitudes && s.aptitudes.social) || 0) * 0.002;
  const revenue = Math.round(svc.baseRevenue * revMult * revBonusMult * traitMul(s, 'revMul'));
  const baseTip = svc.baseRevenue * 0.22 + (s.skills.seduction || 0) * 4.5 + (s.skills.etiquette || 0) * 1.5 + (s.skills.kissing || 0) * 1.5 + (s.skills.lust || 0) * 1.0;
  const tip = Math.round(baseTip * tMult * tipBonusMult * stuSocTipMult * traitMul(s, 'tipMul') * rnd(0.85, 1.2));

  const custPool = (svc.customer && svc.customer[tier]) || [];
  const stuPool = (svc.student && svc.student[tier]) || [];
  const custText = (custPool.length ? pick(custPool) : `${s.name} completed a ${svc.label} session.`)
    .replace(/\{name\}/g, s.name)
    .replace(/\{tip\}/g, fmtMoney(tip));
  const stuText = (stuPool.length ? pick(stuPool) : '')
    .replace(/\{name\}/g, s.name);

  if(tier !== 'Fail'){
    const skGain = tier === 'Excellent' ? 1.4 : tier === 'Good' ? 1.0 : 0.6;
    s.skills[svc.skill] = clamp((s.skills[svc.skill] || 0) + skGain);
    s.skills.seduction = clamp((s.skills.seduction || 0) + skGain * 0.4);
    s.skills.lust = clamp((s.skills.lust || 0) + svc.lustGain * 0.5 * traitMul(s, 'lustMul'));
    s.depravity = clamp((s.depravity || 0) + svc.depravityGain * traitMul(s, 'depravityMul'));
  } else {
    s.skills.compliance = clamp((s.skills.compliance || 0) - 1.5);
  }

  return {
    serviceId: svc.id,
    serviceLabel: svc.label,
    tier,
    revenue,
    tip,
    custText,
    stuText,
    infamyGain: tier === 'Fail' ? 0 : svc.infamyGain
  };
}

function resolveNightVisit(s, stageId, opts = {}){
  const st = (NIGHT_VISITS && NIGHT_VISITS[stageId]) || (NIGHT_VISITS && NIGHT_VISITS.tease) || {
    id: 'tease',
    label: 'Private Tension',
    scene: 'night_visit',
    cloth: 'partial',
    activity: 'close-quarters tension',
    rewards: { compliance: 5, lust: 3, depravity: 2, seduction: 2 },
    suggestive: ['{name} visited your study after curfew.'],
    explicit: ['{name} visited your study after curfew.']
  };
  const bgId = S.director.bgId;
  const compBgMult = bgId === 'fixer' ? 1.2 : 1.0;
  const dirAuthMult = 1 + ((S.director.aptitudes && S.director.aptitudes.physicality) || 0) / 250;
  const dirLibMult = 1 + ((S.director.aptitudes && S.director.aptitudes.libido) || 0) / 200;
  const rew = st.rewards || {};

  s.skills.compliance = clamp((s.skills.compliance || 0) + (rew.compliance || BAL.arousal.nightVisitComplianceGain) * compBgMult * dirAuthMult * traitMul(s, 'compMul'));
  s.skills.lust = clamp((s.skills.lust || 0) + (rew.lust || BAL.arousal.nightVisitLustGain) * dirLibMult * traitMul(s, 'lustMul'));
  s.depravity = clamp((s.depravity || 0) + (rew.depravity || BAL.arousal.nightVisitDepravityGain) * dirLibMult * traitMul(s, 'depravityMul'));
  if(rew.seduction) s.skills.seduction = clamp((s.skills.seduction || 0) + rew.seduction * dirLibMult);
  if(rew.skill && rew.skillGain) s.skills[rew.skill] = clamp((s.skills[rew.skill] || 0) + rew.skillGain);

  s.stats.visits = (s.stats.visits || 0) + 1;
  S.stats.nightVisits = (S.stats.nightVisits || 0) + 1;
  s.lastPeriodScene = st.scene || 'night_visit';
  s.arousal = Math.max(BAL.arousal.nightVisitMin, s.arousal - BAL.arousal.nightVisitDrop);

  const tone = opts.tone || SET.nightVisitTone || 'explicit';
  const pool = (tone === 'suggestive' ? st.suggestive : st.explicit) || st.explicit || st.suggestive || [];
  const rawProse = pool.length ? pick(pool) : `${s.name} visited your executive study after lights out.`;
  const dirName = (S.director && S.director.name) || 'Vane';
  const prose = rawProse.replace(/\{name\}/g, s.name).replace(/\{director\}/g, dirName);

  const hlId = opts.hlId || `hl_${S.day}_Night_nv_${s.id}_${Date.now().toString(36)}`;
  return {
    id: hlId,
    kind: 'night_visit',
    title: `Late-Night Visit (${st.label}): ${s.name}`,
    text: prose,
    studentId: s.id,
    scene: st.scene || 'night_visit',
    cloth: st.cloth || 'under',
    expr: 'lost',
    stageId: st.id,
    aiKind: 'night_visit',
    aiExtra: { scene: st.scene || 'night_visit', cloth: st.cloth || 'under', activity: st.activity || 'private company' }
  };
}

function dismissNightVisit(s){
  s.fatigue = clamp((s.fatigue || 0) - (BAL.arousal.nightVisitDismissFatigueCut || 10));
  s.skills.compliance = clamp((s.skills.compliance || 0) + 1);
  s.arousal = Math.max(BAL.arousal.nightVisitMin, s.arousal - (BAL.arousal.nightVisitDismissArousalDrop || 35));
}

function advanceTime(){
  if(!S || S.over) return;

  const time = S.time;
  const times = ['Morning', 'Afternoon', 'Evening', 'Night'];
  const isNightTransition = time === 'Night';
  const nextTime = isNightTransition ? 'Morning' : times[(times.indexOf(time) + 1) % 4];
  const nextDay = isNightTransition ? S.day + 1 : S.day;
  const wasWon = !!S.won;

  const P_PROT = BAL.protocols;
  const protDef = (ACAD.protocols || []).find(p => p.id === S.selectedProtocol) || ACAD.protocols[0];
  let effectiveId = protDef.id;
  let periodMismatch = false;
  if(isNightTransition){
    effectiveId = 'rest';
  } else if(Array.isArray(protDef.periods) && !protDef.periods.includes(time)){
    effectiveId = 'rest';
    periodMismatch = true;
  } else if(effectiveId !== 'rest' && S.director.energy < (protDef.energy || 0)){
    effectiveId = 'rest';
    S.selectedProtocol = 'rest';
    logEvent(`DIRECTOR: Insufficient stamina for "${protDef.name}". Forced into Director's Recess.`, 'warning');
  }
  const activeProt = (ACAD.protocols || []).find(p => p.id === effectiveId) || ACAD.protocols[0];
  S.director.energy = clamp(S.director.energy - (activeProt.energy || 0), 0, S.director.maxEnergy);

  const highlights = [];
  const periodDetails = [];
  let hlCounter = 0;
  const addHL = (h) => highlights.push(Object.assign({ id: `hl_${S.day}_${time}_${hlCounter++}` }, h));

  let totalIncome = 0;
  let totalUpkeep = 0;
  let acadDelta = 0;
  let refinDelta = 0;
  let infamyDelta = 0;

  // Background, Director stats & active specialization multipliers
  const bgId = S.director.bgId;
  const dRole = S.director.activeRole;
  const dirInt = (S.director.aptitudes && S.director.aptitudes.intelligence) || 0;
  const dirPhys = (S.director.aptitudes && S.director.aptitudes.physicality) || 0;
  const dirSoc = (S.director.aptitudes && S.director.aptitudes.social) || 0;
  const dirLib = (S.director.aptitudes && S.director.aptitudes.libido) || 0;

  const intMult = 1 + (dirInt / 150) * (dRole === 'Academic' ? (1 + BAL.economy.academicIntBonus) : 1);
  const dirAuthMult = 1 + dirPhys / 250;
  const dirLibMult = 1 + dirLib / 200;
  const knowledgeMult = bgId === 'academic' ? 1.1 : 1.0;
  const compBgMult = bgId === 'fixer' ? 1.2 : 1.0;
  const etiqBgMult = bgId === 'noble' ? 1.15 : 1.0;
  const tipBgMult = bgId === 'noble' ? (1 + BAL.economy.nobleTipBonus) : 1.0;
  const managerRevMult = dRole === 'Manager' ? (1 + BAL.economy.managerRevenueBonus) : 1.0;

  // Execute global Director protocol effects
  if(effectiveId === 'hall_walk'){
    addHL({
      kind: 'protocol',
      title: 'Executive Protocol: Walking the Halls',
      text: `You inspect the academy corridors with calm, absolute authority. Every student straightens as you pass (+${P_PROT.hall_walk.compliance} Compliance, +${P_PROT.hall_walk.arousal} Arousal).`
    });
    logEvent('DIRECTOR: Walked the academy halls — discipline and tension rose across campus.', 'info');
  } else if(effectiveId === 'lead_seminar'){
    if(time === 'Morning' || time === 'Afternoon'){
      S.reputation.academic = clamp(S.reputation.academic + P_PROT.lead_seminar.acadRep);
      addHL({
        kind: 'protocol',
        title: 'Executive Protocol: Lead Academic Seminar',
        text: `You personally took the podium, elevating every lecture this period (+${P_PROT.lead_seminar.skillBonus} bonus skill gains, +${P_PROT.lead_seminar.acadRep} Academic Prestige).`
      });
      logEvent('DIRECTOR: Led a high-intensity academy seminar for all studying students.', 'success');
    } else {
      addHL({
        kind: 'protocol',
        title: 'Executive Protocol: Lead Academic Seminar',
        text: 'Prepared seminar syllabi and lecture notes for tomorrow\'s classes.'
      });
    }
  } else if(effectiveId === 'city_work'){
    const consultingPay = Math.round(
      P_PROT.city_work.basePay +
      dirInt * P_PROT.city_work.intPay +
      S.reputation.academic * P_PROT.city_work.acadPay
    );
    const repGain = P_PROT.city_work.acadRep || 0;
    if(repGain) S.reputation.academic = clamp(S.reputation.academic + repGain);
    totalIncome += consultingPay;
    addHL({
      kind: 'protocol',
      title: 'Executive Protocol: City Consulting',
      text: `You took a discreet off-campus advisory contract in the financial district, bringing ${fmtMoney(consultingPay)} into Academy reserves${repGain ? ` and +${repGain} Academic Prestige` : ''}.`
    });
    logEvent(`DIRECTOR: City Consulting earned ${fmtMoney(consultingPay)}${repGain ? ` (+${repGain} Prestige)` : ''}.`, 'success');
  } else if(effectiveId === 'personal_counseling' || effectiveId === 'intimate_guidance'){
    const target = S.students.find(x => x.id === S.protocolTargetId) || S.students[0];
    if(target){
      if(effectiveId === 'personal_counseling'){
        const pc = P_PROT.personal_counseling;
        target.fatigue = clamp(target.fatigue - pc.fatigueCut);
        target.skills.compliance = clamp(target.skills.compliance + pc.compliance * compBgMult * dirAuthMult * traitMul(target, 'compMul'));
        if(target.autoRest && target.autoResting && studentEnergy(target) >= BAL.fatigue.autoRestResumeEnergy){
          target.autoResting = false;
          logEvent(`AUTO-REST: ${target.name} recovered via counseling and resumed her schedule.`, 'info');
        }
        addHL({
          kind: 'protocol',
          title: `Targeted Counseling: ${target.name}`,
          text: `You met privately with ${target.name} in your office, easing her exhaustion (-${pc.fatigueCut} Fatigue) and reinforcing her loyalty (+${pc.compliance} Compliance).`,
          studentId: target.id,
          scene: 'counseling',
          cloth: 'dressed',
          expr: 'composed',
          aiKind: 'protocol',
          aiExtra: { scene: 'counseling', cloth: 'dressed', situation: 'one-on-one counseling session in your private study' }
        });
        logEvent(`DIRECTOR: Targeted Counseling with ${target.name} (-${pc.fatigueCut} fatigue, +Compliance).`, 'info');
      } else {
        const ig = P_PROT.intimate_guidance;
        target.skills.lust = clamp(target.skills.lust + ig.lust * dirLibMult * traitMul(target, 'lustMul'));
        target.skills.compliance = clamp(target.skills.compliance + ig.compliance * compBgMult * dirAuthMult * traitMul(target, 'compMul'));
        target.skills.seduction = clamp(target.skills.seduction + ig.seduction * dirLibMult);
        if(ig.kissing) target.skills.kissing = clamp((target.skills.kissing || 0) + ig.kissing * dirLibMult);
        target.arousal = clamp(target.arousal + ig.arousal);
        target.depravity = clamp(target.depravity + ig.depravity * dirLibMult * traitMul(target, 'depravityMul'));
        target.stats.visits = (target.stats.visits || 0) + 1;
        addHL({
          kind: 'protocol',
          title: `Intimate Guidance: ${target.name}`,
          text: `Behind locked study doors, you personally guided ${target.name} through hands-on discipline (+${ig.lust} Lust, +${ig.compliance} Compliance, +${ig.seduction} Seduction${ig.kissing ? `, +${ig.kissing} Kissing` : ''}, +${ig.depravity} Depravity).`,
          studentId: target.id,
          scene: 'intimate_guidance',
          cloth: 'partial',
          expr: 'lost',
          aiKind: 'protocol',
          aiExtra: { scene: 'intimate_guidance', cloth: 'partial', situation: 'intimate private guidance session behind locked doors' }
        });
        logEvent(`PRIVATE: Conducted Intimate Guidance with ${target.name}.`, 'private');
      }
    }
  } else if(effectiveId === 'vip_filtering'){
    addHL({
      kind: 'protocol',
      title: 'Executive Protocol: VIP Filtering',
      text: time === 'Evening'
        ? `You personally screened the Nightfall velvet rope (+${Math.round(P_PROT.vip_filtering.tipBonus * 100)}% tips, +${P_PROT.vip_filtering.extraPatron} VIP/Hostess patron, -${Math.round(P_PROT.vip_filtering.incidentCut * 100)}% incident risk).`
        : 'Reviewed tonight\'s high-society guest list ahead of Nightfall operations.'
    });
  } else {
    const restMsg = isNightTransition
      ? 'You retired for the night (+35 Director Stamina).'
      : periodMismatch
        ? `${protDef.name} only runs during ${protDef.periods.join('/')} — took Director's Recess instead (+35 Stamina).`
        : 'You stepped back to recover your stamina (+35 Energy).';
    addHL({
      kind: 'protocol',
      title: isNightTransition ? 'Executive Protocol: Night Rest' : "Executive Protocol: Director's Recess",
      text: restMsg
    });
  }

  // Evaluate Auto-Rest state transitions before daytime/evening work or Evening support buffs
  if(isNightTransition){
    S.pendingNightVisits = [];
  } else {
    S.students.forEach(s => {
      if(!s.autoRest && s.autoResting) s.autoResting = false;
      if(s.fatigue >= BAL.fatigue.collapseThreshold || !s.autoRest) return;
      if(!s.autoResting && studentEnergy(s) <= BAL.fatigue.autoRestLowEnergy){
        s.autoResting = true;
        periodDetails.push(`${s.name} entered Auto-Rest (Energy ${studentEnergy(s)}%).`);
        logEvent(`AUTO-REST: ${s.name} stepped back to recover (Energy ${studentEnergy(s)}%).`, 'info');
      } else if(s.autoResting && studentEnergy(s) >= BAL.fatigue.autoRestResumeEnergy){
        s.autoResting = false;
        periodDetails.push(`${s.name} finished Auto-Rest and resumed her schedule.`);
        logEvent(`AUTO-REST: ${s.name} recovered to ${studentEnergy(s)}% and resumed duty.`, 'info');
      }
    });
  }

  // Evening floor-wide support buffs (Bartender, Dancer, Singer, Security)
  let clubFloorTipMult = tipBgMult * (1 + (S.reputation.refinement || 0) * BAL.economy.refinementTipScale) * (1 + dirSoc * 0.002);
  let clubFloorRevMult = managerRevMult * (1 + (S.reputation.infamy || 0) * BAL.economy.infamyRevenueScale);
  let extraDrawFromDancers = 0;
  let securityPower = (bgId === 'fixer' ? 18 : 0) + dirPhys * 0.35;

  if(time === 'Evening'){
    if(effectiveId === 'vip_filtering') clubFloorTipMult *= (1 + P_PROT.vip_filtering.tipBonus);

    S.students.forEach(s => {
      if(s.fatigue >= BAL.fatigue.collapseThreshold || s.autoResting) return;
      if(s.clubRole === 'Bartender'){
        clubFloorTipMult += 0.08 + (s.skills.bartending / 400);
      } else if(s.clubRole === 'Dancer'){
        extraDrawFromDancers += s.skills.dancing >= 45 ? 1 : 0;
        clubFloorTipMult += 0.05;
      } else if(s.clubRole === 'Singer'){
        clubFloorTipMult += 0.09 + (s.skills.singing / 450);
      } else if(s.clubRole === 'Security'){
        const secScore = (s.skills.security * 0.6 + s.skills.fitness * 0.4) * traitMul(s, 'secMul') * (bgId === 'fixer' ? 1.2 : 1);
        securityPower += secScore;
      }
    });
  }

  // Per-student simulation
  const nStu = Math.max(1, S.students.length);

  S.students.forEach(s => {
    if(effectiveId === 'hall_walk'){
      s.skills.compliance = clamp(s.skills.compliance + P_PROT.hall_walk.compliance * compBgMult * dirAuthMult * traitMul(s, 'compMul'));
      s.arousal = clamp(s.arousal + P_PROT.hall_walk.arousal);
    }

    // Night transition: Night Visits + Sleep recovery + Clear daytime scene lock
    if(isNightTransition){
      s.lastPeriodScene = null;
      if(s.arousal > BAL.arousal.nightVisitThreshold){
        const visitChance = clamp((s.skills.compliance + 10 + (s.skills.lust || 0) * 0.15) / 100, 0.1, 0.95);
        if(Math.random() < visitChance){
          if(SET.nightVisitMode === 'prompt'){
            if(!S.pendingNightVisits.includes(s.id)) S.pendingNightVisits.push(s.id);
          } else {
            const stages = eligibleNightVisitStages(s);
            const stageId = SET.nightVisitTone === 'suggestive'
              ? 'tease'
              : ((stages[stages.length - 1] && stages[stages.length - 1].id) || 'tease');
            const hl = resolveNightVisit(s, stageId, { hlId: `hl_${S.day}_${time}_${hlCounter++}` });
            highlights.push(hl);
            logEvent(`PRIVATE VISIT (${stageId}): ${s.name} visited your study late at night (+Compliance, +Lust).`, 'private');
          }
        } else {
          s.arousal = Math.max(BAL.arousal.nightVisitMin, s.arousal - BAL.arousal.nightVisitDrop);
        }
      }

      const rec = BAL.fatigue.nightRecoveryBase + S.facilities.living_standards.level * BAL.fatigue.nightRecoveryPerLevel;
      s.fatigue = clamp(s.fatigue - rec);
      if(s.autoRest && s.autoResting && studentEnergy(s) >= BAL.fatigue.autoRestResumeEnergy){
        s.autoResting = false;
        logEvent(`AUTO-REST: ${s.name} rested overnight to ${studentEnergy(s)}% and resumed duty.`, 'info');
      }
      return;
    }

    // Check collapse BEFORE daytime / evening shift
    if(s.fatigue >= BAL.fatigue.collapseThreshold){
      s.fatigue = clamp(s.fatigue - BAL.fatigue.collapseRecovery);
      s.skills.compliance = clamp(s.skills.compliance - BAL.fatigue.collapseCompliancePenalty);
      s.clubRole = 'None';
      s.lastPeriodScene = 'class_Rest';
      addHL({
        kind: 'collapse',
        title: `Exhaustion Collapse: ${s.name}`,
        text: `${s.name} collapsed from overwork during ${time} and was carried to the infirmary (taken off Club duty to recover).`,
        studentId: s.id,
        scene: 'class_Rest',
        cloth: 'dressed',
        expr: 'Fail'
      });
      logEvent(`CRITICAL: ${s.name} collapsed from exhaustion during ${time}.`, 'error');
      return;
    }

    const stuFatigueRes = 1 - ((s.aptitudes && s.aptitudes.physicality) || 0) / 400;

    // Daytime classes (Morning & Afternoon)
    if(time === 'Morning' || time === 'Afternoon'){
      s.lastPeriodScene = null;
      if(s.autoResting){
        s.fatigue = clamp(s.fatigue - BAL.fatigue.studyRestRecovery);
        s.arousal = clamp(s.arousal - BAL.arousal.restDrop);
        s.lastPeriodScene = 'class_Rest';
        periodDetails.push(`${s.name} [Auto-Rest]: Recovered ${BAL.fatigue.studyRestRecovery} Fatigue (Energy ${studentEnergy(s)}%).`);
        if(s.autoRest && studentEnergy(s) >= BAL.fatigue.autoRestResumeEnergy){
          s.autoResting = false;
          logEvent(`AUTO-REST: ${s.name} recovered to ${studentEnergy(s)}% and resumed duty.`, 'info');
        }
        return;
      }

      const focus = ACAD.classes[studentStudyFocus(s, time)] || ACAD.classes.Academics;
      if(focus.id === 'Rest'){
        s.fatigue = clamp(s.fatigue - BAL.fatigue.studyRestRecovery);
        s.arousal = clamp(s.arousal - BAL.arousal.restDrop);
        periodDetails.push(`${s.name} rested in the infirmary lounge (-${BAL.fatigue.studyRestRecovery} Fatigue).`);
        return;
      }

      const fatGain = BAL.fatigue.classGain * stuFatigueRes * traitMul(s, 'fatigueMul');
      s.fatigue = clamp(s.fatigue + fatGain);

      let arousalGain = BAL.arousal.baseTick + (s.aptitudes.libido / BAL.arousal.libidoDiv) + traitAdd(s, 'arousalAdd');
      if(focus.id === 'Seduction') arousalGain += BAL.arousal.seductionClassBonus;
      if(focus.id === 'Intimacy') arousalGain += BAL.arousal.intimacyClassBonus;
      s.arousal = clamp(s.arousal + arousalGain);

      const facLvl = (S.facilities[focus.facility] && S.facilities[focus.facility].level) || 1;
      const seminarBonus = effectiveId === 'lead_seminar' ? P_PROT.lead_seminar.skillBonus : 0;
      const stuIntMult = 0.9 + ((s.aptitudes && s.aptitudes.intelligence) || 25) / 250;
      const rawGain = (rnd(0.8, 2.6) + facLvl * 0.9 + seminarBonus) * intMult * stuIntMult * traitMul(s, 'classMul');

      const trained = [];
      (focus.skills || []).forEach(sk => {
        let m = 1;
        if(sk === 'knowledge') m *= knowledgeMult;
        if(sk === 'etiquette') m *= etiqBgMult;
        if(sk === 'security') m *= compBgMult;
        const g = rawGain * m;
        s.skills[sk] = clamp((s.skills[sk] || 0) + g);
        trained.push(`${SKILL_LABELS[sk] || sk} +${g.toFixed(1)}`);
      });

      if(focus.rep === 'academic') acadDelta += (rawGain / (nStu * 1.4)) * (1 + ((s.skills && s.skills.knowledge) || 0) / 200);
      else if(focus.rep === 'refinement') refinDelta += rawGain / (nStu * 1.4);
      else if(focus.rep === 'infamy') infamyDelta += rawGain / (nStu * 3.0);

      if(trained.length){
        periodDetails.push(`${s.name} [${time} · ${focus.label}]: ${trained.join(', ')}.`);
      }
      return;
    }

    // Evening Nightfall Operations
    if(time === 'Evening'){
      s.lastPeriodScene = null;
      s.arousal = clamp(s.arousal + BAL.arousal.baseTick + (s.aptitudes.libido / BAL.arousal.libidoDiv) + traitAdd(s, 'arousalAdd'));

      if(s.autoResting){
        s.fatigue = clamp(s.fatigue - BAL.fatigue.eveningRestRecovery);
        s.lastPeriodScene = 'night_rest';
        periodDetails.push(`${s.name} [Auto-Rest]: Took Evening off to recover (Energy ${studentEnergy(s)}%).`);
        if(s.autoRest && studentEnergy(s) >= BAL.fatigue.autoRestResumeEnergy){
          s.autoResting = false;
          logEvent(`AUTO-REST: ${s.name} recovered to ${studentEnergy(s)}% and resumed duty.`, 'info');
        }
        return;
      }

      if(s.clubRole === 'None' || canDoRole(s.clubRole, S.facilities)){
        s.fatigue = clamp(s.fatigue - BAL.fatigue.eveningRestRecovery);
        periodDetails.push(`${s.name} [Off Duty]: Rested during Evening (Energy ${studentEnergy(s)}%).`);
        return;
      }

      const roleDef = ACAD.roles[s.clubRole];
      const clubLvl = S.facilities.nightclub.level;
      const filterExtra = effectiveId === 'vip_filtering' ? P_PROT.vip_filtering.extraPatron : 0;
      const eveFatRes = stuFatigueRes * (1 - ((s.skills && s.skills.fitness) || 0) / 500);
      const stuSocTipMult = 1 + ((s.aptitudes && s.aptitudes.social) || 0) * 0.002;

      // Support Roles: Bartender, Dancer, Singer, Security
      if(roleDef.kind === 'support'){
        const roleSkillMap = {
          Bartender: (s.skills.bartending * 0.65 + s.skills.conversation * 0.35),
          Dancer: (s.skills.dancing * 0.65 + s.skills.fitness * 0.35),
          Singer: (s.skills.singing * 0.7 + s.skills.etiquette * 0.3),
          Security: (s.skills.security * 0.65 + s.skills.fitness * 0.35) * traitMul(s, 'secMul') * (bgId === 'fixer' ? 1.2 : 1)
        };
        const score = (roleSkillMap[s.clubRole] || 30) + clubLvl * 5 + rnd(-8, 8);
        const tier = tierFromScore(score);
        const tierPayMult = BAL.tiers.revenueMult[tier] || 0.5;
        const pay = Math.round(roleDef.basePay * tierPayMult * clubFloorRevMult * traitMul(s, 'revMul'));
        const tip = (s.clubRole === 'Dancer' || s.clubRole === 'Singer')
          ? Math.round((45 + s.skills.seduction * 2) * (BAL.tiers.tipMult[tier] || 0.2) * clubFloorTipMult * stuSocTipMult * traitMul(s, 'tipMul'))
          : 0;

        totalIncome += pay + tip;
        s.stats.earnings = (s.stats.earnings || 0) + pay + tip;
        s.fatigue = clamp(s.fatigue + BAL.fatigue.supportRoleGain * eveFatRes * traitMul(s, 'fatigueMul'));

        if(s.clubRole === 'Bartender') s.skills.bartending = clamp(s.skills.bartending + 1.0);
        if(s.clubRole === 'Dancer'){ s.skills.dancing = clamp(s.skills.dancing + 1.1); refinDelta += 0.35 / nStu; }
        if(s.clubRole === 'Singer'){ s.skills.singing = clamp(s.skills.singing + 1.1); refinDelta += 0.55 / nStu; }
        if(s.clubRole === 'Security') s.skills.security = clamp(s.skills.security + 1.1);

        const pool = (ROLE_STORIES[s.clubRole] && (ROLE_STORIES[s.clubRole][tier] || ROLE_STORIES[s.clubRole].Decent)) || [];
        const line = (pool.length ? pick(pool) : `${s.name} worked a ${roleDef.label} shift.`)
          .replace(/\{name\}/g, s.name)
          .replace(/\{tip\}/g, fmtMoney(tip));

        addHL({
          kind: 'club',
          title: `${roleDef.label}: ${s.name} (${tier} — +${fmtMoney(pay + tip)})`,
          text: line,
          studentId: s.id,
          scene: roleDef.scene,
          cloth: 'dressed',
          expr: tier
        });
        logEvent(`[${s.name}] ${roleDef.label} (${tier}): +${fmtMoney(pay + tip)}.`, tier === 'Fail' ? 'tier_fail' : 'success');
        return;
      }

      // Hostess Role
      if(roleDef.kind === 'hostess'){
        const patrons = 1 + Math.floor(clubLvl / 2) + (Math.random() > 0.45 ? 1 : 0) + (extraDrawFromDancers > 0 ? 1 : 0) + filterExtra;
        let shiftPay = 0;
        let shiftTips = 0;
        let bestTier = 'Fail';
        let lastLine = '';
        const tierOrder = ['Fail', 'Poor', 'Decent', 'Good', 'Excellent'];

        for(let i = 0; i < patrons; i++){
          const hScore = s.skills.conversation * 0.4 + s.skills.etiquette * 0.35 + s.skills.seduction * 0.25 + (s.skills.kissing || 0) * 0.08 + clubLvl * 5 + rnd(-10, 10);
          const tier = tierFromScore(hScore);
          if(tierOrder.indexOf(tier) > tierOrder.indexOf(bestTier)) bestTier = tier;
          const pPay = Math.round(roleDef.basePay * (BAL.tiers.revenueMult[tier] || 0) * clubFloorRevMult * traitMul(s, 'revMul'));
          const pTip = Math.round((30 + s.skills.conversation * 2.4 + s.skills.seduction * 1.5 + (s.skills.knowledge || 0) * 0.6) * (BAL.tiers.tipMult[tier] || 0) * clubFloorTipMult * stuSocTipMult * traitMul(s, 'tipMul'));
          shiftPay += pPay;
          shiftTips += pTip;
          s.fatigue = clamp(s.fatigue + BAL.fatigue.patronGain * eveFatRes * traitMul(s, 'fatigueMul'));
          const pool = (ROLE_STORIES.Hostess && ROLE_STORIES.Hostess[tier]) || [];
          lastLine = (pool.length ? pick(pool) : `${s.name} entertained a VIP table.`)
            .replace(/\{name\}/g, s.name)
            .replace(/\{tip\}/g, fmtMoney(pTip));
        }
        s.skills.conversation = clamp(s.skills.conversation + 0.9);
        s.skills.etiquette = clamp(s.skills.etiquette + 0.6 * etiqBgMult);
        refinDelta += 0.3 / nStu;
        totalIncome += shiftPay + shiftTips;
        s.stats.earnings = (s.stats.earnings || 0) + shiftPay + shiftTips;
        s.stats.patrons = (s.stats.patrons || 0) + patrons;

        addHL({
          kind: 'club',
          title: `Hostess: ${s.name} (${patrons} patrons — +${fmtMoney(shiftPay + shiftTips)})`,
          text: lastLine,
          studentId: s.id,
          scene: 'job_Hostess',
          cloth: 'dressed',
          expr: bestTier
        });
        logEvent(`[${s.name}] Hostess (${patrons} patrons): +${fmtMoney(shiftPay + shiftTips)}.`, bestTier === 'Fail' ? 'tier_fail' : 'success');
        return;
      }

      // Private Service (VIP Intimate Services: massage, manual, oral, vaginal, anal)
      if(roleDef.kind === 'vip'){
        const patrons = 1 + Math.floor(clubLvl / 2) + (Math.random() > 0.5 ? 1 : 0) + filterExtra;
        let shiftRev = 0;
        let shiftTips = 0;
        let bestEnc = null;
        const tierOrder = ['Fail', 'Poor', 'Decent', 'Good', 'Excellent'];

        for(let i = 0; i < patrons; i++){
          const svcId = selectServiceForStudent(s);
          const enc = runServiceEncounter(s, svcId, clubLvl, clubFloorTipMult, clubFloorRevMult);
          shiftRev += enc.revenue;
          shiftTips += enc.tip;
          infamyDelta += enc.infamyGain / nStu;
          s.fatigue = clamp(s.fatigue + BAL.fatigue.patronGain * eveFatRes * traitMul(s, 'fatigueMul'));
          if(!bestEnc || tierOrder.indexOf(enc.tier) >= tierOrder.indexOf(bestEnc.tier)) bestEnc = enc;
          periodDetails.push(`[${s.name}] Patron ${i + 1} (${enc.serviceLabel} · ${enc.tier}): +${fmtMoney(enc.revenue + enc.tip)} — ${enc.custText}`);
        }

        totalIncome += shiftRev + shiftTips;
        s.stats.earnings = (s.stats.earnings || 0) + shiftRev + shiftTips;
        s.stats.patrons = (s.stats.patrons || 0) + patrons;

        if(bestEnc){
          const svcDef = SERVICES[bestEnc.serviceId] || SERVICES.massage;
          const sceneKey = 'svc:' + bestEnc.serviceId;
          s.lastPeriodScene = sceneKey;
          addHL({
            kind: 'vip',
            title: `${bestEnc.serviceLabel}: ${s.name} (${patrons} patrons — +${fmtMoney(shiftRev + shiftTips)})`,
            text: bestEnc.custText,
            subtext: bestEnc.stuText,
            studentId: s.id,
            scene: sceneKey,
            cloth: (svcDef.image && svcDef.image.cloth) || 'partial',
            expr: bestEnc.tier,
            aiKind: 'service',
            aiExtra: {
              scene: sceneKey,
              cloth: (svcDef.image && svcDef.image.cloth) || 'partial',
              service: bestEnc.serviceLabel,
              tier: bestEnc.tier
            }
          });
          logEvent(`[${s.name}] ${bestEnc.serviceLabel} (${patrons} patrons, best ${bestEnc.tier}): +${fmtMoney(shiftRev + shiftTips)}.`, bestEnc.tier === 'Fail' ? 'tier_fail' : 'success');
        }
      }
    }
  });

  // Evening Infamy Incident Check
  if(time === 'Evening' && S.reputation.infamy > 5){
    let incChance = Math.min(
      BAL.reputation.incidentMaxChance,
      BAL.reputation.incidentBaseChance + S.reputation.infamy * BAL.reputation.incidentPerInfamy
    );
    if(effectiveId === 'vip_filtering') incChance *= (1 - P_PROT.vip_filtering.incidentCut);
    const gymDef = S.facilities.gym.level * 6;
    const stopChance = clamp((securityPower + gymDef) / 140, 0, 0.9);
    if(Math.random() < incChance){
      if(Math.random() < stopChance){
        S.stats.incidentsHandled = (S.stats.incidentsHandled || 0) + 1;
        const msg = pick(INCIDENTS_DATA.prevented);
        addHL({ kind: 'incident', title: 'Security Intercepted Club Incident', text: msg });
        logEvent(`SECURITY: ${msg}`, 'success');
      } else {
        S.stats.incidentsMissed = (S.stats.incidentsMissed || 0) + 1;
        const penalty = Math.round(BAL.reputation.incidentPenaltyBase + S.reputation.infamy * BAL.reputation.incidentPenaltyPerInfamy);
        totalUpkeep += penalty;
        const msg = pick(INCIDENTS_DATA.unhandled).replace(/\{penalty\}/g, fmtMoney(penalty));
        addHL({ kind: 'incident', title: `Club Incident (-${fmtMoney(penalty)})`, text: msg });
        logEvent(`INCIDENT: ${msg}`, 'error');
      }
    }
  }

  // Nightly Academy Upkeep & Weekly Debt Interest & Mandated Payments & Calendar Progression
  if(isNightTransition){
    totalUpkeep += BAL.economy.dailyUpkeepBase + S.students.length * BAL.economy.dailyUpkeepPerStudent;
  }

  const net = totalIncome - totalUpkeep;
  S.funds = Math.floor(S.funds + net);
  if(totalIncome > 0) S.stats.totalEarned = (S.stats.totalEarned || 0) + totalIncome;

  if(time === 'Evening' && totalIncome > 0){
    logEvent(`NIGHTFALL SUMMARY: Club operations grossed ${fmtMoney(totalIncome)}.`, 'success');
  }
  if(isNightTransition && totalUpkeep > 0){
    logEvent(`DAILY LEDGER: Campus upkeep cost ${fmtMoney(totalUpkeep)}.`, 'info');
  }

  // Update Reputation
  S.reputation.academic = clamp(S.reputation.academic + acadDelta - BAL.reputation.decayAcademic);
  S.reputation.refinement = clamp(S.reputation.refinement + refinDelta - BAL.reputation.decayRefinement);
  S.reputation.infamy = clamp(S.reputation.infamy + infamyDelta - BAL.reputation.decayInfamy);

  // Advance clock & calendar
  const prevDay = S.day;
  S.time = nextTime;
  S.day = nextDay;

  if(isNightTransition){
    // Year / Term calculation
    const newYear = Math.floor((S.day - 1) / BAL.economy.daysPerYear) + 1;
    const dayInYear = (S.day - 1) % BAL.economy.daysPerYear;
    const newTerm = dayInYear < BAL.economy.semesterDays ? 1 : 2;
    if(newYear > S.year){
      S.year = newYear;
      S.students.forEach(st => { st.year = (st.year || 1) + 1; });
      logEvent(`ACADEMIC YEAR ${S.year}: Returning students advanced a year.`, 'success');
    }
    if(newTerm !== S.term || (newYear > 1 && dayInYear === 0)){
      S.term = newTerm;
      S.semesterRefreshed = false;
      S.applicants = generateApplicants();
      logEvent(`NEW SEMESTER (Year ${S.year} Term ${S.term}): Fresh admissions dossiers arrived.`, 'info');
    }

    // Weekly interest every 7 days (after grace period)
    if(prevDay % 7 === 0 && S.debt > 0 && !S.won){
      const grace = BAL.economy.interestGraceDays || 0;
      if(prevDay <= grace){
        addHL({
          kind: 'interest',
          title: 'Grace Period Ending',
          text: `Your ${grace}-day interest-free grace period has ended. Weekly ${(BAL.economy.weeklyInterestRate * 100).toFixed(1)}% debt interest begins next week.`
        });
        logEvent(`GRACE PERIOD: No interest charged on Day ${prevDay}. Weekly ${(BAL.economy.weeklyInterestRate * 100).toFixed(1)}% interest begins next week.`, 'warning');
      } else {
        const interest = applyWeeklyInterest();
        if(interest > 0){
          addHL({
            kind: 'interest',
            title: `Weekly Debt Interest (+${fmtMoney(interest)})`,
            text: `The credit syndicate applied ${(BAL.economy.weeklyInterestRate * 100).toFixed(1)}% weekly interest. Debt now stands at ${fmtMoney(S.debt)}.`
          });
          logEvent(`INTEREST: +${fmtMoney(interest)} added to Academy debt (Total: ${fmtMoney(S.debt)}).`, 'warning');
        }
      }
    }

    // Mandated Syndicate Installments
    if(prevDay >= (S.nextPaymentDay || 14) && S.debt > 0 && !S.won){
      processMandatedPayment(addHL, prevDay);
    }

    // Check Year 4 deadline foreclosure
    if(!S.won && !S.endless && S.year > BAL.economy.maxYears && S.debt > 0){
      S.over = true;
      S.foreclosureReason = S.foreclosureReason || 'deadline';
    }
  }

  S.lastPeriod = {
    day: prevDay,
    time,
    nextDay: S.day,
    nextTime: S.time,
    income: totalIncome,
    upkeep: totalUpkeep,
    net,
    highlights,
    details: periodDetails
  };

  save();
  render();
  if(isNightTransition){
    const nv = highlights.some(h => h.kind === 'night_visit') || (S.pendingNightVisits && S.pendingNightVisits.length > 0);
    toast(`Day ${S.day} begins${nv ? ' · Night Visit logged' : ''}`);
  } else if(time === 'Evening'){
    toast(`Evening D${prevDay} complete · ${net >= 0 ? '+' : ''}${fmtMoney(net)} net`);
  } else {
    toast(`${time} D${prevDay} complete${totalIncome ? ' · +' + fmtMoney(totalIncome) : ''}`);
  }
  if(S.over){
    showGameOverModal();
  } else if(!wasWon && S.won){
    showVictoryModal();
  } else if(S.pendingNightVisits && S.pendingNightVisits.length && typeof openNextNightVisitModal === 'function'){
    openNextNightVisitModal();
  }
}
