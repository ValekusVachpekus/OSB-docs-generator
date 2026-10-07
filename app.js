'use strict';
/* ОСБ — редактор документов. Статика + Typst WASM (cdn) + pdf.js для превью/JPG. */

/* ---------- константы ---------- */
const MONTHS_GEN = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const RANKS = ['рядовой полиции','младший сержант полиции','сержант полиции','старший сержант полиции',
  'прапорщик полиции','лейтенант полиции','старший лейтенант полиции','капитан полиции',
  'майор полиции','подполковник полиции','полковник полиции','генерал-майор полиции','генерал-лейтенант полиции'];
const LS_PROFILE = 'osb_profile_v1';
const LS_TEMPLATE = 'osb_template_v1';
const LS_DRAFT = t => `osb_draft_${t}_v1`;
const TPL_NAMES = { trebovanie: 'Требование', proverka: 'Проверка', otstranenie: 'Отстранение' };
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
    'v-has-gerb','v-has-sign','v-sign-width','v-show-bottom-sign','v-show-sogl-osb','v-show-sogl-gu','v-show-vruch'],
  otstranenie: ['v-day','v-month-gen','v-month-num','v-year','v-city','v-num','v-subject','v-subject-gen',
    'v-officer-rank-full','v-ustav-article','v-check-num',
    'v-officer-post','v-officer-rank','v-officer-full','v-officer-short','v-officer-phone',
    'v-sogl-osb-post','v-sogl-osb-rank','v-sogl-osb-day','v-sogl-osb-month-gen','v-sogl-osb-year','v-sogl-osb-sign','v-sogl-osb-fio',
    'v-sogl-gu-post','v-sogl-gu-rank','v-sogl-gu-day','v-sogl-gu-month-gen','v-sogl-gu-year','v-sogl-gu-sign','v-sogl-gu-fio',
    'v-vruch-day','v-vruch-month-gen','v-vruch-year','v-vruch-time','v-vruch-sign','v-vruch-fio',
    'v-has-gerb','v-has-sign','v-sign-width','v-show-bottom-sign','v-show-sogl-osb','v-show-sogl-gu','v-show-vruch'],
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
  show_sogl_osb: true, sogl_osb_date: '2026-04-12',
  show_sogl_gu: true, sogl_gu_date: '2026-04-12',
  show_vruch: true, vruch_date: '2026-04-12', vruch_time: '00:00',
};
/* Стандартный абзац блока «Установил» — добавляется ВСЕГДА в конец текста пользователя */
const VIOLATION_TAIL = 'В соответствии с требованиями Федерального закона «О полиции» и внутреннего устава ОВД, а также в целях установления фактов, обстоятельств и причин возможного нарушения служебной дисциплины';
/* Звания (именительный) -> родительный / творительный падеж, для автосборки формулировок проверки */
const RANK_FORMS = {
  'рядовой полиции': ['рядового полиции', 'рядовым полиции'],
  'младший сержант полиции': ['младшего сержанта полиции', 'младшим сержантом полиции'],
  'сержант полиции': ['сержанта полиции', 'сержантом полиции'],
  'старший сержант полиции': ['старшего сержанта полиции', 'старшим сержантом полиции'],
  'старшина полиции': ['старшины полиции', 'старшиной полиции'],
  'прапорщик полиции': ['прапорщика полиции', 'прапорщиком полиции'],
  'старший прапорщик полиции': ['старшего прапорщика полиции', 'старшим прапорщиком полиции'],
  'младший лейтенант полиции': ['младшего лейтенанта полиции', 'младшим лейтенантом полиции'],
  'лейтенант полиции': ['лейтенанта полиции', 'лейтенантом полиции'],
  'старший лейтенант полиции': ['старшего лейтенанта полиции', 'старшим лейтенантом полиции'],
  'капитан полиции': ['капитана полиции', 'капитаном полиции'],
  'майор полиции': ['майора полиции', 'майором полиции'],
  'подполковник полиции': ['подполковника полиции', 'подполковником полиции'],
  'полковник полиции': ['полковника полиции', 'полковником полиции'],
  'генерал-майор полиции': ['генерал-майора полиции', 'генерал-майором полиции'],
  'генерал-лейтенант полиции': ['генерал-лейтенанта полиции', 'генерал-лейтенантом полиции'],
  'генерал-полковник полиции': ['генерал-полковника полиции', 'генерал-полковником полиции'],
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
};

