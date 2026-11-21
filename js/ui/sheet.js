'use strict';
/* =====================================================================
   STUDENT DOSSIER MODAL (Sheet, Dynamic Scene Viewer, Skill Breakdown)
   ===================================================================== */
function sheetScenes(s){
  const list = ['portrait'];
  ['class_' + (s.morningFocus || s.classFocus || 'Academics'), 'class_' + (s.afternoonFocus || s.classFocus || 'Academics')].forEach(key => {
    if(!list.includes(key) && SCENES[key]) list.push(key);
  });
  Object.keys(ACAD.classes).forEach(k => {
    const key = 'class_' + k;
    if(!list.includes(key) && SCENES[key]) list.push(key);
  });
  Object.values(ACAD.roles).forEach(r => {
    if(r.scene && !list.includes(r.scene)) list.push(r.scene);
  });
  Object.keys(SERVICES).forEach(id => list.push('svc:' + id));
  list.push('counseling', 'intimate_guidance', 'night_visit', 'night_visit_manual', 'night_visit_oral', 'night_visit_vaginal', 'night_visit_anal');
  return list;
}

function studentNav(s){
  if(!S || S.students.length < 2) return '';
  const i = S.students.indexOf(s);
  if(i < 0) return '';
  const prev = S.students[(i - 1 + S.students.length) % S.students.length];
  const next = S.students[(i + 1) % S.students.length];
  return `<div class="row" style="justify-content:space-between;margin-bottom:8px">
    <button class="sm" onclick="openSheet('${esc(prev.id)}')">‹ ${esc(prev.name)}</button>
    <span class="muted small">${i + 1} / ${S.students.length}</span>
    <button class="sm" onclick="openSheet('${esc(next.id)}')">${esc(next.name)} ›</button>
  </div>`;
}

function openSheet(id){
  if(!S) return;
  const s = S.students.find(x => x.id === id);
  if(!s) return;
  ensureStudent(s);

  const scenes = sheetScenes(s);
  const curScene = studentCurrentScene(s, S.time);
  const curCloth = sceneInfo(curScene).cloth || 'dressed';
  const curCached = IMGKEYS.has(imgKey(s, curScene, curCloth));
  const savedFallback = studentSavedScene(s);

  let initScene, initCloth;
  if(curCached || SET.autoSceneChange){
    initScene = curScene;
    initCloth = curCloth;
  } else if(savedFallback){
    initScene = savedFallback.scene;
    initCloth = savedFallback.cloth;
  } else {
    initScene = 'portrait';
    initCloth = 'dressed';
  }
  if(!scenes.includes(initScene)) scenes.unshift(initScene);

  const nav = studentNav(s);

  modal(`${nav}
    <div class="sheet">
      <div>
        <div class="row">
          <select id="sceneSel" onchange="fillCloth();sheetImg()">
            ${scenes.map(k => `<option value="${esc(k)}" ${k === initScene ? 'selected' : ''}>${esc(sceneInfo(k).label)}</option>`).join('')}
          </select>
          <select id="clothSel" onchange="sheetImg()"></select>
        </div>
        <div id="sheetImg"></div>
      </div>
      <div id="sheetInfo"></div>
    </div>`, { wide: true });

  $('#modal').scrollTop = 0;
  SHEET = id;
  fillCloth(initCloth);
  refreshSheetInfo();

  let initMode;
  if(!savedFallback && !THUMBS[s.id]){
    initMode = SET.autoPortrait ? 'auto' : 'manual';
  } else if(SET.autoSceneChange){
    initMode = SET.autoImg !== false ? 'auto' : 'manual';
  } else {
    initMode = 'manual';
  }
  sheetImg(initMode);
}

function fillCloth(preferredCloth){
  const s = S && S.students.find(x => x.id === SHEET);
  const sel = $('#sceneSel'), c = $('#clothSel');
  if(!s || !sel || !c) return;
  const def = preferredCloth || sceneInfo(sel.value).cloth || 'dressed';
  c.innerHTML = CLOTH.map(x => `<option value="${x.id}" ${x.id === def ? 'selected' : ''}>${esc(x.label)}</option>`).join('');
}

function sheetImg(mode){
  const sel = $('#sceneSel'), c = $('#clothSel');
  if(!sel || !SHEET) return;
  showImg('sheetImg', SHEET, sel.value, c && c.value, mode);
}

