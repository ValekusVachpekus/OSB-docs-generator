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
#let v-day = "2"
#let v-month-gen = "апреля"
#let v-month-num = "04"
#let v-year = "2026"
#let v-city = "г. Арзамас"
#let v-num = "33"
#let v-target-title = "сотрудника ОБ ДПС ГАИ младшего сержанта полиции Иванова А.А."
#let v-supervision = "заместителя начальника отдела собственной безопасности ГУ МВД, майора полиции Щеткова Владислава Алексеевича, в ходе проведения надзорной деятельности за младшим сержантом полиции Молотовым А.А."
#let v-violation = "В соответствии с требованиями Федерального закона «О полиции» и внутреннего устава ОВД, а также в целях установления фактов, обстоятельств и причин возможного нарушения служебной дисциплины"
#let v-check-num = "33"
#let v-suspend-word = "отстранить"
#let v-suspend-target = "младшего сержанта полиции Молотова А.А."
#let v-notify-fio = "Молотова А.А."
#let v-officer-post = "Заместитель начальника отдела собственной безопасности ГУ МВД"
#let v-officer-rank = "майор полиции"
#let v-officer-full = "Щетков Владислав Алексеевич"
#let v-officer-short = "В.А. Щетков"
#let v-officer-phone = "5-6-5"
#let v-sogl-osb-post = "Начальник ОСБ ГУ МВД"
#let v-sogl-osb-rank = "подполковник полиции"
#let v-sogl-osb-day = "12"
#let v-sogl-osb-month-gen = "апреля"
#let v-sogl-osb-year = "2026"
#let v-sogl-osb-sign = "Леонов"
#let v-sogl-osb-fio = "Леонов Данила Сергеевич"
#let v-sogl-gu-post = "Начальник ГУ МВД"
#let v-sogl-gu-rank = "генерал-лейтенант полиции"
#let v-sogl-gu-day = "12"
#let v-sogl-gu-month-gen = "апреля"
#let v-sogl-gu-year = "2026"
#let v-sogl-gu-sign = "Егоров"
#let v-sogl-gu-fio = "Егоров Дионис Иванович"
#let v-vruch-day = "12"
#let v-vruch-month-gen = "апреля"
#let v-vruch-year = "2026"
#let v-vruch-time = "00:00"
#let v-vruch-sign = "ПОДПИСЬ"
#let v-vruch-fio = "Иванов Иван Иванович"
#let v-has-gerb = true
#let v-has-sign = true
#let v-sign-width = 25mm
#let v-show-bottom-sign = true
#let v-show-sogl-osb = true
#let v-show-sogl-gu = true
#let v-show-vruch = true
// </OSB-DATA>

// Шапка документа
#align(center)[
  #if v-has-gerb [#block(width: 1.5cm)[#image("/gerb.svg")]]
  #v(0.2em)
  #set text(size: 10pt)
  #upper[Министерство внутренних дел Российской Федерации] \
  #set text(size: 11pt, weight: "bold")
  ОТДЕЛ СОБСТВЕННОЙ БЕЗОПАСНОСТИ ГУ МВД \ ПО НИЖЕГОРОДСКОЙ ОБЛАСТИ

  #v(1em)
  #text(size: 18pt, weight: "bold", tracking: 0.4em)[ПОСТАНОВЛЕНИЕ]
]

#v(0.5em)

