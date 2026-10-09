/* ============================================================
   ข้อมูลตัวอย่างสำหรับ prototype
   อ้างอิง:
     11-technical-notes-for-dev.md   โครงสิทธิ์ 3 ชั้น · 5 บทบาท · data model 10 ตาราง
     13-module-presentation-structure.md  ชื่อฟังก์ชันฉบับลูกค้า
     15-canva-deck-status.md         ชื่อฟังก์ชัน M8 ภาษาอังกฤษ
     08-line-file-intake-flow-spec.md  flow รับไฟล์ · กติกา validate · ข้อความบอท
     09-export-module-spec.md        โครงสร้าง Excel/PDF
   ============================================================ */

/* ---------- 4 บทบาท (เดิม 5 — รวมผู้ดูแลระบบเข้ากับเจ้าของสำนักงานแล้ว) ---------- */
const ROLES = {
  member: {
    key: 'member', th: 'สมาชิกในกลุ่ม', initial: 'ส',
    desc: 'พนักงานที่ส่งใบเสร็จเข้ากลุ่มไลน์ของบริษัทตัวเอง — ใช้งานผ่านไลน์อย่างเดียว ไม่เข้าคอนโซลเว็บ',
    levels: ['1'],
    scope: 'บริษัทตัวเองเท่านั้น',
    icon: 'user', scopeTag: 'ไลน์เท่านั้น',
    chips: ['ส่งใบเสร็จเข้ากลุ่ม', 'ดูผลอ่านในไลน์', 'แก้ค่าที่ AI อ่าน', 'มอบหมาย-รับ-ปิดงานในแชท'],
    home: 'line'
  },
  owner: {
    key: 'owner', th: 'เจ้าของกิจการ', initial: 'จ',
    desc: 'เจ้าของบริษัทลูกค้า — ถือสิทธิ์ระดับ 2b ของบริษัทตัวเอง',
    levels: ['1', '2a', '2b'],
    scope: 'บริษัทตัวเองเท่านั้น',
    icon: 'store', scopeTag: 'ร้าน/บริษัทเดียว',
    chips: ['ยอดสรุป + ภาษีซื้อ', 'ตั้งค่าบริษัท (2b)', 'ให้/ถอน role', 'อนุมัติคำขอ'],
    home: 'dashboard'
  },
  accountant: {
    key: 'accountant', th: 'นักบัญชี', initial: 'บ',
    desc: 'ผู้ทำบัญชีในสำนักงาน — ตรวจใบติดธงและส่งออกให้บริษัทที่ได้รับมอบหมาย',
    levels: ['1', '2a'],
    scope: 'เฉพาะบริษัทที่ได้รับมอบหมาย',
    icon: 'calculator', scopeTag: 'หลายบริษัท',
    chips: ['ตรวจใบติดธง', 'ส่งออก Excel/PDF', 'สลับบริษัท', 'ปิดงานประจำเดือน'],
    home: 'documents'
  },
  office_admin: {
    key: 'office_admin', th: 'เจ้าของสำนักงาน', initial: 'ผ',
    desc: 'คุณตี๋ — เจ้าของสำนักงานบัญชีและเจ้าของระบบในคนเดียว ถือสิทธิ์ผู้ดูแลระบบทั้งหมด',
    levels: ['1', '2a', '2b'],
    scope: 'ทุกบริษัทในสำนักงาน + ดูแลระบบทั้งหมด',
    icon: 'building', scopeTag: 'ทั้งสำนักงาน + ดูแลระบบ',
    chips: ['ภาพรวมทุกบริษัท', 'ตั้งค่าสำนักงาน + White-Label', 'แก้สิทธิ์ทุกบทบาท', 'เข้าไปช่วยสำนักงานอื่น'],
    home: 'dashboard'
  },
};
const ROLE_ORDER = ['member', 'owner', 'accountant', 'office_admin'];

/* ---------- คำอธิบายสิทธิ์ 3 ชั้น (11-technical-notes-for-dev.md) ---------- */
const LEVELS = [
  {
    id: '1', cls: 'l1', name: 'ระดับ 1 · กลุ่ม',
    lead: 'ทุกคนในกลุ่มไลน์ของบริษัททำได้',
    items: ['ส่งไฟล์ · สั่ง OCR', 'ดูเอกสารทั้งหมดของบริษัทตัวเอง', 'ยืนยัน / แก้ไขค่าที่ AI อ่าน', 'มอบหมายและปิดงาน'],
    note: 'B-9 — เส้นแบ่งอยู่ที่ "ตัวเลขสรุป" ไม่ใช่ "เอกสารรายใบ"'
  },
  {
    id: '2a', cls: 'l2a', name: 'ระดับ 2a · ดูตัวเลข',
    lead: 'ตั้งค่าได้รายบริษัทผ่าน financial_visibility',
    items: ['ยอดรวมทั้งเดือน', 'ภาษีซื้อรวม', 'ส่งออก Excel / PDF'],
    note: 'B-10 — ค่าเริ่มต้น = เปิด · 2a พลาด = คนเห็นสิ่งที่ไม่ควรเห็น'
  },
  {
    id: '2b', cls: 'l2b', name: 'ระดับ 2b · เปลี่ยนสถานะระบบ',
    lead: 'เจ้าของเท่านั้น',
    items: ['ผูก / ยกเลิกกลุ่มไลน์', 'ตั้งค่าบริษัท', 'ลบเอกสาร', 'ให้ / ถอน role'],
    note: '2b พลาด = ระบบหยุดทำงานทั้งบริษัท'
  }
];

/* ---------- Capability matrix ----------
   full = ทำได้ · none = ไม่ได้ · cond = ขึ้นกับการตั้งค่าบริษัท · partial = ได้เฉพาะของตัวเอง
   ที่มา: ระดับ 1/2a/2b จากเอกสาร · การกระจายรายบทบาทเป็นข้อเสนอของ prototype (ดูหน้า "สิทธิ์การใช้งาน")
------------------------------------------ */
const CAPS = [
  { id: 'upload',        name: 'ส่งเอกสาร + สั่งอ่าน (OCR)',      sub: 'Instant Receive · AI Reader', level: '1',  module: 'M1 · M2',
    r: { member:'full', owner:'full', accountant:'full', office_admin:'full' } },
  { id: 'view_docs',     name: 'ดูเอกสารของบริษัท',               sub: 'ผ่านไลน์ (M1) หรือ Documents Tab (M8)', level: '1', module: 'M3 · M8',
    r: { member:'full', owner:'full', accountant:'full', office_admin:'full' } },
  { id: 'review',        name: 'ยืนยัน / แก้ไขค่าที่ AI อ่าน',     sub: 'Review Card · Pick Any Field', level: '1', module: 'M4',
    r: { member:'full', owner:'full', accountant:'full', office_admin:'full' } },
  /* B-13 — ขอบเขตการปิดงานผูกกับ "องค์กร" ไม่ใช่ตัวคน
     สมาชิกกับเจ้าของอยู่ในบริษัทเดียวกับงาน จึงปิดได้ทุกใบตามหลัก "ไม่กั้น แต่ให้เห็น"
     นักบัญชีกับหัวหน้าสำนักงานเป็นคนนอกบริษัทลูกค้า ปิดได้เฉพาะงานที่สำนักงานตัวเองเป็นผู้สั่ง
     เหตุผลเดิมของการเปิดกว้าง ("เลขาปิดแทนหัวหน้าเป็นเรื่องปกติ") เป็นเหตุผลภายในบริษัท ไม่ควรลามข้ามองค์กร */
  { id: 'task_assign',   name: 'มอบหมายงาน / ปิดงาน',            sub: 'Assign in Group · Mark Done — ฝั่งสำนักงานปิดได้เฉพาะงานที่สำนักงานสั่งเอง', level: '1', module: 'M7',
    r: { member:'full', owner:'full', accountant:'partial', office_admin:'partial' } },
  { id: 'task_approve',  name: 'อนุมัติคำขอ',                     sub: 'Approval Request (tasks.type=approval)', level: '2b', module: 'M7',
    /* มติ: ยึดตาม prototype — 2b เป็นของเจ้าของเท่านั้น หัวหน้าสำนักงานเป็นคนนอกของบริษัทลูกค้า
       จึงกดขออนุมัติได้ แต่อนุมัติเองไม่ได้ (ตารางหน้า 30 ในเด็คให้ ✅ ไว้ ต้องแก้เด็คตาม)
       ค่าเดิมเป็น full ซึ่งขัดกับคอมเมนต์ของตัวเอง · mayApprove() บังคับ assignee === meId() อยู่แล้ว
       และคำขอทุกใบมี assignee = เจ้าของ ช่องนี้จึงเป็น ✅ ที่ไม่มีทางกดได้จริงสักครั้ง */
    r: { member:'none', owner:'full', accountant:'none', office_admin:'none' } },

  { id: 'view_financial',name: 'ดูยอดสรุป / ภาษีซื้อรวม',        sub: 'Quick Stats · Financial Access', level: '2a', module: 'M6 · M8',
    r: { member:'cond', owner:'full', accountant:'full', office_admin:'full' } },
  { id: 'export',        name: 'ส่งออก Excel / PDF',              sub: 'Export Center',              level: '2a', module: 'M5',
    r: { member:'cond', owner:'full', accountant:'full', office_admin:'full' } },
  { id: 'console_access',name: 'เข้าคอนโซลเว็บ',                  sub: 'Shared Shell (M8) — พนักงานส่งเอกสารใช้ผ่านไลน์อย่างเดียว', level: '1', module: 'M8',
    r: { member:'none', owner:'full', accountant:'full', office_admin:'full' } },
  { id: 'switch_company',name: 'สลับบริษัท',                      sub: 'Company Switch',             level: '2a', module: 'M8',
    r: { member:'none', owner:'none', accountant:'full', office_admin:'full' } },

  { id: 'member_view',   name: 'ดูรายชื่อสมาชิกกลุ่ม',            sub: 'Team Directory',             level: '1',  module: 'M1 · M8',
    r: { member:'full', owner:'full', accountant:'full', office_admin:'full' } },
  { id: 'role_grant',    name: 'ให้ / ถอน role',                  sub: 'Member Manager',             level: '2b', module: 'M6',
    r: { member:'none', owner:'full', accountant:'none', office_admin:'full' } },
  { id: 'bind_group',    name: 'ผูก / ยกเลิกกลุ่มไลน์',           sub: 'Group Setup',                level: '2b', module: 'M6',
    r: { member:'none', owner:'full', accountant:'none', office_admin:'full' } },
  { id: 'doc_delete',    name: 'ลบเอกสาร',                        sub: 'Safe Delete — ทำบนการ์ดในไลน์', level: '2b', module: 'M3',
    r: { member:'none', owner:'full', accountant:'none', office_admin:'full' } },
  { id: 'company_settings', name: 'ตั้งค่าบริษัท',                sub: 'financial_visibility · digest_time', level: '2b', module: 'M6',
    r: { member:'none', owner:'full', accountant:'none', office_admin:'full' } },
  /* ผูก/เปลี่ยน/ยกเลิกบัญชี Drive แยกจาก company_settings เพราะเป็นบัญชี Google ของลูกค้าเอง
     มติ 10:55 ให้เก็บ OAuth refresh token รายลูกค้า ไม่ใช้ service account กลาง
     ถ้าสำนักงานสลับบัญชีเองได้ ไฟล์ลูกค้าจะไปกองในบัญชีสำนักงาน = กับดักเดิมในรูปใหม่ */
  { id: 'drive_link',    name: 'ผูก / เปลี่ยนบัญชี Google Drive',  sub: 'บัญชีของลูกค้าเอง — สำนักงานขอให้เจ้าของกดเอง', level: '2b', module: 'M6',
    r: { member:'none', owner:'full', accountant:'none', office_admin:'none' } },

  { id: 'office_settings', name: 'ตั้งค่าระดับสำนักงาน',          sub: 'Office Settings · แมปคอลัมน์ export', level: '2b', module: 'M8',
    r: { member:'none', owner:'none', accountant:'none', office_admin:'full' } },
  { id: 'audit_view',    name: 'ดูประวัติการใช้งาน',              sub: 'Activity Log',               level: '2a', module: 'M6 · M8',
    r: { member:'partial', owner:'full', accountant:'partial', office_admin:'full' } },
  { id: 'tenant_admin',  name: 'จัดการ tenant / White-Label',     sub: 'White-Label Ready',          level: '2b', module: 'M6',
    r: { member:'none', owner:'none', accountant:'none', office_admin:'full' } }
];

const MARK = {
  full:    { icon: 'check',      cls: 'mark-full',    th: 'ทำได้' },
  none:    { icon: 'minus',      cls: 'mark-none',    th: 'ไม่มีสิทธิ์' },
  cond:    { icon: 'settings',   cls: 'mark-cond',    th: 'ขึ้นกับการตั้งค่าบริษัท' },
  partial: { icon: 'halfCircle', cls: 'mark-partial', th: 'ได้เฉพาะบางส่วน' }
};

/* ---------- สำนักงานบัญชี (tenant) ----------
   t1 = สำนักงานของคุณตี๋เอง — เป็น tenant แรกที่ใช้ระบบ
   t2 = สำนักงานพาร์ทเนอร์ที่ซื้อไปใช้ต่อ — ต้องมองไม่เห็นข้อมูลของ t1 เลย        */
/* owner      = เจ้าของระบบ ถือ API key จ่ายค่าโมเดลตรง ไม่มีเครดิต
   rate       = ค่าระบบที่สำนักงานนี้จ่ายเจ้าของระบบ (บาท/หน้าที่อ่านสำเร็จ)
   priorPages = หน้าที่อ่านไปแล้วก่อนช่วงข้อมูลตัวอย่าง — ตัวเลขสมมติ ไว้ให้ยอดเครดิตดูสมจริง
   topups     = ประวัติเติมเงิน · ยอดคงเหลือคำนวณสดจาก topups ลบด้วยหน้าที่อ่านจริง ไม่เก็บยอดค้างไว้ซ้ำ */
const TENANTS = [
  { id: 't1', name: 'สำนักงานบัญชีรุ่งเรือง', short: 'รุ่งเรือง', oa: '@rungrueang-acc', color: '#C20D24', initial: 'รร',
    plan: 'เจ้าของระบบ', since: '2026-06-01', note: 'สำนักงานของคุณตี๋ — tenant แรกที่ใช้งานจริง',
    owner: true, rate: 0, priorPages: 2400, topups: [] },
  { id: 't2', name: 'สำนักงานบัญชีเจริญทรัพย์', short: 'เจริญทรัพย์', oa: '@charoensap-acc', color: '#1F6F5C', initial: 'จท',
    plan: 'White-Label 40%', since: '2026-08-12', note: 'พาร์ทเนอร์ที่ซื้อไปใช้ ใช้ LINE OA แบรนด์ตัวเอง',
    owner: false, rate: 0.40, priorPages: 1180,
    topups: [{ at: '2026-08-12', amount: 500, by: 'u12', note: 'เติมครั้งแรกตอนเปิดใช้งาน' }] }
];

/* ค่าเริ่มต้นของเกณฑ์เตือนเครดิต (จำนวนหน้าที่ยังอ่านได้) — ตั้งใหม่ได้ที่หน้าตั้งค่าระดับสำนักงาน */
const CREDIT_WARN_PAGES = 200;

/* ---------- บริษัท (อยู่ใต้ tenant) ---------- */
/* drive = สถานะการผูก Google Drive ของแต่ละบริษัท — เจ้าของเป็นคนกดผูกเอง (สิทธิ์ 2b)
   linked = ใช้งานได้ · expired = refresh token ถูกเพิกถอน ต้องเชื่อมใหม่ · full = พื้นที่เต็ม เขียนไม่ได้ · none = ยังไม่เคยผูก
   ค่าเริ่มต้นตั้งให้ตรงกับเคสจริงในตาราง SYS_ERRORS (E-05 ของ c2 · E-06 ของ c3) */
