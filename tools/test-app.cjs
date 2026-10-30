#!/usr/bin/env node
/* Регрессии логики приложения без CDN и сторонних зависимостей. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { performance } = require('node:perf_hooks');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'app.js'), 'utf8').split('/* ---------- старт ---------- */')[0];
function setup(saved = {}) {
  const store = new Map(Object.entries(saved)), writes = [], elements = new Map();
  function element() {
    const classes = new Set();
    return { disabled: false, textContent: '', hidden: false,
      classList: { toggle(c, on) { if (on) classes.add(c); else classes.delete(c); }, contains: c => classes.has(c) },
      replaceChildren(value) { this.content = value; } };
  }
  const document = { querySelector(s) { if (!elements.has(s)) elements.set(s, element()); return elements.get(s); } };
  const ctx = vm.createContext({ structuredClone, performance, console, Uint8Array, document,
    atob: s => Buffer.from(s, 'base64').toString('binary'),
    setTimeout, clearTimeout,
    localStorage: { getItem: k => store.get(k) ?? null, setItem(k,v) { writes.push(k); store.set(k,v); } },
    window: { OSB_SIGN_DEFAULT_B64: Buffer.from([1,2,3]).toString('base64') },
  });
  vm.runInContext(source, ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'templates.js'), 'utf8'), ctx);
  const run = code => vm.runInContext(code, ctx);
  return { ctx, run, store, writes, elements };
}
async function until(fn) { for (let i = 0; i < 100; i++) { if (fn()) return; await new Promise(r => setImmediate(r)); } throw new Error('Timed out'); }

test('Typst preserves dollar replacement sequences and text ending in mm', () => {
  const {ctx,run} = setup();
  ctx.text = '$& $$ $` $\' " \\ # [ ]\nНовая строка';
  run('const generated = injectData(window.OSB_TEMPLATES.zayavlenie, dataLines({"v-content": text}))');
  assert.equal(run('generated.includes(dataLines({"v-content": text}))'), true);
  assert.equal(run('generated.split("// <OSB-DATA>").length - 1'), 1);
  assert.equal(run('dataLines({"v-content":"10mm"})'), '#let v-content = "10mm"');
  assert.equal(run('dataLines({"v-sign-width":"25mm"})'), '#let v-sign-width = 25mm');
});

test('Document names remain unique after deletions and renames', () => {
  const {run} = setup();
  assert.equal(run('autoDocName({docs:[{tpl:"zayavlenie",name:"Заявление в УСБ"},{tpl:"zayavlenie",name:"Заявление в УСБ 3"}]},"zayavlenie")'), 'Заявление в УСБ 2');
  assert.equal(run('autoDocName({docs:[{tpl:"proverka",name:"Заявление в УСБ"}]},"zayavlenie")'), 'Заявление в УСБ 2');
});

test('Notification pronoun follows subject sex without recomposing text', () => {
  const {run} = setup();
  run('state.template = "proverka"; state.docs.proverka.subj_sex = "f"');
  assert.equal(run('buildData()["v-notify-pronoun"]'), 'нее');
  run('state.docs.proverka.subj_sex = "m"');
  assert.equal(run('buildData()["v-notify-pronoun"]'), 'него');
  run('delete state.docs.proverka.subj_sex');
  assert.equal(run('buildData()["v-notify-pronoun"]'), 'него');
});

test('New documents are blank, dated today, with valid controls; old drafts survive', () => {
  const {run} = setup();
  assert.equal(run('Object.keys(TPL_NAMES).every(t => { const d = emptyDocument(t); return d.date === new Date().getFullYear()+"-"+String(new Date().getMonth()+1).padStart(2,"0")+"-"+String(new Date().getDate()).padStart(2,"0"); })'), true);
  assert.equal(run('emptyDocument("zayavlenie").appl_fio'), '');
  assert.equal(run('emptyDocument("proverka").subj_surname'), '');
  assert.equal(run('emptyDocument("protokol_oprosa").qa_count'), 1);
  assert.equal(run('emptyDocument("uksp").fact'), 'yes');
  assert.equal(run('emptyDocument("zayavlenie", false).date'), '');
  const old = setup({'osb_draft_zayavlenie_v1': JSON.stringify({appl_fio:'Сохранённый заявитель',date:'2025-01-02'})});
  assert.equal(old.run('state.docs.zayavlenie.appl_fio'), 'Сохранённый заявитель');
  assert.equal(old.run('state.docs.zayavlenie.date'), '2025-01-02');
});

