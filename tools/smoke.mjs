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

  toggleSetupSelect(SETUP.applicants[0].id);
  toggleSetupSelect(SETUP.applicants[1].id);
  toggleSetupSelect(SETUP.applicants[2].id);
  finalizeInitialSetup();
  assert(S && S.students.length === 3, 'expected 3 initial students');
  assert(S.director.bgId === 'fixer' && S.director.aptitudes.physicality === 45, 'fixer background bonus');

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

  // Check Night Visit triggers and does NOT stick to Morning scene
  S.time = 'Night';
  S.students[1].arousal = 92;
  S.students[1].skills.compliance = 100;
  advanceTime(); // Night -> Morning
  assert(S.time === 'Morning', 'expected Morning after Night');
  assert(studentCurrentScene(S.students[1], 'Morning').startsWith('class_'), 'Night scene must not stick on Morning');

  // 4. Play N full days (4 ticks/day) exercising all protocols, roles, VIP services & weekly interest
  const startDebt = S.debt;
  const startDay = S.day;
  for (let d = 0; d < days; d++) {
    for (let p = 0; p < 4; p++) {
      const idx = d * 4 + p;
      S.director.activeRole = dRoles[idx % dRoles.length];
      S.selectedProtocol = protCycle[idx % protCycle.length];
      S.protocolTargetId = S.students[idx % S.students.length].id;

      S.students.forEach((s, si) => {
        s.clubRole = roleCycle[(idx + si) % roleCycle.length];
        s.serviceFocus = svcCycle[(idx + si) % svcCycle.length];
        s.classFocus = Object.keys(ACAD.classes)[(idx + si) % Object.keys(ACAD.classes).length];
      });
      advanceTime();
    }
  }
  assert(S.day === startDay + days, 'day count mismatch');
  assert(S.stats.interestAccrued > 0, 'weekly interest never accrued over ' + days + ' days');

  // 5. Debt partial payment & full payoff victory check
  S.funds = Math.max(S.funds, S.debt + 10000);
  const paid1 = payDebt(10000);
  assert(paid1 === 10000, 'partial debt payment failed');
  payAllDebt();
  assert(S.debt === 0 && S.won === true, 'victory did not trigger on payoff');
  closeModal();
  S.endless = true;

  // 6. Visit every UI tab, test mock Perchance plugins, and Student Sheet modal
  window.AA_PLUGINS = {
    t2i: ({ prompt, onFinish }) => {
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
  openSheet(S.students[0].id);
  await new Promise(r => setTimeout(r, 80));
  assert(IMGKEYS.size >= 1, 'mock t2i failed to cache image in IndexedDB');
  exportDossierModal(S.students[0].id);
  closeModal2();
  await aiBackstory('bs_' + S.students[0].id, S.students[0].id);
  saveToLibrary(S.students[0].id);
  assert(LIB.length >= 1, 'saveToLibrary failed');
  closeModal();

  // Save/Import round-trip check & Year 4 foreclosure check
  const exported = JSON.stringify(S);
  doImport('save', exported);
  assert(S.students.length === 4 && S.won === true, 'save import round-trip failed');

  const cloneState = JSON.parse(exported);
  cloneState.won = false; cloneState.endless = false; cloneState.debt = 50000;
  cloneState.day = BAL.economy.maxYears * BAL.economy.daysPerYear;
  cloneState.year = BAL.economy.maxYears; cloneState.time = 'Night';
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