const COMPANIES = [
  { id: 'c1', tenant: 't1', name: 'บจก. เอบีซี เทรดดิ้ง',  group: 'บัญชี ABC × สำนักงานรุ่งเรือง', financial_visibility: true,  digest_time: '08:30',
    drive: '/Chap Wai/ABC', driveState: 'linked', driveAcct: 'admin@abc-trading.co.th', driveUsed: 3.2, driveQuota: 15 },
  { id: 'c2', tenant: 't1', name: 'บจก. สยาม ฟู้ดส์',      group: 'เอกสารสยามฟู้ดส์',             financial_visibility: false, digest_time: '09:00',
    drive: '/Chap Wai/SiamFoods', driveState: 'expired', driveAcct: 'office@siamfoods.co.th', driveUsed: 1.1, driveQuota: 15 },
  { id: 'c4', tenant: 't2', name: 'บจก. นครชัย ขนส่ง',      group: 'บัญชีนครชัย × เจริญทรัพย์',   financial_visibility: true,  digest_time: '08:30',
    drive: '/Chap Wai/NakhonChai', driveState: 'none', driveUsed: 0, driveQuota: 15, owner: 'u11' },
  { id: 'c5', tenant: 't2', name: 'ร้านวัสดุพี่หมี',        group: 'พี่หมีวัสดุ-ส่งบิล',           financial_visibility: false, digest_time: '09:30',
    drive: '/Chap Wai/PheeMee', driveState: 'none', driveUsed: 0, driveQuota: 15, owner: 'u13' },
  { id: 'c3', tenant: 't1', name: 'ร้านทองไทยรุ่งเรือง',    group: 'ทองไทย-ส่งบิล',                financial_visibility: true,  digest_time: '08:00',
    drive: '/Chap Wai/ThongThai', driveState: 'full', driveAcct: 'thongthai.shop@gmail.com', driveUsed: 14.8, driveQuota: 15 }
];
/* ผูกเจ้าของด้วย id ไม่ใช่ลำดับในอาเรย์ — เดิมใช้ index แล้ว c4 ถูกทับ ส่วน c3 ไม่เคยได้เจ้าของเลย
   ทั้งที่ u9 คือ "คุณชัย (เจ้าของ)" ของ c3 · ลำดับจริงในอาเรย์คือ c1 c2 c4 c5 c3 */
{ const OWNERS = { c1: 'u2', c2: 'u7', c3: 'u9' };
  COMPANIES.forEach(c => { if (OWNERS[c.id]) c.owner = OWNERS[c.id]; }); }

/* ข้อมูลเดิมที่ลูกค้ามีอยู่ก่อนใช้ระบบ — ใช้ในหน้า "นำเข้าข้อมูลเดิม"
   pages = จำนวนหน้าที่ต้องอ่าน (ใช้คิดค่าอ่านตามอัตราของสำนักงาน) · dup = ซ้ำกับที่มีอยู่แล้ว เช็กด้วย file_hash */
/* ที่มาของข้อมูลเดิม — จัดเรียงตามแกนเดียวคือ "ลูกค้ามีอะไรอยู่ในมือ" ไม่ใช่ปนกับแกน "รูปแบบไฟล์"
   แล้วแบ่งเป็นสองกลุ่มตามผลที่ได้ เพราะนั่นคือสิ่งที่ตัดสินว่าเสียค่าอ่านหรือไม่
   group 'image' = มีรูปใบจริง ต้องเรียกโมเดลอ่าน มีค่าอ่านต่อหน้า
   group 'sheet' = มีแต่ตัวเลขที่พิมพ์ไว้แล้ว ไม่ต้องเรียกโมเดล ไม่มีค่าอ่าน */
const IMPORT_SOURCES = [
  { id: 'drive', group: 'image', icon: 'inbox', name: 'รูปใบเสร็จที่เก็บไว้ใน Google Drive',
    detail: 'มีโฟลเดอร์ใน Drive ที่ถ่ายใบเสร็จเก็บไว้อยู่แล้ว — รูปถ่ายกับ PDF ปนกันได้ ไม่ต้องจัดโฟลเดอร์ใหม่',
    files: 284, pages: 412, dup: 19, readable: 249, note: 'ได้ทั้งตัวเลขและรูปใบจริง · โครงโฟลเดอร์เดิมไม่ต้องรื้อ' },
  { id: 'photos', group: 'image', icon: 'camera', name: 'รูปใบเสร็จที่ยังอยู่ในมือถือ',
    detail: 'ถ่ายเก็บไว้ในเครื่อง ยังไม่เคยขึ้น Drive และยังไม่เคยส่งเข้ากลุ่มไลน์ — เลือกทั้งอัลบั้มส่งเข้ามาทีเดียว',
    files: 96, pages: 96, dup: 7, readable: 88, note: 'ได้ทั้งตัวเลขและรูปใบจริง · HEIC จาก iPhone แปลงให้อัตโนมัติ' },
  { id: 'excel', group: 'sheet', icon: 'file', name: 'ตาราง Excel ที่พิมพ์รายการไว้เอง',
    detail: 'ไฟล์ที่คุณหรือลูกน้องคีย์เอง แถวละหนึ่งใบ มีชื่อผู้ขาย เลขภาษี วันที่ ยอด',
    files: 1, pages: 0, dup: 0, readable: 341, note: 'ได้ตัวเลขครบ แต่ไม่มีรูปใบจริง · ไม่ต้องเรียกโมเดลอ่าน จึงไม่มีค่าอ่าน',
    /* หมวดที่ "มีอยู่แล้ว" ในไฟล์ของลูกค้า พร้อมจำนวนแถว — to คือหมวดในผังสำนักงานที่จับคู่ได้
       to: null = ไฟล์ลูกค้ามีหมวดนี้ แต่ผังสำนักงานไม่มี ต้องให้สำนักงานตัดสินว่าจะเพิ่มไหม
       ชื่อของลูกค้าไม่เคยเข้าระบบ — แปลงเป็นชื่อในผังตั้งแต่ตอนนำเข้า ไฟล์ส่งออกจึงยังตรงกันทุกราย */
    catMap: [
      { from: 'ซื้อสินค้า', rows: 96, to: 'ต้นทุนสินค้า' },
      { from: 'เครื่องเขียน', rows: 54, to: 'วัสดุสำนักงาน' },
      { from: 'น้ำมันรถ', rows: 71, to: 'ค่าน้ำมัน' },
      { from: 'ค่าไฟ-ค่าน้ำ', rows: 24, to: 'ค่าสาธารณูปโภค' },
      { from: 'ค่าโทรศัพท์+เน็ต', rows: 18, to: 'ค่าสื่อสาร' },
      { from: 'ซ่อมรถ', rows: 19, to: 'ค่าซ่อมบำรุง' },
      { from: 'ค่าเช่าโกดัง', rows: 47, to: null },
      { from: 'เบ็ดเตล็ด', rows: 12, to: 'ค่าใช้จ่ายทั่วไป' }
    ] },
  { id: 'acct', group: 'sheet', icon: 'calculator', name: 'ไฟล์ที่ดึงออกจากโปรแกรมบัญชีเดิม',
    detail: 'เคยใช้ FlowAccount / Express / PEAK แล้วกดออกรายงานมาเป็นไฟล์',
    files: 1, pages: 0, dup: 0, readable: 512, note: 'ได้ตัวเลขครบ แต่ไม่มีรูปใบจริง · ตัวเลขผ่านการลงบัญชีมาแล้ว เหมาะกับการทำยอดย้อนหลังให้ตรงกับงบที่ยื่นไป',
    catMap: [
      { from: 'ต้นทุนขาย', rows: 148, to: 'ต้นทุนสินค้า' },
      { from: 'วัสดุสำนักงาน', rows: 61, to: 'วัสดุสำนักงาน' },
      { from: 'ค่าน้ำมันเชื้อเพลิง', rows: 88, to: 'ค่าน้ำมัน' },
      { from: 'ค่าสาธารณูปโภค', rows: 36, to: 'ค่าสาธารณูปโภค' },
      { from: 'ค่าโทรศัพท์', rows: 22, to: 'ค่าสื่อสาร' },
      { from: 'ค่าซ่อมแซม', rows: 31, to: 'ค่าซ่อมบำรุง' },
      { from: 'ค่าเช่า', rows: 60, to: null },
      { from: 'ค่าธรรมเนียมธนาคาร', rows: 26, to: null },
      { from: 'อื่น ๆ', rows: 40, to: 'ค่าใช้จ่ายทั่วไป' }
    ] }
];

const IMPORT_GROUPS = [
  { id: 'image', title: 'มีรูปใบเสร็จอยู่', sub: 'ได้ทั้งตัวเลขและรูปใบจริง · ต้องให้ AI อ่าน จึงมีค่าอ่านตามจำนวนหน้า' },
  { id: 'sheet', title: 'มีแต่ไฟล์ตารางที่พิมพ์ไว้แล้ว', sub: 'ได้ตัวเลขอย่างเดียว ไม่มีรูปใบจริง · ไม่ต้องให้ AI อ่าน จึงไม่มีค่าอ่าน' }
];

/* บริษัทที่แต่ละบทบาทมองเห็น */
/* ตารางมอบหมาย (คน × บริษัท) — หัวหน้าสำนักงานเป็นคนตั้งว่านักบัญชีคนไหนดูแลบริษัทไหน
   เป็นความสัมพันธ์หลาย-ต่อ-หลาย: คนหนึ่งดูแลได้หลายบริษัท และบริษัทหนึ่งมีคนดูแลได้หลายคน
   ลูกค้าไม่ได้ "อยู่ใต้" นักบัญชี — ลูกค้าอยู่ใต้สำนักงาน ส่วนนักบัญชีถูกมอบหมายให้ดูแล
   นักบัญชีลาออกลูกค้าจึงไม่หายไปด้วย แค่เปลี่ยนคนดูแล */
const ASSIGNMENTS = [
  { user: 'u3',  company: 'c1' },   /* นภา ดูแล ABC */
  { user: 'u3',  company: 'c2' },   /* นภา ดูแล สยามฟู้ดส์ */
  { user: 'u15', company: 'c2' },   /* ปอ ดูแล สยามฟู้ดส์ ด้วย — บริษัทเดียวมีคนดูแลสองคนได้ */
  { user: 'u15', company: 'c3' },   /* ปอ ดูแล ทองไทย ซึ่งนภาไม่เห็น */
  { user: 'u12', company: 'c4' },   /* อ้อม (สำนักงานเจริญทรัพย์) */
  { user: 'u12', company: 'c5' }
];

/* ผังหมวดค่าใช้จ่าย — ตั้งที่ระดับสำนักงาน ไม่ใช่ให้ลูกค้าแต่ละรายตั้งเอง
   เหตุผลจากเอกสาร 13: ปลายทางคือโปรแกรมบัญชีที่มีผังบัญชีตายตัว ถ้าลูกค้าแต่ละรายตั้งกันเอง
   ไฟล์ที่ส่งเข้าโปรแกรมจะไม่ตรงกันแล้วสำนักงานต้องมาแมปใหม่ทุกไฟล์
   AI ไม่ได้คิดหมวดขึ้นเอง — มันเลือกจากผังนี้ ถ้าไม่มั่นใจจะตกมาที่ UNCAT แล้วติดธงให้คนตรวจ */
const UNCAT = 'ยังไม่จัดหมวด';
const CATEGORIES = {
  t1: ['ต้นทุนสินค้า', 'ต้นทุนวัตถุดิบ', 'วัสดุสำนักงาน', 'วัสดุสิ้นเปลือง', 'ค่าขนส่ง', 'ค่าน้ำมัน',
    'ค่าเดินทาง', 'ค่าสาธารณูปโภค', 'ค่าสื่อสาร', 'ค่าซ่อมบำรุง', 'ค่ารับรอง', 'ค่าใช้จ่ายทั่วไป'],
  t2: ['ต้นทุนขาย', 'ค่าขนส่ง', 'ค่าน้ำมัน', 'ค่าสาธารณูปโภค', 'ค่าซ่อมบำรุง', 'ค่าใช้จ่ายทั่วไป']
};

/* หมวดที่ "ระงับการใช้งาน" ไว้ — เลิกใช้กับใบใหม่ แต่ใบเก่ายังอยู่ในหมวดเดิม
   จำเป็นเพราะลบไม่ได้เมื่อมีเอกสารอยู่ และ "เปลี่ยนชื่อ" ก็ไม่ใช่คำตอบ —
   ไฟล์ .xlsx ที่ส่งให้สำนักงานไปแล้วยังเขียนหมวดเดิม การแก้ชื่อย้อนหลังทำให้ของบนจอไม่ตรงกับไฟล์ที่ส่งไป
   ตัวอย่าง: t1 เลิกใช้ "ค่ารับรอง" ตั้งแต่ปีภาษีนี้ แต่ใบเก่ายังต้องคงหมวดไว้ */
const CAT_OFF = { t1: ['ค่ารับรอง'], t2: [] };

/* หมวดที่ "แต่ละบริษัทปิดเอง" — คนละเรื่องกับ CAT_OFF ข้างบน
   CAT_OFF   = สำนักงานเลิกใช้ทั้งสำนักงาน ไม่มีบริษัทไหนใช้ได้อีก
   CAT_CO_OFF = บริษัทนี้ไม่มีค่าใช้จ่ายประเภทนี้ในธุรกิจตัวเอง บริษัทอื่นยังใช้ตามปกติ
   โรงงานมีค่าขนส่ง ร้านอาหารไม่มี — ผังกลางต้องมีครบ แต่จอของแต่ละรายควรเหลือเฉพาะที่ใช้จริง
   ยิ่งตัวเลือกน้อย AI ยิ่งจัดหมวดแม่น และคนตรวจยิ่งเลือกผิดยาก */
const CAT_CO_OFF = {
  c1: [],
  c2: ['ต้นทุนวัตถุดิบ'],
  c3: ['ต้นทุนวัตถุดิบ', 'ค่าขนส่ง', 'ค่าเดินทาง'],
  c4: [],
  c5: []
};

/* ---------- จำนวนเอกสารย้อนหลัง 5 เดือน (เดือนปัจจุบันคำนวณสด) ---------- */
const MONTHLY_DOCS = {
  /* ย้อนหลัง 11 เดือน + เดือนปัจจุบันคำนวณสดจากเอกสารจริง
     rate = อัตราใบที่ผ่านได้เลย (%) — ไต่ขึ้นเพราะ corrections สะสม (Learn From You) */
  c1: [{ m: 'ก.ย.', n: 7, rate: 57 }, { m: 'ต.ค.', n: 10, rate: 60 }, { m: 'พ.ย.', n: 8, rate: 63 },
       { m: 'ธ.ค.', n: 15, rate: 60 }, { m: 'ม.ค.', n: 6, rate: 67 }, { m: 'ก.พ.', n: 10, rate: 70 },
       { m: 'มี.ค.', n: 9, rate: 67 }, { m: 'เม.ย.', n: 14, rate: 71 }, { m: 'พ.ค.', n: 11, rate: 73 },
       { m: 'มิ.ย.', n: 16, rate: 75 }, { m: 'ก.ค.', n: 13, rate: 77 }],
  c2: [{ m: 'ก.ย.', n: 2, rate: 50 }, { m: 'ต.ค.', n: 4, rate: 50 }, { m: 'พ.ย.', n: 3, rate: 67 },
       { m: 'ธ.ค.', n: 6, rate: 50 }, { m: 'ม.ค.', n: 2, rate: 50 }, { m: 'ก.พ.', n: 4, rate: 75 },
       { m: 'มี.ค.', n: 3, rate: 67 }, { m: 'เม.ย.', n: 5, rate: 60 }, { m: 'พ.ค.', n: 4, rate: 75 },
       { m: 'มิ.ย.', n: 6, rate: 67 }, { m: 'ก.ค.', n: 4, rate: 75 }],
  c4: [{ m: 'ก.ย.', n: 4, rate: 50 }, { m: 'ต.ค.', n: 6, rate: 50 }, { m: 'พ.ย.', n: 5, rate: 60 },
       { m: 'ธ.ค.', n: 9, rate: 56 }, { m: 'ม.ค.', n: 4, rate: 50 }, { m: 'ก.พ.', n: 7, rate: 57 },
       { m: 'มี.ค.', n: 6, rate: 67 }, { m: 'เม.ย.', n: 8, rate: 63 }, { m: 'พ.ค.', n: 7, rate: 71 },
       { m: 'มิ.ย.', n: 9, rate: 67 }, { m: 'ก.ค.', n: 8, rate: 63 }],
  c5: [{ m: 'ก.ย.', n: 2, rate: 50 }, { m: 'ต.ค.', n: 3, rate: 67 }, { m: 'พ.ย.', n: 2, rate: 50 },
       { m: 'ธ.ค.', n: 4, rate: 50 }, { m: 'ม.ค.', n: 2, rate: 50 }, { m: 'ก.พ.', n: 3, rate: 67 },
       { m: 'มี.ค.', n: 3, rate: 33 }, { m: 'เม.ย.', n: 4, rate: 50 }, { m: 'พ.ค.', n: 3, rate: 67 },
       { m: 'มิ.ย.', n: 5, rate: 60 }, { m: 'ก.ค.', n: 4, rate: 50 }],
  c3: [{ m: 'ก.ย.', n: 1, rate: 100 }, { m: 'ต.ค.', n: 2, rate: 50 }, { m: 'พ.ย.', n: 2, rate: 100 },
       { m: 'ธ.ค.', n: 3, rate: 67 }, { m: 'ม.ค.', n: 1, rate: 100 }, { m: 'ก.พ.', n: 2, rate: 100 },
       { m: 'มี.ค.', n: 2, rate: 50 }, { m: 'เม.ย.', n: 3, rate: 100 }, { m: 'พ.ค.', n: 1, rate: 100 },
       { m: 'มิ.ย.', n: 4, rate: 75 }, { m: 'ก.ค.', n: 2, rate: 100 }]
};

