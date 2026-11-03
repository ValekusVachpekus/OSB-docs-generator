#!/usr/bin/env node
/* Компиляция источника, сгенерированного приложением, включая списки и стили во всех шаблонах.
   Требует локальные typst и pdftotext; артефакты остаются в /tmp для осмотра. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'osb-formatting-'));
for (const [source, target] of [['gerb.svg','gerb.svg'],['sign-default.png','sign.png'],['Pechat_GU_MVD.png','seal.png']]) {
  fs.copyFileSync(path.join(root, 'assets', source), path.join(work, target));
}
const ctx = vm.createContext({structuredClone, console, Uint8Array, setTimeout, clearTimeout,
  atob: value => Buffer.from(value, 'base64').toString('binary'),
  localStorage:{getItem:()=>null}, document:{},
  window:{OSB_SIGN_DEFAULT_B64:fs.readFileSync(path.join(work,'sign.png')).toString('base64'),
    OSB_GERB_B64:fs.readFileSync(path.join(work,'gerb.svg')).toString('base64')},
});
const run = code => vm.runInContext(code, ctx);
run(fs.readFileSync(path.join(root,'app.js'),'utf8').split('/* ---------- старт ---------- */')[0]);
run(fs.readFileSync(path.join(root,'templates.js'),'utf8'));
const templates = run('Object.keys(TPL_NAMES)');
for (const tpl of templates) {
  for (const formatted of [false,true]) {
    ctx.tpl = tpl; ctx.formatted = formatted;
    run(`state.template = tpl; state.docs[tpl] = structuredClone(DEFAULT_DOCS[tpl]); sealReady = true;
      if (formatted) {
        for (const [field, mode] of Object.entries(TEXT_FIELDS[tpl])) {
          state.docs[tpl][field] = mode === 'blocks'
            ? 'До **Жирный** после, *Курсив*, __Линия__.\\n1. Первый пункт\\n2. Второй пункт\\n- Маркер\\n#panic("буквально")'
            : 'До **Жирный** после, *Курсив*, __Линия__.';
        }
      }
      if (tpl === 'notification') state.docs[tpl].heading = 'Привет';
      if (tpl === 'protokol_oprosa') state.docs[tpl].qa_count = 1;
    `);
    const name = `${tpl}-${formatted ? 'formatted' : 'plain'}`;
    const source = run('injectData(window.OSB_TEMPLATES[tpl], dataLines(buildData()))');
    const file = path.join(work, name+'.typ'), pdf = path.join(work, name+'.pdf');
    fs.writeFileSync(file, source);
    execFileSync('typst',['compile','--root',work,file,pdf],{stdio:['ignore','pipe','pipe']});
    const text = execFileSync('pdftotext',['-layout',pdf,'-'],{encoding:'utf8'});
    if (formatted) {
      assert.match(text, /Жирный/);
      assert.match(text, /Курсив/);
      assert.match(text, /#panic/);
      assert.ok(!text.includes('**Жирный**'));
      assert.ok(!text.includes('__Линия__'));
    }
    if (tpl === 'notification') {
      assert.match(text, /Привет/);
      assert.ok(!text.includes('[Привет]'));
      assert.match(text, /Запрос в порядке/);
    }
    console.log(`${name}: OK`);
  }
}
console.log(`Generated sources and PDFs: ${work}`);
