'use strict';
/* =====================================================================
   ENTRYPOINT
   ===================================================================== */
async function init(){
  await idbOpen();
  THUMBS = (await idbAll('thumbs')) || {};
  IMGKEYS = new Set((await imgKeysAll()) || []);
  LIB = (Array.isArray(LIB) ? LIB : []).map(ensureStudent);

  const saved = store.get(KEY_SAVE);
  if(!saved || !Array.isArray(saved.students) || !saved.director){
    S = null;
    startSetup();
  } else {
    S = migrate(saved);
    save();
    render();
  }
}

init();
