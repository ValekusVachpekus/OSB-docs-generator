#!/usr/bin/env node
/* Требует Playwright: OSB_PLAYWRIGHT_PATH=/path/to/playwright node tools/test-browser.cjs
   Сервер: python3 -m http.server 8000 --bind 127.0.0.1 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require(process.env.OSB_PLAYWRIGHT_PATH || 'playwright');
(async () => {
  const browser = await chromium.launch({headless: true,
    ...(process.env.OSB_CHROMIUM_PATH ? {executablePath:process.env.OSB_CHROMIUM_PATH} : {}),
    args:['--no-sandbox']});
  try {
    const page = await browser.newPage({viewport:{width:1440,height:1000}, acceptDownloads:true});
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('dialog', d => d.accept());
    await page.goto(process.env.OSB_TEST_URL || 'http://127.0.0.1:8000');
    await page.waitForFunction(() => window.__compileSeq > 0, null, {timeout:90000});
    assert.equal(await page.locator('.topbar .status').count(), 0);
    assert.equal(await page.locator('.preview-status .status').count(), 2);
    const ready = async action => {
      const seq = await page.evaluate(() => window.__compileSeq);
      await action();
      await page.waitForFunction(n => window.__compileSeq > n, seq, {timeout:60000});
      await page.waitForFunction(() => !document.querySelector('#btnPdf').disabled);
    };
    await ready(() => page.locator('[data-t="zayavlenie"]').click());
    assert.equal(await page.locator('[data-fk="appl_fio"]').inputValue(), '');
    assert.equal(await page.locator('[data-fk="date"]').inputValue(), await page.evaluate(() => emptyDocument('zayavlenie').date));
    await ready(() => page.locator('#btnFill').click());
    const content = 'Проверка $& $$ $` $\' " \\ # [ ]\nВторая строка';
    await page.locator('[data-fk="content"]').fill(content);
    assert.equal(await page.locator('#btnPdf').isDisabled(), true);
    await page.waitForFunction(() => !document.querySelector('#btnPdf').disabled);
    assert.equal(await page.locator('#errorBox').isVisible(), false);
    const pdfWait = page.waitForEvent('download');
    await page.locator('#btnPdf').click();
    const pdf = await pdfWait;
    assert.equal(fs.readFileSync(await pdf.path()).subarray(0,5).toString(), '%PDF-');
    const typWait = page.waitForEvent('download');
    await page.locator('#btnTyp').click();
    assert.match(fs.readFileSync(await (await typWait).path(), 'utf8'), /Проверка \$&/);
    const jpgs = [];
    const collectJpg = d => { if (d.suggestedFilename().endsWith('.jpg')) jpgs.push(d); };
    page.on('download', collectJpg);
    await page.locator('#btnJpg').click();
    await page.waitForFunction(() => document.querySelector('#status').textContent === 'JPG сохранён');
    assert.equal(jpgs.length, 2);
    assert.match(jpgs[0].suggestedFilename(), /_p1.jpg$/);
    assert.match(jpgs[1].suggestedFilename(), /_p2.jpg$/);
    page.off('download', collectJpg);
    await page.reload();
    await page.waitForFunction(() => window.__compileSeq > 0, null, {timeout:90000});
    assert.equal(await page.locator('[data-fk="content"]').inputValue(), content);

    await page.evaluate(() => openModal('create'));
    await page.locator('#modalName').fill('Проверка исправлений');
    await page.locator('#modalOk').click();
    await ready(() => page.evaluate(() => addDocToCase('proverka')));
    assert.equal(await page.locator('[data-fk="subj_surname"]').inputValue(), '');
    await ready(() => page.locator('#btnFill').click());
    await ready(() => page.locator('[data-fk="subj_sex"] [data-v="f"]').click());
    const femaleText = await page.evaluate(async () => {
      const pdf = await pdfjsLib.getDocument({data:compiledSnapshot.bytes.slice()}).promise;
      try {
        const content = await (await pdf.getPage(1)).getTextContent();
        return content.items.map(i => i.str).join(' ');
      } finally { await pdf.destroy(); }
    });
    assert.match(femaleText, /в отношении нее/);
    await page.locator('[data-fk="subj_post_dat"]').fill('Инспектору первого отдела');
    await ready(() => page.evaluate(() => addDocToCase('proverka')));
    await ready(() => page.locator('#btnFill').click());
    await page.locator('[data-fk="subj_post_dat"]').fill('Начальнику второго отдела');
    const second = await page.evaluate(() => state.active.docId);
    await ready(() => page.evaluate(() => addDocToCase('unsp')));
    await page.locator('[data-source-proverka]').selectOption(second);
    await ready(() => page.locator('[data-action="fill_from_proverka"]').click());
    assert.equal(await page.locator('[data-fk="addr_post"]').inputValue(), 'Начальнику второго отдела');
    await page.evaluate(() => {
      window.originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function(k,v) { if (k === 'osb_cases_v1') throw new DOMException('quota','QuotaExceededError'); return window.originalSetItem.call(this,k,v); };
    });
    await ready(() => page.locator('[data-fk="addr_post"]').fill('Несохранённая должность'));
    assert.match(await page.locator('#saveStatus').textContent(), /Не сохранено/);
    await page.evaluate(() => { Storage.prototype.setItem = window.originalSetItem; saveLS('document'); });
    assert.match(await page.locator('#saveStatus').textContent(), /^Сохранено/);
    await page.reload();
    await page.waitForFunction(() => window.__compileSeq > 0, null, {timeout:90000});
    assert.equal(await page.locator('[data-fk="addr_post"]').inputValue(), 'Несохранённая должность');

    const count = await page.evaluate(() => state.cases.length);
    const importBackup = async object => {
      await page.locator('#importCaseFile').setInputFiles({name:'test.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(object))});
      await page.waitForFunction(() => /Импорт/.test(document.querySelector('#status').textContent));
    };
    await importBackup({v:2,docs:[]});
    assert.match(await page.locator('#status').textContent(), /неподдерживаемая версия/);
    assert.equal(await page.evaluate(() => state.cases.length), count);
    await importBackup({v:1,app:'osb-docs',docs:[{tpl:'zayavlenie',data:{appl_fio:'Петров'}},{tpl:'unknown',data:{}}]});
    assert.equal(await page.evaluate(() => state.cases.length), count+1);
    assert.match(await page.locator('#status').textContent(), /Пропущено неизвестных шаблонов: 1/);
    assert.deepEqual(errors, []);
    console.log('Browser OK: real Typst/PDF/JPG, dollar text, blank documents, persistence, source selector, quota status, JSON validation.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
