'use strict';
/* =====================================================================
   ONBOARDING SETUP (Director Creation + Initial Admissions)
   ===================================================================== */
function startSetup(){
  SETUP = {
    step: 'director',
    name: '',
    bgId: (ACAD.backgrounds[0] && ACAD.backgrounds[0].id) || 'academic',
    applicants: Array.from({ length: 10 }, () => genStudent(25)),
    selected: [],
    expandedId: null
  };
  if(SETUP.applicants[0]) SETUP.expandedId = SETUP.applicants[0].id;
  render();
}

function renderSetup(){
  const hdr = $('#hdr'), tabs = $('#tabs'), view = $('#view'), ftr = $('#ftr');
  hdr.innerHTML = `<div class="brand">Aurelia Academy <span class="muted small">// Executive Initialization</span></div>
    <div class="hstats"><button class="sm" onclick="importBox('save')">Import Save</button></div>`;
  tabs.innerHTML = '';
  ftr.innerHTML = '';

  if(SETUP.step === 'director'){
    const bgs = ACAD.backgrounds || [];
    view.innerHTML = `<div class="setup-grid">
      <section class="card">
        <h2>The Director</h2>
        <p class="story">You inherit control of Aurelia Academy alongside a staggering ${fmtMoney(BAL.economy.initialDebt)} syndicate debt. Balance daytime refinement with Nightfall Club revenues to clear the ledger before the end of Year ${BAL.economy.maxYears}.</p>
        <div class="form" style="margin-top:14px">
          <label>Director Surname
            <input id="dirName" type="text" placeholder="e.g. Hawthorne" value="${esc(SETUP.name)}" oninput="SETUP.name=this.value">
          </label>
        </div>
        <h3 style="margin-top:16px">Professional Origin</h3>
        <div class="col-list">
          ${bgs.map(bg => `<div class="pick ${SETUP.bgId === bg.id ? 'sel' : ''}" onclick="SETUP.bgId='${bg.id}';renderSetup()">
            <div><b>${esc(bg.name)}</b> <span class="tag">${(bg.traits || []).map(esc).join(' · ')}</span></div>
            <div class="muted small" style="margin-top:4px">${esc(bg.description)}</div>
          </div>`).join('')}
        </div>
        <div class="row" style="margin-top:16px">
          <button class="primary" onclick="finishDirectorSetup()">Proceed to Admissions ▶</button>
        </div>
      </section>
      <section class="card">
        <h3>Perchance &amp; Local Storage</h3>
        <p class="muted">Student portraits and scenes generate dynamically via Perchance's <code>text-to-image-plugin</code> when embedded, and cache locally in your browser's IndexedDB. Saves persist automatically to <code>localStorage</code>.</p>
        <p class="muted small">Image plugin: ${getPlugin() ? '<span class="good">connected</span>' : '<span class="warn">standalone mode (prompts still inspectable &amp; uploadable)</span>'} · AI text plugin: ${getTextPlugin() ? '<span class="good">connected</span>' : '<span class="warn">standalone mode</span>'}</p>
      </section>
    </div>`;
    return;
  }

  // Step 2: Initial Admissions Queue
  const capMax = dormCapacity();
  const selSet = new Set(SETUP.selected);

  view.innerHTML = `<section class="card">
    <div class="row" style="justify-content:space-between">
      <div>
        <h2>Initial Admissions Queue</h2>
        <div class="muted">Select up to <b>${capMax}</b> initial students (${selSet.size} / ${capMax} selected).</div>
      </div>
      <div class="row">
        <button onclick="openImportDossierModal(true)">Import Dossier JSON</button>
        <button onclick="SETUP.step='director';renderSetup()">← Back</button>
        <button class="primary" onclick="finalizeInitialSetup()">Assume Command (${selSet.size}) ▶</button>
      </div>
    </div>
  </section>
  <div class="col-list">
    ${SETUP.applicants.map(a => {
      const isSel = selSet.has(a.id);
      const isExp = SETUP.expandedId === a.id;
      return `<div class="card ${isSel ? 'sel-card' : ''}">
        <div class="row" style="justify-content:space-between;cursor:pointer" onclick="SETUP.expandedId = SETUP.expandedId==='${a.id}' ? null : '${a.id}';renderSetup()">
          <div class="row">
            ${avatarHTML(a)}
            <div>
              <b>${esc(a.name)}</b> <span class="tag">${esc(a.major)}</span> <span class="tag">Rank ${studentRank(a)}</span>
              <div class="muted small">${a.traits.map(esc).join(' · ')} · Age ${a.age}</div>
            </div>
          </div>
          <div class="row" onclick="event.stopPropagation()">
            <button class="${isSel ? 'primary' : ''}" onclick="toggleSetupSelect('${a.id}')" ${!isSel && selSet.size >= capMax ? 'disabled' : ''}>${isSel ? '✓ Selected' : 'Select'}</button>
          </div>
        </div>
        ${isExp ? `<div class="dossier-expand">
          <p class="story">"${esc(a.description)}"</p>
          <p class="muted small">${esc(a.physicalDescription)}</p>
          <div class="sgrid" style="margin-top:8px">
            <div><span>AGE</span><b>${a.age}</b></div>
            <div><span>HEIGHT</span><b>${esc(a.physicalStats.height)}</b></div>
            <div><span>BUST</span><b>${esc(a.physicalStats.bust)}</b></div>
            <div><span>HIPS</span><b>${esc(a.physicalStats.hips)}</b></div>
            <div><span>HAIR</span><b>${esc(a.physicalStats.hairColor)}</b></div>
            <div><span>EYES</span><b>${esc(a.physicalStats.eyeColor)}</b></div>
          </div>
        </div>` : ''}
      </div>`;
    }).join('')}
  </div>`;
}

function finishDirectorSetup(){
  const inp = $('#dirName');
  const name = ((inp && inp.value) || SETUP.name || '').trim();
  if(!name){
    toast('Enter a Director surname first.');
    return;
  }
  SETUP.name = name;
  SETUP.step = 'admissions';
  renderSetup();
}

function toggleSetupSelect(id){
  if(!SETUP) return;
  const idx = SETUP.selected.indexOf(id);
  if(idx >= 0){
    SETUP.selected.splice(idx, 1);
  } else {
    if(SETUP.selected.length >= dormCapacity()){
      toast(`Initial Dorm capacity is ${dormCapacity()}.`);
      return;
    }
    SETUP.selected.push(id);
  }
  renderSetup();
}

function finalizeInitialSetup(){
  if(!SETUP) return;
  const chosen = SETUP.applicants.filter(a => SETUP.selected.includes(a.id));
  if(!chosen.length){
    toast('Select at least 1 student to open the Academy.');
    return;
  }
  const dir = { name: SETUP.name, bgId: SETUP.bgId };
  newGameState(dir, chosen);
  SETUP = null;
  TAB = 'students';
  render();
}