/* ตัวเลือกช่วงเวลาของหน้าภาพรวม */
const RANGES = [
  { id: 'today', label: 'วันนี้', days: 1 },
  { id: '7d', label: '7 วัน', days: 7 },
  { id: '30d', label: '30 วัน', days: 30 },
  { id: '6m', label: '6 เดือน', months: 6 },
  { id: '1y', label: '1 ปี', months: 12 },
  { id: 'custom', label: 'กำหนดเอง' }
];

/* ยอดเฉลี่ยต่อใบรายบริษัท — ใช้ประมาณยอดย้อนหลังจากจำนวนใบ (ข้อมูลตัวอย่าง) */
const AVG_TICKET = { c1: 3400, c2: 5200, c3: 118000, c4: 8600, c5: 2400 };

/* ปัญหาจากการใช้งานจริง — อิงเคสใน 08-line-file-intake-flow-spec.md (error cases 8 กรณี)
   sev: high = ผู้ใช้เสียงาน · med = มีทางเลี่ยง · low = ระบบจัดการเองได้ */
const SYS_ERRORS = [
  { id:'E-08', type:'ไฟล์ที่เก็บได้แต่ยังอ่านไม่ได้', detail:'Word / Excel / zip ที่ลูกค้าส่งเข้ากลุ่ม — เก็บขึ้น Drive ครบทุกไฟล์ แต่ยังไม่มี flow อ่านข้อมูล',
    count:9, last:'2026-08-28 11:08', sev:'low', company:'c1', fix:'ตั้งใจให้เป็นแบบนี้ในเฟส 1 — วิเคราะห์งบ (Excel/CSV) รอเฟสถัดไปตามมติ B-3' },
  { id:'E-07', type:'ดึงไฟล์จาก LINE ไม่ทัน', detail:'Content API หมดอายุก่อนระบบดึง — ผู้ใช้ต้องส่งรูปใหม่',
    count:3, last:'2026-08-28 08:12', sev:'high', company:'c2', fix:'ดึงไฟล์ทันทีที่รับ webhook (ฟังก์ชัน 1.2)' },
  { id:'E-06', type:'Drive ของลูกค้าเต็ม', detail:'Gmail ฟรี 15 GB เต็ม เขียนไฟล์ไม่ได้ — ไฟล์ค้างใน staging',
    count:2, last:'2026-08-27 16:40', sev:'high', company:'c3', fix:'ตรวจโควตาก่อนเขียน + แจ้งเตือนเจ้าของ' },
  { id:'E-05', type:'Drive token หมดอายุ', detail:'refresh token ของลูกค้าถูกเพิกถอน ต้องเชื่อมต่อใหม่',
    count:1, last:'2026-08-26 09:05', sev:'high', company:'c2', fix:'แจ้งเจ้าของให้กดเชื่อม Drive ใหม่' },
  { id:'E-04', type:'ไฟล์ HEIC จาก iPhone', detail:'แปลงเป็น JPG ไม่สำเร็จ 5 ครั้ง จาก 41 ไฟล์ HEIC',
    count:5, last:'2026-08-28 10:31', sev:'med', company:'c1', fix:'แปลงก่อนเข้า OCR เสมอ ไม่ใช่ option' },
  { id:'E-03', type:'PDF หลายหน้า', detail:'ผู้ใช้ส่ง PDF 4–12 หน้า ระบบยังถามทุกครั้งว่าอ่านทุกหน้าไหม',
    count:4, last:'2026-08-27 14:22', sev:'med', company:'c1', fix:'รอตัดสินใจ — ค่า API ต่างกันตามจำนวนหน้า' },
  { id:'E-02', type:'LLM API timeout', detail:'เรียก Vision ไม่สำเร็จ retry แบบ backoff แล้วผ่าน ไม่มีใบไหนหาย',
    count:2, last:'2026-08-27 11:08', sev:'med', company:'c1', fix:'เข้าคิวใหม่อัตโนมัติ — ทำงานถูกต้องแล้ว' },
  { id:'E-02b', type:'ผูก LINE OA แบรนด์พาร์ทเนอร์', detail:'เจริญทรัพย์ตั้ง webhook ของ OA ตัวเองไม่ผ่าน 2 ครั้งแรก',
    count:2, last:'2026-08-13 11:20', sev:'med', company:'c4', fix:'ทำคู่มือ + ตรวจ channel secret อัตโนมัติตอนผูก' },
  { id: 'E-01', type:'ส่งรูปที่ไม่ใช่เอกสาร', detail:'สกรีนช็อต/รูปทั่วไป — เก็บไฟล์ไว้แต่ไม่ลงเป็นเอกสาร และมีปุ่มให้ผู้ใช้แย้งถ้าระบบดูผิด',
    count:12, last:'2026-08-28 09:47', sev:'low', company:'c1', fix:'ทำงานตามที่ออกแบบ — จุดสำคัญคือไม่ทิ้งไฟล์ เพราะระบบเดาผิดได้' },
  { id:'E-00', type:'ไฟล์ใหญ่เกินขีดจำกัด', detail:'รูปความละเอียดสูงเกิน 10 MB — แจ้งผู้ใช้ถ่ายใหม่',
    count:2, last:'2026-08-25 13:55', sev:'low', company:'c1', fix:'บีบขนาดฝั่งเซิร์ฟเวอร์แทนการปฏิเสธ' }
];

/* ---------- สมาชิกกลุ่ม (group_members + role) ---------- */
const MEMBERS = [
  { id: 'u1', company: 'c1', name: 'สมชาย (แอดมิน)',  line: 'U4af9...c21e', role: 'member',       first: '2026-06-02', last: '2026-08-28 09:12' },
  { id: 'u2', company: 'c1', name: 'คุณสมพร (เจ้าของ)', line: 'Ub12c...88af', role: 'owner',       first: '2026-06-02', last: '2026-08-28 07:45' },
  { id: 'u3', company: 'c1', name: 'นภา · นักบัญชี',   line: 'Uc77d...0a31', role: 'accountant',   first: '2026-06-03', last: '2026-08-28 08:20' },
  { id: 'u4', company: 'c1', name: 'คุณตี๋ · หัวหน้าสำนักงาน', line: 'Ud01e...52bb', role: 'office_admin', first: '2026-06-03', last: '2026-08-27 17:41' },
  { id: 'u5', company: 'c1', name: 'วีระ (ฝ่ายจัดซื้อ)', line: 'Ue53a...19cd', role: 'member',     first: '2026-07-11', last: '2026-08-28 11:38' },
  /* เพิ่งเข้ากลุ่มและยังไม่เคยพิมพ์ — ระบบเห็นแค่ event ตอนเข้ากลุ่ม ยังไม่มี line_user_id ให้ผูกงาน
     คอลัมน์ line จึงเป็น "—" ตรงกับที่บอทบอกในบทสนทนาว่ายังมอบหมายงานให้ไม่ได้ */
  { id: 'u6', company: 'c1', name: 'มานี (เข้าใหม่)',   line: '—', role: 'member',                first: '2026-08-27', last: '2026-08-27 10:05', isNew: true },
  { id: 'u7', company: 'c2', name: 'คุณหญิง (เจ้าของ)', line: 'Ua21f...3e90', role: 'owner',       first: '2026-06-20', last: '2026-08-27 12:00' },
  { id: 'u8', company: 'c2', name: 'ธนา (สโตร์)',      line: 'Ub44c...9911', role: 'member',      first: '2026-06-20', last: '2026-08-28 08:55' },
  { id: 'u15', company: 'c3', name: 'ปอ · นักบัญชี',           line: 'U6b09...3360', role: 'accountant',   first: '2026-07-01', last: '2026-08-28 09:50' },
  { id: 'u10', company: 'c4', name: 'สุดา · หัวหน้าสำนักงาน',  line: 'U7c1a...4471', role: 'office_admin', first: '2026-08-12', last: '2026-08-28 09:05' },
  { id: 'u11', company: 'c4', name: 'คุณนคร (เจ้าของ)',      line: 'U8d2b...5582', role: 'owner',        first: '2026-08-12', last: '2026-08-27 16:20' },
  { id: 'u12', company: 'c4', name: 'อ้อม · นักบัญชี',        line: 'U9e3c...6693', role: 'accountant',   first: '2026-08-12', last: '2026-08-28 10:40' },
  { id: 'u13', company: 'c5', name: 'คุณหมี (เจ้าของ)',       line: 'Uaf4d...7704', role: 'owner',        first: '2026-08-14', last: '2026-08-26 18:10' },
  { id: 'u14', company: 'c5', name: 'ต้น (หน้าร้าน)',         line: 'Ubg5e...8815', role: 'member',       first: '2026-08-14', last: '2026-08-28 08:30' },
  { id: 'u9', company: 'c3', name: 'คุณชัย (เจ้าของ)',  line: 'Uc09a...4402', role: 'owner',       first: '2026-07-05', last: '2026-08-27 19:20' }
];

/* ---------- เอกสาร + ผลอ่านของ AI ---------- */
function mkDoc(o) {
  const d = Object.assign({
    category: 'ค่าใช้จ่ายทั่วไป', issues: [], exportedAt: null, batch: null, staleExport: null, deleted: false
  }, o);
  /* ความมั่นใจต้องเป็นค่าที่โมเดลคืนมาจริงเท่านั้น — เดิมเสก base/vat/category ต่อจาก conf.total (ลบ .02/.03/.12)
     ซึ่งไม่มี input ที่ไหนรองรับ · ช่องที่ seed ไม่ได้ให้ค่ามา ต้องขึ้น "—" ทุกจอเหมือนกัน
     ยังต้องการันตีว่ามี d.conf เสมอ เพราะดรอเวอร์อ่าน d.conf[k] ตรง ๆ */
  if (!d.conf) d.conf = {};
  return d;
}
const DOCUMENTS = [
  mkDoc({ id:'D-2608-016', time:'09:12', company:'c1', date:'2026-08-28', vendor:'บจก. สยามแม็คโคร', taxId:'0107537000891',
    base:2803.74, vat:196.26, total:3000.00, category:'ต้นทุนสินค้า', status:'clean',
    conf:{vendor:.98, taxId:.97, date:.99, total:.99}, by:'u1' }),
  mkDoc({ id:'D-2608-015', time:'11:38', company:'c1', date:'2026-08-28', vendor:'ร้านเครื่องเขียนสมใจ', taxId:'1103700xxxxx',
    base:1121.50, vat:78.50, total:1200.00, category:'วัสดุสำนักงาน', status:'flagged',
    conf:{vendor:.90, taxId:.48, date:.96, total:.94}, by:'u5',
    issues:[{field:'taxId', msg:'เลขผู้เสียภาษีอ่านได้ไม่ครบ 13 หลัก'}] }),
  mkDoc({ id:'D-2608-014', time:'16:05', company:'c1', date:'2026-08-27', vendor:'บจก. ออฟฟิศเมท', taxId:'0105536012346',
    base:1000.00, vat:70.00, total:1070.00, category:'วัสดุสำนักงาน', status:'clean',
    conf:{vendor:.98, taxId:.97, date:.99, total:.99}, by:'u1' }),
  mkDoc({ id:'D-2608-013', time:'10:22', company:'c1', date:'2026-08-27', vendor:'ปตท. สาขาบางนา', taxId:'0107544000108',
    base:1869.16, vat:130.84, total:2000.00, category:'ค่าน้ำมัน', status:'clean',
    conf:{vendor:.96, taxId:.95, date:.98, total:.99}, by:'u5' }),
  mkDoc({ id:'D-2608-012', company:'c1', date:'2026-08-26', vendor:'ร้านวัสดุ ก.ก่อสร้าง', taxId:'3100900xxxxx',
    base:7000.00, vat:490.00, total:7490.00, category:'ค่าซ่อมบำรุง', status:'flagged',
    conf:{vendor:.91, taxId:.42, date:.94, total:.63}, by:'u1',
    issues:[
      {field:'taxId', msg:'เลขผู้เสียภาษี 13 หลักไม่ครบ / checksum ไม่ผ่าน'},
      {field:'total', msg:'ยอดรวมอาจอ่านผิด — 1,070 ↔ 7,490 เป็นคู่ที่สับสนบ่อย'}
    ] }),
  mkDoc({ id:'D-2608-011', company:'c1', date:'2026-08-26', vendor:'บจก. ทรู คอร์ปอเรชั่น', taxId:'0107536000633',
    base:1214.95, vat:85.05, total:1300.00, category:'ค่าสื่อสาร', status:'clean',
    conf:{vendor:.97, taxId:.96, date:.99, total:.98}, by:'u5', exportedAt:'2026-08-26 18:02', batch:'EXP-2608-01' }),
  mkDoc({ id:'D-2608-010', company:'c1', date:'2026-08-25', vendor:'—', taxId:'—',
    base:null, vat:null, total:null, category:'ยังไม่จัดหมวด', status:'unreadable',
    conf:{}, by:'u1', issues:[{field:'-', msg:'ภาพเบลอ อ่านข้อมูลไม่ออกเลย — เก็บไฟล์ไว้แล้วในโฟลเดอร์ _รอตรวจสอบ'}] }),
  mkDoc({ id:'D-2608-009', company:'c1', date:'2026-08-25', vendor:'บจก. เอสซีจี ดิสทริบิวชั่น', taxId:'0107537000114',
    base:24299.07, vat:1700.93, total:26000.00, category:'ต้นทุนสินค้า', status:'clean',
    conf:{vendor:.95, taxId:.94, date:.97, total:.98}, by:'u5', exportedAt:'2026-08-26 18:02', batch:'EXP-2608-01' }),
  mkDoc({ id:'D-2608-008', company:'c1', date:'2026-08-24', vendor:'ร้านกาแฟ ณ ท่าน้ำ', taxId:'—',
    base:280.00, vat:0.00, total:280.00, category:'ค่ารับรอง', status:'flagged',
    conf:{vendor:.88, taxId:.10, date:.93, total:.92}, by:'u1',
    issues:[{field:'taxId', msg:'ไม่พบเลขผู้เสียภาษีบนใบ — อาจเป็นบิลเงินสด ไม่ใช่ใบกำกับภาษี'}] }),
  mkDoc({ id:'D-2608-007', company:'c1', date:'2026-08-24', vendor:'บจก. ไปรษณีย์ไทย', taxId:'0107546000121',
    base:654.21, vat:45.79, total:700.00, category:'ค่าขนส่ง', status:'clean',
    conf:{vendor:.97, taxId:.98, date:.99, total:.99}, by:'u1', exportedAt:'2026-08-26 18:02', batch:'EXP-2608-01' }),
  mkDoc({ id:'D-2608-006', company:'c1', date:'2026-08-22', vendor:'บจก. เมกาโฮม', taxId:'0105556XXXXX',
    base:3271.03, vat:228.97, total:3500.00, category:'วัสดุสิ้นเปลือง', status:'clean',
    conf:{vendor:.93, taxId:.95, date:.94, total:.96}, by:'u5' }),
  mkDoc({ id:'D-2608-005', company:'c1', date:'2026-08-20', vendor:'บจก. ซีพี ออลล์', taxId:'0107542000011',
    base:467.29, vat:32.71, total:500.00, category:'ค่าใช้จ่ายทั่วไป', status:'clean',
    conf:{vendor:.96, taxId:.97, date:.98, total:.99}, by:'u1', exportedAt:'2026-08-26 18:02', batch:'EXP-2608-01' }),
  mkDoc({ id:'D-2608-004', company:'c1', date:'2026-08-18', vendor:'การไฟฟ้านครหลวง', taxId:'0994000165676',
    base:8411.21, vat:588.79, total:9000.00, category:'ค่าสาธารณูปโภค', status:'clean',
    conf:{vendor:.99, taxId:.99, date:.99, total:.99}, by:'u2', exportedAt:'2026-08-26 18:02', batch:'EXP-2608-01' }),
  mkDoc({ id:'D-2608-003', company:'c1', date:'2026-08-15', vendor:'บจก. แกร็บแท็กซี่', taxId:'0105558XXXXX',
    base:934.58, vat:65.42, total:1000.00, category:'ค่าเดินทาง', status:'clean',
    conf:{vendor:.94, taxId:.90, date:.97, total:.98}, by:'u5', exportedAt:'2026-08-26 18:02', batch:'EXP-2608-01' }),

  mkDoc({ id:'D-2608-002', company:'c1', date:'2026-08-13', vendor:'บจก. ลินเด้ ประเทศไทย', taxId:'0107536000196',
    base:4205.61, vat:294.39, total:4500.00, category:'วัสดุสิ้นเปลือง', status:'clean',
    conf:{vendor:.97, taxId:.96, date:.98, total:.99}, by:'u5', exportedAt:'2026-08-26 18:02', batch:'EXP-2608-01' }),
  mkDoc({ id:'D-2608-001', company:'c1', date:'2026-08-12', vendor:'ร้านอาหารครัวคุณย่า', taxId:'—',
    base:1850.00, vat:0.00, total:1850.00, category:'ค่ารับรอง', status:'clean',
    conf:{vendor:.89, taxId:.91, date:.95, total:.93}, by:'u1' }),
  mkDoc({ id:'D-2608-000', company:'c1', date:'2026-08-10', vendor:'บจก. เอสโซ่ ประเทศไทย', taxId:'0107536000021',
    base:2336.45, vat:163.55, total:2500.00, category:'ค่าน้ำมัน', status:'clean',
    conf:{vendor:.98, taxId:.97, date:.99, total:.99}, by:'u5', exportedAt:'2026-08-26 18:02', batch:'EXP-2608-01' }),
  mkDoc({ id:'D-2607-098', company:'c1', date:'2026-08-07', vendor:'บจก. ออฟฟิศเมท', taxId:'0105536012346',
    base:747.66, vat:52.34, total:800.00, category:'วัสดุสำนักงาน', status:'clean',
    conf:{vendor:.98, taxId:.98, date:.99, total:.99}, by:'u1', exportedAt:'2026-08-26 18:02', batch:'EXP-2608-01' }),
  mkDoc({ id:'D-2607-097', company:'c1', date:'2026-08-05', vendor:'การประปานครหลวง', taxId:'0994000158378',
    base:1121.50, vat:78.50, total:1200.00, category:'ค่าสาธารณูปโภค', status:'clean',
    conf:{vendor:.99, taxId:.99, date:.99, total:.99}, by:'u2', exportedAt:'2026-08-26 18:02', batch:'EXP-2608-01' }),
  mkDoc({ id:'D-2607-096', company:'c1', date:'2026-08-03', vendor:'บจก. เคอรี่ เอ็กซ์เพรส', taxId:'0105556090xxx',
    base:420.56, vat:29.44, total:450.00, category:'ค่าขนส่ง', status:'clean',
    conf:{vendor:.94, taxId:.93, date:.97, total:.96}, by:'u1' }),

  mkDoc({ id:'D-2608-S02', company:'c2', date:'2026-08-27', vendor:'ตลาดไท ผักสด', taxId:'—',
    base:12500.00, vat:0.00, total:12500.00, category:'ต้นทุนวัตถุดิบ', status:'flagged',
    conf:{vendor:.85, taxId:.05, date:.95, total:.90}, by:'u8',
    issues:[{field:'taxId', msg:'บิลเงินสด ไม่มีเลขผู้เสียภาษี'}] }),
  mkDoc({ id:'D-2608-S01', company:'c2', date:'2026-08-26', vendor:'บจก. แม็คโคร', taxId:'0107537000891',
    base:18691.59, vat:1308.41, total:20000.00, category:'ต้นทุนวัตถุดิบ', status:'clean',
    conf:{vendor:.98, taxId:.97, date:.99, total:.99}, by:'u8' }),
  mkDoc({ id:'D-2608-N03', company:'c4', time:'10:15', date:'2026-08-28', vendor:'บจก. บางจาก คอร์ปอเรชั่น', taxId:'0107536000269',
    base:11214.95, vat:785.05, total:12000.00, category:'ค่าน้ำมัน', status:'clean',
    conf:{vendor:.98, taxId:.98, date:.99, total:.99}, by:'u12' }),
  mkDoc({ id:'D-2608-N02', company:'c4', time:'14:40', date:'2026-08-26', vendor:'อู่ซ่อมรถสมชายการช่าง', taxId:'3102000xxxxx',
    base:8411.21, vat:588.79, total:9000.00, category:'ค่าซ่อมบำรุง', status:'flagged',
    conf:{vendor:.90, taxId:.45, date:.94, total:.92}, by:'u12',
    issues:[{field:'taxId', msg:'เลขผู้เสียภาษีไม่ครบ 13 หลัก — อู่รายย่อย'}] }),
  mkDoc({ id:'D-2608-N01', company:'c4', date:'2026-08-21', vendor:'บจก. มิชลิน สยาม', taxId:'0105518000234',
    base:22429.91, vat:1570.09, total:24000.00, category:'ต้นทุนสินค้า', status:'clean',
    conf:{vendor:.97, taxId:.96, date:.98, total:.99}, by:'u12', exportedAt:'2026-08-27 17:10', batch:'EXP-2608-N1' }),
  mkDoc({ id:'D-2608-M02', company:'c5', date:'2026-08-25', vendor:'ร้านเหล็กเจริญพาณิชย์', taxId:'0105540000110',
    base:4672.90, vat:327.10, total:5000.00, category:'ต้นทุนสินค้า', status:'clean',
    conf:{vendor:.95, taxId:.94, date:.97, total:.98}, by:'u14' }),
  mkDoc({ id:'D-2608-M01', company:'c5', date:'2026-08-22', vendor:'—', taxId:'—',
    base:null, vat:null, total:null, category:'ยังไม่จัดหมวด', status:'unreadable',
    conf:{}, by:'u14', issues:[{field:'-', msg:'ถ่ายย้อนแสง อ่านไม่ออกทั้งใบ'}] }),
  mkDoc({ id:'D-2608-T01', company:'c3', date:'2026-08-25', vendor:'บจก. ทองคำแท่งไทย', taxId:'0105545000771',
    base:467289.72, vat:32710.28, total:500000.00, category:'ต้นทุนสินค้า', status:'clean',
    conf:{vendor:.97, taxId:.98, date:.99, total:.99}, by:'u9' })
];

