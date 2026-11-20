'use strict';
/* =====================================================================
   OPT-IN PERCHANCE AI TEXT GENERATION
   Uses ai = {import:ai-text-plugin} when embedded inside Perchance.
   ===================================================================== */
function getTextPlugin(){
  const P = window.AA_PLUGINS;
  if(P && typeof P.ai === 'function') return P.ai;
  try{ if(typeof ai === 'function') return ai; }catch(e){}
  if(typeof window.ai === 'function') return window.ai;
  return null;
}

const YOUTH_TEST = new RegExp(YOUTH_RE.source, 'i');

function aiCtx(s, x = {}){
  const scene = x.scene || 'portrait';
  const sc = sceneInfo(scene);
  const cloth = x.cloth || sc.cloth || 'dressed';
  return {
    name: s.name,
    age: s.age,
    major: s.major,
    traits: (s.traits || []).join(', ') || 'none',
    appearance: cleanText(charDesc(s)),
    clothing: cleanText(clothText(s, cloth, scene)),
    outfit: outfitText(s, sc.outfitSlot || 'class'),
    compliance: Math.round((s.skills && s.skills.compliance) || 0),
    lust: Math.round((s.skills && s.skills.lust) || 0),
    depravity: Math.round(s.depravity || 0),
    arousal: Math.round(s.arousal || 0),
    director: (S && S.director && S.director.name) || 'Vane',
    service: x.service || 'private company',
    tier: x.tier || 'Decent',
    setting: sc.setting || 'Aurelia Academy',
    situation: x.situation || 'a private meeting after hours',
    backstory: s.description || '',
    guidance: (SET.ai && SET.ai.guidance) || AI_FILE.guidance || ''
  };
}

function fillAiTpl(tpl, ctx){
  return String(tpl || '').replace(/\{(\w+)\}/g, (m, k) => ctx[k] !== undefined ? String(ctx[k]) : m);
}

async function aiWrite(boxId, kind, sid, extra = {}){
  const box = $('#' + boxId);
  const s = findStudent(sid);
  if(!box || !s) return null;

  const plug = getTextPlugin();
  if(!plug){
    box.innerHTML = `<div class="muted small">AI text plugin isn't connected. In Perchance, add <code>ai = {import:ai-text-plugin}</code> to your Lists panel.</div>`;
    return null;
  }

  const tpl = DEFAULT_AI_TPL[kind] || DEFAULT_AI_TPL.night_visit;
  const ctx = aiCtx(s, extra);
  const instruction = fillAiTpl(tpl, ctx).replace(/ {2,}/g, ' ').trim();

  box.innerHTML = `<div class="ai-box muted">Writing scene…</div>`;
  const out = box.firstChild;
  let full = '';

  try{
    const r = plug({
      instruction,
      onChunk: (d) => {
        full = (d && d.fullTextSoFar !== undefined) ? d.fullTextSoFar : full + ((d && d.textChunk) || '');
        out.classList.remove('muted');
        out.textContent = full;
      }
    });
    const res = await r;
    let text = typeof res === 'string' ? res : (res && (res.text || res.generatedText || res.output)) || full;
    text = String(text || '').trim();
    if(!text){
      out.textContent = 'Nothing came back. Try again.';
      return null;
    }
    if(YOUTH_TEST.test(text)){
      out.textContent = 'Generation discarded by adult-character safety filter. Try again.';
      return null;
    }
    out.classList.remove('muted');
    out.textContent = text;
    return text;
  }catch(e){
    out.textContent = 'AI text error: ' + e.message;
    return null;
  }
}

async function aiBackstory(boxId, sid){
  const s = findStudent(sid);
  if(!s) return;
  const text = await aiWrite(boxId, 'backstory', sid);
  if(text){
    s.description = cleanText(text);
    if(S) save();
    toast('Student backstory updated.');
  }
}

async function autoWriteBackstory(s){
  if(!s || !SET.ai || !SET.ai.on || !SET.ai.autoBackstory) return;
  const plug = getTextPlugin();
  if(!plug) return;
  const tpl = DEFAULT_AI_TPL.backstory;
  if(!tpl) return;
  const instruction = fillAiTpl(tpl, aiCtx(s, { scene: 'portrait' })).replace(/ {2,}/g, ' ').trim();
  try{
    const res = await plug({ instruction });
    const text = String(typeof res === 'string' ? res : (res && (res.text || res.generatedText || res.output)) || '').trim();
    if(text && !YOUTH_TEST.test(text)){
      s.description = cleanText(text);
      if(S) save();
      const el = $('#bs_' + s.id);
      if(el) el.textContent = s.description;
      else if(S) render();
    }
  }catch(e){}
}

function aiBtn(boxId, kind, sid, extra){
  if(!SET.ai || !SET.ai.on) return '';
  const payload = JSON.stringify(extra || {}).replace(/'/g, '&#39;');
  return `<button class="sm" onclick='aiWrite("${esc(boxId)}","${esc(kind)}","${esc(sid)}",${payload})'>✨ Write scene</button>`;
}