test('Saves write only changed scope; failure stays visible across compilation status', () => {
  const {ctx,run,writes,elements,store} = setup();
  run('saveLS()'); writes.length = 0;
  run('state.docs.trebovanie.auto = "Новое авто"; saveLS("document")');
  assert.deepEqual(writes, ['osb_draft_trebovanie_v1']); writes.length = 0;
  run('saveLS("document")'); assert.deepEqual(writes, []);
  const originalSet = ctx.localStorage.setItem;
  ctx.localStorage.setItem = () => { throw new Error('quota'); };
  assert.equal(run('state.docs.trebovanie.auto = "Несохранённое"; saveLS("document")'), false);
  run('setStatus("Готов", false, true)');
  assert.match(elements.get('#saveStatus').textContent, /Не сохранено/);
  assert.notEqual(JSON.parse(store.get('osb_draft_trebovanie_v1')).auto, 'Несохранённое');
  run('state.profile.officer_phone = "123"; saveLS("profile")');
  ctx.localStorage.setItem = originalSet;
  run('saveLS("profile")'); assert.match(elements.get('#saveStatus').textContent, /Не сохранено/);
  run('saveLS("document")'); assert.match(elements.get('#saveStatus').textContent, /^Сохранено/);
});

test('Autofill requires source selection and uses only explicit dative position', () => {
  const {run} = setup();
  run(`state.cases = [{id:'c',docs:[
    {docId:'a',tpl:'proverka',data:{date:'2026-01-02',subj_post_rod:'инспектора',subj_surname:'Иванов',subj_initials:'И.И.',subj_rank:'майор полиции'}},
    {docId:'b',tpl:'proverka',data:{date:'2026-02-03',subj_post_dat:'Начальнику отдела',subj_surname:'Петров',subj_initials:'П.П.',subj_rank:'капитан полиции'}}
  ]}]; state.active = {mode:'case',caseId:'c',docId:'a'};`);
  assert.equal(run('Object.keys(fillUnspFromProverka({},{}).patch).length'), 0);
  assert.equal(run('fillUnspFromProverka({}, {}, "b").patch.addr_post'), 'Начальнику отдела');
  assert.equal(run('fillUnspFromProverka({}, {}, "b").patch.postan_date'), '2026-02-03');
  assert.equal(run('fillUnspFromProverka({}, {addr_fio:"Старое имя"}, "a").patch.addr_fio'), 'Иванову И.И.');
  assert.equal(run('Object.hasOwn(fillUnspFromProverka({}, {}, "a").patch,"addr_post")'), false);
});

test('Import validates format, field types, dates; supports older and empty backups', () => {
  const {ctx,run} = setup();
  ctx.backup = {v:1,app:'osb-docs',title:'Дело ОСБ',docs:[{tpl:'zayavlenie',data:{appl_fio:'Петров',show_accept:false,date:'2026-10-30'}},{tpl:'unknown',data:{}}]};
  assert.equal(run('parseCaseBackup(backup,"test.json").skipped'), 1);
  assert.equal(run('parseCaseBackup(backup,"test.json").caseData.title'), 'Дело УСБ');
  assert.equal(run('parseCaseBackup(backup,"test.json").caseData.docs[0].data.content'), '');
  assert.equal(run('parseCaseBackup({docs:[]},"test.json").caseData.docs.length'), 0);
  for (const change of ['backup.v = 2','backup.app = "other"','backup.docs[0].data.show_accept = "false"','backup.docs[0].data.date = "2026-02-30"','backup.docs[0].data = []']) {
    const s = setup(); s.ctx.backup = structuredClone(ctx.backup);
    s.run(change);
    assert.throws(() => s.run('parseCaseBackup(backup,"test.json")'));
  }
  assert.equal(run('parseCaseBackup({docs:[{tpl:"protokol_oprosa",data:{qa_count:""}}]}, "old.json").caseData.docs[0].data.qa_count'), 1);
});

