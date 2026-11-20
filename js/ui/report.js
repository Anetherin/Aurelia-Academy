'use strict';
/* =====================================================================
   PERIOD REPORT & INTELLIGENCE FEED
   ===================================================================== */
function viewReport(){
  const lp = S.lastPeriod;
  const lpHtml = lp ? `<section class="card">
    <div class="row" style="justify-content:space-between">
      <div>
        <h2>Period Report: Year ${S.year} · Day ${lp.day} (${esc(lp.time)})</h2>
        <div class="muted">Income: <b class="good">+${fmtMoney(lp.income)}</b> · Upkeep/Incidents: <b class="warn">-${fmtMoney(lp.upkeep)}</b> · Net: <b class="${lp.net >= 0 ? 'good' : 'warn'}">${fmtMoney(lp.net)}</b></div>
      </div>
    </div>
    <div class="col-list" style="margin-top:10px">
      ${(lp.highlights || []).map(h => {
        const boxId = h.id + '_img';
        const aiId = h.id + '_ai';
        const hasImg = !!(h.studentId && h.scene);
        const safeShow = hasImg ? `toggleImgBtn('${esc(boxId)}','${esc(h.studentId)}','${esc(h.scene)}','${esc(h.cloth || 'dressed')}')` : '';
        return `<div class="hl ${esc(h.kind || '')}">
          <div class="row" style="justify-content:space-between">
            <b>${esc(h.title)}</b>
            <div class="row">
              ${hasImg ? `<button class="sm" id="${esc(boxId)}_t" onclick="${safeShow}">🖼 Show image</button>` : ''}
              ${h.aiKind && h.studentId ? aiBtn(aiId, h.aiKind, h.studentId, h.aiExtra) : ''}
            </div>
          </div>
          <p style="margin:4px 0">${esc(h.text)}</p>
          ${SET.showStudentThoughts && h.subtext ? `<p class="muted small" style="margin:2px 0;font-style:italic">${esc(h.subtext)}</p>` : ''}
          ${hasImg ? `<div id="${esc(boxId)}" data-ext="1" data-hide="1"></div>` : ''}
          ${h.aiKind && h.studentId ? `<div id="${esc(aiId)}"></div>` : ''}
        </div>`;
      }).join('') || '<p class="muted">No notable incidents or encounters occurred this period.</p>'}
    </div>
  </section>` : `<section class="card"><h2>Period Report</h2><p class="muted">Advance a period to generate your first shift report.</p></section>`;

  const filters = ['all', 'private', 'success', 'warning', 'error', 'info'];
  const hist = (S.history || []).filter(h => HIST_FILTER === 'all' || h.type === HIST_FILTER || (HIST_FILTER === 'warning' && String(h.type).startsWith('tier_')));

  return lpHtml + `<section class="card">
    <div class="row" style="justify-content:space-between">
      <h3>Intelligence Feed</h3>
      <div class="row">
        ${filters.map(f => `<button class="sm ${HIST_FILTER === f ? 'on' : ''}" onclick="HIST_FILTER='${f}';render()">${cap(f)}</button>`).join('')}
      </div>
    </div>
    <div class="loglist">
      ${hist.map(h => `<div class="log-${esc(h.type)}"><span class="muted small">${esc(h.stamp)}</span> ${esc(h.text)}</div>`).join('') || '<p class="muted">No intelligence records match this filter.</p>'}
    </div>
  </section>`;
}
