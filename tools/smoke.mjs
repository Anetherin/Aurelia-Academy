// Headless Playwright smoke test for Aurelia Academy.
// Usage: node tools/smoke.mjs [days]
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import http from 'node:http';

const require = createRequire(import.meta.url);
let pw;
for (const m of [
  'playwright',
  process.env.PLAYWRIGHT_PATH,
  '/opt/node-tools/node_modules/playwright',
  path.resolve(process.execPath, '../../lib/node_modules/playwright')
]) {
  if (!m) continue;
  try { pw = require(m); break; } catch {}
}
if (!pw) throw new Error('Cannot find module playwright');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DAYS = +process.argv[2] || 14;

const BOT = `async (days) => {
  await new Promise(r => {
    const t = setInterval(() => {
      if (typeof SETUP !== 'undefined' && (SETUP || S)) { clearInterval(t); r(); }
    }, 40);
  });

  const assert = (cond, msg) => { if (!cond) throw new Error('Assertion failed: ' + msg); };

  // 1. Setup flow + JSON dossier import
  store.del(KEY_SAVE);
  startSetup();
  SETUP.name = 'Hawthorne';
  SETUP.bgId = 'fixer';
  finishDirectorSetup();
  assert(SETUP.step === 'admissions', 'expected admissions setup step');

  openImportDossierModal(true);
  $('#impDossier').value = JSON.stringify({
    name: "Clara O'Neill",
    age: 21,
    major: 'Companion',
    description: 'Imported test dossier.',
    traits: ['Sultry', 'Cunning']
  });
  doImportDossier(true);
  assert(SETUP.applicants[0].name === "Clara O'Neill", 'dossier import failed');

  previewSetupApplicant(SETUP.applicants[0].id);
  assert(!$('#modal').classList.contains('hidden'), 'setup preview modal did not open');
  closeModal();

  toggleSetupSelect(SETUP.applicants[0].id);
  toggleSetupSelect(SETUP.applicants[1].id);
  toggleSetupSelect(SETUP.applicants[2].id);
  finalizeInitialSetup();
  assert(S && S.students.length === 3, 'expected 3 initial students');
  assert(S.debt === 500000, 'expected tuned initial debt 500000');
  assert(S.director.bgId === 'fixer' && S.director.aptitudes.physicality === 45, 'fixer background bonus');

  // Test free semester refresh
  assert(!S.semesterRefreshed, 'expected semesterRefreshed false initially');
  refreshApplicants(true);
  assert(S.semesterRefreshed === true, 'expected free semester refresh to mark semesterRefreshed');

  // 2. Upgrade facilities & enroll another student
  S.funds = 5000000;
  S.director.activeRole = 'Researcher';
  const beforeDisc = facilityUpgradeCost('dorms');
  assert(beforeDisc === Math.round(ACAD.facilities.dorms.upgradeCost * 0.8), 'Researcher discount applied');
  for (const fid of Object.keys(S.facilities)) {
    while (S.facilities[fid].level < S.facilities[fid].maxLevel) {
      assert(upgradeFacility(fid), 'failed upgrading ' + fid);
    }
  }
  assert(dormCapacity() === 40, 'dorms max capacity 40');
  assert(enrollApplicant(S.applicants[0].id), 'post-upgrade enrollment failed');
  assert(S.students.length === 4, 'expected 4 students after dorm expansion');

  // 3. Assign every role and study focus across students
  const roleCycle = ['Hostess', 'Bartender', 'Dancer', 'Singer', 'Security', 'Private_Service'];
  const svcCycle = ['massage', 'manual', 'oral', 'vaginal', 'anal'];
  const protCycle = ACAD.protocols.map(p => p.id);
  const dRoles = Object.keys(ACAD.directorRoles);

  // Check collapse reachability explicitly
  S.students[0].fatigue = 97;
  S.students[0].clubRole = 'Hostess';
  advanceTime(); // Morning tick triggers collapse before study
  assert(S.students[0].clubRole === 'None' && S.students[0].fatigue < 95, 'collapse recovery failed');
  assert(S.lastPeriod.highlights.some(h => h.kind === 'collapse'), 'collapse highlight missing');

  // Check Night Visit triggers, Night auto-rest preserves selectedProtocol, and does NOT stick to Morning scene
  S.time = 'Night';
  S.director.energy = 40;
  S.selectedProtocol = 'lead_seminar';
  S.students[1].arousal = 92;
  S.students[1].skills.compliance = 100;
  advanceTime(); // Night -> Morning
  assert(S.time === 'Morning', 'expected Morning after Night');
  assert(S.director.energy === 75, 'expected Night auto-rest (+35E) even with lead_seminar selected');
  assert(S.selectedProtocol === 'lead_seminar', 'expected selectedProtocol preserved across Night');
  assert(studentCurrentScene(S.students[1], 'Morning').startsWith('class_'), 'Night scene must not stick on Morning');

  // 4. Play N full days (4 ticks/day) exercising all protocols, roles, VIP services, grace period, mandated payment & weekly interest
  const startDebt = S.debt;
  const startDay = S.day;
  for (let d = 0; d < days; d++) {
    for (let p = 0; p < 4; p++) {
      const idx = d * 4 + p;
      S.director.activeRole = dRoles[idx % dRoles.length];
      S.selectedProtocol = protCycle[idx % protCycle.length];
      S.protocolTargetId = S.students[idx % S.students.length].id;

      S.students.forEach((s, si) => {
        s.autoRest = false;
        s.autoResting = false;
        setStudentSchedule(s.id, 'Morning', Object.keys(ACAD.classes)[(idx + si) % Object.keys(ACAD.classes).length]);
        setStudentSchedule(s.id, 'Afternoon', Object.keys(ACAD.classes)[(idx + si + 1) % Object.keys(ACAD.classes).length]);
        setStudentSchedule(s.id, 'Evening', roleCycle[(idx + si) % roleCycle.length]);
        s.serviceFocus = svcCycle[(idx + si) % svcCycle.length];
      });
      advanceTime();
    }
    if (S.day === 8) {
      assert(S.stats.interestAccrued === 0, 'Day 7 grace period should prevent interest on first week');
    }
  }
  assert(S.day === startDay + days, 'day count mismatch');
  assert(S.stats.interestAccrued > 0, 'weekly interest never accrued after grace period over ' + days + ' days');
  assert(S.paymentCycle >= 2 && S.nextPaymentDay === 28, 'Day 14 mandated payment did not advance cycle');
  assert(S.history.length <= HISTORY_MAX, 'history exceeded HISTORY_MAX cap');

  // 4b. Verify Morning/Afternoon separate schedule, Auto-Rest, details log & rebalanced protocols
  const schedStu = S.students[0];
  schedStu.autoRest = false;
  schedStu.autoResting = false;
  schedStu.fatigue = 0;
  schedStu.skills.knowledge = 10;
  schedStu.skills.fitness = 10;
  schedStu.skills.kissing = 10;
  setStudentSchedule(schedStu.id, 'Morning', 'Academics');
  setStudentSchedule(schedStu.id, 'Afternoon', 'PE');
  setStudentSchedule(schedStu.id, 'Evening', 'Hostess');
  assert(schedStu.morningFocus === 'Academics' && schedStu.afternoonFocus === 'PE', 'separate schedule setter failed');
  const know0 = schedStu.skills.knowledge;
  const fit0 = schedStu.skills.fitness;
  S.time = 'Morning';
  S.selectedProtocol = 'rest';
  advanceTime(); // Morning -> Afternoon
  assert(schedStu.skills.knowledge > know0, 'Morning schedule did not train Academics');
  assert(Array.isArray(S.lastPeriod.details) && S.lastPeriod.details.length > 0, 'expected lastPeriod.details for class ticks');
  advanceTime(); // Afternoon -> Evening
  assert(schedStu.skills.fitness > fit0, 'Afternoon schedule did not train PE');

  // Auto-Rest trigger & resume check
  schedStu.autoRest = true;
  schedStu.autoResting = false;
  schedStu.fatigue = 74; // 26% energy <= 30%
  S.time = 'Morning';
  advanceTime(); // enters auto-rest & rests
  assert(schedStu.autoResting === true, 'Auto-Rest did not trigger at <=30% energy');
  assert(schedStu.fatigue < 74, 'Auto-Rest did not recover fatigue');
  assert(schedStu.morningFocus === 'Academics' && schedStu.clubRole === 'Hostess', 'Auto-Rest overwrote configured schedule');
  schedStu.fatigue = 20; // 80% energy >= 75%
  advanceTime(); // Afternoon -> Evening: exits auto-rest & resumes schedule
  assert(schedStu.autoResting === false, 'Auto-Rest did not resume at >=75% energy');

  // Rebalanced protocol costs & effects
  S.time = 'Morning';
  S.director.energy = 100;
  S.selectedProtocol = 'lead_seminar';
  advanceTime();
  assert(S.director.energy === 65, 'expected lead_seminar to cost 35E');
  S.time = 'Morning';
  S.director.energy = 100;
  S.selectedProtocol = 'personal_counseling';
  S.protocolTargetId = schedStu.id;
  schedStu.autoResting = false;
  schedStu.morningFocus = 'Academics';
  schedStu.fatigue = 60;
  const expectedCounselFat = clamp(20 + BAL.fatigue.classGain * (1 - ((schedStu.aptitudes && schedStu.aptitudes.physicality) || 0) / 400) * traitMul(schedStu, 'fatigueMul'));
  advanceTime();
  assert(S.director.energy === 80 && Math.abs(schedStu.fatigue - expectedCounselFat) < 0.01, 'expected personal_counseling 20E / -40 fatigue');
  S.time = 'Morning';
  S.director.energy = 100;
  S.selectedProtocol = 'intimate_guidance';
  const kiss0 = schedStu.skills.kissing;
  advanceTime();
  assert(S.director.energy === 65 && schedStu.skills.kissing > kiss0, 'expected intimate_guidance 35E + kissing gain');
  S.time = 'Morning';
  S.director.energy = 100;
  S.selectedProtocol = 'city_work';
  S.reputation.academic = 20;
  const acad0 = S.reputation.academic;
  advanceTime();
  assert(S.director.energy === 60 && S.reputation.academic > acad0, 'expected city_work 40E + academic prestige');
  S.time = 'Evening';
  S.director.energy = 100;
  S.selectedProtocol = 'vip_filtering';
  advanceTime();
  assert(S.director.energy === 65, 'expected vip_filtering to cost 35E');
  assert(!S.history.some(h => h.text.includes('Academics]:') || h.text.includes('PE & Conditioning]:')), 'routine class ticks should not spam S.history');

  // Night Visit tone escalation & interactive prompt mode
  const nvStu = S.students[1];
  nvStu.depravity = 60;
  nvStu.skills.compliance = 100;
  nvStu.skills.lust = 100;

  SET.nightVisitMode = 'auto';
  SET.nightVisitTone = 'explicit';
  let gotExplicitAnal = false;
  for (let t = 0; t < 8 && !gotExplicitAnal; t++) {
    S.time = 'Night';
    nvStu.arousal = 95;
    advanceTime();
    if (S.lastPeriod.highlights.some(h => h.kind === 'night_visit' && h.studentId === nvStu.id && h.stageId === 'anal')) {
      gotExplicitAnal = true;
    }
  }
  assert(gotExplicitAnal, 'explicit Night Visit did not escalate to anal stage');

  SET.nightVisitTone = 'suggestive';
  let gotSuggestiveTease = false;
  for (let t = 0; t < 8 && !gotSuggestiveTease; t++) {
    S.time = 'Night';
    nvStu.arousal = 95;
    advanceTime();
    if (S.lastPeriod.highlights.some(h => h.kind === 'night_visit' && h.studentId === nvStu.id && h.stageId === 'tease')) {
      gotSuggestiveTease = true;
    }
  }
  assert(gotSuggestiveTease, 'suggestive Night Visit did not resolve as tease stage');

  SET.nightVisitTone = 'explicit';
  SET.nightVisitMode = 'prompt';
  let gotPrompt = false;
  for (let t = 0; t < 8 && !gotPrompt; t++) {
    S.time = 'Night';
    nvStu.arousal = 95;
    advanceTime();
    if (!$('#modal').classList.contains('hidden') && $('#modalBox').textContent.includes('Late-Night Visit:')) {
      gotPrompt = true;
    }
  }
  assert(gotPrompt, 'prompt Night Visit mode did not open interactive modal');
  chooseNightVisit(nvStu.id, 'oral');
  assert(S.lastPeriod.highlights.some(h => h.kind === 'night_visit' && h.stageId === 'oral'), 'chooseNightVisit oral failed');
  finishNightVisitModal();
  assert($('#modal').classList.contains('hidden'), 'finishNightVisitModal did not close modal');
  SET.nightVisitMode = 'auto';

  // 5. Debt partial payment (credits cycle) & full payoff victory check
  S.cycleDebtPaid = 0;
  const remBefore = mandatedRemainingDue();
  S.funds = Math.max(S.funds, S.debt + 10000);
  const paid1 = payDebt(2000);
  assert(paid1 === 2000 && S.cycleDebtPaid === 2000 && mandatedRemainingDue() === Math.max(0, remBefore - 2000), 'voluntary payment did not credit mandated cycle');
  payAllDebt();
  assert(S.debt === 0 && S.won === true, 'victory did not trigger on payoff');
  closeModal();
  S.endless = true;

  // 6. Visit every UI tab, Stat Guide modal, mock Perchance plugins, and Student Sheet modal
  let t2iCalls = 0;
  window.AA_PLUGINS = {
    t2i: ({ prompt, onFinish }) => {
      t2iCalls++;
      const c = document.createElement('canvas');
      c.width = 16; c.height = 16;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#6366f1'; ctx.fillRect(0, 0, 16, 16);
      setTimeout(() => onFinish({ dataUrl: c.toDataURL('image/png') }), 10);
      return '<div>Generating test image</div>';
    },
    ai: async ({ instruction, onChunk }) => {
      assert(instruction && instruction.length > 20, 'empty AI instruction');
      const txt = 'An adult evening vignette unfolds cleanly in candlelight.';
      if (onChunk) onChunk({ fullTextSoFar: txt });
      return txt;
    }
  };

  for (const [k] of TABS) {
    TAB = k;
    render();
  }

  openStatGuideModal();
  assert(!$('#modal').classList.contains('hidden') && $('#modalBox').textContent.includes('Skills Breakdown'), 'Stat Guide modal did not open');
  closeModal();

  // Verify imgHidden respected even when autoImg is true, Clara O'Neill Save file onclick is safe,
  // and saved student image is NOT auto-replaced on scene/schedule change unless SET.autoSceneChange is true
  const clara = S.students.find(x => x.name === "Clara O'Neill") || S.students[0];
  SET.autoImg = true;
  SET.autoSceneChange = false;
  SET.imgHidden = true;
  openSheet(clara.id);
  assert($('#sheetImg').dataset.key === '', 'expected sheetImg hidden when SET.imgHidden=true');
  toggleImg('sheetImg', clara.id, 'portrait', 'dressed', false);
  let dlBtn = null;
  for (let w = 0; w < 40; w++) {
    await new Promise(r => setTimeout(r, 50));
    dlBtn = [...document.querySelectorAll('#sheetImg button')].find(b => b.textContent.includes('Save file'));
    if (dlBtn) break;
  }
  assert(IMGKEYS.size >= 1, 'mock t2i failed to cache image in IndexedDB');
  assert(dlBtn, 'Save file button did not render after image generation');
  assert(!dlBtn.getAttribute('onclick').includes("O'Neill"), 'raw apostrophe leaked into downloadImg onclick');
  SET.imgHidden = false;
  closeModal();

  // Now Clara already has portrait|dressed saved. Switch her Morning schedule to PE (uncached) and open sheet:
  S.time = 'Morning';
  setStudentSchedule(clara.id, 'Morning', 'PE');
  t2iCalls = 0;
  openSheet(clara.id);
  await new Promise(r => setTimeout(r, 40));
  assert(t2iCalls === 0, 'unexpected auto-generation when student already has a saved image and autoSceneChange=false');
  assert($('#sceneSel').value === 'portrait', 'expected sheet to keep saved portrait instead of switching to uncached scene');
  closeModal();

  // Enable autoSceneChange and verify it DOES generate for the new schedule scene
  SET.autoSceneChange = true;
  t2iCalls = 0;
  openSheet(clara.id);
  for (let w = 0; w < 30 && t2iCalls === 0; w++) await new Promise(r => setTimeout(r, 20));
  assert(t2iCalls >= 1, 'expected auto-generation when autoSceneChange=true');
  assert($('#sceneSel').value === 'class_PE', 'expected sheet to switch to class_PE when autoSceneChange=true');
  SET.autoSceneChange = false;
  closeModal();

  // Verify saved encounter image auto-shows on Period Report when SET.repImg is true
  SET.repImg = true;
  const repTarget = S.students[0];
  await imgPut(imgKey(repTarget, 'svc:vaginal', 'nude'), 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==');
  S.lastPeriod = {
    day: S.day, time: 'Evening', nextDay: S.day, nextTime: 'Night',
    income: 500, upkeep: 0, net: 500,
    highlights: [{ id: 'hl_rep_test', kind: 'vip', title: 'VIP Test', text: 'Test', studentId: repTarget.id, scene: 'svc:vaginal', cloth: 'nude', expr: 'Excellent' }]
  };
  TAB = 'report';
  render();
  await new Promise(r => setTimeout(r, 40));
  assert($('#hl_rep_test_img img'), 'expected saved report image to auto-display when SET.repImg=true');

  openSheet(S.students[0].id);
  exportDossierModal(S.students[0].id);
  closeModal2();
  await aiBackstory('bs_' + S.students[0].id, S.students[0].id);
  saveToLibrary(S.students[0].id);
  assert(LIB.length >= 1, 'saveToLibrary failed');
  closeModal();

  // Check VIP prompt private snippet & flat-chest nude wording
  const flatStu = Object.assign(JSON.parse(JSON.stringify(S.students[0])), { design: Object.assign({}, S.students[0].design, { bust: 'AA' }) });
  const flatPrompt = buildPrompt(flatStu, 'svc:vaginal', 'nude');
  assert(flatPrompt.includes(SNIPPETS.scenes.private), 'VIP scene missing private snippet');
  assert(flatPrompt.includes('bare flat chest') && !flatPrompt.includes('bare breasts'), 'AA bust nude prompt failed chestFix');

  // Save/Import round-trip check, missed payment strikes foreclosure, & Year 4 foreclosure check
  const exported = JSON.stringify(S);
  doImport('save', exported);
  assert(S.students.length === 4 && S.won === true, 'save import round-trip failed');

  const strikeState = JSON.parse(exported);
  strikeState.won = false; strikeState.endless = false; strikeState.debt = 50000;
  strikeState.funds = 0; strikeState.missedPayments = 0; strikeState.cycleDebtPaid = 0;
  strikeState.day = 14; strikeState.nextPaymentDay = 14; strikeState.time = 'Night';
  S = migrate(strikeState);
  advanceTime(); // strike 1
  assert(S.missedPayments === 1 && S.debt > 50000 && !S.over, 'strike 1 late fee failed');
  S.funds = 0; S.day = S.nextPaymentDay; S.time = 'Night';
  advanceTime(); // strike 2
  assert(S.missedPayments === 2 && !S.over, 'strike 2 should not foreclose yet');
  S.funds = 0; S.day = S.nextPaymentDay; S.time = 'Night';
  advanceTime(); // strike 3 -> foreclosure
  assert(S.over === true && S.foreclosureReason === 'missed_payments', 'expected 3-strike mandated payment foreclosure');
  closeModal();

  const cloneState = JSON.parse(exported);
  cloneState.won = false; cloneState.endless = false; cloneState.debt = 50000;
  cloneState.day = BAL.economy.maxYears * BAL.economy.daysPerYear;
  cloneState.year = BAL.economy.maxYears; cloneState.time = 'Night';
  cloneState.nextPaymentDay = cloneState.day + 10;
  S = migrate(cloneState);
  advanceTime();
  assert(S.over === true, 'expected Year 4 foreclosure when unpaid');
  closeModal();
  doImport('save', exported);

  // 7. Prompt safety & brace-free audit across every scene, service & cloth state
  let promptCount = 0;
  const allScenes = [...Object.keys(SCENES), ...Object.keys(SERVICES).map(id => 'svc:' + id)];
  for (const sc of allScenes) {
    for (const c of CLOTH) {
      const pr = buildPrompt(S.students[0], sc, c.id);
      assert(pr && pr.length > 20, 'empty/short prompt for ' + sc + ' ' + c.id);
      assert(!/[{}]/.test(pr), 'stray brace in prompt: ' + pr);
      assert(!YOUTH_RE.test(pr), 'YOUTH_RE matched prompt: ' + pr);
      promptCount++;
    }
  }

  return {
    day: S.day,
    year: S.year,
    students: S.students.length,
    funds: S.funds,
    interestAccrued: S.stats.interestAccrued,
    nightVisits: S.stats.nightVisits,
    promptsChecked: promptCount,
    startDebt
  };
}`;

