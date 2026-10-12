'use strict';
/* ОСБ — редактор документов. Статика + Typst WASM (cdn) + pdf.js для превью/JPG. */

/* ---------- константы ---------- */
const MONTHS_GEN = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const RANKS = ['рядовой полиции','младший сержант полиции','сержант полиции','старший сержант полиции',
  'прапорщик полиции','лейтенант полиции','старший лейтенант полиции','капитан полиции',
  'майор полиции','подполковник полиции','полковник полиции','генерал-майор полиции','генерал-лейтенант полиции'];
const LS_PROFILE = 'osb_profile_v1';
const LS_TEMPLATE = 'osb_template_v1';
const LS_CASES = 'osb_cases_v1';
const LS_ACTIVE = 'osb_active_v1';
const LS_DRAFT = t => `osb_draft_${t}_v1`;
const TPL_NAMES = { trebovanie: 'Требование (beta)', proverka: 'Постановление на СП', otstranenie: 'Отстранение (beta)', unsp: 'Уведомление о начале СП', uksp: 'Уведомление об окончании СП', protokol_oprosa: 'Протокол опроса', zayavlenie: 'Заявление в ОСБ' };
const LIBERATION_FONTS = ['Regular', 'Bold', 'Italic', 'BoldItalic'];

/* Ключи DATA-блока каждого шаблона — должны 1-в-1 совпадать с #let v-* в templates/*.typ.
   Проверяется tools/check-fields.py */
const DATA_KEYS = {
  trebovanie: ['v-day','v-month-gen','v-month-num','v-year','v-city','v-title-tail','v-preamble-article',
    'v-violator','v-deadline-text','v-demand-article','v-auto','v-liability','v-acq-post','v-acq-sign','v-acq-short',
    'v-officer-post','v-officer-rank','v-officer-full','v-officer-short','v-officer-phone',
    'v-sogl-osb-post','v-sogl-osb-rank','v-sogl-osb-day','v-sogl-osb-month-gen','v-sogl-osb-year','v-sogl-osb-sign','v-sogl-osb-fio',
    'v-sogl-gu-post','v-sogl-gu-rank','v-sogl-gu-day','v-sogl-gu-month-gen','v-sogl-gu-year','v-sogl-gu-sign','v-sogl-gu-fio',
    'v-vruch-day','v-vruch-month-gen','v-vruch-year','v-vruch-time','v-vruch-sign','v-vruch-fio',
    'v-has-gerb','v-has-sign','v-sign-width','v-show-bottom-sign','v-show-sogl-osb','v-show-sogl-gu','v-show-vruch'],
  proverka: ['v-day','v-month-gen','v-month-num','v-year','v-city','v-num','v-target-title','v-supervision',
    'v-violation','v-check-num','v-suspend-word','v-suspend-target','v-notify-fio',
    'v-officer-post','v-officer-rank','v-officer-full','v-officer-short','v-officer-phone',
    'v-sogl-osb-post','v-sogl-osb-rank','v-sogl-osb-day','v-sogl-osb-month-gen','v-sogl-osb-year','v-sogl-osb-sign','v-sogl-osb-fio',
    'v-sogl-gu-post','v-sogl-gu-rank','v-sogl-gu-day','v-sogl-gu-month-gen','v-sogl-gu-year','v-sogl-gu-sign','v-sogl-gu-fio',
    'v-vruch-day','v-vruch-month-gen','v-vruch-year','v-vruch-time','v-vruch-sign','v-vruch-fio',
    'v-has-gerb','v-has-sign','v-sign-width','v-show-copy','v-show-bottom-sign','v-show-sogl-osb','v-show-sogl-gu','v-show-vruch'],
  otstranenie: ['v-day','v-month-gen','v-month-num','v-year','v-city','v-num','v-subject','v-subject-gen',
    'v-officer-rank-full','v-ustav-article','v-check-num',
    'v-officer-post','v-officer-rank','v-officer-full','v-officer-short','v-officer-phone',
    'v-sogl-osb-post','v-sogl-osb-rank','v-sogl-osb-day','v-sogl-osb-month-gen','v-sogl-osb-year','v-sogl-osb-sign','v-sogl-osb-fio',
    'v-sogl-gu-post','v-sogl-gu-rank','v-sogl-gu-day','v-sogl-gu-month-gen','v-sogl-gu-year','v-sogl-gu-sign','v-sogl-gu-fio',
    'v-vruch-day','v-vruch-month-gen','v-vruch-year','v-vruch-time','v-vruch-sign','v-vruch-fio',
    'v-has-gerb','v-has-sign','v-sign-width','v-show-bottom-sign','v-show-sogl-osb','v-show-sogl-gu','v-show-vruch'],
  unsp: ['v-date-dots','v-doc-num','v-show-reply','v-reply-num','v-reply-date',
    'v-addr-post','v-addr-rank','v-addr-fio','v-appeal','v-greet-fio',
    'v-points','v-check-start','v-postan-date',
    'v-sign-post','v-sign-rank','v-officer-post','v-officer-rank','v-officer-full','v-officer-short','v-officer-phone',
    'v-seal-l1','v-seal-l2','v-seal-l3','v-seal-l4',
    'v-has-gerb','v-has-sign','v-has-seal-img','v-sign-width','v-show-copy','v-show-sign','v-show-seal',
    'v-show-poluch','v-poluch-day','v-poluch-month-gen','v-poluch-year','v-poluch-time','v-poluch-sign','v-poluch-fio'],
  uksp: ['v-date-dots','v-doc-num','v-show-reply','v-reply-num','v-reply-date',
    'v-addr-post','v-addr-rank','v-addr-fio','v-appeal','v-greet-fio',
    'v-what','v-check-start','v-check-end','v-postan-date',
    'v-fact-word','v-decision-word','v-est-date','v-est-text','v-has-penalty','v-penalty',
    'v-sign-post','v-sign-rank','v-officer-post','v-officer-rank','v-officer-full','v-officer-short','v-officer-phone',
    'v-seal-l1','v-seal-l2','v-seal-l3','v-seal-l4',
    'v-has-gerb','v-has-sign','v-has-seal-img','v-sign-width','v-show-copy','v-show-sign','v-show-seal',
    'v-show-poluch','v-poluch-day','v-poluch-month-gen','v-poluch-year','v-poluch-time','v-poluch-sign','v-poluch-fio'],
  protokol_oprosa: ['v-place','v-day','v-month-gen','v-year2','v-start-h','v-start-m','v-end-h','v-end-m',
    'v-officer-post','v-officer-title','v-officer-short',
    'v-fio','v-birth-date','v-birth-place','v-address','v-phone','v-citizenship','v-education',
    'v-family','v-work','v-military','v-conviction','v-passport','v-other','v-sig',
    'v-q1','v-a1','v-q2','v-a2','v-q3','v-a3','v-q4','v-a4','v-q5','v-a5',
    'v-q6','v-a6','v-q7','v-a7','v-q8','v-a8','v-q9','v-a9','v-qa-count',
    'v-has-sign','v-sign-width'],
  zayavlenie: ['v-day','v-month-gen','v-month-num','v-year',
    'v-boss-to','v-appl-fio','v-appl-birth','v-appl-address','v-appl-phone','v-appl-passport',
    'v-target','v-event-date','v-event-place','v-content','v-request','v-appl-sign',
    'v-num','v-accept-time','v-brief',
    'v-officer-post','v-officer-rank','v-officer-full','v-officer-short','v-officer-phone',
    'v-has-gerb','v-has-sign','v-has-seal-img','v-sign-width','v-show-accept','v-show-seal'],
};

