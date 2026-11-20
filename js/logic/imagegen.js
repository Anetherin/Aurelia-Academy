'use strict';
/* =====================================================================
   DYNAMIC IMAGE GENERATION (Perchance t2i + IndexedDB cache)
   No R2/cloud sync — all NPCs are procedurally generated or saved locally.
   ===================================================================== */
function getPlugin(){
  const P = window.AA_PLUGINS;
  if(P && typeof P.t2i === 'function') return P.t2i;
  try{ if(typeof t2i === 'function') return t2i; }catch(e){}
  if(typeof window.t2i === 'function') return window.t2i;
  return null;
}

function extractUrl(d){
  if(!d) return null;
  if(typeof d === 'string') return /^(data:image|blob:|https?:)/.test(d) ? d : null;
  for(const k of ['dataUrl', 'dataURL', 'imageDataUrl', 'imageUrl', 'url', 'src']){
    if(typeof d[k] === 'string' && /^(data:image|blob:|https?:)/.test(d[k])) return d[k];
  }
  for(const k of ['canvas', 'imageCanvas']){
    if(d[k] && d[k].toDataURL){
      try{ return d[k].toDataURL('image/jpeg', 0.92); }catch(e){}
    }
  }
  if(d.image && d.image.src) return d.image.src;
  return null;
}

function findStudent(id){
  if(SETUP && Array.isArray(SETUP.applicants)){
    const f = SETUP.applicants.find(s => s.id === id);
    if(f) return f;
  }
  if(S){
    const s = (S.students || []).find(x => x.id === id) || (S.applicants || []).find(x => x.id === id);
    if(s) return s;
  }
  return (LIB || []).find(x => x.id === id) || null;
}

function imgKey(s, scene, cloth){
  return `${s.id}|${scene}|${cloth}`;
}

async function saveImage(key, url, s, scene){
  const small = await shrink(url, 768, 0.88);
  if(!small){
    toast("Couldn't process that image to save locally. Download it and use Upload.");
    return false;
  }
  await imgPut(key, small);
  if(s && (scene === 'portrait' || !THUMBS[s.id])) await setThumb(s.id, small);
  return true;
}

function syncImgBtn(boxId){
  const b = $('#' + boxId + '_t');
  const box = $('#' + boxId);
  if(b && box) b.textContent = box.dataset.key ? '🙈 Hide image' : '🖼 Show image';
}

async function showImg(boxId, id, scene = 'portrait', cloth, mode, opts = {}){
  const box = $('#' + boxId);
  const s = findStudent(id);
  if(!box || !s) return;

  const sc = sceneInfo(scene);
  cloth = cloth || sc.cloth || 'dressed';

  if(opts && opts.expr) box.dataset.expr = opts.expr;
  const expr = (opts && opts.expr) || box.dataset.expr || undefined;

  const startHidden = box.dataset.hide ? box.dataset.hide === '1' : !!SET.imgHidden;
  if(startHidden && mode !== 'new'){
    box.dataset.key = '';
    if(box.dataset.ext){ box.innerHTML = ''; syncImgBtn(boxId); return; }
    const safeA0 = `'${esc(boxId)}','${esc(id)}','${esc(scene)}','${esc(cloth)}'`;
    box.innerHTML = `<div class="row imgshow"><button class="sm" onclick="toggleImg(${safeA0},false)">🖼 Show image</button></div>`;
    return;
  }

  if(mode === undefined) mode = SET.autoImg !== false ? 'auto' : 'manual';
  if(mode === 'manual') mode = undefined;

  const safeA = `'${esc(boxId)}','${esc(id)}','${esc(scene)}','${esc(cloth)}'`;
  const key = imgKey(s, scene, cloth);
  box.dataset.key = key;
  syncImgBtn(boxId);

  const prompt = buildPrompt(s, scene, cloth, expr ? { expr } : {});
  const saved = mode === 'new' ? null : await imgGet(key);

  if(box.dataset.key !== key || !box.isConnected) return;
  box.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.className = 'imgbox';
  box.appendChild(wrap);

  if(saved){
    wrap.innerHTML = `<img src="${saved}" alt="${esc(s.name)}">`;
  } else if(mode === 'new' || mode === 'auto'){
    generateInto(wrap, s, key, prompt, scene, mode === 'new', boxId, id, cloth);
  } else {
    wrap.innerHTML = `<div class="imgph">No saved image for this scene yet.</div>`;
  }

  const safeFilePrefix = esc(s.name.replace(/[^a-z0-9 _-]/gi, '').trim() || 'student');
  const bar = document.createElement('div');
  bar.className = 'row';
  bar.innerHTML = `<button class="sm" onclick="toggleImg(${safeA},true)">Hide</button>`
    + `<button class="sm" onclick="showImg(${safeA},'new')">${saved ? 'Regenerate' : 'Generate'}</button>`
    + `<button class="sm" onclick="uploadImg(${safeA})">Upload</button>`
    + (saved
      ? `<button class="sm" onclick="downloadImg('${esc(key)}','${safeFilePrefix}')">Save file</button>`
        + `<button class="sm" onclick="useAvatar('${esc(key)}','${esc(id)}')">Use as Avatar</button>`
        + `<button class="sm" onclick="deleteImg('${esc(key)}',${safeA})">Clear</button>`
      : '');
  box.appendChild(bar);

  const det = document.createElement('details');
  det.className = 'prompt';
  if(!getPlugin() && !saved) det.open = true;
  det.innerHTML = `<summary class="muted">Image Prompt</summary><textarea readonly>${esc(prompt)}</textarea>`;
  const cb = document.createElement('button');
  cb.className = 'sm';
  cb.textContent = 'Copy prompt';
  cb.onclick = () => {
    try{ navigator.clipboard.writeText(prompt); toast('Prompt copied.'); }
    catch(e){ toast('Select the prompt text and copy manually.'); }
  };
  det.appendChild(cb);
  box.appendChild(det);
}