/* ---------- งาน + คำขออนุมัติ (tasks: type = task | approval) ----------
   byOrg = created_by_org — องค์กรของผู้สั่ง ไม่ใช่ตัวคน (B-13)
     ค่าเป็น company id ('c1') เมื่อคนในบริษัทสั่งกันเอง · เป็น tenant id ('t1') เมื่อสำนักงานเป็นผู้สั่ง
     เก็บระดับองค์กรเพราะนักบัญชีลาออกแล้วงานที่สั่งไว้ต้องไม่กลายเป็นงานไร้เจ้าของ —
     คนที่รับช่วงดูแลบริษัทนั้นต่อต้องปิด/ตามงานเดิมได้ทันทีโดยไม่ต้องย้ายข้อมูล
   acceptedAt = ผู้สั่งตรวจรับแล้วเมื่อไหร่ (B-14)
     ใช้เฉพาะงานข้ามองค์กร (สำนักงานสั่งลูกค้า / ลูกค้าสั่งสำนักงาน) — งานภายในบริษัทเดียวกันไม่ต้องรับ
     null = ปิดแล้วแต่ผู้สั่งยังไม่ได้ดู · ไม่กดภายใน 7 วันถือว่ารับอัตโนมัติ (หมดหน้าต่างเปิดงานกลับพอดี)
     ไม่เพิ่มค่าสถานะใหม่ เพราะ ค้าง/กำลังทำ/เสร็จ ถูกใช้คิด % เสร็จ บนแดชบอร์ดอยู่ */
const TASKS = [
  /* งานที่ "สมาชิกกลุ่ม" เป็นคนสั่งเอง — task_assign เป็นสิทธิ์ระดับ 1 ไม่ใช่ของเจ้าของอย่างเดียว
     ใบนี้เกิดจากบทสนทนาในหน้าจอ LINE (ขั้นตอน "มอบหมายงาน") */
  /* งานที่บอทสร้างเองหลังอ่านย้อนหลังเสร็จ — ในบทสนทนาอ้างถึง T-043 จึงต้องมีอยู่จริงในตาราง */
  { id:'T-043', company:'c1', type:'task', title:'ถ่ายใหม่ 3 หน้าที่อ่านไม่ออกจากการอ่านย้อนหลัง', assignee:'u1', by:'u2', byOrg:'c1',
    due:'2026-09-04', status:'open', evidence:true, reminded:0 },
  { id:'T-042', company:'c1', type:'task', title:'ขอใบกำกับภาษีเต็มรูปจากร้านวัสดุ ก.ก่อสร้าง', assignee:'u5', by:'u1', byOrg:'c1',
    due:'2026-08-31', status:'open', evidence:true, reminded:0,
    autoClose:'ปิดเองเมื่อใบกำกับภาษีเต็มรูปของร้านนี้เข้าระบบ' },
  { id:'T-041', company:'c1', type:'task', title:'ส่งใบเสร็จค่าน้ำมันเดือน ส.ค. ให้ครบ', assignee:'u5', by:'u2', byOrg:'c1',
    due:'2026-08-29', status:'open', evidence:true, reminded:2 },
  /* นภาเป็นผู้ตรวจเอกสารอยู่แล้ว คำขอจึงต้องเป็นสิทธิ์ที่เธอยังไม่มีจริง — ลบเอกสารเป็นระดับ 2b ของเจ้าของ */
  { id:'T-040', company:'c1', type:'approval', title:'ขอสิทธิ์ลบเอกสารซ้ำของ ABC ให้ "นภา" (ระดับ 2b)', assignee:'u2', by:'u4', byOrg:'t1',
    due:'2026-08-28', status:'open', evidence:false, reminded:0 },
  /* สองใบนี้สำนักงานสั่งนักบัญชีของตัวเอง — byOrg เท่ากับองค์กรของผู้รับ จึงเป็นงานภายใน ไม่ต้องตรวจรับ */
  { id:'T-039', company:'c1', type:'task', title:'กดส่งออกเอกสารเดือน ส.ค. เข้าโปรแกรมบัญชี', assignee:'u3', by:'u4', byOrg:'t1',
    due:'2026-09-02', status:'open', evidence:false, reminded:0, autoClose:'ปิดเองเมื่อมี export batch ของเดือนนี้' },
  { id:'T-038', company:'c1', type:'task', title:'ตรวจใบติดธง 3 ใบของสัปดาห์นี้', assignee:'u3', by:'u4', byOrg:'t1',
    due:'2026-08-26', status:'open', evidence:false, reminded:2 },
  /* เคสข้ามองค์กรของจริง — นภา (สำนักงาน t1) สั่ง แล้วสมชาย (บริษัท c1) เป็นคนกดปิดเอง
     ปิดแล้วแต่ acceptedAt ยังว่าง = ฝั่งสำนักงานยังไม่ได้ตรวจรับ เหลือเวลาอีก 6 วันก่อนรับอัตโนมัติ */
  { id:'T-037', company:'c1', type:'task', title:'ถ่ายใบเสร็จ D-2608-010 ใหม่ (ภาพเบลอ)', assignee:'u1', by:'u3', byOrg:'t1',
    due:'2026-08-27', status:'done', evidence:true, reminded:1, completedBy:'u1', completedAt:'2026-08-27 14:20', acceptedAt:null },
  { id:'T-N01', company:'c4', type:'task', title:'ตรวจใบซ่อมรถที่ติดธง 1 ใบ', assignee:'u12', by:'u10', byOrg:'t2',
    due:'2026-08-29', status:'open', evidence:false, reminded:0 },
  { id:'T-S12', company:'c2', type:'task', title:'ส่งบิลค่าวัตถุดิบสัปดาห์ที่ 4', assignee:'u8', by:'u7', byOrg:'c2',
    due:'2026-08-30', status:'open', evidence:true, reminded:0 }
];

/* ---------- ชุดส่งออก ---------- */
const EXPORTS = [
  { id:'EXP-2608-01', company:'c1', period:'ส.ค. 2569 (1–26)', count:10, by:'u3', at:'2026-08-26 18:02',
    files:['ChapWai_ABC_2026-08_documents.xlsx', 'ChapWai_ABC_2026-08_review.pdf'] },
  { id:'EXP-2607-02', company:'c1', period:'ก.ค. 2569', count:13, by:'u3', at:'2026-08-02 10:15',
    files:['ChapWai_ABC_2026-07_documents.xlsx', 'ChapWai_ABC_2026-07_review.pdf'] },
  { id:'EXP-2608-N1', company:'c4', period:'ส.ค. 2569 (1–27)', count:1, by:'u12', at:'2026-08-27 17:10',
    files:['ChapWai_NakhonChai_2026-08_documents.xlsx', 'ChapWai_NakhonChai_2026-08_review.pdf'] },
  { id:'EXP-2607-S1', company:'c2', period:'ก.ค. 2569', count:4, by:'u3', at:'2026-08-03 11:40',
    files:['ChapWai_SiamFoods_2026-07_documents.xlsx', 'ChapWai_SiamFoods_2026-07_review.pdf'] }
];

/* ---------- audit_log ---------- */
const AUDIT = [
  { at:'2026-08-28 08:20', actor:'u3', company:'c1', action:'เปิดดูเอกสาร D-2608-012', before:'', after:'' },
  { at:'2026-08-28 08:05', actor:'u3', company:'c2', action:'เปิดดูเอกสาร D-2608-S02', before:'', after:'' },
  { at:'2026-08-27 19:20', actor:'u9', company:'c3', action:'เปลี่ยนเวลาสรุปประจำวัน', before:'09:00', after:'08:00' },
  { at:'2026-08-27 17:41', actor:'u4', company:'c1', action:'ขออนุมัติสิทธิ์ลบเอกสารให้ "นภา"', before:'accountant', after:'accountant + ลบเอกสาร (รออนุมัติ)' },
  { at:'2026-08-27 14:20', actor:'u1', company:'c1', action:'ปิดงาน T-037', before:'open', after:'done' },
  { at:'2026-08-27 10:05', actor:'u6', company:'c1', action:'เข้ากลุ่มไลน์ครั้งแรก', before:'', after:'group_members +1' },
  { at:'2026-08-26 18:02', actor:'u3', company:'c1', action:'สร้างชุดส่งออก EXP-2608-01 (10 ใบ)', before:'', after:'exported_at ถูกเซ็ต' },
  { at:'2026-08-26 16:30', actor:'u3', company:'c1', action:'แก้ไขฟิลด์ total ของ D-2608-006', before:'3,050.00', after:'3,500.00' },
  { at:'2026-08-25 09:10', actor:'u2', company:'c1', action:'เปลี่ยน financial_visibility', before:'ปิด', after:'เปิด' },
  { at:'2026-08-24 11:02', actor:'u2', company:'c1', action:'ผูกกลุ่มไลน์ "บัญชี ABC × สำนักงานรุ่งเรือง"', before:'', after:'companies.group_id' }
];

/* ตัวเลขของฉาก "อ่านย้อนหลัง" ในหน้าจอ LINE — เป็นข้อมูลตัวอย่างของฉาก ไม่ใช่ไฟล์จริงในระบบ
   รวมไว้ที่เดียวเพราะเดิมพิมพ์ซ้ำทั้งใน KPI และในการ์ดใบเสนอราคา แก้ที่เดียวไม่พอ */
const BACKFILL_DEMO = { files: 312, pages: 480, months: 6, since: 'มี.ค. 2569' };

/* ---------- ฉากในหน้าจอ LINE ----------
   ปุ่มลัดเหนือเครื่องโทรศัพท์ — กระโดดเข้าฉากไหนก็ได้โดยไม่ต้องไล่กดทีละขั้น
   steps[0] คือจุดเริ่มของฉาก · side บอกว่าเป็นห้องกลุ่มหรือแชท 1-1 (ใช้เลือกหัวห้องแชท) */
