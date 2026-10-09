/* ตัวรันแบบไม่มีเบราว์เซอร์ — โหลด data.js + app.js ด้วย DOM ปลอมขั้นต่ำ
   แล้วเรียกทุกหน้าจอของทุกบทบาท เพื่อจับ ReferenceError / TypeError ที่ syntax check จับไม่ได้ */
const fs = require('fs'), path = require('path'), vm = require('vm');
const DIR = path.join(__dirname, '..', 'assets');

const SINK = [];
function mkEl() {
  const el = {
    _h: '', textContent: '', value: '', checked: false, hidden: false, scrollTop: 0, scrollLeft: 0,
    style: { setProperty(){}, removeProperty(){}, getPropertyValue(){ return '' } }, dataset: {}, classList: { add(){}, remove(){}, toggle(){}, contains(){ return false } },
    children: [], parentNode: null,
    addEventListener(){}, removeEventListener(){}, appendChild(c){ this.children.push(c); return c },
    removeChild(){}, remove(){}, setAttribute(){}, getAttribute(){ return null }, removeAttribute(){},
    focus(){}, blur(){}, click(){}, scrollIntoView(){}, closest(){ return null },
    querySelector(){ return mkEl() }, querySelectorAll(){ return [] },
    getBoundingClientRect(){ return { top:0,left:0,width:800,height:600,right:800,bottom:600 } },
  };
  Object.defineProperty(el, 'innerHTML', { get(){ return el._h }, set(v){ el._h = v; SINK.push(String(v)) } });
  return el;
}
const doc = {
  body: mkEl(), documentElement: mkEl(), head: mkEl(),
  querySelector(){ return mkEl() }, querySelectorAll(){ return [] },
  getElementById(){ return mkEl() }, createElement(){ return mkEl() },
  createTextNode(){ return mkEl() }, addEventListener(){}, removeEventListener(){},
};
const ctx = {
  document: doc, console,
  window: { addEventListener(){}, removeEventListener(){}, matchMedia: () => ({ matches:false, addEventListener(){}, addListener(){} }),
            innerWidth: 1280, innerHeight: 900, location: { hash: '' }, scrollTo(){}, requestAnimationFrame(f){ return 0 },
            getComputedStyle: () => ({ getPropertyValue: () => '' }) },
  requestAnimationFrame(f){ return 0 }, cancelAnimationFrame(){}, setTimeout(){ return 0 }, clearTimeout(){},
  setInterval(){ return 0 }, clearInterval(){}, localStorage: { getItem(){ return null }, setItem(){}, removeItem(){} },
  navigator: { userAgent: 'node' }, location: { hash: '', href: 'http://localhost/', search: '', pathname: '/', reload(){}, assign(){}, replace(){} }, history: { pushState(){}, replaceState(){}, back(){} }, alert(){}, confirm(){ return true }, prompt(){ return '' }, URL: class { constructor(){ this.searchParams = { get(){ return null } } } }, Blob: class {}, FileReader: class { readAsDataURL(){} }, fetch(){ return Promise.resolve({ json: () => ({}) }) }, matchMedia: () => ({ matches:false, addEventListener(){}, addListener(){} }),
  getComputedStyle: () => ({ getPropertyValue: () => '' }), Event: function(){}, CustomEvent: function(){},
};
ctx.globalThis = ctx; ctx.self = ctx; ctx.window.document = doc;
vm.createContext(ctx);

for (const f of ['icons.js', 'data.js', 'app.js']) {
  try { vm.runInContext(fs.readFileSync(path.join(DIR, f), 'utf8'), ctx, { filename: f }); }
  catch (e) { console.log('LOAD FAIL', f, '->', e.message); process.exit(1); }
}
console.log('loaded ok');


const ROLES = ['member', 'owner', 'accountant', 'office_admin'];
const RANGES = ['today', '7d', '30d', '6m', '1y'];
const screens = vm.runInContext('SCREEN_IDS()', ctx);
const companies = vm.runInContext('state.companies.map(c => c.id)', ctx);
for (const role of ROLES) for (const co of companies) for (const sc of screens) for (const rg of RANGES) {
  vm.runInContext(`state.role=${JSON.stringify(role)};state.companyId=${JSON.stringify(co)};state.range=${JSON.stringify(rg)};state.screen=${JSON.stringify(sc)}`, ctx);
  if (!vm.runInContext(`(state.screen==='hub' || allowedItems().some(i=>i.id===state.screen))`, ctx)) continue;
  try { vm.runInContext('render()', ctx) } catch (e) {}
}
/* ทุกฉากของหน้าจอ LINE และดรอเวอร์ตรวจรายใบ ไม่ได้ถูกเรนเดอร์จากลูปข้างบนครบทุกสถานะ จึงเดินเพิ่ม */
try {
  const steps = vm.runInContext('Object.keys(LINE_STEPS)', ctx);
  for (const st of steps) for (const role of ROLES) {
    vm.runInContext(`state.role=${JSON.stringify(role)};state.lineStep=${JSON.stringify(st)};state.screen='line'`, ctx);
    try { vm.runInContext('render()', ctx) } catch (e) {}
  }
} catch (e) {}
try {
  const ids = vm.runInContext('state.docs.map(d=>d.id)', ctx);
  for (const role of ['accountant','owner','office_admin']) for (const id of ids) {
    vm.runInContext(`state.role=${JSON.stringify(role)};state.screen='documents';state.openDoc=${JSON.stringify(id)}`, ctx);
    try { vm.runInContext('render()', ctx) } catch (e) {}
  }
} catch (e) {}

const html = SINK.join('\n');
const app = fs.readFileSync(path.join(DIR, 'app.js'), 'utf8');
const uniq = a => [...new Set(a)].sort();
const shownAct = uniq([...html.matchAll(/data-act="([a-zA-Z0-9_-]+)"/g)].map(m => m[1]));
const handledAct = uniq([...[...app.matchAll(/dataset\.act === '([a-zA-Z0-9_-]+)'/g)].map(m=>m[1]),
                         ...[...app.matchAll(/case '([a-zA-Z0-9_-]+)':/g)].map(m=>m[1])]);
const shownNav = uniq([...html.matchAll(/data-nav="([a-zA-Z0-9_-]+)"/g)].map(m => m[1]));
const navIds = vm.runInContext('SCREEN_IDS()', ctx);
const otherAttrs = uniq([...html.matchAll(/\sdata-([a-z]+)="/g)].map(m=>m[1]));
const readAttrs = uniq([...app.matchAll(/dataset\.([a-zA-Z]+)/g)].map(m=>m[1]));
const rep = (t, l) => { console.log(`\n${t} (${l.length})`); l.forEach(x => console.log('   ' + x)); };
rep('data-act บนจอที่ไม่มีตัวจัดการ  [input ที่ไม่มี output]', shownAct.filter(a => !handledAct.includes(a)));
rep('ตัวจัดการที่ไม่มีของบนจอเรียกถึง  [โค้ดตาย]', handledAct.filter(a => !shownAct.includes(a)));
rep('data-nav ที่ชี้หน้าที่ไม่มีอยู่', shownNav.filter(n => !navIds.includes(n)));
rep('data-* บนจอที่ไม่มีโค้ดไหนอ่าน', otherAttrs.filter(a => !readAttrs.includes(a) && a !== 'act' && a !== 'nav'));
console.log(`\nHTML ที่เก็บได้ ${(html.length/1024/1024).toFixed(1)} MB · data-act บนจอ ${shownAct.length} ชนิด · ตัวจัดการ ${handledAct.length} ชนิด`);
