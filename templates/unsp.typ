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
#let v-date-dots = "01.10.2026"
#let v-doc-num = "0028-СП"
#let v-show-reply = false
#let v-reply-num = ""
#let v-reply-date = ""
#let v-poluch-day = "01"
#let v-poluch-month-gen = "октября"
#let v-poluch-year = "2026"
#let v-poluch-time = "00:00"
#let v-poluch-sign = "Иванов"
#let v-poluch-fio = "Иванов Иван Иванович"
#let v-addr-post = "Инспектору СР ДПС"
#let v-addr-rank = "Лейтенанту полиции"
#let v-addr-fio = "Иванову Ивану Ивановичу"
#let v-appeal = "Уважаемый"
#let v-greet-fio = "Иванов Иван Иванович"
#let v-points = "п. 3.2, 4.3 ВУ"
#let v-check-start = "01.10.2026"
#let v-postan-date = "01.10.2026"
#let v-sign-post = "Заместитель начальника отдела собственной безопасности Управления ГАИ"
#let v-sign-rank = "лейтенант полиции"
#let v-officer-short = "В.А. Щетков"
#let v-officer-phone = "5-6-5"
#let v-seal-l1 = "ОТДЕЛ"
#let v-seal-l2 = "СОБСТВЕННОЙ"
#let v-seal-l3 = "БЕЗОПАСНОСТИ"
#let v-seal-l4 = "* ГУ МВД *"
#let v-has-gerb = true
#let v-has-sign = true
#let v-has-seal-img = true
#let v-sign-width = 25mm
#let v-show-sign = true
#let v-show-seal = true
#let v-show-poluch = true
// </OSB-DATA>

// --- Шапка: организация слева, получатель справа ---
#grid(
  columns: (1.3fr, 1fr),
  gutter: 1cm,
  align(center + top)[
    #set par(first-line-indent: 0pt, justify: false)
    #if v-has-gerb [#block(width: 1.2cm)[#image("/gerb.svg")] #v(0.2em)]
    #set text(size: 9pt)
    ГУ МВД \
    ПО НИЖЕГОРОДСКОЙ ОБЛАСТИ \
    #v(0.3em)
    #set text(size: 10pt, weight: "bold")
    УПРАВЛЕНИЕ \
    МИНИСТЕРСТВА ВНУТРЕННИХ ДЕЛ \
    ПО АРЗАМАС \
    (ГАИ) \
    ОТДЕЛ СОБСТВЕННОЙ \
    БЕЗОПАСНОСТИ \
    #v(0.5em)
    #set text(size: 9pt, weight: "regular")
    г. Арзамас, ул. Севастопольская, д. 7, \
    Нижегородская область, \
    тел. #v-officer-phone \
    #v(0.5em)
    #v-date-dots № #v-doc-num
  ],
  align(left + top)[
    #set par(first-line-indent: 0pt, justify: false)
    #set text(size: 11pt)
    #v(3em)
    #v-addr-post \
    #v-addr-rank \
    #v-addr-fio \
    #v(1em)
    #align(right)[#text(size: 10pt)[Запрос в порядке п. 2 ч. 3 ст. 28 №1-ФЗ]]
  ]
)

#v(0.5em)

// --- Ответ на входящий ---
#if v-show-reply [
  #align(right)[на № #v-reply-num от #v-reply-date]
]

#v(1em)
#align(center)[#text(weight: "bold")[#v-appeal #v-greet-fio]]
#v(0.5em)

Настоящим уведомляю Вас о том, что в отношении Вас проводится служебная проверка в связи с полученной оперативной информацией о возможном нарушении Вами #v-points, а также о допущенных ими нарушениях служебной дисциплины и требований законодательства.

Проверка проводится с #v-check-start на основании постановления о назначении служебной проверки от #v-postan-date в соответствии со ст. 28 Федерального закона № 1-ФЗ «О полиции».

В настоящее время по указанным фактам проводятся проверочные мероприятия, направленные на установление всех обстоятельств произошедшего. О результатах проведенной проверки и принятом решении Вам будет сообщено.

В случае несогласия с принятым решением Вы вправе обжаловать его вышестоящему должностному лицу либо в суд в установленном законодательством порядке.

#v(2em)

// --- Подпись ---
#if v-show-sign [
  #grid(
    columns: (1.5fr, 1fr),
    [#v-sign-post],
    align(bottom + right)[
      #v-sign-rank \
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
  )
]

// --- Отметка о получении ---
#if v-show-poluch [
  #place(top + left, dx: 107mm, dy: 249mm)[
    #rotate(2.1deg)[
      #rect(
        width: 52mm,
        inset: 6pt,
        stroke: 0.6pt + red.darken(10%).transparentize(30%),
        fill: white.transparentize(58%),
        [
          #set text(size: 8.5pt, fill: red.darken(10%).transparentize(10%))
          #set par(first-line-indent: 0pt, justify: false)
          #align(center)[#text(weight: "bold")[ОТМЕТКА О ПОЛУЧЕНИИ]]
          #v(2pt)
          Дата: « #v-poluch-day » #v-poluch-month-gen #v-poluch-year г. \
          Время: #v-poluch-time \
          Подпись получившего: #v-poluch-sign \
          ФИО: #v-poluch-fio
        ]
      )
    ]
  ]
]

// --- Круглая печать ---
#if v-show-seal [
  #place(top + left, dx: 10mm, dy: 228mm)[
    #rotate(-8deg)[
      #if v-has-seal-img [
        #block(width: 42mm)[#image("/seal.png")]
      ] else [
        #box(width: 46mm, height: 46mm)[
          #place(center)[#circle(radius: 22mm, stroke: 1.4pt + blue.darken(30%))]
          #place(center)[#circle(radius: 16.5mm, stroke: 0.8pt + blue.darken(30%))]
          #place(center)[
            #align(center)[
              #set text(size: 6pt, fill: blue.darken(30%))
              #set par(first-line-indent: 0pt, leading: 0.5em)
              #v-seal-l1 \
              #v-seal-l2 \
              #v-seal-l3 \
              #v-seal-l4
            ]
          ]
        ]
      ]
    ]
  ]
]