const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json'
};

const server = http.createServer((q, r) => {
  if (q.url === '/favicon.ico') { r.writeHead(204); return r.end(); }
  const f = path.join(root, decodeURIComponent(q.url.split('?')[0]));
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    r.writeHead(404);
    return r.end();
  }
  r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(r);
}).listen(0);

const PORT = server.address().port;
const browser = await pw.chromium.launch(
  Object.assign({ args: ['--no-proxy-server'] }, process.env.CHROME ? { executablePath: process.env.CHROME } : {})
);

let failed = false;
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('dialog', d => d.accept());

try {
  await page.goto(`http://localhost:${PORT}/index.html`);
  const res = await page.evaluate(`(${BOT})(${DAYS})`);
  console.log(
    `index.html: Day ${res.day} (Year ${res.year}), ${res.students} students, ` +
    `interest=${res.interestAccrued}, nightVisits=${res.nightVisits}, ` +
    `promptsChecked=${res.promptsChecked}. ` +
    (errors.length ? 'ERRORS:\n  ' + errors.slice(0, 8).join('\n  ') : 'no errors')
  );
  if (errors.length) failed = true;
} catch (e) {
  console.error('Smoke test failed:', e.message);
  if (errors.length) console.error('Page errors:\n  ' + errors.join('\n  '));
  failed = true;
} finally {
  await page.close();
  await browser.close();
  server.close();
}

process.exit(failed ? 1 : 0);