/* ---------- значения по умолчанию (пример заполнения) ---------- */
const DEFAULT_PROFILE = {
  officer_post: 'Заместитель начальника отдела собственной безопасности ГУ МВД',
  officer_rank: 'майор полиции',
  officer_full: 'Щетков Владислав Алексеевич',
  officer_short: 'В.А. Щетков',
  officer_phone: '5-6-5',
  osb_post: 'Начальник ОСБ ГУ МВД', osb_rank: 'подполковник полиции',
  osb_full: 'Леонов Данила Сергеевич', osb_short: 'Д.С. Леонов', osb_sign: 'Леонов',
  gu_post: 'Начальник ГУ МВД', gu_rank: 'генерал-лейтенант полиции',
  gu_full: 'Егоров Дионис Иванович', gu_short: 'Д.И. Егоров', gu_sign: 'Егоров',
  signature: 'default', sign_width: 25, sign_clean: true,
};
const STAMPS_DEF = {
  show_bottom_sign: true,
  show_copy: true,
  show_sogl_osb: true, sogl_osb_date: '2026-04-12',
  show_sogl_gu: true, sogl_gu_date: '2026-04-12',
  show_vruch: true, vruch_date: '2026-04-12', vruch_time: '00:00',
};
/* Стандартный абзац блока «Установил» — добавляется ВСЕГДА в конец текста пользователя */
const VIOLATION_TAIL = 'В соответствии с требованиями Федерального закона «О полиции» и внутреннего устава ОВД, а также в целях установления фактов, обстоятельств и причин возможного нарушения служебной дисциплины';
/* Звания (именительный) -> родительный / творительный / дательный падеж */
const RANK_FORMS = {
  'рядовой полиции': ['рядового полиции', 'рядовым полиции', 'рядовому полиции'],
  'младший сержант полиции': ['младшего сержанта полиции', 'младшим сержантом полиции', 'младшему сержанту полиции'],
  'сержант полиции': ['сержанта полиции', 'сержантом полиции', 'сержанту полиции'],
  'старший сержант полиции': ['старшего сержанта полиции', 'старшим сержантом полиции', 'старшему сержанту полиции'],
  'старшина полиции': ['старшины полиции', 'старшиной полиции', 'старшине полиции'],
  'прапорщик полиции': ['прапорщика полиции', 'прапорщиком полиции', 'прапорщику полиции'],
  'старший прапорщик полиции': ['старшего прапорщика полиции', 'старшим прапорщиком полиции', 'старшему прапорщику полиции'],
  'младший лейтенант полиции': ['младшего лейтенанта полиции', 'младшим лейтенантом полиции', 'младшему лейтенанту полиции'],
  'лейтенант полиции': ['лейтенанта полиции', 'лейтенантом полиции', 'лейтенанту полиции'],
  'старший лейтенант полиции': ['старшего лейтенанта полиции', 'старшим лейтенантом полиции', 'старшему лейтенанту полиции'],
  'капитан полиции': ['капитана полиции', 'капитаном полиции', 'капитану полиции'],
  'майор полиции': ['майора полиции', 'майором полиции', 'майору полиции'],
  'подполковник полиции': ['подполковника полиции', 'подполковником полиции', 'подполковнику полиции'],
  'полковник полиции': ['полковника полиции', 'полковником полиции', 'полковнику полиции'],
  'генерал-майор полиции': ['генерал-майора полиции', 'генерал-майором полиции', 'генерал-майору полиции'],
  'генерал-лейтенант полиции': ['генерал-лейтенанта полиции', 'генерал-лейтенантом полиции', 'генерал-лейтенанту полиции'],
  'генерал-полковник полиции': ['генерал-полковника полиции', 'генерал-полковником полиции', 'генерал-полковнику полиции'],
};
const RANK_LIST = Object.keys(RANK_FORMS);
const DEFAULT_DOCS = {
  trebovanie: { date: '2026-04-13', city: 'г. Арзамас',
    title_tail: 'ст. 13.6 КоАП РФ', preamble_article: 'ст. 13.6 КоАП РФ',
    violator: 'инспектора отдельного батальона ДПС Ивана Иванова',
    deadline: '2026-04-14', demand_article: 'ст. 13.6 КоАП РФ',
    auto: 'BMW M4 G83 (ГРЗ С003ХА 06)', liability: 'ст. 20.6 КоАП РФ',
    acq_post: 'Инспектор ОБ ДПС Юрий Ингушев', acq_sign: 'Ингушев', acq_short: 'Ю.С. Ингушев',
    ...structuredClone(STAMPS_DEF) },
  proverka: { date: '2026-04-02', city: 'г. Арзамас', num: '33',
    subj_post_rod: 'сотрудника ОБ ДПС ГАИ', subj_rank: 'младший сержант полиции',
    subj_sex: 'm', subj_surname: 'Иванов', subj_initials: 'А.А.',
    subj_name: 'Иван', subj_patr: 'Иванович',
    target_title: 'сотрудника ОБ ДПС ГАИ младшего сержанта полиции Иванова А.А.',
    supervision: 'Заместитель начальника отдела собственной безопасности ГУ МВД, майор полиции Щетков Владислав Алексеевич, в ходе проведения надзорной деятельности за младшим сержантом полиции Ивановым А.А.',
    violation: 'Выявлены признаки нарушения служебной дисциплины',
    suspend: 'отстранить',
    suspend_target: 'младшего сержанта полиции Иванова А.А.', notify_fio: 'младшего сержанта полиции Иванова А.А.',
    ...structuredClone(STAMPS_DEF) },
  otstranenie: { date: '2026-04-12', city: 'г. Арзамас', num: '34',
    subject: 'младшего сержанта полиции Молотова А.А.',
    officer_rank_full: 'заместителем начальника ОСБ подполковником полиции Щетковым В.А.',
    ustav_article: '12', check_num: '33',
    ...structuredClone(STAMPS_DEF) },
  unsp: { date: '2026-10-01', doc_num: '0028-СП', reply_num: '', reply_date: '',
    addr_post: 'Инспектору СР ДПС', addr_rank: 'Лейтенанту полиции',
    addr_fio: 'Иванову Ивану Ивановичу', appeal: 'Уважаемый',
    greet_fio: 'Иванов Иван Иванович',
    points: 'п. 3.2, 4.3 ВУ', check_start: '2026-10-01', postan_date: '2026-10-01',
    show_sign: true, show_seal: true, show_copy: true,
    show_poluch: true, poluch_date: '2026-10-01', poluch_time: '00:00' },
  uksp: { date: '2026-10-15', doc_num: '0031-СП', reply_num: '', reply_date: '',
    addr_post: 'Инспектору СР ДПС', addr_rank: 'Лейтенанту полиции',
    addr_fio: 'Иванову Ивану Ивановичу', appeal: 'Уважаемый',
    greet_fio: 'Иванов Иван Иванович',
    what: 'нарушении п. 3.2, 4.3 ВУ',
    check_start: '2026-10-01', check_end: '2026-10-15', postan_date: '2026-10-01',
    fact: 'yes', est_date: '2026-10-15',
    est_text: 'сотрудником допущено нарушение служебной дисциплины',
    penalty: 'выговоре',
    show_sign: true, show_seal: true, show_copy: true,
    show_poluch: true, poluch_date: '2026-10-15', poluch_time: '00:00' },
  protokol_oprosa: { place: 'г. Арзамас, ул. Пионерская, д. 1',
    date: '2026-05-29', start_time: '10:00', end_time: '10:30',
    fio: 'Иванов Иван Иванович', birth_date: '1 января 1990 года',
    birth_place: 'г. Арзамас Нижегородской области',
    address: 'г. Арзамас, ул. Ленина, д. 10, кв. 5',
    phone: '+7 (900) 000-00-00', citizenship: 'Российская Федерация',
    education: 'Высшее юридическое', family: 'Женат, двое детей',
    work: 'Инспектор ОБ ДПС', military: 'Военнообязанный',
    conviction: 'Не имеется',
    passport: 'Паспорт 22 00 000000, выдан ОВД г. Арзамаса 01.02.2010',
    other: 'Ранее к ответственности не привлекался',
    sig: 'Иванов',
    q1: 'Что вам известно по существу проводимого опроса?',
    a1: 'По существу заданного вопроса поясняю, что мне ничего не известно.',
    q2: 'Известны ли вам факты нарушения служебной дисциплины сотрудниками?',
    a2: 'Нет, о таких фактах мне ничего не известно.',
    q3: '', a3: '', q4: '', a4: '', q5: '', a5: '',
    q6: '', a6: '', q7: '', a7: '', q8: '', a8: '', q9: '', a9: '', qa_count: 9 },
  zayavlenie: { boss_to: 'Начальнику отдела собственной безопасности ГУ МВД по Нижегородской области подполковнику полиции Леонову Д.С.',
    appl_fio: 'Петров Пётр Петрович', appl_birth: '1 января 1990 года',
    appl_address: 'г. Арзамас, ул. Ленина, д. 10, кв. 5',
    appl_phone: '+7 (900) 000-00-00',
    appl_passport: 'Паспорт 22 00 000000, выдан ОВД г. Арзамаса 01.02.2010',
    target: 'инспектора ОБ ДПС лейтенанта полиции Иванова Ивана Ивановича',
    event_date: '2026-10-01', event_place: 'г. Арзамас, ул. Советская, д. 1',
    content: '1 октября 2026 года около 10 часов 00 минут указанный сотрудник остановил мой автомобиль и потребовал передать ему денежные средства за несоставление протокола. Данные обстоятельства могут подтвердить очевидцы.',
    request: 'Прошу провести служебную проверку и привлечь виновных к ответственности',
    brief: 'нарушение служебной дисциплины сотрудником ОБ ДПС',
    appl_sign: 'Петров',
    date: '2026-10-12', num: '0025', accept_time: '12:00',
    show_accept: true, show_seal: true },
};

/* ---------- схемы форм ---------- */
const PROFILE_SECTIONS = [
  { title: 'Сотрудник ОСБ', fields: [
    { k: 'officer_post', label: 'Должность', type: 'text', req: 1 },
    { k: 'officer_rank', label: 'Звание', type: 'datalist', opts: RANKS, req: 1 },
    { k: 'officer_full', label: 'ФИО полностью', type: 'text', req: 1 },
    { k: 'officer_short', label: 'ФИО кратко', type: 'text', req: 1, btn: { label: 'Сформировать из полного', fn: 'short' } },
    { k: 'officer_phone', label: 'Телефон исполнителя', type: 'text' },
  ]},
  { title: 'Начальник ОСБ (согласование)', fields: [
    { k: 'osb_post', label: 'Должность', type: 'text' },
    { k: 'osb_rank', label: 'Звание', type: 'datalist', opts: RANKS },
    { k: 'osb_full', label: 'ФИО полностью', type: 'text' },
    { k: 'osb_sign', label: 'Подпись (текст в штампе)', type: 'text', sub: 'Например «Леонов». Можно оставить текст вместо картинки.' },
  ]},
  { title: 'Начальник ГУ (согласование)', fields: [
    { k: 'gu_post', label: 'Должность', type: 'text' },
    { k: 'gu_rank', label: 'Звание', type: 'datalist', opts: RANKS },
    { k: 'gu_full', label: 'ФИО полностью', type: 'text' },
    { k: 'gu_sign', label: 'Подпись (текст в штампе)', type: 'text' },
  ]},
  { title: 'Своя подпись', custom: 'signature' },
];

