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

    const pdfContents = () => page.evaluate(async () => {
      const pdf = await pdfjsLib.getDocument({data:compiledSnapshot.bytes.slice()}).promise;
      try {
        const pages = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const p = await pdf.getPage(i), content = await p.getTextContent();
          pages.push({width:p.view[2], items:content.items.map(x => ({text:x.str,x:x.transform[4],y:x.transform[5]}))});
        }
        return pages;
      } finally { await pdf.destroy(); }
    });
    await ready(() => page.evaluate(() => setActiveFree()));
    for (const [tpl,field] of Object.entries({trebovanie:'violator',proverka:'violation',otstranenie:'prikaz',
      unsp:'points',uksp:'est_text',notification:'body',protokol_oprosa:'a1',zayavlenie:'content'})) {
      await ready(() => page.locator(`[data-t="${tpl}"]`).click());
      await ready(() => page.locator('#btnFill').click());
      const input = page.locator(`[data-fk="${field}"]`);
      assert.equal(await input.locator('..').getByRole('button',{name:'Жирный',exact:true}).count(), 1);
      assert.equal(await input.locator('..').getByRole('button',{name:'Нумерованный список',exact:true}).count(), 1);
      await ready(() => input.fill('До **жирный** после, *курсив*, __линия__.\n1. Первый\n2. Второй\n- Пункт'));
      const text = (await pdfContents()).flatMap(p => p.items.map(x => x.text)).join(' ').replace(/\s+/g,' ');
      assert.match(text, /До жирный после/);
      assert.ok(!text.includes('**жирный**'));
      assert.ok(!text.includes('[До'));
      if (process.env.OSB_ARTIFACT_DIR) {
        fs.mkdirSync(process.env.OSB_ARTIFACT_DIR, {recursive:true});
        fs.writeFileSync(`${process.env.OSB_ARTIFACT_DIR}/${tpl}-formatted.pdf`, Buffer.from(await page.evaluate(() => Array.from(compiledSnapshot.bytes))));
      }
    }
    for (const tpl of ['unsp','uksp','notification']) {
      await ready(() => page.locator(`[data-t="${tpl}"]`).click());
      await ready(() => page.locator('#btnFill').click());
      await page.locator('[data-fk="reply_num"]').fill('ВХ-777');
      await ready(() => page.locator('[data-fk="reply_date"]').fill('2026-11-03'));
      const first = (await pdfContents())[0];
      const reply = first.items.find(x => x.text.includes('ВХ-777'));
      assert.ok(reply, `${tpl}: reply reference missing`);
      assert.ok(reply.x < first.width / 2, `${tpl}: reply reference must be in left header`);
      const title = first.items.find(x => x.text.includes(tpl === 'notification' ? 'Уведомление' : 'Уважаемый'));
      assert.ok(reply.y > title.y, `${tpl}: reply reference must precede body`);
      if (process.env.OSB_ARTIFACT_DIR) {
        fs.mkdirSync(process.env.OSB_ARTIFACT_DIR, {recursive:true});
        fs.writeFileSync(`${process.env.OSB_ARTIFACT_DIR}/${tpl}.pdf`, Buffer.from(await page.evaluate(() => Array.from(compiledSnapshot.bytes))));
      }
      await ready(() => page.locator('[data-fk="reply_num"]').fill(''));
      assert.match((await pdfContents())[0].items.map(x => x.text).join(' '), /На документ от 03\.11\.2026/);
    }
    const body = page.locator('[data-fk="body"]');
    await body.fill('До выделения после');
    await body.evaluate(el => { el.focus(); el.setSelectionRange(3,12); });
    await ready(() => body.locator('..').getByRole('button',{name:'Жирный',exact:true}).click());
    assert.equal(await body.inputValue(), 'До **выделения** после');
    await body.fill('Первый\nВторой');
    await body.evaluate(el => { el.focus(); el.select(); });
    await ready(() => body.locator('..').getByRole('button',{name:'Нумерованный список',exact:true}).click());
    assert.equal(await body.inputValue(), '1. Первый\n2. Второй');
    await ready(() => body.fill('До **жирный** после, *курсив*, __линия__.\n1. Первый\n2. Второй\n- Пункт\n#panic("буквально") [ ] $&'));
    const formattedText = (await pdfContents()).flatMap(p => p.items.map(x => x.text)).join(' ').replace(/\s+/g,' ');
    assert.match(formattedText, /До жирный после/);
    assert.ok(!formattedText.includes('**'));
    assert.match(formattedText, /#panic/);
    assert.equal(await page.locator('#errorBox').isVisible(), false);
    if (process.env.OSB_ARTIFACT_DIR) {
      fs.writeFileSync(`${process.env.OSB_ARTIFACT_DIR}/notification-formatted.pdf`, Buffer.from(await page.evaluate(() => Array.from(compiledSnapshot.bytes))));
      await page.screenshot({path:`${process.env.OSB_ARTIFACT_DIR}/notification-ui.png`, fullPage:true});
    }
    const savedBody = await body.inputValue();
    await page.reload();
    await page.waitForFunction(() => window.__compileSeq > 0, null, {timeout:90000});
    assert.equal(await body.inputValue(), savedBody);
    assert.equal(await page.locator('.format-hint').count(), 0);
    await page.locator('details.profile > summary').click();
    const hideFormatting = page.getByLabel('Скрыть кнопки форматирования', {exact:true});
    const beforeToggle = await page.evaluate(() => window.__compileSeq);
    await hideFormatting.check();
    assert.equal(await page.locator('.format-toolbar:visible').count(), 0);
    assert.equal(await body.inputValue(), savedBody);
    assert.equal(await page.evaluate(() => window.__compileSeq), beforeToggle);
    await ready(() => body.fill('Текст **жирный** после, *курсив* и __линия__.'));
    assert.match((await pdfContents()).flatMap(p=>p.items.map(x=>x.text)).join(' ').replace(/\s+/g,' '), /Текст жирный после/);
    await page.reload();
    await page.waitForFunction(() => window.__compileSeq > 0, null, {timeout:90000});
    assert.equal(await page.locator('.format-toolbar:visible').count(), 0);
    await page.locator('details.profile > summary').click();
    assert.equal(await hideFormatting.isChecked(), true);
    await hideFormatting.uncheck();
    assert.ok(await page.locator('.format-toolbar:visible').count() > 0);
    await page.locator('details.profile > summary').click();
    const longBody = Array.from({length:55}, (_,i) => `Абзац ${i+1}. Длинное свободное уведомление с переносом текста на следующую страницу.`).join('\n');
    await ready(() => body.fill(longBody));
    const longPdf = await pdfContents();
    assert.ok(longPdf.length > 1);
    const lastPage = longPdf.at(-1).items.map(x => x.text).join(' ');
    assert.match(lastPage, /ОТМЕТКА О ПОЛУЧЕНИИ/);
    assert.match(longPdf.flatMap(p=>p.items.map(x=>x.text)).join(' '), /Абзац 55/);
    await page.evaluate(() => openModal('create'));
    await page.locator('#modalName').fill('Свободные уведомления');
    await page.locator('#modalOk').click();
    await ready(() => page.evaluate(() => addDocToCase('notification')));
    await ready(() => page.locator('#btnFill').click());
    const backup = await page.evaluate(() => ({v:1,app:'osb-docs',title:'Копия дела',docs:getActiveCase().docs}));
    await importBackup(backup);
    assert.equal(await page.evaluate(() => workTpl()), 'notification');
    assert.equal(await body.inputValue(), backup.docs[0].data.body);
    assert.deepEqual(errors, []);
    console.log('Browser OK: real Typst/PDF/JPG, reply placement in all notifications, rich text toolbar, long notification, drafts/cases/JSON, existing regressions.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
