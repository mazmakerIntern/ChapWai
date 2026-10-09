/* ตัวรันแบบไม่มีเบราว์เซอร์ — โหลด data.js + app.js ด้วย DOM ปลอมขั้นต่ำ
   แล้วเรียกทุกหน้าจอของทุกบทบาท เพื่อจับ ReferenceError / TypeError ที่ syntax check จับไม่ได้ */
const fs = require('fs'), path = require('path'), vm = require('vm');
const DIR = path.join(__dirname, '..', 'assets');

function mkEl() {
  const el = {
    innerHTML: '', textContent: '', value: '', checked: false, hidden: false, scrollTop: 0, scrollLeft: 0,
    style: { setProperty(){}, removeProperty(){}, getPropertyValue(){ return '' } }, dataset: {}, classList: { add(){}, remove(){}, toggle(){}, contains(){ return false } },
    children: [], parentNode: null,
    addEventListener(){}, removeEventListener(){}, appendChild(c){ this.children.push(c); return c },
    removeChild(){}, remove(){}, setAttribute(){}, getAttribute(){ return null }, removeAttribute(){},
    focus(){}, blur(){}, click(){}, scrollIntoView(){}, closest(){ return null },
    querySelector(){ return mkEl() }, querySelectorAll(){ return [] },
    getBoundingClientRect(){ return { top:0,left:0,width:800,height:600,right:800,bottom:600 } },
  };
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
let fails = 0, runs = 0;
const screens = vm.runInContext('SCREEN_IDS()', ctx);
const companies = vm.runInContext('state.companies.map(c => c.id)', ctx);

for (const role of ROLES) {
  for (const co of companies) {
    for (const sc of screens) {
      for (const rg of RANGES) {
        vm.runInContext(`state.role=${JSON.stringify(role)};state.companyId=${JSON.stringify(co)};state.range=${JSON.stringify(rg)};state.screen=${JSON.stringify(sc)}`, ctx);
        /* ข้ามหน้าที่บทบาทนั้นเข้าไม่ได้ — ของจริงเมนูไม่แสดง */
        const allowed = vm.runInContext(`(SCREEN_IDS().includes(state.screen) && (state.screen==='hub' || allowedItems().some(i=>i.id===state.screen)))`, ctx);
        if (!allowed) continue;
        runs++;
        try { vm.runInContext('render()', ctx); }
        catch (e) { fails++; if (fails <= 25) console.log(`FAIL role=${role} co=${co} screen=${sc} range=${rg} :: ${e.message}`); }
      }
    }
  }
}
console.log(`\nrendered ${runs} combinations · ${fails} failures`);
process.exit(fails ? 1 : 0);