function stampFields(prefix, who) {
  const P = prefix;
  return [
    { k: `show_${P}`, label: `Поставить штамп «${who}»`, type: 'check' },
    { k: `${P}_date`, label: 'Дата штампа', type: 'date', showIf: `show_${P}`,
      sub: 'Подпись, ФИО и должность берутся из постоянных данных' },
  ];
}
const VRUCH_FIELDS = [
  { k: 'show_vruch', label: 'Поставить отметку о вручении', type: 'check' },
  { k: 'vruch_date', label: 'Дата вручения', type: 'date', showIf: 'show_vruch' },
  { k: 'vruch_time', label: 'Время вручения', type: 'time', showIf: 'show_vruch',
    sub: 'Получивший подставится из данных сотрудника автоматически' },
];
const DOC_SCHEMAS = {
  trebovanie: [
    { title: 'Документ', fields: [
      { k: 'date', label: 'Дата документа', type: 'date', req: 1 },
      { k: 'city', label: 'Город', type: 'text', req: 1 },
      { k: 'title_tail', label: 'Статья в заголовке', type: 'text', req: 1, sub: 'Подставится: «…предусмотренного …»' },
      { k: 'preamble_article', label: 'Статья в преамбуле', type: 'text', req: 1 },
      { k: 'violator', label: 'Нарушитель (кем, в род. падеже)', type: 'textarea', req: 1 },
    ]},
    { title: 'Требования', fields: [
      { k: 'deadline', label: 'Срок устранения (до)', type: 'date', req: 1 },
      { k: 'demand_article', label: 'Статья правонарушения', type: 'text', req: 1 },
      { k: 'auto', label: 'Автомобиль', type: 'text', req: 1, sub: 'Марка, модель, ГРЗ' },
      { k: 'liability', label: 'Ответственность за невыполнение', type: 'text', req: 1 },
    ]},
    { title: 'Ознакомление', fields: [
      { k: 'acq_post', label: 'Должность + ФИО', type: 'text', req: 1 },
      { k: 'acq_sign', label: 'Подпись (текст/фамилия)', type: 'text' },
      { k: 'acq_short', label: 'ФИО кратко', type: 'text' },
    ]},
    { title: 'Печати и штампы', fields: [
      { k: 'show_bottom_sign', label: 'Поставить свою подпись внизу', type: 'check' },
      ...stampFields('sogl_osb', 'Согласовано ОСБ'),
      ...stampFields('sogl_gu', 'Согласовано ГУ'),
      { k: 'show_vruch', label: 'Поставить отметку о вручении', type: 'check' },
      { k: 'vruch_date', label: 'Дата вручения', type: 'date', showIf: 'show_vruch' },
      { k: 'vruch_time', label: 'Время вручения', type: 'time', showIf: 'show_vruch',
        sub: 'Получивший подставится из данных сотрудника автоматически' },
    ]},
  ],
  proverka: [
    { title: 'В отношении кого проверка', fields: [
      { k: 'subj_post_rod', label: 'Подразделение (род. падеж)', type: 'text', req: 1, sub: 'Например: сотрудника ОБ ДПС ГАИ' },
      { k: 'subj_rank', label: 'Звание', type: 'select', opts: RANK_LIST, req: 1 },
      { k: 'subj_sex', label: 'Пол', type: 'segmented',
        opts: [{ v: 'm', label: 'Муж.' }, { v: 'f', label: 'Жен.' }] },
      { k: 'subj_surname', label: 'Фамилия (именит. падеж)', type: 'text', req: 1 },
      { k: 'subj_initials', label: 'Инициалы', type: 'text', sub: 'Например: А.А.' },
      { k: 'subj_name', label: 'Имя (именит. падеж)', type: 'text', sub: 'Нужно для автозаполнения уведомления' },
      { k: 'subj_patr', label: 'Отчество (именит. падеж)', type: 'text', sub: 'Нужно для автозаполнения уведомления' },
      { k: '_recompose', type: 'action', fn: 'recompose', label: '⟳ Собрать формулировки',
        sub: '«В отношении», «за кем надзор», «кого отстранить/уведомить» соберутся из данных выше. Собранное можно править вручную.' },
    ]},
    { title: 'Документ', fields: [
      { k: 'date', label: 'Дата постановления', type: 'date', req: 1 },
      { k: 'city', label: 'Город', type: 'text', req: 1 },
      { k: 'num', label: 'Номер постановления (= № проверки)', type: 'text', req: 1,
        sub: 'Он же — номер служебной проверки' },
      { k: 'target_title', label: 'В отношении (заголовок)', type: 'textarea', req: 1 },
      { k: 'supervision', label: 'Кем и за кем надзор', type: 'textarea', req: 1 },
      { k: 'violation', label: 'Нарушение (ваш текст)', type: 'textarea', req: 1,
        sub: 'Стандартный абзац про ФЗ «О полиции» добавится в конец автоматически' },
    ]},
    { title: 'Решение', fields: [
      { k: 'suspend', label: 'На время проверки', type: 'segmented',
        opts: [{ v: 'отстранить', label: 'Отстранить' }, { v: 'не отстранять', label: 'Не отстранять' }] },
      { k: 'suspend_target', label: 'Кого (отстранить / не отстранять)', type: 'text', req: 1 },
      { k: 'notify_fio', label: 'Кого уведомить', type: 'text', req: 1 },
    ]},
    { title: 'Печати и штампы', fields: [
      { k: 'show_copy', label: 'Поставить штамп «Копия верна»', type: 'check' },
      { k: 'show_bottom_sign', label: 'Поставить свою подпись внизу', type: 'check' },
      ...stampFields('sogl_osb', 'Согласовано ОСБ'),
      ...stampFields('sogl_gu', 'Согласовано ГУ'),
      { k: 'show_vruch', label: 'Поставить отметку о вручении', type: 'check' },
      { k: 'vruch_date', label: 'Дата вручения', type: 'date', showIf: 'show_vruch' },
      { k: 'vruch_time', label: 'Время вручения', type: 'time', showIf: 'show_vruch',
        sub: 'Получивший подставится из данных сотрудника автоматически' },
    ]},
  ],
  otstranenie: [
    { title: 'Документ', fields: [
      { k: 'date', label: 'Дата приказа', type: 'date', req: 1 },
      { k: 'city', label: 'Город', type: 'text', req: 1 },
      { k: 'num', label: 'Номер приказа', type: 'text', req: 1 },
      { k: 'subject', label: 'Отстраняемый сотрудник', type: 'text', req: 1, sub: 'В винительном падеже: «младшего сержанта полиции Молотова А.А.». Фраза «со стороны …» подставится автоматически.' },
      { k: 'officer_rank_full', label: 'Кем выявлены признаки', type: 'text', req: 1, sub: 'В творительном падеже: «заместителем начальника ОСБ … Щетковым В.А.»' },
      { k: 'ustav_article', label: 'Статья Устава', type: 'text', req: 1 },
      { k: 'check_num', label: '№ служебной проверки', type: 'text', req: 1 },
    ]},
    { title: 'Печати и штампы', fields: [
      { k: 'show_bottom_sign', label: 'Поставить свою подпись внизу', type: 'check' },
      ...stampFields('sogl_osb', 'Согласовано ОСБ'),
      ...stampFields('sogl_gu', 'Согласовано ГУ'),
      { k: 'show_vruch', label: 'Поставить отметку о вручении', type: 'check' },
      { k: 'vruch_date', label: 'Дата вручения', type: 'date', showIf: 'show_vruch' },
      { k: 'vruch_time', label: 'Время вручения', type: 'time', showIf: 'show_vruch',
        sub: 'Получивший подставится из данных сотрудника автоматически' },
    ]},
  ],
  unsp: [
    { title: 'Заполнение из постановления', fields: [
      { k: '_fill_unsp', type: 'action', fn: 'fill_from_proverka', label: '⇪ Заполнить из постановления',
        sub: 'Даты, звание, ФИО и обращение подставятся из «Постановления на СП». Заполненное можно править.' },
    ]},
    { title: 'Получатель', fields: [
      { k: 'addr_post', label: 'Должность (дат. падеж)', type: 'text', req: 1, sub: 'Например: Инспектору СР ДПС' },
      { k: 'addr_rank', label: 'Звание (дат. падеж)', type: 'text', req: 1, sub: 'Например: Лейтенанту полиции' },
      { k: 'addr_fio', label: 'ФИО (дат. падеж)', type: 'text', req: 1, sub: 'Например: Иванову Ивану Ивановичу' },
      { k: 'appeal', label: 'Обращение', type: 'segmented',
        opts: [{ v: 'Уважаемая', label: 'Уважаемая' }, { v: 'Уважаемый', label: 'Уважаемый' }] },
      { k: 'greet_fio', label: 'ФИО для обращения (именит. падеж)', type: 'text', req: 1,
        sub: 'Например: Иванов Иван Иванович' },
    ]},
    { title: 'Документ', fields: [
      { k: 'date', label: 'Дата уведомления', type: 'date', req: 1 },
      { k: 'doc_num', label: 'Номер уведомления', type: 'text', req: 1, sub: 'Например: 0028-СП' },
      { k: 'reply_num', label: 'На № (ответ на входящий)', type: 'text' },
      { k: 'reply_date', label: 'От (дата входящего)', type: 'date' },
    ]},
    { title: 'Проверка', fields: [
      { k: 'points', label: 'Пункты нарушений', type: 'text', req: 1, sub: 'Например: п. 3.2, 4.3 ВУ' },
      { k: 'check_start', label: 'Проверка проводится с', type: 'date', req: 1 },
      { k: 'postan_date', label: 'Постановление от', type: 'date', req: 1 },
    ]},
    { title: 'Подпись и печать', fields: [
      { k: 'show_copy', label: 'Поставить штамп «Копия верна»', type: 'check' },
      { k: 'show_sign', label: 'Поставить подпись', type: 'check',
        sub: 'Должность — из постоянных данных' },
      { k: 'show_seal', label: 'Поставить круглую печать', type: 'check' },
    ]},
    { title: 'Отметка о получении', fields: [
      { k: 'show_poluch', label: 'Поставить отметку о получении', type: 'check' },
      { k: 'poluch_date', label: 'Дата получения', type: 'date', showIf: 'show_poluch' },
      { k: 'poluch_time', label: 'Время получения', type: 'time', showIf: 'show_poluch',
        sub: 'Получивший подставится из данных получателя автоматически' },
    ]},
  ],
  uksp: [
    { title: 'Заполнение из постановления', fields: [
      { k: '_fill_uksp', type: 'action', fn: 'fill_from_proverka', label: '⇪ Заполнить из постановления',
        sub: 'Даты, звание, ФИО и обращение подставятся из «Постановления на СП». Заполненное можно править.' },
    ]},
    { title: 'Получатель', fields: [
      { k: 'addr_post', label: 'Должность (дат. падеж)', type: 'text', req: 1, sub: 'Например: Инспектору СР ДПС' },
      { k: 'addr_rank', label: 'Звание (дат. падеж)', type: 'text', req: 1, sub: 'Например: Лейтенанту полиции' },
      { k: 'addr_fio', label: 'ФИО (дат. падеж)', type: 'text', req: 1, sub: 'Например: Иванову Ивану Ивановичу' },
      { k: 'appeal', label: 'Обращение', type: 'segmented',
        opts: [{ v: 'Уважаемая', label: 'Уважаемая' }, { v: 'Уважаемый', label: 'Уважаемый' }] },
      { k: 'greet_fio', label: 'ФИО для обращения (именит. падеж)', type: 'text', req: 1,
        sub: 'Например: Иванов Иван Иванович' },
    ]},
    { title: 'Документ', fields: [
      { k: 'date', label: 'Дата уведомления', type: 'date', req: 1 },
      { k: 'doc_num', label: 'Номер уведомления', type: 'text', req: 1, sub: 'Например: 0031-СП' },
      { k: 'reply_num', label: 'На № (ответ на входящий)', type: 'text' },
      { k: 'reply_date', label: 'От (дата входящего)', type: 'date' },
    ]},
    { title: 'Проверка', fields: [
      { k: 'what', label: 'Нарушение выразилось в', type: 'text', req: 1, sub: 'Например: нарушении п. 3.2, 4.3 ВУ' },
      { k: 'check_start', label: 'Проверка проводилась с', type: 'date', req: 1 },
      { k: 'check_end', label: 'Проверка проводилась по', type: 'date', req: 1 },
      { k: 'postan_date', label: 'Постановление от', type: 'date', req: 1 },
      { k: 'fact', label: 'Факт нарушения', type: 'segmented',
        opts: [{ v: 'yes', label: 'Подтвердился' }, { v: 'no', label: 'Не подтвердился' }] },
      { k: 'est_date', label: 'Установлено (дата)', type: 'date', req: 1 },
      { k: 'est_text', label: 'Установлено (что)', type: 'textarea', req: 1 },
      { k: 'penalty', label: 'Взыскание (в предл. падеже)', type: 'text',
        sub: 'Например: выговоре. Пустое поле — пункт 2 не печатается' },
    ]},
    { title: 'Подпись и печать', fields: [
      { k: 'show_copy', label: 'Поставить штамп «Копия верна»', type: 'check' },
      { k: 'show_sign', label: 'Поставить подпись', type: 'check',
        sub: 'Должность и звание — из постоянных данных' },
      { k: 'show_seal', label: 'Поставить круглую печать', type: 'check' },
    ]},
    { title: 'Отметка о получении', fields: [
      { k: 'show_poluch', label: 'Поставить отметку о получении', type: 'check' },
      { k: 'poluch_date', label: 'Дата получения', type: 'date', showIf: 'show_poluch' },
      { k: 'poluch_time', label: 'Время получения', type: 'time', showIf: 'show_poluch',
        sub: 'Получивший подставится из данных получателя автоматически' },
    ]},
  ],
  protokol_oprosa: [
    { title: 'Документ', fields: [
      { k: 'place', label: 'Место составления', type: 'text', req: 1 },
      { k: 'date', label: 'Дата протокола', type: 'date', req: 1 },
      { k: 'start_time', label: 'Опрос начат в', type: 'time', req: 1 },
      { k: 'end_time', label: 'Опрос окончен в', type: 'time', req: 1 },
    ]},
    { title: 'Опрашиваемый (п. 1–12)', fields: [
      { k: 'fio', label: '1. Фамилия, имя, отчество', type: 'text', req: 1 },
      { k: 'birth_date', label: '2. Дата рождения', type: 'text' },
      { k: 'birth_place', label: '3. Место рождения', type: 'text' },
      { k: 'address', label: '4. Место жительства и (или) регистрации', type: 'text' },
      { k: 'phone', label: '5. Номер контактного телефона', type: 'text' },
      { k: 'citizenship', label: '6. Гражданство', type: 'text' },
      { k: 'education', label: '7. Образование', type: 'text' },
      { k: 'family', label: '8. Семейное положение, состав семьи', type: 'text' },
      { k: 'work', label: '9. Место работы или учёбы', type: 'text' },
      { k: 'military', label: '10. Отношение к воинской обязанности', type: 'text' },
      { k: 'conviction', label: '11. Наличие судимости', type: 'text',
        sub: 'Если судим — по какой статье УК РФ' },
      { k: 'passport', label: '11. Паспорт или иной документ', type: 'textarea' },
      { k: 'other', label: '12. Иные данные о личности', type: 'textarea' },
      { k: 'sig', label: 'Подпись опрашиваемого (текст)', type: 'text',
        sub: 'Печатается на всех трёх линиях подписи; пусто — линии для подписи от руки' },
    ]},
    { title: 'Вопросы и ответы', fields: [
      { k: 'qa_count', label: 'Количество вопросов в документе', type: 'number', min: 1, max: 9,
        sub: 'Лишние пары не печатаются, введённые данные сохраняются' },
      { k: 'q1', label: 'Вопрос 1', type: 'text',
        sub: 'Пустые вопросы/ответы напечатаются линиями для заполнения от руки' },
      { k: 'a1', label: 'Ответ 1', type: 'textarea' },
      { k: 'q2', label: 'Вопрос 2', type: 'text' },
      { k: 'a2', label: 'Ответ 2', type: 'textarea' },
      { k: 'q3', label: 'Вопрос 3', type: 'text' },
      { k: 'a3', label: 'Ответ 3', type: 'textarea' },
      { k: 'q4', label: 'Вопрос 4', type: 'text' },
      { k: 'a4', label: 'Ответ 4', type: 'textarea' },
      { k: 'q5', label: 'Вопрос 5', type: 'text' },
      { k: 'a5', label: 'Ответ 5', type: 'textarea' },
      { k: 'q6', label: 'Вопрос 6', type: 'text' },
      { k: 'a6', label: 'Ответ 6', type: 'textarea' },
      { k: 'q7', label: 'Вопрос 7', type: 'text' },
      { k: 'a7', label: 'Ответ 7', type: 'textarea' },
      { k: 'q8', label: 'Вопрос 8', type: 'text' },
      { k: 'a8', label: 'Ответ 8', type: 'textarea' },
      { k: 'q9', label: 'Вопрос 9', type: 'text' },
      { k: 'a9', label: 'Ответ 9', type: 'textarea' },
    ]},
  ],
  zayavlenie: [
    { title: 'Кому и от кого', fields: [
      { k: 'boss_to', label: 'Кому адресовано', type: 'textarea', req: 1,
        sub: 'Например: Начальнику ОСБ ГУ МВД … Леонову Д.С.' },
      { k: 'appl_fio', label: 'ФИО заявителя (именит. падеж)', type: 'text', req: 1,
        sub: 'Например: Петров Пётр Петрович' },
      { k: 'appl_birth', label: 'Дата рождения', type: 'text', sub: 'Например: 1 января 1990 года' },
      { k: 'appl_address', label: 'Адрес заявителя', type: 'text' },
      { k: 'appl_phone', label: 'Телефон заявителя', type: 'text' },
      { k: 'appl_passport', label: 'Паспортные данные', type: 'text' },
    ]},
    { title: 'Суть заявления', fields: [
      { k: 'target', label: 'В отношении кого (сотрудник)', type: 'textarea', req: 1,
        sub: 'Например: инспектора ОБ ДПС лейтенанта полиции Иванова И.И.' },
      { k: 'event_date', label: 'Дата события', type: 'date' },
      { k: 'event_place', label: 'Место события', type: 'text' },
      { k: 'content', label: 'Обстоятельства (что произошло)', type: 'textarea', req: 1 },
      { k: 'request', label: 'Просьба', type: 'textarea',
        sub: 'Например: провести служебную проверку и привлечь к ответственности' },
      { k: 'brief', label: 'Краткое содержание для корешка', type: 'text',
        sub: 'Пусто — в корешок пойдёт начало сути заявления' },
      { k: 'appl_sign', label: 'Подпись заявителя (фамилия текстом)', type: 'text' },
    ]},
    { title: 'Регистрация и корешок', fields: [
      { k: 'date', label: 'Дата заявления', type: 'date', req: 1 },
      { k: 'num', label: 'Номер (один на заявление и корешок)', type: 'text', req: 1,
        sub: 'Например: 0025. В заявлении — КУСП №0025, в талоне — №0025/ТКТУ' },
      { k: 'accept_time', label: 'Время приёма', type: 'time',
        sub: 'Корешок-талон соберётся автоматически на 2-й странице из этих данных' },
    ]},
    { title: 'Подпись и печать', fields: [
      { k: 'show_accept', label: 'Подпись принявшего (из постоянных данных)', type: 'check' },
      { k: 'show_seal', label: 'Поставить круглую печать', type: 'check' },
    ]},
  ],
};

