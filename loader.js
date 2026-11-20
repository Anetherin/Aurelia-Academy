/* Aurelia Academy loader.
   Injects the stylesheet and the page markup, loads data/*.json, then loads the game scripts in order.
   Used by the Perchance shim (perchance/panel.html) and by index.html.
   Scripts are classic (non-module) scripts that share globals, so ORDER MATTERS. */
(function(){
  'use strict';
  var me = document.currentScript;
  var BASE = me ? me.src.replace(/loader\.js(\?.*)?$/, '') : './';
  var V = (me && (me.src.match(/[?&]v=([^&]+)/)||[])[1]) || String(Date.now());

  var FILES = [
    'js/core/config.js',
    'js/core/util.js',
    'js/logic/character.js',
    'js/logic/prompts.js',
    'js/logic/imagegen.js',
    'js/logic/ai.js',
    'js/logic/state.js',
    'js/logic/economy.js',
    'js/logic/simulation.js',
    'js/setup.js',
    'js/ui/core.js',
    'js/ui/sheet.js',
    'js/ui/report.js',
    'js/ui/settings.js',
    'js/main.js'
  ];
  window.AURELIA_FILES = FILES;

  // Editable data, loaded before any script runs. Each becomes window.AA_DATA['<name>'].
  var DATA_FILES = ['balance', 'academy', 'people', 'services', 'scenes', 'snippets', 'ai-prompts'];
  var DATA_DIRS = [];
  window.AURELIA_DATA = DATA_FILES;
  window.AURELIA_DATA_DIRS = DATA_DIRS;

  var MARKUP = [
    '<header id="hdr"></header>',
    '<div id="app"><nav id="tabs"></nav><main id="view"><p style="padding:20px;color:#94a3b8">Loading Aurelia Academy…</p></main></div>',
    '<footer id="ftr"></footer>',
    '<div id="modal" class="modal hidden" onclick="if(event.target===this&&!MODAL_LOCK)closeModal()"><div id="modalBox" class="modal-box"></div></div>',
    '<div id="modal2" class="modal modal2 hidden" onclick="if(event.target===this)closeModal2()"><div id="modal2Box" class="modal-box wide"></div></div>',
    '<div id="toast"></div>',
    '<input type="file" id="upFile" accept="image/*" style="display:none">',
    '<input type="file" id="upJson" accept=".json,application/json" style="display:none">'
  ].join('\n');

  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = BASE + 'css/style.css?v=' + V;
  document.head.appendChild(link);

  if(!document.getElementById('app')) document.body.insertAdjacentHTML('beforeend', MARKUP);

  var failed = false;
  function fail(msg){
    if(failed) return;
    failed = true;
    var v = document.getElementById('view');
    if(v) v.innerHTML = '<p style="padding:20px;color:#fb7185">' + msg + '</p>';
  }

  window.AA_DATA = window.AA_DATA || {};
  function getJSON(rel){
    return fetch(BASE + 'data/' + rel + '?v=' + V).then(function(r){
      if(!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(null, function(e){
      throw new Error('<code>data/' + rel + '</code>: ' + (e instanceof SyntaxError ? 'not valid JSON (' + e.message + ').' : e.message));
    });
  }
  function isObj(o){ return o && typeof o === 'object' && !Array.isArray(o); }
  function mergeInto(dst, src, at){
    Object.keys(src).forEach(function(k){
      var d = dst[k], v = src[k];
      if(!(k in dst)) dst[k] = v;
      else if(Array.isArray(d) && Array.isArray(v)) dst[k] = d.concat(v);
      else if(isObj(d) && isObj(v)) mergeInto(d, v, at + k + '.');
      else { console.warn('[data] ' + at + k + ' defined twice'); dst[k] = v; }
    });
    return dst;
  }
  function loadSet(n){
    if(DATA_DIRS.indexOf(n) < 0) return getJSON(n + '.json');
    return getJSON(n + '/index.json').then(function(parts){
      return Promise.all(parts.map(function(p){ return getJSON(n + '/' + p + '.json'); }));
    }).then(function(list){
      var out = {};
      list.forEach(function(d){ mergeInto(out, d, n + ': '); });
      return out;
    });
  }

  Promise.all(DATA_FILES.map(function(n){
    return loadSet(n).then(function(d){ window.AA_DATA[n] = d; });
  })).then(loadScripts, function(e){ fail('Couldn\'t load ' + e.message); });

  function loadScripts(){
    FILES.forEach(function(f){
      var s = document.createElement('script');
      s.src = BASE + f + '?v=' + V;
      s.async = false;
      s.onerror = function(){ fail('Couldn\'t load <code>' + f + '</code> from ' + BASE + '. Is GitHub Pages enabled for the repo?'); };
      document.body.appendChild(s);
    });
  }
})();
