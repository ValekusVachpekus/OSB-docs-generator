#set text(font: ("Liberation Serif", "DejaVu Serif"), size: 12pt, lang: "ru")
#set page(
  margin: (top: 2cm, bottom: 2cm, left: 3cm, right: 1.5cm),
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

// <OSB-DATA>
#let v-day = "12"
#let v-month-gen = "октября"
#let v-month-num = "10"
#let v-year = "2026"
#let v-boss-to = "Начальнику отдела собственной безопасности ГУ МВД по Нижегородской области подполковнику полиции Леонову Д.С."
#let v-appl-fio = "Петров Пётр Петрович"
#let v-appl-birth = "1 января 1990 года"
#let v-appl-address = "г. Арзамас, ул. Ленина, д. 10, кв. 5"
#let v-appl-phone = "+7 (900) 000-00-00"
#let v-appl-passport = "Паспорт 22 00 000000, выдан ОВД г. Арзамаса 01.02.2010"
#let v-target = "инспектора ОБ ДПС лейтенанта полиции Иванова Ивана Ивановича"
#let v-event-date = "01.10.2026"
#let v-event-place = "г. Арзамас, ул. Советская, д. 1"
#let v-content = "1 октября 2026 года около 10 часов 00 минут указанный сотрудник остановил мой автомобиль и потребовал передать ему денежные средства за несоставление протокола. Данные обстоятельства могут подтвердить очевидцы."
#let v-request = "Прошу провести служебную проверку и привлечь виновных к ответственности"
#let v-appl-sign = "Петров"
#let v-num = "0025"
#let v-accept-time = "12:00"
#let v-brief = "нарушение служебной дисциплины сотрудником ОБ ДПС"
#let v-officer-post = "Заместитель начальника отдела собственной безопасности ГУ МВД"
#let v-officer-rank = "майор полиции"
#let v-officer-full = "Щетков Владислав Алексеевич"
#let v-officer-short = "В.А. Щетков"
#let v-officer-phone = "5-6-5"
#let v-has-gerb = true
#let v-has-sign = true
#let v-has-seal-img = true
#let v-sign-width = 25mm
#let v-show-accept = true
#let v-show-seal = true
// </OSB-DATA>

// --- Шапка документа ---
#align(center)[
  #if v-has-gerb [#block(width: 1.5cm)[#image("/gerb.svg")]]
  #v(0.2em)
  #set text(size: 10pt)
  #upper[Министерство внутренних дел] \
  #set text(size: 11pt, weight: "bold")
  ОТДЕЛ СОБСТВЕННОЙ БЕЗОПАСНОСТИ ГУ МВД \ ПО НИЖЕГОРОДСКОЙ ОБЛАСТИ

  #v(1em)
  #text(size: 18pt, weight: "bold", tracking: 0.4em)[ЗАЯВЛЕНИЕ]
]

#v(0.5em)

// --- Кому и от кого ---
#align(right)[
  #set par(first-line-indent: 0pt, justify: false)
  #set text(size: 11pt)
  #v-boss-to \
  #v(0.3em)
  от #v-appl-fio \
  #if v-appl-birth != "" [дата рождения: #v-appl-birth \ ]
  #if v-appl-address != "" [адрес: #v-appl-address \ ]
  #if v-appl-phone != "" [тел.: #v-appl-phone \ ]
  #if v-appl-passport != "" [паспорт: #v-appl-passport]
]

#v(0.5em)

Я, #v-appl-fio, сообщаю следующее:

В отношении: #v-target.
#if v-event-date != "" [Дата события: #v-event-date.]
#if v-event-place != "" [Место события: #v-event-place.]

#v-content

#v-request.

#v(0.5em)

// --- Предупреждение о ложном доносе (как в протоколе опроса) ---
#text(weight: "bold")[Об уголовной ответственности за заведомо ложный донос о совершении преступления по ст. 61 УК предупрежден.]