/* ---------- состояние ---------- */
const state = {
  template: (() => { try { return localStorage.getItem(LS_TEMPLATE) || 'trebovanie'; } catch { return 'trebovanie'; } })(),
  profile: loadLS(LS_PROFILE, structuredClone(DEFAULT_PROFILE)),
  docs: {
    trebovanie: loadLS(LS_DRAFT('trebovanie'), structuredClone(DEFAULT_DOCS.trebovanie)),
    proverka: loadLS(LS_DRAFT('proverka'), structuredClone(DEFAULT_DOCS.proverka)),
    otstranenie: loadLS(LS_DRAFT('otstranenie'), structuredClone(DEFAULT_DOCS.otstranenie)),
    unsp: loadLS(LS_DRAFT('unsp'), structuredClone(DEFAULT_DOCS.unsp)),
    uksp: loadLS(LS_DRAFT('uksp'), structuredClone(DEFAULT_DOCS.uksp)),
    protokol_oprosa: loadLS(LS_DRAFT('protokol_oprosa'), structuredClone(DEFAULT_DOCS.protokol_oprosa)),
    zayavlenie: loadLS(LS_DRAFT('zayavlenie'), structuredClone(DEFAULT_DOCS.zayavlenie)),
  },
  cases: [],
  active: { mode: 'free', caseId: null, docId: null },
};
if (!state.docs[state.template]) state.template = 'trebovanie';
function loadLS(key, fb) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fb;
    const o = JSON.parse(raw);
    return { ...structuredClone(fb), ...o };
  } catch { return fb; }
}
/* Дела: загрузка/сохранение отдельно, чтобы не ломать старые черновики */
function loadCases() {
  try {
    const raw = localStorage.getItem(LS_CASES);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) state.cases = arr.filter(c => c && c.id && Array.isArray(c.docs));
    }
  } catch {}
  try {
    const raw = localStorage.getItem(LS_ACTIVE);
    if (raw) {
      const a = JSON.parse(raw);
      if (a && (a.mode === 'free' || a.mode === 'case')) state.active = a;
    }
  } catch {}
  // чистка битых ссылок
  if (state.active.mode === 'case') {
    const c = state.cases.find(x => x.id === state.active.caseId);
    if (!c) state.active = { mode: 'free', caseId: null, docId: null };
    else if (state.active.docId && !c.docs.some(d => d.docId === state.active.docId)) {
      state.active.docId = c.docs[0] ? c.docs[0].docId : null;
    }
  }
}
function uid(prefix) {
  return prefix + '_' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
}
function getActiveCase() {
  if (state.active.mode !== 'case') return null;
  return state.cases.find(c => c.id === state.active.caseId) || null;
}
function getActiveDocRef() {
  const c = getActiveCase();
  if (!c) return null;
  return c.docs.find(d => d.docId === state.active.docId) || c.docs[0] || null;
}
/* Активный шаблон и данные: в деле — из документа дела, вне дел — как раньше */
function workTpl() {
  if (state.active.mode === 'case') {
    const r = getActiveDocRef();
    return r ? r.tpl : 'trebovanie';
  }
  return state.template;
}
function workData() {
  if (state.active.mode === 'case') {
    const r = getActiveDocRef();
    return r ? r.data : null;
  }
  return state.docs[state.template];
}
function saveLS() {
  try {
    localStorage.setItem(LS_PROFILE, JSON.stringify(state.profile));
    localStorage.setItem(LS_TEMPLATE, state.template);
    localStorage.setItem(LS_DRAFT(state.template), JSON.stringify(state.docs[state.template]));
    localStorage.setItem(LS_CASES, JSON.stringify(state.cases));
    localStorage.setItem(LS_ACTIVE, JSON.stringify(state.active));
  } catch (e) { setStatus('localStorage переполнен: уменьшите картинку подписи', true); }
}
function touchCase() {
  const c = getActiveCase();
  if (c) c.updatedAt = Date.now();
}

/* ---------- утилиты ---------- */
const $ = s => document.querySelector(s);
function debounce(fn, ms) { let h; return (...a) => { clearTimeout(h); h = setTimeout(() => fn(...a), ms); }; }
function setStatus(msg, isErr = false, ok = false) {
  const el = $('#status');
  el.textContent = msg;
  el.classList.toggle('err', !!isErr);
  el.classList.toggle('ok', !!ok);
}
function showError(msg) { const b = $('#errorBox'); b.hidden = !msg; b.textContent = msg || ''; }
function escTyp(s) {
  return '"' + String(s ?? '').replace(/\s+/g, ' ').trim().replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}
function isoParts(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return { day: '«__»', num: '__', gen: '________', year: '____' };
  return { day: String(+m[3]), num: m[2], gen: MONTHS_GEN[+m[2] - 1], year: m[1] };
}
function deadlineText(iso) {
  const p = isoParts(iso);
  return `${p.day} ${p.gen} ${p.year} года`;
}
function dotsDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return m ? `${m[3]}.${m[2]}.${m[1]}` : '';
}
function toShortFio(full) {
  const parts = String(full || '').trim().split(/\s+/);
  if (parts.length < 3) return full;
  return `${parts[1][0]}.${parts[2][0]}. ${parts[0]}`;
}
function b64ToBytes(b64) {
  const bin = atob(b64.split(',').pop());
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u;
}
function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
}

/* ---------- построение форм ---------- */
function fieldNode(sec, f, values, onChange, scope) {
  if (f.type === 'check') {
    const wrap = document.createElement('div');
    const lab = document.createElement('label');
    lab.className = 'check';
    const inp = document.createElement('input');
    inp.type = 'checkbox';
    inp.checked = !!values[f.k];
    inp.onchange = () => { values[f.k] = inp.checked; onChange(f.k); };
    lab.append(inp, document.createTextNode(f.label));
    wrap.append(lab);
    return wrap;
  }
  const wrap = document.createElement('div');
  wrap.className = 'field' + (f.showIf ? ' subfield' : '');
  if (f.showIf) {
    wrap.dataset.showif = f.showIf;
    if (!values[f.showIf]) wrap.classList.add('hidden');
  }
  const lab = document.createElement('label');
  lab.innerHTML = `${f.label}${f.req ? ' <span class="req">*</span>' : ''}${f.sub ? ` <span class="sub">— ${f.sub}</span>` : ''}`;
  wrap.append(lab);

  if (f.type === 'segmented') {
    const seg = document.createElement('div');
    seg.className = 'segmented';
    seg.dataset.fk = f.k;
    for (const o of f.opts) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = o.label;
      b.dataset.v = o.v;
      b.setAttribute('aria-pressed', String(values[f.k] === o.v));
      b.onclick = () => {
        values[f.k] = o.v;
        seg.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        onChange(f.k);
      };
      seg.append(b);
    }
    wrap.append(seg);
    return wrap;
  }

  if (f.type === 'action') {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'mini';
    b.style.fontSize = '14px';
    b.style.padding = '8px 14px';
    b.dataset.action = f.fn;
    b.textContent = f.label;
    wrap.append(b);
    return wrap;
  }

  if (f.type === 'select') {
    const sel = document.createElement('select');
    sel.dataset.fk = f.k;
    const cur = values[f.k];
    const opts = f.opts.includes(cur) ? f.opts : [...f.opts, cur];
    for (const o of opts) {
      const op = document.createElement('option');
      op.value = o; op.textContent = o;
      sel.append(op);
    }
    sel.value = cur;
    sel.onchange = () => { values[f.k] = sel.value; markReq(sel, f); onChange(f.k); };
    if (f.req && !String(cur ?? '').trim()) sel.classList.add('invalid');
    wrap.append(sel);
    return wrap;
  }

  let inp;
  if (f.type === 'textarea') {
    inp = document.createElement('textarea');
    inp.dataset.fk = f.k;
    inp.value = values[f.k] ?? '';
    inp.oninput = () => { values[f.k] = inp.value; markReq(inp, f); onChange(f.k); };
  } else if (f.type === 'datalist') {
    inp = document.createElement('input');
    inp.type = 'text';
    inp.setAttribute('list', `dl-${scope}-${f.k}`);
    inp.value = values[f.k] ?? '';
    const dl = document.createElement('datalist');
    dl.id = `dl-${scope}-${f.k}`;
    for (const o of f.opts) { const op = document.createElement('option'); op.value = o; dl.append(op); }
    wrap.append(dl);
    inp.oninput = () => { values[f.k] = inp.value; markReq(inp, f); onChange(f.k); };
  } else {
    inp = document.createElement('input');
    inp.dataset.fk = f.k;
    inp.type = f.type === 'date' ? 'date' : f.type === 'time' ? 'time' : f.type === 'number' ? 'number' : 'text';
    if (f.min != null) inp.min = f.min;
    if (f.max != null) inp.max = f.max;
    inp.value = values[f.k] ?? '';
    inp.oninput = () => { values[f.k] = inp.type === 'number' ? +inp.value : inp.value; markReq(inp, f); onChange(f.k); };
  }
  if (f.req && !String(values[f.k] ?? '').trim()) inp.classList.add('invalid');
  wrap.append(inp);

  if (f.btn) {
    const row = document.createElement('div');
    row.className = 'row';
    row.style.marginTop = '4px';
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'mini'; b.textContent = f.btn.label;
    b.onclick = () => {
      if (f.btn.fn === 'short') {
        const full = scope === 'profile' ? state.profile.officer_full : values.officer_full;
        values[f.k] = toShortFio(full);
        inp.value = values[f.k];
        onChange(f.k);
      }
    };
    row.append(b);
    wrap.append(row);
  }
  return wrap;
}
function markReq(inp, f) {
  if (f.req) inp.classList.toggle('invalid', !String(inp.value ?? '').trim());
}
/* Склонение фамилии: род. / твор. / дат. падеж. Неизвестные окончания — без изменений. */
function declSurname(s, sex = 'm') {
  s = String(s || '').trim();
  const none = { gen: s, tvor: s, dat: s };
  if (!s) return none;
  const low = s.toLowerCase();
  const rep = (re, gen, tvor, dat) => {
    if (!re.test(low)) return null;
    return { gen: s.replace(re, gen), tvor: s.replace(re, tvor), dat: s.replace(re, dat) };
  };
  let r;
  if (sex === 'f') {
    r = rep(/(ов|ев|ёв|ин|ын)а$/, '$1ой', '$1ой', '$1ой')
      || rep(/(ская|цкая|ая|яя)$/, 'ой', 'ой', 'ой')
      || rep(/([гкхжчшщ])а$/, '$1и', '$1ой', '$1е')
      || rep(/([а-я])а$/, '$1ы', '$1ой', '$1е');
    return r || none;
  }
  r = rep(/(ов|ев|ёв|ин|ын)$/, '$1а', '$1ым', '$1у')
    || rep(/(ский|цкий)$/, 'ого', 'им', 'ому')
    || rep(/(ой|ый|ий)$/, 'ого', 'ым', 'ому')
    || rep(/ь$/, 'я', 'ем', 'ю')
    || rep(/([бвгджзклмнпрстфхцчшщ])$/, '$1а', '$1ом', '$1у')
    || rep(/([гкхжчшщ])а$/, '$1и', '$1ой', '$1е')
    || rep(/([а-я])а$/, '$1ы', '$1ой', '$1е');
  return r || none;
}
/* Имя в дательном падеже (для уведомления) */
function declFirstDat(name, sex = 'm') {
  const s = String(name || '').trim();
  if (!s) return s;
  const low = s.toLowerCase();
  if (sex === 'f') {
    if (/я$/.test(low)) return s.slice(0, -1) + 'и';
    if (/ь$/.test(low)) return s.slice(0, -1) + 'и';
    if (/а$/.test(low)) return s.slice(0, -1) + 'е';
    return s;
  }
  if (/й$/.test(low)) return s.slice(0, -1) + 'ю';
  if (/ь$/.test(low)) return s.slice(0, -1) + 'ю';
  if (/[ая]$/.test(low)) return s.slice(0, -1) + 'е';
  if (/[бвгджзклмнпрстфхцчшщ]$/.test(low)) return s + 'у';
  return s;
}
/* Отчество в дательном падеже */
function declPatrDat(p, sex = 'm') {
  const s = String(p || '').trim();
  if (!s) return s;
  const low = s.toLowerCase();
  if (/на$/.test(low)) return s.slice(0, -1) + 'е';
  if (/[а-я]ч$/.test(low)) return s + 'у';
  return s;
}
function cleanWs(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }
/* Обратная таблица: родительный падеж звания -> именительный */
const RANK_NOM_BY_GEN = {};
for (const [nom, forms] of Object.entries(RANK_FORMS)) RANK_NOM_BY_GEN[forms[0]] = nom;
const RANK_GENS = Object.keys(RANK_NOM_BY_GEN).sort((a, b) => b.length - a.length);
/* Фамилия из родительного в именительный (предполагается муж.; жен. и редкие случаи — вручную) */
function nomSurname(t) {
  t = String(t || '').trim();
  let m;
  m = t.match(/^(.*(?:ов|ев|ёв|ин|ын))а$/); if (m) return m[1];
  m = t.match(/^(.*[сц])кого$/); if (m) return m[1] + 'кий';
  m = t.match(/^(.*)ого$/); if (m) return m[1] + 'ой';
  m = t.match(/^(.*)ы$/); if (m) return m[1] + 'а';
  m = t.match(/^(.*)и$/); if (m) return m[1] + 'а';
  m = t.match(/^(.*)я$/); if (m) return m[1] + 'ь';
  return t;
}
/* Фамилия из фразы (последнее слово из букв, без инициалов) */
function genSurname(phrase) {
  const toks = cleanWs(phrase).split(' ');
  for (let i = toks.length - 1; i >= 0; i--) {
    const t = toks[i].replace(/[.,]$/g, '');
    if (/^[А-ЯЁ][а-яё]+$/.test(t)) return t;
  }
  return '';
}
/* Фраза «кого отстранить» (род. падеж) -> именительный падеж для отметки */
function nominativePhrase(phrase) {
  let s = cleanWs(phrase);
  for (const g of RANK_GENS) {
    if (s.includes(g)) { s = s.replace(g, RANK_NOM_BY_GEN[g]); break; }
  }
  const toks = s.split(' ');
  for (let i = toks.length - 1; i >= 0; i--) {
    const t = toks[i].replace(/[.,]$/g, '');
    if (/^[А-ЯЁ][а-яё]+$/.test(t)) { toks[i] = nomSurname(t); break; }
  }
  return toks.join(' ');
}
/* Сборка формулировок проверки из данных о сотруднике + профиля */
function composeProverka(p, d) {
  const [rGen, rTvor] = RANK_FORMS[d.subj_rank] || [d.subj_rank, d.subj_rank];
  const sn = declSurname(d.subj_surname, d.subj_sex);
  const ini = cleanWs(d.subj_initials);
  const fio = f => cleanWs(`${f} ${ini}`);
  return {
    target_title: cleanWs(`${d.subj_post_rod} ${rGen} ${fio(sn.gen)}`),
    supervision: cleanWs(`${p.officer_post}, ${p.officer_rank} ${p.officer_full}, в ходе проведения надзорной деятельности за ${rTvor} ${fio(sn.tvor)}`),
    suspend_target: cleanWs(`${rGen} ${fio(sn.gen)}`),
    notify_fio: cleanWs(`${rGen} ${fio(sn.gen)}`),
  };
}
function refreshSubforms(root, values) {
  root.querySelectorAll('[data-showif]').forEach(el => {
    el.classList.toggle('hidden', !values[el.dataset.showif]);
  });
}

