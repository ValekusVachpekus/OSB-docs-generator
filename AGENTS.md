# AGENTS.md — OSB Typst Docs Site

## Цель
Статический сайт (GitHub Pages, без бэкенда) — графический редактор РП-документов ОСБ
на основе Typst-шаблонов. Сверху выбор шаблона, ниже форма полей, справа живое превью,
экспорт в PDF и JPG, подпись/печати ставятся удобными контролами.

## Решения (подтверждены пользователем)
- Хостинг: статика для GitHub Pages. Сборка Vite — только если статика не потянет
  (экспорт/подпись должны работать на чистой статике — они могут, через WASM+Canvas).
- Рендер: Typst WASM в браузере (`@myriaddreamin/typst.ts` через CDN esm.sh/jsdelivr),
  1-в-1 совпадение с `.typ`. HTML-перерисовка НЕ используется.
- Подписи: только своя подпись сотрудника (PNG upload → base64 → localStorage → virtual FS).
  Подписи начальников / получателя — по надобности: текст по умолчанию ("Леонов", "Егоров",
  "ПОДПИСЬ"), опционально загрузка PNG в момент включения штампа "Согласовано".
- Постоянные данные: ОДИН набор (должность/звание/ФИО сотрудника ОСБ + 2 начальника +
  исполнитель/телефон). Без мультипрофилей.
- Штампы: каждый включается галкой, КРОМЕ "Копия верна" (всегда видима, только
  должность+звание+ФИО сотрудника из профиля).
  Опциональные: `Согласовано ОСБ`, `Согласовано ГУ` (дата вручную, подпись/ФИО/должность —
  из постоянных данных), `Отметка о вручении/получении` (дата/время вручную; подпись и ФИО
  получившего — ВСЕГДА в именительном падеже: проверка — из subj (ФИО целиком при наличии
  имени/отчества, иначе звание+фамилия+инициалы), отстранение — автоперевод фразы в именит.
  падеж (nominativePhrase), требование — из ознакомленного, уведомление — из обращения).
  `Копия верна` в проверке — галка; в УНСП/УКСП — такой же штамп под получателем, тоже галка.
- JPG: постранично, несколькими файлами (`doc_p1.jpg`, `doc_p2.jpg`, ...).
- Прогресс: черновик каждого шаблона отдельно в localStorage + отдельный ключ профиля.

## Исходные шаблоны (не удалять оригиналы)
- `Otstranenie/otstranenie_template.typ` — Приказ о временном отстранении (+ gerb.svg, canvas1.png)
- `Proverka/proverka_template.typ` — Приказ о назначении служебной проверки (+ gerb.svg, canvas.png, canvas1.png)
- `Trebovanie/trebovanie_template.typ` — Требование об устранении (+ gerb.svg, canvas1.png)
- Общее оформление: Liberation Serif 12pt, поля (2/2/3/1.5см), фон "бумага" (grain+волокна),
  шапка МВД+герб, штамп "Копия верна" (синий), 2× "Согласовано" (красный), "Отметка о вручении".

## Инвентаризация полей

### Общие (профиль, `osb_profile_v1`)
```
officer.post       # должность сотрудника ОСБ (зам. начальника ОСБ ГУ МВД)
officer.rank       # звание (майор/подполковник полиции)
officer.fioFull    # Щетков Владислав Алексеевич
officer.fioShort   # В.А. Щетков
officer.phone      # 5-6-5 (исполнитель)
bossOsb.post/rank/fioFull/fioShort/signText  # Леонов Данила Сергеевич
bossGu.post/rank/fioFull/fioShort/signText    # Егоров Дионис Иванович
signature.dataUrl  # своя подпись PNG (base64, даунскейл ~800px), signatureWidthMm
```

### Trebovanie (документ)
```
doc.date {day, monthGen, year}  # «13» апреля 2026 г.
doc.city                        # г. Арзамас
doc.articleTitle                # 13.6 КоАП РФ (заголовок)
violator.post + fioFull         # инспектор ОБ ДПС Иван Иванов
demand.deadline, demand.article, demand.auto (марка/модель/ГРЗ), demand.liabilityArticle
acquainted.post + fioFull + signText
stamps: soglOsb{show,date,sign}, soglGu{...}, vruchenie{show,date,time,sign,fio}
```

### Proverka (документ)
```
doc.date {day,month,year}, doc.num (= № проверки), doc.city
subj.post_rod + subj.rank(select) + subj.sex + subj.surname + subj.initials  # данные сотрудника
  → кнопка «⟳ Собрать формулировки» составляет (склонение званий/фамилий встроено):
    target_title (в отношении), supervision (кто и за кем, офицер — из профиля),
    suspend_target, notify_fio. Собранное правится вручную.
violationDesc (текст пользователя) + VIOLATION_TAIL (стандартный абзац — всегда в конце)
suspend: 'отстранить' | 'не отстранять'  # segmented-переключатель
```