test('Stale asynchronous compilation is discarded, including switch to an empty case', async () => {
  const {ctx,run,elements} = setup();
  const pending = [];
  ctx.window.$typst = {mapShadow:async()=>{}, unmapShadow:async()=>{}, pdf: args => new Promise(resolve => pending.push({resolve,args}))};
  run('typstOk = true; renderPreview = async bytes => bytes[0]');
  const first = run('recompile()'); await until(() => pending.length === 1);
  run('state.docs.trebovanie.auto = "changed"; invalidateExport()');
  pending[0].resolve(new Uint8Array([1])); await until(() => pending.length === 2);
  assert.equal(run('compiledSnapshot'), null);
  pending[1].resolve(new Uint8Array([2])); await first;
  assert.equal((await run('exportSnapshot()')).bytes[0], 2);
  assert.equal(elements.get('#pages').content, 2);
  const next = run('recompile()'); await until(() => pending.length === 3);
  run('state.cases = [{id:"empty",docs:[]}]; state.active = {mode:"case",caseId:"empty",docId:null}; recompile()');
  pending[2].resolve(new Uint8Array([3])); await next;
  assert.equal(run('compiledSnapshot'), null);
  assert.equal(elements.get('#btnPdf').disabled, true);
});

test('Changed signature with same length and endpoints gets remapped', async () => {
  const {ctx,run} = setup();
  const signatures = [];
  ctx.window.$typst = {mapShadow:async(p,bytes)=>signatures.push([...bytes]), unmapShadow:async()=>{}, pdf:async()=>new Uint8Array([1])};
  run('typstOk = true; renderPreview = async () => null; state.profile.signature = "data:image/png;base64,AQID"');
  await run('recompile()');
  run('state.profile.signature = "data:image/png;base64,AQQD"'); await run('recompile()');
  assert.deepEqual(signatures, [[1,2,3],[1,4,3]]);
});

test('Failed import does not add a case or announce success', () => {
  const {ctx,run,elements} = setup();
  ctx.FileReader = class {
    readAsText() { this.result = JSON.stringify({v:1,docs:[{tpl:'zayavlenie',data:{}}]}); this.onload(); }
  };
  ctx.localStorage.setItem = () => { throw new Error('quota'); };
  run('importCaseFile({name:"test.json"})');
  assert.equal(run('state.cases.length'), 0);
  assert.match(elements.get('#status').textContent, /Импорт не удался.*не сохранено/);
  assert.match(elements.get('#saveStatus').textContent, /Не сохранено/);
});

test('JPG export keeps the original filename and bytes while switching documents', async () => {
  const {ctx,run} = setup();
  const downloads = [];
  ctx.captureDownload = (blob,name) => downloads.push(name);
  ctx.document.createElement = () => ({getContext:()=>({fillRect(){}}),toBlob:cb=>cb({})});
  ctx.pdfjsLib = {getDocument({data}) {
    assert.equal(data[0], 7);
    run('state.template = "zayavlenie"; state.docs.zayavlenie.num = "999"');
    return {promise:Promise.resolve({numPages:2,destroy:async()=>{}, getPage:async()=>({getViewport:()=>({width:10,height:10}),render:()=>({promise:Promise.resolve()})})})};
  }};
  run('download = captureDownload');
  await run('exportJpg({bytes:new Uint8Array([7]),name:"original_document"})');
  assert.deepEqual(downloads, ['original_document_p1.jpg','original_document_p2.jpg']);
});