function signatureNode(values, onChange) {
  const wrap = document.createElement('div');
  wrap.innerHTML = `
    <div class="field"><label>Файл подписи <span class="sub">— PNG с прозрачным фоном, иначе включите чистку фона</span></label>
      <div class="sign-preview" id="signPrev"></div>
      <div class="row" style="margin-top:6px">
        <input type="file" id="signFile" accept="image/*">
      </div>
      <div class="row" style="margin-top:6px">
        <button type="button" class="mini" id="signStd">Стандартная</button>
        <button type="button" class="mini" id="signDel">Убрать подпись</button>
      </div>
    </div>
    <div class="field"><label><input type="checkbox" id="signClean" style="width:auto"> убрать белый фон при загрузке</label></div>
    <div class="field"><label>Ширина подписи в документе, мм</label>
      <input type="number" id="signWidth" min="10" max="60" step="1"></div>`;
  const prev = wrap.querySelector('#signPrev');
  const draw = () => {
    prev.innerHTML = '';
    const cur = values.signature;
    const src = cur === 'default' ? dataUrl(window.OSB_SIGN_DEFAULT_B64, 'image/png')
      : cur || '';
    if (src) { const img = document.createElement('img'); img.src = src; prev.append(img); }
    else prev.innerHTML = '<span style="color:#999">нет подписи</span>';
  };
  draw();
  const cleanBox = wrap.querySelector('#signClean');
  cleanBox.checked = values.sign_clean !== false;
  cleanBox.onchange = () => { values.sign_clean = cleanBox.checked; onChange('signature'); };
  const wInp = wrap.querySelector('#signWidth');
  wInp.value = values.sign_width ?? 25;
  wInp.oninput = () => { values.sign_width = +wInp.value || 25; onChange('signature'); };
  wrap.querySelector('#signStd').onclick = () => { values.signature = 'default'; draw(); onChange('signature'); };
  wrap.querySelector('#signDel').onclick = () => { values.signature = ''; draw(); onChange('signature'); };
  wrap.querySelector('#signFile').onchange = ev => {
    const file = ev.target.files[0];
    if (!file) return;
    processSignature(file, values.sign_clean !== false, 900).then(url => {
      values.signature = url;
      draw();
      onChange('signature');
    }).catch(() => setStatus('Не удалось прочитать файл подписи', true));
    ev.target.value = '';
  };
  return wrap;
}
function dataUrl(b64, mime) { return `data:${mime};base64,${b64}`; }

function processSignature(file, cleanWhite, maxSide) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      let { width: w, height: h } = img;
      const k = Math.min(1, maxSide / Math.max(w, h));
      w = Math.round(w * k); h = Math.round(h * k);
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      if (cleanWhite) {
        const d = ctx.getImageData(0, 0, w, h);
        const p = d.data;
        for (let i = 0; i < p.length; i += 4) {
          if (p[i] > 242 && p[i + 1] > 242 && p[i + 2] > 242) p[i + 3] = 0;
        }
        ctx.putImageData(d, 0, 0);
      }
      res(c.toDataURL('image/png'));
    };
    img.onerror = rej;
    img.src = URL.createObjectURL(file);
  });
}

/* Автозаполнение уведомления из постановления.
   Вне дел — из глобальной вкладки «Проверка», в деле — строго из Проверки того же дела. */
function fillUnspFromProverka(p, d) {
  let P = state.docs.proverka || {};
  if (state.active.mode === 'case') {
    const c = getActiveCase();
    const prov = c ? c.docs.find(x => x.tpl === 'proverka') : null;
    if (!prov) return { patch: {}, msg: 'В этом деле нет Постановления на СП — добавьте его первым документом' };
    P = prov.data || {};
  }
  const rankDat = ((RANK_FORMS[P.subj_rank] || [])[2]) || P.subj_rank || '';
  const sn = declSurname(P.subj_surname, P.subj_sex);
  const hasName = cleanWs(P.subj_name) && cleanWs(P.subj_patr);
  const patch = {};
  if (P.date) { patch.check_start = P.date; patch.postan_date = P.date; }
  if (P.subj_post_rod) patch.addr_post = P.subj_post_rod;
  if (rankDat) patch.addr_rank = rankDat;
  if (hasName) {
    patch.addr_fio = cleanWs(`${sn.dat} ${declFirstDat(P.subj_name, P.subj_sex)} ${declPatrDat(P.subj_patr, P.subj_sex)}`);
    patch.greet_fio = cleanWs(`${P.subj_surname} ${P.subj_name} ${P.subj_patr}`);
  } else if (!cleanWs(d.addr_fio) && sn.dat) {
    patch.addr_fio = sn.dat;
  }
  patch.appeal = P.subj_sex === 'f' ? 'Уважаемая' : 'Уважаемый';
  return { patch, msg: 'Уведомление заполнено из постановления' };
}
const DOC_ACTIONS = {
  recompose: {
    run: (p, d) => ({ patch: composeProverka(p, d), msg: 'Формулировки собраны' }),
  },
  fill_from_proverka: {
    run: (p, d) => fillUnspFromProverka(p, d),
  },
};
function renderProfile() {
  const root = $('#profileForm');
  root.innerHTML = '';
  const onChange = () => { saveLS(); scheduleCompile(); };
  for (const sec of PROFILE_SECTIONS) {
    const h = document.createElement('h3');
    h.textContent = sec.title;
    root.append(h);
    if (sec.custom === 'signature') {
      root.append(signatureNode(state.profile, onChange));
      continue;
    }
    for (const f of sec.fields) root.append(fieldNode(sec, f, state.profile, onChange, 'profile'));
  }
}
function renderDoc() {
  const root = $('#docForm');
  root.innerHTML = '';
  const tpl = workTpl();
  const values = workData();
  if (!values || !DOC_SCHEMAS[tpl]) {
    root.innerHTML = '<div class="card">В этом деле пока нет документов — нажмите «+ Документ».</div>';
    return;
  }
  const ref = getActiveDocRef();
  const title = (state.active.mode === 'case' && ref)
    ? `${TPL_NAMES[tpl]} · ${ref.name}` : (TPL_NAMES[tpl] || tpl);
  const head = document.createElement('div');
  head.className = 'card dochead';
  head.innerHTML = '';
  const ht = document.createElement('h3');
  ht.textContent = title;
  ht.style.marginTop = '0';
  head.append(ht);
  if (state.active.mode === 'case' && ref) {
    const row = document.createElement('div');
    row.className = 'row';
    const nm = document.createElement('input');
    nm.type = 'text'; nm.value = ref.name || '';
    nm.title = 'Название документа в деле';
    nm.style.flex = '1';
    nm.oninput = () => { ref.name = nm.value.slice(0, 120); touchCase(); saveLS(); syncContextUI(); };
    row.append(nm);
    head.append(row);
  }
  root.append(head);
  const onChange = () => { touchCase(); saveLS(); refreshSubforms(root, values); scheduleCompile(); };
  for (const sec of DOC_SCHEMAS[tpl]) {
    const card = document.createElement('div');
    card.className = 'card';
    const h = document.createElement('h3');
    h.textContent = sec.title;
    h.style.marginTop = '0';
    card.append(h);
    for (const f of sec.fields) card.append(fieldNode(sec, f, values, onChange, 'doc'));
    root.append(card);
  }
  root.querySelectorAll('[data-action]').forEach(b => {
    b.onclick = () => {
      const act = DOC_ACTIONS[b.dataset.action];
      if (!act) return;
      const { patch, msg } = act.run(state.profile, values);
      Object.assign(values, patch);
      for (const [k, v] of Object.entries(patch)) {
        const inp = root.querySelector(`[data-fk="${k}"]`);
        if (!inp) continue;
        if (inp.classList.contains('segmented')) {
          inp.querySelectorAll('button').forEach(x =>
            x.setAttribute('aria-pressed', String(x.dataset.v === String(v))));
        } else if (inp.tagName === 'SELECT') {
          if (![...inp.options].some(o => o.value === v)) {
            const op = document.createElement('option');
            op.value = v; op.textContent = v;
            inp.append(op);
          }
          inp.value = v;
        } else inp.value = v;
        inp.classList.remove('invalid');
      }
      saveLS();
      scheduleCompile();
      setStatus(msg, false, true);
    };
  });
}

