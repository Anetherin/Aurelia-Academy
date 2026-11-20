'use strict';
/* =====================================================================
   CORE UI — HEADER, TABS, FOOTER, MODALS & MAIN VIEWS
   ===================================================================== */
function modal(html, opts = {}){
  MODAL_LOCK = !!opts.lock;
  const b = $('#modalBox');
  b.className = 'modal-box' + (opts.wide ? ' wide' : '');
  b.innerHTML = (MODAL_LOCK ? '' : '<button class="xbtn" onclick="closeModal()">✕</button>') + html;
  $('#modal').classList.remove('hidden');
}
function closeModal(){
  $('#modal').classList.add('hidden');
  MODAL_LOCK = false;
  SHEET = null;
}

let MODAL2_CLOSE = null;
function modal2(html, onClose){
  MODAL2_CLOSE = onClose || null;
  const b = $('#modal2Box');
  b.className = 'modal-box wide';
  b.innerHTML = '<button class="xbtn" onclick="closeModal2()">✕</button>' + html;
  $('#modal2').classList.remove('hidden');
}
function closeModal2(){
  $('#modal2').classList.add('hidden');
  if(MODAL2_CLOSE){
    const fn = MODAL2_CLOSE;
    MODAL2_CLOSE = null;
    fn();
  }
}

function toast(t){
  const box = $('#toast');
  while(box.children.length >= 4) box.firstChild.remove();
  const d = document.createElement('div');
  d.textContent = t;
  box.appendChild(d);
  setTimeout(() => d.remove(), 3400);
}

function bar(label, v, max, cls, note){
  max = Math.max(1, Math.round(max));
  const p = Math.round(clamp((v / max) * 100));
  return `<div class="bar ${cls}" title="${esc(label)}: ${Math.round(v)}/${max}${note ? ' · ' + esc(note) : ''}">
    <span style="width:${p}%"></span><em>${esc(label)} ${Math.round(v)}/${max}</em>
  </div>`;
}

// Tooltip popover for touch and hover
function tipPop(el){
  let box = $('#tipPop');
  if(!el){ if(box) box.style.display = 'none'; return; }
  if(!box){ box = document.createElement('div'); box.id = 'tipPop'; document.body.appendChild(box); }
  box.innerHTML = `<b>${esc(el.textContent.trim())}</b><br>${esc(el.getAttribute('title'))}`;
  box.style.display = 'block';
  const r = el.getBoundingClientRect(), bw = box.offsetWidth, bh = box.offsetHeight;
  box.style.left = Math.max(6, Math.min(window.innerWidth - bw - 6, r.left + r.width / 2 - bw / 2)) + 'px';
  box.style.top = (r.bottom + bh + 8 > window.innerHeight ? Math.max(6, r.top - bh - 6) : r.bottom + 6) + 'px';
}
if(typeof document !== 'undefined'){
  document.addEventListener('click', e => {
    const el = e.target && e.target.closest ? e.target : null;
    const ctl = 'button, a, select, label, input, summary';
    const tag = el && el.closest('.tag[title]');
    if(tag && tag.getAttribute('title') && !tag.closest(ctl)){ e.stopPropagation(); tipPop(tag); }
    else tipPop(null);
  }, true);
}

const TABS = [
  ['students', 'Students'],
  ['admissions', 'Admissions'],
  ['facilities', 'Facilities'],
  ['director', 'Director & Debt'],
  ['report', 'Period Report'],
  ['settings', 'Settings']
];

