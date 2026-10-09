/* ============================================================
   Chap Wai — Prototype (ทุกสิทธิ์การใช้งาน)
   ============================================================ */

/* ---------- state ---------- */
const state = {
  role: 'member',
  companyId: 'c1',
  screen: 'hub',
  docFilter: 'flagged',
  range: '6m',
  tenantId: 't1',            /* สำนักงานที่กำลังดูอยู่ — ข้อมูลทุกอย่างถูกกั้นด้วยค่านี้ */
  support: null,             /* {tenant, reason, since} — โหมดเข้าไปช่วยสำนักงานอื่น */
  errors: JSON.parse(JSON.stringify(SYS_ERRORS)),   /* คัดลอกมาเพื่อให้กด "แจ้งผู้ให้บริการ" ได้ */
  tenants: JSON.parse(JSON.stringify(TENANTS)),     /* คัดลอกมาเพื่อให้เติมเครดิตได้จริงในเซสชัน */
  editRole: 'accountant',    /* บทบาทที่กำลังแก้สิทธิ์อยู่ในหน้า "สิทธิ์การใช้งาน" */
  acctId: 'u3',              /* นักบัญชีคนที่กำลังสวมบทบาทอยู่ — คนละคนได้รับมอบหมายบริษัทคนละชุด */
  docQuery: '',              /* คำค้นในทะเบียนเอกสาร — ใบที่ผ่านแล้วไม่ต้องอยู่ในสายตา แต่ต้องหาเจอ */
  allCos: false,             /* ดูรวมทุกบริษัทที่ได้รับมอบหมาย แทนทีละบริษัท (ใช้ทั้งหน้าเอกสารและหน้างาน) */
  taskQuery: '',             /* คำค้นในหน้างานและคำขอ */
  taskStatus: 'open',        /* ค้างอยู่ / ปิดแล้ว / ทั้งหมด — เปิดมาเจอเฉพาะที่ต้องทำ */
  staleDays: 3,              /* กี่วันถือว่าใบติดธงค้างนาน — เป็น SLA ของแต่ละสำนักงาน ไม่ใช่สิ่งที่ระบบรู้เอง */
  editCap: null,             /* ความสามารถที่เพิ่งถูกเลือกจากตาราง — ไว้ไฮไลต์ */
  bahtPerPage: 1,            /* ค่าอ่านที่สำนักงานเก็บจากลูกค้า (บาท/หน้า) — ตั้งเพิ่มลดได้ */
  confMin: 0.7,              /* ต่ำกว่านี้ = ติดธงให้คนตรวจ — ค่าเริ่มต้นคือเกณฑ์เดียวกับที่ใช้ตั้งสถานะในข้อมูลตัวอย่าง */
  apiCostPerPage: 0.20,      /* ต้นทุนเรียกโมเดลต่อหน้า — สำนักงานถือ API key เอง บิลจึงมาที่สำนักงานตรง
                                ค่าเริ่มต้นเป็นตัวเลขสมมติ ให้กรอกจากบิลจริงเมื่อใช้งานแล้ว */
  creditWarnPages: CREDIT_WARN_PAGES,  /* เกณฑ์เตือนเครดิต — ปริมาณอ่านของแต่ละสำนักงานต่างกันมาก จึงต้องตั้งเองได้ */
  dateFormat: 'ce',          /* รูปแบบวันที่ในไฟล์ส่งออก — ค.ศ. / พ.ศ. / ISO · ตัวอย่างไฟล์ในหน้าส่งออกอ่านค่านี้ */
  rangeFrom: '2026-08-01',
  rangeTo: '2026-08-28',
  taskTab: 'task',
  lineStep: 'start',
  lineChat: null,
  lineLog: [],
  docs: JSON.parse(JSON.stringify(DOCUMENTS)),
  tasks: JSON.parse(JSON.stringify(TASKS)),
  exports: JSON.parse(JSON.stringify(EXPORTS)),
  audit: JSON.parse(JSON.stringify(AUDIT)),
  members: JSON.parse(JSON.stringify(MEMBERS)),
  companies: JSON.parse(JSON.stringify(COMPANIES)),
  assignments: JSON.parse(JSON.stringify(ASSIGNMENTS)),
  categories: JSON.parse(JSON.stringify(CATEGORIES)),
  catOff: JSON.parse(JSON.stringify(CAT_OFF)),      /* หมวดที่ระงับ — ไม่ให้เลือกกับใบใหม่ แต่ใบเก่ายังคงหมวดเดิม */
  catCoOff: JSON.parse(JSON.stringify(CAT_CO_OFF)),  /* หมวดที่แต่ละบริษัทปิดเอง — บริษัทอื่นยังใช้ได้ */
  openDoc: null
};

/* ---------- helpers ---------- */
const $ = (s, r) => (r || document).querySelector(s);
const nf = new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nf0 = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 });
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/* escape ที่นี่เลย เพราะค่าวันที่มาจากสิ่งที่คนพิมพ์เองได้ และถูกเอาไปต่อใน HTML หลายที่ */
const fmtD = d => esc((d && d.length >= 10) ? `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}` : (d || '—'));
/* วันที่ในไฟล์ส่งออกใช้รูปแบบที่สำนักงานตั้งไว้ คนละตัวกับวันที่บนหน้าจอ — พ.ศ. ต่างจาก ค.ศ. 543 ปี */
const fmtExp = d => !d || d.length < 10 ? '—' : state.dateFormat === 'iso' ? esc(d)
  : esc(`${d.slice(8, 10)}/${d.slice(5, 7)}/${state.dateFormat === 'be' ? +d.slice(0, 4) + 543 : d.slice(0, 4)}`);
const money = v => v == null ? '—' : nf.format(v);
const company = () => state.companies.find(c => c.id === state.companyId);
const role = () => ROLES[state.role];
/* บริษัทที่บทบาทนี้เห็น — กั้นด้วย tenant ก่อนเสมอ แล้วค่อยตัดตามบทบาท
   member/owner เห็นบริษัทตัวเอง · accountant เห็นเฉพาะที่ได้รับมอบหมาย · เจ้าของสำนักงานเห็นทั้งสำนักงาน */
function tenantCompanies(tid) {
  return state.companies.filter(c => c.tenant === (tid || state.tenantId)).map(c => c.id);
}
/* นักบัญชีในสำนักงานนี้ — ใช้ทั้งตัวเลือกมุมมองและตารางมอบหมาย */
function acctsOfTenant(tid) {
  const cos = tenantCompanies(tid);
  return state.members.filter(m => m.role === 'accountant' && cos.indexOf(m.company) > -1);
}
/* บริษัทที่นักบัญชีคนหนึ่งได้รับมอบหมาย — อ่านจากตารางมอบหมายจริง ไม่ใช่เดาจากลำดับบริษัท */
function assignedTo(userId, tid) {
  const cos = tenantCompanies(tid);
  return state.assignments.filter(a => a.user === userId && cos.indexOf(a.company) > -1).map(a => a.company);
}

function roleCompanies(role, tid) {
  const inT = tenantCompanies(tid);
  const r = role || state.role;
  if (!inT.length) return [];
  if (r === 'member' || r === 'owner') return inT.slice(0, 1);
  if (r === 'accountant') {
    const me = acctId(tid);
    const mine = me ? assignedTo(me, tid) : [];
    /* ยังไม่ถูกมอบหมายบริษัทไหนเลย = ไม่เห็นอะไรเลย ซึ่งถูกแล้ว ไม่ใช่ให้เห็นทั้งสำนักงาน */
    return mine;
  }
  return inT;
}
/* นักบัญชีคนที่กำลังสวมบทบาทอยู่ — เปลี่ยนได้เพื่อดูว่าคนละคนเห็นไม่เหมือนกัน */
function acctId(tid) {
  const list = acctsOfTenant(tid);
  if (!list.length) return null;
  return list.some(m => m.id === state.acctId) ? state.acctId : list[0].id;
}
const tenantOf = id => state.tenants.find(t => t.id === (id || state.tenantId)) || state.tenants[0];
const tenant = () => tenantOf(state.tenantId);
const tenantName = id => (state.tenants.find(t => t.id === id) || {}).name || id;

/* ---------- ค่าระบบแบบเติมเงินล่วงหน้า ----------
   คุณตี๋ถือ API key คนเดียว จ่ายค่าโมเดลตรง · สำนักงานที่ซื้อไปจ่ายเป็น "ค่าระบบต่อหน้า" ให้คุณตี๋
   หักจากเครดิตที่เติมไว้ล่วงหน้า เครดิตหมดเมื่อไหร่บอทหยุดรับใบ
   คุณตี๋จึงไม่เคยออกค่าโมเดลให้ใครก่อน — ตัดความเสี่ยงเก็บเงินไม่ได้ออกทั้งก้อน   */

/* ต้นทุนต่อหน้าของสำนักงานหนึ่ง ๆ — คนละก้อนกันคนละความหมาย จึงต้องถามจากสำนักงาน ไม่ใช่ค่ากลางค่าเดียว */
const costPerPage = tid => {
  const t = tenantOf(tid);
  return t.owner ? state.apiCostPerPage : (t.rate || 0);
};

/* หน้าที่อ่านสำเร็จสะสม — ใบที่อ่านไม่ออกไม่คิดเงินทั้งสองฝั่ง */
function tenantPages(tid) {
  const cos = tenantCompanies(tid);
  const real = state.docs.filter(d => !d.deleted && d.status !== 'unreadable' && cos.indexOf(d.company) > -1).length;
  return (tenantOf(tid).priorPages || 0) + real;
}

/* ยอดคงเหลือคำนวณสดเสมอ = เติมมาทั้งหมด − หน้าที่อ่านไปแล้ว × เรท
   ไม่เก็บยอดคงเหลือไว้เป็นตัวเลขแยก เพราะสองแหล่งจะเพี้ยนจากกันวันใดวันหนึ่งเสมอ */
function credit(tid) {
  const t = tenantOf(tid), rate = t.rate || 0;
  const pages = tenantPages(tid);
  const topped = (t.topups || []).reduce((s, x) => s + x.amount, 0);
  const used = +(pages * rate).toFixed(2);
  const left = +(topped - used).toFixed(2);
  const pagesLeft = rate > 0 ? Math.floor(left / rate) : null;
  return {
    t, rate, pages, topped, used, left, pagesLeft,
    st: t.owner ? 'owner' : left <= 0 ? 'stop' : pagesLeft < state.creditWarnPages ? 'low' : 'ok'
  };
}
const CREDIT_TH = { owner: 'สำนักงานของคุณเอง', ok: 'ใช้งานปกติ', low: 'เครดิตใกล้หมด', stop: 'ระงับ — เครดิตหมด' };
const CREDIT_CLS = { owner: 'neutral', ok: 'clean', low: 'flagged', stop: 'unreadable' };

const TOPUP_AMOUNTS = [500, 1000, 2000, 5000];

function topupModal(tid) {
  const cr = credit(tid);
  modal(`
    <h2>เติมเครดิตค่าระบบ</h2>
    <p class="small muted">${esc(cr.t.name)} · ค่าระบบ ${money(cr.rate)} บาทต่อหน้าที่อ่านสำเร็จ
    — เติมแล้วใช้ได้ทันที ไม่มีวันหมดอายุ</p>
    <div class="sum-row"><span>คงเหลือตอนนี้</span><b class="${cr.left <= 0 ? 'warn' : ''}">${money(cr.left)} ฿</b></div>
    <div class="sum-row"><span>อ่านได้อีก</span><b>${cr.pagesLeft <= 0 ? 'ไม่ได้แล้ว' : cr.pagesLeft.toLocaleString() + ' หน้า'}</b></div>
    <div class="form-row" style="margin-top:1rem">
      <label>จำนวนเงินที่เติม</label>
      <select id="topAmt">
        ${TOPUP_AMOUNTS.map(v => `<option value="${v}">${v.toLocaleString()} บาท · ${Math.floor(v / cr.rate).toLocaleString()} หน้า</option>`).join('')}
      </select>
    </div>
    <div class="issue info" style="margin:0">
      ${ic('shieldCheck', 15)}
      <div><b>เครดิตหมดแล้วบอทหยุดรับใบทันที</b> ข้อมูลเดิมยังอยู่ครบ ส่งออกได้ตามปกติ —
      เติมเมื่อไหร่กลับมารับใบต่อได้เลย ไม่ต้องตั้งค่าใหม่</div>
    </div>
    <div class="modal-foot">
      <button class="btn" data-close-modal>ยกเลิก</button>
      <button class="btn primary" data-act="dotopup" data-tid="${tid}">เติมเครดิต</button>
    </div>`);
}

function doTopup(tid) {
  const amt = +$('#topAmt').value;
  const t = tenantOf(tid);
  t.topups = (t.topups || []).concat([{ at: TODAY, amount: amt, by: meId(), note: 'เติมจากหน้าจอ' }]);
  closeModal();
  logAudit(`เติมเครดิตค่าระบบ ${money(amt)} บาท`, '', t.name);
  toast('เติมเครดิตแล้ว', 'ok', `${t.name} · คงเหลือ ${money(credit(tid).left)} บาท`);
  render();
}

/* การ์ดเครดิตของสำนักงานที่ซื้อระบบไปใช้ — เห็นบิลตัวเองล่วงหน้า ไม่ต้องรอใบแจ้งหนี้ */
function creditCard() {
  const cr = credit();
  if (cr.t.owner) return '';
  const pct = cr.topped > 0 ? Math.max(0, Math.min(100, Math.round(cr.left / cr.topped * 100))) : 0;
  return `
  <div class="card mt">
    <div class="card-head">
      <div>
        <h3>${ic('money', 15)} เครดิตค่าระบบ</h3>
        <div class="muted small">จ่ายเป็นรายหน้าที่อ่านสำเร็จ ${money(cr.rate)} บาท/หน้า — หักจากเครดิตที่เติมไว้</div>
      </div>
      <span class="badge ${CREDIT_CLS[cr.st]}">${esc(CREDIT_TH[cr.st])}</span>
    </div>
    <div class="credit-top">
      <div class="credit-big">
        <b class="${cr.st === 'ok' ? '' : 'warn'}">${money(cr.left)} <small>฿</small></b>
        <span>อ่านได้อีก ${cr.pagesLeft <= 0 ? '0' : cr.pagesLeft.toLocaleString()} หน้า</span>
      </div>
      <button class="btn primary" data-topup="${cr.t.id}">${ic('plus', 14)} เติมเครดิต</button>
    </div>
    <div class="prog-track"><i class="${cr.st === 'ok' ? '' : 'warn'}" style="width:${Math.max(1, pct)}%"></i></div>
    <div class="dash-4" style="margin-top:0.875rem">
      <div class="sum-row"><span>เติมมาแล้วทั้งหมด</span><b>${money(cr.topped)} ฿</b></div>
      <div class="sum-row"><span>หน้าที่อ่านสะสมตั้งแต่ ${fmtD(cr.t.since)}</span><b>${cr.pages.toLocaleString()} หน้า</b></div>
      <div class="sum-row"><span>ใช้ไปแล้ว</span><b>${money(cr.used)} ฿</b></div>
      <div class="sum-row"><span>เติมครั้งล่าสุด</span><b>${(cr.t.topups || []).length ? esc(cr.t.topups[cr.t.topups.length - 1].at) : '—'}</b></div>
    </div>
    ${cr.st === 'stop'
      ? `<div class="issue mt-s">${ic('alertTriangle', 14)}<div><b>บอทหยุดรับใบใหม่แล้ว</b> — เอกสารเดิมยังเปิดดูและส่งออกได้ครบ เติมเครดิตแล้วกลับมารับใบต่อได้ทันที</div></div>`
      : cr.st === 'low'
        ? `<div class="issue mt-s">${ic('alertTriangle', 14)}<div><b>เครดิตใกล้หมด</b> — เหลืออีก ${cr.pagesLeft.toLocaleString()} หน้า ต่ำกว่าเกณฑ์เตือนที่ตั้งไว้ ${state.creditWarnPages.toLocaleString()} หน้า เติมไว้ก่อนเพื่อไม่ให้บอทหยุดกลางเดือน</div></div>`
        : `<div class="muted mt-s" style="font-size:.72rem">ค่าระบบคิดเฉพาะหน้าที่อ่านสำเร็จ — ใบที่อ่านไม่ออกหรือถูกข้ามไม่คิดเงิน · ไฟล์ที่เก็บไว้เฉย ๆ ไม่มีค่าใช้จ่าย</div>`}
  </div>`;
}

/* การ์ดรายรับของเจ้าของระบบ — ขายระบบได้เท่าไหร่ หลังหักค่าโมเดลที่ออกให้ก่อน */
function platformRevenueCard() {
  const rows = state.tenants.map(t => credit(t.id));
  const paid = rows.filter(r => !r.t.owner);
  const rev = paid.reduce((s, r) => s + r.used, 0);
  const apiAll = rows.reduce((s, r) => s + r.pages * state.apiCostPerPage, 0);
  const apiForOthers = paid.reduce((s, r) => s + r.pages * state.apiCostPerPage, 0);
  const held = paid.reduce((s, r) => s + Math.max(0, r.left), 0);
  return `
  <div class="card mt">
    <div class="card-head">
      <div>
        <h3>${ic('money', 15)} รายรับจากการขายระบบ</h3>
        <div class="muted small">สะสมตั้งแต่เปิดใช้ · คิดจากหน้าที่อ่านสำเร็จ × ค่าระบบของแต่ละสำนักงาน · รวมยอดยกมาก่อนเริ่มเก็บข้อมูลตัวอย่าง ${rows.reduce((s, r) => s + (r.t.priorPages || 0), 0).toLocaleString()} หน้า</div>
      </div>
      ${paid.some(r => r.st !== 'ok') ? `<span class="badge flagged">${paid.filter(r => r.st !== 'ok').length} สำนักงานต้องดู</span>` : '<span class="badge clean">ทุกสำนักงานปกติ</span>'}
    </div>
    <div class="kpi-row" style="margin-bottom:1rem">
      ${kpi({ icon: 'money', tone: 'tone-success', label: 'รายรับค่าระบบสะสม', value: money(rev) + ' ฿',
              sub: `จาก ${paid.length} สำนักงานที่ซื้อไปใช้` })}
      ${kpi({ icon: 'server', label: 'ค่าโมเดลที่ออกให้เขา', value: money(apiForOthers) + ' ฿',
              sub: `${money(state.apiCostPerPage)} ฿/หน้า · จ่ายเจ้าของโมเดลตรง` })}
      ${kpi({ icon: 'checkCircle', tone: 'tone-success', label: 'เหลือจากการขายระบบ', value: money(+(rev - apiForOthers).toFixed(2)) + ' ฿',
              sub: 'ไม่รวมกำไรจากสำนักงานตัวเอง' })}
      ${kpi({ icon: 'inbox', tone: held > 0 ? '' : 'tone-warning', label: 'เครดิตที่ถือไว้ล่วงหน้า', value: money(held) + ' ฿',
              sub: 'เงินที่รับมาแล้วแต่ยังไม่ได้ให้บริการ' })}
    </div>
    <div class="tablewrap">
      <table>
        <thead><tr><th>สำนักงาน</th><th>ค่าระบบ</th><th class="num">หน้าที่อ่าน<div class="muted small">1 ใบ = 1 หน้า</div></th><th class="num">รายรับ</th><th class="num">ค่าโมเดล</th><th class="num">เหลือ</th><th class="num">เครดิตคงเหลือ</th><th>สถานะ</th></tr></thead>
        <tbody>
        ${rows.map(r => {
    const api = +(r.pages * state.apiCostPerPage).toFixed(2);
    return `<tr class="${r.st === 'stop' ? 'row-unreadable' : r.st === 'low' ? 'row-flagged' : ''}">
          <td><b>${esc(r.t.name)}</b><div class="muted small">เริ่มใช้ ${fmtD(r.t.since)}</div></td>
          <td class="nowrap">${r.t.owner ? '<span class="muted small">— ของตัวเอง</span>' : money(r.rate) + ' ฿/หน้า'}</td>
          <td class="num">${r.pages.toLocaleString()}</td>
          <td class="num">${r.t.owner ? '<span class="muted small">—</span>' : money(r.used)}</td>
          <td class="num muted">${money(api)}</td>
          <td class="num">${r.t.owner ? '<span class="muted small">—</span>' : `<b>${money(+(r.used - api).toFixed(2))}</b>`}</td>
          <td class="num">${r.t.owner ? '<span class="muted small">—</span>'
        : `<b class="${r.st === 'ok' ? '' : 'warn'}">${money(r.left)}</b><div class="muted small">${Math.max(0, r.pagesLeft).toLocaleString()} หน้า</div>`}</td>
          <td class="nowrap"><span class="badge ${CREDIT_CLS[r.st]}">${esc(CREDIT_TH[r.st])}</span>
            ${r.t.owner ? '' : `<div style="margin-top:.375rem"><button class="btn small" data-topup="${r.t.id}">${ic('plus', 12)} เติมให้</button></div>`}</td>
        </tr>`;
  }).join('')}
        </tbody>
      </table>
    </div>
    <div class="muted small" style="margin-top:0.625rem">
      ค่าโมเดลรวมทุกสำนักงาน ${money(apiAll)} ฿ — ส่วนที่ออกให้สำนักงานอื่นถูกคุมด้วยเครดิตที่เติมไว้ก่อน จึงไม่มีทางจ่ายเกินที่เก็บมาแล้ว
    </div>
  </div>`;
}
const visibleCompanies = () => state.companies.filter(c => roleCompanies().includes(c.id));
const ROLE_USER = { member: 'u1', owner: 'u2', accountant: 'u3', office_admin: 'u4' };
const meId = () => state.role === 'accountant' ? (acctId() || ROLE_USER.accountant) : ROLE_USER[state.role];
const uname = id => id === 'sys' ? 'ผู้ดูแลระบบ' : (state.members.find(m => m.id === id) || {}).name || id;
const companyName = id => (state.companies.find(c => c.id === id) || {}).name || id;

/* ค่าเริ่มต้นของตารางสิทธิ์ — ไว้เทียบว่าถูกแก้อะไรไปบ้าง และกดคืนค่าได้ */
const CAPS_DEFAULT = JSON.parse(JSON.stringify(CAPS.map(c => ({ id: c.id, r: c.r }))));
/* จำนวนโมดูลนับจากผังสิทธิ์จริง — เพิ่มหรือตัดความสามารถแล้วตัวเลขบนหน้าจอขยับตามเอง */
const MODULE_COUNT = new Set(CAPS.flatMap(c => c.module.split(' · '))).size;
const defaultOf = (capId, role) => (CAPS_DEFAULT.find(c => c.id === capId) || { r: {} }).r[role];

/* ค่าที่เลือกได้ของแต่ละช่อง — cond ใช้ได้เฉพาะสิทธิ์ระดับ 2a ที่ผูกกับ financial_visibility
   ส่วน partial เปิดให้เฉพาะความสามารถที่ออกแบบมารองรับ (เช่น ดูประวัติเฉพาะของตัวเอง) */
function cellOptions(cap) {
  const o = ['full'];
  if (cap.level === '2a') o.push('cond');
  if (Object.values((CAPS_DEFAULT.find(c => c.id === cap.id) || { r: {} }).r).includes('partial')) o.push('partial');
  o.push('none');
  return o;
}

/* สรุปว่าถูกแก้ไปกี่ช่อง */
function capDiffs() {
  const out = [];
  CAPS.forEach(c => ROLE_ORDER.forEach(r => {
    if (c.r[r] !== defaultOf(c.id, r)) out.push({ cap: c, role: r, from: defaultOf(c.id, r), to: c.r[r] });
  }));
  return out;
}

function resetCaps() {
  CAPS.forEach(c => {
    const d = CAPS_DEFAULT.find(x => x.id === c.id);
    if (d) ROLE_ORDER.forEach(r => { c.r[r] = d.r[r]; });
  });
  logAudit('คืนค่าตารางสิทธิ์เป็นค่าเริ่มต้น', '', 'ทุกช่อง');
  toast('คืนค่าตารางสิทธิ์แล้ว', 'ok', 'กลับไปเป็นชุดที่เสนอไว้ในเอกสาร');
  render();
}

/* ตั้งค่าสิทธิ์ตรง ๆ จากปุ่มตัวเลือก */
function setCap(capId, role, val) {
  const cap = CAPS.find(c => c.id === capId);
  if (!cap || cap.r[role] === val) return;

  if (capId === 'tenant_admin' && role === 'office_admin' && val !== 'full') {
    toast('ถอดสิทธิ์นี้ไม่ได้', 'err', 'เจ้าของสำนักงานต้องคงสิทธิ์จัดการ tenant ไว้ ไม่งั้นจะไม่มีใครแก้สิทธิ์ได้อีก');
    return;
  }

  const before = cap.r[role];
  cap.r[role] = val;
  logAudit(`เปลี่ยนสิทธิ์ "${cap.name}" ของ ${ROLES[role].th}`, MARK[before].th, MARK[val].th);

  /* เตือนเมื่อออกนอกกรอบที่เอกสารกำหนด แต่ไม่บล็อก — ให้ทดลองระหว่างคุยกับลูกค้าได้ */
  let warn = '';
  if (cap.level === '2b' && val === 'full' && role !== 'owner' && role !== 'office_admin')
    warn = 'เอกสารระบุว่าสิทธิ์ระดับ 2b เป็นของเจ้าของเท่านั้น — เปลี่ยนได้ แต่ควรบันทึกว่าตัดสินใจต่างจากเอกสาร';
  if (cap.level === '2b' && val === 'none' && role === 'owner')
    warn = 'ถอดสิทธิ์ 2b ออกจากเจ้าของ = ไม่มีใครตั้งค่าบริษัทนี้ได้อีกนอกจากเจ้าของสำนักงาน';

  toast(`${cap.name} → ${MARK[val].th}`, warn ? 'err' : 'ok', warn || `${ROLES[role].th} · มีผลทั้งระบบทันที`);
  render();
}

/* ให้/ถอนสิทธิ์ทั้งระดับในคลิกเดียว */
function bulkLevel(role, level, val) {
  let n = 0;
  CAPS.filter(c => c.level === level).forEach(c => {
    if (c.id === 'tenant_admin' && role === 'office_admin' && val !== 'full') return;
    if (c.r[role] !== val) { c.r[role] = val; n++; }
  });
  if (!n) return;
  logAudit(`${val === 'full' ? 'ให้' : 'ถอด'}สิทธิ์ระดับ ${level} ทั้งหมดของ ${ROLES[role].th}`, '', n + ' ความสามารถ');
  toast(`${val === 'full' ? 'ให้' : 'ถอด'}สิทธิ์ระดับ ${level} แล้ว ${n} ข้อ`, 'ok', ROLES[role].th);
  render();
}

/* คัดลอกชุดสิทธิ์จากบทบาทอื่นมาทั้งชุด */
function copyRole(from, to) {
  if (from === to) return;
  let n = 0;
  CAPS.forEach(c => {
    if (c.id === 'tenant_admin' && to === 'office_admin') return;
    if (c.r[to] !== c.r[from]) { c.r[to] = c.r[from]; n++; }
  });
  logAudit(`คัดลอกสิทธิ์จาก ${ROLES[from].th} มาที่ ${ROLES[to].th}`, '', n + ' ความสามารถ');
  toast(`คัดลอกสิทธิ์แล้ว ${n} ข้อ`, 'ok', `${ROLES[from].th} → ${ROLES[to].th}`);
  render();
}

/* คืนค่าเริ่มต้นเฉพาะบทบาทเดียว */
function resetRole(role) {
  let n = 0;
  CAPS.forEach(c => {
    const d = defaultOf(c.id, role);
    if (c.r[role] !== d) { c.r[role] = d; n++; }
  });
  if (!n) { toast('บทบาทนี้ยังเป็นค่าเริ่มต้นอยู่แล้ว'); return; }
  logAudit(`คืนค่าสิทธิ์ของ ${ROLES[role].th} เป็นค่าเริ่มต้น`, '', n + ' ความสามารถ');
  toast(`คืนค่าสิทธิ์ของ ${ROLES[role].th} แล้ว`, 'ok', n + ' ข้อกลับเป็นค่าเริ่มต้น');
  render();
}

/* ---------- แผงแก้สิทธิ์รายบทบาท ---------- */
function roleEditor() {
  const r = state.editRole;
  const R = ROLES[r];
  const okCount = CAPS.filter(c => {
    const prev = state.role; state.role = r;
    const v = can(c.id).ok; state.role = prev; return v;
  }).length;
  const changed = capDiffs().filter(d => d.role === r).length;

  const group = lv => {
    const caps = CAPS.filter(c => c.level === lv);
    const L = LEVELS.find(x => x.id === lv);
    const allFull = caps.every(c => c.r[r] === 'full');
    return `
    <div class="perm-group">
      <div class="pg-head">
        <div>
          <b>${esc(L.name)}</b>
          <span class="muted small"> · ${esc(L.lead)}</span>
        </div>
        <div class="pg-bulk">
          <button class="btn small" data-bulk="${r}|${lv}|${allFull ? 'none' : 'full'}">
            ${allFull ? ic('minus', 12) + ' ถอดทั้งระดับ' : ic('check', 12) + ' ให้ทั้งระดับ'}
          </button>
        </div>
      </div>
      ${caps.map(c => {
      const opts = cellOptions(c);
      const cur = c.r[r];
      const isDiff = cur !== defaultOf(c.id, r);
      return `
        <div class="perm-row ${state.editCap === c.id ? 'focus' : ''} ${isDiff ? 'diff' : ''}">
          <div class="pr-info">
            <b>${esc(c.name)}</b>
            <span class="muted small">${esc(c.sub)} · ${esc(c.module)}</span>
          </div>
          <div class="seg">
            ${opts.map(o => `<button class="seg-opt ${cur === o ? 'on ' + MARK[o].cls : ''}"
              data-setcap="${c.id}|${r}|${o}" title="${esc(MARK[o].th)}">${ic(MARK[o].icon, 13)}<span>${esc(MARK[o].th)}</span></button>`).join('')}
          </div>
        </div>`;
    }).join('')}
    </div>`;
  };

  return `
  <div class="card mt" id="roleEditor">
    <div class="card-head">
      <div>
        <h3>แก้ไขสิทธิ์รายบทบาท</h3>
        <div class="muted small">เลือกบทบาท แล้วกดตัวเลือกที่ต้องการได้เลย — เปลี่ยนแล้วมีผลทั้งระบบทันที</div>
      </div>
      <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap">
        <label class="muted small">คัดลอกจาก
          <select class="field" data-copyfrom="${r}" style="min-width:9rem;margin-left:0.25rem">
            <option value="">— เลือก —</option>
            ${ROLE_ORDER.filter(x => x !== r).map(x => `<option value="${x}">${esc(ROLES[x].th)}</option>`).join('')}
          </select>
        </label>
        <button class="btn small ${changed ? '' : 'outline'}" data-resetrole="${r}">${ic('refresh', 12)} คืนค่าบทบาทนี้</button>
      </div>
    </div>

    <div class="chips">
      ${ROLE_ORDER.map(x => `<button class="chip ${state.editRole === x ? 'on' : ''}" data-editrole="${x}">${esc(ROLES[x].th)}</button>`).join('')}
    </div>

    <div class="role-sum">
      <span class="role-avatar" style="width:32px;height:32px;font-size:0.75rem">${esc(R.initial)}</span>
      <div>
        <b>${esc(R.th)} <span class="muted small">· ${esc(R.key)}</span></b>
        <div class="muted small">${esc(R.desc)}</div>
      </div>
      <span class="spacer"></span>
      <span class="badge clean">${okCount}/${CAPS.length} ความสามารถ</span>
      ${changed ? `<span class="badge orange">แก้ไปแล้ว ${changed} ข้อ</span>` : '<span class="badge neutral">ยังเป็นค่าเริ่มต้น</span>'}
    </div>

    ${LEVELS.map(l => group(l.id)).join('')}
  </div>`;
}

/* ---------- permission engine ---------- */
function can(capId) {
  const cap = CAPS.find(c => c.id === capId);
  const v = cap.r[state.role];
  if (v === 'cond') {
    const on = !!company().financial_visibility;
    return {
      ok: on, value: 'cond', cap,
      reason: on
        ? `บริษัท "${company().name}" เปิด financial_visibility ไว้ — สิทธิ์ระดับ 2a จึงเปิดให้สมาชิกกลุ่ม`
        : `บริษัท "${company().name}" ปิด financial_visibility — สมาชิกกลุ่มจะไม่เห็นยอดสรุป (เจ้าของเป็นผู้ตั้งค่า)`
    };
  }
  if (v === 'partial') return { ok: true, value: 'partial', cap, reason: 'เห็นได้เฉพาะรายการที่ตัวเองเป็นคนทำ' };
  if (v === 'full') return { ok: true, value: 'full', cap, reason: '' };
  return {
    ok: false, value: 'none', cap,
    reason: `ต้องเป็นสิทธิ์ระดับ ${cap.level} — บทบาทที่ทำได้: ${ROLE_ORDER.filter(r => cap.r[r] === 'full').map(r => ROLES[r].th).join(' · ') || 'ไม่มี'}`
  };
}

function toast(msg, kind, sub) {
  const el = document.createElement('div');
  el.className = 'toast' + (kind ? ' ' + kind : '');
  el.innerHTML = `<strong>${esc(msg)}</strong>` + (sub ? `<small>${esc(sub)}</small>` : '');
  $('#toastWrap').appendChild(el);
  setTimeout(() => el.remove(), 4200);
}

function denied(capId) {
  const c = can(capId);
  toast('ไม่มีสิทธิ์ · ' + c.cap.name, 'err', c.reason);
  logAudit(`พยายามใช้งาน "${c.cap.name}" แต่ถูกปฏิเสธ`, '', 'denied');
}

/* ทั้ง prototype ตรึงวันไว้ที่ TODAY — ถ้าใช้นาฬิกาเครื่องจริง ประวัติการใช้งานจะโผล่วันที่ล้ำอนาคต
   และปนกับรายการที่ hardcode ไว้ · เดินนาทีเองเพื่อให้สิ่งที่กดในเซสชันเรียงตามลำดับจริง */
let stampSeq = 0;
const nowStamp = () => {
  const t = 9 * 60 + 45 + (stampSeq++);
  const p = n => String(n).padStart(2, '0');
  return `${TODAY} ${p(Math.floor(t / 60) % 24)}:${p(t % 60)}`;
};

/* บริษัทของรายการต้องส่งเข้ามาได้ — ในโหมดดูรวมทุกบริษัท คนแก้เอกสารของอีกบริษัทได้
   ถ้าผูกกับบริษัทที่เลือกอยู่เสมอ ประวัติจะบันทึกว่าเกิดที่บริษัทผิด */
function logAudit(action, before, after, company) {
  state.audit.unshift({
    at: nowStamp(),
    actor: meId(), company: company || state.companyId, action, before: before || '', after: after || '', live: true,
    /* ทำในโหมดช่วยเหลือหรือไม่ — modal สัญญาว่าจะแยกให้เห็น ถ้าไม่เก็บตอนบันทึกก็ย้อนดูไม่ได้อีกเลย */
    support: state.support ? state.support.reason : ''
  });
}

/* ---------- derived data ---------- */
/* ขอบเขตบริษัทของหน้าเอกสารและหน้างาน — ดูทีละบริษัท หรือรวมทุกบริษัทที่ได้รับมอบหมาย
   ใช้ค่าเดียวกันทั้งสองหน้า เพราะเป็นการเลือก "ขอบเขต" ไม่ใช่ตัวกรองเฉพาะหน้า */
const scopeCos = () => state.allCos ? roleCompanies() : [state.companyId];
const docsOf = () => state.docs.filter(d => d.company === state.companyId && !d.deleted);
const docsScope = () => state.docs.filter(d => scopeCos().indexOf(d.company) > -1 && !d.deleted);
const tasksScope = () => state.tasks.filter(t => scopeCos().indexOf(t.company) > -1);

/* ---------- องค์กรผู้สั่ง · การตรวจรับ · ผู้ตาม (B-13 · B-14 · B-15) ----------
   เดิม prototype รู้จักแต่ "ใครสั่ง" เป็นรายคน ซึ่งตอบสามคำถามนี้ไม่ได้เลย
   1 นักบัญชีปิดงานอะไรได้บ้าง  2 ลูกค้ากดเสร็จแล้วฝ่ายที่สั่งรู้ได้ยังไง  3 งานเลยกำหนดใครถูกตาม
   ทั้งสามข้อเป็นคำถามระดับ "องค์กร" ไม่ใช่ระดับบุคคล จึงต้องรู้ว่าแต่ละคนสังกัดฝั่งไหน       */
const coTenant = coId => (state.companies.find(c => c.id === coId) || {}).tenant;
/* พนักงานกับเจ้าของสังกัดบริษัท · นักบัญชีกับหัวหน้าสำนักงานสังกัดสำนักงาน */
const orgOf = uid => {
  const m = state.members.find(x => x.id === uid);
  if (!m) return null;
  return (m.role === 'accountant' || m.role === 'office_admin') ? coTenant(m.company) : m.company;
};
/* องค์กรของคนที่กำลังสวมบทบาทอยู่ — อ่านจากสำนักงานที่ยืนอยู่ ไม่ใช่จากแถวสมาชิก
   เพราะหัวหน้าสำนักงานเข้าโหมดช่วยเหลือสำนักงานอื่นได้ ตอนนั้นเขาทำงานในนามสำนักงานนั้นจริง ๆ */
const myOrg = () => (state.role === 'accountant' || state.role === 'office_admin') ? state.tenantId : state.companyId;
const byOrgOf = t => t.byOrg || t.company;   /* งานเก่าที่ยังไม่มีคอลัมน์นี้ = งานภายในบริษัท */
const orgName = id => (state.companies.find(c => c.id === id) || {}).name || tenantName(id);

/* B-13 — ปิดงานได้ถ้าอยู่ในองค์กรเดียวกับงาน หรืออยู่ในองค์กรที่เป็นผู้สั่ง
   ท่อนแรกรักษาเหตุผลเดิมไว้ครบ ("เลขาปิดแทนหัวหน้าเป็นเรื่องปกติ") ซึ่งเป็นเหตุผลภายในบริษัท
   จึงไม่ควรลามไปให้คนนอกองค์กร · ท่อนหลังทำให้สำนักงานปิดงานที่ตัวเองสั่งได้ แม้คนสั่งจะลาออกไปแล้ว */
const mayClose = t => can('task_assign').ok && (myOrg() === t.company || myOrg() === byOrgOf(t));
/* B-14 — ต้องตรวจรับเมื่อผู้สั่งกับผู้รับอยู่คนละองค์กร งานภายในบริษัทเดียวกันไม่ต้อง */
const crossOrg = t => t.type === 'task' && byOrgOf(t) !== orgOf(t.assignee);
const dayGap = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
/* เหลือกี่วันก่อนถือว่ารับอัตโนมัติ — ใช้หน้าต่างเดียวกับ "เปิดงานกลับได้ภายใน 7 วัน" ที่เอกสารมีอยู่แล้ว
   ไม่ประดิษฐ์หน้าต่างใหม่ เพราะสองเรื่องนี้คือช่วงเวลาเดียวกันในความหมายจริง */
const acceptLeft = t => t.completedAt ? 7 - dayGap(t.completedAt.slice(0, 10), TODAY) : 7;
const waitAccept = t => t.status === 'done' && crossOrg(t) && !t.acceptedAt && acceptLeft(t) > 0;
const mayAccept = t => waitAccept(t) && myOrg() === byOrgOf(t);
/* หน้าต่างเปิดงานกลับ 7 วัน — เอกสารเขียนไว้ตั้งแต่แรก แต่ prototype เดิมกดได้ไม่จำกัดเวลา */
const mayReopen = t => t.status !== 'open' && acceptLeft(t) > 0 && (mayClose(t) || mayAccept(t));

/* B-15 — ปลายทางของบันไดเตือนคือ "ผู้สั่ง" ไม่ใช่เจ้าของบริษัทเสมอไป
   คนที่ต้องการงานชิ้นนั้นจริงคือคนที่ควรถูกถามว่าจะเลื่อนหรือยกเลิก
   ช่องทางต้องเลือกตามบทบาท เพราะสมาชิกกลุ่มไม่มีห้องแชท 1-1 กับบอท */
function followNote(t) {
  const who = uname(t.by);
  if (byOrgOf(t) !== t.company) return `ผู้ตาม: ${who} · แจ้งที่แท็บงานของสำนักงาน — ไม่กิน push ของกลุ่ม`;
  const m = state.members.find(x => x.id === t.by) || {};
  return m.role === 'owner'
    ? `ผู้ตาม: ${who} · เตือนในแชทส่วนตัวของเจ้าของ`
    : `ผู้ตาม: ${who} · ไม่มีห้อง 1-1 จึงแท็กเพิ่มในสรุปเช้า`;
}

/* ผังหมวดของสำนักงานที่กำลังดูอยู่ — UNCAT ต่อท้ายเสมอ ลบไม่ได้ เพราะต้องมีที่ให้ใบที่ AI ไม่มั่นใจตกลงมา */
const catsOf = () => (state.categories[state.tenantId] || []).slice();
const catCount = c => state.docs.filter(d => !d.deleted
  && tenantCompanies().indexOf(d.company) > -1 && d.category === c).length;

/* หมวดที่ระงับแล้ว — ยังอยู่ในผังและยังนับเอกสารได้ แต่หายจากตัวเลือกของใบใหม่ */
const catIsOff = c => (state.catOff[state.tenantId] || []).indexOf(c) > -1;
/* ตัวเลือกในดรอปดาวน์ — ต้องพ่วงค่าปัจจุบันเข้าไปเสมอแม้หมวดนั้นถูกระงับไปแล้ว
   ไม่งั้นเปิดแก้ใบเก่าที่อยู่ในหมวดที่ระงับ ค่า selected จะไม่ตรงสักตัว
   เบราว์เซอร์จะเลือกตัวแรกให้เอง แล้วหมวดของใบนั้นเปลี่ยนโดยที่ไม่มีใครสั่ง */
/* บริษัทนี้ปิดหมวดนี้เองหรือเปล่า — โรงงานมีค่าขนส่ง ร้านอาหารไม่มี */
const catIsCoOff = (c, co) => (state.catCoOff[co || state.companyId] || []).indexOf(c) > -1;
/* จำนวนบริษัทในสำนักงานที่ปิดหมวดนี้ — ถ้าปิดกันหมด แปลว่าผังกลางมีของที่ไม่มีใครใช้ */
const catCoOffCount = c => tenantCompanies().filter(id => catIsCoOff(c, id)).length;
/* เอกสารของหมวดนี้ เฉพาะในบริษัทที่ระบุ */
const catCountCo = (c, co) => state.docs.filter(d => !d.deleted
  && d.company === (co || state.companyId) && d.category === c).length;

/* ตัวเลือกที่ใช้ได้จริงของบริษัทหนึ่ง = ผังกลาง − ที่สำนักงานระงับ − ที่บริษัทนี้ปิดเอง
   ชุดนี้คือชุดเดียวกับที่ส่งให้โมเดลตอนอ่านใบ ยิ่งเหลือน้อยยิ่งจัดหมวดแม่น */
const catsUsable = (cur, co) => {
  const list = catsOf().filter(c => !catIsOff(c) && !catIsCoOff(c, co));
  if (cur && cur !== UNCAT && list.indexOf(cur) < 0) list.push(cur);
  return list;
};

/* ตัวเลือกบริษัท — โผล่เฉพาะบทบาทที่ดูแลมากกว่าหนึ่งบริษัท */
function coFilter(id) {
  const cos = roleCompanies();
  if (cos.length < 2) return '';
  return `<label class="cofilter">${ic('building', 13)}
    <select id="${id}" aria-label="เลือกบริษัท">
      <option value="__all" ${state.allCos ? 'selected' : ''}>ทุกบริษัทที่ดูแล (${cos.length})</option>
      ${cos.map(c => `<option value="${c}" ${!state.allCos && state.companyId === c ? 'selected' : ''}>${esc(companyName(c))}</option>`).join('')}
    </select></label>`;
}
function searchBox(id, val, ph) {
  return `<label class="docsearch">${ic('receipt', 14)}
    <input id="${id}" type="search" value="${esc(val || '')}" autocomplete="off"
      placeholder="${esc(ph)}" aria-label="${esc(ph)}"></label>`;
}

/* ---------- ช่วงเวลาของหน้าภาพรวม ---------- */
const TODAY = '2026-08-28';                       /* "วันนี้" ของ prototype */
const dayAdd = (iso, n) => {
  const t = new Date(iso + 'T00:00:00');
  t.setDate(t.getDate() + n);
  const p = x => String(x).padStart(2, '0');
  return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}`;
};
const monthAdd = (iso, n) => {
  const t = new Date(iso + 'T00:00:00');
  t.setMonth(t.getMonth() + n);
  const p = x => String(x).padStart(2, '0');
  return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}`;
};

/* คืน {from, to, label, mode} ของช่วงที่เลือก — mode = day | month */
function range() {
  const r = RANGES.find(x => x.id === state.range) || RANGES[3];
  if (r.id === 'custom') {
    const from = state.rangeFrom, to = state.rangeTo;
    const days = Math.round((new Date(to) - new Date(from)) / 86400000) + 1;
    return { from, to, label: `${fmtD(from)} – ${fmtD(to)}`, mode: days > 62 ? 'month' : 'day', days };
  }
  if (r.days) return { from: dayAdd(TODAY, -(r.days - 1)), to: TODAY, label: r.label, mode: 'day', days: r.days };
  const from = dayAdd(monthAdd(TODAY, -r.months), 1);
  return { from, to: TODAY, label: r.label, mode: 'month', months: r.months };
}

/* เอกสารเฉพาะในช่วงที่เลือก */
const docsInRange = () => {
  const g = range();
  return docsOf().filter(d => d.date >= g.from && d.date <= g.to);
};
const tasksOf = () => state.tasks.filter(t => t.company === state.companyId);
const membersOf = () => state.members.filter(m => m.company === state.companyId);

/* ใบที่ถูกแก้หลังส่งออกยังส่งออกไม่ครบ — ไฟล์ที่สำนักงานถืออยู่เป็นยอดเก่าจนกว่าจะอยู่ในชุดใหม่
   ทุกที่ที่นับ "ยังไม่ส่งออก" ต้องใช้กติกาเดียวกันนี้ ไม่งั้นปุ่มสร้างชุดกับ KPI นับคนละกอง */
const needsExport = d => !d.exportedAt || !!d.staleExport;

function stats(src) {
  const d = src || docsOf();
  const sum = k => d.reduce((a, x) => a + (x[k] || 0), 0);
  return {
    total: d.length,
    clean: d.filter(x => x.status === 'clean').length,
    flagged: d.filter(x => x.status === 'flagged').length,
    unreadable: d.filter(x => x.status === 'unreadable').length,
    amount: sum('total'), vat: sum('vat'),
    notExported: d.filter(needsExport).length
  };
}

/* ============================================================
   NAV
   ============================================================ */
const NAV = [
  {
    group: 'คอนโซล · M8', items: [
      { id: 'dashboard', ic: 'dashboard', label: 'ภาพรวม', cap: 'view_docs', req: 'console_access' },
      { id: 'documents', ic: 'receipt', label: 'เอกสาร', cap: 'view_docs', req: 'console_access', count: () => { const s = stats(docsScope()); return (s.flagged + s.unreadable) || null; } },
      { id: 'tasks', ic: 'tasks', label: 'งานและคำขอ', cap: 'task_assign', req: 'console_access', count: () => tasksScope().filter(t => t.status === 'open').length || null },
      { id: 'export', ic: 'upload', label: 'ส่งออกเอกสาร', cap: 'export', req: 'console_access' },
      /* เจ้าของก็นำเข้าเองได้ — ไฟล์เก่าเป็นของเขา Drive เป็นของเขา และค่าอ่านก็เขาจ่าย */
      { id: 'import', ic: 'inbox', label: 'ย้ายเอกสารเก่า', cap: 'upload', req: 'console_access' },
      { id: 'members', ic: 'users', label: 'สมาชิกและสิทธิ์', cap: 'member_view', req: 'console_access' },
      { id: 'settings', ic: 'settings', label: 'ตั้งค่า', cap: 'company_settings', req: 'console_access', anyCap: ['company_settings', 'office_settings', 'tenant_admin'] },
      { id: 'audit', ic: 'history', label: 'ประวัติการใช้งาน', cap: 'audit_view', req: 'console_access' }
    ]
  },
  {
    /* กลุ่มนี้ขึ้นเฉพาะคนที่ถือ tenant_admin — ตอนนี้คือเจ้าของสำนักงานคนเดียว
       แยกกลุ่มออกมาเพื่อให้เห็นชัดว่าเป็นงาน "ขายระบบ" ไม่ใช่งานบัญชีประจำวัน */
    group: 'เจ้าของระบบ', items: [
      { id: 'tenants', ic: 'building', label: 'สำนักงานลูกค้า', cap: 'tenant_admin', req: 'console_access',
        count: () => state.tenants.filter(t => !t.owner && credit(t.id).st !== 'ok').length || null }
    ]
  },
  {
    group: 'จำลองการใช้งานจริง', items: [
      { id: 'line', ic: 'chat', label: 'หน้าจอ LINE', cap: null }
    ]
  },
  {
    group: 'อ้างอิงจากเอกสาร', items: [
      { id: 'permissions', ic: 'shieldCheck', label: 'สิทธิ์การใช้งาน', cap: null }
    ]
  }
];

function navAllowed(item) {
  if (item.req) { const g = can(item.req); if (!g.ok) return g; }
  if (!item.cap) return { ok: true };
  if (item.anyCap) {
    const hit = item.anyCap.map(can).find(c => c.ok);
    return hit || can(item.cap);
  }
  return can(item.cap);
}

/* เมนูที่บทบาทปัจจุบันเข้าได้ — ใช้ทั้งใน sidebar และนับจำนวนหน้าจอในหน้ารวมสิทธิ์ */
function allowedItems() { return NAV.flatMap(g => g.items).filter(it => navAllowed(it).ok); }

function renderSidebar() {
  $('#sidebar').innerHTML = NAV.map(g => {
    const items = g.items.filter(it => navAllowed(it).ok);
    if (!items.length) return '';
    return `
    <div class="nav-group">
      <div class="nav-title">${esc(g.group)}</div>
      ${items.map(it => {
      const n = it.count ? it.count() : null;
      return `<button class="nav-item ${state.screen === it.id ? 'active' : ''}" data-nav="${it.id}">
          <span class="nav-ic">${ic(it.ic, 15)}</span><span>${esc(it.label)}</span>
          ${n ? `<span class="count">${n}</span>` : ''}
        </button>`;
    }).join('')}
    </div>`;
  }).join('') + sidebarFoot();
}

/* Quick Stats + การ์ดผู้ใช้ท้ายแถบข้าง — โครงเดียวกับ ERP Solar Cell */
function sidebarFoot() {
  /* ต้องนับด้วยขอบเขตเดียวกับป้ายตัวเลขข้างเมนูและหน้าเอกสาร/หน้างาน คือเคารพ state.allCos
     ไม่งั้นพอเลือก "ทุกบริษัทที่ดูแล" เมนูกับเนื้อหาบนจอเดียวกันจะบอกคนละเลข */
  const s = stats(docsScope());
  const me = state.members.find(m => m.id === meId()) || {};   /* ตัวตนในระบบนี้ผูกด้วย line_user_id — MEMBERS ไม่มีช่องอีเมลให้อ้าง */
  const openTasks = tasksScope().filter(t => t.status === 'open').length;
  const r = role();
  /* ประกาศขอบเขตให้ครบทั้งบริษัทและช่วงเวลา — ชุดนี้ไม่ผูกกับชิปช่วงเวลาบนหน้าภาพรวม */
  const qsScope = state.allCos ? `ทุกบริษัทที่ดูแล (${roleCompanies().length})` : 'ทั้งบริษัท';
  const quick = can('console_access').ok ? `
    <div class="nav-group">
      <div class="nav-title">Quick Stats · ${esc(qsScope)} · ทุกช่วงเวลา</div>
      <div class="qs">${ic('receipt', 13)}<span>เอกสารทั้งหมด</span><b>${s.total}</b></div>
      <div class="qs ${s.flagged + s.unreadable ? 'warn' : ''}">${ic('alertTriangle', 13)}<span>รอตรวจ</span><b>${s.flagged + s.unreadable}</b></div>
      <div class="qs">${ic('pin', 13)}<span>งานค้าง</span><b>${openTasks}</b></div>
    </div>` : '';

  return quick + `
    <div class="nav-foot">
      <div class="nu-role">${ic('shieldCheck', 13)}<span>${esc(r.th)}</span><b>ระดับ ${r.levels.join('/')}</b></div>
      <div class="nu-card">
        <span class="nu-av">${esc(r.initial)}</span>
        <div><b>${esc(uname(meId()))}</b><span>${esc(me.line || meId())}</span></div>
      </div>
    </div>`;
}

/* ============================================================
   TOP BARS
   ============================================================ */
function renderTop() {
  const rs = $('#roleSelect');
  rs.innerHTML = ROLE_ORDER.map(r => `<option value="${r}" ${state.role === r ? 'selected' : ''}>${ROLES[r].th} · ${r}</option>`).join('');

  const cs = $('#companySelect');
  const list = visibleCompanies();
  cs.innerHTML = list.map(c => `<option value="${c.id}" ${state.companyId === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
  /* dropdown บริษัทมีความหมายเฉพาะคนที่ดูแลหลายบริษัท — คนอื่นมีบริษัทเดียว ไม่ต้องแสดง */
  const sw = can('switch_company');
  $('#companySwitcher').hidden = !sw.ok;
}

function renderRolebar() {
  const r = role();
  const co = company();
  const fv = co.financial_visibility;
  $('#rolebar').innerHTML = `
    <div class="who">
      <div class="role-avatar">${esc(r.initial)}</div>
      <div class="role-meta">
        <strong>${esc(r.th)} <span class="muted small">· ${esc(r.key)}</span></strong>
        <small>${esc(r.desc)}</small>
      </div>
    </div>
    <div class="level-badges">
      ${LEVELS.map(l => `<span class="lvl ${r.levels.includes(l.id) ? 'on l' + l.id : ''}">ระดับ ${l.id}</span>`).join('')}
    </div>
    <span class="spacer"></span>
    ${state.role === 'accountant' && acctsOfTenant().length > 1
      ? `<label class="scope-pill acct-pick">${ic('calculator', 12)} ดูในมุมของ
          <select id="acctSelect">${acctsOfTenant().map(m =>
        `<option value="${m.id}" ${acctId() === m.id ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select></label>`
      : ''}
    ${can('tenant_admin').ok
      ? `<span class="scope-pill">${ic('building', 12)} ${esc(tenant().name)} <b>· ${esc(tenant().plan)}</b></span>`
      : can('switch_company').ok
        ? `<span class="scope-pill">${ic('building', 12)} ${esc(tenant().name)}</span>` : ''}
    <span class="scope-pill">ขอบเขต: ${esc(r.scope)}</span>
    ${can('tenant_admin').ok
      ? `<span class="scope-pill">financial_visibility ของบริษัทนี้: <b>${fv ? 'เปิด' : 'ปิด'}</b></span>`
      : `<span class="scope-pill">ให้ทีมเห็นยอดสรุป: <b>${fv ? 'เปิด' : 'ปิด'}</b></span>`}`;
}

/* ============================================================
   SCREENS
   ============================================================ */
function srcline(txt) {
  return `<div class="srcline">${ic('file', 13)} <b>อ้างอิงเอกสาร:</b> ${esc(txt)}</div>`;
}

/* ---------- หน้ารวมสิทธิ์ (Role Hub) ---------- */
function screensFor(r) {
  const prev = state.role;
  state.role = r;
  const n = allowedItems().length;
  state.role = prev;
  return n;
}

function scHub() {
  return `
  <div class="hub">
    <div class="hub-head">
      <div class="hub-meta">
        <span class="badge brand">Prototype</span>
        <span class="hub-chip">${state.tenants.length} สำนักงาน · ${state.companies.length} บริษัท</span>
        <span class="hub-chip">${ROLE_ORDER.length} บทบาท</span>
        <span class="hub-chip">${MODULE_COUNT} โมดูล · เฟส 1</span>
      </div>
      <h1>Chap Wai<br>ผู้ช่วยงานเอกสารบนไลน์ สำหรับสำนักงานบัญชี</h1>
      <p>หน้ารวมสิทธิ์ผู้ใช้ (RBAC) — เลือกบทบาทเพื่อเข้าใช้งานในมุมมองนั้น ทุกหน้าใช้งานได้จริง
      (ส่งเอกสาร · ตรวจใบติดธง · แก้ค่าที่ AI อ่าน · ส่งออก · อนุมัติ · ตั้งค่าสิทธิ์)
      ข้อมูลเก็บในหน่วยความจำของเบราว์เซอร์ จึงกลับสู่ค่าเริ่มต้นเมื่อรีเฟรช</p>
    </div>

    <div class="hub-grid">
      ${ROLE_ORDER.map(r => {
        const R = ROLES[r];
        return `
        <button class="rolecard" data-pickrole="${r}">
          <div class="rc-top">
            <div class="rc-ic">${ic(R.icon, 22)}</div>
            <span class="rc-scope">${esc(R.scopeTag)}</span>
          </div>
          <h3>${esc(R.th)}</h3>
          <div class="rc-key">${esc(R.key)}</div>
          <p>${esc(R.desc)}</p>
          <div class="rc-chips">
            ${R.chips.map(c => `<span class="rc-chip">${esc(c)}</span>`).join('')}
          </div>
          <div class="rc-foot">
            <span class="rc-lvl">${LEVELS.map(l => `<span class="lvl ${R.levels.includes(l.id) ? 'on l' + l.id : ''}">${l.id}</span>`).join('')}</span>
            <span class="rc-count">${screensFor(r)} หน้าจอ</span>
            <span class="rc-go">เข้าใช้งาน ${ic('chevronRight', 14)}</span>
          </div>
        </button>`;
      }).join('')}
    </div>

    <div class="hub-note">
      <div class="card">
        <div class="card-head"><h3>สิทธิ์ 3 ชั้นที่อยู่เบื้องหลังทุกบทบาท</h3><span class="hint">11-technical-notes-for-dev.md</span></div>
        <div class="level-cards">
          ${LEVELS.map(l => `
            <div class="level-card ${l.cls}">
              <h3>${esc(l.name)}</h3>
              <p>${esc(l.lead)}</p>
              <div class="lc-note">${esc(l.note)}</div>
            </div>`).join('')}
        </div>
      </div>
    </div>
  </div>`;
}

/* ---------- Dashboard (โครงหน้าอ้างอิง ERP Solar Cell) ---------- */

/* ---------- ชุดข้อมูลของกราฟ — ปรับความละเอียดตามช่วงที่เลือก ---------- */
const TH_MON = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
/* เส้นแบ่งระหว่าง "เอกสารจริงในระบบ" กับ "ประมาณการจากยอดสรุปรายเดือน" ต้องมาจาก TODAY ไม่ใช่วันที่พิมพ์มือ
   ไม่งั้นเลื่อน TODAY ไปเดือนถัดไป เดือนเก่าจะยังถูกนับเป็นเดือนปัจจุบัน และจุดของเดือนใหม่จะไม่มีวันเกิด */
const CUR_FROM = TODAY.slice(0, 7) + '-01';
const CUR_MON_TH = TH_MON[+TODAY.slice(5, 7) - 1];
const PREV_END = new Date(new Date(CUR_FROM).getTime() - 86400000).toISOString().slice(0, 10);

/* รายเดือน — ประวัติย้อนหลัง + เดือนปัจจุบันคำนวณสด */
/* ทุกฟังก์ชันของกราฟรับรายการบริษัทเข้ามาได้ — หน้าของสำนักงานต้องรวมทุกบริษัทที่ดูแล
   ไม่ใช่ดูเฉพาะบริษัทที่กำลังเลือกอยู่ · ไม่ส่งมาก็ใช้บริษัทปัจจุบันเหมือนเดิม */
const chartCos = cos => cos && cos.length ? cos : [state.companyId];
const docsIn = cos => state.docs.filter(d => chartCos(cos).indexOf(d.company) > -1 && !d.deleted);

function monthlySeries(n, cos) {
  const list = chartCos(cos);
  /* รวมหลายบริษัท: บวกจำนวนใบ แล้วถัวอัตราผ่านตามน้ำหนักจำนวนใบ ไม่ใช่เฉลี่ยเปอร์เซ็นต์ตรง ๆ */
  const names = (MONTHLY_DOCS[list[0]] || []).map(h => h.m);
  const hist = names.map(m => {
    let tot = 0, cl = 0;
    list.forEach(c => {
      const rec = (MONTHLY_DOCS[c] || []).find(h => h.m === m);
      if (!rec) return;
      tot += rec.n; cl += rec.n * rec.rate / 100;
    });
    return { m, n: tot, rate: tot ? Math.round(cl / tot * 100) : null };
  });
  const mo = docsIn(list).filter(d => d.date >= CUR_FROM);
  const clean = mo.filter(d => d.status === 'clean');
  /* ยอดเงินของเดือนปัจจุบันมาจากใบที่ยืนยันแล้วจริง ไม่ใช่จำนวนใบทุกสถานะคูณค่าเฉลี่ยของอีกประชากรหนึ่ง */
  const cur = { m: CUR_MON_TH, n: mo.length, rate: mo.length ? Math.round(clean.length / mo.length * 100) : null, now: true,
    amount: clean.reduce((a, d) => a + (d.total || 0), 0) };
  return hist.concat([cur]).slice(-n);
}

/* นับเอกสาร + อัตราผ่านได้เลยของช่วง [from,to]
   เดือนปัจจุบันใช้เอกสารจริงในระบบ · ก่อนหน้านั้นกระจายจากยอดสรุปรายเดือน (ข้อมูลตัวอย่าง) */
function bucketOf(from, to, cos) {
  const list = chartCos(cos);
  if (to >= CUR_FROM) {
    const real = docsIn(list).filter(d => d.date >= from && d.date <= to);
    const cl = real.filter(d => d.status === 'clean');
    /* คืนยอดเงินของใบที่ยืนยันแล้วไปด้วย กราฟเงินจะได้ไม่ต้องเดาจากค่าเฉลี่ยทั้งที่มีใบจริงอยู่ในถังแล้ว */
    return { n: real.length, rate: real.length ? Math.round(cl.length / real.length * 100) : null,
             amount: cl.reduce((a, d) => a + (d.total || 0), 0) };
  }
  const mi = +to.slice(5, 7) - 1;
  const days = Math.round((new Date(to) - new Date(from)) / 86400000) + 1;
  const dim = new Date(+to.slice(0, 4), mi + 1, 0).getDate();
  let n = 0, cl = 0;
  list.forEach(c => {
    const rec = (MONTHLY_DOCS[c] || []).find(h => TH_MON.indexOf(h.m) === mi);
    if (!rec) return;
    const part = Math.max(1, Math.round(rec.n * days / dim));
    n += part; cl += part * rec.rate / 100;
  });
  return { n, rate: n ? Math.round(cl / n * 100) : null };
}

/* รายสัปดาห์ — ตัวหารใหญ่พอให้อัตราผ่านมีความหมาย */
function weeklySeries(weeks, anchor, cos) {
  /* ยึดปลายช่วงที่ผู้ใช้เลือก ไม่ใช่ยึดวันนี้เสมอ — ไม่งั้นเลือกช่วงย้อนอดีตแล้วกราฟยังโชว์สัปดาห์ล่าสุด */
  const end = anchor && anchor < TODAY ? anchor : TODAY;
  const out = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const to = dayAdd(end, -i * 7);
    const from = dayAdd(to, -6);
    const b = bucketOf(from, to, cos);
    out.push({
      m: +from.slice(8, 10) + ' ' + TH_MON[+from.slice(5, 7) - 1],
      n: b.n, rate: b.rate, amount: b.amount, now: i === 0, from, to
    });
  }
  return out;
}

/* ความละเอียดของกราฟเลือกจากความยาวช่วง — ไม่ใช้รายวันเพราะอัตราจะแกว่งจนอ่านไม่ได้ */
/* รายวัน — ใช้ได้เฉพาะกับ "จำนวน" ที่นับได้ ห้ามใช้กับอัตราส่วน
   เพราะวันที่มีใบเดียวจะให้อัตราผ่าน 0% หรือ 100% ซึ่งอ่านแล้วเข้าใจผิดมากกว่าไม่แสดง */
function dailySeries(days, anchor, cos) {
  const end = anchor && anchor < TODAY ? anchor : TODAY;
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = dayAdd(end, -i);
    const b = bucketOf(d, d, cos);
    out.push({ m: +d.slice(8, 10) + ' ' + TH_MON[+d.slice(5, 7) - 1], n: b.n, rate: b.rate, now: i === 0, from: d, to: d });
  }
  return out;
}

/* กราฟแท่งแนวตั้ง — งานของมันคือเทียบขนาดรายวัน ไม่ใช่เล่าแนวโน้ม จึงเป็นแท่งไม่ใช่เส้น
   ป้ายตัวเลขติดเฉพาะแท่งสูงสุดกับแท่งล่าสุด ไม่ติดทุกแท่ง */
function colChart(data, opt) {
  const o = opt || {};
  const peak = Math.max.apply(null, data.map(d => d[o.key] || 0).concat([1]));
  /* ปัดเพดานขึ้นให้เป็นเลขกลม แท่งสูงสุดจะได้ไม่ชนขอบบน และแกน Y อ่านง่าย */
  const step = peak <= 4 ? 1 : peak <= 10 ? 2 : Math.ceil(peak / 5);
  const max = Math.ceil(peak / step) * step;
  const ticks = [];
  for (let v = max; v >= 0; v -= step) ticks.push(v);
  const top = data.reduce((a, d, i) => (d[o.key] || 0) > (data[a][o.key] || 0) ? i : a, 0);
  const last = data.length - 1;
  return `
    <div class="colchart">
      <div class="col-y" aria-hidden="true">${ticks.map(v => `<span>${nf0.format(v)}${o.unit || ''}</span>`).join('')}</div>
      <div class="col-plot">
        <div class="col-grid" role="img" aria-label="${esc(o.aria || '')}">
          ${ticks.filter(v => v > 0).map(v => `<i class="col-rule" style="top:${((max - v) / max * 100).toFixed(2)}%"></i>`).join('')}
          ${data.map((d, i) => {
    const v = d[o.key] || 0;
    return `<div class="pt-g col ${v ? '' : 'zero'}" data-pt="${esc(tipText(d, o))}" style="--h:${v ? Math.max(2, v / max * 100) : 0}%">
            ${(i === top || i === last) && v ? `<span class="cap">${nf0.format(v)}</span>` : ''}<i></i>
          </div>`;
  }).join('')}
        </div>
        <div class="col-axis">${data.map(d => `<span>${esc(d.m)}</span>`).join('')}</div>
      </div>
    </div>`;
}

function chartMode() {
  const g = range();
  const days = g.days || (g.months ? g.months * 30 : 30);
  /* โหมดเดือนใช้ได้เฉพาะช่วงที่จบที่วันนี้ — ช่วงย้อนอดีตต้องสร้าง bucket จากช่วงจริง */
  return (days > 90 && g.to >= TODAY) ? 'month' : 'week';
}

function chartSeries(cos) {
  const g = range();
  if (chartMode() === 'month') return monthlySeries(Math.max(6, g.months || 6), cos);
  const days = g.days || 30;
  /* จำนวนสัปดาห์มาจากความยาวช่วงจริง ไม่ตั้งพื้นไว้ที่ 7 — ไม่งั้น "วันนี้" กับ "30 วัน" ได้กราฟชุดเดียวกัน */
  return weeklySeries(Math.max(2, Math.min(26, Math.ceil(days / 7))), g.to, cos);
}

function ratePts(cos) {
  const d = chartSeries(cos).filter(x => x.rate != null);
  if (d.length < 2) return null;
  return d[d.length - 1].rate - d[d.length - 2].rate;
}

/* ใบติดธงที่ค้างเกินกำหนด — เรียงเก่าสุดขึ้นก่อน
   ไม่ผูกกับตัวกรองช่วงเวลาโดยตั้งใจ: กองค้างที่หายไปตอนเลือก "วันนี้" ไม่ใช่กองค้าง
   อายุนับจาก d.date คือวันที่บนใบเสร็จ เพราะไม่มีเวลาที่ใบเข้าคิวตรวจในข้อมูล — ป้ายบนจอจึงต้องพูดตามนั้น */
function staleFlagged(days) {
  const cut = dayAdd(TODAY, -(days || state.staleDays));
  return docsOf().filter(d => d.status !== 'clean' && d.date < cut)
    .sort((a, b) => a.date < b.date ? -1 : 1);
}

/* แถว KPI มาตรฐาน — ใช้ทุกหน้าเหมือนหน้าภาพรวม */
function kpiRow(items) {
  return `<div class="kpi-row">${items.map(kpi).join('')}</div>`;
}

/* หัวเหนือตาราง ให้ตารางอ่านเป็นการ์ดเดียวกับที่อื่น */
function tableHead(title, hint) {
  return `<div class="table-head"><h3>${esc(title)}</h3>${hint ? `<span class="hint">${esc(hint)}</span>` : ''}</div>`;
}

function kpi(o) {
  return `
  <div class="kpi ${o.tone || ''}">
    <div class="kpi-top">
      <div class="kpi-ic">${ic(o.icon, 18)}</div>
      ${o.trend || ''}
    </div>
    <div class="kpi-v">${o.value}</div>
    <div class="kpi-k">${esc(o.label)}</div>
    <div class="kpi-d">${esc(o.sub)}</div>
  </div>`;
}

/* กราฟเส้น — "trend over time" ตาม form heuristic ของ dataviz
   ซีรีส์เดียว: เส้น 2px + area 10% · จุด r=4 มีวงแหวนสีพื้น 2px
   ช่วงที่ไม่มีข้อมูลจะขาดเส้น ไม่ลากเชื่อม · crosshair + tooltip ตอน hover */
/* ข้อความทูลทิปสร้างตอนเรนเดอร์ ให้ตรงกับซีรีส์ที่กำลังวาดจริง
   ก่อนหน้านี้ตัวจัดการ hover อ่าน rate เสมอ กราฟยอดเงินจึงโชว์เปอร์เซ็นต์ใบที่ผ่านแทนยอดเงิน */
function tipText(d, o) {
  const v = d[o.key];
  if (o.key === 'rate') {
    return d.n === 0 ? `${d.m} · ไม่มีเอกสาร`
      : `${d.m} · ผ่านได้เลย ${v}% จาก ${d.n} ใบ` + (d.n < 5 ? ' (ตัวอย่างน้อย)' : '');
  }
  if (v == null) return `${d.m} · ไม่มีข้อมูล`;
  /* ค่าที่เป็นจำนวนใบไม่ต้องมีทศนิยม และไม่ต้องต่อท้ายด้วยจำนวนใบซ้ำอีกรอบ */
  const isCount = o.key === 'n' || o.key === 'need';
  if (isCount) return v === 0 ? `${d.m} · ไม่มีเอกสาร` : `${d.m} · ${o.tipLabel || 'เอกสาร'} ${nf0.format(v)}${o.unit || ''}`;
  return `${d.m} · ${o.tipLabel || 'ยอด'} ${nf.format(v)}${o.unit || ''}`
    + (d.n == null ? '' : ` · ${nf0.format(d.n)} ใบ`);
}

function lineChart(data, opt) {
  const o = opt || {};
  const key = o.key || 'n', unit = o.unit || '';
  const W = 640, H = 230, PL = 46, PR = 16, PT = 18, PB = 30;
  const iw = W - PL - PR, ih = H - PT - PB;
  /* ขีดแกนเป็นเลขกลม ๆ 5 ขั้น (เว้นแต่กำหนดเพดานมาเอง เช่นกราฟอัตราที่ตรึง 100%) */
  const maxV = Math.max(1, Math.max.apply(null, data.map(d => d[key] || 0)));
  let top = o.fixedMax;
  if (!top) {
    const raw = maxV / 4;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const st = [1, 2, 2.5, 5, 10].map(m => m * mag).find(v => v >= raw) || 10 * mag;
    top = Math.ceil(maxV / st) * st;
  }
  const ticks = [0, top * 0.25, top * 0.5, top * 0.75, top];
  const band = data.length > 1 ? iw / (data.length - 1) : 0;
  const x = i => data.length > 1 ? PL + band * i : PL + iw / 2;
  const y = v => PT + ih - (v / top) * ih;
  const every = Math.ceil(data.length / 6);
  const last = data.length - 1;
  const showDots = data.length <= 12;

  /* ตัดเส้นเป็นช่วง ๆ ตรงที่ไม่มีข้อมูล */
  const segs = [];
  let cur = [];
  data.forEach((d, i) => {
    if (d[key] == null) { if (cur.length) segs.push(cur); cur = []; return; }
    cur.push([x(i), y(d[key])]);
  });
  if (cur.length) segs.push(cur);

  const lineD = segs.map(s => 'M' + s.map(p => `${p[0]},${p[1]}`).join(' L')).join(' ');
  const areaD = segs.filter(s => s.length > 1).map(s =>
    `M${s[0][0]},${PT + ih} L` + s.map(p => `${p[0]},${p[1]}`).join(' L') + ` L${s[s.length - 1][0]},${PT + ih} Z`).join(' ');

  const lastPt = [...data].reverse().find(d => d[key] != null);
  const lastIdx = lastPt ? data.lastIndexOf(lastPt) : -1;

  /* id ไม่ซ้ำ เผื่อมีกราฟมากกว่าหนึ่งในหน้าเดียว */
  const cid = 'wipe' + Math.random().toString(36).slice(2, 8);

  return `
  <svg class="chart" viewBox="0 0 ${W} ${H}" role="img"
       aria-label="${esc(o.aria || 'กราฟ')} — ${data.map(d => d.m + ' ' + (d[key] == null ? 'ไม่มีข้อมูล' : d[key] + unit)).join(' · ')}">
    <defs><clipPath id="${cid}"><rect class="wipe" x="0" y="0" width="${W}" height="${H}"/></clipPath></defs>

    ${ticks.map(v => `<line class="grid" x1="${PL}" x2="${W - PR}" y1="${y(v)}" y2="${y(v)}"/>
      <text class="ax" x="${PL - 10}" y="${y(v) + 4}" text-anchor="end">${nf0.format(v)}${unit}</text>`).join('')}

    <g clip-path="url(#${cid})">
    ${areaD ? `<path class="area" d="${areaD}"/>` : ''}
    ${lineD ? `<path class="line" d="${lineD}"/>` : ''}

    ${data.map((d, i) => {
      const v = d[key];
      const cx = x(i), cy = v == null ? PT : y(v);
      const showTick = i % every === 0 || (i === last && last % every > every / 2);
      return `<g class="pt-g" data-pt="${esc(tipText(d, o))}">
        <line class="cross" x1="${cx}" x2="${cx}" y1="${PT}" y2="${PT + ih}"/>
        ${v == null ? '' : `<circle class="dot ${showDots || i === lastIdx ? 'on' : ''} ${d.n < 5 ? 'low' : ''}" cx="${cx}" cy="${cy}" r="4"/>`}
        <rect class="hit" x="${cx - band / 2}" y="${PT}" width="${band || iw}" height="${ih}"/>
        ${i === lastIdx && v != null ? `<text class="val" x="${cx}" y="${cy - 12}" text-anchor="end">${nf0.format(v)}${unit}</text>` : ''}
        ${showTick ? `<text class="ax" x="${cx}" y="${H - 9}" text-anchor="middle">${esc(d.m)}</text>` : ''}
      </g>`;
    }).join('')}
    </g>
  </svg>
  <div class="chart-tip" id="chartTip" hidden></div>`;
}

/* แถวฟิลเตอร์ช่วงเวลา — วางไว้เหนือกราฟตาม interaction spec ของ dataviz */
function rangeBar() {
  const g = range();
  return `
  <div class="rangebar">
    <div class="chips range-chips">
      ${RANGES.map(r => `<button class="chip ${state.range === r.id ? 'on' : ''}" data-range="${r.id}">${esc(r.label)}</button>`).join('')}
    </div>
    <div class="range-note">${ic('history', 13)} ${esc(g.label)} · ${fmtD(g.from)} – ${fmtD(g.to)}</div>
  </div>`;
}

/* ช่วง "วันนี้" พล็อตแนวโน้มไม่ได้ (มีจุดเดียว + อัตราจากไม่กี่ใบไม่มีความหมาย)
   จึงสลับเป็นรายการเอกสารที่เข้ามาวันนี้ ซึ่งเป็นสิ่งที่คนดูหน้านี้ต้องการจริง */
function todayCard(list) {
  const fin = can('view_financial');
  const sorted = list.slice().sort((x, y) => (y.time || '').localeCompare(x.time || ''));
  return `
    <div class="card">
      <div class="card-head">
        <div>
          <h3>เอกสารที่เข้ามาวันนี้</h3>
          <div class="muted small">${fmtD(TODAY)} · เรียงจากใบล่าสุด · กดเพื่อเปิดตรวจ</div>
        </div>
        <span class="badge ${list.length ? 'clean' : 'neutral'}">${list.length} ใบ</span>
      </div>
      ${sorted.length ? `<div class="tl">${sorted.map(d => `
        <button class="tl-row" data-doc="${d.id}">
          <span class="tl-time">${esc(d.time || '—')}</span>
          <span class="tl-dot ${d.status}"></span>
          <span class="tl-body">
            <b>${esc(d.vendor === '—' ? d.id : d.vendor)}</b>
            <span class="muted small">${esc(d.id)} · ${esc(d.category)}</span>
          </span>
          <span class="tl-right">
            <b>${fin.ok ? money(d.total) + ' ฿' : '<span class="masked">••••</span>'}</b>
            ${statusBadge(d.status)}
          </span>
        </button>`).join('')}</div>`
      : `<div class="empty small">ยังไม่มีเอกสารเข้ามาวันนี้ — ลองดูช่วง 7 วันเพื่อเห็นแนวโน้ม</div>`}
      <div class="chart-note">ช่วง "วันนี้" ไม่แสดงกราฟแนวโน้ม เพราะวันเดียวพล็อตเป็นเส้นไม่ได้ และอัตราที่คิดจากไม่กี่ใบยังไม่มีความหมาย — เลือก 7 วันขึ้นไปเพื่อดูแนวโน้ม</div>
    </div>`;
}

/* ============================================================
   หน้าภาพรวม — แยกตามบทบาท
   นักบัญชี   : วันนี้ต้องตรวจกี่ใบ ส่งออกได้หรือยัง
   เจ้าของ    : เดือนนี้จ่ายอะไรไปเท่าไหร่ ภาษีซื้อเท่าไหร่ ทีมส่งครบไหม
   หัวหน้าสนง.: ทั้งสำนักงานงานค้างอยู่ที่บริษัทไหน
   เจ้าของสำนักงาน: เงินที่สำนักงานได้ + ภาระตรวจของทีม และ (ถ้าเป็นเจ้าของระบบ) ความแม่นของบอท + อะไรพังบ้าง
   ============================================================ */

/* ช่วงก่อน ส.ค. 2569 ไม่มีเอกสารจริงในระบบ กราฟจึงประมาณจากยอดสรุปรายเดือนอยู่แล้ว
   KPI ต้องใช้จักรวาลเดียวกัน ไม่งั้นกด "1 ปี" แล้ว KPI ขึ้น 20 ใบ คู่กับกราฟที่รวมได้ 139 ใบ บนจอเดียวกัน
   และกด 30 วัน / 6 เดือน / 1 ปี แล้วตัวเลขไม่ขยับเลย ทั้งที่กราฟขยับ */
/* ยอดสรุปรายเดือนมีแค่ ก.ย.2568–ก.ค.2569 และค้นด้วยชื่อเดือนอย่างเดียวไม่ดูปี
   ถ้าปล่อยให้เลือกช่วงย้อนไกลกว่านี้ เดือนเดิมจะถูกนับซ้ำเป็นประวัติที่ไม่เคยมีอยู่จริง */
const HIST_FROM = '2025-09-01';
function histEstimate(from, to, cos) {
  const list = chartCos(cos);
  if (from >= CUR_FROM) return { n: 0, amount: 0, vat: 0 };
  const end = to < CUR_FROM ? to : PREV_END;
  const p2 = x => String(x).padStart(2, '0');
  let y = +from.slice(0, 4), m = +from.slice(5, 7), n = 0, guard = 0;
  while (`${y}-${p2(m)}-01` <= end && guard++ < 40) {
    const dim = new Date(y, m, 0).getDate();
    const a = `${y}-${p2(m)}-01` > from ? `${y}-${p2(m)}-01` : from;
    const b = `${y}-${p2(m)}-${p2(dim)}` < end ? `${y}-${p2(m)}-${p2(dim)}` : end;
    if (a <= b) {
      const days = Math.round((new Date(b) - new Date(a)) / 86400000) + 1;
      list.forEach(c => {
        const rec = (MONTHLY_DOCS[c] || []).find(h => TH_MON.indexOf(h.m) === m - 1);
        if (rec) n += rec.n * days / dim;
      });
    }
    m++; if (m > 12) { m = 1; y++; }
  }
  n = Math.round(n);
  const avg = list.reduce((s, c) => s + (AVG_TICKET[c] || 0), 0) / (list.length || 1);
  const amount = Math.round(n * avg);
  return { n, amount, vat: Math.round(amount * 7 / 107) };
}

/* บริบทร่วมของทุกบทบาท */
function dashCtx() {
  const g = range();
  const inRange = docsInRange();
  const fin = can('view_financial');
  const verified = inRange.filter(d => d.status === 'clean');
  const unverified = inRange.filter(d => d.status !== 'clean');
  const sum = (arr, k) => arr.reduce((x, d) => x + (d[k] || 0), 0);
  const est = histEstimate(g.from, g.to);
  return {
    g, inRange, fin, verified, unverified, est,
    s: stats(inRange), data: chartSeries(), cm: chartMode(), pts: ratePts(),
    vAmount: sum(verified, 'total'), vVat: sum(verified, 'vat'),
    uAmount: sum(unverified, 'total'), uVat: sum(unverified, 'vat')
  };
}

function dashHead(sub) {
  const fin = can('view_financial');
  return `
  <div class="page-head">
    <div><h1>ภาพรวม</h1><div class="sub">${esc(sub)}</div></div>
    <div class="page-actions">
      <button class="btn" data-act="goline">${ic('chat', 14)} เปิดหน้าจอ LINE</button>
      ${can('export').ok && fin.ok ? `<button class="btn primary" data-act="goexport">${ic('upload', 14)} ส่งออกเอกสาร</button>` : ''}
    </div>
  </div>
  ${rangeBar()}`;
}

/* แต่ละช่วงเวลาตอบคนละคำถาม จึงต้องใช้คนละรูปแบบ
   วันนี้ = "มีอะไรเข้ามาและเหลืออะไรต้องทำ" → รายการ ไม่ใช่กราฟ
   7 วัน  = "สัปดาห์นี้เข้ามาวันไหนบ้าง"      → แท่งรายวัน ใช้จำนวน ไม่ใช่เปอร์เซ็นต์
   30 วันขึ้นไป = "ดีขึ้นหรือแย่ลง"            → เส้นแนวโน้ม รายสัปดาห์/รายเดือน */
function weekCard(cos, title) {
  const d = dailySeries(7, range().to, cos);
  const tot = d.reduce((a, x) => a + x.n, 0);
  const busiest = d.reduce((a, x) => x.n > a.n ? x : a, d[0]);
  const quiet = d.filter(x => !x.n).length;
  return `
    <div class="card chart-card">
      <div class="card-head">
        <div><h3>${esc(title || 'เอกสารเข้ามารายวัน')}</h3>
          <div class="muted small">7 วันล่าสุด · นับเป็นจำนวนใบ ไม่ใช่เปอร์เซ็นต์ เพราะวันที่มีใบเดียวจะให้อัตราผ่าน 0% หรือ 100%</div></div>
        <span class="badge neutral">${tot} ใบ</span>
      </div>
      ${colChart(d, { key: 'n', unit: ' ใบ', tipLabel: 'เอกสาร', aria: 'จำนวนเอกสารที่เข้ามาในแต่ละวัน 7 วันล่าสุด' })}
      <div class="chart-note">
        วันที่หนักสุดคือ <b>${esc(busiest.m)}</b> ${busiest.n} ใบ${quiet ? ` · มี ${quiet} วันที่ไม่มีเอกสารเข้าเลย` : ''} ·
        ใช้ดูว่าลูกค้าส่งเป็นกองท้ายเดือนหรือทยอยส่ง ซึ่งเป็นตัวกำหนดว่าทีมต้องเตรียมคนวันไหน
      </div>
    </div>`;
}

/* เจ้าของกิจการ · ช่วง 7 วัน — คำถามของเขาไม่ใช่ "เข้ามาวันไหน" แต่คือ "ใครในทีมยังไม่ส่ง"
   เป็นรายชื่อ ไม่ใช่กราฟ เพราะคนอ่านต้องเอาไปทักเป็นรายคน */
function senderWeekCard(list) {
  const team = membersOf().filter(m => ['member', 'owner'].indexOf(m.role) > -1);
  const cnt = {};
  list.forEach(d => { cnt[d.by] = (cnt[d.by] || 0) + 1; });
  const rows = team.map(m => ({ m, n: cnt[m.id] || 0 }))
    .sort((a, b) => b.n - a.n || a.m.name.localeCompare(b.m.name));
  const max = Math.max.apply(null, rows.map(r => r.n).concat([1]));
  const silent = rows.filter(r => !r.n);
  return `
    <div class="card">
      <div class="card-head">
        <div><h3>ใครส่งเอกสารเข้ามาบ้าง</h3>
          <div class="muted small">7 วันล่าสุด · เรียงจากคนที่ส่งมากที่สุด</div></div>
        <span class="badge ${silent.length ? 'flagged' : 'clean'}">${silent.length ? `ยังไม่ส่ง ${silent.length} คน` : 'ส่งครบทุกคน'}</span>
      </div>
      ${rows.map(r => `
        <div class="prog">
          <div class="prog-top">
            <span>${esc(r.m.name)}${r.m.isNew ? ' <span class="badge orange">ใหม่</span>' : ''}</span>
            <b class="${r.n ? '' : 'warn'}">${r.n ? r.n + ' ใบ' : 'ยังไม่ส่ง'}</b>
          </div>
          <div class="prog-track"><i style="width:${r.n ? Math.max(4, Math.round(r.n / max * 100)) : 0}%"></i></div>
        </div>`).join('')}
      <div class="chart-note">
        ${silent.length
      ? `ทักคนที่ยังไม่ส่งได้จากหน้างานและคำขอ — มอบหมายงานแล้วบอทจะตามให้เองตามบันไดเตือน`
      : 'ทุกคนในทีมส่งเอกสารเข้ามาในสัปดาห์นี้แล้ว'}
      </div>
    </div>`;
}

/* นักบัญชี · ช่วง 7 วัน — คำถามคือ "สัปดาห์นี้เคลียร์ไปถึงไหนแล้ว" จึงเป็นแถบความคืบหน้า
   แยกใบที่ระบบผ่านให้เอง ออกจากใบที่คนต้องลงมือ เพราะสองอย่างนี้คือภาระคนละก้อน */
function reviewProgressCard(list) {
  /* "ระบบผ่านให้เอง" ต้องไม่รวมใบที่คนกดยืนยัน — สองอย่างนี้คือภาระคนละก้อน
     ใบที่คนกดยืนยันคือคนเปิดดูแล้วตัดสินใจ ไม่ใช่ระบบผ่านให้ */
  const auto = list.filter(d => d.status === 'clean' && !d.edited && !d.confirmedBy).length;
  const fixed = list.filter(d => d.status === 'clean' && (d.edited || d.confirmedBy)).length;
  const left = list.filter(d => d.status !== 'clean').length;
  const tot = list.length || 1;
  const pc = n => Math.round(n / tot * 100);
  const seg = (cls, n, label) => n ? `<div class="pt-g useg ${cls}" style="flex:0 0 ${pc(n)}%"
      data-pt="${esc(label + ' ' + n + ' ใบ · ' + pc(n) + '% ของสัปดาห์นี้')}">${pc(n) >= 16 ? esc(n + ' ใบ') : ''}</div>` : '';
  return `
    <div class="card chart-card">
      <div class="card-head">
        <div><h3>สัปดาห์นี้เคลียร์ไปถึงไหน</h3>
          <div class="muted small">จากเอกสารที่เข้ามา ${list.length} ใบใน 7 วันล่าสุด</div></div>
        <span class="badge ${left ? 'flagged' : 'clean'}">${left ? `เหลือ ${left} ใบ` : 'เคลียร์หมดแล้ว'}</span>
      </div>
      <div class="ulegend">
        <span><i style="background:var(--chart-1)"></i> ระบบผ่านให้เอง</span>
        <span><i style="background:#3a7bd5"></i> คนเคลียร์แล้ว</span>
        <span><i style="background:#b8860b"></i> เหลือต้องตรวจ</span>
      </div>
      <div class="ubar" role="img" aria-label="เอกสารสัปดาห์นี้ ${list.length} ใบ — ระบบผ่านให้เอง ${auto} ใบ คนเคลียร์แล้ว ${fixed} ใบ เหลือ ${left} ใบ">
        ${seg('keep', auto, 'ระบบผ่านให้เอง')}${seg('mid', fixed, 'คนเคลียร์แล้ว')}${seg('todo', left, 'เหลือต้องตรวจ')}
      </div>
      <div class="chart-note">
        ตัวที่ต้องจับตาคือแถบขวาสุด — ${left ? `ยังเหลือ ${left} ใบที่ต้องเปิดดูเอง` : 'สัปดาห์นี้ไม่เหลือใบค้าง'} ·
        แถบซ้ายยิ่งยาวแปลว่าระบบแบ่งเบาได้มาก
      </div>
    </div>`;
}

/* การ์ดกราฟอัตราผ่านได้เลย — ใช้ร่วมหลายบทบาท */
/* ป้ายแนวโน้มของอัตราผ่าน — ขยับ 1 จุดถือว่าทรงตัว ไม่ใช่แย่ลง
   ไม่งั้นความแกว่งปกติของฐานตัวอย่างเล็ก ๆ จะขึ้นป้ายแดงบนพาดหัวตลอดเวลา */
function trendBadge(pts) {
  if (pts == null) return '';
  if (Math.abs(pts) <= 1) return `<span class="badge neutral">ทรงตัว ${pts >= 0 ? '+' : ''}${pts} จุด</span>`;
  return `<span class="badge ${pts > 0 ? 'clean' : 'unreadable'}">${pts > 0 ? '+' : ''}${pts} จุด</span>`;
}

function rateChartCard(c, subtitle) {
  return `
    <div class="card chart-card">
      <div class="card-head">
        <div>
          <h3>อัตราใบที่ผ่านได้เลย</h3>
          <div class="muted small">${esc(subtitle)}</div>
          ${c.cm === 'week' ? `<div class="muted small">กราฟไม่ย่อยกว่ารายสัปดาห์ — ตัวเลขด้านบนนับตามช่วง "${esc(c.g.label)}" ที่เลือกไว้</div>` : ''}
        </div>
        ${trendBadge(c.pts)}
      </div>
      ${lineChart(c.data, { key: 'rate', unit: '%', fixedMax: 100, aria: 'อัตราใบที่ผ่านได้เลยต่อช่วง' })}
      <div class="chart-note">
        <b>จุดกลวง</b> = ช่วงที่มีเอกสารน้อยกว่า 5 ใบ อัตราจึงแกว่งง่าย ·
        จุดก่อนเดือนปัจจุบันมาจากยอดสรุปรายเดือน (ข้อมูลตัวอย่าง) ส่วนจุดล่าสุดนับจากเอกสารจริงในระบบ
      </div>
    </div>`;
}

/* การ์ดหมวดค่าใช้จ่าย */
function catCard(list, fin) {
  const byCat = {};
  list.forEach(d => { byCat[d.category] = (byCat[d.category] || 0) + (fin.ok ? (d.total || 0) : 1); });
  const all = Object.entries(byCat).sort((x, y) => y[1] - x[1]);
  const cats = all.slice(0, 5), rest = all.slice(5);
  const max = Math.max.apply(null, cats.map(c => c[1]).concat([1]));
  /* ตัวหารต้องเป็นยอดของทุกหมวด ไม่ใช่แค่ห้าหมวดที่โชว์ ไม่งั้น % รวมกันได้ 100 บนฐานที่ป้ายไม่ได้บอก */
  const sum = all.reduce((x, c) => x + c[1], 0);
  const restSum = rest.reduce((x, c) => x + c[1], 0);
  return `
    <div class="card">
      <div class="card-head">
        <div>
          <h3>${fin.ok ? '5 หมวดที่ใช้เงินมากสุด' : '5 หมวดที่มีใบมากสุด'}</h3>
          <div class="muted small">${fin.ok ? 'นับเฉพาะใบที่ยืนยันแล้ว' : 'ยอดเงินถูกซ่อนตามสิทธิ์ 2a'} · % คิดจากยอดรวมทุกหมวด${rest.length ? ` · ยังมีอีก ${rest.length} หมวดที่ไม่ได้แสดง รวม ${fin.ok ? money(restSum) + ' ฿' : restSum + ' ใบ'}` : ''}</div>
        </div>
      </div>
      ${cats.length ? cats.map(c => `
        <div class="prog">
          <div class="prog-top"><span>${esc(c[0])}</span><b>${sum ? Math.round(c[1] / sum * 100) : 0}%</b></div>
          <div class="prog-track"><i style="width:${Math.max(2, Math.round(c[1] / max * 100))}%"></i></div>
          <div class="prog-sub">${fin.ok ? money(c[1]) + ' ฿' : c[1] + ' ใบ'}</div>
        </div>`).join('') : '<div class="empty small">ยังไม่มีเอกสาร</div>'}
      ${rest.length ? `<div class="chart-note">อีก ${rest.length} หมวด รวม ${fin.ok ? money(restSum) + ' ฿' : restSum + ' ใบ'} — ไม่ได้แสดงเป็นแท่ง แต่นับรวมในตัวหารของเปอร์เซ็นต์แล้ว</div>` : ''}
    </div>`;
}

/* การ์ดใบที่ต้องตรวจ */
function flaggedCard(list, fin) {
  const f = list.filter(d => d.status !== 'clean');
  /* หน้าสำนักงานส่งใบของหลายบริษัทมาในการ์ดเดียว ถ้าไม่บอกชื่อบริษัทจะอ่านไม่ออกว่าใบไหนของใคร */
  const multi = f.some(d => d.company !== f[0].company);
  return `
    <div class="card">
      <div class="card-head">
        <h3>${ic('alertTriangle', 15)} ใบที่ต้องตรวจ</h3>
        <span class="badge flagged">${f.length}</span>
      </div>
      ${f.length ? f.slice(0, 3).map(d => `
        <button class="alert-row ${d.status}" data-doc="${d.id}">
          <div class="ar-top">
            <b>${esc(d.vendor === '—' ? d.id : d.vendor)}</b>
            <span>${d.status === 'unreadable' ? 'อ่านไม่ออก' : (fin.ok ? money(d.total) + ' ฿' : '••••')}</span>
          </div>
          <div class="ar-sub">${multi ? esc(companyName(d.company)) + ' · ' : ''}${esc(d.id)} · ${esc((d.issues[0] || {}).msg || '')}</div>
        </button>`).join('') : '<div class="empty small">ไม่มีใบติดธง</div>'}
    </div>`;
}

/* การ์ดฟิลด์ที่ AI พลาดบ่อย */
function missFieldCard(docs) {
  const TH = { taxId: 'เลขผู้เสียภาษี', total: 'ยอดรวม', date: 'วันที่', vendor: 'ชื่อผู้ขาย', base: 'ยอดก่อน VAT',
    vat: 'VAT', category: 'หมวดค่าใช้จ่าย', '-': 'อ่านไม่ออกทั้งใบ' };
  const c = {};
  /* นับจากประวัติการแก้ (d.edited) ก่อน — นั่นคือสิ่งที่ตาราง corrections เก็บจริง
     ถ้ายังไม่มีใครแก้ ค่อยใช้ธงที่ยังค้างเป็นตัวประมาณ · ไม่นับเอกสารที่ถูกลบไปแล้ว */
  const live = docs.filter(d => !d.deleted);
  const seen = {};                                     /* ใบเดียวฟิลด์เดียวต้องนับครั้งเดียว ไม่ใช่ทั้งจากประวัติแก้และจากธงที่ยังค้าง */
  live.forEach(d => Object.keys(d.edited || {}).forEach(f => {
    if ((d.edited[f] || {}).derived) return;           /* ช่องที่ถูกคำนวณต่อ ไม่ใช่ช่องที่ AI อ่านพลาด */
    seen[d.id + '|' + f] = 1;
    const k = TH[f] || f; c[k] = (c[k] || 0) + 1;
  }));
  live.forEach(d => d.issues.forEach(i => {
    if (seen[d.id + '|' + i.field]) return;
    const k = TH[i.field] || i.field; c[k] = (c[k] || 0) + 1;
  }));
  const list = Object.entries(c).sort((x, y) => y[1] - x[1]).slice(0, 5);
  const max = Math.max.apply(null, list.map(f => f[1]).concat([1]));
  return `
    <div class="card">
      <div class="card-head">
        <div><h3>ฟิลด์ที่ AI พลาดบ่อย</h3><div class="muted small">ธงที่ยังค้าง + ประวัติการแก้ · นับใบละฟิลด์ละครั้ง</div></div>
      </div>
      ${list.length ? list.map(f => `
        <div class="prog">
          <div class="prog-top"><span>${esc(f[0])}</span><b>${f[1]} ใบ</b></div>
          <div class="prog-track"><i style="width:${Math.round(f[1] / max * 100)}%"></i></div>
        </div>`).join('') : '<div class="empty small">ยังไม่มีฟิลด์ที่ติดธง</div>'}
      <div class="muted" style="font-size:0.7rem;margin-top:0.5rem">ใช้ปรับความแม่น ไม่ใช่ตัวเลขโฆษณา</div>
    </div>`;
}

/* การ์ดความเคลื่อนไหว (เต็มความกว้าง) */
function feedCard() {
  const feed = auditVisible().slice(0, 6);
  return `
  <div class="card mt">
    <div class="card-head"><h3>${ic('history', 15)} ความเคลื่อนไหวล่าสุด</h3><span class="hint">audit_log${can('audit_view').value === 'partial' ? ' · เฉพาะรายการของคุณ' : ''}</span></div>
    <div class="feed-grid">
      ${feed.length ? feed.map(x => `
        <div class="feed">
          <span class="fav">${esc(uname(x.actor).slice(0, 1))}</span>
          <div><div class="fl">${esc(x.action)}</div>
          <div class="muted small">${esc(uname(x.actor))} · ${esc(x.at)}</div></div>
        </div>`).join('') : '<div class="empty small">ยังไม่มีรายการ</div>'}
    </div>
  </div>`;
}

/* ---------- นักบัญชี ---------- */
function dashAccountant() {
  const c = dashCtx(), s = c.s, fin = c.fin;
  const pctClean = s.total ? Math.round(s.clean / s.total * 100) : 0;
  const openTasks = tasksOf().filter(t => t.status === 'open');
  const batches = state.exports.filter(e => e.company === state.companyId);
  const stale = staleFlagged();

  return `
  ${dashHead(`งานตรวจเอกสาร · ${company().name} · ${c.g.label}`)}

  <div class="kpi-row">
    ${kpi({ icon: 'checkCircle', tone: 'tone-success', label: 'ผ่านได้เลย ไม่ต้องแตะ', value: s.clean,
            sub: `จาก ${s.total} ใบที่มีจริงในระบบ${c.est.n ? ` · ก่อน ส.ค. 69 มีแต่ยอดสรุปรายเดือน (~${c.est.n} ใบ) กราฟรวมให้ KPI นับไม่ได้` : ''}`, trend: `<span class="kpi-trend">${pctClean}% ของช่วง</span>` })}
    ${kpi({ icon: 'alertTriangle', tone: (s.flagged + s.unreadable) ? 'tone-warning' : '', label: 'ต้องตรวจ — งานที่เหลือของคุณ',
            value: s.flagged + s.unreadable, sub: `ติดธง ${s.flagged} · อ่านไม่ออก ${s.unreadable} · เฉพาะช่วงที่เลือก` })}
    ${kpi({ icon: 'history', tone: stale.length ? 'tone-danger' : '', label: `ใบติดธงที่ลงวันที่เกิน ${state.staleDays} วัน`, value: stale.length,
            sub: stale.length ? `เก่าสุด ${fmtD(stale[0].date)} · นับจากวันที่บนใบเสร็จ ทุกช่วงเวลา` : 'ไม่มีใบติดธงที่เกินเกณฑ์' })}
    ${kpi({ icon: 'upload', tone: s.notExported ? 'tone-warning' : '', label: 'ยังไม่ส่งออก', value: s.notExported,
            sub: `ส่งออกแล้ว ${s.total - s.notExported} ใบในช่วงนี้ · ชุดส่งออกสะสม ${batches.length} ชุด (ทุกช่วงเวลา)` })}
  </div>

  <div class="dash-2">
    ${state.range === 'today' ? todayCard(c.inRange)
      : state.range === '7d' ? reviewProgressCard(c.inRange)
        : rateChartCard(c, `${c.data.length} ${c.cm === 'month' ? 'เดือน' : 'สัปดาห์'}ล่าสุด · ยิ่งสูง = ยิ่งต้องตรวจน้อย`)}
    ${catCard(c.verified, fin)}
  </div>

  <div class="dash-4">
    ${flaggedCard(c.inRange, fin)}
    ${missFieldCard(docsOf())}
    <div class="card">
      <div class="card-head"><h3>${ic('upload', 15)} สรุปการส่งออก</h3><span class="hint">จำนวนใบตามช่วงที่เลือก · รายชุดนับทุกช่วงเวลา</span></div>
      <div class="sum-row"><span>ส่งออกแล้ว</span><b>${s.total - s.notExported} ใบ</b></div>
      <div class="sum-row"><span>ยังไม่ส่งออก</span><b class="${s.notExported ? 'warn' : ''}">${s.notExported} ใบ</b></div>
      <div class="hr"></div>
      ${batches.slice(0, 2).map(b => `
        <div class="mini"><div><b>${esc(b.id)}</b><div class="muted small">${esc(b.period)}</div></div>
        <span class="badge clean">${b.count} ใบ</span></div>`).join('') || '<div class="empty small">ยังไม่มีชุดส่งออก</div>'}
    </div>
    <div class="card">
      <div class="card-head"><h3>${ic('pin', 15)} งานค้าง</h3><span class="badge neutral">${openTasks.length}</span></div>
      ${openTasks.slice(0, 2).map(t => `
        <div class="pend ${overdue(t) ? 'late' : ''}"><b>${esc(t.title)}</b>
        <div class="muted small">${esc(t.id)} · ${esc(uname(t.assignee))} · ${fmtD(t.due)}</div></div>`).join('')
      || '<div class="empty small">ไม่มีงานค้าง</div>'}
      <button class="btn primary cta" data-act="gotasks">ไปที่หน้างานและคำขอ ${ic('arrowRight', 13)}</button>
    </div>
  </div>
  ${feedCard()}
  ${srcline('13 (คำขายหลัก) · 15 (Quick Stats) · โครงหน้าอ้างอิงจาก ERP Solar Cell')}`;
}

/* ---------- เจ้าของกิจการ — มุมการเงิน ---------- */
function dashOwner() {
  const c = dashCtx(), s = c.s, fin = c.fin;
  const avg = AVG_TICKET[state.companyId] || 0;   /* ไม่มียอดเฉลี่ยของบริษัทนี้ = ไม่เดาตัวเลขให้ ให้ตรงกับ histEstimate ที่ใช้ 0 */
  /* ถังไหนมีเอกสารจริงใช้ยอดของใบที่ยืนยันแล้วตรง ๆ คูณค่าเฉลี่ยเฉพาะช่วงก่อน ส.ค. ที่ไม่มีเอกสารในระบบเลย
     ไม่งั้นสัปดาห์ที่มีใบจริงอยู่แล้วจะถูกพล็อตด้วยตัวเลขที่ปั้นขึ้น สูงกว่าของจริงหลายเท่า */
  const moneySeries = c.data.map(d => Object.assign({}, d, {
    amt: d.amount != null ? d.amount : Math.round((d.n || 0) * avg)
  }));
  /* ยอดของช่วงที่เลือก = ของจริงในระบบ + ที่ประมาณจากยอดสรุปรายเดือนสำหรับเดือนก่อน ส.ค. */
  const estOn = c.est.n > 0;
  /* VAT ไม่รับของประมาณการ — เลขนี้ถูกเสนอให้เอาไปกระทบยอด ภ.พ.30 จึงต้องมาจากใบจริงที่ยืนยันแล้วเท่านั้น */
  const rAmount = c.vAmount + c.est.amount, rVat = c.vVat, rDocs = s.total + c.est.n;
  const openTasks = tasksOf().filter(t => t.status === 'open');
  const byMember = {};
  c.inRange.forEach(d => { byMember[d.by] = (byMember[d.by] || 0) + 1; });
  const senders = Object.entries(byMember).sort((x, y) => y[1] - x[1]);
  /* ตัวหารต้องเป็นชุดเดียวกับการ์ดใครส่งเอกสารเข้ามาบ้าง ไม่งั้นสองที่บนจอเดียวกันนับคนไม่เท่ากัน */
  const team = membersOf().filter(m => ['member', 'owner'].indexOf(m.role) > -1);
  const sendMax = Math.max.apply(null, senders.map(x => x[1]).concat([1]));

  return `
  ${dashHead(`มุมมองเจ้าของกิจการ · ${company().name} · ${c.g.label}`)}

  <div class="kpi-row">
    ${fin.ok
      ? kpi({ icon: 'money', label: 'ภาษีซื้อที่ยืนยันแล้ว', value: money(rVat) + ' ฿',
              sub: `จาก ${c.verified.length} ใบที่ยืนยันแล้ว · ใช้กระทบยอด ภ.พ.30${estOn ? ' · ไม่รวมประมาณการย้อนหลัง' : ''}`,
              trend: c.unverified.length ? `<span class="kpi-trend warn">ค้าง ${c.unverified.length} ใบ</span>` : '' })
      : kpi({ icon: 'lock', tone: 'masked', label: 'ภาษีซื้อที่ยืนยันแล้ว', value: '••••••', sub: fin.reason })}
    ${fin.ok
      ? kpi({ icon: 'receipt', label: estOn ? 'ยอดค่าใช้จ่าย (รวมประมาณการ)' : 'ยอดค่าใช้จ่ายที่ยืนยันแล้ว', value: money(rAmount) + ' ฿',
              sub: `${estOn ? `ยืนยันแล้วจริง ${money(c.vAmount)} ฿ · ประมาณการช่วงก่อน ส.ค. อีก ${money(c.est.amount)} ฿ · ` : ''}ยังไม่ยืนยันอีก ${money(c.uAmount)} ฿ จาก ${c.unverified.length} ใบ` })
      : kpi({ icon: 'lock', tone: 'masked', label: 'ยอดค่าใช้จ่าย', value: '••••••', sub: fin.reason })}
    ${kpi({ icon: 'users', label: 'ทีมส่งเอกสารเข้ามา', value: rDocs,
            sub: `${senders.length} จาก ${team.length} คนในทีมส่งเข้ามา${estOn ? ` · ในระบบจริง ${s.total} ใบ` : ''}` })}
    ${kpi({ icon: 'pin', tone: openTasks.filter(overdue).length ? 'tone-warning' : '', label: 'งานค้างของทีม',
            value: openTasks.length, sub: `เลยกำหนด ${openTasks.filter(overdue).length} รายการ` })}
  </div>

  <div class="dash-2">
    ${state.range === 'today' ? todayCard(c.inRange) : state.range === '7d' ? senderWeekCard(c.inRange) : `
    <div class="card chart-card">
      <div class="card-head">
        <div>
          <h3>ยอดค่าใช้จ่ายรายเดือน</h3>
          <div class="muted small">${moneySeries.length} ${c.cm === 'month' ? 'เดือน' : 'สัปดาห์'}ล่าสุด · เฉพาะใบที่ยืนยันแล้ว</div>
        </div>
      </div>
      ${fin.ok
      ? lineChart(moneySeries, { key: 'amt', unit: ' ฿', tipLabel: 'ยอดค่าใช้จ่าย', aria: 'ยอดค่าใช้จ่ายต่อช่วง' })
      : `<div class="inline-lock">${ic('lock', 16)} <div>${esc(fin.reason)}</div></div>`}
      <div class="chart-note">ตั้งแต่ ส.ค. 2569 รวมจากใบจริงที่ยืนยันแล้วในระบบ · ก่อนหน้านั้นไม่มีเอกสารในระบบ จึงประมาณจากจำนวนใบ × ยอดเฉลี่ยต่อใบ (ข้อมูลตัวอย่าง) · ตัวเลขนี้คือค่าใช้จ่ายที่ผ่านการตรวจแล้วเท่านั้น ไม่ใช่ยอดทั้งหมดของกิจการ</div>
    </div>`}
    ${catCard(c.verified, fin)}
  </div>

  <div class="dash-4">
    ${flaggedCard(c.inRange, fin)}
    <div class="card">
      <div class="card-head"><div><h3>ใครส่งเอกสารเข้ามา</h3><div class="muted small">จากกลุ่มไลน์ของบริษัท</div></div></div>
      ${senders.length ? senders.slice(0, 5).map(x => `
        <div class="prog">
          <div class="prog-top"><span>${esc(uname(x[0]))}</span><b>${x[1]} ใบ</b></div>
          <div class="prog-track"><i style="width:${Math.round(x[1] / sendMax * 100)}%"></i></div>
        </div>`).join('') : '<div class="empty small">ยังไม่มีใครส่งเอกสาร</div>'}
    </div>
    <div class="card">
      <div class="card-head"><h3>${ic('pin', 15)} งานค้างของทีม</h3><span class="badge neutral">${openTasks.length}</span></div>
      ${openTasks.slice(0, 3).map(t => `
        <div class="pend ${overdue(t) ? 'late' : ''}"><b>${esc(t.title)}</b>
        <div class="muted small">${esc(uname(t.assignee))} · ${fmtD(t.due)}</div></div>`).join('')
      || '<div class="empty small">ไม่มีงานค้าง</div>'}
      <div class="muted" style="font-size:0.7rem;margin-top:0.625rem">มอบหมายและปิดงานทำในกลุ่มไลน์ · หน้านี้ไว้ดูภาพรวมเท่านั้น</div>
    </div>
    <div class="card">
      <div class="card-head"><h3>${ic('settings', 15)} การตั้งค่าของคุณ</h3><span class="hint">2b</span></div>
      <div class="sum-row"><span>ให้ทีมเห็นยอดสรุป</span><b>${company().financial_visibility ? 'เปิด' : 'ปิด'}</b></div>
      <div class="sum-row"><span>เวลาสรุปประจำวัน</span><b>${esc(company().digest_time)}</b></div>
      <div class="sum-row"><span>กลุ่มไลน์ที่ผูก</span><b class="small">${esc(company().group)}</b></div>
      <button class="btn cta" data-nav="settings">ไปที่หน้าตั้งค่า ${ic('arrowRight', 13)}</button>
    </div>
  </div>
  ${feedCard()}
  ${srcline('11 (financial_visibility · B-10) · 09 (ภาษีซื้อรวมสำหรับกระทบยอด)')}`;
}

/* ---------- หัวหน้าสำนักงาน — เทียบข้ามบริษัท ---------- */
/* ค่า API เป็นบิลของสำนักงานเอง (ถือ key เอง จ่ายเจ้าของโมเดลตรง) ส่วนต่างจึงเป็นกำไรของสำนักงานทั้งก้อน
   การตั้งราคาได้อย่างเดียวไม่พอ — ต้องเห็นด้วยว่าราคาที่ตั้งไว้คุ้มต้นทุนไหม */
function marginCard(pages, label) {
  const own = !!tenant().owner;
  const costTh = own ? 'ต้นทุนค่าอ่าน' : 'ค่าระบบที่จ่ายผู้ให้บริการ';
  const sell = state.bahtPerPage, cost = costPerPage();
  const keep = +(sell - cost).toFixed(2);
  const pct = sell > 0 ? Math.round(keep / sell * 100) : 0;
  const thin = keep <= 0;
  const col = (head, sub, rows) => `
    <div>
      <div class="ucap">${esc(head)}</div>
      <div class="usub">${esc(sub)}</div>
      ${rows.map(r => `<div class="sum-row"><span>${esc(r[0])}</span><b class="${r[2] || ''}">${r[1]}</b></div>`).join('')}
    </div>`;
  /* ส่วนที่เป็นภาพคือ "สัดส่วนต่อหน้า" — เป็น part-to-whole 2 ส่วน จึงเป็นแถบซ้อนแนวนอน
     ส่วนตัวเลขรายช่วงยังเป็นตัวเลข เพราะสัดส่วนเท่ากันทุกช่วง ต่างกันแค่สเกล
     วาดสามแถบที่หน้าตาเหมือนกันเป๊ะจึงไม่ได้บอกอะไรเพิ่ม และคนละสเกลใช้แกนร่วมกันไม่ได้ */
  const costPct = sell > 0 ? Math.round(cost / sell * 100) : 100;
  const keepPct = 100 - costPct;
  const seg = (cls, pct, label, tip) => `
    <div class="pt-g useg ${cls}" style="flex:0 0 ${pct}%" data-pt="${esc(tip)}">${pct >= 18 ? esc(label) : ''}</div>`;
  const bar = thin ? `
    <div class="ubar" role="img" aria-label="ต้นทุนค่าอ่านสูงกว่าราคาที่เก็บจากลูกค้า">
      ${seg('thin', 100, `ต้นทุน ${money(cost)} ฿ สูงกว่าที่เก็บ ${money(sell)} ฿`,
        `ขาดทุน ${money(Math.abs(keep))} ฿ ต่อหน้า`)}
    </div>` : `
    <div class="ubar" role="img" aria-label="ทุก 1 หน้าที่อ่าน เก็บได้ ${money(sell)} บาท เป็นต้นทุน ${money(cost)} บาท เหลือ ${money(keep)} บาท">
      ${seg('cost', costPct, `ต้นทุน ${money(cost)} ฿`, `ต้นทุนค่าอ่าน ${money(cost)} ฿ ต่อหน้า · ${costPct}% ของที่เก็บได้`)}
      ${seg('keep', keepPct, `เหลือ ${money(keep)} ฿`, `ส่วนต่างที่สำนักงานเก็บไว้ ${money(keep)} ฿ ต่อหน้า · ${keepPct}% ของที่เก็บได้`)}
    </div>`;
  return `
  <div class="card chart-card mt">
    <div class="card-head">
      <div><h3>${ic('money', 15)} ${esc(costTh)}กับรายรับค่าอ่าน</h3>
        <div class="muted small">${own
      ? 'ถือ API key เอง จ่ายเจ้าของโมเดลตรง — ส่วนต่างเป็นของสำนักงานทั้งก้อน'
      : 'จ่ายค่าระบบให้ผู้ให้บริการเป็นรายหน้าที่อ่านสำเร็จ หักจากเครดิตที่เติมไว้ — ที่เหลือเป็นของสำนักงานทั้งก้อน'}</div></div>
      <span class="badge ${thin ? 'unreadable' : 'clean'}">${thin ? 'ต่ำกว่าทุน' : 'เหลือ ' + pct + '%'}</span>
    </div>

    <div class="ulegend">
      <span><i style="background:#767676"></i> ${esc(costTh)}</span>
      <span><i style="background:var(--chart-1)"></i> ส่วนต่างที่สำนักงานเก็บไว้</span>
      <span class="muted">ทุก 1 หน้าที่อ่าน = ${money(sell)} ฿ ที่เก็บจากลูกค้า</span>
    </div>
    ${bar}

    <div class="uscale">
      ${col(esc(label), pages + ' หน้าที่อ่านไปแล้ว', [
        ['รายรับ', money(pages * sell) + ' ฿'],
        [costTh, money(pages * cost) + ' ฿'],
        ['เหลือ', money(+(pages * keep).toFixed(2)) + ' ฿', thin ? 'warn' : '']])}
      ${col('ถ้าเดือนละ 1,000 หน้า', 'สมมติปริมาณคงที่ ไว้เทียบสัดส่วน ไม่ใช่การคาดการณ์', [
        ['รายรับ', money(1000 * sell) + ' ฿'],
        [costTh, money(1000 * cost) + ' ฿'],
        ['เหลือ', money(+(1000 * keep).toFixed(2)) + ' ฿', thin ? 'warn' : '']])}
    </div>
    ${thin
      ? `<div class="issue mt-s">${ic('alertTriangle', 14)}<b>ราคาที่ตั้งไว้ไม่คุ้ม${esc(costTh)}</b> — ยิ่งอ่านยิ่งขาดทุน ปรับราคาได้ที่หน้าตั้งค่า</div>`
      : `<div class="muted mt-s" style="font-size:.72rem">นับเฉพาะหน้าที่อ่านสำเร็จ — หน้าที่ข้ามหรืออ่านไม่ออกไม่คิดทั้งสองฝั่ง · ไฟล์ที่เก็บไว้เฉย ๆ ไม่มีต้นทุน</div>`}
  </div>`;
}

function dashOffice() {
  const c = dashCtx(), g = c.g, fin = c.fin;
  const rows = roleCompanies().map(id => {
    const co = state.companies.find(x => x.id === id);
    const docs = state.docs.filter(d => d.company === id && !d.deleted && d.date >= g.from && d.date <= g.to);
    const clean = docs.filter(d => d.status === 'clean').length;
    return {
      co, n: docs.length, clean, need: docs.length - clean,
      /* หน้าที่คิดเงินได้จริง — ใบที่อ่านไม่ออกไม่คิดทั้งสองฝั่ง เหมือน tenantPages() ที่ตัดบิลจริง */
      bill: docs.filter(d => d.status !== 'unreadable').length,
      notExp: docs.filter(d => !d.exportedAt).length,
      rate: docs.length ? Math.round(clean / docs.length * 100) : null
    };
  });
  const tot = rows.reduce((x, r) => ({ n: x.n + r.n, bill: x.bill + r.bill, need: x.need + r.need, notExp: x.notExp + r.notExp }), { n: 0, bill: 0, need: 0, notExp: 0 });
  const needMax = Math.max.apply(null, rows.map(r => r.need).concat([1]));
  const openAll = state.tasks.filter(t => t.status === 'open' && roleCompanies().includes(t.company));
  const byAssignee = {};
  openAll.forEach(t => { byAssignee[t.assignee] = (byAssignee[t.assignee] || 0) + 1; });
  const load = Object.entries(byAssignee).sort((x, y) => y[1] - x[1]);
  const loadMax = Math.max.apply(null, load.map(x => x[1]).concat([1]));
  /* ยืนอยู่ที่สำนักงานตัวเอง = สวมหมวกเจ้าของระบบ จึงเห็นปัญหาของทุกสำนักงาน
     ระหว่างเข้าไปช่วยที่อื่น จะเห็นเท่าที่คนของสำนักงานนั้นเห็น */
  const plat = asPlatform();
  const myErrors = plat
    ? state.errors.slice().sort((x, y) => SEV_ORDER[x.sev] - SEV_ORDER[y.sev])
    : errorsOfTenant();
  /* "ยังต้องแก้" = ยังไม่มีทางแก้ที่ลงมือได้ ไม่ใช่ตัดสินจากความรุนแรงอย่างเดียว */
  const fixedRe = /ทำงานถูกต้องแล้ว|ทำงานตามที่ออกแบบ|ตั้งใจให้เป็นแบบนี้/;
  /* เคส Drive ผูกกับสถานะสดของบริษัทนั้น — พอกดเชื่อม Drive ใหม่ตามทางแก้ที่ตารางเขียนไว้เอง เคสต้องเลิกค้าง */
  const driveFixed = e => /Drive/.test(e.type) && driveReady(state.companies.find(x => x.id === e.company) || {});
  const openProb = myErrors.filter(e => e.sev !== 'low' && !fixedRe.test(e.fix) && !driveFixed(e));
  const allDocs = state.docs.filter(d => !d.deleted);
  /* ใช้แหล่งเดียวกับหน้าประวัติการใช้งาน ไม่งั้นตัวเลขบนการ์ดกับรายการที่กดเข้าไปดูนับไม่เท่ากัน */
  const denied = auditVisible().filter(x => /ถูกปฏิเสธ/.test(x.action));
  const cr = credit();
  /* กราฟของสำนักงานต้องรวมทุกบริษัทที่ดูแล ไม่ใช่เฉพาะบริษัทที่เลือกอยู่ */
  const cos = roleCompanies();
  /* การ์ดท้ายหน้าต้องเป็นของทั้งสำนักงานเหมือน KPI ด้านบน ไม่ใช่ของบริษัทที่บังเอิญเลือกค้างไว้ */
  const inAll = state.docs.filter(d => cos.indexOf(d.company) > -1 && !d.deleted && d.date >= g.from && d.date <= g.to);
  const estAll = histEstimate(g.from, g.to, cos);
  const oData = chartSeries(cos);

  /* แปลงชุดข้อมูลเอกสารให้เป็นตัวเลขฝั่งสำนักงาน — เงินที่สำนักงานได้ และงานที่พนักงานต้องแบก
     ไม่ใช่ยอดค่าใช้จ่ายของบริษัทลูกค้า ซึ่งเป็นเรื่องของเจ้าของกิจการ */
  /* สำนักงานเจ้าของระบบหักค่าโมเดล · สำนักงานที่ซื้อไปหักค่าระบบที่จ่ายให้เจ้าของระบบ
     ห้ามใช้ต้นทุนค่าโมเดลกับสำนักงานลูกค้า เพราะนอกจากตัวเลขผิดแล้วยังเป็นการบอกราคาทุนของเราให้เขารู้ */
  const own = !!tenant().owner;
  const cpp = costPerPage();
  const costWord = own ? 'ทุนค่าโมเดล' : 'ค่าระบบ';
  const keepPer = +(state.bahtPerPage - cpp).toFixed(2);
  const econ = oData.map(d => {
    const clean = d.rate == null ? 0 : Math.round(d.n * d.rate / 100);
    return {
      m: d.m, n: d.n,
      profit: +(d.n * keepPer).toFixed(2),
      need: d.n - clean
    };
  });
  /* ภาระตรวจ ยิ่งน้อยยิ่งดี ป้ายจึงกลับข้างกับกราฟอัตราผ่าน */
  const needPts = econ.length < 2 ? null : econ[econ.length - 1].need - econ[econ.length - 2].need;

  /* ช่อง KPI ที่ 4 มีเรื่องแย่งกันอยู่หลายเรื่อง — เรียงตามความด่วนจริง ไม่ใช่ตามลำดับที่เขียนโค้ด
     เครดิตหมด = บอทหยุดรับใบทันที จึงด่วนกว่าปัญหาที่ยังมีทางเลี่ยง */
  const kCredit = () => kpi({ icon: 'money', tone: cr.st === 'stop' ? 'tone-danger' : 'tone-warning',
    label: cr.st === 'stop' ? 'เครดิตหมด — บอทหยุดรับใบ' : 'เครดิตค่าระบบใกล้หมด',
    value: money(cr.left) + ' ฿',
    sub: `อ่านได้อีก ${Math.max(0, cr.pagesLeft).toLocaleString()} หน้า · เติมได้ที่การ์ดด้านล่าง` });
  const kProb = () => kpi({ icon: 'alertTriangle', tone: 'tone-danger',
    label: plat ? 'ปัญหาที่ยังต้องแก้' : 'ปัญหาระบบที่ต้องดู',
    value: openProb.length,
    sub: plat ? `ทุกสำนักงาน · รุนแรง ${openProb.filter(e => e.sev === 'high').length} · กลาง ${openProb.filter(e => e.sev === 'med').length}`
              : 'กดดูรายละเอียดด้านล่าง · แจ้งผู้ให้บริการได้',
    trend: myErrors.some(e => e.reported)
      ? `<span class="kpi-trend warn">${plat ? 'มีเคสที่สำนักงานแจ้งเข้ามา' : 'แจ้งแล้วบางเคส'}</span>` : '' });
  const hotCredit = !cr.t.owner && cr.st !== 'ok';
  const kpi4 =
      hotCredit && cr.st === 'stop' ? kCredit()
    : openProb.some(e => e.sev === 'high') ? kProb()
    : hotCredit ? kCredit()
    : openProb.length ? kProb()
    : kpi({ icon: 'upload', tone: tot.notExp ? 'tone-warning' : '', label: 'ยังไม่ส่งออกรวม', value: tot.notExp, sub: 'ทุกบริษัทรวมกัน' });

  return `
  ${dashHead(`ภาพรวมทั้งสำนักงาน · ${rows.length} บริษัท · ${g.label}`)}

  <div class="kpi-row">
    ${kpi({ icon: 'building', label: 'บริษัทที่ดูแล', value: rows.length, sub: `tenant ${esc(company().tenant)}` })}
    ${kpi({ icon: 'receipt', label: 'เอกสารรวมทุกบริษัท', value: tot.n + estAll.n,
            sub: estAll.n ? `ในระบบจริง ${tot.n} ใบ · ประมาณการย้อนหลัง ${estAll.n} ใบ` : 'ในช่วงที่เลือก' })}
    ${kpi({ icon: 'alertTriangle', tone: tot.need ? 'tone-warning' : '', label: 'รอตรวจรวม', value: tot.need,
            sub: tot.need ? 'กระจายอยู่หลายบริษัท' : 'ตรวจครบแล้ว' })}
    ${kpi4}
  </div>

  <div class="dash-2 mt" style="grid-template-columns:1fr 1fr">
    ${state.range === 'today' ? todayCard(inAll)
      : state.range === '7d' ? weekCard(cos, 'เอกสารเข้ามารายวัน · ทุกบริษัท') : `
    <div class="card chart-card">
      <div class="card-head">
        <div>
          <h3>ส่วนต่างค่าอ่านของสำนักงาน</h3>
          <div class="muted small">รายรับหัก${esc(costWord)}ต่อ${c.cm === 'month' ? 'เดือน' : 'สัปดาห์'} · ${money(state.bahtPerPage)} เก็บ − ${money(cpp)} ${esc(own ? 'ทุน' : 'ค่าระบบ')} = ${money(keepPer)} ฿/หน้า</div>
        </div>
        ${keepPer > 0 ? '' : '<span class="badge unreadable">ต่ำกว่าทุน</span>'}
      </div>
      ${lineChart(econ, { key: 'profit', unit: ' ฿', tipLabel: 'ส่วนต่าง', aria: 'ส่วนต่างค่าอ่านของสำนักงานต่อช่วง' })}
      <div class="chart-note">
        เส้นนี้เป็นเงินของสำนักงานล้วน ไม่ใช่ยอดค่าใช้จ่ายของบริษัทลูกค้า ·
        คิดจากจำนวนใบที่เข้ามาในช่วงนั้นคูณส่วนต่างต่อหน้า ${own
      ? 'ปรับราคาและต้นทุนได้ที่หน้าตั้งค่า'
      : 'ปรับราคาที่เก็บจากลูกค้าได้ที่หน้าตั้งค่า ส่วนค่าระบบเป็นอัตราตามสัญญา'}
        ${estAll.n ? '· ก่อน ส.ค. 2569 ไม่มีเอกสารจริงในระบบ จุดช่วงนั้นจึงประมาณจากยอดสรุปรายเดือน — การ์ดส่วนต่างด้านล่างนับเฉพาะเอกสารจริง ยอดจึงน้อยกว่าผลรวมของกราฟ' : ''}
      </div>
    </div>`}

    <div class="card chart-card">
      <div class="card-head">
        <div>
          <h3>ภาระตรวจของทีม</h3>
          <div class="muted small">ใบที่พนักงานต้องเปิดดูเองต่อ${c.cm === 'month' ? 'เดือน' : 'สัปดาห์'} · ไม่ใช่ใบทั้งหมดที่เข้ามา</div>
        </div>
        ${needPts == null ? ''
      : `<span class="badge ${needPts < 0 ? 'clean' : needPts === 0 ? 'neutral' : 'flagged'}">${needPts > 0 ? '+' : ''}${needPts} ใบ</span>`}
      </div>
      ${lineChart(econ, { key: 'need', unit: ' ใบ', tipLabel: 'ต้องตรวจ', aria: 'จำนวนใบที่ทีมสำนักงานต้องตรวจต่อช่วง' })}
      <div class="chart-note">
        เป้าคือเส้นนี้แบนหรือลง แม้เอกสารที่เข้ามาจะเพิ่มขึ้น — แปลว่ารับลูกค้าเพิ่มได้โดยไม่ต้องเพิ่มคน
      </div>
    </div>
  </div>

  ${marginCard(tot.bill, g.label)}
  ${creditCard()}

  <div class="dash-2 mt">
    <div class="card">
      <div class="card-head">
        <div><h3>สถานะรายบริษัท</h3><div class="muted small">กดชื่อบริษัทเพื่อสลับไปดูของบริษัทนั้น</div></div>
      </div>
      <div class="tablewrap">
        <table>
          <thead><tr><th>บริษัท</th><th class="num">เอกสาร</th><th class="num">ผ่านได้เลย</th><th class="num">รอตรวจ</th><th class="num">ยังไม่ส่งออก</th><th>อัตราผ่าน</th></tr></thead>
          <tbody>
          ${rows.map(r => `<tr class="clickable" tabindex="0" role="button" aria-label="สลับไปดู ${esc(r.co.name)}" data-switchco="${r.co.id}">
            <td><b>${esc(r.co.name)}</b><div class="muted small">${esc(r.co.group)}</div></td>
            <td class="num">${r.n}</td>
            <td class="num">${r.clean}</td>
            <td class="num">${r.need ? `<span class="badge flagged">${r.need}</span>` : '0'}</td>
            <td class="num">${r.notExp}</td>
            <td>${r.rate == null ? '<span class="muted small">—</span>'
              : `<div class="prog-track" style="min-width:80px"><i style="width:${r.rate}%"></i></div><span class="muted small">${r.rate}%</span>`}</td>
          </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="card-head"><div><h3>บริษัทที่ต้องเร่งตรวจ</h3><div class="muted small">เรียงตามจำนวนใบที่ค้าง</div></div></div>
      ${rows.slice().sort((x, y) => y.need - x.need).map(r => `
        <div class="prog">
          <div class="prog-top"><span>${esc(r.co.name)}</span><b>${r.need} ใบ</b></div>
          <div class="prog-track"><i style="width:${r.need ? Math.max(2, Math.round(r.need / needMax * 100)) : 0}%"></i></div>
          <div class="prog-sub">จากทั้งหมด ${r.n} ใบ</div>
        </div>`).join('')}
    </div>
  </div>

  <div class="card mt">
    <div class="card-head">
      <div>
        <h3>${ic('alertTriangle', 15)} ${plat ? 'ปัญหาจากการใช้งานจริง' : 'ปัญหาที่เกิดในสำนักงานคุณ'}</h3>
        <div class="muted small">${plat
      ? 'ทุกสำนักงานในระบบ · เรียงตามความรุนแรง — เคสที่มีป้ายคือสำนักงานกดแจ้งเข้ามาเอง'
      : `เฉพาะของ ${esc(tenant().name)} — กดแจ้งผู้ให้บริการได้ถ้าแก้เองไม่ได้`}</div>
      </div>
      ${openProb.filter(e => e.sev === 'high').length
      ? `<span class="badge unreadable">${openProb.filter(e => e.sev === 'high').length} เคสรุนแรง</span>`
      : '<span class="badge clean">ไม่มีเคสรุนแรง</span>'}
    </div>
    ${myErrors.length ? `<div class="tablewrap">
      <table>
        <thead><tr><th>ความรุนแรง</th><th>อาการ</th><th class="num">ครั้ง</th>${plat ? '<th>สำนักงาน</th>' : ''}<th>บริษัท</th><th>ล่าสุด</th><th>${plat ? 'ทางแก้' : ''}</th></tr></thead>
        <tbody>
        ${myErrors.map(e => `<tr class="${driveFixed(e) ? '' : e.sev === 'high' ? 'row-unreadable' : e.sev === 'med' ? 'row-flagged' : ''}">
          <td class="nowrap"><span class="badge ${SEV_CLS[e.sev]}">${esc(SEV_TH[e.sev])}</span></td>
          <td><b>${esc(e.type)}</b><div class="muted small">${esc(e.detail)}</div></td>
          <td class="num"><b>${e.count}</b></td>
          ${plat ? `<td class="nowrap small">${esc(tenantName(errorTenant(e)))}${e.reported
            ? `<div><span class="badge unreadable">${ic('bell', 10)} แจ้งเข้ามา</span></div>` : ''}</td>` : ''}
          <td class="nowrap small">${esc(companyName(e.company))}</td>
          <td class="nowrap small muted">${esc(e.last)}</td>
          <td class="${plat ? 'small muted' : 'nowrap'}">${driveFixed(e)
            ? `<span class="badge clean">${ic('check', 12)} แก้แล้ว — Drive เชื่อมแล้ว</span>`
            : plat ? esc(e.fix) : (e.reported
              ? `<span class="muted small">${ic('check', 12)} แจ้งแล้ว ${esc(e.reportedAt)}</span>`
              : `<button class="btn small" data-report="${e.id}">${ic('bell', 12)} แจ้งผู้ให้บริการ</button>`)}</td>
        </tr>`).join('')}
        </tbody>
      </table>
    </div>` : '<div class="empty small">ไม่มีปัญหาค้างอยู่ในสำนักงานนี้</div>'}
  </div>

  ${plat ? `
  <div class="sec-head">
    <div>
      <h2>${ic('server', 16)} ในฐานะเจ้าของระบบ</h2>
      <p>ส่วนนี้เห็นได้เฉพาะสำนักงานที่เป็นเจ้าของระบบ — สำนักงานที่ซื้อไปใช้จะไม่เห็นทั้งบล็อกนี้</p>
    </div>
    <span class="badge brand">${ic('shieldCheck', 12)} ${esc(tenant().name)}</span>
  </div>

  <div class="card">
    <div class="card-head">
      <div>
        <h3>${ic('building', 15)} สำนักงานที่ซื้อระบบไปใช้</h3>
        <div class="muted small">ตัวเลขสรุปเท่านั้น — เปิดสำนักงานใหม่ เติมเครดิต เข้าไปช่วย ระงับ อยู่ที่หน้าสำนักงานลูกค้า</div>
      </div>
      <button class="btn small primary" data-nav="tenants">จัดการสำนักงาน ${ic('arrowRight', 12)}</button>
    </div>
    ${(() => {
      const rs = state.tenants.map(x => credit(x.id));
      const pd = rs.filter(x => !x.t.owner);
      const rev = pd.reduce((s, x) => s + x.used, 0);
      const api = pd.reduce((s, x) => s + x.pages * state.apiCostPerPage, 0);
      const held = pd.reduce((s, x) => s + Math.max(0, x.left), 0);
      return `
      <div class="kpi-row" style="margin-bottom:1rem">
        ${kpi({ icon: 'money', tone: 'tone-success', label: 'รายรับค่าระบบสะสม', value: money(rev) + ' ฿',
                sub: `จาก ${pd.length} สำนักงานที่ซื้อไปใช้` })}
        ${kpi({ icon: 'server', label: 'ค่าโมเดลที่ออกให้เขา', value: money(api) + ' ฿',
                sub: `${money(state.apiCostPerPage)} ฿/หน้า · จ่ายเจ้าของโมเดลตรง` })}
        ${kpi({ icon: 'checkCircle', tone: 'tone-success', label: 'เหลือจากการขายระบบ',
                value: money(+(rev - api).toFixed(2)) + ' ฿', sub: 'ไม่รวมกำไรจากสำนักงานตัวเอง' })}
        ${kpi({ icon: 'inbox', label: 'เครดิตที่ถือไว้ล่วงหน้า', value: money(held) + ' ฿',
                sub: 'เงินที่รับมาแล้วแต่ยังไม่ได้ให้บริการ' })}
      </div>
      ${pd.map(x => `
        <div class="sum-row">
          <span>${ic('building', 12)} ${esc(x.t.name)} <span class="muted small">· ${esc(x.t.plan)}</span></span>
          <b><span class="badge ${CREDIT_CLS[x.st]}">${esc(CREDIT_TH[x.st])}</span>
            <span class="muted small" style="margin-left:.5rem">เหลือ ${money(x.left)} ฿ · ${Math.max(0, x.pagesLeft).toLocaleString()} หน้า</span></b>
        </div>`).join('')}`;
    })()}
  </div>

  <div class="dash-2 mt">
    ${rateChartCard({ ...c, data: oData, pts: ratePts(cos) }, 'ความแม่นของการอ่านเอกสารทุกบริษัทที่สำนักงานดูแล — ตัวชี้วัดคุณภาพของบอท')}
    <div class="card">
      <div class="card-head">
        <div><h3>ความพยายามข้ามสิทธิ์</h3><div class="muted small">จาก audit_log — "ไม่กั้น แต่ให้เห็น"</div></div>
        ${denied.length ? `<span class="badge flagged">${denied.length} ครั้ง</span>` : ''}
      </div>
      ${denied.length ? denied.slice(0, 5).map(x => `
        <div class="feed"><span class="fav">${esc(uname(x.actor).slice(0, 1))}</span>
        <div><div class="fl">${esc(x.action)}</div><div class="muted small">${esc(uname(x.actor))} · ${esc(x.at)}</div></div></div>`).join('')
      : '<div class="empty small">ยังไม่มีการกดที่ถูกปฏิเสธในเซสชันนี้ — ลองสลับบทบาทแล้วกดปุ่มที่ไม่มีสิทธิ์</div>'}
      <div class="sum-row" style="margin-top:0.75rem"><span>เอกสารในระบบทั้งหมด</span><b>${allDocs.length} ใบ</b></div>
      <div class="sum-row"><span>ผู้ใช้ที่รู้จัก</span><b>${state.members.length} คน</b></div>
      <button class="btn cta" data-nav="settings">ตั้งค่า White-Label ${ic('arrowRight', 13)}</button>
    </div>
  </div>` : ''}

  <div class="dash-4">
    ${flaggedCard(inAll, fin)}
    ${missFieldCard(state.docs.filter(d => roleCompanies().includes(d.company)))}
    <div class="card">
      <div class="card-head"><div><h3>โหลดงานรายคน</h3><div class="muted small">งานที่ยังไม่ปิด</div></div></div>
      ${load.length ? load.map(x => `
        <div class="prog">
          <div class="prog-top"><span>${esc(uname(x[0]))}</span><b>${x[1]} งาน</b></div>
          <div class="prog-track"><i style="width:${Math.round(x[1] / loadMax * 100)}%"></i></div>
        </div>`).join('') : '<div class="empty small">ไม่มีงานค้าง</div>'}
    </div>
    <div class="card">
      <div class="card-head"><h3>${ic('settings', 15)} ตั้งค่าระดับสำนักงาน</h3></div>
      <div class="sum-row"><span>ค่าอ่านที่เก็บลูกค้า</span><b>${state.bahtPerPage} บาท/หน้า</b></div>
      <div class="sum-row"><span>บริษัทในสำนักงาน</span><b>${rows.length}</b></div>
      <div class="sum-row"><span>คำขออนุมัติค้าง</span><b>${state.tasks.filter(t => t.type === 'approval' && t.status === 'open' && roleCompanies().includes(t.company)).length}</b></div>
      <button class="btn cta" data-nav="settings">ไปที่หน้าตั้งค่า ${ic('arrowRight', 13)}</button>
    </div>
  </div>
  ${feedCard()}
  ${srcline('11 (tenant_id · office_admin) · 12 (8.1 Shared Shell · RLS)' + (plat ? ' · 08 (error cases) · 11 (audit_log)' : ''))}`;
}

const overdue = t => t.status === 'open' && t.due < TODAY;

function scDashboard() {
  if (state.role === 'owner') return dashOwner();
  if (state.role === 'office_admin') return dashOffice();
  return dashAccountant();
}

/* ---------- Documents ---------- */
function scDocuments() {
  const fin = can('view_financial');
  /* ทะเบียนเอกสารมีไว้ "ค้น" ไม่ใช่ "ไล่ดู" — ใบที่ผ่านแล้วจึงไม่ต้องอยู่ในสายตา แต่ต้องหาเจอเสมอ
     ค้นได้จาก เลขที่ · ผู้ขาย · เลขผู้เสียภาษี · หมวด · ยอดเงิน · วันที่ */
  const q = (state.docQuery || '').trim().toLowerCase();
  const hay = d => [d.id, d.vendor, d.taxId, d.category, d.total == null ? '' : d.total.toFixed(2),
    d.date, d.batch || ''].join(' ').toLowerCase();
  const all = docsScope().filter(d => !q || hay(d).indexOf(q) > -1);
  /* KPI พาดหัวนับจากสิ่งที่เห็นในตารางจริง ไม่ใช่จากบริษัทที่เลือกอยู่เท่านั้น */
  const st = stats(all);
  /* หัวหน้าเพจต้องบอกขอบเขตที่ตารางกำลังแสดงจริง — ตอนดูรวมทุกบริษัท ชื่อบริษัทเดียวคือคำกล่าวอ้างที่ผิด */
  const scopeName = state.allCos ? `ทุกบริษัทที่ดูแล (${roleCompanies().length})` : company().name;
  /* "ต้องตรวจ" ต้องรวมใบที่อ่านไม่ออกด้วย ให้ตรงกับ KPI พาดหัวที่นับ flagged + unreadable
     เดิมชิปนับเฉพาะ flagged ตัวเลขสองที่บนจอเดียวกันจึงไม่ตรงกัน */
  const need = d => d.status !== 'clean';
  const F = {
    all: () => all,
    flagged: () => all.filter(need),
    unreadable: () => all.filter(d => d.status === 'unreadable'),
    notexported: () => all.filter(needsExport)
  };
  const list = (F[state.docFilter] || F.all)();

  const chips = [
    ['all', 'ทั้งหมด'], ['flagged', 'ต้องตรวจ'], ['unreadable', 'อ่านไม่ออก'], ['notexported', 'ยังไม่ส่งออก']
  ];

  return `
  <div class="page-head">
    <div><h1>เอกสาร</h1><div class="sub">${state.docFilter === 'flagged'
      ? `กำลังดูเฉพาะใบที่ต้องตรวจ · ${esc(scopeName)} — ตรวจผ่านแล้วใบนั้นจะหายจากรายการนี้เอง แต่ยังอยู่ในทะเบียน`
      : `Documents Tab · ${esc(scopeName)} — ทุกคนในกลุ่มเห็นเอกสารของบริษัทตัวเองได้ (B-9)`}</div></div>
  </div>

  ${kpiRow([
      { icon: 'receipt', label: 'เอกสารที่แสดงอยู่', value: st.total, sub: 'ตามคำค้นและตัวกรองที่เลือก · ทุกใบถูกบันทึก ไม่กั้น' },
      { icon: 'checkCircle', tone: 'tone-success', label: 'ผ่านได้เลย', value: st.clean, sub: 'ไม่ต้องเปิดดู',
        trend: `<span class="kpi-trend">${st.total ? Math.round(st.clean / st.total * 100) : 0}%</span>` },
      { icon: 'alertTriangle', tone: (st.flagged + st.unreadable) ? 'tone-warning' : '', label: 'ต้องตรวจ', value: st.flagged + st.unreadable,
        sub: `ติดธง ${st.flagged} · อ่านไม่ออก ${st.unreadable}` },
      { icon: 'upload', label: 'ยังไม่ส่งออก', value: st.notExported, sub: 'exported_at ยังว่าง' }
    ])}

  <div class="docbar">
    <div class="chips" style="margin:0">
      ${chips.map(([k, l]) => `<button class="chip ${state.docFilter === k ? 'on' : ''}" data-filter="${k}">${l} <b>${F[k]().length}</b></button>`).join('')}
    </div>
    ${coFilter('docCoSelect')}
    ${searchBox('docSearch', state.docQuery, 'ค้นหา เลขที่ · ผู้ขาย · เลขภาษี · ยอด · วันที่')}
  </div>
  ${q ? `<div class="muted small" style="margin:-0.5rem 0 0.9rem">
      ค้น "<b>${esc(state.docQuery)}</b>" เจอ ${all.length} ใบจากทั้งหมด ${docsScope().length} ใบ ·
      ตัวเลขบนชิปด้านบนนับเฉพาะที่ตรงกับคำค้น ·
      <button class="linklike" data-act="clearq">ล้างคำค้น</button></div>` : ''}

  ${tableHead('รายการเอกสาร', list.length + ' รายการ')}
  <div class="tablewrap">
    <table>
      <thead><tr>
        <th>สถานะ</th><th>เลขที่</th>${state.allCos ? '<th>บริษัท</th>' : ''}<th>วันที่</th><th>ผู้ขาย</th><th>เลขผู้เสียภาษี</th>
        <th class="num">ยอดก่อน VAT</th><th class="num">VAT</th><th class="num">ยอดรวม</th>
        <th>หมวด</th><th>ผู้ส่ง</th><th>ส่งออก</th>
      </tr></thead>
      <tbody>
      ${list.length ? list.map(d => `
        <tr class="clickable ${d.status === 'flagged' ? 'row-flagged' : d.status === 'unreadable' ? 'row-unreadable' : ''}" tabindex="0" role="button" aria-label="เปิดเอกสาร ${esc(d.id)}" data-doc="${d.id}">
          <td>${statusBadge(d.status)}</td>
          <td class="nowrap">${esc(d.id)}</td>
          ${state.allCos ? `<td class="nowrap small">${esc(companyName(d.company))}</td>` : ''}
          <td class="nowrap">${fmtD(d.date)}</td>
          <td>${esc(d.vendor)}</td>
          <td class="nowrap">${esc(d.taxId)}</td>
          <td class="num">${fin.ok ? money(d.base) : '<span class="masked">••••</span>'}</td>
          <td class="num">${fin.ok ? money(d.vat) : '<span class="masked">••••</span>'}</td>
          <td class="num"><b>${fin.ok ? money(d.total) : '<span class="masked">••••</span>'}</b></td>
          <td class="nowrap">${esc(d.category)}</td>
          <td class="nowrap">${esc(uname(d.by))}</td>
          <td>${d.staleExport ? `<span class="badge flagged">แก้หลังส่งออก · ${esc(d.staleExport.batch)}</span>`
      : d.exportedAt ? `<span class="badge neutral">${esc(d.batch)}</span>` : '<span class="muted small">—</span>'}</td>
        </tr>`).join('')
      : `<tr><td colspan="${state.allCos ? 12 : 11}"><div class="empty">${q && F.all().length
        ? `ไม่เจอ "${esc(state.docQuery)}" ในรายการ "${esc((chips.find(c => c[0] === state.docFilter) || [, ''])[1])}" —
           แต่เจอ ${F.all().length} ใบในทะเบียนทั้งหมด <button class="linklike" data-filter="all">ดูทั้งหมด</button>`
        : q ? `ไม่เจอเอกสารที่ตรงกับ "${esc(state.docQuery)}" · <button class="linklike" data-act="clearq">ล้างคำค้น</button>`
          : state.docFilter === 'flagged'
            ? `ตรวจครบแล้ว — ไม่มีใบที่ต้องเปิดดูเองใน ${esc(scopeName)} · กด "ทั้งหมด" เพื่อดูทะเบียนเอกสารทุกใบ`
            : 'ไม่มีเอกสารตามเงื่อนไขนี้'}</div></td></tr>`}
      </tbody>
    </table>
  </div>

  ${fin.ok ? '' : `<div class="inline-lock mt">${ic('lock', 16)} <div><b>ตัวเลขถูกซ่อน</b> — ${esc(fin.reason)}<br>เส้นแบ่งของสิทธิ์อยู่ที่ <b>ตัวเลขสรุป</b> ไม่ใช่ <b>เอกสารรายใบ</b> จึงยังเห็นว่ามีเอกสารอะไรบ้าง</div></div>`}
  ${srcline('08 (กติกา validate · สถานะ clean/flagged/unreadable) · 11 (documents · extractions)')}`;
}

function statusBadge(s) {
  if (s === 'clean') return `<span class="badge clean">${ic('checkCircle', 12)} ผ่าน</span>`;
  if (s === 'flagged') return `<span class="badge flagged">${ic('alertTriangle', 12)} ต้องตรวจ</span>`;
  return `<span class="badge unreadable">${ic('xCircle', 12)} อ่านไม่ออก</span>`;
}

/* ---------- Doc drawer ---------- */
function openDoc(id) {
  const d = state.docs.find(x => x.id === id);
  if (!d) return;
  state.openDoc = id;
  const fin = can('view_financial');
  const canReview = can('review');
  const canDel = can('doc_delete');
  const fields = [
    ['vendor', 'ชื่อผู้ขาย', d.vendor, false],
    ['taxId', 'เลขผู้เสียภาษี', d.taxId, false],
    ['date', 'วันที่', fmtD(d.date), false],
    ['base', 'ยอดก่อน VAT', money(d.base), true],
    ['vat', 'VAT', money(d.vat), true],
    ['total', 'ยอดรวม', money(d.total), true],
    ['category', 'หมวดค่าใช้จ่าย', d.category, false]
  ];

  $('#drawerPanel').innerHTML = `
    <div class="drawer-head">
      <div>
        <h2>${esc(d.id)} ${statusBadge(d.status)}</h2>
        <div class="muted small">${esc(companyName(d.company))} · ส่งโดย ${esc(uname(d.by))} · ${fmtD(d.date)}</div>
      </div>
      <button class="close-x" data-close-drawer aria-label="ปิดหน้าต่างเอกสาร">${ic('x', 15)}</button>
    </div>

    ${d.staleExport ? `<div class="issue"><b>แก้หลังส่งออก</b> — ไฟล์ของชุด ${esc(d.staleExport.batch)} ที่สำนักงานถืออยู่ยังเป็นยอดเดิม · ใบนี้อยู่ในชุดส่งออกครั้งถัดไปแล้ว</div>`
      : d.exportedAt ? `<div class="issue info"><b>ส่งออกไปแล้ว</b> — ชุด ${esc(d.batch)} เมื่อ ${esc(d.exportedAt)} · ถ้าแก้ตอนนี้ระบบจะเตือนให้ส่งออกซ้ำ</div>` : ''}
    ${d.issues.map(i => `<div class="issue">${ic('alertTriangle', 15)}<b>${esc(i.field)}</b> — ${esc(i.msg)}</div>`).join('')}

    <div class="doc-grid">
      <div>
        <div class="muted small" style="margin-bottom:6px">ภาพต้นฉบับ — ยังไม่มีใน prototype นี้</div>
        <div class="receipt">
          <div class="rc-top"><b>ไม่มีภาพให้เทียบ</b>ค่าที่อยู่บนกระดาษไม่ได้ถูกเก็บแยกไว้</div>
          <div class="rc-row rc-blur"><span>วันที่</span><span>••••</span></div>
          <div class="rc-row rc-blur"><span>สินค้า/บริการ</span><span>••••</span></div>
          <div class="rc-row rc-blur"><span>ราคาก่อนภาษี</span><span>••••</span></div>
          <div class="rc-row rc-blur"><span>ภาษีมูลค่าเพิ่ม 7%</span><span>••••</span></div>
          <div class="rc-row rc-total rc-blur"><span>รวมทั้งสิ้น</span><span>••••</span></div>
        </div>
        <div class="muted small mt-s">ไฟล์: ${d.status === 'unreadable'
      ? `${esc(d.date)}_1432_LINE_a1b2c3.jpg <span class="badge neutral">_รอตรวจสอบ</span>`
      : `${esc(d.date)}_LINE_${esc(d.id)}.jpg`}</div>
        <div class="muted small mt-s">ระบบเก็บเฉพาะ<b>ค่าที่ AI อ่านได้</b> (คอลัมน์ขวา) ยังไม่ได้เก็บค่าที่อยู่บนกระดาษไว้เป็นอีกชุดหนึ่ง
          — วาดเป็น "ต้นฉบับ" ไม่ได้ เพราะจะกลายเป็นการพิมพ์ค่าที่ถูกกล่าวหาว่าอ่านผิดซ้ำอีกรอบ และจะเปลี่ยนตามทุกครั้งที่คนแก้ยอด</div>
      </div>

      <div>
        <div class="muted small" style="margin-bottom:6px">ค่าที่ AI อ่านได้ + ความมั่นใจรายฟิลด์</div>
        ${fields.map(([k, label, val, isMoney]) => {
        const c = d.conf[k];
        const ed = d.edited && d.edited[k];
        const show = (!isMoney || fin.ok) ? esc(val) : '<span class="masked">••••</span>';
        return `<div class="fieldrow" data-field="${k}">
            <div class="fname">${esc(label)}</div>
            <div class="fval ${!ed && c != null && c < .7 ? 'low' : ''}">${show}</div>
            <div class="conf">${confCell(c, ed)}</div>
            ${canReview.ok ? `<button class="btn small" data-editfield="${k}">แก้</button>` : ''}
          </div>`;
      }).join('')}
      </div>
    </div>

    <div class="mt" style="display:flex;gap:8px;flex-wrap:wrap">
      ${d.status === 'unreadable' && canReview.ok
      ? (d.reshoot
        ? `<span class="badge orange">ขอถ่ายใหม่แล้ว · งาน ${esc(d.reshoot.task)} · โดย ${esc(uname(d.reshoot.by))} เมื่อ ${esc(d.reshoot.at)}</span>`
        : `<button class="btn primary" data-act="reshoot">${ic('camera', 14)} ขอให้ถ่ายใหม่</button>`)
      : d.confirmedBy
        ? `<span class="badge clean">${ic('userCheck', 13)} รับรองโดย ${esc(uname(d.confirmedBy))} · ${esc(d.confirmedAt)}</span>`
        : canReview.ok ? `<button class="btn primary" data-act="confirmdoc">${ic('checkCircle', 14)} ยืนยันว่าถูกต้อง</button>`
          : d.status === 'clean' ? '<span class="badge neutral">ระบบผ่านให้เอง — ยังไม่มีคนรับรอง</span>' : ''}
      ${canDel.ok ? `<span class="muted small">${ic('trash', 13)} การลบเอกสารทำบนการ์ดในไลน์ — ตอนที่เจ้าของเห็นว่าส่งผิดพอดี</span>` : ''}
    </div>

    ${d.status === 'unreadable' ? `<div class="issue info">${ic('camera', 15)}<b>ใบนี้ไม่ควรคีย์มือ</b> — คนที่แก้ได้จริงคือคนที่ถือใบเสร็จตัวจริงอยู่ในมือ ไม่ใช่คนตรวจที่มีแค่ภาพเบลอ ปุ่มแก้รายฟิลด์ยังใช้ได้ถ้าจำเป็น แต่ทางหลักคือสั่งให้ถ่ายใหม่</div>` : ''}

    <div class="card mt">
      <div class="card-head"><h3>ทำไมต้องเก็บทุกการแก้</h3></div>
      <p class="small muted" style="margin:0">ทุกครั้งที่คนแก้ ระบบเก็บ <code>ภาพต้นฉบับ + ค่าที่ AI อ่าน + ค่าที่ถูก + ใครแก้ + เมื่อไหร่</code> ลงตาราง <code>corrections</code> — หนึ่งครั้งที่แก้ = ชุดทดสอบหนึ่งใบที่ได้มาฟรี ไม่เก็บวันนี้คือหายตลอดกาล<br><span class="badge neutral">ใน prototype นี้</span> เก็บได้แค่ค่าที่ AI อ่าน · ค่าที่ถูก · ใครแก้ · เมื่อไหร่ — ยังไม่มีภาพต้นฉบับให้เก็บ</p>
    </div>`;
  $('#drawer').hidden = false;
}

/* กติกา validate ชุดเดียวกับตอนที่ AI อ่านครั้งแรก (เอกสาร 08) — เรียกซ้ำหลังคนแก้
   เพื่อไม่ให้ค่าที่ยังผิดอยู่ถูกปลดธงเพียงเพราะมีคนกดปุ่มแก้ */
function fieldIssue(k, v) {
  const s = v == null ? '' : String(v).trim();
  if (!s && s !== '0') return 'ยังไม่มีค่า';
  if (k === 'taxId') {
    const t = s.replace(/[-\s]/g, '');
    if (!/^\d{13}$/.test(t)) return 'เลขผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก';
    /* หลักที่ 13 เป็นหลักตรวจสอบ — เดิมเช็กแค่ว่าเป็นเลข 13 ตัว พิมพ์มั่ว ๆ ก็ปลดธงได้
       ทั้งที่ข้อความในระบบเขียนว่า "checksum ไม่ผ่าน" และเอกสาร 07 สั่งให้ validate เข้มเป็นพิเศษ */
    let sum = 0;
    for (let i = 0; i < 12; i++) sum += +t[i] * (13 - i);
    if ((11 - (sum % 11)) % 10 !== +t[12]) return 'เลขผู้เสียภาษีไม่ผ่านการตรวจหลักสุดท้าย (checksum)';
  }
  if (k === 'date') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return 'วันที่ต้องอยู่ในรูปแบบ ปปปป-ดด-วว';
    if (s > TODAY) return 'วันที่เป็นอนาคต — เอกสารลงวันที่หลังวันนี้ไม่ได้';
  }
  /* VAT เป็น 0 ได้จริง (บิลเงินสด ผู้ขายไม่จด VAT) จึงห้ามบังคับให้มากกว่า 0 */
  if (k === 'vat' && !(Number(s) >= 0)) return 'VAT ต้องไม่ติดลบ';
  if (['base', 'total'].includes(k) && !(Number(s) > 0)) return 'ยอดเงินต้องมากกว่า 0';
  return null;
}

/* กติกาข้ามฟิลด์ตามเอกสาร 08 — ผลบวกต้องเท่ากับยอดรวม (±0.01) และ VAT ต้องเป็น 7% ของฐาน (±0.05)
   ใบที่ VAT = 0 ถือว่าถูกต้องได้ ไม่บังคับ 7% เพราะบิลเงินสดมีจริงและเยอะ */
function balanceIssue(d) {
  const b = d.base, v = d.vat, t = d.total;
  if ([b, v, t].some(x => x == null)) return null;
  if (Math.abs((b + v) - t) > 0.01)
    return `ยอดไม่ลงตัว — ฐาน ${money(b)} + VAT ${money(v)} = ${money(+(b + v).toFixed(2))} ไม่เท่ากับยอดรวม ${money(t)}`;
  if (v > 0 && Math.abs(v - b * 0.07) > 0.05)
    return `VAT ไม่ใช่ 7% ของฐาน — 7% ของ ${money(b)} คือ ${money(+(b * 0.07).toFixed(2))}`;
  return null;
}

/* % ในช่องนี้คือความมั่นใจของ AI ล้วน ๆ
   ฟิลด์ที่คนแก้แล้วไม่ใช่ค่าที่ AI อ่านอีกต่อไป จึงติดป้าย "คนแก้" แทนการยัด 100%
   และยังโชว์ % เดิมของ AI ไว้ เพราะนั่นคือหลักฐานที่ตาราง corrections ต้องใช้ */
function confCell(c, ed) {
  if (ed) {
    const pct = ed.aiConf == null ? '—' : Math.round(ed.aiConf * 100) + '%';
    const tip = `AI อ่านได้ "${ed.aiValue || '—'}" (มั่นใจ ${pct}) · ${ed.derived ? 'คำนวณใหม่จากการแก้ของ' : 'แก้โดย'} ${uname(ed.by)} เมื่อ ${ed.at}`;
    return `<span class="chip-human" title="${esc(tip)}">${ic(ed.derived ? 'calculator' : 'userCheck', 11)} ${ed.derived ? 'คำนวณ' : 'คนแก้'}</span><small>AI ${esc(pct)}</small>`;
  }
  if (c == null) return '<small class="muted">—</small>';
  return `<div class="conf-bar ${c < state.confMin ? 'low' : c < .9 ? 'mid' : ''}"><i style="width:${Math.round(c * 100)}%"></i></div><small>${Math.round(c * 100)}%</small>`;
}

function startEditField(k) {
  const d = state.docs.find(x => x.id === state.openDoc);
  const row = $(`.fieldrow[data-field="${k}"]`);
  if (!row || !d) return;
  const cur = ['base', 'vat', 'total'].includes(k) ? (d[k] == null ? '' : d[k]) : d[k];
  /* หมวดค่าใช้จ่ายต้องเลือกจากผังของสำนักงาน ไม่ใช่พิมพ์อิสระ — ไม่งั้นไฟล์ส่งออกจะมีหมวดที่โปรแกรมบัญชีไม่รู้จัก
     ต้องยึด d.company ไม่ใช่ state.companyId เพราะโหมด "ดูรวมทุกบริษัท" เปิดใบของบริษัทอื่นได้
     ไม่งั้นจะเอาชุดหมวดของบริษัทที่เลือกอยู่ ไปใส่ให้ใบของอีกบริษัทหนึ่ง */
  row.querySelector('.fval').outerHTML = k === 'category'
    ? `<select class="fval-input">${catsUsable(cur, d.company).concat([UNCAT]).map(c =>
      `<option value="${esc(c)}" ${c === cur ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>`
    : `<input class="fval-input" value="${esc(cur)}" />`;
  row.querySelector('[data-editfield]').outerHTML =
    `<span class="fedit-actions"><button class="btn small primary" data-savefield="${k}">บันทึก</button><button class="btn small outline" data-canceledit="${k}">ยกเลิก</button></span>`;
  const input = row.querySelector('.fval-input');
  input.focus();
  if (input.select) input.select();
}

function saveEditField(k) {
  const d = state.docs.find(x => x.id === state.openDoc);
  const row = $(`.fieldrow[data-field="${k}"]`);
  const raw = row.querySelector('.fval-input').value.trim();
  const isMoney = ['base', 'vat', 'total'].includes(k);
  const before = d[k];
  let next;
  if (isMoney) {
    const v = parseFloat(raw.replace(/,/g, ''));
    if (isNaN(v)) { toast('กรอกเป็นตัวเลข', 'err'); return; }
    next = +v.toFixed(2);
  } else next = raw;

  /* กดบันทึกทั้งที่ยังไม่ได้แก้อะไร = ไม่ใช่การแก้
     ห้ามแตะความมั่นใจ ธง หรือสถานะ และห้ามเขียนลง corrections
     ถ้าค่าที่ AI อ่านถูกอยู่แล้ว ต้องกด "ยืนยันว่าถูกต้อง" ซึ่งเป็นการยืนยันทั้งใบและระบุคนรับผิดชอบชัดเจน */
  if (String(next) === String(before == null ? '' : before)) {
    toast('ไม่มีอะไรเปลี่ยน', '', 'ค่ายังเท่าเดิม — ความมั่นใจของ AI และธงตรวจสอบไม่ถูกแตะ ถ้าค่านี้ถูกแล้วให้กด "ยืนยันว่าถูกต้อง"');
    openDoc(d.id);
    return;
  }

  const prev = { base: d.base, vat: d.vat, total: d.total };
  d[k] = next;
  /* ใบที่เดิม VAT = 0 คือบิลเงินสด/ผู้ขายไม่จด VAT — ห้ามเสก VAT ขึ้นมาให้เอง
     ส่วนใบที่มี VAT อยู่แล้วถึงจะคำนวณที่ 7% ตามกติกาเอกสาร 08 */
  const hadVat = prev.vat != null && prev.vat > 0;
  if (k === 'total') {
    if (hadVat) { d.base = +(next / 1.07).toFixed(2); d.vat = +(next - d.base).toFixed(2); }
    else { d.base = next; d.vat = 0; }
  }
  if (k === 'base') {
    if (hadVat) { d.vat = +(next * 0.07).toFixed(2); d.total = +(next + d.vat).toFixed(2); }
    else { d.vat = prev.vat == null ? 0 : prev.vat; d.total = +(next + d.vat).toFixed(2); }
  }
  /* แก้ VAT ช่องเดียวต้องดันยอดรวมตาม ไม่งั้น ฐาน + VAT ไม่เท่ากับยอดรวม แล้วใบยังขึ้นว่าผ่าน */
  if (k === 'vat') { d.total = +((d.base == null ? 0 : d.base) + next).toFixed(2); }

  /* ค่าที่คนแก้เอง และค่าที่ถูกคำนวณต่อจากนั้น ไม่ใช่ค่าที่ AI อ่านอีกต่อไป
     เก็บทั้งค่าเดิมและ % เดิมของ AI ไว้ แล้วทำเครื่องหมายว่า "คนแก้" — นี่คือแถวหนึ่งใน corrections */
  d.edited = d.edited || {};
  const stamp = nowStamp();
  const mark = (key, was, derived) => {
    d.edited[key] = {
      by: meId(), at: stamp, derived,
      aiValue: was == null ? '' : (['base', 'vat', 'total'].includes(key) ? money(was) : String(was)),
      aiConf: (d.conf || {})[key] == null ? null : d.conf[key]
    };
  };
  mark(k, before, false);
  if (isMoney) ['base', 'vat', 'total'].forEach(m => { if (m !== k && d[m] !== prev[m]) mark(m, prev[m], true); });

  /* ตรวจซ้ำด้วยกติกาเดิม — แก้แล้วยังผิดอยู่ ธงต้องยังอยู่
     ต้องล้างธงของฟิลด์ที่ถูกคำนวณต่อด้วย ไม่งั้นธงเก่าค้างอยู่ทั้งที่ค่าเปลี่ยนไปแล้ว */
  const touched = [k].concat(isMoney
    ? ['base', 'vat', 'total'].filter(m => m !== k && d[m] !== prev[m]) : []);
  d.issues = d.issues.filter(i => touched.indexOf(i.field) === -1 && !i.bal);
  touched.forEach(m => { const msg = fieldIssue(m, d[m]); if (msg) d.issues.push({ field: m, msg }); });
  const balMsg = balanceIssue(d);
  if (balMsg) d.issues.push({ field: 'total', msg: balMsg, bal: true });
  const bad = d.issues.length ? (d.issues.find(i => i.field === k) || d.issues[0]).msg : null;
  /* ใช้กติกาเดียวกับ reflag() — เดิมแก้ฟิลด์ไหนก็ได้ช่องเดียวแล้วธงหลุดทั้งใบ
     ทั้งที่ใบนั้นอาจติดธงเพราะ AI ไม่มั่นใจในฟิลด์อื่นที่ยังไม่มีใครแตะ */
  const cs = Object.values(d.conf || {}).filter(v => v != null);
  const lowConf = cs.length && Math.min(...cs) < state.confMin;
  d.status = (d.issues.length || lowConf) ? 'flagged' : 'clean';

  logAudit(`แก้ไขฟิลด์ ${k} ของ ${d.id}`, String(before), String(d[k]), d.company);
  if (bad) toast('บันทึกแล้ว แต่ยังติดธงอยู่', 'err', bad);
  else if (lowConf) toast('บันทึกแล้ว แต่ยังติดธงอยู่', 'err',
    'ยังมีฟิลด์ที่ AI ไม่มั่นใจต่ำกว่าเกณฑ์ — ตรวจให้ครบแล้วกด "ยืนยันว่าถูกต้อง"');
  else toast('บันทึกการแก้ไขแล้ว', 'ok',
    isMoney ? `คำนวณใหม่: ฐาน ${money(d.base)} · VAT ${money(d.vat)} · รวม ${money(d.total)}` : 'เก็บลง corrections: ค่าที่ AI อ่าน + ค่าที่ถูก + คนแก้ + เวลา');
  /* คำเตือนอายุเท่ากับ toast ไม่พอ — ต้องมีธงถาวรให้ชุดส่งออกครั้งถัดไปหยิบใบนี้กลับไป และให้ตารางเห็นด้วย */
  if (d.exportedAt) {
    d.staleExport = { batch: d.batch, at: stamp };
    toast('เอกสารนี้ส่งออกไปแล้ว', 'err', `ชุด ${d.batch} — ใบนี้ถูกใส่กลับในชุดส่งออกครั้งถัดไปแล้ว`);
  }
  openDoc(d.id);
  render();
}

/* เกณฑ์ติดธงต้องขยับกองเอกสารจริง ไม่งั้นเป็นแค่ตัวเลขบนหน้าตั้งค่า
   ใบที่ส่งออกไปแล้วไม่แตะ — ไฟล์ที่สำนักงานถืออยู่เขียนสถานะเดิมไว้แล้ว
   ใบที่อ่านไม่ออกก็ไม่แตะ เพราะไม่มีค่าความมั่นใจให้เทียบตั้งแต่แรก */
function reflag() {
  let n = 0;
  state.docs.forEach(d => {
    /* ใบที่คนรับรองไว้แล้วห้ามแตะ — เดิมพอคุณตี๋ขยับเกณฑ์ความมั่นใจ ใบที่เพิ่งยืนยันจะกลับไปติดธง
       โดยไม่มีร่องรอย เท่ากับลบลายเซ็นคนทิ้งเงียบ ๆ ซึ่งขัดกติกาที่ระบบประกาศเอง */
    if (d.deleted || d.exportedAt || d.status === 'unreadable' || d.confirmedBy) return;
    const cs = Object.values(d.conf || {}).filter(v => v != null);
    const st = (d.issues.length || (cs.length && Math.min(...cs) < state.confMin)) ? 'flagged' : 'clean';
    if (d.status !== st) { d.status = st; n++; }
  });
  return n;
}

/* ---------- Tasks ---------- */
function scTasks() {
  /* ค้นได้จาก เลขงาน · เรื่อง · ผู้รับผิดชอบ · ผู้สั่ง · บริษัท */
  const tq = (state.taskQuery || '').trim().toLowerCase();
  const thay = t => [t.id, t.title, uname(t.assignee), uname(t.by), companyName(t.company)].join(' ').toLowerCase();
  const all = tasksScope().filter(t => !tq || thay(t).indexOf(tq) > -1);
  /* งานที่ปิดแล้วไม่ควรปนกับกองงานที่ต้องทำ — แต่ต้องยังหาเจอ เพราะเปิดงานใหม่ได้ภายใน 7 วัน
     และต้องตรวจย้อนได้ว่าใครเป็นคนกดปิด */
  const byTab = all.filter(t => state.taskTab === 'task' ? t.type === 'task' : t.type === 'approval');
  const S = {
    open: () => byTab.filter(t => t.status === 'open'),
    /* งานข้ามองค์กรที่ปิดแล้วแต่ผู้สั่งยังไม่ได้ดู — ไม่ใช่สถานะใหม่ในตาราง เป็นแค่มุมมองของ acceptedAt
       ต้องแยกให้เห็น ไม่งั้นมันจะจมอยู่ในกอง "ปิดแล้ว" แล้วไม่มีใครตรวจรับจนหมดเวลาไปเอง */
    accept: () => byTab.filter(waitAccept),
    done: () => byTab.filter(t => t.status !== 'open'),
    all: () => byTab
  };
  const list = (S[state.taskStatus] || S.open)();
  const open = all.filter(t => t.status === 'open');
  const late = open.filter(overdue), appr = all.filter(t => t.type === 'approval');
  return `
  <div class="page-head">
    <div><h1>งานและคำขอ</h1><div class="sub">Tasks Tab · ตาราง <code>tasks</code> ใช้ร่วมกัน (type = task | approval)</div></div>
    <div class="page-actions"><button class="btn primary" data-act="newtask">${ic('plus', 14)} มอบหมายงาน</button></div>
  </div>

  ${kpiRow([
      { icon: 'tasks', label: 'งานทั้งหมด', value: all.length,
        sub: state.allCos ? `รวม ${roleCompanies().length} บริษัทที่ดูแล` : 'ในบริษัทนี้' },
      { icon: 'pin', label: 'กำลังดำเนินการ', value: open.length,
        sub: S.accept().length ? `ยังไม่ปิด · อีก ${S.accept().length} ปิดแล้วรอผู้สั่งตรวจรับ` : 'ยังไม่ปิด' },
      { icon: 'alertTriangle', tone: late.length ? 'tone-warning' : '', label: 'เลยกำหนด', value: late.length,
        sub: late.length ? 'บอทเตือนตามบันได' : 'ไม่มีงานเลยกำหนด',
        trend: late.length ? '<span class="kpi-trend warn">ต้องตาม</span>' : '' },
      { icon: 'userCheck', label: 'คำขออนุมัติ', value: appr.length, sub: 'type = approval' }
    ])}

  <div class="docbar">
    <div class="chips" style="margin:0">
    <button class="chip ${state.taskTab === 'task' ? 'on' : ''}" data-tasktab="task">งาน <b>${all.filter(t => t.type === 'task').length}</b></button>
    <button class="chip ${state.taskTab === 'approval' ? 'on' : ''}" data-tasktab="approval">คำขออนุมัติ <b>${all.filter(t => t.type === 'approval').length}</b></button>
      <span class="chip-sep"></span>
      ${[['open', 'ค้างอยู่'], ['accept', 'รอตรวจรับ'], ['done', 'ปิดแล้ว'], ['all', 'ทั้งหมด']].map(([k, l]) =>
      `<button class="chip ${(state.taskStatus || 'open') === k ? 'on' : ''}" data-taskstatus="${k}">${l} <b>${S[k]().length}</b></button>`).join('')}
    </div>
    ${coFilter('taskCoSelect')}
    ${searchBox('taskSearch', state.taskQuery, 'ค้นหา เลขงาน · เรื่อง · ผู้รับผิดชอบ · ผู้สั่ง')}
  </div>
  ${tq ? `<div class="muted small" style="margin:-0.5rem 0 0.9rem">
      ค้น "<b>${esc(state.taskQuery)}</b>" เจอ ${all.length} รายการจากทั้งหมด ${tasksScope().length} ·
      <button class="linklike" data-act="clearqt">ล้างคำค้น</button></div>` : ''}

  ${can('task_assign').value === 'partial' ? `<div class="inline-lock">${ic('halfCircle', 16)}
    <div><b>ปิดงานได้เฉพาะงานที่สำนักงานตัวเองสั่ง</b> — งานที่คนในบริษัทลูกค้าสั่งกันเอง คุณเห็นและตามได้ แต่กดปิดแทนไม่ได้
    เพราะเหตุผลที่เปิดให้ "ใครในกลุ่มก็ปิดได้" เป็นเหตุผลภายในบริษัท ไม่ใช่เหตุผลข้ามองค์กร (B-13)</div></div><div class="mt-s"></div>` : ''}

  ${list.length ? list.map(t => `
    <div class="task ${t.type === 'approval' ? 'approval' : ''} ${t.status === 'done' ? 'done' : ''}">
      <div class="tmark">${t.type === 'approval' ? ic('userCheck', 18) : t.status === 'done' ? ic('checkCircle', 18) : ic('pin', 18)}</div>
      <div class="tbody">
        <h4>${esc(t.id)} · ${esc(t.title)}</h4>
        <div class="tmeta">
          ${state.allCos ? `<span class="badge info">${esc(companyName(t.company))}</span>` : ''}
          <span>ผู้รับผิดชอบ: <b>${esc(uname(t.assignee))}</b></span>
          <span>สั่งโดย: ${esc(uname(t.by))}${crossOrg(t) ? ` · ในนาม ${esc(orgName(byOrgOf(t)))}` : ''}</span>
          <span class="${overdue(t) ? 'overdue' : ''}">ครบกำหนด ${fmtD(t.due)}${overdue(t) ? ' · เลยกำหนด' : ''}</span>
          ${t.evidence ? '<span class="badge neutral">ของจริงจะขอหลักฐานตอนปิดงาน</span>' : ''}
          ${t.reminded ? `<span class="badge neutral">เตือนแล้ว ${t.reminded} ครั้ง</span>` : ''}
          ${t.autoClose ? `<span class="badge info">ตั้งใจให้ปิดเองในระบบจริง — ${esc(t.autoClose)}</span>` : ''}
          ${t.decision ? `<span class="badge ${t.decision === 'approve' ? 'clean' : 'unreadable'}">${t.decision === 'approve' ? 'อนุมัติแล้ว' : 'ปฏิเสธแล้ว'}</span>` : ''}
          ${overdue(t) ? `<span class="badge neutral">${esc(followNote(t))}</span>` : ''}
          ${t.completedBy ? `<span class="badge clean">ปิดโดย ${esc(uname(t.completedBy))} · ${esc(t.completedAt)}</span>` : ''}
          ${waitAccept(t) ? `<span class="badge flagged">รอ ${esc(orgName(byOrgOf(t)))} ตรวจรับ · เหลือ ${acceptLeft(t)} วัน แล้วถือว่ารับเอง</span>` : ''}
          ${t.acceptedAt ? `<span class="badge clean">ผู้สั่งรับงานแล้ว · ${esc(t.acceptedAt)}</span>` : ''}
          ${t.status !== 'open' && crossOrg(t) && !t.acceptedAt && acceptLeft(t) <= 0
        ? '<span class="badge neutral">พ้น 7 วัน · ถือว่าผู้สั่งรับแล้วโดยปริยาย</span>' : ''}
        </div>
        <div class="tact">
          ${t.status === 'open' ? (
        t.type === 'approval'
          ? (mayApprove(t)
            ? `<button class="btn small primary" data-approve="${t.id}">อนุมัติ</button><button class="btn small danger" data-reject="${t.id}">ปฏิเสธ</button>`
            : `<span class="muted small">รอ ${esc(uname(t.assignee))} อนุมัติ</span>`)
          : (mayClose(t)
            ? `<button class="btn small primary" data-done="${t.id}">ปิดงาน</button>`
            /* ไม่ซ่อนเงียบ ๆ — บอกไปเลยว่าใครปิดได้ ไม่งั้นนักบัญชีจะนึกว่าระบบเสีย */
            : `<span class="muted small">ปิดได้เฉพาะคนใน ${esc(orgName(t.company))}${byOrgOf(t) !== t.company ? ` หรือ ${esc(orgName(byOrgOf(t)))}` : ''}</span>`)
      ) : `
          ${mayAccept(t) ? `<button class="btn small primary" data-accept="${t.id}">ตรวจรับ</button>` : ''}
          ${mayReopen(t) ? `<button class="btn small" data-reopen="${t.id}">เปิดงานกลับ</button>`
          : '<span class="muted small">พ้นหน้าต่าง 7 วันแล้ว — เปิดกลับไม่ได้ ต้องสั่งงานใหม่</span>'}`}
        </div>
      </div>
    </div>`).join('') : '<div class="empty">ไม่มีรายการในแท็บนี้</div>'}

  <div class="card mt">
    <div class="card-head"><h3>กติกาที่ prototype นี้จำลองไว้</h3></div>
    <ul class="tight">
      <li><b>completed_by แยกจาก assignee_id</b> — ใครในกลุ่มก็กดปิดได้ แต่ระบบบันทึกว่าใครกด (ย้อนไปเติมทีหลังไม่ได้)</li>
      <li><b>ขอบเขตการปิดงานผูกกับองค์กร ไม่ใช่ตัวคน (B-13)</b> — ปิดได้ถ้าอยู่ในองค์กรเดียวกับงาน
        หรืออยู่ในองค์กรที่เป็นผู้สั่ง · นักบัญชีลาออกแล้วคนที่รับช่วงปิดงานเดิมได้เลย ไม่ต้องย้ายข้อมูล</li>
      <li><b>งานข้ามองค์กรต้องให้ผู้สั่งตรวจรับ (B-14)</b> — ลูกค้ากดเสร็จแล้วสำนักงานได้ปุ่ม
        <code>[ตรวจรับ] [เปิดงานกลับ]</code> · ไม่กดภายใน 7 วันถือว่ารับเอง — ใช้ <code>accepted_at</code> ไม่เพิ่มค่าสถานะใหม่
        (ปุ่ม "รับงาน" ในไลน์เป็นคนละเรื่อง — นั่นคือผู้รับผิดชอบกดรับงานตอนได้รับมอบหมาย)</li>
      <li><b>บันไดเตือนวิ่งหาผู้สั่ง (B-15)</b> — งานที่สำนักงานสั่งจะไม่ไปรบกวนเจ้าของบริษัทลูกค้าให้ตัดสินใจแทน
        และเตือนที่แท็บงานของสำนักงาน จึงไม่กินโควตา push ของกลุ่ม</li>
      <li><b>Auto-close</b> — งาน "กด export เดือนนี้" ปิดเองเมื่อมี export batch ของเดือนนั้น · ระบบตรวจเองแล้วจึงไม่ต้องรอใครรับ</li>
      <li><b>1 กลุ่ม = 1 push ต่อวัน</b> — เรื่องเอกสารกับเรื่องงานรวมอยู่ในข้อความเดียว</li>
    </ul>
  </div>
  ${srcline('11 (tasks · บันไดเตือน) · 12 (7.5 Task Completion) · 13 (M7 Assign in Group) · B-13 ถึง B-15 (ข้อเสนอใหม่ รอใส่กลับเข้าเอกสาร)')}`;
}

/* ---------- Export ---------- */
function scExport() {
  const list = state.exports.filter(e => e.company === state.companyId);
  const s = stats();
  const fin = can('view_financial');
  /* ตัวอย่างแถวจากเอกสารจริงในระบบ — clean / flagged / unreadable อย่างละใบ */
  const pick = st => docsOf().find(d => d.status === st);
  const sample = [pick('clean'), pick('flagged'), pick('unreadable')].filter(Boolean);
  return `
  <div class="page-head">
    <div><h1>ส่งออกเอกสาร</h1><div class="sub">Export Center · โมดูล 5 — โมดูลเดียวที่มีต้นแบบใช้งานได้แล้ว</div></div>
    <div class="page-actions"><button class="btn primary" data-act="doexport">${ic('upload', 14)} สร้างชุดส่งออกใหม่ (${s.notExported} ใบ)</button></div>
  </div>

  ${kpiRow([
      { icon: 'checkCircle', tone: 'tone-success', label: 'ส่งออกแล้ว', value: s.total - s.notExported, sub: 'มี export_batch_id' },
      { icon: 'upload', tone: s.notExported ? 'tone-warning' : '', label: 'ยังไม่ส่งออก', value: s.notExported, sub: 'รอสร้างชุดใหม่' },
      { icon: 'file', label: 'ชุดส่งออกทั้งหมด', value: list.length, sub: 'ของบริษัทนี้' },
      fin.ok
        ? { icon: 'money', label: 'ยอดรวมทั้งหมด', value: money(s.amount) + ' ฿', sub: `ภาษีซื้อรวม ${money(s.vat)} ฿ · ทุกใบของบริษัทนี้ ไม่กั้นเดือน` }
        : { icon: 'lock', tone: 'masked', label: 'ยอดรวมทั้งหมด', value: '••••••', sub: fin.reason }
    ])}

  <div class="dash-2">
    <div class="card">
      <div class="card-head">
        <div>
          <h3>ตัวอย่างไฟล์ที่จะได้</h3>
          <div class="muted small">เปิดไฟล์แล้วจะเห็นแบบนี้</div>
        </div>
        <span class="badge neutral">.xlsx</span>
      </div>

      <div class="sheet-tabs">
        <span class="sheet on">รายการเอกสาร</span>
        <span class="sheet">สรุป</span>
      </div>

      <div class="tablewrap xl-preview">
        <table>
          <thead><tr>
            <th>วันที่</th><th>ชื่อผู้ขาย</th><th>เลขผู้เสียภาษี</th>
            <th class="num">ยอดรวม</th><th>สถานะ</th><th>สิ่งที่ต้องตรวจ</th><th>รูปต้นฉบับ</th>
          </tr></thead>
          <tbody>
          ${sample.map(d => `<tr class="${d.status === 'flagged' ? 'row-flagged' : d.status === 'unreadable' ? 'row-unreadable' : ''}">
            <td class="nowrap">${fmtExp(d.date)}</td>
            <td>${esc(d.vendor)}</td>
            <td class="nowrap">${esc(d.taxId)}</td>
            <td class="num">${fin.ok ? money(d.total) : '<span class="masked">••••</span>'}</td>
            <td>${statusBadge(d.status)}</td>
            <td class="small muted">${esc((d.issues[0] || {}).msg || '—')}</td>
            <td class="nowrap"><span class="drive-link">${ic('paperclip', 11)} เปิดรูป</span></td>
          </tr>`).join('')}
          </tbody>
        </table>
      </div>

      <ul class="tight">
        <li><span class="badge flagged">แถวเหลือง</span> = ต้องตรวจ · <span class="badge unreadable">แถวแดง</span> = อ่านไม่ออก — เปิดไฟล์แล้วรู้ทันทีว่าดูแถวไหนก่อน</li>
        <li>คอลัมน์ <b>รูปต้นฉบับ</b> กดจากใน Excel แล้วเปิดรูปใน Google Drive ได้เลย</li>
        <li>ชีต <b>สรุป</b> — ข้อมูลกิจการ · จำนวนเอกสารแยกสถานะ · ยอดแยกตามหมวด สำหรับกระทบยอด</li>
        <li>มี auto-filter และแถวรวมท้ายตารางที่เป็นสูตร SUM จริง</li>
      </ul>
    </div>

    <div class="card">
      <div class="card-head">
        <div>
          <h3>PDF ใบตรวจ</h3>
          <div class="muted small">สำหรับตรวจ ส่งต่อ และเก็บหลักฐาน</div>
        </div>
        <span class="badge neutral">.pdf</span>
      </div>

      <div class="pdf-preview">
        <div class="pdf-page">
          <b>หน้า 1 — ใบปะหน้า</b>
          <div class="pp-line w80"></div><div class="pp-line w60"></div>
          <div class="pp-rows"><i></i><i></i><i></i><i></i></div>
          <span>ยอดรวม · ภาษีซื้อรวม · จำนวนเอกสารแยกสถานะ + ตารางรายการทั้งหมด</span>
        </div>
        <div class="pdf-page">
          <b>หน้า 2 เป็นต้นไป — หน้าละ 1 ใบ</b>
          <div class="pp-split"><div class="pp-img">${ic('receipt', 18)}</div><div><div class="pp-line w90"></div><div class="pp-line w70"></div><div class="pp-line w80 warn"></div></div></div>
          <span>รูปต้นฉบับคู่กับข้อมูลที่ระบบอ่านได้ · ฟิลด์ที่ไม่มั่นใจเป็นสีแดง + กล่องเหลืองบอกสิ่งที่ต้องตรวจ</span>
        </div>
      </div>
    </div>
  </div>

  <div class="card mt">
    <div class="card-head"><h3>ประวัติชุดส่งออก</h3><span class="hint">export_batch_id · exported_at</span></div>
    <div class="tablewrap">
      <table>
        <thead><tr><th>ชุด</th><th>งวด</th><th class="num">จำนวน</th><th>ผู้ส่งออก</th><th>เวลา</th><th>ไฟล์</th></tr></thead>
        <tbody>
        ${list.length ? list.map(e => `<tr>
          <td class="nowrap"><b>${esc(e.id)}</b></td><td class="nowrap">${esc(e.period)}</td>
          <td class="num">${e.count}</td><td class="nowrap">${esc(uname(e.by))}</td>
          <td class="nowrap">${esc(e.at)}</td>
          <td>${e.files.map(f => `<div class="small">${ic('paperclip', 12)} ${esc(f)}</div>`).join('')}</td>
        </tr>`).join('') : '<tr><td colspan="6"><div class="empty">ยังไม่มีชุดส่งออก</div></td></tr>'}
        </tbody>
      </table>
    </div>
  </div>
  ${can('tenant_admin').ok ? `
  <div class="card mt">
    <div class="card-head">
      <h3>${ic('shieldCheck', 15)} หมายเหตุสำหรับทีมพัฒนา</h3>
      <span class="hint">เห็นเฉพาะเจ้าของระบบ</span>
    </div>
    <p class="small muted" style="margin:0 0 0.5rem">กับดักที่แก้ไว้แล้วใน 09-export-module-spec.md — อย่าถอยกลับ</p>
    <ul class="tight">
      <li>ใช้ <code>.xlsx</code> เท่านั้น ไม่ใช้ <code>.csv</code> (ถ้าจำเป็นต้อง CSV ต้อง UTF-8 with BOM)</li>
      <li>เลขผู้เสียภาษีบังคับ <code>number_format = "@"</code> กัน 0 นำหน้าหาย</li>
      <li>ตัวเลขเขียนเป็น <code>float</code> จริง + <code>number_format = "#,##0.00"</code></li>
      <li>PDF ต้องใช้ <b>Noto Sans Thai</b> — ฟอนต์ตระกูล tlwg ทำวรรณยุกต์หลุดบรรทัดใน Chromium</li>
      <li>ใส่ <code>&lt;html lang="th"&gt;</code> กันตัดคำไทยผิด · บีบขนาดรูปก่อนฝัง</li>
    </ul>
  </div>` : ''}
  ${srcline('09-export-module-spec.md (โครงสร้าง Excel/PDF · กับดักภาษาไทย 5 ข้อ)')}`;
}

function doExport() {
  const pending = docsOf().filter(needsExport);
  if (!pending.length) { toast('ไม่มีเอกสารที่ยังไม่ส่งออก'); return; }
  /* ใบที่ยังไม่ได้ตรวจถูกส่งออกไปด้วยโดยตั้งใจ (ทำสีในไฟล์ให้เห็น) — แต่ต้องบอกก่อน ไม่ใช่เงียบ ๆ
     สำนักงานจะได้เลือกได้ว่าจะตรวจให้จบก่อน หรือส่งไปเลยแล้วตามแก้ทีหลัง */
  const unchecked = pending.filter(d => d.status !== 'clean');
  if (unchecked.length && !state.exportAck) {
    state.exportAck = true;
    toast(`ชุดนี้มีใบที่ยังไม่ได้ตรวจ ${unchecked.length} ใบ`, 'err',
      `จะถูกส่งออกไปด้วยและทำสีไว้ในไฟล์ (เหลือง = ต้องตรวจ · แดง = อ่านไม่ออก) — กด "สร้างชุดส่งออกใหม่" อีกครั้งเพื่อยืนยัน หรือไปเคลียร์ให้จบก่อนที่หน้าเอกสาร`);
    render(); return;
  }
  state.exportAck = false;
  /* รหัสต้องมีตัวบริษัทอยู่ด้วย ไม่งั้นบริษัทที่ยังไม่เคยส่งออกจะได้ EXP-2608-01 ชนกับบริษัทอื่น */
  const n = state.exports.filter(e => e.company === state.companyId).length + 1;
  const id = `EXP-2608-${state.companyId.toUpperCase()}${String(n).padStart(2, '0')}`;
  const at = nowStamp();
  const short = company().name.replace(/[^ก-๙A-Za-z0-9]/g, '');
  /* ส่งออกซ้ำแล้วธงต้องหาย แต่ต้องเหลือร่องรอยว่าใบไหนเคยอยู่ชุดไหน จึงเก็บลงประวัติการใช้งานก่อนทับ batch */
  const redo = pending.filter(d => d.staleExport).map(d => `${d.id} เดิมอยู่ ${d.staleExport.batch}`);
  pending.forEach(d => { d.exportedAt = at; d.batch = id; d.staleExport = null; });
  /* ชุดนี้กวาดใบที่ยังไม่ส่งออก "ทุกวันที่" มารวมกัน งวดจึงต้องคิดจากใบที่อยู่ในชุดจริง ไม่ใช่ฝังเดือนเดียวไว้ */
  const ds = pending.map(d => d.date).sort();
  const lo = ds[0], hi = ds[ds.length - 1];
  const moTh = s => TH_MON[+s.slice(5, 7) - 1] + ' ' + (+s.slice(0, 4) + 543);
  const period = moTh(lo) === moTh(hi) ? moTh(lo) : `${moTh(lo)}–${moTh(hi)}`;
  const tag = lo.slice(0, 7) === hi.slice(0, 7) ? lo.slice(0, 7) : `${lo.slice(0, 7)}_${hi.slice(0, 7)}`;
  state.exports.unshift({
    id, company: state.companyId, period, count: pending.length, by: meId(), at,
    files: [`ChapWai_${short}_${tag}_documents.xlsx`, `ChapWai_${short}_${tag}_review.pdf`]
  });
  const auto = tasksOf().find(t => t.status === 'open' && /export|ส่งออก/i.test(t.title));
  /* auto-close ไม่ต้องรอใครตรวจรับ — ระบบเห็นหลักฐานเองแล้วว่าชุดส่งออกถูกสร้างจริง
     ตั้ง acceptedAt ไปพร้อมกันเลย ไม่งั้นงานที่ระบบปิดเองจะไปกองรอมนุษย์กดรับโดยไม่จำเป็น */
  if (auto) { auto.status = 'done'; auto.completedBy = meId(); auto.completedAt = at; auto.acceptedAt = at; }
  logAudit(`สร้างชุดส่งออก ${id} (${pending.length} ใบ)`, redo.join(' · '), 'exported_at ถูกเซ็ต');
  toast(`สร้างชุดส่งออก ${id} แล้ว`, 'ok', auto ? `ปิดงาน ${auto.id} อัตโนมัติ (Auto-close)` : `${pending.length} ใบ · ไฟล์ .xlsx + .pdf`);
  render();
}

/* ---------- นำเข้าข้อมูลเดิม ----------
   ลูกค้าที่ย้ายมาจากระบบเดิมมีเอกสารเก่าค้างอยู่แล้ว ถ้าเริ่มนับศูนย์ ยอดย้อนหลังจะไม่ตรงกับบัญชีที่ทำไว้
   การนำเข้าจึงเป็นงานวันแรกของทุกลูกค้า ไม่ใช่ฟีเจอร์เสริม */
const DRIVE_TH = {
  linked: { th: 'เชื่อมต่อแล้ว', badge: 'clean' },
  expired: { th: 'ต้องเชื่อมใหม่', badge: 'flagged' },
  full: { th: 'พื้นที่เต็ม', badge: 'unreadable' },
  none: { th: 'ยังไม่ได้ผูก', badge: 'neutral' }
};
const driveOf = co => DRIVE_TH[co.driveState || 'none'];
/* เตือนก่อนเต็ม ไม่ใช่รอให้เต็มแล้วค่อยบล็อก — เอกสาร 10:55 กับ 11:41 (Quota Guard) สั่งไว้ว่าต้องมี */
const DRIVE_WARN = 0.85;
function driveBar(co) {
  const pct = Math.min(100, Math.round((co.driveUsed / co.driveQuota) * 100));
  const near = co.driveUsed / co.driveQuota >= DRIVE_WARN;
  return `
    <div class="dbar-wrap">
      <div class="dbar"><i class="${near ? 'warn' : ''}" style="width:${pct}%"></i></div>
      <div class="dbar-cap">
        <span>ใช้ไป ${co.driveUsed} GB จาก ${co.driveQuota} GB (${pct}%)</span>
        ${near ? `<b class="warn">${co.driveState === 'full' ? 'เต็มแล้ว' : 'ใกล้เต็ม'}</b>` : ''}
      </div>
      <p class="muted" style="font-size:.7rem;margin:.35rem 0 0">
        เป็นพื้นที่ของ<b>ทั้งบัญชี Google</b> ไม่ใช่เฉพาะโฟลเดอร์ของเรา — Gmail และ Google Photos กินพื้นที่ก้อนเดียวกันนี้
        ตัวเลขนี้จึงขยับได้แม้เราไม่ได้เขียนไฟล์อะไรเลย</p>
    </div>`;
}
const driveReady = co => (co.driveState || 'none') === 'linked';

/* หมวดที่ลูกค้าใช้อยู่แล้วในไฟล์เดิม — เป็นหลักฐานว่าธุรกิจนี้มีค่าใช้จ่ายอะไรจริง ๆ
   ดีกว่าให้เจ้าของนั่งไล่ปิดสวิตช์เอาเองจากความจำ
   สามผลลัพธ์: จับคู่ได้ · ผังสำนักงานไม่มี (ต้องให้สำนักงานตัดสิน) · ผังมีแต่ไฟล์ไม่เคยใช้ (เสนอปิด) */
function importCatCard(src) {
  if (!src || !src.catMap) return '';
  const hit = src.catMap.filter(m => m.to);
  const miss = src.catMap.filter(m => !m.to);
  const used = new Set(hit.map(m => m.to));
  /* หมวดในผังที่ไฟล์ลูกค้าไม่เคยใช้เลย — ไม่นับที่สำนักงานระงับไปแล้ว และไม่นับที่บริษัทปิดไปแล้ว */
  const unused = catsOf().filter(c => !used.has(c) && !catIsOff(c) && !catIsCoOff(c));
  return `
  <div class="card mt">
    <div class="card-head">
      <div><h3>${ic('receipt', 15)} หมวดที่ลูกค้าใช้อยู่แล้วในไฟล์นี้</h3>
        <div class="muted small">ไม่ต้องตั้งหมวดใหม่จากศูนย์ — ของจริงจะอ่านจากไฟล์เดิมแล้วจับคู่เข้ากับผังของสำนักงานให้ ·
          <b>ผังที่เห็นตอนนี้เป็นชุดตัวอย่างเดียวกันทุกบริษัท</b> ยังไม่ได้อ่านไฟล์ของลูกค้ารายนี้จริง</div></div>
      <span class="badge ${miss.length ? 'flagged' : 'clean'}">${hit.length} จับคู่ได้ · ${miss.length} ยังไม่มีในผัง</span>
    </div>

    <table class="tbl">
      <thead><tr><th>ชื่อหมวดในไฟล์ของลูกค้า</th><th class="num">แถว</th><th>จะเข้าหมวดไหนในระบบ</th></tr></thead>
      <tbody>
        ${src.catMap.map(m => `
          <tr class="${m.to ? '' : 'row-flagged'}">
            <td>${esc(m.from)}</td>
            <td class="num">${m.rows}</td>
            <td>${m.to
      ? `${ic('arrowRight', 11)} ${esc(m.to)}${m.from === m.to ? '' : ' <span class="muted small">(เปลี่ยนชื่อให้ตรงผัง)</span>'}`
      : `<span class="warn">ผังสำนักงานยังไม่มีหมวดนี้</span>`}</td>
          </tr>`).join('')}
      </tbody>
    </table>

    ${miss.length ? `
    <div class="issue mt">${ic('alertTriangle', 15)}
      <b>ผังสำนักงานยังไม่มี ${miss.length} หมวดที่ลูกค้าใช้จริง</b> —
      ${miss.map(m => `"${esc(m.from)}" (${m.rows} แถว)`).join(' · ')}
      <br>ถ้าไม่เพิ่ม แถวเหล่านี้จะตกลงมาที่ "${esc(UNCAT)}" แล้วต้องมาไล่จัดเองทีหลัง
      ${can('office_settings').ok
      ? ' — คุณเพิ่มเข้าผังได้เลยที่หน้าตั้งค่า'
      : ' — เจ้าของกิจการเพิ่มเองไม่ได้ ต้องให้สำนักงานเป็นคนเพิ่ม'}
      <div class="mt"><button class="btn small" data-act="askcat">${ic('chat', 13)} ${can('office_settings').ok ? 'ไปเพิ่มที่หน้าตั้งค่า' : 'แจ้งสำนักงานให้เพิ่มหมวดเหล่านี้'}</button></div>
    </div>` : ''}

    ${unused.length ? `
    <div class="sinfo mt">
      <b>อีก ${unused.length} หมวดในผัง ไฟล์ของลูกค้าไม่เคยใช้เลย</b>
      <p>${unused.map(esc).join(' · ') } — น่าจะเป็นค่าใช้จ่ายที่ธุรกิจนี้ไม่มี ปิดไว้ก่อนได้
      เปิดคืนเมื่อไรก็ได้ที่หน้าตั้งค่าบริษัท</p>
      <div class="mt"><button class="btn small ${can('company_settings').ok ? 'primary' : ''}" data-act="catsuggest">
        ${ic('check', 13)} ปิดทั้ง ${unused.length} หมวดนี้ให้ ${esc(company().name)}</button></div>
    </div>` : ''}
  </div>`;
}

function scImport() {
  const co = company();
  const ready = driveReady(co);
  const src = IMPORT_SOURCES.find(s => s.id === state.importSrc) || null;
  const done = (state.imports || []).filter(i => i.company === state.companyId);
  const rate = state.bahtPerPage;

  return `
  <div class="page-head">
    <div><h1>ย้ายเอกสารเก่าเข้าระบบ</h1><div class="sub">ของที่ลูกค้าเก็บไว้ก่อนมาใช้ Chap Wai — ย้ายเข้ามาให้ยอดเดือนก่อน ๆ ตรงกัน · เจ้าของกิจการเป็นผู้จ่ายค่าอ่าน</div></div>
    ${can('drive_link').ok ? `<div class="page-actions"><button class="btn" data-nav="settings">${ic('settings', 14)} ตั้งค่า Drive</button></div>` : ''}
  </div>

  ${ready ? '' : `<div class="issue">${ic('alertTriangle', 15)}<b>ยังนำเข้าไม่ได้</b> — Drive ของ ${esc(co.name)} สถานะ "${esc(driveOf(co).th)}" ระบบต้องมีที่เก็บไฟล์ปลายทางก่อนถึงจะรับของเก่าเข้ามาได้ ${can('drive_link').ok ? 'ไปที่หน้าตั้งค่าเพื่อผูก Drive ก่อน' : 'การผูก Drive เป็นสิทธิ์ระดับ 2b ของเจ้าของกิจการ — คุณผูกเองไม่ได้ ต้องให้เจ้าของกิจการเป็นคนกด'}</div>`}

  ${kpiRow([
      { icon: 'inbox', label: 'ไฟล์ที่พบ', value: src ? src.files : '—', sub: src ? esc(src.name) : 'ยังไม่ได้เลือกที่มา' },
      { icon: 'checkCircle', tone: src ? 'tone-success' : '', label: 'นำเข้าได้', value: src ? src.readable : '—',
        sub: src ? `ซ้ำกับที่มีอยู่แล้ว ${src.dup} ใบ` : 'เลือกที่มาก่อน' },
      { icon: 'file', label: 'หน้าที่ต้องอ่าน', value: src ? src.pages : '—',
        sub: src && src.pages === 0 ? 'ไฟล์ตาราง ไม่ต้องเรียกโมเดล' : 'คิดค่าอ่านตามจำนวนหน้า' },
      { icon: 'money', tone: src && src.pages ? 'tone-warning' : '', label: 'ค่าอ่านที่จะเกิด',
        value: src ? money(src.pages * rate) + ' ฿' : '—', sub: `อัตรา ${money(rate)} บาท/หน้า` }
    ])}

  ${tableHead('คุณมีของเก่าแบบไหนอยู่ในมือ', 'เลือกได้ทีละอย่าง · ทำหลายรอบได้')}
  <div class="issue info">${ic('alertTriangle', 15)}<b>ตัวเลขในการ์ดข้างล่างเป็นชุดตัวอย่าง ไม่ใช่ผลสแกน Drive ของ ${esc(co.name)}</b> —
    ยังไม่มีตัวสแกนรายบริษัท ทุกบริษัทจึงเห็นเลขชุดเดียวกัน · ของจริงต้องสแกนโฟลเดอร์ของลูกค้ารายนั้นก่อน ถึงจะบอกได้ว่ามีกี่ไฟล์กี่หน้า</div>
  ${IMPORT_GROUPS.map(g => `
    <div class="impgroup">
      <div class="impgroup-head"><b>${esc(g.title)}</b><span>${esc(g.sub)}</span></div>
      <div class="impgrid">
        ${IMPORT_SOURCES.filter(s => s.group === g.id).map(s => `
          <div class="card${state.importSrc === s.id ? ' card-sel' : ''}">
            <div class="card-head"><h3>${ic(s.icon, 15)} ${esc(s.name)}</h3></div>
            <p class="small muted" style="margin:0 0 .6rem">${esc(s.detail)}</p>
            <div class="sum-row"><span>ไฟล์ที่พบ</span><b>${s.files}</b></div>
            <div class="sum-row"><span>นำเข้าได้</span><b>${s.readable} ใบ</b></div>
            <div class="sum-row"><span>ใบที่เคยเข้าระบบไปแล้ว</span><b>${s.dup}</b></div>
            <div class="sum-row"><span>ค่าอ่าน</span><b>${s.pages ? money(s.pages * rate) + ' ฿' : 'ไม่มี'}</b></div>
            <div class="muted" style="font-size:.7rem;margin:.5rem 0 .7rem">${esc(s.note)}</div>
            <button class="btn small ${state.importSrc === s.id ? 'primary' : ''}" data-act="pickimport:${s.id}">
              ${state.importSrc === s.id ? 'เลือกอยู่' : 'เลือกอันนี้'}</button>
          </div>`).join('')}
      </div>
    </div>`).join('')}

  ${src ? `
  <div class="card mt">
    <div class="card-head">
      <div><h3>ตรวจก่อนนำเข้า — ${esc(src.name)}</h3>
        <div class="muted small">หน้านี้ = ไฟล์ที่ <b>ยังไม่เคยเข้าระบบ</b> · ส่วน "อ่านย้อนหลัง" ในไลน์ = ไฟล์ที่ส่งเข้ากลุ่มไปแล้วแต่ยังไม่ได้ให้ AI อ่าน — คนละกอง แต่คิดอัตราเดียวกัน</div></div>
      <span class="badge ${src.pages ? 'flagged' : 'clean'}">${src.pages ? money(src.pages * rate) + ' ฿' : 'ไม่มีค่าอ่าน'}</span>
    </div>
    <div class="sum-row"><span>จะเข้าคิวอ่านเป็นเอกสาร</span><b>${src.readable} ใบ</b></div>
    <div class="sum-row"><span>ข้ามเพราะเคยเข้าระบบไปแล้ว</span><b>${src.dup} ใบ</b></div>
    <div class="sum-row"><span>เก็บไฟล์ไว้ให้ แต่ AI อ่านไม่ออก</span><b>${Math.max(0, src.files - src.readable - src.dup)} ไฟล์</b></div>
    <div class="hr"></div>
    <div class="sum-row"><span>ปลายทาง</span><b>${esc(co.drive)}/_นำเข้าจากระบบเดิม/</b></div>
    <div class="mt" style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn primary" data-act="${ready ? 'doimport' : 'deny:upload'}">${ic('inbox', 14)} ตั้งคิวนำเข้า ${src.readable} ใบ</button>
      <button class="btn" data-act="pickimport:">ยกเลิกการเลือก</button>
    </div>
  </div>
  ${importCatCard(src)}` : ''}

  ${done.length ? `
  ${tableHead('คิวนำเข้าที่ตั้งไว้', done.length + ' ครั้ง')}
  <div class="issue info">${ic('alertTriangle', 15)}<b>คิวเหล่านี้ยังไม่ถูกประมวลผลใน prototype นี้</b> —
    ยังไม่มีเอกสารเข้าทะเบียนจากการนำเข้า ตัวเลข "เอกสารเดือนนี้" · "รอตรวจ" และ "อ่านสะสม" จึงยังไม่ขยับตาม</div>
  <div class="tablewrap">
    <table>
      <thead><tr><th>ชุด</th><th>ที่มา</th><th class="num">รอประมวลผล</th><th class="num">ข้ามเพราะซ้ำ</th><th class="num">ค่าอ่านที่จะเกิด</th><th>เมื่อ</th></tr></thead>
      <tbody>
      ${done.map(i => `<tr>
        <td><b>${esc(i.id)}</b></td><td>${esc(i.src)}</td>
        <td class="num">${i.n} ใบ <span class="badge neutral">รอคิว</span></td><td class="num">${i.dup}</td>
        <td class="num">${i.cost ? money(i.cost) + ' ฿' : '—'}</td>
        <td class="nowrap small muted">${esc(i.at)}</td>
      </tr>`).join('')}
      </tbody>
    </table>
  </div>` : ''}

  <div class="card mt">
    <div class="card-head"><h3>ทำไมต้องมีขั้นตอนนี้</h3></div>
    <ul class="tight">
      <li><b>ยอดย้อนหลังต้องตรง</b> — ลูกค้าที่ทำบัญชีมาแล้วครึ่งปี ถ้าเริ่มนับศูนย์ ตัวเลขในระบบจะไม่ตรงกับงบที่ยื่นไปแล้ว</li>
      <li><b>กันซ้ำด้วย file_hash</b> — ไฟล์เดิมที่เคยส่งเข้ากลุ่มไลน์แล้วจะไม่ถูกนับซ้ำ ใช้กติกาเดียวกับตอนรับไฟล์ปกติ</li>
      <li><b>ไฟล์ตารางไม่มีค่าอ่าน</b> — Excel และไฟล์จากโปรแกรมบัญชีเป็นข้อความอยู่แล้ว ไม่ต้องเรียกโมเดล แต่แลกมาด้วยการไม่มีภาพต้นฉบับแนบ</li>
      <li><b>ต้องผูก Drive ก่อน</b> — ระบบไม่รับของเก่าเข้ามาถ้ายังไม่มีที่เก็บปลายทาง ไม่งั้นไฟล์จะค้างใน staging แล้วหมดอายุ</li>
    </ul>
  </div>
  ${srcline('08 (โครงสร้าง Drive · file_hash กันซ้ำ) · 10 (ข้อมูลที่ต้องขอจากลูกค้า) · 12 (งานติดตั้งลูกค้าใหม่)')}`;
}

/* ---------- Members ---------- */
function scMembers() {
  const list = membersOf();
  const grant = can('role_grant');
  const isNew = list.filter(m => m.isNew);
  return `
  <div class="page-head">
    <div><h1>สมาชิกและสิทธิ์</h1><div class="sub">Member Manager · ตาราง <code>group_members</code> + role</div></div>
  </div>

  ${kpiRow([
      { icon: 'users', label: 'สมาชิกในกลุ่ม', value: list.length, sub: 'จากตาราง group_members' },
      { icon: 'store', label: 'เจ้าของกิจการ', value: list.filter(m => m.role === 'owner').length, sub: 'ผู้ถือสิทธิ์ 2b' },
      { icon: 'calculator', label: 'ทีมสำนักงาน', value: list.filter(m => m.role === 'accountant' || m.role === 'office_admin').length, sub: 'นักบัญชี + หัวหน้า' },
      { icon: 'bell', tone: isNew.length ? 'tone-warning' : '', label: 'เข้าใหม่', value: isNew.length,
        sub: isNew.length ? 'ระบบแจ้งเจ้าของแล้ว' : 'ไม่มีคนเข้าใหม่' }
    ])}

  ${isNew.length ? `<div class="issue">${ic('bell', 15)}<b>New Member Alert</b> — มีสมาชิกใหม่เข้ากลุ่ม: ${isNew.map(m => esc(m.name)).join(' · ')} · ระบบแจ้งเจ้าของทุกครั้งที่มีคนเข้า/ออก</div>` : ''}

  ${tableHead('รายชื่อสมาชิก', list.length + ' คน')}
  <div class="tablewrap">
    <table>
      <thead><tr><th>ชื่อในกลุ่ม</th><th>line_user_id</th><th>บทบาท</th><th>เข้ากลุ่มครั้งแรก</th><th>ใช้งานล่าสุด</th><th>เปลี่ยนสิทธิ์</th></tr></thead>
      <tbody>
      ${list.map(m => `<tr>
        <td>${esc(m.name)} ${m.isNew ? '<span class="badge orange">ใหม่</span>' : ''}</td>
        <td class="nowrap"><code>${esc(m.line)}</code></td>
        <td><span class="badge ${m.role === 'owner' ? 'unreadable' : m.role === 'member' ? 'neutral' : 'info'}">${esc(ROLES[m.role].th)} · ${esc(m.role)}</span></td>
        <td class="nowrap">${fmtD(m.first)}</td>
        <td class="nowrap">${esc(m.last)}</td>
        <td>
          ${grant.ok
      ? `<select class="field" data-setrole="${m.id}">
                ${ROLE_ORDER.map(r => `<option value="${r}" ${m.role === r ? 'selected' : ''}>${ROLES[r].th}</option>`).join('')}
               </select>`
      : `<button class="btn small" data-askrole="${m.id}">${ic('userCheck', 13)} ขออนุมัติจากเจ้าของ</button>
             <button class="btn small outline" data-act="deny:role_grant">เปลี่ยนสิทธิ์เอง</button>`}
        </td>
      </tr>`).join('')}
      </tbody>
    </table>
  </div>

  <div class="card mt">
    <div class="card-head"><h3>ทำไมต้องมีตารางนี้</h3><span class="hint">กับดัก 1.9 Member Directory</span></div>
    <p class="small muted" style="margin:0">บอทเปิดดูรายชื่อสมาชิกกลุ่มเองไม่ได้ — ได้ <code>userId</code> จาก 3 ทางเท่านั้น (คนพิมพ์ · ถูก mention · event เข้า/ออกกลุ่ม) ถ้าไม่เก็บ <code>group_members</code> ไว้เอง โมดูล 7 จะมอบหมายงานให้ใครไม่ได้เลย</p>
  </div>

  ${grant.ok ? '' : `<div class="inline-lock mt">${ic('lock', 16)} <div><b>ให้/ถอน role เป็นสิทธิ์ระดับ 2b</b> — ${esc(grant.reason)}<br>บทบาทที่ไม่มีสิทธิ์ยังกด "ขออนุมัติ" ได้ ระบบจะสร้างรายการใน <code>tasks</code> แบบ <code>type = approval</code> ส่งให้เจ้าของ</div></div>`}
  ${srcline('11 (group_members · 5 บทบาท) · 12 (1.9 Member Directory) · 15 (Member Manager)')}`;
}

/* ---------- Settings ---------- */
function scSettings() {
  const co = company();
  const cs = can('company_settings');
  const os = can('office_settings');
  const ta = can('tenant_admin');

  return `
  <div class="page-head">
    <div><h1>ตั้งค่า</h1><div class="sub">Office Settings · การตั้งค่าระดับบริษัท / สำนักงาน / tenant</div></div>
  </div>

  ${kpiRow([
      { icon: 'store', label: 'บริษัทที่กำลังตั้งค่า', value: `<span class="kpi-sm">${esc(co.name)}</span>`, sub: `tenant ${esc(co.tenant)}` },
      { icon: co.financial_visibility ? 'checkCircle' : 'lock', tone: co.financial_visibility ? 'tone-success' : 'tone-warning',
        label: 'financial_visibility', value: `<span class="kpi-sm">${co.financial_visibility ? 'เปิด' : 'ปิด'}</span>`,
        sub: co.financial_visibility ? 'สมาชิกกลุ่มเห็นยอดสรุป' : 'สมาชิกกลุ่มไม่เห็นยอดสรุป' },
      { icon: 'chat', label: 'เวลาสรุปประจำวัน', value: `<span class="kpi-sm">${esc(co.digest_time)}</span>`, sub: '1 กลุ่ม = 1 push ต่อวัน' },
      { icon: 'upload', tone: driveReady(co) ? '' : 'tone-warning', label: 'โฟลเดอร์ Drive',
        value: `<span class="kpi-sm">${esc(driveOf(co).th)}</span>`, sub: esc(co.drive) }
    ])}

  ${cs.ok ? `
  <div class="card">
    <div class="card-head"><h3>ตั้งค่าบริษัท — ${esc(co.name)}</h3><span class="hint">ระดับ 2b · เจ้าของเท่านั้น</span></div>
      <div class="setrow">
        <div class="sinfo"><b>financial_visibility</b><p>ให้สมาชิกกลุ่มเห็นยอดสรุป / ภาษีซื้อรวม / ส่งออกได้หรือไม่ — ค่าเริ่มต้นคือเปิด (B-10)</p></div>
        <button class="toggle ${co.financial_visibility ? 'on' : ''}" data-act="togglefv"><i></i></button>
      </div>
      <div class="setrow" style="display:block">
        <div class="sinfo" style="margin-bottom:.7rem">
          <b>หมวดค่าใช้จ่ายที่บริษัทนี้ใช้</b>
          <p>ผังกลางตั้งโดยสำนักงาน คุณเพิ่มหรือลบเองไม่ได้ เพราะไฟล์ที่ส่งเข้าโปรแกรมบัญชีต้องตรงกันทุกราย ·
          แต่หมวดที่ธุรกิจของคุณไม่มี <b>ปิดเองได้</b> — โรงงานมีค่าขนส่ง ร้านอาหารไม่มี ก็ไม่ต้องเห็นมันในรายการ ·
          ปิดแล้วใบใหม่จะไม่ถูกจัดเข้าหมวดนี้ และ <b>AI ก็จะไม่เห็นตัวเลือกนี้ตอนอ่านใบด้วย ทำให้จัดหมวดแม่นขึ้น</b> ·
          ใบเก่าที่อยู่ในหมวดนั้นแล้วยังอยู่เหมือนเดิม ไม่มีอะไรหาย</p>
        </div>
        <div class="catlist">
          ${catsOf().map(c => {
      const tOff = catIsOff(c), off = catIsCoOff(c), n = catCountCo(c);
      return `<div class="catrow${tOff || off ? ' catoff' : ''}">
              <span class="cat-nm">${esc(c)}</span>
              <span class="muted small nowrap">${n ? `${n} ใบ` : 'ยังไม่มีใบ'}</span>
              ${tOff
          ? '<span class="badge neutral nowrap">สำนักงานเลิกใช้แล้ว</span>'
          : `<button class="toggle ${off ? '' : 'on'}" data-catco="${esc(c)}" aria-label="${off ? 'เปิด' : 'ปิด'}หมวด ${esc(c)}"><i></i></button>`}
            </div>`;
    }).join('')}
        </div>
      </div>
      <div class="setrow">
        <div class="sinfo"><b>digest_time</b><p>เวลาส่งสรุปประจำวัน — 1 กลุ่ม = 1 push ต่อวัน เพราะ push นับโควตา LINE</p></div>
        <select class="field" data-act="digest">
          ${(() => {
      const opts = ['07:30', '08:00', '08:30', '09:00'];
      /* พ่วงค่าปัจจุบันเข้าไปเสมอ ไม่งั้นบริษัทที่ตั้งเวลานอกลิสต์จะเห็น select ชี้ค่าอื่น แล้วเผลอเปลี่ยนทิ้งโดยไม่รู้ตัว */
      if (opts.indexOf(co.digest_time) < 0) opts.push(co.digest_time);
      return opts.sort().map(t => `<option ${co.digest_time === t ? 'selected' : ''}>${esc(t)}</option>`).join('');
    })()}
        </select>
      </div>
      <div class="setrow">
        <div class="sinfo"><b>กลุ่มไลน์ที่ผูกไว้</b><p>${esc(co.group)} — Group Setup (ผูก/ยกเลิกเป็นสิทธิ์ 2b)</p></div>
        <button class="btn small danger" data-act="${can('bind_group').ok ? 'unbind' : 'deny:bind_group'}">ยกเลิกการผูก</button>
      </div>
      <div class="setrow">
        <div class="sinfo"><b>โฟลเดอร์ Drive ปลายทาง</b>
          <p>${esc(co.drive)} — ซิงก์ทางเดียว Drive เป็นชั้นรอง ไม่ใช่ที่เก็บหลัก<br>
          ${co.driveState === 'none'
      ? 'ยังไม่ได้ผูกบัญชี — ไฟล์จะพักอยู่ฝั่งระบบและหมดอายุตามกำหนด'
      : `บัญชี <code>${esc(co.driveAcct)}</code>`}
          ${co.driveState === 'expired' ? '<br>refresh token ถูกเพิกถอน ระบบเขียนไฟล์ไม่ได้จนกว่าจะเชื่อมใหม่' : ''}
          ${co.driveState === 'full' ? '<br>พื้นที่เต็ม เขียนไฟล์ใหม่ไม่ได้ — ไฟล์ที่เข้ามาระหว่างนี้พักอยู่ฝั่งระบบ ไม่มีอะไรหาย' : ''}</p>
          ${(co.driveState || 'none') === 'none' || co.driveUsed == null ? '' : driveBar(co)}</div>
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end">
          <span class="badge ${driveOf(co).badge}">${esc(driveOf(co).th)}</span>
          ${co.driveState === 'none' ? '' : `<button class="btn small" data-act="switchdrive">เปลี่ยนบัญชี</button>`}
          ${driveReady(co)
      ? `<button class="btn small danger" data-act="unlinkdrive">ยกเลิกการผูก</button>`
      : `<button class="btn small primary" data-act="linkdrive">${co.driveState === 'none' ? 'ผูก Drive' : 'เชื่อมใหม่'}</button>`}
        </div>
      </div>
  </div>` : ''}

  ${os.ok ? `
  <div class="card">
    <div class="card-head"><h3>ตั้งค่าระดับสำนักงาน</h3><span class="hint">Office Settings · ผู้ดูแลสำนักงาน</span></div>
      <div class="setrow">
        <div class="sinfo"><b>รูปแบบวันที่ในไฟล์ส่งออก</b><p>เปลี่ยนแล้วคอลัมน์วันที่ในตารางตัวอย่างของหน้าส่งออกเปลี่ยนตามทันที — ยังรอลูกค้ายืนยันว่าจะใช้แบบไหน (คำถามข้อ 8)</p></div>
        <select class="field" data-act="datefmt">
          ${[['ce', 'DD/MM/YYYY (ค.ศ.)'], ['be', 'DD/MM/YYYY (พ.ศ.)'], ['iso', 'YYYY-MM-DD']].map(o =>
      `<option value="${o[0]}" ${state.dateFormat === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}
        </select>
      </div>
      <div class="setrow">
        <div class="sinfo"><b>แมปคอลัมน์ให้ตรงกับโปรแกรมบัญชีปลายทาง</b><p>ตั้งที่ระดับสำนักงาน ไม่ใช่ระดับบริษัท — FlowAccount / Express / PEAK</p></div>
        <span class="badge mock">FlowAccount · ภาพจำลอง</span>
      </div>
      <div class="setrow">
        <div class="sinfo"><b>ค่าอ่านที่เก็บลูกค้า (บาท/หน้า)</b><p>ราคาต่อหน้าที่สำนักงานเก็บจากลูกค้า — ใช้ทั้งใบเสนอราคาอ่านย้อนหลังในหน้าจอ LINE และเส้นส่วนต่างในหน้าภาพรวมสำนักงาน · ไฟล์ที่เก็บไว้เฉย ๆ ไม่คิดเงิน</p></div>
        <select class="field" data-act="rate">
          ${[0.5, 1, 1.5, 2, 3].map(v => `<option value="${v}" ${state.bahtPerPage === v ? 'selected' : ''}>${v} บาท/หน้า</option>`).join('')}
        </select>
      </div>
      <div class="setrow">
        <div class="sinfo"><b>เตือนเครดิตเมื่อเหลือน้อยกว่า (หน้า)</b><p>ต่ำกว่านี้การ์ดเครดิตขึ้นป้าย "เครดิตใกล้หมด" และ KPI ช่องขวาสุดสลับมาเตือนแทน — สำนักงานที่อ่านเดือนละหลายพันหน้าต้องเตือนเร็วกว่าสำนักงานเล็ก</p></div>
        <select class="field" data-act="creditwarn">
          ${[100, 200, 500, 1000].map(v => `<option value="${v}" ${state.creditWarnPages === v ? 'selected' : ''}>${v.toLocaleString()} หน้า</option>`).join('')}
        </select>
      </div>
      <div class="setrow">
        <div class="sinfo"><b>เกณฑ์ใบติดธงค้างนาน (วัน)</b><p>ใช้กับ KPI ใบค้างในหน้าภาพรวมของนักบัญชี · นับจากวันที่บนใบเสร็จ ไม่ใช่เวลาที่ใบเข้าคิวตรวจ เพราะระบบยังไม่เก็บเวลาเข้าคิว</p></div>
        <select class="field" data-act="staledays">
          ${[1, 3, 5, 7, 14].map(v => `<option value="${v}" ${state.staleDays === v ? 'selected' : ''}>${v} วัน</option>`).join('')}
        </select>
      </div>
      <div class="setrow" style="display:block">
        <div class="sinfo" style="margin-bottom:.7rem">
          <b>ผังหมวดค่าใช้จ่าย</b>
          <p>AI ไม่ได้คิดหมวดขึ้นเอง — มันเลือกจากผังนี้เท่านั้น ถ้าไม่มั่นใจจะตกมาที่ "${esc(UNCAT)}" แล้วติดธงให้คนตรวจ ·
          ตั้งที่ระดับสำนักงาน ไม่ให้ลูกค้าแต่ละรายตั้งเอง ไม่งั้นไฟล์ที่ส่งเข้าโปรแกรมบัญชีจะไม่ตรงกัน ·
          หมวดที่มีเอกสารอยู่แล้วลบไม่ได้ — ใช้ <b>ระงับ</b> แทน คือเลิกใช้กับใบใหม่ แต่ใบเก่ายังคงหมวดเดิมไว้
          เพราะไฟล์ที่ส่งเข้าโปรแกรมบัญชีไปแล้วเขียนหมวดเดิมไว้ การแก้ย้อนหลังจะทำให้ของบนจอไม่ตรงกับไฟล์ที่ส่งไป</p>
        </div>
        <div class="catlist">
          ${catsOf().map((c, i) => {
      const n = catCount(c), off = catIsOff(c);
      return `<div class="catrow${off ? ' catoff' : ''}">
              <input class="field" value="${esc(c)}" data-catname="${i}" aria-label="ชื่อหมวด ${esc(c)}">
              <span class="muted small nowrap">${n} ใบ${off ? ' · ระงับแล้ว' : ''}${(() => {
        const k = catCoOffCount(c), tot = tenantCompanies().length;
        return !off && k ? ` · ${k}/${tot} บริษัทปิดไว้` : '';
      })()}</span>
              <button class="btn small" data-catoff="${i}" title="${off ? 'กลับมาให้เลือกได้อีกครั้ง' : 'เลิกใช้กับใบใหม่ ใบเก่ายังอยู่หมวดเดิม'}">${off ? 'เปิดใช้' : 'ระงับ'}</button>
              <button class="btn small ${n ? '' : 'danger'}" data-catdel="${i}" ${n ? 'disabled title="มีเอกสารอยู่ ลบไม่ได้ — ใช้ระงับแทน"' : ''}>ลบ</button>
            </div>`;
    }).join('')}
          <div class="catrow">
            <input class="field" id="catNew" placeholder="เพิ่มหมวดใหม่ เช่น ค่าเช่า" aria-label="ชื่อหมวดใหม่">
            <span class="muted small nowrap">${catCount(UNCAT)} ใบ ใน "${esc(UNCAT)}"</span>
            <button class="btn small primary" data-act="catadd">เพิ่ม</button>
          </div>
        </div>
      </div>

      <div class="setrow" style="display:block">
        <div class="sinfo" style="margin-bottom:.7rem">
          <b>มอบหมายว่านักบัญชีคนไหนดูแลบริษัทไหน</b>
          <p>ลูกค้าอยู่ใต้สำนักงาน ไม่ได้อยู่ใต้นักบัญชี — คนหนึ่งดูแลได้หลายบริษัท และบริษัทหนึ่งมีคนดูแลได้หลายคน
          นักบัญชีลาออกลูกค้าจึงไม่หายไปด้วย แค่เปลี่ยนคนดูแล</p>
        </div>
        <div class="tablewrap">
          <table>
            <thead><tr><th>นักบัญชี</th>${tenantCompanies().map(id =>
      `<th class="num">${esc(companyName(id))}</th>`).join('')}<th class="num">รวม</th></tr></thead>
            <tbody>
            ${acctsOfTenant().map(m => {
      const mine = assignedTo(m.id);
      return `<tr>
              <td><b>${esc(m.name)}</b></td>
              ${tenantCompanies().map(id => `<td class="num">
                <input type="checkbox" data-assign="${m.id}:${id}" ${mine.indexOf(id) > -1 ? 'checked' : ''}
                  aria-label="ให้ ${esc(m.name)} ดูแล ${esc(companyName(id))}">
              </td>`).join('')}
              <td class="num"><b>${mine.length}</b></td>
            </tr>`;
    }).join('')}
            </tbody>
          </table>
        </div>
        ${tenantCompanies().filter(id => !acctsOfTenant().some(m => assignedTo(m.id).indexOf(id) > -1)).length
      ? `<div class="issue mt-s">${ic('alertTriangle', 14)}<b>มีบริษัทที่ยังไม่มีใครดูแล</b> —
           ${tenantCompanies().filter(id => !acctsOfTenant().some(m => assignedTo(m.id).indexOf(id) > -1)).map(companyName).map(esc).join(' · ')}
           · ใบติดธงของบริษัทนี้จะไม่ขึ้นในรายการของใครเลย</div>`
      : ''}
      </div>
      ${tenant().owner ? `
      <div class="setrow">
        <div class="sinfo"><b>ต้นทุนค่าโมเดลจริง (บาท/หน้า)</b><p>กรอกจากบิลของเจ้าของโมเดล — ใช้คำนวณส่วนต่างของสำนักงานคุณและกำไรจากการขายระบบ
          <b>ตัวเลขนี้ไม่ถูกส่งไปให้สำนักงานที่ซื้อระบบไปเห็น</b></p></div>
        <select class="field" data-act="apicost">
          ${[0.1, 0.15, 0.2, 0.3, 0.5, 0.8].map(v => `<option value="${v}" ${state.apiCostPerPage === v ? 'selected' : ''}>${v.toFixed(2)} บาท/หน้า</option>`).join('')}
        </select>
      </div>` : `
      <div class="setrow">
        <div class="sinfo"><b>ค่าระบบที่จ่ายผู้ให้บริการ</b><p>อัตราตามสัญญา (${esc(tenant().plan)}) — คิดเฉพาะหน้าที่อ่านสำเร็จ หักจากเครดิตที่เติมไว้ล่วงหน้า</p></div>
        <span class="badge info">${money(tenant().rate)} บาท/หน้า</span>
      </div>
      <div class="setrow">
        <div class="sinfo"><b>เครดิตคงเหลือ</b><p>เครดิตหมดเมื่อไหร่บอทหยุดรับใบใหม่ ข้อมูลเดิมยังเปิดดูและส่งออกได้ครบ</p></div>
        <button class="btn primary" data-topup="${tenant().id}">${money(credit().left)} ฿ · เติมเครดิต</button>
      </div>`}
      <div class="setrow">
        <div class="sinfo"><b>เกณฑ์ติดธง (confidence threshold)</b><p>ต่ำกว่าค่านี้ = flagged · ยิ่งสูงยิ่งตรวจเยอะ — ปรับแล้วขยับสถานะของใบในระบบทันที ยกเว้นใบที่ส่งออกไปแล้วและใบที่อ่านไม่ออก</p></div>
        <select class="field" data-act="conf">
          ${[0.5, 0.6, 0.7, 0.8, 0.9].map(v => `<option value="${v}" ${state.confMin === v ? 'selected' : ''}>${v.toFixed(2)}</option>`).join('')}
        </select>
      </div>
  </div>` : ''}

  ${ta.ok ? `
  <div class="card">
    <div class="card-head"><h3>Tenant / White-Label</h3><span class="hint">เจ้าของระบบเท่านั้น</span></div>
      <div class="setrow">
        <div class="sinfo"><b>tenant_id</b><p>${esc(co.tenant)} · ${esc(tenantName(co.tenant))} — ต้องวางตั้งแต่ schema วันแรก แยกทีหลังคือ rewrite ก้อนใหญ่</p></div>
        <span class="badge info">${tenantCompanies(co.tenant).length} บริษัทภายใต้ tenant นี้</span>
      </div>
      <div class="setrow">
        <div class="sinfo"><b>LINE OA ของพาร์ทเนอร์</b><p>White-Label — พาร์ทเนอร์มี LINE OA แบรนด์ตัวเอง</p></div>
        <span class="badge info">${esc(tenantOf(co.tenant).oa)}</span>
      </div>
      <div class="setrow">
        <div class="sinfo"><b>สีแบรนด์</b><p>สีของ ${esc(tenantName(co.tenant))} — จุดสีบนแถบโหมดช่วยเหลือใช้ค่านี้ · การแก้แบรนด์อยู่ในหน้าสำนักงานลูกค้า (ยังเป็นภาพจำลอง)</p></div>
        <span class="badge info">${esc(tenantOf(co.tenant).color)}</span>
      </div>
  </div>` : ''}
  ${srcline('10 (Drive เป็นชั้นรอง) · 11 (companies · tenant_id) · 15 (Office Settings)')}`;
}

/* ---------- สำนักงานลูกค้า (จัดการ tenant) ----------
   หน้าเดียวที่ "ทำ" อะไรกับสำนักงานได้ — หน้าภาพรวมเหลือแค่ตัวเลขสรุปกับทางเข้ามาที่นี่
   ปุ่มที่ยังไม่ได้ต่อระบบหลังบ้านติดป้าย "ภาพจำลอง" ไว้ทุกอัน     */

/* ขั้นตอนที่ยังไม่ได้ทำจริง — เปิดหน้าต่างอธิบายว่ากดแล้วจะเกิดอะไร เพื่อให้เห็นภาพก่อนสั่งสร้าง */
function mockModal(title, lead, steps, foot) {
  modal(`
    <h2>${esc(title)} <span class="badge mock">ภาพจำลอง</span></h2>
    <p class="small muted">${lead}</p>
    <ol class="tight numbered">${steps.map(s => `<li>${s}</li>`).join('')}</ol>
    <div class="issue info" style="margin:0">
      ${ic('alertTriangle', 15)}
      <div>${foot || 'หน้าจอนี้ยังไม่ได้ต่อกับระบบหลังบ้าน — ไว้ดูลำดับขั้นตอนและตัดสินใจก่อนสั่งสร้างจริง'}</div>
    </div>
    <div class="modal-foot"><button class="btn" data-close-modal>ปิด</button></div>`);
}

const TENANT_MOCKS = {
  newtenant: () => mockModal('เปิดสำนักงานใหม่',
    'ขั้นตอนตั้งแต่ปิดการขายจนสำนักงานใหม่รับใบแรกได้',
    ['กรอกชื่อสำนักงาน · ตั้งค่าระบบต่อหน้า · สีแบรนด์',
      'ผูก <b>LINE OA ของสำนักงานนั้น</b> — เขาต้องมี OA ของตัวเอง ระบบขอแค่ channel secret กับ access token',
      'ตั้งเจ้าของสำนักงานคนแรกจากอีเมล — คนนี้จะไปเพิ่มนักบัญชีและบริษัทลูกค้าเองต่อ',
      'เติมเครดิตก้อนแรก — ยังไม่เติมก็เปิดใช้ได้ แต่บอทจะยังไม่รับใบ',
      'ระบบสร้าง <code>tenant_id</code> ใหม่ ข้อมูลถูกกั้นจากสำนักงานอื่นตั้งแต่วินาทีแรก'],
    'สิ่งที่ต้องเตรียมก่อนสร้างจริง: ตาราง <code>tenants</code> · <code>tenant_settings</code> · <code>drive_connections</code> ตามที่วางไว้ในเอกสารโครงสร้างข้อมูล'),
  brand: t => mockModal(`แก้แบรนด์ของ ${t.name}`,
    'White-Label — สำนักงานเห็นชื่อและสีของตัวเอง ไม่เห็นชื่อ Chap Wai',
    ['เปลี่ยนชื่อที่แสดง · โลโก้ · สีหลัก',
      'เปลี่ยน LINE OA ที่ผูกอยู่ (ต้อง verify ใหม่ทุกครั้ง)',
      'ข้อความบอทที่ลงชื่อสำนักงาน จะเปลี่ยนตามทันทีทุกกลุ่ม'],
    'ตอนแก้ OA ต้องมีขั้นยืนยันก่อนสลับจริง ไม่งั้นกลุ่มที่ผูกไว้จะเงียบทันทีโดยไม่มีใครรู้'),
  suspend: t => mockModal(`ระงับ ${t.name}`,
    'ใช้ตอนผิดสัญญาหรือขอหยุดชั่วคราว — คนละเรื่องกับเครดิตหมด',
    ['บอทหยุดรับใบใหม่ทุกกลุ่มของสำนักงานนี้',
      'คนของสำนักงานยังเข้าคอนโซลได้ ดูของเก่าและส่งออกได้ตามปกติ',
      'ขึ้นแถบแจ้งบนหัวจอเขาว่าถูกระงับ พร้อมเหตุผลที่คุณกรอก',
      'ปลดระงับแล้วกลับมาทำงานต่อทันที ไม่ต้องผูกอะไรใหม่'],
    'ต่างจากเครดิตหมดตรงที่อันนี้เป็นการตัดสินใจของผู้ให้บริการ จึงต้องมีเหตุผลและถูกบันทึกแยก'),
  close: t => mockModal(`ปิดบัญชี ${t.name}`,
    'ขั้นตอนตอนเลิกใช้ — ต้องคืนข้อมูลให้เขาก่อนเสมอ',
    ['ส่งออกเอกสารทั้งหมดเป็นไฟล์ให้เขาดาวน์โหลด (Excel + ไฟล์ต้นฉบับ)',
      'คืนเครดิตคงเหลือตามข้อตกลง',
      'ถอด LINE OA ออกจากระบบ — กลุ่มทั้งหมดหยุดทำงาน',
      'ข้อมูลถูกเก็บไว้อีก 90 วันก่อนลบถาวร เผื่อเขาขอกลับมา'],
    'ห้ามลบทันทีที่กด — ต้องมีช่วงเก็บไว้ก่อนเสมอ เผื่อกดผิดหรือเขาเปลี่ยนใจ')
};

function scTenants() {
  const rows = state.tenants.map(t => credit(t.id));
  const paid = rows.filter(r => !r.t.owner);
  const rev = paid.reduce((s, r) => s + r.used, 0);
  const apiForOthers = paid.reduce((s, r) => s + r.pages * state.apiCostPerPage, 0);
  const held = paid.reduce((s, r) => s + Math.max(0, r.left), 0);

  const card = r => {
    const t = r.t;
    const cos = state.companies.filter(c => c.tenant === t.id);
    const docs = state.docs.filter(d => !d.deleted && cos.some(c => c.id === d.company));
    const pct = r.topped > 0 ? Math.max(0, Math.min(100, Math.round(r.left / r.topped * 100))) : 0;
    return `
    <div class="tn-card ${r.st === 'stop' ? 'stop' : r.st === 'low' ? 'low' : ''}">
      <span class="tn-mark" style="background:${t.color}">${esc(t.initial)}</span>
      <div class="tn-body">
        <div class="tn-top">
          <div>
            <b>${esc(t.name)}</b>
            <div class="muted small">${esc(t.note)}</div>
          </div>
          <span class="badge ${CREDIT_CLS[r.st]}">${esc(CREDIT_TH[r.st])}</span>
        </div>
        <div class="tn-meta">
          <span class="badge ${t.owner ? 'brand' : 'info'}">${esc(t.plan)}</span>
          <span>${ic('chat', 12)} <code>${esc(t.oa)}</code></span>
          <span>${ic('history', 12)} เริ่มใช้ ${fmtD(t.since)}</span>
          <span>${ic('building', 12)} ${cos.length} บริษัท</span>
          <span>${ic('receipt', 12)} ${docs.length} เอกสารในระบบ</span>
          <span>${ic('checkCircle', 12)} อ่านสะสม ${r.pages.toLocaleString()} หน้า <span class="muted">(ยกมาก่อนเริ่มบันทึก ${(t.priorPages || 0).toLocaleString()} + ในระบบ ${(r.pages - (t.priorPages || 0)).toLocaleString()})</span></span>
        </div>
        ${t.owner ? `
        <div class="tn-note">${ic('shieldCheck', 13)} สำนักงานของคุณเอง — ถือ API key เอง จ่ายค่าโมเดลตรง ไม่มีเครดิตและไม่มีค่าระบบ</div>`
      : `
        <div class="tn-credit">
          <div>
            <span class="muted small">เครดิตคงเหลือ</span>
            <b class="${r.st === 'ok' ? '' : 'warn'}">${money(r.left)} ฿</b>
            <span class="muted small">· อ่านได้อีก ${Math.max(0, r.pagesLeft).toLocaleString()} หน้า · ค่าระบบ ${money(r.rate)} ฿/หน้า</span>
          </div>
          <div class="prog-track"><i class="${r.st === 'ok' ? '' : 'warn'}" style="width:${Math.max(1, pct)}%"></i></div>
        </div>`}
        <div class="tn-acts">
          ${t.owner ? '' : `<button class="btn small primary" data-topup="${t.id}">${ic('plus', 12)} เติมเครดิต</button>`}
          ${state.tenantId === t.id
        ? '<span class="muted small" style="align-self:center">กำลังดูอยู่</span>'
        : t.id === HOME_TENANT
          /* สำนักงานตัวเองไม่ใช่ "เข้าไปช่วย" — การกลับบ้านคือการออกจากโหมด ไม่ใช่เข้าโหมดซ้อน
             เดิมกดแล้วติดแถบแดงค้างในบ้านตัวเอง และทุกการกระทำถูกตีตราว่าทำในโหมดช่วยเหลือ */
          ? `<button class="btn small" data-act="endsupport">${ic('arrowLeft', 12)} กลับสำนักงานตัวเอง</button>`
          : `<button class="btn small danger" data-support="${t.id}">${ic('shieldCheck', 12)} เข้าไปช่วย</button>`}
          ${t.owner ? '' : `
          <button class="btn small outline" data-tmock="brand" data-tid="${t.id}">${ic('settings', 12)} แก้แบรนด์ <span class="badge mock">จำลอง</span></button>
          <button class="btn small outline" data-tmock="suspend" data-tid="${t.id}">${ic('lock', 12)} ระงับ <span class="badge mock">จำลอง</span></button>
          <button class="btn small outline" data-tmock="close" data-tid="${t.id}">${ic('trash', 12)} ปิดบัญชี <span class="badge mock">จำลอง</span></button>`}
        </div>
      </div>
    </div>`;
  };

  return `
  <div class="page-head">
    <div>
      <h1>สำนักงานลูกค้า</h1>
      <div class="sub">ทุก tenant ในระบบ · เปิดใหม่ · เติมเครดิต · เข้าไปช่วย · ระงับ — งานฝั่งขายระบบอยู่ที่นี่ที่เดียว</div>
    </div>
    <button class="btn primary" data-tmock="newtenant">${ic('plus', 14)} เปิดสำนักงานใหม่ <span class="badge mock">จำลอง</span></button>
  </div>

  ${kpiRow([
      { icon: 'building', label: 'สำนักงานในระบบ', value: state.tenants.length,
        sub: `ของคุณเอง 1 · ซื้อไปใช้ ${paid.length}` },
      { icon: 'money', tone: 'tone-success', label: 'รายรับค่าระบบสะสม', value: money(rev) + ' ฿',
        sub: `หักค่าโมเดล ${money(apiForOthers)} ฿ แล้วเหลือ ${money(+(rev - apiForOthers).toFixed(2))} ฿` },
      { icon: 'inbox', label: 'เครดิตที่ถือไว้ล่วงหน้า', value: money(held) + ' ฿',
        sub: 'เงินที่รับมาแล้วแต่ยังไม่ได้ให้บริการ' },
      { icon: 'alertTriangle', tone: paid.some(r => r.st !== 'ok') ? 'tone-warning' : '',
        label: 'สำนักงานที่ต้องดู', value: paid.filter(r => r.st !== 'ok').length,
        sub: paid.some(r => r.st !== 'ok') ? 'เครดิตใกล้หมดหรือหมดแล้ว' : 'ทุกสำนักงานเครดิตพอ' }
    ])}

  <div class="tn-list">${rows.map(card).join('')}</div>

  ${platformRevenueCard()}

  <div class="card mt">
    <div class="card-head">
      <div>
        <h3>${ic('history', 15)} วงจรชีวิตของสำนักงานหนึ่งราย</h3>
        <div class="muted small">ขั้นไหนกดใช้ได้จริงแล้ว ขั้นไหนยังเป็นภาพจำลอง</div>
      </div>
    </div>
    <div class="tn-life">
      ${[['เปิดสำนักงานใหม่', 'ตั้งค่าแบรนด์ · ผูก LINE OA · ตั้งเจ้าของคนแรก · เติมเครดิตก้อนแรก', false],
      ['ใช้งานประจำ', 'เขาดูแลบริษัทลูกค้าของตัวเอง คุณไม่ต้องยุ่ง — เห็นแค่ปริมาณกับเครดิต', true],
      ['เติมเครดิต', 'เขาเติมเองได้จากหน้าภาพรวม หรือคุณเติมให้จากหน้านี้', true],
      ['มีปัญหา', 'เขากดแจ้งเข้ามา คุณเข้าไปช่วยได้โดยต้องระบุเหตุผลและถูกบันทึกทุกครั้ง', true],
      ['เครดิตหมด', 'บอทหยุดรับใบเอง ไม่ต้องมีใครกด — ข้อมูลเดิมยังเปิดดูและส่งออกได้', false],
      ['ระงับ / ปิดบัญชี', 'ระงับเมื่อผิดสัญญา · ปิดบัญชีต้องคืนข้อมูลให้เขาก่อนเสมอ', false]
      ].map(([h, d, live], i) => `
        <div class="tn-step ${live ? 'live' : 'mock'}">
          <span class="tn-num">${i + 1}</span>
          <div>
            <b>${esc(h)} ${live ? `<span class="badge clean">${ic('check', 10)} ใช้ได้จริง</span>` : '<span class="badge mock">ภาพจำลอง</span>'}</b>
            <p>${esc(d)}</p>
          </div>
        </div>`).join('')}
    </div>
  </div>
  ${srcline('11 (tenants · tenant_id · RLS) · 12 (White-Label) · เอกสารโครงสร้างข้อมูลตอนเปิดขายเป็น tenant')}`;
}

/* ---------- Audit ---------- */
function auditVisible() {
  const c = can('audit_view');
  let list = state.audit.filter(a => roleCompanies().includes(a.company));
  if (state.role !== 'office_admin') list = list.filter(a => a.company === state.companyId);
  if (c.value === 'partial') list = list.filter(a => a.actor === meId());
  return list;
}

function scAudit() {
  const c = can('audit_view');
  const list = auditVisible();
  return `
  <div class="page-head">
    <div><h1>ประวัติการใช้งาน</h1><div class="sub">Activity Log · ตาราง <code>audit_log</code> — actor · company · action · before · after</div></div>
  </div>
  ${kpiRow([
      { icon: 'history', label: 'รายการทั้งหมด', value: list.length, sub: 'ในมุมมองของบทบาทนี้' },
      { icon: 'tasks', tone: 'tone-success', label: 'เกิดในเซสชันนี้', value: list.filter(x => x.live).length, sub: 'สิ่งที่คุณเพิ่งกด' },
      { icon: 'users', label: 'ผู้ใช้ที่มีความเคลื่อนไหว', value: new Set(list.map(x => x.actor)).size, sub: 'actor_user_id' },
      { icon: 'building', label: 'บริษัทที่เห็น', value: new Set(list.map(x => x.company)).size, sub: 'กั้นด้วย company_id' }
    ])}

  ${c.value === 'partial' ? `<div class="inline-lock">${ic('halfCircle', 16)} <div><b>เห็นได้เฉพาะรายการของตัวเอง</b> — ${esc(c.reason)}</div></div><div class="mt-s"></div>` : ''}
  ${tableHead('บันทึกการใช้งาน', list.length + ' รายการ')}
  <div class="tablewrap">
    <table>
      <thead><tr><th>เวลา</th><th>ผู้ทำ</th><th>บริษัท</th><th>การกระทำ</th><th>ก่อน</th><th>หลัง</th></tr></thead>
      <tbody>
      ${list.length ? list.map(a => `<tr ${a.live ? 'style="background:#FFF9F9"' : ''}>
        <td class="nowrap">${esc(a.at)}${a.live ? ' <span class="badge orange">ใหม่</span>' : ''}</td>
        <td class="nowrap">${esc(uname(a.actor))}</td>
        <td class="nowrap">${esc(companyName(a.company))}</td>
        <td>${esc(a.action)}${a.support ? ` <span class="badge unreadable" title="${esc(a.support)}">โหมดช่วยเหลือ</span>` : ''}</td>
        <td class="muted small">${esc(a.before) || '—'}</td>
        <td class="muted small">${esc(a.after) || '—'}</td>
      </tr>`).join('') : '<tr><td colspan="6"><div class="empty">ยังไม่มีรายการ</div></td></tr>'}
      </tbody>
    </table>
  </div>
  <div class="card mt">
    <div class="card-head"><h3>"ไม่กั้น แต่ให้เห็น"</h3></div>
    <p class="small muted" style="margin:0">เปิดสิทธิ์กว้าง แต่บันทึกเสมอว่าใครทำอะไร — เมนูและปุ่มที่บทบาทนี้ไม่มีสิทธิ์จะ<b>ไม่ถูกแสดง</b>ตั้งแต่แรก ส่วนการกระทำที่ระบบปฏิเสธ (เช่น กดส่งออกทั้งที่ปิด <code>financial_visibility</code>) ยังถูกบันทึกไว้ที่นี่</p>
  </div>
  ${srcline('11 (audit_log · line_user_id ในทุก log) · 13 (หลักการ "ไม่กั้น แต่ให้เห็น")')}`;
}

/* ---------- Permissions ---------- */
function scPermissions() {
  const editable = can('tenant_admin').ok;
  const diffs = capDiffs();
  return `
  <div class="page-head">
    <div><h1>สิทธิ์การใช้งาน</h1><div class="sub">โครงสิทธิ์ 3 ชั้น + Permission Matrix ${ROLE_ORDER.length} บทบาท</div></div>
  </div>

  ${kpiRow([
      { icon: 'users', label: 'บทบาททั้งหมด', value: ROLE_ORDER.length, sub: 'จาก 11-technical-notes' },
      { icon: 'shieldCheck', label: 'ความสามารถที่กำหนด', value: CAPS.length, sub: `ครอบคลุม ${MODULE_COUNT} โมดูล` },
      { icon: 'lock', label: 'ระดับสิทธิ์', value: LEVELS.length, sub: '1 · 2a · 2b' },
      { icon: 'checkCircle', tone: 'tone-success', label: 'บทบาทนี้ทำได้', value: CAPS.filter(c => can(c.id).ok).length + '/' + CAPS.length,
        sub: esc(role().th), trend: `<span class="kpi-trend">${Math.round(CAPS.filter(c => can(c.id).ok).length / CAPS.length * 100)}%</span>` }
    ])}

  <div class="level-cards">
    ${LEVELS.map(l => `
      <div class="level-card ${l.cls}">
        <h3>${esc(l.name)}</h3>
        <p>${esc(l.lead)}</p>
        <ul>${l.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
        <p class="lc-note">${esc(l.note)}</p>
      </div>`).join('')}
  </div>

  ${diffs.length ? `
  <div class="issue info mt">
    ${ic('shieldCheck', 15)}
    <div>
      <b>ตารางสิทธิ์ถูกแก้จากค่าเริ่มต้น ${diffs.length} ช่อง</b>
      <div class="small" style="margin-top:0.25rem">
        ${diffs.map(d => `${esc(d.cap.name)} · ${esc(ROLES[d.role].th)}: ${esc(MARK[d.from].th)} → <b>${esc(MARK[d.to].th)}</b>`).join(' &nbsp;·&nbsp; ')}
      </div>
      <button class="btn small mt-s" data-act="resetcaps">${ic('refresh', 13)} คืนค่าเริ่มต้น</button>
    </div>
  </div>` : ''}

  ${editable ? roleEditor() : ''}

  <div class="card mt">
    <div class="card-head">
      <div>
        <h3>Permission Matrix</h3>
        <div class="muted small">คอลัมน์ที่ไฮไลต์ = บทบาทที่กำลังสวมอยู่</div>
      </div>
      ${editable
      ? `<span class="badge neutral">${ic('check', 12)} คลิกช่องเพื่อไปแก้ที่แผงด้านบน</span>`
      : `<span class="badge neutral">${ic('lock', 12)} แก้ไขได้เฉพาะเจ้าของสำนักงาน</span>`}
    </div>
    ${editable ? `<div class="muted small" style="margin-bottom:0.75rem">ตารางนี้เป็นภาพรวม — คลิกช่องไหนก็ได้เพื่อกระโดดไปแก้ที่แผงด้านบน</div>` : ''}
    <div class="tablewrap">
      <table class="matrix">
        <thead><tr>
          <th>ความสามารถ</th><th>ระดับ</th><th>โมดูล</th>
          ${ROLE_ORDER.map(r => `<th class="cell ${state.role === r ? 'col-current' : ''}">${esc(ROLES[r].th)}<br><span class="muted small">${r}</span></th>`).join('')}
        </tr></thead>
        <tbody>
        ${CAPS.map(c => `<tr>
          <td><div class="capname">${esc(c.name)}</div><div class="capsub">${esc(c.sub)}</div></td>
          <td><span class="badge ${c.level === '1' ? 'neutral' : c.level === '2a' ? 'orange' : 'unreadable'}">${esc(c.level)}</span></td>
          <td class="nowrap small muted">${esc(c.module)}</td>
          ${ROLE_ORDER.map(r => {
    const m = MARK[c.r[r]];
    const changed = c.r[r] !== defaultOf(c.id, r);
    const inner = `<span class="${m.cls}">${ic(m.icon, 16)}</span>`;
    return `<td class="cell ${state.role === r ? 'col-current' : ''} ${changed ? 'edited' : ''}" title="${esc(m.th)}${changed ? ' (แก้จากค่าเริ่มต้น: ' + esc(MARK[defaultOf(c.id, r)].th) + ')' : ''}">
      ${editable ? `<button class="cellbtn" data-cell="${c.id}|${r}" aria-label="แก้ ${esc(c.name)} ของ ${esc(ROLES[r].th)} · ตอนนี้ ${esc(m.th)}">${inner}</button>` : inner}
    </td>`;
  }).join('')}
        </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div class="mt-s small muted">
      <span class="mark-full">${ic('check', 14)}</span> ทำได้ &nbsp;·&nbsp;
      <span class="mark-cond">${ic('settings', 14)}</span> ขึ้นกับ <code>financial_visibility</code> ของบริษัท &nbsp;·&nbsp;
      <span class="mark-partial">${ic('halfCircle', 14)}</span> ได้เฉพาะรายการของตัวเอง &nbsp;·&nbsp;
      <span class="mark-none">${ic('minus', 14)}</span> ไม่มีสิทธิ์
    </div>
  </div>

  <div class="grid c2 mt">
    <div class="card">
      <div class="card-head"><h3>เส้นที่ห้ามหลุด</h3></div>
      <ul class="tight">
        <li><code>company_id</code> — ลูกค้า A ต้องไม่เห็นข้อมูลลูกค้า B</li>
        <li><b>ตรวจสิทธิ์ตอนรับ postback ทุกครั้ง</b> — ปุ่มที่ส่งเข้ากลุ่ม ใครในกลุ่มก็กดได้ postback บอกแค่ว่าใครกด</li>
        <li>Supabase RLS กั้นที่ชั้น DB ไม่ใช่ชั้นหน้าเว็บ — หน้าเว็บซ่อนปุ่มไม่นับว่าปลอดภัย</li>
        <li>เมนูตั้งค่าต้องไม่ตอบในห้องกลุ่ม — ตอบเฉพาะแชท 1-1</li>
      </ul>
    </div>
    <div class="card">
      <div class="card-head"><h3>อะไรมาจากเอกสาร อะไรเป็นข้อเสนอ</h3></div>
      <ul class="tight">
        <li><b>มาจากเอกสารตรง ๆ:</b> โครงสิทธิ์ 3 ชั้น (1 / 2a / 2b) · เหตุผลที่แยก 2a กับ 2b · B-9 / B-10</li>
        <li><b>ต่างจากเอกสาร:</b> เอกสารแยก "ผู้ดูแลสำนักงาน" กับ "ผู้ดูแลระบบ" เป็นคนละบทบาท — prototype รวมเป็นบทบาทเดียว
          เพราะคุณตี๋เป็นทั้งเจ้าของสำนักงานและเจ้าของระบบ ถ้าขายให้สำนักงานอื่นในอนาคตค่อยแยกกลับ</li>
        <li><b>เป็นข้อเสนอของ prototype นี้:</b> การกระจายความสามารถรายบทบาทในตารางด้านบน เอกสารระบุแค่ "2b = เจ้าของเท่านั้น" จึงตีความว่า <code>office_admin</code> ทำ 2b ของบริษัทลูกค้าได้ตามที่ตารางด้านบนแสดง <b>ยกเว้น</b> การผูกบัญชี Drive (<code>drive_link</code>) และการอนุมัติคำขอ (<code>task_approve</code>) ที่เป็นของเจ้าของอย่างเดียว · บทบาทที่ต้องกด "ขออนุมัติจากเจ้าของ" เมื่อจะเปลี่ยน role คือ <code>accountant</code> ไม่ใช่ <code>office_admin</code></li>
        <li><b>ตัดสินใจแล้ว:</b> <code>member</code> <b>ใช้งานผ่านไลน์อย่างเดียว</b> — ไม่เข้าคอนโซลเว็บ ไม่มีหน้ารวมเอกสาร (ยึดหลัก "จบในไลน์" ของ B-2 · ส่วน B-9 ที่ให้ทุกคนดูเอกสารบริษัทตัวเองได้ เกิดขึ้นในไลน์ผ่าน Flex Card)</li>
        <li><b>จุดที่ควรยืนยันกับลูกค้า:</b> (1) นักบัญชีควรเห็นยอดสรุปเสมอ หรือควรขึ้นกับ <code>financial_visibility</code> ด้วย · (2) <code>owner</code> ควรเข้าคอนโซลได้ไหม หรือรับสรุปทางไลน์อย่างเดียวเหมือน <code>member</code></li>
      </ul>
    </div>
  </div>
  ${srcline('11-technical-notes-for-dev.md (โครงสิทธิ์ 3 ชั้น · 5 บทบาท · กับดักปุ่มในกลุ่ม)')}`;
}

/* ---------- LINE simulator ---------- */
function lineEntry() {
  return ['accountant', 'office_admin'].includes(state.role) ? 'office' : 'start';
}

function resetLine() {
  state.lineStep = lineEntry();
  const st = LINE_STEPS[state.lineStep];
  state.lineChat = st.chat;
  state.lineLog = st.messages.slice();
}

/* ฉากที่ผู้ใช้กำลังดูอยู่ — ใช้ทั้งไฮไลต์ปุ่มลัดและเลือกชุด KPI ให้ตรงเรื่อง */
function lineScene() {
  return LINE_SCENES.find(s => s.steps.includes(state.lineStep)) || LINE_SCENES[0];
}

/* กระโดดเข้าฉากใดก็ได้ทันที ไม่ต้องไล่กดปุ่มทีละขั้น */
function lineJump(id) {
  const sc = LINE_SCENES.find(s => s.id === id);
  if (!sc) return;
  const first = sc.steps[0], st = LINE_STEPS[first];
  state.lineStep = first;
  state.lineChat = st.chat || LINE_STEPS[sc.side === 'one' ? 'office' : 'start'].chat;
  state.lineLog = st.messages.slice();
  render();
}

function scLine() {
  const st = LINE_STEPS[state.lineStep] || LINE_STEPS.start;
  const chat = state.lineChat || LINE_STEPS.start.chat;
  const notes = state.lineLog.filter(m => m.note);
  const scene = lineScene();

  /* ฉากไหนใครเข้าได้ กำหนดที่ LINE_SCENES.roles — สมาชิกกลุ่มเป็นบทบาทเดียวที่ไม่มีห้องแชท 1-1 */
  const scenes = LINE_SCENES.filter(s => !s.roles || s.roles.includes(state.role));

  /* KPI เปลี่ยนตามฉาก — ฉากเรื่องงานไม่ควรพาดหัวด้วยตัวเลขเอกสาร */
  const openTasks = tasksOf().filter(t => t.status === 'open');
  /* ต้องอ่านจาก state.members ผ่าน membersOf() เหมือนทุกจอ ไม่ใช่ค่าคงที่ seed ไม่งั้น KPI นี้ไม่ขยับตามการแก้สมาชิกเลย
     และ "บอทรู้จัก" ต้องวัดจาก line_user_id ซึ่งเป็นฟิลด์ที่บ่งบอกเรื่องนี้จริง */
  const inGroup = membersOf().length;
  const known = membersOf().filter(m => m.line !== '—').length;
  const taskKpis = [
    { icon: 'tasks', label: 'งานค้างในกลุ่มนี้', value: openTasks.length, sub: 'ยังไม่ปิด' },
    { icon: 'alertTriangle', tone: openTasks.filter(overdue).length ? 'tone-warning' : '', label: 'เลยกำหนด',
      value: openTasks.filter(overdue).length, sub: 'บอทเตือนตามบันได' },
    { icon: 'userCheck', label: 'สมาชิกที่บอทรู้จัก', value: `${known}/${inGroup}`,
      sub: 'สั่งงานได้เฉพาะคนที่รู้จัก' },
    { icon: 'chat', label: 'push ที่ใช้', value: '1/วัน', sub: 'รวมเอกสาร + งานไว้ข้อความเดียว' }
  ];
  const backfillKpis = [
    { icon: 'inbox', label: 'ไฟล์ที่ยังไม่ได้อ่าน', value: BACKFILL_DEMO.files, sub: `ตัวเลขตัวอย่างของฉากนี้ · เก็บไว้ตั้งแต่ ${BACKFILL_DEMO.since}` },
    { icon: 'file', label: 'หน้าที่จะอ่าน', value: BACKFILL_DEMO.pages, sub: 'ตัวเลขตัวอย่างของฉากนี้ ไม่ได้นับจากไฟล์จริงในระบบ' },
    { icon: 'history', label: 'ย้อนได้ไกลสุด', value: `${BACKFILL_DEMO.months} เดือน`, sub: 'เท่าที่มีไฟล์เก็บไว้ในฉากนี้' },
    { icon: 'money', label: 'อัตราต่อหน้า', value: `${state.bahtPerPage} บาท`,
      sub: `รวม ${money(BACKFILL_DEMO.pages * state.bahtPerPage)} บาท${can('office_settings').ok ? ' · ตั้งเพิ่มลดได้ที่หน้าตั้งค่า' : ' · อัตรานี้ตั้งโดยผู้ดูแลสำนักงาน'}` }
  ];
  const fileKpis = [
    { icon: 'inbox', label: 'ชนิดไฟล์ที่รับได้', value: 'ทุกชนิด', sub: 'เก็บก่อนเสมอ ไม่ปฏิเสธไฟล์' },
    { icon: 'checkCircle', tone: 'tone-success', label: 'อ่านข้อมูลได้', value: 'รูป', sub: 'jpg · png · heic · pdf' },
    { icon: 'file', label: 'เก็บอย่างเดียว', value: 'ที่เหลือ', sub: 'Word · Excel · CSV · zip · อื่น ๆ' },
    { icon: 'money', label: 'ค่า AI ที่เพิ่ม', value: '0', sub: 'ไฟล์ที่ไม่ได้อ่าน = ไม่เรียกโมเดล' }
  ];
  /* ตัวเลขชุดนี้มาจากสคริปต์ฉาก "ส่งเอกสารเข้ากลุ่ม" (ได้รับ 12 รูป) — % ต้องคิดจากสองตัวนี้ ไม่ใช่พิมพ์ค้างไว้ */
  const dIn = 12, dClean = 9, dFlag = 2, dBad = 1;
  const docKpis = [
    { icon: 'inbox', label: 'รับเข้าในบทสนทนา', value: dIn, sub: 'ชุดเดียว ถามครั้งเดียว' },
    { icon: 'checkCircle', tone: 'tone-success', label: 'ผ่านได้เลย', value: dClean, sub: 'บอทบันทึกให้ทันที',
      trend: `<span class="kpi-trend">${Math.round(dClean / dIn * 100)}%</span>` },
    { icon: 'alertTriangle', tone: 'tone-warning', label: 'ต้องดู', value: dFlag, sub: 'ติดธงให้ตรวจ' },
    { icon: 'xCircle', tone: 'tone-danger', label: 'อ่านไม่ออก', value: dBad, sub: 'เก็บไฟล์ไว้แล้ว' }
  ];
  /* ฉากแชท 1-1 ฝั่งสำนักงานไม่ได้พูดถึงชุด 12 ใบของฉากส่งเอกสาร — แถว KPI จึงต้องมาจากงานจริงของบริษัทที่เปิดอยู่ */
  const oS = stats();
  const officeKpis = [
    { icon: 'alertTriangle', tone: (oS.flagged + oS.unreadable) ? 'tone-warning' : '', label: 'ใบติดธงรอตรวจ',
      value: oS.flagged + oS.unreadable, sub: `ติดธง ${oS.flagged} · อ่านไม่ออก ${oS.unreadable}` },
    { icon: 'checkCircle', tone: 'tone-success', label: 'ผ่านได้เลย', value: oS.clean, sub: `จาก ${oS.total} ใบของ ${company().name}` },
    { icon: 'store', label: 'บริษัทที่คุณดูแล', value: roleCompanies().length, sub: 'ตามที่สำนักงานมอบหมาย' },
    { icon: 'tasks', label: 'งานค้างในกลุ่มนี้', value: openTasks.length, sub: 'ยังไม่ปิด' }
  ];

  return `
  <div class="page-head">
    <div><h1>หน้าจอ LINE</h1><div class="sub">M1 · M2 · M4 · M7 — ทุกอย่างจบในไลน์ ไม่มี Rich Menu ไม่มี LIFF</div></div>
    <div class="page-actions"><button class="btn" data-act="resetline">${ic('refresh', 14)} เริ่มบทสนทนาใหม่</button></div>
  </div>

  <div class="chips">
    ${scenes.map(s => `<button class="chip ${s.id === scene.id ? 'on' : ''}" data-linescene="${s.id}">${esc(s.label)}</button>`).join('')}
  </div>

  ${kpiRow(scene.id === 'backfill' ? backfillKpis
      : scene.id === 'files' ? fileKpis
      : ['tasks', 'assign'].includes(scene.id) ? taskKpis
        : scene.id === 'office' ? officeKpis : docKpis)}

  <div class="line-wrap">
    <div class="phone">
      <div class="phone-screen">
        <div class="line-head">
          <div class="lavatar">${ic('chat', 17)}</div>
          <div class="ltitle"><b>${esc(chat.title)}</b><span>${esc(chat.sub)}</span></div>
        </div>
        <div class="line-body" id="lineBody">
          ${state.lineLog.map(renderMsg).join('')}
        </div>
        <div class="line-foot">
          <div class="hintmsg" style="width:100%">Quick Reply — ใช้ได้ทั้งแชท 1-1 และแชทกลุ่ม สูงสุด 13 ปุ่ม</div>
          ${(st.quick || []).map((q, i) => `<button class="qr ${q.primary ? 'primary' : ''} ${q.muted ? 'muted' : ''}" data-qr="${i}">${esc(q.label)}</button>`).join('')}
        </div>
      </div>
    </div>

    <div>
      <div class="card behind">
        <div class="card-head"><h3>เบื้องหลังขั้นตอนนี้</h3><span class="hint">สิ่งที่ระบบทำจริง</span></div>
        ${(st.behind || []).map((b, i) => `
          <div class="bstep"><div class="bnum">${i + 1}</div>
            <div class="btext"><b>${esc(b.t)}</b>${esc(b.d)}</div></div>`).join('')}
      </div>

      <div class="card">
        <div class="card-head"><h3>สิทธิ์ในห้องแชทนี้</h3><span class="hint">${esc(role().th)}</span></div>
        <div class="kv"><b>ห้องที่เข้าได้</b><span>${state.role === 'member'
      ? 'กลุ่มไลน์ของบริษัทตัวเองเท่านั้น — ไม่มีแชท 1-1 กับบอท'
      : state.role === 'owner'
        ? 'กลุ่มไลน์ของบริษัทตัวเอง + แชท 1-1 (ขั้นตอนติดตั้งบังคับให้เจ้าของเพิ่มบอทเป็นเพื่อน)'
        : 'แชท 1-1 กับบอท + กลุ่มของทุกบริษัทที่ดูแล'}</span></div>
        <div class="kv"><b>ปุ่มที่กดได้</b><span>ทุกปุ่มระดับ 1 — แต่ระบบเช็ก <code>line_user_id</code> กับ role ทุกครั้งตอนรับ postback</span></div>
        <div class="kv"><b>ตัวเลขสรุป</b><span>${can('view_financial').ok ? 'เห็น (ระดับ 2a)' : ic('lock', 13) + ' ซ่อน — ' + esc(can('view_financial').reason)}</span></div>
        <div class="kv"><b>เมนูตั้งค่า</b><span>${can('company_settings').ok ? 'ใช้ได้ — แต่บอทตอบเฉพาะแชท 1-1 เท่านั้น' : ic('lock', 13) + ' ไม่มีสิทธิ์ (2b)'}</span></div>
      </div>

      ${notes.length ? `<div class="card">
        <div class="card-head"><h3>หมายเหตุจากบทสนทนา</h3></div>
        ${notes.map(n => `<div class="kv note"><b>${ic('pin', 14)}</b><span>${esc(n.note)}</span></div>`).join('')}
      </div>` : ''}
    </div>
  </div>
  ${srcline('08 (flow รับไฟล์ · ข้อความบอทตัวอย่าง) · 10 (ข้อเท็จจริง LINE API) · 13 (ชื่อฟังก์ชันฉบับลูกค้า)')}`;
}

function renderMsg(m) {
  if (m.who === 'sys') return `<div class="sysline">${esc(m.text)}</div>`;
  if (m.card) return `<div class="msg bot">${lineCard(m.card)}<div class="time">${esc(m.time || '')}</div></div>`;
  const who = m.who === 'me' ? 'me' : 'bot';
  return `<div class="msg ${who}">
    ${m.name && who === 'me' ? `<div class="who">${esc(m.name)}</div>` : ''}
    <div class="bubble">${esc(m.text)}</div>
    <div class="time">${esc(m.time || '')}</div>
  </div>`;
}

function lineCard(kind) {
  const fin = can('view_financial');
  const mask = v => fin.ok ? v : '••••';
  /* คำนวณสดจากเอกสารจริงในชุดส่งออกล่าสุด — เดิม hardcode 34 ใบ / 482,910 ซึ่งไม่ตรงกับข้อมูลชุดไหนเลย
     ชุดเก่าบางชุดไม่มีเอกสารรายใบเหลือในระบบ ให้ถอยไปใช้ count ที่บันทึกไว้กับชุดนั้น (แหล่งเดียวกับตารางในหน้าส่งออก)
     และไม่แสดงยอดเงินที่คำนวณจากใบจริงไม่ได้ แทนที่จะโชว์ 0 */
  const expSum = (() => {
    const e = state.exports.filter(x => x.company === state.companyId)[0] || {};
    const docs = state.docs.filter(d => d.batch === e.id && !d.deleted);
    return {
      n: docs.length || e.count || 0,
      hasDocs: docs.length > 0,
      total: docs.reduce((s, d) => s + (d.total || 0), 0),
      vat: docs.reduce((s, d) => s + (d.vat || 0), 0),
      files: e.files || []
    };
  })();
  if (kind === 'clean') return `
    <div class="flexcard">
      <div class="fc-head clean">${ic('checkCircle', 13)} บันทึกแล้ว</div>
      <div class="fc-thumb"></div>
      <div class="fc-body">
        <div class="fc-row"><span>บจก. ออฟฟิศเมท</span></div>
        <div class="fc-row"><span>ยอดรวม</span><b>${mask('1,070.00')}</b></div>
        <div class="fc-row"><span>VAT</span><b>${mask('70.00')}</b></div>
        <div class="fc-row"><span>หมวด</span><b>วัสดุสำนักงาน</b></div>
      </div>
      <div class="fc-btns"><button>ดูรายละเอียด</button><button>แก้ไข</button>${can('doc_delete').ok ? '<button class="danger">ลบใบนี้</button>' : ''}</div>
    </div>`;
  if (kind === 'flagged') return `
    <div class="flexcard">
      <div class="fc-head flagged">${ic('alertTriangle', 13)} บันทึกแล้ว แต่ช่วยดูจุดนี้</div>
      <div class="fc-thumb"></div>
      <div class="fc-body">
        <div class="fc-row"><span>ร้านวัสดุ ก.ก่อสร้าง</span></div>
        <div class="fc-row"><span>ยอดรวม</span><b>${mask('7,490.00')}</b></div>
        <div class="fc-warn">${ic('alertTriangle', 11)} เลขผู้เสียภาษีไม่ครบ 13 หลัก<br>${ic('alertTriangle', 11)} ยอดรวมอาจอ่านผิด (1,070 ↔ 7,490)</div>
      </div>
      <div class="fc-btns"><button>แก้ไข</button><button>ถูกต้องแล้ว</button>${can('doc_delete').ok ? '<button class="danger">ลบใบนี้</button>' : ''}</div>
    </div>`;
  if (kind === 'unreadable') return `
    <div class="flexcard">
      <div class="fc-head unreadable">${ic('xCircle', 13)} อ่านข้อมูลไม่ออก</div>
      <div class="fc-thumb"></div>
      <div class="fc-body">
        ${ic('inbox', 13)} เก็บไฟล์ไว้แล้วในโฟลเดอร์ <b>_รอตรวจสอบ</b><br>
        <span class="muted">ไฟล์ไม่หาย — สั่งอ่านซ้ำหรือถ่ายใหม่ได้</span>
      </div>
      <div class="fc-btns"><button>${ic('camera', 12)} ถ่ายใหม่</button><button class="danger">ข้ามใบนี้</button></div>
    </div>`;
  /* การ์ดนี้พูดถึง D-2608-012 ใบเดียวกับที่ดรอเวอร์เปิด — อ่าน conf จากเอกสารจริง ไม่งั้นสองจอเลขไม่ตรงกันอีก
     และต้องขึ้นครบทุกฟิลด์ตามที่หมายเหตุของขั้นนี้ยืนไว้ ช่องที่ AI ไม่ได้คืนค่ามาก็ขึ้น "—" */
  if (kind === 'fieldpicker') {
    const fd = state.docs.find(x => x.id === 'D-2608-012') || { conf: {} };
    const rows = [['ชื่อผู้ขาย', 'vendor'], ['เลขผู้เสียภาษี', 'taxId'], ['วันที่', 'date'],
      ['ยอดก่อน VAT', 'base'], ['VAT', 'vat'], ['ยอดรวม', 'total'], ['หมวดค่าใช้จ่าย', 'category']];
    return `
    <div class="flexcard">
      <div class="fc-head info">เลือกฟิลด์ที่จะแก้</div>
      <div class="fc-body">
        ${rows.map(([label, k]) => {
      const c = (fd.conf || {})[k];
      return `<div class="fc-row"><span>${esc(label)}</span>${c == null ? '<b class="muted">—</b>'
        : c < .7 ? `<b style="color:var(--destructive)">${Math.round(c * 100)}% ${ic('alertTriangle', 11)}</b>`
          : `<b>${Math.round(c * 100)}%</b>`}</div>`;
    }).join('')}
      </div>
      <div class="fc-btns"><button>เลือก "ยอดรวม"</button></div>
    </div>`;
  }
  /* หัวการ์ดใช้ป้ายเดียวกับ KPI เหนือเครื่องโทรศัพท์ จึงต้องนับจากกองเดียวกัน — เดิมตรึงไว้ที่ 2 รายการ
     ปิดงานที่หน้า "งานและคำขอ" แล้วการ์ดต้องลดตาม ไม่ใช่ค้างตามบท */
  if (kind === 'task') {
    const open = tasksOf().filter(t => t.status === 'open');
    return `
    <div class="flexcard">
      <div class="fc-head info">${ic('pin', 13)} งานค้างในกลุ่มนี้ · ${open.length} รายการ</div>
      <div class="fc-body">
        ${open.length ? open.slice(0, 2).map(t => `<b>${esc(t.id)}</b> ${crossOrg(t) ? `<span class="muted">[${esc(orgName(byOrgOf(t)))}ขอ]</span> ` : ''}${esc(t.title)}<br>
        <span ${overdue(t) ? 'style="color:var(--destructive)"' : 'class="muted"'}>${esc(uname(t.assignee))} · ครบกำหนด ${fmtD(t.due)}</span>`).join('<br><br>')
      : '<span class="muted">ไม่มีงานค้างในกลุ่มนี้</span>'}
        ${open.length > 2 ? `<br><br><span class="muted">และอีก ${open.length - 2} รายการ</span>` : ''}
      </div>
      <div class="fc-btns"><button>เสร็จแล้ว</button><button>ขอเลื่อน</button></div>
    </div>`;
  }
  /* --- อ่านย้อนหลัง (M2 + M3) --- */
  if (kind === 'backfillquote') return `
    <div class="flexcard">
      <div class="fc-head info">${ic('calculator', 13)} ประเมินก่อนเริ่มอ่าน</div>
      <div class="fc-body">
        <div class="fc-row"><span>ช่วง</span><b>มี.ค.–ส.ค. 2569</b></div>
        <div class="fc-row"><span>ไฟล์</span><b>${BACKFILL_DEMO.files} ไฟล์</b></div>
        <div class="fc-row"><span>รวมทั้งหมด</span><b>${BACKFILL_DEMO.pages} หน้า</b></div>
        <div class="fc-row"><span>เคยอ่านแล้ว</span><b>0 หน้า</b></div>
        <div class="fc-row"><span>คิดค่าอ่าน</span><b>${BACKFILL_DEMO.pages} หน้า</b></div>
        <div class="fc-row"><span>อัตรา</span><b>${state.bahtPerPage} บาท/หน้า</b></div>
        <div class="fc-row"><span>รวมเป็นเงิน</span><b>${money(BACKFILL_DEMO.pages * state.bahtPerPage)} บาท</b></div>
        <div class="fc-warn">${ic('alertTriangle', 11)} หน้าที่อ่านไม่ออกหรือไม่ใช่เอกสารบัญชี ไม่คิดเงิน</div>
      </div>
      <div class="fc-btns"><button>ยืนยัน</button><button>ยกเลิก</button></div>
    </div>`;
  if (kind === 'backfillresult') return `
    <div class="flexcard">
      <div class="fc-head clean">${ic('checkCircle', 13)} อ่านย้อนหลังเสร็จแล้ว</div>
      <div class="fc-body">
        <div class="fc-row"><span>อ่านได้</span><b>468 หน้า</b></div>
        <div class="fc-row"><span>ต้องดู</span><b>34 หน้า</b></div>
        <div class="fc-row"><span>ข้ามให้</span><b>9 หน้า</b></div>
        <div class="fc-row"><span>อ่านไม่ออก</span><b style="color:var(--destructive)">3 หน้า</b></div>
        <div class="fc-row"><span>คิดเงิน</span><b>${money(468 * state.bahtPerPage)} บาท</b></div>
        <div style="margin-top:6px">
          <span class="muted">ข้ามให้ — ใบปะหน้า / หน้าว่าง<br>
          อ่านไม่ออก — ภาพไม่ชัด<br>
          • ใบกำกับ_มี.ค..pdf — หน้า 3, 7<br>
          • ใบเสร็จ_พ.ค..pdf — หน้า 12</span>
        </div>
      </div>
      <div class="fc-btns"><button>ถ่ายใหม่ 3 หน้านี้</button><button>ดูใบที่ต้องตรวจ</button></div>
    </div>`;

  /* --- ไฟล์ที่ไม่ใช่รูป (M1) --- */
  if (kind === 'filebatch') return `
    <div class="flexcard">
      <div class="fc-head info">${ic('inbox', 13)} รับไฟล์แล้ว 3 ไฟล์</div>
      <div class="fc-body">
        <b>ใบกำกับภาษี_ส.ค..pdf</b><br>
        <span class="muted">8 หน้า · อ่านข้อมูลได้</span><br><br>
        <b>สัญญาเช่าโกดัง.docx</b><br>
        <span class="muted">เก็บอย่างเดียว — ยังอ่านไม่ได้</span><br><br>
        <b>งบทดลอง_ส.ค..xlsx</b><br>
        <span class="muted">เก็บอย่างเดียว — ยังอ่านไม่ได้</span><br><br>
        <span class="muted">${ic('checkCircle', 11)} ทั้ง 3 ไฟล์ขึ้น Drive แล้ว ก่อนถามคำถามใด ๆ</span>
      </div>
      <div class="fc-btns"><button>อ่านเฉพาะ PDF</button><button>เก็บอย่างเดียว</button></div>
    </div>`;

  /* --- มอบหมายงาน (M7) --- */
  if (kind === 'memberpick') return `
    <div class="flexcard">
      <div class="fc-head info">${ic('users', 13)} มอบหมายให้ใคร</div>
      <div class="fc-body">
        <div class="fc-row"><span>วีระ · ฝ่ายจัดซื้อ</span><b>รู้จักแล้ว</b></div>
        <div class="fc-row"><span>นภา · นักบัญชี</span><b>รู้จักแล้ว</b></div>
        <div class="fc-row"><span>มานี · เข้าใหม่</span><b style="color:var(--warning-fg)">ยังไม่รู้จัก</b></div>
        <div class="fc-warn">${ic('alertTriangle', 11)} บอทรู้จักเฉพาะคนที่เคยพิมพ์ ถูกแท็ก หรือเพิ่งเข้ากลุ่ม</div>
      </div>
      <div class="fc-btns"><button>วีระ</button><button>นภา</button><button>มานี</button></div>
    </div>`;
  if (kind === 'assignpreview') return `
    <div class="flexcard">
      <div class="fc-head info">${ic('tasks', 13)} ตรวจก่อนสร้างงาน</div>
      <div class="fc-body">
        <b>ขอใบกำกับภาษีเต็มรูปจากร้านวัสดุ ก.ก่อสร้าง</b>
        <div class="fc-row"><span>ผู้รับผิดชอบ</span><b>วีระ (ฝ่ายจัดซื้อ)</b></div>
        <div class="fc-row"><span>ผู้มอบหมาย</span><b>สมชาย</b></div>
        <div class="fc-row"><span>ครบกำหนด</span><b>จ. 31 ส.ค. 2569</b></div>
        <div class="fc-row"><span>ต้องแนบหลักฐาน</span><b>ใช่</b></div>
      </div>
      <div class="fc-btns"><button>ประกาศในกลุ่มเลย</button><button>รวมไปกับสรุปเช้าพรุ่งนี้</button></div>
    </div>`;
  if (kind === 'assigndone') return `
    <div class="flexcard">
      <div class="fc-head clean">${ic('checkCircle', 13)} สร้างงานแล้ว · T-042</div>
      <div class="fc-body">
        <b>ขอใบกำกับภาษีเต็มรูปจากร้านวัสดุ ก.ก่อสร้าง</b><br>
        <span class="muted">@วีระ · ครบกำหนด จ. 31 ส.ค. 2569 · มอบโดย สมชาย</span>
        <div class="fc-warn">${ic('refresh', 11)} ปิดเองเมื่อใบกำกับภาษีเต็มรูปของร้านนี้เข้าระบบ</div>
      </div>
      <div class="fc-btns"><button>รับงาน</button><button>ขอเลื่อน</button><button>ปิดงาน</button></div>
    </div>`;
  if (kind === 'export') return `
    <div class="flexcard">
      <div class="fc-head clean">${ic('upload', 13)} ส่งออกเรียบร้อย</div>
      <div class="fc-body">
        <div class="fc-row"><span>เอกสาร</span><b>${expSum.n} ใบ</b></div>
        <div class="fc-row"><span>ยอดรวม</span><b>${expSum.hasDocs ? mask(money(expSum.total)) : '—'}</b></div>
        <div class="fc-row"><span>ภาษีซื้อรวม</span><b>${expSum.hasDocs ? mask(money(expSum.vat)) : '—'}</b></div>
        <div style="margin-top:6px">${expSum.files.length
          ? expSum.files.map(f => `${ic('paperclip', 11)} ${esc(f)}`).join('<br>')
          : '<span class="muted">ยังไม่มีชุดส่งออกของบริษัทนี้</span>'}</div>
      </div>
      <div class="fc-btns"><button>เปิดไฟล์</button><button>ส่งเข้า Drive</button></div>
    </div>`;
  return '';
}

function lineNext(i) {
  const st = LINE_STEPS[state.lineStep];
  const q = (st.quick || [])[i];
  if (!q) return;
  /* "เริ่มใหม่" = เริ่มฉากที่กำลังดูอยู่ใหม่ ไม่ใช่เด้งไปห้องเริ่มต้นของบทบาท
     ไม่งั้นนักบัญชีที่อยู่ในห้องกลุ่มกดแล้วไปโผล่ในแชท 1-1 · ปุ่ม "เริ่มบทสนทนาใหม่" ด้านบนยังรีเซ็ตทั้งหมดเหมือนเดิม */
  if (q.next === 'start') { lineJump(lineScene().id); return; }
  const nx = LINE_STEPS[q.next];
  if (!nx) return;
  /* ข้ามห้อง (กลุ่ม ↔ แชท 1-1) ต้องขึ้นบทสนทนาใหม่ ไม่ใช่ต่อท้ายของห้องเดิม
     ไม่งั้นบทพูดของคนในกลุ่มจะไปโผล่ในห้องส่วนตัวที่คนอื่นไม่ควรเห็น */
  const sideOf = k => { const s = LINE_SCENES.find(x => x.steps.indexOf(k) > -1); return s ? s.side : 'group'; };
  const crossRoom = sideOf(state.lineStep) !== sideOf(q.next);
  state.lineStep = q.next;
  if (nx.chat) { state.lineChat = nx.chat; state.lineLog = nx.messages.slice(); }
  else if (crossRoom) {
    state.lineChat = LINE_STEPS[sideOf(q.next) === 'one' ? 'office' : 'start'].chat;
    state.lineLog = nx.messages.slice();
  }
  else state.lineLog = state.lineLog.concat(nx.messages);
  render();
  const b = $('#lineBody');
  if (b) b.scrollTop = b.scrollHeight;
}

/* ============================================================
   MODALS
   ============================================================ */
function modal(html) { $('#modalPanel').innerHTML = html; $('#modal').hidden = false; }
function closeModal() { $('#modal').hidden = true; }

function customRangeModal() {
  const g = range();
  modal(`
    <h2>กำหนดช่วงเวลาเอง</h2>
    <p class="small muted">ตัวเลขและกราฟบนหน้าภาพรวมจะนับเฉพาะเอกสารที่อยู่ในช่วงนี้</p>
    <div class="grid c2" style="gap:0.75rem">
      <div class="form-row"><label>ตั้งแต่วันที่</label><input id="rFrom" type="date" value="${esc(g.from < HIST_FROM ? HIST_FROM : g.from)}" min="${HIST_FROM}" max="${TODAY}" /></div>
      <div class="form-row"><label>ถึงวันที่</label><input id="rTo" type="date" value="${esc(g.to)}" max="${TODAY}" /></div>
    </div>
    <div class="modal-foot">
      <button class="btn" data-close-modal>ยกเลิก</button>
      <button class="btn primary" data-act="saverange">ใช้ช่วงเวลานี้</button>
    </div>`);
}

function saveRange() {
  const from = $('#rFrom').value, to = $('#rTo').value;
  if (!from || !to) { toast('เลือกวันที่ให้ครบทั้งสองช่อง', 'err'); return; }
  if (from > to) { toast('วันเริ่มต้นต้องไม่เกินวันสิ้นสุด', 'err'); return; }
  if (from < HIST_FROM) { toast('ข้อมูลย้อนหลังมีถึงแค่ ' + fmtD(HIST_FROM), 'err', 'เลือกวันเริ่มต้นตั้งแต่วันนั้นเป็นต้นไป ไกลกว่านั้นระบบไม่มีข้อมูลให้นับ'); return; }
  state.rangeFrom = from; state.rangeTo = to; state.range = 'custom';
  closeModal();
  toast('ใช้ช่วง ' + fmtD(from) + ' – ' + fmtD(to), 'ok', 'ตัวเลขและกราฟนับเฉพาะช่วงนี้');
  render();
}

function newTaskModal() {
  modal(`
    <h2>มอบหมายงาน</h2>
    <p class="small muted">มอบหมายได้เฉพาะคนที่ระบบเคยเห็นใน <code>group_members</code> — บอทเปิดดูรายชื่อสมาชิกเองไม่ได้</p>
    <div class="form-row"><label>เรื่อง</label><input id="tTitle" placeholder="เช่น ส่งใบเสร็จค่าน้ำมันเดือนนี้" /></div>
    <div class="form-row"><label>ผู้รับผิดชอบ</label>
      <select id="tAssignee">${membersOf().map(m => `<option value="${m.id}"${m.line === '—' ? ' disabled' : ''}>${esc(m.name)}${m.line === '—' ? ' — บอทยังไม่รู้จัก' : ''}</option>`).join('')}</select></div>
    <div class="form-row"><label>ครบกำหนด</label><input id="tDue" type="date" value="2026-09-05" /></div>
    <div class="form-row check"><input type="checkbox" id="tEvidence" /><label for="tEvidence">ต้องแนบหลักฐานตอนปิดงาน</label></div>
    <div class="modal-foot">
      <button class="btn" data-close-modal>ยกเลิก</button>
      <button class="btn primary" data-act="savetask">มอบหมาย</button>
    </div>`);
}

function saveTask() {
  const title = $('#tTitle').value.trim();
  if (!title) { toast('ใส่เรื่องของงานก่อน', 'err'); return; }
  /* งานที่ไม่มีวันครบกำหนดจะขึ้น "ครบกำหนด — · เลยกำหนด" ทันทีที่สร้าง เพราะ overdue() เทียบสตริงว่างกับวันนี้ */
  const due = $('#tDue').value;
  if (!due) { toast('ใส่วันครบกำหนดก่อน', 'err', 'งานที่ไม่มีกำหนดส่ง บอทตามให้ไม่ได้ และจะขึ้นว่าเลยกำหนดทันที'); return; }
  /* บอทผูกงานได้เฉพาะคนที่มี line_user_id แล้ว — กติกานี้ประกาศไว้สามที่บนจอ ต้องบังคับที่จุดสร้างงานจริงด้วย */
  const who = membersOf().find(m => m.id === $('#tAssignee').value);
  if (!who || who.line === '—') {
    toast('ยังมอบหมายให้คนนี้ไม่ได้', 'err', 'บอทยังไม่มี line_user_id ของเขา — ให้เขาพิมพ์ในกลุ่มสักครั้ง หรือแท็กชื่อในข้อความก่อน');
    return;
  }
  const id = 'T-' + (100 + state.tasks.length);
  state.tasks.unshift({
    id, company: state.companyId, type: 'task', title,
    assignee: who.id, by: meId(), byOrg: myOrg(), due,
    status: 'open', evidence: $('#tEvidence').checked, reminded: 0
  });
  logAudit(`มอบหมายงาน ${id}`, '', title);
  closeModal();
  toast('มอบหมายงานแล้ว', 'ok', 'บอทจะแจ้งในสรุปประจำวันรอบถัดไป (1 กลุ่ม = 1 push ต่อวัน)');
  render();
}

/* ============================================================
   RENDER
   ============================================================ */
/* เล่นอนิเมชันเฉพาะตอนที่ภาพเปลี่ยนจริง (เปิดหน้า · สลับบทบาท/บริษัท · เปลี่ยนฟิลเตอร์)
   ไม่ใช่ทุกครั้งที่ re-render เช่นกดปิดงานหรือแก้ฟิลด์ */
let vizSig = null;
function vizSignature() {
  return [state.screen, state.role, state.companyId, state.range, state.rangeFrom, state.rangeTo].join('|');
}

function render() {
  if (state.screen !== 'hub') fallbackIfBlocked();
  renderTop(); renderRolebar(); renderSidebar(); renderSupportBar();
  document.body.classList.toggle('hub-mode', state.screen === 'hub');

  let html;
  if (state.screen === 'hub') html = scHub();
  else switch (state.screen) {
    case 'dashboard': html = scDashboard(); break;
    case 'documents': html = scDocuments(); break;
    case 'tasks': html = scTasks(); break;
    case 'export': html = scExport(); break;
    case 'import': html = scImport(); break;
    case 'members': html = scMembers(); break;
    case 'settings': html = scSettings(); break;
    case 'audit': html = scAudit(); break;
    case 'tenants': html = scTenants(); break;
    case 'permissions': html = scPermissions(); break;
    case 'line': html = scLine(); break;
    default: html = scDashboard();
  }
  const sig = vizSignature();
  const main = $('#main');
  main.classList.toggle('anim', sig !== vizSig);   /* ต้องใส่คลาสก่อนแทรก DOM อนิเมชันถึงจะเล่น */
  vizSig = sig;
  main.innerHTML = html;
  if (state.screen === 'line') { const b = $('#lineBody'); if (b) b.scrollTop = b.scrollHeight; }
}

/* หน้าไหนที่บทบาทนี้เข้าไม่ได้ = ไม่มีอยู่สำหรับเขา — พากลับหน้าแรกของบทบาทเงียบ ๆ */
function fallbackIfBlocked() {
  const item = NAV.flatMap(g => g.items).find(i => i.id === state.screen);
  if (!item || navAllowed(item).ok) return;
  const home = NAV.flatMap(g => g.items).find(i => i.id === ROLES[state.role].home);
  state.screen = (home && navAllowed(home).ok) ? home.id : (allowedItems()[0] || { id: 'permissions' }).id;
  syncHash();
}

function go(screen) { state.screen = screen; closeDrawer(); setNav(false); syncHash(); render(); window.scrollTo(0, 0); }
function closeDrawer() { const d = $('#drawer'); if (d) d.hidden = true; state.openDoc = null; }

/* ---------- ปัญหาจากการใช้งานจริง ----------
   สำนักงานที่ซื้อไปเห็นเฉพาะของตัวเอง · เจ้าของระบบเห็นทุกสำนักงาน  */
const errorTenant = e => (state.companies.find(c => c.id === e.company) || {}).tenant;
const SEV_TH = { high: 'ผู้ใช้เสียงาน', med: 'มีทางเลี่ยง', low: 'ระบบจัดการเอง' };
const SEV_CLS = { high: 'unreadable', med: 'flagged', low: 'neutral' };
const SEV_ORDER = { high: 0, med: 1, low: 2 };
const errorsOfTenant = tid => state.errors
  .filter(e => errorTenant(e) === (tid || state.tenantId))
  .sort((x, y) => SEV_ORDER[x.sev] - SEV_ORDER[y.sev]);

function reportError(id) {
  const e = state.errors.find(x => x.id === id);
  if (!e || e.reported) return;
  e.reported = true;
  e.reportedAt = nowStamp();
  logAudit(`แจ้งปัญหาให้ผู้ให้บริการ — ${e.type}`, '', companyName(e.company));
  toast('แจ้งผู้ให้บริการแล้ว', 'ok', e.type + ' · เจ้าของระบบจะเห็นในรายการปัญหาทันที');
  render();
}

/* ---------- โหมดเข้าไปช่วยสำนักงาน ----------
   ผู้ให้บริการเข้าดูข้อมูลของสำนักงานอื่นได้เฉพาะตอนมีปัญหา ต้องระบุเหตุผล
   มีแถบเตือนค้างตลอดเวลาที่อยู่ข้างใน และทุกอย่างถูกบันทึกพร้อมเหตุผล        */
/* "บ้าน" อ่านจากธง owner ในข้อมูล ไม่ใช่ id ที่จำไว้ — ย้ายธงเมื่อไหร่จะได้ไม่เหลือสองนิยามขัดกัน */
const HOME_TENANT = (state.tenants.find(t => t.owner) || state.tenants[0]).id;
/* คุณตี๋ยืนอยู่ที่สำนักงานตัวเอง = สวมหมวกเจ้าของระบบ
   ระหว่างเข้าไปช่วยสำนักงานอื่น จะเห็นหน้าจอแบบเดียวกับที่คนของสำนักงานนั้นเห็น ซึ่งคือเป้าหมายของโหมดนี้ */
const asPlatform = () => state.role === 'office_admin' && !!tenant().owner;
const SUPPORT_REASONS = [
  'ผู้ใช้แจ้งว่าบอทไม่ตอบในกลุ่ม',
  'เชื่อม Google Drive ไม่สำเร็จ / Drive เต็ม',
  'ผูก LINE OA ของสำนักงานไม่ผ่าน',
  'ไฟล์หายหรือ OCR ค้างในคิว',
  'ตรวจสอบตัวเลขที่ลูกค้าแจ้งว่าไม่ตรง'
];

function supportModal(tid) {
  const t = tenantOf(tid);
  modal(`
    <h2>เข้าไปช่วย ${esc(t.name)}</h2>
    <p class="small muted">คุณกำลังจะเปิดดูข้อมูลของสำนักงานอื่น — ระบุเหตุผลก่อน ระบบจะบันทึกไว้พร้อมชื่อคุณและเวลา</p>
    <div class="form-row">
      <label>เหตุผลที่ต้องเข้าไปดู</label>
      <select id="supReason">
        ${SUPPORT_REASONS.map(r => `<option>${esc(r)}</option>`).join('')}
        <option value="__other">อื่น ๆ — พิมพ์เอง</option>
      </select>
    </div>
    <div class="form-row"><label>รายละเอียดเพิ่มเติม (ไม่บังคับ)</label><input id="supNote" placeholder="เช่น เคส E-06 Drive เต็มตั้งแต่ 27 ส.ค." /></div>
    <div class="issue" style="margin:0">
      ${ic('alertTriangle', 15)}
      <div><b>ระหว่างอยู่ในโหมดนี้</b> จะมีแถบสีค้างอยู่บนสุดตลอด และทุกการกระทำถูกบันทึกแยกไว้ว่าทำในโหมดช่วยเหลือ</div>
    </div>
    <div class="modal-foot">
      <button class="btn" data-close-modal>ยกเลิก</button>
      <button class="btn primary" data-act="startsupport" data-tid="${tid}">เริ่มเข้าไปช่วย</button>
    </div>`);
}

function startSupport(tid) {
  if (tid === HOME_TENANT) { closeModal(); if (state.support) endSupport(); return; }
  const sel = $('#supReason'), note = $('#supNote');
  let reason = sel.value === '__other' ? (note.value.trim() || 'ไม่ระบุ') : sel.value;
  if (sel.value !== '__other' && note.value.trim()) reason += ' — ' + note.value.trim();
  state.support = { tenant: tid, reason, since: nowStamp() };
  /* ลงบันทึกก่อนสลับ tenant — ไม่งั้นแถว "เริ่ม" ไปผูกกับบริษัทของสำนักงานปลายทาง แล้วหายจากประวัติทันทีที่กลับบ้าน */
  logAudit(`เริ่มโหมดช่วยเหลือ ${tenantName(tid)}`, '', reason);
  state.tenantId = tid;
  const list = roleCompanies();
  if (!list.includes(state.companyId)) state.companyId = list[0];
  closeModal();
  toast('เข้าโหมดช่วยเหลือแล้ว', 'err', tenantName(tid) + ' · ' + reason);
  go('dashboard');
}

function endSupport() {
  const t = state.support;
  state.support = null;
  state.tenantId = HOME_TENANT;
  const list = roleCompanies();
  if (!list.includes(state.companyId)) state.companyId = list[0];
  logAudit(`ออกจากโหมดช่วยเหลือ ${tenantName(t.tenant)}`, t.reason, 'กลับสำนักงานตัวเอง');
  toast('ออกจากโหมดช่วยเหลือแล้ว', 'ok', 'กลับมาที่ ' + tenantName(HOME_TENANT));
  render();
}

function renderSupportBar() {
  const bar = $('#supportBar');
  if (!bar) return;
  const s = state.support;
  bar.hidden = !s;
  if (!s) { document.documentElement.style.setProperty('--sb-h', '0px'); return; }
  const t = tenantOf(s.tenant);
  bar.innerHTML = `
    <span class="sb-dot" style="background:${t.color}"></span>
    <div class="sb-text">
      <b>โหมดช่วยเหลือ · กำลังดูข้อมูลของ ${esc(t.name)}</b>
      <span>เหตุผล: ${esc(s.reason)} · เริ่ม ${esc(s.since)} · ทุกการกระทำถูกบันทึกไว้</span>
    </div>
    <button class="btn small" data-act="endsupport">${ic('arrowLeft', 13)} ออกจากโหมดช่วยเหลือ</button>`;
  /* แถบบทบาทต้องหยุดใต้แถบนี้พอดี — ความสูงเปลี่ยนตามความยาวเหตุผลและความกว้างจอ จึงวัดเอาทุกครั้ง */
  document.documentElement.style.setProperty('--sb-h', bar.offsetHeight + 'px');
}

/* คำขออนุมัติต้องให้ "ผู้รับผิดชอบของคำขอนั้น" เป็นคนกดเท่านั้น
   มีสิทธิ์ task_approve อย่างเดียวไม่พอ — ไม่งั้นคนยื่นคำขออนุมัติให้ตัวเองได้ */
function mayApprove(t) { return can('task_approve').ok && t.assignee === meId(); }

/* ตัวกรองเริ่มต้นของหน้าเอกสาร — คนที่งานคือ "ตรวจ" ควรเปิดมาเจอกองงานของตัวเอง ไม่ใช่ทะเบียนทั้งหมด
   ตรวจใบไหนผ่านแล้วใบนั้นหายจากรายการทันที (แต่ยังอยู่ในทะเบียน กดชิป "ทั้งหมด" ก็เห็น) */
/* หน้าเอกสารเปิดมาที่ "ต้องตรวจ" เสมอ — คนที่เข้าถึงหน้านี้ได้คือคนที่มีงานตรวจ
   ทะเบียนทั้งหมดยังกดดูได้ตลอดจากชิป "ทั้งหมด" */
const defaultFilter = () => 'flagged';

function pickRole(r) {
  state.role = r;
  state.companyId = roleCompanies(r)[0];
  state.docFilter = defaultFilter();
  state.docQuery = ''; state.allCos = false;
  resetLine();
  go(ROLES[r].home);
  toast('เข้าใช้งานในสิทธิ์ ' + ROLES[r].th, 'ok', ROLES[r].scope);
}

function goHub() { state.screen = 'hub'; closeDrawer(); syncHash(); render(); window.scrollTo(0, 0); }

/* deep link:  #owner/documents  — เปิดตรงบทบาท/หน้าที่ต้องการได้เลย */
const SCREEN_IDS = () => NAV.flatMap(g => g.items).map(i => i.id).concat('hub');
function syncHash() {
  const h = state.screen === 'hub' ? 'hub' : state.role + '/' + state.screen;
  /* pushState ไม่ใช่ replaceState — ไม่งั้นปุ่ม back ของเบราว์เซอร์พาออกจาก prototype ทันที
     และตัวจัดการ hashchange ที่เขียนไว้ก็ไม่มีวันถูกเรียก */
  if (location.hash.slice(1) !== h) history.pushState(null, '', '#' + h);
}
window.addEventListener('popstate', () => { applyHash(); closeDrawer(); render(); });
function applyHash() {
  const raw = decodeURIComponent(location.hash.slice(1));
  if (!raw || raw === 'hub') { state.screen = 'hub'; resetLine(); return; }
  const [r, s] = raw.split('/');
  if (ROLES[r]) {
    state.role = r;
    state.companyId = roleCompanies(r)[0];
    state.screen = ROLES[r].home;
  }
  if (s && SCREEN_IDS().includes(s)) state.screen = s;
  resetLine();
}
window.addEventListener('hashchange', () => { applyHash(); closeDrawer(); render(); });

/* ============================================================
   EVENTS
   ============================================================ */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-pickrole],[data-nav],[data-act],[data-filter],[data-range],[data-switchco],[data-support],[data-report],[data-topup],[data-tmock],[data-cell],[data-editrole],[data-setcap],[data-bulk],[data-resetrole],[data-tasktab],[data-taskstatus],[data-catdel],[data-catoff],[data-catco],[data-doc],[data-editfield],[data-savefield],[data-canceledit],[data-linescene],[data-done],[data-reopen],[data-accept],[data-approve],[data-reject],[data-askrole],[data-qr],[data-close-drawer],[data-close-modal]');
  if (!t) return;

  if (t.hasAttribute('data-close-drawer')) { $('#drawer').hidden = true; return; }
  if (t.hasAttribute('data-close-modal')) { closeModal(); return; }

  if (t.dataset.pickrole) { pickRole(t.dataset.pickrole); return; }
  if (t.dataset.nav) { go(t.dataset.nav); return; }
  if (t.dataset.cell) {
    const [capId, roleId] = t.dataset.cell.split('|');
    state.editRole = roleId; state.editCap = capId;
    render();
    const el = $('#roleEditor');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  if (t.dataset.editrole) { state.editRole = t.dataset.editrole; state.editCap = null; render(); return; }
  if (t.dataset.setcap) {
    const [capId, roleId, val] = t.dataset.setcap.split('|');
    state.editCap = capId;
    setCap(capId, roleId, val); return;
  }
  if (t.dataset.bulk) {
    const [roleId, lv, val] = t.dataset.bulk.split('|');
    bulkLevel(roleId, lv, val); return;
  }
  if (t.dataset.resetrole) { resetRole(t.dataset.resetrole); return; }
  if (t.dataset.support) { supportModal(t.dataset.support); return; }
  if (t.dataset.report) { reportError(t.dataset.report); return; }
  if (t.dataset.topup) { topupModal(t.dataset.topup); return; }
  if (t.dataset.tmock) { TENANT_MOCKS[t.dataset.tmock](t.dataset.tid ? tenantOf(t.dataset.tid) : null); return; }
  if (t.dataset.switchco) {
    if (!can('switch_company').ok) { denied('switch_company'); return; }
    closeDrawer();
    state.companyId = t.dataset.switchco;
    logAudit('สลับบริษัทจากหน้าภาพรวม', '', companyName(t.dataset.switchco));
    render(); return;
  }
  if (t.dataset.filter) { state.docFilter = t.dataset.filter; render(); return; }
  if (t.dataset.act === 'clearq') { state.docQuery = ''; render(); return; }
  if (t.dataset.act === 'clearqt') { state.taskQuery = ''; render(); return; }
  if (t.dataset.range) {
    if (t.dataset.range === 'custom') { customRangeModal(); return; }
    state.range = t.dataset.range; render(); return;
  }
  if (t.dataset.tasktab) { state.taskTab = t.dataset.tasktab; render(); return; }
  if (t.dataset.taskstatus) { state.taskStatus = t.dataset.taskstatus; render(); return; }
  if (t.dataset.catco != null) {
    /* ปิด/เปิดหมวดของบริษัทตัวเอง — เป็นสิทธิ์ระดับบริษัท ไม่ใช่ระดับสำนักงาน
       เจ้าของรู้ดีที่สุดว่าธุรกิจตัวเองมีค่าใช้จ่ายประเภทไหน */
    if (!can('company_settings').ok) { renderTop(); denied('company_settings'); return; }
    const c = t.dataset.catco;
    if (catIsOff(c)) { toast('หมวดนี้สำนักงานเลิกใช้ไปแล้ว', 'err', 'ปิดหรือเปิดที่ระดับบริษัทไม่ได้'); return; }
    const list = state.catCoOff[state.companyId] || (state.catCoOff[state.companyId] = []);
    const i = list.indexOf(c), n = catCountCo(c);
    if (i > -1) {
      list.splice(i, 1);
      logAudit('เปิดหมวดค่าใช้จ่ายของบริษัท', c, company().name);
      toast(`เปิด "${c}" แล้ว`, 'ok', 'กลับมาให้เลือกได้ และ AI จะพิจารณาหมวดนี้อีกครั้ง');
    } else {
      list.push(c);
      logAudit('ปิดหมวดค่าใช้จ่ายของบริษัท', c, company().name);
      toast(`ปิด "${c}" สำหรับ ${company().name}`, 'ok',
        n ? `ใบเดิม ${n} ใบยังอยู่หมวดนี้เหมือนเดิม · บริษัทอื่นยังใช้หมวดนี้ได้ตามปกติ`
          : 'บริษัทอื่นยังใช้หมวดนี้ได้ตามปกติ');
    }
    render(); return;
  }
  if (t.dataset.catoff != null) {
    if (!can('office_settings').ok) { renderTop(); denied('office_settings'); return; }
    const c = catsOf()[+t.dataset.catoff];
    const off = state.catOff[state.tenantId] || (state.catOff[state.tenantId] = []);
    const i = off.indexOf(c);
    if (i > -1) { off.splice(i, 1); logAudit('เปิดใช้หมวดค่าใช้จ่ายอีกครั้ง', c, '—'); toast(`เปิดใช้ "${c}" แล้ว`, 'ok', 'กลับมาเลือกได้กับใบใหม่'); }
    else { off.push(c); logAudit('ระงับหมวดค่าใช้จ่าย', c, '—'); toast(`ระงับ "${c}" แล้ว`, 'ok', `ใบใหม่เลือกหมวดนี้ไม่ได้ · ใบเดิม ${catCount(c)} ใบยังอยู่หมวดนี้เหมือนเดิม`); }
    render(); return;
  }
  if (t.dataset.catdel != null) {
    if (!can('office_settings').ok) { denied('office_settings'); return; }
    const list = state.categories[state.tenantId], i = +t.dataset.catdel, name = list[i];
    if (catCount(name)) { toast('ลบไม่ได้', 'err', `ยังมีเอกสาร ${catCount(name)} ใบอยู่ในหมวดนี้ — ย้ายออกก่อน`); return; }
    list.splice(i, 1);
    logAudit('ลบหมวดค่าใช้จ่าย', name, 'ถูกลบออกจากผัง');
    toast(`ลบหมวด "${name}" แล้ว`, 'ok', 'AI จะไม่เลือกหมวดนี้อีก');
    render(); return;
  }
  if (t.dataset.doc) { openDoc(t.dataset.doc); return; }
  /* ปุ่มถูกซ่อนไว้แล้วเมื่อไม่มีสิทธิ์ แต่ handler ต้องกันซ้ำ — กติกาข้อ 7 ในเอกสาร 11
     ห้ามพึ่ง UI อย่างเดียว เพราะปุ่มถูกเรียกจาก keyboard และ deep link ได้ */
  if (t.dataset.editfield) {
    if (!can('review').ok) { denied('review'); return; }
    startEditField(t.dataset.editfield); return;
  }
  if (t.dataset.savefield) {
    if (!can('review').ok) { denied('review'); return; }
    saveEditField(t.dataset.savefield); return;
  }
  if (t.dataset.canceledit) { openDoc(state.openDoc); return; }
  if (t.dataset.qr != null) { lineNext(+t.dataset.qr); return; }
  if (t.dataset.linescene) { lineJump(t.dataset.linescene); return; }

  if (t.dataset.done) {
    const task = state.tasks.find(x => x.id === t.dataset.done);
    /* ด่านหลัง — ปุ่มถูกซ่อนไปแล้วก็จริง แต่ postback ยังยิงเข้ามาได้ ต้องเช็กซ้ำตอนรับเสมอ */
    if (!mayClose(task)) {
      toast('ปิดงานนี้ไม่ได้', 'err',
        `${task.id} เป็นงานของ ${orgName(task.company)} ที่สั่งโดย ${orgName(byOrgOf(task))} — ${orgName(myOrg())} ไม่ได้อยู่ในสองฝั่งนี้`);
      logAudit(`พยายามปิดงาน ${task.id} แต่ถูกปฏิเสธ`, 'open', 'denied');
      render(); return;
    }
    task.status = 'done'; task.completedBy = meId(); task.completedAt = nowStamp();
    /* ผู้สั่งกดปิดเอง = รับงานไปในตัว ไม่ต้องมาตรวจรับงานของตัวเองอีกรอบ */
    task.acceptedAt = crossOrg(task) && myOrg() !== byOrgOf(task) ? null : task.completedAt;
    logAudit(`ปิดงาน ${task.id}`, 'open', 'done');
    toast(`ปิดงาน ${task.id} แล้ว`, 'ok', task.acceptedAt
      ? `บันทึก completed_by = ${uname(meId())} (แยกจากผู้รับผิดชอบ ${uname(task.assignee)})`
      : `บันทึก completed_by = ${uname(meId())} · ส่งให้ ${orgName(byOrgOf(task))} ตรวจรับ ไม่กดภายใน 7 วันถือว่ารับเอง`);
    render(); return;
  }
  /* B-14 — การตรวจรับไม่เปลี่ยนสถานะงาน มันแค่ปิดหน้าต่างเปิดงานกลับก่อนกำหนด
     งานยัง done เหมือนเดิม ตัวเลข % เสร็จ บนแดชบอร์ดจึงไม่ขยับเพราะปุ่มนี้ */
  if (t.dataset.accept) {
    const task = state.tasks.find(x => x.id === t.dataset.accept);
    if (!mayAccept(task)) { toast('รับงานนี้ไม่ได้', 'err', 'ตรวจรับได้เฉพาะฝ่ายที่เป็นผู้สั่งงาน'); return; }
    task.acceptedAt = nowStamp();
    logAudit(`ตรวจรับงาน ${task.id}`, 'ปิดแล้ว · รอตรวจรับ', `รับโดย ${uname(meId())}`);
    toast(`ตรวจรับ ${task.id} แล้ว`, 'ok', 'ปิดหน้าต่างเปิดงานกลับทันที — จากนี้ถ้าจะแก้ต้องสั่งงานใหม่');
    render(); return;
  }
  if (t.dataset.reopen) {
    const task = state.tasks.find(x => x.id === t.dataset.reopen);
    if (!mayReopen(task)) {
      toast('เปิดงานกลับไม่ได้', 'err', 'พ้นหน้าต่าง 7 วันแล้ว หรือไม่ได้อยู่ในองค์กรที่เกี่ยวข้องกับงานนี้');
      return;
    }
    task.status = 'open';
    delete task.completedBy; delete task.completedAt; delete task.decision; delete task.acceptedAt;
    logAudit(`เปิดงาน ${task.id} ใหม่`, 'done', 'open'); render(); return;
  }
  if (t.dataset.approve || t.dataset.reject) {
    const id = t.dataset.approve || t.dataset.reject;
    const ok = !!t.dataset.approve;
    const task = state.tasks.find(x => x.id === id);
    /* ด่านหลัง — ปุ่มอาจถูกซ่อนไว้แล้ว แต่ postback/คลิกยังเข้ามาได้ ต้องเช็กซ้ำเสมอ */
    if (!mayApprove(task)) { denied('task_approve'); return; }
    task.status = 'done'; task.completedBy = meId(); task.completedAt = nowStamp();
    task.decision = ok ? 'approve' : 'reject';
    logAudit(`${ok ? 'อนุมัติ' : 'ปฏิเสธ'}คำขอ ${id}`, 'รออนุมัติ', ok ? 'อนุมัติ' : 'ปฏิเสธ');
    toast(ok ? 'อนุมัติแล้ว' : 'ปฏิเสธแล้ว', ok ? 'ok' : 'err', 'ใช้ตาราง tasks ร่วมกัน (type = approval) ตาม B-12');
    render(); return;
  }
  if (t.dataset.askrole) {
    const m = state.members.find(x => x.id === t.dataset.askrole);
    const id = 'T-' + (100 + state.tasks.length);
    state.tasks.unshift({
      id, company: state.companyId, type: 'approval',
      title: `ขอเปลี่ยนสิทธิ์ของ "${m.name}" — ผู้ขอ: ${role().th}`,
      assignee: company().owner, by: meId(), byOrg: myOrg(), due: dayAdd(TODAY, 2), status: 'open', evidence: false, reminded: 0
    });
    logAudit(`ขออนุมัติเปลี่ยน role ของ ${m.name}`, m.role, 'รออนุมัติ');
    toast('ส่งคำขออนุมัติให้เจ้าของแล้ว', 'ok', `สร้าง ${id} ในตาราง tasks (type = approval)`);
    go('tasks'); return;
  }

  const act = t.dataset.act;
  if (!act) return;
  if (act.startsWith('deny:')) { denied(act.slice(5)); return; }
  if (act.startsWith('pickimport:')) { state.importSrc = act.slice(11) || null; render(); return; }
  switch (act) {
    case 'goline': go('line'); break;
    case 'goexport': go('export'); break;
    case 'gotasks': go('tasks'); break;
    case 'resetline': resetLine(); render(); break;
    case 'newtask': newTaskModal(); break;
    case 'savetask': saveTask(); break;
    case 'dotopup': doTopup(t.dataset.tid); break;
    case 'startsupport': startSupport(t.dataset.tid); break;
    case 'endsupport': endSupport(); break;
    case 'resetcaps': resetCaps(); break;
    case 'saverange': saveRange(); break;
    case 'doexport': can('export').ok ? doExport() : denied('export'); break;
    /* ใบที่อ่านไม่ออก: ทางแก้คือให้คนที่ส่งไปถ่ายใหม่ ไม่ใช่ให้คนตรวจนั่งคีย์มือทั้งใบ
       assignee = ผู้ส่งใบนั้น (d.by) · created_by = คนที่กดปุ่ม — สองคนนี้ต้องแยกกันเสมอ */
    case 'reshoot': {
      const d = state.docs.find(x => x.id === state.openDoc);
      if (!can('review').ok) { denied('review'); break; }
      /* ต้องเขียนสถานะกลับลงใบ ไม่งั้นกดกี่ครั้งก็ได้งานชื่อเดียวกันซ้ำ และตัวใบไม่มีร่องรอยว่าเคยสั่งถ่ายใหม่ */
      if (d.reshoot) { toast('ขอให้ถ่ายใหม่ไปแล้ว', 'err', `งาน ${d.reshoot.task} ยังค้างอยู่ — รอคนที่ถือใบจริงถ่ายกลับมา`); break; }
      const id = 'T-' + (100 + state.tasks.length);
      state.tasks.unshift({
        id, company: d.company, type: 'task',
        title: `ถ่ายเอกสาร ${d.id} ใหม่ — ${(d.issues[0] || {}).msg || 'ภาพอ่านข้อมูลไม่ออก'}`,
        assignee: d.by, by: meId(), byOrg: myOrg(), due: dayAdd(TODAY, 7), status: 'open', evidence: true, reminded: 0
      });
      d.reshoot = { at: nowStamp(), by: meId(), task: id };
      logAudit(`ขอให้ถ่าย ${d.id} ใหม่`, '', `สร้างงาน ${id} ให้ ${uname(d.by)}`, d.company);
      toast('สร้างงานให้ถ่ายใหม่แล้ว', 'ok',
        `${id} · ผู้รับผิดชอบ ${uname(d.by)} — บอทจะแจ้งในกลุ่มไลน์ให้ และไฟล์เดิมยังอยู่ในโฟลเดอร์ _รอตรวจสอบ`);
      $('#drawer').hidden = true; go('tasks'); break;
    }
    /* ผูก / เปลี่ยน / ยกเลิก Drive เป็นสิทธิ์ 2b ของเจ้าของ — คนอื่นกดได้แต่ต้องถูกปฏิเสธและถูกบันทึก
       ใช้ drive_link ไม่ใช่ company_settings เพราะ office_admin มี company_settings เต็ม
       ซึ่งจะทำให้สำนักงานสลับบัญชี Drive ของลูกค้าได้เอง ขัดกับที่หน้าสิทธิ์ประกาศไว้ */
    case 'linkdrive': {
      if (!can('drive_link').ok) { denied('drive_link'); break; }
      const co = company(), was = driveOf(co).th;
      co.driveState = 'linked';
      /* บริษัทที่ไม่เคยผูกมาก่อนยังไม่มีบัญชีปลายทาง — ตั้งจากชื่อโฟลเดอร์ที่ตกลงกันไว้ ไม่งั้น audit บันทึกคำว่า undefined */
      if (!co.driveAcct) co.driveAcct = 'admin@' + co.drive.split('/').pop().toLowerCase() + '.co.th';
      if (co.driveUsed >= co.driveQuota) co.driveUsed = +(co.driveQuota * 0.2).toFixed(1);
      logAudit('ผูก Google Drive', was, `เชื่อมต่อแล้ว · ${co.driveAcct}`);
      toast('ผูก Drive แล้ว', 'ok', `${co.drive} — ไฟล์ที่ค้างใน staging จะถูกเขียนขึ้น Drive ให้อัตโนมัติ`);
      render(); break;
    }
    case 'switchdrive': {
      if (!can('drive_link').ok) { denied('drive_link'); break; }
      const co = company(), was = co.driveAcct;
      /* ต้นฉบับอยู่ฝั่งระบบ (มติ B-5/B-6) การเปลี่ยนบัญชีจึงเป็นการสร้างสำเนาใหม่ ไม่ใช่การย้ายของ
         ไฟล์ในบัญชีเดิมไม่ถูกลบ เพราะเราไม่มีสิทธิ์ลบของในบัญชีที่เพิ่งถูกถอนสิทธิ์ไปแล้ว */
      co.driveAcct = 'finance@' + (co.name.replace(/[^A-Za-z]/g, '').toLowerCase() || 'company') + '.co.th';
      co.driveState = 'linked';
      co.driveUsed = +(co.driveQuota * 0.05).toFixed(1);
      logAudit('เปลี่ยนบัญชี Google Drive', was, co.driveAcct);
      toast('เปลี่ยนบัญชี Drive แล้ว', 'ok',
        `ระบบกำลังคัดลอกไฟล์ทั้งหมดจากที่เก็บหลักไปบัญชีใหม่ · ไฟล์ในบัญชีเดิม (${was}) ไม่ถูกลบ ต้องลบเอง`);
      render(); break;
    }
    case 'unlinkdrive': {
      if (!can('drive_link').ok) { denied('drive_link'); break; }
      const co = company();
      co.driveState = 'none';
      logAudit('ยกเลิกการผูก Google Drive', 'เชื่อมต่อแล้ว', 'ยังไม่ได้ผูก');
      toast('ยกเลิกการผูกแล้ว', 'err', 'ไฟล์เดิมยังอยู่ใน Drive ของคุณ — แต่ของใหม่จะค้างใน staging จนกว่าจะผูกใหม่');
      render(); break;
    }
    /* ปิดหมวดที่ไฟล์เดิมไม่เคยใช้ — สวิตช์ชุดเดียวกับหน้าตั้งค่าบริษัท แต่ตั้งจากหลักฐานแทนความจำ */
    case 'catsuggest': {
      if (!can('company_settings').ok) { denied('company_settings'); break; }
      const src = IMPORT_SOURCES.find(x => x.id === state.importSrc);
      if (!src || !src.catMap) { toast('เลือกที่มาที่มีหมวดก่อน', 'err'); break; }
      const used = new Set(src.catMap.filter(m => m.to).map(m => m.to));
      const unused = catsOf().filter(c => !used.has(c) && !catIsOff(c) && !catIsCoOff(c));
      if (!unused.length) { toast('ไม่มีหมวดที่ต้องปิดเพิ่ม', 'ok'); break; }
      const list = state.catCoOff[state.companyId] || (state.catCoOff[state.companyId] = []);
      unused.forEach(c => list.push(c));
      logAudit('ปิดหมวดตามที่พบในไฟล์เดิม', src.name, unused.join(' · '));
      toast(`ปิด ${unused.length} หมวดให้ ${company().name} แล้ว`, 'ok',
        `${unused.join(' · ')} — เปิดคืนได้ที่หน้าตั้งค่าบริษัท`);
      render(); break;
    }
    case 'askcat': {
      const src = IMPORT_SOURCES.find(x => x.id === state.importSrc);
      const miss = ((src || {}).catMap || []).filter(m => !m.to);
      if (can('office_settings').ok) { go('settings'); break; }
      logAudit('ขอให้สำนักงานเพิ่มหมวดค่าใช้จ่าย', company().name, miss.map(m => m.from).join(' · '));
      toast('ส่งคำขอให้สำนักงานแล้ว', 'ok',
        `ขอเพิ่ม ${miss.length} หมวด — สำนักงานเป็นผู้ตัดสินว่าจะใช้ชื่ออะไรในผังกลาง เพราะต้องตรงกับโปรแกรมบัญชีปลายทาง`);
      render(); break;
    }
    case 'doimport': {
      const co = company(), src = IMPORT_SOURCES.find(s => s.id === state.importSrc);
      if (!src) { toast('เลือกที่มาก่อน', 'err'); break; }
      if (!driveReady(co)) { toast('ต้องผูก Drive ก่อน', 'err', 'ระบบไม่รับของเก่าเข้ามาถ้ายังไม่มีที่เก็บปลายทาง'); break; }
      state.imports = state.imports || [];
      const id = 'IMP-' + String(state.imports.filter(i => i.company === state.companyId).length + 1).padStart(2, '0')
        + '-' + state.companyId.toUpperCase();
      const cost = +(src.pages * state.bahtPerPage).toFixed(2);
      /* ไม่มี code path ไหน push เข้า state.docs เลย ปุ่มนี้จึงทำได้แค่ "ตั้งคิว"
         ทุกข้อความจึงต้องพูดว่ารอประมวลผล ห้ามเขียนว่าเอกสารเข้าระบบแล้ว ไม่งั้น audit_log เก็บเหตุการณ์ที่ไม่เคยเกิด */
      if (state.imports.some(i => i.company === state.companyId && i.src === src.name)) {
        toast('ที่มานี้ตั้งคิวไว้แล้ว', 'err', 'คิวเดิมยังไม่ถูกประมวลผล — ตั้งซ้ำจะกลายเป็นใบชุดเดียวกันสองรอบ');
        break;
      }
      state.imports.unshift({ id, company: state.companyId, src: src.name, n: src.readable, dup: src.dup, cost, at: nowStamp() });
      logAudit(`ตั้งคิวนำเข้าข้อมูลเดิม ${id}`, src.name, `รอประมวลผล ${src.readable} ใบ · ข้ามซ้ำ ${src.dup} · ค่าอ่านที่จะเกิด ${money(cost)} บาท`);
      toast(`ตั้งคิวนำเข้า ${src.readable} ใบแล้ว`, 'ok',
        `${id} · ยังไม่มีเอกสารเข้าทะเบียนจนกว่าคิวจะถูกประมวลผล · ข้ามที่ซ้ำ ${src.dup} ใบ · ${cost ? 'ค่าอ่านที่จะเกิด ' + money(cost) + ' บาท' : 'ไม่มีค่าอ่านเพราะเป็นไฟล์ตาราง'}`);
      state.importSrc = null; render(); break;
    }
    case 'catadd': {
      if (!can('office_settings').ok) { denied('office_settings'); break; }
      const el = $('#catNew'), name = (el ? el.value : '').trim();
      if (!name) { toast('พิมพ์ชื่อหมวดก่อน', 'err'); break; }
      const list = state.categories[state.tenantId];
      if (list.indexOf(name) > -1 || name === UNCAT) { toast('มีหมวดนี้อยู่แล้ว', 'err'); break; }
      list.push(name);
      logAudit('เพิ่มหมวดค่าใช้จ่าย', '', name);
      toast(`เพิ่มหมวด "${name}" แล้ว`, 'ok', `ผังของ ${tenant().name} มี ${list.length} หมวด — AI จะเริ่มเลือกหมวดนี้ได้ทันที`);
      render(); break;
    }
    case 'confirmdoc': {
      const d = state.docs.find(x => x.id === state.openDoc);
      if (!can('review').ok) { denied('review'); break; }
      if (d.company !== state.companyId) { toast('เอกสารนี้ไม่ใช่ของบริษัทที่เปิดอยู่', 'err'); break; }
      /* บันทึกคนรับรอง — บอทในไลน์บอกผู้ใช้ว่า "บันทึกว่า...เป็นคนยืนยัน" (data.js) และคอมเมนต์ในหน้านี้
         เขียนเองว่าการยืนยัน "ระบุคนรับผิดชอบชัดเจน" ทั้งที่เดิมไม่เขียนอะไรลงใบเลย */
      const flags = d.issues.length;
      d.status = 'clean'; d.issues = [];
      d.confirmedBy = meId(); d.confirmedAt = nowStamp();
      logAudit(`ยืนยันความถูกต้องของ ${d.id}`, `ติดธง ${flags} จุด`, `รับรองโดย ${uname(meId())}`, d.company);
      toast('ยืนยันแล้ว', 'ok', `บันทึกว่า ${uname(meId())} เป็นผู้รับรอง · ปลดธง ${flags} จุด`);
      $('#drawer').hidden = true; render(); break;
    }
    case 'togglefv': {
      const co = company();
      /* ต้องอ่านค่าเดิมไว้ก่อนสลับ ไม่งั้นคอลัมน์ ก่อน/หลัง ในประวัติการใช้งานจะเป็นค่าเดียวกันทุกแถว */
      const wasFv = co.financial_visibility;
      co.financial_visibility = !wasFv;
      logAudit('เปลี่ยน financial_visibility', wasFv ? 'เปิด' : 'ปิด', co.financial_visibility ? 'เปิด' : 'ปิด');
      toast(`financial_visibility = ${co.financial_visibility ? 'เปิด' : 'ปิด'}`, 'ok',
        'ลองสลับไปบทบาท "สมาชิกในกลุ่ม" แล้วดูว่าตัวเลขหายไปไหม');
      render(); break;
    }
    case 'unbind': {
      if (!can('bind_group').ok) { denied('bind_group'); break; }
      /* ยังไม่ต่อระบบหลังบ้าน จึงห้ามเขียนประวัติว่ายกเลิกไปแล้ว ทั้งที่ทุกจอยังแสดงว่ากลุ่มผูกอยู่ */
      mockModal('ยกเลิกการผูกกลุ่มไลน์',
        `กลุ่มที่ผูกอยู่ตอนนี้คือ <b>${esc(company().group)}</b>`,
        ['ยืนยันซ้ำว่าจะตัดกลุ่มนี้จริง', 'บอทออกจากกลุ่ม ไฟล์ที่ส่งเข้ามาหลังจากนั้นจะไม่ถูกเก็บ', 'เอกสารเดิมยังอยู่ในทะเบียนตามเดิม'],
        '2b พลาด = ระบบหยุดทำงานทั้งบริษัท — ของจริงต้องมีขั้นยืนยันซ้ำ ยังไม่ได้ต่อในต้นแบบนี้');
      break;
    }
  }
});

/* ช่องค้นหาเอกสาร — หน้าจอถูกวาดใหม่ทั้งหน้าทุกครั้งที่พิมพ์ ต้องคืนโฟกัสกับตำแหน่งเคอร์เซอร์เอง
   ไม่งั้นพิมพ์ได้ตัวเดียวแล้วโฟกัสหลุด */
document.addEventListener('input', e => {
  const map = { docSearch: 'docQuery', taskSearch: 'taskQuery' };
  const key = map[e.target.id];
  if (!key) return;
  const pos = e.target.selectionStart, id = e.target.id;
  state[key] = e.target.value;
  render();
  const el = $('#' + id);
  if (el) { el.focus(); try { el.setSelectionRange(pos, pos); } catch (_) { } }
});

document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'roleSelect') {
    state.role = t.value;
    const list = roleCompanies();
    if (!list.includes(state.companyId)) state.companyId = list[0];
    state.screen = ROLES[state.role].home;
    state.docFilter = defaultFilter();
    state.docQuery = ''; state.allCos = false;
    closeDrawer();
    resetLine();
    syncHash();
    render();
    toast('สลับเป็น ' + ROLES[state.role].th, 'ok', ROLES[state.role].scope);
    return;
  }
  if (t.id === 'docCoSelect' || t.id === 'taskCoSelect') {
    /* เลือกบริษัทจากหน้าเอกสาร/หน้างาน — ให้ตรงกับตัวสลับบริษัทด้านบนเสมอ จะได้ไม่มีสองค่าที่ขัดกัน */
    if (t.value === '__all') { state.allCos = true; }
    else { state.allCos = false; state.companyId = t.value; closeDrawer(); }
    render(); return;
  }
  if (t.id === 'acctSelect') {
    /* สลับมุมมองว่าเป็นนักบัญชีคนไหน — บริษัทที่เห็นเปลี่ยนตามตารางมอบหมายของคนนั้น */
    state.acctId = t.value;
    const mine = roleCompanies();
    if (mine.indexOf(state.companyId) < 0) state.companyId = mine[0] || state.companyId;
    closeDrawer();
    toast('ดูในมุมของ ' + uname(state.acctId), 'ok',
      mine.length ? 'ได้รับมอบหมาย ' + mine.length + ' บริษัท: ' + mine.map(companyName).join(' · ')
        : 'ยังไม่ได้รับมอบหมายบริษัทไหนเลย');
    render(); return;
  }
  if (t.id === 'companySelect') {
    if (!can('switch_company').ok) { renderTop(); denied('switch_company'); return; }
    closeDrawer();
    state.companyId = t.value;
    logAudit('สลับบริษัท', '', companyName(t.value));
    render(); return;
  }
  if (t.dataset.catname != null) {
    if (!can('office_settings').ok) { renderTop(); denied('office_settings'); return; }
    const list = state.categories[state.tenantId], i = +t.dataset.catname, was = list[i];
    const name = t.value.trim();
    if (!name) { toast('ชื่อหมวดว่างไม่ได้', 'err'); render(); return; }
    if (list.some((c, j) => j !== i && c === name)) { toast('มีหมวดชื่อนี้อยู่แล้ว', 'err'); render(); return; }
    list[i] = name;
    /* เปลี่ยนชื่อหมวดต้องย้ายเอกสารตามไปด้วย ไม่งั้นเอกสารจะอ้างหมวดที่ไม่มีอยู่แล้ว */
    /* กั้น tenant ให้เหมือนทุกที่ในระบบ — t1 กับ t2 มีชื่อหมวดซ้ำกันหลายตัว (ค่าขนส่ง · ค่าน้ำมัน · ค่าซ่อมบำรุง)
       เดิมไล่ state.docs ทั้งก้อน คุณตี๋เปลี่ยนชื่อหมวดของตัวเอง แล้วเอกสารของสำนักงานพาร์ทเนอร์เปลี่ยนตาม */
    const inT = tenantCompanies();
    let moved = 0, locked = 0;
    state.docs.forEach(d => {
      if (d.category !== was || inT.indexOf(d.company) < 0) return;
      /* ใบที่ส่งออกไปแล้วไม่แตะ — ไฟล์ .xlsx ที่สำนักงานถืออยู่เขียนหมวดเดิมไว้ */
      if (d.exportedAt) { locked++; return; }
      d.category = name; moved++;
    });
    logAudit(`เปลี่ยนชื่อหมวดค่าใช้จ่าย`, was, name);
    toast(`เปลี่ยนเป็น "${name}"`, 'ok', moved || locked
      ? `ย้ายเอกสาร ${moved} ใบ${locked ? ` · คงหมวดเดิมไว้ ${locked} ใบเพราะส่งออกไปแล้ว` : ''}`
      : 'ยังไม่มีเอกสารในหมวดนี้');
    render(); return;
  }
  if (t.dataset.assign) {
    if (!can('office_settings').ok) { renderTop(); denied('office_settings'); return; }
    const [uid, cid] = t.dataset.assign.split(':');
    const i = state.assignments.findIndex(a => a.user === uid && a.company === cid);
    if (t.checked && i < 0) state.assignments.push({ user: uid, company: cid });
    if (!t.checked && i > -1) state.assignments.splice(i, 1);
    logAudit(`${t.checked ? 'มอบหมาย' : 'ถอน'}การดูแล ${companyName(cid)}`, uname(uid),
      t.checked ? 'ดูแลอยู่' : 'ไม่ได้ดูแลแล้ว');
    const n = assignedTo(uid).length;
    toast(`${t.checked ? 'มอบหมาย' : 'ถอน'} ${companyName(cid)} ${t.checked ? 'ให้' : 'จาก'} ${uname(uid)}`, 'ok',
      `ตอนนี้ดูแล ${n} บริษัท — มีผลทันทีกับสิ่งที่เขาเห็นเมื่อสวมบทบาทนักบัญชี`);
    render(); return;
  }
  if (t.dataset.setrole) {
    const m = state.members.find(x => x.id === t.dataset.setrole);
    const before = m.role;
    /* เจ้าของถูกเก็บสองที่ — m.role ในตารางสมาชิก กับ co.owner ที่คำขออนุมัติวิ่งไปหา
       ถอดคนสุดท้ายออกไม่ได้ ไม่งั้น KPI บอกว่าไม่มีเจ้าของ แต่ระบบยังส่งคำขอไปหาคนเดิมอยู่ */
    if (before === 'owner' && t.value !== 'owner' && membersOf().filter(x => x.role === 'owner').length < 2) {
      toast('ถอดเจ้าของคนสุดท้ายไม่ได้', 'err', 'ตั้งคนอื่นเป็นเจ้าของก่อน แล้วค่อยเปลี่ยนสิทธิ์คนนี้');
      render(); return;
    }
    m.role = t.value;
    logAudit(`เปลี่ยน role ของ ${m.name}`, before, m.role);
    toast(`เปลี่ยนสิทธิ์ ${m.name} แล้ว`, 'ok', `${ROLES[before].th} → ${ROLES[m.role].th}`);
    render(); return;
  }
  if (t.dataset.copyfrom) {
    if (t.value) copyRole(t.value, t.dataset.copyfrom);
    return;
  }
  if (t.dataset.act === 'conf') {
    if (!can('office_settings').ok) { renderTop(); denied('office_settings'); return; }
    const before = state.confMin;
    state.confMin = +t.value;
    const n = reflag();
    logAudit('เปลี่ยนเกณฑ์ติดธง', before, t.value);
    toast('ติดธงเมื่อความมั่นใจต่ำกว่า ' + t.value, 'ok',
      n ? `${n} ใบเปลี่ยนสถานะทันที — ใบที่ส่งออกไปแล้วคงสถานะเดิม` : 'ที่เกณฑ์นี้ไม่มีใบไหนเปลี่ยนสถานะ');
    render(); return;
  }
  if (t.dataset.act === 'apicost') {
    const before = state.apiCostPerPage;
    state.apiCostPerPage = +t.value;
    logAudit('เปลี่ยนต้นทุนค่าอ่านต่อหน้า', before + ' บาท/หน้า', t.value + ' บาท/หน้า');
    const keep = +(state.bahtPerPage - state.apiCostPerPage).toFixed(2);
    toast('ตั้งต้นทุนเป็น ' + (+t.value).toFixed(2) + ' บาท/หน้า', keep > 0 ? 'ok' : 'err',
      keep > 0 ? `เหลือส่วนต่าง ${money(keep)} บาท/หน้า` : 'ราคาที่เก็บลูกค้าต่ำกว่าทุนแล้ว');
    render(); return;
  }
  if (t.dataset.act === 'rate') {
    const before = state.bahtPerPage;
    state.bahtPerPage = +t.value;
    logAudit('เปลี่ยนค่าอ่านที่เก็บลูกค้าต่อหน้า', before + ' บาท/หน้า', t.value + ' บาท/หน้า');
    toast('ตั้งเป็น ' + t.value + ' บาท/หน้า', 'ok', 'มีผลกับส่วนต่างในหน้าภาพรวมสำนักงาน และใบเสนอราคาอ่านย้อนหลังในหน้าจอ LINE');
    render(); return;
  }
  if (t.dataset.act === 'staledays') {
    const before = state.staleDays;
    state.staleDays = +t.value;
    logAudit('เปลี่ยนเกณฑ์ใบติดธงค้างนาน', before + ' วัน', t.value + ' วัน');
    toast('ตั้งเกณฑ์เป็น ' + t.value + ' วัน', 'ok', 'มีผลกับ KPI ใบค้างในหน้าภาพรวมของนักบัญชี');
    render(); return;
  }
  if (t.dataset.act === 'datefmt') {
    const TH = { ce: 'ค.ศ.', be: 'พ.ศ.', iso: 'ISO' };
    const before = state.dateFormat;
    state.dateFormat = t.value;
    logAudit('เปลี่ยนรูปแบบวันที่ในไฟล์ส่งออก', TH[before], TH[t.value]);
    toast('ใช้รูปแบบ ' + TH[t.value], 'ok', 'ดูผลได้ที่ตารางตัวอย่างในหน้าศูนย์ส่งออก');
    render(); return;
  }
  if (t.dataset.act === 'creditwarn') {
    const before = state.creditWarnPages;
    state.creditWarnPages = +t.value;
    logAudit('เปลี่ยนเกณฑ์เตือนเครดิต', before + ' หน้า', t.value + ' หน้า');
    toast('เตือนเมื่อเหลือน้อยกว่า ' + (+t.value).toLocaleString() + ' หน้า', 'ok', 'มีผลกับป้ายในการ์ดเครดิตและ KPI ช่องขวาสุดของหน้าภาพรวมสำนักงาน');
    render(); return;
  }
  if (t.dataset.act === 'digest') {
    const co = company();
    logAudit('เปลี่ยนเวลาสรุปประจำวัน', co.digest_time, t.value);
    co.digest_time = t.value;
    toast('เปลี่ยนเวลาสรุปเป็น ' + t.value, 'ok');
    render(); return;
  }
});

/* help */
$('#btnHub').addEventListener('click', goHub);

$('#btnHelp').addEventListener('click', () => modal(`
  <h2>เกี่ยวกับ prototype นี้</h2>
  <p class="small">สร้างจากเอกสาร 15 ไฟล์ในโฟลเดอร์ <code>aichatbot</code> — ธีมสีและฟอนต์ยึดตาม <b>design system</b> ที่ใช้จริง (แดง <code>#e60023</code> · Noto Sans Thai · โทเคน oklch) และโครงสิทธิ์ยึดตาม <b>11-technical-notes-for-dev.md</b></p>
  <div class="card" style="margin-top:12px">
    <div class="card-head"><h3>วิธีดูให้ครบทุกสิทธิ์</h3></div>
    <ul class="tight">
      <li>สลับ <b>สิทธิ์การใช้งาน</b> ที่มุมขวาบน — เมนูซ้าย ปุ่ม และตัวเลขจะเปลี่ยนตามสิทธิ์จริง</li>
      <li><b>เมนูซ้ายแสดงเฉพาะหน้าที่บทบาทนั้นเข้าได้</b> — หน้าที่ไม่มีสิทธิ์จะไม่ปรากฏเลย ดูภาพรวมว่าใครทำอะไรได้บ้างที่หน้า <b>สิทธิ์การใช้งาน</b></li>
      <li>สวม <b>เจ้าของกิจการ</b> → ตั้งค่า → ปิด <code>financial_visibility</code> แล้วสลับกลับไปเป็น <b>สมาชิกในกลุ่ม</b> จะเห็นตัวเลขถูกซ่อน</li>
      <li>สวม <b>นักบัญชี</b> → สมาชิกและสิทธิ์ → กด "ขออนุมัติจากเจ้าของ" จะสร้างคำขอในตาราง <code>tasks</code> (ผู้ดูแลสำนักงานมี <code>role_grant</code> เต็ม จึงได้ดรอปดาวน์เปลี่ยนสิทธิ์แทน)</li>
      <li>ทุกการกระทำ (รวมที่ถูกปฏิเสธ) ถูกบันทึกใน <b>ประวัติการใช้งาน</b></li>
    </ul>
  </div>
  <div class="modal-foot"><button class="btn primary" data-close-modal>เข้าใจแล้ว</button></div>`));

/* ---------- เมนูแบบเลื่อนออกสำหรับจอเล็ก ---------- */
function setNav(open) {
  document.body.classList.toggle('nav-open', open);
  const b = $('#btnMenu');
  if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false');
}
$('#btnMenu').addEventListener('click', () => setNav(!document.body.classList.contains('nav-open')));
$('#navBackdrop').addEventListener('click', () => setNav(false));

/* ไอคอนของปุ่มบนแถบบน */
$('#btnHub').innerHTML = ic('arrowLeft', 14) + '<span class="btn-label">หน้ารวมสิทธิ์</span>';
$('#btnHelp').innerHTML = ic('help', 16);
$('#btnMenu').innerHTML = ic('menu', 18);


/* hover layer ของกราฟ — ทูลทิปต่อแท่ง (ตาม interaction spec ของ dataviz) */
document.addEventListener('mouseover', e => {
  const g = e.target.closest && e.target.closest('.pt-g');
  const tip = $('#chartTip');
  if (!tip) return;
  if (!g) { tip.hidden = true; return; }
  const card = g.closest('.chart-card');
  const mark = g.querySelector('.dot') || g.querySelector('.cross') || g;
  const r = mark.getBoundingClientRect();
  const cr = card.getBoundingClientRect();
  tip.textContent = g.dataset.pt || '';
  tip.style.left = (r.left - cr.left + r.width / 2) + 'px';
  tip.style.top = (r.top - cr.top) + 'px';
  tip.hidden = false;
});
document.addEventListener('mouseleave', () => { const t = $('#chartTip'); if (t) t.hidden = true; }, true);

/* ปุ่มในการ์ด Flex คือปุ่มที่ผู้ใช้จริงกดในไลน์ — ทำให้กดได้จริงโดยจับคู่กับ quick reply ที่ข้อความใกล้ที่สุด
   เดิมทั้ง 23 ปุ่มถูกจัดสไตล์ให้ดูกดได้แต่ไม่มีตัวจัดการเลย คนดูจะกดแล้วคิดว่าเดโมค้าง */
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('.fc-btns button');
  if (!b) return;
  const st = LINE_STEPS[state.lineStep];
  const qs = (st && st.quick) || [];
  const norm = s => String(s).replace(/\(.*?\)/g, '').replace(/[\s"'·]|\d+/g, '');
  const label = norm(b.textContent);
  let i = qs.findIndex(q => norm(q.label) === label);
  if (i < 0) i = qs.findIndex(q => norm(q.label).indexOf(label) > -1 || label.indexOf(norm(q.label)) > -1);
  if (i > -1) { lineNext(i); return; }
  toast('ปุ่มนี้ยังไม่มีเส้นทางในเดโม', '', 'กดปุ่มด้านล่างจอแทน — ของจริงกดบนการ์ดได้ทุกปุ่ม');
});

/* คีย์บอร์ด — Esc ปิดลิ้นชักและกล่อง · Enter/Space กดแถวตารางที่กดได้
   เดิมทั้งไฟล์ไม่มีการรับคีย์บอร์ดเลย คนที่ใช้เมาส์ไม่ได้จึงใช้ prototype ไม่ได้ */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const m = $('#modal'), d = $('#drawer');
    if (m && !m.hidden) { closeModal(); return; }
    if (d && !d.hidden) { closeDrawer(); return; }
  }
  if (e.key === 'Enter' || e.key === ' ') {
    const row = e.target.closest && e.target.closest('tr.clickable');
    if (row) { e.preventDefault(); row.click(); }
  }
});

/* ---------- boot ---------- */
resetLine();
applyHash();
syncHash();
render();