/* ---------- DATA для Typst ---------- */
function signBytes() {
  const s = state.profile.signature;
  if (s === 'default' && window.OSB_SIGN_DEFAULT_B64) return b64ToBytes(window.OSB_SIGN_DEFAULT_B64);
  if (s && s.startsWith('data:')) return b64ToBytes(s);
  return null;
}
function buildData() {
  const t = workTpl();
  const p = state.profile;
  const d = workData() || {};
  const D = {};
  const dp = isoParts(d.date);
  D['v-day'] = dp.day; D['v-month-gen'] = dp.gen; D['v-month-num'] = dp.num; D['v-year'] = dp.year;
  D['v-city'] = d.city || '';
  const put = (name, iso) => {
    const q = isoParts(iso);
    D[`v-${name}-day`] = q.day; D[`v-${name}-month-gen`] = q.gen; D[`v-${name}-year`] = q.year;
  };
  D['v-officer-post'] = p.officer_post || ''; D['v-officer-rank'] = p.officer_rank || '';
  D['v-officer-full'] = p.officer_full || ''; D['v-officer-short'] = p.officer_short || '';
  D['v-officer-phone'] = p.officer_phone || '';
  D['v-sogl-osb-post'] = p.osb_post || ''; D['v-sogl-osb-rank'] = p.osb_rank || '';
  D['v-sogl-osb-sign'] = p.osb_sign || ''; D['v-sogl-osb-fio'] = p.osb_full || '';
  D['v-sogl-gu-post'] = p.gu_post || ''; D['v-sogl-gu-rank'] = p.gu_rank || '';
  D['v-sogl-gu-sign'] = p.gu_sign || ''; D['v-sogl-gu-fio'] = p.gu_full || '';
  D['v-vruch-time'] = d.vruch_time || '';
  D['v-has-gerb'] = !!window.OSB_GERB_B64;
  D['v-has-sign'] = !!signBytes();
  D['v-sign-width'] = `${+p.sign_width || 25}mm`;
  D['v-show-bottom-sign'] = !!d.show_bottom_sign;
  D['v-show-copy'] = !!d.show_copy;
  D['v-show-sogl-osb'] = !!d.show_sogl_osb;
  D['v-show-sogl-gu'] = !!d.show_sogl_gu;
  D['v-show-vruch'] = !!d.show_vruch;
  if (t === 'trebovanie') {
    D['v-title-tail'] = d.title_tail; D['v-preamble-article'] = d.preamble_article; D['v-violator'] = d.violator;
    D['v-deadline-text'] = deadlineText(d.deadline); D['v-demand-article'] = d.demand_article;
    D['v-auto'] = d.auto; D['v-liability'] = d.liability;
    D['v-acq-post'] = d.acq_post; D['v-acq-sign'] = d.acq_sign; D['v-acq-short'] = d.acq_short;
    D['v-vruch-sign'] = d.acq_sign || ''; D['v-vruch-fio'] = d.acq_short || d.acq_post || '';
  } else if (t === 'proverka') {
    D['v-num'] = d.num; D['v-target-title'] = d.target_title; D['v-supervision'] = d.supervision;
    const uv = cleanWs(d.violation);
    D['v-violation'] = uv ? uv + (/[.!?…:;]$/.test(uv) ? ' ' : '. ') + VIOLATION_TAIL : VIOLATION_TAIL;
    D['v-check-num'] = d.num;
    D['v-suspend-word'] = d.suspend; D['v-suspend-target'] = d.suspend_target; D['v-notify-fio'] = d.notify_fio;
    const hasNP = cleanWs(d.subj_name) && cleanWs(d.subj_patr);
    D['v-vruch-sign'] = d.subj_surname || '';
    D['v-vruch-fio'] = hasNP
      ? cleanWs(`${d.subj_surname} ${d.subj_name} ${d.subj_patr}`)
      : cleanWs(`${d.subj_rank} ${d.subj_surname} ${d.subj_initials}`);
  } else if (t === 'otstranenie') {
    D['v-num'] = d.num; D['v-subject'] = d.subject;
    D['v-subject-gen'] = 'со стороны ' + (d.subject || '');
    D['v-officer-rank-full'] = d.officer_rank_full;
    D['v-ustav-article'] = d.ustav_article; D['v-check-num'] = d.check_num;
    D['v-vruch-sign'] = nomSurname(genSurname(d.subject)); D['v-vruch-fio'] = nominativePhrase(d.subject);
  } else if (t === 'unsp') {
    D['v-date-dots'] = dotsDate(d.date); D['v-doc-num'] = d.doc_num || '';
    D['v-show-reply'] = !!(d.reply_num || d.reply_date);
    D['v-reply-num'] = d.reply_num || ''; D['v-reply-date'] = d.reply_date ? dotsDate(d.reply_date) : '';
    D['v-addr-post'] = d.addr_post || ''; D['v-addr-rank'] = d.addr_rank || '';
    D['v-addr-fio'] = d.addr_fio || ''; D['v-appeal'] = d.appeal || 'Уважаемый';
    D['v-greet-fio'] = d.greet_fio || '';
    D['v-points'] = d.points || '';
    D['v-check-start'] = dotsDate(d.check_start); D['v-postan-date'] = dotsDate(d.postan_date);
    D['v-sign-post'] = p.officer_post || ''; D['v-sign-rank'] = p.officer_rank || '';
    D['v-officer-phone'] = p.officer_phone || '';
    D['v-seal-l1'] = 'ОТДЕЛ'; D['v-seal-l2'] = 'СОБСТВЕННОЙ';
    D['v-seal-l3'] = 'БЕЗОПАСНОСТИ'; D['v-seal-l4'] = '* ГУ МВД *';
    D['v-show-sign'] = !!d.show_sign; D['v-show-seal'] = !!d.show_seal;
    D['v-has-seal-img'] = sealReady;
    const pq = isoParts(d.poluch_date);
    D['v-show-poluch'] = !!d.show_poluch;
    D['v-poluch-day'] = pq.day; D['v-poluch-month-gen'] = pq.gen; D['v-poluch-year'] = pq.year;
    D['v-poluch-time'] = d.poluch_time || '';
    D['v-poluch-fio'] = d.greet_fio || '';
    D['v-poluch-sign'] = cleanWs(d.greet_fio).split(' ')[0] || '';
  } else if (t === 'uksp') {
    D['v-date-dots'] = dotsDate(d.date); D['v-doc-num'] = d.doc_num || '';
    D['v-show-reply'] = !!(d.reply_num || d.reply_date);
    D['v-reply-num'] = d.reply_num || ''; D['v-reply-date'] = d.reply_date ? dotsDate(d.reply_date) : '';
    D['v-addr-post'] = d.addr_post || ''; D['v-addr-rank'] = d.addr_rank || '';
    D['v-addr-fio'] = d.addr_fio || ''; D['v-appeal'] = d.appeal || 'Уважаемый';
    D['v-greet-fio'] = d.greet_fio || '';
    D['v-what'] = d.what || '';
    D['v-check-start'] = dotsDate(d.check_start); D['v-check-end'] = dotsDate(d.check_end);
    D['v-postan-date'] = dotsDate(d.postan_date);
    const confirmed = d.fact !== 'no';
    D['v-fact-word'] = confirmed ? 'подтвердился' : 'не подтвердился';
    D['v-decision-word'] = confirmed ? 'установленным' : 'неустановленным';
    D['v-est-date'] = dotsDate(d.est_date); D['v-est-text'] = (d.est_text || '').trim();
    D['v-has-penalty'] = !!cleanWs(d.penalty);
    D['v-penalty'] = (d.penalty || '').trim();
    D['v-sign-post'] = p.officer_post || ''; D['v-sign-rank'] = p.officer_rank || '';
    D['v-officer-phone'] = p.officer_phone || '';
    D['v-seal-l1'] = 'ОТДЕЛ'; D['v-seal-l2'] = 'СОБСТВЕННОЙ';
    D['v-seal-l3'] = 'БЕЗОПАСНОСТИ'; D['v-seal-l4'] = '* ГУ МВД *';
    D['v-show-sign'] = !!d.show_sign; D['v-show-seal'] = !!d.show_seal;
    D['v-has-seal-img'] = sealReady;
    const uq = isoParts(d.poluch_date);
    D['v-show-poluch'] = !!d.show_poluch;
    D['v-poluch-day'] = uq.day; D['v-poluch-month-gen'] = uq.gen; D['v-poluch-year'] = uq.year;
    D['v-poluch-time'] = d.poluch_time || '';
    D['v-poluch-fio'] = d.greet_fio || '';
    D['v-poluch-sign'] = cleanWs(d.greet_fio).split(' ')[0] || '';
  } else if (t === 'protokol_oprosa') {
    D['v-place'] = d.place || '';
    D['v-day'] = dp.day;
    D['v-year2'] = String(dp.year || '').slice(2);
    const st = String(d.start_time || '').split(':');
    D['v-start-h'] = st[0] || ''; D['v-start-m'] = st[1] || '';
    const et = String(d.end_time || '').split(':');
    D['v-end-h'] = et[0] || ''; D['v-end-m'] = et[1] || '';
    D['v-officer-post'] = p.officer_post || '';
    D['v-officer-title'] = cleanWs(`${p.officer_rank || ''} ${p.officer_short || ''}`);
    D['v-officer-short'] = p.officer_short || '';
    D['v-fio'] = d.fio || ''; D['v-birth-date'] = d.birth_date || '';
    D['v-birth-place'] = d.birth_place || ''; D['v-address'] = d.address || '';
    D['v-phone'] = d.phone || ''; D['v-citizenship'] = d.citizenship || '';
    D['v-education'] = d.education || ''; D['v-family'] = d.family || '';
    D['v-work'] = d.work || ''; D['v-military'] = d.military || '';
    D['v-conviction'] = d.conviction || ''; D['v-passport'] = d.passport || '';
    D['v-other'] = d.other || ''; D['v-sig'] = d.sig || '';
    D['v-q1'] = d.q1 || ''; D['v-a1'] = d.a1 || '';
    D['v-q2'] = d.q2 || ''; D['v-a2'] = d.a2 || '';
    D['v-q3'] = d.q3 || ''; D['v-a3'] = d.a3 || '';
    D['v-q4'] = d.q4 || ''; D['v-a4'] = d.a4 || '';
    D['v-q5'] = d.q5 || ''; D['v-a5'] = d.a5 || '';
    D['v-q6'] = d.q6 || ''; D['v-a6'] = d.a6 || '';
    D['v-q7'] = d.q7 || ''; D['v-a7'] = d.a7 || '';
    D['v-q8'] = d.q8 || ''; D['v-a8'] = d.a8 || '';
    D['v-q9'] = d.q9 || ''; D['v-a9'] = d.a9 || '';
    D['v-qa-count'] = Math.min(9, Math.max(1, Math.trunc(+d.qa_count) || 9));
  } else if (t === 'zayavlenie') {
    D['v-boss-to'] = d.boss_to || '';
    D['v-appl-fio'] = d.appl_fio || '';
    D['v-appl-birth'] = d.appl_birth || '';
    D['v-appl-address'] = d.appl_address || '';
    D['v-appl-phone'] = d.appl_phone || '';
    D['v-appl-passport'] = d.appl_passport || '';
    D['v-target'] = d.target || '';
    D['v-event-date'] = dotsDate(d.event_date);
    D['v-event-place'] = d.event_place || '';
    D['v-content'] = d.content || '';
    D['v-request'] = d.request || '';
    D['v-appl-sign'] = d.appl_sign || '';
    D['v-num'] = d.num || '';
    D['v-accept-time'] = d.accept_time || '';
    D['v-brief'] = cleanWs(d.brief) || cleanWs(d.content).slice(0, 140);
    D['v-show-accept'] = !!d.show_accept; D['v-show-seal'] = !!d.show_seal;
    D['v-has-seal-img'] = sealReady;
  }
  if (D['v-sogl-osb-day'] === undefined) { put('sogl-osb', d.sogl_osb_date); put('sogl-gu', d.sogl_gu_date); put('vruch', d.vruch_date); }
  const missing = DATA_KEYS[t].filter(k => !(k in D));
  if (missing.length) console.warn('Нет данных для ключей:', missing.join(', '));
  return D;
}
function dataLines(D) {
  return Object.entries(D).map(([k, v]) => {
    if (typeof v === 'boolean') return `#let ${k} = ${v}`;
    if (typeof v === 'number') return `#let ${k} = ${Number.isFinite(v) ? v : 0}`;
    if (typeof v === 'string' && /^[0-9.]+mm$/.test(v)) return `#let ${k} = ${v}`;
    return `#let ${k} = ${escTyp(v)}`;
  }).join('\n');
}
function injectData(tpl, lines) {
  return tpl.replace(/\/\/ <OSB-DATA>\n[\s\S]*?\n\/\/ <\/OSB-DATA>/, `// <OSB-DATA>\n${lines}\n// </OSB-DATA>`);
}

