'use strict';
/* =====================================================================
   SETTINGS, DATA FILES, LOCAL IMAGE BACKUP & SAVE MANAGEMENT
   ===================================================================== */
function viewSettings(){
  const imgPlug = getPlugin();
  const txtPlug = getTextPlugin();
  return `<section class="card">
    <h2>Perchance Image Settings</h2>
    <label class="muted">Style tags<textarea id="s_style">${esc(SET.style)}</textarea></label>
    <label class="muted">Negative prompt<textarea id="s_neg">${esc(SET.negative)}</textarea></label>
    <div class="row" style="margin-top:8px">
      Resolution <select id="s_res">${['512x512', '512x768', '768x512'].map(r => `<option ${r === SET.resolution ? 'selected' : ''}>${r}</option>`).join('')}</select>
      <label class="chk"><input type="checkbox" id="s_autoImg" ${SET.autoImg !== false ? 'checked' : ''}> Auto-generate images on sheets when none saved</label>
      <label class="chk"><input type="checkbox" id="s_autoPort" ${SET.autoPortrait ? 'checked' : ''}> Auto-generate portraits</label>
      <label class="chk"><input type="checkbox" id="s_imgHidden" ${SET.imgHidden ? 'checked' : ''}> Start images hidden</label>
      <label class="chk"><input type="checkbox" id="s_repImg" ${SET.repImg !== false ? 'checked' : ''}> Period Report: auto-show saved encounter images</label>
      <label class="chk"><input type="checkbox" id="s_libPool" ${SET.libraryInPool ? 'checked' : ''}> Library templates appear in Admissions</label>
      <label class="chk"><input type="checkbox" id="s_thoughts" ${SET.showStudentThoughts !== false ? 'checked' : ''}> Show student inner thoughts on VIP reports</label>
    </div>
    <div class="row" style="margin-top:8px">
      <button class="primary" onclick="saveSettingsUI()">Save Image Settings</button>
      <span class="muted small">Image plugin: ${imgPlug ? '<span class="good">connected</span>' : '<span class="warn">not connected</span>'} · IndexedDB cache: ${DB ? '<span class="good">ready</span>' : '<span class="warn">unavailable</span>'}</span>
    </div>
  </section>

  <section class="card">
    <h2>Perchance AI Text (Optional)</h2>
    <p class="muted">Opt-in scene writing using Perchance's <code>ai-text-plugin</code>. Prompts live in <code>data/ai-prompts.json</code>. Plugin: ${txtPlug ? '<span class="good">connected</span>' : '<span class="warn">not connected</span>'}</p>
    <div class="row">
      <label class="chk"><input type="checkbox" id="ai_on" ${SET.ai && SET.ai.on ? 'checked' : ''}> Enable ✨ Write scene buttons</label>
      <label class="chk"><input type="checkbox" id="ai_auto" ${SET.ai && SET.ai.auto ? 'checked' : ''}> Auto-write Late-Night Visit scenes on Period Report</label>
      <label class="chk"><input type="checkbox" id="ai_bs" ${SET.ai && SET.ai.autoBackstory ? 'checked' : ''}> Auto-write backstories when enrolling new students</label>
    </div>
    <label class="muted">Extra prose guidance<textarea id="ai_guid">${esc((SET.ai && SET.ai.guidance) || '')}</textarea></label>
    <div class="row" style="margin-top:8px">
      <button class="primary" onclick="saveAiUI()">Save AI Settings</button>
    </div>
  </section>

  <section class="card">
    <h2>Data Files</h2>
    <p class="muted">All game text, balance numbers, outfits, traits, services, and prompts live in <code>data/*.json</code>.</p>
    <ul class="muted small" style="margin:6px 0 0 18px">
      ${(window.AURELIA_DATA || Object.keys(DATA)).map(n => `<li><code>data/${n}.json</code> ${DATA[n] ? '<span class="good">loaded</span>' : '<span class="warn">missing</span>'}</li>`).join('')}
    </ul>
  </section>

  <section class="card">
    <h2>Local Image Cache</h2>
    <p class="muted">Generated and uploaded images live locally in this browser's IndexedDB (${IMGKEYS.size} cached images).</p>
    <div class="row">
      <button onclick="exportImages()">Export Images</button>
      <button onclick="importImages()">Import Images</button>
      <button onclick="cleanImages()">Clean Unused Images</button>
    </div>
  </section>

  <section class="card">
    <h2>Save File &amp; Library</h2>
    <p class="muted">Auto-saves every period in browser <code>localStorage</code>. Export to transfer between devices.</p>
    <div class="row">
      <button onclick="save();toast('Saved.')">Save Now</button>
      <button onclick="exportBox('save')">Export Save</button>
      <button onclick="importBox('save')">Import Save Text</button>
      <button onclick="importSaveFile()">Import Save File</button>
      <button onclick="exportBox('lib')">Export Library (${LIB.length})</button>
      <button onclick="importBox('lib')">Import Library</button>
      <button class="warn" onclick="if(confirm('Start a brand new academy run? Current unsaved progress will be replaced.')) restart()">New Game</button>
    </div>
  </section>`;
}