const LINE_SCENES = [
  { id:'start',  label:'ส่งเอกสารเข้ากลุ่ม', side:'group',
    steps:['start', 'processing', 'storeonly', 'remember'] },
  { id:'files',  label:'ไฟล์ที่ไม่ใช่รูป', side:'group',
    steps:['files', 'filesread', 'filesreadall', 'filesstore', 'filesunknown'] },
  { id:'review', label:'ตรวจ + แก้ค่าที่ AI อ่าน', side:'group',
    steps:['review', 'review2', 'edit', 'edit2', 'confirmed', 'confirmed2', 'confirmedasis'] },
  { id:'tasks',  label:'งานของฉัน', side:'group',
    steps:['tasks', 'taskdone', 'taskdefer'] },
  { id:'assign', label:'มอบหมายงาน', side:'group',
    steps:['assign', 'assignwho', 'assigned', 'assignquiet', 'assignunknown'] },
  { id:'office', label:'ฝั่งสำนักงาน · แชท 1-1', side:'one',
    roles:['accountant', 'office_admin'],
    steps:['office', 'exporting', 'exportdone', 'officeswitch', 'reviewsiam'] },
  /* เจ้าของก็มีแชท 1-1 กับบอท (ขั้นตอนติดตั้งข้อ 2 บังคับให้เพิ่มบอทเป็นเพื่อน)
     เรื่องที่มีค่าใช้จ่ายจึงคุยในห้องนี้ ไม่ใช่ในกลุ่ม — มีแต่สมาชิกที่ไม่มีห้อง 1-1 */
  { id:'backfill', label:'อ่านย้อนหลัง · แชท 1-1', side:'one',
    roles:['owner', 'accountant', 'office_admin'],
    steps:['backfill', 'backfillquote', 'backfilldone'] }
];