/* ---------- Typst + preview ---------- */
let typstOk = false, tplCache = {}, pdfBytes = null, currentSource = '', lastSignHash = '';
let sealReady = false;
let compileSeq = 0, compiling = false, queued = false;
const scheduleCompile = debounce(() => recompile(), 700);

async function waitTypst(ms = 30000) {
  const t0 = Date.now();
  while (!window.$typst) {
    if (Date.now() - t0 > ms) throw new Error('CDN typst.ts недоступен (нужен интернет)');
    await new Promise(r => setTimeout(r, 200));
  }
}
async function ensureTypst() {
  if (typstOk) return;
  setStatus('Загрузка компилятора Typst…');
  await waitTypst();
  window.$typst.setCompilerInitOptions({
    getModule: () => 'https://cdn.jsdelivr.net/npm/@myriaddreamin/typst-ts-web-compiler@0.7.0/pkg/typst_ts_web_compiler_bg.wasm',
  });
  // Точные метрики Liberation Serif (иначе вёрстка разъезжается и документы уходят на 2 страницы).
  // Заменяем набор шрифтов компилятора только нашими (кириллица и все нужные глифы есть).
  // Сначала пробуем fetch (кэшируется браузером), запасной вариант — вшитые в fonts.js (для file://).
  try {
    const fb = await window.$typst.getFontResolver();
    const canFetch = location.protocol.startsWith('http');
    for (const w of LIBERATION_FONTS) {
      let bytes = null;
      if (canFetch) {
        try {
          const r = await fetch(`assets/fonts/LiberationSerif-${w}.ttf`);
          if (r.ok) bytes = new Uint8Array(await r.arrayBuffer());
        } catch {}
      }
      if (!bytes && window.OSB_FONTS_B64 && window.OSB_FONTS_B64[w]) {
        bytes = b64ToBytes(window.OSB_FONTS_B64[w]);
      }
      if (!bytes) throw new Error('нет шрифта ' + w);
      await fb.addFontData(bytes);
    }
    const compiler = await window.$typst.getCompiler();
    await fb.build(async fonts => compiler.setFonts(fonts));
  } catch (e) {
    console.warn('Liberation Serif не загружен, используется шрифт по умолчанию:', e);
  }
  if (window.OSB_GERB_B64) await window.$typst.mapShadow('/gerb.svg', b64ToBytes(window.OSB_GERB_B64));
  if (window.OSB_SEAL_B64) {
    try {
      await window.$typst.mapShadow('/seal.png', b64ToBytes(window.OSB_SEAL_B64));
      sealReady = true;
    } catch (e) { console.warn('Печать не загружена:', e); }
  }
  typstOk = true;
}
async function getTemplate(t) {
  // Шаблоны вшиты в templates.js — никакого fetch, работает и через file://
  if (tplCache[t]) return tplCache[t];
  const src = window.OSB_TEMPLATES && window.OSB_TEMPLATES[t];
  if (!src) throw new Error(`Шаблон ${t} не встроен (templates.js не загружен?)`);
  tplCache[t] = src;
  return src;
}
async function recompile() {
  if (!typstOk) return;
  if (state.active.mode === 'case' && !getActiveDocRef()) {
    pdfBytes = null; currentSource = '';
    setButtons(false);
    $('#pages').innerHTML = '<div class="placeholder">В деле пока нет документов — нажмите «+ Документ».</div>';
    setStatus('Дело пустое — добавьте документ', false, false);
    return;
  }
  if (compiling) { queued = true; return; }
  compiling = true;
  try {
    do {
      queued = false;
      setStatus('Компиляция…');
      showError('');
      try {
        const sb = signBytes();
        const hash = sb ? sb.length + ':' + sb[0] + ':' + sb[sb.length - 1] : 'none';
        if (hash !== lastSignHash) {
          if (sb) await window.$typst.mapShadow('/sign.png', sb);
          else { try { await window.$typst.unmapShadow('/sign.png'); } catch {} }
          lastSignHash = hash;
        }
        const tpl = await getTemplate(workTpl());
        currentSource = injectData(tpl, dataLines(buildData()));
        const t0 = performance.now();
        pdfBytes = await window.$typst.pdf({ mainContent: currentSource });
        await renderPreview();
        compileSeq++;
        window.__compileSeq = compileSeq;
        setStatus(`Готов · ${Math.round(performance.now() - t0)} мс`, false, true);
        setButtons(true);
      } catch (e) {
        console.error(e);
        showError(String(e && e.message || e).slice(0, 2000));
        setStatus('Ошибка компиляции', true);
        setButtons(false);
      }
    } while (queued);
  } finally {
    compiling = false;
  }
}
function setButtons(on) {
  $('#btnPdf').disabled = !on;
  $('#btnJpg').disabled = !on;
  $('#btnTyp').disabled = !on;
}
async function renderPreview() {
  if (!window.pdfjsLib) throw new Error('CDN pdf.js недоступен (нужен интернет)');
  pdfjsLib.GlobalWorkerOptions.workerSrc = window.__pdfWorkerSrc;
  const pdf = await pdfjsLib.getDocument({ data: pdfBytes.slice() }).promise;
  const box = $('#pages');
  box.innerHTML = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const vp = page.getViewport({ scale: 1.6 });
    const cv = document.createElement('canvas');
    cv.width = vp.width; cv.height = vp.height;
    await page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
    box.append(cv);
  }
}
function slugify(s) {
  return String(s || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'delo';
}
function docFileBase() {
  const t = workTpl();
  const d = workData() || {};
  const tag = (d.num || d.doc_num || d.check_num || d.date || '').toString().replace(/[^\p{L}\p{N}-]+/gu, '') || 'doc';
  if (state.active.mode === 'case') {
    const c = getActiveCase();
    const ref = getActiveDocRef();
    const cs = slugify(c ? c.title : 'delo');
    const ds = slugify(ref ? ref.name : t);
    return `${cs}_${ds}_${tag}`;
  }
  return `${t}_${tag}`;
}
async function exportJpg() {
  if (!pdfBytes) return;
  setStatus('Рендер JPG…');
  try {
    const pdf = await pdfjsLib.getDocument({ data: pdfBytes.slice() }).promise;
    const base = docFileBase();
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const vp = page.getViewport({ scale: 3 });
      const cv = document.createElement('canvas');
      cv.width = vp.width; cv.height = vp.height;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, cv.width, cv.height);
      await page.render({ canvasContext: ctx, viewport: vp }).promise;
      const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.92));
      download(blob, `${base}_p${i}.jpg`);
      await new Promise(r => setTimeout(r, 300));
    }
    setStatus('JPG сохранён', false, true);
  } catch (e) { setStatus('Ошибка экспорта JPG: ' + e.message, true); }
}
function missingRequired() {
  const bad = [];
  const check = (sections, values) => {
    for (const s of sections) for (const f of (s.fields || [])) {
      if (f.req && !String(values[f.k] ?? '').trim()) bad.push(f.label);
    }
  };
  check(PROFILE_SECTIONS.filter(s => s.fields).map(s => ({ fields: s.fields })), state.profile);
  check(DOC_SCHEMAS[workTpl()] || [], workData() || {});
  return bad;
}

/* ---------- события ---------- */
function bindUI() {
  document.querySelectorAll('#templateTabs button').forEach(b => {
    b.onclick = () => {
      if (state.active.mode !== 'free') setActiveFree();
      if (state.template === b.dataset.t) return;
      state.template = b.dataset.t;
      syncTabs();
      renderDoc();
      saveLS();
      recompile();
    };
  });
  $('#btnPdf').onclick = () => {
    const bad = missingRequired();
    if (bad.length) { setStatus('Заполните обязательные поля: ' + bad.slice(0, 3).join(', '), true); return; }
    if (pdfBytes) download(new Blob([pdfBytes], { type: 'application/pdf' }), docFileBase() + '.pdf');
  };
  $('#btnJpg').onclick = () => {
    const bad = missingRequired();
    if (bad.length) { setStatus('Заполните обязательные поля: ' + bad.slice(0, 3).join(', '), true); return; }
    exportJpg();
  };
  $('#btnTyp').onclick = () => {
    if (currentSource) download(new Blob([currentSource], { type: 'text/plain' }), docFileBase() + '.typ');
  };
  $('#btnFill').onclick = () => {
    if (state.active.mode === 'case' && !getActiveDocRef()) return;
    if (!confirm('Заменить данные текущего документа примером?')) return;
    const t = workTpl();
    const fresh = structuredClone(DEFAULT_DOCS[t]);
    if (state.active.mode === 'case') {
      Object.assign(workData(), fresh);
      touchCase();
    } else {
      state.docs[state.template] = fresh;
    }
    saveLS(); renderDoc(); recompile();
  };
  $('#btnClear').onclick = () => {
    if (state.active.mode === 'case' && !getActiveDocRef()) return;
    if (!confirm('Очистить все поля текущего документа? Профиль и город сохранятся.')) return;
    const d = workData();
    const keepCity = d.city;
    for (const k of Object.keys(d)) {
      if (k === 'city') continue;
      if (typeof d[k] === 'boolean') {
        d[k] = k.startsWith('show_') ? false : d[k];
        if (k === 'show_bottom_sign') d[k] = true;
      } else if (k === 'suspend') d[k] = 'отстранить';
      else if (k === 'subj_sex') d[k] = 'm';
      else d[k] = '';
    }
    d.city = keepCity;
    touchCase();
    saveLS(); renderDoc(); recompile();
  };
  bindCasesUI();
}
function syncTabs() {
  document.querySelectorAll('#templateTabs button').forEach(b =>
    b.setAttribute('aria-selected', String(b.dataset.t === state.template)));
}

