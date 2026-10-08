#set text(font: ("Liberation Serif", "DejaVu Serif"), size: 12pt, lang: "ru")

#set page(
  margin: (top: 2cm, bottom: 2cm, left: 2cm, right: 1cm),
  fill: rgb("FBFBFB"),
  background: {
    let grain_tile = tiling(size: (0.4mm, 0.4mm))[
       #place(center, circle(radius: 0.1pt, fill: black.transparentize(83%)))
    ]
    place(center + horizon, rect(width: 100%, height: 100%, fill: grain_tile))

    for i in range(0, 120) {
      let x = calc.rem(i * 137.5, 210) * 1mm
      let y = calc.rem(i * 243.1, 297) * 1mm
      let len = calc.rem(i * 7, 5) + 2
      let ang = i * 23.5deg

      place(top + left, dx: x, dy: y)[
        #rotate(ang)[
          #line(length: len * 1mm, stroke: 0.15pt + gray.transparentize(75%))
        ]
      ]
    }

    let watermark_text = rotate(-45deg, text(size: 140pt, fill: rgb(1, 1, 1, 3%))[])
    for x in range(0, 6) {
      for y in range(0, 8) {
        place(top + left, dx: -5cm + x * 8cm, dy: -2cm + y * 10cm)[#watermark_text]
      }
    }

    for i in range(0, 14) {
      let sx = calc.rem(i * 41.7, 210) * 1mm
      let sy = calc.rem(i * 89.3, 297) * 1mm
      let rad = (calc.rem(i * 17, 18) + 6) * 0.12mm
      place(top + left, dx: sx, dy: sy)[
        #circle(radius: rad, fill: black.transparentize(97%))
      ]
    }

    place(top + left, dx: 102mm, dy: 0mm)[
      #rect(width: 0.35mm, height: 297mm, fill: black.transparentize(98%))
    ]

    rect(width: 100%, height: 100%, fill: gradient.radial(rgb(0,0,0,0%), rgb(0,0,0,5%), center: (50%, 50%), radius: 80%))
  }
)

#set par(justify: true, first-line-indent: 1.25cm, leading: 0.65em)

// Пустая строка для рукописного заполнения
#let blankline = line(length: 100%, stroke: 0.5pt + black)

// Текст на разлиновке: под КАЖДОЙ строкой текста — линия во всю ширину,
// плюс extra пустых линий для продолжения от руки.
#let ruled-base = 10.9pt
#let ruled-text(body, extra: 2) = layout(size => {
  let w = size.width
  let styled = [
    #set text(size: 12pt)
    #set par(leading: 0.65em, justify: true, first-line-indent: 0pt)
    #body
  ]
  let h = measure(box(width: w, styled)).height
  // Эмпирический шаг строки 12pt Liberation Serif при leading 0.65em
  // (замер по растру: теория 12pt*1.2+leading не сошлась с реальностью).
  let skip = 15.66pt
  // Пустое значение: 0 строк текста (measure пустого блока даёт высоту строки).
  let n = if body == "" { 0 } else { calc.max(1, calc.ceil(h.pt() / skip.pt())) }
  let total = n * skip + extra * skip
  box(width: w, height: total)[
    #for k in range(n + extra) [
      #place(top + left, dy: ruled-base + k * skip)[#line(length: w, stroke: 0.5pt + black)]
    ]
    #styled
  ]
})

// Пункт анкеты: подпись пункта + значение на разлиновке
#let item(label, value, blanks: 1) = [
  #label
  #v(0.3em)
  #ruled-text(value, extra: if value == "" { blanks } else { blanks - 1 })
  #v(0.8em)
]

// Пара ВОПРОС / ОТВЕТ (значения — на разлиновке)
#let qablock(q, a) = [
  #text(weight: "bold")[ВОПРОС:]
  #v(0.3em)
  #ruled-text(q, extra: if q == "" { 1 } else { 0 })
  #v(0.5em)
  #text(weight: "bold")[ОТВЕТ:]
  #v(0.3em)
  #ruled-text(a, extra: if a == "" { 2 } else { 1 })
  #v(1.2em)
]

// Строка подписи опрашиваемого (текст — на линии, пусто — линия для руки)
#let sigline(who, sign) = [
  #grid(
    columns: (1fr, 1fr),
    [#who],
    [#if sign == "" [#blankline] else [#box(width: 100%, stroke: (bottom: 0.5pt + black))[#sign]]]
  )
  #align(right)[
    #set text(size: 10pt)
    (подпись)
  ]
]