// Линия даты и номера
#grid(
  columns: (1fr, 1fr, 1fr),
  align: (left, center, right),
  [« #v-day » #v-month-gen #v-year г.],
  [#v-city],
  [№ #v-num]
)

#v(1.5em)

// Блок заголовка и штампа
#grid(
  columns: (1.2fr, 1fr),
  gutter: 1cm,
  align(left + top)[
    #set par(first-line-indent: 0pt, justify: false)
    #set text(size: 11pt)
    О назначении и проведении служебной проверки в отношении #v-target-title
  ],
  rotate(-1.5deg)[
    #move(dx: 5pt, dy: -10pt)[
      #rect(
        width: 100%,
        inset: 6pt,
        stroke: 0.7pt + blue.darken(20%),
        fill: white.transparentize(40%),
        [
          #set align(left)
          #set text(size: 7.5pt, fill: blue.darken(30%))
          #align(center)[#text(size: 10pt, weight: "bold")[КОПИЯ ВЕРНА]]
          #v(4pt)
          #v-officer-post, #v-officer-rank #v-officer-full

          #v(8pt)
          #grid(
            columns: (1fr, 1.2fr),
            align(bottom)[«\_#v-day\_» \_#v-month-num\_ #v-year г.],
            align(bottom + right)[
              #if v-has-sign [
                #stack(
                  dir: ltr,
                  spacing: 2pt,
                  block(width: 1.4cm)[#image("/sign.png")],
                  [#v-officer-short]
                )
              ] else [
                #v-officer-short
              ]
            ]
          )
        ]
      )
    ]
  ]
)

#v(1.5em)

// Преамбула
#v-supervision
#v(1em)
#align(center)[#text(weight: "bold")[У С Т А Н О В И Л:]]
#v(0.5em)

#v-violation —
#v(1em)
#align(center)[#text(weight: "bold")[П О С Т А Н О В И Л:]]
#v(0.5em)

#set enum(indent: 1.25cm)
+ Назначить проведение служебной проверки № #v-check-num по факту возможного нарушения служебной дисциплины #v-notify-fio.
+ На время проведения служебной проверки #v-suspend-target #v-suspend-word от исполнения должностных обязанностей.
+ Уведомить #v-notify-fio о назначении в отношении него служебной проверки

#v(3em)
// Подпись внизу документа
#if v-show-bottom-sign [
  #grid(
    columns: (1.5fr, 1fr),
    [#v-officer-post \ #v-officer-rank],
    align(bottom+right)[
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

#if v-show-sogl-osb [
  #place(top + left, dx: 1mm, dy: 245mm)[
    #rotate(-1.3deg)[
      #rect(
        width: 50mm,
        inset: 6pt,
        stroke: 0.6pt + red.darken(15%).transparentize(35%),
        fill: white.transparentize(75%),
        [
          #set text(size: 8.5pt, fill: red.darken(15%).transparentize(12%))
          #set par(first-line-indent: 0pt, justify: false)
          #align(center)[#text(weight: "bold")[СОГЛАСОВАНО]]
          #v(2pt)
          #v-sogl-osb-post \
          #v-sogl-osb-rank \
          «#v-sogl-osb-day» #v-sogl-osb-month-gen #v-sogl-osb-year г. \
          Подпись: #v-sogl-osb-sign \
          ФИО: #v-sogl-osb-fio
        ]
      )
    ]
  ]
]

#if v-show-sogl-gu [
  #place(top + left, dx: 56mm, dy: 246mm)[
    #rotate(-0.3deg)[
      #rect(
        width: 50mm,
        inset: 6pt,
        stroke: 0.6pt + red.darken(15%).transparentize(35%),
        fill: white.transparentize(75%),
        [
          #set text(size: 8.5pt, fill: red.darken(15%).transparentize(12%))
          #set par(first-line-indent: 0pt, justify: false)
          #align(center)[#text(weight: "bold")[СОГЛАСОВАНО]]
          #v(2pt)
          #v-sogl-gu-post \
          #v-sogl-gu-rank \
          «#v-sogl-gu-day» #v-sogl-gu-month-gen #v-sogl-gu-year г. \
          Подпись: #v-sogl-gu-sign \
          ФИО: #v-sogl-gu-fio
        ]
      )
    ]
  ]
]

#if v-show-vruch [
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
          #align(center)[#text(weight: "bold")[ОТМЕТКА О ВРУЧЕНИИ]]
          #v(2pt)
          Дата: « #v-vruch-day » #v-vruch-month-gen #v-vruch-year г. \
          Время: #v-vruch-time \
          Подпись получившего: #v-vruch-sign \
          ФИО: #v-vruch-fio
        ]
      )
    ]
  ]
]