### Unsp — уведомление о начале проверки (вкладка «Уведомление»)
```
doc.date (→ DD.MM.YYYY), doc_num (0028-СП), reply_num/reply_date (необяз.),
основание и «Запрос в порядке…» — ВСЕГДА стандартные (захардкожены в шаблоне), полей нет;
номер+дата и «Запрос…» — в шапке
addr_post/addr_rank/addr_fio (дат. падеж) + appeal + greet_fio (именит.)
points, check_start, postan_date, law_ref
sign_post — из профиля (officer_post); подпись/печать — галки
poluch (отметка о получении): show_poluch + poluch_date/time, ФИО/подпись — из addr_fio
Автозаполнение «⇪ Заполнить из постановления»: даты + addr_post/rank/ФИО/обращение
  из черновика proverka (склонение: RANK_FORMS[2], declSurname.dat, declFirstDat, declPatrDat).
  Имя/отчество в proverka (subj_name/subj_patr, необяз.) нужны для полного ФИО.
```

### Uksp — уведомление об окончании проверки (вкладка «Окончание», переработка УНСП)
```
Те же addr_*/appeal/greet/doc/reply/poluch, что в УНСП + what (в чём выразилось),
check_start/check_end/postan_date, fact (yes/no → подтвердился/не подтвердился +
установленным/неустановленным), est_date/est_text, penalty (пусто → п.2 скрыт),
sign_post/sign_rank (из профиля, как в УНСП), подпись — как в УНСП
(звание+подпись+ФИО справа, без разбивки инициалов); печать фиксированная поверх
(разрешено налезание), отметка о получении — галкой.
Автозаполнение — та же кнопка fill_from_proverka (общие ключи).
```

### Otstranenie (документ)
```
doc.date {day,month,year}, doc.num, doc.city
subjectFioFull                  # кого отстранить (2 места)
ustavArticle                    # статья Устава
check.num
stamps: как выше
```

## Архитектура сайта (статика)
```
index.html      # таб-переключатель шаблонов + секции форм + превью A4 + тулбар экспорта
style.css       # формы, превью, segmented/toggle/checkbox
app.js          # состояние, localStorage, генерация .typ, typst.ts init/preview/export
templates.js    # СГЕНЕРИРОВАН (tools/build-templates.py) — шаблоны, вшитые для file://
templates/
  trebovanie.typ, proverka.typ, otstranenie.typ  # ПАРАМЕТРИЧЕСКИЕ (#let v-* в // <OSB-DATA>) — источник вёрстки
assets/gerb.svg, assets/fonts/LiberationSerif-*.ttf
assets/*.js     # СГЕНЕРИРОВАНЫ (tools/make-assets.py) — base64 для file://
```

- Typst-шаблоны параметрические: `#let d = json.decode(sys.inputs.data)` или подстановка
  строкой перед компиляцией (проще: генерировать `data.typ` с `#let` и ` #include`).
  Условные штампы: `#if d.stamps.soglOsb.show [ ... ]`.
- Картинки в WASM FS: `/gerb.svg` (общий), `/sign.png` (загруженная подпись, bytes из dataUrl).
- Preview: `renderToSvg` постранично. PDF: `compilePdf`. JPG: `renderToCanvas` →
  `canvas.toDataURL('image/jpeg', 0.92)` → скачивание каждого листа.
- Имена файлов: `{template}_{num|date}.pdf`, `{template}_p{1..N}.jpg`.

## localStorage
- `osb_profile_v1` — профиль + подпись ( debounce 300мс ).
- `osb_draft_trebovanie_v1`, `osb_draft_proverka_v1`, `osb_draft_otstranenie_v1` — черновики.
- Кнопки: "Очистить документ", "Сбросить всё". Лимит 5МБ → подпись даунскейлить.

## UX-контролы (обязательно)
- Дата: `<input type=date>` → разбивка в `«ДД» месяц ГГГГ г.` (месяц в родительном падеже).
- Время: `<input type=time>`.
- `отстранить/не отстранять`: segmented radio-переключатель.
- Штампы: `checkbox "поставить"` → раскрывает подформу (дата/время/ФИО/подпись).
- Подпись: drag&drop + input file, превью на "прозрачной шахматке", ширина слайдером (мм).
- Валидация: обязательные подсвечиваются, экспорт блокируется с подсказкой.

## Порядок работ
- [x] План + AGENTS.md
- [x] Параметризовать 3× .typ (переменные + `if show`), проверить локально `typst compile`
- [x] Каркас index.html/css (табы, формы по схеме выше, превью)
- [x] app.js: состояние + localStorage + генерация typ-источника
- [x] Подключить typst.ts: init/fonts/FS/preview/PDF/JPG, ошибки в UI
- [x] Подпись upload + штампы-галки + переключатель отстранить
- [x] Тест: заполнить → preview → PDF → JPG постранично (headless Chromium, /tmp/e2e/); деплой GH Pages — готов (статика, см. README)

## Команды для проверки
- `typst compile <template>.typ out.pdf` — проверка параметрических шаблонов
- `python3 -m http.server 8000` — локальный предпросмотр статики
- Деплой: пуш ветки в GitHub → Settings → Pages → root
