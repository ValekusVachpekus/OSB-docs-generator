#set text(font: "Liberation Serif", size: 12pt, lang: "ru")
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

// Функция для создания пустой линии (поля для заполнения)
#let field(width) = box(width: width, stroke: (bottom: 0.5pt), inset: (bottom: -2pt))

// Шапка документа
#align(center)[
  #block(width: 1.5cm)[#image("gerb.svg")] 
  #v(0.2em)
  #set text(size: 10pt)
  #upper[Министерство внутренних дел Российской Федерации] \
  #set text(size: 11pt, weight: "bold")
  ОТДЕЛ СОБСТВЕННОЙ БЕЗОПАСНОСТИ ГУ МВД РОССИИ \ ПО НИЖЕГОРОДСКОЙ ОБЛАСТИ
  
  #v(1em)
  #text(size: 18pt, weight: "bold", tracking: 0.4em)[ПРИКАЗ]
]

#v(0.5em)

// Линия даты и номера
#grid(
  columns: (1fr, 1fr, 1fr),
  align: (left, center, right),
  [« #field(20pt) » #field(60pt) 2026 г.],
  [г. Арзамас],
  [№ #field(50pt)]
)

#v(1.5em)

#grid(
  columns: (1.2fr, 1fr),
  gutter: 1cm,
  align(left + top)[
    #set par(first-line-indent: 0pt, justify: false)
    #set text(size: 10pt)
    О временном отстранении от службы сотрудника #field(100%) в связи с проведением служебной проверки.
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
          Заместитель начальника отдела собственной безопасности главного управления МВД, Подполковник полиции Щетков Владислав Алексеевич
          
          #v(8pt)
          #grid(
            columns: (1fr, 1.2fr),
            align(bottom)[«_ #field(10pt) _» _ #field(20pt) _ 2026 г.],
            align(bottom + right)[
               #text(size: 8pt)[B.A. Щетков]
            ]
          )
        ]
      )
    ]
  ]
)

#v(1.2em)

В ходе проведения служебной проверки, мною, заместителем начальника ОСБ подполковником полиции Щетковым В.А., были выявлены признаки дисциплинарного правонарушения со стороны #field(100%).

#v(0.5em)
#align(center)[#text(weight: "bold")[У С Т А Н О В И Л:]]
#v(0.5em)

Вышеуказанные действия сотрудника нарушают требования статьи #field(40pt) Внутреннего Устава ОВД и .... 

На основании ст. 18 ч. 4 п. 8 Федерального закона "О полиции", служебной проверки №33, а также в целях обеспечения объективности проведения служебной проверки —

#v(0.5em)
#align(center)[#text(weight: "bold")[П Р И К А З Ы В А Ю:]]
#v(0.5em)

#set enum(indent: 1.25cm)
+ Отстранить #field(100%) от исполнения должностных обязанностей на период проведения служебной проверки № #field(5%).
+ Обязать отстраняемого сотрудника сдать табельное оружие, спецсредства и служебное удостоверение на временное хранение в дежурную часть управления.
+ Запретить указанному сотруднику использование служебного транспорта исполнение служебных обязанностей до момента окончания проверки.
+ Контроль за исполнением настоящего приказа оставляю за собой.

#v(3em)
// Подпись внизу документа
#grid(
  columns: (1.5fr, 1fr),
  [Заместитель начальника ОСБ ГУ МВД \ майор полиции],
  align(bottom+right)[
    #rotate(-0.7deg)[
      #move(dx: 1.2pt, dy: -1pt)[
        #stack(
          dir: ltr,
          spacing: 5pt,
          block(width: 2.5cm)[#image("canvas1.png")],
          [ B.A. Щетков]
        )
      ]
    ]
  ]
)

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
        Начальник ОСБ ГУ МВД \
        подполковник полиции \
        «12» апреля 2026 г. \
        Подпись: Леонов \
        ФИО: Леонов Данила Сергеевич 
      ]
    )
  ]
]

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
        Начальник ГУ МВД \
        генерал-лейтенант полиции \
        «12» апреля 2026 г. \
        Подпись: Егоров \
        ФИО: Егоров Дионис Иванович 
      ]
    )
  ]
]

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
        Дата: « 12 » апреля 2026 г. \
        Время: 00:00 \
        Подпись получившего: ПОДПИСЬ \
        ФИО: Иванов Иван Иванович
      ]
    )
  ]
]