// <OSB-DATA>
#let v-place = "г. Арзамас, ул. Пионерская, д. 1"
#let v-day = "29"
#let v-month-gen = "мая"
#let v-year2 = "26"
#let v-start-h = "10"
#let v-start-m = "00"
#let v-end-h = "10"
#let v-end-m = "30"
#let v-officer-post = "Заместитель начальника отдела собственной безопасности ГУ МВД"
#let v-officer-title = "майор полиции В.А. Щетков"
#let v-officer-short = "В.А. Щетков"
#let v-fio = "Иванов Иван Иванович"
#let v-birth-date = "1 января 1990 года"
#let v-birth-place = "г. Арзамас Нижегородской области"
#let v-address = "г. Арзамас, ул. Ленина, д. 10, кв. 5"
#let v-phone = "+7 (900) 000-00-00"
#let v-citizenship = "Российская Федерация"
#let v-education = "Высшее юридическое"
#let v-family = "Женат, двое детей"
#let v-work = "Инспектор ОБ ДПС"
#let v-military = "Военнообязанный"
#let v-conviction = "Не имеется"
#let v-passport = "Паспорт 22 00 000000, выдан ОВД г. Арзамаса 01.02.2010"
#let v-other = "Ранее к ответственности не привлекался"
#let v-sig = "Иванов"
#let v-q1 = "Что вам известно по существу проводимого опроса?"
#let v-a1 = "По существу заданного вопроса поясняю, что мне ничего не известно."
#let v-q2 = "Известны ли вам факты нарушения служебной дисциплины сотрудниками?"
#let v-a2 = "Нет, о таких фактах мне ничего не известно."
#let v-q3 = ""
#let v-a3 = ""
#let v-q4 = ""
#let v-a4 = ""
#let v-q5 = ""
#let v-a5 = ""
#let v-q6 = ""
#let v-a6 = ""
#let v-q7 = ""
#let v-a7 = ""
#let v-q8 = ""
#let v-a8 = ""
#let v-q9 = ""
#let v-a9 = ""
#let v-qa-count = 9
#let v-has-sign = true
#let v-sign-width = 25mm
// </OSB-DATA>

// --- Заголовок ---
#align(center)[
  #text(size: 14pt, weight: "bold")[ПРОТОКОЛ \ опроса]
]

#v(1em)

// --- Место составления ---
#grid(
  columns: (1fr, auto),
  align: (left, left),
  [Место составления: #v-place],
  [« #v-day » #v-month-gen 20#v-year2 г.]
)

#v(0.5em)

// --- Время опроса ---
#grid(
  columns: (auto, 1fr),
  row-gutter: 0.4em,
  [Опрос начат в ], [#v-start-h ч #v-start-m мин.],
  [Опрос окончен в ], [#v-end-h ч #v-end-m мин.],
)

#v(0.5em)

// --- Кто проводит опрос ---
#v-officer-post, #v-officer-title
#align(center)[
  #set text(size: 10pt)
  (должность, звание и ФИО проводящего опрос),
]

#v(1em)

// --- Анкета (п. 1–12) ---
#set par(first-line-indent: 0pt)

#item("1. Фамилия, имя, отчество", v-fio)
#item("2. Дата рождения", v-birth-date)
#item("3. Место рождения", v-birth-place)
#item("4. Место жительства и (или) регистрации", v-address)
#item("5. Номер контактного телефона:", v-phone)
#item("6. Гражданство", v-citizenship)
#item("7. Образование", v-education)
#item("8. Семейное положение, состав семьи", v-family, blanks: 2)
#item("9. Место работы или учебы", v-work, blanks: 2)
#item("10. Отношение к воинской обязанности", v-military)
#item("11. Наличие судимости", v-conviction)
#align(center)[
  #set text(size: 10pt)
  (по какой статье УК РФ)
]

#item("11. Паспорт или иной документ, удостоверяющий личность опрашиваемого", v-passport, blanks: 2)
#item("12. Иные данные о личности опрашиваемого", v-other, blanks: 3)

#set par(first-line-indent: 1.25cm)

// --- Разъяснение прав ---
#text(weight: "bold")[Перед началом опроса мне разъяснены мои права, предусмотренные статьей 23 конституции (Никто не обязан свидетельствовать против себя самого, своего супруга (супруги) и членов своей семьи), главой 15 статьей 49 пунктом 2 УПК:]

1) отказаться свидетельствовать против самого себя, своего супруга (своей супруги) и других близких родственников. При согласии дать показания я предупрежден о том, что мои показания могут быть использованы в качестве доказательств, в том числе и в случае моего последующего отказа от этих показаний;

2) давать показания на родном языке или языке, которым я владею;

3) пользоваться помощью переводчика бесплатно;

4) заявлять отвод переводчику, участвующему в допросе;

5) подтверждает достоверность заполненных с его данных в п. 1-11 настоящего протокола;

#text(weight: "bold")[Об уголовной ответственности за дачу заведомо ложных показаний по ст. 61 УК предупрежден.]

#v(0.8em)
#sigline("Опрашиваемый", v-sig)

#pagebreak()

// --- Вопросы и ответы (печатается первые v-qa-count пар) ---
#let qa-qs = (v-q1, v-q2, v-q3, v-q4, v-q5, v-q6, v-q7, v-q8, v-q9)
#let qa-as = (v-a1, v-a2, v-a3, v-a4, v-a5, v-a6, v-a7, v-a8, v-a9)
#for i in range(calc.min(calc.max(v-qa-count, 0), 9)) [#qablock(qa-qs.at(i), qa-as.at(i))]

// --- Заверение ---
Подписавший ниже гражданин подтверждает, что ответы на вопросы с его слов записаны верно, подтверждает, что дополнений к написанному не имеет.

#v(1em)
#sigline("Опрашиваемый", v-sig)

#v(2em)

// --- Подпись проводящего опрос ---
#grid(
  columns: (1.5fr, 1fr),
  [Проводящий опрос \ #v-officer-post \ #v-officer-title],
  align(bottom + right)[
    #if v-has-sign [
      #stack(
        dir: ltr,
        spacing: 5pt,
        block(width: v-sign-width)[#image("/sign.png")],
        [#v-officer-short]
      )
    ] else [
      #blankline
    ]
  ]
)
#align(right)[
  #set text(size: 10pt)
  (подпись)
]