/* ---------- дела ---------- */
function setActiveFree() {
  state.active = { mode: 'free', caseId: null, docId: null };
  saveLS(); syncContextUI(); renderDoc(); recompile();
}
function openCase(caseId, docId) {
  const c = state.cases.find(x => x.id === caseId);
  if (!c) return;
  state.active = { mode: 'case', caseId, docId: docId || (c.docs[0] && c.docs[0].docId) || null };
  saveLS(); syncContextUI(); renderDoc(); recompile();
  hideCasesMenu();
}
function autoDocName(c, tpl) {
  const n = c.docs.filter(d => d.tpl === tpl).length + 1;
  const base = TPL_NAMES[tpl] || tpl;
  return n <= 1 && !c.docs.some(d => d.tpl === tpl) ? base : `${base} ${n}`;
}
function addDocToCase(tpl) {
  const c = getActiveCase();
  if (!c) return;
  const doc = { docId: uid('d'), tpl, name: autoDocName(c, tpl), data: structuredClone(DEFAULT_DOCS[tpl]) };
  c.docs.push(doc);
  state.active.docId = doc.docId;
  touchCase(); saveLS(); syncContextUI(); renderDoc(); recompile();
}
function syncContextUI() {
  const inCase = state.active.mode === 'case';
  const c = getActiveCase();
  $('#templateTabs').style.display = inCase ? 'none' : '';
  $('#caseBar').hidden = !inCase;
  const btn = $('#btnCases');
  btn.textContent = inCase && c ? `📁 ${c.title} ▾` : '📁 Вне дел ▾';
  if (inCase && c) {
    $('#caseTitle').textContent = c.title;
    $('#caseDescr').textContent = c.descr || '';
    const box = $('#docChips');
    box.innerHTML = '';
    if (!c.docs.length) {
      box.innerHTML = '<span style="color:#999;font-size:13px">Нет документов — нажмите «+ Документ»</span>';
    }
    for (const d of c.docs) {
      const chip = document.createElement('span');
      chip.className = 'docchip';
      chip.setAttribute('aria-selected', String(d.docId === state.active.docId));
      chip.title = `${TPL_NAMES[d.tpl] || d.tpl}`;
      const nm = document.createElement('span');
      nm.className = 'nm';
      nm.textContent = d.name;
      nm.onclick = () => {
        state.active.docId = d.docId;
        saveLS(); syncContextUI(); renderDoc(); recompile();
      };
      const rn = document.createElement('button');
      rn.className = 'rn'; rn.textContent = '✎'; rn.title = 'Переименовать документ';
      rn.onclick = ev => { ev.stopPropagation(); openModal('rename-doc', d.docId); };
      const del = document.createElement('button');
      del.className = 'del'; del.textContent = '×'; del.title = 'Удалить документ';
      del.onclick = ev => {
        ev.stopPropagation();
        if (!confirm(`Удалить «${d.name}» из дела?`)) return;
        c.docs = c.docs.filter(x => x.docId !== d.docId);
        if (state.active.docId === d.docId) state.active.docId = c.docs[0] ? c.docs[0].docId : null;
        touchCase(); saveLS(); syncContextUI(); renderDoc(); recompile();
      };
      chip.append(nm, rn, del);
      box.append(chip);
    }
    // меню добавления
    const am = $('#addDocMenu');
    am.hidden = true;
    am.innerHTML = '';
    for (const [tpl, label] of Object.entries(TPL_NAMES)) {
      const b = document.createElement('button');
      b.textContent = label;
      b.onclick = () => { am.hidden = true; addDocToCase(tpl); };
      am.append(b);
    }
  }
  syncTabs();
  renderCasesMenu();
}
function hideCasesMenu() { $('#casesMenu').hidden = true; }
function renderCasesMenu() {
  const m = $('#casesMenu');
  m.innerHTML = '';
  const head = document.createElement('div');
  head.className = 'cm-head';
  const bNew = document.createElement('button');
  bNew.className = 'primary'; bNew.textContent = '+ Новое дело';
  bNew.onclick = () => { hideCasesMenu(); openModal('create'); };
  const bImp = document.createElement('button');
  bImp.textContent = 'Импорт JSON';
  bImp.onclick = () => $('#importCaseFile').click();
  head.append(bNew, bImp);
  m.append(head);
  const free = document.createElement('button');
  free.className = 'cm-item' + (state.active.mode === 'free' ? ' active' : '');
  free.innerHTML = '';
  const fm = document.createElement('span');
  fm.className = 'cm-main';
  fm.innerHTML = `<div class="cm-title">📄 Вне дел (просто документы)</div><div class="cm-sub">7 черновиков без привязки к делу</div>`;
  free.append(fm);
  free.onclick = () => { setActiveFree(); hideCasesMenu(); };
  m.append(free);
  const sorted = [...state.cases].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  for (const c of sorted) {
    const it = document.createElement('div');
    it.className = 'cm-item' + (state.active.mode === 'case' && state.active.caseId === c.id ? ' active' : '');
    const main = document.createElement('button');
    main.className = 'cm-main';
    main.style.cssText = 'border:0;background:transparent;text-align:left;cursor:pointer;padding:0;color:inherit';
    main.innerHTML = `<div class="cm-title"></div><div class="cm-sub"></div><div class="cm-meta"></div>`;
    main.querySelector('.cm-title').textContent = '📁 ' + c.title;
    main.querySelector('.cm-sub').textContent = c.descr || '—';
    main.querySelector('.cm-meta').textContent = `${c.docs.length} док. · ${c.updatedAt ? new Date(c.updatedAt).toLocaleDateString('ru-RU') : ''}`;
    main.onclick = () => openCase(c.id);
    const x = document.createElement('button');
    x.className = 'cm-x'; x.textContent = '🗑'; x.title = 'Удалить дело';
    x.onclick = () => deleteCase(c.id);
    it.append(main, x);
    m.append(it);
  }
  if (!state.cases.length) {
    const p = document.createElement('div');
    p.style.cssText = 'padding:8px;color:#999;font-size:12px';
    p.textContent = 'Дел пока нет — создайте первое кнопкой выше.';
    m.append(p);
  }
}
function deleteCase(caseId) {
  const c = state.cases.find(x => x.id === caseId);
  if (!c) return;
  if (!confirm(`Удалить дело «${c.title}» и все ${c.docs.length} документов?`)) return;
  state.cases = state.cases.filter(x => x.id !== caseId);
  if (state.active.caseId === caseId) state.active = { mode: 'free', caseId: null, docId: null };
  saveLS(); syncContextUI(); renderDoc(); recompile();
}
function exportCase(caseId) {
  const c = state.cases.find(x => x.id === caseId) || getActiveCase();
  if (!c) return;
  const payload = { v: 1, app: 'osb-docs', title: c.title, descr: c.descr || '', docs: c.docs };
  download(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), `${slugify(c.title)}.json`);
}
function importCaseFile(file) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const o = JSON.parse(r.result);
      if (!o || !Array.isArray(o.docs)) throw new Error('не похож на дело (нет docs[])');
      const docs = [];
      for (const d of o.docs) {
        if (!d || !TPL_NAMES[d.tpl]) continue;
        docs.push({
          docId: uid('d'),
          tpl: d.tpl,
          name: String(d.name || TPL_NAMES[d.tpl]).slice(0, 120),
          data: { ...structuredClone(DEFAULT_DOCS[d.tpl]), ...(d.data || {}) },
        });
      }
      if (!docs.length) throw new Error('в файле нет известных шаблонов');
      const c = {
        id: uid('c'), title: String(o.title || file.name.replace(/\.json$/i, '')).slice(0, 120) || 'Дело (импорт)',
        descr: String(o.descr || '').slice(0, 500), createdAt: Date.now(), updatedAt: Date.now(), docs,
      };
      state.cases.push(c);
      saveLS(); syncContextUI();
      setStatus(`Импортировано дело «${c.title}» (${docs.length} док.)`, false, true);
    } catch (e) { setStatus('Импорт не удался: ' + e.message, true); }
  };
  r.readAsText(file);
}
/* Модалка создания/переименования */
let modalMode = null, modalDocId = null;
function openModal(mode, docId) {
  modalMode = mode; modalDocId = docId || null;
  const ov = $('#modalOverlay');
  if (mode === 'create') {
    $('#modalTitle').textContent = 'Новое дело';
    $('#modalName').value = '';
    $('#modalDescr').value = '';
  } else if (mode === 'rename-case') {
    const c = getActiveCase();
    $('#modalTitle').textContent = 'Переименовать дело';
    $('#modalName').value = c ? c.title : '';
    $('#modalDescr').value = c ? (c.descr || '') : '';
  } else if (mode === 'rename-doc') {
    const c = getActiveCase();
    const d = c ? c.docs.find(x => x.docId === docId) : null;
    $('#modalTitle').textContent = 'Переименовать документ';
    $('#modalName').value = d ? d.name : '';
    $('#modalDescr').value = '';
    $('#modalDescr').closest('.field').style.display = 'none';
  }
  if (mode !== 'rename-doc') $('#modalDescr').closest('.field').style.display = '';
  ov.hidden = false;
  setTimeout(() => $('#modalName').focus(), 50);
}
function closeModal() { $('#modalOverlay').hidden = true; modalMode = null; modalDocId = null; }
function submitModal() {
  const name = $('#modalName').value.trim();
  const descr = $('#modalDescr').value.trim();
  if (modalMode === 'create') {
    if (!name) { $('#modalName').focus(); return; }
    const c = { id: uid('c'), title: name.slice(0, 120), descr: descr.slice(0, 500), createdAt: Date.now(), updatedAt: Date.now(), docs: [] };
    state.cases.push(c);
    state.active = { mode: 'case', caseId: c.id, docId: null };
    saveLS(); syncContextUI(); renderDoc(); recompile();
    setStatus(`Дело «${c.title}» создано — добавьте документы`, false, true);
  } else if (modalMode === 'rename-case') {
    if (!name) { $('#modalName').focus(); return; }
    const c = getActiveCase();
    if (c) { c.title = name.slice(0, 120); c.descr = descr.slice(0, 500); touchCase(); saveLS(); syncContextUI(); }
  } else if (modalMode === 'rename-doc') {
    if (!name) { $('#modalName').focus(); return; }
    const c = getActiveCase();
    const d = c ? c.docs.find(x => x.docId === modalDocId) : null;
    if (d) { d.name = name.slice(0, 120); touchCase(); saveLS(); syncContextUI(); renderDoc(); }
  }
  closeModal();
}
function bindCasesUI() {
  const menu = $('#casesMenu');
  $('#btnCases').onclick = ev => {
    ev.stopPropagation();
    renderCasesMenu();
    menu.hidden = !menu.hidden;
    $('#addDocMenu').hidden = true;
  };
  document.addEventListener('click', ev => {
    if (!menu.hidden && !menu.contains(ev.target) && ev.target.id !== 'btnCases') menu.hidden = true;
    const am = $('#addDocMenu');
    if (!am.hidden && !am.contains(ev.target) && ev.target.id !== 'btnAddDoc') am.hidden = true;
  });
  $('#btnBackFree').onclick = () => setActiveFree();
  $('#btnAddDoc').onclick = ev => {
    ev.stopPropagation();
    const am = $('#addDocMenu');
    am.hidden = !am.hidden;
  };
  $('#btnRenameCase').onclick = () => openModal('rename-case');
  $('#btnExportCase').onclick = () => { const c = getActiveCase(); if (c) exportCase(c.id); };
  $('#btnDeleteCase').onclick = () => { const c = getActiveCase(); if (c) deleteCase(c.id); };
  $('#modalOk').onclick = () => submitModal();
  $('#modalCancel').onclick = () => closeModal();
  $('#modalOverlay').addEventListener('click', ev => { if (ev.target.id === 'modalOverlay') closeModal(); });
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape') { closeModal(); hideCasesMenu(); } });
  $('#modalName').addEventListener('keydown', ev => { if (ev.key === 'Enter') submitModal(); });
  $('#importCaseFile').onchange = ev => {
    const f = ev.target.files[0];
    if (f) importCaseFile(f);
    ev.target.value = '';
  };
}

/* Разделитель панелей: перетаскивание мышью, ширина сохраняется */
const LS_LEFTW = 'osb_leftw_v1';
function initSplitter() {
  const sp = $('#splitter');
  const layout = sp.parentElement;
  try {
    const w = +localStorage.getItem(LS_LEFTW);
    if (w >= 340 && w <= 900) layout.style.setProperty('--leftw', w + 'px');
  } catch {}
  let drag = false;
  sp.addEventListener('mousedown', e => {
    drag = true;
    sp.classList.add('drag');
    e.preventDefault();
  });
  window.addEventListener('mousemove', e => {
    if (!drag) return;
    const r = layout.getBoundingClientRect();
    let w = e.clientX - r.left - 24;
    w = Math.max(340, Math.min(900, w));
    layout.style.setProperty('--leftw', w + 'px');
  });
  window.addEventListener('mouseup', () => {
    if (!drag) return;
    drag = false;
    sp.classList.remove('drag');
    try {
      localStorage.setItem(LS_LEFTW, parseInt(layout.style.getPropertyValue('--leftw')) || '');
    } catch {}
  });
}

/* ---------- старт ---------- */
(async function boot() {
  loadCases();
  syncTabs();
  renderProfile();
  syncContextUI();
  renderDoc();
  bindUI();
  initSplitter();
  try {
    await ensureTypst();
    await recompile();
  } catch (e) {
    console.error(e);
    setStatus('Нет соединения: не загрузился компилятор Typst с CDN. Проверьте интернет и обновите страницу.', true);
    $('#pages').innerHTML = '<div class="placeholder">Нет соединения. Проверьте интернет и обновите страницу — формы продолжат сохраняться локально.</div>';
  }
})();