function refreshSheetInfo(){
  const s = S && S.students.find(x => x.id === SHEET);
  const box = $('#sheetInfo');
  if(!s || !box) return;

  const coreSkills = ['knowledge', 'etiquette', 'fitness', 'conversation', 'singing', 'dancing', 'bartending', 'security', 'compliance', 'lust'];
  const svcSkills = ['seduction', 'massage', 'kissing', 'manual_service', 'oral_service', 'vaginal_service', 'anal_service'];
  const mCls = (ACAD.classes[s.morningFocus] || ACAD.classes.Academics).label;
  const aCls = (ACAD.classes[s.afternoonFocus] || ACAD.classes.Academics).label;
  const eRole = (ACAD.roles[s.clubRole] || ACAD.roles.None).label;

  box.innerHTML = `<div class="status">
    <div class="row" style="justify-content:space-between">
      <h3>${esc(s.name)} <span class="tag" data-tip="${esc(statTip('bars', 'rank'))}" data-tip-title="Rank ${studentRank(s)}">RANK ${studentRank(s)}</span></h3>
      <div class="row">
        <span class="muted small">${esc(s.major)} · Year ${s.year} · Age ${s.age}</span>
        <button class="sm" onclick="openStatGuideModal()">? What do stats do?</button>
      </div>
    </div>
    <p class="story" id="bs_${esc(s.id)}">${esc(s.description)}</p>
    ${SET.ai && SET.ai.on ? `<button class="sm" onclick="aiBackstory('bs_${esc(s.id)}','${esc(s.id)}')">✨ Rewrite backstory</button>` : ''}
    <div style="margin:8px 0">${(s.traits || []).map(t => {
      const td = PEOPLE.traits[t];
      return `<span class="tag" title="${esc((td && td.summary) || '')}">${esc(t)}: ${esc((td && td.summary) || '')}</span>`;
    }).join('')}${s.autoResting ? `<span class="tag">😴 Auto-resting</span>` : ''}</div>

    <div class="muted small" style="margin:6px 0"><b>Schedule:</b> Morning: ${esc(mCls)} · Afternoon: ${esc(aCls)} · Evening: ${esc(eRole)}</div>
    <label class="chk small muted"><input type="checkbox" ${s.autoRest ? 'checked' : ''} onchange="setStudentAutoRest('${esc(s.id)}', this.checked)"> Auto-rest at &le;${BAL.fatigue.autoRestLowEnergy}% Energy (resume at &ge;${BAL.fatigue.autoRestResumeEnergy}%)</label>

    <div style="margin:10px 0">
      ${bar('Energy', studentEnergy(s), 100, studentEnergy(s) > 30 ? 'e' : 'h', statTip('bars', 'energy'))}
      ${bar('Arousal', s.arousal, 100, 'p', statTip('bars', 'arousal'))}
      ${bar('Depravity', s.depravity, 100, 'm', statTip('bars', 'depravity'))}
    </div>

    <h3>Aptitudes</h3>
    <div class="sgrid">
      ${APT_KEYS.map(k => {
        const tip = statTip('aptitudes', k);
        return `<div title="${esc(tip)}" data-tip="${esc(tip)}" data-tip-title="${esc(cap(k))}"><span>${k.toUpperCase()}</span><b>${Math.round(s.aptitudes[k])}</b></div>`;
      }).join('')}
    </div>

    <h3 style="margin-top:10px">Core &amp; Social Skills</h3>
    <div class="sgrid">
      ${coreSkills.map(k => {
        const tip = statTip('skills', k);
        return `<div title="${esc(tip)}" data-tip="${esc(tip)}" data-tip-title="${esc(SKILL_LABELS[k])}"><span>${esc(SKILL_LABELS[k].toUpperCase())}</span><b>${Math.round(s.skills[k] || 0)}</b></div>`;
      }).join('')}
    </div>

    <h3 style="margin-top:10px">Intimate &amp; VIP Service Skills</h3>
    <div class="sgrid">
      ${svcSkills.map(k => {
        const tip = statTip('skills', k);
        return `<div title="${esc(tip)}" data-tip="${esc(tip)}" data-tip-title="${esc(SKILL_LABELS[k])}"><span>${esc(SKILL_LABELS[k].toUpperCase())}</span><b>${Math.round(s.skills[k] || 0)}</b></div>`;
      }).join('')}
    </div>

    <h3 style="margin-top:10px">Physical Manifest</h3>
    <p class="muted small">${esc(s.physicalDescription)}</p>
    <div class="sgrid">
      <div><span>BUST</span><b>${esc(s.physicalStats.bust)}</b></div>
      <div><span>HIPS</span><b>${esc(s.physicalStats.hips)}</b></div>
      <div><span>HEIGHT</span><b>${esc(s.physicalStats.height)}</b></div>
      <div><span>WEIGHT</span><b>${esc(s.physicalStats.weight)}</b></div>
      <div><span>HAIR</span><b>${esc(s.physicalStats.hairColor)}</b></div>
      <div><span>EYES</span><b>${esc(s.physicalStats.eyeColor)}</b></div>
    </div>

    <div class="muted small" style="margin-top:8px">Career Earnings: <b>${fmtMoney((s.stats && s.stats.earnings) || 0)}</b> · Patrons Served: <b>${(s.stats && s.stats.patrons) || 0}</b> · Director Visits: <b>${(s.stats && s.stats.visits) || 0}</b></div>

    <div class="row" style="margin-top:12px">
      <button class="sm" onclick="saveToLibrary('${esc(s.id)}')">Save to Library</button>
      <button class="sm" onclick="exportDossierModal('${esc(s.id)}')">Export Dossier JSON</button>
      <button class="sm warn" onclick="confirmDismiss('${esc(s.id)}')">Dismiss</button>
    </div>
  </div>`;
}

function confirmDismiss(id){
  const s = S && S.students.find(x => x.id === id);
  if(s && confirm(`Dismiss ${s.name} from Aurelia Academy?`)) dismissStudent(id);
}

function saveToLibrary(id){
  const s = S && S.students.find(x => x.id === id);
  if(!s) return;
  const copy = ensureStudent(clone(s));
  const idx = LIB.findIndex(x => x.name.toLowerCase() === copy.name.toLowerCase());
  if(idx >= 0) LIB[idx] = copy;
  else LIB.push(copy);
  saveLib();
  toast(`${s.name} saved to your local Student Library.`);
}

function exportDossierModal(id){
  const s = findStudent(id);
  if(!s) return;
  const txt = JSON.stringify(exportDossierObj(s), null, 2);
  const slug = s.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '') || 'student';
  modal2(`<h2>Export Dossier: ${esc(s.name)}</h2>
    <textarea id="expDos" style="min-height:240px">${esc(txt)}</textarea>
    <div class="row" style="margin-top:8px">
      <button class="primary" onclick="try{navigator.clipboard.writeText($('#expDos').value);toast('Copied.')}catch(e){toast('Copy manually.')}">Copy JSON</button>
      <button onclick="dlText($('#expDos').value,'${slug}-dossier.json')">Download JSON</button>
    </div>`);
}