#v(0.8em)
#grid(
  columns: (1fr, 1fr),
  [«#v-day» #v-month-gen #v-year г.],
  [#if v-appl-sign == "" [#box(width: 100%, stroke: (bottom: 0.5pt + black))] else [#box(width: 100%, stroke: (bottom: 0.5pt + black))[#v-appl-sign / #v-appl-fio]]]
)
#align(right)[
  #set text(size: 10pt)
  (подпись заявителя)
]

#v(0.5em)

// --- Отметка о принятии ---
Заявление принято: #v-officer-post, #v-officer-rank #v-officer-full. Зарегистрировано в КУСП за №#v-num. Дата приёма: «#v-day» #v-month-gen #v-year г.#if v-accept-time != "" [ Время приёма: #v-accept-time.]

#if v-show-accept [
  #v(0.5em)
  #grid(
    columns: (1.5fr, 1fr),
    [#v-officer-post \ #v-officer-rank],
    align(bottom + right)[
      #rotate(-0.7deg)[
        #move(dx: 1.2pt, dy: -1pt)[
          #if v-has-sign [
            #stack(
              dir: ltr,
              spacing: 5pt,
              block(width: v-sign-width)[#image("/sign.png")],
              [#v-officer-short]
            )
          ] else [
            #v-officer-short
          ]
        ]
      ]
    ]
  )
]

#if v-show-seal [
  #place(top + left, dx: 10mm, dy: 228mm)[
    #rotate(-8deg)[
      #if v-has-seal-img [
        #block(width: 42mm)[#image("/seal.png")]
      ] else [
        #box(width: 42mm, height: 42mm)[
          #place(center)[#circle(radius: 20mm, stroke: 1.2pt + blue.darken(30%))]
          #place(center)[#circle(radius: 15mm, stroke: 0.8pt + blue.darken(30%))]
          #place(center)[
            #align(center)[
              #set text(size: 6pt, fill: blue.darken(30%))
              #set par(first-line-indent: 0pt, leading: 0.5em)
              ОТДЕЛ \
              СОБСТВЕННОЙ \
              БЕЗОПАСНОСТИ
            ]
          ]
        ]
      ]
    ]
  ]
]

// --- Талон-уведомление (корешок): формируется автоматически из данных заявления ---
#pagebreak()
#align(center)[
  #set par(first-line-indent: 0pt, justify: false)
  #rect(
    width: 100mm,
    inset: 8pt,
    stroke: 1pt + black,
    [
      #set text(size: 9.5pt)
      #set par(first-line-indent: 0pt, justify: false, leading: 0.5em)
      #align(center)[#text(size: 11pt, weight: "bold")[ТАЛОН-УВЕДОМЛЕНИЕ]]
      #v(2pt)
      #align(center)[№ #v-num/ТКТУ]
      #line(length: 100%, stroke: 0.5pt)
      #v(2pt)
      Принято от: #v-appl-fio
      #text(size: 7.5pt, fill: gray)[(Ф. И. О. заявителя)]
      #v(2pt)
      #line(length: 100%, stroke: 0.5pt)
      #v(2pt)
      Краткое содержание: #v-brief
      #v(2pt)
      #line(length: 100%, stroke: 0.5pt)
      #v(2pt)
      Заявление принято: #v-officer-post, #v-officer-rank #v-officer-full
      #text(size: 7.5pt, fill: gray)[(Ф. И. О., должность сотрудника)]
      #v(2pt)
      г. Арзамас, ул. Севастопольская, д. 7 \
      тел. #v-officer-phone
      #v(2pt)
      #line(length: 100%, stroke: 0.5pt)
      #v(2pt)
      «#v-day» #v-month-gen #v-year г.#if v-accept-time != "" [ в #v-accept-time]
      #v(4pt)
      #if v-show-accept [
        #if v-has-sign [#block(width: 12mm)[#image("/sign.png")]]
        #v-officer-short
      ] else [
        #box(width: 40mm, stroke: (bottom: 0.5pt), inset: (bottom: 2pt))
      ]
      #text(size: 7.5pt, fill: gray)[(подпись сотрудника, принявшего заявление; инициалы, фамилия)]
    ]
  )
]