function generateInto(wrap, s, key, prompt, scene, reroll, boxId, id, cloth){
  const plug = getPlugin();
  if(!plug){
    wrap.innerHTML = `<div class="imgph">Image generator not connected.<br>In Perchance, add <code>t2i = {import:text-to-image-plugin}</code> to your Lists panel.<br>You can still Upload an image or copy the prompt below.</div>`;
    return;
  }
  s.imgVar = s.imgVar || {};
  if(reroll) s.imgVar[key] = (s.imgVar[key] || 0) + 1;
  const seed = ((s.seed || 1) + (s.imgVar[key] || 0) * 7919) % 2147483647;
  let done = false;

  const onFinish = async (data) => {
    if(done) return;
    const url = extractUrl(data);
    if(!url) return;
    done = true;
    if(await saveImage(key, url, s, scene)){
      toast('Image saved.');
      const b = $('#' + boxId);
      if(b && b.dataset.key === key) showImg(boxId, id, scene, cloth);
    }
  };

  try{
    const r = plug({
      prompt,
      negativePrompt: SET.negative,
      seed,
      resolution: SET.resolution,
      onFinish
    });
    const html = (r && typeof r === 'object' && 'evaluateItem' in r) ? r.evaluateItem : String(r);
    wrap.innerHTML = html + `<div class="imgph small">Generating… saves locally when finished.</div>`;
  }catch(e){
    wrap.innerHTML = `<div class="imgph">Image plugin error: ${esc(e.message)}</div>`;
  }
  if(S) save();
}

function uploadImg(boxId, id, scene, cloth){
  const inp = $('#upFile');
  inp.value = '';
  inp.onchange = () => {
    const f = inp.files[0];
    if(!f) return;
    const fr = new FileReader();
    fr.onload = async () => {
      const s = findStudent(id);
      if(!s) return;
      if(await saveImage(imgKey(s, scene, cloth), fr.result, s, scene)){
        toast('Image saved.');
        showImg(boxId, id, scene, cloth);
      }
    };
    fr.readAsDataURL(f);
  };
  inp.click();
}

async function downloadImg(key, name){
  const d = await imgGet(key);
  if(!d) return;
  const a = document.createElement('a');
  a.href = d;
  a.download = `${name || 'student'}-${key.split('|').slice(1).join('-').replace(/[^a-z0-9-]/gi, '_')}.jpg`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function useAvatar(key, id){
  const d = await imgGet(key);
  if(d){
    await setThumb(id, d);
    toast('Avatar updated.');
  }
}

async function deleteImg(key, boxId, id, scene, cloth){
  if(!confirm('Clear this image from local browser cache?')) return;
  await imgDel(key);
  showImg(boxId, id, scene, cloth, 'manual');
}

function toggleImgBtn(boxId, id, scene, cloth, expr){
  const box = $('#' + boxId);
  if(!box) return;
  if(expr) box.dataset.expr = expr;
  const shown = !!box.dataset.key;
  box.dataset.hide = shown ? '1' : '0';
  showImg(boxId, id, scene, cloth || null, shown ? 'manual' : 'auto', expr ? { expr } : {});
}

function toggleImg(boxId, id, scene, cloth, hide){
  const box = $('#' + boxId);
  if(!box) return;
  box.dataset.hide = hide ? '1' : '0';
  showImg(boxId, id, scene, cloth, hide ? 'manual' : undefined);
}

function avatarHTML(s){
  if(THUMBS[s.id]){
    return `<div class="avatar"><img src="${THUMBS[s.id]}" alt="${esc(s.name)}"></div>`;
  }
  return `<div class="avatar" style="background:${hairHex(s)}">${esc(initials(s.name))}</div>`;
}