function saveSettingsUI(){
  SET.style = $('#s_style').value;
  SET.negative = $('#s_neg').value;
  SET.resolution = $('#s_res').value;
  SET.autoImg = $('#s_autoImg').checked;
  SET.autoPortrait = $('#s_autoPort').checked;
  SET.imgHidden = $('#s_imgHidden').checked;
  SET.repImg = $('#s_repImg').checked;
  SET.libraryInPool = $('#s_libPool').checked;
  SET.showStudentThoughts = $('#s_thoughts').checked;
  saveSettings();
  toast('Image settings saved.');
}

function saveAiUI(){
  SET.ai = SET.ai || {};
  SET.ai.on = $('#ai_on').checked;
  SET.ai.auto = $('#ai_auto').checked;
  SET.ai.autoBackstory = $('#ai_bs').checked;
  SET.ai.guidance = $('#ai_guid').value;
  saveSettings();
  toast('AI settings saved.');
  render();
}

function dlText(text, name){
  try{
    const blob = new Blob([text], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }catch(e){
    toast('Download blocked here. Copy the text instead.');
  }
}

function exportBox(kind){
  const data = kind === 'save' ? S : LIB;
  if(!data) return toast('No data to export yet.');
  const fname = kind === 'save' ? `aurelia-save-y${S.year}-d${S.day}.json` : 'aurelia-library.json';
  modal(`<h2>Export ${esc(kind)}</h2>
    <textarea id="expTxt" style="min-height:220px">${esc(JSON.stringify(data))}</textarea>
    <div class="row" style="margin-top:8px">
      <button class="primary" onclick="try{navigator.clipboard.writeText($('#expTxt').value);toast('Copied.')}catch(e){toast('Copy manually.')}">Copy</button>
      <button onclick="dlText($('#expTxt').value,'${esc(fname)}')">Download File</button>
    </div>`);
}

function importBox(kind){
  modal(`<h2>Import ${esc(kind)}</h2>
    <textarea id="impTxt" style="min-height:220px" placeholder="Paste exported JSON here"></textarea>
    <div class="row" style="margin-top:8px">
      <button class="primary" onclick="doImport('${esc(kind)}')">Import</button>
    </div>`);
}

function importSaveFile(){
  const inp = $('#upJson');
  inp.value = '';
  inp.onchange = () => {
    const f = inp.files[0];
    if(!f) return;
    const fr = new FileReader();
    fr.onload = () => doImport('save', String(fr.result));
    fr.readAsText(f);
  };
  inp.click();
}

function doImport(kind, text){
  let d;
  try{ d = JSON.parse(text ?? $('#impTxt').value); }
  catch(e){ return toast('Invalid JSON text.'); }

  if(kind === 'save'){
    if(!d || !Array.isArray(d.students) || !d.director) return toast("That doesn't look like an Aurelia Academy save.");
    S = migrate(d);
    SETUP = null;
    save();
  } else if(kind === 'lib'){
    if(!Array.isArray(d)) return toast("That doesn't look like a student library.");
    LIB = d.map(ensureStudent);
    saveLib();
  }
  closeModal();
  toast('Imported successfully.');
  render();
}

async function exportImages(){
  const imgs = await idbAll('imgs');
  const thumbs = await idbAll('thumbs');
  if(!Object.keys(imgs).length) return toast('No cached images to export.');
  dlText(JSON.stringify({ imgs, thumbs }), `aurelia-images-d${(S && S.day) || 1}.json`);
}

function importImages(){
  const inp = $('#upJson');
  inp.value = '';
  inp.onchange = () => {
    const f = inp.files[0];
    if(!f) return;
    const fr = new FileReader();
    fr.onload = async () => {
      try{
        const d = JSON.parse(String(fr.result));
        if(!d || typeof d.imgs !== 'object') return toast('Invalid image bundle.');
        for(const [k, v] of Object.entries(d.imgs)) await imgPut(k, v);
        if(d.thumbs && typeof d.thumbs === 'object'){
          for(const [id, t] of Object.entries(d.thumbs)){
            THUMBS[id] = t;
            await idbReq('thumbs', 'readwrite', st => st.put(t, id));
          }
        }
        toast(`Imported ${Object.keys(d.imgs).length} images.`);
        render();
      }catch(e){ toast('Failed to import images: ' + e.message); }
    };
    fr.readAsText(f);
  };
  inp.click();
}

async function cleanImages(){
  const n = await purgeUnusedImages();
  toast(`Cleaned ${n} unused cached image${n === 1 ? '' : 's'}.`);
  render();
}