/* ---------- состояние ---------- */
const state = {
  template: (() => { try { return localStorage.getItem(LS_TEMPLATE) || 'trebovanie'; } catch { return 'trebovanie'; } })(),
  profile: loadLS(LS_PROFILE, structuredClone(DEFAULT_PROFILE)),
  docs: {
    trebovanie: loadLS(LS_DRAFT('trebovanie'), structuredClone(DEFAULT_DOCS.trebovanie)),
    proverka: loadLS(LS_DRAFT('proverka'), structuredClone(DEFAULT_DOCS.proverka)),
    otstranenie: loadLS(LS_DRAFT('otstranenie'), structuredClone(DEFAULT_DOCS.otstranenie)),
  },
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
function saveLS() {
  try {
    localStorage.setItem(LS_PROFILE, JSON.stringify(state.profile));
    localStorage.setItem(LS_TEMPLATE, state.template);
    localStorage.setItem(LS_DRAFT(state.template), JSON.stringify(state.docs[state.template]));
  } catch (e) { setStatus('localStorage переполнен: уменьшите картинку подписи', true); }
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
    for (const o of f.opts) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = o.label;
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
/* Склонение фамилии: род. и твор. падеж. Неизвестные окончания — без изменений. */
function declSurname(s, sex = 'm') {
  s = String(s || '').trim();
  if (!s) return { gen: s, tvor: s };
  const low = s.toLowerCase();
  const rep = (re, gen, tvor) => {
    if (!re.test(low)) return null;
    return { gen: s.replace(re, gen), tvor: s.replace(re, tvor) };
  };
  let r;
  if (sex === 'f') {
    r = rep(/(ов|ев|ёв|ин|ын)а$/, '$1ой', '$1ой')
      || rep(/(ская|цкая|ая|яя)$/, 'ой', 'ой')
      || rep(/([гкхжчшщ])а$/, '$1и', '$1ой')
      || rep(/([а-я])а$/, '$1ы', '$1ой');
    return r || { gen: s, tvor: s };
  }
  r = rep(/(ов|ев|ёв|ин|ын)$/, '$1а', '$1ым')
    || rep(/(ский|цкий)$/, 'ого', 'им')
    || rep(/(ой|ый|ий)$/, 'ого', 'ым')
    || rep(/ь$/, 'я', 'ем')
    || rep(/([бвгджзклмнпрстфхцчшщ])$/, '$1а', '$1ом')
    || rep(/([гкхжчшщ])а$/, '$1и', '$1ой')
    || rep(/([а-я])а$/, '$1ы', '$1ой');
  return r || { gen: s, tvor: s };
}
function cleanWs(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }
/* Фамилия из фразы («младшего сержанта полиции Молотова А.А.» → «Молотова»).
   Берётся последнее слово из букв перед инициалами. */
function extractSurname(phrase) {
  const toks = cleanWs(phrase).split(' ');
  for (let i = toks.length - 1; i >= 0; i--) {
    const t = toks[i].replace(/[.,]$/g, '');
    if (/^[А-ЯЁ][а-яё]+$/.test(t)) return t;
  }
  return '';
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
  const values = state.docs[state.template];
  const onChange = () => { saveLS(); refreshSubforms(root, values); scheduleCompile(); };
  for (const sec of DOC_SCHEMAS[state.template]) {
    const card = document.createElement('div');
    card.className = 'card';
    const h = document.createElement('h3');
    h.textContent = sec.title;
    h.style.marginTop = '0';
    card.append(h);
    for (const f of sec.fields) card.append(fieldNode(sec, f, values, onChange, 'doc'));
    root.append(card);
  }
  root.querySelectorAll('[data-action="recompose"]').forEach(b => {
    b.onclick = () => {
      const c = composeProverka(state.profile, values);
      Object.assign(values, c);
      for (const [k, v] of Object.entries(c)) {
        const inp = root.querySelector(`[data-fk="${k}"]`);
        if (inp) { inp.value = v; inp.classList.remove('invalid'); }
      }
      saveLS();
      scheduleCompile();
      setStatus('Формулировки собраны', false, true);
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
  const t = state.template;
  const p = state.profile;
  const d = state.docs[t];
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
    D['v-vruch-sign'] = d.subj_surname || ''; D['v-vruch-fio'] = d.suspend_target || '';
  } else {
    D['v-num'] = d.num; D['v-subject'] = d.subject;
    D['v-subject-gen'] = 'со стороны ' + (d.subject || '');
    D['v-officer-rank-full'] = d.officer_rank_full;
    D['v-ustav-article'] = d.ustav_article; D['v-check-num'] = d.check_num;
    D['v-vruch-sign'] = extractSurname(d.subject); D['v-vruch-fio'] = d.subject || '';
  }
  if (D['v-sogl-osb-day'] === undefined) { put('sogl-osb', d.sogl_osb_date); put('sogl-gu', d.sogl_gu_date); put('vruch', d.vruch_date); }
  const missing = DATA_KEYS[t].filter(k => !(k in D));
  if (missing.length) console.warn('Нет данных для ключей:', missing.join(', '));
  return D;
}
function dataLines(D) {
  return Object.entries(D).map(([k, v]) => {
    if (typeof v === 'boolean') return `#let ${k} = ${v}`;
    if (typeof v === 'string' && /^[0-9.]+mm$/.test(v)) return `#let ${k} = ${v}`;
    return `#let ${k} = ${escTyp(v)}`;
  }).join('\n');
}
function injectData(tpl, lines) {
  return tpl.replace(/\/\/ <OSB-DATA>\n[\s\S]*?\n\/\/ <\/OSB-DATA>/, `// <OSB-DATA>\n${lines}\n// </OSB-DATA>`);
}

/* ---------- Typst + preview ---------- */
let typstOk = false, tplCache = {}, pdfBytes = null, currentSource = '', lastSignHash = '';
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
        const tpl = await getTemplate(state.template);
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
function docFileBase() {
  const d = state.docs[state.template];
  const tag = (d.num || d.check_num || d.date || '').toString().replace(/[^\d-]+/g, '') || 'doc';
  return `${state.template}_${tag}`;
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
  check(DOC_SCHEMAS[state.template], state.docs[state.template]);
  return bad;
}

/* ---------- события ---------- */
function bindUI() {
  document.querySelectorAll('#templateTabs button').forEach(b => {
    b.onclick = () => {
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
    if (!confirm('Заменить данные текущего документа примером?')) return;
    state.docs[state.template] = structuredClone(DEFAULT_DOCS[state.template]);
    saveLS(); renderDoc(); recompile();
  };
  $('#btnClear').onclick = () => {
    if (!confirm('Очистить все поля текущего документа? Профиль и город сохранятся.')) return;
    const d = state.docs[state.template];
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
    saveLS(); renderDoc(); recompile();
  };
}
function syncTabs() {
  document.querySelectorAll('#templateTabs button').forEach(b =>
    b.setAttribute('aria-selected', String(b.dataset.t === state.template)));
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
  syncTabs();
  renderProfile();
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