function render(){
  if(SETUP){ renderSetup(); return; }
  if(!S) return;

  const hdr = $('#hdr');
  const tabs = $('#tabs');
  const view = $('#view');
  const ftr = $('#ftr');

  const daysUntilInt = 7 - ((S.day - 1) % 7);
  const inGrace = S.day <= (BAL.economy.interestGraceDays || 0);
  const debtMeta = S.debt > 0 ? (inGrace ? ` <span class="muted small">(grace)</span>` : ` <span class="muted small">(+int ${daysUntilInt}d)</span>`) : '';
  hdr.innerHTML = `<div class="brand">Aurelia Academy <span class="muted small">// Y${S.year} · T${S.term} · Day ${S.day} · <b>${esc(S.time)}</b></span></div>
    <div class="hstats">
      <span>Funds <b class="${S.funds < 0 ? 'warn' : 'good'}">${fmtMoney(S.funds)}</b></span>
      <span>Debt <b class="${S.debt <= 0 ? 'good' : 'warn'}">${fmtMoney(S.debt)}</b>${debtMeta}</span>
      <span>Stamina <b>${Math.round(S.director.energy)}%</b></span>
      <span>Students <b>${S.students.length}/${dormCapacity()}</b></span>
    </div>`;

  const hlCount = (S.lastPeriod && S.lastPeriod.highlights && S.lastPeriod.highlights.length) || 0;
  tabs.innerHTML = TABS.map(([k, lbl]) => {
    let badge = '';
    if(k === 'students') badge = ` (${S.students.length})`;
    if(k === 'admissions') badge = ` (${S.applicants.length})`;
    if(k === 'report' && hlCount) badge = ` <span class="pill-count">${hlCount}</span>`;
    return `<button class="${TAB === k ? 'on' : ''}" onclick="TAB='${k}';render()">${esc(lbl)}${badge}</button>`;
  }).join('');

  if(TAB === 'students') view.innerHTML = viewStudents();
  else if(TAB === 'admissions') view.innerHTML = viewAdmissions();
  else if(TAB === 'facilities') view.innerHTML = viewFacilities();
  else if(TAB === 'director') view.innerHTML = viewDirector();
  else if(TAB === 'report'){ view.innerHTML = viewReport(); reportAfterRender(); }
  else if(TAB === 'settings') view.innerHTML = viewSettings();

  const curProt = (ACAD.protocols || []).find(p => p.id === S.selectedProtocol) || ACAD.protocols[0];
  const needsTarget = !!(curProt && curProt.targeted);
  const tgtOpts = S.students.map(x => `<option value="${esc(x.id)}" ${S.protocolTargetId === x.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('');
  const protHint = S.time === 'Night'
    ? 'Night: auto-rest (+35E)'
    : (Array.isArray(curProt.periods) && !curProt.periods.includes(S.time))
      ? `Runs in ${curProt.periods.join('/')} (recess now)`
      : `Stamina: ${Math.round(S.director.energy)}%`;

  ftr.innerHTML = `<div class="ftr-inner">
    <div class="row ftr-prot">
      <label class="small muted">Protocol
        <select onchange="S.selectedProtocol=this.value;save();render()">
          ${(ACAD.protocols || []).map(p => `<option value="${esc(p.id)}" ${S.selectedProtocol === p.id ? 'selected' : ''}>${esc(p.name)} (${p.energy > 0 ? '-' + p.energy : '+' + Math.abs(p.energy)}E)</option>`).join('')}
        </select>
      </label>
      ${needsTarget && S.students.length ? `<select title="Target Student" onchange="S.protocolTargetId=this.value;save()">${tgtOpts}</select>` : ''}
      <span class="muted small">${esc(protHint)}</span>
    </div>
    <button class="primary" id="advBtn" onclick="advanceTime()" ${S.over ? 'disabled' : ''}>${esc(getTimeActionLabel(S.time))} ▶</button>
  </div>`;
}

function setStudentFocus(id, focus){
  const s = S.students.find(x => x.id === id);
  if(!s) return;
  s.classFocus = focus;
  save();
  render();
}

function setStudentRole(id, role){
  const s = S.students.find(x => x.id === id);
  if(!s || canDoRole(role, S.facilities)) return;
  s.clubRole = role;
  save();
  render();
}

function setStudentService(id, svcId){
  const s = S.students.find(x => x.id === id);
  if(!s) return;
  s.serviceFocus = svcId;
  save();
  render();
}

function viewStudents(){
  if(!S.students.length){
    return `<section class="card"><h2>No Enrolled Students</h2><p class="muted">Visit the <b>Admissions</b> tab to enroll students up to your Dorm capacity (${dormCapacity()}).</p></section>`;
  }

  let list = S.students.slice();
  if(STU_FILTER.role !== 'all') list = list.filter(s => s.clubRole === STU_FILTER.role);
  if(STU_FILTER.focus !== 'all') list = list.filter(s => s.classFocus === STU_FILTER.focus);

  if(STU_FILTER.sort === 'rank') list.sort((a, b) => studentAvgApt(b) - studentAvgApt(a));
  else if(STU_FILTER.sort === 'energy') list.sort((a, b) => studentEnergy(b) - studentEnergy(a));
  else if(STU_FILTER.sort === 'arousal') list.sort((a, b) => b.arousal - a.arousal);
  else if(STU_FILTER.sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));

  const roles = Object.values(ACAD.roles);
  const classes = Object.values(ACAD.classes);
  const svcs = Object.values(SERVICES);

  const lastAlert = (S.lastPeriod && S.lastPeriod.highlights || []).filter(h => ['night_visit', 'collapse', 'incident', 'interest'].includes(h.kind));
  const banner = lastAlert.length ? `<section class="card alert-banner">
    <div class="row" style="justify-content:space-between">
      <div><b>Last Period (${esc(S.lastPeriod.time)} D${S.lastPeriod.day}):</b> ${lastAlert.map(h => esc(h.title)).join(' · ')}</div>
      <button class="sm" onclick="TAB='report';render()">Open Period Report</button>
    </div>
  </section>` : '';

  const filters = `<section class="card">
    <div class="row" style="justify-content:space-between">
      <div class="row">
        <label class="small muted">Role <select onchange="STU_FILTER.role=this.value;render()">
          <option value="all">All Roles</option>
          ${roles.map(r => `<option value="${r.id}" ${STU_FILTER.role === r.id ? 'selected' : ''}>${esc(r.label)}</option>`).join('')}
        </select></label>
        <label class="small muted">Study <select onchange="STU_FILTER.focus=this.value;render()">
          <option value="all">All Studies</option>
          ${classes.map(c => `<option value="${c.id}" ${STU_FILTER.focus === c.id ? 'selected' : ''}>${esc(c.label)}</option>`).join('')}
        </select></label>
        <label class="small muted">Sort <select onchange="STU_FILTER.sort=this.value;render()">
          <option value="rank" ${STU_FILTER.sort === 'rank' ? 'selected' : ''}>Rank</option>
          <option value="energy" ${STU_FILTER.sort === 'energy' ? 'selected' : ''}>Energy</option>
          <option value="arousal" ${STU_FILTER.sort === 'arousal' ? 'selected' : ''}>Arousal</option>
          <option value="name" ${STU_FILTER.sort === 'name' ? 'selected' : ''}>Name</option>
        </select></label>
      </div>
      <span class="muted small">Click any student card to open her full dossier &amp; scene generator.</span>
    </div>
  </section>`;

  const cards = list.map(s => {
    const rank = studentRank(s);
    const en = studentEnergy(s);
    const eligIds = new Set(eligibleServices(s).map(x => x.id));
    const curScene = studentCurrentScene(s, S.time);
    const scLabel = sceneInfo(curScene).label;

    return `<article class="wcard" onclick="openSheet('${esc(s.id)}')">
      <div class="wcard-top">
        ${avatarHTML(s)}
        <div class="winfo">
          <div class="row" style="justify-content:space-between;margin:0">
            <span class="wname">${esc(s.name)}</span>
            <span class="tag">RANK ${esc(rank)}</span>
          </div>
          <div class="muted small">${esc(s.major)} · Year ${s.year} · ${esc(scLabel)}</div>
          <div style="margin-top:4px">${(s.traits || []).map(t => {
            const td = PEOPLE.traits[t];
            return `<span class="tag" title="${esc((td && td.summary) || t)}">${esc(t)}</span>`;
          }).join('')}</div>
        </div>
      </div>
      <div class="wcard-bars">
        ${bar('Energy', en, 100, en > 30 ? 'e' : 'h')}
        ${bar('Arousal', s.arousal, 100, 'p')}
        ${bar('Compliance', s.skills.compliance, 100, 't')}
      </div>
      <div class="wcard-ctls" onclick="event.stopPropagation()">
        <label class="small muted">Daily Study
          <select onchange="setStudentFocus('${esc(s.id)}', this.value)">
            ${classes.map(c => `<option value="${c.id}" ${s.classFocus === c.id ? 'selected' : ''}>${esc(c.label)}</option>`).join('')}
          </select>
        </label>
        <label class="small muted">Club Role
          <select onchange="setStudentRole('${esc(s.id)}', this.value)">
            ${roles.map(r => {
              const lock = canDoRole(r.id, S.facilities);
              return `<option value="${r.id}" ${s.clubRole === r.id ? 'selected' : ''} ${lock ? 'disabled' : ''}>${lock ? '🔒 ' : ''}${esc(r.label)}</option>`;
            }).join('')}
          </select>
        </label>
        ${s.clubRole === 'Private_Service' ? `<label class="small muted" style="grid-column:1 / -1">VIP Service Focus
          <select onchange="setStudentService('${esc(s.id)}', this.value)">
            <option value="auto" ${s.serviceFocus === 'auto' ? 'selected' : ''}>Auto (highest comfortable tier)</option>
            ${svcs.map(v => `<option value="${v.id}" ${s.serviceFocus === v.id ? 'selected' : ''}>${eligIds.has(v.id) ? '' : '⚠ '}${esc(v.label)} (Depravity ${v.depravityMin}+)</option>`).join('')}
          </select>
        </label>` : ''}
      </div>
    </article>`;
  }).join('');

  return banner + filters + `<div class="grid">${cards}</div>`;
}

function viewAdmissions(){
  const capMax = dormCapacity();
  const full = S.students.length >= capMax;
  return `<section class="card">
    <div class="row" style="justify-content:space-between">
      <div>
        <h2>Admissions Queue</h2>
        <div class="muted">Enrolled: <b>${S.students.length} / ${capMax}</b> (upgrade Student Dorms to expand capacity) · Incoming Quality: <b>${applicantQuality()}</b></div>
      </div>
      <div class="row">
        <button onclick="openImportDossierModal(false)">Import Dossier JSON</button>
        ${!S.semesterRefreshed
          ? `<button class="primary" onclick="refreshApplicants(true)">Refresh Queue (Free)</button>`
          : `<button class="primary" onclick="refreshApplicants(false)">Refresh Queue (${fmtMoney(BAL.economy.applicantRefreshCost)})</button>`}
      </div>
    </div>
  </section>
  ${full ? `<section class="card"><span class="warn">Dorm capacity reached (${capMax}).</span> Upgrade <b>Student Dorms</b> in Facilities to enroll additional students.</section>` : ''}
  <div class="grid">
    ${S.applicants.map(a => `<article class="wcard">
      <div class="wcard-top">
        ${avatarHTML(a)}
        <div class="winfo">
          <div class="row" style="justify-content:space-between;margin:0">
            <span class="wname">${esc(a.name)}</span>
            <span class="tag">RANK ${studentRank(a)}</span>
          </div>
          <div class="muted small">${esc(a.major)} · Age ${a.age}${a.fromLibrary ? ' · <span class="pink">Library</span>' : ''}</div>
          <div style="margin-top:4px">${(a.traits || []).map(t => `<span class="tag" title="${esc((PEOPLE.traits[t] && PEOPLE.traits[t].summary) || '')}">${esc(t)}</span>`).join('')}</div>
        </div>
      </div>
      <p class="muted small" style="margin:6px 0">${esc(a.description)}</p>
      <div class="sgrid" style="margin:6px 0">
        <div><span>INT</span><b>${a.aptitudes.intelligence}</b></div>
        <div><span>PHYS</span><b>${a.aptitudes.physicality}</b></div>
        <div><span>SOC</span><b>${a.aptitudes.social}</b></div>
        <div><span>LIB</span><b>${a.aptitudes.libido}</b></div>
      </div>
      <div class="row">
        <button class="sm" onclick="previewApplicant('${esc(a.id)}')">Portrait / Inspect</button>
        <button class="sm primary" onclick="enrollApplicant('${esc(a.id)}')" ${full ? 'disabled' : ''}>Enroll Student</button>
      </div>
    </article>`).join('')}
  </div>`;
}

function previewApplicant(id){
  const a = S.applicants.find(x => x.id === id);
  if(!a) return;
  modal(`<h2>${esc(a.name)} <span class="tag">Rank ${studentRank(a)}</span></h2>
    <div class="sheet">
      <div><div id="appImg"></div></div>
      <div>
        <div class="muted">${esc(a.major)} · Age ${a.age}</div>
        <p class="story">${esc(a.description)}</p>
        <p class="muted small">${esc(a.physicalDescription)}</p>
        <div class="row" style="margin-top:12px">
          <button class="primary" onclick="if(enrollApplicant('${esc(a.id)}')) closeModal()" ${S.students.length >= dormCapacity() ? 'disabled' : ''}>Enroll Student</button>
        </div>
      </div>
    </div>`, { wide: true });
  showImg('appImg', a.id, 'portrait', 'dressed', SET.autoPortrait ? 'auto' : 'manual');
}

function openImportDossierModal(isSetup){
  modal(`<h2>Import Student Dossier</h2>
    <p class="muted">Paste an exported Aurelia Academy JSON dossier to add her to the current admissions queue.</p>
    <textarea id="impDossier" style="min-height:200px" placeholder='{"name": "Elena Vance", ...}'></textarea>
    <div class="row" style="margin-top:10px">
      <button class="primary" onclick="doImportDossier(${!!isSetup})">Import Dossier</button>
    </div>`);
}

function doImportDossier(isSetup){
  try{
    const raw = JSON.parse($('#impDossier').value);
    const stu = importDossierObj(raw);
    if(isSetup && SETUP){
      SETUP.applicants.unshift(stu);
      SETUP.expandedId = stu.id;
      closeModal();
      renderSetup();
    } else if(S){
      S.applicants.unshift(stu);
      save();
      closeModal();
      render();
    }
    toast(`Imported ${stu.name} into Admissions.`);
  }catch(e){
    toast('Invalid dossier JSON: ' + e.message);
  }
}

function viewFacilities(){
  const discNote = S.director.activeRole === 'Researcher' ? '<span class="good">Facility Architect active: -20% upgrade cost</span>' : '';
  return `<section class="card">
    <div class="row" style="justify-content:space-between">
      <div>
        <h2>Campus Facilities</h2>
        <div class="muted">Expand academy halls and Nightfall Club capacity. ${discNote}</div>
      </div>
      <div>Funds: <b class="good">${fmtMoney(S.funds)}</b></div>
    </div>
  </section>
  <div class="grid2">
    ${Object.values(S.facilities).map(f => {
      const cost = facilityUpgradeCost(f.id);
      const maxed = f.level >= f.maxLevel;
      const extra = f.id === 'dorms' ? ` · Current Cap: ${dormCapacity()} students` : '';
      return `<section class="card fac-card">
        <div class="row" style="justify-content:space-between">
          <h3>${esc(f.name)}</h3>
          <span class="tag">Tier ${f.level} / ${f.maxLevel}</span>
        </div>
        <p class="muted">${esc(f.effect)}${extra}</p>
        <div class="row" style="margin-top:10px">
          <button class="primary" onclick="upgradeFacility('${esc(f.id)}')" ${maxed || S.funds < cost ? 'disabled' : ''}>
            ${maxed ? 'Max Tier Reached' : `Expand (${fmtMoney(cost)})`}
          </button>
        </div>
      </section>`;
    }).join('')}
  </div>`;
}

function setDirectorRole(role){
  if(!S || !ACAD.directorRoles[role]) return;
  S.director.activeRole = role;
  save();
  render();
}

function viewDirector(){
  const d = S.director;
  const estInterest = S.debt > 0 ? Math.round(S.debt * BAL.economy.weeklyInterestRate) : 0;
  const daysLeft = Math.max(0, BAL.economy.maxYears * BAL.economy.daysPerYear - S.day + 1);
  const dRoles = ACAD.directorRoles || {};

  return `<div class="grid2">
    <section class="card">
      <h2>Director ${esc(d.name)}</h2>
      <div class="muted">${esc(d.background)} · Traits: ${(d.traits || []).map(esc).join(', ')}</div>
      <div style="margin:10px 0">${bar('Director Stamina', d.energy, d.maxEnergy, d.energy > 40 ? 't' : 'h')}</div>
      <div class="sgrid" style="margin:10px 0">
        ${APT_KEYS.map(k => `<div><span>${k.toUpperCase()}</span><b>${d.aptitudes[k]}</b></div>`).join('')}
      </div>
      <h3>Active Specialization</h3>
      <select style="width:100%" onchange="setDirectorRole(this.value)">
        ${Object.entries(dRoles).map(([k, r]) => `<option value="${k}" ${d.activeRole === k ? 'selected' : ''}>${esc(r.label)} — ${esc(r.desc)}</option>`).join('')}
      </select>
    </section>

    <section class="card">
      <h2>Syndicate Debt Ledger</h2>
      <div class="debt-big ${S.debt <= 0 ? 'good' : 'warn'}">${fmtMoney(S.debt)}</div>
      <div class="muted small">${S.day <= (BAL.economy.interestGraceDays || 0) ? `Grace period active (first ${BAL.economy.interestGraceDays} days interest-free); then ` : ''}Weekly interest (${(BAL.economy.weeklyInterestRate * 100).toFixed(1)}% every 7 days): ~${fmtMoney(estInterest)} · ${S.won ? '<span class="good">Debt Cleared!</span>' : `${daysLeft} days until Year ${BAL.economy.maxYears} foreclosure`}</div>
      <div class="row" style="margin-top:12px">
        <button onclick="payDebt(5000)" ${S.debt <= 0 || S.funds < 5000 ? 'disabled' : ''}>Pay $5,000</button>
        <button onclick="payDebt(25000)" ${S.debt <= 0 || S.funds < 25000 ? 'disabled' : ''}>Pay $25,000</button>
        <button class="primary" onclick="payAllDebt()" ${S.debt <= 0 || S.funds < 1 ? 'disabled' : ''}>Pay Max (${fmtMoney(Math.min(Math.floor(S.funds), S.debt))})</button>
      </div>
      <div class="sgrid" style="margin-top:12px">
        <div><span>EARNED</span><b>${fmtMoney(S.stats.totalEarned)}</b></div>
        <div><span>PAID</span><b>${fmtMoney(S.stats.totalDebtPaid)}</b></div>
        <div><span>INTEREST</span><b>${fmtMoney(S.stats.interestAccrued)}</b></div>
        <div><span>NIGHT VISITS</span><b>${S.stats.nightVisits}</b></div>
      </div>
    </section>
  </div>

  <section class="card">
    <h2>Institutional Reputation</h2>
    <div class="grid2">
      <div>
        ${bar('Academic Prestige', S.reputation.academic, 100, 't', 'Improves applicant quality & consulting pay')}
        <div class="muted small">Improves applicant aptitude rolls and City Consulting fees.</div>
      </div>
      <div>
        ${bar('Social Refinement', S.reputation.refinement, 100, 'e', 'Increases Nightfall club tips')}
        <div class="muted small">Raises high-society patron gratuities (+${(S.reputation.refinement * BAL.economy.refinementTipScale * 100).toFixed(1)}% tips).</div>
      </div>
      <div>
        ${bar('City Infamy', S.reputation.infamy, 100, 'h', 'Boosts VIP base revenue at the cost of incident risk')}
        <div class="muted small">Raises VIP base pricing (+${(S.reputation.infamy * BAL.economy.infamyRevenueScale * 100).toFixed(1)}%), but attracts club incidents unless Security keeps watch.</div>
      </div>
    </div>
  </section>`;
}