/* ---------- บทสนทนาจำลองใน LINE ---------- */
const LINE_STEPS = {
  start: {
    chat: { title: 'บัญชี ABC × สำนักงานรุ่งเรือง', sub: 'สมาชิก 6 คน · บอท Chap Wai' },
    messages: [
      { who:'sys', text:'วันนี้ · 09:12' },
      { who:'me', name:'สมชาย', text:'[ ส่งรูป 12 ใบ ]', time:'09:12' },
      { who:'bot', text:'ได้รับ 12 รูปแล้วครับ 📄\nดูเหมือนใบกำกับภาษี / ใบเสร็จ', time:'09:12',
        note:'รวมชุด (Batch Grouping) — รูปที่ส่งติดกันภายใน 10 วินาทีจากคนเดียวกัน = ชุดเดียว ถามครั้งเดียว' }
    ],
    quick: [
      { label:'อ่านข้อมูล + เก็บไฟล์', primary:true, next:'processing' },
      { label:'เก็บไฟล์เฉย ๆ', next:'storeonly' },
      { label:'ทำแบบนี้ทุกครั้งเลย', next:'remember' }
    ],
    behind: [
      { t:'Instant File Fetch', d:'ดึงไฟล์จาก LINE Content API ทันทีที่รับ webhook — ไฟล์ LINE มีอายุจำกัด ถ้ารอผู้ใช้กดปุ่มก่อนจะดึงไม่ทัน' },
      { t:'pending_uploads', d:'บันทึก line_message_id · staging_path · file_hash · group_id' },
      { t:'Duplicate Guard', d:'เช็ก file_hash (SHA-256) — ลูกค้าส่งใบเดิมซ้ำบ่อยมาก' }
    ]
  },

  processing: {
    messages: [
      { who:'me', name:'สมชาย', text:'อ่านข้อมูล + เก็บไฟล์', time:'09:12' },
      { who:'bot', text:'กำลังอ่าน 12 ใบครับ ⏳', time:'09:12' },
      { who:'bot', text:'อ่านเสร็จแล้วครับ\n✅ ผ่านเลย 9 ใบ  ⚠️ ต้องดู 2 ใบ  ❌ อ่านไม่ออก 1 ใบ', time:'09:13',
        note:'ตัดสินใจตาม confidence — บันทึกเสมอ ไม่กั้น' },
      { who:'bot', card:'clean', time:'09:13' },
      { who:'bot', card:'flagged', time:'09:13' },
      { who:'bot', card:'unreadable', time:'09:13' }
    ],
    quick: [
      { label:'ดูใบที่ต้องตรวจ', primary:true, next:'review' },
      { label:'เริ่มใหม่', next:'start', muted:true }
    ],
    behind: [
      { t:'Vision Extract → JSON', d:'ส่งภาพเข้าโมเดล Vision แล้วรับ JSON กลับ — เก็บ model_used ไว้ใน extractions ทุกครั้ง' },
      { t:'Rule Validation', d:'ผลบวกรายการ = ยอดรวม (±0.01) · VAT = 7% ของฐาน (±0.05) · เลขผู้เสียภาษี 13 หลัก + checksum · วันที่แปลง ISO ได้' },
      { t:'Status Flagging', d:'clean / flagged / unreadable — สำนักงานกรองดูเฉพาะ flagged คือคุณค่าหลักของระบบ' },
      { t:'Safe Delete บนการ์ด', d:'ปุ่ม "ลบใบนี้" ขึ้นเฉพาะคนที่มีสิทธิ์ 2b (เจ้าของ) — เคสจริงคือพนักงานเผลอส่งสลิปส่วนตัว เจ้าของเห็นในแชทแล้วลบได้ทันที ไม่ต้องเปิดเว็บ · เป็น soft delete เซ็ต deleted_at ไม่ลบไฟล์จริง' }
    ]
  },

  storeonly: {
    messages: [
      { who:'me', name:'สมชาย', text:'เก็บไฟล์เฉย ๆ', time:'09:12' },
      { who:'bot', text:'📥 เก็บไฟล์ 12 ใบไว้แล้วครับ ยังไม่ได้อ่านข้อมูล\nสั่งอ่านทีหลังได้ตลอด พิมพ์ว่า "ฉับไว" ได้เลย', time:'09:12',
        note:'STORED_ONLY — ไฟล์ไม่หาย สั่งอ่านย้อนหลังได้' }
    ],
    quick: [
      { label:'สั่งอ่านตอนนี้', primary:true, next:'processing' },
      { label:'ส่งไฟล์ PDF/Word บ้าง', next:'files' },
      { label:'เริ่มใหม่', next:'start', muted:true }
    ],
    behind: [
      { t:'OCR เก็บไฟล์เสมอ', d:'ไม่ว่าเส้นทางไหน ไฟล์ต้องถูกเก็บก่อน — Drive ล้ม ≠ ระบบล้ม' },
      { t:'Smart Command', d:'คำกระตุ้น "ฉับไว" เป็นทางเข้าเดียวทุกห้อง (ไม่ทำ Rich Menu ตาม B-7)' }
    ]
  },

  remember: {
    messages: [
      { who:'me', name:'สมชาย', text:'ทำแบบนี้ทุกครั้งเลย', time:'09:12' },
      { who:'bot', text:'จำไว้แล้วครับ ✅\nครั้งต่อไปที่คุณส่งรูป ผมจะอ่านข้อมูล + เก็บไฟล์ให้ทันที ไม่ถามซ้ำ', time:'09:12',
        note:'user_preferences.default_action — Remember My Choice' }
    ],
    quick: [
      { label:'ส่งรูปชุดใหม่', primary:true, next:'processing' },
      { label:'เริ่มใหม่', next:'start', muted:true }
    ],
    behind: [
      { t:'user_preferences', d:'เก็บ default_action + default_folder_id ต่อผู้ใช้ — ถามให้น้อยที่สุด' }
    ]
  },

  review: {
    messages: [
      { who:'me', name:'สมชาย', text:'ดูใบที่ต้องตรวจ', time:'09:14' },
      { who:'bot', card:'flagged', time:'09:14' },
      { who:'bot', text:'ใบนี้มี 2 จุดที่ควรดูครับ\nกด "แก้ไข" แล้วผมจะถามทีละฟิลด์', time:'09:14',
        note:'เฟส 1 แก้ผ่านแชท ไม่ต้องสร้างหน้าเว็บ (ตัด LIFF ตาม B-8)' }
    ],
    quick: [
      { label:'แก้ไข', primary:true, next:'edit' },
      { label:'ถูกต้องแล้ว', next:'confirmedasis' },
      { label:'ใบถัดไป', next:'review2', muted:true }
    ],
    behind: [
      { t:'Flex Review Card', d:'แสดงรูปคู่ตัวเลขในบับเบิลเดียว — ไม่ต้องออกจากไลน์' },
      { t:'edit_sessions', d:'ผูก session กับ (คน + เอกสาร) เพราะในกลุ่มมีหลายคนแก้หลายใบพร้อมกัน' },
      { t:'ตรวจสิทธิ์ตอนรับ postback', d:'ปุ่มที่ส่งเข้ากลุ่ม ใครในกลุ่มก็กดได้ — ต้องเช็ก line_user_id กับ role ทุกครั้ง' }
    ]
  },

  edit: {
    messages: [
      { who:'me', name:'สมชาย', text:'แก้ไข', time:'09:15' },
      { who:'bot', card:'fieldpicker', time:'09:15',
        note:'Field Picker ต้องแสดง "ทุกฟิลด์" ไม่ใช่แค่ที่ติดธง — AI อ่านผิดแบบมั่นใจก็เกิดได้ และอันตรายกว่า' },
      { who:'bot', text:'พิมพ์ยอดรวมที่ถูกต้องมาได้เลยครับ', time:'09:15' },
      { who:'me', name:'สมชาย', text:'1070.00', time:'09:16' },
      { who:'bot', text:'✅ แก้ให้แล้วครับ\nยอดรวม 7,490.00 → 1,070.00\nคำนวณใหม่: ฐาน 1,000.00 · VAT 70.00\nตรงกับสูตร VAT 7% แล้ว ✓', time:'09:16',
        note:'Auto Recalculate + Instant Check — คำนวณและ validate ซ้ำทันทีหลังแก้' }
    ],
    quick: [
      { label:'บันทึก', primary:true, next:'confirmed' },
      { label:'แก้ฟิลด์อื่นอีก', next:'edit2' }
    ],
    behind: [
      { t:'corrections', d:'เก็บ ภาพต้นฉบับ + ค่าที่ AI อ่าน + ค่าที่ถูก + ใครแก้ + เมื่อไหร่ — ทุกครั้งที่คนแก้ = ชุดทดสอบหนึ่งใบที่ได้มาฟรี' },
      { t:'Learn From You', d:'ไม่เก็บวันนี้ = หายตลอดกาล' }
    ]
  },

  confirmed: {
    messages: [
      { who:'bot', text:'✅ บันทึกแล้ว — ร้านวัสดุ ก.ก่อสร้าง · 1,070.00 บาท (VAT 70.00)\nไฟล์: 2026-08-26_ร้านวัสดุกก่อสร้าง_1070.00.jpg', time:'09:16',
        note:'Smart File Naming — ชื่อไฟล์ตามรูปแบบ วันที่_ผู้ขาย_ยอด' },
      { who:'sys', text:'พรุ่งนี้ 08:30' },
      { who:'bot', text:'สรุปเช้านี้ครับ ☀️\n📄 เอกสารเมื่อวาน 12 ใบ — ผ่านเลย 10 · ต้องดู 1 · อ่านไม่ออก 1\n📌 งานค้าง 2 รายการ\n   • ส่งใบเสร็จค่าน้ำมัน ส.ค. (วีระ) ครบกำหนดพรุ่งนี้\n   • ตรวจใบติดธง 3 ใบ (นภา) เลยกำหนด 2 วัน', time:'08:30',
        note:'1 กลุ่ม = 1 push ต่อวัน — รวมเรื่องเอกสารกับเรื่องงานไว้ในข้อความเดียว เพราะ push นับโควตา' }
    ],
    quick: [
      { label:'เริ่มใหม่', primary:true, next:'start' },
      { label:'ดูงานของฉัน', next:'tasks' },
      { label:'มอบหมายงาน', next:'assign' }
    ],
    behind: [
      { t:'Daily Digest', d:'ตอบกลับ = ฟรี · push = นับโควตา (Free 300/เดือน · Basic ฿1,280 = 15,000 · Pro ฿1,780 = 35,000)' },
      { t:'exported_at + export_batch_id', d:'ถ้าแก้ใบที่ export ไปแล้ว ระบบต้องเตือน' }
    ]
  },

  tasks: {
    messages: [
      { who:'me', name:'สมชาย', text:'ดูงานของฉัน', time:'08:31' },
      { who:'bot', card:'task', time:'08:31' },
      { who:'bot', text:'ถ้าเสร็จแล้วกดปุ่มได้เลยครับ — หรือพิมพ์ "เสร็จแล้ว" ก็ได้', time:'08:31',
        note:'ทุกเส้นทางต้องทำงานได้แม้ไม่มี LLM — มีทางปุ่มสำรองเสมอ' }
    ],
    quick: [
      { label:'เสร็จแล้ว', primary:true, next:'taskdone' },
      { label:'ขอเลื่อน', next:'taskdefer' },
      { label:'มอบหมายงานให้เพื่อน', next:'assign' },
      { label:'เริ่มใหม่', next:'start', muted:true }
    ],
    behind: [
      { t:'Team Directory', d:'บอทเปิดดูรายชื่อสมาชิกเองไม่ได้ — ได้ userId ตอนคนพิมพ์/ถูก mention เท่านั้น จึงต้องเก็บ group_members ไว้เอง' },
      { t:'Reminder Ladder', d:'เลย 7 วันบอทหยุดตาม แล้วถามผู้สั่งแทน — กันคนมองข้ามสรุปทั้งฉบับ · ถ้าสำนักงานเป็นผู้สั่ง คำถามไปที่แท็บงานของสำนักงาน ไม่ไปรบกวนเจ้าของบริษัท' }
    ]
  },

  taskdone: {
    messages: [
      { who:'me', name:'สมชาย', text:'เสร็จแล้ว', time:'08:32' },
      { who:'bot', text:'✅ ปิดงาน T-041 แล้วครับ\nบันทึกว่า "สมชาย" เป็นคนกดปิด (ผู้รับผิดชอบคือ วีระ)', time:'08:32',
        note:'completed_by ต้องแยกจาก assignee_id — ย้อนไปเติมทีหลังไม่ได้' }
    ],
    quick: [
      { label:'มอบหมายงานต่อ', primary:true, next:'assign' },
      { label:'เริ่มใหม่', next:'start', muted:true }
    ],
    behind: [
      { t:'ไม่กั้น แต่ให้เห็น', d:'ใครในกลุ่มก็กดปิดงานได้ แต่ระบบบันทึกเสมอว่าใครเป็นคนกด' },
      { t:'งานภายในไม่ต้องตรวจรับ', d:'T-041 เจ้าของสั่งคนในบริษัทเดียวกัน ผู้สั่งกับผู้รับอยู่ฝั่งเดียวกันจึงจบตรงนี้ — ถ้าเป็นงานที่สำนักงานสั่งมา ปิดแล้วจะขึ้นรอสำนักงานตรวจรับอีกชั้น ดูได้ที่แท็บงาน (B-14)' }
    ]
  },

  /* ตรวจใบที่สอง — ปุ่ม "ใบถัดไป" ต้องพาไปใบถัดไปจริง ไม่ใช่เล่นซ้ำการอ่านทั้งชุด */
  review2: {
    messages: [
      { who:'me', name:'สมชาย', text:'ใบถัดไป', time:'09:17' },
      { who:'bot', text:'ใบที่สองครับ — ร้านเครื่องเขียนสมใจ 1,200.00 บาท\nติดธงจุดเดียว: เลขผู้เสียภาษีอ่านได้ไม่ครบ 13 หลัก', time:'09:17',
        note:'ใบติดธงถูกส่งมาทีละใบตามลำดับ ไม่ใช่ยัดมาทั้งชุด — คนตรวจจะได้ปิดทีละใบโดยไม่หลงว่าทำถึงไหนแล้ว' }
    ],
    quick: [
      { label:'แก้เลขผู้เสียภาษี', primary:true, next:'edit2' },
      { label:'ถูกต้องแล้ว', next:'confirmedasis' },
      { label:'เริ่มใหม่', next:'start', muted:true }
    ],
    behind: [
      { t:'คิวใบติดธง', d:'เก็บลำดับไว้ว่าเหลืออีกกี่ใบ กดใบถัดไปแล้วต้องเดินหน้า ไม่ใช่วนกลับที่เดิม' },
      { t:'ปิดทีละใบ', d:'สำนักงานตรวจเป็นชุด ถ้าไม่รู้ว่าถึงใบไหนแล้วจะตรวจซ้ำหรือตกใบ' }
    ]
  },

  /* แก้ฟิลด์ที่สอง — ปิดจุดที่ขั้น review บอกไว้ว่า "ใบนี้มี 2 จุดที่ควรดู" ให้ครบ */
  edit2: {
    messages: [
      { who:'me', name:'สมชาย', text:'แก้เลขผู้เสียภาษี', time:'09:18' },
      { who:'bot', text:'ผมอ่านได้ 1103700xxxxx ครับ ขาดไป 5 หลักท้าย\nพิมพ์เลข 13 หลักที่ถูกต้องมาได้เลย', time:'09:18' },
      { who:'me', name:'สมชาย', text:'1103700123458', time:'09:19' },
      { who:'bot', text:'แก้ให้แล้วครับ\nเลขผู้เสียภาษี 1103700xxxxx → 1103700123456\nครบ 13 หลักและผ่านการตรวจแล้ว ใบนี้ไม่ติดธงอีก', time:'09:19',
        note:'ตรวจซ้ำทันทีหลังคนแก้ ถ้ายังไม่ครบ 13 หลักธงต้องยังอยู่ — ไม่ใช่ปลดธงเพราะมีคนกดปุ่มแก้' }
    ],
    quick: [
      { label:'บันทึก', primary:true, next:'confirmed2' },
      { label:'เริ่มใหม่', next:'start', muted:true }
    ],
    behind: [
      { t:'corrections', d:'เก็บ ค่าที่ AI อ่าน + ค่าที่ถูก + ใครแก้ + เมื่อไหร่ ทุกครั้ง ไม่ว่าจะแก้ฟิลด์ไหน' },
      { t:'ตรวจซ้ำด้วยกติกาเดิม', d:'เลขผู้เสียภาษีต้อง 13 หลัก · แก้แล้วยังไม่ครบ ธงยังอยู่' }
    ]
  },

  /* สรุปของใบที่สอง — ต้องเป็นใบและยอดที่เพิ่งแก้ ไม่ใช่ใบแรกที่มาจากอีกเส้นทางหนึ่ง */
  confirmed2: {
    messages: [
      { who:'bot', text:'✅ บันทึกแล้ว — ร้านเครื่องเขียนสมใจ · 1,200.00 บาท (VAT 78.50)\nเลขผู้เสียภาษี 1103700123456 · ปลดธงให้แล้ว\nไฟล์: 2026-08-28_ร้านเครื่องเขียนสมใจ_1200.00.jpg', time:'09:19',
        note:'สรุปต้องเป็นใบที่เพิ่งแก้ ยอดที่ขึ้นผิดใบทำให้คนกดยืนยันของผิดใบโดยไม่รู้ตัว' }
    ],
    quick: [
      { label:'เริ่มใหม่', primary:true, next:'start' },
      { label:'ดูงานของฉัน', next:'tasks' }
    ],
    behind: [
      { t:'corrections', d:'แถวที่เพิ่งเกิดคือเลขผู้เสียภาษีของใบที่สอง — ค่าที่ AI อ่าน + ค่าที่ถูก + ใครแก้ + เมื่อไหร่' },
      { t:'ปิดทีละใบ', d:'ปิดใบไหนต้องสรุปใบนั้น ไม่งั้นคนตรวจไม่รู้ว่าทำถึงใบไหนแล้ว' }
    ]
  },

  /* ยืนยันว่าค่าที่ AI อ่านถูกอยู่แล้ว — ต้องสรุปด้วยยอดเดิม ไม่ใช่ยอดที่แก้ในอีกเส้นทางหนึ่ง */
  confirmedasis: {
    messages: [
      { who:'me', name:'สมชาย', text:'ถูกต้องแล้ว', time:'09:15' },
      { who:'bot', text:'รับทราบครับ ยืนยันตามที่ผมอ่านไว้\nร้านวัสดุ ก.ก่อสร้าง · 7,490.00 บาท\nบันทึกว่า "สมชาย" เป็นคนยืนยัน และปลดธงให้แล้ว', time:'09:15',
        note:'การยืนยันคือการบอกว่าค่าที่ AI อ่านถูกอยู่แล้ว ยอดสรุปจึงต้องเป็นยอดเดิม ถ้าโชว์ยอดที่แก้แล้วเท่ากับระบบแก้ค่าโดยไม่มีใครสั่ง' }
    ],
    quick: [
      { label:'ใบถัดไป', primary:true, next:'review2' },
      { label:'เริ่มใหม่', next:'start', muted:true }
    ],
    behind: [
      { t:'ยืนยัน ไม่เท่ากับ แก้', d:'ยืนยันไม่สร้างแถวใน corrections เพราะไม่มีค่าที่ถูกต้องใหม่ให้เก็บ มีแต่คนที่รับรอง' },
      { t:'ใครยืนยันต้องบันทึก', d:'ปลดธงได้ แต่ต้องรู้ว่าใครเป็นคนรับรอง ย้อนไปเติมทีหลังไม่ได้' }
    ]
  },

  /* ---------- อ่านย้อนหลัง (M2 + M3) — ไฟล์เก่าที่เก็บไว้แล้วแต่ยังไม่ได้อ่าน ---------- */
  backfill: {
    chat: { title: 'Chap Wai', sub: 'แชท 1-1 · เรื่องที่มีค่าใช้จ่ายคุยในห้องนี้เท่านั้น' },
    messages: [
      { who:'sys', text:'วันนี้ · 14:20' },
      { who:'me', name:'คุณสมพร', text:'ฉับไว อ่านไฟล์เก่าที่เคยส่งไว้', time:'14:20' },
      { who:'bot', text:'ได้ครับ ตอนนี้มีไฟล์ที่เก็บไว้แล้วแต่ยังไม่ได้อ่าน 312 ไฟล์ ย้อนไปถึง มี.ค. 2569\nขอนับหน้าแล้วแจ้งราคาก่อนไหมครับ', time:'14:20',
        note:'เรื่องที่มีค่าใช้จ่ายต้องคุยในแชท 1-1 ไม่ใช่ในกลุ่ม — ราคาที่ประกาศเข้ากลุ่มไปแล้วเรียกคืนไม่ได้ และเจ้าของอาจไม่อยากให้ทั้งทีมเห็น' }
    ],
    /* ตัวเลขชุดเดียวของฉากนี้ — KPI ใบเสนอราคา และบทสนทนา ต้องอ่านจากที่เดียวกัน ไม่งั้นเล่าคนละเรื่องบนจอเดียวกัน */
    stats: { files: 312, pages: 480, charged: 468, since: 'มี.ค. 2569' },
    /* เหลือปุ่มเดียว — สามปุ่มเดิมชี้ไปการ์ดราคาใบเดียวกัน (312 ไฟล์ · 480 หน้า) จึงเป็น knob ที่ไม่เปลี่ยน output
       และยังทำให้ฟองฝั่งผู้ใช้ในขั้นถัดไปพูดไม่ตรงกับปุ่มที่กด */
    quick: [
      { label:'อ่านทั้งหมดที่มี (มี.ค.–ส.ค. 2569)', primary:true, next:'backfillquote' }
    ],
    behind: [
      { t:'ทำไมย้อนหลังได้', d:'extractions แยกจาก documents ตั้งแต่แรกเพราะไฟล์เดียวอาจอ่านซ้ำได้ — อ่านย้อนหลังคือเพิ่มแถวใหม่ ไม่ใช่รื้อของเดิม' },
      { t:'ที่เก็บหลักคือฝั่งระบบ', d:'Drive ของลูกค้าเป็นชั้นรอง (มติ B-5/B-6) ลูกค้าลบไฟล์ใน Drive ตัวเองก็ยังอ่านย้อนหลังได้' },
      { t:'ถามเป็นเดือน คิดเป็นหน้า', d:'สำนักงานคิดงานเป็นงวดบัญชี แต่ต้นทุนผันตามจำนวนหน้า — เดือนหนึ่งอาจมี 6 ใบ อีกเดือน 60 ใบ ตั้งราคาต่อเดือนคงที่จะพังทันที' }
    ]
  },

  backfillquote: {
    messages: [
      { who:'me', name:'คุณสมพร', text:'อ่านทั้งหมดที่มี (มี.ค.–ส.ค. 2569)', time:'14:21' },
      { who:'bot', card:'backfillquote', time:'14:21' },
      { who:'bot', text:'จำนวนหน้านี้ล็อกไว้แล้วครับ ต่อให้ระหว่างอ่านเจอ PDF หน้าเยอะกว่าที่นับ ก็ไม่เก็บเพิ่ม\nหน้าที่อ่านไม่ออกหรือไม่ใช่เอกสารบัญชี ไม่คิดเงิน', time:'14:21',
        note:'นับหน้าให้ครบก่อนบอกราคา ไม่ใช่ประมาณแล้วมาเก็บเพิ่มทีหลัง — ทำได้เพราะไฟล์ถูกเก็บไว้หมดแล้ว ระบบรู้จำนวนหน้าจริงตั้งแต่ก่อนเริ่มอ่าน' },
      { who:'bot', text:'ขอแจ้งก่อนครับ — เดือน ก.ค. กับ ส.ค. ส่งออกไปแล้ว\nถ้าอ่านย้อนหลังจะมีเอกสารใหม่โผล่ในเดือนที่ปิดงบไปแล้ว แนะนำให้บอกสำนักงานก่อนกดยืนยัน', time:'14:21',
        note:'เตือนจาก exported_at + export_batch_id ที่มีอยู่แล้ว — การเพิ่มใบใหม่เข้าเดือนที่ปิดงบไปแล้วเป็นคำถามทางบัญชี ไม่ใช่คำถามทางระบบ ยังไม่มีในเอกสารไหนเลย' }
    ],
    quick: [
      { label:'ยืนยัน เริ่มอ่านเลย', primary:true, next:'backfilldone' },
      { label:'ยกเลิก', next:'backfill', muted:true }
    ],
    behind: [
      { t:'กันอ่านซ้ำ', d:'ไฟล์ที่เคยอ่านแล้วต้องไม่ถูกคิดเงินอีก เช็กจาก extractions.document_id ที่มีอยู่แล้ว' },
      { t:'ราคาที่แจ้ง = ราคาที่จ่าย', d:'ต้องนับหน้าให้ครบก่อน quote ห้ามประมาณแล้วมาเก็บเพิ่ม' },
      { t:'O-4 ยังไม่สรุป', d:'อัตราต่อหน้ายังเป็นประเด็นเปิด — ตัวเลขราคาบนการ์ดคิดจากอัตราที่ตั้งไว้ในหน้าตั้งค่า (แก้ได้) ไม่ใช่ราคาที่ตกลงกันแล้ว' }
    ]
  },

  backfilldone: {
    messages: [
      { who:'me', name:'คุณสมพร', text:'ยืนยัน เริ่มอ่านเลย', time:'14:22' },
      { who:'bot', text:'เริ่มอ่านแล้วครับ ทยอยรายงานให้ ไม่ต้องรอในห้องนี้', time:'14:22' },
      { who:'sys', text:'20 นาทีต่อมา · 14:42' },
      { who:'bot', card:'backfillresult', time:'14:42' },
      { who:'bot', text:'คิดค่าอ่าน 468 หน้า — ต่ำกว่าที่ประเมินไว้ 480 หน้า\nเพราะหน้าที่ข้ามให้ 9 หน้า และอ่านไม่ออก 3 หน้า ไม่ได้คิดเงิน', time:'14:42',
        note:'ตัวเลข "อ่านได้ 468 หน้า" ต้องเป็นตัวเดียวกับที่ใช้คิดเงิน — รายงานฉบับนี้เป็นทั้งใบแจ้งผลและใบแจ้งหนี้ในตัว ถ้าสองตัวเลขไม่ตรงกันเมื่อไหร่จะกลายเป็นเรื่องกับลูกค้าทันที' },
      { who:'bot', text:'3 หน้าที่อ่านไม่ออกเป็นเพราะภาพไม่ชัดครับ ผมสร้างงานให้คนที่ส่งไปถ่ายใหม่แล้ว\nT-043 · ถ่ายใหม่ 3 หน้า · ผู้รับผิดชอบ สมชาย · ครบกำหนดศุกร์นี้', time:'14:42',
        note:'ต่อเข้าโมดูล 7 ทันที ไม่ปล่อยให้ "อ่านไม่ออก" เป็นทางตัน — คนที่แก้ได้จริงคือคนที่ถือเอกสารตัวจริง ไม่ใช่คนตรวจ' }
    ],
    quick: [
      { label:'ดูใบที่ต้องตรวจ', primary:true, next:'review' },
      { label:'เริ่มใหม่', next:'start', muted:true }
    ],
    behind: [
      { t:'แยก "อ่านไม่ออก" เป็น 3 แบบ', d:'ไม่ใช่เอกสารบัญชี (ข้ามให้ ไม่คิดเงิน) · ภาพแย่ (ให้ถ่ายใหม่) · ระบบล้ม (retry เอง ห้ามให้ลูกค้าเห็น) — ถ้ารวมเป็นก้อนเดียว ลูกค้าจะคิดว่าระบบห่วยทั้งที่ส่วนใหญ่ข้ามถูกแล้ว' },
      { t:'ต้องเพิ่ม source_file_id + page_no', d:'ตาราง documents ตอนนี้ไม่มีสองคอลัมน์นี้ — ไม่มีก็บอกได้แค่ "อ่านได้ 6 จาก 8" บอกไม่ได้ว่าหน้าไหน' },
      { t:'file_hash unique จะชนกัน', d:'PDF 1 ไฟล์ = 8 documents ที่มี hash เดียวกัน — ต้องย้ายการกันไฟล์ซ้ำไปที่ pending_uploads.file_hash แล้วให้ documents.file_hash เก็บ hash รายหน้าแทน' }
    ]
  },

  /* ---------- ไฟล์ที่ไม่ใช่รูป (M1) — เก็บได้ทุกชนิด อ่านได้เฉพาะที่อ่านออก ---------- */
  files: {
    messages: [
      { who:'me', name:'สมชาย', text:'[ ส่งไฟล์ 3 ไฟล์ ]', time:'11:05' },
      { who:'bot', text:'ได้รับ 3 ไฟล์แล้วครับ เก็บขึ้น Drive ให้เรียบร้อยทั้งหมดแล้ว\nมี 1 ไฟล์ที่ผมอ่านข้อมูลต่อได้ ขอถามก่อนนะครับ', time:'11:05',
        note:'หลักเดิมของโมดูล 1 — เก็บไฟล์ก่อนเสมอ แล้วค่อยถามว่าจะให้อ่านไหม ไฟล์ต้องไม่หายไม่ว่าผู้ใช้จะตอบหรือไม่ตอบ' },
      { who:'bot', card:'filebatch', time:'11:05' },
      { who:'bot', text:'จะให้ผมอ่านไฟล์ไหนบ้างครับ\n• ใบกำกับภาษี_ส.ค..pdf — 8 หน้า อ่านได้เต็มที่\n• สัญญาเช่าโกดัง.docx และ งบทดลอง_ส.ค..xlsx — ลองอ่านได้ แต่ยังไม่แม่นเท่าใบเสร็จ\n\nไม่เลือกก็ได้ ผมเก็บไฟล์ไว้ให้แล้ว สั่งอ่านทีหลังได้ตลอด', time:'11:05',
        note:'ให้คนเลือกว่าจะอ่านอะไร ไม่ใช่ระบบตัดสินแทน — ค่าอ่านคิดตามจำนวนหน้า คนจ่ายจึงควรเป็นคนเลือก' }
    ],
    quick: [
      { label:'อ่านเฉพาะ PDF (8 หน้า)', primary:true, next:'filesread' },
      { label:'อ่าน Word/Excel ด้วย', next:'filesreadall' },
      { label:'เก็บอย่างเดียว ไม่ต้องอ่าน', next:'filesstore' },
      { label:'ส่งไฟล์ .zip เพิ่ม', next:'filesunknown' }
    ],
    behind: [
      { t:'คนละ event กับรูป', d:'ในไลน์ รูปมาเป็น message.type = image ส่วน PDF/Word/Excel มาเป็น message.type = file พร้อมชื่อไฟล์และขนาด — ต้องดัก webhook เพิ่มอีกชนิด ไม่ใช่แค่เพิ่มนามสกุลในตัวตรวจ' },
      { t:'pending_uploads.mime_type', d:'มีคอลัมน์รออยู่แล้วในสเปก ใช้แยกเลนว่าไฟล์นี้เข้า OCR หรือเก็บอย่างเดียว' },
      { t:'Duplicate Guard ใช้ได้ทุกชนิด', d:'file_hash (SHA-256) ไม่สนใจว่าเป็นไฟล์อะไร — ส่งซ้ำก็จับได้เหมือนกันหมด' }
    ]
  },

  filesread: {
    messages: [
      { who:'me', name:'สมชาย', text:'อ่านทุกหน้า (8 หน้า)', time:'11:06' },
      { who:'bot', text:'อ่าน 8 หน้าเสร็จแล้วครับ\nผ่านเลย 6 ใบ · ต้องดู 2 ใบ\nแต่ละหน้าถูกแยกเป็นเอกสารคนละใบ นับเป็น 8 ใบในรายงานเดือนนี้', time:'11:06',
        note:'PDF 1 ไฟล์ = หลายเอกสาร — documents ทุกใบต้องผูกกลับไปที่ไฟล์ต้นทางเดียวกัน ไม่งั้นตอนลูกค้าถามว่าใบนี้มาจากไหนจะตอบไม่ได้' },
      { who:'bot', text:'อีก 2 ไฟล์เก็บไว้ให้แล้ว แต่ยังอ่านข้อมูลไม่ได้ครับ\n/Chap Wai/2026/08-สิงหาคม/อื่น ๆ/\n   • 2026-08-28_1105_สัญญาเช่าโกดัง.docx\n   • 2026-08-28_1105_งบทดลอง_ส.ค..xlsx\nเปิดจาก Drive ได้ตามปกติ', time:'11:06',
        note:'ใช้โฟลเดอร์ "อื่น ๆ" ที่มีอยู่แล้วในโครงสร้าง Drive ตามสเปก — รับไฟล์หลากหลายจึงไม่ต้องรื้อโครงใหม่' }
    ],
    quick: [
      { label:'ดูใบที่ต้องตรวจ', primary:true, next:'review' },
      { label:'เริ่มใหม่', next:'start', muted:true }
    ],
    behind: [
      { t:'1 ไฟล์ → หลาย documents', d:'เก็บ source_file_id ไว้ทุกใบ เพื่อย้อนกลับไปหาไฟล์ต้นทางและหน้าที่มาได้' },
      { t:'O-4 ยังไม่สรุป', d:'PDF หลายหน้าคิดค่าบริการอย่างไรยังเป็นประเด็นเปิด — prototype จึงถามทุกครั้ง ไม่ตัดสินใจแทน' },
      { t:'ตัวเลือกกลาง', d:'ถ้าต้นทุนเป็นปัญหา เพิ่มปุ่ม "อ่านเฉพาะหน้าแรก" ได้ — แต่ต้องบอกให้ชัดว่าอีก 7 หน้าจะไม่ถูกอ่าน' }
    ]
  },

  filesreadall: {
    messages: [
      { who:'me', name:'สมชาย', text:'อ่าน Word/Excel ด้วย', time:'11:06' },
      { who:'bot', text:'อ่าน PDF เสร็จแล้วครับ 8 หน้า — ผ่านเลย 6 ใบ · ต้องดู 2 ใบ', time:'11:06' },
      { who:'bot', text:'ส่วนอีก 2 ไฟล์ ผมเปิดอ่านข้อความข้างในได้ แต่ยังไม่ได้แปลงเป็นเอกสารในระบบครับ\n• สัญญาเช่าโกดัง.docx — เป็นสัญญา ไม่ใช่ใบกำกับภาษี ไม่มีช่องให้ลง\n• งบทดลอง_ส.ค..xlsx — เป็นงบการเงิน ต้องใช้ตัวอ่านคนละตัวกับใบเสร็จ ยังไม่เปิดใช้ในเฟสนี้\n\nทั้งสองไฟล์เก็บไว้ครบใน อื่น ๆ/ สั่งอ่านซ้ำได้เมื่อเปิดใช้แล้ว และรอบนี้ไม่คิดค่าอ่านสองไฟล์นี้', time:'11:07',
        note:'Word/Excel ไม่ต้องผ่าน OCR เพราะข้างในเป็นข้อความอยู่แล้ว แต่โครงสร้างคนละเรื่องกับใบเสร็จ — งบการเงินอยู่ในกลุ่ม A ที่มติ B-3 เลื่อนไปเฟสหลัง จึงบอกตรง ๆ ว่ายังทำไม่ได้ ดีกว่าอ่านมั่วแล้วคิดเงิน' }
    ],
    quick: [
      { label:'ดูใบที่ต้องตรวจ', primary:true, next:'review' },
      { label:'เริ่มใหม่', next:'start', muted:true }
    ],
    behind: [
      { t:'อ่านไม่ได้ ต้องไม่คิดเงิน', d:'คิดค่าอ่านเฉพาะหน้าที่ออกมาเป็นเอกสารในระบบจริง — ไฟล์ที่เปิดแล้วไม่ได้อะไรกลับมา ไม่คิด' },
      { t:'บอกเหตุผลรายไฟล์', d:'"อ่านไม่ได้" เฉย ๆ ทำให้คนเดาว่าระบบห่วย ต้องบอกว่าเพราะเป็นสัญญา หรือเพราะเป็นงบที่ยังไม่เปิดใช้' },
      { t:'เก็บไว้ให้อ่านย้อนหลัง', d:'วันที่เปิดตัวอ่านงบการเงิน ไฟล์เหล่านี้จะกลายเป็นของที่อ่านได้ทันที ไม่ต้องขอลูกค้าส่งใหม่' }
    ]
  },

  filesstore: {
    messages: [
      { who:'me', name:'สมชาย', text:'เก็บอย่างเดียว ไม่ต้องอ่าน', time:'11:06' },
      { who:'bot', text:'เก็บครบ 3 ไฟล์แล้วครับ ยังไม่ได้อ่านข้อมูลสักไฟล์\n/Chap Wai/2026/08-สิงหาคม/\n   ใบกำกับภาษี/ ← ใบกำกับภาษี_ส.ค..pdf\n   อื่น ๆ/ ← สัญญาเช่าโกดัง.docx · งบทดลอง_ส.ค..xlsx\n\nสั่งอ่าน PDF ทีหลังได้ตลอด พิมพ์ว่า "ฉับไว" ได้เลย', time:'11:06',
        note:'STORED_ONLY — สถานะปลายทางที่มีอยู่แล้วใน flow ของโมดูล 1 สั่งอ่านย้อนหลังได้ ไฟล์ไม่หาย' },
      { who:'bot', text:'เก็บอย่างเดียวไม่มีค่าใช้จ่ายเพิ่มครับ เพราะไม่ได้เรียกโมเดลอ่านภาพเลยสักครั้ง', time:'11:06',
        note:'ต้นทุนของการ "เก็บ" คือพื้นที่ Drive ของลูกค้าเอง ไม่ใช่ค่า API — รับไฟล์ได้หลากหลายจึงไม่ทำให้ต้นทุนระบบโตตาม เป็นจุดขายที่ให้ได้จริง' }
    ],
    quick: [
      { label:'สั่งอ่าน PDF ตอนนี้', primary:true, next:'filesread' },
      { label:'ส่งไฟล์ .zip เพิ่ม', next:'filesunknown' },
      { label:'เริ่มใหม่', next:'start', muted:true }
    ],
    behind: [
      { t:'Timeout 24 ชม. = เก็บไฟล์', d:'ถ้าไม่มีใครตอบ ระบบเลือกทางที่ปลอดภัยกว่าให้เอง — เก็บไฟล์ ไม่ใช่ทิ้ง' },
      { t:'ชื่อไฟล์คงของเดิม', d:'ไฟล์ที่ไม่ได้อ่านใช้รูปแบบ วันที่_เวลา_ชื่อเดิม — คงชื่อที่ผู้ใช้ตั้งไว้ ไม่งั้นค้นไม่เจอใน Drive' },
      { t:'จัดโฟลเดอร์ตามชนิด', d:'อ่านออก = เข้าโฟลเดอร์ประเภทเอกสาร · อ่านไม่ออก = /อื่น ๆ/ ของเดือนนั้น' }
    ]
  },

  filesunknown: {
    messages: [
      { who:'me', name:'สมชาย', text:'[ ส่งไฟล์ ใบเสนอราคา_ชุดที่3.zip ]', time:'11:08' },
      { who:'bot', text:'ไฟล์ชนิดนี้ผมอ่านข้อมูลไม่ได้ครับ แต่เก็บให้แล้ว\nอื่น ๆ/2026-08-28_1108_ใบเสนอราคา_ชุดที่3.zip\n\nถ้าข้างในมีใบกำกับภาษี ส่งเป็นไฟล์แยกหรือถ่ายรูปมาได้เลย ผมอ่านให้ทันที', time:'11:08',
        note:'ไม่ปฏิเสธไฟล์ที่ไม่รู้จัก — เก็บไว้แล้วบอกทางออก การปฏิเสธเงียบ ๆ เท่ากับไฟล์หายในสายตาลูกค้า และไม่มีใครรู้ว่าหายตอนไหน' },
      { who:'bot', text:'อีกอย่างหนึ่งครับ — รูปที่ผมดูแล้ว "เหมือนจะไม่ใช่เอกสารบัญชี" (สกรีนช็อต รูปทั่วไป) ผมก็เก็บไว้ให้เหมือนกัน แค่ไม่ลงเป็นเอกสารในระบบ\nถ้าผมดูผิด กด [ใช่ นี่คือใบเสร็จ] แล้วผมอ่านให้ใหม่ทันที', time:'11:08',
        note:'ระบบไม่รู้ล่วงหน้าว่าใช่หรือไม่ใช่ — ต้องอ่านก่อนถึงรู้ และมันเดาผิดได้ ใบเสร็จที่ถ่ายมืดมากอาจถูกตัดสินว่าไม่ใช่เอกสารแล้วหายเงียบ ๆ จึงต้องเก็บไฟล์เสมอและเปิดทางให้คนแย้ง' }
    ],
    quick: [
      { label:'เริ่มใหม่', primary:true, next:'start' }
    ],
    behind: [
      { t:'ไม่ลบอะไรทั้งนั้น', d:'ระบบตัดสินได้แค่ว่า "จะลงเป็นเอกสารไหม" ไม่ใช่ "จะเก็บไฟล์ไหม" — ไฟล์เก็บเสมอ ผิดพลาดแล้วยังกู้คืนได้' },
      { t:'/อื่น ๆ/ มีอยู่แล้วในโครง Drive', d:'สเปกโครงสร้าง Drive มีโฟลเดอร์นี้ตั้งแต่ต้น — รับไฟล์หลากหลายจึงไม่ต้องรื้อโครง' },
      { t:'โควตา Drive จะโตเร็วขึ้น', d:'E-06 (Drive ของลูกค้าเต็ม) เป็น sev high อยู่แล้ว — ไฟล์อย่าง Word/Excel/zip ใหญ่กว่ารูปมาก ต้องเช็กโควตาก่อนเขียนจริงจังกว่าเดิม' },
      { t:'ขีดจำกัดขนาดจากฝั่ง LINE', d:'ยังต้องยืนยันตัวเลขจริงจากเอกสาร LINE Messaging API ก่อนสัญญากับลูกค้าว่ารับไฟล์ใหญ่แค่ไหน' }
    ]
  },

  /* ---------- มอบหมายงาน (M7 Assign Task) — สมาชิกกลุ่มสั่งงานให้เพื่อนร่วมงานได้เอง ---------- */
  assign: {
    messages: [
      { who:'me', name:'สมชาย', text:'ฉับไว มอบหมาย วีระ ขอใบกำกับภาษีเต็มรูปจากร้านวัสดุ ก.ก่อสร้าง ภายในสิ้นเดือนนี้', time:'08:33' },
      { who:'bot', text:'ได้ครับ แต่ขอให้กดเลือกตัวคนก่อนนะครับ\nชื่อในไลน์ซ้ำกันได้และเปลี่ยนได้ตลอด — ผมจะผูกงานกับตัวคนจริง ไม่ใช่กับชื่อที่พิมพ์', time:'08:33',
        note:'Team Directory — บอทเปิดดูรายชื่อสมาชิกในกลุ่มเองไม่ได้ รู้จัก line_user_id เฉพาะคนที่เคยพิมพ์ / ถูกแท็ก / เพิ่งเข้ากลุ่ม ไม่มีตารางนี้ = มอบหมายงานไม่ได้เลย' },
      { who:'bot', card:'memberpick', time:'08:33' }
    ],
    quick: [
      { label:'วีระ (ฝ่ายจัดซื้อ)', primary:true, next:'assignwho' },
      { label:'มานี (เข้าใหม่)', next:'assignunknown' },
      { label:'เริ่มใหม่', next:'start', muted:true }
    ],
    behind: [
      { t:'Assign Task', d:'"ฉับไว มอบหมาย @ชื่อ [รายละเอียด] [กำหนดส่ง]" — สั่งได้ทั้งในกลุ่มและแชท 1-1 · task_assign เป็นสิทธิ์ระดับ 1 สมาชิกกลุ่มจึงสั่งงานให้เพื่อนร่วมงานได้ ไม่ต้องผ่านเจ้าของ' },
      { t:'group_members', d:'เก็บ line_user_id + ชื่อที่แสดง + วันที่เห็นครั้งแรก/ล่าสุด — ย้อนไปเก็บทีหลังไม่ได้ ต้องเก็บตั้งแต่บอทเข้ากลุ่มวันแรก' },
      { t:'ยืนยันด้วยปุ่ม ไม่ใช่ด้วยชื่อ', d:'ในกลุ่มมีชื่อคล้ายกันได้ ถ้าให้พิมพ์ชื่อเปล่าแล้วเดา = สั่งงานผิดคนแบบเงียบ ๆ' }
    ]
  },

  assignwho: {
    messages: [
      { who:'me', name:'สมชาย', text:'วีระ (ฝ่ายจัดซื้อ)', time:'08:34' },
      { who:'bot', text:'"สิ้นเดือนนี้" ผมอ่านเป็น จันทร์ 31 ส.ค. 2569 นะครับ\nถ้าไม่ใช่ พิมพ์วันที่มาแก้ได้เลย', time:'08:34',
        note:'ตีความกำหนดส่งแบบภาษาพูด ("ศุกร์นี้" · "สิ้นเดือน") แล้วทวนกลับเป็นวันที่จริงทุกครั้ง — ห้ามตีความเงียบ ๆ เพราะกำหนดส่งผิดจะรู้ตอนสายเกินไป' },
      { who:'bot', card:'assignpreview', time:'08:34' },
      { who:'bot', text:'จะให้ประกาศในกลุ่มเลยไหมครับ หรือรวมไปกับสรุปเช้าพรุ่งนี้', time:'08:34',
        note:'ตอบกลับคนที่พิมพ์ = ฟรี · ประกาศเข้ากลุ่มเองเป็น push = นับโควตา จึงต้องถามก่อน ไม่ประกาศเองอัตโนมัติ' }
    ],
    quick: [
      { label:'ประกาศในกลุ่มเลย', primary:true, next:'assigned' },
      { label:'รวมไปกับสรุปเช้าพรุ่งนี้', next:'assignquiet' }
    ],
    behind: [
      { t:'tasks (แถวใหม่)', d:'assignee_id = วีระ · created_by = สมชาย · due_date = 2026-08-31 · status = open — ผู้รับผิดชอบกับผู้มอบหมายต้องแยกคอลัมน์ตั้งแต่แรก ย้อนไปเติมทีหลังไม่ได้' },
      { t:'Natural Deadline', d:'แปลงภาษาพูดเป็นวันที่ แล้วทวนกลับให้ยืนยันเสมอ' },
      { t:'evidence = true', d:'งานที่มีผลทางเงิน/กฎหมายตั้งให้ต้องแนบหลักฐานได้ — ปิดงานได้แม้ไม่แนบ แต่ระบบติดธงไว้ ไม่กั้นคนทำงาน' }
    ]
  },

  assigned: {
    messages: [
      { who:'me', name:'สมชาย', text:'ประกาศในกลุ่มเลย', time:'08:34' },
      { who:'bot', card:'assigndone', time:'08:34' },
      { who:'bot', text:'ประกาศในกลุ่มแล้วครับ @วีระ\nT-042 · ครบกำหนด จ. 31 ส.ค. 2569\n\nจากนี้ผมจะตามให้เองตามจังหวะนี้\n• 30 ส.ค. — อยู่ในสรุปเช้า\n• 31 ส.ค. — สรุปเช้า + แท็กวีระ\n• เลยกำหนด 3 วัน — แท็กคุณเพิ่มในสรุปเช้าเพราะคุณเป็นผู้สั่ง (คุณไม่มีห้องแชทส่วนตัวกับผม) แล้วเตือนเจ้าของในแชทส่วนตัวด้วย\n• เลยกำหนด 7 วัน — ผมหยุดตามเอง แล้วถามคุณในฐานะผู้สั่งว่า [เลื่อนกำหนด] [ยกเลิกงาน] [ตามต่อ]', time:'08:34',
        note:'บันไดเตือน (Reminder Ladder) — ข้อสุดท้ายสำคัญที่สุด งานที่เตือนทุกวันไม่จบสักที จะทำให้คนเริ่มมองข้ามสรุปทั้งฉบับ · ปลายทางคือผู้สั่ง ไม่ใช่เจ้าของเสมอไป (B-15) เพราะคนที่ต้องการงานชิ้นนั้นจริงคือคนที่ควรตัดสินว่าจะยกเลิกไหม' }
    ],
    quick: [
      { label:'ดูงานของฉัน', primary:true, next:'tasks' },
      { label:'เริ่มใหม่', next:'start', muted:true }
    ],
    behind: [
      { t:'@mention ตอนประกาศ', d:'แท็กผู้รับผิดชอบในข้อความประกาศ — เป็นทั้งการแจ้งเตือนและการยืนยันว่าระบบผูกงานกับคนถูกคน' },
      { t:'Reminder Ladder', d:'ก่อนครบ 1 วัน → วันครบ → เลย 1-2 วัน → เลย 3 วันเตือนผู้สั่ง (+เจ้าของถ้าเป็นงานภายใน) → เลย 7 วันหยุดตาม แล้วถามผู้สั่ง' },
      { t:'Auto-close', d:'งานนี้ตั้งให้ปิดเองได้เมื่อใบกำกับภาษีเต็มรูปของร้านนี้เข้าระบบ — ข้อดีของการทำเลขากับระบบอ่านเอกสารพร้อมกัน' }
    ]
  },

  assignquiet: {
    messages: [
      { who:'me', name:'สมชาย', text:'รวมไปกับสรุปเช้าพรุ่งนี้', time:'08:34' },
      { who:'bot', text:'สร้างงาน T-042 แล้วครับ ยังไม่ประกาศในกลุ่ม\nพรุ่งนี้ 08:30 ผมจะรวมงานนี้ไปกับสรุปเช้าให้ — วีระจะเห็นทีเดียวพร้อมกับเรื่องเอกสาร', time:'08:34',
        note:'1 กลุ่ม = 1 push ต่อวัน — ถ้าแยกส่งเรื่องเอกสารตอนเช้าและเรื่องงานตอนบ่าย = จ่ายสองรอบ และกลุ่มรำคาญสองรอบ' },
      { who:'sys', text:'พรุ่งนี้ 08:30' },
      { who:'bot', text:'สรุปเช้านี้ครับ\nเอกสารเมื่อวาน 12 ใบ — ผ่านเลย 10 · ต้องดู 1 · อ่านไม่ออก 1\nงานค้าง 3 รายการ\n   • [ใหม่] ขอใบกำกับภาษีเต็มรูป ร้านวัสดุ ก.ก่อสร้าง (วีระ) ครบกำหนด 31 ส.ค.\n   • ส่งใบเสร็จค่าน้ำมัน ส.ค. (วีระ) ครบกำหนดวันนี้\n   • ตรวจใบติดธง 3 ใบ (นภา) เลยกำหนด 3 วัน', time:'08:30',
        note:'งานที่สั่งไว้เงียบ ๆ ไปโผล่ในสรุปเช้าฉบับเดียวกับเรื่องเอกสาร ไม่เพิ่มข้อความใหม่ให้กลุ่ม' }
    ],
    quick: [
      { label:'ดูงานของฉัน', primary:true, next:'tasks' },
      { label:'เริ่มใหม่', next:'start', muted:true }
    ],
    behind: [
      { t:'One Daily Summary', d:'push นับโควตา (Free 300/เดือน · Basic 1,280 บาท = 15,000 · Pro 1,780 บาท = 35,000) — รวมทุกเรื่องไว้ข้อความเดียวคือการประหยัดที่ออกแบบไว้ตั้งแต่แรก' },
      { t:'เจ้าของตั้งเวลาส่งได้', d:'digest_time ค่าเริ่มต้น 09:00 · ตั้งที่ระดับบริษัท' },
      { t:'งานถูกสร้างแล้วจริง', d:'เลือก "ไม่ประกาศ" ไม่ได้แปลว่าไม่สร้างงาน — แถวใน tasks เกิดทันที ต่างกันแค่จังหวะที่กลุ่มจะเห็น' }
    ]
  },

  assignunknown: {
    messages: [
      { who:'me', name:'สมชาย', text:'มานี (เข้าใหม่)', time:'08:34' },
      { who:'bot', text:'"มานี" เพิ่งเข้ากลุ่มเมื่อวาน แต่ยังไม่เคยพิมพ์อะไรครับ\nไลน์จะให้ผมรู้จักตัวคนก็ต่อเมื่อเขาพิมพ์เอง หรือถูกแท็กในข้อความ — ตอนนี้ผมยังผูกงานให้ไม่ได้', time:'08:34',
        note:'เป็นข้อจำกัดของ LINE API ที่แก้ไม่ได้ ไม่ใช่ข้อจำกัดของระบบเรา — จึงต้องออกแบบทางออกไว้ให้ผู้ใช้เสมอ ห้ามตอบแค่ว่าทำไม่ได้' },
      { who:'bot', text:'ทำอย่างใดอย่างหนึ่งนี้ครับ\n1. แท็ก @มานี ในข้อความมอบหมาย แล้วส่งใหม่\n2. ให้มานีพิมพ์ทักทายในกลุ่มสักครั้ง แล้วผมจะจำได้ตลอดไป', time:'08:34' }
    ],
    quick: [
      { label:'มอบให้ "วีระ" แทน', primary:true, next:'assignwho' },
      { label:'เริ่มใหม่', next:'start', muted:true }
    ],
    behind: [
      { t:'3 ทางที่ได้ line_user_id', d:'คนนั้นพิมพ์ในกลุ่ม · ถูก @mention · event ตอนเข้ากลุ่ม — นอกจากนี้ไม่มีทางอื่น' },
      { t:'ขั้นตอนติดตั้งข้อ 5', d:'ตอนบอทเข้ากลุ่มครั้งแรกให้ขอทุกคนทักทายหนึ่งครั้ง — ทะเบียนสมาชิกจะครบตั้งแต่วันแรก' },
      { t:'มีทางออกเสมอ', d:'บอทต้องบอกวิธีแก้ ไม่ใช่บอกแค่ว่าทำไม่ได้ — คนใช้งานจริงจะเลิกใช้ทันทีที่เจอทางตัน' }
    ]
  },

  /* เส้นทางของฝั่งสำนักงาน — แชท 1-1 */
  office: {
    chat: { title: 'Chap Wai', sub: 'แชท 1-1 · เมนูตั้งค่าตอบเฉพาะห้องนี้' },
    messages: [
      { who:'sys', text:'วันนี้ · 08:20' },
      { who:'me', name:'นภา', text:'ฉับไว', time:'08:20' },
      { who:'bot', text:'สวัสดีครับคุณนภา 👋\nวันนี้มีใบติดธงรอตรวจ 5 ใบ ใน 2 บริษัท', time:'08:20',
        note:'เมนูตั้งค่าต้องไม่ตอบในห้องกลุ่ม — ตอบเฉพาะแชท 1-1' },
      { who:'bot', card:'flagged', time:'08:20' }
    ],
    quick: [
      { label:'ตรวจใบนี้', primary:true, next:'review' },
      { label:'ส่งออกเดือนนี้', next:'exporting' },
      { label:'สลับไปสยามฟู้ดส์', next:'officeswitch' }
    ],
    behind: [
      { t:'Tenant Isolation', d:'company_id คือเส้นที่ห้ามหลุด — ลูกค้า A ต้องไม่เห็นข้อมูลลูกค้า B' },
      { t:'Company Switch', d:'นักบัญชีเห็นเฉพาะบริษัทที่ได้รับมอบหมาย' }
    ]
  },

  exporting: {
    messages: [
      { who:'me', name:'นภา', text:'ส่งออกเดือนนี้', time:'08:22' },
      { who:'bot', text:'กำลังสร้างไฟล์ให้ครับ ⏳', time:'08:22' },
      { who:'bot', card:'export', time:'08:23',
        note:'ส่งไฟล์เข้าแชท 1-1 (Private Send) ไม่ส่งเข้ากลุ่ม เพราะมีตัวเลขระดับ 2a' }
    ],
    quick: [
      { label:'ปิดงาน "ส่งออกเดือนนี้"', primary:true, next:'exportdone' },
      { label:'เริ่มใหม่', next:'start', muted:true }
    ],
    behind: [
      { t:'Excel 2 ชีต', d:'ชีต "รายการเอกสาร" 11 คอลัมน์ (แถวเหลือง = ต้องตรวจ · แถวแดง = อ่านไม่ออก) + ชีต "สรุป"' },
      { t:'Thai-safe Rendering', d:'PDF ต้องใช้ Noto Sans Thai — ฟอนต์ตระกูล tlwg ทำวรรณยุกต์หลุดบรรทัดใน Chromium' },
      { t:'Auto-close', d:'การสร้าง export batch เป็นตัวจุดชนวนปิดงาน "กด export เดือนนี้" อัตโนมัติ' }
    ]
  },

  /* ใบติดธงของบริษัทที่เพิ่งสลับไป — ต้องเป็นใบของ c2 จริง (D-2608-S02 ตลาดไท ผักสด) และอยู่ในแชท 1-1
     เดิมปุ่มนี้ชี้ไป review2 ซึ่งเป็นใบของ ABC ในห้องกลุ่มของ ABC = ข้ามบริษัท */
  reviewsiam: {
    messages: [
      { who:'me', name:'นภา', text:'ตรวจใบของบริษัทนี้', time:'08:27' },
      { who:'bot', text:'ใบติดธงของสยามฟู้ดส์ 1 ใบครับ — ตลาดไท ผักสด 12,500.00 บาท (27 ส.ค.)\nติดธงจุดเดียว: บิลเงินสด ไม่มีเลขผู้เสียภาษี', time:'08:27',
        note:'ยอดนี้ส่งถึงนักบัญชีในแชท 1-1 ได้ แต่ห้ามสรุปเข้ากลุ่มของสยามฟู้ดส์ เพราะบริษัทนี้ปิด financial_visibility ไว้' }
    ],
    quick: [
      { label:'กลับไป ABC', primary:true, next:'office' },
      { label:'เริ่มใหม่', next:'start', muted:true }
    ],
    behind: [
      { t:'company_id คือเส้นที่ห้ามหลุด', d:'สลับบริษัทแล้วใบที่ยกมาต้องเป็นของบริษัทนั้น ไม่ใช่ใบเดิมของบริษัทก่อนหน้า' },
      { t:'บิลเงินสดไม่มีเลขภาษี', d:'ธงนี้แก้ด้วยการคีย์ไม่ได้ ต้องขอใบกำกับเต็มรูปจากผู้ขาย — เป็นงาน ไม่ใช่การแก้ฟิลด์' }
    ]
  },

  /* สลับบริษัท — ต้องเปลี่ยนห้องและเปลี่ยนเนื้อหาจริง ไม่ใช่รีเซ็ตกลับบทเดิมทุกตัวอักษร */
  officeswitch: {
    chat: { title: 'Chap Wai', sub: 'แชท 1-1 · กำลังดู บจก. สยาม ฟู้ดส์' },
    messages: [
      { who:'sys', text:'วันนี้ · 08:26' },
      { who:'me', name:'นภา', text:'สลับไปสยามฟู้ดส์', time:'08:26' },
      { who:'bot', text:'สลับเป็น บจก. สยาม ฟู้ดส์ แล้วครับ (กลุ่ม "เอกสารสยามฟู้ดส์")\nบริษัทนี้มีใบติดธงรอตรวจ 1 ใบ\n\nหมายเหตุ: บริษัทนี้ปิดการมองเห็นยอดสรุปไว้ ผมจะไม่ส่งตัวเลขเงินเข้ากลุ่มของเขา', time:'08:26',
        note:'Tenant Isolation — สลับบริษัทแล้วต้องเปลี่ยนทั้งข้อมูลและกติกาการมองเห็น ค่า financial_visibility ของสยามฟู้ดส์ปิดอยู่ จึงต่างจาก ABC' }
    ],
    quick: [
      { label:'ตรวจใบของบริษัทนี้', primary:true, next:'reviewsiam' },
      { label:'กลับไป ABC', next:'office' },
      { label:'เริ่มใหม่', next:'start', muted:true }
    ],
    behind: [
      { t:'company_id คือเส้นที่ห้ามหลุด', d:'สลับแล้วทุก query ต้องเปลี่ยนตาม ไม่ใช่แค่เปลี่ยนหัวข้อบนจอ' },
      { t:'ค่าตั้งเป็นของแต่ละบริษัท', d:'financial_visibility และเวลาสรุปประจำวันตั้งแยกกันต่อบริษัท เจ้าของแต่ละรายเป็นคนตั้งเอง' },
      { t:'นักบัญชีเห็นเฉพาะที่ได้รับมอบหมาย', d:'สยามฟู้ดส์อยู่ในรายการของนภา ส่วนทองไทยไม่อยู่ จึงสลับไปไม่ได้' }
    ]
  },

  exportdone: {
    messages: [
      { who:'me', name:'นภา', text:'ปิดงาน "ส่งออกเดือนนี้"', time:'08:24' },
      { who:'bot', text:'ปิดงาน T-039 ให้แล้วครับ\nจริง ๆ งานนี้ปิดเองอัตโนมัติอยู่แล้วตอนที่ชุดส่งออกของเดือนนี้ถูกสร้าง — คุณกดหรือไม่กดก็ปิด\nบันทึกไว้ว่า "นภา" เป็นคนกดปิด', time:'08:24',
        note:'Auto-close — งานที่ระบบตรวจเองได้ ระบบปิดให้เอง ไม่ต้องรอใครกด แต่ถ้ามีคนกดก่อนก็ยังบันทึกว่าใครกด' }
    ],
    quick: [
      { label:'สลับไปบริษัทถัดไป', primary:true, next:'office' },
      { label:'เริ่มใหม่', next:'start', muted:true }
    ],
    behind: [
      { t:'completed_by ยังต้องบันทึก', d:'แม้เป็นการปิดอัตโนมัติ ก็ต้องรู้ว่าปิดเพราะเงื่อนไขไหน หรือเพราะใครกด' },
      { t:'ห้องนี้เป็นแชท 1-1', d:'ไฟล์ที่มีตัวเลขระดับ 2a ส่งเข้าห้องนี้เท่านั้น ไม่ส่งเข้ากลุ่มของลูกค้า' }
    ]
  },

  taskdefer: {
    messages: [
      { who:'me', name:'สมชาย', text:'ขอเลื่อน', time:'08:32' },
      { who:'bot', text:'T-041 ตอนนี้ครบกำหนด 29 ส.ค. 2569 ครับ จะเลื่อนไปเป็นเมื่อไหร่', time:'08:32' },
      { who:'me', name:'สมชาย', text:'ขอเป็นศุกร์หน้า', time:'08:33' },
      { who:'bot', text:'เลื่อนให้แล้วครับ\nT-041 · ครบกำหนดใหม่ ศุกร์ 4 ก.ย. 2569 (เดิม 29 ส.ค. · เลื่อนครั้งที่ 1)\nงานยังไม่ปิด และแจ้งผู้มอบหมาย (คุณสมพร) แล้ว\nบันทึกว่า "สมชาย" เป็นคนขอเลื่อน (ผู้รับผิดชอบคือ วีระ)', time:'08:33',
        note:'ขอเลื่อนคือการขยับ due_date ไม่ใช่การปิดงาน — ต้องเก็บกำหนดเดิมและนับจำนวนครั้งที่เลื่อนไว้ด้วย ไม่งั้นงานที่เลื่อนไปเรื่อย ๆ จะดูเหมือนงานปกติ' }
    ],
    quick: [
      { label:'ดูงานของฉัน', primary:true, next:'tasks' },
      { label:'เริ่มใหม่', next:'start', muted:true }
    ],
    behind: [
      { t:'ขอเลื่อน ไม่เท่ากับ ปิดงาน', d:'สองปุ่มนี้ต้องไปคนละทาง — ปิดงานเซ็ต status = done ส่วนขอเลื่อนขยับ due_date และเพิ่มตัวนับการเลื่อน' },
      { t:'ใช้ระบบเดียวกับคำขออนุมัติ', d:'ส่งถึงผู้มอบหมาย · ตอบด้วยปุ่ม · มีวันหมดอายุ · ตรวจย้อนได้' },
      { t:'บันไดเตือนเริ่มนับใหม่', d:'เลื่อนแล้วต้องรีเซ็ตจังหวะเตือน ไม่งั้นบอทจะทวงงานที่เพิ่งอนุญาตให้เลื่อนไปเมื่อกี้' }
    ]
  }
};
