'use strict';
/* =====================================================================
   PROGRAMMATIC IMAGE PROMPTS
   Mirrors Penchant Lantern's brace-safe, adult-only prompt assembly.
   ===================================================================== */
function bustInfo(size){
  return (PEOPLE.busts || []).find(b => b.size === size) || { size: 'C', img: '' };
}

function hairText(d){
  const c = (d.hairColor || '').trim();
  const s = (d.hairStyle || '').trim();
  if(!c) return s;
  if(!s) return `${c} hair`;
  return /\bhair\b/i.test(s) ? `${c} ${s}` : `${c} hair, ${s}`;
}

function bodyDesc(s){
  const d = s.design || {};
  const bust = bustInfo(d.bust).img;
  const h = d.heightCm || 166;
  const hTag = h >= 176 ? 'tall' : h <= 157 ? 'petite' : '';
  const build = (d.build || '').trim();
  const parts = [];
  if(hTag && !build.toLowerCase().includes(hTag)) parts.push(hTag);
  if(build) parts.push(`${build} figure`);
  if(bust) parts.push(bust);
  return parts.join(', ');
}

function charDesc(s){
  const d = s.design || {};
  const parts = [
    'beautiful adult woman',
    hairText(d),
    d.eyes ? `${d.eyes} eyes` : (d.eyeColor ? `${d.eyeColor} eyes` : ''),
    d.skinTone ? `${d.skinTone} skin` : '',
    bodyDesc(s),
    d.feature ? d.feature : ''
  ];
  return cleanText(parts.filter(Boolean).join(', '));
}

function outfitInfo(s, slot){
  const list = PEOPLE.outfits[slot] || PEOPLE.outfits.class || [];
  const chosenId = s.design && s.design.outfits && s.design.outfits[slot];
  return list.find(o => o.id === chosenId) || list[0] || { id: 'default', label: 'Academy Attire', desc: 'tailored dark academy blazer and skirt' };
}

function outfitText(s, slot){
  const info = outfitInfo(s, slot);
  const color = (s.design && s.design.favColor) || 'midnight indigo';
  return String(info.desc || '').replace(/\{color\}/g, color);
}

function underInfo(s){
  const uid = s.design && s.design.underwearId;
  return (PEOPLE.underwear || []).find(u => u.id === uid) || PEOPLE.underwear[0];
}

function underText(s){
  const u = underInfo(s);
  const color = (s.design && s.design.favColor) || 'midnight indigo';
  return String(u.desc || '').replace(/\{color\}/g, color);
}

function pubicText(s){
  const hc = String((s.design && s.design.hairColor) || 'dark').split(/\s+/)[0];
  return (SNIPPETS.clothing.pubic || 'natural {hair} pubic hair').replace(/\{hair\}/g, hc);
}

function clothText(s, cloth, sceneKey){
  const info = sceneInfo(sceneKey);
  const slot = info.outfitSlot || 'class';
  const cId = cloth || info.cloth || 'dressed';
  const tpl = SNIPPETS.clothing[cId] || SNIPPETS.clothing.dressed;
  let out = tpl
    .replace(/\{outfit\}/g, outfitText(s, slot))
    .replace(/\{underwear\}/g, underText(s))
    .replace(/\{pubic\}/g, pubicText(s));
  if(s.design && s.design.bust === 'AA'){
    out = out.replace(/\bbare breasts\b/gi, 'bare flat chest');
  }
  return cleanText(out);
}

function sceneInfo(sceneKey){
  if(String(sceneKey || '').startsWith('svc:')){
    const sid = sceneKey.slice(4);
    const svc = SERVICES[sid];
    const base = SCENES.job_Private_Service || {};
    if(svc){
      return {
        label: `VIP: ${svc.label}`,
        comp: 'with_man',
        setting: base.setting || 'luxurious private velvet suite, dim warm sconces',
        cloth: (svc.image && svc.image.cloth) || 'partial',
        outfitSlot: 'service',
        intimate: true,
        pose: (svc.image && svc.image.pose) || base.pose,
        extra: (svc.image && svc.image.extra) || ''
      };
    }
  }
  return SCENES[sceneKey] || SCENES.portrait;
}

function exprText(exprKey){
  return (SNIPPETS.expressions && SNIPPETS.expressions[exprKey]) || SNIPPETS.expressions.composed || '';
}

function dedupeSegs(t){
  const seen = new Set();
  return String(t || '')
    .split(',')
    .map(x => x.trim())
    .filter(x => {
      if(!x) return false;
      const k = x.toLowerCase();
      if(seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .join(', ');
}

function promptSafe(t){
  return cleanText(String(t || '').replace(/\{[^}]*\}/g, ''));
}

function buildPrompt(s, sceneKey = 'portrait', cloth, opts = {}){
  const sc = sceneInfo(sceneKey);
  const cState = cloth || sc.cloth || 'dressed';
  const peopleTag = (SCENES_DATA.people && SCENES_DATA.people[sc.comp]) || SCENES_DATA.people.solo;
  const partnerTag = sc.comp === 'with_man'
    ? (sc.pov ? SCENES_DATA.directorPhrase : SCENES_DATA.clientPhrase)
    : '';
  const expr = exprText(opts.expr || (sc.intimate ? 'alluring' : 'composed'));
  const snipKey = sc.pov
    ? 'pov'
    : sc.intimate
      ? 'private'
      : String(sceneKey).startsWith('class_')
        ? 'class'
        : String(sceneKey).startsWith('job_')
          ? 'club'
          : 'rest';
  const snip = (SNIPPETS.scenes && SNIPPETS.scenes[snipKey]) || '';

  const parts = [
    peopleTag,
    partnerTag,
    sc.pose || '',
    charDesc(s),
    clothText(s, cState, sceneKey),
    expr,
    sc.setting || '',
    sc.extra || '',
    snip,
    SET.style || DEFAULT_SETTINGS.style
  ];
  return promptSafe(dedupeSegs(parts.filter(Boolean).join(', ')));
}
